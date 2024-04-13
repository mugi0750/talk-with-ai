import { config } from 'dotenv';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';
import { OpenAI } from 'openai';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { readFileSync, createWriteStream } from 'fs';
import { mkdtemp, unlink } from 'fs/promises';
import child_process from 'child_process';

config();

(async () => {
  try {
    // AWS認証情報の設定
    const awsConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: 'ap-northeast-1',
    };

    // S3バケット名とアップロードファイル名
    const bucketName = process.env.AWS_TRANSCRIBE_MP3_BUCKET;
    const fileName = Date.now();

    // S3オブジェクトの作成
    const client = new S3Client(awsConfig);

    // MP3ファイルを読み込み
    const fileContent = readFileSync('output.mp3');

    // S3にファイルをアップロード
    const params = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${fileName}.mp3`,
      Body: fileContent,
    });

    const data = await client.send(params);

    const transcribeClient = new TranscribeClient({
      region: 'ap-northeast-1',
    });

    // Transcribeジョブの設定
    const jobParams = {
      TranscriptionJobName: `${fileName}_job`,
      LanguageCode: process.env.LANGUAGE_CODE,
      MediaFormat: 'mp3',
      Media: {
        MediaFileUri: `https://s3.amazonaws.com/${process.env.AWS_TRANSCRIBE_MP3_BUCKET}/${fileName}.mp3`,
      },
    };

    // ジョブの作成
    const startJobCommand = new StartTranscriptionJobCommand(jobParams);
    const startJobResponse = await transcribeClient.send(startJobCommand);

    // ジョブの監視
    const jobId = startJobResponse.TranscriptionJob.TranscriptionJobName;
    let jobStatus = '';
    let getJobResponse;
    while (jobStatus !== 'COMPLETED') {
      const getJobCommand = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobId,
      });
      getJobResponse = await transcribeClient.send(getJobCommand);
      jobStatus = getJobResponse.TranscriptionJob.TranscriptionJobStatus;
      if (jobStatus === 'IN_PROGRESS') {
        console.log('音声を処理しています...');
      } else if (jobStatus === 'FAILED') {
        console.error('Transcription job failed:', getJobResponse.TranscriptionJob.FailureReason);
        break;
      } else {
        // ジョブが完了したら結果を取得
        const transcript_url = getJobResponse.TranscriptionJob.Transcript.TranscriptFileUri;
        const response = await fetch(transcript_url);
        const transcription = await response.json();
        const text = transcription.results.transcripts.map(({ transcript }) => transcript).join('\n');
        console.log('You =>', text);

        const apiKey = process.env.OPEN_AI_APIKEY;
        const openai = new OpenAI({ apiKey });

        const chatCompletion = await openai.chat.completions.create({
          messages: [{ role: 'user', content: text }],
          model: 'gpt-3.5-turbo',
        });

        console.log('AI =>', chatCompletion.choices[0].message.content);

        const pollyClient = new PollyClient({ region: 'ap-northeast-1' });
        if (process.env.LANGUAGE === 'japanese') {

        }
        const command = new SynthesizeSpeechCommand({
          Text: chatCompletion.choices[0].message.content,
          VoiceId: process.env.SPEAKER,
          OutputFormat: 'mp3',
          SampleRate: '8000',
        });
        const { AudioStream: audioStream } = await pollyClient.send(command);

        const tmpdir = await mkdtemp('/tmp/chatgpi-cli-sample-node-');
        const file_path = `${tmpdir}/test.mp3`;

        await new Promise((resolve) =>
          audioStream
            .pipe(createWriteStream(file_path))
            .on('close', () => resolve(true))
        );

        await new Promise((resolve) =>
          child_process.exec(`afplay ${file_path}`, () => resolve(true))
        );

        await unlink(file_path);

        break; // ジョブが完了したらループを抜ける
      }

      // 5秒ごとにポーリング
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (err) {
    console.error('エラーが発生しました。\n各種認証情報、言語コード、音声モデルが正しいことを確認してください。\n音声モデルにつきましては、Amazon Polly公式の最新サポートモデルが一部使用できない場合がございます。');
  }
})();

# AIと話す

## セットアップ

```
cd talk-with-ai
npm install
cp .env.example .env
```

### .env詳細

```sh
AWS_ACCESS_KEY_ID=         // アクセスキー
AWS_SECRET_ACCESS_KEY=     // シークレットアクセスキー
AWS_TRANSCRIBE_MP3_BUCKET= // S3バケット名
OPEN_AI_APIKEY=            // OpenAIのAPIキー
LANGUAGE_CODE=en-US        // 入力に使う言語（デフォルト：英語）英語以外を利用したい場合はこちら：https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html
SPEAKER=Joanna             // AI音声のモデル Joanna以外をモデルにしたい場合はこちら（一部サポートされていないモデルもあります）：https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
```

## 使い方

1. ターミナルに以下を入力して実行すると、音声聞き取りが開始されます。

```
./runScripts.sh
```

2. 話終わったらEnterキーを押してください。
3. しばらく処理を待ちます。
4. 「You =>, AI =>」が表示されて、返答を音声で再生します。
5. 終

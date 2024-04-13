const ffmpeg = require('fluent-ffmpeg')

const inputFilePath = 'input.wav'
const outputFilePath = 'output.mp3'

ffmpeg(inputFilePath)
  .toFormat('mp3')
  .on('end', () => {
    // console.log('変換が完了しました。');
  })
  .on('error', (err) => {
    console.error('エラーが発生しました:', err)
  })
  .save(outputFilePath)

const recorder = require('node-record-lpcm16')
const readline = require('readline')
const { createWriteStream } = require('fs')

console.log('音声を聞き取っています。話終わったらEnterキーを押してください。');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const outputFile = 'input.wav'

const recording = recorder.record({
  sampleRate: 4000,
  verbose: true,
})

const fileStream = recording.stream().pipe(createWriteStream(outputFile))

// Ctrl+Cで録音を停止
process.on('SIGINT', () => {
  recording.stop()
  console.log('音声メッセージを送信しました。')
  fileStream.end()
})

// Enterキーを押して録音を停止
rl.on('line', () => {
  stopRecording()
})

function stopRecording() {
  recording.stop()
  console.log('音声メッセージを送信しました。')
  fileStream.end()
  rl.close()
}

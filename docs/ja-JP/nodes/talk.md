---
read_when:
    - macOS/iOS/AndroidでTalkモードを実装する
    - 音声/TTS/割り込み動作の変更
summary: 'トークモード: ローカル STT/TTS とリアルタイム音声による継続的な音声会話'
title: トークモード
x-i18n:
    generated_at: "2026-07-03T00:52:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

Talk モードには 2 つのランタイム形状があります。

- ネイティブ macOS/iOS/Android Talk は、ローカル音声認識、Gateway チャット、`talk.speak` TTS を使用します。ノードは `talk` capability を通知し、対応する `talk.*` コマンドを宣言します。
- iOS Talk は、`webrtc` を選択する、または transport を省略する OpenAI realtime 設定に対して、クライアント所有の WebRTC を使用します。明示的な `gateway-relay`、`provider-websocket`、および OpenAI 以外の realtime 設定は Gateway 所有の relay に残ります。realtime 以外の設定はネイティブ音声ループを使用します。
- Browser Talk は、クライアント所有の `webrtc` および `provider-websocket` セッションには `talk.client.create` を使用し、Gateway 所有の `gateway-relay` セッションには `talk.session.create` を使用します。`managed-room` は Gateway ハンドオフとウォーキートーキールーム用に予約されています。
- Android Talk は、`talk.realtime.mode: "realtime"` と `talk.realtime.transport: "gateway-relay"` により、Gateway 所有の realtime relay セッションを選択できます。それ以外の場合は、ネイティブ音声認識、Gateway チャット、`talk.speak` のままです。
- 文字起こし専用クライアントは、アシスタントの音声応答なしでキャプションやディクテーションが必要な場合に、`talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` を使用し、その後 `talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用します。

ネイティブ Talk は継続的な音声会話ループです。

1. 音声を待ち受ける
2. アクティブなセッションを通じて文字起こしをモデルに送信する
3. 応答を待つ
4. 設定された Talk provider（`talk.speak`）経由で読み上げる

クライアント所有の realtime Talk は、provider tool call を `talk.client.toolCall` 経由で転送します。これらのクライアントは realtime consult のために `chat.send` を直接呼び出しません。
realtime consult がアクティブな間、Talk クライアントは `talk.client.steer` または
`talk.session.steer` を使用して、発話入力を `status`、`steer`、`cancel`、または
`followup` に分類できます。受け入れられた steering はアクティブな埋め込み run にキューされ、拒否された
steering は `no_active_run`、`not_streaming`、
または `compacting` などの構造化された理由を返します。

文字起こし専用 Talk は、realtime および STT/TTS セッションと同じ共通 Talk イベントエンベロープを出力しますが、`mode: "transcription"` と `brain: "none"` を使用します。これはキャプション、ディクテーション、観察専用の音声キャプチャ向けです。1 回限りでアップロードされるボイスメモは引き続き media/audio パスを使用します。

## 動作（macOS）

- Talk モードが有効な間は **常時表示オーバーレイ**。
- **Listening → Thinking → Speaking** のフェーズ遷移。
- **短い一時停止**（無音ウィンドウ）で、現在の文字起こしが送信されます。
- 返信は **WebChat に書き込まれます**（入力した場合と同じ）。
- **発話による割り込み**（デフォルトでオン）: アシスタントが話している間にユーザーが話し始めると、再生を停止し、次のプロンプト用に割り込みタイムスタンプを記録します。

## 返信内の音声ディレクティブ

アシスタントは、音声を制御するために返信の先頭に **単一の JSON 行** を付けることができます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみ。
- 不明なキーは無視されます。
- `once: true` は現在の返信にのみ適用されます。
- `once` がない場合、その音声は Talk モードの新しいデフォルトになります。
- JSON 行は TTS 再生前に取り除かれます。

対応キー:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 設定（`~/.openclaw/openclaw.json`）

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

デフォルト:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定の場合、Talk は文字起こしを送信する前にプラットフォーム既定の一時停止ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）
- `provider`: アクティブな Talk provider を選択します。macOS ローカル再生パスには `elevenlabs`、`mlx`、または `system` を使用します。
- `providers.<provider>.voiceId`: ElevenLabs では `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` にフォールバックします（または API key が利用可能な場合は最初の ElevenLabs voice）。
- `providers.elevenlabs.modelId`: 未設定の場合は `eleven_v3` がデフォルトです。
- `providers.mlx.modelId`: 未設定の場合は `mlx-community/Soprano-80M-bf16` がデフォルトです。
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` にフォールバックします（または利用可能な場合は Gateway shell profile）。
- `consultThinkingLevel`: realtime `openclaw_agent_consult` 呼び出しの背後にある完全な OpenClaw agent run に対する任意の thinking level override。
- `consultFastMode`: realtime `openclaw_agent_consult` 呼び出しに対する任意の fast-mode override。
- `realtime.provider`: アクティブな realtime voice provider を選択します。WebRTC には `openai`、provider WebSocket には `google`、または Gateway relay 経由の bridge-only provider を使用します。
- `realtime.providers.<provider>` は provider 所有の realtime config を保存します。ブラウザーは一時的または制約付きのセッション認証情報のみを受け取り、標準の API key は受け取りません。
- `realtime.providers.openai.voice`: 組み込みの OpenAI Realtime voice id。現在の `gpt-realtime-2` voice は `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar` です。最高品質には `marin` と `cedar` が推奨されます。
- `realtime.transport`: `webrtc` は iOS とブラウザーでクライアント所有の OpenAI WebRTC を使用します。`provider-websocket` はブラウザー所有ですが、iOS では Gateway relay に残ります。`gateway-relay` は provider audio を Gateway 上に保持します。Android はこの transport でのみ realtime を使用し、それ以外ではネイティブ STT/TTS ループを維持します。
- `realtime.brain`: `agent-consult` は realtime tool call を Gateway policy 経由でルーティングします。`direct-tools` は従来の direct-tool 互換動作です。`none` は文字起こしまたは外部 orchestration 用です。
- `realtime.consultRouting`: `provider-direct` は、provider が `openclaw_agent_consult` をスキップした場合に provider の直接返信を保持します。`force-agent-consult` は、Gateway relay が確定済みユーザー文字起こしを代わりに OpenClaw 経由でルーティングするようにします。
- `realtime.instructions`: provider 向け system instructions を OpenClaw の組み込み realtime prompt に追加します。音声スタイルとトーンに使用します。OpenClaw はデフォルトの `openclaw_agent_consult` guidance を維持します。
- `talk.catalog` は、各 provider の有効な mode、transport、brain strategy、realtime audio format、capability flag を公開し、ファーストパーティ Talk クライアントが未対応の組み合わせを避けられるようにします。
- Streaming transcription provider は `talk.catalog.transcription` 経由で検出されます。現在の Gateway relay は、専用の Talk transcription config surface が追加されるまで Voice Call streaming provider config を使用します。
- `speechLocale`: iOS/macOS 上のオンデバイス Talk 音声認識用の任意の BCP 47 locale id。デバイスのデフォルトを使用するには未設定のままにします。
- `outputFormat`: macOS/iOS では `pcm_44100`、Android では `pcm_24000` がデフォルトです（MP3 streaming を強制するには `mp3_*` を設定）

## macOS UI

- メニューバー切り替え: **Talk**
- 設定タブ: **Talk Mode** グループ（voice id + 割り込み切り替え）
- オーバーレイ:
  - **Listening**: 雲がマイクレベルに合わせて脈動
  - **Thinking**: 沈み込むアニメーション
  - **Speaking**: 放射状のリング
  - 雲をクリック: 読み上げを停止
  - X をクリック: Talk モードを終了

## Android UI

- Voice タブ切り替え: **Talk**
- 手動 **Mic** と **Talk** は、相互に排他的なランタイムキャプチャモードです。
- 手動 Mic と realtime Talk は、接続済みの Bluetooth Classic または BLE ヘッドセットマイクを優先します。切断された場合、アプリは別のヘッドセット入力を要求するか、Android にデフォルトマイクを使用させます。キャプチャを停止するとデフォルトマイク設定が復元されます。
- 手動 Mic は、アプリがフォアグラウンドを離れるか、ユーザーが Voice タブを離れると停止します。
- Talk Mode は、オフに切り替えられるか Android ノードが切断されるまで実行され続け、アクティブな間は Android の microphone foreground-service type を使用します。

## 注記

- Speech + Microphone 権限が必要です。
- ネイティブ Talk はアクティブな Gateway セッションを使用し、response event が利用できない場合にのみ履歴 polling にフォールバックします。
- クライアント所有の realtime Talk は、provider 所有セッションに `chat.send` を公開する代わりに、`openclaw_agent_consult` に `talk.client.toolCall` を使用します。
- 文字起こし専用 Talk は `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用します。クライアントは部分/最終文字起こし更新のために `talk.event` を購読します。
- gateway は、アクティブな Talk provider を使用して `talk.speak` 経由で Talk playback を解決します。Android は、その RPC が利用できない場合にのみローカル system TTS にフォールバックします。
- macOS ローカル MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` helper を使用し、または `PATH` 上の実行可能ファイルを使用します。開発中にカスタム helper binary を指すには `OPENCLAW_MLX_TTS_BIN` を設定します。
- `eleven_v3` の `stability` は `0.0`、`0.5`、または `1.0` に検証されます。他のモデルは `0..1` を受け入れます。
- `latency_tier` は設定時に `0..4` に検証されます。
- Android は低遅延 AudioTrack streaming 用に `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` の output format に対応します。

## 関連

- [Voice wake](/ja-JP/nodes/voicewake)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

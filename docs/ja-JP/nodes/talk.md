---
read_when:
    - macOS/iOS/AndroidでTalkモードを実装する
    - 音声/TTS/割り込み動作の変更
summary: 'トークモード: ローカル STT/TTS とリアルタイム音声にまたがる継続的な音声会話'
title: 会話モード
x-i18n:
    generated_at: "2026-05-06T05:11:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Talkモードには2つの実行時形態があります。

- ネイティブのmacOS/iOS/Android Talkは、ローカル音声認識、Gatewayチャット、`talk.speak` TTSを使用します。ノードは`talk`機能をアドバタイズし、対応する`talk.*`コマンドを宣言します。
- ブラウザーTalkは、クライアント所有の`webrtc`および`provider-websocket`セッションには`talk.client.create`を使用し、Gateway所有の`gateway-relay`セッションには`talk.session.create`を使用します。`managed-room`はGatewayハンドオフとトランシーバールーム用に予約されています。
- 文字起こし専用クライアントは、アシスタントの音声応答なしでキャプションやディクテーションが必要な場合に、`talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`を使用し、その後`talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close`を使用します。

ネイティブTalkは継続的な音声会話ループです。

1. 音声を聞き取る
2. アクティブセッションを通じて文字起こしをモデルに送信する
3. 応答を待つ
4. 設定されたTalkプロバイダー（`talk.speak`）経由で読み上げる

ブラウザーのリアルタイムTalkは、プロバイダーのツール呼び出しを`talk.client.toolCall`経由で転送します。ブラウザークライアントは、リアルタイム相談で`chat.send`を直接呼び出しません。

文字起こし専用Talkは、リアルタイムおよびSTT/TTSセッションと同じ共通Talkイベントエンベロープを出力しますが、`mode: "transcription"`と`brain: "none"`を使用します。これはキャプション、ディクテーション、観察専用の音声キャプチャ向けです。1回限りでアップロードされるボイスメモは引き続きメディア/音声パスを使用します。

## 動作（macOS）

- Talkモードが有効な間は**常時表示オーバーレイ**。
- **聞き取り中 → 考え中 → 発話中**のフェーズ遷移。
- **短い一時停止**（無音ウィンドウ）で、現在の文字起こしが送信されます。
- 返信は**WebChatに書き込まれます**（入力した場合と同じ）。
- **発話による割り込み**（デフォルトでオン）：アシスタントが話している間にユーザーが話し始めた場合、再生を停止し、次のプロンプト用に割り込みタイムスタンプを記録します。

## 返信内の音声ディレクティブ

アシスタントは、音声を制御するために返信の先頭に**単一のJSON行**を付けることができます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみ。
- 不明なキーは無視されます。
- `once: true`は現在の返信にのみ適用されます。
- `once`がない場合、その音声がTalkモードの新しいデフォルトになります。
- JSON行はTTS再生前に取り除かれます。

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
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

デフォルト:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定の場合、Talkは文字起こしを送信する前にプラットフォーム既定の一時停止ウィンドウを維持します（`macOSとAndroidでは700 ms、iOSでは900 ms`）
- `provider`: アクティブなTalkプロバイダーを選択します。macOSローカル再生パスでは`elevenlabs`、`mlx`、または`system`を使用します。
- `providers.<provider>.voiceId`: ElevenLabsでは`ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`にフォールバックします（またはAPIキーが利用可能な場合は最初のElevenLabs音声）。
- `providers.elevenlabs.modelId`: 未設定の場合は`eleven_v3`がデフォルトです。
- `providers.mlx.modelId`: 未設定の場合は`mlx-community/Soprano-80M-bf16`がデフォルトです。
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY`にフォールバックします（または利用可能な場合はGatewayシェルプロファイル）。
- `realtime.provider`: アクティブなブラウザー/サーバーのリアルタイム音声プロバイダーを選択します。WebRTCには`openai`、プロバイダーWebSocketには`google`、またはGatewayリレー経由のブリッジ専用プロバイダーを使用します。
- `realtime.providers.<provider>`は、プロバイダー所有のリアルタイム設定を保存します。ブラウザーが受け取るのは一時的または制約付きのセッション認証情報のみで、通常のAPIキーは受け取りません。
- `realtime.brain`: `agent-consult`はリアルタイムツール呼び出しをGatewayポリシー経由でルーティングします。`direct-tools`は所有者専用の互換動作です。`none`は文字起こしまたは外部オーケストレーション向けです。
- `talk.catalog`は、ファーストパーティのTalkクライアントが未対応の組み合わせを避けられるように、各プロバイダーの有効なモード、トランスポート、ブレイン戦略、リアルタイム音声形式、機能フラグを公開します。
- ストリーミング文字起こしプロバイダーは`talk.catalog.transcription`経由で検出されます。現在のGatewayリレーは、専用のTalk文字起こし設定サーフェスが追加されるまで、Voice Callストリーミングプロバイダー設定を使用します。
- `speechLocale`: iOS/macOSのオンデバイスTalk音声認識用の任意のBCP 47ロケールID。デバイスのデフォルトを使用するには未設定のままにします。
- `outputFormat`: macOS/iOSでは`pcm_44100`、Androidでは`pcm_24000`がデフォルトです（MP3ストリーミングを強制するには`mp3_*`を設定します）

## macOS UI

- メニューバー切り替え: **Talk**
- 設定タブ: **Talk Mode**グループ（音声ID + 割り込み切り替え）
- オーバーレイ:
  - **聞き取り中**: クラウドがマイクレベルに合わせて脈動
  - **考え中**: 沈み込むアニメーション
  - **発話中**: 広がるリング
  - クラウドをクリック: 発話を停止
  - Xをクリック: Talkモードを終了

## Android UI

- Voiceタブ切り替え: **Talk**
- 手動の**Mic**と**Talk**は、相互排他的な実行時キャプチャモードです。
- 手動Micは、アプリがフォアグラウンドを離れるか、ユーザーがVoiceタブを離れると停止します。
- Talkモードは、オフに切り替えられるかAndroidノードが切断されるまで実行を続け、アクティブな間はAndroidのマイク用フォアグラウンドサービスタイプを使用します。

## 注記

- SpeechとMicrophoneの権限が必要です。
- ネイティブTalkはアクティブなGatewayセッションを使用し、応答イベントが利用できない場合にのみ履歴ポーリングにフォールバックします。
- ブラウザーのリアルタイムTalkは、プロバイダー所有のブラウザーセッションに`chat.send`を公開する代わりに、`openclaw_agent_consult`に`talk.client.toolCall`を使用します。
- 文字起こし専用Talkは`talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close`を使用します。クライアントは部分/最終文字起こしの更新を受け取るために`talk.event`を購読します。
- Gatewayは、アクティブなTalkプロバイダーを使用して`talk.speak`経由でTalk再生を解決します。Androidは、そのRPCが利用できない場合にのみローカルシステムTTSにフォールバックします。
- macOSローカルMLX再生は、存在する場合はバンドルされた`openclaw-mlx-tts`ヘルパーを使用し、または`PATH`上の実行可能ファイルを使用します。開発中にカスタムヘルパーバイナリを指すには`OPENCLAW_MLX_TTS_BIN`を設定します。
- `eleven_v3`の`stability`は`0.0`、`0.5`、または`1.0`に検証されます。その他のモデルは`0..1`を受け入れます。
- `latency_tier`は、設定されている場合`0..4`に検証されます。
- Androidは、低遅延AudioTrackストリーミング向けに`pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100`出力形式に対応しています。

## 関連

- [Voice wake](/ja-JP/nodes/voicewake)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

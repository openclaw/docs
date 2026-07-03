---
read_when:
    - macOS/iOS/Android で Talk モードを実装する
    - 音声/TTS/割り込み動作の変更
summary: 'トークモード: ローカル STT/TTS とリアルタイム音声をまたぐ継続的な音声会話'
title: トークモード
x-i18n:
    generated_at: "2026-07-03T09:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

トークモードには2つのランタイム形態があります。

- ネイティブ macOS/iOS/Android トークは、ローカル音声認識、Gateway チャット、`talk.speak` TTS を使用します。ノードは `talk` capability を公開し、対応する `talk.*` コマンドを宣言します。
- iOS トークは、`webrtc` を選択するか transport を省略する OpenAI リアルタイム設定に対して、クライアント所有の WebRTC を使用します。明示的な `gateway-relay`、`provider-websocket`、および OpenAI 以外のリアルタイム設定は Gateway 所有のリレーのままです。非リアルタイム設定はネイティブ音声ループを使用します。
- ブラウザートークは、クライアント所有の `webrtc` および `provider-websocket` セッションには `talk.client.create` を使用し、Gateway 所有の `gateway-relay` セッションには `talk.session.create` を使用します。`managed-room` は Gateway ハンドオフとトランシーバールーム用に予約されています。
- Android トークは、`talk.realtime.mode: "realtime"` と `talk.realtime.transport: "gateway-relay"` で Gateway 所有のリアルタイムリレーセッションを選択できます。それ以外の場合は、ネイティブ音声認識、Gateway チャット、`talk.speak` のままです。
- 文字起こしのみのクライアントは、アシスタントの音声応答なしでキャプションやディクテーションが必要な場合に、`talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` を使用し、その後 `talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用します。

ネイティブトークは、継続的な音声会話ループです。

1. 音声を聞き取る
2. アクティブなセッションを通じてトランスクリプトをモデルに送信する
3. 応答を待つ
4. 設定済みのトークプロバイダー（`talk.speak`）経由で読み上げる

クライアント所有のリアルタイムトークは、プロバイダーのツール呼び出しを `talk.client.toolCall` 経由で転送します。これらのクライアントは、リアルタイム相談で `chat.send` を直接呼び出しません。
リアルタイム相談がアクティブな間、トーククライアントは `talk.client.steer` または
`talk.session.steer` を使用して、発話入力を `status`、`steer`、`cancel`、または
`followup` として分類できます。受け入れられたステアリングはアクティブな埋め込み実行にキューされ、拒否された
ステアリングは `no_active_run`、`not_streaming`、
または `compacting` などの構造化された理由を返します。

文字起こしのみのトークは、リアルタイムおよび STT/TTS セッションと同じ共通トークイベントエンベロープを発行しますが、`mode: "transcription"` と `brain: "none"` を使用します。これはキャプション、ディクテーション、観察のみの音声キャプチャ用です。単発でアップロードされたボイスメモは、引き続きメディア/音声パスを使用します。

## 動作（macOS）

- トークモードが有効な間は **常時オンのオーバーレイ**。
- **聞き取り中 → 考え中 → 発話中** のフェーズ遷移。
- **短い一時停止**（無音ウィンドウ）で、現在のトランスクリプトが送信されます。
- 返信は **WebChat に書き込まれます**（入力した場合と同じ）。
- **発話で割り込み**（デフォルトはオン）: アシスタントが話している間にユーザーが話し始めた場合、再生を停止し、次のプロンプト用に割り込みタイムスタンプを記録します。

## 返信内の音声ディレクティブ

アシスタントは、音声を制御するために返信の先頭に **単一の JSON 行** を付けることがあります。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみ。
- 不明なキーは無視されます。
- `once: true` は現在の返信にのみ適用されます。
- `once` がない場合、その音声がトークモードの新しいデフォルトになります。
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
- `silenceTimeoutMs`: 未設定の場合、トークはトランスクリプト送信前にプラットフォームのデフォルト一時停止ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）
- `provider`: アクティブなトークプロバイダーを選択します。macOS ローカル再生パスには `elevenlabs`、`mlx`、または `system` を使用します。
- `providers.<provider>.voiceId`: ElevenLabs では `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` にフォールバックします（または API キーが利用可能な場合は最初の ElevenLabs 音声）。
- `providers.elevenlabs.modelId`: 未設定の場合は `eleven_v3` がデフォルトです。
- `providers.mlx.modelId`: 未設定の場合は `mlx-community/Soprano-80M-bf16` がデフォルトです。
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` にフォールバックします（または利用可能な場合は Gateway シェルプロファイル）。
- `consultThinkingLevel`: リアルタイム `openclaw_agent_consult` 呼び出しの背後にある完全な OpenClaw エージェント実行に対する任意の thinking level オーバーライド。
- `consultFastMode`: リアルタイム `openclaw_agent_consult` 呼び出しに対する任意の fast-mode オーバーライド。
- `realtime.provider`: アクティブなリアルタイム音声プロバイダーを選択します。WebRTC には `openai`、プロバイダー WebSocket には `google`、または Gateway リレー経由のブリッジ専用プロバイダーを使用します。
- `realtime.providers.<provider>` は、プロバイダー所有のリアルタイム設定を保存します。ブラウザーが受け取るのはエフェメラルまたは制限付きセッション認証情報のみで、標準 API キーは受け取りません。
- `realtime.providers.openai.voice`: 組み込みの OpenAI Realtime 音声 ID。現在の `gpt-realtime-2` 音声は `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar` です。最高品質には `marin` と `cedar` が推奨されます。
- `realtime.transport`: `webrtc` は iOS とブラウザーでクライアント所有の OpenAI WebRTC を使用します。`provider-websocket` はブラウザー所有ですが、iOS では Gateway リレーのままです。`gateway-relay` はプロバイダー音声を Gateway 上に保持します。Android はこの transport の場合のみリアルタイムを使用し、それ以外はネイティブ STT/TTS ループを維持します。
- `realtime.brain`: `agent-consult` はリアルタイムツール呼び出しを Gateway ポリシー経由でルーティングします。`direct-tools` はレガシーの直接ツール互換動作です。`none` は文字起こしまたは外部オーケストレーション用です。
- `realtime.consultRouting`: `provider-direct` は、プロバイダーが `openclaw_agent_consult` をスキップした場合にプロバイダーの直接返信を保持します。`force-agent-consult` は、Gateway リレーに確定済みユーザートランスクリプトを OpenClaw 経由でルーティングさせます。
- `realtime.instructions`: OpenClaw の組み込みリアルタイムプロンプトに、プロバイダー向けのシステム指示を追加します。音声スタイルとトーンに使用します。OpenClaw はデフォルトの `openclaw_agent_consult` ガイダンスを維持します。
- `talk.catalog` は、各プロバイダーの有効なモード、transport、brain 戦略、リアルタイム音声形式、capability フラグ、ランタイムで選択された準備完了結果とともに、正規プロバイダー ID とレジストリエイリアスを公開します。ファーストパーティのトーククライアントは、プロバイダーエイリアスをローカルに保持する代わりに、そのカタログを使用する必要があります。グループ準備完了を省略する古い Gateway は、明確に未設定なのではなく未検証です。
- ストリーミング文字起こしプロバイダーは `talk.catalog.transcription` 経由で検出されます。現在の Gateway リレーは、専用のトーク文字起こし設定サーフェスが追加されるまで、Voice Call ストリーミングプロバイダー設定を使用します。
- `speechLocale`: iOS/macOS 上のオンデバイストーク音声認識用の任意の BCP 47 ロケール ID。デバイスのデフォルトを使用する場合は未設定のままにします。
- `outputFormat`: macOS/iOS では `pcm_44100`、Android では `pcm_24000` がデフォルトです（MP3 ストリーミングを強制するには `mp3_*` を設定）

## macOS UI

- メニューバー切り替え: **トーク**
- 設定タブ: **トークモード** グループ（音声 ID + 割り込み切り替え）
- オーバーレイ:
  - **聞き取り中**: マイクレベルに合わせて雲が脈動
  - **考え中**: 沈み込むアニメーション
  - **発話中**: 放射状のリング
  - 雲をクリック: 発話を停止
  - X をクリック: トークモードを終了

## Android UI

- 音声タブ切り替え: **トーク**
- 手動 **マイク** と **トーク** は、相互に排他的なランタイムキャプチャモードです。
- 手動マイクとリアルタイムトークは、接続された Bluetooth Classic または BLE ヘッドセットマイクを優先します。切断された場合、アプリは別のヘッドセット入力を要求するか、Android にデフォルトマイクを使用させます。キャプチャを停止すると、デフォルトマイク設定に戻ります。
- 手動マイクは、アプリがフォアグラウンドを離れるか、ユーザーが音声タブを離れると停止します。
- トークモードは、オフに切り替えられるか Android ノードが切断されるまで実行され続け、アクティブな間は Android のマイク foreground-service type を使用します。

## 注記

- Speech + Microphone 権限が必要です。
- ネイティブトークはアクティブな Gateway セッションを使用し、応答イベントが利用できない場合にのみ履歴ポーリングにフォールバックします。
- クライアント所有のリアルタイムトークは、プロバイダー所有セッションに `chat.send` を公開する代わりに、`openclaw_agent_consult` に `talk.client.toolCall` を使用します。
- 文字起こしのみのトークは、`talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用します。クライアントは部分/最終トランスクリプト更新のために `talk.event` を購読します。
- gateway は、アクティブなトークプロバイダーを使用して `talk.speak` 経由でトーク再生を解決します。Android は、その RPC が利用できない場合にのみローカルシステム TTS にフォールバックします。
- macOS ローカル MLX 再生は、存在する場合は同梱の `openclaw-mlx-tts` ヘルパーを使用し、または `PATH` 上の実行可能ファイルを使用します。開発中にカスタムヘルパーバイナリを指すには、`OPENCLAW_MLX_TTS_BIN` を設定します。
- `eleven_v3` の `stability` は `0.0`、`0.5`、または `1.0` に検証されます。他のモデルは `0..1` を受け入れます。
- `latency_tier` は、設定されている場合 `0..4` に検証されます。
- Android は、低レイテンシー AudioTrack ストリーミング用に `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` 出力形式をサポートします。

## 関連

- [Voice wake](/ja-JP/nodes/voicewake)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

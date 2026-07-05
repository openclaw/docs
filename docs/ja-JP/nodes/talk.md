---
read_when:
    - macOS/iOS/Android で Talk モードを実装する
    - 音声/TTS/割り込み動作の変更
summary: 'トークモード: ローカル STT/TTS とリアルタイム音声にまたがる継続的な音声会話'
title: トークモード
x-i18n:
    generated_at: "2026-07-05T11:28:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fd8976b29ad6618337886aa58473c8459c4c5f7e67162f19cfbe1a61e4e4b65
    source_path: nodes/talk.md
    workflow: 16
---

Talk モードは 5 つのランタイム形態を扱います。

- **ネイティブ macOS/iOS/Android Talk**: ローカル音声認識、Gateway チャット、`talk.speak` TTS。ノードは `talk` capability を通知し、対応する `talk.*` コマンドを宣言します。
- **iOS Talk (リアルタイム)**: `webrtc` transport を選択する、または transport を省略する OpenAI リアルタイム設定では、クライアント所有の WebRTC を使います。明示的な `gateway-relay`、`provider-websocket`、および OpenAI 以外のリアルタイム設定は Gateway 所有のリレーに残ります。非リアルタイム設定ではネイティブ音声ループを使います。
- **ブラウザー Talk**: クライアント所有の `webrtc`/`provider-websocket` セッションには `talk.client.create`、Gateway 所有の `gateway-relay` セッションには `talk.session.create` を使います。`managed-room` は Gateway ハンドオフとトランシーバールーム用に予約されています。
- **Android Talk (リアルタイム)**: `talk.realtime.mode: "realtime"` と `talk.realtime.transport: "gateway-relay"` でオプトインします。それ以外の場合、Android はネイティブ音声認識、Gateway チャット、`talk.speak` のままです。
- **文字起こし専用クライアント**: アシスタントの音声応答なしでキャプション/ディクテーションを行うには、`talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` の後に `talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使います。1 回限りでアップロードされた音声メモは、引き続き [メディア理解](/ja-JP/nodes/media-understanding) の音声パスを使います。

ネイティブ Talk は連続ループです。音声を聞き取り、アクティブセッションを通じて文字起こしをモデルに送り、応答を待ってから、設定済みの Talk プロバイダー (`talk.speak`) 経由で読み上げます。

クライアント所有のリアルタイム Talk は、`chat.send` を直接呼び出す代わりに、プロバイダーのツール呼び出しを `talk.client.toolCall` 経由で転送します。リアルタイム相談がアクティブな間、クライアントは `talk.client.steer` または `talk.session.steer` を呼び出して、発話入力を `status`、`steer`、`cancel`、`followup` として分類できます。受け入れられた steering はアクティブな埋め込み実行にキューされます。拒否された steering は `no_active_run`、`not_streaming`、`compacting` などの理由を返します。

文字起こし専用 Talk は、リアルタイムおよび STT/TTS セッションと同じ Talk イベントエンベロープを発行しますが、`mode: "transcription"` と `brain: "none"` を使います。すべての Talk セッションは `talk.event` チャンネルでイベントをブロードキャストします。クライアントは部分/最終文字起こし更新 (`transcript.delta`/`transcript.done`) やその他のセッションテレメトリを受け取るために購読します。

## 動作 (macOS)

- Talk モードが有効な間は常時表示オーバーレイ。
- **聞き取り &rarr; 思考中 &rarr; 発話中** のフェーズ遷移。
- 短い無音 (無音ウィンドウ) の後、現在の文字起こしが送信されます。
- 返信は WebChat に書き込まれます (入力した場合と同じ)。
- **発話で割り込み** (既定でオン): アシスタントが話している間にユーザーが話すと、再生が停止し、次のプロンプト用に割り込みタイムスタンプが記録されます。

## 返信内の音声ディレクティブ

アシスタントは、音声を制御するために返信の先頭に 1 行の JSON を付けられます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみ。JSON 行は TTS 再生前に取り除かれます。
- 不明なキーは無視されます。
- `once: true` は現在の返信にのみ適用されます。指定しない場合、その音声が新しい Talk モードの既定になります。

対応キー: `voice` / `voice_id` / `voiceId`、`model` / `model_id` / `modelId`、`speed`、`rate` (WPM)、`stability`、`similarity`、`style`、`speakerBoost`、`seed`、`normalize`、`lang`、`output_format`、`latency_tier`、`once`。

## 設定 (`~/.openclaw/openclaw.json`)

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
          speakerVoice: "cedar",
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

| キー                                     | 既定                                       | 注記                                                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`                               | -                                          | アクティブな Talk TTS プロバイダー。macOS ローカル再生パスには `elevenlabs`、`mlx`、または `system` を使います。                                                                                                                                                         |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs は `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`、または API キーで利用可能な最初の音声にフォールバックします。                                                                                                                                                      |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                          |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                          |
| `providers.elevenlabs.apiKey`            | -                                          | `ELEVENLABS_API_KEY` (または利用可能な場合は gateway シェルプロファイル) にフォールバックします。                                                                                                                                                                        |
| `speechLocale`                           | デバイス既定                               | iOS/macOS のオンデバイス Talk 音声認識用の BCP 47 ロケール ID。                                                                                                                                                                                                          |
| `silenceTimeoutMs`                       | macOS/Android は `700` ms、iOS は `900` ms | Talk が文字起こしを送信する前の一時停止ウィンドウ。                                                                                                                                                                                                                      |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                          |
| `outputFormat`                           | macOS/iOS は `pcm_44100`、Android は `pcm_24000` | MP3 ストリーミングを強制するには `mp3_*` を設定します。                                                                                                                                                                                                                  |
| `consultThinkingLevel`                   | 未設定                                     | リアルタイム `openclaw_agent_consult` 呼び出しの背後にあるエージェント実行の Thinking レベル上書き。                                                                                                                                                                    |
| `consultFastMode`                        | 未設定                                     | リアルタイム `openclaw_agent_consult` 呼び出しの fast-mode 上書き。                                                                                                                                                                                                      |
| `realtime.provider`                      | -                                          | WebRTC には `openai`、プロバイダー WebSocket には `google`、または Gateway リレー経由のブリッジ専用プロバイダー。                                                                                                                                                       |
| `realtime.providers.<id>`                | -                                          | プロバイダー所有のリアルタイム設定。ブラウザーは一時的/制約付きのセッション認証情報のみを受け取り、標準 API キーは受け取りません。                                                                                                                                     |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | 組み込みの OpenAI Realtime 音声 ID (古い `voice` キーもまだ動作しますが非推奨です)。現在の `gpt-realtime-2` 音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`。最高品質には `marin` と `cedar` が推奨されます。 |
| `realtime.transport`                     | -                                          | `webrtc`: iOS とブラウザーでクライアント所有の OpenAI WebRTC。`provider-websocket`: ブラウザー所有で、iOS では Gateway リレーに残ります。`gateway-relay`: プロバイダー音声を Gateway 上に保持します。Android はこの transport でのみリアルタイムを使います。 |
| `realtime.brain`                         | -                                          | `agent-consult` はリアルタイムツール呼び出しを Gateway ポリシー経由でルーティングします。`direct-tools` はレガシーの直接ツール互換性です。`none` は文字起こし/外部オーケストレーション用です。                                                                        |
| `realtime.consultRouting`                | -                                          | `provider-direct` は `openclaw_agent_consult` をスキップしたときにプロバイダーの直接返信を保持します。`force-agent-consult` は確定済みユーザー文字起こしを代わりに OpenClaw 経由でルーティングします。                                                               |
| `realtime.instructions`                  | -                                          | OpenClaw の組み込みリアルタイムプロンプトに、プロバイダー向けのシステム指示 (音声スタイル/トーン) を追加します。既定の `openclaw_agent_consult` ガイダンスはそのままです。                                                                                         |

`talk.catalog` は、正規プロバイダー ID とレジストリエイリアス、各プロバイダーの有効なモード/transport/brain 戦略/リアルタイム音声形式/capability フラグ、およびランタイムで選択された準備状況の結果を公開します。ファーストパーティの Talk クライアントは、プロバイダーエイリアスをローカルで維持する代わりにそのカタログを読むべきです。グループ準備状況を省略する古い Gateway は、明確に未設定であるものではなく未検証として扱ってください。ストリーミング文字起こしプロバイダーは `talk.catalog.transcription` 経由で検出されます。現在の Gateway リレーは、専用の Talk 文字起こし設定サーフェスが出荷されるまで、Voice Call ストリーミングプロバイダー設定を使います。

## macOS UI

- メニューバーの切り替え: **トーク**
- 設定タブ: **トークモード** グループ（音声 ID + 割り込み切り替え）
- オーバーレイ: リスニング（雲がマイクレベルに合わせて脈動）&rarr; 思考中（沈み込むアニメーション）&rarr; 発話中（放射状のリング）。雲をクリックすると発話を停止し、X をクリックするとトークモードを終了します。

## Android UI

- 音声タブの切り替え: **トーク**
- 手動 **マイク** と **トーク** は相互排他的なキャプチャモードです。
- 手動マイクとリアルタイムトークは、接続済みの Bluetooth Classic または BLE ヘッドセットマイクを優先します。切断された場合、アプリは別のヘッドセット入力を要求するか、デフォルトのマイクにフォールバックし、キャプチャが停止するとデフォルト設定を復元します。
- 手動マイクは、アプリがフォアグラウンドを離れた場合、またはユーザーが音声タブを離れた場合に停止します。
- トークモードは、切り替えでオフにされるかノードが切断されるまで実行され続け、アクティブな間は Android のマイク用フォアグラウンドサービス種別を使用します。
- Android は、低遅延の `AudioTrack` ストリーミング向けに `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` 出力形式をサポートします。

## メモ

- 音声認識 + マイク権限が必要です。
- ネイティブトークはアクティブな Gateway セッションを使用し、応答イベントが利用できない場合にのみ履歴ポーリングへフォールバックします。
- Gateway は、アクティブなトークプロバイダーを使用して `talk.speak` 経由でトーク再生を解決します。Android は、その RPC が利用できない場合にのみローカルシステム TTS へフォールバックします。
- macOS のローカル MLX 再生は、存在する場合は同梱の `openclaw-mlx-tts` ヘルパーを使用し、または `PATH` 上の実行可能ファイルを使用します。開発中にカスタムヘルパーバイナリを指すには、`OPENCLAW_MLX_TTS_BIN` を設定します。
- 音声ディレクティブの値範囲（ElevenLabs）: `stability`、`similarity`、`style` は `0..1` を受け付けます。`speed` は `0.5..2` を受け付けます。`latency_tier` は `0..4` を受け付けます。

## 関連

- [音声ウェイク](/ja-JP/nodes/voicewake)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

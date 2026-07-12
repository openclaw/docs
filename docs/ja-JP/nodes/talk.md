---
read_when:
    - macOS/iOS/Android でのトークモードの実装
    - 音声/TTS/割り込み動作の変更
summary: トークモード：ローカルのSTT/TTSとリアルタイム音声による連続音声会話
title: トークモード
x-i18n:
    generated_at: "2026-07-11T22:21:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Talkモードは5つのランタイム形態に対応します。

- **ネイティブmacOS/iOS/Android Talk**: ローカル音声認識、Gatewayチャット、`talk.speak` TTSを使用します。Nodeは`talk`機能を公開し、対応する`talk.*`コマンドを宣言します。
- **iOS Talk（リアルタイム）**: `webrtc`トランスポートを選択するか、トランスポートを省略したOpenAIリアルタイム設定では、クライアント側が管理するWebRTCを使用します。明示的な`gateway-relay`、`provider-websocket`、およびOpenAI以外のリアルタイム設定は、引き続きGateway側が管理するリレーを使用します。リアルタイム以外の設定では、ネイティブ音声ループを使用します。
- **ブラウザーTalk**: クライアント側が管理する`webrtc`/`provider-websocket`セッションには`talk.client.create`を、Gateway側が管理する`gateway-relay`セッションには`talk.session.create`を使用します。`managed-room`は、Gatewayへの引き継ぎとトランシーバールーム用に予約されています。
- **Android Talk（リアルタイム）**: `talk.realtime.mode: "realtime"`と`talk.realtime.transport: "gateway-relay"`を設定して明示的に有効化します。それ以外の場合、Androidではネイティブ音声認識、Gatewayチャット、`talk.speak`を引き続き使用します。
- **文字起こし専用クライアント**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`を呼び出した後、`talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close`を使用すると、アシスタントの音声応答なしで字幕作成や音声入力を行えます。単発でアップロードされたボイスメモでは、引き続き[メディア理解](/ja-JP/nodes/media-understanding)の音声処理経路を使用します。

ネイティブTalkは連続ループです。発話を待ち受け、アクティブなセッションを通じて文字起こしをモデルに送信し、応答を待ってから、設定されたTalkプロバイダー（`talk.speak`）を介して読み上げます。

クライアント側が管理するリアルタイムTalkでは、`chat.send`を直接呼び出す代わりに、プロバイダーのツール呼び出しを`talk.client.toolCall`経由で転送します。リアルタイム相談がアクティブな間、クライアントは`talk.client.steer`または`talk.session.steer`を呼び出して、発話入力を`status`、`steer`、`cancel`、`followup`のいずれかに分類できます。受理されたステアリングはアクティブな組み込み実行のキューに追加され、拒否された場合は`no_active_run`、`not_streaming`、`compacting`などの理由が返されます。

文字起こし専用Talkは、リアルタイムセッションやSTT/TTSセッションと同じTalkイベントエンベロープを送出しますが、`mode: "transcription"`と`brain: "none"`を使用します。すべてのTalkセッションは`talk.event`チャンネルでイベントをブロードキャストします。クライアントはこのチャンネルを購読して、途中および確定した文字起こしの更新（`transcript.delta`/`transcript.done`）やその他のセッションテレメトリーを受信します。

## 動作（macOS）

- Talkモードが有効な間は、オーバーレイを常時表示します。
- **聞き取り中 &rarr; 思考中 &rarr; 読み上げ中**のフェーズに遷移します。
- 短い停止（無音時間）が発生すると、現在の文字起こしが送信されます。
- 応答はWebChatに書き込まれます（入力した場合と同じです）。
- **発話による割り込み**（デフォルトで有効）: アシスタントの読み上げ中にユーザーが話すと、再生を停止し、次のプロンプト用に割り込み時刻を記録します。

## 応答内の音声ディレクティブ

アシスタントは、音声を制御するために、応答の先頭へ1行のJSONを付加できます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行だけが対象です。JSON行はTTS再生前に削除されます。
- 不明なキーは無視されます。
- `once: true`は現在の応答にのみ適用されます。指定しない場合、その音声がTalkモードの新しいデフォルトになります。

対応するキー: `voice` / `voice_id` / `voiceId`、`model` / `model_id` / `modelId`、`speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`、`seed`、`normalize`、`lang`、`output_format`、`latency_tier`、`once`。

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
          model: "gpt-realtime-2.1",
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

| キー                                     | デフォルト                                 | 注記                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | アクティブなTalk TTSプロバイダーです。macOSのローカル再生経路では`elevenlabs`、`mlx`、または`system`を使用します。                                                                                                                                                           |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabsでは`ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`にフォールバックし、それらがない場合はAPIキーで利用可能な最初の音声にフォールバックします。                                                                                                                            |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | `ELEVENLABS_API_KEY`にフォールバックします（利用可能な場合はGatewayのシェルプロファイルも使用します）。                                                                                                                                                                    |
| `speechLocale`                           | デバイスのデフォルト                       | iOS/macOS上のTalkオンデバイス音声認識で使用するBCP 47ロケールIDです。                                                                                                                                                                                                      |
| `silenceTimeoutMs`                       | macOS/Androidでは`700`ミリ秒、iOSでは`900`ミリ秒 | Talkが文字起こしを送信するまでの無音時間です。                                                                                                                                                                                                                             |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | macOS/iOSでは`pcm_44100`、Androidでは`pcm_24000` | MP3ストリーミングを強制するには`mp3_*`を設定します。                                                                                                                                                                                                                       |
| `consultThinkingLevel`                   | 未設定                                     | リアルタイムの`openclaw_agent_consult`呼び出しを処理するエージェント実行の思考レベルを上書きします。                                                                                                                                                                       |
| `consultFastMode`                        | 未設定                                     | リアルタイムの`openclaw_agent_consult`呼び出しに対する高速モード設定を上書きします。                                                                                                                                                                                       |
| `realtime.provider`                      | -                                          | WebRTCには`openai`、プロバイダーWebSocketには`google`、Gatewayリレー経由のブリッジ専用プロバイダーには対応するプロバイダーIDを使用します。                                                                                                                                   |
| `realtime.providers.<id>`                | -                                          | プロバイダーが管理するリアルタイム設定です。ブラウザーが受け取るのは一時的または制限付きのセッション認証情報のみで、標準のAPIキーを受け取ることはありません。                                                                                                              |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | OpenAI Realtimeの組み込み音声IDです（旧`voice`キーも引き続き機能しますが、非推奨です）。現在の`gpt-realtime-2.1`の音声は`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`です。最高品質を得るには`marin`と`cedar`を推奨します。 |
| `realtime.transport`                     | -                                          | `webrtc`: iOSおよびブラウザーでクライアント側が管理するOpenAI WebRTCです。`provider-websocket`: ブラウザー側が管理し、iOSではGatewayリレーを使用します。`gateway-relay`: プロバイダー音声をGateway上に保持します。Androidでリアルタイムを使用できるのは、このトランスポートだけです。 |
| `realtime.brain`                         | -                                          | `agent-consult`はリアルタイムのツール呼び出しをGatewayポリシー経由で処理します。`direct-tools`は従来の直接ツール互換性用です。`none`は文字起こしまたは外部オーケストレーション用です。                                                                                           |
| `realtime.consultRouting`                | -                                          | `provider-direct`は、プロバイダーが`openclaw_agent_consult`を省略した場合に、その直接応答を維持します。`force-agent-consult`は、確定したユーザーの文字起こしを代わりにOpenClaw経由で処理します。                                                                              |
| `realtime.instructions`                  | -                                          | プロバイダー向けのシステム指示をOpenClawの組み込みリアルタイムプロンプトに追加します（音声スタイル/トーン）。デフォルトの`openclaw_agent_consult`ガイダンスは維持されます。                                                                                                  |

`talk.catalog` は、正規のプロバイダー ID とレジストリエイリアス、各プロバイダーで有効なモード／トランスポート／ブレイン戦略／リアルタイム音声形式／ケイパビリティフラグ、およびランタイムが選択した準備状況の結果を公開します。ファーストパーティの Talk クライアントは、プロバイダーエイリアスをローカルで管理するのではなく、このカタログを参照する必要があります。グループの準備状況を省略する古い Gateway は、設定されていないと断定せず、未検証として扱ってください。ストリーミング文字起こしプロバイダーは `talk.catalog.transcription` を通じて検出されます。現在の Gateway リレーは、Talk 専用の文字起こし設定サーフェスが提供されるまで、Voice Call のストリーミングプロバイダー設定を使用します。

## macOS UI

- メニューバーの切り替え：**Talk**
- 設定タブ：**Talk Mode** グループ（音声 ID + 割り込み切り替え）
- オーバーレイ：オーブには、汎用 Talk 波形（iOS、watchOS、Android と共通）が表示されます。Listening ではマイクのライブレベルに連動し、Speaking では実際の TTS 再生エンベロープに連動し、Thinking では穏やかに明滅します。オーブをクリックすると一時停止／再開、ダブルクリックすると発話停止、X をクリックすると Talk モードを終了します。

## Android UI

- Voice タブの切り替え：**Talk**
- 手動の **Mic** と **Talk** は、相互に排他的なキャプチャモードです。
- 手動 Mic とリアルタイム Talk では、接続済みの Bluetooth Classic または BLE ヘッドセットのマイクが優先されます。接続が切れた場合、アプリは別のヘッドセット入力を要求するか、デフォルトのマイクにフォールバックし、キャプチャの停止後にデフォルトの設定を復元します。
- アプリがフォアグラウンドでなくなるか、ユーザーが Voice タブから離れると、手動 Mic は停止します。
- Talk Mode は、オフに切り替えられるか Node が切断されるまで実行を継続し、アクティブな間は Android のマイク用フォアグラウンドサービスタイプを使用します。
- Android は、低遅延の `AudioTrack` ストリーミング向けに、`pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` の出力形式をサポートします。

## 注記

- 音声認識とマイクの権限が必要です。
- ネイティブ Talk はアクティブな Gateway セッションを使用し、応答イベントが利用できない場合にのみ履歴ポーリングへフォールバックします。
- Gateway は、アクティブな Talk プロバイダーを使用し、`talk.speak` を通じて Talk の再生を解決します。Android は、その RPC が利用できない場合にのみ、ローカルのシステム TTS にフォールバックします。
- macOS のローカル MLX 再生では、同梱の `openclaw-mlx-tts` ヘルパーが存在する場合はそれを使用し、存在しない場合は `PATH` 上の実行可能ファイルを使用します。開発中にカスタムヘルパーバイナリを指定するには、`OPENCLAW_MLX_TTS_BIN` を設定します。
- 音声ディレクティブの値範囲（ElevenLabs）：`stability`、`similarity`、`style` は `0..1`、`speed` は `0.5..2`、`latency_tier` は `0..4` を受け付けます。

## 関連項目

- [音声ウェイク](/ja-JP/nodes/voicewake)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

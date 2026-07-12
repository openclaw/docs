---
read_when:
    - macOS/iOS/Android でのトークモードの実装
    - 音声／TTS／割り込み動作の変更
summary: トークモード：ローカル STT/TTS とリアルタイム音声による連続的な音声会話
title: トークモード
x-i18n:
    generated_at: "2026-07-12T14:34:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Talk モードには、5 つのランタイム形態があります。

- **ネイティブ macOS/iOS/Android Talk**: ローカル音声認識、Gateway チャット、`talk.speak` TTS を使用します。Node は `talk` 機能を公開し、サポートする `talk.*` コマンドを宣言します。
- **iOS Talk（リアルタイム）**: `webrtc` トランスポートを選択するか、トランスポートを省略した OpenAI リアルタイム設定では、クライアント所有の WebRTC を使用します。明示的な `gateway-relay`、`provider-websocket`、および OpenAI 以外のリアルタイム設定は Gateway 所有のリレーを引き続き使用し、非リアルタイム設定ではネイティブ音声ループを使用します。
- **ブラウザー Talk**: クライアント所有の `webrtc`/`provider-websocket` セッションには `talk.client.create` を、Gateway 所有の `gateway-relay` セッションには `talk.session.create` を使用します。`managed-room` は Gateway へのハンドオフとトランシーバールーム用に予約されています。
- **Android Talk（リアルタイム）**: `talk.realtime.mode: "realtime"` と `talk.realtime.transport: "gateway-relay"` でオプトインします。それ以外の場合、Android はネイティブ音声認識、Gateway チャット、`talk.speak` を引き続き使用します。
- **文字起こし専用クライアント**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` を呼び出し、その後 `talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用することで、アシスタントの音声応答なしに字幕やディクテーションを実行します。単発でアップロードされたボイスメモでは、引き続き[メディア理解](/ja-JP/nodes/media-understanding)の音声パスを使用します。

ネイティブ Talk は連続ループです。発話を待ち受け、アクティブなセッションを通じて文字起こしをモデルに送信し、応答を待ってから、設定済みの Talk プロバイダー（`talk.speak`）で読み上げます。

クライアント所有のリアルタイム Talk は、`chat.send` を直接呼び出す代わりに、プロバイダーのツール呼び出しを `talk.client.toolCall` 経由で転送します。リアルタイム相談がアクティブな間、クライアントは `talk.client.steer` または `talk.session.steer` を呼び出して、音声入力を `status`、`steer`、`cancel`、`followup` のいずれかに分類できます。受け入れられたステアリングはアクティブな埋め込み実行のキューに入り、拒否されたステアリングでは `no_active_run`、`not_streaming`、`compacting` などの理由が返されます。

文字起こし専用 Talk は、リアルタイムおよび STT/TTS セッションと同じ Talk イベントエンベロープを生成しますが、`mode: "transcription"` と `brain: "none"` を使用します。すべての Talk セッションは `talk.event` チャンネルでイベントをブロードキャストします。クライアントはこのチャンネルを購読し、途中および最終の文字起こし更新（`transcript.delta`/`transcript.done`）やその他のセッションテレメトリを受信します。

## 動作（macOS）

- Talk モードが有効な間は、オーバーレイが常時表示されます。
- **聞き取り中 &rarr; 考え中 &rarr; 読み上げ中**のフェーズで遷移します。
- 短い一時停止（無音時間）があると、現在の文字起こしが送信されます。
- 応答は WebChat に書き込まれます（入力した場合と同じです）。
- **発話による割り込み**（デフォルトでオン）: アシスタントの読み上げ中にユーザーが話すと、再生が停止し、次のプロンプト用に割り込みのタイムスタンプが記録されます。

## 応答内の音声ディレクティブ

アシスタントは、音声を制御するために、応答の先頭に 1 行の JSON を付けることができます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみが対象です。JSON 行は TTS 再生前に削除されます。
- 不明なキーは無視されます。
- `once: true` は現在の応答のみに適用されます。指定しない場合、その音声が Talk モードの新しいデフォルトになります。

サポートされるキー: `voice` / `voice_id` / `voiceId`、`model` / `model_id` / `modelId`、`speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`、`seed`、`normalize`、`lang`、`output_format`、`latency_tier`、`once`。

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
      instructions: "温かみのある話し方で、回答は簡潔にしてください。",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| キー                                     | デフォルト                                 | 注記                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | アクティブな Talk TTS プロバイダー。macOS ローカルの再生パスには `elevenlabs`、`mlx`、または `system` を使用します。                                                                                                                                                         |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs は `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` にフォールバックします。どちらもない場合は、API キーで利用可能な最初の音声を使用します。                                                                                                                              |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | `ELEVENLABS_API_KEY` にフォールバックします（利用可能な場合は Gateway シェルプロファイルも使用します）。                                                                                                                                                                  |
| `speechLocale`                           | デバイスのデフォルト                       | iOS/macOS のデバイス上で行う Talk 音声認識用の BCP 47 ロケール ID。                                                                                                                                                                                                       |
| `silenceTimeoutMs`                       | macOS/Android は `700` ms、iOS は `900` ms | Talk が文字起こしを送信するまでの一時停止時間。                                                                                                                                                                                                                            |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | macOS/iOS は `pcm_44100`、Android は `pcm_24000` | MP3 ストリーミングを強制するには `mp3_*` を設定します。                                                                                                                                                                                                                |
| `consultThinkingLevel`                   | 未設定                                     | リアルタイムの `openclaw_agent_consult` 呼び出しの背後で実行されるエージェントの思考レベルを上書きします。                                                                                                                                                                |
| `consultFastMode`                        | 未設定                                     | リアルタイムの `openclaw_agent_consult` 呼び出しの高速モードを上書きします。                                                                                                                                                                                              |
| `realtime.provider`                      | -                                          | WebRTC には `openai`、プロバイダー WebSocket には `google`、Gateway リレー経由のブリッジ専用プロバイダーにはそれ以外を使用します。                                                                                                                                          |
| `realtime.providers.<id>`                | -                                          | プロバイダー所有のリアルタイム設定。ブラウザーが受け取るのは一時的または制約付きのセッション認証情報のみで、標準の API キーを受け取ることはありません。                                                                                                                    |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | OpenAI Realtime 組み込み音声 ID（以前の `voice` キーも引き続き機能しますが、非推奨です）。現在の `gpt-realtime-2.1` の音声: `alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`marin`、`sage`、`shimmer`、`verse`。最高品質を得るには `marin` と `cedar` を推奨します。 |
| `realtime.transport`                     | -                                          | `webrtc`: iOS およびブラウザーでクライアントが所有する OpenAI WebRTC。`provider-websocket`: ブラウザー所有で、iOS では Gateway リレーを引き続き使用します。`gateway-relay`: プロバイダー音声を Gateway 上に保持します。Android はこのトランスポートでのみリアルタイムを使用します。 |
| `realtime.brain`                         | -                                          | `agent-consult` はリアルタイムのツール呼び出しを Gateway ポリシー経由でルーティングします。`direct-tools` は従来の直接ツール互換性用、`none` は文字起こしまたは外部オーケストレーション用です。                                                                                |
| `realtime.consultRouting`                | -                                          | `provider-direct` は、プロバイダーが `openclaw_agent_consult` をスキップした場合に、その直接応答を保持します。`force-agent-consult` は、確定したユーザーの文字起こしを代わりに OpenClaw 経由でルーティングします。                                                           |
| `realtime.instructions`                  | -                                          | OpenClaw 組み込みのリアルタイムプロンプトに、プロバイダー向けのシステム指示（音声のスタイルやトーン）を追加します。デフォルトの `openclaw_agent_consult` ガイダンスは維持されます。                                                                                          |

`talk.catalog` は、正規のプロバイダー ID とレジストリエイリアス、各プロバイダーで有効なモード／トランスポート／ブレイン戦略／リアルタイム音声形式／ケイパビリティフラグ、およびランタイムが選択した準備状況の結果を公開します。ファーストパーティの Talk クライアントは、プロバイダーのエイリアスをローカルで管理するのではなく、このカタログを参照する必要があります。グループの準備状況を省略する古い Gateway は、明確に未設定と判断せず、未検証として扱ってください。ストリーミング文字起こしプロバイダーは `talk.catalog.transcription` を通じて検出されます。現在の Gateway リレーは、専用の Talk 文字起こし設定サーフェスが提供されるまで、Voice Call のストリーミングプロバイダー設定を使用します。

## macOS UI

- メニューバーの切り替え：**Talk**
- 設定タブ：**Talk モード**グループ（音声 ID + 割り込み切り替え）
- オーバーレイ：オーブには共通の Talk 波形が表示されます（iOS、watchOS、Android と共有）。Listening ではリアルタイムのマイクレベルに追従し、Speaking では実際の TTS 再生エンベロープに追従し、Thinking では穏やかに明滅します。オーブをクリックすると一時停止／再開、ダブルクリックすると発話を停止、X をクリックすると Talk モードを終了します。

## Android UI

- 音声タブの切り替え：**Talk**
- 手動の **Mic** と **Talk** は、相互排他的なキャプチャモードです。
- 手動 Mic とリアルタイム Talk では、接続済みの Bluetooth Classic または BLE ヘッドセットマイクが優先されます。接続が切れると、アプリは別のヘッドセット入力を要求するか、デフォルトのマイクにフォールバックし、キャプチャの停止後にデフォルトの設定を復元します。
- アプリがフォアグラウンドから離れるか、ユーザーが音声タブを離れると、手動 Mic は停止します。
- Talk モードは、切り替えをオフにするか Node が切断されるまで実行され続け、動作中は Android のマイク用フォアグラウンドサービスタイプを使用します。
- Android は、低レイテンシーの `AudioTrack` ストリーミング用に `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` の出力形式をサポートしています。

## 注記

- 音声認識とマイクの権限が必要です。
- ネイティブ Talk はアクティブな Gateway セッションを使用し、応答イベントを利用できない場合にのみ履歴ポーリングへフォールバックします。
- Gateway は、アクティブな Talk プロバイダーを使用し、`talk.speak` を通じて Talk の再生を解決します。Android は、その RPC を利用できない場合にのみローカルのシステム TTS へフォールバックします。
- macOS のローカル MLX 再生では、バンドルされた `openclaw-mlx-tts` ヘルパーが存在する場合はそれを使用し、存在しない場合は `PATH` 上の実行可能ファイルを使用します。開発中にカスタムヘルパーバイナリを指定するには、`OPENCLAW_MLX_TTS_BIN` を設定します。
- 音声ディレクティブの値の範囲（ElevenLabs）：`stability`、`similarity`、`style` は `0..1`、`speed` は `0.5..2`、`latency_tier` は `0..4` を受け付けます。

## 関連項目

- [音声ウェイク](/ja-JP/nodes/voicewake)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

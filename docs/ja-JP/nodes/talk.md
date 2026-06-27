---
read_when:
    - macOS/iOS/Android で Talk モードを実装する
    - 音声/TTS/割り込み動作を変更する
summary: 'トークモード: local STT/TTS とリアルタイム音声にまたがる連続音声会話'
title: トークモード
x-i18n:
    generated_at: "2026-06-27T11:56:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Talk モードには 2 つのランタイム形態があります。

- ネイティブ macOS/iOS/Android Talk は、ローカル音声認識、Gateway チャット、`talk.speak` TTS を使用します。ノードは `talk` capability を通知し、対応する `talk.*` コマンドを宣言します。
- ブラウザー Talk は、クライアント所有の `webrtc` および `provider-websocket` セッションには `talk.client.create` を使用し、Gateway 所有の `gateway-relay` セッションには `talk.session.create` を使用します。`managed-room` は Gateway ハンドオフとトランシーバールーム用に予約されています。
- Android Talk は、`talk.realtime.mode: "realtime"` と `talk.realtime.transport: "gateway-relay"` で Gateway 所有のリアルタイムリレーセッションをオプトインできます。それ以外の場合は、ネイティブ音声認識、Gateway チャット、`talk.speak` のままです。
- 文字起こし専用クライアントは、アシスタントの音声応答なしでキャプションやディクテーションが必要な場合に、`talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` を使用し、その後 `talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用します。

ネイティブ Talk は継続的な音声会話ループです。

1. 音声を聞き取る
2. アクティブなセッションを通じて文字起こしをモデルへ送信する
3. 応答を待つ
4. 設定済みの Talk provider（`talk.speak`）経由で読み上げる

ブラウザーのリアルタイム Talk は、provider tool call を `talk.client.toolCall` 経由で転送します。ブラウザークライアントはリアルタイム consult のために `chat.send` を直接呼び出しません。
リアルタイム consult がアクティブな間、Talk クライアントは `talk.client.steer` または
`talk.session.steer` を使用して、発話入力を `status`、`steer`、`cancel`、または
`followup` として分類できます。受け入れられた steering はアクティブな埋め込み実行にキューされます。拒否された
steering は `no_active_run`、`not_streaming`、
または `compacting` などの構造化された理由を返します。

文字起こし専用 Talk は、リアルタイムおよび STT/TTS セッションと同じ共通 Talk イベントエンベロープを発行しますが、`mode: "transcription"` と `brain: "none"` を使用します。これはキャプション、ディクテーション、観察専用の音声キャプチャ向けです。1 回限りのアップロード済み音声メモは引き続きメディア/音声パスを使用します。

## 動作（macOS）

- Talk モードが有効な間は **常時表示オーバーレイ**。
- **聞き取り中 → 考え中 → 発話中** のフェーズ遷移。
- **短い一時停止**（無音ウィンドウ）で、現在の文字起こしが送信されます。
- 返信は **WebChat に書き込まれます**（入力した場合と同じ）。
- **発話で割り込み**（デフォルトでオン）: アシスタントが話している間にユーザーが話し始めた場合、再生を停止し、次のプロンプト用に割り込みタイムスタンプを記録します。

## 返信内の音声ディレクティブ

アシスタントは、音声を制御するために返信の先頭に **単一の JSON 行** を付けられます。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみ。
- 不明なキーは無視されます。
- `once: true` は現在の返信にのみ適用されます。
- `once` がない場合、その音声が Talk モードの新しいデフォルトになります。
- JSON 行は TTS 再生前に削除されます。

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
- `silenceTimeoutMs`: 未設定の場合、Talk は文字起こしを送信する前にプラットフォームのデフォルト一時停止ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）
- `provider`: アクティブな Talk provider を選択します。macOS ローカル再生パスには `elevenlabs`、`mlx`、または `system` を使用します。
- `providers.<provider>.voiceId`: ElevenLabs では `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` にフォールバックします（または API キーが利用可能な場合は最初の ElevenLabs 音声）。
- `providers.elevenlabs.modelId`: 未設定の場合は `eleven_v3` がデフォルトです。
- `providers.mlx.modelId`: 未設定の場合は `mlx-community/Soprano-80M-bf16` がデフォルトです。
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` にフォールバックします（利用可能な場合は Gateway シェルプロファイル）。
- `consultThinkingLevel`: リアルタイム `openclaw_agent_consult` 呼び出しの背後にある完全な OpenClaw エージェント実行に対する任意の思考レベルオーバーライド。
- `consultFastMode`: リアルタイム `openclaw_agent_consult` 呼び出しに対する任意の高速モードオーバーライド。
- `realtime.provider`: アクティブなブラウザー/サーバーのリアルタイム音声 provider を選択します。WebRTC には `openai`、provider WebSocket には `google`、Gateway リレー経由ではブリッジ専用 provider を使用します。
- `realtime.providers.<provider>` は provider 所有のリアルタイム設定を格納します。ブラウザーが受け取るのはエフェメラルまたは制約付きセッションクレデンシャルのみで、標準 API キーは受け取りません。
- `realtime.providers.openai.voice`: 組み込み OpenAI Realtime 音声 ID。現在の `gpt-realtime-2` 音声は `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar` です。最高品質には `marin` と `cedar` が推奨されます。
- `realtime.transport`: `webrtc` と `provider-websocket` はブラウザーのリアルタイム transport です。Android は、これが `gateway-relay` の場合にのみリアルタイムリレーを使用します。それ以外の場合、Android Talk はネイティブ STT/TTS ループを使用します。
- `realtime.brain`: `agent-consult` はリアルタイム tool call を Gateway ポリシー経由でルーティングします。`direct-tools` はレガシーの直接ツール互換動作です。`none` は文字起こしまたは外部オーケストレーション用です。
- `realtime.consultRouting`: `provider-direct` は、`openclaw_agent_consult` をスキップしたときに provider の直接返信を保持します。`force-agent-consult` は、Gateway リレーに確定済みユーザー文字起こしを代わりに OpenClaw 経由でルーティングさせます。
- `realtime.instructions`: provider 向けシステム指示を OpenClaw の組み込みリアルタイムプロンプトに追加します。音声スタイルとトーンに使用します。OpenClaw はデフォルトの `openclaw_agent_consult` ガイダンスを維持します。
- `talk.catalog` は、各 provider の有効なモード、transport、brain 戦略、リアルタイム音声形式、capability フラグを公開し、ファーストパーティ Talk クライアントが非対応の組み合わせを避けられるようにします。
- ストリーミング文字起こし provider は `talk.catalog.transcription` 経由で検出されます。現在の Gateway リレーは、専用 Talk 文字起こし設定サーフェスが追加されるまで、Voice Call ストリーミング provider 設定を使用します。
- `speechLocale`: iOS/macOS のオンデバイス Talk 音声認識用の任意の BCP 47 ロケール ID。デバイスのデフォルトを使用するには未設定のままにします。
- `outputFormat`: macOS/iOS では `pcm_44100`、Android では `pcm_24000` がデフォルトです（MP3 ストリーミングを強制するには `mp3_*` を設定）

## macOS UI

- メニューバー切り替え: **Talk**
- 設定タブ: **Talk Mode** グループ（音声 ID + 割り込み切り替え）
- オーバーレイ:
  - **聞き取り中**: 雲がマイクレベルに合わせて脈動
  - **考え中**: 沈み込むアニメーション
  - **発話中**: 放射状のリング
  - 雲をクリック: 発話を停止
  - X をクリック: Talk モードを終了

## Android UI

- Voice タブ切り替え: **Talk**
- 手動 **Mic** と **Talk** は相互排他的なランタイムキャプチャモードです。
- 手動 Mic は、アプリがフォアグラウンドを離れるか、ユーザーが Voice タブを離れると停止します。
- Talk Mode はオフに切り替えられるか Android ノードが切断されるまで実行され続け、アクティブな間は Android のマイクフォアグラウンドサービスタイプを使用します。

## 注記

- Speech + Microphone 権限が必要です。
- ネイティブ Talk はアクティブな Gateway セッションを使用し、応答イベントが利用できない場合にのみ履歴ポーリングへフォールバックします。
- ブラウザーのリアルタイム Talk は、provider 所有のブラウザーセッションに `chat.send` を公開する代わりに、`openclaw_agent_consult` に `talk.client.toolCall` を使用します。
- 文字起こし専用 Talk は `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用します。クライアントは部分/最終文字起こし更新のために `talk.event` を購読します。
- Gateway は、アクティブな Talk provider を使用して `talk.speak` 経由で Talk 再生を解決します。Android は、その RPC が利用できない場合にのみローカルシステム TTS にフォールバックします。
- macOS ローカル MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを使用し、または `PATH` 上の実行可能ファイルを使用します。開発中にカスタムヘルパーバイナリを指すには `OPENCLAW_MLX_TTS_BIN` を設定します。
- `eleven_v3` の `stability` は `0.0`、`0.5`、または `1.0` に検証されます。他のモデルは `0..1` を受け入れます。
- `latency_tier` は、設定時に `0..4` に検証されます。
- Android は、低レイテンシ AudioTrack ストリーミング用の `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` 出力形式に対応しています。

## 関連

- [Voice wake](/ja-JP/nodes/voicewake)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

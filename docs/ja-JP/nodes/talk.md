---
read_when:
    - macOS/iOS/AndroidでTalkモードを実装する
    - 音声/TTS/割り込み動作の変更
summary: 'トークモード: ローカル STT/TTS とリアルタイム音声にまたがる継続的な音声会話'
title: 会話モード
x-i18n:
    generated_at: "2026-05-10T19:40:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

Talk モードには 2 つのランタイム形態があります。

- ネイティブ macOS/iOS/Android Talk は、ローカルの音声認識、Gateway チャット、`talk.speak` TTS を使用します。ノードは `talk` capability を広告し、対応する `talk.*` コマンドを宣言します。
- ブラウザー Talk は、クライアント所有の `webrtc` および `provider-websocket` セッションには `talk.client.create` を使用し、Gateway 所有の `gateway-relay` セッションには `talk.session.create` を使用します。`managed-room` は Gateway ハンドオフとトランシーバー型ルーム用に予約されています。
- 文字起こし専用クライアントは、アシスタントの音声応答なしでキャプションやディクテーションが必要な場合に、`talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` を使用し、その後 `talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用します。

ネイティブ Talk は継続的な音声会話ループです。

1. 音声を聞き取る
2. アクティブなセッションを通じてモデルへ文字起こしを送信する
3. 応答を待つ
4. 設定済みの Talk プロバイダー（`talk.speak`）経由で読み上げる

ブラウザーリアルタイム Talk は、プロバイダーのツール呼び出しを `talk.client.toolCall` 経由で転送します。ブラウザークライアントはリアルタイム相談で `chat.send` を直接呼び出しません。

文字起こし専用 Talk は、リアルタイムおよび STT/TTS セッションと同じ共通 Talk イベントエンベロープを発行しますが、`mode: "transcription"` と `brain: "none"` を使用します。これはキャプション、ディクテーション、観察専用の音声キャプチャ向けです。1 回限りでアップロードされた音声メモは、引き続きメディア/音声パスを使用します。

## 動作 (macOS)

- Talk モードが有効な間は **常時表示オーバーレイ**。
- **Listening → Thinking → Speaking** のフェーズ遷移。
- **短い一時停止**（無音ウィンドウ）で、現在の文字起こしが送信されます。
- 返信は **WebChat に書き込まれます**（入力した場合と同じ）。
- **発話による割り込み**（既定でオン）: アシスタントが話している間にユーザーが話し始めると、再生を停止し、次のプロンプト用に割り込み時刻を記録します。

## 返信内の音声ディレクティブ

アシスタントは、音声を制御するために返信の先頭に **単一の JSON 行** を付けることがあります。

```json
{ "voice": "<voice-id>", "once": true }
```

ルール:

- 最初の空でない行のみ。
- 不明なキーは無視されます。
- `once: true` は現在の返信にのみ適用されます。
- `once` がない場合、その音声が Talk モードの新しい既定値になります。
- JSON 行は TTS 再生前に削除されます。

対応キー:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

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

既定値:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未設定の場合、Talk は文字起こしを送信する前にプラットフォーム既定の一時停止ウィンドウを維持します（`macOS と Android では 700 ms、iOS では 900 ms`）
- `provider`: アクティブな Talk プロバイダーを選択します。macOS ローカル再生パスには `elevenlabs`、`mlx`、または `system` を使用します。
- `providers.<provider>.voiceId`: ElevenLabs では `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` にフォールバックします（または API キーが利用可能な場合は最初の ElevenLabs 音声）。
- `providers.elevenlabs.modelId`: 未設定の場合は `eleven_v3` が既定です。
- `providers.mlx.modelId`: 未設定の場合は `mlx-community/Soprano-80M-bf16` が既定です。
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` にフォールバックします（または利用可能な場合は Gateway シェルプロファイル）。
- `consultThinkingLevel`: リアルタイム `openclaw_agent_consult` 呼び出しの背後で実行される完全な OpenClaw エージェント実行の任意の思考レベル上書き。
- `consultFastMode`: リアルタイム `openclaw_agent_consult` 呼び出しの任意の高速モード上書き。
- `realtime.provider`: アクティブなブラウザー/サーバーのリアルタイム音声プロバイダーを選択します。WebRTC には `openai`、プロバイダー WebSocket には `google`、Gateway リレー経由のブリッジ専用プロバイダーを使用します。
- `realtime.providers.<provider>` は、プロバイダー所有のリアルタイム設定を保存します。ブラウザーが受け取るのは一時的または制約付きのセッションクレデンシャルのみで、標準 API キーは受け取りません。
- `realtime.providers.openai.voice`: 組み込みの OpenAI Realtime 音声 id。現在の `gpt-realtime-2` の音声は `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar` です。最高品質には `marin` と `cedar` が推奨されます。
- `realtime.brain`: `agent-consult` はリアルタイムツール呼び出しを Gateway ポリシー経由でルーティングします。`direct-tools` は所有者専用の互換動作です。`none` は文字起こしまたは外部オーケストレーション用です。
- `realtime.instructions`: OpenClaw の組み込みリアルタイムプロンプトに、プロバイダー向けシステム指示を追加します。音声スタイルやトーンに使用します。OpenClaw は既定の `openclaw_agent_consult` ガイダンスを維持します。
- `talk.catalog` は、各プロバイダーの有効なモード、トランスポート、brain 戦略、リアルタイム音声フォーマット、capability フラグを公開し、ファーストパーティ Talk クライアントが未対応の組み合わせを避けられるようにします。
- ストリーミング文字起こしプロバイダーは `talk.catalog.transcription` 経由で検出されます。現在の Gateway リレーは、専用の Talk 文字起こし設定サーフェスが追加されるまで、Voice Call ストリーミングプロバイダー設定を使用します。
- `speechLocale`: iOS/macOS 上のオンデバイス Talk 音声認識用の任意の BCP 47 ロケール id。デバイスの既定値を使用するには未設定のままにします。
- `outputFormat`: macOS/iOS では `pcm_44100`、Android では `pcm_24000` が既定です（MP3 ストリーミングを強制するには `mp3_*` を設定）

## macOS UI

- メニューバートグル: **Talk**
- 設定タブ: **Talk Mode** グループ（音声 id + 割り込みトグル）
- オーバーレイ:
  - **Listening**: 雲がマイクレベルに合わせて脈動
  - **Thinking**: 沈み込むアニメーション
  - **Speaking**: 放射状のリング
  - 雲をクリック: 発話を停止
  - X をクリック: Talk モードを終了

## Android UI

- Voice タブトグル: **Talk**
- 手動の **Mic** と **Talk** は、同時に使えないランタイムキャプチャモードです。
- 手動 Mic は、アプリがフォアグラウンドを離れるか、ユーザーが Voice タブを離れると停止します。
- Talk Mode は、オフに切り替えられるか Android ノードが切断されるまで実行を続け、アクティブな間は Android のマイク foreground-service type を使用します。

## 注記

- Speech + Microphone 権限が必要です。
- ネイティブ Talk はアクティブな Gateway セッションを使用し、応答イベントが利用できない場合のみ履歴ポーリングにフォールバックします。
- ブラウザーリアルタイム Talk は、プロバイダー所有のブラウザーセッションに `chat.send` を公開する代わりに、`openclaw_agent_consult` に `talk.client.toolCall` を使用します。
- 文字起こし専用 Talk は `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn`、`talk.session.close` を使用します。クライアントは部分/最終文字起こし更新のために `talk.event` を購読します。
- Gateway は、アクティブな Talk プロバイダーを使用して `talk.speak` 経由で Talk 再生を解決します。Android はその RPC が利用できない場合のみ、ローカルシステム TTS にフォールバックします。
- macOS ローカル MLX 再生は、存在する場合はバンドルされた `openclaw-mlx-tts` ヘルパーを使用し、そうでなければ `PATH` 上の実行可能ファイルを使用します。開発中にカスタムヘルパーバイナリを指すには `OPENCLAW_MLX_TTS_BIN` を設定します。
- `eleven_v3` の `stability` は `0.0`、`0.5`、または `1.0` として検証されます。他のモデルは `0..1` を受け付けます。
- `latency_tier` は、設定時に `0..4` として検証されます。
- Android は、低レイテンシー AudioTrack ストリーミング用の `pcm_16000`、`pcm_22050`、`pcm_24000`、`pcm_44100` 出力フォーマットに対応しています。

## 関連

- [音声ウェイク](/ja-JP/nodes/voicewake)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)

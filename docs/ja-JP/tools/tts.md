---
read_when:
    - 返信のテキスト読み上げを有効にする
    - TTSプロバイダーまたは制限を設定する
    - '`/tts` コマンドを使う'
summary: 送信する返信のためのテキスト読み上げ（TTS）
title: テキスト読み上げ
x-i18n:
    generated_at: "2026-04-08T06:01:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e0fbcaf61282733c134f682e05a71f94d2169c03a85131ce9ad233c71a1e533
    source_path: tools/tts.md
    workflow: 15
---

# テキスト読み上げ（TTS）

OpenClawは、ElevenLabs、Microsoft、MiniMax、またはOpenAIを使って送信する返信を音声に変換できます。
これは、OpenClawが音声を送信できる場所ならどこでも機能します。

## 対応サービス

- **ElevenLabs**（プライマリまたはフォールバックのプロバイダー）
- **Microsoft**（プライマリまたはフォールバックのプロバイダー。現在の同梱実装では `node-edge-tts` を使用）
- **MiniMax**（プライマリまたはフォールバックのプロバイダー。T2A v2 APIを使用）
- **OpenAI**（プライマリまたはフォールバックのプロバイダー。要約にも使用）

### Microsoft speechに関する注意

同梱のMicrosoft speechプロバイダーは現在、`node-edge-tts` ライブラリを介して
Microsoft EdgeのオンラインニューラルTTSサービスを使用しています。これはホスト型サービスであり
（ローカルではありません）、Microsoftのエンドポイントを使用し、APIキーは不要です。
`node-edge-tts` は音声設定オプションと出力形式を公開していますが、
すべてのオプションがサービスでサポートされているわけではありません。`edge` を使用する
従来の設定およびディレクティブ入力も引き続き機能し、`microsoft` に正規化されます。

この経路は公開Webサービスであり、公開されたSLAやクォータがないため、
ベストエフォートとして扱ってください。保証された制限やサポートが必要な場合は、OpenAI
またはElevenLabsを使用してください。

## オプションのキー

OpenAI、ElevenLabs、またはMiniMaxを使いたい場合:

- `ELEVENLABS_API_KEY`（または `XI_API_KEY`）
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft speechには **APIキーは不要** です。

複数のプロバイダーが設定されている場合、選択されたプロバイダーが最初に使用され、他のものはフォールバックオプションになります。
自動要約では、設定された `summaryModel`（または `agents.defaults.model.primary`）が使用されるため、
要約を有効にする場合は、そのプロバイダーも認証されている必要があります。

## サービスリンク

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## デフォルトで有効ですか？

いいえ。自動TTSはデフォルトで **オフ** です。設定で
`messages.tts.auto` を使って有効にするか、ローカルで `/tts on` を使って有効にします。

`messages.tts.provider` が未設定の場合、OpenClawはレジストリの自動選択順で
最初に設定されたspeechプロバイダーを選びます。

## 設定

TTS設定は `openclaw.json` の `messages.tts` 配下にあります。
完全なスキーマは [Gateway configuration](/ja-JP/gateway/configuration) にあります。

### 最小構成（有効化 + プロバイダー）

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAIをプライマリ、ElevenLabsをフォールバックにする場合

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoftをプライマリにする場合（APIキー不要）

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMaxをプライマリにする場合

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### Microsoft speechを無効にする

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### カスタム制限 + prefsパス

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### 受信した音声メッセージの後だけ音声で返信する

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 長い返信の自動要約を無効にする

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

次に実行します:

```
/tts summary off
```

### フィールドに関する注意

- `auto`: 自動TTSモード（`off`、`always`、`inbound`、`tagged`）。
  - `inbound` は、受信した音声メッセージの後にのみ音声を送信します。
  - `tagged` は、返信に `[[tts]]` タグが含まれている場合にのみ音声を送信します。
- `enabled`: 従来のトグル（doctorがこれを `auto` に移行します）。
- `mode`: `"final"`（デフォルト）または `"all"`（ツール/ブロック返信を含む）。
- `provider`: `"elevenlabs"`、`"microsoft"`、`"minimax"`、`"openai"` などのspeechプロバイダーID（フォールバックは自動）。
- `provider` が **未設定** の場合、OpenClawはレジストリの自動選択順で最初に設定されたspeechプロバイダーを使用します。
- 従来の `provider: "edge"` も引き続き機能し、`microsoft` に正規化されます。
- `summaryModel`: 自動要約用のオプションの低コストモデル。デフォルトは `agents.defaults.model.primary`。
  - `provider/model` または設定済みのモデルエイリアスを受け付けます。
- `modelOverrides`: モデルがTTSディレクティブを出力できるようにします（デフォルトでオン）。
  - `allowProvider` のデフォルトは `false`（プロバイダー切り替えはオプトイン）。
- `providers.<id>`: speechプロバイダーIDをキーにした、プロバイダー所有の設定。
- 従来の直接プロバイダーブロック（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）は、読み込み時に `messages.tts.providers.<id>` に自動移行されます。
- `maxTextLength`: TTS入力のハード上限（文字数）。超過すると `/tts audio` は失敗します。
- `timeoutMs`: リクエストタイムアウト（ms）。
- `prefsPath`: ローカル設定JSONパス（provider/limit/summary）を上書きします。
- `apiKey` の値は環境変数（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`）にフォールバックします。
- `providers.elevenlabs.baseUrl`: ElevenLabs APIのベースURLを上書きします。
- `providers.openai.baseUrl`: OpenAI TTSエンドポイントを上書きします。
  - 解決順: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - デフォルト以外の値はOpenAI互換のTTSエンドポイントとして扱われるため、カスタムのモデル名と音声名を使用できます。
- `providers.elevenlabs.voiceSettings`:
  - `stability`、`similarityBoost`、`style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0`（1.0 = 通常）
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2文字のISO 639-1（例: `en`、`de`）
- `providers.elevenlabs.seed`: 整数 `0..4294967295`（ベストエフォートの決定性）
- `providers.minimax.baseUrl`: MiniMax APIのベースURLを上書きします（デフォルト `https://api.minimax.io`、環境変数: `MINIMAX_API_HOST`）。
- `providers.minimax.model`: TTSモデル（デフォルト `speech-2.8-hd`、環境変数: `MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`: 音声識別子（デフォルト `English_expressive_narrator`、環境変数: `MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`: 再生速度 `0.5..2.0`（デフォルト 1.0）。
- `providers.minimax.vol`: 音量 `(0, 10]`（デフォルト 1.0。0より大きい必要があります）。
- `providers.minimax.pitch`: ピッチシフト `-12..12`（デフォルト 0）。
- `providers.microsoft.enabled`: Microsoft speechの使用を許可します（デフォルト `true`。APIキー不要）。
- `providers.microsoft.voice`: Microsoftニューラル音声名（例: `en-US-MichelleNeural`）。
- `providers.microsoft.lang`: 言語コード（例: `en-US`）。
- `providers.microsoft.outputFormat`: Microsoftの出力形式（例: `audio-24khz-48kbitrate-mono-mp3`）。
  - 有効な値はMicrosoft Speech output formatsを参照してください。同梱のEdgeベース転送では、すべての形式がサポートされるわけではありません。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: パーセント文字列（例: `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`: 音声ファイルと一緒にJSON字幕を書き込みます。
- `providers.microsoft.proxy`: Microsoft speechリクエスト用のプロキシURL。
- `providers.microsoft.timeoutMs`: リクエストタイムアウトの上書き（ms）。
- `edge.*`: 同じMicrosoft設定の従来エイリアス。

## モデル駆動の上書き（デフォルトでオン）

デフォルトでは、モデルは単一の返信に対してTTSディレクティブを出力 **できます** 。
`messages.tts.auto` が `tagged` の場合、音声をトリガーするにはこれらのディレクティブが必要です。

有効時、モデルは `[[tts:...]]` ディレクティブを出力して、単一の返信に対する音声を
上書きできます。さらに、笑い声や歌唱キューなど、
音声にのみ含めるべき表現タグを指定するためのオプションの `[[tts:text]]...[[/tts:text]]` ブロックも使えます。

`provider=...` ディレクティブは、`modelOverrides.allowProvider: true` でない限り無視されます。

返信ペイロードの例:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

使用可能なディレクティブキー（有効時）:

- `provider`（登録済みspeechプロバイダーID。たとえば `openai`、`elevenlabs`、`minimax`、`microsoft`。`allowProvider: true` が必要）
- `voice`（OpenAI voice）または `voiceId`（ElevenLabs / MiniMax）
- `model`（OpenAI TTSモデル、ElevenLabsモデルID、またはMiniMaxモデル）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax volume、0-10）
- `pitch`（MiniMax pitch、-12から12）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

すべてのモデル上書きを無効にする:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

オプションの許可リスト（他の調整項目を設定可能なまま、プロバイダー切り替えを有効化）:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## ユーザーごとの設定

スラッシュコマンドはローカル上書きを `prefsPath` に書き込みます（デフォルト:
`~/.openclaw/settings/tts.json`。`OPENCLAW_TTS_PREFS` または
`messages.tts.prefsPath` で上書き可能）。

保存されるフィールド:

- `enabled`
- `provider`
- `maxLength`（要約しきい値。デフォルト1500文字）
- `summarize`（デフォルト `true`）

これらはそのホストに対して `messages.tts.*` を上書きします。

## 出力形式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**: Opus音声メッセージ（ElevenLabsでは `opus_48000_64`、OpenAIでは `opus`）。
  - 48kHz / 64kbps は音声メッセージに適したバランスです。
- **その他のチャネル**: MP3（ElevenLabsでは `mp3_44100_128`、OpenAIでは `mp3`）。
  - 44.1kHz / 128kbps は音声明瞭度に対するデフォルトのバランスです。
- **MiniMax**: MP3（`speech-2.8-hd` モデル、32kHzサンプルレート）。音声ノート形式はネイティブサポートされません。Opus音声メッセージを確実に使いたい場合はOpenAIまたはElevenLabsを使用してください。
- **Microsoft**: `microsoft.outputFormat` を使用します（デフォルト `audio-24khz-48kbitrate-mono-mp3`）。
  - 同梱の転送は `outputFormat` を受け付けますが、すべての形式がサービスから利用できるわけではありません。
  - 出力形式の値はMicrosoft Speech output formatsに従います（Ogg/WebM Opusを含む）。
  - Telegramの `sendVoice` はOGG/MP3/M4Aを受け付けます。Opus音声メッセージを確実に使いたい場合はOpenAI/ElevenLabsを使用してください。
  - 設定されたMicrosoft出力形式が失敗した場合、OpenClawはMP3で再試行します。

OpenAI/ElevenLabsの出力形式はチャネルごとに固定です（上記参照）。

## 自動TTSの動作

有効時、OpenClawは次のように動作します:

- 返信にすでにメディアまたは `MEDIA:` ディレクティブが含まれている場合はTTSをスキップします。
- 非常に短い返信（10文字未満）ではTTSをスキップします。
- 長い返信は、有効な場合、`agents.defaults.model.primary`（または `summaryModel`）を使って要約します。
- 生成された音声を返信に添付します。

返信が `maxLength` を超えていて、要約がオフである場合（または
要約モデル用のAPIキーがない場合）、
音声はスキップされ、通常のテキスト返信が送信されます。

## フロー図

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## スラッシュコマンドの使い方

コマンドは1つだけです: `/tts`。
有効化の詳細は [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

Discordに関する注意: `/tts` は組み込みのDiscordコマンドのため、OpenClawは
そこでネイティブコマンドとして `/voice` を登録します。テキストの `/tts ...` は引き続き使えます。

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

注意:

- コマンドには認可された送信者が必要です（許可リスト/オーナールールは引き続き適用されます）。
- `commands.text` またはネイティブコマンド登録が有効である必要があります。
- 設定 `messages.tts.auto` は `off|always|inbound|tagged` を受け付けます。
- `/tts on` はローカルTTS設定を `always` に書き込みます。`/tts off` は `off` に書き込みます。
- `inbound` または `tagged` をデフォルトにしたい場合は設定を使用してください。
- `limit` と `summary` は、メイン設定ではなくローカル設定に保存されます。
- `/tts audio` は1回限りの音声返信を生成します（TTSをオンには切り替えません）。
- `/tts status` には、最新の試行に対するフォールバックの可視性が含まれます:
  - 成功時のフォールバック: `Fallback: <primary> -> <used>` と `Attempts: ...`
  - 失敗時: `Error: ...` と `Attempts: ...`
  - 詳細診断: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAIおよびElevenLabsのAPI失敗には、解析済みのプロバイダーエラー詳細とリクエストID（プロバイダーから返された場合）が含まれるようになり、TTSエラー/ログに表示されます。

## Agent tool

`tts` ツールはテキストを音声に変換し、返信配信用の音声添付を返します。チャネルがFeishu、Matrix、Telegram、またはWhatsAppの場合、
音声はファイル添付ではなく音声メッセージとして配信されます。

## Gateway RPC

Gatewayメソッド:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

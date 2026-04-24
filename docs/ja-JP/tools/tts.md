---
read_when:
    - 返信向けに text-to-speech を有効にする場合
    - TTS provider や制限を設定する場合
    - '`/tts` コマンドを使う場合'
summary: 送信返信向け text-to-speech（TTS）
title: text-to-speech
x-i18n:
    generated_at: "2026-04-24T05:27:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw は、ElevenLabs、Google Gemini、Microsoft、MiniMax、OpenAI、または xAI を使って、送信返信を音声に変換できます。
これは OpenClaw が音声を送信できる場所ならどこでも動作します。

## サポートされるサービス

- **ElevenLabs**（primary または fallback provider）
- **Google Gemini**（primary または fallback provider。Gemini API TTS を使用）
- **Microsoft**（primary または fallback provider。現在の bundled 実装では `node-edge-tts` を使用）
- **MiniMax**（primary または fallback provider。T2A v2 API を使用）
- **OpenAI**（primary または fallback provider。要約にも使用）
- **xAI**（primary または fallback provider。xAI TTS API を使用）

### Microsoft speech に関する注記

bundled の Microsoft speech provider は現在、`node-edge-tts` ライブラリ経由で Microsoft Edge のオンライン
neural TTS サービスを使用しています。これはホスト型サービスであり（ローカルではなく）、
Microsoft endpoint を使用し、API key は不要です。
`node-edge-tts` は speech 設定オプションと出力 format を公開していますが、
すべてのオプションがサービスでサポートされているわけではありません。`edge` を使うレガシー config や directive input
も引き続き動作し、`microsoft` に正規化されます。

この経路は公開 Web サービスであり、公開された SLA や quota がないため、
ベストエフォートとして扱ってください。保証された制限やサポートが必要な場合は、
OpenAI または ElevenLabs を使ってください。

## 任意の key

OpenAI、ElevenLabs、Google Gemini、MiniMax、または xAI を使いたい場合:

- `ELEVENLABS_API_KEY`（または `XI_API_KEY`）
- `GEMINI_API_KEY`（または `GOOGLE_API_KEY`）
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

Microsoft speech には **API key は不要** です。

複数の provider が設定されている場合、選択された provider が最初に使われ、他は fallback オプションになります。
自動要約では、設定された `summaryModel`（または `agents.defaults.model.primary`）が使われるため、
要約を有効にする場合はその provider に対する認証も必要です。

## サービスリンク

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## デフォルトで有効ですか？

いいえ。Auto‑TTS はデフォルトで **off** です。config の
`messages.tts.auto` または `/tts on` でローカルに有効化してください。

`messages.tts.provider` が未設定の場合、OpenClaw は registry の自動選択順で、最初に設定済みの
speech provider を選びます。

## Config

TTS config は `openclaw.json` の `messages.tts` 配下にあります。
完全な schema は [Gateway configuration](/ja-JP/gateway/configuration) にあります。

### 最小構成（有効化 + provider）

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

### OpenAI を primary、ElevenLabs を fallback にする例

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

### Microsoft を primary にする例（API key 不要）

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

### MiniMax を primary にする例

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

### Google Gemini を primary にする例

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS は Gemini API key 経路を使います。Gemini API に制限された
Google Cloud Console API key はここでも有効で、bundled の Google 画像生成 provider が使うのと同じ種類の key です。解決順序は
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY` です。

### xAI を primary にする例

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS は bundled の Grok model provider と同じ `XAI_API_KEY` 経路を使います。
解決順序は `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY` です。
現在利用可能な live voice は `ara`、`eve`、`leo`、`rex`、`sal`、`una` で、`eve` が
デフォルトです。`language` は BCP-47 タグまたは `auto` を受け付けます。

### Microsoft speech を無効にする

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

### カスタム制限 + prefs path

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

### 音声による受信メッセージの後だけ音声で返信する

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 長い返信に対する自動要約を無効にする

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

その後、次を実行します:

```
/tts summary off
```

### フィールドに関する注記

- `auto`: auto‑TTS mode（`off`、`always`、`inbound`、`tagged`）。
  - `inbound` は、受信した音声メッセージの後にのみ音声を送信します。
  - `tagged` は、返信に `[[tts:key=value]]` directive または `[[tts:text]]...[[/tts:text]]` block が含まれる場合にのみ音声を送信します。
- `enabled`: レガシートグル（doctor はこれを `auto` に移行します）。
- `mode`: `"final"`（デフォルト）または `"all"`（tool/block reply を含む）。
- `provider`: `"elevenlabs"`、`"google"`、`"microsoft"`、`"minimax"`、`"openai"` などの speech provider id（fallback は自動）。
- `provider` が **未設定** の場合、OpenClaw は registry の自動選択順で、最初に設定済みの speech provider を使います。
- レガシーの `provider: "edge"` も引き続き動作し、`microsoft` に正規化されます。
- `summaryModel`: 自動要約用の任意の安価な model。デフォルトは `agents.defaults.model.primary`。
  - `provider/model` または設定済み model alias を受け付けます。
- `modelOverrides`: model が TTS directive を出力できるようにします（デフォルトで on）。
  - `allowProvider` のデフォルトは `false` です（provider 切り替えは opt-in）。
- `providers.<id>`: speech provider id を key とする provider 所有の設定。
- レガシーの直接 provider block（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）は、load 時に `messages.tts.providers.<id>` へ自動移行されます。
- `maxTextLength`: TTS 入力の厳格な上限（文字数）。超えると `/tts audio` は失敗します。
- `timeoutMs`: リクエスト timeout（ms）。
- `prefsPath`: ローカル prefs JSON path（provider/limit/summary）を上書きします。
- `apiKey` 値は env var（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`GEMINI_API_KEY`/`GOOGLE_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`）にフォールバックします。
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URL を上書きします。
- `providers.openai.baseUrl`: OpenAI TTS endpoint を上書きします。
  - 解決順序: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - デフォルト以外の値は OpenAI 互換 TTS endpoint として扱われるため、custom model と voice 名が受け付けられます。
- `providers.elevenlabs.voiceSettings`:
  - `stability`、`similarityBoost`、`style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0`（1.0 = 通常）
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 文字の ISO 639-1（例: `en`、`de`）
- `providers.elevenlabs.seed`: 整数 `0..4294967295`（ベストエフォートな決定性）
- `providers.minimax.baseUrl`: MiniMax API base URL を上書きします（デフォルト `https://api.minimax.io`、env: `MINIMAX_API_HOST`）。
- `providers.minimax.model`: TTS model（デフォルト `speech-2.8-hd`、env: `MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`: voice identifier（デフォルト `English_expressive_narrator`、env: `MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`: 再生速度 `0.5..2.0`（デフォルト 1.0）。
- `providers.minimax.vol`: 音量 `(0, 10]`（デフォルト 1.0、0 より大きい必要あり）。
- `providers.minimax.pitch`: ピッチシフト `-12..12`（デフォルト 0）。
- `providers.google.model`: Gemini TTS model（デフォルト `gemini-3.1-flash-tts-preview`）。
- `providers.google.voiceName`: Gemini の組み込み voice 名（デフォルト `Kore`。`voice` も受け付けます）。
- `providers.google.baseUrl`: Gemini API base URL を上書きします。`https://generativelanguage.googleapis.com` のみ受け付けます。
  - `messages.tts.providers.google.apiKey` が省略された場合、TTS は env フォールバックの前に `models.providers.google.apiKey` を再利用できます。
- `providers.xai.apiKey`: xAI TTS API key（env: `XAI_API_KEY`）。
- `providers.xai.baseUrl`: xAI TTS base URL を上書きします（デフォルト `https://api.x.ai/v1`、env: `XAI_BASE_URL`）。
- `providers.xai.voiceId`: xAI voice id（デフォルト `eve`。現在の live voice: `ara`、`eve`、`leo`、`rex`、`sal`、`una`）。
- `providers.xai.language`: BCP-47 言語コードまたは `auto`（デフォルト `en`）。
- `providers.xai.responseFormat`: `mp3`、`wav`、`pcm`、`mulaw`、`alaw`（デフォルト `mp3`）。
- `providers.xai.speed`: provider ネイティブの速度 override。
- `providers.microsoft.enabled`: Microsoft speech の使用を許可します（デフォルト `true`、API key 不要）。
- `providers.microsoft.voice`: Microsoft neural voice 名（例 `en-US-MichelleNeural`）。
- `providers.microsoft.lang`: 言語コード（例 `en-US`）。
- `providers.microsoft.outputFormat`: Microsoft の出力 format（例 `audio-24khz-48kbitrate-mono-mp3`）。
  - 有効な値は Microsoft Speech output formats を参照してください。すべての format が bundled の Edge-backed transport でサポートされているわけではありません。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: パーセント文字列（例 `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`: 音声ファイルと並べて JSON 字幕を書き込みます。
- `providers.microsoft.proxy`: Microsoft speech リクエスト用の proxy URL。
- `providers.microsoft.timeoutMs`: リクエスト timeout override（ms）。
- `edge.*`: 同じ Microsoft 設定に対するレガシー alias。

## model 駆動 override（デフォルトで on）

デフォルトでは、model は **1 回の返信に対して** TTS directive を出力できます。
`messages.tts.auto` が `tagged` の場合、音声をトリガーするにはこれらの directive が必要です。

有効な場合、model は単一返信の voice を上書きするために `[[tts:...]]` directive を出力でき、さらに任意の `[[tts:text]]...[[/tts:text]]` block を使って、
音声にだけ現れるべき表現タグ（笑い、歌唱キューなど）を指定できます。

`provider=...` directive は、`modelOverrides.allowProvider: true` でない限り無視されます。

返信 payload の例:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

利用可能な directive key（有効時）:

- `provider`（登録済み speech provider id。例: `openai`、`elevenlabs`、`google`、`minimax`、`microsoft`。`allowProvider: true` が必要）
- `voice`（OpenAI voice）、`voiceName` / `voice_name` / `google_voice`（Google voice）、または `voiceId`（ElevenLabs / MiniMax / xAI）
- `model`（OpenAI TTS model、ElevenLabs model id、または MiniMax model）または `google_model`（Google TTS model）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax volume、0-10）
- `pitch`（MiniMax pitch、-12 から 12）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

すべての model override を無効にする:

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

任意の allowlist の例（他のノブは設定可能なまま、provider 切り替えを有効にする）:

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

スラッシュコマンドはローカル override を `prefsPath`（デフォルト:
`~/.openclaw/settings/tts.json`。`OPENCLAW_TTS_PREFS` または
`messages.tts.prefsPath` で上書き可能）に書き込みます。

保存されるフィールド:

- `enabled`
- `provider`
- `maxLength`（要約しきい値。デフォルト 1500 文字）
- `summarize`（デフォルト `true`）

これらは、そのホスト上では `messages.tts.*` を上書きします。

## 出力 format（固定）

- **Feishu / Matrix / Telegram / WhatsApp**: Opus voice message（ElevenLabs では `opus_48000_64`、OpenAI では `opus`）。
  - 48kHz / 64kbps は voice message として良いバランスです。
- **その他のチャンネル**: MP3（ElevenLabs では `mp3_44100_128`、OpenAI では `mp3`）。
  - 44.1kHz / 128kbps は音声明瞭性の標準的なバランスです。
- **MiniMax**: MP3（`speech-2.8-hd` model、32kHz サンプルレート）。voice-note format はネイティブサポートされていません。確実に Opus voice message が必要なら OpenAI または ElevenLabs を使ってください。
- **Google Gemini**: Gemini API TTS は生の 24kHz PCM を返します。OpenClaw はこれを audio attachment 用には WAV として包み、Talk/telephony 用には PCM をそのまま返します。ネイティブな Opus voice-note format はこの経路ではサポートされません。
- **xAI**: デフォルトは MP3。`responseFormat` は `mp3`、`wav`、`pcm`、`mulaw`、`alaw` を指定できます。OpenClaw は xAI の batch REST TTS endpoint を使い、完全な audio attachment を返します。xAI の streaming TTS WebSocket はこの provider 経路では使われません。ネイティブな Opus voice-note format はこの経路ではサポートされません。
- **Microsoft**: `microsoft.outputFormat` を使います（デフォルト `audio-24khz-48kbitrate-mono-mp3`）。
  - bundled transport は `outputFormat` を受け付けますが、すべての format がサービスから利用可能とは限りません。
  - 出力 format 値は Microsoft Speech output formats に従います（Ogg/WebM Opus を含む）。
  - Telegram の `sendVoice` は OGG/MP3/M4A を受け付けます。確実に Opus voice message が必要なら OpenAI/ElevenLabs を使ってください。
  - 設定された Microsoft 出力 format が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI/ElevenLabs の出力 format はチャンネルごとに固定です（上記参照）。

## Auto-TTS の挙動

有効な場合、OpenClaw は次のように動作します:

- 返信にすでに media または `MEDIA:` directive が含まれている場合は TTS をスキップします。
- 非常に短い返信（10 文字未満）はスキップします。
- 有効な場合、長い返信は `agents.defaults.model.primary`（または `summaryModel`）を使って要約します。
- 生成した音声を返信に添付します。

返信が `maxLength` を超えていて、summary が off（または
summary model 用の API key がない）場合、
音声はスキップされ、通常のテキスト返信が送られます。

## フロー図

```
Reply -> TTS enabled?
  no  -> テキストを送信
  yes -> media / MEDIA: / 短文か？
          yes -> テキストを送信
          no  -> 長さ > 制限？
                   no  -> TTS -> 音声を添付
                   yes -> summary は有効？
                            no  -> テキストを送信
                            yes -> summarize（summaryModel または agents.defaults.model.primary）
                                      -> TTS -> 音声を添付
```

## スラッシュコマンドの使い方

コマンドは 1 つだけです: `/tts`。
有効化の詳細は [スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

Discord 注: `/tts` は Discord の built-in コマンドなので、OpenClaw は
そこでネイティブコマンドとして `/voice` を登録します。テキストの `/tts ...` は引き続き動作します。

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

注:

- コマンドには認可された送信者が必要です（allowlist/owner ルールは引き続き適用されます）。
- `commands.text` またはネイティブコマンド登録を有効にする必要があります。
- Config の `messages.tts.auto` は `off|always|inbound|tagged` を受け付けます。
- `/tts on` はローカル TTS 設定を `always` に書き込み、`/tts off` は `off` に書き込みます。
- `inbound` または `tagged` をデフォルトにしたい場合は config を使ってください。
- `limit` と `summary` はメイン config ではなくローカル prefs に保存されます。
- `/tts audio` は単発の音声返信を生成します（TTS を on に切り替えるものではありません）。
- `/tts status` には最新試行の fallback 可視性が含まれます:
  - fallback 成功: `Fallback: <primary> -> <used>` と `Attempts: ...`
  - 失敗: `Error: ...` と `Attempts: ...`
  - 詳細診断: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI と ElevenLabs の API failure には、解析済みの provider error 詳細とリクエスト id（provider が返した場合）が含まれるようになっており、TTS error/log に表示されます。

## エージェント tool

`tts` tool は text を speech に変換し、返信配信用の
audio attachment を返します。channel が Feishu、Matrix、Telegram、または WhatsApp の場合、
audio は file attachment ではなく voice message として配信されます。
これは任意の `channel` および `timeoutMs` フィールドを受け付けます。`timeoutMs` は
呼び出しごとの provider request timeout（ミリ秒）です。

## Gateway RPC

Gateway メソッド:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## 関連

- [メディア概要](/ja-JP/tools/media-overview)
- [音楽生成](/ja-JP/tools/music-generation)
- [動画生成](/ja-JP/tools/video-generation)

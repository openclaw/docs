---
read_when:
    - 返信向けに Text-to-speech を有効にする
    - TTS プロバイダーや制限を設定する
    - '`/tts` コマンドを使用する'
summary: 送信返信向けの Text-to-speech（TTS）
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-25T18:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c56c42f201139a7277153a6a1409ef9a288264e0702d2940b74b08ece385718
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw は、送信する返信を ElevenLabs、Google Gemini、Gradium、Local CLI、Microsoft、MiniMax、OpenAI、Vydra、xAI、または Xiaomi MiMo を使って音声に変換できます。
OpenClaw が音声を送信できる場所であればどこでも動作します。

## サポートされるサービス

- **ElevenLabs**（プライマリまたはフォールバックプロバイダー）
- **Google Gemini**（プライマリまたはフォールバックプロバイダー。Gemini API TTS を使用）
- **Gradium**（プライマリまたはフォールバックプロバイダー。ボイスノートおよびテレフォニー出力をサポート）
- **Local CLI**（プライマリまたはフォールバックプロバイダー。設定済みのローカル TTS コマンドを実行）
- **Microsoft**（プライマリまたはフォールバックプロバイダー。現在の同梱実装は `node-edge-tts` を使用）
- **MiniMax**（プライマリまたはフォールバックプロバイダー。T2A v2 API を使用）
- **OpenAI**（プライマリまたはフォールバックプロバイダー。要約にも使用）
- **Vydra**（プライマリまたはフォールバックプロバイダー。画像、動画、音声を共有するプロバイダー）
- **xAI**（プライマリまたはフォールバックプロバイダー。xAI TTS API を使用）
- **Xiaomi MiMo**（プライマリまたはフォールバックプロバイダー。Xiaomi chat completions 経由で MiMo TTS を使用）

### Microsoft speech に関する注記

現在の同梱 Microsoft speech プロバイダーは、`node-edge-tts` ライブラリを通じて Microsoft Edge のオンライン neural TTS サービスを使用します。これはホスト型サービスであり（ローカルではありません）、Microsoft のエンドポイントを使用し、API キーは不要です。
`node-edge-tts` は speech 設定オプションと出力形式を公開していますが、すべてのオプションがサービスでサポートされているわけではありません。従来の設定と `edge` を使う directive 入力も引き続き動作し、`microsoft` に正規化されます。

この経路は公開 Web サービスであり、公表された SLA やクォータがないため、ベストエフォートとして扱ってください。保証された上限とサポートが必要な場合は、OpenAI または ElevenLabs を使用してください。

## オプションのキー

OpenAI、ElevenLabs、Google Gemini、Gradium、MiniMax、Vydra、xAI、または Xiaomi MiMo を使いたい場合:

- `ELEVENLABS_API_KEY`（または `XI_API_KEY`）
- `GEMINI_API_KEY`（または `GOOGLE_API_KEY`）
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS は、`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` による Token Plan 認証も受け付けます
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI と Microsoft speech には API キーは**不要**です。

複数のプロバイダーが設定されている場合、選択されたプロバイダーが最初に使用され、他はフォールバックオプションになります。
自動要約は、設定された `summaryModel`（または `agents.defaults.model.primary`）を使うため、要約を有効にする場合はそのプロバイダーでも認証が必要です。

## サービスリンク

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ja-JP/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Xiaomi MiMo speech synthesis](/ja-JP/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## デフォルトで有効ですか？

いいえ。Auto‑TTS はデフォルトで**無効**です。設定では
`messages.tts.auto`、ローカルでは `/tts on` で有効にします。

`messages.tts.provider` が未設定の場合、OpenClaw はレジストリの自動選択順で最初に設定された speech プロバイダーを選びます。

## 設定

TTS 設定は `openclaw.json` の `messages.tts` 配下にあります。
完全なスキーマは [Gateway configuration](/ja-JP/gateway/configuration) にあります。

### 最小設定（有効化 + プロバイダー）

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

### OpenAI をプライマリ、ElevenLabs をフォールバックにする

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

### Microsoft をプライマリにする（API キー不要）

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

### MiniMax をプライマリにする

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

MiniMax TTS の認証解決順は、`messages.tts.providers.minimax.apiKey`、次に保存済みの `minimax-portal` OAuth/token プロファイル、次に Token Plan 環境キー（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）、最後に `MINIMAX_API_KEY` です。明示的な TTS `baseUrl` が設定されていない場合、OpenClaw は Token Plan speech のために設定済みの `minimax-portal` OAuth ホストを再利用できます。

### Google Gemini をプライマリにする

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

Google Gemini TTS は Gemini API キー経路を使用します。Gemini API に制限された Google Cloud Console API キーはここでも有効で、同梱の Google 画像生成プロバイダーで使うのと同じ種類のキーです。解決順は
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY` です。

### xAI をプライマリにする

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

xAI TTS は、同梱の Grok モデルプロバイダーと同じ `XAI_API_KEY` 経路を使用します。解決順は `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY` です。現在の live voice は `ara`、`eve`、`leo`、`rex`、`sal`、`una` で、デフォルトは `eve` です。`language` は BCP-47 タグまたは `auto` を受け付けます。

### Xiaomi MiMo をプライマリにする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS は、同梱の Xiaomi モデルプロバイダーと同じ `XIAOMI_API_KEY` 経路を使用します。speech プロバイダー ID は `xiaomi` で、`mimo` もエイリアスとして受け付けられます。対象テキストは assistant message として送信され、これは Xiaomi の TTS 契約に一致します。オプションの `style` は user instruction として送信され、読み上げられません。

### OpenRouter をプライマリにする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS は、同梱の OpenRouter モデルプロバイダーと同じ `OPENROUTER_API_KEY` 経路を使用します。解決順は
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY` です。

### Local CLI をプライマリにする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

Local CLI TTS は、Gateway ホスト上で設定済みコマンドを実行します。`{{Text}}`、
`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` プレースホルダーは
`args` 内で展開されます。`{{Text}}` プレースホルダーが存在しない場合、
OpenClaw は読み上げ対象テキストを stdin に書き込みます。`outputFormat` は
`mp3`、`opus`、または `wav` を受け付けます。ボイスノート出力先は Ogg/Opus にトランスコードされ、テレフォニー出力は `ffmpeg` で raw 16 kHz モノラル PCM にトランスコードされます。従来のプロバイダーエイリアス `cli` も引き続き動作しますが、新しい設定では `tts-local-cli` を使用してください。

### Gradium をプライマリにする

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Microsoft speech を無効化する

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

### カスタム上限 + prefs パス

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

### 受信した音声メッセージへの返信時だけ音声で返す

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 長い返信で自動要約を無効化する

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

```text
/tts summary off
```

### フィールドに関する注記

- `auto`: auto‑TTS モード（`off`、`always`、`inbound`、`tagged`）。
  - `inbound` は、受信した音声メッセージのあとにのみ音声を送信します。
  - `tagged` は、返信に `[[tts:key=value]]` ディレクティブ、または `[[tts:text]]...[[/tts:text]]` ブロックが含まれる場合にのみ音声を送信します。
- `enabled`: 従来のトグルです（doctor はこれを `auto` に移行します）。
- `mode`: `"final"`（デフォルト）または `"all"`（ツール/ブロック返信も含む）。
- `provider`: `"elevenlabs"`、`"google"`、`"gradium"`、`"microsoft"`、`"minimax"`、`"openai"`、`"vydra"`、`"xai"`、`"xiaomi"` などの speech プロバイダー ID（フォールバックは自動）。
- `provider` が**未設定**の場合、OpenClaw はレジストリの自動選択順で最初に設定された speech プロバイダーを使用します。
- 従来の `provider: "edge"` 設定は `openclaw doctor --fix` により修復され、`provider: "microsoft"` に書き換えられます。
- `summaryModel`: 自動要約用のオプションの低コストモデル。デフォルトは `agents.defaults.model.primary` です。
  - `provider/model` または設定済みモデルエイリアスを受け付けます。
- `modelOverrides`: モデルが TTS ディレクティブを出力できるようにします（デフォルトで有効）。
  - `allowProvider` のデフォルトは `false` です（プロバイダー切り替えはオプトイン）。
- `providers.<id>`: speech プロバイダー ID をキーとする、プロバイダー所有の設定。
- 従来の直接プロバイダーブロック（`messages.tts.openai`、`messages.tts.elevenlabs`、`messages.tts.microsoft`、`messages.tts.edge`）は `openclaw doctor --fix` により修復されます。コミットする設定では `messages.tts.providers.<id>` を使用してください。
- 従来の `messages.tts.providers.edge` も `openclaw doctor --fix` により修復されます。コミットする設定では `messages.tts.providers.microsoft` を使用してください。
- `maxTextLength`: TTS 入力のハード上限（文字数）。これを超えると `/tts audio` は失敗します。
- `timeoutMs`: リクエストタイムアウト（ms）。
- `prefsPath`: ローカルの prefs JSON パスを上書きします（provider/limit/summary）。
- `apiKey` の値は env var にフォールバックします（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`GEMINI_API_KEY`/`GOOGLE_API_KEY`、`GRADIUM_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`、`VYDRA_API_KEY`、`XAI_API_KEY`、`XIAOMI_API_KEY`）。
- `providers.elevenlabs.baseUrl`: ElevenLabs API ベース URL を上書きします。
- `providers.openai.baseUrl`: OpenAI TTS エンドポイントを上書きします。
  - 解決順: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - デフォルト以外の値は OpenAI 互換 TTS エンドポイントとして扱われるため、カスタムモデル名と voice 名が受け付けられます。
- `providers.elevenlabs.voiceSettings`:
  - `stability`、`similarityBoost`、`style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0`（1.0 = 通常）
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2 文字の ISO 639-1（例: `en`、`de`）
- `providers.elevenlabs.seed`: 整数 `0..4294967295`（ベストエフォートの決定性）
- `providers.minimax.baseUrl`: MiniMax API ベース URL を上書きします（デフォルト `https://api.minimax.io`、env: `MINIMAX_API_HOST`）。
- `providers.minimax.model`: TTS モデル（デフォルト `speech-2.8-hd`、env: `MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`: voice 識別子（デフォルト `English_expressive_narrator`、env: `MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`: 再生速度 `0.5..2.0`（デフォルト 1.0）。
- `providers.minimax.vol`: 音量 `(0, 10]`（デフォルト 1.0、0 より大きい必要があります）。
- `providers.minimax.pitch`: 整数のピッチシフト `-12..12`（デフォルト 0）。小数値は MiniMax T2A 呼び出し前に切り捨てられます。API が整数以外の pitch 値を拒否するためです。
- `providers.tts-local-cli.command`: CLI TTS 用のローカル実行ファイルまたはコマンド文字列。
- `providers.tts-local-cli.args`: コマンド引数。`{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` プレースホルダーをサポートします。
- `providers.tts-local-cli.outputFormat`: 想定する CLI 出力形式（`mp3`、`opus`、または `wav`。音声添付ではデフォルト `mp3`）。
- `providers.tts-local-cli.timeoutMs`: コマンドタイムアウト（ミリ秒、デフォルト `120000`）。
- `providers.tts-local-cli.cwd`: オプションのコマンド作業ディレクトリ。
- `providers.tts-local-cli.env`: コマンド用のオプションの文字列環境変数上書き。
- `providers.google.model`: Gemini TTS モデル（デフォルト `gemini-3.1-flash-tts-preview`）。
- `providers.google.voiceName`: Gemini の組み込み voice 名（デフォルト `Kore`。`voice` も受け付けます）。
- `providers.google.audioProfile`: 読み上げテキストの前に追加される自然言語スタイルプロンプト。
- `providers.google.speakerName`: TTS プロンプトで名前付き話者を使う場合に、読み上げテキストの前に追加されるオプションの話者ラベル。
- `providers.google.baseUrl`: Gemini API ベース URL を上書きします。`https://generativelanguage.googleapis.com` のみ受け付けます。
  - `messages.tts.providers.google.apiKey` が省略されている場合、TTS は env フォールバック前に `models.providers.google.apiKey` を再利用できます。
- `providers.gradium.baseUrl`: Gradium API ベース URL を上書きします（デフォルト `https://api.gradium.ai`）。
- `providers.gradium.voiceId`: Gradium voice 識別子（デフォルトは Emma、`YTpq7expH9539ERJ`）。
- `providers.xai.apiKey`: xAI TTS API キー（env: `XAI_API_KEY`）。
- `providers.xai.baseUrl`: xAI TTS ベース URL を上書きします（デフォルト `https://api.x.ai/v1`、env: `XAI_BASE_URL`）。
- `providers.xai.voiceId`: xAI voice ID（デフォルト `eve`。現在の live voice は `ara`、`eve`、`leo`、`rex`、`sal`、`una`）。
- `providers.xai.language`: BCP-47 言語コードまたは `auto`（デフォルト `en`）。
- `providers.xai.responseFormat`: `mp3`、`wav`、`pcm`、`mulaw`、または `alaw`（デフォルト `mp3`）。
- `providers.xai.speed`: プロバイダーネイティブの speed 上書き。
- `providers.xiaomi.apiKey`: Xiaomi MiMo API キー（env: `XIAOMI_API_KEY`）。
- `providers.xiaomi.baseUrl`: Xiaomi MiMo API ベース URL を上書きします（デフォルト `https://api.xiaomimimo.com/v1`、env: `XIAOMI_BASE_URL`）。
- `providers.xiaomi.model`: TTS モデル（デフォルト `mimo-v2.5-tts`、env: `XIAOMI_TTS_MODEL`。`mimo-v2-tts` もサポート）。
- `providers.xiaomi.voice`: MiMo voice ID（デフォルト `mimo_default`、env: `XIAOMI_TTS_VOICE`）。
- `providers.xiaomi.format`: `mp3` または `wav`（デフォルト `mp3`、env: `XIAOMI_TTS_FORMAT`）。
- `providers.xiaomi.style`: user message として送信されるオプションの自然言語スタイル指示です。読み上げられません。
- `providers.openrouter.apiKey`: OpenRouter API キー（env: `OPENROUTER_API_KEY`。`models.providers.openrouter.apiKey` を再利用可能）。
- `providers.openrouter.baseUrl`: OpenRouter TTS ベース URL を上書きします（デフォルト `https://openrouter.ai/api/v1`。従来の `https://openrouter.ai/v1` は正規化されます）。
- `providers.openrouter.model`: OpenRouter TTS モデル ID（デフォルト `hexgrad/kokoro-82m`。`modelId` も受け付けます）。
- `providers.openrouter.voice`: プロバイダー固有の voice ID（デフォルト `af_alloy`。`voiceId` も受け付けます）。
- `providers.openrouter.responseFormat`: `mp3` または `pcm`（デフォルト `mp3`）。
- `providers.openrouter.speed`: プロバイダーネイティブの speed 上書き。
- `providers.microsoft.enabled`: Microsoft speech の使用を許可します（デフォルト `true`。API キー不要）。
- `providers.microsoft.voice`: Microsoft neural voice 名（例: `en-US-MichelleNeural`）。
- `providers.microsoft.lang`: 言語コード（例: `en-US`）。
- `providers.microsoft.outputFormat`: Microsoft の出力形式（例: `audio-24khz-48kbitrate-mono-mp3`）。
  - 有効な値については Microsoft Speech output formats を参照してください。すべての形式が同梱の Edge ベース transport でサポートされているわけではありません。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: パーセント文字列（例: `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`: 音声ファイルと並べて JSON 字幕を書き込みます。
- `providers.microsoft.proxy`: Microsoft speech リクエスト用のプロキシ URL。
- `providers.microsoft.timeoutMs`: リクエストタイムアウト上書き（ms）。
- `edge.*`: 同じ Microsoft 設定に対する従来のエイリアスです。永続化された設定を `providers.microsoft` に書き換えるには `openclaw doctor --fix` を実行してください。

## モデル駆動の上書き（デフォルトで有効）

デフォルトでは、モデルは単一の返信に対して TTS ディレクティブを出力**できます**。
`messages.tts.auto` が `tagged` の場合、音声をトリガーするにはこれらのディレクティブが必要です。

有効時、モデルは単一返信の voice を上書きするために `[[tts:...]]` ディレクティブを出力でき、さらに、音声にのみ含めるべき表現タグ（笑い声、歌唱キューなど）を与えるためのオプションの `[[tts:text]]...[[/tts:text]]` ブロックも使用できます。

`provider=...` ディレクティブは、`modelOverrides.allowProvider: true` でない限り無視されます。

返信ペイロードの例:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

利用可能なディレクティブキー（有効時）:

- `provider`（登録済み speech プロバイダー ID。例: `openai`、`elevenlabs`、`google`、`gradium`、`minimax`、`microsoft`、`vydra`、`xai`、`xiaomi`。`allowProvider: true` が必要）
- `voice`（OpenAI、Gradium、または Xiaomi の voice）、`voiceName` / `voice_name` / `google_voice`（Google voice）、または `voiceId`（ElevenLabs / Gradium / MiniMax / xAI）
- `model`（OpenAI TTS モデル、ElevenLabs モデル ID、MiniMax モデル、または Xiaomi MiMo TTS モデル）または `google_model`（Google TTS モデル）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量、0-10）
- `pitch`（MiniMax の整数ピッチ、-12 から 12。小数値は MiniMax リクエスト前に切り捨てられます）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

すべてのモデル上書きを無効化する:

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

オプションの許可リスト（ほかのノブを設定可能なまま、プロバイダー切り替えを有効化）:

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
- `maxLength`（要約しきい値。デフォルト 1500 文字）
- `summarize`（デフォルト `true`）

これらは、そのホストにおいて `messages.tts.*` を上書きします。

## 出力形式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**: voice-note 返信では Opus を優先します（ElevenLabs では `opus_48000_64`、OpenAI では `opus`）。
  - 48kHz / 64kbps は音声メッセージとして良いバランスです。
- **Feishu**: voice-note 返信が MP3/WAV/M4A またはその他の一般的な音声ファイルとして生成された場合、Feishu Plugin は送信前に `ffmpeg` を使ってそれを 48kHz Ogg/Opus にトランスコードし、ネイティブの `audio` バブルとして送信します。変換に失敗した場合、Feishu は元のファイルを添付として受け取ります。
- **その他のチャネル**: MP3（ElevenLabs では `mp3_44100_128`、OpenAI では `mp3`）。
  - 44.1kHz / 128kbps は speech の明瞭さに対するデフォルトのバランスです。
- **MiniMax**: 通常の音声添付では MP3（`speech-2.8-hd` モデル、32kHz サンプルレート）を使用します。Feishu や Telegram のような voice-note 対象では、OpenClaw は配信前に MiniMax の MP3 を `ffmpeg` で 48kHz Opus にトランスコードします。
- **Xiaomi MiMo**: デフォルトでは MP3、設定時は WAV を使用します。Feishu や Telegram のような voice-note 対象では、OpenClaw は配信前に Xiaomi 出力を `ffmpeg` で 48kHz Opus にトランスコードします。
- **Local CLI**: 設定された `outputFormat` を使用します。voice-note 対象は Ogg/Opus に変換され、テレフォニー出力は `ffmpeg` で raw 16 kHz モノラル PCM に変換されます。
- **Google Gemini**: Gemini API TTS は raw 24kHz PCM を返します。OpenClaw は音声添付用にこれを WAV としてラップし、Talk/テレフォニーには PCM を直接返します。この経路ではネイティブ Opus の voice-note 形式はサポートされません。
- **Gradium**: 音声添付では WAV、voice-note 対象では Opus、テレフォニーでは 8 kHz の `ulaw_8000` を使用します。
- **xAI**: デフォルトでは MP3 です。`responseFormat` には `mp3`、`wav`、`pcm`、`mulaw`、`alaw` を指定できます。OpenClaw は xAI のバッチ REST TTS エンドポイントを使用し、完全な音声添付を返します。このプロバイダー経路では xAI のストリーミング TTS WebSocket は使用されません。この経路ではネイティブ Opus の voice-note 形式はサポートされません。
- **Microsoft**: `microsoft.outputFormat` を使用します（デフォルト `audio-24khz-48kbitrate-mono-mp3`）。
  - 同梱 transport は `outputFormat` を受け付けますが、すべての形式がサービスで利用可能なわけではありません。
  - 出力形式の値は Microsoft Speech output formats に従います（Ogg/WebM Opus を含む）。
  - Telegram の `sendVoice` は OGG/MP3/M4A を受け付けます。Opus voice message が確実に必要な場合は OpenAI/ElevenLabs を使用してください。
  - 設定された Microsoft 出力形式が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI/ElevenLabs の出力形式はチャネルごとに固定です（上記参照）。

## Auto-TTS の動作

有効時、OpenClaw は次を行います。

- 返信にすでにメディアまたは `MEDIA:` ディレクティブが含まれている場合は TTS をスキップする
- 非常に短い返信（10 文字未満）をスキップする
- 有効時は、長い返信を `agents.defaults.model.primary`（または `summaryModel`）で要約する
- 生成した音声を返信に添付する

返信が `maxLength` を超え、要約が無効である場合（または要約モデル用の API キーがない場合）は、
音声はスキップされ、通常のテキスト返信が送信されます。

## フローダイアグラム

```text
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

コマンドは `/tts` の 1 つです。
有効化の詳細は [Slash commands](/ja-JP/tools/slash-commands) を参照してください。

Discord に関する注記: `/tts` は Discord 組み込みコマンドなので、
OpenClaw はそこでネイティブコマンドとして `/voice` を登録します。テキストの `/tts ...` は引き続き動作します。

```text
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

注記:

- コマンドには認可済みの送信者が必要です（allowlist/owner ルールは引き続き適用されます）。
- `commands.text` またはネイティブコマンド登録が有効である必要があります。
- 設定 `messages.tts.auto` は `off|always|inbound|tagged` を受け付けます。
- `/tts on` はローカル TTS 設定を `always` に書き込み、`/tts off` は `off` に書き込みます。
- `inbound` または `tagged` をデフォルトにしたい場合は設定を使用してください。
- `limit` と `summary` はメイン設定ではなく、ローカル prefs に保存されます。
- `/tts audio` は 1 回限りの音声返信を生成します（TTS をオンにはしません）。
- `/tts status` には最新試行のフォールバック可視性が含まれます:
  - フォールバック成功: `Fallback: <primary> -> <used>` と `Attempts: ...`
  - 失敗: `Error: ...` と `Attempts: ...`
  - 詳細診断: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI と ElevenLabs の API 失敗には、解析されたプロバイダーエラー詳細とリクエスト ID（プロバイダーから返された場合）が含まれるようになり、TTS のエラー/ログで表示されます。

## エージェントツール

`tts` ツールはテキストを speech に変換し、返信配信用の音声添付を返します。チャネルが Feishu、Matrix、Telegram、または WhatsApp の場合、音声はファイル添付ではなく voice message として配信されます。
Feishu では、`ffmpeg` が利用可能な場合、この経路で非 Opus の TTS 出力をトランスコードできます。
WhatsApp は、クライアントが voice note のキャプションを一貫して表示しないため、表示テキストを PTT の voice-note 音声とは別に送信します。
オプションの `channel` と `timeoutMs` フィールドを受け付けます。`timeoutMs` は呼び出しごとのプロバイダーリクエストタイムアウト（ミリ秒）です。

## Gateway RPC

Gateway メソッド:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## 関連

- [Media overview](/ja-JP/tools/media-overview)
- [Music generation](/ja-JP/tools/music-generation)
- [Video generation](/ja-JP/tools/video-generation)

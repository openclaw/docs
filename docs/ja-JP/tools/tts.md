---
read_when:
    - 返信のテキスト読み上げを有効にする
    - TTSプロバイダー、フォールバックチェーン、またはペルソナの設定
    - /tts コマンドまたはディレクティブの使用
sidebarTitle: Text to speech (TTS)
summary: 送信される返信のテキスト読み上げ — プロバイダー、ペルソナ、スラッシュコマンド、チャンネルごとの出力
title: テキスト読み上げ
x-i18n:
    generated_at: "2026-05-10T19:57:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9beda419aa5171c7907a238d008bcab7e67e63900a7cadbe289e58c5585a564
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw は、送信返信を **14 の音声プロバイダー**で音声に変換し、Feishu、Matrix、Telegram、WhatsApp ではネイティブ音声メッセージとして、それ以外では音声添付として、さらに電話と Talk 向けには PCM/Ulaw ストリームとして配信できます。

TTS は、Talk の `stt-tts` モードにおける音声出力側です。プロバイダーネイティブの `realtime` Talk セッションでは、この TTS パスを呼び出す代わりにリアルタイムプロバイダー内で音声を合成します。一方、`transcription` セッションではアシスタントの音声応答を合成しません。

## クイックスタート

<Steps>
  <Step title="Pick a provider">
    OpenAI と ElevenLabs は、ホスト型オプションの中で最も信頼性があります。Microsoft と
    Local CLI は API キーなしで動作します。完全な一覧は[プロバイダーマトリクス](#supported-providers)を参照してください。
  </Step>
  <Step title="Set the API key">
    プロバイダー用の環境変数をエクスポートします（例: `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`）。Microsoft と Local CLI にはキーは不要です。
  </Step>
  <Step title="Enable in config">
    `messages.tts.auto: "always"` と `messages.tts.provider` を設定します。

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

  </Step>
  <Step title="Try it in chat">
    `/tts status` は現在の状態を表示します。`/tts audio Hello from OpenClaw`
    は単発の音声返信を送信します。
  </Step>
</Steps>

<Note>
Auto-TTS はデフォルトで**オフ**です。`messages.tts.provider` が未設定の場合、
OpenClaw はレジストリの自動選択順で最初に設定済みのプロバイダーを選びます。
組み込みの `tts` エージェントツールは明示的な意図がある場合のみ使われます。通常のチャットは、
ユーザーが音声を要求する、`/tts` を使う、または Auto-TTS/ディレクティブ音声を有効にするまでは
テキストのままです。
</Note>

## 対応プロバイダー

| プロバイダー          | 認証                                                                                                             | メモ                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (also `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | ネイティブ Ogg/Opus 音声ノート出力と電話対応。                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 互換 TTS。デフォルトは `hexgrad/Kokoro-82M`。                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` or `XI_API_KEY`                                                                             | 音声クローニング、多言語対応、`seed` による決定性。Discord 音声再生向けにストリーミングされます。 |
| **Google Gemini** | `GEMINI_API_KEY` or `GOOGLE_API_KEY`                                                                             | Gemini API バッチ TTS。`promptTemplate: "audio-profile-v1"` によりペルソナを反映できます。               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 音声ノートと電話向けの出力。                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | ストリーミング TTS API。ネイティブ Opus 音声ノートと PCM 電話対応。                                |
| **Local CLI**     | なし                                                                                                             | 設定済みのローカル TTS コマンドを実行します。                                                        |
| **Microsoft**     | なし                                                                                                             | `node-edge-tts` 経由の公開 Edge neural TTS。ベストエフォートで SLA はありません。                            |
| **MiniMax**       | `MINIMAX_API_KEY` (or Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API。デフォルトは `speech-2.8-hd`。                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 自動要約にも使用されます。ペルソナ `instructions` をサポートします。                                |
| **OpenRouter**    | `OPENROUTER_API_KEY` (`models.providers.openrouter.apiKey` を再利用可能)                                            | デフォルトモデルは `hexgrad/kokoro-82m`。                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` or `BYTEPLUS_SEED_SPEECH_API_KEY` (legacy AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API。                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 画像、動画、音声で共有されるプロバイダー。                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI バッチ TTS。ネイティブ Opus 音声ノートはサポート**されません**。                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi chat completions 経由の MiMo TTS。                                                   |

複数のプロバイダーが設定されている場合、選択されたものが最初に使用され、
それ以外はフォールバックオプションになります。自動要約は `summaryModel`（または
`agents.defaults.model.primary`）を使用するため、要約を有効のままにする場合は、
そのプロバイダーも認証済みである必要があります。

<Warning>
バンドルされている **Microsoft** プロバイダーは、`node-edge-tts` 経由で Microsoft Edge のオンライン neural TTS
サービスを使用します。これは公開 Web サービスであり、公開された SLA やクォータはありません。
ベストエフォートとして扱ってください。レガシープロバイダー ID `edge` は
`microsoft` に正規化され、`openclaw doctor --fix` は永続化された設定を書き換えます。
新しい設定では常に `microsoft` を使用してください。
</Warning>

## 設定

TTS 設定は `~/.openclaw/openclaw.json` の `messages.tts` 配下にあります。
プリセットを選び、プロバイダーブロックを調整してください。

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
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
  </Tab>
  <Tab title="Microsoft (no key)">
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
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
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
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### エージェントごとの音声オーバーライド

1 つのエージェントに別のプロバイダー、音声、モデル、ペルソナ、または Auto-TTS モードで話させる場合は、`agents.list[].tts` を使用します。エージェントブロックは
`messages.tts` の上にディープマージされるため、プロバイダー認証情報はグローバルなプロバイダー設定に置いたままにできます。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

エージェントごとのペルソナを固定するには、プロバイダー設定と並べて `agents.list[].tts.persona` を設定します。このエージェントに対してのみ、グローバルな `messages.tts.persona` を上書きします。

自動返信、`/tts audio`、`/tts status`、`tts` エージェントツールの優先順位:

1. `messages.tts`
2. アクティブな `agents.list[].tts`
3. チャンネルが `channels.<channel>.tts` をサポートする場合のチャンネル上書き
4. チャンネルが `channels.<channel>.accounts.<id>.tts` を渡す場合のアカウント上書き
5. このホストのローカル `/tts` 設定
6. [モデルによるディレクティブ](#model-driven-directives)が有効な場合のインライン `[[tts:...]]` ディレクティブ

チャンネルとアカウントの上書きは `messages.tts` と同じ形を使用し、前のレイヤーに対してディープマージされます。そのため、共有プロバイダー認証情報は `messages.tts` に置いたまま、チャンネルやボットアカウントでは voice、model、persona、auto モードだけを変更できます。

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## ペルソナ

**ペルソナ** は、プロバイダー間で決定論的に適用できる安定した音声上の同一性です。1つのプロバイダーを優先し、プロバイダー非依存のプロンプト意図を定義し、voice、model、プロンプトテンプレート、seed、voice 設定に対するプロバイダー固有のバインディングを保持できます。

### 最小ペルソナ

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### 完全なペルソナ（プロバイダー非依存プロンプト）

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### ペルソナ解決

アクティブなペルソナは決定論的に選択されます。

1. 設定されている場合は、`/tts persona <id>` のローカル設定。
2. 設定されている場合は、`messages.tts.persona`。
3. ペルソナなし。

プロバイダー選択は明示指定を優先して実行されます。

1. 直接上書き（CLI、Gateway、Talk、許可された TTS ディレクティブ）。
2. `/tts provider <id>` のローカル設定。
3. アクティブなペルソナの `provider`。
4. `messages.tts.provider`。
5. レジストリの自動選択。

各プロバイダー試行について、OpenClaw は次の順序で設定をマージします。

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 信頼済みリクエストの上書き
4. 許可されたモデル出力 TTS ディレクティブの上書き

### プロバイダーがペルソナプロンプトを使用する方法

ペルソナプロンプトフィールド（`profile`、`scene`、`sampleContext`、`style`、`accent`、`pacing`、`constraints`）は **プロバイダー非依存** です。各プロバイダーがそれらの使い方を決定します。

<AccordionGroup>
  <Accordion title="Google Gemini">
    有効な Google プロバイダー設定で `promptTemplate: "audio-profile-v1"` または `personaPrompt` が設定されている **場合にのみ**、ペルソナプロンプトフィールドを Gemini TTS プロンプト構造でラップします。古い `audioProfile` フィールドと `speakerName` フィールドは、引き続き Google 固有のプロンプトテキストとして先頭に追加されます。`[[tts:text]]` ブロック内の `[whispers]` や `[laughs]` などのインライン音声タグは Gemini トランスクリプト内に保持されます。OpenClaw はこれらのタグを生成しません。
  </Accordion>
  <Accordion title="OpenAI">
    明示的な OpenAI `instructions` が設定されていない **場合にのみ**、ペルソナプロンプトフィールドをリクエストの `instructions` フィールドにマッピングします。明示的な `instructions` が常に優先されます。
  </Accordion>
  <Accordion title="その他のプロバイダー">
    `personas.<id>.providers.<provider>` の下にあるプロバイダー固有のペルソナバインディングだけを使用します。プロバイダーが独自のペルソナプロンプトマッピングを実装していない限り、ペルソナプロンプトフィールドは無視されます。
  </Accordion>
</AccordionGroup>

### フォールバックポリシー

`fallbackPolicy` は、試行されたプロバイダーに対する **バインディングがない** ペルソナの動作を制御します。

| ポリシー            | 動作                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **デフォルト。** プロバイダー非依存のプロンプトフィールドは利用可能なままです。プロバイダーはそれらを使用することも無視することもできます。                                            |
| `provider-defaults` | その試行のプロンプト準備からペルソナが省略されます。別のプロバイダーへのフォールバックが継続する間、そのプロバイダーは中立的なデフォルトを使用します。 |
| `fail`              | `reasonCode: "not_configured"` と `personaBinding: "missing"` でそのプロバイダー試行をスキップします。フォールバックプロバイダーは引き続き試行されます。              |

TTS リクエスト全体が失敗するのは、試行されたプロバイダーが **すべて** スキップされるか失敗した場合だけです。

Talk セッションのプロバイダー選択はセッションスコープです。Talk クライアントは `talk.catalog` から provider id、model id、voice id、locale を選び、Talk セッションまたはハンドオフリクエスト経由で渡す必要があります。音声セッションを開いても、`messages.tts` やグローバルな Talk プロバイダーデフォルトを変更してはいけません。

## モデルによるディレクティブ

デフォルトでは、アシスタントは `[[tts:...]]` ディレクティブを出力して、1つの返信について voice、model、speed を上書きできます。さらに、音声のみに現れる表現上のキュー用に、任意で `[[tts:text]]...[[/tts:text]]` ブロックも出力できます。

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

`messages.tts.auto` が `"tagged"` の場合、音声をトリガーするには **ディレクティブが必須** です。ストリーミングブロック配信では、隣接するブロックに分割されている場合でも、チャンネルに届く前に表示テキストからディレクティブが削除されます。

`provider=...` は、`modelOverrides.allowProvider: true` でない限り無視されます。返信で `provider=...` が宣言されている場合、そのディレクティブ内の他のキーはそのプロバイダーだけが解析します。サポートされていないキーは削除され、TTS ディレクティブ警告として報告されます。

**利用可能なディレクティブキー:**

- `provider`（登録済み provider id。`allowProvider: true` が必要）
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume`（MiniMax volume、0–10）
- `pitch`（MiniMax の整数 pitch、−12 から 12。小数値は切り捨て）
- `emotion`（Volcengine emotion タグ）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**モデル上書きを完全に無効化:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**他のノブを設定可能にしたままプロバイダー切り替えを許可:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## スラッシュコマンド

単一コマンド `/tts`。Discord では、`/tts` が組み込み Discord コマンドであるため、OpenClaw は `/voice` も登録します。テキストの `/tts ...` は引き続き機能します。

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
コマンドには認可済み送信者が必要です（許可リスト/所有者ルールが適用されます）。また、`commands.text` またはネイティブコマンド登録が有効である必要があります。
</Note>

動作メモ:

- `/tts on` はローカル TTS 設定を `always` に書き込みます。`/tts off` は `off` に書き込みます。
- `/tts chat on|off|default` は現在のチャットに対して、セッションスコープの auto-TTS 上書きを書き込みます。
- `/tts persona <id>` はローカルペルソナ設定を書き込みます。`/tts persona off` はそれをクリアします。
- `/tts latest` は現在のセッショントランスクリプトから最新のアシスタント返信を読み取り、一度だけ音声として送信します。重複する音声送信を抑制するために、その返信のハッシュだけをセッションエントリに保存します。
- `/tts audio` は単発の音声返信を生成します（TTS をオンに **しません**）。
- `limit` と `summary` はメイン設定ではなく **ローカル設定** に保存されます。
- `/tts status` には最新の試行に対するフォールバック診断が含まれます。`Fallback: <primary> -> <used>`、`Attempts: ...`、試行ごとの詳細（`provider:outcome(reasonCode) latency`）です。
- `/status` は TTS が有効な場合、アクティブな TTS モードに加え、設定済みの provider、model、voice、サニタイズ済みのカスタムエンドポイントメタデータを表示します。

## ユーザーごとの設定

スラッシュコマンドはローカル上書きを `prefsPath` に書き込みます。デフォルトは `~/.openclaw/settings/tts.json` です。`OPENCLAW_TTS_PREFS` 環境変数または `messages.tts.prefsPath` で上書きします。

| 保存フィールド | 効果                                       |
| ------------ | -------------------------------------------- |
| `auto`       | ローカル auto-TTS 上書き（`always`、`off`、…） |
| `provider`   | ローカルのプライマリプロバイダー上書き              |
| `persona`    | ローカルペルソナ上書き                       |
| `maxLength`  | 要約しきい値（デフォルト `1500` 文字）     |
| `summarize`  | 要約トグル（デフォルト `true`）              |

これらは、そのホストに対する `messages.tts` とアクティブな `agents.list[].tts` ブロックから得られる有効設定を上書きします。

## 出力形式（固定）

TTS 音声配信はチャンネル機能によって制御されます。チャンネル Plugin は、音声形式の TTS でプロバイダーにネイティブな `voice-note` ターゲットを要求するべきか、通常の `audio-file` 合成を維持して互換性のある出力を音声配信用にマークするだけにするべきかを広告します。

- **ボイスノート対応チャンネル**: ボイスノート返信は Opus（ElevenLabs の `opus_48000_64`、OpenAI の `opus`）を優先します。
  - 48kHz / 64kbps は音声メッセージとしてバランスのよいトレードオフです。
- **Feishu / WhatsApp**: ボイスノート返信が MP3/WebM/WAV/M4A
  または別の音声ファイルと思われる形式で生成された場合、チャンネルPluginはネイティブ音声メッセージを送信する前に、`ffmpeg` で 48kHz
  Ogg/Opus にトランスコードします。WhatsApp は
  Baileys の `audio` ペイロードで `ptt: true` と
  `audio/ogg; codecs=opus` を付けて結果を送信します。変換に失敗した場合、Feishu は元の
  ファイルを添付ファイルとして受信します。WhatsApp の送信は、互換性のない
  PTT ペイロードを投稿するのではなく失敗します。
- **その他のチャンネル**: MP3（ElevenLabs の `mp3_44100_128`、OpenAI の `mp3`）。
  - 44.1kHz / 128kbps は音声の明瞭さに対するデフォルトのバランスです。
- **MiniMax**: 通常の音声添付ファイルには MP3（`speech-2.8-hd` モデル、32kHz サンプルレート）を使用します。チャンネルが通知するボイスノート対象では、チャンネルがトランスコードを通知している場合、OpenClaw は配信前に `ffmpeg` で MiniMax MP3 を 48kHz Opus にトランスコードします。
- **Xiaomi MiMo**: デフォルトでは MP3、設定されている場合は WAV を使用します。チャンネルが通知するボイスノート対象では、チャンネルがトランスコードを通知している場合、OpenClaw は配信前に `ffmpeg` で Xiaomi 出力を 48kHz Opus にトランスコードします。
- **ローカル CLI**: 設定された `outputFormat` を使用します。ボイスノート対象は
  Ogg/Opus に変換され、電話出力は `ffmpeg` で生の 16 kHz モノラル PCM
  に変換されます。
- **Google Gemini**: Gemini API TTS は生の 24kHz PCM を返します。OpenClaw は音声添付ファイル用にそれを WAV としてラップし、ボイスノート対象用に 48kHz Opus にトランスコードし、Talk/電話用には PCM を直接返します。
- **Gradium**: 音声添付ファイルには WAV、ボイスノート対象には Opus、電話には 8 kHz の `ulaw_8000` を使用します。
- **Inworld**: 通常の音声添付ファイルには MP3、ボイスノート対象にはネイティブ `OGG_OPUS`、Talk/電話には 22050 Hz の生 `PCM` を使用します。
- **xAI**: デフォルトでは MP3 です。`responseFormat` は `mp3`、`wav`、`pcm`、`mulaw`、または `alaw` にできます。OpenClaw は xAI のバッチ REST TTS エンドポイントを使用し、完全な音声添付ファイルを返します。xAI のストリーミング TTS WebSocket は、このプロバイダーパスでは使用されません。ネイティブ Opus ボイスノート形式は、このパスではサポートされていません。
- **Microsoft**: `microsoft.outputFormat`（デフォルト `audio-24khz-48kbitrate-mono-mp3`）を使用します。
  - バンドルされたトランスポートは `outputFormat` を受け付けますが、すべての形式がサービスから利用できるわけではありません。
  - 出力形式の値は Microsoft Speech の出力形式（Ogg/WebM Opus を含む）に従います。
  - Telegram `sendVoice` は OGG/MP3/M4A を受け付けます。Opus 音声メッセージを
    確実に必要とする場合は OpenAI/ElevenLabs を使用してください。
  - 設定された Microsoft 出力形式が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI/ElevenLabs の出力形式はチャンネルごとに固定されています（上記を参照）。

## Auto-TTS の動作

`messages.tts.auto` が有効な場合、OpenClaw は次を行います。

- 返信にすでにメディアまたは `MEDIA:` ディレクティブが含まれている場合、TTS をスキップします。
- 非常に短い返信（10 文字未満）をスキップします。
- 要約が有効な場合、`summaryModel`（または `agents.defaults.model.primary`）を使用して
  長い返信を要約します。
- 生成された音声を返信に添付します。
- `mode: "final"` では、テキストストリームの完了後も、ストリーミングされた最終返信に対して
  音声のみの TTS を送信します。生成されたメディアは通常の返信添付ファイルと同じ
  チャンネルメディア正規化を通ります。

返信が `maxLength` を超え、要約がオフ（または要約モデルの API キーがない）場合、
音声はスキップされ、通常のテキスト返信が送信されます。

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## チャンネル別の出力形式

| 対象                                  | 形式                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | ボイスノート返信は **Opus**（ElevenLabs の `opus_48000_64`、OpenAI の `opus`）を優先します。48 kHz / 64 kbps は明瞭さとサイズのバランスを取ります。 |
| その他のチャンネル                    | **MP3**（ElevenLabs の `mp3_44100_128`、OpenAI の `mp3`）。44.1 kHz / 128 kbps は音声のデフォルトです。                              |
| Talk / 電話                           | プロバイダーのネイティブ **PCM**（Inworld 22050 Hz、Google 24 kHz）、または電話用の Gradium の `ulaw_8000`。                         |

プロバイダー別の注記:

- **Feishu / WhatsApp のトランスコード:** ボイスノート返信が MP3/WebM/WAV/M4A として届くと、チャンネルPluginは `ffmpeg` で 48 kHz Ogg/Opus にトランスコードします。WhatsApp は Baileys 経由で `ptt: true` と `audio/ogg; codecs=opus` を付けて送信します。変換に失敗した場合: Feishu は元のファイルを添付するようにフォールバックします。WhatsApp の送信は、互換性のない PTT ペイロードを投稿するのではなく失敗します。
- **MiniMax / Xiaomi MiMo:** デフォルトは MP3（MiniMax `speech-2.8-hd` は 32 kHz）。ボイスノート対象では `ffmpeg` によって 48 kHz Opus にトランスコードされます。
- **ローカル CLI:** 設定された `outputFormat` を使用します。ボイスノート対象は Ogg/Opus に変換され、電話出力は生の 16 kHz モノラル PCM に変換されます。
- **Google Gemini:** 生の 24 kHz PCM を返します。OpenClaw は添付ファイル用には WAV としてラップし、ボイスノート対象用には 48 kHz Opus にトランスコードし、Talk/電話用には PCM を直接返します。
- **Inworld:** MP3 添付ファイル、ネイティブ `OGG_OPUS` ボイスノート、Talk/電話用には 22050 Hz の生 `PCM`。
- **xAI:** デフォルトでは MP3 です。`responseFormat` は `mp3|wav|pcm|mulaw|alaw` にできます。xAI のバッチ REST エンドポイントを使用します。ストリーミング WebSocket TTS は**使用されません**。ネイティブ Opus ボイスノート形式は**サポートされていません**。
- **Microsoft:** `microsoft.outputFormat`（デフォルト `audio-24khz-48kbitrate-mono-mp3`）を使用します。Telegram `sendVoice` は OGG/MP3/M4A を受け付けます。Opus 音声メッセージを確実に必要とする場合は OpenAI/ElevenLabs を使用してください。設定された Microsoft 形式が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI と ElevenLabs の出力形式は、上記のとおりチャンネルごとに固定されています。

## フィールドリファレンス

<AccordionGroup>
  <Accordion title="最上位 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Auto-TTS モード。`inbound` はインバウンド音声メッセージの後にのみ音声を送信します。`tagged` は返信に `[[tts:...]]` ディレクティブまたは `[[tts:text]]` ブロックが含まれている場合にのみ音声を送信します。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      レガシートグル。`openclaw doctor --fix` はこれを `auto` に移行します。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` は最終返信に加えてツール/ブロック返信を含めます。
    </ParamField>
    <ParamField path="provider" type="string">
      音声プロバイダー ID。未設定の場合、OpenClaw はレジストリの自動選択順で最初に設定されたプロバイダーを使用します。レガシー `provider: "edge"` は `openclaw doctor --fix` によって `"microsoft"` に書き換えられます。
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` からのアクティブなペルソナ ID。小文字に正規化されます。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      安定した発話上のアイデンティティ。フィールド: `label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。[ペルソナ](#personas) を参照してください。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      自動要約用の低コストモデル。デフォルトは `agents.defaults.model.primary` です。`provider/model` または設定済みのモデルエイリアスを受け付けます。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      モデルが TTS ディレクティブを出力できるようにします。`enabled` のデフォルトは `true`、`allowProvider` のデフォルトは `false` です。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      音声プロバイダー ID でキー付けされた、プロバイダー所有の設定。レガシーの直接ブロック（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）は `openclaw doctor --fix` によって書き換えられます。`messages.tts.providers.<id>` のみをコミットしてください。
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 入力文字数のハード上限。超過した場合、`/tts audio` は失敗します。
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      リクエストタイムアウト（ミリ秒）。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      ローカル設定 JSON パス（プロバイダー/制限/要約）を上書きします。デフォルトは `~/.openclaw/settings/tts.json` です。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY`、または `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech リージョン（例: `eastus`）。Env: `AZURE_SPEECH_REGION` または `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">任意の Azure Speech エンドポイント上書き（エイリアス `baseUrl`）。</ParamField>
    <ParamField path="voice" type="string">Azure 音声 ShortName。デフォルトは `en-US-JennyNeural`。</ParamField>
    <ParamField path="lang" type="string">SSML 言語コード。デフォルトは `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">標準音声用の Azure `X-Microsoft-OutputFormat`。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">ボイスノート出力用の Azure `X-Microsoft-OutputFormat`。デフォルトは `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` または `XI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">モデル ID（例: `eleven_multilingual_v2`、`eleven_v3`）。</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs 音声 ID。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（それぞれ `0..1`）、`useSpeakerBoost`（`true|false`）、`speed`（`0.5..2.0`、`1.0` = 通常）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>テキスト正規化モード。</ParamField>
    <ParamField path="languageCode" type="string">2 文字の ISO 639-1（例: `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">ベストエフォートの決定性のための整数 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API ベース URL を上書きします。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` にフォールバックします。省略した場合、TTS は env フォールバックの前に `models.providers.google.apiKey` を再利用できます。</ParamField>
    <ParamField path="model" type="string">Gemini TTS モデル。デフォルトは `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="voiceName" type="string">Gemini 事前構築済み音声名。デフォルトは `Kore`。エイリアス: `voice`。</ParamField>
    <ParamField path="audioProfile" type="string">発話テキストの前に付加される自然言語スタイルプロンプト。</ParamField>
    <ParamField path="speakerName" type="string">プロンプトが名前付き話者を使用する場合、発話テキストの前に付加される任意の話者ラベル。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>アクティブなペルソナプロンプトフィールドを決定的な Gemini TTS プロンプト構造でラップするには `audio-profile-v1` に設定します。</ParamField>
    <ParamField path="personaPrompt" type="string">テンプレートの Director's Notes に追加される、Google 固有の追加ペルソナプロンプトテキスト。</ParamField>
    <ParamField path="baseUrl" type="string">`https://generativelanguage.googleapis.com` のみ受け付けられます。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.gradium.ai`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは Emma (`YTpq7expH9539ERJ`)。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld プライマリ

    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">デフォルトは `inworld-tts-1.5-max`。ほかに `inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは `Sarah`。</ParamField>
    <ParamField path="temperature" type="number">サンプリング温度 `0..2`。</ParamField>

  </Accordion>

  <Accordion title="ローカル CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS 用のローカル実行ファイルまたはコマンド文字列。</ParamField>
    <ParamField path="args" type="string[]">コマンド引数。`{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` プレースホルダーをサポート。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>想定される CLI 出力形式。音声添付ファイルのデフォルトは `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">コマンドタイムアウト (ミリ秒)。デフォルトは `120000`。</ParamField>
    <ParamField path="cwd" type="string">任意のコマンド作業ディレクトリ。</ParamField>
    <ParamField path="env" type="Record<string, string>">コマンド用の任意の環境上書き。</ParamField>
  </Accordion>

  <Accordion title="Microsoft (API キーなし)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft 音声の使用を許可します。</ParamField>
    <ParamField path="voice" type="string">Microsoft ニューラル音声名 (例: `en-US-MichelleNeural`)。</ParamField>
    <ParamField path="lang" type="string">言語コード (例: `en-US`)。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 出力形式。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。バンドルされた Edge ベースのトランスポートでは、すべての形式がサポートされるわけではありません。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">パーセント文字列 (例: `+10%`、`-5%`)。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">音声ファイルと並べて JSON 字幕を書き込みます。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 音声リクエスト用のプロキシ URL。</ParamField>
    <ParamField path="timeoutMs" type="number">リクエストタイムアウトの上書き (ms)。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>レガシーエイリアス。永続化された設定を `providers.microsoft` に書き換えるには `openclaw doctor --fix` を実行します。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` にフォールバックします。Token Plan 認証は `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、または `MINIMAX_CODING_API_KEY` 経由。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.minimax.io`。Env: `MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `speech-2.8-hd`。Env: `MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは `English_expressive_narrator`。Env: `MINIMAX_TTS_VOICE_ID`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。デフォルトは `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。デフォルトは `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。デフォルトは `0`。小数値はリクエスト前に切り捨てられます。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS モデル ID (例: `gpt-4o-mini-tts`)。</ParamField>
    <ParamField path="voice" type="string">音声名 (例: `alloy`、`cedar`)。</ParamField>
    <ParamField path="instructions" type="string">明示的な OpenAI `instructions` フィールド。設定すると、ペルソナプロンプトフィールドは自動マッピングされ**ません**。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">生成された OpenAI TTS フィールドの後に `/audio/speech` リクエスト本文へマージされる追加 JSON フィールド。Kokoro のように `lang` などのプロバイダー固有キーを必要とする OpenAI 互換エンドポイントで使用します。安全でないプロトタイプキーは無視されます。</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS エンドポイントを上書きします。解決順序: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。デフォルト以外の値は OpenAI 互換 TTS エンドポイントとして扱われるため、カスタムモデル名と音声名を使用できます。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`。`models.providers.openrouter.apiKey` を再利用できます。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://openrouter.ai/api/v1`。レガシーの `https://openrouter.ai/v1` は正規化されます。</ParamField>
    <ParamField path="model" type="string">デフォルトは `hexgrad/kokoro-82m`。エイリアス: `modelId`。</ParamField>
    <ParamField path="voice" type="string">デフォルトは `af_alloy`。エイリアス: `voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>デフォルトは `mp3`。</ParamField>
    <ParamField path="speed" type="number">プロバイダーネイティブの速度上書き。</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">デフォルトは `seed-tts-1.0`。Env: `VOLCENGINE_TTS_RESOURCE_ID`。プロジェクトに TTS 2.0 権限がある場合は `seed-tts-2.0` を使用します。</ParamField>
    <ParamField path="appKey" type="string">アプリキー ヘッダー。デフォルトは `aGjiRDfUWi`。Env: `VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP エンドポイントを上書きします。Env: `VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="voice" type="string">音声タイプ。デフォルトは `en_female_anna_mars_bigtts`。Env: `VOLCENGINE_TTS_VOICE`。</ParamField>
    <ParamField path="speedRatio" type="number">プロバイダーネイティブの速度比。</ParamField>
    <ParamField path="emotion" type="string">プロバイダーネイティブの感情タグ。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>レガシーの Volcengine Speech Console フィールド。Env: `VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER` (デフォルトは `volcano_tts`)。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.x.ai/v1`。Env: `XAI_BASE_URL`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは `eve`。ライブ音声: `ara`、`eve`、`leo`、`rex`、`sal`、`una`。</ParamField>
    <ParamField path="language" type="string">BCP-47 言語コードまたは `auto`。デフォルトは `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>デフォルトは `mp3`。</ParamField>
    <ParamField path="speed" type="number">プロバイダーネイティブの速度上書き。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.xiaomimimo.com/v1`。Env: `XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `mimo-v2.5-tts`。Env: `XIAOMI_TTS_MODEL`。`mimo-v2-tts` もサポート。</ParamField>
    <ParamField path="voice" type="string">デフォルトは `mimo_default`。Env: `XIAOMI_TTS_VOICE`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>デフォルトは `mp3`。Env: `XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">ユーザーメッセージとして送信される任意の自然言語スタイル指示。読み上げられません。</ParamField>
  </Accordion>
</AccordionGroup>

## エージェントツール

`tts` ツールはテキストを音声に変換し、返信配信用の音声添付ファイルを返します。Feishu、Matrix、Telegram、WhatsApp では、音声はファイル添付ではなくボイスメッセージとして配信されます。Feishu と WhatsApp は、このパスで `ffmpeg` が利用可能な場合、非 Opus の TTS 出力をトランスコードできます。

WhatsApp は Baileys 経由で PTT ボイスノート (`audio` に `ptt: true`) として音声を送信し、表示テキストは PTT 音声とは**別に**送信します。これは、クライアントがボイスノートのキャプションを一貫して表示しないためです。

このツールは任意の `channel` と `timeoutMs` フィールドを受け入れます。`timeoutMs` は呼び出しごとのプロバイダーリクエストタイムアウト (ミリ秒) です。

## Gateway RPC

| メソッド          | 目的                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | 現在の TTS 状態と直近の試行を読み取ります。 |
| `tts.enable`      | ローカル自動設定を `always` に設定します。 |
| `tts.disable`     | ローカル自動設定を `off` に設定します。   |
| `tts.convert`     | 1 回限りのテキスト → 音声。              |
| `tts.setProvider` | ローカルプロバイダー設定を設定します。   |
| `tts.setPersona`  | ローカルペルソナ設定を設定します。       |
| `tts.providers`   | 設定済みプロバイダーとステータスを一覧表示します。 |

## サービスリンク

- [OpenAI テキスト読み上げガイド](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API リファレンス](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST テキスト読み上げ](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech プロバイダー](/ja-JP/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 認証](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ja-JP/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/ja-JP/providers/volcengine#text-to-speech)
- [Xiaomi MiMo 音声合成](/ja-JP/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 出力形式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI テキスト読み上げ](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 関連

- [メディア概要](/ja-JP/tools/media-overview)
- [音楽生成](/ja-JP/tools/music-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [音声通話 Plugin](/ja-JP/plugins/voice-call)

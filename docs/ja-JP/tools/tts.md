---
read_when:
    - 返信のテキスト読み上げを有効にする
    - TTS プロバイダー、フォールバックチェーン、またはペルソナの設定
    - /tts コマンドまたはディレクティブの使用
sidebarTitle: Text to speech (TTS)
summary: 送信返信のテキスト読み上げ — プロバイダー、ペルソナ、スラッシュコマンド、チャネル別出力
title: テキスト読み上げ
x-i18n:
    generated_at: "2026-07-06T21:55:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01df41a36aed3c6f11d315c8ecfdf70d18e7d1c94270fa1a9fd0bfde9a40bd4
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw は、アウトバウンド返信を **14 の音声プロバイダー** 経由で音声に変換します。
Feishu、Matrix、Telegram、WhatsApp ではネイティブ音声メッセージ、それ以外では音声
添付、さらに電話通信と Talk では PCM/Ulaw ストリームを使用します。

TTS は Talk の `stt-tts` モードにおける音声出力側です（`talk.speak` はこれと同じ合成
パスを呼び出します）。一方、プロバイダーネイティブの `realtime` Talk セッションでは
リアルタイムプロバイダー内で音声を合成します。`transcription` セッションでは
アシスタントの音声返信は合成されません。

## クイックスタート

<Steps>
  <Step title="プロバイダーを選ぶ">
    OpenAI と ElevenLabs は、最も信頼性の高いホスト型オプションです。Microsoft と
    Local CLI は API キーなしで動作します。完全な一覧は[プロバイダーマトリクス](#supported-providers)
    を参照してください。
  </Step>
  <Step title="API キーを設定する">
    プロバイダー用の環境変数をエクスポートします（例: `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`）。Microsoft と Local CLI にはキーは不要です。
  </Step>
  <Step title="設定で有効化する">
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
  <Step title="チャットで試す">
    `/tts status` は現在の状態を表示します。`/tts audio Hello from OpenClaw` は
    1 回限りの音声返信を送信します。
  </Step>
</Steps>

<Note>
Auto-TTS はデフォルトで**オフ**です。`messages.tts.provider` が未設定の場合、
OpenClaw はレジストリの自動選択順で最初に設定済みのプロバイダーを選びます。
組み込みの `tts` エージェントツールは明示的な意図がある場合のみ使用されます。通常のチャットは、
ユーザーが音声を要求するか、`/tts` を使用するか、Auto-TTS/ディレクティブ
音声を有効にしない限り、テキストのままです。
</Note>

## 対応プロバイダー

| プロバイダー          | 認証                                                                                                             | 注記                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（`AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION` も可）          | ネイティブ Ogg/Opus 音声メモ出力と電話通信。                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 互換 TTS。デフォルトは `hexgrad/Kokoro-82M`。                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` または `XI_API_KEY`                                                                             | 音声クローニング、多言語、`seed` による決定的出力。Discord 音声再生用にストリーミングされます。 |
| **Google Gemini** | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                                                                             | Gemini API バッチ TTS。`promptTemplate: "audio-profile-v1"` によりペルソナ対応。               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 音声メモと電話通信出力。                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | ストリーミング TTS API。ネイティブ Opus 音声メモと PCM 電話通信。                                |
| **Local CLI**     | なし                                                                                                             | 設定済みのローカル TTS コマンドを実行します。                                                        |
| **Microsoft**     | なし                                                                                                             | `node-edge-tts` 経由の公開 Edge neural TTS。ベストエフォートで、SLA はありません。                            |
| **MiniMax**       | `MINIMAX_API_KEY`（または Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`）      | T2A v2 API。デフォルトは `speech-2.8-hd`。                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 自動要約にも使用されます。ペルソナ `instructions` をサポートします。                                |
| **OpenRouter**    | `OPENROUTER_API_KEY`（`models.providers.openrouter.apiKey` を再利用可能）                                            | デフォルトモデルは `hexgrad/kokoro-82m`。                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY`（レガシー AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 画像、動画、音声の共有プロバイダー。                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI バッチ TTS。ネイティブ Opus 音声メモはサポート**されません**。                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi chat completions 経由の MiMo TTS。                                                   |

複数のプロバイダーが設定されている場合、選択されたものが最初に使用され、他のものは
フォールバックオプションになります。自動要約は `summaryModel`（または
`agents.defaults.model.primary`）を使用するため、要約を有効にしたままにする場合は、
そのプロバイダーも認証されている必要があります。

<Warning>
バンドルされた **Microsoft** プロバイダーは、`node-edge-tts` 経由で Microsoft Edge のオンライン neural TTS
サービスを使用します。公開 Web サービスであり、公開された
SLA やクォータはありません。ベストエフォートとして扱ってください。レガシープロバイダー ID `edge` は
`microsoft` に正規化され、`openclaw doctor --fix` は永続化済み
設定を書き換えます。新しい設定では常に `microsoft` を使用してください。
</Warning>

## 設定

TTS 設定は `~/.openclaw/openclaw.json` の `messages.tts` 配下にあります。
プリセットを選び、プロバイダーブロックを調整します。以下に示す `speakerVoice`/`speakerVoiceId`
フィールドが正規です。各プロバイダー独自の `voice`/`voiceId`/
`voiceName` フィールド名は、レガシーエイリアスとして引き続き動作します。

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
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
  <Tab title="Microsoft（キーなし）">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Xiaomi `mimo-v2.5-tts-voicedesign` では、`speakerVoice` を省略し、`style` を
音声デザインプロンプトに設定します。OpenClaw はそのプロンプトを TTS の `user` メッセージとして送信し、
voicedesign モデルには `audio.voice` を送信しません。

### エージェントごとの音声オーバーライド

あるエージェントが別のプロバイダー、音声、モデル、ペルソナ、または自動 TTS モードで話す必要がある場合は、`agents.list[].tts` を使用します。エージェントブロックは
`messages.tts` の上にディープマージされるため、プロバイダー認証情報はグローバルなプロバイダー設定に保持できます。

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

エージェントごとのペルソナを固定するには、プロバイダー設定と並べて `agents.list[].tts.persona` を設定します。これは、そのエージェントに対してのみグローバルな `messages.tts.persona` を上書きします。

自動返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールの優先順位:

1. `messages.tts`
2. アクティブな `agents.list[].tts`
3. チャンネルが `channels.<channel>.tts` をサポートする場合のチャンネル上書き
4. チャンネルが `channels.<channel>.accounts.<id>.tts` を渡す場合のアカウント上書き
5. このホストのローカル `/tts` 設定
6. [モデル上書き](#model-driven-directives) が有効な場合のインライン `[[tts:...]]` ディレクティブ

チャンネルおよびアカウントの上書きは `messages.tts` と同じ形を使用し、
先行するレイヤーの上にディープマージされます。そのため、共有プロバイダー認証情報は
`messages.tts` に保持しながら、チャンネルまたはボットアカウントでは話者音声、モデル、ペルソナ、
または自動モードだけを変更できます。

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
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## ペルソナ

**ペルソナ**は、プロバイダーをまたいで決定論的に適用できる安定した発話上のアイデンティティです。特定のプロバイダーを優先し、プロバイダーに依存しないプロンプト意図を定義し、音声、モデル、プロンプトテンプレート、シード、音声設定のプロバイダー固有バインディングを保持できます。

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
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
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
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

1. 設定されている場合は `/tts persona <id>` のローカル設定。
2. 設定されている場合は `messages.tts.persona`。
3. ペルソナなし。

プロバイダー選択は明示指定を優先して実行されます。

1. 直接上書き（CLI、Gateway、Talk、許可された TTS ディレクティブ）。
2. `/tts provider <id>` のローカル設定。
3. アクティブなペルソナの `provider`。
4. `messages.tts.provider`。
5. レジストリの自動選択。

各プロバイダー試行ごとに、OpenClaw はこの順序で設定をマージします。

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 信頼されたリクエスト上書き
4. 許可されたモデル出力 TTS ディレクティブ上書き

### プロバイダーがペルソナプロンプトを使用する方法

ペルソナプロンプトフィールド（`profile`、`scene`、`sampleContext`、`style`、`accent`、
`pacing`、`constraints`）は**プロバイダー非依存**です。各プロバイダーが
それらの使い方を決定します。

<AccordionGroup>
  <Accordion title="Google Gemini">
    実効 Google プロバイダー設定で `promptTemplate: "audio-profile-v1"`
    または `personaPrompt` が設定されている**場合のみ**、ペルソナプロンプトフィールドを Gemini TTS プロンプト構造でラップします。古い `audioProfile` および `speakerName` フィールドは、
    Google 固有のプロンプトテキストとして引き続き先頭に付加されます。
    `[[tts:text]]` ブロック内の `[whispers]` や `[laughs]` などのインライン音声タグは、
    Gemini トランスクリプト内で保持されます。OpenClaw はこれらのタグを生成しません。
  </Accordion>
  <Accordion title="OpenAI">
    明示的な OpenAI `instructions` が設定されていない**場合のみ**、ペルソナプロンプトフィールドをリクエストの `instructions` フィールドにマップします。明示的な `instructions` が常に優先されます。
  </Accordion>
  <Accordion title="その他のプロバイダー">
    `personas.<id>.providers.<provider>` 配下のプロバイダー固有ペルソナバインディングのみを使用します。プロバイダーが独自のペルソナプロンプトマッピングを実装していない限り、ペルソナプロンプトフィールドは無視されます。
  </Accordion>
</AccordionGroup>

### フォールバックポリシー

`fallbackPolicy` は、試行されるプロバイダーに対してペルソナに**バインディングがない**場合の動作を制御します。

| ポリシー            | 動作                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **デフォルト。** プロバイダー非依存プロンプトフィールドは利用可能なままです。プロバイダーはそれらを使用することも無視することもできます。        |
| `provider-defaults` | その試行のプロンプト準備からペルソナを省略します。ほかのプロバイダーへのフォールバックは継続しつつ、プロバイダーは中立的なデフォルトを使用します。 |
| `fail`              | `reasonCode: "not_configured"` および `personaBinding: "missing"` でそのプロバイダー試行をスキップします。フォールバックプロバイダーは引き続き試行されます。 |

TTS リクエスト全体が失敗するのは、試行されたプロバイダーが**すべて**スキップされるか失敗した場合だけです。

Talk セッションのプロバイダー選択はセッションスコープです。Talk クライアントは
`talk.catalog` からプロバイダー ID、モデル ID、音声 ID、ロケールを選択し、
Talk セッションまたはハンドオフリクエスト経由で渡す必要があります。音声セッションを開いても、
`messages.tts` やグローバルな Talk プロバイダーデフォルトを変更すべきではありません。

## モデル駆動ディレクティブ

デフォルトでは、アシスタントは `[[tts:...]]` ディレクティブを出力して、単一の返信に対して
音声、モデル、速度を上書きできます。加えて、音声のみに現れるべき表現上のキュー用に、任意の
`[[tts:text]]...[[/tts:text]]` ブロックも出力できます。

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

`messages.tts.auto` が `"tagged"` の場合、音声をトリガーするには**ディレクティブが必須**です。ストリーミングブロック配信は、隣接するブロックに分割されている場合でも、チャンネルに見える前に可視テキストからディレクティブを取り除きます。

`provider=...` は `modelOverrides.allowProvider: true` でない限り無視されます。返信が
`provider=...` を宣言した場合、そのディレクティブ内のほかのキーは
そのプロバイダーだけが解析します。サポートされないキーは取り除かれ、TTS
ディレクティブ警告として報告されます。

**利用可能なディレクティブキー:**

- `provider`（登録済みプロバイダー ID。`allowProvider: true` が必要）
- `speakerVoice` / `speakerVoiceId`（レガシーエイリアス: `voice`、`voiceName`、`voice_name`、`google_voice`、`voiceId`）
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量、0–10）
- `pitch`（MiniMax 整数ピッチ、−12 から 12。小数値は切り捨て）
- `emotion`（Volcengine 感情タグ）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**モデル上書きを完全に無効化:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**ほかの調整項目は設定可能なまま、プロバイダー切り替えを許可:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## スラッシュコマンド

単一コマンド `/tts`。Discord では、`/tts` が Discord 組み込みコマンドであるため、
OpenClaw は `/voice` も登録します。テキストの `/tts ...` は引き続き動作します。

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
コマンドには認可された送信者が必要です（許可リスト/所有者ルールが適用されます）。また、
`commands.text` またはネイティブコマンド登録のいずれかを有効にする必要があります。
</Note>

動作メモ:

- `/tts on` はローカル TTS 設定を `always` に書き込みます。`/tts off` は `off` に書き込みます。
- `/tts chat on|off|default` は、現在のチャットに対するセッションスコープの自動 TTS 上書きを書き込みます。
- `/tts persona <id>` はローカルペルソナ設定を書き込みます。`/tts persona off` はそれをクリアします。
- `/tts latest` は現在のセッショントランスクリプトから最新のアシスタント返信を読み取り、一度だけ音声として送信します。重複した音声送信を抑制するため、その返信のハッシュだけをセッションエントリに保存します。
- `/tts audio` は一回限りの音声返信を生成します（TTS はオンに**しません**）。
- `/tts limit <chars>` は **100–4096** を受け付けます（4096 は Telegram のキャプション/メッセージ最大値です）。範囲外の値は拒否されます。
- `limit` と `summary` はメイン設定ではなく、**ローカル設定**に保存されます。
- `/tts status` には、最新試行のフォールバック診断が含まれます。`Fallback: <primary> -> <used>`、`Attempts: ...`、および試行ごとの詳細（`provider:outcome(reasonCode) latency`）です。
- `/status` は、TTS が有効な場合に、設定済みプロバイダー、モデル、音声、およびサニタイズ済みのカスタムエンドポイントメタデータとともに、アクティブな TTS モードを表示します。

## ユーザーごとの設定

スラッシュコマンドはローカル上書きを `prefsPath` に書き込みます。デフォルトは
`~/.openclaw/settings/tts.json` です。`OPENCLAW_TTS_PREFS` 環境変数
または `messages.tts.prefsPath` で上書きできます。

| 保存フィールド | 効果                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| `auto`         | ローカル自動 TTS 上書き（`always`、`off`、…）                                    |
| `provider`     | ローカル主プロバイダー上書き                                                     |
| `persona`      | ローカルペルソナ上書き                                                           |
| `maxLength`    | 要約/切り詰めしきい値（デフォルトは `1500` 文字、`/tts limit` 範囲は 100–4096） |
| `summarize`    | 要約トグル（デフォルトは `true`）                                                 |

これらは、そのホストに対する `messages.tts` とアクティブな
`agents.list[].tts` ブロックから得られる実効設定を上書きします。

## 出力形式

TTS 音声配信は、チャンネルのケイパビリティによって駆動されます。チャンネル Plugin は、音声スタイルの TTS でプロバイダーにネイティブの `voice-note` ターゲットを要求するか、通常の `audio-file` 合成を維持するか、および送信前にチャンネルが非ネイティブ出力をトランスコードするかどうかを宣言します。

| ターゲット                            | 形式                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 音声ノート返信では **Opus**（ElevenLabs の `opus_48000_64`、OpenAI の `opus`）が優先されます。48 kHz / 64 kbps は明瞭さとサイズのバランスを取ります。 |
| その他のチャンネル                    | **MP3**（ElevenLabs の `mp3_44100_128`、OpenAI の `mp3`）。44.1 kHz / 128 kbps は音声のデフォルトのバランスです。                    |
| Talk / テレフォニー                   | プロバイダーのネイティブ **PCM**（Inworld 22050 Hz、Google 24 kHz）、またはテレフォニー向けの Gradium の `ulaw_8000`。                 |

プロバイダー別の注記:

- **Feishu / WhatsApp トランスコード:** 音声ノート返信が MP3/WebM/WAV/M4A または別の音声ファイルと思われる形式で到着した場合、チャンネル Plugin はネイティブ音声メッセージを送信する前に、`ffmpeg`（`libopus`、64 kbps）で 48 kHz Ogg/Opus にトランスコードします。WhatsApp は Baileys の `audio` ペイロードを通じて、`ptt: true` および `audio/ogg; codecs=opus` で結果を送信します。トランスコード失敗時: Feishu はエラーを捕捉し、元のファイルを通常の添付ファイルとして送信する処理にフォールバックします。WhatsApp にはフォールバックがないため、互換性のない PTT ペイロードを投稿するのではなく、送信自体が失敗します。
- **MiniMax:** 通常の音声添付では MP3（`speech-2.8-hd` モデル、32 kHz サンプルレート）を使用し、チャンネルが宣言した音声ノートターゲットでは `ffmpeg` で 48 kHz Opus にトランスコードされます。
- **Xiaomi MiMo:** デフォルトでは MP3、設定されている場合は WAV を使用し、チャンネルが宣言した音声ノートターゲットでは `ffmpeg` で 48 kHz Opus にトランスコードされます。
- **Local CLI:** 設定された `outputFormat` を使用します。音声ノートターゲットは Ogg/Opus に変換され、テレフォニー出力は `ffmpeg` で raw 16 kHz モノ PCM に変換されます。
- **Google Gemini:** raw 24 kHz PCM を返します。OpenClaw は音声添付用にそれを WAV としてラップし、音声ノートターゲット用に 48 kHz Opus へトランスコードし、Talk/テレフォニー向けには PCM を直接返します。
- **Gradium:** 音声添付では WAV、音声ノートターゲットでは Opus、テレフォニーでは 8 kHz の `ulaw_8000` を使用します。
- **Inworld:** 通常の音声添付では MP3、音声ノートターゲットではネイティブ `OGG_OPUS`、Talk/テレフォニーでは 22050 Hz の raw `PCM` を使用します。
- **xAI:** デフォルトでは MP3 です。`responseFormat` は `mp3`、`wav`、`pcm`、`mulaw`、または `alaw` にできます。xAI のバッチ REST TTS エンドポイントを使用し、完全な音声添付を返します。このプロバイダーパスでは xAI のストリーミング TTS WebSocket は使用されません。ネイティブ Opus 音声ノート形式はサポートされていません。
- **Microsoft:** `microsoft.outputFormat`（デフォルトは `audio-24khz-48kbitrate-mono-mp3`）を使用します。
  - バンドルされたトランスポートは `outputFormat` を受け入れますが、すべての形式がサービスから利用できるわけではありません。
  - 出力形式の値は Microsoft Speech の出力形式（Ogg/WebM Opus を含む）に従います。
  - Telegram `sendVoice` は OGG/MP3/M4A を受け入れます。Opus 音声メッセージを保証する必要がある場合は OpenAI/ElevenLabs を使用してください。
  - 設定された Microsoft 出力形式が失敗した場合、OpenClaw は MP3 で再試行します。
  - 明示的な音声オーバーライドが設定されておらず、デフォルトの英語音声が使用されている場合、返信テキストが CJK 優勢なら、OpenClaw は中国語ニューラル音声（`zh-CN-XiaoxiaoNeural`、`zh-CN` ロケール）へ自動的に切り替えます。

OpenAI と ElevenLabs の出力形式は、上記のとおりチャンネルごとに固定されています。

## Auto-TTS の動作

`messages.tts.auto` が有効な場合、OpenClaw は次を行います。

- 返信に構造化メディアがすでに含まれている場合は TTS をスキップします。
- 非常に短い返信（10 文字未満）をスキップします。
- 要約が有効な場合、`summaryModel`（または `agents.defaults.model.primary`）を使用して長い返信を要約します。
- 生成された音声を返信に添付します。
- `mode: "final"` では、テキストストリームの完了後も、ストリーミングされた最終返信に対して音声のみの TTS を送信します。生成されたメディアは、通常の返信添付と同じチャンネルメディア正規化を通ります。

返信が `maxLength` を超える場合、OpenClaw は音声を完全にスキップすることはありません。

- **要約オン**（デフォルト）で、要約モデルが利用可能な場合: テキストをおおよそ `maxLength` 文字に要約し、その要約を合成します。
- **要約オフ**、要約が失敗した場合、または要約モデル用の API キーが利用できない場合: テキストを `maxLength` 文字に切り詰め、切り詰めたテキストを合成します。

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled and available?
                            no  -> truncate -> TTS -> attach audio
                            yes -> summarize -> TTS -> attach audio
```

## フィールドリファレンス

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自動TTSモード。`inbound` は受信した音声メッセージの後にのみ音声を送信します。`tagged` は返信に `[[tts:...]]` ディレクティブまたは `[[tts:text]]` ブロックが含まれる場合にのみ音声を送信します。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      レガシーなトグル。`openclaw doctor --fix` はこれを `auto` に移行します。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` は最終返信に加えてツール/ブロック返信も含めます。
    </ParamField>
    <ParamField path="provider" type="string">
      音声プロバイダーID。未設定の場合、OpenClaw はレジストリの自動選択順で最初に設定済みのプロバイダーを使用します。レガシーな `provider: "edge"` は `openclaw doctor --fix` により `"microsoft"` に書き換えられます。
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` からのアクティブなペルソナID。小文字に正規化されます。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      安定した音声アイデンティティ。フィールド: `label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。[ペルソナ](#personas)を参照してください。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      自動要約用の低コストモデル。デフォルトは `agents.defaults.model.primary`。`provider/model` または設定済みのモデルエイリアスを受け付けます。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      モデルがTTSディレクティブを出力できるようにします。`enabled` のデフォルトは `true`、`allowProvider` のデフォルトは `false` です。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      音声プロバイダーIDをキーにした、プロバイダー所有の設定。レガシーな直接ブロック（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）は `openclaw doctor --fix` により書き換えられます。コミットするのは `messages.tts.providers.<id>` のみです。
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      TTS入力文字数のハード上限。超過した場合、`/tts audio`、`tts.convert`、`tts.speak` は失敗します。
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      リクエストタイムアウト（ミリ秒）。呼び出しごとの `timeoutMs`（エージェントツール、gateway）が設定されている場合はそれが優先されます。それ以外の場合は、明示的に設定された `messages.tts.timeoutMs` が、Plugin作成のプロバイダーデフォルトより優先されます。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      ローカル設定JSONパス（プロバイダー/上限/要約）を上書きします。デフォルトは `~/.openclaw/settings/tts.json` です。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">環境変数: `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY`、または `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speechリージョン（例: `eastus`）。環境変数: `AZURE_SPEECH_REGION` または `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">任意のAzure Speechエンドポイント上書き（エイリアス `baseUrl`）。</ParamField>
    <ParamField path="speakerVoice" type="string">Azure音声のShortName。デフォルトは `en-US-JennyNeural`。レガシーエイリアス: `voice`。</ParamField>
    <ParamField path="lang" type="string">SSML言語コード。デフォルトは `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">標準音声用のAzure `X-Microsoft-OutputFormat`。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">ボイスノート出力用のAzure `X-Microsoft-OutputFormat`。デフォルトは `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` または `XI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">モデルID。デフォルトは `eleven_multilingual_v2`。レガシーID `eleven_turbo_v2_5`/`eleven_turbo_v2` は対応する `flash` モデルに正規化されます。</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs音声ID。デフォルトは `pMsXgVXv3BLzUgSXRplE`。レガシーエイリアス: `voiceId`。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（各 `0..1`、デフォルトは `0.5`/`0.75`/`0`）、`useSpeakerBoost`（`true|false`、デフォルトは `true`）、`speed`（`0.5..2.0`、デフォルトは `1.0`）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>テキスト正規化モード。</ParamField>
    <ParamField path="languageCode" type="string">2文字のISO 639-1（例: `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">ベストエフォートの決定性のための整数 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs APIのベースURLを上書きします。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` にフォールバックします。省略した場合、TTSは環境変数へのフォールバック前に `models.providers.google.apiKey` を再利用できます。</ParamField>
    <ParamField path="model" type="string">Gemini TTSモデル。デフォルトは `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="speakerVoice" type="string">Geminiの事前構築済み音声名。デフォルトは `Kore`。レガシーエイリアス: `voiceName`、`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">読み上げテキストの前に付加される自然言語のスタイルプロンプト。</ParamField>
    <ParamField path="speakerName" type="string">プロンプトで名前付き話者を使用する場合に、読み上げテキストの前に付加される任意の話者ラベル。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>アクティブなペルソナプロンプトフィールドを決定的なGemini TTSプロンプト構造でラップするには、`audio-profile-v1` に設定します。</ParamField>
    <ParamField path="personaPrompt" type="string">テンプレートのDirector's Notesに追加される、Google固有の追加ペルソナプロンプトテキスト。</ParamField>
    <ParamField path="baseUrl" type="string">`https://generativelanguage.googleapis.com` のみ受け付けられます。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">環境変数: `GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.gradium.ai`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">デフォルトはEmma（`YTpq7expH9539ERJ`）。レガシーエイリアス: `voiceId`。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld primary

    <ParamField path="apiKey" type="string">環境変数: `INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">デフォルトは `inworld-tts-1.5-max`。ほかに: `inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">デフォルトは `Sarah`。レガシーエイリアス: `voiceId`。</ParamField>
    <ParamField path="temperature" type="number">サンプリング温度 `0..2`（0は含まない）。</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS用のローカル実行ファイルまたはコマンド文字列。</ParamField>
    <ParamField path="args" type="string[]">コマンド引数。`{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` プレースホルダーをサポートします。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>想定されるCLI出力形式。音声添付のデフォルトは `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">コマンドのタイムアウト（ミリ秒）。デフォルトは `120000`。</ParamField>
    <ParamField path="cwd" type="string">任意のコマンド作業ディレクトリ。</ParamField>
    <ParamField path="env" type="Record<string, string>">コマンド用の任意の環境変数オーバーライド。</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft音声の使用を許可します。</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoftニューラル音声名（例: `en-US-MichelleNeural`）。レガシーエイリアス: `voice`。デフォルトの英語音声が有効で、返信テキストがCJK主体の場合、OpenClawは `zh-CN-XiaoxiaoNeural` に自動切り替えします。</ParamField>
    <ParamField path="lang" type="string">言語コード（例: `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft出力形式。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。バンドルされたEdgeバックエンドのトランスポートでは、すべての形式がサポートされるわけではありません。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">パーセント文字列（例: `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">音声ファイルの横にJSON字幕を書き込みます。</ParamField>
    <ParamField path="proxy" type="string">Microsoft音声リクエスト用のプロキシURL。</ParamField>
    <ParamField path="timeoutMs" type="number">リクエストタイムアウトのオーバーライド（ms）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>レガシーエイリアス。永続化された設定を `providers.microsoft` に書き換えるには `openclaw doctor --fix` を実行します。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` にフォールバックします。Token Plan認証は `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、または `MINIMAX_CODING_API_KEY` 経由です。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.minimax.io`。環境変数: `MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `speech-2.8-hd`。環境変数: `MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">デフォルトは `English_expressive_narrator`。環境変数: `MINIMAX_TTS_VOICE_ID`。レガシーエイリアス: `voiceId`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。デフォルトは `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。デフォルトは `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。デフォルトは `0`。小数値はリクエスト前に切り捨てられます。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">OpenAI TTSモデルID。デフォルトは `gpt-4o-mini-tts`。</ParamField>
    <ParamField path="speakerVoice" type="string">音声名（例: `alloy`、`cedar`）。デフォルトは `coral`。レガシーエイリアス: `voice`。</ParamField>
    <ParamField path="instructions" type="string">明示的なOpenAI `instructions` フィールド。設定されている場合、ペルソナプロンプトフィールドは自動マッピングされません。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">生成されたOpenAI TTSフィールドの後に、`/audio/speech` リクエスト本文へマージされる追加JSONフィールド。Kokoroのように `lang` などプロバイダー固有キーを必要とするOpenAI互換エンドポイントに使用します。安全でないプロトタイプキーは無視されます。</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTSエンドポイントをオーバーライドします。解決順序: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。デフォルト以外の値はOpenAI互換TTSエンドポイントとして扱われるため、カスタムモデル名と音声名が受け入れられ、`speed` は `0.25..4.0` の範囲チェックを失います。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">環境変数: `OPENROUTER_API_KEY`。`models.providers.openrouter.apiKey` を再利用できます。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://openrouter.ai/api/v1`。レガシーの `https://openrouter.ai/v1` は正規化されます。</ParamField>
    <ParamField path="model" type="string">デフォルトは `hexgrad/kokoro-82m`。エイリアス: `modelId`。</ParamField>
    <ParamField path="speakerVoice" type="string">デフォルトは `af_alloy`。レガシーエイリアス: `voice`、`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>デフォルトは `mp3`。</ParamField>
    <ParamField path="speed" type="number">プロバイダー固有の速度オーバーライド。</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">環境変数: `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">デフォルトは `seed-tts-1.0`。環境変数: `VOLCENGINE_TTS_RESOURCE_ID`。プロジェクトにTTS 2.0権限がある場合は `seed-tts-2.0` を使用します。</ParamField>
    <ParamField path="appKey" type="string">アプリキーのヘッダー。デフォルトは `aGjiRDfUWi`。環境変数: `VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTPエンドポイントをオーバーライドします。環境変数: `VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="speakerVoice" type="string">音声タイプ。デフォルトは `en_female_anna_mars_bigtts`。環境変数: `VOLCENGINE_TTS_VOICE`。レガシーエイリアス: `voice`。</ParamField>
    <ParamField path="speedRatio" type="number">プロバイダー固有の速度比、`0.2..3`。</ParamField>
    <ParamField path="emotion" type="string">プロバイダー固有の感情タグ。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>レガシーのVolcengine Speech Consoleフィールド。環境変数: `VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（デフォルトは `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">環境変数: `XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.x.ai/v1`。環境変数: `XAI_BASE_URL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">デフォルトは `eve`。ライブ音声: `ara`、`eve`、`leo`、`rex`、`sal`、`una`。レガシーエイリアス: `voiceId`。</ParamField>
    <ParamField path="language" type="string">BCP-47言語コードまたは `auto`。デフォルトは `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>デフォルトは `mp3`。</ParamField>
    <ParamField path="speed" type="number">プロバイダー固有の速度オーバーライド、`0.7..1.5`。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">環境変数: `XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.xiaomimimo.com/v1`。環境変数: `XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `mimo-v2.5-tts`。環境変数: `XIAOMI_TTS_MODEL`。`mimo-v2-tts` と `mimo-v2.5-tts-voicedesign` もサポートします。</ParamField>
    <ParamField path="speakerVoice" type="string">プリセット音声モデルのデフォルトは `mimo_default`。環境変数: `XIAOMI_TTS_VOICE`。レガシーエイリアス: `voice`。`mimo-v2.5-tts-voicedesign` では送信されません。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>デフォルトは `mp3`。環境変数: `XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">ユーザーメッセージとして送信される任意の自然言語スタイル指示。読み上げられません。`mimo-v2.5-tts-voicedesign` では、これは音声デザインプロンプトです。省略時はOpenClawがデフォルトを提供します。</ParamField>
  </Accordion>
</AccordionGroup>

## エージェントツール

`tts` ツールはテキストを音声に変換し、返信配信用の音声添付を返します。Feishu、Matrix、Telegram、WhatsAppでは、音声はファイル添付ではなくボイスメッセージとして配信されます。FeishuとWhatsAppは、この経路で `ffmpeg` が利用可能な場合、Opus以外のTTS出力をトランスコードできます。

WhatsAppはBaileys経由でPTTボイスノート（`ptt: true` を持つ `audio`）として音声を送信し、表示テキストはPTT音声とは**別に**送信します。これは、クライアントがボイスノートのキャプションを一貫して表示しないためです。

このツールは任意の `channel` フィールドと `timeoutMs` フィールドを受け付けます。`timeoutMs` は呼び出しごとのプロバイダーリクエストタイムアウト（ミリ秒）です。呼び出しごとの値は `messages.tts.timeoutMs` をオーバーライドします。設定されたTTSタイムアウトは、Plugin作成のプロバイダーデフォルトより優先されます。

## Gateway RPC

| メソッド          | 目的                                         |
| ----------------- | -------------------------------------------- |
| `tts.status`      | 現在のTTS状態と最後の試行を読み取ります。   |
| `tts.enable`      | ローカル自動設定を `always` に設定します。  |
| `tts.disable`     | ローカル自動設定を `off` に設定します。     |
| `tts.convert`     | 一回限りのテキスト → 音声。                 |
| `tts.setProvider` | ローカルプロバイダー設定を設定します。       |
| `tts.personas`    | 設定済みペルソナとアクティブなものを一覧表示します。 |
| `tts.setPersona`  | ローカルペルソナ設定を設定します。           |
| `tts.providers`   | 設定済みプロバイダーとステータスを一覧表示します。 |

## サービスリンク

- [OpenAIテキスト読み上げガイド](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio APIリファレンス](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech RESTテキスト読み上げ](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speechプロバイダー](/ja-JP/providers/azure-speech)
- [ElevenLabsテキスト読み上げ](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs認証](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ja-JP/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/ja-JP/providers/volcengine#text-to-speech)
- [Xiaomi MiMo音声合成](/ja-JP/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech出力形式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAIテキスト読み上げ](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 関連

- [メディア概要](/ja-JP/tools/media-overview)
- [音楽生成](/ja-JP/tools/music-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [音声通話Plugin](/ja-JP/plugins/voice-call)

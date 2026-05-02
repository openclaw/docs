---
read_when:
    - 返信でテキスト読み上げを有効にする
    - TTSプロバイダー、フォールバックチェーン、またはペルソナの設定
    - /tts コマンドまたはディレクティブの使用
sidebarTitle: Text to speech (TTS)
summary: 送信される返信のテキスト読み上げ — プロバイダー、ペルソナ、スラッシュコマンド、チャンネルごとの出力
title: テキスト読み上げ
x-i18n:
    generated_at: "2026-05-02T22:23:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: daf4d7bc86afe14f7c181eee56e2bc77906ed78b4aaabb2fc855847f5a4366f9
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw は送信返信を **14 の音声プロバイダー** にわたって音声に変換し、
Feishu、Matrix、Telegram、WhatsApp ではネイティブ音声メッセージとして、
その他では音声添付ファイルとして、テレフォニーと Talk では PCM/Ulaw ストリームとして配信できます。

## クイックスタート

<Steps>
  <Step title="プロバイダーを選ぶ">
    OpenAI と ElevenLabs は、ホスト型の選択肢として最も信頼性があります。Microsoft と
    Local CLI は API キーなしで動作します。全一覧は [プロバイダーマトリクス](#supported-providers)
    を参照してください。
  </Step>
  <Step title="API キーを設定する">
    プロバイダーの環境変数をエクスポートします（例: `OPENAI_API_KEY`,
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
    `/tts status` は現在の状態を表示します。`/tts audio Hello from OpenClaw`
    は一回限りの音声返信を送信します。
  </Step>
</Steps>

<Note>
Auto-TTS はデフォルトで **オフ** です。`messages.tts.provider` が未設定の場合、
OpenClaw はレジストリの自動選択順で、最初に設定済みのプロバイダーを選びます。
組み込みの `tts` エージェントツールは明示的な意図がある場合専用です。通常のチャットは、
ユーザーが音声を要求するか、`/tts` を使うか、Auto-TTS/directive
speech を有効にしない限り、テキストのままです。
</Note>

## 対応プロバイダー

| プロバイダー      | 認証                                                                                                             | 注記                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（`AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION` も可）          | ネイティブ Ogg/Opus 音声メモ出力とテレフォニー。                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 互換 TTS。デフォルトは `hexgrad/Kokoro-82M`。                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` または `XI_API_KEY`                                                                         | 音声クローニング、多言語、`seed` による決定性。                         |
| **Google Gemini** | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                                                                         | Gemini API TTS。`promptTemplate: "audio-profile-v1"` によるペルソナ対応。 |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 音声メモとテレフォニー出力。                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | ストリーミング TTS API。ネイティブ Opus 音声メモと PCM テレフォニー。    |
| **Local CLI**     | なし                                                                                                             | 設定済みのローカル TTS コマンドを実行します。                           |
| **Microsoft**     | なし                                                                                                             | `node-edge-tts` 経由の公開 Edge neural TTS。ベストエフォート、SLA なし。 |
| **MiniMax**       | `MINIMAX_API_KEY`（または Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`） | T2A v2 API。デフォルトは `speech-2.8-hd`。                              |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 自動要約にも使用。ペルソナ `instructions` をサポート。                  |
| **OpenRouter**    | `OPENROUTER_API_KEY`（`models.providers.openrouter.apiKey` を再利用可）                                          | デフォルトモデルは `hexgrad/kokoro-82m`。                               |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY`（レガシー AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 画像、動画、音声の共有プロバイダー。                                    |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI バッチ TTS。ネイティブ Opus 音声メモはサポート**されていません**。   |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi chat completions 経由の MiMo TTS。                               |

複数のプロバイダーが設定されている場合、選択されたものが最初に使われ、
他はフォールバックの選択肢になります。自動要約は `summaryModel`（または
`agents.defaults.model.primary`）を使うため、要約を有効にしたままにする場合は、
そのプロバイダーも認証されている必要があります。

<Warning>
バンドルされている **Microsoft** プロバイダーは、`node-edge-tts` 経由で
Microsoft Edge のオンライン neural TTS サービスを使います。これは公開 Web サービスであり、
公開された SLA やクォータはありません。ベストエフォートとして扱ってください。
レガシープロバイダー ID `edge` は `microsoft` に正規化され、`openclaw doctor --fix`
は永続化された設定を書き換えます。新しい設定では常に `microsoft` を使ってください。
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
  <Tab title="Microsoft（キー不要）">
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

1 つのエージェントに異なるプロバイダー、音声、モデル、ペルソナ、または Auto-TTS モードで話させたい場合は、
`agents.list[].tts` を使います。エージェントブロックは `messages.tts` にディープマージされるため、
プロバイダー認証情報はグローバルプロバイダー設定に置いたままにできます。

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

エージェントごとのペルソナを固定するには、プロバイダー設定と並べて
`agents.list[].tts.persona` を設定します。これは、そのエージェントに対してのみ
グローバルな `messages.tts.persona` をオーバーライドします。

自動返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールの優先順位:

1. `messages.tts`
2. アクティブな `agents.list[].tts`
3. チャネルが `channels.<channel>.tts` をサポートする場合のチャネルオーバーライド
4. チャネルが `channels.<channel>.accounts.<id>.tts` を渡す場合のアカウントオーバーライド
5. このホストのローカル `/tts` 環境設定
6. [モデルオーバーライド](#model-driven-directives)が有効な場合のインライン `[[tts:...]]` ディレクティブ

チャネルオーバーライドとアカウントオーバーライドは `messages.tts` と同じ形を使い、
前のレイヤーに対してディープマージされます。そのため、共有プロバイダー認証情報は
`messages.tts` に残したまま、チャネルまたはボットアカウントでは音声、モデル、ペルソナ、
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

**ペルソナ**は、プロバイダー全体に決定論的に適用できる安定した発話アイデンティティです。
1つのプロバイダーを優先し、プロバイダー非依存のプロンプト意図を定義し、
音声、モデル、プロンプトテンプレート、シード、音声設定のプロバイダー固有バインディングを保持できます。

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

### ペルソナの解決

アクティブなペルソナは決定論的に選択されます。

1. 設定されている場合は `/tts persona <id>` のローカル環境設定。
2. 設定されている場合は `messages.tts.persona`。
3. ペルソナなし。

プロバイダー選択は明示指定を優先して実行されます。

1. 直接オーバーライド（CLI、Gateway、Talk、許可された TTS ディレクティブ）。
2. `/tts provider <id>` のローカル環境設定。
3. アクティブなペルソナの `provider`。
4. `messages.tts.provider`。
5. レジストリの自動選択。

各プロバイダー試行について、OpenClaw は次の順序で設定をマージします。

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 信頼されたリクエストオーバーライド
4. 許可された、モデルが出力した TTS ディレクティブオーバーライド

### プロバイダーがペルソナプロンプトを使う方法

ペルソナプロンプトフィールド（`profile`、`scene`、`sampleContext`、`style`、`accent`、
`pacing`、`constraints`）は**プロバイダー非依存**です。各プロバイダーがそれらの使い方を決定します。

<AccordionGroup>
  <Accordion title="Google Gemini">
    有効な Google プロバイダー設定が `promptTemplate: "audio-profile-v1"`
    または `personaPrompt` を設定している**場合にのみ**、ペルソナプロンプトフィールドを Gemini TTS プロンプト構造でラップします。
    古い `audioProfile` フィールドと `speakerName` フィールドは、
    Google 固有のプロンプトテキストとして引き続き先頭に追加されます。`[[tts:text]]` ブロック内の
    `[whispers]` や `[laughs]` などのインライン音声タグは
    Gemini トランスクリプト内で保持されます。OpenClaw はこれらのタグを生成しません。
  </Accordion>
  <Accordion title="OpenAI">
    明示的な OpenAI `instructions` が設定されていない**場合にのみ**、
    ペルソナプロンプトフィールドをリクエストの `instructions` フィールドにマッピングします。明示的な `instructions`
    は常に優先されます。
  </Accordion>
  <Accordion title="Other providers">
    `personas.<id>.providers.<provider>` 配下のプロバイダー固有ペルソナバインディングだけを使います。
    プロバイダーが独自のペルソナプロンプトマッピングを実装していない限り、ペルソナプロンプトフィールドは無視されます。
  </Accordion>
</AccordionGroup>

### フォールバックポリシー

`fallbackPolicy` は、ペルソナに試行対象プロバイダーの**バインディングがない**場合の動作を制御します。

| ポリシー            | 動作                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **デフォルト。** プロバイダー非依存プロンプトフィールドは引き続き利用できます。プロバイダーはそれらを使うことも無視することもできます。        |
| `provider-defaults` | その試行のプロンプト準備ではペルソナが省略されます。プロバイダーは中立的なデフォルトを使い、他のプロバイダーへのフォールバックは継続します。 |
| `fail`              | そのプロバイダー試行を `reasonCode: "not_configured"` および `personaBinding: "missing"` でスキップします。フォールバックプロバイダーは引き続き試行されます。 |

TTS リクエスト全体が失敗するのは、試行された**すべて**のプロバイダーがスキップされるか失敗した場合だけです。

## モデル駆動ディレクティブ

デフォルトでは、アシスタントは `[[tts:...]]` ディレクティブを出力して、1つの返信だけ音声、モデル、または速度をオーバーライドできます。さらに、音声のみに現れる表現キュー用に任意の
`[[tts:text]]...[[/tts:text]]` ブロックを出力できます。

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

`messages.tts.auto` が `"tagged"` の場合、音声をトリガーするには**ディレクティブが必須**です。
ストリーミングブロック配信では、隣接するブロックに分割されていても、チャネルに表示される前に可視テキストからディレクティブが取り除かれます。

`provider=...` は `modelOverrides.allowProvider: true` でない限り無視されます。
返信で `provider=...` が宣言されている場合、そのディレクティブ内の他のキーはそのプロバイダーだけによって解析されます。
サポートされていないキーは取り除かれ、TTS ディレクティブ警告として報告されます。

**利用可能なディレクティブキー:**

- `provider`（登録済みプロバイダー ID。`allowProvider: true` が必要）
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量、0–10）
- `pitch`（MiniMax 整数ピッチ、−12 から 12。小数値は切り捨て）
- `emotion`（Volcengine 感情タグ）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**モデルオーバーライドを完全に無効化する:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**他のノブを設定可能に保ったままプロバイダー切り替えを許可する:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## スラッシュコマンド

単一コマンド `/tts`。Discord では、`/tts` が組み込みの Discord コマンドであるため、
OpenClaw は `/voice` も登録します。テキストの `/tts ...` は引き続き機能します。

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
コマンドには認可された送信者が必要です（allowlist/owner ルールが適用されます）。また、
`commands.text` またはネイティブコマンド登録が有効でなければなりません。
</Note>

動作メモ:

- `/tts on` はローカル TTS 環境設定を `always` に書き込みます。`/tts off` は `off` に書き込みます。
- `/tts chat on|off|default` は現在のチャットに対してセッションスコープの自動 TTS オーバーライドを書き込みます。
- `/tts persona <id>` はローカルペルソナ環境設定を書き込みます。`/tts persona off` はそれをクリアします。
- `/tts latest` は現在のセッショントランスクリプトから最新のアシスタント返信を読み取り、1回だけ音声として送信します。重複した音声送信を抑制するため、その返信のハッシュだけをセッションエントリに保存します。
- `/tts audio` は単発の音声返信を生成します（TTS は**オンに切り替えません**）。
- `limit` と `summary` はメイン設定ではなく、**ローカル環境設定**に保存されます。
- `/tts status` には最新試行のフォールバック診断が含まれます。`Fallback: <primary> -> <used>`、`Attempts: ...`、および試行ごとの詳細（`provider:outcome(reasonCode) latency`）です。
- `/status` は、TTS が有効な場合に、アクティブな TTS モードに加えて、設定済みのプロバイダー、モデル、音声、サニタイズ済みカスタムエンドポイントメタデータを表示します。

## ユーザーごとの環境設定

スラッシュコマンドはローカルオーバーライドを `prefsPath` に書き込みます。デフォルトは
`~/.openclaw/settings/tts.json` です。`OPENCLAW_TTS_PREFS` 環境変数
または `messages.tts.prefsPath` でオーバーライドできます。

| 保存フィールド | 効果                                         |
| ------------ | -------------------------------------------- |
| `auto`       | ローカル自動 TTS オーバーライド（`always`、`off`、…） |
| `provider`   | ローカルプライマリプロバイダーオーバーライド |
| `persona`    | ローカルペルソナオーバーライド               |
| `maxLength`  | 要約しきい値（デフォルト `1500` 文字）       |
| `summarize`  | 要約トグル（デフォルト `true`）              |

これらは、そのホストの `messages.tts` とアクティブな
`agents.list[].tts` ブロックから得られる有効設定をオーバーライドします。

## 出力形式（固定）

TTS 音声配信はチャネル機能によって駆動されます。チャネル Plugin は、
音声スタイル TTS でプロバイダーにネイティブの `voice-note` ターゲットを要求するべきか、
通常の `audio-file` 合成を維持して互換性のある出力に音声配信用のマークを付けるだけにするべきかを通知します。

- **音声メモ対応チャンネル**: 音声メモ返信では Opus を優先します（ElevenLabs では `opus_48000_64`、OpenAI では `opus`）。
  - 48kHz / 64kbps は、音声メッセージとして適切なトレードオフです。
- **Feishu / WhatsApp**: 音声メモ返信が MP3/WebM/WAV/M4A
  または別の音声ファイルらしい形式として生成された場合、チャンネル Plugin はネイティブ音声メッセージを送信する前に、`ffmpeg` でそれを 48kHz
  Ogg/Opus にトランスコードします。WhatsApp は
  その結果を Baileys の `audio` ペイロードで `ptt: true` および
  `audio/ogg; codecs=opus` として送信します。変換に失敗した場合、Feishu は元の
  ファイルを添付ファイルとして受け取ります。WhatsApp の送信は、互換性のない
  PTT ペイロードを投稿するのではなく失敗します。
- **BlueBubbles**: プロバイダー合成を通常の音声ファイル経路のままにします。MP3
  および CAF 出力は iMessage 音声メモ配信用としてマークされます。
- **その他のチャンネル**: MP3（ElevenLabs では `mp3_44100_128`、OpenAI では `mp3`）。
  - 44.1kHz / 128kbps は、音声の明瞭さに対するデフォルトのバランスです。
- **MiniMax**: 通常の音声添付には MP3（`speech-2.8-hd` モデル、32kHz サンプルレート）を使用します。チャンネルが提示する音声メモターゲットでは、チャンネルがトランスコードを提示している場合、OpenClaw は配信前に MiniMax MP3 を `ffmpeg` で 48kHz Opus にトランスコードします。
- **Xiaomi MiMo**: デフォルトでは MP3、設定されている場合は WAV を使用します。チャンネルが提示する音声メモターゲットでは、チャンネルがトランスコードを提示している場合、OpenClaw は配信前に Xiaomi 出力を `ffmpeg` で 48kHz Opus にトランスコードします。
- **ローカル CLI**: 設定された `outputFormat` を使用します。音声メモターゲットは
  Ogg/Opus に変換され、テレフォニー出力は `ffmpeg` で raw 16 kHz mono PCM
  に変換されます。
- **Google Gemini**: Gemini API TTS は raw 24kHz PCM を返します。OpenClaw は音声添付用にそれを WAV としてラップし、音声メモターゲット用には 48kHz Opus にトランスコードし、Talk/テレフォニー用には PCM を直接返します。
- **Gradium**: 音声添付には WAV、音声メモターゲットには Opus、テレフォニーには 8 kHz の `ulaw_8000` を使用します。
- **Inworld**: 通常の音声添付には MP3、音声メモターゲットにはネイティブ `OGG_OPUS`、Talk/テレフォニーには 22050 Hz の raw `PCM` を使用します。
- **xAI**: デフォルトでは MP3 を使用します。`responseFormat` は `mp3`、`wav`、`pcm`、`mulaw`、または `alaw` にできます。OpenClaw は xAI のバッチ REST TTS エンドポイントを使用し、完全な音声添付を返します。xAI のストリーミング TTS WebSocket は、このプロバイダー経路では使用されません。ネイティブ Opus 音声メモ形式は、この経路ではサポートされません。
- **Microsoft**: `microsoft.outputFormat` を使用します（デフォルトは `audio-24khz-48kbitrate-mono-mp3`）。
  - バンドルされたトランスポートは `outputFormat` を受け付けますが、すべての形式がサービスから利用できるわけではありません。
  - 出力形式の値は Microsoft Speech の出力形式（Ogg/WebM Opus を含む）に従います。
  - Telegram `sendVoice` は OGG/MP3/M4A を受け付けます。Opus 音声メッセージが
    確実に必要な場合は OpenAI/ElevenLabs を使用してください。
  - 設定された Microsoft 出力形式が失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI/ElevenLabs の出力形式はチャンネルごとに固定されています（上記を参照）。

## Auto-TTS の動作

`messages.tts.auto` が有効な場合、OpenClaw は次のように動作します。

- 返信にすでにメディアまたは `MEDIA:` ディレクティブが含まれている場合は TTS をスキップします。
- 非常に短い返信（10 文字未満）はスキップします。
- 要約が有効な場合は、`summaryModel`（または `agents.defaults.model.primary`）を使用して
  長い返信を要約します。
- 生成された音声を返信に添付します。
- `mode: "final"` では、テキストストリーム完了後も、ストリーミングされた最終返信に対して
  音声のみの TTS を送信します。生成されたメディアは、通常の返信添付と同じ
  チャンネルメディア正規化を通ります。

返信が `maxLength` を超えていて、要約がオフの場合（または要約モデル用の API キーがない場合）、
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

  | ターゲット                                | 形式                                                                                                                                |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | 音声メモの返信では **Opus**（ElevenLabs の `opus_48000_64`、OpenAI の `opus`）を優先します。48 kHz / 64 kbps は明瞭さとサイズのバランスを取ります。 |
  | その他のチャネル                        | **MP3**（ElevenLabs の `mp3_44100_128`、OpenAI の `mp3`）。音声のデフォルトは 44.1 kHz / 128 kbps です。                                 |
  | Talk / テレフォニー                      | プロバイダー標準の **PCM**（Inworld 22050 Hz、Google 24 kHz）、またはテレフォニー向けには Gradium の `ulaw_8000`。                                 |

  プロバイダーごとの注記:

  - **Feishu / WhatsApp のトランスコード:** 音声メモの返信が MP3/WebM/WAV/M4A として届いた場合、チャネル Plugin は `ffmpeg` を使って 48 kHz Ogg/Opus にトランスコードします。WhatsApp は Baileys 経由で `ptt: true` と `audio/ogg; codecs=opus` を指定して送信します。変換に失敗した場合: Feishu は元のファイルを添付するフォールバックを行い、WhatsApp は互換性のない PTT ペイロードを投稿するのではなく送信に失敗します。
  - **MiniMax / Xiaomi MiMo:** デフォルトは MP3（MiniMax `speech-2.8-hd` では 32 kHz）です。音声メモターゲット向けには `ffmpeg` で 48 kHz Opus にトランスコードされます。
  - **ローカル CLI:** 設定された `outputFormat` を使用します。音声メモターゲットは Ogg/Opus に変換され、テレフォニー出力は未加工の 16 kHz モノラル PCM に変換されます。
  - **Google Gemini:** 未加工の 24 kHz PCM を返します。OpenClaw は添付向けには WAV としてラップし、音声メモターゲット向けには 48 kHz Opus にトランスコードし、Talk/テレフォニー向けには PCM を直接返します。
  - **Inworld:** MP3 添付、標準の `OGG_OPUS` 音声メモ、Talk/テレフォニー向けの未加工 `PCM` 22050 Hz。
  - **xAI:** デフォルトは MP3 です。`responseFormat` は `mp3|wav|pcm|mulaw|alaw` にできます。xAI のバッチ REST エンドポイントを使用します。ストリーミング WebSocket TTS は使用**しません**。標準の Opus 音声メモ形式はサポート**されていません**。
  - **Microsoft:** `microsoft.outputFormat`（デフォルトは `audio-24khz-48kbitrate-mono-mp3`）を使用します。Telegram `sendVoice` は OGG/MP3/M4A を受け付けます。Opus 音声メッセージを確実に必要とする場合は OpenAI/ElevenLabs を使用してください。設定された Microsoft 形式が失敗した場合、OpenClaw は MP3 で再試行します。

  OpenAI と ElevenLabs の出力形式は、上記の一覧のとおりチャネルごとに固定されています。

  ## フィールドリファレンス

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Auto-TTS モード。`inbound` は受信音声メッセージの後にのみ音声を送信します。`tagged` は返信に `[[tts:...]]` ディレクティブまたは `[[tts:text]]` ブロックが含まれる場合にのみ音声を送信します。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      レガシートグル。`openclaw doctor --fix` はこれを `auto` に移行します。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` は最終返信に加えてツール/ブロック返信を含めます。
    </ParamField>
    <ParamField path="provider" type="string">
      音声プロバイダー ID。未設定の場合、OpenClaw はレジストリの自動選択順で最初に設定されたプロバイダーを使用します。レガシーの `provider: "edge"` は `openclaw doctor --fix` によって `"microsoft"` に書き換えられます。
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` からのアクティブな persona ID。小文字に正規化されます。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      安定した発話アイデンティティ。フィールド: `label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。[Personas](#personas) を参照してください。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      自動要約用の低コストモデル。デフォルトは `agents.defaults.model.primary` です。`provider/model` または設定済みのモデルエイリアスを受け付けます。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      モデルが TTS ディレクティブを出力できるようにします。`enabled` のデフォルトは `true`、`allowProvider` のデフォルトは `false` です。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      音声プロバイダー ID をキーにした、プロバイダー所有の設定です。レガシーの直接ブロック（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）は `openclaw doctor --fix` によって書き換えられます。`messages.tts.providers.<id>` のみをコミットしてください。
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 入力文字数のハード上限。超過すると `/tts audio` は失敗します。
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
    <ParamField path="endpoint" type="string">任意の Azure Speech エンドポイント上書き（別名 `baseUrl`）。</ParamField>
    <ParamField path="voice" type="string">Azure 音声の ShortName。デフォルトは `en-US-JennyNeural`。</ParamField>
    <ParamField path="lang" type="string">SSML 言語コード。デフォルトは `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">標準音声用の Azure `X-Microsoft-OutputFormat`。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">音声メモ出力用の Azure `X-Microsoft-OutputFormat`。デフォルトは `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` または `XI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">モデル ID（例: `eleven_multilingual_v2`、`eleven_v3`）。</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs 音声 ID。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（それぞれ `0..1`）、`useSpeakerBoost`（`true|false`）、`speed`（`0.5..2.0`、`1.0` = 標準）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>テキスト正規化モード。</ParamField>
    <ParamField path="languageCode" type="string">2 文字の ISO 639-1（例: `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">ベストエフォートの決定性のための整数 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API ベース URL を上書きします。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` にフォールバックします。省略した場合、TTS は env フォールバックの前に `models.providers.google.apiKey` を再利用できます。</ParamField>
    <ParamField path="model" type="string">Gemini TTS モデル。デフォルトは `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="voiceName" type="string">Gemini の事前構築済み音声名。デフォルトは `Kore`。別名: `voice`。</ParamField>
    <ParamField path="audioProfile" type="string">発話テキストの前に付加される自然言語のスタイルプロンプト。</ParamField>
    <ParamField path="speakerName" type="string">プロンプトが名前付き話者を使う場合に、発話テキストの前に付加される任意の話者ラベル。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>アクティブな persona プロンプトフィールドを決定的な Gemini TTS プロンプト構造でラップするには、`audio-profile-v1` に設定します。</ParamField>
    <ParamField path="personaPrompt" type="string">テンプレートの Director's Notes に追加される、Google 固有の追加 persona プロンプトテキスト。</ParamField>
    <ParamField path="baseUrl" type="string">`https://generativelanguage.googleapis.com` のみ受け付けます。</ParamField>
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
    <ParamField path="modelId" type="string">デフォルトは `inworld-tts-1.5-max`。その他: `inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは `Sarah`。</ParamField>
    <ParamField path="temperature" type="number">サンプリング温度 `0..2`。</ParamField>

  </Accordion>

  <Accordion title="ローカル CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS 用のローカル実行ファイルまたはコマンド文字列。</ParamField>
    <ParamField path="args" type="string[]">コマンド引数。`{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}、`{{OutputBase}}` プレースホルダーに対応。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>期待される CLI 出力形式。音声添付のデフォルトは `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">コマンドのタイムアウト（ミリ秒）。デフォルトは `120000`。</ParamField>
    <ParamField path="cwd" type="string">任意のコマンド作業ディレクトリ。</ParamField>
    <ParamField path="env" type="Record<string, string>">コマンド用の任意の環境上書き。</ParamField>
  </Accordion>

  <Accordion title="Microsoft (API キーなし)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft 音声の使用を許可します。</ParamField>
    <ParamField path="voice" type="string">Microsoft ニューラル音声名（例: `en-US-MichelleNeural`）。</ParamField>
    <ParamField path="lang" type="string">言語コード（例: `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 出力形式。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。バンドルされた Edge ベースのトランスポートでは、すべての形式がサポートされるわけではありません。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">パーセント文字列（例: `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">音声ファイルと並べて JSON 字幕を書き込みます。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 音声リクエスト用のプロキシ URL。</ParamField>
    <ParamField path="timeoutMs" type="number">リクエストタイムアウトの上書き（ミリ秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>レガシーエイリアス。永続化された設定を `providers.microsoft` に書き換えるには `openclaw doctor --fix` を実行してください。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` にフォールバックします。Token Plan 認証は `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、または `MINIMAX_CODING_API_KEY` を使用します。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.minimax.io`。Env: `MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `speech-2.8-hd`。Env: `MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは `English_expressive_narrator`。Env: `MINIMAX_TTS_VOICE_ID`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。デフォルトは `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。デフォルトは `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。デフォルトは `0`。小数値はリクエスト前に切り捨てられます。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS モデル ID（例: `gpt-4o-mini-tts`）。</ParamField>
    <ParamField path="voice" type="string">音声名（例: `alloy`、`cedar`）。</ParamField>
    <ParamField path="instructions" type="string">明示的な OpenAI `instructions` フィールド。設定されている場合、ペルソナプロンプトフィールドは自動マッピングされません。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">生成された OpenAI TTS フィールドの後に `/audio/speech` リクエスト本文へマージされる追加 JSON フィールド。`lang` のようなプロバイダー固有キーを必要とする Kokoro などの OpenAI 互換エンドポイントに使用します。安全でないプロトタイプキーは無視されます。</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS エンドポイントを上書きします。解決順序: 設定 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。デフォルト以外の値は OpenAI 互換 TTS エンドポイントとして扱われるため、カスタムモデル名と音声名を使用できます。
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
    <ParamField path="resourceId" type="string">デフォルトは `seed-tts-1.0`。Env: `VOLCENGINE_TTS_RESOURCE_ID`。プロジェクトに TTS 2.0 権限がある場合は `seed-tts-2.0` を使用してください。</ParamField>
    <ParamField path="appKey" type="string">App key ヘッダー。デフォルトは `aGjiRDfUWi`。Env: `VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP エンドポイントを上書きします。Env: `VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="voice" type="string">音声タイプ。デフォルトは `en_female_anna_mars_bigtts`。Env: `VOLCENGINE_TTS_VOICE`。</ParamField>
    <ParamField path="speedRatio" type="number">プロバイダーネイティブの速度比。</ParamField>
    <ParamField path="emotion" type="string">プロバイダーネイティブの感情タグ。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>レガシーの Volcengine Speech Console フィールド。Env: `VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（デフォルトは `volcano_tts`）。</ParamField>
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
    <ParamField path="model" type="string">デフォルトは `mimo-v2.5-tts`。Env: `XIAOMI_TTS_MODEL`。`mimo-v2-tts` にも対応。</ParamField>
    <ParamField path="voice" type="string">デフォルトは `mimo_default`。Env: `XIAOMI_TTS_VOICE`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>デフォルトは `mp3`。Env: `XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">ユーザーメッセージとして送信される任意の自然言語スタイル指示。読み上げられません。</ParamField>
  </Accordion>
</AccordionGroup>

## エージェントツール

`tts` ツールはテキストを音声に変換し、返信配信用の音声添付を返します。Feishu、Matrix、Telegram、WhatsApp では、音声はファイル添付ではなくボイスメッセージとして配信されます。Feishu と WhatsApp は、この経路で `ffmpeg` が利用可能な場合、Opus 以外の TTS 出力をトランスコードできます。

WhatsApp は Baileys 経由で音声を PTT ボイスノート（`ptt: true` を持つ `audio`）として送信し、クライアントがボイスノートのキャプションを一貫して表示しないため、表示テキストは PTT 音声とは**別に**送信します。

このツールは任意の `channel` フィールドと `timeoutMs` フィールドを受け付けます。`timeoutMs` は呼び出しごとのプロバイダーリクエストタイムアウト（ミリ秒）です。

## Gateway RPC

| メソッド          | 目的                                     |
| ----------------- | ---------------------------------------- |
| `tts.status`      | 現在の TTS 状態と最後の試行を読み取ります。 |
| `tts.enable`      | ローカルの自動設定を `always` に設定します。 |
| `tts.disable`     | ローカルの自動設定を `off` に設定します。 |
| `tts.convert`     | 単発のテキスト → 音声。                 |
| `tts.setProvider` | ローカルのプロバイダー設定を設定します。 |
| `tts.setPersona`  | ローカルのペルソナ設定を設定します。     |
| `tts.providers`   | 設定済みプロバイダーとステータスを一覧表示します。 |

## サービスリンク

- [OpenAI テキスト読み上げガイド](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API リファレンス](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST テキスト読み上げ](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech プロバイダー](/ja-JP/providers/azure-speech)
- [ElevenLabs テキスト読み上げ](https://elevenlabs.io/docs/api-reference/text-to-speech)
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

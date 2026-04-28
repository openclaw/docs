---
read_when:
    - 返信でテキスト読み上げを有効にする
    - TTS provider、フォールバックチェーン、または persona の設定
    - /tts コマンドまたはディレクティブの使用
sidebarTitle: Text to speech (TTS)
summary: 送信返信のテキスト読み上げ — providers、personas、スラッシュコマンド、およびチャネルごとの出力
title: テキスト読み上げ
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:42:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw は、**13 種類の音声プロバイダー** にまたがって送信返信を音声に変換し、Feishu、Matrix、Telegram、WhatsApp ではネイティブのボイスメッセージを、それ以外では音声添付ファイルを、telephony と Talk では PCM/Ulaw ストリームを配信できます。

## クイックスタート

<Steps>
  <Step title="provider を選ぶ">
    OpenAI と ElevenLabs は、最も信頼性の高いホスト型オプションです。Microsoft と Local CLI は API キーなしで動作します。完全な一覧は [provider matrix](#supported-providers) を参照してください。
  </Step>
  <Step title="API キーを設定">
    provider 用の env var（たとえば `OPENAI_API_KEY`、`ELEVENLABS_API_KEY`）を export します。Microsoft と Local CLI にはキーは不要です。
  </Step>
  <Step title="config で有効化">
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
    `/tts status` で現在の状態を表示します。`/tts audio Hello from OpenClaw` で 1 回限りの音声返信を送信します。
  </Step>
</Steps>

<Note>
自動 TTS はデフォルトで **オフ** です。`messages.tts.provider` が未設定の場合、OpenClaw はレジストリの自動選択順で最初に設定済みの provider を選びます。
</Note>

## サポートされる providers

| Provider          | Auth                                                                                                             | Notes                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（`AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION` も可）        | ネイティブの Ogg/Opus ボイスノート出力と telephony。                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` または `XI_API_KEY`                                                                         | ボイスクローニング、多言語、`seed` による決定的出力。                   |
| **Google Gemini** | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                                                                         | Gemini API TTS。`promptTemplate: "audio-profile-v1"` による persona 対応。 |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | ボイスノートと telephony 出力。                                         |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | ストリーミング TTS API。ネイティブ Opus ボイスノートと PCM telephony。   |
| **Local CLI**     | なし                                                                                                             | 設定済みのローカル TTS コマンドを実行します。                           |
| **Microsoft**     | なし                                                                                                             | `node-edge-tts` 経由の公開 Edge neural TTS。ベストエフォートで SLA なし。 |
| **MiniMax**       | `MINIMAX_API_KEY`（または Token Plan: `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`） | T2A v2 API。デフォルトは `speech-2.8-hd`。                              |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 自動要約にも使用されます。persona `instructions` をサポートします。      |
| **OpenRouter**    | `OPENROUTER_API_KEY`（`models.providers.openrouter.apiKey` の再利用も可）                                        | デフォルトモデルは `hexgrad/kokoro-82m`。                               |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY`（旧 AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                         |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 画像、動画、音声を共有する provider。                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI バッチ TTS。ネイティブ Opus ボイスノートは **サポートされません**。 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi chat completions 経由の MiMo TTS。                               |

複数の provider が設定されている場合、選択されたものが最初に使用され、他はフォールバックオプションになります。自動要約では `summaryModel`（または `agents.defaults.model.primary`）を使用するため、要約を有効にしたままにする場合はその provider でも認証が必要です。

<Warning>
バンドルされた **Microsoft** provider は、`node-edge-tts` 経由で Microsoft Edge のオンライン neural TTS サービスを使用します。これは公開 Web サービスであり、公表された SLA やクォータはありません。ベストエフォートとして扱ってください。レガシー provider id `edge` は `microsoft` に正規化され、`openclaw doctor --fix` は保存済み config を書き換えます。新しい config では常に `microsoft` を使用してください。
</Warning>

## 設定

TTS の設定は `~/.openclaw/openclaw.json` の `messages.tts` 配下にあります。プリセットを選び、provider ブロックを調整してください。

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
          // 任意の自然言語スタイルプロンプト:
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

### エージェントごとの voice 上書き

1 つのエージェントだけが別の provider、voice、model、persona、または自動 TTS モードで話すようにしたい場合は、`agents.list[].tts` を使用します。エージェントブロックは `messages.tts` に対して deep-merge されるため、provider の認証情報はグローバル provider config に置いたままにできます。

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

エージェントごとの persona を固定するには、provider config とあわせて `agents.list[].tts.persona` を設定します。これは、そのエージェントに対してのみグローバルな `messages.tts.persona` を上書きします。

自動返信、`/tts audio`、`/tts status`、および `tts` agent tool の優先順位は次のとおりです。

1. `messages.tts`
2. アクティブな `agents.list[].tts`
3. チャネルが `channels.<channel>.tts` をサポートしている場合はチャネル上書き
4. チャネルが `channels.<channel>.accounts.<id>.tts` を渡す場合はアカウント上書き
5. このホスト用のローカル `/tts` 設定
6. [model overrides](#model-driven-directives) が有効な場合のインライン `[[tts:...]]` ディレクティブ

チャネルおよびアカウントの上書きは `messages.tts` と同じ形状を使用し、先行するレイヤーに対して deep-merge されます。そのため、共有の provider 認証情報は `messages.tts` に置いたまま、チャネルまたは bot アカウントでは voice、model、persona、または auto モードだけを変更できます。

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

## Personas

**persona** とは、provider をまたいで決定的に適用できる安定した話者アイデンティティです。1 つの provider を優先したり、provider 非依存の prompt intent を定義したり、voice、model、prompt templates、seeds、voice settings の provider 固有バインディングを持たせたりできます。

### 最小 persona

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

### 完全な persona（provider 非依存 prompt）

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

### persona 解決

アクティブな persona は、決定的に次の順で選択されます。

1. 設定されていれば `/tts persona <id>` のローカル設定
2. 設定されていれば `messages.tts.persona`
3. persona なし

provider 選択は明示指定優先で行われます。

1. 直接上書き（CLI、Gateway、Talk、許可された TTS ディレクティブ）
2. `/tts provider <id>` のローカル設定
3. アクティブな persona の `provider`
4. `messages.tts.provider`
5. レジストリ自動選択

各 provider の試行について、OpenClaw は次の順序で config をマージします。

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 信頼されたリクエスト上書き
4. 許可されたモデル出力 TTS ディレクティブ上書き

### providers が persona prompts をどのように使うか

persona prompt フィールド（`profile`、`scene`、`sampleContext`、`style`、`accent`、`pacing`、`constraints`）は **provider 非依存** です。各 provider がそれらをどう使うかは provider ごとに決まります。

<AccordionGroup>
  <Accordion title="Google Gemini">
    有効な Google provider config で `promptTemplate: "audio-profile-v1"` または `personaPrompt` が設定されている**場合にのみ**、persona prompt フィールドを Gemini TTS prompt 構造にラップします。古い `audioProfile` と `speakerName` フィールドは、引き続き Google 固有の prompt テキストとして前置されます。`[[tts:text]]` ブロック内の `[whispers]` や `[laughs]` のようなインライン音声タグは Gemini transcript 内に保持されます。OpenClaw はこれらのタグを生成しません。
  </Accordion>
  <Accordion title="OpenAI">
    明示的な OpenAI `instructions` が設定されて**いない場合にのみ**、persona prompt フィールドをリクエストの `instructions` フィールドにマッピングします。明示的な `instructions` が常に優先されます。
  </Accordion>
  <Accordion title="Other providers">
    `personas.<id>.providers.<provider>` 配下の provider 固有 persona bindings のみを使用します。provider が独自の persona-prompt マッピングを実装していない限り、persona prompt フィールドは無視されます。
  </Accordion>
</AccordionGroup>

### fallbackPolicy

`fallbackPolicy` は、persona が試行対象 provider に対して **バインディングを持たない** 場合の動作を制御します。

| Policy              | Behavior                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **デフォルト。** provider 非依存の prompt フィールドは利用可能なままです。provider はそれらを使うことも無視することもできます。                |
| `provider-defaults` | その試行では prompt 準備から persona を省略し、provider は中立のデフォルトを使用します。一方で他の providers へのフォールバックは継続します。 |
| `fail`              | `reasonCode: "not_configured"` と `personaBinding: "missing"` を付けて、その provider 試行をスキップします。フォールバック providers は引き続き試行されます。 |

TTS リクエスト全体が失敗するのは、試行された **すべて** の provider がスキップまたは失敗した場合だけです。

## モデル駆動ディレクティブ

デフォルトでは、アシスタントは `[[tts:...]]` ディレクティブを出力して、単一の返信に対する voice、model、speed を上書き**できます**。さらに、音声のみに現れるべき表現キューのために、任意の `[[tts:text]]...[[/tts:text]]` ブロックも使えます。

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

`messages.tts.auto` が `"tagged"` の場合、音声をトリガーするには **ディレクティブが必須** です。ストリーミングブロック配信では、隣接ブロックにまたがって分割されている場合でも、チャネルが受け取る前に表示テキストからディレクティブが取り除かれます。

`provider=...` は、`modelOverrides.allowProvider: true` でない限り無視されます。返信で `provider=...` が宣言されている場合、そのディレクティブ内の他のキーはその provider に対してのみ解析されます。未対応キーは取り除かれ、TTS ディレクティブ警告として報告されます。

**利用可能なディレクティブキー:**

- `provider`（登録済み provider id。`allowProvider: true` が必要）
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume`（MiniMax volume、0–10）
- `pitch`（MiniMax 整数 pitch、−12 から 12。小数値は切り捨て）
- `emotion`（Volcengine emotion tag）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**モデル上書きを完全に無効化する:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**他のノブを設定可能にしたまま provider 切り替えを許可する:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## スラッシュコマンド

コマンドは単一の `/tts` です。Discord では、`/tts` が Discord 組み込みコマンドであるため、OpenClaw は `/voice` も登録します。テキストの `/tts ...` は引き続き動作します。

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
コマンドには認可された送信者が必要です（allowlist / owner ルールが適用されます）。また、`commands.text` またはネイティブコマンド登録のいずれかが有効である必要があります。
</Note>

動作メモ:

- `/tts on` はローカル TTS 設定を `always` に書き込みます。`/tts off` は `off` に書き込みます。
- `/tts chat on|off|default` は、現在の chat に対するセッションスコープの自動 TTS 上書きを書き込みます。
- `/tts persona <id>` はローカル persona 設定を書き込みます。`/tts persona off` はそれをクリアします。
- `/tts latest` は現在のセッション transcript から最新のアシスタント返信を読み取り、それを 1 回だけ音声として送信します。重複した voice 送信を抑止するため、その返信のハッシュのみをセッションエントリに保存します。
- `/tts audio` は 1 回限りの音声返信を生成します（TTS をオンには**切り替えません**）。
- `limit` と `summary` はメイン config ではなく **local prefs** に保存されます。
- `/tts status` には、最新の試行に対するフォールバック診断が含まれます。`Fallback: <primary> -> <used>`、`Attempts: ...`、および試行ごとの詳細（`provider:outcome(reasonCode) latency`）です。
- `/status` は、TTS が有効な場合、アクティブな TTS モードに加えて、設定済みの provider、model、voice、およびサニタイズされた custom endpoint metadata を表示します。

## ユーザーごとの設定

スラッシュコマンドはローカル上書きを `prefsPath` に書き込みます。デフォルトは `~/.openclaw/settings/tts.json` です。`OPENCLAW_TTS_PREFS` env var または `messages.tts.prefsPath` で上書きできます。

| Stored field | Effect                                       |
| ------------ | -------------------------------------------- |
| `auto`       | ローカル自動 TTS 上書き（`always`、`off`、…） |
| `provider`   | ローカル primary provider 上書き             |
| `persona`    | ローカル persona 上書き                      |
| `maxLength`  | 要約しきい値（デフォルト `1500` chars）      |
| `summarize`  | 要約切り替え（デフォルト `true`）            |

これらは、そのホストに対する `messages.tts` とアクティブな `agents.list[].tts` ブロックから得られる有効 config を上書きします。

## 出力形式（固定）

TTS の音声配信は、チャネル capability によって決まります。channel plugins は、voice スタイルの TTS が providers にネイティブな `voice-note` ターゲットを要求すべきか、通常の `audio-file` 合成を維持して、互換出力に対してのみ voice 配信としてマークすべきかを公開します。

- **voice-note 対応チャネル**: voice-note 返信では Opus（ElevenLabs の `opus_48000_64`、OpenAI の `opus`）が優先されます。
  - 48kHz / 64kbps はボイスメッセージとして適切なバランスです。
- **Feishu / WhatsApp**: voice-note 返信が MP3/WebM/WAV/M4A またはその他の一般的な音声ファイルとして生成された場合、channel plugin は送信前に `ffmpeg` で 48kHz の Ogg/Opus にトランスコードします。WhatsApp はその結果を Baileys の `audio` payload で `ptt: true` および `audio/ogg; codecs=opus` として送信します。変換に失敗した場合、Feishu には元のファイルが添付として送られます。WhatsApp では、互換性のない PTT payload を投稿する代わりに送信が失敗します。
- **BlueBubbles**: provider の合成は通常の audio-file パスのまま維持されます。MP3 と CAF 出力は iMessage voice memo 配信用としてマークされます。
- **その他のチャネル**: MP3（ElevenLabs の `mp3_44100_128`、OpenAI の `mp3`）。
  - 44.1kHz / 128kbps は音声明瞭性に対するデフォルトのバランスです。
- **MiniMax**: 通常の音声添付には MP3（`speech-2.8-hd` model、32kHz サンプルレート）を使用します。チャネルが公開する voice-note ターゲットに対しては、チャネルがトランスコードを公開している場合、OpenClaw は配信前に `ffmpeg` で MiniMax の MP3 を 48kHz Opus にトランスコードします。
- **Xiaomi MiMo**: デフォルトでは MP3、設定時は WAV です。チャネルが公開する voice-note ターゲットに対しては、チャネルがトランスコードを公開している場合、OpenClaw は配信前に `ffmpeg` で Xiaomi の出力を 48kHz Opus にトランスコードします。
- **Local CLI**: 設定された `outputFormat` を使用します。voice-note ターゲットは Ogg/Opus に変換され、telephony 出力は `ffmpeg` で raw 16 kHz mono PCM に変換されます。
- **Google Gemini**: Gemini API TTS は raw 24kHz PCM を返します。OpenClaw はそれを音声添付用に WAV としてラップし、voice-note ターゲット用に 48kHz Opus にトランスコードし、Talk / telephony 用には PCM を直接返します。
- **Gradium**: 音声添付には WAV、voice-note ターゲットには Opus、telephony には 8 kHz の `ulaw_8000` を使用します。
- **Inworld**: 通常の音声添付には MP3、voice-note ターゲットにはネイティブの `OGG_OPUS`、Talk / telephony には 22050 Hz の raw `PCM` を使用します。
- **xAI**: デフォルトでは MP3 で、`responseFormat` には `mp3`、`wav`、`pcm`、`mulaw`、`alaw` を指定できます。OpenClaw は xAI のバッチ REST TTS エンドポイントを使用し、完全な音声添付を返します。この provider パスでは xAI のストリーミング TTS WebSocket は使用されません。このパスではネイティブ Opus voice-note 形式はサポートされません。
- **Microsoft**: `microsoft.outputFormat`（デフォルト `audio-24khz-48kbitrate-mono-mp3`）を使用します。
  - バンドルされた transport は `outputFormat` を受け付けますが、すべての形式がサービスから利用できるわけではありません。
  - 出力形式の値は Microsoft Speech の出力形式（Ogg/WebM Opus を含む）に従います。
  - Telegram の `sendVoice` は OGG/MP3/M4A を受け付けます。Opus ボイスメッセージを確実に使いたい場合は OpenAI / ElevenLabs を使用してください。
  - 設定された Microsoft 出力形式で失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI / ElevenLabs の出力形式はチャネルごとに固定です（上記参照）。

## 自動 TTS の動作

`messages.tts.auto` が有効な場合、OpenClaw は次のように動作します。

- 返信にすでにメディアまたは `MEDIA:` ディレクティブが含まれている場合は TTS をスキップします。
- 非常に短い返信（10 文字未満）はスキップします。
- 要約が有効な場合、長い返信を `summaryModel`（または `agents.defaults.model.primary`）を使って要約します。
- 生成された音声を返信に添付します。
- `mode: "final"` では、ストリーミングされた最終返信について、テキストストリーム完了後に引き続き音声のみの TTS を送信します。生成されたメディアは通常の返信添付と同じチャネルメディア正規化を通ります。

返信が `maxLength` を超えていて、要約がオフである場合（または summary model 用の API キーがない場合）、音声はスキップされ、通常のテキスト返信が送信されます。

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

## チャネルごとの出力形式

| Target                                | Format                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | voice-note 返信では **Opus**（ElevenLabs の `opus_48000_64`、OpenAI の `opus`）が優先されます。48 kHz / 64 kbps は明瞭性とサイズのバランスが取れています。 |
| その他のチャネル                      | **MP3**（ElevenLabs の `mp3_44100_128`、OpenAI の `mp3`）。44.1 kHz / 128 kbps は音声向けのデフォルトです。                         |
| Talk / telephony                      | provider ネイティブの **PCM**（Inworld 22050 Hz、Google 24 kHz）、または telephony 用の Gradium の `ulaw_8000`。                    |

provider ごとの注記:

- **Feishu / WhatsApp のトランスコード:** voice-note 返信が MP3/WebM/WAV/M4A として生成された場合、channel plugin は `ffmpeg` で 48 kHz Ogg/Opus にトランスコードします。WhatsApp は Baileys 経由で `ptt: true` および `audio/ogg; codecs=opus` を使って送信します。変換に失敗した場合: Feishu は元のファイル添付にフォールバックし、WhatsApp は互換性のない PTT payload を投稿する代わりに送信が失敗します。
- **MiniMax / Xiaomi MiMo:** デフォルトは MP3（MiniMax の `speech-2.8-hd` は 32 kHz）で、voice-note ターゲットには `ffmpeg` で 48 kHz Opus にトランスコードされます。
- **Local CLI:** 設定された `outputFormat` を使用します。voice-note ターゲットは Ogg/Opus に、telephony 出力は raw 16 kHz mono PCM に変換されます。
- **Google Gemini:** raw 24 kHz PCM を返します。OpenClaw は添付用に WAV としてラップし、voice-note ターゲット用に 48 kHz Opus にトランスコードし、Talk / telephony 用には PCM を直接返します。
- **Inworld:** MP3 添付、ネイティブの `OGG_OPUS` voice-note、Talk / telephony 用の raw `PCM` 22050 Hz。
- **xAI:** デフォルトでは MP3 で、`responseFormat` には `mp3|wav|pcm|mulaw|alaw` を指定できます。xAI のバッチ REST エンドポイントを使用し、ストリーミング WebSocket TTS は**使用しません**。ネイティブ Opus voice-note 形式は**サポートされません**。
- **Microsoft:** `microsoft.outputFormat`（デフォルト `audio-24khz-48kbitrate-mono-mp3`）を使用します。Telegram の `sendVoice` は OGG/MP3/M4A を受け付けます。Opus ボイスメッセージを確実に使いたい場合は OpenAI / ElevenLabs を使用してください。設定された Microsoft 形式で失敗した場合、OpenClaw は MP3 で再試行します。

OpenAI と ElevenLabs の出力形式は、上記のとおりチャネルごとに固定です。

## フィールドリファレンス

<AccordionGroup>
  <Accordion title="トップレベル messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自動 TTS モード。`inbound` は受信したボイスメッセージの後にのみ音声を送信し、`tagged` は返信に `[[tts:...]]` ディレクティブまたは `[[tts:text]]` ブロックが含まれる場合にのみ音声を送信します。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      レガシーな切り替えです。`openclaw doctor --fix` はこれを `auto` に移行します。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` は最終返信に加えてツール / ブロック返信も含みます。
    </ParamField>
    <ParamField path="provider" type="string">
      音声 provider id。未設定の場合、OpenClaw はレジストリ自動選択順で最初に設定済みの provider を使用します。レガシーな `provider: "edge"` は `openclaw doctor --fix` により `"microsoft"` に書き換えられます。
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` からのアクティブな persona id。小文字に正規化されます。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      安定した話者アイデンティティ。フィールド: `label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。[Personas](#personas) を参照してください。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      自動要約用の低コスト model。デフォルトは `agents.defaults.model.primary`。`provider/model` または設定済み model alias を受け付けます。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      model が TTS ディレクティブを出力できるようにします。`enabled` のデフォルトは `true`、`allowProvider` のデフォルトは `false` です。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      音声 provider id をキーとする provider 所有の設定。レガシーな直接ブロック（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）は `openclaw doctor --fix` によって書き換えられます。コミットするのは `messages.tts.providers.<id>` のみです。
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 入力文字数のハード上限。`/tts audio` はこれを超えると失敗します。
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      リクエストのタイムアウト（ミリ秒）。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      ローカル prefs JSON パス（provider / limit / summary）を上書きします。デフォルトは `~/.openclaw/settings/tts.json` です。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY`、または `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech リージョン（例: `eastus`）。Env: `AZURE_SPEECH_REGION` または `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">任意の Azure Speech endpoint 上書き（別名 `baseUrl`）。</ParamField>
    <ParamField path="voice" type="string">Azure voice ShortName。デフォルトは `en-US-JennyNeural`。</ParamField>
    <ParamField path="lang" type="string">SSML 言語コード。デフォルトは `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">標準音声用の Azure `X-Microsoft-OutputFormat`。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">voice-note 出力用の Azure `X-Microsoft-OutputFormat`。デフォルトは `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` または `XI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">Model id（例: `eleven_multilingual_v2`、`eleven_v3`）。</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs voice id。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（各 `0..1`）、`useSpeakerBoost`（`true|false`）、`speed`（`0.5..2.0`、`1.0` = 通常）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>テキスト正規化モード。</ParamField>
    <ParamField path="languageCode" type="string">2 文字の ISO 639-1（例: `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">ベストエフォートの決定性のための整数 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API ベース URL を上書きします。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` にフォールバックします。省略された場合、TTS は env へのフォールバック前に `models.providers.google.apiKey` を再利用できます。</ParamField>
    <ParamField path="model" type="string">Gemini TTS model。デフォルトは `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="voiceName" type="string">Gemini の組み込み voice 名。デフォルトは `Kore`。別名: `voice`。</ParamField>
    <ParamField path="audioProfile" type="string">発話テキストの前に前置される自然言語スタイル prompt。</ParamField>
    <ParamField path="speakerName" type="string">prompt が名前付き話者を使う場合に発話テキストの前に前置される任意の話者ラベル。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>アクティブな persona prompt フィールドを決定的な Gemini TTS prompt 構造でラップするには `audio-profile-v1` に設定します。</ParamField>
    <ParamField path="personaPrompt" type="string">テンプレートの Director's Notes に追加される Google 固有の追加 persona prompt テキスト。</ParamField>
    <ParamField path="baseUrl" type="string">`https://generativelanguage.googleapis.com` のみ受け付けます。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.gradium.ai`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは Emma（`YTpq7expH9539ERJ`）。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">デフォルトは `inworld-tts-1.5-max`。`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1` も使用できます。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは `Sarah`。</ParamField>
    <ParamField path="temperature" type="number">サンプリング temperature `0..2`。</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS 用のローカル実行ファイルまたはコマンド文字列。</ParamField>
    <ParamField path="args" type="string[]">コマンド引数。`{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` プレースホルダーをサポートします。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>想定される CLI 出力形式。音声添付用のデフォルトは `mp3` です。</ParamField>
    <ParamField path="timeoutMs" type="number">コマンドタイムアウト（ミリ秒）。デフォルトは `120000`。</ParamField>
    <ParamField path="cwd" type="string">任意のコマンド作業ディレクトリ。</ParamField>
    <ParamField path="env" type="Record<string, string>">コマンド用の任意の環境変数上書き。</ParamField>
  </Accordion>

  <Accordion title="Microsoft（API キー不要）">
    <ParamField path="enabled" type="boolean" default="true">Microsoft 音声の使用を許可します。</ParamField>
    <ParamField path="voice" type="string">Microsoft neural voice 名（例: `en-US-MichelleNeural`）。</ParamField>
    <ParamField path="lang" type="string">言語コード（例: `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 出力形式。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。バンドルされた Edge ベース transport ではすべての形式がサポートされるわけではありません。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">パーセント文字列（例: `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">音声ファイルと一緒に JSON 字幕を書き込みます。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 音声リクエスト用のプロキシ URL。</ParamField>
    <ParamField path="timeoutMs" type="number">リクエストタイムアウト上書き（ms）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>レガシー別名です。`openclaw doctor --fix` を実行して保存済み config を `providers.microsoft` に書き換えてください。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` にフォールバックします。Token Plan 認証は `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、または `MINIMAX_CODING_API_KEY` 経由です。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.minimax.io`。Env: `MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `speech-2.8-hd`。Env: `MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは `English_expressive_narrator`。Env: `MINIMAX_TTS_VOICE_ID`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。デフォルトは `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。デフォルトは `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。デフォルトは `0`。小数値はリクエスト前に切り捨てられます。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS model id（例: `gpt-4o-mini-tts`）。</ParamField>
    <ParamField path="voice" type="string">voice 名（例: `alloy`、`cedar`）。</ParamField>
    <ParamField path="instructions" type="string">明示的な OpenAI `instructions` フィールド。設定されている場合、persona prompt フィールドは**自動マッピングされません**。</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS endpoint を上書きします。解決順序: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。デフォルト以外の値は OpenAI-compatible TTS endpoints として扱われるため、カスタム model 名と voice 名が受け付けられます。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`。`models.providers.openrouter.apiKey` を再利用できます。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://openrouter.ai/api/v1`。レガシーな `https://openrouter.ai/v1` は正規化されます。</ParamField>
    <ParamField path="model" type="string">デフォルトは `hexgrad/kokoro-82m`。別名: `modelId`。</ParamField>
    <ParamField path="voice" type="string">デフォルトは `af_alloy`。別名: `voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>デフォルトは `mp3`。</ParamField>
    <ParamField path="speed" type="number">provider ネイティブの speed 上書き。</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">デフォルトは `seed-tts-1.0`。Env: `VOLCENGINE_TTS_RESOURCE_ID`。プロジェクトに TTS 2.0 の権限がある場合は `seed-tts-2.0` を使用してください。</ParamField>
    <ParamField path="appKey" type="string">App key ヘッダー。デフォルトは `aGjiRDfUWi`。Env: `VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP endpoint を上書きします。Env: `VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="voice" type="string">voice type。デフォルトは `en_female_anna_mars_bigtts`。Env: `VOLCENGINE_TTS_VOICE`。</ParamField>
    <ParamField path="speedRatio" type="number">provider ネイティブの speed ratio。</ParamField>
    <ParamField path="emotion" type="string">provider ネイティブの emotion tag。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>レガシーな Volcengine Speech Console フィールド。Env: `VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（デフォルト `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.x.ai/v1`。Env: `XAI_BASE_URL`。</ParamField>
    <ParamField path="voiceId" type="string">デフォルトは `eve`。利用可能な voice は `ara`、`eve`、`leo`、`rex`、`sal`、`una` です。</ParamField>
    <ParamField path="language" type="string">BCP-47 言語コードまたは `auto`。デフォルトは `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>デフォルトは `mp3`。</ParamField>
    <ParamField path="speed" type="number">provider ネイティブの speed 上書き。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.xiaomimimo.com/v1`。Env: `XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `mimo-v2.5-tts`。Env: `XIAOMI_TTS_MODEL`。`mimo-v2-tts` もサポートします。</ParamField>
    <ParamField path="voice" type="string">デフォルトは `mimo_default`。Env: `XIAOMI_TTS_VOICE`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>デフォルトは `mp3`。Env: `XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">ユーザーメッセージとして送信される任意の自然言語スタイル指示で、読み上げはされません。</ParamField>
  </Accordion>
</AccordionGroup>

## エージェントツール

`tts` ツールはテキストを音声に変換し、返信配信用の音声添付を返します。Feishu、Matrix、Telegram、WhatsApp では、この音声はファイル添付ではなくボイスメッセージとして配信されます。Feishu と WhatsApp では、`ffmpeg` が利用可能な場合、この経路で非 Opus の TTS 出力をトランスコードできます。

WhatsApp は Baileys 経由で音声を PTT ボイスノート（`audio` と `ptt: true`）として送信し、クライアントがボイスノートのキャプションを一貫して表示しないため、表示テキストは PTT 音声とは**別に**送信します。

このツールは任意の `channel` および `timeoutMs` フィールドを受け付けます。`timeoutMs` は呼び出しごとの provider リクエストタイムアウト（ミリ秒）です。

## Gateway RPC

| Method            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | 現在の TTS 状態と最新の試行を読み取ります。 |
| `tts.enable`      | ローカルの自動設定を `always` に設定します。 |
| `tts.disable`     | ローカルの自動設定を `off` に設定します。    |
| `tts.convert`     | 1 回限りの text → audio。                |
| `tts.setProvider` | ローカル provider 設定を設定します。      |
| `tts.setPersona`  | ローカル persona 設定を設定します。       |
| `tts.providers`   | 設定済み providers と状態を一覧表示します。 |

## サービスリンク

- [OpenAI text-to-speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/ja-JP/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ja-JP/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/ja-JP/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/ja-JP/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 関連

- [Media overview](/ja-JP/tools/media-overview)
- [Music generation](/ja-JP/tools/music-generation)
- [Video generation](/ja-JP/tools/video-generation)
- [Slash commands](/ja-JP/tools/slash-commands)
- [Voice call plugin](/ja-JP/plugins/voice-call)

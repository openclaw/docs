---
read_when:
    - 返信のテキスト読み上げを有効にする
    - TTSプロバイダー、フォールバックチェーン、またはペルソナの設定
    - /tts コマンドまたはディレクティブの使用
sidebarTitle: Text to speech (TTS)
summary: 送信する返信のテキスト読み上げ — プロバイダー、ペルソナ、スラッシュコマンド、チャンネルごとの出力
title: テキスト読み上げ
x-i18n:
    generated_at: "2026-07-16T12:13:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw は、送信する返信を **14 の音声プロバイダー**を通じて音声に変換します。
Feishu、Matrix、Telegram、WhatsApp ではネイティブ音声メッセージ、それ以外では音声
添付ファイル、電話通信と Talk では PCM/Ulaw ストリームを使用します。

TTS は Talk の `stt-tts` モードにおける音声出力側です（`talk.speak` の呼び出しも、この
同じ音声合成パスを使用します）。プロバイダーでネイティブに処理される `realtime` Talk セッションでは、
リアルタイムプロバイダー内で音声が合成されます。一方、`transcription` セッションでは
アシスタントの音声返信は合成されません。

## クイックスタート

<Steps>
  <Step title="プロバイダーを選択">
    OpenAI と ElevenLabs は、最も信頼性の高いホスト型オプションです。Microsoft と
    Local CLI は API キーなしで動作します。全一覧については[プロバイダー一覧表](#supported-providers)
    を参照してください。
  </Step>
  <Step title="API キーを設定">
    使用するプロバイダーの環境変数（たとえば `OPENAI_API_KEY`、
    `ELEVENLABS_API_KEY`）をエクスポートします。Microsoft と Local CLI にはキーが不要です。
  </Step>
  <Step title="設定で有効化">
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
    `/tts status` で現在の状態を確認できます。`/tts audio Hello from OpenClaw` は
    1 回限りの音声返信を送信します。
  </Step>
</Steps>

<Note>
Auto-TTS はデフォルトで**オフ**です。`messages.tts.provider` が未設定の場合、
OpenClaw はレジストリの自動選択順で最初に設定済みのプロバイダーを選択します。
組み込みの `tts` エージェントツールは、明示的な意図がある場合にのみ動作します。ユーザーが音声を要求するか、
`/tts` を使用するか、Auto-TTS／ディレクティブ音声を有効にしない限り、通常のチャットは
テキストのままです。
</Note>

## 対応プロバイダー

| プロバイダー          | 認証                                                                                                             | 備考                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（`AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION` も利用可能）          | ネイティブ Ogg/Opus ボイスメモ出力と電話通信。                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 互換 TTS。デフォルトは `hexgrad/Kokoro-82M`。                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` または `XI_API_KEY`                                                                             | 音声クローニング、多言語対応、`seed` による決定論的生成。Discord の音声再生ではストリーミングされます。 |
| **Google Gemini** | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                                                                             | Gemini API のバッチ TTS。`promptTemplate: "audio-profile-v1"` によりペルソナに対応します。               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | ボイスメモと電話通信への出力。                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | ストリーミング TTS API。ネイティブ Opus ボイスメモと PCM 電話通信に対応します。                                |
| **Local CLI**     | なし                                                                                                             | 設定されたローカル TTS コマンドを実行します。                                                        |
| **Microsoft**     | なし                                                                                                             | `node-edge-tts` を介した公開 Edge ニューラル TTS。ベストエフォートであり、SLA はありません。                            |
| **MiniMax**       | `MINIMAX_API_KEY`（または Token Plan：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）      | T2A v2 API。デフォルトは `speech-2.8-hd`。                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 自動要約にも使用されます。ペルソナ `instructions` をサポートします。                                |
| **OpenRouter**    | `OPENROUTER_API_KEY`（`models.providers.openrouter.apiKey` を再利用可能）                                            | デフォルトモデルは `hexgrad/kokoro-82m`。                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY`（従来の AppID／トークン：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 画像、動画、音声で共有されるプロバイダー。                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI バッチ TTS。ネイティブ Opus ボイスメモはサポートされて**いません**。                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi チャット補完を介した MiMo TTS。                                                   |

複数のプロバイダーが設定されている場合、選択されたプロバイダーが最初に使用され、
ほかはフォールバックオプションになります。自動要約では `summaryModel`（または
`agents.defaults.model.primary`）が使用されるため、要約を有効なままにする場合は、
そのプロバイダーについても認証が必要です。

<Warning>
同梱の **Microsoft** プロバイダーは、`node-edge-tts` を介して Microsoft Edge のオンラインニューラル TTS
サービスを使用します。これは公開された SLA やクォータのないパブリック Web サービスであるため、
ベストエフォートとして扱ってください。従来のプロバイダー ID `edge` は
`microsoft` に正規化され、`openclaw doctor --fix` によって永続化済みの
設定が書き換えられます。新しい設定では、必ず `microsoft` を使用してください。
</Warning>

## 設定

TTS の設定は、`~/.openclaw/openclaw.json` の `messages.tts` 配下にあります。プリセットを
選択し、プロバイダーブロックを調整してください。以下に示す `speakerVoice`/`speakerVoiceId`
フィールドが標準です。各プロバイダー固有の `voice`/`voiceId`/
`voiceName` フィールド名も、従来のエイリアスとして引き続き使用できます。

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

Xiaomi `mimo-v2.5-tts-voicedesign` では、`speakerVoice` を省略し、`style` に
音声デザイン用プロンプトを設定します。OpenClaw はそのプロンプトを TTS の `user` メッセージとして送信し、
voicedesign モデルには `audio.voice` を送信しません。

### エージェントごとの音声オーバーライド

1つのエージェントに別のプロバイダー、音声、モデル、ペルソナ、または自動TTSモードを使用させる場合は、`agents.list[].tts` を使用します。エージェントブロックは
`messages.tts` にディープマージされるため、プロバイダーの認証情報はグローバルなプロバイダー設定に保持できます。

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

エージェントごとにペルソナを固定するには、プロバイダー設定とともに `agents.list[].tts.persona` を設定します。これは、そのエージェントに限りグローバルな `messages.tts.persona` をオーバーライドします。

自動返信、`/tts audio`、`/tts status`、および
`tts` エージェントツールの優先順位：

1. `messages.tts`
2. アクティブな `agents.list[].tts`
3. チャンネルが `channels.<channel>.tts` をサポートする場合のチャンネルオーバーライド
4. チャンネルが `channels.<channel>.accounts.<id>.tts` を渡す場合のアカウントオーバーライド
5. このホストのローカルな `/tts` 設定
6. [モデル駆動ディレクティブ](#model-driven-directives)が有効な場合のインライン `[[tts:...]]` ディレクティブ

チャンネルおよびアカウントのオーバーライドは `messages.tts` と同じ形式を使用し、
それ以前のレイヤーにディープマージされます。そのため、共有のプロバイダー認証情報を
`messages.tts` に保持しながら、チャンネルまたはボットアカウントで話者音声、モデル、ペルソナ、または自動モードだけを変更できます。

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

**ペルソナ**とは、プロバイダーをまたいで決定論的に適用できる、安定した発話上のアイデンティティです。特定のプロバイダーを優先し、プロバイダーに依存しないプロンプトの意図を定義し、音声、モデル、プロンプトテンプレート、シード、音声設定に関するプロバイダー固有のバインディングを保持できます。

### 最小構成のペルソナ

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "ナレーター",
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

### 完全なペルソナ（プロバイダーに依存しないプロンプト）

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "辛口ながら温かみのある、英国人執事のナレーター。",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "聡明な英国人執事。辛口で機知に富み、温かく魅力的で、感情表現が豊か。決して没個性的ではない。",
            scene: "静かな深夜の書斎。信頼するオペレーターに向けた近接マイクでのナレーション。",
            sampleContext: "話者は非公開の技術的な依頼に対し、簡潔な自信と辛口の温かみをもって回答している。",
            style: "洗練され、控えめで、少し楽しげ。",
            accent: "イギリス英語。",
            pacing: "落ち着いたペースで、短く劇的な間を置く。",
            constraints: ["設定値を読み上げない。", "ペルソナについて説明しない。"],
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

### ペルソナの解決

アクティブなペルソナは決定論的に選択されます。

1. `/tts persona <id>` のローカル設定（設定されている場合）。
2. `messages.tts.persona`（設定されている場合）。
3. ペルソナなし。

プロバイダーの選択では、明示的な指定が優先されます。

1. 直接オーバーライド（CLI、Gateway、Talk、許可されたTTSディレクティブ）。
2. `/tts provider <id>` のローカル設定。
3. アクティブなペルソナの `provider`。
4. `messages.tts.provider`。
5. レジストリによる自動選択。

各プロバイダーの試行時に、OpenClawは次の順序で設定をマージします。

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 信頼されたリクエストのオーバーライド
4. 許可された、モデルが出力したTTSディレクティブのオーバーライド

### プロバイダーによるペルソナプロンプトの使用方法

ペルソナのプロンプトフィールド（`profile`、`scene`、`sampleContext`、`style`、`accent`、
`pacing`、`constraints`）は、**プロバイダーに依存しません**。その使用方法は各プロバイダーが決定します。

<AccordionGroup>
  <Accordion title="Google Gemini">
    有効なGoogleプロバイダー設定で `promptTemplate: "audio-profile-v1"`
    または `personaPrompt` が設定されている場合**に限り**、
    ペルソナのプロンプトフィールドをGemini TTSのプロンプト構造でラップします。従来の `audioProfile` および `speakerName` フィールドは、
    引き続きGoogle固有のプロンプトテキストとして先頭に追加されます。`[[tts:text]]` ブロック内の
    `[whispers]` や `[laughs]` などのインライン音声タグは、
    Geminiのトランスクリプト内で保持されます。OpenClawがこれらのタグを生成することはありません。
  </Accordion>
  <Accordion title="OpenAI">
    明示的なOpenAI `instructions` が設定されていない場合**に限り**、
    ペルソナのプロンプトフィールドをリクエストの `instructions` フィールドにマッピングします。明示的な `instructions` が
    常に優先されます。
  </Accordion>
  <Accordion title="その他のプロバイダー">
    `personas.<id>.providers.<provider>` 配下のプロバイダー固有のペルソナバインディングのみを使用します。
    プロバイダーが独自のペルソナプロンプトのマッピングを実装していない限り、
    ペルソナのプロンプトフィールドは無視されます。
  </Accordion>
</AccordionGroup>

### フォールバックポリシー

`fallbackPolicy` は、試行対象のプロバイダーに対するバインディングがペルソナに**存在しない**場合の動作を制御します。

| ポリシー              | 動作                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **デフォルト。** プロバイダーに依存しないプロンプトフィールドは引き続き利用可能であり、プロバイダーはそれらを使用することも無視することもできます。                                            |
| `provider-defaults` | その試行のプロンプト準備からペルソナを除外します。ほかのプロバイダーへのフォールバックは継続し、その間、このプロバイダーは中立的なデフォルトを使用します。 |
| `fail`              | `reasonCode: "not_configured"` および `personaBinding: "missing"` とともに、そのプロバイダーの試行をスキップします。フォールバックプロバイダーは引き続き試行されます。              |

TTSリクエスト全体が失敗するのは、試行した**すべての**プロバイダーがスキップされるか失敗した場合だけです。

Talkセッションのプロバイダー選択はセッション単位です。Talkクライアントは
`talk.catalog` からプロバイダーID、モデルID、音声ID、ロケールを選択し、
Talkセッションまたはハンドオフリクエストを通じて渡す必要があります。音声セッションを開く際に、
`messages.tts` またはグローバルなTalkプロバイダーのデフォルトを変更してはなりません。

## モデル駆動ディレクティブ

デフォルトでは、アシスタントは、1回の返信に限って音声、モデル、速度をオーバーライドする `[[tts:...]]` ディレクティブと、
音声だけに含める表現上の合図を指定するオプションの
`[[tts:text]]...[[/tts:text]]` ブロックを出力**できます**。

```text
どうぞ。

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]]（笑う）もう一度その歌を読んで。[[/tts:text]]
```

`messages.tts.auto` が `"tagged"` の場合、音声を開始するには**ディレクティブが必須**です。ストリーミングブロック配信では、ディレクティブが隣接する複数のブロックに分割されている場合でも、チャンネルに渡される前に表示テキストから除去されます。

`modelOverrides.allowProvider: true` でない限り、`provider=...` は無視されます。
返信で `provider=...` が宣言されている場合、そのディレクティブ内のほかのキーは
そのプロバイダーだけが解析します。サポートされていないキーは除去され、TTSディレクティブの警告として報告されます。

**利用可能なディレクティブキー：**

- `provider`（登録済みプロバイダーID。`allowProvider: true` が必要）
- `speakerVoice` / `speakerVoiceId`（従来のエイリアス：`voice`、`voiceName`、`voice_name`、`google_voice`、`voiceId`）
- `model` / `google_model`
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMaxの音量、`(0, 10]`）
- `pitch`（MiniMaxの整数ピッチ、−12から12。小数値は切り捨て）
- `emotion`（Volcengineの感情タグ）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**モデルによるオーバーライドを完全に無効化：**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**ほかの調整項目を設定可能なまま、プロバイダーの切り替えを許可：**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## スラッシュコマンド

単一コマンド `/tts`。Discordでは、`/tts` がDiscordの組み込みコマンドであるため、
OpenClawは `/voice` も登録します。テキストの `/tts ...` も引き続き機能します。

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
コマンドには認可された送信者が必要であり（許可リスト／所有者ルールが適用されます）、
`commands.text` またはネイティブコマンドの登録のいずれかを有効にする必要があります。
</Note>

動作に関する注意事項：

- `/tts on` はローカルTTS設定を `always` に書き込み、`/tts off` は `off` に書き込みます。
- `/tts chat on|off|default` は現在のチャットに対し、セッション単位の自動TTSオーバーライドを書き込みます。
- `/tts persona <id>` はローカルのペルソナ設定を書き込み、`/tts persona off` はそれを消去します。
- `/tts latest` は現在のセッショントランスクリプトから最新のアシスタント返信を読み取り、音声として1回送信します。重複する音声送信を抑制するため、その返信のハッシュだけをセッションエントリに保存します。
- `/tts audio` は1回限りの音声返信を生成します（TTSをオンには**切り替えません**）。
- `/tts limit <chars>` は **100～4096** を受け付けます（4096はTelegramのキャプション／メッセージの最大値です）。範囲外の値は拒否されます。
- `limit` および `summary` は、メイン設定ではなく**ローカル設定**に保存されます。
- `/tts status` には、最新の試行に関するフォールバック診断（`Fallback: <primary> -> <used>`、`Attempts: ...`、および試行ごとの詳細（`provider:outcome(reasonCode) latency`））が含まれます。
- `/status` は、TTSが有効な場合、アクティブなTTSモードに加えて、設定済みのプロバイダー、モデル、音声、およびサニタイズ済みのカスタムエンドポイントメタデータを表示します。

## ユーザーごとの設定

スラッシュコマンドはローカルオーバーライドを `prefsPath` に書き込みます。デフォルトは
`~/.openclaw/settings/tts.json` です。`OPENCLAW_TTS_PREFS` 環境変数
または `messages.tts.prefsPath` でオーバーライドできます。

| 保存フィールド | 効果                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | ローカルの自動 TTS オーバーライド（`always`、`off`、…）                                     |
| `provider`   | ローカルのプライマリプロバイダーのオーバーライド                                                  |
| `persona`    | ローカルのペルソナのオーバーライド                                                           |
| `maxLength`  | 要約／切り詰めのしきい値（デフォルト `1500` 文字、`/tts limit` の範囲 100–4096） |
| `summarize`  | 要約の切り替え（デフォルト `true`）                                                  |

これらは、そのホストの `messages.tts` とアクティブな
`agents.list[].tts` ブロックから得られる有効な設定をオーバーライドします。

## 出力形式

TTS 音声の配信は、チャンネルの機能に基づいて決まります。チャンネル Plugin は、
音声形式の TTS でプロバイダーにネイティブの `voice-note` ターゲットを要求するか、
通常の `audio-file` 合成を維持するか、また送信前にチャンネルが
非ネイティブ出力をトランスコードするかどうかを通知します。

| ターゲット                                | 形式                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | ボイスノートの返信では **Opus** を優先します（ElevenLabs の `opus_48000_64`、OpenAI の `opus`）。48 kHz / 64 kbps は明瞭さとサイズのバランスを取ります。 |
| その他のチャンネル                        | **MP3**（ElevenLabs の `mp3_44100_128`、OpenAI の `mp3`）。44.1 kHz / 128 kbps が音声向けのデフォルトのバランスです。                  |
| Talk / 電話通信                      | プロバイダーネイティブの **PCM**（Inworld 22050 Hz、Google 24 kHz）、または電話通信用の Gradium の `ulaw_8000`。                                 |

プロバイダーごとの注記：

- **Feishu / WhatsApp のトランスコード：** ボイスノートの返信が MP3/WebM/WAV/M4A またはその他の音声ファイルと思われる形式になった場合、チャンネル Plugin は、ネイティブ音声メッセージを送信する前に、`ffmpeg`（`libopus`、64 kbps）を使用して 48 kHz Ogg/Opus にトランスコードします。WhatsApp は、`ptt: true` および `audio/ogg; codecs=opus` を指定した Baileys の `audio` ペイロードを通じて結果を送信します。トランスコードに失敗した場合、Feishu はエラーを捕捉し、元のファイルを通常の添付ファイルとして送信するフォールバックを行います。WhatsApp にはフォールバックがないため、互換性のない PTT ペイロードを投稿するのではなく、送信自体が失敗します。
- **MiniMax：** 通常の音声添付ファイルには MP3（`speech-2.8-hd` モデル、32 kHz サンプルレート）を使用し、チャンネルが通知したボイスノートのターゲットには `ffmpeg` を使用して 48 kHz Opus にトランスコードします。
- **Xiaomi MiMo：** デフォルトでは MP3、設定時は WAV を使用します。チャンネルが通知したボイスノートのターゲットには `ffmpeg` を使用して 48 kHz Opus にトランスコードします。
- **ローカル CLI：** 設定された `outputFormat` を使用します。ボイスノートのターゲットは Ogg/Opus に変換され、電話通信用の出力は `ffmpeg` を使用して未加工の 16 kHz モノラル PCM に変換されます。
- **Google Gemini：** 未加工の 24 kHz PCM を返します。OpenClaw は音声添付ファイル用に WAV としてラップし、ボイスノートのターゲット用に 48 kHz Opus にトランスコードし、Talk／電話通信には PCM を直接返します。
- **Gradium：** 音声添付ファイルには WAV、ボイスノートのターゲットには Opus、電話通信には 8 kHz の `ulaw_8000` を使用します。
- **Inworld：** 通常の音声添付ファイルには MP3、ボイスノートのターゲットにはネイティブの `OGG_OPUS`、Talk／電話通信には 22050 Hz の未加工の `PCM` を使用します。
- **xAI：** デフォルトでは MP3 を使用します。音声ファイル合成では、バッファー出力とストリーミング出力の両方に `mp3`、`wav`、`pcm`、`mulaw`、または `alaw` を使用できます。xAI の `pcm`、`mulaw`、および `alaw` の出力はヘッダーのない未加工音声であるため、ボイスノートのターゲットではストリーミングに MP3 を使用し、バッファー出力のフォールバックにも MP3 を使用します。バッファー合成では xAI のバッチ REST `/v1/tts` エンドポイントを使用し、`textToSpeechStream` ではネイティブの `wss://api.x.ai/v1/tts` を使用します。これはリアルタイム音声の契約ではありません。ネイティブ Opus のボイスノート形式はサポートされていません。
- **Microsoft：** `microsoft.outputFormat`（デフォルト `audio-24khz-48kbitrate-mono-mp3`）を使用します。
  - 同梱のトランスポートは `outputFormat` を受け付けますが、すべての形式をサービスで利用できるわけではありません。
  - 出力形式の値は、Microsoft Speech の出力形式（Ogg/WebM Opus を含む）に従います。
  - Telegram の `sendVoice` は OGG/MP3/M4A を受け付けます。Opus 音声メッセージを確実に使用する必要がある場合は、OpenAI/ElevenLabs を使用してください。
  - 設定された Microsoft の出力形式で失敗した場合、OpenClaw は MP3 で再試行します。
  - 明示的な音声オーバーライドが設定されておらず、デフォルトの英語音声が使用されている場合、返信テキストが CJK 主体であれば、OpenClaw は中国語のニューラル音声（`zh-CN-XiaoxiaoNeural`、`zh-CN` ロケール）に自動的に切り替えます。

OpenAI と ElevenLabs の出力形式は、上記のとおりチャンネルごとに固定されています。

## 自動 TTS の動作

`messages.tts.auto` が有効な場合、OpenClaw は次の処理を行います。

- 応答に構造化メディアがすでに含まれている場合、TTS をスキップします。
- 非常に短い応答（10 文字未満）をスキップします。
- 要約が有効な場合、長い応答を
  `summaryModel`（または `agents.defaults.model.primary`）を使用して要約します。
- 生成した音声を応答に添付します。
- `mode: "final"` では、テキストストリームの完了後も、ストリーミングされた最終応答に対して
  音声のみの TTS を送信します。生成されたメディアには、通常の応答添付ファイルと同じ
  チャンネルメディア正規化が適用されます。

応答が `maxLength` を超える場合、OpenClaw が音声を完全にスキップすることはありません。

- **要約オン**（デフォルト）で要約モデルが利用可能な場合: テキストを
  約 `maxLength` 文字に要約し、その要約を音声合成します。
- **要約オフ**、要約が失敗した場合、または要約モデル用の API キーが利用できない場合:
  テキストを `maxLength` 文字に切り詰め、切り詰めたテキストを
  音声合成します。

```text
応答 -> TTS は有効か？
  いいえ -> テキストを送信
  はい   -> メディアを含む / 短い？
            はい   -> テキストを送信
            いいえ -> 長さ > 上限？
                      いいえ -> TTS -> 音声を添付
                      はい   -> 要約が有効かつ利用可能？
                                いいえ -> 切り詰め -> TTS -> 音声を添付
                                はい   -> 要約 -> TTS -> 音声を添付
```

## フィールドリファレンス

<AccordionGroup>
  <Accordion title="トップレベルの messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自動 TTS モード。`inbound` は受信した音声メッセージの後にのみ音声を送信します。`tagged` は、応答に `[[tts:...]]` ディレクティブまたは `[[tts:text]]` ブロックが含まれる場合にのみ音声を送信します。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      レガシートグル。`openclaw doctor --fix` はこれを `auto` に移行します。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` は、最終応答に加えてツール/ブロック応答も含めます。
    </ParamField>
    <ParamField path="provider" type="string">
      音声プロバイダー ID。未設定の場合、OpenClaw はレジストリの自動選択順で最初に設定されているプロバイダーを使用します。レガシーの `provider: "edge"` は、`openclaw doctor --fix` によって `"microsoft"` に書き換えられます。
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` のアクティブなペルソナ ID。小文字に正規化されます。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      一貫した話者アイデンティティ。フィールド: `label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。[ペルソナ](#personas)を参照してください。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      自動要約用の低コストモデル。デフォルトは `agents.defaults.model.primary`。`provider/model` または設定済みのモデルエイリアスを指定できます。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      モデルによる TTS ディレクティブの出力を許可します。`enabled` のデフォルトは `true`、`allowProvider` のデフォルトは `false` です。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      音声プロバイダー ID をキーとする、プロバイダー所有の設定。レガシーの直接ブロック（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）は `openclaw doctor --fix` によって書き換えられます。コミットするのは `messages.tts.providers.<id>` のみにしてください。
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      TTS 入力文字数のハード上限。超過した場合、`/tts audio`、`tts.convert`、および `tts.speak` は失敗します。
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      リクエストのタイムアウト（ミリ秒）。呼び出しごとの `timeoutMs`（エージェントツール、Gateway）が設定されている場合はそれが優先されます。それ以外の場合、明示的に設定された `messages.tts.timeoutMs` は、Plugin が設定したプロバイダーのデフォルト値より優先されます。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      ローカル設定 JSON のパス（プロバイダー/上限/要約）を上書きします。デフォルトは `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">環境変数: `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY`、または `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech のリージョン（例: `eastus`）。環境変数: `AZURE_SPEECH_REGION` または `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">任意の Azure Speech エンドポイント上書き（エイリアス: `baseUrl`）。</ParamField>
    <ParamField path="speakerVoice" type="string">Azure 音声の ShortName。デフォルトは `en-US-JennyNeural`。レガシーエイリアス: `voice`。</ParamField>
    <ParamField path="lang" type="string">SSML 言語コード。デフォルトは `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">標準音声用の Azure `X-Microsoft-OutputFormat`。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">ボイスノート出力用の Azure `X-Microsoft-OutputFormat`。デフォルトは `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` または `XI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">モデル ID。デフォルトは `eleven_multilingual_v2`。レガシー ID の `eleven_turbo_v2_5`/`eleven_turbo_v2` は、対応する `flash` モデルに正規化されます。</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs の音声 ID。デフォルトは `pMsXgVXv3BLzUgSXRplE`。レガシーエイリアス: `voiceId`。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（各 `0..1`、デフォルトは `0.5`/`0.75`/`0`）、`useSpeakerBoost`（`true|false`、デフォルトは `true`）、`speed`（`0.5..2.0`、デフォルトは `1.0`）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>テキスト正規化モード。</ParamField>
    <ParamField path="languageCode" type="string">2 文字の ISO 639-1（例: `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">ベストエフォートの決定性を得るための整数 `0..4294967295`。</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API のベース URL を上書きします。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` にフォールバックします。省略した場合、TTS は環境変数へのフォールバック前に `models.providers.google.apiKey` を再利用できます。</ParamField>
    <ParamField path="model" type="string">Gemini TTS モデル。デフォルトは `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini の組み込み音声名。デフォルトは `Kore`。旧エイリアス: `voiceName`、`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">読み上げるテキストの前に付加される、自然言語によるスタイルプロンプト。</ParamField>
    <ParamField path="speakerName" type="string">プロンプトで名前付き話者を使用する場合に、読み上げるテキストの前に付加される任意の話者ラベル。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>アクティブなペルソナプロンプトフィールドを決定論的な Gemini TTS プロンプト構造でラップするには、`audio-profile-v1` に設定します。</ParamField>
    <ParamField path="personaPrompt" type="string">テンプレートの Director's Notes に追加される、Google 固有の追加ペルソナプロンプトテキスト。</ParamField>
    <ParamField path="baseUrl" type="string">`https://generativelanguage.googleapis.com` のみ使用できます。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">環境変数: `GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">`api.gradium.ai` 上の HTTPS Gradium API URL。デフォルトは `https://api.gradium.ai`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">デフォルトは Emma（`YTpq7expH9539ERJ`）。旧エイリアス: `voiceId`。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld プライマリ

    <ParamField path="apiKey" type="string">環境変数: `INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">デフォルトは `inworld-tts-1.5-max`。ほかに `inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">デフォルトは `Sarah`。旧エイリアス: `voiceId`。</ParamField>
    <ParamField path="temperature" type="number">サンプリング温度 `0..2`（0 を除く）。</ParamField>

  </Accordion>

  <Accordion title="ローカル CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS 用のローカル実行可能ファイルまたはコマンド文字列。</ParamField>
    <ParamField path="args" type="string[]">コマンド引数。`{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` のプレースホルダーに対応します。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>想定される CLI 出力形式。音声添付のデフォルトは `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">コマンドのタイムアウト（ミリ秒）。デフォルトは `120000`。</ParamField>
    <ParamField path="cwd" type="string">任意のコマンド作業ディレクトリ。</ParamField>
    <ParamField path="env" type="Record<string, string>">コマンドに対する任意の環境変数オーバーライド。</ParamField>

    コマンドの標準出力と、生成または変換された音声の上限は 50 MiB です。診断用の標準エラー出力の上限は 1 MiB です。いずれかの上限を超えると、OpenClaw はコマンドを終了し、音声合成を失敗させます。

  </Accordion>

  <Accordion title="Microsoft（API キー不要）">
    <ParamField path="enabled" type="boolean" default="true">Microsoft 音声の使用を許可します。</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft ニューラル音声名（例: `en-US-MichelleNeural`）。旧エイリアス: `voice`。デフォルトの英語音声が有効で、返信テキストが主に CJK 文字で構成されている場合、OpenClaw は自動的に `zh-CN-XiaoxiaoNeural` に切り替えます。</ParamField>
    <ParamField path="lang" type="string">言語コード（例: `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft の出力形式。デフォルトは `audio-24khz-48kbitrate-mono-mp3`。同梱の Edge ベースのトランスポートでは、すべての形式がサポートされるわけではありません。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">パーセント文字列（例: `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">音声ファイルとともに JSON 字幕を書き込みます。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 音声リクエスト用のプロキシ URL。</ParamField>
    <ParamField path="timeoutMs" type="number">リクエストのタイムアウトオーバーライド（ms）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>旧エイリアス。永続化された設定を `providers.microsoft` に書き換えるには、`openclaw doctor --fix` を実行します。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` にフォールバックします。`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、または `MINIMAX_CODING_API_KEY` による Token Plan 認証。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.minimax.io`。環境変数: `MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `speech-2.8-hd`。環境変数: `MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">デフォルトは `English_expressive_narrator`。環境変数: `MINIMAX_TTS_VOICE_ID`。旧エイリアス: `voiceId`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。デフォルトは `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。デフォルトは `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。デフォルトは `0`。小数値はリクエスト前に切り捨てられます。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` にフォールバックします。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS モデル ID。デフォルトは `gpt-4o-mini-tts`。</ParamField>
    <ParamField path="speakerVoice" type="string">音声名（例: `alloy`、`cedar`）。デフォルトは `coral`。旧エイリアス: `voice`。</ParamField>
    <ParamField path="instructions" type="string">明示的な OpenAI `instructions` フィールド。設定した場合、ペルソナプロンプトフィールドは自動的にマッピングされません。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">生成された OpenAI TTS フィールドの後で、`/audio/speech` リクエストボディにマージされる追加 JSON フィールド。`lang` のようなプロバイダー固有キーを必要とする Kokoro などの OpenAI 互換エンドポイントに使用します。安全でないプロトタイプキーは無視されます。</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS エンドポイントをオーバーライドします。解決順序: 設定 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。デフォルト以外の値は OpenAI 互換 TTS エンドポイントとして扱われるため、カスタムのモデル名と音声名が許可され、`speed` には `0.25..4.0` の範囲チェックが適用されなくなります。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">環境変数: `OPENROUTER_API_KEY`。`models.providers.openrouter.apiKey` を再利用できます。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://openrouter.ai/api/v1`。旧形式の `https://openrouter.ai/v1` は正規化されます。</ParamField>
    <ParamField path="model" type="string">デフォルトは `hexgrad/kokoro-82m`。エイリアス: `modelId`。</ParamField>
    <ParamField path="speakerVoice" type="string">デフォルトは `af_alloy`。旧エイリアス: `voice`、`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>デフォルトは `mp3`。</ParamField>
    <ParamField path="speed" type="number">プロバイダー固有の速度オーバーライド。</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">環境変数: `VOLCENGINE_TTS_API_KEY` または `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">デフォルトは `seed-tts-1.0`。環境変数: `VOLCENGINE_TTS_RESOURCE_ID`。プロジェクトに TTS 2.0 の利用権限がある場合は `seed-tts-2.0` を使用します。</ParamField>
    <ParamField path="appKey" type="string">アプリキーヘッダー。デフォルトは `aGjiRDfUWi`。環境変数: `VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP エンドポイントをオーバーライドします。環境変数: `VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="speakerVoice" type="string">音声タイプ。デフォルトは `en_female_anna_mars_bigtts`。環境変数: `VOLCENGINE_TTS_VOICE`。旧エイリアス: `voice`。</ParamField>
    <ParamField path="speedRatio" type="number">プロバイダー固有の速度比率、`0.2..3`。</ParamField>
    <ParamField path="emotion" type="string">プロバイダー固有の感情タグ。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>旧 Volcengine Speech Console フィールド。環境変数: `VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（デフォルトは `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">環境変数: `XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.x.ai/v1`。環境変数: `XAI_BASE_URL`。</ParamField>
    <ParamField path="speakerVoiceId" type="string">デフォルトは `eve`。認証がある場合、`openclaw infer tts voices --provider xai` は現在の組み込みカタログを取得します。認証がない場合は、オフラインフォールバックの `ara`、`eve`、`leo`、`rex`、`sal` を一覧表示します。アカウントのカスタム音声 ID は、組み込みリストに存在しない場合でも転送されます。旧エイリアス: `voiceId`。</ParamField>
    <ParamField path="language" type="string">BCP-47 言語コードまたは `auto`。デフォルトは `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>デフォルトは `mp3`。</ParamField>
    <ParamField path="speed" type="number">プロバイダー固有の速度オーバーライド、`0.7..1.5`。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">環境変数: `XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">デフォルトは `https://api.xiaomimimo.com/v1`。環境変数: `XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">デフォルトは `mimo-v2.5-tts`。環境変数: `XIAOMI_TTS_MODEL`。`mimo-v2-tts` と `mimo-v2.5-tts-voicedesign` にも対応します。</ParamField>
    <ParamField path="speakerVoice" type="string">プリセット音声モデルのデフォルトは `mimo_default`。環境変数: `XIAOMI_TTS_VOICE`。旧エイリアス: `voice`。`mimo-v2.5-tts-voicedesign` には送信されません。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>デフォルトは `mp3`。環境変数: `XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">ユーザーメッセージとして送信され、読み上げられない任意の自然言語スタイル指示。`mimo-v2.5-tts-voicedesign` では、これが音声デザインプロンプトになります。省略した場合は OpenClaw がデフォルトを指定します。</ParamField>
  </Accordion>
</AccordionGroup>

## エージェントツール

`tts` ツールはテキストを音声に変換し、返信配信用の音声添付を返します。Feishu、Matrix、Telegram、WhatsApp では、音声はファイル添付ではなく音声メッセージとして配信されます。この経路では、`ffmpeg` が利用可能な場合、Feishu と WhatsApp は Opus 以外の TTS 出力をトランスコードできます。

WhatsApp は Baileys を介して音声を PTT ボイスノート（`audio` と `ptt: true`）として送信します。また、クライアントがボイスノートのキャプションを一貫して表示しないため、表示テキストは PTT 音声とは**別に**送信します。

このツールは任意の `channel` フィールドと `timeoutMs` フィールドを受け付けます。`timeoutMs` は呼び出しごとのプロバイダーリクエストタイムアウト（ミリ秒）です。呼び出しごとの値は `messages.tts.timeoutMs` をオーバーライドし、設定された TTS タイムアウトは Plugin が指定したプロバイダーのデフォルト値をオーバーライドします。

## Gateway RPC

| メソッド            | 目的                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | 現在の TTS 状態と直近の試行を読み取ります。     |
| `tts.enable`      | ローカルの自動設定を `always` に設定します。       |
| `tts.disable`     | ローカルの自動設定を `off` に設定します。          |
| `tts.convert`     | 1 回限りでテキストを音声に変換します。                        |
| `tts.setProvider` | ローカルのプロバイダー設定を指定します。               |
| `tts.personas`    | 設定済みのペルソナと現在有効なペルソナを一覧表示します。 |
| `tts.setPersona`  | ローカルのペルソナ設定を指定します。                |
| `tts.providers`   | 設定済みのプロバイダーとその状態を一覧表示します。        |

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

## 関連項目

- [メディアの概要](/ja-JP/tools/media-overview)
- [音楽生成](/ja-JP/tools/music-generation)
- [動画生成](/ja-JP/tools/video-generation)
- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [音声通話 Plugin](/ja-JP/plugins/voice-call)

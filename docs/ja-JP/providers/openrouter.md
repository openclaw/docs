---
read_when:
    - 多数のLLMで単一のAPIキーを使用したい場合
    - OpenClaw で OpenRouter 経由でモデルを実行したい場合
    - 画像生成に OpenRouter を使用する場合
    - 音楽生成に OpenRouter を使用する場合
    - 動画生成に OpenRouter を使用したい場合
summary: OpenRouter の統合 API を使用して、OpenClaw から多数のモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-07-11T22:36:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter は、1 つの API と 1 つのキーを介して、多数のモデルにリクエストをルーティングします。
OpenAI 互換であるため、OpenClaw は他のプロキシプロバイダーで使用されるものと同じ
`openai-completions` 形式のトランスポートを介して通信します。

## はじめに

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw は OpenRouter のブラウザーサインインフロー（PKCE）を開き、コードを
        OpenRouter API キーと交換して、デフォルトの OpenRouter 認証プロファイルに
        保存します。リモートまたはヘッドレスホストでは、OpenClaw がサインイン URL を
        表示し、サインイン後にリダイレクト URL を貼り付けるよう求めます。
      </Step>
      <Step title="（任意）特定のモデルに切り替える">
        オンボーディングのデフォルトは `openrouter/auto` です。後から具体的なモデルを選択できます。

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API キー">
    <Steps>
      <Step title="API キーを取得する">
        [openrouter.ai/keys](https://openrouter.ai/keys) で API キーを作成します。
      </Step>
      <Step title="API キーによるオンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="（任意）特定のモデルに切り替える">
        オンボーディングのデフォルトは `openrouter/auto` です。後から具体的なモデルを選択できます。

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## モデル参照

<Note>
モデル参照は `openrouter/<provider>/<model>` のパターンに従います。利用可能な
プロバイダーとモデルの完全な一覧については、[/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

ライブカタログの検出を利用できない場合に使用される同梱フォールバックモデル：

| モデル参照                        | 注記                              |
| --------------------------------- | --------------------------------- |
| `openrouter/auto`                 | OpenRouter による自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6       |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI 経由の Kimi K2.5       |

`openrouter/openrouter/fusion`（[Fusion ルーター](#fusion-router)を参照）を含む、
その他すべての `openrouter/<provider>/<model>` 参照は、OpenRouter のライブモデルカタログに対して
動的に解決されます。

## 画像生成

OpenRouter は `image_generate` ツールのバックエンドとして使用できます。
`agents.defaults.imageGenerationModel` に OpenRouter の画像モデルを設定します。

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw は `modalities: ["image", "text"]` を指定し、OpenRouter の
chat-completions 画像 API に画像リクエストを送信します。Gemini 画像モデルには、
OpenRouter の `image_config` を介して `aspectRatio` と `resolution` のヒントも
送信されますが、他の画像モデルには送信されません。低速なモデルには
`agents.defaults.imageGenerationModel.timeoutMs` を使用します。ただし、
`image_generate` ツールの呼び出しごとの `timeoutMs` が常に優先されます。

## 動画生成

OpenRouter は、非同期の `/videos` API を介して `video_generate` ツールの
バックエンドとして使用できます。`agents.defaults.videoGenerationModel` に
OpenRouter の動画モデルを設定します。

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw はテキストから動画、および画像から動画を生成するジョブを送信し、
返された `polling_url` をポーリングして、完成した動画を OpenRouter の
`unsigned_urls` またはジョブコンテンツのエンドポイントからダウンロードします。
参照画像はデフォルトで先頭／最終フレーム画像として扱われますが、
`reference_image` タグが付いた画像は代わりに入力参照として送信されます。
同梱のデフォルトモデル `google/veo-3.1-fast` は、4／6／8 秒の長さ、
`720P`／`1080P` の解像度、`16:9`／`9:16` のアスペクト比をサポートします。
動画から動画への生成はサポートされません。上流 API が受け付ける参照は
テキストと画像のみです。

## 音楽生成

OpenRouter は、chat-completions の音声出力を介して `music_generate` ツールの
バックエンドとして使用できます。`agents.defaults.musicGenerationModel` に
OpenRouter の音声モデルを設定します。

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

同梱の OpenRouter 音楽プロバイダーはデフォルトで `google/lyria-3-pro-preview` を使用し、
`google/lyria-3-clip-preview` も公開します。OpenClaw は `modalities:
["text", "audio"]` を送信してレスポンスをストリーミングし、音声チャンクを収集して、
チャンネル配信用の生成メディアとして結果を保存します。Lyria モデルは、共通の
`music_generate image=...` パラメーターを介して 1 枚の参照画像を受け付けます。
ストリーミング音声、文字起こしの保持、および派生する SSE イベントエンベロープは、
`agents.defaults.mediaMaxMb` によって制限されます（デフォルトの音声上限は 16 MB）。

## テキスト読み上げ

OpenRouter は、OpenAI 互換の `/audio/speech` エンドポイントを介して
TTS プロバイダーとして機能できます。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

`messages.tts.providers.openrouter.apiKey` が省略されている場合、TTS は
`models.providers.openrouter.apiKey`、次に `OPENROUTER_API_KEY` へフォールバックします。

## 音声文字起こし（受信音声）

OpenRouter は、共有の `tools.media.audio` パスを介し、STT エンドポイント
（`/audio/transcriptions`）を使用して、受信した音声添付ファイルを文字起こしできます。
これは、受信した音声をメディア理解の事前処理に転送するすべてのチャンネル Plugin に
適用されます。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw は、multipart 形式の OpenAI フォームアップロードではなく、
`input_audio` に base64 音声を格納した JSON（OpenRouter の STT 契約）として
OpenRouter STT リクエストを送信します。

## Fusion ルーター

OpenRouter Fusion は、1 つの OpenClaw モデル参照を複数の OpenRouter モデルへ
並列送信し、OpenRouter に各回答を評価させ、通常の OpenRouter エンドポイントを介して
1 つの最終レスポンスを返します。上流モデルのスラッグは `openrouter/fusion` であるため、
OpenClaw モデル参照には OpenClaw のプロバイダープレフィックスと上流 OpenRouter の
名前空間の両方が含まれます。

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion のパネルと評価モデルは、モデルの `params.extraBody` を介して設定します。
これらのフィールドは OpenRouter の chat-completions リクエスト本文へ直接転送されます。
Fusion は OAuth と API キーによるオンボーディングのどちらでも動作します。
OAuth を使用する場合は、以下の `env.OPENROUTER_API_KEY` 行を省略してください。

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` は並列パネルであり、Fusion Plugin 設定内の `model` は評価モデルです。
Fusion を強制する目的で、通常のエージェント／チャットターンにおいてトップレベルの
`tool_choice` を `"required"` に設定しないでください。OpenClaw のターンには独自の
ツール定義が含まれる場合があり、トップレベルでツールを必須にすると、Fusion ルーターではなく
それらのツールのいずれかが選択される可能性があります。この Fusion Plugin 設定が存在する場合、
OpenClaw は設定済みの分析モデルと評価モデルを一覧にした、サニタイズ済みのシステムプロンプト注記を
追加します。これにより、エージェントは自身の Fusion パネルに関する質問へ回答できます。
その他の `extraBody` フィールドはプロンプトにコピーされません。

Fusion は設計上低速です。OpenRouter はプロンプトを複数の分析モデルに振り分けた後、
評価／統合ステップを実行するため、直接的な単一モデルリクエストよりもレイテンシーが高くなります。
慎重に検討された高品質な回答やエスカレーション経路に使用し、レイテンシーを重視するデフォルトには
使用しないでください。より迅速なレスポンスを得るには、パネルを小さく保ち、
高速な分析モデルと評価モデルを選択します。

設定済みの参照を 1 回限りのローカル呼び出しでテストします。

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 認証とヘッダー

OpenRouter は API キーを Bearer トークンとして使用します。OpenRouter OAuth は
OpenRouter API キーを発行する PKCE ログインフローであるため、OpenClaw はその結果を、
手動の API キー設定でも使用される同じ `openrouter:default` API キー認証プロファイルに
保存します。

既存のインストール環境で、完全なオンボーディングを再実行せずにサインインまたは保存済みキーを
ローテーションするには、次を実行します。

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

検証済みの OpenRouter リクエスト（`https://openrouter.ai/api/v1`）では、OpenClaw は
OpenRouter のドキュメントに記載されたアプリ帰属ヘッダーを追加します。

| ヘッダー                  | 値                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter プロバイダーの接続先を別のプロキシまたはベース URL に変更した場合、OpenClaw は
OpenRouter 固有のヘッダーや Anthropic のキャッシュマーカーを挿入**しません**。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="レスポンスキャッシュ">
    OpenRouter のレスポンスキャッシュはオプトインです。モデルごとに有効化します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw は `X-OpenRouter-Cache: true` を送信し、設定されている場合は
    `X-OpenRouter-Cache-TTL` も送信します。`responseCacheClear: true` は現在の
    リクエストに対して更新を強制し、置換後のレスポンスを保存します。スネークケースの
    エイリアス（`response_cache`、`response_cache_ttl_seconds`、
    `response_cache_clear`）に加え、`Seconds` サフィックスのない
    `responseCacheTtl`／`response_cache_ttl` も使用できます。

    これは、プロバイダーのプロンプトキャッシュや OpenRouter の Anthropic
    `cache_control` マーカーとは別のものです。カスタムプロキシのベース URL ではなく、
    検証済みの `openrouter.ai` ルートにのみ適用されます。

  </Accordion>

  <Accordion title="Anthropic キャッシュマーカー">
    検証済みの OpenRouter ルートでは、Anthropic のモデル参照は、システム／開発者
    プロンプトブロックでプロンプトキャッシュをより効率的に再利用できるよう、
    OpenRouter の Anthropic `cache_control` マーカーを保持します。
  </Accordion>

  <Accordion title="Anthropic 推論のプリフィル">
    検証済みの OpenRouter ルートでは、推論が有効な Anthropic モデル参照について、
    リクエストが OpenRouter に到達する前に末尾のアシスタントプリフィルターンを
    削除します。これは、推論会話をユーザーターンで終了する必要があるという
    Anthropic の要件に準拠するためです。
  </Accordion>

  <Accordion title="思考 / 推論の注入">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された思考レベルを
    OpenRouter プロキシの推論ペイロードにマッピングします。`openrouter/auto` と
    サポートされていないモデルヒントでは、この注入をスキップします。古い
    `openrouter/hunter-alpha` 参照でもスキップします。これは、廃止されたそのルートで
    OpenRouter が推論フィールドに最終回答テキストを返す可能性があったためです。
  </Accordion>

  <Accordion title="DeepSeek V4 推論の再生">
    検証済みの OpenRouter ルートでは、`openrouter/deepseek/deepseek-v4-flash` と
    `openrouter/deepseek/deepseek-v4-pro` は、再生されたアシスタントターンで欠落している
    `reasoning_content` を補完し、思考とツールを含む会話を DeepSeek V4 が要求する
    後続形式に保ちます。OpenClaw はこれらのルートに対して、OpenRouter がサポートする
    `reasoning.effort` 値を送信します。`xhigh`/`max` は `xhigh` にマッピングされ、
    オフ以外のその他すべてのレベルは `high` にマッピングされます。
  </Accordion>

  <Accordion title="OpenAI 専用のリクエスト整形">
    OpenRouter はプロキシ形式の OpenAI 互換パスを通るため、`serviceTier`、Responses の
    `store`、OpenAI 推論互換ペイロード、プロンプトキャッシュのヒントなど、
    OpenAI ネイティブ専用のリクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini ベースのルート">
    Gemini ベースの OpenRouter 参照は、プロキシ Gemini パスに留まります。OpenClaw は
    そこで Gemini の思考署名のサニタイズを維持しますが、ネイティブ Gemini の
    再生検証やブートストラップの書き換えは有効にしません。
  </Accordion>

  <Accordion title="プロバイダールーティングのメタデータ">
    OpenRouter は、基盤となるプロバイダーのルーティング用に `provider` リクエスト
    オブジェクトをサポートします。すべての OpenRouter テキストモデルリクエストに
    適用するデフォルトポリシーを `models.providers.openrouter.params.provider` で
    設定します。

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw は、そのオブジェクトをリクエストの `provider` ペイロードとして
    OpenRouter に転送します。`sort`、`only`、`ignore`、`order`、`allow_fallbacks`、
    `require_parameters`、`data_collection`、`quantizations`、`max_price`、
    `preferred_max_latency`、`preferred_min_throughput`、`zdr`、
    `enforce_distillable_text` など、OpenRouter のドキュメントに記載された
    snake_case フィールドを使用してください。

    モデル単位のパラメーターは、プロバイダー全体のルーティングオブジェクトを
    上書きします。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    これは OpenRouter のチャット補完ルートにのみ適用されます。Anthropic、Google、
    OpenAI、またはカスタムプロバイダーへの直接ルートでは、OpenRouter の
    ルーティングパラメーターは無視されます。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>

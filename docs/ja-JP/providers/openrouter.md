---
read_when:
    - 多くのLLMに対して単一のAPIキーを使いたい
    - OpenClaw で OpenRouter 経由でモデルを実行したい
    - OpenRouterを画像生成に使用したい
    - 音楽生成に OpenRouter を使用したい
    - OpenRouter を動画生成に使用したい
summary: OpenClaw で OpenRouter の統合 API を使用して多数のモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-07-05T11:45:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e500fa78c096a5d16d7099d12a4e96659f15e44be09c3ad6dfcbafdb5f6827fb
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter は、1 つの API と 1 つのキーの背後で多数のモデルにリクエストをルーティングします。これは
OpenAI 互換のため、OpenClaw は他のプロキシプロバイダーで使用されるものと同じ
`openai-completions` スタイルのトランスポートで通信します。

## はじめに

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw は OpenRouter のブラウザーサインインフロー (PKCE) を開き、
        コードを OpenRouter API キーと交換し、それをデフォルトの
        OpenRouter 認証プロファイルに保存します。リモート/ヘッドレスホストでは、OpenClaw は
        サインイン URL を表示し、サインイン後にリダイレクト URL を貼り付けるよう求めます。
      </Step>
      <Step title="(任意) 特定のモデルに切り替え">
        オンボーディングのデフォルトは `openrouter/auto` です。後で具体的なモデルを選択します。

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="API キーを取得">
        [openrouter.ai/keys](https://openrouter.ai/keys) で API キーを作成します。
      </Step>
      <Step title="API キーのオンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(任意) 特定のモデルに切り替え">
        オンボーディングのデフォルトは `openrouter/auto` です。後で具体的なモデルを選択します。

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

ライブカタログ検出を利用できない場合に使用される、同梱のフォールバックモデル:

| モデル参照                        | 注記                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter の自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6  |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI 経由の Kimi K2.5  |

[Fusion router](#fusion-router) を参照する `openrouter/openrouter/fusion` を含む
その他の任意の `openrouter/<provider>/<model>` 参照は、OpenRouter のライブモデルカタログに対して
動的に解決されます。

## 画像生成

OpenRouter は `image_generate` ツールを支えることができます。OpenRouter 画像モデルを
`agents.defaults.imageGenerationModel` の下に設定します。

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

OpenClaw は `modalities: ["image", "text"]` を指定して、画像リクエストを OpenRouter の chat-completions 画像 API に送信します。Gemini 画像モデルはさらに、
OpenRouter の `image_config` を通じて `aspectRatio` と `resolution` のヒントを受け取りますが、他の
画像モデルは受け取りません。遅いモデルには `agents.defaults.imageGenerationModel.timeoutMs` を使用します。
`image_generate` ツールの呼び出しごとの `timeoutMs` が引き続き優先されます。

## 動画生成

OpenRouter は非同期の
`/videos` API を通じて `video_generate` ツールを支えることができます。OpenRouter 動画モデルを
`agents.defaults.videoGenerationModel` の下に設定します。

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

OpenClaw はテキストから動画および画像から動画のジョブを送信し、返された
`polling_url` をポーリングして、OpenRouter の
`unsigned_urls` またはジョブコンテンツエンドポイントから完成した動画をダウンロードします。参照画像のデフォルトは
先頭/最終フレーム画像です。`reference_image` が付いた画像は、代わりに入力
参照として送信されます。同梱の `google/veo-3.1-fast` デフォルトは 4/6/8
秒の長さ、`720P`/`1080P` 解像度、`16:9`/`9:16` アスペクト比をサポートします。
動画から動画はサポートされていません。アップストリーム API はテキストと画像
参照のみを受け付けます。

## 音楽生成

OpenRouter は chat-completions の音声
出力を通じて `music_generate` ツールを支えることができます。OpenRouter 音声モデルを
`agents.defaults.musicGenerationModel` の下に設定します。

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
["text", "audio"]` を送信し、レスポンスをストリーミングし、音声チャンクを収集して、
チャンネル配信用の生成メディアとして結果を保存します。Lyria モデルは共有の
`music_generate image=...` パラメーターを通じて 1 つの参照画像を受け付けます。

## テキスト読み上げ

OpenRouter は、OpenAI 互換の `/audio/speech` エンドポイントを通じて TTS プロバイダーとして機能できます。

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

`messages.tts.providers.openrouter.apiKey` を省略すると、TTS は
`models.providers.openrouter.apiKey`、次に `OPENROUTER_API_KEY` へフォールバックします。

## 音声テキスト変換（受信音声）

OpenRouter は、共有の `tools.media.audio` パスを通じて、STT エンドポイント（`/audio/transcriptions`）を使用して受信した音声/オーディオ添付ファイルを文字起こしできます。
これは、受信した音声/オーディオをメディア理解の事前確認へ転送するすべてのチャンネル Plugin に適用されます。

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

OpenClaw は、OpenRouter STT リクエストを multipart の OpenAI フォームアップロードとしてではなく、`input_audio` に base64 音声を含む JSON（OpenRouter の STT 契約）として送信します。

## Fusion ルーター

OpenRouter Fusion は、1 つの OpenClaw モデル参照を複数の OpenRouter モデルへ並列に送信し、OpenRouter にそれらの回答を判定させ、通常の OpenRouter エンドポイントを通じて 1 つの最終応答を返します。アップストリームのモデルスラッグは `openrouter/fusion` なので、OpenClaw モデル参照には OpenClaw のプロバイダープレフィックスとアップストリームの OpenRouter 名前空間の両方が含まれます。

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion のパネルと判定役は、モデルの `params.extraBody` を通じて設定します。
これらのフィールドは OpenRouter chat-completions リクエスト本文へ直接転送されます。
Fusion は OAuth または API キーのオンボーディングのどちらでも動作します。OAuth を使用する場合は、下の `env.OPENROUTER_API_KEY` 行を省略してください。

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

`analysis_models` は並列パネルです。Fusion Plugin 設定内の `model` は判定モデルです。通常のエージェント/チャットターンで Fusion を強制しようとして、トップレベルの `tool_choice` を `"required"` に設定しないでください。OpenClaw のターンには独自のツール定義が含まれる場合があり、トップレベルの必須ツール選択によって、Fusion ルーターではなくそれらのいずれかが選ばれる可能性があります。この Fusion Plugin 設定が存在する場合、OpenClaw は設定済みの分析モデルと判定モデルを列挙したサニタイズ済みシステムプロンプト注記を追加するため、エージェントは自身の Fusion パネルについての質問に回答できます。他の `extraBody` フィールドはプロンプトにコピーされません。

Fusion は設計上遅くなります。OpenRouter がプロンプトを複数の分析モデルへファンアウトし、その後に判定/統合ステップを実行するため、レイテンシは直接の単一モデルリクエストより高くなります。レイテンシが重要なデフォルトとしてではなく、慎重で高品質な回答やエスカレーション経路に使用してください。応答を速くするには、パネルを小さく保ち、より高速な分析/判定モデルを選んでください。

設定済み参照を 1 回限りのローカル呼び出しでテストします。

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 認証とヘッダー

OpenRouter は API キーからの Bearer トークンを使用します。OpenRouter OAuth は OpenRouter API キーを発行する PKCE ログインフローであるため、OpenClaw は手動の API キー設定で使用されるものと同じ `openrouter:default` API キー認証プロファイルに結果を保存します。

既存のインストールでフルオンボーディングを再実行せずにサインインする、または保存済みキーをローテーションするには、次を実行します。

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

検証済み OpenRouter リクエスト（`https://openrouter.ai/api/v1`）では、OpenClaw は OpenRouter が文書化しているアプリ属性ヘッダーを追加します。

| ヘッダー                    | 値                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter プロバイダーを別のプロキシまたはベース URL に向け直した場合、OpenClaw はそれらの OpenRouter 固有ヘッダーや Anthropic キャッシュマーカーを挿入しません。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="応答キャッシュ">
    OpenRouter の応答キャッシュはオプトインです。モデルごとに有効化します。

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
    `X-OpenRouter-Cache-TTL` も送信します。`responseCacheClear: true` は現在のリクエストで強制的に更新し、置き換え後の応答を保存します。Snake_case のエイリアス（`response_cache`、`response_cache_ttl_seconds`、
    `response_cache_clear`）も受け付けます。また、`Seconds` サフィックスなしの `responseCacheTtl` /
    `response_cache_ttl` も受け付けます。

    これはプロバイダーのプロンプトキャッシュ、および OpenRouter の Anthropic `cache_control` マーカーとは別です。これは検証済みの `openrouter.ai` ルートにのみ適用され、カスタムプロキシのベース URL には適用されません。

  </Accordion>

  <Accordion title="Anthropic キャッシュマーカー">
    検証済み OpenRouter ルートでは、Anthropic モデル参照は、システム/開発者プロンプトブロックでプロンプトキャッシュをより再利用しやすくするため、OpenRouter の Anthropic `cache_control` マーカーを保持します。
  </Accordion>

  <Accordion title="Anthropic reasoning プリフィル">
    検証済み OpenRouter ルートでは、reasoning が有効な Anthropic モデル参照は、リクエストが OpenRouter に到達する前に末尾のアシスタントプリフィルターンを削除し、reasoning 会話はユーザーターンで終わる必要があるという Anthropic の要件に合わせます。
  </Accordion>

  <Accordion title="思考 / 推論の注入">
    サポートされている非`auto`ルートでは、OpenClaw は選択された思考レベルを
    OpenRouter プロキシの推論ペイロードにマッピングします。`openrouter/auto` とサポート対象外の
    モデルヒントでは、その注入はスキップされます。古い `openrouter/hunter-alpha` 参照も
    スキップされます。その廃止済みルートでは、OpenRouter が推論
    フィールドに最終回答テキストを返す可能性があるためです。
  </Accordion>

  <Accordion title="DeepSeek V4 推論リプレイ">
    検証済みの OpenRouter ルートでは、`openrouter/deepseek/deepseek-v4-flash` と
    `openrouter/deepseek/deepseek-v4-pro` が、リプレイされた assistant ターンで欠落している `reasoning_content` を補完し、
    思考/ツールの会話を DeepSeek V4 が要求する後続ターンの形に保ちます。OpenClaw はこれらのルートに対して、
    OpenRouter がサポートする `reasoning.effort` 値を送信します。`xhigh`/`max` は `xhigh` にマッピングされ、
    その他すべてのオフ以外のレベルは `high` にマッピングされます。
  </Accordion>

  <Accordion title="OpenAI 専用リクエスト整形">
    OpenRouter はプロキシ形式の OpenAI 互換パスを通るため、
    `serviceTier`、Responses `store`、OpenAI 推論互換ペイロード、
    プロンプトキャッシュヒントなどのネイティブの OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックのルート">
    Gemini バックの OpenRouter 参照はプロキシ Gemini パスに留まります。OpenClaw はそこで
    Gemini の思考シグネチャのサニタイズを維持しますが、ネイティブの
    Gemini リプレイ検証やブートストラップの書き換えは有効にしません。
  </Accordion>

  <Accordion title="プロバイダールーティングメタデータ">
    OpenRouter は、基盤プロバイダーのルーティング用に `provider` リクエストオブジェクトをサポートしています。
    すべての OpenRouter テキストモデルリクエストに対するデフォルトポリシーを
    `models.providers.openrouter.params.provider` で設定します。

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

    OpenClaw はそのオブジェクトをリクエストの `provider`
    ペイロードとして OpenRouter に転送します。`sort`、
    `only`、`ignore`、`order`、`allow_fallbacks`、`require_parameters`、
    `data_collection`、`quantizations`、`max_price`、`preferred_max_latency`、
    `preferred_min_throughput`、`zdr`、`enforce_distillable_text` など、
    OpenRouter が文書化している snake_case フィールドを使用してください。

    モデルごとの params は、プロバイダー全体のルーティングオブジェクトを上書きします。

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

    これは OpenRouter chat-completions ルートにのみ適用されます。直接の Anthropic、
    Google、OpenAI、またはカスタムプロバイダーのルートは、OpenRouter ルーティング params を無視します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>

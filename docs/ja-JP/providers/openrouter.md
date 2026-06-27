---
read_when:
    - 多くの LLM に対して単一の API キーを使いたい
    - OpenClaw で OpenRouter 経由でモデルを実行したい
    - 画像生成に OpenRouter を使用したい
    - OpenRouter を音楽生成に使用したい
    - OpenRouter を動画生成に使用したい
summary: OpenRouter の統合 API を使用して、OpenClaw で多くのモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T12:47:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter は、単一のエンドポイントと API キーの背後で多数のモデルへリクエストをルーティングする **統合 API** を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

## はじめに

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw は OpenRouter のブラウザーサインインフローを開き、PKCE
        コードを OpenRouter API キーと交換し、そのキーをデフォルトの
        OpenRouter 認証プロファイルに保存します。リモートまたはヘッドレスホストでは、OpenClaw は
        サインイン URL を表示し、サインイン後にリダイレクト URL を貼り付けるよう求めます。
      </Step>
      <Step title="(任意) 特定のモデルに切り替える">
        オンボーディングのデフォルトは `openrouter/auto` です。あとで具体的なモデルを選択します。

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
      <Step title="API キーのオンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(任意) 特定のモデルに切り替える">
        オンボーディングのデフォルトは `openrouter/auto` です。あとで具体的なモデルを選択します。

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
モデル参照は `openrouter/<provider>/<model>` というパターンに従います。利用可能なプロバイダーとモデルの完全な一覧は、[/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

同梱フォールバック例:

| モデル参照                      | 注記                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自動ルーティング |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion ルーター  |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI 経由の Kimi K2.5 |

## 画像生成

OpenRouter は `image_generate` ツールのバックエンドとしても使用できます。`agents.defaults.imageGenerationModel` 配下で OpenRouter 画像モデルを使用します。

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

OpenClaw は `modalities: ["image", "text"]` を指定して、OpenRouter のチャット補完画像 API に画像リクエストを送信します。Gemini 画像モデルは、サポートされている `aspectRatio` と `resolution` のヒントを OpenRouter の `image_config` 経由で受け取ります。遅い OpenRouter 画像モデルには `agents.defaults.imageGenerationModel.timeoutMs` を使用してください。`image_generate` ツールの呼び出しごとの `timeoutMs` パラメーターは引き続き優先されます。

## 動画生成

OpenRouter は非同期の `/videos` API を通じて `video_generate` ツールのバックエンドとしても使用できます。`agents.defaults.videoGenerationModel` 配下で OpenRouter 動画モデルを使用します。

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

OpenClaw はテキストから動画および画像から動画のジョブを OpenRouter に送信し、
返された `polling_url` をポーリングし、完成した動画を
OpenRouter の `unsigned_urls` または文書化されたジョブコンテンツエンドポイントからダウンロードします。
参照画像はデフォルトで先頭/末尾フレーム画像として送信されます。`reference_image`
でタグ付けされた画像は OpenRouter 入力参照として送信されます。同梱の
`google/veo-3.1-fast` デフォルトは、現在サポートされている 4/6/8
秒の長さ、`720P`/`1080P` 解像度、`16:9`/`9:16` アスペクト比を
公開します。上流の動画生成 API が現在テキストと画像参照を受け付けるため、
動画から動画は OpenRouter には登録されていません。

## 音楽生成

OpenRouter はチャット補完の音声出力を通じて `music_generate`
ツールのバックエンドとしても使用できます。`agents.defaults.musicGenerationModel`
配下で OpenRouter 音声モデルを使用します。

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

同梱の OpenRouter 音楽プロバイダーは
`google/lyria-3-pro-preview` をデフォルトとし、
`google/lyria-3-clip-preview` も公開します。OpenClaw は `modalities: ["text",
"audio"]` を送信し、ストリーミングを有効にし、ストリーミングされた音声チャンクを収集して、
チャンネル配信用の生成メディアとして結果を保存します。参照画像は、共有の
`music_generate image=...` パラメーターを通じて Lyria モデルで受け付けられます。

## テキスト読み上げ

OpenRouter は、OpenAI 互換の `/audio/speech`
エンドポイントを通じて TTS プロバイダーとしても使用できます。

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

`messages.tts.providers.openrouter.apiKey` が省略された場合、TTS は
`models.providers.openrouter.apiKey` を再利用し、次に `OPENROUTER_API_KEY` を使用します。

## 音声テキスト化 (受信音声)

OpenRouter は、その STT エンドポイント (`/audio/transcriptions`) を使用して、共有の
`tools.media.audio` パスを通じて受信ボイス/音声添付ファイルを文字起こしできます。
これは、受信ボイス/音声をメディア理解プリフライトに転送する任意のチャンネル Plugin に適用されます。

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

OpenClaw は、OpenRouter STT の契約に従って、base64 音声を
`input_audio` 配下に含む JSON として OpenRouter STT リクエストを送信します。multipart OpenAI フォームアップロードとしては送信しません。

## Fusion ルーター

1 つの OpenClaw モデル参照で複数の OpenRouter モデルに並列で問い合わせ、
OpenRouter に回答を判定させ、通常の OpenRouter プロバイダーエンドポイント経由で
単一の最終応答を返したい場合は、OpenRouter Fusion を使用します。
上流のモデルスラッグは `openrouter/fusion` であるため、OpenClaw モデル参照には
OpenClaw プロバイダープレフィックスと上流の OpenRouter 名前空間の両方が含まれます。

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion のパネルと判定モデルは、モデルの `params.extraBody` で設定します。これらの
フィールドは OpenRouter チャット補完リクエスト本文に転送されます。Fusion は
OpenRouter OAuth オンボーディングと API キーオンボーディングのどちらでも動作します。OAuth を使用する場合は、
下の例から `env.OPENROUTER_API_KEY` 行を省略してください。

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

`analysis_models` リストが並列パネルであり、Fusion Plugin 設定内の
`model` が判定モデルです。通常の OpenClaw エージェント/チャットターンで Fusion を
強制しようとして、トップレベルの `tool_choice` を `"required"` に設定しないでください。
OpenClaw ターンには OpenClaw ツール定義が含まれる場合があり、トップレベルの必須
ツール選択は Fusion ルーターではなく、それらのツールのいずれかを要求する可能性があります。
この Fusion Plugin 設定が存在する場合、OpenClaw は設定済みの分析モデルと判定モデルを含む、
サニタイズ済みのシステムプロンプト注記も追加します。これにより、エージェントは現在の Fusion パネルに関する質問に答えられます。
その他の `extraBody` フィールドはプロンプトにコピーされません。

Fusion は設計上遅くなります。OpenRouter は同じ OpenClaw プロンプトを
複数の分析モデルに送信し、その後で最終的な判定/統合ステップを実行する場合があるため、レイテンシーは
通常、単一モデルへの直接リクエストより高くなります。Fusion は、レイテンシーに敏感なチャットのデフォルトではなく、
慎重で高品質な回答やエスカレーションパスに使用してください。応答を速くするには、パネルを小さく保ち、
より高速な分析モデルと判定モデルを選択します。

設定済み参照を 1 回限りのローカルモデル呼び出しでテストします。

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 認証とヘッダー

OpenRouter は内部で API キーを Bearer トークンとして使用します。OpenRouter
OAuth は OpenRouter API キーを発行する PKCE ログインフローであるため、OpenClaw は
その結果を、手動 API キー設定パスで使用されるものと同じ `openrouter:default` API キー認証プロファイルとして保存します。

既存のインストールで、完全なオンボーディングを再実行せずにサインインするか、保存済みの OpenRouter キーをローテーションします。

```bash
openclaw models auth login --provider openrouter --method oauth
```

OpenRouter で手動作成したキーを貼り付けたい場合は、
`openclaw models auth login --provider openrouter --method api-key` を使用します。

実際の OpenRouter リクエスト (`https://openrouter.ai/api/v1`) では、OpenClaw は
OpenRouter が文書化しているアプリ属性ヘッダーも追加します。

| ヘッダー                  | 値                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter プロバイダーを別のプロキシまたはベース URL に向け直した場合、OpenClaw は
これらの OpenRouter 固有ヘッダーや Anthropic キャッシュマーカーを注入しません。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="応答キャッシュ">
    OpenRouter 応答キャッシュはオプトインです。OpenRouter モデルごとに
    モデルパラメーターで有効にします。

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
    `X-OpenRouter-Cache-TTL` も送信します。`responseCacheClear: true` は
    現在のリクエストに対して更新を強制し、置き換え後の応答を保存します。Snake_case エイリアス
    (`response_cache`、`response_cache_ttl_seconds`、および
    `response_cache_clear`) も受け付けられます。

    これはプロバイダープロンプトキャッシュや OpenRouter の
    Anthropic `cache_control` マーカーとは別のものです。カスタムプロキシベース URL ではなく、
    検証済みの `openrouter.ai` ルートにのみ適用されます。

  </Accordion>

  <Accordion title="Anthropic キャッシュマーカー">
    検証済みの OpenRouter ルートでは、Anthropic モデル参照は、OpenClaw が
    システム/開発者プロンプトブロックでプロンプトキャッシュの再利用を改善するために使用する
    OpenRouter 固有の Anthropic `cache_control` マーカーを保持します。
  </Accordion>

  <Accordion title="Anthropic 推論プリフィル">
    検証済みの OpenRouter ルートでは、推論が有効な Anthropic モデル参照は、
    リクエストが OpenRouter に到達する前に末尾のアシスタントプリフィルターンを削除し、
    推論会話はユーザーターンで終わる必要があるという Anthropic の要件に一致させます。
  </Accordion>

  <Accordion title="思考 / 推論インジェクション">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された思考レベルを
    OpenRouter プロキシ推論ペイロードにマッピングします。サポートされていないモデルヒントと
    `openrouter/auto` はその推論インジェクションをスキップします。Hunter Alpha も、
    古い設定済みモデル参照ではプロキシ推論をスキップします。その廃止済みルートでは、
    OpenRouter が推論フィールドで最終回答テキストを返す可能性があるためです。
  </Accordion>

  <Accordion title="DeepSeek V4 推論リプレイ">
    検証済みの OpenRouter ルートでは、`openrouter/deepseek/deepseek-v4-flash` と
    `openrouter/deepseek/deepseek-v4-pro` は、リプレイされたアシスタントターンで欠落している
    `reasoning_content` を補完し、思考/ツール会話が DeepSeek V4 の必須フォローアップ形状を保つようにします。
    OpenClaw はこれらのルートに対して OpenRouter がサポートする
    `reasoning_effort` 値を送信します。`xhigh` が公開されている最高レベルであり、
    古い `max` オーバーライドは `xhigh` にマッピングされます。
  </Accordion>

  <Accordion title="OpenAI 専用リクエスト整形">
    OpenRouter は引き続きプロキシ形式の OpenAI 互換パスを通るため、
    `serviceTier`、Responses `store`、OpenAI 推論互換ペイロード、
    プロンプトキャッシュヒントなどのネイティブな OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックエンドのルート">
    Gemini バックエンドの OpenRouter 参照はプロキシ Gemini パスに留まります。OpenClaw は
    そこで Gemini 思考シグネチャのサニタイズを維持しますが、ネイティブ Gemini
    リプレイ検証やブートストラップ書き換えは有効にしません。
  </Accordion>

  <Accordion title="プロバイダールーティングメタデータ">
    OpenRouter は、基盤プロバイダーのルーティング用に `provider` リクエストオブジェクトをサポートします。
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

    OpenClaw はそのオブジェクトをリクエスト `provider` ペイロードとして OpenRouter に転送します。
    OpenRouter が文書化している snake_case フィールドを使用してください。これには `sort`、
    `only`、`ignore`、`order`、`allow_fallbacks`、`require_parameters`、
    `data_collection`、`quantizations`、`max_price`、`preferred_max_latency`、
    `preferred_min_throughput`、`zdr`、`enforce_distillable_text` が含まれます。

    モデルごとの params は引き続きプロバイダー全体のルーティングオブジェクトをオーバーライドします。

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

    これは OpenRouter chat-completions ルートでのみ適用されます。直接の Anthropic、
    Google、OpenAI、またはカスタムプロバイダールートは OpenRouter ルーティング params を無視します。

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

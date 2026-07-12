---
read_when:
    - 多数のLLMに対して単一のAPIキーを使用したい場合
    - OpenClaw で OpenRouter 経由でモデルを実行する場合
    - 画像生成に OpenRouter を使用する場合
    - OpenRouterを音楽生成に使用したい場合
    - 動画生成に OpenRouter を使用する場合
summary: OpenRouter の統合 API を使用して、OpenClaw で多数のモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T14:47:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter は、1 つの API と 1 つのキーで多数のモデルにリクエストをルーティングします。
OpenAI 互換であるため、OpenClaw は他のプロキシプロバイダーで使用するものと同じ
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
        OpenRouter API キーと交換して、デフォルトの OpenRouter 認証プロファイルに保存します。
        リモートまたはヘッドレスホストでは、OpenClaw はサインイン URL を表示し、
        サインイン後にリダイレクト URL を貼り付けるよう求めます。
      </Step>
      <Step title="（任意）特定のモデルに切り替える">
        オンボーディングのデフォルトは `openrouter/auto` です。後で具体的なモデルを選択します。

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
      <Step title="（任意）特定のモデルに切り替える">
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

ライブカタログの検出を利用できない場合に使用される、同梱のフォールバックモデル：

| モデル参照                        | 備考                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter の自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6  |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI 経由の Kimi K2.5  |

[Fusion ルーター](#fusion-router)を参照する
`openrouter/openrouter/fusion` を含む、その他の `openrouter/<provider>/<model>`
参照は、OpenRouter のライブモデルカタログに対して動的に解決されます。

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
送信されますが、その他の画像モデルには送信されません。処理が遅いモデルには
`agents.defaults.imageGenerationModel.timeoutMs` を使用します。ただし、
`image_generate` ツールの呼び出しごとの `timeoutMs` が常に優先されます。

## 動画生成

OpenRouter は非同期の `/videos` API を介して、`video_generate` ツールの
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
`unsigned_urls` またはジョブコンテンツエンドポイントからダウンロードします。
参照画像はデフォルトで先頭／末尾フレーム画像として扱われます。`reference_image`
タグが付いた画像は、代わりに入力参照として送信されます。同梱のデフォルトモデル
`google/veo-3.1-fast` は、4/6/8 秒の再生時間、`720P`/`1080P` の解像度、
`16:9`/`9:16` のアスペクト比をサポートします。動画から動画への生成は
サポートされていません。アップストリーム API はテキストと画像の参照のみを
受け付けます。

## 音楽生成

OpenRouter は chat-completions の音声出力を介して、`music_generate` ツールの
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

同梱の OpenRouter 音楽プロバイダーはデフォルトで `google/lyria-3-pro-preview`
を使用し、`google/lyria-3-clip-preview` も公開します。OpenClaw は `modalities:
["text", "audio"]` を送信し、レスポンスをストリーミングして音声チャンクを収集し、
結果をチャンネル配信用の生成メディアとして保存します。Lyria モデルは、共通の
`music_generate image=...` パラメーターを介して 1 つの参照画像を受け付けます。
ストリーミング音声、トランスクリプトの保持、および生成される SSE イベント
エンベロープは、`agents.defaults.mediaMaxMb` によって制限されます
（デフォルトの音声上限は 16 MB）。

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

`messages.tts.providers.openrouter.apiKey` が省略されている場合、TTS は
`models.providers.openrouter.apiKey`、次に `OPENROUTER_API_KEY` へフォールバックします。

## 音声テキスト変換（受信音声）

OpenRouter は、STT エンドポイント（`/audio/transcriptions`）を使用し、共通の
`tools.media.audio` パスを通じて受信した音声・オーディオ添付ファイルを文字起こしできます。
これは、受信した音声・オーディオをメディア理解の事前処理へ転送するすべての
チャンネル Plugin に適用されます。

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

OpenClaw は OpenRouter の STT リクエストを、マルチパート形式の OpenAI フォームアップロードではなく、
`input_audio` に base64 音声を格納した JSON（OpenRouter の STT コントラクト）として送信します。

## Fusion ルーター

OpenRouter Fusion は、1 つの OpenClaw モデル参照を複数の OpenRouter モデルへ
並列に送信し、OpenRouter に回答を判定させ、通常の OpenRouter エンドポイントを通じて
1 つの最終回答を返します。アップストリームのモデルスラッグは
`openrouter/fusion` であるため、OpenClaw のモデル参照には OpenClaw の
プロバイダープレフィックスとアップストリームの OpenRouter 名前空間の両方が含まれます。

```bash
openclaw models set openrouter/openrouter/fusion
```

Fusion のパネルと判定モデルは、モデルの `params.extraBody` で設定します。
これらのフィールドは OpenRouter の chat-completions リクエスト本文へ直接転送されます。
Fusion は OAuth と API キーのどちらのオンボーディングでも動作します。OAuth を使用する場合は、
以下の `env.OPENROUTER_API_KEY` 行を省略してください。

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

`analysis_models` は並列パネルで、Fusion Plugin 設定内の `model` は判定モデルです。
Fusion を強制しようとして、通常のエージェント・チャットターンでトップレベルの
`tool_choice` を `"required"` に設定しないでください。OpenClaw のターンには独自の
ツール定義が含まれる場合があり、トップレベルでツール選択を必須にすると、Fusion ルーターではなく
それらのいずれかが選択される可能性があります。この Fusion Plugin 設定が存在する場合、
OpenClaw は、設定された分析モデルと判定モデルを列挙するサニタイズ済みのシステムプロンプト注記を追加します。
これにより、エージェントは自身の Fusion パネルに関する質問に回答できます。
その他の `extraBody` フィールドはプロンプトにコピーされません。

Fusion は設計上低速です。OpenRouter はプロンプトを複数の分析モデルへ送信した後、
判定・統合ステップを実行するため、直接の単一モデルリクエストよりもレイテンシーが高くなります。
レイテンシーが重要なデフォルトとしてではなく、慎重で高品質な回答やエスカレーション経路に使用してください。
応答を高速化するには、パネルを小さく保ち、より高速な分析モデルと判定モデルを選択します。

設定済みの参照を 1 回限りのローカル呼び出しでテストします。

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 認証とヘッダー

OpenRouter は API キーの Bearer トークンを使用します。OpenRouter OAuth は
OpenRouter API キーを発行する PKCE ログインフローであるため、OpenClaw はその結果を
手動の API キー設定で使用するものと同じ `openrouter:default` API キー認証プロファイルに保存します。

完全なオンボーディングを再実行せずに、既存のインストール環境でサインインするか、
保存済みキーをローテーションするには、次を実行します。

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

検証済みの OpenRouter リクエスト（`https://openrouter.ai/api/v1`）では、OpenClaw は
OpenRouter のドキュメントに記載されたアプリ帰属ヘッダーを追加します。

| ヘッダー                    | 値                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter プロバイダーの接続先を別のプロキシまたはベース URL に変更した場合、OpenClaw は
OpenRouter 固有のヘッダーや Anthropic キャッシュマーカーを注入**しません**。
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
    `X-OpenRouter-Cache-TTL` も送信します。`responseCacheClear: true` は現在のリクエストで
    強制的に更新し、置換後の応答を保存します。スネークケースのエイリアス
    （`response_cache`、`response_cache_ttl_seconds`、
    `response_cache_clear`）に加えて、`Seconds` サフィックスのない
    `responseCacheTtl` / `response_cache_ttl` も使用できます。

    これは、プロバイダーのプロンプトキャッシュおよび OpenRouter の Anthropic
    `cache_control` マーカーとは別のものです。カスタムプロキシのベース URL ではなく、
    検証済みの `openrouter.ai` ルートにのみ適用されます。

  </Accordion>

  <Accordion title="Anthropic キャッシュマーカー">
    検証済みの OpenRouter ルートでは、Anthropic モデル参照は、システム・開発者プロンプトブロックで
    プロンプトキャッシュをより効果的に再利用できるよう、OpenRouter の Anthropic
    `cache_control` マーカーを維持します。
  </Accordion>

  <Accordion title="Anthropic reasoning プレフィル">
    検証済みの OpenRouter ルートでは、reasoning が有効な Anthropic モデル参照について、
    リクエストが OpenRouter に到達する前に末尾の assistant プレフィルターンを
    削除し、reasoning 会話を user ターンで終了する必要があるという
    Anthropic の要件に適合させます。
  </Accordion>

  <Accordion title="thinking / reasoning の挿入">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された thinking レベルを
    OpenRouter プロキシの reasoning ペイロードにマッピングします。`openrouter/auto` と
    サポートされていないモデルヒントでは、この挿入をスキップします。古い
    `openrouter/hunter-alpha` 参照でもスキップします。これは、その廃止済みルートで
    OpenRouter が reasoning フィールドに最終回答テキストを返す可能性があるためです。
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning の再生">
    検証済みの OpenRouter ルートでは、`openrouter/deepseek/deepseek-v4-flash` と
    `openrouter/deepseek/deepseek-v4-pro` は、再生された assistant ターンで欠落している
    `reasoning_content` を補完し、thinking/ツール会話を DeepSeek V4 が要求する
    後続形式に維持します。OpenClaw は、これらのルートに OpenRouter がサポートする
    `reasoning.effort` 値を送信します。`xhigh`/`max` は `xhigh` にマッピングされ、
    オフ以外のその他すべてのレベルは `high` にマッピングされます。
  </Accordion>

  <Accordion title="OpenAI 専用のリクエスト整形">
    OpenRouter はプロキシ形式の OpenAI 互換パスを経由するため、`serviceTier`、
    Responses の `store`、OpenAI の reasoning 互換ペイロード、プロンプトキャッシュの
    ヒントなど、ネイティブ OpenAI 専用のリクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックエンドのルート">
    Gemini バックエンドの OpenRouter 参照はプロキシ Gemini パスに留まります。OpenClaw は
    そこで Gemini の思考署名のサニタイズを維持しますが、ネイティブ Gemini の
    再生検証やブートストラップ書き換えは有効にしません。
  </Accordion>

  <Accordion title="プロバイダーのルーティングメタデータ">
    OpenRouter は、基盤プロバイダーのルーティング用に `provider` リクエストオブジェクトを
    サポートしています。すべての OpenRouter テキストモデルリクエストに対する
    デフォルトポリシーを `models.providers.openrouter.params.provider` で設定します。

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

    OpenClaw はそのオブジェクトをリクエストの `provider` ペイロードとして OpenRouter に
    転送します。`sort`、`only`、`ignore`、`order`、`allow_fallbacks`、
    `require_parameters`、`data_collection`、`quantizations`、`max_price`、
    `preferred_max_latency`、`preferred_min_throughput`、`zdr`、
    `enforce_distillable_text` など、OpenRouter のドキュメントに記載された
    snake_case フィールドを使用してください。

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

    これは OpenRouter の chat-completions ルートにのみ適用されます。Anthropic、
    Google、OpenAI、またはカスタムプロバイダーの直接ルートでは、OpenRouter の
    ルーティング params は無視されます。

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

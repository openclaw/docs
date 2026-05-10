---
read_when:
    - 多くのLLMに対応する単一のAPIキーが必要な場合
    - OpenClawでOpenRouter経由でモデルを実行したい
    - 画像生成にOpenRouterを使用したい場合
    - 動画生成に OpenRouter を使用したい場合
summary: OpenRouter の統一 API を使用して、OpenClaw で多数のモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter は、単一のエンドポイントと API キーの背後で多数のモデルへリクエストをルーティングする **統合 API** を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えることで動作します。

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [openrouter.ai/keys](https://openrouter.ai/keys) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(任意) 特定のモデルに切り替える">
    オンボーディングではデフォルトで `openrouter/auto` が使用されます。具体的なモデルは後から選択できます。

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

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
モデル参照は `openrouter/<provider>/<model>` のパターンに従います。利用可能なプロバイダーとモデルの完全な一覧については、[/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

同梱のフォールバック例:

| モデル参照                      | 注記                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter の自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6  |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI 経由の Kimi K2.5  |

## 画像生成

OpenRouter は `image_generate` ツールのバックエンドとしても使用できます。`agents.defaults.imageGenerationModel` 配下で OpenRouter の画像モデルを使用します。

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

OpenClaw は `modalities: ["image", "text"]` を指定して、画像リクエストを OpenRouter のチャット補完画像 API に送信します。Gemini 画像モデルは、サポートされている `aspectRatio` と `resolution` のヒントを OpenRouter の `image_config` 経由で受け取ります。遅い OpenRouter 画像モデルには `agents.defaults.imageGenerationModel.timeoutMs` を使用します。`image_generate` ツールの呼び出しごとの `timeoutMs` パラメーターは引き続き優先されます。

## 動画生成

OpenRouter は非同期の `/videos` API を通じて `video_generate` ツールのバックエンドとしても使用できます。`agents.defaults.videoGenerationModel` 配下で OpenRouter の動画モデルを使用します。

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

OpenClaw はテキストから動画、および画像から動画のジョブを OpenRouter に送信し、返された `polling_url` をポーリングして、完了した動画を OpenRouter の `unsigned_urls` または文書化されたジョブコンテンツエンドポイントからダウンロードします。参照画像はデフォルトで先頭/末尾フレーム画像として送信されます。`reference_image` でタグ付けされた画像は、OpenRouter の入力参照として送信されます。同梱の `google/veo-3.1-fast` デフォルトは、現在サポートされている 4/6/8 秒の長さ、`720P`/`1080P` の解像度、`16:9`/`9:16` のアスペクト比を通知します。上流の動画生成 API は現在テキストと画像参照を受け付けるため、OpenRouter では動画から動画は登録されていません。

## テキスト読み上げ

OpenRouter は OpenAI 互換の `/audio/speech` エンドポイントを通じて、TTS プロバイダーとしても使用できます。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

`messages.tts.providers.openrouter.apiKey` が省略された場合、TTS は `models.providers.openrouter.apiKey`、続いて `OPENROUTER_API_KEY` を再利用します。

## 認証とヘッダー

OpenRouter は内部的に、API キーを含む Bearer トークンを使用します。

実際の OpenRouter リクエスト (`https://openrouter.ai/api/v1`) では、OpenClaw は OpenRouter の文書化されたアプリ帰属ヘッダーも追加します。

| ヘッダー                  | 値                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter プロバイダーを別のプロキシまたはベース URL に向け直した場合、OpenClaw はそれらの OpenRouter 固有ヘッダーや Anthropic キャッシュマーカーを注入しません。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="レスポンスキャッシュ">
    OpenRouter のレスポンスキャッシュはオプトインです。OpenRouter モデルごとにモデルパラメーターで有効にします。

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

    OpenClaw は `X-OpenRouter-Cache: true` を送信し、設定されている場合は `X-OpenRouter-Cache-TTL` も送信します。`responseCacheClear: true` は現在のリクエストを強制的に更新し、置換レスポンスを保存します。Snake_case のエイリアス (`response_cache`、`response_cache_ttl_seconds`、および `response_cache_clear`) も受け付けます。

    これはプロバイダーのプロンプトキャッシュ、および OpenRouter の Anthropic `cache_control` マーカーとは別のものです。カスタムプロキシのベース URL ではなく、検証済みの `openrouter.ai` ルートでのみ適用されます。

  </Accordion>

  <Accordion title="Anthropic キャッシュマーカー">
    検証済みの OpenRouter ルートでは、Anthropic モデル参照は、OpenClaw がシステム/開発者プロンプトブロックでプロンプトキャッシュの再利用を改善するために使用する OpenRouter 固有の Anthropic `cache_control` マーカーを保持します。
  </Accordion>

  <Accordion title="Anthropic 推論プリフィル">
    検証済みの OpenRouter ルートでは、推論が有効な Anthropic モデル参照は、リクエストが OpenRouter に到達する前に末尾の assistant プリフィルターンを削除します。これは、推論会話は user ターンで終わる必要があるという Anthropic の要件に合わせるためです。
  </Accordion>

  <Accordion title="思考 / 推論の注入">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された思考レベルを OpenRouter プロキシ推論ペイロードにマッピングします。サポートされていないモデルヒントと `openrouter/auto` では、その推論注入はスキップされます。Hunter Alpha も、古い設定済みモデル参照についてはプロキシ推論をスキップします。これは、OpenRouter がその廃止済みルートで推論フィールドに最終回答テキストを返す可能性があるためです。
  </Accordion>

  <Accordion title="DeepSeek V4 推論リプレイ">
    検証済みの OpenRouter ルートでは、`openrouter/deepseek/deepseek-v4-flash` と `openrouter/deepseek/deepseek-v4-pro` は、リプレイされた assistant ターンで欠落している `reasoning_content` を埋め、思考/ツール会話が DeepSeek V4 の必須の後続形状を維持できるようにします。OpenClaw はこれらのルートに対して OpenRouter がサポートする `reasoning_effort` 値を送信します。`xhigh` は通知されている最高レベルであり、古い `max` オーバーライドは `xhigh` にマッピングされます。
  </Accordion>

  <Accordion title="OpenAI 専用のリクエスト整形">
    OpenRouter は引き続きプロキシ形式の OpenAI 互換パスを通るため、`serviceTier`、Responses の `store`、OpenAI 推論互換ペイロード、プロンプトキャッシュヒントなど、ネイティブの OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックエンドのルート">
    Gemini バックエンドの OpenRouter 参照は proxy-Gemini パスに留まります。OpenClaw はそこで Gemini thought-signature のサニタイズを維持しますが、ネイティブの Gemini リプレイ検証やブートストラップ書き換えは有効にしません。
  </Accordion>

  <Accordion title="プロバイダールーティングメタデータ">
    モデルパラメーター配下で OpenRouter プロバイダールーティングを渡すと、OpenClaw は共有ストリームラッパーが実行される前に、それを OpenRouter ルーティングメタデータとして転送します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    agents、models、providers の完全な設定リファレンス。
  </Card>
</CardGroup>

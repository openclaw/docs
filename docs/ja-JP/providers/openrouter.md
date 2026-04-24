---
read_when:
    - 多数のLLMに対して1つのAPI keyを使いたい場合
    - OpenClawでOpenRouter経由のモデルを実行したい場合
    - 画像生成にOpenRouterを使いたい場合
summary: OpenClawで多数のモデルへアクセスするためにOpenRouterの統一APIを使う
title: OpenRouter
x-i18n:
    generated_at: "2026-04-24T05:16:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7516910f67a8adfb107d07cadd73c34ddd110422ecb90278025d4d6344937aac
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouterは、単一の
エンドポイントとAPI keyの背後で、多数のモデルへリクエストをルーティングする**統一API**を提供します。これはOpenAI互換なので、base URLを切り替えるだけで多くのOpenAI SDKが動作します。

## はじめに

<Steps>
  <Step title="API keyを取得する">
    [openrouter.ai/keys](https://openrouter.ai/keys)でAPI keyを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（任意）特定モデルへ切り替える">
    オンボーディングのデフォルトは`openrouter/auto`です。後から具体的なモデルを選べます。

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
モデル参照は`openrouter/<provider>/<model>`形式に従います。利用可能な
プロバイダーとモデルの完全一覧は[/concepts/model-providers](/ja-JP/concepts/model-providers)を参照してください。
</Note>

バンドルされたフォールバック例:

| モデル参照 | 注記 |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | OpenRouter自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI経由のKimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alphaルート |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alphaルート |

## 画像生成

OpenRouterは`image_generate`ツールのバックエンドとしても利用できます。`agents.defaults.imageGenerationModel`の下にOpenRouter画像モデルを使ってください。

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClawは画像リクエストを、`modalities: ["image", "text"]`付きのOpenRouter chat completions画像APIへ送信します。Gemini画像モデルは、OpenRouterの`image_config`経由で、サポートされる`aspectRatio`および`resolution`ヒントを受け取ります。

## 認証とヘッダー

OpenRouterは内部的に、API key付きのBearer tokenを使用します。

実際のOpenRouterリクエスト（`https://openrouter.ai/api/v1`）では、OpenClawは
OpenRouterが文書化しているアプリ帰属ヘッダーも追加します。

| ヘッダー | 値 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouterプロバイダーを他のプロキシやbase URLへ向け直した場合、OpenClawは
それらのOpenRouter固有ヘッダーやAnthropic cache markerを**注入しません**。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="Anthropic cache marker">
    検証済みのOpenRouterルートでは、Anthropicモデル参照は、
    システム/開発者プロンプトブロックでのprompt-cache再利用を改善するために、OpenClawが使用する
    OpenRouter固有のAnthropic `cache_control` markerを維持します。
  </Accordion>

  <Accordion title="Thinking / reasoning注入">
    サポートされる非`auto`ルートでは、OpenClawは選択されたthinkingレベルを
    OpenRouterプロキシのreasoningペイロードへマッピングします。未対応モデルヒントと
    `openrouter/auto`では、そのreasoning注入はスキップされます。
  </Accordion>

  <Accordion title="OpenAI専用リクエスト整形">
    OpenRouterは引き続きプロキシ型OpenAI互換パスを通るため、
    `serviceTier`、Responsesの`store`、
    OpenAI reasoning互換ペイロード、prompt-cacheヒントのようなネイティブOpenAI専用
    リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Geminiバックルート">
    GeminiバックのOpenRouter参照はプロキシGeminiパス上に留まります。OpenClawは
    そこではGemini thought-signatureサニタイズを維持しますが、ネイティブGeminiの
    replay validationやbootstrap書き換えは有効化しません。
  </Accordion>

  <Accordion title="プロバイダールーティングメタデータ">
    モデルパラメーターの下でOpenRouterプロバイダールーティングを渡した場合、OpenClawは
    共有ストリームラッパーが動く前に、それをOpenRouterルーティングメタデータとして転送します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、およびフェイルオーバー動作の選び方。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、およびプロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>

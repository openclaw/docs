---
read_when:
    - 多くの LLM に対して 1 つの API キーを使いたい場合
    - OpenClaw で OpenRouter 経由でモデルを実行したい場合
    - 画像生成に OpenRouter を使いたい場合
summary: OpenClaw で OpenRouter の統一 API を使って多数のモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T18:20:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter は、単一の
エンドポイントと API キーの背後で多数のモデルにリクエストをルーティングする **統一 API** を提供します。OpenAI 互換なので、base URL を切り替えるだけでほとんどの OpenAI SDK が動作します。

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
  <Step title="（任意）特定のモデルに切り替える">
    オンボーディングのデフォルトは `openrouter/auto` です。後で具体的なモデルを選べます:

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
モデル参照は `openrouter/<provider>/<model>` のパターンに従います。利用可能な
provider と model の完全な一覧は、[/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

同梱 fallback の例:

| Model ref | 注記 |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto` | OpenRouter 自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6 |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha ルート |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha ルート |

## 画像生成

OpenRouter は `image_generate` ツールのバックエンドとしても使えます。`agents.defaults.imageGenerationModel` には OpenRouter の画像モデルを使ってください:

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

OpenClaw は画像リクエストを `modalities: ["image", "text"]` を付けて OpenRouter の chat completions image API に送信します。Gemini 画像モデルは、OpenRouter の `image_config` を通じてサポートされる `aspectRatio` と `resolution` ヒントを受け取ります。低速な OpenRouter 画像モデルには `agents.defaults.imageGenerationModel.timeoutMs` を使ってください。`image_generate` ツールの呼び出し単位 `timeoutMs` パラメータの方が引き続き優先されます。

## TTS

OpenRouter は、OpenAI 互換の
`/audio/speech` エンドポイントを通じて TTS プロバイダーとしても使えます。

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

`messages.tts.providers.openrouter.apiKey` を省略した場合、TTS は
`models.providers.openrouter.apiKey`、その後 `OPENROUTER_API_KEY` を再利用します。

## 認証とヘッダー

OpenRouter は内部的に API キーを Bearer トークンとして使います。

実際の OpenRouter リクエスト（`https://openrouter.ai/api/v1`）では、OpenClaw は
OpenRouter が文書化している app-attribution ヘッダーも追加します:

| Header | 値 |
| ------------------------- | --------------------- |
| `HTTP-Referer` | `https://openclaw.ai` |
| `X-OpenRouter-Title` | `OpenClaw` |
| `X-OpenRouter-Categories` | `cli-agent` |

<Warning>
OpenRouter プロバイダーを別のプロキシや base URL に向け直した場合、OpenClaw は
それらの OpenRouter 固有ヘッダーや Anthropic cache marker を **注入しません**。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="Anthropic cache marker">
    検証済みの OpenRouter ルートでは、Anthropic model ref は、
    システム/開発者プロンプトブロックでより良いプロンプトキャッシュ再利用のために OpenClaw が使う、
    OpenRouter 固有の Anthropic `cache_control` marker を保持します。
  </Accordion>

  <Accordion title="Thinking / reasoning の注入">
    サポートされる非 `auto` ルートでは、OpenClaw は選択された thinking レベルを
    OpenRouter プロキシの reasoning ペイロードにマッピングします。未対応の model ヒントと
    `openrouter/auto` では、その reasoning 注入をスキップします。
  </Accordion>

  <Accordion title="OpenAI 専用リクエスト整形">
    OpenRouter は引き続きプロキシ形式の OpenAI 互換パスを通るため、
    `serviceTier`、Responses の `store`、
    OpenAI reasoning 互換ペイロード、プロンプトキャッシュヒントなどのネイティブ OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックエンドのルート">
    Gemini バックエンドの OpenRouter ref はプロキシ Gemini パスにとどまります。OpenClaw は
    そこで Gemini の thought-signature サニタイズを維持しますが、ネイティブ Gemini の
    リプレイ検証や bootstrap 書き換えは有効にしません。
  </Accordion>

  <Accordion title="プロバイダールーティングメタデータ">
    model params の下で OpenRouter のプロバイダールーティングを渡すと、OpenClaw は
    共有ストリームラッパーの実行前に、それを OpenRouter のルーティングメタデータとして転送します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover の動作を選択します。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    agents、models、providers の完全な設定リファレンスです。
  </Card>
</CardGroup>

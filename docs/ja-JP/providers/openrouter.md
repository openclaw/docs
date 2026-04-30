---
read_when:
    - 多くのLLMに対して単一のAPIキーを使いたい
    - OpenClaw で OpenRouter 経由でモデルを実行したい
    - 画像生成にOpenRouterを使用したい場合
    - OpenRouter を使って動画生成を行いたい
summary: OpenRouter の統合 API を使用して、OpenClaw で多くのモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T05:31:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter は、単一のエンドポイントと API キーの背後で多数のモデルへリクエストをルーティングする **統合 API** を提供します。OpenAI 互換なので、ほとんどの OpenAI SDK はベース URL を切り替えることで動作します。

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
    オンボーディングのデフォルトは `openrouter/auto` です。後で具体的なモデルを選択します。

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
モデル参照は `openrouter/<provider>/<model>` のパターンに従います。利用可能なプロバイダーとモデルの完全な一覧は、[/concepts/model-providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

バンドルされたフォールバック例:

| モデル参照                        | 備考                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter の自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6  |

## 画像生成

OpenRouter は `image_generate` ツールのバックエンドにもできます。`agents.defaults.imageGenerationModel` の下で OpenRouter 画像モデルを使用します。

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

OpenClaw は `modalities: ["image", "text"]` を指定して、OpenRouter のチャット補完画像 API に画像リクエストを送信します。Gemini 画像モデルは、サポートされている `aspectRatio` と `resolution` のヒントを OpenRouter の `image_config` 経由で受け取ります。遅い OpenRouter 画像モデルには `agents.defaults.imageGenerationModel.timeoutMs` を使用します。ただし、`image_generate` ツールの呼び出しごとの `timeoutMs` パラメーターが引き続き優先されます。

## 動画生成

OpenRouter は、非同期 `/videos` API 経由で `video_generate` ツールのバックエンドにもできます。`agents.defaults.videoGenerationModel` の下で OpenRouter 動画モデルを使用します。

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

OpenClaw はテキストから動画、および画像から動画のジョブを OpenRouter に送信し、返された `polling_url` をポーリングして、完了した動画を OpenRouter の `unsigned_urls` または文書化されたジョブコンテンツエンドポイントからダウンロードします。参照画像はデフォルトで最初/最後のフレーム画像として送信されます。`reference_image` でタグ付けされた画像は、OpenRouter の入力参照として送信されます。バンドルされたデフォルトの `google/veo-3.1-fast` は、現在サポートされている 4/6/8 秒の長さ、`720P`/`1080P` の解像度、`16:9`/`9:16` のアスペクト比を提示します。上流の動画生成 API は現在テキストと画像参照を受け付けるため、動画から動画は OpenRouter には登録されていません。

## テキスト読み上げ

OpenRouter は、OpenAI 互換の `/audio/speech` エンドポイント経由で TTS プロバイダーとしても使用できます。

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

`messages.tts.providers.openrouter.apiKey` が省略された場合、TTS は `models.providers.openrouter.apiKey` を再利用し、その後 `OPENROUTER_API_KEY` を使用します。

## 認証とヘッダー

OpenRouter は内部的に、API キーを使用した Bearer トークンを使います。

実際の OpenRouter リクエスト (`https://openrouter.ai/api/v1`) では、OpenClaw は OpenRouter の文書化されたアプリ帰属ヘッダーも追加します。

| ヘッダー                  | 値                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter プロバイダーを別のプロキシまたはベース URL に向け直す場合、OpenClaw はそれらの OpenRouter 固有ヘッダーや Anthropic キャッシュマーカーを注入しません。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="Anthropic キャッシュマーカー">
    検証済みの OpenRouter ルートでは、Anthropic モデル参照は、OpenClaw がシステム/開発者プロンプトブロックでより適切にプロンプトキャッシュを再利用するために使う OpenRouter 固有の Anthropic `cache_control` マーカーを保持します。
  </Accordion>

  <Accordion title="思考 / 推論の注入">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された思考レベルを OpenRouter プロキシ推論ペイロードにマッピングします。サポートされていないモデルヒントと `openrouter/auto` では、その推論注入をスキップします。Hunter Alpha も、古い設定済みモデル参照ではプロキシ推論をスキップします。これは、その廃止済みルートで OpenRouter が推論フィールドに最終回答テキストを返す可能性があるためです。
  </Accordion>

  <Accordion title="OpenAI 専用リクエスト整形">
    OpenRouter は引き続きプロキシ形式の OpenAI 互換パスを通るため、`serviceTier`、Responses `store`、OpenAI 推論互換ペイロード、プロンプトキャッシュヒントなどのネイティブ OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックエンドのルート">
    Gemini バックエンドの OpenRouter 参照は、プロキシ Gemini パス上に留まります。OpenClaw はそこで Gemini 思考シグネチャのサニタイズを維持しますが、ネイティブ Gemini のリプレイ検証やブートストラップ書き換えは有効にしません。
  </Accordion>

  <Accordion title="プロバイダールーティングメタデータ">
    モデルパラメーターの下で OpenRouter プロバイダールーティングを渡すと、OpenClaw は共有ストリームラッパーが実行される前に、それを OpenRouter ルーティングメタデータとして転送します。
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

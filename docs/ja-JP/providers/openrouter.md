---
read_when:
    - 多くのLLMで単一のAPIキーを使いたい場合
    - OpenClaw で OpenRouter 経由でモデルを実行したい
    - 画像生成に OpenRouter を使用したい場合
    - 動画生成にOpenRouterを使用したい場合
summary: OpenRouter の統合 API を使って OpenClaw で多くのモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T21:04:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter は、単一のエンドポイントと API キーの背後で多くのモデルへリクエストをルーティングする **統合 API** を提供します。OpenAI 互換なので、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

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
    オンボーディングでは既定で `openrouter/auto` が使われます。後で具体的なモデルを選択します。

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

同梱フォールバックの例:

| モデル参照                         | 備考                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter の自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6     |

## 画像生成

OpenRouter は `image_generate` ツールのバックエンドとしても使用できます。`agents.defaults.imageGenerationModel` の下で OpenRouter 画像モデルを使用します。

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

OpenClaw は、`modalities: ["image", "text"]` を指定して画像リクエストを OpenRouter のチャット補完画像 API に送信します。Gemini 画像モデルは、サポートされている `aspectRatio` と `resolution` のヒントを OpenRouter の `image_config` 経由で受け取ります。遅い OpenRouter 画像モデルには `agents.defaults.imageGenerationModel.timeoutMs` を使用します。`image_generate` ツールの呼び出しごとの `timeoutMs` パラメーターが引き続き優先されます。

## 動画生成

OpenRouter は、非同期 `/videos` API 経由で `video_generate` ツールのバックエンドとしても使用できます。`agents.defaults.videoGenerationModel` の下で OpenRouter 動画モデルを使用します。

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

OpenClaw はテキストから動画、および画像から動画のジョブを OpenRouter に送信し、返された `polling_url` をポーリングして、完了した動画を OpenRouter の `unsigned_urls` またはドキュメント化されたジョブコンテンツエンドポイントからダウンロードします。参照画像は既定で最初/最後のフレーム画像として送信されます。`reference_image` タグ付きの画像は OpenRouter 入力参照として送信されます。同梱の `google/veo-3.1-fast` 既定値は、現在サポートされている 4/6/8 秒の長さ、`720P`/`1080P` 解像度、および `16:9`/`9:16` アスペクト比を告知します。上流の動画生成 API は現在テキストと画像参照を受け付けるため、動画から動画は OpenRouter に登録されていません。

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

`messages.tts.providers.openrouter.apiKey` が省略された場合、TTS は `models.providers.openrouter.apiKey`、続いて `OPENROUTER_API_KEY` を再利用します。

## 認証とヘッダー

OpenRouter は内部的に API キーを使用した Bearer トークンを使用します。

実際の OpenRouter リクエスト (`https://openrouter.ai/api/v1`) では、OpenClaw は OpenRouter のドキュメント化されたアプリ帰属ヘッダーも追加します。

| ヘッダー                    | 値                 |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter プロバイダーを別のプロキシまたはベース URL に向け直した場合、OpenClaw はこれらの OpenRouter 固有ヘッダーや Anthropic キャッシュマーカーを注入しません。
</Warning>

## 詳細設定

<AccordionGroup>
  <Accordion title="Anthropic キャッシュマーカー">
    検証済みの OpenRouter ルートでは、Anthropic モデル参照は、OpenClaw がシステム/開発者プロンプトブロックでプロンプトキャッシュをより再利用しやすくするために使用する、OpenRouter 固有の Anthropic `cache_control` マーカーを維持します。
  </Accordion>

  <Accordion title="Anthropic reasoning プリフィル">
    検証済みの OpenRouter ルートでは、reasoning が有効な Anthropic モデル参照は、リクエストが OpenRouter に到達する前に末尾の assistant プリフィルターンを削除し、reasoning 会話は user ターンで終わる必要があるという Anthropic の要件に合わせます。
  </Accordion>

  <Accordion title="Thinking / reasoning 注入">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された thinking レベルを OpenRouter プロキシ reasoning ペイロードにマッピングします。サポートされていないモデルヒントと `openrouter/auto` は、その reasoning 注入をスキップします。Hunter Alpha も、古い設定済みモデル参照についてはプロキシ reasoning をスキップします。これは OpenRouter がその廃止済みルートで reasoning フィールドに最終回答テキストを返す可能性があるためです。
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning リプレイ">
    検証済みの OpenRouter ルートでは、`openrouter/deepseek/deepseek-v4-flash` と `openrouter/deepseek/deepseek-v4-pro` は、リプレイされた assistant ターンで不足している `reasoning_content` を埋め、thinking/ツール会話が DeepSeek V4 に必要なフォローアップ形式を維持できるようにします。
  </Accordion>

  <Accordion title="OpenAI 専用リクエスト整形">
    OpenRouter は引き続きプロキシ形式の OpenAI 互換パスを通るため、`serviceTier`、Responses `store`、OpenAI reasoning 互換ペイロード、プロンプトキャッシュヒントなどのネイティブ OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックエンドのルート">
    Gemini バックエンドの OpenRouter 参照はプロキシ Gemini パスに残ります。OpenClaw はそこで Gemini thought-signature サニタイズを維持しますが、ネイティブ Gemini リプレイ検証やブートストラップ書き換えは有効にしません。
  </Accordion>

  <Accordion title="プロバイダールーティングメタデータ">
    モデルパラメーターの下で OpenRouter プロバイダールーティングを渡すと、OpenClaw は共有ストリームラッパーが実行される前に、それを OpenRouter ルーティングメタデータとして転送します。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンスです。
  </Card>
</CardGroup>

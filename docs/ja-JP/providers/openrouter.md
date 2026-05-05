---
read_when:
    - 多くのLLMに対して単一のAPIキーを使いたい
    - OpenClaw で OpenRouter 経由でモデルを実行したい場合
    - 画像生成にOpenRouterを使用したい場合
    - 動画生成に OpenRouter を使用したい場合
summary: OpenRouter の統合 API を使用して OpenClaw で多数のモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
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
  <Step title="（任意）特定のモデルに切り替える">
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

同梱のフォールバック例:

| モデル参照                        | 注記                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter の自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6  |

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

OpenClaw は `modalities: ["image", "text"]` を指定して、画像リクエストを OpenRouter の chat completions image API に送信します。Gemini 画像モデルは、サポートされる `aspectRatio` と `resolution` のヒントを OpenRouter の `image_config` 経由で受け取ります。遅い OpenRouter 画像モデルには `agents.defaults.imageGenerationModel.timeoutMs` を使用します。ただし、`image_generate` ツールの呼び出しごとの `timeoutMs` パラメーターが引き続き優先されます。

## 動画生成

OpenRouter は非同期 `/videos` API を通じて `video_generate` ツールのバックエンドとしても使用できます。`agents.defaults.videoGenerationModel` の下で OpenRouter 動画モデルを使用します。

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

OpenClaw はテキストから動画、および画像から動画のジョブを OpenRouter に送信し、返された `polling_url` をポーリングして、完了した動画を OpenRouter の `unsigned_urls` またはドキュメント化されたジョブコンテンツエンドポイントからダウンロードします。参照画像はデフォルトで先頭/末尾フレーム画像として送信されます。`reference_image` タグ付きの画像は OpenRouter の入力参照として送信されます。同梱のデフォルト `google/veo-3.1-fast` は、現在サポートされている 4/6/8 秒の長さ、`720P`/`1080P` 解像度、`16:9`/`9:16` アスペクト比を通知します。アップストリームの動画生成 API は現在、テキストと画像参照を受け付けるため、動画から動画は OpenRouter には登録されていません。

## テキスト読み上げ

OpenRouter は、OpenAI 互換の `/audio/speech` エンドポイントを通じて TTS プロバイダーとしても使用できます。

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

OpenRouter は内部的に、API キーを使用した Bearer トークンを使用します。

実際の OpenRouter リクエスト（`https://openrouter.ai/api/v1`）では、OpenClaw は OpenRouter のドキュメント化されたアプリ帰属ヘッダーも追加します。

| ヘッダー                  | 値                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter プロバイダーを別のプロキシまたはベース URL に向け直した場合、OpenClaw はそれらの OpenRouter 固有ヘッダーや Anthropic キャッシュマーカーを注入**しません**。
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

    OpenClaw は `X-OpenRouter-Cache: true` を送信し、設定されている場合は `X-OpenRouter-Cache-TTL` も送信します。`responseCacheClear: true` は現在のリクエストの更新を強制し、置換後のレスポンスを保存します。Snake_case エイリアス（`response_cache`、`response_cache_ttl_seconds`、`response_cache_clear`）も受け付けます。

    これは、プロバイダーのプロンプトキャッシュおよび OpenRouter の Anthropic `cache_control` マーカーとは別です。カスタムプロキシのベース URL ではなく、検証済みの `openrouter.ai` ルートにのみ適用されます。

  </Accordion>

  <Accordion title="Anthropic キャッシュマーカー">
    検証済みの OpenRouter ルートでは、Anthropic モデル参照は、システム/開発者プロンプトブロックでプロンプトキャッシュをよりよく再利用するために OpenClaw が使用する OpenRouter 固有の Anthropic `cache_control` マーカーを保持します。
  </Accordion>

  <Accordion title="Anthropic reasoning プリフィル">
    検証済みの OpenRouter ルートでは、reasoning が有効な Anthropic モデル参照は、リクエストが OpenRouter に到達する前に末尾の assistant プリフィルターンを削除します。これは、reasoning 会話が user ターンで終わる必要があるという Anthropic の要件に合わせるためです。
  </Accordion>

  <Accordion title="Thinking / reasoning 注入">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された thinking レベルを OpenRouter プロキシ reasoning ペイロードにマッピングします。サポートされていないモデルヒントと `openrouter/auto` はその reasoning 注入をスキップします。Hunter Alpha も、古い設定済みモデル参照ではプロキシ reasoning をスキップします。OpenRouter がその廃止済みルートの reasoning フィールドで最終回答テキストを返す可能性があるためです。
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning リプレイ">
    検証済みの OpenRouter ルートでは、`openrouter/deepseek/deepseek-v4-flash` と `openrouter/deepseek/deepseek-v4-pro` は、リプレイされた assistant ターンで不足している `reasoning_content` を補完し、thinking/tool 会話が DeepSeek V4 の必須の後続形状を維持できるようにします。OpenClaw はこれらのルートに対して OpenRouter がサポートする `reasoning_effort` 値を送信します。`xhigh` は通知されている最高レベルであり、古い `max` オーバーライドは `xhigh` にマッピングされます。
  </Accordion>

  <Accordion title="OpenAI 専用リクエスト整形">
    OpenRouter は引き続きプロキシ形式の OpenAI 互換パスを通るため、`serviceTier`、Responses `store`、OpenAI reasoning 互換ペイロード、プロンプトキャッシュヒントなどのネイティブ OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックエンドのルート">
    Gemini バックエンドの OpenRouter 参照はプロキシ Gemini パスにとどまります。OpenClaw はそこで Gemini thought-signature サニタイズを維持しますが、ネイティブ Gemini リプレイ検証やブートストラップ書き換えは有効にしません。
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

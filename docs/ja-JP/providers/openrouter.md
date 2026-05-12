---
read_when:
    - 多くの LLM に対して単一の API キーを使いたい
    - OpenClaw で OpenRouter 経由でモデルを実行したい
    - 画像生成に OpenRouter を使いたい場合
    - 動画生成に OpenRouter を使用したい
summary: OpenClaw で OpenRouter の統合 API を使用して多数のモデルにアクセスする
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter は、単一のエンドポイントと API キーの背後で多数のモデルへリクエストをルーティングする **統合 API** を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

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
    オンボーディングのデフォルトは `openrouter/auto` です。あとで具体的なモデルを選択できます。

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

バンドル済みフォールバックの例:

| モデル参照                       | メモ                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter の自動ルーティング |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI 経由の Kimi K2.6  |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI 経由の Kimi K2.5  |

## 画像生成

OpenRouter は `image_generate` ツールのバックエンドにもできます。`agents.defaults.imageGenerationModel` で OpenRouter の画像モデルを使用します。

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

OpenClaw は、`modalities: ["image", "text"]` を指定して、OpenRouter のチャット補完画像 API に画像リクエストを送信します。Gemini 画像モデルは、サポートされる `aspectRatio` と `resolution` のヒントを OpenRouter の `image_config` を通じて受け取ります。遅い OpenRouter 画像モデルには `agents.defaults.imageGenerationModel.timeoutMs` を使用します。`image_generate` ツールの呼び出しごとの `timeoutMs` パラメーターは引き続き優先されます。

## 動画生成

OpenRouter は、非同期の `/videos` API を通じて `video_generate` ツールのバックエンドにもできます。`agents.defaults.videoGenerationModel` で OpenRouter の動画モデルを使用します。

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

OpenClaw はテキストから動画、画像から動画のジョブを OpenRouter に送信し、返された `polling_url` をポーリングして、完了した動画を OpenRouter の `unsigned_urls` またはドキュメント化されたジョブコンテンツエンドポイントからダウンロードします。参照画像はデフォルトで最初/最後のフレーム画像として送信されます。`reference_image` でタグ付けされた画像は OpenRouter の入力参照として送信されます。バンドル済みの `google/veo-3.1-fast` デフォルトは、現在サポートされている 4/6/8 秒の長さ、`720P`/`1080P` 解像度、`16:9`/`9:16` アスペクト比を示します。上流の動画生成 API は現在テキストと画像参照を受け付けるため、OpenRouter では動画から動画は登録されていません。

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

`messages.tts.providers.openrouter.apiKey` が省略された場合、TTS は `models.providers.openrouter.apiKey`、次に `OPENROUTER_API_KEY` を再利用します。

## 音声からテキスト (受信音声)

OpenRouter は、STT エンドポイント (`/audio/transcriptions`) を使用して、共有の `tools.media.audio` パス経由で受信ボイス/音声添付を文字起こしできます。これは、受信ボイス/音声をメディア理解の事前処理へ転送する任意のチャンネル Plugin に適用されます。

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

OpenClaw は、OpenRouter の STT リクエストをマルチパートの OpenAI フォームアップロードではなく、`input_audio` (OpenRouter STT 契約) に base64 音声を含む JSON として送信します。

## 認証とヘッダー

OpenRouter は内部的に、API キーを使用する Bearer トークンを使います。

実際の OpenRouter リクエスト (`https://openrouter.ai/api/v1`) では、OpenClaw は OpenRouter がドキュメント化しているアプリ帰属ヘッダーも追加します。

| ヘッダー                  | 値                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter プロバイダーを別のプロキシまたはベース URL に向け直す場合、OpenClaw はこれらの OpenRouter 固有ヘッダーや Anthropic キャッシュマーカーを挿入**しません**。
</Warning>

## 高度な設定

<AccordionGroup>
  <Accordion title="レスポンスキャッシュ">
    OpenRouter のレスポンスキャッシュはオプトインです。モデルパラメーターを使って OpenRouter モデルごとに有効化します。

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

    OpenClaw は `X-OpenRouter-Cache: true` を送信し、設定されている場合は `X-OpenRouter-Cache-TTL` も送信します。`responseCacheClear: true` は現在のリクエストで強制的に更新し、置き換え後のレスポンスを保存します。Snake_case のエイリアス (`response_cache`、`response_cache_ttl_seconds`、`response_cache_clear`) も受け付けます。

    これはプロバイダーのプロンプトキャッシュや OpenRouter の Anthropic `cache_control` マーカーとは別です。検証済みの `openrouter.ai` ルートにのみ適用され、カスタムプロキシのベース URL には適用されません。

  </Accordion>

  <Accordion title="Anthropic キャッシュマーカー">
    検証済みの OpenRouter ルートでは、Anthropic モデル参照は、システム/開発者プロンプトブロックでプロンプトキャッシュをより再利用しやすくするために OpenClaw が使用する OpenRouter 固有の Anthropic `cache_control` マーカーを保持します。
  </Accordion>

  <Accordion title="Anthropic 推論プリフィル">
    検証済みの OpenRouter ルートでは、推論が有効な Anthropic モデル参照は、リクエストが OpenRouter に到達する前に末尾のアシスタントプリフィルターンを削除し、推論会話はユーザーターンで終わる必要があるという Anthropic の要件に合わせます。
  </Accordion>

  <Accordion title="思考 / 推論の注入">
    サポートされている非 `auto` ルートでは、OpenClaw は選択された思考レベルを OpenRouter プロキシ推論ペイロードにマッピングします。サポートされていないモデルヒントと `openrouter/auto` では、その推論注入をスキップします。Hunter Alpha も、古い設定済みモデル参照ではプロキシ推論をスキップします。これは、OpenRouter がその廃止済みルートの推論フィールドで最終回答テキストを返す可能性があるためです。
  </Accordion>

  <Accordion title="DeepSeek V4 推論リプレイ">
    検証済みの OpenRouter ルートでは、`openrouter/deepseek/deepseek-v4-flash` と `openrouter/deepseek/deepseek-v4-pro` は、リプレイされたアシスタントターンで不足している `reasoning_content` を埋め、思考/ツール会話が DeepSeek V4 の要求する後続形状を保てるようにします。OpenClaw はこれらのルートに OpenRouter がサポートする `reasoning_effort` 値を送信します。`xhigh` が公開されている最高レベルであり、古い `max` オーバーライドは `xhigh` にマッピングされます。
  </Accordion>

  <Accordion title="OpenAI 専用リクエスト整形">
    OpenRouter は引き続きプロキシ形式の OpenAI 互換パスを通るため、`serviceTier`、Responses `store`、OpenAI 推論互換ペイロード、プロンプトキャッシュヒントなどのネイティブな OpenAI 専用リクエスト整形は転送されません。
  </Accordion>

  <Accordion title="Gemini バックエンドのルート">
    Gemini バックエンドの OpenRouter 参照は、プロキシ Gemini パスに留まります。OpenClaw はそこで Gemini の思考シグネチャのサニタイズを維持しますが、ネイティブ Gemini のリプレイ検証やブートストラップ書き換えは有効化しません。
  </Accordion>

  <Accordion title="プロバイダールーティングメタデータ">
    モデルパラメーターで OpenRouter プロバイダールーティングを渡すと、OpenClaw は共有ストリームラッパーが実行される前に、それを OpenRouter ルーティングメタデータとして転送します。
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

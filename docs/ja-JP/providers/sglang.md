---
read_when:
    - ローカルの SGLang サーバーに対して OpenClaw を実行したい場合
    - 独自のモデルでOpenAI互換の/v1エンドポイントを使いたい
summary: SGLang（OpenAI互換のセルフホストサーバー）でOpenClawを実行する
title: SGLang
x-i18n:
    generated_at: "2026-07-05T11:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang は OpenAI 互換の HTTP API 経由でオープンウェイトモデルを提供します。OpenClaw は、利用可能なモデルの自動検出付きで `openai-completions` プロバイダーファミリーを使用して SGLang に接続します。

| プロパティ              | 値                                                           |
| ------------------------- | ------------------------------------------------------------ |
| プロバイダー id          | `sglang`                                                     |
| Plugin                    | バンドル済み、`enabledByDefault: true`                       |
| 認証 env var              | `SGLANG_API_KEY`（サーバーに認証がない場合は任意の空でない値） |
| オンボーディングフラグ   | `--auth-choice sglang`                                       |
| API                       | OpenAI 互換（`openai-completions`）                          |
| デフォルトのベース URL   | `http://127.0.0.1:30000/v1`                                  |
| デフォルトモデルのプレースホルダー | `sglang/Qwen/Qwen3-8B`                              |
| ストリーミング使用量     | はい（`supportsStreamingUsage: true`）                       |
| 料金                      | 外部無料としてマーク（`modelPricing.external: false`）        |

OpenClaw は、`SGLANG_API_KEY` でオプトインすると、SGLang から利用可能なモデルも**自動検出**します。カスタムの SGLang ベース URL も設定する場合に検出を動的に保つには、`agents.defaults.models` で `sglang/*` を使用します。下記の [モデル検出（暗黙のプロバイダー）](#model-discovery-implicit-provider) を参照してください。

## はじめに

<Steps>
  <Step title="Start SGLang">
    OpenAI 互換サーバーで SGLang を起動します。ベース URL は
    `/v1` エンドポイント（例: `/v1/models`、`/v1/chat/completions`）を公開している必要があります。SGLang は
    一般的に次で実行されます。

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Set an API key">
    サーバーで認証が設定されていない場合は、任意の値で動作します。

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Run onboarding or set a model directly">
    ```bash
    openclaw onboard
    ```

    または、モデルを手動で設定します。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## モデル検出（暗黙のプロバイダー）

`SGLANG_API_KEY` が設定されている（または認証プロファイルが存在する）場合で、かつ `models.providers.sglang` を
定義して**いない**場合、OpenClaw は次をクエリします。

- `GET http://127.0.0.1:30000/v1/models`

そして返された ID をモデルエントリに変換します。

<Note>
`models.providers.sglang` を明示的に設定した場合、OpenClaw はデフォルトで宣言済みの
モデルを使用します。OpenClaw に、その設定済みプロバイダーの `/models` エンドポイントをクエリさせ、
公開されているすべての SGLang モデルを含めたい場合は、`agents.defaults.models` に `"sglang/*": {}` を追加してください。
</Note>

## 明示的な設定（手動モデル）

次の場合は明示的な設定を使用します。

- SGLang が別のホスト/ポートで実行されている。
- `contextWindow`/`maxTokens` の値を固定したい。
- サーバーに実際の API キーが必要である（またはヘッダーを制御したい）。

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    SGLang は、ネイティブな OpenAI エンドポイントではなく、プロキシースタイルの OpenAI 互換 `/v1` バックエンドとして扱われます。

    | 動作 | SGLang |
    |----------|--------|
    | OpenAI 専用リクエスト整形 | 適用されない |
    | `service_tier`、Responses `store`、プロンプトキャッシュヒント | 送信されない |
    | reasoning 互換ペイロード整形 | 適用されない |
    | 隠し属性ヘッダー（`originator`、`version`、`User-Agent`） | カスタム SGLang ベース URL には注入されない |

  </Accordion>

  <Accordion title="Troubleshooting">
    **サーバーに到達できない**

    サーバーが実行中で応答していることを確認します。

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **認証エラー**

    リクエストが認証エラーで失敗する場合は、サーバー設定に一致する実際の `SGLANG_API_KEY` を設定するか、
    `models.providers.sglang` 配下でプロバイダーを明示的に設定してください。

    <Tip>
    認証なしで SGLang を実行する場合、`SGLANG_API_KEY` に任意の空でない値を設定すれば
    モデル検出にオプトインできます。
    </Tip>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーエントリを含む完全な設定スキーマ。
  </Card>
</CardGroup>

---
read_when:
    - ローカルの SGLang サーバーに接続して OpenClaw を実行したい場合
    - 独自モデルで OpenAI 互換の /v1 エンドポイントを使いたい
summary: SGLangでOpenClawを実行する（OpenAI互換のセルフホストサーバー）
title: SGLang
x-i18n:
    generated_at: "2026-05-06T05:17:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang は OpenAI 互換の HTTP API 経由でオープンウェイトモデルを提供します。OpenClaw は `openai-completions` プロバイダーファミリーを使用し、利用可能なモデルを自動検出して SGLang に接続します。

| プロパティ              | 値                                                           |
| ------------------------- | ------------------------------------------------------------ |
| プロバイダー ID          | `sglang`                                                     |
| Plugin                    | バンドル済み、`enabledByDefault: true`                       |
| 認証環境変数             | `SGLANG_API_KEY` (サーバーに認証がない場合は任意の空でない値) |
| オンボーディングフラグ   | `--auth-choice sglang`                                       |
| API                       | OpenAI 互換 (`openai-completions`)                           |
| デフォルトのベース URL   | `http://127.0.0.1:30000/v1`                                  |
| デフォルトモデルのプレースホルダー | `sglang/Qwen/Qwen3-8B`                              |
| ストリーミング使用量     | はい (`supportsStreamingUsage: true`)                        |
| 料金                      | 外部無料としてマーク (`modelPricing.external: false`)        |

また、OpenClaw は `SGLANG_API_KEY` でオプトインし、明示的な `models.providers.sglang` エントリを定義していない場合、SGLang から利用可能なモデルを**自動検出**します。下記の [モデル検出 (暗黙的プロバイダー)](#model-discovery-implicit-provider) を参照してください。

## はじめに

<Steps>
  <Step title="SGLang を起動する">
    OpenAI 互換サーバーで SGLang を起動します。ベース URL は
    `/v1` エンドポイント (たとえば `/v1/models`、`/v1/chat/completions`) を公開している必要があります。SGLang は
    一般的に次で実行されます。

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API キーを設定する">
    サーバーで認証が設定されていない場合は、任意の値で動作します。

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="オンボーディングを実行するか、モデルを直接設定する">
    ```bash
    openclaw onboard
    ```

    またはモデルを手動で設定します。

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

## モデル検出 (暗黙的プロバイダー)

`SGLANG_API_KEY` が設定されている (または認証プロファイルが存在する) かつ、`models.providers.sglang` を定義して**いない**場合、OpenClaw は次をクエリします。

- `GET http://127.0.0.1:30000/v1/models`

そして返された ID をモデルエントリに変換します。

<Note>
`models.providers.sglang` を明示的に設定した場合、自動検出はスキップされ、
モデルを手動で定義する必要があります。
</Note>

## 明示的な設定 (手動モデル)

次の場合は明示的な設定を使用します。

- SGLang が別のホスト/ポートで実行されている。
- `contextWindow`/`maxTokens` の値を固定したい。
- サーバーが実際の API キーを必要とする (またはヘッダーを制御したい)。

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
  <Accordion title="プロキシースタイルの動作">
    SGLang はネイティブの OpenAI エンドポイントではなく、プロキシースタイルの OpenAI 互換 `/v1` バックエンドとして扱われます。

    | 動作 | SGLang |
    |----------|--------|
    | OpenAI 専用のリクエスト整形 | 適用されません |
    | `service_tier`、Responses `store`、プロンプトキャッシュヒント | 送信されません |
    | 推論互換ペイロード整形 | 適用されません |
    | 非表示の帰属ヘッダー (`originator`、`version`、`User-Agent`) | カスタム SGLang ベース URL には注入されません |

  </Accordion>

  <Accordion title="トラブルシューティング">
    **サーバーに到達できない**

    サーバーが実行中で応答していることを確認します。

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **認証エラー**

    リクエストが認証エラーで失敗する場合は、サーバー設定と一致する実際の `SGLANG_API_KEY` を設定するか、
    `models.providers.sglang` の下でプロバイダーを明示的に設定します。

    <Tip>
    認証なしで SGLang を実行している場合、`SGLANG_API_KEY` に任意の空でない値を設定すれば、モデル検出にオプトインするには十分です。
    </Tip>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダーエントリを含む完全な設定スキーマ。
  </Card>
</CardGroup>

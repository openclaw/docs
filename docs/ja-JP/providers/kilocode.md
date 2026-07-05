---
read_when:
    - 多くの LLM に対して単一の API キーを使いたい
    - OpenClaw で Kilo Gateway 経由でモデルを実行したい
summary: Kilo Gateway の統合 API を使用して OpenClaw で多くのモデルにアクセスする
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-05T11:40:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gatewayは、単一のOpenAI互換エンドポイントとAPIキーの背後で、多数のモデルへリクエストをルーティングします。

| プロパティ | 値                                 |
| -------- | ---------------------------------- |
| プロバイダー | `kilocode`                         |
| 認証     | `KILOCODE_API_KEY`                 |
| API      | OpenAI互換                         |
| ベースURL | `https://api.kilo.ai/api/gateway/` |

## Pluginをインストール

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## セットアップ

<Steps>
  <Step title="アカウントを作成">
    [app.kilo.ai](https://app.kilo.ai) に移動し、サインインするかアカウントを作成してから、APIキーを生成します。
  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    または、環境変数を直接設定します。

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="モデルが利用可能であることを確認">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## デフォルトモデルとカタログ

デフォルトモデルは `kilocode/kilo/auto` で、プロバイダーが所有するスマートルーティングモデルです。OpenClawは、このモデルについてタスクから上流モデルへのマッピングを公開していません。`kilo/auto` の背後のルーティングはKilo Gatewayが所有します。

起動時にOpenClawは `GET https://api.kilo.ai/api/gateway/models` をクエリし、検出されたモデルを静的フォールバックカタログより優先してマージします。静的フォールバックには `kilocode/kilo/auto` のみが含まれます（`Kilo Auto`、`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000`）。

Gateway上の任意のモデルは `kilocode/<upstream-id>` として指定できます（例: `kilocode/anthropic/claude-sonnet-4`、`kilocode/openai/gpt-5.5`）。検出された完全な一覧を確認するには、`/models kilocode` または `openclaw models list --provider kilocode` を実行します。

## 設定例

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## 動作メモ

<AccordionGroup>
  <Accordion title="トランスポートと互換性">
    Kilo GatewayはOpenRouter互換のため、ネイティブなOpenAIリクエスト整形ではなく、プロキシ形式のOpenAI互換リクエストパスを使用します（`store` なし、OpenAIのreasoning-effortペイロードなし）。

    - GeminiベースのKilo参照はプロキシGeminiパスのままです。OpenClawはそこでGeminiのthought signatureをサニタイズしますが、ネイティブGeminiのリプレイ検証やブートストラップ書き換えは有効にしません。
    - リクエストはAPIキーから構築されたBearerトークンを使用します。

  </Accordion>

  <Accordion title="ストリームラッパーと推論">
    Kiloストリームラッパーは `X-KILOCODE-FEATURE` リクエストヘッダー（デフォルトは `openclaw`、`KILOCODE_FEATURE` 環境変数で上書き可能）を追加し、対応モデル向けにreasoning-effortペイロードを正規化します。

    <Warning>
    `kilocode/kilo/auto` と `x-ai/*` 参照ではreasoning-effortの注入をスキップします。推論サポートが必要な場合は、`kilocode/anthropic/claude-sonnet-4` のような具体的なモデル参照を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - 起動時にモデル検出が失敗した場合、OpenClawは `kilocode/kilo/auto` を含む静的カタログにフォールバックします。
    - APIキーが有効であり、Kiloアカウントで目的のモデルが有効になっていることを確認してください。
    - Gatewayがデーモンとして実行される場合は、`KILOCODE_API_KEY` がそのプロセスで利用可能であることを確認してください（例: `~/.openclaw/.env` 内、または `env.shellEnv` 経由）。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw設定の完全なリファレンス。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gatewayダッシュボード、APIキー、アカウント管理。
  </Card>
</CardGroup>

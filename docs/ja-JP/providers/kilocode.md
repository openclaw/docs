---
read_when:
    - 多数のLLMに対して単一のAPIキーを使用したい場合
    - OpenClaw で Kilo Gateway 経由でモデルを実行したい場合
summary: Kilo Gateway の統合 API を使用して、OpenClaw で多数のモデルにアクセスする
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-11T22:37:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway は、単一の OpenAI 互換エンドポイントと API キーを介して、多数のモデルにリクエストをルーティングします。

| プロパティ | 値                                 |
| ---------- | ---------------------------------- |
| プロバイダー | `kilocode`                         |
| 認証       | `KILOCODE_API_KEY`                 |
| API        | OpenAI 互換                        |
| ベース URL | `https://api.kilo.ai/api/gateway/` |

## Plugin をインストールする

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## セットアップ

<Steps>
  <Step title="アカウントを作成する">
    [app.kilo.ai](https://app.kilo.ai) に移動し、サインインするかアカウントを作成してから、API キーを生成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    または、環境変数を直接設定します。

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## デフォルトモデルとカタログ

デフォルトモデルは `kilocode/kilo/auto` で、プロバイダーが管理するスマートルーティングモデルです。OpenClaw は、このモデルについてタスクと上流モデルの対応関係を公開していません。`kilo/auto` の背後にあるルーティングは Kilo Gateway が管理します。

起動時に OpenClaw は `GET https://api.kilo.ai/api/gateway/models` を照会し、検出したモデルを静的フォールバックカタログより優先して統合します。静的フォールバックに含まれるのは `kilocode/kilo/auto`（`Kilo Auto`、`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000`）のみです。

Gateway 上のすべてのモデルは `kilocode/<upstream-id>` として指定できます（例: `kilocode/anthropic/claude-sonnet-4`、`kilocode/openai/gpt-5.5`）。検出されたモデルの完全な一覧を表示するには、`/models kilocode` または `openclaw models list --provider kilocode` を実行します。

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

## 動作に関する注意事項

<AccordionGroup>
  <Accordion title="トランスポートと互換性">
    Kilo Gateway は OpenRouter 互換であるため、OpenAI ネイティブのリクエスト形式ではなく、プロキシ形式の OpenAI 互換リクエストパスを使用します（`store` および OpenAI の推論労力ペイロードは使用しません）。

    - Gemini を基盤とする Kilo の参照は、プロキシ Gemini パスを引き続き使用します。OpenClaw はそこで Gemini の思考シグネチャを無害化しますが、Gemini ネイティブのリプレイ検証やブートストラップ書き換えは有効にしません。
    - リクエストでは、API キーから生成された Bearer トークンを使用します。

  </Accordion>

  <Accordion title="ストリームラッパーと推論">
    Kilo ストリームラッパーは、リクエストに `X-KILOCODE-FEATURE` ヘッダーを追加し（デフォルトは `openclaw`、`KILOCODE_FEATURE` 環境変数で上書き可能）、対応モデル向けの推論労力ペイロードを正規化します。

    <Warning>
    `kilocode/kilo/auto` および `x-ai/*` の参照では、推論労力の注入がスキップされます。推論サポートが必要な場合は、`kilocode/anthropic/claude-sonnet-4` などの具体的なモデル参照を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - 起動時にモデル検出が失敗すると、OpenClaw は `kilocode/kilo/auto` を含む静的カタログにフォールバックします。
    - API キーが有効であり、Kilo アカウントで目的のモデルが有効になっていることを確認してください。
    - Gateway をデーモンとして実行する場合は、そのプロセスから `KILOCODE_API_KEY` を利用できるようにしてください（例: `~/.openclaw/.env` または `env.shellEnv` 経由）。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw の完全な設定リファレンス。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway のダッシュボード、API キー、アカウント管理。
  </Card>
</CardGroup>

---
read_when:
    - 多くの LLM に対して単一の API キーを使いたい
    - OpenClaw で Kilo Gateway 経由でモデルを実行したい
summary: Kilo Gateway の統合 API を使用して OpenClaw で多数のモデルにアクセスする
title: Kilocode
x-i18n:
    generated_at: "2026-04-30T05:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway は、単一のエンドポイントと API キーの背後で多数のモデルにリクエストをルーティングする **統合 API** を提供します。OpenAI 互換のため、ほとんどの OpenAI SDK はベース URL を切り替えるだけで動作します。

| プロパティ | 値                                 |
| ---------- | ---------------------------------- |
| プロバイダー | `kilocode`                         |
| 認証       | `KILOCODE_API_KEY`                 |
| API        | OpenAI 互換                        |
| ベース URL | `https://api.kilo.ai/api/gateway/` |

## はじめに

<Steps>
  <Step title="Create an account">
    [app.kilo.ai](https://app.kilo.ai) に移動し、サインインするかアカウントを作成してから、API Keys に移動して新しいキーを生成します。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    または、環境変数を直接設定します。

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## デフォルトモデル

デフォルトモデルは `kilocode/kilo/auto` です。これは Kilo Gateway が管理する、プロバイダー所有のスマートルーティングモデルです。

<Note>
OpenClaw は `kilocode/kilo/auto` を安定したデフォルト参照として扱いますが、そのルートについて、ソースに基づくタスクからアップストリームモデルへのマッピングは公開しません。`kilocode/kilo/auto` の背後にある正確なアップストリームルーティングは Kilo Gateway が所有しており、OpenClaw にハードコードされているわけではありません。
</Note>

## 組み込みカタログ

OpenClaw は起動時に Kilo Gateway から利用可能なモデルを動的に検出します。アカウントで利用可能なモデルの完全な一覧を確認するには、`/models kilocode` を使用します。

Gateway で利用可能な任意のモデルは、`kilocode/` プレフィックス付きで使用できます。

| モデル参照                             | メモ                               |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | デフォルト — スマートルーティング  |
| `kilocode/anthropic/claude-sonnet-4`   | Kilo 経由の Anthropic              |
| `kilocode/openai/gpt-5.5`              | Kilo 経由の OpenAI                 |
| `kilocode/google/gemini-3-pro-preview` | Kilo 経由の Google                 |
| ...ほか多数                            | すべてを一覧表示するには `/models kilocode` を使用 |

<Tip>
起動時に、OpenClaw は `GET https://api.kilo.ai/api/gateway/models` を照会し、検出したモデルを静的フォールバックカタログより前にマージします。同梱のフォールバックには常に `kilocode/kilo/auto` (`Kilo Auto`) が含まれ、`input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000`、`maxTokens: 128000` が設定されています。
</Tip>

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

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Kilo Gateway はソース上で OpenRouter 互換として文書化されているため、ネイティブ OpenAI リクエスト整形ではなく、プロキシ形式の OpenAI 互換パスに留まります。

    - Gemini ベースの Kilo 参照はプロキシ Gemini パスに留まるため、OpenClaw はネイティブ Gemini の再生検証やブートストラップ書き換えを有効化せずに、そこで Gemini の thought-signature サニタイズを維持します。
    - Kilo Gateway は内部的に、API キーを Bearer トークンとして使用します。

  </Accordion>

  <Accordion title="Stream wrapper and reasoning">
    Kilo の共有ストリームラッパーは、プロバイダーアプリヘッダーを追加し、サポート対象の具体的なモデル参照向けにプロキシ reasoning ペイロードを正規化します。

    <Warning>
    `kilocode/kilo/auto` およびその他のプロキシ reasoning 非対応ヒントでは reasoning 注入をスキップします。reasoning サポートが必要な場合は、`kilocode/anthropic/claude-sonnet-4` のような具体的なモデル参照を使用してください。
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 起動時にモデル検出が失敗した場合、OpenClaw は `kilocode/kilo/auto` を含む同梱の静的カタログにフォールバックします。
    - API キーが有効であること、および Kilo アカウントで目的のモデルが有効になっていることを確認してください。
    - Gateway がデーモンとして実行される場合は、`KILOCODE_API_KEY` がそのプロセスで利用可能であることを確認してください（例: `~/.openclaw/.env` または `env.shellEnv` 経由）。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    OpenClaw 設定リファレンス全体。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway ダッシュボード、API キー、アカウント管理。
  </Card>
</CardGroup>

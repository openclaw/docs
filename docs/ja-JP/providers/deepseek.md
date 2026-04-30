---
read_when:
    - OpenClaw で DeepSeek を使いたい場合
    - API キーの環境変数または CLI 認証の選択が必要です
summary: DeepSeek の設定（認証 + モデル選択）
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T05:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) は、OpenAI 互換 API を備えた強力な AI モデルを提供します。

| プロパティ | 値                         |
| ---------- | -------------------------- |
| プロバイダー | `deepseek`                 |
| 認証       | `DEEPSEEK_API_KEY`         |
| API        | OpenAI 互換                |
| ベース URL | `https://api.deepseek.com` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    これにより API キーの入力を求められ、`deepseek/deepseek-v4-flash` がデフォルトモデルとして設定されます。

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider deepseek
    ```

    実行中の Gateway を必要とせずに、バンドルされた静的カタログを調べるには、次を使用します。

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非対話型セットアップ">
    スクリプト化されたインストールやヘッドレスインストールでは、すべてのフラグを直接渡します。

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Gateway をデーモン (launchd/systemd) として実行する場合は、`DEEPSEEK_API_KEY`
がそのプロセスで利用可能になっていることを確認してください (たとえば、`~/.openclaw/.env` 内、または
`env.shellEnv` 経由)。
</Warning>

## 組み込みカタログ

| モデル参照                   | 名前              | 入力 | コンテキスト | 最大出力 | 注記                                       |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | デフォルトモデル。V4 thinking 対応サーフェス |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | V4 thinking 対応サーフェス                 |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | DeepSeek V3.2 non-thinking サーフェス      |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | 推論対応 V3.2 サーフェス                   |

<Tip>
V4 モデルは DeepSeek の `thinking` 制御をサポートします。OpenClaw はフォローアップターンで
DeepSeek の `reasoning_content` も再生するため、ツール呼び出しを含む thinking セッションを継続できます。
</Tip>

## Thinking とツール

DeepSeek V4 の thinking セッションには、ほとんどの OpenAI 互換プロバイダーよりも厳格な再生契約があります。thinking が有効なターンでツールを使用した後、DeepSeek はフォローアップリクエストで、そのターンから再生された assistant メッセージに `reasoning_content` が含まれることを期待します。OpenClaw はこれを DeepSeek Plugin 内で処理するため、通常の複数ターンのツール使用は `deepseek/deepseek-v4-flash` および `deepseek/deepseek-v4-pro` で機能します。

既存のセッションを別の OpenAI 互換プロバイダーから DeepSeek V4 モデルに切り替える場合、古い assistant のツール呼び出しターンにネイティブの DeepSeek `reasoning_content` がないことがあります。OpenClaw は、DeepSeek V4 thinking リクエストのために再生された assistant メッセージで、その欠落フィールドを補完するため、プロバイダーは `/new` を要求せずに履歴を受け入れられます。

OpenClaw で thinking が無効な場合 (UI の **None** 選択を含む)、OpenClaw は DeepSeek に `thinking: { type: "disabled" }` を送信し、送信履歴から再生された `reasoning_content` を取り除きます。これにより、thinking が無効なセッションは non-thinking の DeepSeek パスに保たれます。

デフォルトの高速パスには `deepseek/deepseek-v4-flash` を使用します。より強力な V4 モデルが必要で、より高いコストやレイテンシーを許容できる場合は `deepseek/deepseek-v4-pro` を使用します。

## ライブテスト

直接ライブモデルスイートには、最新のモデルセットに DeepSeek V4 が含まれています。DeepSeek V4 の直接モデルチェックのみを実行するには、次を実行します。

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

このライブチェックでは、両方の V4 モデルが完了できることと、thinking/ツールのフォローアップターンで DeepSeek が要求する再生ペイロードが保持されることを検証します。

## 設定例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>

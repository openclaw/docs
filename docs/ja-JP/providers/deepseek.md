---
read_when:
    - OpenClaw で DeepSeek を使用したい
    - API キーの環境変数または CLI 認証の選択が必要です
summary: DeepSeek セットアップ（認証 + モデル選択）
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T12:41:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) は、OpenAI互換 API を備えた強力な AI モデルを提供します。

| プロパティ | 値                         |
| ---------- | -------------------------- |
| プロバイダー | `deepseek`                 |
| 認証       | `DEEPSEEK_API_KEY`         |
| API        | OpenAI互換                 |
| ベース URL | `https://api.deepseek.com` |

## Plugin をインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを取得">
    [platform.deepseek.com](https://platform.deepseek.com/api_keys) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    これにより API キーの入力を求められ、`deepseek/deepseek-v4-flash` がデフォルトモデルとして設定されます。

  </Step>
  <Step title="モデルが利用可能であることを確認">
    ```bash
    openclaw models list --provider deepseek
    ```

    実行中の Gateway を必要とせずに Plugin の静的カタログを調べるには、次を使用します。

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
Gateway がデーモン (launchd/systemd) として実行される場合は、`DEEPSEEK_API_KEY`
がそのプロセスで利用可能であることを確認してください (たとえば、`~/.openclaw/.env` 内、または
`env.shellEnv` 経由)。
</Warning>

## 組み込みカタログ

| モデル参照                   | 名前              | 入力 | コンテキスト | 最大出力   | メモ                                       |
| ---------------------------- | ----------------- | ---- | ------------ | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | テキスト | 1,000,000 | 384,000    | デフォルトモデル。V4 thinking 対応サーフェス |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | テキスト | 1,000,000 | 384,000    | V4 thinking 対応サーフェス                 |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | テキスト | 131,072   | 8,192      | DeepSeek V3.2 非 thinking サーフェス       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | テキスト | 131,072   | 65,536     | reasoning 有効 V3.2 サーフェス            |

<Tip>
V4 モデルは DeepSeek の `thinking` 制御をサポートします。OpenClaw はフォローアップターンで
DeepSeek `reasoning_content` も再生するため、ツール呼び出しを含む thinking セッションを継続できます。
DeepSeek V4 モデルで DeepSeek の最大 `reasoning_effort` を要求するには、`/think xhigh` または `/think max` を使用します。
</Tip>

## Thinking とツール

DeepSeek V4 の thinking セッションには、ほとんどの OpenAI互換プロバイダーより厳格な再生契約があります。thinking が有効なターンでツールが使用された後、DeepSeek はフォローアップリクエストで再生されるそのターンのアシスタントメッセージに `reasoning_content` が含まれることを期待します。OpenClaw はこれを DeepSeek Plugin 内で処理するため、通常のマルチターンのツール使用は `deepseek/deepseek-v4-flash` と `deepseek/deepseek-v4-pro` で動作します。

既存のセッションを別の OpenAI互換プロバイダーから DeepSeek V4 モデルに切り替えると、古いアシスタントのツール呼び出しターンにネイティブの DeepSeek `reasoning_content` がない場合があります。OpenClaw は、DeepSeek V4 thinking リクエスト向けに再生されるアシスタントメッセージでその欠落フィールドを補完するため、プロバイダーは `/new` を必要とせずに履歴を受け入れられます。

OpenClaw で thinking が無効になっている場合 (UI の **なし** 選択を含む)、OpenClaw は DeepSeek `thinking: { type: "disabled" }` を送信し、送信履歴から再生された `reasoning_content` を取り除きます。これにより、thinking 無効のセッションは非 thinking の DeepSeek パスに保たれます。

デフォルトの高速パスには `deepseek/deepseek-v4-flash` を使用します。より強力な V4 モデルが必要で、より高いコストまたはレイテンシを許容できる場合は `deepseek/deepseek-v4-pro` を使用します。

## ライブテスト

直接ライブモデルスイートには、最新モデルセット内の DeepSeek V4 が含まれています。DeepSeek V4 の直接モデルチェックのみを実行するには、次を使用します。

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

このライブチェックでは、両方の V4 モデルが完了できることと、thinking/ツールのフォローアップターンで DeepSeek が必要とする再生ペイロードが保持されることを検証します。

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

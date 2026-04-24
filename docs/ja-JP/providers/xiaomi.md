---
read_when:
    - OpenClaw で Xiaomi MiMo モデルを使いたい場合
    - '`XIAOMI_API_KEY` のセットアップが必要です'
summary: OpenClaw で Xiaomi MiMo モデルを使う
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-24T05:17:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae61547fa5864f0cd3e19465a8a7d6ff843f9534ab9c2dd39a86a3593cafaa8d
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo は **MiMo** モデル向けの API プラットフォームです。OpenClaw は
API キー認証を用いて Xiaomi の OpenAI-compatible endpoint を使用します。

| Property | Value |
| -------- | ------------------------------- |
| Provider | `xiaomi` |
| Auth     | `XIAOMI_API_KEY` |
| API      | OpenAI-compatible |
| Base URL | `https://api.xiaomimimo.com/v1` |

## はじめに

<Steps>
  <Step title="API キーを取得する">
    [Xiaomi MiMo console](https://platform.xiaomimimo.com/#/console/api-keys) で API キーを作成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    またはキーを直接渡します:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## 組み込みカタログ

| Model ref | Input | Context | Max output | Reasoning | Notes |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text | 262,144 | 8,192 | No | デフォルトモデル |
| `xiaomi/mimo-v2-pro`   | text | 1,048,576 | 32,000 | Yes | 大きなコンテキスト |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144 | 32,000 | Yes | マルチモーダル |

<Tip>
デフォルト model ref は `xiaomi/mimo-v2-flash` です。`XIAOMI_API_KEY` が設定されているか auth profile が存在する場合、provider は自動的に注入されます。
</Tip>

## config 例

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="自動注入の挙動">
    `XIAOMI_API_KEY` が環境に設定されているか auth profile が存在する場合、`xiaomi` provider は自動的に注入されます。model metadata や base URL を上書きしたい場合を除き、provider を手動設定する必要はありません。
  </Accordion>

  <Accordion title="モデル詳細">
    - **mimo-v2-flash** — 軽量で高速、汎用テキストタスクに最適です。reasoning はサポートしません。
    - **mimo-v2-pro** — reasoning をサポートし、長文ドキュメント向けに 1M token の context window を持ちます。
    - **mimo-v2-omni** — text と image の両方を受け付ける、reasoning 対応のマルチモーダルモデルです。

    <Note>
    すべてのモデルは `xiaomi/` prefix を使用します（例: `xiaomi/mimo-v2-pro`）。
    </Note>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - モデルが表示されない場合は、`XIAOMI_API_KEY` が設定されていて有効であることを確認してください。
    - Gateway が daemon として動作している場合、そのプロセスでキーが利用可能であることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` 経由）。

    <Warning>
    対話シェル内でのみ設定されたキーは、daemon 管理の Gateway プロセスからは見えません。永続的に利用可能にするには `~/.openclaw/.env` または `env.shellEnv` config を使用してください。
    </Warning>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー挙動の選び方。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    完全な OpenClaw 設定リファレンス。
  </Card>
  <Card title="Xiaomi MiMo console" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo ダッシュボードと API キー管理。
  </Card>
</CardGroup>

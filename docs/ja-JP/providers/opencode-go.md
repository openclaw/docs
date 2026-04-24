---
read_when:
    - OpenCode Go カタログが必要な場合
    - Go ホスト型モデル向けのランタイムモデル参照が必要な場合
summary: 共有 OpenCode セットアップで OpenCode Go カタログを使う
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-24T05:15:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70ca7e7c63f95cbb698d5193c2d9fa48576a8d7311dbd7fa4e2f10a42e275a7
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go は [OpenCode](/ja-JP/providers/opencode) 内の Go カタログです。
Zen カタログと同じ `OPENCODE_API_KEY` を使いますが、上流のモデルごとのルーティングが正しく保たれるよう、
ランタイム provider id は `opencode-go` のままです。

| Property         | Value                           |
| ---------------- | ------------------------------- |
| Runtime provider | `opencode-go`                   |
| Auth             | `OPENCODE_API_KEY`              |
| Parent setup     | [OpenCode](/ja-JP/providers/opencode) |

## 組み込みカタログ

OpenClaw は、Go カタログをバンドル済み pi モデルレジストリから取得します。現在のモデル一覧は
`openclaw models list --provider opencode-go` を実行してください。

バンドル済み pi カタログ時点では、この provider には次が含まれます。

| Model ref                  | Name                  |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6（3 倍制限） |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## はじめに

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Go モデルをデフォルトに設定する">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="キーを直接渡す">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Config 例

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="ルーティング動作">
    モデル参照が
    `opencode-go/...` を使っていれば、OpenClaw はモデルごとのルーティングを自動処理します。追加の provider config は不要です。
  </Accordion>

  <Accordion title="ランタイム参照の慣例">
    ランタイム参照は明示的なままです: Zen には `opencode/...`、Go には `opencode-go/...`。
    これにより、両カタログで上流のモデルごとのルーティングが正しく保たれます。
  </Accordion>

  <Accordion title="共有認証情報">
    同じ `OPENCODE_API_KEY` が Zen と Go の両カタログで使われます。setup 中に
    キーを入力すると、両ランタイム provider 向けの認証情報が保存されます。
  </Accordion>
</AccordionGroup>

<Tip>
共有オンボーディング概要と完全な
Zen + Go カタログ参照については [OpenCode](/ja-JP/providers/opencode) を参照してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="OpenCode（親）" href="/ja-JP/providers/opencode" icon="server">
    共有オンボーディング、カタログ概要、高度な注記。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選ぶ。
  </Card>
</CardGroup>

---
read_when:
    - OpenCode Go カタログが必要です
    - Go でホストされたモデルにはランタイムモデル参照が必要です
summary: 共有の OpenCode セットアップで OpenCode Go カタログを使用する
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T12:46:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go は [OpenCode](/ja-JP/providers/opencode) 内の Go カタログです。
Zen カタログと同じ `OPENCODE_API_KEY` を使用しますが、アップストリームのモデルごとのルーティングが正しく保たれるよう、ランタイム
プロバイダー ID `opencode-go` を保持します。

| プロパティ       | 値                              |
| ---------------- | ------------------------------- |
| ランタイムプロバイダー | `opencode-go`                   |
| 認証             | `OPENCODE_API_KEY`              |
| 親セットアップ   | [OpenCode](/ja-JP/providers/opencode) |

## 組み込みカタログ

OpenClaw は、ほとんどの Go カタログ行をバンドルされた OpenClaw モデルレジストリから取得し、
レジストリが追いつくまで現在のアップストリーム行で補完します。現在のモデル一覧を確認するには
`openclaw models list --provider opencode-go` を実行します。

このプロバイダーには次が含まれます。

| モデル参照                      | 名前                  |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (3倍制限) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 は 100万トークンのコンテキストウィンドウを使用し、最大 131K 出力トークンに対応します。

## はじめに

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Set a Go model as default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Pass the key directly">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 設定例

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="Routing behavior">
    モデル参照が `opencode-go/...` を使用している場合、OpenClaw はモデルごとのルーティングを自動的に処理します。
    追加のプロバイダー設定は不要です。
  </Accordion>

  <Accordion title="Runtime ref convention">
    ランタイム参照は明示的なままです。Zen には `opencode/...`、Go には `opencode-go/...` を使用します。
    これにより、両方のカタログにわたってアップストリームのモデルごとのルーティングが正しく保たれます。
  </Accordion>

  <Accordion title="Shared credentials">
    同じ `OPENCODE_API_KEY` が Zen と Go の両方のカタログで使用されます。セットアップ中にキーを入力すると、
    両方のランタイムプロバイダーの認証情報が保存されます。
  </Accordion>
</AccordionGroup>

<Tip>
共有オンボーディングの概要と Zen + Go カタログ参照全体については、[OpenCode](/ja-JP/providers/opencode) を参照してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/ja-JP/providers/opencode" icon="server">
    共有オンボーディング、カタログ概要、高度なメモ。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
</CardGroup>

---
read_when:
    - OpenCode Go カタログを使用する場合
    - Go でホストされるモデルのランタイムモデル参照が必要です
summary: 共有の OpenCode セットアップで OpenCode Go カタログを使用する
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T14:51:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go は、[OpenCode](/ja-JP/providers/opencode) 内の Go カタログです。Zen カタログと
`OPENCODE_API_KEY` 認証情報を共有しますが、アップストリームのモデル別ルーティングを
正しく維持するため、独自のランタイムプロバイダー ID（`opencode-go`）を使用します。

| プロパティ               | 値                                                 |
| ------------------------ | -------------------------------------------------- |
| ランタイムプロバイダー   | `opencode-go`                                      |
| 認証                     | `OPENCODE_API_KEY`（別名: `OPENCODE_ZEN_API_KEY`） |
| 親セットアップ           | [OpenCode](/ja-JP/providers/opencode)                    |

## はじめに

<Tabs>
  <Tab title="対話形式">
    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Go モデルをデフォルトに設定する">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="非対話形式">
    <Steps>
      <Step title="キーを直接渡す">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
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

## 組み込みカタログ

現在のモデル一覧を表示するには、`openclaw models list --provider opencode-go` を実行します。
同梱されている項目:

| モデル参照                      | 名前              | コンテキスト | 最大出力 | 画像入力 |
| ------------------------------- | ----------------- | ------------ | -------- | -------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M           | 384K     | いいえ   |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M           | 384K     | いいえ   |
| `opencode-go/glm-5`             | GLM-5             | 202,752      | 32,768   | いいえ   |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752      | 32,768   | いいえ   |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M           | 131,072  | いいえ   |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144      | 32,768   | いいえ   |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144      | 65,536   | はい     |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144      | 65,536   | はい     |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144      | 262,144  | はい     |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M           | 128,000  | はい     |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576    | 128,000  | いいえ   |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800      | 65,536   | いいえ   |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800      | 131,072  | いいえ   |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800      | 131,072  | いいえ   |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144      | 65,536   | はい     |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144      | 65,536   | はい     |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M           | 65,536   | いいえ   |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M           | 65,536   | はい     |

## 詳細設定

<AccordionGroup>
  <Accordion title="ルーティング動作">
    OpenClaw は、すべての `opencode-go/...` モデル参照を自動的にルーティングします。追加の
    プロバイダー設定は不要です。
  </Accordion>

  <Accordion title="ランタイム参照の規則">
    ランタイム参照は明示的な形式を維持します。Zen には `opencode/...`、Go には
    `opencode-go/...` を使用します。これにより、両方のカタログでアップストリームのモデル別ルーティングが正しく維持されます。
  </Accordion>

  <Accordion title="共有認証情報">
    1 つの `OPENCODE_API_KEY` で Zen と Go の両方のカタログを利用できます。セットアップ中に
    キーを入力すると、両方のランタイムプロバイダーの認証情報が保存されます。
  </Accordion>
</AccordionGroup>

<Tip>
共有オンボーディングの概要と、Zen + Go カタログの完全なリファレンスについては、
[OpenCode](/ja-JP/providers/opencode) を参照してください。
</Tip>

## 関連項目

<CardGroup cols={2}>
  <Card title="OpenCode（親）" href="/ja-JP/providers/opencode" icon="server">
    共有オンボーディング、カタログの概要、および詳細な注記。
  </Card>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、およびフェイルオーバー動作の選択。
  </Card>
</CardGroup>

---
read_when:
    - OpenCode Go カタログが必要です
    - Goでホストされるモデルにはランタイムモデル参照が必要です
summary: 共有 OpenCode セットアップで OpenCode Go カタログを使用する
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-05T11:41:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: decfc453b812c1264fc3e976dca4e1289171bac67b9e268f6cd9e5076b5aa78b
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go は [OpenCode](/ja-JP/providers/opencode) 内の Go カタログです。Zen カタログと
`OPENCODE_API_KEY` 認証情報を共有しますが、独自のランタイムプロバイダー ID
(`opencode-go`) を保持するため、アップストリームのモデル単位ルーティングは
正しく保たれます。

| プロパティ         | 値                                                 |
| ---------------- | -------------------------------------------------- |
| ランタイムプロバイダー | `opencode-go`                                      |
| 認証             | `OPENCODE_API_KEY` (別名: `OPENCODE_ZEN_API_KEY`) |
| 親セットアップ     | [OpenCode](/ja-JP/providers/opencode)                    |

## はじめに

<Tabs>
  <Tab title="インタラクティブ">
    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Go モデルをデフォルトに設定">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="非インタラクティブ">
    <Steps>
      <Step title="キーを直接渡す">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認">
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

現在のモデル一覧を確認するには `openclaw models list --provider opencode-go` を実行します。
同梱行:

| モデル参照                     | 名前              | コンテキスト | 最大出力 | 画像入力 |
| ------------------------------- | ----------------- | --------- | ---------- | ----------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K       | いいえ      |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K       | いいえ      |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768     | いいえ      |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768     | いいえ      |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072    | いいえ      |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768     | いいえ      |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536     | はい        |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536     | はい        |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144    | はい        |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni      | 262,144   | 32,000     | はい        |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000    | はい        |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro       | 1,048,576 | 32,000     | いいえ      |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000    | いいえ      |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536     | いいえ      |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072    | いいえ      |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072    | いいえ      |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536     | はい        |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536     | はい        |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536     | いいえ      |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536     | はい        |

## 高度な設定

<AccordionGroup>
  <Accordion title="ルーティング動作">
    OpenClaw は任意の `opencode-go/...` モデル参照を自動的にルーティングします。追加の
    プロバイダー設定は不要です。
  </Accordion>

  <Accordion title="ランタイム参照の規約">
    ランタイム参照は明示的なままです。Zen には `opencode/...`、Go には `opencode-go/...` を使用します。
    これにより、両方のカタログでアップストリームのモデル単位ルーティングが正しく保たれます。
  </Accordion>

  <Accordion title="共有認証情報">
    1 つの `OPENCODE_API_KEY` で Zen と Go の両方のカタログをカバーします。セットアップ中に
    キーを入力すると、両方のランタイムプロバイダーの認証情報が保存されます。
  </Accordion>
</AccordionGroup>

<Tip>
共有オンボーディングの概要と完全な Zen + Go カタログリファレンスについては
[OpenCode](/ja-JP/providers/opencode) を参照してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="OpenCode (親)" href="/ja-JP/providers/opencode" icon="server">
    共有オンボーディング、カタログ概要、高度なメモ。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
</CardGroup>

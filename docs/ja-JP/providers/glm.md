---
read_when:
    - OpenClawでGLMモデルを使いたい場合
    - モデル命名規則とセットアップが必要な場合
summary: GLMモデルファミリーの概要とOpenClawでの使い方
title: GLM（Zhipu）
x-i18n:
    generated_at: "2026-04-24T05:14:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 15
---

# GLMモデル

GLMは**モデルファミリー**であり（企業名ではありません）、Z.AIプラットフォーム経由で利用できます。OpenClawでは、GLM
モデルは `zai` providerと、`zai/glm-5` のようなmodel ID経由でアクセスします。

## はじめに

<Steps>
  <Step title="authルートを選び、オンボーディングを実行する">
    Z.AIのplanとregionに合うオンボーディングchoiceを選んでください:

    | Auth choice | 最適な用途 |
    | ----------- | ---------- |
    | `zai-api-key` | endpoint自動検出付きの汎用API-keyセットアップ |
    | `zai-coding-global` | Coding Planユーザー（global） |
    | `zai-coding-cn` | Coding Planユーザー（中国リージョン） |
    | `zai-global` | General API（global） |
    | `zai-cn` | General API（中国リージョン） |

    ```bash
    # 例: 汎用の自動検出
    openclaw onboard --auth-choice zai-api-key

    # 例: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="GLMをデフォルトmodelに設定する">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Config例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` を使うと、OpenClawはkeyから一致するZ.AI endpointを検出し、
正しいbase URLを自動適用できます。特定のCoding Planまたはgeneral APIサーフェスを強制したい場合は、
明示的なregional choiceを使ってください。
</Tip>

## 組み込みcatalog

OpenClawは現在、同梱の `zai` providerに次のGLM refを初期投入しています:

| Model           | Model            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
同梱のデフォルトmodel refは `zai/glm-5.1` です。GLMのversionや利用可否は
変わることがあるため、最新情報はZ.AIのdocsを確認してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Endpoint自動検出">
    `zai-api-key` auth choiceを使うと、OpenClawはkey formatを調べて
    正しいZ.AI base URLを決定します。明示的なregional choice
    （`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`）は
    自動検出をoverrideし、endpointを直接固定します。
  </Accordion>

  <Accordion title="Provider詳細">
    GLMモデルは `zai` ランタイムproviderで提供されます。完全なprovider
    設定、regional endpoint、追加capabilityについては
    [Z.AI provider docs](/ja-JP/providers/zai) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Z.AI provider" href="/ja-JP/providers/zai" icon="server">
    完全なZ.AI provider設定とregional endpoint。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover動作の選び方。
  </Card>
</CardGroup>

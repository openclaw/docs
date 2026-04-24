---
read_when:
    - OpenCode がホストするモデルアクセスを使いたい場合
    - Zen カタログと Go カタログのどちらを使うか選びたい場合
summary: OpenClaw で OpenCode Zen と Go のカタログを使う
title: OpenCode
x-i18n:
    generated_at: "2026-04-24T05:16:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d59c82a46988ef7dbbc98895af34441a5b378e5110ea636104df5f9c3672e3f0
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode は、OpenClaw で 2 つのホスト型カタログを公開します。

| カタログ | プレフィックス      | ランタイムプロバイダー |
| -------- | ------------------- | ---------------------- |
| **Zen**  | `opencode/...`      | `opencode`             |
| **Go**   | `opencode-go/...`   | `opencode-go`          |

両方のカタログは同じ OpenCode API キーを使います。OpenClaw は、上流のモデルごとのルーティングを正しく保つためにランタイムプロバイダー ID を分離したままにしていますが、オンボーディングとドキュメントでは 1 つの OpenCode セットアップとして扱います。

## はじめに

<Tabs>
  <Tab title="Zen カタログ">
    **最適な用途:** キュレートされた OpenCode マルチモデルプロキシ（Claude、GPT、Gemini）。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        またはキーを直接渡す:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Zen モデルをデフォルトに設定する">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go カタログ">
    **最適な用途:** OpenCode がホストする Kimi、GLM、MiniMax のラインアップ。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        またはキーを直接渡す:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Go モデルをデフォルトに設定する">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
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

## Config 例

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 組み込みカタログ

### Zen

| プロパティ         | 値                                                                        |
| ------------------ | ------------------------------------------------------------------------- |
| ランタイムプロバイダー | `opencode`                                                                |
| 例のモデル         | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro`   |

### Go

| プロパティ         | 値                                                                         |
| ------------------ | -------------------------------------------------------------------------- |
| ランタイムプロバイダー | `opencode-go`                                                              |
| 例のモデル         | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`  |

## 高度な設定

<AccordionGroup>
  <Accordion title="API キーエイリアス">
    `OPENCODE_ZEN_API_KEY` も `OPENCODE_API_KEY` のエイリアスとしてサポートされています。
  </Accordion>

  <Accordion title="共有認証情報">
    セットアップ中に 1 つの OpenCode キーを入力すると、両方のランタイム
    プロバイダー用の認証情報が保存されます。各カタログごとに個別にオンボーディングする必要はありません。
  </Accordion>

  <Accordion title="請求とダッシュボード">
    OpenCode にサインインし、請求情報を追加し、API キーをコピーします。請求
    とカタログの利用可否は OpenCode ダッシュボードから管理されます。
  </Accordion>

  <Accordion title="Gemini のリプレイ動作">
    Gemini ベースの OpenCode ref は proxy-Gemini パス上に留まるため、OpenClaw は
    ネイティブ Gemini の replay 検証や bootstrap 書き換えを有効にせず、そこで
    Gemini thought-signature サニタイズを維持します。
  </Accordion>

  <Accordion title="Non-Gemini のリプレイ動作">
    Non-Gemini の OpenCode ref は最小の OpenAI 互換 replay ポリシーを維持します。
  </Accordion>
</AccordionGroup>

<Tip>
セットアップ中に 1 つの OpenCode キーを入力すると、Zen と
Go の両方のランタイムプロバイダー用認証情報が保存されるため、オンボーディングは 1 回で済みます。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、failover 動作の選び方。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な config リファレンス。
  </Card>
</CardGroup>

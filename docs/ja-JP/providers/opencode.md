---
read_when:
    - OpenCode がホストするモデルアクセスを使用したい場合
    - Zen カタログと Go カタログのどちらかを選択したい場合
summary: OpenCode Zen と Go カタログを OpenClaw で使用する
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode は OpenClaw で 2 つのホスト型カタログを公開します。

| カタログ | プレフィックス    | ランタイムプロバイダー |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

どちらのカタログも同じ OpenCode API キーを使用します。OpenClaw は、アップストリームのモデル単位のルーティングが正しく保たれるようにランタイムプロバイダー ID を
分離していますが、オンボーディングとドキュメントでは
1 つの OpenCode セットアップとして扱います。

## はじめに

<Tabs>
  <Tab title="Zen カタログ">
    **最適な用途:** キュレートされた OpenCode マルチモデルプロキシ (Claude、GPT、Gemini、GLM)。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Zen モデルをデフォルトとして設定する">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
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

        または、キーを直接渡します。

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Go モデルをデフォルトとして設定する">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
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

## 設定例

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 組み込みカタログ

### Zen

| プロパティ       | 値                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------- |
| ランタイムプロバイダー | `opencode`                                                                                    |
| モデル例         | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| プロパティ       | 値                                                                       |
| ---------------- | ------------------------------------------------------------------------ |
| ランタイムプロバイダー | `opencode-go`                                                            |
| モデル例         | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 高度な設定

<AccordionGroup>
  <Accordion title="API キーのエイリアス">
    `OPENCODE_ZEN_API_KEY` は `OPENCODE_API_KEY` のエイリアスとしてもサポートされています。
  </Accordion>

  <Accordion title="共有認証情報">
    セットアップ中に 1 つの OpenCode キーを入力すると、両方のランタイム
    プロバイダーの認証情報が保存されます。各カタログを個別にオンボーディングする必要はありません。
  </Accordion>

  <Accordion title="請求とダッシュボード">
    OpenCode にサインインし、請求情報を追加して、API キーをコピーします。請求
    とカタログの可用性は OpenCode ダッシュボードから管理されます。
  </Accordion>

  <Accordion title="Gemini リプレイの動作">
    Gemini ベースの OpenCode ref はプロキシ Gemini パスに留まるため、OpenClaw は
    ネイティブ Gemini のリプレイ検証やブートストラップの書き換えを有効にすることなく、
    そこで Gemini の thought-signature サニタイズを維持します。
  </Accordion>

  <Accordion title="非 Gemini リプレイの動作">
    非 Gemini の OpenCode ref は、最小限の OpenAI 互換リプレイポリシーを維持します。
  </Accordion>
</AccordionGroup>

<Tip>
セットアップ中に 1 つの OpenCode キーを入力すると、Zen と
Go の両方のランタイムプロバイダーの認証情報が保存されるため、オンボーディングは一度だけで済みます。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル ref、フェイルオーバー動作の選択。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、プロバイダーの完全な設定リファレンス。
  </Card>
</CardGroup>

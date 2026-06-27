---
read_when:
    - OpenCode ホスト型モデルアクセスが必要です
    - Zen カタログと Go カタログのどちらを使うか選びたいです
summary: OpenClaw で OpenCode Zen と Go カタログを使う
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:57:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw では OpenCode は 2 つのホスト型カタログを公開しています。

| カタログ | プレフィックス            | ランタイム provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

どちらのカタログも同じ OpenCode API キーを使用します。OpenClaw は、上流のモデルごとのルーティングを正しく保つためにランタイム provider ID を分けていますが、オンボーディングとドキュメントでは 1 つの OpenCode セットアップとして扱います。

## はじめに

<Tabs>
  <Tab title="Zen catalog">
    **最適な用途:** 厳選された OpenCode マルチモデルプロキシ（Claude、GPT、Gemini）。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Zen モデルをデフォルトに設定">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **最適な用途:** OpenCode がホストする Kimi、GLM、MiniMax のラインアップ。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        または、キーを直接渡します。

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Go モデルをデフォルトに設定">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## config の例

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 組み込みカタログ

### Zen

| プロパティ         | 値                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| ランタイム provider | `opencode`                                                              |
| モデル例   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| プロパティ         | 値                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| ランタイム provider | `opencode-go`                                                            |
| モデル例   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## 高度な設定

<AccordionGroup>
  <Accordion title="API キーのエイリアス">
    `OPENCODE_ZEN_API_KEY` も `OPENCODE_API_KEY` のエイリアスとしてサポートされています。
  </Accordion>

  <Accordion title="共有認証情報">
    セットアップ時に 1 つの OpenCode キーを入力すると、両方のランタイム provider の認証情報が保存されます。各カタログを個別にオンボーディングする必要はありません。
  </Accordion>

  <Accordion title="課金とダッシュボード">
    OpenCode にサインインし、課金情報を追加して、API キーをコピーします。課金とカタログの利用可否は OpenCode ダッシュボードから管理します。
  </Accordion>

  <Accordion title="Gemini のリプレイ動作">
    Gemini ベースの OpenCode ref はプロキシ Gemini パスに留まるため、OpenClaw はそこで Gemini の思考シグネチャのサニタイズを維持しつつ、ネイティブ Gemini のリプレイ検証やブートストラップ書き換えは有効にしません。
  </Accordion>

  <Accordion title="非 Gemini のリプレイ動作">
    非 Gemini の OpenCode ref は最小限の OpenAI 互換リプレイポリシーを維持します。
  </Accordion>
</AccordionGroup>

<Tip>
セットアップ時に 1 つの OpenCode キーを入力すると、Zen と Go の両方のランタイム provider の認証情報が保存されるため、オンボーディングは 1 回だけで済みます。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、モデル ref、フェイルオーバー動作の選択。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    エージェント、モデル、provider の完全な config リファレンス。
  </Card>
</CardGroup>

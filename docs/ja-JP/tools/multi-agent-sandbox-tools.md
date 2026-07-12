---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: エージェントごとのサンドボックスとツールの制限、優先順位、例
title: マルチエージェントのサンドボックスとツール
x-i18n:
    generated_at: "2026-07-11T22:47:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

マルチエージェント構成では、各エージェントがグローバルなサンドボックスおよびツールポリシーを上書きできます。このページでは、エージェントごとの設定、優先順位ルール、例について説明します。

<CardGroup cols={3}>
  <Card title="サンドボックス化" href="/ja-JP/gateway/sandboxing">
    バックエンドとモード — サンドボックスの完全なリファレンス。
  </Card>
  <Card title="サンドボックス、ツールポリシー、昇格の違い" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated">
    「なぜこれがブロックされるのか？」をデバッグします。
  </Card>
  <Card title="昇格モード" href="/ja-JP/tools/elevated">
    信頼済み送信者向けの昇格された実行。
  </Card>
</CardGroup>

<Warning>
認証のスコープはエージェント単位です。各エージェントは、`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` に独自の `agentDir` 認証ストアを持ちます。複数のエージェントで `agentDir` を再利用しないでください。ローカルプロファイルがない場合、エージェントはデフォルト／メインエージェントの認証プロファイルを参照できますが、OAuth リフレッシュトークンはセカンダリエージェントのストアには複製されません。認証情報を手動でコピーする場合は、移植可能な静的 `api_key` または `token` プロファイルのみをコピーしてください。
</Warning>

---

## 設定例

<AccordionGroup>
  <Accordion title="例 1：個人用エージェントと制限付き家族用エージェント">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **結果：**

    - `main` エージェント：ホスト上で実行され、すべてのツールにアクセスできます。
    - `family` エージェント：Docker 内で実行され（エージェントごとに 1 コンテナ）、`read` と現在の会話へのメッセージ送信のみを使用できます。

  </Accordion>
  <Accordion title="例 2：共有サンドボックスを使用する仕事用エージェント">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="例 2b：グローバルなコーディングプロファイルとメッセージ専用エージェント">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **結果：**

    - デフォルトのエージェントにはコーディングツールが適用されます。
    - `support` エージェントはメッセージ専用です（Slack ツールを追加）。

  </Accordion>
  <Accordion title="例 3：エージェントごとに異なるサンドボックスモード">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## 設定の優先順位

グローバル設定（`agents.defaults.*`）とエージェント固有設定（`agents.list[].*`）の両方が存在する場合：

### サンドボックス設定

エージェント固有の設定がグローバル設定を上書きします。

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` は、そのエージェントについて `agents.defaults.sandbox.{docker,browser,prune}.*` を上書きします（サンドボックスのスコープが `"shared"` に解決される場合は無視されます）。
</Note>

### ツールの制限

フィルタリング順序は次のとおりです。

<Steps>
  <Step title="ツールプロファイル">
    `tools.profile` または `agents.list[].tools.profile`。
  </Step>
  <Step title="プロバイダーのツールプロファイル">
    `tools.byProvider[provider].profile` または `agents.list[].tools.byProvider[provider].profile`。
  </Step>
  <Step title="グローバルツールポリシー">
    `tools.allow` / `tools.deny`。
  </Step>
  <Step title="プロバイダーのツールポリシー">
    `tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="エージェント固有のツールポリシー">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="エージェントのプロバイダーポリシー">
    `agents.list[].tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="サンドボックスのツールポリシー">
    `tools.sandbox.tools` または `agents.list[].tools.sandbox.tools`。
  </Step>
  <Step title="サブエージェントのツールポリシー">
    該当する場合は `tools.subagents.tools`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="優先順位ルール">
    - 各レベルではツールをさらに制限できますが、以前のレベルで拒否されたツールを再び許可することはできません。
    - `agents.list[].tools.sandbox.tools` が設定されている場合、そのエージェントでは `tools.sandbox.tools` を置き換えます。
    - `agents.list[].tools.profile` が設定されている場合、そのエージェントでは `tools.profile` を上書きします。
    - プロバイダーのツールキーには、`provider`（例：`google-antigravity`）または `provider/model`（例：`openai/gpt-5.4`）を指定できます。

  </Accordion>
  <Accordion title="空の許可リストの動作">
    この連鎖内の明示的な許可リストによって呼び出し可能なツールが 1 つも残らない場合、OpenClaw はモデルへプロンプトを送信する前に停止します。これは意図された動作です。`agents.list[].tools.allow: ["query_db"]` のように存在しないツールを設定したエージェントは、`query_db` を登録する Plugin が有効になるまで明示的に失敗すべきであり、テキスト専用エージェントとして処理を続行すべきではありません。
  </Accordion>
</AccordionGroup>

ツールポリシーは、複数のツールへ展開される `group:*` の短縮表記をサポートします。完全な一覧については、[ツールグループ](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)を参照してください。

エージェントごとの昇格設定の上書き（`agents.list[].tools.elevated`）により、特定のエージェントに対する昇格された実行をさらに制限できます。詳細については、[昇格モード](/ja-JP/tools/elevated)を参照してください。

---

## 単一エージェントからの移行

<Tabs>
  <Tab title="移行前（単一エージェント）">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="移行後（マルチエージェント）">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
従来の `agents.defaults.*`／`agents.list[].*` 設定キー（`sandbox.perSession`、`agentRuntime`、`embeddedPi` など）は `openclaw doctor` によって移行されます。今後は `agents.defaults` + `agents.list` を使用してください。
</Note>

---

## ツール制限の例

<Tabs>
  <Tab title="読み取り専用エージェント">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="ファイルシステムツールを無効にしたシェル実行">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    このポリシーは OpenClaw のファイルシステムツールを無効にしますが、`exec` は引き続きシェルであり、選択されたホストまたはサンドボックスのファイルシステムで許可される任意の場所へファイルを書き込めます。読み取り専用エージェントにするには、`exec` と `process` を拒否するか、シェルアクセスと `agents.defaults.sandbox.workspaceAccess: "ro"` または `"none"` などのサンドボックスファイルシステム制御を組み合わせてください。
    </Warning>

  </Tab>
  <Tab title="通信専用">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    このプロファイルの `sessions_history` は、生のトランスクリプト全体ではなく、範囲が制限されサニタイズされた想起ビューを返します。アシスタントの想起では、秘匿化／切り詰めの前に、思考タグ、`<relevant-memories>` の足場、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および途中で切れたツール呼び出しブロックを含む）、劣化したツール呼び出しの足場、漏洩した ASCII／全角のモデル制御トークン、不正な形式の MiniMax ツール呼び出し XML が除去されます。

  </Tab>
</Tabs>

---

## よくある落とし穴：`"non-main"`

<Warning>
`agents.defaults.sandbox.mode: "non-main"` は、セッションキーをメインセッションキー（常に `"main"`。`session.mainKey` はユーザーが設定できず、他の値は OpenClaw が警告して無視します）と照合するものであり、エージェント ID と照合するものではありません。グループ／チャンネルセッションには常に独自のキーが割り当てられるため、非メインとして扱われ、サンドボックス化されます。エージェントを一切サンドボックス化しない場合は、`agents.list[].sandbox.mode: "off"` を設定してください。
</Warning>

---

## テスト

マルチエージェントのサンドボックスとツールを設定した後：

<Steps>
  <Step title="エージェントの解決結果を確認">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="サンドボックスコンテナを確認">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="ツール制限をテスト">
    - 制限対象のツールを必要とするメッセージを送信します。
    - エージェントが拒否されたツールを使用できないことを確認します。

  </Step>
  <Step title="ログを監視">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## トラブルシューティング

<AccordionGroup>
  <Accordion title="`mode: 'all'` にもかかわらずエージェントがサンドボックス化されない">
    - それを上書きするグローバルな `agents.defaults.sandbox.mode` が存在しないか確認します。
    - エージェント固有の設定が優先されるため、`agents.list[].sandbox.mode: "all"` を設定します。

  </Accordion>
  <Accordion title="拒否リストがあっても利用可能なツール">
    - [完全なフィルタリング順序](#tool-restrictions)を確認してください：プロファイル → プロバイダープロファイル → グローバルポリシー → プロバイダーポリシー → エージェントポリシー → エージェントプロバイダーポリシー → サンドボックス → サブエージェント。
    - 各レベルでは制限をさらに強化できるだけで、権限を再付与することはできません。
    - 段階的なデバッグ手順については、[サンドボックス、ツールポリシー、昇格の比較](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated)を参照してください。

  </Accordion>
  <Accordion title="エージェントごとにコンテナが分離されていない">
    - デフォルトの `scope` は `"agent"` です（エージェント ID ごとに 1 つのコンテナ）。
    - セッションごとに 1 つのコンテナを使用するには `scope: "session"` を設定し、複数のエージェントで 1 つのコンテナを再利用するには `scope: "shared"` を設定します。

  </Accordion>
</AccordionGroup>

---

## 関連項目

- [昇格モード](/ja-JP/tools/elevated)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [サンドボックス、ツールポリシー、昇格の比較](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜこれがブロックされるのか？」をデバッグ
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックスの完全なリファレンス（モード、スコープ、バックエンド、イメージ）
- [セッション管理](/ja-JP/concepts/session)

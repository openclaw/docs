---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: エージェントごとのサンドボックス + ツール制限、優先順位、および例
title: マルチエージェントのサンドボックスとツール
x-i18n:
    generated_at: "2026-04-26T11:42:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

マルチエージェント構成では、各エージェントがグローバルのサンドボックスおよびツールポリシーを上書きできます。このページでは、エージェントごとの設定、優先順位ルール、および例を説明します。

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/ja-JP/gateway/sandboxing">
    バックエンドとモード — 完全なサンドボックスリファレンス。
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated">
    「なぜこれがブロックされるのか？」をデバッグします。
  </Card>
  <Card title="Elevated mode" href="/ja-JP/tools/elevated">
    信頼された送信元向けの Elevated exec。
  </Card>
</CardGroup>

<Warning>
認証はエージェントごとです。各エージェントは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` にある自身の `agentDir` 認証ストアを読み込みます。認証情報はエージェント間で**共有されません**。`agentDir` を複数のエージェントで再利用しないでください。認証情報を共有したい場合は、`auth-profiles.json` を別のエージェントの `agentDir` にコピーしてください。
</Warning>

---

## 設定例

<AccordionGroup>
  <Accordion title="例 1: Personal + 制限付き family agent">
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
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
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

    **結果:**

    - `main` agent: ホスト上で実行、全ツールにアクセス可能。
    - `family` agent: Docker で実行（エージェントごとに 1 コンテナ）、`read` ツールのみ。

  </Accordion>
  <Accordion title="例 2: 共有サンドボックスを使う work agent">
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
  <Accordion title="例 2b: グローバル coding profile + messaging-only agent">
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

    **結果:**

    - デフォルトエージェントは coding tools を取得します。
    - `support` agent は messaging-only（+ Slack tool）です。

  </Accordion>
  <Accordion title="例 3: エージェントごとに異なるサンドボックスモード">
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

グローバル（`agents.defaults.*`）とエージェント固有（`agents.list[].*`）の設定が両方存在する場合:

### サンドボックス設定

エージェント固有の設定がグローバルを上書きします:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` は、そのエージェントについて `agents.defaults.sandbox.{docker,browser,prune}.*` を上書きします（サンドボックス scope が `"shared"` に解決される場合は無視されます）。
</Note>

### ツール制限

フィルタリング順序は次のとおりです:

<Steps>
  <Step title="ツールプロファイル">
    `tools.profile` または `agents.list[].tools.profile`。
  </Step>
  <Step title="provider ツールプロファイル">
    `tools.byProvider[provider].profile` または `agents.list[].tools.byProvider[provider].profile`。
  </Step>
  <Step title="グローバルツールポリシー">
    `tools.allow` / `tools.deny`。
  </Step>
  <Step title="provider ツールポリシー">
    `tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="エージェント固有のツールポリシー">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="エージェント provider ポリシー">
    `agents.list[].tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="サンドボックスツールポリシー">
    `tools.sandbox.tools` または `agents.list[].tools.sandbox.tools`。
  </Step>
  <Step title="サブエージェントツールポリシー">
    該当する場合は `tools.subagents.tools`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="優先順位ルール">
    - 各レベルでさらにツールを制限できますが、前のレベルで拒否されたツールを再び許可することはできません。
    - `agents.list[].tools.sandbox.tools` が設定されている場合、そのエージェントでは `tools.sandbox.tools` を置き換えます。
    - `agents.list[].tools.profile` が設定されている場合、そのエージェントでは `tools.profile` を上書きします。
    - provider ツールキーは、`provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.4`）のどちらも受け付けます。

  </Accordion>
  <Accordion title="空の allowlist の挙動">
    そのチェーン内の明示的な allowlist によって呼び出し可能なツールが 1 つも残らなくなった場合、OpenClaw はモデルに prompt を送信する前に停止します。これは意図的な動作です。たとえば `agents.list[].tools.allow: ["query_db"]` のように未登録ツールが設定されたエージェントは、`query_db` を登録する plugin が有効になるまで、テキスト専用エージェントとして継続するのではなく、明確に失敗するべきだからです。
  </Accordion>
</AccordionGroup>

ツールポリシーは、複数のツールに展開される `group:*` の短縮記法をサポートします。完全な一覧は [Tool groups](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) を参照してください。

エージェントごとの Elevated 上書き（`agents.list[].tools.elevated`）は、特定のエージェントに対する Elevated exec をさらに制限できます。詳細は [Elevated mode](/ja-JP/tools/elevated) を参照してください。

---

## 単一エージェントからの移行

<Tabs>
  <Tab title="Before（単一エージェント）">
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
  <Tab title="After（マルチエージェント）">
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
レガシーな `agent.*` 設定は `openclaw doctor` によって移行されます。今後は `agents.defaults` + `agents.list` を優先してください。
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
  <Tab title="安全な実行（ファイル変更なし）">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
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

    このプロファイルの `sessions_history` は、依然として生の transcript ダンプではなく、境界付きでサニタイズされたリコールビューを返します。アシスタントのリコールでは、thinking tags、`<relevant-memories>` の足場、プレーンテキストの tool-call XML payloads（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められた tool-call blocks を含む）、格下げされた tool-call scaffolding、漏洩した ASCII / 全角のモデル制御トークン、および不正な MiniMax tool-call XML が、redaction / truncation の前に取り除かれます。

  </Tab>
</Tabs>

---

## よくある落とし穴: 「non-main」

<Warning>
`agents.defaults.sandbox.mode: "non-main"` は、agent id ではなく `session.mainKey`（デフォルトは `"main"`）に基づきます。グループ / チャネルのセッションは常に独自のキーを持つため、non-main として扱われ、サンドボックス化されます。エージェントを絶対にサンドボックス化したくない場合は、`agents.list[].sandbox.mode: "off"` を設定してください。
</Warning>

---

## テスト

マルチエージェントのサンドボックスとツールを設定した後:

<Steps>
  <Step title="エージェント解決を確認">
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
    - 制限されたツールを必要とするメッセージを送信します。
    - エージェントが拒否されたツールを使えないことを確認します。

  </Step>
  <Step title="ログを監視">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## トラブルシューティング

<AccordionGroup>
  <Accordion title="`mode: 'all'` なのにエージェントがサンドボックス化されない">
    - それを上書きするグローバルな `agents.defaults.sandbox.mode` がないか確認してください。
    - エージェント固有の設定が優先されるため、`agents.list[].sandbox.mode: "all"` を設定してください。

  </Accordion>
  <Accordion title="deny list があるのにツールがまだ利用可能">
    - ツールのフィルタリング順序を確認してください: global → agent → sandbox → subagent。
    - 各レベルは、再許可ではなく追加制限のみ可能です。
    - ログ `[tools] filtering tools for agent:${agentId}` で確認してください。

  </Accordion>
  <Accordion title="コンテナがエージェントごとに分離されない">
    - エージェント固有のサンドボックス設定で `scope: "agent"` を設定してください。
    - デフォルトは `"session"` で、セッションごとに 1 つのコンテナを作成します。

  </Accordion>
</AccordionGroup>

---

## 関連

- [Elevated mode](/ja-JP/tools/elevated)
- [Multi-agent routing](/ja-JP/concepts/multi-agent)
- [Sandbox configuration](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜこれがブロックされるのか？」のデバッグ
- [Sandboxing](/ja-JP/gateway/sandboxing) — 完全なサンドボックスリファレンス（モード、scope、バックエンド、イメージ）
- [Session management](/ja-JP/concepts/session)

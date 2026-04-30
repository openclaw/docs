---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: エージェントごとのサンドボックスとツール制限、優先順位、例
title: マルチエージェントのサンドボックスとツール
x-i18n:
    generated_at: "2026-04-30T05:38:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

マルチエージェント構成の各エージェントは、グローバルなサンドボックスとツールポリシーを上書きできます。このページでは、エージェントごとの設定、優先順位ルール、例を説明します。

<CardGroup cols={3}>
  <Card title="サンドボックス化" href="/ja-JP/gateway/sandboxing">
    バックエンドとモード — サンドボックスの完全なリファレンス。
  </Card>
  <Card title="サンドボックス、ツールポリシー、昇格の違い" href="/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated">
    「なぜこれはブロックされるのか」をデバッグする。
  </Card>
  <Card title="昇格モード" href="/ja-JP/tools/elevated">
    信頼済み送信者向けの昇格 exec。
  </Card>
</CardGroup>

<Warning>
認証はエージェント単位でスコープされます。各エージェントには、`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` にある独自の `agentDir` 認証ストアがあります。エージェント間で `agentDir` を再利用しないでください。エージェントはローカルプロファイルがない場合、デフォルト/メインエージェントの認証プロファイルを読み取れますが、OAuth リフレッシュトークンはセカンダリエージェントのストアには複製されません。認証情報を手動でコピーする場合は、移植可能な静的 `api_key` または `token` プロファイルのみをコピーしてください。
</Warning>

---

## 設定例

<AccordionGroup>
  <Accordion title="例 1: 個人用 + 制限付きファミリーエージェント">
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

    - `main` エージェント: ホスト上で実行され、すべてのツールにアクセスできます。
    - `family` エージェント: Docker で実行され（エージェントごとに 1 コンテナ）、`read` ツールのみを使用できます。

  </Accordion>
  <Accordion title="例 2: 共有サンドボックスを使う仕事用エージェント">
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
  <Accordion title="例 2b: グローバルなコーディングプロファイル + メッセージ専用エージェント">
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

    - デフォルトのエージェントはコーディングツールを取得します。
    - `support` エージェントはメッセージ専用です（+ Slack ツール）。

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

グローバル設定（`agents.defaults.*`）とエージェント固有設定（`agents.list[].*`）の両方が存在する場合:

### サンドボックス設定

エージェント固有の設定はグローバル設定を上書きします。

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
`agents.list[].sandbox.{docker,browser,prune}.*` は、そのエージェントの `agents.defaults.sandbox.{docker,browser,prune}.*` を上書きします（サンドボックススコープが `"shared"` に解決される場合は無視されます）。
</Note>

### ツール制限

フィルタリング順序は次のとおりです。

<Steps>
  <Step title="ツールプロファイル">
    `tools.profile` または `agents.list[].tools.profile`。
  </Step>
  <Step title="プロバイダーツールプロファイル">
    `tools.byProvider[provider].profile` または `agents.list[].tools.byProvider[provider].profile`。
  </Step>
  <Step title="グローバルツールポリシー">
    `tools.allow` / `tools.deny`。
  </Step>
  <Step title="プロバイダーツールポリシー">
    `tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="エージェント固有ツールポリシー">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="エージェントプロバイダーポリシー">
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
    - 各レベルはツールをさらに制限できますが、前のレベルで拒否されたツールを再度許可することはできません。
    - `agents.list[].tools.sandbox.tools` が設定されている場合、そのエージェントでは `tools.sandbox.tools` を置き換えます。
    - `agents.list[].tools.profile` が設定されている場合、そのエージェントでは `tools.profile` を上書きします。
    - プロバイダーツールキーは、`provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.4`）のどちらも受け付けます。

  </Accordion>
  <Accordion title="空の許可リストの動作">
    そのチェーン内の明示的な許可リストのいずれかによって、実行で呼び出し可能なツールがなくなった場合、OpenClaw はプロンプトをモデルに送信する前に停止します。これは意図的です。`agents.list[].tools.allow: ["query_db"]` のように存在しないツールで設定されたエージェントは、`query_db` を登録する Plugin が有効になるまで明示的に失敗するべきであり、テキスト専用エージェントとして継続するべきではありません。
  </Accordion>
</AccordionGroup>

ツールポリシーは、複数のツールに展開される `group:*` 省略形をサポートします。完全な一覧は [ツールグループ](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) を参照してください。

エージェントごとの昇格上書き（`agents.list[].tools.elevated`）は、特定のエージェントの昇格 exec をさらに制限できます。詳細は [昇格モード](/ja-JP/tools/elevated) を参照してください。

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
従来の `agent.*` 設定は `openclaw doctor` によって移行されます。今後は `agents.defaults` + `agents.list` を優先してください。
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

    このプロファイルの `sessions_history` は、生のトランスクリプトダンプではなく、境界付きでサニタイズされたリコールビューを返します。アシスタントのリコールは、思考タグ、`<relevant-memories>` の足場、プレーンテキストのツール呼び出し XML ペイロード（`<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`、および切り詰められたツール呼び出しブロックを含む）、格下げされたツール呼び出しの足場、漏えいした ASCII/全角のモデル制御トークン、不正な MiniMax ツール呼び出し XML を、墨消し/切り詰めの前に取り除きます。

  </Tab>
</Tabs>

---

## よくある落とし穴: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` は、エージェント ID ではなく `session.mainKey`（デフォルトは `"main"`）に基づきます。グループ/チャンネルセッションは常に独自のキーを取得するため、非メインとして扱われ、サンドボックス化されます。エージェントを絶対にサンドボックス化したくない場合は、`agents.list[].sandbox.mode: "off"` を設定してください。
</Warning>

---

## テスト

マルチエージェントのサンドボックスとツールを設定した後:

<Steps>
  <Step title="エージェント解決を確認する">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="サンドボックスコンテナを検証する">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="ツール制限をテストする">
    - 制限対象ツールが必要なメッセージを送信します。
    - エージェントが拒否されたツールを使用できないことを確認します。

  </Step>
  <Step title="ログを監視する">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## トラブルシューティング

<AccordionGroup>
  <Accordion title="`mode: 'all'` でもエージェントがサンドボックス化されない">
    - それを上書きするグローバルな `agents.defaults.sandbox.mode` がないか確認します。
    - エージェント固有設定が優先されるため、`agents.list[].sandbox.mode: "all"` を設定します。

  </Accordion>
  <Accordion title="拒否リストがあるのにツールがまだ利用できる">
    - ツールのフィルタリング順序を確認します: グローバル → エージェント → サンドボックス → サブエージェント。
    - 各レベルはさらに制限することだけができ、再度許可することはできません。
    - ログで確認します: `[tools] filtering tools for agent:${agentId}`。

  </Accordion>
  <Accordion title="コンテナがエージェントごとに分離されていない">
    - エージェント固有のサンドボックス設定で `scope: "agent"` を設定します。
    - デフォルトは `"session"` で、セッションごとに 1 つのコンテナを作成します。

  </Accordion>
</AccordionGroup>

---

## 関連項目

- [昇格モード](/ja-JP/tools/elevated)
- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [サンドボックス設定](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [サンドボックス、ツールポリシー、昇格の違い](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) — 「なぜこれはブロックされるのか」のデバッグ
- [サンドボックス化](/ja-JP/gateway/sandboxing) — サンドボックスの完全なリファレンス（モード、スコープ、バックエンド、イメージ）
- [セッション管理](/ja-JP/concepts/session)

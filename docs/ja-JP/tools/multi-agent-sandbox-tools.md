---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: 「agentごとのsandboxとtool制限、優先順位、例」
title: マルチagentのsandboxとtools
x-i18n:
    generated_at: "2026-04-24T05:25:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# マルチAgentのsandboxとTools設定

マルチagent構成では、各agentがグローバルsandboxとtool
policyをoverrideできます。このページでは、agentごとの設定、優先順位ルール、例を扱います。

- **Sandbox backendとmode**: [Sandboxing](/ja-JP/gateway/sandboxing) を参照してください。
- **ブロックされたtoolのデバッグ**: [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) と `openclaw sandbox explain` を参照してください。
- **Elevated exec**: [Elevated Mode](/ja-JP/tools/elevated) を参照してください。

authはagentごとです。各agentは、自身の `agentDir` auth storeである
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` を読み取ります。
credentialは**agent間で共有されません**。`agentDir` をagent間で使い回さないでください。
credentialを共有したい場合は、`auth-profiles.json` を他方のagentの `agentDir` にコピーしてください。

---

## 設定例

### 例1: Personal + Restricted Family Agent

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

- `main` agent: host上で実行、full tool access
- `family` agent: Docker内で実行（agentごとに1 container）、`read` toolのみ

---

### 例2: Shared Sandboxを使うWork Agent

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

---

### 例2b: グローバルcoding profile + messaging-only agent

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

- デフォルトagentはcoding toolを取得
- `support` agentはmessaging-only（+ Slack tool）

---

### 例3: agentごとに異なるSandbox mode

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // グローバルデフォルト
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // override: mainはsandbox化しない
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // override: publicは常にsandbox化
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

---

## 設定の優先順位

グローバル（`agents.defaults.*`）とagent固有（`agents.list[].*`）のconfigが両方存在する場合:

### Sandbox config

agent固有の設定がグローバルをoverrideします:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**注記:**

- `agents.list[].sandbox.{docker,browser,prune}.*` は、そのagentについて `agents.defaults.sandbox.{docker,browser,prune}.*` をoverrideします（sandbox scopeが `"shared"` に解決される場合は無視されます）。

### Tool制限

filteringの順序は次のとおりです:

1. **Tool profile**（`tools.profile` または `agents.list[].tools.profile`）
2. **Provider tool profile**（`tools.byProvider[provider].profile` または `agents.list[].tools.byProvider[provider].profile`）
3. **グローバルtool policy**（`tools.allow` / `tools.deny`）
4. **Provider tool policy**（`tools.byProvider[provider].allow/deny`）
5. **agent固有のtool policy**（`agents.list[].tools.allow/deny`）
6. **agent provider policy**（`agents.list[].tools.byProvider[provider].allow/deny`）
7. **Sandbox tool policy**（`tools.sandbox.tools` または `agents.list[].tools.sandbox.tools`）
8. **Subagent tool policy**（該当する場合は `tools.subagents.tools`）

各levelはtoolをさらに制限できますが、以前のlevelでdenyされたtoolを復活させることはできません。
`agents.list[].tools.sandbox.tools` が設定されている場合、そのagentについては `tools.sandbox.tools` を置き換えます。
`agents.list[].tools.profile` が設定されている場合、そのagentについては `tools.profile` をoverrideします。
provider tool keyには、`provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.4`）のどちらも使えます。

tool policyは、複数toolへ展開される `group:*` shorthandをサポートします。完全な一覧は [Tool groups](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) を参照してください。

agentごとのelevated override（`agents.list[].tools.elevated`）は、特定agentのelevated execをさらに制限できます。詳細は [Elevated Mode](/ja-JP/tools/elevated) を参照してください。

---

## 単一Agentからの移行

**以前（単一agent）:**

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

**以後（異なるprofileを持つマルチagent）:**

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

レガシーの `agent.*` configは `openclaw doctor` によって移行されます。今後は `agents.defaults` + `agents.list` を優先してください。

---

## Tool制限の例

### Read-only Agent

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Safe Execution Agent（file変更なし）

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Communication-only Agent

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

このprofileの `sessions_history` は、raw transcript dumpではなく、boundedでsanitizedされたrecall
viewを返します。assistant recallは、thinking tag、
`<relevant-memories>` scaffolding、plain-text tool-call XML payload
（`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>`、および切り詰められたtool-call blockを含む）、
downgradedされたtool-call scaffolding、漏洩したASCII/full-width model control
token、そして不正なMiniMax tool-call XMLを、redaction/truncation前に除去します。

---

## よくある落とし穴: `non-main`

`agents.defaults.sandbox.mode: "non-main"` はagent idではなく、`session.mainKey`（デフォルト `"main"`）
に基づきます。
group/channel sessionは常に独自keyを持つため、
non-mainとして扱われ、sandbox化されます。あるagentを絶対にsandbox化したくない場合は、`agents.list[].sandbox.mode: "off"` を設定してください。

---

## テスト

マルチagentのsandboxとtoolsを設定した後:

1. **agent解決を確認する:**

   ```exec
   openclaw agents list --bindings
   ```

2. **sandbox containerを確認する:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **tool制限をテストする:**
   - 制限されたtoolを必要とするmessageを送る
   - agentがdenyされたtoolを使えないことを確認する

4. **logを監視する:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## トラブルシューティング

### `mode: "all"` なのにagentがsandbox化されない

- それをoverrideしているグローバルな `agents.defaults.sandbox.mode` がないか確認する
- agent固有configが優先されるので、`agents.list[].sandbox.mode: "all"` を設定する

### deny listがあるのにtoolがまだ利用可能

- tool filtering順序を確認する: global → agent → sandbox → subagent
- 各levelはさらに制限することしかできず、復活はできない
- logで確認する: `[tools] filtering tools for agent:${agentId}`

### Containerがagentごとに分離されていない

- agent固有のsandbox configで `scope: "agent"` を設定する
- デフォルトは `"session"` で、sessionごとに1 containerを作成する

---

## 関連

- [Sandboxing](/ja-JP/gateway/sandboxing) -- 完全なsandboxリファレンス（mode、scope、backend、image）
- [Sandbox vs Tool Policy vs Elevated](/ja-JP/gateway/sandbox-vs-tool-policy-vs-elevated) -- 「なぜこれがブロックされるのか？」をデバッグする
- [Elevated Mode](/ja-JP/tools/elevated)
- [Multi-Agent Routing](/ja-JP/concepts/multi-agent)
- [Sandbox Configuration](/ja-JP/gateway/config-agents#agentsdefaultssandbox)
- [Session Management](/ja-JP/concepts/session)

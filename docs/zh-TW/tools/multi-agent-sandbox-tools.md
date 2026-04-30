---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 每個代理的沙盒與工具限制、優先順序和範例
title: 多代理沙盒與工具
x-i18n:
    generated_at: "2026-04-30T03:46:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

多代理設定中的每個代理都可以覆寫全域沙盒與工具政策。本頁涵蓋每個代理的設定、優先順序規則與範例。

<CardGroup cols={3}>
  <Card title="沙盒化" href="/zh-TW/gateway/sandboxing">
    後端與模式 — 完整沙盒參考。
  </Card>
  <Card title="沙盒 vs 工具政策 vs 提升權限" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated">
    偵錯「為什麼這被封鎖？」
  </Card>
  <Card title="提升模式" href="/zh-TW/tools/elevated">
    受信任傳送者的提升權限 exec。
  </Card>
</CardGroup>

<Warning>
驗證依代理限定範圍：每個代理都有自己的 `agentDir` 驗證儲存區，位於 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`。絕不要在多個代理之間重複使用 `agentDir`。當代理沒有本機設定檔時，可以讀取預設/主要代理的驗證設定檔，但 OAuth 重新整理權杖不會複製到次要代理儲存區。如果你手動複製憑證，只複製可攜式靜態 `api_key` 或 `token` 設定檔。
</Warning>

---

## 設定範例

<AccordionGroup>
  <Accordion title="範例 1：個人 + 受限制的家庭代理">
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

    **結果：**

    - `main` 代理：在主機上執行，具備完整工具存取權。
    - `family` 代理：在 Docker 中執行（每個代理一個容器），僅有 `read` 工具。

  </Accordion>
  <Accordion title="範例 2：使用共用沙盒的工作代理">
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
  <Accordion title="範例 2b：全域程式碼設定檔 + 僅限訊息的代理">
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

    - 預設代理取得程式碼工具。
    - `support` 代理僅限訊息（+ Slack 工具）。

  </Accordion>
  <Accordion title="範例 3：每個代理使用不同沙盒模式">
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

## 設定優先順序

當全域（`agents.defaults.*`）與代理特定（`agents.list[].*`）設定同時存在時：

### 沙盒設定

代理特定設定會覆寫全域設定：

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
`agents.list[].sandbox.{docker,browser,prune}.*` 會針對該代理覆寫 `agents.defaults.sandbox.{docker,browser,prune}.*`（當沙盒範圍解析為 `"shared"` 時忽略）。
</Note>

### 工具限制

篩選順序如下：

<Steps>
  <Step title="工具設定檔">
    `tools.profile` 或 `agents.list[].tools.profile`。
  </Step>
  <Step title="提供者工具設定檔">
    `tools.byProvider[provider].profile` 或 `agents.list[].tools.byProvider[provider].profile`。
  </Step>
  <Step title="全域工具政策">
    `tools.allow` / `tools.deny`。
  </Step>
  <Step title="提供者工具政策">
    `tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="代理特定工具政策">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="代理提供者政策">
    `agents.list[].tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="沙盒工具政策">
    `tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`。
  </Step>
  <Step title="子代理工具政策">
    `tools.subagents.tools`，如果適用。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="優先順序規則">
    - 每一層都可以進一步限制工具，但不能重新授予先前層級已拒絕的工具。
    - 如果設定了 `agents.list[].tools.sandbox.tools`，它會取代該代理的 `tools.sandbox.tools`。
    - 如果設定了 `agents.list[].tools.profile`，它會覆寫該代理的 `tools.profile`。
    - 提供者工具鍵可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

  </Accordion>
  <Accordion title="空白允許清單行為">
    如果該鏈中的任何明確允許清單讓執行沒有可呼叫的工具，OpenClaw 會在將提示提交給模型之前停止。這是刻意設計的：設定了缺失工具（例如 `agents.list[].tools.allow: ["query_db"]`）的代理應該明確失敗，直到註冊 `query_db` 的 Plugin 啟用為止，而不是繼續作為純文字代理執行。
  </Accordion>
</AccordionGroup>

工具政策支援 `group:*` 簡寫，可展開為多個工具。完整清單請參閱[工具群組](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

每代理提升權限覆寫（`agents.list[].tools.elevated`）可以進一步限制特定代理的提升權限 exec。詳情請參閱[提升模式](/zh-TW/tools/elevated)。

---

## 從單一代理遷移

<Tabs>
  <Tab title="之前（單一代理）">
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
  <Tab title="之後（多代理）">
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
舊版 `agent.*` 設定會由 `openclaw doctor` 遷移；未來建議使用 `agents.defaults` + `agents.list`。
</Note>

---

## 工具限制範例

<Tabs>
  <Tab title="唯讀代理">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="安全執行（不修改檔案）">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="僅限通訊">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    此設定檔中的 `sessions_history` 仍會回傳有界限且已清理的回憶檢視，而不是原始逐字稿傾印。助理回憶會在修訂/截斷之前移除思考標籤、`<relevant-memories>` 鷹架、純文字工具呼叫 XML 承載（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和截斷的工具呼叫區塊）、降級的工具呼叫鷹架、外洩的 ASCII/全形模型控制權杖，以及格式錯誤的 MiniMax 工具呼叫 XML。

  </Tab>
</Tabs>

---

## 常見陷阱：「non-main」

<Warning>
`agents.defaults.sandbox.mode: "non-main"` 是以 `session.mainKey`（預設 `"main"`）為基準，而不是代理 ID。群組/頻道工作階段一律會取得自己的鍵，因此會被視為非主要並套用沙盒。如果你希望某個代理永遠不要使用沙盒，請設定 `agents.list[].sandbox.mode: "off"`。
</Warning>

---

## 測試

設定多代理沙盒與工具之後：

<Steps>
  <Step title="檢查代理解析">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="驗證沙盒容器">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="測試工具限制">
    - 傳送需要受限工具的訊息。
    - 驗證代理無法使用被拒絕的工具。

  </Step>
  <Step title="監控記錄">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## 疑難排解

<AccordionGroup>
  <Accordion title="儘管 `mode: 'all'`，代理仍未套用沙盒">
    - 檢查是否有全域 `agents.defaults.sandbox.mode` 覆寫它。
    - 代理特定設定具有優先權，因此請設定 `agents.list[].sandbox.mode: "all"`。

  </Accordion>
  <Accordion title="即使有拒絕清單，工具仍可用">
    - 檢查工具篩選順序：全域 → 代理 → 沙盒 → 子代理。
    - 每一層都只能進一步限制，不能重新授予。
    - 使用記錄驗證：`[tools] filtering tools for agent:${agentId}`。

  </Accordion>
  <Accordion title="容器未依代理隔離">
    - 在代理特定沙盒設定中設定 `scope: "agent"`。
    - 預設為 `"session"`，會為每個工作階段建立一個容器。

  </Accordion>
</AccordionGroup>

---

## 相關

- [提升模式](/zh-TW/tools/elevated)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [沙盒設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- [沙盒 vs 工具政策 vs 提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) — 偵錯「為什麼這被封鎖？」
- [沙盒化](/zh-TW/gateway/sandboxing) — 完整沙盒參考（模式、範圍、後端、映像檔）
- [工作階段管理](/zh-TW/concepts/session)

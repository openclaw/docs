---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 每個代理的沙盒與工具限制、優先順序和範例
title: 多代理沙箱與工具
x-i18n:
    generated_at: "2026-05-10T19:53:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

每個多代理設定中的代理都可以覆寫全域沙箱與工具政策。本頁說明每個代理的設定、優先順序規則與範例。

<CardGroup cols={3}>
  <Card title="沙箱化" href="/zh-TW/gateway/sandboxing">
    後端與模式 — 完整沙箱參考。
  </Card>
  <Card title="沙箱與工具政策與提升權限" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated">
    偵錯「為什麼這被封鎖？」
  </Card>
  <Card title="提升權限模式" href="/zh-TW/tools/elevated">
    供受信任傳送者使用的提升權限 exec。
  </Card>
</CardGroup>

<Warning>
驗證依代理設定範圍：每個代理在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 都有自己的 `agentDir` 驗證儲存區。絕對不要在代理之間重複使用 `agentDir`。代理在沒有本機設定檔時，可以讀取預設/主要代理的驗證設定檔，但 OAuth 重新整理權杖不會複製到次要代理儲存區。如果你手動複製憑證，請只複製可攜式靜態 `api_key` 或 `token` 設定檔。
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
  <Accordion title="範例 2：使用共享沙箱的工作代理">
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
  <Accordion title="範例 2b：全域編碼設定檔 + 僅限訊息的代理">
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

    - 預設代理取得編碼工具。
    - `support` 代理僅限訊息（+ Slack 工具）。

  </Accordion>
  <Accordion title="範例 3：每個代理使用不同沙箱模式">
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

當全域（`agents.defaults.*`）與代理專屬（`agents.list[].*`）設定同時存在時：

### 沙箱設定

代理專屬設定會覆寫全域設定：

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
`agents.list[].sandbox.{docker,browser,prune}.*` 會為該代理覆寫 `agents.defaults.sandbox.{docker,browser,prune}.*`（當沙箱範圍解析為 `"shared"` 時忽略）。
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
  <Step title="代理專屬工具政策">
    `agents.list[].tools.allow/deny`。
  </Step>
  <Step title="代理提供者政策">
    `agents.list[].tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="沙箱工具政策">
    `tools.sandbox.tools` 或 `agents.list[].tools.sandbox.tools`。
  </Step>
  <Step title="子代理工具政策">
    `tools.subagents.tools`，如適用。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="優先順序規則">
    - 每一層都可以進一步限制工具，但無法重新授予前面層級已拒絕的工具。
    - 如果設定了 `agents.list[].tools.sandbox.tools`，它會取代該代理的 `tools.sandbox.tools`。
    - 如果設定了 `agents.list[].tools.profile`，它會覆寫該代理的 `tools.profile`。
    - 提供者工具鍵接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

  </Accordion>
  <Accordion title="空白允許清單行為">
    如果該鏈中的任何明確允許清單讓此次執行沒有可呼叫工具，OpenClaw 會在將提示送交模型前停止。這是刻意設計的：若代理設定了缺少的工具，例如 `agents.list[].tools.allow: ["query_db"]`，就應該明確失敗，直到註冊 `query_db` 的 Plugin 啟用為止，而不是繼續作為純文字代理。
  </Accordion>
</AccordionGroup>

工具政策支援 `group:*` 簡寫，可展開為多個工具。完整清單請參閱[工具群組](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

每個代理的提升權限覆寫（`agents.list[].tools.elevated`）可以進一步限制特定代理的提升權限 exec。詳細資訊請參閱[提升權限模式](/zh-TW/tools/elevated)。

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
舊版 `agent.*` 設定會由 `openclaw doctor` 遷移；往後請優先使用 `agents.defaults` + `agents.list`。
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
  <Tab title="停用檔案系統工具的 Shell 執行">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    此政策會停用 OpenClaw 檔案系統工具，但 `exec` 仍是 Shell，且可以在所選主機或沙箱檔案系統允許的任何位置寫入檔案。若要設定唯讀代理，請拒絕 `exec` 和 `process`，或將 Shell 存取與沙箱檔案系統控制結合，例如 `agents.defaults.sandbox.workspaceAccess: "ro"` 或 `"none"`。
    </Warning>

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

    此設定檔中的 `sessions_history` 仍會傳回有界且經清理的回憶檢視，而不是原始逐字稿傾印。助理回憶會在遮罩/截斷前移除思考標籤、`<relevant-memories>` 腳手架、純文字工具呼叫 XML 酬載（包含 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及被截斷的工具呼叫區塊）、降級的工具呼叫腳手架、洩漏的 ASCII/全形模型控制權杖，以及格式不正確的 MiniMax 工具呼叫 XML。

  </Tab>
</Tabs>

---

## 常見陷阱：「non-main」

<Warning>
`agents.defaults.sandbox.mode: "non-main"` 是基於 `session.mainKey`（預設為 `"main"`），而不是代理 ID。群組/頻道工作階段一律取得自己的鍵，因此會被視為非主要並進入沙箱。如果你希望某個代理永遠不要進入沙箱，請設定 `agents.list[].sandbox.mode: "off"`。
</Warning>

---

## 測試

設定多代理沙箱與工具後：

<Steps>
  <Step title="檢查代理解析">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="驗證沙箱容器">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="測試工具限制">
    - 傳送需要受限制工具的訊息。
    - 確認代理無法使用遭拒絕的工具。

  </Step>
  <Step title="監控日誌">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## 疑難排解

<AccordionGroup>
  <Accordion title="儘管 `mode: 'all'`，代理仍未進入沙箱">
    - 檢查是否有全域 `agents.defaults.sandbox.mode` 覆寫它。
    - 代理專屬設定優先，因此請設定 `agents.list[].sandbox.mode: "all"`。

  </Accordion>
  <Accordion title="儘管有拒絕清單，工具仍可使用">
    - 檢查工具篩選順序：全域 → 代理 → 沙箱 → 子代理。
    - 每一層都只能進一步限制，不能重新授予。
    - 使用日誌驗證：`[tools] filtering tools for agent:${agentId}`。

  </Accordion>
  <Accordion title="容器未依代理隔離">
    - 在代理專屬沙箱設定中設定 `scope: "agent"`。
    - 預設為 `"session"`，會為每個工作階段建立一個容器。

  </Accordion>
</AccordionGroup>

---

## 相關

- [提權模式](/zh-TW/tools/elevated)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [沙盒設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- [沙盒、工具政策與提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) — 偵錯「為什麼這被封鎖？」
- [沙盒化](/zh-TW/gateway/sandboxing) — 完整沙盒參考（模式、範圍、後端、映像）
- [工作階段管理](/zh-TW/concepts/session)

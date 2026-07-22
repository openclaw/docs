---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: 每個代理程式的沙箱與工具限制、優先順序及範例
title: 多代理沙箱與工具
x-i18n:
    generated_at: "2026-07-22T10:48:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0e07d07c30b844be1e1d93db62fcdaab72c47a5248367559642a959bf09ad193
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

多代理設定中的每個代理都可以覆寫全域沙箱與工具政策。本頁說明各代理的設定、優先順序規則與範例。

<CardGroup cols={3}>
  <Card title="沙箱機制" href="/zh-TW/gateway/sandboxing">
    後端與模式 — 完整的沙箱參考資料。
  </Card>
  <Card title="沙箱、工具政策與提升權限的比較" href="/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated">
    偵錯「為什麼這會被封鎖？」
  </Card>
  <Card title="提升權限模式" href="/zh-TW/tools/elevated">
    供受信任傳送者使用的提升權限執行功能。
  </Card>
</CardGroup>

<Warning>
驗證依代理劃分範圍：每個代理在 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` 中都有自己的 `agentDir` 驗證儲存區。絕不可跨代理重複使用 `agentDir`。代理沒有本機設定檔時，可以讀取預設／主要代理的驗證設定檔，但 OAuth 重新整理權杖不會複製到次要代理的儲存區。如果手動複製認證資訊，請只複製可攜式的靜態 `api_key` 或 `token` 設定檔。
</Warning>

---

## 設定範例

<AccordionGroup>
  <Accordion title="範例 1：個人代理 + 受限的家庭代理">
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

    - `main` 代理：在主機上執行，擁有完整工具存取權。
    - `family` 代理：在 Docker 中執行（每個代理一個容器），只能使用 `read`，以及傳送目前對話的訊息。

  </Accordion>
  <Accordion title="範例 2：使用共用沙箱的工作代理">
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
  <Accordion title="範例 2b：全域程式設計設定檔 + 僅限訊息功能的代理">
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

    - 預設代理會取得程式設計工具。
    - `support` 代理僅能使用訊息功能（另加 Slack 工具）。

  </Accordion>
  <Accordion title="範例 3：各代理使用不同的沙箱模式">
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

當全域設定（`agents.defaults.*`）與代理專屬設定（`agents.entries.*.*`）同時存在時：

### 沙箱設定

代理專屬設定會覆寫全域設定：

```text
agents.entries.*.sandbox.mode > agents.defaults.sandbox.mode
agents.entries.*.sandbox.scope > agents.defaults.sandbox.scope
agents.entries.*.sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.entries.*.sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.entries.*.sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.entries.*.sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.entries.*.sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
對該代理而言，`agents.entries.*.sandbox.{docker,browser,prune}.*` 會覆寫 `agents.defaults.sandbox.{docker,browser,prune}.*`（當沙箱範圍解析為 `"shared"` 時則忽略）。
</Note>

### 工具限制

篩選順序如下：

<Steps>
  <Step title="工具設定檔">
    `tools.profile` 或 `agents.entries.*.tools.profile`。
  </Step>
  <Step title="提供者工具設定檔">
    `tools.byProvider[provider].profile` 或 `agents.entries.*.tools.byProvider[provider].profile`。
  </Step>
  <Step title="全域工具政策">
    `tools.allow` / `tools.deny`。
  </Step>
  <Step title="提供者工具政策">
    `tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="代理專屬工具政策">
    `agents.entries.*.tools.allow/deny`。
  </Step>
  <Step title="代理提供者政策">
    `agents.entries.*.tools.byProvider[provider].allow/deny`。
  </Step>
  <Step title="沙箱工具政策">
    `tools.sandbox.tools` 或 `agents.entries.*.tools.sandbox.tools`。
  </Step>
  <Step title="子代理工具政策">
    `tools.subagents.tools`（如適用）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="優先順序規則">
    - 每個層級都可以進一步限制工具，但無法重新授予先前層級已拒絕的工具。
    - 如果已設定 `agents.entries.*.tools.sandbox.tools`，它會取代該代理的 `tools.sandbox.tools`。
    - 如果已設定 `agents.entries.*.tools.profile`，它會覆寫該代理的 `tools.profile`。
    - 提供者工具鍵可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

  </Accordion>
  <Accordion title="空白允許清單的行為">
    如果該鏈中的任何明確允許清單導致執行時沒有可呼叫的工具，OpenClaw 會在將提示提交給模型前停止。這是刻意設計的行為：若代理設定了缺少的工具（例如 `agents.entries.*.tools.allow: ["query_db"]`），就應明確失敗，直到啟用註冊 `query_db` 的外掛為止，而不是繼續作為純文字代理執行。
  </Accordion>
</AccordionGroup>

工具政策支援會展開為多個工具的 `group:*` 簡寫。完整清單請參閱[工具群組](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands)。

各代理的提升權限覆寫（`agents.entries.*.tools.elevated`）可以進一步限制特定代理的提升權限執行功能。詳細資訊請參閱[提升權限模式](/zh-TW/tools/elevated)。

---

## 從單一代理遷移

<Tabs>
  <Tab title="遷移前（單一代理）">
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
  <Tab title="遷移後（多代理）">
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
舊版 `agents.defaults.*`/`agents.entries.*.*` 設定鍵（例如 `sandbox.perSession`、`agentRuntime`、`embeddedPi`）會由 `openclaw doctor` 遷移；日後請優先使用 `agents.defaults` + `agents.entries`。
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
    此政策會停用 OpenClaw 檔案系統工具，但 `exec` 仍是 Shell，可在所選主機或沙箱檔案系統允許的任何位置寫入檔案。若要設定唯讀代理，請拒絕 `exec` 與 `process`，或將 Shell 存取權與 `agents.defaults.sandbox.workspaceAccess: "ro"` 或 `"none"` 等沙箱檔案系統控制措施搭配使用。
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

    此設定檔中的 `sessions_history` 仍會傳回有界且經過清理的回憶檢視，而不是原始逐字稿傾印。助理回憶會在遮蔽／截斷前移除思考標籤、`<relevant-memories>` 鷹架、純文字工具呼叫 XML 承載資料（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 與截斷的工具呼叫區塊）、降級的工具呼叫鷹架、外洩的 ASCII／全形模型控制權杖，以及格式錯誤的 MiniMax 工具呼叫 XML。

  </Tab>
</Tabs>

---

## 常見陷阱："non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` 會比對工作階段鍵與主要工作階段鍵（固定為 `"main"`；`session.mainKey` 無法由使用者設定，OpenClaw 會警告並忽略任何其他值），而不是代理 ID。群組／頻道工作階段一律有自己的鍵，因此會被視為非主要工作階段並套用沙箱。若要讓代理永不使用沙箱，請設定 `agents.entries.*.sandbox.mode: "off"`。
</Warning>

---

## 測試

設定多代理沙箱與工具後：

<Steps>
  <Step title="檢查代理解析結果">
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
    - 傳送需要受限工具的訊息。
    - 確認代理無法使用遭拒絕的工具。

  </Step>
  <Step title="監控日誌">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## 疑難排解

<AccordionGroup>
  <Accordion title="儘管設定了 `mode: 'all'`，代理仍未套用沙箱">
    - 檢查是否有全域 `agents.defaults.sandbox.mode` 覆寫了此設定。
    - 代理專屬設定具有較高優先順序，因此請設定 `agents.entries.*.sandbox.mode: "all"`。

  </Accordion>
  <Accordion title="即使有拒絕清單仍可使用的工具">
    - 請檢查[完整篩選順序](#tool-restrictions)：設定檔 → 提供者設定檔 → 全域原則 → 提供者原則 → 代理程式原則 → 代理程式提供者原則 → 沙箱 → 子代理程式。
    - 每一層只能進一步限制，不能重新授予權限。
    - 如需逐步偵錯，請參閱[沙箱、工具原則與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)。

  </Accordion>
  <Accordion title="容器未依代理程式隔離">
    - 預設 `scope` 為 `"agent"`（每個代理程式 ID 使用一個容器）。
    - 設定 `scope: "session"` 可讓每個工作階段使用一個容器，或設定 `scope: "shared"` 以讓多個代理程式共用一個容器。

  </Accordion>
</AccordionGroup>

---

## 相關內容

- [提升權限模式](/zh-TW/tools/elevated)
- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [沙箱設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- [沙箱、工具原則與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) — 偵錯「為什麼會被封鎖？」
- [沙箱隔離](/zh-TW/gateway/sandboxing) — 完整的沙箱參考資料（模式、範圍、後端、映像檔）
- [工作階段管理](/zh-TW/concepts/session)

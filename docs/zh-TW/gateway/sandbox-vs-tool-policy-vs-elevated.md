---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 工具為何遭封鎖：沙箱執行階段、工具允許／拒絕政策，以及提升權限的執行閘門
title: 沙箱、工具政策與提升權限的差異
x-i18n:
    generated_at: "2026-07-12T14:35:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw 有三種彼此相關但不同的控制方式：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）決定**工具在哪裡執行**（沙箱後端或主機）。
2. **工具政策**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）決定**哪些工具可用／獲准使用**。
3. **提升權限**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是**僅限 exec 的逃生機制**，可在沙箱化時於沙箱外執行（預設為 `gateway`；若 exec 目標設定為 `node`，則為 `node`）。

## 快速偵錯

使用檢查器查看 OpenClaw _實際_正在執行的行為：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它會輸出：

- 有效的沙箱模式／範圍／工作區存取權
- 工作階段目前是否已沙箱化（主要與非主要）
- 有效的沙箱工具允許／拒絕設定（以及其來源是代理程式、全域或預設設定）
- 提升權限閘門與修正用設定鍵路徑

## 沙箱：工具在哪裡執行

沙箱化由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有項目都在主機上執行。
- `"non-main"`：只有非主要工作階段會沙箱化（群組／頻道常見的「意外」情況）。
- `"all"`：所有項目都會沙箱化。

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可查看的內容：`"none"`、`"ro"` 或 `"rw"`。

如需完整對照表（範圍、工作區掛載、映像檔），請參閱[沙箱化](/zh-TW/gateway/sandboxing)。

### 繫結掛載（安全性快速檢查）

- `docker.binds` 會_穿透_沙箱檔案系統：你掛載的任何內容都會以所設定的模式（`:ro` 或 `:rw`）顯示於容器內。
- 若省略模式，預設為讀寫；原始碼／機密資料建議使用 `:ro`。
- `scope: "shared"` 會忽略各代理程式的繫結（僅套用全域繫結）。
- OpenClaw 會驗證繫結來源兩次：先驗證正規化後的來源路徑，再透過最深層的既有祖先解析後重新驗證。透過符號連結父目錄逸出，無法繞過封鎖路徑或允許根目錄的檢查。
- 不存在的葉節點路徑仍會受到安全檢查。若 `/workspace/alias-out/new-file` 透過符號連結父目錄解析至封鎖路徑，或設定的允許根目錄之外，該繫結會遭到拒絕。
- 繫結 `/var/run/docker.sock` 實際上等同將主機控制權交給沙箱；僅應在有意如此操作時使用。
- 工作區存取權（`workspaceAccess`）與繫結模式彼此獨立。

## 工具政策：哪些工具存在／可呼叫

有兩個層級需要注意：

- **工具設定檔**：`tools.profile` 和 `agents.list[].tools.profile`（基礎允許清單）
- **提供者工具設定檔**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全域／各代理程式工具政策**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供者工具政策**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具政策**（僅在沙箱化時套用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

經驗法則：

- `deny` 一律優先。
- 若 `allow` 非空，其他所有項目均視為已封鎖。
- 工具政策是不可跨越的限制：`/exec` 無法覆寫遭拒絕的 `exec` 工具。
- 工具政策會依名稱篩選工具的可用性；它不會檢查 `exec` 內部的副作用。若允許 `exec`，拒絕 `write`、`edit` 或 `apply_patch` 並不會讓 Shell 命令變成唯讀。
- `/exec` 只會變更已授權傳送者的工作階段預設值；它不會授予工具存取權。
- 提供者工具鍵可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。
- 當工具政策步驟移除工具，或沙箱工具政策封鎖呼叫時，閘道日誌會包含 `agents/tool-policy` 稽核項目。使用 `openclaw logs` 查看規則標籤、設定鍵和受影響的工具名稱。

### 工具群組（簡寫）

工具政策（全域、代理程式、沙箱）支援可展開為多個工具的 `group:*` 項目：

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

可用群組：

| 群組               | 工具                                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（接受 `bash` 作為 `exec` 的別名）                                                                                      |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`                                    |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                              |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                      |
| `group:ui`         | `browser`、`canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                        |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`                                                                   |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                       |
| `group:openclaw`   | 大多數內建 OpenClaw 工具（不含 `read`/`write`/`edit`/`apply_patch`/`exec`/`process` 檔案系統與執行階段基本工具、`canvas`，以及供應商外掛） |
| `group:plugins`    | 所有已載入且由外掛擁有的工具，包括透過 `bundle-mcp` 公開的已設定 MCP 伺服器                                                               |

對於唯讀代理程式，除非沙箱檔案系統政策或獨立的主機邊界會強制執行唯讀限制，否則除了可變更檔案系統的工具外，也應拒絕 `group:runtime`。

對於在沙箱中執行的 MCP 伺服器，沙箱工具政策是第二道允許閘門。如果已設定 `mcp.servers`，但沙箱化回合只顯示內建工具，請將 `bundle-mcp`、`group:plugins`，或帶有伺服器前綴的 MCP 工具名稱／glob（例如 `outlook__send_mail` 或 `outlook__*`）新增至 `tools.sandbox.tools.alsoAllow`，然後重新啟動／重新載入閘道並重新擷取工具清單。伺服器 glob 使用供應商安全的 MCP 伺服器前綴：非 `[A-Za-z0-9_-]` 字元會變成 `-`，不是以字母開頭的名稱會加上 `mcp-` 前綴，而過長或重複的前綴可能會被截短或加上後綴。

`openclaw doctor` 目前會針對 `mcp.servers` 中由 OpenClaw 管理的伺服器檢查此結構。從隨附外掛資訊清單或 Claude `.mcp.json` 載入的 MCP 伺服器會使用相同的沙箱閘門，但此診斷目前尚未列舉這些來源；如果其工具在沙箱化回合中消失，請使用相同的允許清單項目。

## 提升權限：僅限 exec 的「在主機上執行」

提升權限**不會**授予額外工具；它只會影響 `exec`。

- 如果你位於沙箱中，`/elevated on`（或使用 `elevated: true` 的 `exec`）會在沙箱外執行（可能仍需核准）。
- 使用 `/elevated full` 可略過該工作階段的 exec 核准。
- 如果你已經直接執行，提升權限實際上不會產生作用（仍受閘門限制）。
- 提升權限**不會**限定於 Skills，也**不會**覆寫工具的允許／拒絕設定。
- 提升權限不會從 `host=auto` 授予任意的跨主機覆寫能力；它會遵循一般的 exec 目標規則，且只有在設定／工作階段目標已經是 `node` 時才會保留 `node`。
- `/exec` 與提升權限無關。它只會為已授權的傳送者調整每個工作階段的 exec 預設值。

閘門：

- 啟用：`tools.elevated.enabled`（以及選用的 `agents.list[].tools.elevated.enabled`）
- 傳送者允許清單：`tools.elevated.allowFrom.<provider>`（以及選用的 `agents.list[].tools.elevated.allowFrom.<provider>`）

請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 常見的「沙箱牢籠」修正方式

### 「工具 X 被沙箱工具政策封鎖」

修正設定鍵（擇一）：

- 停用沙箱：`agents.defaults.sandbox.mode=off`（或每個代理程式的 `agents.list[].sandbox.mode=off`）
- 在沙箱內允許該工具：
  - 將它從 `tools.sandbox.tools.deny`（或每個代理程式的 `agents.list[].tools.sandbox.tools.deny`）中移除
  - 或將它新增至 `tools.sandbox.tools.allow`（或每個代理程式的允許清單）
- 檢查 `openclaw logs` 中的 `agents/tool-policy` 項目。它會記錄沙箱模式，以及工具是被允許規則還是拒絕規則封鎖。

### 「我以為這是主要工作階段，為什麼它在沙箱中？」

在 `"non-main"` 模式下，群組／頻道鍵_不是_主要工作階段。請使用主要工作階段鍵（由 `sandbox explain` 顯示），或將模式切換為 `"off"`。

## 相關內容

- [沙箱化](/zh-TW/gateway/sandboxing) -- 完整的沙箱參考資料（模式、範圍、後端、映像檔）
- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個代理程式的覆寫與優先順序
- [提升權限模式](/zh-TW/tools/elevated)

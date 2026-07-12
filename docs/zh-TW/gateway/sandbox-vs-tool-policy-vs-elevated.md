---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 工具為何遭到封鎖：沙箱執行環境、工具允許／拒絕政策，以及提升權限的執行閘門
title: 沙箱、工具政策與提升權限的比較
x-i18n:
    generated_at: "2026-07-11T21:24:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw 有三種彼此相關但不同的控制機制：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）決定**工具在哪裡執行**（沙箱後端或主機）。
2. **工具政策**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）決定**哪些工具可用／允許使用**。
3. **提升權限**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是**僅限 `exec` 的逃生機制**，可在處於沙箱中時於沙箱外執行（預設為 `gateway`；若 `exec` 目標設定為 `node`，則為 `node`）。

## 快速偵錯

使用檢查器查看 OpenClaw _實際_執行的行為：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它會顯示：

- 實際生效的沙箱模式／範圍／工作區存取權限
- 工作階段目前是否處於沙箱中（主要與非主要）
- 實際生效的沙箱工具允許／拒絕設定（以及其來源是代理程式／全域／預設設定）
- 提升權限閘門與修正用設定鍵路徑

## 沙箱：工具在哪裡執行

沙箱由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有項目都在主機上執行。
- `"non-main"`：只有非主要工作階段會在沙箱中執行（群組／頻道常見的「意外」情況）。
- `"all"`：所有項目都在沙箱中執行。

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可以看到的內容：`"none"`、`"ro"` 或 `"rw"`。

如需完整矩陣（範圍、工作區掛載、映像檔），請參閱[沙箱機制](/zh-TW/gateway/sandboxing)。

### 繫結掛載（快速安全檢查）

- `docker.binds` 會_穿透_沙箱檔案系統：掛載的任何內容，都會依您設定的模式（`:ro` 或 `:rw`）在容器內可見。
- 如果省略模式，預設為可讀寫；對原始碼／秘密資訊建議使用 `:ro`。
- `scope: "shared"` 會忽略各代理程式的繫結（只套用全域繫結）。
- OpenClaw 會驗證繫結來源兩次：先驗證正規化後的來源路徑，再透過最深層的現有祖先解析後重新驗證。透過符號連結父目錄逸出，無法繞過封鎖路徑或允許根目錄檢查。
- 不存在的葉節點路徑仍會安全地受到檢查。如果 `/workspace/alias-out/new-file` 透過符號連結父目錄解析至封鎖路徑或已設定允許根目錄之外，繫結就會遭到拒絕。
- 繫結 `/var/run/docker.sock` 實際上等同將主機控制權交給沙箱；僅應有意為之。
- 工作區存取權限（`workspaceAccess`）與繫結模式彼此獨立。

## 工具政策：哪些工具存在／可呼叫

有多個層級會產生影響：

- **工具設定檔**：`tools.profile` 和 `agents.list[].tools.profile`（基本允許清單）
- **供應商工具設定檔**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全域／各代理程式工具政策**：`tools.allow`／`tools.deny` 和 `agents.list[].tools.allow`／`agents.list[].tools.deny`
- **供應商工具政策**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具政策**（僅在沙箱中套用）：`tools.sandbox.tools.allow`／`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

經驗法則：

- `deny` 一律優先。
- 如果 `allow` 非空，其他所有項目都會視為遭到封鎖。
- 工具政策是最終限制：`/exec` 無法覆寫遭拒絕的 `exec` 工具。
- 工具政策依名稱篩選工具可用性；不會檢查 `exec` 內部的副作用。如果允許 `exec`，拒絕 `write`、`edit` 或 `apply_patch` 並不會使 Shell 命令變成唯讀。
- `/exec` 只會變更已授權傳送者的工作階段預設值；不會授予工具存取權。
- 供應商工具鍵可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。
- 當工具政策步驟移除工具，或沙箱工具政策封鎖呼叫時，閘道記錄會包含 `agents/tool-policy` 稽核項目。使用 `openclaw logs` 查看規則標籤、設定鍵和受影響的工具名稱。

### 工具群組（簡寫）

工具政策（全域、代理程式、沙箱）支援可展開成多個工具的 `group:*` 項目：

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
| `group:openclaw`   | 大多數內建 OpenClaw 工具（不包括 `read`／`write`／`edit`／`apply_patch`／`exec`／`process` 檔案系統與執行階段基礎工具、`canvas`，以及供應商外掛） |
| `group:plugins`    | 所有已載入且由外掛擁有的工具，包括透過 `bundle-mcp` 公開的已設定 MCP 伺服器                                                                                |

對於唯讀代理程式，除非沙箱檔案系統政策或獨立的主機邊界會強制執行唯讀限制，否則除了會修改檔案系統的工具，也應拒絕 `group:runtime`。

對於沙箱中的 MCP 伺服器，沙箱工具政策是第二道允許閘門。如果已設定 `mcp.servers`，但沙箱中的回合只顯示內建工具，請將 `bundle-mcp`、`group:plugins`，或帶有伺服器前綴的 MCP 工具名稱／Glob（例如 `outlook__send_mail` 或 `outlook__*`）加入 `tools.sandbox.tools.alsoAllow`，然後重新啟動／重新載入閘道並重新擷取工具清單。伺服器 Glob 使用符合供應商安全規範的 MCP 伺服器前綴：非 `[A-Za-z0-9_-]` 字元會變成 `-`，名稱若不是以字母開頭則會加上 `mcp-` 前綴，而過長或重複的前綴可能會遭截斷或加上後綴。

`openclaw doctor` 目前會針對 `mcp.servers` 中由 OpenClaw 管理的伺服器檢查此結構。從隨附外掛資訊清單或 Claude `.mcp.json` 載入的 MCP 伺服器使用相同的沙箱閘門，但此診斷目前尚未列舉這些來源；如果其工具在沙箱回合中消失，請使用相同的允許清單項目。

## 提升權限：僅限 `exec` 的「在主機上執行」

提升權限**不會**授予額外工具；它只會影響 `exec`。

- 如果您處於沙箱中，`/elevated on`（或設定了 `elevated: true` 的 `exec`）會在沙箱外執行（仍可能需要核准）。
- 使用 `/elevated full` 可略過該工作階段的 `exec` 核准。
- 如果您已直接執行，提升權限實際上不會產生任何作用（仍受閘門限制）。
- 提升權限**不受** Skills 範圍限制，也**不會**覆寫工具允許／拒絕設定。
- 提升權限不會從 `host=auto` 授予任意的跨主機覆寫；它會遵循一般 `exec` 目標規則，且只有在已設定／工作階段目標原本就是 `node` 時才會保留 `node`。
- `/exec` 與提升權限彼此獨立。它只會調整已授權傳送者的各工作階段 `exec` 預設值。

閘門：

- 啟用設定：`tools.elevated.enabled`（以及選用的 `agents.list[].tools.elevated.enabled`）
- 傳送者允許清單：`tools.elevated.allowFrom.<provider>`（以及選用的 `agents.list[].tools.elevated.allowFrom.<provider>`）

請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 常見「受困於沙箱」問題的修正方式

### 「工具 X 遭沙箱工具政策封鎖」

修正用設定鍵（擇一）：

- 停用沙箱：`agents.defaults.sandbox.mode=off`（或各代理程式的 `agents.list[].sandbox.mode=off`）
- 允許在沙箱內使用該工具：
  - 從 `tools.sandbox.tools.deny` 移除（或各代理程式的 `agents.list[].tools.sandbox.tools.deny`）
  - 或加入 `tools.sandbox.tools.allow`（或各代理程式的允許清單）
- 檢查 `openclaw logs` 中的 `agents/tool-policy` 項目。該項目會記錄沙箱模式，以及是允許規則還是拒絕規則封鎖了工具。

### 「我以為這是主要工作階段，為什麼它在沙箱中？」

在 `"non-main"` 模式下，群組／頻道鍵_不是_主要工作階段。請使用主要工作階段鍵（由 `sandbox explain` 顯示），或將模式切換為 `"off"`。

## 相關內容

- [沙箱機制](/zh-TW/gateway/sandboxing) -- 完整沙箱參考資料（模式、範圍、後端、映像檔）
- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 各代理程式覆寫與優先順序
- [提升權限模式](/zh-TW/tools/elevated)

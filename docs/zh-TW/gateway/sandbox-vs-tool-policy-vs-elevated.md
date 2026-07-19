---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 工具遭封鎖的原因：沙箱執行環境、工具允許／拒絕政策，以及提升權限的執行閘門
title: 沙箱與工具政策及提升權限的比較
x-i18n:
    generated_at: "2026-07-19T13:44:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 572157b184c48f0ac7f97d3151726f8975b16306261c7209c39c2fdd344efef9
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw 有三種相關但不同的控制機制：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）決定**工具在哪裡執行**（沙箱後端或主機）。
2. **工具政策**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）決定**哪些工具可用／允許使用**。
3. **提升權限**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是**僅限 exec 的逃生機制**，讓你在沙箱化時於沙箱外執行（預設為 `gateway`，或在 exec 目標設定為 `node` 時使用 `node`）。

## 快速偵錯

使用檢查器查看 OpenClaw _實際上_ 在做什麼：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它會顯示：

- 有效的沙箱模式／範圍／工作區存取權限
- 工作階段目前是否已沙箱化（主要與非主要）
- 有效的沙箱工具允許／拒絕設定（以及其來源為代理程式／全域／預設）
- 提升權限閘門與修正用設定鍵路徑

## 沙箱：工具在哪裡執行

沙箱化由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有項目都在主機上執行。
- `"non-main"`：只有非主要工作階段會沙箱化（群組／頻道常見的「意外」行為）。
- `"all"`：所有項目都會沙箱化。

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可以看到的內容：`"none"`、`"ro"` 或 `"rw"`。

完整矩陣（範圍、工作區掛載、映像）請參閱[沙箱化](/zh-TW/gateway/sandboxing)。

### 繫結掛載（快速安全檢查）

- `docker.binds` 會_穿透_沙箱檔案系統：無論掛載什麼，都會以你設定的模式（`:ro` 或 `:rw`）顯示在容器內。
- 若省略模式，預設為可讀寫；原始碼／祕密資料建議使用 `:ro`。
- `scope: "shared"` 會忽略各代理程式的繫結（僅套用全域繫結）。
- OpenClaw 會驗證繫結來源兩次：先驗證正規化後的來源路徑，再沿最深層的現有祖先解析後重新驗證。透過符號連結父目錄逸出，無法規避封鎖路徑或允許根目錄的檢查。
- 不存在的末端路徑仍會受到安全檢查。若 `/workspace/alias-out/new-file` 透過符號連結父目錄解析至封鎖路徑，或設定的允許根目錄之外，該繫結會遭拒絕。
- 繫結 `/var/run/docker.sock` 實際上等同將主機控制權交給沙箱；只有在確實有意如此操作時才這麼做。
- 工作區存取權限（`workspaceAccess`）與繫結模式彼此獨立。

如需包含多個主機資料夾、存取模式及外部來源安全選擇加入設定的各代理程式組態，請參閱[單一代理程式使用多個資料夾](/zh-TW/gateway/sandboxing#multiple-folders-for-one-agent)。

## 工具政策：哪些工具存在／可呼叫

有兩個重要層級：

- **工具設定檔**：`tools.profile` 和 `agents.list[].tools.profile`（基礎允許清單）
- **供應商工具設定檔**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全域／各代理程式工具政策**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **供應商工具政策**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具政策**（僅在沙箱化時套用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

經驗法則：

- `deny` 一律優先。
- 若 `allow` 非空，其他所有項目都會視為遭封鎖。
- 工具政策是硬性限制：`/exec` 無法覆寫遭拒絕的 `exec` 工具。
- 工具政策會依名稱篩選工具可用性；不會檢查 `exec` 內的副作用。若允許 `exec`，拒絕 `write`、`edit` 或 `apply_patch` 並不會讓 shell 命令變成唯讀。
- `/exec` 只會變更已授權傳送者的工作階段預設值；不會授予工具存取權限。
- 供應商工具鍵可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。
- 當工具政策步驟移除工具，或沙箱工具政策封鎖呼叫時，閘道記錄會包含 `agents/tool-policy` 稽核項目。使用 `openclaw logs` 查看規則標籤、設定鍵及受影響的工具名稱。

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

| 群組               | 工具                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` 可作為 `exec` 的別名）                                                                                                                                                                        |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`、`sessions_list`、`sessions_history`、`sessions_search`、`conversations_list`、`conversations_send`、`conversations_turn`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`、`spawn_task`、`dismiss_task` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`、`screen`、`terminal`、`canvas`、`show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`ask_user`、`skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                                                                                                                   |
| `group:openclaw`   | 大多數內建 OpenClaw 工具（不含 `read`/`write`/`edit`/`apply_patch`/`exec`/`process` 檔案系統與執行階段原始工具、`canvas`，以及供應商外掛）                                                                                             |
| `group:plugins`    | 所有已載入且由外掛擁有的工具，包括透過 `bundle-mcp` 公開的已設定 MCP 伺服器                                                                                                                                                           |

對於唯讀代理程式，除非沙箱檔案系統政策或個別主機邊界會強制執行唯讀限制，否則除了可變更檔案系統的工具外，也應拒絕 `group:runtime`。

對於沙箱化的 MCP 伺服器，沙箱工具政策是第二道允許閘門。若已設定 `mcp.servers`，但沙箱化回合只顯示內建工具，請將 `bundle-mcp`、`group:plugins`，或以伺服器為前綴的 MCP 工具名稱／glob（例如 `outlook__send_mail` 或 `outlook__*`）新增至 `tools.sandbox.tools.alsoAllow`，然後重新啟動／重新載入閘道並重新擷取工具清單。伺服器 glob 使用供應商安全的 MCP 伺服器前綴：非 `[A-Za-z0-9_-]` 字元會變成 `-`，名稱若不以字母開頭，會加上 `mcp-` 前綴，而過長或重複的前綴可能會被截短或加上後綴。

`openclaw doctor` 目前會檢查 `mcp.servers` 中 OpenClaw 管理之伺服器的這種形狀。從隨附外掛資訊清單或 Claude `.mcp.json` 載入的 MCP 伺服器使用相同的沙箱閘門，但此診斷目前尚未列舉這些來源；若其工具在沙箱化回合中消失，請使用相同的允許清單項目。

## 提升權限：僅限 exec 的「在主機上執行」

提升權限**不會**授予額外工具；它只會影響 `exec`。

- 若你處於沙箱中，`/elevated on`（或搭配 `elevated: true` 的 `exec`）會在沙箱外執行（可能仍需核准）。
- 使用 `/elevated full` 可略過該工作階段的 exec 核准。
- 若你已經直接執行，提升權限實際上不會產生作用（仍受閘門限制）。
- 提升權限**不會**限定於 Skill，也**不會**覆寫工具允許／拒絕設定。
- 提升權限不會從 `host=auto` 授予任意跨主機覆寫權限；它會遵循一般 exec 目標規則，且只有在設定／工作階段目標已經是 `node` 時，才會保留 `node`。
- `/exec` 與提升權限互相獨立。它只會調整已授權傳送者的各工作階段 exec 預設值。

閘門：

- 啟用設定：`tools.elevated.enabled`（以及選用的 `agents.list[].tools.elevated.enabled`）
- 傳送者允許清單：`tools.elevated.allowFrom.<provider>`（以及選用的 `agents.list[].tools.elevated.allowFrom.<provider>`）

請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 常見的「沙箱監牢」修正方式

### 「工具 X 遭沙箱工具政策封鎖」

修正用設定鍵（擇一）：

- 停用沙箱：`agents.defaults.sandbox.mode=off`（或各代理程式的 `agents.list[].sandbox.mode=off`）
- 允許在沙箱內使用此工具：
  - 將其從 `tools.sandbox.tools.deny`（或各代理程式的 `agents.list[].tools.sandbox.tools.deny`）中移除
  - 或將其加入 `tools.sandbox.tools.allow`（或各代理程式的允許清單）
- 檢查 `openclaw logs` 中的 `agents/tool-policy` 項目。它會記錄沙箱模式，以及工具是否遭允許或拒絕規則封鎖。

### “我以為這是主工作階段，為什麼會在沙箱中？”

在 `"non-main"` 模式下，群組／頻道金鑰並_不是_主工作階段。請使用主工作階段金鑰（由 `sandbox explain` 顯示），或將模式切換為 `"off"`。

## 相關內容

- [沙箱機制](/zh-TW/gateway/sandboxing) -- 完整的沙箱參考資料（模式、範圍、後端、映像檔）
- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 各代理程式的覆寫設定與優先順序
- [提升權限模式](/zh-TW/tools/elevated)

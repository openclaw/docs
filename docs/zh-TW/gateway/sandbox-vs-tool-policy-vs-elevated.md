---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 工具為何被封鎖：沙盒執行階段、工具允許/拒絕政策，以及提升權限的 exec 閘門
title: 沙盒、工具政策與提升權限
x-i18n:
    generated_at: "2026-07-05T11:21:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4b5263d956c9ff5ef148383a78feb7483f7d4ea23c31d62cc994ac2d85d0d150
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw 有三個相關但不同的控制項：

1. **沙盒**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）決定**工具在哪裡執行**（沙盒後端或主機）。
2. **工具政策**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）決定**哪些工具可用/允許使用**。
3. **提權**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是**僅限 `exec` 的逃生出口**，可在你處於沙盒中時於沙盒外執行（預設為 `gateway`，或在 exec 目標設定為 `node` 時為 `node`）。

## 快速除錯

使用檢查器查看 OpenClaw _實際上_ 正在做什麼：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它會印出：

- 有效的沙盒模式/範圍/工作區存取權
- 工作階段目前是否在沙盒中（main 與 non-main）
- 有效的沙盒工具允許/拒絕（以及它來自代理程式/全域/預設）
- 提權閘門與修正提示鍵路徑

## 沙盒：工具在哪裡執行

沙盒由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有內容都在主機上執行。
- `"non-main"`：只有非 main 工作階段會被沙盒化（群組/頻道常見的「意外」）。
- `"all"`：所有內容都會被沙盒化。

`agents.defaults.sandbox.workspaceAccess` 控制沙盒可看到的內容：`"none"`、`"ro"` 或 `"rw"`。

完整矩陣（範圍、工作區掛載、映像檔）請參閱[沙盒化](/zh-TW/gateway/sandboxing)。

### 繫結掛載（安全性快速檢查）

- `docker.binds` 會_穿透_沙盒檔案系統：你掛載的任何內容都會以你設定的模式（`:ro` 或 `:rw`）在容器內可見。
- 如果省略模式，預設為讀寫；來源/機密建議使用 `:ro`。
- `scope: "shared"` 會忽略每個代理程式的繫結（只套用全域繫結）。
- OpenClaw 會驗證繫結來源兩次：第一次驗證正規化後的來源路徑，第二次在透過最深層的既有祖先解析後再次驗證。符號連結父層逃逸無法繞過封鎖路徑或允許根目錄檢查。
- 不存在的葉節點路徑也會安全檢查。如果 `/workspace/alias-out/new-file` 透過符號連結父層解析到封鎖路徑，或位於設定的允許根目錄之外，該繫結會被拒絕。
- 繫結 `/var/run/docker.sock` 實際上會把主機控制權交給沙盒；只有在你明確有意這麼做時才使用。
- 工作區存取權（`workspaceAccess`）與繫結模式彼此獨立。

## 工具政策：哪些工具存在/可呼叫

有兩層很重要：

- **工具設定檔**：`tools.profile` 和 `agents.list[].tools.profile`（基礎允許清單）
- **提供者工具設定檔**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全域/每代理程式工具政策**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供者工具政策**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙盒工具政策**（僅在沙盒化時套用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

經驗法則：

- `deny` 永遠優先。
- 如果 `allow` 非空，其他所有內容都會被視為封鎖。
- 工具政策是硬性停止點：`/exec` 無法覆寫遭拒絕的 `exec` 工具。
- 工具政策會依名稱篩選工具可用性；它不會檢查 `exec` 內部的副作用。如果允許 `exec`，拒絕 `write`、`edit` 或 `apply_patch` 並不會讓 shell 命令變成唯讀。
- `/exec` 只會為授權傳送者變更工作階段預設值；它不會授予工具存取權。
- 提供者工具鍵接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。
- 當工具政策步驟移除工具，或沙盒工具政策封鎖呼叫時，閘道記錄會包含 `agents/tool-policy` 稽核項目。使用 `openclaw logs` 查看規則標籤、設定鍵和受影響的工具名稱。

### 工具群組（縮寫）

工具政策（全域、代理程式、沙盒）支援 `group:*` 項目，會展開成多個工具：

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
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` 可作為 `exec` 的別名）                                                                                         |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                     |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`                                    |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                              |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                      |
| `group:ui`         | `browser`、`canvas`                                                                                                                                        |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                     |
| `group:messaging`  | `message`                                                                                                                                                  |
| `group:nodes`      | `nodes`                                                                                                                                                    |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`                                                                    |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                        |
| `group:openclaw`   | 大多數內建 OpenClaw 工具（不包含 `read`/`write`/`edit`/`apply_patch`/`exec`/`process` 檔案系統與執行階段原語、`canvas`，以及提供者外掛）                    |
| `group:plugins`    | 所有已載入且由外掛擁有的工具，包括透過 `bundle-mcp` 暴露的已設定 MCP 伺服器                                                                               |

對於唯讀代理程式，除非沙盒檔案系統政策或個別主機邊界會強制執行唯讀限制，否則請拒絕 `group:runtime` 以及會變更檔案系統的工具。

對於沙盒化的 MCP 伺服器，沙盒工具政策是第二道允許閘門。如果已設定 `mcp.servers`，但沙盒化回合只顯示內建工具，請將 `bundle-mcp`、`group:plugins`，或伺服器前綴的 MCP 工具名稱/glob（例如 `outlook__send_mail` 或 `outlook__*`）加入 `tools.sandbox.tools.alsoAllow`，然後重新啟動/重新載入閘道並重新擷取工具清單。伺服器 glob 使用提供者安全的 MCP 伺服器前綴：非 `[A-Za-z0-9_-]` 字元會變成 `-`，不是以字母開頭的名稱會加上 `mcp-` 前綴，過長或重複的前綴可能會被截斷或加上後綴。

`openclaw doctor` 目前會針對 `mcp.servers` 中由 OpenClaw 管理的伺服器檢查此形狀。從 bundled plugin manifest 或 Claude `.mcp.json` 載入的 MCP 伺服器也使用相同的沙盒閘門，但此診斷尚未列舉那些來源；如果它們的工具在沙盒化回合中消失，請使用相同的允許清單項目。

## 提權：僅限 exec 的「在主機上執行」

提權**不會**授予額外工具；它只影響 `exec`。

- 如果你在沙盒中，`/elevated on`（或帶有 `elevated: true` 的 `exec`）會在沙盒外執行（核准仍可能套用）。
- 使用 `/elevated full` 可略過該工作階段的 exec 核准。
- 如果你已經直接執行，提權實際上不會產生效果（仍受閘門限制）。
- 提權**不是**以 Skills 為範圍，且**不會**覆寫工具允許/拒絕。
- 提權不會從 `host=auto` 授予任意跨主機覆寫；它遵循一般 exec 目標規則，並且只有在已設定/工作階段目標已經是 `node` 時才保留 `node`。
- `/exec` 與提權分開。它只會為授權傳送者調整每工作階段的 exec 預設值。

閘門：

- 啟用：`tools.elevated.enabled`（以及選用的 `agents.list[].tools.elevated.enabled`）
- 傳送者允許清單：`tools.elevated.allowFrom.<provider>`（以及選用的 `agents.list[].tools.elevated.allowFrom.<provider>`）

請參閱[提權模式](/zh-TW/tools/elevated)。

## 常見「沙盒牢籠」修正

### 「工具 X 被沙盒工具政策封鎖」

修正提示鍵（擇一）：

- 停用沙盒：`agents.defaults.sandbox.mode=off`（或每代理程式 `agents.list[].sandbox.mode=off`）
- 允許工具在沙盒內使用：
  - 從 `tools.sandbox.tools.deny` 移除它（或每代理程式 `agents.list[].tools.sandbox.tools.deny`）
  - 或將它加入 `tools.sandbox.tools.allow`（或每代理程式允許清單）
- 檢查 `openclaw logs` 中的 `agents/tool-policy` 項目。它會記錄沙盒模式，以及封鎖該工具的是允許規則還是拒絕規則。

### 「我以為這是 main，為什麼它被沙盒化？」

在 `"non-main"` 模式中，群組/頻道鍵_不是_ main。請使用 main 工作階段鍵（由 `sandbox explain` 顯示），或將模式切換為 `"off"`。

## 相關

- [沙盒化](/zh-TW/gateway/sandboxing) -- 完整沙盒參考（模式、範圍、後端、映像檔）
- [多代理程式沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每代理程式覆寫與優先順序
- [提權模式](/zh-TW/tools/elevated)

---
read_when:
    - 設定以 ACP 為基礎的 IDE 整合
    - 偵錯 ACP 工作階段到 Gateway 的路由
summary: 執行 ACP 橋接器以支援 IDE 整合
title: ACP
x-i18n:
    generated_at: "2026-04-30T02:50:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 16
---

執行與 OpenClaw Gateway 通訊的 [代理程式用戶端通訊協定 (ACP)](https://agentclientprotocol.com/) 橋接器。

此命令會透過 stdio 為 IDE 使用 ACP，並透過 WebSocket 將提示轉送至 Gateway。它會讓 ACP 工作階段對應到 Gateway 工作階段金鑰。

`openclaw acp` 是由 Gateway 支援的 ACP 橋接器，不是完整的 ACP 原生編輯器執行階段。它專注於工作階段路由、提示傳遞，以及基本串流更新。

如果你想讓外部 MCP 用戶端直接與 OpenClaw 頻道對話通訊，而不是代管 ACP harness 工作階段，請改用 [`openclaw mcp serve`](/zh-TW/cli/mcp)。

## 這不是什麼

此頁面經常與 ACP harness 工作階段混淆。

`openclaw acp` 表示：

- OpenClaw 會作為 ACP 伺服器
- IDE 或 ACP 用戶端會連線到 OpenClaw
- OpenClaw 會將該工作轉送到 Gateway 工作階段

這不同於 [ACP 代理程式](/zh-TW/tools/acp-agents)，在後者中，OpenClaw 會透過 `acpx` 執行外部 harness，例如 Codex 或 Claude Code。

快速規則：

- 編輯器/用戶端想要以 ACP 與 OpenClaw 通訊：使用 `openclaw acp`
- OpenClaw 應以 ACP harness 啟動 Codex/Claude/Gemini：使用 `/acp spawn` 和 [ACP 代理程式](/zh-TW/tools/acp-agents)

## 相容性矩陣

| ACP 範圍                                                              | 狀態      | 備註                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 已實作 | 透過 stdio 到 Gateway chat/send + abort 的核心橋接流程。                                                                                                                                                                                        |
| `listSessions`, 斜線命令                                        | 已實作 | 工作階段清單會對照 Gateway 工作階段狀態運作；命令會透過 `available_commands_update` 公告。                                                                                                                                       |
| `loadSession`                                                         | 部分支援     | 會將 ACP 工作階段重新繫結到 Gateway 工作階段金鑰，並重放已儲存的使用者/助理文字歷史紀錄。工具/系統歷史紀錄尚未重建。                                                                                                   |
| 提示內容（`text`、內嵌 `resource`、圖片）                  | 部分支援     | 文字/資源會扁平化為聊天輸入；圖片會變成 Gateway 附件。                                                                                                                                                                 |
| 工作階段模式                                                         | 部分支援     | 支援 `session/set_mode`，且橋接器會公開初始的 Gateway 支援工作階段控制項，用於思考層級、工具詳細程度、推理、用量明細，以及提升權限動作。更廣泛的 ACP 原生模式/設定介面仍不在範圍內。 |
| 工作階段資訊與用量更新                                        | 部分支援     | 橋接器會從快取的 Gateway 工作階段快照發出 `session_info_update` 和盡力而為的 `usage_update` 通知。用量為近似值，且只有在 Gateway 將 Token 總量標記為最新時才會傳送。                                        |
| 工具串流                                                        | 部分支援     | 當 Gateway 工具引數/結果公開相關資訊時，`tool_call` / `tool_call_update` 事件會包含原始 I/O、文字內容，以及盡力而為的檔案位置。內嵌終端機和更豐富的差異原生輸出仍未公開。                        |
| 每個工作階段的 MCP 伺服器（`mcpServers`）                                | 不支援 | 橋接模式會拒絕每個工作階段的 MCP 伺服器請求。請改在 OpenClaw gateway 或代理程式上設定 MCP。                                                                                                                                     |
| 用戶端檔案系統方法（`fs/read_text_file`, `fs/write_text_file`） | 不支援 | 橋接器不會呼叫 ACP 用戶端檔案系統方法。                                                                                                                                                                                          |
| 用戶端終端機方法（`terminal/*`）                                | 不支援 | 橋接器不會建立 ACP 用戶端終端機，也不會透過工具呼叫串流終端機 ID。                                                                                                                                                       |
| 工作階段計畫 / 思考串流                                     | 不支援 | 橋接器目前會發出輸出文字與工具狀態，而不是 ACP 計畫或思考更新。                                                                                                                                                         |

## 已知限制

- `loadSession` 會重放已儲存的使用者與助理文字歷史紀錄，但不會重建歷史工具呼叫、系統通知，或更豐富的 ACP 原生事件類型。
- 如果多個 ACP 用戶端共用同一個 Gateway 工作階段金鑰，事件與取消路由會是盡力而為，而不是嚴格依用戶端隔離。當你需要乾淨的編輯器本機回合時，請偏好預設隔離的 `acp:<uuid>` 工作階段。
- Gateway 停止狀態會轉譯為 ACP 停止原因，但該對應的表達能力不如完整的 ACP 原生執行階段。
- 初始工作階段控制項目前會公開一組聚焦的 Gateway 旋鈕：思考層級、工具詳細程度、推理、用量明細，以及提升權限動作。模型選擇與 exec 主機控制尚未公開為 ACP 設定選項。
- `session_info_update` 和 `usage_update` 來自 Gateway 工作階段快照，而不是即時 ACP 原生執行階段計量。用量為近似值，不包含成本資料，且只有在 Gateway 將總 Token 資料標記為最新時才會發出。
- 工具跟隨資料是盡力而為。橋接器可以公開出現在已知工具引數/結果中的檔案路徑，但尚未發出 ACP 終端機或結構化檔案差異。

## 用法

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP 用戶端（偵錯）

使用內建 ACP 用戶端，在沒有 IDE 的情況下對橋接器做基本檢查。
它會產生 ACP 橋接器，並讓你以互動方式輸入提示。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

權限模型（用戶端偵錯模式）：

- 自動核准以允許清單為基礎，且只適用於受信任的核心工具 ID。
- `read` 自動核准的範圍限於目前工作目錄（設定時為 `--cwd`）。
- ACP 只會自動核准狹窄的唯讀類別：作用中 cwd 底下的範圍限定 `read` 呼叫，以及唯讀搜尋工具（`search`、`web_search`、`memory_search`）。未知/非核心工具、超出範圍的讀取、可執行工具、控制平面工具、變更型工具，以及互動流程一律需要明確的提示核准。
- 伺服器提供的 `toolCall.kind` 會被視為不受信任的中繼資料（不是授權來源）。
- 此 ACP 橋接器政策獨立於 ACPX harness 權限。如果你透過 `acpx` 後端執行 OpenClaw，`plugins.entries.acpx.config.permissionMode=approve-all` 是該 harness 工作階段的緊急「yolo」開關。

## 如何使用

當 IDE（或其他用戶端）使用代理程式用戶端通訊協定，而你想讓它驅動 OpenClaw Gateway 工作階段時，請使用 ACP。

1. 確認 Gateway 正在執行（本機或遠端）。
2. 設定 Gateway 目標（設定或旗標）。
3. 將你的 IDE 指向透過 stdio 執行 `openclaw acp`。

範例設定（持久化）：

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接執行範例（不寫入設定）：

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 選擇代理程式

ACP 不會直接挑選代理程式。它會依 Gateway 工作階段金鑰路由。

使用代理程式範圍的工作階段金鑰來指定特定代理程式：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每個 ACP 工作階段會對應到單一 Gateway 工作階段金鑰。一個代理程式可以有許多工作階段；除非你覆寫金鑰或標籤，否則 ACP 預設會使用隔離的 `acp:<uuid>` 工作階段。

橋接模式不支援每個工作階段的 `mcpServers`。如果 ACP 用戶端在 `newSession` 或 `loadSession` 期間傳送它們，橋接器會回傳清楚的錯誤，而不是默默忽略。

如果你想讓 ACPX 支援的工作階段看見 OpenClaw Plugin 工具，或所選內建工具（例如 `cron`），請啟用 Gateway 端 ACPX MCP 橋接器，而不是嘗試傳遞每個工作階段的 `mcpServers`。請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents-setup#plugin-tools-mcp-bridge) 和 [OpenClaw 工具 MCP 橋接器](/zh-TW/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## 從 `acpx` 使用（Codex、Claude、其他 ACP 用戶端）

如果你想讓 Codex 或 Claude Code 這類程式碼代理程式透過 ACP 與你的 OpenClaw bot 通訊，請使用 `acpx` 及其內建的 `openclaw` 目標。

典型流程：

1. 執行 Gateway，並確認 ACP 橋接器能連到它。
2. 將 `acpx openclaw` 指向 `openclaw acp`。
3. 指定你想讓程式碼代理程式使用的 OpenClaw 工作階段金鑰。

範例：

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果你想讓 `acpx openclaw` 每次都指定特定 Gateway 和工作階段金鑰，請在 `~/.acpx/config.json` 中覆寫 `openclaw` 代理程式命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

對於 repo 本機的 OpenClaw checkout，請使用直接 CLI 進入點，而不是 dev runner，讓 ACP 串流保持乾淨。例如：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

這是讓 Codex、Claude Code 或其他支援 ACP 的用戶端從 OpenClaw 代理程式擷取情境資訊，而不需要擷取終端機內容的最簡單方式。

## Zed 編輯器設定

在 `~/.config/zed/settings.json` 中新增自訂 ACP 代理程式（或使用 Zed 的設定 UI）：

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

若要指定特定 Gateway 或代理：

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

在 Zed 中，開啟代理面板並選取「OpenClaw ACP」以啟動對話串。

## 工作階段對應

預設情況下，ACP 工作階段會取得具有 `acp:` 前綴的隔離 Gateway 工作階段金鑰。
若要重複使用已知工作階段，請傳入工作階段金鑰或標籤：

- `--session <key>`：使用特定 Gateway 工作階段金鑰。
- `--session-label <label>`：依標籤解析現有工作階段。
- `--reset-session`：為該金鑰鑄造新的工作階段 ID（相同金鑰，新的記錄文字）。

如果你的 ACP 用戶端支援中繼資料，可以依工作階段覆寫：

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

在 [/concepts/session](/zh-TW/concepts/session) 深入了解工作階段金鑰。

## 選項

- `--url <url>`：Gateway WebSocket URL（設定時預設為 gateway.remote.url）。
- `--token <token>`：Gateway 驗證權杖。
- `--token-file <path>`：從檔案讀取 Gateway 驗證權杖。
- `--password <password>`：Gateway 驗證密碼。
- `--password-file <path>`：從檔案讀取 Gateway 驗證密碼。
- `--session <key>`：預設工作階段金鑰。
- `--session-label <label>`：要解析的預設工作階段標籤。
- `--require-existing`：如果工作階段金鑰/標籤不存在則失敗。
- `--reset-session`：首次使用前重設工作階段金鑰。
- `--no-prefix-cwd`：不要在提示前加上工作目錄。
- `--provenance <off|meta|meta+receipt>`：包含 ACP 來源中繼資料或收據。
- `--verbose, -v`：將詳細記錄輸出到 stderr。

安全性注意事項：

- `--token` 和 `--password` 在某些系統上可能會顯示於本機處理程序清單中。
- 優先使用 `--token-file`/`--password-file` 或環境變數（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- Gateway 驗證解析會遵循其他 Gateway 用戶端使用的共用合約：
  - 本機模式：env（`OPENCLAW_GATEWAY_*`）-> `gateway.auth.*` -> 僅在未設定 `gateway.auth.*` 時才回退到 `gateway.remote.*`（已設定但未解析的本機 SecretRefs 會封閉失敗）
  - 遠端模式：`gateway.remote.*` 搭配 env/config 回退，依遠端優先順序規則處理
  - `--url` 是覆寫安全的，且不會重複使用隱含的 config/env 憑證；請傳入明確的 `--token`/`--password`（或檔案變體）
- ACP 執行階段後端子處理程序會接收 `OPENCLAW_SHELL=acp`，可用於特定情境的 shell/profile 規則。
- `openclaw acp client` 會在產生的橋接處理程序上設定 `OPENCLAW_SHELL=acp-client`。

### `acp client` 選項

- `--cwd <dir>`：ACP 工作階段的工作目錄。
- `--server <command>`：ACP 伺服器命令（預設：`openclaw`）。
- `--server-args <args...>`：傳遞給 ACP 伺服器的額外引數。
- `--server-verbose`：在 ACP 伺服器上啟用詳細記錄。
- `--verbose, -v`：詳細用戶端記錄。

## 相關內容

- [CLI 參考](/zh-TW/cli)
- [ACP 代理](/zh-TW/tools/acp-agents)

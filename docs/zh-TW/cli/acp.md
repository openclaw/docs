---
read_when:
    - 設定以 ACP 為基礎的 IDE 整合
    - 偵錯 ACP 工作階段路由至閘道
summary: 執行 ACP 橋接器以用於 IDE 整合
title: ACP
x-i18n:
    generated_at: "2026-07-05T11:09:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

執行與 OpenClaw 閘道通訊的 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 橋接器。

`openclaw acp` 透過 stdio 為 IDE 使用 ACP，並透過 WebSocket 將提示轉送到閘道，同時讓 ACP 工作階段對應到閘道工作階段金鑰。它是以閘道為後端的 ACP 橋接器，不是完整的 ACP 原生編輯器執行階段：它專注於工作階段路由、提示傳遞和串流更新。

如果你希望外部 MCP 用戶端直接與 OpenClaw 頻道對話通訊，而不是託管 ACP harness 工作階段，請改用 [`openclaw mcp serve`](/zh-TW/cli/mcp)。

## 這不是什麼

`openclaw acp` 表示 OpenClaw 會作為 ACP 伺服器：IDE 或 ACP 用戶端會連線到 OpenClaw，而 OpenClaw 會將該工作轉送到閘道工作階段。

這不同於 [ACP 代理](/zh-TW/tools/acp-agents)，在後者中，OpenClaw 會透過 `acpx` 執行外部 harness，例如 Codex 或 Claude Code。

快速規則：

- 編輯器/用戶端想透過 ACP 與 OpenClaw 通訊：使用 `openclaw acp`
- OpenClaw 應以 ACP harness 啟動 Codex/Claude/Gemini：使用 `/acp spawn` 和 [ACP 代理](/zh-TW/tools/acp-agents)

## 相容性矩陣

| ACP 區域                                                              | 狀態        | 備註                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | 已實作      | 透過 stdio 到閘道聊天/傳送 + 中止的核心橋接流程。                                                                                                                                                                                     |
| `listSessions`, slash commands                                        | 已實作      | 工作階段清單會對閘道工作階段狀態運作，具備有界游標分頁；當閘道工作階段資料列帶有工作區中繼資料時，會進行 `cwd` 篩選；命令會透過 `available_commands_update` 宣告。        |
| 工作階段 lineage 中繼資料                                             | 已實作      | 工作階段清單和工作階段資訊快照會在 `_meta` 中包含 OpenClaw 父子 lineage，讓 ACP 用戶端無需私有閘道側通道即可呈現子代理圖。                                             |
| `resumeSession`, `closeSession`                                       | 已實作      | Resume 會將 ACP 工作階段重新繫結到既有閘道工作階段，而不重播歷史。Close 會取消作用中的橋接工作、將待處理提示解析為已取消，並釋放橋接工作階段狀態。                       |
| `loadSession`                                                         | 部分支援    | 將 ACP 工作階段重新繫結到閘道工作階段金鑰，並針對橋接器建立的工作階段重播 ACP 事件帳本歷史。較舊/無帳本的工作階段會退回到儲存的使用者/助理文字。                         |
| 提示內容（`text`、嵌入的 `resource`、圖片）                           | 部分支援    | 文字/資源會攤平成聊天輸入；圖片會成為閘道附件。                                                                                                                                                                                       |
| 工作階段模式                                                          | 部分支援    | 支援 `session/set_mode`；橋接器會公開以閘道為後端的工作階段控制，用於思考等級、工具詳細程度、推理、用量詳細資料和提升權限的動作。更廣泛的 ACP 原生模式/設定介面仍不在範圍內。 |
| 思考串流                                                              | 已實作      | 模型思考內容會以 `agent_thought_chunk` 工作階段更新串流傳送。不會發出 ACP 原生工作階段計畫。                                                                            |
| 工作階段資訊和用量更新                                                | 部分支援    | 橋接器會從快取的閘道工作階段快照發出 `session_info_update` 和盡力而為的 `usage_update` 通知。用量為近似值，且只會在閘道 token 總計標記為最新時傳送。                     |
| 工具串流                                                              | 部分支援    | 當閘道工具參數/結果公開時，`tool_call`/`tool_call_update` 事件會包含原始 I/O、文字內容，以及盡力而為的檔案位置。不會公開嵌入式終端機和更豐富的差異原生輸出。             |
| Exec 核准                                                             | 部分支援    | 作用中的 ACP 提示回合期間，閘道 exec 核准提示會以 `session/request_permission` 轉送到 ACP 用戶端。                                                                      |
| 每工作階段 MCP 伺服器（`mcpServers`）                                 | 不支援      | 橋接模式會拒絕每工作階段 MCP 伺服器要求。請改在 OpenClaw 閘道或代理上設定 MCP。                                                                                        |
| 用戶端檔案系統方法（`fs/read_text_file`, `fs/write_text_file`）        | 不支援      | 橋接器不會呼叫 ACP 用戶端檔案系統方法。                                                                                                                                                                                              |
| 用戶端終端機方法（`terminal/*`）                                      | 不支援      | 橋接器不會建立 ACP 用戶端終端機，也不會透過工具呼叫串流傳送終端機 ID。                                                                                                  |

## 已知限制

- `loadSession` 只會針對橋接器建立的工作階段重播完整 ACP 事件帳本歷史。較舊/無帳本的工作階段會使用逐字稿備援，且不會重建歷史工具呼叫或系統通知。
- 如果多個 ACP 用戶端共用相同的閘道工作階段金鑰，事件和取消路由會是盡力而為，而不是依用戶端嚴格隔離。需要乾淨的編輯器本機回合時，建議使用預設隔離的 `acp-bridge:<uuid>` 工作階段。
- 閘道停止狀態會轉換為 ACP 停止原因，但該對應不如完整 ACP 原生執行階段具表達力。
- 工作階段控制會公開聚焦的一組閘道旋鈕：思考等級、工具詳細程度、推理、用量詳細資料和提升權限的動作。模型選擇和 exec 主機控制不會公開為 ACP 設定選項。
- `session_info_update` 和 `usage_update` 衍生自閘道工作階段快照，而非即時 ACP 原生執行階段計量。用量為近似值，不包含成本資料，且只會在閘道將總 token 資料標記為最新時發出。
- 工具跟隨資料是盡力而為：橋接器會公開出現在已知工具參數/結果中的檔案路徑，但不會發出 ACP 終端機或結構化檔案差異。
- Exec 核准轉送的範圍限於作用中的 ACP 提示回合；其他閘道工作階段的核准會被忽略。

## 使用方式

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

使用內建 ACP 用戶端，在沒有 IDE 的情況下對橋接器進行基本檢查。它會產生 ACP 橋接器，並讓你以互動方式輸入提示。

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

權限模型（用戶端偵錯模式）：

- 自動核准以允許清單為基礎，且只套用於受信任的核心工具 ID。
- `read` 自動核准的範圍限於目前工作目錄（設定時為 `--cwd`）。
- ACP 只會自動核准狹窄的唯讀類別：作用中 cwd 下有範圍的 `read` 呼叫，加上唯讀搜尋工具（`search`、`web_search`、`memory_search`）。未知/非核心工具、範圍外讀取、可執行 exec 的工具、控制平面工具、會變更狀態的工具和互動流程，一律需要明確提示核准。
- 伺服器提供的 `toolCall.kind` 會被視為不受信任的中繼資料，而非授權來源。
- 此 ACP 橋接器政策與 ACPX harness 權限分開。如果你透過 `acpx` 後端執行 OpenClaw，`plugins.entries.acpx.config.permissionMode=approve-all` 是該 harness 工作階段的緊急全准開關。

## 通訊協定冒煙測試

若要進行通訊協定層級偵錯，請以隔離狀態啟動閘道，並使用 ACP JSON-RPC 用戶端透過 stdio 驅動 `openclaw acp`。涵蓋 `initialize`、`session/new`、帶有絕對 `cwd` 的 `session/list`、`session/resume`、`session/close`、重複 close，以及遺失 resume。

證明應包含宣告的生命週期能力、以閘道為後端的工作階段資料列、更新通知，以及閘道 `sessions.list` 記錄：

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

避免將 `openclaw gateway call sessions.list` 作為唯一 ACP 證明。該命令列介面路徑可能會要求 fresh-token 操作者範圍升級；ACP 橋接器正確性需由 ACP stdio frame 加上閘道 `sessions.list` 記錄證明。

## 如何使用這項功能

當 IDE（或其他用戶端）使用 Agent Client Protocol，且你希望它驅動 OpenClaw 閘道工作階段時，請使用 ACP。

1. 確認閘道正在執行（本機或遠端）。
2. 設定閘道目標（設定或旗標）。
3. 將你的 IDE 指向透過 stdio 執行 `openclaw acp`。

設定範例（持久化）：

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

## 選取代理

ACP 不會直接挑選代理。它會依閘道工作階段金鑰路由。使用代理範圍的工作階段金鑰以指向特定代理：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每個 ACP 工作階段會對應到單一閘道工作階段金鑰。一個代理可以有多個工作階段；除非你覆寫金鑰或標籤，否則 ACP 預設為隔離的 `acp-bridge:<uuid>` 工作階段。

橋接模式不支援每工作階段的 `mcpServers`。如果 ACP 用戶端在 `newSession` 或 `loadSession` 期間傳送它們，橋接器會傳回明確錯誤，而不是默默忽略。

如果你想讓 ACPX 支援的工作階段看到 OpenClaw 外掛工具，或選定的內建工具（例如 `cron`），請啟用閘道端的 ACPX MCP 橋接器，而不是嘗試傳遞每工作階段的 `mcpServers`。請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents-setup#plugin-tools-mcp-bridge) 和 [OpenClaw 工具 MCP 橋接器](/zh-TW/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## 從 `acpx` 使用（Codex、Claude、其他 ACP 用戶端）

如果你想讓 Codex 或 Claude Code 這類編碼代理程式透過 ACP 與你的 OpenClaw Bot 對話，請使用 `acpx` 及其內建的 `openclaw` 目標。

典型流程：

1. 執行閘道，並確認 ACP 橋接器可以連到它。
2. 將 `acpx openclaw` 指向 `openclaw acp`。
3. 指定你想讓編碼代理程式使用的 OpenClaw 工作階段金鑰。

範例：

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果你想讓 `acpx openclaw` 每次都指定特定的閘道和工作階段金鑰，請在 `~/.acpx/config.json` 中覆寫 `openclaw` 代理程式命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

對於儲存庫本機的 OpenClaw checkout，請使用直接的命令列介面進入點，而不是開發執行器，讓 ACP 串流保持乾淨：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

這是讓 Codex、Claude Code 或其他支援 ACP 的用戶端從 OpenClaw 代理程式擷取脈絡資訊，而不必擷取終端畫面的最簡單方式。

## Zed 編輯器設定

在 `~/.config/zed/settings.json` 中新增自訂 ACP 代理程式（或使用 Zed 的設定介面）：

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

若要指定特定閘道或代理程式：

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

在 Zed 中，開啟代理程式面板並選取「OpenClaw ACP」以開始執行緒。

## 工作階段對應

預設情況下，ACP 橋接器工作階段會取得具有 `acp-bridge:` 前綴的隔離閘道工作階段金鑰。這些一般模型橋接工作階段是合成且可丟棄的：它們會受到過期項目修剪影響，且不會被視為受保護的人類對話介面。若要重複使用已知工作階段，請傳遞工作階段金鑰或標籤：

- `--session <key>`：使用特定閘道工作階段金鑰。
- `--session-label <label>`：依標籤解析既有工作階段。
- `--reset-session`：為該金鑰產生新的工作階段 ID（相同金鑰，新的逐字稿）。

如果你的 ACP 用戶端支援中繼資料，你可以針對每個工作階段覆寫：

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

在 [/concepts/session](/zh-TW/concepts/session) 進一步了解工作階段金鑰。

## 選項

- `--url <url>`：閘道 WebSocket URL（設定時預設為 `gateway.remote.url`）。
- `--token <token>`：閘道驗證權杖。
- `--token-file <path>`：從檔案讀取閘道驗證權杖。
- `--password <password>`：閘道驗證密碼。
- `--password-file <path>`：從檔案讀取閘道驗證密碼。
- `--session <key>`：預設工作階段金鑰。
- `--session-label <label>`：要解析的預設工作階段標籤。
- `--require-existing`：如果工作階段金鑰/標籤不存在，則失敗。
- `--reset-session`：第一次使用前重設工作階段金鑰。
- `--no-prefix-cwd`：不要在提示前加上工作目錄。
- `--provenance <off|meta|meta+receipt>`：包含 ACP 來源中繼資料或收據。
- `--verbose, -v`：將詳細記錄輸出到 stderr。

安全性注意事項：

- `--token` 和 `--password` 在某些系統上的本機程序清單中可能可見。建議使用 `--token-file`/`--password-file` 或環境變數（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- 閘道驗證解析會遵循其他閘道用戶端使用的共用合約：
  - 本機模式：env（`OPENCLAW_GATEWAY_*`），接著是 `gateway.auth.*`，只有在未設定 `gateway.auth.*` 時才回退到 `gateway.remote.*`（已設定但無法解析的本機 SecretRef 會失敗關閉，而不是默默回退）
  - 遠端模式：`gateway.remote.*`，並依遠端優先順序規則使用 env/config 回退
  - `--url` 可安全覆寫，且不會重複使用隱含的 config/env 認證；請傳遞明確的 `--token`/`--password`（或檔案變體）

### `acp client` 選項

- `--cwd <dir>`：ACP 工作階段的工作目錄。
- `--server <command>`：ACP 伺服器命令（預設：`openclaw`）。
- `--server-args <args...>`：傳遞給 ACP 伺服器的額外引數。
- `--server-verbose`：在 ACP 伺服器上啟用詳細記錄。
- `--verbose, -v`：詳細用戶端記錄。
- `openclaw acp client` 會在產生的橋接程序上設定 `OPENCLAW_SHELL=acp-client`，可用於特定脈絡的 shell/profile 規則。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [ACP 代理程式](/zh-TW/tools/acp-agents)

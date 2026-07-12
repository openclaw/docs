---
read_when:
    - 設定基於 ACP 的 IDE 整合功能
    - 偵錯 ACP 工作階段至閘道的路由設定
summary: 執行 ACP 橋接器以整合 IDE
title: ACP
x-i18n:
    generated_at: "2026-07-11T21:10:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

執行與 OpenClaw 閘道通訊的 [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 橋接器。

`openclaw acp` 透過標準輸入輸出為 IDE 提供 ACP，並經由 WebSocket 將提示轉送至閘道，同時維持 ACP 工作階段與閘道工作階段金鑰之間的對應。它是由閘道支援的 ACP 橋接器，而非完整的 ACP 原生編輯器執行階段：其重點在於工作階段路由、提示傳遞及串流更新。

若要讓外部 MCP 用戶端直接與 OpenClaw 頻道對話通訊，而非託管 ACP 控制框架工作階段，請改用 [`openclaw mcp serve`](/zh-TW/cli/mcp)。

## 這不是什麼

`openclaw acp` 表示 OpenClaw 會充當 ACP 伺服器：IDE 或 ACP 用戶端會連線至 OpenClaw，而 OpenClaw 會將該工作轉送至閘道工作階段。

這與 [ACP 代理程式](/zh-TW/tools/acp-agents) 不同；後者是由 OpenClaw 透過 `acpx` 執行 Codex 或 Claude Code 等外部控制框架。

快速判斷原則：

- 編輯器／用戶端想透過 ACP 與 OpenClaw 通訊：使用 `openclaw acp`
- OpenClaw 應將 Codex／Claude／Gemini 啟動為 ACP 控制框架：使用 `/acp spawn` 和 [ACP 代理程式](/zh-TW/tools/acp-agents)

## 相容性矩陣

| ACP 領域                                                              | 狀態      | 備註                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`、`newSession`、`prompt`、`cancel`                        | 已實作 | 從標準輸入輸出到閘道聊天／傳送及中止的核心橋接流程。                                                                                                                                                                             |
| `listSessions`、斜線命令                                        | 已實作 | 工作階段清單會依據閘道工作階段狀態運作，使用有界游標分頁；當閘道工作階段資料列帶有工作區中繼資料時，也支援 `cwd` 篩選。命令會透過 `available_commands_update` 公告。                     |
| 工作階段譜系中繼資料                                              | 已實作 | 工作階段清單及工作階段資訊快照會在 `_meta` 中包含 OpenClaw 的父子譜系，讓 ACP 用戶端無須使用私有閘道旁路即可呈現子代理程式關係圖。                                                     |
| `resumeSession`、`closeSession`                                       | 已實作 | 恢復會將 ACP 工作階段重新繫結至現有的閘道工作階段，而不重播歷史記錄。關閉會取消進行中的橋接工作、將待處理提示解析為已取消，並釋放橋接工作階段狀態。                                   |
| `loadSession`                                                         | 部分支援     | 將 ACP 工作階段重新繫結至閘道工作階段金鑰，並為橋接器建立的工作階段重播 ACP 事件帳本歷史記錄。較舊或無帳本的工作階段會改用已儲存的使用者／助理文字。                                                  |
| 提示內容（`text`、內嵌 `resource`、圖片）                  | 部分支援     | 文字／資源會展平成聊天輸入；圖片會成為閘道附件。                                                                                                                                                            |
| 工作階段模式                                                         | 部分支援     | 支援 `session/set_mode`；橋接器會公開由閘道支援的工作階段控制項，包括思考層級、工具詳細程度、推理、用量詳細資料及提升權限的動作。更廣泛的 ACP 原生模式／設定介面仍不在範圍內。 |
| 思考串流                                                     | 已實作 | 模型思考內容會以 `agent_thought_chunk` 工作階段更新進行串流傳送。不會發出 ACP 原生工作階段計畫。                                                                                                                    |
| 工作階段資訊及用量更新                                        | 部分支援     | 橋接器會從快取的閘道工作階段快照發出 `session_info_update`，並以盡力而為方式發出 `usage_update` 通知。用量為近似值，且僅在閘道權杖總數標示為最新時傳送。                             |
| 工具串流                                                        | 部分支援     | 當閘道工具引數／結果公開相關資訊時，`tool_call`／`tool_call_update` 事件會包含原始輸入／輸出、文字內容及盡力而為取得的檔案位置。不會公開內嵌終端機或更豐富的差異原生輸出。                     |
| 執行核准                                                        | 部分支援     | 進行中的 ACP 提示回合內，閘道的執行核准提示會透過 `session/request_permission` 中繼至 ACP 用戶端。                                                                                                               |
| 各工作階段的 MCP 伺服器（`mcpServers`）                                | 不支援 | 橋接模式會拒絕各工作階段的 MCP 伺服器要求。請改在 OpenClaw 閘道或代理程式上設定 MCP。                                                                                                                          |
| 用戶端檔案系統方法（`fs/read_text_file`、`fs/write_text_file`） | 不支援 | 橋接器不會呼叫 ACP 用戶端的檔案系統方法。                                                                                                                                                                               |
| 用戶端終端機方法（`terminal/*`）                                | 不支援 | 橋接器不會建立 ACP 用戶端終端機，也不會透過工具呼叫串流傳送終端機 ID。                                                                                                                                            |

## 已知限制

- `loadSession` 僅會為橋接器建立的工作階段重播完整的 ACP 事件帳本歷史記錄。較舊或無帳本的工作階段會使用逐字稿備援，且不會重建歷史工具呼叫或系統通知。
- 若多個 ACP 用戶端共用相同的閘道工作階段金鑰，事件及取消路由會採盡力而為方式，而非依用戶端嚴格隔離。若需要乾淨的編輯器本機回合，請優先使用預設隔離的 `acp-bridge:<uuid>` 工作階段。
- 閘道停止狀態會轉換為 ACP 停止原因，但此對應的表達能力不及完整的 ACP 原生執行階段。
- 工作階段控制項會公開一組精簡的閘道調整項目：思考層級、工具詳細程度、推理、用量詳細資料及提升權限的動作。模型選擇及執行主機控制項不會公開為 ACP 設定選項。
- `session_info_update` 和 `usage_update` 是衍生自閘道工作階段快照，而非 ACP 原生執行階段的即時計量。用量為近似值、不包含費用資料，且僅在閘道將權杖總數資料標示為最新時發出。
- 工具跟隨資料採盡力而為方式：橋接器會公開已知工具引數／結果中出現的檔案路徑，但不會發出 ACP 終端機或結構化檔案差異。
- 執行核准中繼僅限於進行中的 ACP 提示回合；來自其他閘道工作階段的核准會被忽略。

## 用法

```bash
openclaw acp

# 遠端閘道
openclaw acp --url wss://gateway-host:18789 --token <token>

# 遠端閘道（從檔案讀取權杖）
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 附加至現有工作階段金鑰
openclaw acp --session agent:main:main

# 依標籤附加（必須已存在）
openclaw acp --session-label "support inbox"

# 在第一個提示前重設工作階段金鑰
openclaw acp --session agent:main:main --reset-session
```

## ACP 用戶端（偵錯）

使用內建的 ACP 用戶端，在沒有 IDE 的情況下對橋接器進行基本健全性檢查。它會啟動 ACP 橋接器，並讓你以互動方式輸入提示。

```bash
openclaw acp client

# 將啟動的橋接器指向遠端閘道
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# 覆寫伺服器命令（預設：openclaw）
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

權限模型（用戶端偵錯模式）：

- 自動核准以允許清單為依據，且僅適用於受信任的核心工具 ID。
- `read` 自動核准僅限目前工作目錄（設定時為 `--cwd`）。
- ACP 僅會自動核准範圍狹窄的唯讀類別：有效目前工作目錄下具範圍限制的 `read` 呼叫，以及唯讀搜尋工具（`search`、`web_search`、`memory_search`）。未知／非核心工具、範圍外讀取、具執行能力的工具、控制平面工具、變更資料的工具及互動式流程，一律需要明確的提示核准。
- 伺服器提供的 `toolCall.kind` 會被視為不受信任的中繼資料，而非授權來源。
- 此 ACP 橋接器原則與 ACPX 控制框架權限分開。若你透過 `acpx` 後端執行 OpenClaw，`plugins.entries.acpx.config.permissionMode=approve-all` 是該控制框架工作階段的緊急「不受限」開關。

## 通訊協定煙霧測試

若要進行通訊協定層級的偵錯，請以隔離狀態啟動閘道，並使用 ACP JSON-RPC 用戶端透過標準輸入輸出驅動 `openclaw acp`。涵蓋 `initialize`、`session/new`、使用絕對 `cwd` 的 `session/list`、`session/resume`、`session/close`、重複關閉，以及恢復不存在的工作階段。

證明資料應包含公告的生命週期能力、由閘道支援的工作階段資料列、更新通知，以及閘道的 `sessions.list` 記錄：

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

避免將 `openclaw gateway call sessions.list` 作為唯一的 ACP 證明。該命令列介面路徑可能會要求將最新權杖的操作員範圍升級；ACP 橋接器的正確性應由 ACP 標準輸入輸出訊框與閘道的 `sessions.list` 記錄共同證明。

## 使用方式

當 IDE（或其他用戶端）使用 Agent Client Protocol，且你希望它驅動 OpenClaw 閘道工作階段時，請使用 ACP。

1. 確認閘道正在執行（本機或遠端）。
2. 設定閘道目標（使用設定或旗標）。
3. 將 IDE 指向透過標準輸入輸出執行 `openclaw acp`。

設定範例（持久保存）：

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

直接執行範例（不寫入設定）：

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# 為確保本機程序安全，建議使用此方式
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## 選擇代理程式

ACP 不會直接選擇代理程式，而是依閘道工作階段金鑰進行路由。使用代理程式範圍的工作階段金鑰，以指定特定代理程式：

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

每個 ACP 工作階段會對應至單一閘道工作階段金鑰。一個代理程式可以有多個工作階段；除非你覆寫金鑰或標籤，否則 ACP 預設使用隔離的 `acp-bridge:<uuid>` 工作階段。

橋接模式不支援個別工作階段的 `mcpServers`。如果 ACP 用戶端在 `newSession` 或 `loadSession` 期間傳送它們，橋接器會回傳明確的錯誤，而不會悄悄忽略。

如果你希望由 ACPX 支援的工作階段能存取 OpenClaw 外掛工具或 `cron` 等指定的內建工具，請啟用閘道端的 ACPX MCP 橋接，而不要嘗試傳入個別工作階段的 `mcpServers`。請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents-setup#plugin-tools-mcp-bridge)和 [OpenClaw 工具 MCP 橋接](/zh-TW/tools/acp-agents-setup#openclaw-tools-mcp-bridge)。

## 從 `acpx` 使用（Codex、Claude、其他 ACP 用戶端）

如果你希望 Codex 或 Claude Code 等程式設計代理程式透過 ACP 與你的 OpenClaw 機器人通訊，請使用 `acpx` 內建的 `openclaw` 目標。

典型流程：

1. 執行閘道，並確認 ACP 橋接器可以連線至它。
2. 將 `acpx openclaw` 指向 `openclaw acp`。
3. 指定你希望程式設計代理程式使用的 OpenClaw 工作階段金鑰。

範例：

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

如果你希望 `acpx openclaw` 每次都以特定閘道和工作階段金鑰為目標，請在 `~/.acpx/config.json` 中覆寫 `openclaw` 代理程式命令：

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

對於儲存庫本機的 OpenClaw 簽出版本，請使用命令列介面的直接進入點，而不要使用開發執行器，讓 ACP 串流保持乾淨：

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

這是讓 Codex、Claude Code 或其他支援 ACP 的用戶端從 OpenClaw 代理程式取得脈絡資訊，而不必擷取終端內容的最簡單方式。

## Zed 編輯器設定

在 `~/.config/zed/settings.json` 中新增自訂 ACP 代理程式（或使用 Zed 的 Settings UI）：

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

若要以特定閘道或代理程式為目標：

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

在 Zed 中，開啟 Agent 面板並選取 "OpenClaw ACP" 以開始對話串。

## 工作階段對應

依預設，ACP 橋接工作階段會取得具有 `acp-bridge:` 前綴的隔離閘道工作階段金鑰。這些一般模型的橋接工作階段是合成且可丟棄的：它們會受到過期項目清理機制的處理，且不會被視為受保護的人類對話介面。若要重複使用已知的工作階段，請傳入工作階段金鑰或標籤：

- `--session <key>`：使用特定的閘道工作階段金鑰。
- `--session-label <label>`：依標籤解析現有工作階段。
- `--reset-session`：為該金鑰建立新的工作階段識別碼（相同金鑰、新的逐字記錄）。

如果你的 ACP 用戶端支援中繼資料，可以針對個別工作階段覆寫：

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

如需進一步瞭解工作階段金鑰，請參閱 [/concepts/session](/zh-TW/concepts/session)。

## 選項

- `--url <url>`：閘道 WebSocket URL（設定後預設為 `gateway.remote.url`）。
- `--token <token>`：閘道驗證權杖。
- `--token-file <path>`：從檔案讀取閘道驗證權杖。
- `--password <password>`：閘道驗證密碼。
- `--password-file <path>`：從檔案讀取閘道驗證密碼。
- `--session <key>`：預設工作階段金鑰。
- `--session-label <label>`：要解析的預設工作階段標籤。
- `--require-existing`：如果工作階段金鑰或標籤不存在，則執行失敗。
- `--reset-session`：首次使用前重設工作階段金鑰。
- `--no-prefix-cwd`：不要在提示詞前加上工作目錄。
- `--provenance <off|meta|meta+receipt>`：包含 ACP 來源中繼資料或收據。
- `--verbose, -v`：將詳細記錄輸出至標準錯誤。

安全性注意事項：

- 在某些系統上，`--token` 和 `--password` 可能會顯示於本機程序清單中。建議使用 `--token-file`／`--password-file` 或環境變數（`OPENCLAW_GATEWAY_TOKEN`、`OPENCLAW_GATEWAY_PASSWORD`）。
- 閘道驗證解析遵循其他閘道用戶端共用的合約：
  - 本機模式：先使用環境變數（`OPENCLAW_GATEWAY_*`），再使用 `gateway.auth.*`；只有在未設定 `gateway.auth.*` 時才退回使用 `gateway.remote.*`（已設定但無法解析的本機 SecretRef 會採取封閉式失敗，而不會悄悄退回）
  - 遠端模式：使用 `gateway.remote.*`，並依照遠端優先順序規則退回使用環境變數或設定
  - `--url` 可安全覆寫，且不會重複使用隱含的設定或環境憑證；請明確傳入 `--token`／`--password`（或其檔案形式）

### `acp client` 選項

- `--cwd <dir>`：ACP 工作階段的工作目錄。
- `--server <command>`：ACP 伺服器命令（預設：`openclaw`）。
- `--server-args <args...>`：傳遞給 ACP 伺服器的額外引數。
- `--server-verbose`：啟用 ACP 伺服器的詳細記錄。
- `--verbose, -v`：用戶端詳細記錄。
- `openclaw acp client` 會在產生的橋接程序上設定 `OPENCLAW_SHELL=acp-client`，可用於特定脈絡的殼層或設定檔規則。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [ACP 代理程式](/zh-TW/tools/acp-agents)

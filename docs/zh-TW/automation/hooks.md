---
read_when:
    - 你想要針對 /new、/reset、/stop 和代理程式生命週期事件的事件驅動自動化
    - 您想要建置、安裝或偵錯鉤子
summary: 鉤子：用於命令與生命週期事件的事件驅動自動化
title: 鉤子
x-i18n:
    generated_at: "2026-05-02T20:41:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hooks 是在 Gateway 內發生某些事件時執行的小型指令碼。它們可以從目錄中探索，並透過 `openclaw hooks` 檢查。只有在你啟用 hooks，或設定至少一個 hook 項目、hook pack、舊版處理常式或額外 hook 目錄後，Gateway 才會載入內部 hooks。

OpenClaw 中有兩種 hooks：

- **內部 hooks**（本頁）：在 agent 事件觸發時於 Gateway 內執行，例如 `/new`、`/reset`、`/stop` 或生命週期事件。
- **Webhooks**：外部 HTTP 端點，可讓其他系統觸發 OpenClaw 中的工作。請參閱 [Webhooks](/zh-TW/automation/cron-jobs#webhooks)。

Hooks 也可以打包在 Plugin 內。`openclaw hooks list` 會顯示獨立 hooks 和 Plugin 管理的 hooks。

## 快速開始

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## 事件類型

| 事件                     | 觸發時機                                                   |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 發出 `/new` 命令                                           |
| `command:reset`          | 發出 `/reset` 命令                                         |
| `command:stop`           | 發出 `/stop` 命令                                          |
| `command`                | 任何命令事件（一般監聽器）                                 |
| `session:compact:before` | Compaction 摘要整理歷史紀錄之前                            |
| `session:compact:after`  | Compaction 完成之後                                        |
| `session:patch`          | 工作階段屬性被修改時                                       |
| `agent:bootstrap`        | 注入工作區啟動檔案之前                                     |
| `gateway:startup`        | 通道啟動且 hooks 載入之後                                  |
| `gateway:shutdown`       | Gateway 關閉開始時                                         |
| `gateway:pre-restart`    | 預期的 Gateway 重新啟動之前                                |
| `message:received`       | 來自任何通道的傳入訊息                                     |
| `message:transcribed`    | 音訊轉錄完成之後                                           |
| `message:preprocessed`   | 媒體和連結預處理完成或略過之後                             |
| `message:sent`           | 傳出訊息已送達                                             |

## 撰寫 hooks

### Hook 結構

每個 hook 都是一個包含兩個檔案的目錄：

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### HOOK.md 格式

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**中繼資料欄位**（`metadata.openclaw`）：

| 欄位       | 說明                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 的顯示 emoji                                     |
| `events`   | 要監聽的事件陣列                                     |
| `export`   | 要使用的具名匯出（預設為 `"default"`）               |
| `os`       | 必要平台（例如 `["darwin", "linux"]`）               |
| `requires` | 必要的 `bins`、`anyBins`、`env` 或 `config` 路徑      |
| `always`   | 略過資格檢查（布林值）                               |
| `install`  | 安裝方法                                             |

### 處理常式實作

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（推入即可傳送給使用者），以及 `context`（事件專屬資料）。Agent 和工具 Plugin hook 情境也可以包含 `trace`，這是一個唯讀、相容 W3C 的診斷追蹤情境，Plugin 可將其傳入結構化日誌以進行 OTEL 關聯。

### 事件情境重點

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**訊息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（供應商專屬資料，包含 `senderId`、`senderName`、`guildId`）。對於類似命令的訊息，`context.content` 會優先使用非空白的命令主體，然後才退回使用原始傳入主體和通用主體；它不包含僅供 agent 使用的強化內容，例如執行緒歷史紀錄或連結摘要。

**訊息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**訊息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**訊息事件**（`message:preprocessed`）：`context.bodyForAgent`（最終強化主體）、`context.from`、`context.channelId`。

**Bootstrap 事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**工作階段修補事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅變更的欄位）、`context.cfg`。只有具特殊權限的用戶端可以觸發修補事件。

**Compaction 事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 會加入 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 觀察使用者發出 `/stop`；它是取消/命令生命週期，而不是 agent 終結關卡。需要檢查自然最終答案並要求 agent 再執行一次的 Plugin，應改用具型別的 Plugin hook `before_agent_finalize`。請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

**Gateway 生命週期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，並在 Gateway 關閉開始時觸發。`gateway:pre-restart` 包含相同情境，但只會在關閉屬於預期重新啟動的一部分，且提供有限的 `restartExpectedMs` 值時觸發。關閉期間，每個生命週期 hook 的等待都是盡力而為且有界限的，因此即使處理常式停滯，關閉仍會繼續。

## Hook 探索

Hooks 會依照覆寫優先順序由低到高，從以下目錄探索：

1. **內建 hooks**：隨 OpenClaw 出貨
2. **Plugin hooks**：打包在已安裝 Plugin 內的 hooks
3. **受管理 hooks**：`~/.openclaw/hooks/`（使用者安裝、跨工作區共用）。來自 `hooks.internal.load.extraDirs` 的額外目錄也共用此優先順序。
4. **工作區 hooks**：`<workspace>/hooks/`（每個 agent 各自擁有，預設停用，直到明確啟用）

工作區 hooks 可以新增 hook 名稱，但不能覆寫同名的內建、受管理或 Plugin 提供的 hooks。

在設定內部 hooks 之前，Gateway 啟動時會略過內部 hook 探索。請使用 `openclaw hooks enable <name>` 啟用內建或受管理 hook、安裝 hook pack，或設定 `hooks.internal.enabled=true` 以選擇加入。啟用一個具名 hook 時，Gateway 只會載入該 hook 的處理常式；`hooks.internal.enabled=true`、額外 hook 目錄和舊版處理常式則會選擇加入廣泛探索。

### Hook packs

Hook packs 是透過 `package.json` 中的 `openclaw.hooks` 匯出 hooks 的 npm 套件。使用以下命令安裝：

```bash
openclaw plugins install <path-or-spec>
```

Npm 規格僅限 registry（套件名稱 + 選用的精確版本或 dist-tag）。Git/URL/file 規格與 semver 範圍會被拒絕。

## 內建 hooks

| Hook                  | 事件                           | 功能                                                  |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | 將工作階段脈絡儲存到 `<workspace>/memory/`           |
| bootstrap-extra-files | `agent:bootstrap`              | 從 glob 模式注入額外的 bootstrap 檔案                |
| command-logger        | `command`                      | 將所有指令記錄到 `~/.openclaw/logs/commands.log`     |
| boot-md               | `gateway:startup`              | Gateway 啟動時執行 `BOOT.md`                         |

啟用任何內建 hook：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資料

擷取最後 15 則使用者/assistant 訊息，透過 LLM 產生描述性的檔名 slug，並使用主機本機日期儲存到 `<workspace>/memory/YYYY-MM-DD-slug.md`。需要已設定 `workspace.dir`。

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files 設定

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

路徑會相對於工作區解析。只會載入已辨識的 bootstrap 基本檔名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 詳細資料

將每個斜線指令記錄到 `~/.openclaw/logs/commands.log`。

<a id="boot-md"></a>

### boot-md 詳細資料

Gateway 啟動時，從作用中的工作區執行 `BOOT.md`。

## Plugin hooks

Plugins 可以透過 Plugin SDK 註冊具型別的 hooks，以進行更深入的整合：
攔截工具呼叫、修改提示、控制訊息流程等。
當你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他同程序生命週期 hooks 時，請使用 plugin hooks。

完整的 plugin hook 參考資料，請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

## 設定

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

每個 hook 的環境變數：

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

額外的 hook 目錄：

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
舊版 `hooks.internal.handlers` 陣列設定格式仍支援向後相容，但新的 hooks 應使用以探索為基礎的系統。
</Note>

## CLI 參考

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 最佳做法

- **保持 handlers 快速。** Hooks 會在指令處理期間執行。對繁重工作使用 `void processInBackground(event)` 以 fire-and-forget 方式處理。
- **優雅地處理錯誤。** 將高風險操作包在 try/catch 中；不要擲出錯誤，讓其他 handlers 能夠執行。
- **及早篩選事件。** 如果事件 type/action 不相關，請立即返回。
- **使用具體的事件鍵。** 偏好 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以降低開銷。

## 疑難排解

### 找不到 hook

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook 不符合資格

```bash
openclaw hooks info my-hook
```

檢查是否缺少二進位檔（PATH）、環境變數、設定值或 OS 相容性。

### Hook 未執行

1. 確認掛鉤已啟用：`openclaw hooks list`
2. 重新啟動你的 Gateway 程序，讓掛鉤重新載入。
3. 檢查 Gateway 記錄：`./scripts/clawlog.sh | grep hook`

## 相關

- [CLI 參考：掛鉤](/zh-TW/cli/hooks)
- [Webhook](/zh-TW/automation/cron-jobs#webhooks)
- [Plugin 掛鉤](/zh-TW/plugins/hooks) — 程序內 Plugin 生命週期掛鉤
- [組態](/zh-TW/gateway/configuration-reference#hooks)

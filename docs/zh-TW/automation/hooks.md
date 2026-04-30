---
read_when:
    - 你需要針對 /new、/reset、/stop 和代理程式生命週期事件的事件驅動自動化
    - 你想要建置、安裝或偵錯鉤子
summary: 掛鉤：用於命令與生命週期事件的事件驅動自動化
title: 鉤子
x-i18n:
    generated_at: "2026-04-30T02:44:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

掛鉤是在 Gateway 內部發生事件時執行的小型腳本。它們可以從目錄中探索，並可使用 `openclaw hooks` 檢視。只有在你啟用掛鉤，或設定至少一個掛鉤項目、掛鉤套件、舊版處理常式或額外掛鉤目錄後，Gateway 才會載入內部掛鉤。

OpenClaw 中有兩種掛鉤：

- **內部掛鉤**（本頁）：在代理事件觸發時於 Gateway 內執行，例如 `/new`、`/reset`、`/stop` 或生命週期事件。
- **Webhooks**：外部 HTTP 端點，可讓其他系統觸發 OpenClaw 中的工作。請參閱 [Webhooks](/zh-TW/automation/cron-jobs#webhooks)。

掛鉤也可以封裝在 plugins 內。`openclaw hooks list` 會顯示獨立掛鉤與 plugin 管理的掛鉤。

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
| `session:compact:before` | Compaction 摘要歷程記錄之前                                |
| `session:compact:after`  | Compaction 完成之後                                        |
| `session:patch`          | 工作階段屬性被修改時                                       |
| `agent:bootstrap`        | 注入工作區啟動程序檔案之前                                 |
| `gateway:startup`        | 頻道啟動且掛鉤載入之後                                     |
| `gateway:shutdown`       | Gateway 關閉開始時                                         |
| `gateway:pre-restart`    | 預期的 Gateway 重新啟動之前                                |
| `message:received`       | 來自任何頻道的傳入訊息                                     |
| `message:transcribed`    | 音訊轉錄完成之後                                           |
| `message:preprocessed`   | 媒體與連結前處理完成或略過之後                             |
| `message:sent`           | 傳出訊息已送達                                             |

## 撰寫掛鉤

### 掛鉤結構

每個掛鉤都是一個包含兩個檔案的目錄：

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
| `emoji`    | CLI 顯示用表情符號                                   |
| `events`   | 要監聽的事件陣列                                     |
| `export`   | 要使用的具名匯出（預設為 `"default"`）               |
| `os`       | 必要平台（例如 `["darwin", "linux"]`）               |
| `requires` | 必要的 `bins`、`anyBins`、`env` 或 `config` 路徑     |
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

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（推入即可傳送給使用者）以及 `context`（事件專屬資料）。代理與工具 plugin 掛鉤內容也可以包含 `trace`，這是一個唯讀、相容 W3C 的診斷追蹤內容，plugins 可將其傳入結構化記錄，以便進行 OTEL 關聯。

### 事件內容重點

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**訊息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（供應商專屬資料，包含 `senderId`、`senderName`、`guildId`）。

**訊息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**訊息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**訊息事件**（`message:preprocessed`）：`context.bodyForAgent`（最終強化後的本文）、`context.from`、`context.channelId`。

**啟動程序事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**工作階段修補事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅變更的欄位）、`context.cfg`。只有具權限的用戶端可以觸發修補事件。

**Compaction 事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 會新增 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 會觀察使用者發出 `/stop`；它是取消/命令生命週期，不是代理完成閘門。需要檢查自然最終答案並要求代理再執行一次的 plugins，應改用型別化 plugin 掛鉤 `before_agent_finalize`。請參閱 [Plugin 掛鉤](/zh-TW/plugins/hooks)。

**Gateway 生命週期事件**：`gateway:shutdown` 包含 `reason` 與 `restartExpectedMs`，並在 Gateway 關閉開始時觸發。`gateway:pre-restart` 包含相同內容，但只會在關閉屬於預期重新啟動的一部分，且提供有限的 `restartExpectedMs` 值時觸發。關閉期間，每個生命週期掛鉤的等待都是盡力而為且有界限，因此即使處理常式停滯，關閉仍會繼續。

## 掛鉤探索

掛鉤會從這些目錄探索，順序為覆寫優先順序由低到高：

1. **內建掛鉤**：隨 OpenClaw 發佈
2. **Plugin 掛鉤**：封裝在已安裝 plugins 內的掛鉤
3. **受管理掛鉤**：`~/.openclaw/hooks/`（使用者安裝，跨工作區共用）。來自 `hooks.internal.load.extraDirs` 的額外目錄共用此優先順序。
4. **工作區掛鉤**：`<workspace>/hooks/`（每個代理專屬，預設停用，直到明確啟用）

工作區掛鉤可以新增掛鉤名稱，但無法覆寫同名的內建、受管理或 plugin 提供的掛鉤。

Gateway 會在內部掛鉤完成設定之前，於啟動時略過內部掛鉤探索。使用 `openclaw hooks enable <name>` 啟用內建或受管理掛鉤、安裝掛鉤套件，或設定 `hooks.internal.enabled=true` 以選擇啟用。當你啟用一個具名掛鉤時，Gateway 只會載入該掛鉤的處理常式；`hooks.internal.enabled=true`、額外掛鉤目錄與舊版處理常式會選擇進行廣泛探索。

### 掛鉤套件

掛鉤套件是透過 `package.json` 中的 `openclaw.hooks` 匯出掛鉤的 npm 套件。使用以下命令安裝：

```bash
openclaw plugins install <path-or-spec>
```

Npm 規格僅限登錄檔（套件名稱 + 選用的精確版本或 dist-tag）。Git/URL/file 規格與 semver 範圍會被拒絕。

## 內建掛鉤

| 掛鉤                  | 事件                           | 功能                                                  |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | 將工作階段內容儲存到 `<workspace>/memory/`           |
| bootstrap-extra-files | `agent:bootstrap`              | 從 glob 模式注入額外啟動程序檔案                     |
| command-logger        | `command`                      | 將所有命令記錄到 `~/.openclaw/logs/commands.log`     |
| boot-md               | `gateway:startup`              | Gateway 啟動時執行 `BOOT.md`                         |

啟用任何內建掛鉤：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資訊

擷取最後 15 則使用者/助理訊息，透過 LLM 產生描述性檔名 slug，並使用主機本機日期儲存到 `<workspace>/memory/YYYY-MM-DD-slug.md`。需要設定 `workspace.dir`。

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

路徑會相對於工作區解析。只會載入可辨識的啟動程序基礎檔名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 詳細資訊

將每個斜線命令記錄到 `~/.openclaw/logs/commands.log`。

<a id="boot-md"></a>

### boot-md 詳細資訊

Gateway 啟動時，從作用中工作區執行 `BOOT.md`。

## Plugin 掛鉤

Plugins 可以透過 Plugin SDK 註冊型別化掛鉤以進行更深入整合：攔截工具呼叫、修改提示、控制訊息流程，以及更多功能。當你需要 `before_tool_call`、`before_agent_reply`、`before_install` 或其他程序內生命週期掛鉤時，請使用 plugin 掛鉤。

如需完整的 plugin 掛鉤參考，請參閱 [Plugin 掛鉤](/zh-TW/plugins/hooks)。

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

每個掛鉤的環境變數：

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

額外掛鉤目錄：

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
舊版 `hooks.internal.handlers` 陣列設定格式仍支援向後相容性，但新掛鉤應使用以探索為基礎的系統。
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

## 最佳實務

- **保持處理常式快速。** 掛鉤會在命令處理期間執行。對耗時工作使用 `void processInBackground(event)` 進行啟動後即不等待。
- **優雅處理錯誤。** 將有風險的操作包在 try/catch 中；不要拋出錯誤，讓其他處理常式可以執行。
- **及早篩選事件。** 如果事件類型/動作不相關，立即傳回。
- **使用特定事件鍵。** 偏好 `"events": ["command:new"]`，而非 `"events": ["command"]`，以降低額外負擔。

## 疑難排解

### 未探索到掛鉤

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### 掛鉤不符合資格

```bash
openclaw hooks info my-hook
```

檢查是否缺少二進位檔（PATH）、環境變數、設定值或作業系統相容性。

### 掛鉤未執行

1. 確認掛鉤已啟用：`openclaw hooks list`
2. 重新啟動你的 gateway 程序，讓掛鉤重新載入。
3. 檢查 Gateway 記錄：`./scripts/clawlog.sh | grep hook`

## 相關

- [CLI 參考：鉤子](/zh-TW/cli/hooks)
- [Webhook](/zh-TW/automation/cron-jobs#webhooks)
- [Plugin 鉤子](/zh-TW/plugins/hooks) — 行程內 Plugin 生命週期鉤子
- [設定](/zh-TW/gateway/configuration-reference#hooks)

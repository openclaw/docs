---
read_when:
    - 你想要為 /new、/reset、/stop 和代理生命週期事件設定事件驅動的自動化
    - 您想要建置、安裝或偵錯掛鉤
summary: Hooks：命令與生命週期事件的事件驅動自動化
title: 鉤子
x-i18n:
    generated_at: "2026-05-05T08:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Hook 是在 Gateway 內部發生事件時執行的小型指令碼。它們可從目錄探索，並可用 `openclaw hooks` 檢視。Gateway 只有在你啟用 Hook，或設定至少一個 Hook 項目、Hook 套件、舊版處理器或額外 Hook 目錄後，才會載入內部 Hook。

OpenClaw 中有兩種 Hook：

- **內部 Hook**（本頁）：在代理事件觸發時於 Gateway 內執行，例如 `/new`、`/reset`、`/stop` 或生命週期事件。
- **Webhook**：外部 HTTP 端點，可讓其他系統在 OpenClaw 中觸發工作。請參閱 [Webhook](/zh-TW/automation/cron-jobs#webhooks)。

Hook 也可以封裝在 Plugin 內。`openclaw hooks list` 會顯示獨立 Hook 和 Plugin 管理的 Hook。

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
| `session:compact:before` | Compaction 摘要歷史記錄之前                                |
| `session:compact:after`  | Compaction 完成之後                                        |
| `session:patch`          | 工作階段屬性被修改時                                       |
| `agent:bootstrap`        | 注入工作區啟動檔案之前                                     |
| `gateway:startup`        | 頻道啟動且 Hook 載入之後                                   |
| `gateway:shutdown`       | Gateway 關閉開始時                                         |
| `gateway:pre-restart`    | 預期的 Gateway 重新啟動之前                                |
| `message:received`       | 來自任何頻道的傳入訊息                                     |
| `message:transcribed`    | 音訊轉錄完成之後                                           |
| `message:preprocessed`   | 媒體與連結預處理完成或略過之後                             |
| `message:sent`           | 傳出訊息已送達                                             |

## 撰寫 Hook

### Hook 結構

每個 Hook 都是一個包含兩個檔案的目錄：

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

**中繼資料欄位** (`metadata.openclaw`)：

| 欄位       | 說明                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 的顯示 emoji                                     |
| `events`   | 要監聽的事件陣列                                     |
| `export`   | 要使用的具名匯出（預設為 `"default"`）               |
| `os`       | 必要平台（例如 `["darwin", "linux"]`）               |
| `requires` | 必要的 `bins`、`anyBins`、`env` 或 `config` 路徑      |
| `always`   | 略過資格檢查（布林值）                               |
| `install`  | 安裝方法                                             |

### 處理器實作

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

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（推入以傳送給使用者）以及 `context`（事件特定資料）。代理與工具 Plugin Hook 情境也可以包含 `trace`，這是一個唯讀、相容 W3C 的診斷追蹤情境，Plugin 可將其傳入結構化記錄以進行 OTEL 關聯。

### 事件情境重點

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**訊息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（供應商特定資料，包括 `senderId`、`senderName`、`guildId`）。對於類似命令的訊息，`context.content` 會優先使用非空白的命令本文，接著退回原始傳入本文與一般本文；它不包含僅代理使用的增強內容，例如對話串歷史記錄或連結摘要。

**訊息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**訊息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**訊息事件**（`message:preprocessed`）：`context.bodyForAgent`（最終增強本文）、`context.from`、`context.channelId`。

**啟動事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**工作階段修補事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅變更的欄位）、`context.cfg`。只有具特殊權限的用戶端可以觸發修補事件。

**Compaction 事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 會加入 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 會觀察使用者發出 `/stop`；它是取消/命令生命週期，而不是代理完成的閘門。需要檢查自然最終答案，並要求代理再執行一次的 Plugin，應改用型別化 Plugin Hook `before_agent_finalize`。請參閱 [Plugin Hook](/zh-TW/plugins/hooks)。

**Gateway 生命週期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，並在 Gateway 關閉開始時觸發。`gateway:pre-restart` 包含相同情境，但只會在關閉屬於預期重新啟動的一部分，且提供有限的 `restartExpectedMs` 值時觸發。在關閉期間，每個生命週期 Hook 的等待都是盡力而為且有界限，因此如果處理器停滯，關閉仍會繼續。

## Hook 探索

Hook 會依覆寫優先順序由低到高，從這些目錄探索：

1. **內建 Hook**：隨 OpenClaw 提供
2. **Plugin Hook**：封裝在已安裝 Plugin 內的 Hook
3. **受管理的 Hook**：`~/.openclaw/hooks/`（使用者安裝，跨工作區共用）。來自 `hooks.internal.load.extraDirs` 的額外目錄共用此優先順序。
4. **工作區 Hook**：`<workspace>/hooks/`（每個代理專用，預設停用，直到明確啟用）

工作區 Hook 可以新增 Hook 名稱，但不能覆寫同名的內建、受管理或 Plugin 提供的 Hook。

Gateway 會在啟動時略過內部 Hook 探索，直到設定內部 Hook 為止。使用 `openclaw hooks enable <name>` 啟用內建或受管理的 Hook、安裝 Hook 套件，或設定 `hooks.internal.enabled=true` 以選擇加入。當你啟用一個具名 Hook 時，Gateway 只會載入該 Hook 的處理器；`hooks.internal.enabled=true`、額外 Hook 目錄和舊版處理器會選擇加入廣泛探索。

### Hook 套件

掛鉤套件是 npm 套件，會透過 `package.json` 中的 `openclaw.hooks` 匯出掛鉤。使用以下命令安裝：

```bash
openclaw plugins install <path-or-spec>
```

Npm 規格僅限 registry（套件名稱 + 可選的精確版本或 dist-tag）。Git/URL/檔案規格與 semver 範圍會被拒絕。

## 內建掛鉤

| 掛鉤                  | 事件                                            | 功能                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | 將工作階段內容儲存到 `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | 從 glob 模式注入額外的 bootstrap 檔案          |
| command-logger        | `command`                                         | 將所有命令記錄到 `~/.openclaw/logs/commands.log`           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在工作階段 Compaction 開始/結束時傳送可見的聊天通知 |
| boot-md               | `gateway:startup`                                 | 在 Gateway 啟動時執行 `BOOT.md`                         |

啟用任何內建掛鉤：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資料

擷取最後 15 則使用者/助理訊息，並使用主機本機日期儲存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。記憶體擷取會在背景執行，因此 `/new` 和 `/reset` 的確認不會因讀取逐字稿或可選的 slug 產生而延遲。設定 `hooks.internal.entries.session-memory.llmSlug: true` 可使用已設定的模型產生描述性檔名 slug。需要設定 `workspace.dir`。

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

路徑會相對於工作區解析。只會載入可辨識的 bootstrap 基礎檔名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 詳細資料

將每個斜線命令記錄到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 詳細資料

當 OpenClaw 開始和完成壓縮工作階段逐字稿時，會將簡短狀態訊息傳送到目前對話。這讓長回合在聊天介面上較不令人困惑，因為使用者可以看到助理正在摘要內容，並會在 Compaction 後繼續。

<a id="boot-md"></a>

### boot-md 詳細資料

在 Gateway 啟動時，從作用中的工作區執行 `BOOT.md`。

## Plugin 掛鉤

Plugin 可以透過 Plugin SDK 註冊型別化掛鉤，以進行更深度的整合：
攔截工具呼叫、修改提示、控制訊息流程等等。
當你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他處理程序內生命週期掛鉤時，請使用 Plugin 掛鉤。

如需完整的 Plugin 掛鉤參考，請參閱 [Plugin 掛鉤](/zh-TW/plugins/hooks)。

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

額外的掛鉤目錄：

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
舊版 `hooks.internal.handlers` 陣列設定格式仍支援向後相容性，但新的掛鉤應使用以探索為基礎的系統。
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

- **讓 handler 保持快速。** Hooks 會在命令處理期間執行。使用 `void processInBackground(event)` 以 fire-and-forget 方式處理繁重工作。
- **妥善處理錯誤。** 將有風險的操作包在 try/catch 中；不要 throw，讓其他 handler 能繼續執行。
- **及早篩選事件。** 如果事件 type/action 不相關，請立即 return。
- **使用特定事件鍵。** 優先使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以降低開銷。

## 疑難排解

### Hook 未被發現

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

檢查是否缺少二進位檔（PATH）、環境變數、設定值或作業系統相容性。

### Hook 未執行

1. 確認 hook 已啟用：`openclaw hooks list`
2. 重新啟動你的 Gateway 程序，讓 hooks 重新載入。
3. 檢查 Gateway 記錄：`./scripts/clawlog.sh | grep hook`

## 相關

- [CLI 參考：hooks](/zh-TW/cli/hooks)
- [Webhooks](/zh-TW/automation/cron-jobs#webhooks)
- [Plugin hooks](/zh-TW/plugins/hooks) — in-process plugin 生命週期 hooks
- [設定](/zh-TW/gateway/configuration-reference#hooks)

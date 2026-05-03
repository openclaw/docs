---
read_when:
    - 你想要針對 /new、/reset、/stop 和代理程式生命週期事件進行事件驅動的自動化
    - 你想要建置、安裝或偵錯鉤子
summary: 鉤子：用於命令和生命週期事件的事件驅動自動化
title: 掛鉤
x-i18n:
    generated_at: "2026-05-03T21:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

鉤子是在 Gateway 內發生事件時執行的小型指令碼。它們可以從目錄中被探索，並可透過 `openclaw hooks` 檢查。Gateway 只有在你啟用鉤子，或設定至少一個鉤子項目、鉤子包、舊版處理常式，或額外的鉤子目錄後，才會載入內部鉤子。

OpenClaw 中有兩種鉤子：

- **內部鉤子**（本頁）：當代理事件觸發時在 Gateway 內執行，例如 `/new`、`/reset`、`/stop` 或生命週期事件。
- **Webhooks**：外部 HTTP 端點，可讓其他系統在 OpenClaw 中觸發工作。請參閱 [Webhooks](/zh-TW/automation/cron-jobs#webhooks)。

鉤子也可以封裝在 plugins 內。`openclaw hooks list` 會顯示獨立鉤子和由 Plugin 管理的鉤子。

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
| `session:compact:before` | 在 Compaction 摘要歷史記錄之前                             |
| `session:compact:after`  | 在 Compaction 完成之後                                     |
| `session:patch`          | 工作階段屬性被修改時                                       |
| `agent:bootstrap`        | 在注入工作區啟動檔案之前                                   |
| `gateway:startup`        | 頻道啟動且鉤子載入之後                                     |
| `gateway:shutdown`       | Gateway 關閉開始時                                         |
| `gateway:pre-restart`    | 在預期的 Gateway 重新啟動之前                              |
| `message:received`       | 來自任何頻道的傳入訊息                                     |
| `message:transcribed`    | 音訊轉錄完成之後                                           |
| `message:preprocessed`   | 媒體與連結前處理完成或被略過之後                           |
| `message:sent`           | 傳出訊息已送達                                             |

## 撰寫鉤子

### 鉤子結構

每個鉤子都是包含兩個檔案的目錄：

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

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（推入以傳送給使用者），以及 `context`（事件專屬資料）。代理與工具 Plugin 鉤子內容也可以包含 `trace`，這是唯讀且相容於 W3C 的診斷追蹤內容，plugins 可將其傳入結構化日誌以進行 OTEL 關聯。

### 事件內容重點

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**訊息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（供應商專屬資料，包含 `senderId`、`senderName`、`guildId`）。`context.content` 會優先使用類命令訊息中非空白的命令本文，接著退回原始傳入本文與一般本文；它不包含僅供代理使用的強化內容，例如執行緒歷史記錄或連結摘要。

**訊息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**訊息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**訊息事件**（`message:preprocessed`）：`context.bodyForAgent`（最終強化本文）、`context.from`、`context.channelId`。

**啟動事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**工作階段修補事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅變更的欄位）、`context.cfg`。只有具特權的用戶端可以觸發修補事件。

**Compaction 事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 會新增 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 會觀察使用者發出 `/stop`；它屬於取消/命令生命週期，不是代理最終化閘門。需要檢查自然最終答案並要求代理再執行一次的 plugins，應改用具型別的 Plugin 鉤子 `before_agent_finalize`。請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

**Gateway 生命週期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，並在 Gateway 關閉開始時觸發。`gateway:pre-restart` 包含相同內容，但只會在關閉屬於預期重新啟動的一部分，且提供有限的 `restartExpectedMs` 值時觸發。在關閉期間，每個生命週期鉤子的等待都是盡力而為且有界限，因此即使處理常式停滯，關閉仍會繼續。

## 鉤子探索

鉤子會依照覆寫優先順序由低到高，從這些目錄中被探索：

1. **內建鉤子**：隨 OpenClaw 一起提供
2. **Plugin 鉤子**：封裝在已安裝 plugins 內的鉤子
3. **受管理鉤子**：`~/.openclaw/hooks/`（使用者安裝，跨工作區共用）。來自 `hooks.internal.load.extraDirs` 的額外目錄會共用此優先順序。
4. **工作區鉤子**：`<workspace>/hooks/`（每個代理各自擁有，預設停用，直到明確啟用）

工作區鉤子可以新增鉤子名稱，但不能覆寫同名的內建、受管理或 Plugin 提供的鉤子。

Gateway 在啟動時會略過內部鉤子探索，直到設定內部鉤子為止。使用 `openclaw hooks enable <name>` 啟用內建或受管理鉤子、安裝鉤子包，或設定 `hooks.internal.enabled=true` 以選擇加入。當你啟用一個具名鉤子時，Gateway 只會載入該鉤子的處理常式；`hooks.internal.enabled=true`、額外鉤子目錄與舊版處理常式則會選擇加入廣泛探索。

### 鉤子包

鉤子包是透過 `package.json` 中的 `openclaw.hooks` 匯出鉤子的 npm 套件。使用下列命令安裝：

```bash
openclaw plugins install <path-or-spec>
```

Npm 規格僅限登錄檔（套件名稱加上選用的精確版本或 dist-tag）。Git/URL/file 規格與 semver 範圍會被拒絕。

## 內建鉤子

| 鉤子                  | 事件                                              | 功能                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`、`command:reset`                    | 將工作階段內容儲存到 `<workspace>/memory/`                    |
| bootstrap-extra-files | `agent:bootstrap`                                 | 從 glob 模式注入額外的啟動檔案                                |
| command-logger        | `command`                                         | 將所有命令記錄到 `~/.openclaw/logs/commands.log`              |
| compaction-notifier   | `session:compact:before`、`session:compact:after` | 在工作階段 Compaction 開始/結束時傳送可見的聊天通知           |
| boot-md               | `gateway:startup`                                 | Gateway 啟動時執行 `BOOT.md`                                  |

啟用任何內建鉤子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資料

擷取最後 15 則使用者/助理訊息，透過 LLM 產生描述性檔名字串，並使用主機本機日期儲存到 `<workspace>/memory/YYYY-MM-DD-slug.md`。需要設定 `workspace.dir`。

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

路徑會相對於工作區解析。只會載入可辨識的啟動基底檔名（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 詳細資料

將每個斜線命令記錄到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 詳細資料

在 OpenClaw 開始和完成壓縮工作階段逐字稿時，將簡短狀態訊息傳送到目前對話中。這可讓聊天介面上的長回合較不令人困惑，因為使用者可以看到助理正在摘要內容，並會在 Compaction 後繼續。

<a id="boot-md"></a>

### boot-md 詳細資料

Gateway 啟動時，從作用中的工作區執行 `BOOT.md`。

## Plugin 鉤子

Plugins 可以透過 Plugin SDK 註冊具型別鉤子，以進行更深入的整合：攔截工具呼叫、修改提示、控制訊息流程等。當你需要 `before_tool_call`、`before_agent_reply`、`before_install` 或其他處理程序內生命週期鉤子時，請使用 Plugin 鉤子。

完整的 Plugin 鉤子參考，請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

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

每個鉤子的環境變數：

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

額外鉤子目錄：

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
舊版 `hooks.internal.handlers` 陣列設定格式仍支援向後相容性，但新的鉤子應使用以探索為基礎的系統。
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

- **讓處理常式保持快速。** 鉤子會在命令處理期間執行。用 `void processInBackground(event)` 以 fire-and-forget 方式執行繁重工作。
- **妥善處理錯誤。** 將有風險的操作包在 try/catch 中；不要拋出錯誤，讓其他處理常式仍可執行。
- **及早篩選事件。** 如果事件類型/動作不相關，請立即返回。
- **使用特定事件鍵。** 偏好使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以降低額外負擔。

## 疑難排解

### 找不到鉤子

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### 鉤子不符合資格

```bash
openclaw hooks info my-hook
```

檢查是否缺少二進位檔（PATH）、環境變數、設定值，或作業系統相容性。

### 鉤子未執行

1. 確認鉤子已啟用：`openclaw hooks list`
2. 重新啟動你的 Gateway 程序，讓鉤子重新載入。
3. 檢查 Gateway 記錄：`./scripts/clawlog.sh | grep hook`

## 相關

- [CLI 參考：hooks](/zh-TW/cli/hooks)
- [Webhook](/zh-TW/automation/cron-jobs#webhooks)
- [Plugin 鉤子](/zh-TW/plugins/hooks) — 程序內 Plugin 生命週期鉤子
- [設定](/zh-TW/gateway/configuration-reference#hooks)

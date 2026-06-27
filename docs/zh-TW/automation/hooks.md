---
read_when:
    - 你想要針對 /new、/reset、/stop 與代理生命週期事件的事件驅動自動化
    - 你想要建置、安裝或偵錯鉤子
summary: Hooks：用於命令與生命週期事件的事件驅動自動化
title: 鉤子
x-i18n:
    generated_at: "2026-06-27T18:53:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

掛鉤是在閘道內部發生事件時執行的小型指令碼。它們可以從目錄中探索，並可透過 `openclaw hooks` 檢查。只有在你啟用掛鉤，或設定至少一個掛鉤項目、掛鉤套件、舊版處理常式或額外掛鉤目錄之後，閘道才會載入內部掛鉤。

OpenClaw 中有兩種掛鉤：

- **內部掛鉤**（本頁）：在代理事件觸發時於閘道內部執行，例如 `/new`、`/reset`、`/stop` 或生命週期事件。
- **網路鉤子**：外部 HTTP 端點，讓其他系統能在 OpenClaw 中觸發工作。請參閱[網路鉤子](/zh-TW/automation/cron-jobs#webhooks)。

掛鉤也可以封裝在外掛內。`openclaw hooks list` 會顯示獨立掛鉤和由外掛管理的掛鉤。

## 選擇正確介面

OpenClaw 有幾種看起來相似但解決不同問題的擴充介面：

| 如果你想要...                                                                                                     | 使用...                                | 原因                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 在 `/new` 儲存快照、記錄 `/reset`、在 `message:sent` 後呼叫外部 API，或加入粗略的操作員自動化 | 內部掛鉤（`HOOK.md`，本頁） | 檔案式掛鉤是為操作員管理的副作用和命令/生命週期自動化而設計 |
| 重寫提示、封鎖工具、取消外送訊息，或加入有序的中介軟體/政策                              | 透過 `api.on(...)` 的型別化外掛掛鉤  | 型別化掛鉤具有明確契約、優先順序、合併規則，以及封鎖/取消語意      |
| 加入僅用於遙測的匯出或可觀測性                                                                            | 診斷事件                     | 可觀測性是獨立的事件匯流排，不是政策掛鉤介面                              |

當你想要的自動化行為像小型已安裝整合時，請使用內部掛鉤。當你需要執行階段生命週期控制時，請使用型別化外掛掛鉤。

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

| 事件                    | 觸發時機                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 發出 `/new` 命令                                      |
| `command:reset`          | 發出 `/reset` 命令                                    |
| `command:stop`           | 發出 `/stop` 命令                                     |
| `command`                | 任何命令事件（一般監聽器）                       |
| `session:compact:before` | 壓縮摘要歷史記錄之前                       |
| `session:compact:after`  | 壓縮完成之後                                 |
| `session:patch`          | 工作階段屬性被修改時                       |
| `agent:bootstrap`        | 工作區啟動檔案注入之前              |
| `gateway:startup`        | 頻道啟動且掛鉤載入之後                  |
| `gateway:shutdown`       | 閘道關閉開始時                               |
| `gateway:pre-restart`    | 預期的閘道重新啟動之前                         |
| `message:received`       | 來自任何頻道的傳入訊息                           |
| `message:transcribed`    | 音訊轉錄完成之後                        |
| `message:preprocessed`   | 媒體和連結前處理完成或略過之後 |
| `message:sent`           | 外送訊息已送達                                 |

## 撰寫掛鉤

### 掛鉤結構

每個掛鉤都是包含兩個檔案的目錄：

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

| 欄位      | 說明                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | 命令列介面的顯示 emoji                                |
| `events`   | 要監聽的事件陣列                        |
| `export`   | 要使用的具名匯出（預設為 `"default"`）        |
| `os`       | 必要平台（例如 `["darwin", "linux"]`）     |
| `requires` | 必要的 `bins`、`anyBins`、`env` 或 `config` 路徑 |
| `always`   | 略過資格檢查（布林值）                  |
| `install`  | 安裝方法                                 |

### 處理常式實作

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（僅在可回覆介面於此推送回覆）以及 `context`（事件特定資料）。代理和工具外掛掛鉤情境也可以包含 `trace`，這是一個唯讀、相容 W3C 的診斷追蹤情境，外掛可將其傳入結構化記錄以進行 OTEL 關聯。

`event.messages` 只會在可回覆介面（例如
`command:*` 和 `message:received`）上自動送達。僅生命週期事件（例如
`agent:bootstrap`、`session:*`、`gateway:*` 或 `message:sent`）沒有
回覆頻道，且會忽略推送的訊息。

### 事件情境重點

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**訊息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（包含 `senderId`、`senderName`、`guildId` 的提供者特定資料）。`context.content` 會優先使用類命令訊息中的非空白命令本文，接著回退到原始傳入本文和一般本文；它不包含僅供代理使用的強化內容，例如對話串歷史或連結摘要。

**訊息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**訊息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**訊息事件**（`message:preprocessed`）：`context.bodyForAgent`（最終強化本文）、`context.from`、`context.channelId`。

**啟動事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**工作階段修補事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅變更的欄位）、`context.cfg`。只有具特權的用戶端可以觸發修補事件。

**壓縮事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 會加入 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 觀察使用者發出 `/stop`；它是取消/命令
生命週期，而不是代理最終化閘門。需要檢查
自然最終答案並要求代理再進行一次處理的外掛，應改用型別化
外掛掛鉤 `before_agent_finalize`。請參閱[外掛掛鉤](/zh-TW/plugins/hooks)。

**閘道生命週期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，並在閘道關閉開始時觸發。`gateway:pre-restart` 包含相同情境，但只有在關閉是預期重新啟動的一部分，且提供有限的 `restartExpectedMs` 值時才會觸發。關閉期間，每個生命週期掛鉤等待都是盡力而為且有界限，因此即使處理常式停滯，關閉也會繼續。預設等待預算是 `gateway:shutdown` 5 秒，`gateway:pre-restart` 10 秒。

在頻道仍可用時，使用 `gateway:pre-restart` 傳送簡短的重新啟動通知：

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件與其餘關閉序列之間，閘道也會針對程序停止時仍處於作用中的每個工作階段觸發型別化 `session_end` 外掛掛鉤。事件的 `reason` 在一般 SIGTERM/SIGINT 停止時為 `shutdown`，在關閉是預期重新啟動的一部分而排程時為 `restart`。此耗盡程序有界限，因此緩慢的 `session_end` 處理常式無法阻擋程序結束；已透過取代 / 重設 / 刪除 / 壓縮完成最終化的工作階段會被略過，以避免重複觸發。

## 掛鉤探索

掛鉤會依覆寫優先順序遞增，從以下目錄探索：

1. **內建掛鉤**：隨 OpenClaw 出貨
2. **外掛掛鉤**：封裝在已安裝外掛內的掛鉤
3. **受管理掛鉤**：`~/.openclaw/hooks/`（使用者安裝，跨工作區共用）。來自 `hooks.internal.load.extraDirs` 的額外目錄共用此優先順序。
4. **工作區掛鉤**：`<workspace>/hooks/`（每個代理，預設停用，直到明確啟用）

工作區掛鉤可以新增掛鉤名稱，但無法覆寫同名的內建、受管理或外掛提供掛鉤。

閘道在啟動時會略過內部掛鉤探索，直到設定內部掛鉤為止。使用 `openclaw hooks enable <name>` 啟用內建或受管理掛鉤、安裝掛鉤套件，或設定 `hooks.internal.enabled=true` 以選擇啟用。當你啟用一個具名掛鉤時，閘道只會載入該掛鉤的處理常式；`hooks.internal.enabled=true`、額外掛鉤目錄和舊版處理常式會選擇啟用廣泛探索。

### 掛鉤套件

掛鉤套件是透過 `package.json` 中的 `openclaw.hooks` 匯出掛鉤的 npm 套件。使用以下命令安裝：

```bash
openclaw plugins install <path-or-spec>
```

Npm 規格僅限登錄檔（套件名稱 + 選用的精確版本或 dist-tag）。Git/URL/檔案規格和 semver 範圍會被拒絕。

## 內建掛鉤

| Hook                  | 事件                                              | 作用                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | 將工作階段上下文儲存到 `<workspace>/memory/`                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | 從 glob 模式注入額外的啟動檔案                               |
| command-logger        | `command`                                         | 將所有命令記錄到 `~/.openclaw/logs/commands.log`              |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在工作階段壓縮開始/結束時傳送可見的聊天通知                  |
| boot-md               | `gateway:startup`                                 | 在閘道啟動時執行 `BOOT.md`                                   |

啟用任何內建 Hook：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資訊

擷取最後 15 則使用者/助理訊息，並使用主機本機日期儲存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。記憶擷取會在背景執行，因此 `/new` 和 `/reset` 的確認不會因為讀取逐字稿或選用的 slug 產生而延遲。設定 `hooks.internal.entries.session-memory.llmSlug: true` 可使用已設定的模型產生描述性的檔名 slug。需要設定 `workspace.dir`。

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

### command-logger 詳細資訊

將每個斜線命令記錄到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 詳細資訊

當 OpenClaw 開始和完成壓縮工作階段逐字稿時，會向目前對話傳送簡短狀態訊息。這讓聊天介面上的長回合較不令人困惑，因為使用者可以看到助理正在摘要上下文，並會在壓縮後繼續。

<a id="boot-md"></a>

### boot-md 詳細資訊

在閘道啟動時，從作用中的工作區執行 `BOOT.md`。

## 外掛 Hook

外掛可以透過外掛 SDK 註冊型別化 Hook，以進行更深入的整合：
攔截工具呼叫、修改提示、控制訊息流程等。
當你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他處理程序內生命週期 Hook 時，請使用外掛 Hook。

外掛管理的內部 Hook 則不同：它們參與本頁的
粗略命令/生命週期事件系統，並在 `openclaw hooks list` 中顯示為
`plugin:<id>`。請將這些用於副作用以及與 Hook 套件相容，而不是
用於有序中介軟體或政策閘門。

完整的外掛 Hook 參考，請參閱[外掛 Hook](/zh-TW/plugins/hooks)。

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

各 Hook 的環境變數：

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

額外的 Hook 目錄：

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
舊版 `hooks.internal.handlers` 陣列設定格式仍支援向後相容，但新的 Hook 應使用以探索為基礎的系統。
</Note>

## 命令列介面參考

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

- **讓處理常式保持快速。** Hook 會在命令處理期間執行。使用 `void processInBackground(event)` 以 fire-and-forget 方式處理繁重工作。
- **優雅地處理錯誤。** 將有風險的操作包在 try/catch 中；不要拋出錯誤，讓其他處理常式仍可執行。
- **及早篩選事件。** 如果事件類型/動作不相關，請立即返回。
- **使用具體的事件鍵。** 偏好使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以降低負擔。

## 疑難排解

### 未探索到 Hook

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

1. 確認 Hook 已啟用：`openclaw hooks list`
2. 重新啟動你的閘道處理程序，讓 Hook 重新載入。
3. 檢查閘道記錄：`./scripts/clawlog.sh | grep hook`

## 相關

- [命令列介面參考：hooks](/zh-TW/cli/hooks)
- [網路鉤子](/zh-TW/automation/cron-jobs#webhooks)
- [外掛 Hook](/zh-TW/plugins/hooks) — 處理程序內外掛生命週期 Hook
- [設定](/zh-TW/gateway/configuration-reference#hooks)

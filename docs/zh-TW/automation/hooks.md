---
read_when:
    - 你想要針對 /new、/reset、/stop 與代理生命週期事件的事件驅動自動化
    - 你想要建置、安裝或偵錯鉤子
summary: 鉤子：命令與生命週期事件的事件驅動自動化
title: 鉤子
x-i18n:
    generated_at: "2026-07-06T10:46:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59dbead00dcdbd90532643e79f3e66bcc1ecc3a2e474c8d3d2916b47530178a2
    source_path: automation/hooks.md
    workflow: 16
---

Hook 是在代理事件觸發時於閘道內執行的小型指令碼：像是 `/new`、`/reset`、`/stop` 這類命令、工作階段壓縮、閘道生命週期，以及訊息流程。它們會從目錄中探索，並透過 `openclaw hooks` 管理。只有在你啟用 Hook，或設定至少一個 Hook 項目、Hook 套件、舊版處理常式或額外 Hook 目錄之後，閘道才會載入內部 Hook。

OpenClaw 中有兩種 Hook：

- **內部 Hook**（本頁）：在代理事件觸發時於閘道內執行。
- **網路鉤子**：外部 HTTP 端點，可讓其他系統在 OpenClaw 中觸發工作。請參閱[網路鉤子](/zh-TW/automation/cron-jobs#webhooks)。

Hook 也可以封裝在外掛內。`openclaw hooks list` 會顯示獨立 Hook 和外掛管理的 Hook（顯示為 `plugin:<id>`）。

## 選擇正確的介面

OpenClaw 有幾個看起來相似、但解決不同問題的擴充介面：

| 如果你想要...                                                                                                     | 使用...                                | 原因                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 在 `/new` 時儲存快照、記錄 `/reset`、在 `message:sent` 後呼叫外部 API，或加入粗略的操作員自動化 | 內部 Hook（`HOOK.md`，本頁） | 檔案式 Hook 是為操作員管理的副作用與命令/生命週期自動化而設計 |
| 重寫提示、阻擋工具、取消傳出訊息，或加入有序的中介軟體/政策                              | 透過 `api.on(...)` 的型別化外掛 Hook  | 型別化 Hook 具備明確合約、優先順序、合併規則，以及阻擋/取消語意      |
| 加入僅用於遙測的匯出或可觀測性                                                                            | 診斷事件                     | 可觀測性是獨立的事件匯流排，不是政策 Hook 介面                              |

當你想要像小型已安裝整合一樣運作的自動化時，請使用內部 Hook。當你需要執行階段生命週期控制時，請使用型別化外掛 Hook。

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

Hook 會訂閱此表中的特定鍵，或訂閱裸家族名稱
（`command`、`session`、`agent`、`gateway`、`message`）以接收該家族中的每個動作。OpenClaw 核心不會發出其他事件，因此任何其他名稱幾乎
總是拼字錯誤，會讓 Hook 靜默失效（只有外掛發出
自訂事件時才可能觸發它）。Hook 載入器會針對這類名稱
記錄警告（例如 `command:nwe`），而 `openclaw hooks info <name>` 也會標示它們，因此
從未執行的 Hook 可以被診斷。

| 事件                    | 觸發時機                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 發出 `/new` 命令                                      |
| `command:reset`          | 發出 `/reset` 命令                                    |
| `command:stop`           | 發出 `/stop` 命令                                     |
| `command`                | 任何命令事件（一般監聽器）                       |
| `session:compact:before` | 壓縮摘要歷史之前                       |
| `session:compact:after`  | 壓縮完成之後                                 |
| `session:patch`          | 工作階段屬性被修改時                       |
| `agent:bootstrap`        | 工作區啟動檔案注入之前              |
| `gateway:startup`        | 頻道啟動且 Hook 載入之後                  |
| `gateway:shutdown`       | 閘道關閉開始時                               |
| `gateway:pre-restart`    | 預期的閘道重新啟動之前                         |
| `message:received`       | 來自任何頻道的傳入訊息                           |
| `message:transcribed`    | 音訊轉錄完成之後                        |
| `message:preprocessed`   | 媒體與連結前處理完成或略過之後 |
| `message:sent`           | 嘗試傳送傳出訊息（`context.success` 具有結果） |

## 撰寫 Hook

### Hook 結構

每個 Hook 都是一個包含兩個檔案的目錄：

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

處理常式檔案可以是 `handler.ts`、`handler.js`、`index.ts` 或 `index.js`。

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
| `export`   | 要使用的命名匯出（預設為 `"default"`）        |
| `os`       | 必要平台（例如 `["darwin", "linux"]`）     |
| `requires` | 必要的 `bins`、`anyBins`、`env` 或 `config` 路徑 |
| `always`   | 略過資格檢查（布林值）                  |
| `hookKey`  | 設定鍵覆寫（預設為 Hook 名稱）      |
| `homepage` | `openclaw hooks info` 顯示的文件 URL              |
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

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages` 和 `context`（事件特定資料）。代理與工具 Hook 的型別化外掛 Hook 情境也可以包含 `trace`，這是唯讀的 W3C 相容診斷追蹤情境，外掛可將其傳入結構化記錄，以便進行 OTEL 關聯。

推送到 `event.messages` 的字串只會針對
`command:new` 和 `command:reset` 傳回聊天（路由為對原始
對話的回覆），以及針對 `session:compact:before` / `session:compact:after`
（作為壓縮狀態通知傳送）。所有其他事件，包括
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch` 和
`gateway:*`，都會忽略推送的訊息。

### 事件情境重點

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**命令事件**（`command:stop`）：`context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**訊息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（供應者特定資料，包括 `senderId`、`senderName`、`guildId`）。`context.content` 會優先使用類似命令訊息中的非空白命令本文，接著退回原始傳入本文與通用本文；它不包含僅供代理使用的增強內容，例如對話串歷史或連結摘要。

**訊息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`，以及傳送失敗時的 `context.error`。

**訊息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**訊息事件**（`message:preprocessed`）：`context.bodyForAgent`（最終增強本文）、`context.from`、`context.channelId`。

**啟動事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**工作階段修補事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅變更的欄位）、`context.cfg`。只有具特殊權限的用戶端可以觸發修補事件；情境是複本，因此處理常式無法變更即時工作階段項目。

**壓縮事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 會加入 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 會觀察使用者發出 `/stop`；它是取消/命令
生命週期，不是代理最終化閘門。需要檢查
自然最終回答並要求代理再執行一次的外掛，應改用型別化
外掛 Hook `before_agent_finalize`。請參閱[外掛 Hook](/zh-TW/plugins/hooks)。

**閘道生命週期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，並在閘道關閉開始時觸發。`gateway:pre-restart` 包含相同情境，但只會在關閉屬於預期重新啟動的一部分，且提供有限的 `restartExpectedMs` 值時觸發。關閉期間，每個生命週期 Hook 的等待都是盡力而為且有界限，因此若處理常式停滯，關閉仍會繼續。預設等待預算是 `gateway:shutdown` 5 秒，`gateway:pre-restart` 10 秒。

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

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件與其餘關閉序列之間，閘道也會針對程序停止時仍處於作用中的每個工作階段觸發型別化 `session_end` 外掛 Hook。對於一般 SIGTERM/SIGINT 停止，事件的 `reason` 是 `shutdown`；當關閉是預期重新啟動的一部分時，則是 `restart`。此排空流程有界限，因此緩慢的 `session_end` 處理常式無法阻擋程序結束，而已透過替換 / 重設 / 刪除 / 壓縮最終化的工作階段會被略過，以避免重複觸發。

## Hook 探索

Hook 會從四個來源探索：

1. **內建 Hook**：隨 OpenClaw 出貨
2. **外掛 Hook**：封裝在已安裝的外掛內；可以覆寫同名的內建 Hook
3. **受管理 Hook**：`~/.openclaw/hooks/`（使用者安裝，跨工作區共用）；可以覆寫內建和外掛 Hook。來自 `hooks.internal.load.extraDirs` 的額外目錄也共用此優先順序。
4. **工作區 Hook**：`<workspace>/hooks/`（每個代理專屬，預設停用，直到明確啟用）

工作區 Hook 可以新增 Hook 名稱，但不能覆寫同名的內建、受管理或外掛提供的 Hook。

閘道在啟動時會略過內部 Hook 探索，直到設定內部 Hook 為止。使用 `openclaw hooks enable <name>` 啟用內建或受管理 Hook、安裝 Hook 套件，或設定 `hooks.internal.enabled=true` 以選擇啟用。當你啟用一個命名 Hook 時，閘道只會載入該 Hook 的處理常式；`hooks.internal.enabled=true`、額外 Hook 目錄和舊版處理常式則會選擇啟用廣泛探索。

### Hook 套件

Hook 套件是透過 `package.json` 中的 `openclaw.hooks` 匯出 Hook 的 npm 套件。安裝方式：

```bash
openclaw plugins install <path-or-spec>
```

Npm 規格僅限登錄檔（套件名稱 + 選用的精確版本或 dist-tag）。Git/URL/file 規格與 semver 範圍會被拒絕。較舊的 `openclaw hooks install` 與 `openclaw hooks update` 命令已棄用，作為 `openclaw plugins install` / `openclaw plugins update` 的別名。

## 內建鉤子

| 鉤子                  | 事件                                            | 功能                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | 將工作階段內容儲存到 `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | 從 glob 模式注入額外的啟動程序檔案          |
| command-logger        | `command`                                         | 將所有命令記錄到 `~/.openclaw/logs/commands.log`           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在工作階段壓縮開始/結束時傳送可見的聊天通知 |
| boot-md               | `gateway:startup`                                 | 在閘道啟動時執行 `BOOT.md`                         |

啟用任何內建鉤子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資訊

擷取最後的使用者/助理訊息（預設 15 則，可透過 `hooks.internal.entries.session-memory.messages` 設定），並使用主機本機日期將它們儲存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。記憶擷取會在背景執行，因此 `/new` 與 `/reset` 確認不會因逐字稿讀取或選用的 slug 產生而延遲。設定 `hooks.internal.entries.session-memory.llmSlug: true` 可使用已設定的模型產生描述性檔名 slug（無法使用時會退回時間戳記 slug）。需要已設定 `workspace.dir`。

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

`patterns` 與 `files` 可作為 `paths` 的別名。路徑會相對於工作區解析，且必須保持在工作區內。只會載入可辨識的啟動程序基礎名稱（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 詳細資訊

將每個斜線命令記錄為 JSON 行（時間戳記、動作、工作階段鍵、傳送者 ID、來源）到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 詳細資訊

當 OpenClaw 開始和完成壓縮工作階段逐字稿時，會將簡短狀態訊息傳送到目前對話。這讓聊天介面上的長回合較不容易混淆，因為使用者可以看到助理正在摘要上下文，並會在壓縮後繼續。

<a id="boot-md"></a>

### boot-md 詳細資訊

在閘道啟動時，針對每個已設定的代理範圍執行 `BOOT.md`，前提是該檔案存在於該代理解析後的工作區中。

## 外掛鉤子

外掛可以透過外掛 SDK 註冊型別化鉤子，以進行更深入的整合：
攔截工具呼叫、修改提示、控制訊息流程等。
當你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他程序內生命週期鉤子時，請使用外掛鉤子。

外掛管理的內部鉤子則不同：它們參與本頁的
粗略命令/生命週期事件系統，並在 `openclaw hooks list` 中顯示為
`plugin:<id>`。請將它們用於副作用以及與鉤子套件的相容性，而不是
用於有序中介軟體或政策關卡。

完整的外掛鉤子參考，請參閱[外掛鉤子](/zh-TW/plugins/hooks)。

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

每個鉤子的環境值會滿足鉤子的 `requires.env` 資格檢查（連同程序環境），處理常式也可以從其鉤子設定項目讀取這些值：

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

額外的鉤子目錄：

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
舊版 `hooks.internal.handlers` 陣列設定格式仍支援向後相容性，但新的鉤子應使用基於探索的系統。
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

## 最佳實務

- **保持處理常式快速。** 鉤子會在命令處理期間執行。對繁重工作使用 `void processInBackground(event)` 以即發即忘方式處理。
- **優雅地處理錯誤。** 將有風險的操作包在 try/catch 中；不要擲出錯誤，讓其他處理常式可以執行。
- **及早篩選事件。** 如果事件類型/動作不相關，請立即返回。
- **使用特定事件鍵。** 偏好 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以降低額外負擔。

## 疑難排解

### 未探索到鉤子

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

檢查是否缺少二進位檔（PATH）、環境變數、設定值或 OS 相容性。

### 鉤子未執行

1. 確認鉤子已啟用：`openclaw hooks list`
2. 重新啟動你的閘道程序，讓鉤子重新載入。
3. 檢查閘道記錄：`openclaw logs --follow | grep -i hook`

## 相關

- [命令列介面參考：hooks](/zh-TW/cli/hooks)
- [網路鉤子](/zh-TW/automation/cron-jobs#webhooks)
- [外掛鉤子](/zh-TW/plugins/hooks) — 程序內外掛生命週期鉤子
- [設定](/zh-TW/gateway/configuration-reference#hooks)

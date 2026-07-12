---
read_when:
    - 你想要針對 /new、/reset、/stop 與代理生命週期事件進行事件驅動自動化
    - 你想要建置、安裝或偵錯鉤子
summary: 鉤子：針對命令與生命週期事件的事件驅動自動化
title: 鉤子
x-i18n:
    generated_at: "2026-07-12T14:17:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hook 是在代理事件觸發時於閘道內執行的小型指令碼：例如 `/new`、`/reset`、`/stop` 等命令、工作階段壓縮、閘道生命週期和訊息流程。系統會從目錄中探索這些 Hook，並透過 `openclaw hooks` 管理。只有在你啟用 Hook，或設定至少一個 Hook 項目、Hook 套件、舊版處理常式或額外 Hook 目錄後，閘道才會載入內部 Hook。

OpenClaw 中有兩種 Hook：

- **內部 Hook**（本頁）：在代理事件觸發時於閘道內執行。
- **網路鉤子**：讓其他系統能觸發 OpenClaw 工作的外部 HTTP 端點。請參閱[網路鉤子](/zh-TW/automation/cron-jobs#webhooks)。

Hook 也可以封裝在外掛內。`openclaw hooks list` 會同時顯示獨立 Hook 和由外掛管理的 Hook（顯示為 `plugin:<id>`）。

## 選擇正確的擴充介面

OpenClaw 有數種看似相近、但解決不同問題的擴充介面：

| 如果你想要……                                                                                                      | 使用……                                | 原因                                                                                       |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 在 `/new` 時儲存快照、記錄 `/reset`、在 `message:sent` 後呼叫外部 API，或加入粗粒度的操作員自動化 | 內部 Hook（`HOOK.md`，本頁） | 檔案型 Hook 適用於由操作員管理的副作用，以及命令／生命週期自動化 |
| 重寫提示、封鎖工具、取消外送訊息，或加入有順序的中介軟體／政策                              | 透過 `api.on(...)` 使用型別化外掛 Hook  | 型別化 Hook 具有明確的合約、優先順序、合併規則，以及封鎖／取消語意      |
| 僅加入遙測匯出或可觀測性                                                                            | 診斷事件                     | 可觀測性使用獨立的事件匯流排，而不是政策 Hook 介面                              |

若你需要行為如同小型已安裝整合的自動化，請使用內部 Hook。若你需要控制執行階段生命週期，請使用型別化外掛 Hook。

## 快速開始

```bash
# 列出可用的 Hook
openclaw hooks list

# 啟用 Hook
openclaw hooks enable session-memory

# 檢查 Hook 狀態
openclaw hooks check

# 取得詳細資訊
openclaw hooks info session-memory
```

## 事件類型

Hook 會訂閱此表中的特定鍵，或訂閱單獨的系列名稱
（`command`、`session`、`agent`、`gateway`、`message`），以接收
該系列中的所有動作。OpenClaw 核心不會發出其他事件，因此任何其他名稱幾乎
一定都是拼字錯誤，並會使 Hook 在沒有提示的情況下失效（只有發出
自訂事件的外掛才能觸發它）。Hook 載入器會針對這類名稱
（例如 `command:nwe`）記錄警告，而 `openclaw hooks info <name>` 也會標示它們，因此
可診斷從未執行的 Hook。

| 事件                    | 觸發時機                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 發出 `/new` 命令時                                      |
| `command:reset`          | 發出 `/reset` 命令時                                    |
| `command:stop`           | 發出 `/stop` 命令時                                     |
| `command`                | 任何命令事件（一般監聽器）                       |
| `session:compact:before` | 壓縮摘要歷史記錄之前                       |
| `session:compact:after`  | 壓縮完成之後                                 |
| `session:patch`          | 修改工作階段屬性時                       |
| `agent:bootstrap`        | 注入工作區啟動檔案之前              |
| `gateway:startup`        | 頻道啟動且 Hook 載入之後                  |
| `gateway:shutdown`       | 閘道開始關閉時                               |
| `gateway:pre-restart`    | 預期重新啟動閘道之前                         |
| `message:received`       | 來自任何頻道的傳入訊息                           |
| `message:transcribed`    | 音訊轉錄完成之後                        |
| `message:preprocessed`   | 媒體和連結預處理完成或略過之後 |
| `message:sent`           | 嘗試外送時（結果位於 `context.success`） |

## 撰寫 Hook

### Hook 結構

每個 Hook 都是一個包含兩個檔案的目錄：

```text
my-hook/
├── HOOK.md          # 中繼資料 + 文件
└── handler.ts       # 處理常式實作
```

處理常式檔案可以是 `handler.ts`、`handler.js`、`index.ts` 或 `index.js`。

### HOOK.md 格式

```markdown
---
name: my-hook
description: "此 Hook 功能的簡短說明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# 我的 Hook

詳細文件寫在這裡。
```

**中繼資料欄位**（`metadata.openclaw`）：

| 欄位      | 說明                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | 命令列介面的顯示表情符號                                |
| `events`   | 要監聽的事件陣列                        |
| `export`   | 要使用的具名匯出（預設為 `"default"`）        |
| `os`       | 必要的平台（例如 `["darwin", "linux"]`）     |
| `requires` | 必要的 `bins`、`anyBins`、`env` 或 `config` 路徑 |
| `always`   | 略過資格檢查（布林值）                  |
| `hookKey`  | 設定鍵覆寫（預設為 Hook 名稱）      |
| `homepage` | `openclaw hooks info` 顯示的文件 URL              |
| `install`  | 安裝方式                                 |

### 處理常式實作

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] 已觸發新命令`);
  // 你的邏輯寫在這裡

  // 可選：在可回覆的介面傳送回覆
  event.messages.push("Hook 已執行！");
};

export default handler;
```

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages` 和 `context`（事件特定資料）。代理和工具 Hook 的型別化外掛 Hook 情境也可以包含 `trace`，這是唯讀且相容 W3C 的診斷追蹤情境，外掛可將其傳入結構化記錄，以進行 OTEL 關聯。

只有對 `command:new` 和 `command:reset` 而言，推送至 `event.messages` 的字串才會
傳回聊天（路由為對原始
對話的回覆）；對 `session:compact:before`／`session:compact:after` 而言，
則會作為壓縮狀態通知傳送。所有其他事件，包括
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch` 和
`gateway:*`，都會忽略推送的訊息。

### 事件情境重點

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**命令事件**（`command:stop`）：`context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**訊息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（供應商特定資料，包括 `senderId`、`senderName`、`guildId`）。對於類似命令的訊息，`context.content` 會優先使用非空白的命令本文，然後依序回退至原始傳入本文和一般本文；它不包含僅供代理使用的擴充資訊，例如討論串歷史記錄或連結摘要。

**訊息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`，以及傳送失敗時的 `context.error`。

**訊息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**訊息事件**（`message:preprocessed`）：`context.bodyForAgent`（最終擴充本文）、`context.from`、`context.channelId`。

**啟動事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**工作階段修補事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅包含已變更欄位）、`context.cfg`。只有具特殊權限的用戶端可以觸發修補事件；情境是複本，因此處理常式無法變更即時工作階段項目。

**壓縮事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 另外包含 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 會觀察使用者發出 `/stop`；它屬於取消／命令
生命週期，而不是代理完成閘門。需要檢查
自然最終答案並要求代理再處理一次的外掛，應改用型別化
外掛 Hook `before_agent_finalize`。請參閱[外掛 Hook](/zh-TW/plugins/hooks)。

**閘道生命週期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，並於閘道開始關閉時觸發。`gateway:pre-restart` 包含相同情境，但只會在關閉屬於預期重新啟動的一部分，且提供有限的 `restartExpectedMs` 值時觸發。關閉期間，等待每個生命週期 Hook 都採盡力而為且有時間上限，因此若處理常式停滯，關閉程序仍會繼續。`gateway:shutdown` 的預設等待時間預算為 5 秒，`gateway:pre-restart` 則為 10 秒。

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
    `閘道將在約 ${restartInSeconds} 秒後重新啟動（${event.context.reason}）。請立即建立檢查點。`,
  ]);
}
```

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件與其餘關閉程序之間，閘道也會針對程序停止時仍在活動中的每個工作階段，觸發型別化的 `session_end` 外掛 Hook。一般 SIGTERM／SIGINT 停止時，事件的 `reason` 為 `shutdown`；如果關閉是預期重新啟動的一部分，則為 `restart`。此清空程序有時間上限，因此緩慢的 `session_end` 處理常式無法阻止程序結束；已透過取代／重設／刪除／壓縮完成最終處理的工作階段則會略過，以避免重複觸發。

## Hook 探索

系統會從四個來源探索 Hook：

1. **內建 Hook**：隨 OpenClaw 提供
2. **外掛 Hook**：封裝於已安裝的外掛內；可以覆寫同名的內建 Hook
3. **受管理的 Hook**：`~/.openclaw/hooks/`（由使用者安裝，跨工作區共用）；可以覆寫內建和外掛 Hook。來自 `hooks.internal.load.extraDirs` 的額外目錄也具有相同優先順序。
4. **工作區 Hook**：`<workspace>/hooks/`（每個代理各自獨立，預設停用，直到明確啟用）

工作區 Hook 可以加入新的 Hook 名稱，但不能覆寫同名的內建、受管理或外掛提供的 Hook。

在設定內部 Hook 之前，閘道啟動時會略過內部 Hook 探索。使用 `openclaw hooks enable <name>` 啟用內建或受管理的 Hook、安裝 Hook 套件，或設定 `hooks.internal.enabled=true` 以選擇啟用。啟用一個具名 Hook 時，閘道只會載入該 Hook 的處理常式；`hooks.internal.enabled=true`、額外 Hook 目錄和舊版處理常式則會選擇啟用廣泛探索。

### Hook 套件

Hook 套件是透過 `package.json` 中的 `openclaw.hooks` 匯出 Hook 的 npm 套件。安裝方式：

```bash
openclaw plugins install <path-or-spec>
```

Npm 規格僅限登錄檔（套件名稱 + 選用的確切版本或 dist-tag）。Git／URL／檔案規格與 semver 範圍會遭拒絕。舊版的 `openclaw hooks install` 和 `openclaw hooks update` 命令已棄用，分別是 `openclaw plugins install`／`openclaw plugins update` 的別名。

## 內建鉤子

| 鉤子                  | 事件                                              | 功能                                                         |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | 將工作階段情境儲存至 `<workspace>/memory/`                   |
| bootstrap-extra-files | `agent:bootstrap`                                 | 從 glob 模式注入額外的啟動載入檔案                          |
| command-logger        | `command`                                         | 將所有命令記錄至 `~/.openclaw/logs/commands.log`             |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在工作階段壓縮開始／結束時傳送可見的聊天通知                |
| boot-md               | `gateway:startup`                                 | 在閘道啟動時執行 `BOOT.md`                                  |

啟用任一內建鉤子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資訊

擷取最近的使用者／助理訊息（預設為 15 則，可透過 `hooks.internal.entries.session-memory.messages` 設定），並使用主機本機日期將其儲存至 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。記憶擷取會在背景執行，因此 `/new` 和 `/reset` 的確認回應不會因讀取逐字稿或選用的 slug 產生作業而延遲。將 `hooks.internal.entries.session-memory.llmSlug: true` 設定為產生描述性的檔名 slug，並可選擇將 `hooks.internal.entries.session-memory.model` 設為已設定的別名（例如 `sonnet`）、代理程式預設供應商上的純模型 ID，或 `provider/model` 參照。省略 `model` 時，slug 產生會使用代理程式的預設模型；若無法使用，則改用時間戳記 slug。必須已設定 `workspace.dir`。

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

`patterns` 和 `files` 可作為 `paths` 的別名。路徑會以工作區為基準解析，且必須位於工作區內。僅載入可辨識的啟動載入檔案基本名稱（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 詳細資訊

將每個斜線命令以一行 JSON（時間戳記、動作、工作階段金鑰、傳送者 ID、來源）記錄至 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 詳細資訊

當 OpenClaw 開始及完成壓縮工作階段逐字稿時，會在目前對話中傳送簡短的狀態訊息。這能減少聊天介面上長回合造成的困惑，因為使用者可以看到助理正在摘要情境，並會在壓縮後繼續。

<a id="boot-md"></a>

### boot-md 詳細資訊

在閘道啟動時，針對每個已設定的代理程式範圍執行 `BOOT.md`，前提是該檔案存在於該代理程式解析後的工作區中。

## 外掛鉤子

外掛可以透過外掛 SDK 註冊具型別的鉤子，以進行更深層的整合：
攔截工具呼叫、修改提示詞、控制訊息流程等。
當你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他程序內生命週期鉤子時，請使用外掛鉤子。

由外掛管理的內部鉤子則不同：它們會參與本頁所述的
粗粒度命令／生命週期事件系統，並在 `openclaw hooks list` 中顯示為
`plugin:<id>`。這些鉤子適合用於副作用及與鉤子套件相容，不適合
用於有順序的中介軟體或政策閘門。

如需完整的外掛鉤子參考資料，請參閱[外掛鉤子](/zh-TW/plugins/hooks)。

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

每個鉤子的環境值會滿足該鉤子的 `requires.env` 資格檢查（連同程序環境），處理常式也可以從其鉤子設定項目讀取這些值：

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
為了向下相容，仍支援舊版的 `hooks.internal.handlers` 陣列設定格式，但新的鉤子應使用以探索為基礎的系統。
</Note>

## 命令列介面參考

```bash
# 列出所有鉤子（可加入 --eligible、--verbose 或 --json）
openclaw hooks list

# 顯示鉤子的詳細資訊
openclaw hooks info <hook-name>

# 顯示資格摘要
openclaw hooks check

# 啟用／停用
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 最佳實務

- **讓處理常式保持快速。** 鉤子會在命令處理期間執行。使用 `void processInBackground(event)` 以無需等待的方式執行繁重工作。
- **妥善處理錯誤。** 將有風險的操作包在 try/catch 中；不要擲出錯誤，以便其他處理常式可以執行。
- **及早篩選事件。** 如果事件類型／動作不相關，請立即返回。
- **使用特定的事件鍵。** 優先使用 `"events": ["command:new"]`，而非 `"events": ["command"]`，以降低額外負擔。

## 疑難排解

### 未探索到鉤子

```bash
# 驗證目錄結構
ls -la ~/.openclaw/hooks/my-hook/
# 應顯示：HOOK.md、handler.ts

# 列出所有已探索到的鉤子
openclaw hooks list
```

### 鉤子不符合資格

```bash
openclaw hooks info my-hook
```

檢查是否缺少二進位檔（PATH）、環境變數、設定值或作業系統相容性。

### 鉤子未執行

1. 確認鉤子已啟用：`openclaw hooks list`
2. 重新啟動閘道程序，使鉤子重新載入。
3. 檢查閘道記錄：`openclaw logs --follow | grep -i hook`

## 相關內容

- [命令列介面參考：鉤子](/zh-TW/cli/hooks)
- [網路鉤子](/zh-TW/automation/cron-jobs#webhooks)
- [外掛鉤子](/zh-TW/plugins/hooks) — 程序內外掛生命週期鉤子
- [設定](/zh-TW/gateway/configuration-reference#hooks)

---
read_when:
    - 你想要針對 /new、/reset、/stop 與代理程式生命週期事件進行事件驅動的自動化處理
    - 您想要建置、安裝或偵錯鉤子
summary: 鉤子：針對命令與生命週期事件的事件驅動自動化
title: 鉤子
x-i18n:
    generated_at: "2026-07-11T21:06:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

鉤子是在代理事件觸發時於閘道內執行的小型指令碼，例如 `/new`、`/reset`、`/stop` 等命令、工作階段壓縮、閘道生命週期及訊息流程。系統會從目錄中探索這些鉤子，並透過 `openclaw hooks` 管理。只有在您啟用鉤子，或設定至少一個鉤子項目、鉤子套件、舊版處理常式或額外鉤子目錄後，閘道才會載入內部鉤子。

OpenClaw 中有兩種鉤子：

- **內部鉤子**（本頁）：在代理事件觸發時於閘道內執行。
- **網路鉤子**：讓其他系統觸發 OpenClaw 工作的外部 HTTP 端點。請參閱[網路鉤子](/zh-TW/automation/cron-jobs#webhooks)。

鉤子也可封裝在外掛內。`openclaw hooks list` 會同時顯示獨立鉤子與由外掛管理的鉤子（顯示為 `plugin:<id>`）。

## 選擇正確的擴充介面

OpenClaw 提供數種看似相似、但解決不同問題的擴充介面：

| 如果您想要……                                                                                                              | 使用……                                  | 原因                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 在 `/new` 時儲存快照、記錄 `/reset`、在 `message:sent` 後呼叫外部 API，或加入粗粒度的操作員自動化 | 內部鉤子（`HOOK.md`，本頁） | 檔案型鉤子適合由操作員管理的副作用，以及命令／生命週期自動化 |
| 重寫提示詞、封鎖工具、取消傳出訊息，或加入有序的中介軟體／政策                              | 透過 `api.on(...)` 使用具型別外掛鉤子  | 具型別鉤子具有明確的契約、優先順序、合併規則，以及封鎖／取消語意      |
| 僅匯出遙測資料或加入可觀測性                                                                            | 診斷事件                     | 可觀測性使用獨立的事件匯流排，而非政策鉤子介面                              |

若您需要行為類似已安裝小型整合的自動化，請使用內部鉤子。若您需要控制執行階段生命週期，請使用具型別外掛鉤子。

## 快速開始

```bash
# 列出可用的鉤子
openclaw hooks list

# 啟用鉤子
openclaw hooks enable session-memory

# 檢查鉤子狀態
openclaw hooks check

# 取得詳細資訊
openclaw hooks info session-memory
```

## 事件類型

鉤子會訂閱此表中的特定鍵，也可訂閱不含動作的事件家族名稱
（`command`、`session`、`agent`、`gateway`、`message`），以接收該家族中的所有動作。
OpenClaw 核心不會發出其他事件，因此任何其他名稱幾乎
一定是拼字錯誤，並會使鉤子無聲地失效（只有發出
自訂事件的外掛才能觸發它）。鉤子載入器會對此類名稱
（例如 `command:nwe`）記錄警告，而 `openclaw hooks info <name>` 也會標示它們，因此
鉤子從未執行的問題是可診斷的。

| 事件                    | 觸發時機                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | 發出 `/new` 命令時                                      |
| `command:reset`          | 發出 `/reset` 命令時                                    |
| `command:stop`           | 發出 `/stop` 命令時                                     |
| `command`                | 任何命令事件（通用監聽器）                       |
| `session:compact:before` | 壓縮彙整歷史記錄之前                       |
| `session:compact:after`  | 壓縮完成之後                                 |
| `session:patch`          | 工作階段屬性遭修改時                       |
| `agent:bootstrap`        | 注入工作區啟動檔案之前              |
| `gateway:startup`        | 頻道啟動且鉤子載入之後                  |
| `gateway:shutdown`       | 閘道開始關閉時                               |
| `gateway:pre-restart`    | 預期的閘道重新啟動之前                         |
| `message:received`       | 來自任何頻道的傳入訊息                           |
| `message:transcribed`    | 音訊轉錄完成之後                        |
| `message:preprocessed`   | 媒體與連結預處理完成或略過之後 |
| `message:sent`           | 嘗試傳送外寄訊息時（`context.success` 包含結果） |

## 撰寫鉤子

### 鉤子結構

每個鉤子都是包含兩個檔案的目錄：

```text
my-hook/
├── HOOK.md          # 中繼資料與文件
└── handler.ts       # 處理常式實作
```

處理常式檔案可以是 `handler.ts`、`handler.js`、`index.ts` 或 `index.js`。

### HOOK.md 格式

```markdown
---
name: my-hook
description: "此鉤子功能的簡短說明"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# 我的鉤子

詳細文件置於此處。
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
| `hookKey`  | 設定鍵覆寫值（預設為鉤子名稱）      |
| `homepage` | 由 `openclaw hooks info` 顯示的文件 URL              |
| `install`  | 安裝方式                                 |

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

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages` 和 `context`（事件特定資料）。代理與工具鉤子的具型別外掛鉤子情境也可包含 `trace`，這是一個唯讀、相容 W3C 的診斷追蹤情境，外掛可將其傳入結構化日誌，以便與 OTEL 建立關聯。

推送至 `event.messages` 的字串只會在
`command:new` 和 `command:reset` 時傳回聊天（以回覆方式路由至原始
對話），以及在 `session:compact:before`／`session:compact:after`
時傳送（作為壓縮狀態通知）。所有其他事件，包括
`command:stop`、`message:*`、`agent:bootstrap`、`session:patch` 和
`gateway:*`，都會忽略推送的訊息。

### 事件情境重點

**命令事件**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.senderId`、`context.workspaceDir`、`context.cfg`。

**命令事件**（`command:stop`）：`context.sessionEntry`、`context.sessionId`、`context.commandSource`、`context.senderId`。

**訊息事件**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（供應商特定資料，包括 `senderId`、`senderName`、`guildId`）。對於類似命令的訊息，`context.content` 會優先採用非空白的命令本文，然後回退至原始傳入本文與通用本文；其中不包含僅供代理使用的強化資訊，例如討論串歷史記錄或連結摘要。

**訊息事件**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`，傳送失敗時還包括 `context.error`。

**訊息事件**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**訊息事件**（`message:preprocessed`）：`context.bodyForAgent`（最終強化後本文）、`context.from`、`context.channelId`。

**啟動事件**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**工作階段修補事件**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅包含變更的欄位）、`context.cfg`。只有具權限的用戶端才能觸發修補事件；情境是複製本，因此處理常式無法修改即時工作階段項目。

**壓縮事件**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 會新增 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 觀察使用者發出 `/stop`；它屬於取消／命令
生命週期，而不是代理最終處理的閘門。需要檢查
自然產生的最終答案，並要求代理再執行一輪的外掛，應改用具型別
外掛鉤子 `before_agent_finalize`。請參閱[外掛鉤子](/zh-TW/plugins/hooks)。

**閘道生命週期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，並在閘道開始關閉時觸發。`gateway:pre-restart` 包含相同情境，但只會在關閉屬於預期重新啟動的一部分，且提供有限的 `restartExpectedMs` 值時觸發。關閉期間，每個生命週期鉤子的等待都採盡力而為且有時間上限，因此即使處理常式停滯，關閉程序仍會繼續。`gateway:shutdown` 的預設等待時限為 5 秒，`gateway:pre-restart` 則為 10 秒。

當頻道仍可使用時，使用 `gateway:pre-restart` 傳送簡短的重新啟動通知：

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

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件與關閉程序的其餘步驟之間，閘道也會針對程序停止時仍處於作用中狀態的每個工作階段，觸發具型別的 `session_end` 外掛鉤子。若只是一般的 SIGTERM／SIGINT 停止，事件的 `reason` 為 `shutdown`；若關閉是預期重新啟動的一部分，則為 `restart`。此清空程序有時間上限，因此緩慢的 `session_end` 處理常式無法阻止程序結束；已透過取代／重設／刪除／壓縮完成最終處理的工作階段會被略過，以避免重複觸發。

## 鉤子探索

系統會從四種來源探索鉤子：

1. **隨附鉤子**：隨 OpenClaw 一同提供
2. **外掛鉤子**：封裝於已安裝的外掛內；可覆寫同名的隨附鉤子
3. **受管理鉤子**：`~/.openclaw/hooks/`（由使用者安裝，跨工作區共用）；可覆寫隨附與外掛鉤子。來自 `hooks.internal.load.extraDirs` 的額外目錄具有相同的優先順序。
4. **工作區鉤子**：`<workspace>/hooks/`（每個代理個別擁有，預設停用，直到明確啟用）

工作區鉤子可以新增鉤子名稱，但無法覆寫同名的隨附、受管理或外掛提供的鉤子。

除非已設定內部鉤子，否則閘道在啟動時會略過內部鉤子探索。使用 `openclaw hooks enable <name>` 啟用隨附或受管理的鉤子、安裝鉤子套件，或設定 `hooks.internal.enabled=true` 以選擇加入。啟用單一具名鉤子時，閘道只會載入該鉤子的處理常式；`hooks.internal.enabled=true`、額外鉤子目錄和舊版處理常式則會選擇加入廣泛探索。

### 鉤子套件

鉤子套件是透過 `package.json` 中的 `openclaw.hooks` 匯出鉤子的 npm 套件。安裝方式：

```bash
openclaw plugins install <path-or-spec>
```

Npm 規格僅限登錄檔（套件名稱 + 選用的確切版本或 dist-tag）。Git/URL/檔案規格及 semver 範圍會被拒絕。較舊的 `openclaw hooks install` 和 `openclaw hooks update` 命令已棄用，分別是 `openclaw plugins install` / `openclaw plugins update` 的別名。

## 內建鉤子

| 鉤子                  | 事件                                              | 功能                                                         |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | 將工作階段上下文儲存至 `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | 從 glob 模式注入額外的啟動載入檔案                           |
| command-logger        | `command`                                         | 將所有命令記錄至 `~/.openclaw/logs/commands.log`             |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在工作階段壓縮開始／結束時傳送可見的聊天通知                 |
| boot-md               | `gateway:startup`                                 | 在閘道啟動時執行 `BOOT.md`                                   |

啟用任何內建鉤子：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資訊

擷取最近的使用者／助理訊息（預設 15 則，可透過 `hooks.internal.entries.session-memory.messages` 設定），並使用主機的本機日期將其儲存至 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。記憶擷取會在背景執行，因此 `/new` 和 `/reset` 的確認回覆不會因讀取逐字稿或選用的 slug 產生作業而延遲。設定 `hooks.internal.entries.session-memory.llmSlug: true` 可產生描述性的檔名 slug，亦可選擇將 `hooks.internal.entries.session-memory.model` 設為已設定的別名（例如 `sonnet`）、代理程式預設提供者上的純模型 ID，或 `provider/model` 參照。省略 `model` 時，slug 產生作業會使用代理程式的預設模型；若模型無法使用，則退回使用時間戳記 slug。必須設定 `workspace.dir`。

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

`patterns` 和 `files` 可作為 `paths` 的別名。路徑會相對於工作區解析，且必須維持在工作區內。僅載入可辨識的啟動載入檔案基本名稱（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 詳細資訊

將每個斜線命令以一行 JSON（時間戳記、動作、工作階段金鑰、傳送者 ID、來源）記錄至 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 詳細資訊

當 OpenClaw 開始和完成壓縮工作階段逐字稿時，會將簡短的狀態訊息傳送至目前的對話。這可減少聊天介面上長時間處理造成的困惑，因為使用者能看見助理正在摘要上下文，並會在壓縮完成後繼續。

<a id="boot-md"></a>

### boot-md 詳細資訊

閘道啟動時，若各個已設定代理程式範圍的已解析工作區中存在 `BOOT.md`，便會執行該檔案。

## 外掛鉤子

外掛可透過外掛 SDK 註冊型別化鉤子，以進行更深入的整合：
攔截工具呼叫、修改提示詞、控制訊息流程等。
需要 `before_tool_call`、`before_agent_reply`、`before_install`
或其他處理程序內生命週期鉤子時，請使用外掛鉤子。

由外掛管理的內部鉤子則不同：它們會參與本頁的粗粒度命令／生命週期事件系統，並在 `openclaw hooks list` 中顯示為
`plugin:<id>`。請將其用於副作用及與鉤子套件的相容性，而非
有順序的中介軟體或原則閘門。

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

各鉤子的環境值可滿足鉤子的 `requires.env` 適用資格檢查（與程序環境共同判定），且處理常式可從其鉤子設定項目中讀取這些值：

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
為了向下相容，仍支援舊版 `hooks.internal.handlers` 陣列設定格式，但新的鉤子應使用以探索為基礎的系統。
</Note>

## 命令列介面參考

```bash
# 列出所有鉤子（加入 --eligible、--verbose 或 --json）
openclaw hooks list

# 顯示鉤子的詳細資訊
openclaw hooks info <hook-name>

# 顯示適用資格摘要
openclaw hooks check

# 啟用／停用
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## 最佳實務

- **讓處理常式保持快速。** 鉤子會在命令處理期間執行。使用 `void processInBackground(event)` 以發出後不等待的方式執行繁重工作。
- **妥善處理錯誤。** 將高風險操作包在 try/catch 中；不要擲出錯誤，讓其他處理常式得以執行。
- **及早篩選事件。** 如果事件類型／動作無關，請立即返回。
- **使用明確的事件鍵。** 優先使用 `"events": ["command:new"]`，而非 `"events": ["command"]`，以降低額外負擔。

## 疑難排解

### 未探索到鉤子

```bash
# 驗證目錄結構
ls -la ~/.openclaw/hooks/my-hook/
# 應顯示：HOOK.md、handler.ts

# 列出所有已探索到的鉤子
openclaw hooks list
```

### 鉤子不符合適用資格

```bash
openclaw hooks info my-hook
```

檢查是否缺少二進位檔（PATH）、環境變數、設定值，或作業系統不相容。

### 鉤子未執行

1. 確認鉤子已啟用：`openclaw hooks list`
2. 重新啟動閘道程序，讓鉤子重新載入。
3. 檢查閘道日誌：`openclaw logs --follow | grep -i hook`

## 相關內容

- [命令列介面參考：鉤子](/zh-TW/cli/hooks)
- [網路鉤子](/zh-TW/automation/cron-jobs#webhooks)
- [外掛鉤子](/zh-TW/plugins/hooks) — 處理程序內的外掛生命週期鉤子
- [設定](/zh-TW/gateway/configuration-reference#hooks)

---
read_when:
    - 你想要針對 /new、/reset、/stop 和代理程式生命週期事件的事件驅動自動化
    - 你想要建置、安裝或偵錯鉤子
summary: 掛鉤：命令與生命週期事件的事件驅動自動化
title: 鉤子
x-i18n:
    generated_at: "2026-05-11T20:20:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Hooks 是在 Gateway 內部發生某些事件時執行的小型指令碼。它們可以從目錄中被發現，並透過 `openclaw hooks` 檢查。只有在你啟用 hooks，或設定至少一個 hook 項目、hook pack、legacy handler 或額外 hook 目錄之後，Gateway 才會載入 internal hooks。

OpenClaw 中有兩種 hooks：

- **Internal hooks**（本頁）：當 agent 事件觸發時在 Gateway 內部執行，例如 `/new`、`/reset`、`/stop` 或生命週期事件。
- **Webhooks**：外部 HTTP 端點，讓其他系統觸發 OpenClaw 中的工作。請參閱 [Webhooks](/zh-TW/automation/cron-jobs#webhooks)。

Hooks 也可以封裝在 plugins 內。`openclaw hooks list` 會同時顯示獨立 hooks 和 plugin 管理的 hooks。

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
| `command:new`            | 發出 `/new` 指令                                           |
| `command:reset`          | 發出 `/reset` 指令                                         |
| `command:stop`           | 發出 `/stop` 指令                                          |
| `command`                | 任何指令事件（一般監聽器）                                 |
| `session:compact:before` | 在 compaction 摘要歷史記錄之前                             |
| `session:compact:after`  | 在 compaction 完成之後                                     |
| `session:patch`          | session 屬性被修改時                                       |
| `agent:bootstrap`        | 在 workspace bootstrap 檔案被注入之前                      |
| `gateway:startup`        | channels 啟動且 hooks 載入之後                             |
| `gateway:shutdown`       | gateway shutdown 開始時                                    |
| `gateway:pre-restart`    | 在預期的 gateway restart 之前                              |
| `message:received`       | 來自任何 channel 的入站訊息                                |
| `message:transcribed`    | audio transcription 完成之後                               |
| `message:preprocessed`   | media 和 link preprocessing 完成或被略過之後               |
| `message:sent`           | outbound message 已送達                                    |

## 撰寫 hooks

### Hook 結構

每個 hook 是一個包含兩個檔案的目錄：

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

**Metadata 欄位**（`metadata.openclaw`）：

| 欄位       | 說明                                                 |
| ---------- | ---------------------------------------------------- |
| `emoji`    | CLI 顯示用 emoji                                     |
| `events`   | 要監聽的事件陣列                                     |
| `export`   | 要使用的具名 export（預設為 `"default"`）            |
| `os`       | 必要平台（例如 `["darwin", "linux"]`）               |
| `requires` | 必要的 `bins`、`anyBins`、`env` 或 `config` 路徑     |
| `always`   | 略過資格檢查（boolean）                              |
| `install`  | 安裝方法                                             |

### Handler 實作

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

每個事件都包含：`type`、`action`、`sessionKey`、`timestamp`、`messages`（push 以傳送給使用者），以及 `context`（事件特定資料）。Agent 和 tool plugin hook contexts 也可以包含 `trace`，這是一個唯讀、相容 W3C 的診斷 trace context，plugins 可將其傳入 structured logs 以進行 OTEL 關聯。

### 事件 context 重點

**Command events**（`command:new`、`command:reset`）：`context.sessionEntry`、`context.previousSessionEntry`、`context.commandSource`、`context.workspaceDir`、`context.cfg`。

**Message events**（`message:received`）：`context.from`、`context.content`、`context.channelId`、`context.metadata`（provider-specific data including `senderId`、`senderName`、`guildId`）。`context.content` 會優先使用類似指令訊息中的非空 command body，接著 fallback 到原始 inbound body 和 generic body；它不包含 agent-only enrichment，例如 thread history 或 link summaries。

**Message events**（`message:sent`）：`context.to`、`context.content`、`context.success`、`context.channelId`。

**Message events**（`message:transcribed`）：`context.transcript`、`context.from`、`context.channelId`、`context.mediaPath`。

**Message events**（`message:preprocessed`）：`context.bodyForAgent`（最終 enriched body）、`context.from`、`context.channelId`。

**Bootstrap events**（`agent:bootstrap`）：`context.bootstrapFiles`（可變陣列）、`context.agentId`。

**Session patch events**（`session:patch`）：`context.sessionEntry`、`context.patch`（僅變更的欄位）、`context.cfg`。只有特權 clients 可以觸發 patch events。

**Compaction events**：`session:compact:before` 包含 `messageCount`、`tokenCount`。`session:compact:after` 會新增 `compactedCount`、`summaryLength`、`tokensBefore`、`tokensAfter`。

`command:stop` 觀察使用者發出 `/stop`；它是 cancellation/command
生命週期，而不是 agent-finalization gate。需要檢查自然 final answer
並要求 agent 再執行一次 pass 的 plugins，應改用 typed
plugin hook `before_agent_finalize`。請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

**Gateway 生命週期事件**：`gateway:shutdown` 包含 `reason` 和 `restartExpectedMs`，並在 gateway shutdown 開始時觸發。`gateway:pre-restart` 包含相同 context，但只會在 shutdown 是預期 restart 的一部分，且提供有限的 `restartExpectedMs` 值時觸發。在 shutdown 期間，每個 lifecycle hook wait 都是 best-effort 並有邊界，因此即使 handler 停滯，shutdown 仍會繼續。

在 `gateway:shutdown`（或 `gateway:pre-restart`）事件與 shutdown 序列其餘部分之間，gateway 也會對 process 停止時仍處於 active 的每個 session 觸發 typed `session_end` plugin hook。對一般 SIGTERM/SIGINT stop，事件的 `reason` 是 `shutdown`；若 close 是預期 restart 的一部分，則為 `restart`。此 drain 有邊界，因此緩慢的 `session_end` handler 無法阻擋 process exit；已透過 replace / reset / delete / compaction finalize 的 sessions 會被略過，以避免重複觸發。

## Hook discovery

Hooks 會依 override precedence 遞增順序，從以下目錄中被發現：

1. **Bundled hooks**：隨 OpenClaw 出貨
2. **Plugin hooks**：封裝在已安裝 plugins 內的 hooks
3. **Managed hooks**：`~/.openclaw/hooks/`（使用者安裝、跨 workspaces 共用）。來自 `hooks.internal.load.extraDirs` 的額外目錄共享此 precedence。
4. **Workspace hooks**：`<workspace>/hooks/`（per-agent，預設停用直到明確啟用）

Workspace hooks 可以新增 hook 名稱，但無法覆寫同名的 bundled、managed 或 plugin-provided hooks。

Gateway 在 internal hooks 尚未設定前，會在啟動時略過 internal hook discovery。使用 `openclaw hooks enable <name>` 啟用 bundled 或 managed hook、安裝 hook pack，或設定 `hooks.internal.enabled=true` 以 opt in。當你啟用一個具名 hook 時，Gateway 只會載入該 hook 的 handler；`hooks.internal.enabled=true`、額外 hook 目錄，以及 legacy handlers 會 opt into broad discovery。

### Hook packs

Hook packs 是 npm packages，透過 `package.json` 中的 `openclaw.hooks` export hooks。使用以下方式安裝：

```bash
openclaw plugins install <path-or-spec>
```

Npm specs 僅限 registry（package name + optional exact version or dist-tag）。Git/URL/file specs 和 semver ranges 會被拒絕。

## Bundled hooks

| Hook                  | 事件                                              | 作用                                                           |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`、`command:reset`                    | 將 session context 儲存到 `<workspace>/memory/`                |
| bootstrap-extra-files | `agent:bootstrap`                                 | 從 glob patterns 注入 additional bootstrap files               |
| command-logger        | `command`                                         | 將所有 commands 記錄到 `~/.openclaw/logs/commands.log`         |
| compaction-notifier   | `session:compact:before`、`session:compact:after` | 在 session compaction 開始/結束時傳送可見 chat notices         |
| boot-md               | `gateway:startup`                                 | 在 gateway 啟動時執行 `BOOT.md`                               |

啟用任何 bundled hook：

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### session-memory 詳細資料

擷取最後 15 則 user/assistant messages，並使用 host local date 儲存到 `<workspace>/memory/YYYY-MM-DD-HHMM.md`。Memory capture 會在背景執行，因此 `/new` 和 `/reset` acknowledgements 不會因 transcript reads 或 optional slug generation 而延遲。設定 `hooks.internal.entries.session-memory.llmSlug: true`，即可使用 configured model 產生描述性 filename slugs。需要已設定 `workspace.dir`。

<a id="bootstrap-extra-files"></a>

### bootstrap-extra-files config

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

Paths 會相對於 workspace 解析。只會載入已識別的 bootstrap basenames（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`、`MEMORY.md`）。

<a id="command-logger"></a>

### command-logger 詳細資料

將每個 slash command 記錄到 `~/.openclaw/logs/commands.log`。

<a id="compaction-notifier"></a>

### compaction-notifier 詳細資料

當 OpenClaw 開始和完成 compacting session transcript 時，會將簡短狀態訊息傳送到目前 conversation。這能降低 chat surfaces 上長回合的困惑，因為使用者可以看到 assistant 正在摘要 context，並會在 compaction 後繼續。

<a id="boot-md"></a>

### boot-md 詳細資料

在 gateway 啟動時，從 active workspace 執行 `BOOT.md`。

## Plugin hooks

Plugins 可以透過 Plugin SDK 註冊 typed hooks，以進行更深入的整合：
intercepting tool calls、modifying prompts、controlling message flow 等。
當你需要 `before_tool_call`、`before_agent_reply`、
`before_install` 或其他 in-process lifecycle hooks 時，請使用 plugin hooks。

完整的 plugin hook 參考請參閱 [Plugin hooks](/zh-TW/plugins/hooks)。

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

Per-hook 環境變數：

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

額外 hook 目錄：

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

- **讓處理常式保持快速。** 掛鉤會在命令處理期間執行。使用 `void processInBackground(event)` 以觸發後即不等待的方式處理繁重工作。
- **妥善處理錯誤。** 將有風險的操作包在 try/catch 中；不要擲出例外，讓其他處理常式可以執行。
- **及早篩選事件。** 如果事件類型/動作不相關，請立即返回。
- **使用特定的事件鍵。** 偏好使用 `"events": ["command:new"]`，而不是 `"events": ["command"]`，以降低開銷。

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
2. 重新啟動你的 Gateway 行程，讓掛鉤重新載入。
3. 檢查 Gateway 記錄：`./scripts/clawlog.sh | grep hook`

## 相關內容

- [CLI 參考：掛鉤](/zh-TW/cli/hooks)
- [Webhook](/zh-TW/automation/cron-jobs#webhooks)
- [Plugin 掛鉤](/zh-TW/plugins/hooks) — 行程內 Plugin 生命週期掛鉤
- [設定](/zh-TW/gateway/configuration-reference#hooks)

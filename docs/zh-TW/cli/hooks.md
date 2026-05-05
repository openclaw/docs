---
read_when:
    - 您想要管理代理程式鉤子
    - 您想檢查掛鉤可用性或啟用工作區掛鉤
summary: '`openclaw hooks`（代理掛鉤）的 CLI 參考'
title: 掛鉤
x-i18n:
    generated_at: "2026-05-05T08:25:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

管理代理掛鉤（用於 `/new`、`/reset` 與 Gateway 啟動等命令的事件驅動自動化）。

執行不帶子命令的 `openclaw hooks` 等同於 `openclaw hooks list`。

相關：

- 掛鉤：[掛鉤](/zh-TW/automation/hooks)
- Plugin 掛鉤：[Plugin 掛鉤](/zh-TW/plugins/hooks)

## 列出所有掛鉤

```bash
openclaw hooks list
```

列出從工作區、受管理、額外與內建目錄探索到的所有掛鉤。
在至少設定一個內部掛鉤之前，Gateway 啟動不會載入內部掛鉤處理常式。

**選項：**

- `--eligible`：只顯示符合資格的掛鉤（已滿足需求）
- `--json`：以 JSON 輸出
- `-v, --verbose`：顯示詳細資訊，包括缺少的需求

**輸出範例：**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**範例（詳細）：**

```bash
openclaw hooks list --verbose
```

顯示不符合資格掛鉤的缺少需求。

**範例（JSON）：**

```bash
openclaw hooks list --json
```

傳回可供程式使用的結構化 JSON。

## 取得掛鉤資訊

```bash
openclaw hooks info <name>
```

顯示特定掛鉤的詳細資訊。

**引數：**

- `<name>`：掛鉤名稱或掛鉤鍵（例如 `session-memory`）

**選項：**

- `--json`：以 JSON 輸出

**範例：**

```bash
openclaw hooks info session-memory
```

**輸出：**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## 檢查掛鉤資格

```bash
openclaw hooks check
```

顯示掛鉤資格狀態摘要（就緒與未就緒的數量）。

**選項：**

- `--json`：以 JSON 輸出

**輸出範例：**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 啟用掛鉤

```bash
openclaw hooks enable <name>
```

透過將特定掛鉤加入你的設定（預設為 `~/.openclaw/openclaw.json`）來啟用它。

**注意：** 工作區掛鉤預設為停用，直到在此處或設定中啟用為止。由 plugins 管理的掛鉤會在 `openclaw hooks list` 中顯示 `plugin:<id>`，且無法在此處啟用/停用。請改為啟用/停用該 plugin。

**引數：**

- `<name>`：掛鉤名稱（例如 `session-memory`）

**範例：**

```bash
openclaw hooks enable session-memory
```

**輸出：**

```
✓ Enabled hook: 💾 session-memory
```

**作用：**

- 檢查掛鉤是否存在且符合資格
- 在你的設定中更新 `hooks.internal.entries.<name>.enabled = true`
- 將設定儲存至磁碟

如果掛鉤來自 `<workspace>/hooks/`，則在 Gateway 載入它之前必須完成此選擇加入步驟。

**啟用後：**

- 重新啟動 Gateway，讓掛鉤重新載入（macOS 上重新啟動選單列 app，或在開發環境中重新啟動你的 Gateway 程序）。

## 停用掛鉤

```bash
openclaw hooks disable <name>
```

透過更新你的設定來停用特定掛鉤。

**引數：**

- `<name>`：掛鉤名稱（例如 `command-logger`）

**範例：**

```bash
openclaw hooks disable command-logger
```

**輸出：**

```
⏸ Disabled hook: 📝 command-logger
```

**停用後：**

- 重新啟動 Gateway，讓掛鉤重新載入

## 注意事項

- `openclaw hooks list --json`、`info --json` 與 `check --json` 會將結構化 JSON 直接寫入 stdout。
- 由 Plugin 管理的掛鉤無法在此處啟用或停用；請改為啟用或停用擁有它的 plugin。

## 安裝掛鉤套件

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

透過統一的 plugins 安裝程式安裝掛鉤套件。

`openclaw hooks install` 仍可作為相容性別名使用，但它會列印棄用警告，並轉送至 `openclaw plugins install`。

Npm 規格為**僅限 registry**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file 規格與 semver 範圍會被拒絕。為了安全，即使你的 shell 有全域 npm 安裝設定，依賴項安裝仍會以專案本機方式搭配 `--ignore-scripts` 執行。

裸規格與 `@latest` 會留在穩定軌道。如果 npm 將其中任一項解析為預發布版本，OpenClaw 會停止並要求你使用 `@beta`/`@rc` 等預發布標籤或精確的預發布版本明確選擇加入。

**作用：**

- 將掛鉤套件複製到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中啟用已安裝的掛鉤
- 將安裝記錄於 `hooks.internal.installs`

**選項：**

- `-l, --link`：連結本機目錄而非複製（將其加入 `hooks.internal.load.extraDirs`）
- `--pin`：在 `hooks.internal.installs` 中將 npm 安裝記錄為精確解析的 `name@version`

**支援的封存檔：** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**範例：**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

已連結的掛鉤套件會被視為來自操作員設定目錄的受管理掛鉤，而不是工作區掛鉤。

## 更新掛鉤套件

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

透過統一的 plugins 更新程式更新已追蹤、以 npm 為基礎的掛鉤套件。

`openclaw hooks update` 仍可作為相容性別名使用，但它會列印棄用警告，並轉送至 `openclaw plugins update`。

**選項：**

- `--all`：更新所有已追蹤的掛鉤套件
- `--dry-run`：顯示將變更的內容但不寫入

當存在已儲存的完整性雜湊且擷取到的成品雜湊發生變更時，OpenClaw 會列印警告並要求確認後再繼續。在 CI/非互動式執行中使用全域 `--yes` 可略過提示。

## 內建掛鉤

### session-memory

在你發出 `/new` 或 `/reset` 時，將工作階段脈絡儲存至記憶體。

**啟用：**

```bash
openclaw hooks enable session-memory
```

**輸出：** 預設為 `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`。設定 `hooks.internal.entries.session-memory.llmSlug: true` 以使用模型產生的檔名 slug。

**參見：** [session-memory 文件](/zh-TW/automation/hooks#session-memory)

### bootstrap-extra-files

在 `agent:bootstrap` 期間注入額外的啟動檔案（例如 monorepo 本機的 `AGENTS.md` / `TOOLS.md`）。

**啟用：**

```bash
openclaw hooks enable bootstrap-extra-files
```

**參見：** [bootstrap-extra-files 文件](/zh-TW/automation/hooks#bootstrap-extra-files)

### command-logger

將所有命令事件記錄到集中式稽核檔案。

**啟用：**

```bash
openclaw hooks enable command-logger
```

**輸出：** `~/.openclaw/logs/commands.log`

**檢視記錄：**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**參見：** [command-logger 文件](/zh-TW/automation/hooks#command-logger)

### boot-md

在 Gateway 啟動時（通道啟動後）執行 `BOOT.md`。

**事件**：`gateway:startup`

**啟用**：

```bash
openclaw hooks enable boot-md
```

**參見：** [boot-md 文件](/zh-TW/automation/hooks#boot-md)

## 相關

- [CLI 參考](/zh-TW/cli)
- [自動化掛鉤](/zh-TW/automation/hooks)

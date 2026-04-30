---
read_when:
    - 您想管理代理程式掛鉤
    - 您想檢查掛鉤可用性，或啟用工作區掛鉤
summary: '`openclaw hooks` 的 CLI 參考（代理程式鉤子）'
title: 掛鉤
x-i18n:
    generated_at: "2026-04-30T02:53:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

管理代理鉤子（用於 `/new`、`/reset` 和 Gateway 啟動等命令的事件驅動自動化）。

在沒有子命令的情況下執行 `openclaw hooks`，等同於 `openclaw hooks list`。

相關：

- 鉤子：[鉤子](/zh-TW/automation/hooks)
- Plugin 鉤子：[Plugin 鉤子](/zh-TW/plugins/hooks)

## 列出所有鉤子

```bash
openclaw hooks list
```

列出從工作區、受管理、額外和內建目錄中探索到的所有鉤子。
Gateway 啟動時不會載入內部鉤子處理器，直到至少設定了一個內部鉤子。

**選項：**

- `--eligible`：只顯示合格的鉤子（符合需求）
- `--json`：以 JSON 輸出
- `-v, --verbose`：顯示包含缺少需求的詳細資訊

**範例輸出：**

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

顯示不合格鉤子缺少的需求。

**範例（JSON）：**

```bash
openclaw hooks list --json
```

傳回供程式使用的結構化 JSON。

## 取得鉤子資訊

```bash
openclaw hooks info <name>
```

顯示特定鉤子的詳細資訊。

**引數：**

- `<name>`：鉤子名稱或鉤子鍵（例如 `session-memory`）

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

## 檢查鉤子合格性

```bash
openclaw hooks check
```

顯示鉤子合格狀態摘要（就緒與未就緒的數量）。

**選項：**

- `--json`：以 JSON 輸出

**範例輸出：**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 啟用鉤子

```bash
openclaw hooks enable <name>
```

透過將特定鉤子新增至你的設定（預設為 `~/.openclaw/openclaw.json`）來啟用它。

**注意：** 工作區鉤子預設為停用，直到在這裡或設定中啟用為止。由 plugins 管理的鉤子會在 `openclaw hooks list` 中顯示 `plugin:<id>`，且無法在這裡啟用/停用。請改為啟用/停用該 plugin。

**引數：**

- `<name>`：鉤子名稱（例如 `session-memory`）

**範例：**

```bash
openclaw hooks enable session-memory
```

**輸出：**

```
✓ Enabled hook: 💾 session-memory
```

**它會執行的動作：**

- 檢查鉤子是否存在且合格
- 在你的設定中更新 `hooks.internal.entries.<name>.enabled = true`
- 將設定儲存至磁碟

如果鉤子來自 `<workspace>/hooks/`，則必須先完成此選擇啟用步驟，
Gateway 才會載入它。

**啟用後：**

- 重新啟動 gateway，讓鉤子重新載入（在 macOS 上重新啟動選單列應用程式，或在開發環境中重新啟動你的 gateway 程序）。

## 停用鉤子

```bash
openclaw hooks disable <name>
```

透過更新你的設定來停用特定鉤子。

**引數：**

- `<name>`：鉤子名稱（例如 `command-logger`）

**範例：**

```bash
openclaw hooks disable command-logger
```

**輸出：**

```
⏸ Disabled hook: 📝 command-logger
```

**停用後：**

- 重新啟動 gateway，讓鉤子重新載入

## 注意事項

- `openclaw hooks list --json`、`info --json` 和 `check --json` 會將結構化 JSON 直接寫入 stdout。
- Plugin 管理的鉤子無法在這裡啟用或停用；請改為啟用或停用其所屬的 plugin。

## 安裝鉤子套件

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

透過統一的 plugins 安裝器安裝鉤子套件。

`openclaw hooks install` 仍可作為相容性別名使用，但它會列印
棄用警告並轉送至 `openclaw plugins install`。

Npm 規格為**僅限 registry**（套件名稱 + 選用的**精確版本**或
**dist-tag**）。Git/URL/file 規格與 semver 範圍會被拒絕。基於安全考量，即使你的
shell 有全域 npm 安裝設定，依賴項安裝也會在專案本機以 `--ignore-scripts` 執行。

裸規格和 `@latest` 會維持在穩定軌道。如果 npm 將其中任一項解析為
預先發布版本，OpenClaw 會停止並要求你使用預先發布標籤（例如 `@beta`/`@rc`）或精確的預先發布版本明確選擇加入。

**它會執行的動作：**

- 將鉤子套件複製到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中啟用已安裝的鉤子
- 在 `hooks.internal.installs` 下記錄安裝

**選項：**

- `-l, --link`：連結本機目錄而非複製（將其新增至 `hooks.internal.load.extraDirs`）
- `--pin`：將 npm 安裝記錄為 `hooks.internal.installs` 中精確解析的 `name@version`

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

連結的鉤子套件會被視為來自操作員設定目錄的受管理鉤子，
而不是工作區鉤子。

## 更新鉤子套件

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

透過統一的 plugins 更新器更新受追蹤、基於 npm 的鉤子套件。

`openclaw hooks update` 仍可作為相容性別名使用，但它會列印
棄用警告並轉送至 `openclaw plugins update`。

**選項：**

- `--all`：更新所有受追蹤的鉤子套件
- `--dry-run`：顯示會變更的內容但不寫入

當已儲存的完整性雜湊存在且擷取的成品雜湊發生變更時，
OpenClaw 會列印警告並在繼續前要求確認。在 CI/非互動式執行中，請使用
全域 `--yes` 來略過提示。

## 內建鉤子

### session-memory

在你發出 `/new` 或 `/reset` 時，將工作階段情境儲存到記憶體。

**啟用：**

```bash
openclaw hooks enable session-memory
```

**輸出：** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**另請參閱：** [session-memory 文件](/zh-TW/automation/hooks#session-memory)

### bootstrap-extra-files

在 `agent:bootstrap` 期間注入額外的 bootstrap 檔案（例如 monorepo 本機的 `AGENTS.md` / `TOOLS.md`）。

**啟用：**

```bash
openclaw hooks enable bootstrap-extra-files
```

**另請參閱：** [bootstrap-extra-files 文件](/zh-TW/automation/hooks#bootstrap-extra-files)

### command-logger

將所有命令事件記錄到集中式稽核檔案。

**啟用：**

```bash
openclaw hooks enable command-logger
```

**輸出：** `~/.openclaw/logs/commands.log`

**檢視日誌：**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**另請參閱：** [command-logger 文件](/zh-TW/automation/hooks#command-logger)

### boot-md

在 gateway 啟動時（在 channels 啟動後）執行 `BOOT.md`。

**事件**：`gateway:startup`

**啟用**：

```bash
openclaw hooks enable boot-md
```

**另請參閱：** [boot-md 文件](/zh-TW/automation/hooks#boot-md)

## 相關

- [CLI 參考](/zh-TW/cli)
- [自動化鉤子](/zh-TW/automation/hooks)

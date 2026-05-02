---
read_when:
    - 你想要管理代理程式鉤子
    - 您想要檢查 hook 可用性或啟用工作區 hook
summary: '`openclaw hooks` 的 CLI 參考（代理掛鉤）'
title: 掛鉤
x-i18n:
    generated_at: "2026-05-02T20:44:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b02c176b4a310adba3fa1fde3758f6c8a19d454aeec58e919458b3f1a66c87d
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

管理代理掛鉤（用於 `/new`、`/reset` 和 Gateway 啟動等命令的事件驅動自動化）。

不帶子命令執行 `openclaw hooks` 等同於 `openclaw hooks list`。

相關：

- 掛鉤：[掛鉤](/zh-TW/automation/hooks)
- Plugin 掛鉤：[Plugin 掛鉤](/zh-TW/plugins/hooks)

## 列出所有掛鉤

```bash
openclaw hooks list
```

列出從工作區、受管理、額外和內建目錄中探索到的所有掛鉤。
Gateway 啟動時，除非至少設定了一個內部掛鉤，否則不會載入內部掛鉤處理器。

**選項：**

- `--eligible`：只顯示符合資格的掛鉤（已滿足需求）
- `--json`：以 JSON 輸出
- `-v, --verbose`：顯示詳細資訊，包括缺少的需求

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

顯示不符合資格掛鉤缺少的需求。

**範例（JSON）：**

```bash
openclaw hooks list --json
```

傳回結構化 JSON 供程式化使用。

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

顯示掛鉤資格狀態摘要（多少已就緒、多少尚未就緒）。

**選項：**

- `--json`：以 JSON 輸出

**範例輸出：**

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

**注意：** 工作區掛鉤預設停用，直到在此處或設定中啟用為止。由 Plugin 管理的掛鉤會在 `openclaw hooks list` 中顯示 `plugin:<id>`，且無法在此處啟用/停用。請改為啟用/停用該 Plugin。

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

**它會執行：**

- 檢查掛鉤是否存在且符合資格
- 在你的設定中更新 `hooks.internal.entries.<name>.enabled = true`
- 將設定儲存到磁碟

如果掛鉤來自 `<workspace>/hooks/`，Gateway 載入它之前必須完成這個選擇加入步驟。

**啟用後：**

- 重新啟動 gateway，讓掛鉤重新載入（在 macOS 上重新啟動選單列應用程式，或在開發環境中重新啟動你的 gateway 程序）。

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

- 重新啟動 gateway，讓掛鉤重新載入

## 附註

- `openclaw hooks list --json`、`info --json` 和 `check --json` 會直接將結構化 JSON 寫入 stdout。
- 由 Plugin 管理的掛鉤無法在此處啟用或停用；請改為啟用或停用擁有它的 Plugin。

## 安裝掛鉤套件

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

透過統一的 plugins 安裝程式安裝掛鉤套件。

`openclaw hooks install` 仍可作為相容性別名使用，但它會列印棄用警告，並轉送至 `openclaw plugins install`。

Npm 規格為**僅限 registry**（套件名稱 + 選用的**精確版本**或 **dist-tag**）。Git/URL/file 規格和 semver 範圍會被拒絕。為了安全，即使你的 shell 有全域 npm install 設定，依賴安裝也會以專案本機方式搭配 `--ignore-scripts` 執行。

裸規格和 `@latest` 會停留在穩定軌道。如果 npm 將其中任一項解析為預發行版本，OpenClaw 會停止並要求你使用預發行標籤（例如 `@beta`/`@rc`）或精確預發行版本明確選擇加入。

**它會執行：**

- 將掛鉤套件複製到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中啟用已安裝的掛鉤
- 將安裝記錄在 `hooks.internal.installs` 之下

**選項：**

- `-l, --link`：連結本機目錄而不是複製（將其加入 `hooks.internal.load.extraDirs`）
- `--pin`：將 npm 安裝以精確解析的 `name@version` 記錄在 `hooks.internal.installs` 中

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

已連結的掛鉤套件會被視為來自操作者設定目錄的受管理掛鉤，而不是工作區掛鉤。

## 更新掛鉤套件

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

透過統一的 plugins 更新程式更新已追蹤的 npm 型掛鉤套件。

`openclaw hooks update` 仍可作為相容性別名使用，但它會列印棄用警告，並轉送至 `openclaw plugins update`。

**選項：**

- `--all`：更新所有已追蹤的掛鉤套件
- `--dry-run`：顯示會變更的內容，但不寫入

當存在已儲存的完整性雜湊，且擷取到的成品雜湊發生變化時，OpenClaw 會列印警告並要求確認後才繼續。請使用全域 `--yes` 在 CI/非互動式執行中略過提示。

## 內建掛鉤

### session-memory

當你發出 `/new` 或 `/reset` 時，將工作階段內容儲存到記憶體。

**啟用：**

```bash
openclaw hooks enable session-memory
```

**輸出：** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**參閱：** [session-memory 文件](/zh-TW/automation/hooks#session-memory)

### bootstrap-extra-files

在 `agent:bootstrap` 期間注入額外的啟動檔案（例如 monorepo 本機的 `AGENTS.md` / `TOOLS.md`）。

**啟用：**

```bash
openclaw hooks enable bootstrap-extra-files
```

**參閱：** [bootstrap-extra-files 文件](/zh-TW/automation/hooks#bootstrap-extra-files)

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

**參閱：** [command-logger 文件](/zh-TW/automation/hooks#command-logger)

### boot-md

在 gateway 啟動時（頻道啟動後）執行 `BOOT.md`。

**事件**：`gateway:startup`

**啟用**：

```bash
openclaw hooks enable boot-md
```

**參閱：** [boot-md 文件](/zh-TW/automation/hooks#boot-md)

## 相關

- [CLI 參考](/zh-TW/cli)
- [自動化掛鉤](/zh-TW/automation/hooks)

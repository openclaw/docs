---
read_when:
    - 你想要管理代理程式掛鉤
    - 你想要檢查鉤子可用性或啟用工作區鉤子
summary: '`openclaw hooks`（代理掛鉤）的命令列介面參考'
title: 鉤子
x-i18n:
    generated_at: "2026-07-05T11:09:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

管理代理程式鉤子（事件驅動的自動化，用於 `/new`、`/reset` 和閘道啟動等命令）。單獨執行 `openclaw hooks` 等同於 `openclaw hooks list`。

相關：[鉤子](/zh-TW/automation/hooks) - [外掛鉤子](/zh-TW/plugins/hooks)

## 列出鉤子

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

列出從工作區、受管理、額外和內建目錄探索到的鉤子。

- `--eligible`：只列出符合需求的鉤子。
- `--json`：結構化輸出。
- `-v, --verbose`：包含顯示未滿足需求的 Missing 欄位。

```
Hooks (4/5 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject additional workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

## 取得鉤子資訊

```bash
openclaw hooks info <name> [--json]
```

`<name>` 是鉤子名稱或鉤子鍵（例如 `session-memory`）。顯示來源、檔案/處理器路徑、首頁、事件，以及每個需求的狀態（二進位檔、環境變數、設定、作業系統）。

## 檢查資格

```bash
openclaw hooks check [--json]
```

列印已就緒/未就緒的數量摘要；若有未就緒的鉤子，會逐一列出其阻擋原因。

## 啟用鉤子

```bash
openclaw hooks enable <name>
```

在設定中新增/更新 `hooks.internal.entries.<name>.enabled = true`，並同時開啟 `hooks.internal.enabled` 主開關（在至少設定一個鉤子之前，閘道不會載入任何內部鉤子處理器）。如果鉤子不存在、由外掛管理，或不符合資格（缺少需求），則會失敗。

由外掛管理的鉤子會在 `hooks list` 中顯示 `plugin:<id>`，且無法在此啟用/停用；請改為啟用或停用其所屬外掛。

啟用後請重新啟動閘道（重新啟動 macOS 選單列應用程式，或在開發環境重新啟動你的閘道程序），使其重新載入鉤子。

## 停用鉤子

```bash
openclaw hooks disable <name>
```

設定 `hooks.internal.entries.<name>.enabled = false`。之後請重新啟動閘道。

## 安裝和更新鉤子套件

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin resolved version
openclaw plugins install <path>           # local directory or archive
openclaw plugins install -l <path>        # link a local directory instead of copying

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

鉤子套件會透過統一的外掛安裝程式/更新程式安裝；`openclaw hooks install` / `openclaw hooks update` 仍可作為已棄用的別名使用，會列印警告並轉送到 `plugins` 命令。

- Npm 規格僅限登錄檔：套件名稱加上選用的精確版本或 dist-tag。Git/URL/file 規格與 semver 範圍會被拒絕。相依套件安裝會以專案本機方式執行，並使用 `--ignore-scripts`。
- 裸規格和 `@latest` 會停留在穩定軌道；如果 npm 解析到預發布版本，OpenClaw 會停止並要求你明確選擇加入（`@beta`、`@rc`，或精確的預發布版本）。
- 支援的封存檔：`.zip`、`.tgz`、`.tar.gz`、`.tar`。
- `-l, --link` 會連結本機目錄而非複製（將其加入 `hooks.internal.load.extraDirs`）；已連結的鉤子套件是來自操作員設定目錄的受管理鉤子，而不是工作區鉤子。
- `--pin` 會將 npm 安裝項目以精確解析出的 `name@version` 記錄在 `hooks.internal.installs`。
- 安裝會將套件複製到 `~/.openclaw/hooks/<id>`，在 `hooks.internal.entries.*` 下啟用其鉤子，並將安裝記錄到 `hooks.internal.installs`。
- 如果已儲存的完整性雜湊不再符合擷取到的成品，OpenClaw 會警告並在繼續前提示；傳入全域 `--yes` 可略過提示（例如在 CI 中）。

## 內建鉤子

| 鉤子                  | 事件                                            | 功能                                                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | 在每個已設定的代理程式範圍於閘道啟動時執行 `BOOT.md`                                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | 在代理程式啟動期間注入額外的啟動檔案（例如 monorepo `AGENTS.md`/`TOOLS.md`） |
| command-logger        | `command`                                         | 將命令事件記錄到 `~/.openclaw/logs/commands.log`                                             |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在工作階段壓縮開始和完成時傳送可見的聊天通知                             |
| session-memory        | `command:new`, `command:reset`                    | 在 `/new` 或 `/reset` 時將工作階段脈絡儲存到記憶體                                              |

使用 `openclaw hooks enable <hook-name>` 啟用任何內建鉤子。完整詳細資訊、設定鍵和預設值：[內建鉤子](/zh-TW/automation/hooks#bundled-hooks)。

### command-logger 記錄檔

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # recent commands
cat ~/.openclaw/logs/commands.log | jq .          # pretty-print
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filter by action
```

## 備註

- `hooks list --json`、`info --json` 和 `check --json` 會將結構化 JSON 直接寫入 stdout。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [自動化鉤子](/zh-TW/automation/hooks)

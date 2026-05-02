---
read_when:
    - 你想查看有哪些 Skills 可用且已準備好執行
    - 您想要從 ClawHub 搜尋、安裝或更新 Skills
    - 你想偵錯 Skills 缺少的二進位檔/環境/設定
summary: CLI 參考：`openclaw skills`（search/install/update/list/info/check）
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:45:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

檢查本機 Skills，並從 ClawHub 安裝/更新 Skills。

相關：

- Skills 系統：[Skills](/zh-TW/tools/skills)
- Skills 設定：[Skills config](/zh-TW/tools/skills-config)
- ClawHub 安裝：[ClawHub](/zh-TW/tools/clawhub)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` 會直接使用 ClawHub，並安裝到目前作用中的
工作區 `skills/` 目錄。`list`/`info`/`check` 仍會檢查目前工作區和設定可見的本機
Skills。由工作區支援的命令會先從 `--agent <id>` 解析目標工作區，接著在目前工作
目錄位於已設定的代理工作區內時使用該目錄，最後才使用預設代理。

這個 CLI `install` 命令會從 ClawHub 下載 skill 資料夾。從入門設定或 Skills 設定觸發、由 Gateway 支援的
skill 相依項安裝，則改用個別的 `skills.install` 請求路徑。

注意：

- `search [query...]` 接受選用查詢；省略即可瀏覽預設的
  ClawHub 搜尋動態。
- `search --limit <n>` 會限制傳回的結果數量。
- `install --force` 會覆寫同一個
  slug 既有的工作區 skill 資料夾。
- `--agent <id>` 會指定一個已設定的代理工作區，並覆寫目前
  工作目錄推斷。
- `update --all` 只會更新作用中工作區內已追蹤的 ClawHub 安裝。
- `check --agent <id>` 會檢查所選代理的工作區，並回報哪些
  已就緒的 Skills 實際上可被該代理的提示或命令介面看見。
- 未提供子命令時，`list` 是預設動作。
- `list`、`info` 和 `check` 會將其算繪後的輸出寫入標準輸出。使用
  `--json` 時，這表示機器可讀的承載資料會留在標準輸出，以供管線
  和腳本使用。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Skills](/zh-TW/tools/skills)

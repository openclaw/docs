---
read_when:
    - 你想查看哪些 Skills 可用且已準備好執行
    - 您想要從 ClawHub 搜尋、安裝或更新 Skills
    - 你想偵錯 Skills 缺少的二進位檔、環境或設定
summary: '`openclaw skills` 的 CLI 參考 (search/install/update/list/info/check)'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:29:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

檢查本機 Skills，並從 ClawHub 安裝/更新 Skills。

相關：

- Skills 系統：[Skills](/zh-TW/tools/skills)
- Skills 設定：[Skills 設定](/zh-TW/tools/skills-config)
- ClawHub 安裝：[ClawHub](/zh-TW/clawhub/cli)

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

`search`/`install`/`update` 會直接使用 ClawHub，並安裝到作用中
工作區的 `skills/` 目錄。`list`/`info`/`check` 仍會檢查目前工作區與設定
可見的本機 Skills。以工作區為基礎的命令會先從 `--agent <id>` 解析目標工作區，
接著在目前工作目錄位於已設定的代理工作區內時使用該目錄，最後才使用預設
代理。

這個 CLI `install` 命令會從 ClawHub 下載 Skills 資料夾。由 Gateway 支援、
在入門流程或 Skills 設定中觸發的 Skills 依賴項安裝，則會改用獨立的
`skills.install` 請求路徑。

注意事項：

- `search [query...]` 接受選用查詢；省略時會瀏覽預設的
  ClawHub 搜尋摘要。
- `search --limit <n>` 會限制傳回的結果數量。
- `install --force` 會覆寫同一
  slug 既有的工作區 Skills 資料夾。
- `--agent <id>` 會指定一個已設定的代理工作區，並覆寫目前
  工作目錄推斷。
- `update --all` 只會更新作用中工作區內已追蹤的 ClawHub 安裝。
- `check --agent <id>` 會檢查所選代理的工作區，並回報哪些
  就緒的 Skills 實際上對該代理的提示或命令介面可見。
- 未提供子命令時，`list` 是預設動作。
- `list`、`info` 和 `check` 會將其算繪後的輸出寫入 stdout。搭配
  `--json` 時，這表示可供機器讀取的承載會保留在 stdout，以供管線
  和腳本使用。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Skills](/zh-TW/tools/skills)

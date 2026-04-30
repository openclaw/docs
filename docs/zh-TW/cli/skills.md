---
read_when:
    - 你想查看哪些 Skills 可用並已準備好執行
    - 你想從 ClawHub 搜尋、安裝或更新 Skills
    - 你想要針對 Skills 缺少的二進位檔/環境/設定進行偵錯
summary: '`openclaw skills` 的 CLI 參考（search/install/update/list/info/check）'
title: Skills
x-i18n:
    generated_at: "2026-04-30T02:56:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
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
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` 會直接使用 ClawHub，並安裝到作用中的
工作區 `skills/` 目錄。`list`/`info`/`check` 仍會檢查目前工作區與設定可見的本機
Skills。由工作區支援的命令會先從 `--agent <id>` 解析目標工作區，接著在目前工作
目錄位於已設定的代理工作區內時使用該目錄，最後才使用預設
代理。

這個 CLI `install` 命令會從 ClawHub 下載 Skills 資料夾。由 Gateway 支援、
在入門設定或 Skills 設定中觸發的 Skills 依賴項安裝，則會改用獨立的
`skills.install` 請求路徑。

注意事項：

- `search [query...]` 接受選用查詢；省略時會瀏覽預設的
  ClawHub 搜尋動態。
- `search --limit <n>` 會限制傳回的結果數量。
- `install --force` 會覆寫同一
  slug 的現有工作區 Skills 資料夾。
- `--agent <id>` 會指定一個已設定的代理工作區，並覆寫目前
  工作目錄的推斷結果。
- `update --all` 只會更新作用中工作區內追蹤的 ClawHub 安裝項目。
- 未提供子命令時，`list` 是預設動作。
- `list`、`info` 和 `check` 會將其轉譯後的輸出寫入 stdout。搭配
  `--json` 時，這表示可供機器讀取的承載內容會保留在 stdout，供管線
  與指令碼使用。

## 相關

- [CLI 參考](/zh-TW/cli)
- [Skills](/zh-TW/tools/skills)

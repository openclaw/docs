---
read_when:
    - 您想在保留已安裝的 CLI 的同時清除本機狀態
    - 你想要模擬執行以查看會移除哪些內容
summary: '`openclaw reset` 的 CLI 參考（重設本機狀態/設定）'
title: 重設
x-i18n:
    generated_at: "2026-04-30T02:55:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4a4aba32fb44905d079bf2a22e582a3affbe9809eac9af237ce3e48da72b42c
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

重設本機設定/狀態（保留已安裝的 CLI）。

選項：

- `--scope <scope>`：`config`、`config+creds+sessions` 或 `full`
- `--yes`：略過確認提示
- `--non-interactive`：停用提示；需要 `--scope` 和 `--yes`
- `--dry-run`：印出動作而不移除檔案

範例：

```bash
openclaw backup create
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

備註：

- 如果你想在移除本機狀態前取得可還原的快照，請先執行 `openclaw backup create`。
- 如果省略 `--scope`，`openclaw reset` 會使用互動式提示來選擇要移除的項目。
- `--non-interactive` 只有在同時設定 `--scope` 和 `--yes` 時才有效。

## 相關

- [CLI 參考](/zh-TW/cli)

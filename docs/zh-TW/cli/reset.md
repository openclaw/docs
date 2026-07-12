---
read_when:
    - 你想要清除本機狀態，同時保留已安裝的命令列介面
    - 您想要試執行，查看將會移除哪些項目
summary: '`openclaw reset` 的命令列介面參考（重設本機狀態／設定）'
title: 重設
x-i18n:
    generated_at: "2026-07-11T21:16:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f18af9c5e187217de4c02f4b55de9a1c94f7246b74056dc660aa172168edcef9
    source_path: cli/reset.md
    workflow: 16
---

# `openclaw reset`

重設本機設定／狀態（保留已安裝的命令列介面）。

```bash
openclaw reset
openclaw reset --dry-run
openclaw reset --scope config --yes --non-interactive
openclaw reset --scope config+creds+sessions --yes --non-interactive
openclaw reset --scope full --yes --non-interactive
```

## 選項

- `--scope <scope>`：`config`、`config+creds+sessions` 或 `full`
- `--yes`：略過確認提示
- `--non-interactive`：停用提示；必須搭配 `--scope` 和 `--yes`
- `--dry-run`：列印將執行的動作，但不移除檔案

## 範圍

| 範圍                    | 移除項目                                                                                          | 是否先停止閘道 |
| ----------------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| `config`                | 僅設定檔                                                                                          | 否             |
| `config+creds+sessions` | 設定檔、OAuth／憑證目錄、各代理程式的工作階段目錄                                                 | 是             |
| `full`                  | 狀態目錄（包括巢狀於其中的設定／憑證），以及工作區目錄和工作區證明                                | 是             |

`config+creds+sessions` 和 `full` 會先停止正在執行的受管理閘道服務，再刪除狀態。

## 注意事項

- 移除本機狀態前，請先執行 `openclaw backup create`，建立可還原的快照。
- 未指定 `--scope` 時，`openclaw reset` 會以互動方式提示選擇要移除的範圍。
- 只有同時設定 `--scope` 和 `--yes` 時，才能使用 `--non-interactive`。
- `config+creds+sessions` 和 `full` 完成後會顯示 `Next: openclaw onboard --install-daemon`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)

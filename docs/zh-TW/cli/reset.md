---
read_when:
    - 你想要清除本機狀態，同時保留已安裝的命令列介面
    - 你想要預演將會移除哪些項目
summary: '`openclaw reset` 的命令列介面參考（重設本機狀態/設定）'
title: 重設
x-i18n:
    generated_at: "2026-07-19T13:42:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54f1d320ee368dae4a4bfb32dea73d19eb35f9f30edd12d9c2580ab7e6a26fa6
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
- `--non-interactive`：停用提示；需要 `--scope` 和 `--yes`
- `--dry-run`：列印動作但不移除檔案

## 範圍

| 範圍                    | 移除內容                                                                    | 是否先停止閘道 |
| ----------------------- | --------------------------------------------------------------------------- | -------------- |
| `config`                | 僅設定檔                                                                    | 否             |
| `config+creds+sessions` | 設定檔、OAuth／認證資訊目錄、各代理程式的工作階段目錄                       | 是             |
| `full`                  | 狀態目錄（包括共用 SQLite 資料庫）及工作區目錄                              | 是             |

`config+creds+sessions` 和 `full` 會在刪除狀態前，先停止執行中的受管理閘道服務。

## 注意事項

- 移除本機狀態前，請先執行 `openclaw backup create` 以建立可還原的快照。
- 工作區設定狀態和證明是共用 SQLite 資料庫中的資料列，因此 `full` 會隨狀態目錄一併移除它們；目前沒有需要另外移除的證明附屬檔案。
- 若未使用 `--scope`，`openclaw reset` 會以互動方式提示選擇要移除的範圍。
- 只有同時設定 `--scope` 和 `--yes` 時，`--non-interactive` 才有效。
- `config+creds+sessions` 和 `full` 會在完成時列印 `Next: openclaw onboard --install-daemon`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)

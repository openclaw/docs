---
read_when:
    - 您想移除閘道服務和／或本機狀態
    - 你想先進行試執行
summary: '`openclaw uninstall` 的命令列介面參考（移除閘道服務與本機資料）'
title: 解除安裝
x-i18n:
    generated_at: "2026-07-11T21:17:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

解除安裝閘道服務及／或本機資料。命令列介面本身不會移除；請另行透過 npm/pnpm 解除安裝。

## 選項

| 旗標                | 預設值  | 說明                                                   |
| ------------------- | ------- | ------------------------------------------------------ |
| `--service`         | `false` | 移除閘道服務。                                         |
| `--state`           | `false` | 移除狀態與設定。                                       |
| `--workspace`       | `false` | 移除工作區目錄。                                       |
| `--app`             | `false` | 移除 macOS 應用程式。                                  |
| `--all`             | `false` | `--service --state --workspace --app` 的簡寫。          |
| `--yes`             | `false` | 略過確認提示。                                         |
| `--non-interactive` | `false` | 停用提示；必須搭配 `--yes`。                           |
| `--dry-run`         | `false` | 顯示預計執行的動作，但不移除檔案。                     |

未指定範圍旗標時，互動式多選提示會要求選擇要移除的元件（預設預先選取服務、狀態與工作區）。

## 範例

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

## 注意事項

- 移除狀態或工作區之前，請先執行 `openclaw backup create`，以建立可還原的快照。
- 除非同時選取 `--workspace`，否則 `--state` 會保留已設定的工作區目錄。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [解除安裝](/zh-TW/install/uninstall)

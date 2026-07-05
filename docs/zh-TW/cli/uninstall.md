---
read_when:
    - 你想移除閘道服務和/或本機狀態
    - 你想先試跑
summary: '`openclaw uninstall` 的命令列介面參考（移除閘道服務與本機資料）'
title: 解除安裝
x-i18n:
    generated_at: "2026-07-05T11:11:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1e2e3996cf6d5c0fd11e5054c8fe60f7f8d25047193bb13944ca170bf77b581a
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

解除安裝閘道服務和/或本機資料。命令列介面本身不會被
移除；請透過 npm/pnpm 另外解除安裝。

## 選項

| 旗標                | 預設值  | 說明                                                 |
| ------------------- | ------- | ---------------------------------------------------- |
| `--service`         | `false` | 移除閘道服務。                                     |
| `--state`           | `false` | 移除狀態與設定。                                   |
| `--workspace`       | `false` | 移除工作區目錄。                                   |
| `--app`             | `false` | 移除 macOS app。                                   |
| `--all`             | `false` | `--service --state --workspace --app` 的簡寫。      |
| `--yes`             | `false` | 略過確認提示。                                     |
| `--non-interactive` | `false` | 停用提示；需要 `--yes`。                           |
| `--dry-run`         | `false` | 列印規劃的動作，而不移除檔案。                     |

若沒有範圍旗標，互動式多選會提示要移除哪些元件
（預設預先選取服務、狀態、工作區）。

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

- 在移除狀態或工作區之前，請先執行 `openclaw backup create` 以建立可還原的快照。
- 除非也選取 `--workspace`，否則 `--state` 會保留已設定的工作區目錄。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [解除安裝](/zh-TW/install/uninstall)

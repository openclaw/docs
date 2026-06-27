---
read_when:
    - 您想移除閘道服務及/或本機狀態
    - 你想先進行試跑
summary: '`openclaw uninstall` 的命令列介面參考（移除閘道服務 + 本機資料）'
title: 解除安裝
x-i18n:
    generated_at: "2026-06-27T19:09:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f90fa8cf513e2e8cd422c3b8a880e7fd20fb71131a3ec88260e765daa2ace543
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

解除安裝閘道服務與本機資料（命令列介面仍保留）。

選項：

- `--service`：移除閘道服務
- `--state`：移除狀態與設定
- `--workspace`：移除工作區目錄
- `--app`：移除 macOS 應用程式
- `--all`：移除服務、狀態、工作區與應用程式
- `--yes`：略過確認提示
- `--non-interactive`：停用提示；需要 `--yes`
- `--dry-run`：列印動作但不移除檔案

範例：

```bash
openclaw backup create
openclaw uninstall
openclaw uninstall --service --yes --non-interactive
openclaw uninstall --state --workspace --yes --non-interactive
openclaw uninstall --all --yes
openclaw uninstall --dry-run
```

注意事項：

- 如果你想在移除狀態或工作區之前取得可還原的快照，請先執行 `openclaw backup create`。
- `--state` 會保留已設定的工作區目錄，除非同時選取 `--workspace`。
- `--all` 是同時移除服務、狀態、工作區與應用程式的簡寫。
- `--non-interactive` 需要 `--yes`。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [解除安裝](/zh-TW/install/uninstall)

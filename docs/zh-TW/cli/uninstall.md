---
read_when:
    - 你想要移除 Gateway 服務及/或本機狀態
    - 你想先進行模擬執行
summary: '`openclaw uninstall` 的 CLI 參考（移除 Gateway 服務 + 本機資料）'
title: 解除安裝
x-i18n:
    generated_at: "2026-04-30T02:57:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b774fc006e989068b9126aff2a72888fd808a2e0e3d5ea8b57e6ab9d9f1b63ee
    source_path: cli/uninstall.md
    workflow: 16
---

# `openclaw uninstall`

解除安裝 Gateway 服務 + 本機資料（CLI 保留）。

選項：

- `--service`：移除 Gateway 服務
- `--state`：移除狀態和設定
- `--workspace`：移除工作區目錄
- `--app`：移除 macOS app
- `--all`：移除服務、狀態、工作區和 app
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

- 如果你想在移除狀態或工作區之前建立可還原的快照，請先執行 `openclaw backup create`。
- `--all` 是同時移除服務、狀態、工作區和 app 的簡寫。
- `--non-interactive` 需要 `--yes`。

## 相關

- [CLI 參考](/zh-TW/cli)
- [解除安裝](/zh-TW/install/uninstall)

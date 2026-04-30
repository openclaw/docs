---
read_when:
    - 你想要 zsh/bash/fish/PowerShell 的殼層自動補全功能
    - 你需要將補全指令碼快取在 OpenClaw 狀態下
summary: CLI 參考：`openclaw completion`（產生／安裝 shell 自動補全腳本）
title: 完成
x-i18n:
    generated_at: "2026-04-30T02:52:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

產生 shell 補全指令碼，並可選擇安裝到你的 shell 設定檔。

## 使用方式

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## 選項

- `-s, --shell <shell>`：shell 目標（`zsh`、`bash`、`powershell`、`fish`；預設：`zsh`）
- `-i, --install`：透過在你的 shell 設定檔加入 source 行來安裝補全
- `--write-state`：將補全指令碼寫入 `$OPENCLAW_STATE_DIR/completions`，不輸出到標準輸出
- `-y, --yes`：略過安裝確認提示

## 注意事項

- `--install` 會將一個小型的「OpenClaw 補全」區塊寫入你的 shell 設定檔，並指向快取的指令碼。
- 若未使用 `--install` 或 `--write-state`，此命令會將指令碼輸出到標準輸出。
- 補全產生會預先載入命令樹，因此會包含巢狀子命令。

## 相關

- [CLI 參考](/zh-TW/cli)

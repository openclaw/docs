---
read_when:
    - 你想要 zsh/bash/fish/PowerShell 的 shell 自動完成指令功能
    - 您需要將自動補全指令碼快取在 OpenClaw 狀態目錄下
summary: '`openclaw completion` 的命令列介面參考（產生／安裝 Shell 自動完成指令碼）'
title: 完成度
x-i18n:
    generated_at: "2026-07-11T21:12:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

產生 shell 自動完成指令稿、將其快取於 OpenClaw 狀態目錄下，並可選擇安裝至 shell 設定檔。

## 用法

```bash
openclaw completion                          # 將 zsh 指令稿輸出至標準輸出
openclaw completion --shell fish             # 輸出 fish 指令稿
openclaw completion --write-state            # 快取所有 shell 的指令稿
openclaw completion --write-state --install  # 快取後一次完成安裝
openclaw completion --shell bash --write-state
```

## 選項

- `-s, --shell <shell>`：目標 shell（`zsh`、`bash`、`powershell`、`fish`；預設：`zsh`）
- `-i, --install`：在 shell 設定檔中加入快取指令稿的載入行，以安裝自動完成功能
- `--write-state`：將自動完成指令稿寫入 `$OPENCLAW_STATE_DIR/completions`（預設為 `~/.openclaw/completions`），而不輸出至標準輸出；搭配 `--shell` 時僅寫入該 shell 的指令稿，否則會寫入全部四種 shell 的指令稿
- `-y, --yes`：略過安裝確認提示（非互動模式）

## 安裝流程

`--install` 會將設定檔指向快取的指令稿，因此快取必須先存在：若快取不存在，命令會失敗並提示你執行 `openclaw completion --write-state`。同時使用 `--write-state --install`，即可一次完成兩者。未指定 `--shell` 時，`--install` 會從 `$SHELL` 偵測 shell（若無法偵測則使用 zsh）。

安裝程序會將一小段 `# OpenClaw Completion` 區塊寫入 shell 設定檔，並將任何較舊且緩慢的 `source <(openclaw completion ...)` 行替換為快取指令稿的載入行：

| Shell      | 設定檔                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc`（若 `~/.bashrc` 不存在，則改用 `~/.bash_profile`）                                                                                                                            |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1`（在 Windows 上：`Documents/PowerShell/Microsoft.PowerShell_profile.ps1`；若使用 Windows PowerShell，則為 `Documents/WindowsPowerShell/...`） |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## 注意事項

- 未使用 `--install` 或 `--write-state` 時，命令會將指令稿輸出至標準輸出。
- 產生自動完成指令稿時，會立即載入完整的命令樹，包括外掛的命令列介面命令，因此也會納入巢狀子命令。
- `openclaw update` 會在成功更新後自動重新整理自動完成快取；`openclaw doctor` 可修復遺失或過期的自動完成設定。

## 相關內容

- [命令列介面參考](/zh-TW/cli)

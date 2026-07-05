---
read_when:
    - 你想要 zsh/bash/fish/PowerShell 的 shell 補全
    - 你需要在 OpenClaw 狀態下快取補全指令碼
summary: '`openclaw completion` 的命令列介面參考（產生／安裝 shell 補全指令碼）'
title: 完成
x-i18n:
    generated_at: "2026-07-05T11:08:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

產生 shell 補全指令碼，將其快取到 OpenClaw 狀態底下，並可選擇安裝到你的 shell 設定檔中。

## 用法

```bash
openclaw completion                          # print zsh script to stdout
openclaw completion --shell fish             # print fish script
openclaw completion --write-state            # cache scripts for all shells
openclaw completion --write-state --install  # cache, then install in one step
openclaw completion --shell bash --write-state
```

## 選項

- `-s, --shell <shell>`：shell 目標（`zsh`、`bash`、`powershell`、`fish`；預設：`zsh`）
- `-i, --install`：透過將快取指令碼的 source 行加入你的 shell 設定檔來安裝補全
- `--write-state`：將補全指令碼寫入 `$OPENCLAW_STATE_DIR/completions`（預設 `~/.openclaw/completions`），且不輸出到 stdout；搭配 `--shell` 時只寫入該 shell，否則寫入全部四種
- `-y, --yes`：略過安裝確認提示（非互動式）

## 安裝流程

`--install` 會讓你的設定檔指向快取指令碼，因此快取必須先存在：如果缺少快取，命令會失敗並提示你執行 `openclaw completion --write-state`。合併使用 `--write-state --install` 可在一個步驟中完成兩者。不使用 `--shell` 時，`--install` 會從 `$SHELL` 偵測 shell（退回使用 zsh）。

安裝會將一小段 `# OpenClaw Completion` 區塊寫入你的 shell 設定檔，並用快取來源行取代任何較舊且緩慢的 `source <(openclaw completion ...)` 行：

| Shell      | 設定檔                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc`（缺少 `~/.bashrc` 時退回使用 `~/.bash_profile`）                                                                                                                  |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1`（在 Windows 上：`Documents/PowerShell/Microsoft.PowerShell_profile.ps1`，或 Windows PowerShell 使用 `Documents/WindowsPowerShell/...`） |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## 備註

- 不使用 `--install` 或 `--write-state` 時，此命令會將指令碼輸出到 stdout。
- 產生補全時會預先載入完整命令樹，包括外掛命令列介面命令，因此會包含巢狀子命令。
- `openclaw update` 會在成功更新後自動重新整理補全快取；`openclaw doctor` 可以修復缺少或過時的補全設定。

## 相關

- [命令列介面參考](/zh-TW/cli)

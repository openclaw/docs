---
read_when:
    - 你想为 zsh/bash/fish/PowerShell 启用 shell 补全
    - 你需要在 OpenClaw 状态下缓存补全脚本
summary: '`openclaw completion` 的 CLI 参考（生成/安装 shell 补全脚本）'
title: 完成
x-i18n:
    generated_at: "2026-07-05T11:08:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

生成 shell 补全脚本，将其缓存在 OpenClaw 状态目录下，并可选择安装到你的 shell 配置文件中。

## 用法

```bash
openclaw completion                          # print zsh script to stdout
openclaw completion --shell fish             # print fish script
openclaw completion --write-state            # cache scripts for all shells
openclaw completion --write-state --install  # cache, then install in one step
openclaw completion --shell bash --write-state
```

## 选项

- `-s, --shell <shell>`：shell 目标（`zsh`、`bash`、`powershell`、`fish`；默认：`zsh`）
- `-i, --install`：通过向你的 shell 配置文件添加缓存脚本的 source 行来安装补全
- `--write-state`：将补全脚本写入 `$OPENCLAW_STATE_DIR/completions`（默认 `~/.openclaw/completions`），不打印到 stdout；带 `--shell` 时只写入该 shell，否则写入全部四种
- `-y, --yes`：跳过安装确认提示（非交互式）

## 安装流程

`--install` 会让你的配置文件指向缓存脚本，因此缓存必须先存在：如果缺失，命令会失败并提示你运行 `openclaw completion --write-state`。组合使用 `--write-state --install` 可在一步中完成两者。不带 `--shell` 时，`--install` 会从 `$SHELL` 检测 shell（回退到 zsh）。

安装会把一个小的 `# OpenClaw Completion` 块写入你的 shell 配置文件，并将任何较旧的慢速 `source <(openclaw completion ...)` 行替换为缓存 source 行：

| Shell      | 配置文件                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc`（当 `~/.bashrc` 缺失时回退到 `~/.bash_profile`）                                                                                                                               |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1`（在 Windows 上：`Documents/PowerShell/Microsoft.PowerShell_profile.ps1`，或 Windows PowerShell 使用 `Documents/WindowsPowerShell/...`） |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## 说明

- 不带 `--install` 或 `--write-state` 时，命令会将脚本打印到 stdout。
- 补全生成会预先加载完整命令树，包括插件 CLI 命令，因此会包含嵌套子命令。
- `openclaw update` 会在成功更新后自动刷新补全缓存；`openclaw doctor` 可以修复缺失或过期的补全设置。

## 相关

- [CLI 参考](/zh-CN/cli)

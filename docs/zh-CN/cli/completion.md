---
read_when:
    - 你想要适用于 zsh/bash/fish/PowerShell 的 shell 补全功能
    - 你需要将补全脚本缓存在 OpenClaw 状态目录中
summary: '`openclaw completion` 的 CLI 参考（生成/安装 shell 补全脚本）'
title: 完成
x-i18n:
    generated_at: "2026-07-11T20:23:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

生成 shell 补全脚本，将其缓存到 OpenClaw 状态目录中，并可选择安装到你的 shell 配置文件。

## 用法

```bash
openclaw completion                          # 将 zsh 脚本输出到标准输出
openclaw completion --shell fish             # 输出 fish 脚本
openclaw completion --write-state            # 缓存所有 shell 的脚本
openclaw completion --write-state --install  # 缓存后一步完成安装
openclaw completion --shell bash --write-state
```

## 选项

- `-s, --shell <shell>`：目标 shell（`zsh`、`bash`、`powershell`、`fish`；默认值：`zsh`）
- `-i, --install`：向你的 shell 配置文件添加缓存脚本的 source 行，以安装补全功能
- `--write-state`：将补全脚本写入 `$OPENCLAW_STATE_DIR/completions`（默认为 `~/.openclaw/completions`），而不输出到标准输出；与 `--shell` 一起使用时仅写入该 shell 的脚本，否则写入全部四种 shell 的脚本
- `-y, --yes`：跳过安装确认提示（非交互模式）

## 安装流程

`--install` 会让你的配置文件引用缓存的脚本，因此必须先存在缓存：如果缓存不存在，命令将失败并提示你运行 `openclaw completion --write-state`。组合使用 `--write-state --install` 可一步完成这两项操作。未指定 `--shell` 时，`--install` 会从 `$SHELL` 检测 shell（检测失败时回退到 zsh）。

安装过程会在你的 shell 配置文件中写入一个简短的 `# OpenClaw Completion` 块，并将所有较旧且缓慢的 `source <(openclaw completion ...)` 行替换为引用缓存的 source 行：

| Shell      | 配置文件                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc`（当 `~/.bashrc` 不存在时回退到 `~/.bash_profile`）                                                                                                                            |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1`（在 Windows 上：`Documents/PowerShell/Microsoft.PowerShell_profile.ps1`；对于 Windows PowerShell，则为 `Documents/WindowsPowerShell/...`） |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## 说明

- 未使用 `--install` 或 `--write-state` 时，该命令会将脚本输出到标准输出。
- 生成补全脚本时会立即加载完整的命令树，包括插件 CLI 命令，因此也会包含嵌套子命令。
- `openclaw update` 会在成功更新后自动刷新补全缓存；`openclaw doctor` 可以修复缺失或过期的补全设置。

## 相关内容

- [CLI 参考](/zh-CN/cli)

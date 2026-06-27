---
read_when:
    - 你想要为本地 OpenClaw 状态提供一等备份归档
    - 你想在重置或卸载前预览将包含哪些路径
summary: '`openclaw backup` 的 CLI 参考（创建本地备份归档）'
title: 备份
x-i18n:
    generated_at: "2026-06-27T01:35:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

为 OpenClaw 状态、配置、认证配置文件、渠道/提供商凭据、会话以及可选的工作区创建本地备份归档。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## 说明

- 归档包含一个 `manifest.json` 文件，其中记录了解析后的源路径和归档布局。
- 默认输出是在当前工作目录中生成带时间戳的 `.tar.gz` 归档。
- 带时间戳的备份文件名使用你的机器本地时区，并包含 UTC 偏移量。
- 如果当前工作目录位于某个已备份的源树内，OpenClaw 会回退到你的主目录作为默认归档位置。
- 现有归档文件绝不会被覆盖。
- 位于源状态/工作区树内的输出路径会被拒绝，以避免自包含。
- `openclaw backup verify <archive>` 会验证归档只包含一个根清单，拒绝遍历风格的归档路径，并检查每个清单声明的载荷都存在于 tarball 中。
- `openclaw backup create --verify` 会在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 只备份活动 JSON 配置文件。

## 会备份什么

`openclaw backup create` 会从你的本地 OpenClaw 安装规划备份源：

- OpenClaw 本地状态解析器返回的状态目录，通常是 `~/.openclaw`
- 活动配置文件路径
- 解析后的 `credentials/` 目录（当它存在于状态目录之外时）
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

模型认证配置文件已经是状态目录的一部分，位于
`agents/<agentId>/agent/auth-profiles.json` 下，因此通常会被状态备份条目覆盖。

如果你使用 `--only-config`，OpenClaw 会跳过状态、凭据目录和工作区发现，只归档活动配置文件路径。

OpenClaw 会在构建归档前规范化路径。如果配置、凭据目录或某个工作区已经位于状态目录内，它们不会作为单独的顶层备份源重复包含。缺失路径会被跳过。

归档载荷会存储这些源树中的文件内容，嵌入的 `manifest.json` 会记录解析后的绝对源路径，以及每个资产使用的归档布局。

创建归档期间，OpenClaw 会跳过已知的实时变更文件，这些文件没有恢复价值，包括活动智能体会话转录、cron 运行日志、滚动日志、投递队列、状态目录下的 socket/pid/临时文件，以及相关的持久队列临时文件。JSON 结果包含 `skippedVolatileCount`，因此自动化可以看到有多少文件被有意省略。

状态目录 `extensions/` 树下已安装插件的源文件和清单文件会被包含，但其嵌套的 `node_modules/` 依赖树会被跳过。这些依赖是可重建的安装产物；恢复归档后，如果恢复的插件报告缺少依赖，请使用 `openclaw plugins update <id>`，或通过 `openclaw plugins install <spec> --force` 重新安装插件。

## 无效配置行为

`openclaw backup` 会有意绕过常规配置预检，因此它仍然可以在恢复期间提供帮助。由于工作区发现依赖有效配置，当配置文件存在但无效且工作区备份仍启用时，`openclaw backup create` 现在会快速失败。

如果你在这种情况下仍想要部分备份，请重新运行：

```bash
openclaw backup create --no-include-workspace
```

这样会将状态、配置和外部凭据目录保留在范围内，同时完全跳过工作区发现。

如果你只需要配置文件本身的副本，`--only-config` 在配置格式错误时也能使用，因为它不依赖解析配置来发现工作区。

## 大小和性能

OpenClaw 不强制执行内置的最大备份大小或单文件大小限制。

实际限制来自本地机器和目标文件系统：

- 临时归档写入加最终归档所需的可用空间
- 遍历大型工作区树并将其压缩为 `.tar.gz` 所需的时间
- 如果你使用 `openclaw backup create --verify` 或运行 `openclaw backup verify`，重新扫描归档所需的时间
- 目标路径处的文件系统行为。OpenClaw 优先使用不覆盖的硬链接发布步骤，并在不支持硬链接时回退到独占复制

大型工作区通常是归档大小的主要驱动因素。如果你想要更小或更快的备份，请使用 `--no-include-workspace`。

如需最小归档，请使用 `--only-config`。

## 相关

- [CLI 参考](/zh-CN/cli)

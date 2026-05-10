---
read_when:
    - 你需要一个用于本地 OpenClaw 状态的一流备份归档
    - 你想在重置或卸载前预览会包含哪些路径
summary: '`openclaw backup` 的 CLI 参考（创建本地备份归档）'
title: 备份
x-i18n:
    generated_at: "2026-05-10T19:26:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

为 OpenClaw 状态、配置、身份验证配置文件、渠道/提供商凭证、会话以及可选的工作区创建本地备份归档文件。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## 注意事项

- 归档文件包含一个 `manifest.json` 文件，其中记录了解析后的源路径和归档布局。
- 默认输出是在当前工作目录中带时间戳的 `.tar.gz` 归档文件。
- 如果当前工作目录位于已备份的源树内，OpenClaw 会回退到你的主目录作为默认归档位置。
- 现有归档文件永远不会被覆盖。
- 位于源状态/工作区树内部的输出路径会被拒绝，以避免自包含。
- `openclaw backup verify <archive>` 会验证归档文件仅包含一个根清单，拒绝遍历式归档路径，并检查清单声明的每个载荷是否都存在于 tarball 中。
- `openclaw backup create --verify` 会在写入归档文件后立即运行该验证。
- `openclaw backup create --only-config` 只备份当前活动的 JSON 配置文件。

## 会备份哪些内容

`openclaw backup create` 会根据你的本地 OpenClaw 安装规划备份源：

- OpenClaw 本地状态解析器返回的状态目录，通常是 `~/.openclaw`
- 当前活动的配置文件路径
- 当解析出的 `credentials/` 目录存在于状态目录外部时，会包含该目录
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

模型身份验证配置文件已经是状态目录的一部分，位于
`agents/<agentId>/agent/auth-profiles.json` 下，因此它们通常会被状态备份条目覆盖。

如果你使用 `--only-config`，OpenClaw 会跳过状态、凭证目录和工作区发现，只归档当前活动的配置文件路径。

OpenClaw 会在构建归档文件前对路径进行规范化。如果配置、凭证目录或工作区已经位于状态目录内部，它们不会作为单独的顶级备份源重复包含。缺失的路径会被跳过。

归档载荷会存储这些源树中的文件内容，嵌入的 `manifest.json` 会记录解析后的绝对源路径，以及每个资产使用的归档布局。

在创建归档文件期间，OpenClaw 会跳过已知的实时变更文件，因为它们没有恢复价值，包括活动 Agent 会话转录、cron 运行日志、滚动日志、投递队列、状态目录下的 socket/pid/临时文件，以及相关持久队列临时文件。JSON 结果包含 `skippedVolatileCount`，以便自动化流程查看有多少文件被有意省略。

状态目录的 `extensions/` 树下已安装的插件源文件和清单文件会被包含，但其嵌套的 `node_modules/` 依赖树会被跳过。这些依赖是可重建的安装产物；恢复归档文件后，如果恢复的插件报告缺少依赖，请使用 `openclaw plugins update <id>`，或通过 `openclaw plugins install <spec> --force` 重新安装该插件。

## 无效配置行为

`openclaw backup` 会有意绕过常规配置预检，以便在恢复期间仍能提供帮助。由于工作区发现依赖有效配置，当配置文件存在但无效且仍启用工作区备份时，`openclaw backup create` 现在会快速失败。

如果你在这种情况下仍想进行部分备份，请重新运行：

```bash
openclaw backup create --no-include-workspace
```

这会将状态、配置和外部凭证目录保留在范围内，同时完全跳过工作区发现。

如果你只需要配置文件本身的副本，`--only-config` 也可以在配置格式错误时工作，因为它不依赖解析配置来发现工作区。

## 大小和性能

OpenClaw 不会强制执行内置的最大备份大小或单文件大小限制。

实际限制来自本地机器和目标文件系统：

- 临时归档写入和最终归档所需的可用空间
- 遍历大型工作区树并将其压缩为 `.tar.gz` 所需的时间
- 如果你使用 `openclaw backup create --verify` 或运行 `openclaw backup verify`，重新扫描归档文件所需的时间
- 目标路径处的文件系统行为。OpenClaw 优先使用不覆盖的硬链接发布步骤，并在不支持硬链接时回退到独占复制

大型工作区通常是归档大小的主要驱动因素。如果你想要更小或更快的备份，请使用 `--no-include-workspace`。

若要获得最小的归档文件，请使用 `--only-config`。

## 相关

- [CLI 参考](/zh-CN/cli)

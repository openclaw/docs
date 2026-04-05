---
read_when:
    - 你想为本地 OpenClaw 状态创建一份一等支持的备份归档
    - 你想在重置或卸载前预览将包含哪些路径
summary: '`openclaw backup` 的 CLI 参考（创建本地 OpenClaw 备份归档）'
title: backup
x-i18n:
    generated_at: "2026-04-05T08:18:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

为 OpenClaw 状态、配置、认证配置文件、渠道/提供商凭证、会话，以及可选的工作区创建本地备份归档。

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

- 归档包含一个 `manifest.json` 文件，其中记录了解析后的源路径和归档布局。
- 默认输出是在当前工作目录中创建一个带时间戳的 `.tar.gz` 归档文件。
- 如果当前工作目录位于某个要备份的源目录树内，OpenClaw 会回退到你的主目录作为默认归档位置。
- 绝不会覆盖现有归档文件。
- 源状态/工作区目录树内部的输出路径会被拒绝，以避免把归档文件本身包含进去。
- `openclaw backup verify <archive>` 会验证归档是否恰好包含一个根 `manifest`，拒绝带有路径穿越样式的归档路径，并检查 `manifest` 声明的每个负载是否都存在于 tarball 中。
- `openclaw backup create --verify` 会在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 只会备份当前活动的 JSON 配置文件。

## 会备份哪些内容

`openclaw backup create` 会根据你的本地 OpenClaw 安装规划备份源：

- OpenClaw 本地状态解析器返回的状态目录，通常是 `~/.openclaw`
- 当前活动配置文件路径
- 当 `credentials/` 目录存在且位于状态目录之外时，解析后的该目录
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

模型认证配置文件已经作为状态目录的一部分存在于
`agents/<agentId>/agent/auth-profiles.json` 下，因此通常会被状态备份条目覆盖。

如果你使用 `--only-config`，OpenClaw 会跳过状态、凭证目录和工作区发现，只归档当前活动配置文件路径。

OpenClaw 会在构建归档前规范化路径。如果配置、凭证目录或某个工作区已经位于状态目录内，它们就不会作为单独的顶级备份源被重复收录。缺失路径会被跳过。

归档负载会存储这些源目录树中的文件内容，而内嵌的 `manifest.json` 会记录解析后的绝对源路径，以及为每项资源使用的归档布局。

## 无效配置时的行为

`openclaw backup` 会有意绕过常规配置预检，以便在恢复期间仍然能提供帮助。由于工作区发现依赖有效配置，现在当配置文件存在但无效且仍启用工作区备份时，`openclaw backup create` 会快速失败。

如果你在这种情况下仍然想要部分备份，请重新运行：

```bash
openclaw backup create --no-include-workspace
```

这样仍会将状态、配置和外部凭证目录纳入范围，同时完全跳过工作区发现。

如果你只需要配置文件本身的副本，`--only-config` 在配置格式错误时也可用，因为它不依赖解析配置来发现工作区。

## 大小和性能

OpenClaw 不会强制设置内置的最大备份大小或单文件大小限制。

实际限制来自本地机器和目标文件系统：

- 写入临时归档和最终归档所需的可用空间
- 遍历大型工作区目录树并将其压缩为 `.tar.gz` 所需的时间
- 如果你使用 `openclaw backup create --verify` 或运行 `openclaw backup verify`，重新扫描归档所需的时间
- 目标路径上的文件系统行为。OpenClaw 优先使用“不覆盖”的硬链接发布步骤；当硬链接不受支持时，则回退为独占复制

大型工作区通常是归档大小的主要来源。如果你想要更小或更快的备份，请使用 `--no-include-workspace`。

如果想要最小的归档，请使用 `--only-config`。

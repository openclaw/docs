---
read_when:
    - 你希望为本地 OpenClaw 状态创建一份一流的备份归档。
    - 在重置或卸载之前，你想先预览将会包含哪些路径。
summary: 用于 `openclaw backup` 的 CLI 参考（创建本地备份归档）
title: 备份
x-i18n:
    generated_at: "2026-04-24T04:00:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88d83cf04c163d76658575aa6d90be1dd7379934fa2822a07e13311c4324f8fd
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

- 归档中包含一个 `manifest.json` 文件，其中记录了解析后的源路径和归档布局。
- 默认输出是在当前工作目录中生成一个带时间戳的 `.tar.gz` 归档文件。
- 如果当前工作目录位于某个已备份的源树内，OpenClaw 会回退到你的主目录作为默认归档位置。
- 现有的归档文件绝不会被覆盖。
- 位于源状态树或工作区树内部的输出路径会被拒绝，以避免将归档文件自身包含进去。
- `openclaw backup verify <archive>` 会验证归档是否只包含一个根 `manifest`，拒绝类似路径穿越的归档路径，并检查 `manifest` 中声明的每个有效负载是否都存在于 tarball 中。
- `openclaw backup create --verify` 会在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 只会备份当前激活的 JSON 配置文件。

## 会备份哪些内容

`openclaw backup create` 会根据你的本地 OpenClaw 安装规划备份源：

- 由 OpenClaw 本地状态解析器返回的状态目录，通常是 `~/.openclaw`
- 当前激活的配置文件路径
- 当 `credentials/` 目录位于状态目录之外时，解析得到的 `credentials/` 目录
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

模型认证配置文件本身已位于状态目录下的
`agents/<agentId>/agent/auth-profiles.json`，因此通常已经包含在
状态备份项中。

如果你使用 `--only-config`，OpenClaw 会跳过状态、凭证目录和工作区发现，仅归档当前激活的配置文件路径。

OpenClaw 会在构建归档前规范化路径。如果配置、凭证目录或工作区本身已经位于状态目录中，它们不会作为单独的顶级备份源重复收录。缺失的路径会被跳过。

归档有效负载会存储这些源树中的文件内容，而内嵌的 `manifest.json` 会记录解析后的绝对源路径，以及每个资源所使用的归档布局。

## 无效配置时的行为

`openclaw backup` 会有意绕过常规的配置预检，这样它在恢复场景中仍然可以提供帮助。由于工作区发现依赖于有效配置，当配置文件存在但无效且工作区备份仍然启用时，`openclaw backup create` 现在会快速失败。

如果在这种情况下你仍然想进行部分备份，请重新运行：

```bash
openclaw backup create --no-include-workspace
```

这样会保留状态、配置和外部凭证目录的备份范围，同时完全跳过工作区发现。

如果你只需要配置文件本身的副本，`--only-config` 在配置格式错误时也同样可用，因为它不依赖解析配置来发现工作区。

## 大小与性能

OpenClaw 不会对备份总大小或单个文件大小施加内置上限。

实际限制来自本地机器和目标文件系统：

- 写入临时归档和最终归档所需的可用空间
- 遍历大型工作区树并将其压缩为 `.tar.gz` 所需的时间
- 如果你使用 `openclaw backup create --verify` 或运行 `openclaw backup verify`，重新扫描归档所需的时间
- 目标路径上的文件系统行为。OpenClaw 会优先使用“不覆盖”的硬链接发布步骤；当不支持硬链接时，则回退为排他性复制

大型工作区通常是归档体积变大的主要原因。如果你想要更小或更快的备份，请使用 `--no-include-workspace`。

如果想要最小的归档，请使用 `--only-config`。

## 相关内容

- [CLI 参考](/zh-CN/cli)

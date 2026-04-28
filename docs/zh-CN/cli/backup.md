---
read_when:
    - 你想为本地 OpenClaw 状态创建一份一流的备份归档
    - 你想在重置或卸载之前预览将包含哪些路径
summary: '`openclaw backup` 的 CLI 参考（创建本地备份归档）'
title: 备份
x-i18n:
    generated_at: "2026-04-28T03:09:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

为 OpenClaw 的状态、配置、auth 配置文件、渠道/提供商凭证、会话以及可选的工作区创建本地备份归档。

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

- 该归档包含一个 `manifest.json` 文件，其中记录了解析后的源路径和归档布局。
- 默认输出为当前工作目录中的一个带时间戳的 `.tar.gz` 归档文件。
- 如果当前工作目录位于某个已备份的源目录树内，OpenClaw 会回退到你的主目录作为默认归档位置。
- 现有归档文件绝不会被覆盖。
- 为避免将归档文件自身包含进去，位于源状态/工作区目录树内的输出路径会被拒绝。
- `openclaw backup verify <archive>` 会验证归档是否恰好包含一个根清单文件，拒绝类似路径遍历的归档路径，并检查清单中声明的每个有效载荷是否都存在于 tarball 中。
- `openclaw backup create --verify` 会在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 只会备份当前启用的 JSON 配置文件。

## 备份内容

`openclaw backup create` 会根据你的本地 OpenClaw 安装来规划备份源：

- 由 OpenClaw 本地状态解析器返回的状态目录，通常为 `~/.openclaw`
- 当前启用的配置文件路径
- 当其位于状态目录之外时，解析得到的 `credentials/` 目录
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

模型 auth 配置文件本身已经位于状态目录下的
`agents/<agentId>/agent/auth-profiles.json`，因此通常已经包含在状态备份条目中。

如果你使用 `--only-config`，OpenClaw 会跳过状态、凭证目录和工作区发现，仅归档当前启用的配置文件路径。

OpenClaw 会在构建归档前对路径进行规范化。如果配置文件、凭证目录或某个工作区本身已经位于状态目录中，它们不会再作为单独的顶层备份源重复收录。缺失的路径会被跳过。

归档有效载荷会存储这些源目录树中的文件内容，而嵌入的 `manifest.json` 会记录每个资源对应的已解析绝对源路径以及所使用的归档布局。

状态目录下 `extensions/` 目录树中的已安装插件源码和清单文件会被包含，但其嵌套的 `node_modules/` 依赖目录树会被跳过。这些依赖属于可重建的安装产物；恢复归档后，如果某个已恢复的插件报告缺少依赖，请使用 `openclaw plugins update <id>`，或通过 `openclaw plugins install <spec> --force` 重新安装该插件。

## 无效配置时的行为

`openclaw backup` 会有意绕过常规的配置预检，因此即使在恢复场景中也能继续提供帮助。由于工作区发现依赖有效配置，当配置文件存在但无效且仍启用了工作区备份时，`openclaw backup create` 现在会快速失败。

如果你在这种情况下仍想进行部分备份，请重新运行：

```bash
openclaw backup create --no-include-workspace
```

这样会保留状态、配置和外部凭证目录，同时完全跳过工作区发现。

如果你只需要配置文件本身的副本，`--only-config` 在配置格式错误时同样可用，因为它不依赖解析配置来发现工作区。

## 大小和性能

OpenClaw 不会对备份大小或单个文件大小施加内置上限。

实际限制来自本地机器和目标文件系统：

- 用于临时写入归档以及最终归档的可用空间
- 遍历大型工作区目录树并将其压缩为 `.tar.gz` 所需的时间
- 如果你使用 `openclaw backup create --verify` 或运行 `openclaw backup verify`，重新扫描归档所需的时间
- 目标路径上的文件系统行为。OpenClaw 会优先使用“不覆盖”的硬链接发布步骤；当不支持硬链接时，则回退为独占复制

大型工作区通常是归档体积的主要来源。如果你想要更小或更快的备份，请使用 `--no-include-workspace`。

如果想要最小的归档，请使用 `--only-config`。

## 相关内容

- [CLI 参考](/zh-CN/cli)

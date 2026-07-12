---
read_when:
    - 你希望为本地 OpenClaw 状态创建一个一流的备份归档
    - 你想在重置或卸载前预览将包含哪些路径
summary: '`openclaw backup` 的 CLI 参考（创建本地备份归档）'
title: 备份
x-i18n:
    generated_at: "2026-07-12T14:22:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b40206e74b43edd6c1d2b00de3cbe9fcfa053bfbb2ffdff0323fb8c1671c28ea
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

为 OpenClaw 状态、配置、身份验证配置文件、渠道/提供商凭据、会话以及可选的工作区创建本地备份归档。

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## 注意事项

- 归档中嵌入了一个 `manifest.json`，其中包含解析后的源路径和归档布局。
- 默认输出是在当前工作目录中生成带时间戳的 `.tar.gz` 归档。带时间戳的文件名使用你机器的本地时区，并包含 UTC 偏移量。如果当前工作目录位于要备份的源目录树内，OpenClaw 会改用你的主目录作为默认归档位置。
- 绝不会覆盖现有归档文件。为避免归档包含自身，位于源状态/工作区目录树内的输出路径会被拒绝。
- `openclaw backup verify <archive>` 会检查归档是否仅包含一个根清单，拒绝路径遍历形式的归档路径和 SQLite 辅助文件，确认清单中声明的每项有效载荷均存在，验证每个 SQLite 快照的文件结构，并对 OpenClaw 规范数据库运行完整的完整性检查和角色检查。专用插件 schema 保持不透明，因为它们可能需要所有者定义的 SQLite 能力。`openclaw backup create --verify` 会在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 仅备份当前生效的 JSON 配置文件。

## 备份内容

`openclaw backup create` 根据你的本地 OpenClaw 安装规划备份源：

- 状态目录（通常为 `~/.openclaw`）
- 当前生效的配置文件路径
- 当解析后的 `credentials/` 目录位于状态目录之外时，该目录
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

身份验证配置文件及其他每 Agent 运行时状态存储在状态目录下的 SQLite 中（`agents/<agentId>/agent/openclaw-agent.sqlite`），因此会自动包含在状态备份条目中。

`--only-config` 会跳过状态、凭据目录和工作区发现，仅归档当前生效的配置文件路径。

OpenClaw 在构建归档前会规范化路径：如果配置、凭据目录或工作区已位于状态目录内，则不会将它们重复添加为独立的顶层备份源。缺失的路径会被跳过。

创建归档时，OpenClaw 会跳过已知会实时变化且没有恢复价值的文件：活跃 Agent 会话转录、cron 运行日志、滚动日志、投递队列、状态目录下的套接字/pid/临时文件，以及相关的持久队列临时文件。JSON 结果中的 `skippedVolatileCount` 会报告有多少文件被有意省略。状态目录下的 SQLite 数据库会通过 `VACUUM INTO` 进行压缩，因此已删除页面的残留数据不会进入归档，并且不会复制实时 WAL/SHM 文件。如果某个插件所有的数据库需要当前不可用的所有者定义 SQLite 能力，操作将以失败关闭，而不会回退到原始页面复制。通过工作区备份包含的 SQLite 文件会作为工作区文件复制，不受此压缩保证覆盖。

状态目录的 `extensions/` 目录树下已安装插件的源文件和清单文件会被包含，但其嵌套的 `node_modules/` 依赖目录树会作为可重新构建的安装工件被跳过。恢复归档后，如果恢复的插件报告缺少依赖项，请使用 `openclaw plugins update <id>`，或通过 `openclaw plugins install <spec> --force` 强制重新安装。

## 配置无效时的行为

`openclaw backup` 会绕过常规配置预检，以便在恢复期间仍可提供帮助。工作区发现依赖有效配置，因此当配置文件存在但无效，并且工作区备份仍处于启用状态时，`openclaw backup create` 会快速失败。

在这种情况下，如需进行部分备份，请使用 `--no-include-workspace` 重新运行：它会继续备份状态、配置和外部凭据目录，同时完全跳过工作区发现。

配置格式错误时，`--only-config` 也仍然有效，因为它不会为了发现工作区而解析配置。

## 大小和性能

OpenClaw 不强制实施内置的最大备份大小或单文件大小限制。实际限制来自：

- 临时归档写入和最终归档所需的可用空间
- 遍历大型工作区目录树并将其压缩为 `.tar.gz` 所需的时间
- 使用 `--verify` 或 `openclaw backup verify` 重新扫描归档所需的时间
- 目标文件系统的行为：OpenClaw 优先使用不覆盖的硬链接发布步骤，并在不支持硬链接时回退到独占复制

大型工作区通常是决定归档大小的主要因素。使用 `--no-include-workspace` 可获得更小、更快的备份，或使用 `--only-config` 创建最小归档。

## 相关内容

- [CLI 参考](/zh-CN/cli)

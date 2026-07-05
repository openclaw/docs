---
read_when:
    - 你想要为本地 OpenClaw 状态提供一等支持的备份归档
    - 你想在重置或卸载前预览会包含哪些路径
summary: CLI 参考：`openclaw backup`（创建本地备份归档）
title: 备份
x-i18n:
    generated_at: "2026-07-05T11:06:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48487eb747b88111899106f507b4ce6364b56c65b88da2e33c43fc160c6b17a9
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

为 OpenClaw 状态、配置、凭证配置文件、渠道/提供商凭据、会话以及可选的工作区创建本地备份归档。

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

- 归档内嵌一个 `manifest.json`，其中包含解析后的源路径和归档布局。
- 默认输出是在当前工作目录中带时间戳的 `.tar.gz` 归档。带时间戳的文件名使用你机器的本地时区，并包含 UTC 偏移量。如果当前工作目录位于被备份的源树内，OpenClaw 会回退到你的主目录作为默认归档位置。
- 现有归档文件绝不会被覆盖。源状态/工作区树内的输出路径会被拒绝，以避免自包含。
- `openclaw backup verify <archive>` 会检查归档是否恰好包含一个根清单，拒绝遍历式归档路径，并确认清单声明的每个载荷都存在于 tarball 中。`openclaw backup create --verify` 会在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 仅备份当前有效的 JSON 配置文件。

## 会备份的内容

`openclaw backup create` 会从你的本地 OpenClaw 安装规划来源：

- 状态目录（通常是 `~/.openclaw`）
- 当前有效的配置文件路径
- 已解析的 `credentials/` 目录，前提是它存在于状态目录之外
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

凭证配置文件和其他按智能体划分的运行时状态位于状态目录下的 SQLite 中（`agents/<agentId>/agent/openclaw-agent.sqlite`），因此它们会自动由状态备份条目覆盖。

`--only-config` 会跳过状态、凭据目录和工作区发现，仅归档当前有效的配置文件路径。

OpenClaw 在构建归档前会规范化路径：如果配置、凭据目录或工作区已经位于状态目录内，它们不会作为单独的顶层备份来源重复加入。缺失路径会被跳过。

创建归档期间，OpenClaw 会跳过没有恢复价值的已知实时变更文件：活跃智能体会话转录、cron 运行日志、滚动日志、投递队列、状态目录下的 socket/pid/临时文件，以及相关的持久队列临时文件。JSON 结果中的 `skippedVolatileCount` 会报告有多少文件被有意省略。状态目录下的 SQLite 数据库会被安全快照（`VACUUM INTO`），而不是实时复制，因此打开的 WAL/SHM 文件不会损坏备份。

状态目录的 `extensions/` 树下已安装的插件源文件和清单文件会被包含，但其嵌套的 `node_modules/` 依赖树会作为可重建的安装产物被跳过。恢复归档后，如果恢复的插件报告缺少依赖，请使用 `openclaw plugins update <id>`，或用 `openclaw plugins install <spec> --force` 重新安装。

## 无效配置行为

`openclaw backup` 会绕过常规配置预检，因此它仍可在恢复期间提供帮助。工作区发现依赖有效配置，因此当配置文件存在但无效且工作区备份仍启用时，`openclaw backup create` 会快速失败。

在这种情况下，如需部分备份，请使用 `--no-include-workspace` 重新运行：它会保留状态、配置和外部凭据目录的范围，同时完全跳过工作区发现。

`--only-config` 在配置格式错误时也可工作，因为它不会为工作区发现而解析配置。

## 大小和性能

OpenClaw 不强制内置的最大备份大小或单文件大小限制。实际限制来自：

- 临时归档写入加最终归档所需的可用空间
- 遍历大型工作区树并将其压缩为 `.tar.gz` 所需的时间
- 使用 `--verify` 或 `openclaw backup verify` 重新扫描归档所需的时间
- 目标文件系统行为：OpenClaw 优先使用不覆盖的硬链接发布步骤，并在不支持硬链接时回退到独占复制

大型工作区通常是归档大小的主要驱动因素。使用 `--no-include-workspace` 可获得更小/更快的备份，或使用 `--only-config` 获得最小归档。

## 相关

- [CLI 参考](/zh-CN/cli)

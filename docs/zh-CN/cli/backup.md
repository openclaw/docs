---
read_when:
    - 你希望为本地 OpenClaw 状态创建一个一流的备份归档文件
    - 你需要一个紧凑且经过验证的 OpenClaw SQLite 数据库快照
    - 你希望在重置或卸载前预览将包含哪些路径
summary: '`openclaw backup` 的 CLI 参考（归档和 SQLite 快照）'
title: 备份
x-i18n:
    generated_at: "2026-07-14T13:33:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6f52d6c96feb08862d2f666c0ed777f5ecb12713a10d6a8ec4cc0374d015250d
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
openclaw backup sqlite create --global --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite create --agent main --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite list --repository ~/Backups/openclaw-sqlite
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id>
openclaw backup sqlite verify ~/Backups/openclaw-sqlite/<snapshot-id> --scratch ~/Private/openclaw-scratch
openclaw backup sqlite restore ~/Backups/openclaw-sqlite/<snapshot-id> --target ./restored/openclaw.sqlite
```

## 注意事项

- 归档中嵌入一个 `manifest.json`，其中包含解析后的源路径和归档布局。
- 默认输出是在当前工作目录中创建带时间戳的 `.tar.gz` 归档。带时间戳的文件名使用你的计算机本地时区，并包含 UTC 偏移量。如果当前工作目录位于要备份的源目录树内，OpenClaw 会改用你的主目录作为默认归档位置。
- 绝不会覆盖现有归档文件。为避免将归档自身包含在内，位于源状态/工作区目录树中的输出路径会被拒绝。
- `openclaw backup verify <archive>` 会检查归档是否恰好包含一个根清单，拒绝遍历式归档路径和 SQLite 辅助文件，确认清单中声明的每个载荷均存在，验证每个 SQLite 快照的文件结构，并对 OpenClaw 规范数据库运行完整的完整性和角色检查。专用插件 schema 保持不透明，因为它们可能需要所有者定义的 SQLite 能力。`openclaw backup create --verify` 会在写入归档后立即运行该验证。
- `openclaw backup create --only-config` 仅备份当前使用的 JSON 配置文件。

## SQLite 快照

当你需要针对某个 OpenClaw 所有的 SQLite 数据库创建可移植工件，而不是创建覆盖范围广泛的状态归档时，请使用 `openclaw backup sqlite`。

创建快照时只接受一个具名来源：

| 命令                                                            | 数据库                 |
| --------------------------------------------------------------- | ---------------------- |
| `openclaw backup sqlite create --global --repository <dir>`     | OpenClaw 共享状态      |
| `openclaw backup sqlite create --agent <id> --repository <dir>` | 每个 Agent 一个数据库 |

仓库中每个已提交快照对应一个目录。每个快照目录恰好包含：

- `manifest.json`
- `database.sqlite`

创建快照时，会先验证实时数据库，再使用 SQLite `VACUUM INTO` 将已提交的 WAL 状态捕获到紧凑数据库中，随后再次验证生成的数据库，并在不覆盖现有路径的情况下发布完整目录。全局快照会移除临时投递队列行并再次压缩，因此已删除的队列载荷不会保留在空闲页中。

不要将实时的 `.sqlite`、`-wal`、`-shm` 或 `-journal` 文件复制为可移植工件。仅复制完整的快照目录。

SQLite 快照可能包含身份验证配置文件、会话状态、插件状态及其他敏感记录。应使用与实时 OpenClaw 状态目录相同的权限、加密、保留策略和目标位置限制来保护快照仓库。

### 验证和恢复

```bash
openclaw backup sqlite verify <snapshot-directory>
openclaw backup sqlite restore <snapshot-directory> --target <new-database-path>
```

验证会检查严格的清单结构、工件大小和 SHA-256、SQLite 完整性、外键、schema 版本、数据库角色和所有者，以及 OpenClaw 所有的索引定义。

验证会检查一份私有且内容固定的副本，从而防止路径名竞态替换 SQLite 所检查的字节。默认情况下，该临时副本会创建在快照仓库旁边，并在命令返回前删除。暂存根目录及其祖先目录链必须能够防止其他用户替换它。POSIX 根目录必须归当前用户所有，且不能允许组或所有人写入；对于用户所有的子目录，可接受 `/tmp` 等带粘滞位的祖先目录。会暴露暂存内容或导致暂存内容可被替换的 macOS ACL 授权将被拒绝。Windows 根目录及其祖先目录必须归当前用户或受信任的操作系统主体所有，并通过 ACL 拒绝不受信任者访问暂存内容。对于只读挂载点或网络共享，请在具备同等加密和目标位置控制的存储上通过 `--scratch <existing-private-directory>` 指定暂存位置。

创建快照时，会在暂存或发布数据库字节之前，对仓库应用相同的所有者、ACL、祖先目录和路径标识检查。

恢复操作会重复验证，并且仅写入全新目标。它会拒绝现有目标以及 `-wal`、`-shm` 或 `-journal` 辅助文件，且绝不会原地替换实时 OpenClaw 数据库。目标父目录须满足与验证暂存目录相同的路径安全要求。启用恢复后的数据库仍需由操作员显式离线执行。

快照仓库是本地目录。调度、上传、保留、增量 WAL 包、故障转移和启动时恢复行为有意不包含在此命令的范围内。

## 备份内容

`openclaw backup create` 根据你的本地 OpenClaw 安装规划来源：

- 状态目录（通常为 `~/.openclaw`）
- 当前使用的配置文件路径
- 解析后的 `credentials/` 目录（当其位于状态目录之外且存在时）
- 从当前配置中发现的工作区目录，除非你传入 `--no-include-workspace`

身份验证配置文件及其他按 Agent 划分的运行时状态位于状态目录下的 SQLite 中（`agents/<agentId>/agent/openclaw-agent.sqlite`），因此会自动包含在状态备份项中。

`--only-config` 会跳过状态、凭据目录和工作区发现，仅归档当前使用的配置文件路径。

OpenClaw 会在构建归档前规范化路径：如果配置、凭据目录或工作区已经位于状态目录内，则不会将其重复添加为单独的顶层备份来源。缺失的路径会被跳过。

创建归档期间，OpenClaw 会在 `tar` 读取路径前排除已知的实时变更路径。这可以避免文件记录大小与并发写入之间出现竞态。该过滤器会在每个备份的状态目录下应用以下相对于状态目录的规则：

| 相对于状态目录的范围                           | 跳过的文件后缀                |
| -------------------------------------------- | ----------------------------- |
| `sessions/**`                                | `.jsonl`、`.log`              |
| `agents/<agentId>/sessions/**`               | `.jsonl`、`.log`              |
| `cron/runs/**`                               | `.jsonl`、`.log`              |
| `logs/**`                                    | `.jsonl`、`.log`              |
| `delivery-queue/**`                          | `.json`、`.delivered`、`.tmp` |
| `session-delivery-queue/**`                  | `.json`、`.delivered`、`.tmp` |
| 已备份状态目录下的任何路径                     | `.sock`、`.pid`、`.tmp`       |

这些规则不会过滤状态目录之外的工作区文件。它们也会忽略与表格规则匹配的已完成对话记录和日志文件，因此如有需要，请单独保留这些记录。JSON 结果中的 `skippedVolatileCount` 会报告有多少文件被有意忽略。

状态目录下的 SQLite 数据库会使用 `VACUUM INTO` 进行压缩，因此已删除页面中的残留数据不会进入归档，并且不会复制实时 WAL/SHM 文件。如果插件所有的数据库需要无法使用的所有者定义 SQLite 能力，操作会以失败关闭方式终止，而不会退回到原始页面复制。通过工作区备份纳入的 SQLite 文件会作为工作区文件复制，不受此压缩保证覆盖。

状态目录的 `extensions/` 目录树下已安装插件的源文件和清单文件会被包含在内，但其嵌套的 `node_modules/` 依赖目录树会作为可重新构建的安装工件而被跳过。恢复归档后，如果恢复的插件报告缺少依赖项，请使用 `openclaw plugins update <id>`，或通过 `openclaw plugins install <spec> --force` 重新安装。

## 配置无效时的行为

`openclaw backup` 会绕过常规配置预检，因此即使在恢复期间也能提供帮助。工作区发现依赖有效配置，因此当配置文件存在但无效，并且仍启用了工作区备份时，`openclaw backup create` 会快速失败。

在这种情况下，如需执行部分备份，请使用 `--no-include-workspace` 重新运行：它会继续备份状态、配置和外部凭据目录，同时完全跳过工作区发现。

当配置格式错误时，`--only-config` 也仍然有效，因为它不会为发现工作区而解析配置。

## 大小和性能

OpenClaw 不会强制执行内置的最大备份大小或单文件大小限制。实际限制取决于：

- 临时归档写入和最终归档所需的可用空间
- 遍历大型工作区目录树并将其压缩为 `.tar.gz` 所需的时间
- 使用 `--verify` 或 `openclaw backup verify` 重新扫描归档所需的时间
- 目标文件系统行为：OpenClaw 优先使用不覆盖现有文件的硬链接发布步骤，并在不支持硬链接时退回到独占复制

大型工作区通常是决定归档大小的主要因素。使用 `--no-include-workspace` 可创建更小、更快的备份；使用 `--only-config` 可创建最小的归档。

## 相关内容

- [CLI 参考](/zh-CN/cli)

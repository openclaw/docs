---
read_when:
    - 你遇到连接或身份验证问题，并希望获得引导式修复。
    - 你已更新并希望进行完整性检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-07-12T14:23:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e616fd0843183167662292acf501297f44520050b664796fbb15a117cb68905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

针对 Gateway 网关、渠道、插件、Skills、模型路由、本地状态和配置迁移执行健康检查并提供快速修复。当某些功能未按预期运行，并且你希望通过一条命令了解问题所在时，请使用它。

相关内容：

- 故障排查：[故障排查](/zh-CN/gateway/troubleshooting)
- 安全审计：[安全](/zh-CN/gateway/security)

## 工作模式

Doctor 有五种工作模式：

| 工作模式                  | 命令                                      | 行为                                                                    |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| 检查                      | `openclaw doctor`                         | 面向人工的检查和引导式提示。                                            |
| 修复                      | `openclaw doctor --fix`                   | 应用受支持的修复；除非非交互式修复是安全的，否则会使用提示。            |
| 检查模式                  | `openclaw doctor --lint`                  | 为 CI、预检和评审门禁提供只读的结构化发现。                             |
| 共享 SQLite 维护          | `openclaw doctor --state-sqlite compact`  | 显式对规范共享状态数据库执行检查点、压缩和验证。                        |
| 会话 SQLite 迁移          | `openclaw doctor --session-sqlite <mode>` | 检查、导入、验证、压缩、恢复或还原会话状态。                            |

当自动化需要稳定结果时，优先使用 `--lint`。当人工操作员希望 Doctor 编辑配置或状态时，优先使用 `--fix`。

## 示例

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

对于渠道专属权限，请使用渠道探测，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` 报告 Bot 对特定渠道目标的实际权限。`channels status --probe` 审计所有已配置的渠道和语音自动加入目标。

## 选项

| 选项                            | 效果                                                                                                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | 禁用工作区记忆/搜索建议。                                                                                                                                                                             |
| `--yes`                         | 不提示并接受默认值。                                                                                                                                                                                   |
| `--repair` / `--fix`            | 不提示并应用建议的非服务修复（`--fix` 是别名）。安装或重写 Gateway 网关服务仍然需要交互式确认或显式的 `gateway` 命令。                                                                                  |
| `--force`                       | 应用激进修复，包括覆盖自定义服务配置。                                                                                                                                                                 |
| `--non-interactive`             | 不显示提示运行；仅执行安全迁移和非服务修复。                                                                                                                                                           |
| `--generate-gateway-token`      | 生成并配置 Gateway 网关令牌。                                                                                                                                                                         |
| `--allow-exec`                  | 允许 Doctor 在验证密钥时执行已配置的 `exec` SecretRefs。                                                                                                                                              |
| `--deep`                        | 扫描系统服务中的其他 Gateway 网关安装；报告最近的 Gateway 网关监督程序重启移交。                                                                                                                      |
| `--lint`                        | 以只读模式运行现代化健康检查并输出诊断发现。                                                                                                                                                           |
| `--post-upgrade`                | 运行升级后的插件兼容性探测；发现会输出到 stdout；如果存在任何错误级别的发现，则退出码为 1。                                                                                                            |
| `--state-sqlite <mode>`         | 显式运行共享状态 SQLite 维护。唯一的模式是 `compact`。                                                                                                                                                 |
| `--session-sqlite <mode>`       | 运行指定的会话 SQLite 迁移模式：`inspect`、`dry-run`、`import`、`validate`、`compact`、`recover` 或 `restore`。                                                                                          |
| `--session-sqlite-store <path>` | 与 `--session-sqlite` 一起使用：选择一个旧版 `sessions.json` 存储路径。                                                                                                                                |
| `--session-sqlite-agent <id>`   | 与 `--session-sqlite` 一起使用：选择一个已配置的智能体。                                                                                                                                               |
| `--session-sqlite-all-agents`   | 与 `--session-sqlite` 一起使用：选择已配置和已发现的智能体存储。                                                                                                                                       |
| `--github-issue`                | 与 `--session-sqlite recover` 一起使用：准备一份经过脱敏的 openclaw/openclaw Issue 报告；在使用 `--yes` 或交互式确认后，Doctor 会使用 `gh` 创建该报告。                                                  |
| `--json`                        | 与 `--lint` 一起使用：输出 JSON 发现。与 `--post-upgrade` 一起使用：输出 `{ probesRun, findings }`。与 `--state-sqlite` 或 `--session-sqlite` 一起使用：以 JSON 格式输出维护报告。                       |
| `--severity-min <level>`        | 与 `--lint` 一起使用：丢弃低于 `info`、`warning` 或 `error` 的发现。                                                                                                                                   |
| `--all`                         | 与 `--lint` 一起使用：运行所有已注册的检查，包括默认集合中排除的选择启用检查。                                                                                                                         |
| `--skip <id>`                   | 与 `--lint` 一起使用：跳过某个检查 ID。可重复使用。                                                                                                                                                    |
| `--only <id>`                   | 与 `--lint` 一起使用：仅运行给定的检查 ID。可重复使用。                                                                                                                                                |

`--severity-min`、`--all`、`--only` 和 `--skip` 只能与 `--lint` 一起使用；`--json` 可与 `--lint`、`--post-upgrade`、`--state-sqlite` 和 `--session-sqlite` 一起使用。

## Doctor lint mode

`openclaw doctor --lint` 是只读的：不显示提示、不执行修复，也不重写配置/状态。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

面向人工的输出很精简：

```text
doctor --lint：运行了 6 项检查，发现 1 个问题
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode 未设置；Gateway 网关启动将被阻止。
    修复：运行 `openclaw configure` 并设置 Gateway 网关模式（local/remote），或运行 `openclaw config set gateway.mode local`。
```

JSON 输出是脚本接口：

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode 未设置；Gateway 网关启动将被阻止。",
      "path": "gateway.mode",
      "fixHint": "运行 `openclaw configure` 并设置 Gateway 网关模式（local/remote），或运行 `openclaw config set gateway.mode local`。"
    }
  ]
}
```

退出码：

| 代码 | 含义                                                       |
| ---- | ---------------------------------------------------------- |
| `0`  | 所选严重性阈值或更高级别没有发现。                         |
| `1`  | 至少有一个发现达到所选阈值。                               |
| `2`  | 在生成检查发现之前发生命令/运行时故障。                    |

`--severity-min` 同时控制输出哪些发现和退出阈值：即使存在严重性较低的 `info`/`warning` 发现，`openclaw doctor --lint --severity-min error` 也可能不输出任何内容并以 `0` 退出。

`--all` 控制在严重性筛选之前选择哪些检查。默认检查模式会排除深入检查、历史检查，或更可能暴露可修复旧版残留的检查；使用 `--all` 可运行完整清单。`--only <id>` 是最精确的选择器，可以按 ID 运行任意已注册的检查。

`core/doctor/local-audio-acceleration` 会报告自动选择的本地 STT 命令、能力/请求/观测到的后端独立证据，以及回退顺序，而无需加载语音模型。它会输出信息级发现，因此请包含 `--severity-min info` 以显示该发现。

## 结构化健康检查

现代 Doctor 检查使用一个简洁的拆分式契约：

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` 为 `doctor --lint` 提供支持。`repair()` 是可选的，并且仅在 `doctor --fix` / `doctor --repair` 下运行。尚未迁移到这种形式的检查仍使用旧版 Doctor 贡献流程。

修复上下文可以携带 `dryRun`/`diff` 请求；修复结果可以返回结构化的 `diffs`（配置/文件编辑）和 `effects`（服务、进程、软件包、状态或其他副作用），因此已转换的检查可以逐步支持 `doctor --fix --dry-run`，而无需将变更规划移入 `detect()`。

`repair()` 报告 `status: "repaired" | "skipped" | "failed"`（省略状态表示 `repaired`）。当修复返回 `skipped` 或 `failed` 时，Doctor 会报告原因，并跳过该检查的验证。修复成功后，Doctor 会针对已修复的发现再次运行限定范围的 `detect()`；如果该发现仍然存在，Doctor 会报告修复警告，而不会将更改视为已完成。

一项发现包括：

| 字段              | 用途                                                         |
| ----------------- | ------------------------------------------------------------ |
| `checkId`         | 用于 skip/only 过滤器和 CI 允许列表的稳定 ID。                |
| `severity`        | `info`、`warning` 或 `error`。                                |
| `message`         | 人类可读的问题说明。                                         |
| `path`            | 可用时提供配置、文件或逻辑路径。                             |
| `line` / `column` | 可用时提供源位置。                                           |
| `ocPath`          | 当检查可指向某个地址时，提供精确的 `oc://` 地址。            |
| `fixHint`         | 建议的操作员操作或修复摘要。                                 |

现代化的核心 Doctor 检查仍附加在有序的 Doctor 贡献项上，该贡献项负责其面向用户的 `doctor` / `doctor --fix` 行为。共享的结构化健康注册表是扩展点：内置检查和插件支持的检查会在核心 Doctor 检查之后运行，前提是其所属软件包已在活动命令路径中注册这些检查。`openclaw/plugin-sdk/health` 向插件作者公开相同的契约。

## 检查选择

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` 和 `--skip` 接受完整的检查 ID，并且可以重复指定。如果某个 `--only` ID 未注册，则不会为该 ID 运行任何检查；请使用输出中的 `checksRun`/`checksSkipped`，确认聚焦式门禁选择了你预期的检查。

## 升级后模式

`openclaw doctor --post-upgrade` 会运行插件兼容性探测，用于串接在构建或升级之后。发现项会输出到 stdout；如果任何发现项包含 `level: "error"`，退出码为 1。添加 `--json` 可获得机器可读的封装（`{ probesRun, findings }`），适用于 CI、社区 `fork-upgrade` Skills 以及其他升级后冒烟测试工具。如果已安装插件索引缺失或格式错误，JSON 模式仍会输出该封装，其中包含一个 `plugin.index_unavailable` 错误发现项。

容器镜像启动是通常“更新后运行 Doctor”流程的例外。当 `openclaw gateway run` 在新的 OpenClaw 版本上启动时，它会在报告就绪之前运行安全的状态和插件修复。如果无法安全完成修复，启动将退出，并提示你在正常重启容器之前，针对相同的挂载状态/配置，使用同一镜像运行一次 `openclaw doctor --fix`。

## 共享状态 SQLite 压缩

`openclaw doctor --state-sqlite compact` 是针对位于 `<state-dir>/state/openclaw.sqlite` 的规范共享状态数据库执行的显式离线维护。它不接受任意数据库路径，正常 Gateway 网关操作绝不会调用它，并且它不属于 `openclaw doctor --fix`。

首先停止 Gateway 网关并创建已验证的备份：

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

该命令：

1. 要求规范共享状态路径中存在常规文件。缺失的数据库会报告为 `skipped`，并成功退出。
2. 在执行检查点或更改文件之前，验证当前受支持的架构版本以及 `schema_meta.role = "global"`。
3. 要求 `wal_checkpoint(TRUNCATE)` 处于非忙碌状态。如果检查点忙碌，请停止所有剩余的 OpenClaw 进程并重试。
4. 将 `auto_vacuum` 设置为 `INCREMENTAL`，运行完整的 `VACUUM`，然后再次执行检查点。
5. 运行 `quick_check`、`integrity_check` 和 `foreign_key_check`，然后对数据库和 SQLite 辅助文件重新应用仅所有者权限。

JSON 输出会报告压缩前后的数据库和 WAL 大小、空闲列表页数、页面大小及 `auto_vacuum` 值，以及回收的字节数和 `quick_check`、`integrity_check` 的结果。`foreign_key_check` 以失败即关闭的方式强制执行，没有单独的成功字段。SQLite 使用 `0` 表示无 `auto_vacuum`，`1` 表示完整模式，`2` 表示增量模式。

当架构较旧、比当前运行的 OpenClaw 构建更新，或属于智能体数据库时，压缩会在不进行更改的情况下失败。对于较旧的共享状态架构，请先运行 `openclaw doctor --fix`。对于较新的架构，请恢复兼容的备份或升级 OpenClaw。

## 会话 SQLite 迁移

OpenClaw 会在 Gateway 网关启动期间以及运行 `openclaw doctor --fix` 时，自动将旧版会话行和转录历史记录导入每个智能体的 SQLite 数据库。`openclaw doctor --session-sqlite <mode>` 是针对该迁移的定向检查和验证工具。当前运行时会话行位于 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。旧版 `sessions.json` 文件是迁移源。活跃转录 JSONL 文件会在成功导入后被导入并归档到活动会话目录之外；归档层 JSONL 文件仍是支持工件，而不是运行时回退。

模式：

| 模式       | 行为                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `inspect`  | 读取旧版数据和 SQLite 的计数，以及未引用的 JSONL 文件，但不执行导入。                             |
| `dry-run`  | 解析旧版条目和转录 JSONL 文件，统计可导入的行，并报告问题，但不写入 SQLite 行。                   |
| `import`   | 为选定目标将旧版条目和转录事件导入 SQLite。                                                       |
| `validate` | 将选定的旧版源与 SQLite 行和转录事件计数进行比较。                                                |
| `compact`  | 对选定智能体的 SQLite 数据库执行检查点和 VACUUM，以在大量删除或归档清理后回收空闲页面。            |
| `recover`  | 恢复最近一次失败的迁移运行，验证其目标，并准备经过清理的 GitHub 议题报告。                         |
| `restore`  | 根据记录的迁移清单恢复已归档的转录工件，而不删除 SQLite 数据。                                    |

选择器：

- 默认：已配置的默认智能体存储，但仅当该旧版存储文件存在时。
- `--session-sqlite-agent <id>`：一个已配置的智能体。
- `--session-sqlite-all-agents`：已配置的智能体存储以及发现的智能体存储。
- `--session-sqlite-store <path>`：一个明确指定的旧版 `sessions.json` 路径。

手动检查顺序：

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

在拥有重要历史记录的安装中运行 `import` 之前，请备份 OpenClaw 状态目录。当选定的旧版条目在 SQLite 中缺失、会话 ID 不同或转录事件计数不同时，`validate` 会以非零状态退出。使用 `--session-sqlite-store <path>` 时，请检查报告中是否包含预期的目标数量；不存在的显式存储路径不会选择任何目标。

SQLite 删除操作会先回收数据库内部的页面；它们不一定会立即缩小数据库文件。删除或归档大型转录后，运行 `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`，以对 WAL 文件执行检查点、运行 `VACUUM`，并报告操作前后的数据库和 WAL 大小。压缩要求目标是使用当前智能体架构的常规文件，包含所选智能体的持久所有者元数据，并且 Doctor 进程中没有打开的句柄。这是显式离线维护：请先停止 Gateway 网关，确保正常写入不会与检查点或 `VACUUM` 发生竞争。

每次导入都会先在 `~/.openclaw/session-sqlite-migration-runs/` 下写入清单，然后再将转录工件移入归档。如果转移工件后，启动过程报告会话 SQLite 迁移失败，请运行恢复：

```bash
openclaw doctor --session-sqlite recover --github-issue
```

恢复操作会选择最近一次失败的迁移清单，仅恢复该清单中已归档的工件，验证受影响的目标，刷新经过清理的 `.failure.md` 和 `.failure.json` 报告，并准备一个 GitHub 议题正文，其中不包含转录内容、原始环境、机密信息和无界配置。当不存在失败的迁移清单，但选定的智能体 SQLite 数据库已损坏、不是数据库，或存在日志辅助文件但缺少主数据库时，恢复操作会将完整文件集复制到临时检查目录。SQLite 可以在该一次性副本中回滚有效的热日志，然后再运行 `quick_check`、`integrity_check` 和 `foreign_key_check`，同时保持原始取证文件不变。完整性检查失败或存在孤立辅助文件时，会通过为整个已发现文件集添加同一个 `.corrupt-<timestamp>` 后缀来重命名并保留 DB、WAL、SHM 和回滚日志文件。如果捕获到重命名失败，则会在报告失败前回滚已移动的文件，避免可恢复的文件集被静默拆分。恢复前请停止 Gateway 网关；复制或重命名正在变化的 SQLite 文件集并不安全，而且在不同操作系统上的行为不同。使用 `--github-issue --yes` 时，Doctor 会使用 GitHub CLI 在 `openclaw/openclaw` 中创建议题；未确认时，它会写入本地支持报告并输出预填充的议题 URL。

`restore` 仍是较低层级的撤销操作。它使用清单中的 `sourcePath -> archivePath` 记录，仅当原始路径缺失时才将已归档工件移回；当两个路径都存在时报告冲突，并保留 SQLite 数据库。

### 会话 SQLite 迁移后降级

启动较旧的基于文件的 OpenClaw 版本之前，请恢复已归档的旧版转录工件：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

较旧版本读取 `sessions.json` 条目以及这些条目中记录的 `sessionFile` 路径。SQLite 迁移后，成功导入会将活跃 JSONL 转录移入 `session-sqlite-import-archive/`，因此在恢复操作将清单记录的这些工件移回原始路径之前，旧版运行时无法看到这些历史记录。

恢复操作不会删除 SQLite 数据。切换到 SQLite 后创建的会话仅存在于 SQLite 中，不会出现在旧版运行时中。如果之后再次升级，请运行上述正常迁移验证顺序，以便 OpenClaw 在导入前将恢复的旧版工件与 SQLite 行进行比较。

## 注意事项

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，只读 Doctor 检查仍然有效，但由于 `openclaw.json` 不可变，`doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 均被禁用。请改为编辑此安装的 Nix 源；对于 nix-openclaw，请使用 Agent 优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 交互式提示（钥匙串/OAuth 修复等）仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 非交互式 `doctor` 运行会跳过预先加载插件，以确保无头健康检查保持快速。交互式会话仍会加载旧版健康检查/修复流程所需的插件界面。
- `--lint` 比 `--non-interactive` 更严格：始终只读、从不提示、从不应用安全迁移。如果希望 Doctor 进行更改，请使用 `doctor --fix` 或 `doctor --repair`。
- 默认情况下，Doctor 在检查密钥时不会执行 `exec` SecretRef。仅当你明确希望 Doctor 运行这些已配置的密钥解析器时，才使用 `--allow-exec`（可与 `--lint` 一起使用，也可单独使用）。
- 任何配置写入（包括 `--fix` 修复）都会将备份轮换到 `~/.openclaw/openclaw.json.bak`（采用编号为 `.bak.1` 到 `.bak.4` 的循环）。`--fix` 还会删除架构验证报告的未知配置键，并逐项列出删除内容；更新进行期间会跳过此操作，以免部分写入的升级状态在迁移完成前被清除。
- 当 Gateway 网关生命周期由其他监督程序负责时，请设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状况并应用非服务修复，但会跳过服务安装、启动、重启、引导以及旧版服务清理。
- 在 Linux 上，Doctor 会忽略非活动的额外 Gateway 网关类 systemd 单元，并且修复期间不会重写正在运行的 systemd Gateway 网关服务的命令/入口点元数据。请先停止该服务，或使用 `openclaw gateway install --force` 替换活动启动器。
- `doctor --fix --non-interactive` 会报告缺失或过时的 Gateway 网关服务定义，但在更新修复模式之外不会安装或重写它们。对于缺失的服务，请运行 `openclaw gateway install`；若要替换启动器，请运行 `openclaw gateway install --force`。
- 状态完整性检查会检测会话目录中的孤立记录文件。将其归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会将其留在原处。
- Doctor 会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 作业结构，并在将规范行导入 SQLite 前重写这些结构。
- Doctor 会报告具有显式 `payload.model` 覆盖的 cron 作业，包括提供商命名空间计数以及与 `agents.defaults.model` 的不匹配项，以便在身份验证或计费调查期间发现未继承默认模型的定时作业。
- Doctor 会报告仍标记为进行中（`state.runningAtMs`）的 cron 作业，这可能导致 `openclaw cron list` 将其显示为 `running`。此检查为只读：如果当前没有 Gateway 网关正在执行已标记的作业，cron 服务下次启动时会记录中断的运行并清除该标记。
- 在 Linux 上，如果用户的 crontab 仍在运行无人维护的旧版 `~/.openclaw/bin/ensure-whatsapp.sh`，Doctor 会发出警告；当 cron 缺少 systemd 用户总线环境时，该脚本可能错误报告 `Gateway inactive`。
- 启用 WhatsApp 后，Doctor 会检查 Gateway 网关事件循环是否降级，同时是否仍有本地 `openclaw-tui` 客户端在运行。`doctor --fix` 只会停止经验证的本地 TUI 客户端，避免 WhatsApp 回复排在过时的 TUI 刷新循环之后。
- Doctor 会在主模型、回退模型、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖、Hooks、渠道模型覆盖和过时的会话路由固定项中，将旧版 `openai-codex/*` 模型引用重写为规范的 `openai/*` 引用。`--fix` 还会将旧版 `openai-codex:*` 身份验证配置文件和 `auth.order.openai-codex` 条目迁移到 `openai:*`，将 Codex 意图移至提供商/模型范围的 `agentRuntime.id: "codex"` 条目，删除过时的整个智能体/会话运行时固定项，并让修复后的 OpenAI 智能体引用继续使用 Codex 身份验证路由，而不是直接使用 OpenAI API 密钥身份验证。
- Doctor 会报告非空的 `auth.order.<provider>` 列表：其引用的配置文件均已不存在，但仍存在兼容的已存储凭据。`doctor --fix` 只会删除这些过时的覆盖项，恢复按智能体自动选择凭据；显式空顺序、部分仍有效的列表，以及没有兼容已存储凭据的顺序均保持不变。如果活动的 SQLite 身份验证存储不可读或格式错误，Doctor 会说明跳过此修复的原因。如果正在运行的 Gateway 网关的配置重载模式不会自动应用写入，请在重新检查身份验证状态前重启它。
- Doctor 会清理旧版 OpenClaw 中遗留的插件依赖暂存状态，并为将主机 `openclaw` 软件包声明为对等依赖的托管 npm 插件重新建立该软件包的链接。它还会修复配置所引用的缺失可下载插件（`plugins.entries`、已配置的渠道、已配置的提供商/搜索设置、已配置的 Agent Runtimes）。软件包更新期间，Doctor 会跳过软件包管理器的插件修复，直到软件包替换完成；如果已配置的插件仍需恢复，请随后重新运行 `openclaw doctor --fix`。如果下载失败，Doctor 会报告安装错误，并保留已配置的插件条目以供下次修复尝试。
- 当插件发现功能正常时，Doctor 会从 `plugins.allow`/`plugins.deny`/`plugins.entries` 中删除缺失的插件 ID，并同时删除匹配的悬空渠道配置、Heartbeat 目标和渠道模型覆盖，以修复过时的插件配置。
- Doctor 会通过禁用受影响的 `plugins.entries.<id>` 条目并删除其无效的 `config` 载荷来隔离无效的插件配置。Gateway 网关启动时本就只会跳过该故障插件，因此其他插件和渠道可以继续运行。
- Doctor 会删除已停用的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 始终将 Codex 原生工作区工具保留为原生工具。
- Doctor 会自动将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关项）迁移到 `talk.provider` + `talk.providers.<provider>`。如果唯一差异是对象键顺序，后续运行 `doctor --fix` 时将不再报告或应用 Talk 规范化。
- Doctor 包含记忆搜索就绪情况检查，并可在缺少嵌入凭据时建议运行 `openclaw configure --section model`。
- 未配置命令所有者时，Doctor 会发出警告。命令所有者是获准运行仅所有者可用命令并批准危险操作的人类操作员账户。私信配对仅允许某人与 Bot 对话；如果你在首次所有者引导机制出现前批准过发送者，请显式设置 `commands.ownerAllowFrom`。
- 配置了 Codex 模式智能体，且操作员的 Codex 主目录中存在个人 Codex CLI 资产时，Doctor 会报告一条信息提示。本地 Codex app-server 启动会使用隔离的按智能体主目录；如果需要，请先安装 Codex 插件，然后使用 `openclaw migrate plan codex` 清点应有意提升的资产。
- 如果默认智能体允许的 Skills 在当前运行时环境中不可用（缺少二进制文件、环境变量、配置或操作系统要求），Doctor 会发出警告。`doctor --fix` 可通过 `skills.entries.<skill>.enabled=false` 禁用这些不可用的 Skills；如果希望 Skills 保持活动状态，请改为安装或配置缺失的要求。
- 如果已启用沙箱模式但 Docker 不可用，Doctor 会报告包含修复方法的高信号警告（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在旧版沙箱注册表文件或分片目录（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/`），Doctor 会报告它们；`--fix` 会将有效条目迁移到 SQLite，并隔离无效的旧版文件。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在当前命令路径中不可用，Doctor 会报告只读警告，并且不会写入明文回退凭据。对于由 exec 支持的 SecretRef，除非存在 `--allow-exec`，否则 Doctor 会跳过执行。
- 如果修复路径中的渠道 SecretRef 检查失败，Doctor 会继续运行并报告警告，而不是提前退出。
- 状态目录迁移后，如果已启用的默认 Telegram 或 Discord 账户依赖环境回退，而 Doctor 进程无法使用 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN`，Doctor 会发出警告。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）要求当前命令路径中存在可解析的 Telegram 令牌。如果令牌检查不可用，Doctor 会报告警告，并在本轮跳过自动解析。

## macOS：`launchctl` 环境覆盖

如果你之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖你的配置文件，并可能导致持续出现 “unauthorized” 错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关诊断](/zh-CN/gateway/doctor)

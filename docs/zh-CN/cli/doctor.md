---
read_when:
    - 你遇到了连接/身份验证问题，并希望获得引导式修复建议
    - 你已完成更新，并希望进行完整性检查
summary: '`openclaw doctor` 的 CLI 参考（健康检查 + 引导式修复）'
title: Doctor
x-i18n:
    generated_at: "2026-07-16T11:27:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

针对 Gateway 网关、渠道、插件、Skills、模型路由、本地状态和配置迁移的健康检查与快速修复。当某项功能未按预期运行，而你希望通过一条命令查明问题时，请使用 Doctor。

相关内容：

- 故障排查：[故障排查](/zh-CN/gateway/troubleshooting)
- 安全审计：[安全](/zh-CN/gateway/security)

## 工作模式

Doctor 有五种工作模式：

| 工作模式                  | 命令                                      | 行为                                                                            |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| 检查                      | `openclaw doctor`                        | 面向用户的检查和引导式提示。                                                    |
| 修复                      | `openclaw doctor --fix`                        | 应用支持的修复；除非可以安全地进行非交互式修复，否则会显示提示。                |
| Lint                      | `openclaw doctor --lint`                        | 为 CI、预检和审查门禁提供只读的结构化发现。                                     |
| 共享 SQLite 维护          | `openclaw doctor --state-sqlite compact`                        | 显式对规范共享状态数据库执行检查点、压缩和验证。                                |
| 会话 SQLite 迁移          | `openclaw doctor --session-sqlite <mode>`                        | 检查、导入、验证、压缩、恢复或还原会话状态。                                    |

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

对于特定渠道的权限，请使用渠道探测命令，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` 报告 Bot 对特定渠道目标的实际有效权限。`channels status --probe` 审计所有已配置的渠道和语音自动加入目标。

## 选项

| 选项                            | 效果                                                                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | 禁用工作区记忆/搜索建议。                                                                                                                                                               |
| `--yes`              | 不显示提示，直接接受默认值。                                                                                                                                                            |
| `--repair` / `--fix` | 不显示提示，应用推荐的非服务修复（`--fix` 是别名）。Gateway 网关服务的安装/重写仍需要交互式确认或显式的 `gateway` 命令。 |
| `--force`              | 应用激进修复，包括覆盖自定义服务配置。                                                                                                                                                  |
| `--non-interactive`              | 不显示提示运行；仅执行安全迁移和非服务修复。                                                                                                                                            |
| `--generate-gateway-token`              | 生成并配置 Gateway 网关令牌。                                                                                                                                                           |
| `--allow-exec`              | 允许 Doctor 在验证密钥时执行已配置的 `exec` SecretRefs。                                                                                                                     |
| `--deep`              | 扫描系统服务中的额外 Gateway 网关安装；报告近期 Gateway 网关监督程序的重启交接。                                                                                                        |
| `--lint`              | 以只读模式运行现代化健康检查并输出诊断发现。                                                                                                                                            |
| `--post-upgrade`              | 运行升级后的插件兼容性探测；发现将输出到 stdout；如果存在任何错误级别的发现，则退出码为 1。                                                                                              |
| `--state-sqlite <mode>`              | 运行显式的共享状态 SQLite 维护。唯一模式为 `compact`。                                                                                                                         |
| `--session-sqlite <mode>`              | 运行指定的会话 SQLite 迁移模式：`inspect`、`dry-run`、`import`、`validate`、`compact`、`recover` 或 `restore`。 |
| `--session-sqlite-store <path>`              | 与 `--session-sqlite` 配合使用：选择一个旧版 `sessions.json` 存储路径。                                                                                                               |
| `--session-sqlite-agent <id>`              | 与 `--session-sqlite` 配合使用：选择一个已配置的智能体。                                                                                                                                |
| `--session-sqlite-all-agents`              | 与 `--session-sqlite` 配合使用：选择已配置和已发现的智能体存储。                                                                                                                        |
| `--github-issue`              | 与 `--session-sqlite recover` 配合使用：准备经过脱敏处理的 openclaw/openclaw Issue 报告；在使用 `gh` 并通过 `--yes` 或交互式确认后，由 Doctor 创建报告。                  |
| `--json`              | 与 `--lint` 配合使用：输出 JSON 发现。与 `--post-upgrade` 配合使用：`{ probesRun, findings }`。与 `--state-sqlite` 或 `--session-sqlite` 配合使用：以 JSON 输出维护报告。          |
| `--severity-min <level>`              | 与 `--lint` 配合使用：丢弃低于 `info`、`warning` 或 `error` 的发现。                                                                            |
| `--all`              | 与 `--lint` 配合使用：运行所有已注册的检查，包括默认集合中排除的选择性启用检查。                                                                                               |
| `--skip <id>`              | 与 `--lint` 配合使用：跳过一个检查 ID。可重复指定。                                                                                                                           |
| `--only <id>`              | 与 `--lint` 配合使用：仅运行指定 ID 的检查。可重复指定。                                                                                                                      |

`--severity-min`、`--all`、`--only` 和 `--skip` 仅可与 `--lint` 一起使用；`--json` 可与 `--lint`、`--post-upgrade`、`--state-sqlite` 和 `--session-sqlite` 一起使用。

## Lint 模式

`openclaw doctor --lint` 为只读模式：不显示提示、不执行修复，也不重写配置/状态。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

面向用户的输出很简洁：

```text
doctor --lint：运行了 6 项检查，发现 1 个问题
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode 未设置；Gateway 网关启动将被阻止。
    修复：运行 `openclaw configure` 并设置 Gateway 网关模式（local/remote），或者运行 `openclaw config set gateway.mode local`。
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
      "fixHint": "运行 `openclaw configure` 并设置 Gateway 网关模式（local/remote），或者运行 `openclaw config set gateway.mode local`。"
    }
  ]
}
```

退出码：

| 代码 | 含义                                                         |
| ---- | ------------------------------------------------------------ |
| `0` | 所选严重性阈值及以上没有发现。                               |
| `1` | 至少有一个发现达到所选阈值。                                 |
| `2` | 在生成 Lint 发现之前发生命令/运行时故障。                     |

`--severity-min` 同时控制输出哪些发现和退出阈值：即使存在严重性较低的 `info`/`warning` 发现，`openclaw doctor --lint --severity-min error` 也可能不输出任何内容并以 `0` 退出。

`--all` 控制在严重性筛选之前选择哪些检查。默认 Lint 运行会排除深度检查、历史检查或更可能发现可修复旧版残留的检查；使用 `--all` 可运行完整清单。`--only <id>` 是最精确的选择器，可按 ID 运行任意已注册的检查。

`core/doctor/local-audio-acceleration` 会报告自动选择的本地 STT 命令、彼此独立的后端能力/请求/观测证据，以及回退顺序，而无需加载语音模型。它会生成信息级发现，因此需要包含 `--severity-min info` 才能显示。

## 结构化健康检查

现代 Doctor 检查使用一个简洁的拆分契约：

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` 为 `doctor --lint` 提供支持。`repair()` 是可选的，仅在 `doctor --fix` / `doctor --repair` 下运行。尚未迁移到此形式的检查仍使用旧版 Doctor 贡献流程。

修复上下文可以携带 `dryRun`/`diff` 请求；修复结果可以返回结构化的 `diffs`（配置/文件编辑）和 `effects`（服务、进程、软件包、状态或其他副作用），因此已转换的检查可以逐步向 `doctor --fix --dry-run` 演进，而无需将变更规划移入 `detect()`。

`repair()` 会报告 `status: "repaired" | "skipped" | "failed"`（省略状态表示 `repaired`）。当修复返回 `skipped` 或 `failed` 时，Doctor 会报告原因并跳过该检查的验证。修复成功后，Doctor 会重新运行作用域限定为已修复发现项的 `detect()`；如果该发现项仍然存在，Doctor 会报告修复警告，而不会将更改视为已完成。

发现项包括：

| 字段             | 用途                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | 用于跳过/仅运行筛选器和 CI 允许列表的稳定 ID。     |
| `severity`        | `info`、`warning` 或 `error`。                         |
| `message`         | 便于理解的问题描述。                      |
| `path`            | 可用时提供配置、文件或逻辑路径。          |
| `line` / `column` | 可用时提供源位置。                        |
| `ocPath`          | 当检查能够指向某个地址时提供精确的 `oc://` 地址。 |
| `fixHint`         | 建议的操作员操作或修复摘要。           |

现代化的核心 Doctor 检查仍附属于负责其面向用户的 `doctor` / `doctor --fix` 行为的有序 Doctor 贡献项。共享的结构化健康注册表是扩展点：内置检查和由插件支持的检查会在核心 Doctor 检查之后运行，前提是其所属软件包已在活动命令路径中注册这些检查。`openclaw/plugin-sdk/health` 为插件作者公开相同的契约。

## 检查选择

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` 和 `--skip` 接受完整的检查 ID，并且可以重复指定。如果某个 `--only` ID 未注册，则不会为该 ID 运行任何检查；使用输出中的 `checksRun`/`checksSkipped` 确认聚焦门禁选择了预期的检查。

## 升级后模式

`openclaw doctor --post-upgrade` 运行插件兼容性探测，以便在构建或升级后串联执行。发现项输出到 stdout；如果任何发现项具有 `level: "error"`，退出码为 1。添加 `--json` 可获得机器可读的封装（`{ probesRun, findings }`），适用于 CI、社区 `fork-upgrade` Skill 以及其他升级后冒烟测试工具。如果已安装插件索引缺失或格式错误，JSON 模式仍会发出包含 `plugin.index_unavailable` 错误发现项的封装。

容器镜像启动是常规“更新后运行 Doctor”流程的例外。当 `openclaw gateway run` 在新版本 OpenClaw 上启动时，它会先运行安全的状态和插件修复，然后才报告就绪。如果无法安全地完成修复，启动将退出，并提示你使用相同的镜像，针对相同的已挂载状态/配置运行一次 `openclaw doctor --fix`，然后再正常重启容器。

## 共享状态 SQLite 压缩

`openclaw doctor --state-sqlite compact` 是针对位于 `<state-dir>/state/openclaw.sqlite` 的规范共享状态数据库的显式离线维护操作。它不接受任意数据库路径，正常的 Gateway 网关运行绝不会调用它，并且它不属于 `openclaw doctor --fix`。该命令会获取与 Gateway 网关启动相同的状态所有权锁，并在验证、检查点处理、`VACUUM` 和最终完整性检查期间持续持有该锁。当 Gateway 网关或另一个 SQLite 维护命令持有该锁时，它会拒绝运行。当 `OPENCLAW_ALLOW_MULTI_GATEWAY=1` 跳过每个配置对应的 Gateway 网关单例时，状态锁仍然有效，因此操作员 shell 无需继承 Gateway 网关服务的环境即可让维护操作检测到它。

首先停止 Gateway 网关并创建经过验证的备份：

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

该命令：

1. 要求规范共享状态路径上存在常规文件。缺失的数据库会报告为 `skipped`，并成功退出。
2. 在执行检查点处理或更改文件之前，验证当前支持的架构版本和 `schema_meta.role = "global"`。
3. 要求 `wal_checkpoint(TRUNCATE)` 非繁忙。如果检查点繁忙，请停止所有仍在运行的 OpenClaw 进程后重试。
4. 将 `auto_vacuum` 设置为 `INCREMENTAL`，运行完整的 `VACUUM`，然后再次执行检查点处理。
5. 运行 `quick_check`、`integrity_check` 和 `foreign_key_check`，然后对数据库和 SQLite 辅助文件重新应用仅所有者权限。

JSON 输出会报告压缩前后的数据库和 WAL 大小、空闲列表页数、页大小和 `auto_vacuum` 值，以及回收的字节数和 `quick_check`、`integrity_check` 结果。`foreign_key_check` 采用故障关闭方式强制执行，没有单独的成功字段。SQLite 将 `auto_vacuum` 报告为：`0` 表示无，`1` 表示完整，`2` 表示增量。

如果架构过旧、比正在运行的 OpenClaw 构建更新，或者属于智能体数据库，压缩会在不进行更改的情况下失败。对于较旧的共享状态架构，请先运行 `openclaw doctor --fix`。对于较新的架构，请还原兼容的备份或升级 OpenClaw。

## 会话 SQLite 迁移

OpenClaw 会在 Gateway 网关启动期间以及执行 `openclaw doctor --fix` 期间，自动将旧版会话行和转录历史记录导入每个智能体的 SQLite 数据库。`openclaw doctor --session-sqlite <mode>` 是用于该迁移的针对性检查和验证工具。当前运行时会话行位于 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。旧版 `sessions.json` 文件是迁移源。活跃转录 JSONL 文件成功导入后，会归档到活动会话目录之外；归档层 JSONL 文件仍是支持工件，而不是运行时回退。

模式：

| 模式       | 行为                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | 读取旧版和 SQLite 计数以及未被引用的 JSONL 文件，但不导入。                                       |
| `dry-run`  | 解析旧版条目和转录 JSONL 文件，统计可导入行并报告问题，但不写入 SQLite 行。 |
| `import`   | 将旧版条目和转录事件导入所选目标的 SQLite。                                      |
| `validate` | 将所选旧版源与 SQLite 行和转录事件计数进行比较。                                   |
| `compact`  | 对所选智能体 SQLite 数据库执行检查点处理和 VACUUM，以回收大量删除或归档清理后产生的空闲页。    |
| `recover`  | 恢复最近一次失败的迁移运行，验证其目标，并准备经过净化的 GitHub Issue 报告。            |
| `restore`  | 根据记录的迁移清单恢复已归档的转录工件，而不删除 SQLite 数据。                  |

选择器：

- 默认值：已配置的默认智能体存储，但仅当该旧版存储文件存在时。
- `--session-sqlite-agent <id>`：一个已配置的智能体。
- `--session-sqlite-all-agents`：已配置的智能体存储以及已发现的智能体存储。
- `--session-sqlite-store <path>`：一个显式的旧版 `sessions.json` 路径。

手动检查序列：

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

在具有重要历史记录的安装中运行 `import` 之前，请备份 OpenClaw 状态目录。当所选旧版条目在 SQLite 中缺失、会话 ID 不同或转录事件计数不同时，`validate` 会以非零状态退出。使用 `--session-sqlite-store <path>` 时，请检查报告是否包含预期的目标数量；不存在的显式存储路径不会选择任何目标。

SQLite 删除操作首先回收数据库内部的页面；它不一定会立即缩小数据库文件。删除或归档大型转录后，运行 `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`，对 WAL 文件执行检查点处理、运行 `VACUUM`，并报告操作前后的数据库和 WAL 大小。压缩要求存在具有当前智能体架构的常规文件、所选智能体的持久所有者元数据，并且 Doctor 进程中没有打开的句柄。破坏性的 `import`、`compact`、`recover` 和 `restore` 模式会在整个操作期间持有与 Gateway 网关启动相同的状态所有权锁；`inspect`、`dry-run` 和 `validate` 保持只读，不会获取该锁。请先停止 Gateway 网关。破坏性模式会直接失败，而不是与实时写入或其他维护命令发生竞态。破坏性的 `--session-sqlite-store` 目标必须位于活动状态目录中；在维护另一个安装之前，请将 `OPENCLAW_STATE_DIR` 设置为该存储所属的状态目录。现有的硬链接目标会被拒绝，因为锁定状态目录之外的另一个路径可能共享同一个数据库 inode。相同的所有权检查也涵盖 SQLite WAL、共享内存和回滚日志辅助文件。

每次导入都会先在 `~/.openclaw/session-sqlite-migration-runs/` 下写入清单，然后再将转录工件移入归档。如果工件移动后，启动报告会话 SQLite 迁移失败，请运行恢复：

```bash
openclaw doctor --session-sqlite recover --github-issue
```

恢复会选择最近一次失败的迁移清单，仅恢复该清单中已归档的工件，验证受影响的目标，刷新经过净化的 `.failure.md` 和 `.failure.json` 报告，并准备一个不包含转录内容、原始环境、密钥和无边界配置的 GitHub Issue 正文。当不存在失败的迁移清单，但所选智能体 SQLite 数据库已损坏、不是数据库，或者存在日志辅助文件却没有主数据库时，恢复会将完整文件集复制到临时检查目录。SQLite 可以在该一次性副本中回滚有效的热日志，然后再运行 `quick_check`、`integrity_check` 和 `foreign_key_check`，同时保持原始取证文件不变。完整性检查失败或存在孤立的辅助文件时，会通过使用同一个 `.corrupt-<timestamp>` 后缀重命名整个已发现文件集，保留 DB、WAL、SHM 和回滚日志文件。如果捕获到重命名失败，会先回滚已移动的文件，然后再报告失败，因此可恢复的文件集不会被静默拆分。恢复前请停止 Gateway 网关；复制或重命名正在变化的 SQLite 文件集并不安全，并且在不同操作系统上的行为不同。使用 `--github-issue --yes` 时，Doctor 会使用 GitHub CLI 在 `openclaw/openclaw` 中创建 Issue；如果未确认，它会写入本地支持报告并输出预填充的 Issue URL。

`restore` 仍是较低层级的撤销操作。它使用清单 `sourcePath -> archivePath` 记录，仅在原始路径缺失时将已归档的工件移回；当两个路径都存在时报告冲突，并保留 SQLite 数据库不变。

### 会话 SQLite 迁移后降级

在启动较旧的基于文件的 OpenClaw 版本之前，请恢复已归档的旧版转录工件：

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

旧版本会读取 `sessions.json` 条目以及这些条目中记录的 `sessionFile` 路径。完成 SQLite 迁移后，成功导入时会将热 JSONL
转录记录移至 `session-sqlite-import-archive/`，因此在恢复操作将清单中记录的这些工件移回
原始路径之前，旧版运行时无法看到这段历史记录。

恢复操作不会删除 SQLite 数据。在切换到 SQLite 后创建的会话
仅存在于 SQLite 中，不会出现在旧版运行时中。如果之后再次
升级，请运行上面的常规迁移验证流程，以便 OpenClaw 在导入前
将恢复的旧版工件与 SQLite 行进行比较。

## 注意事项

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，只读 Doctor 检查仍可正常工作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 会被禁用，因为 `openclaw.json` 不可变。请改为编辑此安装的 Nix 源；对于 nix-openclaw，请使用智能体优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 交互式提示（钥匙串/OAuth 修复等）仅在 stdin 为 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）会跳过提示。
- 非交互式 `doctor` 运行会跳过插件的预先加载，以确保无头健康检查保持快速。交互式会话仍会加载旧版健康检查/修复流程所需的插件界面。
- `--lint` 比 `--non-interactive` 更严格：始终为只读、绝不提示、绝不应用安全迁移。如果希望 Doctor 进行更改，请使用 `doctor --fix` 或 `doctor --repair`。
- 默认情况下，Doctor 检查密钥时不会执行 `exec` SecretRef。仅当确实希望 Doctor 运行这些已配置的密钥解析器时，才使用 `--allow-exec`（可带或不带 `--lint`）。
- 任何配置写入（包括 `--fix` 修复）都会将备份轮换到 `~/.openclaw/openclaw.json.bak`（并使用编号为 `.bak.1`..`.bak.4` 的循环备份）。`--fix` 还会删除架构验证报告的未知配置键，并逐项列出删除内容；更新进行期间会跳过此操作，以免部分写入的升级状态在迁移完成前被清除。
- 当 Gateway 网关生命周期由另一个监督程序管理时，请设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍会报告 Gateway 网关/服务健康状态并应用非服务修复，但会跳过服务安装、启动、重启、引导和旧版服务清理。
- 在 Linux 上，Doctor 会忽略不活动的额外类 Gateway 网关 systemd 单元，并且在修复期间不会重写正在运行的 systemd Gateway 网关服务的命令/入口点元数据。请先停止该服务，或使用 `openclaw gateway install --force` 替换活动启动器。
- `doctor --fix --non-interactive` 会报告缺失或过时的 Gateway 网关服务定义，但在更新修复模式之外不会安装或重写它们。对于缺失的服务，请运行 `openclaw gateway install`；若要替换启动器，请运行 `openclaw gateway install --force`。
- 状态完整性检查会检测会话目录中的孤立转录文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会将它们保留在原位。
- Doctor 会扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的旧版 cron 作业结构，重写后再将规范行导入 SQLite。
- Doctor 会报告显式设置了 `payload.model` 覆盖项的 cron 作业，包括提供商命名空间计数以及与 `agents.defaults.model` 的不匹配情况，从而在身份验证或计费调查期间显示未继承默认模型的定时作业。
- Doctor 会报告仍标记为执行中（`state.runningAtMs`）的 cron 作业，这可能导致 `openclaw cron list` 将其显示为 `running`。此检查为只读：如果当前没有 Gateway 网关正在执行某个已标记的作业，下次 cron 服务启动时会记录这次中断的运行并清除该标记。
- 在 Linux 上，如果用户的 crontab 仍在运行无人维护的旧版 `~/.openclaw/bin/ensure-whatsapp.sh`，Doctor 会发出警告；当 cron 缺少 systemd 用户总线环境时，该工具可能错误报告 `Gateway inactive`。
- 启用 WhatsApp 后，Doctor 会检查 Gateway 网关事件循环是否已降级且本地 `openclaw-tui` 客户端仍在运行。`doctor --fix` 仅停止经过验证的本地 TUI 客户端，避免 WhatsApp 回复排在过时的 TUI 刷新循环之后。
- Doctor 会在主模型、回退模型、模型允许列表、图像/视频生成模型、Heartbeat/子智能体/压缩覆盖项、Hooks、渠道模型覆盖项、cron 载荷以及过时的会话/转录路由固定项中，将旧版 `codex/*` 和 `openai-codex/*` 模型引用重写为规范的 `openai/*` 引用。`--fix` 还会在安全时合并旧版 `models.providers.codex` 和 `models.providers.openai-codex` 配置，将旧版 `openai-codex:*` 身份验证配置文件和 `auth.order.openai-codex` 条目迁移到 `openai:*`，将 Codex 意图移至按提供商/模型限定作用域的 `agentRuntime.id: "codex"` 条目，删除过时的整个智能体/会话运行时固定项，并让修复后的 OpenAI 智能体引用继续使用 Codex 身份验证路由，而非直接使用 OpenAI API 密钥身份验证。
- 当非空的 `auth.order.<provider>` 列表所引用的配置文件已全部消失，但存在兼容的已存储凭据时，Doctor 会进行报告。`doctor --fix` 仅删除这些过时的覆盖项，以恢复自动的按智能体凭据选择；显式空顺序、仍有部分有效项的列表，以及没有兼容已存储凭据的顺序均保持不变。如果活动的 SQLite 身份验证存储不可读或格式错误，Doctor 会说明跳过此修复的原因。如果正在运行的 Gateway 网关所采用的配置重新加载模式不会自动应用这次写入，请先重启 Gateway 网关，再重新检查身份验证状态。
- Doctor 会清理旧版 OpenClaw 遗留的插件依赖暂存状态，并为将主机 `openclaw` 软件包声明为对等依赖的托管 npm 插件重新建立链接。它还会修复配置中引用但缺失的可下载插件（`plugins.entries`、已配置的渠道、已配置的提供商/搜索设置、已配置的 Agent Runtimes）。软件包更新期间，Doctor 会跳过软件包管理器的插件修复，直至软件包替换完成；如果已配置的插件仍需恢复，请在之后重新运行 `openclaw doctor --fix`。如果下载失败，Doctor 会报告安装错误，并保留已配置的插件条目，以供下次修复尝试。
- 当插件发现功能正常时，Doctor 会从 `plugins.allow`/`plugins.deny`/`plugins.entries` 中删除缺失的插件 ID，并移除匹配的悬空渠道配置、Heartbeat 目标和渠道模型覆盖项，从而修复过时的插件配置。
- Doctor 会隔离无效的插件配置：禁用受影响的 `plugins.entries.<id>` 条目，并删除其无效的 `config` 载荷。Gateway 网关启动时已仅跳过该有问题的插件，因此其他插件和渠道仍可继续运行。
- Doctor 会删除已停用的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 始终将 Codex 原生工作区工具保留为原生工具。
- Doctor 会自动将旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 等）迁移到 `talk.provider` + `talk.providers.<provider>`。如果唯一差异是对象键顺序，重复运行 `doctor --fix` 不再报告或应用 Talk 规范化。
- Doctor 包含记忆搜索就绪情况检查，并可在缺少嵌入凭据时建议使用 `openclaw configure --section model`。
- 未配置命令所有者时，Doctor 会发出警告。命令所有者是获准运行仅限所有者的命令并批准危险操作的人类操作员账户。私信配对仅允许某人与机器人交谈；如果在首位所有者引导机制出现之前已批准过某个发送者，请显式设置 `commands.ownerAllowFrom`。
- 配置了 Codex 模式智能体且操作员的 Codex 主目录中存在个人 Codex CLI 资产时，Doctor 会报告一条信息性说明。本地 Codex app-server 启动会使用按智能体隔离的主目录；如有需要，请先安装 Codex 插件，然后使用 `openclaw migrate plan codex` 清点应有意提升使用范围的资产。
- 如果默认智能体允许使用的技能在当前运行时环境中不可用（缺少二进制文件、环境变量、配置或操作系统要求），Doctor 会发出警告。`doctor --fix` 可以通过 `skills.entries.<skill>.enabled=false` 禁用这些不可用的技能；如果希望技能保持启用，请改为安装或配置缺失的要求。
- 如果已启用沙箱模式但 Docker 不可用，Doctor 会报告一条包含补救措施（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）的高信噪比警告。
- 如果存在旧版沙箱注册表文件或分片目录（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/`），Doctor 会进行报告；`--fix` 会将有效条目迁移到 SQLite，并隔离无效的旧版文件。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在当前命令路径中不可用，Doctor 会报告只读警告，并且不会写入明文回退凭据。对于由 exec 支持的 SecretRef，除非存在 `--allow-exec`，否则 Doctor 会跳过执行。
- 如果在修复路径中检查渠道 SecretRef 失败，Doctor 会继续执行并报告警告，而不会提前退出。
- 状态目录迁移后，如果已启用的默认 Telegram 或 Discord 账户依赖环境变量回退，而 Doctor 进程无法使用 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN`，Doctor 会发出警告。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）要求当前命令路径中存在可解析的 Telegram 令牌。如果无法检查令牌，Doctor 会报告警告，并跳过本次运行的自动解析。

## macOS：`launchctl` 环境变量覆盖项

如果之前运行过 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖配置文件，并可能导致持续出现“未经授权”错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关 Doctor](/zh-CN/gateway/doctor)

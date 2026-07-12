---
read_when:
    - 你正在针对实际运行的 Gateway 网关验证 Path 3 SQLite 存储切换。
    - 你需要区分预期的旧版 JSONL 偏差与运行时故障
    - 你正在构建或审查由智能体驱动的实时 SQLite E2E harness
summary: Path 3 SQLite 会话/转录切换的实时 Gateway 网关验证设计
title: Path 3 live SQLite E2E harness
x-i18n:
    generated_at: "2026-07-12T14:45:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Path 3 live SQLite E2E harness 用于证明 Gateway 网关正将 SQLite 用作规范的会话和转录存储，而旧版 JSONL 文件仍仅作为迁移输入或归档材料。它是供维护者使用的证明工具，而不是普通的用户诊断工具。

Gateway 网关处理迁移后的流量后，旧版 JSONL 一致性将不再是有效的运行时健康信号。健康的已迁移 Gateway 网关中，SQLite 转录行数可能与旧版 JSONL 计数不同，因为新轮次应仅推进 SQLite。因此，实时工具必须在每一步测量 Gateway 网关行为、SQLite 行变动、旧版文件静止状态和日志健康状况。

## 命令形式

预期的实时命令为：

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

该命令连接到已在运行的 Gateway 网关。它不会启动、停止、导入或重新运行迁移，除非以后添加显式迁移模式。CI 或隔离的本地变体可以使用 `test/helpers/openclaw-test-instance.ts`，但实时证明路径应检查实际的操作员 Gateway 网关及其真实的每智能体 SQLite 数据库。

## 隔离的已构建 CLI 证明

已构建 CLI 证明运行器会填充一个隔离的旧版会话存储，启动重新构建的 Gateway 网关，并证明启动过程会在运行时读取开始前将活跃的旧版会话导入 SQLite。首次启动 Gateway 网关前不得运行 `openclaw doctor --fix`，因为这证明的是手动迁移路径，而不是用户在切换后首次启动时获得的升级路径。

启动导入后，隔离证明可以运行 `openclaw doctor --session-sqlite inspect` 和 `openclaw doctor --session-sqlite validate` 作为诊断证据。这些 Doctor 命令不是启动升级证明的迁移驱动程序。单独的 Doctor 导入场景应填充旧版转录文件和轨迹边车文件，并验证 Doctor 会归档这些工件，同时 SQLite 仍保持为规范存储。

## 预检

预检会收集基线；如果 Gateway 网关不可用，则在发送证明轮次前失败：

- `GET /health` 和 Gateway 网关深度状态必须报告 Gateway 网关正在运行且可访问。
- CLI 和 Gateway 网关版本必须与正在测试的分支匹配。
- 该工具会记录当前 Gateway 网关文件日志的日志游标。
- 该工具会记录每智能体 SQLite 表 `sessions`、`session_entries`、`transcript_events`、`transcript_event_identities` 和 `session_routes` 的计数。
- 该工具会记录旧版 `sessions.json`、所引用的 JSONL 文件和候选证明会话 JSONL 路径的 `mtime`、`size` 及存在状态。
- `lsof -p <gateway-pid>` 必须显示 SQLite DB/WAL/SHM 句柄，且没有活跃的 `.jsonl` 或 `sessions.json` 句柄。

在实时模式下，`openclaw doctor --session-sqlite validate` 仅用于提供信息。切换后产生流量后，它可能会报告相对于旧版文件的预期偏差。该工具应使用 Doctor 输出进行分类和生成迁移清单，而不是将其作为运行时通过/失败判定依据。

## 智能体驱动场景

实时场景使用专用的证明会话键，并尽可能通过公共 RPC 路径驱动 Gateway 网关。一个智能体轮次应足以覆盖普通持久化，但完整证明应涵盖此前需要逐项实时检查的 3.1b 接缝：

- 普通聊天轮次：创建或复用证明会话，发送真实的智能体提示词，等待最终助手结果，并验证 `chat.history` 或等效的 Gateway 网关投影。
- 转录标识：验证相同标记同时出现在 Gateway 网关历史记录和 SQLite 转录行中，包括存在时的稳定事件标识行。
- 会话元数据访问器：通过 Gateway 网关/会话访问器读取证明会话和选定的现有实时会话，并将其与 SQLite 行进行比较。
- 会话补丁投影：对证明会话应用可逆的模型/会话元数据更改，然后验证投影行与 Gateway 网关响应一致。
- 压缩检查点生命周期：仅对证明会话或该工具创建的合成固件会话列出、分支和恢复检查点。
- 重启恢复：针对受控的证明会话或隔离测试实例运行安全恢复标记路径；实时模式仅可在目标会话集明确且操作可逆时运行此步骤。
- 清理生命周期：删除或重置证明会话，然后验证 SQLite 生命周期行和已归档的转录状态。

无法在实际操作员 Gateway 网关上安全执行的特定传输协议接缝（例如 WhatsApp 或语音呼叫入口）应针对同一 SQLite 契约使用所有者级运行时探针，而不是伪造外部传输协议。

## 分步断言

每一步都会对前后状态进行快照，并写入结构化断言记录：

- SQLite 行计数仅在预期位置增加。
- 对于记录运行时事件且由标记支持的证明会话，轨迹运行时行会增加。
- 证明会话行具有预期的 `session_id`、状态、时间戳、元数据和路由行。
- Gateway 网关历史记录/会话投影与 SQLite 转录末尾一致。
- 不会创建或修改证明会话 JSONL 文件。
- 不会创建证明会话 `.trajectory.jsonl`、`.trajectory-path.json` 或从标记派生的 `trajectory/<session>.jsonl` 边车文件。
- 现有旧版 JSONL 文件和 `sessions.json` 保持不变，除非该步骤明确属于离线迁移或归档操作。
- Gateway 网关进程不会打开 `.jsonl` 或 `sessions.json` 句柄。
- 除非场景明确将其加入允许列表，否则自上一个游标以来的日志不包含 `ERROR`、`FATAL`、`SQLITE_`、`no such column`、会话存储不可用、重启恢复失败或转录协调警告。

日志扫描是通过/失败契约的一部分。能够响应健康检查，但发出 SQLite 架构错误或重复转录协调失败的 Gateway 网关，不能视为 Path 3 通过。

## 证据工件

该工具应将证据写入 `.artifacts/path3-live-e2e/<timestamp>/`，并确保其不进入 git：

- `summary.json`：命令参数、Gateway 网关版本、结果、失败的断言和工件路径。
- `sqlite-before.json` 和 `sqlite-after.json`：行计数和选定的证明行。
- `legacy-files.json`：旧版文件的存在状态、`mtime`、大小以及每个文件是否发生更改。
- `gateway-log-scan.json`：游标范围、匹配的日志行和允许列表判定。
- `events.jsonl`：适合用于 PR 证明评论的有序分步观测结果。

PR 证明应概述这些工件，而不是粘贴完整转录或私密消息内容。

## 安全规则

- 实时模式绝不能在 Gateway 网关运行时重新导入旧版 JSONL。
- 除了明确选定且可逆的修复探针外，实时模式不得修改非证明会话。
- 任何破坏性或大范围迁移步骤都需要对受影响的 SQLite DB 和旧版会话目录进行全新备份。
- 备份应限定在涉及的智能体 DB/会话目录范围内，并在一次证明运行期间复用，以避免磁盘占用无限增长。
- 清理步骤不得留下证明会话、证明 JSONL 或已修改的旧版文件，除非调用者传入 `--keep-artifacts`。

## 通过结果

实时运行通过意味着 Gateway 网关接受了真实的智能体驱动会话流程，所有观测到的规范状态均位于 SQLite 中，旧版运行时文件保持静止，并且日志在测量窗口内保持健康。这并不意味着产生实时流量后旧版 JSONL 一致性仍保持正常；一旦 SQLite 成为规范存储，实时偏差就是预期行为。

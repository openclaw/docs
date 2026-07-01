---
read_when:
    - 将 OpenClaw 运行时数据、缓存、转录、任务状态或临时文件迁移到 SQLite
    - 从旧版 JSON 或 JSONL 文件设计 Doctor 迁移
    - 更改备份、恢复、VFS 或工作器存储行为
    - 移除会话锁、清理、截断或 JSON 兼容路径
summary: 在保持配置由文件支持的同时，使 SQLite 成为主要持久状态和缓存层的迁移计划
title: 数据库优先的状态重构
x-i18n:
    generated_at: "2026-07-01T20:11:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# 数据库优先状态重构

## 决策

使用两级 SQLite 布局：

- 全局数据库：`~/.openclaw/state/openclaw.sqlite`
- 智能体数据库：每个智能体一个 SQLite 数据库，用于智能体拥有的工作区、转录、VFS、工件以及大型单智能体运行时状态
- 配置继续由文件承载：`openclaw.json` 仍位于数据库之外。运行时凭证配置文件迁移到 SQLite；外部提供商或 CLI 凭据文件仍由其所有者管理，位于 OpenClaw 数据库之外。

全局数据库是控制面数据库。它拥有智能体发现、共享 Gateway 网关状态、配对、设备/节点状态、任务和流程账本、插件状态、调度器运行时状态、备份元数据以及迁移状态。

智能体数据库是数据面数据库。它拥有智能体的会话元数据、转录事件流、VFS 工作区或临时命名空间、工具工件、运行工件，以及可搜索/可索引的智能体本地缓存数据。

这样可以提供一个持久的全局视图，同时不强迫大型智能体工作区、转录和二进制临时数据进入共享 Gateway 网关写入通道。

## 硬性契约

此迁移只有一种规范运行时形态：

- 会话行仅持久化会话元数据。它们不得持久化 `transcriptLocator`、转录文件路径、同级 JSONL 路径、锁路径、修剪元数据，或文件时代兼容性指针。
- 转录身份始终是 SQLite 身份：`{agentId, sessionId}`，并在协议需要时附加可选主题元数据。
- `sqlite-transcript://...` 不是运行时或协议身份。新代码不得派生、持久化、传递、解析或迁移转录定位器。运行时和测试根本不应包含伪定位器；文档只能提及该字符串以禁止使用。
- 旧版 `sessions.json`、转录 JSONL、`.jsonl.lock`、修剪、截断以及旧会话路径逻辑只能属于 Doctor 迁移/导入路径。
- 旧版会话配置别名只能属于 Doctor 迁移。运行时不解释 `session.idleMinutes`、`session.resetByType.dm`，或跨智能体的 `agent:main:*` 主会话别名（用于另一个已配置智能体）。
- 会话路由身份是有类型的关系状态。热运行时和 UI 路径应读取 `sessions.session_scope`、`sessions.account_id`、`sessions.primary_conversation_id`、`conversations` 和 `session_conversations`；它们不得解析 `session_key`，也不得从 `session_entries.entry_json` 挖掘提供商身份，除非是在删除旧调用点期间作为兼容性影子。
- 渠道级私信标记（如 `dm` 与 `direct`）是路由词汇，不是转录定位器或文件存储兼容性句柄。
- 旧版钩子处理器配置只能属于 Doctor 警告/迁移表面。运行时不得加载 `hooks.internal.handlers`；钩子只能通过已发现的钩子目录和 `HOOK.md` 元数据运行。
- 运行时启动、热回复路径、压缩、重置、恢复、诊断、TTS、记忆钩子、子智能体、插件命令路由、协议边界和钩子必须在运行时中传递 `{agentId, sessionId}`。
- 测试应通过 `{agentId, sessionId}` 播种并断言 SQLite 转录行。仅证明 JSONL 路径转发、调用方提供的定位器保留，或转录文件兼容性的测试应删除，除非它们覆盖 Doctor 导入、非会话支持/调试物化，或协议形态。
- `runEmbeddedPiAgent(...)`、预备工作器运行以及内部嵌入式尝试不得接受转录定位器。它们通过 `{agentId, sessionId}` 打开 SQLite 转录管理器，并将该管理器传递给内部化的 PI 兼容智能体会话，因此陈旧调用方无法让运行器写入 JSON/JSONL 转录。
- 运行器诊断必须将运行时/缓存/载荷跟踪记录存储在 SQLite 中。运行时诊断不得暴露 JSONL 文件覆盖旋钮或通用转录 JSONL 导出助手；面向用户的导出可以从数据库行物化显式工件，而无需把文件名反馈给运行时。
- 原始流日志使用 `OPENCLAW_RAW_STREAM=1` 加 SQLite 诊断行。旧 pi-mono 的 `PI_RAW_STREAM`、`PI_RAW_STREAM_PATH` 和 `raw-openai-completions.jsonl` 文件日志契约不属于 OpenClaw 运行时或测试。
- QMD 记忆索引不得将 SQLite 转录导出为 Markdown 文件。QMD 只索引已配置的记忆文件；会话转录搜索保持由 SQLite 承载。
- QMD SDK 子路径在新代码中仅用于 QMD。SQLite 会话转录索引助手位于 `memory-core-host-engine-session-transcripts`；任何 QMD 再导出都只是兼容性用途，且不得被运行时代码使用。
- 内置记忆索引位于所属智能体数据库中。运行时配置和已解析的运行时契约不得暴露 `memorySearch.store.path`；Doctor 会删除该旧版配置键，当前代码会在内部传递智能体的 `databasePath`。

实现工作应持续删除代码，直到这些陈述在 Doctor/导入/导出/调试边界之外均无例外地成立。

## 目标状态和进展

### 硬性目标

- 一个全局 SQLite 数据库拥有控制面状态：`state/openclaw.sqlite`。
- 一个单智能体 SQLite 数据库拥有数据面状态：`agents/<agentId>/agent/openclaw-agent.sqlite`。
- 配置保持由文件承载。`openclaw.json` 不属于此次数据库重构。
- 旧版文件仅作为 Doctor 迁移输入。
- 运行时永远不会将会话或转录 JSONL 作为活动状态写入或读取。

### 目标状态

- `not-started`：文件时代运行时代码仍会写入活动状态。
- `migrating`：Doctor/导入代码可以将文件数据迁移到 SQLite。
- `dual-read`：临时桥接会同时读取 SQLite 和旧版文件。除非明确记录为仅限 Doctor，否则此重构禁止该状态。
- `sqlite-runtime`：运行时只读写 SQLite。
- `clean`：旧版运行时 API 和测试已移除，防护可防止回归。
- `done`：文档、测试、备份、Doctor 迁移和变更检查证明了干净状态。

### 当前状态

- 会话：运行时为 `clean`。会话行位于单智能体数据库中，运行时 API 使用 `{agentId, sessionId}` 或 `{agentId, sessionKey}`，`sessions.json` 是仅限 Doctor 的旧版输入。
- 转录：运行时为 `clean`。转录事件、身份、快照和轨迹运行时事件位于单智能体数据库中。运行时不再接受转录定位器或 JSONL 转录路径。
- PI 嵌入式运行器：`clean`。嵌入式 PI 运行、预备工作器、压缩和重试循环使用 SQLite 会话作用域，并拒绝陈旧转录句柄。
- Cron：运行时为 `clean`。运行时使用 `cron_jobs` 和 `cron_run_logs`；运行时测试使用 SQLite `storeKey` 命名，文件时代 cron 路径仅保留在 Doctor 旧版迁移测试中。
- 任务注册表：`clean`。Task 和 Task Flow 运行时行位于 `state/openclaw.sqlite`；未发布的旁路 SQLite 导入器已删除。
- 插件状态：`clean`。插件状态/blob 行位于共享全局数据库中；旧插件状态旁路 SQLite 助手已被防护禁止。
- 记忆：内置记忆和会话转录索引为 `sqlite-runtime`。记忆索引表位于单智能体数据库中，插件记忆状态使用共享插件状态行，旧版记忆文件是 Doctor 迁移输入或用户工作区内容。
- 备份：`sqlite-runtime`。备份阶段会压缩 SQLite 快照，省略实时 WAL/SHM 旁路文件，验证 SQLite 完整性，并在全局数据库中记录备份运行。
- Doctor 迁移：有意保持为 `migrating`。Doctor 会将旧版 JSON、JSONL 和已退役旁路存储导入 SQLite，记录迁移运行/来源，并移除成功迁移的来源。
- E2E 脚本：运行时覆盖为 `clean`。Docker MCP 播种会写入 SQLite 行。runtime-context Docker 脚本只在 Doctor 迁移播种中创建旧版 JSONL，并显式命名旧版会话索引路径。

### 剩余工作

- [x] 将 cron 运行时测试存储变量从 `storePath` 改名，除非它们是 Doctor 旧版输入。
      文件：`src/cron/service.test-harness.ts`、
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`、
      `src/cron/service/timer.regression.test.ts`、
      `src/cron/service/ops.test.ts`、`src/cron/service/store.test.ts`、
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`、
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`、
      `src/cron/store.test.ts`。
      证明：`pnpm check:database-first-legacy-stores`；`rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`。
- [x] 移除或重命名过时的文件时代导出测试 mock。
      文件：`src/auto-reply/reply/commands-export-test-mocks.ts`。
      证明：`rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`。
- [x] 让 Docker runtime-context 旧版 JSONL 播种明显仅限 Doctor。
      文件：`scripts/e2e/session-runtime-context-docker-client.ts`。
      证明：`rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` 只显示
      `seedBrokenLegacySessionForDoctorMigration`。
- [x] 在任何架构变更后保持 Kysely 生成类型对齐。
      文件：`src/state/openclaw-state-schema.sql`、
      `src/state/openclaw-agent-schema.sql`、
      `src/state/*generated*`。
      证明：本轮没有架构变更；`pnpm db:kysely:check`；
      `pnpm lint:kysely`。
- [x] 重新运行针对已触及存储、命令和脚本的聚焦测试。
      证明：`pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`；`git diff --check`。
- [x] 在声明 `done` 前，运行变更门禁或远程广泛证明。
      证明：`pnpm check:changed --timed -- <changed extension paths>` 在
      Hetzner Crabbox 运行 `run_3f1cabf6b25c` 上通过，期间进行了临时 Node 24/pnpm 设置，并为同步的无 `.git` 工作区显式配置路径路由。

### 不要回归

- 不要有转录定位器。
- 不要有活动会话文件。
- 不要有虚假 JSONL 测试夹具，Doctor 旧版迁移测试除外。
- 在预期使用 Kysely 的地方不要使用原始 SQLite 访问。
- 不要新增旧版 DB 迁移。此布局尚未发布；除非有强理由，否则将架构版本保持为 `1`。

## 代码阅读假设

没有后续产品决策阻塞此计划。实现应基于以下假设继续：

- 直接使用 `node:sqlite`，并要求此存储路径使用 Node 22+ 运行时。
- 只保留一个常规配置文件。不要在这次重构中把配置、插件清单或 Git 工作区迁移到 SQLite。
- 不需要运行时兼容文件。旧版 JSON 和 JSONL 文件只作为迁移输入。分支本地的 SQLite sidecar 从未发布，因此直接删除而不是导入。
- `openclaw doctor --fix` 负责旧版文件到数据库的迁移步骤。运行时启动和 `openclaw migrate` 不应携带旧版 OpenClaw 数据库升级路径。
- 凭证兼容性遵循同一规则：运行时凭证存放在 SQLite 中。旧的 `auth-profiles.json`、每 Agent 的 `auth.json` 和共享的 `credentials/oauth.json` 文件是 Doctor 迁移输入，导入后移除。
- 生成的模型目录状态由数据库支持。运行时代码不得写入 `agents/<agentId>/agent/models.json`；现有的 `models.json` 文件是旧版 Doctor 输入，导入到 `agent_model_catalogs` 后移除。
- 运行时不得迁移、规范化或桥接 transcript 定位符。活跃 transcript 身份在 SQLite 中是 `{agentId, sessionId}`。文件路径只作为旧版 Doctor 输入，并且 `sqlite-transcript://...` 必须从运行时、协议、钩子和插件表面消失，而不是被当作边界句柄处理。
- 运行时 SQLite transcript 读取不会运行旧的 JSONL 条目形状迁移，也不会为了兼容性重写整个 transcript。旧版条目规范化保留在显式 Doctor/导入工具中。Doctor 会在插入 SQLite 行之前规范化旧版 JSONL transcript 文件；当前运行时行已经按当前 transcript schema 写入。轨迹/会话导出会原样读取这些行，并且不得执行导出时旧版迁移。
- 旧版 transcript JSONL 解析/迁移 helper 仅供 Doctor 使用。运行时 transcript 格式代码只构建当前 SQLite transcript 上下文；Doctor 负责在插入行之前升级旧 JSONL 条目。
- 旧的运行时拥有的 JSONL transcript 流式传输 helper 已删除。Doctor 导入代码负责显式旧版文件读取；运行时会话历史读取 SQLite 行。
- Codex app-server 绑定使用 OpenClaw `sessionId` 作为 Codex 插件状态命名空间中的规范键。`sessionKey` 是用于路由/显示的元数据，不得替代持久会话 ID，也不得恢复 transcript 文件身份。
- 上下文引擎会直接接收当前运行时契约。注册表不得用重试 shim 包装引擎并删除 `sessionKey`、`transcriptScope` 或 `prompt`；无法接受当前数据库优先参数的引擎应明确失败，而不是被桥接。
- 备份输出应保持为一个归档文件。数据库内容应作为紧凑的 SQLite 快照进入该归档，而不是原始的实时 WAL sidecar。
- transcript 搜索很有用，但第一版数据库优先改造不要求实现。设计 schema 时应保证以后可以添加 FTS。
- Worker 执行应在数据库边界稳定期间继续作为实验性功能放在设置之后。

## 代码阅读发现

当前分支已经超过概念验证阶段。共享数据库已经存在，Node `node:sqlite` 已通过一个小型运行时 helper 接入，之前的存储现在会写入 `state/openclaw.sqlite` 或所属的 `openclaw-agent.sqlite` 数据库。

剩余工作不是选择 SQLite，而是保持新边界干净，并删除任何仍然看起来像旧文件世界的兼容性形状接口：

- Session `storePath` 不再是运行时身份、测试夹具形状或状态 payload 字段。运行时和 bridge 测试不再包含 `storePath` 契约名称；Doctor/迁移代码拥有这套旧版词汇。
- Session 写入不再通过旧的进程内 `store-writer.ts` 队列。SQLite patch 写入改用冲突检测和有界重试。
- 旧版路径发现仍有有效的迁移用途，但运行时代码应停止把 `sessions.json` 和 transcript JSONL 文件当作可能的写入目标。
- Agent 拥有的表位于每 Agent 的 SQLite 数据库中。全局数据库保留注册表/控制平面行；transcript 身份是每 Agent transcript 行中的 `{agentId, sessionId}`。运行时代码不得持久化 transcript 文件路径或迁移 transcript 定位符。
- Doctor 已经导入了多个旧版文件。清理工作是把它变成由 Doctor 调用的单一显式迁移实现，并生成持久的迁移报告。

没有额外产品问题阻塞实现。

## 当前代码形态

该分支已经有一个真正的共享 SQLite 基础：

- 运行时最低版本现在是 Node 22+：`package.json`、CLI 运行时守卫、安装器默认值、macOS 运行时定位器、CI 和公开安装文档现在全部一致。旧的 Node 22 兼容性通道已移除。
- `src/state/openclaw-state-db.ts` 会打开 `openclaw.sqlite`，设置 WAL、`synchronous=NORMAL`、`busy_timeout=30000`、`foreign_keys=ON`，并应用从 `src/state/openclaw-state-schema.sql` 派生的生成式 schema 模块。
- Kysely 表类型和运行时 schema 模块由一次性 SQLite 数据库生成，这些数据库基于已提交的 `.sql` 文件创建；运行时代码不再为全局、每智能体或代理捕获数据库保留复制粘贴的 schema 字符串。
- 运行时存储现在从这些生成的 Kysely `DB` 接口派生选中行和插入行类型，而不是手写影子 SQLite 行形状。原始 SQL 仍仅限于 schema 应用、pragma 和仅迁移用 DDL。
- SQLite schema 已折叠为 `user_version = 1`，因为此数据库布局尚未发布。运行时开启器只创建当前 schema；文件到数据库导入仍保留在 Doctor 代码中，分支本地数据库升级 helper 已删除。
- 在所有权边界是规范边界的位置会强制执行关系所有权：源迁移行从 `migration_runs` 级联，任务投递状态从 `task_runs` 级联，转录身份行从转录事件级联。
- 当前共享表包括 `agent_databases`、`auth_profile_stores`、`auth_profile_state`、`plugin_state_entries`、`plugin_blob_entries`、`media_blobs`、`skill_uploads`、`capture_sessions`、`capture_events`、`capture_blobs`、`sandbox_registry_entries`、`cron_run_logs`、`cron_jobs`、`commitments`、`delivery_queue_entries`、`model_capability_cache`、`workspace_setup_state`、`native_hook_relay_bridges`、`current_conversation_bindings`、`plugin_binding_approvals`、`tui_last_sessions`、`acp_sessions`、`acp_replay_sessions`、`acp_replay_events`、`task_runs`、`task_delivery_state`、`flow_runs`、`subagent_runs`、`migration_runs` 和 `backup_runs`。
- 任意插件自有状态不会获得宿主自有的类型化表。已安装插件使用 `plugin_state_entries` 存放带版本的 JSON 负载，并使用 `plugin_blob_entries` 存放字节，具备命名空间/键所有权、TTL 清理、备份和插件迁移记录。当宿主拥有查询契约时，宿主自有的插件编排状态仍可拥有类型化表，例如 `plugin_binding_approvals`。
- 插件迁移是针对插件自有命名空间的数据迁移，而不是宿主 schema 迁移。插件可以通过迁移提供程序迁移自己的带版本状态/blob 条目，宿主则在普通迁移账本中记录源/运行状态。新的插件安装不需要更改 `openclaw-state-schema.sql`，除非宿主本身要接管新的跨插件契约的所有权。
- `src/state/openclaw-agent-db.ts` 会打开 `agents/<agentId>/agent/openclaw-agent.sqlite`，在全局 DB 中注册该数据库，并拥有智能体本地的会话、转录、VFS、制品、缓存和记忆索引表。共享运行时设备发现现在读取生成类型化的 `agent_databases` 注册表，而不是在每个调用点重新实现该查询。
- 全局数据库和每智能体数据库会记录一行 `schema_meta`，包含数据库角色、schema 版本、时间戳，以及智能体数据库的智能体 id。布局仍保持在 `user_version = 1`，因为此 SQLite schema 尚未发布。
- 每智能体会话身份现在有一个规范 `sessions` 根表，以 `session_id` 为键，并将 `session_key`、`session_scope`、`account_id`、`primary_conversation_id`、时间戳、显示字段、模型元数据、harness id 以及父级/派生链接作为可查询列。`session_routes` 是从 `session_key` 到当前 `session_id` 的唯一活跃路由索引，因此路由键可以移动到新的持久会话，而不会让热读取在重复的 `sessions.session_key` 行之间选择。旧的兼容形状 `session_entries.entry_json` 负载通过外键挂接到持久 `session_id` 根；它不再是会话在 schema 层面的唯一表示。
- 每智能体外部会话身份也是关系化的：`conversations` 存储规范化的提供商/账号/会话身份，`session_conversations` 将一个 OpenClaw 会话链接到一个或多个外部会话。这覆盖了共享主私信会话，其中多个对等方可以有意映射到一个会话，而不必在 `session_key` 中伪装。SQLite 还会对自然提供商身份强制唯一性，因此同一个渠道/账号/类型/对等方/thread 元组不能分叉到不同会话 id。共享主直接对等方以 `participant` 角色链接，因此一个 OpenClaw 会话可以表示多个外部私信对等方，而不会把较旧的对等方降级成模糊的相关行。`sessions.primary_conversation_id` 仍指向当前类型化投递目标。关闭的路由/状态列通过 SQLite `CHECK` 约束强制执行，而不是只依赖 TypeScript 联合类型。
  运行时会话投影会在应用类型化会话/会话列之前，从 `session_entries.entry_json` 中清除兼容性路由影子，因此陈旧的 JSON 负载无法重新激活投递目标。
  子智能体公告路由同样要求类型化 SQLite 投递上下文；它不再回退到兼容性 `SessionEntry` 路由字段。
  Gateway 网关 `chat.send` 显式投递继承会读取类型化 SQLite 投递上下文，而不是 `origin`/`last*` 兼容字段。
  `tools.effective` 同样从类型化 SQLite 投递/路由行派生提供商/账号/thread 上下文，而不是陈旧的 `last*` 会话条目影子。
  系统事件提示上下文会从类型化投递字段重建 channel/to/account/thread 字段，而不是使用 `origin` 影子。
  共享的 `deliveryContextFromSession` helper 和会话到会话映射器现在完全忽略 `SessionEntry.origin`；只有类型化投递字段和关系会话行可以创建热路由身份。
  运行时会话条目规范化会在持久化或投影 `entry_json` 前剥离 `origin`，入站元数据会写入类型化 channel/chat 字段以及关系会话行，而不是创建新的 origin 影子。
- 转录事件、转录快照和轨迹运行时事件现在引用规范的每智能体 `sessions` 根，并在会话删除时级联。转录身份/idempotency 行继续从精确的转录事件行级联。
- 记忆核心索引现在使用显式智能体数据库表 `memory_index_meta`、`memory_index_sources`、`memory_index_chunks` 和 `memory_embedding_cache`，并由 `memory_index_state` 跟踪修订变化。可选 FTS/vector 侧索引命名为 `memory_index_chunks_fts` 和 `memory_index_chunks_vec`，而不是通用的 `meta`、`files`、`chunks`、`chunks_fts` 或 `chunks_vec` 表。规范名称保留当前路径/源行形状和序列化 embedding 兼容性。这些表是派生/搜索缓存，不是规范转录存储；它们可以从记忆工作区文件和配置的源删除并重建。打开已发布的通用名称记忆索引时，会将其元数据、源、chunk 和 embedding 缓存迁移到规范表；派生 FTS/vector 表会以规范名称重建。
- 子智能体运行恢复状态现在位于类型化共享 `subagent_runs` 行中，并带有已索引的子级、请求者和控制器会话键。旧的 `subagents/runs.json` 文件仅作为 Doctor 迁移输入。
- 当前会话绑定现在位于类型化共享 `current_conversation_bindings` 行中，以规范化会话 id 为键，并将目标智能体/会话列、会话类型、状态、过期时间和元数据存储为关系列，而不是重复的不透明绑定记录。持久绑定键包含规范化会话类型，因此 direct/group/channel ref 不会冲突，SQLite 会拒绝无效的绑定类型/状态值。旧的 `bindings/current-conversations.json` 文件仅作为 Doctor 迁移输入。
- 投递队列恢复现在会把 channel、target、account、session、retry、error、platform-send 和 recovery state 的类型化队列列叠加到 replay JSON 上。`entry_json` 保留 replay 负载、hook 和格式化负载，但类型化列是热队列路由/状态的权威来源。
- TUI 上次会话恢复指针现在位于类型化共享 `tui_last_sessions` 行中，以哈希后的 TUI 连接/会话作用域为键。旧的 TUI JSON 文件仅作为 Doctor 迁移输入。
- 默认 TTS 偏好现在位于共享插件状态 SQLite 行中，键位于 `speech-core` 插件下。旧的 `settings/tts.json` 文件仅作为 Doctor 迁移输入；运行时不再读取或写入 TTS 偏好 JSON 文件，旧版路径解析器位于 Doctor 迁移模块中。
- secret 目标元数据现在会谈论存储，而不是假装每个凭据目标都是配置文件。`openclaw.json` 仍是配置存储；auth-profile 目标使用类型化 SQLite `auth_profile_stores` 行，并将提供商形状的凭据保留为 JSON 负载。
- secret 审计不再扫描已退役的每智能体 `auth.json` 文件。Doctor 负责警告、导入并移除该旧版文件。
- 旧版 auth profile 路径 helper 现在位于 Doctor 旧版代码中。核心 auth profile 路径 helper 暴露 SQLite auth-store 身份和显示位置，而不是 `auth-profiles.json` 或 `auth-state.json` 运行时路径。
- 子智能体运行恢复和 OpenRouter 模型能力缓存运行时模块现在将 SQLite 快照 reader/writer 与仅 Doctor 使用的旧版 JSON 导入 helper 分离。OpenRouter 能力使用 `provider_id = "openrouter"` 下的类型化通用 `model_capability_cache` 行，而不是一个不透明缓存 blob 或提供商特定宿主表。子智能体运行 `taskName` 存储在类型化 `subagent_runs.task_name` 列中；`payload_json` 副本是 replay/debug 数据，不是热显示或查找字段的来源。
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` 在智能体数据库 `vfs_entries` 表上实现 SQLite VFS。目录读取、递归导出、删除和重命名使用已索引的 `(namespace, path)` 前缀范围，而不是扫描整个命名空间或依赖 `LIKE` 路径匹配。
- `src/agents/runtime-worker.entry.ts` 为 worker 创建每次运行的 SQLite VFS、工具制品、运行制品和限定作用域缓存存储。
- 工作区引导完成标记现在位于类型化共享 `workspace_setup_state` 行中，以解析后的工作区路径为键，而不是 `.openclaw/workspace-state.json`；运行时不再读取或重写旧版工作区标记，helper API 也不再为了派生存储身份而传递假的 `.openclaw/setup-state` 路径。
- Exec 审批现在位于类型化共享 SQLite `exec_approvals_config` 单例行中。Doctor 会导入旧版 `~/.openclaw/exec-approvals.json`；运行时写入不再创建、重写或报告该文件为其活跃存储位置。macOS 配套应用读取和写入同一个 `state/openclaw.sqlite` 表行；它只在磁盘上保留 Unix prompt socket，因为那是 IPC，而不是持久运行时状态。
- 设备身份、设备 auth 和引导运行时模块现在将 SQLite 快照 reader/writer 与仅 Doctor 使用的旧版 JSON 导入 helper 分离。设备身份使用类型化 `device_identities` 行，设备 auth token 使用类型化 `device_auth_tokens` 行。设备 auth 写入会按设备/角色调和行，而不是截断 token 表，运行时也不再通过旧的整存储适配器路由单 token 更新。旧版
  version-1 JSON 载荷仅作为 doctor 导入/导出形状存在。
- GitHub Copilot 令牌交换缓存使用共享 SQLite 插件状态表，
  位于 `github-copilot/token-cache/default` 下。它是提供商拥有的缓存状态，
  因此有意不添加主机 schema 表。
- GitHub Copilot 压缩不再写入 `openclaw-compaction-*.json`
  工作区边车文件。该 harness 会为被跟踪的 SDK 会话调用 SDK 历史压缩 RPC，
  OpenClaw 则在 SQLite 中保留持久会话/转录状态，
  而不是使用兼容性标记文件。
- 共享 Swift 运行时（`OpenClawKit`）为设备身份和设备凭证使用相同的
  `state/openclaw.sqlite` 行。macOS 应用辅助程序会导入共享 SQLite helper，
  而不是拥有第二条 JSON 或 SQLite 路径。残留的旧版 `identity/device.json`
  会阻止身份创建，直到 doctor 将它导入 SQLite，这与 TypeScript 和 Android
  启动门控一致。
- Android 设备身份使用相同的 TypeScript 兼容密钥材料，
  存储在类型化的 `state/openclaw.sqlite#table/device_identities` 行中。它绝不会
  读取或写入 `openclaw/identity/device.json`；残留的旧版文件会阻止启动，
  直到 doctor 将它导入 SQLite。
- Android 缓存的设备凭证令牌也使用类型化的
  `state/openclaw.sqlite#table/device_auth_tokens` 行，并与 TypeScript 和 Swift
  共享相同的 version-1 令牌语义。运行时不再读取 `SecurePrefs`
  `gateway.deviceToken*` 兼容键；这些键只属于迁移/doctor 逻辑。
- Android 通知最近包历史使用类型化的
  `android_notification_recent_packages` 行。运行时不再迁移或读取旧的
  SharedPreferences CSV 键。
- 当旧版 `identity/device.json` 存在、SQLite 身份行无效，或 SQLite 身份存储
  无法打开时，设备身份创建会失败关闭。Doctor 会先导入并移除该文件，
  因此运行时启动不会在迁移前静默轮换配对身份。
- 设备身份选择是 SQLite 行键，而不是 JSON 文件定位器。测试和 Gateway 网关
  helper 会传入显式身份键；只有 doctor 迁移和失败关闭启动门控知道已退役的
  `identity/device.json` 文件名。
- 会话重置兼容性现在位于 doctor 配置迁移中：
  `session.idleMinutes` 会移入 `session.reset.idleMinutes`，
  `session.resetByType.dm` 会移入 `session.resetByType.direct`，
  运行时重置策略只读取规范重置键。
- 旧版配置兼容性现在位于 `src/commands/doctor/` 下。正常的
  `readConfigFileSnapshot()` 校验不会导入 doctor 旧版检测器，
  也不会标注旧版问题；`runDoctorConfigPreflight()` 会为 doctor 修复/报告
  添加这些问题。doctor 配置流程导入
  `src/commands/doctor/legacy-config.ts`，旧 OAuth profile-id 修复位于
  `src/commands/doctor/legacy/oauth-profile-ids.ts` 下。
- 非 doctor 命令不会自动运行旧版配置修复。例如，
  `openclaw update --channel` 现在会因无效旧版配置而失败，并要求用户运行 doctor，
  而不是静默导入 doctor 迁移代码。
- Web push、APNs、Voice Wake、更新检查和配置健康现在使用类型化的共享 SQLite
  表来存储订阅、VAPID 密钥、节点注册、触发行、路由行、更新通知状态和配置健康条目，
  而不是使用整体不透明 JSON blob。Web push 和 APNs 快照写入现在按主键协调
  订阅/注册，而不是清空它们的表；配置健康也按配置路径执行相同处理。
  它们的运行时模块会将 SQLite 快照读写器与仅供 doctor 使用的旧版 JSON
  导入 helper 分离。
- 节点主机配置现在使用共享 SQLite 数据库中的类型化单例行；
  doctor 会在正常运行时使用前导入旧的 `node.json` 文件。
- 设备/节点配对、频道配对、频道 allowlist 和引导状态现在使用类型化 SQLite 行，
  而不是整体不透明 JSON blob。插件绑定审批和 cron 作业状态遵循相同拆分：
  运行时模块暴露 SQLite 支持的操作和中立快照 helper，配对/引导以及插件绑定审批
  快照写入会按主键协调行，而不是截断表，同时 doctor 会通过
  `src/commands/doctor/legacy/*` 模块导入/移除旧 JSON 文件。
- 已安装插件记录现在位于 SQLite 已安装插件索引中。
  运行时配置读写不再迁移或保留旧的 `plugins.installs` authored-config 数据；
  doctor 会在正常运行时使用前将该旧版配置形状导入 SQLite。
- QQ Bot 凭证恢复快照现在位于 SQLite 插件状态中的
  `qqbot/credential-backups` 下。运行时不再写入
  `qqbot/data/credential-backup*.json`；QQ Bot doctor 合约会从活动状态目录
  导入并归档这些旧版备份文件。
- Gateway 网关重载规划会在内部 `installedPluginIndex.installRecords.*` diff
  命名空间下比较 SQLite 已安装插件索引快照。运行时重载决策不再将这些行包装成
  伪造的 `plugins.installs` 配置对象。
- Matrix 命名账户凭证升级不再发生在运行时读取期间。当可以解析单个/默认 Matrix
  账户时，Doctor 负责旧的顶层 `credentials/matrix/credentials.json` 重命名。
- 核心配对和 cron 运行时模块不再导出旧版 JSON 路径构建器。doctor 拥有的旧版模块
  仅为导入测试和迁移构造 `pending.json`、`paired.json`、`bootstrap.json`
  和 `cron/jobs.json` 源路径。旧版 cron 作业形状规范化和 cron 运行日志导入位于
  `src/commands/doctor/legacy/cron*.ts` 下。
- `src/commands/doctor/legacy/runtime-state.ts` 会从 doctor 将旧版 JSON 状态文件
  导入 SQLite，包括节点主机配置。新的旧版文件导入器保留在
  `src/commands/doctor/legacy/` 下。
- `src/commands/doctor/state-migrations.ts` 会将旧版 `sessions.json` 和
  `*.jsonl` 转录直接导入 SQLite，并移除成功导入的源文件。它不再通过
  `agents/<agentId>/sessions/*.jsonl` 暂存根旧版转录，也不会在导入前创建规范
  JSONL 目标。
- 状态完整性 doctor 检查不再扫描旧版会话目录，也不再提供孤立 JSONL 删除。
  旧版转录文件只是迁移输入，迁移步骤负责导入和源文件移除。
- 旧版 sandbox 注册表导入位于
  `src/commands/doctor/legacy/sandbox-registry.ts` 下；活动 sandbox 注册表的
  读写仍然仅使用 SQLite。
- 旧版会话转录健康/导入修复位于
  `src/commands/doctor/legacy/session-transcript-health.ts` 下；运行时命令模块不再携带
  JSONL 转录解析或活动分支修复代码。

已完成的合并/删除重点：

- 插件状态现在使用共享的 `state/openclaw.sqlite` 数据库。旧的分支本地 `plugin-state/state.sqlite` sidecar 导入器已移除，因为该 SQLite 布局从未发布。探测/测试辅助工具会报告共享的 `databasePath`，而不是暴露插件状态专用的 SQLite 路径。
- Task 和 Task Flow 运行时表现在位于共享的 `state/openclaw.sqlite` 数据库中，而不是 `tasks/runs.sqlite` 和 `tasks/flows/registry.sqlite`；旧的 sidecar 导入器也因同样的未发布布局原因被移除。
- `src/config/sessions/store.ts` 不再需要为入站元数据、路由更新或 updated-at 读取使用 `storePath`。命令持久化、CLI 会话清理、子智能体深度、认证覆盖和转录会话身份都使用智能体/会话行 API。写入会以 SQLite 行补丁形式应用，并带有乐观冲突重试。
- 会话目标解析现在暴露每个智能体的数据库目标，而不是旧版 `sessions.json` 路径。共享 Gateway 网关、ACP 元数据、Doctor 路由修复和 `openclaw sessions` 会枚举 `agent_databases` 以及已配置的智能体。
- Gateway 网关会话路由现在使用 `resolveGatewaySessionDatabaseTarget`；返回的目标携带 `databasePath` 和候选 SQLite 行键，而不是旧版会话存储文件路径。
- 渠道会话运行时类型现在为 updated-at 读取、入站元数据和最后路由更新暴露 `{agentId, sessionKey}`。旧的 `saveSessionStore(storePath, store)` 兼容类型已移除。
- 插件运行时、扩展 API 和 `config/sessions` barrel 表面现在会引导插件代码使用 SQLite 支持的会话行辅助工具。根库兼容导出（`loadSessionStore`、`saveSessionStore`、`resolveStorePath`）仍作为面向现有消费者的已弃用 shim 保留。旧的 `resolveLegacySessionStorePath` 辅助工具已移除；旧版 `sessions.json` 路径构造现在仅存在于迁移和测试夹具中。
- `src/config/sessions/session-entries.sqlite.ts` 现在将规范会话条目存储在每个智能体的数据库中，并支持行级读取/插入更新/删除补丁。运行时插入更新/补丁/删除不再扫描大小写变体或修剪旧版别名键；Doctor 负责规范化。独立 JSON 导入辅助工具已移除，迁移会合并插入更新较新的行，而不是替换整个会话表。公开读取/列出/加载辅助工具会从类型化的 `sessions` 和 `conversations` 行投影热会话元数据；`entry_json` 是兼容/调试影子，可以过时或无效，而不会丢失类型化会话身份或投递上下文。
- `src/config/sessions/delivery-info.ts` 现在会从类型化的每智能体 `sessions` + `conversations` + `session_conversations` 行解析投递上下文。它不再从 `session_entries.entry_json` 重建运行时投递身份；缺少类型化 conversation 行是 Doctor 迁移/修复问题，而不是运行时 fallback。
- 存储会话重置决策现在优先使用类型化的 `sessions.session_scope`、`sessions.chat_type` 和 `sessions.channel` 元数据。`sessionKey` 解析仅保留用于命令目标上的显式线程/主题后缀；群组与直接重置分类不再来自键形状。
- 会话列表/状态显示分类现在使用类型化聊天元数据和 Gateway 网关会话种类。它不再把 `session_key` 中的 `:group:` 或 `:channel:` 子串当作持久的群组/直接真相。
- 静默回复策略选择现在仅使用显式 conversation 类型或表面元数据。它不再从 `session_key` 子串猜测直接/群组策略。
- 会话显示模型解析现在从 SQLite 会话数据库目标接收智能体 ID，而不是从 `session_key` 中拆分出来。
- 智能体到智能体公告目标填充现在只使用类型化的 `sessions.list` `deliveryContext`。它不再从旧版 `origin`、镜像的 `last*` 字段或 `session_key` 形状恢复渠道/account/thread 路由。
- `sessions_send` 线程目标拒绝现在读取类型化 SQLite 路由元数据。它不再通过从目标键解析线程后缀来拒绝或接受目标。
- 群组作用域工具策略验证现在读取当前或生成会话的类型化 SQLite conversation 路由。它不再通过解码 `sessionKey` 来信任群组/渠道身份；当没有类型化会话行为调用方提供的群组 ID 作证时，这些 ID 会被丢弃。
- 渠道模型覆盖匹配现在使用显式群组和父 conversation 元数据。它不再从 `parentSessionKey` 解码父 conversation ID。
- 存储模型覆盖继承现在需要来自类型化会话上下文的显式父会话键。它不再从 `sessionKey` 中的 `:thread:` 或 `:topic:` 后缀派生父覆盖。
- 旧的会话 thread-info 包装器和已加载插件线程解析器已移除；没有运行时代码导入 `config/sessions/thread-info`。
- 渠道 conversation 辅助工具不再暴露完整会话键解析桥。核心仍通过 `resolveSessionConversation(...)` 规范化 provider 拥有的原始 conversation ID，但不会从 `sessionKey` 重建路由事实。
- 完成投递、发送策略和任务维护不再从 `session_key` 形状派生聊天类型。旧的聊天类型键解析器已删除；这些路径需要类型化会话元数据、类型化投递上下文或显式投递目标词汇。
- 会话列表/状态、诊断、审批账号绑定、TUI Heartbeat 过滤和用量摘要不再挖掘 `SessionEntry.origin` 来获取 provider/account/thread/display 路由。剩余的运行时 `origin` 读取只属于非会话概念或当前轮次投递对象。
- 审批请求原生 conversation 查找现在读取类型化的每智能体会话路由行。它不再从 `sessionKey` 解析渠道/群组/线程 conversation 身份；缺少类型化元数据是迁移/修复问题。
- Gateway 网关 session changed/chat/session 事件载荷不再回显 `SessionEntry.origin` 或 `last*` 路由影子；客户端会收到类型化的 `channel`、`chatType` 和 `deliveryContext`。
- Heartbeat 投递解析现在可以直接接收类型化 SQLite `deliveryContext`，并且 Heartbeat 运行时会传递每智能体会话投递行，而不是依赖兼容 `session_entries` 影子获取当前路由。
- Cron 隔离智能体投递目标解析也会先从类型化的每智能体会话投递行填充当前路由，再 fallback 到兼容条目载荷。
- 子智能体公告 origin 解析现在会通过 `loadRequesterSessionEntry` 传递类型化请求方会话投递上下文，并优先使用该行，而不是兼容 `last*`/`deliveryContext` 影子。
- 入站会话元数据更新现在会先与类型化的每智能体投递行合并；旧的 `SessionEntry` 投递字段仅在没有类型化 conversation 行时作为 fallback。
- 重启/更新投递提取现在让类型化 SQLite 投递 `threadId` 优先于从 `sessionKey` 解析出的主题/线程片段；解析仅作为旧版线程形键的 fallback。
- 钩子智能体上下文渠道 ID 现在优先使用类型化 SQLite conversation 身份，其次使用显式消息元数据。它们不再从 `sessionKey` 解析 provider/群组/渠道片段。
- Gateway 网关 `chat.send` 外部路由继承现在读取类型化 SQLite 会话路由元数据，而不是从 `sessionKey` 片段推断渠道/直接/群组作用域。渠道作用域会话仅在类型化会话渠道和聊天类型与存储的投递上下文匹配时继承；共享 main 会话保留更严格的 CLI/无客户端元数据规则。
- 重启 sentinel 唤醒和继续路由现在会在排队 Heartbeat 唤醒或路由智能体轮次继续之前读取类型化 SQLite 投递/路由行。它不再从会话条目 JSON 影子重建投递上下文。
- Gateway 网关 `tools.effective` 上下文解析现在读取类型化 SQLite 投递/路由行，以获得 provider、account、target、thread 和 reply-mode 输入。它不再从过时的 `session_entries.entry_json` origin 影子恢复这些热路由字段。
- 实时语音咨询路由现在从类型化的每智能体 SQLite 会话行解析父级/call 投递。它在选择嵌入式智能体消息路由时不再 fallback 到兼容 `SessionEntry.deliveryContext` 影子。
- ACP spawn Heartbeat relay 和父流路由现在从类型化 SQLite 会话行读取父级投递。它们不再从兼容会话条目影子重建父级投递上下文。
- 会话投递路由保留现在遵循类型化聊天元数据和持久化投递列。它不再从 `sessionKey` 提取渠道提示、直接/main 标记或线程形状；内部 webchat 路由仅在 SQLite 已经拥有该会话的类型化/持久化投递身份时继承外部目标。
- 通用会话投递提取现在只读取精确的类型化 SQLite 会话投递行。它不再解析线程/主题后缀，也不会从线程形键 fallback 到基础会话键。
- 回复分发、重启 sentinel 恢复和实时语音咨询路由现在使用精确的类型化 SQLite 会话/conversation 行进行线程路由。它们不再通过解析线程形会话键来恢复线程 ID 或基础会话投递上下文。
- 内嵌 PI 历史限制现在使用类型化 SQLite 会话路由投影（`sessions` + 主 `conversations`）来获取 provider、聊天类型和对端身份。它不再从 `sessionKey` 解析 provider、私信、群组或线程形状。
- Cron 工具投递推断现在只使用显式投递或当前类型化投递上下文。它不再从 `agentSessionKey` 解码渠道、对端、account 或线程目标。
- 运行时会话行不再携带旧的 `lastProvider` 路由别名。辅助工具和测试使用类型化的 `lastChannel` 和 `deliveryContext` 字段；Doctor 迁移是唯一应该翻译较旧路由别名或持久化 `origin` 影子的位置。
- 转录事件、VFS 行和工具工件行现在写入每智能体数据库。未发布的全局转录文件映射表已移除；Doctor 会改为在持久迁移行中记录旧版来源路径。
- 运行时转录查找不再扫描 JSONL 字节偏移或探测旧版转录文件。Gateway 网关聊天/媒体/历史路径会从 SQLite 读取转录行；会话 JSONL 现在只是旧版 Doctor 输入，而不是运行时状态或导出格式。
- 转录父级和分支关系使用 SQLite 转录头中的结构化 `parentTranscriptScope: {agentId, sessionId}` 元数据，而不是类似路径的 `agent-db:...transcript_events...` 定位字符串。
- 转录管理器契约不再暴露隐式持久化的 `create(cwd)` 或 `continueRecent(cwd)` 构造器。持久化转录管理器使用显式 `{agentId, sessionId}` 作用域打开；只有内存中管理器在测试和纯转录转换中保持无作用域。
- 运行时转录存储 API 解析 SQLite 作用域，而不是文件系统路径。旧的 `resolve...ForPath` 辅助工具和未使用的 `transcriptPath` 写入选项已从运行时调用方中移除。
- 运行时会话解析现在使用 `{agentId, sessionId}`，并且不得为外部边界派生 `sqlite-transcript://<agent>/<session>` 字符串。旧版绝对 JSONL 路径仅作为 Doctor 迁移输入。
- 原生钩子 relay direct-bridge 记录现在位于类型化共享 `native_hook_relay_bridges` 行中，并以 relay ID 为键。运行时不再为这些短生命周期 bridge 记录写入 `/tmp` JSON 注册表或不透明的通用记录。
- `runEmbeddedPiAgent(...)` 不再有转录定位器参数。
  准备好的 worker 描述符也会省略转录定位符。运行时会话
  状态和排队的后续运行携带 `{agentId, sessionId}`，而不是
  派生的转录句柄。
- 嵌入式压缩现在从 `agentId` 和 `sessionId` 获取 SQLite 作用域。
  压缩钩子、context-engine 调用、CLI 委派和协议回复
  都不得接收派生的 `sqlite-transcript://...` 句柄。导出/调试代码
  可以从行中物化显式用户工件，但它不提供
  通用会话 JSONL 导出路径，也不会把文件名反馈到运行时
  身份中。
- `/export-session` 从 SQLite 读取转录行，并且只写入请求的
  独立 HTML 视图。嵌入式查看器不再从这些行重建或
  下载会话 JSONL。
- context-engine 委派不再解析转录定位符来恢复
  智能体身份。准备好的运行时上下文会把已解析的 `agentId`
  传入内置压缩适配器。
- 转录重写和实时工具结果截断现在按 `{agentId, sessionId}`
  读取和持久化转录状态，并且不会为转录更新事件负载
  派生临时定位符。
- 转录状态辅助接口不再包含基于定位符的
  `readTranscriptState`、`replaceTranscriptStateEvents` 或
  `persistTranscriptStateMutation` 变体。运行时调用方必须使用
  `{agentId, sessionId}` API。Doctor 导入会按显式文件路径读取旧文件
  并写入 SQLite 行；它不会迁移定位符字符串。
- 运行时会话管理器契约不再暴露 `open(locator)`、
  `forkFrom(locator)` 或 `setTranscriptLocator(...)`。持久化会话
  管理器只按 `{agentId, sessionId}` 打开；列表/分叉辅助功能位于
  面向行的会话和检查点 API 上，而不是转录管理器
  facade 上。
- Gateway 网关转录读取器 API 以作用域优先。它们接收
  `{agentId, sessionId}`，并且不接受可能意外变成运行时身份的
  位置参数式转录定位符。主动转录定位符解析已移除；旧源路径
  只由 Doctor 导入代码读取。
- 转录更新事件也以作用域优先。`emitSessionTranscriptUpdate`
  不再接受裸定位符字符串，监听器会按 `{agentId, sessionId}`
  路由，而不解析句柄。
- Gateway 网关会话消息广播会从智能体/会话作用域解析会话键，
  而不是从转录定位符解析。旧的转录定位符到会话键
  解析器/缓存已移除。
- Gateway 网关会话历史 SSE 会按智能体/会话作用域筛选实时更新。
  它不再规范化转录定位符候选项、realpath 或文件形态的
  转录身份来决定某个流是否应接收更新。
- 会话生命周期钩子不再在 `session_end` 上派生或暴露转录定位符。
  钩子消费者会获得 `sessionId`、`sessionKey`、下一会话
  id 和智能体上下文；转录文件不是生命周期
  契约的一部分。
- 重置钩子也不再派生或暴露转录定位符。
  `before_reset` 负载携带恢复的 SQLite 消息以及重置
  原因，而会话身份保留在钩子上下文中。
- Agent harness 重置不再接受转录定位符。重置分发按
  `sessionId`/`sessionKey` 加原因确定作用域。
- 智能体扩展会话类型不再暴露 `transcriptLocator`；扩展
  应使用会话上下文和运行时 API，而不是获取
  文件形态的转录身份。
- 插件压缩钩子不再暴露转录定位符。钩子上下文
  已携带会话身份，转录读取必须通过 SQLite
  作用域感知 API，而不是文件形态句柄。
- `before_agent_finalize` 钩子不再暴露 `transcriptPath`，包括
  原生钩子中继负载。最终化钩子只使用会话上下文。
- Gateway 网关重置响应不再在返回的条目上合成转录定位符。
  重置会创建 SQLite 转录行，返回干净的
  会话条目，并把转录访问留给作用域感知读取器。
- 嵌入式运行和压缩结果不再为会话计量暴露转录定位符。
  自动压缩只更新活动的 `sessionId`、
  压缩计数器和 token 元数据。
- 嵌入式尝试结果不再返回 `transcriptLocatorUsed`，并且
  context-engine `compact()` 结果不再返回转录定位符。
  运行时重试循环只接受后继 `sessionId`。
- delivery-mirror 转录追加结果不再返回转录
  定位符。调用方会获得追加的 `messageId`；转录更新信号使用
  SQLite 作用域。
- 父会话分叉辅助功能只返回分叉出的 `sessionId`。子智能体
  准备会把子智能体/会话作用域传给引擎。
- CLI runner 参数和历史重新播种不再接受转录定位符。
  CLI 历史读取会从 `{agentId,
sessionId}` 和会话键上下文解析 SQLite 转录作用域。
- CLI 和嵌入式 runner 测试夹具现在按会话 id 写入种子并读取
  SQLite 转录行，而不是假装活动会话是 `*.jsonl` 文件，或通过
  运行时参数传递 `sqlite-transcript://...` 字符串。
- 会话工具结果守护事件从已知会话作用域发出，即使
  内存管理器没有派生定位符也是如此。它的测试不再伪造活动的
  `/tmp/*.jsonl` 转录文件。
- BTW 和压缩检查点辅助功能现在按 SQLite 作用域读取和分叉转录行。
  检查点元数据现在只存储会话 id 和 leaf/entry id；
  派生定位符不再写入检查点负载。
- Gateway 网关转录键查找在协议边界使用 SQLite 转录作用域，
  并且不再对转录文件名执行 realpath 或 stat。
- 自动压缩转录轮换会直接通过 SQLite 转录存储写入后继
  转录行。会话行只保留后继会话身份，
  不保留持久 JSONL 路径或持久化定位符。
- 嵌入式 context-engine 压缩使用 SQLite 命名的转录轮换
  辅助功能。轮换测试不再构造 JSONL 后继路径，也不再把
  活动会话建模为文件。
- 托管出站图片保留会从 SQLite 转录统计信息为其
  转录消息缓存设置键，而不是调用文件系统 stat。
- 运行时会话锁和独立旧版 `.jsonl.lock` Doctor
  通道已移除。
- Microsoft Teams 运行时 barrel 和公共插件 SDK 不再重新导出
  旧文件锁辅助功能；持久插件状态路径由 SQLite 支撑。
- 会话年龄/数量剪枝和显式会话清理已移除。
  Doctor 拥有旧版导入；过期会话会被显式重置或删除。
- Doctor 完整性检查不再把旧版 JSONL 文件计为 SQLite 会话行的
  有效活动转录。活动转录健康状态仅基于 SQLite；
  旧版 JSONL 文件会报告为迁移/孤儿清理输入。
- Doctor 不再把 `agents/<agent>/sessions/` 视为必需的运行时
  状态。只有当该目录已存在时，它才会扫描该目录，作为旧版导入
  或孤儿清理输入。
- Gateway 网关 `sessions.resolve`、会话 patch/reset/compact 路径、子智能体
  生成、快速中止、ACP 元数据、Heartbeat 隔离会话和 TUI
  patching 不再把迁移或剪枝旧版会话键作为正常运行时工作的副作用。
- CLI 命令会话解析现在返回所属的 `agentId`，而不是
  `storePath`，并且它不再在正常
  `--to` 或 `--session-id` 解析期间复制旧版主会话行。旧版主行规范化
  只属于 Doctor。
- 运行时子智能体深度解析不再读取 `sessions.json` 或 JSON5
  会话存储。它会按智能体 id 读取 SQLite `session_entries`，旧版
  深度/会话元数据只能通过 Doctor 导入路径进入。
- 凭证配置文件会话覆盖会通过直接 `{agentId, sessionKey}`
  行 upsert 持久化，而不是延迟加载文件形态的会话存储运行时。
- 自动回复详细日志门控和会话更新辅助功能现在按会话身份读取/upsert
  SQLite 会话行，并且在触碰持久化行状态前不再需要旧版存储路径。
- 命令运行会话元数据辅助功能现在使用面向 entry 的名称和模块
  路径；旧的 `session-store` 命令辅助接口已移除。
- Bootstrap 头部写入种子和手动压缩边界加固现在直接修改
  SQLite 转录行。运行时调用方传递会话身份，而不是
  可写的 `.jsonl` 路径。
- 静默会话轮换重放会按 `{agentId, sessionId}` 从 SQLite
  转录行复制最近的用户/助手轮次。它不再接受
  源或目标转录定位符。
- 新运行时会话行不再存储转录定位符。调用方直接使用
  `{agentId, sessionId}`；导出/调试命令可以在物化行时选择
  输出文件名。
- 启动新的持久化转录会话现在始终按作用域打开 SQLite 行。
  会话管理器不再把以前文件时代的转录路径或定位符
  复用为新会话的身份。
- 持久化转录会话使用显式
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API。旧的
  静态 `SessionManager.create/openForSession/list/forkFromSession` facade 已
  移除，因此测试和运行时代码无法意外重建文件时代会话
  发现。
- 插件运行时不再暴露 `api.runtime.agent.session.resolveTranscriptLocatorPath`；
  插件代码使用 SQLite 行辅助功能和作用域值。
- 公共 `session-store-runtime` SDK 接口现在只导出会话行
  和转录行辅助功能。聚焦的 SQLite schema/path/transaction 辅助功能
  位于 `sqlite-runtime`；原始 open/close/reset 辅助功能仍仅在本地供
  第一方测试使用。
- 旧版 `.jsonl` 轨迹/检查点文件名分类器现在位于
  Doctor 旧版会话文件模块中。核心会话验证不再导入
  文件工件辅助功能来决定正常 SQLite 会话 id。
- 主动记忆阻塞式子智能体运行使用 SQLite 转录行，而不是
  在插件状态下创建临时或持久化的 `session.jsonl` 文件。旧的
  `transcriptDir` 选项已移除。
- 一次性 slug 生成和 Crestodian planner 运行使用 SQLite 转录行，
  而不是创建临时 `session.jsonl` 文件。
- `llm-task` 辅助运行和隐藏承诺提取也使用 SQLite
  转录行，因此这些仅模型辅助会话不再创建
  临时 JSON/JSONL 转录文件。
- `TranscriptSessionManager` 现在只是一个已打开的 SQLite 转录作用域。
  运行时代码通过 `openTranscriptSessionManagerForSession({agentId,
sessionId})` 打开它；创建、分支、继续、列表和分叉流程位于其
  所属的 SQLite 行辅助功能中，而不是静态管理器 facade 中。
  Doctor/导入/调试代码会在运行时会话管理器之外处理显式旧版源文件。
- 过时的 `SessionManager.newSession()` 和
  `SessionManager.createBranchedSession()` facade 方法已移除。新
  会话和转录后代由其所属的 SQLite
  工作流创建，而不是把已打开的管理器修改为不同的
  持久化会话。
- 父转录分叉决策和分叉创建不再接受
  `storePath` 或 `sessionsDir`；它们使用 `{agentId, sessionId}` SQLite
  转录作用域，而不是保留的文件系统路径元数据。
- memory-host 不再导出无操作的会话目录转录
  分类辅助功能；转录筛选现在在 entry 构建期间从 SQLite 行
  元数据派生。
- memory-host 和 QMD 会话导出测试使用 SQLite 转录作用域。旧的
  `agents/<agentId>/sessions/*.jsonl` 路径只在测试有意证明
  Doctor/导入/导出兼容性时保留覆盖。
- QA-lab 原始会话检查现在通过 Gateway 网关使用 `sessions.list`
  而不是读取 `agents/qa/sessions/sessions.json`；MSteams 反馈会直接追加到 SQLite 转录中，而不会伪造 JSONL 路径。
- 共享入站渠道轮次现在携带 `{agentId, sessionKey}`，而不是旧版 `storePath`。LINE、WhatsApp、Slack、Discord、Telegram、Matrix、Signal、iMessage、BlueBubbles、Feishu、Google Chat、IRC、Nextcloud Talk、Zalo、Zalo Personal、QA Channel、Microsoft Teams、Mattermost、Synology Chat、Tlon、Twitch 和 QQ Bot 录制路径现在读取 updated-at 元数据，并通过 SQLite 身份记录入站会话行。
- 转录定位器持久化已从活动会话行中移除。`resolveSessionTranscriptTarget` 返回 `agentId`、`sessionId` 和可选主题元数据；Doctor 是唯一导入旧版转录文件名的代码。
- 运行时转录头从 SQLite 版本 `1` 开始。旧 JSONL V1/V2/V3 形状升级仅存在于 Doctor 导入中，并在存储行之前将导入的头规范化为当前 SQLite 转录版本。
- 数据库优先保护现在禁止 `SessionManager.listAll` 和 `SessionManager.forkFromSession`；会话列表和 fork/restore 工作流必须停留在基于行/作用域的 SQLite API 上。
- 该保护还禁止 Doctor/导入代码之外的旧版转录 JSONL 解析/活动分支修复辅助函数名称，因此运行时不能再增长第二条旧版转录迁移路径。
- 嵌入式 PI 运行会拒绝传入的转录句柄。它们在 worker 启动前使用 SQLite `{agentId, sessionId}` 身份，并在尝试触及转录状态前再次使用该身份。过期的 `/tmp/*.jsonl` 输入无法选择运行时写入目标。
- 缓存跟踪、Anthropic 负载、原始流和诊断时间线记录现在写入带类型的 SQLite `diagnostic_events` 行。Gateway 网关稳定性包现在写入带类型的 SQLite `diagnostic_stability_bundles` 行。旧的 `diagnostics.cacheTrace.filePath`、`OPENCLAW_CACHE_TRACE_FILE`、`OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` 和 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL 覆盖路径已移除，常规稳定性捕获不再写入 `logs/stability/*.json` 文件。
- Cron 持久化现在会调和 SQLite `cron_jobs` 行，而不是在每次保存时删除并重新插入整个任务表。插件目标写回会直接更新匹配的 cron 行，并将运行时 cron 状态保持在同一个状态数据库事务中。
- Cron 运行时调用方现在使用稳定的 SQLite cron 存储键。旧版 `cron.store` 路径仅作为 Doctor 导入输入；生产 Gateway 网关、任务维护、状态、运行日志和 Telegram 目标写回路径使用 `resolveCronStoreKey`，并且不再对该键进行路径规范化。Cron 状态现在报告 `storeKey`，而不是旧的文件形状 `storePath` 字段。
- Cron 运行时加载和调度不再规范化旧版持久化任务形状，例如 `jobId`、`schedule.cron`、数字型 `atMs`、字符串布尔值或缺失的 `sessionTarget`。Doctor 旧版导入在将行插入 SQLite 之前负责这些修复。
- ACP spawn 不再解析或持久化转录 JSONL 文件路径。Spawn 和 thread-bind 设置会直接持久化 SQLite 会话行，并将会话 id 保留为转录身份。
- ACP 会话元数据 API 现在按 `agentId` 读取/列出/upsert SQLite 行，并且不再将 `storePath` 作为 ACP 会话条目契约的一部分暴露。
- 会话使用量统计和 Gateway 网关使用量聚合现在仅通过 `{agentId, sessionId}` 解析转录。成本/使用量缓存和发现的会话摘要不再合成或返回转录定位器字符串。
- Gateway 网关聊天追加、中止部分持久化、`/sessions.send` 和 webchat 媒体转录写入会直接通过 SQLite 转录作用域追加。Gateway 网关转录注入辅助函数不再接受 `transcriptLocator` 参数。
- SQLite 转录发现现在只列出转录作用域和统计信息：`{agentId, sessionId, updatedAt, eventCount}`。已废弃的 `listSqliteSessionTranscriptLocators` 兼容辅助函数和逐行 `locator` 字段已移除。
- 转录修复运行时现在仅暴露 `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`。旧的基于定位器的修复辅助函数已删除；Doctor/debug 代码读取显式源文件路径，并且永不迁移定位器字符串。
- ACP replay ledger 运行时现在将每个会话的 replay 行存储在共享 SQLite 状态数据库中，而不是 `acp/event-ledger.json`；Doctor 会导入并移除旧版文件。
- Gateway 网关转录读取器辅助函数现在位于 `src/gateway/session-transcript-readers.ts`，而不是旧的 `session-utils.fs` 模块名称。fallback 重试历史检查现在按 SQLite 转录内容命名，而不是按旧文件辅助函数表面命名。
- Gateway 网关注入聊天和压缩辅助函数现在通过内部辅助 API 传递 SQLite 转录作用域，而不是将值命名为转录路径或源文件。
- Bootstrap 延续检测现在通过 `hasCompletedBootstrapTranscriptTurn` 检查 SQLite 转录行；它不再暴露文件形状的辅助函数名称。
- 嵌入式 runner 测试现在使用 SQLite 转录身份，并且打开新的转录管理器始终需要显式 `sessionId`。
- 记忆索引辅助函数现在端到端使用 SQLite 转录术语：host 导出 `listSessionTranscriptScopesForAgent` 和 `sessionTranscriptKeyForScope`，定向同步队列使用 `sessionTranscripts`，公共会话搜索命中暴露不透明的 `transcript:<agent>:<session>` 路径，内部数据库源键是在 `source_kind='sessions'` 下的 `session:<session>`，而不是伪文件路径。
- 通用插件 SDK 持久去重辅助函数不再暴露文件形状选项。调用方提供 SQLite 作用域键，持久去重行存放在共享插件状态中。
- Microsoft Teams SSO 令牌已从锁定的 JSON 文件迁移到 SQLite 插件状态。Doctor 导入 `msteams-sso-tokens.json`，从负载重建规范 SSO 令牌键，并移除源文件。委托 OAuth 令牌保留在其现有的私有凭证文件边界上。
- Matrix 同步缓存状态已从 `bot-storage.json` 迁移到 SQLite 插件状态。Doctor 导入旧版原始或包装同步负载，并移除源文件。活动 Matrix 和 QA Matrix 客户端会传递 SQLite 同步存储根目录，而不是伪造的 `sync-store.json` 或 `bot-storage.json` 路径。
- Matrix 旧版加密迁移状态已从 `legacy-crypto-migration.json` 迁移到 SQLite 插件状态。Doctor 导入旧状态文件；Matrix SDK IndexedDB 快照已从 `crypto-idb-snapshot.json` 迁移到 SQLite 插件 blob。Matrix 恢复密钥和凭证是 SQLite 插件状态行；它们的旧 JSON 文件仅作为 Doctor 迁移输入。
- Memory Wiki 活动日志现在使用 SQLite 插件状态，而不是 `.openclaw-wiki/log.jsonl`。Memory Wiki 迁移提供商导入旧 JSONL 日志；wiki Markdown 和用户 vault 内容仍作为工作区内容由文件后端支持。
- Memory Wiki 不再创建 `.openclaw-wiki/state.json` 或未使用的 `.openclaw-wiki/locks` 目录。如果较旧的 vault 仍有这些已退役的插件元数据文件，迁移提供商会移除它们。
- Crestodian 审计条目现在使用核心 SQLite 插件状态，而不是 `audit/crestodian.jsonl`。Doctor 导入旧版 JSONL 审计日志，并在成功导入后移除它。
- 配置写入/观察审计条目现在使用核心 SQLite 插件状态，而不是 `logs/config-audit.jsonl`。Doctor 导入旧版 JSONL 审计日志，并在成功导入后移除它。
- macOS 配套应用在编辑 `openclaw.json` 时不再写入应用本地的 `logs/config-audit.jsonl` 或 `logs/config-health.json` sidecar。配置文件仍由文件后端支持，恢复快照仍放在配置文件旁边，持久配置审计/健康状态属于 Gateway 网关 SQLite 存储。
- Crestodian rescue 待审批项现在使用核心 SQLite 插件状态，而不是 `crestodian/rescue-pending/*.json`。Doctor 导入旧版待审批文件，并在成功导入后移除它们。
- Phone Control 临时 arm 状态现在使用 SQLite 插件状态，而不是 `plugins/phone-control/armed.json`。Doctor 将旧版 armed-state 文件导入 `phone-control/arm-state` 命名空间并移除该文件。
- Doctor 不再原地修复 JSONL 转录，也不再创建备份 JSONL 文件。它将活动分支导入 SQLite 并移除旧版源。
- session-memory 钩子转录查找使用 `{agentId, sessionId}` 仅作用域 SQLite 读取。其辅助函数不再接受或派生转录定位器、旧版文件读取或文件重写选项。
- Codex app-server 对话绑定现在按 OpenClaw 会话键或显式 `{agentId, sessionId}` 作用域为 SQLite 插件状态设键。它们不得保留转录路径 fallback 绑定。
- Codex app-server mirrored-history 读取仅使用 SQLite 转录作用域；它们不得从转录文件路径恢复身份。
- 角色排序和压缩重置路径不再 unlink 旧转录文件；重置只轮换 SQLite 会话行和转录身份。
- Gateway 网关重置和 checkpoint 响应返回干净的会话行加会话 id。它们不再为客户端合成 SQLite 转录定位器。
- memory-core dreaming 不再通过探测缺失的 JSONL 文件来裁剪会话行。子智能体清理通过会话运行时 API 执行，而不是通过文件系统存在性检查。其转录摄取测试会直接种子 SQLite 行，而不是创建 `agents/<id>/sessions` fixture 或定位器占位符。
- 记忆转录索引可以将 `transcript:<agentId>:<sessionId>` 暴露为用于引用/读取辅助函数的虚拟搜索命中路径。持久索引源是关系型的（`source_kind='sessions'`、`source_key='session:<sessionId>'`、`session_id=<sessionId>`），因此该值不是运行时转录定位器，不是文件系统路径，并且绝不能传回会话运行时 API。
- Gateway 网关 Doctor 记忆状态从 SQLite 插件状态行读取短期回忆和 phase-signal 计数，而不是从 `memory/.dreams/*.json` 读取；CLI 和 Doctor 输出现在将该存储标记为 SQLite 存储，而不是路径。
- memory-core 运行时、CLI 状态、Gateway 网关 Doctor 方法和插件 SDK facade 不再审计或归档旧版 `.dreams/session-corpus` 文件。这些文件仅作为迁移输入；Doctor 会将它们导入 SQLite，并在验证后删除源。活动会话摄取证据行现在使用虚拟 SQLite 路径 `memory/session-ingestion/<day>.txt`；运行时永不从 `.dreams/session-corpus` 写入或派生状态。
- memory-core 公共工件将 SQLite host 事件暴露为虚拟 JSON 工件 `memory/events/memory-host-events.json`；它们不再复用旧版 `.dreams/events.jsonl` 源路径。
- 沙箱容器/浏览器注册表现在使用共享的 `sandbox_registry_entries` SQLite 表，其中包含带类型的会话、镜像、时间戳、后端/配置和浏览器端口列。Doctor 导入旧版单体和分片 JSON 注册表文件，并移除成功导入的源。运行时读取使用带类型的行列作为事实来源；`entry_json` 只是 replay/debug 副本。
- 跟进承诺现在使用带类型的共享 `commitments` 表，而不是整库 JSON blob。快照保存会按 commitment id upsert，并且只删除缺失的行，而不是清空并重新插入表。运行时从带类型的作用域、投递窗口、状态、尝试次数和文本列加载跟进承诺；`record_json` 只是 replay/debug 副本。Doctor 导入旧版 `commitments.json`，并在成功导入后移除它。
- Cron 任务定义、调度状态和运行历史不再有运行时 JSON 写入器或读取器。运行时使用带类型 schedule 的 `cron_jobs` 行，
  payload、delivery、failure-alert、session、status 和 runtime-state 列，以及用于状态、诊断摘要、投递状态/错误、会话/运行、模型和 token 总数的类型化 `cron_run_logs` 元数据。`job_json` 只是重放/调试副本；`state_json` 保留尚没有热查询字段的嵌套运行时诊断，而运行时会从类型化列重新水合热状态字段。Doctor 会导入旧版 `jobs.json`、`jobs-state.json` 和 `runs/*.jsonl` 文件，并移除已导入的源文件。插件目标回写会更新匹配的 `cron_jobs` 行，而不是加载并替换整个 cron 存储。
- Gateway 网关启动会忽略运行时投影中的旧版 `notify: true` 标记。当 `cron.webhook` 有效时，Doctor 会把它们转换为显式 SQLite 投递；未设置时会移除无效标记；配置的 webhook 无效时会保留它们并发出警告。
- 出站和会话投递队列现在会在共享 `delivery_queue_entries` 表中，将队列状态、条目类型、会话键、渠道、目标、账号 ID、重试次数、上次尝试/错误、恢复状态和平台发送标记存为类型化列。运行时恢复会从类型化列读取这些热字段，重试/恢复变更也会直接更新这些列，而不重写重放 JSON。完整 JSON 载荷仅作为消息正文和其他冷重放数据的重放/调试 blob 保留。
- 托管的出站图片记录现在使用类型化共享 `managed_outgoing_image_records` 行，媒体字节仍存储在 `media_blobs` 中。JSON 记录仅作为重放/调试副本保留。
- Discord 模型选择器偏好、命令部署哈希和线程绑定现在使用共享 SQLite 插件状态。它们的旧版 JSON 导入计划位于 Discord 插件设置/Doctor 迁移表面，而不是核心迁移代码中。
- 插件旧版导入检测器使用 Doctor 命名的模块，例如 `doctor-legacy-state.ts` 或 `doctor-state-imports.ts`；普通渠道运行时模块不得导入旧版 JSON 检测器。
- BlueBubbles 补拉游标和入站去重标记现在使用共享 SQLite 插件状态。它们的旧版 JSON 导入计划位于 BlueBubbles 插件设置/Doctor 迁移表面，而不是核心迁移代码中。
- Telegram 更新偏移量、贴纸缓存行、已发送消息缓存行、主题名称缓存行和线程绑定现在使用共享 SQLite 插件状态。它们的旧版 JSON 导入计划位于 Telegram 插件设置/Doctor 迁移表面，而不是核心迁移代码中。
- iMessage 补拉游标、回复短 ID 映射和已发送回显去重行现在使用共享 SQLite 插件状态。旧的 `imessage/catchup/*.json`、`imessage/reply-cache.jsonl` 和 `imessage/sent-echoes.jsonl` 文件仅作为 Doctor 输入。
- Feishu 消息去重行现在使用共享 SQLite 插件状态，而不是 `feishu/dedup/*.json` 文件。它的旧版 JSON 导入计划位于 Feishu 插件设置/Doctor 迁移表面，而不是核心迁移代码中。
- Microsoft Teams 会话、投票、待上传缓冲区和反馈学习现在使用共享 SQLite 插件状态/blob 表。待上传路径使用 `plugin_blob_entries`，因此媒体缓冲区会存储为 SQLite BLOB，而不是 base64 JSON。运行时辅助函数名称现在使用 SQLite/状态命名，而不是 `*-fs` 文件存储命名，并且旧的 `storePath` shim 已从这些存储中移除。它的旧版 JSON 导入计划位于 Microsoft Teams 插件设置/Doctor 迁移表面。
- Zalo 托管的出站媒体现在使用共享 SQLite `plugin_blob_entries`，而不是 `openclaw-zalo-outbound-media` JSON/bin 临时 sidecar。
- Diffs 查看器 HTML 和元数据现在使用共享 SQLite `plugin_blob_entries`，而不是 `meta.json`/`viewer.html` 临时文件。渲染后的 PNG/PDF 输出仍保留为临时物化结果，因为渠道投递仍需要文件路径。
- Canvas 托管文档现在使用共享 SQLite `plugin_blob_entries`，而不是默认的 `state/canvas/documents` 目录。Canvas host 会直接提供这些 blob；只有显式 `host.root` 操作员内容，或下游媒体读取器需要路径时的临时物化，才会创建本地文件。
- File Transfer 审计决策现在使用共享 SQLite `plugin_state_entries`，而不是无界的 `audit/file-transfer.jsonl` 运行时日志。Doctor 会将旧版 JSONL 审计文件导入插件状态，并在干净导入后移除源文件。
- ACPX 进程租约和 Gateway 网关实例身份现在使用共享 SQLite 插件状态。Doctor 会将旧版 `gateway-instance-id` 文件导入插件状态，并移除源文件。
- ACPX 生成的包装脚本和隔离的 Codex home 是 OpenClaw 临时根目录下的临时物化结果，而不是持久 OpenClaw 状态。持久 ACPX 运行时记录是 SQLite 租约和 Gateway 网关实例行；旧的 ACPX `stateDir` 配置表面已移除，因为不再有运行时状态写入那里。
- Gateway 网关媒体附件现在使用共享 `media_blobs` SQLite 表作为规范字节存储。返回给渠道和沙箱兼容表面的本地路径是数据库行的临时物化结果，而不是持久媒体存储。运行时媒体 allowlist 不再包含旧版 `$OPENCLAW_STATE_DIR/media` 或配置目录 `media` 根；这些目录仅作为 Doctor 导入源。
- Shell completion 不再写入 `$OPENCLAW_STATE_DIR/completions/*` 缓存文件。安装、Doctor、更新和发布冒烟路径会使用生成的 completion 输出或 profile sourcing，而不是持久 completion 缓存文件。
- Gateway 网关 skill-upload 暂存现在使用共享 `skill_uploads` 行。上传元数据、幂等键和归档字节都位于 SQLite 中；安装运行期间，安装器只会收到临时物化的归档路径。
- 子智能体内联附件不再物化到工作区 `.openclaw/attachments/*` 下。spawn 路径会准备 SQLite VFS 种子条目，内联运行会把这些条目种入每个 Agent 运行时 scratch 命名空间，磁盘支持的工具会为附件路径叠加该 SQLite scratch。旧的子智能体运行附件目录注册表列和清理钩子已移除。
- CLI 图片水合不再维护稳定的 `openclaw-cli-images` 缓存文件。外部 CLI 后端仍会接收文件路径，但这些路径是按运行生成并带清理的临时物化结果。
- Cache-trace 诊断、Anthropic 载荷诊断、原始模型流诊断、诊断时间线事件和 Gateway 网关稳定性 bundle 现在写入 SQLite 行，而不是 `logs/*.jsonl` 或 `logs/stability/*.json` 文件。运行时路径覆盖标志和环境变量已移除；导出/调试命令可以从数据库行显式物化文件。
- macOS 配套应用不再有滚动的 `diagnostics.jsonl` 写入器。应用日志进入统一日志，持久 Gateway 网关诊断保持由 SQLite 支持。
- macOS port-guardian 记录列表现在使用类型化共享 SQLite `macos_port_guardian_records` 行，而不是 Application Support JSON 文件或不透明单例 blob。
- Gateway 网关单例锁现在使用 `gateway_locks` 作用域下的类型化共享 SQLite `state_leases` 行，而不是临时目录锁文件。Fly 和 OAuth 故障排除文档现在指向 SQLite 租约/auth 刷新锁，而不是过时的文件锁清理。
- Gateway 网关重启哨兵状态现在使用类型化共享 SQLite `gateway_restart_sentinel` 行，而不是 `restart-sentinel.json`；运行时会从类型化列读取哨兵类型、状态、路由、消息、继续执行和统计信息。`payload_json` 只是重放/调试副本。运行时代码会直接清除 SQLite 行，不再携带文件清理管线。
- Gateway 网关重启意图和 supervisor handoff 状态现在使用类型化共享 SQLite `gateway_restart_intent` 和 `gateway_restart_handoff` 行，而不是 `gateway-restart-intent.json` 和 `gateway-supervisor-restart-handoff.json` sidecar。
- Gateway 网关单例协调现在使用 `gateway_locks` 下的类型化 `state_leases` 行，而不是写入 `gateway.<hash>.lock` 文件。租约行拥有锁所有者、过期时间、heartbeat 和调试载荷；SQLite 拥有原子获取/释放边界。已退役的文件锁目录选项已移除；测试会直接使用 SQLite 行身份。
- 旧的未引用 cron 用量报告辅助函数已删除，它过去会扫描 `cron/runs/*.jsonl` 文件。Cron 运行历史报告应读取类型化 `cron_run_logs` SQLite 行。
- 主会话重启恢复现在通过 SQLite `agent_databases` 注册表发现候选 Agent，而不是扫描 `agents/*/sessions` 目录。
- Gemini 会话损坏恢复现在只删除 SQLite 会话行；它不再需要旧版 `storePath` 门控，也不会尝试 unlink 派生的 transcript JSONL 路径。
- 路径覆盖处理现在会把字面量 `undefined`/`null` 环境值视为未设置，防止在测试或 shell handoff 期间意外创建仓库根目录下的 `undefined/state/*.sqlite` 数据库。
- 配置健康指纹现在使用类型化共享 SQLite `config_health_entries` 行，而不是 `logs/config-health.json`，使普通配置文件成为唯一的非凭证配置文档。macOS 配套应用只保留进程本地健康状态，不会重新创建旧的 JSON sidecar。
- 凭证 profile 运行时不再导入或写入凭证 JSON 文件。规范凭证存储是 SQLite；`auth-profiles.json`、每个 Agent 的 `auth.json` 和共享 `credentials/oauth.json` 是 Doctor 迁移输入，导入后会被移除。
- 凭证 profile 保存/状态测试现在会直接断言类型化 SQLite auth 表，并且只把旧版 auth-profile 文件名用于 Doctor 迁移输入。
- `openclaw secrets apply` 只会清理配置文件、env 文件和 SQLite auth-profile 存储。它不再携带编辑已退役的每个 Agent `auth.json` 的兼容逻辑；Doctor 负责导入和删除该文件。
- Hermes secret 迁移计划和应用会把导入的 API-key profile 直接写入 SQLite auth-profile 存储。它不再把 `auth-profiles.json` 作为中间目标写入或校验。
- 面向用户的 auth 文档现在描述 `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`，而不是让用户检查或复制 `auth-profiles.json`；旧版 OAuth/auth JSON 名称仅作为 Doctor 导入输入保留在文档中。
- 核心状态路径辅助函数不再暴露已退役的 `credentials/oauth.json` 文件。旧版文件名只局限于 Doctor auth 导入路径。
- 安装、安全、新手引导、模型 auth 和 SecretRef 文档现在描述 SQLite auth-profile 行以及整体状态备份/迁移，而不是每个 Agent 的 auth-profile JSON 文件。
- PI 模型发现现在会把规范凭证传入内存中的 `pi-coding-agent` auth 存储。它在发现期间不再创建、清理或写入每个 Agent 的 `auth.json`。
- Voice Wake 触发器和路由设置现在使用类型化共享 SQLite 表，而不是 `settings/voicewake.json`、`settings/voicewake-routing.json` 或不透明通用行；Doctor 会导入旧版 JSON 文件，并在成功迁移后移除它们。
- 更新检查状态现在使用类型化共享 `update_check_state` 行，而不是 `update-check.json` 或不透明通用 blob；Doctor 会导入旧版 JSON 文件，并在成功迁移后移除它。
- 配置健康状态现在使用类型化共享 `config_health_entries` 行，而不是 `logs/config-health.json` 或不透明通用 blob；Doctor 会导入旧版 JSON 文件，并在成功迁移后移除它。
- 插件会话绑定审批现在使用类型化 `plugin_binding_approvals` 行，而不是不透明共享 SQLite 状态或
  `plugin-binding-approvals.json`；旧文件是 Doctor 迁移输入。
- 通用当前会话绑定现在存储类型化的
  `current_conversation_bindings` 行，而不是重写
  `bindings/current-conversations.json`；Doctor 会导入旧版 JSON 文件，并在成功迁移后
  将其删除。
- Memory Wiki 导入源同步账本现在按每个 vault/source 键存储一行 SQLite 插件状态，
  而不是重写 `.openclaw-wiki/source-sync.json`；
  迁移提供商会导入并移除旧版 JSON 账本。
- Memory Wiki ChatGPT 导入运行记录现在按每个 vault/run id 存储一行 SQLite 插件状态，
  而不是写入 `.openclaw-wiki/import-runs/*.json`。
  回滚快照会继续作为显式 vault 文件保留，直到导入运行快照
  归档被迁移到 blob 存储。
- Memory Wiki 编译摘要现在存储 SQLite 插件 blob 行，而不是
  写入 `.openclaw-wiki/cache/agent-digest.json` 和
  `.openclaw-wiki/cache/claims.jsonl`。迁移提供商会导入旧缓存
  文件，并在缓存目录为空时将其删除。
- ClawHub 技能安装跟踪现在按每个
  workspace/skill 存储一行 SQLite 插件状态，而不是在运行时写入或读取 `.clawhub/lock.json` 和
  `.clawhub/origin.json` sidecar。运行时代码使用跟踪安装
  状态对象，而不是文件形态的 lockfile/origin 抽象。Doctor
  会从已配置的 Agent 工作区导入旧版 sidecar，并在干净导入后将其删除。
- 已安装插件索引现在读取和写入类型化的共享 SQLite
  `installed_plugin_index` 单例行，而不是 `plugins/installs.json`；旧版
  JSON 文件只是 Doctor 迁移输入，并会在导入后删除。
- 旧版 `plugins/installs.json` 路径 helper 现在位于 Doctor 旧版
  代码中。运行时插件索引模块只公开 SQLite 支持的持久化
  选项，而不是 JSON 文件路径。
- Gateway 网关重启哨兵、重启意图和 supervisor handoff 状态现在使用
  类型化的共享 SQLite 行（`gateway_restart_sentinel`、
  `gateway_restart_intent` 和 `gateway_restart_handoff`），而不是通用
  不透明 blob。运行时重启代码没有文件形态的 sentinel/intent/handoff
  契约。
- Matrix 同步缓存、存储元数据、线程绑定、入站去重标记、
  启动验证冷却状态、SDK IndexedDB 加密快照、
  凭据和恢复密钥现在使用共享 SQLite 插件状态/blob
  表。运行时路径结构不再公开 `storage-meta.json` 元数据
  路径；该文件名只是旧版迁移输入。它们的旧版 JSON 导入
  计划位于 Matrix 插件设置/Doctor 迁移表面。
- Matrix 启动不再扫描、报告或完成旧版 Matrix 文件
  状态。Matrix 文件检测、旧版加密快照创建、room-key
  恢复迁移状态、导入和源移除都由 Doctor 拥有。
- Matrix 运行时迁移 barrel 已被移除。旧版状态/加密检测
  和变更 helper 由 Matrix Doctor 直接导入，而不是
  运行时 API 表面的一部分。
- Matrix 迁移快照复用标记现在位于 SQLite 插件状态中，
  而不是 `matrix/migration-snapshot.json`；Doctor 仍然可以复用同一个
  已验证的迁移前归档，而无需写入 sidecar 状态文件。
- Nostr bus 游标和 profile 发布状态现在使用共享 SQLite 插件
  状态。它们的旧版 JSON 导入计划位于 Nostr 插件设置/Doctor
  迁移表面。
- Active Memory 会话开关现在使用共享 SQLite 插件状态，而不是
  `session-toggles.json`；重新开启记忆会删除该行，而不是
  重写 JSON 对象。
- Skill Workshop 提案和 review 计数器现在使用共享 SQLite 插件
  状态，而不是按工作区的 `skill-workshop/<workspace>.json` 存储。每个
  提案都是 `skill-workshop/proposals` 下的单独行，review
  计数器是 `skill-workshop/reviews` 下的单独行。
- Skill Workshop reviewer 子智能体运行现在使用运行时会话 transcript
  解析器，而不是创建 `skill-workshop/<sessionId>.json` sidecar 会话
  路径。
- ACPX 进程租约现在使用 `acpx/process-leases` 下的共享 SQLite 插件状态，
  而不是整个文件的 `process-leases.json` registry。
  每个租约都作为自己的行存储，保留启动时清理陈旧进程的能力，
  同时不再有运行时 JSON 重写路径。
- ACPX wrapper 脚本和隔离的 Codex home 会在
  OpenClaw 临时根目录中生成。它们会按需重新创建，并且不是备份或
  迁移输入。
- 子智能体运行 registry 持久化使用类型化共享 `subagent_runs` 行。旧的
  `subagents/runs.json` 路径现在只是 Doctor 迁移输入，
  运行时 helper 名称也不再将状态层描述为磁盘支持。
  运行时测试不再创建无效或空的 `runs.json` fixture 来证明
  registry 行为；它们会直接 seed/read SQLite 行。
- 备份会在归档前暂存状态目录，复制非数据库文件，
  使用 `VACUUM INTO` 快照 `*.sqlite` 数据库，省略实时 WAL/SHM
  sidecar，在归档 manifest 中记录快照元数据，并将
  已完成的备份运行连同归档 manifest 一起记录到 SQLite 中。`openclaw backup
create` 默认验证写出的归档；`--no-verify` 是
  显式快速路径。
- `openclaw backup restore` 会在提取前验证归档，复用
  verifier 的规范化 manifest，并将已验证的 manifest 资产恢复到其
  记录的源路径。写入需要 `--yes`，并支持用 `--dry-run`
  生成恢复计划。
- 旧的备份易变路径过滤器已删除。备份不再需要用于
  旧版会话或 cron JSON/JSONL 文件的实时 tar 跳过列表，因为 SQLite
  快照会在创建归档前暂存。
- 普通设置和新手引导工作区准备不再创建
  `agents/<agentId>/sessions/` 目录。它们只创建配置/工作区；
  SQLite 会话行和 transcript 行会按需在
  每个 Agent 的数据库中创建。
- 安全权限修复现在面向全局和每 Agent 的 SQLite
  数据库以及 WAL/SHM sidecar，而不是 `sessions.json` 和 transcript
  JSONL 文件。
- 沙箱 registry 运行时名称现在直接描述 SQLite registry 类型，
  而不是在活动存储中继续携带旧版 JSON registry 术语。
- `openclaw reset --scope config+creds+sessions` 会移除每个 Agent 的
  `openclaw-agent.sqlite` 数据库以及 WAL/SHM sidecar，而不只是旧版
  `sessions/` 目录。
- Gateway 网关聚合会话 helper 现在使用面向 entry 的名称：
  `loadCombinedSessionEntriesForGateway` 返回 `{ databasePath, entries }`。
  旧的 combined-store 命名已从运行时调用方中移除。
- Docker MCP 渠道 seed 现在会将主会话行和 transcript
  事件写入每个 Agent 的 SQLite 数据库，而不是创建
  `sessions.json` 和 JSONL transcript。
- 内置的 session-memory 钩子现在按 `{agentId, sessionId}` 从
  SQLite 解析 previous-session 上下文。它不再扫描、存储或合成
  transcript 路径或 `workspace/sessions` 目录。
- 内置的 command-logger 钩子现在将命令审计行写入共享
  SQLite `command_log_entries` 表，而不是追加到
  `logs/commands.log`。
- 渠道配对 allowlist 现在只在运行时和插件 SDK 中公开 SQLite 支持的读写 helper。
  旧的 `*-allowFrom.json` 路径解析器和
  文件读取器只存在于 Doctor 旧版导入代码下。
- `migration_runs` 会记录旧版状态迁移执行及其状态、
  时间戳和 JSON 报告。
- `migration_sources` 会记录每个导入的旧版文件源，包括哈希、大小、
  记录数、目标表、运行 id、状态和源移除状态。
- `backup_runs` 会记录备份归档路径、状态和 JSON manifest。
- 全局 schema 不保留未使用的 `agents` registry 表。Agent
  数据库发现是规范的 `agent_databases` registry，直到运行时
  拥有真正的 Agent 记录 owner。
- 生成的模型目录配置会存储在类型化的全局 SQLite
  `agent_model_catalogs` 行中，并以 Agent 目录为键。运行时调用方使用
  `ensureOpenClawModelCatalog`；运行时代码中没有 `models.json` 兼容性 API。
  实现会写入 SQLite，并且嵌入的 PI registry 会从该存储 payload
  hydration，而不会创建 `models.json` 文件。
- QMD 会话 transcript markdown 导出和 `memory.qmd.sessions` 配置已
  移除。没有 QMD transcript collection，没有 `qmd/sessions*` 运行时
  路径，也没有文件支持的会话记忆 bridge。
- memory-core 运行时从
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` 导入 SQLite transcript 索引 helper，
  而不是从 QMD SDK 子路径导入。QMD 子路径仅为
  外部调用方保留兼容性 re-export，直到一次 major SDK 清理可以将其移除。
- QMD 自身的 `index.sqlite` 现在是由主 SQLite
  `plugin_blob_entries` 表支持的临时运行时 materialization。运行时不再创建持久的
  `~/.openclaw/agents/<agentId>/qmd` sidecar。
- 可选的 `memory-lancedb` 插件不再将
  `~/.openclaw/memory/lancedb` 创建为隐式的 OpenClaw 管理存储。它是一个
  外部 LanceDB 后端，并会保持禁用，直到 operator 配置显式的
  `dbPath`。
- `check:database-first-legacy-stores` 会让将
  旧版存储名称与写入式文件系统 API 配对的新运行时源码失败。它也会让重新引入已退役 transcript bridge 标记
  `transcriptLocator` 或 `sqlite-transcript://...` 的运行时源码失败。迁移、Doctor、导入
  和显式的非会话导出代码仍然允许。更广泛的旧版契约
  名称，例如 `sessionFile`、`storePath` 和旧的 `SessionManager` 文件时代
  facade，仍有当前 owner，需要单独的迁移 guard 工作
  才能成为必需的 preflight 检查。该 guard 现在还覆盖
  运行时 `cache/*.json` 存储、通用
  `thread-bindings.json` sidecar、cron 状态/run-log JSON、配置健康 JSON、
  restart 和 lock sidecar、Voice Wake 设置、插件绑定审批、
  已安装插件索引 JSON、File Transfer 审计 JSONL、Memory Wiki 活动
  日志、旧的内置 `command-logger` 文本日志，以及 pi-mono raw-stream JSONL
  诊断开关。它还禁止旧的根级 Doctor 旧版模块名称，使
  兼容性代码保持在 `src/commands/doctor/` 下。Android 调试 handler
  也使用 logcat/in-memory 输出，而不是暂存 `camera_debug.log` 或
  `debug_logs.txt` 缓存文件。

## 目标 Schema 形态

保持 schema 显式。宿主拥有的运行时状态使用带类型的表。插件拥有的不透明状态使用 `plugin_state_entries` / `plugin_blob_entries`；不存在通用的宿主 `kv` 表。

全局数据库：

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Agent 数据库：

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

未来搜索可以添加 FTS 表，而无需更改规范事件表：

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

大值应使用 `blob` 列，而不是 JSON 字符串编码。对必须能用普通 SQLite 工具检查的小型结构化数据，保留 `value_json`。

`agent_databases` 是此分支的规范注册表。在真正的 agent 记录所有者存在之前，不要添加 `agents` 表；agent 配置仍保留在 `openclaw.json` 中。

## Doctor 迁移形态

Doctor 应调用一个显式迁移步骤，该步骤可报告且可安全重复运行：

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` 在常规配置预检后调用状态迁移实现，并在导入前创建经过验证的备份。运行时启动和 `openclaw migrate` 不得导入旧版 OpenClaw 状态文件。

迁移属性：

- 一次迁移会发现所有旧版文件来源，并在修改任何内容之前生成计划。
- Doctor 在导入旧版文件前创建经过验证的预迁移备份归档。
- 导入是幂等的，并按来源路径、mtime、大小、哈希和目标表设键。
- 成功的来源文件会在目标数据库提交后被移除或归档。
- 失败的导入会保持来源不变，并在 `migration_runs` 中记录警告。
- 迁移存在后，运行时代码只读取 SQLite。
- 不需要降级或导出到运行时文件的路径。

## 迁移清单

将这些移入全局数据库：

- Task registry 运行时写入现在使用共享数据库；未发布的
  `tasks/runs.sqlite` 边车导入器已删除。快照保存按任务
  id 执行 upsert，并且只删除缺失的任务/投递行。
- Task Flow 运行时写入现在使用共享数据库；未发布的
  `tasks/flows/registry.sqlite` 边车导入器已删除。快照保存
  按 flow id 执行 upsert，并且只删除缺失的 flow 行。
- 插件状态运行时写入现在使用共享数据库；未发布的
  `plugin-state/state.sqlite` 边车导入器已删除。
- 内置记忆搜索不再默认使用 `memory/<agentId>.sqlite`；它的
  索引表位于所属 Agent 数据库中，显式的
  `memorySearch.store.path` 边车选择项已退役到 Doctor 配置
  迁移。
- 内置记忆重建索引只重置 Agent 数据库中由记忆拥有的表。
  它不能替换整个 SQLite 文件，因为同一个数据库还拥有
  会话、转录、VFS 行、工件和运行时缓存。
- 来自单体和分片 JSON 的沙箱容器/浏览器注册表。运行时
  写入现在使用共享数据库；旧版 JSON 导入仍保留。
- Cron 作业定义、调度状态和运行历史现在使用共享 SQLite；
  Doctor 会导入/移除旧版 `jobs.json`、`jobs-state.json` 和
  `cron/runs/*.jsonl` 文件
- 设备身份/凭证、推送、更新检查、跟进承诺、OpenRouter 模型
  缓存、已安装插件索引和应用服务器绑定
- 设备/节点配对和引导记录现在使用类型化 SQLite 表
- 设备配对通知订阅者和已投递请求标记现在使用共享 SQLite
  插件状态表，而不是 `device-pair-notify.json`。
- 语音通话记录现在使用 `voice-call` / `calls` 命名空间下的
  共享 SQLite 插件状态表，而不是 `calls.jsonl`；插件 CLI
  会 tail 并汇总由 SQLite 支撑的通话历史。
- QQ Bot Gateway 网关会话、已知用户记录和 ref-index 引用缓存现在使用
  `qqbot` 命名空间（`gateway-sessions`、`known-users`、
  `ref-index`）下的 SQLite 插件状态，而不是 `session-*.json`、
  `known-users.json` 和 `ref-index.jsonl`。这些旧版文件是缓存，
  不会迁移。
- Discord 模型选择器偏好、命令部署哈希和线程绑定现在使用
  `discord` 命名空间（`model-picker-preferences`、
  `command-deploy-hashes`、`thread-bindings`）下的 SQLite 插件状态，
  而不是 `model-picker-preferences.json`、`command-deploy-cache.json` 和
  `thread-bindings.json`；Discord Doctor/设置迁移会导入并
  移除旧版文件。
- BlueBubbles 追赶游标和入站去重标记现在使用 `bluebubbles`
  命名空间（`catchup-cursors`、`inbound-dedupe`）下的 SQLite 插件
  状态，而不是 `bluebubbles/catchup/*.json` 和
  `bluebubbles/inbound-dedupe/*.json`；BlueBubbles Doctor/设置迁移
  会导入并移除旧版文件。
- Telegram 更新偏移、贴纸缓存条目、回复链消息缓存
  条目、已发送消息缓存条目、主题名称缓存条目和线程
  绑定现在使用 `telegram` 命名空间（`update-offsets`、
  `sticker-cache`、`message-cache`、`sent-messages`、
  `topic-names`、`thread-bindings`）下的 SQLite 插件状态，
  而不是 `update-offset-*.json`、`sticker-cache.json`、
  `*.telegram-messages.json`、`*.telegram-sent-messages.json`、
  `*.telegram-topic-names.json` 和 `thread-bindings-*.json`；Telegram
  Doctor/设置迁移会导入并移除旧版文件。
- iMessage 追赶游标、回复短 id 映射和已发送回显去重行
  现在使用 `imessage` 命名空间（`catchup-cursors`、
  `reply-cache`、`sent-echoes`）下的 SQLite 插件状态，而不是
  `imessage/catchup/*.json`、`imessage/reply-cache.jsonl` 和
  `imessage/sent-echoes.jsonl`；iMessage Doctor/设置迁移会导入并
  移除旧版文件。
- Microsoft Teams 对话、投票、SSO 令牌和反馈学习结果现在
  使用 SQLite 插件状态命名空间（`conversations`、`polls`、
  `sso-tokens`、`feedback-learnings`），而不是
  `msteams-conversations.json`、`msteams-polls.json`、
  `msteams-sso-tokens.json` 和 `*.learnings.json`；Microsoft Teams
  Doctor/设置迁移会导入并归档旧版文件。
  待处理上传是短生命周期的 SQLite 缓存，旧 JSON 缓存文件
  不会迁移。
- Matrix 同步缓存、存储元数据、线程绑定、入站去重标记、
  启动验证冷却状态、凭据、恢复密钥和 SDK IndexedDB 加密
  快照现在使用 `matrix` 下的 SQLite 插件状态/blob 命名空间
  （`sync-store`、`storage-meta`、`thread-bindings`、`inbound-dedupe`、
  `startup-verification`、`credentials`、`recovery-key`、`idb-snapshots`），
  而不是 `bot-storage.json`、`storage-meta.json`、`thread-bindings.json`、
  `inbound-dedupe.json`、`startup-verification.json`、`credentials.json`、
  `recovery-key.json` 和 `crypto-idb-snapshot.json`；Matrix Doctor/设置
  迁移会从按账号划分的 Matrix 存储根目录中导入并移除这些旧版文件。
- Nostr 总线游标和资料发布状态现在使用 `nostr` 命名空间
  （`bus-state`、`profile-state`）下的 SQLite 插件状态，而不是
  `bus-state-*.json` 和 `profile-state-*.json`；Nostr Doctor/设置
  迁移会导入并移除旧版文件。
- Active Memory 会话开关现在使用 `active-memory/session-toggles`
  下的 SQLite 插件状态，而不是 `session-toggles.json`。
- Skill Workshop 提案队列和评审计数器现在使用
  `skill-workshop/proposals` 和 `skill-workshop/reviews` 下的 SQLite
  插件状态，而不是按工作区划分的 `skill-workshop/<workspace>.json`
  文件。
- 出站投递和会话投递队列现在在独立队列名称
  （`outbound-delivery`、`session-delivery`）下共享全局 SQLite
  `delivery_queue_entries` 表，而不是持久化的
  `delivery-queue/*.json`、`delivery-queue/failed/*.json` 和
  `session-delivery-queue/*.json` 文件。Doctor 旧版状态步骤会导入
  待处理和失败行，移除陈旧的已投递标记，并在导入后删除旧
  JSON 文件。热路由和重试字段是类型化列；JSON 载荷仅保留
  用于重放/调试。
- ACPX 进程租约现在使用 `acpx/process-leases` 下的 SQLite 插件
  状态，而不是 `process-leases.json`。
- 备份和迁移运行元数据

将这些移入 Agent 数据库：

- Agent 会话根和兼容性形态的会话条目载荷。运行时写入已完成：
  热会话元数据可在 `sessions` 中查询，而旧版形态的完整
  `SessionEntry` 载荷仍保留在 `session_entries` 中。
- Agent 转录事件。运行时写入已完成。
- 压缩检查点和转录快照。运行时写入已完成：
  检查点转录副本是 SQLite 转录行，检查点
  元数据记录在 `transcript_snapshots` 中。Gateway 网关检查点助手
  现在将这些值命名为转录快照，而不是源文件。
- Agent VFS 草稿/工作区命名空间。运行时 VFS 写入已完成。
- 子智能体附件载荷。运行时写入已完成：它们是 SQLite VFS
  seed 条目，绝不是持久化工作区文件。
- 工具工件。运行时写入已完成。
- 运行工件。通过按 Agent 划分的 `run_artifacts` 表进行的 worker
  运行时写入已完成。
- Agent 本地运行时缓存。通过按 Agent 划分的 `cache_entries` 表
  进行的 worker 运行时作用域缓存写入已完成。Gateway 网关范围的模型缓存
  仍保留在全局数据库中，除非它们变为 Agent 专用。
- ACP 父流日志。运行时写入已完成。
- ACP 重放账本会话。通过 `acp_replay_sessions` 和
  `acp_replay_events` 进行的运行时写入已完成；旧版
  `acp/event-ledger.json` 仅作为 Doctor 输入保留。
- ACP 会话元数据。通过 `acp_sessions` 进行的运行时写入已完成；
  `sessions.json` 中的旧版 `entry.acp` 块仅作为 Doctor 迁移输入。
- 当轨迹边车不是显式导出文件时。运行时写入已完成：
  轨迹捕获会写入 Agent 数据库 `trajectory_runtime_events`
  行，并将运行作用域工件镜像到 SQLite。旧版边车仅作为 Doctor
  导入输入；导出可以生成新的 JSONL 支持包输出，但运行时不会
  读取或迁移旧轨迹/转录边车。
  运行时轨迹捕获暴露 SQLite 作用域；JSONL 路径助手
  隔离到导出/调试支持中，并且不会从运行时模块重新导出。
  嵌入式 runner 轨迹元数据记录 `{agentId, sessionId, sessionKey}`
  身份，而不是持久化转录定位器。

这些暂时保持文件支撑：

- `openclaw.json`
- 提供商或 CLI 凭据文件
- 插件/包清单
- 选择磁盘模式时的用户工作区和 Git 仓库
- 面向操作员 tail 的日志，除非某个特定日志表面已迁移

## 迁移计划

### 阶段 0：冻结边界

在移动更多行之前，先明确持久状态边界：

- 向全局数据库添加 `migration_runs` 表。
  旧版状态迁移执行报告已完成。
- 添加一个由 Doctor 拥有的单一状态迁移服务，用于文件到数据库导入。
  已完成：`openclaw doctor --fix` 使用旧版状态迁移实现。
- 让 `plan` 只读，并让 `apply` 创建备份、导入、验证，
  然后删除或隔离旧文件。
  已完成：Doctor 会创建已验证的迁移前备份，将备份路径
  传入 `migration_runs`，并复用导入器/移除路径。
- 添加静态禁令，确保新的运行时代码不能写入旧版状态文件，同时
  迁移代码和测试仍可 seed/读取它们。
  已针对当前已迁移的旧版存储完成；该守卫还会扫描嵌套
  测试中的被禁止运行时转录定位器契约。

### 阶段 1：完成全局控制平面

将共享协调状态保留在 `state/openclaw.sqlite` 中：

- Agent 和 Agent 数据库注册表
- 任务和 Task Flow 账本
- 插件状态
- 沙箱容器/浏览器注册表
- Cron/调度器运行历史
- 配对、设备、推送、更新检查、TUI、OpenRouter/模型缓存和其他
  小型 Gateway 网关作用域运行时状态
- 备份和迁移元数据
- Gateway 网关媒体附件字节。运行时写入已完成；直接文件路径
  是用于兼容频道发送器和沙箱暂存的临时实体化。运行时允许列表
  接受 SQLite 实体化路径，而不是旧版状态/配置媒体根。Doctor 会将旧版
  媒体文件导入 `media_blobs`，并在成功写入行后移除源文件。
- 调试代理捕获会话、事件和载荷 blob。已完成：捕获位于
  共享状态数据库中，并通过共享状态数据库引导、schema、WAL 和
  busy-timeout 设置打开。载荷字节在 `capture_blobs.data` 中以 gzip
  压缩；不存在调试代理运行时边车 DB 覆盖、blob 目录，或仅代理捕获的
  生成 schema/codegen 目标。
  Doctor/启动迁移会导入已发布的 `debug-proxy/capture.sqlite` 行
  和引用的载荷 blob，包括活动旧版 DB/blob 环境
  覆盖，然后归档这些源，同时保留 CA 证书。

此阶段还会从这些子系统中删除重复的边车 opener、权限助手、WAL
设置、文件系统修剪和兼容性写入器。

### 阶段 2：引入按 Agent 划分的数据库

为每个 Agent 创建一个数据库，并从全局 DB 注册它：

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

全局 `agent_databases` 行存储路径、schema 版本、最后出现
时间戳以及基本大小/完整性元数据。运行时代码向注册表请求
Agent DB，而不是直接派生文件路径。

Agent DB 拥有：

- `sessions` 作为规范会话根，`session_entries` 作为附加到该根的兼容形态载荷表，`session_routes` 作为唯一的活动 `session_key` 查找
- `conversations` 和 `session_conversations` 作为附加到会话的规范化提供商路由身份
- `transcript_events`
- 转录快照和压缩检查点。运行时写入已完成。
- `vfs_entries`
- `tool_artifacts` 和运行工件
- 智能体本地运行时/缓存行。工作器作用域缓存已完成。
- ACP 父级流事件
- 轨迹运行时事件，当它们不是显式导出工件时

### 第 3 阶段：替换会话存储 API

运行时已完成。文件形态的会话存储表面不是活动的运行时契约：

- 运行时不再调用 `loadSessionStore(storePath)`，也不再把 `storePath` 视为会话身份。
- 运行时行操作是 `getSessionEntry`、`upsertSessionEntry`、`patchSessionEntry`、`deleteSessionEntry` 和 `listSessionEntries`。
- 整存储重写助手、文件写入器、队列测试、别名修剪和旧键删除参数已从运行时移除。
- 已弃用的根包兼容性导出仍会把规范 `sessions.json` 路径适配到 SQLite 行 API。
- `sessions.json` 解析仅保留在 Doctor 迁移/导入代码和 Doctor 测试中。
- 运行时生命周期回退读取 SQLite 转录标头，而不是 JSONL 首行。

继续删除任何重新引入文件锁参数、修剪/截断即文件维护词汇、存储路径身份，或唯一断言是 JSON 持久化的测试。

### 第 4 阶段：迁移转录、ACP 流、轨迹和 VFS

让每个智能体数据流都原生使用数据库：

- 转录追加写入通过一个 SQLite 事务完成，该事务确保会话标头、检查消息幂等性、选择父级尾部、插入到 `transcript_events`，并在 `transcript_event_identities` 中记录可查询的身份元数据。直接转录消息追加和正常持久化的 `TranscriptSessionManager` 追加已完成；显式分支操作保留其显式父级选择，并且仍写入 SQLite 行，不派生任何文件定位器。
- ACP 父级流日志变为行，而不是 `.acp-stream.jsonl` 文件。已完成。
- ACP 生成设置不再持久化转录 JSONL 路径。已完成。
- 运行时轨迹捕获直接写入事件行/工件。显式支持/导出命令仍可生成支持包 JSONL 工件作为导出格式，但会话导出不会重新创建会话 JSONL。已完成。
- 磁盘工作区在配置为磁盘模式时仍保留在磁盘上。
- VFS 暂存和实验性仅 VFS 工作区模式使用智能体数据库。

迁移会一次性导入旧 JSONL 文件，在 `migration_runs` 中记录计数/哈希，并在完整性检查后移除已导入的文件。

### 第 5 阶段：备份、恢复、清理和验证

备份仍是一个归档文件：

- 对每个全局数据库和智能体数据库执行检查点。
- 使用 SQLite 备份语义或 `VACUUM INTO` 快照每个数据库。
- 归档紧凑数据库快照、配置、外部凭证和请求的工作区导出。
- 省略原始实时 `*.sqlite-wal` 和 `*.sqlite-shm` 文件。
- 通过打开每个数据库快照并运行 `PRAGMA integrity_check` 来验证。`openclaw backup create` 默认执行此归档验证；`--no-verify` 只跳过写入后的归档流程，不跳过快照创建完整性检查。
- 恢复会把快照复制回其目标路径。此分支将未发布的 SQLite 布局重置为 `user_version = 1`；未来已发布的 schema 变更可以在需要时添加显式迁移。

### 第 6 阶段：工作器运行时

在数据库拆分落地期间，保持工作器模式为实验性：

- 工作器接收智能体 ID、运行 ID、文件系统模式和数据库注册表身份。
- 每个工作器打开自己的 SQLite 连接。
- 父级保留渠道投递、审批、配置和取消权限。
- 先从每个活动运行一个工作器开始；仅在生命周期和数据库连接所有权稳定后再添加池化。

### 第 7 阶段：删除旧世界

运行时会话管理已完成。旧世界只允许作为显式 Doctor 输入或支持/导出输出：

- 没有运行时 `sessions.json`、转录 JSONL、沙箱注册表 JSON、任务侧车 SQLite，或插件状态侧车 SQLite 写入。
- 没有 JSON/会话文件修剪、文件转录截断、会话文件锁，或锁形态的会话测试。
- 没有以保持旧会话文件最新为目的的运行时兼容性导出。
- 显式支持导出仍是用户请求的归档/物化格式，并且不得把文件名反馈到运行时身份中。

## 备份和恢复

备份应该是一个归档文件，但数据库捕获应当原生使用 SQLite：

1. 停止长时间运行的写入活动，或进入一个短暂的备份屏障。
2. 对每个全局数据库和智能体数据库运行检查点。
3. 使用 SQLite 备份语义或 `VACUUM INTO` 将每个数据库快照到临时备份目录中。
4. 归档压缩后的数据库快照、配置文件、凭证目录、选定工作区和清单。
5. 通过打开每个包含的 SQLite 快照并运行 `PRAGMA integrity_check` 来验证归档。`openclaw backup create` 默认会这样做；`--no-verify` 仅用于有意跳过写入后的归档流程。

不要依赖原始实时 `*.sqlite`、`*.sqlite-wal` 和 `*.sqlite-shm` 副本作为主要备份格式。归档清单应记录数据库角色、智能体 ID、schema 版本、源路径、快照路径、字节大小和完整性状态。

恢复应从归档快照重建全局数据库和智能体数据库文件。由于 SQLite 布局尚未发布，此重构只保留版本 1 schema 加 Doctor 文件到数据库导入。恢复命令先验证归档，然后从已验证的解压载荷中替换每个清单资产。

## 运行时重构计划

1. 添加数据库注册表 API。
   - 解析全局数据库和每智能体数据库路径。
   - 将未发布的 schema 保持在 `user_version = 1`；在已发布 schema 需要之前，不要添加 schema 迁移运行器代码。
   - 添加供测试、备份和 Doctor 使用的关闭/检查点/完整性助手。

2. 折叠侧车 SQLite 存储。
   - 将插件状态表移入全局数据库。运行时写入已完成；未发布的旧侧车导入器已删除。
   - 将任务注册表表移入全局数据库。运行时写入已完成；未发布的旧侧车导入器已删除。
   - 将 Task Flow 表移入全局数据库。运行时写入已完成；未发布的旧侧车导入器已删除。
   - 将内置记忆搜索表移入每个智能体数据库。已完成；显式自定义 `memorySearch.store.path` 现在会由 Doctor 配置迁移移除。完整重建索引会就地仅针对记忆表运行；旧的整文件交换路径和侧车索引交换助手已删除。
   - 从这些子系统中删除重复的数据库打开器、WAL 设置、权限助手和关闭路径。

3. 将智能体拥有的表移入每智能体数据库。
   - 通过全局数据库注册表按需创建智能体数据库。已完成。
   - 将运行时会话条目、转录事件、VFS 行和工具工件移至智能体数据库。已完成。
   - 不要迁移分支本地共享数据库会话条目、转录事件、VFS 行或工具工件；该布局从未发布。仅在 Doctor 中保留旧文件到数据库导入。

4. 替换会话存储 API。
   - 移除作为运行时身份的 `storePath`。运行时已完成，并由 `check:database-first-legacy-stores` 防护：会话元数据、路由更新、命令持久化、CLI 会话清理、Feishu reasoning 预览、转录状态持久化、子智能体深度、认证资料会话覆盖、父级分叉逻辑和 QA-lab 检查现在都从规范智能体/会话键解析数据库。
     Gateway 网关/TUI/UI/macOS 会话列表响应现在暴露 `databasePath` 而不是旧版 `path`；macOS 调试表面将每智能体数据库显示为只读状态，而不是写入 `session.store` 配置。
     `/status`、聊天驱动的轨迹导出和 CLI 依赖代理不再传播旧存储路径；转录使用情况回退按智能体/会话身份读取 SQLite。运行时和桥接测试不再暴露 `storePath`；Doctor/迁移输入拥有该旧字段名。
     Gateway 网关组合会话加载不再为非模板化 `session.store` 值提供特殊运行时分支；它会聚合每智能体 SQLite 行。
     旧会话锁 Doctor 通道及其 `.jsonl.lock` 清理助手已移除；SQLite 现在是会话并发边界。
     热运行时调用点使用面向行的助手名称，例如 `resolveSessionRowEntry`；旧的 `resolveSessionStoreEntry` 兼容别名已从运行时和插件 SDK 导出中移除。

- 使用 `{ agentId, sessionKey }` 行操作。
  已完成：`getSessionEntry`、`upsertSessionEntry`、`deleteSessionEntry`、`patchSessionEntry` 和 `listSessionEntries` 都是 SQLite 优先 API，不需要会话存储路径。状态摘要、本地智能体状态、健康状况和 `openclaw sessions` 列表命令现在直接读取每智能体行，并显示每智能体 SQLite 数据库路径，而不是 `sessions.json` 路径。
- 用 `upsertSessionEntry`、`deleteSessionEntry`、`listSessionEntries` 和 SQL 清理查询替换整存储删除/插入。
  运行时已完成：热路径现在使用行 API 和带冲突重试的行补丁；剩余整存储导入/替换助手仅限于迁移导入代码和 SQLite 后端测试。
  - 删除 `store-writer.ts` 和写入器队列测试。已完成。
  - 从会话行 upsert/patch 中删除运行时旧键修剪和别名删除参数。已完成。

5. 删除运行时 JSON 注册表行为。
   - 让沙箱注册表读写仅使用 SQLite。已完成。
   - 仅从迁移步骤导入单体和分片 JSON。已完成。
   - 移除分片注册表锁和 JSON 写入。已完成。

- 如果注册表行形态仍是热路径操作状态，则保留一个类型化注册表表，而不是把注册表行存储为通用不透明 JSON。已完成。

6. 删除文件锁形态的会话变更。
   - 运行时锁创建和运行时锁 API 已完成。
   - 独立的旧 `.jsonl.lock` Doctor 清理通道已移除。
   - `session.writeLock` 是由 Doctor 迁移的旧配置，不是类型化运行时设置。
   - 状态完整性不再有单独的孤立转录文件修剪路径；Doctor 迁移会在一个地方导入/移除旧 JSONL 源。
   - Gateway 网关单例协调使用 `gateway_locks` 下类型化的 SQLite `state_leases` 行，并且不再暴露文件锁目录接缝。
   - 通用插件 SDK 去重持久化不再使用文件锁或 JSON 文件；它写入共享 SQLite 插件状态行。已完成。
   - QMD 嵌入协调使用 SQLite 状态租约，而不是 `qmd/embed.lock`。已完成。

7. 让工作器感知数据库。
   - 工作器打开自己的 SQLite 连接。
   - 父级拥有投递、渠道回调和配置。
   - 工作器接收智能体 ID、运行 ID、文件系统模式和数据库注册表身份，而不是实时句柄。
   - `vfs-only` 保持实验性，并使用智能体数据库作为其存储根。
   - 先保持每个活动运行一个工作器。池化可以等到数据库连接生命周期和取消行为变得稳定后再做。

8. 备份集成。
   - 教会备份通过 SQLite 备份或 `VACUUM INTO` 快照全局和智能体数据库。已对状态资产下发现的 `*.sqlite` 文件完成。
   - 为 SQLite 完整性和 schema 版本添加备份验证。已为备份创建和默认归档验证完整性检查完成。
   - 在 SQLite 中记录备份运行元数据。已通过共享的 `backup_runs` 表完成，包含归档路径、状态和清单 JSON。
   - 添加从已验证归档快照恢复。已完成：`openclaw backup
restore` 会在解压前验证，使用验证器的规范化清单，支持 `--dry-run`，并且在替换已记录的源路径前要求 `--yes`。
   - 仅在请求时包含 VFS/工作区导出；不要将会话内部数据导出为 JSON 或 JSONL。

9. 删除过时测试和代码。已对已知运行时会话表面完成。

- 移除断言运行时会创建 `sessions.json` 或转录 JSONL 文件的测试。已针对核心会话存储、聊天、Gateway 网关转录事件、预览、生命周期、命令会话条目更新、自动回复重置/跟踪，以及 memory-core dreaming fixture、审批目标路由、会话转录修复、安全权限修复、轨迹导出和会话导出完成。
  主动记忆转录测试现在断言 SQLite 作用域，并断言不会创建临时或持久化 JSONL 文件。
  旧的 heartbeat 转录裁剪回归测试已移除，因为运行时不再截断 JSONL 转录。
  智能体会话列表工具测试不再将旧版 `sessions.json` 路径建模为 Gateway 网关响应形状；app/UI/macOS 测试使用 `databasePath`。
  `/status` 转录使用量测试现在直接种入 SQLite 转录行，而不是写入 JSONL 文件。
  Gateway 网关会话生命周期测试现在直接使用 SQLite 转录种入 helper；旧的单行会话文件 fixture 形状已从重置和删除覆盖中移除。
  `sessions.delete` 不再返回文件时代的 `archived: []` 字段；删除只报告行变更结果。旧的 `deleteTranscript` 选项也已移除：删除会话会移除规范的 `sessions` 根，并让 SQLite 级联删除会话拥有的转录、快照和轨迹行，因此没有调用方会留下孤立转录，也不会忘记清理分支。
  上下文引擎轨迹捕获测试现在从隔离的智能体数据库读取 `trajectory_runtime_events` 行，而不是读取 `session.trajectory.jsonl`。
  Docker MCP 渠道种入脚本现在直接种入 SQLite 行。直接写入 `sessions.json` 仅限于 Doctor fixture。
  工具搜索 Gateway 网关 E2E 从 SQLite 转录行读取工具调用证据，而不是扫描 `agents/<agentId>/sessions/*.jsonl` 文件。
  Memory-core 主机事件和会话语料 scratch 行现在位于共享 SQLite 插件状态中；`events.jsonl` 和 `session-corpus/*.txt` 仅是旧版 Doctor 迁移输入。活动行使用 `memory/session-ingestion/` 虚拟路径，而不是 `.dreams/session-corpus`。旧的 memory-core dreaming 修复模块及其 CLI/Gateway 网关测试已移除，因为运行时不再拥有该语料的文件归档修复。Memory-core bridge/public-artifact 测试不再暴露 `.dreams/events.jsonl`；它们使用由 SQLite 支撑的虚拟 JSON 工件名称。
  公共 SDK/Codex 测试文档现在说明 SQLite 会话状态，而不是会话文件，并且 channel-turn 示例不再暴露 `storePath` 参数。
  Matrix 同步状态现在直接使用 SQLite 插件状态存储。活动客户端/运行时契约传递账号存储根，而不是 `bot-storage.json` 路径，并且 Doctor 会在删除源之前将旧版 `bot-storage.json` 导入 SQLite。QA Matrix 重启/破坏性场景现在直接变更 SQLite 同步行，而不是创建或删除假的 `bot-storage.json` 文件，并且 E2EE substrate 传递同步存储根，而不是假的 `sync-store.json` 路径。
  Matrix 存储根选择不再按旧版同步/线程 JSON 文件为根评分；它使用持久根元数据加真实加密状态。
  运行时 SQLite 会话后端测试套件不再伪造 `sessions.json`；旧版源 fixture 现在位于导入它们的 Doctor 测试中。
  Gateway 网关会话测试不再暴露 `createSessionStoreDir` helper 或未使用的临时会话存储路径设置；fixture 目录是显式的，并且直接行设置使用 SQLite 会话行命名。
  Doctor 专用 JSON5 会话存储解析器覆盖已从基础设施测试移入 Doctor 迁移测试，因此运行时测试套件不再拥有旧版会话文件解析。
  Microsoft Teams 运行时 SSO/待上传测试不再携带 JSON sidecar fixture 或解析器；旧版 SSO 令牌解析只存在于插件迁移模块中。Telegram 测试不再种入假的 `/tmp/*.json` 存储路径；它们直接重置由 SQLite 支撑的消息缓存。通用 OpenClaw 测试状态 helper 不再暴露旧版 `auth-profiles.json` 写入器；Doctor 凭证迁移测试在本地拥有该 fixture。
  TUI 最近会话指针、exec 审批、主动记忆开关、Matrix 去重/启动验证、Memory Wiki 源同步、当前对话绑定、新手引导凭证和 Hermes secret 导入的运行时测试不再制造旧的 sidecar 文件，也不再断言旧文件名不存在。它们通过 SQLite 行和公共存储 API 证明行为；Doctor/迁移测试是唯一应出现旧版源文件名的地方。
  设备/节点配对、渠道 allowFrom、重启意图、重启移交、会话投递队列条目、配置健康、iMessage 缓存、cron 作业、PI 转录头、子智能体注册表和托管图片附件的运行时测试也不再创建已退役的 JSON/JSONL 文件，只为证明它们会被忽略或不存在。
  PI 溢出恢复不再有 SessionManager 重写/截断 fallback：工具结果截断和上下文引擎转录重写会变更 SQLite 转录行，然后从数据库刷新活动提示状态。
  持久化 SessionManager 消息追加会委托给原子 SQLite 转录追加 helper，用于父级选择和幂等性。普通元数据/自定义条目追加也会在 SQLite 内选择当前父级，因此陈旧的 manager 实例不会复活 SQLite 之前的父链竞争。
  用于 mid-turn 预检查和 `sessions_yield` 的合成 PI 尾部清理现在直接修剪 SQLite 转录状态；旧的 SessionManager 尾部移除 bridge 及其测试已删除。
  Compaction checkpoint 捕获也仅从 SQLite 快照；调用方不再传递 live SessionManager 作为替代转录源。
- 保留仅用于迁移的旧版文件种入测试。
- 对于活动运行时表面，JSON 文件证明已替换为 SQL 行证明。

- 为运行时写入旧版会话/缓存 JSON 路径添加静态禁止。
  已对仓库 guard 完成。

10. 让迁移报告可审计。
    - 在 SQLite 中记录迁移运行，包含开始/结束时间戳、源路径、源哈希、计数、警告和备份路径。
      已完成：legacy-state 迁移执行现在会持久化 `migration_runs` 报告，包含源路径/表清单、源文件 SHA-256、大小、记录计数、警告和备份路径。
      已完成：legacy-state 迁移执行也会持久化 `migration_sources` 行，用于源级审计以及未来的跳过/回填决策。
    - 让 apply 幂等。部分导入后重新运行时，应跳过已导入的源，或按稳定键合并。
      已完成：会话索引、转录、投递队列、插件状态、任务账本，以及智能体拥有的全局 SQLite 行都通过稳定键或 upsert/replace 语义导入，因此重新运行会合并而不会重复持久行。
    - 失败的导入必须将原始源文件保留在原位。
      已完成：失败的转录导入现在会将原始 JSONL 源保留在其检测到的路径，并且 `migration_sources` 将该源记录为 `warning`，同时 `removed_source=0`，供下一次 Doctor 运行使用。

## 性能规则

- 每个线程/进程一个连接即可；不要跨 worker 共享句柄。
- 使用 WAL、`foreign_keys=ON`、30 秒 busy timeout，以及短 `BEGIN IMMEDIATE` 写事务。
- 保持写事务 helper 同步，除非/直到异步事务 API 添加显式互斥/背压语义。
- 保持父级投递写入小且事务化。
- 避免整库重写；使用行级 upsert/delete。
- 在迁移热点代码前，为按智能体列出、按会话列出、updated-at、run id 和过期路径添加索引。
- 将大型工件、媒体和向量存储为 BLOB 或分块 BLOB 行，而不是 base64 或数值数组 JSON。
- 保持不透明插件状态条目小且作用域明确。
- 为 TTL/过期添加 SQL 清理，而不是文件系统裁剪。
  已对数据库拥有的运行时存储完成：媒体、插件状态、插件 blob、持久去重和智能体缓存都通过 SQLite 行过期。剩余文件系统清理仅限于临时实体化或显式移除命令。

## 静态禁止

添加仓库检查，使对旧版状态路径的新运行时写入失败：

- `sessions.json`
- `*.trajectory.jsonl`，物化的支持包输出除外
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` 运行时缓存文件
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` 和 `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQ Bot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- 沙箱注册表分片 JSON 文件
- 原生钩子中继 `/tmp` 桥接 JSON 文件
- `plugin-state/state.sqlite`
- 临时 `openclaw-state.sqlite` 运行时附属文件
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- 浏览器配置文件装饰 `.openclaw-profile-decorated`
- `SessionManager.open(...)` 基于文件的会话打开器
- `SessionManager.listAll(...)` 和 `TranscriptSessionManager.listAll(...)`
  转录列举外观
- `SessionManager.forkFromSession(...)` 和
  `TranscriptSessionManager.forkFromSession(...)` 转录分叉外观
- `SessionManager.newSession(...)` 和 `TranscriptSessionManager.newSession(...)`
  可变会话替换外观
- `SessionManager.createBranchedSession(...)` 和
  `TranscriptSessionManager.createBranchedSession(...)` 分支会话外观

该禁用应允许测试创建旧版夹具，并允许迁移代码读取、导入和移除旧版文件来源。未发布的 SQLite 附属文件仍被禁用，并且不获得 Doctor 导入许可。

## 完成标准

- 运行时数据和缓存写入全局或智能体 SQLite 数据库。
- 运行时不再写入会话索引、转录 JSONL、沙箱注册表
  JSON、任务附属 SQLite 或插件状态附属 SQLite。未发布的任务
  和插件状态附属 SQLite 导入器已删除。
- 旧版文件导入仅限 Doctor。
- 备份会生成一个包含紧凑 SQLite 快照和完整性证明的归档。
- 智能体工作进程可以使用磁盘、VFS 临时空间或实验性纯 VFS
  存储运行。
- 配置和显式凭证文件仍是仅有的预期持久化
  非数据库控制文件。
- 仓库检查会防止重新引入旧版运行时文件存储。

---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest），以及何时使用强制/覆盖率模式
title: 测试
x-i18n:
    generated_at: "2026-07-14T14:06:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（测试套件、实时测试、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

## Agent 默认行为

仅当源代码可信且现有依赖安装已就绪时，Agent 会话才在本地运行少量有针对性的测试和成本较低的静态检查。绝不要在本地执行不受信任的仓库工具。较大的测试套件、包含类型检查/代码检查扇出的变更门禁、构建、Docker、软件包通道、E2E、实时验证和跨平台验证均通过 Crabbox 远程运行。受信任维护者的重型验证默认使用 Blacksmith Testbox。配置的 Testbox 工作流会注入凭据，因此不受信任的贡献者代码或分支代码必须改用无密钥的分支 CI 或经过净化的 AWS 直连 Crabbox。

不要为预期的工作预热。当第一个重型命令准备就绪时再按需获取后端，后续重型命令复用返回的 `tbx_...` ID，每次运行时同步当前检出，并在交接前停止后端。

首次成功复用后，包装器会将租约的基线、依赖项和 Testbox 工作流指纹记录在 `.crabbox/testbox-leases/` 下。仅修改源代码时会继续复用已预热的机器。合并基线、锁文件、包管理器输入、包装器或 Testbox 工作流发生变化时，会以失败关闭方式中止，并要求使用新租约。每次运行仍会同步当前检出。
`OPENCLAW_TESTBOX_ALLOW_STALE=1` 仅用于有意进行的诊断，不得用于发布验证。

以下本地测试命令适用于人工工作流和有限范围的 Agent 验证。必须报告远程提供商不可用的情况；这并不意味着可以静默运行大范围的本地门禁。

对于不受信任的重型验证，请使用 `--provider aws` 按需预热。每次运行都必须设置 `CRABBOX_ENV_ALLOW=CI`、传入 `--provider aws --no-hydrate`，并在安装依赖项或运行测试前使用一个全新的临时远程 `HOME`。使用专用于该不受信任源代码的新预热租约；绝不要复用受信任的租约或先前已注入凭据的租约。从干净且受信任的 `main` 检出中启动已安装且受信任的 Crabbox 二进制文件，并仅使用 `--fresh-pr` 获取远程 PR；绝不要在本地执行不受信任检出中的包装器或配置。取消设置 `CRABBOX_AWS_INSTANCE_PROFILE`，除非解析出的 `aws.instanceProfile` 为空，否则以失败关闭方式中止。在进行任何安装/测试之前，使用受信任的绝对路径工具要求提供 IMDSv2 令牌，证明 IAM 凭据端点返回 404，并验证远程 `git rev-parse HEAD` 等于已审核 PR 头部的完整 SHA。将租约绑定到该 SHA，并在头部发生变化时停止租约并重新预热。将干净 `main` 中受信任的 `scripts/crabbox-untrusted-bootstrap.sh` 与 `--fresh-pr` 一同上传；它会安装固定版本的 Node/pnpm、验证 SHA 和包管理器版本锁定、隔离 `HOME`、安装依赖项，然后执行所请求的测试。如果代理程序无法证明不存在角色，或远程 PR 不存在，请使用无密钥的分支 CI。不要使用 `hydrate-github`、`--no-sync` 或注入了凭据的 Testbox 工作流。
取消设置所有 `CRABBOX_TAILSCALE*` 覆盖项，强制使用 `--network public
--tailscale=false`，清除出口节点/LAN 标志，并要求 `crabbox inspect` 在上传任何脚本之前报告使用公共网络且不存在 Tailscale 状态。

## 常规本地顺序

1. `pnpm test:changed` 用于变更范围的 Vitest 验证。
2. `pnpm test <path-or-filter>` 用于单个文件、目录或显式目标。
3. 仅当你有意需要完整的本地 Vitest 测试套件时，才使用 `pnpm test`。

在 Codex 工作树或链接/稀疏检出中，智能体应避免直接在本地运行
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`：

- 依赖项已就绪时的有界聚焦验证：
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 优先分类的变更检查：`node scripts/check-changed.mjs`；仅文档、
  无变更和小型元数据计划在依赖项已就绪时留在本地执行，
  而繁重或缺少依赖项的计划则委派给 Testbox。
- 显式保留租约的广泛验证：`node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，使 pnpm 在 Testbox 内运行。
- 包装器最终的 `exitCode` 和计时 JSON 即为命令结果。委派的 Blacksmith GitHub Actions 运行可能会在 SSH 命令成功后显示 `cancelled`，因为 Testbox 是从保活 action 外部停止的；在将其视为失败之前，请检查包装器摘要和命令输出。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：对于 `pnpm check:changed` 和定向 `pnpm test ...` 等命令，将繁重检查的串行化保持在当前工作树内，而不是 Git 公共目录内。仅当你有意在高性能本地主机上跨链接工作树运行相互独立的检查时使用它。

## 核心命令

测试包装器运行结束时会显示简短的 `[test] passed|failed|skipped ... in ...` 摘要；Vitest 自身的耗时行仍作为每个分片的详细信息。

| 命令                                              | 作用                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 显式文件/目录目标通过限定范围的 Vitest 通道运行。无目标运行属于完整测试套件验证：固定分片组会展开为叶级配置，以便在本地并行执行，并在开始前输出预期的分片扇出。扩展组始终展开为逐扩展分片配置，而不是使用一个庞大的根项目进程。           |
| `pnpm test:changed`                               | 低成本的智能变更测试运行：根据直接测试编辑、同级 `*.test.ts` 文件、显式源映射和本地导入图确定精确目标。除非广泛变更、配置变更或软件包变更能够映射到精确测试，否则将跳过这些变更。                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 显式的广泛变更测试运行；当测试工具、配置或软件包编辑应回退到 Vitest 更广泛的变更测试行为时使用。                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | 释放已配置的 OpenClaw Gateway 网关端口（默认值为 `18789`），然后使用隔离的 Gateway 网关端口运行完整测试套件，使服务器测试不会与正在运行的实例冲突。                                                                                                                                                                                    |
| `pnpm test:coverage`                              | 为默认单元测试通道（`vitest.unit.config.ts`）生成信息性 V8 覆盖率报告；不强制执行覆盖率阈值。                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | 仅对自 `origin/main` 起发生变更的文件进行单元测试覆盖率检查。                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | 显示与 `origin/main` 比较后由差异触发的架构通道。                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | 在选择执行方式前对变更通道进行分类。仅文档、无变更和小型元数据计划在依赖项已就绪时留在本地执行；具有类型检查/代码检查扇出、其他繁重通道或缺少本地依赖项的计划，会在 CI 外委派给 Crabbox/Testbox。不运行 Vitest；测试验证请使用 `pnpm test:changed` 或 `pnpm test <target>`。 |

## 共享测试状态和进程辅助工具

- `src/test-utils/openclaw-test-state.ts`：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置固件、工作区、智能体目录或身份验证配置文件存储时，在 Vitest 中使用。
- `pnpm test:env-mutations:report`：以非阻塞方式报告直接修改 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相关环境变量键的测试/测试工具。使用它查找共享测试状态辅助工具的迁移候选项。
- `test/helpers/openclaw-test-instance.ts`：用于需要在一个位置统一处理运行中的 Gateway 网关、CLI 环境、日志捕获和清理的进程级端到端测试。
- 引用 `scripts/lib/docker-e2e-image.sh` 的 Docker/Bash 端到端测试通道可以将 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并使用 `scripts/lib/openclaw-e2e-instance.sh` 对其解码；多主目录脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个流程中调用 `openclaw_test_state_create <label> <scenario>`。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 会写入可由 source 加载的主机环境文件（在 `create` 前添加 `--`，可避免较新的 Node 运行时将 `--env-file` 视为 Node 标志）。启动 Gateway 网关的通道可以引用 `scripts/lib/openclaw-e2e-instance.sh`，用于入口点解析、模拟 OpenAI 启动、前台/后台启动、就绪探测、状态环境变量导出、日志转储和进程清理。

## Control UI、TUI 和扩展通道

- **Control UI 模拟 E2E：** `pnpm test:ui:e2e` 运行 Vitest + Playwright 通道，启动 Vite Control UI，并驱动真实 Chromium 页面连接到模拟的 Gateway 网关 WebSocket。测试位于 `ui/src/**/*.e2e.test.ts`；共享模拟和控制项位于 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此通道。智能体运行默认使用 Testbox/Crabbox，包括针对性验证；仅在明确需要本地回退时使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`。
- **TUI PTY 测试：** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` 运行快速的虚假后端 PTY 通道。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local` 运行较慢的 `tui --local` 冒烟测试，该测试仅模拟外部模型端点。应断言稳定的可见文本或固件调用，而不是原始 ANSI 快照。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有扩展/插件分片。重量级渠道插件、浏览器插件和 OpenAI 作为专用分片运行；其他插件组保持批量运行。`pnpm test extensions/<id>` 运行一个内置插件通道。
- 带有同级测试的源文件会先映射到该同级测试，再回退到更宽泛的目录 glob。对 `src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下辅助程序的编辑会使用本地导入图运行导入它们的测试；当依赖路径明确时，不会宽泛运行每个分片。
- 契约目录目标会扇出到各自的契约通道：`pnpm test src/channels/plugins/contracts` 运行四个渠道契约配置，`pnpm test src/plugins/contracts` 运行插件契约配置，因为通用的 `channels`/`plugins` 项目排除了 `contracts/**`。
- `auto-reply` 拆分为三个专用配置（`core`、`top-level`、`reply`），避免回复测试框架占用较轻量的顶层状态/令牌/辅助程序测试的大部分资源。
- 选定的 `plugin-sdk` 和 `commands` 测试文件会通过仅保留 `test/setup.ts` 的专用轻量通道运行，而运行时负载较重的用例仍留在其现有通道上。
- 基础 Vitest 配置默认为 `pool: "threads"` 和 `isolate: false`，并在整个仓库的配置中启用共享的非隔离运行器。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。

## Gateway 网关和 E2E

- Gateway 网关集成需选择性启用：`OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway`。
- `pnpm test:e2e`：仓库 E2E 聚合 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`：Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。默认为 `threads` + `isolate: false`，并在 `vitest.e2e.config.ts` 中使用自适应工作进程；使用 `OPENCLAW_E2E_WORKERS=<n>` 调整，使用 `OPENCLAW_E2E_VERBOSE=1` 启用详细日志。
- `pnpm test:live`：提供商实时测试（Claude/Minimax/DeepSeek/z.ai 等，由 `*.live.test.ts` 控制）。需要 API 密钥和 `LIVE=1`（或 `OPENCLAW_LIVE_TEST=1`）才能取消跳过；使用 `OPENCLAW_LIVE_TEST_QUIET=0` 启用详细输出。

## 完整 Docker 套件（`pnpm test:docker:all`）

构建共享实时测试镜像，将 OpenClaw 一次性打包为 npm tarball，构建/复用裸 Node/Git 运行器镜像，以及将该 tarball 安装到 `/app` 的功能镜像，然后通过加权调度器运行 Docker 冒烟测试通道。`scripts/package-openclaw-for-docker.mjs` 是本地/CI 唯一的软件包打包器，并在 Docker 使用 tarball 之前验证该 tarball 和 `dist/postinstall-inventory.json`。

- 裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）：安装器/更新/插件依赖通道；挂载预构建的 tarball，而不是复制的仓库源文件。
- 功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）：常规已构建应用功能通道。
- 通道定义：`scripts/lib/docker-e2e-scenarios.mjs`。规划器：`scripts/lib/docker-e2e-plan.mjs`。执行器：`scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` 输出由调度器管理的 CI 计划（通道、镜像类型、软件包/实时镜像需求、状态场景、凭据检查），但不构建或运行 Docker。

调度选项（环境变量，括号内为默认值）：

| 环境变量                                                                                                        | 默认值              | 用途                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | 进程槽位。                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | 提供商敏感型尾部池。                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 重量级实时提供商通道上限。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm 资源通道上限。                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | 服务资源通道上限。                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | 各提供商的重量级通道上限。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | 更严格的各提供商上限。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | 用于较大主机的覆盖值。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | 通道启动之间的延迟，避免本地 Docker 守护进程发生创建风暴。                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | 每个通道的回退超时；选定的实时/尾部通道使用更严格的上限。                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 瞬态实时提供商故障的重试次数。                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | 输出通道清单而不运行 Docker。                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | 活动通道状态输出间隔。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | 复用 `.artifacts/docker-tests/lane-timings.json` 以采用最长优先排序；设为 `0` 可禁用。                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` 仅用于确定性/本地通道，`only` 仅用于实时提供商通道。别名：`pnpm test:docker:local:all`、`pnpm test:docker:live:all`。仅实时模式会将主实时通道和尾部实时通道合并为一个最长优先池，使提供商存储桶能够将 Claude/Codex/Gemini 工作打包在一起。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI 后端 Docker 设置超时。                                                                                                                                                                                                                                                                 |

资源上限的环境变量模式为 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`（资源名称转为大写，非字母数字字符折叠为 `_`）。

其他行为：运行器默认会预检 Docker、清理过期的 OpenClaw E2E 容器、在兼容的通道之间共享提供商 CLI 工具缓存，并且在首次失败后停止调度新的池化通道，除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`。如果某个通道在低并行度主机上超过有效权重/资源上限，它仍可从空池启动并独占运行，直到释放容量。每通道日志、`summary.json`、`failures.json` 和阶段计时会写入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 检查缓慢通道，并使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 输出开销较低的定向重跑命令。

### 值得注意的 Docker 通道

| 命令                                                                     | 验证内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | 基于 Chromium 的源码 E2E 容器，使用原始 CDP + 隔离的 Gateway 网关；`browser doctor --deep` CDP 角色快照包含链接 URL、由光标提升为可点击项的元素、iframe 引用和框架元数据。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | 使用 `skills.install.allowUploadedArchives: false` 在纯净的 Docker 运行器中安装打包后的 tarball，通过实时 ClawHub 搜索解析当前技能 slug，使用 `openclaw skills install` 安装，并验证 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 和 `skills info --json`。                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | 聚焦 CLI 后端的实时探测；Gemini 提供对应的 `:resume` 和 `:mcp` 别名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | Docker 化的 OpenClaw + Open WebUI：登录、检查 `/api/models`，并通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型密钥，并会拉取外部镜像；不像单元/E2E 套件那样预期能在 CI 中保持稳定。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | 预置数据的 Gateway 网关容器，以及一个生成 `openclaw mcp serve` 的客户端容器：验证路由会话发现、转录记录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio 桥接器传递的 Claude 风格渠道 + 权限通知（断言直接读取原始 stdio MCP 帧）。                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | 在包含旧用户脏数据的夹具上安装打包后的 tarball，在没有实时提供商/渠道密钥的情况下执行软件包更新和非交互式 Doctor，启动 local loopback Gateway 网关，并检查智能体/渠道配置/插件允许列表/工作区/会话文件/过期旧版插件依赖状态/启动/RPC 状态是否保持完好。                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | 默认安装 `openclaw@latest`，预置真实的现有用户文件，通过内置的 `openclaw config set` 配方进行配置，更新到打包后的 tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，并检查 `/healthz`、`/readyz` 和 RPC 状态。可使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖、使用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 扩展矩阵，或使用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景夹具（包括 `configured-plugin-installs` 和 `stale-source-plugin-shadow`）。Package Acceptance 将这些公开为 `published_upgrade_survivor_baseline(s)` / `_scenarios`，并解析 `last-stable-4` 或 `all-since-2026.4.23` 等元令牌。 |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` 场景中的已发布版本升级存续验证工具，默认从 `openclaw@2026.4.23` 开始。`Update Migration` 工作流通过 `baselines=all-since-2026.4.23` 扩展此验证，以证明 Full Release CI 之外的已配置插件依赖清理。                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | 针对本地路径、`file:`、依赖提升的 npm 注册表软件包、Git 移动引用、ClawHub 夹具、市场更新，以及 Claude bundle 启用/检查的安装/更新冒烟测试。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## 本地 PR 门禁

对于本地 PR 落地/门禁检查，请运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在高负载主机上偶发失败，请先重跑一次，再将其视为回归，然后使用 `pnpm test <path/to/test>` 进行隔离。对于内存受限的主机：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 测试性能工具

- `pnpm test:perf:imports`：启用 Vitest 导入时长 + 导入明细报告，同时仍对显式文件/目录目标使用限定范围的通道路由。`pnpm test:perf:imports:changed` 将相同的性能分析限定到自 `origin/main` 以来发生更改的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 针对同一已提交的 Git 差异，对比基于路由的变更模式路径与原生根项目运行的基准性能；`pnpm test:perf:changed:bench -- --worktree` 对当前工作树的变更集进行基准测试，无需先提交。
- `pnpm test:perf:profile:main` 为 Vitest 主线程写入 CPU 性能分析文件（`.artifacts/vitest-main-profile`）；`pnpm test:perf:profile:runner` 为单元测试运行器写入 CPU + 堆性能分析文件（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整套件的 Vitest 叶级配置，并写入分组时长数据以及每个配置的 JSON/日志工件。完整套件报告默认隔离文件，因此不会将先前文件保留的模块图和 GC 暂停计入后续断言；仅在有意分析共享工作进程的累积情况时传递 `-- --no-isolate`。测试性能智能体在尝试修复慢速测试前，会将此作为基线。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` 比较性能专项更改前后的分组报告。
- 完整套件、扩展和包含模式的分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；后续的完整配置运行会使用这些计时来平衡慢速与快速分片。包含模式的 CI 分片会将分片名称追加到计时键中，从而使过滤后的分片计时保持可见，而不会替换完整配置的计时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时工件。

## 基准测试

<Accordion title="模型延迟（scripts/bench-model.ts）">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。默认提示词：“只回复一个单词：ok。不要使用标点或额外文本。”

</Accordion>

<Accordion title="CLI 启动（scripts/bench-cli-startup.ts）">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

预设：

- `startup`：`--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`：`health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`：同时组合使用两个预设

输出包含 `sampleCount`、平均值、p50、p95、最小值/最大值、退出代码/信号分布，以及每个命令的最大 RSS。`--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 性能分析文件。

保存的输出：`pnpm test:startup:bench:smoke` 写入 `.artifacts/cli-startup-bench-smoke.json`；`pnpm test:startup:bench:save` 写入 `.artifacts/cli-startup-bench-all.json`（`runs=5 warmup=1`）。签入的固件：`test/fixtures/cli-startup-bench.json`，由 `pnpm test:startup:bench:update` 刷新，并由 `pnpm test:startup:bench:check` 进行比较。

</Accordion>

<Accordion title="Gateway 网关启动（scripts/bench-gateway-startup.ts）">

默认使用 `dist/entry.js` 中已构建的 CLI 入口；请先运行 `pnpm build`。传入 `--entry scripts/run-node.mjs` 可改为测量源码运行器，并将这些结果与已构建入口的基线分开保存。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

用例 ID：`default`、`skipChannels`（跳过渠道启动）、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins`（50 个清单插件）、`fiftyStartupLazyPlugins`（50 个启动时延迟加载的清单插件）。

输出包含首个进程输出、`/healthz`、`/readyz`、HTTP 监听日志时间、Gateway 网关就绪日志时间、CPU 时间、CPU 核心比率、最大 RSS、堆、启动跟踪指标、事件循环延迟以及插件查找表的详细指标。该脚本会在子 Gateway 网关环境中设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

`/healthz` 表示存活状态（HTTP 服务器能够响应）。`/readyz` 表示可用就绪状态（启动插件的 sidecar、渠道以及挂载后影响就绪的关键工作均已稳定）。启动钩子以异步方式分派，不属于就绪保证的一部分。就绪日志时间是 Gateway 网关的内部时间戳，可用于进程侧归因，但不能替代外部 `/readyz` 探测。

比较更改时，请使用 JSON 输出或 `--output`。仅当跟踪输出指向导入、编译或 CPU 密集型工作，而仅靠阶段计时无法解释时，才使用 `--cpu-prof-dir`。

</Accordion>

<Accordion title="Gateway 网关重启（scripts/bench-gateway-restart.ts）">

仅支持 macOS 和 Linux（使用 SIGUSR1 进行进程内重启；在 Windows 上会立即失败）。与上述 Gateway 网关启动测试使用相同的已构建入口默认值和 `--entry scripts/run-node.mjs` 覆盖选项。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

用例 ID：`skipChannels`、`skipChannelsAcpxProbe`（启用 ACPX 启动探测）、`skipChannelsNoAcpxProbe`（禁用探测）、`default`、`fiftyPlugins`。

输出包含下一次 `/healthz`、下一次 `/readyz`、停机时间、重启就绪计时、CPU、RSS、替换进程的启动跟踪指标，以及信号处理、活动工作排空、关闭阶段、下一次启动、就绪计时和内存快照的重启跟踪指标。该脚本会设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 和 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

当更改涉及重启信号、关闭处理程序、重启后启动、sidecar 关闭、服务交接或重启后就绪状态时，请使用此基准测试。首先使用 `skipChannels` 将 Gateway 网关机制与渠道启动隔离；只有当该窄范围用例能够解释重启路径后，才使用 `default` 或插件密集型用例。跟踪指标是归因线索，而非结论——应根据多个样本、相匹配的所有者跨度、`/healthz`/`/readyz` 行为以及用户可见的重启契约来判断重启更改。

</Accordion>

## 新手引导 E2E（Docker）

可选；仅容器化新手引导冒烟测试需要。在全新 Linux 容器中执行完整的冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保维护的 QR 运行时辅助程序能够在受支持的 Docker Node 运行时下加载（默认 Node 24，兼容 Node 22）：

```bash
pnpm test:docker:qr
```

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)

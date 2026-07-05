---
read_when:
    - 运行或修复测试
summary: 如何在本地运行测试（vitest）以及何时使用 force/coverage 模式
title: 测试
x-i18n:
    generated_at: "2026-07-05T17:41:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17e8128198bea80e83a74cfbeb0a63056e7913ce4c7b6f976b4ec929fcfe493d
    source_path: reference/test.md
    workflow: 16
---

- 完整测试工具包（套件、实时、Docker）：[测试](/zh-CN/help/testing)
- 更新和插件包验证：[更新和插件测试](/zh-CN/help/testing-updates-plugins)

## 智能体默认设置

智能体会话通过 Crabbox 远程运行测试和计算密集型验证。受信任的维护者代码默认使用 Blacksmith Testbox。配置的 Testbox 工作流会注入凭据，因此不受信任的贡献者或 fork 代码必须改用无密钥的 fork CI 或经过清理的直连 AWS Crabbox。

当受信任的代码任务很可能需要测试或重量级证明时，立即在后台命令会话中预热，在注入期间继续工作，复用返回的 `tbx_...` id，每次运行都同步当前 checkout，并在交接前停止它：

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

下面的本地测试命令用于人工工作流，或用户明确请求的智能体回退路径。必须报告远程提供商不可用；这并不表示可以静默运行宽泛的本地门禁。

对于不受信任的代码，使用 `--provider aws` 预热。每次运行都必须设置 `CRABBOX_ENV_ALLOW=CI`，传入 `--provider aws --no-hydrate`，并在安装依赖或运行测试前使用全新的临时远程 `HOME`。使用专门为该不受信任来源新预热的租约；绝不要复用受信任或之前已注入凭据的租约。从干净受信任的 `main` checkout 启动已安装的受信任 Crabbox 二进制文件，并只用 `--fresh-pr` 获取远程 PR；绝不要在本地执行不受信任 checkout 的包装器或配置。取消设置 `CRABBOX_AWS_INSTANCE_PROFILE`，并在解析出的 `aws.instanceProfile` 非空时失败关闭。在任何安装/测试之前，使用受信任的绝对路径工具要求 IMDSv2 令牌，证明 IAM 凭据端点返回 404，并验证远程 `git rev-parse HEAD` 等于已审查 PR head 的完整 SHA。将租约绑定到该 SHA，并在 head 变化时停止/重新预热。从干净的 `main` 随 `--fresh-pr` 上传受信任的 `scripts/crabbox-untrusted-bootstrap.sh`；它会安装固定版本的 Node/pnpm，验证 SHA 和包管理器固定版本，隔离 `HOME`，安装依赖，然后执行请求的测试。如果 broker 无法证明没有角色或没有远程 PR，请使用无密钥的 fork CI。不要使用 `hydrate-github`、`--no-sync` 或注入了凭据的 Testbox 工作流。
取消设置所有 `CRABBOX_TAILSCALE*` 覆盖，强制 `--network public
--tailscale=false`，清除 exit-node/LAN 标志，并要求 `crabbox inspect` 在上传任何脚本之前报告公共网络且没有 Tailscale 状态。

## 常规本地顺序

1. `pnpm test:changed` 用于变更范围的 Vitest 证明。
2. `pnpm test <path-or-filter>` 用于单个文件、目录或明确目标。
3. 仅当你有意需要完整本地 Vitest 套件时，才运行 `pnpm test`。

在 Codex worktree 或链接/稀疏 checkout 中，智能体避免直接本地运行 `pnpm test*` / `pnpm check*` / `pnpm crabbox:run`：

- 用户明确请求的极小文件本地回退：
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 变更门禁或宽泛证明：`node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`，这样 pnpm 会在 Testbox 内运行。
- 包装器最终的 `exitCode` 和 timing JSON 是命令结果。委托的 Blacksmith GitHub Actions 运行可能在成功的 SSH 命令后显示 `cancelled`，因为 Testbox 是从 keepalive action 外部停止的；在将其视为失败前，检查包装器摘要和命令输出。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：对于 `pnpm check:changed` 和定向 `pnpm test ...` 等命令，将 heavy-check 串行化限制在当前 worktree 内，而不是 Git common dir。仅当你有意在高容量本地主机上跨链接 worktree 运行独立检查时使用它。

## 核心命令

测试包装器运行结束时会带有简短的 `[test] passed|failed|skipped ... in ...` 摘要；Vitest 自己的耗时行仍作为每个分片的细节。

| 命令                                              | 作用                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 明确的文件/目录目标会通过作用域 Vitest lane 路由。无目标运行是全套件证明：固定分片组会展开为叶级配置以进行本地并行执行，并在开始前打印预期分片 fanout。extension 组始终展开为每个 extension 的分片配置，而不是一个巨大的根项目进程。 |
| `pnpm test:changed`                               | 低成本的智能变更测试运行：从直接测试编辑、同级 `*.test.ts` 文件、明确源映射和本地导入图得到精确目标。宽泛/config/package 变更会被跳过，除非它们映射到精确测试。                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 明确的宽泛变更测试运行；当测试 harness/config/package 编辑应回退到 Vitest 更宽泛的变更测试行为时使用。                                                                                                                                                                                 |
| `pnpm test:force`                                 | 释放配置的 OpenClaw Gateway 网关端口（默认 `18789`），然后使用隔离的 Gateway 网关端口运行完整套件，这样服务器测试不会与正在运行的实例冲突。                                                                                                                                             |
| `pnpm test:coverage`                              | 带 V8 覆盖率的单元套件（`vitest.unit.config.ts`）。这是默认单元 lane 门禁，不是整个仓库覆盖率：`coverage.all` 为 `false`，阈值为行/函数/语句 70%、分支 55%，范围限定为带同级源文件的非 fast 单元测试。                                                                               |
| `pnpm test:coverage:changed`                      | 仅对自 `origin/main` 以来变更的文件运行单元覆盖率。                                                                                                                                                                                                                                                                                                   |
| `pnpm changed:lanes`                              | 显示相对 `origin/main` 的 diff 触发的架构 lane。                                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | 在 CI 外默认委托给 Crabbox/Testbox，然后在远程子进程内运行智能变更检查门禁：受影响 lane 的 typecheck、lint 和 guard 命令。不运行 Vitest；如需测试证明，请使用 `pnpm test:changed` 或 `pnpm test <target>`。                                                                          |

## 共享测试状态和进程辅助工具

- `src/test-utils/openclaw-test-state.ts`：当测试需要隔离的 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、配置 fixture、工作区、智能体目录或 auth-profile 存储时，在 Vitest 中使用。
- `pnpm test:env-mutations:report`：非阻塞报告，列出直接修改 `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR` 或相关环境键的测试/harness。用它查找可迁移到共享测试状态辅助工具的候选项。
- `test/helpers/openclaw-test-instance.ts`：供需要运行中 Gateway 网关、CLI 环境、日志捕获和集中清理的进程级 E2E 测试使用。
- source `scripts/lib/docker-e2e-image.sh` 的 Docker/Bash E2E lane 可以将 `docker_e2e_test_state_shell_b64 <label> <scenario>` 传入容器，并用 `scripts/lib/openclaw-e2e-instance.sh` 解码；多 home 脚本可以传入 `docker_e2e_test_state_function_b64`，并在每个流程中调用 `openclaw_test_state_create <label> <scenario>`。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` 会写入可 source 的主机环境文件（`create` 前的 `--` 会阻止较新的 Node 运行时将 `--env-file` 视为 Node 标志）。启动 Gateway 网关的 lane 可以 source `scripts/lib/openclaw-e2e-instance.sh`，用于入口点解析、模拟 OpenAI 启动、前台/后台启动、就绪探针、状态环境导出、日志转储和进程清理。

## Control UI、TUI 和 extension lane

- **Control UI 模拟 E2E：**`pnpm test:ui:e2e` 运行 Vitest + Playwright lane，该 lane 启动 Vite Control UI，并驱动真实 Chromium 页面连接到模拟的 Gateway 网关 WebSocket。测试位于 `ui/src/**/*.e2e.test.ts`；共享 mock/控件位于 `ui/src/test-helpers/control-ui-e2e.ts`。`pnpm test:e2e` 包含此 lane。智能体运行默认使用 Testbox/Crabbox，包括定向证明；仅在明确本地回退时使用 `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts`。
- **TUI PTY 测试：**`node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` 运行快速的 fake-backend PTY lane。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` 或 `pnpm tui:pty:test:watch --mode local` 运行较慢的 `tui --local` smoke，它只模拟外部模型端点。断言稳定的可见文本或 fixture 调用，而不是原始 ANSI 快照。
- `pnpm test:extensions` 和 `pnpm test extensions` 运行所有 extension/plugin 分片。重量级渠道插件、浏览器插件和 OpenAI 作为专用分片运行；其他插件组保持批处理。`pnpm test extensions/<id>` 运行一个内置插件 lane。
- 带有同级测试的源文件会先映射到该同级测试，然后再回退到更宽的目录 glob。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers` 和 `src/plugins/contracts` 下的辅助工具编辑会使用本地导入图运行导入它们的测试，而不是在依赖路径精确时宽泛运行每个分片。
- `auto-reply` 拆分为三个专用配置（`core`、`top-level`、`reply`），这样 reply harness 不会压过较轻的顶层状态/token/辅助工具测试。
- 选定的 `plugin-sdk` 和 `commands` 测试文件会路由到专用轻量 lane，这些 lane 只保留 `test/setup.ts`，将运行时重量级案例留在其现有 lane 上。
- 基础 Vitest 配置默认为 `pool: "threads"` 和 `isolate: false`，并在仓库配置中启用共享的非隔离 runner。
- `pnpm test:channels` 运行 `vitest.channels.config.ts`。

## Gateway 网关和 E2E

- Gateway 网关集成是可选启用的：`OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` 或 `pnpm test:gateway`。
- `pnpm test:e2e`：仓库 E2E 聚合 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`：Gateway 网关端到端冒烟测试（多实例 WS/HTTP/节点配对）。默认在 `vitest.e2e.config.ts` 中使用 `threads` + `isolate: false` 和自适应 worker；用 `OPENCLAW_E2E_WORKERS=<n>` 调整，用 `OPENCLAW_E2E_VERBOSE=1` 启用详细日志。
- `pnpm test:live`：提供商实时测试（Claude/Minimax/DeepSeek/z.ai 等，由 `*.live.test.ts` 控制）。需要 API 密钥和 `LIVE=1`（或 `OPENCLAW_LIVE_TEST=1`）才能取消跳过；用 `OPENCLAW_LIVE_TEST_QUIET=0` 输出详细内容。

## 完整 Docker 套件（`pnpm test:docker:all`）

构建共享实时测试镜像，将 OpenClaw 打包一次为 npm tar 包，构建/复用一个裸 Node/Git runner 镜像，以及一个把该 tar 包安装到 `/app` 的功能镜像，然后通过加权调度器运行 Docker 冒烟测试通道。`scripts/package-openclaw-for-docker.mjs` 是唯一的本地/CI 包打包器，并会在 Docker 使用之前验证 tar 包和 `dist/postinstall-inventory.json`。

- 裸镜像（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）：安装器/更新/插件依赖测试通道；挂载预构建 tar 包，而不是复制的仓库源代码。
- 功能镜像（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）：普通已构建应用功能测试通道。
- 测试通道定义：`scripts/lib/docker-e2e-scenarios.mjs`。规划器：`scripts/lib/docker-e2e-plan.mjs`。执行器：`scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` 会输出由调度器拥有的 CI 计划（测试通道、镜像类型、包/实时镜像需求、状态场景、凭据检查），不会构建或运行 Docker。

调度调节项（环境变量，括号内为默认值）：

| 环境变量                                                                                                        | 默认值              | 用途                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | 进程槽位。                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | 对提供商敏感的尾部池。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 重型实时提供商测试通道上限。                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm 资源测试通道上限。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | 服务资源测试通道上限。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | 每个提供商的重型测试通道上限。                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | 更窄的每提供商上限。                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | 用于更大主机的覆盖值。                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | 测试通道启动之间的延迟，避免本地 Docker daemon 创建风暴。                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000（120 分钟） | 每个测试通道的回退超时；选定的实时/尾部测试通道使用更严格的上限。                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 瞬时实时提供商失败的重试次数。                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | 关闭                | 打印测试通道清单，但不运行 Docker。                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | 活跃测试通道状态打印间隔。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | 开启                | 复用 `.artifacts/docker-tests/lane-timings.json` 进行最长优先排序；设为 `0` 可禁用。                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` 表示仅运行确定性/本地测试通道，`only` 表示仅运行实时提供商测试通道。别名：`pnpm test:docker:local:all`、`pnpm test:docker:live:all`。仅实时模式会把主实时测试通道和尾部实时测试通道合并为一个最长优先池，让提供商桶把 Claude/Codex/Gemini 工作打包在一起。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI 后端 Docker 设置超时。                                                                                                                                                                                                                                                                 |

资源上限的环境变量模式为 `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`（资源名称大写，非字母数字字符折叠为 `_`）。

其他行为：runner 默认会预检 Docker，清理过期的 OpenClaw E2E 容器，在兼容测试通道之间共享提供商 CLI 工具缓存，并在第一次失败后停止调度新的池化测试通道，除非设置了 `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`。如果某个测试通道在低并行度主机上超过有效的权重/资源上限，它仍然可以从空池启动并独占运行，直到释放容量。每个测试通道的日志、`summary.json`、`failures.json` 和阶段耗时会写入 `.artifacts/docker-tests/<run-id>/`；使用 `pnpm test:docker:timings <summary.json>` 检查慢测试通道，使用 `pnpm test:docker:rerun <run-id|summary.json|failures.json>` 打印低成本的定向重跑命令。

### 重要 Docker 测试通道

| 命令                                                                        | 验证                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | 基于 Chromium 的源端到端容器，使用原始 CDP + 隔离的 Gateway 网关；`browser doctor --deep` CDP 角色快照包含链接 URL、由光标提升的可点击项、iframe 引用和框架元数据。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | 在裸 Docker 运行器中安装打包后的 tarball，并设置 `skills.install.allowUploadedArchives: false`，从实时 ClawHub 搜索中解析当前 Skills slug，通过 `openclaw skills install` 安装，并验证 `SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json` 和 `skills info --json`。                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | 聚焦的 CLI 后端实时探测；Gemini 有对应的 `:resume` 和 `:mcp` 别名。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:openwebui`                                                | Docker 化的 OpenClaw + Open WebUI：登录、检查 `/api/models`，通过 `/api/chat/completions` 运行一次真实的代理聊天。需要可用的实时模型密钥并拉取外部镜像；不预期像单元/端到端套件那样在 CI 中稳定。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | 已播种的 Gateway 网关容器，加上一个生成 `openclaw mcp serve` 的客户端容器：路由式对话发现、转录读取、附件元数据、实时事件队列行为、出站发送路由，以及通过真实 stdio 桥接传递的 Claude 风格渠道 + 权限通知（断言会直接读取原始 stdio MCP 帧）。                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | 将打包后的 tarball 安装到脏旧用户夹具之上，运行包更新和非交互式 Doctor（不使用实时提供商/渠道密钥），启动环回 Gateway 网关，并检查智能体/渠道配置/插件 allowlist/工作区/会话文件/陈旧旧版插件依赖状态/启动/RPC 状态是否保留。                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:published-upgrade-survivor`                               | 默认安装 `openclaw@latest`，播种真实的现有用户文件，通过内置的 `openclaw config set` 配方配置，更新到打包后的 tarball，运行非交互式 Doctor，写入 `.artifacts/upgrade-survivor/summary.json`，检查 `/healthz`、`/readyz`、RPC 状态。可用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` 覆盖，用 `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` 扩展矩阵，或用 `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 添加场景夹具（包含 `configured-plugin-installs` 和 `stale-source-plugin-shadow`）。Package Acceptance 将这些公开为 `published_upgrade_survivor_baseline(s)` / `_scenarios`，并解析 `last-stable-4` 或 `all-since-2026.4.23` 等元令牌。 |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` 场景中的已发布升级幸存者 harness，默认从 `openclaw@2026.4.23` 开始。`Update Migration` 工作流使用 `baselines=all-since-2026.4.23` 扩展它，以证明完整发布 CI 之外的已配置插件依赖清理。                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:plugins`                                                  | 针对本地路径、`file:`、带提升依赖的 npm registry 包、git 移动引用、ClawHub 夹具、marketplace 更新，以及 Claude bundle 启用/检查的安装/更新冒烟测试。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## 本地 PR 门禁

对于本地 PR 落地/门禁检查，运行：

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

如果 `pnpm test` 在负载较高的主机上出现不稳定失败，请在将其视为回归前重跑一次，然后用 `pnpm test <path/to/test>` 隔离。对于内存受限的主机：

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## 测试性能工具

- `pnpm test:perf:imports`：启用 Vitest 导入耗时 + 导入拆分报告，同时仍对显式文件/目录目标使用限定范围的 lane 路由。`pnpm test:perf:imports:changed` 将相同的性能分析限定到自 `origin/main` 以来变更的文件。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对同一个已提交的 git diff，将路由后的 changed-mode 路径与原生根项目运行进行基准测试；`pnpm test:perf:changed:bench -- --worktree` 会在无需先提交的情况下，对当前工作树变更集进行基准测试。
- `pnpm test:perf:profile:main` 为 Vitest 主线程写入 CPU profile（`.artifacts/vitest-main-profile`）；`pnpm test:perf:profile:runner` 为单元运行器写入 CPU + heap profiles（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`：串行运行每个完整套件 Vitest 叶子配置，并写入分组耗时数据以及每个配置的 JSON/日志 artifacts。完整套件报告默认按文件隔离，因此早期文件保留的模块图和 GC 暂停不会计入后续断言；仅在有意分析共享 worker 累积时才传入 `-- --no-isolate`。测试性能智能体在尝试修复慢测试前会将其用作基线。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` 会在面向性能的变更后比较分组报告。
- 完整、插件和 include-pattern 分片运行会更新 `.artifacts/vitest-shard-timings.json` 中的本地计时数据；之后的整个配置运行会使用这些计时来平衡慢速和快速分片。Include-pattern CI 分片会将分片名称追加到计时键，这会让过滤后的分片计时可见，同时不替换整个配置的计时数据。设置 `OPENCLAW_TEST_PROJECTS_TIMINGS=0` 可忽略本地计时 artifact。

## 基准测试

<Accordion title="模型延迟（scripts/bench-model.ts）">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。默认提示词：“用一个单词回复：ok。不要标点或额外文本。”

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

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 两个预设的组合

输出包含每个命令的 `sampleCount`、平均值、p50、p95、最小/最大值、退出码/信号分布，以及最大 RSS。`--cpu-prof-dir` / `--heap-prof-dir` 会为每次运行写入 V8 配置文件。

保存的输出：`pnpm test:startup:bench:smoke` 写入 `.artifacts/cli-startup-bench-smoke.json`；`pnpm test:startup:bench:save` 写入 `.artifacts/cli-startup-bench-all.json`（`runs=5 warmup=1`）。检入的夹具：`test/fixtures/cli-startup-bench.json`，由 `pnpm test:startup:bench:update` 刷新，由 `pnpm test:startup:bench:check` 比较。

</Accordion>

<Accordion title="Gateway startup (scripts/bench-gateway-startup.ts)">

默认使用构建后的 CLI 入口 `dist/entry.js`；请先运行 `pnpm build`。传入 `--entry scripts/run-node.mjs` 可改为测量源码运行器，并将这些结果与构建入口基线分开保存。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

用例 ID：`default`、`skipChannels`（跳过渠道启动）、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins`（50 个清单插件）、`fiftyStartupLazyPlugins`（50 个启动延迟清单插件）。

输出包含首次进程输出、`/healthz`、`/readyz`、HTTP 监听日志时间、Gateway 网关就绪日志时间、CPU 时间、CPU 核心比率、最大 RSS、堆、启动追踪指标、事件循环延迟，以及插件查找表详细指标。该脚本会在子 Gateway 网关环境中设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`。

`/healthz` 是存活性（HTTP 服务器可以响应）。`/readyz` 是可用就绪性（启动插件 sidecar、渠道和就绪关键的附加后工作已经稳定）。启动钩子会异步分发，不属于就绪性保证的一部分。就绪日志时间是 Gateway 网关的内部时间戳，适合用于进程侧归因，但不能替代外部 `/readyz` 探针。

比较变更时使用 JSON 输出或 `--output`。只有在追踪输出指向导入、编译或 CPU 密集型工作，而阶段计时本身无法解释时，才使用 `--cpu-prof-dir`。

</Accordion>

<Accordion title="Gateway restart (scripts/bench-gateway-restart.ts)">

仅限 macOS 和 Linux（使用 SIGUSR1 进行进程内重启；在 Windows 上会立即失败）。与上面的 Gateway 网关启动相同，默认使用构建入口，并可通过 `--entry scripts/run-node.mjs` 覆盖。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

用例 ID：`skipChannels`、`skipChannelsAcpxProbe`（开启 ACPX 启动探针）、`skipChannelsNoAcpxProbe`（关闭探针）、`default`、`fiftyPlugins`。

输出包含下一次 `/healthz`、下一次 `/readyz`、停机时间、重启就绪计时、CPU、RSS、替换进程的启动追踪指标，以及信号处理、活动工作清空、关闭阶段、下一次启动、就绪计时和内存快照的重启追踪指标。该脚本会设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 和 `OPENCLAW_GATEWAY_RESTART_TRACE=1`。

当变更涉及重启信号、关闭处理器、重启后启动、sidecar 关闭、服务交接或重启后的就绪性时，使用此基准。先从 `skipChannels` 开始，将 Gateway 网关机制与渠道启动隔离；只有在窄用例解释了重启路径之后，才使用 `default` 或插件较多的用例。追踪指标是归因提示，不是结论；判断重启变更时，应基于多个样本、匹配的所有者跨度、`/healthz`/`/readyz` 行为，以及用户可见的重启契约。

</Accordion>

## 新手引导 E2E（Docker）

可选；仅容器化新手引导冒烟测试需要。在干净的 Linux 容器中运行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动 Gateway 网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保维护中的 QR 运行时辅助工具可在受支持的 Docker Node 运行时下加载（Node 24 默认，Node 22 兼容）：

```bash
pnpm test:docker:qr
```

## 相关

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)
- [更新和插件测试](/zh-CN/help/testing-updates-plugins)

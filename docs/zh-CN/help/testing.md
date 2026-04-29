---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商 bug 添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元/e2e/live 套件、Docker 运行器，以及每项测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-29T04:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2a7f6b046e845f0c1823923090f90b3c246357ee54835a6561dee128d7f1cfc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw 有三个 Vitest 套件（单元/集成、e2e、实时）和一小组
Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个套件覆盖什么（以及它刻意 _不_ 覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- 实时测试如何发现凭据并选择模型/提供商。
- 如何为真实世界的模型/提供商问题添加回归测试。

<Note>
**QA 栈（qa-lab、qa-channel、实时传输通道）** 另有单独文档：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 架构、命令界面、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的参考。
- [QA channel](/zh-CN/channels/qa-channel) — 由仓库支持的场景使用的合成传输插件。

本页涵盖运行常规测试套件和 Docker/Parallels 运行器。下面的 QA 专用运行器部分（[QA 专用运行器](#qa-specific-runners)）列出了具体的 `qa` 调用，并指回上面的参考资料。
</Note>

## 快速开始

大多数时候：

- 完整门禁（推送前预期运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快地运行本地完整套件：`pnpm test:max`
- 直接 Vitest 监视循环：`pnpm test:watch`
- 直接文件定位现在也会路由扩展/渠道路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败时，优先运行有针对性的命令。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你修改测试或想获得额外信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 套件：`pnpm test:e2e`

调试真实提供商/模型时（需要真实凭据）：

- 实时套件（模型 + Gateway 网关工具/图片探测）：`pnpm test:live`
- 静默定位一个实时文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker 实时模型扫描：`pnpm test:docker:live-models`
  - 每个选中的模型现在都会运行一个文本轮次，以及一个小型文件读取风格探测。
    元数据声明支持 `image` 输入的模型还会运行一个极小的图片轮次。
    在隔离提供商失败时，可用 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用额外探测。
  - CI 覆盖：每日 `OpenClaw Scheduled Live And E2E Checks` 和手动
    `OpenClaw Release Checks` 都会使用 `include_live_suites: true` 调用可复用的实时/E2E 工作流，其中包含按提供商分片的独立 Docker 实时模型
    矩阵作业。
  - 如需聚焦的 CI 重跑，使用 `include_live_suites: true` 和 `live_models_only: true` 分派 `OpenClaw Live And E2E Checks (Reusable)`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`，
    以及 `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 和其
    计划/发布调用方。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 针对 Codex 应用服务器路径运行一个 Docker 实时通道，绑定一个带 `/codex bind` 的合成
    Slack 私信，执行 `/codex fast` 和
    `/codex permissions`，然后验证普通回复和图片附件
    通过原生插件绑定路由，而不是 ACP。
- Codex 应用服务器测试框架冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件自有的 Codex 应用服务器测试框架运行 Gateway 网关智能体轮次，
    验证 `/codex status` 和 `/codex models`，默认还执行图片、
    cron MCP、子智能体和 Guardian 探测。在隔离其他 Codex
    应用服务器失败时，可用
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探测。对于聚焦的子智能体检查，禁用其他探测：
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    这会在子智能体探测后退出，除非设置了
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 面向消息渠道救援命令界面的可选双保险检查。
    它会执行 `/crestodian status`，排队一个持久模型
    变更，回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian 规划器 Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在无配置容器中运行 Crestodian，并在 `PATH`
    上放置一个假的 Claude CLI，然后验证模糊规划器回退会转换为带审计的类型化
    配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录开始，将裸 `openclaw` 路由到
    Crestodian，应用设置/模型/智能体/Discord 插件 + SecretRef 写入，
    验证配置，并验证审计条目。同一个 Ring 0 设置路径也在 QA Lab 中由
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行
  `openclaw models list --provider moonshot --json`，然后针对
  `moonshot/kimi-k2.6` 运行一个隔离的
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告 Moonshot/K2.6，并且助手转录存储了规范化的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先通过下方描述的允许列表环境变量缩小实时测试范围。
</Tip>

## QA 专用运行器

当你需要 QA-lab 真实性时，这些命令与主测试套件并列使用：

CI 在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上运行，并可通过手动分派使用模拟提供商运行。`QA-Lab - All Lanes` 每晚在
`main` 上运行，也可通过手动分派运行，包含模拟一致性门禁、实时 Matrix 通道、
Convex 管理的实时 Telegram 通道，以及 Convex 管理的实时 Discord 通道作为
并行作业。计划 QA 和发布检查会显式传递 Matrix `--profile fast`，
而 Matrix CLI 和手动工作流输入默认仍为
`all`；手动分派可以将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、
`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 会在发布批准前运行一致性检查以及
快速 Matrix 和 Telegram 通道，发布传输检查使用
`mock-openai/gpt-5.5`，以保持确定性并避免常规提供商插件启动。这些实时传输 Gateway 网关会禁用
内存搜索；内存行为仍由 QA 一致性套件覆盖。

完整发布实时媒体分片使用
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`，其中已经包含
`ffmpeg` 和 `ffprobe`。Docker 实时模型/后端分片使用共享的
`ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像，该镜像会针对每个选定
提交构建一次，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 拉取它，而不是在每个分片中重新构建。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认使用隔离的 Gateway 网关工作进程并行运行多个选中的场景。
    `qa-channel` 默认并发数为 4（受选中场景数量限制）。使用 `--concurrency <count>` 调整工作进程
    数量，或使用 `--concurrency 1` 进入较旧的串行通道。
  - 任一场景失败时以非零状态退出。当你想要产物但不想要失败退出码时，使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动本地 AIMock 支持的提供商服务器，用于实验性
    固件和协议模拟覆盖，而不替换感知场景的
    `mock-openai` 通道。
- `pnpm test:gateway:cpu-scenarios`
  - 运行 Gateway 网关启动基准测试以及一个小型模拟 QA Lab 场景包
    （`channel-chat-baseline`、`memory-failure-fallback`、
    `gateway-restart-inflight-run`），并在 `.artifacts/gateway-cpu-scenarios/` 下写入合并 CPU 观测
    摘要。
  - 默认只标记持续的高 CPU 观测（`--cpu-core-warn`
    加 `--hot-wall-warn-ms`），因此短暂启动峰值会作为指标记录，
    而不会看起来像持续数分钟的 Gateway 网关占满 CPU 回归。
  - 使用构建后的 `dist` 产物；当检出内容尚无新的运行时输出时，先运行构建。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行同一个 QA 套件。
  - 保持与主机上的 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - 实时运行会转发对 guest 可行的受支持 QA 认证输入：
    基于环境的提供商密钥、QA 实时提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，以便 guest 可以通过挂载的工作区写回。
  - 在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装它，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，
    验证启用插件会按需安装运行时依赖项，运行 Doctor，并针对模拟的 OpenAI
    端点运行一个本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 以 Discord 运行同一个打包安装
    通道。
- `pnpm test:docker:session-runtime-context`
  - 针对嵌入式运行时上下文转录运行确定性的已构建应用 Docker 冒烟测试。
    它验证隐藏的 OpenClaw 运行时上下文会作为非显示自定义消息持久化，而不是泄漏进可见的用户轮次，
    然后植入一个受影响的损坏会话 JSONL，并验证
    `openclaw doctor --fix` 会将其重写到活动分支并创建备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 候选包，运行已安装包
    新手引导，通过已安装的 CLI 配置 Telegram，然后复用
    实时 Telegram QA 通道，并将该已安装包作为被测系统 Gateway 网关。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或
    `OPENCLAW_CURRENT_PACKAGE_TGZ` 来测试已解析的本地 tarball，而不是
    从 registry 安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境凭据或 Convex 凭据来源。对于 CI/发布自动化，设置
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及
    `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果
    `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥在 CI 中存在，
    Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为此通道覆盖共享的
    `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将此通道暴露为手动维护者工作流
    `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用
    `qa-live-shared` 环境和 Convex CI 凭据租约。
- GitHub Actions 还暴露 `Package Acceptance`，用于针对一个候选包进行旁路产品证明。
  它接受可信 ref、已发布 npm 规范、
  HTTPS tarball URL 加 SHA-256，或来自另一次运行的 tarball 产物，上传
  规范化的 `openclaw-current.tgz` 作为 `package-under-test`，然后使用 smoke、package、product、full 或 custom
  通道配置文件运行现有 Docker E2E 调度器。设置 `telegram_mode=mock-openai` 或 `live-frontier`，可针对同一个 `package-under-test` 产物运行
  Telegram QA 工作流。
  - 最新 beta 产品证明：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精确 tarball URL 证明需要摘要：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 制品证明会从另一个 Actions 运行下载 tarball 制品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过配置编辑启用内置渠道/插件。
  - 验证设置发现会让未配置的插件运行时依赖保持缺失，首次配置的 Gateway 网关或 Doctor 运行会按需安装每个内置插件的运行时依赖，并且第二次重启不会重新安装已激活的依赖。
  - 还会安装一个已知较旧的 npm 基线，在运行 `openclaw update --tag <candidate>` 前启用 Telegram，并验证候选版本的更新后 Doctor 会修复内置渠道运行时依赖，而不需要 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 跨 Parallels 客户机运行原生打包安装更新 smoke。每个选中的平台会先安装请求的基线包，然后在同一客户机中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新 Status、Gateway 网关就绪状态以及一次本地智能体轮次。
  - 迭代单个客户机时使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要制品路径和每条 lane 的 Status。
  - OpenAI lane 默认使用 `openai/gpt-5.5` 作为实时智能体轮次证明。刻意验证另一个 OpenAI 模型时，传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将较长的本地运行包装在主机超时中，避免 Parallels 传输停滞消耗剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会在 `/tmp/openclaw-parallels-npm-update.*` 下写入嵌套 lane 日志。在假设外层包装器挂起之前，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动客户机上，Windows 更新可能会在更新后 Doctor/运行时依赖修复中花费 10 到 15 分钟；只要嵌套 npm 调试日志仍在推进，这仍然是正常的。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux smoke lane 并行运行。它们共享虚拟机状态，可能在快照恢复、包服务或客户机 Gateway 网关状态上冲突。
  - 更新后证明会运行常规内置插件表面，因为 speech、image generation 和 media understanding 等 capability facade 是通过内置运行时 API 加载的，即使智能体轮次本身只检查简单文本响应。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议 smoke 测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix 实时 QA lane。仅限源码检出 — 打包安装不随附 `qa-lab`。
  - 完整 CLI、profile/scenario 目录、环境变量和制品布局：[Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和 SUT bot 令牌，在真实私有群组中运行 Telegram 实时 QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 选择使用池化租约。
  - 任何 scenario 失败时会以非零码退出。需要制品但不想失败退出码时，使用 `--allow-failures`。
  - 需要同一私有群组中的两个不同 bot，并且 SUT bot 需要公开 Telegram 用户名。
  - 为获得稳定的 bot 到 bot 观测，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观测群组 bot 流量。
  - 在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 制品。回复 scenario 会包含从 driver 发送请求到观测到 SUT 回复的 RTT。

实时传输 lane 共享一个标准契约，使新传输不会漂移；每条 lane 的覆盖矩阵位于 [QA overview → 实时传输覆盖](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是宽泛的合成套件，不属于该矩阵。

### 通过 Convex 共享 Telegram 凭证（v1）

为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的池中获取独占租约，在 lane 运行期间为该租约发送心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色的一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认为 `ci`，否则默认为 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许仅本地开发使用 loopback `http://` Convex URL。

正常操作中，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池 add/remove/list）明确需要 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

维护者 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在实时运行前使用 `doctor` 检查 Convex site URL、broker 密钥、endpoint 前缀、HTTP 超时以及 admin/list 可达性，且不会打印密钥值。在脚本和 CI 工具中使用 `--json` 获取机器可读输出。

默认 endpoint 契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空 `2xx`）
- `POST /admin/add`（仅维护者密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅维护者密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅维护者密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram kind 的 payload 形状：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字 Telegram chat id 字符串。
- `admin/add` 会为 `kind: "telegram"` 验证该形状，并拒绝格式错误的 payload。

### 向 QA 添加渠道

新渠道适配器的架构和 scenario-helper 名称位于 [QA overview → 添加渠道](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低要求：在共享的 `qa-lab` host seam 上实现传输 runner，在插件 manifest 中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写 scenario。

## 测试套件（在哪里运行什么）

可以把这些套件理解为“真实度递增”（同时脆弱性/成本也递增）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：非目标运行使用 `vitest.full-*.config.ts` shard 集，并可能将多项目 shard 展开为每项目配置以便并行调度
- 文件：`src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts` 下的 core/unit 清单；UI 单元测试在专用 `unit-ui` shard 中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关 auth、routing、tooling、parsing、配置）
  - 已知 bug 的确定性回归
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应快速且稳定

<AccordionGroup>
  <Accordion title="项目、shard 和作用域 lane">

    - 非定向的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这会降低负载较高机器上的峰值 RSS，并避免 auto-reply/插件任务让无关套件资源不足。
    - `pnpm test --watch` 仍使用原生根 `vitest.config.ts` 项目图，因为多分片 watch 循环并不实用。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过有作用域的通道分流显式文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免支付完整根项目启动成本。
    - `pnpm test:changed` 默认会将已更改的 git 路径展开为低成本的有作用域通道：直接测试编辑、同级 `*.test.ts` 文件、显式源码映射，以及本地导入图依赖项。配置/设置/package 编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是窄范围工作的常规智能本地检查门禁。它会将 diff 分类为核心、核心测试、插件、插件测试、应用、文档、发布元数据、实时 Docker 工具和工具链，然后运行匹配的类型检查、lint 和保护命令。它不会运行 Vitest 测试；需要测试证明时，请调用 `pnpm test:changed` 或显式的 `pnpm test <target>`。仅发布元数据的版本号提升会运行有针对性的版本/配置/根依赖检查，并带有一个保护规则，用于拒绝顶层 version 字段以外的 package 变更。
    - 实时 Docker ACP harness 编辑会运行聚焦检查：实时 Docker auth 脚本的 shell 语法检查，以及实时 Docker 调度器 dry-run。仅当 diff 限定在 `scripts["test:docker:live-*"]` 时，才会包含 `package.json` 变更；依赖、导出、版本和其他 package 表面编辑仍使用更广泛的保护规则。
    - 来自 agents、commands、plugins、auto-reply helpers、`plugin-sdk` 和类似纯工具区域的轻导入单元测试会通过 `unit-fast` 通道，该通道会跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件仍保留在现有通道上。
    - 选定的 `plugin-sdk` 和 `commands` helper 源文件也会把 changed-mode 运行映射到这些轻量通道中的显式同级测试，因此 helper 编辑可以避免重新运行该目录的完整重型套件。
    - `auto-reply` 为顶层核心 helpers、顶层 `reply.*` 集成测试，以及 `src/auto-reply/reply/**` 子树提供专用 bucket。CI 还会进一步把 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，这样单个导入较重的 bucket 就不会占用完整的 Node 尾部时间。

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - 当你更改消息工具发现输入或压缩运行时
      上下文时，请保留两层覆盖。
    - 为纯路由和规范化
      边界添加聚焦的 helper 回归测试。
    - 保持嵌入式 runner 集成套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些套件会验证有作用域的 id 和压缩行为仍通过真实的
      `run.ts` / `compact.ts` 路径流动；仅 helper 的测试
      不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用
      非隔离 runner。
    - 根 UI 通道保留其 `jsdom` 设置和优化器，但也运行在
      共享的非隔离 runner 上。
    - 每个 `pnpm test` 分片都会继承共享 Vitest 配置中的同一组 `threads` + `isolate: false`
      默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node
      进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。
      设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8
      行为进行比较。

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` 会显示一个 diff 触发了哪些架构通道。
    - pre-commit hook 仅处理格式化。它会重新暂存已格式化的文件，
      不会运行 lint、类型检查或测试。
    - 在交接或 push 前，当你需要智能本地检查门禁时，
      显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认通过低成本有作用域通道分流。仅当智能体
      判断 harness、配置、package 或契约编辑确实需要更广泛的
      Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的分流
      行为，只是使用更高的 worker 上限。
    - 本地 worker 自动扩缩容刻意保持保守，并会在主机负载平均值已经较高时
      回退，因此多个并发
      Vitest 运行默认造成的影响更小。
    - 基础 Vitest 配置会将项目/配置文件标记为
      `forceRerunTriggers`，这样当测试
      wiring 变化时，changed-mode 重新运行仍保持正确。
    - 配置会在受支持的主机上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；
      如果你想为直接性能分析指定一个显式缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及
      导入拆分输出。
    - `pnpm test:perf:imports:changed` 会将同一性能分析视图限定到
      自 `origin/main` 以来更改的文件。
    - 分片计时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整体配置运行使用配置路径作为键；include-pattern CI
      分片会追加分片名称，以便分别跟踪已过滤的分片。
    - 当某个热点测试仍将大部分时间花在启动导入上时，
      请把重型依赖放在窄范围本地 `*.runtime.ts` 接缝之后，并
      直接 mock 该接缝，而不是为了将运行时 helpers 传给 `vi.mock(...)`
      而深度导入它们。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将分流后的
      `test:changed` 与该已提交 diff 的原生根项目路径进行比较，
      并打印 wall time 加 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过将已更改文件列表传给
      `scripts/test-projects.mjs` 和根 Vitest 配置，来基准测试当前
      dirty tree。
    - `pnpm test:perf:profile:main` 会为
      Vitest/Vite 启动和 transform 开销写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为
      单元套件写入 runner CPU+heap profiles。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制使用一个 worker
- 范围：
  - 默认在启用诊断的情况下启动一个真实的 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、内存和大载荷 churn
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化 helpers
  - 断言 recorder 保持有界，合成 RSS 样本低于压力预算，并且每会话队列深度会排空回零
- 预期：
  - CI 安全且不需要密钥
  - 用于稳定性回归跟进的窄通道，不是完整 Gateway 网关套件的替代品

### E2E（Gateway 网关 smoke）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与 repo 其余部分匹配。
  - 使用自适应 workers（CI：最多 2，本地：默认 1）。
  - 默认以 silent mode 运行，以减少 console I/O 开销。
- 有用的 override：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细 console 输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket/HTTP 表面、节点配对，以及更重的网络行为
- 预期：
  - 在 CI 中运行（当 pipeline 启用时）
  - 不需要真实密钥
  - 比单元测试有更多 moving parts（可能更慢）

### E2E：OpenShell 后端 smoke

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell gateway
  - 从临时本地 Dockerfile 创建一个沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 练习 OpenClaw 的 OpenShell 后端
  - 通过沙箱 fs bridge 验证 remote-canonical 文件系统行为
- 预期：
  - 仅 opt-in；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 加可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，随后销毁测试 gateway 和沙箱
- 有用的 override：
  - `OPENCLAW_E2E_OPENSHELL=1` 用于在手动运行更广泛 e2e 套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 用于指向非默认 CLI binary 或 wrapper script

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型 _今天_ 是否确实能用真实凭证工作？”
  - 捕获提供商格式变化、工具调用怪癖、auth 问题，以及 rate limit 行为
- 预期：
  - 设计上不保证 CI 稳定（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 使用 rate limits
  - 优先运行缩小范围的子集，而不是“一切”
- Live 运行会 source `~/.profile` 以获取缺失的 API keys。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/auth 材料复制到临时测试 home 中，这样单元 fixtures 就无法修改你的真实 `~/.openclaw`。
- 仅当你有意需要 live 测试使用你的真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它保留 `[live] ...` progress 输出，但抑制额外的 `~/.profile` notice，并静音 Gateway 网关 bootstrap 日志/Bonjour chatter。如果你想恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API key 轮换（特定于提供商）：设置带有逗号/分号格式的 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或通过 `OPENCLAW_LIVE_*_KEY` 设置每个 live override；测试会在 rate limit 响应时重试。
- Progress/heartbeat 输出：
  - Live 套件现在会向 stderr 发出 progress 行，因此即使 Vitest console capture 很安静，长时间提供商调用也能看到处于 active 状态。
  - `vitest.live.config.ts` 会禁用 Vitest console interception，因此提供商/Gateway 网关 progress 行会在 live 运行期间立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整 direct-model heartbeats。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 gateway/probe heartbeats。

## 我应该运行哪个套件？

使用这个决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改动很多，也运行 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS protocol / pairing：添加 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 特定提供商失败 / 工具调用：运行缩小范围的 `pnpm test:live`

## Live（触及网络的）测试

针对实时模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server 测试框架，以及所有媒体提供商实时测试（Deepgram、BytePlus、ComfyUI、图像、
音乐、视频、媒体测试框架）——再加上实时运行的凭据处理——请参阅
[测试 — 实时套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“可在 Linux 中工作”检查）

这些 Docker 运行器分为两类：

- 实时模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像中运行各自匹配 profile-key 的实时文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，也会加载 `~/.profile`）。匹配的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker 实时运行器默认使用较小的冒烟上限，让完整 Docker 扫描保持实用：
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，并且
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你
  明确需要更大的穷尽扫描时，可以覆盖这些环境变量。
- `test:docker:all` 通过 `test:docker:live-build` 构建一次实时 Docker 镜像，通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。基础镜像只是用于安装/更新/插件依赖 lane 的 Node/Git 运行器；这些 lane 会挂载预构建的 tarball。功能镜像会将同一个 tarball 安装到 `/app`，用于已构建应用的功能 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选定计划。聚合运行使用加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会避免繁重的实时、npm 安装和多服务 lane 同时启动。如果单个 lane 比当前上限更重，调度器仍可在池为空时启动它，并让它单独运行，直到容量再次可用。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。运行器默认执行 Docker 预检，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印一次 Status，将成功 lane 的耗时存储在 `.artifacts/docker-tests/lane-timings.json` 中，并在后续运行中使用这些耗时优先启动更长的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可以在不构建或运行 Docker 的情况下打印加权 lane manifest，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选 lane、package/镜像需求和凭据的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的 package 门禁，用于回答“这个可安装 tarball 能否作为产品工作？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选 package，将其上传为 `package-under-test`，然后针对这个确切的 tarball 运行可复用的 Docker E2E lane，而不是重新打包选定的 ref。`workflow_ref` 选择受信任的 workflow/harness 脚本，而 `package_ref` 在 `source=ref` 时选择要打包的源 commit/branch/tag；这让当前验收逻辑能够验证较旧的受信任 commit。profile 按覆盖广度排序：`smoke` 是快速安装/渠道/智能体加 Gateway 网关/配置，`package` 是 package/更新/插件契约，也是大多数 Parallels package/更新覆盖的默认原生替代项，`product` 添加 MCP 渠道、cron/subagent 清理、OpenAI Web 搜索和 OpenWebUI，`full` 则运行带 OpenWebUI 的发布路径 Docker 分块。发布验证会运行自定义 package delta（`bundled-channel-deps-compat plugins-offline`）以及 Telegram package QA，因为发布路径 Docker 分块已经覆盖了重叠的 package/更新/插件 lane。从 artifact 生成的定向 GitHub Docker 重跑命令会在可用时包含先前的 package artifact 和已准备的镜像输入，因此失败的 lane 可以避免重新构建 package 和镜像。
- 构建和发布检查会在 tsdown 之后运行 `scripts/check-cli-bootstrap-imports.mjs`。该守卫会遍历来自 `dist/entry.js` 和 `dist/cli/run-main.js` 的静态构建图；如果命令分发前的启动阶段导入了 Commander、prompt UI、undici 或日志等 package 依赖，它会失败；它还会确保内置 Gateway 网关运行分块保持在预算内，并拒绝对已知冷启动 Gateway 网关路径的静态导入。打包后的 CLI 冒烟测试还覆盖根帮助、新手引导帮助、Doctor 帮助、Status、配置 schema 和模型列表命令。
- Package Acceptance 旧版兼容性上限为 `2026.4.25`（包括 `2026.4.25-beta.*`）。在该截止版本之前，harness 只容忍已发布 package 的元数据缺口：省略的私有 QA 清单条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的 package，这些路径都是严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

实时模型 Docker 运行器还只会绑定挂载所需的 CLI 认证主目录（如果运行未缩窄，则挂载所有受支持的主目录），然后在运行前将它们复制到容器主目录中，以便外部 CLI OAuth 可以刷新令牌而不改变主机认证存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，并通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 严格覆盖 Droid/OpenCode）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是私有 QA 源码检出任务线。它有意不属于包 Docker 发布任务线，因为 npm tarball 会省略 QA Lab。
- Open WebUI 实时冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tarball 新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包好的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 Doctor 会修复已激活插件的运行时依赖，然后运行一次模拟的 OpenAI 智能体轮次。可使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主机重建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包好的 OpenClaw tarball，从包 `stable` 切换到 git `dev`，验证持久化的渠道和插件更新后行为，然后切回包 `stable` 并检查更新 Status。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录持久化，以及 Doctor 对受影响的重复提示词重写分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前树，在隔离 home 中用 `bun install -g` 安装，并验证 `openclaw infer image providers --json` 返回内置图像提供商而不是挂起。可使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主机构建，或使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 在它的 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认以 npm `latest` 作为稳定基线，然后升级到候选 tarball。本地可用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上使用 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保留隔离的 npm 缓存，避免 root 拥有的缓存条目掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root/update/direct-npm 缓存。
- Install Smoke CI 会用 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；当需要覆盖直接 `npm install -g` 时，在本地运行该脚本且不要设置该环境变量。
- 智能体删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离容器 home 中为两个智能体播种一个工作区，运行 `agents delete --json`，并验证 JSON 有效以及工作区保留行为。可使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关联网（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像和一个 Chromium 层，用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、由光标提升的可点击项、iframe 引用和 frame 元数据。
- OpenAI Responses web_search 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行模拟的 OpenAI 服务器，验证 `web_search` 将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始详情出现在 Gateway 网关日志中。
- MCP 渠道桥接（已播种 Gateway 网关 + stdio 桥接 + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi profile 允许/拒绝冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性 subagent 运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub kitchen-sink 安装/卸载、marketplace 更新，以及 Claude-bundle 启用/检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 ClawHub 块，或用 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认的 kitchen-sink 包/运行时组合。如果没有 `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`，测试会使用一个 hermetic 本地 ClawHub fixture 服务器。
- 插件未变更更新冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置重新加载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker runner 镜像，在宿主机上构建并打包一次 OpenClaw，然后把该 tarball 挂载到每个 Linux 安装场景中。可用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在一次新的本地构建后用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主机重建，或用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整 Docker 聚合和 release-path 内置渠道分块会预先打包一次该 tarball，然后把内置渠道检查分片到独立任务线中，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新任务线。发布分块会把渠道冒烟测试、更新目标和设置/运行时契约拆分到 `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`；聚合的 `bundled-channels` 分块仍可用于手动重跑。发布工作流还会拆分提供商安装器分块和内置插件安装/卸载分块；旧的 `package-update`、`plugins-runtime` 和 `plugins-integrations` 分块仍作为手动重跑的聚合别名保留。直接运行内置任务线时，可使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 缩小渠道矩阵，或用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景。该任务线还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 Doctor/运行时依赖修复。
- 迭代时可通过禁用无关场景来缩小内置插件运行时依赖范围，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

如需手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

设置了 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这类套件专用镜像覆盖项时，它们仍优先生效。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果本地还没有该镜像，脚本会拉取它。QR 和安装器 Docker 测试保留自己的 Dockerfile，因为它们验证的是包/安装行为，而不是共享的已构建应用运行时。

live-model Docker 运行器还会以只读方式 bind-mount 当前 checkout，并
在容器内把它暂存到临时 workdir。这样既能让运行时镜像保持精简，
又能针对你的精确本地源码/配置运行 Vitest。
暂存步骤会跳过大型本地专用缓存和应用构建输出，例如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或
Gradle 输出目录，因此 Docker live 运行不会花几分钟复制
机器特定的产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测不会在容器内启动
真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍会运行 `pnpm test:live`，因此当你需要在该 Docker 任务线中缩小或排除 Gateway 网关
live 覆盖范围时，也要传入
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是更高层的兼容性冒烟测试：它会启动一个
启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，
再启动一个固定版本的 Open WebUI 容器连接到该 Gateway 网关，通过
Open WebUI 登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一次
真实聊天请求。
首次运行可能明显较慢，因为 Docker 可能需要拉取
Open WebUI 镜像，且 Open WebUI 可能需要完成自己的冷启动设置。
该任务线需要可用的真实模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供它的主要方式。
成功运行会打印一个小型 JSON 载荷，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 有意保持确定性，不需要
真实的 Telegram、Discord 或 iMessage 账号。它会启动一个已播种的 Gateway 网关
容器，再启动第二个容器来生成 `openclaw mcp serve`，然后
验证路由会话发现、转录读取、附件元数据、
live 事件队列行为、出站发送路由，以及通过真实 stdio MCP 桥接发送的 Claude 风格渠道 +
权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是
桥接实际发出的内容，而不只是某个特定客户端 SDK 刚好暴露的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live
模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实 stdio MCP 探测服务器，
通过嵌入式 Pi bundle
MCP 运行时物化该服务器，执行该工具，然后验证 `coding` 和 `messaging` 保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会过滤它们。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型
密钥。它会启动一个带真实 stdio MCP 探测服务器的已播种 Gateway 网关，运行一个
隔离 cron 轮次和一个 `/subagents spawn` 一次性子轮次，然后验证
MCP 子进程在每次运行后都会退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 保留此脚本用于回归/调试工作流。之后验证 ACP 线程路由时可能还会需要它，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于仅验证从 `OPENCLAW_PROFILE_FILE` source 的环境变量，使用临时配置/工作区目录，且不挂载外部 CLI 凭证
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 凭证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的提供商运行只挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 使用 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none` 或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于在不需要重新构建的重跑中复用现有的 `openclaw:local-live` 镜像
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关向 Open WebUI smoke 暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI smoke 使用的 nonce 检查提示
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
如果还需要页内标题检查，请运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归（CI 安全）

这些是不使用真实提供商的“真实流水线”回归：

- Gateway 网关工具调用（模拟 OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“通过 Gateway 网关 Agent loop 端到端运行模拟 OpenAI 工具调用”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，写入配置 + 强制凭证）：`src/gateway/gateway.test.ts`（用例：“通过 ws 运行向导并写入凭证令牌配置”）

## 智能体可靠性评测（Skills）

我们已经有一些 CI 安全测试，其行为类似“智能体可靠性评测”：

- 通过真实 Gateway 网关 + Agent loop 进行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

Skills 仍然缺少的内容（见 [Skills](/zh-CN/tools/skills)）：

- **决策：** 当提示中列出 Skills 时，智能体是否会选择正确的 Skills（或避开无关项）？
- **合规：** 智能体是否会在使用前读取 `SKILL.md` 并遵循必需步骤/参数？
- **工作流契约：** 断言工具顺序、会话历史继承和沙箱边界的多轮场景。

未来评测应首先保持确定性：

- 使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、Skills 文件读取和会话接线。
- 一小套聚焦 Skills 的场景（使用 vs 避免、门控、提示注入）。
- 只有在 CI 安全套件就位后，才添加可选的实时评测（选择启用、由环境变量门控）。

## 契约测试（插件和渠道形状）

契约测试验证每个已注册的插件和渠道都符合其
接口契约。它们会遍历所有发现的插件，并运行一套
形状和行为断言。默认的 `pnpm test` 单元测试 lane 会有意
跳过这些共享接缝和 smoke 文件；当你触及共享渠道或提供商表面时，
请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、名称、能力）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/名册 API
- **group-policy** - 群组策略强制执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 凭证流程契约
- **auth-choice** - 凭证选择/选取
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 更改插件 SDK 导出或子路径后
- 添加或修改渠道或提供商插件后
- 重构插件注册或发现后

契约测试在 CI 中运行，不需要真实 API key。

## 添加回归（指南）

当你修复实时环境中发现的提供商/模型问题时：

- 如果可能，添加一个 CI 安全回归（模拟/存根提供商，或捕获精确的请求形状转换）
- 如果它本质上只能实时运行（速率限制、凭证策略），请让实时测试保持窄范围，并通过环境变量选择启用
- 优先针对能捕获该 bug 的最小层：
  - 提供商请求转换/回放 bug → 直接模型测试
  - Gateway 网关会话/历史/工具流水线 bug → Gateway 网关实时 smoke 或 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历防护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）为每个 SecretRef 类派生一个采样目标，然后断言遍历段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会故意在未分类的目标 id 上失败，确保新类不能被静默跳过。

## 相关

- [实时测试](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)

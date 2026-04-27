---
read_when:
    - 在本地或 CI 中运行测试
    - 为模型/提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：unit/e2e/live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-27T10:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b0afc7b8aa48f08b70a95666b030eb47942327498e7a88bee45ac027aa5ae3e
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三套 Vitest 测试套件（unit/integration、e2e、live）以及一小组 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么内容（以及它刻意**不**覆盖什么）。
- 常见工作流应该运行哪些命令（本地、推送前、调试）。
- live 测试如何发现凭证并选择模型/提供商。
- 如何为真实世界中的模型/提供商问题添加回归测试。

## 快速开始

大多数情况下：

- 完整门禁（预期在推送前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在资源充足的机器上更快地本地运行完整测试套件：`pnpm test:max`
- 直接进入 Vitest 监听循环：`pnpm test:watch`
- 直接按文件定位现在也支持 extension/channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你只是在迭代单个失败用例时，优先选择定向运行。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA 通道：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你改动了测试或想获得更多信心时：

- 覆盖率门禁：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商/模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具/图像探测）：`pnpm test:live`
- 安静地只运行一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在每个选中的模型都会运行一次文本轮次加一个小型文件读取式探测。元数据声明支持 `image` 输入的模型还会额外运行一个小型图像轮次。在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动触发的 `OpenClaw Release Checks` 都会调用可复用的 live/E2E 工作流，并设置 `include_live_suites: true`，其中包含按提供商分片的独立 Docker live 模型矩阵作业。
  - 对于聚焦的 CI 重跑，可触发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 和 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 及其 scheduled/release 调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 运行针对 Codex app-server 路径的 Docker live 通道，使用 `/codex bind` 绑定一个合成的 Slack 私信，执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图片附件是通过原生插件绑定而不是 ACP 路由的。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，验证 `/codex status` 和 `/codex models`，并默认执行图像、cron MCP、子智能体和 Guardian 探测。在隔离其他 Codex app-server 故障时，可使用 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探测。若要仅聚焦子智能体检查，请禁用其他探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则该命令会在子智能体探测后退出。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 对消息渠道救援命令界面的自选双保险检查。它会执行 `/crestodian status`，排队一个持久化模型变更，回复 `/crestodian yes`，并验证审计/配置写入路径。
- Crestodian planner Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在一个无配置容器中运行 Crestodian，并在 `PATH` 上放置一个假的 Claude CLI，验证模糊规划器回退能够转化为带审计记录的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录开始，将裸 `openclaw` 路由到 Crestodian，应用 setup/model/智能体/Discord 插件 + SecretRef 写入，验证配置，并检查审计条目。相同的 Ring 0 设置路径也在 QA Lab 中通过 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot/Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行一个隔离的 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`。
  验证 JSON 报告的是 Moonshot/K2.6，且助手转录中存储了归一化后的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先使用下面描述的 allowlist 环境变量来缩小 live 测试范围。
</Tip>

## QA 专用运行器

当你需要 QA Lab 的真实感时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上以及通过手动触发运行，使用 mock 提供商。`QA-Lab - All Lanes` 会在 `main` 上每晚运行，也可手动触发，它会将 mock parity gate、live Matrix 通道、由 Convex 管理的 live Telegram 通道，以及由 Convex 管理的 live Discord 通道作为并行作业运行。计划任务 QA 和发布检查会显式为 Matrix 传入 `--profile fast`，而 Matrix CLI 和手动工作流输入默认仍然是 `all`；手动触发可以将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 会在发布审批前运行 parity，以及快速 Matrix 和 Telegram 通道。

- `pnpm openclaw qa suite`
  - 直接在宿主机上运行基于仓库的 QA 场景。
  - 默认以隔离的 Gateway 网关 worker 并行运行多个选定场景。`qa-channel` 默认并发为 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 回到旧的串行通道。
  - 任何场景失败都会以非零状态退出。若你想保留产物但不希望退出码失败，可使用 `--allow-failures`。
  - 支持 `live-frontier`、`mock-openai` 和 `aimock` 三种提供商模式。`aimock` 会启动一个本地 AIMock 支持的提供商服务器，用于实验性的 fixture 和协议 mock 覆盖，而不会替代感知场景的 `mock-openai` 通道。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行相同的 QA 测试套件。
  - 保持与宿主机 `qa suite` 相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商/模型选择标志。
  - live 运行会转发对来宾环境可行的受支持 QA 认证输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保留在仓库根目录下，这样来宾环境才能通过挂载的工作区回写。
  - 会将常规 QA 报告 + 摘要以及 Multipass 日志写入 `.artifacts/qa-e2e/...`。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，用于操作员风格的 QA 工作。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建 npm tarball，在 Docker 中全局安装，运行非交互式 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用插件时会按需安装运行时依赖，运行 doctor，并针对一个 mock OpenAI 端点运行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可以让同一条打包安装通道改为使用 Discord。
- `pnpm test:docker:session-runtime-context`
  - 运行一个确定性的已构建应用 Docker 冒烟测试，用于嵌入式运行时上下文转录。它会验证隐藏的 OpenClaw 运行时上下文被持久化为不可显示的自定义消息，而不是泄漏到可见的用户轮次中；然后植入一个受影响的损坏 session JSONL，并验证 `openclaw doctor --fix` 会将其重写到活动分支并创建备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 候选包，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用 live Telegram QA 通道，并将该已安装包作为被测 Gateway 网关。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ` 可以测试解析后的本地 tarball，而不是从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI/发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，以及 `OPENCLAW_QA_CONVEX_SITE_URL` 和角色密钥。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 会仅为这一通道覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 将这一通道暴露为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还提供 `Package Acceptance`，用于针对某个候选包进行单次产品证明。它接受受信任的 ref、已发布的 npm 规格、HTTPS tarball URL + SHA-256，或来自另一个运行的 tarball 产物，上传标准化后的 `openclaw-current.tgz` 作为 `package-under-test`，然后运行现有的 Docker E2E 调度器，使用 smoke、package、product、full 或 custom 通道配置。设置 `telegram_mode=mock-openai` 或 `live-frontier`，可以让 Telegram QA 工作流针对相同的 `package-under-test` 产物运行。
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

- 产物证明会从另一个 Actions 运行中下载 tarball 产物：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前的 OpenClaw 构建，使用已配置 OpenAI 启动 Gateway 网关，然后通过编辑配置启用内置渠道/插件。
  - 验证设置发现阶段会让尚未配置的插件运行时依赖保持未安装状态；第一次配置后的 Gateway 网关运行或 doctor 运行会按需安装每个内置插件的运行时依赖；第二次重启不会重新安装已经激活过的依赖。
  - 还会安装一个已知的较旧 npm 基线版本，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本在更新后的 doctor 中会修复内置渠道运行时依赖，而不依赖 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 来宾系统中运行原生打包安装更新冒烟测试。每个选中的平台都会先安装请求的基线软件包，然后在同一个来宾系统中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、网关就绪情况，以及一次本地智能体轮次。
  - 在迭代单个来宾系统时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要产物路径和每条通道状态。
  - OpenAI 通道默认使用 `openai/gpt-5.5` 作为 live 智能体轮次证明。若要有意验证其他 OpenAI 模型，请传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将较长的本地运行包裹在宿主机超时中，这样 Parallels 传输卡顿就不会耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套通道日志写入 `/tmp/openclaw-parallels-npm-update.*` 下。不要在认定外层包装器卡住之前，先检查 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动来宾系统上，Windows 更新可能会花费 10 到 15 分钟进行更新后的 doctor/运行时依赖修复；只要嵌套的 npm 调试日志还在推进，这仍然是正常状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟通道并行运行。它们共享 VM 状态，可能会在快照恢复、软件包分发或来宾网关状态上发生冲突。
  - 更新后的验证会运行常规内置插件界面，因为即使智能体轮次本身只检查一个简单的文本响应，像语音、图像生成和媒体理解这样的能力 facade 仍然会通过内置运行时 API 加载。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock provider 服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一个一次性的、由 Docker 支持的 Tuwunel homeserver 运行 Matrix live QA 通道。
  - 这个 QA 宿主目前仅用于仓库/开发环境。打包后的 OpenClaw 安装不包含 `qa-lab`，因此也不会暴露 `openclaw qa`。
  - 仓库检出会直接加载内置运行器，无需单独安装插件。
  - 预配三个临时 Matrix 用户（`driver`、`sut`、`observer`）以及一个私有房间，然后启动一个 QA 网关子进程，并使用真实 Matrix 插件作为 SUT 传输层。
  - 默认使用 `--profile all`。发布关键的传输验证使用 `--profile fast --fail-fast`；在分片完整目录时使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`。
  - 默认使用固定稳定版 Tuwunel 镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`。如果你需要测试其他镜像，可用 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 覆盖。
  - Matrix 不暴露共享凭证来源标志，因为该通道会在本地预配一次性用户。
  - 会将 Matrix QA 报告、摘要、observed-events 产物，以及合并后的 stdout/stderr 输出日志写入 `.artifacts/qa-e2e/...`。
  - 默认输出进度，并通过 `OPENCLAW_QA_MATRIX_TIMEOUT_MS` 强制执行硬性运行超时（默认 30 分钟）。`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` 用于调节负向无回复静默窗口，清理由 `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` 限定，失败时会包含用于恢复的 `docker compose ... down --remove-orphans` 命令。
- `pnpm openclaw qa telegram`
  - 使用环境变量中的 driver 和 SUT 机器人令牌，针对真实私有群组运行 Telegram live QA 通道。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字形式的 Telegram 聊天 id。
  - 支持 `--credential-source convex` 以使用共享池化凭证。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 任一场景失败都会以非零状态退出。如果你想保留产物但不希望退出码失败，可使用 `--allow-failures`。
  - 需要在同一个私有群组中使用两个不同的机器人，并且 SUT 机器人必须公开 Telegram 用户名。
  - 为了实现稳定的机器人对机器人观测，请在 `@BotFather` 中为两个机器人启用 Bot-to-Bot Communication Mode，并确保 driver 机器人可以观测群组中的机器人流量。
  - 会将 Telegram QA 报告、摘要和 observed-messages 产物写入 `.artifacts/qa-e2e/...`。回复场景会包含从 driver 发送请求到观测到 SUT 回复的 RTT。

live 传输通道共享一个标准契约，这样新的传输实现就不会发生漂移：

`qa-channel` 仍然是覆盖面广的合成 QA 测试套件，不属于 live 传输覆盖矩阵的一部分。

| 通道 | 金丝雀 | 提及门控 | 允许列表拦截 | 顶层回复 | 重启恢复 | 线程跟进 | 线程隔离 | Reaction 观测 | 帮助命令 | 原生命令注册 |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              |                 |                 |                |                  |                  |                      |              | x                           |

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从一个由 Convex 支持的凭证池中获取独占租约，在通道运行期间为该租约发送心跳，并在关闭时释放租约。

参考的 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 为所选角色配置一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则是 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选 trace id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

正常运行时，`OPENCLAW_QA_CONVEX_SITE_URL` 应使用 `https://`。

维护者管理命令（池添加/删除/列出）必须明确使用
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

面向维护者的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live 运行之前使用 `doctor`，可以检查 Convex 站点 URL、broker 密钥、
端点前缀、HTTP 超时和 admin/list 可达性，同时不会打印密钥值。在脚本和 CI
工具中使用 `--json` 可获得机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 资源耗尽/可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /release`
  - 请求：`{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - 成功：`{ status: "ok" }`（或空的 `2xx`）
- `POST /admin/add`（仅限 maintainer 密钥）
  - 请求：`{ kind, actorId, payload, note?, status? }`
  - 成功：`{ status: "ok", credential }`
- `POST /admin/remove`（仅限 maintainer 密钥）
  - 请求：`{ credentialId, actorId }`
  - 成功：`{ status: "ok", changed, credential }`
  - 活跃租约保护：`{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list`（仅限 maintainer 密钥）
  - 请求：`{ kind?, status?, includePayload?, limit? }`
  - 成功：`{ status: "ok", credentials, count }`

Telegram 类型的负载结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字形式的 Telegram 聊天 id 字符串。
- 对于 `kind: "telegram"`，`admin/add` 会验证此结构，并拒绝格式错误的负载。

### 向 QA 添加一个渠道

将一个渠道添加到 Markdown QA 系统中，严格来说只需要两样东西：

1. 该渠道的传输适配器。
2. 一个用于执行该渠道契约的场景包。

如果共享的 `qa-lab` 宿主已经可以承载流程，就不要再添加新的顶层 QA 命令根。

`qa-lab` 负责共享宿主机制：

- `openclaw qa` 命令根
- 测试套件启动和关闭
- worker 并发
- 产物写入
- 报告生成
- 场景执行
- 旧版 `qa-channel` 场景的兼容别名

运行器插件负责传输契约：

- `openclaw qa <runner>` 如何挂载在共享 `qa` 根命令之下
- 如何为该传输配置网关
- 如何检查就绪状态
- 如何注入入站事件
- 如何观测出站消息
- 如何暴露转录和归一化后的传输状态
- 如何执行基于传输的操作
- 如何处理传输特定的重置或清理

新渠道的最低采用门槛是：

1. 保持由 `qa-lab` 负责共享 `qa` 根命令。
2. 在共享的 `qa-lab` 宿主接缝上实现传输运行器。
3. 将传输特定机制保留在运行器插件或渠道 harness 内部。
4. 将运行器挂载为 `openclaw qa <runner>`，而不是注册一个相互竞争的根命令。
   运行器插件应在 `openclaw.plugin.json` 中声明 `qaRunners`，并从 `runtime-api.ts` 导出匹配的 `qaRunnerCliRegistrations` 数组。
   保持 `runtime-api.ts` 足够轻量；惰性 CLI 和运行器执行应放在单独的入口点之后。
5. 在主题化的 `qa/scenarios/` 目录下编写或改造 Markdown 场景。
6. 为新场景使用通用场景辅助工具。
7. 除非仓库正在进行有意的迁移，否则要保持现有兼容别名继续可用。

决策规则非常严格：

- 如果某个行为可以在 `qa-lab` 中统一表达一次，就把它放进 `qa-lab`。
- 如果某个行为依赖单一渠道传输，就把它保留在对应的运行器插件或插件 harness 中。
- 如果某个场景需要多个渠道都能使用的新能力，就添加一个通用辅助工具，而不是在 `suite.ts` 中添加渠道特定分支。
- 如果某个行为只对某一种传输有意义，就让该场景保持传输特定，并在场景契约中明确说明。

新场景推荐使用的通用辅助函数名称：

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

现有场景仍可使用兼容别名，包括：

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

新的渠道开发应使用这些通用辅助名称。
兼容别名的存在是为了避免一次性强制迁移，不应作为新场景编写的
范式。

## 测试套件（各自运行位置）

可以把这些测试套件理解为“真实性逐步提升”（同时不稳定性/成本也逐步提升）：

### Unit / integration（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会将多项目分片展开为按项目划分的配置，以便并行调度
- 文件：核心/unit 清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts`；UI unit 测试在专用的 `unit-ui` 分片中运行
- 范围：
  - 纯 unit 测试
  - 进程内 integration 测试（Gateway 网关认证、路由、工具、解析、配置）
  - 针对已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和作用域通道">

    - 未定向的 `pnpm test` 会运行十二个更小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这样可以降低负载机器上的峰值 RSS，并避免 auto-reply/extension 工作拖慢无关测试套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监听循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 会先通过作用域通道路由显式的文件/目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 可以避免付出完整根项目启动成本。
    - `pnpm test:changed` 默认会将 git 变更路径展开为廉价的作用域通道：直接测试改动、同级 `*.test.ts` 文件、显式源码映射以及本地导入图依赖方。配置/setup/package 改动不会广泛运行测试，除非你明确使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是针对小范围工作使用的常规智能本地检查门禁。它会将 diff 分类为核心、核心测试、extensions、extension 测试、应用、文档、发布元数据、live Docker 工具和工具链，然后运行匹配的 typecheck、lint 和保护命令。它不会运行 Vitest 测试；需要测试证明时，请调用 `pnpm test:changed` 或明确的 `pnpm test <target>`。仅涉及发布元数据的版本提升会运行定向的版本/配置/根依赖检查，并带有一个保护措施，拒绝对顶层 version 字段之外的 package 改动。
    - live Docker ACP harness 改动会运行聚焦检查：对 live Docker 认证脚本做 shell 语法检查，以及执行一次 live Docker 调度器 dry-run。只有当 diff 仅限于 `scripts["test:docker:live-*"]` 时才包含 `package.json` 变更；依赖、导出、版本及其他 package 界面改动仍然使用更广泛的保护措施。
    - 来自 agents、commands、plugins、auto-reply 辅助工具、`plugin-sdk` 以及类似纯工具区域的轻导入 unit 测试会路由到 `unit-fast` 通道，该通道跳过 `test/setup-openclaw-runtime.ts`；有状态/运行时较重的文件仍保留在现有通道中。
    - 某些 `plugin-sdk` 和 `commands` 辅助源码文件在 changed 模式运行时，也会将其映射到这些轻量通道中的显式同级测试，因此对辅助函数的修改无需为该目录重新运行完整的重型测试套件。
    - `auto-reply` 为顶层核心辅助函数、顶层 `reply.*` integration 测试，以及 `src/auto-reply/reply/**` 子树分别设置了专用分桶。CI 还会进一步将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，避免某个导入开销大的分桶独占完整 Node 尾部耗时。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你修改消息工具发现输入或压缩运行时上下文时，必须同时保持两个层级的覆盖。
    - 为纯路由和归一化边界添加聚焦的辅助函数回归测试。
    - 保持嵌入式运行器 integration 测试套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些测试套件会验证作用域 id 和压缩行为仍然流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数级测试并不足以替代这些 integration 路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
    - 根 UI 通道保留其 `jsdom` setup 和优化器，但也运行在共享的非隔离运行器上。
    - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行时的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与默认 V8 行为进行对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个 diff 触发了哪些架构通道。
    - pre-commit 钩子只负责格式化。它会重新暂存已格式化文件，不会运行 lint、typecheck 或测试。
    - 在交接或推送前，如需智能本地检查门禁，请显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认通过廉价的作用域通道进行路由。只有当智能体判断某个 harness、配置、package 或契约改动确实需要更广范围的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是 worker 上限更高。
    - 本地 worker 自动扩缩容有意采取保守策略，当宿主机负载平均值已经较高时会回退，因此默认情况下多个并发 Vitest 运行带来的损害会更小。
    - 基础 Vitest 配置将项目/配置文件标记为 `forceRerunTriggers`，从而在测试接线变化时，changed 模式下的重跑仍然正确。
    - 该配置会在受支持的宿主机上保持启用 `OPENCLAW_VITEST_FS_MODULE_CACHE`；如果你想为直接分析指定一个明确的缓存位置，可设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及导入拆分输出。
    - `pnpm test:perf:imports:changed` 会将相同的分析视图限定到自 `origin/main` 以来变更的文件。
    - 分片耗时数据会写入 `.artifacts/vitest-shard-timings.json`。
      整个配置运行会以配置路径作为键；include-pattern CI 分片会追加分片名称，以便单独跟踪过滤后的分片。
    - 当某个热点测试的大部分时间仍消耗在启动导入上时，应将重依赖放在一个狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了通过 `vi.mock(...)` 传递它们而深度导入运行时辅助函数。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会将路由后的 `test:changed` 与该已提交 diff 的原生根项目路径进行对比，并打印墙钟时间以及 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将当前脏工作树的变更文件列表进行路由，从而完成基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest/Vite 启动和转换开销写入主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为 unit 测试套件写入运行器 CPU+堆 profile。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker
- 范围：
  - 启动一个真实的 loopback Gateway 网关，并默认启用诊断
  - 通过诊断事件路径驱动合成的 Gateway 网关消息、内存和大负载抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性 bundle 持久化辅助函数
  - 断言记录器保持有界、合成 RSS 样本低于压力预算，并且每个会话的队列深度最终回落到零
- 预期：
  - 对 CI 安全且无需密钥
  - 是一个用于稳定性回归跟进的窄范围通道，不可替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关冒烟测试）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其余部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以 silent 模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>`：强制设置 worker 数量（上限 16）。
  - `OPENCLAW_E2E_VERBOSE=1`：重新启用详细控制台输出。
- 范围：
  - 多实例网关端到端行为
  - WebSocket/HTTP 界面、节点配对和更重的网络交互
- 预期：
  - 在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比 unit 测试有更多活动部件（可能更慢）

### E2E：OpenShell 后端冒烟测试

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在宿主机上启动一个隔离的 OpenShell 网关
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 执行 OpenClaw 的 OpenShell 后端
  - 通过沙箱文件系统桥接验证远端规范化文件系统行为
- 预期：
  - 仅在显式选择时运行；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和一个可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试网关和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1`：在手动运行更广范围 e2e 测试套件时启用此测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`：指定非默认 CLI 二进制或包装脚本

### Live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商/模型在**今天**配合真实凭证是否真的可用？”
  - 捕获提供商格式变化、工具调用怪癖、认证问题以及限流行为
- 预期：
  - 按设计来说不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗限流额度
  - 优先运行缩小范围的子集，而不是“全部都跑”
- live 运行会 source `~/.profile`，以获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置/认证材料复制到一个临时测试 home 中，这样 unit fixture 就不会改动你真实的 `~/.openclaw`。
- 仅当你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认使用更安静的模式：它会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 Gateway 网关引导日志/Bonjour 噪声。如果你想恢复完整启动日志，可设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商区分）：设置逗号/分号格式的 `*_API_KEYS` 或 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），也可以通过 `OPENCLAW_LIVE_*_KEY` 做每次 live 运行的覆盖；测试会在收到限流响应时重试。
- 进度/心跳输出：
  - live 测试套件现在会将进度行输出到 stderr，这样即使 Vitest 控制台捕获很安静，较长的提供商调用也能明显显示仍在活动。
  - `vitest.live.config.ts` 禁用了 Vitest 控制台拦截，因此在 live 运行期间，提供商/网关进度行会立即流式输出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直连模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关/探测心跳。

## 我应该运行哪个测试套件？

使用这张决策表：

- 编辑逻辑/测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 修改 Gateway 网关网络 / WS 协议 / 配对：加跑 `pnpm test:e2e`
- 调试“我的机器人挂了”/提供商特定故障/工具调用：运行一个缩小范围的 `pnpm test:live`

## Live（会触网）测试

关于 live 模型矩阵、CLI 后端冒烟测试、ACP 冒烟测试、Codex app-server harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、音乐、视频、媒体 harness）——以及 live 运行的凭证处理——请参见
[测试 — live 测试套件](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中能工作”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 只会在仓库 Docker 镜像内运行与其配置键匹配的 live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，也会 source `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认使用较小的冒烟测试上限，这样完整的 Docker 扫描仍然可行：
  `test:docker:live-models` 默认使用 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认使用 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。只有在你明确想要更大规模的穷举扫描时，才覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包一次为 npm tarball，然后构建/复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像仅用于 install/update/plugin-dependency 通道的 Node/Git 运行器；这些通道会挂载预构建的 tarball。功能镜像则会把同一个 tarball 安装到 `/app` 中，用于已构建应用功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 执行选中的计划。该聚合器使用一个加权本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会阻止重型 live、npm-install 和多服务通道同时启动。如果某个单独通道比当前上限还重，调度器仍可在池为空时启动它，然后让它单独运行，直到容量再次可用。默认值是 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 宿主有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。该运行器默认会执行 Docker 预检，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功通道的耗时存入 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中利用这些耗时优先启动较长通道。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可只打印加权通道清单而不构建或运行 Docker，或者使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选通道、软件包/镜像需求以及凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的软件包门禁，用于回答“这个可安装 tarball 作为产品是否可用？”它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选软件包，将其作为 `package-under-test` 上传，然后针对这个精确 tarball 运行可复用的 Docker E2E 通道，而不是重新打包所选 ref。`workflow_ref` 选择受信任的工作流/harness 脚本，`package_ref` 则在 `source=ref` 时选择要打包的源 commit/branch/tag；这样当前的验收逻辑就可以验证较旧的受信任提交。配置按覆盖广度排序：`smoke` 是快速的安装/渠道/智能体加上 gateway/config，`package` 是软件包/update/plugin 契约，也是大多数 Parallels package/update 覆盖的默认原生替代项，`product` 会再加入 MCP 渠道、cron/subagent 清理、OpenAI web 搜索和 OpenWebUI，而 `full` 会运行带 OpenWebUI 的发布路径 Docker 分块。发布验证会针对目标 ref 运行 `package` 配置，并启用 Telegram 软件包 QA。由产物生成的定向 GitHub Docker 重跑命令会在可用时包含先前的软件包产物和已准备镜像输入，因此失败通道可以避免重新构建软件包和镜像。
- 构建和发布检查会在 tsdown 之后运行 `scripts/check-cli-bootstrap-imports.mjs`。该保护措施会从 `dist/entry.js` 和 `dist/cli/run-main.js` 开始遍历静态构建图，如果它发现命令分派之前的预分派启动导入了诸如 Commander、提示 UI、undici 或日志之类的软件包依赖，就会失败。打包 CLI 冒烟测试还覆盖根帮助、onboard 帮助、doctor 帮助、status、配置 schema 和一个模型列表命令。
- `Package Acceptance` 的旧版兼容性上限为 `2026.4.25`（包含 `2026.4.25-beta.*`）。在该截止版本及之前，harness 只会容忍已发布软件包元数据缺口：省略的私有 QA 清单条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的补丁文件、缺失的持久化 `update.channel`、旧版插件 install-record 位置、缺失的 marketplace install-record 持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的软件包，这些路径都会被视为严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的 integration 路径。

live 模型 Docker 运行器还会只 bind-mount 所需的 CLI 认证 home（如果运行未缩小范围，则挂载所有受支持的 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会修改宿主机认证存储：

- 直连模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，若需严格的 Droid/OpenCode 覆盖，可使用 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode`）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + 开发智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是一个私有 QA 源码检出通道。它有意不属于软件包 Docker 发布通道的一部分，因为 npm tarball 不包含 QA Lab。
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导向导（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- Npm tarball 新手引导/渠道/智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装打包好的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，并运行一次模拟的 OpenAI 智能体轮次。可通过 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 跳过宿主机重新构建，或通过 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装打包好的 OpenClaw tarball，将渠道从软件包 `stable` 切换到 git `dev`，验证持久化的渠道和插件在更新后仍然可用，然后再切回软件包 `stable` 并检查更新状态。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录的持久化，以及 doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中使用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 会返回内置图像提供商，而不是卡住。可通过 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 复用预构建 tarball，通过 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 跳过宿主机构建，或通过 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。可在本地通过 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上通过 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保留一个隔离的 npm 缓存，这样 root 拥有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重跑之间复用 root/update/direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；如果需要覆盖直接 `npm install -g`，请在本地运行脚本时不要设置该环境变量。
- Agents 删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认会构建根 Dockerfile 镜像，在隔离的容器 home 中为两个智能体植入一个工作区，运行 `agents delete --json`，并验证 JSON 有效且工作区保留行为正确。可通过 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 认证 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像以及一个 Chromium 层，以原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、提升为游标的可点击元素、iframe 引用和 frame 元数据。
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升为 `low`，然后强制让 provider schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（带种子的 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi bundle MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi 配置 allow/deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- Cron/subagent MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性 subagent 运行后拆除 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub 安装/卸载、marketplace 更新，以及 Claude bundle 启用/检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 live ClawHub 模块，或通过 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认软件包。
- 插件更新无变化冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在宿主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。可通过 `OPENCLAW_SKIP_DOCKER_BUILD=1` 复用镜像，在本地刚完成构建后通过 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 跳过宿主机重新构建，或通过 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整的 Docker 聚合运行和发布路径 `plugins-integrations` 分块会先预打包一次该 tarball，然后将内置渠道检查拆分为独立通道，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的独立更新通道。直接运行该内置通道时，可用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 缩小渠道矩阵范围，或用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 缩小更新场景范围。该通道还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor/运行时依赖修复。
- 在迭代时缩小内置插件运行时依赖范围，可通过禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

诸如 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 之类的测试套件专用镜像覆盖在设置时仍然优先。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果镜像尚未存在于本地，脚本会拉取它。QR 和安装器 Docker 测试保留各自的 Dockerfile，因为它们验证的是软件包/安装行为，而不是共享的已构建应用运行时。

live 模型 Docker 运行器还会以只读方式 bind-mount 当前检出，并将其暂存到容器内的临时工作目录中。这样可以让运行时镜像保持精简，同时仍然针对你精确的本地源码/配置运行 Vitest。暂存步骤会跳过大型仅本地缓存和应用构建输出，例如 `.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地 `.build` 或 Gradle 输出目录，因此 Docker live 运行不会花几分钟复制与机器相关的产物。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在容器内启动真实的 Telegram/Discord 等渠道 worker。
`test:docker:live-models` 仍然会运行 `pnpm test:live`，因此当你需要缩小或排除该 Docker 通道中的 Gateway 网关 live 覆盖范围时，也要传入 `OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw Gateway 网关容器，再针对该 Gateway 网关启动一个固定版本的 Open WebUI 容器，通过 Open WebUI 登录，验证 `/api/models` 暴露了 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一个真实聊天请求。
第一次运行可能明显更慢，因为 Docker 可能需要拉取 Open WebUI 镜像，而 Open WebUI 也可能需要完成自己的冷启动设置。
该通道需要一个可用的 live 模型密钥，而在 Docker 化运行中，`OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是提供该密钥的主要方式。
成功运行会打印一个小型 JSON 负载，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 是刻意设计为确定性的，不需要真实的 Telegram、Discord 或 iMessage 账户。它会启动一个带种子的 Gateway 网关容器，再启动第二个容器来拉起 `openclaw mcp serve`，然后验证经路由的会话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及通过真实 stdio MCP bridge 传递的 Claude 风格渠道 + 权限通知。通知检查会直接检查原始 stdio MCP 帧，因此该冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live 模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP 探测服务器，通过嵌入式 Pi bundle MCP 运行时将该服务器实体化，执行工具，然后验证 `coding` 和 `messaging` 会保留 `bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将它们过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型密钥。它会启动一个带种子的 Gateway 网关并带有真实的 stdio MCP 探测服务器，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 一次性子进程轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 纯自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 为回归/调试工作流保留此脚本。未来可能还需要它来验证 ACP 线程路由，因此不要删除它。

有用的环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）会挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）会挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）会挂载到 `/home/node/.profile`，并在运行测试前被 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于验证仅使用从 `OPENCLAW_PROFILE_FILE` source 得到的环境变量，使用临时配置/工作区目录，并且不挂载外部 CLI 认证内容
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）会挂载到 `/home/node/.npm-global`，用于 Docker 内缓存的 CLI 安装
- `$HOME` 下的外部 CLI 认证目录/文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 缩小范围的 provider 运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录/文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或类似 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于缩小运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内过滤 provider
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在无需重建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

编辑文档后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（对 CI 安全）

这些是在没有真实 provider 的情况下运行的“真实流水线”回归测试：

- Gateway 网关工具调用（模拟 OpenAI，真实 Gateway 网关 + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start`/`wizard.next`，强制写入配置 + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，它们的行为类似于“智能体可靠性评估”：

- 通过真实 Gateway 网关 + Agent loop 运行模拟工具调用（`src/gateway/gateway.test.ts`）。
- 端到端向导流程，用于验证会话接线和配置效果（`src/gateway/gateway.test.ts`）。

对于 Skills（见 [Skills](/zh-CN/tools/skills)），目前仍缺少：

- **决策能力：** 当 Skills 在提示中列出时，智能体是否会选择正确的 Skills（或避免无关 Skills）？
- **遵循性：** 智能体在使用前是否会读取 `SKILL.md`，并遵循要求的步骤/参数？
- **工作流契约：** 用于断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应优先保持确定性：

- 一个使用模拟 provider 的场景运行器，用于断言工具调用 + 顺序、skill 文件读取和会话接线。
- 一小组聚焦 Skills 的场景（使用 vs 避免、门控、提示注入）。
- 只有在对 CI 安全的测试套件就位之后，才添加可选的 live 评估（显式选择、由环境变量门控）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册的插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状和行为断言。默认的 `pnpm test` unit 通道会有意跳过这些共享接缝和冒烟测试文件；当你修改共享渠道或 provider 界面时，请显式运行契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅 provider 契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息负载结构
- **inbound** - 入站消息处理
- **actions** - 渠道动作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录/成员表 API
- **group-policy** - 群组策略执行

### Provider 状态契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道状态探测
- **registry** - 插件注册表形状

### Provider 契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 认证流程契约
- **auth-choice** - 认证选择/选择逻辑
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - provider 运行时
- **shape** - 插件形状/接口
- **wizard** - 设置向导

### 何时运行

- 修改 `plugin-sdk` 导出或子路径之后
- 添加或修改渠道或 provider 插件之后
- 重构插件注册或发现逻辑之后

契约测试会在 CI 中运行，并且不需要真实 API 密钥。

## 添加回归测试（指导）

当你修复一个在 live 中发现的 provider/模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（模拟/stub provider，或捕获精确的请求形状转换）
- 如果问题本质上只能在 live 中复现（限流、认证策略），则保持 live 测试范围狭窄，并通过环境变量显式选择启用
- 优先定位到能捕获该缺陷的最小层级：
  - provider 请求转换/回放缺陷 → 直连模型测试
  - Gateway 网关会话/历史/工具流水线缺陷 → Gateway 网关 live 冒烟测试或对 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历防护：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历片段 exec id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中添加了新的 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在遇到未分类 target id 时故意失败，这样新类别就无法被静默跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)

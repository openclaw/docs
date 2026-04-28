---
read_when:
    - 在本地或在 CI 中运行测试
    - 为模型 / 提供商缺陷添加回归测试
    - 调试 Gateway 网关 + 智能体行为
summary: 测试工具包：单元 / e2e / live 测试套件、Docker 运行器，以及每类测试覆盖的内容
title: 测试
x-i18n:
    generated_at: "2026-04-28T01:58:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: d2511d646a4e86fa0b7c17eb94dcc4931b88abb510a67f31e155f7da3f41279d
    source_path: help/testing.md
    workflow: 15
---

OpenClaw 有三套 Vitest 测试套件（单元 / 集成、e2e、live）以及一小组 Docker 运行器。本文档是一份“我们如何测试”的指南：

- 每个测试套件覆盖什么（以及它刻意**不**覆盖什么）。
- 常见工作流（本地、推送前、调试）应运行哪些命令。
- live 测试如何发现凭证并选择模型 / 提供商。
- 如何为真实世界中的模型 / 提供商问题添加回归测试。

<Note>
**QA stack（qa-lab、qa-channel、live transport lanes）**另有单独文档说明：

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 架构、命令面、场景编写。
- [Matrix QA](/zh-CN/concepts/qa-matrix) — `pnpm openclaw qa matrix` 的参考文档。
- [QA channel](/zh-CN/channels/qa-channel) — 仓库支持场景所使用的合成传输插件。

本页介绍如何运行常规测试套件以及 Docker / Parallels 运行器。下方的 QA 专用运行器部分（[QA-specific runners](#qa-specific-runners)）列出了具体的 `qa` 调用方式，并回链到上面的参考文档。
</Note>

## 快速开始

大多数时候：

- 完整闸门（预期应在推送前运行）：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- 在配置充足的机器上更快地运行本地全套测试：`pnpm test:max`
- 直接使用 Vitest 监视循环：`pnpm test:watch`
- 现在也支持直接按文件定位 extension / channel 路径：`pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- 当你在迭代单个失败用例时，优先先跑有针对性的测试。
- Docker 支持的 QA 站点：`pnpm qa:lab:up`
- Linux VM 支持的 QA lane：`pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

当你改动了测试或想获得更多信心时：

- 覆盖率闸门：`pnpm test:coverage`
- E2E 测试套件：`pnpm test:e2e`

当你在调试真实提供商 / 模型时（需要真实凭证）：

- live 测试套件（模型 + Gateway 网关工具 / 图像探测）：`pnpm test:live`
- 安静地只跑一个 live 文件：`pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live 模型扫描：`pnpm test:docker:live-models`
  - 现在，每个选中的模型都会运行一次文本轮次加一个小型文件读取式探测。元数据声明支持 `image` 输入的模型还会再运行一个微型图像轮次。在隔离提供商故障时，可通过 `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` 或 `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` 禁用这些额外探测。
  - CI 覆盖：每日的 `OpenClaw Scheduled Live And E2E Checks` 和手动的 `OpenClaw Release Checks` 都会调用可复用的 live / E2E 工作流，并设置 `include_live_suites: true`，其中包括按提供商分片的独立 Docker live 模型矩阵作业。
  - 若要进行聚焦的 CI 重跑，请分发 `OpenClaw Live And E2E Checks (Reusable)`，并设置 `include_live_suites: true` 与 `live_models_only: true`。
  - 将新的高信号提供商密钥添加到 `scripts/ci-hydrate-live-auth.sh`、`.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` 以及其定时 / 发布调用方中。
- 原生 Codex 绑定聊天冒烟测试：`pnpm test:docker:live-codex-bind`
  - 在 Docker live lane 中针对 Codex app-server 路径运行，将一个合成 Slack 私信通过 `/codex bind` 绑定，执行 `/codex fast` 和 `/codex permissions`，然后验证普通回复和图像附件都经由原生插件绑定路由，而不是 ACP。
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`
  - 通过插件拥有的 Codex app-server harness 运行 Gateway 网关智能体轮次，验证 `/codex status` 和 `/codex models`，并且默认执行图像、cron MCP、子智能体以及 Guardian 探测。在隔离其他 Codex app-server 故障时，可通过 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` 禁用子智能体探测。若要进行聚焦的子智能体检查，请禁用其他探测：`OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`。
    除非设置了 `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`，否则该命令会在子智能体探测后退出。
- Crestodian 救援命令冒烟测试：`pnpm test:live:crestodian-rescue-channel`
  - 对消息渠道救援命令表面进行可选的双保险检查。它会执行 `/crestodian status`，排队一个持久模型变更，回复 `/crestodian yes`，并验证审计 / 配置写入路径。
- Crestodian planner Docker 冒烟测试：`pnpm test:docker:crestodian-planner`
  - 在一个无配置容器中运行 Crestodian，并在 `PATH` 上放置一个假的 Claude CLI，验证模糊 planner 回退会转换成带审计记录的类型化配置写入。
- Crestodian 首次运行 Docker 冒烟测试：`pnpm test:docker:crestodian-first-run`
  - 从空的 OpenClaw 状态目录启动，将裸 `openclaw` 路由到 Crestodian，应用设置 / 模型 / 智能体 / Discord 插件 + SecretRef 写入，验证配置，并检查审计条目。同一条 Ring 0 设置路径也在 QA Lab 中通过 `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` 覆盖。
- Moonshot / Kimi 成本冒烟测试：设置 `MOONSHOT_API_KEY` 后，运行 `openclaw models list --provider moonshot --json`，然后针对 `moonshot/kimi-k2.6` 运行独立命令 `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  。验证 JSON 报告的是 Moonshot / K2.6，且助手转录中存储了归一化后的 `usage.cost`。

<Tip>
当你只需要一个失败用例时，优先使用下面描述的 allowlist 环境变量来收窄 live 测试范围。
</Tip>

## QA 专用运行器

当你需要 qa-lab 级别的真实感时，这些命令与主测试套件并列使用：

CI 会在专用工作流中运行 QA Lab。`Parity gate` 会在匹配的 PR 上以及通过手动分发、使用 mock 提供商时运行。`QA-Lab - All Lanes` 会在 `main` 上按夜间计划运行，也可通过手动分发运行；其中 mock parity gate、live Matrix lane、Convex 托管的 live Telegram lane，以及 Convex 托管的 live Discord lane 会作为并行作业执行。定时 QA 和发布检查会显式传入 Matrix `--profile fast`，而 Matrix CLI 和手动工作流输入的默认值仍为 `all`；手动分发可以将 `all` 分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 会在发布批准前运行 parity，以及 fast Matrix 和 Telegram lanes。

- `pnpm openclaw qa suite`
  - 直接在主机上运行由仓库支持的 QA 场景。
  - 默认会以隔离的 Gateway 网关 worker 并行运行多个选中的场景。`qa-channel` 默认为并发 4（受所选场景数量限制）。使用 `--concurrency <count>` 调整 worker 数量，或使用 `--concurrency 1` 走旧式串行 lane。
  - 当任一场景失败时以非零状态退出。如果你想保留产物但不让退出码失败，请使用 `--allow-failures`。
  - 支持提供商模式 `live-frontier`、`mock-openai` 和 `aimock`。
    `aimock` 会启动一个本地的 AIMock 支持提供商服务器，用于实验性的 fixture 和协议 mock 覆盖，而不会替代具备场景感知能力的 `mock-openai` lane。
- `pnpm openclaw qa suite --runner multipass`
  - 在一次性 Multipass Linux VM 中运行同样的 QA 测试套件。
  - 与主机上的 `qa suite` 保持相同的场景选择行为。
  - 复用与 `qa suite` 相同的提供商 / 模型选择标志。
  - live 运行会转发适合访客环境的、受支持的 QA 鉴权输入：基于环境变量的提供商密钥、QA live 提供商配置路径，以及存在时的 `CODEX_HOME`。
  - 输出目录必须保持在仓库根目录下，这样访客环境才能通过挂载的工作区写回。
  - 会在 `.artifacts/qa-e2e/...` 下写入常规 QA 报告 + 摘要，以及 Multipass 日志。
- `pnpm qa:lab:up`
  - 启动 Docker 支持的 QA 站点，供偏运维风格的 QA 工作使用。
- `pnpm test:docker:npm-onboard-channel-agent`
  - 从当前检出构建一个 npm tarball，在 Docker 中全局安装，以非交互方式运行 OpenAI API 密钥新手引导，默认配置 Telegram，验证启用插件会按需安装运行时依赖，运行 doctor，并对一个模拟的 OpenAI 端点执行一次本地智能体轮次。
  - 使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 可在 Discord 上运行相同的打包安装 lane。
- `pnpm test:docker:session-runtime-context`
  - 针对嵌入式运行时上下文转录运行一个确定性的已构建应用 Docker 冒烟测试。它会验证隐藏的 OpenClaw 运行时上下文以不可显示的自定义消息形式持久化，而不是泄漏到可见的用户轮次中；然后会植入一份受影响的损坏会话 JSONL，并验证 `openclaw doctor --fix` 会将其重写到当前活动分支并保留备份。
- `pnpm test:docker:npm-telegram-live`
  - 在 Docker 中安装一个 OpenClaw 包候选版本，运行已安装包的新手引导，通过已安装的 CLI 配置 Telegram，然后复用 live Telegram QA lane，并将这个已安装包作为待测系统 Gateway 网关。
  - 默认使用 `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`；设置 `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` 或 `OPENCLAW_CURRENT_PACKAGE_TGZ`，即可测试已解析的本地 tarball，而不是从注册表安装。
  - 使用与 `pnpm openclaw qa telegram` 相同的 Telegram 环境变量凭证或 Convex 凭证来源。对于 CI / 发布自动化，设置 `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex`，并同时设置 `OPENCLAW_QA_CONVEX_SITE_URL` 与角色密钥。如果在 CI 中存在 `OPENCLAW_QA_CONVEX_SITE_URL` 和 Convex 角色密钥，则 Docker 包装器会自动选择 Convex。
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` 仅为此 lane 覆盖共享的 `OPENCLAW_QA_CREDENTIAL_ROLE`。
  - GitHub Actions 还将此 lane 暴露为手动维护者工作流 `NPM Telegram Beta E2E`。它不会在合并时运行。该工作流使用 `qa-live-shared` 环境和 Convex CI 凭证租约。
- GitHub Actions 还暴露了 `Package Acceptance`，用于针对单个候选包执行旁路产品验证。它接受可信 ref、已发布的 npm 规格、带 SHA-256 的 HTTPS tarball URL，或来自其他运行的 tarball 制品；然后将标准化后的 `openclaw-current.tgz` 作为 `package-under-test` 上传，再运行现有 Docker E2E 调度器的 smoke、package、product、full 或 custom lane 配置文件。设置 `telegram_mode=mock-openai` 或 `live-frontier`，即可针对同一个 `package-under-test` 制品运行 Telegram QA 工作流。
  - 最新 beta 产品验证：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- 精确 tarball URL 验证需要摘要：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- 制品验证会从另一个 Actions 运行下载 tarball 制品：

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - 在 Docker 中打包并安装当前的 OpenClaw 构建，启动已配置 OpenAI 的 Gateway 网关，然后通过配置编辑启用内置渠道 / 插件。
  - 验证设置发现阶段会保持未配置插件的运行时依赖缺失状态；首次配置后的 Gateway 网关或 doctor 运行会按需安装每个内置插件的运行时依赖；第二次重启不会重新安装已经激活的依赖。
  - 还会安装一个已知的旧 npm 基线版本，在运行 `openclaw update --tag <candidate>` 之前启用 Telegram，并验证候选版本的更新后 doctor 会修复内置渠道的运行时依赖，而无需 harness 侧的 postinstall 修复。
- `pnpm test:parallels:npm-update`
  - 在 Parallels 客户机中运行原生打包安装更新冒烟测试。每个选中的平台都会先安装请求的基线包，然后在同一个客户机中运行已安装的 `openclaw update` 命令，并验证已安装版本、更新状态、Gateway 网关就绪状态以及一次本地智能体轮次。
  - 迭代单个客户机时，使用 `--platform macos`、`--platform windows` 或 `--platform linux`。使用 `--json` 获取摘要制品路径和每个 lane 的状态。
  - OpenAI lane 默认使用 `openai/gpt-5.5` 作为 live 智能体轮次验证模型。若要有意验证其他 OpenAI 模型，请传入 `--model <provider/model>` 或设置 `OPENCLAW_PARALLELS_OPENAI_MODEL`。
  - 将较长的本地运行包裹在主机超时中，以免 Parallels 传输停滞耗尽剩余测试窗口：

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - 该脚本会将嵌套 lane 日志写入 `/tmp/openclaw-parallels-npm-update.*` 下。不要在假定外层包装器卡住之前，先查看 `windows-update.log`、`macos-update.log` 或 `linux-update.log`。
  - 在冷启动客户机上，Windows 更新后的 doctor / 运行时依赖修复可能需要 10 到 15 分钟；只要嵌套的 npm 调试日志仍在推进，这仍然是健康状态。
  - 不要将这个聚合包装器与单独的 Parallels macOS、Windows 或 Linux 冒烟 lane 并行运行。它们共享 VM 状态，可能会在快照恢复、包服务或客户机 Gateway 网关状态上发生冲突。
  - 更新后验证会运行常规的内置插件表面，因为像语音、图像生成和媒体理解这样的能力外观层，即使智能体轮次本身只检查简单文本响应，也仍然会通过内置运行时 API 加载。

- `pnpm openclaw qa aimock`
  - 仅启动本地 AIMock 提供商服务器，用于直接协议冒烟测试。
- `pnpm openclaw qa matrix`
  - 针对一次性 Docker 支持的 Tuwunel homeserver 运行 Matrix live QA lane。仅适用于源码检出 —— 打包安装不附带 `qa-lab`。
  - 完整的 CLI、profile / 场景目录、环境变量和制品布局： [Matrix QA](/zh-CN/concepts/qa-matrix)。
- `pnpm openclaw qa telegram`
  - 使用来自环境变量的 driver 和待测系统 bot token，在真实私有群组上运行 Telegram live QA lane。
  - 需要 `OPENCLAW_QA_TELEGRAM_GROUP_ID`、`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` 和 `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`。群组 id 必须是数字形式的 Telegram chat id。
  - 支持 `--credential-source convex` 以使用共享凭证池。默认使用环境变量模式，或设置 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` 以启用池化租约。
  - 当任何场景失败时会以非零状态退出。如果你想保留制品但不让退出码失败，请使用 `--allow-failures`。
  - 需要在同一个私有群组中的两个不同 bot，且待测系统 bot 必须暴露 Telegram 用户名。
  - 为了实现稳定的 bot 对 bot 观察，请在 `@BotFather` 中为两个 bot 启用 Bot-to-Bot Communication Mode，并确保 driver bot 能观察到群组内的 bot 流量。
  - 会在 `.artifacts/qa-e2e/...` 下写入 Telegram QA 报告、摘要和 observed-messages 制品。回复类场景会包含从 driver 发送请求到观察到待测系统回复之间的 RTT。

live 传输 lanes 共享一份标准契约，因此新传输不会发生漂移；每个 lane 的覆盖矩阵位于 [QA overview → Live transport coverage](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 是更广泛的合成测试套件，不属于该矩阵的一部分。

### 通过 Convex 共享 Telegram 凭证（v1）

当为 `openclaw qa telegram` 启用 `--credential-source convex`（或 `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`）时，QA lab 会从 Convex 支持的凭证池中获取一个独占租约，在 lane 运行期间为该租约发送心跳，并在关闭时释放租约。

参考 Convex 项目脚手架：

- `qa/convex-credential-broker/`

必需的环境变量：

- `OPENCLAW_QA_CONVEX_SITE_URL`（例如 `https://your-deployment.convex.site`）
- 所选角色对应的一个密钥：
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` 用于 `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` 用于 `ci`
- 凭证角色选择：
  - CLI：`--credential-role maintainer|ci`
  - 环境变量默认值：`OPENCLAW_QA_CREDENTIAL_ROLE`（在 CI 中默认是 `ci`，否则默认是 `maintainer`）

可选环境变量：

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS`（默认 `1200000`）
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS`（默认 `30000`）
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS`（默认 `90000`）
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS`（默认 `15000`）
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`（默认 `/qa-credentials/v1`）
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID`（可选追踪 id）
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` 允许在仅限本地开发时使用 loopback `http://` Convex URL。

`OPENCLAW_QA_CONVEX_SITE_URL` 在正常运行中应使用 `https://`。

维护者管理命令（池添加 / 删除 / 列表）明确要求使用 `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`。

供维护者使用的 CLI 辅助命令：

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

在 live 运行之前使用 `doctor`，检查 Convex 站点 URL、broker 密钥、端点前缀、HTTP 超时以及 admin / list 可达性，同时不会打印密钥值。在脚本和 CI 工具中使用 `--json` 可获得机器可读输出。

默认端点契约（`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`）：

- `POST /acquire`
  - 请求：`{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - 成功：`{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - 池已耗尽 / 可重试：`{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Telegram 类型的载荷结构：

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` 必须是数字形式的 Telegram chat id 字符串。
- `admin/add` 会对 `kind: "telegram"` 验证该结构，并拒绝格式错误的载荷。

### 向 QA 添加一个渠道

新渠道适配器的架构和场景辅助函数名称位于 [QA overview → Adding a channel](/zh-CN/concepts/qa-e2e-automation#adding-a-channel)。最低门槛：在共享的 `qa-lab` 主机接缝上实现传输运行器，在插件清单中声明 `qaRunners`，挂载为 `openclaw qa <runner>`，并在 `qa/scenarios/` 下编写场景。

## 测试套件（在哪里运行什么）

可以把这些测试套件理解为“真实度逐步提升”（同时不稳定性 / 成本也逐步提升）：

### 单元 / 集成（默认）

- 命令：`pnpm test`
- 配置：未定向运行使用 `vitest.full-*.config.ts` 分片集合，并且可能会将多项目分片扩展为按项目划分的配置，以便并行调度
- 文件：核心 / 单元清单位于 `src/**/*.test.ts`、`packages/**/*.test.ts` 和 `test/**/*.test.ts`；UI 单元测试在专用的 `unit-ui` 分片中运行
- 范围：
  - 纯单元测试
  - 进程内集成测试（Gateway 网关鉴权、路由、工具、解析、配置）
  - 已知缺陷的确定性回归测试
- 预期：
  - 在 CI 中运行
  - 不需要真实密钥
  - 应该快速且稳定

<AccordionGroup>
  <Accordion title="项目、分片和作用域 lane">

    - 未定向的 `pnpm test` 会运行 12 个较小的分片配置（`core-unit-fast`、`core-unit-src`、`core-unit-security`、`core-unit-ui`、`core-unit-support`、`core-support-boundary`、`core-contracts`、`core-bundled`、`core-runtime`、`agentic`、`auto-reply`、`extensions`），而不是一个巨大的原生根项目进程。这样可以降低高负载机器上的 RSS 峰值，并避免 auto-reply / extension 工作拖慢无关测试套件。
    - `pnpm test --watch` 仍然使用原生根 `vitest.config.ts` 项目图，因为多分片监视循环并不现实。
    - `pnpm test`、`pnpm test:watch` 和 `pnpm test:perf:imports` 现在会优先通过作用域 lane 路由显式文件 / 目录目标，因此 `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` 不需要承担完整根项目启动成本。
    - `pnpm test:changed` 默认会将变更的 git 路径扩展为廉价的作用域 lane：直接的测试编辑、同级 `*.test.ts` 文件、显式源码映射以及本地导入图依赖项。配置 / setup / 包编辑不会广泛运行测试，除非你显式使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm check:changed` 是针对小范围工作的常规智能本地检查闸门。它会将 diff 分类为 core、core tests、extensions、extension tests、apps、docs、发布元数据、live Docker 工具链以及工具链，然后运行匹配的 typecheck、lint 和 guard 命令。它不会运行 Vitest 测试；测试验证请调用 `pnpm test:changed` 或显式的 `pnpm test <target>`。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查，并带有一个 guard，用于拒绝顶层 version 字段之外的包变更。
    - live Docker ACP harness 编辑会运行聚焦检查：对 live Docker 鉴权脚本进行 shell 语法检查，以及一次 live Docker 调度器 dry-run。只有当 diff 仅限于 `scripts["test:docker:live-*"]` 时，才会包含 `package.json` 变更；依赖、导出、版本以及其他包表面编辑仍然使用更广泛的 guard。
    - 来自 agents、commands、plugins、auto-reply 辅助函数、`plugin-sdk` 以及类似纯工具区域的轻导入单元测试，会路由到 `unit-fast` lane，该 lane 会跳过 `test/setup-openclaw-runtime.ts`；有状态 / 运行时较重的文件仍保留在现有 lane 中。
    - 某些 `plugin-sdk` 和 `commands` 辅助源码文件，在 changed 模式运行时也会映射到这些轻量 lane 中的显式同级测试，因此辅助函数编辑无需为该目录重跑完整的重型测试套件。
    - `auto-reply` 为顶层核心辅助函数、顶层 `reply.*` 集成测试以及 `src/auto-reply/reply/**` 子树设置了专用分桶。CI 还会将 reply 子树进一步拆分为 agent-runner、dispatch 和 commands / state-routing 分片，这样某一个导入较重的分桶就不会独占完整的 Node 尾部时间。

  </Accordion>

  <Accordion title="嵌入式运行器覆盖">

    - 当你修改消息工具发现输入或压缩运行时上下文时，要同时保留这两个层级的覆盖。
    - 为纯路由和归一化边界添加聚焦的辅助函数回归测试。
    - 保持嵌入式运行器集成测试套件健康：
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`、
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` 和
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`。
    - 这些测试套件会验证作用域 id 和压缩行为仍会流经真实的 `run.ts` / `compact.ts` 路径；仅有辅助函数测试并不能充分替代这些集成路径。

  </Accordion>

  <Accordion title="Vitest 池和隔离默认值">

    - 基础 Vitest 配置默认使用 `threads`。
    - 共享 Vitest 配置固定 `isolate: false`，并在根项目、e2e 和 live 配置中使用非隔离运行器。
    - 根 UI lane 保留其 `jsdom` 设置和优化器，但也在共享的非隔离运行器上运行。
    - 每个 `pnpm test` 分片都从共享 Vitest 配置继承相同的 `threads` + `isolate: false` 默认值。
    - `scripts/run-vitest.mjs` 默认会为 Vitest 子 Node 进程添加 `--no-maglev`，以减少大型本地运行期间的 V8 编译抖动。设置 `OPENCLAW_VITEST_ENABLE_MAGLEV=1` 可与原生 V8 行为进行对比。

  </Accordion>

  <Accordion title="快速本地迭代">

    - `pnpm changed:lanes` 会显示某个 diff 会触发哪些架构 lane。
    - pre-commit hook 只做格式化。它会重新暂存格式化后的文件，不会运行 lint、typecheck 或测试。
    - 在你需要智能本地检查闸门时，交接或推送前请显式运行 `pnpm check:changed`。
    - `pnpm test:changed` 默认通过廉价的作用域 lane 路由。只有当智能体判断 harness、配置、包或契约编辑确实需要更广的 Vitest 覆盖时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。
    - `pnpm test:max` 和 `pnpm test:changed:max` 保持相同的路由行为，只是使用更高的 worker 上限。
    - 本地 worker 自动缩放刻意设计得较为保守；当主机负载平均值已经很高时，它会回退，因此默认情况下，多路并发 Vitest 运行造成的影响会更小。
    - 基础 Vitest 配置会将项目 / 配置文件标记为 `forceRerunTriggers`，以便在测试接线发生变化时，changed 模式的重跑仍然正确。
    - 该配置会在受支持主机上保持 `OPENCLAW_VITEST_FS_MODULE_CACHE` 启用；如果你想为直接性能分析指定一个明确的缓存位置，请设置 `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`。

  </Accordion>

  <Accordion title="性能调试">

    - `pnpm test:perf:imports` 会启用 Vitest 导入时长报告以及导入明细输出。
    - `pnpm test:perf:imports:changed` 会将同样的性能分析视图限定到自 `origin/main` 以来发生变化的文件。
    - 分片计时数据会写入 `.artifacts/vitest-shard-timings.json`。整套配置运行使用配置路径作为键；include-pattern CI 分片会附加分片名称，这样就可以分别跟踪被过滤的分片。
    - 当某个热点测试的大部分时间仍消耗在启动导入上时，应将重型依赖放在一个狭窄的本地 `*.runtime.ts` 接缝之后，并直接 mock 该接缝，而不是为了传给 `vi.mock(...)` 就深度导入运行时辅助函数。
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` 会针对该已提交 diff，对比路由后的 `test:changed` 与原生根项目路径，并打印墙钟时间和 macOS 最大 RSS。
    - `pnpm test:perf:changed:bench -- --worktree` 会通过 `scripts/test-projects.mjs` 和根 Vitest 配置，将当前脏工作树的变更文件列表进行路由并做基准测试。
    - `pnpm test:perf:profile:main` 会为 Vitest / Vite 启动与转换开销写出一个主线程 CPU profile。
    - `pnpm test:perf:profile:runner` 会在禁用文件并行的情况下，为单元测试套件写出 runner CPU + heap profiles。

  </Accordion>
</AccordionGroup>

### 稳定性（Gateway 网关）

- 命令：`pnpm test:stability:gateway`
- 配置：`vitest.gateway.config.ts`，强制单 worker
- 范围：
  - 启动一个默认启用诊断的真实 loopback Gateway 网关
  - 通过诊断事件路径驱动合成的 gateway message、memory 和大载荷抖动
  - 通过 Gateway 网关 WS RPC 查询 `diagnostics.stability`
  - 覆盖诊断稳定性包持久化辅助函数
  - 断言记录器保持有界、合成 RSS 样本保持在压力预算内，且每个会话的队列深度会回落到零
- 预期：
  - 对 CI 安全且无需密钥
  - 这是一个用于稳定性回归跟进的窄 lane，不替代完整的 Gateway 网关测试套件

### E2E（Gateway 网关冒烟）

- 命令：`pnpm test:e2e`
- 配置：`vitest.e2e.config.ts`
- 文件：`src/**/*.e2e.test.ts`、`test/**/*.e2e.test.ts`，以及 `extensions/` 下的内置插件 E2E 测试
- 运行时默认值：
  - 使用 Vitest `threads` 和 `isolate: false`，与仓库其他部分保持一致。
  - 使用自适应 worker（CI：最多 2 个，本地：默认 1 个）。
  - 默认以静默模式运行，以减少控制台 I/O 开销。
- 常用覆盖项：
  - `OPENCLAW_E2E_WORKERS=<n>` 用于强制指定 worker 数量（上限为 16）。
  - `OPENCLAW_E2E_VERBOSE=1` 用于重新启用详细控制台输出。
- 范围：
  - 多实例 Gateway 网关端到端行为
  - WebSocket / HTTP 表面、节点配对以及更重的网络交互
- 预期：
  - 会在 CI 中运行（当流水线启用时）
  - 不需要真实密钥
  - 比单元测试涉及更多可变部件（可能更慢）

### E2E：OpenShell 后端冒烟

- 命令：`pnpm test:e2e:openshell`
- 文件：`extensions/openshell/src/backend.e2e.test.ts`
- 范围：
  - 通过 Docker 在主机上启动一个隔离的 OpenShell gateway
  - 从一个临时本地 Dockerfile 创建沙箱
  - 通过真实的 `sandbox ssh-config` + SSH exec 练习 OpenClaw 的 OpenShell 后端
  - 通过 sandbox fs bridge 验证远端规范化文件系统行为
- 预期：
  - 仅按需启用；不属于默认 `pnpm test:e2e` 运行的一部分
  - 需要本地 `openshell` CLI 和可用的 Docker daemon
  - 使用隔离的 `HOME` / `XDG_CONFIG_HOME`，然后销毁测试 gateway 和沙箱
- 常用覆盖项：
  - `OPENCLAW_E2E_OPENSHELL=1` 可在手动运行更广泛的 e2e 测试套件时启用该测试
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` 可指向非默认 CLI 二进制或包装脚本

### live（真实提供商 + 真实模型）

- 命令：`pnpm test:live`
- 配置：`vitest.live.config.ts`
- 文件：`src/**/*.live.test.ts`、`test/**/*.live.test.ts`，以及 `extensions/` 下的内置插件 live 测试
- 默认：由 `pnpm test:live` **启用**（会设置 `OPENCLAW_LIVE_TEST=1`）
- 范围：
  - “这个提供商 / 模型在**今天**配合真实凭证是否真的能工作？”
  - 捕获提供商格式变化、工具调用怪癖、鉴权问题和速率限制行为
- 预期：
  - 按设计不具备 CI 稳定性（真实网络、真实提供商策略、配额、故障）
  - 会花钱 / 消耗速率限制
  - 优先运行收窄后的子集，而不是“全部”
- live 运行会 source `~/.profile`，以获取缺失的 API 密钥。
- 默认情况下，live 运行仍会隔离 `HOME`，并将配置 / 鉴权材料复制到一个临时测试 home 中，这样单元测试 fixture 就不会改动你真实的 `~/.openclaw`。
- 仅当你明确需要 live 测试使用真实 home 目录时，才设置 `OPENCLAW_LIVE_USE_REAL_HOME=1`。
- `pnpm test:live` 现在默认采用更安静的模式：它会保留 `[live] ...` 进度输出，但会抑制额外的 `~/.profile` 提示，并静音 gateway 启动日志 / Bonjour 杂音。若要恢复完整启动日志，请设置 `OPENCLAW_LIVE_TEST_QUIET=0`。
- API 密钥轮换（按提供商）：设置逗号 / 分号格式的 `*_API_KEYS`，或设置 `*_API_KEY_1`、`*_API_KEY_2`（例如 `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`），或者通过 `OPENCLAW_LIVE_*_KEY` 进行单次 live 覆盖；测试会在收到速率限制响应时重试。
- 进度 / 心跳输出：
  - live 测试套件现在会把进度行输出到 stderr，因此即使 Vitest 控制台捕获处于安静模式，长时间的提供商调用也能明显显示仍在活动。
  - `vitest.live.config.ts` 会禁用 Vitest 控制台拦截，因此在 live 运行期间，提供商 / gateway 进度行会立即流出。
  - 使用 `OPENCLAW_LIVE_HEARTBEAT_MS` 调整直接模型心跳。
  - 使用 `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` 调整 Gateway 网关 / 探测心跳。

## 我应该运行哪个测试套件？

使用这张决策表：

- 编辑逻辑 / 测试：运行 `pnpm test`（如果你改动很多，再加上 `pnpm test:coverage`）
- 触及 Gateway 网关网络 / WS 协议 / 配对：加跑 `pnpm test:e2e`
- 调试“我的 bot 挂了” / 提供商特定故障 / 工具调用：运行收窄后的 `pnpm test:live`

## live（接触网络的）测试

对于 live 模型矩阵、CLI 后端冒烟、ACP 冒烟、Codex app-server
harness，以及所有媒体提供商 live 测试（Deepgram、BytePlus（国际版）、ComfyUI、图像、
音乐、视频、媒体 harness）—— 以及 live 运行的凭证处理 —— 请参阅
[Testing — live suites](/zh-CN/help/testing-live)。

## Docker 运行器（可选的“在 Linux 中可运行”检查）

这些 Docker 运行器分为两类：

- live 模型运行器：`test:docker:live-models` 和 `test:docker:live-gateway` 仅在仓库 Docker 镜像内运行与各自 profile-key 匹配的 live 文件（`src/agents/models.profiles.live.test.ts` 和 `src/gateway/gateway-models.profiles.live.test.ts`），并挂载你的本地配置目录和工作区（如果已挂载，也会 source `~/.profile`）。对应的本地入口点是 `test:live:models-profiles` 和 `test:live:gateway-profiles`。
- Docker live 运行器默认采用更小的冒烟上限，以便完整的 Docker 扫描仍然可行：
  `test:docker:live-models` 默认设置 `OPENCLAW_LIVE_MAX_MODELS=12`，而
  `test:docker:live-gateway` 默认设置 `OPENCLAW_LIVE_GATEWAY_SMOKE=1`、
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`、
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`，以及
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`。当你明确想进行更大范围的穷尽扫描时，再覆盖这些环境变量。
- `test:docker:all` 会先通过 `test:docker:live-build` 构建一次 live Docker 镜像，再通过 `scripts/package-openclaw-for-docker.mjs` 将 OpenClaw 打包为一个 npm tarball，然后构建 / 复用两个 `scripts/e2e/Dockerfile` 镜像。裸镜像只包含用于安装 / 更新 / 插件依赖 lane 的 Node / Git 运行器；这些 lane 会挂载预构建 tarball。功能镜像则会将同一个 tarball 安装到 `/app` 中，用于已构建应用功能 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`；规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`；`scripts/test-docker-all.mjs` 会执行所选计划。这个聚合器使用带权重的本地调度器：`OPENCLAW_DOCKER_ALL_PARALLELISM` 控制进程槽位，而资源上限会阻止重型 live、npm 安装和多服务 lane 同时全部启动。如果某个单独 lane 比当前活动上限更重，调度器仍可在池为空时启动它，然后在容量再次可用之前让它单独运行。默认值为 10 个槽位、`OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`；只有当 Docker 主机有更多余量时，才调整 `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` 或 `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`。该运行器默认会执行 Docker 预检，移除陈旧的 OpenClaw E2E 容器，每 30 秒打印一次状态，将成功 lane 的耗时存储到 `.artifacts/docker-tests/lane-timings.json`，并在后续运行中利用这些耗时优先启动较长的 lane。使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 可打印带权重的 lane 清单而不构建或运行 Docker，或使用 `node scripts/test-docker-all.mjs --plan-json` 打印所选 lane、包 / 镜像需求和凭证的 CI 计划。
- `Package Acceptance` 是 GitHub 原生的包闸门，用于回答“这个可安装 tarball 作为产品是否可用？”。它会从 `source=npm`、`source=ref`、`source=url` 或 `source=artifact` 解析一个候选包，将其作为 `package-under-test` 上传，然后针对这个精确 tarball 运行可复用的 Docker E2E lanes，而不是重新打包所选 ref。`workflow_ref` 选择可信的工作流 / harness 脚本，而 `package_ref` 则在 `source=ref` 时选择要打包的源码提交 / 分支 / 标签；这样当前的验收逻辑就可以验证较早的可信提交。各个 profile 按覆盖广度排序：`smoke` 是快速安装 / 渠道 / 智能体加 gateway / 配置检查，`package` 覆盖包 / 更新 / 插件契约，并且是大多数 Parallels 包 / 更新覆盖的默认原生替代方案，`product` 会额外加入 MCP 渠道、cron / 子智能体清理、OpenAI Web 搜索以及 OpenWebUI，`full` 则会运行包含 OpenWebUI 的发布路径 Docker 分块。发布验证会运行一个自定义 package 增量（`bundled-channel-deps-compat plugins-offline`）以及 Telegram package QA，因为发布路径 Docker 分块已经覆盖了重叠的包 / 更新 / 插件 lanes。由制品生成的定向 GitHub Docker 重跑命令，在可用时会包含先前的包制品和已准备镜像输入，因此失败的 lane 可以避免重新构建包和镜像。
- 构建和发布检查会在 tsdown 之后运行 `scripts/check-cli-bootstrap-imports.mjs`。这个 guard 会从 `dist/entry.js` 和 `dist/cli/run-main.js` 开始遍历静态构建图，并在命令分发之前若启动导入了 Commander、prompt UI、undici 或 logging 等包依赖时失败；它还会将内置 gateway 运行分块控制在预算之内，并拒绝静态导入已知的冷 gateway 路径。打包 CLI 冒烟测试还覆盖根 help、onboard help、doctor help、status、config schema 以及一个 model-list 命令。
- `Package Acceptance` 的旧版兼容性上限是 `2026.4.25`（包含 `2026.4.25-beta.*`）。在该截止版本及之前，harness 只容忍已发布包中的元数据缺口：省略的私有 QA inventory 条目、缺失的 `gateway install --wrapper`、tarball 派生 git fixture 中缺失的 patch 文件、缺失的持久化 `update.channel`、旧版插件安装记录位置、缺失的 marketplace 安装记录持久化，以及 `plugins update` 期间的配置元数据迁移。对于 `2026.4.25` 之后的包，这些路径都会被视为严格失败。
- 容器冒烟运行器：`test:docker:openwebui`、`test:docker:onboard`、`test:docker:npm-onboard-channel-agent`、`test:docker:update-channel-switch`、`test:docker:session-runtime-context`、`test:docker:agents-delete-shared-workspace`、`test:docker:gateway-network`、`test:docker:browser-cdp-snapshot`、`test:docker:mcp-channels`、`test:docker:pi-bundle-mcp-tools`、`test:docker:cron-mcp-cleanup`、`test:docker:plugins`、`test:docker:plugin-update` 和 `test:docker:config-reload` 会启动一个或多个真实容器，并验证更高层级的集成路径。

live 模型 Docker 运行器还会只绑定挂载所需的 CLI 鉴权 home（如果运行未收窄，则挂载所有受支持的 home），然后在运行前将它们复制到容器 home 中，这样外部 CLI OAuth 就可以刷新令牌，而不会改动主机鉴权存储：

- 直接模型：`pnpm test:docker:live-models`（脚本：`scripts/test-live-models-docker.sh`）
- ACP 绑定冒烟测试：`pnpm test:docker:live-acp-bind`（脚本：`scripts/test-live-acp-bind-docker.sh`；默认覆盖 Claude、Codex 和 Gemini，对 Droid / OpenCode 的严格覆盖可通过 `pnpm test:docker:live-acp-bind:droid` 和 `pnpm test:docker:live-acp-bind:opencode` 运行）
- CLI 后端冒烟测试：`pnpm test:docker:live-cli-backend`（脚本：`scripts/test-live-cli-backend-docker.sh`）
- Codex app-server harness 冒烟测试：`pnpm test:docker:live-codex-harness`（脚本：`scripts/test-live-codex-harness-docker.sh`）
- Gateway 网关 + dev 智能体：`pnpm test:docker:live-gateway`（脚本：`scripts/test-live-gateway-models-docker.sh`）
- 可观测性冒烟测试：`pnpm qa:otel:smoke` 是一个私有 QA 源码检出 lane。它刻意不属于包 Docker 发布 lanes，因为 npm tarball 不包含 QA Lab。
- Open WebUI live 冒烟测试：`pnpm test:docker:openwebui`（脚本：`scripts/e2e/openwebui-docker.sh`）
- 新手引导 wizard（TTY，完整脚手架）：`pnpm test:docker:onboard`（脚本：`scripts/e2e/onboard-docker.sh`）
- npm tarball 新手引导 / 渠道 / 智能体冒烟测试：`pnpm test:docker:npm-onboard-channel-agent` 会在 Docker 中全局安装已打包的 OpenClaw tarball，通过 env-ref 新手引导配置 OpenAI，并默认配置 Telegram，验证 doctor 会修复已激活插件的运行时依赖，然后运行一次模拟的 OpenAI 智能体轮次。使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可复用预构建 tarball，使用 `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` 可跳过主机构建，或使用 `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` 切换渠道。
- 更新渠道切换冒烟测试：`pnpm test:docker:update-channel-switch` 会在 Docker 中全局安装已打包的 OpenClaw tarball，从包 `stable` 切换到 git `dev`，验证持久化的渠道和插件在更新后仍可工作，然后再切回包 `stable` 并检查更新状态。
- 会话运行时上下文冒烟测试：`pnpm test:docker:session-runtime-context` 会验证隐藏运行时上下文转录的持久化，以及 doctor 对受影响的重复 prompt-rewrite 分支的修复。
- Bun 全局安装冒烟测试：`bash scripts/e2e/bun-global-install-smoke.sh` 会打包当前工作树，在隔离的 home 中使用 `bun install -g` 安装它，并验证 `openclaw infer image providers --json` 返回的是内置图像提供商，而不是卡住。使用 `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 可复用预构建 tarball，使用 `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` 可跳过主机构建，或者使用 `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local` 从已构建的 Docker 镜像复制 `dist/`。
- 安装器 Docker 冒烟测试：`bash scripts/test-install-sh-docker.sh` 会在其 root、update 和 direct-npm 容器之间共享一个 npm 缓存。更新冒烟测试默认使用 npm `latest` 作为稳定基线，然后升级到候选 tarball。你可以在本地用 `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` 覆盖，或在 GitHub 上通过 Install Smoke 工作流的 `update_baseline_version` 输入覆盖。非 root 安装器检查会保持隔离的 npm 缓存，这样 root 拥有的缓存条目就不会掩盖用户本地安装行为。设置 `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` 可在本地重复运行之间复用 root / update / direct-npm 缓存。
- Install Smoke CI 会通过 `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1` 跳过重复的 direct-npm 全局更新；若需要 direct `npm install -g` 覆盖，请在本地运行该脚本且不要设置这个环境变量。
- Agents 删除共享工作区 CLI 冒烟测试：`pnpm test:docker:agents-delete-shared-workspace`（脚本：`scripts/e2e/agents-delete-shared-workspace-docker.sh`）默认构建根 Dockerfile 镜像，在隔离的容器 home 中为两个 Agents 预置一个工作区，运行 `agents delete --json`，并验证 JSON 合法以及工作区保留行为。使用 `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` 可复用 install-smoke 镜像。
- Gateway 网关网络（两个容器，WS 鉴权 + 健康检查）：`pnpm test:docker:gateway-network`（脚本：`scripts/e2e/gateway-network-docker.sh`）
- 浏览器 CDP 快照冒烟测试：`pnpm test:docker:browser-cdp-snapshot`（脚本：`scripts/e2e/browser-cdp-snapshot-docker.sh`）会构建源码 E2E 镜像以及 Chromium 层，使用原始 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证 CDP 角色快照覆盖链接 URL、光标提升的可点击元素、iframe 引用以及 frame 元数据。
- OpenAI Responses `web_search` 最小推理回归测试：`pnpm test:docker:openai-web-search-minimal`（脚本：`scripts/e2e/openai-web-search-minimal-docker.sh`）会通过 Gateway 网关运行一个模拟的 OpenAI 服务器，验证 `web_search` 会将 `reasoning.effort` 从 `minimal` 提升到 `low`，然后强制提供商 schema 拒绝，并检查原始细节是否出现在 Gateway 网关日志中。
- MCP 渠道桥接（已预置的 Gateway 网关 + stdio bridge + 原始 Claude 通知帧冒烟测试）：`pnpm test:docker:mcp-channels`（脚本：`scripts/e2e/mcp-channels-docker.sh`）
- Pi 内置 MCP 工具（真实 stdio MCP 服务器 + 嵌入式 Pi 配置文件 allow / deny 冒烟测试）：`pnpm test:docker:pi-bundle-mcp-tools`（脚本：`scripts/e2e/pi-bundle-mcp-tools-docker.sh`）
- cron / 子智能体 MCP 清理（真实 Gateway 网关 + 在隔离 cron 和一次性子智能体运行后清理 stdio MCP 子进程）：`pnpm test:docker:cron-mcp-cleanup`（脚本：`scripts/e2e/cron-mcp-cleanup-docker.sh`）
- 插件（安装冒烟测试、ClawHub 安装 / 卸载、marketplace 更新，以及 Claude 内置包启用 / 检查）：`pnpm test:docker:plugins`（脚本：`scripts/e2e/plugins-docker.sh`）
  设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可跳过 live ClawHub 代码块，或通过 `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` 和 `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID` 覆盖默认包。
- 插件更新无变更冒烟测试：`pnpm test:docker:plugin-update`（脚本：`scripts/e2e/plugin-update-unchanged-docker.sh`）
- 配置热重载元数据冒烟测试：`pnpm test:docker:config-reload`（脚本：`scripts/e2e/config-reload-source-docker.sh`）
- 内置插件运行时依赖：`pnpm test:docker:bundled-channel-deps` 默认会构建一个小型 Docker 运行器镜像，在主机上构建并打包一次 OpenClaw，然后将该 tarball 挂载到每个 Linux 安装场景中。使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 可复用镜像，使用 `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` 可在刚完成本地构建后跳过主机重建，或者使用 `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` 指向现有 tarball。完整的 Docker 聚合器和发布路径 bundled-channel 分块会先统一预打包这个 tarball，然后将内置渠道检查分片为独立 lanes，包括 Telegram、Discord、Slack、Feishu、memory-lancedb 和 ACPX 的单独更新 lanes。发布分块会将渠道冒烟测试、更新目标以及设置 / 运行时契约拆分为 `bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`；聚合的 `bundled-channels` 分块仍可用于手动重跑。发布工作流还会拆分提供商安装器分块以及内置插件安装 / 卸载分块；旧版的 `package-update`、`plugins-runtime` 和 `plugins-integrations` 分块仍保留为手动重跑的聚合别名。直接运行内置 lane 时，使用 `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` 可收窄渠道矩阵，或使用 `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` 可收窄更新场景。该 lane 还会验证 `channels.<id>.enabled=false` 和 `plugins.entries.<id>.enabled=false` 会抑制 doctor / 运行时依赖修复。
- 迭代时若想收窄内置插件运行时依赖范围，可禁用无关场景，例如：
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`。

若要手动预构建并复用共享功能镜像：

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

像 `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` 这样的测试套件专用镜像覆盖项在设置时仍然优先。当 `OPENCLAW_SKIP_DOCKER_BUILD=1` 指向远程共享镜像时，如果镜像尚未存在于本地，这些脚本会先拉取它。QR 和安装器 Docker 测试保留各自独立的 Dockerfile，因为它们验证的是包 / 安装行为，而不是共享的已构建应用运行时。

live 模型 Docker 运行器还会以只读方式绑定挂载当前检出，并将其暂存到容器内的临时工作目录中。这样可以让运行时镜像保持精简，同时仍能针对你当前精确的本地源码 / 配置运行 Vitest。暂存步骤会跳过大型本地专用缓存和应用构建输出，如
`.pnpm-store`、`.worktrees`、`__openclaw_vitest__`，以及应用本地的 `.build` 或
Gradle 输出目录，因此 Docker live 运行不会花费数分钟复制机器专属制品。
它们还会设置 `OPENCLAW_SKIP_CHANNELS=1`，这样 Gateway 网关 live 探测就不会在容器内启动真实的 Telegram / Discord / 等渠道 worker。
`test:docker:live-models` 仍会运行 `pnpm test:live`，因此当你需要从该 Docker lane 中收窄或排除 Gateway 网关 live 覆盖时，也要透传
`OPENCLAW_LIVE_GATEWAY_*`。
`test:docker:openwebui` 是一个更高层级的兼容性冒烟测试：它会启动一个启用了 OpenAI 兼容 HTTP 端点的 OpenClaw gateway 容器，再启动一个固定版本的 Open WebUI 容器连接到该 gateway，通过 Open WebUI 完成登录，验证 `/api/models` 暴露 `openclaw/default`，然后通过 Open WebUI 的 `/api/chat/completions` 代理发送一次真实聊天请求。
首次运行可能会明显更慢，因为 Docker 可能需要拉取
Open WebUI 镜像，而 Open WebUI 也可能需要完成自身的冷启动设置。
这个 lane 需要一个可用的 live 模型密钥，而 `OPENCLAW_PROFILE_FILE`
（默认是 `~/.profile`）是在 Docker 化运行中提供该密钥的主要方式。
成功运行会打印一小段 JSON 载荷，例如 `{ "ok": true, "model":
"openclaw/default", ... }`。
`test:docker:mcp-channels` 刻意设计为确定性测试，不需要真实的
Telegram、Discord 或 iMessage 账户。它会启动一个已预置的 Gateway 网关
容器，再启动第二个容器来生成 `openclaw mcp serve`，然后通过真实的 stdio MCP bridge 验证路由对话发现、转录读取、附件元数据、live 事件队列行为、出站发送路由，以及 Claude 风格的渠道 +
权限通知。通知检查会直接检查原始 stdio MCP 帧，因此这个冒烟测试验证的是 bridge 实际发出的内容，而不只是某个特定客户端 SDK 恰好暴露出来的内容。
`test:docker:pi-bundle-mcp-tools` 是确定性的，不需要 live
模型密钥。它会构建仓库 Docker 镜像，在容器内启动一个真实的 stdio MCP probe server，通过嵌入式 Pi 内置 MCP 运行时实例化该服务器，执行该工具，然后验证 `coding` 和 `messaging` 会保留
`bundle-mcp` 工具，而 `minimal` 和 `tools.deny: ["bundle-mcp"]` 会将其过滤掉。
`test:docker:cron-mcp-cleanup` 是确定性的，不需要 live 模型
密钥。它会启动一个带真实 stdio MCP probe server 的已预置 Gateway 网关，运行一次隔离的 cron 轮次和一次 `/subagents spawn` 一次性子轮次，然后验证 MCP 子进程会在每次运行后退出。

手动 ACP 自然语言线程冒烟测试（非 CI）：

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- 为回归 / 调试工作流保留此脚本。它未来可能还会再次用于 ACP 线程路由验证，因此不要删除它。

常用环境变量：

- `OPENCLAW_CONFIG_DIR=...`（默认：`~/.openclaw`）挂载到 `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...`（默认：`~/.openclaw/workspace`）挂载到 `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...`（默认：`~/.profile`）挂载到 `/home/node/.profile`，并在运行测试前 source
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` 用于只验证从 `OPENCLAW_PROFILE_FILE` source 的环境变量，同时使用临时配置 / 工作区目录且不挂载外部 CLI 鉴权
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...`（默认：`~/.cache/openclaw/docker-cli-tools`）挂载到 `/home/node/.npm-global`，用于 Docker 内缓存 CLI 安装
- `$HOME` 下的外部 CLI 鉴权目录 / 文件会以只读方式挂载到 `/host-auth...` 下，然后在测试开始前复制到 `/home/node/...`
  - 默认目录：`.minimax`
  - 默认文件：`~/.codex/auth.json`、`~/.codex/config.toml`、`.claude.json`、`~/.claude/.credentials.json`、`~/.claude/settings.json`、`~/.claude/settings.local.json`
  - 收窄的提供商运行只会挂载从 `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` 推断出的所需目录 / 文件
  - 可通过 `OPENCLAW_DOCKER_AUTH_DIRS=all`、`OPENCLAW_DOCKER_AUTH_DIRS=none`，或像 `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex` 这样的逗号列表手动覆盖
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` 用于收窄运行范围
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` 用于在容器内筛选提供商
- `OPENCLAW_SKIP_DOCKER_BUILD=1` 用于复用现有的 `openclaw:local-live` 镜像，以便在不需要重建时重跑
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 用于确保凭证来自 profile 存储（而不是环境变量）
- `OPENCLAW_OPENWEBUI_MODEL=...` 用于选择 Gateway 网关为 Open WebUI 冒烟测试暴露的模型
- `OPENCLAW_OPENWEBUI_PROMPT=...` 用于覆盖 Open WebUI 冒烟测试使用的 nonce 检查提示词
- `OPENWEBUI_IMAGE=...` 用于覆盖固定的 Open WebUI 镜像标签

## 文档完整性检查

文档编辑后运行文档检查：`pnpm check:docs`。
当你还需要检查页内标题时，运行完整的 Mintlify 锚点验证：`pnpm docs:check-links:anchors`。

## 离线回归测试（对 CI 安全）

这些是在没有真实提供商的情况下运行的“真实流水线”回归测试：

- Gateway 网关工具调用（模拟 OpenAI，真实 gateway + Agent loop）：`src/gateway/gateway.test.ts`（用例：“runs a mock OpenAI tool call end-to-end via gateway agent loop”）
- Gateway 网关向导（WS `wizard.start` / `wizard.next`，强制写入 config + auth）：`src/gateway/gateway.test.ts`（用例：“runs wizard over ws and writes auth token config”）

## 智能体可靠性评估（Skills）

我们已经有一些对 CI 安全的测试，其行为类似“智能体可靠性评估”：

- 通过真实 gateway + Agent loop 的模拟工具调用（`src/gateway/gateway.test.ts`）。
- 验证会话接线和配置效果的端到端向导流程（`src/gateway/gateway.test.ts`）。

针对 Skills（参见 [Skills](/zh-CN/tools/skills)）目前仍然缺失的内容：

- **决策能力：** 当提示中列出 Skills 时，智能体是否会选择正确的 Skill（或避免选择无关的 Skill）？
- **合规性：** 智能体是否会在使用前读取 `SKILL.md`，并遵循必需的步骤 / 参数？
- **工作流契约：** 断言工具顺序、会话历史延续和沙箱边界的多轮场景。

未来的评估应首先保持确定性：

- 一个使用模拟提供商的场景运行器，用于断言工具调用 + 顺序、Skill 文件读取和会话接线。
- 一小套以 Skill 为中心的场景（使用 vs 避免、闸门控制、提示注入）。
- 只有在对 CI 安全的测试套件就位后，才添加可选的 live 评估（显式启用、受环境变量控制）。

## 契约测试（插件和渠道形状）

契约测试用于验证每个已注册的插件和渠道都符合其接口契约。它们会遍历所有已发现的插件，并运行一组形状和行为断言。默认的 `pnpm test` 单元 lane 会刻意跳过这些共享接缝和冒烟文件；当你修改共享渠道或提供商表面时，请显式运行这些契约命令。

### 命令

- 所有契约：`pnpm test:contracts`
- 仅渠道契约：`pnpm test:contracts:channels`
- 仅提供商契约：`pnpm test:contracts:plugins`

### 渠道契约

位于 `src/channels/plugins/contracts/*.contract.test.ts`：

- **plugin** - 基本插件形状（id、name、capabilities）
- **setup** - 设置向导契约
- **session-binding** - 会话绑定行为
- **outbound-payload** - 消息载荷结构
- **inbound** - 入站消息处理
- **actions** - 渠道操作处理器
- **threading** - 线程 ID 处理
- **directory** - 目录 / roster API
- **group-policy** - 群组策略执行

### 提供商 Status 契约

位于 `src/plugins/contracts/*.contract.test.ts`。

- **status** - 渠道 Status 探测
- **registry** - 插件注册表形状

### 提供商契约

位于 `src/plugins/contracts/*.contract.test.ts`：

- **auth** - 鉴权流程契约
- **auth-choice** - 鉴权选择 / 选取
- **catalog** - 模型目录 API
- **discovery** - 插件发现
- **loader** - 插件加载
- **runtime** - 提供商运行时
- **shape** - 插件形状 / 接口
- **wizard** - 设置向导

### 何时运行

- 修改 `plugin-sdk` 导出或子路径之后
- 添加或修改渠道或提供商插件之后
- 重构插件注册或发现之后

契约测试会在 CI 中运行，不需要真实 API 密钥。

## 添加回归测试（指南）

当你修复在 live 中发现的提供商 / 模型问题时：

- 如果可能，添加一个对 CI 安全的回归测试（模拟 / stub 提供商，或捕获精确的请求形状转换）
- 如果它本质上只能是 live 测试（速率限制、鉴权策略），就让该 live 测试保持收窄，并通过环境变量显式启用
- 优先针对能捕获该缺陷的最小层级：
  - 提供商请求转换 / 重放缺陷 → 直接模型测试
  - gateway 会话 / 历史 / 工具流水线缺陷 → Gateway 网关 live 冒烟测试或对 CI 安全的 Gateway 网关模拟测试
- SecretRef 遍历护栏：
  - `src/secrets/exec-secret-ref-id-parity.test.ts` 会从注册表元数据（`listSecretTargetRegistryEntries()`）中为每个 SecretRef 类派生一个采样目标，然后断言遍历段执行 id 会被拒绝。
  - 如果你在 `src/secrets/target-registry-data.ts` 中新增了一个 `includeInPlan` SecretRef 目标族，请更新该测试中的 `classifyTargetClass`。该测试会在目标 id 未分类时有意失败，因此新类别无法被静默跳过。

## 相关内容

- [Testing live](/zh-CN/help/testing-live)
- [CI](/zh-CN/ci)

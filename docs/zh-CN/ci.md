---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等价项
title: CI 管道
x-i18n:
    generated_at: "2026-04-30T04:51:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf49b1c3ac7b596b0c92652f69de86053b3ba711dabcf083f4f31dd8e27fdd8f
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 和每个拉取请求上运行。它使用智能范围限定，在只有无关区域变更时跳过昂贵作业。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布或广泛验证展开完整的常规 CI 图；对于独立手动运行，Android 通道通过 `include_android` 选择加入。仅发布使用的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只从 `Full Release Validation` 或显式手动调度运行。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`，这是一次仅针对生产 Knip 依赖项的检查，固定使用该脚本所用的最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最小发布日期限制。它还运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未审查未使用文件，或在清理后留下过期允许列表条目时，该保护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和软件包桥接表面。

`Full Release Validation` 是用于“发布前运行所有检查”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以提供仅发布使用的插件/软件包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 以执行安装冒烟、软件包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已发布软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的实时/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。该总控工作流会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变绿，只需重新运行父级验证器作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对候选发布使用 `all`，仅对常规完整 CI 子项使用 `ci`，对每个发布子项使用 `release-checks`，或者在总控工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在聚焦修复后，将失败发布箱的重新运行限制在有界范围内。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是使用一个串行作业。这样既保留相同的文件覆盖，又让较慢的实时提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。请将 Docker 支持的实时套件保留在普通 Blacksmith runner 上，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支持的实时模型/后端分片会为每个选定提交使用单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重新构建完整源 Docker 目标，说明发布运行配置错误，并会把挂钟时间浪费在重复镜像构建上。

`OpenClaw Release Checks` 使用受信任的工作流引用，将选定引用一次性解析为 `release-package-under-test` tarball，然后将该工件传递给实时/E2E 发布路径 Docker 工作流和软件包验收分片。这样可以让软件包字节在发布箱之间保持一致，并避免在多个子作业中重新打包同一个候选版本。

`Package Acceptance` 是用于验证软件包工件的旁路运行工作流，不会阻塞发布工作流。它从已发布 npm 规范、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 工件解析一个候选版本，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，并使用该 tarball，而不是重新打包工作流检出内容。配置文件覆盖冒烟、软件包、产品、完整和自定义 Docker 通道选择。`package` 配置文件使用离线插件覆盖，因此已发布软件包验证不依赖实时 ClawHub 可用性。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，同时保留已发布 npm 规范路径用于独立调度。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而软件包验收会通过用户在安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个软件包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、软件包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该软件包运行选定的 Docker 通道，而不是打包工作流检出内容。当某个配置文件选择多个目标 `docker_lanes` 时，可复用工作流会准备软件包和共享镜像一次，然后将这些通道展开为并行目标 Docker 作业，并生成唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 解析出软件包时安装同一个 `package-under-test` 工件；独立 Telegram 调度仍可安装已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或像 `openclaw@2026.4.27-beta.2` 这样的精确 OpenClaw 发布版本。用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖项，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享工件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这样当前测试 harness 可以验证较旧的受信任源提交，而无需运行旧工作流逻辑。

配置文件映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的软件包/更新/插件通道，而 Package Acceptance 保留针对同一个已解析软件包 tarball 的工件原生内置渠道兼容性、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；软件包/更新产品验证应从 Package Acceptance 开始。Windows 已打包通道和安装器全新安装通道还会验证已安装软件包是否可以从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS 智能体回合冒烟默认使用已设置的 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用实时提供商/模型通道仍覆盖更广泛的模型路由，包括较慢的前沿默认值。

Package Acceptance 对已经发布的软件包有有界的旧版兼容性窗口。到 `2026.4.25` 为止的软件包，包括 `2026.4.25-beta.*`，可对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当软件包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可跳过持久化子用例；`update-channel-switch` 可从 tarball 派生的伪 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可记录缺失的持久化 `update.channel`；插件冒烟可读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 软件包也可以对已经随版本发布的本地构建元数据标记文件发出警告。之后的软件包必须满足现代契约；相同条件会失败，而不是警告或跳过。

示例：

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的包验收运行时，先查看 `resolve_package`
摘要，确认包来源、版本和 SHA-256。然后检查
`docker_acceptance` 子运行及其 Docker 构件：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段
耗时和重新运行命令。优先重新运行失败的包配置文件或
精确 Docker lane，而不是重新运行完整发布验证。

QA Lab 在主智能范围工作流之外有专用 CI lane。
`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会
构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6
智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也会在
手动派发时运行；它会将 mock parity gate、live Matrix lane，以及 live
Telegram 和 Discord lane 扇出为并行作业。live 作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布
检查会使用确定性的 mock 提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live 传输 lane，以便将渠道契约
与 live 模型延迟和常规提供商插件启动隔离。live 传输 Gateway 网关也会
禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；
提供商连接性由独立的 live 模型、原生提供商和 Docker 提供商套件覆盖。Matrix 会为定时和发布门禁使用 `--profile fast`，
只在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值
和手动工作流输入保持为 `all`；手动 `matrix_profile=all`
派发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 还会
在发布批准前运行发布关键的 QA Lab lane；它的 QA parity
gate 会将候选包和基线包作为并行 lane 作业运行，然后把
两个构件下载到一个小型报告作业中，用于最终 parity 比较。
除非变更实际触及 QA 运行时、模型包 parity，或 parity 工作流负责的表面，
否则不要把 PR 落地路径放在 `Parity gate` 后面。
对于常规渠道、配置、文档或单元测试修复，将它视为可选
信号，并改为遵循范围化的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于
落地后重复项清理的手动维护者工作流。它默认 dry-run，且只有在
`apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证
已落地 PR 已合并，并且每个重复项都有共享引用的问题
或重叠的变更片段。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，
而不是完整仓库扫描。每日、手动和非草稿 pull request 守卫
运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript
认证、密钥、沙箱、cron 和 gateway 表面，并使用高置信度安全
查询，在
`/codeql-security-high/core-auth-secrets` 类别下筛选 high/critical `security-severity`。
`channel-runtime-boundary` 作业会单独扫描核心渠道实现
契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和
审计触点，类别为 `/codeql-security-high/channel-runtime-boundary`，
这样渠道安全信号就能扩展，而无需扩大基线
auth/secrets 类别。`network-ssrf-boundary` 作业会扫描核心 SSRF、IP 解析、
网络守卫、web-fetch 和插件 SDK SSRF 策略表面，类别为
`/codeql-security-high/network-ssrf-boundary`，这样网络信任边界
信号会与 auth/secrets 安全基线保持分离。
`mcp-process-tool-boundary` 作业会扫描 MCP 服务器、进程执行辅助工具、
出站投递，以及智能体工具执行门禁，类别为
`/codeql-security-high/mcp-process-tool-boundary`，这样命令和工具
边界信号会与 auth/secrets 基线及非安全 MCP/process 质量分片保持分离。`plugin-trust-boundary` 作业会扫描
插件安装、加载器、清单、注册表、运行时依赖暂存、
源码加载、公共表面和插件 SDK 包契约信任表面，
类别为 `/codeql-security-high/plugin-trust-boundary`，这样插件
供应链和运行时加载信号会与内置插件
实现代码和非安全插件质量分片保持分离。
pull request 守卫保持轻量：它只会针对
`.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，
并运行与定时工作流相同的高置信度安全矩阵。
Android 和 macOS CodeQL 不包含在 PR 默认值中。

`CodeQL Android Critical Security` 工作流是定时 Android
安全分片。它会在 workflow sanity 接受的最小
Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并将结果
上传到 `/codeql-critical-security/android` 类别下。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤依赖构建结果，并将结果
上传到 `/codeql-critical-security/macos` 类别下。保持它位于每日
默认工作流之外，因为即使干净，macOS 构建也会主导运行时长。

`CodeQL Critical Quality` 工作流是匹配的非安全分片。它
只在较小的 Blacksmith Linux runner 上，对窄范围高价值表面运行 error-severity、
非安全 JavaScript/TypeScript 质量查询。它的
pull request 守卫刻意小于定时配置文件：非草稿
PR 只会针对 gateway 协议/服务器方法、提供商运行时/模型目录、插件加载器、插件
SDK 或包契约变更，运行匹配的 `gateway-runtime-boundary`、`provider-runtime-boundary`、
`plugin-boundary` 和 `plugin-sdk-package-contract` 分片。CodeQL 配置和质量工作流变更会运行
全部四个 PR 质量分片。它的手动派发接受
`profile=all|gateway-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`；
窄配置文件是教学/迭代钩子，用于在不派发工作流其余部分的情况下
单独运行一个质量分片。
它的
`core-auth-secrets` 作业会在单独的 `/codeql-critical-quality/core-auth-secrets`
类别下扫描 auth、secrets、沙箱、cron 和 gateway 安全
边界代码。`config-boundary`
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。`gateway-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法
契约。`channel-runtime-boundary` 作业会在
单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。`agent-runtime-boundary` 作业会在
单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、
自动回复分发和队列，以及 ACP 控制平面运行时契约。`mcp-process-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP 服务器和工具桥接、进程
监管辅助工具，以及出站投递契约。`memory-runtime-boundary` 作业会在
单独的 `/codeql-critical-quality/memory-runtime-boundary`
类别下扫描记忆主机 SDK、记忆运行时门面、
记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor
命令。`session-diagnostics-boundary` 作业会在单独的
`/codeql-critical-quality/session-diagnostics-boundary` 类别下扫描回复队列内部、
会话投递队列、出站会话绑定/投递辅助工具、诊断
事件/日志 bundle 表面，以及会话 Doctor CLI 契约。`plugin-sdk-reply-runtime` 作业会在单独的
`/codeql-critical-quality/plugin-sdk-reply-runtime` 类别下扫描插件 SDK 入站回复分发、回复
载荷/分块/运行时辅助工具、渠道回复选项、投递队列，以及
会话/线程绑定辅助工具。`provider-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/provider-runtime-boundary` 类别下扫描模型目录规范化、提供商认证
和设备发现、提供商运行时注册、提供商默认值/目录，以及
web/search/fetch/embedding 提供商注册表。`ui-control-plane` 作业会在单独的
`/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI 启动、本地持久化、Gateway 网关
控制流，以及任务控制平面运行时契约。`web-media-runtime-boundary` 作业会在
单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 web fetch/search、媒体 IO、媒体
理解、图像生成和媒体生成运行时契约。`plugin-boundary` 作业会在单独的 `/codeql-critical-quality/plugin-boundary`
类别下扫描加载器、注册表、公共表面和插件 SDK
入口点契约。`plugin-sdk-package-contract` 作业会在单独的
`/codeql-critical-quality/plugin-sdk-package-contract` 类别下扫描已发布包侧的
插件 SDK 源码和插件包契约辅助工具。保持该
工作流与安全分离，以便质量发现可以被
定时运行、度量、禁用或扩展，而不会遮蔽安全信号。
Swift、Python 和内置插件 CodeQL 扩展只应在
窄配置文件具备稳定的运行时和信号后，作为
范围化或分片的后续工作重新添加。

`Docs Agent` 工作流是事件驱动的 Codex 维护 lane，用于让
现有文档与最近落地的变更保持一致。它没有纯定时计划：一次
`main` 上成功的非机器人 push CI 运行可以触发它，手动派发也可以
直接运行它。工作流运行调用会在 `main` 已前进，或
过去一小时内已创建另一个未跳过的 Docs Agent 运行时跳过。当它运行时，它会
审查从上一个未跳过的 Docs Agent 源 SHA 到
当前 `main` 的提交范围，因此每小时一次的运行可以覆盖
自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个由事件驱动的 Codex 慢速测试维护通道。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经运行过或正在运行另一个 workflow-run 调用，它会跳过。手动分派会绕过这个每日活动门禁。该通道会构建一份全套分组 Vitest 性能报告，让 Codex 只做保持覆盖率的小型测试性能修复，而不是大范围重构，然后重新运行全套报告，并拒绝会降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显失败，并且智能体之后的全套报告必须通过，之后才会提交任何内容。当 `main` 在 bot push 落地前推进时，该通道会对已验证补丁进行 rebase，重新运行 `pnpm check:changed`，并重试 push；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与文档智能体保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 用途                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档更改、已更改作用域、已更改插件，并构建 CI manifest      | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 检测私钥并审计工作流                                        | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisories 对无依赖的生产 lockfile 进行审计                             | 始终在非草稿 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需汇总                                                | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游 artifacts          | Node 相关更改              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关更改              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的汇总检查结果                         | Node 相关更改              |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关更改              |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、guards、测试类型和严格 smoke   | Node 相关更改              |
| `check-additional`               | 架构、边界、插件 surface guards、package-boundary 和 gateway-watch 分片 | Node 相关更改              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关更改              |
| `checks`                         | 已构建产物渠道测试的验证器                                                    | Node 相关更改              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布的手动 CI 分派    |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                | 文档已更改                       |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                       | Python Skills 相关更改      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时 import specifier 回归         | Windows 相关更改           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                  | macOS 相关更改             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关更改             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                 | Android 相关更改           |
| `test-performance-agent`         | 受信任活动之后的每日 Codex 慢速测试优化                                    | Main CI 成功或手动分派 |

手动 CI 分派运行与普通 CI 相同的作业图，但会强制开启所有非 Android 作用域通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 分派只有在 `include_android=true` 时才运行 Android；完整发布总控通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道都排除在 CI 之外。Docker 预发布套件只会在 `Full Release Validation` 通过启用 release-validation gate 分派单独的 `Plugin Prerelease` 工作流时运行。手动运行使用唯一的 concurrency group，因此发布候选的完整套件不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方针对某个分支、tag 或完整 commit SHA 运行该图，同时使用所选 dispatch ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按低成本检查先失败的方式排序，之后才运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的 artifact 和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过变更作用域检测，并让预检清单
表现得像每个作用域区域都已变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但不会自行强制执行 Windows、Android 或 macOS 原生构建；这些平台 lane 仍限定于平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及狭窄的插件契约 helper/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全性，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或 helper 表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的守护矩阵。
Windows Node 检查的作用域限定于 Windows 特定的进程/路径 wrapper、npm/pnpm/UI runner helper、包管理器配置，以及执行该 lane 的 CI 工作流表面；无关的源代码、插件、安装 smoke 和仅测试变更会留在 Linux Node lane 上，这样它们不会为普通测试分片已经覆盖的范围占用一个 16-vCPU Windows worker。
单独的 `install-smoke` 工作流通过它自己的 `preflight` job 复用相同的作用域脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/包表面、内置插件包/清单变更，以及 Docker smoke job 覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，其中每个场景的 Docker run 也会单独设定上限。完整路径会为 nightly 定时运行、手动分发、workflow-call 发布检查，以及确实触及 installer/package/Docker 表面的 pull request 保留 QR 包安装和 installer Docker/update 覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile smoke 镜像，然后将 QR 包安装、根 Dockerfile/gateway smoke、installer/update smoke，以及快速内置插件 Docker E2E 作为独立 job 运行，使安装器工作不必等待根镜像 smoke。`main` push（包括 merge commit）不会强制走完整路径；当变更作用域逻辑会在 push 上请求完整覆盖时，工作流会保留快速 Docker smoke，并将完整安装 smoke 留给 nightly 或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独 gating；它会在 nightly schedule 和发布检查工作流中运行，手动 `install-smoke` 分发可以选择加入它，但 pull request 和 `main` push 不运行它。QR 和 installer Docker 测试保留它们自己的安装导向 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于 installer/update/plugin-dependency lane 的裸 Node/Git runner，以及一个把同一 tarball 安装到 `/app` 中以供普通功能 lane 使用的功能镜像。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的 plan。调度器用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane；通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认值为 10 的主池 slot 数，通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整默认值为 10 的 provider 敏感尾池 slot 数。重型 lane 上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务 lane 不会让 Docker 过载，而较轻的 lane 仍会填满可用 slot。即使单个 lane 比有效上限更重，仍可从空池启动，然后独自运行直到释放容量。lane 启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除过期的 OpenClaw E2E 容器，输出活跃 lane 状态，持久化 lane 耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于调度器检查。默认情况下，它会在第一次失败后停止调度新的池化 lane，每个 lane 都有 120 分钟 fallback 超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail lane 使用更严格的逐 lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器 lane，包括仅发布 lane（如 `install-e2e`）和拆分的内置更新 lane（如 `bundled-channel-update-acpx`），同时跳过清理 smoke，让 agents 可以复现单个失败 lane。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、lane 和凭证覆盖，然后 `scripts/docker-e2e.mjs` 将该 plan 转换成 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball inventory；在 plan 需要 package-installed lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送带包摘要 tag 的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有的包摘要镜像，而不是重新构建。Docker 镜像拉取会以每次尝试 180 秒的有界超时重试，因此卡住的 registry/cache stream 会快速重试，而不是消耗大部分 CI 关键路径。`Package Acceptance` 工作流是高级包 gate：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的工作流产物解析 candidate，然后将该单个 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，使当前 acceptance 逻辑可以验证较旧的受信任 commit，而无需 checkout 旧的工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance delta：内置渠道兼容性、离线插件 fixture，以及针对解析出的 tarball 的 Telegram 包 QA。发布路径 Docker 套件使用更小的分块 job 并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个 chunk 只拉取它需要的镜像类型，并通过同一个加权调度器执行多个 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 分发保留独立的 `openwebui` chunk。旧的聚合 chunk 名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分 chunk，这样 installer E2E 和内置插件安装/卸载 sweep 不会主导关键路径。`install-e2e` lane alias 仍是两个 provider installer lane 的聚合手动重跑别名。`bundled-channels` chunk 运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行的一体化 `bundled-channel-deps` lane。每个 chunk 都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器 plan JSON、慢 lane 表，以及逐 lane 重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定 lane，而不是运行 chunk job，这会把失败 lane 调试限制在一个目标 Docker job 内，并为该运行准备、下载或复用包产物；如果选中的 lane 是 live Docker lane，目标 job 会为该次重跑在本地构建 live-test 镜像。生成的逐 lane GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败的 lane 可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub run 下载 Docker 产物并打印组合/逐 lane 目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可获取慢 lane 和阶段关键路径摘要。定时 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 Doctor 修复过程可以与其他内置检查分片并行。

当前发布 Docker chunk 是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` chunk 仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍作为聚合 plugin/runtime 别名保留，但发布工作流使用拆分 chunk，这样渠道 smoke、更新目标、插件运行时检查，以及内置插件安装/卸载 sweep 可以并行运行。目标化的 `docker_lanes` 分发也会在一个共享包/镜像准备步骤之后，将多个选中的 lane 拆分为并行 job，并且内置渠道更新 lane 会针对暂时性 npm 网络失败重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查关卡对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产代码和核心测试类型检查，以及核心 lint/guard；仅核心测试变更只运行核心测试类型检查和核心 lint；插件生产代码变更会运行插件生产代码和插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查和插件 lint。公共 Plugin SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫描是明确的测试工作。仅发布元数据的版本号更新会运行有针对性的版本、配置、根依赖检查。未知的根目录或配置变更会以安全失败方式进入所有检查通道。
本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且刻意比 `check:changed` 更低成本：直接测试编辑会运行自身，源代码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置属于显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示词的更改，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，这样共享默认值变更会在第一次 PR 推送前失败。只有当变更足够覆盖整个 harness，以至于低成本映射集合不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为宽泛证明使用新预热的 box。在一个复用过、已过期或刚报告异常大同步的 box 上花时间跑慢速关卡之前，先在该 box 内运行 `pnpm testbox:sanity`。当所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该防护，或为异常大的本地 diff 使用更大的毫秒值。

手动 CI 调度会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。Android 对独立手动 CI 是可选项，通过 `include_android=true` 启用，并且始终为 `Full Release Validation` 启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，所以它是一个单独的 workflow，由 `Full Release Validation` 或显式操作员调度。普通拉取请求、`main` 推送和独立手动 CI 调度会保持该套件关闭。

最慢的 Node 测试族会被拆分或均衡，以便每个 job 保持较小且不过度预留 runner：渠道契约作为三个加权 shard 运行，小型核心单元通道会配对，自动回复作为四个均衡 worker 运行，并将回复子树拆为 agent-runner、dispatch 和 commands/state-routing shard；agentic Gateway 网关/插件配置分布在现有仅源码 agentic Node job 中，而不是等待构建产物。宽泛的浏览器、QA、媒体和杂项插件测试会使用各自专用的 Vitest 配置，而不是共享插件总括项。`Plugin Prerelease` 会在八个插件 worker 之间均衡内置插件测试；这些插件 shard job 每次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node heap，使导入密集型插件批次不会创建额外 CI job。宽泛 agents 通道使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime shard 一起运行，以避免共享运行时 shard 承担尾部耗时。包含模式 shard 使用 CI shard 名称记录 timing 条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和筛选后的 shard。`check-additional` 会把包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界 guard shard 会在一个 job 内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心支持边界 shard 会在 `dist/` 与 `dist-runtime/` 已经构建后，在 `build-artifacts` 内并发运行，保留它们旧的检查名称作为轻量 verifier job，同时避免两个额外 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复 debug APK 打包 job。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新 run 也在失败，否则将其视为 CI 噪声。聚合 shard 检查使用 `!cancelled() && always()`，因此它们仍会报告正常的 shard 失败，但在整个 workflow 已被取代后不会继续排队。
自动 CI 并发 key 带版本（`CI-v7-*`），因此 GitHub 侧旧队列组里的僵尸项无法无限期阻塞较新的 main run。手动全套件 run 使用 `CI-manual-v1-*`，且不会取消正在运行的 run。

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全 job 和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` shard、`check-additional` shard 和聚合、Node 测试聚合 verifier、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith matrix 可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件 shard、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试 shard、内置插件测试 shard、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 得不偿失；install-smoke Docker 构建中，32-vCPU 的排队时间成本也高于节省的时间                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本地等价命令

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:changed   # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

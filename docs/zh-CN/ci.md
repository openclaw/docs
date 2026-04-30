---
read_when:
    - 你需要了解某个 CI 任务运行或未运行的原因
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-30T03:10:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ec23255d46d3242979fc4bd40f062ffbaf1c825d08ebfd962c847b0a56ab81
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围界定，在只有无关区域发生变更时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并为发布候选版本或广泛验证展开完整的常规 CI 图；对于独立手动运行，Android 通道通过 `include_android` 选择启用。仅用于发布的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只会从 `Full Release Validation` 或显式手动调度运行。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`，这是一个仅面向生产 Knip 依赖项的检查流程，固定到该脚本使用的最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最低发布年龄限制。它还会运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。该防护会在 PR 添加新的未经审核未使用文件，或在清理后留下过期允许列表条目时失败，同时保留 Knip 无法静态解析的有意动态插件、生成产物、构建、实时测试和包桥接表面。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 来提供仅发布插件/包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 来执行安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已发布包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的实时/提供商广度：`minimum` 保留最快的 OpenAI/core 发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议性提供商/媒体矩阵。该总控工作流会记录被调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行附加最慢作业表。如果某个子工作流重新运行后转为绿色，只需重新运行父验证器作业即可刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅常规完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，或在总控工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会在聚焦修复后让失败的发布执行环境重跑保持有界。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它会通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商筛选的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商筛选的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，让缓慢的实时提供商失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重跑。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证二进制文件。将 Docker 支持的实时套件保留在常规 Blacksmith runner 上，因为容器作业不是启动嵌套 Docker 测试的合适位置。

Docker 支持的实时模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源码 Docker 目标，则说明发布运行配置错误，并会因重复镜像构建浪费总耗时。

`OpenClaw Release Checks` 使用受信任的工作流引用，将选定引用一次性解析为 `release-package-under-test` tarball，然后将该产物传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这会让发布执行环境之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是一个旁路运行工作流，用于在不阻塞发布工作流的情况下验证包产物。它会从已发布的 npm 规格、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 产物解析一个候选包，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，使用该 tarball 而不是重新打包工作流检出内容。配置档覆盖冒烟、包、产品、完整和自定义 Docker 通道选择。`package` 配置档使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 产物，同时保留已发布 npm 规格路径供独立调度使用。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否能作为产品工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收会通过用户安装或更新后执行的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该产物，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当某个配置档选择多个定向 `docker_lanes` 时，可复用工作流会一次性准备包和共享镜像，然后将这些通道展开为并行定向 Docker 作业，并使用唯一产物。
3. `package_telegram` 可选择调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 解析出包后安装同一个 `package-under-test` 产物；独立 Telegram 调度仍可安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/stable 验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖项，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享产物应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源码提交。这样当前测试 harness 就可以验证较旧的受信任源码提交，而不运行旧的工作流逻辑。

配置档映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而 Package Acceptance 会针对同一个已解析包 tarball 保留原生于产物的内置渠道兼容、离线插件和 Telegram 证明。
Cross-OS 发布检查仍然覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新通道还会验证已安装包是否可以从原始绝对 Windows 路径导入 browser-control 覆盖。OpenAI cross-OS agent-turn 冒烟在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明会保持快速且确定。专用实时提供商/模型通道仍覆盖更广泛的模型路由，包括更慢的前沿默认值。

Package Acceptance 对已经发布的包有有界的旧版兼容窗口。直到 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未公开该标志时，`doctor-switch` 可跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可从 tarball 派生的假 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可记录缺失的持久化 `update.channel`；插件冒烟可读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可对已经发出的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，从 `resolve_package`
摘要开始，确认包来源、版本和 SHA-256。然后检查
`docker_acceptance` 子运行及其 Docker 工件：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段
计时和重跑命令。优先重跑失败的包配置文件或
精确的 Docker lanes，而不是重跑完整发布验证。

QA Lab 在主智能范围限定工作流之外有专用 CI lanes。
`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会
构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6
智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可
手动分发；它会将模拟 parity gate、实时 Matrix lane，以及实时
Telegram 和 Discord lanes 扇出为并行作业。实时作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布
检查会使用确定性模拟提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输 lanes，
从而让渠道契约与实时模型延迟和常规提供商插件启动隔离。实时传输
Gateway 网关还会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；
提供商连通性由独立的实时模型、原生提供商和 Docker 提供商套件覆盖。
Matrix 对定时和发布 gates 使用 `--profile fast`，只有在检出的 CLI 支持时才
添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动
`matrix_profile=all` 分发始终会将完整 Matrix 覆盖分片为
`transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。
`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab lanes；其 QA parity
gate 会将候选包和基线包作为并行 lane 作业运行，然后将
两个工件下载到一个小型报告作业中，用于最终 parity 比较。
不要把 PR 落地路径放在 `Parity gate` 后面，除非变更确实
触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面。
对于常规渠道、配置、文档或单元测试修复，将其视为可选
信号，并遵循限定范围的 CI/check 证据。

`Duplicate PRs After Merge` 工作流是一个面向维护者的手动工作流，用于
落地后的重复项清理。它默认执行 dry-run，且只有在
`apply=true` 时才关闭明确列出的 PR。在修改 GitHub 前，它会验证
已落地 PR 已合并，并验证每个重复项要么具有共享的引用 issue，
要么具有重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，
而不是完整仓库扫描。每日、手动以及非草稿 pull request 保护
运行会扫描 Actions 工作流代码，以及最高风险的 JavaScript/TypeScript
身份验证、密钥、沙箱、cron 和 gateway 表面，并使用高置信度安全
查询，筛选 `/codeql-security-high/core-auth-secrets` 类别下 high/critical 的
`security-severity`。`channel-runtime-boundary` 作业会在
`/codeql-security-high/channel-runtime-boundary` 类别下单独扫描核心渠道实现
契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，
这样渠道安全信号可以扩展，而不会扩大基线身份验证/密钥类别。
`network-ssrf-boundary` 作业会在 `/codeql-security-high/network-ssrf-boundary`
类别下扫描核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF
策略表面，这样网络信任边界信号会与身份验证/密钥安全基线分离。
`mcp-process-tool-boundary` 作业会在
`/codeql-security-high/mcp-process-tool-boundary` 类别下扫描 MCP 服务器、
进程执行 helper、出站投递，以及智能体工具执行 gates，这样命令和工具
边界信号会同时与身份验证/密钥基线和非安全 MCP/进程质量分片分离。
`plugin-trust-boundary` 作业会在 `/codeql-security-high/plugin-trust-boundary`
类别下扫描插件安装、加载器、manifest、注册表、运行时依赖暂存、
源码加载、公共表面，以及插件 SDK 包契约信任表面，这样插件
供应链和运行时加载信号会同时与内置插件实现代码和非安全插件质量分片分离。
pull request 保护保持轻量：它只会对
`.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src`
下的变更启动，并运行与定时工作流相同的高置信度安全矩阵。
Android 和 macOS CodeQL 不属于 PR 默认项。

`CodeQL Android Critical Security` 工作流是定时 Android
安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上
为 CodeQL 手动构建 Android 应用，并在
`/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤掉依赖构建结果，并在
`/codeql-critical-security/macos` 类别下上传结果。让它保持在每日
默认工作流之外，因为即使干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它
只在较小的 Blacksmith Linux runner 上，针对窄范围高价值表面运行
error-severity、非安全 JavaScript/TypeScript 质量查询。它的
pull request 保护有意小于定时配置文件：非草稿 PR 只有在
插件加载器、插件 SDK、包契约、CodeQL 配置或质量工作流
文件变更时，才会运行 `plugin-boundary` 和 `plugin-sdk-package-contract` 分片。
它的手动分发接受
`profile=all|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`；
这些窄范围配置文件是教学/迭代钩子，用于在不分发工作流其余部分的情况下
单独运行一个质量分片。
它的
`core-auth-secrets` 作业会在单独的 `/codeql-critical-quality/core-auth-secrets`
类别下扫描身份验证、密钥、沙箱、cron 和 gateway 安全边界代码。
`config-boundary`
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置
schema、迁移、规范化和 IO 契约。`gateway-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法
契约。`channel-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。
`agent-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、
自动回复分发和队列，以及 ACP 控制平面运行时契约。`mcp-process-runtime-boundary`
作业会在单独的 `/codeql-critical-quality/mcp-process-runtime-boundary`
类别下扫描 MCP 服务器和工具桥、进程监督 helper，以及出站投递契约。
`memory-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/memory-runtime-boundary` 类别下扫描记忆宿主 SDK、记忆运行时 facade、
记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor 命令。
`session-diagnostics-boundary` 作业会在单独的
`/codeql-critical-quality/session-diagnostics-boundary` 类别下扫描回复队列内部机制、
会话投递队列、出站会话绑定/投递 helper、诊断事件/日志 bundle 表面，以及
会话 Doctor CLI 契约。`plugin-sdk-reply-runtime` 作业会在单独的
`/codeql-critical-quality/plugin-sdk-reply-runtime` 类别下扫描插件 SDK 入站回复分发、
回复 payload/分块/运行时 helper、渠道回复选项、投递队列，以及
会话/thread 绑定 helper。`provider-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/provider-runtime-boundary` 类别下扫描模型目录规范化、提供商身份验证
和发现、提供商运行时注册、提供商默认值/目录，以及
web/search/fetch/embedding 提供商注册表。`ui-control-plane` 作业会在单独的
`/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI bootstrap、本地持久化、Gateway 网关
控制流，以及任务控制平面运行时契约。`web-media-runtime-boundary` 作业会在单独的
`/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 web fetch/search、媒体 IO、媒体
理解、图像生成和媒体生成运行时契约。`plugin-boundary` 作业会在单独的
`/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公共表面和插件 SDK
入口点契约。`plugin-sdk-package-contract` 作业会在单独的
`/codeql-critical-quality/plugin-sdk-package-contract` 类别下扫描已发布包侧
插件 SDK 源码和插件包契约 helper。让该工作流与安全分离，这样质量发现可以被
定时、度量、禁用或扩展，而不会模糊安全信号。
Swift、Python 和内置插件 CodeQL 扩展应仅在窄范围配置文件拥有稳定
运行时间和信号后，作为限定范围或分片化后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护 lane，用于让
现有文档与最近落地的变更保持一致。它没有纯定时计划：在
`main` 上成功的非 bot push CI 运行可以触发它，手动分发也可以
直接运行它。workflow-run 调用会在 `main` 已前进，或在过去一小时内
已创建另一个未跳过的 Docs Agent 运行时跳过。运行时，它会
审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，
因此一次每小时运行可以覆盖自上次文档检查以来累积的所有 main 变更。

`测试性能智能体` 工作流是一个事件驱动的 Codex 维护通道，用于慢速测试。它没有纯定时计划：在 `main` 上一次成功的非机器人推送 CI 运行可以触发它，但如果当天 UTC 已经运行过或正在运行另一个 workflow-run 调用，它会跳过。手动调度会绕过这个每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做小型且保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显的失败，并且智能体之后的完整套件报告必须通过，才能提交任何内容。当 `main` 在机器人推送落地前推进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs 智能体相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档更改、变更范围、变更插件，并构建 CI manifest      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 对 npm advisories 执行无需依赖安装的生产 lockfile 审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业所需的聚合检查                                                | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、已构建 artifact 检查，以及可复用的下游 artifact          | Node 相关更改              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关更改              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关更改              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关更改              |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、guards、测试类型和严格 smoke   | Node 相关更改              |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片 | Node 相关更改              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关更改              |
| `checks`                         | 已构建 artifact 渠道测试的验证器                                                    | Node 相关更改              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布的手动 CI 调度    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已更改                       |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                       | Python-skill 相关更改      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时 import specifier 回归测试         | Windows 相关更改           |
| `macos-node`                     | 使用共享已构建 artifact 的 macOS TypeScript 测试通道                                  | macOS 相关更改             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关更改             |
| `android`                        | 两种 flavor 的 Android 单元测试，加一个 debug APK 构建                                 | Android 相关更改           |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢速测试优化                                    | Main CI 成功或手动调度 |

手动 CI 调度运行与常规 CI 相同的作业图，但会强制开启每个非 Android 范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总入口通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道会从 CI 中排除。Docker 预发布套件仅在 `Full Release Validation` 调度单独的 `Plugin Prerelease` 工作流并启用发布验证门禁时运行。手动运行使用唯一的 concurrency group，因此候选发布完整套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许可信调用方在使用所选调度 ref 中的工作流文件时，针对分支、标签或完整 commit SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业会按顺序排列，让低成本检查先于高成本检查失败：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的 artifact 和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过变更范围检测，并让预检清单表现得像每个限定范围都发生了变更。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但本身不会强制执行 Windows、Android 或 macOS 原生构建；这些平台车道仍限定于平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试夹具编辑，以及狭窄的插件契约辅助/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查和单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或辅助表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外的守护矩阵。
Windows Node 检查仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该车道的 CI 工作流表面；无关的源代码、插件、安装冒烟和仅测试变更仍留在 Linux Node 车道上，这样它们就不会占用 16-vCPU Windows 工作器来覆盖已由常规测试分片执行的内容。
独立的 `install-smoke` 工作流通过自己的 `preflight` 作业复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker 工作器。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行智能体删除共享工作区 CLI 冒烟，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件，同时每个场景的 Docker 运行都会单独设置上限。完整路径保留 QR 包安装以及安装器 Docker/更新覆盖，用于夜间计划运行、手动触发、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的拉取请求。在完整模式下，install-smoke 会准备或复用一个目标 SHA GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟、安装器/更新冒烟，以及快速内置插件 Docker E2E 作为独立作业运行，这样安装器工作就不会排在根镜像冒烟之后等待。`main` 推送（包括合并提交）不会强制走完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流保留快速 Docker 冒烟，并将完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 触发也可以选择加入，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖车道的裸 Node/Git 运行器，以及一个将同一 tarball 安装到 `/app` 的功能镜像，用于常规功能车道。Docker 车道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每条车道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行车道；使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾部池槽位数 10。重型车道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm 安装和多服务车道不会让 Docker 超额承载，而较轻的车道仍能填满可用槽位。单条车道即使重于有效上限，仍可从空池启动，然后独占运行直到释放容量。默认情况下，车道启动会错开 2 秒，以避免本地 Docker daemon 出现创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活动车道 Status、持久化车道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于调度器检查。默认情况下，它会在第一次失败后停止调度新的池化车道，并且每条车道都有 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 车道会使用更严格的逐车道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器车道，包括仅发布车道如 `install-e2e`，以及拆分的内置更新车道如 `bundled-channel-update-acpx`，同时跳过清理冒烟，以便智能体可以复现某条失败车道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、车道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的车道时，通过 Blacksmith 的 Docker 层缓存构建并推送带有包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会以每次尝试 180 秒的有界超时重试，这样卡住的 registry/cache 流会快速重试，而不会消耗 CI 关键路径的大部分时间。`Package Acceptance` 工作流是高级包门禁：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前工作流产物中解析候选版本，然后将这个单一的 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较旧的受信任提交，而无需检出旧的工作流代码。发布检查会针对目标引用运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会使用更小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多条车道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整发布路径覆盖请求它时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的触发保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分后的分块，这样安装器 E2E 和内置插件安装/卸载扫测不会主导关键路径。`install-e2e` 车道别名仍是两个提供商安装器车道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 车道，而不是串行的全合一 `bundled-channel-deps` 车道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含车道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢车道表，以及逐车道重跑命令。工作流 `docker_lanes` 输入会针对已准备的镜像运行选定车道，而不是分块作业，这会将失败车道调试限制在一个有针对性的 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定车道是 live Docker 车道，目标作业会为该次重跑在本地构建 live-test 镜像。生成的逐车道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备的镜像输入，因此失败车道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker 产物并打印组合/逐车道的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢车道和阶段关键路径摘要。计划 live/E2E 工作流每天运行完整发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm 更新和 Doctor 修复过程可以与其他内置检查一起分片。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名，但发布工作流使用拆分后的分块，这样渠道冒烟、更新目标、插件运行时检查，以及内置插件安装/卸载扫测可以并行运行。目标 `docker_lanes` 触发也会在一次共享包/镜像准备步骤之后，将多个选定车道拆分为并行作业，并且内置渠道更新车道会针对临时 npm 网络故障重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试类型检查，以及核心 lint/guard；仅核心测试变更只运行核心测试类型检查和核心 lint；插件生产变更会运行插件生产和插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查和插件 lint。公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫描属于显式测试工作。仅发布元数据的版本号变更会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会按故障安全策略退回到所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接的测试编辑会运行自身，源代码编辑会优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示词的变更，会通过核心回复测试以及 Discord 和 Slack 投递回归测试来路由，因此共享默认值变更会在第一次 PR 推送前失败。仅当变更足够覆盖整个 harness，以至于廉价映射集合不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为宽泛证明使用新预热的 box。在把慢速门禁花在一个被复用、已过期或刚报告异常大同步的 box 上之前，先在该 box 内运行 `pnpm testbox:sanity`。当 `pnpm-lock.yaml` 等必需根文件消失，或 `git status --short` 显示至少 200 个已跟踪删除项时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。请停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，为那次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或者为异常大的本地 diff 使用更大的毫秒值。

手动 CI 分发会运行 `checks-node-compat-node22`，作为宽泛兼容性覆盖。Android 对独立手动 CI 通过 `include_android=true` 选择启用，并始终在 `Full Release Validation` 中启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个由 `Full Release Validation` 或显式操作员单独分发的独立工作流。普通拉取请求、`main` 推送和独立手动 CI 分发都会关闭该套件。

最慢的 Node 测试族会被拆分或均衡，以便每个作业保持较小规模且不过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元通道会配对，自动回复作为四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置则分布在现有的仅源码 agentic Node 作业中，而不是等待构建产物。宽泛浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。`Plugin Prerelease` 会在八个插件 worker 之间均衡内置插件测试；这些插件分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，因此导入密集型插件批次不会创建额外 CI 作业。宽泛 agents 通道使用共享的 Vitest 文件并行调度器，因为它受导入/调度主导，而不是由单个慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片拥有尾部耗时。包含模式分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分离；边界 guard 分片在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证器作业，同时避免两个额外的 Blacksmith worker 和第二个构件消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每个 Android 相关推送上执行重复的 debug APK 打包作业。
当同一个 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常分片失败，但不会在整个工作流已经被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的 zombie 不会无限期阻塞新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，因此 8 vCPU 的成本超过了节省；install-smoke Docker 构建，其中 32-vCPU 的排队时间成本超过了节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本地等价项

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

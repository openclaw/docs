---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-30T05:04:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5174412ed135f5f9b3712fb5ac28e0e2d781e2d45232b49f7bbed06085596c5a
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域，在只有无关区域发生变化时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并展开完整的常规 CI 图，用于发布候选版本或广泛验证；对于独立手动运行，Android 线路通过 `include_android` 选择启用。仅发布使用的插件预发布线路位于单独的 `Plugin Prerelease` 工作流中，并且只会从 `Full Release Validation` 或显式手动调度中运行。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`，这是一次仅针对生产 Knip 依赖项的检查，并固定到该脚本使用的最新 Knip 版本，同时为 `dlx` 安装禁用 pnpm 的最小发布年龄。它还会运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未经审查的未使用文件，或清理后仍留下过时的 allowlist 条目时，该防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和软件包桥接表面。

`Full Release Validation` 是用于“在发布前运行所有检查”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以执行仅发布使用的插件/软件包/静态/Docker 验证，并调度 `OpenClaw Release Checks` 以执行安装冒烟、软件包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 线路。提供已发布的软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的实时/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键线路，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的 advisory 提供商/媒体矩阵。该总控工作流会记录已调度子运行的 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变绿，只需重新运行父级验证器作业，即可刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅常规完整 CI 子项使用 `ci`，所有发布子项使用 `release-checks`，或在总控中使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在聚焦修复后，将失败的发布环境重新运行限制在有界范围内。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、经过提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及经过提供商过滤的音乐分片），而不是一个串行作业。这样保持相同的文件覆盖范围，同时让缓慢的实时提供商失败更容易重新运行和诊断。聚合分片名称 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 对手动一次性重新运行仍然有效。

原生实时媒体分片运行在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证二进制文件。将 Docker 支持的实时套件保留在常规 Blacksmith runner 上，因为容器作业并不适合启动嵌套 Docker 测试。

Docker 支持的实时模型/后端分片会为所选提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会先构建并推送该镜像一次，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片各自独立重建完整源 Docker 目标，则说明发布运行配置错误，并会在重复镜像构建上浪费总耗时。

`OpenClaw Release Checks` 使用受信任的工作流引用将所选引用一次性解析为 `release-package-under-test` tarball，然后将该 artifact 传递给实时/E2E 发布路径 Docker 工作流和软件包验收分片。这能让软件包字节在各个发布环境中保持一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是用于验证软件包 artifact 的旁路工作流，不阻塞发布工作流。它会从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball artifact 中解析一个候选版本，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，用该 tarball 替代重新打包工作流 checkout。Profile 覆盖冒烟、软件包、产品、完整和自定义 Docker 线路选择。`package` profile 使用离线插件覆盖，因此已发布软件包验证不受实时 ClawHub 可用性的限制。可选 Telegram 线路会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` artifact，并保留已发布 npm 规范路径用于独立调度。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品能否正常工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而软件包验收会通过用户安装或更新后使用的同一套 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` checkout `workflow_ref`，解析一个软件包候选版本，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、工作流引用、软件包引用、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该 artifact，验证 tarball inventory，在需要时准备 package-digest Docker 镜像，并针对该软件包而不是打包工作流 checkout 来运行所选 Docker 线路。当某个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会先准备一次软件包和共享镜像，然后将这些线路展开为并行的目标 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 已解析出软件包时安装同一个 `package-under-test` artifact；独立 Telegram 调度仍可安装已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 线路失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/stable 验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签抵达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享 artifact 应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这让当前测试 harness 可以验证较旧的受信任源提交，而不运行旧的工作流逻辑。

Profile 映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的软件包/更新/插件线路，而 Package Acceptance 则针对同一个已解析软件包 tarball 保留 artifact 原生的内置渠道兼容、离线插件和 Telegram 验证。
跨 OS 发布检查仍会覆盖 OS 特定的新手引导、安装器和平台行为；软件包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新安装线路还会验证已安装的软件包是否可以从原始绝对 Windows 路径导入 browser-control override。OpenAI 跨 OS agent-turn 冒烟会在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关验证保持快速且确定。专用实时提供商/模型线路仍覆盖更广泛的模型路由，包括更慢的前沿默认值。

Package Acceptance 对已发布软件包设置了有界的旧版兼容窗口。到 `2026.4.25` 为止的软件包（包括 `2026.4.25-beta.*`）可以对 `dist/postinstall-inventory.json` 中指向 tarball 已省略文件的已知私有 QA 条目使用兼容路径；当软件包不暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；`update-channel-switch` 可以从 tarball 派生的假 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件冒烟可以读取旧版 install-record 位置，或接受缺失的 marketplace install-record 持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 软件包也可以对已经发出的本地构建元数据 stamp 文件发出警告。后续软件包必须满足现代契约；相同条件将失败，而不是警告或跳过。

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
摘要，以确认包来源、版本和 SHA-256。然后检查
`docker_acceptance` 子运行及其 Docker 构件：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段
耗时和重新运行命令。优先重新运行失败的包 profile 或
精确的 Docker lane，而不是重新运行完整发布验证。

QA Lab 在主智能范围工作流之外有专用的 CI lane。
`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会
构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6
agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可
手动分发；它会将模拟 parity gate、实时 Matrix lane，以及实时
Telegram 和 Discord lane 作为并行作业展开。实时作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布
检查会使用确定性的模拟提供商和 mock-qualified 模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输 lane，
从而将渠道合约与实时模型延迟和常规提供商插件启动隔离开来。
实时传输 Gateway 网关也会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；
提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 会对计划和发布 gate 使用 `--profile fast`，
仅在签出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值
和手动工作流输入仍为 `all`；手动 `matrix_profile=all`
分发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会
在发布批准前运行发布关键的 QA Lab lane；其 QA parity
gate 会将候选包和基线包作为并行 lane 作业运行，然后下载
两个构件到一个小型报告作业中，用于最终 parity 比较。
除非变更实际触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面，
否则不要把 PR 落地路径置于 `Parity gate` 之后。
对于常规渠道、配置、文档或单元测试修复，将它视为可选
信号，并遵循范围化 CI/检查证据。

`Duplicate PRs After Merge` 工作流是一个用于
落地后重复项清理的手动维护者工作流。它默认 dry-run，并且只有在
`apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证
已落地 PR 已合并，并验证每个重复项要么有共享的引用 issue，
要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的一阶安全扫描器，
而不是完整仓库扫描。每日、手动和非草稿 pull request guard
运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript
认证、密钥、沙箱、cron 和 Gateway 网关表面，并使用高置信度安全
查询，筛选 `/codeql-security-high/core-auth-secrets` 类别下高/严重
`security-severity` 的结果。
channel-runtime-boundary 作业会单独扫描核心渠道实现
合约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和
审计接触点，类别为 `/codeql-security-high/channel-runtime-boundary`，
这样渠道安全信号可以扩展，而不需要扩大基线
认证/密钥类别。network-ssrf-boundary 作业会扫描核心 SSRF、IP 解析、
网络 guard、web-fetch 和插件 SDK SSRF 策略表面，类别为
`/codeql-security-high/network-ssrf-boundary`，这样网络信任边界
信号会与认证/密钥安全基线保持分离。
mcp-process-tool-boundary 作业会扫描 MCP 服务器、进程执行 helper、
出站投递和智能体工具执行 gate，类别为
`/codeql-security-high/mcp-process-tool-boundary`，这样命令和工具
边界信号会与认证/密钥基线以及非安全 MCP/进程质量分片保持分离。
plugin-trust-boundary 作业会扫描
插件安装、加载器、清单、注册表、运行时依赖暂存、
源码加载、公共表面和插件 SDK 包合约信任表面，类别为
`/codeql-security-high/plugin-trust-boundary`，这样插件
供应链和运行时加载信号会与内置插件
实现代码以及非安全插件质量分片保持分离。
pull request guard 保持轻量：它只会针对
`.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src`
下的变更启动，并运行与计划工作流相同的高置信度安全矩阵。
Android 和 macOS CodeQL 不纳入 PR 默认项。

`CodeQL Android Critical Security` 工作流是计划运行的 Android
安全分片。它会在 workflow sanity 接受的最小
Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并将结果
上传到 `/codeql-critical-security/android` 类别下。

`CodeQL macOS Critical Security` 工作流是每周/手动的 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤掉依赖构建结果，并将结果
上传到 `/codeql-critical-security/macos` 类别下。让它留在每日
默认工作流之外，因为即使干净时，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它
只在较小的 Blacksmith Linux runner 上，对窄范围高价值表面运行错误严重级别、
非安全 JavaScript/TypeScript 质量查询。它的
pull request guard 有意小于计划 profile：非草稿
PR 只会针对渠道运行时、Gateway 网关
protocol/server-method、提供商运行时/模型目录、插件加载器、插件
SDK 或包合约变更运行对应的 `channel-runtime-boundary`、
`gateway-runtime-boundary`、`provider-runtime-boundary`、`plugin-boundary` 和
`plugin-sdk-package-contract` 分片。CodeQL 配置和质量工作流变更会运行
全部五个 PR 质量分片。它的手动分发接受
`profile=all|channel-runtime-boundary|gateway-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`；
这些窄 profile 是教学/迭代钩子，用于在不分发工作流其余部分的情况下
单独运行一个质量分片。
其
core-auth-secrets 作业会在单独的 `/codeql-critical-quality/core-auth-secrets`
类别下扫描认证、密钥、沙箱、cron 和 Gateway 网关安全
边界代码。config-boundary
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、
迁移、规范化和 IO 合约。gateway-runtime-boundary 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法
合约。channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现合约。agent-runtime-boundary 作业会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、
自动回复分发和队列，以及 ACP 控制平面运行时合约。
mcp-process-runtime-boundary 作业会在单独的
`/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP 服务器和工具桥接、进程
监督 helper，以及出站投递合约。memory-runtime-boundary
作业会在单独的 `/codeql-critical-quality/memory-runtime-boundary`
类别下扫描记忆主机 SDK、记忆运行时 facade、
记忆插件 SDK 别名、记忆运行时激活胶水代码和记忆 Doctor
命令。session-diagnostics-boundary 作业会在单独的
`/codeql-critical-quality/session-diagnostics-boundary` 类别下扫描回复队列内部机制、
会话投递队列、出站会话绑定/投递 helper、诊断
事件/日志包表面，以及会话 Doctor CLI 合约。
plugin-sdk-reply-runtime 作业会在单独的
`/codeql-critical-quality/plugin-sdk-reply-runtime` 类别下扫描插件 SDK 入站回复分发、回复
payload/chunking/runtime helper、渠道回复选项、投递队列，以及
会话/thread 绑定 helper。provider-runtime-boundary 作业会在单独的
`/codeql-critical-quality/provider-runtime-boundary` 类别下扫描模型目录规范化、提供商认证
和发现、提供商运行时注册、提供商默认值/目录，以及
web/search/fetch/embedding 提供商注册表。
ui-control-plane 作业会在单独的
`/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI bootstrap、本地持久化、Gateway 网关
控制流和任务控制平面运行时合约。
web-media-runtime-boundary 作业会在单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 web fetch/search、媒体 IO、媒体
理解、图像生成和媒体生成运行时合约。
plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary`
类别下扫描加载器、注册表、公共表面和插件 SDK
入口点合约。plugin-sdk-package-contract 作业会在单独的
`/codeql-critical-quality/plugin-sdk-package-contract` 类别下扫描已发布包侧
插件 SDK 源码和插件包合约 helper。保持该
工作流与安全分离，这样质量发现可以被
计划运行、度量、禁用或扩展，而不会遮蔽安全信号。
Swift、Python 和内置插件 CodeQL 扩展只应在这些窄 profile 具有稳定
运行时间和信号后，作为范围化或分片的后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护 lane，用于让
现有文档与最近落地的变更保持一致。它没有纯计划任务：一次
`main` 上成功的非 bot push CI 运行可以触发它，手动分发也可以
直接运行它。当 `main` 已经前移，或过去一小时内已创建另一个
未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会
审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，
因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，但如果当天 UTC 已有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动调度会绕过这个每日活动门控。该通道会生成全套分组 Vitest 性能报告，让 Codex 只进行小范围且保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行全套报告，并拒绝会降低通过基线测试数量的更改。如果基线中存在失败测试，Codex 只能修复明显失败项，并且智能体执行后的全套报告必须通过，才会提交任何内容。当机器人 push 落地前 `main` 已推进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与文档智能体相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 用途                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档更改、已更改范围、已更改插件，并构建 CI manifest      | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 检测私钥并审计工作流                                        | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisory 对生产 lockfile 进行无依赖审计                             | 始终在非草稿 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合结果                                                | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物          | Node 相关更改              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/plugin-contract/protocol 检查                 | Node 相关更改              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关更改              |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关更改              |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke   | Node 相关更改              |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片 | Node 相关更改              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关更改              |
| `checks`                         | 已构建产物渠道测试的验证器                                                    | Node 相关更改              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布的手动 CI 调度    |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                | 文档已更改                       |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                       | Python Skill 相关更改      |
| `checks-windows`                 | Windows 专属进程/路径测试，以及共享运行时导入 specifier 回归测试         | Windows 相关更改           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                  | macOS 相关更改             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关更改             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                 | Android 相关更改           |
| `test-performance-agent`         | 在受信任活动后每日运行的 Codex 慢测试优化                                    | Main CI 成功或手动调度 |

手动 CI 调度会运行与普通 CI 相同的作业图，但会强制启用所有非 Android 范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总控会通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道都不包含在 CI 中。Docker 预发布套件只会在 `Full Release Validation` 调度单独的 `Plugin Prerelease` 工作流，并启用发布验证门禁时运行。手动运行使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方针对分支、标签或完整提交 SHA 运行该图，同时使用所选调度 ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业会按顺序排列，让低成本检查先于高成本检查失败：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过变更作用域检测，并让预检清单表现得像每个已限定作用域的区域都发生了变化。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但不会单独强制执行 Windows、Android 或 macOS 原生构建；这些平台通道仍限定于平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及狭窄的插件契约辅助程序/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外防护矩阵，前提是变更文件仅限于快速任务会直接覆盖的路由或辅助程序表面。
Windows Node 检查限定于 Windows 专用的进程/路径封装、npm/pnpm/UI 运行器辅助程序、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、安装冒烟和仅测试变更仍留在 Linux Node 通道上，这样它们就不会为正常测试分片已经覆盖的内容占用 16-vCPU Windows 工作器。
独立的 `install-smoke` 工作流通过自己的 `preflight` 作业复用同一个作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker 工作器。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行智能体删除共享工作区 CLI 冒烟、运行容器 Gateway 网关网络 e2e、验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件，同时每个场景的 Docker 运行都会单独设置上限。完整路径会为夜间计划运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request 保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟、安装器/更新冒烟，以及快速内置插件 Docker E2E 作为独立作业运行，这样安装器工作就不会被根镜像冒烟阻塞。`main` 推送（包括合并提交）不会强制进入完整路径；当变更作用域逻辑会在推送时请求完整覆盖时，工作流会保留快速 Docker 冒烟，并将完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分发可以选择加入，但 pull request 和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留自己的安装专用 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖通道的裸 Node/Git 运行器，以及一个将同一个 tarball 安装到 `/app` 中以供普通功能通道使用的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池槽位数 10。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 超额提交，同时较轻的通道仍可填满可用槽位。单个比有效上限更重的通道仍可从空池启动，然后独占运行，直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或另一个毫秒值覆盖。本地聚合会预检 Docker、移除过期 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的兜底超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（如 `install-e2e`）和拆分后的内置更新通道（如 `bundled-channel-update-acpx`），同时跳过清理冒烟，以便智能体复现一个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；在计划需要包已安装通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会使用有界的每次尝试 180 秒超时进行重试，这样卡住的 registry/cache 流会快速重试，而不是消耗大部分 CI 关键路径。`Package Acceptance` 工作流是高级包门禁：它会从 npm、受信任的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流产物解析候选，然后将该单个 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，这样当前验收逻辑可以验证较旧的受信任提交，而无需检出旧工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件 fixture，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件使用较小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`，`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-services`，并且仅在 OpenWebUI-only 分发时保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分后的分块，这样安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及逐通道重跑命令。工作流 `docker_lanes` 输入会针对已准备的镜像运行选定通道，而不是分块作业，这会将失败通道调试限制在一个有目标的 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定通道是 live Docker 通道，目标作业会为该次重跑在本地构建 live-test 镜像。生成的逐通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，这样失败通道就能复用失败运行中的确切包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker 产物并打印组合/逐通道的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。计划的 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，这样重复的 npm update 和 Doctor 修复过程可以与其他内置检查一起分片运行。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍是聚合插件/运行时别名，但发布工作流使用拆分后的分块，这样渠道冒烟、更新目标、插件运行时检查，以及内置插件安装/卸载扫描可以并行运行。目标 `docker_lanes` 分发也会在一个共享包/镜像准备步骤之后，将多个选定通道拆分为并行作业，并且内置渠道更新通道会针对临时 npm 网络故障重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产代码和核心测试 typecheck，以及核心 lint/guard；仅核心测试变更只运行核心测试 typecheck 和核心 lint；插件生产代码变更会运行插件生产代码和插件测试 typecheck，以及插件 lint；仅插件测试变更会运行插件测试 typecheck 和插件 lint。公共插件 SDK 或插件契约变更会扩展到插件 typecheck，因为插件依赖这些核心契约，但 Vitest 插件扫描属于显式测试工作。仅发布元数据的版本号变更会运行定向版本/config/根依赖检查。未知的根目录/config 变更会以故障安全方式落到所有检查 lane。
本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且
有意比 `check:changed` 更便宜：直接测试编辑会运行自身，
源码编辑优先使用显式映射，然后是同级测试和导入图
依赖项。共享群组房间投递配置是显式映射之一：
对群组可见回复配置、源码回复投递模式或
message-tool 系统提示词的变更，会路由到核心回复测试以及 Discord 和
Slack 投递回归测试，因此共享默认值变更会在第一次 PR
推送前失败。仅当变更的范围大到整个 harness，
导致便宜的映射集合不再是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为
宽泛证明使用一个新预热的 box。在把慢速门禁花在一个复用、过期或
刚报告异常大规模同步的 box 上之前，先在该
box 内运行 `pnpm testbox:sanity`。当所需根文件（例如
`pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个
已跟踪删除时，sanity check 会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。停止那个 box，并预热一个新的，而不是调试
产品测试失败。对于有意的大规模删除 PR，请为那次 sanity 运行设置
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。当本地 Blacksmith CLI 调用停留在
sync 阶段超过五分钟且没有同步后输出时，`pnpm
testbox:run` 也会终止该调用。设置
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或为异常大的本地 diff 使用更大的
毫秒值。

手动 CI dispatch 会运行 `checks-node-compat-node22`，作为宽泛兼容性覆盖。Android 对独立手动 CI 通过 `include_android=true` 选择启用，并且始终为 `Full Release Validation` 启用。`Plugin Prerelease` 是更昂贵的产品/包覆盖，因此它是一个单独的 workflow，由 `Full Release Validation` 或显式操作员 dispatch。普通 pull request、`main` 推送和独立手动 CI dispatch 会保持该套件关闭。

最慢的 Node 测试族会被拆分或平衡，让每个 job 保持较小规模，同时不会过度预留 runner：渠道契约按三个加权 shard 运行，小型核心单元 lane 会配对，auto-reply 以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing shard；agentic Gateway 网关/插件 config 会分散到现有仅源码 agentic Node job 中，而不是等待已构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest config，而不是共享插件 catch-all。`Plugin Prerelease` 会在八个插件 worker 之间平衡内置插件测试；这些插件 shard job 每次最多运行两个插件 config 组，每组一个 Vitest worker，并使用更大的 Node heap，因此导入密集型插件批次不会创建额外的 CI job。宽泛 agents lane 使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由某个单一慢测试文件拥有。`runtime-config` 与 infra core-runtime shard 一起运行，避免共享 runtime shard 承担尾部耗时。include-pattern shard 使用 CI shard 名称记录 timing 条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个 config 和经过过滤的 shard。`check-additional` 将包边界 compile/canary 工作放在一起，并将 runtime topology architecture 与 Gateway 网关 watch 覆盖分离；boundary guard shard 会在一个 job 内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心 support-boundary shard 会在 `build-artifacts` 中，在 `dist/` 和 `dist-runtime/` 已构建后并发运行，保留它们旧有的检查名称作为轻量级 verifier job，同时避免两个额外 Blacksmith worker 和第二个 artifact-consumer 队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的 unit-test lane 仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复执行 debug APK 打包 job。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新 run 也失败，否则将其视为 CI 噪声。聚合 shard 检查使用 `!cancelled() && always()`，因此它们仍会报告正常的 shard 失败，但不会在整个 workflow 已被取代后继续排队。
自动 CI concurrency key 带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组里的 zombie 不会无限期阻塞更新的 main run。手动全套件 run 使用 `CI-manual-v1-*`，并且不会取消正在进行的 run。

## 运行器

| 运行器                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`，快速安全 job 和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`），快速 protocol/contract/bundled 检查，分片渠道契约检查，除 lint 之外的 `check` shard，`check-additional` shard 和聚合，Node 测试聚合 verifier，文档检查，Python Skills，workflow-sanity，labeler，auto-response；install-smoke preflight 也使用 GitHub 托管 Ubuntu，因此 Blacksmith matrix 可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件 shard、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试 shard、内置插件测试 shard、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，使得 8 vCPU 的成本高于节省；install-smoke Docker 构建，其中 32-vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本地等效命令

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

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

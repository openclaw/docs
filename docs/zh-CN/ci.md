---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-30T02:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60576e126bd5012b12c62acfb72a991d2c3207e532a5b7137b218ae9b37852d2
    source_path: ci.md
    workflow: 16
---

CI 在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域，在只有无关区域发生变更时跳过开销较高的作业。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并展开完整的常规 CI 图，用于候选发布版本或广泛验证；对于独立手动运行，Android 通道通过 `include_android` 选择启用。仅用于发布的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只会从 `Full Release Validation` 或显式手动调度运行。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`，这是一个生产 Knip 仅依赖项检查流程，固定到该脚本使用的最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最小发布年龄限制。它还运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 对比。当 PR 新增了未经审核的未使用文件，或在清理后留下陈旧的允许列表条目时，该保护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以进行仅发布用的插件/包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 以进行安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已发布包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的实时/提供商覆盖广度：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。该总控会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行附加最慢作业表。如果子工作流被重新运行并转为绿色，只需重新运行父验证器作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅常规完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，或者在总控上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这能让失败的发布箱在专注修复后以有界范围重新运行。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 将其作为具名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，让缓慢的实时提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证二进制文件。将 Docker 支撑的实时套件保留在常规 Blacksmith runner 上，因为容器作业不是启动嵌套 Docker 测试的合适位置。

Docker 支撑的实时模型/后端分片对每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源码 Docker 目标，则说明发布运行配置错误，并会把时钟时间浪费在重复镜像构建上。

`OpenClaw Release Checks` 使用受信任的工作流引用将所选引用一次性解析为 `release-package-under-test` tarball，然后将该 artifact 传递给实时/E2E 发布路径 Docker 工作流和包验收分片。这能让发布箱之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是用于验证包 artifact 且不阻塞发布工作流的旁路运行工作流。它会从已发布的 npm 规格、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball artifact 中解析一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，使用该 tarball 而不是重新打包工作流检出内容。配置覆盖冒烟、包、产品、完整和自定义 Docker 通道选择。`package` 配置使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性制约。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` artifact，并保留已发布 npm 规格路径用于独立调度。

## 包验收

当问题是“这个可安装的 OpenClaw 包能否作为产品正常工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收会通过用户安装或更新后实际使用的同一个 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该 artifact，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当某个配置选择多个目标 `docker_lanes` 时，可复用工作流会准备包和共享镜像一次，然后将这些通道展开为并行的目标 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并且在包验收解析出包时安装同一个 `package-under-test` artifact；独立 Telegram 调度仍可安装已发布的 npm 规格。
4. 如果包解析、Docker 验收或可选 Telegram 通道失败，`summary` 会使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或确切的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版本验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享的 artifact 应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是 `source=ref` 时会被打包的源码提交。这允许当前测试 harness 验证较旧的受信任源码提交，而无需运行旧工作流逻辑。

配置映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用包验收。发布路径 Docker 块覆盖重叠的包/更新/插件通道，而包验收针对同一个已解析包 tarball 保留 artifact 原生的内置渠道兼容、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。Windows 打包版和安装器全新安装通道还会验证已安装包能否从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS agent-turn 冒烟默认在设置时使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用实时提供商/模型通道仍覆盖更广泛的模型路由，包括较慢的前沿默认值。

包验收对已发布包设置了有界的旧版兼容窗口。直到 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可以针对 `dist/postinstall-inventory.json` 中已知私有 QA 条目使用兼容路径，这些条目指向 tarball 中省略的文件；当包未公开该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可记录缺失的持久化 `update.channel`；插件冒烟可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据标记文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的软件包验收运行时，先查看 `resolve_package`
摘要，确认软件包来源、版本和 SHA-256。然后检查
`docker_acceptance` 子运行及其 Docker 工件：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段
计时和重运行命令。优先重运行失败的软件包 profile 或
精确的 Docker lane，而不是重运行完整的发布验证。

QA Lab 在主智能范围工作流之外有专用的 CI lane。
`Parity gate` 工作流会在匹配的 PR 变更和手动调度时运行；它会
构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6
agentic pack。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也会在
手动调度时运行；它会将 mock parity gate、live Matrix lane、live
Telegram 和 Discord lane 分散为并行作业。live 作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布
检查会用确定性的 mock 提供商和 mock 限定模型
（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram
live transport lane，这样渠道契约就会与实时模型延迟和普通提供商插件启动隔离。
live transport Gateway 网关还会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；
提供商连接性由单独的 live 模型、原生提供商和 Docker 提供商套件覆盖。Matrix 会为定时和发布 gate 使用 `--profile fast`，
仅在签出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值
和手动工作流输入仍为 `all`；手动 `matrix_profile=all`
调度始终会将完整 Matrix 覆盖拆分为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会
在发布批准前运行发布关键的 QA Lab lane；它的 QA parity
gate 会将候选 pack 和 baseline pack 作为并行 lane 作业运行，然后将
两个工件下载到一个小型报告作业中，进行最终 parity 比较。
除非变更确实触及 QA 运行时、model-pack parity，或 parity 工作流拥有的表面，
否则不要把 PR 落地路径放在 `Parity gate` 后面。
对于普通渠道、配置、文档或单元测试修复，将它视为可选
信号，并遵循范围化 CI/check 证据。

`Duplicate PRs After Merge` 工作流是供维护者在落地后清理重复项的手动工作流。
它默认 dry-run，并且只有在 `apply=true` 时才会关闭明确
列出的 PR。在修改 GitHub 前，它会验证已落地的 PR
已经合并，并验证每个重复项要么有共享的引用 issue，
要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为范围很窄的第一轮安全扫描器，
不是完整仓库扫描。每日、手动和非草稿 pull request guard
运行会在 `/codeql-critical-security/core-auth-secrets` 类别下，使用高精度安全
查询扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript
认证、密钥、沙箱、cron 和 Gateway 网关表面。
channel-runtime-boundary 作业会在 `/codeql-critical-security/channel-runtime-boundary`
类别下，单独扫描核心渠道实现
契约以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和
审计触点，这样渠道安全信号就可以扩展，而不需要扩大 baseline
auth/secrets 类别。network-ssrf-boundary 作业会在
`/codeql-critical-security/network-ssrf-boundary` 类别下扫描核心 SSRF、IP 解析、
网络 guard、web-fetch 和插件 SDK SSRF 策略表面，这样网络信任
边界信号就会与 auth/secrets 安全基线保持分离。
mcp-process-tool-boundary 作业会在
`/codeql-critical-security/mcp-process-tool-boundary` 类别下扫描 MCP 服务器、进程执行 helper、
出站投递和智能体工具执行 gate，这样命令和
工具边界信号就会与 auth/secrets 基线以及
非安全 MCP/process 质量 shard 保持分离。plugin-trust-boundary 作业会在 `/codeql-critical-security/plugin-trust-boundary` 类别下扫描
插件安装、加载器、manifest、registry、运行时依赖 staging、
source-loading、公共表面和插件 SDK 软件包契约信任表面，这样插件
供应链和运行时加载信号就会与内置插件
实现代码以及非安全插件质量 shard 保持分离。
pull request guard 保持轻量：它只会因
`.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src`
下的变更启动，并运行与定时工作流相同的 critical-security 矩阵。Android、
macOS 和非安全质量 CodeQL 不属于 PR 默认项。

`CodeQL Android Critical Security` 工作流是定时 Android
安全 shard。它会在 workflow sanity 接受的最小
Blacksmith Linux runner label 上为 CodeQL 手动构建 Android 应用，并在
`/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS
安全 shard。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤依赖构建结果，并在
`/codeql-critical-security/macos` 类别下上传结果。将它放在每日
默认工作流之外，因为即使干净时，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全 shard。它
只会在较小的 Blacksmith Linux runner 上，针对较窄的高价值表面运行
error-severity、非安全 JavaScript/TypeScript 质量查询。它的
手动调度接受
`profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`；
窄 profile 是教学/迭代钩子，用于在不调度工作流其余部分的情况下
单独运行一个质量 shard。
它的
core-auth-secrets 作业会在单独的 `/codeql-critical-quality/core-auth-secrets`
类别下扫描 auth、secrets、沙箱、cron 和 Gateway 网关安全
边界代码。config-boundary
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法
契约。channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。agent-runtime-boundary 作业会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商调度、
auto-reply 调度和队列，以及 ACP control-plane 运行时契约。mcp-process-runtime-boundary 作业会在单独的
`/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP 服务器和工具桥、进程
监督 helper，以及出站投递契约。memory-runtime-boundary 作业会在单独的 `/codeql-critical-quality/memory-runtime-boundary`
类别下扫描 memory host SDK、memory runtime facade、
memory 插件 SDK 别名、memory runtime 激活 glue 和 memory doctor
命令。session-diagnostics-boundary 作业会在单独的
`/codeql-critical-quality/session-diagnostics-boundary` 类别下扫描 reply queue 内部机制、
会话投递队列、出站会话绑定/投递 helper、diagnostic
event/log bundle 表面，以及 session doctor CLI 契约。plugin-sdk-reply-runtime 作业会在单独的
`/codeql-critical-quality/plugin-sdk-reply-runtime` 类别下扫描插件 SDK 入站 reply dispatch、reply
payload/chunking/runtime helper、渠道 reply 选项、投递队列和
session/thread 绑定 helper。provider-runtime-boundary 作业会在单独的
`/codeql-critical-quality/provider-runtime-boundary` 类别下扫描模型目录规范化、提供商 auth
和 discovery、提供商 runtime registration、提供商默认值/目录，以及
web/search/fetch/embedding provider registry。ui-control-plane 作业会在单独的
`/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI bootstrap、本地持久化、Gateway 网关
控制流和 task control-plane 运行时契约。
web-media-runtime-boundary 作业会在单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 web fetch/search、media IO、media
understanding、image-generation 和 media-generation 运行时契约。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary`
类别下扫描加载器、registry、公共表面和插件 SDK
入口点契约。plugin-sdk-package-contract 作业会在单独的
`/codeql-critical-quality/plugin-sdk-package-contract` 类别下扫描已发布软件包侧的
插件 SDK 源码和插件软件包契约 helper。将该
工作流与安全分开，以便质量发现可以被
定时、度量、禁用或扩展，而不会遮蔽安全信号。
Swift、Python 和内置插件 CodeQL 扩展只应在窄 profile 拥有稳定
运行时间和信号后，作为范围化或 shard 化的后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护 lane，用于保持
现有文档与最近落地的变更一致。它没有纯定时计划：一次
在 `main` 上成功的非 bot push CI 运行可以触发它，手动调度也可以
直接运行它。当 `main` 已继续前进，或过去一小时内已经创建了另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会
审查从上一个未跳过 Docs Agent source SHA 到
当前 `main` 的提交范围，因此一次每小时运行可以覆盖
自上次文档 pass 以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护 lane，
用于处理慢测试。它没有纯定时计划：一次在
`main` 上成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用
运行过或正在运行，它会跳过。手动调度会绕过该每日活动
gate。该 lane 会构建一份全套件 grouped Vitest 性能报告，让 Codex
只进行小型、保留覆盖率的测试性能修复，而不是大范围
重构，然后重运行全套件报告，并拒绝会减少
通过基线测试数量的变更。如果 baseline 有失败测试，Codex 只能修复
明显失败，且 after-agent 全套件报告必须通过后
才会提交任何内容。当 `main` 在 bot push 落地前前进时，该 lane
会 rebase 已验证的补丁，重运行 `pnpm check:changed`，然后重试 push；
有冲突的过期补丁会被跳过。它使用 GitHub-hosted Ubuntu，以便 Codex
action 能保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的插件，并构建 CI 清单                                         | 始终在非草稿推送和 PR 上运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 始终在非草稿推送和 PR 上运行       |
| `security-dependency-audit`      | 对照 npm 安全公告，对生产 lockfile 进行无需依赖的审计                                        | 始终在非草稿推送和 PR 上运行       |
| `security-fast`                  | 快速安全作业所需的聚合项                                                                     | 始终在非草稿推送和 PR 上运行       |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查以及可复用的下游产物                                   | 与 Node 相关的变更                 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                            | 与 Node 相关的变更                 |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                                                   | 与 Node 相关的变更                 |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道                                         | 与 Node 相关的变更                 |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、守卫、测试类型和严格冒烟测试                          | 与 Node 相关的变更                 |
| `check-additional`               | 架构、边界、插件表面守卫、包边界和 gateway-watch 分片                                        | 与 Node 相关的变更                 |
| `build-smoke`                    | 已构建 CLI 冒烟测试和启动内存冒烟测试                                                       | 与 Node 相关的变更                 |
| `checks`                         | 构建产物渠道测试的验证器                                                                     | 与 Node 相关的变更                 |
| `checks-node-compat-node22`      | Node 22 兼容性构建和冒烟通道                                                                 | 发布时的手动 CI 调度               |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                                  | 文档变更时                         |
| `skills-python`                  | 针对由 Python 支持的 Skills 运行 Ruff + pytest                                               | 与 Python Skill 相关的变更         |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归测试                               | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                     | Android 相关变更                   |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢测试优化                                                           | main CI 成功或手动调度             |

手动 CI 调度会运行与正常 CI 相同的作业图，但会强制开启每个非 Android 范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总控会通过传递 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描以及插件预发布 Docker 通道不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 调度单独的 `Plugin Prerelease` 工作流，并启用发布验证门禁时运行。手动运行会使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方在使用所选调度 ref 中的工作流文件的同时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业会排序，使低成本检查先于高成本检查失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠执行，因此下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过变更作用域检测，并让预检清单表现得像每个限定作用域都发生了变更一样。
CI workflow 编辑会验证 Node CI 图以及 workflow linting，但它们本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然限定于平台源文件变更。
仅 CI 路由编辑、选定的低成本核心测试夹具编辑，以及范围较窄的插件合约辅助/测试路由编辑，会使用快速的仅 Node 清单路径：预检、安全检查和单个 `checks-fast-core` 任务。当变更文件仅限于这个快速任务会直接覆盖的路由或辅助表面时，该路径会避开构建产物、Node 22 兼容性、渠道合约、完整核心分片、内置插件分片和额外的保护矩阵。
Windows Node 检查限定于 Windows 专属的进程/路径封装、npm/pnpm/UI runner 辅助、包管理器配置，以及执行该通道的 CI workflow 表面；无关的源代码、插件、install-smoke 和仅测试变更会留在 Linux Node 通道上，这样它们不会占用 16-vCPU Windows worker 来覆盖已由常规测试分片覆盖的内容。
单独的 `install-smoke` workflow 通过自己的 `preflight` job 复用同一个作用域脚本。它把冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/package 表面、内置插件 package/manifest 变更，以及 Docker 冒烟 job 会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete 共享工作区 CLI 冒烟，运行容器 gateway-network e2e，验证内置 extension build arg，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，同时每个场景的 Docker run 也会单独受限。完整路径会把 QR package install 和 installer Docker/update 覆盖保留给 nightly scheduled 运行、手动触发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的 pull request。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后把 QR package install、根 Dockerfile/gateway 冒烟、installer/update 冒烟，以及快速内置插件 Docker E2E 作为独立 job 运行，使 installer 工作不用等待根镜像冒烟完成。`main` 推送（包括 merge commit）不会强制完整路径；当变更作用域逻辑会在 push 上请求完整覆盖时，workflow 会保留快速 Docker 冒烟，并把完整安装冒烟留给 nightly 或发布验证。较慢的 Bun global install image-provider 冒烟由 `run_bun_global_install_smoke` 单独控制；它会在 nightly 计划和发布检查 workflow 中运行，手动 `install-smoke` 触发也可以选择加入，但 pull request 和 `main` 推送不会运行它。QR 和 installer Docker 测试会保留它们自己的安装导向 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，把 OpenClaw 作为 npm tarball 打包一次，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于 installer/update/plugin-dependency 通道的裸 Node/Git runner，以及一个把同一个 tarball 安装到 `/app` 中、用于常规功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool slot 数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感 tail-pool slot 数 10。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 过载，而较轻通道仍能填满可用 slot。单个比有效上限更重的通道仍可以从空池启动，然后独占运行直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon 出现创建风暴；可以用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃通道 Status，持久化通道耗时以用于最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，每个通道都有 120 分钟的后备超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道会使用更紧的逐通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括 `install-e2e` 等仅发布通道，以及 `bundled-channel-update-acpx` 等拆分的内置更新通道，同时跳过清理冒烟，方便智能体复现某个失败通道。可复用的 live/E2E workflow 会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会把该计划转换成 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的 package artifact，或从 `package_artifact_run_id` 下载 package artifact；验证 tarball inventory；当计划需要已安装 package 的通道时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package digest tag 的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有 package-digest 镜像，而不是重新构建。Docker 镜像拉取会用有界的每次 180 秒超时重试，这样卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。`Package Acceptance` workflow 是高层 package gate：它会从 npm、受信任的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前的 workflow artifact 解析候选项，然后把单个 `package-under-test` artifact 传给可复用 Docker E2E workflow。它会把 `workflow_ref` 与 `package_ref` 分开，使当前 acceptance 逻辑可以验证较旧的受信任 commit，而无需 checkout 旧 workflow 代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对解析 tarball 的 Telegram package QA。发布路径 Docker 套件会运行更小的分块 job，并带上 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个 chunk 只拉取它需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，它会被并入 `plugins-runtime-services`，并且只为 OpenWebUI-only 触发保留独立的 `openwebui` chunk。旧的聚合 chunk 名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布 workflow 使用拆分后的 chunk，这样 installer E2E 和内置插件安装/卸载扫测不会主导关键路径。`install-e2e` 通道别名仍是两个 provider installer 通道的聚合手动重跑别名。`bundled-channels` chunk 会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的全量 `bundled-channel-deps` 通道。每个 chunk 都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及逐通道重跑命令。workflow 的 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行 chunk job，这样失败通道调试会限定在一个目标 Docker job，并为该运行准备、下载或复用 package artifact；如果选定通道是 live Docker 通道，目标 job 会为该次重跑在本地构建 live-test 镜像。生成的逐通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确 package 和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker artifact 并打印组合/逐通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可获取慢通道和阶段关键路径摘要。计划的 live/E2E workflow 每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，这样重复的 npm update 和 Doctor repair 轮次可以与其他内置检查分片并行。

当前发布 Docker chunk 为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` chunk 仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍作为聚合 plugin/runtime 别名保留，但发布 workflow 使用拆分后的 chunk，使渠道冒烟、更新目标、插件运行时检查和内置插件安装/卸载扫测可以并行运行。目标 `docker_lanes` 触发也会在一个共享 package/镜像准备步骤后，把多个选定通道拆分成并行 job，内置渠道更新通道会针对临时 npm 网络故障重试一次。

本地变更 lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产与核心测试类型检查，以及核心 lint/guard；仅核心测试变更只运行核心测试类型检查加核心 lint；插件生产变更会运行插件生产与插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查加插件 lint。公开插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫描属于明确的测试工作。仅发布元数据的版本 bump 会运行有针对性的版本、配置和根依赖检查。未知的根目录或配置变更会以安全方式退回到所有检查 lane。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更低成本：直接测试编辑会运行其自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源码回复投递模式或 message-tool 系统提示的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归，因此共享默认值变更会在第一次 PR 推送前失败。仅当变更覆盖整个 harness，以至于低成本映射集合不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为宽泛证明使用新的预热 box。在对一个复用过、已过期或刚刚报告了异常大规模同步的 box 投入慢速门禁之前，先在该 box 内运行 `pnpm testbox:sanity`。当所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。请停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意进行的大规模删除 PR，为该完整性检查运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或者为异常大的本地 diff 使用更大的毫秒值。

手动 CI dispatch 会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。Android 对独立手动 CI 通过 `include_android=true` 选择启用，并且对 `Full Release Validation` 始终启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是由 `Full Release Validation` 或显式操作员 dispatch 的单独 workflow。普通 pull request、`main` 推送和独立手动 CI dispatch 会保持该套件关闭。

最慢的 Node 测试族已被拆分或均衡，使每个 job 保持较小规模且不过度预留 runner：渠道契约以三个加权 shard 运行，小型核心单元 lane 成对运行，自动回复以四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing shard，智能体相关 Gateway 网关/插件配置分散到现有的仅源码智能体相关 Node job 中，而不是等待构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用其专用 Vitest 配置，而不是共享插件 catch-all。`Plugin Prerelease` 在八个插件 worker 间均衡内置插件测试；这些插件 shard job 每次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node heap，因此导入密集型插件批次不会创建额外 CI job。宽泛 agents lane 使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime shard 一起运行，以避免共享 runtime shard 承担尾部耗时。Include-pattern shard 使用 CI shard 名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与过滤后的 shard。`check-additional` 将包边界编译/canary 工作保持在一起，并将 runtime topology 架构与 Gateway 网关 watch 覆盖分离；boundary guard shard 在一个 job 内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心 support-boundary shard 会在 `dist/` 与 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证 job，同时避免两个额外 Blacksmith worker 和第二个 artifact-consumer 队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；其单元测试 lane 仍会使用短信/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包 job。
当同一 PR 或 `main` ref 上有更新的推送落地时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合 shard 检查使用 `!cancelled() && always()`，因此它们仍会报告正常的 shard 失败，但不会在整个 workflow 已被取代后继续排队。
自动 CI 并发键已版本化（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项不能无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全 job 和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` shard、`check-additional` shard 和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith matrix 可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重插件 shard、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试 shard、内置插件测试 shard、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍足够敏感，因此 8 vCPU 节省的时间抵不上成本；install-smoke Docker 构建中，32 vCPU 的排队时间抵不上节省的时间                                                                                                                                                                                                                                                                                                     |
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

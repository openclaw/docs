---
read_when:
    - 你需要了解为什么 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T23:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e8ebc01707b673ab866c584abdfa5ccb8064d580f3a250c60304c2d056d109dc
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围界定，在只有无关区域发生变更时跳过开销较高的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并为候选发布版本或大范围验证展开完整的常规 CI 图；对于独立手动运行，Android 通道通过 `include_android` 选择启用。仅发布用的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只会从 `Full Release Validation` 或显式手动派发运行。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`，这是一个仅检查生产 Knip 依赖项的流程，固定使用该脚本所用的最新 Knip 版本，并且在 `dlx` 安装时禁用 pnpm 的最小发布年龄限制。它还会运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未经审核的未使用文件，或在清理后留下陈旧的允许列表条目时，该防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建内容、实时测试内容和包桥接表面。

`Full Release Validation` 是用于“在发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标派发手动 `CI` 工作流，为仅发布用的插件、包、静态和 Docker 证明派发 `Plugin Prerelease`，并为安装冒烟测试、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道派发 `OpenClaw Release Checks`。当提供已发布的包规范时，它也可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的实时/提供商覆盖广度：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总控工作流会记录已派发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重新运行并变为绿色，只需重新运行父级验证器作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对候选发布版本使用 `all`，只针对常规完整 CI 子工作流使用 `ci`，针对每个发布子工作流使用 `release-checks`，或在总控工作流中使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在集中修复后，将失败的发布箱重新运行限制在有界范围内。

发布实时/E2E 子工作流保留了广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分后的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是作为一个串行作业运行。这样在保持相同文件覆盖的同时，使较慢的实时提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支持的实时套件保留在常规 Blacksmith 运行器上，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支持的实时模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源码 Docker 目标，则发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

`OpenClaw Release Checks` 使用受信任的工作流引用，将选定引用一次性解析为 `release-package-under-test` tarball，然后将该构件传递给实时/E2E 发布路径 Docker 工作流和包验收分片。这样可以让发布箱之间的包字节保持一致，并避免在多个子作业中重新打包同一个候选版本。

包验收是用于验证包构件而不阻塞发布工作流的旁路运行工作流。它会从已发布的 npm 规范、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 构件解析一个候选包，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，使用该 tarball 而不是重新打包工作流检出内容。配置档覆盖冒烟测试、包、产品、完整和自定义 Docker 通道选择。`package` 配置档使用离线插件覆盖，因此已发布包验证不会被实时 ClawHub 可用性阻塞。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 构件，同时为独立派发保留已发布 npm 规范路径。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用包验收。它不同于常规 CI：常规 CI 验证源码树，而包验收通过用户在安装或更新后实际使用的同一 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该构件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当某个配置档选择多个定向 `docker_lanes` 时，可复用工作流会准备一次包和共享镜像，然后将这些通道展开为具有唯一构件的并行定向 Docker 作业。
3. `package_telegram` 可选择调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时，它会运行，并在包验收已解析出包时安装同一个 `package-under-test` 构件；独立 Telegram 派发仍可安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖项，并使用 `scripts/package-openclaw-for-docker.mjs` 打包它。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享构件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源码提交。这样当前测试 harness 就能验证较旧的受信任源码提交，而无需运行旧的工作流逻辑。

配置档映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用包验收。发布路径 Docker 块覆盖重叠的包/更新/插件通道，而包验收会针对同一个已解析的包 tarball 保留构件原生的内置渠道兼容性、离线插件和 Telegram 证明。跨 OS 发布检查仍会覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。Windows 打包版和安装器全新安装通道还会验证，已安装的包可以从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS Agent 回合冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用实时提供商/模型通道仍会覆盖更广泛的模型路由，包括较慢的前沿默认值。

包验收对已发布包具有有界的旧版兼容窗口。直到 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，并且可以记录缺失的持久化 `update.channel`；插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据标记文件发出警告。之后的包必须满足现代合约；相同条件会失败，而不是警告或跳过。

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
`docker_acceptance` 子运行及其 Docker 产物：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段
计时和重新运行命令。优先重新运行失败的包配置文件或
精确的 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能作用域工作流之外有专用 CI 通道。
`Parity gate` 工作流会在匹配的 PR 更改和手动触发时运行；它
构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6
智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可
手动触发；它会将模拟一致性门、实时 Matrix 通道，以及实时
Telegram 和 Discord 通道扇出为并行作业。实时作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布
检查会使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此
渠道契约会与实时模型延迟和普通提供商插件启动隔离。实时传输 Gateway 网关还
会禁用记忆搜索，因为 QA 一致性会单独覆盖记忆行为；
提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。
Matrix 对定时和发布门使用 `--profile fast`，
仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值
和手动工作流输入仍为 `all`；手动 `matrix_profile=all`
触发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 还会
在发布批准前运行发布关键的 QA Lab 通道；它的 QA 一致性
门会将候选包和基线包作为并行通道作业运行，然后将
两个产物下载到一个小型报告作业中，用于最终一致性比较。
不要把 PR 合入路径放在 `Parity gate` 之后，除非更改确实
触及 QA 运行时、模型包一致性，或一致性工作流拥有的表面。
对于普通渠道、配置、文档或单元测试修复，把它视为可选
信号，并遵循限定范围的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于合入后重复项清理的手动维护者工作流。
它默认 dry-run，并且仅在 `apply=true` 时关闭明确
列出的 PR。在修改 GitHub 之前，它会验证
已合入 PR 已被合并，并且每个重复项都有共享的引用 issue
或重叠的变更块。

`CodeQL` 工作流有意作为狭窄的第一遍安全扫描器，
而不是完整仓库扫描。每日和手动运行会扫描 Actions 工作流代码
以及风险最高的 JavaScript/TypeScript 凭证、秘密、沙箱、cron 和
Gateway 网关表面，并在
`/codeql-critical-security/core-auth-secrets` 类别下使用高精度安全查询。
channel-runtime-boundary 作业会单独扫描核心渠道实现
契约以及渠道插件运行时、Gateway 网关、插件 SDK、秘密和
审计接触点，并归入 `/codeql-critical-security/channel-runtime-boundary`
类别，使渠道安全信号可以扩展，而不必扩大基线
凭证/秘密类别。network-ssrf-boundary 作业会扫描核心 SSRF、IP 解析、
网络防护、web-fetch 和插件 SDK SSRF 策略表面，并归入
`/codeql-critical-security/network-ssrf-boundary` 类别，使网络信任
边界信号与凭证/秘密安全基线保持分离。
mcp-process-tool-boundary 作业会扫描 MCP 服务器、进程执行助手、
出站交付和智能体工具执行门，并归入
`/codeql-critical-security/mcp-process-tool-boundary` 类别，使命令和
工具边界信号与凭证/秘密基线以及
非安全 MCP/进程质量分片保持分离。plugin-trust-boundary 作业会扫描
插件安装、加载器、清单、注册表、运行时依赖暂存、
源码加载、公共表面和插件 SDK 包契约信任表面，并归入
`/codeql-critical-security/plugin-trust-boundary` 类别，使插件
供应链和运行时加载信号与内置插件
实现代码以及非安全插件质量分片保持分离。

`CodeQL Android Critical Security` 工作流是定时 Android
安全分片。它会在工作流完整性检查接受的最小
Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并将结果上传到
`/codeql-critical-security/android` 类别。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤依赖构建结果，并将结果上传到
`/codeql-critical-security/macos` 类别。让它保持在每日
默认工作流之外，因为即使干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它
仅在较小的 Blacksmith Linux runner 上，针对狭窄的高价值表面运行错误严重级别的
非安全 JavaScript/TypeScript 质量查询。它的
手动触发接受
`profile=all|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`；
狭窄配置文件是教学/迭代钩子，可在不触发工作流其余部分的情况下
单独运行一个质量分片。
它的
core-auth-secrets 作业会在单独的 `/codeql-critical-quality/core-auth-secrets`
类别下扫描凭证、秘密、沙箱、cron 和 Gateway 网关安全
边界代码。config-boundary
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置架构、
迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议架构和服务器方法
契约。channel-runtime-boundary 作业会在单独的
`/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。
agent-runtime-boundary 作业会在单独的
`/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、
自动回复分发和队列，以及 ACP 控制平面运行时契约。
mcp-process-runtime-boundary 作业会在单独的
`/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP 服务器和工具桥接、进程
监督助手，以及出站交付契约。memory-runtime-boundary 作业会在单独的
`/codeql-critical-quality/memory-runtime-boundary` 类别下扫描记忆宿主 SDK、记忆运行时外观、
记忆插件 SDK 别名、记忆运行时激活胶水和记忆 Doctor
命令。session-diagnostics-boundary 作业会在单独的
`/codeql-critical-quality/session-diagnostics-boundary` 类别下扫描回复队列内部机制、
会话交付队列、出站会话绑定/交付助手、诊断
事件/日志包表面和会话 Doctor CLI 契约。
plugin-sdk-reply-runtime 作业会在单独的
`/codeql-critical-quality/plugin-sdk-reply-runtime` 类别下扫描插件 SDK 入站回复分发、回复
载荷/分块/运行时助手、渠道回复选项、交付队列和
会话/线程绑定助手。provider-runtime-boundary 作业会在单独的
`/codeql-critical-quality/provider-runtime-boundary` 类别下扫描模型目录规范化、提供商凭证
和发现、提供商运行时注册、提供商默认值/目录，以及
web/search/fetch/embedding 提供商注册表。ui-control-plane 作业会在单独的
`/codeql-critical-quality/ui-control-plane` 类别下扫描控制 UI 引导、本地持久化、Gateway 网关
控制流和任务控制平面运行时契约。
web-media-runtime-boundary 作业会在单独的
`/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 web fetch/search、媒体 IO、媒体
理解、图像生成和媒体生成运行时契约。
plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary`
类别下扫描加载器、注册表、公共表面和插件 SDK
入口点契约。plugin-sdk-package-contract 作业会在单独的
`/codeql-critical-quality/plugin-sdk-package-contract` 类别下扫描已发布包侧的
插件 SDK 源码和插件包契约助手。让该
工作流与安全分离，这样质量发现就可以被
定时运行、度量、禁用或扩展，而不会掩盖安全信号。
Swift、Python 和内置插件 CodeQL 扩展应仅在狭窄配置文件具有稳定
运行时和信号后，作为限定范围或分片的后续工作重新添加。

`Docs Agent` 工作流是事件驱动的 Codex 维护通道，用于保持
现有文档与最近合入的更改一致。它没有纯定时计划：
`main` 上成功的非 bot push CI 运行可以触发它，手动触发也可以
直接运行它。当 `main` 已推进，或过去一小时内创建了另一个未跳过的 Docs Agent 运行时，
workflow-run 调用会跳过。运行时，它会
检查从上一个未跳过 Docs Agent 源 SHA 到当前 `main` 的提交范围，
因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 更改。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护通道，
用于处理慢测试。它没有纯定时计划：`main` 上成功的非 bot push CI 运行可以
触发它，但如果当天 UTC 已经有另一个 workflow-run 调用
运行过或正在运行，它会跳过。手动触发会绕过该每日活动
门。该通道会构建完整套件分组 Vitest 性能报告，让 Codex
只进行小范围、保持覆盖率的测试性能修复，而不是广泛
重构，然后重新运行完整套件报告，并拒绝会降低
通过基线测试数量的更改。如果基线存在失败测试，Codex 可以
只修复明显失败，并且 after-agent 完整套件报告必须通过后
才能提交任何内容。当 `main` 在 bot push 落地前推进时，该通道
会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试 push；
有冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex
action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更的作用域、变更的插件，并构建 CI 清单                                     | 始终在非草稿推送和 PR 上运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 始终在非草稿推送和 PR 上运行       |
| `security-dependency-audit`      | 对照 npm 安全公告执行无依赖的生产 lockfile 审计                                              | 始终在非草稿推送和 PR 上运行       |
| `security-fast`                  | 快速安全作业的必需汇总                                                                       | 始终在非草稿推送和 PR 上运行       |
| `build-artifacts`                | 构建 `dist/`、控制 UI、构建产物检查，以及可复用的下游产物                                    | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件、插件契约和协议检查                                      | Node 相关变更                      |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的汇总检查结果                                                 | Node 相关变更                      |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置插件、契约和插件通道                                     | Node 相关变更                      |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、防护、测试类型和严格 smoke                           | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面防护、包边界和 gateway-watch 分片                                        | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | Node 相关变更                      |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                              | 发布的手动 CI dispatch             |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                    | 文档已变更                         |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | Python Skill 相关变更              |
| `checks-windows`                 | Windows 专用进程/路径测试，以及共享运行时导入说明符回归测试                                  | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | macOS 相关变更                     |
| `macos-swift`                    | macOS app 的 Swift lint、构建和测试                                                          | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                     | Android 相关变更                   |
| `test-performance-agent`         | 在可信活动之后每日进行 Codex 慢测试优化                                                      | 主 CI 成功或手动 dispatch          |

手动 CI dispatch 运行与常规 CI 相同的作业图，但会强制开启每个非 Android 作用域通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS，以及控制 UI i18n。独立的手动 CI dispatch 仅在 `include_android=true` 时运行 Android；完整发布总括流程通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道不包含在 CI 中。只有当 `Full Release Validation` dispatch 带有已启用发布验证门禁的单独 `Plugin Prerelease` 工作流时，Docker 预发布套件才会运行。手动运行使用唯一的并发组，因此候选发布版本的完整套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许可信调用方针对分支、标签或完整提交 SHA 运行该作业图，同时使用所选 dispatch ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业经过排序，使低成本检查在高成本作业运行前先失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，因此共享构建就绪后，下游消费者可以立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分派会跳过变更作用域检测，并让预检清单表现得像每个限定区域都发生了变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只限定于平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试夹具编辑，以及窄范围插件契约辅助/测试路由编辑，会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或辅助表面时，这条路径会避免构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外的防护矩阵。
Windows Node 检查限定于 Windows 专用的进程/路径包装器、npm/pnpm/UI runner 辅助、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、安装冒烟和仅测试变更会留在 Linux Node 通道上，因此不会占用 16-vCPU Windows worker 去覆盖普通测试分片已经覆盖的内容。
单独的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟，运行容器 gateway-network e2e，验证内置 extension 构建参数，并在 240 秒聚合命令超时内运行受限的内置插件 Docker 配置文件，同时每个场景的 Docker run 会单独设置上限。完整路径会为每晚定时运行、手动分派、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟、安装器/更新冒烟，以及快速内置插件 Docker E2E 作为独立作业运行，这样安装器工作就不必等待根镜像冒烟。包括合并提交在内的 `main` 推送不会强制完整路径；当变更作用域逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟，并将完整安装冒烟留给每晚或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独门控；它会在每晚计划任务和发布检查工作流中运行，手动 `install-smoke` 分派也可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖通道的裸 Node/Git runner，以及一个会把同一个 tarball 安装到 `/app`、用于普通功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；可用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池槽位数 10。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 过载，而较轻的通道仍能填满可用槽位。单个重于有效上限的通道仍然可以从空池启动，然后独占运行直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除过期 OpenClaw E2E 容器，输出活动通道 Status，持久化通道耗时以用于最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 来检查调度器。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的逐通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括 `install-e2e` 等仅发布通道，以及 `bundled-channel-update-acpx` 等拆分的内置更新通道，同时跳过清理冒烟，让 agents 能复现单个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换成 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会在每次尝试 180 秒的有界超时内重试，因此卡住的 registry/cache 流会快速重试，而不是消耗大部分 CI 关键路径。`Package Acceptance` 工作流是高级包门禁：它会从 npm、受信任的 `package_ref`、带 SHA-256 的 HTTPS tarball 或先前工作流产物解析候选包，然后将单个 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较旧的受信任提交，而无需检出旧工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及基于已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行更小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会折叠进 `plugins-runtime-services`，并且仅在只针对 OpenWebUI 的分派中保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，这样安装器 E2E 和内置插件安装/卸载扫描就不会主导关键路径。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及逐通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块作业，这使失败通道调试限定在一个有目标的 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定通道是 live Docker 通道，目标作业会在本地为该次重跑构建 live-test 镜像。生成的逐通道 GitHub 重跑命令会在存在这些值时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker 产物并打印组合/逐通道的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可获取慢通道和阶段关键路径摘要。定时 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor 修复流程可以与其他内置检查一起分片。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍是聚合插件/运行时别名，但发布工作流使用拆分分块，让渠道冒烟、更新目标、插件运行时检查和内置插件安装/卸载扫描可以并行运行。目标 `docker_lanes` 分派也会在一次共享包/镜像准备步骤之后，将多个选定通道拆分为并行作业，并且内置渠道更新通道会针对临时 npm 网络故障重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产代码和核心测试类型检查，以及核心 lint/guard；仅核心测试变更只运行核心测试类型检查和核心 lint；插件生产代码变更会运行插件生产代码和插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查和插件 lint。公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫描是显式的测试工作。仅发布元数据的版本号更新会运行有针对性的版本、配置、根依赖检查。未知的根目录或配置变更会以安全失败方式进入所有检查通道。
本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且
刻意比 `check:changed` 更轻量：直接测试编辑会运行自身，
源代码编辑优先使用显式映射，然后是同级测试和导入图
依赖项。共享群组聊天室投递配置是显式映射之一：
对群组可见回复配置、源回复投递模式或
消息工具系统提示词的变更，会路由到核心回复测试以及 Discord 和
Slack 投递回归测试，因此共享默认值变更会在第一次 PR
推送前失败。只有当变更范围足够覆盖整个 harness，使廉价映射集合不再是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先使用新预热的 box 来提供
宽泛证明。在一个复用、已过期或
刚报告异常大同步量的 box 上花时间跑慢门禁之前，先在
box 内运行 `pnpm testbox:sanity`。当所需根文件（例如
`pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个
已跟踪文件删除时，完整性检查会快速失败。这通常表示远程同步状态不是 PR 的可信副本。
应停止该 box 并预热一个新的，而不是调试
产品测试失败。对于有意的大规模删除 PR，请为该完整性检查运行设置
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，`pnpm
testbox:run` 也会终止该调用。设置
`OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或为异常大的本地 diff 使用更大的
毫秒值。

手动 CI 调度会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。Android 在独立手动 CI 中通过 `include_android=true` 选择启用，并且在 `Full Release Validation` 中始终启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 或显式操作员调度。普通 pull request、`main` 推送和独立手动 CI 调度会保持该套件关闭。

最慢的 Node 测试家族会被拆分或均衡，以便每个 job 保持较小且不会过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元通道成对运行，自动回复作为四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片；agentic gateway/plugin 配置则分布在现有的仅源代码 agentic Node job 中，而不是等待构建产物。宽泛浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件兜底项。`Plugin Prerelease` 会在八个插件 worker 之间均衡内置插件测试；这些插件分片 job 最多同时运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，因此导入繁重的插件批次不会创建额外 CI job。宽泛 agents 通道使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片占据尾部耗时。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；boundary guard 分片会在一个 job 内并发运行其小型独立 guard。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，于 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量验证 job，同时避免两个额外 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；其单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行 debug APK 打包 job。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。
自动 CI 并发键带版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项不会无限期阻塞更新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在运行的任务。

## 运行器

| 运行器                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`，快速安全 job 和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`），快速协议/契约/内置检查，分片渠道契约检查，除 lint 之外的 `check` 分片，`check-additional` 分片和聚合，Node 测试聚合验证器，文档检查，Python Skills，workflow-sanity，labeler，auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`，较低权重的插件分片，`checks-fast-core`，`checks-node-compat-node22`，`check-prod-types`，以及 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建中，32-vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
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

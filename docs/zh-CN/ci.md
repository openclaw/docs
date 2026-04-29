---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令对应项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T11:37:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3240aa7058dc4f624c45a400cac7a5b2cbbe442a7e17f3f0e1858cc9a876129
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围限定，在只有无关区域变更时跳过昂贵任务。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并展开完整的常规 CI 图，用于候选发布或广泛验证；对于独立手动运行，Android 轨道通过 `include_android` 选择启用。仅发布用的插件预发布轨道位于单独的 `Plugin Prerelease` 工作流中，并且只从 `Full Release Validation` 或显式手动调度运行。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`，这是一个仅针对生产 Knip 依赖项的检查过程，固定到该脚本使用的最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最小发布年龄限制。它还运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。该保护会在 PR 添加新的未经审查的未使用文件，或在清理后留下过期的 allowlist 条目时失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和软件包桥接表面。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以获取仅发布用的插件/软件包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 以执行安装冒烟、软件包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab 奇偶性、Matrix 和 Telegram 轨道。当提供已发布软件包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的实时/提供商覆盖广度：`minimum` 保留最快的 OpenAI/核心发布关键轨道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。该总括工作流会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重新运行并变为绿色，只重新运行父级验证器作业即可刷新总括结果和时间摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对候选发布使用 `all`，仅对常规完整 CI 子项使用 `ci`，对每个发布子项使用 `release-checks`，或在总括工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在集中修复后将失败发布环境的重新运行限制在边界内。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 将其作为具名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样既保持相同的文件覆盖，又让缓慢的实时提供商失败更容易重新运行和诊断。聚合分片名称 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 对手动一次性重新运行仍然有效。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业只在设置前验证二进制文件。将 Docker 支撑的实时套件保留在常规 Blacksmith runner 上，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支撑的实时模型/后端分片对每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送一次该镜像，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重新构建完整源 Docker 目标，则说明发布运行配置错误，并且会在重复镜像构建上浪费挂钟时间。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定 ref 一次解析为 `release-package-under-test` tarball，然后将该构件传递给实时/E2E 发布路径 Docker 工作流和软件包验收分片。这会让软件包字节在各个发布环境间保持一致，并避免在多个子作业中重新打包同一个候选项。

`Package Acceptance` 是用于验证软件包构件且不阻塞发布工作流的旁路运行工作流。它会从已发布的 npm 规格、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 构件解析一个候选项，将其上传为 `package-under-test`，然后使用该 tarball 复用 Docker 发布/E2E 调度器，而不是重新打包工作流检出内容。配置档覆盖冒烟、软件包、产品、完整和自定义 Docker 轨道选择。`package` 配置档使用离线插件覆盖，因此已发布软件包验证不会受实时 ClawHub 可用性阻塞。可选 Telegram 轨道在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 构件，并保留已发布 npm 规格路径以支持独立调度。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包是否能作为产品工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而软件包验收通过用户在安装或更新后会执行的同一个 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者上传为 `package-under-test` 构件，并在 GitHub 步骤摘要中打印来源、工作流 ref、软件包 ref、版本、SHA-256 和配置档。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该构件，验证 tarball 清单，在需要时准备软件包摘要 Docker 镜像，并针对该软件包运行选定的 Docker 轨道，而不是打包工作流检出内容。当某个配置档选择多个目标 `docker_lanes` 时，可复用工作流会准备一次软件包和共享镜像，然后将这些轨道展开为并行的目标 Docker 作业，并使用唯一构件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并在 Package Acceptance 已解析一个构件时安装同一个 `package-under-test` 构件；独立 Telegram 调度仍然可以安装已发布的 npm 规格。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 轨道失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选项，但应为外部共享构件提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这使当前测试 harness 能够验证较旧的受信任源提交，而无需运行旧工作流逻辑。

配置档映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用软件包验收。发布路径 Docker 分块覆盖重叠的软件包/更新/插件轨道，而软件包验收会针对同一个已解析软件包 tarball 保留构件原生的内置渠道兼容、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装程序和平台行为；软件包/更新产品验证应从软件包验收开始。Windows 已打包和安装程序全新安装轨道还会验证已安装软件包能否从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS 智能体回合冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，从而让安装和 Gateway 网关证明保持快速且确定。专用实时提供商/模型轨道仍覆盖更广泛的模型路由，包括较慢的前沿默认项。

软件包验收为已经发布的软件包设置了有边界的旧版兼容窗口。直到 `2026.4.25` 的软件包，包括 `2026.4.25-beta.*`，可以对 `dist/postinstall-inventory.json` 中指向 tarball 已省略文件的已知私有 QA 条目使用兼容路径；当软件包不暴露该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的假 git 夹具中修剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的已持久化 `update.channel`；插件冒烟测试可以读取旧版安装记录位置，或接受缺少 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 软件包也可以对已经发布的本地构建元数据戳记文件发出警告。之后的软件包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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
`docker_acceptance` 子运行及其 Docker 产物：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段
计时和重新运行命令。优先重新运行失败的包配置文件或
精确的 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能作用域工作流之外有专用 CI 通道。
`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它
构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6
智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可
手动分发；它会将模拟对等门、实时 Matrix 通道以及实时
Telegram 和 Discord 通道作为并行作业展开。实时作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布
检查会使用确定性模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，这样渠道
契约就能与实时模型延迟和正常提供商插件启动隔离。实时传输 Gateway 网关还会
禁用内存搜索，因为 QA 对等性会单独覆盖内存行为；
提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 对计划和发布门使用 `--profile fast`，
仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入保持为
`all`；手动 `matrix_profile=all`
分发始终将完整 Matrix 覆盖分片为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会
在发布审批前运行发布关键的 QA Lab 通道；其 QA 对等门会将候选包和基线包作为并行通道作业运行，然后把
两个产物下载到一个小型报告作业中，用于最终对等比较。
除非变更实际触及 QA 运行时、模型包对等性，或对等工作流负责的表面，
否则不要把 PR 落地路径置于 `Parity gate` 之后。
对于常规渠道、配置、文档或单元测试修复，应将其视为可选
信号，并遵循作用域内的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。
它默认 dry-run，且仅在 `apply=true` 时关闭明确
列出的 PR。在修改 GitHub 之前，它会验证
已落地 PR 已合并，并且每个重复项要么有共同引用的 issue，
要么有重叠的变更块。

`CodeQL` 工作流有意作为窄范围的首轮安全扫描器，
而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码
以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和
Gateway 网关表面。
channel-runtime-boundary 作业会在 `/codeql-critical-security/channel-runtime-boundary`
类别下单独扫描核心渠道实现
契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和
审计接触点，这样渠道安全信号就能在不扩大基线
JS/TS 类别的情况下扩展。

`CodeQL Android Critical Security` 工作流是计划执行的 Android
安全分片。它会在工作流完整性检查接受的最小
Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并将结果
上传到 `/codeql-critical-security/android` 类别下。

`CodeQL macOS Critical Security` 工作流是每周/手动的 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤依赖构建结果，并将结果
上传到 `/codeql-critical-security/macos` 类别下。将它保持在每日
默认工作流之外，因为即使干净通过，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是匹配的非安全分片。它
只在较小的 Blacksmith Linux runner 上，对窄范围高价值表面运行错误严重级别、非安全性的 JavaScript/TypeScript 质量查询。它的
core-auth-secrets 作业会在单独的 `/codeql-critical-quality/core-auth-secrets`
类别下扫描凭证、密钥、沙箱、cron 和 Gateway 网关安全
边界代码。config-boundary
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。
gateway-runtime-boundary 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法
契约。
channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。
agent-runtime-boundary 作业会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、
自动回复分发和队列，以及 ACP 控制平面运行时契约。
mcp-process-runtime-boundary 作业会在单独的
`/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP 服务器和工具桥接、进程
监督辅助函数，以及出站投递契约。
memory-runtime-boundary 作业会在单独的 `/codeql-critical-quality/memory-runtime-boundary`
类别下扫描内存宿主 SDK、内存运行时门面、
内存插件 SDK 别名、内存运行时激活胶水代码，以及内存 Doctor
命令。
ui-control-plane 作业会在单独的
`/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI 启动、本地持久化、Gateway 网关
控制流，以及任务控制平面运行时契约。
web-media-runtime-boundary 作业会在单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 web 抓取/搜索、媒体 IO、媒体
理解、图像生成和媒体生成运行时契约。
plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary`
类别下扫描加载器、注册表、公共表面和插件 SDK
入口点契约。将该工作流与安全分开，这样质量发现就能被
计划执行、度量、禁用或扩展，而不会遮蔽安全信号。
Swift、Python 和内置插件 CodeQL 扩展应仅在窄范围配置文件拥有稳定的
运行时和信号之后，作为有作用域或分片的后续工作重新加入。

`Docs Agent` 工作流是事件驱动的 Codex 维护通道，用于让
现有文档与最近落地的变更保持一致。它没有纯计划任务：
`main` 上成功的非机器人 push CI 运行可以触发它，手动分发也可以
直接运行它。当 `main` 已向前移动，或过去一小时内
已有另一个未跳过的 Docs Agent 运行被创建时，workflow-run 调用会跳过。运行时，它会
审查从上一个未跳过的 Docs Agent 源 SHA 到
当前 `main` 的提交范围，因此一次每小时运行可以覆盖自
上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护通道，
用于处理慢测试。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行
可以触发它，但如果当天 UTC 已有另一个 workflow-run 调用
已经运行或正在运行，它会跳过。手动分发会绕过该每日活动
门。该通道会构建完整套件分组 Vitest 性能报告，让 Codex
只做小型、保持覆盖率的测试性能修复，而不是大范围
重构，然后重新运行完整套件报告，并拒绝会降低
通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复
明显失败，并且 agent 之后的完整套件报告必须通过，
才会提交任何内容。当 `main` 在机器人 push 落地前前进时，该通道会
rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；
存在冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex
action 就能保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI manifest      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和 workflow 审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产 lockfile 审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合                                                | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性检查线，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 带稳定聚合检查结果的分片渠道契约检查                         | Node 相关变更              |
| `checks-node-core-test`          | Core Node 测试分片，排除渠道、内置、契约和插件检查线             | Node 相关变更              |
| `check`                          | 分片主本地 gate 等价检查：生产类型、lint、guard、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 构建后的 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 检查线                                                   | 发布的手动 CI 调度    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | 针对 Python 支撑的 Skills 运行 Ruff + pytest                                                       | Python 技能相关变更      |
| `checks-windows`                 | Windows 专用的进程/路径测试，以及共享运行时导入 specifier 回归测试         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试检查线                                  | macOS 相关变更             |
| `macos-swift`                    | macOS app 的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，加一次 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢测试优化                                    | main CI 成功或手动调度 |

手动 CI 调度会运行与常规 CI 相同的作业图，但会强制开启所有
非 Android 范围的检查线：Linux Node 分片、内置插件分片、渠道
契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档
检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI
调度仅在 `include_android=true` 时运行 Android；完整发布
总括流程会通过传递 `include_android=true` 启用 Android。插件预发布
静态检查、仅发布的 `agentic-plugins` 分片、完整插件
批量扫描，以及插件预发布 Docker 检查线都排除在 CI 之外。Docker
预发布套件仅在 `Full Release Validation` 调度单独的
`Plugin Prerelease` workflow 并启用发布验证 gate 时运行。
手动运行使用唯一的并发组，因此候选发布的完整套件不会被
同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许
受信任调用方针对分支、标签或完整 commit SHA 运行该作业图，同时
使用所选调度 ref 中的 workflow 文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便低成本检查先失败，再运行昂贵检查：

1. `preflight` 决定哪些检查线实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 检查线重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时检查线随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过变更范围检测，并让预检清单表现得像每个作用域区域都已变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源代码变更。
仅 CI 路由编辑、选定的廉价核心测试夹具编辑，以及窄范围插件契约辅助工具/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查和单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或辅助工具表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外守卫矩阵。
Windows Node 检查的作用域限定在 Windows 专用进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关源代码、插件、安装烟测和仅测试变更会留在 Linux Node 通道上，这样它们就不会为正常测试分片已经覆盖的内容占用一个 16-vCPU Windows worker。
单独的 `install-smoke` 工作流会通过自己的 `preflight` job 复用同一个范围脚本。它将烟测覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 烟测 job 覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete 共享工作区 CLI 烟测，运行容器 Gateway 网关网络 e2e，验证一个内置插件构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件，同时分别限制每个场景的 Docker 运行时长。完整路径会保留 QR 包安装以及安装器 Docker/更新覆盖，用于夜间计划运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。`main` 推送（包括合并提交）不会强制运行完整路径；当变更范围逻辑会在推送时请求完整覆盖时，工作流会保留快速 Docker 烟测，并将完整安装烟测留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 烟测由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分发可以选择加入它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖通道的裸 Node/Git 运行器，以及一个会将同一个 tarball 安装到 `/app`、用于正常功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认值为 10 的主池槽位数，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整默认值为 10 的提供商敏感尾池槽位数。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 过度承诺资源，而较轻通道仍会填满可用槽位。单个比有效上限更重的通道仍可从空池启动，然后独占运行直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，发出活跃通道状态，持久化通道耗时以进行最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认在第一次失败后停止调度新的池化通道，每个通道都有一个 120 分钟的回退超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的每通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（如 `install-e2e`）以及拆分的内置更新通道（如 `bundled-channel-update-acpx`），同时跳过清理烟测，以便智能体复现某个失败通道。可复用 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会以每次尝试 180 秒的有界超时重试，这样卡住的 registry/cache 流会快速重试，而不是消耗大部分 CI 关键路径。`Package Acceptance` 工作流是高级包门禁：它会从 npm、可信 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流产物解析候选包，然后将单个 `package-under-test` 产物传给可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，因此当前验收逻辑可以在不检出旧工作流代码的情况下验证较旧的可信提交。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行较小的分块 job，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取它需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`，`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求它时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 分发保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，这样安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块 job，这会将失败通道调试限制在一个定向 Docker job 内，并为该次运行准备、下载或复用包产物；如果选定通道是 live Docker 通道，定向 job 会为该次重跑在本地构建 live-test 镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker 产物并打印组合/每通道定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。计划 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor 修复 pass 可以与其他内置检查一起分片。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名，但发布工作流使用拆分分块，这样渠道烟测、更新目标、插件运行时检查和内置插件安装/卸载扫描可以并行运行。定向 `docker_lanes` 分发也会在一个共享包/镜像准备步骤之后，将多个选定通道拆分成并行 job，并且内置渠道更新通道会对瞬时 npm 网络失败重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界方面比广泛的 CI 平台范围更严格：核心生产代码变更会运行核心 prod 和核心测试类型检查，以及核心 lint/guard；仅核心测试变更只会运行核心测试类型检查以及核心 lint；插件生产代码变更会运行插件 prod 和插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查以及插件 lint。公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫描是显式测试工作。仅发布元数据的版本号变更会运行定向版本/配置/根依赖检查。未知根目录/配置变更会故障安全地进入所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更廉价：直接测试编辑会运行自身，源代码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是其中一个显式映射：对群组可见回复配置、源回复投递模式或消息工具系统提示词的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归，因此共享默认值变更会在第一个 PR 推送之前失败。仅当变更覆盖整个 harness、廉价映射集合不再是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先使用新预热的 box 来做广泛证明。在把慢速门禁花在一个被复用、已过期，或刚刚报告了异常大量同步内容的 box 上之前，先在 box 内运行 `pnpm testbox:sanity`。当所需的根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪文件被删除时，完整性检查会快速失败。这通常意味着远端同步状态不是 PR 的可信副本。请停止该 box 并改为预热一个新的 box，而不是调试产品测试失败。对于有意进行大量删除的 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后的输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护；对于异常大的本地 diff，也可以使用更大的毫秒值。

手动 CI 调度会运行 `checks-node-compat-node22` 作为广泛兼容性覆盖。Android 对独立手动 CI 通过 `include_android=true` 选择启用，并且在 `Full Release Validation` 中始终启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 或明确的操作员调度。普通拉取请求、`main` 推送和独立手动 CI 调度会关闭该套件。

最慢的 Node 测试家族已被拆分或平衡，让每个作业保持较小规模而不超额预留运行器：渠道契约作为三个加权分片运行，小型核心单元车道被配对，自动回复作为四个平衡 worker 运行，并将回复子树拆成 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic gateway/插件配置会分散到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。`Plugin Prerelease` 会在八个扩展 worker 之间平衡内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，这样 import 密集的插件批次就不会创建额外的 CI 作业。广泛的智能体车道使用共享的 Vitest 文件并行调度器，因为它主要受 import/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，避免共享运行时分片承担尾部耗时。包含模式分片使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界守卫分片会在一个作业内并发运行其小型独立守卫。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已构建后于 `build-artifacts` 内并发运行，保留其旧检查名称作为轻量验证作业，同时避免两个额外的 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试车道仍会使用短信/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行 debug APK 打包作业。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已被取代后不会继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务无法无限期阻塞较新的 main 运行。手动全套运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的扩展分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
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

## 相关

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

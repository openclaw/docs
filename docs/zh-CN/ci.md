---
read_when:
    - 你需要了解 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T05:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07839136693d9bfa72da1bb24a2839e0b249882795fa939dbc79a35436572b01
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 和每个拉取请求时运行。它使用智能范围限定，在只有无关区域发生变化时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布版本或广泛验证展开完整的常规 CI 图。仅发布用的插件预发布通道保持关闭，除非 `Full Release Validation` 以 `full_release_validation=true` 调度 CI。

`Full Release Validation` 是“发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，并调度 `OpenClaw Release Checks` 来覆盖安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已发布的包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的实时/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总括工作流会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行附加最慢作业表。如果某个子工作流重新运行后转绿，只需重新运行父验证器作业，以刷新总括结果和耗时摘要。

为了恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对候选发布版本使用 `all`，只重跑常规完整 CI 子项使用 `ci`，重跑每个发布子项使用 `release-checks`，或者在总括工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在进行聚焦修复后，可以把失败的发布环境重跑范围限制住。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但会通过 `scripts/test-live-shard.mjs` 作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分后的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，也让慢速实时提供商失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生实时媒体分片运行在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支撑的实时套件保留在常规 Blacksmith runner 上，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支撑的实时模型/后端分片会为所选提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送该镜像一次，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会带着 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源代码 Docker 目标，则说明发布运行配置有误，并会把墙钟时间浪费在重复镜像构建上。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将所选 ref 一次性解析为 `release-package-under-test` tarball，然后将该工件传给实时/E2E 发布路径 Docker 工作流和包验收分片。这会让发布环境之间的包字节保持一致，并避免在多个子作业中重新打包同一个候选版本。

`Package Acceptance` 是用于验证包工件且不会阻塞发布工作流的旁路运行工作流。它会从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 工件解析一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，以该 tarball 代替重新打包工作流 checkout。Profile 覆盖 smoke、package、product、full 和自定义 Docker 通道选择。`package` profile 使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性阻塞。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，同时保留已发布 npm 规范路径用于独立调度。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否能作为产品正常工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而包验收会通过用户安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` checkout `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行所选 Docker 通道，而不是打包工作流 checkout。当某个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些通道展开为并行目标 Docker 作业，并生成唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 已解析包时安装同一个 `package-under-test` 工件；独立 Telegram 调度仍可安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时让工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/stable 验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选项，但对于外部共享的工件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 可以验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

Profile 映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而 Package Acceptance 保留针对同一个已解析包 tarball 的工件原生内置渠道兼容性、离线插件和 Telegram 证明。跨 OS 发布检查仍覆盖特定 OS 的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新安装通道还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control override。

Package Acceptance 对已经发布的包有有限的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过该持久化子用例；`update-channel-switch` 可以从 tarball 派生的假 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件冒烟可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布出去的本地构建元数据戳文件发出警告。之后的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重跑命令。优先重跑失败的包 profile 或精确 Docker 通道，而不是重跑完整发布验证。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动派发；它会将模拟奇偶校验门、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道展开为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布检查会使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，从而将渠道契约与实时模型延迟和正常提供商插件启动隔离开。实时传输 Gateway 网关还会禁用内存搜索，因为 QA 奇偶校验会单独覆盖内存行为；提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 会对计划任务和发布门使用 `--profile fast`，仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 派发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道；其 QA 奇偶校验门会将候选包和基线包作为并行通道作业运行，然后把两个工件下载到一个小型报告作业中，以执行最终奇偶校验比较。
除非变更确实触及 QA 运行时、模型包奇偶校验，或奇偶校验工作流拥有的表面，否则不要把 PR 落地路径放在 `Parity gate` 后面。对于普通的渠道、配置、文档或单元测试修复，应将其视为可选信号，并遵循范围化 CI/检查证据。

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于落地后的重复项清理。它默认 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在变更 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复项要么共享引用的问题，要么有重叠的变更 hunks。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会在 `/codeql-critical-security/channel-runtime-boundary` 类别下单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计接触点，这样渠道安全信号就能扩展，而无需扩大基线 JS/TS 类别。

`CodeQL Android Critical Security` 工作流是计划运行的 Android 安全分片。它会在工作流完整性检查接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos` 类别下上传结果。保持它在每日默认工作流之外，因为即使干净通过，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是匹配的非安全分片。它只在较小的 Blacksmith Linux runner 上，对窄范围高价值表面运行错误严重级别、非安全 JavaScript/TypeScript 质量查询。它的基线作业扫描与安全工作流相同的凭证、密钥、沙箱、cron 和 Gateway 网关表面。config-boundary 作业在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。gateway-runtime-boundary 作业在单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法契约。channel-runtime-boundary 作业在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。agent-runtime-boundary 作业在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约。ui-control-plane 作业在单独的 `/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI 引导、本地持久化、Gateway 网关控制流和任务控制平面运行时契约。web-media-runtime-boundary 作业在单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心网页抓取/搜索、媒体 IO、媒体理解、图像生成和媒体生成运行时契约。plugin-boundary 作业在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公共表面和插件 SDK 入口点契约。保持该工作流与安全工作流分离，这样质量发现就可以被计划运行、度量、禁用或扩展，而不会掩盖安全信号。Swift、Python 和内置插件的 CodeQL 扩展应只在窄范围配置文件拥有稳定运行时间和信号之后，作为范围化或分片的后续工作加回。

`Docs Agent` 工作流是事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，手动派发也可以直接运行它。当 `main` 已经前移，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护通道，用于慢测试。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动派发会绕过该每日活动门。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只进行小型、保留覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线有失败测试，Codex 只能修复明显失败项，并且 agent 之后的完整套件报告必须通过，才能提交任何内容。当 `main` 在机器人 push 落地前前移时，该通道会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI 清单      | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产 lockfile 审计                             | 始终在非草稿 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合项                                                | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建工件检查，以及可复用下游工件          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-extensions`         | 跨插件套件的完整内置插件测试分片                                   | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关变更              |
| `check`                          | 分片后的主本地门等价项：生产类型、lint、守卫、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面守卫、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 已构建工件渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布的手动 CI 派发    |
| `plugin-prerelease-suite`        | 插件预发布静态检查和 Docker 产品通道的聚合项                       | Full Release Validation CI 子项   |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | Python 支持的 Skills 的 Ruff + pytest                                                       | Python 技能相关变更      |
| `checks-windows`                 | Windows 特定进程/路径测试，以及共享运行时导入说明符回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建工件的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，加一个 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 受信任活动后每日 Codex 慢测试优化                                    | Main CI 成功或手动派发 |

手动 CI 调度运行与普通 CI 相同的作业图，但会强制开启每个范围化检查通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。插件预发布套件会从独立手动 CI 中排除，只有完整发布总控流程通过 `full_release_validation=true` 时才会启用。手动运行使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用方使用所选调度 ref 中的工作流文件，针对分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，让低成本检查先于高成本检查失败：

1. `preflight` 决定哪些检查通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 检查通道重叠运行，使下游消费者能在共享构建就绪后立即开始。
4. 更重的平台和运行时检查通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动调度会跳过 changed-scope 检测，并让预检清单表现得像每个范围化区域都已更改。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台检查通道仍然只限定于平台源码变更。
仅 CI 路由编辑、选定的低成本 core-test fixture 编辑，以及窄范围插件契约辅助/测试路由编辑，会使用快速的仅 Node 清单路径：preflight、security 和单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或辅助表面时，此路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外防护矩阵。
Windows Node 检查限定于 Windows 特定的进程/路径封装、npm/pnpm/UI runner 辅助、包管理器配置，以及执行该检查通道的 CI 工作流表面；无关源码、插件、install-smoke 和仅测试变更仍留在 Linux Node 检查通道上，因此不会为已由常规测试分片覆盖的内容占用 16-vCPU Windows worker。
独立的 `install-smoke` 工作流通过自己的 `preflight` 作业复用同一范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟，运行容器 gateway-network e2e，验证一个内置扩展构建参数，并在 240 秒聚合命令超时内运行有界内置插件 Docker 配置文件，每个场景的 Docker 运行也会分别封顶。完整路径保留 QR 包安装和安装器 Docker/更新覆盖，用于夜间计划运行、手动调度、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request。`main` 推送（包括 merge commit）不会强制完整路径；当 changed-scope 逻辑会在推送上请求完整覆盖时，工作流保留快速 Docker 冒烟，并将完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 调度可以选择加入，但 pull request 和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自聚焦安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖检查通道的裸 Node/Git runner，以及一个将同一 tarball 安装到 `/app` 中、用于常规功能检查通道的功能镜像。Docker 检查通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定的计划。调度器按检查通道使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行检查通道；使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池槽位数 10。重型检查通道上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务检查通道不会过度占用 Docker，而较轻的检查通道仍能填满可用槽位。单个比有效上限更重的检查通道仍可从空池启动，然后独占运行直到释放容量。检查通道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除过时的 OpenClaw E2E 容器，输出活动检查通道状态，持久化检查通道耗时以便最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于调度器检查。默认情况下，它会在首次失败后停止调度新的池化检查通道，每个检查通道都有 120 分钟后备超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 检查通道使用更严格的单检查通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器检查通道，包括仅发布检查通道（如 `install-e2e`）和拆分的内置更新检查通道（如 `bundled-channel-update-acpx`），同时跳过清理冒烟，使智能体可以复现单个失败检查通道。可复用 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像种类、live 镜像、检查通道和凭据覆盖，然后 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的检查通道时，通过 Blacksmith 的 Docker layer cache 构建并推送以包摘要标记的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。`Package Acceptance` 工作流是高级包门禁：它从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前工作流产物解析候选包，然后将该单个 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，使当前验收逻辑能验证较旧的受信任提交，而不必签出旧工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 差异：内置渠道兼容性、离线插件 fixture，以及针对解析出的 tarball 的 Telegram 包 QA。发布路径 Docker 套件运行更小的分块作业，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取所需的镜像种类，并通过同一加权调度器执行多个检查通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且仅对 OpenWebUI-only 调度保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，因此安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 检查通道别名仍是两个提供商安装器检查通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 检查通道，而不是串行的一体式 `bundled-channel-deps` 检查通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含检查通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢检查通道表，以及每检查通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定检查通道，而不是分块作业，这使失败检查通道调试被限定在一个目标 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定检查通道是 live Docker 检查通道，目标作业会为该重跑在本地构建 live-test 镜像。生成的每检查通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败检查通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker 产物并打印组合/每检查通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢检查通道和阶段关键路径摘要。计划 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，使重复的 npm update 和 Doctor 修复流程可以与其他内置检查一起分片。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名，但发布工作流使用拆分分块，使渠道冒烟、更新目标、插件运行时检查以及内置插件安装/卸载扫描可以并行运行。目标 `docker_lanes` 调度也会在一次共享包/镜像准备步骤之后，将多个选定检查通道拆分为并行作业，并且内置渠道更新检查通道会针对临时 npm 网络故障重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界上比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试类型检查，以及核心 lint/守卫；仅核心测试变更只运行核心测试类型检查和核心 lint；插件生产变更会运行插件生产和插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查和插件 lint。公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫描属于显式测试工作。仅发布元数据的版本号变更会运行针对版本、配置和根依赖的检查。未知的根目录/配置变更会故障安全地回退到所有检查通道。
本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且
有意比 `check:changed` 更轻量：直接测试编辑会运行自身，
源代码编辑会优先使用显式映射，然后是同级测试和导入图
依赖项。共享群组房间投递配置是显式映射之一：
对群组可见回复配置、源回复投递模式或
message-tool 系统提示词的更改，会路由到核心回复测试以及 Discord 和
Slack 投递回归测试，这样共享默认值变更会在首次 PR
推送前失败。仅当变更覆盖整个 harness，导致廉价映射集合不能作为可信代理时，
才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先使用新预热的 box 来获取
宽泛证明。在把慢速门禁花在一个被复用、已过期或
刚报告异常大量同步的 box 上之前，先在该
box 内运行 `pnpm testbox:sanity`。当所需根文件（例如
`pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个
已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是
PR 的可信副本。停止该 box 并预热一个新的，而不是调试
产品测试失败。对于有意的大规模删除 PR，请为该完整性检查运行设置
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 分派会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。`plugin-prerelease-suite` 是成本更高的产品/包覆盖，因此只在 `Full Release Validation` 以 `full_release_validation=true` 分派 CI 时运行。普通拉取请求、`main` 推送和独立手动 CI 分派会保持该套件关闭。

最慢的 Node 测试族已拆分或均衡，使每个作业保持较小规模且不过度预留 runner：渠道契约作为三个加权分片运行，内置插件测试在六个插件 worker 间均衡，小型核心单元通道会成对运行，自动回复作为四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置分布在现有仅源码 agentic Node 作业中，而不是等待构建产物。宽泛浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享插件兜底配置。插件分片作业一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，这样导入密集的插件批次不会创建额外 CI 作业。宽泛 agents 通道使用共享 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，避免共享运行时分片承担尾部耗时。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作保持在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分离；boundary guard 分片会在一个作业内并发运行其小型独立守卫。Gateway 网关 watch、渠道测试和核心 support-boundary 分片在 `dist/` 和 `dist-runtime/` 已经构建后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证作业，同时避免两个额外的 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用短信/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复执行 debug APK 打包作业。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个 workflow 已经被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸项无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，且不会取消进行中的运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`，快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`），快速协议/契约/内置检查，分片渠道契约检查，除 lint 外的 `check` 分片，`check-additional` 分片和聚合，Node 测试聚合验证器，文档检查，Python Skills，workflow-sanity，labeler，auto-response；install-smoke preflight 也使用 GitHub 托管 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`，较低权重的插件分片，`checks-fast-core`，`checks-node-compat-node22`，`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`，build-smoke，Linux Node 测试分片，内置插件测试分片，`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍足够敏感，使 8 vCPU 带来的成本高于节省；install-smoke Docker 构建中，32-vCPU 排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
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

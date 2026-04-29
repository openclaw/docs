---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T04:54:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5315d80962cfce8e894fca23fe0eaf74c5d1f30638612b50d329946c7a6b0fb0
    source_path: ci.md
    workflow: 16
---

CI 在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围划分，在只有无关区域发生变更时跳过高成本作业。手动 `workflow_dispatch` 运行会有意绕过智能范围划分，并展开完整的常规 CI 图，用于发布候选版本或广泛验证。

`Full Release Validation` 是用于“发布前运行所有检查”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，并分发 `OpenClaw Release Checks`，用于安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。它也可以在提供已发布包规格时运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的 live/provider 覆盖广度：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。这个总控工作流会记录被分发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重新运行并变为绿色，只需重新运行父级验证器作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，只运行常规完整 CI 子项使用 `ci`，运行每个发布子项使用 `release-checks`，或在总控中使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会让失败的发布箱在针对性修复后保持有界重跑。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，让缓慢的 live 提供商失败更容易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生 live 媒体分片运行在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体作业只在设置前验证这些二进制文件。将基于 Docker 的 live 套件保留在常规 Blacksmith runner 上，因为容器作业并不适合启动嵌套 Docker 测试。

基于 Docker 的 live 模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源 Docker 目标，则发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

`OpenClaw Release Checks` 使用受信任的工作流引用，将选定引用一次性解析为 `release-package-under-test` tarball，然后把该工件传给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以确保不同发布箱之间的包字节一致，并避免在多个子作业中重新打包同一个候选包。

`Package Acceptance` 是用于验证包工件而不阻塞发布工作流的旁路运行工作流。它会从已发布 npm 规格、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 工件解析一个候选包，将其上传为 `package-under-test`，然后使用该 tarball 复用 Docker 发布/E2E 调度器，而不是重新打包工作流 checkout。Profile 覆盖冒烟、包、产品、完整和自定义 Docker 通道选择。`package` profile 使用离线插件覆盖，因此已发布包验证不会受 live ClawHub 可用性约束。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，同时保留已发布 npm 规格路径用于独立分发。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否作为产品正常工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而包验收会通过用户在安装或更新后实际运行的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流 checkout。当某个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些通道展开为并行的目标 Docker 作业，并使用唯一工件。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 已解析出包，则安装同一个 `package-under-test` 工件；独立的 Telegram 分发仍可安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/stable 验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享工件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 可以验证较旧的受信任源提交，而不运行旧的工作流逻辑。

Profile 映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而 Package Acceptance 会针对同一个已解析包 tarball 保留工件原生的内置渠道兼容、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新通道也会验证已安装包可以从原始绝对 Windows 路径导入 browser-control override。

Package Acceptance 对已发布包有有界的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的 fake git fixture 中修剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件冒烟可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已发布的本地构建元数据标记文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重跑命令。优先重跑失败的包 profile 或精确 Docker 通道，而不是重跑完整发布验证。

QA Lab 在主智能范围工作流之外有专用 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动调度时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动调度；它会将模拟 parity gate、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布检查会使用确定性的模拟提供商和符合模拟条件的模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和常规提供商插件启动隔离。实时传输 Gateway 网关还会禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 会对计划任务和发布门禁使用 `--profile fast`，仅在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA Lab 通道；其 QA parity gate 会将候选包和基线包作为并行通道作业运行，然后将两个产物下载到一个小型报告作业中，以进行最终 parity 比较。
除非变更确实触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面，否则不要把 PR 落地路径放在 `Parity gate` 后面。对于普通渠道、配置、文档或单元测试修复，请将它视为可选信号，并改为遵循范围化 CI/检查证据。

`Duplicate PRs After Merge` 工作流是一个用于落地后重复项清理的手动维护者工作流。它默认 dry-run，并且仅在 `apply=true` 时关闭显式列出的 PR。在修改 GitHub 前，它会验证已落地 PR 已合并，并且每个重复项都拥有共享引用的 issue 或重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的一遍式安全扫描器，而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、机密、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会在 `/codeql-critical-security/channel-runtime-boundary` 类别下单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、机密和审计触点，因此渠道安全信号可以在不扩大基线 JS/TS 类别的情况下扩展。

`CodeQL Android Critical Security` 工作流是计划运行的 Android 安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上，为 CodeQL 手动构建 Android 应用，并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos` 类别下上传结果。请将它保留在每日默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对窄范围的高价值表面运行错误级别、非安全 JavaScript/TypeScript 质量查询。其基线作业扫描与安全工作流相同的凭证、机密、沙箱、cron 和 Gateway 网关表面。config-boundary 作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务端方法契约。channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。agent-runtime-boundary 作业会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商调度、自动回复调度与队列，以及 ACP 控制平面运行时契约。ui-control-plane 作业会在单独的 `/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI 启动、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公共表面和插件 SDK 入口点契约。请将该工作流与安全工作流分开，以便质量发现可以被计划、度量、禁用或扩展，而不会遮蔽安全信号。Swift、Python 和内置插件 CodeQL 扩展应仅在窄范围配置文件具备稳定运行时和信号后，作为范围化或分片的后续工作重新添加。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯计划任务：`main` 上成功的非 bot push CI 运行可以触发它，手动调度也可以直接运行它。当 `main` 已前进，或最近一小时内已创建另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累计的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于慢测试。它没有纯计划任务：`main` 上成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动调度会绕过该每日活动门禁。该通道会构建全套分组 Vitest 性能报告，让 Codex 只进行小型、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行全套报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 after-agent 全套报告必须通过后才能提交任何内容。当 `main` 在 bot push 落地前前进时，该通道会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试 push；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI manifest      | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产 lockfile 审计                             | 始终在非草稿 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-extensions`         | 覆盖插件套件的完整内置插件测试分片                                   | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关变更              |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和 startup-memory smoke                                               | Node 相关变更              |
| `checks`                         | 已构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布的手动 CI 调度    |
| `plugin-prerelease-suite`        | 插件预发布静态检查和 Docker 产品通道的聚合作业                       | 发布的手动 CI 调度    |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | Python 支持的 Skills 的 Ruff + pytest                                                       | Python-skill 相关变更      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时 import specifier 回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢测试优化                                    | Main CI 成功或手动调度 |

手动 CI 调度会运行与常规 CI 相同的作业图，但会强制开启每个范围化通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、插件预发布覆盖、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行使用唯一的并发组，因此 release-candidate 全套不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方在使用所选调度 ref 的工作流文件时，针对分支、tag 或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Fail-fast 顺序

任务的排序会让低成本检查先失败，避免昂贵任务继续运行：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该任务中的步骤，而不是独立任务。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的制品和平台矩阵任务。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，这样共享构建就绪后，下游使用方可以立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过变更范围检测，并让预检清单表现为每个受范围控制的区域都已变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint 检查，但不会仅凭自身强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源码变更启用。
仅 CI 路由的编辑、选定的低成本核心测试夹具编辑，以及范围很窄的插件契约辅助代码/测试路由编辑，会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于快速任务会直接执行的路由或辅助代码表面时，该路径会避开构建制品、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的防护矩阵。
Windows Node 检查的范围限定为 Windows 专用的进程/路径封装、npm/pnpm/UI 运行器辅助代码、包管理器配置，以及执行该通道的 CI 工作流表面；无关源码、插件、安装冒烟和仅测试变更会留在 Linux Node 通道上，因此不会为已经由常规测试分片覆盖的内容预留 16-vCPU Windows 工作器。
独立的 `install-smoke` 工作流会通过自己的 `preflight` 任务复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟任务会执行的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会预留 Docker 工作器。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行智能体删除共享工作区 CLI 冒烟，运行容器 Gateway 网关网络端到端测试，验证内置扩展构建参数，并在 240 秒聚合命令超时下运行有边界的内置插件 Docker 配置文件，同时分别限制每个场景的 Docker 运行时间。完整路径会保留 QR 包安装和安装器 Docker/更新覆盖，用于夜间计划运行、手动触发、工作流调用发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。`main` 推送（包括合并提交）不会强制完整路径；当变更范围逻辑会要求在推送中执行完整覆盖时，工作流会保留快速 Docker 冒烟，并将完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装图像提供商冒烟由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 触发可以选择加入，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖通道的裸 Node/Git 运行器，以及一个会把同一个 tarball 安装到 `/app` 中供常规功能通道使用的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选中的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 按通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，并使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾部池槽位数 10。重型通道上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm 安装和多服务通道不会让 Docker 过载，而较轻的通道仍能填满可用槽位。单个比有效上限更重的通道仍可从空池启动，然后独占运行直到释放容量。默认情况下，通道启动会错开 2 秒，以避免本地 Docker 守护进程出现创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw 端到端容器，输出活动通道状态，持久化通道耗时以用于最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有 120 分钟兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的实时/尾部通道使用更严格的逐通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（如 `install-e2e`）以及拆分后的内置更新通道（如 `bundled-channel-update-acpx`），同时跳过清理冒烟，以便智能体复现单个失败通道。可复用的实时/端到端工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、实时镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包制品，或从 `package_artifact_run_id` 下载包制品；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带有包摘要标签的裸/功能 GHCR Docker 端到端镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有的包摘要镜像，而不是重新构建。`Package Acceptance` 工作流是高级包门禁：它会从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前的工作流制品解析候选包，然后将单个 `package-under-test` 制品传入可复用的 Docker 端到端工作流。它将 `workflow_ref` 与 `package_ref` 分开，使当前验收逻辑能够验证较旧的可信提交，而不必检出旧的工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行更小的分块任务，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，让每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-services`，并且仅在只针对 OpenWebUI 的触发中保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分后的分块，因此安装器端到端以及内置插件安装/卸载扫查不会主导关键路径。`install-e2e` 通道别名仍然是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表格，以及逐通道重跑命令。工作流 `docker_lanes` 输入会针对已准备的镜像运行选定通道，而不是运行分块任务，这会将失败通道调试限制在一个定向 Docker 任务内，并为该次运行准备、下载或复用包制品；如果选定通道是实时 Docker 通道，定向任务会为该次重跑在本地构建实时测试镜像。生成的逐通道 GitHub 重跑命令会在存在这些值时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备的镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker 制品，并打印组合式/逐通道定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。计划运行的实时/端到端工作流每天运行完整发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm 更新和 Doctor 修复步骤可以与其他内置检查一起分片运行。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍是聚合插件/运行时别名，但发布工作流使用拆分后的分块，以便渠道冒烟、更新目标、插件运行时检查，以及内置插件安装/卸载扫查可以并行运行。定向 `docker_lanes` 触发也会在一个共享包/镜像准备步骤之后，将多个选定通道拆分为并行任务，并且内置渠道更新通道会针对临时 npm 网络故障重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产代码和核心测试的类型检查，以及核心 lint/guard；仅核心测试变更只运行核心测试类型检查和核心 lint；扩展生产代码变更会运行扩展生产代码和扩展测试类型检查，以及扩展 lint；仅扩展测试变更会运行扩展测试类型检查和扩展 lint。公开插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展扫描属于显式测试工作。仅发布元数据的版本号提升会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会以故障安全方式进入所有检查 lane。
本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是其中一个显式映射：对群组可见回复配置、源码回复投递模式或 message-tool 系统提示词的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，因此共享默认值变更会在第一次 PR 推送前失败。仅当变更的 harness 范围足够广，以至于这个轻量映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并且宽泛证明优先使用全新预热的 box。在复用、过期或刚报告异常大同步量的 box 上花时间跑慢门禁之前，先在 box 内运行 `pnpm testbox:sanity`。当必需的根目录文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。应停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 分发会运行 `checks-node-compat-node22` 和 `plugin-prerelease-suite`，作为候选发布版本兼容性覆盖。普通拉取请求和 `main` 推送会跳过这些 lane，并让矩阵聚焦于 Node 24 测试/渠道 lane。

最慢的 Node 测试家族会被拆分或均衡，以便每个作业保持较小规模而不过度预留 runner：渠道契约作为三个加权分片运行，内置插件测试在六个扩展 worker 之间均衡，小型核心单元 lane 成对运行，auto-reply 作为四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置则分布在现有仅源码 agentic Node 作业中，而不是等待构建产物。宽泛浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件总括配置。扩展分片作业一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，因此导入量大的插件批次不会创建额外 CI 作业。宽泛 agents lane 使用共享 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片承担尾部耗时。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将 package-boundary 编译/canary 工作放在一起，并将 runtime topology architecture 与 Gateway 网关 watch 覆盖分开；boundary guard 分片会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建后，于 `build-artifacts` 内并发运行，保留其旧检查名称作为轻量验证作业，同时避免两个额外 Blacksmith worker 和第二个 artifact-consumer 队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复打包 debug APK。
当同一 PR 或 `main` ref 上有较新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。
自动 CI 并发 key 带有版本（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸作业无法无限期阻塞更新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在运行的任务。

## Runners

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的扩展分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，8 vCPU 的成本高于节省的收益；install-smoke Docker 构建，其中 32-vCPU 队列时间成本高于节省的收益                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

---
read_when:
    - 你需要了解 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T04:29:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80e4eb0d3713a353a9b5e3d75a7c94435587d66ac45aad5d906bf6700ddd57fc
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围界定，在只有无关区域发生变更时跳过昂贵任务。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并为候选发布或广泛验证展开完整的常规 CI 图。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标派发手动 `CI` 工作流，并派发 `OpenClaw Release Checks`，用于安装冒烟测试、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。当提供已发布的包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的 live/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的 advisory 提供商/媒体矩阵。总控工作流会记录已派发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重新运行并变为绿色，只需重新运行父验证器作业，即可刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。候选发布使用 `all`，仅常规完整 CI 子项使用 `ci`，所有发布子项使用 `release-checks`，或者在总控工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在聚焦修复后，将失败发布环境的重新运行限定在有界范围内。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖率，但它通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖范围的同时，让缓慢的 live 提供商失败更容易重新运行和诊断。聚合分片名称 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 仍然可用于手动一次性重新运行。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装了 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支撑的 live 套件保留在常规 Blacksmith runner 上，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支撑的 live 模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重新构建完整源 Docker 目标，则发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定 ref 解析一次为 `release-package-under-test` tarball，然后将该工件传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以让包字节在各个发布环境之间保持一致，并避免在多个子作业中重新打包同一个候选版本。

`Package Acceptance` 是用于验证包工件且不阻塞发布工作流的旁路运行工作流。它会从已发布的 npm 规格、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 工件中解析一个候选版本，将其上传为 `package-under-test`，然后使用该 tarball 复用 Docker 发布/E2E 调度器，而不是重新打包工作流检出内容。配置文件覆盖 smoke、package、product、full 和 custom Docker 通道选择。`package` 配置文件使用离线插件覆盖，因此已发布包验证不会受 live ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，同时保留已发布 npm 规格路径以供独立派发。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收通过用户安装或更新后使用的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选版本，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当某个配置文件选择多个定向 `docker_lanes` 时，可复用工作流会准备一次包和共享镜像，然后将这些通道展开为并行定向 Docker 作业，并生成唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 解析了一个包，它会安装相同的 `package-under-test` 工件；独立 Telegram 派发仍然可以安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布 beta/stable 验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享工件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这允许当前测试 harness 验证较旧的受信任源提交，而不运行旧工作流逻辑。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而 Package Acceptance 会基于同一个已解析包 tarball 保留工件原生的内置渠道兼容性、离线插件和 Telegram 证明。Cross-OS 发布检查仍然覆盖特定操作系统的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows packaged 和 installer fresh 通道还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control override。

Package Acceptance 对已发布包设有有界的旧版兼容性窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未公开 `gateway install --wrapper` 标志时，`doctor-switch` 可跳过持久化子用例；`update-channel-switch` 可从 tarball 派生的假 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可记录缺失的持久化 `update.channel`；插件冒烟测试可读取旧版 install-record 位置，或接受缺失的 marketplace install-record 持久化；`plugin-update` 可允许配置元数据迁移，同时仍然要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或精确 Docker 通道，而不是重新运行完整发布验证。

QA Lab 有专用的 CI 通道，位于主智能作用域工作流之外。`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动派发；它会将模拟一致性门禁、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道展开为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布检查会使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，从而将渠道契约与实时模型延迟和正常提供商插件启动隔离开。实时传输 Gateway 网关还会禁用内存搜索，因为 QA 一致性会单独覆盖内存行为；提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 会为计划任务和发布门禁使用 `--profile fast`，只有在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 派发始终会将完整 Matrix 覆盖分片到 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 还会在发布审批前运行发布关键的 QA Lab 通道；其 QA 一致性门禁会将候选包和基线包作为并行通道作业运行，然后把两个产物下载到一个小型报告作业中，用于最终一致性比较。
除非变更确实触及 QA 运行时、模型包一致性，或一致性工作流所拥有的表面，否则不要把 PR 落地路径挡在 `Parity gate` 后面。对于常规渠道、配置、文档或单元测试修复，将其视为可选信号，并遵循作用域内的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。它默认 dry-run，并且只有在 `apply=true` 时才会关闭显式列出的 PR。在变更 GitHub 之前，它会验证已落地 PR 已合并，并且每个重复 PR 要么有共享的引用 issue，要么有重叠的变更 hunk。

`CodeQL` 工作流有意设计为范围较窄的第一遍安全扫描器，而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码，以及最高风险的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会在 `/codeql-critical-security/channel-runtime-boundary` 类别下单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，这样渠道安全信号无需扩大基线 JS/TS 类别也能扩展。

`CodeQL Android Critical Security` 工作流是计划运行的 Android 安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos` 类别下上传结果。将它保持在每日默认工作流之外，因为即使干净通过，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只会在较小的 Blacksmith Linux runner 上，对范围狭窄但高价值的表面运行错误严重性、非安全 JavaScript/TypeScript 质量查询。它的基线作业会扫描与安全工作流相同的凭证、密钥、沙箱、cron 和 Gateway 网关表面。config-boundary 作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法契约。channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。agent-runtime-boundary 作业会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约。ui-control-plane 作业会在单独的 `/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公共表面和插件 SDK 入口点契约。将该工作流与安全分开，以便质量发现可以在不遮蔽安全信号的情况下进行计划、度量、禁用或扩展。Swift、Python 和内置插件的 CodeQL 扩展只应在这些窄 profile 具备稳定运行时间和信号之后，作为有作用域或分片的后续工作加回。

`Docs Agent` 工作流是事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，手动派发也可以直接运行它。当 `main` 已继续前移，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审阅从上一个未跳过的 Docs Agent 来源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档检查以来累积的所有 main 变更。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护通道，用于慢测试。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，但如果另一个 workflow-run 调用已在该 UTC 日运行或正在运行，它会跳过。手动派发会绕过该每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做小型、保留覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线有失败测试，Codex 只能修复明显失败，并且 agent 后的完整套件报告必须通过，才会提交任何内容。当 `main` 在机器人 push 落地前推进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的过期补丁会跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更作用域、变更插件，并构建 CI manifest                                     | 始终在非草稿 push 和 PR 上运行     |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 始终在非草稿 push 和 PR 上运行     |
| `security-dependency-audit`      | 针对 npm advisory 执行无依赖生产 lockfile 审计                                                | 始终在非草稿 push 和 PR 上运行     |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                     | 始终在非草稿 push 和 PR 上运行     |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查和可复用下游产物                                       | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                            | Node 相关变更                      |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | Node 相关变更                      |
| `checks-node-extensions`         | 覆盖插件套件的完整内置插件测试分片                                                           | Node 相关变更                      |
| `checks-node-core-test`          | 核心 Node 测试分片，排除渠道、内置、契约和插件通道                                           | Node 相关变更                      |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke                          | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面 guard、package-boundary 和 gateway-watch 分片                            | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | Node 相关变更                      |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                              | 发布的手动 CI 派发                 |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                                  | 文档已变更                         |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                 | Python Skill 相关变更              |
| `checks-windows`                 | Windows 特定进程/路径测试，以及共享运行时 import specifier 回归                              | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                     | Android 相关变更                   |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢测试优化                                                         | Main CI 成功或手动派发             |

手动 CI 派发会运行与正常 CI 相同的作业图，但会强制开启每个有作用域通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行会使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方使用所选派发 ref 中的工作流文件，针对分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的排序方式让低成本检查先失败，避免运行高成本检查：

1. `preflight` 决定到底存在哪些 lane。`docs-scope` 和 `changed-scope` 逻辑是此 job 内的步骤，而不是独立 job。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的 artifact 和平台矩阵 job。
3. `build-artifacts` 会与快速 Linux lane 重叠执行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时 lane 随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动 dispatch 会跳过 changed-scope 检测，并让 preflight manifest
表现得像每个限定范围都发生了变化。
CI workflow 编辑会验证 Node CI 图和 workflow linting，但不会单独强制 Windows、Android 或 macOS 原生构建；这些平台 lane 仍然仅限于平台源代码变更。
仅 CI 路由的编辑、选定的低成本 core-test fixture 编辑，以及窄范围的插件契约 helper/test-routing 编辑会使用一个快速的仅 Node manifest 路径：preflight、security 和单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或 helper 表面时，此路径会避开 build artifacts、Node 22 兼容性、渠道契约、完整 core shard、内置插件 shard 和额外 guard 矩阵。
Windows Node 检查仅限于 Windows 专用的 process/path wrapper、npm/pnpm/UI runner helper、package manager 配置，以及执行该 lane 的 CI workflow 表面；无关的源代码、插件、install-smoke 和仅测试变更会留在 Linux Node lane 上，因此不会为常规测试 shard 已经覆盖的内容占用一个 16-vCPU Windows worker。
独立的 `install-smoke` workflow 会通过自己的 `preflight` job 复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/package 表面、内置插件 package/manifest 变更，以及 Docker smoke job 覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展 build arg，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，同时每个场景的 Docker run 也会单独设置上限。完整路径会保留 QR package install 和 installer Docker/update 覆盖，用于夜间 scheduled run、手动 dispatch、workflow-call release check，以及真正触及 installer/package/Docker 表面的 pull request。`main` push（包括 merge commit）不会强制完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，workflow 会保留快速 Docker smoke，并将完整 install smoke 留给夜间或 release validation。较慢的 Bun global install image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划和 release checks workflow 中运行，手动 `install-smoke` dispatch 可以选择加入它，但 pull request 和 `main` push 不会运行它。QR 和 installer Docker 测试会保留各自聚焦安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于 installer/update/plugin-dependency lane 的裸 Node/Git runner，以及一个将同一个 tarball 安装到 `/app` 中、用于普通功能 lane 的功能性镜像。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只会执行选定计划。调度器会使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane；可用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool slot 数 10，并用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider-sensitive tail-pool slot 数 10。重型 lane 上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，因此 npm install 和多服务 lane 不会过度占用 Docker，而较轻的 lane 仍能填满可用 slot。单个比有效上限更重的 lane 仍可从空池启动，然后会独占运行，直到释放容量。默认会让 lane 启动错开 2 秒，以避免本地 Docker daemon 的 create 风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，发出 active-lane 状态，持久化 lane timing 以便 longest-first 排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于调度器检查。默认情况下，它会在第一次失败后停止调度新的 pooled lane，并且每个 lane 都有一个 120 分钟的 fallback 超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail lane 使用更严格的每 lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器 lane，包括 `install-e2e` 这类仅 release lane，以及 `bundled-channel-update-acpx` 这类拆分的内置 update lane，同时跳过 cleanup smoke，以便 agent 能复现单个失败 lane。可复用的 live/E2E workflow 会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪种 package、image kind、live image、lane 和 credential 覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub outputs 和 summaries。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的 package artifact，或从 `package_artifact_run_id` 下载 package artifact；验证 tarball inventory；当计划需要 package-installed lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package digest tag 的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有 package-digest 镜像，而不是重新构建。`Package Acceptance` workflow 是高级 package gate：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的 workflow artifact 解析候选项，然后将该单个 `package-under-test` artifact 传入可复用 Docker E2E workflow。它会将 `workflow_ref` 与 `package_ref` 分开，因此当前 acceptance 逻辑可以在不 checkout 旧 workflow code 的情况下验证较旧的受信任 commit。Release check 会针对目标 ref 运行自定义 Package Acceptance delta：内置渠道兼容性、离线插件 fixture，以及基于解析 tarball 的 Telegram package QA。Release-path Docker suite 会运行更小的分块 job，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个 chunk 只拉取它需要的 image kind，并通过同一个加权调度器执行多个 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，它会被并入 `plugins-runtime-services`，并且仅为 OpenWebUI-only dispatch 保留独立的 `openwebui` chunk。旧版聚合 chunk 名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但 release workflow 使用拆分 chunk，这样 installer E2E 和内置插件 install/uninstall sweep 就不会主导关键路径。`install-e2e` lane alias 仍然是两个 provider installer lane 的聚合手动重跑 alias。`bundled-channels` chunk 会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行的 all-in-one `bundled-channel-deps` lane。每个 chunk 都会上传 `.artifacts/docker-tests/`，其中包含 lane log、timing、`summary.json`、`failures.json`、phase timing、scheduler plan JSON、slow-lane table 和每 lane rerun 命令。workflow `docker_lanes` 输入会针对准备好的镜像运行选定 lane，而不是运行 chunk job，这会将失败 lane 调试限制在一个目标 Docker job 中，并为该运行准备、下载或复用 package artifact；如果选定 lane 是 live Docker lane，则目标 job 会为该重跑在本地构建 live-test 镜像。生成的每 lane GitHub rerun 命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的 image 输入，因此失败的 lane 可以复用失败运行中的确切 package 和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub run 下载 Docker artifact 并打印组合/每 lane 的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 获取 slow-lane 和 phase critical-path 摘要。scheduled live/E2E workflow 每天运行完整的 release-path Docker suite。内置 update 矩阵按 update target 拆分，因此重复的 npm update 和 doctor repair pass 可以与其他内置检查一起分片。

当前 release Docker chunk 是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` chunk 仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合 plugin/runtime alias，但 release workflow 使用拆分 chunk，这样渠道 smoke、update target、插件运行时检查和内置插件 install/uninstall sweep 可以并行运行。目标 `docker_lanes` dispatch 也会在一次共享 package/image preparation 步骤后，将多个选定 lane 拆分为并行 job，并且内置渠道 update lane 会针对临时 npm 网络失败重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产代码和核心测试类型检查，以及核心 lint/guard；仅核心测试变更只运行核心测试类型检查和核心 lint；插件生产代码变更会运行插件生产代码和插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查和插件 lint。公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫描属于显式测试工作。仅发布元数据的版本号提升会运行有针对性的版本/配置/根依赖检查。未知根目录/配置变更会以故障安全方式进入所有检查通道。
本地 changed-test 路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，源代码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享 group-room 投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或 message-tool 系统提示词的更改，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，因此共享默认值变更会在第一次 PR 推送前失败。仅当变更覆盖整个 harness，以至于廉价映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并且对于宽范围证明优先使用新预热的 box。在对一个被复用、已过期或刚报告异常大同步量的 box 花费慢门禁之前，先在 box 内运行 `pnpm testbox:sanity`。当所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。停止那个 box，并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该完整性检查运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 调度会运行 `checks-node-compat-node22`，作为候选发布版本兼容性覆盖。普通拉取请求和 `main` 推送会跳过该通道，并让矩阵聚焦于 Node 24 测试/渠道通道。

最慢的 Node 测试族会被拆分或平衡，使每个作业保持较小规模，同时不过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个插件 worker 之间平衡，小型核心单元通道会配对运行，auto-reply 以四个均衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic gateway/plugin 配置会分散到现有的仅源代码 agentic Node 作业中，而不是等待构建产物。宽范围浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件兜底配置。插件分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node heap，因此导入密集的插件批次不会创建额外 CI 作业。宽范围 agents 通道使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片承担尾部耗时。Include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作保持在一起，并将 runtime 拓扑架构与 Gateway 网关 watch 覆盖分离；boundary guard 分片会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 与 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证作业，同时避免两个额外的 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复打包 debug APK。
当同一个 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。
自动 CI concurrency key 带版本（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸项无法无限期阻塞较新的 main 运行。手动 full-suite 运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 带来的成本高于节省；install-smoke Docker 构建，其中 32-vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

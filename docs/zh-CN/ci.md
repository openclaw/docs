---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T04:20:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af62bfd9f035069f6e6fecd9b0d5b85cee6322d75dd7ed7f18a7567e3bccf43
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域控制，在只有无关区域发生变更时跳过高开销作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能作用域控制，并展开完整的常规 CI 作业图，用于候选发布或大范围验证。

`Full Release Validation` 是“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks`，用于安装冒烟测试、软件包验收、Docker 发布路径测试套件、实时 / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。提供已发布的软件包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是用于验证软件包构件的旁路工作流，不会阻塞发布工作流。它会从已发布的 npm 规格、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 构件中解析出一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，针对该 tarball 运行，而不是重新打包工作流检出的内容。配置档覆盖冒烟、软件包、产品、完整和自定义 Docker 通道选择。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 构件，而已发布的 npm 规格路径则保留给独立触发使用。

## Package Acceptance

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，请使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证源码树，而软件包验收则通过用户在安装或更新后会实际使用的同一套 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、软件包 ref、版本、SHA-256 和配置档。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。该可复用工作流会下载该构件、验证 tarball 清单、在需要时准备 package-digest Docker 镜像，并针对该软件包运行所选 Docker 通道，而不是打包工作流检出的内容。
3. `package_telegram` 会按需调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时运行；如果 Package Acceptance 已解析出一个软件包，它会安装同一个 `package-under-test` 构件；独立的 Telegram 触发仍然可以安装已发布的 npm 规格。
4. `summary` 会在软件包解析、Docker 验收或可选的 Telegram 通道失败时使工作流失败。

候选项来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 的验收。
- `source=ref`：打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享构件应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流 / harness 代码。`package_ref` 是在 `source=ref` 时被打包的源码提交。这样，当前测试 harness 就可以验证较旧的可信源码提交，而无需运行旧的工作流逻辑。

配置档与 Docker 覆盖范围的对应关系：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`install-e2e`、`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps`、`plugins`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分片
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必须提供

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 来调用 Package Acceptance。该配置档是大多数 Parallels 软件包 / 更新验证的 GitHub 原生替代方案，其中 Telegram 会通过 QA 实时传输来验证同一个软件包构件。跨操作系统发布检查仍然覆盖特定于操作系统的新手引导、安装器和平台行为；软件包 / 更新产品验证应首先从 Package Acceptance 开始。

示例：

```bash
# 验证当前 beta 软件包，并使用产品级覆盖范围。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用当前 harness 打包并验证一个发布分支。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 验证一个 tarball URL。对于 source=url，SHA-256 是必填项。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 复用另一个 Actions 运行上传的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

在调试失败的软件包验收运行时，先从 `resolve_package` 摘要开始，确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时以及重新运行命令。优先重新运行失败的软件包配置档或精确的 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能作用域工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic 软件包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会并行展开模拟一致性门禁、实时 Matrix 通道和实时 Telegram 通道。实时作业使用 `qa-live-shared` environment，Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布审批前运行同样的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后进行重复项清理的手动工作流。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已被合并，并验证每个重复 PR 要么共享同一个被引用的问题，要么存在重叠的变更块。

`Docs Agent` 工作流是一个由事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。workflow-run 调用会在 `main` 已继续前进，或过去一小时内已经创建过另一次未跳过的 Docs Agent 运行时被跳过。运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行即可覆盖自上次文档处理以来累计的所有 `main` 变更。

`Test Performance Agent` 工作流是一个由事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一次 workflow-run 调用运行过或正在运行，它会跳过。手动触发会绕过这个每日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率不变的测试性能修复，而不是做大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显失败的问题，并且 agent 处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 能与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅文档变更、变更的作用域、变更的扩展，并构建 CI 清单 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产 lockfile 审计 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非 draft 的 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游构件 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled / plugin-contract / protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `check` | 分片的主本地门禁等效项：生产类型、lint、保护规则、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面保护、软件包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建构件渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟通道 | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式、lint 和损坏链接检查 | 文档发生变更时 |
| `skills-python` | 针对 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试通道 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建构件的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个变体的 Android 单元测试，加上一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后，由 Codex 执行每日慢测试优化 | `main` CI 成功后或手动触发 |

手动 CI 触发会运行与常规 CI 相同的作业图，但会强制开启所有受作用域控制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此某个候选发布的完整测试套件不会因为同一 ref 上的另一次 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方在使用所选触发 ref 的工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的顺序经过设计，以便让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的构建构件和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者就能在共享构建准备好后立即开始。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得像所有受作用域控制的区域都发生了变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源码变更生效。

仅涉及 CI 路由的编辑、选定的低成本核心测试夹具编辑，以及范围很窄的插件契约辅助工具 / 测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务可直接覆盖的路由或辅助工具表面时，这一路径会跳过构建构件、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的保护矩阵。

Windows Node 检查的作用域仅限于 Windows 特定的进程 / 路径包装器、npm / pnpm / UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、安装冒烟和仅测试变更仍会留在 Linux Node 通道中，因此不会为了已由常规测试分片覆盖的内容而占用 16 vCPU 的 Windows worker。

单独的 `install-smoke` 工作流通过其自身的 `preflight` 作业复用同一个作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，快速路径会覆盖 Docker / 软件包表面、内置插件的软件包 / manifest 变更，以及 Docker 冒烟作业会实际覆盖到的核心插件 / 渠道 / Gateway 网关 / 插件 SDK 表面。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行 agents delete shared-workspace CLI 冒烟、运行容器化 gateway-network e2e、验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行有边界的内置插件 Docker 配置档，同时每个场景的 Docker 运行也分别受限。完整路径会为夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及安装器 / 软件包 / Docker 表面的拉取请求保留 QR 软件包安装和安装器 Docker / 更新覆盖。推送到 `main`（包括合并提交）不会强制走完整路径；当 changed-scope 逻辑在 push 上本会请求完整覆盖时，该工作流仍只保留快速 Docker 冒烟，而将完整安装冒烟留给夜间运行或发布验证。

较慢的 Bun 全局安装 image-provider 冒烟由单独的 `run_bun_global_install_smoke` 控制；它会在夜间计划任务中运行，也会从发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和推送到 `main` 不会运行它。QR 和安装器 Docker 测试保留各自专注于安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于安装器 / 更新 / 插件依赖通道的纯 Node / Git 运行器，另一个是功能镜像，会将同一个 tarball 安装到 `/app` 中，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而运行器只执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行这些通道；可使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，并使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池槽位数 10。重型通道上限默认值为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm install 和多服务通道过度占用 Docker，同时较轻的通道仍可填满可用槽位。单个比有效上限更重的通道仍可在空池中启动，然后在释放容量前单独运行。默认情况下，通道启动会错开 2 秒，以避免本地 Docker daemon 出现集中创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会预检 Docker、移除过期的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以支持按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以检查调度器。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的实时 / 尾部通道会使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅用于发布的通道，如 `install-e2e`，以及拆分后的内置更新通道，如 `bundled-channel-update-acpx`，同时跳过 cleanup 冒烟，以便智能体复现某个失败通道。可复用的实时 / E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json`，以确定需要哪种软件包、镜像类型、实时镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载调用方提供的软件包构件，验证 tarball 清单，在计划需要已安装软件包的通道时构建并推送以 package-digest 标记的 bare / functional GHCR Docker E2E 镜像，并在同一个软件包摘要已准备好时复用这些镜像。

`Package Acceptance` 工作流是高层的软件包门禁：它会从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流的构件中解析出一个候选项，然后将该单一的 `package-under-test` 构件传入可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，以便当前的验收逻辑可以验证较旧的可信提交，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行 `package` 验收配置档；该配置档覆盖软件包 / 更新 / 插件契约，并且是大多数 Parallels 软件包 / 更新覆盖的默认 GitHub 原生替代方案。发布路径 Docker 套件最多以三个分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON，以及每个通道的重运行命令。工作流的 `docker_lanes` 输入会让选定通道针对已准备好的镜像运行，而不是运行三个分块作业，这样失败通道的调试就能限制在一个有针对性的 Docker 作业中，并为该次运行准备或下载软件包构件；如果所选通道是实时 Docker 通道，该定向作业会在本地为该次重运行构建实时测试镜像。使用 `pnpm test:docker:rerun <run-id>` 可从某个 GitHub 运行中下载 Docker 构件，并打印组合 / 单通道的定向重运行命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。当发布路径套件请求 Open WebUI 时，它会在 plugins / integrations 分块中运行，而不是额外占用第四个 Docker worker；只有在仅触发 openwebui 时，Open WebUI 才保留独立作业。定时的实时 / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor 修复过程能够与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门禁比宽泛的 CI 平台作用域对架构边界更严格：核心生产变更会运行核心生产和核心测试 typecheck，以及核心 lint / guards；核心仅测试变更只运行核心测试 typecheck 和核心 lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展仅测试变更会运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或 plugin-contract 变更会扩展到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展全量测试仍然是显式测试工作。仅发布元数据的版本升级会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式回退到所有检查通道。

手动触发的 CI 会运行 `checks-node-compat-node22`，作为候选发布兼容性覆盖。普通拉取请求和推送到 `main` 会跳过该通道，并让矩阵专注于 Node 24 测试 / 渠道通道。

最慢的 Node 测试族已被拆分或平衡，因此每个作业都能保持较小规模，而不会过度占用 runner：渠道契约作为三个加权分片运行，内置插件测试在六个扩展 worker 上均衡分布，小型核心单元通道成对组合，自动回复以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch，以及 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分布在现有的仅源码 agentic Node 作业中，而不是等待已构建构件。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组只用一个 Vitest worker，并分配更大的 Node 堆内存，以避免导入密集型插件批次创建额外的 CI 作业。宽范围的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度限制，而不是被某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以免共享运行时分片成为最后的拖尾。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 能区分整套配置与经过筛选的分片。`check-additional` 会将软件包边界编译 / canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；边界保护分片会在一个作业内部并发运行其较小、彼此独立的保护检查。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `build-artifacts` 中于 `dist/` 和 `dist-runtime/` 已构建完成后并发运行，在保留原有检查名称作为轻量级验证器作业的同时，避免额外两个 Blacksmith worker 以及第二条构件消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方变体没有单独的源码集或 manifest；它的单元测试通道仍会使用 SMS / call-log `BuildConfig` 标志编译该变体，同时避免在每次与 Android 相关的 push 上重复进行 debug APK 打包作业。

当同一 PR 或 `main` ref 上有较新的 push 到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被取代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞更新后的 `main` 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行中的运行。

## Runner 运行器

| Runner 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵能够更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省的成本；install-smoke Docker 构建，在这里 32 vCPU 的排队时间成本高于节省的成本 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道运行变更相关的 typecheck / lint / guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同一套门禁，但带有各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 损坏链接
pnpm build          # 当 CI 构件 / build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 对比最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢的作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

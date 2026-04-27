---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T06:15:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e43a844ae0c9aba4a37270ce1eebdd10feaad5a4f6d9670b604113e8df5d3649
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围界定，在仅有不相关区域发生变更时跳过昂贵的作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围界定，并展开完整的常规 CI 作业图，用于发布候选版本或广泛验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，并分发 `OpenClaw Release Checks`，用于安装冒烟测试、软件包验收、Docker 发布路径套件、实时 / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 路径。提供已发布的软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是用于验证软件包工件的侧运行工作流，不会阻塞发布工作流。它可以从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 工件中解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，并针对该 tarball 运行，而不是重新打包工作流检出的内容。配置文件涵盖 smoke、package、product、full 和自定义 Docker 路径选择。`package` 配置文件使用离线插件覆盖，因此已发布软件包验证不会受实时 ClawHub 可用性限制。可选的 Telegram 路径会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，而已发布 npm 规范路径会保留用于独立分发。

## Package Acceptance

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，请使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而软件包验收会通过用户在安装或更新后实际会经历的同一套 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 会检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、软件包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 与 `package_artifact_name=package-under-test`。该可复用工作流会下载该工件、验证 tarball 清单、在需要时准备 package-digest Docker 镜像，并针对该软件包而非工作流检出内容打包结果运行所选 Docker 路径。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时运行；如果 `Package Acceptance` 已解析出软件包，它会安装相同的 `package-under-test` 工件；独立的 Telegram 分发仍然可以安装已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 路径失败时使工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta / stable 的验收。
- `source=ref`：打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 为可选，但对于外部共享工件应当提供。

请将 `workflow_ref` 与 `package_ref` 区分开。`workflow_ref` 是运行测试的可信工作流 / harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这样可以让当前测试 harness 在不运行旧工作流逻辑的情况下验证较早的可信源码提交。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时为必填

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。该配置文件是大多数 Parallels 软件包 / 更新验证的 GitHub 原生替代方案，其中 Telegram 会通过 QA 实时传输证明同一软件包工件。跨操作系统发布检查仍覆盖特定于操作系统的新手引导、安装器和平台行为；软件包 / 更新产品验证应从 Package Acceptance 开始。

Package Acceptance 为已发布的软件包保留了一个有界的旧版兼容窗口，截止到 `2026.4.25`，包括 `2026.4.25-beta.*`。这些宽限条件在此处记录，是为了避免其变成永久性的静默跳过：`dist/postinstall-inventory.json` 中已知的私有 QA 条目在 tarball 省略这些文件时可能会发出警告；当软件包未暴露该标志时，`doctor-switch` 可能跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可能会从基于 tarball 的伪 git 固件中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的市场安装记录持久化；`plugin-update` 可能允许配置元数据迁移，但仍要求安装记录以及“不重新安装”行为保持不变。`2026.4.25` 之后的软件包必须满足现代契约；相同条件将失败，而不是警告或跳过。

示例：

```bash
# 验证当前 beta 软件包，并使用 product 级别覆盖范围。
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

# 验证一个 tarball URL。对于 source=url，SHA-256 为必填。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 复用由另一个 Actions 运行上传的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

在调试失败的软件包验收运行时，先查看 `resolve_package` 摘要，以确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、路径日志、阶段耗时和重跑命令。优先重跑失败的软件包配置文件或精确的 Docker 路径，而不是重跑完整发布验证。

QA Lab 在主智能范围工作流之外拥有专用的 CI 路径。`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动分发；它会将 mock parity gate、实时 Matrix 路径以及实时 Telegram 和 Discord 路径作为并行作业展开。实时作业使用 `qa-live-shared` 环境，而 Telegram / Discord 使用 Convex 租约。Matrix 在定时和发布门控中使用 `--profile fast --fail-fast`，而 CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布审批前运行对发布至关重要的 QA Lab 路径。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复项清理。它默认执行 dry-run，并且仅在 `apply=true` 时关闭显式列出的 PR。在修改 GitHub 之前，它会验证已合并 PR 确实已合并，并验证每个重复 PR 要么共享被引用的问题，要么有重叠的变更块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护路径，用于让现有文档与最近已合入的变更保持一致。它没有纯定时计划：当 `main` 上一次成功的非机器人 push CI 运行完成后，可以触发它，手动分发也可以直接运行它。workflow-run 调用会在 `main` 已继续前进，或最近一小时内已创建另一个未跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累计的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护路径，用于处理慢测试。它没有纯定时计划：当 `main` 上一次成功的非机器人 push CI 运行完成后，可以触发它，但如果当天 UTC 已有另一个 workflow-run 调用已运行或正在运行，它会跳过。手动分发会绕过这个每日活动门控。该路径会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小规模、保持覆盖率不变的测试性能修复，而不是广泛重构，然后重新运行完整测试套件报告，并拒绝那些降低通过基线测试数量的更改。如果基线包含失败测试，Codex 只能修复明显失败项，并且代理处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该路径会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与文档智能体保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅有文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 公告执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建工件检查以及可复用的下游工件 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性路径，例如 bundled / plugin-contract / protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 在扩展套件中运行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展路径 | 与 Node 相关的变更 |
| `check` | 分片的主本地门控等价项：生产类型、lint、防护、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面防护、软件包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建工件渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟路径 | 用于发布的手动 CI 分发 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试路径 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建工件的 macOS TypeScript 测试路径 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种风格的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动后执行每日 Codex 慢测试优化 | Main CI 成功后或手动分发 |

手动 CI 分发运行的作业图与常规 CI 相同，但会强制开启每个范围限定路径：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此发布候选版本的完整套件不会因同一 ref 上的另一次 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方在使用所选分发 ref 的工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便廉价检查在昂贵检查运行前先失败：

1. `preflight` 决定哪些路径实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待较重的工件和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 路径并行执行，这样下游使用方就能在共享构建准备好后立即开始。
4. 更重的平台和运行时路径随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发会跳过 changed-scope 检测，并让 preflight 清单表现得如同每个受范围控制的区域都发生了变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅凭这些修改就强制触发 Windows、Android 或 macOS 原生构建；这些平台路径仍然只对平台源码变更生效。

仅涉及 CI 路由的编辑、选定的廉价 core-test 固件编辑，以及狭义的插件契约辅助函数 / 测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。该路径会避免构建工件、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及额外的防护矩阵，前提是变更文件仅限于快速任务可直接覆盖的路由或辅助表面。

Windows Node 检查的范围限定于 Windows 特有的进程 / 路径包装器、npm / pnpm / UI 运行器辅助函数、包管理器配置，以及执行该路径的 CI 工作流表面；无关的源码、插件、install-smoke 和纯测试变更会保留在 Linux Node 路径上，这样它们就不会为了已由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。

单独的 `install-smoke` 工作流通过其自己的 `preflight` 作业复用同一个范围脚本。它将冒烟测试覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / 软件包表面、内置插件软件包 / 清单变更，以及 Docker 冒烟作业会覆盖的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码级别的内置插件变更、纯测试编辑和仅文档编辑不会占用 Docker worker。快速路径会一次性构建根 Dockerfile 镜像，检查 CLI，运行 agents 删除共享工作区的 CLI 冒烟测试，运行容器 `gateway-network` e2e，验证内置扩展 build arg，并在总命令超时 240 秒的限制下运行有界的内置插件 Docker 配置文件，同时每个场景的 Docker 运行也有单独上限。完整路径会保留 QR 软件包安装以及安装器 Docker / 更新覆盖，用于每晚定时运行、手动分发、workflow-call 发布检查，以及真正触及安装器 / 软件包 / Docker 表面的拉取请求。`main` 上的推送（包括合并提交）不会强制完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，工作流仍会保留快速 Docker 冒烟测试，并将完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分发也可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是不安装产品、仅包含 Node / Git 的运行器镜像，用于安装器 / 更新 / 插件依赖路径；另一个是功能镜像，会将同一个 tarball 安装到 `/app` 中，用于常规功能路径。Docker 路径定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而运行器只执行选定的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个路径选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行各路径；可使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感的尾池槽位数 10。重量级路径上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm 安装和多服务路径不会让 Docker 过度提交，而较轻路径仍能填满可用槽位。单个比有效上限更重的路径仍然可以从空池启动，然后独占运行，直到释放容量。路径启动默认错开 2 秒，以避免本地 Docker 守护进程创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先对 Docker 做预检，删除过期的 OpenClaw E2E 容器，输出活动路径状态，持久化路径耗时以供“最长优先”排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于检查调度器。默认情况下，它会在首次失败后停止调度新的池化路径，并且每条路径都有 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live / tail 路径使用更严格的单路径上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器路径，包括仅发布时使用的路径（如 `install-e2e`）以及拆分后的内置更新路径（如 `bundled-channel-update-acpx`），同时跳过清理冒烟测试，以便智能体复现某个失败路径。可复用的 live / E2E 工作流会调用 `scripts/test-docker-all.mjs --plan-json`，以确认需要的软件包、镜像类型、live 镜像、路径和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它可以通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的软件包工件，或从 `package_artifact_run_id` 下载软件包工件；验证 tarball 清单；当计划需要安装软件包的路径时，通过 Blacksmith 的 Docker 层缓存构建并推送带 package-digest 标签的 bare / functional GHCR Docker E2E 镜像；并在提供了 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入或已存在 package-digest 镜像时复用它们，而不是重新构建。`Package Acceptance` 工作流是高层级的软件包门控：它会从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流工件中解析一个候选包，然后将这个单一的 `package-under-test` 工件传递给可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，以便当前的验收逻辑可以在不检出旧工作流代码的情况下验证较早的可信提交。发布检查会对目标 ref 运行 `package` 验收配置文件；该配置文件覆盖软件包 / 更新 / 插件契约，是大多数 Parallels 软件包 / 更新覆盖的默认 GitHub 原生替代方案。发布路径 Docker 套件最多运行三个分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只会拉取自己需要的镜像类型，并通过同一个加权调度器执行多条路径（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。当请求完整发布路径覆盖时，OpenWebUI 会合并到 `plugins-integrations` 中；只有在仅分发 OpenWebUI 时，才保留独立的 `openwebui` 分块。每个分块都会上传 `.artifacts/docker-tests/`，其中包含路径日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢路径表以及逐路径重跑命令。工作流 `docker_lanes` 输入会让选定路径针对已准备好的镜像运行，而不是运行分块作业，这样失败路径调试就会限制在一个有针对性的 Docker 作业中，同时会为该次运行准备、下载或复用软件包工件；如果选定路径属于 live Docker 路径，则该目标作业会在本地为该次重跑构建 live-test 镜像。生成的逐路径 GitHub 重跑命令在这些值存在时会包含 `package_artifact_run_id`、`package_artifact_name` 以及已准备好的镜像输入，因此失败路径可以复用失败运行中的完全相同的软件包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可下载某次 GitHub 运行中的 Docker 工件，并打印组合 / 逐路径的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可获取慢路径和阶段关键路径摘要。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor 修复过程可以与其他内置检查一起分片。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。该本地检查门控在架构边界方面比广义的 CI 平台范围更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint / guards；core 纯测试变更只会运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展纯测试变更会运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展全量扫描属于显式测试工作。仅发布元数据的版本升级会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会安全失败并回退到所有检查路径。

手动 CI 分发会运行 `checks-node-compat-node22`，作为发布候选版本的兼容性覆盖。常规拉取请求和 `main` 推送会跳过该路径，并让矩阵聚焦于 Node 24 测试 / 渠道路径。

最慢的 Node 测试家族会被拆分或重新平衡，以便每个作业都保持较小规模，同时不至于过度预留运行器：渠道契约以三个加权分片运行，内置插件测试在六个扩展 worker 之间平衡，小型 core 单元路径会成对组合，自动回复以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置会分散到现有的仅源码 agentic Node 作业中，而不是等待已构建工件。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配备更大的 Node 堆，这样导入密集型插件批次就不会产生额外的 CI 作业。广泛的 agents 路径使用共享的 Vitest 文件并行调度器，因为它的瓶颈在于导入 / 调度，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片成为尾部瓶颈。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与经过筛选的分片。`check-additional` 会将 package-boundary compile / canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界防护分片会在一个作业内并发运行其小型独立防护项。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行，从而保留它们原有的检查名称作为轻量验证器作业，同时避免额外占用两个 Blacksmith worker 和第二条工件消费者队列。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方风格没有单独的源码集或清单；其单元测试路径仍会使用 SMS / 通话日志 BuildConfig 标志编译该风格，同时避免在每次与 Android 相关的 push 上都产生重复的 debug APK 打包作业。

当同一 PR 或 `main` ref 上有更新的 push 到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会正常报告分片失败，但不会在整个工作流已经被更新运行取代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就无法无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，其中 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等价命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界路径运行 changed typecheck/lint/guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门控，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 廉价的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 工件 / build-smoke 路径相关时构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 对比最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队耗时和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T09:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01b27624c9f88ba6261c38f2fbf449a936e6dd0a6a7a5aaa24f8f9db230a7cef
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围界定，在只有不相关区域发生变更时跳过高开销作业。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks`，以运行安装冒烟测试、Package Acceptance、Docker 发布路径套件、实时 / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。提供已发布的软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是一个旁路运行工作流，用于在不阻塞发布工作流的情况下验证软件包产物。它会从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball 产物中解析出一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，对该 tarball 运行，而不是重新打包工作流检出的内容。配置文件覆盖 smoke、package、product、full 以及自定义 Docker 通道选择。`package` 配置文件使用离线插件覆盖，因此已发布软件包的验证不会受实时 ClawHub 可用性限制。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 产物，而已发布 npm 规范路径则保留给独立触发场景。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包能否作为产品正常工作？”时，请使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证的是源码树，而软件包验收验证的是单个 tarball，使用的是用户在安装或更新后会经历的同一套 Docker E2E harness。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中输出来源、工作流引用、软件包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 与 `package_artifact_name=package-under-test`。该可复用工作流会下载该产物，验证 tarball 清单，必要时准备 package-digest Docker 镜像，并针对该软件包运行所选的 Docker 通道，而不是打包工作流检出的内容。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时运行；如果 `Package Acceptance` 已解析出一个软件包，它会安装同一个 `package-under-test` 产物；独立的 Telegram 触发仍然可以安装一个已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选的 Telegram 通道失败时使整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。这用于已发布 beta / stable 的验收。
- `source=ref`：打包一个可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会抓取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`。`package_sha256` 是可选的，但对于外部共享产物应当提供。

请将 `workflow_ref` 与 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流 / harness 代码。`package_ref` 是在 `source=ref` 时被打包的源码提交。这样，当前测试 harness 就可以验证较旧但可信的源码提交，而无需运行旧的工作流逻辑。

配置文件与 Docker 覆盖的映射关系：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：在 `package` 基础上增加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分片
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。这个配置文件是大多数 Parallels 软件包 / 更新验证的 GitHub 原生替代方案，其中 Telegram 会通过 QA 实时传输验证同一个软件包产物。跨操作系统发布检查仍然覆盖操作系统特定的新手引导、安装程序和平台行为；软件包 / 更新的产品验证应从 Package Acceptance 开始。Windows 打包版和安装器全新安装通道还会验证：已安装的软件包能否从原始绝对 Windows 路径导入浏览器控制覆盖。

Package Acceptance 为截至 `2026.4.25` 的已发布软件包提供了一个有界的旧版兼容窗口，其中包括 `2026.4.25-beta.*`。这些例外情况记录在这里，以避免它们变成永久性的静默跳过：`dist/postinstall-inventory.json` 中已知的私有 QA 条目，如果 tarball 缺少这些文件，可能会发出警告；当软件包未暴露该标志时，`doctor-switch` 可能跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从 tarball 派生的伪 git 固件中剪除缺失的 `pnpm.patchedDependencies`，并可能记录缺失的已持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能允许配置元数据迁移，但仍要求安装记录和不重新安装行为保持不变。`2026.4.25` 之后的软件包必须满足现代契约；相同条件将失败，而不是警告或跳过。

示例：

```bash
# 验证当前 beta 软件包，使用产品级覆盖。
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

调试失败的软件包验收运行时，先查看 `resolve_package` 摘要，确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重跑命令。优先重跑失败的软件包配置文件或精确的 Docker 通道，而不是重跑完整发布验证。

QA Lab 在主智能范围工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 与 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将模拟一致性门禁、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道并行展开为多个作业。实时作业使用 `qa-live-shared` 环境，而 Telegram / Discord 使用 Convex 租约。Matrix 在定时和发布门禁中使用 `--profile fast --fail-fast`，而 CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 触发始终会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后进行重复 PR 清理的手动工作流。它默认以 dry-run 运行，只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 确实已合并，并且每个重复 PR 都有共享的引用 issue 或重叠的变更区块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的变更保持一致。它没有纯定时调度：当 `main` 上一次成功的非机器人推送 CI 运行完成后，可以触发它；也可以直接手动触发。工作流运行触发的调用会在 `main` 已继续前进，或最近一小时内已创建过另一个未跳过的 Docs Agent 运行时跳过。实际运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行就能覆盖自上次文档处理以来积累的所有 `main` 变更。

`Test Performance Agent` 工作流是一个面向慢速测试的事件驱动 Codex 维护通道。它没有纯定时调度：当 `main` 上一次成功的非机器人推送 CI 运行完成后，可以触发它；但如果当天 UTC 内另一个由 workflow-run 触发的调用已经运行或正在运行，它就会跳过。手动触发会绕过这个按日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小规模、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整测试套件报告，并拒绝任何降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显的失败；并且在提交任何内容之前，agent 运行后的完整测试套件报告必须通过。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁执行变基，重新运行 `pnpm check:changed`，并重试推送；发生冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅有文档变更、变更范围、变更的扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 公告执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如内置 / plugin-contract / 协议检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对扩展套件运行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `check` | 分片的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、软件包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟通道 | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式化、lint 和损坏链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定的进程 / 路径测试，以及共享运行时导入说明符回归测试 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种变体的 Android 单元测试，以及一次 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后，每日由 Codex 执行的慢测试优化 | Main CI 成功后或手动触发 |

手动 CI 触发会运行与常规 CI 相同的作业图，但会强制开启所有受范围控制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此发布候选版的完整套件不会因为同一 ref 上的另一次推送或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方在使用所选触发 ref 的工作流文件时，对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定究竟存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道会在此之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得像所有受范围控制的区域都发生了变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些改动就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只根据平台源码变更来决定是否运行。

仅涉及 CI 路由的改动、部分低成本 core-test fixture 改动，以及范围很窄的 plugin contract helper / test-routing 改动，会走一个快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前变更文件仅限于该快速任务能够直接覆盖的路由或 helper 表面时，这条路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及附加守卫矩阵。

Windows Node 检查的范围仅限于 Windows 特定的进程 / 路径包装器、npm / pnpm / UI runner helpers、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和纯测试改动会继续留在 Linux Node 通道上，这样就不会为了本来已由常规测试分片覆盖的内容去占用一个 16 vCPU 的 Windows worker。

单独的 `install-smoke` 工作流会通过其自身的 `preflight` 作业复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / 软件包表面、内置插件 package / manifest 变更，以及 Docker 冒烟作业会覆盖到的 core plugin / channel / Gateway 网关 / 插件 SDK 表面会走快速路径。仅源码级的内置插件改动、纯测试改动和纯文档改动不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行 agents delete shared-workspace CLI 冒烟、运行容器化 gateway-network e2e、验证一个内置扩展构建参数，并在 240 秒的总命令超时限制下运行有界的内置插件 Docker 配置文件，同时对每个场景的 Docker run 单独设置上限。完整路径则保留 QR 软件包安装和安装器 Docker / 更新覆盖，用于夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及安装器 / 软件包 / Docker 表面的拉取请求。推送到 `main`，包括 merge commit，不会强制走完整路径；当 changed-scope 逻辑在 push 上本会请求完整覆盖时，该工作流仍会保留快速 Docker 冒烟，并把完整 install smoke 留给夜间任务或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由单独的 `run_bun_global_install_smoke` 门禁控制；它会在夜间定时和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` push 不会运行它。QR 和安装器 Docker 测试保留各自专用的安装型 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于安装器 / 更新 / 插件依赖通道的基础 Node / Git runner，另一个是将同一个 tarball 安装到 `/app` 中、用于常规功能通道的功能型镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而 runner 只执行被选中的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行各通道；可使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池 10 个槽位，并使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对 provider 敏感的尾池 10 个槽位。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm 安装和多服务通道不会让 Docker 超额承载，而较轻的通道仍能填满可用槽位。单个通道即使重于有效上限，也仍然可以从空池启动，随后独占运行直到释放容量。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可以通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。该本地聚合器会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以支持“最长优先”排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 来检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道；每个通道都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live / tail 通道使用更严格的逐通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅用于发布的通道，例如 `install-e2e`，以及拆分后的内置更新通道，例如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现某个失败通道。可复用的 live / E2E 工作流会通过 `scripts/test-docker-all.mjs --plan-json` 询问需要哪些软件包、镜像类型、live 镜像、通道和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub outputs 和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行的软件包产物，或从 `package_artifact_run_id` 下载软件包产物；验证 tarball 清单；在计划需要软件包安装型通道时，通过 Blacksmith 的 Docker layer cache 构建并推送以 package digest 标记的 bare / functional GHCR Docker E2E 镜像；并在已有 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入或已存在 package digest 镜像时直接复用它们，而不是重新构建。`Package Acceptance` 工作流是高层级的软件包门禁：它会从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流产物中解析出一个候选项，然后将该单一的 `package-under-test` 产物传递给可复用的 Docker E2E 工作流。它会将 `workflow_ref` 与 `package_ref` 分离，这样当前的验收逻辑就能验证较旧但可信的提交，而无需检出旧版工作流代码。发布检查会对目标 ref 运行 `package` 验收配置文件；该配置文件覆盖软件包 / 更新 / 插件契约，是大多数 Parallels 软件包 / 更新覆盖的默认 GitHub 原生替代方案。发布路径 Docker 套件最多运行三个分片作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分片只会拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。当完整发布路径覆盖请求 OpenWebUI 时，它会被并入 `plugins-integrations`，只有在仅触发 OpenWebUI 的情况下才保留独立的 `openwebui` 分片。`plugins-integrations` 分片运行的是拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分片都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及逐通道重跑命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行所选通道，而不是运行这些分片作业，这样失败通道的调试就能限制在一个有针对性的 Docker 作业中，并为该次运行准备、下载或复用软件包产物；如果所选通道是一个 live Docker 通道，该定向作业会为此次重跑在本地构建 live-test 镜像。生成的逐通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 以及已准备好的镜像输入，因此失败通道可以复用失败运行中的精确软件包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行下载 Docker 产物，并输出组合 / 逐通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢通道和阶段关键路径摘要。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，这样重复的 npm update 和 doctor repair 轮次就可以与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界方面比广义的 CI 平台范围更严格：core 生产改动会运行 core prod 和 core test typecheck，以及 core lint / guards；core 纯测试改动只运行 core test typecheck 和 core lint；扩展生产改动会运行 extension prod 和 extension test typecheck，以及 extension lint；扩展纯测试改动会运行 extension test typecheck 和 extension lint。公共插件 SDK 或 plugin-contract 改动会扩展为 extension typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展级全面测试仍属于显式测试工作。仅涉及发布元数据的版本升级会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置改动会以安全优先方式退回到所有检查通道。

手动 CI 触发会运行 `checks-node-compat-node22`，作为发布候选版本的兼容性覆盖。普通拉取请求和 `main` 推送会跳过该通道，并让矩阵聚焦于 Node 24 测试 / 渠道通道。

最慢的 Node 测试族会被拆分或重新平衡，以便每个作业都保持较小规模，同时避免过度预留 runner：渠道契约会拆分为三个加权分片；内置插件测试会在六个扩展 worker 之间平衡分配；较小的 core 单元测试通道会成对组合；auto-reply 会作为四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands / state-routing 分片；而 agentic Gateway 网关 / 插件配置会分散到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体和杂项插件测试会使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，这样导入密集型的插件批次就不会额外创建更多 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度支配，而不是由某个单独的慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片拖尾。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与经过筛选的分片。`check-additional` 会将 package-boundary 的 compile / canary 工作保持在一起，并将 runtime topology 架构与 gateway watch 覆盖分开；boundary guard 分片会在一个作业内部并发运行其小型且彼此独立的守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，于 `build-artifacts` 内部并发运行，从而在保留原有检查名称作为轻量验证器作业的同时，避免额外两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方变体没有单独的 source set 或 manifest；它的单元测试通道仍会带着 SMS / call-log BuildConfig 标志编译该变体，同时避免在每次与 Android 相关的 push 上都重复执行一次 debug APK 打包作业。

当同一 PR 或 `main` ref 上有更新的 push 落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍然会正常报告分片失败，但不会在整个工作流已被取代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本比节省的还高；install-smoke Docker 构建，此处 32 vCPU 的排队时间成本也高于节省收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道执行变更相关的 typecheck / lint / guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带逐阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 损坏链接检查
pnpm build          # 当 CI 产物 / build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push 的 CI 运行
pnpm ci:timings:recent                        # 对比最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

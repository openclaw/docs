---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T06:21:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cb69d2eaa44460963bf9b540cbeb2c87ca3802842ffcfdf98780f5d9062d5da
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围控制，在只改动了不相关区域时跳过昂贵的作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围控制，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks`，用于安装冒烟测试、软件包验收、Docker 发布路径测试套件、实时 / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 流水线。提供已发布的软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是一个侧边运行工作流，用于验证软件包工件，而不会阻塞发布工作流。它会从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball 工件中解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，对该 tarball 进行测试，而不是重新打包工作流检出的内容。其配置文件涵盖 smoke、package、product、full 和自定义 Docker 流水线选择。`package` 配置文件使用离线插件覆盖，因此已发布软件包的验证不会受 live ClawHub 可用性影响。可选的 Telegram 流水线会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，而已发布 npm 规范路径仍保留用于独立触发场景。

## Package Acceptance

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，请使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证的是源代码树，而软件包验收验证的是单个 tarball，通过与用户在安装或更新后实际经历相同的 Docker E2E harness 进行测试。

该工作流包含四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者一起作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中输出来源、工作流引用、软件包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。这个可复用工作流会下载该工件，验证 tarball 清单，按需准备 package-digest Docker 镜像，并针对这个软件包运行所选 Docker 流水线，而不是打包工作流检出的内容。
3. `package_telegram` 会按需调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时，它会运行；如果 Package Acceptance 已解析出一个软件包，它会安装同一个 `package-under-test` 工件；独立的 Telegram 触发仍然可以安装已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 流水线失败时，使整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 版本的验收。
- `source=ref`：打包一个可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会抓取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`。`package_sha256` 是可选的，但对于外部共享工件应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流 / harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样，当前测试 harness 就可以验证较旧但可信的源提交，而无需运行旧的工作流逻辑。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package`，外加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分片
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。该配置文件是大多数 Parallels 软件包 / 更新验证的 GitHub 原生替代方案，其中 Telegram 会通过 QA 实时传输证明同一个软件包工件。跨 OS 发布检查仍然覆盖特定 OS 的新手引导、安装器和平台行为；软件包 / 更新的产品验证应当从 Package Acceptance 开始。

Package Acceptance 为已经发布的软件包提供一个有界的旧版兼容窗口，覆盖到 `2026.4.25`，包括 `2026.4.25-beta.*`。这些例外在这里记录，是为了防止它们变成永久性的静默跳过：如果 tarball 省略了这些文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；当软件包未暴露该标志时，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能允许配置元数据迁移，同时仍要求安装记录和无重新安装行为保持不变。`2026.4.25` 之后的软件包必须满足现代契约；相同条件将直接失败，而不是警告或跳过。

示例：

```bash
# 验证当前 beta 软件包，并使用产品级覆盖。
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

调试失败的软件包验收运行时，先查看 `resolve_package` 摘要，以确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、流水线日志、阶段耗时和重跑命令。优先重跑失败的软件包配置文件或精确的 Docker 流水线，而不是重跑完整发布验证。

QA Lab 在主智能范围控制工作流之外有专用的 CI 流水线。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将 mock parity gate、live Matrix 流水线，以及 live Telegram 和 Discord 流水线作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram / Discord 使用 Convex 租约。Matrix 在定时和发布门控中使用 `--profile fast --fail-fast`，而 CLI 默认值和手动工作流输入仍然是 `all`；手动触发 `matrix_profile=all` 时，总是会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 流水线。

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于在合并后清理重复 PR。它默认是 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已合并 PR 确实已合并，并验证每个重复 PR 都具有共享的被引用 issue，或存在重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护流水线，用于让现有文档与最近已合并的更改保持一致。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。工作流运行触发的调用会在 `main` 已继续前进，或者过去一小时内已创建了另一个未被跳过的 Docs Agent 运行时被跳过。实际运行时，它会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来在 main 上累积的全部更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护流水线，用于处理慢测试。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一个基于 workflow-run 的调用正在运行或已运行，它就会跳过。手动触发会绕过这个按天计的活跃门控。该流水线会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整测试套件报告，并拒绝任何降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显的失败，并且变更提交前，agent 之后的完整测试套件报告必须全部通过。当 `main` 在机器人推送落地前继续前进时，该流水线会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅改动文档、已变更范围、已变更扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 通告执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查以及可复用的下游工件 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性流水线，例如 bundled / plugin-contract / protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对扩展套件执行完整 bundled-plugin 测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不含渠道、bundled、contract 和扩展流水线 | 与 Node 相关的变更 |
| `check` | 分片后的主本地门控等效项：生产类型、lint、guard、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面 guard、package-boundary 和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke 测试 | 与 Node 相关的变更 |
| `checks` | 已构建工件渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和 smoke 流水线 | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式化、lint 和断链检查 | 文档有变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定测试流水线 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享构建工件的 macOS TypeScript 测试流水线 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后每日执行的 Codex 慢测试优化 | main CI 成功后或手动触发 |

手动 CI 触发会运行与常规 CI 相同的作业图，但会强制开启所有范围控制流水线：Linux Node 分片、bundled-plugin 分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此同一 ref 上的另一次 push 或 PR 运行不会取消一个发布候选版本的完整测试套件。可选的 `target_ref` 输入允许可信调用方在分支、标签或完整提交 SHA 上运行该作业图，同时使用所选触发 ref 的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便让廉价检查先失败，再运行昂贵作业：

1. `preflight` 决定究竟存在哪些流水线。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的工件和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 流水线并行运行，这样下游消费者就可以在共享构建就绪后立即开始。
4. 更重的平台和运行时流水线会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围控制逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得像所有受范围控制的区域都发生了变化。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些改动就强制运行 Windows、Android 或 macOS 原生构建；这些平台流水线仍然只由对应平台源代码变更触发。

仅涉及 CI 路由的编辑、选定的廉价 core-test fixture 编辑，以及狭窄的插件契约辅助工具 / 测试路由编辑，会走快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务可直接覆盖的路由或辅助表面时，这条路径会跳过构建工件、Node 22 兼容性、渠道契约、完整 core 分片、bundled-plugin 分片和额外 guard 矩阵。

Windows Node 检查的范围仅限于 Windows 特定的进程 / 路径包装器、npm / pnpm / UI 运行器辅助工具、包管理器配置，以及执行该流水线的 CI 工作流表面；不相关的源代码、插件、install-smoke 和仅测试类改动会保留在 Linux Node 流水线上，这样就不会为已由常规测试分片覆盖的内容占用一个 16-vCPU 的 Windows worker。

独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / package 表面、bundled 插件 package / manifest 变更，以及 Docker smoke 作业所覆盖的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会走快速路径。仅源代码的 bundled 插件变更、仅测试类编辑，以及仅文档类编辑，不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 `gateway-network` e2e，验证一个 bundled 扩展 build arg，并在 240 秒的聚合命令超时下运行有边界的 bundled-plugin Docker 配置文件，同时每个场景的 Docker run 还各自有独立上限。完整路径则保留 QR package install 以及 installer Docker / update 覆盖，用于夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer / package / Docker 表面的拉取请求。推送到 `main`，包括合并提交，不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，该工作流仍只保留快速 Docker smoke，并把完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间调度和发布检查工作流中运行，手动触发 `install-smoke` 时也可选择启用，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试保留它们各自专用的 install 导向 Dockerfile。

本地 `test:docker:all` 会预先构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是裸 Node / Git 运行器，用于 installer / update / plugin-dependency 流水线；另一个是功能镜像，会把同一个 tarball 安装到 `/app` 中，用于常规功能性流水线。Docker 流水线定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而运行器只执行选中的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每条流水线选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行各流水线；默认 main-pool 槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；provider 敏感的 tail-pool 槽位数也默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型流水线上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm install 和多服务流水线对 Docker 过度争抢，同时让较轻流水线仍能填满可用槽位。单条比有效上限更重的流水线仍然可以从空池启动，但会独占运行直到释放容量。为避免本地 Docker daemon 在创建阶段出现风暴，流水线启动默认错开 2 秒；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先对 Docker 做 preflight，移除陈旧的 OpenClaw E2E 容器，输出活动流水线状态，持久化流水线耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于检查调度器。默认在首次失败后停止调度新的池化流水线，并且每条流水线都有 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live / tail 流水线使用更紧的逐流水线上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器流水线，包括仅用于发布的流水线如 `install-e2e`，以及拆分后的 bundled 更新流水线如 `bundled-channel-update-acpx`，同时跳过清理 smoke，以便智能体复现某一条失败流水线。

可复用的 live / E2E 工作流会调用 `scripts/test-docker-all.mjs --plan-json`，以确定需要哪些 package、镜像类型、live 镜像、流水线和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它可以通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的软件包工件，或从 `package_artifact_run_id` 下载软件包工件；验证 tarball 清单；当计划需要 package-installed 流水线时，通过 Blacksmith 的 Docker 层缓存构建并推送按 package digest 标记的 bare / functional GHCR Docker E2E 镜像；并在提供了 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入，或已存在 package-digest 镜像时，直接复用这些镜像而不是重新构建。

`Package Acceptance` 工作流是高层级的软件包门控：它会从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流工件中解析出一个候选项，然后将这个单一的 `package-under-test` 工件传入可复用的 Docker E2E 工作流。它会将 `workflow_ref` 与 `package_ref` 分离，以便当前的验收逻辑可以验证较旧但可信的提交，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行 `package` 验收配置文件；该配置文件覆盖 package / update / 插件契约，是大多数 Parallels package / update 覆盖的默认 GitHub 原生替代方案。

发布路径 Docker 套件最多运行三个分块作业，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只会拉取它所需的镜像类型，并通过同一个加权调度器执行多条流水线（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。当完整发布路径覆盖请求 OpenWebUI 时，它会被折叠进 `plugins-integrations`；只有在仅 OpenWebUI 的触发场景中，才会保留独立的 `openwebui` 分块。`plugins-integrations` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 流水线，而不是串行的一体化 `bundled-channel-deps` 流水线。每个分块都会上传 `.artifacts/docker-tests/`，其中包含流水线日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢流水线表，以及逐流水线重跑命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行选定流水线，而不是运行整块作业；这使失败流水线的调试可以被限制在一个有针对性的 Docker 作业内，并为该次运行准备、下载或复用软件包工件；如果选中的流水线是 live Docker 流水线，该目标作业会为这次重跑在本地构建 live-test 镜像。生成的逐流水线 GitHub 重跑命令在这些值存在时会包含 `package_artifact_run_id`、`package_artifact_name` 以及已准备镜像输入，因此失败流水线可以复用失败运行中的完全相同的软件包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行下载 Docker 工件，并输出组合式 / 逐流水线的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢流水线和阶段关键路径摘要。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。bundled 更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor 修复过程可以与其他 bundled 检查一起分片。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门控在架构边界方面比宽泛的 CI 平台范围更严格：core 生产变更会运行 core prod 和 core test 类型检查，以及 core lint / guards；core 仅测试类变更只运行 core test 类型检查和 core lint；扩展生产变更会运行扩展 prod 和扩展 test 类型检查，以及扩展 lint；扩展仅测试类变更会运行扩展 test 类型检查和扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展扫测仍属于显式测试工作。仅发布元数据的版本号提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根级 / 配置变更会以安全优先方式退回到所有检查流水线。

手动 CI 触发会运行 `checks-node-compat-node22`，作为发布候选版本的兼容性覆盖。常规拉取请求和 `main` 推送会跳过这条流水线，并让矩阵继续聚焦于 Node 24 测试 / 渠道流水线。

最慢的 Node 测试族已被拆分或平衡，因此每个作业都能保持较小规模，同时不会过度预留运行器：渠道契约会作为三个加权分片运行，bundled 插件测试会在六个扩展 worker 之间平衡分配，小型 core 单元流水线会成对组合，auto-reply 会作为四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分散到现有的仅源代码 agentic Node 作业中，而不是等待构建工件。宽泛的浏览器、QA、媒体和杂项插件测试使用它们各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配备更大的 Node 堆，因此导入密集的插件批次不会产生额外的 CI 作业。宽泛的 agents 流水线使用共享的 Vitest 文件并行调度器，因为它的瓶颈在于导入 / 调度，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独自承担尾部耗时。包含模式分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置与筛选后的分片。`check-additional` 会把 package-boundary 的 compile / canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片会在一个作业内并发运行其小型独立 guard。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内并发运行；这样既保留了它们旧的检查名称作为轻量验证作业，又避免额外占用两个 Blacksmith worker 和第二条工件消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的源代码集或 manifest；它的单元测试流水线仍会在启用 SMS / call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有更新的 push 到来时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被更新运行取代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整测试套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled 插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 节省的成本不如带来的损耗；install-smoke Docker 构建也是如此，其中 32 vCPU 的排队时间成本高于其收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界流水线执行变更相关的类型检查 / lint / guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门控，但附带每阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 廉价的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 断链检查
pnpm build          # 当 CI 工件 / build-smoke 流水线相关时，构建 dist
pnpm ci:timings                               # 汇总最新一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队耗时和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪音，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

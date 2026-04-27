---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地对应命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T07:11:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 197ca6bd69f47fc26f8bee3f10c90fab75536cc46c0ca2350a02342d7a3a030c
    source_path: ci.md
    workflow: 15
---

CI 在每次推送到 `main` 以及每个拉取请求时都会运行。它使用智能范围界定，在只更改了不相关区域时跳过高开销作业。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并展开完整的常规 CI 作业图，用于发布候选版本或广泛验证。

`Full Release Validation` 是“发布前运行所有内容”的手动总工作流。它接受分支、标签或完整提交 SHA，使用该目标派发手动 `CI` 工作流，并派发 `OpenClaw Release Checks`，用于安装冒烟测试、包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 相关流程。当提供已发布的包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。

`Package Acceptance` 是用于验证包产物的旁路工作流，不会阻塞发布工作流。它可从以下来源解析单个候选项：已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball 产物；然后将其上传为 `package-under-test`，并复用 Docker 发布 / E2E 调度器，使用该 tarball 而不是重新打包工作流检出内容。其配置文件涵盖 smoke、package、product、full 以及自定义 Docker 流程选择。`package` 配置文件使用离线插件覆盖，因此已发布包的验证不依赖 live ClawHub 可用性。可选的 Telegram 流程会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 产物，而已发布 npm 规范路径仍保留给独立派发使用。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，请使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证源码树，而包验收则通过用户在安装或更新后实际经历的同一套 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析单个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。该可复用工作流会下载该产物，验证 tarball 清单，按需准备 package-digest Docker 镜像，并针对该包运行所选 Docker 流程，而不是打包工作流检出内容。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时它会运行；如果 Package Acceptance 已解析出包，它会安装相同的 `package-under-test` 产物；独立的 Telegram 派发仍然可以安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选的 Telegram 流程失败时使整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 的验收。
- `source=ref`：打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享产物应当提供。

请将 `workflow_ref` 和 `package_ref` 分开理解。`workflow_ref` 是运行测试的可信工作流 / harness 代码。`package_ref` 是在 `source=ref` 时要被打包的源提交。这样可以让当前测试 harness 验证较旧但可信的源提交，而不必运行旧的工作流逻辑。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：在 `package` 基础上增加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分片
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时为必填

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=package` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。该配置文件是大多数 Parallels 包 / 更新验证的 GitHub 原生替代方案，而 Telegram 会通过 QA live 传输证明同一个包产物。跨 OS 的发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；包 / 更新产品验证应从 Package Acceptance 开始。

Package Acceptance 为已发布且截至 `2026.4.25` 的包提供了一个有边界的旧版兼容窗口，包括 `2026.4.25-beta.*`。这些宽限规则在此记录，以避免它们变成永久性的静默跳过：如果 tarball 省略了已知的私有 QA 文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；当包未暴露该标志时，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并且可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能允许配置元数据迁移，同时仍要求安装记录及无重复安装行为保持不变。`2026.4.25` 之后的包必须满足现代契约；相同条件将不再警告或跳过，而是直接失败。

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

在调试失败的包验收运行时，先查看 `resolve_package` 摘要，以确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、流程日志、阶段耗时以及重跑命令。优先重跑失败的包配置文件或精确的 Docker 流程，而不是重跑完整发布验证。

QA Lab 在主智能范围工作流之外有专门的 CI 流程。`Parity gate` 工作流会在匹配的 PR 更改和手动派发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动派发；它会将 mock parity gate、live Matrix 流程以及 live Telegram 和 Discord 流程作为并行作业展开。live 作业使用 `qa-live-shared` 环境，而 Telegram / Discord 使用 Convex leases。对于定时和发布门禁，Matrix 使用 `--profile fast --fail-fast`；而 CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 派发总是会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行关键发布所需的 QA Lab 流程。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于落地后的重复 PR 清理。它默认以 dry-run 方式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已被合并，并验证每个重复 PR 都具有共享的引用 issue，或存在重叠的已修改代码块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护流程，用于让现有文档与最近已落地的更改保持一致。它没有纯定时调度：`main` 上成功的、非机器人推送 CI 运行可以触发它，也可以通过手动派发直接运行。工作流运行触发的调用会在 `main` 已继续前进，或最近一小时内已创建另一个未被跳过的 Docs Agent 运行时跳过。实际运行时，它会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积在 `main` 上的所有更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护流程，用于处理慢测试。它没有纯定时调度：`main` 上成功的、非机器人推送 CI 运行可以触发它，但如果同一 UTC 日期已有另一个由工作流运行触发的调用已运行或正在运行，它会跳过。手动派发会绕过这一按日活动门禁。该流程会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率的测试性能修复，而不是大范围重构；随后重跑完整测试套件报告，并拒绝任何会降低基线通过测试数的更改。如果基线存在失败测试，Codex 只能修复明显的失败项，且 agent 处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该流程会对已验证补丁执行 rebase、重跑 `pnpm check:changed` 并重试推送；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅为文档更改、已更改范围、已更改扩展，并构建 CI 清单 | 在所有非草稿推送和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 在所有非草稿推送和 PR 上始终运行 |
| `security-fast` | 快速安全作业所需的聚合作业 | 在所有非草稿推送和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查以及可复用的下游产物 | 与 Node 相关的更改 |
| `checks-fast-core` | 快速 Linux 正确性流程，例如 bundled / plugin-contract / protocol 检查 | 与 Node 相关的更改 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的更改 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的更改 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展流程 | 与 Node 相关的更改 |
| `check` | 分片后的主要本地门禁对应项：生产类型、lint、防护检查、测试类型和严格冒烟测试 | 与 Node 相关的更改 |
| `check-additional` | 架构、边界、扩展表面防护、包边界和 gateway-watch 分片 | 与 Node 相关的更改 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的更改 |
| `checks` | 已构建产物渠道测试的验证作业 | 与 Node 相关的更改 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟流程 | 用于发布的手动 CI 派发 |
| `check-docs` | 文档格式、lint 和断链检查 | 文档发生更改时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的更改 |
| `checks-windows` | Windows 特定测试流程 | 与 Windows 相关的更改 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试流程 | 与 macOS 相关的更改 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的更改 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的更改 |
| `test-performance-agent` | 在可信活动之后进行每日 Codex 慢测试优化 | `main` 上的 CI 成功后或手动派发 |

手动 CI 派发运行的作业图与常规 CI 相同，但会强制开启所有范围流程：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行使用唯一的并发组，因此发布候选版本的完整测试套件不会因同一 ref 上的另一次推送或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用者在使用所选派发 ref 的工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的排序方式是让低成本检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定哪些流程实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 流程并行进行，这样下游消费者就能在共享构建准备好后立即开始。
4. 更重的平台和运行时流程会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动派发会跳过 changed-scope 检测，并让 preflight 清单表现得像所有有范围限制的区域都发生了更改。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因自身更改就强制运行 Windows、Android 或 macOS 原生构建；这些平台流程仍然只针对对应平台源码更改运行。

仅涉及 CI 路由的编辑、特定的低成本 core-test fixture 编辑，以及范围很窄的插件契约辅助函数 / 测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当更改文件仅限于快速任务可直接覆盖的路由或辅助函数表面时，这一路径会避免运行 build artifacts、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片以及额外的防护矩阵。

Windows Node 检查的范围仅限于 Windows 特定的进程 / 路径包装器、npm / pnpm / UI 运行器辅助函数、包管理器配置，以及执行该流程的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试更改仍会留在 Linux Node 流程上，这样就不会为了已经由常规测试分片覆盖的内容去占用一个 16 vCPU 的 Windows worker。

独立的 `install-smoke` 工作流通过其自身的 `preflight` 作业复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / package 表面、内置插件 package / manifest 更改，以及 Docker 冒烟作业所覆盖的 core 插件 / 渠道 / Gateway 网关 / Plugin SDK 表面，会运行快速路径。仅源码的内置插件更改、仅测试编辑以及仅文档编辑不会占用 Docker workers。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 `gateway-network` e2e，验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行有边界的内置插件 Docker 配置文件，同时每个场景的 Docker 运行也分别受限。完整路径则保留 QR 包安装以及 installer Docker / update 覆盖，用于每晚定时运行、手动派发、工作流调用的发布检查，以及确实触及 installer / package / Docker 表面的拉取请求。推送到 `main`，包括合并提交，不会强制完整路径；当 changed-scope 逻辑在推送时请求完整覆盖，该工作流仍会保留快速 Docker 冒烟，而将完整 install smoke 留给每晚运行或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独控制；它会在每晚调度以及发布检查工作流中运行，手动 `install-smoke` 派发也可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 仅打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于 installer / update / plugin-dependency 流程的裸 Node / Git 运行器，另一个是功能镜像，会将相同 tarball 安装到 `/app` 中，供常规功能流程使用。Docker 流程定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个流程选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行流程；可用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool 槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感的 tail-pool 槽位数 10。重型流程上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm 安装和多服务流程就不会让 Docker 过度提交，而较轻流程仍能填满可用槽位。单个比实际限制更重的流程仍然可以从空池启动，然后在释放容量前独占运行。默认会将流程启动错开 2 秒，以避免本地 Docker daemon 出现 create storm；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合流程会预检 Docker、移除过期的 OpenClaw E2E 容器、输出活跃流程状态、持久化流程耗时用于最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以检查调度器。默认情况下，它会在首次失败后停止调度新的池化流程，并且每个流程都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live / tail 流程使用更严格的逐流程上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器流程，包括仅发布使用的流程如 `install-e2e`，以及拆分后的内置更新流程如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现单个失败流程。可复用的 live / E2E 工作流会调用 `scripts/test-docker-all.mjs --plan-json`，以确定所需的 package、镜像类型、live 镜像、流程和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要包安装型流程时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package-digest 标签的 bare / functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入或已有的 package-digest 镜像，而不是重新构建。`Package Acceptance` 工作流是高层级的包门禁：它从 npm、可信 `package_ref`、附带 SHA-256 的 HTTPS tarball，或之前的工作流产物中解析一个候选项，然后将这个单独的 `package-under-test` 产物传入可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，以便当前验收逻辑可以验证较旧但可信的提交，而不必检出旧工作流代码。发布检查会针对目标 ref 运行 `package` 验收配置文件；该配置文件覆盖 package / update / plugin 契约，是大多数 Parallels package / update 覆盖的默认 GitHub 原生替代方案。发布路径 Docker 套件最多运行三个分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己所需的镜像类型，并通过同一个带权重的调度器执行多个流程（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-integrations`）。当请求完整发布路径覆盖时，OpenWebUI 会并入 `plugins-integrations`，只有在仅派发 OpenWebUI 时才保留独立的 `openwebui` 分块。`plugins-integrations` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 流程，而不是串行的一体化 `bundled-channel-deps` 流程。每个分块都会上传 `.artifacts/docker-tests/`，其中包含流程日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢流程表，以及逐流程重跑命令。工作流的 `docker_lanes` 输入会针对准备好的镜像运行所选流程，而不是运行分块作业，这样失败流程的调试就被限制在一个有针对性的 Docker 作业内，并会为该次运行准备、下载或复用包产物；如果所选流程是 live Docker 流程，有针对性的作业会在本地为该次重跑构建 live-test 镜像。生成的每流程 GitHub 重跑命令在相关值存在时会包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败流程可以复用失败运行中的完全相同的包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker 产物，并打印组合 / 每流程的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢流程和阶段关键路径摘要。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 Doctor 修复过程可以与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界方面比宽泛的 CI 平台范围更严格：core 生产更改会运行 core prod 和 core test typecheck，以及 core lint / guards；core 仅测试更改只运行 core test typecheck 和 core lint；扩展生产更改会运行 extension prod 和 extension test typecheck，以及 extension lint；扩展仅测试更改会运行 extension test typecheck 和 extension lint。公共 Plugin SDK 或插件契约更改会扩展到 extension typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展全量测试仍然是显式的测试工作。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置更改会安全地回退到所有检查流程。

手动 CI 派发会运行 `checks-node-compat-node22` 作为发布候选版本的兼容性覆盖。常规拉取请求和 `main` 推送会跳过该流程，并让矩阵继续聚焦于 Node 24 测试 / 渠道流程。

最慢的 Node 测试族已被拆分或重新平衡，以便每个作业都保持较小规模，同时不至于过度预留 runners：渠道契约以三个带权重的分片运行，内置插件测试在六个扩展 workers 之间做负载均衡，小型 core 单元流程被成对组合，auto-reply 作为四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 以及 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配备更大的 Node heap，这样导入密集型的插件批次就不会产生额外的 CI 作业。广泛的 agents 流程使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度限制，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部负载。包含模式分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将 package-boundary 的 compile / canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；边界防护分片会在一个作业内部并发运行其规模较小且彼此独立的防护检查。Gateway 网关 watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内部并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免额外占用两个 Blacksmith workers 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试流程仍会在启用 SMS / call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的推送中重复打包 debug APK 作业。

当同一个 PR 或 `main` ref 上有新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。

自动 CI 并发键已做版本化处理（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整测试套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

## 运行器

| 运行器 | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证作业、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管 Ubuntu，这样 Blacksmith 矩阵就能更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 的敏感度仍然高到让 8 vCPU 得不偿失；install-smoke Docker 构建，此处 32 vCPU 的排队时间得不偿失 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地对应命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界流程运行 changed typecheck/lint/guards
pnpm check          # 快速本地门禁：production tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同一门禁，但带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 断链检查
pnpm build          # 当 CI 的 artifact / build-smoke 流程相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main 推送 CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声并选择 origin/main 推送 CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

---
read_when:
    - 你需要了解某个 CI 作业为什么会运行或不会运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T13:31:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4a2143e1670641bc7a603c61f27062f888f32b2c0aad914d1f8f3fede88bbc0
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在仅有无关区域发生变更时跳过高开销作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能作用域，并展开完整的常规 CI 作业图，用于候选发布或大范围验证。

`Full Release Validation` 是手动总控工作流，用于“发布前运行所有内容”。它接受分支、标签或完整提交 SHA，使用该目标派发手动 `CI` 工作流，并派发 `OpenClaw Release Checks`，用于安装冒烟测试、包验收、Docker 发布路径套件、实时 / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。提供已发布包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。总控工作流会记录派发的子运行 id，最终的 `Verify full validation` 作业会重新检查当前子运行的结论。如果某个子工作流被重新运行并变为绿色，只需重新运行父级验证器作业即可刷新总控结果。

发布实时 / E2E 子工作流保留了广泛的原生 `pnpm test:live` 覆盖范围，但它不是作为单个串行作业运行，而是通过 `scripts/test-live-shard.mjs` 以具名分片方式运行（`native-live-src-agents`、`native-live-src-gateway`、`native-live-test`、`native-live-extensions-a-k` 和 `native-live-extensions-l-z`）。这样可以保持相同的文件覆盖范围，同时让缓慢的实时 provider 故障更容易重跑和诊断。

`Package Acceptance` 是用于验证包产物的旁路工作流，不会阻塞发布工作流。它可以从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 产物中解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，对该 tarball 运行，而不是重新打包工作流检出内容。配置档覆盖 smoke、package、product、full 和自定义 Docker 通道选择。`package` 配置档使用离线插件覆盖，因此已发布包验证不依赖实时 ClawHub 可用性。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 产物，而已发布 npm 规范路径则保留给独立派发场景。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，请使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收会通过用户在安装或更新后实际使用的同一 Docker E2E harness，验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和配置档。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，参数为 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。该可复用工作流会下载该产物，验证 tarball 清单，按需准备 package-digest Docker 镜像，并针对该包运行所选 Docker 通道，而不是打包工作流检出内容。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时运行；如果 Package Acceptance 解析出了包，它会安装同一个 `package-under-test` 产物；独立 Telegram 派发仍可安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 验收。
- `source=ref`：打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享产物应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流 / harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 就可以在不运行旧工作流逻辑的情况下，验证较旧但可信的源提交。

配置档与 Docker 覆盖范围的映射如下：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时为必填

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖了重叠的 package / update / plugin 通道，而 Package Acceptance 则针对同一个已解析包 tarball 保留产物原生的 bundled-channel 兼容性、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖特定 OS 的新手引导、安装器和平台行为；package / update 产品验证应当从 Package Acceptance 开始。Windows 打包版和安装器全新安装通道还会验证：已安装包能否从原始绝对 Windows 路径导入 browser-control override。

Package Acceptance 对已发布包提供了一个有界的旧版兼容窗口，覆盖到 `2026.4.25`，包括 `2026.4.25-beta.*`。这些兼容处理会记录在此，避免它们变成永久性的静默跳过：如果 tarball 省略了这些文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；当包未暴露该标志时，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从基于 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可能允许配置元数据迁移，但仍要求安装记录以及“不重新安装”行为保持不变。`2026.4.25` 之后的包必须满足现代契约；同样条件届时会失败，而不是警告或跳过。

示例：

```bash
# 使用产品级覆盖范围验证当前 beta 包。
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

调试失败的包验收运行时，先从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重跑命令。优先重跑失败的包配置档或精确 Docker 通道，而不是重跑完整发布验证。

QA Lab 在主智能作用域工作流之外有专用的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动派发；它会将 mock parity gate、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道并行展开。实时作业使用 `qa-live-shared` 环境，Telegram / Discord 使用 Convex 租约。Matrix 在定时和发布门禁中使用 `--profile fast`，只有在检出的 CLI 支持时才附加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 派发总是会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认 dry-run，只有当 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已合并，并验证每个重复 PR 要么共享被引用的问题，要么具有重叠的变更块。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时调度：`main` 上一次成功的非机器人 push CI 运行可以触发它，手动派发也可以直接运行它。工作流运行触发在 `main` 已继续前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时会跳过。真正运行时，它会审查从上一个未跳过 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行就可以覆盖自上次文档处理以来累积在 main 上的所有变更。

`Test Performance Agent` 工作流是一个面向慢测试的事件驱动 Codex 维护通道。它没有纯定时调度：`main` 上一次成功的非机器人 push CI 运行可以触发它，但如果同一 UTC 日期已有另一个 workflow-run 调用已运行或正在运行，它就会跳过。手动派发会绕过这个按日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围、保持覆盖不变的测试性能修复，而不是大规模重构，然后重新运行完整测试套件报告，并拒绝任何导致通过基线测试数量下降的变更。如果基线中存在失败测试，Codex 只能修复明显失败项，且代理后的完整测试套件报告必须全部通过后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证补丁进行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 能与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅文档变更、已变更作用域、已变更扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产锁文件审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查以及可复用的下游产物 | Node 相关变更时 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled / plugin-contract / protocol 检查 | Node 相关变更时 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | Node 相关变更时 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | Node 相关变更时 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展通道 | Node 相关变更时 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、防护、测试类型和严格冒烟测试 | Node 相关变更时 |
| `check-additional` | 架构、边界、扩展表面防护、包边界和 gateway-watch 分片 | Node 相关变更时 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | Node 相关变更时 |
| `checks` | 已构建产物渠道测试的验证器 | Node 相关变更时 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟通道 | 用于发布的手动 CI 派发 |
| `check-docs` | 文档格式、lint 和坏链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更时 |
| `checks-windows` | Windows 特定的进程 / 路径测试，以及共享运行时导入说明符回归检查 | Windows 相关变更时 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | macOS 相关变更时 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | macOS 相关变更时 |
| `android` | 两种风味的 Android 单元测试，以及一个 debug APK 构建 | Android 相关变更时 |
| `test-performance-agent` | 在可信活动后，由 Codex 执行每日慢测试优化 | Main CI 成功后或手动派发 |

手动 CI 派发会运行与常规 CI 相同的作业图，但会强制开启所有按作用域控制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此某个发布候选的完整套件不会因为同一 ref 上的另一个 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方针对某个分支、标签或完整提交 SHA 运行该作业图，同时使用所选派发 ref 的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便让低成本检查先失败，再运行高开销作业：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者可以在共享构建就绪后立即开始。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动派发会跳过 changed-scope 检测，并让 preflight 清单表现得如同每个按作用域控制的区域都发生了变更。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些改动就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对对应平台源代码变更生效。
仅涉及 CI 路由的编辑、部分精选的低成本 core-test fixture 编辑，以及狭窄的插件契约 helper / test-routing 编辑，会走快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前变更文件仅限于快速任务可直接覆盖的路由或 helper 表面时，该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片以及附加防护矩阵。
Windows Node 检查的作用域仅限于 Windows 特定的进程 / 路径包装器、npm / pnpm / UI 运行器 helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试改动仍保留在 Linux Node 通道中，这样就不会为已由常规测试分片覆盖的内容占用一台 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个作用域脚本。它将冒烟测试覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / package 表面、内置插件 package / manifest 变更，以及 Docker 冒烟作业会覆盖到的 core plugin / channel / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码级的内置插件改动、仅测试改动和仅文档改动不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器化 gateway-network e2e，验证一个内置扩展 build arg，并在总命令超时 240 秒内运行受限的内置插件 Docker 配置档，同时每个场景的 Docker 运行也分别有上限。完整路径则保留 QR package 安装以及 installer Docker / update 覆盖，用于每晚定时运行、手动派发、workflow-call 发布检查，以及真正触及 installer / package / Docker 表面的拉取请求。推送到 `main`，包括合并提交，不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，工作流仍只保留快速 Docker 冒烟测试，而将完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试通过 `run_bun_global_install_smoke` 单独控制；它会在夜间计划任务中运行，也会从发布检查工作流运行，手动 `install-smoke` 派发也可以选择启用，但拉取请求和 `main` push 不会运行它。QR 和 installer Docker 测试保留它们各自以安装为中心的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于 installer / update / plugin-dependency 通道的裸 Node / Git 运行器，另一个是将同一个 tarball 安装到 `/app` 的功能镜像，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行通道；主池默认槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾池默认槽位数也是 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 过载，而较轻的通道仍可填满可用槽位。单个比有效上限更重的通道仍然可以从空池启动，然后独占运行直到释放容量。默认会将通道启动错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合器会先对 Docker 做预检查，移除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于检查调度器。默认在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的实时 / 尾部通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行调度器中的精确通道，包括仅发布时使用的通道，如 `install-e2e`，以及拆分后的内置更新通道，如 `bundled-channel-update-acpx`，同时会跳过清理冒烟测试，以便智能体复现某个失败通道。可复用的实时 / E2E 工作流会先询问 `scripts/test-docker-all.mjs --plan-json` 需要什么 package、镜像种类、实时镜像、通道以及凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或者下载当前运行的 package 产物，或者从 `package_artifact_run_id` 下载 package 产物；验证 tarball 清单；当计划需要已安装 package 的通道时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package-digest 标记的 bare / functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入，或复用现有的 package-digest 镜像，而不是重新构建。`Package Acceptance` 工作流是高层级 package 门禁：它从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流产物中解析出一个候选包，然后将这个单一的 `package-under-test` 产物传给可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，这样当前的验收逻辑就可以在不检出旧工作流代码的情况下验证较早的可信提交。发布检查会针对目标 ref 运行一个自定义的 Package Acceptance 增量：针对已解析 tarball 的 bundled-channel 兼容性、离线插件 fixture，以及 Telegram package QA。发布路径 Docker 套件会运行四个分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取它需要的镜像种类，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-runtime|bundled-channels`）。当请求完整的发布路径覆盖时，OpenWebUI 会并入 `plugins-runtime`，只有在仅 OpenWebUI 派发时才保留独立的 `openwebui` 分块。`package-update` 分块会将 installer E2E 拆分为 `install-e2e-openai` 和 `install-e2e-anthropic`；`install-e2e` 仍保留为手动重跑时的聚合别名。`bundled-channels` 分块会运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道；`plugins-integrations` 仍保留为手动重跑时使用的旧版聚合别名。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每个通道的重跑命令。工作流输入 `docker_lanes` 会让选定通道针对已准备好的镜像运行，而不是走分块作业；这样可以将失败通道的调试限制在一个定向 Docker 作业内，并为该次运行准备、下载或复用 package 产物；如果选定通道是实时 Docker 通道，则该定向作业会为这次重跑在本地构建 live-test 镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备好的镜像输入，因此失败通道可以复用失败运行中的精确 package 和镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行下载 Docker 产物，并打印组合 / 每通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢通道和阶段关键路径摘要。计划中的实时 / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor 修复过程可以与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。与宽泛的 CI 平台作用域相比，这个本地检查门禁在架构边界上更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint / guards；core 仅测试变更只运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展仅测试变更会运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或 plugin-contract 变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展扫测仍属于显式测试工作。仅涉及发布元数据的版本号提升会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先方式回退到所有检查通道。

手动 CI 派发会运行 `checks-node-compat-node22`，作为发布候选兼容性覆盖。常规拉取请求和 `main` push 会跳过该通道，并让矩阵聚焦于 Node 24 测试 / 渠道通道。

最慢的 Node 测试家族会被拆分或平衡，以便每个作业都保持较小规模，同时避免过度预留 runner：渠道契约会作为三个加权分片运行，内置插件测试会在六个扩展 worker 之间平衡分配，较小的 core 单元通道会成对组合，auto-reply 会作为四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 以及 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置会分布到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。范围较广的 browser、QA、media 和杂项插件测试会使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组使用一个 Vitest worker，并配合更大的 Node 堆，这样以导入为主的大批量插件测试就不会额外创建更多 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度主导，而不是由某个单独的慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与过滤后的分片。`check-additional` 会将 package-boundary 的编译 / canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖拆分开；boundary guard 分片会在一个作业内并发运行其小型独立防护项。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内部并发运行，并保留它们原有的检查名称作为轻量级验证器作业，从而避免额外占用两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方风味没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS / call-log BuildConfig 标志编译该风味，同时避免在每次与 Android 相关的 push 上重复执行 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有较新的 push 到达时，GitHub 可能会将已被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已被更新运行取代后继续排队。

自动 CI 并发键采用带版本的形式（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵更早进入队列 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍足够敏感，以至于 8 vCPU 的成本高于收益；install-smoke Docker 构建也是如此，32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道运行变更相关的 typecheck / lint / guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同一套门禁，但带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链接
pnpm build          # 当 CI 产物 / build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最新一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

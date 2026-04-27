---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T13:09:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99e77bcfda3eeb3cc9e3e10640af0452e1e4ad9fa31f2c3e80617b16ca9c9a51
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围界定，在仅有不相关区域发生变更时跳过高开销作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围界定，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是用于“发布前运行全部内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks`，以执行安装冒烟测试、包验收、Docker 发布路径套件、实时 / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。它还可以在提供已发布包规格时运行发布后的 `NPM Telegram Beta E2E` 工作流。这个总控流程会记录已触发的子运行 id，而最终的 `Verify full validation` 作业会重新检查当前子运行的结论。如果某个子工作流被重新运行并转为绿色，只需重新运行父级验证器作业即可刷新总控结果。

`Package Acceptance` 是用于验证包构件的侧路工作流，不会阻塞发布工作流。它从已发布的 npm 规格、使用所选 `workflow_ref` harness 构建的受信任 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 构件里解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，针对该 tarball 运行，而不是重新打包工作流检出的代码。配置档覆盖 smoke、package、product、full 以及自定义 Docker 通道选择。`package` 配置档使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性限制。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 构件，而已发布 npm 规格路径则保留用于独立触发场景。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，请使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证的是源代码树，而包验收验证的是单个 tarball 是否能通过用户在安装或更新后实际使用的同一套 Docker E2E harness。

该工作流有四个作业：

1. `resolve_package` 会检出 `workflow_ref`，解析一个包候选，将 `.artifacts/docker-e2e-package/openclaw-current.tgz` 和 `.artifacts/docker-e2e-package/package-candidate.json` 写入磁盘，将二者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中输出来源、工作流引用、包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 会调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 与 `package_artifact_name=package-under-test`。该可复用工作流会下载该构件、验证 tarball 清单、在需要时准备基于包摘要的 Docker 镜像，并针对该包运行所选 Docker 通道，而不是打包工作流检出的代码。
3. `package_telegram` 会按需调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时它会运行；如果 Package Acceptance 已解析出一个包，它会安装相同的 `package-under-test` 构件；独立触发的 Telegram 流程仍然可以安装一个已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时将整个工作流标记为失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 的验收。
- `source=ref`：打包一个受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享构件应当提供。

请将 `workflow_ref` 与 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流 / harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样，当前测试 harness 就能验证较旧但受信任的源提交，而无需运行旧版工作流逻辑。

配置档与 Docker 覆盖的对应关系如下：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：包含 OpenWebUI 的完整 Docker 发布路径分片
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必须提供

发布检查会以如下参数调用 Package Acceptance：`source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'`，以及 `telegram_mode=mock-openai`。发布路径 Docker 分片会覆盖重叠的 package / update / plugin 通道，而 Package Acceptance 则会针对同一个已解析包 tarball，保留原生构件层面的 bundled-channel 兼容性、离线插件以及 Telegram 验证。跨操作系统发布检查仍会覆盖特定操作系统的新手引导、安装器和平台行为；包 / 更新产品验证应当从 Package Acceptance 开始。Windows 打包版和安装器全新安装通道还会验证：已安装的包能否从原始绝对 Windows 路径导入浏览器控制覆盖项。

Package Acceptance 对已发布包提供了一个有界的旧版兼容窗口，覆盖至 `2026.4.25`，包括 `2026.4.25-beta.*`。这些放宽条件在此处有文档记录，以免它们永久变成静默跳过：如果 tarball 省略了这些文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能只会发出警告；当包未暴露该标志时，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能会允许配置元数据迁移，同时仍要求安装记录和不重复安装行为保持不变。`2026.4.25` 之后的包必须满足现代契约；相同条件届时会失败，而不是发出警告或跳过。

示例：

```bash
# 使用产品级覆盖验证当前 beta 包。
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

# 验证一个 tarball URL。对于 source=url，SHA-256 为必填项。
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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时以及重跑命令。优先重跑失败的包配置档或精确 Docker 通道，而不是重跑完整发布验证。

QA Lab 在主智能范围界定工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将模拟 parity gate、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道作为并行作业展开。实时作业使用 `qa-live-shared` environment，而 Telegram / Discord 使用 Convex 租约。Matrix 在定时和发布门禁中使用 `--profile fast`，并且仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍然是 `all`；手动 `matrix_profile=all` 触发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行对发布至关重要的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认是 dry-run，仅当 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已被合并，并验证每个重复 PR 都具有共享的引用 issue 或重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已落地的变更保持一致。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。workflow-run 调用会在 `main` 已继续前进，或最近一小时内已创建另一个未被跳过的 Docs Agent 运行时跳过。它运行时会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时的一次运行即可覆盖自上次文档处理后累计的所有 `main` 变更。

`Test Performance Agent` 工作流是一个面向慢测试的事件驱动 Codex 维护通道。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当日 UTC 内已有另一个 workflow-run 调用已经运行或正在运行，它就会跳过。手动触发会绕过这个按日活动门禁。该通道会构建完整套件的分组 Vitest 性能报告，让 Codex 只做小规模、保持覆盖率不变的测试性能修复，而不是进行大范围重构；随后它会重新运行完整套件报告，并拒绝任何导致通过的基线测试数量下降的变更。如果基线中已有失败测试，Codex 只能修复明显故障，而且代理执行后的完整套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该通道会变基已验证补丁、重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 能与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 目的 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅有文档变更、已变更范围、已变更扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 执行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm advisories 执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游构件 | Node 相关变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled / plugin-contract / protocol 检查 | Node 相关变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | Node 相关变更 |
| `checks-node-extensions` | 在扩展套件中执行完整的内置插件测试分片 | Node 相关变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置插件、契约和扩展通道 | Node 相关变更 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格冒烟测试 | Node 相关变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | Node 相关变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | Node 相关变更 |
| `checks` | 已构建构件渠道测试的验证器 | Node 相关变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟通道 | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | Python Skills 相关变更 |
| `checks-windows` | Windows 特定的进程 / 路径测试，以及共享运行时导入说明符回归测试 | Windows 相关变更 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试通道 | macOS 相关变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | macOS 相关变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | Android 相关变更 |
| `test-performance-agent` | 在可信活动之后每日运行的 Codex 慢测试优化 | Main CI 成功后或手动触发 |

手动 CI 触发会运行与常规 CI 相同的作业图，但会强制开启所有范围限定通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此某个发布候选版本的完整套件不会因为同一 ref 上的另一项 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许受信任调用方针对某个分支、标签或完整提交 SHA 运行这张作业图，同时使用所选触发 ref 对应的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

这些作业的排列方式是：先让廉价检查失败，再运行昂贵作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的构件和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行进行，这样下游消费者就能在共享构建就绪后立即启动。
4. 之后再展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动触发会跳过变更范围检测，并让 preflight 清单表现得像所有受范围限制的区域都发生了变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源代码变更生效。

仅涉及 CI 路由的编辑、选定的低成本 core-test fixture 编辑，以及窄范围的插件契约 helper / 测试路由编辑，会走快速 Node-only 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或 helper 表面时，这一路径会避免构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片以及额外守卫矩阵。

Windows Node 检查的范围仅限于 Windows 特定的进程 / 路径包装器、npm / pnpm / UI 运行器 helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、install-smoke 和仅测试变更仍保留在 Linux Node 通道中，这样它们就不会为了已由常规测试分片覆盖的内容而占用 16 vCPU 的 Windows worker。

单独的 `install-smoke` 工作流通过它自己的 `preflight` 作业复用相同的范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / package 表面、内置插件 package / manifest 变更，以及 Docker 冒烟作业会覆盖到的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行 agents delete shared-workspace CLI 冒烟测试、运行容器 `gateway-network` e2e、验证一个内置扩展 build arg，并在总命令超时 240 秒的限制下运行有界的内置插件 Docker 配置档，同时每个场景的 Docker 运行也分别设有上限。完整路径则为夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及安装器 / package / Docker 表面的拉取请求保留 QR package install 和 installer Docker / update 覆盖。推送到 `main`（包括合并提交）不会强制完整路径；当变更范围逻辑会在 push 上请求完整覆盖时，该工作流仍只保留快速 Docker 冒烟测试，并将完整安装冒烟测试留给夜间任务或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独控制；它会在夜间定时任务和发布检查工作流中运行，手动 `install-smoke` 触发也可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试仍保留各自专用的、以安装为中心的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于安装器 / 更新 / 插件依赖通道的裸 Node / Git 运行器，另一个是功能型镜像，它会将同一个 tarball 安装到 `/app` 中，供常规功能通道使用。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而运行器只执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行这些通道；主池默认槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾部池默认槽位数也为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，从而避免 npm install 和多服务通道对 Docker 资源过度争用，同时让较轻的通道仍能填满可用槽位。单个比有效上限更重的通道仍然可以从空池启动，然后独占运行直到释放容量。默认情况下，各通道启动会错开 2 秒，以避免本地 Docker 守护进程在创建容器时出现风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合任务会预检查 Docker、移除陈旧的 OpenClaw E2E 容器、输出活跃通道状态、持久化通道耗时以支持“最长优先”排序，并支持使用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 来检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live / tail 通道使用更严格的每通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布使用的通道，例如 `install-e2e`，以及拆分后的内置更新通道，例如 `bundled-channel-update-acpx`，同时跳过清理冒烟测试，以便智能体复现某个失败通道。可复用的 live / E2E 工作流会先询问 `scripts/test-docker-all.mjs --plan-json`，确定需要哪种 package、镜像类型、live 镜像、通道和凭证覆盖范围，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载当前运行的 package 构件，或者从 `package_artifact_run_id` 下载 package 构件；验证 tarball 清单；当计划需要已安装 package 的通道时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package 摘要标签的 bare / functional GHCR Docker E2E 镜像；并在提供了 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入或已存在 package 摘要镜像时复用它们，而不是重新构建。`Package Acceptance` 工作流是高层级的包门禁：它从 npm、受信任的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流构件中解析出一个候选包，然后将这个单独的 `package-under-test` 构件传给可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，因此当前的验收逻辑可以验证较旧的受信任提交，而无需检出旧版工作流代码。发布检查会针对目标 ref 运行一个自定义的 Package Acceptance 增量：内置渠道兼容性、离线插件 fixture，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行四个分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，使每个分块只拉取自己所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-runtime|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，它会被并入 `plugins-runtime`，而仅在只触发 OpenWebUI 的情况下保留独立的 `openwebui` 分块。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道；`plugins-integrations` 仍然是供手动重跑使用的旧版聚合别名。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表格，以及每通道重跑命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行所选通道，而不是运行分块作业，这样失败通道的调试就被限制在一个有针对性的 Docker 作业内，并会为该次运行准备、下载或复用 package 构件；如果所选通道是 live Docker 通道，这个定向作业会在本地为该次重跑构建 live-test 镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备好的镜像输入，因此失败通道可以复用失败运行中的完全相同 package 和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从某个 GitHub 运行下载 Docker 构件，并打印组合 / 每通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可输出慢通道和阶段关键路径摘要。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor 修复过程可以与其他内置检查一起分片运行。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门禁比宽泛的 CI 平台范围更严格地约束架构边界：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint / 守卫；core 仅测试变更只运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展仅测试变更会运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展全量扫描属于显式测试工作。仅发布元数据的版本号变更会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以安全优先的方式退回到所有检查通道。

手动 CI 触发会运行 `checks-node-compat-node22`，作为发布候选版本的兼容性覆盖。常规拉取请求和 `main` 推送会跳过该通道，并让矩阵聚焦于 Node 24 测试 / 渠道通道。

最慢的 Node 测试族已被拆分或重新平衡，因此每个作业都能保持较小规模，同时不会过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个扩展 worker 间做负载均衡，小型 core 单元通道会成对组合，auto-reply 以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch，以及 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分散到现有的仅源码 agentic Node 作业中运行，而不是等待构建产物。广泛的 browser、QA、media 和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并分配更大的 Node 堆，这样导入开销较重的插件批次就不会额外制造更多 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入 / 调度影响，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独占尾部。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与经过筛选的分片。`check-additional` 会把 package-boundary compile / canary 工作保留在一起，并将 runtime topology 架构与 Gateway 网关 watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其较小且相互独立的守卫。Gateway 网关 watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量验证器作业，同时避免额外两个 Blacksmith worker 以及第二条构件消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS / call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 上最新的运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已被新运行取代后继续排队。

自动 CI 并发键采用带版本的形式（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞更新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

## Runners

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 节省的成本抵不过损失；install-smoke Docker 构建，其中 32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道运行变更相关的 typecheck / lint / 守卫
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速守卫
pnpm check:test-types
pnpm check:timed    # 同一门禁，但输出每阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本智能变更 Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 构建产物 / build-smoke 通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪音并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

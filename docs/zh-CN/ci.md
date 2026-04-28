---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-28T02:58:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac508419450f6b68f0cf5c85f9eb8dc5f208288778ef5304db3e39be90f3eab6
    source_path: ci.md
    workflow: 15
---

CI 会在每次向 `main` 推送以及每个拉取请求上运行。它使用智能范围界定，在只有无关区域发生变更时跳过高成本作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围界定，并展开完整的常规 CI 作业图，用于候选发布或广泛验证。

`Full Release Validation` 是一个手动总控工作流，用于“在发布前运行所有内容”。它接受分支、标签或完整提交 SHA，使用该目标派发手动 `CI` 工作流，并派发 `OpenClaw Release Checks` 以执行安装冒烟测试、包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 测试通道。如果提供了已发布的软件包规范，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的 live/提供商覆盖范围：`minimum` 保留最快的、对发布至关重要的 OpenAI/核心测试通道，`stable` 会加入稳定的提供商/后端集合，而 `full` 会运行更广泛的咨询性提供商/媒体矩阵。该总控工作流会记录所派发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行的结论，并为每个子运行附加最慢作业表。如果某个子工作流重新运行后变为绿色，只需重新运行父级验证作业即可刷新总控结果和耗时摘要。

在恢复场景中，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。候选发布使用 `all`，仅重新运行常规完整 CI 子项使用 `ci`，所有发布子项使用 `release-checks`，或者使用更窄的发布分组：在总控工作流上可选 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在进行有针对性的修复后，将失败的发布环境重跑限制在合理范围内。

发布 live/E2E 子工作流仍然保留广泛的原生 `pnpm test:live` 覆盖，但它不是作为一个串行作业运行，而是通过 `scripts/test-live-shard.mjs` 将其拆分为具名分片运行：`native-live-src-agents`、`native-live-src-gateway-core`、按提供商筛选的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分后的媒体音频/视频分片，以及按提供商筛选的音乐分片。这样既保持了相同的文件覆盖范围，也更容易对耗时较长的 live 提供商失败进行重跑和诊断。聚合后的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重跑。

`OpenClaw Release Checks` 使用受信任的工作流引用，将所选引用一次性解析为 `release-package-under-test` tarball，然后把该制品传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以在各个发布环境之间保持软件包字节一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是一个侧边运行的工作流，用于验证软件包制品，而不会阻塞发布工作流。它可以从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 制品中解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，针对该 tarball 运行，而不是重新打包工作流检出内容。其配置档覆盖 smoke、package、product、full 以及自定义 Docker 测试通道选择。`package` 配置档使用离线插件覆盖，因此已发布软件包的验证不会被 live ClawHub 可用性所阻塞。可选的 Telegram 测试通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 制品，而已发布 npm 规范路径则保留给独立派发场景。

## 包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，请使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证的是源代码树，而包验收验证的是单个 tarball，方式是通过用户在安装或更新后实际会经历的同一套 Docker E2E harness。

该工作流包含四个作业：

1. `resolve_package` 会检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 制品上传，并在 GitHub 步骤摘要中输出来源、工作流引用、软件包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 会使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。该可复用工作流会下载该制品、验证 tarball 清单、在需要时准备 package-digest Docker 镜像，并针对该软件包而不是工作流检出内容打包后运行所选 Docker 测试通道。当某个配置档选择了多个定向 `docker_lanes` 时，可复用工作流会先准备一次软件包和共享镜像，然后将这些测试通道展开为并行的定向 Docker 作业，并生成各自唯一的制品。
3. `package_telegram` 会按需调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时它会运行；如果 `Package Acceptance` 已解析出一个软件包，它将安装同一个 `package-under-test` 制品；独立的 Telegram 派发仍然可以安装已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 测试通道失败时使整个工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或某个发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 为可选，但对于外部共享制品应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样，当前测试 harness 就可以在不运行旧工作流逻辑的情况下，验证较早但仍受信任的源提交。

配置档与 Docker 覆盖范围的映射如下：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：完整 Docker 发布路径分块，加上 OpenWebUI
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时为必填

发布检查会使用以下参数调用 Package Acceptance：`source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai`。发布路径 Docker 分块覆盖了重叠的软件包/更新/插件测试通道，而 Package Acceptance 则针对同一个已解析的软件包 tarball，提供原生制品层面的 bundled-channel 兼容性、离线插件和 Telegram 验证。跨操作系统发布检查仍然覆盖与操作系统相关的新手引导、安装器和平台行为；软件包/更新产品验证应从 Package Acceptance 开始。Windows 打包版与安装器全新安装测试通道也会验证：已安装的软件包是否能够从原始绝对 Windows 路径导入浏览器控制覆盖项。

Package Acceptance 为已发布的软件包保留了一个有界的旧版兼容窗口，截止到 `2026.4.25`，包括 `2026.4.25-beta.*`。这些放宽条件记录在此，避免它们成为永久性的静默跳过：如果 tarball 省略了这些文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；当软件包未暴露该标志时，`doctor-switch` 可能跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从基于 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并且可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能允许配置元数据迁移，同时仍要求安装记录和“不重新安装”行为保持不变。`2026.4.25` 之后的软件包必须满足现代契约；相同条件届时将失败，而不再只是警告或跳过。

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

在调试失败的包验收运行时，先查看 `resolve_package` 摘要，以确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 制品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、测试通道日志、阶段耗时以及重跑命令。优先重跑失败的包配置档或精确的 Docker 测试通道，而不是重跑完整发布验证。

QA Lab 在主智能范围界定工作流之外有专门的 CI 测试通道。`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动派发；它会将模拟一致性门、live Matrix 测试通道，以及 live Telegram 和 Discord 测试通道作为并行作业展开。live 作业使用 `qa-live-shared` 环境，而 Telegram/Discord 使用 Convex 租约。Matrix 在计划任务和发布门中使用 `--profile fast`，并且仅在当前检出的 CLI 支持时才附加 `--fail-fast`。CLI 默认值和手动工作流输入仍然是 `all`；手动 `matrix_profile=all` 派发始终会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行对发布至关重要的 QA Lab 测试通道；其 QA 一致性门会将候选包和基线包作为并行测试通道作业运行，然后把两个制品下载到一个小型报告作业中，以进行最终的一致性比较。

`Duplicate PRs After Merge` 工作流是一个供维护者手动使用的工作流，用于合并后的重复 PR 清理。它默认执行 dry-run，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 确实已合并，并验证每个重复 PR 都满足以下条件之一：要么共享某个被引用的问题，要么存在重叠的变更 hunk。

`CodeQL` 工作流被有意设计为一个范围较窄的首轮扫描器，而不是对整个仓库进行全面扫描。每日运行和手动运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关相关范围。关键安全测试通道使用高精度安全查询，而单独的关键质量测试通道仅在同一狭窄的 JavaScript/TypeScript 范围上运行错误严重级别的非安全查询。Swift、Android、Python、UI 和内置插件的 CodeQL 扩展应仅在该狭窄配置具有稳定运行时和稳定信号之后，再作为有范围限制或分片的后续工作逐步加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护测试通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的推送 CI 运行可以触发它，也可以通过手动派发直接运行。对于 workflow-run 调用，当 `main` 已经继续前进，或者过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行时，它会跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行就可以覆盖自上次文档处理以来累积到 `main` 上的所有变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护测试通道，用于处理慢测试。它也没有纯定时调度：在 `main` 上一次成功的、非机器人触发的推送 CI 运行可以触发它，但如果同一个 UTC 日期内已经有另一个 workflow-run 调用已运行或正在运行，它就会跳过。手动派发会绕过这个按日活动门控。该测试通道会构建完整测试套件的分组 Vitest 性能报告，让 Codex 只做小范围、保持覆盖率不变的测试性能修复，而不是进行大规模重构，然后重新运行完整测试套件报告，并拒绝任何导致通过的基线测试数量减少的变更。如果基线中存在失败测试，Codex 只能修复明显的问题，并且代理处理后的完整测试套件报告必须通过，之后才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该测试通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅文档变更、变更范围、变更的扩展，并构建 CI 清单 | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit` | 针对 npm advisories 执行不安装依赖的生产 lockfile 审计 | 始终在非草稿推送和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合项 | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建制品检查，以及可复用的下游制品 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性测试通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展测试通道 | 与 Node 相关的变更 |
| `check` | 分片后的主本地门控等效项：生产类型、lint、防护、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面防护、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建制品渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟测试通道 | 用于发布的手动 CI 派发 |
| `check-docs` | 文档格式、lint 和坏链检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归测试 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建制品的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在受信任活动后进行按日运行的 Codex 慢测试优化 | `main` CI 成功后或手动派发 |

手动 CI 派发运行的作业图与常规 CI 相同，但会强制开启所有按范围控制的测试通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发分组，因此某个候选发布的完整套件不会因为同一 ref 上的另一次推送或 PR 运行而被取消。可选的 `target_ref` 输入允许受信任调用方在使用所选派发 ref 的工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业顺序经过安排，使便宜的检查先失败，而不是等高成本作业运行后才失败：

1. `preflight` 决定到底存在哪些测试通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的制品和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 测试通道并行运行，这样下游消费者就可以在共享构建就绪后立刻开始。
4. 更重的平台和运行时测试通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动派发会跳过 changed-scope 检测，并使预检清单表现得像所有按范围控制的区域都发生了变更一样。CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台测试通道仍然只由平台源代码变更触发。

仅涉及 CI 路由的编辑、选定的低成本核心测试 fixture 编辑，以及范围较窄的插件契约辅助函数/测试路由编辑，会走快速 Node-only 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于这些由快速任务直接覆盖的路由或辅助表面时，该路径会避开构建制品、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外的防护矩阵。

Windows Node 检查的范围仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI runner 辅助函数、包管理器配置，以及执行该测试通道的 CI 工作流表面；无关的源代码、插件、install-smoke 和纯测试变更会保留在 Linux Node 测试通道上，这样就不会为了已由常规测试分片覆盖的内容而占用 16 vCPU 的 Windows worker。

独立的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/软件包表面、内置插件软件包/manifest 变更，以及 Docker smoke 作业所覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面，会运行快速路径。仅源代码的内置插件变更、纯测试编辑和纯文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 `gateway-network` e2e，验证一个内置扩展 build arg，并在总计 240 秒的命令超时限制下运行有界的内置插件 Docker 配置档，其中每个场景的 Docker run 还分别受到单独限制。完整路径则保留 QR 软件包安装以及安装器 Docker/更新覆盖，用于夜间定时运行、手动派发、workflow-call 发布检查，以及真正触及安装器/软件包/Docker 表面的拉取请求。向 `main` 的推送，包括合并提交，不会强制完整路径；当 changed-scope 逻辑在推送场景下本会请求完整覆盖时，该工作流仍只保留快速 Docker smoke，并将完整安装 smoke 留给夜间任务或发布验证。较慢的 Bun 全局安装 image-provider smoke 通过 `run_bun_global_install_smoke` 单独控制；它会在夜间计划任务和发布检查工作流中运行，手动 `install-smoke` 派发也可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留了各自专注于安装的 Dockerfile。

本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于安装器/更新/插件依赖测试通道的纯 Node/Git runner，另一个是功能镜像，它会把同一个 tarball 安装到 `/app` 中，供常规功能测试通道使用。Docker 测试通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而运行器只执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个测试通道选择镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行这些测试通道；主池默认槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对提供商敏感的尾部池默认槽位数也为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型测试通道上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务测试通道就不会过度占用 Docker，同时较轻的测试通道仍可填满可用槽位。单个测试通道如果比当前有效上限更重，仍然可以在池为空时启动，然后独占运行直到释放容量。为避免本地 Docker daemon 在创建阶段出现风暴，默认会将各测试通道启动错开 2 秒；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。该本地聚合流程会预先检查 Docker，移除过期的 OpenClaw E2E 容器，输出活动测试通道状态，持久化测试通道耗时以支持“最长优先”排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以检查调度器行为。默认情况下，它会在首次失败后停止调度新的池化测试通道；每个测试通道有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 测试通道使用更严格的逐测试通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器测试通道，包括仅发布时使用的测试通道，如 `install-e2e`，以及拆分后的内置更新测试通道，如 `bundled-channel-update-acpx`，同时跳过清理 smoke，以便智能体复现某个失败的测试通道。

可复用的 live/E2E 工作流会通过 `scripts/test-docker-all.mjs --plan-json` 询问需要哪种软件包、镜像类型、live 镜像、测试通道和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它可以通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的软件包制品，或从 `package_artifact_run_id` 下载软件包制品；验证 tarball 清单；当计划需要已安装软件包的测试通道时，通过 Blacksmith 的 Docker layer cache 构建并推送以 package-digest 标记的 bare/functional GHCR Docker E2E 镜像；并在已有 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有 package-digest 镜像可用时直接复用，而不是重新构建。

`Package Acceptance` 工作流是高层级的软件包门控：它从 npm、受信任的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流制品中解析一个候选软件包，然后将这一个 `package-under-test` 制品传入可复用的 Docker E2E 工作流。它会将 `workflow_ref` 与 `package_ref` 分开，这样当前的验收逻辑就可以在不检出旧工作流代码的情况下验证较早但受信任的提交。发布检查会针对目标 ref 运行一个自定义的 Package Acceptance 增量：基于已解析 tarball 的 bundled-channel 兼容性、离线插件 fixture，以及 Telegram 软件包 QA。发布路径 Docker 套件以更小的分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，使每个分块只拉取其所需的镜像类型，并通过同一个加权调度器执行多个测试通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`）。当请求完整发布路径覆盖时，OpenWebUI 会并入 `plugins-runtime-core`，并且只有在仅针对 OpenWebUI 的派发中才保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime` 和 `plugins-integrations` 仍然可用于手动一次性重跑，但发布工作流使用拆分后的分块，这样安装器 E2E 和内置插件安装/卸载全量检查就不会主导关键路径。`install-e2e` 测试通道别名仍然是两个提供商安装器测试通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 测试通道，而不是串行的一体化 `bundled-channel-deps` 测试通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含测试通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢测试通道表，以及每个测试通道的重跑命令。工作流 `docker_lanes` 输入会让所选测试通道针对已准备好的镜像运行，而不是走分块作业，这样失败测试通道的调试就能限制在一个定向 Docker 作业内，并为该次运行准备、下载或复用软件包制品；如果所选测试通道是 live Docker 测试通道，则该定向作业会为此次重跑在本地构建 live-test 镜像。生成的逐测试通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备好的镜像输入，这样失败的测试通道就可以复用失败运行中的完全相同的软件包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行下载 Docker 制品，并输出组合/逐测试通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢测试通道和阶段关键路径摘要。定时的 live/E2E 工作流会每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 doctor 修复过程可以与其他内置检查一起分片运行。

当前的发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-core`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重跑，但发布工作流使用拆分后的分块，这样渠道 smoke、更新目标以及设置/运行时契约检查就可以并行运行。定向的 `docker_lanes` 派发也会在一次共享的软件包/镜像准备步骤之后，将多个所选测试通道拆分为并行作业；而 bundled-channel 更新测试通道在遇到瞬时 npm 网络失败时会重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。该本地检查门控在架构边界方面比广义的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试 typecheck，以及核心 lint/guards；核心纯测试变更只运行核心测试 typecheck 和核心 lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展纯测试变更会运行扩展测试 typecheck 和扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为各扩展依赖这些核心契约，但 Vitest 扩展全量扫描仍属于显式测试工作。仅发布元数据的版本升级会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先的方式回退到所有检查测试通道。

手动 CI 派发会运行 `checks-node-compat-node22`，作为候选发布的兼容性覆盖。常规拉取请求和 `main` 推送会跳过该测试通道，并让矩阵聚焦于 Node 24 测试/渠道测试通道。

最慢的 Node 测试族会被拆分或重新均衡，以便每个作业都保持较小规模，同时不过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个扩展 worker 间做负载均衡，小型核心单元测试通道会成对组合，auto-reply 作为四个均衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关/插件配置会分布到现有的仅源码 agentic Node 作业中，而不是等待已构建制品。广泛的 browser、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配备更大的 Node heap，这样导入密集型插件批次就不会额外产生更多 CI 作业。广泛的 agents 测试通道使用共享的 Vitest 文件级并行调度器，因为它的瓶颈在于导入/调度，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独占尾部耗时。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与某个过滤后的分片。`check-additional` 会将 package-boundary compile/canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片会在一个作业内部并发运行其小型独立防护项。Gateway 网关 watch、渠道测试以及核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行；这样既保留了它们原有的检查名称作为轻量验证作业，又避免了额外占用两个 Blacksmith worker 和第二条制品消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源集或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的推送上重复执行 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有新的推送到来时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 `main` 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建也是如此，32 vCPU 的排队时间成本高于它带来的收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效项

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界测试通道执行变更相关的 typecheck/lint/guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门控，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 制品/build-smoke 测试通道相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main 推送 CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声并选择 origin/main 推送 CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

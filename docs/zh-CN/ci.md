---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T22:50:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bc5befeb5ad84227dd8b36f4ee3b91166c9e5c4417eacb82f9500d568359558
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围划分，只在相关区域发生变更时运行昂贵作业；如果只是无关区域变更，则会跳过这些作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围划分，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks`，以运行安装冒烟测试、包验收、Docker 发布路径测试套件、实时 / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 测试路径。如果提供了已发布的软件包规格，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。这个总控工作流会记录所触发的子运行 id，而最终的 `Verify full validation` 作业会重新检查当前各个子运行的结论。如果某个子工作流被重新运行并变为绿色，只需重新运行父级验证器作业即可刷新总控结果。

为便于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`；如果只想重新运行常规完整 CI 子工作流，使用 `ci`；如果想重新运行所有发布相关子工作流，使用 `release-checks`；也可以使用更窄的发布分组：在总控工作流中可选 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在针对性修复后，就能把失败发布测试环境的重跑范围控制在较小范围内。

发布用的实时 / E2E 子工作流仍保留广泛的原生 `pnpm test:live` 覆盖范围，但它会通过 `scripts/test-live-shard.mjs` 将其拆分为具名分片运行：`native-live-src-agents`、`native-live-src-gateway-core`、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z` 和 `native-live-extensions-media`，而不是作为一个串行作业运行。这样既保留相同的文件覆盖范围，也让耗时较长的实时提供商失败更容易重跑和诊断。

`Package Acceptance` 是一个旁路运行工作流，用于验证某个软件包制品，而不会阻塞发布工作流。它会从已发布的 npm 规格、使用所选 `workflow_ref` 测试框架构建的可信 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball 制品中解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，用这个 tarball 替代对工作流检出内容的重新打包。它支持 smoke、package、product、full 以及自定义 Docker 测试路径选择等配置档。`package` 配置档使用离线插件覆盖，因此已发布软件包的验证不依赖实时的 ClawHub 可用性。可选的 Telegram 测试路径会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 制品，而已发布 npm 规格的路径则保留给独立触发场景。

## 包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，请使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证的是源代码树，而包验收验证的是一个单独的 tarball，并通过用户在安装或更新后实际会走到的同一套 Docker E2E 测试框架进行验证。

该工作流包含四个作业：

1. `resolve_package` 会检出 `workflow_ref`，解析出一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 制品上传，并在 GitHub 步骤摘要中打印来源、工作流引用、软件包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 会调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。该可复用工作流会下载该制品，验证 tarball 清单，按需准备基于软件包摘要的 Docker 镜像，并针对该软件包而不是对工作流检出内容打包后运行所选 Docker 测试路径。当某个配置档选择了多个目标 `docker_lanes` 时，该可复用工作流会只准备一次软件包和共享镜像，然后将这些测试路径展开为并行的目标 Docker 作业，并为每个作业生成唯一制品。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时，它会运行；如果 `Package Acceptance` 已解析出一个软件包，它会安装同一个 `package-under-test` 制品；而独立触发的 Telegram 场景仍然可以安装已发布的 npm 规格。
4. `summary` 会在软件包解析、Docker 验收，或可选的 Telegram 测试路径失败时使整个工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 版本的验收。
- `source=ref`：打包一个可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或某个发布标签到达，在一个分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享制品，仍建议提供。

请将 `workflow_ref` 和 `package_ref` 分开理解。`workflow_ref` 是运行测试时使用的可信工作流 / 测试框架代码。`package_ref` 是在 `source=ref` 时实际被打包的源代码提交。这样，当前测试框架就可以验证较早但可信的源代码提交，而无需运行旧的工作流逻辑。

配置档与 Docker 覆盖范围的映射如下：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：在 `package` 基础上增加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确指定 `docker_lanes`；当 `suite_profile=custom` 时必须提供

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 来调用 Package Acceptance。发布路径中的 Docker 分块会覆盖重叠的软件包 / 更新 / 插件测试路径，而 Package Acceptance 则会针对同一个已解析的软件包 tarball，补充验证制品原生的 bundled-channel 兼容性、离线插件以及 Telegram 证明。跨操作系统的发布检查仍然覆盖特定于操作系统的新手引导、安装器和平台行为；而软件包 / 更新的产品级验证应从 Package Acceptance 开始。Windows 的打包版和安装器全新测试路径还会验证：已安装的软件包能否从原始的绝对 Windows 路径导入 browser-control override。

Package Acceptance 对已发布的软件包保留了一个有界的旧版兼容窗口，覆盖到 `2026.4.25`，包括 `2026.4.25-beta.*`。这些例外情况记录在这里，是为了避免它们变成永久性的静默跳过：如果 tarball 省略了这些文件，那么 `dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；如果软件包未暴露该标志，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从基于 tarball 派生的伪 git 夹具中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能允许配置元数据迁移，但仍要求安装记录及“不重新安装”行为保持不变。`2026.4.25` 之后的软件包必须满足现代契约；相同条件将不再是警告或跳过，而会直接失败。

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

当你调试失败的包验收运行时，请先查看 `resolve_package` 摘要，确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 制品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、测试路径日志、阶段耗时，以及重跑命令。优先重跑失败的软件包配置档或精确的 Docker 测试路径，而不是重跑完整发布验证。

QA Lab 在主智能范围工作流之外有专门的 CI 测试路径。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 的 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将 mock parity gate、实时 Matrix 测试路径，以及实时 Telegram 和 Discord 测试路径展开为并行作业。实时作业使用 `qa-live-shared` 环境，而 Telegram / Discord 使用 Convex 租约。Matrix 在定时和发布门禁中使用 `--profile fast`，并且仅在当前检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍然是 `all`；手动触发 `matrix_profile=all` 时，总会将完整的 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行对发布至关重要的 QA Lab 测试路径。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后清理重复 PR 的手动工作流。它默认是 dry-run，只有在 `apply=true` 时才会关闭被明确列出的 PR。在修改 GitHub 之前，它会先验证：已落地的 PR 确实已合并，并且每个重复 PR 都具有共享的引用 issue 或重叠的变更 hunk。

`CodeQL` 工作流有意被设计为一个范围较窄的首轮扫描器，而不是对整个仓库进行全面扫描。每日运行和手动运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript / TypeScript 凭证、密钥、沙箱隔离、cron 和 Gateway 网关相关区域。关键安全测试路径会对这些较窄的范围运行高精度安全查询，而独立的关键质量测试路径则仅对同样较窄的 JavaScript / TypeScript 范围运行错误级别的非安全查询。Swift、Android、Python、UI 以及内置插件的 CodeQL 扩展应仅在这个窄范围配置拥有稳定的运行时表现和信号后，再作为限定范围或分片的后续工作逐步加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护测试路径，用于让现有文档与最近已落地的变更保持一致。它没有单纯的定时调度：在 `main` 上成功完成的一次非机器人推送 CI 运行可以触发它，也可以通过手动触发直接运行。对于由 workflow-run 触发的调用，如果 `main` 已继续前进，或者在过去一小时内已创建过另一次未被跳过的 Docs Agent 运行，它就会跳过。当它运行时，会审查从上一次未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次运行就可以覆盖自上次文档处理以来累积到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个面向慢测试的事件驱动 Codex 维护测试路径。它没有单纯的定时调度：在 `main` 上成功完成的一次非机器人推送 CI 运行可以触发它，但如果当天 UTC 已经有另一次由 workflow-run 触发的调用正在运行或已经运行过，它就会跳过。手动触发会绕过这个按天限制的活动门禁。该测试路径会构建一份完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围、保持覆盖率不变的测试性能修复，而不是做大规模重构；然后重新运行完整测试套件报告，并拒绝任何导致通过基线测试数量下降的变更。如果基线中存在失败测试，Codex 只能修复明显的失败，并且在提交任何内容之前，智能体处理后的完整测试套件报告必须通过。当 `main` 在机器人推送落地前继续前进时，该测试路径会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，然后重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| --- | --- | --- |
| `preflight` | 检测仅文档变更、变更范围、已变更扩展，并构建 CI 清单 | 所有非草稿推送和 PR |
| `security-scm-fast` | 通过 `zizmor` 检测私钥和审计工作流 | 所有非草稿推送和 PR |
| `security-dependency-audit` | 针对 npm 公告执行无依赖的生产 lockfile 审计 | 所有非草稿推送和 PR |
| `security-fast` | 快速安全作业的必需聚合作业 | 所有非草稿推送和 PR |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建制品检查，以及可复用的下游制品 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性测试路径，例如 bundled / 插件契约 / 协议检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展测试路径 | 与 Node 相关的变更 |
| `check` | 分片后的主本地门禁等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建制品渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和 smoke 测试路径 | 为发布而进行的手动 CI 触发 |
| `check-docs` | 文档格式、lint 和损坏链接检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定进程 / 路径测试，以及共享运行时导入说明符回归测试 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建制品的 macOS TypeScript 测试路径 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一次 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后，按天运行的 Codex 慢测试优化 | `main` CI 成功后或手动触发 |

手动触发的 CI 会运行与常规 CI 相同的作业图，但会强制开启所有按范围控制的测试路径：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此某个发布候选版本的完整测试套件不会因为同一 ref 上的另一条推送或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方在使用所选 dispatch ref 的工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的排列顺序经过设计，以便让廉价检查先失败，再决定是否运行昂贵作业：

1. `preflight` 决定到底存在哪些测试路径。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不必等待更重的制品和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 测试路径并行运行，这样下游消费者就可以在共享构建准备好后立刻开始。
4. 更重的平台和运行时测试路径会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过变更范围检测，并让预检清单表现得像所有按范围控制的区域都发生了变更。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些改动就强制运行 Windows、Android 或 macOS 原生构建；这些平台测试路径仍然只对平台源码变更生效。
仅涉及 CI 路由的编辑、选定的廉价核心测试夹具编辑，以及狭窄的插件契约辅助函数 / 测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于快速任务可直接覆盖的路由或辅助层时，这条路径会避免构建制品、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片以及额外守卫矩阵。
Windows Node 检查的范围仅限于 Windows 特定的进程 / 路径封装、npm / pnpm / UI 运行器辅助函数、包管理器配置，以及执行该测试路径的 CI 工作流相关区域；无关的源码、插件、install-smoke 和仅测试改动会继续留在 Linux Node 测试路径上，这样就不会为了常规测试分片已经覆盖到的内容而占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / 软件包相关区域、内置插件软件包 / manifest 改动，以及 Docker smoke 作业会覆盖到的核心插件 / 渠道 / Gateway 网关 / 插件 SDK 区域，会运行快速路径。仅源码的内置插件改动、仅测试改动和仅文档改动不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器化的 gateway-network e2e，验证一个内置扩展 build arg，并在总计 240 秒的命令超时上限内运行受限的内置插件 Docker 配置档，同时每个场景的 Docker run 也分别有单独上限。完整路径则保留 QR 软件包安装和安装器 Docker / 更新覆盖，用于夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及安装器 / 软件包 / Docker 相关区域的拉取请求。推送到 `main`，包括合并提交，不会强制完整路径；当变更范围逻辑在一次推送中本会请求完整覆盖时，工作流仍只保留快速 Docker smoke，把完整 install smoke 留给夜间任务或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间定时任务和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择开启，但拉取请求和推送到 `main` 时不会运行它。QR 和安装器 Docker 测试继续使用各自专门的安装类 Dockerfile。本地 `test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 仅打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于安装器 / 更新 / 插件依赖测试路径的裸 Node / Git 运行器，另一个是功能镜像，会把同一个 tarball 安装到 `/app` 中，供常规功能测试路径使用。Docker 测试路径定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而运行器只执行所选计划。调度器会使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个测试路径选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行这些测试路径；主池默认并发槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾池默认并发槽位数也为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型测试路径上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务测试路径就不会让 Docker 过度超配，同时较轻的测试路径仍可填满可用槽位。即便某个单独测试路径比有效上限更重，它也仍然可以从空池启动，只是会独占运行，直到释放容量。测试路径默认以 2 秒间隔错峰启动，以避免本地 Docker 守护进程在创建容器时出现风暴；可以通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先对 Docker 执行预检，移除陈旧的 OpenClaw E2E 容器，输出活动测试路径状态，持久化测试路径耗时以支持“最长优先”的排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在首次失败后停止调度新的池化测试路径；每个测试路径有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live / tail 测试路径使用更严格的单路径上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器测试路径，包括仅发布时使用的测试路径，例如 `install-e2e`，以及拆分后的内置更新测试路径，例如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，便于智能体复现单个失败测试路径。可复用的实时 / E2E 工作流会先调用 `scripts/test-docker-all.mjs --plan-json`，询问需要哪种软件包、镜像类型、实时镜像、测试路径以及凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub outputs 和摘要。它可以通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的软件包制品，或从 `package_artifact_run_id` 下载软件包制品；验证 tarball 清单；当计划需要已安装软件包的测试路径时，通过 Blacksmith 的 Docker 层缓存构建并推送基于软件包摘要标签的 bare / functional GHCR Docker E2E 镜像；并在已有 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入或现成的软件包摘要镜像可用时直接复用，而不是重新构建。`Package Acceptance` 工作流是高级别的软件包门禁：它从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流制品中解析出一个候选项，然后将这个单一的 `package-under-test` 制品传递给可复用的 Docker E2E 工作流。它会将 `workflow_ref` 与 `package_ref` 分开，以便当前的验收逻辑能够验证较旧但可信的提交，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行自定义的 Package Acceptance 差异集：针对已解析 tarball 的 bundled-channel 兼容性、离线插件夹具以及 Telegram 软件包 QA。发布路径 Docker 套件会以较小的分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只会拉取自己需要的镜像类型，并通过同一个加权调度器执行多个测试路径（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，它会被并入 `plugins-runtime-core`；只有在仅针对 OpenWebUI 的触发场景中，才保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime` 和 `plugins-integrations` 仍然可以用于手动重跑，但发布工作流使用拆分后的分块，这样安装器 E2E 以及内置插件安装 / 卸载全量扫描就不会主导关键路径。`install-e2e` 测试路径别名仍然是两个 provider 安装器测试路径的聚合手动重跑别名。`bundled-channels` 分块运行的是拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 测试路径，而不是串行的一体化 `bundled-channel-deps` 测试路径。每个分块都会上传 `.artifacts/docker-tests/`，其中包含测试路径日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢路径表，以及每个测试路径的重跑命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行所选测试路径，而不是运行整个分块作业，这样失败测试路径的调试就可以限制在单个目标 Docker 作业内，并为该次运行准备、下载或复用软件包制品；如果所选测试路径属于实时 Docker 测试路径，那么目标作业会为这次重跑在本地构建实时测试镜像。生成的每测试路径 GitHub 重跑命令会在相关值存在时包含 `package_artifact_run_id`、`package_artifact_name` 以及已准备好的镜像输入，这样失败测试路径就能复用失败运行中的完全相同的软件包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可以从某个 GitHub 运行下载 Docker 制品，并输出组合的 / 每测试路径的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可以查看慢测试路径和阶段关键路径摘要。定时的实时 / E2E 工作流每天都会运行完整的发布路径 Docker 套件。内置更新矩阵会按更新目标拆分，以便重复的 npm update 和 doctor 修复轮次能够与其他内置检查并行分片运行。

当前的发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-core`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重跑，但发布工作流使用的是拆分后的分块，这样渠道 smoke、更新目标以及设置 / 运行时契约检查就可以并行运行。目标 `docker_lanes` 触发也会在一次共享的软件包 / 镜像准备步骤之后，将多个所选测试路径拆分为并行作业；而 bundled-channel 更新测试路径会在 npm 网络瞬时故障时重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界方面比广义的 CI 平台范围更严格：核心生产改动会运行核心生产和核心测试 typecheck，再加上核心 lint / guards；核心仅测试改动只会运行核心测试 typecheck 加核心 lint；扩展生产改动会运行扩展生产和扩展测试 typecheck，再加上扩展 lint；扩展仅测试改动只会运行扩展测试 typecheck 加扩展 lint。公开的插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展全量扫描仍属于显式测试工作。仅发布元数据的版本号提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置改动会以安全优先方式退回到全部检查测试路径。

手动触发的 CI 会运行 `checks-node-compat-node22`，作为发布候选版本的兼容性覆盖。常规拉取请求和推送到 `main` 会跳过这条测试路径，并让矩阵聚焦在 Node 24 的测试 / 渠道测试路径上。

最慢的 Node 测试家族会被拆分或做负载均衡，以便每个作业都保持较小规模，同时避免过度预留运行器：渠道契约以 3 个加权分片运行，内置插件测试在 6 个扩展 worker 之间做均衡，小型核心单元测试路径会成对组合，auto-reply 以 4 个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 以及 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分散到现有的仅源码 agentic Node 作业中，而不是等待已构建制品。大范围的浏览器、QA、媒体以及杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并分配更大的 Node 堆，这样导入密集型插件批次就不会制造额外的 CI 作业。广泛的 agents 测试路径使用共享的 Vitest 文件级并行调度器，因为它的瓶颈在于导入 / 调度，而不是某一个单独的慢测试文件。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片独占尾部耗时。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与经过过滤的分片。`check-additional` 会将 package-boundary compile / canary 工作保留在一起，并将运行时拓扑架构与 gateway watch 覆盖分开；boundary guard 分片会在一个作业内并发运行其小型独立守卫。Gateway watch、渠道测试以及核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量验证器作业，同时避免额外占用两个 Blacksmith worker，以及避免第二个制品消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试路径仍会使用 SMS / call-log 的 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的推送中重复执行一个 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 上最新的一次运行也失败了，否则请将这视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但在整个工作流已经被替代后不会继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## 运行器

| 运行器 | 作业 |
| --- | --- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议 / 契约 / 内置检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 反而得不偿失；install-smoke Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于其收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查针对 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界测试路径运行变更后的 typecheck / lint / guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 与上相同的门禁，但带每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 廉价的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 损坏链接检查
pnpm build          # 当 CI 制品 / build-smoke 测试路径相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main 推送 CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声并选择 origin/main 推送 CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 10 次 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

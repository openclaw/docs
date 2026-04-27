---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、作用域门控，以及本地对应命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T23:11:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f9181fe819550b195068ded66076722323e055e5a9f1e46bff61ba205ae5f8c
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在只有无关区域发生变更时跳过开销较大的作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能作用域划分，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是用于“发布前运行所有检查”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks`，用于安装冒烟测试、包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道。提供已发布的软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。这个总控工作流会记录已触发的子运行 id，而最终的 `Verify full validation` 作业会重新检查当前子运行的结论。如果某个子工作流被重新运行并转为绿色，只需重新运行父级验证器作业即可刷新总控结果。

为了便于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`；仅重新运行常规完整 CI 子工作流使用 `ci`；重新运行所有发布子检查使用 `release-checks`；也可以使用更窄的发布分组：总控工作流支持 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在有针对性的修复之后，把失败的发布测试环境重跑范围控制在较小范围内。

发布版 live/E2E 子工作流仍然保留广泛的原生 `pnpm test:live` 覆盖，但它不是作为单个串行作业运行，而是通过 `scripts/test-live-shard.mjs` 以具名分片运行：`native-live-src-agents`、`native-live-src-gateway-core`、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z` 和 `native-live-extensions-media`。这样在保持相同文件覆盖范围的同时，也让慢速 live provider 故障更容易重跑和诊断。

`Package Acceptance` 是用于验证软件包产物的旁路工作流，不会阻塞发布工作流。它可以从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball artifact 中解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，针对该 tarball 运行，而不是重新打包工作流检出的代码。它支持 smoke、package、product、full 以及自定义 Docker 通道选择等配置。`package` 配置使用离线插件覆盖，因此已发布软件包的验证不会被 live ClawHub 可用性所阻塞。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` artifact，而已发布 npm 规范路径则保留给独立触发场景。

## 包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证的是源码树，而包验收验证的是单个 tarball，并通过用户在安装或更新后实际使用的同一套 Docker E2E harness 来运行。

该工作流有四个作业：

1. `resolve_package` 会检出 `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、workflow ref、package ref、版本、SHA-256 和配置。
2. `docker_acceptance` 会使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。这个可复用工作流会下载该 artifact，验证 tarball 清单，按需准备基于 package digest 的 Docker 镜像，并针对该软件包运行所选的 Docker 通道，而不是打包当前工作流检出的代码。当某个配置选择了多个定向 `docker_lanes` 时，这个可复用工作流会先准备一次软件包和共享镜像，然后将这些通道展开为并行的定向 Docker 作业，并生成各自独立的 artifact。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 `Package Acceptance` 已解析出一个软件包，它会安装同一个 `package-under-test` artifact；独立触发的 Telegram 运行仍然可以安装已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选的 Telegram 通道失败时让整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/stable 版本的验收。
- `source=ref`：打包一个可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会抓取 OpenClaw 分支/标签，验证所选提交是否可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享的 artifact 应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试时所用的可信工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源码提交。这样，当前测试 harness 就可以在不运行旧工作流逻辑的前提下，验证较早的可信源码提交。

配置与 Docker 覆盖的映射：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 外加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确指定 `docker_lanes`；当 `suite_profile=custom` 时必须提供

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 `Package Acceptance`。发布路径 Docker 分块会覆盖重叠的软件包/更新/插件通道，而 `Package Acceptance` 则针对同一个已解析的软件包 tarball，保留基于产物原生运行的 bundled-channel 兼容性、离线插件以及 Telegram 证明。跨操作系统发布检查仍然覆盖特定操作系统的新手引导、安装器和平台行为；而软件包/更新的产品级验证应从 `Package Acceptance` 开始。Windows 打包版和安装器全新安装通道还会验证：已安装的软件包能否从原始绝对 Windows 路径导入 browser-control override。

`Package Acceptance` 对已发布的软件包提供一个有界的旧兼容窗口，适用于 `2026.4.25` 及之前的版本，包括 `2026.4.25-beta.*`。这些放宽规则记录在这里，是为了避免它们变成永久的静默跳过：如果 tarball 省略了这些文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；如果软件包未暴露该标志，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从由 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能允许配置元数据迁移，但仍要求安装记录和不重新安装行为保持不变。`2026.4.25` 之后的软件包必须满足现代契约；相同条件将直接失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker artifact：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时以及重跑命令。优先重跑失败的包验收配置或精确的 Docker 通道，而不是重新运行整个完整发布验证。

QA Lab 在主智能作用域工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上每夜运行，并支持手动触发；它会把 mock parity gate、live Matrix 通道，以及 live Telegram 和 Discord 通道展开为并行作业。live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。Matrix 在计划任务和发布门控中使用 `--profile fast`，并且仅在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍然是 `all`；手动触发 `matrix_profile=all` 时，总是会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道；它的 QA parity gate 会把候选包和基线包作为并行通道作业运行，然后把两个 artifact 下载到一个小型报告作业中，以进行最终的一致性比较。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认以 dry-run 方式运行，只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已经合并，并且每个重复项都具有共享的引用 issue 或重叠的变更 hunk。

`CodeQL` 工作流有意设计为一个范围较窄的首轮扫描器，而不是对整个仓库进行完整扫描。每日运行和手动运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关相关模块。关键安全通道会针对这个较窄的 JavaScript/TypeScript 范围运行高精度安全查询，而单独的关键质量通道则只运行严重级别为 error 的非安全查询。Swift、Android、Python、UI 和内置插件的 CodeQL 扩展应仅在这个窄范围配置的运行时间和信噪比稳定之后，作为有作用域限制或分片的后续工作再逐步加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已合并的变更保持一致。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，也可以通过手动触发直接运行。对于 workflow-run 调用，如果 `main` 已经继续前进，或者过去一小时内已经创建了另一次未跳过的 Docs Agent 运行，则会跳过。实际运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行就可以覆盖自上次文档处理以来积累到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：在 `main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一次 workflow-run 调用运行过或正在运行，则会跳过。手动触发会绕过这个按日活动门控。这个通道会构建一个完整测试套件、按组聚合的 Vitest 性能报告，让 Codex 仅进行小范围、保持覆盖率的测试性能修复，而不是大规模重构；然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中已有失败测试，Codex 只能修复明显的失败项，而且在提交任何内容之前，智能体执行后的完整测试套件报告必须通过。当 `main` 在机器人推送落地前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；发生冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅有文档变更、变更作用域、变更的扩展，并构建 CI 清单 | 总是在非草稿 push 和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 总是在非草稿 push 和 PR 上运行 |
| `security-dependency-audit` | 针对 npm 安全公告执行无依赖的生产 lockfile 审计 | 总是在非草稿 push 和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 总是在非草稿 push 和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查以及可复用的下游 artifact | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 对整个扩展套件执行完整的内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、内置、契约和扩展通道 | 与 Node 相关的变更 |
| `check` | 与主本地门控等效的分片作业：生产类型、lint、防护、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面防护、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟通道 | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式化、lint 和断链检查 | 文档发生变更时 |
| `skills-python` | 面向 Python 支持的 Skills 运行 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特有的进程/路径测试，以及共享运行时导入说明符回归检查 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试通道 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后按日运行的 Codex 慢测试优化 | 在 main CI 成功后或手动触发 |

手动触发的 CI 会运行与常规 CI 相同的作业图，但会强制开启所有带作用域限制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android 以及 Control UI i18n。手动运行使用唯一的并发组，因此发布候选版本的完整测试套件不会因为同一 ref 上的另一条 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方在使用所选触发 ref 对应工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行这张作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的排序方式是让便宜的检查先失败，再决定是否运行昂贵作业：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立刻开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动触发会跳过变更作用域检测，并让 preflight 清单表现得像所有带作用域限制的区域都发生了变更。CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然仅由平台源码变更触发。

仅涉及 CI 路由的编辑、部分低成本 core-test fixture 编辑，以及狭窄范围的插件契约辅助工具/测试路由编辑，会走一个快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务可直接覆盖的路由或辅助工具表面时，这一路径会避免运行构建 artifact、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及额外的防护矩阵。

Windows Node 检查的作用域仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、install-smoke 和仅测试类变更仍然停留在 Linux Node 通道上，这样就不会为了已由常规测试分片覆盖的内容占用 16-vCPU 的 Windows worker。

独立的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于 PR，Docker/软件包表面、内置插件 package/manifest 变更，以及 Docker 冒烟作业所覆盖的 core 插件/渠道/Gateway 网关/插件 SDK 表面，会运行快速路径。仅源码的内置插件变更、仅测试编辑以及仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟，运行容器内的 gateway-network e2e，验证一个内置扩展 build arg，并在 240 秒的总命令超时内运行有边界的内置插件 Docker 配置，同时对每个场景的 Docker run 单独设置上限。

完整路径则保留 QR 软件包安装以及安装器 Docker/更新覆盖，用于每夜定时运行、手动触发、workflow-call 发布检查，以及确实触及安装器/软件包/Docker 表面的 PR。推送到 `main`，包括 merge commit，不会强制完整路径；当变更作用域逻辑在 push 上本会请求完整覆盖时，该工作流仍然只保留快速 Docker 冒烟，并将完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由单独的 `run_bun_global_install_smoke` 门控；它在夜间计划任务和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但 PR 和 `main` push 不会运行它。QR 和安装器 Docker 测试保留各自以安装为中心的 Dockerfile。

本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于安装器/更新/插件依赖通道的纯 Node/Git 运行器，另一个是将同一 tarball 安装到 `/app` 中、用于常规功能通道的功能型镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行所选计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行这些通道；可用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整主池默认 10 个槽位，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感的尾池默认 10 个槽位。较重通道的默认上限为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道就不会让 Docker 过度超载，同时较轻通道仍然可以填满可用槽位。单个比有效上限更重的通道仍然可以从空池启动，然后独占运行，直到释放容量。

默认情况下，通道启动会错开 2 秒，以避免本地 Docker daemon 出现 create storm；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会预检 Docker，移除过期的 OpenClaw E2E 容器，输出活跃通道状态，持久化通道耗时以支持“最长优先”排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 以检查调度器行为。默认在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅用于发布的通道，如 `install-e2e`，以及拆分的内置更新通道，如 `bundled-channel-update-acpx`，同时跳过清理冒烟，这样智能体就能复现某个失败通道。

可复用的 live/E2E 工作流会通过 `scripts/test-docker-all.mjs --plan-json` 查询所需的软件包、镜像类型、live 镜像、通道和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub outputs 和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行的软件包 artifact，或从 `package_artifact_run_id` 下载软件包 artifact；验证 tarball 清单；当计划需要安装了软件包的通道时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package digest 标签的 bare/functional GHCR Docker E2E 镜像；并且在已有可用时，复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的 package-digest 镜像，而不是重新构建。

`Package Acceptance` 工作流是高层的软件包门控：它从 npm、可信 `package_ref`、附带 SHA-256 的 HTTPS tarball，或先前工作流 artifact 中解析出一个候选包，然后将这个单独的 `package-under-test` artifact 传递给可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，使当前的验收逻辑可以在不检出旧工作流代码的情况下验证较早的可信提交。发布检查会针对目标 ref 运行一个自定义的 Package Acceptance 差量集：内置渠道兼容性、离线插件 fixture，以及针对已解析 tarball 的 Telegram 软件包 QA。

发布路径 Docker 套件会运行更小、已分块的作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`，`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`）。在请求完整发布路径覆盖时，OpenWebUI 会并入 `plugins-runtime-core`，只有在仅针对 OpenWebUI 的触发中才保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime` 和 `plugins-integrations` 仍然可用于手动重跑，但发布工作流使用拆分后的分块，这样安装器 E2E 和内置插件安装/卸载全量扫描就不会主导关键路径。`install-e2e` 通道别名仍然是两个 provider 安装器通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表以及每通道重跑命令。

工作流的 `docker_lanes` 输入会让所选通道针对准备好的镜像运行，而不是运行整块作业，这样失败通道的调试范围就能限制在一个定向 Docker 作业内，并为该次运行准备、下载或复用软件包 artifact；如果所选通道是 live Docker 通道，定向作业会为该次重跑在本地构建 live-test 镜像。生成的逐通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 以及准备好的镜像输入，因此失败通道可以复用失败运行中的精确软件包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从某次 GitHub 运行下载 Docker artifact，并打印组合式/逐通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可获取慢通道和阶段关键路径摘要。计划中的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，这样重复的 npm update 和 doctor 修复流程就可以与其他内置检查并行分片运行。

当前发布 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-core`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍然可用于手动一次性重跑，但发布工作流使用拆分后的分块，这样渠道冒烟、更新目标以及设置/运行时契约检查就能并行运行。定向 `docker_lanes` 触发也会在共享的软件包/镜像准备步骤之后，将多个所选通道拆分为并行作业；并且内置渠道更新通道会针对临时性的 npm 网络失败重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门控在架构边界上比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint/guards；core 仅测试变更只运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展仅测试变更会运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展全量运行仍然属于显式测试工作。仅发布元数据的版本号变更会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以保守方式落入所有检查通道。

手动触发的 CI 会运行 `checks-node-compat-node22`，作为发布候选的兼容性覆盖。常规 PR 和 `main` push 会跳过这个通道，并让矩阵聚焦于 Node 24 测试/渠道通道。

最慢的 Node 测试家族会被拆分或重新平衡，使每个作业都保持较小规模，同时避免过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个扩展 worker 之间平衡分配，小型 core 单元测试通道会成对组合，auto-reply 作为四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 以及 commands/state-routing 分片，而 agentic Gateway 网关/插件配置则分散到现有的仅源码 agentic Node 作业中，而不是等待已构建 artifact。广义的 browser、QA、media 以及杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并提供更大的 Node heap，这样导入开销较大的插件批次就不会产生额外的 CI 作业。广义的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度限制，而不是由某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片成为尾部瓶颈。基于 include pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与过滤后的分片。`check-additional` 将 package-boundary 的 compile/canary 工作保留在一起，并将 runtime topology 架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内并发运行其小型独立 guard。Gateway watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内部并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免额外占用两个 Blacksmith worker 和第二条 artifact 消费队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍然会在启用 SMS/通话记录 BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的 push 上重复进行一次 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有更新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 侧旧队列组中的僵尸任务就不会无限期阻塞较新的 `main` 运行。手动完整测试套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，其中 32-vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地对应命令

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地变更通道分类器
pnpm check:changed   # 智能本地检查门控：按边界通道运行变更后的 typecheck/lint/guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 同一门控，并输出各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本的智能变更 Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 断链检查
pnpm build          # 当 CI artifact/build-smoke 通道相关时构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 对比最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

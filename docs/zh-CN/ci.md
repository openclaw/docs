---
read_when:
    - 你需要了解某个 CI 作业为什么运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T23:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d9fabbc0980661076f4b0187dda4ac682b2361943266c7ec85a8cf38796299a
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域判定，在仅更改了无关区域时跳过高成本作业。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks` 来运行安装冒烟测试、包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已发布的包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。这个总控工作流会记录触发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行的结论。如果某个子工作流被重新运行并变为绿色，只需重新运行父级验证作业即可刷新总控结果。

为便于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅运行常规完整 CI 子流程使用 `ci`，所有发布子流程使用 `release-checks`，或者使用更窄的发布分组：在总控工作流上可选 `install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样在针对性修复后，可以把失败的发布环境重跑范围控制在较小边界内。

发布 live/E2E 子流程保留了广泛的原生 `pnpm test:live` 覆盖，但它不再作为单个串行作业运行，而是通过 `scripts/test-live-shard.mjs` 按具名分片执行：`native-live-src-agents`、`native-live-src-gateway-core`、按 provider 过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`，以及拆分后的媒体音频/音乐/视频分片。这样既保持了相同的文件覆盖范围，也更便于重跑和诊断缓慢的 live provider 故障。聚合分片名 `native-live-extensions-o-z` 和 `native-live-extensions-media` 仍然可用于手动一次性重跑。

`Package Acceptance` 是一个旁路工作流，用于验证某个包产物，而不会阻塞发布工作流。它会从已发布的 npm 规格、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带有 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball artifact 中解析出一个候选包，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，以该 tarball 代替对工作流检出的内容重新打包。配置档覆盖 smoke、package、product、full，以及自定义 Docker 测试通道选择。`package` 配置档使用离线插件覆盖，因此已发布包验证不受 live ClawHub 可用性影响。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` artifact，而已发布 npm 规格路径则保留给独立触发使用。

## 包验收

当问题是“这个可安装的 OpenClaw 软件包作为一个产品是否可用？”时，使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证源码树，而包验收则通过用户在安装或更新后实际经历的同一套 Docker E2E harness，对单个 tarball 进行验证。

该工作流包含四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中输出其来源、workflow ref、package ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 与 `package_artifact_name=package-under-test`。该可复用工作流会下载该 artifact，验证 tarball 清单，按需准备 package-digest Docker 镜像，并针对该包而不是工作流检出内容打包结果来运行所选 Docker 通道。当某个配置档选择了多个定向 `docker_lanes` 时，该可复用工作流会只准备一次包和共享镜像，然后以带唯一 artifact 的并行定向 Docker 作业展开这些通道。
3. `package_telegram` 会按需调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时它会运行；如果 Package Acceptance 已解析出一个包，它会安装同一个 `package-under-test` artifact；独立的 Telegram 触发仍然可以安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/stable 包的验收。
- `source=ref`：打包一个可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会抓取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 进行打包。
- `source=url`：下载一个 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部分发的 artifact 应当提供。

请将 `workflow_ref` 与 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这样，当前测试 harness 就可以验证较早的可信源提交，而无需运行旧的工作流逻辑。

配置档与 Docker 覆盖范围的映射：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：在 `package` 基础上增加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时为必填

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块会覆盖重叠的 package/update/plugin 通道，而 Package Acceptance 则针对同一个已解析的 package tarball 保留原生 artifact 的 bundled-channel 兼容性、离线插件以及 Telegram 验证。跨操作系统发布检查仍会覆盖特定于操作系统的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包版和安装器全新安装通道还会验证已安装包能否从原始绝对 Windows 路径导入浏览器控制覆盖项。

对于已发布的软件包，Package Acceptance 为截至 `2026.4.25`（包括 `2026.4.25-beta.*`）的版本保留了一个有界的旧兼容窗口。这些例外在此记录，以防它们变成永久性的静默跳过：`dist/postinstall-inventory.json` 中已知的私有 QA 条目在 tarball 省略这些文件时可能只发出警告；当软件包未暴露该标志时，`doctor-switch` 可能跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可能会从基于 tarball 的伪 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可能记录缺失的已持久化 `update.channel`；插件冒烟测试可能读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；而 `plugin-update` 可能允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。`2026.4.25` 之后的软件包必须满足现代契约；同样的条件将失败，而不是警告或跳过。

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

调试失败的包验收运行时，请先查看 `resolve_package` 摘要，以确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker artifacts：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重跑命令。优先重跑失败的包配置档或精确的 Docker 通道，而不是重跑完整发布验证。

QA Lab 在主智能作用域工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 更改和手动触发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动触发；它会将 mock parity gate、live Matrix 通道，以及 live Telegram 和 Discord 通道作为并行作业展开。live 作业使用 `qa-live-shared` 环境，而 Telegram/Discord 使用 Convex 租约。Matrix 在定时和发布门禁中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 触发始终会将完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道；其 QA parity gate 会将候选包和基线包作为并行通道作业运行，然后在一个小型报告作业中下载两者的 artifact，以进行最终 parity 比较。

`Duplicate PRs After Merge` 工作流是一个供维护者在合并后进行重复 PR 清理的手动工作流。它默认使用 dry-run，只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已被合并，并且每个重复 PR 都具有关联的共享 issue 引用或重叠的变更 hunk。

`CodeQL` 工作流有意作为一个范围较窄的第一阶段扫描器，而不是对整个仓库进行完整扫描。每日运行和手动运行会扫描 Actions 工作流代码，以及最高风险的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关表面。关键安全通道会对同一小范围 JavaScript/TypeScript 表面运行高精度安全查询，而单独的关键质量通道则仅运行严重级别为 error 的非安全查询。Swift、Android、Python、UI 和内置插件的 CodeQL 扩展，应仅在这个窄范围配置的运行时间和信噪比稳定之后，作为有作用域限制或分片的后续工作重新加入。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近已合并的更改保持一致。它没有纯定时调度：当 `main` 上一次成功的非机器人 push CI 运行完成后，可以触发它；也可以通过手动触发直接运行。工作流运行触发会在 `main` 已继续前进，或过去一小时内已创建了另一个未被跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未被跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累计到 `main` 的所有更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理缓慢测试。它也没有纯定时调度：当 `main` 上一次成功的非机器人 push CI 运行完成后，可以触发它；但如果同一个 UTC 日期内已有另一个由工作流运行触发的实例已经运行过或正在运行，它就会跳过。手动触发会绕过这一每日活动门禁。该通道会构建完整测试套件分组的 Vitest 性能报告，让 Codex 仅进行小幅、保持覆盖率不变的测试性能修复，而不是进行大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的更改。如果基线中已有失败测试，Codex 只能修复明显的问题，并且 agent 运行后的完整测试套件报告必须全部通过，之后才会提交任何内容。当 `main` 在 bot push 落地前继续前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；存在冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测仅文档更改、更改的作用域、更改的扩展，并构建 CI 清单 | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit` | 针对 npm 公告进行无依赖的生产 lockfile 审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-fast` | 快速安全作业的必需聚合项 | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游 artifacts | 与 Node 相关的更改 |
| `checks-fast-core` | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的更改 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，带有稳定的聚合检查结果 | 与 Node 相关的更改 |
| `checks-node-extensions` | 扩展套件中的完整内置插件测试分片 | 与 Node 相关的更改 |
| `checks-node-core-test` | 核心 Node 测试分片，不含渠道、内置、契约和扩展通道 | 与 Node 相关的更改 |
| `check` | 分片的主本地门禁等效项：生产类型、lint、防护、测试类型和严格 smoke | 与 Node 相关的更改 |
| `check-additional` | 架构、边界、扩展表面防护、包边界以及 gateway-watch 分片 | 与 Node 相关的更改 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的更改 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的更改 |
| `checks-node-compat-node22` | Node 22 兼容性构建和 smoke 通道 | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档有更改时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的更改 |
| `checks-windows` | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归检查 | 与 Windows 相关的更改 |
| `macos-node` | 使用共享构建 artifacts 的 macOS TypeScript 测试通道 | 与 macOS 相关的更改 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的更改 |
| `android` | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的更改 |
| `test-performance-agent` | 在可信活动之后每日运行的 Codex 慢测试优化 | `main` CI 成功后或手动触发 |

手动 CI 触发会运行与常规 CI 相同的作业图，但会强制开启所有按作用域控制的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此发布候选版本的完整测试套件不会被同一 ref 上的另一次 push 或 PR 运行取消。可选的 `target_ref` 输入允许可信调用方在使用所选触发 ref 的工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行这张作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业的排序方式使得低成本检查会先于高成本作业失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待较重的构建产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道并行运行，这样下游消费者就能在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得如同所有按作用域控制的区域都发生了更改。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只受平台源码更改控制。
仅涉及 CI 路由的编辑、选定的低成本 core-test fixture 编辑，以及狭窄范围的插件契约辅助工具/测试路由编辑，会使用快速 Node-only 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前更改文件仅限于快速任务可直接覆盖的路由或辅助表面时，该路径会避免构建 artifacts、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的防护矩阵。
Windows Node 检查的作用域限定在 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试类更改仍保留在 Linux Node 通道中，因此不会为了已由常规测试分片覆盖的内容而占用 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个作用域脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/package 表面、内置插件 package/manifest 更改，以及 Docker smoke 作业会覆盖到的核心插件/渠道/Gateway 网关/插件 SDK 表面，会运行快速路径。仅源码的内置插件更改、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器化 gateway-network e2e，验证内置扩展 build arg，并在 240 秒总命令超时限制下运行有界的内置插件 Docker profile，同时每个场景的 Docker 运行各自有独立上限。完整路径会保留 QR package 安装和安装器 Docker/update 覆盖，用于夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及安装器/package/Docker 表面的拉取请求。推送到 `main`，包括 merge commit，不会强制完整路径；当 changed-scope 逻辑在 push 上会请求完整覆盖时，工作流仍只保留快速 Docker smoke，而将完整 install smoke 留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划任务和发布检查工作流中运行，手动 `install-smoke` 触发也可以选择加入，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自以安装为中心的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是不安装包的 Node/Git 运行器，用于安装器/update/插件依赖通道；另一个是功能镜像，会将同一个 tarball 安装到 `/app` 中，用于常规功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行这些通道；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾池槽位数也默认为 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会过度占用 Docker，而较轻的通道仍可填满可用槽位。单个比有效上限更重的通道仍可在空池中启动，但在释放容量前会独占运行。默认情况下，通道启动会错开 2 秒，以避免本地 Docker 守护进程创建风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先检查 Docker，删除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于检查调度器。默认情况下，它会在首次失败后停止调度新的池化通道；每个通道都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布时使用的通道，例如 `install-e2e`，以及拆分后的内置更新通道，例如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现某个失败通道。可复用的 live/E2E 工作流会调用 `scripts/test-docker-all.mjs --plan-json` 来确定需要哪种 package、镜像类型、live 镜像、通道和凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub outputs 和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行的 package artifact，或从 `package_artifact_run_id` 下载 package artifact；验证 tarball 清单；当计划需要已安装 package 的通道时，通过 Blacksmith 的 Docker layer cache 构建并推送以 package-digest 标记的 bare/functional GHCR Docker E2E 镜像；并在有提供 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有 package-digest 镜像时复用它们，而不是重新构建。`Package Acceptance` 工作流是高层级的包门禁：它会从 npm、可信 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流 artifact 中解析一个候选包，然后将这个单一的 `package-under-test` artifact 传入可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，这样当前的验收逻辑就可以验证较旧的可信提交，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行自定义的 Package Acceptance 增量：bundled-channel 兼容性、离线插件 fixtures，以及针对已解析 tarball 的 Telegram package QA。发布路径 Docker 测试套件会以更小的分块作业运行，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取所需的镜像类型，并通过同一个加权调度器运行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-core`，只有在仅针对 OpenWebUI 的触发中才保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分后的分块，这样安装器 E2E 和内置插件安装/卸载扫描就不会主导关键路径。`install-e2e` 通道别名仍是两个 provider 安装器通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每个通道的重跑命令。工作流 `docker_lanes` 输入会针对已准备好的镜像运行选定通道，而不是使用分块作业，这样失败通道的调试就能控制在单个定向 Docker 作业内，并会为该次运行准备、下载或复用 package artifact；如果选定通道是 live Docker 通道，则该定向作业会在本地构建 live-test 镜像用于重跑。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备好的镜像输入，因此失败通道可以复用失败运行中的精确 package 和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从某次 GitHub 运行下载 Docker artifacts，并输出组合/逐通道的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。计划中的 live/E2E 工作流会每日运行完整的发布路径 Docker 测试套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 doctor 修复过程可以与其他内置检查并行分片运行。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-core`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重跑，但发布工作流使用拆分后的分块，以便渠道 smoke、更新目标以及设置/运行时契约检查可以并行运行。定向 `docker_lanes` 触发也会在一次共享 package/镜像准备步骤之后，将多个选定通道拆分为并行作业；而内置渠道更新通道会针对瞬时 npm 网络故障重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界上比宽泛的 CI 平台作用域更严格：核心生产更改会运行 core prod 和 core test 类型检查，以及 core lint/guards；核心仅测试更改只运行 core test 类型检查以及 core lint；扩展生产更改会运行 extension prod 和 extension test 类型检查，以及 extension lint；扩展仅测试更改会运行 extension test 类型检查以及 extension lint。公开的插件 SDK 或 plugin-contract 更改会扩展到 extension 类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展扫描属于显式测试工作。仅发布元数据的版本升级会运行定向 version/config/root-dependency 检查。未知的根目录/配置更改会以安全优先的方式退回到全部检查通道。

手动 CI 触发会运行 `checks-node-compat-node22` 作为发布候选版本兼容性覆盖。常规拉取请求和 `main` 推送会跳过该通道，并将矩阵聚焦于 Node 24 测试/渠道通道。

最慢的 Node 测试族会被拆分或做负载平衡，以便每个作业都保持较小规模，同时避免过度预留 runner：渠道契约会拆成三个加权分片，内置插件测试会在六个扩展 worker 之间做均衡，小型核心单元通道会成对组合，auto-reply 会以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关/插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待已构建 artifacts。范围较广的浏览器、QA、媒体和杂项插件测试会使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配更大的 Node 堆，这样导入开销较大的插件批次就不会额外生成更多 CI 作业。宽范围的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度影响，而不是被某个单独的慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片拖尾。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 会将 package-boundary 的 compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；边界防护分片会在一个作业内并发运行其小型独立防护项。Gateway watch、渠道测试以及核心 support-boundary 分片会在 `build-artifacts` 内部于 `dist/` 和 `dist-runtime/` 已构建完成后并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免额外占用两个 Blacksmith worker 和第二条 artifact 消费队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会使用 SMS/通话日志 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的推送上重复执行 debug APK 打包作业。

当同一 PR 或 `main` ref 上有更新的推送到达时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪音。聚合作业分片检查使用 `!cancelled() && always()`，这样它们仍会正常报告分片失败，但不会在整个工作流已被取代后继续排队。

自动 CI 并发键是带版本号的（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞新的 main 运行。手动完整测试套件运行使用 `CI-manual-v1-*`，且不会取消正在进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于节省 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界通道运行 changed typecheck/lint/guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门禁，但带每阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:changed   # 低成本智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI artifact/build-smoke 通道相关时构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪音并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

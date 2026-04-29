---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: 持续集成作业图、范围门禁和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T02:30:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e492bdaa71052a36a2130b451ee1b33e01c400a6dc52a5a5f883081b75742aad
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 和每个拉取请求上运行。它使用智能范围界定，在只有无关区域发生变更时跳过昂贵作业。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并为发布候选或广泛验证展开完整的常规 CI 图。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分派手动 `CI` 工作流，并分派 `OpenClaw Release Checks`，用于安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已发布包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的 live/提供商覆盖广度：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。该总控工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行附加最慢作业表。如果某个子工作流重新运行后变绿，只需重新运行父验证作业以刷新总控结果和耗时摘要。

用于恢复时，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选使用 `all`，仅对常规完整 CI 子项使用 `ci`，对每个发布子项使用 `release-checks`，或在总控工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在完成针对性修复后，让失败发布盒的重新运行保持有界。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样既保留相同的文件覆盖，又让缓慢的 live 提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

`OpenClaw Release Checks` 使用受信任工作流引用将选定引用解析一次为 `release-package-under-test` tarball，然后将该工件传给 live/E2E 发布路径 Docker 工作流和包验收分片。这能让发布盒之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选。

`Package Acceptance` 是用于验证包工件且不阻塞发布工作流的旁路运行工作流。它会从已发布的 npm 规格、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 工件解析一个候选，将其上传为 `package-under-test`，然后用该 tarball 复用 Docker 发布/E2E 调度器，而不是重新打包工作流检出内容。配置档覆盖冒烟、包、产品、完整和自定义 Docker 通道选择。`package` 配置档使用离线插件覆盖，因此已发布包验证不会受 live ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，并保留已发布 npm 规格路径供独立分派使用。

## 包验收

当问题是“这个可安装的 OpenClaw 包能否作为产品工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收会通过用户在安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流下载该工件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当一个配置档选择多个定向 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些通道展开为并行的定向 Docker 作业，并使用唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 已解析出一个包，它会安装同一个 `package-under-test` 工件；独立 Telegram 分派仍可安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时让工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但外部共享工件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样可以让当前测试 harness 验证较旧的受信任源提交，而不运行旧工作流逻辑。

配置档映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而 Package Acceptance 会针对同一个已解析的包 tarball 保留工件原生的内置渠道兼容性、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新通道还会验证已安装包可以从原始绝对 Windows 路径导入浏览器控制覆盖。

Package Acceptance 对已发布包有有界的旧版兼容窗口。到 `2026.4.25` 为止的包（包括 `2026.4.25-beta.*`）可对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可跳过其持久化子用例；`update-channel-switch` 可从 tarball 派生的假 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可记录缺失的持久化 `update.channel`；插件冒烟可读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包还可对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重新运行命令。优先重新运行失败的包配置档或精确 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能范围界定工作流之外有专用 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动分派时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 智能体化包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行并在手动分派时运行；它会将 mock parity gate、live Matrix 通道、live Telegram 和 Discord 通道展开为并行作业。live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。Matrix 对计划任务和发布门禁使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分派总是将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道；其 QA parity gate 会将候选包和基线包作为并行通道作业运行，然后将两个工件下载到一个小型报告作业中，用于最终 parity 比较。
除非变更确实触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面，否则不要把 PR 落地路径放在 `Parity gate` 后面。对于常规渠道、配置、文档或单元测试修复，将它视为可选信号，并遵循范围化 CI/检查证据。

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于
落地后的重复项清理。它默认进行 dry-run，并且仅在 `apply=true` 时关闭明确
列出的 PR。在变更 GitHub 之前，它会验证已落地的 PR 已合并，并验证每个重复项
要么有共享的引用 issue，要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为范围较窄的第一道安全扫描器，
而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码，
以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和
Gateway 网关表面。channel-runtime-boundary 作业会在
`/codeql-critical-security/channel-runtime-boundary` 类别下，单独扫描核心渠道实现
契约以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，
这样渠道安全信号就能在不扩大基线 JS/TS 类别的情况下扩展。

`CodeQL Android Critical Security` 工作流是计划运行的 Android
安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上，
为 CodeQL 手动构建 Android 应用，并在 `/codeql-critical-security/android` 类别下
上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos`
类别下上传结果。将它保持在每日默认工作流之外，因为即使结果干净，
macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它仅在较小的
Blacksmith Linux runner 上，对范围较窄的高价值表面运行错误严重级别、
非安全的 JavaScript/TypeScript 质量查询。它的基线作业会扫描与安全工作流相同的
凭证、密钥、沙箱、cron 和 Gateway 网关表面。config-boundary
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、
迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议
schema 和服务器方法契约。channel-runtime-boundary 作业会在单独的
`/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。
agent-runtime-boundary 作业会在单独的
`/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商
分发、自动回复分发和队列，以及 ACP 控制平面运行时契约。plugin-boundary
作业会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、
公开表面和插件 SDK 入口点契约。保持该工作流与安全工作流分离，这样质量发现就能被
调度、度量、禁用或扩展，而不会遮蔽安全信号。Swift、Python、UI 和内置插件的
CodeQL 扩展，应该只在窄配置文件拥有稳定运行时间和信号之后，作为有范围或分片的
后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的
变更保持一致。它没有纯计划任务：`main` 上成功的非 bot push CI 运行可以触发它，
手动 dispatch 也可以直接运行它。当 `main` 已经前移，或过去一小时内已经创建了另一个
未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过的
Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档
处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于慢测试。
它没有纯计划任务：`main` 上成功的非 bot push CI 运行可以触发它，但如果当天 UTC
已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动 dispatch 会绕过该每日
活动门禁。该通道会构建完整套件分组的 Vitest 性能报告，让 Codex 只进行小范围、
保持覆盖率的测试性能修复，而不是宽泛重构；然后重新运行完整套件报告，并拒绝会降低
通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显的失败，并且 agent
之后的完整套件报告必须通过，才能提交任何内容。当 `main` 在 bot push 落地前前移时，
该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；
有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 能与 docs agent
保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI manifest                                      | 非 draft push 和 PR 始终运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 非 draft push 和 PR 始终运行       |
| `security-dependency-audit`      | 针对 npm advisories 进行无需依赖安装的生产 lockfile 审计                                     | 非 draft push 和 PR 始终运行       |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 非 draft push 和 PR 始终运行       |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查和可复用的下游产物                                     | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                            | Node 相关变更                      |
| `checks-fast-contracts-channels` | 带有稳定聚合检查结果的分片渠道契约检查                                                       | Node 相关变更                      |
| `checks-node-extensions`         | 覆盖插件套件的完整内置插件测试分片                                                           | Node 相关变更                      |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道                                         | Node 相关变更                      |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke                           | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片                                      | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | Node 相关变更                      |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                              | 发布的手动 CI dispatch             |
| `check-docs`                     | 文档格式、lint 和坏链检查                                                                    | 文档已变更                         |
| `skills-python`                  | 用于 Python 支持的 Skills 的 Ruff + pytest                                                   | Python skill 相关变更              |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时 import specifier 回归                            | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，加一次 debug APK 构建                                       | Android 相关变更                   |
| `test-performance-agent`         | 受信活动之后的每日 Codex 慢测试优化                                                          | Main CI 成功或手动 dispatch        |

手动 CI dispatch 会运行与普通 CI 相同的作业图，但会强制开启每个有范围的通道：
Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、
build smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。
手动运行使用唯一的并发组，因此 release-candidate 完整套件不会被同一 ref 上的另一个
push 或 PR 运行取消。可选的 `target_ref` 输入允许受信调用方针对某个分支、tag 或完整提交
SHA 运行该图，同时使用所选 dispatch ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按如下顺序排列，使低成本检查先于高成本检查失败：

1. `preflight` 决定哪些通道存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，这样下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过变更范围检测，并让预检清单的行为
等同于每个限定区域都发生了变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然只限定于平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试夹具编辑，以及范围较窄的插件契约辅助/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或辅助表面时，这条路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的守护矩阵。
Windows Node 检查限定于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源码、插件、安装冒烟和仅测试变更会留在 Linux Node 通道上，因此不会为正常测试分片已经覆盖的内容占用 16-vCPU Windows worker。
独立的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行智能体删除共享工作区 CLI 冒烟，运行容器 Gateway 网关网络 e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时下运行有界的内置插件 Docker 配置文件，同时分别限制每个场景的 Docker 运行时间。完整路径会为每晚计划运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request 保留 QR 包安装和安装器 Docker/更新覆盖。`main` 推送（包括合并提交）不会强制完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟，并将完整安装冒烟留给每晚或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独设门；它会在每晚计划任务和发布检查工作流中运行，手动 `install-smoke` 分发可以选择加入它，但 pull request 和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖通道的裸 Node/Git 运行器，以及一个将同一个 tarball 安装到 `/app` 中、用于正常功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选中的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池槽位数 10。重型通道上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，因此 npm 安装和多服务通道不会让 Docker 超量提交，同时较轻的通道仍会填满可用槽位。单个比有效上限更重的通道仍可从空池启动，然后独占运行，直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道 Status，持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的兜底超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更紧的逐通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（如 `install-e2e`）以及拆分的内置更新通道（如 `bundled-channel-update-acpx`），同时跳过清理冒烟，以便智能体复现单个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带有包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的包摘要镜像，而不是重新构建。`Package Acceptance` 工作流是高级包门禁：它从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的工作流产物解析候选项，然后将这个单一的 `package-under-test` 产物传递给可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较旧的受信任提交，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对解析出的 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行更小的分块作业，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取它需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，OpenWebUI 会折叠进 `plugins-runtime-services`，并且只为仅 OpenWebUI 的分发保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分后的分块，因此安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 通道别名仍然是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及逐通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块作业，这会将失败通道调试限定在一个目标 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定通道是 live Docker 通道，目标作业会为该次重跑在本地构建 live-test 镜像。生成的逐通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker 产物并打印组合/逐通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢通道和阶段关键路径摘要。计划的 live/E2E 工作流每天运行完整发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm 更新和 Doctor 修复过程可以与其他内置检查分片并行。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍是聚合的插件/运行时别名，但发布工作流使用拆分后的分块，因此渠道冒烟、更新目标、插件运行时检查和内置插件安装/卸载扫描可以并行运行。目标 `docker_lanes` 分发也会在一个共享包/镜像准备步骤之后，将多个选中的通道拆分为并行作业，并且内置渠道更新通道会针对临时 npm 网络故障重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界上比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试类型检查以及核心 lint/守护；仅核心测试变更只运行核心测试类型检查以及核心 lint；扩展生产变更会运行扩展生产和扩展测试类型检查以及扩展 lint；仅扩展测试变更会运行扩展测试类型检查以及扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展扫描是显式测试工作。仅发布元数据的版本号提升会运行目标版本/配置/根依赖检查。未知的根目录/配置变更会故障安全地退回到所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，
并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，
源码编辑优先使用显式映射，然后是同级测试和导入图
依赖项。共享群组室递送配置是显式映射之一：
对群组可见回复配置、源回复递送模式或
消息工具系统提示的变更，会路由到核心回复测试以及 Discord 和
Slack 递送回归测试，因此共享默认值变更会在第一次 PR
推送前失败。仅当变更覆盖范围大到廉价映射集合不是可信代理时，
才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为广泛证明使用一个全新预热的 box。在把慢速 gate 花在一个被复用、已过期或刚刚报告了异常大量同步的 box 上之前，先在 box 内运行 `pnpm testbox:sanity`。当所需的根文件（例如 `pnpm-lock.yaml`）消失，或者 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远端同步状态并不是 PR 的可信副本。停止该 box 并改为预热一个新的，而不是调试产品测试失败。对于有意进行大量删除的 PR，请为该完整性检查运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 调度会运行 `checks-node-compat-node22` 作为候选发布版兼容性覆盖。普通 pull request 和 `main` 推送会跳过该 lane，并让矩阵专注于 Node 24 测试/渠道 lane。

最慢的 Node 测试族已被拆分或均衡，使每个 job 保持较小且不会过度预留 runner：渠道契约作为三个加权分片运行，内置插件测试在六个插件 worker 之间均衡，小型核心单元 lane 成对运行，自动回复作为四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 以及 commands/state-routing 分片，而 agentic Gateway 网关/插件配置则分散到现有的仅源码 agentic Node job 中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件总括配置。插件分片 job 一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node heap，使导入密集型插件批次不会创建额外 CI job。广泛 agents lane 使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢速测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。包含模式分片使用 CI 分片名称记录 timing 条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 将 package-boundary 编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；boundary guard 分片在一个 job 内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行，保留其旧 check 名称作为轻量验证 job，同时避免两个额外的 Blacksmith worker 和第二个 artifact-consumer 队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍会用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复执行 debug APK 打包 job。
当同一 PR 或 `main` ref 上有新的推送落地时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片 check 使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个 workflow 已被取代后继续排队。
自动 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全 job 和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置 check、分片渠道契约 check、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档 check、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，8 vCPU 的成本高于节省；install-smoke Docker 构建中，32-vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本地等效命令

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:changed   # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

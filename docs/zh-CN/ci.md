---
read_when:
    - 你需要了解为什么某个 CI 作业运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-28T23:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a8e17713281b2cf14e7c91663f8f57c0370e5355aa21804f5b78525726bfa7
    source_path: ci.md
    workflow: 16
---

CI 在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围界定，在只有无关区域发生变更时跳过昂贵的任务。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并展开完整的常规 CI 图，用于发布候选版本或广泛验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，并调度 `OpenClaw Release Checks`，覆盖安装冒烟测试、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 对等性、Matrix 和 Telegram 通道。当提供已发布的包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的 live/提供商覆盖广度：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。该总括工作流记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流被重新运行并变为绿色，只需重新运行父验证器作业，即可刷新总括结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选版本使用 `all`，只针对常规完整 CI 子项使用 `ci`，针对每个发布子项使用 `release-checks`，或在总括工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会在聚焦修复后，将失败发布盒子的重新运行范围限制住。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，让慢速 live 提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

`OpenClaw Release Checks` 使用可信工作流引用，将选定引用解析一次为 `release-package-under-test` tarball，然后将该工件传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这会让发布盒子之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是用于验证包工件且不阻塞发布工作流的旁路运行工作流。它会从已发布的 npm 规格、使用选定 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 工件解析一个候选项，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，用该 tarball 代替重新打包工作流检出内容。配置文件覆盖冒烟测试、包、产品、完整和自定义 Docker 通道选择。`package` 配置文件使用离线插件覆盖，因此已发布包验证不会受 live ClawHub 可用性阻塞。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，并为独立调度保留已发布 npm 规格路径。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而包验收会通过用户在安装或更新后执行的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当一个配置文件选择多个目标 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些通道展开为带唯一工件的并行目标 Docker 作业。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 已解析包时安装同一个 `package-under-test` 工件；独立 Telegram 调度仍然可以安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版验收。
- `source=ref`：打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；`package_sha256` 为必填。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对外部共享工件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的可信工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 就可以验证较旧的可信源提交，而不运行旧的工作流逻辑。

配置文件映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

发布检查会调用 Package Acceptance，传入 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai`。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而 Package Acceptance 会针对同一个已解析包 tarball 保留原生工件的内置渠道兼容性、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖特定 OS 的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新通道还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control 覆盖。

Package Acceptance 对已发布包设有有界的旧版兼容窗口。直到 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件将失败，而不是警告或跳过。

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

调试失败的包验收运行时，从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或精确 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能范围界定工作流之外有专用 CI 通道。`Parity gate` 工作流会在匹配的拉取请求变更和手动调度时运行；它构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动调度；它会将模拟对等性门禁、live Matrix 通道、live Telegram 和 Discord 通道展开为并行作业。live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。Matrix 对计划任务和发布门禁使用 `--profile fast`，只有在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 调度总是将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道；其 QA 对等性门禁会将候选包和基线包作为并行通道作业运行，然后将两个工件下载到一个小型报告作业中，用于最终对等性比较。
不要把拉取请求落地路径放在 `Parity gate` 后面，除非该变更确实触及 QA 运行时、模型包对等性，或对等性工作流拥有的表面。对于常规渠道、配置、文档或单元测试修复，将其视为可选信号，并遵循范围化的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是一个供维护者手动运行的工作流，用于在落地后清理重复项。它默认采用试运行，并且只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已合并，并且每个重复项要么有共同引用的 issue，要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为范围较窄的第一轮安全扫描器，而不是完整的仓库扫描。每日和手动运行会使用高精度安全查询，扫描 Actions 工作流代码以及风险最高的 JavaScript/TypeScript 身份验证、密钥、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，并归入 `/codeql-critical-security/channel-runtime-boundary` 类别，这样渠道安全信号就能在不扩大基线 JS/TS 类别范围的情况下扩展。

`CodeQL Android Critical Security` 工作流是定时运行的 Android 安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并将结果上传到 `/codeql-critical-security/android` 类别。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并将结果上传到 `/codeql-critical-security/macos` 类别。让它保持在每日默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只在范围较窄的高价值表面上运行错误严重级别、非安全类 JavaScript/TypeScript 质量查询。它的基线作业扫描与安全工作流相同的身份验证、密钥、沙箱、cron 和 Gateway 网关表面。config-boundary 作业会扫描配置 schema、迁移、规范化和 IO 契约，并归入单独的 `/codeql-critical-quality/config-boundary` 类别。gateway-runtime-boundary 作业会扫描 Gateway 网关协议 schema 和服务器方法契约，并归入单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别。channel-runtime-boundary 作业会扫描核心渠道实现契约，并归入单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别。agent-runtime-boundary 作业会扫描命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约，并归入单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别。plugin-boundary 作业会扫描加载器、注册表、公开表面和插件 SDK 入口点契约，并归入单独的 `/codeql-critical-quality/plugin-boundary` 类别。让该工作流与安全工作流分离，这样质量发现项就能在不遮蔽安全信号的情况下进行调度、度量、禁用或扩展。Swift、Python、UI 和内置插件的 CodeQL 扩展应仅在这些窄范围 profile 拥有稳定的运行时间和信号之后，作为有范围或分片的后续工作再加回来。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，手动派发也可以直接运行它。当 `main` 已继续前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，由 workflow-run 触发的调用会跳过。运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢速测试。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果 UTC 当天已有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动派发会绕过该每日活动门禁。该通道会构建完整套件分组的 Vitest 性能报告，让 Codex 只进行保持覆盖率的小型测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 agent 之后的完整套件报告必须通过，才会提交任何内容。当 `main` 在 bot push 落地前前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI manifest                                      | 始终在非草稿 push 和 PR 上运行     |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                      | 始终在非草稿 push 和 PR 上运行     |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产 lockfile 审计                                          | 始终在非草稿 push 和 PR 上运行     |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                     | 始终在非草稿 push 和 PR 上运行     |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                                | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                           | Node 相关变更                      |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | Node 相关变更                      |
| `checks-node-extensions`         | 覆盖插件套件的完整内置插件测试分片                                                           | Node 相关变更                      |
| `checks-node-core-test`          | 核心 Node 测试分片，不含渠道、内置、契约和插件通道                                          | Node 相关变更                      |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke                         | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 Gateway 网关 watch 分片                                | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                       | Node 相关变更                      |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                             | 发布的手动 CI 派发                 |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                                  | 文档已变更                         |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                | Python skill 相关变更              |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时 import specifier 回归测试                       | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                         | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                    | Android 相关变更                   |
| `test-performance-agent`         | 受信活动后每日运行的 Codex 慢速测试优化                                                     | Main CI 成功或手动派发             |

手动 CI 派发会运行与普通 CI 相同的作业图，但会强制启用每个有范围的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行使用唯一的并发组，因此发布候选的完整套件不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信调用者使用所选派发 ref 中的工作流文件，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便便宜的检查先失败，再运行昂贵的检查：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，这样下游使用者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过变更作用域检测，并让预检清单
表现得像每个作用域区域都已变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但其本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台 lane 仍然仅限于平台源码变更。
仅 CI 路由编辑、部分低成本核心测试夹具编辑，以及窄范围的插件契约辅助/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于路由或辅助表面且这些表面会被快速任务直接执行时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的守护矩阵。
Windows Node 检查的作用域限定为 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该 lane 的 CI 工作流表面；无关的源码、插件、安装 smoke 和仅测试变更会留在 Linux Node lane 上，这样它们就不会占用 16-vCPU Windows worker 来覆盖已经由常规测试分片执行的内容。
单独的 `install-smoke` 工作流通过自己的 `preflight` job 复用同一个作用域脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/包表面、内置插件包/清单变更，以及 Docker smoke job 会执行的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行智能体删除共享工作区的 CLI smoke，运行容器 gateway-network e2e，验证一个内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，其中每个场景的 Docker 运行都会单独限制。完整路径保留 QR 包安装以及安装器 Docker/更新覆盖，用于夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request。`main` 推送（包括合并提交）不会强制完整路径；当变更作用域逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker smoke，并把完整安装 smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划任务和发布检查工作流中运行，手动 `install-smoke` 触发可以选择加入它，但 pull request 和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖 lane 的裸 Node/Git 运行器，以及一个将同一个 tarball 安装到 `/app` 中、用于常规功能 lane 的功能镜像。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行所选计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane；使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池 slot 数 10，使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池 slot 数 10。重型 lane 上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务 lane 不会让 Docker 过载，而较轻的 lane 仍会填满可用 slot。单个比有效上限更重的 lane 仍可以从空池启动，然后独占运行直到释放容量。默认情况下，lane 启动会错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃 lane 状态，持久化 lane 耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于调度器检查。默认情况下，它会在第一次失败后停止调度新的池化 lane，并且每个 lane 都有一个 120 分钟的兜底超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；所选 live/tail lane 使用更严格的逐 lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器 lane，包括仅发布 lane（如 `install-e2e`）以及拆分的内置更新 lane（如 `bundled-channel-update-acpx`），同时跳过清理 smoke，以便智能体复现单个失败 lane。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、lane 和凭据覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行的包 artifact，或从 `package_artifact_run_id` 下载包 artifact；验证 tarball 清单；当计划需要已安装包的 lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有包摘要镜像，而不是重新构建。`Package Acceptance` 工作流是高级包 gate：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的工作流 artifact 解析候选包，然后将这个单一的 `package-under-test` artifact 传递给可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开保留，这样当前验收逻辑无需检出旧工作流代码，也能验证较旧的受信任提交。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行更小的分块 job，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整 release-path 覆盖请求它时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的触发保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，这样安装器 E2E 和内置插件安装/卸载 sweep 不会主导关键路径。`install-e2e` lane 别名仍然是两个提供商安装器 lane 的聚合手动重跑别名。`bundled-channels` 分块会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行的一体化 `bundled-channel-deps` lane。每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢 lane 表，以及逐 lane 重跑命令。工作流 `docker_lanes` 输入会针对已准备的镜像运行所选 lane，而不是分块 job，这会将失败 lane 调试限制到一个有目标的 Docker job，并为该运行准备、下载或复用包 artifact；如果所选 lane 是 live Docker lane，则目标 job 会为该重跑在本地构建 live-test 镜像。生成的逐 lane GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，这样失败的 lane 可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker artifact 并打印合并/逐 lane 的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢 lane 和阶段关键路径摘要。定时 live/E2E 工作流每天运行完整的 release-path Docker 套件。内置更新矩阵按更新目标拆分，这样重复的 npm update 和 Doctor 修复过程可以与其他内置检查分片运行。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留为聚合插件/运行时别名，但发布工作流使用拆分分块，这样渠道 smoke、更新目标、插件运行时检查，以及内置插件安装/卸载 sweep 可以并行运行。目标 `docker_lanes` 触发也会在一个共享的包/镜像准备步骤后，将多个所选 lane 拆分为并行 job，并且内置渠道更新 lane 会对瞬时 npm 网络故障重试一次。

本地变更 lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查 gate 对架构边界的要求比宽泛的 CI 平台作用域更严格：核心生产变更会运行核心生产和核心测试类型检查以及核心 lint/守护检查，仅核心测试变更只运行核心测试类型检查以及核心 lint，扩展生产变更会运行扩展生产和扩展测试类型检查以及扩展 lint，仅扩展测试变更会运行扩展测试类型检查以及扩展 lint。公开插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展 sweep 是显式测试工作。仅发布元数据的版本 bump 会运行有目标的版本/配置/根依赖检查。未知的根/配置变更会故障安全地落到全部检查 lane。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且
有意比 `check:changed` 更低成本：直接测试编辑会运行自身，
源码编辑优先使用显式映射，然后是同级测试和导入图
依赖项。共享 group-room 投递配置是显式映射之一：
对群组可见回复配置、源码回复投递模式，或
message-tool 系统提示的变更会路由到核心回复测试，以及 Discord 和
Slack 投递回归测试，这样共享默认值变更会在首次 PR
推送之前失败。仅当变更范围足够横跨整个 harness，以至于低成本映射集合不是可信代理时，
才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并且在需要广泛证明时优先使用新预热的盒子。对于一个被复用、已过期，或刚刚报告了异常大同步量的盒子，在其上花时间运行慢速门禁之前，先在盒子内运行 `pnpm testbox:sanity`。当必需的根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪文件被删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。停止那个盒子并预热一个新的，而不是调试产品测试失败。对于有意进行大量删除的 PR，请为那次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 分发会运行 `checks-node-compat-node22`，作为发布候选版本兼容性覆盖。普通拉取请求和 `main` 推送会跳过该通道，并让矩阵聚焦在 Node 24 测试/渠道通道上。

最慢的 Node 测试族已拆分或均衡，以便每个作业保持较小规模且不会过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个插件工作器之间均衡，小型核心单元通道会成对运行，自动回复以四个均衡工作器运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic gateway/plugin 配置则分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。插件分片作业一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，以便导入较重的插件批次不会创建额外的 CI 作业。广泛 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与基础设施 core-runtime 分片一起运行，以免共享 runtime 分片承担尾部耗时。包含模式分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作保持在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界防护分片会在一个作业内并发运行其小型独立防护。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免两个额外 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行 debug APK 打包作业。
当同一个 PR 或 `main` ref 上有新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 预检也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 省下的成本不及带来的开销；install-smoke Docker 构建，其中 32-vCPU 的排队时间成本也高于节省的时间                                                                                                                                                                                                                                                                                                     |
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

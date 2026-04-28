---
read_when:
    - 你需要了解 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-28T11:47:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: af18c63cc3564b5be339f2f390c1528e83e71c46243bfa464e2900618104d95f
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能范围限定，在只有无关区域发生变更时跳过昂贵作业。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并展开完整的常规 CI 图，用于发布候选版本或广泛验证。

`Full Release Validation` 是“发布前运行所有内容”的手动总控工作流。它接受一个分支、标签或完整提交 SHA，使用该目标派发手动 `CI` 工作流，并派发 `OpenClaw Release Checks`，用于安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab 对等性、Matrix 和 Telegram 车道。提供已发布包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的实时/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键车道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总控工作流会记录已派发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行附加最慢作业表。如果重新运行某个子工作流后变为绿色，只需重新运行父级验证作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅常规完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，或在总控中使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在定向修复后将失败发布箱的重新运行限制在有界范围内。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它会通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样可以保持相同的文件覆盖，同时让缓慢的实时提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重新运行。

`OpenClaw Release Checks` 使用受信任的工作流引用，将选定引用一次性解析为 `release-package-under-test` tarball，然后把该构件传给实时/E2E 发布路径 Docker 工作流和包验收分片。这样可以让发布箱之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是用于验证包构件且不阻塞发布工作流的旁路运行工作流。它会从已发布的 npm 规范、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 构件解析一个候选版本，将其上传为 `package-under-test`，然后使用该 tarball 复用 Docker 发布/E2E 调度器，而不是重新打包工作流检出。配置文件覆盖冒烟、包、产品、完整和自定义 Docker 车道选择。`package` 配置文件使用离线插件覆盖，因此已发布包验证不会被实时 ClawHub 可用性阻塞。可选的 Telegram 车道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 构件，并保留已发布 npm 规范路径用于独立派发。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收会通过用户在安装或更新后实际使用的同一个 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选版本，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该构件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行选定的 Docker 车道，而不是打包工作流检出。当某个配置文件选择多个定向 `docker_lanes` 时，可复用工作流会先准备包和共享镜像一次，然后将这些车道展开为并行的定向 Docker 作业，并使用唯一构件。
3. `package_telegram` 可选择调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 解析出包时安装同一个 `package-under-test` 构件；独立 Telegram 派发仍可安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 车道失败时使工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或确切的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版本验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签访问，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享构件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 就能验证较旧的受信任源提交，而不运行旧的工作流逻辑。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径块
- `custom`：确切的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 块覆盖重叠的包/更新/插件车道，而 Package Acceptance 会针对同一个已解析包 tarball 保留构件原生的内置渠道兼容、离线插件和 Telegram 证明。
跨 OS 发布检查仍会覆盖特定于 OS 的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新车道还会验证已安装包可以从原始绝对 Windows 路径导入浏览器控制覆盖。

Package Acceptance 对已发布包有有界的旧版兼容窗口。到 `2026.4.25` 为止的包（包括 `2026.4.25-beta.*`）可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过持久化子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的已持久化 `update.channel`；插件冒烟可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、车道日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或确切 Docker 车道，而不是重新运行完整发布验证。

QA Lab 在主智能范围限定工作流之外有专用 CI 车道。`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动派发；它会将模拟对等性门禁、实时 Matrix 车道，以及实时 Telegram 和 Discord 车道展开为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。Matrix 对计划和发布门禁使用 `--profile fast`，仅当检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 派发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 车道；它的 QA 对等性门禁会将候选包和基线包作为并行车道作业运行，然后将两个构件下载到小型报告作业中，用于最终对等性比较。
除非变更实际触及 QA 运行时、模型包对等性或对等性工作流拥有的表面，否则不要把 PR 合并路径放在 `Parity gate` 后面。对于常规渠道、配置、文档或单元测试修复，将其视为可选信号，并遵循限定范围的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是一个供维护者手动运行的工作流，用于落地后的重复项清理。它默认执行 dry-run，且只有在 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已经合并，并验证每个重复项要么有共同引用的 issue，要么有重叠的变更代码块。

`CodeQL` 工作流刻意作为一个范围较窄的第一轮安全扫描器，而不是完整仓库扫描。每日运行和手动运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关相关表面，并使用高精度安全查询。

`CodeQL Android Critical Security` 工作流是定时运行的 Android 安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并将结果上传到 `/codeql-critical-security/android` 类别下。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并将结果上传到 `/codeql-critical-security/macos` 类别下。请将它保留在每日默认工作流之外，因为即使干净通过，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只在范围较窄的高价值表面上运行错误严重级别的非安全 JavaScript/TypeScript 质量查询。它的基线作业会扫描与安全工作流相同的凭证、密钥、沙箱、cron 和 Gateway 网关表面。config-boundary 作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公共表面和插件 SDK 入口点契约。请让该工作流与安全工作流分离，这样质量发现项就可以在不遮蔽安全信号的情况下进行定时运行、度量、禁用或扩展。Swift、Python、UI 和内置插件的 CodeQL 扩展，只有在这些窄范围配置文件具备稳定运行时间和稳定信号后，才应作为有范围或分片的后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于保持现有文档与最近落地的更改一致。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，也可以通过手动 dispatch 直接运行它。当 `main` 已经前进，或者过去一小时内已经创建过另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一次未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积的所有 main 更改。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于慢速测试。它没有纯定时计划：`main` 上一次成功的非 bot push CI 运行可以触发它，但如果同一个 UTC 日内已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动 dispatch 会绕过这个每日活动门禁。该通道会生成完整套件分组 Vitest 性能报告，让 Codex 只做保留覆盖率的小型测试性能修复，而不是广泛重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的更改。如果基线有失败测试，Codex 只能修复明显的失败项，并且 after-agent 完整套件报告必须通过后才能提交任何内容。当 bot push 落地前 `main` 前进时，该通道会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试 push；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与文档智能体相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档更改、变更范围、变更扩展，并构建 CI manifest                                      | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 执行私钥检测和工作流审计                                                       | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisory 执行无依赖生产 lockfile 审计                                               | 始终在非草稿 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                     | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查和可复用下游产物                                      | Node 相关更改 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                           | Node 相关更改 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | Node 相关更改 |
| `checks-node-extensions`         | 跨扩展套件的完整内置插件测试分片                                                             | Node 相关更改 |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和扩展通道                                        | Node 相关更改 |
| `check`                          | 分片的主要本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke                       | Node 相关更改 |
| `check-additional`               | 架构、边界、扩展表面 guard、包边界和 Gateway 网关 watch 分片                                | Node 相关更改 |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                        | Node 相关更改 |
| `checks`                         | 构建产物渠道测试的验证器                                                                     | Node 相关更改 |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                              | 发布时手动 CI dispatch |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                    | 文档已更改 |
| `skills-python`                  | 针对 Python 支撑的 Skills 执行 Ruff + pytest                                                 | Python Skills 相关更改 |
| `checks-windows`                 | Windows 专用进程/路径测试，以及共享运行时 import specifier 回归检查                         | Windows 相关更改 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | macOS 相关更改 |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关更改 |
| `android`                        | 两种 flavor 的 Android 单元测试，加上一次 debug APK 构建                                    | Android 相关更改 |
| `test-performance-agent`         | 受信活动后的每日 Codex 慢速测试优化                                                          | Main CI 成功或手动 dispatch |

手动 CI dispatch 会运行与普通 CI 相同的作业图，但会强制开启每个有范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行使用唯一的 concurrency group，因此 release-candidate 完整套件不会被同一 ref 上的另一次 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信调用方在使用所选 dispatch ref 的工作流文件时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业会按顺序排列，使低成本检查先于昂贵检查失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过变更作用域检测，并让预检清单表现得像每个限定区域都已变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但其本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然限定为平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试夹具编辑，以及范围较窄的插件契约辅助工具/测试路由编辑，会使用快速的仅 Node 清单路径：预检、安全检查，以及一个 `checks-fast-core` 任务。当变更文件仅限于快速任务直接覆盖的路由或辅助工具表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片以及额外的守卫矩阵。
Windows Node 检查限定于 Windows 专用的进程/路径封装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；不相关的源代码、插件、安装冒烟和仅测试变更会留在 Linux Node 通道上，因此不会为了普通测试分片已经覆盖的范围占用 16 vCPU Windows 工作器。
单独的 `install-smoke` 工作流通过自己的 `preflight` 作业复用同一个作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker 工作器。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete 共享工作区 CLI 冒烟，运行容器 Gateway 网关网络 e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件，同时分别限制每个场景的 Docker 运行时间。完整路径会为夜间计划运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。`main` 推送（包括合并提交）不会强制运行完整路径；当变更作用域逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟，并将完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分发可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖通道的裸 Node/Git 运行器，以及一个将同一个 tarball 安装到 `/app` 中、用于常规功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池槽位数 10。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，因此 npm 安装和多服务通道不会让 Docker 过度承诺资源，同时较轻的通道仍可填满可用槽位。单个通道即使重于有效上限，也仍可从空池启动，然后独占运行直到释放容量。默认情况下，通道启动会错开 2 秒，以避免本地 Docker 守护进程创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在首次失败后停止调度新的池化通道，每个通道都有 120 分钟的兜底超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的实时/尾部通道使用更严格的按通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（例如 `install-e2e`）和拆分的内置更新通道（例如 `bundled-channel-update-acpx`），同时跳过清理冒烟，以便智能体可以复现一个失败通道。可复用的实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、实时镜像、通道和凭据覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带有包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。`Package Acceptance` 工作流是高级包门禁：它会从 npm、可信 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流产物解析候选包，然后将该单一 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较旧的可信提交，而无需检出旧工作流代码。发布检查会针对目标引用运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对解析后 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行较小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整发布路径覆盖请求它时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的分发保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，因此安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 通道别名仍然是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及按通道重跑命令。工作流 `docker_lanes` 输入会针对已准备好的镜像运行选定通道，而不是运行分块作业，这会将失败通道调试限制在一个有针对性的 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定通道是实时 Docker 通道，目标作业会为该重跑在本地构建实时测试镜像。生成的按通道 GitHub 重跑命令会在值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker 产物，并打印组合/按通道的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢通道和阶段关键路径摘要。计划实时/E2E 工作流每天运行完整发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm 更新和 Doctor 修复流程可以与其他内置检查一起分片。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍然是聚合插件/运行时别名，但发布工作流使用拆分分块，因此渠道冒烟、更新目标、插件运行时检查，以及内置插件安装/卸载扫描可以并行运行。目标 `docker_lanes` 分发也会在一个共享包/镜像准备步骤后，将多个选定通道拆分为并行作业，并且内置渠道更新通道会针对暂时性 npm 网络故障重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界方面比宽泛的 CI 平台作用域更严格：核心生产变更会运行核心生产和核心测试类型检查以及核心 lint/守卫，核心仅测试变更只运行核心测试类型检查以及核心 lint，扩展生产变更会运行扩展生产和扩展测试类型检查以及扩展 lint，扩展仅测试变更会运行扩展测试类型检查以及扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展扫描属于显式测试工作。仅发布元数据的版本号提升会运行目标版本/配置/根依赖检查。未知根目录/配置变更会故障安全地落到所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更低成本：直接测试编辑会运行自身，源代码编辑会优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示的变更，会经过核心回复测试以及 Discord 和 Slack 投递回归，因此共享默认值变更会在第一次 PR 推送之前失败。只有当变更覆盖整个 harness，以至于低成本映射集无法作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并且对大范围证明优先使用新的预热 box。在把较慢的 gate 花在一个复用、过期或刚报告异常大同步量的 box 上之前，先在该 box 内运行 `pnpm testbox:sanity`。当 `pnpm-lock.yaml` 等必需的根文件消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。应停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意包含大量删除的 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 分派会运行 `checks-node-compat-node22`，作为候选发布版本兼容性覆盖。普通 pull request 和 `main` 推送会跳过该 lane，并让矩阵聚焦于 Node 24 测试/渠道 lane。

最慢的 Node 测试族已被拆分或均衡，以便每个 job 保持较小规模且不过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个 extension worker 之间均衡，小型核心单元 lane 成对运行，auto-reply 以四个均衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic gateway/plugin 配置则分布到现有的仅源码 agentic Node job 中，而不是等待构建产物。大范围浏览器、QA、媒体和其他杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。Extension 分片 job 一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node heap，这样 import 密集型插件批次不会创建额外的 CI job。大范围 agents lane 使用共享的 Vitest 文件并行调度器，因为它主要受 import/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片承担尾部耗时。include-pattern 分片使用 CI 分片名称记录 timing 条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和筛选后的分片。`check-additional` 将 package-boundary compile/canary 工作放在一起，并把 runtime topology architecture 与 gateway watch 覆盖拆开；boundary guard 分片会在一个 job 内并发运行其小型独立 guard。Gateway watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量 verifier job，同时避免两个额外 Blacksmith worker 和第二个 artifact-consumer 队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；它的 unit-test lane 仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包 job。
当同一 PR 或 `main` ref 上有更新推送到达时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则应将其视为 CI 噪音。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常分片失败，但不会在整个 workflow 已被取代后继续排队。
自动 CI concurrency key 已版本化（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸状态不能无限阻塞较新的 main 运行。手动 full-suite 运行使用 `CI-manual-v1-*`，并且不会取消正在运行的任务。

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全 job 和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合 verifier、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，使用 8 vCPU 的成本高于节省；install-smoke Docker 构建中，32-vCPU 排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本地等价命令

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

## 相关

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

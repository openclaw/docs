---
read_when:
    - 你需要理解 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等效项
title: 持续集成流水线
x-i18n:
    generated_at: "2026-04-29T02:52:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b66d2f7d1a02955f9e9ee94fa6431c0652f62babde8c502a4b104ea811ee450
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 和每个拉取请求时运行。它使用智能作用域，在只有无关区域发生变更时跳过昂贵作业。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并为发布候选或广泛验证展开完整的常规 CI 图。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标分派手动 `CI` 工作流，并分派 `OpenClaw Release Checks`，用于安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lane。提供已发布包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的 live/provider 覆盖范围：`minimum` 保留最快的 OpenAI/core 发布关键 lane，`stable` 添加稳定的 provider/backend 集合，`full` 运行广泛的 advisory provider/media 矩阵。总括工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果重新运行子工作流后变为绿色，只需重新运行父验证器作业，即可刷新总括结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对发布候选使用 `all`，仅对常规完整 CI 子项使用 `ci`，对每个发布子项使用 `release-checks`，或者在总括工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在聚焦修复后，将失败发布箱的重新运行范围保持有界。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、provider 过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及 provider 过滤的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，让缓慢的 live provider 失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重新运行。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支持的 live 套件保留在普通 Blacksmith runner 上，因为容器作业不适合启动嵌套 Docker 测试。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定 ref 一次性解析为 `release-package-under-test` tarball，然后将该 artifact 传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这会让发布箱之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选。

`Package Acceptance` 是用于在不阻塞发布工作流的情况下验证包 artifact 的旁路运行工作流。它会从已发布的 npm 规范、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball artifact 中解析一个候选，将其上传为 `package-under-test`，然后复用 Docker release/E2E 调度器，并使用该 tarball，而不是重新打包工作流检出内容。Profile 覆盖 smoke、package、product、full 和自定义 Docker lane 选择。`package` profile 使用离线 plugin 覆盖，因此已发布包验证不会被 live ClawHub 可用性卡住。可选 Telegram lane 会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` artifact，同时保留已发布 npm 规范路径供独立分派使用。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收通过用户安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该 artifact，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker lane，而不是打包工作流检出内容。当某个 profile 选择多个定向 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些 lane 展开为并行的定向 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并在 Package Acceptance 已解析包时安装同一个 `package-under-test` artifact；独立 Telegram 分派仍可安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram lane 失败时使工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或像 `openclaw@2026.4.27-beta.2` 这样的精确 OpenClaw 发布版本。将它用于已发布 beta/stable 验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签访问，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但应为外部共享 artifact 提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这样当前测试 harness 可以验证较旧的受信任源提交，而不运行旧工作流逻辑。

Profile 映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的 package/update/plugin lane，而 Package Acceptance 保留针对同一个已解析包 tarball 的 artifact 原生 bundled-channel 兼容性、离线 plugin 和 Telegram 证明。
跨 OS 发布检查仍覆盖特定于 OS 的新手引导、安装器和平台行为；package/update 产品验证应从 Package Acceptance 开始。Windows packaged 和 installer fresh lane 还会验证已安装包能否从原始绝对 Windows 路径导入 browser-control override。

Package Acceptance 对已发布包设置了有界的旧版兼容窗口。到 `2026.4.25` 为止的包（包括 `2026.4.25-beta.*`）可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的 fake git fixture 中修剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；plugin 冒烟可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已随包发布的本地构建元数据戳记文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker artifact：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重新运行命令。优先重新运行失败的包 profile 或精确 Docker lane，而不是重新运行完整发布验证。

QA Lab 在主智能作用域工作流之外有专用 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动派发；它会将模拟一致性门、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道拆分为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。Matrix 会在计划任务和发布门中使用 `--profile fast`，仅当检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 派发始终会把完整 Matrix 覆盖拆分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道；其 QA 一致性门会把候选包和基线包作为并行通道作业运行，然后把两个制品下载到一个小型报告作业中，用于最终一致性比较。
除非变更确实触及 QA 运行时、模型包一致性，或一致性工作流负责的表面，否则不要把 PR 合并路径放在 `Parity gate` 后面。对于普通的渠道、配置、文档或单元测试修复，把它视为可选信号，并遵循作用域内的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是一个用于合并后重复项清理的手动维护者工作流。它默认 dry-run，并且仅在 `apply=true` 时关闭显式列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已合并，并验证每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，类别为 `/codeql-critical-security/channel-runtime-boundary`，这样渠道安全信号就可以在不扩大基线 JS/TS 类别的情况下扩展。

`CodeQL Android Critical Security` 工作流是计划执行的 Android 安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上，为 CodeQL 手动构建 Android 应用，并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动的 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos` 类别下上传结果。将它保持在每日默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，针对窄范围高价值表面运行错误严重级别的非安全 JavaScript/TypeScript 质量查询。它的基线作业会扫描与安全工作流相同的凭证、密钥、沙箱、cron 和 Gateway 网关表面。config-boundary 作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法契约。channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。agent-runtime-boundary 作业会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公开表面和插件 SDK 入口点契约。将该工作流与安全分开，以便质量发现可以在不掩盖安全信号的情况下被计划、度量、禁用或扩展。Swift、Python、UI 和内置插件的 CodeQL 扩展应仅在窄范围 profile 具备稳定运行时间和信号后，作为有作用域或分片的后续工作重新加入。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近合并的变更保持一致。它没有纯计划任务：`main` 上成功的非 bot push CI 运行可以触发它，手动派发也可以直接运行它。当 `main` 已经前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个用于慢测试的事件驱动 Codex 维护通道。它没有纯计划任务：`main` 上成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动派发会绕过这个每日活动门。该通道会构建全套分组 Vitest 性能报告，让 Codex 只做小型且保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行全套报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 agent 之后的全套报告必须通过后才会提交任何内容。当 `main` 在 bot push 落地前前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；存在冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更作用域、变更插件，并构建 CI 清单                                         | 始终在非草稿 push 和 PR 上运行     |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 始终在非草稿 push 和 PR 上运行     |
| `security-dependency-audit`      | 针对 npm 安全公告执行无依赖的生产 lockfile 审计                                              | 始终在非草稿 push 和 PR 上运行     |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                     | 始终在非草稿 push 和 PR 上运行     |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建制品检查，以及可复用的下游制品                                | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                                            | Node 相关变更                      |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                                                   | Node 相关变更                      |
| `checks-node-extensions`         | 覆盖插件套件的完整内置插件测试分片                                                           | Node 相关变更                      |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道                                         | Node 相关变更                      |
| `check`                          | 分片的主本地门等价项：生产类型、lint、guard、测试类型和严格 smoke                            | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片                                      | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                        | Node 相关变更                      |
| `checks`                         | 构建制品渠道测试的验证器                                                                     | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                              | 发布的手动 CI 派发                 |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                                  | 文档变更                           |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | Python skill 相关变更              |
| `checks-windows`                 | Windows 特定进程/路径测试，以及共享运行时 import specifier 回归                              | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建制品的 macOS TypeScript 测试通道                                                 | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                     | Android 相关变更                   |
| `test-performance-agent`         | 受信活动后的每日 Codex 慢测试优化                                                            | Main CI 成功或手动派发             |

手动 CI 派发会运行与普通 CI 相同的作业图，但会强制开启每个作用域通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行使用唯一的并发组，因此发布候选的全套运行不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信调用方在使用所选派发 ref 的工作流文件时，针对分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，使低成本检查先于高成本检查失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的制品和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，以便下游消费者能在共享构建就绪后立即开始。
4. 更重的平台和运行时通道会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过变更范围检测，并让预检清单
表现得像每个受限范围都发生了变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只限于平台源代码变更。
仅 CI 路由的编辑、选定的低成本核心测试夹具编辑，以及范围很窄的插件契约辅助工具/测试路由编辑，会使用快速的仅 Node 清单路径：预检、安全检查，以及一个 `checks-fast-core` 任务。该路径会在变更文件仅限于路由或辅助工具表面，且快速任务会直接覆盖这些表面时，避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的保护矩阵。
Windows Node 检查仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、install-smoke 和仅测试变更会留在 Linux Node 通道上，因此不会为正常测试分片已经覆盖的内容占用 16-vCPU Windows 工作器。
单独的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker 工作器。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行智能体删除共享工作区 CLI 冒烟测试，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置，同时分别限制每个场景的 Docker 运行时长。完整路径会为夜间计划运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求保留 QR 包安装和安装器 Docker/更新覆盖。`main` 推送（包括合并提交）不会强制走完整路径；当变更范围逻辑在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并把完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分发可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留自己的安装专用 Dockerfile。本地 `test:docker:all` 会预构建一个共享的实时测试镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖通道的裸 Node/Git 运行器，以及一个将相同 tarball 安装到 `/app` 中、用于普通功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认值为 10 的主池槽位数，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整默认值为 10 的提供商敏感尾池槽位数。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm 安装和多服务通道不会让 Docker 过载，同时较轻的通道仍可填满可用槽位。单个比有效上限更重的通道仍可从空池启动，然后独占运行，直到释放容量。默认情况下通道启动会错开 2 秒，以避免本地 Docker 守护进程创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道 Status，持久化通道耗时以便按最长优先排序，并支持用 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 检查调度器。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的回退超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的实时/尾部通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（如 `install-e2e`）和拆分后的内置更新通道（如 `bundled-channel-update-acpx`），同时跳过清理冒烟测试，以便智能体复现单个失败通道。可复用的实时/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、实时镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带有包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的包摘要镜像，而不是重新构建。`Package Acceptance` 工作流是高级包门禁：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前工作流产物中解析候选项，然后把单个 `package-under-test` 产物传递给可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，使当前验收逻辑能够验证较旧的受信任提交，而无需检出旧工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行较小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-services`，并且只在仅 OpenWebUI 分发时保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分后的分块，因此安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体式 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及单通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是分块作业，这会将失败通道调试限制在一个有针对性的 Docker 作业内，并为该次运行准备、下载或复用包产物；如果选定通道是实时 Docker 通道，目标作业会在本地为该重跑构建实时测试镜像。生成的单通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备的镜像输入，因此失败通道可以复用失败运行中的确切包和镜像。使用 `pnpm test:docker:rerun <run-id>` 下载 GitHub 运行中的 Docker 产物，并打印组合/单通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢通道和阶段关键路径摘要。计划的实时/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm 更新和 Doctor 修复轮次可以与其他内置检查分片运行。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍保留为聚合插件/运行时别名，但发布工作流使用拆分后的分块，因此渠道冒烟、更新目标、插件运行时检查，以及内置插件安装/卸载扫描可以并行运行。目标 `docker_lanes` 分发也会在一个共享包/镜像准备步骤之后，将多个选定通道拆分为并行作业，并且内置渠道更新通道会针对临时 npm 网络故障重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试类型检查以及核心 lint/保护检查，仅核心测试变更只运行核心测试类型检查和核心 lint，扩展生产变更会运行扩展生产和扩展测试类型检查以及扩展 lint，仅扩展测试变更会运行扩展测试类型检查和扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展扫描是显式测试工作。仅发布元数据的版本号变更会运行目标版本/配置/根依赖检查。未知的根/配置变更会保守地退回到所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且
有意比 `check:changed` 更低成本：直接测试编辑会运行自身，
源代码编辑优先使用显式映射，然后是同级测试和导入图
依赖项。共享 group-room 投递配置是显式映射之一：
对群组可见回复配置、源回复投递模式或
message-tool 系统提示词的变更，会路由到核心回复测试以及 Discord 和
Slack 投递回归测试，因此共享默认值变更会在第一次 PR
推送前失败。仅当变更足够覆盖整个 harness，低成本映射集合不能作为可信代理时，
才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

进行 Testbox 验证时，请从仓库根目录运行；对于范围较广的证明，优先使用新预热的 box。在把缓慢的关卡耗在被复用、已过期，或刚报告了异常大规模同步的 box 之前，先在该 box 内运行 `pnpm testbox:sanity`。当必需的根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪文件被删除时，完整性检查会快速失败。这通常表示远程同步状态不是该 PR 的可信副本。应停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意进行大规模删除的 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 调度会运行 `checks-node-compat-node22` 作为候选发布版本的兼容性覆盖。普通拉取请求和 `main` 推送会跳过该通道，让矩阵聚焦在 Node 24 测试/渠道通道上。

最慢的 Node 测试族会被拆分或均衡，以便每个作业保持较小规模，同时不超额预留运行器：渠道契约会作为三个加权分片运行，内置插件测试会在六个 extension worker 间均衡，小型核心单元通道会成对运行，auto-reply 会作为四个均衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置会分散到现有仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件总括配置。Extension 分片作业一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，因此导入繁重的插件批次不会创建额外 CI 作业。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，避免共享 runtime 分片承担尾部耗时。包含模式分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和经过筛选的分片。`check-additional` 会把 package-boundary 编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；boundary guard 分片会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证作业，同时避免两个额外 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行 debug APK 打包作业。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常分片失败，但在整个 workflow 已被取代后不会继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，8 vCPU 节省的成本不足以抵消代价；install-smoke Docker 构建中，32-vCPU 的排队时间成本高于其节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

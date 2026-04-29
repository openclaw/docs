---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T08:10:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b04936e72ab12131806b01a994db9265142064f264afc350e3985b81aa2ce494
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 和每个拉取请求时运行。它使用智能作用域，在只有无关区域发生更改时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并为候选发布版本或广泛验证展开完整的常规 CI 图，其中 Android 通道在独立手动运行中通过 `include_android` 选择启用。仅发布用的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只会从 `Full Release Validation` 或显式手动调度运行。

`Full Release Validation` 是用于“发布前运行全部内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以提供仅发布用的插件/包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 以执行安装冒烟测试、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已发布包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的 live/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总控会记录已调度子运行的 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变为绿色，只需重新运行父级验证器作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对于候选发布版本使用 `all`，仅针对常规完整 CI 子项使用 `ci`，针对每个发布子项使用 `release-checks`，或在总控上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在聚焦修复后，让失败的发布箱重新运行保持有界。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它会通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分后的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样既保持相同的文件覆盖，也让缓慢的 live 提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。请将 Docker 支持的 live 套件保留在普通 Blacksmith 运行器上，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支持的 live 模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行。如果这些分片独立重新构建完整的源码 Docker 目标，说明发布运行配置错误，并且会在重复镜像构建上浪费墙钟时间。

`OpenClaw Release Checks` 使用受信任的工作流引用将选定引用一次性解析为 `release-package-under-test` tarball，然后将该工件传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以让发布箱之间的包字节保持一致，并避免在多个子作业中重新打包同一个候选版本。

`Package Acceptance` 是用于在不阻塞发布工作流的情况下验证包工件的旁路运行工作流。它会从已发布的 npm 规格、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 工件中解析一个候选包，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，使用该 tarball 而不是重新打包工作流检出。Profile 覆盖冒烟、包、产品、完整和自定义 Docker 通道选择。`package` profile 使用离线插件覆盖，因此已发布包验证不会受 live ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，同时保留已发布 npm 规格路径供独立调度使用。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收通过用户安装或更新后会运行的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包而不是工作流检出打包结果运行所选 Docker 通道。当一个 profile 选择多个定向 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些通道展开为带有唯一工件的并行定向 Docker 作业。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 已解析出一个包，它会安装同一个 `package-under-test` 工件；独立 Telegram 调度仍可安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将它用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享的工件应当提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这让当前测试 harness 能够验证较旧的受信任源码提交，而无需运行旧的工作流逻辑。

Profile 映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而 Package Acceptance 保留针对同一个已解析包 tarball 的工件原生内置渠道兼容、离线插件和 Telegram 证明。
跨 OS 发布检查仍会覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包版和安装器全新安装通道还会验证已安装包可以从原始绝对 Windows 路径导入浏览器控制覆盖。

Package Acceptance 对已发布包有有界的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过持久化子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据标记文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重新运行命令。优先重新运行失败的包 profile 或精确 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能作用域工作流之外有专用 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 的智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动触发；它会将模拟一致性门禁、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布检查会使用确定性的模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和正常提供商插件启动隔离。实时传输 Gateway 网关还会禁用内存搜索，因为 QA 一致性会单独覆盖内存行为；提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 对计划任务和发布门禁使用 `--profile fast`，仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 触发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布审批前运行发布关键的 QA Lab 通道；它的 QA 一致性门禁会将候选包和基线包作为并行通道作业运行，然后把两个构件下载到一个小型报告作业中，用于最终一致性比较。
不要把 PR 落地路径放到 `Parity gate` 后面，除非变更确实触及 QA 运行时、模型包一致性，或一致性工作流拥有的表面。对于常规渠道、配置、文档或单元测试修复，应将其视为可选信号，并遵循作用域化的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。它默认是 dry-run，并且只有在 `apply=true` 时才关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已合并，并且每个重复 PR 都有共享的引用 issue 或重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的首轮安全扫描器，而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会在 `/codeql-critical-security/channel-runtime-boundary` 类别下，单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，因此渠道安全信号可以在不扩大基线 JS/TS 类别的情况下扩展。

`CodeQL Android Critical Security` 工作流是计划运行的 Android 安全分片。它会在工作流完整性检查接受的最小 Blacksmith Linux runner 标签上，为 CodeQL 手动构建 Android 应用，并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos` 类别下上传结果。请将其保持在每日默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，针对窄范围高价值表面运行错误严重级别、非安全类 JavaScript/TypeScript 质量查询。它的 core-auth-secrets 作业会在单独的 `/codeql-critical-quality/core-auth-secrets` 类别下扫描凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码。config-boundary 作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置架构、迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法契约。channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。agent-runtime-boundary 作业会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、自动回复分发与队列，以及 ACP 控制平面运行时契约。mcp-process-runtime-boundary 作业会在单独的 `/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP 服务器和工具桥接、进程监管助手，以及出站投递契约。memory-runtime-boundary 作业会在单独的 `/codeql-critical-quality/memory-runtime-boundary` 类别下扫描内存宿主 SDK、内存运行时 facade、内存插件 SDK 别名、内存运行时激活 glue，以及内存 Doctor 命令。ui-control-plane 作业会在单独的 `/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约。web-media-runtime-boundary 作业会在单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 Web 获取/搜索、媒体 IO、媒体理解、图像生成和媒体生成运行时契约。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公共表面和插件 SDK 入口点契约。保持该工作流与安全工作流分离，这样质量发现就可以在不掩盖安全信号的情况下被计划、度量、禁用或扩展。Swift、Python 和内置插件的 CodeQL 扩展只有在窄范围配置具有稳定运行时间和信号后，才应作为作用域化或分片式后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯计划任务：`main` 上成功的非 bot 推送 CI 运行可以触发它，手动触发也可以直接运行它。当 `main` 已继续前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯计划任务：`main` 上成功的非 bot 推送 CI 运行可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动触发会绕过这个每日活动门禁。该通道会构建完整套件分组的 Vitest 性能报告，让 Codex 只做小型的、保持覆盖率的测试性能修复，而不是宽泛重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 agent 后的完整套件报告必须通过后才能提交任何内容。当 `main` 在 bot 推送落地前前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试推送；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更作用域、变更插件，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 检测私钥并审计工作流                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisory 对生产 lockfile 进行无依赖审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合                                                | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建构件检查，以及可复用下游构件          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关变更              |
| `check`                          | 分片式主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 已构建构件渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布的手动 CI 触发    |
| `check-docs`                     | 文档格式化、lint 和坏链检查                                                | 文档已变更                       |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                       | Python skill 相关变更      |
| `checks-windows`                 | Windows 特定进程/路径测试，以及共享运行时 import specifier 回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建构件的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢测试优化                                    | Main CI 成功或手动触发 |

手动 CI 分发运行与普通 CI 相同的作业图，但会强制开启每个
非 Android 作用域的 lane：Linux Node 分片、内置插件分片、渠道
契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档
检查、Python skills、Windows、macOS，以及 Control UI i18n。独立的手动 CI
分发仅在 `include_android=true` 时运行 Android；完整发布总控通过传入
`include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的
`agentic-plugins` 分片、完整扩展批量扫查，以及插件预发布 Docker lane
不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 分发启用
发布验证门控并触发单独的 `Plugin Prerelease` workflow 时运行。
手动运行使用唯一的并发组，因此候选发布的完整套件不会被同一 ref 上的
另一次 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任的调用者
使用所选分发 ref 的 workflow 文件，针对某个分支、标签或完整提交 SHA
运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业会按顺序排列，让廉价检查先于昂贵检查失败：

1. `preflight` 决定到底存在哪些 lane。`docs-scope` 和 `changed-scope` 逻辑是该作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux lane 重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时 lane 随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过 changed-scope 检测，并让 preflight 清单表现得像每个作用域区域都已变更一样。
CI workflow 编辑会验证 Node CI 图和 workflow linting，但其本身不会强制 Windows、Android 或 macOS 原生构建；这些平台 lane 仍然只由平台源代码变更触发。
仅 CI 路由的编辑、选定的廉价核心测试 fixture 编辑，以及狭窄的插件契约 helper/测试路由编辑会使用快速的仅 Node 清单路径：preflight、security，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或 helper 表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的防护矩阵。
Windows Node 检查的作用域限于 Windows 特定的进程/路径包装器、npm/pnpm/UI runner helper、包管理器配置，以及执行该 lane 的 CI workflow 表面；不相关的源代码、插件、install-smoke 和仅测试变更会保留在 Linux Node lane 上，因此不会为普通测试分片已经覆盖的内容占用一个 16-vCPU Windows worker。
单独的 `install-smoke` workflow 通过自己的 `preflight` 作业复用相同的作用域脚本。它把冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会为 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟，运行容器 gateway-network e2e，验证一个内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，同时每个场景的 Docker 运行都有单独上限。完整路径会为夜间定时运行、手动分发、workflow-call 发布检查，以及确实触及安装器/包/Docker 表面的 pull request 保留 QR 包安装和安装器 Docker/update 覆盖。`main` push（包括 merge commit）不会强制完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，该 workflow 会保留快速 Docker 冒烟，并把完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查 workflow 中运行，手动 `install-smoke` 分发可以选择加入，但 pull request 和 `main` push 不会运行它。QR 和安装器 Docker 测试保留各自专注安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/update/plugin-dependency lane 的裸 Node/Git runner，以及一个将同一个 tarball 安装到 `/app` 中、供普通功能 lane 使用的功能镜像。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool slot 数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整提供商敏感 tail-pool slot 数 10。重型 lane 上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务 lane 不会让 Docker 超额提交，同时较轻的 lane 仍会填满可用 slot。单个比有效上限更重的 lane 仍可从空池启动，然后独占运行直到释放容量。lane 启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker、移除过期 OpenClaw E2E 容器、发出活动 lane 状态、持久化 lane 时序以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化 lane，并且每个 lane 都有 120 分钟的回退超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail lane 使用更严格的逐 lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器 lane，包括仅发布 lane（如 `install-e2e`）和拆分的内置 update lane（如 `bundled-channel-update-acpx`），同时跳过清理冒烟，以便智能体复现一个失败 lane。可复用 live/E2E workflow 会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、lane 和凭据覆盖，然后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；在计划需要已安装包的 lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有的包摘要镜像，而不是重新构建。`Package Acceptance` workflow 是高级包门控：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的 workflow 产物解析候选包，然后把那个单一的 `package-under-test` 产物传入可复用 Docker E2E workflow。它将 `workflow_ref` 与 `package_ref` 分开，因此当前 acceptance 逻辑可以验证较早的受信任提交，而无需 checkout 旧的 workflow 代码。发布检查会为目标 ref 运行自定义 Package Acceptance delta：内置渠道兼容性、离线插件 fixture，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件使用较小的分块作业并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取所需的镜像类型，并通过相同的加权调度器执行多个 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的分发保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布 workflow 使用拆分分块，这样安装器 E2E 和内置插件安装/卸载扫查不会主导关键路径。`install-e2e` lane 别名仍是两个提供商安装器 lane 的聚合手动重跑别名。`bundled-channels` 分块运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行的一体化 `bundled-channel-deps` lane。每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、时序、`summary.json`、`failures.json`、阶段时序、调度器计划 JSON、慢 lane 表，以及逐 lane 重跑命令。workflow 的 `docker_lanes` 输入会针对准备好的镜像运行选定 lane，而不是运行分块作业，这会把失败 lane 调试限制在一个有目标的 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定 lane 是 live Docker lane，则目标作业会为该次重跑在本地构建 live-test 镜像。生成的逐 lane GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败 lane 可以复用失败运行中的确切包和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker 产物并打印合并/逐 lane 的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 获取慢 lane 和阶段关键路径摘要。定时 live/E2E workflow 每天运行完整 release-path Docker 套件。内置 update 矩阵按 update 目标拆分，因此重复的 npm update 和 Doctor 修复轮次可以与其他内置检查分片并行。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍作为聚合插件/运行时别名保留，但发布工作流会使用拆分后的分块，这样渠道冒烟测试、更新目标、插件运行时检查以及内置插件安装/卸载扫测就可以并行运行。定向 `docker_lanes` 分发也会在一次共享包/镜像准备步骤之后，将多个选中的通道拆成并行作业；内置渠道更新通道会对临时 npm 网络故障重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产代码和核心测试类型检查，以及核心 lint/guard；仅核心测试变更只运行核心测试类型检查和核心 lint；插件生产代码变更会运行插件生产代码和插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查和插件 lint。公共 Plugin SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫测属于显式测试工作。仅发布元数据的版本号变更会运行定向版本/配置/根依赖检查。未知根目录/配置变更会故障安全地落到全部检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源码回复投递模式或消息工具系统提示词的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，这样共享默认值变更会在第一次 PR 推送之前失败。仅当变更覆盖整个 harness，以至于廉价映射集合不再是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为宽泛证明使用一个新预热的盒子。在把较慢的门禁消耗到一个被复用、已过期或刚报告了异常大同步量的盒子上之前，先在盒子内运行 `pnpm testbox:sanity`。当所需根文件（例如 `pnpm-lock.yaml`）消失，或者 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远端同步状态不是 PR 的可信副本。请停止该盒子并预热一个新的盒子，而不是调试产品测试失败。对于有意进行大规模删除的 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 分发会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。Android 对独立手动 CI 通过 `include_android=true` 选择启用，并且在 `Full Release Validation` 中始终启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 分发，或由操作员显式分发。普通拉取请求、`main` 推送和独立手动 CI 分发都会关闭该套件。

最慢的 Node 测试族会被拆分或均衡，让每个作业保持较小规模且不过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元通道会成对运行，自动回复作为四个均衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片；智能体式 Gateway 网关/插件配置则分布到现有仅源码智能体式 Node 作业中，而不是等待构建产物。宽泛浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。`Plugin Prerelease` 会把内置插件测试均衡分布到八个插件 worker；这些插件分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，这样导入密集型插件批次不会产生额外 CI 作业。宽泛 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片成为尾部瓶颈。包含模式分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和过滤后的分片。`check-additional` 会把包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界 guard 分片会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证作业，同时避免两个额外的 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play 调试 APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上产生重复的调试 APK 打包作业。
当较新的推送落到同一个 PR 或 `main` 引用上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一引用的最新运行也在失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸作业就无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍足够敏感，以至于 8 vCPU 增加的成本超过了节省；install-smoke Docker 构建中，32-vCPU 排队时间成本超过了节省                                                                                                                                                                                                                                                                                                     |
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

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

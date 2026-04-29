---
read_when:
    - 你需要了解 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T20:12:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3d0d75009f612338a2a45b0d4dc2c4e90d2dfeb86b020ed19a1a218d9a780aa9
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 和每个拉取请求时运行。它使用智能范围限定，在只有无关区域发生变化时跳过昂贵任务。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布版本或广泛验证展开完整的常规 CI 图；对于独立手动运行，Android 通道通过 `include_android` 选择启用。仅用于发布的插件预发布通道位于单独的 `Plugin Prerelease` workflow 中，并且只会从 `Full Release Validation` 或显式手动分派运行。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`，这是一个仅检查生产依赖的 Knip 流程，固定为该脚本使用的最新 Knip 版本，并且在 `dlx` 安装时禁用 pnpm 的最低发布年龄限制。它还会运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未经审核的未使用文件，或清理后留下过期的 allowlist 条目时，该防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控 workflow。它接受分支、标签或完整提交 SHA，使用该目标分派手动 `CI` workflow，分派 `Plugin Prerelease` 以提供仅发布用的插件/包/静态/Docker 证明，并分派 `OpenClaw Release Checks` 以运行安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。当提供已发布的包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` workflow。`release_profile=minimum|stable|full` 控制传入发布检查的实时/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总控会记录已分派的子运行 ID，最终的 `Verify full validation` 任务会重新检查当前子运行结论，并为每个子运行追加最慢任务表。如果某个子 workflow 重新运行并变绿，只需重新运行父级验证器任务以刷新总控结果和时间摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅常规完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，或在总控上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会在完成针对性修复后，将失败发布盒子的重新运行限制在边界内。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 任务、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行任务。这样保持相同的文件覆盖，同时让缓慢的实时提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重新运行。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` workflow 构建。该镜像预装 `ffmpeg` 和 `ffprobe`；媒体任务只会在设置前验证这些二进制文件。将 Docker 支持的实时套件保留在常规 Blacksmith runner 上，因为容器任务不是启动嵌套 Docker 测试的合适位置。

Docker 支持的实时模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布 workflow 会构建并推送一次该镜像，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源 Docker 目标，则发布运行配置错误，会在重复镜像构建上浪费总耗时。

`OpenClaw Release Checks` 使用受信任的 workflow 引用将选定引用解析一次为 `release-package-under-test` tarball，然后将该产物传递给实时/E2E 发布路径 Docker workflow 和包验收分片。这样可以让发布盒子之间的包字节保持一致，并避免在多个子任务中重复打包同一个候选版本。

`Package Acceptance` 是用于验证包产物而不阻塞发布 workflow 的旁路运行 workflow。它会从已发布的 npm 规范、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 产物中解析一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，用该 tarball 代替重新打包 workflow checkout。配置档覆盖冒烟、包、产品、完整和自定义 Docker 通道选择。`package` 配置档使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` workflow 中复用 `package-under-test` 产物，同时保留已发布 npm 规范路径用于独立分派。

## 包验收

当问题是“这个可安装 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而包验收通过用户安装或更新后会执行的同一 Docker E2E harness 来验证单个 tarball。

该 workflow 有四个任务：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中打印来源、workflow 引用、包引用、版本、SHA-256 和配置档。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用 workflow 下载该产物，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行所选 Docker 通道，而不是打包 workflow checkout。当某个配置档选择多个目标 `docker_lanes` 时，可复用 workflow 会准备一次包和共享镜像，然后将这些通道展开为并行目标 Docker 任务，并使用唯一产物。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 已解析包时安装同一个 `package-under-test` 产物；独立 Telegram 分派仍可安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时让 workflow 失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对外部共享产物应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这使当前测试 harness 能够验证较旧的受信任源提交，而不运行旧的 workflow 逻辑。

配置档映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 块覆盖重叠的包/更新/插件通道，而 Package Acceptance 保持针对同一个已解析包 tarball 的产物原生内置渠道兼容性、离线插件和 Telegram 证明。
跨 OS 发布检查仍然覆盖 OS 特定的新手引导、安装程序和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装程序全新通道还会验证已安装的包可以从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS agent-turn 冒烟在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用实时提供商/模型通道仍会覆盖更广泛的模型路由，包括较慢的前沿默认值。

Package Acceptance 对已发布包设有有界的旧版兼容窗口。直到 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未公开 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过其持久化子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件冒烟可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，以确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重跑命令。优先重跑失败的包配置文件或精确的 Docker lane，而不是重跑完整发布验证。

QA Lab 在主智能作用域工作流之外有专用 CI lane。`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 的智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动分发；它会将模拟一致性门禁、实时 Matrix lane，以及实时 Telegram 和 Discord lane 扇出为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布检查使用确定性模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输 lane，因此渠道合约会与实时模型延迟和正常提供商插件启动隔离。实时传输 Gateway 网关还会禁用内存搜索，因为 QA 一致性会单独覆盖内存行为；提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 对计划任务和发布门禁使用 `--profile fast`，仅在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖分片到 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab lane；其 QA 一致性门禁会将候选包和基线包作为并行 lane 作业运行，然后将两个构件下载到一个小型报告作业中，用于最终一致性比较。除非变更实际触及 QA 运行时、模型包一致性，或一致性工作流拥有的表面，否则不要把 PR 落地路径放到 `Parity gate` 后面。对于普通渠道、配置、文档或单元测试修复，将其视为可选信号，并遵循作用域化的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。它默认使用 dry-run，并且只有在 `apply=true` 时才会关闭显式列出的 PR。在变更 GitHub 之前，它会验证已落地的 PR 已合并，并且每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的一次性安全扫描器，而不是完整仓库扫描。每日和手动运行会用高精度安全查询扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会单独扫描核心渠道实现合约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，类别为 `/codeql-critical-security/channel-runtime-boundary`，因此渠道安全信号可以在不扩大基线 JS/TS 类别的情况下扩展。network-ssrf-boundary 作业会扫描核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF 策略表面，类别为 `/codeql-critical-security/network-ssrf-boundary`，因此网络信任边界信号会与更广泛的 JS/TS 安全基线保持分离。

`CodeQL Android Critical Security` 工作流是计划运行的 Android 安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并将结果上传到 `/codeql-critical-security/android` 类别下。

`CodeQL macOS Critical Security` 工作流是每周/手动的 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并将结果上传到 `/codeql-critical-security/macos` 类别下。将它保持在每日默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只会在较小的 Blacksmith Linux runner 上，对窄范围高价值表面运行错误严重性、非安全的 JavaScript/TypeScript 质量查询。其手动分发接受 `profile=all|plugin-sdk-package-contract`；窄配置文件是用于独立运行一个质量分片的首个教学/迭代钩子，不会分发工作流的其余部分。其 core-auth-secrets 作业会扫描凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码，类别为单独的 `/codeql-critical-quality/core-auth-secrets`。config-boundary 作业会扫描配置 schema、迁移、规范化和 IO 合约，类别为单独的 `/codeql-critical-quality/config-boundary`。gateway-runtime-boundary 作业会扫描 Gateway 网关协议 schema 和服务器方法合约，类别为单独的 `/codeql-critical-quality/gateway-runtime-boundary`。channel-runtime-boundary 作业会扫描核心渠道实现合约，类别为单独的 `/codeql-critical-quality/channel-runtime-boundary`。agent-runtime-boundary 作业会扫描命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时合约，类别为单独的 `/codeql-critical-quality/agent-runtime-boundary`。mcp-process-runtime-boundary 作业会扫描 MCP 服务器和工具桥、进程监督辅助工具，以及出站投递合约，类别为单独的 `/codeql-critical-quality/mcp-process-runtime-boundary`。memory-runtime-boundary 作业会扫描 memory host SDK、memory 运行时 facade、memory 插件 SDK 别名、memory 运行时激活胶水代码，以及 memory doctor 命令，类别为单独的 `/codeql-critical-quality/memory-runtime-boundary`。ui-control-plane 作业会扫描 Control UI bootstrap、本地持久化、Gateway 网关控制流，以及任务控制平面运行时合约，类别为单独的 `/codeql-critical-quality/ui-control-plane`。web-media-runtime-boundary 作业会扫描核心 web fetch/search、媒体 IO、媒体理解、图像生成和媒体生成运行时合约，类别为单独的 `/codeql-critical-quality/web-media-runtime-boundary`。plugin-boundary 作业会扫描 loader、registry、公有表面和插件 SDK 入口点合约，类别为单独的 `/codeql-critical-quality/plugin-boundary`。plugin-sdk-package-contract 作业会扫描已发布包侧的插件 SDK 源码和插件包合约辅助工具，类别为单独的 `/codeql-critical-quality/plugin-sdk-package-contract`。保持该工作流与安全工作流分离，以便可以在不模糊安全信号的情况下，对质量发现进行计划、度量、禁用或扩展。Swift、Python 和内置插件 CodeQL 扩展应只在窄配置文件具备稳定运行时间和信号后，作为作用域化或分片化的后续工作重新添加。

`Docs Agent` 工作流是事件驱动的 Codex 维护 lane，用于让现有文档与最近落地的变更保持一致。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，手动分发也可以直接运行它。当 `main` 已继续前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 来源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护 lane，用于处理慢测试。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，但如果同一 UTC 日已有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动分发会绕过该每日活动门禁。该 lane 会构建完整套件分组 Vitest 性能报告，让 Codex 只做保持覆盖率的小型测试性能修复，而不是大范围重构，然后重跑完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败，并且 agent 后的完整套件报告必须通过，才会提交任何内容。当 `main` 在机器人 push 落地前推进时，该 lane 会 rebase 已验证的补丁，重跑 `pnpm check:changed`，并重试 push；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的插件，并构建 CI 清单                                        | 始终在非草稿推送和 PR 上运行      |
| `security-scm-fast`              | 通过 `zizmor` 检测私钥并审计工作流                                                          | 始终在非草稿推送和 PR 上运行      |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产 lockfile 审计                                          | 始终在非草稿推送和 PR 上运行      |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                     | 始终在非草稿推送和 PR 上运行      |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查以及可复用的下游产物                                  | Node 相关变更                     |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件、插件契约和协议检查                                     | Node 相关变更                     |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                | Node 相关变更                     |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和插件通道                                        | Node 相关变更                     |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke                          | Node 相关变更                     |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片                                     | Node 相关变更                     |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                    | Node 相关变更                     |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | Node 相关变更                     |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                             | 发布时手动 CI 触发                |
| `check-docs`                     | 文档格式、lint 和坏链检查                                                                    | 文档已变更                       |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                | Python Skills 相关变更            |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归测试                              | Windows 相关变更                  |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                | macOS 相关变更                    |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                         | macOS 相关变更                    |
| `android`                        | 两种 flavor 的 Android 单元测试以及一个 debug APK 构建                                      | Android 相关变更                  |
| `test-performance-agent`         | 受信任活动后每日执行 Codex 慢测试优化                                                       | main CI 成功或手动触发            |

手动 CI 触发会运行与普通 CI 相同的作业图，但会强制开启每个非 Android 范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 触发只会在 `include_android=true` 时运行 Android；完整发布总控流程会通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道均排除在 CI 之外。Docker 预发布套件仅在 `Full Release Validation` 触发单独的 `Plugin Prerelease` 工作流并启用发布验证门禁时运行。手动运行使用唯一的并发组，因此候选发布的完整套件不会被同一 ref 上的另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方在使用所选触发 ref 的工作流文件时，针对分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业经过排序，使低成本检查先于高成本检查失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 之后会展开更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分派会跳过变更作用域检测，并让预检清单表现得像每个受作用域限制的区域都发生了变化。
CI 工作流编辑会验证 Node CI 图以及工作流 linting，但本身不会强制执行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只限定于平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及范围较窄的插件契约辅助/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查，以及一个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或辅助表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的守卫矩阵。
Windows Node 检查限定于 Windows 特定的进程/路径封装器、npm/pnpm/UI runner 辅助、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、install-smoke 和仅测试变更会留在 Linux Node 通道上，这样它们就不会为普通测试分片已经覆盖的范围占用一个 16-vCPU Windows worker。
独立的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个作用域脚本。它把冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件，且每个场景的 Docker run 会单独设置上限。完整路径会把 QR 包安装和安装器 Docker/更新覆盖保留给夜间计划运行、手动分派、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。`main` 推送，包括合并提交，不会强制运行完整路径；当变更作用域逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并把完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独设闸；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分派可以选择加入，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖通道的裸 Node/Git runner，以及一个把同一个 tarball 安装到 `/app` 中供普通功能通道使用的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；可用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池槽位数 10。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，因此 npm install 和多服务通道不会让 Docker 过量承载，而较轻的通道仍会填满可用槽位。单个比有效上限更重的通道仍可以从空池启动，然后独占运行，直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除过期的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在首次失败后停止调度新的池化通道，并且每个通道都有 120 分钟兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的单通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道如 `install-e2e`，以及拆分的内置更新通道如 `bundled-channel-update-acpx`，同时跳过清理冒烟测试，以便智能体复现某个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会以有界的每次 180 秒超时重试，这样卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。`Package Acceptance` 工作流是高级包门禁：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的工作流产物中解析候选项，然后把这一个 `package-under-test` 产物传入可复用的 Docker E2E 工作流。它让 `workflow_ref` 与 `package_ref` 保持分离，因此当前验收逻辑可以验证较旧的受信任提交，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件 fixture，以及针对解析出的 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行更小的分块作业并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`，`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且只有在仅 OpenWebUI 分派时才保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，这样安装器 E2E 和内置插件安装/卸载扫查就不会主导关键路径。`install-e2e` 通道别名仍是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表以及单通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块作业，这会把失败通道调试限制在一个目标 Docker 作业内，并为该运行准备、下载或复用包产物；如果选中的通道是 live Docker 通道，目标作业会为该次重跑在本地构建 live-test 镜像。生成的单通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的确切包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker 产物并打印组合/单通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。计划的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor repair 过程可以与其他内置检查一起分片。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍是聚合插件/运行时别名，但发布工作流使用拆分分块，让渠道冒烟测试、更新目标、插件运行时检查以及内置插件安装/卸载扫查可以并行运行。目标 `docker_lanes` 分派也会在一个共享包/镜像准备步骤之后，把多个选中的通道拆成并行作业，并且内置渠道更新通道会针对临时 npm 网络失败重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁比宽泛的 CI 平台作用域更严格地处理架构边界：核心生产变更会运行核心生产和核心测试 typecheck 加核心 lint/guards，仅核心测试变更只运行核心测试 typecheck 加核心 lint，扩展生产变更会运行扩展生产和扩展测试 typecheck 加扩展 lint，仅扩展测试变更会运行扩展测试 typecheck 加扩展 lint。公开插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展扫查是显式测试工作。仅发布元数据的版本号变更会运行目标版本/配置/根依赖检查。未知的根/配置变更会故障安全地落到所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更低成本：直接测试编辑会运行自身，源代码编辑会优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或 message-tool 系统提示词的变更，会经过核心回复测试以及 Discord 和 Slack 投递回归测试，因此共享默认值变更会在首次 PR 推送前失败。只有当变更足够覆盖整个 harness，以至于低成本映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为广泛证明使用一个新预热的 box。在把慢速门禁花在一个被复用、已过期或刚刚报告了异常大同步的 box 上之前，先在该 box 内运行 `pnpm testbox:sanity`。当所需的根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该次完整性运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后的输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或者为异常大的本地 diff 使用更大的毫秒值。

手动 CI 调度会运行 `checks-node-compat-node22`，作为广泛的兼容性覆盖。Android 对独立手动 CI 通过 `include_android=true` 选择启用，并且始终为 `Full Release Validation` 启用。`Plugin Prerelease` 是开销更高的产品/包覆盖，因此它是由 `Full Release Validation` 或显式操作员调度的单独工作流。普通拉取请求、`main` 推送以及独立手动 CI 调度都会关闭该套件。

最慢的 Node 测试族已拆分或均衡，使每个作业保持较小规模且不会过度预留运行器：渠道契约作为三个加权分片运行，小型核心单元通道会成对运行，自动回复作为四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片；agentic Gateway 网关/插件配置分散到现有仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。`Plugin Prerelease` 将内置插件测试均衡分配到八个扩展 worker；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并使用更大的 Node 堆，使导入较重的插件批次不会创建额外的 CI 作业。广泛的智能体通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，避免共享运行时分片承担尾部耗时。include-pattern 分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和经过筛选的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界保护分片在一个作业内并发运行其小型独立保护项。Gateway 网关 watch、渠道测试和核心支持边界分片在 `dist/` 与 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证作业，同时避免两个额外的 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。
当较新的推送落到同一个 PR 或 `main` ref 上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。
自动 CI 并发键带有版本（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸作业无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片与聚合、Node 测试聚合验证器、文档检查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的扩展分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，8 vCPU 的成本高于节省的时间；install-smoke Docker 构建，其中 32 vCPU 的排队时间成本高于节省的时间                                                                                                                                                                                                                                                                                                     |
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

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

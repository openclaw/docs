---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T20:52:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d448fb1d5b30b32bd71b79921c0eb8a36b00932e12a31bb069304cf0d1518a8
    source_path: ci.md
    workflow: 16
---

CI 在每次推送到 `main` 以及每个 pull request 时运行。它使用智能范围界定，在只有无关区域发生变更时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围界定，并展开完整的常规 CI 图，用于发布候选版本或广泛验证；对于独立手动运行，Android 通道通过 `include_android` 选择加入。仅发布用的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只从 `Full Release Validation` 或显式手动分派运行。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`，这是一次生产 Knip 仅依赖项检查，固定到该脚本使用的最新 Knip 版本，并且为 `dlx` 安装禁用 pnpm 的最低发布时间限制。它还运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未审查未使用文件，或清理后留下过期的允许列表条目时，该守卫会失败，同时保留 Knip 无法静态解析的有意动态插件、生成产物、构建、实时测试和包桥接表面。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整 commit SHA，使用该目标分派手动 `CI` 工作流，为仅发布用的插件/包/静态/Docker 证明分派 `Plugin Prerelease`，并为安装 smoke、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道分派 `OpenClaw Release Checks`。当提供已发布包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的实时/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定提供商/后端集合，`full` 运行广泛的 advisory 提供商/媒体矩阵。该总控工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变绿，只需重新运行父验证器作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅常规完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，或者在总控中使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在针对性修复后，将失败发布 box 的重新运行范围保持有界。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商筛选的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商筛选的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，让缓慢实时提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重新运行。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预安装 `ffmpeg` 和 `ffprobe`；媒体作业只在设置前验证这些二进制文件。将 Docker 支持的实时套件保留在常规 Blacksmith runner 上，因为容器作业不是启动嵌套 Docker 测试的合适位置。

Docker 支持的实时模型/后端分片会为所选 commit 使用单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流构建并推送该镜像一次，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源 Docker 目标，则发布运行配置错误，并会在重复镜像构建上浪费挂钟时间。

`OpenClaw Release Checks` 使用受信任的工作流 ref，将所选 ref 一次性解析为 `release-package-under-test` tarball，然后将该 artifact 传递给实时/E2E 发布路径 Docker 工作流和包验收分片。这样可以让发布 box 之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是用于验证包 artifact 的旁路运行工作流，不会阻塞发布工作流。它会从已发布 npm 规格、使用所选 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball artifact 解析一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，使用该 tarball 而不是重新打包工作流 checkout。Profile 覆盖 smoke、package、product、full 和自定义 Docker 通道选择。`package` profile 使用离线插件覆盖，因此已发布包验证不会受实时 ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` artifact，并为独立分派保留已发布 npm 规格路径。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而包验收通过用户在安装或更新后使用的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` checkout `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` artifact 上传，并在 GitHub step summary 中打印来源、工作流 ref、包 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用工作流会下载该 artifact，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包而不是打包工作流 checkout 运行所选 Docker 通道。当某个 profile 选择多个定向 `docker_lanes` 时，可复用工作流会先准备包和共享镜像一次，然后将这些通道展开为并行定向 Docker 作业，并生成唯一 artifact。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 解析了一个包，它会安装同一个 `package-under-test` artifact；独立 Telegram 分派仍可安装已发布 npm 规格。
4. 如果包解析、Docker 验收或可选 Telegram 通道失败，`summary` 会使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/stable 验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整 commit SHA。解析器会获取 OpenClaw 分支/标签，验证所选 commit 可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但应为外部共享 artifact 提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是 `source=ref` 时会被打包的源 commit。这让当前测试 harness 可以验证较旧的受信任源 commit，而无需运行旧工作流逻辑。

Profile 映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 块覆盖重叠的包/更新/插件通道，而 Package Acceptance 保留针对同一个已解析包 tarball 的 artifact-native bundled-channel 兼容性、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖特定 OS 的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新通道还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control override。OpenAI 跨 OS 智能体 turn smoke 在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用实时提供商/模型通道仍覆盖更广泛的模型路由，包括更慢的 frontier 默认值。

Package Acceptance 对已发布包有有界的旧版兼容窗口。到 `2026.4.25` 为止的包（包括 `2026.4.25-beta.*`）可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未暴露该 flag 时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件 smoke 可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以针对已发布的本地构建元数据 stamp 文件发出警告。之后的包必须满足现代契约；相同条件将失败，而不是警告或跳过。

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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段计时和重新运行命令。优先重新运行失败的包配置文件或确切的 Docker lane，而不是重新运行完整发布验证。

QA Lab 在主智能范围工作流之外有专用 CI lane。`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动分发；它会将模拟一致性门、实时 Matrix lane、实时 Telegram 和 Discord lane 作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布检查会使用确定性模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输 lane，这样渠道契约就能与实时模型延迟和常规提供商插件启动隔离。实时传输 Gateway 网关还会禁用内存搜索，因为 QA 一致性会单独覆盖内存行为；提供商连接性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 会对计划任务和发布门使用 `--profile fast`，仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 还会在发布批准前运行发布关键的 QA Lab lane；它的 QA 一致性门会将候选包和基线包作为并行 lane 作业运行，然后把两个构件下载到一个小型报告作业中，用于最终一致性比较。不要把 PR 合并路径置于 `Parity gate` 之后，除非变更确实触及 QA 运行时、模型包一致性，或一致性工作流拥有的表面。对于常规渠道、配置、文档或单元测试修复，将其视为可选信号，并遵循范围化的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于合并后重复项清理的手动维护者工作流。它默认是 dry-run，且仅在 `apply=true` 时关闭明确列出的 PR。在变更 GitHub 之前，它会验证已落地的 PR 已合并，并且每个重复 PR 都有共享的引用议题或重叠的变更 hunk。

`CodeQL` 工作流有意作为范围较窄的第一轮安全扫描器，而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会在 `/codeql-critical-security/channel-runtime-boundary` 类别下单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，这样渠道安全信号就能在不扩大基线 JS/TS 类别的情况下扩展。network-ssrf-boundary 作业会在 `/codeql-critical-security/network-ssrf-boundary` 类别下扫描核心 SSRF、IP 解析、网络防护、web-fetch 和插件 SDK SSRF 策略表面，这样网络信任边界信号就能与更广泛的 JS/TS 安全基线保持分离。mcp-process-tool-boundary 作业会在 `/codeql-critical-security/mcp-process-tool-boundary` 类别下扫描 MCP 服务器、进程执行辅助工具、出站投递和智能体工具执行门，这样命令和工具边界信号就能同时与通用 JS/TS 基线及非安全 MCP/进程质量分片保持分离。

`CodeQL Android Critical Security` 工作流是计划运行的 Android 安全分片。它会在工作流完整性检查接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos` 类别下上传结果。将它保留在每日默认工作流之外，因为即使干净时，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只在较小的 Blacksmith Linux runner 上，对范围较窄的高价值表面运行错误严重级别、非安全 JavaScript/TypeScript 质量查询。它的手动分发接受 `profile=all|plugin-sdk-package-contract`；窄配置文件是用于隔离运行一个质量分片的首个教学/迭代钩子，无需分发工作流其余部分。它的 core-auth-secrets 作业会在单独的 `/codeql-critical-quality/core-auth-secrets` 类别下扫描凭证、密钥、沙箱、cron 和 Gateway 网关安全边界代码。config-boundary 作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法契约。channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。agent-runtime-boundary 作业会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商分发、自动回复分发和队列，以及 ACP 控制平面运行时契约。mcp-process-runtime-boundary 作业会在单独的 `/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP 服务器和工具桥、进程监督辅助工具，以及出站投递契约。memory-runtime-boundary 作业会在单独的 `/codeql-critical-quality/memory-runtime-boundary` 类别下扫描内存主机 SDK、内存运行时外观、内存插件 SDK 别名、内存运行时激活胶水代码和内存 Doctor 命令。ui-control-plane 作业会在单独的 `/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI 启动、本地持久化、Gateway 网关控制流和任务控制平面运行时契约。web-media-runtime-boundary 作业会在单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 web 获取/搜索、媒体 IO、媒体理解、图像生成和媒体生成运行时契约。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公共表面和插件 SDK 入口点契约。plugin-sdk-package-contract 作业会在单独的 `/codeql-critical-quality/plugin-sdk-package-contract` 类别下扫描已发布包侧的插件 SDK 源码和插件包契约辅助工具。让该工作流与安全分离，这样质量发现就能在不掩盖安全信号的情况下进行计划、度量、禁用或扩展。Swift、Python 和内置插件 CodeQL 扩展应仅在窄配置文件具备稳定运行时和信号后，作为范围化或分片式后续工作加回。

`Docs Agent` 工作流是事件驱动的 Codex 维护 lane，用于让现有文档与最近落地的变更保持一致。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，手动分发也可以直接运行它。通过 workflow-run 调用时，如果 `main` 已继续前进，或最近一小时内已创建另一个未跳过的 Docs Agent 运行，则会跳过。运行时，它会审查从上一个未跳过的 Docs Agent 来源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来积累的所有 main 变更。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护 lane，用于处理慢测试。它没有纯计划任务：`main` 上成功的非机器人 push CI 运行可以触发它，但如果该 UTC 日已经有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动分发会绕过该每日活动门。该 lane 会构建一个完整套件分组 Vitest 性能报告，让 Codex 只进行保留覆盖率的小型测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显失败项，且智能体之后的完整套件报告必须通过后才能提交任何内容。当 `main` 在机器人推送落地前前进时，该 lane 会对已验证补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与文档智能体相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的插件，并构建 CI 清单      | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 安全公告执行无依赖的生产 lockfile 审计                             | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合检查                                                | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、控制 UI、构建产物检查，以及可复用的下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，排除渠道、内置、契约和插件通道             | Node 相关变更              |
| `check`                          | 分片的主要本地门禁等价项：生产类型、lint、守卫、测试类型和严格烟雾测试   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面守卫、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI 的烟雾测试和启动内存烟雾测试                                               | Node 相关变更              |
| `checks`                         | 构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和烟雾测试通道                                                   | 发布的手动 CI 调度    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | 针对由 Python 支持的 Skills 执行 Ruff + pytest                                                       | Python Skills 相关变更      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归测试         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两个 flavor 的 Android 单元测试，以及一次 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢速测试优化                                    | 主 CI 成功或手动调度 |

手动 CI 调度运行与正常 CI 相同的作业图，但会强制启用每个
非 Android 范围通道：Linux Node 分片、内置插件分片、渠道
契约、Node 22 兼容性、`check`、`check-additional`、构建烟雾测试、文档
检查、Python Skills、Windows、macOS 和控制 UI i18n。独立的手动 CI
调度仅在 `include_android=true` 时运行 Android；完整发布
总控通过传入 `include_android=true` 启用 Android。插件预发布
静态检查、仅发布的 `agentic-plugins` 分片、完整插件
批量扫描，以及插件预发布 Docker 通道都排除在 CI 之外。Docker
预发布套件仅在 `Full Release Validation` 调度
单独的 `Plugin Prerelease` 工作流且启用发布验证门禁时运行。
手动运行使用
唯一并发组，因此候选发布完整套件不会被
同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许
可信调用方在某个分支、标签或完整提交 SHA 上运行该作业图，同时
使用所选调度 ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，让低成本检查在高成本检查运行前先失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，这样下游消费者可在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过变更范围检测，并让预检清单
表现得像每个受范围限定的区域都发生了变更。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但它们本身不会强制执行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只针对平台源码变更。
仅 CI 路由编辑、选定的低成本核心测试夹具编辑，以及窄范围的插件契约辅助/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查和一个 `checks-fast-core` 任务。该路径会在变更文件仅限于该快速任务直接覆盖的路由或辅助表面时，避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外的防护矩阵。
Windows Node 检查的范围限定于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该通道的 CI 工作流表面；无关源码、插件、安装冒烟和仅测试变更会保留在 Linux Node 通道上，因此它们不会为正常测试分片已经覆盖的内容占用 16-vCPU Windows worker。
单独的 `install-smoke` 工作流通过自己的 `preflight` job 复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/package 表面、内置插件 package/manifest 变更，以及 Docker 冒烟 job 覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete 共享工作区 CLI 冒烟，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker 配置文件，同时单独限制每个场景的 Docker 运行。完整路径会保留 QR package 安装和安装器 Docker/update 覆盖，用于夜间计划运行、手动触发、workflow-call 发布检查，以及真正触及安装器/package/Docker 表面的拉取请求。`main` 推送（包括 merge commit）不会强制运行完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟，并将完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 触发可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试会保留它们各自专注安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/update/plugin-dependency 通道的裸 Node/Git runner，以及一个会将同一个 tarball 安装到 `/app`、用于普通功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool slot 数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感的 tail-pool slot 数 10。重型通道上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，因此 npm install 和多服务通道不会让 Docker 过载，而较轻的通道仍会填满可用 slot。单个比有效上限更重的通道仍可从空池启动，然后单独运行直到释放容量。默认情况下，通道启动会错开 2 秒，以避免本地 Docker daemon create 风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道 Status，持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟回退超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的按通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（如 `install-e2e`）和拆分的内置更新通道（如 `bundled-channel-update-acpx`），同时跳过清理冒烟，以便智能体可以复现某个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的 package artifact，或从 `package_artifact_run_id` 下载 package artifact；验证 tarball 清单；当计划需要 package-installed 通道时，通过 Blacksmith 的 Docker layer cache 构建并推送按 package 摘要标记的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的 package 摘要镜像，而不是重新构建。Docker 镜像拉取会用有界的每次尝试 180 秒超时进行重试，因此卡住的 registry/cache stream 会快速重试，而不是消耗 CI 关键路径的大部分时间。`Package Acceptance` 工作流是高级 package gate：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的工作流 artifact 解析候选项，然后将这个单一的 `package-under-test` artifact 传入可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较旧的受信任 commit，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容、离线插件夹具，以及针对解析出的 tarball 的 Telegram package QA。发布路径 Docker 套件会运行更小的分块 job，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的触发保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，因此安装器 E2E 和内置插件安装/卸载扫测不会主导关键路径。`install-e2e` 通道别名仍然是两个 provider 安装器通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块 job，这会将失败通道调试限制在一个目标 Docker job 内，并为该次运行准备、下载或复用 package artifact；如果选定通道是 live Docker 通道，目标 job 会为该次重跑在本地构建 live-test 镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确 package 和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker artifact，并打印组合/每通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢通道和阶段关键路径摘要。计划的 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 Doctor repair 过程可以与其他内置检查分片并行。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍作为聚合插件/运行时别名保留，但发布工作流使用拆分分块，因此渠道冒烟、更新目标、插件运行时检查，以及内置插件安装/卸载扫测可以并行运行。目标 `docker_lanes` 触发也会在一个共享 package/镜像准备步骤后，将多个选定通道拆分为并行 job，并且内置渠道更新通道会针对短暂 npm 网络失败重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查 gate 在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试 typecheck，以及核心 lint/guard；仅核心测试变更只运行核心测试 typecheck 加核心 lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；仅扩展测试变更会运行扩展测试 typecheck 加扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展扫测是显式测试工作。仅发布元数据版本 bump 会运行目标版本/配置/根依赖检查。未知根/配置变更会安全失败到所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且
有意比 `check:changed` 更低成本：直接测试编辑会运行自身，
源码编辑优先使用显式映射，然后是同级测试和导入图
依赖项。共享 group-room delivery 配置是显式映射之一：
对 group visible-reply 配置、源码 reply delivery mode，或
message-tool 系统提示的变更会路由到核心 reply 测试以及 Discord 和
Slack delivery 回归，因此共享默认值变更会在第一次 PR
推送前失败。只有当变更足够影响整个 harness，导致低成本映射集不能作为可靠代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为广泛证明使用新预热的 box。在把缓慢 gate 花在一个被复用、已过期或刚报告过异常大同步的 box 上之前，先在该 box 内运行 `pnpm testbox:sanity`。当所需的根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。请停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。当本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后输出时，`pnpm testbox:run` 也会终止该调用。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或为异常大的本地差异使用更大的毫秒值。

手动 CI 调度会运行 `checks-node-compat-node22` 作为广泛兼容性覆盖。Android 对独立手动 CI 是可选项，通过 `include_android=true` 启用，并且始终为 `Full Release Validation` 启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是由 `Full Release Validation` 或显式操作员调度的独立工作流。普通拉取请求、`main` 推送和独立手动 CI 调度会保持关闭该套件。

最慢的 Node 测试族已被拆分或均衡，以便每个作业都保持较小规模而不过度预留运行器：渠道契约以三个加权分片运行，小型核心单元 lane 会成对运行，auto-reply 以四个均衡 worker 运行并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置会分布到现有的仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件兜底配置。`Plugin Prerelease` 会在八个 extension worker 之间均衡内置插件测试；这些 extension 分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，因此导入密集型插件批次不会创建额外的 CI 作业。广泛的 agents lane 使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片占据尾部耗时。include-pattern 分片使用 CI 分片名称记录 timing 条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免两个额外的 Blacksmith worker 和第二个 artifact-consumer 队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。third-party flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上执行重复的 debug APK 打包作业。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸状态无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的 extension 分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 带来的成本高于节省；install-smoke Docker 构建，其中 32-vCPU 队列时间带来的成本高于节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

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

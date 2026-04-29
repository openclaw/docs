---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T14:46:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c51dff5db84e2d11f98b363a55d0d21309eeb9fce00fe90a8a9013c9c80385
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 和每个 pull request 时运行。它使用智能作用域，在只有不相关区域发生变更时跳过高开销任务。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并为候选发布或广泛验证展开完整的常规 CI 图；对于独立手动运行，Android lane 通过 `include_android` 选择启用。仅发布用的插件预发布 lane 位于单独的 `Plugin Prerelease` 工作流中，只会从 `Full Release Validation` 或显式手动派发运行。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`，这是一次仅针对生产 Knip 依赖项的检查，固定使用该脚本所用的最新 Knip 版本，并在 `dlx` 安装时禁用 pnpm 的最低发布时长。它还运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 新增未经审核的未使用文件，或清理后留下过时的 allowlist 条目时，该防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成文件、构建、live-test 和 package bridge 表面。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整 commit SHA，使用该目标派发手动 `CI` 工作流，派发 `Plugin Prerelease` 以提供仅发布用的插件、package、静态和 Docker 证明，并派发 `OpenClaw Release Checks` 以执行安装 smoke、package acceptance、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lane。当提供已发布 package 规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入 release checks 的 live/provider 覆盖广度：`minimum` 保留最快的 OpenAI/core 发布关键 lane，`stable` 添加稳定的 provider/backend 集合，`full` 运行广泛的 advisory provider/media 矩阵。该总控会记录已派发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果重新运行某个子工作流后变绿，只需重新运行父级 verifier 作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对候选发布使用 `all`，仅对常规完整 CI 子项使用 `ci`，对每个发布子项使用 `release-checks`，或在总控上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这能让失败的发布箱在聚焦修复后保持有界重跑。

release live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但会通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、经过 provider 过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的 media audio/video 分片，以及经过 provider 过滤的 music 分片），而不是一个串行作业。这样保持相同的文件覆盖，同时让缓慢的 live provider 失败更易重跑和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重跑。

原生 live media 分片运行在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装 `ffmpeg` 和 `ffprobe`；media 作业只会在设置前验证二进制文件。将 Docker 支撑的 live 套件保留在普通 Blacksmith runner 上，因为 container job 不适合启动嵌套 Docker 测试。

Docker 支撑的 live model/backend 分片会为每个选定 commit 使用单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live release 工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI backend、ACP bind 和 Codex harness 分片以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源 Docker target，则说明发布运行配置错误，并会把耗时浪费在重复镜像构建上。

`OpenClaw Release Checks` 使用受信任的 workflow ref 将所选 ref 一次性解析为 `release-package-under-test` tarball，然后将该 artifact 传给 live/E2E 发布路径 Docker 工作流和 package acceptance 分片。这能让 package 字节在各个发布箱中保持一致，并避免在多个子作业中重新打包同一个候选项。

`Package Acceptance` 是用于验证 package artifact 且不阻塞发布工作流的旁路运行工作流。它会从已发布 npm 规格、使用所选 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball artifact 中解析一个候选项，将其上传为 `package-under-test`，然后使用该 tarball 复用 Docker release/E2E 调度器，而不是重新打包 workflow checkout。profile 覆盖 smoke、package、product、full 和自定义 Docker lane 选择。`package` profile 使用离线插件覆盖，因此已发布 package 验证不会受 live ClawHub 可用性约束。可选 Telegram lane 在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` artifact，同时保留已发布 npm 规格路径以供独立派发使用。

## Package acceptance

当问题是“这个可安装的 OpenClaw package 作为产品能否正常工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而 package acceptance 会通过用户安装或更新后使用的同一 Docker E2E harness 来验证单个 tarball。

该工作流包含四个作业：

1. `resolve_package` checkout `workflow_ref`，解析一个 package 候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、workflow ref、package ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用工作流会下载该 artifact，验证 tarball inventory，在需要时准备 package-digest Docker 镜像，并针对该 package 运行所选 Docker lane，而不是打包 workflow checkout。当某个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会准备 package 和共享镜像一次，然后将这些 lane 展开为并行的目标 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并在 Package Acceptance 解析出候选项时安装同一个 `package-under-test` artifact；独立 Telegram 派发仍可安装已发布 npm 规格。
4. `summary` 会在 package 解析、Docker acceptance 或可选 Telegram lane 失败时使工作流失败。

候选项来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/stable acceptance。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整 commit SHA。解析器会 fetch OpenClaw 分支/标签，验证所选 commit 可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但外部共享 artifact 应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是当 `source=ref` 时被打包的源 commit。这允许当前测试 harness 验证较旧的受信任源 commit，而无需运行旧的工作流逻辑。

profile 映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径 chunk
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

Release checks 调用 Package Acceptance 时使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai`。发布路径 Docker chunk 覆盖重叠的 package/update/plugin lane，而 Package Acceptance 会针对同一个已解析 package tarball 保留 artifact-native bundled-channel compat、offline plugin 和 Telegram 证明。Cross-OS release checks 仍覆盖特定 OS 的新手引导、安装器和平台行为；package/update 产品验证应从 Package Acceptance 开始。Windows packaged 和 installer fresh lane 还会验证已安装 package 能够从原始绝对 Windows 路径导入 browser-control override。OpenAI cross-OS agent-turn smoke 在设置了 `OPENCLAW_CROSS_OS_OPENAI_MODEL` 时默认使用它，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用 live provider/model lane 仍覆盖更广泛的模型路由，包括较慢的 frontier 默认值。

Package Acceptance 为已发布 package 设置了有界的旧版兼容窗口。直到 `2026.4.25` 的 package，包括 `2026.4.25-beta.*`，可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当 package 未暴露该 flag 时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的 fake git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的已持久化 `update.channel`；plugin smoke 可以读取旧版 install-record 位置，或接受缺失的 marketplace install-record 持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求 install record 和 no-reinstall 行为保持不变。已发布的 `2026.4.26` package 也可以对已经发布的本地构建元数据 stamp 文件发出警告。之后的 package 必须满足现代合约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或精确的 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能范围工作流之外有专用 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，也可手动分发；它会将模拟一致性门禁、实时 Matrix 通道，以及实时 Telegram 和 Discord 通道作为并行作业展开。实时作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布检查会使用确定性模拟提供商和模拟限定模型（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，因此渠道契约会与实时模型延迟和正常提供商插件启动隔离。实时传输 Gateway 网关还会禁用内存搜索，因为 QA 一致性会单独覆盖内存行为；提供商连通性由单独的实时模型、原生提供商和 Docker 提供商套件覆盖。Matrix 在计划门禁和发布门禁中使用 `--profile fast`，只有在检出的 CLI 支持时才会添加 `--fail-fast`。CLI 默认值和手动工作流输入保持为 `all`；手动 `matrix_profile=all` 分发始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道；其 QA 一致性门禁会将候选包和基线包作为并行通道作业运行，然后把两个工件下载到一个小型报告作业中，用于最终一致性比较。除非变更确实触及 QA 运行时、模型包一致性或一致性工作流拥有的表面，否则不要把 PR 落地路径放在 `Parity gate` 后面。对于普通渠道、配置、文档或单元测试修复，请将其视为可选信号，并改为遵循范围化的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是一个用于落地后重复项清理的手动维护者工作流。它默认以 dry-run 运行，并且只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并验证每个重复项要么有共享的引用问题，要么有重叠的变更代码块。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，而不是完整仓库扫描。每日和手动运行会使用高精度安全查询，扫描 Actions 工作流代码以及风险最高的 JavaScript/TypeScript 凭证、机密、沙箱、cron 和 Gateway 网关表面。channel-runtime-boundary 作业会单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、机密和审计触点，并归入 `/codeql-critical-security/channel-runtime-boundary` 类别，以便渠道安全信号可以在不扩展基线 JS/TS 类别的情况下扩展。

`CodeQL Android Critical Security` 工作流是计划运行的 Android 安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并将结果上传到 `/codeql-critical-security/android` 类别下。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并将结果上传到 `/codeql-critical-security/macos` 类别下。请将它保持在每日默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是匹配的非安全分片。它只会在较小的 Blacksmith Linux runner 上，对窄范围的高价值表面运行错误级别的非安全 JavaScript/TypeScript 质量查询。它的手动分发接受 `profile=all|plugin-sdk-package-contract`；窄配置文件是用于隔离运行一个质量分片的首个教学/迭代钩子，不会分发工作流的其余部分。它的 core-auth-secrets 作业会扫描凭证、机密、沙箱、cron 和 Gateway 网关安全边界代码，并归入单独的 `/codeql-critical-quality/core-auth-secrets` 类别。config-boundary 作业会扫描配置 schema、迁移、规范化和 IO 契约，并归入单独的 `/codeql-critical-quality/config-boundary` 类别。gateway-runtime-boundary 作业会扫描 Gateway 网关协议 schema 和服务器方法契约，并归入单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别。channel-runtime-boundary 作业会扫描核心渠道实现契约，并归入单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别。agent-runtime-boundary 作业会扫描命令执行、模型/提供商分发、自动回复分发与队列，以及 ACP 控制平面运行时契约，并归入单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别。mcp-process-runtime-boundary 作业会扫描 MCP 服务器和工具桥、进程监督辅助工具，以及出站交付契约，并归入单独的 `/codeql-critical-quality/mcp-process-runtime-boundary` 类别。memory-runtime-boundary 作业会扫描内存主机 SDK、内存运行时门面、内存插件 SDK 别名、内存运行时激活粘合代码，以及内存 Doctor 命令，并归入单独的 `/codeql-critical-quality/memory-runtime-boundary` 类别。ui-control-plane 作业会扫描 Control UI 引导、本地持久化、Gateway 网关控制流，以及任务控制平面运行时契约，并归入单独的 `/codeql-critical-quality/ui-control-plane` 类别。web-media-runtime-boundary 作业会扫描核心网页获取/搜索、媒体 IO、媒体理解、图像生成和媒体生成运行时契约，并归入单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别。plugin-boundary 作业会扫描加载器、注册表、公开表面和插件 SDK 入口点契约，并归入单独的 `/codeql-critical-quality/plugin-boundary` 类别。plugin-sdk-package-contract 作业会扫描已发布包侧的插件 SDK 源代码和插件包契约辅助工具，并归入单独的 `/codeql-critical-quality/plugin-sdk-package-contract` 类别。请将该工作流与安全工作流分开，以便质量发现可以在不遮蔽安全信号的情况下进行计划、衡量、禁用或扩展。Swift、Python 和内置插件的 CodeQL 扩展应只在这些窄配置文件具备稳定运行时间和信号之后，作为范围化或分片化的后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯计划运行：`main` 上成功的非 bot push CI 运行可以触发它，手动分发也可以直接运行它。工作流运行调用会在 `main` 已向前推进，或最近一小时内已创建另一个未跳过的 Docs Agent 运行时跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档轮次以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯计划运行：`main` 上成功的非 bot push CI 运行可以触发它，但如果当天 UTC 已经有另一个工作流运行调用运行过或正在运行，它会跳过。手动分发会绕过该每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只进行小型、保持覆盖率的测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线有失败测试，Codex 只能修复明显失败，并且 after-agent 完整套件报告必须在提交任何内容前通过。当 `main` 在 bot push 落地前推进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 用途                                                                                       | 运行时机                         |
| -------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更的插件，并构建 CI 清单                                      | 非草稿推送和 PR 始终运行        |
| `security-scm-fast`              | 通过 `zizmor` 检测私钥并审计工作流                                                        | 非草稿推送和 PR 始终运行        |
| `security-dependency-audit`      | 针对 npm advisories 执行无依赖的生产锁文件审计                                            | 非草稿推送和 PR 始终运行        |
| `security-fast`                  | 快速安全作业的必需聚合检查                                                                 | 非草稿推送和 PR 始终运行        |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                              | Node 相关变更                    |
| `checks-fast-core`               | 快速 Linux 正确性 lanes，例如内置/插件契约/协议检查                                       | Node 相关变更                    |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                               | Node 相关变更                    |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和插件 lanes                                    | Node 相关变更                    |
| `check`                          | 分片的主本地 gate 等价检查：生产类型、lint、guard、测试类型和严格 smoke                  | Node 相关变更                    |
| `check-additional`               | 架构、边界、插件表面 guard、package-boundary 和 gateway-watch 分片                         | Node 相关变更                    |
| `build-smoke`                    | 构建后的 CLI smoke 测试和启动内存 smoke                                                    | Node 相关变更                    |
| `checks`                         | 构建产物渠道测试的验证器                                                                   | Node 相关变更                    |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke lane                                                            | 发布的手动 CI dispatch           |
| `check-docs`                     | 文档格式、lint 和失效链接检查                                                              | 文档已变更                       |
| `skills-python`                  | 面向 Python 后端 Skills 的 Ruff + pytest                                                   | Python Skill 相关变更            |
| `checks-windows`                 | Windows 专用进程/路径测试，以及共享运行时导入说明符回归检查                              | Windows 相关变更                 |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试 lane                                              | macOS 相关变更                   |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                        | macOS 相关变更                   |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次调试 APK 构建                                    | Android 相关变更                 |
| `test-performance-agent`         | 在可信活动之后每日执行 Codex 慢测试优化                                                    | Main CI 成功或手动 dispatch      |

手动 CI dispatch 会运行与普通 CI 相同的作业图，但会强制启用每个
非 Android 范围的 lane：Linux Node 分片、内置插件分片、渠道
契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档
检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI
dispatch 仅在 `include_android=true` 时运行 Android；完整发布
umbrella 会通过传入 `include_android=true` 启用 Android。插件预发布
静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件
批量 sweep，以及插件预发布 Docker lanes 都不包含在 CI 中。Docker
预发布套件仅在 `Full Release Validation` dispatch 启用了
release-validation gate 的独立 `Plugin Prerelease` 工作流时运行。
手动运行使用一个
唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一次推送或 PR 运行取消。可选的 `target_ref` 输入允许
可信调用方在使用所选 dispatch ref 中的工作流文件的同时，
针对分支、tag 或完整 commit SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Fail-fast 顺序

作业按顺序排列，使低成本检查在高成本检查运行前先失败：

1. `preflight` 决定哪些 lanes 实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux lanes 重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时 lanes 会在之后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过变更范围检测，并让预检清单
表现得像每个作用域区域都已变更一样。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但不会仅凭自身强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然仅限于平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及范围较窄的插件契约辅助工具/测试路由编辑，会使用一条快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于快速任务直接覆盖的路由或辅助工具表面时，这条路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的守护矩阵。
Windows Node 检查仅限于 Windows 特定的进程/路径包装器、npm/pnpm/UI runner 辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、安装 smoke 和仅测试变更会留在 Linux Node 通道上，因此不会为普通测试分片已覆盖的内容占用 16-vCPU Windows worker。
单独的 `install-smoke` 工作流通过自己的 `preflight` job 复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/包表面、内置插件包/manifest 变更，以及 Docker smoke job 覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证一个内置插件构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，同时每个场景的 Docker run 都单独设置上限。完整路径会把 QR 包安装和 installer Docker/update 覆盖保留给夜间定时运行、手动触发、workflow-call 发布检查，以及确实触碰 installer/package/Docker 表面的 pull request。`main` 推送（包括合并提交）不会强制运行完整路径；当变更范围逻辑会在一次推送上请求完整覆盖时，工作流会保留快速 Docker smoke，并把完整安装 smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划任务和发布检查工作流中运行，手动 `install-smoke` 触发可以选择加入它，但 pull request 和 `main` 推送不会运行它。QR 和 installer Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：一个用于 installer/update/plugin-dependency 通道的裸 Node/Git runner，以及一个将同一个 tarball 安装到 `/app` 中、用于普通功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认值为 10 的主池 slot 数量，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整默认值为 10 的提供商敏感 tail 池 slot 数量。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会过度占用 Docker，而较轻的通道仍能填满可用 slot。单个比有效上限更重的通道仍可以从空池启动，然后独占运行直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon 出现创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动通道 Status，持久化通道耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有 120 分钟 fallback 超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的每通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（如 `install-e2e`）和拆分的内置更新通道（如 `bundled-channel-update-acpx`），同时跳过 cleanup smoke，以便智能体能够复现一个失败通道。可复用 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker layer cache 构建并推送带包 digest 标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包 digest 镜像，而不是重新构建。Docker 镜像拉取会用每次尝试 180 秒的有界超时重试，这样卡住的 registry/cache 流会快速重试，而不是消耗大部分 CI 关键路径。`Package Acceptance` 工作流是高层包 gate：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的工作流产物中解析候选包，然后把单个 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较旧的受信任提交，而不必检出旧工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件 fixture，以及针对解析出的 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行较小的分块 job，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取所需的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`，`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，它会合并到 `plugins-runtime-services` 中；只有 OpenWebUI-only 触发时才保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，因此 installer E2E 和内置插件 install/uninstall 扫描不会主导关键路径。`install-e2e` 通道别名仍然是两个提供商 installer 通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表格，以及每通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块 job，这会把失败通道调试限制在一个目标 Docker job 中，并为该运行准备、下载或复用包产物；如果选定通道是 live Docker 通道，目标 job 会为该重跑在本地构建 live-test 镜像。生成的每通道 GitHub 重跑命令在存在这些值时会包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker 产物并打印组合/每通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢通道和阶段关键路径摘要。定时 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 Doctor repair pass 可以与其他内置检查一起分片。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍然是聚合插件/运行时别名，但发布工作流使用拆分分块，因此渠道 smoke、更新目标、插件运行时检查，以及内置插件 install/uninstall 扫描可以并行运行。目标 `docker_lanes` 触发也会在一个共享包/镜像准备步骤之后，将多个选定通道拆分为并行 job，并且内置渠道更新通道会对瞬时 npm 网络失败重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查 gate 在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试类型检查以及核心 lint/guard，仅核心测试变更只运行核心测试类型检查以及核心 lint，插件生产变更会运行插件生产和插件测试类型检查以及插件 lint，仅插件测试变更会运行插件测试类型检查以及插件 lint。公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫描是显式测试工作。仅发布元数据的版本升级会运行目标版本/配置/根依赖检查。未知根目录/配置变更会安全失败到所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，
并且有意比 `check:changed` 更低成本：直接测试编辑会运行自身，
源代码编辑优先使用显式映射，然后是 sibling 测试和 import-graph
依赖项。共享 group-room 传递配置是显式映射之一：
对 group visible-reply 配置、源回复传递模式，或
message-tool 系统 prompt 的变更，会路由到核心回复测试以及 Discord 和
Slack 传递回归，因此共享默认值变更会在第一次 PR
推送之前失败。只有当变更覆盖整个 harness，导致低成本映射集合不再是可信代理时，
才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并且在做广泛证明时优先使用一个新的已预热 box。对于复用过、已过期，或刚刚报告了异常大同步量的 box，在把缓慢门禁耗在它上面之前，先在该 box 内运行 `pnpm testbox:sanity`。当 `pnpm-lock.yaml` 等必需根文件消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远端同步状态不是 PR 的可信副本。停止该 box，并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为那次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。`pnpm
testbox:run` 还会终止在同步阶段停留超过五分钟且没有同步后输出的本地 Blacksmith CLI 调用。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或者为异常大的本地差异使用更大的毫秒值。

手动 CI 调度会运行 `checks-node-compat-node22` 作为广泛兼容性覆盖。Android 在独立手动 CI 中通过 `include_android=true` 选择启用，并且在 `Full Release Validation` 中始终启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 调度或由明确的操作员调度。普通 pull request、`main` 推送和独立手动 CI 调度会保持该套件关闭。

最慢的 Node 测试族会被拆分或均衡，使每个 job 保持较小且不过度预留 runner：渠道契约以三个加权分片运行，小型核心单元 lane 会配对运行，auto-reply 以四个均衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic gateway/plugin 配置则分布在现有的仅源码 agentic Node job 中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享的插件兜底项。`Plugin Prerelease` 会在八个扩展 worker 之间均衡内置插件测试；这些扩展分片 job 每次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node heap，这样导入密集型插件批次不会创建额外 CI job。广泛 agents lane 使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，避免共享 runtime 分片承担尾部耗时。包含模式分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和经过过滤的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片会在一个 job 内并发运行其小型独立 guard。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量级验证 job，同时避免两个额外的 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复打包 debug APK job。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新 run 也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常分片失败，但不会在整个工作流已经被取代后继续排队。
自动 CI 并发键已版本化（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项不能无限期阻塞较新的 main run。手动完整套件 run 使用 `CI-manual-v1-*`，并且不会取消正在进行的 run。

## Runners

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全 job 和聚合项（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片和聚合项、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的扩展分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 带来的成本高于节省；install-smoke Docker 构建，其中 32-vCPU 队列时间成本高于节省                                                                                                                                                                                                                                                                                                     |
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

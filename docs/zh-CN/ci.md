---
read_when:
    - 你需要了解为什么 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-30T04:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8989a33a2607776e709f7c732a14ce22dd15e1319a59f44b92fb3eb0ad0e079
    source_path: ci.md
    workflow: 16
---

CI 在每次推送到 `main` 和每个拉取请求时运行。它使用智能作用域，在只有无关区域发生变化时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并为候选发布版或广泛验证展开完整的常规 CI 图；对于独立的手动运行，Android 通道通过 `include_android` 选择启用。仅发布使用的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只从 `Full Release Validation` 或显式手动派发运行。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`，这是一个仅检查生产 Knip 依赖的通道，固定到该脚本使用的最新 Knip 版本，并且为 `dlx` 安装禁用 pnpm 的最低发布时间限制。它还运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 进行比较。当 PR 添加新的未审查未使用文件，或在清理后留下过时的允许列表条目时，该防护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

`Full Release Validation` 是“发布前运行所有内容”的手动总括工作流。它接受分支、标签或完整提交 SHA，使用该目标派发手动 `CI` 工作流，派发 `Plugin Prerelease` 以获得仅发布使用的插件/包/静态/Docker 证明，并派发 `OpenClaw Release Checks` 以运行安装 smoke、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 奇偶校验、Matrix 和 Telegram 通道。当提供已发布包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的 live/provider 覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总括工作流会记录已派发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果子工作流被重新运行并变绿，只需重新运行父验证器作业，以刷新总括结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。候选发布版使用 `all`，仅常规完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，或在总括工作流上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会在聚焦修复后，将失败发布执行盒的重新运行限制在有界范围内。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样能保持相同的文件覆盖范围，同时让缓慢的 live 提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

原生 live 媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。请将 Docker 支持的 live 套件保留在常规 Blacksmith 运行器上，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支持的 live 模型/后端分片为每个选定提交使用单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送该镜像一次，然后 Docker live 模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源 Docker 目标，说明发布运行配置错误，并会在重复镜像构建上浪费总耗时。

`OpenClaw Release Checks` 使用受信任的工作流引用将所选引用解析一次为 `release-package-under-test` tarball，然后将该工件传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这会让包字节在各发布执行盒之间保持一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是用于验证包工件而不阻塞发布工作流的旁路运行工作流。它会从已发布 npm 规格、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 工件中解析一个候选项，将其上传为 `package-under-test`，然后使用该 tarball 复用 Docker 发布/E2E 调度器，而不是重新打包工作流检出内容。配置文件覆盖 smoke、包、产品、完整和自定义 Docker 通道选择。`package` 配置文件使用离线插件覆盖，因此已发布包验证不受 live ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，同时保留已发布 npm 规格路径用于独立派发。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否能作为产品工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而包验收通过用户在安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用工作流下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当配置文件选择多个目标 `docker_lanes` 时，可复用工作流会先准备包和共享镜像一次，然后将这些通道展开为并行的目标 Docker 作业，并使用唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果包验收已解析出包，它会安装同一个 `package-under-test` 工件；独立 Telegram 派发仍可安装已发布 npm 规格。
4. 如果包解析、Docker 验收或可选 Telegram 通道失败，`summary` 会让该工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签访问，在分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但外部共享工件应提供它。

将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 就可以验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查调用包验收时使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai`。发布路径 Docker 块覆盖重叠的包/更新/插件通道，而包验收会针对同一个已解析的包 tarball 保留工件原生的内置渠道兼容性、离线插件和 Telegram 证明。跨 OS 发布检查仍会覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。Windows 打包版和安装器全新安装通道还会验证已安装包可以从原始绝对 Windows 路径导入浏览器控制覆盖。OpenAI 跨 OS agent-turn smoke 在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用 live 提供商/模型通道仍会覆盖更广泛的模型路由，包括较慢的前沿默认项。

包验收为已发布包设置了有界的旧版兼容窗口。到 `2026.4.25` 为止的包（包括 `2026.4.25-beta.*`）可以为 `dist/postinstall-inventory.json` 中已知的私有 QA 条目使用兼容路径，这些条目指向 tarball 省略的文件；当包未暴露该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中删去缺失的 `pnpm.patchedDependencies`，并且可以记录缺失的持久化 `update.channel`；插件 smoke 可以读取旧版安装记录位置，或接受缺少 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的 package acceptance 运行时，先查看 `resolve_package` 摘要，确认软件包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 工件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重新运行命令。优先重新运行失败的软件包 profile 或精确的 Docker lanes，而不是重新运行完整的发布验证。

QA Lab 在主 smart-scoped 工作流之外有专用 CI lanes。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动触发；它会将 mock parity gate、live Matrix lane，以及 live Telegram 和 Discord lanes 作为并行 jobs 扇出。live jobs 使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。Release checks 使用确定性 mock provider 和 mock-qualified models（`mock-openai/gpt-5.5` 和 `mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live transport lanes，这样渠道契约就能与 live 模型延迟和常规 provider-plugin 启动隔离。live transport Gateway 网关还会禁用 memory search，因为 QA parity 会单独覆盖 memory 行为；provider connectivity 由单独的 live model、native provider 和 Docker provider suites 覆盖。Matrix 对 scheduled 和 release gates 使用 `--profile fast`，只有在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` dispatch 始终会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` jobs。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab lanes；它的 QA parity gate 会将 candidate 和 baseline packs 作为并行 lane jobs 运行，然后把两个工件下载到一个小型 report job 中，用于最终 parity 比较。除非变更确实触及 QA 运行时、model-pack parity 或 parity 工作流拥有的表面，否则不要把 PR landing path 放在 `Parity gate` 后面。对于普通的渠道、配置、文档或单元测试修复，把它视为可选信号，并遵循 scoped CI/check 证据。

`Duplicate PRs After Merge` 工作流是用于 post-land 重复项清理的手动维护者工作流。它默认 dry-run，并且只有在 `apply=true` 时才关闭明确列出的 PR。在修改 GitHub 之前，它会验证 landed PR 已合并，并验证每个重复项要么有共享的 referenced issue，要么有重叠的 changed hunks。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，而不是完整仓库扫描。每日、手动和非 draft pull request guard 运行会扫描 Actions workflow code，以及风险最高的 JavaScript/TypeScript auth、secrets、沙箱、cron 和 gateway 表面，并在 `/codeql-security-high/core-auth-secrets` 类别下使用过滤到 high/critical `security-severity` 的高置信度安全 queries。channel-runtime-boundary job 会在 `/codeql-security-high/channel-runtime-boundary` 类别下单独扫描 core channel implementation contracts，以及 channel plugin runtime、gateway、插件 SDK、secrets 和 audit touchpoints，使渠道安全信号能够扩展，而不扩大 baseline auth/secrets 类别。network-ssrf-boundary job 会在 `/codeql-security-high/network-ssrf-boundary` 类别下扫描 core SSRF、IP parsing、network guard、web-fetch 和插件 SDK SSRF policy surfaces，使网络信任边界信号与 auth/secrets 安全基线保持分离。mcp-process-tool-boundary job 会在 `/codeql-security-high/mcp-process-tool-boundary` 类别下扫描 MCP servers、process execution helpers、outbound delivery 和智能体 tool-execution gates，使命令和工具边界信号与 auth/secrets baseline 以及非安全 MCP/process quality shard 保持分离。plugin-trust-boundary job 会在 `/codeql-security-high/plugin-trust-boundary` 类别下扫描插件 install、loader、manifest、registry、runtime-dependency staging、source-loading、public-surface 和插件 SDK package contract trust surfaces，使插件供应链和 runtime-loading 信号与 bundled plugin implementation code 以及非安全 plugin quality shard 保持分离。pull request guard 保持轻量：它只会针对 `.github/actions`、`.github/codeql`、`.github/workflows`、`packages` 或 `src` 下的变更启动，并运行与 scheduled 工作流相同的高置信度安全矩阵。Android 和 macOS CodeQL 不纳入 PR 默认值。

`CodeQL Android Critical Security` 工作流是 scheduled Android 安全 shard。它会在 workflow sanity 接受的最小 Blacksmith Linux runner label 上为 CodeQL 手动构建 Android app，并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS 安全 shard。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS app，从上传的 SARIF 中过滤掉 dependency build results，并在 `/codeql-critical-security/macos` 类别下上传结果。将它保留在每日默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时长。

`CodeQL Critical Quality` 工作流是对应的非安全 shard。它只在较小的 Blacksmith Linux runner 上，对窄范围的高价值表面运行 error-severity、非安全 JavaScript/TypeScript quality queries。它的 pull request guard 有意小于 scheduled profile：非 draft PR 仅会针对 gateway protocol/server-method、plugin loader、插件 SDK 或 package-contract 变更运行匹配的 `gateway-runtime-boundary`、`plugin-boundary` 和 `plugin-sdk-package-contract` shards。CodeQL config 和 quality workflow 变更会运行所有三个 PR quality shards。它的手动 dispatch 接受 `profile=all|gateway-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary`；这些窄 profile 是 teaching/iteration hooks，可在隔离状态下运行一个 quality shard，而不触发工作流其余部分。它的 core-auth-secrets job 会在单独的 `/codeql-critical-quality/core-auth-secrets` 类别下扫描 auth、secrets、沙箱、cron 和 gateway security boundary code。config-boundary job 会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描 config schema、migration、normalization 和 IO contracts。gateway-runtime-boundary job 会在单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 gateway protocol schemas 和 server method contracts。channel-runtime-boundary job 会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描 core channel implementation contracts。agent-runtime-boundary job 会在单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描 command execution、model/provider dispatch、auto-reply dispatch and queues，以及 ACP control-plane runtime contracts。mcp-process-runtime-boundary job 会在单独的 `/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP servers and tool bridges、process supervision helpers 和 outbound delivery contracts。memory-runtime-boundary job 会在单独的 `/codeql-critical-quality/memory-runtime-boundary` 类别下扫描 memory host SDK、memory runtime facades、memory 插件 SDK aliases、memory runtime activation glue 和 memory doctor commands。session-diagnostics-boundary job 会在单独的 `/codeql-critical-quality/session-diagnostics-boundary` 类别下扫描 reply queue internals、会话 delivery queues、outbound 会话 binding/delivery helpers、diagnostic event/log bundle surfaces 和 会话 doctor CLI contracts。plugin-sdk-reply-runtime job 会在单独的 `/codeql-critical-quality/plugin-sdk-reply-runtime` 类别下扫描插件 SDK inbound reply dispatch、reply payload/chunking/runtime helpers、channel reply options、delivery queues 和 session/thread binding helpers。provider-runtime-boundary job 会在单独的 `/codeql-critical-quality/provider-runtime-boundary` 类别下扫描 model catalog normalization、provider auth and discovery、provider runtime registration、provider defaults/catalogs，以及 web/search/fetch/embedding provider registries。ui-control-plane job 会在单独的 `/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI bootstrap、local persistence、gateway control flows 和 task control-plane runtime contracts。web-media-runtime-boundary job 会在单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描 core web fetch/search、media IO、media understanding、image-generation 和 media-generation runtime contracts。plugin-boundary job 会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描 loader、registry、public-surface 和插件 SDK entrypoint contracts。plugin-sdk-package-contract job 会在单独的 `/codeql-critical-quality/plugin-sdk-package-contract` 类别下扫描发布包侧的插件 SDK source 和 plugin package contract helpers。保持该工作流与安全工作流分离，这样质量发现就可以被 scheduled、measured、disabled 或 expanded，而不会模糊安全信号。只有在窄 profile 具备稳定 runtime 和信号后，Swift、Python 和 bundled-plugin CodeQL 扩展才应作为 scoped 或 sharded follow-up work 加回。

`Docs Agent` 工作流是事件驱动的 Codex maintenance lane，用于让现有文档与最近落地的变更保持一致。它没有纯 schedule：`main` 上一次成功的非 bot push CI run 可以触发它，手动 dispatch 也可以直接运行它。workflow-run invocations 会在 `main` 已前移，或过去一小时内创建了另一个未跳过的 Docs Agent run 时跳过。运行时，它会 review 从上一个未跳过的 Docs Agent source SHA 到当前 `main` 的 commit range，因此一次 hourly run 可以覆盖自上次 docs pass 以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个面向慢速测试的事件驱动 Codex 维护通道。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，但如果同一个 UTC 日内已经运行过或正在运行另一个工作流运行调用，它会跳过。手动触发会绕过该每日活动门禁。该通道会生成完整套件分组 Vitest 性能报告，让 Codex 只做保留覆盖率的小型测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝降低通过基线测试数量的更改。如果基线存在失败测试，Codex 只能修复明显失败，并且智能体后的完整套件报告必须通过，之后才会提交任何内容。当机器人 push 落地前 `main` 前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与文档智能体相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 用途                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档更改、变更范围、变更插件，并构建 CI 清单      | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 安全公告进行无依赖生产 lockfile 审计                             | 始终在非草稿 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合结果                                                | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查和可复用下游产物          | Node 相关更改              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件/插件契约/协议检查                 | Node 相关更改              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关更改              |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关更改              |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、守卫、测试类型和严格 smoke   | Node 相关更改              |
| `check-additional`               | 架构、边界、插件表面守卫、包边界和 gateway-watch 分片 | Node 相关更改              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关更改              |
| `checks`                         | 已构建产物渠道测试的验证器                                                    | Node 相关更改              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布时手动 CI 触发    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已更改                       |
| `skills-python`                  | Python 支持的 Skills 的 Ruff + pytest                                                       | Python Skill 相关更改      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时 import specifier 回归测试         | Windows 相关更改           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                  | macOS 相关更改             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关更改             |
| `android`                        | 两种 flavor 的 Android 单元测试以及一个 debug APK 构建                                 | Android 相关更改           |
| `test-performance-agent`         | 受信任活动后的每日 Codex 慢速测试优化                                    | Main CI 成功或手动触发 |

手动 CI 触发会运行与常规 CI 相同的作业图，但会强制启用所有非 Android 作用域通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 触发只有在 `include_android=true` 时才运行 Android；完整发布总括流程会通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 触发单独的 `Plugin Prerelease` 工作流并启用发布验证门禁时运行。手动运行使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方使用所选触发 ref 中的工作流文件，对分支、标签或完整 commit SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，让低成本检查先于高成本检查失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业内部的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过变更范围检测，并让预检清单表现得像每个限定范围都已发生变更。
CI 工作流编辑会验证 Node CI 图以及工作流 linting，但不会单独强制触发 Windows、Android 或 macOS 原生构建；这些平台检查线仍限定于平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试夹具编辑，以及范围很窄的插件契约辅助/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务会直接执行的路由或辅助表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的防护矩阵。
Windows Node 检查限定于 Windows 专用进程/路径包装器、npm/pnpm/UI 运行器辅助、包管理器配置，以及执行该检查线的 CI 工作流表面；无关源代码、插件、安装冒烟测试和仅测试变更会留在 Linux Node 检查线中，因此不会为正常测试分片已覆盖的内容占用 16-vCPU Windows worker。
单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用同一个范围脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业会执行的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像、检查 CLI、运行智能体删除共享工作区 CLI 冒烟测试、运行容器 Gateway 网关网络 e2e、验证一个内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，同时每个场景的 Docker 运行会单独封顶。完整路径会保留 QR 包安装以及安装器 Docker/更新覆盖，用于夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关冒烟测试、安装器/更新冒烟测试，以及快速内置插件 Docker E2E 作为单独作业运行，这样安装器工作就不会排在根镜像冒烟测试后等待。`main` 推送，包括合并提交，不会强制完整路径；当变更范围逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟测试，并将完整安装冒烟测试留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 触发可选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 作为 npm tarball 打包一次，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/更新/插件依赖检查线的裸 Node/Git runner，以及一个将同一个 tarball 安装到 `/app`、用于正常功能检查线的功能镜像。Docker 检查线定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每条检查线选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行检查线；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的尾池槽位数 10。重型检查线默认上限为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务检查线不会过度占用 Docker，同时较轻的检查线仍能填满可用槽位。即使单条检查线比有效上限更重，也仍可从空池启动，然后独占运行直到释放容量。默认情况下，检查线启动会错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker、移除过期的 OpenClaw E2E 容器、发出活跃检查线状态、持久化检查线耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于调度器检查。默认情况下，它会在第一次失败后停止调度新的池化检查线，每条检查线都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 检查线使用更严格的单检查线上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器检查线，包括仅发布检查线如 `install-e2e`，以及拆分后的内置更新检查线如 `bundled-channel-update-acpx`，同时跳过清理冒烟测试，以便智能体复现某个失败检查线。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、检查线和凭据覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；在计划需要已安装包的检查线时，通过 Blacksmith 的 Docker layer cache 构建并推送以包摘要打标的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会以每次尝试 180 秒的有界超时进行重试，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。`Package Acceptance` 工作流是高层包门禁：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前工作流产物解析候选包，然后将该单个 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较旧的受信任提交，而无需检出旧的工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件夹具，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行更小的分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取它需要的镜像类型，并通过同一个加权调度器执行多条检查线（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的触发保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分后的分块，因此安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 检查线别名仍然是两个提供商安装器检查线的聚合手动重跑别名。`bundled-channels` 分块会运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 检查线，而不是串行的全合一 `bundled-channel-deps` 检查线。每个分块都会上传 `.artifacts/docker-tests/`，其中包含检查线日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢检查线表，以及逐检查线重跑命令。工作流 `docker_lanes` 输入会针对已准备的镜像运行选定检查线，而不是运行分块作业，这会将失败检查线调试限制在一个有针对性的 Docker 作业内，并为该运行准备、下载或复用包产物；如果选定检查线是 live Docker 检查线，定向作业会为该次重跑在本地构建 live-test 镜像。生成的逐检查线 GitHub 重跑命令会在存在这些值时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败检查线可以复用失败运行中的确切包和镜像。使用 `pnpm test:docker:rerun <run-id>` 下载某次 GitHub 运行的 Docker 产物，并打印组合/逐检查线的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢检查线和阶段关键路径摘要。定时 live/E2E 工作流每天运行完整发布路径 Docker 套件。内置更新矩阵按更新目标拆分，因此重复 npm update 和 Doctor 修复步骤可以与其他内置检查一起分片。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留为聚合插件/运行时别名，但发布工作流使用拆分后的分块，因此渠道冒烟测试、更新目标、插件运行时检查，以及内置插件安装/卸载扫描可以并行运行。定向 `docker_lanes` 触发也会在一个共享包/镜像准备步骤之后，将多个选定检查线拆分为并行作业，并且内置渠道更新检查线会针对临时 npm 网络故障重试一次。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁比宽泛的 CI 平台范围更严格地对待架构边界：核心生产变更会运行核心生产和核心测试类型检查，以及核心 lint/guard；核心仅测试变更只运行核心测试类型检查和核心 lint；扩展生产变更会运行扩展生产和扩展测试类型检查，以及扩展 lint；扩展仅测试变更会运行扩展测试类型检查和扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展扫测是显式测试工作。仅发布元数据的版本号变更会运行有针对性的版本/配置/根依赖检查。未知的根目录/配置变更会按故障安全方式进入所有检查 lane。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行其自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖方。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源码回复投递模式或 message-tool 系统提示词的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，这样共享默认值变更会在第一次 PR 推送前失败。只有当变更范围大到覆盖整个 harness，使轻量映射集合不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为宽泛证明使用新预热的 box。在对一个被复用、已过期或刚报告了异常大同步的 box 花时间运行慢门禁之前，先在 box 内运行 `pnpm testbox:sanity`。当必需的根目录文件（如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，为该完整性检查运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或为异常大的本地 diff 使用更大的毫秒值。

手动 CI 分发会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。Android 在独立手动 CI 中通过 `include_android=true` 选择启用，并且始终为 `Full Release Validation` 启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 分发或由显式操作员分发。普通 pull request、`main` 推送和独立手动 CI 分发会保持该套件关闭。

最慢的 Node 测试族被拆分或均衡，使每个 job 保持较小且不会过度预留 runner：渠道契约以三个加权分片运行，小型核心单元 lane 成对运行，自动回复以四个均衡 worker 运行并将回复子树拆为 agent-runner、dispatch 和 commands/state-routing 分片，agentic gateway/plugin 配置分散到现有的仅源码 agentic Node job 中，而不是等待构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件兜底配置。`Plugin Prerelease` 会在八个扩展 worker 间均衡内置插件测试；这些扩展分片 job 每次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node heap，这样导入密集的插件批次不会创建额外的 CI job。宽泛 agents lane 使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢测试文件拥有。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。Include-pattern 分片使用 CI 分片名称记录 timing 条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片在一个 job 内并发运行其小型独立 guard。Gateway watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已构建后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证 job，同时避免两个额外的 Blacksmith worker 和第二个产物消费者队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍然会使用短信/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复打包 debug APK job。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的 zombie 不会无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全 job 和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的扩展分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，其中 32-vCPU 排队时间的成本高于节省                                                                                                                                                                                                                                                                                                     |
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

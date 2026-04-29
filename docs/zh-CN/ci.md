---
read_when:
    - 你需要了解为什么某个 CI 作业运行了或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T22:06:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64ba894cef8b847b3e7a298cfeb2c2977f7c589c64998a8fb5feb17a9e359160
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 和每个拉取请求时运行。它使用智能范围限定，在只有无关区域发生变更时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布版或广泛验证展开完整的常规 CI 图；对于独立手动运行，Android 线路通过 `include_android` 选择启用。仅发布用的插件预发布线路位于单独的 `Plugin Prerelease` workflow 中，并且只会从 `Full Release Validation` 或显式手动分发运行。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`，这是一个仅检查生产 Knip 依赖项的流程，固定到该脚本使用的最新 Knip 版本，并且对 `dlx` 安装禁用 pnpm 的最小发布时间限制。它还会运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 比较。当 PR 新增了未经审查的未使用文件，或清理后仍留下过时的允许列表条目时，该保护会失败，同时保留 Knip 无法静态解析的有意动态插件、生成文件、构建、实时测试和软件包桥接表面。

`Full Release Validation` 是“发布前运行所有内容”的手动总括 workflow。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` workflow，为仅发布用的插件/软件包/静态/Docker 证明分发 `Plugin Prerelease`，并为安装冒烟、软件包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 线路分发 `OpenClaw Release Checks`。当提供已发布的软件包规范时，它还可以运行发布后的 `NPM Telegram Beta E2E` workflow。`release_profile=minimum|stable|full` 控制传递给发布检查的实时/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键线路，`stable` 添加稳定的提供商/后端集合，而 `full` 运行广泛的建议提供商/媒体矩阵。该总括 workflow 会记录已分发子运行的 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子 workflow 被重新运行并变为绿色，只重新运行父级验证器作业，以刷新总括结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。候选发布版使用 `all`，只针对常规完整 CI 子项使用 `ci`，针对每个发布子项使用 `release-checks`，或在总括 workflow 上使用更窄的发布分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这会在专注修复后，将失败发布环境的重新运行范围保持在有界范围内。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它会通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样保持相同的文件覆盖范围，同时让较慢的实时提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

原生实时媒体分片运行在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中，该镜像由 `Live Media Runner Image` workflow 构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；媒体作业只会在设置前验证这些二进制文件。将 Docker 支持的实时套件保留在常规 Blacksmith runner 上，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支持的实时模型/后端分片会为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布 workflow 构建并推送该镜像一次，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP bind 和 Codex harness 分片会使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源 Docker 目标，说明发布运行配置错误，并会在重复镜像构建上浪费墙钟时间。

`OpenClaw Release Checks` 使用受信任的 workflow ref 将选定 ref 一次性解析为 `release-package-under-test` tarball，然后将该工件传递给 live/E2E 发布路径 Docker workflow 和软件包验收分片。这能让发布环境之间的软件包字节保持一致，并避免在多个子作业中重复打包同一个候选项。

`Package Acceptance` 是用于验证软件包工件且不会阻塞发布 workflow 的旁路运行 workflow。它会从已发布的 npm 规范、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或另一个 GitHub Actions 运行中的 tarball 工件解析一个候选项，将其上传为 `package-under-test`，然后用该 tarball 复用 Docker 发布/E2E 调度器，而不是重新打包 workflow checkout。配置文件覆盖冒烟、软件包、产品、完整和自定义 Docker 线路选择。`package` 配置文件使用离线插件覆盖，因此已发布软件包验证不会受 live ClawHub 可用性限制。可选的 Telegram 线路会在 `NPM Telegram Beta E2E` workflow 中复用 `package-under-test` 工件，同时为独立分发保留已发布 npm 规范路径。

## 软件包验收

当问题是“这个可安装的 OpenClaw 软件包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而软件包验收通过用户安装或更新后会使用的同一个 Docker E2E harness 验证单个 tarball。

该 workflow 有四个作业：

1. `resolve_package` checkout `workflow_ref`，解析一个软件包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、workflow ref、软件包 ref、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用 workflow 下载该工件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该软件包运行选定的 Docker 线路，而不是打包 workflow checkout。当配置文件选择多个定向 `docker_lanes` 时，可复用 workflow 会准备软件包和共享镜像一次，然后将这些线路展开为并行的定向 Docker 作业，并使用唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并且在 Package Acceptance 解析到一个软件包时安装同一个 `package-under-test` 工件；独立 Telegram 分发仍可安装已发布的 npm 规范。
4. `summary` 会在软件包解析、Docker 验收或可选 Telegram 线路失败时让 workflow 失败。

候选项来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会拉取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离 worktree 中安装依赖项，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享的工件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这允许当前测试 harness 验证较旧的受信任源提交，而不运行旧的 workflow 逻辑。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 块覆盖重叠的软件包/更新/插件线路，而 Package Acceptance 保留针对同一个已解析软件包 tarball 的工件原生 bundled-channel 兼容性、离线插件和 Telegram 证明。
跨 OS 发布检查仍会覆盖 OS 特定的新手引导、安装器和平台行为；软件包/更新产品验证应从 Package Acceptance 开始。Windows 打包版和安装器全新安装线路还会验证已安装的软件包能否从原始绝对 Windows 路径导入 browser-control override。OpenAI 跨 OS agent-turn 冒烟测试在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用实时提供商/模型线路仍会覆盖更广泛的模型路由，包括较慢的前沿默认项。

Package Acceptance 对已发布的软件包有有界的旧版兼容窗口。直到 `2026.4.25` 的软件包，包括 `2026.4.25-beta.*`，可对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当软件包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可跳过持久化子用例；`update-channel-switch` 可从 tarball 派生的假 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，并可记录缺失的持久化 `update.channel`；插件冒烟测试可读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可允许配置元数据迁移，同时仍要求安装记录和无重新安装行为保持不变。已发布的 `2026.4.26` 软件包也可针对已发布的本地构建元数据戳文件发出警告。后续软件包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的 package acceptance 运行时，先从 `resolve_package`
摘要开始，确认包来源、版本和 SHA-256。然后检查
`docker_acceptance` 子运行及其 Docker 工件：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段
耗时和重新运行命令。优先重新运行失败的包 profile 或
精确的 Docker lane，而不是重新运行完整发布验证。

QA Lab 在主智能作用域工作流之外有专用的 CI lane。
`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6
agentic 包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动触发；它会将模拟 parity gate、实时 Matrix lane，以及实时
Telegram 和 Discord lane 拆分为并行作业。实时作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布检查会使用确定性的模拟
提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输 lane，使渠道契约与实时模型
延迟和常规提供商插件启动隔离。实时传输 Gateway 网关还会
禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；
提供商连接性由单独的实时模型、原生提供商
和 Docker 提供商套件覆盖。Matrix 在定时和发布 gate 中使用 `--profile fast`，
仅当签出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值
和手动工作流输入仍为 `all`；手动 `matrix_profile=all`
触发始终会将完整 Matrix 覆盖拆分为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会
在发布批准前运行发布关键的 QA Lab lane；其 QA parity
gate 会将候选包和基线包作为并行 lane 作业运行，然后下载
两个工件到一个小型报告作业中，用于最终 parity 比较。
除非变更确实触及 QA 运行时、模型包 parity，或 parity 工作流负责的表面，
不要把 PR 合并路径置于 `Parity gate` 之后。
对于常规渠道、配置、文档或单元测试修复，把它视为可选
信号，并遵循作用域化的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是供维护者在合并后清理重复项的
手动工作流。它默认 dry-run，并且只有在 `apply=true` 时才会关闭明确
列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，
并且每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为范围较窄的首轮安全扫描器，
而不是完整仓库扫描。每日和手动运行会使用高精度安全查询，
扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 认证、secrets、沙箱、cron 和
Gateway 网关表面，类别为
`/codeql-critical-security/core-auth-secrets`。
channel-runtime-boundary 作业会单独扫描核心渠道实现
契约，以及渠道插件运行时、Gateway 网关、插件 SDK、secrets 和
审计触点，类别为 `/codeql-critical-security/channel-runtime-boundary`，
这样渠道安全信号可以扩展，而不会扩大基线
认证/secrets 类别。network-ssrf-boundary 作业会扫描核心 SSRF、IP 解析、
网络守卫、web-fetch 和插件 SDK SSRF 策略表面，类别为
`/codeql-critical-security/network-ssrf-boundary`，这样网络信任
边界信号会与认证/secrets 安全基线分离。
mcp-process-tool-boundary 作业会扫描 MCP 服务器、进程执行辅助工具、
出站投递，以及智能体工具执行 gate，类别为
`/codeql-critical-security/mcp-process-tool-boundary`，这样命令和
工具边界信号会同时与认证/secrets 基线以及
非安全 MCP/process 质量分片分离。plugin-trust-boundary 作业会扫描
插件安装、加载器、manifest、注册表、运行时依赖暂存、
源码加载、公共表面，以及插件 SDK 包契约信任表面，
类别为 `/codeql-critical-security/plugin-trust-boundary`，这样插件
供应链和运行时加载信号会同时与内置插件
实现代码以及非安全插件质量分片分离。

`CodeQL Android Critical Security` 工作流是定时运行的 Android
安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上
为 CodeQL 手动构建 Android 应用，并在
`/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动的 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤掉依赖构建结果，并在
`/codeql-critical-security/macos` 类别下上传结果。将它保持在每日
默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它
只在较小的 Blacksmith Linux runner 上，针对狭窄的高价值表面
运行错误严重级别、非安全的 JavaScript/TypeScript 质量查询。其
手动触发接受 `profile=all|plugin-sdk-package-contract`；窄
profile 是第一个教学/迭代钩子，用于单独运行一个质量分片，
而无需触发工作流其余部分。
其
core-auth-secrets 作业会在单独的 `/codeql-critical-quality/core-auth-secrets`
类别下扫描认证、secrets、沙箱、cron 和 Gateway 网关安全
边界代码。config-boundary
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、
迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法
契约。channel-runtime-boundary 作业会在
单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。agent-runtime-boundary 作业会在
单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别下扫描命令执行、模型/提供商调度、
自动回复调度和队列，以及 ACP 控制平面运行时契约。
mcp-process-runtime-boundary 作业会在单独的
`/codeql-critical-quality/mcp-process-runtime-boundary` 类别下扫描 MCP 服务器和工具桥接、进程
监督辅助工具，以及出站投递契约。memory-runtime-boundary
作业会在单独的 `/codeql-critical-quality/memory-runtime-boundary`
类别下扫描记忆宿主 SDK、记忆运行时 facade、
记忆插件 SDK 别名、记忆运行时激活胶水代码，以及记忆 Doctor
命令。ui-control-plane 作业会在单独的
`/codeql-critical-quality/ui-control-plane` 类别下扫描 Control UI 引导、本地持久化、Gateway 网关
控制流，以及任务控制平面运行时契约。
web-media-runtime-boundary 作业会在单独的
`/codeql-critical-quality/web-media-runtime-boundary` 类别下扫描核心 web fetch/search、媒体 IO、媒体
理解、图像生成和媒体生成运行时契约。
plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary`
类别下扫描加载器、注册表、公共表面和插件 SDK
入口点契约。plugin-sdk-package-contract 作业会在单独的
`/codeql-critical-quality/plugin-sdk-package-contract` 类别下扫描已发布包侧的
插件 SDK 源码和插件包契约辅助工具。将该
工作流与安全分离，这样质量发现就可以在不遮蔽安全信号的情况下
被定时、度量、禁用或扩展。
Swift、Python 和内置插件 CodeQL 扩展应仅在窄 profile 具有稳定的
运行时和信号后，作为作用域化或分片的后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护 lane，用于让
现有文档与最近落地的变更保持一致。它没有纯定时计划：一次
成功的非 bot `main` push CI 运行可以触发它，手动触发也可以
直接运行它。当 `main` 已继续推进，或过去一小时内已创建
另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会
审查从上一个未跳过的 Docs Agent 源 SHA 到
当前 `main` 的提交范围，因此一次每小时运行可以覆盖自
上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护 lane，
用于慢测试。它没有纯定时计划：一次成功的非 bot `main` push CI
运行可以触发它，但如果同一个 UTC 日已有另一个 workflow-run 调用
运行过或正在运行，它会跳过。手动触发会绕过该每日活动
gate。该 lane 会构建完整套件分组 Vitest 性能报告，让 Codex
只做小型、保持覆盖率的测试性能修复，而不是大范围
重构，然后重新运行完整套件报告，并拒绝会减少
通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复
明显失败项，并且 agent 后的完整套件报告必须通过，才会
提交任何内容。当 `main` 在 bot push 落地前推进时，该 lane
会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；
有冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex
action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI 清单                                           | 始终在非草稿推送和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 始终在非草稿推送和 PR 上运行 |
| `security-dependency-audit`      | 无依赖的生产 lockfile 审计，对照 npm 公告检查                                                | 始终在非草稿推送和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合项                                                                     | 始终在非草稿推送和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                                | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件、插件契约和协议检查                                     | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置插件、契约和插件通道                                    | Node 相关变更              |
| `check`                          | 等价于主本地门禁的分片检查：生产类型、lint、守卫、测试类型和严格 smoke                      | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面守卫、包边界和 gateway-watch 分片                                        | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                     | Node 相关变更              |
| `checks`                         | 构建产物渠道测试的验证器                                                                     | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                              | 发布的手动 CI 调度    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                    | 文档已变更                       |
| `skills-python`                  | Python 支撑的 Skills 的 Ruff + pytest                                                        | Python Skill 相关变更      |
| `checks-windows`                 | Windows 专用进程/路径测试，以及共享运行时导入说明符回归测试                                 | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                 | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                    | Android 相关变更           |
| `test-performance-agent`         | 在可信活动后每日执行 Codex 慢测试优化                                                       | main CI 成功或手动调度 |

手动 CI 调度运行与正常 CI 相同的作业图，但会强制开启每个非 Android 范围通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总控通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道均不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 调度单独的 `Plugin Prerelease` 工作流并启用发布验证门禁时运行。手动运行使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一项推送或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方针对某个分支、标签或完整提交 SHA 运行该作业图，同时使用所选调度 ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，使低成本检查先于高成本检查失败：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，以便下游消费者在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动派发会跳过变更作用域检测，并让预检清单表现得像每个作用域区域都已变更。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台 lane 仍然只针对平台源码变更限定作用域。
仅 CI 路由的编辑、选定的廉价核心测试 fixture 编辑，以及狭窄的插件契约 helper/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于快速任务会直接覆盖的路由或 helper 表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心 shard、内置插件 shard 和额外 guard 矩阵。
Windows Node 检查限定在 Windows 专用的进程/路径 wrapper、npm/pnpm/UI runner helper、包管理器配置，以及执行该 lane 的 CI 工作流表面；无关源码、插件、install-smoke 和仅测试变更会留在 Linux Node lane 上，因此不会为常规测试 shard 已覆盖的内容占用一个 16-vCPU Windows worker。
独立的 `install-smoke` 工作流会通过自己的 `preflight` job 复用同一个作用域脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/包表面、内置插件包/manifest 变更，以及 Docker smoke job 会覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证内置 extension build arg，并在 240 秒聚合命令超时下运行有界的内置插件 Docker profile，同时每个场景的 Docker run 都单独设置上限。完整路径会将 QR 包安装和 installer Docker/update 覆盖保留给夜间计划运行、手动派发、workflow-call 发布检查，以及确实触及 installer/package/Docker 表面的 pull request。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile smoke 镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关 smoke、installer/update smoke，以及快速内置插件 Docker E2E 作为独立 job 运行，使 installer 工作不必排在根镜像 smoke 后面等待。`main` push，包括 merge commit，不会强制完整路径；当变更作用域逻辑会在 push 上请求完整覆盖时，工作流会保留快速 Docker smoke，并把完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独 gating；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 派发可以选择加入它，但 pull request 和 `main` push 不会运行它。QR 和 installer Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于 installer/update/plugin-dependency lane 的裸 Node/Git runner，以及一个会将同一个 tarball 安装到 `/app` 的功能镜像，用于常规功能 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定的 plan。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane；可用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认主池 slot 数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感尾池 slot 数 10。重型 lane 上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务 lane 不会让 Docker 过载，而更轻的 lane 仍能填满可用 slot。单个 lane 即使重于有效上限，也仍可从空池启动，然后独占运行直到释放容量。默认情况下，lane 启动会错开 2 秒，以避免本地 Docker daemon 的 create 风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活动 lane 状态，持久化 lane timing 以便最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于调度器检查。默认情况下，它会在首次失败后停止调度新的 pooled lane，并且每个 lane 都有 120 分钟的 fallback 超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail lane 使用更严格的按 lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器 lane，包括仅发布 lane，例如 `install-e2e`，以及拆分的内置 update lane，例如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便 agent 能复现某个失败 lane。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、lane 和凭据覆盖，然后 `scripts/docker-e2e.mjs` 会将该 plan 转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包 artifact，或从 `package_artifact_run_id` 下载包 artifact；验证 tarball 清单；当 plan 需要包安装 lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package digest 标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有的 package digest 镜像，而不是重新构建。Docker 镜像 pull 会以有界的每次 180 秒超时重试，这样卡住的 registry/cache stream 会快速重试，而不是消耗 CI 关键路径的大部分时间。`Package Acceptance` 工作流是高层包 gate：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的工作流 artifact 解析候选包，然后将那个单一的 `package-under-test` artifact 传入可复用 Docker E2E 工作流。它将 `workflow_ref` 和 `package_ref` 分开，因此当前 acceptance 逻辑可以验证较旧的受信任 commit，而不必 checkout 旧工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance delta：内置渠道兼容性、离线插件 fixture，以及针对解析后 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行更小的分块 job，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个 chunk 只 pull 它需要的镜像类型，并通过同一个加权调度器执行多个 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`，`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-services`，并且仅在 OpenWebUI 专用派发时保留独立的 `openwebui` chunk。旧版聚合 chunk 名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分 chunk，因此 installer E2E 和内置插件安装/卸载 sweep 不会主导关键路径。`install-e2e` lane alias 仍然是两个 provider installer lane 的聚合手动重跑 alias。`bundled-channels` chunk 会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行的全合一 `bundled-channel-deps` lane。每个 chunk 都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、timing、`summary.json`、`failures.json`、phase timing、调度器 plan JSON、慢 lane 表和按 lane 重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定 lane，而不是运行 chunk job，这会将失败 lane 调试限定为一个目标 Docker job，并为该运行准备、下载或复用包 artifact；如果选定 lane 是 live Docker lane，则目标 job 会为该次重跑在本地构建 live-test 镜像。生成的按 lane GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败 lane 可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub run 下载 Docker artifact，并打印组合/按 lane 的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢 lane 和 phase 关键路径摘要。计划 live/E2E 工作流会每天运行完整 release-path Docker 套件。内置 update 矩阵按 update target 拆分，因此重复的 npm update 和 doctor repair pass 可以和其他内置检查一起分片运行。

当前发布 Docker chunk 为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` chunk 仍可用于手动一次性重跑，并且 `plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合 plugin/runtime alias，但发布工作流使用拆分 chunk，因此渠道 smoke、update target、插件运行时检查和内置插件安装/卸载 sweep 可以并行运行。目标 `docker_lanes` 派发也会在一个共享包/镜像准备步骤之后，将多个选定 lane 拆分为并行 job，并且内置渠道 update lane 会针对临时 npm 网络失败重试一次。

本地变更 lane 逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。该本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试类型检查以及核心 lint/guard，核心仅测试变更只运行核心测试类型检查以及核心 lint，扩展生产变更会运行扩展生产和扩展测试类型检查以及扩展 lint，扩展仅测试变更会运行扩展测试类型检查以及扩展 lint。公共插件 SDK 或插件契约变更会扩展到扩展类型检查，因为扩展依赖这些核心契约，但 Vitest 扩展扫查属于显式测试工作。仅发布元数据的版本号变更会运行有针对性的版本/配置/根依赖检查。未知根目录/配置变更会以失败安全方式进入所有检查 lane。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更低成本：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试和导入图依赖项。共享群组房间投递配置是显式映射之一：对群组可见回复配置、源码回复投递模式或消息工具系统提示词的更改，会通过核心回复测试以及 Discord 和 Slack 投递回归测试，这样共享默认值变更会在第一次 PR 推送前失败。只有当变更覆盖整个 harness，以至于低成本映射集不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为宽泛证明使用新的已预热 box。在把慢速门禁耗费到一个被复用、已过期或刚报告异常大同步量的 box 之前，先在该 box 内运行 `pnpm testbox:sanity`。当所需根目录文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意进行大量删除的 PR，请为该完整性运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用在同步阶段停留超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止该调用。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该 guard，或者为异常大的本地 diff 使用更大的毫秒值。

手动 CI 分发会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。Android 对独立手动 CI 通过 `include_android=true` 选择启用，并且对 `Full Release Validation` 始终启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 或显式操作员分发触发。普通 pull request、`main` 推送和独立手动 CI 分发都会关闭该套件。

最慢的 Node 测试族会被拆分或均衡，使每个作业保持较小规模且不过度预留 runner：渠道契约以三个加权分片运行，小型核心单元 lane 会配对运行，自动回复以四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，智能体化 Gateway 网关/插件配置会分散到现有仅源码 agentic Node 作业中，而不是等待构建产物。宽泛浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。`Plugin Prerelease` 会在八个扩展 worker 之间均衡内置插件测试；这些扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，这样导入密集型插件批次不会创建额外 CI 作业。宽泛 agents lane 使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢速测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片承担尾部耗时。包含模式分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 会把包边界编译/canary 工作放在一起，并将运行时拓扑架构与 gateway watch 覆盖分离；boundary guard 分片会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心 support-boundary 分片会在 `dist/` 与 `dist-runtime/` 已构建后于 `build-artifacts` 内并发运行，在避免两个额外 Blacksmith worker 和第二个产物消费者队列的同时，保留它们旧有的检查名称作为轻量验证作业。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复执行 debug APK 打包作业。
当同一个 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常分片失败，但不会在整个工作流已被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的扩展分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，其中 32-vCPU 排队时间的成本高于节省                                                                                                                                                                                                                                                                                                     |
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

## 相关

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

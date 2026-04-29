---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T22:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc6c7704fd482b67430a334cea9d36e0e802609a871e769a6771be8721914acc
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个 pull request 上运行。它使用智能范围限定，在只有无关区域发生变更时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为候选发布版或广泛验证扇出完整的常规 CI 图；对于独立手动运行，Android 通道通过 `include_android` 选择启用。仅发布使用的插件 prerelease 通道位于单独的 `Plugin Prerelease` workflow 中，并且只会从 `Full Release Validation` 或显式手动 dispatch 运行。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`，这是一个生产 Knip 依赖项专用检查，固定使用该脚本所用的最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最低发布时间限制。它还会运行 `pnpm deadcode:unused-files`，该命令会将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 对比。这个守卫会在 PR 添加新的未经审查的未使用文件，或清理后留下过期 allowlist 条目时失败，同时保留 Knip 无法静态解析的有意动态插件、生成文件、构建、live-test 和 package bridge 表面。

`Full Release Validation` 是“发布前运行所有内容”的手动总括 workflow。它接受分支、标签或完整 commit SHA，使用该目标 dispatch 手动 `CI` workflow，dispatch `Plugin Prerelease` 以进行仅发布使用的插件/package/static/Docker 证明，并 dispatch `OpenClaw Release Checks` 以进行安装 smoke、package acceptance、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。当提供已发布 package spec 时，它还可以运行发布后的 `NPM Telegram Beta E2E` workflow。`release_profile=minimum|stable|full` 控制传递给 release checks 的 live/provider 覆盖广度：`minimum` 保留最快的 OpenAI/core 发布关键通道，`stable` 添加稳定的 provider/backend 集合，`full` 运行广泛的 advisory provider/media 矩阵。总括 workflow 会记录已 dispatch 的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果子 workflow 重新运行并变绿，只需重新运行父 verifier 作业，以刷新总括结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。候选发布版使用 `all`，仅常规完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，或在总括 workflow 上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样能在集中修复后，将失败发布 box 的重新运行控制在有限范围内。

release live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以具名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按 provider 过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的 media audio/video 分片，以及按 provider 过滤的 music 分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，也让较慢的 live provider 失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

原生 live media 分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` workflow 构建。该镜像预安装了 `ffmpeg` 和 `ffprobe`；media 作业只会在设置前验证这些二进制文件。将 Docker 支持的 live 套件保留在普通 Blacksmith runner 上，因为 container 作业不是启动嵌套 Docker 测试的正确位置。

Docker 支持的 live model/backend 分片会为每个选定 commit 使用单独共享的 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live release workflow 会构建并推送该镜像一次，然后 Docker live model、gateway、CLI backend、ACP bind 和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整 source Docker target，则说明发布运行配置错误，并会把 wall clock 浪费在重复镜像构建上。

`OpenClaw Release Checks` 使用受信任的 workflow ref 将选定 ref 一次性解析为 `release-package-under-test` tarball，然后将该 artifact 传递给 live/E2E 发布路径 Docker workflow 和 package acceptance 分片。这样可以让 package 字节在各个发布 box 之间保持一致，并避免在多个子作业中重新打包同一个候选版本。

`Package Acceptance` 是用于验证 package artifact 的旁路运行 workflow，不会阻塞 release workflow。它会从已发布 npm spec、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball artifact 中解析一个候选项，将其上传为 `package-under-test`，然后复用 Docker release/E2E scheduler，并使用该 tarball，而不是重新打包 workflow checkout。profile 覆盖 smoke、package、product、full 和自定义 Docker 通道选择。`package` profile 使用离线插件覆盖，因此已发布 package 验证不受 live ClawHub 可用性限制。可选 Telegram 通道会在 `NPM Telegram Beta E2E` workflow 中复用 `package-under-test` artifact，并保留已发布 npm spec 路径以用于独立 dispatch。

## Package acceptance

当问题是“这个可安装的 OpenClaw package 是否能作为产品工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证 source tree，而 package acceptance 会通过用户安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

该 workflow 有四个作业：

1. `resolve_package` checkout `workflow_ref`，解析一个 package 候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub step summary 中打印 source、workflow ref、package ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用 workflow 会下载该 artifact，验证 tarball inventory，在需要时准备 package-digest Docker 镜像，并针对该 package 运行选定的 Docker 通道，而不是打包 workflow checkout。当某个 profile 选择多个目标 `docker_lanes` 时，可复用 workflow 会准备一次 package 和共享镜像，然后将这些通道扇出为并行的目标 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；当 Package Acceptance 解析出 package 时，它会安装同一个 `package-under-test` artifact；独立 Telegram dispatch 仍可安装已发布 npm spec。
4. `summary` 会在 package 解析、Docker acceptance 或可选 Telegram 通道失败时使 workflow 失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw release 版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/stable acceptance。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整 commit SHA。resolver 会获取 OpenClaw 分支/标签，验证所选 commit 可从仓库分支历史或 release tag 到达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享 artifact 应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任 workflow/harness 代码。`package_ref` 是 `source=ref` 时被打包的 source commit。这样当前 test harness 可以验证较旧的受信任 source commit，而无需运行旧的 workflow 逻辑。

profile 映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径 chunk
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

Release checks 调用 Package Acceptance，并使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai`。发布路径 Docker chunk 覆盖重叠的 package/update/plugin 通道，而 Package Acceptance 保留基于 artifact 原生的 bundled-channel compat、离线插件和针对同一个已解析 package tarball 的 Telegram 证明。
跨 OS release checks 仍会覆盖特定 OS 的新手引导、installer 和平台行为；package/update 产品验证应从 Package Acceptance 开始。Windows packaged 和 installer fresh 通道还会验证已安装 package 能够从原始绝对 Windows 路径导入 browser-control override。OpenAI 跨 OS agent-turn smoke 在设置时默认使用 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用 live provider/model 通道仍覆盖更广泛的模型路由，包括较慢的 frontier 默认项。

Package Acceptance 对已经发布的 package 具有有界 legacy compatibility 窗口。直到 `2026.4.25` 的 package，包括 `2026.4.25-beta.*`，可以对 `dist/postinstall-inventory.json` 中指向 tarball 已省略文件的已知私有 QA 条目使用 compatibility 路径；当 package 未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过 persistence 子用例；`update-channel-switch` 可以从 tarball 派生的伪 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件 smoke 可以读取 legacy install-record 位置，或接受缺失的 marketplace install-record persistence；`plugin-update` 可以允许 config metadata 迁移，同时仍要求 install record 和 no-reinstall 行为保持不变。已发布的 `2026.4.26` package 也可以对已经发布的本地 build metadata stamp 文件发出警告。之后的 package 必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的 package acceptance 运行时，先查看 `resolve_package`
摘要，以确认包来源、版本和 SHA-256。然后检查
`docker_acceptance` 子运行及其 Docker 工件：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段
计时和重跑命令。优先重跑失败的包 profile 或
精确的 Docker lane，而不是重跑完整发布验证。

QA Lab 在主智能作用域工作流之外有专用 CI lane。
`Parity gate` 工作流会在匹配的 PR 变更和手动 dispatch 时运行；它会
构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6
agentic 包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，并可
手动 dispatch；它会将 mock parity gate、live Matrix lane，以及 live
Telegram 和 Discord lane 作为并行作业展开。live 作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。Release
检查会使用确定性的 mock 提供商和 mock 限定模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live 传输 lane，因此
渠道契约会与 live 模型延迟和常规提供商插件启动隔离。live 传输 Gateway 网关还会
禁用记忆搜索，因为 QA parity 会单独覆盖记忆行为；
提供商连通性由独立的 live 模型、原生提供商和 Docker 提供商套件覆盖。Matrix 会在定时和发布 gate 中使用 `--profile fast`，
仅在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值
和手动工作流输入仍为 `all`；手动 `matrix_profile=all`
dispatch 始终会把完整 Matrix 覆盖分片为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 还会
在发布批准前运行发布关键的 QA Lab lane；其 QA parity
gate 会将 candidate 和 baseline 包作为并行 lane 作业运行，然后下载
两个工件到一个小型报告作业中，用于最终 parity 比较。
不要把 PR 落地路径放在 `Parity gate` 后面，除非变更确实
触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面。
对于常规渠道、配置、文档或单元测试修复，将其视为可选
信号，并遵循作用域化 CI/check 证据。

`Duplicate PRs After Merge` 工作流是一个用于
落地后重复项清理的手动维护者工作流。它默认 dry-run，且仅在
`apply=true` 时关闭明确列出的 PR。在修改 GitHub 之前，它会验证
已落地 PR 已合并，并且每个重复项要么有共享的引用 issue，
要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，
而不是完整仓库扫描。每日和手动运行会扫描 Actions 工作流代码，
以及最高风险的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和
Gateway 网关表面，并在
`/codeql-critical-security/core-auth-secrets` 类别下使用高精度安全查询。
channel-runtime-boundary 作业会单独扫描核心渠道实现
契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和
审计触点，类别为 `/codeql-critical-security/channel-runtime-boundary`，
这样渠道安全信号就能扩展，而不必扩大基线
凭证/密钥类别。network-ssrf-boundary 作业会扫描核心 SSRF、IP 解析、
网络 guard、web-fetch 和插件 SDK SSRF 策略表面，类别为
`/codeql-critical-security/network-ssrf-boundary`，这样网络信任
边界信号会与凭证/密钥安全基线分离。
mcp-process-tool-boundary 作业会扫描 MCP 服务器、进程执行帮助器、
出站投递，以及智能体工具执行 gate，类别为
`/codeql-critical-security/mcp-process-tool-boundary`，这样命令和
工具边界信号会与凭证/密钥基线以及
非安全 MCP/process 质量分片分离。plugin-trust-boundary 作业会扫描
插件安装、加载器、manifest、registry、运行时依赖暂存、
source-loading、public-surface，以及插件 SDK 包契约信任表面，
类别为 `/codeql-critical-security/plugin-trust-boundary`，这样插件
供应链和运行时加载信号会与内置插件
实现代码以及非安全插件质量分片分离。

`CodeQL Android Critical Security` 工作流是定时 Android
安全分片。它会在 workflow sanity 接受的最小
Blacksmith Linux runner label 上为 CodeQL 手动构建 Android 应用，并在
`/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤掉依赖构建结果，并在
`/codeql-critical-security/macos` 类别下上传结果。将它保留在每日
默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是匹配的非安全分片。它
只会在较小的 Blacksmith Linux runner 上，对窄范围高价值表面运行
错误严重级别、非安全 JavaScript/TypeScript 质量查询。它的
手动 dispatch 接受
`profile=all|plugin-sdk-package-contract|session-diagnostics-boundary`；
这些窄 profile 是教学/迭代钩子，可用于单独运行一个质量分片，
而不 dispatch 工作流的其余部分。
它的
core-auth-secrets 作业会扫描凭证、密钥、沙箱、cron 和 Gateway 网关安全
边界代码，类别为独立的 `/codeql-critical-quality/core-auth-secrets`。
config-boundary
作业会扫描配置 schema、迁移、规范化和 IO 契约，类别为
独立的 `/codeql-critical-quality/config-boundary`。gateway-runtime-boundary 作业会扫描 Gateway 网关协议 schema 和服务器方法
契约，类别为独立的
`/codeql-critical-quality/gateway-runtime-boundary`。channel-runtime-boundary 作业会扫描核心渠道实现契约，类别为
独立的 `/codeql-critical-quality/channel-runtime-boundary`。agent-runtime-boundary 作业会扫描命令执行、模型/提供商调度、
自动回复调度和队列，以及 ACP 控制平面运行时契约，类别为
独立的 `/codeql-critical-quality/agent-runtime-boundary`。mcp-process-runtime-boundary 作业会扫描 MCP 服务器和工具桥接、进程
监督帮助器以及出站投递契约，类别为独立的
`/codeql-critical-quality/mcp-process-runtime-boundary`。memory-runtime-boundary 作业会扫描 memory host SDK、memory 运行时 facade、
memory 插件 SDK 别名、memory 运行时激活胶水逻辑，以及 memory doctor
命令，类别为独立的 `/codeql-critical-quality/memory-runtime-boundary`。
session-diagnostics-boundary 作业会扫描回复队列内部机制、
会话投递队列、出站会话绑定/投递帮助器、诊断
事件/日志包表面，以及会话 doctor CLI 契约，类别为独立的
`/codeql-critical-quality/session-diagnostics-boundary`。ui-control-plane 作业会扫描 Control UI bootstrap、本地持久化、Gateway 网关
控制流和任务控制平面运行时契约，类别为独立的
`/codeql-critical-quality/ui-control-plane`。web-media-runtime-boundary 作业会扫描核心 web fetch/search、media IO、media
understanding、image-generation 和 media-generation 运行时契约，类别为
独立的 `/codeql-critical-quality/web-media-runtime-boundary`。plugin-boundary 作业会扫描加载器、registry、public-surface 和插件 SDK
入口点契约，类别为独立的 `/codeql-critical-quality/plugin-boundary`。
plugin-sdk-package-contract 作业会扫描已发布包侧的
插件 SDK 源码和插件包契约帮助器，类别为独立的
`/codeql-critical-quality/plugin-sdk-package-contract`。保持该
工作流与安全工作流分离，这样质量发现就可以
被定时、度量、禁用或扩展，而不会遮蔽安全信号。
Swift、Python 和内置插件 CodeQL 扩展应仅在窄 profile 具有稳定
运行时间和信号之后，作为作用域化或分片的后续工作加回。

`Docs Agent` 工作流是事件驱动的 Codex 维护 lane，用于保持
现有文档与近期落地的变更一致。它没有纯定时计划：一次
在 `main` 上成功的非 bot push CI 运行可以触发它，手动 dispatch 也可以
直接运行它。当 `main` 已经前移，或过去一小时内已经创建了
另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会
审查从上一个未跳过的 Docs Agent source SHA 到
当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档 pass
以来累积的所有 main 变更。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护 lane，
用于慢测试。它没有纯定时计划：一次在
`main` 上成功的非 bot push CI 运行可以触发它，但如果该 UTC 日已经
有另一个 workflow-run 调用运行过或正在运行，它会跳过。手动 dispatch 会绕过该每日活动
gate。该 lane 会构建一个全套件分组 Vitest 性能报告，让 Codex
只做小型且保持覆盖率的测试性能修复，而不是广泛
重构，然后重跑全套件报告，并拒绝会降低
passing baseline 测试数量的变更。如果 baseline 有失败测试，Codex 可以只修复
明显失败，并且 after-agent 全套件报告必须通过后
才会提交任何内容。当 bot push 落地前 `main` 前进时，该 lane
会 rebase 已验证的 patch，重跑 `pnpm check:changed`，并重试 push；
有冲突的过期 patch 会被跳过。它使用 GitHub-hosted Ubuntu，因此 Codex
action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、已变更插件，并构建 CI 清单                                         | 始终在非草稿推送和 PR 上运行       |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                       | 始终在非草稿推送和 PR 上运行       |
| `security-dependency-audit`      | 针对 npm 公告进行无依赖的生产 lockfile 审计                                                  | 始终在非草稿推送和 PR 上运行       |
| `security-fast`                  | 快速安全作业所需的聚合检查                                                                   | 始终在非草稿推送和 PR 上运行       |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查以及可复用的下游产物                                   | Node 相关变更                      |
| `checks-fast-core`               | 快速 Linux 正确性检查线，例如内置/插件契约/协议检查                                          | Node 相关变更                      |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                 | Node 相关变更                      |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件检查线                                       | Node 相关变更                      |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格冒烟测试                         | Node 相关变更                      |
| `check-additional`               | 架构、边界、插件表面守卫、包边界和 gateway-watch 分片                                        | Node 相关变更                      |
| `build-smoke`                    | 已构建 CLI 冒烟测试和启动内存冒烟测试                                                       | Node 相关变更                      |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | Node 相关变更                      |
| `checks-node-compat-node22`      | Node 22 兼容性构建和冒烟检查线                                                               | 发布的手动 CI 调度                 |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                    | 文档已变更                         |
| `skills-python`                  | 面向 Python 支持的 Skills 的 Ruff + pytest                                                   | Python Skills 相关变更             |
| `checks-windows`                 | Windows 专用进程/路径测试，以及共享运行时 import specifier 回归检查                          | Windows 相关变更                   |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试检查线                                               | macOS 相关变更                     |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | macOS 相关变更                     |
| `android`                        | 两种 flavor 的 Android 单元测试，外加一次调试 APK 构建                                       | Android 相关变更                   |
| `test-performance-agent`         | 受信活动后的每日 Codex 慢测试优化                                                           | 主 CI 成功或手动调度               |

手动 CI 调度运行与普通 CI 相同的作业图，但会强制启用每个
非 Android 范围检查线：Linux Node 分片、内置插件分片、渠道
契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档
检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI
调度仅在 `include_android=true` 时运行 Android；完整发布
总括流程会通过传递 `include_android=true` 启用 Android。插件预发布
静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件
批量扫描以及插件预发布 Docker 检查线都不包含在 CI 中。Docker
预发布套件仅在 `Full Release Validation` 调度带有发布验证门禁的
单独 `Plugin Prerelease` 工作流时运行。手动运行使用
唯一并发组，因此发布候选完整套件不会被同一 ref 上的
另一个推送或 PR 运行取消。可选的 `target_ref` 输入允许
受信调用方在使用所选调度 ref 中的工作流文件的同时，
针对分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业会按顺序排列，让低成本检查先于高成本检查失败：

1. `preflight` 决定哪些检查线实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 检查线重叠运行，因此下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时检查线随后扇出：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动派发会跳过变更作用域检测，并让预检清单
表现得像每个作用域区域都发生了变更。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台 lane 仍然只作用于平台源码变更。
仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及窄范围插件合约辅助工具/测试路由编辑，会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或辅助工具表面时，该路径会避开构建产物、Node 22 兼容性、渠道合约、完整核心分片、内置插件分片以及额外的守卫矩阵。
Windows Node 检查仅作用于 Windows 特定的进程/路径封装器、npm/pnpm/UI runner 辅助工具、包管理器配置，以及执行该 lane 的 CI 工作流表面；无关的源码、插件、install-smoke 和仅测试变更会留在 Linux Node lane 上，因此不会为已经由常规测试分片覆盖的内容占用一个 16-vCPU Windows worker。
单独的 `install-smoke` 工作流会通过自己的 `preflight` job 复用同一个作用域脚本。它把 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会对 Docker/包表面、内置插件包/清单变更，以及 Docker smoke job 覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，同时分别限制每个场景的 Docker run。完整路径会为夜间定时运行、手动派发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request 保留 QR 包安装和安装器 Docker/update 覆盖。在完整模式下，install-smoke 会准备或复用一个目标 SHA GHCR 根 Dockerfile smoke 镜像，然后将 QR 包安装、根 Dockerfile/Gateway 网关 smoke、安装器/update smoke，以及快速内置插件 Docker E2E 作为单独 job 运行，这样安装器工作不会排在根镜像 smoke 之后等待。`main` 推送，包括合并提交，不会强制触发完整路径；当变更作用域逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker smoke，并把完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划任务和发布检查工作流中运行，并且手动 `install-smoke` 派发可以选择启用它，但 pull request 和 `main` 推送不会运行它。QR 和安装器 Docker 测试会保留自己的安装聚焦 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/update/plugin-dependency lane 的裸 Node/Git runner，以及一个把同一个 tarball 安装到 `/app` 以用于常规功能 lane 的功能镜像。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行 lane；使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool slot 数 10，使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感的 tail-pool slot 数 10。重型 lane 上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务 lane 不会让 Docker 过度提交，而较轻的 lane 仍然会填满可用 slot。比有效上限更重的单个 lane 仍可从空池启动，然后独占运行直到释放容量。默认情况下，lane 启动会错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活跃 lane Status、持久化 lane 耗时以用于最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在首次失败后停止调度新的池化 lane，并且每个 lane 都有一个 120 分钟的回退超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail lane 会使用更严格的逐 lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器 lane，包括仅发布 lane，例如 `install-e2e`，以及拆分的内置 update lane，例如 `bundled-channel-update-acpx`，同时跳过清理 smoke，以便 agents 复现某个失败 lane。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、lane 和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的 lane 时，通过 Blacksmith 的 Docker layer cache 构建并推送带包 digest 标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包 digest 镜像，而不是重新构建。Docker 镜像拉取会重试，并带有有界的 180 秒单次尝试超时，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。`Package Acceptance` 工作流是高级包门禁：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或之前的工作流产物中解析候选包，然后把这个单一的 `package-under-test` 产物传入可复用 Docker E2E 工作流。它会将 `workflow_ref` 与 `package_ref` 分开，这样当前验收逻辑可以验证较旧的受信任提交，而无需检出旧的工作流代码。发布检查会为目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件 fixture，以及针对解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会运行更小的分块 job，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求它时，OpenWebUI 会并入 `plugins-runtime-services`，并且仅在仅 OpenWebUI 派发时保留独立的 `openwebui` 分块。旧版聚合分块名 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，这样安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` lane 别名仍然是两个 provider 安装器 lane 的聚合手动重跑别名。`bundled-channels` 分块会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行全量的 `bundled-channel-deps` lane。每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢 lane 表格以及逐 lane 重跑命令。工作流 `docker_lanes` 输入会针对已准备好的镜像运行选定 lane，而不是运行分块 job，这会把失败 lane 调试限定在一个目标 Docker job 内，并为该运行准备、下载或复用包产物；如果选定 lane 是 live Docker lane，目标 job 会为该次重跑在本地构建 live-test 镜像。生成的逐 lane GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败的 lane 可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker 产物，并打印组合/逐 lane 目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢 lane 和阶段关键路径摘要。计划的 live/E2E 工作流每天运行完整的 release-path Docker 套件。内置 update 矩阵会按 update 目标拆分，这样重复的 npm update 和 Doctor 修复过程可以与其他内置检查一起分片。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍然是聚合插件/运行时别名，但发布工作流会使用拆分分块，以便渠道 smoke、update 目标、插件运行时检查以及内置插件安装/卸载扫描能够并行运行。目标 `docker_lanes` 派发也会在一个共享包/镜像准备步骤之后，把多个选定 lane 拆分为并行 job，并且内置渠道 update lane 会针对瞬时 npm 网络失败重试一次。

本地变更检查分道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产与核心测试 typecheck，以及核心 lint/guards；仅核心测试变更只运行核心测试 typecheck 与核心 lint；插件生产变更会运行插件生产与插件测试 typecheck，以及插件 lint；仅插件测试变更会运行插件测试 typecheck 与插件 lint。公开的插件 SDK 或插件契约变更会扩展到插件 typecheck，因为插件依赖这些核心契约，但 Vitest 插件扫描属于显式测试工作。仅发布元数据的版本号变更会运行有针对性的版本、配置、根依赖检查。未知的根目录或配置变更会安全回退到所有检查分道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且刻意比 `check:changed` 更轻量：直接测试编辑会运行自身，源码编辑优先使用显式映射，然后是同级测试与导入图依赖项。共享群组聊天室投递配置是显式映射之一：对群组可见回复配置、源回复投递模式或消息工具系统提示词的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，因此共享默认值变更会在第一次 PR 推送前失败。仅当变更范围足够覆盖整个 harness，以至于廉价映射集合不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为宽泛证明使用一个新预热的 box。在把慢速门禁花到一个被复用、已过期或刚报告异常大同步的 box 之前，先在 box 内运行 `pnpm testbox:sanity`。当所需根文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常意味着远端同步状态不是 PR 的可信副本。停止那个 box，并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该保护，或者为异常大的本地差异使用更大的毫秒值。

手动 CI 分发会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。Android 对独立手动 CI 是可选的，通过 `include_android=true` 启用，并且始终为 `Full Release Validation` 启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个独立工作流，由 `Full Release Validation` 或显式操作员分发触发。普通 pull request、`main` 推送和独立手动 CI 分发都会关闭该套件。

最慢的 Node 测试族已被拆分或均衡，因此每个作业都保持较小规模且不会过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元分道会配对运行，自动回复作为四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置则分散到现有仅源码 agentic Node 作业中，而不是等待构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件兜底项。`Plugin Prerelease` 会在八个插件 worker 之间均衡内置插件测试；这些插件分片作业一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，因此导入密集的插件批次不会创建额外 CI 作业。宽泛 agents 分道使用共享的 Vitest 文件并行调度器，因为它受导入/调度主导，而不是由单个慢测试文件拥有。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片承担尾部耗时。包含模式分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置与过滤后的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分离；边界 guard 分片会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `dist/` 与 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量验证作业，同时避免两个额外 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试分道仍会使用短信/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送时重复打包 debug APK。
当同一 PR 或 `main` ref 上有更新推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被取代后不会继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸项无法无限期阻塞新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，因此 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建中，32-vCPU 队列时间的成本高于节省                                                                                                                                                                                                                                                                                                     |
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

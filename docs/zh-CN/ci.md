---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁和本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T21:36:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1ebc8e9e34c27f4ae176e8183637dfe4e1c84c2510b8ffe5614eb4c21c8963
    source_path: ci.md
    workflow: 16
---

CI 在每次推送到 `main` 和每个拉取请求时运行。它使用智能范围限定，在只有无关区域发生变更时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为发布候选或广泛验证展开完整的常规 CI 图；对于独立手动运行，Android 通道通过 `include_android` 选择启用。仅发布用的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只从 `Full Release Validation` 或显式手动分发运行。

`check-dependencies` 分片运行 `pnpm deadcode:dependencies`，这是一个生产 Knip 仅依赖项检查流程，固定到该脚本使用的最新 Knip 版本，并为 `dlx` 安装禁用 pnpm 的最小发布时间限制。它还运行 `pnpm deadcode:unused-files`，将 Knip 的生产未使用文件发现结果与 `scripts/deadcode-unused-files.allowlist.mjs` 对比。该保护会在 PR 添加新的未经审查的未使用文件，或清理后留下过期允许列表条目时失败，同时保留 Knip 无法静态解析的有意动态插件、生成内容、构建、实时测试和包桥接表面。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，为仅发布的插件/包/静态/Docker 证明分发 `Plugin Prerelease`，并为安装冒烟、包验收、Docker 发布路径套件、实时/E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 通道分发 `OpenClaw Release Checks`。当提供已发布包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的实时/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总控会记录已分发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变绿，只需重新运行父级验证作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选使用 `all`，仅常规完整 CI 子项使用 `ci`，所有发布子项使用 `release-checks`，或在总控上使用更窄的发布组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这能在完成针对性修复后，将失败发布盒的重新运行范围限制住。

发布实时/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖范围，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及提供商过滤的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖范围的同时，让较慢的实时提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重新运行。

原生实时媒体分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装 `ffmpeg` 和 `ffprobe`；媒体作业只在设置前验证这些二进制文件。让 Docker 支持的实时套件继续在常规 Blacksmith 运行器上运行，因为容器作业不适合启动嵌套 Docker 测试。

Docker 支持的实时模型/后端分片为每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。实时发布工作流会构建并推送一次该镜像，然后 Docker 实时模型、Gateway 网关、CLI 后端、ACP 绑定和 Codex harness 分片使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重新构建完整源码 Docker 目标，说明发布运行配置有误，并会把墙钟时间浪费在重复镜像构建上。

`OpenClaw Release Checks` 使用可信工作流引用将选定引用解析一次为 `release-package-under-test` tarball，然后将该工件传递给实时/E2E 发布路径 Docker 工作流和包验收分片。这样可以让发布盒之间的包字节保持一致，并避免在多个子作业中重新打包同一个候选版本。

`Package Acceptance` 是用于验证包工件且不阻塞发布工作流的旁路运行工作流。它从已发布的 npm 规格、使用选定 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 工件中解析一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，使用该 tarball 而不是重新打包工作流检出内容。配置文件覆盖冒烟、包、产品、完整和自定义 Docker 通道选择。`package` 配置文件使用离线插件覆盖范围，因此已发布包验证不会受实时 ClawHub 可用性限制。可选 Telegram 通道在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 工件，同时保留已发布 npm 规格路径用于独立分发。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收通过用户在安装或更新后执行的同一套 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 工件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流下载该工件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包而不是打包工作流检出内容运行选定的 Docker 通道。当某个配置文件选择多个目标 `docker_lanes` 时，可复用工作流会准备一次包和共享镜像，然后将这些通道展开为并行的目标 Docker 作业，并使用唯一工件。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并在 Package Acceptance 已解析出包时安装相同的 `package-under-test` 工件；独立 Telegram 分发仍可安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版验收。
- `source=ref`：打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享工件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的可信工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样当前测试 harness 就可以验证较旧的可信源提交，而无需运行旧的工作流逻辑。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用包验收。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而包验收针对同一个已解析包 tarball 保留工件原生的内置渠道兼容、离线插件和 Telegram 证明。
跨 OS 发布检查仍覆盖特定 OS 的新手引导、安装器和平台行为；包/更新产品验证应从包验收开始。Windows 打包和安装器全新安装通道还会验证已安装包能否从原始绝对 Windows 路径导入 browser-control 覆盖项。OpenAI 跨 OS 智能体回合冒烟默认使用已设置的 `OPENCLAW_CROSS_OS_OPENAI_MODEL`，否则使用 `openai/gpt-5.4-mini`，因此安装和 Gateway 网关证明保持快速且确定。专用实时提供商/模型通道仍覆盖更广泛的模型路由，包括较慢的前沿默认项。

包验收为已经发布的包设置了有界的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包不暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可跳过其持久化子案例；`update-channel-switch` 可从 tarball 派生的伪 git fixture 中修剪缺失的 `pnpm.patchedDependencies`，并可记录缺失的持久化 `update.channel`；插件冒烟可读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可针对已经发布的本地构建元数据标记文件发出警告。之后的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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
摘要，确认 package 来源、版本和 SHA-256。然后检查
`docker_acceptance` 子运行及其 Docker 工件：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段
耗时和重新运行命令。优先重新运行失败的 package profile 或
精确的 Docker lane，而不是重新运行完整的发布验证。

QA Lab 在主智能范围化 workflow 之外有专用的 CI lane。
`Parity gate` workflow 会在匹配的 PR 变更和手动调度时运行；它会
构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6
agentic pack。`QA-Lab - All Lanes` workflow 会在 `main` 上每夜运行，也可
手动调度；它会将 mock parity gate、live Matrix lane，以及 live
Telegram 和 Discord lane 作为并行 job 扇出。live job 使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex lease。发布
检查会使用确定性 mock provider 和 mock 限定的模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram live transport lane，因此 channel contract
会与 live model 延迟和正常 provider-plugin 启动隔离。live transport gateway 也会
禁用 memory search，因为 QA parity 会单独覆盖 memory 行为；
provider 连通性由独立的 live model、native provider
和 Docker provider suite 覆盖。Matrix 在定时和发布 gate 中使用 `--profile fast`，
只有在检出的 CLI 支持时才添加 `--fail-fast`。CLI 默认值
和手动 workflow 输入仍为 `all`；手动 `matrix_profile=all`
调度总是将完整 Matrix 覆盖分片为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` job。`OpenClaw Release Checks` 也会
在发布批准前运行发布关键的 QA Lab lane；它的 QA parity
gate 会将候选 pack 和 baseline pack 作为并行 lane job 运行，然后把
两个工件下载到一个小型 report job 中，用于最终 parity 比较。
除非变更实际触及 QA runtime、model-pack parity，或 parity workflow 拥有的 surface，
否则不要把 PR landing path 置于 `Parity gate` 之后。
对于普通 channel、config、docs 或 unit-test 修复，应将其视为可选
信号，并遵循范围化的 CI/check 证据。

`Duplicate PRs After Merge` workflow 是一个供维护者在落地后清理
重复项的手动 workflow。它默认 dry-run，只有在 `apply=true` 时才会关闭显式
列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 已合并，并且每个
重复项都有共享的 referenced issue 或重叠的 changed hunks。

`CodeQL` workflow 有意作为窄范围的第一轮安全扫描器，
不是完整的仓库扫描。每日和手动运行会扫描 Actions workflow code
以及风险最高的 JavaScript/TypeScript auth、secrets、sandbox、cron 和
gateway surface，并在
`/codeql-critical-security/core-auth-secrets` category 下使用高精度安全查询。
channel-runtime-boundary job 会另外扫描核心 channel implementation
contract，以及 channel plugin runtime、gateway、Plugin SDK、secrets 和
audit touchpoint，归入 `/codeql-critical-security/channel-runtime-boundary`
category，这样 channel security signal 可以扩展，而无需扩大 baseline
auth/secrets category。network-ssrf-boundary job 会扫描核心 SSRF、IP parsing、
network guard、web-fetch 和 Plugin SDK SSRF policy surface，归入
`/codeql-critical-security/network-ssrf-boundary` category，这样 network trust
boundary signal 会与 auth/secrets security baseline 分离。
mcp-process-tool-boundary job 会扫描 MCP server、process execution helper、
outbound delivery 和 agent tool-execution gate，归入
`/codeql-critical-security/mcp-process-tool-boundary` category，这样 command 和
tool boundary signal 会与 auth/secrets baseline 以及
非安全 MCP/process quality shard 分离。

`CodeQL Android Critical Security` workflow 是定时 Android
security shard。它会在 workflow sanity 接受的最小
Blacksmith Linux runner label 上为 CodeQL 手动构建 Android app，并将结果上传到
`/codeql-critical-security/android` category 下。

`CodeQL macOS Critical Security` workflow 是每周/手动 macOS
security shard。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS app，
从上传的 SARIF 中过滤 dependency build result，并将结果上传到
`/codeql-critical-security/macos` category 下。将它放在每日
默认 workflow 之外，因为即使在干净状态下，macOS build 也会主导运行时长。

`CodeQL Critical Quality` workflow 是对应的非安全 shard。它
只在较小的 Blacksmith Linux runner 上，对窄范围高价值 surface 运行
error-severity、非安全的 JavaScript/TypeScript quality query。它的
手动调度接受 `profile=all|plugin-sdk-package-contract`；窄范围
profile 是第一个教学/迭代钩子，可用于隔离运行一个 quality shard，
而无需调度 workflow 的其余部分。
它的
core-auth-secrets job 会扫描 auth、secrets、sandbox、cron 和 gateway security
boundary code，归入单独的 `/codeql-critical-quality/core-auth-secrets`
category。config-boundary
job 会扫描 config schema、migration、normalization 和 IO contract，归入
单独的 `/codeql-critical-quality/config-boundary` category。gateway-runtime-boundary job 会扫描 gateway protocol schema 和 server method
contract，归入单独的
`/codeql-critical-quality/gateway-runtime-boundary` category。channel-runtime-boundary job 会扫描核心 channel implementation contract，归入
单独的 `/codeql-critical-quality/channel-runtime-boundary` category。agent-runtime-boundary job 会扫描 command execution、model/provider dispatch、
auto-reply dispatch 与 queue，以及 ACP control-plane runtime contract，归入
单独的 `/codeql-critical-quality/agent-runtime-boundary` category。mcp-process-runtime-boundary job 会扫描 MCP server 和 tool bridge、process
supervision helper，以及 outbound delivery contract，归入单独的
`/codeql-critical-quality/mcp-process-runtime-boundary` category。memory-runtime-boundary job 会扫描 memory host SDK、memory runtime facade、
memory Plugin SDK alias、memory runtime activation glue，以及 memory doctor
command，归入单独的 `/codeql-critical-quality/memory-runtime-boundary`
category。
ui-control-plane job 会扫描 Control UI bootstrap、local persistence、gateway
control flow 和 task control-plane runtime contract，归入单独的
`/codeql-critical-quality/ui-control-plane` category。web-media-runtime-boundary job 会扫描核心 web fetch/search、media IO、media
understanding、image-generation 和 media-generation runtime contract，归入
单独的 `/codeql-critical-quality/web-media-runtime-boundary` category。plugin-boundary job 会扫描 loader、registry、public-surface 和 Plugin SDK
entrypoint contract，归入单独的 `/codeql-critical-quality/plugin-boundary`
category。plugin-sdk-package-contract job 会扫描已发布 package 侧的
Plugin SDK source 和 plugin package contract helper，归入单独的
`/codeql-critical-quality/plugin-sdk-package-contract` category。保持该
workflow 与 security 分离，这样 quality finding 就可以被
调度、衡量、禁用或扩展，而不会遮蔽 security signal。
Swift、Python 和 bundled-plugin CodeQL 扩展应仅在窄范围 profile 具备稳定
runtime 和 signal 后，作为范围化或分片的后续工作重新加入。

`Docs Agent` workflow 是事件驱动的 Codex 维护 lane，用于让
现有 docs 与最近落地的变更保持一致。它没有纯定时计划：`main` 上
成功的非 bot push CI 运行可以触发它，手动调度也可以
直接运行它。workflow-run 调用会在 `main` 已经前移，或过去一小时内
已创建另一个未跳过的 Docs Agent 运行时跳过。运行时，它会
审查从上一个未跳过的 Docs Agent source SHA 到当前 `main` 的 commit range，
因此一次每小时运行可以覆盖自上次 docs pass 以来积累的所有 main 变更。

`Test Performance Agent` workflow 是事件驱动的 Codex 维护 lane，
用于处理慢测试。它没有纯定时计划：`main` 上成功的非 bot push CI 运行
可以触发它，但如果另一个 workflow-run 调用在同一个 UTC 日已经
运行或正在运行，它会跳过。手动调度会绕过该每日活动
gate。该 lane 会构建完整套件分组 Vitest performance report，让 Codex
只进行小型、保持覆盖率的 test performance 修复，而不是大范围
重构，然后重新运行完整套件 report，并拒绝会降低
passing baseline test count 的变更。如果 baseline 存在 failing test，Codex 只能修复
明显失败，并且 after-agent full-suite report 必须通过后
才会提交任何内容。当 `main` 在 bot push 落地前前移时，该 lane
会 rebase 已验证的 patch，重新运行 `pnpm check:changed`，并重试 push；
有冲突的 stale patch 会被跳过。它使用 GitHub-hosted Ubuntu，因此 Codex
action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Job 概览

| 作业                             | 用途                                                                                         | 运行时机                           |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、已变更范围、已变更插件，并构建 CI 清单                                      | 始终在非草稿 push 和 PR 上运行     |
| `security-scm-fast`              | 私钥检测，以及通过 `zizmor` 进行 workflow 审计                                                | 始终在非草稿 push 和 PR 上运行     |
| `security-dependency-audit`      | 针对 npm 安全公告，对生产锁文件执行无需依赖的审计                                           | 始终在非草稿 push 和 PR 上运行     |
| `security-fast`                  | 快速安全作业的必需汇总                                                                       | 始终在非草稿 push 和 PR 上运行     |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查，以及可复用的下游产物                                | 与 Node 相关的变更                 |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置插件、插件契约和协议检查                                     | 与 Node 相关的变更                 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的汇总检查结果                                                | 与 Node 相关的变更                 |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、内置、契约和插件通道                                        | 与 Node 相关的变更                 |
| `check`                          | 分片的主本地门禁等价项：生产类型、lint、守卫、测试类型和严格 smoke                          | 与 Node 相关的变更                 |
| `check-additional`               | 架构、边界、插件表面守卫、包边界和 gateway-watch 分片                                       | 与 Node 相关的变更                 |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                                       | 与 Node 相关的变更                 |
| `checks`                         | 已构建产物渠道测试的验证器                                                                   | 与 Node 相关的变更                 |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                             | 发布时手动 CI 调度                 |
| `check-docs`                     | 文档格式、lint 和断链检查                                                                    | 文档已变更                         |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                | 与 Python Skills 相关的变更        |
| `checks-windows`                 | Windows 特定进程/路径测试，以及共享运行时 import specifier 回归检查                         | 与 Windows 相关的变更              |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                                | 与 macOS 相关的变更                |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                         | 与 macOS 相关的变更                |
| `android`                        | 两种 flavor 的 Android 单元测试，加一次 debug APK 构建                                      | 与 Android 相关的变更              |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢测试优化                                                           | 主 CI 成功或手动调度               |

手动 CI 调度运行与普通 CI 相同的作业图，但强制启用所有非 Android 作用域通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立手动 CI 调度仅在 `include_android=true` 时运行 Android；完整发布总入口通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布的 `agentic-plugins` 分片、完整插件批量扫描，以及插件预发布 Docker 通道均排除在 CI 之外。Docker 预发布套件仅在 `Full Release Validation` 调度单独的 `Plugin Prerelease` workflow，并启用发布验证门禁时运行。手动运行使用唯一的并发组，因此发布候选完整套件不会被同一 ref 上的另一次 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用方在使用所选调度 ref 中 workflow 文件的同时，针对分支、标签或完整 commit SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，让低成本检查先于高成本检查失败：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是此作业内的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动派发会跳过变更作用域检测，并让预检清单表现得像每个作用域区域都发生了变更。
CI 工作流编辑会验证 Node CI 图和工作流 lint，但不会单独强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只限定在平台源代码变更时运行。
仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及范围很窄的插件契约辅助程序/测试路由编辑，会使用快速的仅 Node 清单路径：预检、安全检查，以及单个 `checks-fast-core` 任务。该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的守护矩阵；前提是变更文件仅限于该快速任务会直接执行的路由或辅助程序表面。
Windows Node 检查限定于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助程序、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、安装冒烟和仅测试变更会留在 Linux Node 通道上，因此不会为普通测试分片已经覆盖的内容占用一个 16-vCPU Windows worker。
独立的 `install-smoke` 工作流通过自己的 `preflight` job 复用同一个作用域脚本。它把冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟 job 会执行的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete 共享工作区 CLI 冒烟，运行容器 gateway-network e2e，验证内置扩展构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，同时每个场景的 Docker run 会单独设上限。完整路径会把 QR 包安装和安装器 Docker/update 覆盖保留给夜间定时运行、手动派发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。在完整模式下，install-smoke 会准备或复用一个目标 SHA 的 GHCR 根 Dockerfile 冒烟镜像，然后把 QR 包安装、根 Dockerfile/Gateway 网关冒烟、安装器/update 冒烟，以及快速内置插件 Docker E2E 作为独立 job 运行，这样安装器工作不必等待根镜像冒烟完成。`main` 推送，包括合并提交，不会强制完整路径；当变更作用域逻辑会在推送上请求完整覆盖时，工作流会保留快速 Docker 冒烟，并把完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独控制；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 派发也可以选择加入，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留自己的安装聚焦 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：一个用于安装器/update/plugin-dependency 通道的裸 Node/Git 运行器，以及一个会把同一个 tarball 安装到 `/app` 的功能镜像，用于普通功能通道。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行选定的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；使用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 10 个槽位的主池数量，并使用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整默认 10 个槽位的提供商敏感尾池数量。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，因此 npm install 和多服务通道不会让 Docker 超额提交，而较轻的通道仍会填满可用槽位。单个比有效上限更重的通道仍可从空池启动，然后独占运行，直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon 创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker、移除陈旧的 OpenClaw E2E 容器、输出活动通道状态、持久化通道耗时以进行最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 来检查调度器。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有一个可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖的 120 分钟后备超时；选定的 live/tail 通道会使用更严格的逐通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括 `install-e2e` 等仅发布通道，以及 `bundled-channel-update-acpx` 等拆分的内置 update 通道，同时跳过清理冒烟，以便智能体复现某个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会把该计划转换成 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的裸/功能 GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有包摘要镜像，而不是重新构建。Docker 镜像拉取会用有界的每次尝试 180 秒超时进行重试，因此卡住的 registry/cache 流会快速重试，而不是消耗 CI 关键路径的大部分时间。`Package Acceptance` 工作流是高层包门禁：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前工作流产物中解析候选包，然后把单个 `package-under-test` 产物传入可复用的 Docker E2E 工作流。它把 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较早的受信任提交，而不必检出旧的工作流代码。发布检查会为目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件 fixture，以及针对解析出的 tarball 的 Telegram 包 QA。发布路径 Docker 套件会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行更小的分块 job，因此每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|plugins-runtime-install-e|plugins-runtime-install-f|plugins-runtime-install-g|plugins-runtime-install-h|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且只为仅 OpenWebUI 的派发保留独立的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，这样安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 通道别名仍然是两个提供商安装器通道的聚合手动重跑别名。`bundled-channels` 分块会运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及逐通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块 job，这会把失败通道调试限定在一个有针对性的 Docker job 内，并为该运行准备、下载或复用包产物；如果选定通道是 live Docker 通道，目标 job 会为该次重跑在本地构建 live-test 镜像。生成的逐通道 GitHub 重跑命令会在存在这些值时包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 运行下载 Docker 产物，并打印合并/逐通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。定时 live/E2E 工作流每天运行完整 release-path Docker 套件。内置 update 矩阵按 update 目标拆分，因此重复 npm update 和 Doctor 修复流程可以与其他内置检查分片并行。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`plugins-runtime-install-e`、`plugins-runtime-install-f`、`plugins-runtime-install-g`、`plugins-runtime-install-h`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-discord`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 也仍是聚合插件/运行时别名，但发布工作流使用拆分分块，这样渠道冒烟、update 目标、插件运行时检查，以及内置插件安装/卸载扫描可以并行运行。目标 `docker_lanes` 派发也会在一个共享包/镜像准备步骤之后，把多个选定通道拆分成并行 job，并且内置渠道 update 通道会针对临时 npm 网络失败重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比宽泛的 CI 平台范围更严格：核心生产代码变更会运行核心生产代码和核心测试类型检查，以及核心 lint/防护检查；仅核心测试变更只运行核心测试类型检查和核心 lint；插件生产代码变更会运行插件生产代码和插件测试类型检查，以及插件 lint；仅插件测试变更会运行插件测试类型检查和插件 lint。公共插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫检属于显式测试工作。仅发布元数据的版本号变更会运行定向版本/配置/根依赖检查。未知的根目录/配置变更会故障安全地进入所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行它们自身，源码编辑会优先使用显式映射，然后是同级测试和导入图依赖项。共享群组聊天室投递配置是显式映射之一：对群组可见回复配置、来源回复投递模式或消息工具系统提示词的变更，会路由到核心回复测试以及 Discord 和 Slack 投递回归测试，因此共享默认值变更会在第一次 PR 推送前失败。只有当变更范围足够覆盖整个 harness，以至于廉价映射集合不能作为可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先使用新预热的 box 做宽泛证明。在把一个慢门禁花在复用过、已过期，或刚刚报告了异常大同步的 box 上之前，先在 box 内运行 `pnpm testbox:sanity`。当必需的根目录文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除时，完整性检查会快速失败。这通常表示远程同步状态不是 PR 的可信副本。停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。如果本地 Blacksmith CLI 调用停留在同步阶段超过五分钟且没有同步后输出，`pnpm testbox:run` 也会终止它。设置 `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` 可禁用该防护，或者为异常大的本地 diff 使用更大的毫秒值。

手动 CI 派发会运行 `checks-node-compat-node22` 作为宽泛兼容性覆盖。Android 对独立手动 CI 是可选项，通过 `include_android=true` 启用，并且在 `Full Release Validation` 中始终启用。`Plugin Prerelease` 是成本更高的产品/包覆盖，因此它是一个独立工作流，由 `Full Release Validation` 或显式操作者派发。普通 pull request、`main` 推送和独立手动 CI 派发都会关闭该套件。

最慢的 Node 测试族已被拆分或均衡，以便每个作业保持较小规模且不过度预留 runner：渠道契约作为三个加权分片运行，小型核心单元通道成对运行，自动回复作为四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片；agentic Gateway 网关/插件配置分散到现有仅源码 agentic Node 作业中，而不是等待构建产物。宽泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享插件总括配置。`Plugin Prerelease` 会在八个插件 worker 之间均衡内置插件测试；这些插件分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，因此导入繁重的插件批次不会创建额外 CI 作业。宽泛 agents 通道使用共享 Vitest 文件并行调度器，因为它主要受导入/调度支配，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片承担尾部耗时。包含模式分片使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将包边界编译/canary 工作放在一起，并将 runtime 拓扑架构与 Gateway 网关 watch 覆盖分开；边界防护分片会在一个作业内并发运行其小型独立防护检查。Gateway 网关 watch、渠道测试和核心支持边界分片在 `dist/` 和 `dist-runtime/` 已构建完成后，在 `build-artifacts` 内并发运行，保留它们原有的检查名称作为轻量验证作业，同时避免两个额外 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。
当较新的推送落到同一个 PR 或 `main` ref 上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## Runners

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`，快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`），快速协议/契约/内置检查，分片渠道契约检查，除 lint 外的 `check` 分片，`check-additional` 分片和聚合，Node 测试聚合验证器，文档检查，Python Skills，workflow-sanity，labeler，auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`，较低权重的插件分片，`checks-fast-core`，`checks-node-compat-node22`，`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`，build-smoke，Linux Node 测试分片，内置插件测试分片，`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，其中 32-vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
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

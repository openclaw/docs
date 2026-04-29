---
read_when:
    - 你需要了解某个 CI 作业为什么运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-29T08:14:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: fedb986b861ed53f97cb94eecd17b94b1f49008070fb87fb0fad8848ede82fb7
    source_path: ci.md
    workflow: 16
---

CI 在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围限定，在只有无关区域发生更改时跳过昂贵的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并展开完整的常规 CI 图，用于候选发布版本或广泛验证；对于独立手动运行，Android 通道可通过 `include_android` 选择启用。仅发布用的插件预发布通道位于单独的 `Plugin Prerelease` 工作流中，并且只会从 `Full Release Validation` 或显式手动调度运行。

`check-dependencies` 分片会运行 `pnpm deadcode:dependencies`，这是一次生产 Knip 仅依赖项检查，固定到该脚本使用的最新 Knip 版本，并且在 `dlx` 安装时禁用 pnpm 的最小发布时间限制。它会拦截新出现的未使用、未列出、无法解析、二进制或 catalog 依赖项，但不会启用 Knip 的完整未使用文件模式；后者仍然是手动审计，因为 OpenClaw 会有意通过 manifests 和字符串 specifier 加载许多插件与运行时表面。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标调度手动 `CI` 工作流，调度 `Plugin Prerelease` 以提供仅发布用的插件/包/静态/Docker 证明，并调度 `OpenClaw Release Checks` 以执行安装冒烟、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。提供已发布包 spec 时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传递给发布检查的 live/provider 覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的 advisory provider/media 矩阵。总控工作流会记录已调度的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变为绿色，只需重新运行父验证器作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。候选发布版本使用 `all`，只运行常规完整 CI 子项使用 `ci`，运行每个发布子项使用 `release-checks`，也可以在总控工作流中使用更窄的发布分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在完成聚焦修复后，将失败发布盒子的重新运行限制在有界范围内。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但会通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的 media 音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样保持相同文件覆盖的同时，让缓慢的 live provider 失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍可用于手动一次性重新运行。

原生 live media 分片在 `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04` 中运行，该镜像由 `Live Media Runner Image` 工作流构建。该镜像预装 `ffmpeg` 和 `ffprobe`；media 作业只会在设置前验证这些二进制文件。将基于 Docker 的 live 套件保留在普通 Blacksmith runner 上，因为容器作业并不适合启动嵌套 Docker 测试。

基于 Docker 的 live 模型/后端分片会针对每个选定提交使用单独的共享 `ghcr.io/openclaw/openclaw-live-test:<sha>` 镜像。live 发布工作流会构建并推送一次该镜像，随后 Docker live model、gateway、CLI backend、ACP bind 和 Codex harness 分片会以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行。如果这些分片独立重建完整源 Docker 目标，则说明发布运行配置错误，并会在重复镜像构建上浪费总体耗时。

`OpenClaw Release Checks` 使用受信任的工作流 ref 将选定 ref 一次性解析为 `release-package-under-test` tarball，然后将该 artifact 传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以让发布盒子之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选版本。

`Package Acceptance` 是用于验证包 artifact 的旁路运行工作流，不会阻塞发布工作流。它会从已发布的 npm spec、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball artifact 中解析一个候选项，将其作为 `package-under-test` 上传，然后复用 Docker 发布/E2E 调度器，并使用该 tarball，而不是重新打包工作流 checkout。profile 覆盖 smoke、package、product、full 和自定义 Docker 通道选择。`package` profile 使用离线插件覆盖，因此已发布包验证不会受 live ClawHub 可用性约束。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` artifact，同时保留已发布 npm spec 路径以支持独立调度。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收通过用户在安装或更新后实际使用的同一个 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` checkout `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` artifact 上传，并在 GitHub 步骤摘要中打印来源、工作流 ref、包 ref、版本、SHA-256 和 profile。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该 artifact，验证 tarball inventory，在需要时准备 package-digest Docker 镜像，并针对该包运行所选 Docker 通道，而不是打包工作流 checkout。当某个 profile 选择多个目标 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些通道展开为并行的目标 Docker 作业，并使用唯一 artifact。
3. `package_telegram` 可选择调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时它会运行，并在 Package Acceptance 已解析包时安装同一个 `package-under-test` artifact；独立 Telegram 调度仍可安装已发布的 npm spec。
4. 如果包解析、Docker 验收或可选 Telegram 通道失败，`summary` 会使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/stable 的验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会 fetch OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选项，但对于外部共享 artifact 应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时会被打包的源提交。这样当前测试 harness 就能验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

profile 映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的 package/update/plugin 通道，而 Package Acceptance 则针对同一个已解析包 tarball 保留 artifact 原生的 bundled-channel compat、离线插件和 Telegram 证明。Cross-OS 发布检查仍会覆盖特定于 OS 的 新手引导、安装器和平台行为；package/update 产品验证应从 Package Acceptance 开始。Windows 打包和安装器 fresh 通道还会验证已安装包可以从原始绝对 Windows 路径导入 browser-control override。

对于已经发布的包，Package Acceptance 有有界的旧版兼容窗口。截至 `2026.4.25` 的包，包括 `2026.4.25-beta.*`，可对 `dist/postinstall-inventory.json` 中已知的私有 QA 条目使用兼容路径，这些条目指向 tarball 省略的文件；当包未暴露该标志时，`doctor-switch` 可以跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可以从 tarball 派生的假 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可以记录缺失的已持久化 `update.channel`；插件冒烟可以读取旧版 install-record 位置，或接受 marketplace install-record 持久化缺失；`plugin-update` 可以允许配置元数据迁移，但仍要求 install record 和 no-reinstall 行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据 stamp 文件发出警告。之后的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的软件包验收运行时，先查看 `resolve_package`
摘要以确认软件包来源、版本和 SHA-256。然后检查
`docker_acceptance` 子运行及其 Docker 构件：
`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段
耗时以及重新运行命令。优先重新运行失败的软件包配置文件或
精确的 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能范围工作流之外有专用的 CI 通道。
`Parity gate` 工作流会在匹配的 PR 变更和手动派发时运行；它会
构建私有 QA 运行时，并比较模拟 GPT-5.5 和 Opus 4.6
智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也会在
手动派发时运行；它会将模拟一致性门禁、实时 Matrix 通道以及实时
Telegram 和 Discord 通道扇出为并行作业。实时作业使用
`qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。发布
检查会使用确定性的模拟提供商和符合模拟条件的模型（`mock-openai/gpt-5.5` 和
`mock-openai/gpt-5.5-alt`）运行 Matrix 和 Telegram 实时传输通道，这样
渠道契约就能与实时模型延迟和普通提供商插件启动隔离。实时传输 Gateway 网关还会
禁用内存搜索，因为 QA 一致性会单独覆盖内存行为；提供商连通性由单独的实时模型、
原生提供商和 Docker 提供商套件覆盖。Matrix 对计划门禁和发布门禁使用 `--profile fast`，
仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值
和手动工作流输入仍为 `all`；手动 `matrix_profile=all`
派发始终会把完整 Matrix 覆盖分片为 `transport`、`media`、
`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 还会
在发布批准前运行发布关键的 QA Lab 通道；其 QA 一致性
门禁会把候选包和基线包作为并行通道作业运行，然后把
两个构件下载到一个小型报告作业中，用于最终一致性比较。
不要把 PR 落地路径置于 `Parity gate` 之后，除非变更实际
触及 QA 运行时、模型包一致性，或一致性工作流拥有的相关面。
对于普通渠道、配置、文档或单元测试修复，请将其视为可选
信号，并遵循限定范围的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于落地后重复项清理的手动维护者工作流。
它默认执行空运行，并且仅在 `apply=true` 时关闭明确
列出的 PR。在修改 GitHub 之前，它会验证
已落地 PR 已合并，并且每个重复 PR 要么具有共享的引用 issue，
要么存在重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，
而不是完整仓库扫描。每日和手动运行会使用高精度安全查询扫描 Actions 工作流代码
以及风险最高的 JavaScript/TypeScript 凭证、机密、沙箱、cron 和
Gateway 网关相关面。
channel-runtime-boundary 作业会另外扫描核心渠道实现
契约以及渠道插件运行时、Gateway 网关、插件 SDK、机密和
审计触点，并归入 `/codeql-critical-security/channel-runtime-boundary`
类别，这样渠道安全信号可以扩展，而无需扩大基线
JS/TS 类别。

`CodeQL Android Critical Security` 工作流是计划运行的 Android
安全分片。它会在工作流完整性检查接受的最小 Blacksmith Linux runner 标签上
为 CodeQL 手动构建 Android 应用，并将结果上传到
`/codeql-critical-security/android` 类别下。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤掉依赖构建结果，并将结果
上传到 `/codeql-critical-security/macos` 类别下。请将它保留在每日
默认工作流之外，因为即使干净运行，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是匹配的非安全分片。它
仅在较小的 Blacksmith Linux runner 上，针对窄范围高价值相关面运行错误严重级别的、
非安全 JavaScript/TypeScript 质量查询。其
core-auth-secrets 作业会扫描凭证、机密、沙箱、cron 和 Gateway 网关安全
边界代码，并归入单独的 `/codeql-critical-quality/core-auth-secrets`
类别。config-boundary
作业会扫描配置架构、迁移、规范化和 IO 契约，并归入
单独的 `/codeql-critical-quality/config-boundary` 类别。
gateway-runtime-boundary 作业会扫描 Gateway 网关协议架构和服务器方法
契约，并归入单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别。
channel-runtime-boundary 作业会扫描核心渠道实现契约，并归入
单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别。
agent-runtime-boundary 作业会扫描命令执行、模型/提供商派发、
自动回复派发与队列，以及 ACP 控制平面运行时契约，并归入
单独的 `/codeql-critical-quality/agent-runtime-boundary` 类别。
mcp-process-runtime-boundary 作业会扫描 MCP 服务器和工具桥、进程
监督辅助工具以及出站投递契约，并归入单独的
`/codeql-critical-quality/mcp-process-runtime-boundary` 类别。
memory-runtime-boundary 作业会扫描内存宿主 SDK、内存运行时外观、
内存插件 SDK 别名、内存运行时激活胶水代码以及内存 Doctor
命令，并归入单独的 `/codeql-critical-quality/memory-runtime-boundary`
类别。
ui-control-plane 作业会扫描 Control UI 引导、本地持久化、Gateway 网关
控制流以及任务控制平面运行时契约，并归入单独的
`/codeql-critical-quality/ui-control-plane` 类别。
web-media-runtime-boundary 作业会扫描核心网页 fetch/search、媒体 IO、媒体
理解、图像生成和媒体生成运行时契约，并归入
单独的 `/codeql-critical-quality/web-media-runtime-boundary` 类别。
plugin-boundary 作业会扫描加载器、注册表、公共相关面和插件 SDK
入口点契约，并归入单独的 `/codeql-critical-quality/plugin-boundary`
类别。请让该工作流与安全工作流分离，以便质量发现可以被
计划、度量、禁用或扩展，而不会遮蔽安全信号。
Swift、Python 和内置插件的 CodeQL 扩展应仅在窄范围配置文件拥有稳定的
运行时间和信号之后，作为有范围或分片的后续工作重新加入。

`Docs Agent` 工作流是事件驱动的 Codex 维护通道，用于让
现有文档与最近落地的变更保持一致。它没有纯计划：一次
在 `main` 上成功的非 bot push CI 运行可以触发它，手动派发也可以
直接运行它。当 `main` 已继续前进，或最近一小时内已经创建过另一个未跳过的 Docs Agent
运行时，workflow-run 调用会跳过。运行时，它会
审查从上一个未跳过 Docs Agent 源 SHA 到当前 `main` 的提交范围，
因此一次每小时运行可以覆盖自上次文档检查以来累积的所有 main 变更。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护通道，
用于处理慢测试。它没有纯计划：一次在
`main` 上成功的非 bot push CI 运行可以触发它，但如果当天 UTC 日内另一个 workflow-run 调用已经
运行过或正在运行，它会跳过。手动派发会绕过该每日活动
门禁。该通道会构建完整套件的分组 Vitest 性能报告，让 Codex
只做保留覆盖率的小型测试性能修复，而不是进行大范围
重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的
变更。如果基线存在失败测试，Codex 只能修复
明显失败，且 agent 后的完整套件报告必须通过，之后
才能提交任何内容。当 `main` 在 bot push 落地前前进时，该通道
会 rebase 已验证补丁，重新运行 `pnpm check:changed`，并重试 push；
存在冲突的陈旧补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex
action 能保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI 清单      | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm 公告进行无依赖的生产 lockfile 审计                             | 始终在非草稿 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合项                                                | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建构件检查以及可复用的下游构件          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 带有稳定聚合检查结果的分片渠道契约检查                         | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关变更              |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、守卫、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件相关面守卫、软件包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 构建构件渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布的手动 CI 派发    |
| `check-docs`                     | 文档格式化、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | 针对 Python 支持的 Skills 执行 Ruff + pytest                                                       | Python 技能相关变更      |
| `checks-windows`                 | Windows 特定的进程/路径测试以及共享运行时 import specifier 回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建构件的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试以及一个 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 可信活动后的每日 Codex 慢测试优化                                    | Main CI 成功或手动派发 |

手动 CI 触发运行与普通 CI 运行相同的作业图，但会强制启用每个非 Android 作用域通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS 和 Control UI i18n。独立的手动 CI 触发仅在 `include_android=true` 时运行 Android；完整发布总控通过传入 `include_android=true` 启用 Android。插件预发布静态检查、仅发布使用的 `agentic-plugins` 分片、完整插件批量扫描以及插件预发布 Docker 通道不包含在 CI 中。Docker 预发布套件仅在 `Full Release Validation` 触发单独的 `Plugin Prerelease` workflow 且启用发布验证门禁时运行。手动运行使用唯一的并发组，因此候选发布完整套件不会被同一 ref 上的另一次 push 或 PR 运行取消。可选的 `target_ref` 输入允许可信调用方在分支、标签或完整提交 SHA 上运行该作业图，同时使用所选触发 ref 中的 workflow 文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，让低成本检查先于高成本检查失败：

1. `preflight` 决定哪些通道实际存在。`docs-scope` 和 `changed-scope` 逻辑是此作业中的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，无需等待更重的构件和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得像每个作用域区域都已变更。
CI workflow 编辑会验证 Node CI 作业图和 workflow lint，但本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然限定为平台源代码变更。
仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及范围很窄的插件契约辅助代码/测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查和单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或辅助代码表面时，此路径会避开构建构件、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片和额外防护矩阵。
Windows Node 检查限定于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助代码、包管理器配置，以及执行该通道的 CI workflow 表面；无关的源代码、插件、安装冒烟和仅测试变更仍留在 Linux Node 通道上，因此不会为普通测试分片已覆盖的内容占用 16-vCPU Windows worker。
单独的 `install-smoke` workflow 通过自己的 `preflight` 作业复用相同的作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/包表面、内置插件包/清单变更，以及 Docker 冒烟作业覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟，运行容器 gateway-network e2e，验证内置插件构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，同时每个场景的 Docker 运行也会单独封顶。完整路径会为夜间计划运行、手动触发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的 pull request 保留 QR 包安装和安装器 Docker/更新覆盖。`main` push（包括 merge commit）不会强制运行完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，workflow 会保留快速 Docker 冒烟，并把完整安装冒烟留给夜间或发布验证。较慢的 Bun 全局安装 image-provider 冒烟由 `run_bun_global_install_smoke` 单独门控；它会在夜间计划和发布检查 workflow 中运行，手动 `install-smoke` 触发可以选择加入，但 pull request 和 `main` push 不会运行它。QR 和安装器 Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：用于安装器/更新/插件依赖通道的裸 Node/Git runner，以及一个将相同 tarball 安装到 `/app` 中、用于普通功能通道的功能性镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool 槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感 tail-pool 槽位数 10。重型通道上限默认是 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 超额提交，而较轻通道仍可填满可用槽位。单个比有效上限更重的通道仍可从空池启动，然后独占运行直到释放容量。默认情况下，通道启动会错开 2 秒，以避免本地 Docker daemon 出现创建风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除过期的 OpenClaw E2E 容器，输出活动通道状态，持久化通道耗时以便最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有 120 分钟的后备超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更紧的按通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（例如 `install-e2e`）以及拆分的内置更新通道（例如 `bundled-channel-update-acpx`），同时跳过清理冒烟，以便智能体复现某个失败通道。可复用的 live/E2E workflow 会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，下载当前运行的包构件，或从 `package_artifact_run_id` 下载包构件；验证 tarball 清单；在计划需要已安装包的通道时，通过 Blacksmith 的 Docker 层缓存构建并推送带包摘要标签的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有带包摘要的镜像，而不是重新构建。`Package Acceptance` workflow 是高级包门禁：它从 npm、可信 `package_ref`、HTTPS tarball 加 SHA-256，或之前的 workflow 构件解析候选包，然后将该单个 `package-under-test` 构件传入可复用 Docker E2E workflow。它将 `workflow_ref` 与 `package_ref` 分开，因此当前验收逻辑可以验证较旧的可信提交，而无需签出旧 workflow 代码。发布检查会为目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件 fixture，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件使用较小的分块作业并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取它需要的镜像类型，并通过相同的加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且仅为 OpenWebUI-only 触发保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布 workflow 使用拆分分块，因此安装器 E2E 和内置插件安装/卸载扫描不会主导关键路径。`install-e2e` 通道别名仍然是两个 provider 安装器通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行一体化的 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表以及按通道重跑命令。workflow 的 `docker_lanes` 输入会针对准备好的镜像运行选定通道，而不是运行分块作业，这会把失败通道调试限定在一个有目标的 Docker 作业内，并为该次运行准备、下载或复用包构件；如果选定通道是 live Docker 通道，目标作业会为该次重跑在本地构建 live-test 镜像。生成的按通道 GitHub 重跑命令在这些值存在时会包含 `package_artifact_run_id`、`package_artifact_name` 和准备好的镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker 构件并打印组合/按通道的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 获取慢通道和阶段关键路径摘要。计划的 live/E2E workflow 每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 Doctor 修复过程可以与其他内置检查分片运行。

当前版本的 Docker 分块包括 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合的 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍作为聚合的插件/运行时别名保留，但发布工作流会使用拆分后的分块，让渠道冒烟测试、更新目标、插件运行时检查以及内置插件安装/卸载扫测可以并行运行。定向的 `docker_lanes` 调度也会在一个共享的 package/image 准备步骤之后，将多个选中的运行道拆分为并行作业，并且内置渠道更新运行道会针对临时 npm 网络失败重试一次。

本地变更运行道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁对架构边界的要求比广泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试类型检查以及核心 lint/guard；仅核心测试变更只运行核心测试类型检查以及核心 lint；插件生产变更会运行插件生产和插件测试类型检查以及插件 lint；仅插件测试变更会运行插件测试类型检查以及插件 lint。公开的插件 SDK 或插件契约变更会扩展到插件类型检查，因为插件依赖这些核心契约，但 Vitest 插件扫测属于显式测试工作。仅发布元数据的版本号提升会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会安全回退到所有检查运行道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且
有意比 `check:changed` 更轻量：直接测试编辑会运行自身，
源代码编辑优先使用显式映射，然后是同级测试和导入图
依赖项。共享群组房间投递配置是显式映射之一：
对群组可见回复配置、源回复投递模式或
消息工具系统提示词的变更，会路由到核心回复测试以及 Discord 和
Slack 投递回归测试，因此共享默认值变更会在第一次 PR
推送前失败。仅当变更覆盖整个 harness，导致轻量映射集合不是可信代理时，
才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为
广泛证明使用新预热的 box。在对一个被复用、已过期或
刚刚报告了意外大规模同步的 box 花费慢速门禁时间之前，请先在该
box 内运行 `pnpm testbox:sanity`。当必需的根文件（如
`pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个
已跟踪删除时，完整性检查会快速失败。这通常意味着远端同步状态不是 PR 的可信
副本。此时应停止该 box 并预热一个新的，而不是调试
产品测试失败。对于有意的大规模删除 PR，请为该完整性检查运行设置
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 调度会运行 `checks-node-compat-node22` 作为广泛兼容性覆盖。Android 对独立手动 CI 通过 `include_android=true` 可选启用，并且始终为 `Full Release Validation` 启用。`Plugin Prerelease` 是成本更高的产品/package 覆盖，因此它是一个单独的工作流，由 `Full Release Validation` 调度，或由操作员显式调度。普通 pull request、`main` 推送和独立手动 CI 调度会关闭该套件。

最慢的 Node 测试族会拆分或均衡，使每个作业保持较小规模而不预留过多 runner：渠道契约以三个加权分片运行，小型核心单元运行道成对运行，自动回复以四个均衡 worker 运行，并将回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置则分散到现有仅源代码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。`Plugin Prerelease` 会在八个插件 worker 之间均衡内置插件测试；这些插件分片作业一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node heap，因此导入密集型插件批次不会创建额外的 CI 作业。广泛的 agents 运行道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片拥有尾部耗时。包含模式分片会使用 CI 分片名称记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置和过滤后的分片。`check-additional` 将 package 边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界 guard 分片会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `dist/` 和 `dist-runtime/` 已经构建完成后，在 `build-artifacts` 内并发运行，保留它们旧的检查名称作为轻量验证作业，同时避免两个额外的 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试运行道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包作业。
当较新的推送落到同一个 PR 或 `main` ref 上时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已经被取代后继续排队。
自动 CI 并发键带版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸作业无法无限期阻塞较新的 main 运行。手动全套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## 运行器

| 运行器                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速协议/契约/内置检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片和聚合、Node 测试聚合验证器、文档检查、Python skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`、较低权重的插件分片、`checks-fast-core`、`checks-node-compat-node22`、`check-prod-types` 和 `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，使用 8 vCPU 的成本高于节省；install-smoke Docker 构建中，32-vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` 上的 `macos-node`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## 本地等效项

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

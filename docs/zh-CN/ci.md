---
read_when:
    - 你需要弄清楚 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控和本地命令等效项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-28T18:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a9bbdb7ac3d21f28c4b071bcb2979762b69ff99f308e0477cbf87e4d8812f2f
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域，在只有不相关区域变更时跳过昂贵作业。手动 `workflow_dispatch` 运行会有意绕过智能作用域，并为候选版本或广泛验证展开完整的常规 CI 图。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分派手动 `CI` 工作流，并分派 `OpenClaw Release Checks`，用于安装冒烟测试、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 通道。当提供已发布的包规范时，它也可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的 live/提供商覆盖广度：`minimum` 保留最快的 OpenAI/核心发布关键通道，`stable` 加入稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总控工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变绿，只需重新运行父验证器作业，以刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。对候选版本使用 `all`，仅对常规完整 CI 子项使用 `ci`，对所有发布子项使用 `release-checks`，或在总控工作流中使用更窄的发布分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这样可以在针对性修复后，将失败发布盒子的重新运行限制在有界范围内。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 将其作为命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样在保持相同文件覆盖的同时，也更容易重新运行和诊断较慢的 live 提供商失败。聚合分片名称 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 仍可用于手动一次性重新运行。

`OpenClaw Release Checks` 使用受信任的工作流引用将选定引用解析一次为 `release-package-under-test` tarball，然后将该构件传递给 live/E2E 发布路径 Docker 工作流和包验收分片。这样可以保持各发布盒子中的包字节一致，并避免在多个子作业中重复打包同一个候选包。

`Package Acceptance` 是用于验证包构件的旁路运行工作流，不会阻塞发布工作流。它会从已发布的 npm 规范、使用选定 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 构件中解析一个候选项，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，并使用该 tarball 而不是重新打包工作流检出内容。配置文件覆盖冒烟测试、包、产品、完整和自定义 Docker 通道选择。`package` 配置文件使用离线插件覆盖，因此已发布包验证不会受 live ClawHub 可用性限制。可选的 Telegram 通道会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 构件，并保留已发布 npm 规范路径以供独立分派使用。

## 包验收

当问题是“这个可安装的 OpenClaw 包是否能作为产品工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源码树，而包验收会通过用户安装或更新后实际使用的同一个 Docker E2E harness 验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。可复用工作流会下载该构件，验证 tarball 清单，在需要时准备包摘要 Docker 镜像，并针对该包运行选定的 Docker 通道，而不是打包工作流检出内容。当某个配置文件选择多个目标 `docker_lanes` 时，可复用工作流会先准备一次包和共享镜像，然后将这些通道展开为带唯一构件的并行目标 Docker 作业。
3. `package_telegram` 可选地调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行，并在 Package Acceptance 解析出包时安装同一个 `package-under-test` 构件；独立 Telegram 分派仍可安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 通道失败时使工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。将其用于已发布 beta/稳定版验收。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证选定提交可从仓库分支历史或发布标签到达，在分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享构件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源码提交。这让当前测试 harness 可以验证较旧的受信任源码提交，而不运行旧工作流逻辑。

配置文件映射到 Docker 覆盖：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会使用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件通道，而 Package Acceptance 针对同一个已解析包 tarball 保留构件原生的内置渠道兼容、离线插件和 Telegram 证明。跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包版和安装器全新安装通道还会验证已安装包可以从原始绝对 Windows 路径导入浏览器控制覆盖。

Package Acceptance 为已经发布的包设置了有界的旧版兼容窗口。到 `2026.4.25` 为止的包，包括 `2026.4.25-beta.*`，可以对 `dist/postinstall-inventory.json` 中指向 tarball 省略文件的已知私有 QA 条目使用兼容路径；当包未公开 `gateway install --wrapper` 标志时，`doctor-switch` 可以跳过持久化子用例；`update-channel-switch` 可以从 tarball 派生的假 git fixture 中删减缺失的 `pnpm.patchedDependencies`，并可以记录缺失的持久化 `update.channel`；插件冒烟测试可以读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；`plugin-update` 可以允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可以对已经发布的本地构建元数据戳文件发出警告。后续包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包验收运行时，先从 `resolve_package` 摘要开始，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或精确的 Docker 通道，而不是重新运行完整发布验证。

QA Lab 在主智能作用域工作流之外有专用 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更和手动分派时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动分派；它会将 mock parity gate、live Matrix 通道，以及 live Telegram 和 Discord 通道展开为并行作业。live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex 租约。Matrix 在计划任务和发布门禁中使用 `--profile fast`，并且仅在检出的 CLI 支持时添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分派始终将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 通道；其 QA parity gate 会将候选包和基线包作为并行通道作业运行，然后将两个构件下载到一个小型报告作业中，用于最终 parity 比较。不要把 PR 合并路径放在 `Parity gate` 后面，除非变更确实触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面。对于常规渠道、配置、文档或单元测试修复，将其视为可选信号，并遵循作用域化的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是供维护者手动运行的工作流，用于
落地后的重复项清理。它默认采用 dry-run，并且只有在 `apply=true` 时才会关闭明确
列出的 PR。在修改 GitHub 之前，它会验证已落地的 PR 已合并，并且每个重复项都具有共享的引用 issue
或重叠的变更 hunk。

`CodeQL` 工作流有意作为窄范围的第一轮安全扫描器，
而不是完整仓库扫描。每日运行和手动运行会扫描 Actions 工作流代码，
以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和
Gateway 网关相关表面，并使用高精度安全查询。

`CodeQL Android Critical Security` 工作流是定期运行的 Android
安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，
并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS
安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，
从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos` 类别下上传结果。请将它保留在每日
默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它
只在窄范围高价值表面上运行错误严重级别、非安全性的 JavaScript/TypeScript 质量查询。
它的基线作业会扫描与安全工作流相同的凭证、密钥、
沙箱、cron 和 Gateway 网关表面。config-boundary
作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO contract。
gateway-runtime-boundary 作业会在单独的
`/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法
contract。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary`
类别下扫描 loader、registry、公开表面和插件 SDK
入口点 contract。请将该工作流与安全工作流分离，这样质量发现就可以被
定时运行、衡量、禁用或扩展，而不会掩盖安全信号。
Swift、Python、UI 和内置插件的 CodeQL 扩展应仅在这些窄范围 profile
具有稳定的运行时间和信号后，再作为有范围或分片的后续工作加回。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护通道，用于让
现有文档与最近落地的变更保持一致。它没有纯定时计划：在 `main` 上成功完成的非 bot push CI 运行可以触发它，
手动 dispatch 也可以直接运行它。当 `main` 已经前进，或过去一小时内
已经创建了另一个未跳过的 Docs Agent 运行时，workflow-run 调用会跳过。运行时，它会
审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，
因此每小时一次的运行可以覆盖自上一次文档处理以来累计的所有 main 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，
用于处理慢测试。它没有纯定时计划：在 `main` 上成功完成的非 bot push CI 运行
可以触发它，但如果当天 UTC 已经有另一个 workflow-run 调用
运行过或正在运行，它会跳过。手动 dispatch 会绕过这个每日活动
门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex
只进行保留覆盖率的小型测试性能修复，而不是大范围
重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。
如果基线存在失败测试，Codex 只能修复明显的失败，并且 agent 之后的完整套件报告必须通过，
才会提交任何内容。当 `main` 在 bot push 落地前前进时，该通道
会 rebase 已验证的 patch，重新运行 `pnpm check:changed`，并重试 push；
有冲突的过期 patch 会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex
action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI manifest      | 始终在非 draft push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非 draft push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisory 对生产 lockfile 执行无依赖审计                             | 始终在非 draft push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合项                                                | 始终在非 draft push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、构建产物检查和可复用的下游产物          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件 contract/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片渠道 contract 检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-extensions`         | 覆盖插件套件的完整内置插件测试分片                                   | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不含渠道、内置、contract 和插件通道             | Node 相关变更              |
| `check`                          | 分片主本地门禁等价项：生产类型、lint、guard、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面 guard、package-boundary 和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 已构建产物渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布时手动 CI dispatch    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档变更                       |
| `skills-python`                  | Python 支持的 Skills 的 Ruff + pytest                                                       | Python Skill 相关变更      |
| `checks-windows`                 | Windows 特定进程/路径测试，以及共享运行时导入 specifier 回归测试         | Windows 相关变更           |
| `macos-node`                     | 使用共享构建产物的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 受信任活动后每日运行的 Codex 慢测试优化                                    | Main CI 成功或手动 dispatch |

手动 CI dispatch 运行与普通 CI 相同的作业图，但会强制启用每个
范围通道：Linux Node 分片、内置插件分片、渠道 contract、
Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、
Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行使用
唯一的并发组，因此候选发布完整套件不会被同一 ref 上的
另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任的
调用方在使用所选 dispatch ref 中工作流文件的同时，针对分支、标签或完整提交 SHA 运行该图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，使低成本检查先于高成本作业失败：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是该作业内部的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，不等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建就绪后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分派会跳过变更范围检测，并让预检清单表现得像每个限定范围都发生了变化。
CI 工作流编辑会验证 Node CI 图以及工作流 linting，但本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只限定于平台源代码变更。
仅 CI 路由编辑、选定的轻量核心测试 fixture 编辑，以及狭窄的插件契约 helper/test-routing 编辑会使用快速的仅 Node 清单路径：预检、安全性，以及单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接覆盖的路由或 helper 表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片，以及额外的 guard 矩阵。
Windows Node 检查限定于 Windows 专用 process/path 包装器、npm/pnpm/UI runner helper、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源代码、插件、install-smoke 和仅测试变更会留在 Linux Node 通道上，因此不会占用 16-vCPU Windows worker 去覆盖普通测试分片已经覆盖的内容。
独立的 `install-smoke` 工作流通过自己的 `preflight` job 复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。Pull request 会针对 Docker/package 表面、内置插件 package/manifest 变更，以及 Docker smoke job 覆盖的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源代码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证内置 extension build arg，并在 240 秒聚合命令超时内运行有边界的内置插件 Docker profile，同时每个场景的 Docker run 都单独设置上限。完整路径保留 QR package install 和 installer Docker/update 覆盖，用于夜间定时运行、手动分派、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的 pull request。`main` push，包括 merge commit，不会强制运行完整路径；当变更范围逻辑会在 push 上请求完整覆盖时，工作流会保留快速 Docker smoke，并将完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 由 `run_bun_global_install_smoke` 单独设门控；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分派可以选择加入，但 pull request 和 `main` push 不会运行它。QR 和 installer Docker 测试保留各自面向安装的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享 `scripts/e2e/Dockerfile` 镜像：一个用于 installer/update/plugin-dependency 通道的裸 Node/Git runner，以及一个将同一 tarball 安装到 `/app` 中、用于普通功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，planner 逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 按通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool 槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的 tail-pool 槽位数 10。重型通道上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，因此 npm install 和多服务通道不会让 Docker 超量提交，而较轻的通道仍会填满可用槽位。单个比有效上限更重的通道仍可从空池启动，然后独占运行，直到释放容量。通道启动默认错开 2 秒，以避免本地 Docker daemon create 风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或另一个毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，发出活动通道 Status，持久化通道耗时以用于最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在第一次失败后停止调度新的池化通道，并且每个通道都有 120 分钟兜底超时，可用 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live/tail 通道使用更严格的每通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道，例如 `install-e2e`，以及拆分的内置更新通道，例如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现某个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些 package、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会将该计划转换为 GitHub 输出和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载当前运行的 package 产物，要么从 `package_artifact_run_id` 下载 package 产物；验证 tarball inventory；当计划需要 package-installed 通道时，通过 Blacksmith 的 Docker layer cache 构建并推送带有 package digest tag 的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有 package-digest 镜像，而不是重新构建。`Package Acceptance` 工作流是高层 package 门禁：它从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前的工作流产物解析候选项，然后将这个单一 `package-under-test` 产物传入可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，因此当前 acceptance 逻辑可以验证较旧的受信任 commit，而无需 checkout 旧工作流代码。发布检查会针对目标 ref 运行自定义 Package Acceptance delta：内置渠道兼容性、离线插件 fixture，以及基于解析出的 tarball 的 Telegram package QA。发布路径 Docker 套件使用更小的分块 job，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取自己需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，它会被折叠进 `plugins-runtime-services`，并且仅针对 OpenWebUI-only 分派保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，因此 installer E2E 和内置插件 install/uninstall sweep 不会主导关键路径。`install-e2e` 通道别名仍是两个提供商 installer 通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的一体化 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每通道重跑命令。工作流 `docker_lanes` 输入会对准备好的镜像运行选中的通道，而不是运行分块 job，这会将失败通道调试限制在一个有针对性的 Docker job 内，并为该运行准备、下载或复用 package 产物；如果选中的通道是 live Docker 通道，则目标 job 会为该次重跑在本地构建 live-test 镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备的镜像输入，因此失败通道可以复用失败运行中的精确 package 和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub run 下载 Docker 产物，并打印合并的/每通道的目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢通道和阶段关键路径摘要。定时 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 Doctor 修复过程可以与其他内置检查一起分片。

当前发布 Docker 分块为 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍保留为聚合 plugin/runtime 别名，但发布工作流使用拆分分块，因此渠道 smoke、更新目标、插件运行时检查和内置插件 install/uninstall sweep 可以并行运行。目标 `docker_lanes` 分派也会在一个共享 package/image 准备步骤之后，将多个选中的通道拆分为并行 job，并且内置渠道更新通道会针对瞬时 npm 网络失败重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。该本地检查门禁比宽泛的 CI 平台范围更严格地对待架构边界：核心生产变更会运行核心 prod 和核心测试 typecheck 加核心 lint/guard，仅核心测试变更只运行核心测试 typecheck 加核心 lint，extension 生产变更会运行 extension prod 和 extension 测试 typecheck 加 extension lint，而仅 extension 测试变更会运行 extension 测试 typecheck 加 extension lint。公共插件 SDK 或插件契约变更会扩展到 extension typecheck，因为 extension 依赖这些核心契约，但 Vitest extension sweep 属于显式测试工作。仅发布元数据的版本 bump 会运行有针对性的 version/config/root-dependency 检查。未知 root/config 变更会 fail safe 到所有检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且有意比 `check:changed` 更轻量：直接测试编辑会运行自身，源代码编辑会优先使用显式映射，然后使用 sibling 测试和 import-graph 依赖项。共享 group-room delivery 配置是显式映射之一：对 group visible-reply 配置、源 reply delivery mode，或 message-tool system prompt 的变更会路由到核心 reply 测试以及 Discord 和 Slack delivery 回归测试，因此共享默认值变更会在第一次 PR push 之前失败。仅当变更足够 harness-wide，以至于廉价映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

对于 Testbox 验证，请从仓库根目录运行，并优先为广泛证明使用新预热的 box。在把慢速 gate 花在一个复用过、已过期或刚报告过异常大量同步的 box 上之前，先在 box 内运行 `pnpm testbox:sanity`。当 `pnpm-lock.yaml` 等必需根文件消失，或 `git status --short` 显示至少 200 个已跟踪删除项时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。请停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意的大规模删除 PR，请为该次完整性检查设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 调度会运行 `checks-node-compat-node22`，作为发布候选版本的兼容性覆盖。普通拉取请求和 `main` 推送会跳过该 lane，并让矩阵聚焦于 Node 24 测试/渠道 lane。

最慢的 Node 测试族已被拆分或均衡，使每个作业保持较小且不过度预留 runner：渠道 contract 以三个加权 shard 运行，内置插件测试在六个扩展 worker 之间均衡，小型核心单元 lane 会配对运行，自动回复以四个均衡 worker 运行，其中 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing shard，而 agentic Gateway 网关/插件配置会分布到现有仅源码 agentic Node 作业中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底项。扩展 shard 作业一次最多运行两个插件配置组，每组使用一个 Vitest worker 和更大的 Node 堆，这样导入繁重的插件批次不会创建额外的 CI 作业。广泛 agents lane 使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢速测试文件主导。`runtime-config` 与 infra core-runtime shard 一起运行，以免共享 runtime shard 承担尾部耗时。包含模式 shard 使用 CI shard 名称记录 timing 条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置和经过筛选的 shard。`check-additional` 将包边界编译/canary 工作放在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；boundary guard shard 会在一个作业内并发运行其小型独立 guard。Gateway 网关 watch、渠道测试和核心 support-boundary shard 会在 `dist/` 与 `dist-runtime/` 已构建完成后在 `build-artifacts` 内并发运行，保留它们旧有的检查名称作为轻量 verifier 作业，同时避免两个额外 Blacksmith worker 和第二条产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试 lane 仍会用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送中重复执行 debug APK 打包作业。
当同一 PR 或 `main` ref 上有较新的推送落地时，GitHub 可能会将被取代的作业标记为 `cancelled`。除非同一 ref 的最新运行也失败，否则将其视为 CI 噪声。聚合 shard 检查使用 `!cancelled() && always()`，因此它们仍会报告正常的 shard 失败，但不会在整个 workflow 已被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸项无法无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行的运行。

## Runners

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`，快速安全作业与聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`），快速协议/contract/内置检查，分片渠道 contract 检查，除 lint 外的 `check` shard，`check-additional` shard 与聚合，Node 测试聚合 verifier，文档检查，Python Skills，workflow-sanity，labeler，auto-response；install-smoke preflight 也使用 GitHub 托管 Ubuntu，以便 Blacksmith 矩阵更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试 shard、内置插件测试 shard、`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建中，32-vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
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

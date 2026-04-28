---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门禁和对应的本地命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-28T19:51:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2d0e70d04530bd524e5556b3e2e3349be5f109a61ec5044e907d4ed19379eb
    source_path: ci.md
    workflow: 16
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围限定，在只有不相关区域发生变更时跳过成本较高的作业。手动 `workflow_dispatch` 运行会有意绕过智能范围限定，并为发布候选版本或广泛验证展开完整的常规 CI 图。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，用该目标分派手动 `CI` 工作流，并分派 `OpenClaw Release Checks`，用于安装冒烟、包接受度验证、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram lane。提供已发布包规格时，它也可以运行发布后的 `NPM Telegram Beta E2E` 工作流。`release_profile=minimum|stable|full` 控制传入发布检查的 live/提供商覆盖范围：`minimum` 保留最快的 OpenAI/核心发布关键 lane，`stable` 添加稳定的提供商/后端集合，`full` 运行广泛的建议提供商/媒体矩阵。总控工作流会记录已分派的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行结论，并为每个子运行追加最慢作业表。如果某个子工作流重新运行后变为绿色，只需重新运行父级验证器作业，即可刷新总控结果和耗时摘要。

对于恢复，`Full Release Validation` 和 `OpenClaw Release Checks` 都接受 `rerun_group`。发布候选版本使用 `all`，仅常规完整 CI 子项使用 `ci`，每个发布子项使用 `release-checks`，也可以在总控工作流上使用更窄的发布分组：`install-smoke`、`cross-os`、`live-e2e`、`package`、`qa`、`qa-parity`、`qa-live` 或 `npm-telegram`。这能在完成聚焦修复后，将失败发布执行框的重新运行限制在有界范围内。

发布 live/E2E 子项保留广泛的原生 `pnpm test:live` 覆盖，但它通过 `scripts/test-live-shard.mjs` 以命名分片运行（`native-live-src-agents`、`native-live-src-gateway-core`、按提供商过滤的 `native-live-src-gateway-profiles` 作业、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z-other`、`native-live-extensions-xai`、拆分的媒体音频/视频分片，以及按提供商过滤的音乐分片），而不是一个串行作业。这样能保持相同的文件覆盖，同时让较慢的 live 提供商失败更容易重新运行和诊断。聚合的 `native-live-extensions-o-z`、`native-live-extensions-media` 和 `native-live-extensions-media-music` 分片名称仍然可用于手动一次性重新运行。

`OpenClaw Release Checks` 使用受信任的工作流引用，将所选引用解析一次为 `release-package-under-test` tarball，然后把该构件传给 live/E2E 发布路径 Docker 工作流和包接受度验证分片。这样能让发布执行框之间的包字节保持一致，并避免在多个子作业中重复打包同一个候选包。

`Package Acceptance` 是用于验证包构件且不阻塞发布工作流的旁路运行工作流。它从已发布 npm 规格、使用所选 `workflow_ref` harness 构建的受信任 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 构件中解析一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，并使用该 tarball 而不是重新打包工作流 checkout。配置文件覆盖 smoke、package、product、full 以及自定义 Docker lane 选择。`package` 配置文件使用离线插件覆盖，因此已发布包验证不会被 live ClawHub 可用性阻塞。可选的 Telegram lane 会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 构件，同时为独立分派保留已发布 npm 规格路径。

## 包接受度验证

当问题是“这个可安装的 OpenClaw 包是否能作为产品正常工作？”时，使用 `Package Acceptance`。它不同于常规 CI：常规 CI 验证源代码树，而包接受度验证会通过用户在安装或更新后实际使用的同一个 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` checkout `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 构件上传，并在 GitHub 步骤摘要中打印来源、工作流引用、包引用、版本、SHA-256 和配置文件。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。可复用工作流会下载该构件，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行所选 Docker lane，而不是打包工作流 checkout。当某个配置文件选择多个定向 `docker_lanes` 时，可复用工作流会准备一次包和共享镜像，然后将这些 lane 展开为具有唯一构件的并行定向 Docker 作业。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不是 `none` 时运行；如果 Package Acceptance 已解析出包，它会安装同一个 `package-under-test` 构件；独立 Telegram 分派仍可安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 接受度验证或可选 Telegram lane 失败时使工作流失败。

候选来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/stable 接受度验证。
- `source=ref`：打包受信任的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在 detached worktree 中安装依赖，并用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享的构件应提供。

保持 `workflow_ref` 和 `package_ref` 分离。`workflow_ref` 是运行测试的受信任工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这允许当前测试 harness 验证较旧的受信任源提交，而无需运行旧的工作流逻辑。

配置文件映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必需

发布检查会用 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块覆盖重叠的包/更新/插件 lane，而 Package Acceptance 针对同一个已解析包 tarball 保留构件原生的内置渠道兼容性、离线插件和 Telegram 证明。
Cross-OS 发布检查仍覆盖特定于 OS 的新手引导、安装器和平台行为；包/更新产品验证应从 Package Acceptance 开始。Windows 打包版和安装器全新安装 lane 也会验证已安装包是否能从原始绝对 Windows 路径导入浏览器控制覆盖。

Package Acceptance 对已发布包设有有界的旧版兼容窗口。直到 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）可对 `dist/postinstall-inventory.json` 中已知指向 tarball 省略文件的私有 QA 条目使用兼容路径；当包未暴露 `gateway install --wrapper` 标志时，`doctor-switch` 可跳过该持久化子用例；`update-channel-switch` 可从 tarball 派生的假 git fixture 中剪除缺失的 `pnpm.patchedDependencies`，也可记录缺失的持久化 `update.channel`；插件冒烟可读取旧版安装记录位置，或接受缺少 marketplace 安装记录持久化；`plugin-update` 可允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。已发布的 `2026.4.26` 包也可能对已经交付的本地构建元数据戳文件发出警告。之后的包必须满足现代契约；相同条件会失败，而不是警告或跳过。

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

调试失败的包接受度验证运行时，先查看 `resolve_package` 摘要，以确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 构件：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重新运行命令。优先重新运行失败的包配置文件或精确 Docker lane，而不是重新运行完整发布验证。

QA Lab 在主智能范围限定工作流之外有专用 CI lane。`Parity gate` 工作流会在匹配的 PR 变更和手动分派时运行；它构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流每晚在 `main` 上运行，也可手动分派；它将 mock parity gate、live Matrix lane，以及 live Telegram 和 Discord lane 展开为并行作业。live 作业使用 `qa-live-shared` 环境，Telegram/Discord 使用 Convex leases。Matrix 对计划和发布关口使用 `--profile fast`，并且只有在 checkout 出来的 CLI 支持时才添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分派始终将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab lane；其 QA parity gate 会将候选包和基线包作为并行 lane 作业运行，然后把两个构件下载到一个小型报告作业中，用于最终 parity 比较。
不要把 PR 合入路径放到 `Parity gate` 之后，除非变更确实触及 QA 运行时、模型包 parity，或 parity 工作流拥有的表面。对于常规渠道、配置、文档或单元测试修复，将其视为可选信号，并遵循限定范围的 CI/检查证据。

`Duplicate PRs After Merge` 工作流是用于合并后重复项清理的手动维护者工作流。它默认进行 dry-run，并且仅在 `apply=true` 时关闭明确列出的 PR。在修改 GitHub 前，它会验证已落地的 PR 已合并，并验证每个重复项要么有共享的引用 issue，要么有重叠的变更 hunk。

`CodeQL` 工作流有意作为范围较窄的第一轮安全扫描器，而不是完整仓库扫描。每日和手动运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关表面，并使用高精度安全查询。channel-runtime-boundary 作业会在 `/codeql-critical-security/channel-runtime-boundary` 类别下单独扫描核心渠道实现契约，以及渠道插件运行时、Gateway 网关、插件 SDK、密钥和审计触点，这样渠道安全信号就能扩展，而不需要扩大基线 JS/TS 类别。

`CodeQL Android Critical Security` 工作流是定时运行的 Android 安全分片。它会在 workflow sanity 接受的最小 Blacksmith Linux runner 标签上为 CodeQL 手动构建 Android 应用，并在 `/codeql-critical-security/android` 类别下上传结果。

`CodeQL macOS Critical Security` 工作流是每周/手动运行的 macOS 安全分片。它会在 Blacksmith macOS 上为 CodeQL 手动构建 macOS 应用，从上传的 SARIF 中过滤掉依赖构建结果，并在 `/codeql-critical-security/macos` 类别下上传结果。让它保持在每日默认工作流之外，因为即使结果干净，macOS 构建也会主导运行时间。

`CodeQL Critical Quality` 工作流是对应的非安全分片。它只在范围较窄的高价值表面上运行 error 严重级别的非安全 JavaScript/TypeScript 质量查询。它的基线作业会扫描与安全工作流相同的凭证、密钥、沙箱、cron 和 Gateway 网关表面。config-boundary 作业会在单独的 `/codeql-critical-quality/config-boundary` 类别下扫描配置 schema、迁移、规范化和 IO 契约。gateway-runtime-boundary 作业会在单独的 `/codeql-critical-quality/gateway-runtime-boundary` 类别下扫描 Gateway 网关协议 schema 和服务器方法契约。channel-runtime-boundary 作业会在单独的 `/codeql-critical-quality/channel-runtime-boundary` 类别下扫描核心渠道实现契约。plugin-boundary 作业会在单独的 `/codeql-critical-quality/plugin-boundary` 类别下扫描加载器、注册表、公共表面和插件 SDK 入口点契约。让该工作流与安全工作流分开，这样质量发现就可以被定时运行、衡量、禁用或扩展，而不会遮蔽安全信号。Swift、Python、UI 和内置插件的 CodeQL 扩展应只在窄配置文件具备稳定运行时间和信号后，作为有范围或分片的后续工作添加回来。

`Docs Agent` 工作流是事件驱动的 Codex 维护通道，用于让现有文档与最近落地的变更保持一致。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，手动 dispatch 也可以直接运行它。workflow-run 调用会在 `main` 已前进，或过去一小时内已创建另一个未跳过的 Docs Agent 运行时跳过。运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此一次每小时运行可以覆盖自上次文档处理以来累积的所有 main 变更。

`Test Performance Agent` 工作流是事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时计划：`main` 上成功的非机器人 push CI 运行可以触发它，但如果另一个 workflow-run 调用在该 UTC 日已经运行或正在运行，它会跳过。手动 dispatch 会绕过这个每日活动门禁。该通道会构建完整套件分组 Vitest 性能报告，让 Codex 只做保持覆盖率的小型测试性能修复，而不是大范围重构，然后重新运行完整套件报告，并拒绝会降低通过基线测试数量的变更。如果基线存在失败测试，Codex 只能修复明显的失败，并且 agent 之后的完整套件报告必须通过，才会提交任何内容。当 `main` 在机器人 push 落地前前进时，该通道会 rebase 已验证的补丁，重新运行 `pnpm check:changed`，并重试 push；冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，因此 Codex action 可以保持与 docs agent 相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                              | 目的                                                                                      | 运行时机                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | 检测仅文档变更、变更范围、变更插件，并构建 CI manifest      | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                        | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit`      | 针对 npm advisories 对无依赖生产 lockfile 进行审计                             | 始终在非草稿 push 和 PR 上运行 |
| `security-fast`                  | 快速安全作业的必需聚合结果                                                | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts`                | 构建 `dist/`、Control UI、已构建 artifact 检查，以及可复用的下游 artifact          | Node 相关变更              |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如内置/插件契约/协议检查                 | Node 相关变更              |
| `checks-fast-contracts-channels` | 分片渠道契约检查，并提供稳定的聚合检查结果                         | Node 相关变更              |
| `checks-node-extensions`         | 跨插件套件的完整内置插件测试分片                                   | Node 相关变更              |
| `checks-node-core-test`          | 核心 Node 测试分片，不包括渠道、内置、契约和插件通道             | Node 相关变更              |
| `check`                          | 分片主本地 gate 等价项：生产类型、lint、guard、测试类型和严格 smoke   | Node 相关变更              |
| `check-additional`               | 架构、边界、插件表面 guard、包边界和 gateway-watch 分片 | Node 相关变更              |
| `build-smoke`                    | 已构建 CLI smoke 测试和启动内存 smoke                                               | Node 相关变更              |
| `checks`                         | 已构建 artifact 渠道测试的验证器                                                    | Node 相关变更              |
| `checks-node-compat-node22`      | Node 22 兼容性构建和 smoke 通道                                                   | 发布用手动 CI dispatch    |
| `check-docs`                     | 文档格式、lint 和断链检查                                                | 文档已变更                       |
| `skills-python`                  | Python 支持的 Skills 的 Ruff + pytest                                                       | Python skill 相关变更      |
| `checks-windows`                 | Windows 特定的进程/路径测试，以及共享运行时 import specifier 回归         | Windows 相关变更           |
| `macos-node`                     | 使用共享已构建 artifact 的 macOS TypeScript 测试通道                                  | macOS 相关变更             |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                               | macOS 相关变更             |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一次 debug APK 构建                                 | Android 相关变更           |
| `test-performance-agent`         | 可信活动之后每日运行的 Codex 慢测试优化                                    | Main CI 成功或手动 dispatch |

手动 CI dispatch 会运行与普通 CI 相同的作业图，但会强制开启每个有范围的通道：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、build smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行会使用唯一的 concurrency group，因此候选发布版完整套件不会被同一 ref 上的另一个 push 或 PR 运行取消。可选的 `target_ref` 输入允许受信任调用者针对分支、标签或完整提交 SHA 运行该作业图，同时使用所选 dispatch ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业会按顺序排列，让廉价检查在昂贵检查运行前先失败：

1. `preflight` 决定到底存在哪些通道。`docs-scope` 和 `changed-scope` 逻辑是这个作业内的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不等待更重的 artifact 和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 通道重叠运行，因此下游消费者可以在共享构建准备好后立即开始。
4. 更重的平台和运行时通道随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
手动分发会跳过变更范围检测，并让预检清单
表现得像每个限定区域都发生了变更。
CI 工作流编辑会验证 Node CI 图以及工作流 linting，但它们本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台通道仍然限定于平台源码变更。
仅 CI 路由编辑、选定的低成本核心测试 fixture 编辑，以及窄范围的插件契约辅助/测试路由编辑会使用快速的仅 Node 清单路径：预检、安全检查和单个 `checks-fast-core` 任务。当变更文件仅限于该快速任务直接演练的路由或辅助表面时，该路径会避开构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片以及额外的防护矩阵。
Windows Node 检查限定于 Windows 专属的进程/路径包装器、npm/pnpm/UI runner 辅助、包管理器配置，以及执行该通道的 CI 工作流表面；无关源码、插件、install-smoke 和仅测试变更仍留在 Linux Node 通道上，因此它们不会为已经由常规测试分片覆盖的内容占用一个 16-vCPU Windows worker。
独立的 `install-smoke` 工作流通过自己的 `preflight` job 复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。拉取请求会对 Docker/包表面、内置插件包/清单变更，以及 Docker smoke job 会演练的核心插件/渠道/Gateway 网关/插件 SDK 表面运行快速路径。仅源码的内置插件变更、仅测试编辑和仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 gateway-network e2e，验证内置 extension 构建参数，并在 240 秒聚合命令超时内运行有界的内置插件 Docker profile，其中每个场景的 Docker run 都单独设限。完整路径保留 QR 包安装以及 installer Docker/update 覆盖，用于 nightly 计划运行、手动分发、workflow-call 发布检查，以及真正触及 installer/package/Docker 表面的拉取请求。`main` push（包括 merge commit）不会强制走完整路径；当变更范围逻辑会在 push 上请求完整覆盖时，工作流会保留快速 Docker smoke，并将完整 install smoke 留给 nightly 或发布验证。较慢的 Bun global install image-provider smoke 由 `run_bun_global_install_smoke` 单独设门；它会在 nightly 计划和发布检查工作流中运行，手动 `install-smoke` 分发可以选择加入它，但拉取请求和 `main` push 不会运行它。QR 和 installer Docker 测试保留各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个用于 installer/update/plugin-dependency 通道的裸 Node/Git runner，以及一个将同一个 tarball 安装到 `/app` 中、用于常规功能通道的功能镜像。Docker 通道定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划器逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选中的计划。调度器使用 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个通道选择镜像，然后使用 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行通道；用 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整默认 main-pool 槽位数 10，用 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整对提供商敏感的 tail-pool 槽位数 10。重型通道上限默认为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，这样 npm install 和多服务通道不会让 Docker 过载，同时较轻的通道仍会填满可用槽位。比有效上限更重的单个通道仍可从空池启动，然后独占运行直到释放容量。默认情况下，通道启动会错开 2 秒，以避免本地 Docker daemon 创建风暴；可使用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合会预检 Docker，移除陈旧的 OpenClaw E2E 容器，输出活跃通道状态，持久化通道耗时以按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，它会在首次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选中的 live/tail 通道使用更紧的每通道上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器通道，包括仅发布通道（例如 `install-e2e`）以及拆分的内置更新通道（例如 `bundled-channel-update-acpx`），同时跳过 cleanup smoke，以便智能体复现单个失败通道。可复用的 live/E2E 工作流会询问 `scripts/test-docker-all.mjs --plan-json` 需要哪些包、镜像类型、live 镜像、通道和凭证覆盖，然后 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它要么通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，要么下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball inventory；在计划需要已安装包通道时，通过 Blacksmith 的 Docker layer cache 构建并推送带包 digest 标签的 bare/functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或已有的包 digest 镜像，而不是重新构建。`Package Acceptance` 工作流是高级包门禁：它会从 npm、受信任的 `package_ref`、HTTPS tarball 加 SHA-256，或先前工作流产物解析候选包，然后将这个单一 `package-under-test` 产物传入可复用 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，因此当前验收逻辑可以验证较旧的受信任 commit，而无需检出旧工作流代码。发布检查会为目标 ref 运行自定义 Package Acceptance 增量：内置渠道兼容性、离线插件 fixture，以及针对已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件运行更小的分块 job，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取它需要的镜像类型，并通过同一个加权调度器执行多个通道（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`，`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-plugins|plugins-runtime-services|plugins-runtime-install-a|plugins-runtime-install-b|plugins-runtime-install-c|plugins-runtime-install-d|bundled-channels`）。当完整 release-path 覆盖请求 OpenWebUI 时，OpenWebUI 会并入 `plugins-runtime-services`，并且仅在只分发 OpenWebUI 时保留独立的 `openwebui` 分块。旧版聚合分块名称 `package-update`、`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分分块，这样 installer E2E 以及内置插件安装/卸载扫测不会主导关键路径。`install-e2e` 通道别名仍是两个提供商 installer 通道的聚合手动重跑别名。`bundled-channels` 分块运行拆分的 `bundled-channel-*` 和 `bundled-channel-update-*` 通道，而不是串行的全合一 `bundled-channel-deps` 通道。每个分块都会上传 `.artifacts/docker-tests/`，其中包含通道日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢通道表，以及每通道重跑命令。工作流 `docker_lanes` 输入会针对准备好的镜像运行选中通道，而不是分块 job，这会将失败通道调试限定为一个目标 Docker job，并为该运行准备、下载或复用包产物；如果选中的通道是 live Docker 通道，则目标 job 会为该重跑在本地构建 live-test 镜像。生成的每通道 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 和已准备镜像输入，因此失败通道可以复用失败运行中的精确包和镜像。使用 `pnpm test:docker:rerun <run-id>` 从 GitHub 运行下载 Docker 产物并打印组合/每通道目标重跑命令；使用 `pnpm test:docker:timings <summary.json>` 查看慢通道和阶段关键路径摘要。计划 live/E2E 工作流每天运行完整 release-path Docker 套件。内置更新矩阵按更新目标拆分，因此重复的 npm update 和 doctor 修复 pass 可以与其他内置检查分片运行。

当前发布 Docker 分块是 `core`、`package-update-openai`、`package-update-anthropic`、`package-update-core`、`plugins-runtime-plugins`、`plugins-runtime-services`、`plugins-runtime-install-a`、`plugins-runtime-install-b`、`plugins-runtime-install-c`、`plugins-runtime-install-d`、`bundled-channels-core`、`bundled-channels-update-a`、`bundled-channels-update-b` 和 `bundled-channels-contracts`。聚合 `bundled-channels` 分块仍可用于手动一次性重跑，`plugins-runtime-core`、`plugins-runtime` 和 `plugins-integrations` 仍是聚合插件/运行时别名，但发布工作流使用拆分分块，这样渠道 smoke、更新目标、插件运行时检查，以及内置插件安装/卸载扫测可以并行运行。目标 `docker_lanes` 分发也会在一次共享包/镜像准备步骤之后，将多个选中通道拆分成并行 job，并且内置渠道更新通道会针对瞬时 npm 网络故障重试一次。

本地变更通道逻辑位于 `scripts/changed-lanes.mjs`，并由 `scripts/check-changed.mjs` 执行。这个本地检查门禁在架构边界方面比宽泛的 CI 平台范围更严格：核心生产变更会运行核心生产和核心测试 typecheck 以及核心 lint/guard，核心仅测试变更只运行核心测试 typecheck 以及核心 lint，extension 生产变更会运行 extension 生产和 extension 测试 typecheck 以及 extension lint，extension 仅测试变更会运行 extension 测试 typecheck 以及 extension lint。公共插件 SDK 或插件契约变更会扩展到 extension typecheck，因为 extensions 依赖这些核心契约，但 Vitest extension 扫测属于显式测试工作。仅发布元数据的版本 bump 会运行目标版本/配置/根依赖检查。未知根/配置变更会安全失败到全部检查通道。
本地变更测试路由位于 `scripts/test-projects.test-support.mjs`，并且
有意比 `check:changed` 更低成本：直接测试编辑会运行自身，
源码编辑优先使用显式映射，然后是同级测试和导入图
依赖项。共享 group-room 投递配置是显式映射之一：
对群组可见回复配置、源码回复投递模式，或
message-tool 系统提示词的变更，会路由到核心回复测试以及 Discord 和
Slack 投递回归，因此共享默认值变更会在第一次 PR
push 之前失败。仅当变更的范围足够横跨整个 harness，导致低成本映射集合不是可信代理时，才使用 `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`。

Testbox 验证时，请从仓库根目录运行，并优先为广泛证明使用一个新预热的 box。在把慢速 gate 花在一个复用过、已过期或刚报告了异常大量同步内容的 box 上之前，先在该 box 内运行 `pnpm testbox:sanity`。当所需的根目录文件（例如 `pnpm-lock.yaml`）消失，或 `git status --short` 显示至少 200 个已跟踪删除项时，完整性检查会快速失败。这通常意味着远程同步状态不是 PR 的可信副本。停止该 box 并预热一个新的，而不是调试产品测试失败。对于有意进行大规模删除的 PR，请为该完整性检查运行设置 `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`。

手动 CI 调度会运行 `checks-node-compat-node22` 作为候选发布版本兼容性覆盖。普通拉取请求和 `main` 推送会跳过该通道，并让矩阵聚焦于 Node 24 测试/渠道通道。

最慢的 Node 测试族已拆分或均衡，使每个 job 保持较小规模而不过度预留 runner：渠道契约作为三个加权分片运行，内置插件测试在六个插件 worker 之间均衡，小型核心单元通道会成对运行，自动回复作为四个均衡 worker 运行，并把回复子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，agentic Gateway 网关/插件配置则分布在现有的仅源码 agentic Node job 中，而不是等待构建产物。广泛的浏览器、QA、媒体和杂项插件测试使用它们专用的 Vitest 配置，而不是共享的插件全量兜底。插件分片 job 一次最多运行两个插件配置组，每组一个 Vitest worker，并使用更大的 Node 堆，这样导入密集的插件批次不会创建额外 CI job。广泛的 agents 通道使用共享的 Vitest 文件并行调度器，因为它主要受导入/调度影响，而不是由单个慢速测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，避免共享运行时分片承担尾部耗时。包含模式分片会使用 CI 分片名记录计时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置与经过筛选的分片。`check-additional` 将 package 边界编译/canary 工作保持在一起，并将运行时拓扑架构与 Gateway 网关 watch 覆盖分开；边界保护分片会在一个 job 内并发运行其小型独立保护检查。Gateway 网关 watch、渠道测试和核心支持边界分片会在 `build-artifacts` 内于 `dist/` 和 `dist-runtime/` 构建完成后并发运行，保留它们旧有的检查名称作为轻量验证 job，同时避免两个额外 Blacksmith worker 和第二个产物消费队列。
Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关推送上重复执行 debug APK 打包 job。
当同一 PR 或 `main` ref 上有较新的推送落地时，GitHub 可能会将被取代的 job 标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个 workflow 已被取代后继续排队。
自动 CI 并发键带有版本号（`CI-v7-*`），因此 GitHub 端旧队列组中的僵尸任务无法无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行的运行。

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`，快速安全 job 和聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`），快速协议/契约/内置检查，分片渠道契约检查，除 lint 外的 `check` 分片，`check-additional` 分片和聚合，Node 测试聚合验证器，文档检查，Python Skills，workflow-sanity，labeler，auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，以便 Blacksmith 矩阵可以更早排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`，build-smoke，Linux Node 测试分片，内置插件测试分片，`android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它仍然对 CPU 足够敏感，使用 8 vCPU 的成本反而高于节省；install-smoke Docker 构建中，32-vCPU 的排队时间成本高于节省                                                                                                                                                                                                                                                                                                     |
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

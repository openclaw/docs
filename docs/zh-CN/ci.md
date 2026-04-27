---
read_when:
    - 你需要了解某个 CI 作业为何运行或未运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、作用域门控，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T19:38:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b6aef34b73f85ef7dae00d21cebfa7c560173dd7b979ca19829ea5290972047
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求上运行。它使用智能作用域划分，在仅有不相关区域变更时跳过昂贵作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能作用域，并展开完整的常规 CI 作业图，用于发布候选或大范围验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标分发手动 `CI` 工作流，并分发 `OpenClaw Release Checks`，以执行安装冒烟测试、包验收、Docker 发布路径套件、live/E2E、OpenWebUI、QA Lab 对等性、Matrix 和 Telegram 流水线。提供已发布的包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。这个总控工作流会记录已分发的子运行 ID，最终的 `Verify full validation` 作业会重新检查当前子运行的结论。如果某个子工作流被重新运行并变为绿色，只需重新运行父级验证器作业即可刷新总控结果。

发布 live/E2E 子工作流仍然保留广泛的原生 `pnpm test:live` 覆盖，但它不再作为一个串行作业运行，而是通过 `scripts/test-live-shard.mjs` 以具名分片形式运行（`native-live-src-agents`、`native-live-src-gateway-core`、`native-live-src-gateway-backends`、`native-live-test`、`native-live-extensions-a-k`、`native-live-extensions-l-n`、`native-live-extensions-openai`、`native-live-extensions-o-z` 和 `native-live-extensions-media`）。这样在保持相同文件覆盖率的同时，也让缓慢的 live provider 故障更容易重跑和诊断。

`Package Acceptance` 是一个侧运行工作流，用于验证包产物，而不会阻塞发布工作流。它可以从已发布的 npm 规格、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 产物中解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布/E2E 调度器，对这个 tarball 运行，而不是重新打包工作流检出内容。配置档覆盖 smoke、package、product、full，以及自定义 Docker 流水线选择。`package` 配置档使用离线插件覆盖，因此已发布包验证不会被 live ClawHub 可用性卡住。可选的 Telegram 流水线会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 产物，而单独分发时仍保留已发布 npm 规格路径。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为一个产品是否可用？”时，请使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证源代码树，而包验收则通过用户在安装或更新后实际经历的同一套 Docker E2E harness 来验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将二者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中输出来源、workflow ref、package ref、版本、SHA-256 和配置档。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 与 `package_artifact_name=package-under-test`。该可复用工作流会下载该产物、校验 tarball 清单、在需要时准备 package-digest Docker 镜像，并针对该包运行所选 Docker 流水线，而不是打包工作流检出内容。
3. `package_telegram` 会按需调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时它会运行；如果 Package Acceptance 已解析出一个包，它会安装同一个 `package-under-test` 产物；单独的 Telegram 分发仍可以安装已发布的 npm 规格。
4. `summary` 会在包解析、Docker 验收或可选 Telegram 流水线失败时使整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest` 或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta/稳定版验收。
- `source=ref`：打包一个可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支/标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 是可选的，但对于外部共享产物应当提供。

请将 `workflow_ref` 和 `package_ref` 区分开。`workflow_ref` 是运行测试所用的可信工作流/harness 代码。`package_ref` 是在 `source=ref` 时被打包的源码提交。这样，当前测试 harness 就可以验证较旧但可信的源码提交，而无需运行旧的工作流逻辑。

配置档与 Docker 覆盖的对应关系：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时为必填

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径 Docker 分块会覆盖重叠的包/更新/插件流水线，而 Package Acceptance 则会针对同一个已解析包 tarball，保留产物原生的 bundled-channel 兼容性、离线插件以及 Telegram 证明。
跨 OS 发布检查仍覆盖 OS 特定的新手引导、安装器和平台行为；而包/更新产品验证应从 Package Acceptance 开始。Windows 打包版和安装器全新安装流水线还会验证：已安装包是否可以从原始绝对 Windows 路径导入浏览器控制覆盖项。

Package Acceptance 对于截至 `2026.4.25`（包括 `2026.4.25-beta.*`）的已发布包，提供了一个有界的旧版兼容窗口。这里记录这些放宽规则，是为了避免它们变成永久性的静默跳过：如果 tarball 省略了已知私有 QA 条目，`dist/postinstall-inventory.json` 中的相关项可能会发出警告；如果包未暴露该标志，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可能会从 tarball 派生的伪 git 夹具中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺失的 marketplace 安装记录持久化；并且 `plugin-update` 可能允许配置元数据迁移，同时仍要求安装记录和不重新安装行为保持不变。`2026.4.25` 之后的包必须满足现代契约；相同条件将不再警告或跳过，而是直接失败。

示例：

```bash
# 使用产品级覆盖验证当前 beta 包。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# 使用当前 harness 打包并验证一个发布分支。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# 验证一个 tarball URL。对于 source=url，SHA-256 是必填项。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# 复用另一个 Actions 运行上传的 tarball。
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、流水线日志、阶段耗时以及重跑命令。优先重跑失败的包配置档或精确的 Docker 流水线，而不是重跑整个发布验证。

QA Lab 在主智能作用域工作流之外有专门的 CI 流水线。`Parity gate` 工作流会在匹配的 PR 变更和手动分发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic packs。`QA-Lab - All Lanes` 工作流会在 `main` 上按夜间计划运行，也可手动分发；它会将模拟 parity gate、live Matrix 流水线，以及 live Telegram 和 Discord 流水线作为并行作业展开。live 作业使用 `qa-live-shared` 环境，而 Telegram/Discord 使用 Convex 租约。Matrix 在计划运行和发布门禁中使用 `--profile fast`，仅当检出的 CLI 支持时才额外添加 `--fail-fast`。CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 分发总会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab 流水线。

`Duplicate PRs After Merge` 工作流是一个手动维护者工作流，用于合并后的重复项清理。它默认以 dry-run 模式运行，只有当 `apply=true` 时才会关闭明确列出的 PR。在修改 GitHub 之前，它会验证已落地 PR 确实已合并，并确认每个重复 PR 要么共享被引用的问题，要么具有重叠的变更块。

`CodeQL` 工作流有意作为一个窄范围的首轮扫描器，而不是覆盖整个仓库的全面扫描。每日运行和手动运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript/TypeScript 凭证、密钥、沙箱隔离、cron 和 Gateway 网关 相关区域。关键安全流水线在这些窄范围 JavaScript/TypeScript 区域上运行高精度安全查询，而独立的关键质量流水线则只运行错误严重级别的非安全查询。Swift、Android、Python、UI 和内置插件的 CodeQL 扩展，应仅在这一窄配置具有稳定运行时间和有效信号之后，再作为具有限定范围或分片的后续工作重新加入。

`Docs Agent` 工作流是一个由事件驱动的 Codex 维护流水线，用于让现有文档与最近落地的变更保持一致。它没有纯计划触发：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动分发也可以直接运行它。工作流运行触发的调用会在以下情况下跳过：`main` 已继续前进，或过去一小时内已经创建了另一个未被跳过的 Docs Agent 运行。真正运行时，它会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时一次的运行即可覆盖自上次文档处理以来积累的所有 main 变更。

`Test Performance Agent` 工作流是一个由事件驱动的 Codex 维护流水线，用于处理慢速测试。它没有纯计划触发：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当天 UTC 已经有另一个由 workflow-run 触发的实例运行过或正在运行，它就会跳过。手动分发会绕过这个每日活动门控。该流水线会构建一个完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围、保持覆盖率不变的测试性能修复，而不是进行大规模重构；然后重新运行完整测试套件报告，并拒绝会降低通过基线测试数量的更改。如果基线中存在失败测试，Codex 只能修复明显的失败；并且在提交任何内容之前，agent 运行后的完整测试套件报告必须通过。当机器人推送落地前 `main` 已前进时，该流水线会对已验证补丁执行变基，重新运行 `pnpm check:changed`，并重试推送；存在冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与 docs agent 保持相同的 drop-sudo 安全姿态。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 何时运行 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅有文档变更、变更作用域、变更扩展，并构建 CI 清单 | 始终在非草稿 push 和 PR 上运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-dependency-audit` | 针对 npm 漏洞进行无依赖的生产 lockfile 审计 | 始终在非草稿 push 和 PR 上运行 |
| `security-fast` | 快速安全作业所需的聚合作业 | 始终在非草稿 push 和 PR 上运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物 | 与 Node 相关的变更 |
| `checks-fast-core` | 快速 Linux 正确性流水线，例如 bundled/plugin-contract/protocol 检查 | 与 Node 相关的变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，带有稳定的聚合检查结果 | 与 Node 相关的变更 |
| `checks-node-extensions` | 覆盖整个扩展套件的完整内置插件测试分片 | 与 Node 相关的变更 |
| `checks-node-core-test` | Core Node 测试分片，不包括渠道、内置、契约和扩展流水线 | 与 Node 相关的变更 |
| `check` | 分片后的主要本地门禁等效项：生产类型、lint、守卫、测试类型和严格冒烟测试 | 与 Node 相关的变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界和 gateway-watch 分片 | 与 Node 相关的变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | 与 Node 相关的变更 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟流水线 | 用于发布的手动 CI 分发 |
| `check-docs` | 文档格式、lint 和失效链接检查 | 文档发生变更 |
| `skills-python` | Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的变更 |
| `checks-windows` | Windows 特定的进程/路径测试，以及共享运行时导入说明符回归测试 | 与 Windows 相关的变更 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试流水线 | 与 macOS 相关的变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的变更 |
| `android` | 两个 flavor 的 Android 单元测试外加一个 debug APK 构建 | 与 Android 相关的变更 |
| `test-performance-agent` | 在可信活动之后每日执行的 Codex 慢测试优化 | 主 CI 成功后或手动分发 |

手动 CI 分发运行与常规 CI 相同的作业图，但会强制开启所有作用域流水线：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟测试、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此发布候选的完整套件不会因同一 ref 上的另一个 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方针对某个分支、标签或完整提交 SHA 运行该作业图，同时使用所选分发 ref 中的工作流文件。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便廉价检查先失败，再决定是否运行昂贵作业：

1. `preflight` 决定到底有哪些流水线存在。`docs-scope` 和 `changed-scope` 逻辑是该作业内的步骤，不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux 流水线并行，以便下游消费者在共享构建就绪后立即开始。
4. 更重的平台和运行时流水线随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动分发会跳过 changed-scope 检测，并让 preflight 清单表现得像是每个受作用域控制的区域都发生了变更。
CI 工作流编辑会验证 Node CI 作业图和工作流 lint，但不会仅因这些编辑就强制运行 Windows、Android 或 macOS 原生构建；这些平台流水线仍然只对平台源码变更生效。
仅涉及 CI 路由的编辑、选定的廉价 core-test fixture 编辑，以及狭义的插件契约辅助函数/测试路由编辑，会走一个快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。该路径会跳过构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片和附加守卫矩阵，前提是变更文件仅限于该快速任务可直接覆盖的路由或辅助表面。
Windows Node 检查仅作用于 Windows 特定的进程/路径包装器、npm/pnpm/UI 运行器辅助函数、包管理器配置，以及执行该流水线的 CI 工作流表面；不相关的源码、插件、安装冒烟测试和纯测试变更会保留在 Linux Node 流水线上，这样就不会为正常测试分片已覆盖的内容占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流通过自己的 `preflight` 作业复用同一个作用域脚本。它将冒烟覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker/包表面、内置插件包/manifest 变更，以及 Docker 冒烟作业覆盖到的 core 插件/渠道/Gateway 网关/插件 SDK 表面，会运行快速路径。仅源码的内置插件变更、纯测试编辑和纯文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI 冒烟测试，运行容器化 gateway-network e2e，验证一个内置扩展 build arg，并在 240 秒的总命令超时限制下运行有界的内置插件 Docker 配置，同时每个场景的 Docker run 也分别有限制。完整路径会保留 QR 包安装以及安装器 Docker/更新覆盖，用于夜间计划运行、手动分发、workflow-call 发布检查，以及真正触及安装器/包/Docker 表面的拉取请求。`main` 推送（包括 merge commit）不会强制走完整路径；当 changed-scope 逻辑在 push 上本应请求完整覆盖时，该工作流仍然只保留快速 Docker 冒烟测试，而将完整安装冒烟测试留给夜间运行或发布验证。较慢的 Bun 全局安装 image-provider 冒烟测试由单独的 `run_bun_global_install_smoke` 控制；它会在夜间计划和发布检查工作流中运行，手动 `install-smoke` 分发也可以选择启用它，但拉取请求和 `main` 推送不会运行它。QR 和安装器 Docker 测试保留它们各自以安装为重点的 Dockerfile。本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 一次性打包为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于安装器/更新/插件依赖流水线的裸 Node/Git 运行器，另一个是功能型镜像，会将同一个 tarball 安装到 `/app` 中，供常规功能流水线使用。Docker 流水线定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，而运行器仅执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个流水线选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行各流水线；主池默认槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；provider 敏感的尾池默认槽位数也是 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。较重流水线的默认上限分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm 安装和多服务流水线让 Docker 过度超配，同时较轻的流水线仍可填满可用槽位。即使单个流水线重于当前有效上限，只要池为空，它仍可启动，然后独占运行直到释放容量。默认情况下，各流水线启动会错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行在预检查阶段会检查 Docker、移除过期的 OpenClaw E2E 容器、输出活动流水线状态、持久化流水线耗时以便最长优先排序，并支持通过 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 检查调度器。默认情况下，它会在首次失败后停止调度新的池化流水线；每个流水线都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；部分选定的 live/tail 流水线使用更严格的单流水线上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 会运行精确的调度器流水线，包括诸如 `install-e2e` 这类仅发布时使用的流水线，以及像 `bundled-channel-update-acpx` 这样拆分的内置更新流水线，同时跳过清理冒烟测试，以便智能体复现某一条失败流水线。可复用的 live/E2E 工作流会先询问 `scripts/test-docker-all.mjs --plan-json`：需要哪个包、哪种镜像类型、哪个 live 镜像、哪条流水线以及哪类凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它会通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw，或下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要安装包的流水线时，通过 Blacksmith 的 Docker layer cache 构建并推送带 package-digest 标签的 bare/functional GHCR Docker E2E 镜像；并在可用时复用提供的 `docker_e2e_bare_image`/`docker_e2e_functional_image` 输入或现有的 package-digest 镜像，而不是重新构建。`Package Acceptance` 工作流是高级别的包门禁：它会从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流的产物中解析一个候选包，然后将这个单一的 `package-under-test` 产物传入可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分离，这样当前的验收逻辑就可以在不检出旧工作流代码的情况下验证较旧但可信的提交。发布检查会针对目标 ref 运行自定义的 Package Acceptance 增量：内置渠道兼容性、离线插件 fixtures，以及基于已解析 tarball 的 Telegram 包 QA。发布路径 Docker 套件会以较小的分块作业运行，并使用 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只会拉取所需的镜像类型，并通过同一个加权调度器执行多条流水线（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update-openai|package-update-anthropic|package-update-core|plugins-runtime-core|plugins-runtime-install-a|plugins-runtime-install-b|bundled-channels`）。当完整发布路径覆盖请求 OpenWebUI 时，它会并入 `plugins-runtime-core`，仅在只调度 OpenWebUI 的情况下保留单独的 `openwebui` 分块。旧的聚合分块名称 `package-update`、`plugins-runtime` 和 `plugins-integrations` 仍可用于手动重跑，但发布工作流使用拆分后的分块，因此安装器 E2E 和内置插件安装/卸载全量扫描不会主导关键路径。`install-e2e` 流水线别名仍然是两个 provider 安装器流水线的聚合手动重跑别名。`bundled-channels` 分块运行的是拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 流水线，而不是串行的一体化 `bundled-channel-deps` 流水线。每个分块都会上传 `.artifacts/docker-tests/`，其中包含流水线日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢流水线表，以及每条流水线的重跑命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行选定流水线，而不是运行分块作业；这样可以将失败流水线的调试限制在一个定向 Docker 作业内，并为该次运行准备、下载或复用包产物；如果选定的流水线是 live Docker 流水线，该定向作业会在本地为该次重跑构建 live-test 镜像。生成的每条流水线 GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 以及已准备镜像输入，因此失败流水线可以复用失败运行中的同一个包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从 GitHub 某次运行下载 Docker 产物，并打印组合式/逐流水线的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可生成慢流水线和阶段关键路径摘要。计划中的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 doctor 修复过程能够与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。该本地检查门禁在架构边界方面比广义的 CI 平台作用域更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint/guards；core 纯测试变更只运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展纯测试变更只运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或插件契约变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 扩展全量扫描属于显式测试工作。仅发布元数据的版本号提升会运行定向的版本/配置/根依赖检查。未知的根目录/配置变更会以安全优先方式退回到所有检查流水线。

手动 CI 分发会将 `checks-node-compat-node22` 作为发布候选兼容性覆盖来运行。常规拉取请求和 `main` 推送会跳过该流水线，并让矩阵聚焦于 Node 24 测试/渠道流水线。

最慢的 Node 测试族已被拆分或重新平衡，因此每个作业都能保持较小规模，同时避免过度预留 runner：渠道契约以三个加权分片运行，内置插件测试在六个扩展 worker 之间平衡分配，小型 core 单元流水线成对组合，自动回复以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands/state-routing 分片，而 agentic Gateway 网关/插件配置则分散到现有的仅源码 agentic Node 作业中执行，而不是等待已构建产物。宽范围的 browser、QA、media 以及杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两个插件配置组，每组使用一个 Vitest worker，并配备更大的 Node 堆，以避免导入密集型的插件批次产生额外的 CI 作业。宽范围的 agents 流水线使用共享的 Vitest 文件级并行调度器，因为它主要受导入/调度支配，而不是由某一个慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享运行时分片成为尾部瓶颈。include-pattern 分片会使用 CI 分片名记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与某个过滤分片。`check-additional` 将 package-boundary 的 compile/canary 工作保持在一起，并将运行时拓扑架构与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内并发运行其较小且相互独立的守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已经构建完成之后，在 `build-artifacts` 内并发运行；这样既保留了它们原有的检查名称作为轻量验证器作业，又避免了额外占用两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试流水线仍会使用 SMS/通话记录 BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行一次 debug APK 打包作业。

当同一 PR 或 `main` ref 上有新的 push 到达时，GitHub 可能会将已被替代的作业标记为 `cancelled`。除非同一 ref 的最新运行也在失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但在整个工作流已经被替代后不会继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 main 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合作业、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建也是如此，因为 32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门禁：按边界流水线运行 changed typecheck/lint/guards
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门禁，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 廉价的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 失效链接
pnpm build          # 当 CI 产物/build-smoke 流水线相关时构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue/comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

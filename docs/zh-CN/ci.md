---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行。
    - 你正在调试失败的 GitHub Actions 检查。
summary: CI 作业图、范围门控以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T18:46:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03474ce26947efd5e63870ef78b8b88a26db4743939145394de2b5682f105635
    source_path: ci.md
    workflow: 15
---

CI 会在每次向 `main` 推送以及每个拉取请求时运行。它使用智能范围判定，在只改动了不相关区域时跳过昂贵的作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围判定，并展开完整的常规 CI 作业图，用于候选发布或大范围验证。

`Full Release Validation` 是用于“发布前运行所有内容”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks`，以运行安装冒烟测试、包验收、Docker 发布路径测试套件、live/E2E、OpenWebUI、QA Lab parity、Matrix 和 Telegram 流水线。它还可以在提供已发布的包规范时运行发布后的 `NPM Telegram Beta E2E` 工作流。这个总控工作流会记录已触发的子运行 id，而最终的 `Verify full validation` 作业会重新检查当前子运行的结论。如果某个子工作流被重新运行后变为绿色，只需重新运行父级验证作业即可刷新总控结果。

发布用的 live/E2E 子流程仍然保留广泛的原生 `pnpm test:live` 覆盖，但它不是作为一个串行作业运行，而是通过 `scripts/test-live-shard.mjs` 按命名分片运行（`native-live-src-agents`、`native-live-src-gateway`、`native-live-test`、`native-live-extensions-a-k` 和 `native-live-extensions-l-z`）。这样可以保持相同的文件覆盖范围，同时让缓慢的 live provider 故障更容易重跑和诊断。

`Package Acceptance` 是一个侧边运行的工作流，用于验证包制品，而不会阻塞发布工作流。它从已发布的 npm 规范、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自另一个 GitHub Actions 运行的 tarball 制品中解析一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，并对该 tarball 进行测试，而不是重新打包工作流检出的内容。可用配置涵盖 smoke、package、product、full 以及自定义 Docker 流水线选择。`package` 配置使用离线插件覆盖，因此已发布包的验证不会被 live ClawHub 可用性所阻塞。可选的 Telegram 流水线会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 制品，而已发布的 npm 规范路径仍保留给独立触发场景使用。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，请使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证的是源码树，而包验收验证的是单个 tarball，并通过用户在安装或更新后实际经历的同一套 Docker E2E harness 来完成。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析一个包候选项，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者一起上传为 `package-under-test` 制品，并在 GitHub 步骤摘要中输出来源、workflow ref、package ref、版本、SHA-256 和配置。
2. `docker_acceptance` 调用 `openclaw-live-and-e2e-checks-reusable.yml`，并传入 `ref=workflow_ref` 和 `package_artifact_name=package-under-test`。该可复用工作流会下载该制品，验证 tarball 清单，在需要时准备 package-digest Docker 镜像，并针对该包运行所选 Docker 流水线，而不是打包工作流检出的内容。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时它会运行；如果 Package Acceptance 已解析出包，它会安装相同的 `package-under-test` 制品；独立触发的 Telegram 运行仍然可以安装已发布的 npm 规范。
4. `summary` 会在包解析、Docker 验收或可选的 Telegram 流水线失败时使整个工作流失败。

候选包来源：

- `source=npm`：只接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 的验收。
- `source=ref`：打包一个可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在一个分离的工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载一个 HTTPS `.tgz`；此时 `package_sha256` 为必填。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享的制品应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流 / harness 代码。`package_ref` 是当 `source=ref` 时实际被打包的源提交。这样一来，当前测试 harness 就可以验证较旧但可信的源提交，而无需运行旧的工作流逻辑。

配置与 Docker 覆盖的映射关系如下：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 外加 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：带 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确指定 `docker_lanes`；当 `suite_profile=custom` 时必填

发布检查会以如下参数调用 Package Acceptance：`source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'`，以及 `telegram_mode=mock-openai`。发布路径 Docker 分块覆盖了重叠的 package / update / plugin 流水线，而 Package Acceptance 则会针对同一个已解析的包 tarball 保留制品原生的 bundled-channel compat、离线插件以及 Telegram 验证。Cross-OS 发布检查仍然覆盖特定于操作系统的新手引导、安装器和平台行为；包 / 更新的产品验证应当从 Package Acceptance 开始。Windows 打包版和安装器 fresh 流水线还会验证已安装包是否可以从原始绝对 Windows 路径导入 browser-control override。

Package Acceptance 对于截至 `2026.4.25`（包括 `2026.4.25-beta.*`）的已发布包提供了一个有边界的旧版兼容窗口。这里记录这些例外，是为了避免它们变成永久性的静默跳过：如果 tarball 缺少这些文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；如果包未暴露该标志，`doctor-switch` 可能跳过 `gateway install --wrapper` 持久化子场景；`update-channel-switch` 可能会从基于 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并且可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版安装记录位置，或接受缺少 marketplace 安装记录持久化；而 `plugin-update` 可能允许配置元数据迁移，但仍要求安装记录和 no-reinstall 行为保持不变。`2026.4.25` 之后的包必须满足现代契约；相同条件将会失败，而不再是警告或跳过。

示例：

```bash
# 以产品级覆盖验证当前 beta 包。
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

# 验证一个 tarball URL。对于 source=url，SHA-256 为必填。
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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 制品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、流水线日志、阶段耗时以及重跑命令。优先重跑失败的包配置或精确的 Docker 流水线，而不是重跑完整发布验证。

QA Lab 在主智能范围工作流之外有专门的 CI 流水线。`Parity gate` 工作流会在匹配的 PR 改动和手动触发时运行；它会构建私有 QA 运行时，并比较 mock GPT-5.5 和 Opus 4.6 agentic 包。`QA-Lab - All Lanes` 工作流会在 `main` 上按夜间计划运行，也支持手动触发；它会将 mock parity gate、live Matrix 流水线，以及 live Telegram 和 Discord 流水线作为并行作业展开。live 作业使用 `qa-live-shared` 环境，而 Telegram / Discord 使用 Convex 租约。Matrix 在计划任务和发布门控中使用 `--profile fast`，并且只会在检出的 CLI 支持时额外加入 `--fail-fast`。CLI 默认值和手动工作流输入仍然是 `all`；手动以 `matrix_profile=all` 触发时，总是会将完整 Matrix 覆盖分片为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行对发布至关重要的 QA Lab 流水线。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复项清理。它默认是 dry-run，并且只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会先验证已落地的 PR 确实已合并，并且每个重复 PR 都具有共享的被引用 issue，或存在重叠的改动 hunk。

`CodeQL` 工作流有意设计为一个范围较窄的首轮扫描器，而不是整个仓库的完整扫描。每日和手动运行会扫描 Actions 工作流代码，以及风险最高的 JavaScript / TypeScript 凭证、密钥、沙箱、cron 和 Gateway 网关 相关区域。关键安全流水线使用高精度安全查询，而独立的关键质量流水线只针对同一狭窄的 JavaScript / TypeScript 范围运行错误级别的非安全查询。Swift、Android、Python、UI 和内置插件的 CodeQL 扩展，应在这个窄范围配置获得稳定的运行时间和信噪比之后，再作为带范围限制或分片的后续工作添加回来。

`Docs Agent` 工作流是一个由事件驱动的 Codex 维护流水线，用于让现有文档与最近已落地的变更保持一致。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，手动触发也可以直接运行它。对于 workflow-run 触发，当 `main` 已继续前进，或过去一小时内已经创建过另一个未被跳过的 Docs Agent 运行时，它会跳过。当它运行时，它会审查从上一次未被跳过的 Docs Agent 源 SHA 到当前 `main` 之间的提交范围，因此每小时一次的运行可以覆盖自上次文档处理以来累计到 `main` 的所有变更。

`Test Performance Agent` 工作流是一个由事件驱动的 Codex 维护流水线，用于处理缓慢测试。它没有纯定时调度：`main` 上一次成功的、非机器人触发的 push CI 运行可以触发它，但如果当日 UTC 已经有另一个由 workflow-run 触发的调用已经运行过或正在运行，它就会跳过。手动触发会绕过这个按日活动门控。该流水线会构建一份完整测试套件的分组 Vitest 性能报告，让 Codex 只进行小范围、保持覆盖率不变的测试性能修复，而不是做大范围重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显的失败项，并且 agent 处理后的完整测试套件报告必须通过，之后才会提交任何内容。当机器人推送落地前 `main` 已继续前进时，该流水线会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；发生冲突的过期补丁会被跳过。它使用 GitHub 托管的 Ubuntu，这样 Codex action 就可以与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| --- | --- | --- |
| `preflight` | 检测是否仅改动文档、已变更范围、已变更扩展，并构建 CI 清单 | 所有非 draft 的 push 和 PR |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 所有非 draft 的 push 和 PR |
| `security-dependency-audit` | 针对 npm advisories 进行无需依赖安装的生产 lockfile 审计 | 所有非 draft 的 push 和 PR |
| `security-fast` | 快速安全作业的必需聚合作业 | 所有非 draft 的 push 和 PR |
| `build-artifacts` | 构建 `dist/`、Control UI、构建产物检查，以及供下游复用的产物 | 与 Node 相关的改动 |
| `checks-fast-core` | 快速 Linux 正确性流水线，例如 bundled / plugin-contract / protocol 检查 | 与 Node 相关的改动 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | 与 Node 相关的改动 |
| `checks-node-extensions` | 针对整个扩展套件的完整内置插件测试分片 | 与 Node 相关的改动 |
| `checks-node-core-test` | 核心 Node 测试分片，不包括渠道、内置、契约和扩展流水线 | 与 Node 相关的改动 |
| `check` | 分片后的主本地门控等效项：生产类型、lint、守卫、测试类型和严格 smoke | 与 Node 相关的改动 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | 与 Node 相关的改动 |
| `build-smoke` | 已构建 CLI 的 smoke 测试和启动内存 smoke | 与 Node 相关的改动 |
| `checks` | 已构建产物渠道测试的验证器 | 与 Node 相关的改动 |
| `checks-node-compat-node22` | Node 22 兼容性构建和 smoke 流水线 | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式、lint 和坏链检查 | 文档发生改动时 |
| `skills-python` | 面向 Python 支持的 Skills 的 Ruff + pytest | 与 Python Skills 相关的改动 |
| `checks-windows` | Windows 特定的进程 / 路径测试，以及共享运行时导入说明符回归测试 | 与 Windows 相关的改动 |
| `macos-node` | 使用共享构建产物的 macOS TypeScript 测试流水线 | 与 macOS 相关的改动 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | 与 macOS 相关的改动 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | 与 Android 相关的改动 |
| `test-performance-agent` | 在可信活动之后每日执行的 Codex 慢测试优化 | 主 CI 成功后或手动触发 |

手动触发的 CI 会运行与常规 CI 相同的作业图，但会强制开启所有带范围判定的流水线：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建 smoke、文档检查、Python Skills、Windows、macOS、Android 和 Control UI i18n。手动运行使用唯一的并发组，因此同一 ref 上另一次 push 或 PR 运行不会取消候选发布的完整测试套件。可选的 `target_ref` 输入允许可信调用方在使用所选触发 ref 的工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业顺序经过安排，以便让廉价检查在昂贵作业运行之前先失败：

1. `preflight` 决定哪些流水线实际存在。`docs-scope` 和 `changed-scope` 逻辑是这个作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的构建产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 流水线并行执行，这样下游使用方可以在共享构建准备好后立即开始。
4. 随后再展开较重的平台和运行时流水线：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围判定逻辑位于 `scripts/ci-changed-scope.mjs`，其单元测试位于 `src/scripts/ci-changed-scope.test.ts`。
手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得如同每个带范围判定的区域都发生了改动。
CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但本身不会强制触发 Windows、Android 或 macOS 原生构建；这些平台流水线仍然只针对对应平台源码改动启用。
仅涉及 CI 路由的编辑、特定廉价核心测试 fixture 编辑，以及狭窄的插件契约辅助器 / 测试路由编辑，会使用快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当改动文件仅限于该快速任务可直接覆盖的路由或辅助表面时，这一路径会避免构建产物、Node 22 兼容性、渠道契约、完整核心分片、内置插件分片以及额外守卫矩阵。
Windows Node 检查的范围限定在 Windows 特定的进程 / 路径包装器、npm / pnpm / UI 运行器辅助器、包管理器配置，以及执行该流水线的 CI 工作流表面；不相关的源码、插件、install-smoke 和纯测试改动仍留在 Linux Node 流水线中，这样就不会为了已由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
独立的 `install-smoke` 工作流也通过其自身的 `preflight` 作业复用了同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，Docker / package 表面、内置插件包 / manifest 改动，以及 Docker smoke 作业所覆盖的核心插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，会运行快速路径。仅源码的内置插件改动、纯测试改动以及纯文档改动不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行 container gateway-network e2e，验证一个内置扩展 build arg，并在 240 秒的聚合命令超时限制下运行有界的内置插件 Docker 配置，同时对每个场景的 Docker 运行单独设限。完整路径则保留 QR package install 以及 installer Docker / update 覆盖，供夜间定时运行、手动触发、workflow-call 发布检查，以及真正触及 installer / package / Docker 表面的拉取请求使用。推送到 `main`（包括 merge commit）不会强制启用完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，该工作流仍保留快速 Docker smoke，并将完整 install smoke 留给夜间任务或发布验证。较慢的 Bun 全局安装 image-provider smoke 由单独的 `run_bun_global_install_smoke` 门控；它会在夜间定时任务和 release checks 工作流中运行，手动触发 `install-smoke` 时也可选择启用，但拉取请求和 `main` 推送不会运行它。QR 和 installer Docker 测试保留各自专用的、以安装为中心的 Dockerfile。本地 `test:docker:all` 会预先构建一个共享的 live-test 镜像，将 OpenClaw 仅打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是不安装产品、仅含 Node / Git 的基础运行器，用于 installer / update / plugin-dependency 流水线；另一个是功能镜像，会将同一个 tarball 安装到 `/app`，供常规功能流水线使用。Docker 流水线定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，运行器只执行所选计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个流水线选择镜像，然后在设置 `OPENCLAW_SKIP_DOCKER_BUILD=1` 的情况下运行各流水线；可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整主池默认 10 个槽位，并通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整 provider 敏感尾部池默认 10 个槽位。重型流水线的默认上限为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm 安装和多服务流水线过度占用 Docker，同时让较轻流水线仍能填满可用槽位。单个比有效上限更重的流水线仍可以在池为空时启动，然后独占运行直到释放容量。默认情况下，流水线启动会错开 2 秒，以避免本地 Docker daemon 出现 create 风暴；可用 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合流程会先对 Docker 做 preflight，移除陈旧的 OpenClaw E2E 容器，输出活跃流水线状态，持久化流水线耗时以便按最长优先排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 用于检查调度器。默认情况下，它会在首次失败后停止调度新的池化流水线；每个流水线都有一个 120 分钟的兜底超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；选定的 live / tail 流水线使用更严格的单流水线上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 可运行精确的调度器流水线，包括仅发布时使用的流水线（如 `install-e2e`）以及拆分后的内置更新流水线（如 `bundled-channel-update-acpx`），同时跳过 cleanup smoke，以便智能体复现单个失败流水线。可复用的 live / E2E 工作流会先询问 `scripts/test-docker-all.mjs --plan-json` 需要哪种 package、镜像类型、live 镜像、流水线和凭证覆盖，然后 `scripts/docker-e2e.mjs` 会把该计划转换为 GitHub outputs 和摘要。它可以通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包制品，或从 `package_artifact_run_id` 下载包制品；验证 tarball 清单；当计划需要安装 package 的流水线时，通过 Blacksmith 的 Docker 层缓存构建并推送带 package-digest 标签的 bare / functional GHCR Docker E2E 镜像；并复用提供的 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入，或现有的 package-digest 镜像，而不是重新构建。`Package Acceptance` 工作流是高层级的包门控：它从 npm、可信的 `package_ref`、带 SHA-256 的 HTTPS tarball，或先前工作流制品中解析一个候选项，然后将这个单独的 `package-under-test` 制品传给可复用的 Docker E2E 工作流。它会将 `workflow_ref` 与 `package_ref` 分开，以便当前的验收逻辑可以在不检出旧工作流代码的情况下验证较旧的可信提交。发布检查会针对目标 ref 运行一个自定义的 Package Acceptance 增量：针对已解析 tarball 的 bundled-channel compat、离线插件 fixture 以及 Telegram package QA。发布路径 Docker 套件运行四个分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，因此每个分块只拉取自身所需的镜像类型，并通过相同的加权调度器运行多个流水线（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-runtime|bundled-channels`）。当请求完整发布路径覆盖时，OpenWebUI 会并入 `plugins-runtime`，而仅在只触发 OpenWebUI 的场景中保留独立的 `openwebui` 分块。`package-update` 分块会将 installer E2E 拆分为 `install-e2e-openai` 和 `install-e2e-anthropic`；`install-e2e` 仍保留为手动重跑时使用的聚合别名。`bundled-channels` 分块会运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` 流水线，而不是串行的一体化 `bundled-channel-deps` 流水线；`plugins-integrations` 仍保留为手动重跑时的旧版聚合别名。每个分块都会上传 `.artifacts/docker-tests/`，其中包含流水线日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢流水线表以及每个流水线的重跑命令。工作流输入 `docker_lanes` 会针对准备好的镜像运行所选流水线，而不是运行那些分块作业；这样可将失败流水线的调试限制在一个有针对性的 Docker 作业中，并为该次运行准备、下载或复用包制品；如果所选流水线是 live Docker 流水线，该定向作业会为该次重跑在本地构建 live-test 镜像。生成的每流水线 GitHub 重跑命令在这些值存在时会包含 `package_artifact_run_id`、`package_artifact_name` 以及准备好的镜像输入，因此失败流水线可以复用失败运行中完全相同的包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可以下载某个 GitHub 运行的 Docker 制品，并打印组合 / 分流水线的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢流水线和阶段关键路径摘要。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 doctor repair 过程能够与其他内置检查一起分片运行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。该本地检查门控在架构边界方面比广义的 CI 平台范围更严格：核心生产改动会运行核心生产和核心测试 typecheck，以及核心 lint / guards；核心纯测试改动只运行核心测试 typecheck 和核心 lint；扩展生产改动会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展纯测试改动则运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或插件契约改动会扩展到扩展 typecheck，因为扩展依赖这些核心契约，但 Vitest 扩展全量测试属于显式测试工作。仅发布元数据的版本更新会运行定向的版本 / 配置 / 根依赖检查。未知的根目录 / 配置改动会以安全优先方式退回到所有检查流水线。

手动触发的 CI 会运行 `checks-node-compat-node22`，作为候选发布的兼容性覆盖。常规拉取请求和向 `main` 的推送会跳过该流水线，并让矩阵聚焦于 Node 24 测试 / 渠道流水线。

最慢的 Node 测试族已被拆分或重新平衡，因此每个作业都能保持较小规模，同时不会过度预留运行器：渠道契约分为三个加权分片，内置插件测试在六个扩展 worker 间平衡分配，小型核心单元流水线会成对组合，auto-reply 以四个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分散到现有的仅源码 agentic Node 作业中执行，而不是等待构建产物。广泛的 browser、QA、media 和杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组使用一个 Vitest worker，并分配更大的 Node heap，这样导入密集型插件批次就不会额外产生更多 CI 作业。广义 agents 流水线使用共享的 Vitest 文件级并行调度器，因为它受导入 / 调度主导，而不是被单个缓慢测试文件主导。`runtime-config` 与 infra core-runtime 分片一起运行，以避免共享 runtime 分片独占尾部时长。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分整个配置与过滤后的分片。`check-additional` 会将 package-boundary 的 compile / canary 工作放在一起，并将 runtime topology 架构与 Gateway 网关 watch 覆盖分开；boundary guard 分片会在一个作业内部并发运行其体量较小、彼此独立的守卫检查。Gateway 网关 watch、渠道测试以及核心 support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内部并发运行，保留它们原有的检查名称作为轻量验证器作业，同时避免额外占用两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有独立的 source set 或 manifest；其单元测试流水线仍会在启用 SMS / call-log BuildConfig 标志的情况下编译该 flavor，同时避免在每次与 Android 相关的推送中重复执行 debug APK 打包作业。

当同一个 PR 或 `main` ref 上有新的推送到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 上最新的运行也失败，否则应将其视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会正常报告分片失败，但不会在整个工作流已经被替代后继续排队。

自动 CI 并发键是带版本号的（`CI-v7-*`），因此 GitHub 侧旧队列组中的僵尸任务不会无限期阻塞新的 `main` 运行。手动完整套件运行使用 `CI-manual-v1-*`，并且不会取消正在进行中的运行。

## 运行器

| 运行器 | 作业 |
| --- | --- |
| `ubuntu-24.04` | `preflight`、快速安全作业及聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片渠道契约检查、除 lint 外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早进入队列 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然对 CPU 足够敏感，以至于 8 vCPU 的成本高于其节省的时间；install-smoke Docker 构建，此处 32 vCPU 的排队时间成本高于其节省的时间 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-node`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` 上的 `macos-swift`；fork 会回退到 `macos-latest` |

## 本地等效命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界流水线运行已变更的 typecheck / lint / guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门控，但附带各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 廉价的智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 坏链检查
pnpm build          # 当 CI 产物 / build-smoke 流水线相关时构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较近期成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较近期成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

---
read_when:
    - 你需要了解某个 CI 作业为什么运行或没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、范围门控，以及本地命令等价项
title: CI 流水线
x-i18n:
    generated_at: "2026-04-27T12:50:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc14de6a52617a4670ded1c6770a6fb807ff27163010f546a65c55ffe7014493
    source_path: ci.md
    workflow: 15
---

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能范围判定，在只有不相关区域发生变更时跳过高成本作业。手动触发的 `workflow_dispatch` 运行会有意绕过智能范围判定，并展开完整的常规 CI 作业图，用于发布候选版本或大范围验证。

`Full Release Validation` 是用于“发布前运行全部检查”的手动总控工作流。它接受分支、标签或完整提交 SHA，使用该目标触发手动 `CI` 工作流，并触发 `OpenClaw Release Checks`，以执行安装冒烟测试、包验收、Docker 发布路径套件、实时 / E2E、OpenWebUI、QA Lab 一致性、Matrix 和 Telegram 路径。提供已发布的包规格时，它还可以运行发布后的 `NPM Telegram Beta E2E` 工作流。该总控会记录已触发的子运行 id，最终的 `Verify full validation` 作业会重新检查当前各子运行的结论。如果某个子工作流被重跑并转为绿色，只需重跑父级验证器作业即可刷新总控结果。

`Package Acceptance` 是用于验证包产物的旁路工作流，不会阻塞发布工作流。它从已发布的 npm spec、使用所选 `workflow_ref` harness 构建的可信 `package_ref`、带 SHA-256 的 HTTPS tarball URL，或来自其他 GitHub Actions 运行的 tarball 产物中解析出一个候选包，将其上传为 `package-under-test`，然后复用 Docker 发布 / E2E 调度器，对该 tarball 运行测试，而不是重新打包工作流检出的代码。配置档覆盖 smoke、package、product、full 和自定义 Docker lane 选择。`package` 配置档使用离线插件覆盖，因此已发布包的验证不会被实时 ClawHub 可用性所阻塞。可选的 Telegram lane 会在 `NPM Telegram Beta E2E` 工作流中复用 `package-under-test` 产物，而已发布 npm spec 路径仍保留给独立触发场景。

## 包验收

当问题是“这个可安装的 OpenClaw 包作为产品是否可用？”时，使用 `Package Acceptance`。它与常规 CI 不同：常规 CI 验证源码树，而包验收通过用户在安装或更新后实际使用的同一套 Docker E2E harness，验证单个 tarball。

该工作流有四个作业：

1. `resolve_package` 检出 `workflow_ref`，解析出一个包候选，写入 `.artifacts/docker-e2e-package/openclaw-current.tgz`，写入 `.artifacts/docker-e2e-package/package-candidate.json`，将两者作为 `package-under-test` 产物上传，并在 GitHub 步骤摘要中打印来源、workflow ref、package ref、版本、SHA-256 和配置档。
2. `docker_acceptance` 使用 `ref=workflow_ref` 和 `package_artifact_name=package-under-test` 调用 `openclaw-live-and-e2e-checks-reusable.yml`。该可复用工作流会下载该产物，验证 tarball 清单，按需准备 package-digest Docker 镜像，并针对该包运行所选 Docker lane，而不是打包工作流检出的代码。
3. `package_telegram` 可选调用 `NPM Telegram Beta E2E`。当 `telegram_mode` 不为 `none` 时运行；如果 `Package Acceptance` 已解析出一个包，它会安装同一个 `package-under-test` 产物；独立触发的 Telegram 运行仍可安装已发布的 npm spec。
4. `summary` 会在包解析、Docker 验收或可选 Telegram lane 失败时使整个工作流失败。

候选来源：

- `source=npm`：仅接受 `openclaw@beta`、`openclaw@latest`，或精确的 OpenClaw 发布版本，例如 `openclaw@2026.4.27-beta.2`。用于已发布 beta / stable 的验收。
- `source=ref`：打包可信的 `package_ref` 分支、标签或完整提交 SHA。解析器会获取 OpenClaw 分支 / 标签，验证所选提交可从仓库分支历史或发布标签到达，在分离工作树中安装依赖，并使用 `scripts/package-openclaw-for-docker.mjs` 打包。
- `source=url`：下载 HTTPS `.tgz`；必须提供 `package_sha256`。
- `source=artifact`：从 `artifact_run_id` 和 `artifact_name` 下载一个 `.tgz`；`package_sha256` 可选，但对于外部共享产物应当提供。

请将 `workflow_ref` 和 `package_ref` 分开。`workflow_ref` 是运行测试的可信工作流 / harness 代码。`package_ref` 是在 `source=ref` 时被打包的源提交。这样就能使用当前测试 harness 验证较早的可信源提交，而无需运行旧的工作流逻辑。

配置档映射到 Docker 覆盖范围：

- `smoke`：`npm-onboard-channel-agent`、`gateway-network`、`config-reload`
- `package`：`npm-onboard-channel-agent`、`doctor-switch`、`update-channel-switch`、`bundled-channel-deps-compat`、`plugins-offline`、`plugin-update`
- `product`：`package` 加上 `mcp-channels`、`cron-mcp-cleanup`、`openai-web-search-minimal`、`openwebui`
- `full`：包含 OpenWebUI 的完整 Docker 发布路径分块
- `custom`：精确的 `docker_lanes`；当 `suite_profile=custom` 时必填

发布检查会以 `source=ref`、`package_ref=<release-ref>`、`workflow_ref=<release workflow ref>`、`suite_profile=custom`、`docker_lanes='bundled-channel-deps-compat plugins-offline'` 和 `telegram_mode=mock-openai` 调用 Package Acceptance。发布路径的 Docker 分块覆盖了重叠的 package / update / plugin lane，而 Package Acceptance 则针对同一个已解析的包 tarball，保留原生产物形式的 bundled-channel 兼容性、离线插件和 Telegram 验证。跨操作系统的发布检查仍覆盖操作系统特定的新手引导、安装器和平台行为；包 / 更新产品验证应从 Package Acceptance 开始。Windows 打包和安装器全新路径还会验证：已安装的包能否从原始的绝对 Windows 路径导入 browser-control 覆盖项。

Package Acceptance 为截至 `2026.4.25`（包括 `2026.4.25-beta.*`）的已发布包保留了一个有界的旧兼容窗口。这里记录这些兼容放宽，是为了避免它们变成永久的静默跳过：如果 tarball 省略了那些文件，`dist/postinstall-inventory.json` 中已知的私有 QA 条目可能会发出警告；当包未暴露该标志时，`doctor-switch` 可能会跳过 `gateway install --wrapper` 持久化子用例；`update-channel-switch` 可能会从 tarball 派生的伪 git fixture 中裁剪缺失的 `pnpm.patchedDependencies`，并可能记录缺失的持久化 `update.channel`；插件冒烟测试可能会读取旧版 install-record 位置，或接受缺失的 marketplace install-record 持久化；而 `plugin-update` 可能允许配置元数据迁移，同时仍要求 install record 与“不重新安装”行为保持不变。`2026.4.25` 之后的包必须满足现代契约；同样的情况将失败，而不是警告或跳过。

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

# 验证一个 tarball URL。对于 source=url，SHA-256 为必填项。
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

调试失败的包验收运行时，先查看 `resolve_package` 摘要，确认包来源、版本和 SHA-256。然后检查 `docker_acceptance` 子运行及其 Docker 产物：`.artifacts/docker-tests/**/summary.json`、`failures.json`、lane 日志、阶段耗时和重跑命令。优先重跑失败的包配置档或精确的 Docker lane，而不是重跑完整发布验证。

QA Lab 在主智能范围工作流之外有专用的 CI lane。`Parity gate` 工作流会在匹配的 PR 变更和手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.5 和 Opus 4.6 agentic pack。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix lane，以及实时 Telegram 和 Discord lane 展开为并行作业。实时作业使用 `qa-live-shared` 环境，Telegram / Discord 使用 Convex lease。Matrix 在定时和发布门控中使用 `--profile fast --fail-fast`，而 CLI 默认值和手动工作流输入仍为 `all`；手动 `matrix_profile=all` 触发总是会将完整 Matrix 覆盖切分为 `transport`、`media`、`e2ee-smoke`、`e2ee-deep` 和 `e2ee-cli` 作业。`OpenClaw Release Checks` 也会在发布批准前运行发布关键的 QA Lab lane。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复 PR 清理。它默认以 dry-run 模式运行，只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已合并，并确认每个重复 PR 都有共享的引用 issue，或存在重叠的变更 hunk。

`Docs Agent` 工作流是一个事件驱动的 Codex 维护 lane，用于让现有文档与最近合并的变更保持一致。它没有纯定时调度：`main` 上一次成功的非机器人 push CI 运行可以触发它，手动触发也可以直接运行它。workflow-run 调用会在 `main` 已继续前进，或在最近一小时内已创建过另一个未被跳过的 Docs Agent 运行时跳过。当它运行时，会审查从上一个未跳过的 Docs Agent 源 SHA 到当前 `main` 的提交范围，因此每小时运行一次即可覆盖自上次文档处理以来累计的所有 `main` 变更。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护 lane，用于处理慢测试。它没有纯定时调度：`main` 上一次成功的非机器人 push CI 运行可以触发它，但如果同一 UTC 日期内另一个 workflow-run 调用已经运行或正在运行，它就会跳过。手动触发会绕过该每日活动门控。该 lane 会构建完整测试套件的分组 Vitest 性能报告，让 Codex 仅进行小范围且不降低覆盖率的测试性能修复，而不是大规模重构，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中存在失败测试，Codex 只能修复明显失败项，且 agent 运行后的完整测试套件报告必须通过，才会提交任何内容。当 `main` 在机器人推送落地前继续前进时，该 lane 会对已验证的补丁执行 rebase，重新运行 `pnpm check:changed`，并重试推送；有冲突的过时补丁会被跳过。它使用 GitHub 托管的 Ubuntu，以便 Codex action 能与 docs agent 保持相同的 drop-sudo 安全策略。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业 | 用途 | 运行时机 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight` | 检测是否仅有文档变更、已变更范围、已变更扩展，并构建 CI 清单 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-scm-fast` | 通过 `zizmor` 进行私钥检测和工作流审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-dependency-audit` | 针对 npm 通告执行无依赖的生产 lockfile 审计 | 在所有非草稿 push 和 PR 上始终运行 |
| `security-fast` | 快速安全作业的必需聚合作业 | 在所有非草稿 push 和 PR 上始终运行 |
| `build-artifacts` | 构建 `dist/`、Control UI、已构建产物检查，以及可供下游复用的产物 | Node 相关变更 |
| `checks-fast-core` | 快速 Linux 正确性 lane，例如 bundled / plugin-contract / protocol 检查 | Node 相关变更 |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果 | Node 相关变更 |
| `checks-node-extensions` | 针对扩展套件的完整内置插件测试分片 | Node 相关变更 |
| `checks-node-core-test` | Core Node 测试分片，不包含渠道、内置、契约和扩展 lane | Node 相关变更 |
| `check` | 分片后的主本地门控等价项：生产类型、lint、守卫、测试类型和严格冒烟测试 | Node 相关变更 |
| `check-additional` | 架构、边界、扩展表面守卫、包边界以及 gateway-watch 分片 | Node 相关变更 |
| `build-smoke` | 已构建 CLI 冒烟测试和启动内存冒烟测试 | Node 相关变更 |
| `checks` | 已构建产物渠道测试的验证器 | Node 相关变更 |
| `checks-node-compat-node22` | Node 22 兼容性构建和冒烟 lane | 用于发布的手动 CI 触发 |
| `check-docs` | 文档格式化、lint 和损坏链接检查 | 文档发生变更时 |
| `skills-python` | 针对 Python 支持的 Skills 的 Ruff + pytest | Python Skills 相关变更 |
| `checks-windows` | Windows 特定的进程 / 路径测试，以及共享运行时导入说明符回归测试 | Windows 相关变更 |
| `macos-node` | 使用共享已构建产物的 macOS TypeScript 测试 lane | macOS 相关变更 |
| `macos-swift` | macOS 应用的 Swift lint、构建和测试 | macOS 相关变更 |
| `android` | 两个 flavor 的 Android 单元测试，以及一个 debug APK 构建 | Android 相关变更 |
| `test-performance-agent` | 在可信活动之后，每日由 Codex 执行慢测试优化 | `main` CI 成功后或手动触发 |

手动 CI 触发会运行与常规 CI 相同的作业图，但会强制开启所有范围化 lane：Linux Node 分片、内置插件分片、渠道契约、Node 22 兼容性、`check`、`check-additional`、构建冒烟、文档检查、Python Skills、Windows、macOS、Android，以及 Control UI i18n。手动运行使用唯一的并发组，因此某个发布候选版本的完整测试套件不会因为同一 ref 上的另一次 push 或 PR 运行而被取消。可选的 `target_ref` 输入允许可信调用方在使用所选触发 ref 的工作流文件的同时，针对某个分支、标签或完整提交 SHA 运行该作业图。

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha>
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## 快速失败顺序

作业按顺序排列，以便让廉价检查先失败，再决定是否运行高成本作业：

1. `preflight` 决定究竟存在哪些 lane。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而不会等待更重的产物和平台矩阵作业。
3. `build-artifacts` 会与快速 Linux lane 并行运行，这样下游消费者就能在共享构建准备就绪后立即启动。
4. 更重的平台和运行时 lane 随后展开：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

范围逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。手动触发会跳过 changed-scope 检测，并让 preflight 清单表现得如同每个范围化区域都已变更。

CI 工作流编辑会验证 Node CI 作业图以及工作流 lint，但本身不会强制运行 Windows、Android 或 macOS 原生构建；这些平台 lane 仍然只在平台源码发生变更时运行。

仅涉及 CI 路由的编辑、部分选定的低成本 core-test fixture 编辑，以及狭窄的插件契约辅助 / 测试路由编辑，会走一条快速的仅 Node 清单路径：preflight、安全检查，以及单个 `checks-fast-core` 任务。当前变更文件仅限于该快速任务可直接覆盖的路由或辅助表面时，这一路径会避免构建产物、Node 22 兼容性、渠道契约、完整 core 分片、内置插件分片，以及额外守卫矩阵。

Windows Node 检查仅限于 Windows 特定的进程 / 路径包装器、npm / pnpm / UI runner 辅助、包管理器配置，以及执行该 lane 的 CI 工作流表面；不相关的源码、插件、install-smoke 以及仅测试类变更会留在 Linux Node lane 上，这样就不会为了已由常规测试分片覆盖的内容占用一个 16 vCPU 的 Windows worker。

单独的 `install-smoke` 工作流会通过自己的 `preflight` 作业复用同一个范围脚本。它将 smoke 覆盖拆分为 `run_fast_install_smoke` 和 `run_full_install_smoke`。对于拉取请求，若变更涉及 Docker / package 表面、内置插件 package / manifest 变更，以及 Docker smoke 作业会覆盖的 core 插件 / 渠道 / Gateway 网关 / 插件 SDK 表面，则运行快速路径。仅源码的内置插件变更、仅测试编辑以及仅文档编辑不会占用 Docker worker。快速路径会构建一次根 Dockerfile 镜像，检查 CLI，运行 agents delete shared-workspace CLI smoke，运行容器 `gateway-network` e2e，验证一个内置扩展 build arg，并在总命令超时 240 秒限制下运行有界的内置插件 Docker 配置档，同时每个场景的 Docker 运行还有各自独立的上限。完整路径则保留 QR package 安装以及 installer Docker / update 覆盖，用于每晚定时运行、手动触发、workflow-call 发布检查，以及确实触及 installer / package / Docker 表面的拉取请求。推送到 `main`（包括 merge commit）不会强制走完整路径；当 changed-scope 逻辑会在 push 上请求完整覆盖时，工作流仍只保留快速 Docker smoke，而把完整 install smoke 留给夜间或发布验证。较慢的 Bun 全局安装 image-provider smoke 通过单独的 `run_bun_global_install_smoke` 门控；它会在夜间计划任务和发布检查工作流中运行，手动触发 `install-smoke` 时也可以选择启用，但拉取请求和 `main` push 不会运行它。QR 和 installer Docker 测试保留各自专用的、面向安装场景的 Dockerfile。

本地 `test:docker:all` 会预构建一个共享的 live-test 镜像，将 OpenClaw 打包一次为 npm tarball，并构建两个共享的 `scripts/e2e/Dockerfile` 镜像：一个是用于 installer / update / plugin-dependency lane 的纯 Node / Git runner，另一个是功能型镜像，它会把同一个 tarball 安装到 `/app` 中，用于常规功能性 lane。Docker lane 定义位于 `scripts/lib/docker-e2e-scenarios.mjs`，规划逻辑位于 `scripts/lib/docker-e2e-plan.mjs`，runner 只执行选定的计划。调度器会通过 `OPENCLAW_DOCKER_E2E_BARE_IMAGE` 和 `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` 为每个 lane 选择镜像，然后以 `OPENCLAW_SKIP_DOCKER_BUILD=1` 运行这些 lane；默认主池槽位数为 10，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整；对 provider 敏感的尾池槽位数默认也是 10，可通过 `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` 调整。重型 lane 上限默认分别为 `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` 和 `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`，以避免 npm install 和多服务 lane 对 Docker 过度超配，同时让较轻的 lane 继续填满可用槽位。即使某个单独 lane 比有效上限更重，只要池为空，它仍然可以启动，然后独占运行直到释放容量。默认情况下，各 lane 的启动会错开 2 秒，以避免本地 Docker 守护进程因同时创建容器而突发过载；可通过 `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` 或其他毫秒值覆盖。本地聚合运行会先对 Docker 做预检查，清理陈旧的 OpenClaw E2E 容器，输出活跃 lane 状态，持久化 lane 耗时以供“最长优先”排序，并支持 `OPENCLAW_DOCKER_ALL_DRY_RUN=1` 进行调度器检查。默认情况下，在首次失败后它会停止为新的池化 lane 排程；每个 lane 都有一个 120 分钟的后备超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖；某些选定的 live / tail lane 使用更严格的单 lane 上限。`OPENCLAW_DOCKER_ALL_LANES=<lane[,lane]>` 可运行精确的调度器 lane，包括仅发布时使用的 lane，如 `install-e2e`，以及拆分后的内置更新 lane，如 `bundled-channel-update-acpx`，同时跳过 cleanup smoke，以便智能体复现某个失败 lane。

可复用的 live / E2E 工作流会通过 `scripts/test-docker-all.mjs --plan-json` 询问需要哪种 package、镜像类型、live 镜像、lane 以及凭证覆盖，然后由 `scripts/docker-e2e.mjs` 将该计划转换为 GitHub 输出和摘要。它可以通过 `scripts/package-openclaw-for-docker.mjs` 打包 OpenClaw、下载当前运行的包产物，或从 `package_artifact_run_id` 下载包产物；验证 tarball 清单；当计划需要已安装包的 lane 时，通过 Blacksmith 的 Docker 层缓存构建并推送使用 package-digest 标记的 bare / functional GHCR Docker E2E 镜像；并在提供了 `docker_e2e_bare_image` / `docker_e2e_functional_image` 输入或已存在 package-digest 镜像时复用它们，而不是重新构建。

`Package Acceptance` 工作流是高层级的包门控：它从 npm、可信 `package_ref`、附带 SHA-256 的 HTTPS tarball，或之前某次工作流的产物中解析出一个候选包，然后将这个单一的 `package-under-test` 产物传入可复用的 Docker E2E 工作流。它将 `workflow_ref` 与 `package_ref` 分开，以便当前的验收逻辑可以在不检出旧工作流代码的情况下，验证较早的可信提交。发布检查会针对目标 ref 运行一个定制的 Package Acceptance 增量：针对已解析 tarball 执行 bundled-channel 兼容性、离线插件 fixture，以及 Telegram 包 QA。

发布路径 Docker 套件会运行四个分块作业，并设置 `OPENCLAW_SKIP_DOCKER_BUILD=1`，这样每个分块只拉取自身所需的镜像类型，并通过同一个加权调度器执行多个 lane（`OPENCLAW_DOCKER_ALL_PROFILE=release-path`、`OPENCLAW_DOCKER_ALL_CHUNK=core|package-update|plugins-runtime|bundled-channels`）。当完整发布路径覆盖需要时，OpenWebUI 会并入 `plugins-runtime`，只有在仅针对 OpenWebUI 的触发中，才保留独立的 `openwebui` 分块。`bundled-channels` 分块运行拆分后的 `bundled-channel-*` 和 `bundled-channel-update-*` lane，而不是串行的一体化 `bundled-channel-deps` lane；`plugins-integrations` 仍保留为手动重跑时使用的旧聚合别名。每个分块都会上传 `.artifacts/docker-tests/`，其中包含 lane 日志、耗时、`summary.json`、`failures.json`、阶段耗时、调度器计划 JSON、慢 lane 表，以及每个 lane 的重跑命令。工作流的 `docker_lanes` 输入会针对已准备好的镜像运行所选 lane，而不是运行分块作业；这样可以把失败 lane 的调试限制在一个有针对性的 Docker 作业中，并为该次运行准备、下载或复用包产物；如果选中的 lane 是 live Docker lane，则该目标作业会在本地构建 live-test 镜像用于重跑。生成的每 lane GitHub 重跑命令会在这些值存在时包含 `package_artifact_run_id`、`package_artifact_name` 以及已准备好的镜像输入，因此失败的 lane 可以复用失败运行中的同一包和镜像。使用 `pnpm test:docker:rerun <run-id>` 可从某个 GitHub 运行下载 Docker 产物，并打印合并后的 / 每 lane 的定向重跑命令；使用 `pnpm test:docker:timings <summary.json>` 可查看慢 lane 和阶段关键路径摘要。定时的 live / E2E 工作流每天运行完整的发布路径 Docker 套件。内置更新矩阵按更新目标拆分，以便重复的 npm update 和 doctor repair 步骤可以与其他内置检查一起分片执行。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地检查门控在架构边界上比宽泛的 CI 平台范围更严格：core 生产变更会运行 core 生产和 core 测试 typecheck，以及 core lint / guards；core 仅测试变更只运行 core 测试 typecheck 和 core lint；扩展生产变更会运行扩展生产和扩展测试 typecheck，以及扩展 lint；扩展仅测试变更会运行扩展测试 typecheck 和扩展 lint。公开的插件 SDK 或 plugin-contract 变更会扩展到扩展 typecheck，因为扩展依赖这些 core 契约，但 Vitest 的扩展全面扫描仍属于显式测试工作。仅发布元数据的版本提升会运行有针对性的版本 / 配置 / 根依赖检查。未知的根目录 / 配置变更会以保守方式退回到所有检查 lane。

手动 CI 触发会运行 `checks-node-compat-node22` 作为发布候选兼容性覆盖。常规拉取请求和 `main` push 会跳过该 lane，并让矩阵聚焦于 Node 24 测试 / 渠道 lane。

最慢的 Node 测试族会被拆分或重新平衡，以便每个作业都足够小，同时不过度预留 runner：渠道契约作为 3 个加权分片运行，内置插件测试在 6 个扩展 worker 间平衡分配，小型 core 单元 lane 会成对组合，auto-reply 作为 4 个平衡 worker 运行，并将 reply 子树拆分为 agent-runner、dispatch 和 commands / state-routing 分片，而 agentic Gateway 网关 / 插件配置则分布到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。广泛的浏览器、QA、媒体以及杂项插件测试使用各自专用的 Vitest 配置，而不是共享的插件兜底配置。扩展分片作业一次最多运行两组插件配置，每组使用一个 Vitest worker，并分配更大的 Node 堆，这样导入密集型的插件批次就不会额外产生更多 CI 作业。广泛的 agents lane 使用共享的 Vitest 文件并行调度器，因为它主要受导入 / 调度主导，而不是由某个单独的慢测试文件主导。`runtime-config` 会与 infra core-runtime 分片一起运行，以避免共享运行时分片拖尾。基于 include-pattern 的分片会使用 CI 分片名称记录耗时条目，因此 `.artifacts/vitest-shard-timings.json` 可以区分完整配置与过滤后的分片。`check-additional` 会将 package-boundary 的 compile / canary 工作放在一起，并把运行时拓扑架构与 gateway watch 覆盖分开；boundary guard 分片会在单个作业内部并发运行其小型独立守卫。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内部并发运行，既保留它们原有的检查名称作为轻量级验证器作业，又避免额外占用两个 Blacksmith worker 和第二条产物消费队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的源码集或 manifest；它的单元测试 lane 仍会使用 SMS / call-log BuildConfig 标志编译该 flavor，同时避免在每次 Android 相关 push 上重复执行一个 debug APK 打包作业。

当同一 PR 或 `main` ref 上有更新的 push 到达时，GitHub 可能会将被替代的作业标记为 `cancelled`。除非同一 ref 上最新的一次运行也在失败，否则请将这视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，因此它们仍会报告正常的分片失败，但不会在整个工作流已被替代后继续排队。

自动 CI 并发键带有版本号（`CI-v7-*`），这样 GitHub 端旧队列组中的僵尸任务就不会无限期阻塞较新的 `main` 运行。手动完整套件运行使用 `CI-manual-v1-*`，且不会取消正在进行中的运行。

## Runner

| Runner | 作业 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`、快速安全作业及其聚合作业（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol / contract / bundled 检查、分片的渠道契约检查、除 lint 之外的 `check` 分片、`check-additional` 分片及其聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早开始排队 |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`、build-smoke、Linux Node 测试分片、内置插件测试分片、`android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`，它仍然足够依赖 CPU，以至于 8 vCPU 的成本高于节省；install-smoke Docker 构建，其中 32 vCPU 的排队时间成本高于收益 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `macos-node`，用于 `openclaw/openclaw`；fork 会回退到 `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `macos-swift`，用于 `openclaw/openclaw`；fork 会回退到 `macos-latest` |

## 本地等价命令

```bash
pnpm changed:lanes   # 检查 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地检查门控：按边界 lane 执行变更相关的 typecheck / lint / guards
pnpm check          # 快速本地门控：生产 tsgo + 分片 lint + 并行快速 guards
pnpm check:test-types
pnpm check:timed    # 相同门控，但包含每个阶段的耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest 测试
pnpm test:changed   # 低成本智能 changed Vitest 目标
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式化 + lint + 损坏链接检查
pnpm build          # 当 CI 产物 / build-smoke lane 相关时，构建 dist
pnpm ci:timings                               # 汇总最近一次 origin/main push CI 运行
pnpm ci:timings:recent                        # 比较最近成功的 main CI 运行
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队时间和最慢作业
node scripts/ci-run-timings.mjs --latest-main # 忽略 issue / comment 噪声，并选择 origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # 比较最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## 相关内容

- [安装概览](/zh-CN/install)
- [发布渠道](/zh-CN/install/development-channels)

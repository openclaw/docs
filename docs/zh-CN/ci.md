---
read_when:
    - 你需要了解某个 CI 作业为什么运行了，或者为什么没有运行
    - 你正在调试失败的 GitHub Actions 检查
summary: CI 作业图、作用域门禁，以及本地等效命令
title: CI 流水线
x-i18n:
    generated_at: "2026-04-23T19:45:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e250c90d9be13dc25a0b028de5d72cf821387e33c0965cac7b935579e3c6ae7
    source_path: ci.md
    workflow: 15
---

# CI 流水线

CI 会在每次推送到 `main` 以及每个拉取请求时运行。它使用智能作用域划分，在仅有无关区域变更时跳过高开销作业。

QA Lab 在主智能作用域工作流之外有专门的 CI 通道。`Parity gate` 工作流会在匹配的 PR 变更以及手动触发时运行；它会构建私有 QA 运行时，并比较模拟的 GPT-5.4 和 Opus 4.6 智能体包。`QA-Lab - All Lanes` 工作流会在 `main` 上每晚运行，并支持手动触发；它会将模拟 parity gate、实时 Matrix 通道和实时 Telegram 通道作为并行作业扇出运行。实时作业使用 `qa-live-shared` 环境，而 Telegram 通道使用 Convex 租约。`OpenClaw Release Checks` 也会在发布批准前运行相同的 QA Lab 通道。

`Duplicate PRs After Merge` 工作流是一个供维护者使用的手动工作流，用于合并后的重复项清理。它默认使用 dry-run，只有在 `apply=true` 时才会关闭显式列出的 PR。在修改 GitHub 之前，它会验证已合并的 PR 确实已合并，并验证每个重复 PR 要么引用了相同的 issue，要么存在重叠的变更 hunk。

`Test Performance Agent` 工作流是一个事件驱动的 Codex 维护通道，用于处理慢测试。它没有纯定时调度：`main` 上一次由非机器人触发且成功的 push CI 运行可以触发它，但如果当天 UTC 时间内已有另一次 workflow-run 调用已经运行或正在运行，它就会跳过。手动触发会绕过这一每日活动门禁。该通道会构建完整测试套件的分组 Vitest 性能报告，允许 Codex 仅进行小范围且不降低覆盖率的测试性能修复，然后重新运行完整测试套件报告，并拒绝任何会降低通过基线测试数量的变更。如果基线中已有失败测试，Codex 只能修复明显的失败项，并且在提交任何内容之前，agent 运行后的完整测试套件报告必须通过。

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## 作业概览

| 作业                             | 目的                                                                                         | 运行时机                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| `preflight`                      | 检测是否仅为文档变更、变更的作用域、变更的扩展，并构建 CI 清单                              | 所有非草稿 push 和 PR        |
| `security-scm-fast`              | 通过 `zizmor` 进行私钥检测和工作流审计                                                      | 所有非草稿 push 和 PR        |
| `security-dependency-audit`      | 针对 npm advisories 进行无依赖的生产 lockfile 审计                                           | 所有非草稿 push 和 PR        |
| `security-fast`                  | 快速安全作业的必需聚合作业                                                                   | 所有非草稿 push 和 PR        |
| `build-artifacts`                | 构建 `dist/`、Control UI、已构建产物检查，以及可复用的下游产物                              | 与 Node 相关的变更          |
| `checks-fast-core`               | 快速 Linux 正确性通道，例如 bundled/plugin-contract/protocol 检查                           | 与 Node 相关的变更          |
| `checks-fast-contracts-channels` | 分片的渠道契约检查，并提供稳定的聚合检查结果                                                | 与 Node 相关的变更          |
| `checks-node-extensions`         | 覆盖整个扩展套件的完整 bundled-plugin 测试分片                                              | 与 Node 相关的变更          |
| `checks-node-core-test`          | Core Node 测试分片，不包括渠道、bundled、contract 和扩展通道                                | 与 Node 相关的变更          |
| `extension-fast`                 | 仅针对已变更 bundled plugin 的定向测试                                                      | 带有扩展变更的拉取请求       |
| `check`                          | 分片后的主本地门禁等效项：生产类型、lint、guard、测试类型和严格 smoke                       | 与 Node 相关的变更          |
| `check-additional`               | 架构、边界、扩展表面 guard、包边界以及 gateway-watch 分片                                   | 与 Node 相关的变更          |
| `build-smoke`                    | 已构建 CLI 的 smoke 测试和启动内存 smoke                                                    | 与 Node 相关的变更          |
| `checks`                         | 用于已构建产物渠道测试的验证器，以及仅在 push 时运行的 Node 22 兼容性检查                   | 与 Node 相关的变更          |
| `check-docs`                     | 文档格式、lint 和损坏链接检查                                                                | 文档有变更时                 |
| `skills-python`                  | 针对 Python 支持的 Skills 运行 Ruff + pytest                                                | 与 Python Skills 相关的变更 |
| `checks-windows`                 | Windows 专用测试通道                                                                         | 与 Windows 相关的变更       |
| `macos-node`                     | 使用共享已构建产物的 macOS TypeScript 测试通道                                              | 与 macOS 相关的变更         |
| `macos-swift`                    | macOS 应用的 Swift lint、构建和测试                                                          | 与 macOS 相关的变更         |
| `android`                        | 两种 flavor 的 Android 单元测试，以及一个 debug APK 构建                                    | 与 Android 相关的变更       |
| `test-performance-agent`         | 在可信活动之后每日运行的 Codex 慢测试优化                                                   | 主 CI 成功后或手动触发      |

## 快速失败顺序

作业按顺序排列，以便低成本检查先失败，避免高成本作业继续运行：

1. `preflight` 决定哪些通道会存在。`docs-scope` 和 `changed-scope` 逻辑是该作业中的步骤，而不是独立作业。
2. `security-scm-fast`、`security-dependency-audit`、`security-fast`、`check`、`check-additional`、`check-docs` 和 `skills-python` 会快速失败，而无需等待更重的产物和平台矩阵作业。
3. `build-artifacts` 与快速 Linux 通道并行运行，这样下游消费者可以在共享构建准备好后立即开始。
4. 之后扇出更重的平台和运行时通道：`checks-fast-core`、`checks-fast-contracts-channels`、`checks-node-extensions`、`checks-node-core-test`、仅限 PR 的 `extension-fast`、`checks`、`checks-windows`、`macos-node`、`macos-swift` 和 `android`。

作用域逻辑位于 `scripts/ci-changed-scope.mjs`，并由 `src/scripts/ci-changed-scope.test.ts` 中的单元测试覆盖。
CI 工作流编辑会验证 Node CI 图以及工作流 lint，但不会仅因自身变更而强制运行 Windows、Android 或 macOS 原生构建；这些平台通道仍然只对平台源码变更生效。
Windows Node 检查的作用域仅限于 Windows 专用的进程/路径包装器、npm/pnpm/UI 运行器辅助工具、包管理器配置，以及执行该通道的 CI 工作流表面；无关的源码、plugin、安装 smoke 和纯测试变更仍留在 Linux Node 通道中，这样它们就不会为了已由常规测试分片覆盖的内容而占用一个 16 vCPU 的 Windows worker。
单独的 `install-smoke` 工作流会通过它自己的 `preflight` 作业复用相同的作用域脚本。它根据更窄的 changed-smoke 信号计算 `run_install_smoke`，因此 Docker/安装 smoke 会针对安装、打包、与容器相关的变更、bundled extension 生产变更，以及 Docker smoke 作业所覆盖的 core plugin/channel/Gateway 网关/插件 SDK 表面运行。纯测试和纯文档编辑不会占用 Docker worker。其 QR package smoke 会强制 Docker 的 `pnpm install` 层重新运行，同时保留 BuildKit 的 pnpm store 缓存，因此它仍能覆盖安装过程，而无需每次运行都重新下载依赖。它的 gateway-network e2e 会复用该作业前面构建的运行时镜像，因此它增加了真实的 container-to-container WebSocket 覆盖，而无需新增一次 Docker 构建。本地 `test:docker:all` 会预先构建一个共享的 live-test 镜像和一个共享的 `scripts/e2e/Dockerfile` built-app 镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下并行运行 live/E2E smoke 通道；默认并发数为 4，可通过 `OPENCLAW_DOCKER_ALL_PARALLELISM` 调整。本地聚合作业默认会在首次失败后停止调度新的池化通道，并且每个通道都有一个 120 分钟的超时，可通过 `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` 覆盖。对启动或 provider 敏感的通道会在并行池之后独占运行。可复用的 live/E2E 工作流也遵循共享镜像模式：它会在 Docker 矩阵之前构建并推送一个带 SHA 标签的 GHCR Docker E2E 镜像，然后在 `OPENCLAW_SKIP_DOCKER_BUILD=1` 下运行矩阵。定时的 live/E2E 工作流每天运行完整的发布路径 Docker 套件。QR 和 installer Docker 测试保持各自以安装为重点的 Dockerfile。另有一个独立的 `docker-e2e-fast` 作业，会在 120 秒命令超时内运行有界的 bundled-plugin Docker 配置：setup-entry 依赖修复以及合成的 bundled-loader 故障隔离。完整的 bundled 更新/渠道矩阵仍然是手动/完整套件，因为它会反复执行真实的 npm update 和 doctor repair 流程。

本地 changed-lane 逻辑位于 `scripts/changed-lanes.mjs`，由 `scripts/check-changed.mjs` 执行。这个本地门禁在架构边界方面比宽泛的 CI 平台作用域更严格：core 生产变更会运行 core 生产类型检查以及 core 测试，core 纯测试变更只运行 core 测试类型检查/测试，extension 生产变更会运行 extension 生产类型检查以及 extension 测试，而 extension 纯测试变更只运行 extension 测试类型检查/测试。公共插件 SDK 或 plugin-contract 变更会扩展为 extension 验证，因为扩展依赖这些 core 契约。仅发布元数据的版本变更会运行定向的版本/配置/root-dependency 检查。未知的根目录/配置变更会以安全优先方式落到所有通道。

在 push 上，`checks` 矩阵会增加一个仅在 push 时运行的 `compat-node22` 通道。在拉取请求上，该通道会被跳过，矩阵会保持聚焦于常规测试/渠道通道。

最慢的 Node 测试族会被拆分或平衡，以便每个作业都保持较小规模，同时避免过度预留 runner：渠道契约按权重拆成三个分片，bundled plugin 测试会在六个扩展 worker 间做负载均衡，小型 core 单元通道会成对组合，auto-reply 以三个平衡 worker 运行，而不是六个过小的 worker，agentic Gateway 网关/plugin 配置则分布到现有的仅源码 agentic Node 作业中，而不是等待已构建产物。大范围的浏览器、QA、媒体和杂项 plugin 测试使用各自专用的 Vitest 配置，而不是共享的 plugin 通用兜底配置。扩展分片作业会以单个 Vitest worker 和更大的 Node 堆大小串行运行 plugin 配置组，这样导入开销较大的 plugin 批次就不会让小型 CI runner 过载。宽泛的 agents 通道使用共享的 Vitest 文件级并行调度器，因为它的瓶颈主要在导入/调度，而不是由某个单独的慢测试文件主导。`runtime-config` 会和 infra core-runtime 分片一起运行，以避免共享 runtime 分片独自拖尾。`check-additional` 会把 package-boundary 的编译/canary 工作保持在一起，并将 runtime topology architecture 与 gateway watch 覆盖拆开；boundary guard 分片会在一个作业内部并发运行其小型且相互独立的 guard。Gateway watch、渠道测试以及 core support-boundary 分片会在 `dist/` 和 `dist-runtime/` 已构建完成后，于 `build-artifacts` 内部并发运行；这样既保留了它们原有的检查名称作为轻量验证作业，又避免额外占用两个 Blacksmith worker 和第二条产物消费者队列。

Android CI 会同时运行 `testPlayDebugUnitTest` 和 `testThirdPartyDebugUnitTest`，然后构建 Play debug APK。第三方 flavor 没有单独的 source set 或 manifest；它的单元测试通道仍会使用 SMS/call-log BuildConfig 标志编译该 flavor，同时避免在每次与 Android 相关的 push 上重复执行一个 debug APK 打包作业。

`extension-fast` 仅在 PR 上运行，因为 push 运行已经会执行完整的 bundled plugin 分片。这样既能为评审提供已变更 plugin 的反馈，又不会在 `main` 上为 `checks-node-extensions` 已经覆盖的内容额外占用一个 Blacksmith worker。

当同一 PR 或 `main` ref 上有较新的 push 到达时，GitHub 可能会把被替代的作业标记为 `cancelled`。除非同一 ref 上最新的一次运行也失败，否则应将这视为 CI 噪声。聚合分片检查使用 `!cancelled() && always()`，这样它们仍会正常报告分片失败，但不会在整个工作流已被替代后继续排队。

CI 并发 key 采用版本化形式（`CI-v7-*`），这样 GitHub 端旧队列组中的 zombie 就不会无限期阻塞较新的 main 运行。

## Runner

| Runner                           | 作业                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`、快速安全作业及其聚合（`security-scm-fast`、`security-dependency-audit`、`security-fast`）、快速 protocol/contract/bundled 检查、分片的渠道契约检查、除 lint 以外的 `check` 分片、`check-additional` 分片及聚合、Node 测试聚合验证器、文档检查、Python Skills、workflow-sanity、labeler、auto-response；install-smoke 的 preflight 也使用 GitHub 托管的 Ubuntu，这样 Blacksmith 矩阵可以更早进入排队 |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`、build-smoke、Linux Node 测试分片、bundled plugin 测试分片、`android`                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`，它对 CPU 仍然足够敏感，以至于 8 vCPU 节省下来的成本不如它带来的损失；install-smoke Docker 构建也是如此，32 vCPU 的排队时间成本高于其收益                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | 在 `openclaw/openclaw` 上运行的 `macos-node`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-12vcpu-macos-latest` | 在 `openclaw/openclaw` 上运行的 `macos-swift`；fork 会回退到 `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                            |

## 本地等效命令

```bash
pnpm changed:lanes   # 查看 origin/main...HEAD 的本地 changed-lane 分类器
pnpm check:changed   # 智能本地门禁：按边界通道运行变更相关的类型检查/lint/测试
pnpm check          # 快速本地门禁：生产 tsgo + 分片 lint + 并行快速 guard
pnpm check:test-types
pnpm check:timed    # 同一套门禁，并输出各阶段耗时
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest 测试
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # 文档格式 + lint + 损坏链接检查
pnpm build          # 当 CI 产物/build-smoke 通道相关时，构建 dist
node scripts/ci-run-timings.mjs <run-id>      # 汇总总耗时、排队耗时和最慢作业
node scripts/ci-run-timings.mjs --recent 10   # 对比最近成功的 main CI 运行
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

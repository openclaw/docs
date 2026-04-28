---
read_when:
    - 在本地运行 pnpm openclaw qa matrix
    - 添加或选择 Matrix QA 场景
    - 排查 Matrix QA 失败、超时或卡住的清理
summary: Docker 支持的 Matrix QA 实时 QA 通道维护者参考：CLI、配置档案、环境变量、场景和输出工件。
title: Matrix QA
x-i18n:
    generated_at: "2026-04-28T11:50:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6282e8a65fb5af46a67f8240d5a9ce095e614b6cc68621745ffe79cf88a5131f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 车道会在 Docker 中使用一次性 Tuwunel homeserver 运行内置的 `@openclaw/matrix` 插件，并创建临时的 driver、SUT 和 observer 账号以及预置房间。它为 Matrix 提供真实传输层的 live 覆盖。

这是仅供维护者使用的工具。打包的 OpenClaw 发行版会有意省略 `qa-lab`，因此 `openclaw qa` 只能在源码检出中使用。源码检出会直接加载内置 runner，无需安装插件。

有关更广泛的 QA 框架上下文，请参见 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

普通的 `pnpm openclaw qa matrix` 会运行 `--profile all`，并且不会在第一次失败时停止。发布门禁请使用 `--profile fast --fail-fast`；并行运行完整清单时，可用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 对目录分片。

## 该车道会做什么

1. 在 Docker 中配置一个一次性 Tuwunel homeserver（默认镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名称 `matrix-qa.test`，端口 `28008`）。
2. 注册三个临时用户：`driver`（发送入站流量）、`sut`（被测 OpenClaw Matrix 账号）、`observer`（第三方流量捕获）。
3. 为所选场景预置所需房间（main、threading、media、restart、secondary、allowlist、E2EE、verification 私信等）。
4. 启动一个子 OpenClaw Gateway 网关，并将真实 Matrix 插件限定到 SUT 账号；子进程中不会加载 `qa-channel`。
5. 按顺序运行场景，并通过 driver/observer Matrix 客户端观察事件。
6. 拆除 homeserver，写入报告和摘要产物，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用标志

| 标志                  | 默认值                                       | 描述                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 场景配置文件。参见 [配置文件](#profiles)。                                                                           |
| `--fail-fast`         | 关闭                                           | 在第一次检查或场景失败后停止。                                                                         |
| `--scenario <id>`     | —                                             | 只运行此场景。可重复。参见 [场景](#scenarios)。                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 写入报告、摘要、已观察事件和输出日志的位置。相对路径会基于 `--repo-root` 解析。 |
| `--repo-root <path>`  | `process.cwd()`                               | 从中性工作目录调用时的仓库根目录。                                                        |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 网关配置中的 Matrix 账号 id。                                                                        |

### 提供商标志

该车道使用真实 Matrix 传输层，但模型提供商可配置：

| 标志                     | 默认值          | 描述                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用于确定性 mock 分发，`live-frontier` 用于 live frontier 提供商。旧别名 `live-openai` 仍然可用。 |
| `--model <ref>`          | 提供商默认值 | 主 `provider/model` 引用。                                                                                                             |
| `--alt-model <ref>`      | 提供商默认值 | 场景在运行中切换时使用的备用 `provider/model` 引用。                                                                            |
| `--fast`                 | 关闭              | 在支持的情况下启用提供商快速模式。                                                                                                |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。该车道会在本地配置一次性用户；没有可租用的共享凭证池。

## 配置文件

所选配置文件决定运行哪些场景。

| 配置文件         | 用途                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（默认） | 完整目录。较慢但覆盖全面。                                                                                                                                                                                                   |
| `fast`          | 发布门禁子集，用于测试 live 传输契约：canary、提及门控、allowlist 阻止、回复形状、重启恢复、线程跟进、线程隔离、回应观察和 exec 审批元数据递送。 |
| `transport`     | 传输层线程、私信、房间、自动加入、提及/allowlist、审批和回应场景。                                                                                                                                  |
| `media`         | 图片、音频、视频、PDF、EPUB 附件覆盖。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最小 E2EE 覆盖：基本加密回复、线程跟进、bootstrap 成功。                                                                                                                                                  |
| `e2ee-deep`     | 全面的 E2EE 状态丢失、备份、密钥和恢复场景。                                                                                                                                                                     |
| `e2ee-cli`      | 通过 QA harness 驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。                                                                                                                                       |

精确映射位于 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 场景

完整场景 id 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` union。类别包括：

- 线程：`matrix-thread-*`、`matrix-subagent-thread-spawn`
- 顶层 / 私信 / 房间：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 流式传输和工具进度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- 媒体：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- 路由：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- 回应：`matrix-reaction-*`
- 审批：`matrix-approval-*`（exec/插件元数据、分块回退、拒绝回应、线程和 `target: "both"` 路由）
- 重启和重放：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- 提及门控、bot-to-bot 和 allowlist：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（基本回复、线程跟进、bootstrap、恢复密钥生命周期、状态丢失变体、服务器备份行为、设备卫生、SAS / QR / 私信验证、重启、产物隐去）
- E2EE CLI：`matrix-e2ee-cli-*`（加密设置、幂等设置、bootstrap 失败、恢复密钥生命周期、多账号、Gateway 网关回复往返、自验证）

传入 `--scenario <id>`（可重复）以运行手选集合；与 `--profile all` 组合可忽略配置文件门控。

## 环境变量

| 变量                                | 默认值                                   | 效果                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分钟）                        | 整次运行的硬性上限。                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用于负向无回复断言的静默窗口。会被限制为 `≤` 运行超时。                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 拆除的上限。失败表面会包含恢复用的 `docker compose ... down --remove-orphans` 命令。                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 在针对不同 Tuwunel 版本验证时覆盖 homeserver 镜像。                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 开启                                        | `0` 会静默 stderr 上的 `[matrix-qa] ...` 进度行。`1` 会强制开启。                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已隐去                                  | `1` 会在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认会隐去，以确保 CI 产物安全。                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 关闭                                       | `1` 会跳过产物写入后的确定性 `process.exit`。默认会强制退出，因为 matrix-js-sdk 的原生加密句柄可能让事件循环在产物完成后仍保持活动状态。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未设置                                     | 当由外层 launcher（例如 `scripts/run-node.mjs`）设置时，Matrix QA 会复用该日志路径，而不是启动自己的 tee。                                                                   |

## 输出产物

写入 `--output-dir`：

- `matrix-qa-report.md` — Markdown 协议报告（通过、失败、跳过的内容及原因）。
- `matrix-qa-summary.json` — 适合 CI 解析和仪表盘使用的结构化摘要。
- `matrix-qa-observed-events.json` — 来自驱动和观察者客户端的已观测 Matrix 事件。除非设置了 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文会被遮盖；审批元数据会以选定的安全字段和截断后的命令预览进行汇总。
- `matrix-qa-output.log` — 本次运行的合并 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则改为复用外层启动器的日志。

默认输出目录为 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此连续运行不会相互覆盖。

## 分流提示

- **运行在接近结束时挂起：** `matrix-js-sdk` 原生加密句柄的存活时间可能超过测试框架。默认会在写入构件后强制执行干净的 `process.exit`；如果你取消设置了 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，预期进程会继续停留。
- **清理错误：** 查找打印出的恢复命令（一个 `docker compose ... down --remove-orphans` 调用），并手动运行它来释放 homeserver 端口。
- **CI 中负向断言窗口不稳定：** 当 CI 较快时，降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认 8 秒）；在较慢的共享 runner 上提高它。
- **需要为错误报告提供已遮盖的正文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行，并附上 `matrix-qa-observed-events.json`。将生成的构件视为敏感内容。
- **不同的 Tuwunel 版本：** 将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向正在测试的版本。该通道仅检入固定的默认镜像。

## 实时传输契约

Matrix 是三个实时传输通道（Matrix、Telegram、Discord）之一，它们共享 [QA overview → 实时传输覆盖范围](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage) 中定义的单一契约检查清单。`qa-channel` 仍然是广泛的合成套件，并且有意不包含在该矩阵中。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 整体 QA 栈和实时传输契约
- [QA Channel](/zh-CN/channels/qa-channel) — 用于仓库支持场景的合成渠道适配器
- [测试](/zh-CN/help/testing) — 运行测试并添加 QA 覆盖范围
- [Matrix](/zh-CN/channels/matrix) — 正在测试的渠道插件

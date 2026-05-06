---
read_when:
    - 在本地运行 pnpm openclaw qa matrix
    - 添加或选择 Matrix QA 场景
    - 排查 Matrix QA 失败、超时或卡住的清理流程
summary: 由 Docker 支持的 Matrix 实时 QA 通道维护者参考：CLI、配置文件、环境变量、场景和输出构件。
title: Matrix QA
x-i18n:
    generated_at: "2026-05-06T02:40:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 运行线会在 Docker 中使用一次性 Tuwunel homeserver 运行内置的 `@openclaw/matrix` 插件，并创建临时 driver、SUT 和 observer 账号以及预置房间。它为 Matrix 提供真实传输层的 live 覆盖。

这是仅供维护者使用的工具。打包的 OpenClaw 版本会有意省略 `qa-lab`，因此 `openclaw qa` 只能从源码 checkout 中使用。源码 checkout 会直接加载内置 runner，无需插件安装步骤。

如需更广泛的 QA 框架背景，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

普通的 `pnpm openclaw qa matrix` 会运行 `--profile all`，且不会在首次失败时停止。发布门禁请使用 `--profile fast --fail-fast`；并行运行完整清单时，可用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 对目录分片。

## 该运行线执行的操作

1. 在 Docker 中配置一次性 Tuwunel homeserver（默认镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名称 `matrix-qa.test`，端口 `28008`）。
2. 注册三个临时用户：`driver`（发送入站流量）、`sut`（被测 OpenClaw Matrix 账号）、`observer`（第三方流量捕获）。
3. 预置所选场景所需的房间（main、threading、media、restart、secondary、allowlist、E2EE、verification DM 等）。
4. 启动子 OpenClaw Gateway 网关，并将真实 Matrix 插件限定到 SUT 账号；子进程中不会加载 `qa-channel`。
5. 按顺序运行场景，通过 driver/observer Matrix 客户端观察事件。
6. 关闭 homeserver，写入报告和摘要产物，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用标志

| 标志                  | 默认值                                       | 描述                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 场景配置档。参见 [配置档](#profiles)。                                                                           |
| `--fail-fast`         | 关闭                                           | 在第一个失败的检查或场景后停止。                                                                         |
| `--scenario <id>`     | -                                             | 仅运行此场景。可重复。参见 [场景](#scenarios)。                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 写入报告、摘要、观察到的事件和输出日志的位置。相对路径会按 `--repo-root` 解析。 |
| `--repo-root <path>`  | `process.cwd()`                               | 从中立工作目录调用时的仓库根目录。                                                        |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 网关配置中的 Matrix 账号 ID。                                                                        |

### 提供商标志

该运行线使用真实 Matrix 传输，但模型提供商可配置：

| 标志                     | 默认值          | 描述                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用于确定性的 mock 调度，`live-frontier` 用于 live frontier 提供商。旧别名 `live-openai` 仍可使用。 |
| `--model <ref>`          | 提供商默认值 | 主 `provider/model` ref。                                                                                                             |
| `--alt-model <ref>`      | 提供商默认值 | 场景在运行中切换时使用的备用 `provider/model` ref。                                                                            |
| `--fast`                 | 关闭              | 在支持时启用提供商快速模式。                                                                                                |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。该运行线会在本地配置一次性用户；没有可租用的共享凭据池。

## 配置档

所选配置档决定运行哪些场景。

| 配置档         | 用途                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（默认） | 完整目录。较慢但覆盖全面。                                                                                                                                                                                                   |
| `fast`          | 发布门禁子集，用于检验 live 传输契约：canary、mention gating、allowlist block、reply shape、restart resume、thread follow-up、thread isolation、reaction observation 和 exec approval metadata delivery。 |
| `transport`     | 传输层级的 threading、私信、room、autojoin、mention/allowlist、approval 和 reaction 场景。                                                                                                                                  |
| `media`         | 图片、音频、视频、PDF、EPUB 附件覆盖。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最小 E2EE 覆盖：基本加密回复、thread follow-up、bootstrap success。                                                                                                                                                  |
| `e2ee-deep`     | 全面的 E2EE state-loss、backup、key 和 recovery 场景。                                                                                                                                                                     |
| `e2ee-cli`      | 通过 QA harness 驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。                                                                                                                                       |

确切映射位于 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 场景

完整场景 ID 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` union。类别包括：

- threading：`matrix-thread-*`、`matrix-subagent-thread-spawn`
- top-level / 私信 / room：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 流式传输和工具进度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- media：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- routing：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- reactions：`matrix-reaction-*`
- approvals：`matrix-approval-*`（exec/plugin metadata、chunked fallback、deny reactions、threads 和 `target: "both"` routing）
- restart 和 replay：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- mention gating、bot-to-bot 和 allowlists：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（basic reply、thread follow-up、bootstrap、recovery key lifecycle、state-loss variants、server backup behavior、device hygiene、SAS / QR / 私信 verification、restart、artifact redaction）
- E2EE CLI：`matrix-e2ee-cli-*`（encryption setup、idempotent setup、bootstrap failure、recovery-key lifecycle、multi-account、gateway-reply round-trip、self-verification）

传入 `--scenario <id>`（可重复）以运行手动挑选的集合；与 `--profile all` 结合使用可忽略配置档门控。

## 环境变量

| 变量                                    | 默认值                                    | 作用                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分钟）                      | 整次运行的硬性上限。                                                                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始金丝雀回复的时限。发布 CI 会在共享 runner 上提高此值，避免较慢的首个 Gateway 网关轮次在场景覆盖开始前失败。                                                                             |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用于负向无回复断言的静默窗口。会被限制为 `≤` 运行超时。                                                                                                                                     |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 拆除的时限。失败输出会包含恢复用的 `docker compose ... down --remove-orphans` 命令。                                                                                                  |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 在针对不同 Tuwunel 版本进行验证时，覆盖 homeserver 镜像。                                                                                                                                   |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 开启                                      | `0` 会静默 stderr 上的 `[matrix-qa] ...` 进度行。`1` 会强制开启。                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已脱敏                                    | `1` 会在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认会脱敏，以保证 CI 产物安全。                                                                               |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 关闭                                      | `1` 会跳过产物写入后的确定性 `process.exit`。默认会强制退出，因为 matrix-js-sdk 的原生加密句柄可能让事件循环在产物完成后仍保持活动。                                                       |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未设置                                    | 当外层启动器（例如 `scripts/run-node.mjs`）设置此变量时，Matrix QA 会复用该日志路径，而不是启动自己的 tee。                                                                                 |

## 输出产物

写入 `--output-dir`：

- `matrix-qa-report.md` - Markdown 协议报告（哪些通过、失败、被跳过，以及原因）。
- `matrix-qa-summary.json` - 适合 CI 解析和仪表盘使用的结构化摘要。
- `matrix-qa-observed-events.json` - 来自驱动端和观察者客户端的已观察 Matrix 事件。除非设置 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文会被脱敏；审批元数据会通过选定的安全字段和截断后的命令预览进行摘要。
- `matrix-qa-output.log` - 本次运行的合并 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则会改为复用外层启动器的日志。

默认输出目录是 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此连续运行不会相互覆盖。

## 分诊提示

- **运行在接近结束时挂起：** `matrix-js-sdk` 的原生加密句柄可能比 harness 存活更久。默认会在产物写入后强制执行干净的 `process.exit`；如果你取消设置了 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，预计进程会继续停留。
- **清理错误：** 查找打印出的恢复命令（一次 `docker compose ... down --remove-orphans` 调用），并手动运行它以释放 homeserver 端口。
- **CI 中负向断言窗口不稳定：** 当 CI 很快时，降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认 8 秒）；在较慢的共享 runner 上提高它。
- **错误报告需要未脱敏正文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行，并附上 `matrix-qa-observed-events.json`。将生成的产物视为敏感内容。
- **不同的 Tuwunel 版本：** 将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向被测版本。该 lane 只检入固定的默认镜像。

## 实时传输契约

Matrix 是三个实时传输 lane（Matrix、Telegram、Discord）之一，它们共享 [QA overview → 实时传输覆盖范围](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage) 中定义的单一契约检查清单。`qa-channel` 仍然是广泛的合成套件，并且有意不属于该矩阵的一部分。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation) - 整体 QA 栈和实时传输契约
- [QA 频道](/zh-CN/channels/qa-channel) - 用于仓库支持场景的合成渠道适配器
- [测试](/zh-CN/help/testing) - 运行测试并添加 QA 覆盖
- [Matrix](/zh-CN/channels/matrix) - 被测渠道插件

---
read_when:
    - 在本地运行 pnpm openclaw qa matrix
    - 添加或选择 Matrix QA 场景
    - 排查 Matrix QA 失败、超时或清理卡住的问题
summary: Docker 支撑的 Matrix 实时 QA 通道的维护者参考：CLI、配置档、环境变量、场景和输出工件。
title: Matrix QA
x-i18n:
    generated_at: "2026-04-29T05:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 测试通道会在 Docker 中使用一次性的 Tuwunel homeserver，针对内置的 `@openclaw/matrix` 插件运行测试，并配备临时的 driver、SUT 和 observer 账号以及预置房间。它为 Matrix 提供真实传输层的实时覆盖。

这是仅供维护者使用的工具。打包后的 OpenClaw 版本会有意省略 `qa-lab`，因此 `openclaw qa` 只能从源码检出中使用。源码检出会直接加载内置 runner，无需安装插件。

如需更广泛的 QA 框架背景，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

普通的 `pnpm openclaw qa matrix` 会运行 `--profile all`，并且不会在首次失败时停止。发布门禁请使用 `--profile fast --fail-fast`；并行运行完整清单时，可用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 对目录分片。

## 该测试通道做什么

1. 在 Docker 中预配一次性的 Tuwunel homeserver（默认镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名 `matrix-qa.test`，端口 `28008`）。
2. 注册三个临时用户：`driver`（发送入站流量）、`sut`（被测 OpenClaw Matrix 账号）、`observer`（第三方流量捕获）。
3. 预置所选场景需要的房间（main、threading、media、restart、secondary、allowlist、E2EE、verification DM 等）。
4. 启动一个子 OpenClaw Gateway 网关，其中真实 Matrix 插件限定到 SUT 账号；`qa-channel` 不会加载到子进程中。
5. 按顺序运行场景，并通过 driver/observer Matrix 客户端观察事件。
6. 关闭 homeserver，写入报告和摘要构件，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用标志

| 标志                  | 默认值                                       | 描述                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 场景配置文件。请参阅 [配置文件](#profiles)。                                                                           |
| `--fail-fast`         | 关闭                                           | 在第一个失败的检查或场景之后停止。                                                                         |
| `--scenario <id>`     | —                                             | 只运行此场景。可重复。请参阅 [场景](#scenarios)。                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 写入报告、摘要、观察到的事件和输出日志的位置。相对路径会基于 `--repo-root` 解析。 |
| `--repo-root <path>`  | `process.cwd()`                               | 从中性工作目录调用时的仓库根目录。                                                        |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 网关配置中的 Matrix 账号 id。                                                                        |

### 提供商标志

该测试通道使用真实的 Matrix 传输，但模型提供商可配置：

| 标志                     | 默认值          | 描述                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用于确定性的模拟分发，`live-frontier` 用于实时前沿提供商。旧别名 `live-openai` 仍可使用。 |
| `--model <ref>`          | 提供商默认值 | 主 `provider/model` 引用。                                                                                                             |
| `--alt-model <ref>`      | 提供商默认值 | 场景在运行中切换时使用的备用 `provider/model` 引用。                                                                            |
| `--fast`                 | 关闭              | 在支持时启用提供商快速模式。                                                                                                |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。该测试通道会在本地预配一次性用户；没有可供租用的共享凭证池。

## 配置文件

所选配置文件决定运行哪些场景。

| 配置文件         | 用途                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（默认） | 完整目录。较慢但覆盖全面。                                                                                                                                                                                                   |
| `fast`          | 发布门禁子集，用于演练实时传输契约：canary、提及门控、allowlist 拦截、回复形状、重启恢复、线程跟进、线程隔离、反应观察，以及 exec 审批元数据投递。 |
| `transport`     | 传输级线程、私信、房间、自动加入、提及/allowlist、审批和反应场景。                                                                                                                                  |
| `media`         | 图片、音频、视频、PDF、EPUB 附件覆盖。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最小 E2EE 覆盖：基本加密回复、线程跟进、引导成功。                                                                                                                                                  |
| `e2ee-deep`     | 全面的 E2EE 状态丢失、备份、密钥和恢复场景。                                                                                                                                                                     |
| `e2ee-cli`      | 通过 QA harness 驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。                                                                                                                                       |

确切映射位于 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 场景

完整场景 id 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` union。类别包括：

- 线程：`matrix-thread-*`、`matrix-subagent-thread-spawn`
- 顶层 / 私信 / 房间：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 流式传输和工具进度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- 媒体：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- 路由：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- 反应：`matrix-reaction-*`
- 审批：`matrix-approval-*`（exec/插件元数据、分块 fallback、拒绝反应、线程，以及 `target: "both"` 路由）
- 重启和重放：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- 提及门控、bot 到 bot，以及 allowlist：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（基本回复、线程跟进、引导、恢复密钥生命周期、状态丢失变体、服务器备份行为、设备卫生、SAS / QR / 私信验证、重启、构件脱敏）
- E2EE CLI：`matrix-e2ee-cli-*`（加密设置、幂等设置、引导失败、恢复密钥生命周期、多账号、Gateway 网关回复往返、自验证）

传入 `--scenario <id>`（可重复）可运行手动挑选的一组场景；与 `--profile all` 结合使用可忽略配置文件门控。

## 环境变量

| 变量                                    | 默认值                                    | 作用                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分钟）                      | 整个运行的硬性上限。                                                                                                                                                                          |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始金丝雀回复的上限。Release CI 会在共享运行器上提高此值，以免缓慢的首次 Gateway 网关轮次在场景覆盖开始前就失败。                                                                            |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用于否定式无回复断言的静默窗口。会被限制为 `≤` 运行超时。                                                                                                                                     |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 清理的上限。失败输出中会包含恢复用的 `docker compose ... down --remove-orphans` 命令。                                                                                                 |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 在针对其他 Tuwunel 版本验证时，覆盖 homeserver 镜像。                                                                                                                                         |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 开启                                      | `0` 会静默 stderr 上的 `[matrix-qa] ...` 进度行。`1` 会强制开启。                                                                                                                             |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已脱敏                                    | `1` 会在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认会脱敏，以保证 CI 构件安全。                                                                                 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 关闭                                      | `1` 会跳过构件写入后的确定性 `process.exit`。默认会强制退出，因为 matrix-js-sdk 的原生加密句柄可能让事件循环在构件完成后仍保持活动。                                                         |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未设置                                    | 当由外层启动器（例如 `scripts/run-node.mjs`）设置时，Matrix QA 会复用该日志路径，而不是启动自己的 tee。                                                                                       |

## 输出构件

写入到 `--output-dir`：

- `matrix-qa-report.md` — Markdown 协议报告（哪些通过、失败、被跳过，以及原因）。
- `matrix-qa-summary.json` — 适合 CI 解析和仪表板使用的结构化摘要。
- `matrix-qa-observed-events.json` — 来自驱动程序和观察者客户端的已观察 Matrix 事件。除非设置 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文会被脱敏；审批元数据会用选定的安全字段和截断后的命令预览进行汇总。
- `matrix-qa-output.log` — 本次运行的合并 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则会改为复用外层启动器的日志。

默认输出目录是 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此连续运行不会相互覆盖。

## 分诊提示

- **运行在接近结束时挂起：** `matrix-js-sdk` 原生加密句柄可能比 harness 存活更久。默认会在构件写入后强制执行干净的 `process.exit`；如果你已取消设置 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，预计进程会继续停留。
- **清理错误：** 查找打印出的恢复命令（一次 `docker compose ... down --remove-orphans` 调用），并手动运行它以释放 homeserver 端口。
- **CI 中的否定断言窗口不稳定：** 当 CI 速度较快时，降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认 8 秒）；在较慢的共享运行器上提高它。
- **错误报告需要未脱敏正文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行，并附上 `matrix-qa-observed-events.json`。将生成的构件视为敏感内容。
- **不同的 Tuwunel 版本：** 将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向正在测试的版本。该通道只签入固定的默认镜像。

## 实时传输契约

Matrix 是三个实时传输通道（Matrix、Telegram、Discord）之一，它们共享 [QA overview → 实时传输覆盖范围](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage) 中定义的单一契约清单。`qa-channel` 仍是广泛的合成套件，并且有意不属于该矩阵。

## 相关

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 整体 QA 栈和实时传输契约
- [QA 渠道](/zh-CN/channels/qa-channel) — 用于仓库支持场景的合成渠道适配器
- [测试](/zh-CN/help/testing) — 运行测试并添加 QA 覆盖
- [Matrix](/zh-CN/channels/matrix) — 正在测试的渠道插件

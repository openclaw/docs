---
read_when:
    - 在本地运行 pnpm openclaw qa matrix
    - 添加或选择 Matrix QA 场景
    - 排查 Matrix QA 失败、超时或卡住的清理
summary: Docker 支撑的 Matrix 实时 QA 通道维护者参考：CLI、配置档案、环境变量、场景和输出产物。
title: Matrix QA
x-i18n:
    generated_at: "2026-07-05T11:15:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 012b07c4453cd2a206192e2c8caec6e0a7377796f94839a00282a6779a6cab88
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 通道会在 Docker 中使用一次性 Tuwunel homeserver 运行内置的 `@openclaw/matrix` 插件，并配备临时 driver、SUT 和 observer 账号以及预置房间。它是 Matrix 的真实传输层现场覆盖。

仅限维护者使用的工具。打包的 OpenClaw 发布版会省略 `qa-lab`，因此 `openclaw qa` 只能从源码检出中运行，并且会直接加载内置 runner，无需插件安装步骤。

如需更广泛的 QA 框架背景，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

普通的 `pnpm openclaw qa matrix` 会运行 `--profile all`，且不会在首次失败时停止。可使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 将完整清单分片到并行作业中。

## 该通道做什么

1. 在 Docker 中预置一次性 Tuwunel homeserver（默认镜像 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名 `matrix-qa.test`，端口 `28008`），并置于有界的请求/响应脱敏记录器后面。
2. 注册三个临时用户：`driver`（发送入站流量）、`sut`（被测 OpenClaw Matrix 账号）、`observer`（第三方流量捕获）。
3. 预置所选场景所需的房间（main、threading、media、restart、secondary、allowlist、E2EE、verification DM 等）。
4. 针对已记录的 Tuwunel 边界运行与底层无关的 `matrix-qa-v1` 协议探针。单元测试通过 Matrix 协议 fixture 证明探针契约；[#99707](https://github.com/openclaw/openclaw/pull/99707) 中的规范 QA 传输适配器宿主负责真实 Crabline 目标接线。
5. 启动一个子 OpenClaw Gateway 网关，并将真实 Matrix 插件限定到 SUT 账号。
6. 按顺序运行场景，通过 driver/observer Matrix 客户端观察事件，并从记录的流量中推导路由/状态预期。
7. 关闭 homeserver，写入报告和证据产物，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用标志

| 标志                  | 默认值                                        | 描述                                                                                                                                   |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 场景配置。请参阅 [配置](#profiles)。                                                                                                   |
| `--fail-fast`         | 关闭                                          | 在第一个检查或场景失败后停止。                                                                                                         |
| `--scenario <id>`     | -                                             | 仅运行此场景。可重复使用。请参阅 [场景](#scenarios)。                                                                                  |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 写入报告、摘要、路由/状态清单、观测事件和输出日志的位置。相对路径会基于 `--repo-root` 解析。                                          |
| `--repo-root <path>`  | `process.cwd()`                               | 从中立工作目录调用时的仓库根目录。                                                                                                     |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 网关配置中的 Matrix 账号 ID。                                                                                               |

### 提供商标志

该通道使用真实 Matrix 传输，但模型提供商可配置：

| 标志                     | 默认值           | 描述                                                                                                                               |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用于确定性的模拟调度，`live-frontier` 用于实时前沿提供商。旧版别名 `live-openai` 仍可使用。                         |
| `--model <ref>`          | 提供商默认值     | 主 `provider/model` 引用。                                                                                                         |
| `--alt-model <ref>`      | 提供商默认值     | 场景在运行中切换时使用的备用 `provider/model` 引用。                                                                               |
| `--fast`                 | 关闭             | 在支持的位置启用提供商快速模式。                                                                                                   |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。该通道会在本地预置一次性用户；没有可供租用的共享凭证池。

## 配置

| 配置            | 用途                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（默认）   | 完整目录。较慢但覆盖全面。                                                                                                                                                                                                           |
| `fast`          | 发布门禁子集，用于测试真实传输契约：canary、提及门控、allowlist 阻断、回复形状、重启恢复、线程跟进、线程隔离、表情回应观察，以及 exec 审批元数据交付。                |
| `transport`     | 传输层线程、私信、房间、自动加入、提及/allowlist、审批和表情回应场景。                                                                                                                                                              |
| `media`         | 图片、音频、视频、PDF、EPUB 附件覆盖。                                                                                                                                                                                              |
| `e2ee-smoke`    | 最小 E2EE 覆盖：基本加密回复、线程跟进、引导成功。                                                                                                                                                                                  |
| `e2ee-deep`     | 全面的 E2EE 状态丢失、备份、密钥和恢复场景。                                                                                                                                                                                        |
| `e2ee-cli`      | 通过 QA harness 驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。                                                                                                                                                   |

确切映射位于 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 场景

完整场景 ID 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` 中的 `MatrixQaScenarioId` 联合类型。类别：

- 线程：`matrix-thread-*`、`matrix-subagent-thread-spawn`
- 顶层 / 私信 / 房间：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 流式传输和工具进度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- 媒体：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- 路由：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- 表情回应：`matrix-reaction-*`
- 审批：`matrix-approval-*`（exec/插件元数据、分块 fallback、拒绝表情回应、线程，以及 `target: "both"` 路由）
- 重启和重放：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- 提及门控、bot 到 bot，以及 allowlist：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（基本回复、线程跟进、引导、恢复密钥生命周期、状态丢失变体、服务器备份行为、设备卫生、SAS / QR / 私信验证、重启、产物脱敏）
- E2EE CLI：`matrix-e2ee-cli-*`（加密设置、幂等设置、引导失败、恢复密钥生命周期、多账号、Gateway 网关回复往返、自验证）

传入 `--scenario <id>`（可重复使用）以运行手动选择的集合；与 `--profile all` 组合可忽略配置门控。

## 环境变量

| 变量                                    | 默认值                                    | 作用                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分钟）                      | 整个运行的硬性上限。                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始金丝雀回复的时限。Release CI 会在共享 runner 上提高此值，这样较慢的首次 Gateway 网关轮次不会在场景覆盖开始前失败。                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用于负向无回复断言的静默窗口。会被限制为 `<=` 运行超时时间。                                                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 拆除的时限。失败输出会包含恢复用的 `docker compose ... down --remove-orphans` 命令。                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 在针对其他 Tuwunel 版本验证时，覆盖 homeserver 镜像。                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 开启                                      | `0` 会静默 stderr 上的 `[matrix-qa] ...` 进度行。`1` 会强制开启它们。                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已脱敏                                    | `1` 会在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认会脱敏以确保 CI 工件安全。                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 关闭                                      | `1` 会在写入工件后跳过确定性的 `process.exit`。默认会强制退出，因为 matrix-js-sdk 的原生加密句柄可能让事件循环在工件完成后仍保持活动。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未设置                                    | 当外层启动器（例如 `scripts/run-node.mjs`）设置时，Matrix QA 会复用该日志路径，而不是启动自己的 tee。                                                                   |

## 输出工件

写入 `--output-dir`（默认 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此连续运行不会相互覆盖）：

- `matrix-qa-report.md`：Markdown 协议报告（哪些通过、失败、被跳过，以及原因）。
- `matrix-qa-summary.json`：适合 CI 解析和仪表板使用的结构化摘要。
- `matrix-qa-route-state-manifest.json`：按场景 ID 索引的动态 `matrix-qa-v1` 清单。它记录本次运行期间观察到的已脱敏路由/正文形状、请求顺序、重试、错误、同步令牌连续性，以及设备/密钥/媒体/备份状态族。这是可执行证据，而不是签入的基线。
- `matrix-qa-observed-events.json`：来自驱动和观察者客户端的已观察 Matrix 事件。除非设置 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文会被脱敏；审批元数据会用选定的安全字段和截断的命令预览进行摘要。
- `matrix-qa-output.log`：本次运行合并的 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则会改为复用外层启动器的日志。

## 分诊提示

- **运行在接近结束时挂起：**`matrix-js-sdk` 原生加密句柄可能比 harness 存活更久。默认会在工件写入后强制执行干净的 `process.exit`；如果你设置 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，预期进程会继续停留一段时间。
- **清理错误：**查找打印出的恢复命令（一次 `docker compose ... down --remove-orphans` 调用），并手动运行它来释放 homeserver 端口。
- **CI 中负向断言窗口不稳定：**当 CI 较快时，降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认 8 秒）；在较慢的共享 runner 上提高它。
- **错误报告需要已脱敏正文：**使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行，并附上 `matrix-qa-observed-events.json`。将生成的工件视为敏感内容处理。
- **不同的 Tuwunel 版本：**将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向被测版本。该 lane 只签入固定的默认镜像。

## 实时传输契约

Matrix 是三个实时传输 lane（Matrix、Telegram、Discord）之一，它们共享 [QA overview：实时传输覆盖](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage) 中定义的单一契约检查清单。`qa-channel` 仍然是宽泛的合成套件，并且有意不属于该矩阵。

## 相关

- [QA overview](/zh-CN/concepts/qa-e2e-automation)：整体 QA 栈和实时传输契约
- [QA Channel](/zh-CN/channels/qa-channel)：用于仓库支持场景的合成渠道适配器
- [测试](/zh-CN/help/testing)：运行测试并添加 QA 覆盖
- [Matrix](/zh-CN/channels/matrix)：被测渠道插件

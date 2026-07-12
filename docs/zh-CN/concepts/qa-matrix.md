---
read_when:
    - 在本地运行 pnpm openclaw qa matrix
    - 添加或选择 Matrix QA 场景
    - 排查 Matrix QA 失败、超时或清理卡住问题
summary: Docker 支持的 Matrix 实时 QA 通道维护者参考：CLI、配置文件、环境变量、场景和输出工件。
title: Matrix QA
x-i18n:
    generated_at: "2026-07-12T14:25:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 通道在 Docker 中针对一次性 Tuwunel 主服务器运行内置的 `@openclaw/matrix` 插件，并使用临时的驱动程序、SUT 和观察者账号以及预置房间。它为 Matrix 提供使用真实传输的实时覆盖。

仅限维护者使用的工具。打包后的 OpenClaw 发行版不包含 `qa-lab`，因此 `openclaw qa` 只能从源码检出中运行；它会直接加载内置运行器，无需执行插件安装步骤。

有关更广泛的 QA 框架背景，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

直接运行 `pnpm openclaw qa matrix` 会使用 `--profile all`，并且不会在首次失败时停止。使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 将完整清单拆分到并行作业中。

## 该通道执行的操作

1. 在 Docker 中预配一次性 Tuwunel 主服务器（默认镜像为 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名称为 `matrix-qa.test`，端口为 `28008`），并置于有界的脱敏请求/响应记录器之后。
2. 注册三个临时用户：`driver`（发送入站流量）、`sut`（被测 OpenClaw Matrix 账号）、`observer`（捕获第三方流量）。
3. 预置所选场景所需的房间（主房间、线程、媒体、重启、次要房间、允许列表、E2EE、验证私信等）。
4. 针对已记录的 Tuwunel 边界运行与底层无关的 `matrix-qa-v1` 协议探针。单元测试使用 Matrix 协议固件验证探针契约；[#99707](https://github.com/openclaw/openclaw/pull/99707) 中的规范 QA 传输适配器宿主负责真实 Crabline 目标接线。
5. 启动一个子 OpenClaw Gateway 网关，其中真实 Matrix 插件的作用域限定为 SUT 账号。
6. 按顺序运行场景，通过驱动程序/观察者 Matrix 客户端观察事件，并根据记录的流量推导路由/状态预期。
7. 拆除主服务器，写入报告和证据工件，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用标志

| 标志                  | 默认值                                        | 说明                                                                                                                                           |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 场景配置文件。请参阅[配置文件](#profiles)。                                                                                                    |
| `--fail-fast`         | 关闭                                          | 在第一个失败的检查或场景后停止。                                                                                                               |
| `--scenario <id>`     | -                                             | 仅运行此场景。可重复使用。请参阅[场景](#scenarios)。                                                                                           |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 写入报告、摘要、路由/状态清单、观察到的事件和输出日志的位置。相对路径基于 `--repo-root` 解析。                                                   |
| `--repo-root <path>`  | `process.cwd()`                               | 从中立工作目录调用时使用的仓库根目录。                                                                                                         |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 网关配置中的 Matrix 账号 ID。                                                                                                       |

### 提供商标志

该通道使用真实 Matrix 传输，但模型提供商可配置：

| 标志                     | 默认值           | 说明                                                                                                                                         |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` 用于确定性的模拟分派，`live-frontier` 用于实时前沿提供商。旧版别名 `live-openai` 仍然有效。                                      |
| `--model <ref>`          | 提供商默认值     | 主要 `provider/model` 引用。                                                                                                                  |
| `--alt-model <ref>`      | 提供商默认值     | 场景在运行过程中切换时使用的备用 `provider/model` 引用。                                                                                      |
| `--fast`                 | 关闭             | 在支持的情况下启用提供商快速模式。                                                                                                            |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。该通道在本地预配一次性用户；不存在可供租用的共享凭据池。

## 配置文件

| 配置文件        | 用途                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`（默认）   | 完整目录。速度较慢，但覆盖全面。                                                                                                                                                                                      |
| `fast`          | 发布门禁子集，用于验证命令式实时传输契约：提及门控、允许列表阻止、回复形态、重启恢复、表情回应观察、Exec 审批元数据交付以及 E2EE 基本回复。                                                                             |
| `transport`     | 传输层线程、私信、房间、自动加入、提及/允许列表、审批和表情回应场景。                                                                                                                                                 |
| `media`         | 图像、音频、视频、PDF、EPUB 附件覆盖。                                                                                                                                                                                |
| `e2ee-smoke`    | 最低限度的 E2EE 覆盖：基本加密回复、线程跟进、引导启动成功。                                                                                                                                                          |
| `e2ee-deep`     | 全面的 E2EE 状态丢失、备份、密钥和恢复场景。                                                                                                                                                                         |
| `e2ee-cli`      | 通过 QA 测试框架驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。                                                                                                                                    |

确切映射位于 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 场景

共享 Matrix 适配器通过 `openclaw qa suite --channel-driver live --channel matrix` 提供以下规范 YAML 场景：

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` 仍可通过显式选择 `--scenario subagent-thread-spawn`
来使用，但在实时子项完成证明稳定之前，它不属于默认的共享 Matrix 集合。

其余命令式场景 ID 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` 中的 `MatrixQaScenarioId` 联合类型。类别如下：

- 线程：`matrix-thread-root-preservation`、`matrix-thread-nested-reply-shape`
- 顶层 / 私信 / 房间：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 流式传输和工具进度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- 媒体：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- 路由：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- 表情回应：`matrix-reaction-*`
- 审批：`matrix-approval-*`（Exec/插件元数据、分块回退、拒绝表情回应、线程以及 `target: "both"` 路由）
- 重启和重放：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- 提及门控、Bot 对 Bot 和允许列表：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（基本回复、线程跟进、引导启动、恢复密钥生命周期、状态丢失变体、服务器备份行为、设备清理、SAS / QR / 私信验证、重启、工件脱敏）
- E2EE CLI：`matrix-e2ee-cli-*`（加密设置、幂等设置、引导启动失败、恢复密钥生命周期、多账号、Gateway 网关回复往返、自我验证）

传入 `--scenario <id>`（可重复使用）以运行手动选择的场景集合；与 `--profile all` 组合使用可忽略配置文件门控。

## 环境变量

| 变量                                    | 默认值                                    | 作用                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分钟）                      | 整次运行的硬性时间上限。                                                                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始金丝雀回复的时间限制。发布 CI 会在共享运行器上提高此值，以免首次 Gateway 网关轮次较慢，导致场景覆盖开始前就失败。                                                                             |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用于“无回复”否定断言的静默窗口。该值会限制为 `<=` 运行超时时间。                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 拆除的时间限制。失败信息中会包含用于恢复的 `docker compose ... down --remove-orphans` 命令。                                                                                             |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 针对其他 Tuwunel 版本进行验证时，覆盖主服务器镜像。                                                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 开启                                      | `0` 会禁止在 stderr 中输出 `[matrix-qa] ...` 进度行。`1` 会强制启用这些进度行。                                                                                                                |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已脱敏                                    | `1` 会在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认会进行脱敏，以确保 CI 工件安全。                                                                               |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 关闭                                      | `1` 会跳过写入工件后的确定性 `process.exit`。默认会强制退出，因为 matrix-js-sdk 的原生加密句柄可能会在工件完成后继续保持事件循环运行。                                                          |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未设置                                    | 当外层启动器（例如 `scripts/run-node.mjs`）设置此变量时，Matrix QA 会复用该日志路径，而不会自行启动 tee。                                                                                       |

## 输出工件

写入 `--output-dir`（默认为 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此连续运行不会相互覆盖）：

- `matrix-qa-report.md`：Markdown 协议报告（哪些项目通过、失败或被跳过，以及原因）。
- `matrix-qa-summary.json`：适合 CI 解析和仪表板使用的结构化摘要。
- `matrix-qa-route-state-manifest.json`：按场景 ID 索引的动态 `matrix-qa-v1` 清单。它记录该次运行期间观测到的已脱敏路由/正文结构、请求顺序、重试、错误、同步令牌连续性，以及设备/密钥/媒体/备份状态族。这是可执行证据，而不是签入仓库的基线。
- `matrix-qa-observed-events.json`：从驱动客户端和观察客户端观测到的 Matrix 事件。除非设置 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文会被脱敏；审批元数据会使用选定的安全字段和截断的命令预览进行摘要。
- `matrix-qa-output.log`：运行期间合并的 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则改为复用外层启动器的日志。

## 分类排查提示

- **运行在接近结束时挂起：** `matrix-js-sdk` 的原生加密句柄可能比测试工具存活得更久。默认会在写入工件后强制执行干净的 `process.exit`；如果设置 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，预计进程会继续停留一段时间。
- **清理错误：** 查找输出的恢复命令（一次 `docker compose ... down --remove-orphans` 调用），并手动运行它以释放主服务器端口。
- **CI 中的否定断言窗口不稳定：** CI 较快时，降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认为 8 秒）；在较慢的共享运行器上则提高此值。
- **错误报告需要已脱敏的正文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行，并附上 `matrix-qa-observed-events.json`。请将生成的工件视为敏感内容。
- **使用其他 Tuwunel 版本：** 将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向待测试的版本。该通道仅签入固定的默认镜像。

## 实时传输契约

Matrix 是三个实时传输通道（Matrix、Telegram、Discord）之一，它们共享 [QA overview：实时传输覆盖范围](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)中定义的同一份契约检查清单。`qa-channel` 仍是广泛的合成测试套件，并且有意不属于该矩阵。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation)：整体 QA 技术栈和实时传输契约
- [QA channel](/zh-CN/channels/qa-channel)：用于仓库支持场景的合成渠道适配器
- [测试](/zh-CN/help/testing)：运行测试并添加 QA 覆盖
- [Matrix](/zh-CN/channels/matrix)：正在测试的渠道插件

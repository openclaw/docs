---
read_when:
    - 在本地运行 pnpm openclaw qa matrix
    - 添加或选择 Matrix QA 场景
    - 排查 Matrix QA 失败、超时或清理卡住问题
summary: 基于 Docker 的 Matrix 实时 QA 通道维护者参考：CLI、配置文件、环境变量、场景和输出产物。
title: Matrix QA
x-i18n:
    generated_at: "2026-07-11T20:30:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA 通道在 Docker 中针对一次性 Tuwunel 主服务器运行内置的 `@openclaw/matrix` 插件，并使用临时的驱动、被测系统和观察者账户以及预置房间。它为 Matrix 提供使用真实传输协议的实时覆盖。

仅供维护者使用的工具。打包的 OpenClaw 发行版不包含 `qa-lab`，因此 `openclaw qa` 只能从源代码检出中运行；它会直接加载内置运行器，无需执行插件安装步骤。

有关更广泛的 QA 框架背景，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

直接运行 `pnpm openclaw qa matrix` 会使用 `--profile all`，且不会在首次失败时停止。可使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 将完整清单分片到多个并行作业中。

## 此通道的工作内容

1. 在 Docker 中配置一个一次性 Tuwunel 主服务器（默认镜像为 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名称为 `matrix-qa.test`，端口为 `28008`），并将其置于一个有界、会执行脱敏的请求/响应记录器之后。
2. 注册三个临时用户：`driver`（发送入站流量）、`sut`（接受测试的 OpenClaw Matrix 账户）和 `observer`（捕获第三方流量）。
3. 预置所选场景所需的房间（主房间、话题串、媒体、重启、次要房间、允许列表、E2EE、验证私信等）。
4. 针对记录的 Tuwunel 边界运行与底层环境无关的 `matrix-qa-v1` 协议探针。单元测试使用 Matrix 协议固件验证探针契约；[#99707](https://github.com/openclaw/openclaw/pull/99707) 中的规范 QA 传输适配器宿主负责真实 Crabline 目标的接线。
5. 启动一个子 OpenClaw Gateway 网关，其中真实 Matrix 插件的作用域限定为被测系统账户。
6. 按顺序运行场景，通过驱动和观察者 Matrix 客户端观察事件，并根据记录的流量推导路由和状态预期。
7. 拆除主服务器，写入报告和证据产物，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用标志

| 标志                  | 默认值                                        | 说明                                                                                                                                       |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | 场景配置集。请参阅[配置集](#profiles)。                                                                                                    |
| `--fail-fast`         | 关闭                                          | 在首次检查或场景失败后停止。                                                                                                               |
| `--scenario <id>`     | -                                             | 仅运行此场景。可重复指定。请参阅[场景](#scenarios)。                                                                                        |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 写入报告、摘要、路由/状态清单、观测到的事件和输出日志的位置。相对路径以 `--repo-root` 为基准解析。                                           |
| `--repo-root <path>`  | `process.cwd()`                               | 从中立工作目录调用时使用的仓库根目录。                                                                                                     |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 网关配置中的 Matrix 账户 ID。                                                                                                   |

### 提供商标志

此通道使用真实 Matrix 传输协议，但模型提供商可配置：

| 标志                     | 默认值           | 说明                                                                                                                                                       |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | 使用 `mock-openai` 进行确定性的模拟分派，或使用 `live-frontier` 调用实时前沿提供商。旧版别名 `live-openai` 仍然有效。                                        |
| `--model <ref>`          | 提供商默认值     | 主要 `provider/model` 引用。                                                                                                                               |
| `--alt-model <ref>`      | 提供商默认值     | 场景在运行期间切换模型时使用的备用 `provider/model` 引用。                                                                                                 |
| `--fast`                 | 关闭             | 在支持的情况下启用提供商快速模式。                                                                                                                         |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。此通道会在本地配置一次性用户；没有可供租用的共享凭据池。

## 配置集

| 配置集          | 用途                                                                                                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`（默认）   | 完整目录。速度较慢，但覆盖全面。                                                                                                                                                                                           |
| `fast`          | 用于发布门禁的子集，用于检验命令式实时传输契约：提及门控、允许列表拦截、回复结构、重启后续接、表情回应观察、Exec 审批元数据传递和 E2EE 基础回复。                                                                            |
| `transport`     | 传输层的话题串、私信、房间、自动加入、提及/允许列表、审批和表情回应场景。                                                                                                                                                  |
| `media`         | 图像、音频、视频、PDF 和 EPUB 附件覆盖。                                                                                                                                                                                   |
| `e2ee-smoke`    | 最低限度的 E2EE 覆盖：基础加密回复、话题串跟进、引导启动成功。                                                                                                                                                             |
| `e2ee-deep`     | 全面的 E2EE 状态丢失、备份、密钥和恢复场景。                                                                                                                                                                              |
| `e2ee-cli`      | 通过 QA 测试框架驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。                                                                                                                                         |

确切映射位于 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## 场景

共享 Matrix 适配器通过 `openclaw qa suite --channel-driver live --channel matrix` 公开以下规范 YAML 场景：

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

仍可通过显式选择 `--scenario subagent-thread-spawn` 来使用 `subagent-thread-spawn`，但在实时子任务完成证明稳定之前，它不属于默认的共享 Matrix 场景集。

其余命令式场景 ID 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` 中的 `MatrixQaScenarioId` 联合类型。分类如下：

- 话题串：`matrix-thread-root-preservation`、`matrix-thread-nested-reply-shape`
- 顶层 / 私信 / 房间：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 流式传输和工具进度：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- 媒体：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- 路由：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- 表情回应：`matrix-reaction-*`
- 审批：`matrix-approval-*`（Exec/插件元数据、分块回退、拒绝表情回应、话题串以及 `target: "both"` 路由）
- 重启和重放：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- 提及门控、Bot 间通信和允许列表：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（基础回复、话题串跟进、引导启动、恢复密钥生命周期、状态丢失变体、服务器备份行为、设备卫生、SAS / QR / 私信验证、重启、产物脱敏）
- E2EE CLI：`matrix-e2ee-cli-*`（加密设置、幂等设置、引导启动失败、恢复密钥生命周期、多账户、Gateway 网关回复往返、自我验证）

传入 `--scenario <id>`（可重复指定）以运行手动挑选的场景集；与 `--profile all` 组合使用可忽略配置集门控。

## 环境变量

| 变量                                    | 默认值                                    | 作用                                                                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分钟）                      | 整次运行的硬性时间上限。                                                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初始金丝雀回复的时间上限。发布 CI 会在共享运行器上提高此值，以免首次 Gateway 网关轮次缓慢，导致场景覆盖开始前就失败。                                                                                    |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用于否定性无回复断言的静默窗口。最大不超过运行超时时间。                                                                                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 拆除的时间上限。失败信息中会包含用于恢复的 `docker compose ... down --remove-orphans` 命令。                                                                                                     |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 针对其他 Tuwunel 版本进行验证时，覆盖主服务器镜像。                                                                                                                                                     |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 开启                                      | `0` 会禁止在 stderr 中输出 `[matrix-qa] ...` 进度行。`1` 会强制启用。                                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已脱敏                                    | `1` 会在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认进行脱敏，以确保 CI 构件安全。                                                                                           |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 关闭                                      | `1` 会跳过构件写入后的确定性 `process.exit`。默认强制退出，因为 matrix-js-sdk 的原生加密句柄可能使事件循环在构件完成后仍保持运行。                                                                        |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未设置                                    | 由外层启动器（例如 `scripts/run-node.mjs`）设置时，Matrix QA 会复用该日志路径，而不会启动自己的 tee。                                                                                                    |

## 输出构件

写入 `--output-dir`（默认为 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此连续运行不会相互覆盖）：

- `matrix-qa-report.md`：Markdown 协议报告（哪些项目通过、失败或被跳过，以及原因）。
- `matrix-qa-summary.json`：适合 CI 解析和仪表板使用的结构化摘要。
- `matrix-qa-route-state-manifest.json`：按场景 ID 索引的动态 `matrix-qa-v1` 清单。它记录该次运行期间观察到的已脱敏路由/正文结构、请求顺序、重试、错误、同步令牌连续性，以及设备/密钥/媒体/备份状态系列。这是可执行的证据，而不是提交到仓库的基线。
- `matrix-qa-observed-events.json`：驱动客户端和观察客户端所观察到的 Matrix 事件。除非设置 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文会被脱敏；审批元数据会使用选定的安全字段和截断后的命令预览进行汇总。
- `matrix-qa-output.log`：该次运行合并后的 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则改为复用外层启动器的日志。

## 排查提示

- **运行接近结束时挂起：** `matrix-js-sdk` 的原生加密句柄可能比测试框架存活更久。默认会在构件写入后强制执行干净的 `process.exit`；如果设置 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，进程可能会继续停留。
- **清理错误：** 查找输出的恢复命令（一次 `docker compose ... down --remove-orphans` 调用），并手动运行它以释放主服务器端口。
- **CI 中否定性断言窗口不稳定：** CI 较快时，降低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认为 8 秒）；在缓慢的共享运行器上则提高该值。
- **错误报告需要包含已脱敏的正文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行，并附上 `matrix-qa-observed-events.json`。应将生成的构件视为敏感内容。
- **不同的 Tuwunel 版本：** 将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向待测试的版本。该测试通道仅提交固定的默认镜像。

## 实时传输契约

Matrix 是共享同一契约检查清单的三个实时传输测试通道（Matrix、Telegram、Discord）之一，该清单定义于 [QA overview：实时传输覆盖](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 仍是广泛的合成测试套件，并且有意不纳入该矩阵。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation)：整体 QA 技术栈和实时传输契约
- [QA channel](/zh-CN/channels/qa-channel)：用于仓库支持场景的合成渠道适配器
- [测试](/zh-CN/help/testing)：运行测试并添加 QA 覆盖
- [Matrix](/zh-CN/channels/matrix)：正在测试的渠道插件

---
read_when:
    - 在本地运行 `pnpm openclaw qa matrix`
    - 添加或选择 Matrix QA 场景
    - 排查 Matrix QA 失败、超时或卡住的清理流程
summary: Docker 支持的 Matrix 实时 QA 通道的维护者参考：CLI、配置文件、环境变量、场景和输出产物。
title: Matrix QA
x-i18n:
    generated_at: "2026-04-27T20:27:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55fcacd1348b681ef9e550d3f4cdf7c5ed3a2cb8d0df6d93b8ac025ec3280329
    source_path: concepts/qa-matrix.md
    workflow: 15
---

Matrix QA 通道会针对一次性 Docker 中的 Tuwunel homeserver 运行内置的 `@openclaw/matrix` 插件，并使用临时的驱动、SUT 和观察者账号以及预置房间。这是 Matrix 的实时传输覆盖。

这是仅供维护者使用的工具。打包后的 OpenClaw 发布版本会刻意省略 `qa-lab`，因此 `openclaw qa` 只能在源码检出环境中使用。源码检出会直接加载内置运行器——不需要安装插件。

有关更广泛的 QA 框架背景，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

直接运行 `pnpm openclaw qa matrix` 会使用 `--profile all`，并且不会在首次失败时停止。将 `--profile fast --fail-fast` 用于发布门禁；当你要并行运行完整场景清单时，可使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 对目录进行分片。

## 此通道会执行什么

1. 在 Docker 中创建一个一次性的 Tuwunel homeserver（默认镜像为 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名称为 `matrix-qa.test`，端口为 `28008`）。
2. 注册三个临时用户——`driver`（发送入站流量）、`sut`（被测的 OpenClaw Matrix 账号）、`observer`（第三方流量捕获）。
3. 为所选场景预置所需房间（主房间、线程房间、媒体房间、重启房间、次级房间、allowlist 房间、E2EE 房间、验证私信房间等）。
4. 启动一个子 OpenClaw Gateway 网关，并在其中加载限定到 SUT 账号的真实 Matrix 插件；子进程中不会加载 `qa-channel`。
5. 按顺序运行场景，并通过 driver/observer Matrix 客户端观察事件。
6. 清理 homeserver，写出报告和摘要产物，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用标志

| 标志 | 默认值 | 说明 |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all` | 场景配置文件。参见 [Profiles](#profiles)。 |
| `--fail-fast` | off | 在首次检查或场景失败后停止。 |
| `--scenario <id>` | — | 仅运行此场景。可重复使用。参见 [Scenarios](#scenarios)。 |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 报告、摘要、观测事件和输出日志的写入位置。相对路径会相对于 `--repo-root` 解析。 |
| `--repo-root <path>` | `process.cwd()` | 当你从中立工作目录调用时使用的仓库根目录。 |
| `--sut-account <id>` | `sut` | QA Gateway 网关配置中的 Matrix 账号 id。 |

### 提供商标志

该通道使用真实的 Matrix 传输，但模型提供商可配置：

| 标志 | 默认值 | 说明 |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier` | 使用 `mock-openai` 可获得确定性的 mock 调度，使用 `live-frontier` 可运行实时 frontier 提供商。旧别名 `live-openai` 仍然可用。 |
| `--model <ref>` | provider 默认值 | 主 `provider/model` 引用。 |
| `--alt-model <ref>` | provider 默认值 | 运行过程中场景切换时使用的备用 `provider/model` 引用。 |
| `--fast` | off | 在支持的情况下启用提供商快速模式。 |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。该通道会在本地创建一次性用户；没有可供租用的共享凭证池。

## Profiles

所选配置文件决定运行哪些场景。

| 配置文件 | 适用场景 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`（默认） | 完整目录。较慢，但覆盖最全面。 |
| `fast` | 用于发布门禁的子集，覆盖实时传输契约：canary、提及门控、allowlist 阻止、回复形态、重启恢复、线程后续跟进、线程隔离、reaction 观测。 |
| `transport` | 传输层级的线程、私信、房间、自动加入、提及/allowlist 场景。 |
| `media` | 图像、音频、视频、PDF、EPUB 附件覆盖。 |
| `e2ee-smoke` | 最小 E2EE 覆盖——基础加密回复、线程后续跟进、bootstrap 成功。 |
| `e2ee-deep` | 全面的 E2EE 状态丢失、备份、密钥和恢复场景。 |
| `e2ee-cli` | 通过 QA harness 驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。 |

精确映射位于 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## Scenarios

完整的场景 id 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` 联合类型。类别包括：

- threading —— `matrix-thread-*`、`matrix-subagent-thread-spawn`
- top-level / DM / room —— `matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- streaming and tool progress —— `matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- media —— `matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- routing —— `matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- reactions —— `matrix-reaction-*`
- restart and replay —— `matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- mention gating and allowlists —— `matrix-mention-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE —— `matrix-e2ee-*`（基础回复、线程后续跟进、bootstrap、恢复密钥生命周期、状态丢失变体、服务器备份行为、设备卫生、SAS / QR / 私信验证、重启、产物脱敏）
- E2EE CLI —— `matrix-e2ee-cli-*`（加密设置、幂等设置、bootstrap 失败、恢复密钥生命周期、多账号、Gateway 网关回复往返、自我验证）

传入 `--scenario <id>`（可重复）以运行一组手工挑选的场景；与 `--profile all` 组合使用可忽略配置文件门控。

## 环境变量

| 变量 | 默认值 | 作用 |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS` | `1800000`（30 分钟） | 整个运行过程的硬性最长时间上限。 |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000` | 用于否定性“无回复”断言的静默窗口。会被限制为 `≤` 运行超时时间。 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000` | Docker 清理的时间上限。失败信息中会包含恢复命令 `docker compose ... down --remove-orphans`。 |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 在针对不同 Tuwunel 版本进行验证时，用于覆盖 homeserver 镜像。 |
| `OPENCLAW_QA_MATRIX_PROGRESS` | on | `0` 会静默 stderr 上的 `[matrix-qa] ...` 进度行。`1` 会强制开启。 |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT` | redacted | `1` 会在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认会脱敏，以保证 CI 产物安全。 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | off | `1` 会跳过写入产物后的确定性 `process.exit`。默认会强制退出，因为 `matrix-js-sdk` 的原生加密句柄可能在产物写完后仍让事件循环保持活跃。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG` | unset | 当外层启动器设置了该值时（例如 `scripts/run-node.mjs`），Matrix QA 会复用该日志路径，而不是自行启动 tee。 |

## 输出产物

写入到 `--output-dir`：

- `matrix-qa-report.md` —— Markdown 协议报告（哪些通过、失败、跳过，以及原因）。
- `matrix-qa-summary.json` —— 适用于 CI 解析和仪表盘的结构化摘要。
- `matrix-qa-observed-events.json` —— 来自 driver 和 observer 客户端观测到的 Matrix 事件。除非设置了 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文会被脱敏。
- `matrix-qa-output.log` —— 运行过程中的合并 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则会改为复用外层启动器的日志。

默认输出目录为 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此连续运行不会互相覆盖。

## 排查提示

- **运行在接近结束时卡住：** `matrix-js-sdk` 的原生加密句柄可能会比 harness 存活得更久。默认行为是在写入产物后强制执行一次干净的 `process.exit`；如果你设置了 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，则应预期进程会继续挂住一段时间。
- **清理错误：** 查找打印出来的恢复命令（一个 `docker compose ... down --remove-orphans` 调用），然后手动运行它以释放 homeserver 端口。
- **CI 中否定断言窗口不稳定：** 当 CI 很快时，调低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认 8 秒）；在较慢的共享 runner 上则调高它。
- **需要为 bug 报告保留未脱敏正文：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行，并附上 `matrix-qa-observed-events.json`。请将生成的产物视为敏感内容。
- **不同的 Tuwunel 版本：** 将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向正在测试的版本。该通道仓库中只固定提交了默认钉住的镜像版本。

## 实时传输契约

Matrix 是三个实时传输通道之一（Matrix、Telegram、Discord），它们共享同一份契约检查清单，该清单定义于 [QA overview → Live transport coverage](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage)。`qa-channel` 仍然是覆盖范围更广的合成测试套件，并且被刻意排除在该矩阵之外。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation) —— 整体 QA 栈和实时传输契约
- [QA channel](/zh-CN/channels/qa-channel) —— 用于仓库驱动场景的合成渠道适配器
- [Testing](/zh-CN/help/testing) —— 运行测试和添加 QA 覆盖
- [Matrix](/zh-CN/channels/matrix) —— 正在测试的渠道插件

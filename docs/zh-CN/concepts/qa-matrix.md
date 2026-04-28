---
read_when:
    - 在本地运行 `pnpm openclaw qa matrix`
    - 添加或选择 Matrix QA 场景
    - 排查 Matrix QA 失败、超时或清理卡住的问题
summary: Docker 支持的 Matrix 实时 QA 通道的维护者参考：CLI、配置文件、环境变量、场景和输出工件。
title: Matrix QA
x-i18n:
    generated_at: "2026-04-28T03:22:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 440c24f2f1b19331f6800bb3224075f718c2429688bb023e96c59f3d3e4c4932
    source_path: concepts/qa-matrix.md
    workflow: 15
---

Matrix QA 通道会在 Docker 中针对一次性 Tuwunel homeserver 运行内置的 `@openclaw/matrix` 插件，并使用临时的 driver、SUT 和 observer 账号以及预置房间。它为 Matrix 提供基于真实传输的实时覆盖。

这是仅供维护者使用的工具。打包发布的 OpenClaw 版本会刻意省略 `qa-lab`，因此 `openclaw qa` 仅可在源码检出环境中使用。源码检出会直接加载内置 runner——不需要安装插件。

如需了解更广泛的 QA 框架背景，请参阅 [QA overview](/zh-CN/concepts/qa-e2e-automation)。

## 快速开始

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

直接运行 `pnpm openclaw qa matrix` 会使用 `--profile all`，并且不会在首次失败时停止。将 `--profile fast --fail-fast` 用作发布门禁；在并行运行完整清单时，可使用 `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` 对场景目录进行分片。

## 该通道会执行什么

1. 在 Docker 中预配一个一次性的 Tuwunel homeserver（默认镜像为 `ghcr.io/matrix-construct/tuwunel:v1.5.1`，服务器名为 `matrix-qa.test`，端口为 `28008`）。
2. 注册三个临时用户——`driver`（发送入站流量）、`sut`（待测的 OpenClaw Matrix 账号）、`observer`（第三方流量捕获）。
3. 为所选场景预置所需房间（main、threading、media、restart、secondary、allowlist、E2EE、verification 私信 等）。
4. 启动一个子 OpenClaw Gateway 网关，并将真实的 Matrix 插件限定到 SUT 账号；子进程中不会加载 `qa-channel`。
5. 按顺序运行场景，并通过 driver/observer Matrix 客户端观察事件。
6. 拆除 homeserver，写入报告和摘要工件，然后退出。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 常用标志

| 标志                  | 默认值                                        | 说明                                                                 |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | 场景配置文件。参见 [Profiles](#profiles)。                           |
| `--fail-fast`         | 关闭                                          | 在第一个失败的检查或场景后停止。                                     |
| `--scenario <id>`     | —                                             | 仅运行此场景。可重复指定。参见 [Scenarios](#scenarios)。             |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | 写入报告、摘要、观测事件和输出日志的位置。相对路径会相对于 `--repo-root` 解析。 |
| `--repo-root <path>`  | `process.cwd()`                               | 从中立工作目录调用时使用的仓库根目录。                               |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 网关配置中的 Matrix 账号 id。                             |

### 提供商标志

该通道使用真实的 Matrix 传输，但模型提供商可配置：

| 标志                     | 默认值           | 说明 |
| ------------------------ | ---------------- | ---- |
| `--provider-mode <mode>` | `live-frontier`  | 使用 `mock-openai` 进行确定性的 mock 分发，或使用 `live-frontier` 调用实时 frontier 提供商。旧别名 `live-openai` 仍然可用。 |
| `--model <ref>`          | 提供商默认值     | 主 `provider/model` 引用。 |
| `--alt-model <ref>`      | 提供商默认值     | 场景在运行过程中切换时使用的备用 `provider/model` 引用。 |
| `--fast`                 | 关闭             | 在支持时启用提供商快速模式。 |

Matrix QA 不接受 `--credential-source` 或 `--credential-role`。该通道会在本地预配一次性用户；没有可供租用的共享凭证池。

## Profiles

所选配置文件决定运行哪些场景。

| 配置文件        | 用途 |
| --------------- | ---- |
| `all`（默认）   | 完整目录。较慢，但覆盖最全面。 |
| `fast`          | 用于发布门禁的子集，覆盖实时传输契约：canary、mention gating、allowlist block、reply shape、restart resume、thread follow-up、thread isolation、reaction observation，以及 exec approval metadata delivery。 |
| `transport`     | 传输层的线程、私信、房间、autojoin、mention/allowlist、approval 和 reaction 场景。 |
| `media`         | 图片、音频、视频、PDF、EPUB 附件覆盖。 |
| `e2ee-smoke`    | 最小 E2EE 覆盖——基础加密回复、thread follow-up、bootstrap 成功。 |
| `e2ee-deep`     | 全面的 E2EE 状态丢失、备份、密钥和恢复场景。 |
| `e2ee-cli`      | 通过 QA harness 驱动的 `openclaw matrix encryption setup` 和 `verify *` CLI 场景。 |

精确映射位于 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`。

## Scenarios

完整场景 id 列表是 `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` 中的 `MatrixQaScenarioId` 联合类型。类别包括：

- threading —— `matrix-thread-*`、`matrix-subagent-thread-spawn`
- top-level / 私信 / room —— `matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- 流式传输和工具进度 —— `matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- media —— `matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- routing —— `matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- reactions —— `matrix-reaction-*`
- approvals —— `matrix-approval-*`（exec/plugin metadata、chunked fallback、deny reactions、threads，以及 `target: "both"` 路由）
- restart 和 replay —— `matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- mention gating 和 allowlists —— `matrix-mention-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE —— `matrix-e2ee-*`（基础回复、thread follow-up、bootstrap、recovery key 生命周期、state-loss 变体、服务器备份行为、设备卫生、SAS / QR / 私信 验证、重启、工件脱敏）
- E2EE CLI —— `matrix-e2ee-cli-*`（encryption setup、幂等 setup、bootstrap failure、recovery-key 生命周期、多账号、gateway-reply 往返、自验证）

传入 `--scenario <id>`（可重复）以运行手动挑选的一组场景；与 `--profile all` 组合使用可忽略配置文件门控。

## 环境变量

| 变量                                    | 默认值                                    | 作用 |
| --------------------------------------- | ----------------------------------------- | ---- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分钟）                      | 整个运行过程的硬性上限。 |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 用于否定性“无回复”断言的静默窗口。会被限制为 `≤` 运行超时。 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker 拆除的时间上限。失败表面包括恢复用的 `docker compose ... down --remove-orphans` 命令。 |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 在针对不同 Tuwunel 版本验证时覆盖 homeserver 镜像。 |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | 开启                                      | `0` 会静默 stderr 上的 `[matrix-qa] ...` 进度行。`1` 会强制开启。 |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 已脱敏                                    | `1` 会在 `matrix-qa-observed-events.json` 中保留消息正文和 `formatted_body`。默认会进行脱敏，以保证 CI 工件安全。 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | 关闭                                      | `1` 会跳过写入工件后的确定性 `process.exit`。默认会强制退出，因为 `matrix-js-sdk` 的原生加密句柄可能在工件写完后仍让事件循环保持存活。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未设置                                    | 当由外层启动器（例如 `scripts/run-node.mjs`）设置时，Matrix QA 会复用该日志路径，而不是启动自己的 tee。 |

## 输出工件

写入到 `--output-dir`：

- `matrix-qa-report.md` — Markdown 协议报告（哪些通过、失败、被跳过，以及原因）。
- `matrix-qa-summary.json` — 适合用于 CI 解析和仪表板的结构化摘要。
- `matrix-qa-observed-events.json` — 来自 driver 和 observer 客户端观测到的 Matrix 事件。除非设置 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`，否则正文会被脱敏；approval metadata 会以选定的安全字段和截断后的命令预览进行摘要。
- `matrix-qa-output.log` — 本次运行的合并 stdout/stderr。如果设置了 `OPENCLAW_RUN_NODE_OUTPUT_LOG`，则会改为复用外层启动器的日志。

默认输出目录是 `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`，因此连续运行不会互相覆盖。

## 排查提示

- **运行在接近结束时挂起：** `matrix-js-sdk` 的原生加密句柄可能在 harness 结束后仍然存活。默认行为是在写入工件后强制执行干净的 `process.exit`；如果你设置了 `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`，则应预期进程会继续停留。
- **清理错误：** 查找打印出来的恢复命令（一次 `docker compose ... down --remove-orphans` 调用），并手动运行它以释放 homeserver 端口。
- **CI 中否定断言窗口不稳定：** 当 CI 很快时，调低 `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（默认 8 秒）；在较慢的共享 runner 上则调高它。
- **需要带未脱敏正文的 bug 报告：** 使用 `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` 重新运行，并附上 `matrix-qa-observed-events.json`。请将生成的工件视为敏感信息。
- **不同的 Tuwunel 版本：** 将 `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` 指向待测试的版本。该通道仅签入了固定的默认镜像。

## 实时传输契约

Matrix 是三个实时传输通道之一（Matrix、Telegram、Discord），它们共享一份在 [QA overview → Live transport coverage](/zh-CN/concepts/qa-e2e-automation#live-transport-coverage) 中定义的统一契约检查清单。`qa-channel` 仍然是广覆盖的合成测试套件，并且有意不属于该矩阵的一部分。

## 相关内容

- [QA overview](/zh-CN/concepts/qa-e2e-automation) — 整体 QA 栈和实时传输契约
- [QA channel](/zh-CN/channels/qa-channel) — 用于基于仓库场景的合成渠道适配器
- [Testing](/zh-CN/help/testing) — 运行测试和添加 QA 覆盖
- [Matrix](/zh-CN/channels/matrix) — 被测的渠道插件

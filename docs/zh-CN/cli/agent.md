---
read_when:
    - 你希望从脚本运行一个智能体轮次（可选择发送回复）
summary: '`openclaw agent` 的 CLI 参考（通过 Gateway 网关发送一个智能体轮次）'
title: 智能体
x-i18n:
    generated_at: "2026-07-11T20:24:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

通过 Gateway 网关运行一轮智能体。如果 Gateway 网关请求失败，则回退到嵌入式智能体；传入 `--local` 可从一开始就强制执行嵌入式运行。

至少传入一个会话选择器：`--to`、`--session-key`、`--session-id` 或 `--agent`。

相关内容：[智能体发送工具](/zh-CN/tools/agent-send)

## 选项

- `-m, --message <text>`：消息正文
- `--message-file <path>`：从 UTF-8 文件读取消息正文
- `-t, --to <dest>`：用于派生会话键的接收方
- `--session-key <key>`：用于路由的显式会话键
- `--session-id <id>`：显式会话 ID
- `--agent <id>`：智能体 ID；覆盖路由绑定
- `--model <id>`：覆盖本次运行使用的模型（`provider/model` 或模型 ID）
- `--thinking <level>`：智能体思考级别（`off`、`minimal`、`low`、`medium`、`high`，以及提供商支持的自定义级别，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：持久保存会话的详细输出级别
- `--channel <channel>`：投递渠道；省略时使用主会话渠道
- `--reply-to <target>`：覆盖投递目标
- `--reply-channel <channel>`：覆盖投递渠道
- `--reply-account <id>`：覆盖投递账号
- `--local`：直接运行嵌入式智能体（在预加载插件注册表后）
- `--deliver`：将回复发送回所选渠道/目标
- `--timeout <seconds>`：覆盖智能体超时时间（默认为 600 秒或 `agents.defaults.timeoutSeconds`）；`0` 表示禁用超时
- `--json`：输出 JSON

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注意事项

- 必须且只能传入 `--message` 或 `--message-file` 其中之一。`--message-file` 会移除文件开头的 UTF-8 BOM 并保留多行内容；非有效 UTF-8 编码的文件会被拒绝。
- 斜杠命令（例如 `/compact`）无法通过 `--message` 运行。CLI 会拒绝此类命令，并指引你改用对应的一级命令（压缩操作使用 `openclaw sessions compact <key>`）。
- `--local` 和嵌入式回退运行均为一次性运行：本次运行打开的内置 MCP loopback 资源和预热的 Claude stdio 会话会在回复后关闭，因此脚本调用不会留下本地子进程继续运行。使用 Gateway 网关的运行则会在运行中的 Gateway 网关进程内保留由其管理的 MCP loopback 资源。
- 同时使用 `--agent`、`--channel` 和 `--to` 时，会话路由遵循渠道的规范接收方和 `session.dmScope`。具有稳定的仅出站接收方身份的渠道使用由提供商管理的会话，该会话与智能体的主会话隔离。`--reply-channel` 和 `--reply-account` 仅影响投递。
- `--session-key` 用于选择显式会话键。带智能体前缀的键必须采用 `agent:<agent-id>:<session-key>` 格式；同时提供两者时，`--agent` 必须与键中的智能体 ID 匹配。提供 `--agent` 时，不带前缀且并非哨兵值的键归属于该智能体；否则归属于已配置的默认智能体。例如，`--agent ops --session-key incident-42` 会路由至 `agent:ops:incident-42`。仅当未提供 `--agent` 时，字面键 `global` 和 `unknown` 才保持无作用域状态。
- `--json` 会保留 stdout 用于输出 JSON 响应；Gateway 网关、插件和嵌入式回退的诊断信息会写入 stderr，以便脚本直接解析 stdout。
- 嵌入式回退 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，便于脚本检测回退运行。
- 如果 Gateway 网关接受了运行，但 CLI 在等待最终回复时超时，嵌入式回退会使用全新的 `gateway-fallback-*` 会话/运行 ID，并报告 `meta.fallbackReason: "gateway_timeout"` 及回退会话字段，而不会与 Gateway 网关管理的记录争用或静默替换原始会话。
- `SIGTERM`/`SIGINT` 会中断正在等待的、由 Gateway 网关支持的请求；如果 Gateway 网关已接受运行，CLI 还会在退出前针对该运行 ID 发送 `chat.abort`。`--local` 和嵌入式回退运行会收到相同信号，但不会发送 `chat.abort`。如果内部运行去重键已存在该会话的活动运行，响应会报告 `status: "in_flight"`，且非 JSON CLI 会向 stderr 输出诊断信息，而不是返回空回复。对于外部 cron/systemd 包装器，应保留硬终止兜底措施，例如 `timeout -k 60 600 openclaw agent ...`，以便在关闭流程无法完成时由监管程序回收该进程。
- 当此命令触发重新生成 `models.json` 时，由 SecretRef 管理的提供商凭据会以非机密标记的形式持久保存（例如环境变量名称、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），绝不会解析并保存机密明文。写入的标记来自当前活动的源配置快照，而不是已解析的运行时机密值。

## JSON 投递状态

使用 `--json --deliver` 时，CLI JSON 响应会包含顶层 `deliveryStatus`，以便脚本区分投递成功、被抑制、部分失败和完全失败的发送：

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

由 Gateway 网关支持的 CLI 响应还会在 `result.deliveryStatus` 中保留原始 Gateway 网关结果结构。

`deliveryStatus.status` 是以下值之一：

| 状态             | 含义                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `sent`           | 投递完成。                                                                                                         |
| `suppressed`     | 有意不发送投递内容（例如消息发送钩子取消了投递，或没有可见结果）。这是终止状态，不会重试。                         |
| `partial_failed` | 后续载荷失败前，至少已发送一个载荷。                                                                               |
| `failed`         | 没有完成任何持久发送，或投递预检失败。                                                                             |

常用字段：

- `requested`：存在该对象时始终为 `true`。
- `attempted`：执行持久发送路径后为 `true`；预检失败或没有可见载荷时为 `false`。
- `succeeded`：值为 `true`、`false` 或 `"partial"`；`"partial"` 与 `status: "partial_failed"` 配对出现。
- `reason`：来自持久投递或预检验证的小写蛇形命名原因。已知值包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 和 `no_delivery_target`；持久发送失败时还可能报告失败阶段。由于该集合可能扩展，应将未知值视为不透明值。
- `resultCount`：渠道发送结果数量（如果可用）。
- `sentBeforeError`：部分失败中，在发生错误前至少已发送一个载荷时为 `true`。
- `error`：发送失败或部分失败时为 `true`。
- `errorMessage`：仅在捕获到底层投递错误消息时存在。预检失败会包含 `error`/`reason`，但不包含 `errorMessage`。
- `payloadOutcomes`：可选的逐载荷结果；可用时包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError` 或钩子元数据。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [智能体运行时](/zh-CN/concepts/agent)

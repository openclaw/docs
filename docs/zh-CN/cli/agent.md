---
read_when:
    - 你想通过脚本运行一次智能体轮次（可选择发送回复）
summary: '`openclaw agent` 的 CLI 参考（通过 Gateway 网关发送一个智能体轮次）'
title: 智能体
x-i18n:
    generated_at: "2026-07-12T14:22:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

通过 Gateway 网关运行一轮智能体。若 Gateway 网关请求失败，则回退到嵌入式智能体；传入 `--local` 可从一开始就强制使用嵌入式执行。

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
- `--verbose <on|off>`：为会话持久保存详细输出级别
- `--channel <channel>`：投递渠道；省略时使用主会话渠道
- `--reply-to <target>`：覆盖投递目标
- `--reply-channel <channel>`：覆盖投递渠道
- `--reply-account <id>`：覆盖投递账户
- `--local`：直接运行嵌入式智能体（预加载插件注册表后）
- `--deliver`：将回复发送回所选渠道/目标
- `--timeout <seconds>`：覆盖智能体超时时间（默认为 600，或 `agents.defaults.timeoutSeconds`）；`0` 表示禁用超时
- `--json`：输出 JSON

## 示例

```bash
openclaw agent --to +15555550123 --message "状态更新" --deliver
openclaw agent --agent ops --message "汇总日志"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "汇总日志"
openclaw agent --session-key agent:ops:incident-42 --message "汇总状态"
openclaw agent --agent ops --session-key incident-42 --message "汇总状态"
openclaw agent --session-id 1234 --message "汇总收件箱" --thinking medium
openclaw agent --to +15555550123 --message "追踪日志" --verbose on --json
openclaw agent --agent ops --message "生成报告" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "在本地运行" --local
```

## 说明

- 必须且只能传入 `--message` 或 `--message-file` 其中一个。`--message-file` 会移除文件开头的 UTF-8 BOM 并保留多行内容；非有效 UTF-8 文件将被拒绝。
- 斜杠命令（例如 `/compact`）无法通过 `--message` 运行。CLI 会拒绝此类命令，并引导你使用对应的一等命令（压缩时使用 `openclaw sessions compact <key>`）。
- `--local` 和嵌入式回退运行均为一次性运行：为本次运行打开的内置 MCP loopback 资源和预热的 Claude stdio 会话会在回复后停用，因此脚本调用不会留下正在运行的本地子进程。由 Gateway 网关支持的运行则会在运行中的 Gateway 网关进程下保留由 Gateway 网关管理的 MCP loopback 资源。
- 同时使用 `--agent`、`--channel` 和 `--to` 时，会话路由遵循渠道的规范接收方和 `session.dmScope`。具有稳定的仅出站接收方身份的渠道使用提供商所有的会话，该会话与智能体的主会话隔离。`--reply-channel` 和 `--reply-account` 仅影响投递。
- `--session-key` 选择显式会话键。带智能体前缀的键必须使用 `agent:<agent-id>:<session-key>`，同时指定两者时，`--agent` 必须与键中的智能体 ID 匹配。非哨兵裸键在提供 `--agent` 时归属该智能体，否则归属已配置的默认智能体；例如，`--agent ops --session-key incident-42` 会路由到 `agent:ops:incident-42`。仅当未提供 `--agent` 时，字面键 `global` 和 `unknown` 才保持无作用域状态。
- `--json` 会将 stdout 保留给 JSON 响应；Gateway 网关、插件和嵌入式回退诊断信息会发送到 stderr，以便脚本直接解析 stdout。
- 嵌入式回退 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，以便脚本检测回退运行。
- 如果 Gateway 网关接受了运行，但 CLI 在等待最终回复时超时，嵌入式回退会使用全新的 `gateway-fallback-*` 会话/运行 ID，并报告 `meta.fallbackReason: "gateway_timeout"` 以及回退会话字段，而不会与 Gateway 网关所有的记录争用或静默替换原始会话。
- `SIGTERM`/`SIGINT` 会中断正在等待的 Gateway 网关支持请求；如果 Gateway 网关已接受该运行，CLI 还会在退出前针对该运行 ID 发送 `chat.abort`。`--local` 和嵌入式回退运行会收到相同信号，但不会发送 `chat.abort`。如果内部运行去重键在此会话中已有活动运行，响应会报告 `status: "in_flight"`，非 JSON CLI 则会将诊断信息输出到 stderr，而不是输出空回复。对于外部 cron/systemd 包装器，请保留硬终止后备措施，例如 `timeout -k 60 600 openclaw agent ...`，以便在关闭过程无法完成清理时，由监管程序回收进程。
- 当此命令触发重新生成 `models.json` 时，由 SecretRef 管理的提供商凭据会以非机密标记形式持久保存（例如环境变量名称、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），绝不会解析为机密明文。标记写入来源于活动源配置快照，而不是解析后的运行时机密值。

## JSON 投递状态

使用 `--json --deliver` 时，CLI JSON 响应包含顶层 `deliveryStatus`，以便脚本区分已投递、已抑制、部分失败和失败的发送：

```json
{
  "payloads": [{ "text": "报告已就绪", "mediaUrl": null }],
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

| 状态             | 含义                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | 投递已完成。                                                                                                                 |
| `suppressed`     | 有意不进行投递（例如消息发送钩子取消了投递，或没有可见结果）。这是终止状态，不会重试。                                       |
| `partial_failed` | 在后续载荷失败前，至少有一个载荷已发送。                                                                                     |
| `failed`         | 没有完成任何持久发送，或投递预检失败。                                                                                       |

常见字段：

- `requested`：对象存在时始终为 `true`。
- `attempted`：持久发送路径运行后为 `true`；预检失败或没有可见载荷时为 `false`。
- `succeeded`：值为 `true`、`false` 或 `"partial"`；`"partial"` 与 `status: "partial_failed"` 配对使用。
- `reason`：来自持久投递或预检验证的小写蛇形命名原因。已知值包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 和 `no_delivery_target`；持久发送失败还可能报告失败阶段。请将未知值视为不透明值，因为该集合可能扩展。
- `resultCount`：渠道发送结果的数量（如果可用）。
- `sentBeforeError`：部分失败在出错前已发送至少一个载荷时为 `true`。
- `error`：发送失败或部分失败时为 `true`。
- `errorMessage`：仅在捕获到底层投递错误消息时存在。预检失败包含 `error`/`reason`，但不包含 `errorMessage`。
- `payloadOutcomes`：可选的逐载荷结果，包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`，或可用的钩子元数据。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [智能体运行时](/zh-CN/concepts/agent)

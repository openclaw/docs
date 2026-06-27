---
read_when:
    - 你想从脚本运行一次智能体轮次（可选发送回复）
summary: CLI 参考 `openclaw agent`（通过 Gateway 网关发送一次智能体轮次）
title: 智能体
x-i18n:
    generated_at: "2026-06-27T01:34:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

通过 Gateway 网关运行一个智能体轮次（嵌入式使用 `--local`）。
使用 `--agent <id>` 直接定位到已配置的智能体。

至少传入一个会话选择器：

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

相关：

- 智能体发送工具：[智能体发送](/zh-CN/tools/agent-send)

## 选项

- `-m, --message <text>`：消息正文
- `--message-file <path>`：从 UTF-8 文件读取消息正文
- `-t, --to <dest>`：用于派生会话键的接收方
- `--session-key <key>`：用于路由的显式会话键
- `--session-id <id>`：显式会话 ID
- `--agent <id>`：智能体 ID；覆盖路由绑定
- `--model <id>`：本次运行的模型覆盖（`provider/model` 或模型 ID）
- `--thinking <level>`：智能体思考级别（`off`、`minimal`、`low`、`medium`、`high`，以及提供商支持的自定义级别，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：为会话持久化详细级别
- `--channel <channel>`：投递渠道；省略则使用主会话渠道
- `--reply-to <target>`：投递目标覆盖
- `--reply-channel <channel>`：投递渠道覆盖
- `--reply-account <id>`：投递账号覆盖
- `--local`：直接运行嵌入式智能体（在插件注册表预加载之后）
- `--deliver`：将回复发回所选渠道/目标
- `--timeout <seconds>`：覆盖智能体超时（默认 600 或配置值）
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

## 说明

- 只能传入 `--message` 或 `--message-file` 之一。`--message-file` 会在移除可选 UTF-8 BOM 后保留多行文件内容，并拒绝不是有效 UTF-8 的文件。
- Gateway 网关模式在 Gateway 网关请求失败时回退到嵌入式智能体。使用 `--local` 可从一开始强制执行嵌入式运行。
- `--local` 仍会先预加载插件注册表，因此插件提供的提供商、工具和渠道在嵌入式运行期间仍然可用。
- `--local` 和嵌入式回退运行会被视为一次性运行。为该本地进程打开的内置 MCP loopback 资源和预热的 Claude stdio 会话会在回复后被回收，因此脚本化调用不会让本地子进程保持存活。
- Gateway 网关支撑的运行会将 Gateway 网关拥有的 MCP loopback 资源留在正在运行的 Gateway 网关进程下；较旧的客户端可能仍会发送历史清理标志，但 Gateway 网关会将其作为兼容性无操作接受。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响回复投递，而不是会话路由。
- `--session-key` 选择显式会话键。带智能体前缀的键必须使用 `agent:<agent-id>:<session-key>`，并且同时提供二者时，`--agent` 必须匹配该键的智能体 ID。裸的非哨兵键在提供 `--agent` 时会限定到 `--agent`，否则限定到已配置的默认智能体；例如，`--agent ops --session-key incident-42` 会路由到 `agent:ops:incident-42`。字面量 `global` 和 `unknown` 仅在未提供 `--agent` 时保持不限定；在这种情况下，嵌入式回退和存储所有权使用已配置的默认智能体。
- `--json` 会保留 stdout 专用于 JSON 响应。Gateway 网关、插件和嵌入式回退诊断会路由到 stderr，以便脚本可以直接解析 stdout。
- 嵌入式回退 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，以便脚本可以区分回退运行和 Gateway 网关运行。
- 如果 Gateway 网关接受了智能体运行，但 CLI 在等待最终回复时超时，嵌入式回退会使用全新的显式 `gateway-fallback-*` 会话/运行 ID，并报告 `meta.fallbackReason: "gateway_timeout"` 以及回退会话字段。这可避免与 Gateway 网关拥有的转录锁竞争，或静默替换原始路由的对话会话。
- 对于 Gateway 网关支撑的运行，`SIGTERM` 和 `SIGINT` 会中断正在等待的 CLI 请求。如果 Gateway 网关已经接受该运行，CLI 还会在退出前为该已接受的运行 ID 发送 `chat.abort`。本地 `--local` 运行和嵌入式回退运行会接收相同的中止信号，但不会发送 `chat.abort`。如果重复的 `--run-id` 在原始智能体运行仍处于活动状态时到达 Gateway 网关，重复响应会报告 `status: "in_flight"`，非 JSON CLI 会打印 stderr 诊断，而不是空回复。对于外部 cron/systemd 包装器，请保留外层硬终止兜底，例如 `timeout -k 60 600 openclaw agent ...`，这样即使关闭无法排空，监督器仍可回收该进程。
- 当此命令触发 `models.json` 重新生成时，SecretRef 管理的提供商凭证会作为非密钥标记持久化（例如环境变量名称、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不是解析后的密钥明文。
- 标记写入以源为权威：OpenClaw 会从活动源配置快照持久化标记，而不是从解析后的运行时密钥值持久化。

## JSON 投递状态

使用 `--json --deliver` 时，CLI JSON 响应可能包含顶层 `deliveryStatus`，以便脚本区分已投递、已抑制、部分和失败的发送：

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

`deliveryStatus.status` 是 `sent`、`suppressed`、`partial_failed` 或 `failed` 之一。`suppressed` 表示投递被有意不发送，例如消息发送钩子取消了它，或没有可见结果；它仍然是终止性的不可重试结果。`partial_failed` 表示至少一个载荷已发送，随后某个载荷失败。`failed` 表示没有完成持久发送，或投递预检失败。

Gateway 网关支撑的 CLI 响应还会保留原始 Gateway 网关结果形状，其中同一对象可在 `result.deliveryStatus` 处获得。

常见字段：

- `requested`：对象存在时始终为 `true`。
- `attempted`：持久发送路径运行后为 `true`；预检失败或没有可见载荷时为 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 与 `status: "partial_failed"` 配对。
- `reason`：来自持久投递或预检验证的小写 snake-case 原因。已知原因包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 和 `no_delivery_target`；失败的持久发送也可能报告失败阶段。请将未知值视为不透明值，因为集合可能扩展。
- `resultCount`：可用时的渠道发送结果数量。
- `sentBeforeError`：部分失败在错误前至少发送一个载荷时为 `true`。
- `error`：失败或部分失败的发送为布尔值 `true`。
- `errorMessage`：仅在捕获到底层投递错误消息时包含。预检失败携带 `error` 和 `reason`，但没有 `errorMessage`。
- `payloadOutcomes`：可选的按载荷结果，包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`，或可用时的钩子元数据。

## 相关

- [CLI 参考](/zh-CN/cli)
- [智能体运行时](/zh-CN/concepts/agent)

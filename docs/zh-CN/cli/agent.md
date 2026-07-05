---
read_when:
    - 你想从 scripts 运行一轮智能体回合（可选择发送回复）
summary: '`openclaw agent` 的 CLI 参考（通过 Gateway 网关发送一个智能体轮次）'
title: 智能体
x-i18n:
    generated_at: "2026-07-05T11:07:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a0e1dcf7fb08e592cadf99380dcf700c82685a74d6fda2883ac2fdbb79267e
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

通过 Gateway 网关运行一次智能体轮次。如果 Gateway 网关请求失败，则回退到嵌入式智能体；传入 `--local` 可从一开始就强制使用嵌入式执行。

至少传入一个会话选择器：`--to`、`--session-key`、`--session-id` 或 `--agent`。

相关：[智能体发送工具](/zh-CN/tools/agent-send)

## 选项

- `-m, --message <text>`：消息正文
- `--message-file <path>`：从 UTF-8 文件读取消息正文
- `-t, --to <dest>`：用于派生会话键的接收方
- `--session-key <key>`：用于路由的显式会话键
- `--session-id <id>`：显式会话 ID
- `--agent <id>`：智能体 ID；覆盖路由绑定
- `--model <id>`：本次运行的模型覆盖项（`provider/model` 或模型 ID）
- `--thinking <level>`：智能体思考级别（`off`、`minimal`、`low`、`medium`、`high`，以及提供商支持的自定义级别，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：为会话持久化详细级别
- `--channel <channel>`：投递渠道；省略则使用主会话渠道
- `--reply-to <target>`：投递目标覆盖项
- `--reply-channel <channel>`：投递渠道覆盖项
- `--reply-account <id>`：投递账号覆盖项
- `--local`：直接运行嵌入式智能体（在插件注册表预加载之后）
- `--deliver`：将回复发送回所选渠道/目标
- `--timeout <seconds>`：覆盖智能体超时时间（默认 600，或 `agents.defaults.timeoutSeconds`）；`0` 会禁用超时
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

- 只能传入 `--message` 或 `--message-file` 其中一个。`--message-file` 会移除开头的 UTF-8 BOM，并保留多行内容；它会拒绝无效 UTF-8 文件。
- 斜杠命令（例如 `/compact`）不能通过 `--message` 运行。CLI 会拒绝它们，并指向对应的一等命令（用于压缩的 `openclaw sessions compact <key>`）。
- `--local` 和嵌入式回退运行都是一次性的：为本次运行打开的内置 MCP loopback 资源和预热 Claude stdio 会话会在回复后被清理，因此脚本调用不会留下本地子进程继续运行。由 Gateway 网关支持的运行则会把 Gateway 网关拥有的 MCP loopback 资源保留在正在运行的 Gateway 网关进程下。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响回复投递，而不是会话路由。
- `--session-key` 会选择一个显式会话键。带智能体前缀的键必须使用 `agent:<agent-id>:<session-key>`，并且当同时给出 `--agent` 时，它必须匹配该键中的智能体 ID。裸的非哨兵键在提供 `--agent` 时会限定到该智能体，否则限定到已配置的默认智能体；例如 `--agent ops --session-key incident-42` 会路由到 `agent:ops:incident-42`。字面键 `global` 和 `unknown` 仅在未提供 `--agent` 时保持未限定。
- `--json` 会将 stdout 保留给 JSON 响应；Gateway 网关、插件和嵌入式回退诊断会输出到 stderr，因此脚本可以直接解析 stdout。
- 嵌入式回退 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，因此脚本可以检测到回退运行。
- 如果 Gateway 网关接受了一次运行，但 CLI 在等待最终回复时超时，嵌入式回退会使用新的 `gateway-fallback-*` 会话/运行 ID，并报告 `meta.fallbackReason: "gateway_timeout"` 以及回退会话字段，而不是与 Gateway 网关拥有的转录记录竞争或静默替换原始会话。
- `SIGTERM`/`SIGINT` 会中断正在等待的 Gateway 网关支持请求；如果 Gateway 网关已经接受了运行，CLI 还会在退出前针对该运行 ID 发送 `chat.abort`。`--local` 和嵌入式回退运行会收到相同信号，但不会发送 `chat.abort`。如果内部运行去重键已经有此会话的活动运行，响应会报告 `status: "in_flight"`，非 JSON CLI 会打印 stderr 诊断，而不是空回复。对于外部 cron/systemd 包装器，请保留硬终止兜底，例如 `timeout -k 60 600 openclaw agent ...`，这样在关闭无法清空时，监督器可以回收该进程。
- 当此命令触发 `models.json` 重新生成时，由 SecretRef 管理的提供商凭证会以非机密标记形式持久化（例如环境变量名称、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），绝不会解析为机密明文。标记写入来自活动源配置快照，而不是已解析的运行时机密值。

## JSON 投递状态

使用 `--json --deliver` 时，CLI JSON 响应会包含顶层 `deliveryStatus`，因此脚本可以区分已投递、已抑制、部分成功和发送失败：

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

由 Gateway 网关支持的 CLI 响应也会在 `result.deliveryStatus` 保留原始 Gateway 网关结果形状。

`deliveryStatus.status` 是以下值之一：

| 状态             | 含义                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | 投递已完成。                                                                                                                               |
| `suppressed`     | 投递被有意跳过（例如消息发送钩子取消了投递，或没有可见结果）。终态，不重试。                                                               |
| `partial_failed` | 至少一个 payload 已发送，但后续 payload 失败。                                                                                             |
| `failed`         | 没有完成持久投递，或投递预检失败。                                                                                                         |

常见字段：

- `requested`：对象存在时始终为 `true`。
- `attempted`：持久发送路径运行后为 `true`；预检失败或没有可见 payload 时为 `false`。
- `succeeded`：`true`、`false` 或 `"partial"`；`"partial"` 与 `status: "partial_failed"` 配对。
- `reason`：来自持久投递或预检验证的小写蛇形命名原因。已知值包括 `cancelled_by_message_sending_hook`、`no_visible_payload`、`no_visible_result`、`channel_resolved_to_internal`、`unknown_channel`、`invalid_delivery_target` 和 `no_delivery_target`；失败的持久发送也可能报告失败阶段。请将未知值视为不透明值，因为集合可能扩展。
- `resultCount`：渠道发送结果数量（可用时）。
- `sentBeforeError`：部分失败在出错前至少发送了一个 payload 时为 `true`。
- `error`：发送失败或部分失败时为 `true`。
- `errorMessage`：仅在捕获到底层投递错误消息时存在。预检失败会携带 `error`/`reason`，但没有 `errorMessage`。
- `payloadOutcomes`：可选的逐 payload 结果，可包含 `index`、`status`、`reason`、`resultCount`、`error`、`stage`、`sentBeforeError`，或可用时的钩子元数据。

## 相关

- [CLI 参考](/zh-CN/cli)
- [智能体运行时](/zh-CN/concepts/agent)

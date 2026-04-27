---
read_when:
    - 你想从脚本中运行一次智能体轮次（可选择传递回复）
summary: '`openclaw agent` 的 CLI 参考（通过 Gateway 网关发送一次智能体轮次）'
title: 智能体
x-i18n:
    generated_at: "2026-04-27T12:50:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24a3a2740afcff4626e69b0fab8e00263a101191f55e5ac14cedbabb615ecfe6
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

通过 Gateway 网关运行一次智能体轮次（嵌入式模式使用 `--local`）。
使用 `--agent <id>` 可直接指定某个已配置的智能体。

至少传入一个会话选择器：

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

相关内容：

- Agent 发送工具：[Agent send](/zh-CN/tools/agent-send)

## 选项

- `-m, --message <text>`：必填的消息正文
- `-t, --to <dest>`：用于派生会话键的收件人
- `--session-id <id>`：显式指定会话 ID
- `--agent <id>`：智能体 ID；会覆盖路由绑定
- `--model <id>`：本次运行使用的模型覆盖值（`provider/model` 或模型 ID）
- `--thinking <level>`：智能体思考级别（`off`、`minimal`、`low`、`medium`、`high`，以及提供商支持的自定义级别，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：为该会话持久化详细输出级别
- `--channel <channel>`：传递渠道；省略时使用主会话渠道
- `--reply-to <target>`：回复目标覆盖值
- `--reply-channel <channel>`：回复渠道覆盖值
- `--reply-account <id>`：回复账户覆盖值
- `--local`：直接运行嵌入式智能体（在预加载插件注册表之后）
- `--deliver`：将回复发送回所选渠道/目标
- `--timeout <seconds>`：覆盖智能体超时时间（默认 600 或配置值）
- `--json`：输出 JSON

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 说明

- Gateway 网关模式在 Gateway 网关请求失败时会回退到嵌入式智能体。使用 `--local` 可在一开始就强制使用嵌入式执行。
- `--local` 仍会先预加载插件注册表，因此插件提供的 provider、工具和渠道在嵌入式运行期间仍然可用。
- 每次调用 `openclaw agent` 都会被视为一次性运行。为该次运行打开的内置或用户配置的 MCP 服务器会在回复后退役，即使该命令走的是 Gateway 网关路径也是如此，因此 `stdio` MCP 子进程不会在多次脚本调用之间保持存活。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响的是回复传递，而不是会话路由。
- `--json` 会保留 stdout 专门用于 JSON 响应。Gateway 网关、插件和嵌入式回退的诊断信息会写入 stderr，因此脚本可以直接解析 stdout。
- 嵌入式回退的 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，因此脚本可以区分回退运行和 Gateway 网关运行。
- 当此命令触发 `models.json` 重新生成时，由 SecretRef 管理的 provider 凭证会以非机密标记形式持久化（例如环境变量名、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不会解析为明文机密。
- 标记写入以源配置为权威：OpenClaw 会从当前生效的源配置快照中持久化标记，而不是从已解析的运行时机密值中持久化。

## 相关

- [CLI 参考](/zh-CN/cli)
- [智能体运行时](/zh-CN/concepts/agent)

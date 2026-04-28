---
read_when:
    - 你想从脚本运行一轮智能体（可选发送回复）
summary: '`openclaw agent` 的 CLI 参考（通过 Gateway 网关发送一个智能体轮次）'
title: 智能体
x-i18n:
    generated_at: "2026-04-28T11:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9a8772cc6387fda6084856868516160507877fb2dcdadfc130284a8dec44913
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

通过 Gateway 网关运行一次智能体回合（嵌入式使用 `--local`）。
使用 `--agent <id>` 直接指定一个已配置的智能体。

至少传入一个会话选择器：

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

相关内容：

- 智能体发送工具：[智能体发送](/zh-CN/tools/agent-send)

## 选项

- `-m, --message <text>`：必需的消息正文
- `-t, --to <dest>`：用于派生会话键的接收方
- `--session-id <id>`：显式会话 ID
- `--agent <id>`：智能体 ID；覆盖路由绑定
- `--model <id>`：本次运行的模型覆盖项（`provider/model` 或模型 ID）
- `--thinking <level>`：智能体思考级别（`off`、`minimal`、`low`、`medium`、`high`，以及提供商支持的自定义级别，例如 `xhigh`、`adaptive` 或 `max`）
- `--verbose <on|off>`：为会话持久化详细级别
- `--channel <channel>`：投递渠道；省略时使用主会话渠道
- `--reply-to <target>`：投递目标覆盖项
- `--reply-channel <channel>`：投递渠道覆盖项
- `--reply-account <id>`：投递账号覆盖项
- `--local`：直接运行嵌入式智能体（在插件注册表预加载之后）
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

## 注意事项

- 当 Gateway 网关请求失败时，Gateway 网关模式会回退到嵌入式智能体。使用 `--local` 可在一开始就强制执行嵌入式运行。
- `--local` 仍会先预加载插件注册表，因此插件提供的提供商、工具和渠道在嵌入式运行期间仍然可用。
- `--local` 和嵌入式回退运行会被视为一次性运行。为该本地进程打开的内置 MCP loopback 资源和预热的 Claude stdio 会话会在回复后被释放，因此脚本化调用不会让本地子进程持续存活。
- 由 Gateway 网关支持的运行会将 Gateway 网关拥有的 MCP loopback 资源留在正在运行的 Gateway 网关进程下；较旧的客户端可能仍会发送历史清理标志，但 Gateway 网关会将其作为兼容性的无操作接受。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响回复投递，而不是会话路由。
- `--json` 会保留 stdout 专用于 JSON 响应。Gateway 网关、插件和嵌入式回退诊断会路由到 stderr，因此脚本可以直接解析 stdout。
- 嵌入式回退 JSON 包含 `meta.transport: "embedded"` 和 `meta.fallbackFrom: "gateway"`，因此脚本可以区分回退运行和 Gateway 网关运行。
- 当此命令触发 `models.json` 重新生成时，由 SecretRef 管理的提供商凭据会以非密钥标记持久化（例如环境变量名称、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不是解析后的密钥明文。
- 标记写入以源为权威：OpenClaw 会从活动源配置快照持久化标记，而不是从解析后的运行时密钥值持久化。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [智能体运行时](/zh-CN/concepts/agent)

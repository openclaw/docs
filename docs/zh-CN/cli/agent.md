---
read_when:
    - 你想从脚本中运行一次智能体回合（可选地投递回复）
summary: '`openclaw agent` 的 CLI 参考（通过 Gateway 网关发送一次智能体回合）'
title: agent
x-i18n:
    generated_at: "2026-04-05T08:18:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

通过 Gateway 网关运行一次智能体回合（嵌入式运行请使用 `--local`）。
使用 `--agent <id>` 可直接指定一个已配置的智能体。

至少传入一个会话选择器：

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

相关内容：

- 智能体发送工具：[Agent send](/tools/agent-send)

## 选项

- `-m, --message <text>`：必填，消息正文
- `-t, --to <dest>`：用于推导会话键的收件人
- `--session-id <id>`：显式会话 id
- `--agent <id>`：智能体 id；会覆盖路由绑定
- `--thinking <off|minimal|low|medium|high|xhigh>`：智能体思考级别
- `--verbose <on|off>`：为该会话持久化 verbose 级别
- `--channel <channel>`：投递渠道；省略时使用会话的主渠道
- `--reply-to <target>`：回复目标覆盖
- `--reply-channel <channel>`：回复渠道覆盖
- `--reply-account <id>`：回复账户覆盖
- `--local`：直接运行嵌入式智能体（在插件注册表预加载之后）
- `--deliver`：将回复发送回所选渠道/目标
- `--timeout <seconds>`：覆盖智能体超时时间（默认 600 或配置值）
- `--json`：输出 JSON

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 说明

- Gateway 网关模式会在 Gateway 网关请求失败时回退到嵌入式智能体。使用 `--local` 可一开始就强制使用嵌入式执行。
- `--local` 仍会先预加载插件注册表，因此插件提供的提供商、工具和渠道在嵌入式运行期间仍然可用。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响的是回复投递，而不是会话路由。
- 当此命令触发 `models.json` 重新生成时，由 SecretRef 管理的提供商凭证会以非秘密标记的形式持久化（例如环境变量名、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`），而不会写入解析后的秘密明文。
- 标记写入以源配置为权威：OpenClaw 会从当前激活的源配置快照中持久化标记，而不是从运行时已解析的秘密值中持久化。

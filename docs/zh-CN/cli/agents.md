---
read_when:
    - 你想要多个彼此隔离的智能体（工作区 + 路由 + 认证）
summary: '`openclaw agents` 的 CLI 参考（list/add/delete/bindings/bind/unbind/set identity）'
title: 智能体
x-i18n:
    generated_at: "2026-05-02T12:44:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3522394dd416a9c8b4bf25767a14073484df0ff3d7c546cf6c730f111c5c51dc
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

管理隔离的智能体（工作区 + 凭证 + 路由）。

相关内容：

- [多智能体路由](/zh-CN/concepts/multi-agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [Skills 配置](/zh-CN/tools/skills-config)：技能可见性配置。

## 示例

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 路由绑定

使用路由绑定将入站渠道流量固定到特定智能体。

如果你还想为每个智能体配置不同的可见 Skills，请在 `openclaw.json` 中配置 `agents.defaults.skills` 和 `agents.list[].skills`。请参阅 [Skills 配置](/zh-CN/tools/skills-config) 和 [配置参考](/zh-CN/gateway/config-agents#agents-defaults-skills)。

列出绑定：

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

添加绑定：

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

如果省略 `accountId`（`--bind <channel>`），OpenClaw 会在可用时从渠道默认值和插件设置钩子中解析它。

如果对 `bind` 或 `unbind` 省略 `--agent`，OpenClaw 会以当前默认智能体为目标。

### 绑定范围行为

- 没有 `accountId` 的绑定只匹配渠道默认账号。
- `accountId: "*"` 是渠道范围的后备项（所有账号），其优先级低于显式账号绑定。
- 如果同一个智能体已经有一个匹配的、没有 `accountId` 的渠道绑定，而你稍后使用显式或解析出的 `accountId` 进行绑定，OpenClaw 会就地升级现有绑定，而不是添加重复项。

示例：

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

升级后，该绑定的路由范围限定为 `telegram:ops`。如果你还想要默认账号路由，请显式添加它（例如 `--bind telegram:default`）。

移除绑定：

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` 接受 `--all` 或一个或多个 `--bind` 值，不能同时使用两者。

## 命令表面

### `agents`

不带子命令运行 `openclaw agents` 等同于 `openclaw agents list`。

### `agents list`

选项：

- `--json`
- `--bindings`：包含完整路由规则，而不仅是每个智能体的计数/摘要

### `agents add [name]`

选项：

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（可重复）
- `--non-interactive`
- `--json`

注意：

- 传入任何显式添加标志都会将命令切换到非交互路径。
- 非交互模式需要同时提供智能体名称和 `--workspace`。
- `main` 是保留字，不能用作新的智能体 ID。
- 在交互模式下，凭证植入只会复制可移植的静态配置文件
  （默认是 `api_key` 和静态 `token`）。OAuth 刷新令牌配置文件仍然
  只能通过从真实 `main` 智能体存储进行读取继承来使用。
  如果配置的默认智能体不是 `main`，请为新智能体单独登录 OAuth
  配置文件。

### `agents bindings`

选项：

- `--agent <id>`
- `--json`

### `agents bind`

选项：

- `--agent <id>`（默认为当前默认智能体）
- `--bind <channel[:accountId]>`（可重复）
- `--json`

### `agents unbind`

选项：

- `--agent <id>`（默认为当前默认智能体）
- `--bind <channel[:accountId]>`（可重复）
- `--all`
- `--json`

### `agents delete <id>`

选项：

- `--force`
- `--json`

注意：

- `main` 不能被删除。
- 如果没有 `--force`，需要交互式确认。
- 工作区、智能体状态和会话转录目录会被移动到废纸篓，而不是硬删除。
- 当 Gateway 网关可访问时，删除会通过 Gateway 网关发送，因此配置和会话存储清理会与运行时流量共享同一个写入器。如果无法访问 Gateway 网关，CLI 会回退到离线本地路径。
- 如果另一个智能体的工作区是同一路径、位于此工作区内，或包含此工作区，
  该工作区会被保留，并且 `--json` 会报告 `workspaceRetained`、
  `workspaceRetainedReason` 和 `workspaceSharedWith`。

## 身份文件

每个智能体工作区都可以在工作区根目录包含一个 `IDENTITY.md`：

- 示例路径：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 从工作区根目录（或显式的 `--identity-file`）读取

头像路径相对于工作区根目录解析。

## 设置身份

`set-identity` 会将字段写入 `agents.list[].identity`：

- `name`
- `theme`
- `emoji`
- `avatar`（工作区相对路径、http(s) URL 或 data URI）

选项：

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

注意：

- `--agent` 或 `--workspace` 可用于选择目标智能体。
- 如果你依赖 `--workspace`，且多个智能体共享该工作区，命令会失败并要求你传入 `--agent`。
- 如果没有提供显式身份字段，命令会从 `IDENTITY.md` 读取身份数据。

从 `IDENTITY.md` 加载：

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

显式覆盖字段：

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

配置示例：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)

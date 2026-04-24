---
read_when:
    - 你想要多个彼此隔离的智能体（工作区 + 路由 + 凭证）
summary: '`openclaw agents` 的 CLI 参考（list/add/delete/bindings/bind/unbind/set identity）'
title: 智能体
x-i18n:
    generated_at: "2026-04-24T03:38:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

管理彼此隔离的智能体（工作区 + 凭证 + 路由）。

相关内容：

- 多智能体路由：[Multi-Agent Routing](/zh-CN/concepts/multi-agent)
- 智能体工作区：[智能体工作区](/zh-CN/concepts/agent-workspace)
- Skills 可见性配置：[Skills 配置](/zh-CN/tools/skills-config)

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

如果你还希望为每个智能体显示不同的 Skills，请在 `openclaw.json` 中配置
`agents.defaults.skills` 和 `agents.list[].skills`。参见
[Skills 配置](/zh-CN/tools/skills-config) 和
[配置参考](/zh-CN/gateway/config-agents#agents-defaults-skills)。

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

如果你省略 `accountId`（`--bind <channel>`），OpenClaw 会在可用时从渠道默认值和插件设置钩子中解析它。

如果你在 `bind` 或 `unbind` 中省略 `--agent`，OpenClaw 会以当前默认智能体为目标。

### 绑定范围行为

- 不带 `accountId` 的绑定仅匹配该渠道的默认账号。
- `accountId: "*"` 是渠道级回退项（适用于所有账号），其具体程度低于显式账号绑定。
- 如果同一个智能体已经有一个不带 `accountId` 的匹配渠道绑定，而你之后又使用显式或已解析的 `accountId` 进行绑定，OpenClaw 会原地升级这个现有绑定，而不是添加重复项。

示例：

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

升级后，该绑定的路由范围将限定为 `telegram:ops`。如果你还希望保留默认账号路由，请显式添加（例如 `--bind telegram:default`）。

移除绑定：

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` 只能接受 `--all` 或一个或多个 `--bind` 值中的一种，不能同时使用两者。

## 命令界面

### `agents`

运行不带子命令的 `openclaw agents` 等同于 `openclaw agents list`。

### `agents list`

选项：

- `--json`
- `--bindings`：包含完整路由规则，而不只是按智能体划分的计数/摘要

### `agents add [name]`

选项：

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（可重复）
- `--non-interactive`
- `--json`

说明：

- 传入任何显式的 add 标志，都会让命令切换到非交互路径。
- 非交互模式同时要求提供智能体名称和 `--workspace`。
- `main` 是保留名称，不能用作新智能体 id。

### `agents bindings`

选项：

- `--agent <id>`
- `--json`

### `agents bind`

选项：

- `--agent <id>`（默认使用当前默认智能体）
- `--bind <channel[:accountId]>`（可重复）
- `--json`

### `agents unbind`

选项：

- `--agent <id>`（默认使用当前默认智能体）
- `--bind <channel[:accountId]>`（可重复）
- `--all`
- `--json`

### `agents delete <id>`

选项：

- `--force`
- `--json`

说明：

- `main` 不能被删除。
- 没有 `--force` 时，需要交互式确认。
- 工作区、智能体状态和会话转录目录会被移到回收站，而不是被彻底删除。

## 身份文件

每个智能体工作区都可以在工作区根目录包含一个 `IDENTITY.md`：

- 示例路径：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 会从工作区根目录读取（或从显式指定的 `--identity-file` 读取）

头像路径会相对于工作区根目录解析。

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

说明：

- 可以使用 `--agent` 或 `--workspace` 选择目标智能体。
- 如果你依赖 `--workspace`，而多个智能体共享该工作区，命令会失败，并要求你传入 `--agent`。
- 当未提供显式身份字段时，命令会从 `IDENTITY.md` 读取身份数据。

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
- [Multi-Agent Routing](/zh-CN/concepts/multi-agent)
- [智能体工作区](/zh-CN/concepts/agent-workspace)

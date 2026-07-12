---
read_when:
    - 你需要多个相互隔离的智能体（工作区 + 路由 + 身份验证）
summary: '`openclaw agents` 的 CLI 参考（列出/添加/删除/绑定关系/绑定/解绑/设置身份）'
title: 智能体
x-i18n:
    generated_at: "2026-07-11T20:22:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

管理相互隔离的智能体（工作区 + 身份验证 + 路由）。不带子命令运行 `openclaw agents` 等同于运行 `openclaw agents list`。

相关内容：

- [多智能体路由](/zh-CN/concepts/multi-agent)
- [Agent 工作区](/zh-CN/concepts/agent-workspace)
- [Skills 配置](/zh-CN/tools/skills-config)：技能可见性配置。

## 示例

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 命令界面

### `agents list`

选项：`--json`、`--bindings`（包含完整路由规则，而不仅是每个智能体的数量/摘要）。

### `agents add [name]`

选项：`--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（可重复使用）、`--non-interactive`、`--json`。

- 传入任何显式的添加选项都会将命令切换到非交互式路径。
- 非交互模式同时需要智能体名称和 `--workspace`。
- `main` 是保留标识符，不能用作新智能体 ID。
- 交互模式仅通过复制可移植的静态凭据（`api_key` 和静态 `token` 配置文件）来初始化身份验证，除非某项凭据通过 `copyToAgents: false` 明确禁止复制；OAuth 刷新令牌配置文件不会被复制，除非提供商通过 `copyToAgents: true` 明确启用复制。如果未复制，OAuth 只能通过从真实 `main` 智能体存储中读取继承来使用。如果配置的默认智能体不是 `main`，请在新智能体上为 OAuth 配置文件单独登录。

### `agents bindings`

选项：`--agent <id>`、`--json`。

### `agents bind`

选项：`--agent <id>`（默认为当前默认智能体）、`--bind <channel[:accountId]>`（可重复使用）、`--json`。

### `agents unbind`

选项：`--agent <id>`（默认为当前默认智能体）、`--bind <channel[:accountId]>`（可重复使用）、`--all`、`--json`。可接受 `--all` 或一个或多个 `--bind` 值，但不能同时使用两者。

### `agents set-identity`

选项：`--agent <id>`、`--workspace <dir>`、`--identity-file <path>`、`--from-identity`、`--name <name>`、`--theme <theme>`、`--emoji <emoji>`、`--avatar <value>`、`--json`。请参阅下文的[设置身份](#set-identity)。

### `agents delete <id>`

选项：`--force`、`--json`。

- 无法删除 `main`。
- 不使用 `--force` 时，需要交互式确认（在非 TTY 会话中会失败；请使用 `--force` 重新运行）。
- 工作区、智能体状态和会话转录目录会移至废纸篓，而不是被永久删除。
- 当 Gateway 网关可访问时，删除操作会通过 Gateway 网关执行，使配置和会话存储清理与运行时流量使用同一写入方。如果 Gateway 网关不可访问，CLI 会回退到离线本地路径。
- 如果另一个智能体的工作区与此工作区路径相同、位于此工作区内或包含此工作区，则会保留该工作区，并且 `--json` 会报告 `workspaceRetained`、`workspaceRetainedReason` 和 `workspaceSharedWith`。

## 路由绑定

使用路由绑定将入站渠道流量固定到特定智能体。

如果还希望每个智能体显示不同的技能，请在 `openclaw.json` 中配置 `agents.defaults.skills` 和 `agents.list[].skills`。请参阅 [Skills 配置](/zh-CN/tools/skills-config)和[配置参考](/zh-CN/gateway/config-agents#agentsdefaultsskills)。

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

你也可以在创建智能体时添加绑定：

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

如果省略 `accountId`（`--bind <channel>`），OpenClaw 会从插件设置钩子、强制账户绑定或该渠道配置的账户数量中解析它。

如果为 `bind` 或 `unbind` 省略 `--agent`，OpenClaw 会以当前默认智能体为目标。

### `--bind` 格式

| 格式                         | 含义                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | 匹配该渠道上的所有账户。                                                                           |
| `--bind <channel>:<account>` | 匹配一个账户。                                                                                     |
| `--bind <channel>`           | 仅匹配默认账户，除非 CLI 可以安全地解析插件特定的账户范围。                                         |

### 绑定范围行为

- 存储的不含 `accountId` 的绑定仅匹配渠道默认账户。
- `accountId: "*"` 是渠道范围的回退项（所有账户），其具体程度低于显式账户绑定。
- 如果同一智能体已有不含 `accountId` 的匹配渠道绑定，而你随后使用显式或解析得到的 `accountId` 进行绑定，OpenClaw 会就地升级该现有绑定，而不是添加重复项。

示例：

```bash
# 匹配该渠道上的所有账户
openclaw agents bind --agent work --bind telegram:*

# 匹配特定账户
openclaw agents bind --agent work --bind telegram:ops

# 初始的仅渠道绑定
openclaw agents bind --agent work --bind telegram

# 稍后升级为账户范围绑定
openclaw agents bind --agent work --bind telegram:alerts
```

升级后，该绑定的路由范围限定为 `telegram:alerts`。如果还需要默认账户路由，请显式添加它（例如 `--bind telegram:default`）。

移除绑定：

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## 身份文件

每个智能体工作区都可以在工作区根目录中包含一个 `IDENTITY.md`：

- 示例路径：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 从工作区根目录（或显式指定的 `--identity-file`）读取。

头像路径相对于工作区根目录解析，即使通过符号链接也不能逸出工作区。

## 设置身份

`set-identity` 将字段写入 `agents.list[].identity`：`name`、`theme`、`emoji`、`avatar`（工作区相对路径、HTTP(S) URL 或数据 URI）。

- `--agent` 或 `--workspace` 用于选择目标智能体。如果 `--workspace` 匹配多个智能体，命令会失败并要求你传入 `--agent`。
- 本地工作区相对头像图像文件的大小上限为 2 MB。HTTP(S) URL 和 `data:` URI 不受本地文件大小限制检查。
- 未提供显式身份字段时，该命令会从 `IDENTITY.md` 读取身份数据。

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

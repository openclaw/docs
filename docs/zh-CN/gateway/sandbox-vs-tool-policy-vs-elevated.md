---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 工具为何被阻止：沙箱运行时、工具允许/拒绝策略及提升权限的 Exec 门控
title: 沙箱、工具策略和提升权限
x-i18n:
    generated_at: "2026-07-11T20:34:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw 有三种相互关联但各不相同的控制机制：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在哪里运行**（沙箱后端或主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用或允许使用**。
3. **提升权限**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一种**仅限 Exec 的逃生通道**，用于在沙箱隔离时到沙箱外运行（默认为 `gateway`，当 Exec 目标配置为 `node` 时则为 `node`）。

## 快速调试

使用检查器查看 OpenClaw _实际_执行的操作：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会输出：

- 生效的沙箱模式、作用域和工作区访问权限
- 当前会话是否处于沙箱隔离状态（主会话与非主会话）
- 生效的沙箱工具允许/拒绝规则（以及规则来自 Agent、全局还是默认配置）
- 提升权限门控和修复所需的键路径

## 沙箱：工具在哪里运行

沙箱隔离由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容都在主机上运行。
- `"non-main"`：仅非主会话在沙箱中运行（群组/渠道中常见的“意外”情况）。
- `"all"`：所有内容都在沙箱中运行。

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可访问的内容：`"none"`、`"ro"` 或 `"rw"`。

完整矩阵（作用域、工作区挂载、镜像）请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会_穿透_沙箱文件系统：无论挂载什么内容，容器内都能按照你设置的模式（`:ro` 或 `:rw`）访问它。
- 如果省略模式，默认为读写；对于源代码和密钥，建议使用 `:ro`。
- `scope: "shared"` 会忽略按 Agent 配置的绑定挂载（仅应用全局绑定挂载）。
- OpenClaw 会对绑定源进行两次验证：先验证规范化后的源路径，再通过最深层的现有祖先解析后重新验证。通过符号链接父目录逃逸无法绕过受阻路径或允许根目录检查。
- 不存在的叶路径仍会接受安全检查。如果 `/workspace/alias-out/new-file` 通过符号链接父目录解析到受阻路径或配置的允许根目录之外，该绑定会被拒绝。
- 绑定 `/var/run/docker.sock` 实际上会将主机控制权交给沙箱；仅在确有意图时这样做。
- 工作区访问权限（`workspaceAccess`）与绑定模式相互独立。

## 工具策略：哪些工具存在或可调用

以下各层会产生影响：

- **工具配置档**：`tools.profile` 和 `agents.list[].tools.profile`（基础允许列表）
- **提供商工具配置档**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/按 Agent 工具策略**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具策略**（仅在沙箱隔离时应用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验规则：

- `deny` 始终优先。
- 如果 `allow` 非空，其他所有内容都会被视为受阻。
- 工具策略是不可绕过的硬性限制：`/exec` 无法覆盖被拒绝的 `exec` 工具。
- 工具策略按名称筛选工具可用性；它不会检查 `exec` 内部的副作用。如果允许使用 `exec`，拒绝 `write`、`edit` 或 `apply_patch` 并不能使 shell 命令变为只读。
- `/exec` 仅更改已获授权发送者的会话默认值；它不会授予工具访问权限。
- 提供商工具键可以使用 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。
- 当某个工具策略步骤移除工具，或沙箱工具策略阻止调用时，Gateway 网关日志会包含 `agents/tool-policy` 审计条目。使用 `openclaw logs` 查看规则标签、配置键和受影响的工具名称。

### 工具组（简写）

工具策略（全局、Agent、沙箱）支持可展开为多个工具的 `group:*` 条目：

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

可用的组：

| 组                 | 工具                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（接受 `bash` 作为 `exec` 的别名）                                                                                                                                |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                                                                                               |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`                                                                                |
| `group:memory`     | `memory_search`、`memory_get`                                                                                                                                                                        |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                                                                                                |
| `group:ui`         | `browser`、`canvas`                                                                                                                                                                                   |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                                                                                               |
| `group:messaging`  | `message`                                                                                                                                                                                            |
| `group:nodes`      | `nodes`、`computer`                                                                                                                                                                                   |
| `group:agents`     | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`                                                                                                             |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                                                                                                |
| `group:openclaw`   | 大多数 OpenClaw 内置工具（不包括 `read`/`write`/`edit`/`apply_patch`/`exec`/`process` 文件系统及运行时原语、`canvas` 和提供商插件）                                                                   |
| `group:plugins`    | 所有已加载且归插件所有的工具，包括通过 `bundle-mcp` 暴露的已配置 MCP 服务器                                                                                                                         |

对于只读 Agent，除非沙箱文件系统策略或单独的主机边界强制实施只读约束，否则除了会修改文件系统的工具，还应拒绝 `group:runtime`。

对于沙箱隔离的 MCP 服务器，沙箱工具策略是第二道允许门控。如果已配置 `mcp.servers`，但沙箱隔离的轮次中只显示内置工具，请将 `bundle-mcp`、`group:plugins` 或带服务器前缀的 MCP 工具名称/通配模式（例如 `outlook__send_mail` 或 `outlook__*`）添加到 `tools.sandbox.tools.alsoAllow`，然后重启/重新加载 Gateway 网关并重新获取工具列表。服务器通配模式使用符合提供商安全要求的 MCP 服务器前缀：非 `[A-Za-z0-9_-]` 字符会变为 `-`，不以字母开头的名称会添加 `mcp-` 前缀，过长或重复的前缀可能会被截断或添加后缀。

`openclaw doctor` 目前会针对 `mcp.servers` 中由 OpenClaw 管理的服务器检查此配置结构。从内置插件清单或 Claude `.mcp.json` 加载的 MCP 服务器使用相同的沙箱门控，但该诊断尚未枚举这些来源；如果它们的工具在沙箱隔离的轮次中消失，请使用相同的允许列表条目。

## 提升权限：仅限 Exec 的“在主机上运行”

提升权限**不会**授予额外工具；它只影响 `exec`。

- 如果你处于沙箱隔离状态，`/elevated on`（或使用 `elevated: true` 的 `exec`）会在沙箱外运行（仍可能需要审批）。
- 使用 `/elevated full` 跳过该会话的 Exec 审批。
- 如果你已经采用直接运行方式，提升权限实际上不会产生影响（仍受门控限制）。
- 提升权限**不**限定于 Skills，也**不会**覆盖工具允许/拒绝规则。
- 提升权限不会通过 `host=auto` 授予任意跨主机覆盖能力；它遵循常规 Exec 目标规则，并且仅当配置或会话目标已经是 `node` 时才保留 `node`。
- `/exec` 与提升权限彼此独立。它只调整已获授权发送者的按会话 Exec 默认值。

门控：

- 启用配置：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者允许列表：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

请参阅[提升权限模式](/zh-CN/tools/elevated)。

## 常见“沙箱牢笼”问题的修复方法

### “工具 X 被沙箱工具策略阻止”

修复键（任选其一）：

- 禁用沙箱：`agents.defaults.sandbox.mode=off`（或按 Agent 设置 `agents.list[].sandbox.mode=off`）
- 允许在沙箱内使用该工具：
  - 将其从 `tools.sandbox.tools.deny` 中移除（或按 Agent 设置的 `agents.list[].tools.sandbox.tools.deny`）
  - 或将其添加到 `tools.sandbox.tools.allow`（或按 Agent 设置的允许列表）
- 检查 `openclaw logs` 中的 `agents/tool-policy` 条目。它会记录沙箱模式，以及是允许规则还是拒绝规则阻止了该工具。

### “我以为这是主会话，为什么它仍在沙箱中？”

在 `"non-main"` 模式下，群组/渠道键_不是_主会话。请使用 `sandbox explain` 显示的主会话键，或将模式切换为 `"off"`。

## 相关内容

- [沙箱隔离](/zh-CN/gateway/sandboxing)——完整的沙箱参考（模式、作用域、后端、镜像）
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)——按 Agent 覆盖及优先级
- [提升权限模式](/zh-CN/tools/elevated)

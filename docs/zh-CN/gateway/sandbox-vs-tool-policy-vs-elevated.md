---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 为什么工具被阻止：沙箱运行时、工具允许/拒绝策略和提升权限的 Exec 门控
title: 沙箱、工具策略和提升权限
x-i18n:
    generated_at: "2026-06-27T02:06:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw 有三种相关（但不同）的控制项：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具运行的位置**（沙箱后端与主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用/允许使用**。
3. **提升权限**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个**仅适用于 `exec` 的逃生口**，用于在你被沙箱隔离时在沙箱外运行（默认是 `gateway`，或当 exec 目标配置为 `node` 时为 `node`）。

## 快速调试

使用检查器查看 OpenClaw _实际_ 在做什么：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会打印：

- 有效的沙箱模式/作用域/工作区访问权限
- 会话当前是否被沙箱隔离（main 与非 main）
- 有效的沙箱工具允许/拒绝规则（以及它来自智能体/全局/默认中的哪一项）
- 提升权限门控和修复建议键路径

## 沙箱：工具运行的位置

沙箱隔离由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容都在主机上运行。
- `"non-main"`：只有非 main 会话被沙箱隔离（群组/渠道中的常见“意外”）。
- `"all"`：所有内容都被沙箱隔离。

完整矩阵（作用域、工作区挂载、镜像）见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会_穿透_沙箱文件系统：无论你挂载什么，都会以你设置的模式（`:ro` 或 `:rw`）在容器内可见。
- 如果省略模式，默认是读写；对于源代码/密钥，优先使用 `:ro`。
- `scope: "shared"` 会忽略按智能体配置的绑定挂载（只应用全局绑定挂载）。
- OpenClaw 会验证绑定源两次：先验证规范化后的源路径，然后在通过最深的已存在祖先路径解析后再次验证。符号链接父目录逃逸无法绕过阻止路径或允许根目录检查。
- 不存在的叶子路径仍会被安全检查。如果 `/workspace/alias-out/new-file` 通过符号链接父目录解析到被阻止的路径，或解析到配置的允许根目录之外，该绑定会被拒绝。
- 绑定 `/var/run/docker.sock` 实际上会把主机控制权交给沙箱；只应在明确有意时这样做。
- 工作区访问权限（`workspaceAccess: "ro"`/`"rw"`）独立于绑定模式。

## 工具策略：哪些工具存在/可调用

有两层很重要：

- **工具配置档**：`tools.profile` 和 `agents.list[].tools.profile`（基础允许列表）
- **提供商工具配置档**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/按智能体工具策略**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具策略**（仅在被沙箱隔离时适用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验规则：

- `deny` 始终优先。
- 如果 `allow` 非空，其他所有内容都会被视为阻止。
- 工具策略是硬性停止点：`/exec` 不能覆盖被拒绝的 `exec` 工具。
- 工具策略按名称过滤工具可用性；它不会检查 `exec` 内部的副作用。如果允许 `exec`，拒绝 `write`、`edit` 或 `apply_patch` 不会让 shell 命令变为只读。
- `/exec` 只会为已授权发送者更改会话默认值；它不会授予工具访问权限。
  提供商工具键可以接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。
- Gateway 网关日志会在工具策略步骤移除工具或沙箱工具策略阻止调用时包含 `agents/tool-policy` 审计条目。使用 `openclaw logs` 查看规则标签、配置键和受影响的工具名称。

### 工具组（简写）

工具策略（全局、智能体、沙箱）支持会扩展为多个工具的 `group:*` 条目：

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

可用组：

- `group:runtime`：`exec`、`process`、`code_execution`（`bash` 可作为
  `exec` 的别名）
- `group:fs`：`read`、`write`、`edit`、`apply_patch`
  对于只读智能体，除非沙箱文件系统策略或单独的主机边界强制执行只读约束，否则也要拒绝 `group:runtime` 以及会修改文件系统的工具。
- `group:sessions`：`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`
- `group:memory`：`memory_search`、`memory_get`
- `group:web`：`web_search`、`x_search`、`web_fetch`
- `group:ui`：`browser`、`canvas`
- `group:automation`：`heartbeat_respond`、`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:agents`：`agents_list`、`update_plan`
- `group:media`：`image`、`image_generate`、`music_generate`、`video_generate`、`tts`
- `group:openclaw`：所有内置 OpenClaw 工具（不包括提供商插件）
- `group:plugins`：所有已加载的插件拥有工具，包括通过 `bundle-mcp` 暴露的已配置 MCP 服务器

对于被沙箱隔离的 MCP 服务器，沙箱工具策略是第二道允许门控。如果已配置 `mcp.servers`，但被沙箱隔离的轮次只显示内置工具，请将 `bundle-mcp`、`group:plugins` 或带服务器前缀的 MCP 工具名称/glob（如 `outlook__send_mail` 或 `outlook__*`）添加到 `tools.sandbox.tools.alsoAllow`，然后重启/重新加载 Gateway 网关并重新捕获工具列表。服务器 glob 使用提供商安全的 MCP 服务器前缀：非 `[A-Za-z0-9_-]` 字符会变为 `-`，不以字母开头的名称会获得 `mcp-` 前缀，过长或重复的前缀可能会被截断或追加后缀。

`openclaw doctor` 目前会为 `mcp.servers` 中由 OpenClaw 管理的服务器检查这种形状。从内置插件清单或 Claude `.mcp.json` 加载的 MCP 服务器使用相同的沙箱门控，但此诊断尚未枚举这些来源；如果它们的工具在被沙箱隔离的轮次中消失，请使用相同的允许列表条目。

## 提升权限：仅适用于 exec 的“在主机上运行”

提升权限**不会**授予额外工具；它只影响 `exec`。

- 如果你被沙箱隔离，`/elevated on`（或带有 `elevated: true` 的 `exec`）会在沙箱外运行（审批可能仍然适用）。
- 使用 `/elevated full` 可跳过该会话的 exec 审批。
- 如果你已经在直接运行，提升权限实际上没有效果（仍受门控约束）。
- 提升权限**不**按 skill 限定作用域，也**不会**覆盖工具允许/拒绝规则。
- 提升权限不会从 `host=auto` 授予任意跨主机覆盖；它遵循正常的 exec 目标规则，并且只有在已配置/会话目标已经是 `node` 时才保留 `node`。
- `/exec` 与提升权限是分开的。它只会为已授权发送者调整按会话配置的 exec 默认值。

门控：

- 启用：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者允许列表：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

见 [Elevated Mode](/zh-CN/tools/elevated)。

## 常见“沙箱牢笼”修复

### “工具 X 被沙箱工具策略阻止”

修复建议键（任选其一）：

- 禁用沙箱：`agents.defaults.sandbox.mode=off`（或按智能体配置 `agents.list[].sandbox.mode=off`）
- 在沙箱内允许该工具：
  - 将其从 `tools.sandbox.tools.deny` 中移除（或按智能体配置的 `agents.list[].tools.sandbox.tools.deny`）
  - 或将其添加到 `tools.sandbox.tools.allow`（或按智能体配置的允许列表）
- 检查 `openclaw logs` 中的 `agents/tool-policy` 条目。它会记录沙箱模式，以及是允许规则还是拒绝规则阻止了该工具。

### “我以为这是 main，为什么它被沙箱隔离了？”

在 `"non-main"` 模式下，群组/渠道键_不是_ main。使用 main 会话键（由 `sandbox explain` 显示），或将模式切换为 `"off"`。

## 相关

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整沙箱参考（模式、作用域、后端、镜像）
- [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖和优先级
- [Elevated Mode](/zh-CN/tools/elevated)

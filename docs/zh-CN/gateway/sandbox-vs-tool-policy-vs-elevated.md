---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 工具为何被阻止：沙箱运行时、工具 allow/deny 策略与 elevated 门控
title: 沙箱 vs 工具策略 vs Elevated
x-i18n:
    generated_at: "2026-04-05T08:24:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# 沙箱 vs 工具策略 vs Elevated

OpenClaw 有三个相关但不同的控制项：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在哪里运行**（Docker 或主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用/允许使用**。
3. **Elevated**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个**仅限 exec 的逃生口**，用于在你处于沙箱中时在沙箱外运行（默认是 `gateway`，或者当 exec 目标配置为 `node` 时使用 `node`）。

## 快速调试

使用检查器查看 OpenClaw **实际**在做什么：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会打印：

- 生效的沙箱 mode/scope/workspace 访问
- 当前会话是否处于沙箱中（main 与非 main）
- 生效的沙箱工具 allow/deny（以及它来自智能体/全局/默认值中的哪一层）
- elevated 门控和修复用 key 路径

## 沙箱：工具在哪里运行

沙箱隔离由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容都在主机上运行。
- `"non-main"`：只有非主会话会进入沙箱（群组/渠道中常见的“意外情况”）。
- `"all"`：所有内容都在沙箱中运行。

完整矩阵（scope、workspace 挂载、镜像）请参阅[沙箱隔离](/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会**穿透**沙箱文件系统：你挂载的任何内容都会按照你设置的模式（`:ro` 或 `:rw`）在容器内可见。
- 如果省略模式，默认是读写；对于源码/密钥，优先使用 `:ro`。
- `scope: "shared"` 会忽略按智能体设置的挂载（仅应用全局挂载）。
- OpenClaw 会对挂载源做两次校验：先对标准化后的源路径校验，然后在通过最深的现有祖先路径解析后再次校验。父级符号链接逃逸无法绕过被阻止路径或允许根路径检查。
- 不存在的叶子路径仍会被安全检查。如果 `/workspace/alias-out/new-file` 通过某个符号链接父路径解析到一个被阻止路径，或超出已配置允许根路径，挂载会被拒绝。
- 挂载 `/var/run/docker.sock` 基本等同于把主机控制权交给沙箱；只有在你明确有意这样做时才应使用。
- 工作区访问（`workspaceAccess: "ro"`/`"rw"`）与挂载模式是相互独立的。

## 工具策略：哪些工具存在/可被调用

这里有两层需要关注：

- **工具配置文件**：`tools.profile` 和 `agents.list[].tools.profile`（基础允许列表）
- **提供商工具配置文件**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/按智能体工具策略**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具策略**（仅在处于沙箱中时生效）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验法则：

- `deny` 总是优先生效。
- 如果 `allow` 非空，则其他所有内容都视为被阻止。
- 工具策略是硬性终点：`/exec` 不能覆盖被拒绝的 `exec` 工具。
- `/exec` 只会为已授权发送者更改会话默认值；它不会授予工具访问权限。
  提供商工具键既可以接受 `provider`（例如 `google-antigravity`），也可以接受 `provider/model`（例如 `openai/gpt-5.4`）。

### 工具组（简写）

工具策略（全局、智能体、沙箱）支持 `group:*` 条目，可展开为多个工具：

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
- `group:sessions`：`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`
- `group:memory`：`memory_search`、`memory_get`
- `group:web`：`web_search`、`x_search`、`web_fetch`
- `group:ui`：`browser`、`canvas`
- `group:automation`：`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:agents`：`agents_list`
- `group:media`：`image`、`image_generate`、`tts`
- `group:openclaw`：所有内置 OpenClaw 工具（不包括提供商插件）

## Elevated：仅限 exec 的“在主机上运行”

Elevated **不会**授予额外工具；它只影响 `exec`。

- 如果你处于沙箱中，`/elevated on`（或带 `elevated: true` 的 `exec`）会在沙箱外运行（仍可能需要审批）。
- 使用 `/elevated full` 可跳过该会话的 exec 审批。
- 如果你本来就直接在主机上运行，elevated 实际上是无操作（但仍受门控）。
- Elevated **不是**按 Skills 作用域划分的，也**不会**覆盖工具 allow/deny。
- Elevated 不会从 `host=auto` 授予任意跨主机覆盖；它遵循正常的 exec 目标规则，并且只有当已配置/会话目标本来就是 `node` 时才会保留 `node`。
- `/exec` 与 elevated 是分开的。它只会为已授权发送者调整按会话划分的 exec 默认值。

门控：

- 启用开关：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者允许列表：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

请参阅[Elevated 模式](/tools/elevated)。

## 常见“沙箱牢笼”修复方法

### “工具 X 被沙箱工具策略阻止”

修复键（选一个）：

- 禁用沙箱：`agents.defaults.sandbox.mode=off`（或按智能体设置 `agents.list[].sandbox.mode=off`）
- 允许该工具在沙箱中运行：
  - 将它从 `tools.sandbox.tools.deny` 中移除（或从按智能体的 `agents.list[].tools.sandbox.tools.deny` 中移除）
  - 或将它加入 `tools.sandbox.tools.allow`（或按智能体的 allow）

### “我以为这是 main，为什么它在沙箱里？”

在 `"non-main"` 模式下，群组/渠道 key **不是** main。请使用主会话 key（`sandbox explain` 会显示），或将 mode 切换为 `"off"`。

## 另请参阅

- [沙箱隔离](/gateway/sandboxing) -- 完整的沙箱参考（模式、作用域、后端、镜像）
- [多智能体沙箱与工具](/tools/multi-agent-sandbox-tools) -- 按智能体覆盖与优先级
- [Elevated 模式](/tools/elevated)

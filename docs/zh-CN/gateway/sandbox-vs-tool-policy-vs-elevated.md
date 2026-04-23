---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 工具为何会被阻止：沙箱运行时、工具允许/拒绝策略，以及提权执行门禁
title: 沙箱 vs 工具策略 vs 提权执行
x-i18n:
    generated_at: "2026-04-23T19:24:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfc54cdb1adbe37a2cfa837560d3d3862c1aa2732dcb8a73377114d4b873e569
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# 沙箱 vs 工具策略 vs 提权执行

OpenClaw 有三个相关但不同的控制项：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在哪里运行**（沙箱后端还是主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用/允许使用**。
3. **提权执行**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个**仅针对 exec 的逃逸通道**：当你处于沙箱中时，可让其在沙箱外运行（默认是 `gateway`，或者当 exec 目标配置为 `node` 时使用 `node`）。

## 快速调试

使用检查器查看 OpenClaw _实际_ 在做什么：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会输出：

- 生效中的沙箱模式 / 作用域 / 工作区访问权限
- 当前会话是否处于沙箱中（主会话 vs 非主会话）
- 生效中的沙箱工具允许 / 拒绝规则（以及其来源是智能体 / 全局 / 默认值）
- 提权执行门禁和修复建议键路径

## 沙箱：工具在哪里运行

沙箱隔离由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容都在主机上运行。
- `"non-main"`：只有非主会话会被沙箱隔离（这是群组 / 渠道中常见的“意外”来源）。
- `"all"`：所有内容都在沙箱中运行。

完整矩阵（作用域、工作区挂载、镜像）请参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会_穿透_沙箱文件系统：你挂载的任何内容都会以你设置的模式（`:ro` 或 `:rw`）出现在容器内。
- 如果省略模式，默认是读写；对于源码 / 密钥，优先使用 `:ro`。
- `scope: "shared"` 会忽略按智能体设置的挂载（仅应用全局挂载）。
- OpenClaw 会对绑定源路径进行两次验证：首先验证规范化后的源路径，然后在通过最深的现有祖先路径解析后再次验证。基于父级符号链接的逃逸无法绕过阻止路径或允许根路径检查。
- 不存在的叶子路径仍会被安全检查。如果 `/workspace/alias-out/new-file` 通过符号链接父路径解析到某个被阻止的路径，或位于已配置允许根路径之外，则该绑定会被拒绝。
- 绑定 `/var/run/docker.sock` 实际上等于把主机控制权交给沙箱；只有在你明确有此意图时才应这样做。
- 工作区访问（`workspaceAccess: "ro"` / `"rw"`）与绑定模式无关。

## 工具策略：哪些工具存在 / 可调用

有两层很重要：

- **工具配置文件**：`tools.profile` 和 `agents.list[].tools.profile`（基础允许列表）
- **提供商工具配置文件**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局 / 按智能体工具策略**：`tools.allow` / `tools.deny` 和 `agents.list[].tools.allow` / `agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具策略**（仅在处于沙箱时生效）：`tools.sandbox.tools.allow` / `tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验规则：

- `deny` 总是优先生效。
- 如果 `allow` 非空，则其他所有内容都视为被阻止。
- 工具策略是硬性终止条件：`/exec` 不能覆盖被拒绝的 `exec` 工具。
- `/exec` 只会为已授权发送者更改会话默认值；它不会授予工具访问权限。
  提供商工具键可接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.5`）。

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
  `exec` 的别名使用）
- `group:fs`：`read`、`write`、`edit`、`apply_patch`
- `group:sessions`：`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status`
- `group:memory`：`memory_search`、`memory_get`
- `group:web`：`web_search`、`x_search`、`web_fetch`
- `group:ui`：`browser`、`canvas`
- `group:automation`：`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:agents`：`agents_list`
- `group:media`：`image`、`image_generate`、`video_generate`、`tts`
- `group:openclaw`：所有 OpenClaw 内置工具（不包括提供商插件）

## 提权执行：仅针对 exec 的“在主机上运行”

提权执行**不会**授予额外工具；它只影响 `exec`。

- 如果你处于沙箱中，`/elevated on`（或带 `elevated: true` 的 `exec`）会在沙箱外运行（仍可能需要审批）。
- 使用 `/elevated full` 可为当前会话跳过 exec 审批。
- 如果你已经在直接运行环境中，提权执行实际上不会产生效果（但仍受门禁控制）。
- 提权执行**不是** Skills 作用域的，也**不会**覆盖工具允许 / 拒绝规则。
- 提权执行不会从 `host=auto` 授予任意跨主机覆盖；它遵循正常的 exec 目标规则，且仅在配置的 / 会话的目标本来就是 `node` 时才保留 `node`。
- `/exec` 与提权执行是分开的。它只会为已授权发送者调整按会话生效的 exec 默认值。

门禁：

- 启用项：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者允许列表：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

请参见 [提权模式](/zh-CN/tools/elevated)。

## 常见“沙箱牢笼”修复方法

### “工具 X 被沙箱工具策略阻止”

修复建议键（任选其一）：

- 禁用沙箱：`agents.defaults.sandbox.mode=off`（或按智能体设置 `agents.list[].sandbox.mode=off`）
- 允许该工具在沙箱内使用：
  - 将其从 `tools.sandbox.tools.deny` 中移除（或按智能体从 `agents.list[].tools.sandbox.tools.deny` 中移除）
  - 或将其添加到 `tools.sandbox.tools.allow`（或按智能体添加到 allow）

### “我以为这是主会话，为什么它被沙箱隔离了？”

在 `"non-main"` 模式下，群组 / 渠道键_不是_主会话。请使用主会话键（由 `sandbox explain` 显示），或将模式切换为 `"off"`。

## 另请参见

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整沙箱参考（模式、作用域、后端、镜像）
- [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 按智能体覆盖和优先级
- [提权模式](/zh-CN/tools/elevated)

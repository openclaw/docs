---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 工具为何被阻止：沙箱运行时、工具允许/拒绝策略和提权执行门禁
title: 沙箱、工具策略与提权
x-i18n:
    generated_at: "2026-05-06T05:29:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw 有三类相关（但不同）的控制项：

1. **沙箱**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在哪里运行**（沙箱后端还是主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用/允许调用**。
3. **提权**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个**仅限 exec 的逃生口**，用于在你处于沙箱隔离时在沙箱外运行（默认是 `gateway`，或者当 exec 目标配置为 `node` 时使用 `node`）。

## 快速调试

使用检查器查看 OpenClaw _实际_ 在做什么：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会输出：

- 有效的沙箱模式/作用域/工作区访问权限
- 会话当前是否处于沙箱隔离中（main 与非 main）
- 有效的沙箱工具允许/拒绝策略（以及它来自智能体/全局/默认值中的哪一层）
- 提权门控和修复键路径

## 沙箱：工具运行位置

沙箱隔离由 `agents.defaults.sandbox.mode` 控制：

- `"off"`：所有内容都在主机上运行。
- `"non-main"`：只有非 main 会话会被沙箱隔离（这是群组/渠道中常见的“意外”情况）。
- `"all"`：所有内容都会被沙箱隔离。

完整矩阵（作用域、工作区挂载、镜像）见[沙箱隔离](/zh-CN/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会_穿透_沙箱文件系统：你挂载的任何内容都会以你设置的模式（`:ro` 或 `:rw`）在容器内可见。
- 如果省略模式，默认是读写；对源码/密钥优先使用 `:ro`。
- `scope: "shared"` 会忽略每个智能体的绑定挂载（只应用全局绑定挂载）。
- OpenClaw 会对绑定源进行两次验证：先验证规范化后的源路径，然后在通过最深的已存在祖先解析后再次验证。符号链接父级逃逸无法绕过被阻止路径或允许根目录检查。
- 不存在的叶子路径仍会被安全检查。如果 `/workspace/alias-out/new-file` 通过符号链接父级解析到被阻止路径，或解析到配置的允许根目录之外，该绑定挂载会被拒绝。
- 绑定 `/var/run/docker.sock` 实际上会把主机控制权交给沙箱；只有在明确有意这样做时才使用。
- 工作区访问权限（`workspaceAccess: "ro"`/`"rw"`）独立于绑定挂载模式。

## 工具策略：哪些工具存在/可调用

有两层很重要：

- **工具配置文件**：`tools.profile` 和 `agents.list[].tools.profile`（基础允许列表）
- **提供商工具配置文件**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/每智能体工具策略**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙箱工具策略**（仅在沙箱隔离时适用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验规则：

- `deny` 始终优先。
- 如果 `allow` 非空，其他所有内容都会被视为阻止。
- 工具策略是硬性限制：`/exec` 无法覆盖被拒绝的 `exec` 工具。
- `/exec` 只会为授权发送者改变会话默认值；它不会授予工具访问权限。
  提供商工具键接受 `provider`（例如 `google-antigravity`）或 `provider/model`（例如 `openai/gpt-5.4`）。

### 工具组（简写）

工具策略（全局、智能体、沙箱）支持 `group:*` 条目，它们会展开为多个工具：

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
- `group:automation`：`heartbeat_respond`、`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:agents`：`agents_list`、`update_plan`
- `group:media`：`image`、`image_generate`、`music_generate`、`video_generate`、`tts`
- `group:openclaw`：所有内置 OpenClaw 工具（不包括提供商插件）

## 提权：仅限 exec 的“在主机上运行”

提权**不会**授予额外工具；它只影响 `exec`。

- 如果你处于沙箱隔离中，`/elevated on`（或带有 `elevated: true` 的 `exec`）会在沙箱外运行（仍可能需要批准）。
- 使用 `/elevated full` 跳过该会话的 exec 批准。
- 如果你已经在直接运行，提权实际上不会产生效果（仍受门控约束）。
- 提权**不**按 Skills 作用域划分，也**不会**覆盖工具允许/拒绝策略。
- 提权不会从 `host=auto` 授予任意跨主机覆盖；它遵循常规 exec 目标规则，并且只有当配置/会话目标已经是 `node` 时才保留 `node`。
- `/exec` 与提权是分开的。它只为授权发送者调整每会话 exec 默认值。

门控：

- 启用：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者允许列表：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

见[提权模式](/zh-CN/tools/elevated)。

## 常见“沙箱监禁”修复

### “工具 X 被沙箱工具策略阻止”

修复键（选择一个）：

- 禁用沙箱：`agents.defaults.sandbox.mode=off`（或每智能体的 `agents.list[].sandbox.mode=off`）
- 在沙箱内允许该工具：
  - 从 `tools.sandbox.tools.deny` 中移除它（或每智能体的 `agents.list[].tools.sandbox.tools.deny`）
  - 或将它添加到 `tools.sandbox.tools.allow`（或每智能体的 allow）

### “我以为这是 main，为什么它被沙箱隔离了？”

在 `"non-main"` 模式下，群组/渠道键_不是_ main。使用 main 会话键（由 `sandbox explain` 显示）或将模式切换为 `"off"`。

## 相关

- [沙箱隔离](/zh-CN/gateway/sandboxing) -- 完整沙箱参考（模式、作用域、后端、镜像）
- [多智能体沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools) -- 每智能体覆盖和优先级
- [提权模式](/zh-CN/tools/elevated)

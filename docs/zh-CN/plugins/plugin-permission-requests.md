---
read_when:
    - 你需要一个插件钩子或工具，在副作用运行前进行询问
    - 你需要配置插件审批提示的送达位置
    - 你正在决定选择可选工具、Exec 审批还是插件审批
sidebarTitle: Permission requests
summary: 要求用户批准插件工具调用和插件所属权限提示
title: 插件权限请求
x-i18n:
    generated_at: "2026-07-05T11:33:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa8c26d84aef6518186e55674171bb46b3fa8710333c0da6ac16c01a78f678a7
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

插件权限请求允许插件代码暂停工具调用或插件拥有的操作，直到用户批准或拒绝。它们使用 Gateway 网关 `plugin.approval.*` 流程，以及处理聊天审批按钮和 `/approve` 命令的同一审批 UI 表面。

将插件权限请求用于插件/应用权限。它们不会取代主机 Exec 审批、可选工具 allowlist 或 Codex 的原生权限审查。

## 选择正确的门控

选择与你需要的决策点匹配的门控：

| 门控                             | 使用场景                                                              | 控制内容                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 可选工具                   | 在用户选择启用之前，不应让模型看到某个工具。        | 通过 `tools.allow` 暴露工具。                                                                              |
| 插件权限请求       | 插件钩子或插件拥有的操作必须在某个操作运行前询问。 | 通过 `plugin.approval.*` 进行运行时审批。                                                                     |
| Exec 审批                   | 主机命令或类似 shell 的工具需要操作员审批。               | 主机 Exec 策略和持久 Exec allowlist。                                                                     |
| Codex 原生权限请求 | Codex 在原生 shell、文件、MCP 或应用服务器操作前询问。        | Codex 应用服务器或原生钩子审批处理，当 OpenClaw 负责该提示时通过插件审批路由。 |
| MCP 审批请求        | Codex MCP 服务器为工具调用请求审批。                    | 通过 OpenClaw 插件审批桥接的 MCP 审批响应。                                                 |

可选工具是发现时门控。插件权限请求是逐调用门控。当敏感工具需要在模型可见之前显式选择启用，并且在操作运行之前审批时，请同时使用两者。

## 在工具调用前请求审批

大多数插件编写的提示都应从 `before_tool_call` 钩子开始。该钩子在模型选择工具之后、OpenClaw 执行它之前运行：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

为将要批准该操作的人编写提示文本：

- 保持 `title` 简短并聚焦操作；Gateway 网关将其限制为 80 个字符。
- 保持 `description` 具体且有边界；Gateway 网关将其限制为 256 个字符。
- 包含操作、目标和风险。不要包含不应出现在聊天审批表面中的密钥、令牌或私有载荷。
- 省略 `severity` 时默认值为 `"warning"`。仅对错误决策可能造成生产损坏或数据丢失的操作使用 `"critical"`。
- 省略 `allowedDecisions` 时默认值为 `["allow-once", "allow-always", "deny"]`。当该操作不适合持久信任时，传入 `["allow-once", "deny"]`。
- `timeoutMs` 默认值为 120000（2 分钟），无论请求值如何，都会被限制为 600000（10 分钟）。

## 决策行为

OpenClaw 会创建一个带有 `plugin:` ID 的待处理审批，将其交付到可用的审批表面，并等待决策。

| 决策          | 结果                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 当前调用继续。                                               |
| `allow-always`    | 当前调用继续，并将该决策传递给插件。      |
| `deny`            | 调用被阻止，并返回被拒绝的工具结果。                            |
| 超时           | 除非 `timeoutBehavior` 为 `"allow"`，否则调用被阻止。                |
| 取消      | 运行中止时调用被阻止。                              |
| 无审批路由 | 调用被阻止，因为没有已连接的审批表面可以解决它。 |

只有在请求插件或运行时实现了该持久化时，`allow-always` 才是持久的。对于普通的 `before_tool_call.requireApproval` 钩子，OpenClaw 会将 `allow-once` 和 `allow-always` 视为当前调用的审批决策，并将解析后的值传递给 `onResolution`。如果你的插件提供 `allow-always`，请准确记录并实现它信任哪些未来调用。

如果钩子还返回 `params`，OpenClaw 只会在审批成功后应用这些参数变更。较低优先级的钩子仍然可以在较高优先级的钩子请求审批后阻止调用。

`allowedDecisions` 会限制向用户显示的按钮和命令。对于请求未提供的任何决策，Gateway 网关都会拒绝解析尝试。

## 路由审批提示

审批提示可以在本地 UI 表面中解决，也可以在支持审批处理的聊天渠道中解决。要将插件审批提示转发到显式聊天目标，请配置 `approvals.plugin`：

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` 独立于 `approvals.exec`。启用 Exec 审批转发不会路由插件审批提示，启用插件审批转发也不会更改主机 Exec 策略。

当提示包含手动审批文本时，请使用提供的决策之一解决它：

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

参见 [高级 Exec 审批](/zh-CN/tools/exec-approvals-advanced#plugin-approval-forwarding)，了解完整转发模型、同一聊天审批行为、原生渠道交付和特定渠道审批者规则。

## Codex 原生权限

Codex 原生权限提示也可以通过插件审批传递，但它们与插件编写的钩子具有不同的所有权。

- Codex 应用服务器审批请求会在 Codex 审查后通过 OpenClaw 路由。
- 启用原生钩子 `permission_request` 中继后，它可以通过 `plugin.approval.request` 请求。
- 当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，MCP 工具审批请求会通过插件审批路由。

参见 [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)，了解 Codex 特定行为和回退规则。

## 故障排查

**工具提示插件审批不可用。** 没有审批 UI 或已配置的审批路由接受该请求。连接支持审批的客户端，使用支持同一聊天 `/approve` 的渠道，或配置 `approvals.plugin`。

**`allow-always` 出现了，但下一次调用又提示。** 通用插件审批流不会自动为任意钩子持久化信任。在你的插件中于 `onResolution("allow-always")` 后持久化插件拥有的信任，或仅提供 `allow-once` 和 `deny`。

**`/approve` 拒绝该决策。** 请求限制了 `allowedDecisions`。请使用提示中打印的决策之一。

**Discord、Matrix、Slack 或 Telegram 提示的路由方式与 Exec 审批不同。** 插件审批和 Exec 审批使用单独的配置，并且可能使用不同的授权检查。请验证 `approvals.plugin` 和该渠道的插件审批支持，而不是只检查 `approvals.exec`。

## 相关

- [插件钩子](/zh-CN/plugins/hooks#tool-call-policy)
- [构建插件](/zh-CN/plugins/building-plugins#registering-tools)
- [高级 Exec 审批](/zh-CN/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway 网关协议](/zh-CN/gateway/protocol)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)

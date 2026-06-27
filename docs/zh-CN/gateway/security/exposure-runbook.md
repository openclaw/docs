---
read_when:
    - 通过局域网、tailnet、Tailscale Serve、Funnel 或反向代理暴露 Gateway 网关
    - 在允许真实消息用户使用前审查部署
    - 回滚有风险的远程访问或私信配置
sidebarTitle: Exposure runbook
summary: 在将 OpenClaw Gateway 网关暴露到回环地址之外之前的预检和回滚清单
title: Gateway 暴露运行手册
x-i18n:
    generated_at: "2026-06-27T02:08:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
只有在你能说明谁可以访问 Gateway 网关、他们如何通过身份验证、他们可以触发哪些智能体，以及这些智能体可以使用哪些工具之后，才暴露 Gateway 网关。拿不准时，退回到仅 loopback 访问并重新运行审计。
</Warning>

本运行手册将更广泛的 [Security](/zh-CN/gateway/security) 指南转换为远程访问和消息暴露的运维清单。

## 选择暴露模式

优先选择满足工作流的最窄模式。

| 模式                       | 建议使用场景                                    | 必需控制措施                                                                                        |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + SSH 隧道        | 个人使用、管理员访问、调试                      | 保持 `gateway.bind: "loopback"` 并通过隧道转发 `127.0.0.1:18789`                                    |
| Loopback + Tailscale Serve | 个人 tailnet 访问 Control UI/WebSocket          | 保持 Gateway 网关仅 loopback；仅在受支持的界面上依赖 Tailscale 身份标头                            |
| Tailnet/LAN 绑定           | 具备已知设备的专用私有网络                      | Gateway 网关身份验证、防火墙允许列表、无公共端口转发                                               |
| 受信任反向代理             | 组织 SSO/OIDC 位于 Gateway 网关前               | `trusted-proxy` 身份验证、严格的 `trustedProxies`、标头覆盖/剥离规则、明确允许的用户                |
| 公共互联网                 | 少见的高风险部署                                | 感知身份的代理、TLS、速率限制、严格允许列表、沙箱隔离的非 main 会话                                |

避免直接将公共端口转发到 Gateway 网关。如果你需要公共访问，请在它前面放置一个感知身份的代理，并让该代理成为通往 Gateway 网关的唯一网络路径。

## 预检清单

在更改绑定、代理、Tailscale 或渠道策略之前记录这些内容：

- Gateway 网关主机、OS 用户和状态目录。
- Gateway 网关 URL 和绑定模式。
- 身份验证模式、令牌/密码来源，或受信任代理身份来源。
- 所有启用的渠道，以及它们是否接受私信、群组或 webhook。
- 非本地发送者可访问的智能体。
- 每个可访问智能体的工具配置、沙箱模式和提升权限工具策略。
- 这些智能体可用的外部凭证。
- `~/.openclaw/openclaw.json` 和凭证的备份位置。

如果不止一个人可以向 bot 发送消息，请将其视为共享的委派工具权限，而不是按用户隔离的主机。

## 基线检查

在开放访问之前运行这些命令：

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

先解决严重发现。警告只有在该部署中有意接受并已记录时才可以接受。

对于远程 CLI 验证，请显式传递凭证：

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

不要假设本地配置凭证会应用于显式远程 URL。

## 最低安全基线

将此形态作为暴露部署的起点：

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

然后一次只放宽一项控制。例如，在启用具备写入能力的工具之前添加特定渠道允许列表，或在接受远程 Control UI 流量之前启用反向代理。

严格的 `exec.security: "deny"` 基线会阻止所有 exec 调用，包括良性诊断。如果需要诊断或低风险命令，只有在选择了与你的威胁模型匹配的具体发送者、智能体、命令和审批模式之后，才放宽此设置。

## 私信和群组暴露

消息渠道是不受信任的输入界面。在允许私信或群组之前：

- 优先使用 `dmPolicy: "pairing"` 或严格的 `allowFrom` 列表。
- 除非每个发送者都可信，否则避免使用 `dmPolicy: "open"`。
- 不要将 `"*"` 允许列表与宽泛工具访问组合使用。
- 除非房间受到严格控制，否则要求在群组中提及。
- 当多人可以私信 bot 时，使用 `session.dmScope: "per-channel-peer"`。
- 将共享渠道路由到工具最少且没有个人凭证的智能体。

配对批准发送者触发 bot。它不会让该发送者成为单独的主机安全边界。

## 反向代理检查

对于感知身份的代理：

- 代理必须先验证用户身份，然后再转发到 Gateway 网关。
- 必须通过防火墙或网络策略阻止直接访问 Gateway 网关端口。
- `gateway.trustedProxies` 必须只包含代理源 IP。
- 代理必须剥离或覆盖客户端提供的身份和转发标头。
- 当代理服务多个受众时，`gateway.auth.trustedProxy.allowUsers` 应列出预期用户。
- 同主机 loopback 代理模式只有在本地进程可信且代理拥有身份标头时才应使用 `allowLoopback`。

代理更改后运行 `openclaw security audit --deep`。受信任代理发现有意保持高信号，因为代理会成为身份验证边界。

## 工具和沙箱审查

在将智能体暴露给远程发送者之前：

- 确认哪些会话在主机上运行，哪些在沙箱中运行。
- 拒绝主机 exec，或要求主机 exec 审批。
- 除非特定受信任发送者需要，否则保持提升权限工具禁用。
- 对开放或半开放的消息界面，避免使用浏览器、canvas、node、cron、gateway 和会话生成工具。
- 保持绑定挂载范围狭窄，并避免凭证、home、Docker socket 和系统路径。
- 对实质上不同的信任边界使用单独的 Gateway 网关、OS 用户或主机。

如果远程用户并非完全可信，隔离必须来自单独部署，而不仅仅来自提示词或会话标签。

## 变更后验证

每次暴露更改后：

1. 重新运行 `openclaw security audit --deep`。
2. 测试一次成功的已授权连接。
3. 测试未授权发送者或浏览器会话会被拒绝。
4. 确认日志会遮盖密钥。
5. 确认私信/群组路由只到达预期智能体。
6. 确认高影响工具会请求审批或被拒绝。
7. 记录已接受的残余警告。

在理解当前暴露更改之前，不要继续下一项暴露更改。

## 回滚计划

如果 Gateway 网关可能暴露过度：

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

然后：

1. 停止公共转发、Tailscale Funnel 或反向代理路由。
2. 轮换 Gateway 网关令牌/密码和受影响的集成凭证。
3. 从允许列表中移除 `"*"` 和意外发送者。
4. 审查最近的审计日志、运行历史、工具调用和配置更改。
5. 重新运行 `openclaw security audit --deep`。
6. 使用满足工作流的最窄模式重新启用访问。

## 审查清单

- Gateway 网关保持仅 loopback，除非有已记录的原因。
- 非 loopback 访问具有身份验证、防火墙控制，且没有公共直接路由。
- 受信任代理部署具有严格的代理 IP 和标头控制。
- 私信使用配对或允许列表，默认不开放访问。
- 群组要求提及或显式允许列表。
- 共享渠道无法访问个人凭证。
- 非 main 会话在沙箱模式下运行。
- 主机 exec 和提升权限工具被拒绝或受审批门控。
- 日志会遮盖密钥。
- 严重审计发现已解决。
- 回滚步骤已测试并记录。

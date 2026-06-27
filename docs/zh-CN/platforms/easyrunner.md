---
read_when:
    - 在 EasyRunner 上部署 OpenClaw
    - 在 EasyRunner 的 Caddy 代理后运行 Gateway 网关
    - 为托管式 Gateway 网关选择持久卷和认证
summary: 在 EasyRunner 上使用 Podman 和 Caddy 运行 OpenClaw Gateway 网关
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T02:29:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner 可以将 OpenClaw Gateway 网关作为一个小型容器化应用托管在其 Caddy 代理后面。本指南假设 EasyRunner 主机运行兼容 Podman 的 Compose 应用，并通过 Caddy 暴露 HTTPS。

## 开始之前

- 一个已将域名路由到它的 EasyRunner 服务器。
- 一个已构建或已发布的 OpenClaw 容器镜像。
- 用于 `/home/node/.openclaw` 的持久配置卷。
- 用于 `/workspace` 的持久工作区卷。
- 一个强 Gateway 网关令牌或密码。

尽可能保持设备认证启用。如果你的反向代理部署无法正确携带设备身份，请先修复受信任代理设置；仅在完全私有、由运维者控制的网络中使用危险的认证绕过。

## Compose 应用

创建一个 EasyRunner 应用，使用形状如下的 Compose 文件：

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

将 `openclaw.example.com` 替换为你的 Gateway 网关主机名。将 `OPENCLAW_GATEWAY_TOKEN` 存储在 EasyRunner 的密钥/环境管理器中，而不是提交到应用定义里。

## 配置 OpenClaw

在持久配置卷内，让 Gateway 网关只能通过代理访问，并要求认证：

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

如果 Caddy 为 Gateway 网关终止 TLS，请为精确的代理路径配置受信任代理设置，而不是全局禁用认证检查。参见[受信任代理认证](/zh-CN/gateway/trusted-proxy-auth)。

## 验证

从你的工作站执行：

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

从 EasyRunner 主机检查应用日志，确认 Gateway 网关正在监听，并且没有启动时的 SecretRef、插件或渠道认证失败。

## 更新和备份

- 拉取或构建新的 OpenClaw 镜像，然后重新部署 EasyRunner 应用。
- 更新前备份 `openclaw-config` 卷。
- 如果智能体会在那里写入持久项目数据，请备份 `openclaw-workspace`。
- 重大更新后运行 `openclaw doctor`，以捕获配置迁移和服务警告。

## 故障排除

- `gateway probe` 无法连接：确认 Caddy 主机名指向该应用，并且容器监听 `0.0.0.0:1455`。
- 认证失败：同时轮换 EasyRunner 密钥中的令牌和本地客户端命令中的令牌。
- 恢复后文件归 root 所有：修复挂载的卷，使容器用户可以写入 `/home/node/.openclaw` 和 `/workspace`。
- 浏览器或渠道插件失败：检查容器内是否可用所需的外部二进制文件、网络出站访问和已挂载凭据。

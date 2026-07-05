---
read_when:
    - 在 EasyRunner 上部署 OpenClaw
    - 通过 EasyRunner 的 Caddy 代理运行 Gateway 网关
    - 为托管式 Gateway 网关选择持久卷和认证
summary: 在 EasyRunner 上使用 Podman 和 Caddy 运行 OpenClaw Gateway 网关
title: EasyRunner
x-i18n:
    generated_at: "2026-07-05T11:27:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner 将 OpenClaw Gateway 网关作为一个小型容器化应用托管在其 Caddy 代理后面。本指南假设 EasyRunner 主机运行兼容 Podman 的 Compose 应用，并通过 Caddy 终止 HTTPS。

## 开始之前

- 一台已将域名路由到它的 EasyRunner 服务器。
- 官方 OpenClaw 镜像（`ghcr.io/openclaw/openclaw`）或你自己的构建。
- 用于 `/home/node/.openclaw` 的持久配置卷。
- 用于 `/home/node/.openclaw/workspace` 的持久工作区卷。
- 一个强 Gateway 网关令牌或密码。

尽可能保持设备身份验证启用。如果你的反向代理无法正确传递设备身份，请先修复受信任代理设置（参见 [受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)）；只在完全私有、由操作员控制的网络上使用危险的身份验证绕过。

## Compose 应用

创建一个 EasyRunner 应用，使用如下形态的 Compose 文件：

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
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

将 `openclaw.example.com` 替换为你的 Gateway 网关主机名。将 `OPENCLAW_GATEWAY_TOKEN` 存储在 EasyRunner 的机密/环境管理器中，而不是提交到应用定义里。该镜像默认绑定到 loopback，因此 `command` 中显式的 `--bind lan --port 1455` 是 Caddy 访问容器所必需的。

## 配置 OpenClaw

在持久配置卷内，让 Gateway 网关只能通过代理访问，并要求身份验证：

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

如果 Caddy 为 Gateway 网关终止 TLS，请为确切的代理路径配置受信任代理设置，而不是全局禁用身份验证检查。参见 [受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)。

## 验证

从你的工作站运行：

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

从 EasyRunner 主机看，`GET /healthz`（存活性）和 `GET /readyz`（就绪性）不需要身份验证，并支撑镜像内置的容器健康检查。还要检查应用日志，确认 Gateway 网关正在监听，且没有启动时的 SecretRef、插件或渠道身份验证失败。

## 更新和备份

- 拉取或构建新的 OpenClaw 镜像，然后重新部署 EasyRunner 应用。
- 更新前备份 `openclaw-config` 卷。它保存 `openclaw.json`、`agents/<agentId>/agent/auth-profiles.json` 和已安装的插件包状态。
- 如果智能体会在那里写入持久项目数据，请备份 `openclaw-workspace`。
- 重大更新后运行 `openclaw doctor`，以捕获配置迁移和服务警告。

## 故障排查

- `gateway probe` 无法连接：确认 Caddy 主机名指向该应用，并且容器正在监听 `0.0.0.0:1455`。
- 身份验证失败：同时轮换 EasyRunner 机密中的令牌和本地客户端命令中的令牌。
- 恢复后文件归 root 所有：镜像以 `node`（uid 1000）运行；修复挂载卷，使该用户可以写入 `/home/node/.openclaw` 和 `/home/node/.openclaw/workspace`。
- 浏览器或渠道插件失败：检查所需的外部二进制文件、网络出站访问和挂载凭据在容器内是否可用。

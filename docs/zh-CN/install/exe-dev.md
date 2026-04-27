---
read_when:
    - 你希望为 Gateway 网关使用一台低成本、始终在线的 Linux 主机
    - 你希望获得远程 Control UI 访问能力，而无需自行运行 VPS
summary: 在 exe.dev 上运行 OpenClaw Gateway 网关（VM + HTTPS 代理）以实现远程访问
title: exe.dev
x-i18n:
    generated_at: "2026-04-27T07:11:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 98bc90ff26ce1773bd0e05f975fcc3427039e90ce50eca21bb2e8232f7ac730f
    source_path: install/exe-dev.md
    workflow: 15
---

目标：让 OpenClaw Gateway 网关运行在 exe.dev VM 上，并可通过你的笔记本访问：`https://<vm-name>.exe.xyz`

本页假设你使用的是 exe.dev 默认的 **exeuntu** 镜像。如果你选择了其他发行版，请相应调整软件包。

## 面向初学者的快速路径

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 根据需要填写你的认证密钥 / 令牌
3. 点击你 VM 旁边的 “Agent”，然后等待 Shelley 完成配置
4. 打开 `https://<vm-name>.exe.xyz/`，并使用已配置的共享密钥进行身份验证（本指南默认使用令牌认证，但如果你切换 `gateway.auth.mode`，密码认证也可以使用）
5. 使用 `openclaw devices approve <requestId>` 批准任何待处理的设备配对请求

## 你需要准备的内容

- exe.dev 账户
- 对 [exe.dev](https://exe.dev) 虚拟机的 `ssh exe.dev` 访问权限（可选）

## 使用 Shelley 自动安装

Shelley 是 [exe.dev](https://exe.dev) 的智能体，可以通过我们的提示词立即安装 OpenClaw。使用的提示词如下：

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手动安装

## 1）创建 VM

在你的设备上执行：

```bash
ssh exe.dev new
```

然后连接：

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
请保持此 VM 为**有状态**。OpenClaw 会将 `openclaw.json`、每个智能体的 `auth-profiles.json`、会话以及渠道 / 提供商状态存储在 `~/.openclaw/` 下，并将工作区存储在 `~/.openclaw/workspace/` 下。
</Tip>

## 2）安装前置依赖（在 VM 上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3）安装 OpenClaw

运行 OpenClaw 安装脚本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4）设置 nginx，将 OpenClaw 代理到端口 8000

编辑 `/etc/nginx/sites-enabled/default`，内容如下：

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

请覆盖转发头，而不是保留客户端提供的链式值。OpenClaw 只信任来自明确配置代理的转发 IP 元数据，而追加式的 `X-Forwarded-For` 链会被视为一种加固风险。

## 5）访问 OpenClaw 并授予权限

访问 `https://<vm-name>.exe.xyz/`（参见新手引导期间的 Control UI 输出）。如果提示认证，请粘贴来自 VM 的已配置共享密钥。本指南使用令牌认证，因此可通过 `openclaw config get gateway.auth.token` 获取 `gateway.auth.token`（或使用 `openclaw doctor --generate-gateway-token` 生成一个）。如果你已将 Gateway 网关改为密码认证，请改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。使用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 批准设备。不确定时，可以直接在浏览器中使用 Shelley！

## 远程访问

远程访问由 [exe.dev](https://exe.dev) 的认证机制处理。默认情况下，来自端口 8000 的 HTTP 流量会转发到 `https://<vm-name>.exe.xyz`，并使用邮箱认证。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

指南：[更新](/zh-CN/install/updating)

## 相关内容

- [远程 Gateway 网关](/zh-CN/gateway/remote)
- [安装概览](/zh-CN/install)

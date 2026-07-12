---
read_when:
    - 你需要一台用于运行 Gateway 网关的廉价常开 Linux 主机
    - 你希望无需运行自己的 VPS 即可远程访问 Control UI
summary: 在 exe.dev（VM + HTTPS 代理）上运行 OpenClaw Gateway 网关以供远程访问
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T14:34:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**目标：** 在 [exe.dev](https://exe.dev) VM 上运行 OpenClaw Gateway 网关，并可通过 `https://<vm-name>.exe.xyz` 访问。

本指南假定使用 exe.dev 的默认 **exeuntu** 镜像。在其他发行版上，请相应调整软件包。

## 所需条件

- exe.dev 账户
- 通过 `ssh exe.dev` 访问 exe.dev VM（可选，用于手动设置）

## 新手快速路径

1. 打开 [https://exe.new/openclaw](https://exe.new/openclaw)
2. 根据需要填写你的身份验证密钥/令牌
3. 点击 VM 旁的 "Agent"，等待 Shelley 完成预配
4. 打开 `https://<vm-name>.exe.xyz/`，使用已配置的共享密钥进行身份验证（默认使用令牌身份验证；如果切换 `gateway.auth.mode`，也可以使用密码身份验证）
5. 使用 `openclaw devices approve <requestId>` 批准待处理的设备配对请求

## 使用 Shelley 自动安装

exe.dev 的智能体 Shelley 可以根据提示安装 OpenClaw：

```text
在此 VM 上设置 OpenClaw（https://docs.openclaw.ai/install）。为 OpenClaw 新手引导使用非交互式标志和接受风险标志。根据需要添加提供的身份验证信息或令牌。配置 nginx，将默认已启用站点配置的根位置从默认端口 18789 转发出去，并确保启用 WebSocket 支持。通过 "openclaw devices list" 和 "openclaw devices approve <request id>" 完成配对。确保仪表板显示 OpenClaw 的健康状态正常。exe.dev 会为我们处理从端口 8000 到端口 80/443 的转发和 HTTPS，因此最终的“可访问”地址应为 <vm-name>.exe.xyz，无需指定端口。
```

## 手动安装

<Steps>
  <Step title="创建 VM">
    在你的设备上运行：

    ```bash
    ssh exe.dev new
    ```

    然后连接：

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    保持此 VM **有状态**。OpenClaw 会将 `openclaw.json`、每个智能体的 `auth-profiles.json`、会话以及渠道/提供商状态存储在 `~/.openclaw/` 下，并将工作区存储在 `~/.openclaw/workspace/` 下。
    </Tip>

  </Step>

  <Step title="安装必备组件（在 VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="配置 nginx 代理到端口 8000">
    编辑 `/etc/nginx/sites-enabled/default`：

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # WebSocket 支持
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # 标准代理标头
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 长连接的超时设置
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    覆盖转发标头，而不是保留客户端提供的链。OpenClaw 仅信任由显式配置的代理转发的 IP 元数据，并将追加式 `X-Forwarded-For` 链视为安全加固风险。

  </Step>

  <Step title="访问 OpenClaw 并批准设备">
    打开 `https://<vm-name>.exe.xyz/`（参见新手引导输出的 Control UI）。如果系统提示进行身份验证，请粘贴 VM 中已配置的共享密钥。

    本指南默认使用令牌身份验证，因此请使用 `openclaw config get gateway.auth.token` 获取 `gateway.auth.token`，或使用 `openclaw doctor --n` 生成一个新令牌。如果你已将 Gateway 网关切换为密码身份验证，请改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。

    使用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 批准设备。如果不确定，请在浏览器中使用 Shelley。

  </Step>
</Steps>

## 远程渠道设置

对于远程主机，优先使用一次 `config patch` 调用，而不是通过 SSH 多次调用 `config set`。将真实令牌保存在 VM 环境或 `~/.openclaw/.env` 中，并且只在 `openclaw.json` 中放置 SecretRef。有关完整的 SecretRef 契约，请参阅[密钥管理](/zh-CN/gateway/secrets)。

在 VM 上，让服务环境包含其所需的密钥：

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

在本地计算机上创建补丁文件，并通过管道将其传输到 VM：

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

当嵌套的允许列表应完全替换为补丁值时，请使用 `--replace-path`，例如替换 Discord 渠道允许列表：

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

有关完整的渠道配置参考，请参阅 [Discord](/zh-CN/channels/discord) 和 [Slack](/zh-CN/channels/slack)。

## 远程访问

exe.dev 负责远程访问的身份验证。默认情况下，端口 8000 的 HTTP 流量会通过电子邮件身份验证转发到 `https://<vm-name>.exe.xyz`。

## 更新

```bash
openclaw update
```

有关渠道切换和手动恢复，请参阅[更新](/zh-CN/install/updating)。

## 相关内容

- [远程 Gateway 网关](/zh-CN/gateway/remote)
- [安装概览](/zh-CN/install)

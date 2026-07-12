---
read_when:
    - 你需要一台廉价且始终在线的 Linux 主机来运行 Gateway 网关
    - 你希望无需运行自己的 VPS 即可远程访问 Control UI
summary: 在 exe.dev（虚拟机 + HTTPS 代理）上运行 OpenClaw Gateway 网关以便远程访问
title: exe.dev
x-i18n:
    generated_at: "2026-07-11T20:37:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**目标：** 在 [exe.dev](https://exe.dev) 虚拟机上运行 OpenClaw Gateway 网关，并可通过 `https://<vm-name>.exe.xyz` 访问。

本指南假设使用 exe.dev 默认的 **exeuntu** 镜像。在其他发行版上，请对应调整软件包。

## 所需条件

- exe.dev 账户
- 通过 `ssh exe.dev` 访问 exe.dev 虚拟机的权限（可选，用于手动设置）

## 新手快速路径

1. 打开 [https://exe.new/openclaw](https://exe.new/openclaw)
2. 根据需要填写身份验证密钥或令牌
3. 点击虚拟机旁边的 "Agent"，等待 Shelley 完成预配
4. 打开 `https://<vm-name>.exe.xyz/`，使用已配置的共享密钥进行身份验证（默认使用令牌身份验证；如果切换 `gateway.auth.mode`，也可以使用密码身份验证）
5. 使用 `openclaw devices approve <requestId>` 批准待处理的设备配对请求

## 使用 Shelley 自动安装

exe.dev 的智能体 Shelley 可以根据提示安装 OpenClaw：

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手动安装

<Steps>
  <Step title="Create the VM">
    在你的设备上运行：

    ```bash
    ssh exe.dev new
    ```

    然后连接：

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    请将此虚拟机保持为**有状态**。OpenClaw 会将 `openclaw.json`、每个智能体的 `auth-profiles.json`、会话以及渠道和提供商状态存储在 `~/.openclaw/` 下，并将工作区存储在 `~/.openclaw/workspace/` 下。
    </Tip>

  </Step>

  <Step title="Install prerequisites (on the VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Configure nginx to proxy to port 8000">
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

    请覆盖转发标头，而不是保留客户端提供的链。OpenClaw 只信任由显式配置的代理提供的转发 IP 元数据，并将追加式 `X-Forwarded-For` 链视为安全加固风险。

  </Step>

  <Step title="Access OpenClaw and approve devices">
    打开 `https://<vm-name>.exe.xyz/`（参见新手引导输出中的 Control UI）。如果系统提示进行身份验证，请粘贴虚拟机中配置的共享密钥。

    本指南默认使用令牌身份验证，因此请使用 `openclaw config get gateway.auth.token` 获取 `gateway.auth.token`，或使用 `openclaw doctor --n` 生成新令牌。如果你已将 Gateway 网关切换为密码身份验证，请改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。

    使用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 批准设备。如有疑问，请在浏览器中使用 Shelley。

  </Step>
</Steps>

## 远程渠道设置

对于远程主机，优先使用一次 `config patch` 调用，而不是通过多次 SSH 调用执行 `config set`。将真实令牌保存在虚拟机环境或 `~/.openclaw/.env` 中，并且只在 `openclaw.json` 中放置 SecretRef。完整的 SecretRef 契约请参阅[密钥管理](/zh-CN/gateway/secrets)。

在虚拟机上，让服务环境包含其所需的密钥：

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

在本地计算机上创建补丁文件，并通过管道将其传输到虚拟机：

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

当嵌套允许列表需要完全替换为补丁值时，请使用 `--replace-path`，例如替换 Discord 渠道允许列表：

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

完整的频道配置参考请参阅 [Discord](/zh-CN/channels/discord) 和 [Slack](/zh-CN/channels/slack)。

## 远程访问

exe.dev 负责处理远程访问的身份验证。默认情况下，来自端口 8000 的 HTTP 流量会转发到 `https://<vm-name>.exe.xyz`，并使用电子邮件身份验证。

## 更新

```bash
openclaw update
```

有关渠道切换和手动恢复，请参阅[更新](/zh-CN/install/updating)。

## 相关内容

- [远程 Gateway 网关](/zh-CN/gateway/remote)
- [安装概览](/zh-CN/install)

---
read_when:
    - 你需要一台便宜且始终在线的 Linux 主机来运行 Gateway 网关
    - 你想要远程访问 Control UI，但不想运行自己的 VPS
summary: 在 exe.dev 上运行 OpenClaw Gateway 网关（VM + HTTPS 代理）以进行远程访问
title: exe.dev
x-i18n:
    generated_at: "2026-07-05T11:24:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86227ad592997b1c8af600fa6258f647bcfd16e03a4fe19b159d48d7bfe6c883
    source_path: install/exe-dev.md
    workflow: 16
---

**目标：** OpenClaw Gateway 网关运行在 [exe.dev](https://exe.dev) VM 上，可通过 `https://<vm-name>.exe.xyz` 访问。

本指南假设使用 exe.dev 默认的 **exeuntu** 镜像。在其他发行版上请相应映射软件包。

## 你需要准备

- exe.dev 账户
- 对 exe.dev VM 的 `ssh exe.dev` 访问权限（可选，用于手动设置）

## 初学者快速路径

1. 打开 [https://exe.new/openclaw](https://exe.new/openclaw)
2. 根据需要填写你的身份验证密钥/令牌
3. 点击 VM 旁边的 “智能体”，然后等待 Shelley 完成预配
4. 打开 `https://<vm-name>.exe.xyz/`，并使用配置的共享密钥进行身份验证（默认使用令牌认证；如果你切换 `gateway.auth.mode`，密码认证也可用）
5. 使用 `openclaw devices approve <requestId>` 批准待处理的设备配对请求

## 使用 Shelley 自动安装

Shelley 是 exe.dev 的智能体，可以通过提示词安装 OpenClaw：

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手动安装

<Steps>
  <Step title="创建 VM">
    从你的设备执行：

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

  <Step title="安装前置依赖（在 VM 上）">
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

    覆盖转发标头，而不是保留客户端提供的链。OpenClaw 只信任来自显式配置代理的转发 IP 元数据，追加式 `X-Forwarded-For` 链会被视为加固风险。

  </Step>

  <Step title="访问 OpenClaw 并批准设备">
    打开 `https://<vm-name>.exe.xyz/`（请参阅新手引导输出中的 Control UI）。如果它提示进行身份验证，请粘贴来自 VM 的已配置共享密钥。

    本指南默认使用令牌认证，因此请使用 `openclaw config get gateway.auth.token` 获取 `gateway.auth.token`，或使用 `openclaw doctor --n` 生成一个新的令牌。如果你已将 Gateway 网关切换为密码认证，请改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。

    使用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 批准设备。不确定时，请从浏览器使用 Shelley。

  </Step>
</Steps>

## 远程渠道设置

对于远程主机，优先使用一次 `config patch` 调用，而不是多次通过 SSH 调用 `config set`。将真实令牌保存在 VM 环境或 `~/.openclaw/.env` 中，并且只在 `openclaw.json` 中放置 SecretRef。完整的 SecretRef 契约见[密钥管理](/zh-CN/gateway/secrets)。

在 VM 上，让服务环境包含它所需的密钥：

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

从你的本地机器创建补丁文件，并将其通过管道传递给 VM：

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
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

当嵌套 allowlist 应完全变为补丁值时，请使用 `--replace-path`，例如替换 Discord 渠道 allowlist：

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

完整渠道配置参考见 [Discord](/zh-CN/channels/discord) 和 [Slack](/zh-CN/channels/slack)。

## 远程访问

exe.dev 会处理远程访问的身份验证。默认情况下，来自端口 8000 的 HTTP 流量会通过电子邮件认证转发到 `https://<vm-name>.exe.xyz`。

## 更新

```bash
openclaw update
```

有关渠道切换和手动恢复，请参阅[更新](/zh-CN/install/updating)。

## 相关内容

- [远程 Gateway 网关](/zh-CN/gateway/remote)
- [安装概览](/zh-CN/install)

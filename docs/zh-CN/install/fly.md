---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 设置 Fly 卷、密钥和首次运行配置
summary: 使用持久化存储和 HTTPS 将 OpenClaw 逐步部署到 Fly.io
title: Fly.io
x-i18n:
    generated_at: "2026-05-10T19:37:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2f6f56d22f01fc3729bafc47337e12dfad626a8b0bebb60bc4b49757d6cd1d3
    source_path: install/fly.md
    workflow: 16
---

**目标：** 在 [Fly.io](https://fly.io) 机器上运行 OpenClaw Gateway 网关，并具备持久存储、自动 HTTPS，以及 Discord/渠道访问能力。

## 你需要准备

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 账号（免费层级可用）
- 模型凭证：你选择的模型提供商的 API key
- 渠道凭证：Discord bot token、Telegram token 等。

## 新手快速路径

1. 克隆仓库 → 自定义 `fly.toml`
2. 创建应用 + 卷 → 设置密钥
3. 使用 `fly deploy` 部署
4. SSH 进入以创建配置，或使用 Control UI

<Steps>
  <Step title="创建 Fly 应用">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **提示：** 选择离你较近的区域。常见选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

  </Step>

  <Step title="配置 fly.toml">
    编辑 `fly.toml`，使其匹配你的应用名称和需求。

    **安全注意事项：** 默认配置会暴露一个公开 URL。若要使用没有公网 IP 的加固部署，请参阅[私有部署](#private-deployment-hardened)，或使用 `deploy/fly.private.toml`。

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    OpenClaw Docker 镜像使用 `tini` 作为其入口点。Fly 进程命令会替换 Docker `CMD`，但不会替换 `ENTRYPOINT`，因此进程仍会在 `tini` 下运行。

    **关键设置：**

    | 设置                           | 原因                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 绑定到 `0.0.0.0`，让 Fly 的代理可以访问 Gateway 网关                        |
    | `--allow-unconfigured`         | 在没有配置文件时启动（之后你会创建一个）                                    |
    | `internal_port = 3000`         | 必须匹配 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`），供 Fly 健康检查使用   |
    | `memory = "2048mb"`            | 512MB 太小；建议 2GB                                                        |
    | `OPENCLAW_STATE_DIR = "/data"` | 将状态持久化到卷上                                                          |

  </Step>

  <Step title="设置密钥">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **注意：**

    - 非 local loopback 绑定（`--bind lan`）需要有效的 Gateway 网关认证路径。这个 Fly.io 示例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正确配置的非 local loopback `trusted-proxy` 部署也满足要求。
    - 像对待密码一样对待这些 token。
    - **对于所有 API key 和 token，优先使用环境变量而不是配置文件**。这样可以避免密钥进入 `openclaw.json`，从而降低被意外暴露或记录到日志中的风险。

  </Step>

  <Step title="部署">
    ```bash
    fly deploy
    ```

    首次部署会构建 Docker 镜像（约 2-3 分钟）。后续部署会更快。

    部署后，验证：

    ```bash
    fly status
    fly logs
    ```

    你应该会看到：

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="创建配置文件">
    SSH 进入机器以创建正确的配置：

    ```bash
    fly ssh console
    ```

    创建配置目录和文件：

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **注意：** 设置 `OPENCLAW_STATE_DIR=/data` 后，配置路径是 `/data/openclaw.json`。

    **注意：** 将 `https://my-openclaw.fly.dev` 替换为你真实的 Fly 应用源。Gateway 网关启动时会根据运行时 `--bind` 和 `--port` 值初始化本地 Control UI 源，因此首次启动可以在配置尚不存在时继续进行，但通过 Fly 的浏览器访问仍需要在 `gateway.controlUi.allowedOrigins` 中列出精确的 HTTPS 源。

    **注意：** Discord token 可以来自以下任一位置：

    - 环境变量：`DISCORD_BOT_TOKEN`（推荐用于密钥）
    - 配置文件：`channels.discord.token`

    如果使用环境变量，就不需要将 token 添加到配置中。Gateway 网关会自动读取 `DISCORD_BOT_TOKEN`。

    重启以应用：

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="访问 Gateway 网关">
    ### Control UI

    在浏览器中打开：

    ```bash
    fly open
    ```

    或访问 `https://my-openclaw.fly.dev/`

    使用已配置的共享密钥进行认证。本指南使用来自 `OPENCLAW_GATEWAY_TOKEN` 的 Gateway 网关 token；如果你切换到了密码认证，请改用该密码。

    ### 日志

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH 控制台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 故障排除

### “应用未在预期地址上监听”

Gateway 网关绑定到了 `127.0.0.1`，而不是 `0.0.0.0`。

**修复：** 在 `fly.toml` 的进程命令中添加 `--bind lan`。

### 健康检查失败 / 连接被拒绝

Fly 无法通过已配置端口访问 Gateway 网关。

**修复：** 确保 `internal_port` 与 Gateway 网关端口一致（设置 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 内存问题

容器持续重启或被终止。迹象包括：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或无提示重启。

**修复：** 在 `fly.toml` 中增加内存：

```toml
[[vm]]
  memory = "2048mb"
```

或更新现有机器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意：** 512MB 太小。1GB 可能可用，但在负载较高或日志较详细时可能 OOM。**建议使用 2GB。**

### Gateway 网关锁问题

Gateway 网关因 “already running” 错误而拒绝启动。

当容器重启但 PID 锁文件仍保留在卷上时，会出现这种情况。

**修复：** 删除锁文件：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

锁文件位于 `/data/gateway.*.lock`（不在子目录中）。

### 配置未被读取

`--allow-unconfigured` 只会绕过启动保护。它不会创建或修复 `/data/openclaw.json`，因此当你想要正常启动本地 Gateway 网关时，请确保真实配置存在，并且包含 `gateway.mode="local"`。

验证配置是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 写入配置

`fly ssh console -C` 命令不支持 shell 重定向。要写入配置文件：

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注意：** 如果文件已存在，`fly sftp` 可能会失败。请先删除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久化

如果重启后丢失认证配置、渠道/提供商状态或会话，则说明状态目录正在写入容器文件系统。

**修复：** 确保 `fly.toml` 中设置了 `OPENCLAW_STATE_DIR=/data`，然后重新部署。

## 更新

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### 更新机器命令

如果你需要在不完整重新部署的情况下更改启动命令：

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注意：** 执行 `fly deploy` 后，机器命令可能会重置为 `fly.toml` 中的内容。如果你做过手动更改，请在部署后重新应用它们。

## 私有部署（加固）

默认情况下，Fly 会分配公网 IP，使你的 Gateway 网关可通过 `https://your-app.fly.dev` 访问。这很方便，但也意味着你的部署可被互联网扫描器（Shodan、Censys 等）发现。

对于**没有公网暴露**的加固部署，请使用私有模板。

### 何时使用私有部署

- 你只发起**出站**调用/消息（没有入站 webhook）
- 你使用 **ngrok 或 Tailscale** 隧道处理任何 webhook 回调
- 你通过 **SSH、代理或 WireGuard** 访问 Gateway 网关，而不是通过浏览器
- 你希望该部署**不被互联网扫描器发现**

### 设置

使用 `deploy/fly.private.toml`，而不是标准配置：

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

或转换现有部署：

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

之后，`fly ips list` 应该只显示一个 `private` 类型的 IP：

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

由于没有公开 URL，请使用以下方法之一：

**选项 1：本地代理（最简单）**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**选项 2：WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**选项 3：仅 SSH**

```bash
fly ssh console -a my-openclaw
```

### 私有部署中的 Webhook

如果你需要在不公开暴露的情况下接收 Webhook 回调（Twilio、Telnyx 等）：

1. **ngrok 隧道** - 在容器内或作为 sidecar 运行 ngrok
2. **Tailscale Funnel** - 通过 Tailscale 暴露特定路径
3. **仅出站** - 一些提供商（Twilio）无需 Webhook 即可正常处理出站呼叫

使用 ngrok 的语音呼叫配置示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

ngrok 隧道在容器内运行，并提供一个公开的 Webhook URL，而不会暴露 Fly 应用本身。将 `webhookSecurity.allowedHosts` 设置为公开隧道主机名，以便接受转发的 host 标头。

### 安全优势

| 方面              | 公开         | 私有       |
| ----------------- | ------------ | ---------- |
| 互联网扫描器      | 可发现       | 隐藏       |
| 直接攻击          | 可能         | 被阻止     |
| 控制 UI 访问      | 浏览器       | 代理/VPN   |
| Webhook 投递      | 直接         | 通过隧道   |

## 备注

- Fly.io 使用 **x86 架构**（不是 ARM）
- Dockerfile 与两种架构都兼容
- 对于 WhatsApp/Telegram 新手引导，请使用 `fly ssh console`
- 持久化数据位于 `/data` 卷上
- Signal 需要 Java + signal-cli；请使用自定义镜像，并将内存保持在 2GB+。

## 费用

使用推荐配置（`shared-cpu-2x`，2GB RAM）：

- 每月约 10-15 美元，取决于使用量
- 免费套餐包含部分额度

了解详情，请参阅 [Fly.io 定价](https://fly.io/docs/about/pricing/)。

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 网关配置](/zh-CN/gateway/configuration)
- 让 OpenClaw 保持最新：[更新](/zh-CN/install/updating)

## 相关内容

- [安装概览](/zh-CN/install)
- [Hetzner](/zh-CN/install/hetzner)
- [Docker](/zh-CN/install/docker)
- [VPS 托管](/zh-CN/vps)

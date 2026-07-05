---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 设置 Fly 卷、密钥和首次运行配置
summary: OpenClaw 的 Fly.io 分步部署：持久存储和 HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-05T11:23:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**目标：** 在 [Fly.io](https://fly.io) 机器上运行 OpenClaw Gateway 网关，具备持久化存储、自动 HTTPS，以及 Discord/渠道访问。

## 你需要准备

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 账号（免费层可用）
- 模型凭证：你选择的模型提供商的 API key
- 渠道凭据：Discord bot token、Telegram token 等。

## 初学者快速路径

1. 克隆仓库，自定义 `fly.toml`
2. 创建 app + volume，设置 secrets
3. 使用 `fly deploy` 部署
4. SSH 进入机器创建配置，或使用 Control UI

<Steps>
  <Step title="创建 Fly app">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # pick your own name
    fly apps create my-openclaw

    # 1GB is usually enough
    fly volumes create openclaw_data --size 1 --region iad
    ```

    选择一个离你较近的区域。常见选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

  </Step>

  <Step title="配置 fly.toml">
    编辑 `fly.toml`，使其匹配你的 app 名称和需求。仓库跟踪的 `fly.toml` 是下面展示的公开模板；`deploy/fly.private.toml` 是强化的无公网 IP 变体（见[私有部署](#private-deployment-hardened)）。

    ```toml
    app = "my-openclaw"  # your app name
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

    OpenClaw Docker 镜像的 entrypoint 是 `tini`，默认运行 `node openclaw.mjs gateway`。Fly `[processes]` 会替换 Docker `CMD`（这里直接运行 `node dist/index.js gateway ...`，也就是同一个编译后的入口点），但不会触碰 `ENTRYPOINT`，因此进程仍然在 `tini` 下运行。

    **关键设置：**

    | 设置                           | 原因                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 绑定到 `0.0.0.0`，让 Fly 的代理可以访问 Gateway 网关                       |
    | `--allow-unconfigured`         | 在没有配置文件的情况下启动（之后你再创建配置文件）                         |
    | `internal_port = 3000`         | 必须匹配 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`），供 Fly 健康检查使用   |
    | `memory = "2048mb"`            | 512MB 太小；推荐 2GB                                                        |
    | `OPENCLAW_STATE_DIR = "/data"` | 将状态持久化到 volume                                                       |

  </Step>

  <Step title="设置 secrets">
    ```bash
    # required: gateway auth token for non-loopback binding
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # optional: other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    非 loopback 绑定（`--bind lan`）需要有效的 Gateway 网关凭证路径。此示例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正确配置的非 loopback 可信代理部署也满足要求。有关 SecretRef contract，请参阅 [Secrets 管理](/zh-CN/gateway/secrets)。

    像密码一样对待这些 token。对于 API key 和 token，优先使用环境变量/`fly secrets` 而不是配置文件，这样 secrets 就不会进入 `openclaw.json`。

  </Step>

  <Step title="部署">
    ```bash
    fly deploy
    ```

    首次部署会构建 Docker 镜像。部署后验证：

    ```bash
    fly status
    fly logs
    ```

    Gateway 网关启动日志会在 HTTP/WebSocket 监听器启动后输出 `gateway ready`。Fly 自身的健康检查会根据 `fly.toml` 监听 `internal_port = 3000`；镜像的 Docker `HEALTHCHECK` 指令还会额外轮询默认端口 18789 上的 `/healthz`，但此处未使用，因为此部署将 Gateway 网关覆盖为 `--port 3000`。

  </Step>

  <Step title="创建配置文件">
    SSH 进入机器创建正确的配置：

    ```bash
    fly ssh console
    ```

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

    使用 `OPENCLAW_STATE_DIR=/data` 时，配置路径是 `/data/openclaw.json`。

    将 `https://my-openclaw.fly.dev` 替换为你真实的 Fly app origin。Gateway 网关启动时会根据运行时 `--bind` 和 `--port` 值填充本地 Control UI origin，因此首次启动可以在配置不存在时继续进行，但通过 Fly 进行浏览器访问仍然需要在 `gateway.controlUi.allowedOrigins` 中列出精确的 HTTPS origin。

    Discord token 可以来自以下任一位置：

    - 环境变量 `DISCORD_BOT_TOKEN`（推荐用于 secrets）；无需将其加入配置，Gateway 网关会自动读取
    - 配置文件 `channels.discord.token`

    重启以应用：

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="访问 Gateway 网关">
    ### Control UI

    ```bash
    fly open
    ```

    或访问 `https://my-openclaw.fly.dev/`。

    使用配置的共享密钥进行身份验证：来自 `OPENCLAW_GATEWAY_TOKEN` 的 Gateway 网关 token，或在你切换到密码凭证后使用你的密码。

    ### 日志

    ```bash
    fly logs              # live logs
    fly logs --no-tail    # recent logs
    ```

    ### SSH 控制台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 故障排查

### “App 未在预期地址监听”

Gateway 网关绑定到了 `127.0.0.1`，而不是 `0.0.0.0`。

**修复：** 在 `fly.toml` 的进程命令中添加 `--bind lan`。

### 健康检查失败 / 连接被拒绝

Fly 无法在配置的端口访问 Gateway 网关。

**修复：** 确保 `internal_port` 匹配 Gateway 网关端口（`--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 内存问题

容器持续重启或被终止。迹象：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或静默重启。

**修复：** 在 `fly.toml` 中增加内存：

```toml
[[vm]]
  memory = "2048mb"
```

或更新现有机器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB 太小。1GB 可能可用，但在负载下或启用详细日志时可能 OOM。推荐 2GB。

### Gateway 网关锁问题

容器重启后，Gateway 网关因 “already running” 错误拒绝启动。

单实例锁文件位于 `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`（Linux：`/tmp/openclaw-<uid>/gateway.<hash>.lock`），不在持久化 `/data` volume 上，因此完整的容器重启通常会连同容器文件系统的其余部分一起清除它。如果锁保留下来（例如保留容器文件系统的 `fly machine restart`）并阻止启动，请手动删除：

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### 配置未被读取

`--allow-unconfigured` 只会绕过启动保护。它不会创建或修复 `/data/openclaw.json`，因此请确保你的真实配置存在，并包含 `"gateway": { "mode": "local" }` 以正常启动本地 Gateway 网关。

验证配置是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 写入配置

`fly ssh console -C` 不支持 shell 重定向。要写入配置文件：

```bash
# echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# or sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

如果文件已存在，`fly sftp` 可能失败；请先删除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久化

如果你在重启后丢失凭证配置、渠道/提供商状态或会话，说明状态目录正在写入容器文件系统，而不是 volume。

**修复：** 确保 `fly.toml` 中设置了 `OPENCLAW_STATE_DIR=/data`，然后重新部署。

## 更新

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` 是这里的受控路径：它会从 Dockerfile 重新构建镜像，因此 CLI/Gateway 网关版本、基础 OS 镜像以及任何 Dockerfile 变更都会一起更新。在运行中的容器内执行 `openclaw update` 不是同一种操作，因为该镜像以 Docker 构建的 `dist/` 树发布，没有 `.git` checkout，也没有可供其检测的 npm 托管全局安装；关于 VM 风格安装中的该流程，请参阅[更新](/zh-CN/install/updating)。

### 更新机器命令

要在不完整重新部署的情况下更改启动命令：

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# or with a memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

后续 `fly deploy` 会将机器命令重置回 `fly.toml` 中的内容；重新部署后请重新应用手动变更。

## 私有部署（强化）

默认情况下，Fly 会分配公网 IP，因此你的 Gateway 网关可通过 `https://your-app.fly.dev` 访问，并且可被互联网扫描器（Shodan、Censys 等）发现。

使用 `deploy/fly.private.toml` 进行强化部署，**没有公网 IP**：它省略了 `[http_service]`，因此不会分配公网入口。

### 何时使用私有部署

- 仅出站调用/消息（没有入站 webhook）
- ngrok 或 Tailscale 隧道处理任何 webhook 回调
- Gateway 网关访问通过 SSH、代理或 WireGuard，而不是浏览器
- 部署应对互联网扫描器隐藏

### 设置

```bash
fly deploy -c deploy/fly.private.toml
```

或转换现有部署：

```bash
# list current IPs
fly ips list -a my-openclaw

# release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# switch to the private config so future deploys do not re-allocate public IPs
fly deploy -c deploy/fly.private.toml

# allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

在此之后，`fly ips list` 应该只显示一个 `private` 类型的 IP：

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

**选项 1：本地代理（最简单）**

```bash
fly proxy 3000:3000 -a my-openclaw
# open http://localhost:3000 in a browser
```

**选项 2：WireGuard VPN**

```bash
fly wireguard create
# import to a WireGuard client, then access via internal IPv6
# example: http://[fdaa:x:x:x:x::x]:3000
```

**选项 3：仅 SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks 与私有部署

对于没有公网暴露的 webhook 回调（Twilio、Telnyx 等）：

1. **ngrok 隧道**：在容器内运行 ngrok，或作为 sidecar 运行
2. **Tailscale Funnel**：通过 Tailscale 暴露特定路径
3. **仅出站**：某些提供商（Twilio）无需 webhook 即可用于出站呼叫

使用 ngrok 的语音通话配置示例，位于 `plugins.entries.voice-call.config` 下：

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

ngrok 隧道在容器内运行，并提供一个公共 webhook URL，而不会暴露 Fly 应用本身。将 `webhookSecurity.allowedHosts` 设置为隧道主机名，以便接受转发的 host 标头。

### 安全权衡

| 方面              | 公网         | 私有       |
| ----------------- | ------------ | ---------- |
| 互联网扫描器      | 可发现       | 隐藏       |
| 直接攻击          | 可能         | 已阻止     |
| Control UI 访问   | 浏览器       | 代理/VPN   |
| Webhook 投递      | 直接         | 通过隧道   |

## 说明

- Fly.io 使用 x86 架构；该 Dockerfile 同时兼容 x86 和 ARM。
- 对于 WhatsApp/Telegram 新手引导，请使用 `fly ssh console`。
- 持久化数据位于 `/data` 上的卷中。
- Signal 需要镜像中包含 signal-cli（基于 Java 的 CLI）；请使用自定义镜像，并将内存保持在 2GB 以上。

## 费用

使用推荐配置（`shared-cpu-2x`、2GB RAM）时，根据使用情况，预计费用约为每月 10-15 美元；免费套餐涵盖一些基础额度。当前费率请参阅 [Fly.io 定价](https://fly.io/docs/about/pricing/)。

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)
- 保持 OpenClaw 为最新版本：[更新](/zh-CN/install/updating)

## 相关内容

- [安装概览](/zh-CN/install)
- [Hetzner](/zh-CN/install/hetzner)
- [Docker](/zh-CN/install/docker)
- [VPS 托管](/zh-CN/vps)

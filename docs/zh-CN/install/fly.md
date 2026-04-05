---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 设置 Fly volume、密钥和首次运行配置
summary: 在 Fly.io 上逐步部署 OpenClaw，包含持久化存储和 HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T08:27:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Fly.io 部署

**目标：** 在 [Fly.io](https://fly.io) 机器上运行 OpenClaw Gateway 网关，具备持久化存储、自动 HTTPS 和 Discord/渠道访问能力。

## 你需要准备的内容

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 账户（免费层可用）
- 模型鉴权：你所选模型提供商的 API 密钥
- 渠道凭证：Discord 机器人 token、Telegram token 等

## 面向初学者的快速路径

1. 克隆仓库 → 自定义 `fly.toml`
2. 创建应用 + volume → 设置密钥
3. 使用 `fly deploy` 部署
4. SSH 登录创建配置，或使用 Control UI

<Steps>
  <Step title="创建 Fly 应用">
    ```bash
    # 克隆仓库
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 创建新的 Fly 应用（请自行选择名称）
    fly apps create my-openclaw

    # 创建持久化 volume（通常 1GB 就足够）
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **提示：** 选择离你最近的区域。常见选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

  </Step>

  <Step title="配置 fly.toml">
    编辑 `fly.toml` 以匹配你的应用名称和需求。

    **安全说明：** 默认配置会暴露一个公共 URL。如果你想要无公网 IP 的加固部署，请参见[私有部署](#private-deployment-hardened)或使用 `fly.private.toml`。

    ```toml
    app = "my-openclaw"  # 你的应用名称
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

    **关键设置：**

    | Setting                        | Why                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 绑定到 `0.0.0.0`，这样 Fly 的代理才能访问 Gateway 网关                     |
    | `--allow-unconfigured`         | 在没有配置文件的情况下启动（你稍后会创建）                      |
    | `internal_port = 3000`         | 必须与 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）匹配，以通过 Fly 健康检查 |
    | `memory = "2048mb"`            | 512MB 太小；建议使用 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | 将状态持久化到 volume                                                |

  </Step>

  <Step title="设置密钥">
    ```bash
    # 必需：Gateway 网关 token（用于非 loopback 绑定）
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # 模型提供商 API 密钥
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # 可选：其他提供商
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # 渠道 token
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **说明：**

    - 非 loopback 绑定（`--bind lan`）要求存在有效的 Gateway 网关鉴权路径。这个 Fly.io 示例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正确配置的非 loopback `trusted-proxy` 部署也满足要求。
    - 请将这些 token 视为密码。
    - **所有 API 密钥和 token 都优先使用环境变量，而不是配置文件。** 这样可以避免将密钥写入 `openclaw.json`，从而降低被意外暴露或记录的风险。

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

    你应该看到：

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="创建配置文件">
    通过 SSH 登录机器以创建正式配置：

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **说明：** 由于 `OPENCLAW_STATE_DIR=/data`，配置路径是 `/data/openclaw.json`。

    **说明：** Discord token 可以来自以下任一方式：

    - 环境变量：`DISCORD_BOT_TOKEN`（推荐用于密钥）
    - 配置文件：`channels.discord.token`

    如果使用环境变量，就无需把 token 添加到配置中。Gateway 网关会自动读取 `DISCORD_BOT_TOKEN`。

    重启以应用配置：

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

    使用已配置的共享密钥进行鉴权。本指南使用来自 `OPENCLAW_GATEWAY_TOKEN` 的 Gateway 网关
    token；如果你改用了密码鉴权，请改用
    该密码。

    ### 日志

    ```bash
    fly logs              # 实时日志
    fly logs --no-tail    # 最近日志
    ```

    ### SSH 控制台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 故障排除

### “App is not listening on expected address”

Gateway 网关绑定到了 `127.0.0.1`，而不是 `0.0.0.0`。

**修复：** 在 `fly.toml` 的进程命令中添加 `--bind lan`。

### 健康检查失败 / 连接被拒绝

Fly 无法通过配置端口访问 Gateway 网关。

**修复：** 确保 `internal_port` 与 Gateway 网关端口匹配（设置 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 内存问题

容器不断重启或被杀死。迹象包括：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration` 或静默重启。

**修复：** 增加 `fly.toml` 中的内存：

```toml
[[vm]]
  memory = "2048mb"
```

或者更新现有机器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**说明：** 512MB 太小。1GB 可能可以运行，但在负载较高或启用详细日志时可能 OOM。**建议使用 2GB。**

### Gateway 网关锁问题

Gateway 网关因“already running”错误而拒绝启动。

当容器重启但 PID 锁文件仍保留在 volume 上时，就会出现这种情况。

**修复：** 删除锁文件：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

锁文件位于 `/data/gateway.*.lock`（不在子目录中）。

### 未读取配置

`--allow-unconfigured` 只会绕过启动保护。它不会创建或修复 `/data/openclaw.json`，所以请确保你的实际配置存在，并且在你希望正常以本地 Gateway 网关方式启动时包含 `gateway.mode="local"`。

验证配置是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 写入配置

`fly ssh console -C` 命令不支持 shell 重定向。要写入配置文件：

```bash
# 使用 echo + tee（从本地通过管道传到远程）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 或使用 sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**说明：** 如果文件已存在，`fly sftp` 可能失败。请先删除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久化

如果你在重启后丢失 auth profile、渠道/提供商状态或会话，
说明状态目录写到了容器文件系统中。

**修复：** 确保在 `fly.toml` 中设置了 `OPENCLAW_STATE_DIR=/data`，然后重新部署。

## 更新

```bash
# 拉取最新更改
git pull

# 重新部署
fly deploy

# 检查健康状态
fly status
fly logs
```

### 更新机器命令

如果你需要在不完整重新部署的情况下更改启动命令：

```bash
# 获取机器 ID
fly machines list

# 更新命令
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 或同时增加内存
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**说明：** 在执行 `fly deploy` 后，机器命令可能会重置为 `fly.toml` 中的内容。如果你做过手动更改，请在部署后重新应用这些更改。

## 私有部署（加固版）

默认情况下，Fly 会分配公网 IP，这意味着你的 Gateway 网关可以通过 `https://your-app.fly.dev` 访问。这很方便，但也意味着你的部署可被互联网扫描器（Shodan、Censys 等）发现。

如果你希望获得**完全不暴露公网**的加固部署，请使用私有模板。

### 何时使用私有部署

- 你只进行**出站**调用/消息（没有入站 webhook）
- 你为任何 webhook 回调使用 **ngrok 或 Tailscale** 隧道
- 你通过 **SSH、代理或 WireGuard** 访问 Gateway 网关，而不是浏览器
- 你希望部署**对互联网扫描器隐藏**

### 设置

使用 `fly.private.toml`，而不是标准配置：

```bash
# 使用私有配置部署
fly deploy -c fly.private.toml
```

或者将现有部署转换为私有：

```bash
# 列出当前 IP
fly ips list -a my-openclaw

# 释放公网 IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 切换到私有配置，以便后续部署不会重新分配公网 IP
# （移除 [http_service]，或使用私有模板部署）
fly deploy -c fly.private.toml

# 分配仅私有 IPv6
fly ips allocate-v6 --private -a my-openclaw
```

此后，`fly ips list` 应只显示一个 `private` 类型 IP：

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

由于没有公共 URL，请使用以下方式之一：

**选项 1：本地代理（最简单）**

```bash
# 将本地端口 3000 转发到应用
fly proxy 3000:3000 -a my-openclaw

# 然后在浏览器中打开 http://localhost:3000
```

**选项 2：WireGuard VPN**

```bash
# 创建 WireGuard 配置（一次性）
fly wireguard create

# 导入到 WireGuard 客户端，然后通过内部 IPv6 访问
# 示例：http://[fdaa:x:x:x:x::x]:3000
```

**选项 3：仅使用 SSH**

```bash
fly ssh console -a my-openclaw
```

### 私有部署中的 webhook

如果你在不暴露公网的情况下仍然需要 webhook 回调（Twilio、Telnyx 等）：

1. **ngrok 隧道** —— 在容器内或作为 sidecar 运行 ngrok
2. **Tailscale Funnel** —— 通过 Tailscale 暴露特定路径
3. **仅出站** —— 某些提供商（Twilio）在没有 webhook 的情况下也能正常进行出站呼叫

使用 ngrok 的语音通话配置示例：

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

ngrok 隧道运行在容器内，并提供公共 webhook URL，而不会暴露 Fly 应用本身。请将 `webhookSecurity.allowedHosts` 设置为该公共隧道主机名，以便接受转发后的 host header。

### 安全收益

| Aspect            | Public       | Private    |
| ----------------- | ------------ | ---------- |
| Internet scanners | 可发现 | 隐藏     |
| Direct attacks    | 可能     | 被阻止    |
| Control UI access | 浏览器      | 代理/VPN  |
| Webhook delivery  | 直接       | 通过隧道 |

## 说明

- Fly.io 使用 **x86 架构**（不是 ARM）
- Dockerfile 兼容两种架构
- 对于 WhatsApp/Telegram 新手引导，请使用 `fly ssh console`
- 持久化数据位于 `/data` volume 上
- Signal 需要 Java + signal-cli；请使用自定义镜像，并将内存保持在 2GB 以上。

## 成本

使用推荐配置（`shared-cpu-2x`，2GB RAM）时：

- 约 $10-15/月，取决于使用情况
- 免费层包含一定额度

详情请参见 [Fly.io pricing](https://fly.io/docs/about/pricing/)。

## 后续步骤

- 设置消息渠道：[Channels](/channels)
- 配置 Gateway 网关：[Gateway configuration](/gateway/configuration)
- 让 OpenClaw 保持最新：[Updating](/install/updating)

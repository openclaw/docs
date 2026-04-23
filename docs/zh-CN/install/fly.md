---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 设置 Fly 卷、密钥和首次运行配置
summary: 面向 OpenClaw 的 Fly.io 逐步部署指南，包含持久化存储和 HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-23T19:25:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 565bae44242217f7a2fa118fbdb1c2f4b989fed1d1fa011129a0983f1f5997f6
    source_path: install/fly.md
    workflow: 15
---

# Fly.io 部署

**目标：** 让 OpenClaw Gateway 网关运行在 [Fly.io](https://fly.io) 机器上，并具备持久化存储、自动 HTTPS，以及 Discord/渠道访问能力。

## 你需要准备的内容

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- 一个 Fly.io 账号（免费层即可）
- 模型认证：你所选模型提供商的 API 密钥
- 渠道凭证：Discord 机器人令牌、Telegram 令牌等

## 面向新手的快速路径

1. 克隆仓库 → 自定义 `fly.toml`
2. 创建应用和卷 → 设置密钥
3. 使用 `fly deploy` 部署
4. 通过 SSH 登录以创建配置，或使用控制 UI

<Steps>
  <Step title="创建 Fly 应用">
    ```bash
    # 克隆仓库
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 创建一个新的 Fly 应用（请自行选择名称）
    fly apps create my-openclaw

    # 创建一个持久卷（通常 1GB 就够用）
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **提示：** 选择一个离你较近的区域。常见选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

  </Step>

  <Step title="配置 fly.toml">
    编辑 `fly.toml`，使其符合你的应用名称和需求。

    **安全说明：** 默认配置会公开一个公共 URL。若需不带公共 IP 的强化部署，请参见 [Private Deployment](#private-deployment-hardened) 或使用 `fly.private.toml`。

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

    | 设置 | 原因 |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan` | 绑定到 `0.0.0.0`，这样 Fly 的代理才能访问 Gateway 网关 |
    | `--allow-unconfigured` | 可在没有配置文件的情况下启动（你会在之后创建它） |
    | `internal_port = 3000` | 必须与 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）一致，以通过 Fly 健康检查 |
    | `memory = "2048mb"` | 512MB 太小；推荐 2GB |
    | `OPENCLAW_STATE_DIR = "/data"` | 将状态持久保存到卷中 |

  </Step>

  <Step title="设置密钥">
    ```bash
    # 必需：Gateway 网关令牌（用于非 loopback 绑定）
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # 模型提供商 API 密钥
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # 可选：其他提供商
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # 渠道令牌
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **说明：**

    - 非 loopback 绑定（`--bind lan`）要求存在有效的 Gateway 网关认证路径。本 Fly.io 示例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或配置正确的非 loopback `trusted-proxy` 部署也能满足该要求。
    - 像对待密码一样对待这些令牌。
    - 对所有 API 密钥和令牌，**优先使用环境变量而不是配置文件**。这样可以避免密钥出现在 `openclaw.json` 中，降低意外暴露或被记录到日志中的风险。

  </Step>

  <Step title="部署">
    ```bash
    fly deploy
    ```

    首次部署会构建 Docker 镜像（约 2–3 分钟）。后续部署会更快。

    部署后，请验证：

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
    通过 SSH 登录到机器以创建正式配置：

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
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.5"]
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

    **注意：** 由于设置了 `OPENCLAW_STATE_DIR=/data`，配置路径为 `/data/openclaw.json`。

    **注意：** Discord 令牌可以来自以下任一位置：

    - 环境变量：`DISCORD_BOT_TOKEN`（推荐用于存放密钥）
    - 配置文件：`channels.discord.token`

    如果使用环境变量，则无需将令牌加入配置中。Gateway 网关会自动读取 `DISCORD_BOT_TOKEN`。

    重启以应用配置：

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="访问 Gateway 网关">
    ### 控制 UI

    在浏览器中打开：

    ```bash
    fly open
    ```

    或访问 `https://my-openclaw.fly.dev/`

    使用已配置的共享密钥进行认证。本指南使用 `OPENCLAW_GATEWAY_TOKEN` 中的 Gateway 网关令牌；如果你改用了密码认证，请改用该密码。

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

**修复方法：** 在 `fly.toml` 的进程命令中添加 `--bind lan`。

### 健康检查失败 / connection refused

Fly 无法通过配置的端口访问 Gateway 网关。

**修复方法：** 确保 `internal_port` 与 Gateway 网关端口一致（设置 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 内存问题

容器持续重启或被杀死。迹象包括：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或无提示重启。

**修复方法：** 增加 `fly.toml` 中的内存：

```toml
[[vm]]
  memory = "2048mb"
```

或者更新现有机器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意：** 512MB 太小。1GB 也许能运行，但在有负载或启用详细日志时可能会 OOM。**推荐使用 2GB。**

### Gateway 网关锁文件问题

Gateway 网关拒绝启动，并报出 “already running” 错误。

这通常发生在容器重启后，但 PID 锁文件仍保留在卷中。

**修复方法：** 删除锁文件：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

锁文件位于 `/data/gateway.*.lock`（不在子目录中）。

### 未读取配置

`--allow-unconfigured` 只会绕过启动保护。它不会创建或修复 `/data/openclaw.json`，因此请确保你的实际配置存在，并且在你希望正常以本地模式启动 Gateway 网关时包含 `gateway.mode="local"`。

验证配置是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 写入配置

`fly ssh console -C` 命令不支持 shell 重定向。要写入配置文件：

```bash
# 使用 echo + tee（从本地管道到远程）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 或使用 sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注意：** 如果文件已存在，`fly sftp` 可能会失败。请先删除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久保存

如果重启后你丢失了认证配置档、渠道/提供商状态或会话数据，
说明状态目录被写入到了容器文件系统中。

**修复方法：** 确保在 `fly.toml` 中设置了 `OPENCLAW_STATE_DIR=/data`，然后重新部署。

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

如果你需要在不完整重新部署的情况下修改启动命令：

```bash
# 获取机器 ID
fly machines list

# 更新命令
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 或同时增加内存
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注意：** 执行 `fly deploy` 后，机器命令可能会重置为 `fly.toml` 中的内容。如果你做过手动修改，请在部署后重新应用这些修改。

## 私有部署（强化版）

默认情况下，Fly 会分配公共 IP，这会让你的 Gateway 网关可通过 `https://your-app.fly.dev` 访问。这样做很方便，但也意味着你的部署可被互联网扫描器（Shodan、Censys 等）发现。

如果你希望进行**完全不对公网暴露**的强化部署，请使用私有模板。

### 何时使用私有部署

- 你只进行**出站**调用/发消息（没有入站 webhook）
- 你使用 **ngrok 或 Tailscale** 隧道处理所有 webhook 回调
- 你通过 **SSH、代理或 WireGuard** 访问 Gateway 网关，而不是浏览器
- 你希望部署**对互联网扫描器隐藏**

### 设置

使用 `fly.private.toml` 而不是标准配置：

```bash
# 使用私有配置部署
fly deploy -c fly.private.toml
```

或者将现有部署转换为私有部署：

```bash
# 列出当前 IP
fly ips list -a my-openclaw

# 释放公共 IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 切换到私有配置，这样未来部署就不会重新分配公共 IP
# （移除 [http_service] 或使用私有模板部署）
fly deploy -c fly.private.toml

# 分配仅私有的 IPv6
fly ips allocate-v6 --private -a my-openclaw
```

完成后，`fly ips list` 应只显示一个 `private` 类型 IP：

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

由于没有公共 URL，请使用以下任一方式：

**选项 1：本地代理（最简单）**

```bash
# 将本地 3000 端口转发到应用
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

### 私有部署中的 Webhooks

如果你在不公开暴露的前提下仍需要 webhook 回调（Twilio、Telnyx 等）：

1. **ngrok 隧道** - 在容器内或作为 sidecar 运行 ngrok
2. **Tailscale Funnel** - 通过 Tailscale 暴露特定路径
3. **仅出站** - 某些提供商（如 Twilio）在无 webhook 的情况下也能良好支持出站呼叫

语音通话使用 ngrok 的配置示例：

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

ngrok 隧道在容器内部运行，并提供一个公共 webhook URL，而不会暴露 Fly 应用本身。请将 `webhookSecurity.allowedHosts` 设置为该公共隧道主机名，这样才会接受被转发的 Host 请求头。

### 安全收益

| 方面 | 公共部署 | 私有部署 |
| ----------------- | ------------ | ---------- |
| 互联网扫描器 | 可发现 | 已隐藏 |
| 直接攻击 | 可能 | 已阻止 |
| 控制 UI 访问 | 浏览器 | 代理/VPN |
| webhook 投递 | 直接 | 通过隧道 |

## 说明

- Fly.io 使用的是 **x86 架构**（不是 ARM）
- Dockerfile 同时兼容这两种架构
- 对于 WhatsApp/Telegram 新手引导，请使用 `fly ssh console`
- 持久化数据存储在卷的 `/data` 路径下
- Signal 需要 Java + signal-cli；请使用自定义镜像，并将内存保持在 2GB 以上。

## 成本

使用推荐配置（`shared-cpu-2x`、2GB RAM）时：

- 取决于使用情况，约为每月 10–15 美元
- 免费层包含一定额度

详情请参见 [Fly.io pricing](https://fly.io/docs/about/pricing/)。

## 后续步骤

- 设置消息渠道：[Channels](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway configuration](/zh-CN/gateway/configuration)
- 保持 OpenClaw 为最新版本：[Updating](/zh-CN/install/updating)

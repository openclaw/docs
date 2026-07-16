---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 设置 Fly 卷、密钥和首次运行配置
summary: 使用持久化存储和 HTTPS 在 Fly.io 上分步部署 OpenClaw
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T11:41:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**目标：** 在 [Fly.io](https://fly.io) 机器上运行 OpenClaw Gateway 网关，并提供持久化存储、自动 HTTPS 和 Discord/渠道访问。

## 所需条件

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 账户（免费套餐可用）
- 模型身份验证：所选模型提供商的 API key
- 渠道凭据：Discord Bot token、Telegram token 等

## 初学者快速路径

1. 克隆仓库，自定义 `fly.toml`
2. 创建应用和卷，设置密钥
3. 使用 `fly deploy` 部署
4. 通过 SSH 进入并创建配置，或使用 Control UI

<Steps>
  <Step title="创建 Fly 应用">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 选择你自己的名称
    fly apps create my-openclaw

    # 1GB 通常足够
    fly volumes create openclaw_data --size 1 --region iad
    ```

    选择离你较近的区域。常见选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

  </Step>

  <Step title="配置 fly.toml">
    编辑 `fly.toml`，使其与你的应用名称和要求一致。仓库中跟踪的 `fly.toml` 是下面所示的公开模板；`deploy/fly.private.toml` 是经过加固、不使用公共 IP 的变体（参阅[私有部署](#private-deployment-hardened)）。

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

    OpenClaw Docker 镜像的入口点是 `tini`，默认运行 `node openclaw.mjs gateway`。Fly 的 `[processes]` 会替换 Docker 的 `CMD`（此处直接运行 `node dist/index.js gateway ...`，即同一个已编译入口点），而不会改动 `ENTRYPOINT`，因此进程仍以 `tini` 身份运行。

    **关键设置：**

    | 设置                           | 原因                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 绑定到 `0.0.0.0`，使 Fly 代理可以访问 Gateway 网关                     |
    | `--allow-unconfigured`         | 在没有配置文件的情况下启动（之后再创建）                        |
    | `internal_port = 3000`         | 必须与 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）匹配，以供 Fly 健康检查使用 |
    | `memory = "2048mb"`            | 512MB 太小；建议使用 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | 将状态持久化到卷                                                |

  </Step>

  <Step title="设置密钥">
    ```bash
    # 必需：用于非 loopback 绑定的 Gateway 网关身份验证 token
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # 模型提供商 API key
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # 可选：其他提供商
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # 渠道 token
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    非 loopback 绑定（`--bind lan`）需要有效的 Gateway 网关身份验证路径。此示例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正确配置的非 loopback 可信代理部署也满足此要求。有关 SecretRef 契约，请参阅[密钥管理](/zh-CN/gateway/secrets)。

    请像对待密码一样保护这些 token。对于 API key 和 token，优先使用环境变量/`fly secrets`，而不是配置文件，以免密钥进入 `openclaw.json`。

  </Step>

  <Step title="部署">
    ```bash
    fly deploy
    ```

    首次部署会构建 Docker 镜像。部署后进行验证：

    ```bash
    fly status
    fly logs
    ```

    HTTP/WebSocket 监听器启动后，Gateway 网关启动日志会记录 `gateway ready`。Fly 自身的健康检查会根据 `fly.toml` 监控 `internal_port = 3000`；镜像的 Docker `HEALTHCHECK` 指令还会轮询默认端口 18789 上的 `/healthz`，但此处不会使用该检查，因为此部署将 Gateway 网关端口覆盖为 `--port 3000`。

  </Step>

  <Step title="创建配置文件">
    通过 SSH 进入机器，创建正确的配置：

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

    使用 `OPENCLAW_STATE_DIR=/data` 时，配置路径为 `/data/openclaw.json`。

    将 `https://my-openclaw.fly.dev` 替换为你的真实 Fly 应用源。Gateway 网关启动时会根据运行时的 `--bind` 和 `--port` 值填充本地 Control UI 源，使首次启动可以在配置尚不存在时继续进行，但通过 Fly 使用浏览器访问时，仍需在 `gateway.controlUi.allowedOrigins` 中列出确切的 HTTPS 源。

    Discord token 可以来自以下任一位置：

    - 环境变量 `DISCORD_BOT_TOKEN`（建议用于密钥）；无需将其添加到配置中，Gateway 网关会自动读取
    - 配置文件 `channels.discord.token`

    重启以应用配置：

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

    使用已配置的共享密钥进行身份验证：来自 `OPENCLAW_GATEWAY_TOKEN` 的 Gateway 网关 token；如果已改为密码身份验证，则使用你的密码。

    ### 日志

    ```bash
    fly logs              # 实时日志
    fly logs --no-tail    # 近期日志
    ```

    ### SSH 控制台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 故障排查

### “应用未监听预期地址”

Gateway 网关绑定到 `127.0.0.1`，而不是 `0.0.0.0`。

**修复：**将 `--bind lan` 添加到 `fly.toml` 中的进程命令。

### 健康检查失败/连接被拒绝

Fly 无法通过配置的端口访问 Gateway 网关。

**修复：**确保 `internal_port` 与 Gateway 网关端口（`--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）匹配。

### OOM/内存问题

容器不断重启或被终止。迹象包括：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration` 或无提示重启。

**修复：**增加 `fly.toml` 中的内存：

```toml
[[vm]]
  memory = "2048mb"
```

或者更新现有机器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB 太小。1GB 可能可用，但在负载较高或启用详细日志时可能发生 OOM。建议使用 2GB。

### Gateway 网关锁问题

容器重启后，Gateway 网关因“已在运行”错误而拒绝启动。

运行时锁文件位于 `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
和 `gateway.state.<hash>.lock`（Linux：
`/tmp/openclaw-<uid>/gateway.*.lock`），而不在持久化的 `/data` 卷上，因此
完整重启容器通常会将它们与容器文件系统的其余部分一同清除。如果锁仍然存在（例如
保留容器文件系统的 `fly machine restart`）并阻止启动，请手动将其
删除：

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### 未读取配置

`--allow-unconfigured` 只会绕过启动保护。它不会创建或修复 `/data/openclaw.json`，因此请确保真实配置存在，并且包含用于正常启动本地 Gateway 网关的 `"gateway": { "mode": "local" }`。

验证配置是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 写入配置

`fly ssh console -C` 不支持 shell 重定向。要写入配置文件：

```bash
# echo + tee（从本地通过管道传输到远程）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 或使用 sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

如果文件已存在，`fly sftp` 可能会失败；请先删除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久化

如果重启后身份验证配置文件、渠道/提供商状态或会话丢失，则状态目录正在写入容器文件系统，而不是卷。

**修复：**确保在 `fly.toml` 中设置了 `OPENCLAW_STATE_DIR=/data`，然后重新部署。

## 更新

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` 是此处受监督的更新路径：它会根据 Dockerfile 重新构建镜像，因此 CLI/Gateway 网关版本、基础操作系统镜像以及所有 Dockerfile 更改都会一起更新。在运行中的容器内执行 `openclaw update` 并非同一操作，因为镜像以 Docker 构建的 `dist/` 目录树形式交付，其中没有可供检测的 `.git` 检出目录，也没有由 npm 管理的全局安装；有关虚拟机式安装的更新流程，请参阅[更新](/zh-CN/install/updating)。

### 更新机器命令

要在不完整重新部署的情况下更改启动命令：

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 或同时增加内存
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

后续执行 `fly deploy` 会将机器命令重置为 `fly.toml` 中的内容；重新部署后需要再次应用手动更改。

## 私有部署（加固）

默认情况下，Fly 会分配公共 IP，因此你的 Gateway 网关可通过 `https://your-app.fly.dev` 访问，并且可被互联网扫描器（Shodan、Censys 等）发现。

使用 `deploy/fly.private.toml` 可进行**无公共 IP**的加固部署：它省略了 `[http_service]`，因此不会分配公共入口。

### 何时使用私有部署

- 仅进行出站调用/发送消息（不使用入站 Webhooks）
- 由 ngrok 或 Tailscale 隧道处理所有 Webhook 回调
- 通过 SSH、代理或 WireGuard 访问 Gateway 网关，而不是浏览器
- 需要对互联网扫描器隐藏此部署

### 设置

```bash
fly deploy -c deploy/fly.private.toml
```

或者转换现有部署：

```bash
# 列出当前 IP
fly ips list -a my-openclaw

# 释放公网 IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 切换到私有配置，使后续部署不会重新分配公网 IP
fly deploy -c deploy/fly.private.toml

# 分配仅限私有网络的 IPv6
fly ips allocate-v6 --private -a my-openclaw
```

完成后，`fly ips list` 应仅显示一个 `private` 类型的 IP：

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

**选项 1：本地代理（最简单）**

```bash
fly proxy 3000:3000 -a my-openclaw
# 在浏览器中打开 http://localhost:3000
```

**选项 2：WireGuard VPN**

```bash
fly wireguard create
# 导入 WireGuard 客户端，然后通过内部 IPv6 访问
# 示例：http://[fdaa:x:x:x:x::x]:3000
```

**选项 3：仅使用 SSH**

```bash
fly ssh console -a my-openclaw
```

### 私有部署中的 Webhooks

要在不公开暴露服务的情况下接收 Webhook 回调（Twilio、Telnyx 等），可使用：

1. **ngrok 隧道**：在容器内运行 ngrok，或将其作为 sidecar 运行
2. **Tailscale Funnel**：通过 Tailscale 暴露特定路径
3. **仅出站**：某些提供商（Twilio）无需 Webhooks 即可进行出站呼叫

使用 ngrok 的语音呼叫配置示例，位于 `plugins.entries.voice-call.config` 下：

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

ngrok 隧道在容器内运行，并提供公共 Webhook URL，而无需暴露 Fly 应用本身。将 `webhookSecurity.allowedHosts` 设置为隧道主机名，以接受转发的 Host 请求头。

### 安全性权衡

| 方面              | 公开       | 私有        |
| ----------------- | ---------- | ----------- |
| 互联网扫描器      | 可被发现   | 隐藏        |
| 直接攻击          | 可能       | 已阻止      |
| Control UI 访问   | 浏览器     | 代理/VPN    |
| Webhook 传递      | 直接       | 通过隧道    |

## 注意事项

- Fly.io 使用 x86 架构；该 Dockerfile 同时兼容 x86 和 ARM。
- 对于 WhatsApp/Telegram 新手引导，请使用 `fly ssh console`。
- 持久化数据存储在 `/data` 的卷上。
- Signal 要求镜像中包含 signal-cli（基于 Java 的 CLI）；请使用自定义镜像，并将内存保持在 2GB 以上。

## 费用

使用推荐配置（`shared-cpu-2x`、2GB RAM）时，根据使用情况，预计每月费用约为 $10-15；免费套餐包含一些基础额度。当前费率请参阅 [Fly.io 定价](https://fly.io/docs/about/pricing/)。

## 后续步骤

- 设置消息渠道：[渠道](/zh-CN/channels)
- 配置 Gateway 网关：[Gateway 配置](/zh-CN/gateway/configuration)
- 使 OpenClaw 保持最新：[更新](/zh-CN/install/updating)

## 相关内容

- [安装概览](/zh-CN/install)
- [Hetzner](/zh-CN/install/hetzner)
- [Docker](/zh-CN/install/docker)
- [VPS 托管](/zh-CN/vps)

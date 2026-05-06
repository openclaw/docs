---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 設定 Fly 磁碟區、密鑰和首次執行設定
summary: OpenClaw 使用持久化儲存與 HTTPS 的 Fly.io 逐步部署
title: Fly.io
x-i18n:
    generated_at: "2026-05-06T17:57:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 534a94e4ff69542604ba3112d468b7274492c18b3c5054f47379c21421f518bd
    source_path: install/fly.md
    workflow: 16
---

**目標：** 在 [Fly.io](https://fly.io) 機器上執行 OpenClaw Gateway，並具備持久化儲存、自動 HTTPS，以及 Discord/頻道存取能力。

## 你需要準備

- 已安裝 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 帳號（免費方案可用）
- 模型驗證：所選模型供應商的 API 金鑰
- 頻道憑證：Discord 機器人權杖、Telegram 權杖等。

## 初學者快速路徑

1. 複製儲存庫 → 自訂 `fly.toml`
2. 建立應用程式 + volume → 設定 secrets
3. 使用 `fly deploy` 部署
4. SSH 進去建立設定，或使用控制 UI

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **提示：** 選擇離你較近的區域。常見選項：`lhr`（倫敦）、`iad`（維吉尼亞）、`sjc`（聖荷西）。

  </Step>

  <Step title="Configure fly.toml">
    編輯 `fly.toml`，使其符合你的應用程式名稱與需求。

    **安全性注意事項：** 預設設定會公開 URL。若要進行沒有公開 IP 的強化部署，請參閱[私人部署](#private-deployment-hardened)，或使用 `deploy/fly.private.toml`。

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

    **關鍵設定：**

    | 設定                           | 原因                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 綁定到 `0.0.0.0`，讓 Fly 的 proxy 可以連到 Gateway                          |
    | `--allow-unconfigured`         | 在沒有設定檔的情況下啟動（你稍後會建立設定檔）                              |
    | `internal_port = 3000`         | 必須符合 Fly 健康檢查使用的 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）      |
    | `memory = "2048mb"`            | 512MB 太小；建議使用 2GB                                                     |
    | `OPENCLAW_STATE_DIR = "/data"` | 將狀態持久化到 volume                                                       |

  </Step>

  <Step title="Set secrets">
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

    **注意事項：**

    - 非 loopback 綁定（`--bind lan`）需要有效的 Gateway 驗證路徑。此 Fly.io 範例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正確設定的非 loopback `trusted-proxy` 部署也符合需求。
    - 請像密碼一樣保護這些權杖。
    - **所有 API 金鑰與權杖都優先使用 env vars，而不是設定檔**。這可以讓 secrets 不會進入 `openclaw.json`，避免意外外洩或被記錄。

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    第一次部署會建置 Docker 映像檔（約 2-3 分鐘）。後續部署會更快。

    部署後，請驗證：

    ```bash
    fly status
    fly logs
    ```

    你應該會看到：

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Create config file">
    SSH 進入機器以建立適當的設定：

    ```bash
    fly ssh console
    ```

    建立設定目錄與檔案：

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

    **注意：** 使用 `OPENCLAW_STATE_DIR=/data` 時，設定路徑是 `/data/openclaw.json`。

    **注意：** 請將 `https://my-openclaw.fly.dev` 替換成你實際的 Fly 應用程式 origin。Gateway 啟動時會從執行階段的 `--bind` 與 `--port` 值植入本機控制 UI origin，因此第一次啟動可在設定檔尚不存在時繼續進行，但透過 Fly 的瀏覽器存取仍需要在 `gateway.controlUi.allowedOrigins` 中列出精確的 HTTPS origin。

    **注意：** Discord 權杖可以來自以下任一來源：

    - 環境變數：`DISCORD_BOT_TOKEN`（建議用於 secrets）
    - 設定檔：`channels.discord.token`

    如果使用 env var，就不需要將權杖加入設定。Gateway 會自動讀取 `DISCORD_BOT_TOKEN`。

    重新啟動以套用：

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### 控制 UI

    在瀏覽器中開啟：

    ```bash
    fly open
    ```

    或造訪 `https://my-openclaw.fly.dev/`

    使用已設定的共享 secret 進行驗證。本指南使用來自 `OPENCLAW_GATEWAY_TOKEN` 的 Gateway 權杖；如果你已改用密碼驗證，請改用該密碼。

    ### 記錄

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH 主控台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 疑難排解

###「應用程式未在預期位址上監聽」

Gateway 綁定到了 `127.0.0.1`，而不是 `0.0.0.0`。

**修正：** 在 `fly.toml` 的 process command 中加入 `--bind lan`。

### 健康檢查失敗 / 連線被拒

Fly 無法透過已設定的連接埠連到 Gateway。

**修正：** 確認 `internal_port` 符合 Gateway 連接埠（設定 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 記憶體問題

容器持續重新啟動或被終止。徵兆：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或無訊息重新啟動。

**修正：** 在 `fly.toml` 中增加記憶體：

```toml
[[vm]]
  memory = "2048mb"
```

或更新既有機器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意：** 512MB 太小。1GB 可能可用，但在負載下或啟用詳細記錄時可能 OOM。**建議使用 2GB。**

### Gateway 鎖定問題

Gateway 因「已在執行」錯誤而拒絕啟動。

這會在容器重新啟動但 PID 鎖定檔仍保留在 volume 上時發生。

**修正：** 刪除鎖定檔：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

鎖定檔位於 `/data/gateway.*.lock`（不在子目錄中）。

### 設定未被讀取

`--allow-unconfigured` 只會略過啟動保護。它不會建立或修復 `/data/openclaw.json`，因此當你想要正常啟動本機 Gateway 時，請確認真實設定存在，且包含 `gateway.mode="local"`。

驗證設定是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 透過 SSH 寫入設定

`fly ssh console -C` 命令不支援 shell 重新導向。若要寫入設定檔：

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注意：** 如果檔案已存在，`fly sftp` 可能會失敗。請先刪除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 狀態未持久化

如果重新啟動後遺失驗證設定檔、頻道/供應商狀態或工作階段，表示狀態目錄正在寫入容器檔案系統。

**修正：** 確認 `fly.toml` 中已設定 `OPENCLAW_STATE_DIR=/data`，然後重新部署。

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

### 更新機器命令

如果你需要在不完整重新部署的情況下變更啟動命令：

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**注意：** 執行 `fly deploy` 後，機器命令可能會重設為 `fly.toml` 中的內容。如果你進行了手動變更，請在部署後重新套用。

## 私人部署（強化）

預設情況下，Fly 會配置公開 IP，使你的 Gateway 可透過 `https://your-app.fly.dev` 存取。這很方便，但也代表你的部署可被網際網路掃描器（Shodan、Censys 等）發現。

若要進行**沒有公開暴露**的強化部署，請使用私人範本。

### 何時使用私人部署

- 你只會進行**對外**呼叫/訊息（沒有傳入 Webhook）
- 你對任何 Webhook 回呼使用 **ngrok 或 Tailscale** tunnel
- 你透過 **SSH、proxy 或 WireGuard** 存取 Gateway，而不是瀏覽器
- 你希望部署**對網際網路掃描器隱藏**

### 設定

使用 `deploy/fly.private.toml`，而不是標準設定：

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

或轉換既有部署：

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

完成後，`fly ips list` 應該只會顯示 `private` 類型 IP：

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 存取私人部署

由於沒有公開 URL，請使用以下其中一種方法：

**選項 1：本機 proxy（最簡單）**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**選項 2：WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**選項 3：僅 SSH**

```bash
fly ssh console -a my-openclaw
```

### 私有部署的 Webhook

如果你需要 Webhook 回呼（Twilio、Telnyx 等）但不想公開暴露：

1. **ngrok 通道** - 在容器內或作為 sidecar 執行 ngrok
2. **Tailscale Funnel** - 透過 Tailscale 暴露特定路徑
3. **僅限輸出** - 有些提供者（Twilio）在沒有 Webhook 的情況下也能正常處理輸出通話

使用 ngrok 的語音通話設定範例：

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

ngrok 通道會在容器內執行，並提供公開的 Webhook URL，而不會暴露 Fly app 本身。將 `webhookSecurity.allowedHosts` 設為公開通道主機名稱，這樣轉送的主機標頭就會被接受。

### 安全性優點

| 面向              | 公開       | 私有      |
| ----------------- | ---------- | --------- |
| 網際網路掃描器    | 可被發現   | 隱藏      |
| 直接攻擊          | 可能       | 已封鎖    |
| 控制 UI 存取      | 瀏覽器     | 代理/VPN  |
| Webhook 傳遞      | 直接       | 透過通道  |

## 注意事項

- Fly.io 使用 **x86 架構**（不是 ARM）
- Dockerfile 與兩種架構都相容
- 對於 WhatsApp/Telegram 上線設定，請使用 `fly ssh console`
- 持久性資料位於 `/data` 的 volume
- Signal 需要 Java + signal-cli；請使用自訂映像檔，並將記憶體維持在 2GB 以上。

## 成本

使用建議設定（`shared-cpu-2x`、2GB RAM）：

- 每月約 $10-15，視使用量而定
- 免費方案包含部分額度

詳情請參閱 [Fly.io 定價](https://fly.io/docs/about/pricing/)。

## 後續步驟

- 設定訊息通道：[通道](/zh-TW/channels)
- 設定 Gateway：[Gateway 設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[更新](/zh-TW/install/updating)

## 相關

- [安裝概觀](/zh-TW/install)
- [Hetzner](/zh-TW/install/hetzner)
- [Docker](/zh-TW/install/docker)
- [VPS 託管](/zh-TW/vps)

---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 設定 Fly 磁碟區、密鑰和首次執行設定
summary: OpenClaw 的 Fly.io 逐步部署指南，包含持久性儲存與 HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-30T03:14:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# Fly.io 部署

**目標：** 在 [Fly.io](https://fly.io) 機器上執行 OpenClaw Gateway，具備持久儲存、自動 HTTPS，以及 Discord/通道存取。

## 你需要的項目

- 已安裝 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 帳號（免費方案即可）
- 模型驗證：你選用模型提供者的 API 金鑰
- 通道憑證：Discord bot token、Telegram token 等。

## 初學者快速路徑

1. 複製 repo → 自訂 `fly.toml`
2. 建立 app + volume → 設定秘密
3. 使用 `fly deploy` 部署
4. SSH 進入以建立設定，或使用控制 UI

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

    **提示：** 選擇靠近你的區域。常見選項：`lhr`（倫敦）、`iad`（維吉尼亞）、`sjc`（聖荷西）。

  </Step>

  <Step title="Configure fly.toml">
    編輯 `fly.toml` 以符合你的 app 名稱與需求。

    **安全性注意事項：** 預設設定會公開一個 URL。若要採用沒有公開 IP 的強化部署，請參閱[私有部署](#private-deployment-hardened)或使用 `fly.private.toml`。

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
    | `--bind lan`                   | 綁定到 `0.0.0.0`，讓 Fly 的 proxy 可以連到 Gateway                         |
    | `--allow-unconfigured`         | 在沒有設定檔的情況下啟動（你之後會建立一個）                               |
    | `internal_port = 3000`         | 必須符合 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`），以供 Fly 健康檢查使用 |
    | `memory = "2048mb"`            | 512MB 太小；建議 2GB                                                        |
    | `OPENCLAW_STATE_DIR = "/data"` | 將狀態持久保存到 volume                                                     |

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

    **注意：**

    - 非 loopback 綁定（`--bind lan`）需要有效的 Gateway 驗證路徑。這個 Fly.io 範例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正確設定的非 loopback `trusted-proxy` 部署也符合要求。
    - 請把這些 token 視為密碼處理。
    - **所有 API 金鑰與 token 建議優先使用環境變數，而不是設定檔。** 這可避免秘密放進 `openclaw.json`，降低意外外洩或被記錄的風險。

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    第一次部署會建置 Docker image（約 2-3 分鐘）。後續部署會更快。

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

    **注意：** 請將 `https://my-openclaw.fly.dev` 換成你實際的 Fly app
    origin。Gateway 啟動時會根據執行階段的 `--bind` 與 `--port` 值植入本機控制 UI origin，讓第一次啟動可在設定尚不存在時繼續進行，
    但透過 Fly 從瀏覽器存取時，仍需要在
    `gateway.controlUi.allowedOrigins` 中列出精確的 HTTPS origin。

    **注意：** Discord token 可來自以下任一處：

    - 環境變數：`DISCORD_BOT_TOKEN`（秘密建議使用）
    - 設定檔：`channels.discord.token`

    若使用環境變數，就不需要把 token 加到設定中。Gateway 會自動讀取 `DISCORD_BOT_TOKEN`。

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

    使用設定好的共用秘密進行驗證。本指南使用來自
    `OPENCLAW_GATEWAY_TOKEN` 的 Gateway token；如果你改用密碼驗證，請改用該密碼。

    ### Logs

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH Console

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 疑難排解

###「App is not listening on expected address」

Gateway 綁定到 `127.0.0.1`，而不是 `0.0.0.0`。

**修正：** 在 `fly.toml` 的 process command 中加入 `--bind lan`。

### 健康檢查失敗 / 連線被拒

Fly 無法在設定的連接埠連到 Gateway。

**修正：** 確認 `internal_port` 符合 Gateway 連接埠（設定 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 記憶體問題

容器持續重新啟動或被終止。徵兆：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或無聲重新啟動。

**修正：** 在 `fly.toml` 中增加記憶體：

```toml
[[vm]]
  memory = "2048mb"
```

或更新現有機器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意：** 512MB 太小。1GB 可能可用，但在負載下或詳細記錄時可能 OOM。**建議使用 2GB。**

### Gateway 鎖定問題

Gateway 拒絕啟動，並出現「already running」錯誤。

這會發生在容器重新啟動，但 PID lock file 仍留在 volume 上時。

**修正：** 刪除 lock file：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

lock file 位於 `/data/gateway.*.lock`（不在子目錄中）。

### 設定未被讀取

`--allow-unconfigured` 只會略過啟動保護。它不會建立或修復 `/data/openclaw.json`，因此請確認你的實際設定存在，且在你想正常啟動本機 Gateway 時包含 `gateway.mode="local"`。

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

### 狀態未持久保存

如果重新啟動後遺失驗證設定檔、通道/提供者狀態或工作階段，
表示 state dir 正在寫入容器檔案系統。

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

**注意：** 執行 `fly deploy` 後，機器命令可能會重設為 `fly.toml` 中的內容。如果你做了手動變更，請在部署後重新套用。

## 私有部署（強化）

預設情況下，Fly 會配置公開 IP，讓你的 Gateway 可透過 `https://your-app.fly.dev` 存取。這很方便，但也代表你的部署可被網際網路掃描器（Shodan、Censys 等）發現。

若要採用**沒有公開暴露**的強化部署，請使用私有範本。

### 何時使用私有部署

- 你只發出**對外**呼叫/訊息（沒有傳入 Webhook）
- 你針對任何 Webhook callback 使用 **ngrok 或 Tailscale** tunnel
- 你透過 **SSH、proxy 或 WireGuard** 存取 Gateway，而不是瀏覽器
- 你希望部署**對網際網路掃描器隱藏**

### 設定

使用 `fly.private.toml` 取代標準設定：

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

或轉換現有部署：

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

完成後，`fly ips list` 應該只顯示 `private` 類型的 IP：

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 存取私有部署

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

1. **ngrok tunnel** - 在容器內或作為 sidecar 執行 ngrok
2. **Tailscale Funnel** - 透過 Tailscale 暴露特定路徑
3. **僅限傳出** - 某些供應商（Twilio）不需要 Webhook 也能正常處理傳出通話

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

ngrok tunnel 會在容器內執行，並提供公開 Webhook URL，而不會暴露 Fly app 本身。將 `webhookSecurity.allowedHosts` 設定為公開 tunnel 主機名稱，讓轉送的 host 標頭能被接受。

### 安全性優勢

| 層面              | 公開         | 私有       |
| ----------------- | ------------ | ---------- |
| 網際網路掃描器    | 可被發現     | 隱藏       |
| 直接攻擊          | 可能         | 已封鎖     |
| 控制介面存取      | 瀏覽器       | Proxy/VPN  |
| Webhook 傳遞      | 直接         | 透過 tunnel |

## 備註

- Fly.io 使用 **x86 架構**（不是 ARM）
- Dockerfile 與兩種架構皆相容
- 如需 WhatsApp/Telegram onboarding，請使用 `fly ssh console`
- 持久資料位於 `/data` 的 volume 上
- Signal 需要 Java + signal-cli；請使用自訂映像檔，並將記憶體維持在 2GB 以上。

## 成本

使用建議設定（`shared-cpu-2x`、2GB RAM）：

- 依使用量約 ~$10-15/月
- 免費方案包含部分額度

詳情請參閱 [Fly.io pricing](https://fly.io/docs/about/pricing/)。

## 後續步驟

- 設定訊息通道：[Channels](/zh-TW/channels)
- 設定 Gateway：[Gateway configuration](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[Updating](/zh-TW/install/updating)

## 相關內容

- [Install overview](/zh-TW/install)
- [Hetzner](/zh-TW/install/hetzner)
- [Docker](/zh-TW/install/docker)
- [VPS hosting](/zh-TW/vps)

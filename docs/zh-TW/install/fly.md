---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 設定 Fly 磁碟區、機密資訊與首次執行設定
summary: OpenClaw 使用持久化儲存與 HTTPS 的 Fly.io 逐步部署指南
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T19:26:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**目標：** 在 [Fly.io](https://fly.io) 機器上執行 OpenClaw 閘道，具備持久儲存、自動 HTTPS，以及 Discord/頻道存取。

## 你需要準備

- 已安裝 [flyctl 命令列介面](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 帳號（可使用免費方案）
- 模型驗證：你所選模型提供者的 API 金鑰
- 頻道憑證：Discord Bot 權杖、Telegram 權杖等。

## 初學者快速路徑

1. 複製儲存庫 → 自訂 `fly.toml`
2. 建立應用程式 + 磁碟區 → 設定密鑰
3. 使用 `fly deploy` 部署
4. 透過 SSH 進入以建立設定，或使用 Control UI

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
    編輯 `fly.toml`，讓它符合你的應用程式名稱與需求。

    **安全性注意事項：** 預設設定會公開一個公用 URL。如需沒有公用 IP 的強化部署，請參閱[私有部署](#private-deployment-hardened)，或使用 `deploy/fly.private.toml`。

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

    OpenClaw Docker 映像檔使用 `tini` 作為進入點。Fly 程序命令會取代 Docker `CMD`，但不會取代 `ENTRYPOINT`，因此程序仍會在 `tini` 下執行。

    **關鍵設定：**

    | 設定                           | 原因                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 繫結到 `0.0.0.0`，讓 Fly 的代理可以連到閘道                                 |
    | `--allow-unconfigured`         | 在沒有設定檔的情況下啟動（你稍後會建立）                                    |
    | `internal_port = 3000`         | 必須與 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）相符，供 Fly 健康檢查使用 |
    | `memory = "2048mb"`            | 512MB 太小；建議使用 2GB                                                     |
    | `OPENCLAW_STATE_DIR = "/data"` | 將狀態持久保存在磁碟區上                                                    |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **注意事項：**

    - 非回送繫結（`--bind lan`）需要有效的閘道驗證路徑。這個 Fly.io 範例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正確設定的非回送 `trusted-proxy` 部署也能滿足需求。
    - 將這些權杖視同密碼處理。
    - **所有 API 金鑰和權杖都優先使用環境變數，而不是設定檔**。這可避免密鑰進入 `openclaw.json`，以免意外曝光或記錄到日誌中。

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
    透過 SSH 進入機器以建立正確的設定：

    ```bash
    fly ssh console
    ```

    建立設定目錄和檔案：

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

    **注意：** 將 `https://my-openclaw.fly.dev` 替換為你真正的 Fly 應用程式
    origin。閘道啟動時會根據執行階段的 `--bind` 和 `--port` 值，植入本機 Control UI origin，
    因此第一次啟動可以在設定尚不存在前繼續進行，
    但透過 Fly 從瀏覽器存取時，仍需要在
    `gateway.controlUi.allowedOrigins` 中列出精確的 HTTPS origin。

    **注意：** Discord 權杖可以來自以下任一來源：

    - 環境變數：`DISCORD_BOT_TOKEN`（建議用於密鑰）
    - 設定檔：`channels.discord.token`

    如果使用環境變數，就不需要把權杖加入設定。閘道會自動讀取 `DISCORD_BOT_TOKEN`。

    重新啟動以套用：

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    在瀏覽器中開啟：

    ```bash
    fly open
    ```

    或前往 `https://my-openclaw.fly.dev/`

    使用已設定的共享密鑰驗證。本指南使用來自
    `OPENCLAW_GATEWAY_TOKEN` 的閘道權杖；如果你改用密碼驗證，
    請改用該密碼。

    ### 日誌

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

###「應用程式沒有在預期位址上監聽」

閘道繫結到 `127.0.0.1`，而不是 `0.0.0.0`。

**修正：** 在 `fly.toml` 的程序命令中加入 `--bind lan`。

### 健康檢查失敗 / 連線被拒

Fly 無法透過設定的連接埠連到閘道。

**修正：** 確認 `internal_port` 與閘道連接埠相符（設定 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 記憶體問題

容器持續重新啟動或被終止。徵兆：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或無提示重新啟動。

**修正：** 在 `fly.toml` 中增加記憶體：

```toml
[[vm]]
  memory = "2048mb"
```

或更新現有機器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意：** 512MB 太小。1GB 可能可用，但在負載下或啟用詳細記錄時可能 OOM。**建議使用 2GB。**

### 閘道鎖定問題

閘道因「已在執行」錯誤而拒絕啟動。

這會在容器重新啟動，但 PID 鎖定檔仍保留在磁碟區上時發生。

**修正：** 刪除鎖定檔：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

鎖定檔位於 `/data/gateway.*.lock`（不在子目錄中）。

### 設定未被讀取

`--allow-unconfigured` 只會略過啟動防護。它不會建立或修復 `/data/openclaw.json`，因此在你想要正常啟動本機閘道時，請確認真正的設定存在，並包含 `gateway.mode="local"`。

驗證設定存在：

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

如果重新啟動後遺失驗證設定檔、頻道/提供者狀態或工作階段，
表示狀態目錄正在寫入容器檔案系統。

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

預設情況下，Fly 會配置公用 IP，讓你的閘道可透過 `https://your-app.fly.dev` 存取。這很方便，但也表示你的部署可被網際網路掃描器（Shodan、Censys 等）發現。

如需**沒有公用曝光**的強化部署，請使用私有範本。

### 何時使用私有部署

- 你只發出**對外**呼叫/訊息（沒有傳入網路鉤子）
- 你為任何網路鉤子回呼使用 **ngrok 或 Tailscale** 通道
- 你透過 **SSH、代理或 WireGuard** 存取閘道，而不是瀏覽器
- 你希望部署**不被網際網路掃描器發現**

### 設定

使用 `deploy/fly.private.toml`，而不是標準設定：

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
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
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

完成後，`fly ips list` 應該只會顯示一個 `private` 類型的 IP：

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 存取私有部署

由於沒有公用 URL，請使用以下其中一種方法：

**選項 1：本機代理（最簡單）**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**選項 2：WireGuard VPN**

```bash
# 建立 WireGuard 設定（一次性）
fly wireguard create

# 匯入至 WireGuard 用戶端，然後透過內部 IPv6 存取
# 範例：http://[fdaa:x:x:x:x::x]:3000
```

**選項 3：僅 SSH**

```bash
fly ssh console -a my-openclaw
```

### 搭配私人部署使用網路鉤子

如果你需要網路鉤子回呼（Twilio、Telnyx 等）但不想公開暴露：

1. **ngrok tunnel** - 在容器內或作為 sidecar 執行 ngrok
2. **Tailscale Funnel** - 透過 Tailscale 暴露特定路徑
3. **僅限輸出** - 有些供應商（Twilio）不需網路鉤子即可正常進行輸出通話

搭配 ngrok 的語音通話設定範例：

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

ngrok tunnel 會在容器內執行，並提供公開的網路鉤子 URL，而不會暴露 Fly app 本身。將 `webhookSecurity.allowedHosts` 設為公開 tunnel 主機名稱，才能接受轉送的 host 標頭。

### 安全性優勢

| 面向            | 公開       | 私人      |
| ----------------- | ------------ | ---------- |
| 網際網路掃描器 | 可被發現 | 隱藏     |
| 直接攻擊    | 可能     | 已封鎖    |
| 控制 UI 存取 | 瀏覽器      | Proxy/VPN  |
| 網路鉤子傳遞  | 直接       | 經由 tunnel |

## 備註

- Fly.io 使用 **x86 架構**（不是 ARM）
- Dockerfile 相容於兩種架構
- 若要進行 WhatsApp/Telegram onboarding，請使用 `fly ssh console`
- 持久性資料位於 `/data` 的 volume 上
- Signal 需要 Java + signal-cli；請使用自訂 image，並將記憶體維持在 2GB 以上。

## 費用

使用建議設定（`shared-cpu-2x`、2GB RAM）時：

- 每月約 $10-15，視使用量而定
- 免費方案包含部分額度

詳情請參閱 [Fly.io pricing](https://fly.io/docs/about/pricing/)。

## 後續步驟

- 設定訊息 channel：[Channel](/zh-TW/channels)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[更新](/zh-TW/install/updating)

## 相關

- [安裝概覽](/zh-TW/install)
- [Hetzner](/zh-TW/install/hetzner)
- [Docker](/zh-TW/install/docker)
- [VPS hosting](/zh-TW/vps)

---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 設定 Fly 磁碟區、密鑰和首次執行設定
summary: 逐步將 OpenClaw 部署到 Fly.io，並設定持久化儲存與 HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-05T11:23:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**目標：** 在 [Fly.io](https://fly.io) 機器上執行 OpenClaw 閘道，具備持久化儲存、自動 HTTPS，以及 Discord／頻道存取。

## 你需要準備

- 已安裝 [flyctl 命令列介面](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 帳號（免費方案可用）
- 模型驗證：所選模型提供者的 API 金鑰
- 頻道憑證：Discord bot token、Telegram token 等

## 初學者快速路徑

1. 複製儲存庫，自訂 `fly.toml`
2. 建立應用程式與 volume，設定 secrets
3. 使用 `fly deploy` 部署
4. 透過 SSH 進入建立設定，或使用控制介面

<Steps>
  <Step title="建立 Fly 應用程式">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # pick your own name
    fly apps create my-openclaw

    # 1GB is usually enough
    fly volumes create openclaw_data --size 1 --region iad
    ```

    選擇靠近你的區域。常見選項：`lhr`（倫敦）、`iad`（維吉尼亞）、`sjc`（聖荷西）。

  </Step>

  <Step title="設定 fly.toml">
    編輯 `fly.toml` 以符合你的應用程式名稱與需求。儲存庫追蹤的 `fly.toml` 是下方顯示的公開範本；`deploy/fly.private.toml` 是強化的無公開 IP 變體（請參閱[私有部署](#private-deployment-hardened)）。

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

    OpenClaw Docker 映像的進入點是 `tini`，預設執行 `node openclaw.mjs gateway`。Fly `[processes]` 會取代 Docker `CMD`（此處直接執行 `node dist/index.js gateway ...`，也就是相同的已編譯進入點），但不會碰到 `ENTRYPOINT`，因此程序仍會在 `tini` 底下執行。

    **關鍵設定：**

    | 設定                           | 原因                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 綁定到 `0.0.0.0`，讓 Fly 的 proxy 可以連到閘道                              |
    | `--allow-unconfigured`         | 在沒有設定檔的情況下啟動（之後再建立）                                      |
    | `internal_port = 3000`         | 必須符合 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`），供 Fly 健康檢查使用   |
    | `memory = "2048mb"`            | 512MB 太小；建議 2GB                                                        |
    | `OPENCLAW_STATE_DIR = "/data"` | 將狀態持久化到 volume                                                       |

  </Step>

  <Step title="設定 secrets">
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

    非 loopback 綁定（`--bind lan`）需要有效的閘道驗證路徑。此範例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正確設定的非 loopback trusted-proxy 部署也符合需求。請參閱 [Secrets 管理](/zh-TW/gateway/secrets)了解 SecretRef 合約。

    將這些 token 視為密碼。API 金鑰與 token 建議使用環境變數／`fly secrets`，而不是設定檔，讓 secrets 不會進入 `openclaw.json`。

  </Step>

  <Step title="部署">
    ```bash
    fly deploy
    ```

    第一次部署會建置 Docker 映像。部署後驗證：

    ```bash
    fly status
    fly logs
    ```

    當 HTTP/WebSocket listener 啟動後，閘道啟動日誌會記錄 `gateway ready`。Fly 自己的健康檢查會依照 `fly.toml` 監看 `internal_port = 3000`；映像的 Docker `HEALTHCHECK` 指令也會額外輪詢其預設連接埠 18789 上的 `/healthz`，但此部署將閘道覆寫為 `--port 3000`，因此這裡不會使用該預設連接埠。

  </Step>

  <Step title="建立設定檔">
    透過 SSH 進入機器以建立正確設定：

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

    使用 `OPENCLAW_STATE_DIR=/data` 時，設定路徑是 `/data/openclaw.json`。

    將 `https://my-openclaw.fly.dev` 替換為你的實際 Fly 應用程式 origin。閘道啟動會從執行階段 `--bind` 和 `--port` 值播種本機控制介面 origins，因此第一次開機可以在設定尚不存在時繼續；但透過 Fly 從瀏覽器存取仍需要在 `gateway.controlUi.allowedOrigins` 中列出精確的 HTTPS origin。

    Discord token 可以來自：

    - 環境變數 `DISCORD_BOT_TOKEN`（建議用於 secrets）；不需要加入設定，閘道會自動讀取
    - 設定檔 `channels.discord.token`

    重新啟動以套用：

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="存取閘道">
    ### 控制介面

    ```bash
    fly open
    ```

    或前往 `https://my-openclaw.fly.dev/`。

    使用已設定的共享 secret 驗證：來自 `OPENCLAW_GATEWAY_TOKEN` 的閘道 token，或如果你改用密碼驗證，則使用你的密碼。

    ### 日誌

    ```bash
    fly logs              # live logs
    fly logs --no-tail    # recent logs
    ```

    ### SSH 主控台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 疑難排解

###「App is not listening on expected address」

閘道綁定到 `127.0.0.1`，而不是 `0.0.0.0`。

**修正：** 在 `fly.toml` 的程序命令中加入 `--bind lan`。

### 健康檢查失敗／連線被拒

Fly 無法在設定的連接埠連到閘道。

**修正：** 確認 `internal_port` 符合閘道連接埠（`--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM／記憶體問題

容器持續重新啟動或被終止。跡象包括：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或無聲重新啟動。

**修正：** 在 `fly.toml` 中增加記憶體：

```toml
[[vm]]
  memory = "2048mb"
```

或更新現有機器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB 太小。1GB 可能可用，但在負載下或詳細日誌開啟時可能 OOM。建議使用 2GB。

### 閘道鎖定問題

容器重新啟動後，閘道因「already running」錯誤而拒絕啟動。

單一執行個體鎖定檔位於 `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`（Linux：`/tmp/openclaw-<uid>/gateway.<hash>.lock`），不在持久化 `/data` volume 上，因此完整容器重新啟動通常會連同其餘容器檔案系統一起清除它。如果鎖定仍存在（例如保留容器檔案系統的 `fly machine restart`）並阻擋啟動，請手動移除：

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### 未讀取設定

`--allow-unconfigured` 只會略過啟動防護。它不會建立或修復 `/data/openclaw.json`，因此請確認你的實際設定存在，並包含 `"gateway": { "mode": "local" }`，以便正常啟動本機閘道。

驗證設定存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 透過 SSH 寫入設定

`fly ssh console -C` 不支援 shell 重新導向。若要寫入設定檔：

```bash
# echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# or sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

如果檔案已存在，`fly sftp` 可能會失敗；請先刪除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 狀態未持久化

如果重新啟動後遺失驗證 profiles、頻道／提供者狀態或 sessions，表示狀態目錄正在寫入容器檔案系統，而不是 volume。

**修正：** 確認 `fly.toml` 中已設定 `OPENCLAW_STATE_DIR=/data`，然後重新部署。

## 更新

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` 是此處的受監督路徑：它會從 Dockerfile 重新建置映像，因此命令列介面／閘道版本、基礎 OS 映像，以及任何 Dockerfile 變更都會一起更新。在執行中的容器內使用 `openclaw update` 不是相同操作，因為映像是以 Docker 建置的 `dist/` tree 交付，沒有 `.git` checkout，也沒有可供偵測的 npm 管理全域安裝；關於 VM 風格安裝的流程，請參閱[更新](/zh-TW/install/updating)。

### 更新機器命令

若要在不完整重新部署的情況下變更啟動命令：

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# or with a memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

之後執行 `fly deploy` 會將機器命令重設回 `fly.toml` 中的內容；重新部署後請重新套用手動變更。

## 私有部署（強化）

預設情況下，Fly 會配置公開 IP，因此你的閘道可透過 `https://your-app.fly.dev` 存取，並且可被網際網路掃描器（Shodan、Censys 等）發現。

使用 `deploy/fly.private.toml` 進行強化部署，且**沒有公開 IP**：它省略 `[http_service]`，因此不會配置公開 ingress。

### 何時使用私有部署

- 只有 outbound 呼叫／訊息（沒有 inbound 網路鉤子）
- ngrok 或 Tailscale tunnels 處理任何網路鉤子 callbacks
- 閘道存取透過 SSH、proxy 或 WireGuard，而不是瀏覽器
- 部署應該對網際網路掃描器隱藏

### 設定

```bash
fly deploy -c deploy/fly.private.toml
```

或轉換現有部署：

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

完成後，`fly ips list` 應該只會顯示一個 `private` 類型的 IP：

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 存取私人部署

**選項 1：本機代理（最簡單）**

```bash
fly proxy 3000:3000 -a my-openclaw
# open http://localhost:3000 in a browser
```

**選項 2：WireGuard VPN**

```bash
fly wireguard create
# import to a WireGuard client, then access via internal IPv6
# example: http://[fdaa:x:x:x:x::x]:3000
```

**選項 3：僅限 SSH**

```bash
fly ssh console -a my-openclaw
```

### 私人部署的網路鉤子

若要在不公開暴露的情況下使用網路鉤子回呼（Twilio、Telnyx 等）：

1. **ngrok 通道**：在容器內執行 ngrok，或作為 sidecar 執行
2. **Tailscale Funnel**：透過 Tailscale 暴露特定路徑
3. **僅限出站**：部分提供者（Twilio）可在沒有網路鉤子的情況下處理出站通話

使用 ngrok 的語音通話設定範例，位於 `plugins.entries.voice-call.config` 下：

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

ngrok 通道會在容器內執行，並提供公開的網路鉤子 URL，而不會暴露 Fly 應用程式本身。將 `webhookSecurity.allowedHosts` 設為通道主機名稱，這樣轉送的主機標頭才會被接受。

### 安全性取捨

| 面向              | 公開         | 私人       |
| ----------------- | ------------ | ---------- |
| 網際網路掃描器    | 可被發現     | 隱藏       |
| 直接攻擊          | 可能         | 已封鎖     |
| 控制 UI 存取      | 瀏覽器       | 代理/VPN   |
| 網路鉤子遞送      | 直接         | 透過通道   |

## 備註

- Fly.io 使用 x86 架構；Dockerfile 同時相容 x86 和 ARM。
- 若要進行 WhatsApp/Telegram onboarding，請使用 `fly ssh console`。
- 持久資料位於 `/data` 的 volume 上。
- Signal 需要在映像檔中包含 signal-cli（一個以 Java 為基礎的命令列介面）；請使用自訂映像檔，並將記憶體維持在 2GB 以上。

## 成本

使用建議設定（`shared-cpu-2x`、2GB RAM）時，視使用量而定，預期約為每月 $10-15；免費方案涵蓋部分基礎額度。請參閱 [Fly.io pricing](https://fly.io/docs/about/pricing/) 了解目前費率。

## 下一步

- 設定訊息通道：[通道](/zh-TW/channels)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[更新](/zh-TW/install/updating)

## 相關

- [安裝概覽](/zh-TW/install)
- [Hetzner](/zh-TW/install/hetzner)
- [Docker](/zh-TW/install/docker)
- [VPS 託管](/zh-TW/vps)

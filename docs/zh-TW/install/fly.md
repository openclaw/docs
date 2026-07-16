---
read_when:
    - 在 Fly.io 上部署 OpenClaw
    - 設定 Fly 磁碟區、密鑰與首次執行設定
summary: 使用持久性儲存空間與 HTTPS，在 Fly.io 上逐步部署 OpenClaw
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T11:43:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**目標：** 在 [Fly.io](https://fly.io) 機器上執行 OpenClaw 閘道，並具備持久性儲存空間、自動 HTTPS，以及 Discord／頻道存取能力。

## 所需項目

- 已安裝 [flyctl 命令列介面](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 帳號（免費方案即可）
- 模型驗證：所選模型供應商的 API 金鑰
- 頻道認證資訊：Discord 機器人權杖、Telegram 權杖等

## 初學者快速流程

1. 複製儲存庫、自訂 `fly.toml`
2. 建立應用程式與磁碟區，設定祕密
3. 使用 `fly deploy` 部署
4. 透過 SSH 進入並建立設定，或使用控制介面

<Steps>
  <Step title="建立 Fly 應用程式">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 選擇你自己的名稱
    fly apps create my-openclaw

    # 1GB 通常已足夠
    fly volumes create openclaw_data --size 1 --region iad
    ```

    選擇靠近你的區域。常見選項：`lhr`（倫敦）、`iad`（維吉尼亞）、`sjc`（聖荷西）。

  </Step>

  <Step title="設定 fly.toml">
    編輯 `fly.toml`，使其符合你的應用程式名稱與需求。儲存庫追蹤的 `fly.toml` 是下方所示的公開範本；`deploy/fly.private.toml` 則是強化且無公開 IP 的版本（請參閱[私人部署](#private-deployment-hardened)）。

    ```toml
    app = "my-openclaw"  # 你的應用程式名稱
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

    OpenClaw Docker 映像的進入點是 `tini`，預設執行 `node openclaw.mjs gateway`。Fly 的 `[processes]` 會取代 Docker 的 `CMD`（此處直接執行 `node dist/index.js gateway ...`，也就是同一個已編譯的進入點），且不會變更 `ENTRYPOINT`，因此程序仍會在 `tini` 下執行。

    **主要設定：**

    | 設定                           | 原因                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 繫結至 `0.0.0.0`，讓 Fly 的代理伺服器能連線至閘道                     |
    | `--allow-unconfigured`         | 在沒有設定檔的情況下啟動（之後再建立）                        |
    | `internal_port = 3000`         | 必須符合 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`），Fly 健康狀態檢查才能運作 |
    | `memory = "2048mb"`            | 512MB 太小；建議使用 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | 將狀態持久儲存在磁碟區中                                                |

  </Step>

  <Step title="設定祕密">
    ```bash
    # 必要：用於非迴送繫結的閘道驗證權杖
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # 模型供應商 API 金鑰
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # 選用：其他供應商
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # 頻道權杖
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    非迴送繫結（`--bind lan`）需要有效的閘道驗證路徑。此範例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正確設定的非迴送信任代理部署也能符合此要求。SecretRef 合約請參閱[祕密管理](/zh-TW/gateway/secrets)。

    請像保護密碼一樣保護這些權杖。API 金鑰與權杖應優先使用環境變數／`fly secrets`，而非設定檔，讓祕密不會寫入 `openclaw.json`。

  </Step>

  <Step title="部署">
    ```bash
    fly deploy
    ```

    第一次部署會建置 Docker 映像。部署後請驗證：

    ```bash
    fly status
    fly logs
    ```

    HTTP/WebSocket 監聽器啟動後，閘道啟動記錄會輸出 `gateway ready`。Fly 自己的健康狀態檢查會依照 `fly.toml` 監看 `internal_port = 3000`；映像的 Docker `HEALTHCHECK` 指令還會在預設連接埠 18789 輪詢 `/healthz`，但此部署已將閘道覆寫為 `--port 3000`，因此這裡不會使用該檢查。

  </Step>

  <Step title="建立設定檔">
    透過 SSH 進入機器，以建立適當的設定：

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

    使用 `OPENCLAW_STATE_DIR=/data` 時，設定路徑為 `/data/openclaw.json`。

    將 `https://my-openclaw.fly.dev` 替換為你實際的 Fly 應用程式來源。閘道啟動時會根據執行階段的 `--bind` 與 `--port` 值植入本機控制介面來源，讓首次啟動能在設定尚不存在時繼續進行；但透過 Fly 從瀏覽器存取時，仍須在 `gateway.controlUi.allowedOrigins` 中列出完全相符的 HTTPS 來源。

    Discord 權杖可來自下列任一處：

    - 環境變數 `DISCORD_BOT_TOKEN`（建議用於祕密）；不需要將其加入設定，閘道會自動讀取
    - 設定檔 `channels.discord.token`

    重新啟動以套用設定：

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

    或造訪 `https://my-openclaw.fly.dev/`。

    使用已設定的共用祕密進行驗證：來自 `OPENCLAW_GATEWAY_TOKEN` 的閘道權杖；若已改用密碼驗證，則使用你的密碼。

    ### 記錄

    ```bash
    fly logs              # 即時記錄
    fly logs --no-tail    # 最近的記錄
    ```

    ### SSH 主控台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 疑難排解

### “應用程式未在預期位址上監聽”

閘道繫結至 `127.0.0.1`，而不是 `0.0.0.0`。

**修正：** 在 `fly.toml` 的程序命令中加入 `--bind lan`。

### 健康狀態檢查失敗／連線遭拒

Fly 無法透過設定的連接埠連線至閘道。

**修正：** 確認 `internal_port` 與閘道連接埠（`--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）相符。

### OOM／記憶體問題

容器持續重新啟動或遭到終止。徵兆包括：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration` 或無訊息重新啟動。

**修正：** 在 `fly.toml` 中增加記憶體：

```toml
[[vm]]
  memory = "2048mb"
```

或更新現有機器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB 太小。1GB 可能可以運作，但在高負載或詳細記錄模式下可能發生 OOM。建議使用 2GB。

### 閘道鎖定問題

容器重新啟動後，閘道因“已在執行”錯誤而拒絕啟動。

執行階段鎖定檔位於 `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
和 `gateway.state.<hash>.lock`（Linux：
`/tmp/openclaw-<uid>/gateway.*.lock`），而非持久性的 `/data` 磁碟區，因此
完整重新啟動容器通常會連同容器檔案系統的其他內容一起清除這些檔案。
如果鎖定檔仍然存在（例如 `fly machine restart`
保留了容器檔案系統）並阻止啟動，請手動移除：

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### 未讀取設定

`--allow-unconfigured` 只會略過啟動防護，不會建立或修復 `/data/openclaw.json`，因此請確認實際設定存在，且包含 `"gateway": { "mode": "local" }`，以便正常啟動本機閘道。

確認設定存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 透過 SSH 寫入設定

`fly ssh console -C` 不支援 Shell 重新導向。若要寫入設定檔：

```bash
# echo + tee（從本機管線傳送至遠端）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 或使用 sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

如果檔案已存在，`fly sftp` 可能會失敗；請先刪除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 狀態未持久保留

如果重新啟動後遺失驗證設定檔、頻道／供應商狀態或工作階段，表示狀態目錄寫入了容器檔案系統，而非磁碟區。

**修正：** 確認已在 `fly.toml` 中設定 `OPENCLAW_STATE_DIR=/data`，然後重新部署。

## 更新

```bash
git pull
fly deploy
fly status
fly logs
```

此處受監督的更新路徑是 `git pull` + `fly deploy`：它會從 Dockerfile 重新建置映像，因此命令列介面／閘道版本、基礎作業系統映像和任何 Dockerfile 變更都會一併更新。在執行中的容器內執行 `openclaw update` 並不是相同的操作，因為該映像以 Docker 建置的 `dist/` 目錄樹形式提供，沒有可供偵測的 `.git` 簽出內容，也沒有由 npm 管理的全域安裝；如需 VM 類型安裝的更新流程，請參閱[更新](/zh-TW/install/updating)。

### 更新機器命令

若要在不完整重新部署的情況下變更啟動命令：

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 或同時增加記憶體
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

之後執行 `fly deploy` 會將機器命令重設為 `fly.toml` 中的內容；重新部署後請再次套用手動變更。

## 私人部署（強化）

Fly 預設會配置公開 IP，因此你的閘道可透過 `https://your-app.fly.dev` 存取，且可能被網際網路掃描器（Shodan、Censys 等）發現。

使用 `deploy/fly.private.toml` 可進行**無公開 IP** 的強化部署：它省略了 `[http_service]`，因此不會配置公開輸入流量。

### 適合使用私人部署的情況

- 只有對外呼叫／訊息（無傳入網路鉤子）
- 由 ngrok 或 Tailscale 通道處理所有網路鉤子回呼
- 透過 SSH、代理伺服器或 WireGuard 存取閘道，而非瀏覽器
- 部署不應被網際網路掃描器發現

### 設定

```bash
fly deploy -c deploy/fly.private.toml
```

或轉換現有部署：

```bash
# 列出目前的 IP
fly ips list -a my-openclaw

# 釋放公用 IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 切換至私有設定，讓未來的部署不會重新配置公用 IP
fly deploy -c deploy/fly.private.toml

# 配置僅限私有的 IPv6
fly ips allocate-v6 --private -a my-openclaw
```

完成後，`fly ips list` 應該只會顯示一個 `private` 類型的 IP：

```text
版本     IP                   類型             區域
v6       fdaa:x:x:x:x::x      私有             全球
```

### 存取私有部署

**選項 1：本機 Proxy（最簡單）**

```bash
fly proxy 3000:3000 -a my-openclaw
# 在瀏覽器中開啟 http://localhost:3000
```

**選項 2：WireGuard VPN**

```bash
fly wireguard create
# 匯入 WireGuard 用戶端，然後透過內部 IPv6 存取
# 範例：http://[fdaa:x:x:x:x::x]:3000
```

**選項 3：僅使用 SSH**

```bash
fly ssh console -a my-openclaw
```

### 私有部署的網路鉤子

若要在不公開暴露的情況下接收網路鉤子回呼（Twilio、Telnyx 等）：

1. **ngrok 通道**：在容器內執行 ngrok，或將其作為附屬容器執行
2. **Tailscale Funnel**：透過 Tailscale 公開特定路徑
3. **僅限輸出**：部分供應商（Twilio）可在沒有網路鉤子的情況下撥出電話

在 `plugins.entries.voice-call.config` 下使用 ngrok 的語音通話設定範例：

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

ngrok 通道會在容器內執行，並提供公用網路鉤子 URL，而不會暴露 Fly 應用程式本身。將 `webhookSecurity.allowedHosts` 設為通道主機名稱，以接受轉送的主機標頭。

### 安全性取捨

| 面向              | 公開         | 私有       |
| ----------------- | ------------ | ---------- |
| 網際網路掃描器    | 可被發現     | 隱藏       |
| 直接攻擊          | 可能         | 已封鎖     |
| 控制介面存取      | 瀏覽器       | Proxy/VPN  |
| 網路鉤子傳遞      | 直接         | 透過通道   |

## 注意事項

- Fly.io 使用 x86 架構；Dockerfile 同時相容於 x86 和 ARM。
- 若要進行 WhatsApp/Telegram 初始設定，請使用 `fly ssh console`。
- 持久性資料位於 `/data` 的磁碟區中。
- Signal 需要映像檔中包含 signal-cli（以 Java 為基礎的命令列介面）；請使用自訂映像檔，並將記憶體維持在 2GB 以上。

## 費用

使用建議設定（`shared-cpu-2x`、2GB RAM）時，依使用量而定，預計每月約需 $10-15；免費方案涵蓋部分基本額度。目前費率請參閱 [Fly.io 定價](https://fly.io/docs/about/pricing/)。

## 後續步驟

- 設定訊息通道：[通道](/zh-TW/channels)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新狀態：[更新](/zh-TW/install/updating)

## 相關內容

- [安裝概覽](/zh-TW/install)
- [Hetzner](/zh-TW/install/hetzner)
- [Docker](/zh-TW/install/docker)
- [VPS 託管](/zh-TW/vps)

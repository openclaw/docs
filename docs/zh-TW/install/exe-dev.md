---
read_when:
    - 你想要一台便宜且持續運作的 Linux 主機來執行閘道
    - 你想要遠端存取控制介面，又不想自行架設 VPS
summary: 在 exe.dev（VM + HTTPS Proxy）上執行 OpenClaw 閘道以供遠端存取
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T14:37:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**目標：** OpenClaw 閘道在 [exe.dev](https://exe.dev) VM 上執行，並可透過 `https://<vm-name>.exe.xyz` 存取。

本指南假設使用 exe.dev 預設的 **exeuntu** 映像檔。若使用其他發行版，請相應調整套件。

## 你需要準備

- exe.dev 帳號
- 透過 `ssh exe.dev` 存取 exe.dev VM（選用，用於手動設定）

## 初學者快速流程

1. 開啟 [https://exe.new/openclaw](https://exe.new/openclaw)
2. 視需要填入你的驗證金鑰／權杖
3. 按一下 VM 旁的 "Agent"，並等待 Shelley 完成佈建
4. 開啟 `https://<vm-name>.exe.xyz/`，並使用已設定的共用密鑰進行驗證（預設使用權杖驗證；若你切換 `gateway.auth.mode`，也可使用密碼驗證）
5. 使用 `openclaw devices approve <requestId>` 核准待處理的裝置配對要求

## 使用 Shelley 自動安裝

exe.dev 的代理程式 Shelley 可以根據提示安裝 OpenClaw：

```text
在此 VM 上設定 OpenClaw（https://docs.openclaw.ai/install）。執行 OpenClaw 初始設定時，使用非互動模式和接受風險旗標。視需要加入提供的驗證資訊或權杖。設定 nginx，將預設已啟用網站設定的根位置，從預設連接埠 18789 轉送出去，並務必啟用 WebSocket 支援。配對透過 "openclaw devices list" 和 "openclaw devices approve <request id>" 完成。確保儀表板顯示 OpenClaw 的健康狀態為正常。exe.dev 會為我們處理從連接埠 8000 到連接埠 80/443 的轉送以及 HTTPS，因此最終的「可存取」位址應為 <vm-name>.exe.xyz，不需指定連接埠。
```

## 手動安裝

<Steps>
  <Step title="建立 VM">
    從你的裝置執行：

    ```bash
    ssh exe.dev new
    ```

    接著連線：

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    請讓此 VM **保留狀態**。OpenClaw 會將 `openclaw.json`、各代理程式的 `auth-profiles.json`、工作階段，以及頻道／供應商狀態儲存在 `~/.openclaw/` 下，工作區則位於 `~/.openclaw/workspace/`。
    </Tip>

  </Step>

  <Step title="安裝必要套件（在 VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="安裝 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="設定 nginx 代理至連接埠 8000">
    編輯 `/etc/nginx/sites-enabled/default`：

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # WebSocket 支援
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # 標準代理標頭
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 長效連線的逾時設定
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    請覆寫轉送標頭，而非保留用戶端提供的鏈。OpenClaw 只信任來自明確設定之代理伺服器的轉送 IP 中繼資料，且以附加方式建立的 `X-Forwarded-For` 鏈會被視為強化安全性的風險。

  </Step>

  <Step title="存取 OpenClaw 並核准裝置">
    開啟 `https://<vm-name>.exe.xyz/`（請參閱初始設定所輸出的控制介面資訊）。若系統要求驗證，請貼上 VM 中已設定的共用密鑰。

    本指南預設使用權杖驗證，因此請使用 `openclaw config get gateway.auth.token` 取得 `gateway.auth.token`，或使用 `openclaw doctor --n` 產生新的權杖。若你已將閘道切換為密碼驗證，請改用 `gateway.auth.password`／`OPENCLAW_GATEWAY_PASSWORD`。

    使用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 核准裝置。如有疑問，請透過瀏覽器使用 Shelley。

  </Step>
</Steps>

## 遠端頻道設定

對於遠端主機，請優先使用一次 `config patch` 呼叫，而非透過多次 SSH 呼叫執行 `config set`。將實際權杖保存在 VM 環境或 `~/.openclaw/.env` 中，並只在 `openclaw.json` 中放置 SecretRef。完整的 SecretRef 合約請參閱[密鑰管理](/zh-TW/gateway/secrets)。

在 VM 上，讓服務環境包含其所需的密鑰：

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

從本機建立修補檔案，並透過管線將其傳送至 VM：

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

當巢狀允許清單應完全取代為修補值時，請使用 `--replace-path`，例如取代 Discord 頻道允許清單：

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

如需完整的頻道設定參考，請參閱 [Discord](/zh-TW/channels/discord) 和 [Slack](/zh-TW/channels/slack)。

## 遠端存取

exe.dev 會處理遠端存取的驗證。預設情況下，來自連接埠 8000 的 HTTP 流量會轉送至使用電子郵件驗證的 `https://<vm-name>.exe.xyz`。

## 更新

```bash
openclaw update
```

如需切換頻道和手動復原的相關資訊，請參閱[更新](/zh-TW/install/updating)。

## 相關內容

- [遠端閘道](/zh-TW/gateway/remote)
- [安裝概覽](/zh-TW/install)

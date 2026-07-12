---
read_when:
    - 你想要一台便宜且全天候運作的 Linux 主機來執行閘道
    - 您想要遠端存取控制介面，但不想自行架設 VPS
summary: 在 exe.dev（虛擬機器 + HTTPS Proxy）上執行 OpenClaw 閘道以進行遠端存取
title: exe.dev
x-i18n:
    generated_at: "2026-07-11T21:27:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**目標：** 讓 OpenClaw 閘道在 [exe.dev](https://exe.dev) 虛擬機器上執行，並可透過 `https://<vm-name>.exe.xyz` 存取。

本指南假設使用 exe.dev 預設的 **exeuntu** 映像檔。若使用其他發行版，請對應調整套件。

## 所需項目

- exe.dev 帳戶
- 可透過 `ssh exe.dev` 存取 exe.dev 虛擬機器（選用，用於手動設定）

## 初學者快速流程

1. 開啟 [https://exe.new/openclaw](https://exe.new/openclaw)
2. 視需要填入驗證金鑰／權杖
3. 按一下虛擬機器旁的 "Agent"，並等待 Shelley 完成佈建
4. 開啟 `https://<vm-name>.exe.xyz/`，並使用已設定的共用密鑰進行驗證（預設使用權杖驗證；若切換 `gateway.auth.mode`，也可使用密碼驗證）
5. 使用 `openclaw devices approve <requestId>` 核准待處理的裝置配對請求

## 使用 Shelley 自動安裝

exe.dev 的代理程式 Shelley 可以根據提示安裝 OpenClaw：

```text
在此虛擬機器上設定 OpenClaw (https://docs.openclaw.ai/install)。執行 OpenClaw 初始設定時，使用非互動模式與接受風險旗標。視需要加入提供的驗證資訊或權杖。設定 nginx，將預設啟用網站設定的根位置從預設連接埠 18789 轉送，並確保啟用 WebSocket 支援。配對方式為執行 "openclaw devices list" 與 "openclaw devices approve <request id>"。確保儀表板顯示 OpenClaw 的健康狀態正常。exe.dev 會為我們處理從連接埠 8000 到連接埠 80/443 的轉送及 HTTPS，因此最終「可存取」的位址應為 <vm-name>.exe.xyz，無須指定連接埠。
```

## 手動安裝

<Steps>
  <Step title="建立虛擬機器">
    從您的裝置執行：

    ```bash
    ssh exe.dev new
    ```

    然後連線：

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    請將此虛擬機器保持為**有狀態**。OpenClaw 會將 `openclaw.json`、各代理程式的 `auth-profiles.json`、工作階段，以及頻道／供應商狀態儲存在 `~/.openclaw/` 下，並將工作區儲存在 `~/.openclaw/workspace/` 下。
    </Tip>

  </Step>

  <Step title="安裝必要元件（在虛擬機器上）">
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

  <Step title="設定 nginx 反向代理至連接埠 8000">
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

    請覆寫轉送標頭，而非保留用戶端提供的標頭鏈。OpenClaw 只信任來自明確設定之代理伺服器的轉送 IP 中繼資料，且附加式的 `X-Forwarded-For` 標頭鏈會被視為安全強化風險。

  </Step>

  <Step title="存取 OpenClaw 並核准裝置">
    開啟 `https://<vm-name>.exe.xyz/`（請參閱初始設定輸出的控制介面資訊）。若系統提示驗證，請貼上虛擬機器中已設定的共用密鑰。

    本指南預設使用權杖驗證，因此可透過 `openclaw config get gateway.auth.token` 取得 `gateway.auth.token`，或使用 `openclaw doctor --n` 產生新權杖。若已將閘道切換為密碼驗證，請改用 `gateway.auth.password`／`OPENCLAW_GATEWAY_PASSWORD`。

    使用 `openclaw devices list` 與 `openclaw devices approve <requestId>` 核准裝置。如有疑問，請從瀏覽器使用 Shelley。

  </Step>
</Steps>

## 遠端頻道設定

對於遠端主機，建議使用單次 `config patch` 呼叫，而非透過多次 SSH 呼叫執行 `config set`。請將實際權杖保存在虛擬機器環境或 `~/.openclaw/.env` 中，並只在 `openclaw.json` 內放置 SecretRef。完整的 SecretRef 規範請參閱[密鑰管理](/zh-TW/gateway/secrets)。

在虛擬機器上，讓服務環境包含其所需的密鑰：

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

從本機建立修補檔案，並透過管線將其傳送至虛擬機器：

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

當巢狀允許清單應完全取代為修補值時，請使用 `--replace-path`；例如，取代 Discord 頻道允許清單：

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

完整的頻道設定參考資料請參閱 [Discord](/zh-TW/channels/discord) 與 [Slack](/zh-TW/channels/slack)。

## 遠端存取

exe.dev 會處理遠端存取的驗證。預設會使用電子郵件驗證，將來自連接埠 8000 的 HTTP 流量轉送至 `https://<vm-name>.exe.xyz`。

## 更新

```bash
openclaw update
```

關於頻道切換與手動復原，請參閱[更新](/zh-TW/install/updating)。

## 相關內容

- [遠端閘道](/zh-TW/gateway/remote)
- [安裝概覽](/zh-TW/install)

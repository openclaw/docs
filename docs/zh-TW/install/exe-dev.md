---
read_when:
    - 你想要一台便宜、隨時在線的 Linux 主機來執行閘道
    - 你想要遠端存取 Control UI，而不需要執行自己的 VPS
summary: 在 exe.dev 上執行 OpenClaw 閘道（VM + HTTPS proxy）以進行遠端存取
title: exe.dev
x-i18n:
    generated_at: "2026-07-05T11:26:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86227ad592997b1c8af600fa6258f647bcfd16e03a4fe19b159d48d7bfe6c883
    source_path: install/exe-dev.md
    workflow: 16
---

**目標：** OpenClaw 閘道在 [exe.dev](https://exe.dev) VM 上執行，並可透過 `https://<vm-name>.exe.xyz` 存取。

本指南假設使用 exe.dev 的預設 **exeuntu** 映像。在其他發行版上請對應套件名稱。

## 你需要準備

- exe.dev 帳號
- 對 exe.dev VM 的 `ssh exe.dev` 存取權限（選用，用於手動設定）

## 初學者快速路徑

1. 開啟 [https://exe.new/openclaw](https://exe.new/openclaw)
2. 視需要填入你的 auth key/token
3. 按一下 VM 旁的「Agent」，等待 Shelley 完成佈建
4. 開啟 `https://<vm-name>.exe.xyz/`，並使用已設定的共用密鑰驗證（預設為 token auth；如果切換 `gateway.auth.mode`，password auth 也可使用）
5. 使用 `openclaw devices approve <requestId>` 核准待處理的裝置配對請求

## 使用 Shelley 自動安裝

Shelley 是 exe.dev 的 agent，可透過提示安裝 OpenClaw：

```text
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手動安裝

<Steps>
  <Step title="建立 VM">
    從你的裝置：

    ```bash
    ssh exe.dev new
    ```

    然後連線：

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    請讓這台 VM 保持**有狀態**。OpenClaw 會將 `openclaw.json`、每個 agent 的 `auth-profiles.json`、工作階段，以及頻道/provider 狀態儲存在 `~/.openclaw/` 下，並將工作區儲存在 `~/.openclaw/workspace/` 下。
    </Tip>

  </Step>

  <Step title="安裝先決條件（在 VM 上）">
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

  <Step title="設定 nginx 代理到連接埠 8000">
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

            # WebSocket support
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Standard proxy headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeout settings for long-lived connections
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    請覆寫轉送標頭，而不是保留用戶端提供的鏈。OpenClaw 只會信任來自明確設定之代理的轉送 IP metadata，而附加式 `X-Forwarded-For` 鏈會被視為強化風險。

  </Step>

  <Step title="存取 OpenClaw 並核准裝置">
    開啟 `https://<vm-name>.exe.xyz/`（請參閱 onboarding 的 Control UI 輸出）。如果系統提示驗證，請貼上 VM 中已設定的共用密鑰。

    本指南預設使用 token auth，因此請使用 `openclaw config get gateway.auth.token` 取得 `gateway.auth.token`，或使用 `openclaw doctor --n` 產生新的 token。如果你已將閘道切換為 password auth，請改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。

    使用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 核准裝置。不確定時，請從瀏覽器使用 Shelley。

  </Step>
</Steps>

## 遠端頻道設定

對於遠端主機，建議使用一次 `config patch` 呼叫，而不是多次透過 SSH 呼叫 `config set`。請將真實 token 保存在 VM 環境或 `~/.openclaw/.env` 中，並且只在 `openclaw.json` 中放入 SecretRefs。完整 SecretRef contract 請參閱[密鑰管理](/zh-TW/gateway/secrets)。

在 VM 上，讓服務環境包含它需要的密鑰：

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

從你的本機建立 patch 檔案，並將它 pipe 到 VM：

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
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

當巢狀 allowlist 應完全變成 patch 值時，請使用 `--replace-path`，例如取代 Discord 頻道 allowlist：

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

完整頻道 config reference 請參閱 [Discord](/zh-TW/channels/discord) 和 [Slack](/zh-TW/channels/slack)。

## 遠端存取

exe.dev 會處理遠端存取的驗證。預設情況下，來自連接埠 8000 的 HTTP 流量會透過電子郵件驗證轉送到 `https://<vm-name>.exe.xyz`。

## 更新

```bash
openclaw update
```

頻道切換與手動復原請參閱[更新](/zh-TW/install/updating)。

## 相關內容

- [遠端閘道](/zh-TW/gateway/remote)
- [安裝概觀](/zh-TW/install)

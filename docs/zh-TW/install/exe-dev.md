---
read_when:
    - 你想要一台便宜、全天候運作的 Linux 主機來執行 Gateway
    - 你想要在不自行執行 VPS 的情況下遠端存取控制 UI
summary: 在 exe.dev 上執行 OpenClaw Gateway (VM + HTTPS 代理) 以進行遠端存取
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T03:14:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

目標：OpenClaw Gateway 在 exe.dev VM 上執行，並可從你的筆記型電腦透過以下網址存取：`https://<vm-name>.exe.xyz`

本頁假設使用 exe.dev 預設的 **exeuntu** 映像。如果你選擇了不同的發行版，請相應對照套件。

## 初學者快速路徑

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 視需要填入你的驗證金鑰／權杖
3. 點選 VM 旁的「Agent」，並等待 Shelley 完成佈建
4. 開啟 `https://<vm-name>.exe.xyz/`，並使用已設定的共用祕密進行驗證（本指南預設使用權杖驗證，但如果你切換 `gateway.auth.mode`，密碼驗證也可以使用）
5. 使用 `openclaw devices approve <requestId>` 核准任何待處理的裝置配對請求

## 你需要準備

- exe.dev 帳戶
- 對 [exe.dev](https://exe.dev) 虛擬機器的 `ssh exe.dev` 存取權（選用）

## 使用 Shelley 自動安裝

Shelley 是 [exe.dev](https://exe.dev) 的代理，可以用我們的提示詞立即安裝 OpenClaw。使用的提示詞如下：

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 手動安裝

## 1) 建立 VM

從你的裝置執行：

```bash
ssh exe.dev new
```

接著連線：

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
請讓這台 VM 保持**有狀態**。OpenClaw 會將 `openclaw.json`、每個代理的 `auth-profiles.json`、工作階段，以及頻道／提供者狀態儲存在 `~/.openclaw/` 下，並將工作區儲存在 `~/.openclaw/workspace/` 下。
</Tip>

## 2) 安裝先決條件（在 VM 上）

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) 安裝 OpenClaw

執行 OpenClaw 安裝腳本：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) 設定 nginx，將 OpenClaw 代理到連接埠 8000

使用以下內容編輯 `/etc/nginx/sites-enabled/default`：

```
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

請覆寫轉送標頭，而不是保留用戶端提供的鏈。
OpenClaw 只信任來自明確設定代理的轉送 IP 中繼資料，而附加式的 `X-Forwarded-For` 鏈會被視為強化安全性的風險。

## 5) 存取 OpenClaw 並授與權限

存取 `https://<vm-name>.exe.xyz/`（請參閱上線導引輸出的 Control UI）。如果它提示驗證，請貼上 VM 中已設定的共用祕密。本指南使用權杖驗證，因此請使用 `openclaw config get gateway.auth.token` 取得 `gateway.auth.token`（或使用 `openclaw doctor --generate-gateway-token` 產生一個）。
如果你已將 Gateway 改為密碼驗證，請改用 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`。
使用 `openclaw devices list` 和 `openclaw devices approve <requestId>` 核准裝置。有疑問時，請從瀏覽器使用 Shelley！

## 遠端頻道設定

對於遠端主機，建議使用一次 `config patch` 呼叫，而不是多次透過 SSH 呼叫 `config set`。請將真實權杖保存在 VM 環境或 `~/.openclaw/.env` 中，並只在 `openclaw.json` 放入 SecretRefs。

在 VM 上，讓服務環境包含所需祕密：

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

從你的本機建立修補檔，並將它透過管線傳送到 VM：

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

當巢狀允許清單應精確變成修補值時，請使用 `--replace-path`，例如替換 Discord 頻道允許清單時：

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## 遠端存取

遠端存取由 [exe.dev](https://exe.dev) 的驗證處理。預設情況下，來自連接埠 8000 的 HTTP 流量會透過電子郵件驗證轉送到 `https://<vm-name>.exe.xyz`。

## 更新

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

指南：[更新](/zh-TW/install/updating)

## 相關

- [遠端 Gateway](/zh-TW/gateway/remote)
- [安裝概覽](/zh-TW/install)

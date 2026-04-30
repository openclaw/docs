---
read_when:
    - 將 OpenClaw 部署到 Railway
    - 你想要具備瀏覽器式控制介面的一鍵雲端部署
summary: 使用一鍵範本在 Railway 上部署 OpenClaw
title: Railway
x-i18n:
    generated_at: "2026-04-30T03:17:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 16
---

# Railway

使用一鍵範本在 Railway 上部署 OpenClaw，並透過網頁控制 UI 存取。
這是最簡單的「伺服器上無需終端機」路徑：Railway 會為你執行 Gateway。

## 快速檢查清單（新使用者）

1. 按一下下方的 **在 Railway 上部署**。
2. 新增掛載於 `/data` 的 **磁碟區**。
3. 設定必要的 **變數**（至少 `OPENCLAW_GATEWAY_PORT` 和 `OPENCLAW_GATEWAY_TOKEN`）。
4. 在連接埠 `8080` 啟用 **HTTP 代理**。
5. 開啟 `https://<your-railway-domain>/openclaw`，並使用設定的共用密鑰連線。此範本預設使用 `OPENCLAW_GATEWAY_TOKEN`；如果你將其改成密碼驗證，請改用該密碼。

## 一鍵部署

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  在 Railway 上部署
</a>

部署後，請在 **Railway → 你的服務 → 設定 → 網域** 中找到你的公開 URL。

Railway 會：

- 提供一個產生的網域（通常是 `https://<something>.up.railway.app`），或
- 如果你已附加自訂網域，則使用你的自訂網域。

接著開啟：

- `https://<your-railway-domain>/openclaw` — 控制 UI

## 你會得到什麼

- 託管的 OpenClaw Gateway + 控制 UI
- 透過 Railway 磁碟區（`/data`）提供持久化儲存，因此 `openclaw.json`、
  每個代理程式的 `auth-profiles.json`、頻道/提供者狀態、工作階段，以及
  工作區都能在重新部署後保留

## 必要的 Railway 設定

### 公開網路

為服務啟用 **HTTP 代理**。

- 連接埠：`8080`

### 磁碟區（必要）

附加一個掛載於以下位置的磁碟區：

- `/data`

### 變數

在服務上設定這些變數：

- `OPENCLAW_GATEWAY_PORT=8080`（必要 — 必須符合公開網路中的連接埠）
- `OPENCLAW_GATEWAY_TOKEN`（必要；請視為管理員密鑰）
- `OPENCLAW_STATE_DIR=/data/.openclaw`（建議）
- `OPENCLAW_WORKSPACE_DIR=/data/workspace`（建議）

## 連接頻道

使用 `/openclaw` 的控制 UI，或透過 Railway 的 shell 執行 `openclaw onboard` 以取得頻道設定指示：

- [Telegram](/zh-TW/channels/telegram)（最快 — 只需要機器人 token）
- [Discord](/zh-TW/channels/discord)
- [所有頻道](/zh-TW/channels)

## 備份與遷移

匯出你的狀態、設定、驗證設定檔和工作區：

```bash
openclaw backup create
```

這會建立一個可攜式備份封存檔，其中包含 OpenClaw 狀態以及任何已設定的
工作區。詳情請參閱[備份](/zh-TW/cli/backup)。

## 後續步驟

- 設定訊息頻道：[頻道](/zh-TW/channels)
- 設定 Gateway：[Gateway 設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[更新](/zh-TW/install/updating)

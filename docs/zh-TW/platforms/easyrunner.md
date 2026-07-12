---
read_when:
    - 在 EasyRunner 上部署 OpenClaw
    - 在 EasyRunner 的 Caddy Proxy 後方執行閘道
    - 為託管閘道選擇持久性磁碟區與驗證方式
summary: 使用 Podman 和 Caddy 在 EasyRunner 上執行 OpenClaw 閘道
title: EasyRunner
x-i18n:
    generated_at: "2026-07-11T21:29:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner 將 OpenClaw 閘道託管為一個小型容器化應用程式，並置於其
Caddy Proxy 之後。本指南假設 EasyRunner 主機可執行與 Podman 相容的
Compose 應用程式，並透過 Caddy 終止 HTTPS。

## 開始之前

- 一部已將網域路由至該處的 EasyRunner 伺服器。
- 官方 OpenClaw 映像檔（`ghcr.io/openclaw/openclaw`）或您自行建置的映像檔。
- 用於 `/home/node/.openclaw` 的持久性設定磁碟區。
- 用於 `/home/node/.openclaw/workspace` 的持久性工作區磁碟區。
- 高強度的閘道權杖或密碼。

請盡可能保持裝置驗證啟用。若您的反向 Proxy 無法正確傳遞
裝置身分，請先修正受信任 Proxy 設定（請參閱
[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)）；只有在完全私有且由
操作人員控制的網路上，才可使用危險的驗證略過機制。

## Compose 應用程式

使用以下形式的 Compose 檔案建立 EasyRunner 應用程式：

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

請將 `openclaw.example.com` 替換為您的閘道主機名稱。請將
`OPENCLAW_GATEWAY_TOKEN` 儲存在 EasyRunner 的密鑰／環境管理工具中，而不要
將其提交至應用程式定義。映像檔預設繫結至 local loopback，
因此 `command` 中明確指定的 `--bind lan --port 1455` 是讓 Caddy
連線至容器的必要設定。

## 設定 OpenClaw

在持久性設定磁碟區中，確保閘道只能透過
Proxy 存取，並要求進行驗證：

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

若 Caddy 為閘道終止 TLS，請針對確切的 Proxy 路徑設定
受信任 Proxy 設定，而不要全域停用驗證檢查。請參閱
[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

## 驗證

從您的工作站執行：

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

從 EasyRunner 主機存取時，`GET /healthz`（存活狀態）與 `GET /readyz`
（就緒狀態）不需要驗證，並作為映像檔內建容器健康狀態
檢查的依據。此外，請檢查應用程式記錄，確認閘道正在監聽，且啟動時
沒有 SecretRef、外掛或頻道驗證失敗。

## 更新與備份

- 提取或建置新的 OpenClaw 映像檔，然後重新部署 EasyRunner 應用程式。
- 更新前請備份 `openclaw-config` 磁碟區。其中包含
  `openclaw.json`、`agents/<agentId>/agent/auth-profiles.json`，以及已安裝
  外掛套件的狀態。
- 若代理程式會將持久性專案資料寫入 `openclaw-workspace`，請備份該磁碟區。
- 重大更新後請執行 `openclaw doctor`，以找出設定遷移需求與
  服務警告。

## 疑難排解

- `gateway probe` 無法連線：確認 Caddy 主機名稱指向該應用程式，
  且容器正在 `0.0.0.0:1455` 上監聽。
- 驗證失敗：請同時輪替 EasyRunner 密鑰與本機用戶端
  命令中的權杖。
- 還原後檔案由 root 擁有：映像檔以 `node`（uid 1000）身分執行；
  請修正掛載磁碟區的擁有權與權限，讓該使用者可以寫入
  `/home/node/.openclaw` 與 `/home/node/.openclaw/workspace`。
- 瀏覽器或頻道外掛失敗：請檢查容器內是否可使用所需的外部
  二進位檔、對外網路連線及已掛載的憑證。

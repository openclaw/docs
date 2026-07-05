---
read_when:
    - 在 EasyRunner 上部署 OpenClaw
    - 在 EasyRunner 的 Caddy 代理後方執行閘道
    - 為託管閘道選擇持久化磁碟區與驗證方式
summary: 在 EasyRunner 上使用 Podman 和 Caddy 執行 OpenClaw 閘道
title: EasyRunner
x-i18n:
    generated_at: "2026-07-05T11:28:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner 會將 OpenClaw 閘道作為小型容器化應用程式，放在其
Caddy 代理後方代管。本指南假設 EasyRunner 主機可執行與 Podman 相容的
Compose 應用程式，並透過 Caddy 終止 HTTPS。

## 開始之前

- 一台已將網域路由至該主機的 EasyRunner 伺服器。
- 官方 OpenClaw 映像檔 (`ghcr.io/openclaw/openclaw`) 或你自己的建置版本。
- `/home/node/.openclaw` 的持久化設定磁碟區。
- `/home/node/.openclaw/workspace` 的持久化工作區磁碟區。
- 強式閘道權杖或密碼。

盡可能保持裝置驗證啟用。如果你的反向代理無法正確傳遞
裝置身分，請先修正 trusted-proxy 設定（請參閱
[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)）；只有在完全私有、由操作員控制的網路上，才可使用危險的驗證
繞過。

## Compose 應用程式

使用如下結構的 Compose 檔案建立 EasyRunner 應用程式：

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

將 `openclaw.example.com` 替換為你的閘道主機名稱。請將
`OPENCLAW_GATEWAY_TOKEN` 儲存在 EasyRunner 的祕密/環境管理器中，而不是
提交到應用程式定義。映像檔預設會繫結至 loopback，
因此 `command` 中明確指定的 `--bind lan --port 1455` 是 Caddy
連到容器所必需的。

## 設定 OpenClaw

在持久化設定磁碟區內，讓閘道只能透過
代理存取，並要求驗證：

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

如果 Caddy 為閘道終止 TLS，請針對
確切的代理路徑設定 trusted-proxy，而不是全域停用驗證檢查。請參閱
[受信任代理驗證](/zh-TW/gateway/trusted-proxy-auth)。

## 驗證

從你的工作站執行：

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

從 EasyRunner 主機，`GET /healthz`（存活性）和 `GET /readyz`
（就緒性）不需要驗證，並支援映像檔內建的容器健康狀態
檢查。也請檢查應用程式記錄，確認閘道正在監聽，且沒有啟動時
SecretRef、外掛或通道驗證失敗。

## 更新與備份

- 拉取或建置新的 OpenClaw 映像檔，然後重新部署 EasyRunner 應用程式。
- 更新前請備份 `openclaw-config` 磁碟區。它保存
  `openclaw.json`、`agents/<agentId>/agent/auth-profiles.json`，以及已安裝的
  外掛套件狀態。
- 如果代理程式會在 `openclaw-workspace` 寫入持久化專案資料，請備份它。
- 重大更新後執行 `openclaw doctor`，以捕捉設定遷移與
  服務警告。

## 疑難排解

- `gateway probe` 無法連線：確認 Caddy 主機名稱指向該應用程式，
  且容器正在 `0.0.0.0:1455` 上監聽。
- 驗證失敗：同時輪替 EasyRunner 祕密中的權杖與本機用戶端
  命令。
- 還原後檔案由 root 擁有：映像檔以 `node`（uid 1000）執行；
  修復掛載的磁碟區，讓該使用者可以寫入
  `/home/node/.openclaw` 和 `/home/node/.openclaw/workspace`。
- 瀏覽器或通道外掛失敗：檢查所需的外部
  二進位檔、網路輸出，以及掛載的認證是否可在
  容器內使用。

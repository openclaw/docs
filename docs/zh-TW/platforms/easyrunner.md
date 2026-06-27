---
read_when:
    - 在 EasyRunner 上部署 OpenClaw
    - 在 EasyRunner 的 Caddy 代理後方執行閘道
    - 為託管閘道選擇持久性磁碟區與驗證
summary: 使用 Podman 和 Caddy 在 EasyRunner 上執行 OpenClaw 閘道
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T19:31:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner 可以將 OpenClaw 閘道作為小型容器化應用程式託管在其 Caddy Proxy 後方。本指南假設你有一台 EasyRunner 主機，會執行與 Podman 相容的 Compose 應用程式，並透過 Caddy 提供 HTTPS。

## 開始之前

- 一台已將網域路由到它的 EasyRunner 伺服器。
- 已建置或已發布的 OpenClaw 容器映像檔。
- 用於 `/home/node/.openclaw` 的持久化設定磁碟區。
- 用於 `/workspace` 的持久化工作區磁碟區。
- 強式閘道權杖或密碼。

可行時請保持啟用裝置驗證。如果你的反向 Proxy 部署無法正確傳遞裝置身分，請先修正受信任 Proxy 設定；只有在完全私有且由操作人員控制的網路中，才使用危險的驗證繞過。

## Compose 應用程式

使用如下形式的 Compose 檔案建立 EasyRunner 應用程式：

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
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

將 `openclaw.example.com` 替換為你的閘道主機名稱。請將 `OPENCLAW_GATEWAY_TOKEN` 儲存在 EasyRunner 的祕密/環境管理器中，而不是提交到應用程式定義。

## 設定 OpenClaw

在持久化設定磁碟區內，讓閘道只能透過 Proxy 存取，並要求驗證：

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

如果 Caddy 為閘道終止 TLS，請針對確切的 Proxy 路徑設定受信任 Proxy 設定，而不是全域停用驗證檢查。請參閱[受信任 Proxy 驗證](/zh-TW/gateway/trusted-proxy-auth)。

## 驗證

從你的工作站執行：

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

從 EasyRunner 主機檢查應用程式記錄，確認閘道正在監聽，且沒有啟動時的 SecretRef、外掛或通道驗證失敗。

## 更新與備份

- 拉取或建置新的 OpenClaw 映像檔，然後重新部署 EasyRunner 應用程式。
- 更新前先備份 `openclaw-config` 磁碟區。
- 如果代理程式會在 `openclaw-workspace` 寫入持久化專案資料，請備份它。
- 重大更新後執行 `openclaw doctor`，以捕捉設定遷移與服務警告。

## 疑難排解

- `gateway probe` 無法連線：確認 Caddy 主機名稱指向該應用程式，且容器正在 `0.0.0.0:1455` 監聽。
- 驗證失敗：同時輪替 EasyRunner 祕密中的權杖與本機用戶端命令。
- 還原後檔案由 root 擁有：修復掛載的磁碟區，讓容器使用者可以寫入 `/home/node/.openclaw` 和 `/workspace`。
- 瀏覽器或通道外掛失敗：檢查所需的外部二進位檔、網路輸出，以及掛載的憑證是否可在容器內使用。

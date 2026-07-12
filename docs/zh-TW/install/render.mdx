---
read_when:
    - 將 OpenClaw 部署至 Render
    - 你想使用 Render Blueprints 進行宣告式雲端部署
summary: 使用基礎設施即程式碼在 Render 上部署 OpenClaw
title: 渲染
x-i18n:
    generated_at: "2026-07-11T21:26:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

在 [Render](https://render.com) 上使用儲存庫的 `render.yaml` Blueprint 部署 OpenClaw。此檔案集中宣告服務、磁碟與環境變數。

## 先決條件

- 一個 [Render 帳號](https://render.com)（提供免費方案）
- 來自你偏好的[模型供應商](/zh-TW/providers)的 API 金鑰

## 部署

[部署至 Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

這會依據 `render.yaml` 建立 Render 服務、建置 Docker 映像檔並進行部署。你的服務 URL 格式為 `https://<service-name>.onrender.com`。

## Blueprint

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # 自動產生安全權杖
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| 功能                  | 用途                                                        |
| --------------------- | ----------------------------------------------------------- |
| `runtime: docker`     | 使用儲存庫的 Dockerfile 建置                                |
| `healthCheckPath`     | Render 監控 `/health`，並重新啟動狀態異常的執行個體          |
| `generateValue: true` | 自動產生密碼學安全值                                        |
| `disk`                | 可在重新部署後保留資料的持久性儲存空間                      |

## 選擇方案

| 方案      | 縮減至停止狀態     | 磁碟      | 最適合                         |
| --------- | ------------------ | --------- | ------------------------------ |
| 免費      | 閒置 15 分鐘後     | 不提供    | 測試、示範                     |
| 入門      | 永不               | 1GB 以上  | 個人使用、小型團隊             |
| 標準以上  | 永不               | 1GB 以上  | 正式環境、多個頻道             |

Blueprint 預設使用 `starter`。若要使用免費方案，請在分支儲存庫的 `render.yaml` 中將其改為 `plan: free`。請注意，由於沒有持久性磁碟，每次部署都會重設 OpenClaw 狀態。

## 部署後

### 存取控制介面

網頁儀表板位於 `https://<your-service>.onrender.com/`。請使用共用密鑰連線：自動產生的 `OPENCLAW_GATEWAY_TOKEN`（可在 **Dashboard → your service → Environment** 中找到）；若已改用密碼驗證，則使用你的密碼。

### 日誌

**Dashboard → your service → Logs** 會顯示建置日誌（建立 Docker 映像檔）、部署日誌（服務啟動）和執行階段日誌（應用程式輸出）。

### Shell 存取

**Dashboard → your service → Shell** 會開啟 Shell 工作階段。持久性磁碟掛載於 `/data`。

### 環境變數

在 **Dashboard → your service → Environment** 中編輯變數。變更會觸發自動重新部署。

### 自動部署

連線的儲存庫分支有新提交時，Render 會自動重新部署。如果你直接從 `openclaw/openclaw` 部署，而不是從自己的分支儲存庫部署，就沒有推送權限可觸發自動部署；因此，請從 Dashboard 手動執行 Blueprint 同步以進行更新，或將服務指向你自己的分支儲存庫。

## 自訂網域

1. **Dashboard → your service → Settings → Custom Domains**
2. 新增你的網域
3. 依照指示設定 DNS（將 CNAME 指向 `*.onrender.com`）
4. Render 會自動佈建 TLS 憑證

## 擴充規模

- **垂直擴充**：變更方案以取得更多 CPU/RAM。通常已足以供 OpenClaw 使用。
- **水平擴充**：增加執行個體數量（標準方案以上）。由於 OpenClaw 將執行階段狀態保存在本機磁碟，因此需要黏性工作階段或外部狀態管理。

## 備份與遷移

你可以隨時從 Render Dashboard Shell 匯出狀態、設定、驗證設定檔和工作區：

```bash
openclaw backup create
```

這會建立可攜式備份封存檔。請參閱[備份](/zh-TW/cli/backup)。

## 疑難排解

### 服務無法啟動

請檢查 Render Dashboard 中的部署日誌。常見問題：

- 缺少 `OPENCLAW_GATEWAY_TOKEN` — 確認已在 **Dashboard → Environment** 中設定
- 連接埠不符 — 確認 `OPENCLAW_GATEWAY_PORT=8080`，讓閘道繫結至 Render 預期的連接埠

### 冷啟動緩慢（免費方案）

免費方案的服務會在閒置 15 分鐘後縮減至停止狀態；容器啟動時，停止後的第一個請求會需要數秒。升級至入門方案即可讓服務持續運作。

### 重新部署後資料遺失

這會發生在免費方案（沒有持久性磁碟）。請升級至付費方案，或定期從 Render Shell 使用 `openclaw backup create` 匯出備份。

### 健康檢查失敗

如果建置成功但部署失敗，可能是服務啟動時間過長，或無法存取 `/health`。請檢查：

- 建置日誌中是否有錯誤
- 容器是否可在本機使用 `docker build && docker run` 執行

## 後續步驟

- 設定訊息頻道：[頻道](/zh-TW/channels)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新版本：[更新](/zh-TW/install/updating)

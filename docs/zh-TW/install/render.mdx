---
read_when:
    - 將 OpenClaw 部署到 Render
    - 你想要使用 Render Blueprints 進行宣告式雲端部署
summary: 使用基礎架構即程式碼在 Render 上部署 OpenClaw
title: 渲染
x-i18n:
    generated_at: "2026-07-05T11:24:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

使用儲存庫的 `render.yaml` 藍圖在 [Render](https://render.com) 上部署 OpenClaw。它會在單一檔案中宣告服務、磁碟和環境變數。

## 先決條件

- 一個 [Render 帳號](https://render.com)（提供免費方案）
- 來自你偏好的[模型供應商](/zh-TW/providers)的 API 金鑰

## 部署

[部署到 Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

這會從 `render.yaml` 建立 Render 服務、建置 Docker 映像，並進行部署。你的服務 URL 會遵循 `https://<service-name>.onrender.com` 的格式。

## 藍圖

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
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| 功能                  | 用途                                                       |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | 從儲存庫的 Dockerfile 建置                                 |
| `healthCheckPath`     | Render 監控 `/health`，並重新啟動不健康的執行個體          |
| `generateValue: true` | 自動產生密碼學安全的值                                     |
| `disk`                | 重新部署後仍會保留的持久儲存空間                           |

## 選擇方案

| 方案      | 閒置關閉          | 磁碟       | 最適合                       |
| --------- | ----------------- | ---------- | ---------------------------- |
| Free      | 閒置 15 分鐘後    | 不提供     | 測試、示範                   |
| Starter   | 永不              | 1GB+       | 個人使用、小型團隊           |
| Standard+ | 永不              | 1GB+       | 生產環境、多個頻道           |

藍圖預設為 `starter`。若要使用免費層級，請在你分叉的 `render.yaml` 中將其改為 `plan: free`；請注意，如果沒有持久磁碟，OpenClaw 狀態會在每次部署時重設。

## 部署後

### 存取控制 UI

網頁儀表板可在 `https://<your-service>.onrender.com/` 使用。使用共享密鑰連線：自動產生的 `OPENCLAW_GATEWAY_TOKEN`（可在 **儀表板 → 你的服務 → 環境** 中找到），或如果你已切換為密碼驗證，則使用你的密碼。

### 記錄

**儀表板 → 你的服務 → 記錄** 會顯示建置記錄（Docker 映像建立）、部署記錄（服務啟動），以及執行階段記錄（應用程式輸出）。

### Shell 存取

**儀表板 → 你的服務 → Shell** 會開啟 Shell 工作階段。持久磁碟掛載於 `/data`。

### 環境變數

在 **儀表板 → 你的服務 → 環境** 中編輯變數。變更會觸發自動重新部署。

### 自動部署

當連接的儲存庫分支取得新的提交時，Render 會自動重新部署。如果你是直接從 `openclaw/openclaw` 部署，而不是從自己的分叉部署，你沒有推送存取權可觸發該流程，因此請從儀表板執行手動藍圖同步來更新，或將服務指向你自己的分叉。

## 自訂網域

1. **儀表板 → 你的服務 → 設定 → 自訂網域**
2. 新增你的網域
3. 依照指示設定 DNS（將 CNAME 指向 `*.onrender.com`）
4. Render 會自動佈建 TLS 憑證

## 擴展

- **垂直擴展**：變更方案以取得更多 CPU/RAM。通常對 OpenClaw 已經足夠。
- **水平擴展**：增加執行個體數量（Standard 方案及以上）。由於 OpenClaw 會將執行階段狀態保留在本機磁碟上，因此需要黏著工作階段或外部狀態管理。

## 備份與遷移

你可以隨時從 Render 儀表板 Shell 匯出狀態、設定、驗證設定檔和工作區：

```bash
openclaw backup create
```

這會建立可攜式備份封存檔。請參閱[備份](/zh-TW/cli/backup)。

## 疑難排解

### 服務無法啟動

請檢查 Render 儀表板中的部署記錄。常見問題：

- 缺少 `OPENCLAW_GATEWAY_TOKEN`：確認它已在 **儀表板 → 環境** 中設定
- 連接埠不一致：確保 `OPENCLAW_GATEWAY_PORT=8080`，讓閘道繫結到 Render 預期的連接埠

### 冷啟動緩慢（免費層級）

免費層級服務會在閒置 15 分鐘後關閉；關閉後的第一個請求會在容器啟動期間花費幾秒鐘。升級到 Starter 可保持永遠執行。

### 重新部署後資料遺失

這會發生在免費層級（沒有持久磁碟）。請升級到付費方案，或定期從 Render Shell 使用 `openclaw backup create` 匯出備份。

### 健康檢查失敗

如果建置成功但部署失敗，服務可能啟動時間過長，或 `/health` 可能無法連線。請檢查：

- 建置記錄中的錯誤
- 容器是否可使用 `docker build && docker run` 在本機執行

## 後續步驟

- 設定訊息頻道：[頻道](/zh-TW/channels)
- 設定閘道：[閘道設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[更新](/zh-TW/install/updating)

---
read_when:
    - 將 OpenClaw 部署到 Render
    - 你想要透過 Render Blueprints 進行宣告式雲端部署
summary: 使用基礎架構即程式碼在 Render 上部署 OpenClaw
title: 渲染
x-i18n:
    generated_at: "2026-04-30T03:17:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 16
---

# Render

使用基礎架構即程式碼在 Render 上部署 OpenClaw。內含的 `render.yaml` Blueprint 會以宣告式方式定義你的整個堆疊，包括服務、磁碟、環境變數，讓你可以一鍵部署，並將基礎架構與程式碼一起版本化。

## 先決條件

- 一個 [Render 帳戶](https://render.com)（可使用免費方案）
- 來自你偏好的[模型提供者](/zh-TW/providers)的 API 金鑰

## 使用 Render Blueprint 部署

[部署到 Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

點擊此連結會：

1. 從此儲存庫根目錄的 `render.yaml` Blueprint 建立新的 Render 服務。
2. 建置 Docker 映像檔並部署

部署完成後，你的服務 URL 會遵循 `https://<service-name>.onrender.com` 格式。

## 了解 Blueprint

Render Blueprints 是用來定義基礎架構的 YAML 檔案。此儲存庫中的 `render.yaml`
會設定執行 OpenClaw 所需的一切：

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

使用的主要 Blueprint 功能：

| 功能                  | 用途                                                       |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | 從儲存庫的 Dockerfile 建置                                 |
| `healthCheckPath`     | Render 監控 `/health`，並重新啟動不健康的執行個體          |
| `generateValue: true` | 自動產生具備密碼學安全性的值                               |
| `disk`                | 重新部署後仍會保留的持久化儲存空間                         |

## 選擇方案

| 方案      | 休眠               | 磁碟       | 最適合                       |
| --------- | ------------------ | ---------- | ---------------------------- |
| Free      | 閒置 15 分鐘後     | 不可用     | 測試、示範                   |
| Starter   | 永不               | 1GB+       | 個人使用、小型團隊           |
| Standard+ | 永不               | 1GB+       | 生產環境、多個頻道           |

Blueprint 預設為 `starter`。若要使用免費方案，請在你的 fork 的
`render.yaml` 中改成 `plan: free`（但請注意：沒有持久化磁碟表示 OpenClaw 狀態
會在每次部署時重設）。

## 部署後

### 存取 Control UI

網頁儀表板可在 `https://<your-service>.onrender.com/` 使用。

使用已設定的共用密鑰連線。此部署範本會自動產生
`OPENCLAW_GATEWAY_TOKEN`（可在 **Dashboard → 你的服務 →
Environment** 中找到）；如果你改用密碼驗證，請改用該密碼。

## Render Dashboard 功能

### 日誌

在 **Dashboard → 你的服務 → Logs** 檢視即時日誌。可依下列項目篩選：

- 建置日誌（Docker 映像檔建立）
- 部署日誌（服務啟動）
- 執行階段日誌（應用程式輸出）

### Shell 存取

若要除錯，請透過 **Dashboard → 你的服務 → Shell** 開啟 Shell 工作階段。持久化磁碟掛載於 `/data`。

### 環境變數

在 **Dashboard → 你的服務 → Environment** 修改變數。變更會觸發自動重新部署。

### 自動部署

如果你使用原始的 OpenClaw 儲存庫，Render 不會自動部署你的 OpenClaw。若要更新，請從儀表板手動執行 Blueprint 同步。

## 自訂網域

1. 前往 **Dashboard → 你的服務 → Settings → Custom Domains**
2. 新增你的網域
3. 依指示設定 DNS（CNAME 指向 `*.onrender.com`）
4. Render 會自動佈建 TLS 憑證

## 擴展

Render 支援水平與垂直擴展：

- **垂直**：變更方案以取得更多 CPU/RAM
- **水平**：增加執行個體數量（Standard 方案及以上）

對 OpenClaw 而言，垂直擴展通常已足夠。水平擴展需要黏著工作階段或外部狀態管理。

## 備份與遷移

你可以隨時使用 Render Dashboard 中的 Shell 存取權，匯出狀態、設定、驗證設定檔和工作區：

```bash
openclaw backup create
```

這會建立一個可攜式備份封存檔，內含 OpenClaw 狀態以及任何已設定的工作區。
詳情請參閱[備份](/zh-TW/cli/backup)。

## 疑難排解

### 服務無法啟動

請檢查 Render Dashboard 中的部署日誌。常見問題包括：

- 缺少 `OPENCLAW_GATEWAY_TOKEN` — 確認它已在 **Dashboard → Environment** 中設定
- 連接埠不相符 — 確保已設定 `OPENCLAW_GATEWAY_PORT=8080`，讓 Gateway 綁定到 Render 預期的連接埠

### 冷啟動緩慢（免費方案）

免費方案服務會在閒置 15 分鐘後休眠。休眠後的第一個請求需要幾秒鐘等待容器啟動。升級到 Starter 方案即可保持常時啟用。

### 重新部署後資料遺失

這會發生在免費方案（沒有持久化磁碟）。請升級到付費方案，或
定期在 Render Shell 中透過 `openclaw backup create` 匯出完整備份。

### 健康檢查失敗

Render 預期 `/health` 在 30 秒內回傳 200 回應。如果建置成功但部署失敗，服務可能啟動時間過長。請檢查：

- 建置日誌中的錯誤
- 容器是否可透過 `docker build && docker run` 在本機執行

## 後續步驟

- 設定訊息頻道：[頻道](/zh-TW/channels)
- 設定 Gateway：[Gateway 設定](/zh-TW/gateway/configuration)
- 讓 OpenClaw 保持最新：[更新](/zh-TW/install/updating)

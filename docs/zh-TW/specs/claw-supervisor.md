---
read_when:
    - 設計 Codex 叢集監督
    - 建置可讀取、引導或產生 Codex 工作階段的 OpenClaw 工具
    - 為受監督的 Codex 選擇本機、Cloudflare 與 VPS 部署
summary: OpenClaw 控制的 Codex app-server 工作階段艦隊監督計畫。
title: Claw 監督器
x-i18n:
    generated_at: "2026-06-27T20:02:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw 監督器

## 目標

Claw 監督器讓一個常時執行的 OpenClaw 執行個體監控並驅動一組 Codex 工作階段，同時不改變一般 Codex 使用者體驗。使用者可以透過 SSH 進入主機、啟動 Codex、在終端介面中工作，而監督器仍可讀取工作階段、引導它、中斷它、產生相關工作階段，並接受交接。Codex 工作階段也可以透過 MCP 回呼 OpenClaw。

## 產品模型

Codex 仍是主要工作介面。OpenClaw 監督 Codex，而不是把 Codex 隱藏在不透明的 OpenClaw 子代理內。

OpenClaw 外掛名為 `codex-supervisor`。`crabfleet` 仍是 CRAB 機器的部署
與主機群設定檔，而不是可重用的外掛名稱。

此模型有三種角色：

- 人類附加的 Codex：透過共用 app-server 啟動的正常互動式 Codex 終端介面。
- 自主 Codex：由監督器產生、之後人類可附加的 Codex app-server 執行緒。
- Supervisor Claw：常時執行的 OpenClaw 代理，具備群組狀態、逐字稿讀取、引導、中斷、產生與交接工具。

OpenClaw 可以在內部使用其既有子代理機制，但外部合約是可附加的 Codex 工作階段，並具有 Codex 執行緒 ID。

## 架構

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

每台支援 Codex 的主機會執行：

- Codex app-server daemon。
- 一個一律使用 `--remote` 啟動互動式 Codex 的啟動器。
- 一個向監督器註冊 app-server 端點與即時執行緒的連接器。

監督器會執行：

- 端點登錄。
- 工作階段登錄。
- Codex app-server JSON-RPC 用戶端集區。
- 用於 Codex 到 Claw 呼叫的 MCP 伺服器。
- 用於 Claw 到 Codex 控制的 OpenClaw 工具。
- 用於自主動作、核准與迴圈預防的政策引擎。

## Codex App-Server 合約

使用 Codex app-server API 作為標準控制平面：

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

互動式 Codex 必須以 `codex --remote <endpoint>` 啟動，讓終端介面與監督器連線到同一個 app-server。獨立的 `codex exec` 目前不是即時共用工作階段；在 Codex 支援 `exec --remote` 之前，請使用 app-server API 執行自主工作。

## 工作階段登錄

監督器會為每個觀察到的 Codex 執行緒儲存一筆記錄：

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

本機實作可以從 Codex 執行緒中繼資料推導大多數欄位。群組部署應以主機身分、人類附加狀態、git 狀態與 sidecar 健康狀態補充記錄。

## Codex 的 MCP 介面

每個受監督的 Codex 都會取得名為 `openclaw-codex-supervisor` 的 MCP 伺服器。

工具：

- `codex_sessions_list`：列出可見的 Codex 工作階段。
- `codex_session_read`：讀取一份逐字稿。
- `codex_session_send`：傳送訊息到閒置執行緒，或引導作用中執行緒。
- `codex_session_interrupt`：中斷作用中的回合。
- `codex_endpoint_probe`：驗證端點連線能力。
- `claw_report_progress`：將目前任務狀態發布給監督器。
- `claw_ask`：向監督器請求協助或委派。
- `codex_spawn`：建立新的自主 Codex 工作階段。
- `codex_handoff`：請求人類或同儕接管。

資源：

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Claw 控制介面

常時執行的 Claw 取得與內部工具相同的基礎能力：

- 列出工作階段與端點
- 讀取逐字稿
- 傳送／引導文字
- 中斷作用中工作
- 產生新工作階段
- 摘要並指派工作階段
- 向篩選後的群組廣播指示
- 將工作階段標記為受阻、完成或放棄

工具行為：

- 如果目標執行緒閒置，`codex_session_send` 會對應到 `turn/start`。
- 如果目標執行緒作用中，且可見進行中的回合 ID，則會對應到 `turn/steer`。
- 如果無法識別作用中回合，工具會以失敗關閉，而不是建立不相關的回合。
- 暴露給 Codex 的 MCP 寫入控制會保持停用，除非受信任的僅限監督器政策啟用它們。
- 原始逐字稿讀取會保持停用，除非受信任的僅限監督器政策啟用它們。
- 自主核准預設會拒絕工具／檔案核准，除非明確政策另有規定。

## 啟動流程

互動式主機登入：

1. 使用者透過 SSH 進入 CRAB 主機。
2. SSH 服務啟動或驗證 `codex app-server daemon start`。
3. 登入包裝器啟動 `codex --remote unix:// --cd <workspace>`。
4. 主機連接器註冊端點與已載入的執行緒。
5. 監督器發出高優先級群組事件：新的 Codex 工作階段、工作區、人類附加狀態、目前任務預覽。
6. Supervisor Claw 可立即讀取並引導。

自主產生：

1. 監督器選擇主機與工作區。
2. 主機連接器開啟或恢復 Codex app-server 執行緒。
3. 監督器以任務文字與 MCP 設定啟動第一個回合。
4. 工作階段登錄將其標記為自主且可附加。
5. 一旦 Codex 支援該精確 UX，人類之後即可使用 `codex --remote <endpoint> resume <threadId>` 附加，或透過同一 app-server 上目前的恢復流程附加。

## 部署

偏好的控制平面：

- 主機連接器維持到監督器的外送 WebSocket 連線。
- 監督器狀態存放在 OpenClaw 閘道儲存空間。
- Codex app-server 維持在每台主機本機；絕不將未驗證的原始 app-server 暴露到公用網際網路。

Cloudflare 可行性：

- 適合登錄、Durable Objects、WebSocket 匯入、輕量事件路由，以及公用 MCP／閘道端點。
- 單靠它不足以直接控制私人主機，因為 Workers 無法撥接任意私人 Unix socket 或 local loopback app-server。
- 當每台主機連接器都透過外送 WebSocket 回撥時，使用 Cloudflare。

VPS 備援：

- 當需要長期執行程序控制、SSH 通道、私人網路路由或本機檔案系統存取時，使用 Hetzner 服務。
- 保持相同協定：主機連接器外送、監督器登錄集中管理、Codex app-server 留在本機。

## 安全性

- 預設繫結是本機 Unix socket。
- 遠端 app-server 使用權杖或簽章 bearer 驗證。
- 主機連接器以具範圍的主機權杖向監督器驗證。
- 監督器工具強制執行每個工作階段的政策：讀取、引導、中斷、產生、核准。
- 跨代理訊息包含 `originSessionId`；自我回音會被丟棄。
- 廣播需要明確篩選器與有界目標數量。
- 逐字稿讀取會在 OpenClaw 邊界遮蔽祕密。
- 來自監督器的回合，其核准請求預設拒絕，除非政策允許。

## 實作計畫

第 1 階段：本機監督器 MVP

- 新增用於 stdio proxy 與 WebSocket 端點的 Codex app-server JSON-RPC 用戶端。
- 新增監督器端點／工作階段登錄。
- 新增 MCP 工具：列出、讀取、傳送、中斷、探測。
- 新增端點的本機 env 設定。
- 新增假 app-server 測試與一個即時本機 app-server 煙霧測試。

第 2 階段：OpenClaw 整合

- 在 `codex-supervisor` 外掛中註冊監督器工具。
- 將監督器 MCP 注入 Codex 執行緒設定。
- 將工作階段摘要新增到代理上下文。
- 在新的 Codex 執行緒出現時新增事件通知。
- 新增自主傳送／中斷／產生的政策設定。

第 3 階段：群組連接器

- 主機 sidecar 註冊 app-server 端點、主機中繼資料、git／工作區中繼資料，以及人類附加狀態。
- 為 Cloudflare 或 VPS 控制平面新增外送 WebSocket 連接器。
- 新增重新連線、心跳偵測與過期工作階段清理。
- 新增 CRAB SSH 啟動器包裝器。

第 4 階段：自主操作

- 新增產生／恢復／接管流程。
- 新增廣播與委派。
- 新增進度回報與任務狀態摘要。
- 新增迴圈預防與速率限制。
- 新增儀表板檢視。

第 5 階段：多 Claw

- 依群組分片工作階段。
- 為每個工作階段新增領導權／租約。
- 新增稽核記錄與重播。
- 新增 Claw 群組之間的升級。

## 驗收測試

- 人類透過共用 app-server 啟動 Codex 終端介面。
- 監督器透過 `thread/loaded/list` 列出即時執行緒。
- 監督器透過 `thread/read` 讀取逐字稿。
- 監督器透過 `turn/start` 將文字傳送到閒置執行緒。
- 監督器透過 `turn/steer` 引導作用中執行緒。
- 監督器中斷透過 `turn/interrupt` 停止作用中回合。
- Codex 呼叫監督器 MCP 並列出同儕工作階段。
- 自主 Codex 被產生，之後由人類附加。
- 遺失的主機連接器會將工作階段標記為過期，而不刪除歷史記錄。

## 開放問題

- 對於未使用終端介面產生的 app-server 執行緒，Codex 終端介面的精確附加 UX。
- Codex 是否應新增 `exec --remote` 以支援無頭即時共用執行。
- 持久狀態擁有者：OpenClaw 閘道資料庫、Cloudflare Durable Object，或 VPS 資料庫。
- 來自監督器回合的核准政策粒度。
- 應將多少逐字稿摘要注入常時執行的 Claw 上下文，而不是保留為工具／資源。

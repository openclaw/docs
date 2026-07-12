---
read_when:
    - 您正在建置一個與 OpenClaw 通訊的外部應用程式、指令碼、儀表板、CI 工作或 IDE 擴充功能
    - 您正在 Gateway RPC 與外掛 SDK 之間進行選擇
    - 您正在整合閘道的代理執行、工作階段、事件、核准、模型或工具
    - 您正在將託管控制器與外部喚醒排程器配對
sidebarTitle: External apps
summary: 外部應用程式、指令碼、儀表板、CI 作業及 IDE 擴充功能目前的整合途徑
title: 外部應用程式的閘道整合
x-i18n:
    generated_at: "2026-07-11T21:20:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

外部應用程式透過閘道協定與 OpenClaw 通訊：使用 WebSocket 傳輸加上 RPC 方法。當指令碼、儀表板、CI 作業、IDE 擴充功能或其他程序需要啟動代理程式執行、串流事件、等待結果、取消工作或檢查閘道資源時，請使用此協定。

<Warning>
  目前尚未提供公開的 npm 用戶端套件。在版本資訊宣布已有套件發布，且本頁包含安裝說明之前，請勿將 OpenClaw 用戶端套件名稱新增為應用程式相依套件。
</Warning>

<Note>
  本頁適用於 OpenClaw 程序之外的程式碼。在 OpenClaw 內部執行的外掛程式碼應改用已有文件說明的 `openclaw/plugin-sdk/*` 子路徑。
</Note>

## 目前可用的功能

| 介面                                    | 狀態   | 用途                                                                                          |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [閘道協定](/zh-TW/gateway/protocol)           | 可用   | WebSocket 傳輸、連線交握、驗證範圍、協定版本控制及事件。                                      |
| [閘道 RPC 參考](/zh-TW/reference/rpc)         | 可用   | 目前適用於代理程式、工作階段、任務、模型、工具、成品及核准的閘道方法。                         |
| [`openclaw agent`](/zh-TW/cli/agent)          | 可用   | 當透過殼層呼叫命令列介面已足夠時，用於單次指令碼整合。                                        |
| [`openclaw message`](/zh-TW/cli/message)      | 可用   | 從指令碼傳送訊息或頻道動作。                                                                  |

未來的用戶端程式庫套件目前正在內部開發，但尚未成為公開的安裝介面。在版本發布資訊宣布已有公開且具版本控制的套件之前，請將其視為預覽階段的實作細節。

## 建議流程

1. 執行或探索閘道。
2. 透過[閘道協定](/zh-TW/gateway/protocol)連線。
3. 呼叫[閘道 RPC 參考](/zh-TW/reference/rpc)中已有文件說明的 RPC 方法。
4. 鎖定測試時使用的 OpenClaw 版本。
5. 升級 OpenClaw 時，重新查看 RPC 參考。

若要執行代理程式，請先使用 `agent` RPC，並搭配 `agent.wait` 取得最終結果。若需要持久的對話狀態，請使用 `sessions.*` 方法。若要進行使用者介面整合，請訂閱閘道事件，並僅呈現應用程式能理解的事件類別。

## 協作式主機暫停

凍結或建立執行中程序快照的託管控制器，可以使用不限定主機類型的暫停交握：

1. 停止接受由主機控制的外部傳入流量。
2. 使用穩定且唯一的 `requestId` 呼叫 `gateway.suspend.prepare`。
3. 若回應為 `busy`，請讓程序繼續執行，稍後再重試。
4. 若回應為 `ready`，請儲存傳回的 `suspensionId`，然後在 `expiresAtMs` 之前凍結程序或建立其快照。
5. 解凍後，或放棄暫停時，透過現有的 WebSocket 或管理 HTTP 控制路徑，使用該 `suspensionId` 呼叫 `gateway.suspend.resume`。

已準備暫停的閘道會拒絕新的 WebSocket 交握。WebSocket 控制器必須在主機作業期間保持其已驗證連線開啟。若無法保證這一點，請在準備暫停之前啟用並使用[管理 HTTP RPC 外掛](/zh-TW/plugins/admin-http-rpc)。若控制路徑中斷，請等待兩分鐘的租約到期後再重新連線；到期時會自動重新開放連入。

RPC 合約如下：

- `gateway.suspend.prepare` — `operator.admin`；參數
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`；參數
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`；參數
  `{ "suspensionId": "id-from-prepare" }`

識別碼會移除前後空白，必須包含至少一個非空白字元，且長度上限為 128 個字元。忙碌中的準備結果包含 `status: "busy"`、`reason`、`retryAfterMs`、`activeCount` 和 `blockers`。就緒結果的格式如下：

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

狀態查詢會傳回 `{"status":"running"}`，或包含 `expiresAtMs` 的就緒結果。恢復會傳回 `{"ok":true,"status":"running","resumed":true}`；成功恢復後再次呼叫則會傳回 `resumed: false`。

相衝突的要求識別碼或暫時性的排程器恢復失敗，會傳回可重試的 `UNAVAILABLE`，並包含 `retryAfterMs`。排程器恢復期間，準備、狀態與恢復都會傳回此錯誤；閘道會維持未就緒並採取失敗關閉策略，主機不得凍結閘道或建立其快照。OpenClaw 會自動重試排程器，且只會在恢復成功後重新開放連入。不相符的恢復識別碼會傳回 `INVALID_REQUEST`。準備作業與閘道共用每分鐘三次嘗試的控制平面寫入額度；請遵守傳回的重試延遲。WebSocket 用戶端會依裝置與 IP 分組計算額度。管理 HTTP 控制器會依解析出的用戶端 IP 分組，因此位於同一個 Proxy 後方的控制器可能共用額度。

準備作業只會拒絕新工作：OpenClaw 會關閉新的根層級、工作階段與命令連入、暫停自動排程觸發，並同步檢查工作。若有任何工作正在進行，它會先恢復排程器並重新開放連入，再傳回 `busy`；不會中斷或排空該工作。就緒租約會維持兩分鐘。使用相同的 `requestId` 重複呼叫 `prepare` 會續約；租約到期時，會先恢復排程器再重新開放連入。
在就緒租約期間到期而應觸發的重新啟動動作，會等到租約恢復後才執行；若重新啟動正在進行，準備作業會傳回 `busy`。

處於就緒狀態時，`/healthz` 仍維持存活，而 `/readyz` 會傳回 `503`。本機或已驗證的就緒回應會包含 `gateway-draining`；未經驗證的遠端探測只會收到 `{ "ready": false }`。HTTP 健康狀態探測、現有 WebSocket 連線上的暫停方法，以及已啟用的管理 HTTP RPC 路由仍可使用。其他 RPC 會傳回可重試的 `UNAVAILABLE`。內建 HTTP 使用者工作路由與一般外掛 HTTP 路由，包括與 OpenAI 相容的 API、工具／工作階段操作、節點監看及已設定的網路鉤子，都會傳回 `503`，並包含 `error.code: "gateway_unavailable"`。外掛擁有的新 WebSocket 升級也會傳回 `503`；這涵蓋升級的所有權，不涵蓋稍後透過已建立之外掛通訊端執行的工作。

此交握不會持久保存傳入訊息、停止第三方頻道傳輸，或控制託管平台。主機必須在準備前封鎖其傳入流量，且仍須負責喚醒、建立快照／凍結及停止。`activeCount` 是追蹤中工作的總計數，而 `blockers` 則包含非零類別計數及數量受限的任務詳細資料。這不是通用的程序靜止屏障。`background-exec` 阻擋項目僅提供彙總資訊：命令文字、程序識別碼、輸出，以及工作階段或範圍識別碼絕不會跨越此協定傳輸。頻道健康狀態、維護、快取重新整理、已建立的外掛 WebSocket 工作階段，以及未註冊且由外掛擁有的背景工作，仍可能保持活動。
託管平台必須以一致的方式凍結完整的程序樹及其檔案系統，或建立其快照；此初始合約無法證明未註冊的工作已閒置。

<Tip>
  若要進行主機喚醒排程，請將面向 OpenClaw 的部分保留在程序內外掛中，並將具冪等性的完整快照投影至外部主機配接器。託管控制器不應匯入外掛 SDK，或從事件差異重新建構排程狀態。請參閱[安全的外部排程投影](/zh-TW/plugins/hooks#safe-external-cron-projection)。
</Tip>

## 應用程式碼與外掛程式碼

當程式碼位於 OpenClaw 外部時，請使用閘道 RPC：

- 啟動或觀察代理程式執行的節點指令碼
- 呼叫閘道的 CI 作業
- 儀表板與管理面板
- IDE 擴充功能
- 不需要成為頻道外掛的外部橋接器
- 使用模擬或真實閘道傳輸的整合測試

當程式碼在 OpenClaw 內部執行時，請使用外掛 SDK：

- 供應商外掛
- 頻道外掛
- 工具或生命週期鉤子
- 代理程式執行框架外掛
- 受信任的執行階段輔助工具

外部應用程式不應匯入 `openclaw/plugin-sdk/*`；這些子路徑供 OpenClaw 載入的外掛使用。

## 相關內容

- [閘道協定](/zh-TW/gateway/protocol)
- [閘道 RPC 參考](/zh-TW/reference/rpc)
- [命令列介面代理程式命令](/zh-TW/cli/agent)
- [命令列介面訊息命令](/zh-TW/cli/message)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [工作階段](/zh-TW/concepts/session)
- [背景任務](/zh-TW/automation/tasks)
- [ACP 代理程式](/zh-TW/tools/acp-agents)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)

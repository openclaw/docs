---
read_when:
    - 你正在建置一個與 OpenClaw 通訊的外部應用程式、指令碼、儀表板、CI 作業或 IDE 擴充功能
    - 你正在閘道 RPC 與外掛 SDK 之間進行選擇
    - 你正在整合閘道的代理程式執行、工作階段、事件、核准、模型或工具
    - 你正在將託管控制器與外部喚醒排程器配對
sidebarTitle: External apps
summary: 外部應用程式、指令碼、儀表板、CI 工作與 IDE 擴充功能目前的整合路徑
title: 外部應用程式的閘道整合
x-i18n:
    generated_at: "2026-07-12T14:33:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

外部應用程式透過閘道通訊協定與 OpenClaw 通訊：使用 WebSocket
傳輸加上 RPC 方法。當指令碼、儀表板、CI 工作、IDE
擴充功能或其他程序想要啟動代理程式執行、串流事件、等待
結果、取消工作或檢查閘道資源時，請使用此方式。

<Warning>
  目前尚無公開的 npm 用戶端套件。在版本資訊宣布已發布
  套件，且本頁提供安裝指示之前，請勿將 OpenClaw 用戶端套件
  名稱新增為應用程式相依套件。
</Warning>

<Note>
  本頁適用於 OpenClaw 程序外部的程式碼。在 OpenClaw
  內部執行的外掛程式碼應改用已記載的 `openclaw/plugin-sdk/*` 子路徑。
</Note>

## 目前可用項目

| 介面                                    | 狀態   | 適用情境                                                                                       |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [閘道通訊協定](/zh-TW/gateway/protocol)       | 已就緒 | WebSocket 傳輸、連線交握、驗證範圍、通訊協定版本管理與事件。                                   |
| [閘道 RPC 參考資料](/zh-TW/reference/rpc)     | 已就緒 | 目前用於代理程式、工作階段、任務、模型、工具、成品與核准的閘道方法。                            |
| [`openclaw agent`](/zh-TW/cli/agent)          | 已就緒 | 當透過 shell 呼叫命令列介面已足夠時，進行單次指令碼整合。                                      |
| [`openclaw message`](/zh-TW/cli/message)      | 已就緒 | 從指令碼傳送訊息或頻道動作。                                                                  |

未來的用戶端程式庫套件目前正在內部開發，但尚未成為
公開安裝介面。在版本發布內容宣布已發布且具版本管理的套件之前，
請將其視為預覽版實作細節。

## 建議路徑

1. 執行或探索閘道。
2. 透過[閘道通訊協定](/zh-TW/gateway/protocol)連線。
3. 呼叫[閘道 RPC 參考資料](/zh-TW/reference/rpc)中記載的 RPC 方法。
4. 鎖定你測試所用的 OpenClaw 版本。
5. 升級 OpenClaw 時，重新檢查 RPC 參考資料。

對於代理程式執行，請先使用 `agent` RPC，並搭配 `agent.wait` 取得
終止結果。若需要持久化的對話狀態，請使用 `sessions.*` 方法。
若要整合 UI，請訂閱閘道事件，且僅轉譯你的應用程式可理解的事件
系列。

## 協同式主機暫停

凍結或建立執行中程序快照的託管控制器，可以使用
與主機無關的暫停交握：

1. 停止接受由主機控制的外部流入流量。
2. 使用穩定且唯一的 `requestId` 呼叫 `gateway.suspend.prepare`。
3. 如果回應為 `busy`，請讓程序繼續執行，稍後再重試。
4. 如果回應為 `ready`，請儲存傳回的 `suspensionId`，然後在
   `expiresAtMs` 之前凍結程序或建立程序快照。
5. 解凍後，或放棄暫停時，透過現有 WebSocket 或管理 HTTP 控制
   路徑，使用該 `suspensionId` 呼叫 `gateway.suspend.resume`。

已完成準備的閘道會拒絕新的 WebSocket 交握。WebSocket 控制器
必須在主機作業期間保持其已驗證連線開啟。如果無法保證這一點，
請在準備前啟用並使用
[管理 HTTP RPC 外掛](/zh-TW/plugins/admin-http-rpc)。如果控制
路徑中斷，請先等待兩分鐘的租約到期再重新連線；
到期時會自動重新開放連入。

RPC 合約如下：

- `gateway.suspend.prepare` — `operator.admin`；參數
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`；參數
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`；參數
  `{ "suspensionId": "id-from-prepare" }`

ID 會移除首尾空白、必須包含非空白字元，且上限為
128 個字元。忙碌的準備結果包含 `status: "busy"`、`reason`、
`retryAfterMs`、`activeCount` 與 `blockers`。就緒結果的格式如下：

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

狀態會傳回 `{"status":"running"}`，或包含 `expiresAtMs` 的就緒結果。
恢復會傳回 `{"ok":true,"status":"running","resumed":true}`；成功恢復後
再次呼叫會傳回 `resumed: false`。

相互競爭的要求 ID 或暫時性的排程器恢復失敗，會傳回可重試的
`UNAVAILABLE` 與 `retryAfterMs`。在排程器復原期間，準備、狀態
與恢復都會傳回該錯誤，閘道會維持未就緒並採取失敗時關閉策略，
且主機不得凍結閘道或建立其快照。OpenClaw 會自動重試
排程器，且只有在復原成功後才重新開放連入。不相符的恢復 ID
會傳回 `INVALID_REQUEST`。準備作業與閘道共用每分鐘三次嘗試的
控制平面寫入額度；請遵守傳回的重試延遲。WebSocket 用戶端會依
裝置與 IP 分桶。管理 HTTP 控制器會依解析出的用戶端 IP 分桶，
因此位於同一個 Proxy 後方的控制器可能共用額度。

準備作業只會拒絕新工作：OpenClaw 會關閉新的根層級／工作階段／命令
連入、暫停自動排程觸發，並同步檢查工作。如果有任何工作
正在執行，它會先恢復排程器並重新開放連入，再傳回
`busy`；不會中斷或排空該工作。就緒租約會維持兩
分鐘。使用相同的 `requestId` 重複呼叫 `prepare` 會續租；租約到期時
會先恢復排程器，再重新開放連入。
在就緒租約期間到期應發出的重新啟動事件，會等到租約
恢復後才發出；進行中的重新啟動會使準備作業傳回 `busy`。

在就緒期間，`/healthz` 維持可用，而 `/readyz` 會傳回 `503`。本機或
已驗證的就緒回應會包含 `gateway-draining`；未驗證的
遠端探查只會收到 `{ "ready": false }`。HTTP 健康狀態探查、
現有 WebSocket 連線上的暫停方法，以及已啟用的
管理 HTTP RPC 路由仍然可用。其他 RPC 會傳回可重試的
`UNAVAILABLE`。內建 HTTP 使用者工作路由與一般外掛 HTTP 路由，
包括 OpenAI 相容 API、工具／工作階段作業、節點監看與
已設定的鉤子，都會傳回 `503`，並包含 `error.code: "gateway_unavailable"`。新的
外掛自有 WebSocket 升級也會傳回 `503`；這涵蓋升級
擁有權，不包含稍後透過已建立的外掛 Socket 執行的工作。

此交握不會保存傳入訊息、停止第三方頻道
傳輸，或控制託管平台。主機必須在準備前封鎖其流入流量，
並持續負責喚醒、建立快照／凍結與
停止。`activeCount` 是彙總的追蹤工作計數，而 `blockers`
則包含非零類別計數與有界的任務詳細資料。這並非
通用的程序靜止屏障。`background-exec` 阻擋項目僅提供彙總資訊：
命令文字、程序 ID、輸出，以及工作階段或範圍識別碼絕不會
透過通訊協定傳輸。頻道健康狀態、維護、快取重新整理、已建立的
外掛 WebSocket 工作階段，以及未註冊的外掛自有背景工作，都可能
繼續執行。
託管平台必須一致地凍結完整程序樹及其
檔案系統，或建立其快照；此初始合約無法證明未註冊的工作
處於閒置狀態。

<Tip>
  對於主機喚醒排程，請將面向 OpenClaw 的部分保留在程序內
  外掛中，並將具冪等性的完整快照投射至外部主機介接器。
  託管控制器不應匯入外掛 SDK，也不應根據事件差異重建排程
  狀態。請參閱[安全的外部排程
  投射](/zh-TW/plugins/hooks#safe-external-cron-projection)。
</Tip>

## 應用程式碼與外掛程式碼

當程式碼位於 OpenClaw 外部時，請使用閘道 RPC：

- 啟動或觀察代理程式執行的節點指令碼
- 呼叫閘道的 CI 工作
- 儀表板與管理面板
- IDE 擴充功能
- 不需要成為頻道外掛的外部橋接器
- 使用模擬或真實閘道傳輸的整合測試

當程式碼在 OpenClaw 內執行時，請使用外掛 SDK：

- 提供者外掛
- 頻道外掛
- 工具或生命週期鉤子
- 代理程式框架外掛
- 受信任的執行階段輔助程式

外部應用程式不應匯入 `openclaw/plugin-sdk/*`；這些子路徑供
OpenClaw 載入的外掛使用。

## 相關內容

- [閘道通訊協定](/zh-TW/gateway/protocol)
- [閘道 RPC 參考資料](/zh-TW/reference/rpc)
- [命令列介面 agent 命令](/zh-TW/cli/agent)
- [命令列介面 message 命令](/zh-TW/cli/message)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [工作階段](/zh-TW/concepts/session)
- [背景任務](/zh-TW/automation/tasks)
- [ACP 代理程式](/zh-TW/tools/acp-agents)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)

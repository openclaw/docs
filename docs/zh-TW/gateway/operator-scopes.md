---
read_when:
    - 偵錯缺少操作員範圍的錯誤
    - 審查裝置或節點配對核准項目
    - 新增或分類閘道 RPC 方法
summary: 閘道用戶端的操作員角色、範圍與核准時檢查
title: 操作員範圍
x-i18n:
    generated_at: "2026-07-19T13:43:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40053793bb5a80afab28fdfcdcac6565abde6bca988389b03a407272c70043e2
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作員範圍會限制閘道用戶端通過驗證後可執行的操作。
它們是單一受信任閘道操作員網域內的控制平面防護機制，
並非用於隔離具敵意的多租戶。若要在不同人員、團隊或機器之間實現嚴格隔離，
請在不同的作業系統使用者或主機下執行個別的閘道。

相關內容：[安全性](/zh-TW/gateway/security)、[閘道通訊協定](/zh-TW/gateway/protocol)、
[閘道配對](/zh-TW/gateway/pairing)、[裝置命令列介面](/zh-TW/cli/devices)。

## 角色

每個閘道 WebSocket 用戶端都會以其中一種角色連線：

- `operator`：控制平面用戶端，例如命令列介面、控制介面、自動化程序，以及
  受信任的輔助處理程序。
- `node`：透過 `node.invoke` 公開
  命令的功能主機（macOS、iOS、Android、無頭環境）。

操作員 RPC 方法需要 `operator` 角色；源自節點的方法
需要 `node` 角色。

## 範圍層級

| 範圍                   | 含義                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 唯讀狀態、清單、目錄、日誌、工作階段讀取，以及其他不會變更資料的呼叫。                                                                          |
| `operator.write`        | 會變更資料的操作員動作：傳送訊息、叫用工具、更新對話／語音設定、轉送節點命令。同時也滿足 `operator.read`。                |
| `operator.admin`        | 管理存取權。滿足所有 `operator.*` 範圍。變更設定、更新、原生掛鉤、保留命名空間和高風險核准皆需要此範圍。 |
| `operator.pairing`      | 裝置與節點配對管理：列出、核准、拒絕、移除、輪替、撤銷。                                                                            |
| `operator.approvals`    | 執行與外掛核准 API。                                                                                                                                |
| `operator.questions`    | 列出、讀取、回答及解決互動式問題。                                                                                             |
| `operator.talk.secrets` | 讀取包含密鑰的對話設定。                                                                                                             |

未來未知的 `operator.*` 範圍需要完全相符，除非呼叫端
已持有 `operator.admin`。

## 方法範圍只是第一道關卡

每個閘道 RPC 都有一個最小權限的方法範圍，用以決定要求是否能
送達其處理常式。會考量參數的方法會在分派前衍生該範圍，
使授權失敗只產生一種標準的結構化回應：

- `agent` 的一般回合需要 `operator.write`，而
  `/new` 或 `/reset` 工作階段生命週期命令則需要 `operator.admin`。
- `node.invoke` 的一般轉送命令需要 `operator.write`，而
  `browser.proxy`、`fs.listDir` 和 `terminal.upload` 則需要 `operator.admin`。
- `talk.config` 需要 `operator.read`；`includeSecrets: true` 還需要
  `operator.talk.secrets`。

部分處理常式接著會根據實際核准或變更的具體項目，
套用更嚴格的檢查：

- `device.pair.approve` 可透過 `operator.pairing` 存取，但核准
  操作員裝置時，只能核發或保留呼叫端已持有的範圍。
- `node.pair.approve` 可透過 `operator.pairing` 存取，之後會根據
  待處理節點宣告的命令清單衍生額外的核准範圍。
- `chat.send` 是寫入範圍的方法，但 `/config set` 和
  `/config unset` 聊天命令還需要 `operator.admin`，
  無論呼叫端具備何種聊天傳送範圍皆然。

如此可讓較低範圍的操作員執行低風險配對動作，
而不必將所有配對核准都限制為僅限管理員。

工作階段變更 RPC 是依據協商後的操作員範圍進行授權，
不受連線用戶端的 `client.id` 或 `client.mode` 影響。用戶端
身分仍可能影響連線與裝置驗證政策，但不會授予或移除
工作階段變更權限。

## 裝置配對核准

裝置配對記錄是已核准角色與範圍的持久性資料來源。
已配對的裝置不會在未通知的情況下取得更廣泛的存取權：如果重新連線時
要求更廣泛的角色或範圍，便會建立新的待處理升級要求。

核准裝置要求：

- 不含操作員角色的要求不需要操作員範圍核准。
- 非操作員裝置角色（例如 `node`）的要求需要
  `operator.admin`，即使 `device.pair.approve` 本身只需要
  `operator.pairing`。
- 要求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.questions`、`operator.pairing` 或 `operator.talk.secrets` 時，
  呼叫端必須已持有該範圍或 `operator.admin`。
- 要求 `operator.admin` 時需要 `operator.admin`。
- 不含明確範圍的修復要求可以繼承現有操作員
  權杖的範圍；如果該權杖具有管理員範圍，核准仍需要
  `operator.admin`。

非管理員的共用密鑰和受信任 Proxy 工作階段，只能在自身宣告的操作員範圍內
核准操作員裝置要求；即使這些工作階段原本可以使用
`operator.pairing`，核准非操作員角色仍僅限管理員。

對於已配對裝置的權杖工作階段，除非呼叫端具有
`operator.admin`，否則管理僅限自身範圍：非管理員呼叫端只能查看自己的配對項目，
且只能核准、拒絕、輪替、撤銷或移除自己的裝置項目。

## 節點配對核准

舊版 `node.pair.*` 方法使用由閘道擁有的個別節點配對儲存區。
WS 節點則改用裝置配對（`role: node`），但兩者使用相同的核准
詞彙。請參閱[閘道配對](/zh-TW/gateway/pairing)，了解兩個
儲存區之間的關係。

`node.pair.approve` 會根據待處理要求的
命令清單衍生額外的必要範圍：

| 宣告的命令                                                                                                    | 必要範圍                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 無                                                                                                                 | `operator.pairing`                    |
| 一般節點命令                                                                                               | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`fs.listDir` 或 `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

核准節點宣告並不會啟用另有執行階段允許清單
關卡的命令。例如，核准宣告
`computer.act` 的節點需要配對與寫入範圍，但只會記錄此介面。
管理員或擁有者仍必須啟用 `computer.act`。在其保持
啟用期間，透過 `node.invoke` 叫用它需要寫入範圍，但每次動作
不需要管理員範圍。

節點配對會建立身分與信任關係；它不會取代節點自身的
`system.run` 執行核准政策。

## 共用密鑰驗證

共用閘道權杖／密碼驗證會被視為對該閘道的受信任操作員存取。
相容於 OpenAI 的 HTTP 介面、`/tools/invoke` 和 HTTP
工作階段歷程記錄端點，會為共用密鑰的 Bearer 驗證還原完整的預設操作員範圍集合，
即使呼叫端傳送了較窄的宣告範圍也是如此。

帶有身分資訊的模式（例如受信任 Proxy 驗證或私有入口 `none`）
仍可遵循明確宣告的範圍。若要真正分隔信任
邊界，請使用個別的閘道。

---
read_when:
    - 偵錯缺少操作員範圍的錯誤
    - 審查裝置或節點的配對核准
    - 新增或分類閘道 RPC 方法
summary: 閘道用戶端的操作員角色、範圍與核准時檢查
title: 操作員範圍
x-i18n:
    generated_at: "2026-07-11T21:22:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作員範圍會限制閘道用戶端在驗證身分後可以執行的操作。
它們是單一受信任閘道操作員網域內的控制平面防護機制，
並非用於隔離敵對的多租戶環境。若要在不同人員、
團隊或機器之間建立強力隔離，請在不同作業系統使用者或主機下執行個別閘道。

相關內容：[安全性](/zh-TW/gateway/security)、[閘道協定](/zh-TW/gateway/protocol)、
[閘道配對](/zh-TW/gateway/pairing)、[裝置命令列介面](/zh-TW/cli/devices)。

## 角色

每個閘道 WebSocket 用戶端都會以一種角色連線：

- `operator`：控制平面用戶端，例如命令列介面、控制介面、自動化程序，以及
  受信任的輔助程序。
- `node`：透過 `node.invoke` 公開命令的功能主機
  （macOS、iOS、Android、無頭環境）。

操作員 RPC 方法需要 `operator` 角色；由節點發起的方法
需要 `node` 角色。

## 範圍層級

| 範圍                    | 意義                                                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 唯讀的狀態、清單、目錄、日誌、工作階段讀取，以及其他不會變更資料的呼叫。                                                                                 |
| `operator.write`        | 會變更資料的操作員動作：傳送訊息、叫用工具、更新對話／語音設定、轉送節點命令。同時也滿足 `operator.read`。                                                |
| `operator.admin`        | 管理存取權。滿足所有 `operator.*` 範圍。變更設定、更新、原生掛鉤、保留命名空間及高風險核准皆需要此範圍。                                                 |
| `operator.pairing`      | 裝置與節點配對管理：列出、核准、拒絕、移除、輪替、撤銷。                                                                                                 |
| `operator.approvals`    | 執行與外掛核准 API。                                                                                                                                     |
| `operator.talk.secrets` | 讀取包含機密資訊的對話設定。                                                                                                                             |

未來未知的 `operator.*` 範圍需要完全相符，除非呼叫端
已持有 `operator.admin`。

## 方法範圍只是第一道關卡

每個閘道 RPC 都有一個最小權限方法範圍，用於決定請求是否能
進入其處理常式。之後，部分處理常式會根據實際核准或變更的
具體項目套用更嚴格的檢查：

- 持有 `operator.pairing` 即可存取 `device.pair.approve`，但核准
  操作員裝置時，只能核發或保留呼叫端已持有的範圍。
- 持有 `operator.pairing` 即可存取 `node.pair.approve`，之後會從
  待處理節點宣告的命令清單衍生額外的核准範圍。
- `chat.send` 是需要寫入範圍的方法，但 `/config set` 和
  `/config unset` 聊天命令除此之外還需要 `operator.admin`，
  無論呼叫端具備何種聊天傳送範圍皆然。

如此一來，較低範圍的操作員可執行低風險配對動作，
而不必將所有配對核准都限制為僅限管理員。

## 裝置配對核准

裝置配對記錄是已核准角色與範圍的持久性資訊來源。
已配對裝置不會在未通知的情況下取得更廣泛的存取權：若重新連線時
要求更廣泛的角色或範圍，系統會建立新的待處理升級請求。

核准裝置請求時：

- 不包含操作員角色的請求不需要操作員範圍核准。
- 要求非操作員裝置角色（例如 `node`）的請求需要
  `operator.admin`，即使 `device.pair.approve` 本身只需要
  `operator.pairing`。
- 要求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 時，呼叫端必須已
  持有該範圍或 `operator.admin`。
- 要求 `operator.admin` 時需要 `operator.admin`。
- 未明確指定範圍的修復請求可繼承現有操作員
  權杖的範圍；若該權杖具有管理員範圍，核准仍需要
  `operator.admin`。

非管理員的共用機密與受信任代理工作階段，只能在自身宣告的
操作員範圍內核准操作員裝置請求；即使這些工作階段在其他情況下
可使用 `operator.pairing`，核准非操作員角色仍僅限管理員。

對於已配對裝置的權杖工作階段，除非呼叫端具備
`operator.admin`，否則管理操作僅限自身範圍：非管理員呼叫端
只能查看自己的配對項目，且只能核准、拒絕、輪替、撤銷或移除
自己的裝置項目。

## 節點配對核准

舊版 `node.pair.*` 方法使用獨立且由閘道擁有的節點配對儲存區。
WS 節點則改用裝置配對（`role: node`），但兩者適用相同的核准
用語。如需了解兩個儲存區之間的關係，請參閱[閘道配對](/zh-TW/gateway/pairing)。

`node.pair.approve` 會從待處理請求的命令清單衍生
額外的必要範圍：

| 宣告的命令                                            | 必要範圍                              |
| ----------------------------------------------------- | ------------------------------------- |
| 無                                                    | `operator.pairing`                    |
| 非執行類節點命令                                      | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare` 或 `system.which`  | `operator.pairing` + `operator.admin` |

核准節點宣告不會啟用另有執行階段允許清單關卡的命令。
例如，核准宣告 `computer.act` 的節點需要配對與寫入範圍，但只會
記錄此功能介面。管理員或擁有者仍必須啟用 `computer.act`。只要它
維持啟用狀態，透過需要寫入範圍的 `node.invoke` 方法叫用時，
每個動作不需另有管理員範圍。

節點配對會建立身分與信任；它不會取代節點自身的
`system.run` 執行核准原則。

## 共用機密驗證

共用閘道權杖／密碼驗證會被視為該閘道的受信任操作員存取。
OpenAI 相容的 HTTP 介面、`/tools/invoke` 及 HTTP
工作階段歷程記錄端點，會為共用機密的持有人驗證還原完整的預設
操作員範圍集合，即使呼叫端傳送了較窄的宣告範圍亦然。

帶有身分資訊的模式（例如受信任代理驗證或私人入口的 `none`）
仍可遵循明確宣告的範圍。若要真正分隔信任邊界，請使用個別閘道。

---
read_when:
    - 偵錯缺少操作員範圍的錯誤
    - 審核裝置或節點的配對核准要求
    - 新增或分類閘道 RPC 方法
summary: 閘道用戶端的操作者角色、範圍與核准時檢查
title: 操作者範圍
x-i18n:
    generated_at: "2026-07-14T13:40:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作員範圍會限制閘道用戶端在完成驗證後可執行的動作。
它們是單一受信任閘道操作員網域內的控制平面防護機制，
並非用於抵禦惡意多租戶的隔離措施。若要在人員、
團隊或機器之間實施強隔離，請在不同的作業系統使用者帳號或主機下執行個別閘道。

相關內容：[安全性](/zh-TW/gateway/security)、[閘道通訊協定](/zh-TW/gateway/protocol)、
[閘道配對](/zh-TW/gateway/pairing)、[裝置命令列介面](/zh-TW/cli/devices)。

## 角色

每個閘道 WebSocket 用戶端都會以一種角色連線：

- `operator`：控制平面用戶端，例如命令列介面、控制介面、自動化程式及
  受信任的輔助程序。
- `node`：透過 `node.invoke` 公開
  命令的功能主機（macOS、iOS、Android、無頭環境）。

操作員 RPC 方法需要 `operator` 角色；源自節點的方法
需要 `node` 角色。

## 範圍層級

| 範圍                    | 意義                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 唯讀狀態、清單、目錄、日誌、工作階段讀取，以及其他不會異動資料的呼叫。                                                                                        |
| `operator.write`        | 會異動資料的操作員動作：傳送訊息、叫用工具、更新對話／語音設定、轉送節點命令。也滿足 `operator.read`。                                                        |
| `operator.admin`        | 管理存取權。滿足所有 `operator.*` 範圍。異動設定、更新、原生掛鉤、保留命名空間及高風險核准作業皆需要此範圍。                                               |
| `operator.pairing`      | 裝置與節點配對管理：列出、核准、拒絕、移除、輪替、撤銷。                                                                                                      |
| `operator.approvals`    | Exec 與外掛核准 API。                                                                                                                                         |
| `operator.talk.secrets` | 讀取包含祕密資訊的對話設定。                                                                                                                                  |

未知的未來 `operator.*` 範圍必須完全相符，除非呼叫端
已擁有 `operator.admin`。

## 方法範圍只是第一道關卡

每個閘道 RPC 都有一個最低權限方法範圍，用於判斷
要求是否能送達其處理常式。部分處理常式之後還會根據
實際要核准或異動的具體項目套用更嚴格的檢查：

- `device.pair.approve` 可透過 `operator.pairing` 存取，但核准
  操作員裝置時，只能建立或保留呼叫端已擁有的範圍。
- `node.pair.approve` 可透過 `operator.pairing` 存取，之後會從
  待處理節點宣告的命令清單推導額外的核准範圍。
- `chat.send` 是寫入範圍的方法，但 `/config set` 與
  `/config unset` 聊天命令還需要額外具備 `operator.admin`，
  無論呼叫端是否具備聊天傳送範圍。

如此一來，較低範圍的操作員便能執行低風險配對動作，而不必
將所有配對核准都限制為僅限管理員。

## 裝置配對核准

裝置配對記錄是已核准角色與範圍的持久性資料來源。
已配對的裝置不會在未告知的情況下取得更廣泛的存取權：若重新連線時
要求更廣泛的角色或範圍，系統會建立新的待處理升級要求。

核准裝置要求：

- 不含操作員角色的要求不需要操作員範圍核准。
- 要求非操作員裝置角色（例如 `node`）時，
  需要 `operator.admin`，即使 `device.pair.approve` 本身只需要
  `operator.pairing`。
- 要求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 時，呼叫端必須已
  擁有該範圍或 `operator.admin`。
- 要求 `operator.admin` 時，需要 `operator.admin`。
- 未明確指定範圍的修復要求可以繼承現有操作員
  權杖的範圍；如果該權杖具備管理範圍，核准仍需要
  `operator.admin`。

非管理員共用祕密與受信任 Proxy 工作階段只能在自身宣告的
操作員範圍內核准操作員裝置要求；即使這些工作階段可在其他情況下使用
`operator.pairing`，核准非操作員角色仍僅限管理員。

對於已配對裝置的權杖工作階段，除非呼叫端具有
`operator.admin`，否則管理權限僅限自身：非管理員呼叫端只能看到自己的配對項目，
也只能核准、拒絕、輪替、撤銷或移除自己的裝置項目。

## 節點配對核准

舊版 `node.pair.*` 方法使用由閘道擁有的獨立節點配對儲存區。
WS 節點則改用裝置配對（`role: node`），但採用相同的核准
詞彙。請參閱[閘道配對](/zh-TW/gateway/pairing)，瞭解這兩個
儲存區之間的關係。

`node.pair.approve` 會從待處理要求的
命令清單推導額外的必要範圍：

| 宣告的命令                                                                                                           | 必要範圍                              |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 無                                                                                                                   | `operator.pairing`                    |
| 一般節點命令                                                                                                         | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`fs.listDir` 或 `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

核准節點宣告不會啟用另有
執行階段允許清單關卡的命令。例如，核准宣告
`computer.act` 的節點需要配對範圍與寫入範圍，但只會記錄該介面。
管理員或擁有者仍必須啟用 `computer.act`。在其維持
啟用期間，透過寫入範圍的 `node.invoke` 方法叫用它時，
不需要每次動作都具備管理範圍。

節點配對會建立身分與信任；它不會取代節點本身的
`system.run` Exec 核准原則。

## 共用祕密驗證

共用閘道權杖／密碼驗證會被視為該閘道的受信任操作員存取。
與 OpenAI 相容的 HTTP 介面、`/tools/invoke`，以及 HTTP
工作階段歷程記錄端點，都會為共用祕密持有人驗證還原完整的預設操作員範圍集合，
即使呼叫端傳送的宣告範圍較窄也是如此。

具備身分資訊的模式（例如受信任 Proxy 驗證或私人輸入 `none`）
仍可遵循明確宣告的範圍。若要真正分隔信任邊界，請使用個別閘道。

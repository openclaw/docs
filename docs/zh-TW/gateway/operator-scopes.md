---
read_when:
    - 偵錯缺少操作員範圍錯誤
    - 審查裝置或節點配對核准
    - 新增或分類閘道 RPC 方法
summary: 閘道用戶端的操作者角色、範圍與核准時檢查
title: 操作員範圍
x-i18n:
    generated_at: "2026-07-05T11:21:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cfbaf4dc1d8e8cc07bfb10c4e9abf53df34868185f51546f74c12bd785fa380
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作員範圍會限制 Gateway 用戶端在驗證後可以執行的動作。
它們是單一受信任 Gateway 操作員網域內的控制平面防護措施，
不是敵對多租戶隔離。若要在不同人員、團隊或機器之間建立強隔離，
請在不同的 OS 使用者或主機下執行個別 Gateway。

相關：[安全性](/zh-TW/gateway/security)、[Gateway 協定](/zh-TW/gateway/protocol)、
[Gateway 配對](/zh-TW/gateway/pairing)、[裝置命令列介面](/zh-TW/cli/devices)。

## 角色

每個 Gateway WebSocket 用戶端都會以一個角色連線：

- `operator`：控制平面用戶端，例如命令列介面、Control UI、自動化，以及
  受信任的輔助程序。
- `node`：功能主機（macOS、iOS、Android、無介面）會透過
  `node.invoke` 公開命令。

操作員 RPC 方法需要 `operator` 角色；節點發起的方法需要
`node` 角色。

## 範圍層級

| 範圍                    | 意義                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 唯讀狀態、清單、目錄、記錄、工作階段讀取，以及其他非變更呼叫。                                                                                           |
| `operator.write`        | 會變更狀態的操作員動作：傳送訊息、叫用工具、更新通話/語音設定、節點命令轉送。也滿足 `operator.read`。                                                     |
| `operator.admin`        | 管理存取權。滿足所有 `operator.*` 範圍。設定變更、更新、原生掛鉤、保留命名空間，以及高風險核准都需要此範圍。                                             |
| `operator.pairing`      | 裝置和節點配對管理：列出、核准、拒絕、移除、輪替、撤銷。                                                                                                 |
| `operator.approvals`    | 執行和外掛核准 API。                                                                                                                                      |
| `operator.talk.secrets` | 讀取包含密鑰的 Talk 設定。                                                                                                                                |

未知的未來 `operator.*` 範圍需要完全相符，除非呼叫端
已持有 `operator.admin`。

## 方法範圍只是第一道關卡

每個 Gateway RPC 都有一個最小權限方法範圍，用來決定請求是否能
到達其處理常式。部分處理常式接著會根據正在核准或變更的具體項目套用更嚴格的檢查：

- `device.pair.approve` 可透過 `operator.pairing` 存取，但核准
  操作員裝置時，只能簽發或保留呼叫端已持有的範圍。
- `node.pair.approve` 可透過 `operator.pairing` 存取，接著會從待處理節點宣告的命令清單衍生額外
  核准範圍。
- `chat.send` 是寫入範圍方法，但 `/config set` 和
  `/config unset` 聊天命令在此之外還需要 `operator.admin`，
  無論呼叫端的聊天傳送範圍為何。

這讓較低範圍的操作員能執行低風險配對動作，而不必
讓所有配對核准都只能由管理員執行。

## 裝置配對核准

裝置配對記錄是已核准角色和範圍的持久來源。
已配對的裝置不會靜默取得更廣泛的存取權：重新連線時
若要求更廣泛的角色或範圍，會建立新的待處理升級
請求。

核准裝置請求：

- 沒有操作員角色的請求不需要操作員範圍核准。
- 請求非操作員裝置角色（例如 `node`）需要
  `operator.admin`，即使 `device.pair.approve` 本身只需要
  `operator.pairing`。
- 請求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 時，呼叫端必須已
  持有該範圍，或持有 `operator.admin`。
- 請求 `operator.admin` 需要 `operator.admin`。
- 沒有明確範圍的修復請求可以繼承現有操作員
  權杖的範圍；如果該權杖具有管理員範圍，核准仍需要
  `operator.admin`。

非管理員的共享密鑰和受信任代理工作階段只能在其自身宣告的操作員範圍內核准
操作員裝置請求；即使這些工作階段可在其他情況下使用
`operator.pairing`，核准非操作員角色仍僅限管理員。

對於已配對裝置權杖工作階段，除非呼叫端具有 `operator.admin`，
否則管理範圍限於自身：非管理員呼叫端只能看到自己的配對項目，
且只能核准、拒絕、輪替、撤銷或移除自己的裝置項目。

## 節點配對核准

舊版 `node.pair.*` 方法使用另一個 Gateway 擁有的節點配對儲存區。
WS 節點則改用裝置配對（`role: node`），但適用相同的核准
詞彙。請參閱 [Gateway 配對](/zh-TW/gateway/pairing) 了解這兩個
儲存區的關係。

`node.pair.approve` 會從待處理請求的命令清單衍生額外必要範圍：

| 宣告的命令                                            | 必要範圍                              |
| ----------------------------------------------------- | ------------------------------------- |
| 無                                                    | `operator.pairing`                    |
| 非執行節點命令                                      | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare` 或 `system.which` | `operator.pairing` + `operator.admin` |

節點配對會建立身分和信任；它不會取代節點自己的
`system.run` 執行核准政策。

## 共享密鑰驗證

共享 Gateway 權杖/密碼驗證會被視為該 Gateway 的受信任操作員存取權。
OpenAI 相容 HTTP 介面、`/tools/invoke` 和 HTTP
工作階段歷史端點會為共享密鑰 bearer 驗證還原完整的預設操作員範圍集，
即使呼叫端傳送較窄的宣告範圍也是如此。

帶有身分的模式，例如受信任代理驗證或私有入口 `none`，
仍可遵循明確宣告的範圍。若要真正分離信任邊界，請使用個別 Gateway。

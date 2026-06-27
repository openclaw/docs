---
read_when:
    - 偵錯缺少操作員作用域的錯誤
    - 審核裝置或節點配對核准
    - 新增或分類閘道 RPC 方法
summary: 適用於閘道用戶端的操作員角色、範圍與核准時檢查
title: 操作員範圍
x-i18n:
    generated_at: "2026-06-27T19:20:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作員範圍定義 Gateway 用戶端在驗證後可以執行的操作。
它們是一個受信任 Gateway 操作員網域內的控制平面防護欄，
不是敵對多租戶隔離。如果你需要在人員、團隊或機器之間建立強隔離，
請在不同的 OS 使用者或主機下執行個別 Gateway。

相關：[安全性](/zh-TW/gateway/security)、[Gateway 協定](/zh-TW/gateway/protocol)、
[Gateway 配對](/zh-TW/gateway/pairing)、[裝置命令列介面](/zh-TW/cli/devices)。

## 角色

Gateway WebSocket 用戶端會以一種角色連線：

- `operator`：控制平面用戶端，例如命令列介面、Control UI、自動化，以及
  受信任的輔助程序。
- `node`：能力主機，例如 macOS、iOS、Android，或透過
  `node.invoke` 暴露命令的無頭節點。

操作員 RPC 方法需要 `operator` 角色。節點發起的方法
需要 `node` 角色。

## 範圍層級

| 範圍                    | 意義                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 唯讀狀態、清單、目錄、記錄、工作階段讀取，以及其他不會變更狀態的控制平面呼叫。                                                                                                      |
| `operator.write`        | 一般會變更狀態的操作員動作，例如傳送訊息、叫用工具、更新對話/語音設定，以及節點命令轉送。也滿足 `operator.read`。                                                                   |
| `operator.admin`        | 管理性控制平面存取。滿足所有 `operator.*` 範圍。設定變更、更新、原生鉤子、敏感保留命名空間，以及高風險核准都需要此範圍。                                                           |
| `operator.pairing`      | 裝置與節點配對管理，包括列出、核准、拒絕、移除、輪替，以及撤銷配對記錄或裝置權杖。                                                                                                  |
| `operator.approvals`    | Exec 與外掛核准 API。                                                                                                                                                                |
| `operator.talk.secrets` | 讀取 Talk 設定，並包含機密。                                                                                                                                                         |

未知的未來 `operator.*` 範圍需要精確相符，除非呼叫端具有
`operator.admin`。

## 方法範圍只是第一道關卡

每個 Gateway RPC 都有一個最小權限的方法範圍。該方法範圍會決定
請求是否能到達處理常式。接著，某些處理常式會根據正在核准或變更的具體項目，
套用更嚴格的核准時檢查。

範例：

- `device.pair.approve` 可透過 `operator.pairing` 存取，但核准
  操作員裝置只能簽發或保留呼叫端已持有的範圍。
- `node.pair.approve` 可透過 `operator.pairing` 存取，接著會從待處理的
  節點命令清單衍生額外核准範圍。
- `chat.send` 通常是寫入範圍方法，但持久性 `/config set`
  和 `/config unset` 在命令層級需要 `operator.admin`。

這讓較低範圍的操作員能執行低風險配對動作，而不必讓
所有配對核准都只能由管理員執行。

## 裝置配對核准

裝置配對記錄是已核准角色與範圍的持久來源。
已配對的裝置不會默默取得更廣的存取權：重新連線若要求
更廣的角色或更廣的範圍，會建立新的待處理升級請求。

核准裝置請求時：

- 沒有操作員角色的請求不需要操作員權杖範圍核准。
- 要求非操作員裝置角色的請求，例如 `node`，需要
  `operator.admin`，即使 `device.pair.approve` 可透過
  `operator.pairing` 存取也是如此。
- 要求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 的請求，需要呼叫端持有
  這些範圍，或持有 `operator.admin`。
- 要求 `operator.admin` 的請求需要 `operator.admin`。
- 沒有明確範圍的修復請求可以繼承現有操作員權杖範圍。
  如果該現有權杖具有管理員範圍，核准仍需要
  `operator.admin`。

非管理員的共享機密與受信任代理工作階段，只能在其自身宣告的操作員範圍內
核准操作員裝置請求。即使這些工作階段原本可以使用
`operator.pairing`，核准非操作員角色仍然僅限管理員。

對於已配對裝置權杖工作階段，管理也會限於自身範圍，除非
呼叫端具有 `operator.admin`：非管理員呼叫端只會看到自己的配對
項目，只能核准或拒絕自己的待處理請求，也只能輪替、
撤銷或移除自己的裝置項目。

## 節點配對核准

舊版 `node.pair.*` 使用獨立的 Gateway 擁有節點配對儲存。WS 節點
使用帶有 `role: node` 的裝置配對，但同樣的核准層級詞彙
也適用。

`node.pair.approve` 會使用待處理請求命令清單來衍生額外的
必要範圍：

- 無命令請求：`operator.pairing`
- 非 exec 節點命令：`operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare` 或 `system.which`：
  `operator.pairing` + `operator.admin`

節點配對會建立身分與信任。它不會取代節點自身的
`system.run` exec 核准政策。

## 共享機密驗證

共享 Gateway 權杖/密碼驗證會被視為該 Gateway 的受信任操作員存取。
OpenAI 相容的 HTTP 介面、`/tools/invoke`，以及 HTTP 工作階段
歷史端點，會為共享機密 bearer 驗證還原一般完整操作員預設範圍集合，
即使呼叫端傳送較窄的宣告範圍也是如此。

帶有身分的模式，例如受信任代理驗證或 private-ingress `none`，
仍可遵循明確宣告的範圍。請使用個別 Gateway 來實現真正的信任
邊界隔離。

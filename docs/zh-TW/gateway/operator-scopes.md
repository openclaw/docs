---
read_when:
    - 偵錯缺少操作者範圍的錯誤
    - 檢視裝置或 Node 配對核准
    - 新增或分類 Gateway RPC 方法
summary: Gateway 用戶端的操作者角色、範圍與批准時檢查
title: 操作員範圍
x-i18n:
    generated_at: "2026-05-03T02:44:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator 範圍定義 Gateway 用戶端在完成驗證後可以執行的操作。
它們是在單一可信任 Gateway 操作者網域內的控制平面防護機制，
不是敵對多租戶隔離。如果你需要在人員、團隊或機器之間建立強隔離，
請在不同 OS 使用者或主機下執行獨立的 Gateways。

相關：[安全性](/zh-TW/gateway/security)、[Gateway 通訊協定](/zh-TW/gateway/protocol)、
[Gateway 配對](/zh-TW/gateway/pairing)、[裝置 CLI](/zh-TW/cli/devices)。

## 角色

Gateway WebSocket 用戶端會以一種角色連線：

- `operator`：控制平面用戶端，例如 CLI、Control UI、自動化，以及
  可信任的輔助程序。
- `node`：能力主機，例如 macOS、iOS、Android，或透過 `node.invoke`
  暴露命令的無頭節點。

Operator RPC 方法需要 `operator` 角色。Node 發起的方法
需要 `node` 角色。

## 範圍層級

| 範圍                    | 意義                                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 唯讀狀態、清單、目錄、記錄、工作階段讀取，以及其他不會變更狀態的控制平面呼叫。                                                                                                   |
| `operator.write`        | 一般會變更狀態的操作者動作，例如傳送訊息、呼叫工具、更新 talk/voice 設定，以及 Node 命令轉送。也滿足 `operator.read`。                                                           |
| `operator.admin`        | 管理性的控制平面存取。滿足每個 `operator.*` 範圍。設定變更、更新、原生 hooks、敏感保留命名空間，以及高風險核准都需要此範圍。                                                    |
| `operator.pairing`      | 裝置和 Node 配對管理，包括列出、核准、拒絕、移除、輪替與撤銷配對記錄或裝置權杖。                                                                                                 |
| `operator.approvals`    | Exec 和 Plugin 核准 API。                                                                                                                                                         |
| `operator.talk.secrets` | 讀取包含密鑰的 Talk 設定。                                                                                                                                                        |

未知的未來 `operator.*` 範圍需要完全相符，除非呼叫者具有
`operator.admin`。

## 方法範圍只是第一道關卡

每個 Gateway RPC 都有最小權限的方法範圍。該方法範圍會決定
請求是否可以到達處理常式。某些處理常式接著會根據實際要核准或變更的具體項目，
套用更嚴格的核准時檢查。

範例：

- `device.pair.approve` 可透過 `operator.pairing` 存取，但核准
  操作者裝置只能發行或保留呼叫者已持有的範圍。
- `node.pair.approve` 可透過 `operator.pairing` 存取，然後會從待處理的
  Node 命令清單推導額外核准範圍。
- `chat.send` 通常是寫入範圍的方法，但持久性的 `/config set`
  和 `/config unset` 需要命令層級的 `operator.admin`。

這讓較低範圍的操作者可以執行低風險配對動作，而不必讓
所有配對核准都僅限管理員。

## 裝置配對核准

裝置配對記錄是已核准角色與範圍的持久來源。
已配對的裝置不會悄悄取得更廣的存取權：重新連線時若要求
更廣的角色或更廣的範圍，會建立新的待處理升級請求。

核准裝置請求時：

- 沒有操作者角色的請求不需要操作者權杖範圍核准。
- 對 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 的請求，需要呼叫者持有
  這些範圍或 `operator.admin`。
- 對 `operator.admin` 的請求需要 `operator.admin`。
- 沒有明確範圍的修復請求可以繼承現有的操作者權杖範圍。
  如果該現有權杖是管理員範圍，核准仍需要 `operator.admin`。

對於已配對裝置權杖工作階段，管理預設限於自身範圍，除非呼叫者
也具有 `operator.admin`：非管理員呼叫者只能輪替、撤銷或移除
自己的裝置項目。

## Node 配對核准

舊版 `node.pair.*` 使用另一個由 Gateway 擁有的 Node 配對儲存區。WS Node
會使用具有 `role: node` 的裝置配對，但相同的核准層級詞彙
仍然適用。

`node.pair.approve` 會使用待處理請求的命令清單推導額外的
必要範圍：

- 無命令請求：`operator.pairing`
- 非 exec Node 命令：`operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare` 或 `system.which`：
  `operator.pairing` + `operator.admin`

Node 配對會建立身分與信任。它不會取代 Node 自身的
`system.run` exec 核准政策。

## 共用密鑰驗證

共用 Gateway 權杖/密碼驗證會被視為該 Gateway 的可信任操作者存取。
OpenAI 相容的 HTTP 介面和 `/tools/invoke` 會為共用密鑰 bearer 驗證
還原一般完整操作者預設範圍集，即使呼叫者送出較窄的宣告範圍也是如此。

帶有身分的模式，例如可信任 Proxy 驗證或私有入口 `none`，
仍可遵循明確宣告的範圍。請使用獨立的 Gateways 來進行真正的信任邊界隔離。

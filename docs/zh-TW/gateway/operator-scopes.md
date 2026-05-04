---
read_when:
    - 除錯缺少操作員範圍的錯誤
    - 檢視裝置或 Node 配對核准
    - 新增或分類 Gateway RPC 方法
summary: Gateway 用戶端的操作者角色、範圍與核准時檢查
title: 操作員範圍
x-i18n:
    generated_at: "2026-05-04T02:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Operator 範圍定義 Gateway 用戶端在驗證後可以執行的操作。
它們是一個受信任 Gateway operator 網域內的控制平面防護機制，
不是敵意多租戶隔離。如果你需要在人員、團隊或機器之間建立強隔離，
請在不同的 OS 使用者或主機下執行獨立的 Gateway。

相關：[安全性](/zh-TW/gateway/security)、[Gateway 協定](/zh-TW/gateway/protocol)、
[Gateway 配對](/zh-TW/gateway/pairing)、[裝置 CLI](/zh-TW/cli/devices)。

## 角色

Gateway WebSocket 用戶端會以一種角色連線：

- `operator`：控制平面用戶端，例如 CLI、Control UI、自動化，以及
  受信任的輔助程序。
- `node`：功能主機，例如 macOS、iOS、Android，或透過 `node.invoke`
  公開命令的 headless 節點。

Operator RPC 方法需要 `operator` 角色。源自 Node 的方法需要
`node` 角色。

## 範圍層級

| 範圍                    | 含義                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 唯讀狀態、清單、目錄、記錄、工作階段讀取，以及其他不會變更狀態的控制平面呼叫。                                                                                                      |
| `operator.write`        | 一般會變更狀態的 operator 動作，例如傳送訊息、叫用工具、更新對話/語音設定，以及 Node 命令轉送。也滿足 `operator.read`。                                                              |
| `operator.admin`        | 管理性控制平面存取。滿足每個 `operator.*` 範圍。設定變更、更新、原生 hook、敏感保留命名空間，以及高風險核准都需要此範圍。                                                           |
| `operator.pairing`      | 裝置與 Node 配對管理，包括列出、核准、拒絕、移除、輪替，以及撤銷配對記錄或裝置權杖。                                                                                                 |
| `operator.approvals`    | Exec 與 Plugin 核准 API。                                                                                                                                                            |
| `operator.talk.secrets` | 讀取包含密鑰的 Talk 設定。                                                                                                                                                           |

未知的未來 `operator.*` 範圍需要精確符合，除非呼叫端具有
`operator.admin`。

## 方法範圍只是第一道門檻

每個 Gateway RPC 都有一個最低權限的方法範圍。該方法範圍會決定
請求是否可以到達處理常式。部分處理常式接著會根據實際被核准或變更的項目，
套用更嚴格的核准時檢查。

範例：

- `device.pair.approve` 可透過 `operator.pairing` 到達，但核准
  operator 裝置時，只能鑄造或保留呼叫端已持有的範圍。
- `node.pair.approve` 可透過 `operator.pairing` 到達，接著會從待處理的
  Node 命令清單衍生額外的核准範圍。
- `chat.send` 通常是寫入範圍的方法，但持久性的 `/config set`
  與 `/config unset` 在命令層級需要 `operator.admin`。

這讓較低範圍的 operator 可以執行低風險配對動作，而不必讓所有配對核准都僅限 admin。

## 裝置配對核准

裝置配對記錄是已核准角色與範圍的持久來源。
已配對的裝置不會默默取得更廣的存取權：如果重新連線時要求更廣的角色或更廣的範圍，
就會建立新的待處理升級請求。

核准裝置請求時：

- 沒有 operator 角色的請求不需要 operator 權杖範圍核准。
- 要求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 的請求，需要呼叫端持有
  這些範圍或 `operator.admin`。
- 要求 `operator.admin` 的請求需要 `operator.admin`。
- 沒有明確範圍的修復請求可以繼承現有 operator 權杖範圍。如果該現有權杖具有 admin 範圍，
  核准仍然需要 `operator.admin`。

對於已配對裝置的權杖工作階段，管理是自我範圍限定的，除非呼叫端也具有
`operator.admin`：非 admin 呼叫端只會看到自己的配對項目，只能核准或拒絕自己的待處理請求，
且只能輪替、撤銷或移除自己的裝置項目。

## Node 配對核准

舊版 `node.pair.*` 使用由 Gateway 擁有的獨立 Node 配對儲存區。WS Node
使用帶有 `role: node` 的裝置配對，但同一組核准層級詞彙仍然適用。

`node.pair.approve` 會使用待處理請求的命令清單來衍生額外的必要範圍：

- 無命令請求：`operator.pairing`
- 非 exec Node 命令：`operator.pairing` + `operator.write`
- `system.run`、`system.run.prepare` 或 `system.which`：
  `operator.pairing` + `operator.admin`

Node 配對會建立身分與信任。它不會取代 Node 自身的
`system.run` exec 核准政策。

## 共享密鑰驗證

共享 Gateway 權杖/密碼驗證會被視為該 Gateway 的受信任 operator 存取。
OpenAI 相容 HTTP 介面與 `/tools/invoke` 會為共享密鑰 bearer 驗證還原一般完整的
operator 預設範圍集合，即使呼叫端傳送較窄的已宣告範圍也是如此。

帶有身分的模式，例如受信任 Proxy 驗證或私有入口 `none`，
仍可遵守明確宣告的範圍。請使用獨立的 Gateway 來實現真正的信任邊界隔離。

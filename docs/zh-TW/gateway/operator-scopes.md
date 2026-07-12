---
read_when:
    - 偵錯缺少操作員範圍的錯誤
    - 檢視裝置或節點配對核准項目
    - 新增或分類閘道 RPC 方法
summary: 閘道用戶端的操作者角色、範圍與核准時檢查
title: 操作員範圍
x-i18n:
    generated_at: "2026-07-12T14:32:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

操作員範圍會限制閘道用戶端在完成驗證後可以執行的操作。
它們是單一受信任閘道操作員網域內的控制平面防護機制，
並非用於抵禦惡意多租戶的隔離機制。若需要在人員、
團隊或機器之間進行強隔離，請在不同的作業系統使用者或主機下執行個別的閘道。

相關內容：[安全性](/zh-TW/gateway/security)、[閘道通訊協定](/zh-TW/gateway/protocol)、
[閘道配對](/zh-TW/gateway/pairing)、[裝置命令列介面](/zh-TW/cli/devices)。

## 角色

每個閘道 WebSocket 用戶端都會使用一種角色連線：

- `operator`：控制平面用戶端，例如命令列介面、控制介面、自動化作業，以及
  受信任的輔助程序。
- `node`：透過 `node.invoke` 公開命令的能力主機
  （macOS、iOS、Android、無介面環境）。

操作員 RPC 方法需要 `operator` 角色；由節點發起的方法
需要 `node` 角色。

## 範圍層級

| 範圍                    | 意義                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | 唯讀狀態、清單、目錄、記錄、工作階段讀取，以及其他不會變更狀態的呼叫。                                                                                           |
| `operator.write`        | 會變更狀態的操作員動作：傳送訊息、叫用工具、更新通話／語音設定、轉送節點命令。同時滿足 `operator.read`。                                                         |
| `operator.admin`        | 管理存取權。滿足所有 `operator.*` 範圍。變更設定、更新、原生掛鉤、保留命名空間及高風險核准皆需要此範圍。                                                        |
| `operator.pairing`      | 裝置與節點配對管理：列出、核准、拒絕、移除、輪替、撤銷。                                                                                                         |
| `operator.approvals`    | 執行與外掛核准 API。                                                                                                                                              |
| `operator.talk.secrets` | 讀取包含秘密資訊的通話設定。                                                                                                                                     |

未知的未來 `operator.*` 範圍需要完全相符，除非呼叫端
已持有 `operator.admin`。

## 方法範圍只是第一道關卡

每個閘道 RPC 都有一個遵循最小權限原則的方法範圍，用來決定
要求是否能送達其處理常式。部分處理常式之後會根據
實際要核准或變更的項目套用更嚴格的檢查：

- 持有 `operator.pairing` 即可存取 `device.pair.approve`，但核准
  操作員裝置時，只能建立或保留呼叫端已持有的範圍。
- 持有 `operator.pairing` 即可存取 `node.pair.approve`，之後會根據
  待處理節點宣告的命令清單推導額外的核准範圍。
- `chat.send` 是需要寫入範圍的方法，但 `/config set` 和
  `/config unset` 聊天命令還需要 `operator.admin`，
  無論呼叫端的聊天傳送範圍為何。

如此一來，較低範圍的操作員就能執行低風險的配對動作，
而不必將所有配對核准都限制為僅限管理員。

## 裝置配對核准

裝置配對記錄是已核准角色與範圍的持久性資料來源。
已配對的裝置不會在未告知的情況下取得更廣泛的存取權：重新連線時
若要求更廣泛的角色或範圍，會建立新的待處理升級要求。

核准裝置要求：

- 不包含操作員角色的要求不需要操作員範圍核准。
- 要求非操作員裝置角色（例如 `node`）時需要
  `operator.admin`，即使 `device.pair.approve` 本身只需要
  `operator.pairing`。
- 要求 `operator.read`、`operator.write`、`operator.approvals`、
  `operator.pairing` 或 `operator.talk.secrets` 時，呼叫端必須已經
  持有該範圍或 `operator.admin`。
- 要求 `operator.admin` 時需要 `operator.admin`。
- 未明確指定範圍的修復要求可以繼承現有操作員
  權杖的範圍；若該權杖具有管理員範圍，核准時仍需要
  `operator.admin`。

非管理員的共用秘密資訊和受信任 Proxy 工作階段，只能在其本身宣告的
操作員範圍內核准操作員裝置要求；即使這些工作階段可以使用
`operator.pairing` 執行其他操作，核准非操作員角色仍僅限管理員。

對於已配對裝置的權杖工作階段，除非呼叫端具有
`operator.admin`，否則管理範圍僅限自身：非管理員呼叫端只能查看自己的配對項目，
並且只能核准、拒絕、輪替、撤銷或移除自己的裝置項目。

## 節點配對核准

舊版 `node.pair.*` 方法使用另一個由閘道擁有的節點配對儲存區。
WS 節點則改用裝置配對（`role: node`），但適用相同的核准
用語。請參閱[閘道配對](/zh-TW/gateway/pairing)，以瞭解這兩個
儲存區之間的關係。

`node.pair.approve` 會根據待處理要求的命令清單推導額外的必要範圍：

| 宣告的命令                                            | 必要範圍                              |
| ----------------------------------------------------- | ------------------------------------- |
| 無                                                    | `operator.pairing`                    |
| 非執行類節點命令                                      | `operator.pairing` + `operator.write` |
| `system.run`、`system.run.prepare` 或 `system.which` | `operator.pairing` + `operator.admin` |

核准節點宣告不會啟用另有執行階段允許清單關卡的命令。
例如，核准宣告 `computer.act` 的節點需要配對範圍與寫入範圍，
但只會記錄此介面。管理員或擁有者仍必須啟用 `computer.act`。
在它維持啟用期間，透過需要寫入範圍的 `node.invoke` 方法叫用它時，
不需要每個動作都具備管理員範圍。

節點配對會建立身分與信任關係；它不會取代節點本身的
`system.run` 執行核准原則。

## 共用秘密資訊驗證

共用閘道權杖／密碼驗證會被視為該閘道的受信任操作員存取。
相容 OpenAI 的 HTTP 介面、`/tools/invoke`，以及 HTTP
工作階段歷程端點，會為共用秘密資訊持有人驗證恢復完整的預設操作員範圍集合，
即使呼叫端傳送的是較窄的宣告範圍。

具有身分資訊的模式（例如受信任 Proxy 驗證或私人入口的 `none`）
仍可遵循明確宣告的範圍。若要真正分隔信任邊界，請使用個別的閘道。

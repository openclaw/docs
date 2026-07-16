---
read_when:
    - 變更 exec 或外掛的核准生命週期、儲存、通訊協定或授權
    - 為頻道新增核准連結或原生核准控制項
    - 將子工作階段核准狀態投射至父工作階段或協調器檢視中
summary: 跨 Control UI、原生應用程式、頻道與父工作階段的持久、可深層連結核准機制設計
title: 多介面操作員核准
x-i18n:
    generated_at: "2026-07-16T12:00:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# 多介面操作者核准

此設計追蹤 [#103505](https://github.com/openclaw/openclaw/issues/103505)。它以一個由閘道擁有、以 SQLite 為後端的生命週期，取代行程區域的核准權限。每個由閘道擁有的 exec 或外掛／工具核准，都會取得一個穩定 ID、一條經驗證的 Control UI 路由、不可分割且先回覆者勝出的解析機制，以及僅供操作者查看、投射至其來源與上層工作階段串流的內容。

行內動作與深層連結並存。不提供核准模式切換。

## 目標

- 為 exec 與外掛／工具閘門提供一個持久的核准物件。
- 穩定的 `${controlUiBasePath}/approve/{approvalId}` 路由。
- 可從任何經授權的 Control UI、原生應用程式或頻道介面進行解析。
- 在並行介面之間提供不可分割且先回覆者勝出的行為。
- 相同的重試具冪等性；後到且衝突的答案無法覆寫勝出者。
- 逾時、格式錯誤的受信任裁決、缺少路由、取消及重新啟動時，一律以拒絕方式安全失敗。
- 請求與終止事件會傳至來源工作階段，以及所有相關的父層／協調器擁有者。
- 頻道接收具型別的核准與導覽動作；傳輸回呼資料仍為頻道私有。
- 現有的 exec／外掛閘道方法維持相容，同時其實作收斂至單一服務。

## 非目標

- 跨閘道重新啟動持久保存或恢復遭阻擋的工具執行本身。
- 將核准 ID 或 URL 當作持有者認證資訊。
- 將核准提示附加至模型可見的逐字稿，或喚醒父層代理程式。
- 將核准政策、產品命令或審核者授權移入頻道外掛。
- 依頻道、裝置或上層複製核准狀態。
- 重新設計 exec 允許清單、外掛政策組合或 `allow-always` 持久性，但為了讓終止結果明確所需的部分除外。
- 在第一階段讓無閘道的嵌入式終端介面可從遠端存取。它仍僅限本機使用，且沒有審核者時必須以拒絕方式安全失敗。

## 推出前基準與證據圖

此表記錄 #103505 建立時的實作狀態。下方的推出章節追蹤在該基準之上建置的持久登錄、具型別動作、深層連結頁面及原生用戶端階段。

| 介面           | 基準進入點與擁有者                                                                                                                                  | 基準行為與缺口                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 代理程式 exec        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | 兩階段 `exec.approval.*` 註冊可避免早期 `/approve` 競爭，但逾時仍可能透過 `askFallback` 變成允許。                                                        |
| 外掛工具閘門  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | 請求 `plugin.approval.*`；`timeoutBehavior: "allow"` 可核准已逾時的閘門。嵌入式模式在 `src/infra/embedded-plugin-approval-broker.ts` 中擁有獨立的行程區域權限。 |
| 外掛節點閘門  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | 直接透過外掛管理員建立並廣播，重複了部分伺服器方法生命週期。                                                                                 |
| 閘道權限 | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | 獨立的 exec 與外掛管理員使用行程區域對應表。終止項目保留 15 秒。先回覆者勝出僅在單一行程內成立。                                          |
| 閘道通訊協定  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | Exec 僅有待處理狀態的 `get`；外掛沒有 `get`；不存在可供深層連結使用、與種類無關的終止狀態查詢。                                                                                   |
| 傳遞          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | 支援來源路由、核准者私訊、待處理重播、原生處理常式，以及行程內終止狀態清理。另行後續工作會加入持久的終止狀態對帳。                          |
| 可攜式動作  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | 核准按鈕是包含 `/approve ...` 的命令動作；URL 與 Web App 目標是無型別的按鈕欄位。                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | 轉譯器會剖析命令文字以辨識核准語意，再產生私有回呼資料。                                                                                     |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | 核准 UI 是全域強制回應視窗。`ui/src/app-route-paths.ts` 與 `ui/src/app-routes.ts` 使用精確路由，並將未知路徑改寫至聊天。                                                    |
| 工作階段擁有權 | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | 控制器、請求者、明確父層及舊版衍生擁有權皆已存在，但核准事件尚未投射至這些工作階段串流。                                                    |
| 共用狀態      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | 現有的立即交易與 Kysely 條件式更新，可在 `state/openclaw.sqlite` 中支援持久的比較後設定。                                                                   |

具代表性的現有測試包括 `src/gateway/exec-approval-manager.test.ts`、`src/gateway/server-methods/approval-shared.test.ts`、`src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`、`extensions/telegram/src/approval-handler.runtime.test.ts` 及 `ui/src/e2e/approval-flow.e2e.test.ts`。

外掛 SDK 仍是唯一的頻道／外掛邊界。核准執行階段與呈現變更必須透過現有的 `src/plugin-sdk/approval-*.ts` 與 `src/plugin-sdk/interactive-runtime.ts` 子路徑匯出；外掛正式環境程式碼不得匯入閘道內部項目。

## 先例

Omnigent 提供了實用的使用者體驗與失敗語意：

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) 會暫停 ASK、套用各政策的逾時，且僅將完全相符的接受視為核准。
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) 包含伺服器端原生測試框架閘門，以及上層請求／解析投射。
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) 提供獨立的行動裝置核准頁面。

不要不加批判地照搬其儲存聲明。目前有效的待處理狀態在 [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) 中是行程區域狀態，而未使用的待處理資料表由 [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) 移除。OpenClaw 刻意更進一步：SQLite 是權威來源，且每次終止狀態轉換都是資料庫的比較後設定。

## 架構與擁有權

閘道擁有此生命週期：

1. 代理程式、外掛掛鉤或節點政策提供特定種類的請求與行程區域執行繫結。
2. 閘道驗證該請求，並建立經過清理的審核者投射。
3. 核准服務計算來源／擁有者受眾、插入規範資料列，然後註冊行程內等候器。
4. 完成持久插入後，閘道會發布現有核准事件、工作階段投射、頻道通知及原生推播。
5. 每個介面都透過相同服務進行解析。
6. 服務會提交一次終止狀態轉換、喚醒執行階段等候器，並發布終止狀態投射。
7. 事件傳遞失敗絕不會回復已提交的決定；用戶端可透過 `approval.get` 或清單重播復原。

擁有權邊界：

- `src/gateway/`：核准服務、授權、RPC 配接器、URL 建構、等候器生命週期及事件發布。
- `src/state/`：共用結構描述與產生的 Kysely 型別。
- `src/infra/`：經過清理的核准檢視模型與可攜式呈現建構。
- `src/agents/`：提出請求、等待並套用傳回的裁決；不負責持久保存。
- `src/channels/` 與 `extensions/*`：轉譯具型別動作、授權頻道使用者、編碼私有回呼，並更新已傳遞的控制項。
- `src/plugin-sdk/`：僅包含公開核准與呈現合約。
- `ui/`：獨立頁面及現有的佇列／強制回應視窗用戶端。

行程內等候器是通知機制，而非權威來源。註冊程序會先同步插入資料列並安裝等候器，再發布請求，因此解析者無法在這些步驟之間插入執行。之後每個解析者都會先透過 SQLite 提交，再完成該等候器。

## 持久記錄

在共用狀態資料庫中新增一個 `operator_approvals` 資料表。

| 欄位                                             | 用途                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | 全域唯一的標準 ID。為維持通訊協定相容性，保留現有的執行 ID 與 `plugin:` ID，但絕不可根據前綴推斷種類。      |
| `resolution_ref`                                   | 唯一的完整 SHA-256 base64url 定位器，供無法攜帶標準 ID 的傳輸回呼使用。它不是授權資訊，也不是公開 URL ID。 |
| `kind`                                             | 封閉的 `exec \| plugin` 判別欄位。                                                                                                        |
| `status`                                           | 封閉的 `pending \| allowed \| denied \| expired \| cancelled` 狀態。                                                                          |
| `presentation_json`                                | 已驗證且帶有種類標記的審核者投影。原始執行階段請求、命令繫結與回呼承載資料仍保留於程序本機。               |
| `source_agent_id`、`source_session_key`            | 來源身分與工作階段投影錨點。工作階段金鑰可持久保存；輪替的工作階段 UUID 則不可。                                          |
| `audience_session_keys_json`                       | 由有界廣度優先擁有權走訪產生、已排序且去除重複項目的 JSON 陣列。請求事件與終止事件使用相同的快照。 |
| `requested_by_device_id`、`requested_by_client_id` | 可持久保存的請求者／稽核中繼資料。連線 ID 保留在記憶體中，不是跨介面的主體。                                         |
| `reviewer_device_ids_json`                         | 選用的明確指定審核者裝置，僅由受信任的核准執行階段提供。                                                  |
| `runtime_epoch`                                    | 擁有已停駐執行作業的程序世代；用於在重新啟動後取消孤立資料列。                                                     |
| `created_at_ms`、`expires_at_ms`、`updated_at_ms`  | 權威時間資訊。                                                                                                                         |
| `decision`                                         | 存在明確使用者決策時的該項決策。                                                                                                       |
| `terminal_reason`                                  | 封閉原因，例如 `user`、`timeout`、`malformed-verdict`、`no-route`、`run-aborted` 或 `gateway-restart`。                                |
| `resolved_at_ms`、`resolver_kind`、`resolver_id`   | 保留於伺服器端的勝出者與稽核身分。審核者投影會省略原始解析者識別碼。                                           |
| `consumed_at_ms`、`consumed_by`                    | `allow-once` 的獨立重播防護；取用時不得清除已記錄的決策。                                                       |

必要索引：

| 索引                                      | 用途                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| 唯一 `(resolution_ref)`                  | 插入時拒絕跨欄位的 `approval_id`/`resolution_ref` 歧義。 |
| `(status, expires_at_ms)`                  | 尋找待處理的核准，並協調權威截止時間。               |
| `(source_session_key, created_at_ms DESC)` | 重播單一來源工作階段最近的核准。                             |
| `(resolved_at_ms)`                         | 依固定保留政策修剪已保留的終止核准。  |

受眾陣列規模小且有界。依工作階段篩選的重播會先透過 Kysely 選取可見的待處理資料列，再於應用程式碼中解碼並篩選有界的受眾陣列；它不使用字串比對或原始 SQL JSON 查詢。

終止資料列保留 30 天，與 `src/audit/audit-event-store.ts` 中的中繼資料稽核保留期一致。修剪屬於固定維護政策，不是新的設定介面。資料庫是私有的本機控制平面狀態，但審核者 API 絕不可公開完整的已儲存請求或執行階段繫結。

## 狀態機與比較後設定

只有下列轉換有效：

- `pending -> allowed`：明確的 `allow-once` 或 `allow-always`。
- `pending -> denied`：明確拒絕、受信任的格式錯誤終止裁決，或沒有傳遞路徑。
- `pending -> expired`：已到達權威截止時間。
- `pending -> cancelled`：執行中止、正常關閉，或重新啟動後的孤立作業復原。

所有不允許的終止狀態，其實際裁決皆為拒絕。

解析作業會使用一個立即 SQLite 交易，以及等同於下列內容的 Kysely 條件式更新：

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

若更新未影響任何資料列，同一個交易會讀取該記錄：

- 不存在或未獲授權：傳回找不到；不得透露其存在。
- 仍在等待中但已到達截止時間：以比較後設定將其設為 `expired`，再傳回該終止資料列。
- 與已記錄的決策相同：傳回具冪等性的成功結果及已記錄的勝出者。
- 不同決策：統一 API 傳回 `applied: false` 及已記錄的勝出者；舊版轉接器則在其已發布合約要求時保留 `APPROVAL_ALREADY_RESOLVED`。
- 任何終止狀態：絕不變更。

`now == expires_at_ms` 已過期。閘道時間具有權威性。

`allow-once` 執行會對 `consumed_at_ms IS NULL` 使用第二次 CAS，並繫結至現有且完全相符的命令／系統執行環境。核准資料列在取用後仍保留為稽核記錄。

無法驗證身分或識別核准的格式錯誤 HTTP/RPC 輸入會遭拒絕且不進行變更，永遠無法核准。若從受信任的測試工具／等待器收到已知核准的格式錯誤終止裁決，則轉換為 `denied`。

## 閘道 API

新增不限定種類的審核者方法：

| 方法                                    | 合約                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | 傳回可見的待處理投影或已保留的終止投影。                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | 接受標準 ID 或固定大小的傳輸參照，接著執行授權、種類與允許決策驗證、截止時間協調，以及終止 CAS。回應一律包含標準 ID。 |

CAS 成功後，立即傳回已提交的投影。舊版事件、頻道轉送器與推送終止器都是最佳努力的後續作業；緩慢或失敗的介面不得延遲或回復勝出的回應。

特定種類的請求驗證仍保留於 `exec.approval.request` 與 `plugin.approval.request`。現有的 `exec.approval.get/list/waitDecision/resolve` 與 `plugin.approval.list/waitDecision/resolve` 會成為標準服務的通訊協定邊界轉接器，因為它們是已發布的閘道 API。內部呼叫端會在同一項變更中移轉至該服務。

審核者投影是帶標記的聯集：

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* 安全的執行預覽 */ }
    | { kind: "plugin"; title: string; description: string /* 安全的外掛預覽 */ };
  // 共用生命週期欄位
};
```

穩定路徑由推導產生，不會持久保存。`approval.get` 傳回 `urlPath`；已知獲准公開來源的介面也可接收絕對 `url`。審核者快照會省略來源與受眾工作階段金鑰。閘道會將這些路由金鑰保留於伺服器端，供獨立的 `session.approval` 投影使用。

## 事件與可攜式動作

PR 1 保留已發布的事件名稱、承載資料及現有的記錄層級接收者篩選器：

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

這些舊版事件可能包含完整的執行階段請求，因此不得將其廣播給每個核准範圍的用戶端。PR 5 會透過已清理的生命週期投影新增帶標記的生命週期欄位（`status`、`sourceSessionKey`、`urlPath`、終止中繼資料，以及呈現層級的 `kind`），而不是擴大舊版事件的傳遞範圍。

新增核准範圍的 `session.approval` 投影事件。使用已持久保存的受眾金鑰發布一次標準事件；完全相符的工作階段訂閱者會針對每個相符金鑰收到相同事件：

- `sessionKey`：接收投影的串流。
- `sourceSessionKey`：引發閘門的子項／來源。
- `phase`：`pending \| terminal`，依核准狀態判別。
- 一個安全的 `OperatorApproval` 投影。

用戶端透過 `sessions.messages.subscribe { key, agentId?, includeApprovals: true }` 選擇加入。成功回應會新增 `approvalReplay`，其中最多包含該完全相符串流金鑰目前的 1,000 項待處理核准，且訂閱用戶端也必須在記錄層級獲授權審核。`truncated: false` 使已篩選的重播成為權威資料，重新連線的用戶端會以其取代本機待處理集合；`truncated: true` 是過載訊號，用戶端必須保留尚未看見的本機項目，直到標準查詢或後續生命週期事件完成處理。若重播期間發現較晚的持久逾時，則只會向已訂閱且獲記錄層級授權的受眾發出終止刪除標記，之後才傳回新快照。`operator.admin` 可直接選擇加入；範圍較窄的用戶端則同時需要已配對的裝置身分與 `operator.approvals`。僅訂閱工作階段絕不會授予核准可見性。

在 `src/gateway/server-broadcast.ts` 中將事件註冊於 `operator.approvals` 之下。該投影僅供觀察：它絕不附加文字記錄資料列、發出 `sessions.changed`，或喚醒代理程式。

擴充 `src/interactive/payload.ts` 中的 `MessagePresentationAction`：

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

核心會建構具型別的決策動作，並在有已核准的絕對 Control UI 來源時提供獨立的審查連結。頻道會將核准動作編碼為自己的回呼格式，並將決議傳送至標準服務。若標準 ID 長度允許，回呼會使用完全相同的標準 ID；否則會使用該資料列唯一的完整摘要 `resolution_ref`。此參照只是精簡的查詢鍵：一般閘道驗證、記錄授權、明確種類、允許的決策驗證、期限協調，以及首個回覆優先的 CAS 仍然適用。頻道不得截斷 ID、解析雜湊前綴、剖析 `/approve` 文字，或根據 ID 前綴推斷種類。

將 `button.url`、`button.webApp` 和命令支援的核准控制項保留為已棄用的外掛 SDK 相容性輸入。在 SDK 邊界正規化這些輸入；在同一個 PR 中遷移所有內建的內部呼叫端。`/approve {id} {decision}` 仍是文字備援及命令列介面／聊天命令，而不是按鈕語意合約。

## Control UI

路由為 `${basePath}/approve/{approvalId}`。ID 是唯一的路徑參數；來源工作階段身分取自記錄。

由於目前的路由器使用精確的靜態路由，並將未知路徑重寫至聊天，因此請先在 `ui/src/app/bootstrap.ts` 中偵測此深層連結，再進行一般路由正規化。重複使用一般閘道／驗證設定，但在側邊欄外殼和全域模態視窗之外呈現獨立的核准頁面。

文件由提供其 URL 的閘道擁有。其初始連線會忽略完整應用程式中已保存的遠端閘道選擇，不會變更或複製該選擇的設定；只有驗證會限定於提供服務之閘道的工作階段。受信任的原生驗證或另行確認的 `gatewayUrl` 覆寫可將其重新導向。核心會在外掛 HTTP 路由和靜態擴充功能偵測之前保留單區段的 `/approve` 命名空間，包括以 `.json` 或 `.js` 結尾的 ID；停用 Control UI 服務時，保留路由會以 `404` 關閉失敗。將頁面保留在主要 Control UI 套件組合中，避免延遲載入區塊失敗，導致安全性決策卡在載入動畫。

頁面狀態：

- 載入中
- 需要驗證
- 待處理
- 正在決議
- 已在此核准或拒絕
- 已在其他位置決議
- 已過期
- 已取消
- 禁止／找不到
- 連線錯誤，可重試

此頁面呼叫閘道 RPC，而不是另一個未驗證的 REST API。重新整理瀏覽器會重新讀取持久狀態。它絕不會將閘道認證資訊放入 URL、查詢或片段中。

## 授權與隱私

URL 是定位器，而不是授權依據。決議需要：

1. 已驗證的閘道連線；
2. `operator.approvals` 或 `operator.admin`；
3. 記錄層級的審查者授權。

記錄層級規則：

- `operator.admin` 可以審查。
- 若存在 `reviewer_device_ids`，則以其為準。只有列出的已配對
  `operator.approvals` 裝置可以審查；除非提出要求的裝置也在清單中，否則不會
  隱含取得存取權。
- 若沒有明確的審查者清單，提出要求的已配對
  `operator.approvals` 裝置可以審查自己的記錄。
- 對於確實沒有要求者或審查者繫結的舊版記錄，仍保留廣泛的
  已配對裝置可見性，以免升級導致已在等待中的工作無法繼續。
- 沒有裝置的內部執行階段可以透過範圍限定的
  核准執行階段連線進行決議，但不能讀取。此授權僅來自
  經伺服器驗證的執行階段權杖；公開的 `approval.resolve` 欄位無法
  建立該權杖。
- 即時要求者的連線所有權對舊版轉接器仍然有效；絕不會
  因用戶端名稱相符而推斷。
- 受眾成員資格只會改變呈現方式，絕不會擴大授權。

`approval.get` 只公開已清理的審查者投影，並省略內部來源／受眾路由鍵。PR 5 的 `session.approval` 事件會攜帶其唯一目的地 `sessionKey`，以及閘道在伺服器端套用已保存受眾快照後的 `sourceSessionKey`。現有的執行／外掛事件會保留其歷史承載資料和受限接收者，直到消費端完成遷移。可執行要求、命令繫結和後續執行只存在於處理程序本機的等待器中。持久資料列包含安全的呈現資料，以及生命週期、路由和稽核中繼資料；絕不儲存原始環境值、認證資訊、驗證標頭或頻道回呼資料。

## 受眾投影

在插入前只計算一次受眾，並保存排序後的快照。所有權是一張圖，不一定是單一父系鏈：子項可能同時有目前控制者和原始要求者，而這些擁有者可能通往不同根節點。

使用確定性的廣度優先走訪：

1. 以來源工作階段鍵初始化佇列。
2. 針對每個從佇列取出的鍵，讀取最新的子代理程式登錄資料列，並依固定順序將兩條不同的所有權邊加入佇列：先 `controllerSessionKey`，再 `requesterSessionKey`。
3. 若存在可用的登錄資料列，請勿再追蹤可能在引導後已過時的工作階段項目譜系。否則，將唯一的目前備援邊 `parentSessionKey ?? spawnedBy` 加入佇列。
4. 加入佇列時進行正規化並移除重複項目，讓第一條最短路徑勝出。
5. 達到 64 個唯一鍵時停止；此受眾大小上限也會限制走訪深度。

登錄來源為 `src/agents/subagent-registry-read.ts`；所有權欄位定義於 `src/agents/subagent-registry.types.ts`。工作階段備援欄位定義於 `src/config/sessions/types.ts`。

要求和終止投影會使用相同的已保存受眾，即使核准待處理期間焦點／控制者所有權發生變更也一樣。這可保證每個曾收到要求投影的受眾工作階段串流都會收到終止清理。決議一律以來源核准 ID 為目標；受眾工作階段絕不會收到複製的核准狀態。轉送頻道訊息的清理仍是下方獨立的傳遞定位器後續工作。

不得僅為核准而寫入文字記錄訊息、注入系統提示、啟動擁有者回合，或發出 `sessions.changed`。

## 已傳遞介面的收斂

原生核准處理常式已經會保留其已傳遞訊息項目足夠長的時間，以便取代或撤除使用中的控制項。一般轉送核准訊息目前會捨棄 `MessageReceipt`，因此在其他介面做出決策後，其舊控制項可能仍顯示為待處理。另一項後續工作會透過共用狀態資料庫中的 `operator_approval_deliveries` 子資料表補足此缺口。

每個資料列儲存核准 ID、唯一傳遞 ID、頻道／帳戶／確切路由、經 JSON 驗證且有界限的頻道私有訊息定位器、傳遞時間戳記，以及終止處理狀態。它絕不儲存回呼資料、決策權杖或原始核准要求。頻道擁有定位器編碼和訊息修改；核心擁有標準狀態、目標選擇、重試原則和備援終止文字。

傳遞登錄和終止決議能安全地處理競爭狀況：

1. 待處理的傳送回傳收據後，在同一筆交易中插入傳遞定位器並讀取父核准狀態。
2. 若父項已經終止，排定立即進行終止處理，而不是讓延遲的傳遞維持待處理狀態。
3. 每次已提交的終止轉換都會另外排定所有尚未完成的傳遞資料列；可捨棄的廣播不是觸發條件。
4. 頻道終止處理器會回報 `replaced`、`retired` 或 `unsupported`。已取代會抑制重複的終止訊息；已撤除會傳送現有的終止後續訊息；不支援或失敗則進行備援，而不回復核准 CAS。
5. 啟動時重試仍有未完成傳遞的終止核准，讓清理能承受閘道重新啟動。

此傳輸生命週期是選用的傳遞轉接器掛鉤，不是轉譯器或面向模型的訊息動作。QQ C2C／群組訊息目前沒有編輯、刪除或清除鍵盤的 API；該轉接器仍不受支援，在傳輸層取得修改 API 之前，只能在之後的點擊操作中顯示標準事實。

## 重新啟動、逾時和路由語意

SQLite 持久化不代表會恢復執行。命令／工具繫結仍保留在記憶體中，因為它們可能包含具安全敏感性的執行階段事實，且不屬於可恢復的工作合約。

閘道啟動時：

- 產生新的執行階段 Epoch；
- 以不可分割方式將較舊 Epoch 的待處理資料列轉換為 `cancelled`，原因為 `gateway-restart`；
- 保留資料列，讓其 URL 能說明發生了什麼事；
- 絕不對缺少執行階段繫結的項目執行後續核准。

計時器只是喚醒最佳化。期限權威儲存於 `expires_at_ms`；讀取、等待和決議都會執行過期協調。

最終嚴格行為：

- 逾時 -> `expired`，拒絕；
- 沒有路由 -> `denied`，拒絕；
- 執行中止 -> `cancelled`，拒絕；
- 格式錯誤的受信任裁決 -> `denied`，拒絕；
- 只有允許的明確放行決策 -> `allowed`。

目前已發布的執行行為仍與此合約衝突：

- `src/agents/bash-tools.exec-host-shared.ts` 可能套用 `askFallback`。
- `docs/tools/exec-approvals.md` 和 `docs/cli/approvals.md` 記錄了該介面。

外掛核准現在會在逾時和裁決格式錯誤時關閉失敗；舊版
`timeoutBehavior` 欄位仍可接受，但會被忽略。執行嚴格語意的
後續工作必須同時更新程式碼、型別、文件、測試和變更記錄，並經過
明確的擁有者／安全性審查。遷移期間，`askFallback` 可以繼續描述
閘門前的原則選擇，但不得將已建立待處理記錄的逾時轉為核准。

## 相容性計畫

- 以附加方式擴充閘道通訊協定；不提高通訊協定版本。
- 在外部邊界保留現有的執行／外掛方法和事件。
- 保留現有 ID，包括 `plugin:` 前綴，但停止將前綴作為型別資訊。
- 保留 `/approve` 文字命令行為。
- 保留舊版按鈕 URL／Web App 欄位和命令動作，作為外掛 SDK 相容性輸入；新的核心輸出具有型別。
- 在同一個具型別動作變更中遷移所有內建頻道和內部呼叫端。
- 為新的 URL／頁面及之後的逾時行為變更新增變更記錄項目。
- 不要新增引導模式設定。

## 推出計畫

### PR 1：持久生命週期

- 此設計說明。
- 共用 SQLite 綱要、Kysely 產生作業、儲存區，以及 30 天清理。
- 閘道核准服務、執行階段等待器橋接，以及重新啟動孤兒項目處理。
- 統一的 `approval.get/resolve`。
- 執行／外掛方法轉接器。
- 首個回覆優先、等冪性、過期、授權和消費測試。
- 目前尚不變更 UI 或頻道行為。

### PR 2：具型別動作和頻道回呼

- 具型別的核准、URL 與 Web App 動作。
- 核心呈現建構器與外掛 SDK 匯出項目。
- 具明確擁有者種類的傳輸層私有回呼編碼。
- 當標準 ID 超出傳輸限制時，使用可持久保存的固定大小回呼參照。
- 將內建通道從命令文字與核准 ID 推斷機制遷移出去。
- 以點選介面上的標準首次回覆作為事實依據，並盡力更新作用中原生介面的終止狀態；持久化通道訊息的終止狀態處理仍留待後續完成。
- SDK 與內建通道測試。

### PR 3：Control UI 深層連結

- 獨立且經過驗證的核准頁面，以及可辨識基礎路徑的啟動路由。
- 繫結至提供服務的閘道，而不變更操作者儲存的遠端選擇。
- 由核心擁有的核准 HTTP 命名空間，包括類似資產的 ID。
- 由閘道產生的 URL 承載資料，以及在生命週期事件推出前持續輪詢待處理狀態。
- 行動裝置寬度、重新連線、競爭回覆、重新載入與掛載路徑的驗證。

### PR 4：原生用戶端

- iOS 與 Android 審核介面使用可辨識種類的 `approval.get/resolve`；watchOS 透過配對的 iPhone 轉送適合審核者的提示與決策。
- Watch 提供其精簡轉送合約支援的執行決策：允許一次與拒絕。
- 以標準首次回覆的終止狀態事實取代本機嘗試決策狀態。
- 遺失或語意不明的解析確認會凍結控制項，直到讀回標準狀態。
- 先前已發布的閘道 v4 執行個體透過範圍有限的舊版方法後援機制保留執行審核功能；跨介面保留終止狀態則需要統一方法。
- 審核者警告與擁有者脈絡在 iPhone、Watch 和 Android 上皆保持可見。
- 原生單元、建置與平台驗證。

### PR 5：祖先生命週期傳播

- 從 PR 1 持久化的對象快照傳送 `session.approval` 待處理／終止狀態。
- 精確工作階段訂閱、重新連線重播與終止狀態墓碑，不變更對話記錄或喚醒代理程式。
- 生命週期回呼在持久化插入／CAS 後執行，且絕不成為核准權威。
- 巢狀子代理程式與重新連線驗證。

### PR 6：失敗時關閉行為

- 將 `node-invoke-plugin-policy.ts` 與內嵌外掛代理器從重複權威機制遷移出去。
- 嚴格的逾時、格式錯誤、無路由、繫結與允許一次消耗語意。
- 淘汰已發布的寬鬆逾時設定，且要求進入待處理狀態後不再遵循這些設定。
- 多介面競爭與故障注入驗證。

### 後續：持久化遠端訊息清理

- 持久化已轉送的傳送定位資訊，並在重新啟動後將每則已傳送的通道訊息設為終止狀態。
- 讓此傳輸生命週期與標準核准權威及具型別呈現動作保持分離。

## 測試

必要的重點涵蓋範圍：

- 重新開啟 SQLite 後仍保留待處理與終止狀態投影。
- 兩個並行解析器只會產生一個 CAS 勝出者。
- 相同決策的重試以等冪方式成功；衝突的重試則傳回已記錄的勝出者。
- 在截止時間當下或之後解析時，不得核准。
- `allow-once` 只能消耗一次，且不會清除終止狀態稽核記錄。
- 啟動時取消較舊的執行階段。
- 未經授權的查詢與解析不會洩漏記錄是否存在。
- 明確的審核者允許清單與一般配對的 `operator.approvals` 行為。
- 執行方法與外掛舊版方法共用同一個儲存區。
- 閘道要求／列出／取得／解析結構描述與附加式事件承載資料。
- 具型別動作正規化、後援呈現、SDK 匯出項目與內建通道切換。
- Telegram 回呼編碼包含傳輸層私有資料，且不進行命令字串推斷。
- 直接子項、分支控制器／要求者擁有者、巢狀擁有者、重新指派、工作階段欄位後援、循環與對象大小上限。
- 要求與終止狀態的對象陣列完全相同。
- 擁有者投影不會造成對話記錄變更或喚醒代理程式。
- Control UI 路由可在 `/` 與設定的基礎路徑運作；重新整理會顯示待處理或終止狀態事實。
- Control UI 與 Telegram 同時回覆時，只會顯示一個勝出者，而落敗者會顯示「已在其他位置解析」。
- 原生核准識別碼與閘道擁有者識別碼在路由與協調期間保留完全相同的 UTF-8 位元組。
- 原生 RPC 系列交涉會為每個允許的閘道路由固定一個標準或舊版系列，且使用後絕不會無聲降級。
- 遺失原生解析確認時會凍結動作，直到讀回標準狀態；讀回失敗不得捏造勝出者或確認 Watch 重新整理。
- 只有完全符合配對閘道擁有者，且 iPhone 標準讀回已完成時，才接受 Watch 快照要求關聯。
- 透過 Testbox／Crabbox 驗證使用者路徑，包括行動裝置寬度的核准頁面、Telegram 動作清理，以及橫跨 Android、iPhone 和 Watch 的一輪待處理／解析／較晚落敗者往返流程。

## 可觀測性

發出結構化且不含內容的轉換記錄，其中包含核准 ID、種類、來源工作階段金鑰、狀態、原因與延遲。絕不記錄預覽或原始繫結資料。

追蹤：

- 依種類區分的要求數量；
- 依種類／狀態／原因區分的終止狀態數量；
- 待處理量表；
- 從要求到終止狀態的延遲；
- 解析競爭結果：勝出者、等冪重試、衝突、已過期；
- 傳送路由數量與無路由拒絕數量；
- 啟動時孤立項目取消數量；
- 對象大小。

即使後續事件傳送失敗，已提交的轉換仍視為成功。生命週期訂閱者透過 PR 5 重播與標準查詢復原。持久化通道訊息的終止狀態處理仍是上述獨立的後續工作。

## 待決事項

1. **可從外部連線的 Control UI 來源。**每個快照都攜帶穩定的相對 `urlPath`。只有在閘道公開成功後，才能從快取的 Tailscale Serve／Funnel 位置公布絕對 URL；`allowedOrigins`、要求 Host 標頭、`gateway.remote.url`，以及僅供顯示的回送／LAN 候選項目，都不是標準來源。Telegram 可使用其經過驗證的 Mini App 包裝器，在啟動程序中保留核准路徑。在另行審核的明確公開 URL 合約建立前，任意反向 Proxy 仍僅能使用相對路徑。絕不可讓通道猜測來源。
2. **執行嚴格逾時相容性切換。**外掛核准逾時現在會在失敗時關閉，且 `timeoutBehavior` 已淘汰。其餘已發布的 `askFallback` 合約在待處理要求逾時後停止授權執行之前，仍需經過明確的擁有者／安全性審核、變更記錄、文件，以及遷移／淘汰決策。
3. **無閘道內嵌模式。**建議：最初僅限本機使用，之後在閘道存在時，將其改為標準服務的用戶端。不要公布任何伺服器都無法解析的深層連結。

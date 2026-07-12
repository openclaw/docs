---
read_when:
    - 變更 exec 或外掛核准的生命週期、儲存、通訊協定或授權
    - 在頻道中新增核准連結或原生核准控制項
    - 將子工作階段的核准狀態呈現在父工作階段或協調器檢視中
summary: 為控制介面、原生應用程式、頻道與父工作階段設計持久且可深層連結的核准機制
title: 多介面操作者核准
x-i18n:
    generated_at: "2026-07-12T14:49:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f3dfc5d503d46bfc7a5eb94960baf2a81216ac973ef1bb1e6a0ef63f0bec6d5
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# 多介面操作員核准

此設計追蹤 [#103505](https://github.com/openclaw/openclaw/issues/103505)。它以單一由閘道擁有、由 SQLite 支援的生命週期，取代程序區域的核准權限。每個由閘道擁有的 exec 或外掛／工具核准，都會取得一個穩定 ID、一條經過驗證的 Control UI 路由、具原子性的先回覆者勝出解析機制，以及僅供操作員查看、投影至其來源與祖先工作階段串流的內容。

行內動作與深層連結並存。不提供核准模式切換開關。

## 目標

- 為 exec 與外掛／工具關卡提供單一持久核准物件。
- 穩定的 `${controlUiBasePath}/approve/{approvalId}` 路由。
- 可從任何已授權的 Control UI、原生應用程式或頻道介面進行解析。
- 在並行介面之間提供具原子性的先回覆者勝出行為。
- 相同的重試具冪等性；較晚出現且衝突的答案無法覆寫勝出答案。
- 逾時、格式錯誤的受信任裁決、缺少路由、取消及重新啟動一律以關閉方式失敗。
- 請求事件與終止事件會送達來源工作階段，以及所有相關的父層／協調器擁有者。
- 頻道會收到具型別的核准與導覽動作；傳輸層回呼資料仍為頻道私有。
- 現有的 exec／外掛閘道方法維持相容，同時讓其實作收斂至單一服務。

## 非目標

- 跨閘道重新啟動持久保存或恢復遭封鎖的工具執行本身。
- 將核准 ID 或 URL 當作持有者認證資訊。
- 將核准提示附加至模型可見的逐字記錄，或喚醒父代理程式。
- 將核准政策、產品命令或審核者授權移入頻道外掛。
- 依頻道、裝置或祖先複製核准狀態。
- 重新設計 exec 允許清單、外掛政策組合或 `allow-always` 持久化，但為使終止結果明確所需的部分除外。
- 在第一階段讓沒有閘道的嵌入式終端介面可供遠端存取。它仍僅限本機使用，且沒有審核者時必須以關閉方式失敗。

## 推出前基準與證據圖

此表記錄 #103505 建立時的實作狀態。下方推出章節會追蹤在該基準上建置的持久登錄、具型別動作、深層連結頁面及原生用戶端階段性增量。

| 介面              | 基準進入點與擁有者                                                                                                                                                | 基準行為與缺口                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 代理程式 exec     | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | 兩階段 `exec.approval.*` 登錄可防止早期 `/approve` 競爭，但逾時仍可能透過 `askFallback` 變成允許。                                                                                             |
| 外掛工具關卡      | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | 請求 `plugin.approval.*`；`timeoutBehavior: "allow"` 可核准已逾時的關卡。嵌入模式在 `src/infra/embedded-plugin-approval-broker.ts` 中具有獨立的程序區域權限。                                  |
| 外掛節點關卡      | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | 直接透過外掛管理員建立並廣播，重複了部分伺服器方法生命週期。                                                                                                                                 |
| 閘道權限          | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | exec 與外掛管理員各自使用程序區域對應表。終止項目會保留 15 秒。先回覆者勝出僅在單一程序內成立。                                                                                               |
| 閘道通訊協定      | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | exec 具有僅限待處理項目的 `get`；外掛沒有 `get`；不存在可供深層連結使用且不限定種類的終止項目查詢。                                                                                           |
| 傳遞              | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | 支援來源路由、核准者私訊、待處理項目重播、原生處理常式及程序內終止項目清理。另有一項後續工作會加入持久終止狀態對帳。                                                                           |
| 可攜式動作        | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | 核准按鈕是包含 `/approve ...` 的命令動作；URL 與 Web App 目標為無型別的按鈕欄位。                                                                                                             |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | 轉譯器會剖析命令文字以辨識核准語意，然後才產生私有回呼資料。                                                                                                                                 |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | 核准 UI 是全域強制回應視窗。`ui/src/app-route-paths.ts` 與 `ui/src/app-routes.ts` 使用精確路由，並將未知路徑改寫至 Chat。                                                                      |
| 工作階段擁有權    | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | 控制器、請求者、明確父層及舊版產生擁有權皆已存在，但核准事件不會投影至這些工作階段串流。                                                                                                     |
| 共用狀態          | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | 現有的立即交易與 Kysely 條件式更新，可在 `state/openclaw.sqlite` 中支援持久的比較後設定操作。                                                                                                 |

具代表性的目前測試包括 `src/gateway/exec-approval-manager.test.ts`、`src/gateway/server-methods/approval-shared.test.ts`、`src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`、`extensions/telegram/src/approval-handler.runtime.test.ts` 及 `ui/src/e2e/approval-flow.e2e.test.ts`。

外掛 SDK 仍是唯一的頻道／外掛邊界。核准執行階段與呈現方式的變更，必須透過現有的 `src/plugin-sdk/approval-*.ts` 與 `src/plugin-sdk/interactive-runtime.ts` 子路徑匯出；外掛正式環境程式碼不得匯入閘道內部項目。

## 既有實作參考

Omnigent 提供了實用的使用者體驗與失敗語意：

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) 會暫停 ASK、套用各政策的逾時設定，且只有完全符合的接受回應才視為核准。
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) 包含伺服器端原生測試框架關卡，以及祖先請求／解析投影。
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) 提供獨立的行動裝置核准頁面。

不要不加批判地照搬其儲存宣稱。目前作用中的待處理狀態位於 [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) 的程序區域中，而未使用的待處理資料表則由 [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py) 移除。OpenClaw 刻意更進一步：SQLite 是權威來源，且每次終止轉換都是資料庫的比較後設定操作。

## 架構與擁有權

閘道擁有生命週期：

1. 代理程式、外掛掛鉤或節點政策提供特定種類的請求，以及程序區域的執行繫結。
2. 閘道會驗證該請求，並建立經過清理的審核者投影。
3. 核准服務計算來源／擁有者受眾、插入標準資料列，然後登錄程序內等待者。
4. 完成持久插入後，閘道會發布現有的核准事件、工作階段投影、頻道通知及原生推播。
5. 每個介面都透過相同服務進行解析。
6. 服務會提交一次終止轉換、喚醒執行階段等待者，並發布終止投影。
7. 事件傳遞失敗絕不會回復已提交的決策；用戶端可透過 `approval.get` 或清單重播進行復原。

擁有權邊界：

- `src/gateway/`：核准服務、授權、RPC 介接器、URL 建構、等待者生命週期及事件發布。
- `src/state/`：共用結構描述及產生的 Kysely 型別。
- `src/infra/`：經過清理的核准檢視模型及可攜式呈現方式建構。
- `src/agents/`：請求、等待及套用傳回的裁決；不進行持久化。
- `src/channels/` 與 `extensions/*`：轉譯具型別的動作、授權頻道使用者、編碼私有回呼，以及更新已傳遞的控制項。
- `src/plugin-sdk/`：僅包含公開的核准與呈現合約。
- `ui/`：獨立頁面，以及現有的佇列／強制回應視窗用戶端。

程序內等待者是通知機制，而非權威來源。登錄作業會先插入資料列並同步安裝等待者，再發布請求，因此解析者無法在這些步驟之間插入執行。此後每個解析者都必須先透過 SQLite 提交，再結束該等待者。

## 持久記錄

在共用狀態資料庫中新增一個 `operator_approvals` 資料表。

| 欄位                                               | 用途                                                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | 全域唯一的標準 ID。為了通訊協定相容性，保留現有的執行 ID 與 `plugin:` ID，但絕不可從前綴推斷種類。                                                           |
| `resolution_ref`                                   | 唯一的完整 SHA-256 base64url 定位值，供無法攜帶標準 ID 的傳輸回呼使用。它不是授權資訊，也不是公開 URL ID。                                                    |
| `kind`                                             | 封閉式 `exec \| plugin` 判別欄位。                                                                                                                             |
| `status`                                           | 封閉式 `pending \| allowed \| denied \| expired \| cancelled` 狀態。                                                                                           |
| `presentation_json`                                | 經驗證且帶有種類標記的審查者投影。原始執行階段請求、命令繫結及回呼承載資料仍僅存在於處理程序內。                                                              |
| `source_agent_id`, `source_session_key`            | 來源身分與工作階段投影錨點。工作階段金鑰具有持久性；輪替的工作階段 UUID 則沒有。                                                                                |
| `audience_session_keys_json`                       | 由有界的廣度優先擁有權走訪所產生、依序排列且已去除重複項目的 JSON 陣列。請求事件與終端事件使用同一份快照。                                                     |
| `requested_by_device_id`, `requested_by_client_id` | 持久的請求者／稽核中繼資料。連線 ID 僅保留於記憶體中，不是跨介面的主體。                                                                                       |
| `reviewer_device_ids_json`                         | 選用的明確指定審查者裝置，僅由受信任的核准執行階段提供。                                                                                                      |
| `runtime_epoch`                                    | 擁有已暫停執行作業的處理程序時期；用於重新啟動後取消孤立資料列。                                                                                              |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | 權威時間資訊。                                                                                                                                                |
| `decision`                                         | 存在明確使用者決定時所記錄的決定。                                                                                                                            |
| `terminal_reason`                                  | 封閉式原因，例如 `user`、`timeout`、`malformed-verdict`、`no-route`、`run-aborted` 或 `gateway-restart`。                                                      |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | 保留於伺服器端的勝出結果與稽核身分。審查者投影省略原始解決者識別碼。                                                                                          |
| `consumed_at_ms`, `consumed_by`                    | `allow-once` 的獨立重播防護；取用時不得清除已記錄的決定。                                                                                                     |

必要索引：

- 唯一 `(resolution_ref)`；插入時也會拒絕跨欄位的 `approval_id`／`resolution_ref` 歧義
- `(status, expires_at_ms)`
- `(source_session_key, created_at_ms DESC)`
- 用於保留期修剪的 `(resolved_at_ms)`

對象陣列規模小且有界。依工作階段篩選的重播會先透過 Kysely 選取可見的待處理資料列，接著在應用程式碼中解碼並篩選有界的對象陣列；它不使用字串比對或原始 SQL JSON 查詢。

終端資料列保留 30 天，與 `src/audit/audit-event-store.ts` 中的中繼資料稽核保留期一致。修剪是固定的維護政策，而不是新的設定介面。資料庫是私有的本機控制平面狀態，但審查者 API 絕不可公開完整的已儲存請求或執行階段繫結。

## 狀態機與比較並設定

只有下列轉換有效：

- `pending -> allowed`：明確的 `allow-once` 或 `allow-always`。
- `pending -> denied`：明確拒絕、受信任但格式錯誤的終端裁決，或沒有傳遞路徑。
- `pending -> expired`：到達權威截止時間。
- `pending -> cancelled`：執行中止、正常關閉，或重新啟動後的孤立作業復原。

所有非允許的終端狀態，其實際裁決皆為拒絕。

解決程序會使用一個立即執行的 SQLite 交易，以及等同於下列內容的 Kysely 條件式更新：

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

若更新未影響任何資料列，同一個交易會讀取該記錄：

- 不存在或未獲授權：傳回找不到；不得透露其是否存在。
- 仍為待處理但已到達截止時間：以比較並設定將其設為 `expired`，然後傳回該終端資料列。
- 與已記錄的決定相同：傳回冪等成功結果，並包含已記錄的勝出者。
- 決定不同：統一 API 傳回 `applied: false` 並包含已記錄的勝出者；舊版轉接器則在其已發布合約要求時保留 `APPROVAL_ALREADY_RESOLVED`。
- 任何終端狀態：絕不修改。

`now == expires_at_ms` 表示已過期。閘道時間為權威時間。

`allow-once` 執行會針對 `consumed_at_ms IS NULL` 使用第二次 CAS，並繫結至現有且完全相符的命令／系統執行環境。核准資料列在取用後仍保留為稽核記錄。

無法驗證身分或無法識別核准項目的格式錯誤 HTTP/RPC 輸入，會在不進行任何修改的情況下遭拒，且絕不可能核准。對於已知核准項目，若從受信任的測試框架／等待器收到格式錯誤的終端裁決，則會轉換為 `denied`。

## 閘道 API

新增不區分種類的審查者方法：

| 方法                                      | 合約                                                                                                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | 傳回可見的待處理投影，或仍在保留期內的終端投影。                                                                                                                                                                             |
| `approval.resolve { id, kind, decision }` | 接受標準 ID 或固定大小的傳輸參照，接著執行授權、種類與允許決定驗證、截止時間校正，以及終端 CAS。回應一律包含標準 ID。                                                                                                          |

CAS 成功後，立即傳回已提交的投影。舊版事件、頻道轉送器及推送終止器均為盡力而為的後續處理；緩慢或失敗的介面不得延遲或復原勝出的回應。

種類特定的請求驗證仍保留於 `exec.approval.request` 與 `plugin.approval.request`。現有的 `exec.approval.get/list/waitDecision/resolve` 與 `plugin.approval.list/waitDecision/resolve` 會成為通往標準服務的通訊協定邊界轉接器，因為它們是已發布的閘道 API。內部呼叫端會在同一項變更中遷移至該服務。

審查者投影是一個帶標記的聯集：

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

穩定路徑是衍生而來，而非持久儲存。`approval.get` 會傳回 `urlPath`；已知經核准公開來源的介面也可收到絕對 `url`。審查者快照省略來源及對象工作階段金鑰。閘道會將這些路由金鑰保留在伺服器端，供獨立的 `session.approval` 投影使用。

## 事件與可攜式動作

PR 1 保留已發布的事件名稱、承載資料及現有的記錄層級接收者篩選：

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

這些舊版事件可能包含完整的執行階段請求，因此不得將其扇出至每個核准範圍的用戶端。PR 5 會透過經過清理的生命週期投影新增帶標記的生命週期欄位（`status`、`sourceSessionKey`、`urlPath`、終端中繼資料，以及展示層級的 `kind`），而不是擴大舊版事件的傳遞範圍。

新增核准範圍的 `session.approval` 投影事件。使用持久儲存的對象金鑰發布一次標準事件；完全相符的工作階段訂閱者會針對每個相符金鑰收到相同事件：

- `sessionKey`：接收投影的串流。
- `sourceSessionKey`：觸發關卡的子項／來源。
- `phase`：`pending \| terminal`，依核准狀態進行判別。
- 一個安全的 `OperatorApproval` 投影。

用戶端透過 `sessions.messages.subscribe { key, agentId?, includeApprovals: true }` 選擇加入。成功的回應會新增一個 `approvalReplay`，其中最多包含 1,000 個該精確串流金鑰目前的待處理核准項目，且訂閱用戶端也必須具備記錄層級的審查授權。`truncated: false` 表示經篩選的重播具有權威性，重新連線的用戶端會以其取代本機待處理集合；`truncated: true` 則是過載訊號，用戶端必須保留尚未看見的本機項目，直到標準查詢或後續生命週期事件使其確定為止。若重播期間發現後續的持久逾時，則會在傳回新快照之前，僅向已訂閱且具備記錄層級授權的對象發出終端墓碑。`operator.admin` 可直接選擇加入；權限較窄的用戶端則同時需要配對的裝置身分與 `operator.approvals`。僅訂閱工作階段絕不會授予核准可見性。

在 `src/gateway/server-broadcast.ts` 中，將事件註冊於 `operator.approvals` 之下。此投影僅供觀察：它絕不附加逐字記錄資料列、不發出 `sessions.changed`，也不喚醒代理程式。

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

當有經核准的絕對 Control UI 來源可用時，核心會建立具型別的決定動作及獨立的審查連結。頻道會將核准動作編碼為自身的回呼格式，並將解決要求傳送至標準服務。當完全相符的標準 ID 可容納於回呼中時，回呼會使用該 ID；否則使用資料列唯一的完整摘要 `resolution_ref`。該參照僅是精簡的查詢金鑰：一般閘道身分驗證、記錄授權、明確種類、允許決定驗證、截止時間校正及首答 CAS 仍然適用。頻道不得截斷 ID、解析雜湊前綴、剖析 `/approve` 文字，或從 ID 前綴推斷種類。

保留 `button.url`、`button.webApp` 及命令支援的核准控制項，作為已淘汰的外掛 SDK 相容性輸入。在 SDK 邊界將其正規化；並在同一個 PR 中遷移所有內建內部呼叫端。`/approve {id} {decision}` 仍是文字後援與命令列介面／聊天命令，而非按鈕的語意合約。

## Control UI

路由為 `${basePath}/approve/{approvalId}`。ID 是唯一的路徑參數；來源工作階段身分來自記錄。

因為目前的路由器具有精確的靜態路由，並會將未知路徑重寫至 Chat，所以應在一般路由正規化之前，於 `ui/src/app/bootstrap.ts` 中偵測此深層連結。重用一般的閘道／驗證設定，但在側邊欄外殼與全域對話框之外，呈現獨立的核准頁面。

此文件由提供其 URL 的閘道所擁有。其初始連線會忽略完整應用程式中持久化的遠端閘道選擇，但不會變更或複製該選擇的設定；只有驗證會維持在提供服務之閘道的工作階段範圍內。受信任的原生驗證或另外確認的 `gatewayUrl` 覆寫可以重新指定其目標。核心會在外掛 HTTP 路由與靜態擴充功能偵測之前，保留單一區段的 `/approve` 命名空間，包括以 `.json` 或 `.js` 結尾的 ID；停用 Control UI 服務時，保留的路由會以 `404` 關閉存取。將此頁面保留在主要 Control UI 套件組合中，避免延遲載入區塊失敗時，讓安全性決策受困於載入動畫。

頁面狀態：

- 載入中
- 需要驗證
- 待處理
- 正在處理
- 已在此處核准或拒絕
- 已在其他位置處理
- 已過期
- 已取消
- 禁止存取／找不到
- 連線錯誤，可重試

此頁面會呼叫閘道 RPC，而非另一個未經驗證的 REST API。重新整理瀏覽器會重新讀取持久化狀態。它絕不會將閘道認證資訊放入 URL、查詢字串或片段中。

## 授權與隱私權

URL 是定位資訊，而非權限依據。處理需要：

1. 已驗證的閘道連線；
2. `operator.approvals` 或 `operator.admin`；
3. 記錄層級的審核者授權。

記錄層級規則：

- `operator.admin` 可以審核。
- 若有 `reviewer_device_ids`，即以其為準。只有列於其中且已配對的
  `operator.approvals` 裝置可以審核；除非提出要求的裝置也列於其中，
  否則不會隱含取得存取權。
- 若沒有明確的審核者清單，提出要求且已配對的
  `operator.approvals` 裝置可以審核自己的記錄。
- 確實沒有要求者或審核者繫結的舊版記錄，會保留廣泛的
  已配對裝置可見性，以免升級導致已在等待中的工作無法處理。
- 無裝置的內部執行階段可以透過限定範圍的
  核准執行階段連線進行處理，但無法讀取。該權限僅來自
  由伺服器驗證的執行階段權杖；公開的 `approval.resolve` 欄位無法
  建立該權限。
- 即時要求者連線的擁有權對舊版轉接器仍然有效；絕不會
  根據相符的用戶端名稱推斷。
- 對象成員資格只會變更呈現方式，絕不會擴大授權範圍。

`approval.get` 只會公開經過清理的審核者投影，並省略內部來源／對象路由鍵。PR 5 的 `session.approval` 事件會攜帶其唯一目的地 `sessionKey`，以及閘道在伺服器端套用持久化的對象快照後所附加的 `sourceSessionKey`。現有的 exec／外掛事件會保留其歷史酬載與受限的接收者，直到使用端完成移轉。可執行的要求、命令繫結與接續內容只會保留在程序本機的等待器中。持久化資料列包含安全的呈現內容，以及生命週期、路由與稽核中繼資料；絕不會儲存原始環境值、認證資訊、驗證標頭或頻道回呼資料。

## 對象投影

在插入前只計算一次受眾，並保存排序後的快照。擁有權是圖狀結構，不一定是單一父系鏈：子項目可能同時有目前的控制者與原始請求者，而這些擁有者可能導向不同的根節點。

使用確定性的廣度優先走訪：

1. 以來源工作階段金鑰初始化佇列。
2. 對每個從佇列取出的金鑰，讀取最新的子代理程式登錄資料列，並依固定順序將兩個不同的擁有權邊加入佇列：先是 `controllerSessionKey`，再來是 `requesterSessionKey`。
3. 存在可用的登錄資料列時，不要再沿著工作階段項目中可能在導向後已過時的譜系走訪。否則，將單一目前備援邊 `parentSessionKey ?? spawnedBy` 加入佇列。
4. 在加入佇列時正規化並去除重複項目，讓第一條最短路徑優先。
5. 達到 64 個唯一金鑰時停止；此受眾大小上限也會限制走訪深度。

登錄來源為 `src/agents/subagent-registry-read.ts`；擁有權欄位定義於 `src/agents/subagent-registry.types.ts`。工作階段備援欄位定義於 `src/config/sessions/types.ts`。

即使焦點／控制者擁有權在核准待處理期間發生變更，請求與終止投影仍會使用同一個已保存的受眾。這可確保每個曾收到請求投影的受眾工作階段串流都會執行終止清理。解析一律以來源核准 ID 為目標；受眾工作階段絕不會收到複製的核准狀態。轉送的頻道訊息清理仍是下方另一個獨立的傳遞定位器後續作業。

不要僅因核准而寫入文字記錄訊息、注入系統提示、啟動擁有者回合，或發出 `sessions.changed`。

## 已傳遞介面收斂

原生核准處理常式已將其已傳遞訊息項目保留足夠長的時間，以便取代或停用有效控制項。一般轉送的核准訊息目前會捨棄 `MessageReceipt`，因此在其他介面做出決定後，其舊控制項可能仍顯示為待處理。另一項後續工作會在共用狀態資料庫中新增 `operator_approval_deliveries` 子資料表，以補足此缺口。

每一列會儲存核准 ID、唯一的傳遞 ID、頻道／帳號／精確路由、經 JSON 驗證且有界限的頻道私有訊息定位資訊、傳遞時間戳記，以及終止狀態。它絕不儲存回呼資料、決策權杖或原始核准請求。頻道負責定位資訊編碼和訊息變更；核心負責標準狀態、目標選擇、重試政策，以及備援終止文字。

傳遞登錄與終止狀態解析可安全地處理競態條件：

1. 待處理的傳送作業傳回其收據後，在同一個交易中插入遞送定位資訊，並讀取父層核准狀態。
2. 如果父層已處於終止狀態，則排程立即終止，而不是讓延遲的遞送維持待處理狀態。
3. 每次提交的終止狀態轉換都會分別排程所有尚未完成的遞送資料列；可捨棄的廣播並非觸發條件。
4. 頻道終止處理器會回報 `replaced`、`retired` 或 `unsupported`。已取代會抑制重複的終止訊息；已退役會傳送現有的終止後續訊息；不支援或失敗時則使用備援處理，且不會回復核准 CAS。
5. 啟動時會重試仍有未完成遞送的終止核准，使清理作業能抵禦閘道重新啟動。

此傳輸生命週期是選用的遞送介接器鉤子，而非轉譯器或面向模型的訊息動作。QQ C2C／群組訊息目前沒有編輯、刪除或清除鍵盤 API；該介接器仍不受支援，且在傳輸層取得變更 API 之前，只能於後續點擊後顯示標準真實狀態。

## 重新啟動、逾時與路由語意

SQLite 持久化不代表執行可恢復。命令／工具繫結會保留在記憶體中，因為其中可能包含安全性敏感的執行階段資訊，且不構成可恢復的工作契約。

閘道啟動時：

- 產生新的執行階段 epoch；
- 以原子操作將較舊 epoch 的待處理資料列轉換為 `cancelled`，原因為 `gateway-restart`；
- 保留資料列，讓其 URL 能說明發生了什麼事；
- 絕不針對缺少執行階段繫結的項目執行後續核准。

計時器是喚醒最佳化機制。期限的權威資料儲存在 `expires_at_ms`；讀取、等待和解析都會執行到期狀態調節。

最終的嚴格行為：

- 逾時 -> `expired`，拒絕；
- 無路由 -> `denied`，拒絕；
- 執行中止 -> `cancelled`，拒絕；
- 格式錯誤的可信裁決 -> `denied`，拒絕；
- 只有明確允許的 allow 決策 -> `allowed`。

目前已發布的 exec 行為仍與此契約衝突：

- `src/agents/bash-tools.exec-host-shared.ts` 可能會套用 `askFallback`。
- `docs/tools/exec-approvals.md` 和 `docs/cli/approvals.md` 記載了此介面。

外掛核准現在會在逾時和裁決格式錯誤時採取失敗即關閉；舊版
`timeoutBehavior` 欄位仍會被接受，但會遭忽略。exec 嚴格語意的
後續工作必須同時更新程式碼、型別、文件、測試和變更日誌，並進行
明確的擁有者／安全性審查。遷移期間，`askFallback` 可以繼續描述
閘門前的原則選擇，但不得將已建立之待處理記錄的逾時轉變為核准。

## 相容性計畫

- 採用增補式閘道通訊協定；不提升通訊協定版本。
- 在外部邊界保留現有的 exec／外掛方法和事件。
- 保留現有 ID，包括 `plugin:` 前綴，但停止將前綴用作型別資訊。
- 保留 `/approve` 文字命令的行為。
- 保留舊版按鈕 URL／Web App 欄位和命令動作，作為外掛 SDK 相容性輸入；新的核心輸出採用型別化格式。
- 在同一次型別化動作變更中遷移所有內建頻道和內部呼叫端。
- 為新的 URL／頁面以及後續的逾時行為變更新增變更日誌項目。
- 不新增引導模式設定。

## 推出計畫

### PR 1：持久化生命週期

- 本設計說明。
- 共用 SQLite 結構描述、Kysely 產生作業、儲存區，以及 30 天清理機制。
- 閘道核准服務、執行階段等待器橋接，以及重新啟動後的孤立項目處理。
- 統一的 `approval.get/resolve`。
- exec／外掛方法轉接器。
- 最先回答者優先、冪等性、到期、授權和消耗測試。
- 此階段尚不變更 UI 或頻道行為。

### PR 2：型別化動作和頻道回呼

- 型別化的核准、URL 和 Web App 動作。
- 核心呈現建構器和外掛 SDK 匯出項目。
- 使用明確擁有者種類的傳輸層私有回呼編碼。
- 對超出傳輸限制的標準 ID 使用持久化固定大小的回呼參照。
- 將內建頻道遷離命令文字和核准 ID 推斷。
- 在被點擊的介面上以標準的最先回答結果為事實，並盡力更新作用中的原生終止狀態；持久化頻道訊息的終止狀態處理仍留待後續進行。
- SDK 和內建頻道測試。

### PR 3：Control UI 深層連結

- 獨立的已驗證核准頁面，以及能感知基底路徑的啟動路由。
- 繫結提供服務的閘道，且不變更操作者已儲存的遠端選項。
- 核心擁有的核准 HTTP 命名空間，包括類似資產的 ID。
- 由閘道建立的 URL 酬載，以及在生命週期事件發布前持續輪詢待處理狀態。
- 行動裝置寬度、重新連線、競爭回答、重新載入和掛載路徑證明。

### PR 4：原生用戶端

- iOS 和 Android 審核介面使用能感知種類的 `approval.get/resolve`；watchOS 透過配對的 iPhone 轉送適合審核者查看的提示和決策。
- Watch 提供其精簡轉送契約支援的 exec 決策：允許一次和拒絕。
- 標準的最先回答終止結果取代本機嘗試決策狀態。
- 遺失或語意不明的解析確認會凍結控制項，直到讀回標準狀態為止。
- 先前已發布的閘道 v4 執行個體透過範圍狹窄的舊版方法後援機制保留 exec 審核；若要跨介面保留終止狀態，則必須使用統一方法。
- 審核者警告和擁有者情境在 iPhone、Watch 和 Android 上持續可見。
- 原生單元測試、建置和平台證明。

### PR 5：祖先生命週期傳播

- 從 PR 1 持久化的受眾快照傳送 `session.approval` 待處理／終止狀態。
- 精確工作階段訂閱、重新連線重播，以及不變更逐字稿或喚醒代理程式的終止墓碑。
- 生命週期回呼會在持久化插入／CAS 後執行，且絕不成為核准權威。
- 巢狀子代理程式和重新連線證明。

### PR 6：失敗即關閉行為

- 將 `node-invoke-plugin-policy.ts` 和內嵌外掛代理程式遷離重複的權威來源。
- 嚴格的逾時、格式錯誤、無路由、繫結和單次允許消耗語意。
- 棄用已發布的寬鬆逾時設定，且在 ask 處於待處理狀態後不再遵循這些設定。
- 多介面競爭和故障注入證明。

### 後續工作：持久化遠端訊息清理

- 持久保存轉送投遞定位資訊，並在重新啟動後將每則已投遞的頻道訊息設為終止狀態。
- 將此傳輸生命週期與標準核准權限及具型別的呈現動作分開處理。

## 測試

必要的重點涵蓋範圍：

- 重新開啟 SQLite 後，仍保留待處理與終止狀態的投影。
- 兩個並行解析器只會產生一個 CAS 勝出者。
- 相同決策的重試以冪等方式成功；衝突的重試會傳回已記錄的勝出者。
- 在截止期限當下或之後進行解析時，不得核准。
- `allow-once` 只能使用一次，且不會清除終止狀態的稽核資料。
- 啟動時會取消較舊的執行階段 epoch。
- 未授權的查詢與解析不會洩露記錄是否存在。
- 明確的審查者允許清單，以及一般已配對的 `operator.approvals` 行為。
- Exec 與外掛的舊版方法共用相同的儲存區。
- 閘道的 request/list/get/resolve 結構描述與可增補的事件承載資料。
- 具型別動作正規化、後援呈現、SDK 匯出，以及內建頻道切換。
- Telegram 回呼編碼包含傳輸層私有資料，且不會根據命令字串進行推斷。
- 直接子項、分支控制器／請求者擁有者、巢狀擁有者、重新指派、工作階段欄位後援、循環，以及受眾人數上限。
- 請求與終止狀態的受眾陣列完全相同。
- 擁有者投影不會造成逐字稿變更或喚醒代理程式。
- Control UI 路由可在 `/` 與已設定的基底路徑運作；重新整理會顯示待處理或終止狀態的實際結果。
- Control UI 與 Telegram 同時回覆時，只會有一個勝出者，落敗方會顯示「已在其他位置解析」。
- 原生核准識別碼與閘道擁有者識別碼在路由與協調過程中，會保留完全一致的 UTF-8 位元組。
- 原生 RPC 系列交涉會為每個獲准的閘道路由固定使用一個標準或舊版系列，且使用後絕不會無提示降級。
- 原生解析確認遺失時，會凍結動作直到完成標準讀回；讀回失敗時，不能捏造勝出者或確認 Watch 重新整理。
- 只有針對完全相符的已配對閘道擁有者，且標準 iPhone 讀回已完成時，才接受 Watch 快照請求的關聯資訊。
- 透過 Testbox/Crabbox 驗證使用者路徑，包括行動裝置寬度的核准頁面、Telegram 動作清理，以及在 Android、iPhone 與 Watch 間完成一輪待處理／解析／逾時落敗者往返流程。

## 可觀測性

輸出結構化且不含內容的狀態轉換記錄，其中包含核准 ID、種類、來源工作階段金鑰、狀態、原因與延遲。絕不記錄預覽或原始繫結。

追蹤：

- 依種類統計的請求數；
- 依種類／狀態／原因統計的終止數；
- 待處理量表；
- 從請求到終止的延遲；
- 解析競爭結果：勝出者、冪等重試、衝突、已過期；
- 投遞路由數與無路由拒絕數；
- 啟動時孤立項目的取消數；
- 受眾人數。

即使後續事件投遞失敗，已提交的狀態轉換仍視為成功。生命週期訂閱者會透過 PR 5 重播與標準查詢進行復原。持久化頻道訊息的終止狀態處理仍是上述獨立的後續工作。

## 待決事項

1. **可從外部連線的 Control UI 來源。** 每個快照都會帶有穩定的相對 `urlPath`。只有在閘道公開成功後，才能根據快取的 Tailscale Serve/Funnel 位置公告絕對 URL；`allowedOrigins`、請求 Host 標頭、`gateway.remote.url`，以及僅供顯示的回送／LAN 候選位置，都不是標準來源。Telegram 可使用其已驗證的 Mini App 包裝器，在啟動程序期間保留核准路徑。在另行審查並建立明確的公開 URL 契約之前，任意反向 Proxy 仍只能使用相對路徑。絕不可讓頻道猜測來源。
2. **Exec 嚴格逾時相容性切換。** 外掛核准逾時現在會以封閉方式失敗，且 `timeoutBehavior` 已淘汰。其餘已發布的 `askFallback` 契約在停止於待處理詢問逾時後授權執行之前，需要經過擁有者／安全性明確審查、更新變更日誌與文件，並做出遷移／淘汰決策。
3. **無閘道的嵌入模式。** 建議：初期僅限本機使用，之後在有閘道時，使其成為標準服務的用戶端。不要公告任何沒有伺服器可解析的深層連結。

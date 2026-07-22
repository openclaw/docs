---
read_when:
    - 你想要為代理程式工作建立隔離的分支與工作目錄
    - 你正在使用 worktree 工作區設定 Workboard 卡片
    - 你需要還原或清理 OpenClaw 管理的工作樹
summary: 在隔離的 Git 簽出中執行代理程式工作，並自動建立快照及清理
title: 受管理的工作樹
x-i18n:
    generated_at: "2026-07-22T10:29:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98ed2579b7243544dbdb550c4b8a292ccd4ab494fd4a45b2404256691c831401
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

受管理的 worktree 會為代理程式任務提供專屬的 git 分支與簽出，而不會在來源儲存庫內放置暫存目錄。OpenClaw 會在其狀態目錄下建立這些 worktree、將其記錄於共用狀態資料庫中，並在移除前建立其已追蹤內容及未被忽略之未追蹤內容的快照。

## 配置與命名

每個 worktree 位於：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

儲存庫指紋是針對標準 git 共用目錄與來源 URL 計算 SHA-256 雜湊後，取其前 16 個十六進位字元。提供的名稱必須符合 `[a-z0-9][a-z0-9-]{0,63}`。若未提供名稱，OpenClaw 會產生 `wt-`，後接八個隨機十六進位字元。

OpenClaw 會在要求的基底參照上建立分支 `openclaw/<name>`。若未提供基底參照，它會擷取 `origin`、在可用時使用遠端預設分支，並在儲存庫離線或沒有可用遠端時改用本機 `HEAD`。

## 佈建忽略的檔案

在來源儲存庫根目錄加入 `.worktreeinclude`，即可將選定的已忽略、未追蹤檔案複製到新的 worktree。此檔案使用 gitignore 模式語法，每行一個模式，並使用 `#` 註解：

```gitignore
.env.local
fixtures/generated/**
```

只有 git 回報為同時遭忽略且未追蹤的檔案才符合條件。已追蹤檔案已透過 git 存在，絕不會由此步驟複製。OpenClaw 不會覆寫或變更已存在的目的地檔案、不會跟隨符號連結目錄，並會保留所複製檔案的模式。它只記錄實際建立的路徑，因此日後編輯資訊清單，也不會讓這些檔案失去清理保護。

## 執行儲存庫設定

如果來源儲存庫中存在 `.openclaw/worktree-setup.sh` 且其可執行，OpenClaw 會以新 worktree 作為目前目錄來執行它。指令碼會收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零結束碼會中止建立作業，並移除新的 worktree 與分支。這是儲存庫本機契約；沒有對應的 OpenClaw 設定鍵。

## 工作階段 worktree

若要從 Git 支援的資料夾啟動隔離聊天並使用 worktree 工作階段：請在控制介面的 New session 頁面使用 **Place** 選擇器選擇閘道來源資料夾，然後選取 **Worktree**（可選擇性指定基底分支與 worktree 名稱）。只有在閘道確認所選資料夾是 Git 簽出後，才會顯示此選項；一般資料夾會直接執行，不會顯示 Git 隔離控制項。當使用中的代理程式工作區由 Git 支援時，iOS 會在 Chat 動作中提供相同選項，而 Android 則會在 New Chat 旁提供。

程式設計代理程式在目前任務之外發現已確認的後續工作時，也可以呼叫 `spawn_task`。控制介面會顯示建議標籤，但不會啟動任何作業；由閘道支援的終端介面則會顯示具有相同動作的互動式提示。選取 **Start in worktree** 會從建議的專案建立新的工作階段專屬 worktree，並將可獨立理解的提示作為其第一輪訊息送出；關閉建議則不會變更儲存庫。建議及其 ID 是暫時性的，不會在閘道重新啟動後保留。

OpenClaw 只會向具備可操作閘道使用者介面的操作員工作階段提供這些工具。頻道工作階段及本機／嵌入式終端介面工作階段在具備可攜式型別化任務動作契約之前，不會收到這些工具。

產生的受管理 worktree 由工作階段擁有，該工作階段中的每次代理程式執行都會使用其簽出。當工作區是儲存庫子目錄時，worktree 會錨定於儲存庫根目錄，而工作階段則從其中對應的子目錄執行。工作階段 worktree 的建立會使用該方法的 `operator.write` 範圍，但儲存庫簽出掛鉤與 `.openclaw/worktree-setup.sh` 步驟只會針對 `operator.admin` 呼叫端執行，因為它們會執行儲存庫程式碼；`.worktreeinclude` 佈建仍適用於所有呼叫端。刪除工作階段時，只有在移除 worktree 不會造成損失的情況下才會將其移除。有未提交變更的 worktree 或包含尚未推送提交的分支會予以保留；每小時清理會為閒置超過 7 天的工作階段 worktree 建立快照，並將近期工作階段活動視為 worktree 活動。已移除的 worktree 仍可依下文所述從其快照還原。

`sessions.create` 可以包含絕對 `cwd`，用於直接在另一個閘道資料夾中執行、搭配 `worktree: true` 選擇來源簽出，或設定配對節點的工作目錄。每個明確主機路徑都需要 `operator.admin`；一般 worktree 聊天建立仍為 `operator.write`，並保持錨定於已設定的工作區。

`sessions.create` 除了 `worktree: true` 外，也接受 `worktreeBaseRef` 與 `worktreeName`，用以選擇基底參照與 worktree 名稱（分支會成為 `openclaw/<name>`）；兩者均維持在 `operator.write`。建立的 worktree 會在建立結果中傳回，並以 `worktree: { id, branch, repoRoot }` 持久保存於工作階段資料列，讓工作階段清單能顯示簽出與分支。刪除工作階段時，如果保留了有未提交變更的簽出，會回報 `worktreePreserved`，而非默默將其留下。

## 快照、清理與還原

移除時會先建立一個包含已追蹤檔案及未被忽略之未追蹤檔案的合成提交，然後將其固定於 `refs/openclaw/snapshots/<id>`。忽略的檔案絕不會進入儲存庫物件資料庫。OpenClaw 只會將實際佈建的忽略檔案儲存在分塊的共用狀態資料庫資料列中；即使 `.worktreeinclude` 日後變更或消失，已記錄的路徑集合仍是權威依據。還原會從不可變快照讀取這些位元組，並重新套用其完整模式。當已記錄的路徑無法再安全建立快照時，自動清理會保留現有 worktree。如果快照建立失敗，移除作業會停止。明確執行強制刪除則可在沒有快照的情況下繼續。

OpenClaw 會套用下列清理規則：

- 執行結束時，只有在 `git status --porcelain` 為空且 `git log HEAD --not --remotes --oneline` 找不到未推送的提交時，才會移除 worktree。否則只會釋放活動鎖定。
- 每小時清理會為閒置超過 7 天且未鎖定、由 Workboard 或工作階段擁有的 worktree 建立快照並移除，即使其中有未提交變更也一樣。手動 worktree 絕不會自動移除。
- 快照記錄可在 30 天內還原。之後清理會刪除快照參照與登錄資料列。
- 執行中的 OpenClaw 程序鎖定，以及任何外部或無法辨識的 git worktree 鎖定，都會保護 worktree 免遭垃圾回收。

還原會在原始快照前提交上重新建立 `openclaw/<name>`，然後將快照差異重建為未暫存的修改及未追蹤檔案。如此可避免合成快照提交進入分支歷史。快照參照仍會保留記錄，作為來源證明。

## 命令列介面

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

設定下的控制介面 **Worktrees** 頁面提供相同動作，另可透過基底分支選擇器建立 worktree；它會顯示每個 worktree 的擁有者（手動、Workboard，或擁有該 worktree 的工作階段，並附有其聊天連結），並在移除作業回報快照失敗時提供強制重試選項。

## 閘道方法

| 方法               | 用途                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | 列出作用中及可還原的 worktree 記錄。                            |
| `worktrees.branches` | 列出儲存庫的本機與遠端分支，供基底參照選擇器使用。    |
| `worktrees.create`   | 建立或重複使用具名的受管理 worktree。                               |
| `worktrees.remove`   | 建立 worktree 快照並將其移除。強制移除會回報 `snapshotError`。 |
| `worktrees.restore`  | 從快照還原已移除的 worktree。                           |
| `worktrees.gc`       | 立即執行閒置、孤立及保留期限清理。                            |

`worktrees.list` 需要 `operator.read`，而會修改狀態的方法需要 `operator.admin`。對於已設定的代理程式工作區，`worktrees.branches` 需要 `operator.write`；任何其他主機路徑則需要 `operator.admin`（與 `sessions.create` 的目前工作目錄門檻一致）。它只會讀取現有參照，絕不會擷取；僅存在於遠端的分支會以遠端限定名稱傳回（`origin/feature-a`），確保每個傳回的名稱都能解析為基底參照。New Session 也可以透過此方法要求型別化的儲存庫狀態；一般目錄或無法使用的簽出不會回傳任何分支，而不會迫使使用者介面根據錯誤字串推斷 Git 功能。

## Workboard 工作區

隨附的 [Workboard 外掛](/zh-TW/plugins/workboard) 可將卡片工作區具現化為受管理的 worktree：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 用於識別來源 git 簽出。`branch` 為選用，並會成為基底參照。對完整主機呼叫端而言，Workboard 會建立或重複使用 `wb-<card-id>`、以受管理簽出作為工作目錄執行子代理程式，並將解析後的路徑與分支寫回卡片。閘道用戶端需要 `operator.admin` 才能進行完整主機具現化。執行結束時，只有在可證明移除簽出不會造成損失的情況下，Workboard 才會將其移除；有未提交變更的工作或未推送的提交會予以保留。

對受工作區約束的呼叫端而言，`path` 與儲存庫根目錄必須完全符合目標代理程式工作區。Workboard 接著會直接在該目錄中執行，並記錄目錄工作區，而不是在主機上具現化受管理的 worktree。目標必須為相同工作區使用可寫入、非共用的 Docker 沙箱，其執行中容器雜湊必須符合要求的掛載與原則，且不得提供提升權限的執行、主機控制、全主機工作階段、持久化的主機／節點執行，或未分類的外掛與 MCP 工具。如果目標原則或執行中容器的範圍更廣，分派會讓卡片維持未認領狀態，並回報不相容狀態。

---
read_when:
    - 你想為代理程式任務建立隔離的分支與簽出目錄
    - 你正在使用 worktree 工作區設定 Workboard 卡片
    - 你需要還原或清理由 OpenClaw 管理的工作樹
summary: 在隔離的 Git 簽出中執行代理程式任務，並自動建立快照及清理
title: 受管理的工作樹
x-i18n:
    generated_at: "2026-07-20T00:47:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a8541b95eb264950f6ff248da0a5c4ab5fa0881a90d5f782bc1e33edd0a0c5d2
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

受管理的工作樹讓代理程式任務擁有自己的 git 分支與簽出，而不會在原始碼儲存庫內放置暫存目錄。OpenClaw 會在其狀態目錄下建立工作樹、將其記錄於共用狀態資料庫，並在移除前建立其已追蹤與未忽略之未追蹤內容的快照。

## 配置與名稱

每個工作樹位於：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

儲存庫指紋是對標準 git 共用目錄與來源 URL 計算 SHA-256 雜湊後，取其前 16 個十六進位字元。提供的名稱必須符合 `[a-z0-9][a-z0-9-]{0,63}`。若未提供名稱，OpenClaw 會產生 `wt-`，後接八個隨機十六進位字元。

OpenClaw 會在要求的基準參照建立分支 `openclaw/<name>`。若未提供基準參照，它會擷取 `origin`，在可用時採用遠端預設分支；若儲存庫離線或沒有可用的遠端，則退回本機 `HEAD`。

## 佈建已忽略的檔案

在原始碼儲存庫根目錄新增 `.worktreeinclude`，即可將選定的已忽略未追蹤檔案複製到新的工作樹。此檔案使用 gitignore 模式語法，每行一個模式，並以 `#` 表示註解：

```gitignore
.env.local
fixtures/generated/**
```

只有 git 回報為同時已忽略且未追蹤的檔案才符合資格。已追蹤檔案已透過 git 存在，此步驟絕不會複製這些檔案。OpenClaw 不會覆寫或變更已存在的目的地檔案、不會跟隨符號連結目錄，並會保留複製檔案的模式。它只記錄實際建立的路徑，因此後續即使編輯資訊清單，也不會讓這些檔案失去清理保護。

## 執行儲存庫設定

如果原始碼儲存庫中存在 `.openclaw/worktree-setup.sh` 且可執行，OpenClaw 會以新工作樹作為目前目錄執行它。指令碼會收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零結束狀態會中止建立作業，並移除新的工作樹與分支。這是儲存庫本機合約；OpenClaw 沒有對應的設定鍵。

## 工作階段工作樹

若要從作用中代理程式的 git 工作區啟動使用工作樹的隔離聊天，請在控制介面的 New session 頁面啟用 **Worktree**（該頁面也提供基準分支選擇器及選填的工作樹名稱），或使用 iOS 上的 Chat 動作選單，或 Android 上 New Chat 旁的更多動作。此選項僅適用於以 git 為基礎，且用戶端具備該能力的代理程式；無法預先檢查的用戶端則會直接顯示閘道錯誤。

程式設計代理程式在發現目前任務範圍外已確認的後續工作時，也可以呼叫 `spawn_task`。控制介面會顯示建議方塊，但不會啟動任何項目；由閘道支援的終端介面則會顯示具有相同動作的互動式提示。選取 **Start in worktree** 會從建議的專案建立全新的工作階段專屬工作樹，並將自足的提示作為第一輪訊息傳送；關閉建議則不會變更儲存庫。建議及其 ID 為暫時性資料，閘道重新啟動後不會保留。

OpenClaw 僅會向具有可操作閘道介面的操作員工作階段公開這些工具。在頻道工作階段及本機／嵌入式終端介面工作階段具備可攜式型別化任務動作合約之前，不會收到這些工具。

產生的受管理工作樹由工作階段擁有，該工作階段中的每次代理程式執行都會使用其簽出。當工作區是儲存庫子目錄時，工作樹會以儲存庫根目錄為基準，而工作階段會從工作樹內對應的子目錄執行。建立工作階段工作樹時會使用該方法的 `operator.write` 範圍，但儲存庫簽出鉤點與 `.openclaw/worktree-setup.sh` 步驟僅會為 `operator.admin` 呼叫者執行，因為它們會執行儲存庫程式碼；`.worktreeinclude` 佈建仍適用於所有呼叫者。只有在能無損執行時，刪除工作階段才會移除工作樹。含有未提交變更的工作樹或具有未推送提交的分支會予以保留；每小時清理會在工作階段工作樹閒置 7 天後建立快照，並將近期工作階段活動視為工作樹活動。已移除的工作樹仍可按照下述方式從快照還原。

當任務以設定的代理程式工作區以外的專案為目標時，`sessions.create` 可以同時包含絕對 `cwd` 與 `worktree: true`。該明確主機路徑需要 `operator.admin`；一般工作樹聊天建立作業仍為 `operator.write`，並以設定的工作區為基準。

`sessions.create` 除了 `worktree: true` 之外，也接受 `worktreeBaseRef` 與 `worktreeName`，用以選擇基準參照及工作樹名稱（分支會成為 `openclaw/<name>`）；兩者皆維持在 `operator.write`。建立的工作樹會在建立結果中傳回，並以 `worktree: { id, branch, repoRoot }` 保存在工作階段資料列中，因此工作階段清單可以顯示簽出與分支。刪除工作階段時，若保留了含有未提交變更的簽出，會將其回報為 `worktreePreserved`，而不會悄悄留下。

## 快照、清理與還原

移除時會先建立包含已追蹤檔案與未忽略之未追蹤檔案的合成提交，再將其固定於 `refs/openclaw/snapshots/<id>`。已忽略檔案絕不會進入儲存庫物件資料庫。OpenClaw 只會將實際佈建的已忽略檔案儲存於分塊的共用狀態資料庫資料列中；即使 `.worktreeinclude` 後續變更或消失，記錄的路徑集合仍是權威依據。還原會從不可變的快照讀取這些位元組，並重新套用其完整模式。當記錄的路徑無法再安全建立快照時，自動清理會保留即時工作樹。如果快照建立失敗，移除作業會停止。明確強制刪除則可在沒有快照的情況下繼續。

OpenClaw 會套用以下清理規則：

- 執行結束時，只有當 `git status --porcelain` 為空，且 `git log HEAD --not --remotes --oneline` 找不到未推送的提交時，才會移除工作樹。否則只會釋放活動鎖定。
- 每小時清理會建立快照，並移除已解除鎖定且閒置超過 7 天、由 Workboard 或工作階段擁有的工作樹，即使其中含有未提交變更亦然。手動工作樹絕不會自動移除。
- 快照記錄在 30 天內皆可還原。之後清理作業會刪除快照參照與登錄資料列。
- 執行中的 OpenClaw 程序鎖定，以及任何外部或無法識別的 git 工作樹鎖定，都會保護工作樹免遭垃圾回收。

還原會在建立快照前的原始提交重新建立 `openclaw/<name>`，接著將快照差異重建為未暫存的修改與未追蹤檔案。如此可避免合成快照提交進入分支歷史。快照參照會繼續保留記錄，作為來源證明。

## 命令列介面

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

設定下的控制介面 **Worktrees** 頁面提供相同的動作，另可透過基準分支選擇器建立工作樹；它也會顯示各工作樹的擁有者（手動、Workboard，或擁有它並附有聊天連結的工作階段），並在移除作業回報快照失敗時提供強制重試。

## 閘道方法

| 方法               | 用途                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | 列出作用中及可還原的工作樹記錄。                            |
| `worktrees.branches` | 列出儲存庫的本機與遠端分支，供基準參照選擇器使用。    |
| `worktrees.create`   | 建立或重複使用具名的受管理工作樹。                               |
| `worktrees.remove`   | 建立快照並移除工作樹。強制移除會回報 `snapshotError`。 |
| `worktrees.restore`  | 從快照還原已移除的工作樹。                           |
| `worktrees.gc`       | 立即執行閒置、孤立與保留期清理。                            |

`worktrees.list` 需要 `operator.read`，而會變更狀態的方法需要 `operator.admin`。對於已設定的代理程式工作區，`worktrees.branches` 需要 `operator.write`；任何其他主機路徑則需要 `operator.admin`（與 `sessions.create` cwd 門檻一致）。它只會讀取現有參照，絕不會擷取；僅存在於遠端的分支會以遠端限定名稱傳回（`origin/feature-a`），因此每個傳回的名稱皆可解析為基準參照。

## Workboard 工作區

隨附的 [Workboard 外掛](/zh-TW/plugins/workboard) 可將卡片工作區具現化為受管理工作樹：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 用於識別原始碼 git 簽出。`branch` 為選填，並會成為基準參照。對於完整主機呼叫者，Workboard 會建立或重複使用 `wb-<card-id>`，以受管理簽出作為工作目錄執行子代理程式，並將解析後的路徑與分支寫回卡片。閘道用戶端需要 `operator.admin` 才能進行完整主機具現化。執行結束時，只有在證實可無損移除時，Workboard 才會移除簽出；未提交的工作或未推送的提交會予以保留。

對於受工作區約束的呼叫者，`path` 與儲存庫根目錄必須與目標代理程式工作區完全相符。之後 Workboard 會直接在該目錄中執行，並記錄目錄工作區，而不是在主機上具現化受管理工作樹。目標必須為相同工作區使用可寫入且非共用的 Docker 沙箱，其即時容器雜湊必須符合要求的掛載與原則，且不得公開提高權限的執行、主機控制、全主機工作階段、持久化的主機／節點執行，或未分類的外掛與 MCP 工具。如果目標原則或即時容器的範圍更廣，分派會讓卡片維持未認領狀態，並回報不相容狀態。

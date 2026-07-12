---
read_when:
    - 你希望為代理工作建立隔離的分支與工作目錄
    - 你正在使用 worktree 工作區設定 Workboard 卡片
    - 你需要還原或清理由 OpenClaw 管理的工作樹
summary: 在隔離的 Git 簽出中執行代理程式任務，並自動建立快照與清理
title: 受管理的工作樹
x-i18n:
    generated_at: "2026-07-12T14:27:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

受管理的工作樹會為代理程式任務提供專屬的 git 分支與簽出，而不會在原始碼儲存庫內放置暫存目錄。OpenClaw 會在其狀態目錄下建立這些工作樹、將其記錄於共用狀態資料庫中，並在移除前對其已追蹤及未被忽略的未追蹤內容建立快照。

## 配置與命名

每個工作樹位於：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

儲存庫指紋是針對標準化的 git 共用目錄與來源 URL 計算 SHA-256 雜湊後，取其前 16 個十六進位字元。提供的名稱必須符合 `[a-z0-9][a-z0-9-]{0,63}`。若未提供名稱，OpenClaw 會產生以 `wt-` 開頭、後接八個隨機十六進位字元的名稱。

OpenClaw 會在要求的基準 ref 上建立 `openclaw/<name>` 分支。若未提供基準 ref，它會擷取 `origin`、在可用時使用遠端預設分支，並在儲存庫離線或沒有可用的遠端時退回使用本機 `HEAD`。

## 佈建被忽略的檔案

在原始碼儲存庫根目錄新增 `.worktreeinclude`，即可將指定的已忽略未追蹤檔案複製到新的工作樹中。此檔案使用 gitignore 模式語法，每行一個模式，並以 `#` 撰寫註解：

```gitignore
.env.local
fixtures/generated/**
```

只有被 git 回報為同時遭忽略且未追蹤的檔案才符合資格。已追蹤的檔案已透過 git 存在，此步驟絕不會複製這些檔案。OpenClaw 不會覆寫目的地檔案，也不會跟隨符號連結目錄，並會保留所複製檔案的模式。

## 執行儲存庫設定

如果來源儲存庫中存在可執行的 `.openclaw/worktree-setup.sh`，OpenClaw 會以新工作樹作為目前目錄來執行該指令碼。該指令碼會收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
```
```text
OPENCLAW_WORKTREE_PATH=<managed worktree>
```
非零結束碼會中止建立流程，並移除新的工作樹與分支。這是儲存庫本機的契約；OpenClaw 沒有對應的設定鍵。

## 工作階段工作樹

若要從作用中代理程式的 git 工作區啟動隔離的聊天，並使用工作樹支援的工作階段：請在控制介面的 New session 頁面啟用 **Worktree**（該頁面也提供基底分支選擇器與選填的工作樹名稱），或使用 iOS 上的 Chat 動作選單，或 Android 上 New Chat 旁的更多動作。此選項僅適用於以 git 為基礎，且用戶端具備該功能的代理程式；無法預先檢查的用戶端則會改為顯示閘道錯誤。

程式設計代理程式在發現目前任務範圍外且已確認的後續工作時，也可以呼叫 `spawn_task`。控制介面會顯示建議方塊，但不會啟動任何項目；由閘道支援的終端介面則會顯示包含相同動作的互動式提示。選取 **Start in worktree** 會從建議的專案建立一個由新工作階段擁有的工作樹，並將可獨立理解的提示作為其第一輪訊息傳送；關閉建議則不會變更儲存庫。建議及其 ID 為暫時性資料，閘道重新啟動後不會保留。

OpenClaw 僅向具有可操作閘道使用者介面的操作者工作階段提供這些工具。頻道工作階段與本機／內嵌終端介面工作階段在具備可攜式型別化任務動作契約之前，不會收到這些工具。

產生的受管理工作樹由工作階段擁有，且該工作階段中的每次代理程式執行都使用其簽出。當工作區是儲存庫的子目錄時，工作樹會錨定於儲存庫根目錄，而工作階段會從其中對應的子目錄執行。建立工作階段工作樹時會使用該方法的 `operator.write` 範圍，但 `.openclaw/worktree-setup.sh` 步驟僅會針對 `operator.admin` 呼叫者執行，因為它會執行儲存庫程式碼；`.worktreeinclude` 佈建仍適用於每個呼叫者。刪除工作階段時，只有在不會造成任何損失的情況下才會移除工作樹。髒工作樹或包含未推送提交的分支會保留可用；每小時清理會為閒置 7 天後的工作階段工作樹建立快照，並將近期的工作階段活動視為工作樹活動。已移除的工作樹仍可依下文所述從其快照還原。

當工作以已設定的代理程式工作區以外的專案為目標時，`sessions.create` 可同時包含絕對 `cwd` 與 `worktree: true`。該明確主機路徑需要 `operator.admin`；一般的工作樹聊天建立仍使用 `operator.write`，並錨定於已設定的工作區。

`sessions.create` 也接受與 `worktree: true` 一起使用的 `worktreeBaseRef` 和 `worktreeName`，以選擇基底參照與工作樹名稱（分支會成為 `openclaw/<name>`）；兩者仍屬於 `operator.write`。建立的工作樹會在建立結果中傳回，並以 `worktree: { id, branch, repoRoot }` 持久儲存在工作階段資料列中，讓工作階段清單可以顯示簽出與分支。刪除工作階段時，若有保留的髒簽出，會回報為 `worktreePreserved`，而不是默默將它留下。

## 快照、清理與還原

移除作業會先建立一個合成提交，其中包含已追蹤檔案及未被忽略的未追蹤檔案，並將其固定於 `refs/openclaw/snapshots/<id>`。被 Git 忽略的檔案會排除在儲存庫物件資料庫之外；由 `.worktreeinclude` 選取的檔案會在還原期間再次複製。如果建立快照失敗，移除作業會停止。明確的強制刪除可以在沒有快照的情況下繼續。

OpenClaw 會套用下列清理規則：

- 執行結束時，只有在 `git status --porcelain` 為空，且 `git log HEAD --not --remotes --oneline` 找不到未推送提交時，才會移除工作樹。否則只會釋放活動鎖定。
- 每小時清理會為閒置超過 7 天且未鎖定、由 Workboard 或工作階段擁有的工作樹建立快照並移除，即使工作樹為髒狀態也是如此。手動工作樹絕不會自動移除。
- 快照記錄會維持可還原狀態 30 天。之後清理作業會刪除快照參照與登錄資料列。
- 有效的 OpenClaw 程序鎖定，以及任何外部或無法辨識的 Git 工作樹鎖定，都會保護工作樹不被垃圾回收。

還原會在建立快照前的原始提交處重新建立 `openclaw/<name>`，然後將快照差異重建為未暫存的修改與未追蹤檔案。如此可避免合成快照提交進入分支歷史。快照參照會繼續記錄為來源資訊。

## 命令列介面

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

設定下的 Control UI **工作樹**頁面提供相同的動作，並支援使用基底分支選擇器建立工作樹；它會顯示每個工作樹的擁有者（手動、Workboard，或擁有該工作樹的工作階段，並附有前往其聊天的連結），且當移除作業回報快照失敗時，提供強制重試選項。

## 閘道方法

| 方法                 | 用途                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | 列出作用中及可還原的工作樹記錄。                                        |
| `worktrees.branches` | 列出儲存庫的本機與遠端分支，供基底參照選擇器使用。                      |
| `worktrees.create`   | 建立或重複使用具名的受管理工作樹。                                      |
| `worktrees.remove`   | 建立工作樹快照並移除。強制移除會回報 `snapshotError`。                  |
| `worktrees.restore`  | 從快照還原已移除的工作樹。                                              |
| `worktrees.gc`       | 立即執行閒置、孤立項目與保留期限清理。                                  |

`worktrees.list` 需要 `operator.read`，而會修改狀態的方法需要 `operator.admin`。對已設定的代理程式工作區使用 `worktrees.branches` 時需要 `operator.write`，而任何其他主機路徑都需要 `operator.admin`（與 `sessions.create` 的 cwd 門檻一致）。它只會讀取現有參照，絕不會擷取；僅存在於遠端的分支會以包含遠端名稱的形式傳回（`origin/feature-a`），確保每個傳回的名稱都能解析為基底參照。

## Workboard 工作區

內建的 [Workboard 外掛](/zh-TW/plugins/workboard)可以將卡片工作區具現化為受管理工作樹：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 用於識別來源 Git 簽出。`branch` 為選用，並會成為基底參照。當派送作業啟動卡片的工作代理程式時，Workboard 會建立或重複使用 `wb-<card-id>`，以受管理簽出作為工作目錄執行子代理程式，並將解析後的路徑與分支寫回卡片。由閘道觸發的具現化需要 `operator.admin`。執行結束時，只有在能證明不會造成任何損失的情況下，Workboard 才會移除簽出；髒工作或未推送的提交會保留可用。

沙箱化的嵌入式代理程式目前會拒絕使用其已設定代理程式工作區以外的任務工作目錄。在沙箱執行階段支援附加式簽出掛載之前，請針對 Workboard 受管理工作樹卡片使用未沙箱化的目標代理程式。

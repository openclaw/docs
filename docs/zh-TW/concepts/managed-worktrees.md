---
read_when:
    - 您想為代理程式任務建立隔離的分支與簽出目錄
    - 您正在為 Workboard 卡片設定 worktree 工作區
    - 您需要還原或清理由 OpenClaw 管理的工作樹
summary: 在隔離的 Git 工作目錄中執行代理任務，並自動建立快照與清理
title: 受管理的工作樹
x-i18n:
    generated_at: "2026-07-11T21:18:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

受管理的工作樹會為代理程式任務提供專屬的 git 分支與簽出，而不會在原始碼儲存庫內放置暫存目錄。OpenClaw 會在其狀態目錄下建立這些工作樹、將其記錄於共用狀態資料庫，並在移除前建立其已追蹤內容及未被忽略之未追蹤內容的快照。

## 配置與名稱

每個工作樹位於：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

儲存庫指紋是對標準 git 共用目錄與來源 URL 進行 SHA-256 雜湊後，取其前 16 個十六進位字元。指定的名稱必須符合 `[a-z0-9][a-z0-9-]{0,63}`。若未指定名稱，OpenClaw 會產生以 `wt-` 開頭、後接八個隨機十六進位字元的名稱。

OpenClaw 會在要求的基準參照處建立分支 `openclaw/<name>`。若未指定基準參照，它會擷取 `origin`，在可用時使用遠端預設分支；若儲存庫離線或沒有可用的遠端，則改用本機 `HEAD`。

## 佈建已忽略的檔案

在原始碼儲存庫根目錄加入 `.worktreeinclude`，即可將選定的已忽略、未追蹤檔案複製到新的工作樹。此檔案使用 gitignore 模式語法，每行一個模式，並以 `#` 表示註解：

```gitignore
.env.local
fixtures/generated/**
```

只有 git 回報為同時已忽略且未追蹤的檔案才符合資格。已追蹤檔案已透過 git 存在，因此此步驟絕不會複製它們。OpenClaw 不會覆寫目的地檔案，也不會跟隨符號連結目錄，並會保留所複製檔案的模式。

## 執行儲存庫設定

如果原始碼儲存庫中存在 `.openclaw/worktree-setup.sh` 且可執行，OpenClaw 會以新工作樹作為目前目錄來執行它。此指令碼會收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零結束狀態會中止建立作業，並移除新的工作樹與分支。這是儲存庫本機契約；OpenClaw 沒有用於此用途的設定鍵。

## 工作階段工作樹

若要從作用中代理程式的 git 工作區啟動隔離的聊天，並使用以工作樹為基礎的工作階段：請在控制介面的 New session 頁面啟用 **Worktree**（該頁面也提供基準分支選擇器及選用的工作樹名稱），或使用 iOS 上的 Chat 動作選單，或 Android 上 New Chat 旁的更多動作。此選項僅適用於以 git 為基礎且用戶端具備該能力的代理程式；無法預先檢查的用戶端則會顯示閘道錯誤。

程式設計代理程式若發現目前任務範圍外且已確認的後續工作，也可以呼叫 `spawn_task`。控制介面會顯示建議籤，不會啟動任何作業；由閘道支援的終端介面則會顯示具有相同動作的互動式提示。選取 **Start in worktree** 會從建議的專案建立新的工作階段專屬工作樹，並將可獨立理解的提示作為其第一輪訊息傳送；關閉建議不會變更儲存庫。建議及其 ID 為暫時性資料，閘道重新啟動後不會保留。

OpenClaw 僅向具有可操作閘道介面的操作員工作階段提供這些工具。頻道工作階段與本機／嵌入式終端介面工作階段不會收到這些工具，直到這些介面具有可攜式型別化任務動作契約為止。

產生的受管理工作樹由工作階段擁有，該工作階段中的每次代理程式執行都會使用其簽出。若工作區是儲存庫的子目錄，工作樹會錨定於儲存庫根目錄，而工作階段會從其中相符的子目錄執行。建立工作階段工作樹會使用該方法的 `operator.write` 權限範圍，但 `.openclaw/worktree-setup.sh` 步驟僅會為 `operator.admin` 呼叫者執行，因為它會執行儲存庫程式碼；`.worktreeinclude` 佈建仍適用於所有呼叫者。只有能無損移除時，刪除工作階段才會移除工作樹。具有未提交變更的工作樹或包含未推送提交的分支會保留；每小時清理會在工作階段工作樹閒置 7 天後建立快照，並將近期工作階段活動視為工作樹活動。已移除的工作樹仍可依下述方式從其快照還原。

當任務的目標是已設定代理程式工作區以外的專案時，`sessions.create` 可同時包含絕對 `cwd` 與 `worktree: true`。該明確的主機路徑需要 `operator.admin`；一般的工作樹聊天建立作業仍只需要 `operator.write`，並會錨定於已設定的工作區。

`sessions.create` 也接受 `worktreeBaseRef` 與 `worktreeName`，可與 `worktree: true` 一起使用，以選擇基準參照與工作樹名稱（分支會成為 `openclaw/<name>`）；兩者仍只需要 `operator.write`。建立結果會傳回所建立的工作樹，並將其以 `worktree: { id, branch, repoRoot }` 的形式持久儲存於工作階段資料列，讓工作階段清單可以顯示簽出與分支。刪除工作階段時，若保留了具有未提交變更的簽出，會回報為 `worktreePreserved`，而不會在未告知的情況下將其留下。

## 快照、清理與還原

移除作業首先會建立一個包含已追蹤檔案與未被忽略之未追蹤檔案的合成提交，並將其固定於 `refs/openclaw/snapshots/<id>`。git 忽略的檔案不會納入儲存庫物件資料庫；由 `.worktreeinclude` 選取的檔案會在還原期間再次複製。若快照建立失敗，移除作業便會停止。明確的強制刪除可在沒有快照的情況下繼續進行。

OpenClaw 會套用以下清理規則：

- 執行結束時，僅在 `git status --porcelain` 為空，且 `git log HEAD --not --remotes --oneline` 未找到任何未推送提交時，才會移除工作樹。否則只會釋放活動鎖定。
- 每小時清理會為閒置超過 7 天且未鎖定、由 Workboard 或工作階段擁有的工作樹建立快照並將其移除，即使工作樹具有未提交變更亦然。手動工作樹絕不會自動移除。
- 快照記錄會保留 30 天以供還原。此後清理作業會刪除快照參照及登錄資料列。
- 運作中的 OpenClaw 程序鎖定，以及任何外部或無法辨識的 git 工作樹鎖定，都會保護工作樹免遭垃圾回收。

還原作業會在建立快照前的原始提交處重新建立 `openclaw/<name>`，接著將快照差異重建為未暫存修改與未追蹤檔案。這可避免合成快照提交進入分支歷史。快照參照仍會記錄為來源依據。

## 命令列介面

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

設定下的控制介面 **Worktrees** 頁面提供相同動作，另可使用基準分支選擇器建立工作樹；該頁面會顯示每個工作樹的擁有者（手動、Workboard，或擁有該工作樹的工作階段，並附上前往其聊天的連結），也會在移除作業回報快照失敗時提供強制重試選項。

## 閘道方法

| 方法                 | 用途                                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| `worktrees.list`     | 列出作用中及可還原的工作樹記錄。                                         |
| `worktrees.branches` | 列出儲存庫的本機與遠端分支，供基準參照選擇器使用。                         |
| `worktrees.create`   | 建立或重複使用具名的受管理工作樹。                                       |
| `worktrees.remove`   | 建立快照並移除工作樹。強制移除會回報 `snapshotError`。                    |
| `worktrees.restore`  | 從快照還原已移除的工作樹。                                               |
| `worktrees.gc`       | 立即執行閒置、孤立項目與保留期限清理。                                   |

`worktrees.list` 需要 `operator.read`，而會進行變更的方法需要 `operator.admin`。對於已設定的代理程式工作區，`worktrees.branches` 需要 `operator.write`；任何其他主機路徑則需要 `operator.admin`（與 `sessions.create` 的 cwd 權限門檻一致）。它只會讀取現有參照且絕不擷取，而僅存在於遠端的分支會以遠端限定名稱傳回（`origin/feature-a`），因此每個傳回的名稱都能解析為基準參照。

## Workboard 工作區

內建的 [Workboard 外掛](/zh-TW/plugins/workboard) 可將卡片工作區具現化為受管理工作樹：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 用於識別原始 git 簽出。`branch` 為選用，並會成為基準參照。派送作業啟動卡片的工作代理程式時，Workboard 會建立或重複使用 `wb-<card-id>`、以受管理簽出作為工作目錄執行子代理程式，並將解析後的路徑與分支寫回卡片。由閘道觸發的具現化需要 `operator.admin`。執行結束時，Workboard 僅會在可證明能無損移除的情況下移除簽出；具有未提交變更的工作或未推送的提交會保留。

目前，受沙箱限制的嵌入式代理程式會拒絕使用位於其已設定代理程式工作區外的任務工作目錄。在沙箱執行階段支援附加式簽出掛載之前，請為使用 Workboard 受管理工作樹的卡片使用不受沙箱限制的目標代理程式。

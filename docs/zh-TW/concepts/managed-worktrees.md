---
read_when:
    - 你想為代理程式任務建立隔離的分支與工作目錄
    - 你正在設定使用 worktree 工作區的 Workboard 卡片
    - 你需要還原或清理由 OpenClaw 管理的工作樹
summary: 在隔離的 Git 工作目錄中執行代理程式任務，並自動建立快照及清理
title: 受管理的工作樹
x-i18n:
    generated_at: "2026-07-14T13:38:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 6f9923f427be2afb507a5296c221b6ca6d2ae03a7a8c92f30755cf15b92c6806
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

受管理的工作樹可讓代理程式任務擁有自己的 git 分支與簽出，而不會在來源儲存庫內放置暫存目錄。OpenClaw 會在其狀態目錄下建立這些工作樹、將其記錄在共用狀態資料庫中，並在移除前建立其已追蹤及未忽略之未追蹤內容的快照。

## 配置與名稱

每個工作樹位於：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

儲存庫指紋是以標準 git 共用目錄和來源 URL 計算 SHA-256 雜湊後的前 16 個十六進位字元。提供的名稱必須符合 `[a-z0-9][a-z0-9-]{0,63}`。若未提供名稱，OpenClaw 會產生 `wt-`，後接八個隨機十六進位字元。

OpenClaw 會在要求的基準 ref 建立分支 `openclaw/<name>`。若未提供基準 ref，它會擷取 `origin`、在可用時使用遠端預設分支，並在儲存庫離線或沒有可用遠端時，退回使用本機 `HEAD`。

## 佈建已忽略的檔案

在來源儲存庫根目錄新增 `.worktreeinclude`，即可將選定的已忽略未追蹤檔案複製到新的工作樹。此檔案使用 gitignore 模式語法，每行一個模式，並以 `#` 表示註解：

```gitignore
.env.local
fixtures/generated/**
```

只有 git 同時回報為已忽略和未追蹤的檔案才符合資格。已追蹤檔案已透過 git 存在，因此此步驟絕不會複製它們。OpenClaw 不會覆寫目的地檔案或跟隨符號連結目錄，並會保留所複製檔案的模式。

## 執行儲存庫設定

若來源儲存庫中存在 `.openclaw/worktree-setup.sh` 且可執行，OpenClaw 會以新工作樹作為目前目錄來執行它。該指令碼會收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零結束狀態會中止建立作業，並移除新的工作樹與分支。這是儲存庫本機合約；OpenClaw 沒有對應的設定鍵。

## 工作階段工作樹

若要從作用中代理程式的 git 工作區啟動隔離聊天，並使用以工作樹為基礎的工作階段：請在控制介面的「新增工作階段」頁面啟用 **工作樹**（該頁面也提供基準分支選擇器和選填的工作樹名稱），或使用 iOS 上的「聊天動作」選單，或 Android 上「新增聊天」旁的更多動作。此選項僅適用於由 git 支援且用戶端具備該功能的代理程式；無法預先檢查的用戶端則會改為顯示閘道錯誤。

程式設計代理程式在發現目前任務以外且已確認的後續工作時，也可以呼叫 `spawn_task`。控制介面會顯示建議籤，而不會啟動任何項目；由閘道支援的終端介面則會顯示包含相同動作的互動式提示。選取 **在工作樹中啟動** 會從建議的專案建立全新的工作階段所屬工作樹，並將自足式提示作為其第一輪內容傳送；關閉建議則不會變更儲存庫。建議及其 ID 均為暫時性資料，不會在閘道重新啟動後保留。

OpenClaw 僅會向具備可操作閘道使用者介面的操作員工作階段公開這些工具。在這些介面具備可攜式具型別任務動作合約之前，頻道工作階段及本機／嵌入式終端介面工作階段不會收到這些工具。

產生的受管理工作樹由工作階段擁有，且該工作階段中的每次代理程式執行都會使用其簽出。當工作區是儲存庫子目錄時，工作樹會錨定於儲存庫根目錄，而工作階段會從其中相符的子目錄執行。工作階段工作樹的建立會使用該方法的 `operator.write` 範圍，但儲存庫簽出掛鉤與 `.openclaw/worktree-setup.sh` 步驟僅會針對 `operator.admin` 呼叫者執行，因為它們會執行儲存庫程式碼；`.worktreeinclude` 佈建仍適用於每位呼叫者。只有在移除工作樹不會造成資料遺失時，刪除工作階段才會移除工作樹。有未提交變更的工作樹或含有未推送提交的分支會保留；每小時清理會為閒置超過 7 天的工作階段工作樹建立快照，並將近期工作階段活動視為工作樹活動。已移除的工作樹仍可依下述方式從其快照還原。

當任務的目標專案不同於所設定的代理程式工作區時，`sessions.create` 可同時包含絕對 `cwd` 與 `worktree: true`。該明確主機路徑需要 `operator.admin`；一般的工作樹聊天建立仍為 `operator.write`，並持續錨定於所設定的工作區。

`sessions.create` 也接受 `worktreeBaseRef` 和 `worktreeName` 搭配 `worktree: true`，以選擇基準 ref 與工作樹名稱（分支會成為 `openclaw/<name>`）；兩者皆維持在 `operator.write`。建立的工作樹會在建立結果中傳回，並以 `worktree: { id, branch, repoRoot }` 保存於工作階段資料列，使工作階段清單能顯示簽出與分支。若刪除工作階段時保留了含有未提交變更的簽出，系統會將其回報為 `worktreePreserved`，而不是在未告知的情況下將其留下。

## 快照、清理與還原

移除前會先建立一個包含已追蹤檔案及未忽略之未追蹤檔案的合成提交，並將其固定於 `refs/openclaw/snapshots/<id>`。git 已忽略的檔案不會納入儲存庫物件資料庫；由 `.worktreeinclude` 選取的檔案會在還原期間再次複製。若建立快照失敗，移除作業即會停止。明確的強制刪除可在沒有快照的情況下繼續。

OpenClaw 會套用以下清理規則：

- 執行結束時，只有在 `git status --porcelain` 為空，且 `git log HEAD --not --remotes --oneline` 找不到未推送提交時，才會移除工作樹。否則只會釋放活動鎖定。
- 每小時清理會為閒置超過 7 天且未鎖定的 Workboard 所屬及工作階段所屬工作樹建立快照並移除，即使其中有未提交變更也一樣。手動工作樹絕不會自動移除。
- 設定 `worktrees.cleanup.maxCount` 或 `worktrees.cleanup.maxTotalSizeGb` 時，清理也會依最近活動時間，從最久未活動的 Workboard 所屬及工作階段所屬工作樹開始建立快照並移除，直到總數量和磁碟大小符合限制為止。所有受管理工作樹都會計入總量，但手動工作樹及其他受保護的工作樹絕不會因限制而被淘汰，因此在有符合資格的工作樹之前，限制可能持續處於超出狀態。設為 0 或未設定會停用該限制。
- 快照記錄可在 30 天內還原。之後清理會刪除快照 ref 與登錄資料列。
- 執行中的 OpenClaw 程序鎖定，以及任何外部或無法辨識的 git 工作樹鎖定，都會保護工作樹不受垃圾回收影響。

還原會在快照前的原始提交重新建立 `openclaw/<name>`，接著將快照差異重建為未暫存的修改和未追蹤檔案。這可避免合成快照提交進入分支歷史記錄。快照 ref 仍會記錄為來源資訊。

## 命令列介面

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

「設定」下的控制介面 **工作樹** 頁面提供相同動作，另可透過基準分支選擇器建立工作樹；它會顯示每個工作樹的擁有者（手動、Workboard，或擁有該工作樹且附有聊天連結的工作階段），並在移除作業回報快照失敗時提供強制重試。其 **清理** 區段可編輯[設定參考](/zh-TW/gateway/configuration-reference#worktrees)中所述的 `worktrees.cleanup` 保留限制。

## 閘道方法

| 方法               | 用途                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `worktrees.list`     | 列出作用中及可還原的工作樹記錄。                            |
| `worktrees.branches` | 列出儲存庫的本機與遠端分支，供基準 ref 選擇器使用。    |
| `worktrees.create`   | 建立或重複使用具名的受管理工作樹。                               |
| `worktrees.remove`   | 建立工作樹快照並將其移除。強制移除會回報 `snapshotError`。 |
| `worktrees.restore`  | 從快照還原已移除的工作樹。                           |
| `worktrees.gc`       | 立即執行閒置、孤立項目與保留限制清理。                            |

`worktrees.list` 需要 `operator.read`，而會變更狀態的方法需要 `operator.admin`。針對已設定的代理程式工作區，`worktrees.branches` 需要 `operator.write`；任何其他主機路徑則需要 `operator.admin`（符合 `sessions.create` 的 cwd 門檻）。它只會讀取現有 ref，絕不會擷取，而僅存在於遠端的分支會以遠端限定名稱傳回（`origin/feature-a`），因此每個傳回名稱都能解析為基準 ref。

## Workboard 工作區

內建的 [Workboard 外掛](/zh-TW/plugins/workboard)可將卡片工作區具現化為受管理工作樹：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 識別來源 git 簽出。`branch` 為選填，並會成為基準 ref。對於具有完整主機權限的呼叫者，Workboard 會建立或重複使用 `wb-<card-id>`、以受管理簽出作為工作目錄執行子代理程式，並將解析後的路徑與分支寫回卡片。閘道用戶端需要 `operator.admin` 才能進行完整主機具現化。執行結束時，Workboard 只有在能證明移除簽出不會造成資料遺失時才會將其移除；有未提交變更的工作或未推送提交會保留。

對於受工作區限制的呼叫者，`path` 與儲存庫根目錄必須完全符合目標代理程式工作區。接著 Workboard 會直接在該目錄中執行，並記錄目錄工作區，而不是在主機上具現化受管理工作樹。目標必須為相同工作區使用可寫入且非共用的 Docker 沙箱，其執行中容器雜湊必須符合要求的掛載與政策，且不得公開提升權限執行、主機控制、主機範圍工作階段、持久化的主機／節點執行，或未分類的外掛與 MCP 工具。若目標政策或執行中容器的權限範圍更廣，分派作業會讓卡片維持未認領狀態，並回報不相容狀態。

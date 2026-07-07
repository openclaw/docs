---
read_when:
    - 你想要為代理任務使用隔離的分支與 checkout
    - 你正在使用 worktree 工作區設定 Workboard 卡片
    - 你需要還原或清理 OpenClaw 管理的工作樹
summary: 在隔離的 git 簽出中執行代理任務，並自動建立快照與清理
title: 受管理的工作樹
x-i18n:
    generated_at: "2026-07-06T21:48:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 10c6522017df3b4a6ac04d6e2493c226c34547ed686b526c29d01cfd34dc5524
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

受管工作樹會為代理任務提供自己的 git 分支與 checkout，而不會將暫存目錄放在來源儲存庫內。OpenClaw 會在其狀態目錄下建立這些工作樹，將它們記錄在共享狀態資料庫中，並在移除前快照其已追蹤與未被忽略的未追蹤內容。

## 版面配置與名稱

每個工作樹位於：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

儲存庫指紋是對標準 git common 目錄與 origin URL 進行 SHA-256 雜湊後的前 16 個十六進位字元。提供的名稱必須符合 `[a-z0-9][a-z0-9-]{0,63}`。若未提供名稱，OpenClaw 會產生 `wt-` 後接八個隨機十六進位字元。

OpenClaw 會在請求的基底 ref 建立分支 `openclaw/<name>`。若未提供基底 ref，它會擷取 `origin`，在可用時使用遠端預設分支，並在儲存庫離線或沒有可用遠端時退回本機 `HEAD`。

## 佈建被忽略的檔案

在來源儲存庫根目錄加入 `.worktreeinclude`，即可將選定的被忽略、未追蹤檔案複製到新的工作樹中。此檔案使用 gitignore 模式語法，每行一個模式，並支援 `#` 註解：

```gitignore
.env.local
fixtures/generated/**
```

只有 git 回報為同時被忽略且未追蹤的檔案才符合資格。已追蹤檔案已透過 git 存在，絕不會由此步驟複製。OpenClaw 不會覆寫目標檔案或跟隨符號連結目錄，並會保留已複製檔案的模式。

## 執行儲存庫設定

如果來源儲存庫中存在 `.openclaw/worktree-setup.sh` 且可執行，OpenClaw 會以新工作樹作為目前目錄執行它。該指令碼會收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零結束會中止建立，並移除新的工作樹與分支。這是儲存庫本機合約；沒有對應的 OpenClaw 設定鍵。

## 工作階段工作樹

使用 **在工作樹中新聊天**，從作用中代理的 git 工作區啟動隔離聊天：在 Control UI 側邊欄使用次要的新聊天動作、在 iOS 上使用聊天動作選單，或在 Android 上使用新聊天旁的更多動作。此動作僅適用於具有該能力的 git 後端代理；無法預檢的用戶端會改為顯示閘道錯誤。

產生的受管工作樹由工作階段擁有，該工作階段中的每次代理執行都會使用其 checkout。當工作區是儲存庫子目錄時，工作樹會錨定在儲存庫根目錄，而工作階段會從其中相符的子目錄執行。工作階段工作樹建立會使用該方法的 `operator.write` 範圍，但 `.openclaw/worktree-setup.sh` 步驟只會對 `operator.admin` 呼叫者執行，因為它會執行儲存庫程式碼；`.worktreeinclude` 佈建仍套用於每個呼叫者。刪除工作階段只有在可無損完成時才會移除工作樹。有變更的工作樹或具有未推送 commit 的分支會保持可用；每小時清理會在工作階段工作樹閒置 7 天後建立快照，並將近期工作階段活動視為工作樹活動。已移除的工作樹仍可依下述方式從其快照還原。

## 快照、清理與還原

移除會先建立一個合成 commit，其中包含已追蹤與未被忽略的未追蹤檔案，並將其釘選在 `refs/openclaw/snapshots/<id>`。被 gitignore 忽略的檔案會排除在儲存庫物件資料庫之外；由 `.worktreeinclude` 選取的檔案會在還原期間再次複製。如果快照建立失敗，移除會停止。明確的強制刪除可以不建立快照而繼續。

OpenClaw 會套用以下清理規則：

- 在執行結束時，只有當 `git status --porcelain` 為空，且 `git log HEAD --not --remotes --oneline` 找不到未推送 commit 時，才會移除工作樹。否則它只會釋放活動鎖。
- 每小時清理會為閒置超過 7 天、未上鎖且由 Workboard 和工作階段擁有的工作樹建立快照並移除，即使它們有變更也一樣。手動工作樹絕不會自動移除。
- 快照記錄會保留可還原狀態 30 天。之後清理會刪除快照 ref 與登錄資料列。
- 即時 OpenClaw 程序鎖，以及任何外來或無法辨識的 git 工作樹鎖，都會保護工作樹不被垃圾回收。

還原會在原始快照前 commit 重新建立 `openclaw/<name>`，然後將快照差異重建為未暫存修改與未追蹤檔案。這會避免合成快照 commit 進入分支歷史。快照 ref 會保留記錄作為來源證明。

## 命令列介面

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Settings 底下的 Control UI **Worktrees** 頁面提供相同的列出、刪除、還原與清理動作。

## 閘道方法

| 方法                | 用途                                          |
| ------------------- | --------------------------------------------- |
| `worktrees.list`    | 列出作用中與可還原的工作樹記錄。             |
| `worktrees.create`  | 建立或重用具名受管工作樹。                   |
| `worktrees.remove`  | 建立快照並移除工作樹。                       |
| `worktrees.restore` | 從快照還原已移除的工作樹。                   |
| `worktrees.gc`      | 立即執行閒置、孤立與保留期清理。             |

`worktrees.list` 需要 `operator.read`。會變更狀態的方法需要 `operator.admin`。

## Workboard 工作區

內建的 [Workboard 外掛](/zh-TW/plugins/workboard) 可以將卡片工作區具體化為受管工作樹：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 識別來源 git checkout。`branch` 是選用項，會成為基底 ref。當派送啟動卡片的 worker 時，Workboard 會建立或重用 `wb-<card-id>`，以受管 checkout 作為其工作目錄執行子代理，並將解析後的路徑與分支寫回卡片。由閘道觸發的具體化需要 `operator.admin`。在執行結束時，Workboard 只有在可證明無損時才會移除 checkout；有變更的工作或未推送 commit 會保持可用。

沙盒化嵌入式代理目前會拒絕其已設定代理工作區之外的任務工作目錄。在沙盒執行階段支援附加式 checkout 掛載前，請對 Workboard 受管工作樹卡片使用未沙盒化的目標代理。

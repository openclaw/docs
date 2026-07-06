---
read_when:
    - 你想要為代理任務使用隔離的分支和簽出工作區
    - 你正在使用 worktree 工作區設定 Workboard 卡片
    - 你需要還原或清理由 OpenClaw 管理的工作樹
summary: 在隔離的 git checkout 中執行代理任務，並自動建立快照與清理
title: 受管理的工作樹
x-i18n:
    generated_at: "2026-07-06T10:49:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89d0933ab3d3bf7235fa42365fd2db9f20e7e78192fb378c5ea0776ab10a9152
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

受管理工作樹會為代理程式任務提供自己的 git 分支與 checkout，而不會把暫存目錄放進來源儲存庫內。OpenClaw 會在其狀態目錄下建立它們，將它們記錄在共享狀態資料庫中，並在移除前快照其已追蹤與未被忽略的未追蹤內容。

## 版面配置與名稱

每個工作樹位於：

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

儲存庫指紋是針對標準 git common 目錄與 origin URL 計算 SHA-256 雜湊後的前 16 個十六進位字元。提供的名稱必須符合 `[a-z0-9][a-z0-9-]{0,63}`。若未提供名稱，OpenClaw 會產生 `wt-` 後接八個隨機十六進位字元的名稱。

OpenClaw 會在要求的基準 ref 建立分支 `openclaw/<name>`。若沒有基準 ref，會擷取 `origin`，在可用時使用遠端預設分支，並在儲存庫離線或沒有可用遠端時退回使用本機 `HEAD`。

## 佈建被忽略的檔案

在來源儲存庫根目錄加入 `.worktreeinclude`，即可將選取的被忽略、未追蹤檔案複製到新的工作樹。此檔案使用 gitignore-pattern 語法，每行一個模式，並支援 `#` 註解：

```gitignore
.env.local
fixtures/generated/**
```

只有 git 回報為同時被忽略且未追蹤的檔案才符合資格。已追蹤檔案已透過 git 存在，絕不會在此步驟中複製。OpenClaw 不會覆寫目的地檔案或跟隨符號連結目錄，並會保留複製檔案的模式。

## 執行儲存庫設定

如果來源儲存庫中存在 `.openclaw/worktree-setup.sh` 且可執行，OpenClaw 會以新工作樹作為目前目錄執行它。該指令碼會收到：

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

非零結束碼會中止建立並移除新的工作樹與分支。這是儲存庫本機合約；沒有對應的 OpenClaw config key。

## 工作階段工作樹

使用 **在工作樹中新建聊天**，從作用中代理程式的 git 工作區啟動隔離聊天：可使用 Control UI 側邊欄中的次要「新聊天」動作、iOS 上的聊天動作選單，或 Android 上「新聊天」旁的更多動作。此動作僅適用於以 git 為基礎且用戶端具備該能力的代理程式；無法預先檢查的用戶端會改為顯示閘道錯誤。

產生的受管理工作樹由該工作階段擁有，且該工作階段中的每次代理程式執行都會使用其 checkout。當工作區是儲存庫子目錄時，工作樹會錨定在儲存庫根目錄，而工作階段會從其中對應的子目錄執行。工作階段工作樹建立會使用方法的 `operator.write` 範圍，但 `.openclaw/worktree-setup.sh` 步驟只會對 `operator.admin` 呼叫者執行，因為它會執行儲存庫程式碼；`.worktreeinclude` 佈建仍會套用於每個呼叫者。刪除工作階段時，只有在可無損完成時才會移除工作樹。髒工作樹或含有未推送提交的分支會保留下來；每小時清理會在工作階段工作樹閒置 7 天後建立快照，並將近期工作階段活動視為工作樹活動。已移除的工作樹仍可依下述方式從其快照還原。

## 快照、清理與還原

移除會先建立一個合成提交，其中包含已追蹤與未被忽略的未追蹤檔案，並將其釘選於 `refs/openclaw/snapshots/<id>`。Gitignored 檔案會排除在儲存庫物件資料庫之外；由 `.worktreeinclude` 選取的檔案會在還原期間再次複製。如果快照建立失敗，移除會停止。明確的強制刪除可以在沒有快照的情況下繼續。

OpenClaw 會套用這些清理規則：

- 在執行結束時，只有當 `git status --porcelain` 為空，且 `git log HEAD --not --remotes --oneline` 找不到未推送提交時，才會移除工作樹。否則只會釋放活動鎖。
- 每小時清理會快照並移除閒置超過 7 天、未鎖定且由 Workboard 與工作階段擁有的工作樹，即使它們是髒的。手動工作樹永遠不會自動移除。
- 快照記錄會保留可還原狀態 30 天。之後清理會刪除快照 ref 與登錄資料列。
- 作用中的 OpenClaw 程序鎖，以及任何外部或無法辨識的 git 工作樹鎖，都會保護工作樹免於垃圾回收。

還原會在原始快照前提交重新建立 `openclaw/<name>`，然後將快照差異重建為未暫存修改與未追蹤檔案。這會讓合成快照提交不進入分支歷史。快照 ref 仍會記錄為來源證明。

## 命令列介面

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

Control UI 的 **工作樹** 頁面提供相同的列表、刪除、還原與清理動作。

## 閘道方法

| 方法                | 用途                                         |
| ------------------- | -------------------------------------------- |
| `worktrees.list`    | 列出作用中與可還原的工作樹記錄。             |
| `worktrees.create`  | 建立或重用具名受管理工作樹。                 |
| `worktrees.remove`  | 快照並移除工作樹。                           |
| `worktrees.restore` | 從快照還原已移除的工作樹。                   |
| `worktrees.gc`      | 立即執行閒置、孤立與保留清理。               |

`worktrees.list` 需要 `operator.read`。變更方法需要 `operator.admin`。

## Workboard 工作區

內建的 [Workboard 外掛](/zh-TW/plugins/workboard) 可以將卡片工作區實體化為受管理工作樹：

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` 識別來源 git checkout。`branch` 是選用項，會成為基準 ref。當派送啟動卡片的 worker 時，Workboard 會建立或重用 `wb-<card-id>`，以受管理 checkout 作為工作目錄執行子代理程式，並將解析後的路徑與分支寫回卡片。由閘道觸發的實體化需要 `operator.admin`。在執行結束時，Workboard 只有在可證明無損時才會移除 checkout；髒工作或未推送提交會保留下來。

沙箱化的嵌入式代理程式目前會拒絕設定的代理程式工作區之外的任務工作目錄。在沙箱執行階段支援附加 checkout 掛載之前，請為 Workboard 受管理工作樹卡片使用未沙箱化的目標代理程式。

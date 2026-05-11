---
read_when:
    - 發布技能或 Plugin
    - 偵錯擁有者或套件範圍錯誤
    - 新增發布使用者介面、CLI 或後端行為
summary: ClawHub 發布對 Skills、Plugin、擁有者、範圍、發行版本與審核的運作方式。
x-i18n:
    generated_at: "2026-05-11T20:24:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# 發佈

ClawHub 發佈是依擁有者界定範圍：每次發佈都會指定一個發佈者，而伺服器會決定已登入使用者是否被允許發佈到該處。

## 擁有者

擁有者是 ClawHub 發佈者識別名稱，例如 `@alice` 或 `@openclaw`。個人擁有者會為使用者建立。組織擁有者可以有多個成員。

發佈時，你可以使用個人擁有者，或選擇你擁有發佈者存取權的組織擁有者。

## Skills

Skills 是從 skill 資料夾發佈。公開頁面為：

```text
https://clawhub.ai/<owner>/<slug>
```

範例：

```text
https://clawhub.ai/alice/review-helper
```

發佈請求包含所選擁有者、slug、版本、變更記錄和檔案。伺服器會在建立發行版本前，驗證執行者是否能以該擁有者身分發佈。

若要在發佈新版本時將現有 skill 移到另一個擁有者，請選擇新的擁有者，並明確確認擁有權移轉。在 CLI/API 中，傳入目標擁有者加上遷移選擇加入：

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Skill 擁有者遷移需要同時具備目前擁有者和目標擁有者的管理員或擁有者存取權。它會保留 skill、版本歷史、統計資料、留言、分支、別名和稽核軌跡；舊擁有者 URL 會繼續透過別名/重新導向路徑運作。

## Plugins

Plugins 使用 npm 樣式的套件名稱。有範圍的套件名稱會在名稱第一部分包含擁有者：

```text
@owner/package-name
```

範圍必須符合所選發佈擁有者。如果你的套件名稱是 `@openclaw/dronzer`，它只能以 `@openclaw` 發佈。如果你要以 `@vintageayu` 發佈，請將套件重新命名為 `@vintageayu/dronzer`。

這可防止套件宣稱發佈者無法控制的組織命名空間。

## 發行流程

1. UI、CLI 或 GitHub 工作流程會收集套件中繼資料和檔案。
2. 發佈請求會連同所選擁有者一起傳送到 ClawHub。
3. 伺服器會驗證擁有者權限、套件範圍、套件名稱、版本、檔案限制和來源中繼資料。
4. ClawHub 會儲存發行版本並開始自動化安全檢查。
5. 新發行版本會在審查和驗證完成前，從一般安裝/下載介面中隱藏。

如果驗證失敗，發行版本不會建立。

## 常見問題

### 套件範圍必須符合所選擁有者

如果套件範圍和所選擁有者不符，ClawHub 會拒絕發佈：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

若要修正，請選擇套件範圍所命名的擁有者，或重新命名套件，使範圍符合你可以用來發佈的擁有者。

如果套件名稱已經有正確範圍，但套件屬於錯誤的發佈者，請改為轉移擁有權：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

只有在你同時擁有目前擁有者和目標發佈者的管理員存取權時，才使用套件或 skill 轉移。套件轉移不會讓你發佈到你無法管理的範圍。

這會保護組織命名空間。名為 `@openclaw/dronzer` 的套件宣稱使用 `@openclaw` 命名空間，因此只有具備 `@openclaw` 擁有者存取權的發佈者可以發佈它。

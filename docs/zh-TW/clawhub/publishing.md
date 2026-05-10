---
read_when:
    - 發布技能或 Plugin
    - 偵錯擁有者或套件範圍錯誤
    - 新增發布 UI、CLI 或後端行為
summary: ClawHub 發布如何用於 Skills、Plugin、擁有者、範圍、發行版本與審查。
x-i18n:
    generated_at: "2026-05-10T19:25:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# 發布

ClawHub 發布是以擁有者為範圍：每次發布都會指定一個發布者，而伺服器會判斷已登入的使用者是否允許在該處發布。

## 擁有者

擁有者是 ClawHub 發布者代號，例如 `@alice` 或 `@openclaw`。個人擁有者會為使用者建立。組織擁有者可以有多位成員。

發布時，你可以使用自己的個人擁有者，或選擇你具備發布者存取權的組織擁有者。

## Skills

Skills 會從 skill 資料夾發布。公開頁面是：

```text
https://clawhub.ai/<owner>/<slug>
```

範例：

```text
https://clawhub.ai/alice/review-helper
```

發布要求會包含所選擁有者、slug、版本、變更記錄和檔案。伺服器會先驗證操作者是否能以該擁有者身分發布，然後才建立發行版本。

若要在發布新版本時將既有 skill 移至另一個擁有者，請選擇新的擁有者，並明確確認擁有權移轉。在 CLI/API 中，傳入目標擁有者加上遷移選擇加入選項：

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Skill 擁有者遷移需要同時具備目前擁有者與目的地擁有者的管理員或擁有者存取權。它會保留該 skill、版本歷史、統計資料、留言、fork、別名和稽核軌跡；舊擁有者 URL 會繼續透過別名/重新導向路徑運作。

## Plugins

Plugins 使用 npm 風格的套件名稱。具範圍的套件名稱會在名稱的第一部分包含擁有者：

```text
@owner/package-name
```

該範圍必須符合所選的發布擁有者。如果你的套件名為 `@openclaw/dronzer`，它只能以 `@openclaw` 發布。如果你以 `@vintageayu` 發布，請將套件重新命名為 `@vintageayu/dronzer`。

這可避免套件聲稱發布者未控制的組織命名空間。

## 發行流程

1. UI、CLI 或 GitHub 工作流程會收集套件中繼資料和檔案。
2. 發布要求會連同所選擁有者傳送至 ClawHub。
3. 伺服器會驗證擁有者權限、套件範圍、套件名稱、版本、檔案限制和來源中繼資料。
4. ClawHub 會儲存發行版本並啟動自動化安全檢查。
5. 新發行版本會先從一般安裝/下載介面隱藏，直到審查與驗證完成。

如果驗證失敗，將不會建立發行版本。

## 常見問題

### 套件範圍必須符合所選擁有者

如果套件範圍與所選擁有者不符，ClawHub 會拒絕發布：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

若要修正，請選擇套件範圍所指名的擁有者，或重新命名套件，使其範圍符合你能以其身分發布的擁有者。

如果套件名稱已經有正確的範圍，但套件屬於錯誤的發布者，請改為移轉擁有權：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

只有在你同時具備目前套件擁有者與目的地發布者的管理員存取權時，才使用套件移轉。它不會讓你發布到你無法管理的範圍中。

這會保護組織命名空間。名為 `@openclaw/dronzer` 的套件聲稱使用 `@openclaw` 命名空間，因此只有具備 `@openclaw` 擁有者存取權的發布者可以發布它。

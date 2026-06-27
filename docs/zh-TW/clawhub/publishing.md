---
read_when:
    - 發布技能或外掛
    - 偵錯擁有者或套件範圍錯誤
    - 新增發布 UI、命令列介面或後端行為
summary: ClawHub 發布對於 Skills、外掛、擁有者、範圍、發行版本與審查的運作方式。
x-i18n:
    generated_at: "2026-06-27T19:02:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# 發布

發布會將 Skills 資料夾或外掛套件傳送到你選擇的擁有者名下的 ClawHub。ClawHub 會檢查你的權杖是否能代表該擁有者發布，驗證中繼資料、名稱、版本、檔案與來源資訊，接著儲存該版本並啟動自動化安全檢查。

如果驗證失敗，將不會發布任何內容。新版本也可能在審查完成前，不會出現在一般安裝與下載介面中。

## Skills

最簡單的發布路徑是命令列介面。登入後，發布本機 Skills 資料夾：

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

發布到組織擁有者時，請使用 `--owner <handle>`。省略它則會以已驗證使用者身分發布。發布會略過未變更的內容。新的 Skills 會從 `1.0.0` 開始，後續變更會自動發布下一個修補版本。只有在需要明確版本時才傳入 `--version`。

對於目錄儲存庫，請使用 ClawHub 的可重複使用
[`skill-publish.yml` 工作流程](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)。
它會對 `root`（預設：`skills`）底下每個直接的 Skills 資料夾呼叫 `skill publish`，或只對以 `skill_path` 提供的資料夾呼叫。

```yaml
jobs:
  publish:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      owner: <owner>
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

使用 `dry_run: true` 可在不發布的情況下預覽新增與已變更的 Skills。

## 外掛

外掛使用 npm 風格的套件名稱。具範圍的套件名稱會在名稱第一部分包含擁有者：

```text
@owner/package-name
```

範圍必須符合選取的發布擁有者。如果你的套件命名為 `@openclaw/dronzer`，它只能以 `@openclaw` 發布。如果你以 `@vintageayu` 發布，請將套件重新命名為 `@vintageayu/dronzer`。

這可防止套件宣稱發布者無法控制的組織命名空間。

如果你是已在 ClawHub 上被宣稱或保留的組織、品牌、套件範圍、擁有者代號或命名空間的正當擁有者，請開立
[組織 / 命名空間宣告議題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，並附上公開、非敏感的證明。請參閱
[組織與命名空間宣告](/zh-TW/clawhub/namespace-claims)，了解應包含哪些內容，以及哪些內容不應放入公開議題。

### 發布外掛前

- 選擇與套件範圍相符的擁有者。
- 包含 `openclaw.plugin.json`。程式碼外掛還需要含有 `openclaw.compat.pluginApi` 與 `openclaw.build.openclawVersion` 的 `package.json`。
- 若要顯示自訂外掛卡片圖示，請在 `openclaw.plugin.json` 中加入 `icon`，其值可為任何 HTTPS 圖片 URL。
- 包含來源儲存庫與精確提交中繼資料，或從 GitHub 支援的 checkout 使用命令列介面，讓它可以偵測這些資訊。
- 發布前執行 `clawhub package validate <source>`。對於套件、資訊清單、SDK 匯入或成品相關發現，請參閱
  [外掛驗證修正](/zh-TW/clawhub/plugin-validation-fixes)。
- 建立版本前執行 `clawhub package publish <source> --dry-run`。
- 預期新版本在自動化安全檢查與驗證完成前，不會出現在公開安裝介面中。

### 套件的受信任發布

套件受信任發布是兩步驟設定：

1. 先透過一般手動或權杖驗證的 `clawhub package publish` 發布套件一次。這會建立套件列，並設定可變更其受信任發布者設定的套件管理員。
2. 套件管理員設定 GitHub Actions 受信任發布者設定：

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

設定完成後，未來支援的 GitHub Actions 發布可以使用 OIDC/受信任發布，而不需要在儲存庫中儲存長期有效的 ClawHub 權杖。設定的儲存庫與工作流程檔名必須符合 GitHub Actions OIDC 宣告。如果你也傳入 `--environment <name>`，GitHub Actions 環境宣告必須與該名稱完全相符。

設定受信任發布者設定時，ClawHub 會驗證已設定的 GitHub 儲存庫。公開儲存庫可透過公開 GitHub 中繼資料驗證。私有儲存庫需要 ClawHub 具有該儲存庫的 GitHub 存取權，例如透過未來的 ClawHub GitHub App 安裝或其他已授權的 GitHub 整合。

目前可重複使用的套件發布工作流程，在可使用 `id-token: write` 時，支援針對 `workflow_dispatch` 發布進行無密鑰受信任發布。標籤推送的實際發布仍需要 `clawhub_token`，因此請保留 `CLAWHUB_TOKEN` 以用於標籤版本、首次發布、不受信任的套件，或緊急發布。

使用以下命令檢查或移除設定：

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

刪除受信任發布者設定是回復路徑。它會停用未來的受信任發布權杖鑄造，直到套件管理員再次設定為止。

## 常見問題

### 套件範圍必須符合選取的擁有者

如果套件範圍與選取的擁有者不相符，ClawHub 會拒絕發布：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

若要修正，請選擇套件範圍所指定的擁有者，或重新命名套件，使範圍符合你可用來發布的擁有者。

如果套件名稱已具有正確範圍，但套件由錯誤的發布者擁有，請改為轉移擁有權：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

只有在你同時擁有目前擁有者與目的地發布者的管理員存取權時，才使用套件或 Skills 轉移。套件轉移不會讓你發布到你無法管理的範圍中。

如果你無法存取目前擁有者，但認為你的組織、專案或品牌是正當的命名空間擁有者，請開立
[組織 / 命名空間宣告議題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，並附上公開、非敏感的證明以供工作人員審查。提交前請參閱
[組織與命名空間宣告](/zh-TW/clawhub/namespace-claims)。

這會保護組織命名空間。名為 `@openclaw/dronzer` 的套件會宣稱 `@openclaw` 命名空間，因此只有可存取 `@openclaw` 擁有者的發布者才能發布它。

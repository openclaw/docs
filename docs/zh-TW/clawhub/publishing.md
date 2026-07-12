---
read_when:
    - 發布 Skills 或外掛
    - 偵錯擁有者或套件範圍錯誤
    - 新增發布介面、命令列介面或後端行為
summary: ClawHub 對 Skills、外掛、擁有者、範圍、版本發布與審查的發布機制。
x-i18n:
    generated_at: "2026-07-11T21:11:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c0270c0bc3316d970feddfc689c1125e1c90a62beeb40d8098dc6a6752cfa70
    source_path: clawhub/publishing.md
    workflow: 16
---

# 發布

發布會將 Skills 資料夾或外掛套件，以你選擇的擁有者身分傳送至 ClawHub。ClawHub 會檢查你的權杖是否有權代表該擁有者發布、驗證中繼資料、名稱、版本、檔案及來源資訊，接著儲存該版本並啟動自動化安全性檢查。

若驗證失敗，將不會發布任何內容。新版本在審查完成前，也可能不會出現在一般的安裝與下載介面中。

## Skills

最簡單的發布方式是使用命令列介面。登入後，發布本機 Skills 資料夾：

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

發布至組織擁有者時，請使用 `--owner <handle>`。若要以已驗證身分的使用者發布，則省略此參數。發布時會略過未變更的內容。新的 Skills 版本從 `1.0.0` 開始，之後的變更會自動發布下一個修補版本。只有在需要明確指定版本時，才傳入 `--version`。

對於目錄儲存庫，請使用 ClawHub 可重複使用的 [`skill-publish.yml` 工作流程](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)。它會對 `root` 下每個直接的 Skills 資料夾（預設為 `skills`）呼叫 `skill publish`，或只處理以 `skill_path` 提供的資料夾。

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

使用 `dry_run: true` 可預覽新增與變更的 Skills，而不實際發布。

## 外掛

外掛使用 npm 風格的套件名稱。具命名空間的套件名稱會在名稱的第一部分包含擁有者：

```text
@owner/package-name
```

命名空間必須與選定的發布擁有者相符。如果套件名稱為 `@openclaw/dronzer`，就只能以 `@openclaw` 發布。如果要以 `@vintageayu` 發布，請將套件重新命名為 `@vintageayu/dronzer`。

這可防止套件冒用發布者無權控制的組織命名空間。

如果你是某個組織、品牌、套件命名空間、擁有者代號或命名空間的合法擁有者，但該名稱已在 ClawHub 上遭占用或保留，請建立 [組織／命名空間申領問題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，並提供公開且不含敏感資訊的證明。請參閱[組織與命名空間申領](/clawhub/namespace-claims)，了解應包含哪些資訊，以及哪些資訊不應放入公開問題中。

### 發布外掛前

- 選擇與套件命名空間相符的擁有者。
- 包含 `openclaw.plugin.json`。程式碼外掛還需要具有 `openclaw.compat.pluginApi` 與 `openclaw.build.openclawVersion` 的 `package.json`。
- 若要顯示自訂外掛卡片圖示，請在 `openclaw.plugin.json` 中加入 `icon`，其值可為任何 HTTPS 圖片 URL。
- 包含原始碼儲存庫與確切的提交中繼資料；或者在由 GitHub 支援的簽出目錄中使用命令列介面，讓它自動偵測這些資訊。
- 發布前執行 `clawhub package validate <source>`。若遇到套件、資訊清單、SDK 匯入或成品相關問題，請參閱[外掛驗證修正](/clawhub/plugin-validation-fixes)。
- 建立版本前執行 `clawhub package publish <source> --dry-run`。
- 新版本在自動化安全性檢查與驗證完成前，預期不會出現在公開安裝介面中。

### 套件的受信任發布

套件的受信任發布需要兩個設定步驟：

1. 先透過一般手動方式或權杖驗證的 `clawhub package publish` 發布套件一次。這會建立套件資料列，並指定可變更其受信任發布者設定的套件管理者。
2. 由套件管理者設定 GitHub Actions 受信任發布者設定：

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

設定完成後，未來受支援的 GitHub Actions 發布可使用 OIDC／受信任發布，而無須在儲存庫中儲存長效的 ClawHub 權杖。設定的儲存庫與工作流程檔案名稱必須符合 GitHub Actions OIDC 宣告。如果也傳入 `--environment <name>`，GitHub Actions 的環境宣告必須與該名稱完全相符。

設定受信任發布者設定時，ClawHub 會驗證所設定的 GitHub 儲存庫。公開儲存庫可透過公開的 GitHub 中繼資料進行驗證。私人儲存庫則要求 ClawHub 擁有該儲存庫的 GitHub 存取權，例如透過未來安裝 ClawHub GitHub App，或其他已授權的 GitHub 整合。

目前可重複使用的套件發布工作流程，在提供 `id-token: write` 時，支援透過 `workflow_dispatch` 發布進行無密鑰的受信任發布。透過推送標籤進行的實際發布仍需要 `clawhub_token`，因此請保留 `CLAWHUB_TOKEN`，供標籤版本、首次發布、不受信任的套件或緊急發布使用。

使用下列命令檢查或移除設定：

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

刪除受信任發布者設定是回復方式。這會停用後續受信任發布權杖的簽發，直到套件管理者再次設定為止。

## 常見問題

### 套件命名空間必須與選定的擁有者相符

如果套件命名空間與選定的擁有者不相符，ClawHub 會拒絕發布：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

若要修正，請選擇套件命名空間所指定的擁有者，或重新命名套件，使命名空間與你有權代表發布的擁有者相符。

如果套件名稱已有正確的命名空間，但套件歸屬於錯誤的發布者，請改為轉移擁有權：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

只有當你對目前擁有者與目標發布者都具備管理員存取權時，才可轉移套件或 Skills。套件轉移不會讓你發布至無權管理的命名空間。

如果你無權存取目前的擁有者，但認為你的組織、專案或品牌才是該命名空間的合法擁有者，請建立[組織／命名空間申領問題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，並提供公開且不含敏感資訊的證明，以供工作人員審查。提交前請參閱[組織與命名空間申領](/clawhub/namespace-claims)。

這可保護組織命名空間。名為 `@openclaw/dronzer` 的套件會宣告 `@openclaw` 命名空間，因此只有具備 `@openclaw` 擁有者存取權的發布者才能發布該套件。

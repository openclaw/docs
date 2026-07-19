---
read_when:
    - 發布 Skill 或外掛
    - 偵錯擁有者或套件範圍錯誤
    - 新增發布 UI、命令列介面或後端行為
summary: ClawHub 如何處理 Skills、外掛、擁有者、範圍、版本發布與審查。
x-i18n:
    generated_at: "2026-07-19T13:40:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 582dffaf4429e9f24d7c38f2809cc7dc05f8471e4ae2f9c6be60153cc8604e3f
    source_path: clawhub/publishing.md
    workflow: 16
---

# 發布

發布會將 Skills 資料夾或外掛套件傳送至 ClawHub，並歸屬於你選擇的擁有者。ClawHub 會檢查你的權杖是否能以該擁有者身分發布、驗證中繼資料、名稱、版本、檔案與來源資訊，接著儲存該版本並啟動自動化安全檢查。

如果驗證失敗，將不會發布任何內容。新版本也可能不會出現在一般安裝與下載介面中，直到審查完成為止。

## Skills

最簡單的發布方式是使用命令列介面。登入後，發布本機 Skills 資料夾：

```bash
clawhub login
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --owner <owner>
```

發布至組織擁有者時，請使用 `--owner <handle>`。省略此項即可使用已驗證身分的使用者發布。發布時會略過未變更的內容。新的 Skills 會從 `1.0.0` 開始，後續變更則會自動發布下一個修補版本。只有需要明確指定版本時，才傳入 `--version`。

若是目錄儲存庫，請使用 ClawHub 可重複使用的
[`skill-publish.yml` 工作流程](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)。
它會針對 `root`（預設：
`skills`）下的每個第一層 Skills 資料夾呼叫 `skill publish`，或只處理透過 `skill_path` 提供的資料夾。

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

使用 `dry_run: true` 可在不發布的情況下預覽新增及變更的 Skills。

## 外掛

外掛使用 npm 樣式的套件名稱。有範圍的套件名稱會在名稱的第一部分包含擁有者：

```text
@owner/package-name
```

範圍必須與所選的發布擁有者相符。如果套件名稱為 `@openclaw/dronzer`，則只能以 `@openclaw` 身分發布。如果要以 `@vintageayu` 身分發布，請將套件重新命名為 `@vintageayu/dronzer`。

這可防止套件宣稱發布者無權控制的組織命名空間。

如果你是某個組織、品牌、套件範圍、擁有者代號或命名空間的合法擁有者，但該名稱在 ClawHub 上已被宣稱或保留，請建立
[組織／命名空間宣稱問題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，
並提供公開且不含敏感資訊的證明。關於應包含哪些內容，以及哪些內容不應放入公開問題，請參閱
[組織與命名空間宣稱](/clawhub/namespace-claims)。

### 發布外掛之前

- 選擇與套件範圍相符的擁有者。
- 包含 `openclaw.plugin.json`。程式碼外掛還需要包含 `package.json`，其中須有
  `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。
- 若要在首頁和外掛清單頁面顯示自訂外掛目錄圖示，
  請將 `icon` 新增至 `openclaw.plugin.json`，並使用任何 HTTPS 圖片 URL。
- 包含來源儲存庫和確切的提交中繼資料，或在由 GitHub 支援的簽出目錄中使用命令列介面，讓其自動偵測這些資訊。
- 發布前請執行 `clawhub package validate <source>`。若有套件、
  資訊清單、SDK 匯入或成品相關問題，請參閱
  [外掛驗證修正](/clawhub/plugin-validation-fixes)。
- 建立版本前請執行 `clawhub package publish <source> --dry-run`。
- 在自動化安全檢查與驗證完成之前，新版本不會出現在公開安裝介面中。

### 套件的受信任發布

套件的受信任發布需要兩個設定步驟：

1. 先透過一般手動方式或使用權杖驗證的
   `clawhub package publish` 發布套件一次。這會建立套件記錄，並指定可變更其受信任發布者設定的套件管理員。
2. 由套件管理員設定 GitHub Actions 受信任發布者設定：

```bash
clawhub package trusted-publisher set @owner/package-name \
  --repository owner/repo \
  --workflow-filename package-publish.yml
```

設定完成後，未來支援的 GitHub Actions 發布可使用 OIDC／受信任發布，而不必在儲存庫中儲存長期有效的 ClawHub 權杖。設定的儲存庫和工作流程檔名必須與 GitHub Actions OIDC 宣告相符。如果也傳入 `--environment <name>`，GitHub Actions 環境宣告必須與該名稱完全相符。

設定受信任發布者時，ClawHub 會驗證設定的 GitHub 儲存庫。公開儲存庫可透過公開的 GitHub 中繼資料進行驗證。私人儲存庫則需要 ClawHub 擁有該儲存庫的 GitHub 存取權，例如透過未來安裝的 ClawHub GitHub App 或其他已授權的 GitHub 整合。

當 `id-token: write` 可用時，目前可重複使用的套件發布工作流程支援對 `workflow_dispatch` 發布進行無密鑰的受信任發布。透過推送標籤進行實際發布時仍需要 `clawhub_token`，因此請保留 `CLAWHUB_TOKEN`，以供標籤版本、首次發布、不受信任的套件或緊急發布使用。

使用以下命令檢查或移除設定：

```bash
clawhub package trusted-publisher get @owner/package-name
clawhub package trusted-publisher delete @owner/package-name
```

刪除受信任發布者設定是復原方式。在套件管理員重新設定之前，這會停用後續受信任發布權杖的簽發。

## 常見問題

### 套件範圍必須與所選擁有者相符

如果套件範圍與所選擁有者不相符，ClawHub 會拒絕發布：

```text
套件範圍 "@openclaw" 必須與所選擁有者 "@vintageayu" 相符。
請以 "@openclaw" 身分發布，或將此套件重新命名為 "@vintageayu/dronzer"。
```

若要修正此問題，請選擇套件範圍所指定的擁有者，或重新命名套件，使其範圍與你能用來發布的擁有者相符。

如果套件名稱的範圍已正確，但套件由錯誤的發布者擁有，請改為移轉擁有權：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

只有在你對目前擁有者和目的地發布者都具有管理員存取權時，才能移轉套件或 Skills。套件移轉不會讓你發布至無權管理的範圍。

如果你無權存取目前的擁有者，但認為你的組織、專案或品牌才是該命名空間的合法擁有者，請建立
[組織／命名空間宣稱問題](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)，
並提供公開且不含敏感資訊的證明，供工作人員審查。提交前請參閱
[組織與命名空間宣稱](/clawhub/namespace-claims)。

這可保護組織命名空間。名為 `@openclaw/dronzer` 的套件會宣稱
`@openclaw` 命名空間，因此只有能存取 `@openclaw` 擁有者的發布者
才能發布該套件。

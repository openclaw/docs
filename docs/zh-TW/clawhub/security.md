---
read_when:
    - 了解 ClawHub 掃描與審核結果
    - 回報技能或套件
    - 從被暫緩、隱藏或封鎖的上架項目復原
summary: ClawHub 的信任、掃描、回報、申訴與審核行為。
x-i18n:
    generated_at: "2026-05-10T19:26:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83d68ab910ad4812ae79e887d52ff1c5b8248542e1d27d54a81a18cbd821debf
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性 + 審核

ClawHub 開放發布，但公開列表仍會經過信任、
掃描、檢舉與審核控制。目標很實際：協助使用者
檢查他們安裝的內容，為發布者提供誤判的恢復途徑，
並讓濫用套件遠離公開探索。

另請參閱[可接受使用](/zh-TW/clawhub/acceptable-usage)。

## 使用者可以檢查的內容

安裝 skill 或 plugin 之前，請檢查其 ClawHub 列表中的：

- 擁有者與來源歸屬
- 最新版本與變更記錄
- 必要的環境變數或權限
- plugins 的相容性中繼資料
- 掃描或審核狀態
- 顯示時的檢舉、留言、星標、下載與安裝訊號

只安裝你理解且信任的內容。

## 掃描狀態

ClawHub 可能會在公開頁面與擁有者可見的診斷資訊中顯示掃描或審核結果。

常見結果包括：

- `clean`：未發現阻擋性問題。
- `suspicious`：此版本需要謹慎或審查。
- `malicious`：此版本被視為不安全。
- `pending`：檢查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：此版本尚未完全
  可在公開安裝介面中使用。

不同介面的確切措辭可能不同，但實際含義相同：如果某個
版本被保留或封鎖，使用者不應安裝，直到擁有者解決
問題或審核恢復它。

## Skills

Skill 掃描會檢查已發布的 skill bundle、中繼資料、宣告的
需求，以及可疑指示。

ClawHub 會特別留意 skill 宣告內容與其看似執行內容之間的不一致。
例如，引用必要 API key 的 skill 應在 `SKILL.md` 中宣告該需求，
讓使用者能在安裝前看見。

掃描發現以成品為基礎。預期的提供者行為，例如宣告的
API 憑證、localhost OAuth 回呼、範圍限定的解除安裝清理、Basic Auth
編碼，或使用者選取檔案上傳到指定提供者，會與隱藏憑證轉送、
廣泛存取私人檔案、無關的網路目的地，或隱蔽瀏覽器濫用
以不同方式處理。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 版本包含套件中繼資料、來源歸屬、相容性
欄位，以及成品完整性資訊。

OpenClaw 在安裝 ClawHub 代管的 plugins 之前會檢查相容性。套件
記錄也可能公開 digest 中繼資料，讓 OpenClaw 可以驗證下載的
成品。ClawScan 在審查 plugin 版本時會包含已宣告的套件
`openclaw.environment` env/config 中繼資料，使宣告的執行階段需求
可與觀察到的行為比較。

## 檢舉

已登入的使用者可以檢舉 skills、套件與留言。

檢舉應具體且可採取行動。濫用檢舉本身也可能導致
帳號處置。

檢舉範例：

- 誤導性中繼資料
- 未宣告的憑證或權限需求
- 可疑的安裝指示
- 詐騙留言或冒充
- 惡意註冊或商標濫用
- 違反[可接受使用](/zh-TW/clawhub/acceptable-usage)的內容

## 惡意或商標檢舉

ClawHub 對惡意註冊、冒充與商標相關爭議使用相同的檢舉與
工作人員審核流程。這些檢舉需要足夠背景，讓工作人員能識別
申訴方、爭議列表與請求的處置。

請包含：

- 標準 ClawHub skill 或套件 URL，以及擁有者帳號名稱
- 涉及的商標、專案、公司或產品名稱
- 申訴方擁有權或授權的公開證據
- 為什麼目前擁有者未獲授權以該名稱發布
- 請求的處置，例如隱藏待審、轉移擁有權、重新命名，
  或移除

請勿在公開檢舉中放入私人秘密或敏感法律文件。請使用非敏感證據
開啟 GitHub issue，並在需要時向維護者詢問私人交接途徑。

## 申訴與重新掃描

當擁有者認為 skill 或套件被錯誤保留或標記時，可以要求重新掃描。
平台審核者與管理員在處理檢舉或支援請求時，也可以為任何
skill 或套件要求重新掃描：

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

對於受審核的內容，擁有者可能可以從擁有者可見的 ClawHub
介面提交申訴。申訴應說明變更了什麼，或為什麼該標記不正確。

## 審核保留

當靜態掃描器將上傳的 skill 標記為惡意時，發布者會自動被置於
審核保留狀態（在使用者上設定 `requiresModerationAt`）。這會隱藏
該發布者的所有 skills，讓未來發布一開始即為隱藏，並建立
`user.moderation.auto` 稽核記錄項目。

靜態可疑發現會保留為提供給審核者的檔案/行號證據，
但它們本身不會隱藏內容，也不會決定公開掃描裁定。
新上傳會維持在審查/待處理狀態，直到 VirusTotal 與 LLM 審查
完成；靜態掃描只會因惡意簽章而立即阻擋。
ClawScan LLM 審查會保留與目的相符的備註作為指引；只有在
結構化審查包含重大疑慮時，才會回傳
Review/suspicious 裁定。

管理員可以解除誤判保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

這會清除 `requiresModerationAt` 與 `requiresModerationReason`，恢復
因使用者層級保留而隱藏的 skills，並寫入 `user.moderation.lift` 稽核
記錄項目。因其他原因被隱藏，或其自身靜態掃描仍為惡意的 skills，
會維持隱藏。

## 停權與帳號狀態

違反 ClawHub 政策的帳號可能失去發布權限。嚴重濫用
可能導致帳號停權、權杖撤銷、內容隱藏或列表移除。

已刪除、停權或停用的帳號無法使用 ClawHub API tokens。如果 CLI auth
在帳號處置後開始失敗，請登入 Web UI 檢查帳號
狀態，或透過預期的專案支援管道聯絡維護者。

## 發布者指引

若要減少誤判並提升使用者信任：

- 保持名稱、摘要、標籤與變更記錄準確
- 宣告必要的環境變數與權限
- 避免混淆的安裝命令
- 盡可能連結到來源
- 發布 plugins 之前使用 dry runs
- 如果使用者或審核者詢問套件行為，請清楚回應

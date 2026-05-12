---
read_when:
    - 了解 ClawHub 掃描與審核結果
    - 回報技能或套件
    - 恢復遭暫停、隱藏或封鎖的刊登項目
summary: ClawHub 的信任、掃描、回報與審核行為。
x-i18n:
    generated_at: "2026-05-12T23:29:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性與審核

ClawHub 開放發布，但公開清單仍會經過信任、
掃描、回報與審核控制。目標很務實：協助使用者
檢查他們安裝的內容，為發布者提供誤判的復原路徑，
並讓濫用套件遠離公開探索範圍。

另請參閱[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## 使用者可以檢查的內容

安裝 skill 或 plugin 前，請檢查其 ClawHub 清單中的：

- 擁有者與來源署名
- 最新版本與變更記錄
- 所需的環境變數或權限
- plugin 的相容性中繼資料
- 掃描或審核狀態
- 顯示時的回報、留言、星標、下載次數與安裝訊號

只安裝你理解並信任的內容。

## 掃描狀態

ClawHub 可能會在公開頁面與擁有者可見的診斷資訊中顯示掃描或審核結果。

常見結果包括：

- `clean`：未發現封鎖性問題。
- `suspicious`：此版本需要謹慎或審查。
- `malicious`：此版本被視為不安全。
- `pending`：檢查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：此版本未在公開安裝介面上完全可用。

確切措辭可能依介面而異，但實際含義相同：如果版本被保留或封鎖，使用者不應安裝，直到擁有者解決問題或審核恢復它。

## Skills

Skill 掃描會檢查已發布的 skill bundle、中繼資料、宣告的需求，以及可疑指示。

ClawHub 特別注意 skill 宣告內容與其看似執行的行為之間的不一致。例如，引用必要 API key 的 skill 應在 `SKILL.md` 中宣告該需求，讓使用者在安裝前能看見。

掃描發現以成品為依據。預期的提供者行為，例如已宣告的 API 憑證、localhost OAuth 回呼、具範圍的解除安裝清理、Basic Auth 編碼，或使用者選取檔案上傳到所述提供者，會與隱藏憑證轉送、廣泛的私人檔案存取、無關的網路目的地，或隱蔽的瀏覽器濫用作不同處理。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 發布內容包含套件中繼資料、來源署名、相容性欄位，以及成品完整性資訊。

OpenClaw 會在安裝 ClawHub 託管的 plugin 前檢查相容性。套件記錄也可能公開 digest 中繼資料，讓 OpenClaw 能驗證已下載的成品。ClawScan 在審查 plugin 發布內容時，會包含已宣告的套件 `openclaw.environment` env/config 中繼資料，因此會將已宣告的執行階段需求與觀察到的行為進行比較。

## 回報

已登入的使用者可以回報 skill、套件與留言。

回報應具體且可處理。濫用回報本身也可能導致帳號處置。

回報範例：

- 誤導性的中繼資料
- 未宣告的憑證或權限需求
- 可疑的安裝指示
- 詐騙留言或冒名
- 惡意註冊或商標濫用
- 違反[可接受使用方式](/zh-TW/clawhub/acceptable-usage)的內容

## 發布者 ClawScan 備註

發布 skill 或 plugin 時，發布者可以提供選填的 ClawScan 備註。此備註會為 ClawScan 提供行為脈絡，說明可能看起來不尋常的行為，例如網路存取、原生主機存取，或提供者特定憑證。

## 審核保留

當靜態掃描器將上傳的 skill 標記為惡意時，發布者會自動被置於審核保留狀態（使用者上設定 `requiresModerationAt`）。這會隱藏該發布者的所有 skill，使未來發布一開始即為隱藏，並建立一筆 `user.moderation.auto` 稽核記錄項目。

靜態可疑發現會作為檔案/行號證據保留給審核人員，但它們本身不會隱藏內容，也不會決定公開掃描判定。新的上傳會保持在審查/待處理狀態，直到 LLM 審查完成。靜態掃描只會針對惡意特徵立即封鎖。VirusTotal 引擎命中仍會作為可見的安全證據，但 VirusTotal Code Insight/Palm 判定屬建議性質，本身不會隱藏 skill。ClawScan LLM 審查會將符合目的的備註保留為指引。中度審查發現會繼續顯示在成品上，而可疑篩選器則保留給高影響 LLM 疑慮、惡意發現，或經佐證的防毒引擎偵測。

管理員可以解除誤判保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

這會清除 `requiresModerationAt` 和 `requiresModerationReason`，恢復因使用者層級保留而隱藏的 skill，並寫入一筆 `user.moderation.lift` 稽核記錄項目。因其他原因被隱藏的 skill，或其自身靜態掃描仍為惡意的 skill，會維持隱藏。

## 封鎖與帳號狀態

違反 ClawHub 政策的帳號可能會失去發布存取權。嚴重濫用可能導致帳號封鎖、token 撤銷、內容隱藏，或清單移除。

已刪除、被封鎖或停用的帳號無法使用 ClawHub API token。如果帳號處置後 CLI 驗證開始失敗，請登入 Web UI 查看帳號狀態。如果登入或一般 CLI 存取被封鎖，請聯絡 security@openclaw.ai 進行復原審查。

## 發布者指引

若要降低誤判並提升使用者信任：

- 保持名稱、摘要、標籤與變更記錄準確
- 宣告所需的環境變數與權限
- 當版本具有不尋常但有意為之的行為時，新增發布者 ClawScan 備註
- 避免混淆的安裝命令
- 可行時連結到來源
- 發布 plugin 前使用 dry run
- 如果使用者或審核人員詢問套件行為，請清楚回應

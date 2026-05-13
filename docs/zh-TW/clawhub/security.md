---
read_when:
    - 了解 ClawHub 掃描與審核結果
    - 回報 Skills 或套件
    - 從被暫緩、隱藏或封鎖的上架項目復原
summary: ClawHub 的信任、掃描、回報與審核行為。
x-i18n:
    generated_at: "2026-05-13T02:51:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性 + 審核

ClawHub 開放發布，但公開列表仍會經過信任、
掃描、回報與審核控制。目標很務實：協助使用者
檢查他們安裝的內容，為發布者提供誤判的恢復途徑，
並將濫用套件排除在公開探索之外。

另請參閱[可接受使用](/zh-TW/clawhub/acceptable-usage)。

## 使用者可以檢查的內容

在安裝 skill 或 plugin 前，請查看其 ClawHub 列表中的：

- 擁有者與來源歸屬
- 最新版本與變更記錄
- 必要的環境變數或權限
- plugins 的相容性中繼資料
- 掃描或審核狀態
- 顯示時的回報、留言、星標、下載數與安裝訊號

只安裝你理解並信任的內容。

## 掃描狀態

ClawHub 可能會在公開頁面與擁有者可見的診斷中顯示掃描或審核結果。

常見結果包括：

- `clean`：未發現阻擋性問題。
- `suspicious`：此版本需要謹慎或審查。
- `malicious`：此版本被視為不安全。
- `pending`：檢查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：此版本在公開安裝介面上
  未完全可用。

不同介面的確切措辭可能不同，但實際含義相同：如果某個版本被保留或封鎖，
使用者不應安裝，直到擁有者解決問題或審核恢復該版本為止。

## Skills

Skill 掃描會檢查已發布的 skill 套件組合、中繼資料、宣告的
需求，以及可疑指令。

ClawHub 特別關注 skill 宣告內容與其實際表現之間的不一致。例如，引用必要 API 金鑰
的 skill 應在 `SKILL.md` 中宣告該需求，讓使用者在安裝前可以看到。

掃描結果以成品為依據。預期的供應商行為，例如宣告的
API 認證、localhost OAuth 回呼、限定範圍的解除安裝清理、Basic Auth
編碼，或使用者選擇上傳檔案至所述供應商，會與隱藏的認證轉送、廣泛的私人檔案存取、
無關的網路目的地，或隱蔽的瀏覽器濫用以不同方式處理。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 版本包含套件中繼資料、來源歸屬、相容性欄位，
以及成品完整性資訊。

OpenClaw 會在安裝 ClawHub 託管的 plugins 前檢查相容性。套件
記錄也可能公開摘要中繼資料，讓 OpenClaw 可以驗證下載的
成品。ClawScan 在審查 plugin 版本時會包含宣告的套件 `openclaw.environment` env/config
中繼資料，以便將宣告的執行階段需求
與觀察到的行為進行比較。

## 回報

已登入的使用者可以回報 skills、套件與留言。

回報應具體且可執行。濫用回報本身也可能導致
帳號處置。

回報範例：

- 誤導性的中繼資料
- 未宣告的認證或權限需求
- 可疑的安裝指令
- 詐騙留言或冒名頂替
- 惡意註冊或商標濫用
- 違反[可接受使用](/zh-TW/clawhub/acceptable-usage)的內容

## 發布者 ClawScan 註記

發布者可以在發布 skill 或
plugin 時提供選用的 ClawScan 註記。此註記會為 ClawScan 提供可能看起來
不尋常的行為脈絡，例如網路存取、原生主機存取，或供應商特定的
認證。

## 審核保留

當靜態掃描器將上傳的 skill 標記為惡意時，發布者會
自動被置於審核保留狀態（在使用者上設定 `requiresModerationAt`）。
這會隱藏該發布者的所有 skills，導致未來的發布一開始即為
隱藏，並建立一筆 `user.moderation.auto` 稽核記錄項目。

靜態可疑發現會保留為供審核人員使用的檔案/行證據，
但其本身不會隱藏內容，也不會決定公開掃描判定。
新上傳內容會維持在審查/待處理狀態，直到 LLM 審查完成。靜態
掃描只會對惡意特徵立即封鎖。VirusTotal 引擎
命中仍會顯示為安全性證據，但 VirusTotal Code Insight/Palm
判定屬於建議性質，不會單獨隱藏 skills。ClawScan LLM 審查
會將符合目的的註記保留為指引。中等審查發現會保留在
成品上可見，而可疑篩選器則保留給高影響的 LLM
疑慮、惡意發現，或獲 AV 引擎偵測佐證的結果。

管理員可以解除誤判保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

這會清除 `requiresModerationAt` 和 `requiresModerationReason`，恢復
因使用者層級保留而隱藏的 skills，並寫入一筆 `user.moderation.lift` 稽核
記錄項目。因其他原因隱藏，或其自身靜態掃描仍為
惡意的 skills，會維持隱藏。

## 停權與帳號狀態

違反 ClawHub 政策的帳號可能會失去發布存取權。嚴重濫用
可能導致帳號停權、權杖撤銷、內容隱藏，或列表被移除。

已刪除、遭停權或停用的帳號無法使用 ClawHub API 權杖。如果 CLI 驗證
在帳號處置後開始失敗，請登入網頁 UI 檢視帳號
狀態。如果登入或正常 CLI 存取被封鎖，請聯絡
security@openclaw.ai 進行恢復審查。

## 發布者指引

若要降低誤判並提升使用者信任：

- 保持名稱、摘要、標籤與變更記錄準確
- 宣告必要的環境變數與權限
- 當版本具有不尋常但有意為之的行為時，新增發布者 ClawScan 註記
- 避免混淆的安裝命令
- 盡可能連結到來源
- 發布 plugins 前使用 dry runs
- 如果使用者或審核人員詢問套件行為，請清楚回應

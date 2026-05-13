---
read_when:
    - 了解 ClawHub 掃描與審核結果
    - 回報 Skills 或套件
    - 從被保留、隱藏或封鎖的上架項目復原
summary: ClawHub 信任、掃描、回報與審核行為。
x-i18n:
    generated_at: "2026-05-13T04:18:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性 + 審核

ClawHub 開放發布，但公開列表仍會經過信任、
掃描、回報與審核控制。目標很實際：協助使用者
檢查他們安裝的內容，為發布者提供誤判的復原途徑，
並將濫用套件排除在公開探索之外。

另請參閱[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## 使用者可以檢查的內容

安裝 Skill 或 Plugin 前，請檢查其 ClawHub 列表中的：

- 擁有者與來源歸屬
- 最新版本與變更日誌
- 必要的環境變數或權限
- Plugin 的相容性中繼資料
- 掃描或審核狀態
- 顯示時的回報、留言、星標、下載次數與安裝訊號

只安裝你了解且信任的內容。

## 掃描狀態

ClawHub 可能會在公開頁面與擁有者可見的診斷中顯示掃描或審核結果。

常見結果包括：

- `clean`：未發現阻擋性問題。
- `suspicious`：此版本需要謹慎或審查。
- `malicious`：此版本被視為不安全。
- `pending`：檢查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：此版本未完全
  可用於公開安裝介面。

不同介面的確切用語可能不同，但實際含義相同：如果某個
版本被保留或阻擋，使用者不應安裝，直到擁有者解決
問題或審核恢復該版本。

## Skills

Skill 掃描會檢視已發布的 Skill 套件組合、中繼資料、宣告的
需求，以及可疑指示。

ClawHub 特別注意 Skill 宣告內容與其看起來會執行的內容之間的不一致。例如，參照必要 API 金鑰的 Skill
應該在 `SKILL.md` 中宣告該需求，讓使用者在
安裝前可以看到。

掃描結果以成品為依據。預期的提供者行為，例如宣告的
API 憑證、localhost OAuth 回呼、有範圍的解除安裝清理、Basic Auth
編碼，或使用者選取檔案上傳至所述提供者，會與隱藏式憑證轉送、廣泛的私人檔案存取、
無關的網路目的地，或隱密瀏覽器濫用作不同處理。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 版本包含套件中繼資料、來源歸屬、相容性
欄位，以及成品完整性資訊。

OpenClaw 會在安裝由 ClawHub 託管的 Plugin 前檢查相容性。套件
記錄也可能公開摘要中繼資料，讓 OpenClaw 可以驗證下載的
成品。ClawScan 在審查 Plugin 版本時會包含宣告的套件 `openclaw.environment` env/config
中繼資料，因此宣告的執行階段需求會
與觀察到的行為進行比較。

## 回報

已登入的使用者可以回報 Skills、套件與留言。

回報應具體且可採取行動。濫用回報本身也可能導致
帳號處置。

回報範例：

- 誤導性的中繼資料
- 未宣告的憑證或權限需求
- 可疑的安裝指示
- 詐騙留言或冒名
- 惡意註冊或商標濫用
- 違反[可接受使用方式](/zh-TW/clawhub/acceptable-usage)的內容

## 發布者 ClawScan 備註

發布者可在發布 Skill 或 Plugin 時提供選用的 ClawScan 備註。此備註會為 ClawScan 提供可能在其他情況下看起來不尋常之行為的脈絡，例如網路存取、原生主機存取，或提供者特定的
憑證。

## 審核保留

當靜態掃描器將上傳的 Skill 標記為惡意時，發布者會
自動被置於審核保留狀態（在使用者上設定 `requiresModerationAt`）。這會隱藏該發布者的所有 Skills，使未來發布
一開始即為隱藏，並建立 `user.moderation.auto` 稽核日誌項目。

靜態可疑結果會保留為供審核者使用的檔案/行號證據，
但它們本身不會隱藏內容或決定公開掃描判定。
新的上傳會保持在審查/待處理狀態，直到 LLM 審查完成。靜態
掃描只會因惡意特徵碼而立即阻擋。VirusTotal 引擎
命中仍會是可見的安全性證據，但 VirusTotal Code Insight/Palm
判定僅供參考，且本身不會隱藏 Skills。ClawScan LLM 審查
會保留與目的相符的備註作為指引。中等審查結果仍會顯示在
成品上，而可疑篩選器則保留給高影響 LLM
疑慮、惡意結果，或經佐證的 AV 引擎偵測。

管理員可以解除誤判保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

這會清除 `requiresModerationAt` 和 `requiresModerationReason`，還原
因使用者層級保留而隱藏的 Skills，並寫入 `user.moderation.lift` 稽核
日誌項目。因其他原因被隱藏，或其自身靜態掃描仍為
惡意的 Skills，會維持隱藏。

## 封鎖與帳號狀態

違反 ClawHub 政策的帳號可能會失去發布存取權。嚴重濫用
可能導致帳號封鎖、權杖撤銷、內容隱藏，或列表移除。

已刪除、被封鎖或停用的帳號無法使用 ClawHub API 權杖。如果 CLI 驗證
在帳號處置後開始失敗，請登入 Web UI 查看帳號
狀態。如果登入或一般 CLI 存取遭阻擋，請聯絡
security@openclaw.ai 進行復原審查。

## 發布者指引

若要減少誤判並提升使用者信任：

- 維持名稱、摘要、標籤與變更日誌準確
- 宣告必要的環境變數與權限
- 當版本具有不尋常但有意為之的行為時，加入發布者 ClawScan 備註
- 避免混淆化的安裝命令
- 盡可能連結到來源
- 發布 Plugin 前使用試執行
- 如果使用者或審核者詢問套件行為，請清楚回應

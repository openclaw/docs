---
read_when:
    - 了解 ClawHub 掃描與審核結果
    - 回報技能或套件
    - 從遭保留、隱藏或封鎖的上架項目復原
summary: ClawHub 的信任、掃描、回報與審核行為。
x-i18n:
    generated_at: "2026-05-12T12:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性 + 內容審核

ClawHub 開放發布，但公開列表仍會經過信任、
掃描、回報與內容審核控制。目標很務實：協助使用者
檢查他們安裝的內容，為發布者提供誤判的復原途徑，
並防止濫用套件出現在公開探索中。

另請參閱[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## 使用者可以檢查的內容

安裝技能或 Plugin 前，請在其 ClawHub 列表中檢查：

- 擁有者與來源歸屬
- 最新版本與變更記錄
- 必要的環境變數或權限
- Plugin 的相容性中繼資料
- 掃描或內容審核狀態
- 顯示時的回報、留言、星標、下載與安裝訊號

只安裝你理解且信任的內容。

## 掃描狀態

ClawHub 可能會在公開頁面與擁有者可見的診斷資訊中顯示掃描或內容審核結果。

常見結果包括：

- `clean`：未發現阻擋性問題。
- `suspicious`：此版本需要謹慎或審查。
- `malicious`：此版本被視為不安全。
- `pending`：檢查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：此版本未完全
  可在公開安裝介面使用。

確切用語可能因介面而異，但實際意義相同：如果某個版本遭保留或阻擋，
使用者不應安裝，直到擁有者解決問題或內容審核恢復該版本為止。

## Skills

技能掃描會檢查已發布的技能組合包、中繼資料、宣告的
需求，以及可疑指令。

ClawHub 特別重視技能宣告內容與其實際行為之間的不一致。例如，參照必要 API 金鑰的技能
應在 `SKILL.md` 中宣告該需求，讓使用者能在安裝前看到。

掃描發現以成品為依據。預期的供應商行為，例如已宣告的
API 憑證、localhost OAuth 回呼、具範圍的解除安裝清理、Basic Auth
編碼，或由使用者選取並上傳至所述供應商的檔案，會被視為
不同於隱藏的憑證轉送、廣泛的私人檔案存取、
不相關的網路目的地，或隱蔽的瀏覽器濫用。

請參閱[技能格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 版本包含套件中繼資料、來源歸屬、相容性
欄位，以及成品完整性資訊。

OpenClaw 會在安裝 ClawHub 託管的 Plugin 前檢查相容性。套件
記錄也可能公開摘要中繼資料，讓 OpenClaw 可以驗證下載的
成品。ClawScan 在審查 Plugin 版本時會納入已宣告的套件 `openclaw.environment` 環境/設定
中繼資料，以便將已宣告的執行階段需求
與觀察到的行為進行比較。

## 回報

已登入的使用者可以回報技能、套件與留言。

回報應具體且可採取行動。濫用回報本身也可能導致
帳號處置。

回報範例：

- 誤導性中繼資料
- 未宣告的憑證或權限需求
- 可疑的安裝指令
- 詐騙留言或冒充
- 惡意註冊或商標濫用
- 違反[可接受使用方式](/zh-TW/clawhub/acceptable-usage)的內容

## 發布者 ClawScan 備註

發布者可以在發布技能或
Plugin 時提供選用的 ClawScan 備註。此備註會為 ClawScan 提供行為脈絡，說明其他情況下可能看起來
異常的行為，例如網路存取、原生主機存取，或供應商特定
憑證。

## 內容審核保留

當靜態掃描器將上傳的技能標記為惡意時，發布者會
自動被置於內容審核保留狀態（在使用者上設定 `requiresModerationAt`）。這會隱藏發布者的所有技能，使未來發布
一開始即為隱藏，並建立 `user.moderation.auto` 稽核記錄項目。

靜態可疑發現會保留為檔案/行號證據供審核者使用，
但它們不會單獨隱藏內容或決定公開掃描判定。
新上傳內容會維持在審查/待處理狀態，直到 LLM 審查完成。靜態
掃描只會針對惡意特徵立即阻擋。VirusTotal 引擎
命中仍會作為可見的安全性證據，但 VirusTotal Code Insight/Palm
判定屬於建議性質，不會單獨隱藏技能。ClawScan LLM 審查
會保留與目的相符的備註作為指引。中等審查發現會維持顯示在
成品上，而可疑篩選器則保留給高影響的 LLM
疑慮、惡意發現，或經 AV 引擎偵測佐證的結果。

管理員可以解除誤判保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

這會清除 `requiresModerationAt` 與 `requiresModerationReason`，還原
因使用者層級保留而隱藏的技能，並寫入 `user.moderation.lift` 稽核
記錄項目。因其他原因被隱藏，或其自身靜態掃描仍為
惡意的技能，會保持隱藏。

## 停權與帳號狀態

違反 ClawHub 政策的帳號可能會失去發布權限。嚴重濫用
可能導致帳號停權、權杖撤銷、內容隱藏，或列表移除。

已刪除、停權或停用的帳號無法使用 ClawHub API 權杖。如果 CLI 驗證
在帳號處置後開始失敗，請登入網頁 UI 檢查帳號
狀態。如果登入或正常 CLI 存取遭阻擋，請聯絡
security@openclaw.ai 進行復原審查。

## 發布者指引

若要減少誤判並提升使用者信任：

- 保持名稱、摘要、標籤與變更記錄準確
- 宣告必要的環境變數與權限
- 當版本具有異常但有意為之的行為時，加入發布者 ClawScan 備註
- 避免混淆處理過的安裝命令
- 盡可能連結到原始碼
- 發布 Plugin 前使用試執行
- 如果使用者或審核者詢問套件行為，請清楚回覆

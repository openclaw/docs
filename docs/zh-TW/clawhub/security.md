---
read_when:
    - 了解 ClawHub 掃描與審核結果
    - 回報 Skills 或套件
    - 恢復遭保留、隱藏或封鎖的上架項目
summary: ClawHub 的信任、掃描、回報和審核行為。
x-i18n:
    generated_at: "2026-05-13T05:33:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性 + 審核

ClawHub 開放發布，但公開列表仍會經過信任、
掃描、檢舉與審核控制。目標很實際：協助使用者
檢查他們安裝的內容，為發布者提供誤判的復原途徑，
並讓濫用套件無法進入公開探索。

另請參閱[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## 使用者可以檢查的內容

安裝技能或 Plugin 前，請檢查其 ClawHub 列表中的：

- 擁有者與來源標示
- 最新版本與變更記錄
- 必要的環境變數或權限
- Plugin 的相容性中繼資料
- 掃描或審核狀態
- 顯示時的檢舉、留言、星標、下載與安裝訊號

只安裝你理解且信任的內容。

## 掃描狀態

ClawHub 可能會在公開頁面與擁有者可見的
診斷資訊中顯示掃描或審核結果。

常見結果包括：

- `clean`：未發現阻擋性問題。
- `suspicious`：此發行版本需要謹慎處理或審查。
- `malicious`：此發行版本被視為不安全。
- `pending`：檢查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：此發行版本尚未完整
  可於公開安裝介面取得。

不同介面的確切措辭可能不同，但實際含義相同：如果某個
發行版本被保留或封鎖，使用者不應安裝，直到擁有者解決
問題，或審核將其恢復。

## Skills

技能掃描會檢查已發布的技能套件、中繼資料、宣告的
需求，以及可疑指令。

ClawHub 會特別留意技能宣告內容與其看起來實際行為之間的
不一致。例如，參照必要 API 金鑰的技能應在 `SKILL.md` 中
宣告該需求，讓使用者能在安裝前看到。

掃描發現以成品為基礎。預期的提供者行為，例如宣告的
API 憑證、localhost OAuth 回呼、範圍限定的解除安裝清理、Basic Auth
編碼，或使用者選取檔案上傳至指定提供者，會與隱藏憑證轉發、
廣泛私人檔案存取、無關網路目的地，或隱密瀏覽器濫用受到
不同處理。

請參閱[技能格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 發行版本包含套件中繼資料、來源標示、相容性
欄位，以及成品完整性資訊。

OpenClaw 會在安裝 ClawHub 代管的 Plugin 前檢查相容性。套件
記錄也可能公開摘要中繼資料，讓 OpenClaw 能驗證已下載的
成品。ClawScan 在審查 Plugin 發行版本時會包含宣告的套件
`openclaw.environment` 環境/設定中繼資料，讓宣告的執行階段需求能
與觀察到的行為比較。

## 檢舉

已登入的使用者可以檢舉技能、套件與留言。

檢舉應具體且可採取行動。濫用檢舉本身也可能導致
帳號處分。

檢舉範例：

- 誤導性中繼資料
- 未宣告的憑證或權限需求
- 可疑的安裝指令
- 詐騙留言或冒名
- 惡意註冊或商標濫用
- 違反[可接受使用方式](/zh-TW/clawhub/acceptable-usage)的內容

## 發布者 ClawScan 備註

發布者可以在發布技能或 Plugin 時提供選填的 ClawScan 備註。
此備註會為 ClawScan 提供情境，說明否則可能看起來異常的行為，
例如網路存取、原生主機存取，或提供者特定的
憑證。

## 審核保留

當靜態掃描器將上傳的技能標記為惡意時，發布者會
自動被置於審核保留狀態（在使用者上設定 `requiresModerationAt`）。
這會隱藏該發布者的所有技能，讓未來發布一開始即為
隱藏狀態，並建立一筆 `user.moderation.auto` 稽核日誌項目。

靜態可疑發現會保留為供審核者使用的檔案/行號證據，
但它們本身不會隱藏內容，也不會決定公開掃描判定。
新的上傳會維持在審查/待處理狀態，直到 LLM 審查完成。靜態
掃描只會因惡意特徵而立即阻擋。VirusTotal 引擎
命中仍會作為可見的安全證據，但 VirusTotal Code Insight/Palm
判定屬於建議性質，本身不會隱藏技能。ClawScan LLM 審查
會保留與目的相符的備註作為指引。中度審查發現會繼續顯示在
成品上，而可疑篩選則保留給高影響 LLM
疑慮、惡意發現，或經佐證的 AV 引擎偵測。

管理員可以解除誤判保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

這會清除 `requiresModerationAt` 與 `requiresModerationReason`，恢復
因使用者層級保留而隱藏的技能，並寫入一筆 `user.moderation.lift` 稽核
日誌項目。因其他原因被隱藏的技能，或其自身靜態掃描仍為
惡意的技能，會維持隱藏。

## 封鎖與帳號狀態

違反 ClawHub 政策的帳號可能會失去發布權限。嚴重濫用
可能導致帳號封鎖、權杖撤銷、內容隱藏，或列表
移除。

已刪除、遭封鎖或已停用的帳號無法使用 ClawHub API 權杖。如果 CLI 驗證
在帳號處分後開始失敗，請登入網頁 UI 檢閱帳號
狀態。如果登入或一般 CLI 存取遭到阻擋，請聯絡
security@openclaw.ai 進行復原審查。

## 發布者指引

若要減少誤判並提升使用者信任：

- 保持名稱、摘要、標籤與變更記錄準確
- 宣告必要的環境變數與權限
- 當發行版本有異常但有意的行為時，加入發布者 ClawScan 備註
- 避免混淆處理過的安裝命令
- 盡可能連結至來源
- 發布 Plugin 前使用 dry run
- 如果使用者或審核者詢問套件行為，請清楚回應

---
read_when:
    - 了解 ClawHub 掃描與審核結果
    - 回報技能或套件
    - 復原遭暫緩、隱藏或封鎖的上架項目
summary: ClawHub 的信任、掃描、檢舉與審核行為。
x-i18n:
    generated_at: "2026-05-11T22:19:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性與審核

ClawHub 開放發布內容，但公開列表仍會經過信任、
掃描、檢舉與審核控制。目標很實際：協助使用者
檢查他們安裝的內容、為發布者提供誤判的復原途徑，
並將濫用套件排除在公開探索之外。

另請參閱[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## 使用者可以檢查的內容

安裝 Skills 或 Plugin 前，請檢查其 ClawHub 列表中的：

- 擁有者與來源歸屬
- 最新版本與變更記錄
- 必要的環境變數或權限
- Plugin 的相容性中繼資料
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
- `held`、`quarantined`、`revoked` 或 `hidden`：此版本未完整
  開放於公開安裝介面。

不同介面的確切措辭可能不同，但實際意義相同：如果某個
版本被保留或阻擋，使用者不應安裝它，直到擁有者解決
問題或審核將其恢復。

## Skills

Skills 掃描會檢查已發布的 Skills 套件、中繼資料、宣告的
需求，以及可疑指令。

ClawHub 特別重視 Skills 宣告內容與其看起來實際行為之間的不一致。
例如，引用必要 API 金鑰的 Skills 應在 `SKILL.md` 中宣告該需求，
讓使用者可在安裝前看到。

掃描發現以成品為依據。預期的提供者行為，例如已宣告的
API 憑證、localhost OAuth 回呼、限定範圍的解除安裝清理、Basic Auth
編碼，或使用者選擇上傳檔案到所述提供者，會與隱藏式憑證轉送、
廣泛的私人檔案存取、無關的網路目的地，或隱蔽的瀏覽器濫用區別處理。

請參閱 [Skills 格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 版本包含套件中繼資料、來源歸屬、相容性欄位，以及成品完整性資訊。

OpenClaw 會在安裝 ClawHub 託管的 Plugin 前檢查相容性。套件
記錄也可能公開摘要中繼資料，讓 OpenClaw 能驗證下載的
成品。ClawScan 在審查 Plugin 版本時會包含已宣告的套件
`openclaw.environment` env/config 中繼資料，讓已宣告的執行階段需求
能與觀察到的行為比較。

## 檢舉

已登入的使用者可以檢舉 Skills、套件與留言。

檢舉應具體且可採取行動。濫用檢舉本身也可能導致
帳號處置。

檢舉範例：

- 誤導性的中繼資料
- 未宣告的憑證或權限需求
- 可疑的安裝指令
- 詐騙留言或冒充身分
- 惡意註冊或商標濫用
- 違反[可接受使用方式](/zh-TW/clawhub/acceptable-usage)的內容

## 發布者 ClawScan 備註

發布 Skills 或 Plugin 時，發布者可以提供選用的 ClawScan 備註。
此備註可為 ClawScan 提供某些行為的背景脈絡，這些行為原本可能看起來
不尋常，例如網路存取、原生主機存取，或提供者特定的憑證。

## 審核保留

當靜態掃描器將上傳的 Skills 標記為惡意時，發布者會
自動進入審核保留狀態（在使用者上設定 `requiresModerationAt`）。
這會隱藏該發布者的所有 Skills，使未來發布一開始即為隱藏狀態，
並建立一筆 `user.moderation.auto` 稽核記錄項目。

靜態可疑發現會作為檔案/行號證據保留給審核員，
但它們本身不會隱藏內容，也不會決定公開掃描結論。
新上傳內容會維持在審查/待處理狀態，直到 LLM 審查完成。靜態
掃描只會因惡意特徵碼而立即阻擋。VirusTotal 引擎
命中仍會作為可見的安全性證據，但 VirusTotal Code Insight/Palm
結論屬於建議性質，不會單獨隱藏 Skills。ClawScan LLM 審查
會保留符合用途的備註作為指引。中等審查發現會持續顯示在
成品上，而可疑篩選器則保留給高影響力的 LLM
疑慮、惡意發現，或經 AV 引擎偵測佐證的結果。

管理員可以解除誤判保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

這會清除 `requiresModerationAt` 與 `requiresModerationReason`，恢復
因使用者層級保留而隱藏的 Skills，並寫入一筆 `user.moderation.lift` 稽核
記錄項目。因其他原因隱藏，或其自身靜態掃描仍為
惡意的 Skills，會維持隱藏。

## 封鎖與帳號狀態

違反 ClawHub 政策的帳號可能會失去發布存取權。嚴重濫用
可能導致帳號封鎖、權杖撤銷、內容隱藏，或列表移除。

已刪除、遭封鎖或停用的帳號無法使用 ClawHub API 權杖。如果 CLI 驗證
在帳號處置後開始失敗，請登入 Web UI 檢查帳號
狀態。如果登入或一般 CLI 存取遭阻擋，請聯絡
security@openclaw.ai 進行復原審查。

## 發布者指引

若要減少誤判並提升使用者信任：

- 保持名稱、摘要、標籤與變更記錄準確
- 宣告必要的環境變數與權限
- 當某個版本有不尋常但有意為之的行為時，加入發布者 ClawScan 備註
- 避免混淆處理過的安裝命令
- 盡可能連結至來源
- 發布 Plugin 前使用 dry runs
- 如果使用者或審核員詢問套件行為，請清楚回應

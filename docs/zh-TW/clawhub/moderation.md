---
read_when:
    - 回報 Skills、外掛或套件
    - 從被暫停、隱藏或封鎖的刊登項目復原
    - 了解 ClawHub 管理、封鎖或帳號狀態
sidebarTitle: Moderation and Account Safety
summary: ClawHub 的檢舉、審核暫停、隱藏清單、封鎖與帳號狀態如何運作。
title: 審核與帳號安全
x-i18n:
    generated_at: "2026-07-04T20:23:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# 審核與帳號安全

ClawHub 開放發布，但公開探索與安裝介面仍需要防護措施。檢舉、審核保留、隱藏清單和帳號處置，有助於在某個版本或帳號看起來不安全、具誤導性或違反政策時保護使用者。

本頁說明審核與帳號狀態。關於 `Pass`、`Review`、`Warn`、`Malicious` 等稽核標籤與風險等級，請參閱
[安全稽核](/clawhub/security-audits)。

另請參閱[安全性](/clawhub/security)和
[可接受使用](/clawhub/acceptable-usage)。若有著作權或其他內容權利疑慮，請使用[內容權利請求](/clawhub/content-rights)。

## 檢舉

已登入使用者可以檢舉 skills、plugins 和套件。

ClawHub 檢舉僅適用於不安全的市集內容，例如：

- 惡意清單
- 具誤導性的中繼資料
- 未宣告的憑證或權限需求
- 可疑的安裝指示
- 冒名
- 惡意註冊或商標濫用
- 違反[可接受使用](/clawhub/acceptable-usage)的內容

在 skill 頁面上使用 **檢舉 skill** 按鈕，或針對套件使用套件檢舉命令/API。

請勿使用 ClawHub 檢舉來回報第三方 skill 或外掛自身原始碼中的漏洞。請直接向發布者或清單中連結的原始碼儲存庫回報。ClawHub 不維護或修補第三方 skill 或外掛程式碼。

`openclaw/clawhub` 的 GitHub Security Advisories 是用於 ClawHub 本身的漏洞。範例包括網站、API、命令列介面、登錄檔、驗證、掃描、審核或下載/安裝信任邊界中的錯誤。請勿將 ClawHub advisory 用於第三方 skills 或 plugins 中的漏洞。

好的檢舉應具體且可執行。濫用檢舉本身也可能導致帳號處置。

## 組織與命名空間申請

組織、品牌、套件範圍、擁有者代號或命名空間所有權爭議，應使用[組織與命名空間申請](/clawhub/namespace-claims)流程，而不是產品內檢舉流程或帳號申訴表單。

當你需要 ClawHub 工作人員審查非敏感證明，以判定某個命名空間是否應被保留、移轉、重新命名、隱藏、隔離、建立別名或以其他方式審查時，請使用該流程。請勿在公開 issue 中包含機密、私人文件、私人法律檔案、個人身分文件、API 權杖或 DNS challenge 權杖。

## 審核保留

某些嚴重發現或政策問題可能會讓發布者或清單進入審核保留狀態。發生這種情況時，受影響內容可能會從公開探索中隱藏，或未來發布可能會先以隱藏狀態開始，直到問題完成審查。

審核保留旨在於 ClawHub 解決高風險案例時保護使用者。確認為誤判時，也可以解除保留。

## 隱藏或封鎖的清單

清單可能會在公開安裝介面上被保留、隱藏、隔離、撤銷或以其他方式無法使用。

如果你看到其中一種狀態，請勿安裝該版本，除非擁有者解決問題或審核方恢復它。

擁有者仍可能看到自己被保留或隱藏清單的診斷資訊。這些診斷資訊有助於說明發生了什麼，以及清單回到公開介面前需要變更哪些內容。

## 封鎖與帳號狀態

違反 ClawHub 政策的帳號可能會失去發布權限。嚴重濫用可能導致帳號封鎖、權杖撤銷、內容隱藏或清單移除。發布者濫用壓力訊號會每日檢查。達到 ClawHub 潛在封鎖門檻的訊號可能會觸發自動警告。如果警告期限後的下一次合格掃描仍將發布者置於潛在封鎖門檻內，ClawHub 可能會自動套用帳號處置。較低信心與有時間範圍限制的審查訊號不會納入自動執法。

已刪除、被封鎖或停用的帳號無法使用 ClawHub API 權杖。如果命令列介面驗證在帳號處置後開始失敗，請登入網頁 UI 以檢視帳號狀態。如果登入或一般命令列介面存取因封鎖或停用帳號而受阻，請使用 [ClawHub 申訴表單](https://appeals.openclaw.ai/) 進行復原審查。

如果掃描器觸發的電子郵件將某個 skill 或外掛版本列為惡意，請下載被封鎖提交版本的已儲存掃描結果：
`clawhub scan download <slug> --version <version>`。對於 plugins，請加上
`--kind plugin`。審查掃描輸出、修正清單、遞增版本號，並上傳修正後的版本。

## 發布者指南

為降低誤判並提升使用者信任：

- 保持名稱、摘要、標籤和變更記錄準確
- 宣告必要的環境變數和權限
- 避免混淆過的安裝命令
- 盡可能連結到原始碼
- 發布 plugins 前使用 dry runs
- 如果使用者或審核人員詢問版本行為，請清楚回應

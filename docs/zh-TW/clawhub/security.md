---
read_when:
    - 了解 ClawHub 掃描與審核結果
    - 回報技能或套件
    - 恢復被保留、隱藏或封鎖的上架項目
summary: ClawHub 的信任、掃描、檢舉與審核管理行為。
x-i18n:
    generated_at: "2026-05-12T04:09:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49e2650b23ff7657bb01c43fff50f3bb555b3bc7961b503b02a51096e2fceb27
    source_path: clawhub/security.md
    workflow: 16
---

# 安全性 + 審核

ClawHub 開放發布，但公開列表仍會經過信任、
掃描、檢舉與審核控制。目標很實際：協助使用者
檢查他們安裝的內容，讓發布者有管道處理誤判，
並將濫用套件排除在公開探索之外。

另請參閱[可接受使用方式](/zh-TW/clawhub/acceptable-usage)。

## 使用者可以檢查的內容

在安裝 skill 或 plugin 前，請檢查其 ClawHub 列表中的：

- 擁有者與來源歸屬
- 最新版本與變更記錄
- 必要的環境變數或權限
- plugins 的相容性中繼資料
- 掃描或審核狀態
- 顯示時的檢舉、留言、星標、下載與安裝訊號

只安裝你理解且信任的內容。

## 掃描狀態

ClawHub 可能會在公開頁面與擁有者可見的
診斷資訊中顯示掃描或審核結果。

常見結果包括：

- `clean`：未發現阻擋性問題。
- `suspicious`：此發布需要謹慎處理或審查。
- `malicious`：此發布被視為不安全。
- `pending`：檢查尚未完成。
- `held`、`quarantined`、`revoked` 或 `hidden`：此發布無法在公開安裝介面上
  完整提供。

不同介面的確切措辭可能不同，但實際含義相同：如果某個
發布遭到保留或阻擋，使用者不應安裝，直到擁有者解決
問題或審核將其恢復。

## Skills

Skill 掃描會檢查已發布的 skill bundle、中繼資料、宣告的
需求，以及可疑指示。

ClawHub 特別注意 skill 宣告內容與其看起來實際執行內容之間的不一致。
例如，參照必要 API 金鑰的 skill 應在 `SKILL.md` 中宣告該需求，
讓使用者能在安裝前看到。

掃描發現以成品為基礎。預期的 provider 行為，例如已宣告的
API 憑證、localhost OAuth 回呼、具範圍限制的解除安裝清理、Basic Auth
編碼，或使用者選取檔案上傳至指定 provider，會與隱藏憑證轉送、
廣泛存取私人檔案、無關的網路目的地，或隱蔽瀏覽器濫用區別處理。

請參閱 [Skill 格式](/zh-TW/clawhub/skill-format)。

## Plugins

Plugin 發布包含套件中繼資料、來源歸屬、相容性
欄位，以及成品完整性資訊。

OpenClaw 會在安裝由 ClawHub 託管的 plugins 前檢查相容性。套件
記錄也可能公開 digest 中繼資料，讓 OpenClaw 能驗證下載的
成品。ClawScan 在審查 plugin 發布時會包含已宣告的套件
`openclaw.environment` env/config 中繼資料，因此可將宣告的執行階段需求
與觀察到的行為進行比較。

## 檢舉

已登入使用者可以檢舉 skills、套件與留言。

檢舉應具體且可執行。濫用檢舉本身也可能導致
帳號處分。

檢舉範例：

- 誤導性中繼資料
- 未宣告的憑證或權限需求
- 可疑的安裝指示
- 詐騙留言或冒名
- 惡意註冊或商標濫用
- 違反[可接受使用方式](/zh-TW/clawhub/acceptable-usage)的內容

## 發布者 ClawScan 備註

發布者可以在發布 skill 或 plugin 時提供選用的 ClawScan 備註。
此備註會提供 ClawScan 上下文，用於說明否則可能看起來異常的行為，
例如網路存取、native host 存取，或 provider 專用憑證。

## 審核保留

當靜態掃描器將上傳的 skill 標記為惡意時，發布者會
自動被置於審核保留狀態（使用者上設定 `requiresModerationAt`）。
這會隱藏該發布者的所有 skills，使未來發布一開始即為隱藏，
並建立 `user.moderation.auto` 稽核記錄項目。

靜態可疑發現會保留為供審核者使用的檔案/行號證據，
但它們本身不會隱藏內容，也不會決定公開掃描判定。
新的上傳會維持在審查/pending 狀態，直到 LLM 審查完成。靜態
掃描只會因惡意特徵立即阻擋。VirusTotal 引擎
命中仍會作為可見的安全證據，但 VirusTotal Code Insight/Palm
判定屬於建議性質，本身不會隱藏 skills。ClawScan LLM 審查
會保留與目的相符的備註作為指引。中等審查發現會維持顯示於
成品上，而可疑篩選則保留給高影響的 LLM
疑慮、惡意發現，或經佐證的 AV 引擎偵測。

管理員可以解除誤判保留：

```bash
npx convex run users:liftModerationHold '{"userId": "<user-id>", "reason": "False positive from security tool scanning"}'
```

這會清除 `requiresModerationAt` 與 `requiresModerationReason`，恢復
因使用者層級保留而隱藏的 skills，並寫入 `user.moderation.lift` 稽核
記錄項目。因其他原因被隱藏，或其自身靜態掃描仍為
惡意的 skills，會保持隱藏。

## 停權與帳號狀態

違反 ClawHub 政策的帳號可能會失去發布存取權。嚴重濫用
可能導致帳號停權、token 撤銷、內容隱藏，或列表移除。

已刪除、遭停權或停用的帳號無法使用 ClawHub API tokens。如果 CLI 驗證
在帳號處分後開始失敗，請登入 web UI 查看帳號
狀態。如果登入或一般 CLI 存取遭到阻擋，請聯絡
security@openclaw.ai 進行復原審查。

## 發布者指引

若要降低誤判並提升使用者信任：

- 保持名稱、摘要、標籤與變更記錄準確
- 宣告必要的環境變數與權限
- 當發布具有不尋常但有意設計的行為時，加入發布者 ClawScan 備註
- 避免混淆的安裝命令
- 盡可能連結到原始碼
- 在發布 plugins 前使用 dry runs
- 如果使用者或審核者詢問套件行為，請清楚回應

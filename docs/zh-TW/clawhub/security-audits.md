---
read_when:
    - 了解 ClawHub 安全稽核結果
    - 決定是否安裝 Skill 或外掛
    - 說明 ClawHub 稽核狀態、風險等級或發現事項
sidebarTitle: Security Audits
summary: 安裝 skill 或外掛前，如何理解 ClawHub 安全稽核結果。
title: 安全稽核
x-i18n:
    generated_at: "2026-07-05T04:51:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# 安全性稽核

ClawHub 安全性稽核可協助你判斷某個 skill 或外掛是否足夠安全，可以安裝。它們會顯示某個版本會做什麼、要求哪些權限，以及在它能存取檔案、帳號、憑證、程式碼或外部服務之前，是否有任何事項值得額外注意。

稽核是強力的安全訊號，但不保證某個版本毫無風險。授予敏感存取權之前，請務必自行判斷。

另請參閱 [安全性](/clawhub/security)、[可接受使用](/clawhub/acceptable-usage) 和 [審核與帳號安全](/clawhub/moderation)。

## 安裝前要檢查什麼

安裝前，請檢視：

- 整體稽核狀態
- 風險等級
- 任何列出的發現事項
- 所需的憑證、權限或環境變數
- 擁有者、來源、版本、變更記錄、下載數、星標數，以及其他信任訊號

只安裝你理解且信任的內容。

## 稽核狀態

稽核狀態會告訴你該如何回應稽核結果：

| 狀態        | 意義                                                               |
| ----------- | ------------------------------------------------------------------ |
| `Pass`      | 未發現高於低風險的可見問題。                                     |
| `Review`    | 安裝前請閱讀發現事項。該版本可能仍是正當的。                     |
| `Warn`      | 請格外謹慎。ClawHub 發現高影響疑慮或警告訊號。                  |
| `Malicious` | 不要安裝。                                                         |
| `Pending`   | 稽核尚未完成。                                                     |
| `Error`     | 無法完成稽核。                                                     |

`Pass` 令人安心，但不能取代你自己的判斷。這對能發佈內容、編輯資料、執行命令、讀取檔案或存取正式環境系統的工具尤其重要。

## 風險等級

風險等級描述影響範圍：如果你按預期使用該版本，它看起來擁有多大的權力。

| 風險等級 | 意義                                                                   |
| -------- | ---------------------------------------------------------------------- |
| `Low`    | 幾乎沒有發現敏感權限或使用者影響。                                     |
| `Medium` | 該版本具有有意義的權限，例如帳號存取或資料變更。                       |
| `High`   | 該版本具有高影響權限、嚴重發現事項或惡意訊號。                         |

風險等級和稽核狀態回答的是不同問題：

- 風險等級問的是：「這裡有多大的權力？」
- 稽核狀態問的是：「我該如何處理這個結果？」

例如，某個發佈用 skill 可能顯示 `Review`，風險為 `Medium`。這不表示它是惡意的。這表示該 skill 看起來符合用途，但能以有意義的帳號權限採取行動。

## 發現事項

發現事項會說明為什麼顯示某個稽核結果。每個發現事項通常包含：

- 它代表什麼
- 為什麼被標記
- 相關 skill 或外掛內容
- 建議

發現事項可能標示為 `Info`、`Low`、`Medium`、`High` 或 `Critical`。嚴重程度較高的發現事項，對風險等級和稽核狀態的影響更強。

低可信度的發現事項會從公開稽核彙總中隱藏，讓頁面聚焦在有用的證據上。

## ClawHub 會檢查什麼

ClawHub 會稽核提交的發行成品，包括：

- skill 指令或外掛中繼資料
- 宣告的環境變數和權限
- 安裝指示和套件中繼資料
- 隨附檔案和檔案清單
- 相容性和能力中繼資料

核心問題是一致性：名稱、摘要、中繼資料、要求的權限，以及實際內容，是否符合使用者合理預期？

強大的行為不會自動等於不好。許多有用工具需要憑證、本機命令、供應商 API 或套件安裝。稽核會檢查這些權力是否符合預期、有揭露且相稱。

成品頁面會連結到完整稽核：

```text
/<owner>/skills/<slug>/security-audit
```

稽核頁面結合：

1. SkillSpector
2. VirusTotal
3. 風險分析

## VirusTotal

ClawHub 在稽核堆疊中使用 VirusTotal 作為惡意軟體遙測。VirusTotal 是檔案聲譽和惡意軟體掃描方面值得信賴的業界標準，我們的合作關係讓 ClawHub 能為 skill 和外掛審查加入更廣泛的安全情報。

VirusTotal 對於已知惡意成品、引擎命中，以及補充 ClawHub 具 agent 意識審查的聲譽訊號特別有用。當供應商引擎計數可用時，稽核會以白話摘要，例如：

```text
62/62 vendors flagged this skill as clean.
```

或：

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

當 ClawHub 沒有可摘要的供應商計數遙測時，稽核會顯示：

```text
No VirusTotal findings
```

VirusTotal 仍然是遙測。它不會取代 ClawHub 自己具成品意識的風險分析。

## 風險分析

風險分析由 ClawHub 自有的安全性稽核系統 ClawScan 在內部提供支援。它會以面向 agent 的成品來審查每個版本：指令、中繼資料、宣告的權限、檔案、能力訊號、靜態掃描訊號、SkillSpector 發現事項、VirusTotal 遙測，以及發佈者提供的脈絡。靜態掃描訊號是此審查的內部脈絡；它們不是獨立的公開稽核區段，也不是阻止安裝的裁定。

風險分析使用 [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) 作為檢視風險的視角，例如提示注入、工具誤用、憑證暴露、不安全執行、記憶或脈絡污染，以及過度代理權。

ClawScan 不會把看起來可怕的能力自動視為惡意。它會詢問該能力是否已揭露、符合用途，且受到該版本所述使用案例支持。

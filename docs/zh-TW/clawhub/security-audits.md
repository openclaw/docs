---
read_when:
    - 了解 ClawHub 安全稽核結果
    - 決定是否安裝技能或外掛
    - 說明 ClawHub 稽核狀態、風險等級或發現
sidebarTitle: Security Audits
summary: 安裝 skill 或外掛前，如何理解 ClawHub 安全性稽核結果。
title: 安全稽核
x-i18n:
    generated_at: "2026-07-04T15:07:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# 安全稽核

ClawHub 安全稽核可協助你判斷某個 skill 或外掛是否安全到足以安裝。它們會顯示某個發布版本會做什麼、要求哪些權限，以及在它能存取檔案、帳戶、憑證、程式碼或外部服務之前，是否有任何事項值得額外注意。

稽核是強力的安全訊號，但不能保證某個發布版本完全沒有風險。在授予敏感存取權之前，請務必自行判斷。

另請參閱[安全性](/clawhub/security)、[可接受使用方式](/clawhub/acceptable-usage)和[審核與帳戶安全](/clawhub/moderation)。

## 安裝前要檢查什麼

安裝前，請檢閱：

- 整體稽核狀態
- 風險等級
- 任何列出的發現
- 必要的憑證、權限或環境變數
- 擁有者、來源、版本、變更記錄、下載次數、星標數，以及其他信任訊號

只安裝你理解且信任的內容。

## 稽核狀態

稽核狀態會告訴你該如何回應稽核結果：

| 狀態        | 含義                                                   |
| ----------- | ------------------------------------------------------ |
| `Pass`      | 未發現高於低風險的可見問題。                         |
| `Review`    | 安裝前請閱讀發現。該發布版本可能仍是正當的。         |
| `Warn`      | 請格外謹慎。ClawHub 發現高影響疑慮或警告訊號。       |
| `Malicious` | 請勿安裝。                                             |
| `Pending`   | 稽核尚未完成。                                         |
| `Error`     | 無法完成稽核。                                         |

`Pass` 令人安心，但不能取代你自己的判斷。對於能發布內容、編輯資料、執行命令、讀取檔案或存取生產系統的工具，這一點最為重要。

## 風險等級

風險等級描述影響範圍：如果你按預期使用該發布版本，它看起來擁有多大的權力。

| 風險等級 | 含義                                                           |
| -------- | -------------------------------------------------------------- |
| `Low`    | 發現的敏感權限或使用者影響很少。                             |
| `Medium` | 該發布版本擁有有意義的權限，例如帳戶存取或資料變更。         |
| `High`   | 該發布版本擁有高影響權限、嚴重發現或惡意訊號。               |

風險等級與稽核狀態回答的是不同問題：

- 風險等級問的是：「這裡有多大的權力？」
- 稽核狀態問的是：「我應該如何處理這個結果？」

例如，某個發布 skill 可能顯示 `Review`，風險為 `Medium`。這並不表示它是惡意的。這表示該 skill 看起來符合用途，但能以有意義的帳戶權限執行動作。

## 發現

發現會說明為何顯示某個稽核結果。每項發現通常包含：

- 它代表什麼
- 為何被標記
- 相關的 skill 或外掛內容
- 建議

發現可能標示為 `Info`、`Low`、`Medium`、`High` 或 `Critical`。嚴重程度越高，對風險等級與稽核狀態的影響越強。

低信心發現會從公開稽核彙總中隱藏，讓頁面聚焦於有用證據。

## ClawHub 檢查什麼

ClawHub 會稽核提交的發布成品，包括：

- skill 指令或外掛中繼資料
- 宣告的環境變數與權限
- 安裝指令與套件中繼資料
- 包含的檔案與檔案清單
- 相容性與功能中繼資料

主要問題是一致性：名稱、摘要、中繼資料、要求的權限與實際內容，是否符合使用者合理預期？

強大的行為並不會自動等於不好。許多實用工具需要憑證、local commands、提供者 API 或套件安裝。稽核會檢查這種權力是否符合預期、已揭露且合乎比例。

成品頁面會連結到完整稽核，位置如下：

```text
/<owner>/skills/<slug>/security-audit
```

稽核頁面結合：

1. SkillSpector
2. VirusTotal
3. 風險分析

## VirusTotal

ClawHub 在稽核堆疊中使用 VirusTotal 作為惡意軟體遙測。VirusTotal 是檔案聲譽與惡意軟體掃描方面受信任的業界標準，而我們的合作關係讓 ClawHub 能為 skill 與外掛審查加入更廣泛的安全情報。

VirusTotal 對於已知惡意成品、引擎命中，以及補充 ClawHub 代理感知審查的聲譽訊號特別有用。當可取得供應商引擎計數時，稽核會以淺顯語言摘要，例如：

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

VirusTotal 仍然是遙測。它不能取代 ClawHub 自身具成品感知能力的風險分析。

## 風險分析

風險分析由 ClawScan 在內部提供支援，ClawScan 是 ClawHub 自有的安全稽核系統。它會將每個發布版本作為面向代理的成品來審查：指令、中繼資料、宣告的權限、檔案、功能訊號、靜態掃描訊號、SkillSpector 發現、VirusTotal 遙測，以及發布者提供的背景資訊。靜態掃描訊號是此審查的內部背景資訊；它們不是獨立的公開稽核章節，也不是阻擋安裝的判定。

風險分析使用 [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/) 作為風險視角，例如提示注入、工具誤用、憑證暴露、不安全執行、記憶或情境污染，以及過度代理性。

ClawScan 不會把看起來嚇人的功能自動視為惡意。它會詢問該功能是否已揭露、符合用途，且受到發布版本所述使用案例的支持。

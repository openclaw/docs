---
read_when:
    - 您想要提交安全性發現或威脅情境
    - 檢視或更新威脅模型
summary: 如何為 OpenClaw 威脅模型做出貢獻
title: 參與威脅模型的建置
x-i18n:
    generated_at: "2026-07-11T21:47:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)是一份持續更新的文件。歡迎任何人貢獻；你不需要具備安全性或 MITRE ATLAS 相關背景。

<Note>
這裡用於新增威脅模型內容，而非通報實際存在的漏洞。如果你發現可遭利用的漏洞，請改為遵循 [Trust 頁面](https://trust.openclaw.ai)上的負責任揭露指示。
</Note>

## 貢獻方式

**新增威脅。** 在 [openclaw/trust](https://github.com/openclaw/trust/issues) 建立議題，以你自己的方式描述攻擊情境。以下資訊很有幫助，但並非必要：

- 攻擊情境及其可能遭利用的方式。
- 受影響的元件（命令列介面、閘道、頻道、ClawHub、MCP 伺服器等）。
- 你對嚴重程度的估計（低／中／高／重大）。
- 相關研究、CVE 或真實案例的連結。

維護者會在審查期間指派 ATLAS 對應項目、威脅 ID 與風險等級。

**建議緩解措施。** 建立引用該威脅的議題或 PR。請具體且可執行：「在閘道對每位傳送者實施每分鐘 10 則訊息的速率限制」比「實作速率限制」更有用。

**提出攻擊鏈。** 攻擊鏈呈現多個威脅如何組合成實際情境。請描述各個步驟，以及攻擊者會如何將其串聯；簡短敘述比正式範本更有效。

**修正或改善現有內容。** 錯字、說明釐清、過時資訊、更好的範例：歡迎提交 PR，無須先建立議題。

## 框架參考

威脅會對應至 [MITRE ATLAS](https://atlas.mitre.org/)（AI 系統對抗性威脅環境），這是一套針對提示詞注入、工具濫用與代理程式利用等 AI／ML 特有威脅的框架。你不需要了解 ATLAS 也能貢獻；維護者會在審查期間將提交內容對應至該框架。

**威脅 ID。** 每項威脅都會獲得如 `T-EXEC-003` 的 ID，由維護者在審查期間指派。

| 代碼    | 類別                           |
| ------- | ------------------------------ |
| RECON   | 偵察－蒐集資訊                 |
| ACCESS  | 初始存取－取得進入權限         |
| EXEC    | 執行－執行惡意動作             |
| PERSIST | 持續存在－維持存取權限         |
| EVADE   | 規避防禦－避免遭到偵測         |
| DISC    | 探索－瞭解環境                 |
| EXFIL   | 資料外洩－竊取資料             |
| IMPACT  | 影響－造成損害或中斷           |

**風險等級。** 如果你不確定等級，只需描述影響；維護者會進行評估。

| 等級       | 含義                                           |
| ---------- | ---------------------------------------------- |
| **重大**   | 系統完全遭入侵，或發生可能性高且影響重大       |
| **高**     | 可能造成重大損害，或發生可能性中等且影響重大   |
| **中**     | 中度風險，或發生可能性低但影響高               |
| **低**     | 發生可能性低且影響有限                         |

## 審查流程

1. **初步分類**－新提交內容會在 48 小時內接受審查。
2. **評估**－維護者會確認可行性、指派 ATLAS 對應項目與威脅 ID，並驗證風險等級。
3. **文件處理**－檢查格式與完整性。
4. **合併**－加入威脅模型與視覺化內容。

## 資源

- [ATLAS 網站](https://atlas.mitre.org/)
- [ATLAS 技術](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)

## 聯絡方式

- **安全性漏洞：**請參閱 [Trust 頁面](https://trust.openclaw.ai)上的通報指示，或寄送郵件至 `security@openclaw.ai`。
- **威脅模型問題：**在 [openclaw/trust](https://github.com/openclaw/trust/issues) 建立議題。
- **一般討論：**Discord `#security` 頻道。

## 貢獻表揚

威脅模型貢獻者會列入威脅模型致謝名單與版本資訊；若有重大貢獻，也會列入 OpenClaw 安全名人堂。

## 相關內容

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [事件回應](/zh-TW/security/incident-response)
- [形式驗證](/zh-TW/security/formal-verification)

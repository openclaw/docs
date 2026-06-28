---
read_when:
    - 你想要貢獻安全性發現或威脅情境
    - 審查或更新威脅模型
summary: 如何為 OpenClaw 威脅模型做出貢獻
title: 為威脅模型做出貢獻
x-i18n:
    generated_at: "2026-05-06T18:01:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
    postprocess_version: locale-links-v1
---

感謝你協助讓 OpenClaw 更安全。這份威脅模型是一份持續更新的文件，我們歡迎任何人貢獻內容 - 你不需要是安全專家。

## 貢獻方式

### 新增威脅

發現我們尚未涵蓋的攻擊向量或風險了嗎？請在 [openclaw/trust](https://github.com/openclaw/trust/issues) 開啟議題，並用你自己的話描述它。你不需要了解任何框架，也不需要填完每個欄位 - 只要描述情境即可。

**建議包含（但非必要）：**

- 攻擊情境，以及它可能如何被利用
- OpenClaw 的哪些部分會受影響（CLI、Gateway、通道、ClawHub、MCP 伺服器等）
- 你認為它有多嚴重（低 / 中 / 高 / 嚴重）
- 任何相關研究、CVE 或真實案例的連結

我們會在審查期間處理 ATLAS 對應、威脅 ID 和風險評估。如果你想包含這些細節，很好 - 但這不是必要條件。

> **這是用來新增到威脅模型，而不是回報即時漏洞。** 如果你發現可被利用的漏洞，請參閱我們的 [Trust 頁面](https://trust.openclaw.ai) 了解負責任揭露指引。

### 建議緩解措施

對如何處理現有威脅有想法嗎？請開啟參照該威脅的議題或 PR。有用的緩解措施應該具體且可執行 - 例如，「在 Gateway 對每個傳送者限制為 10 則訊息/分鐘」比「實作速率限制」更好。

### 提出攻擊鏈

攻擊鏈展示多個威脅如何組合成真實的攻擊情境。如果你看到危險的組合，請描述步驟，以及攻擊者會如何將它們串接起來。簡短敘述攻擊在實務上如何展開，比正式範本更有價值。

### 修正或改善現有內容

錯字、澄清、過時資訊、更好的範例 - 歡迎 PR，不需要先開議題。

## 我們使用的內容

### MITRE ATLAS 框架

這份威脅模型建構於 [MITRE ATLAS](https://atlas.mitre.org/)（AI 系統對抗性威脅態勢），這是一個專為 AI/ML 威脅設計的框架，例如提示注入、工具濫用和代理程式利用。你不需要了解 ATLAS 也能貢獻 - 我們會在審查期間將提交內容對應到該框架。

### 威脅 ID

每個威脅都會取得類似 `T-EXEC-003` 的 ID。分類如下：

| 代碼    | 類別                                   |
| ------- | ------------------------------------------ |
| RECON   | 偵察 - 資訊蒐集     |
| ACCESS  | 初始存取 - 取得進入權限             |
| EXEC    | 執行 - 執行惡意動作      |
| PERSIST | 持續性 - 維持存取權限           |
| EVADE   | 防禦規避 - 避免被偵測       |
| DISC    | 探索 - 了解環境 |
| EXFIL   | 外洩 - 竊取資料               |
| IMPACT  | 影響 - 損害或中斷              |

ID 會由維護者在審查期間指派。你不需要自行選擇。

### 風險等級

| 等級        | 意義                                                           |
| ------------ | ----------------------------------------------------------------- |
| **嚴重** | 完整系統遭入侵，或高可能性 + 嚴重影響      |
| **高**     | 可能造成重大損害，或中等可能性 + 嚴重影響 |
| **中**   | 中度風險，或低可能性 + 高影響                    |
| **低**      | 不太可能發生且影響有限                                       |

如果你不確定風險等級，只要描述影響，我們會進行評估。

## 審查流程

1. **分流** - 我們會在 48 小時內審查新的提交內容
2. **評估** - 我們會驗證可行性、指派 ATLAS 對應與威脅 ID，並確認風險等級
3. **文件化** - 我們確保所有內容格式正確且完整
4. **合併** - 新增到威脅模型和視覺化內容中

## 資源

- [ATLAS 網站](https://atlas.mitre.org/)
- [ATLAS 技術](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)
- [OpenClaw 威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)

## 聯絡方式

- **安全漏洞：** 請參閱我們的 [Trust 頁面](https://trust.openclaw.ai) 了解回報指引
- **威脅模型問題：** 請在 [openclaw/trust](https://github.com/openclaw/trust/issues) 開啟議題
- **一般聊天：** Discord #security 頻道

## 表彰

威脅模型的貢獻者會在威脅模型致謝、發行說明，以及 OpenClaw 安全名人堂中獲得表彰；重大貢獻者會得到特別認可。

## 相關

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [形式化驗證](/zh-TW/security/formal-verification)

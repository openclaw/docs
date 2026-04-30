---
read_when:
    - 您想貢獻安全性發現或威脅情境
    - 審查或更新威脅模型
summary: 如何為 OpenClaw 威脅模型做出貢獻
title: 為威脅模型做出貢獻
x-i18n:
    generated_at: "2026-04-30T03:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75cf2b408a78fce5134d24a3f115490da2dacc4ba8a1a24415425c3e4420ca55
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

# 為 OpenClaw 威脅模型做出貢獻

感謝你協助讓 OpenClaw 更安全。此威脅模型是一份持續演進的文件，我們歡迎任何人貢獻，不需要是安全專家。

## 貢獻方式

### 新增威脅

發現我們尚未涵蓋的攻擊向量或風險了嗎？請在 [openclaw/trust](https://github.com/openclaw/trust/issues) 開啟 issue，並用你自己的話描述。你不需要了解任何框架，也不需要填寫每個欄位，只要描述情境即可。

**建議包含（但非必要）：**

- 攻擊情境，以及它可能如何被利用
- OpenClaw 的哪些部分受到影響（CLI、gateway、channels、ClawHub、MCP servers 等）
- 你認為它有多嚴重（低 / 中 / 高 / 嚴重）
- 任何相關研究、CVE 或真實案例的連結

我們會在審查期間處理 ATLAS 對應、威脅 ID 和風險評估。如果你想包含這些細節，很好，但這不是必要的。

> **這是用於新增至威脅模型，而不是回報正在發生的漏洞。** 如果你發現可被利用的漏洞，請參閱我們的 [Trust 頁面](https://trust.openclaw.ai)，了解負責任揭露的指示。

### 建議緩解措施

對於如何處理現有威脅有想法嗎？請開啟 issue 或 PR 並引用該威脅。有用的緩解措施應具體且可執行，例如「在 gateway 對每個寄件者限制為 10 則訊息/分鐘」比「實作速率限制」更好。

### 提出攻擊鏈

攻擊鏈展示多個威脅如何結合成一個真實的攻擊情境。如果你看到危險的組合，請描述步驟，以及攻擊者會如何將它們串連起來。以簡短敘述說明攻擊在實務中如何展開，比正式範本更有價值。

### 修正或改善現有內容

錯字、澄清、過時資訊、更好的範例，歡迎提交 PR，不需要先開 issue。

## 我們使用的內容

### MITRE ATLAS

此威脅模型建立在 [MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems）之上，這是一個專為 prompt injection、工具誤用和 agent 利用等 AI/ML 威脅設計的框架。你不需要了解 ATLAS 才能貢獻，我們會在審查期間將提交內容對應到該框架。

### 威脅 ID

每個威脅都會取得類似 `T-EXEC-003` 的 ID。類別如下：

| 代碼    | 類別                                   |
| ------- | ------------------------------------------ |
| RECON   | 偵察 - 資訊蒐集     |
| ACCESS  | 初始存取 - 取得進入權限             |
| EXEC    | 執行 - 執行惡意動作      |
| PERSIST | 持久化 - 維持存取權限           |
| EVADE   | 防禦規避 - 避免偵測       |
| DISC    | 探索 - 了解環境 |
| EXFIL   | 外洩 - 竊取資料               |
| IMPACT  | 影響 - 損害或中斷              |

ID 會由維護者在審查期間指派。你不需要自行選擇。

### 風險等級

| 等級        | 含義                                                           |
| ------------ | ----------------------------------------------------------------- |
| **嚴重** | 完整系統遭入侵，或高可能性 + 嚴重影響      |
| **高**     | 可能造成重大損害，或中等可能性 + 嚴重影響 |
| **中**   | 中等風險，或低可能性 + 高影響                    |
| **低**      | 不太可能發生且影響有限                                       |

如果你不確定風險等級，只要描述影響，我們會進行評估。

## 審查流程

1. **分流** - 我們會在 48 小時內審查新的提交
2. **評估** - 我們會驗證可行性、指派 ATLAS 對應和威脅 ID，並驗證風險等級
3. **文件化** - 我們確保所有內容格式正確且完整
4. **合併** - 新增至威脅模型和視覺化內容

## 資源

- [ATLAS 網站](https://atlas.mitre.org/)
- [ATLAS 技術](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)
- [OpenClaw 威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)

## 聯絡方式

- **安全漏洞：** 請參閱我們的 [Trust 頁面](https://trust.openclaw.ai) 了解回報指示
- **威脅模型問題：** 請在 [openclaw/trust](https://github.com/openclaw/trust/issues) 開啟 issue
- **一般聊天：** Discord #security channel

## 致謝

威脅模型的貢獻者會在威脅模型致謝、發行說明，以及 OpenClaw 安全名人堂中因重大貢獻而獲得表彰。

## 相關

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [形式化驗證](/zh-TW/security/formal-verification)

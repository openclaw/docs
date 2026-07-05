---
read_when:
    - 你想貢獻安全性發現或威脅情境
    - 審查或更新威脅模型
summary: 如何為 OpenClaw 威脅模型做出貢獻
title: 為威脅模型做出貢獻
x-i18n:
    generated_at: "2026-07-05T11:43:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)是一份持續更新的文件。歡迎任何人貢獻；你不需要具備安全或 MITRE ATLAS 背景。

<Note>
這是用於補充威脅模型，而不是回報即時漏洞。如果你發現了可被利用的漏洞，請改為遵循[信任頁面](https://trust.openclaw.ai)上的負責任揭露指示。
</Note>

## 貢獻方式

**新增威脅。** 請在 [openclaw/trust](https://github.com/openclaw/trust/issues) 開啟 issue，用你自己的話描述攻擊情境。以下資訊有幫助但非必要：

- 攻擊情境，以及它可能如何被利用。
- 受影響的元件（命令列介面、閘道、通道、ClawHub、MCP 伺服器等）。
- 你對嚴重程度的估計（低 / 中 / 高 / 嚴重）。
- 相關研究、CVE 或真實世界範例的連結。

維護者會在審查期間指派 ATLAS 對應、威脅 ID 與風險等級。

**建議緩解措施。** 請開啟 issue 或 PR 並引用該威脅。請具體且可執行：「在閘道對每個寄件者限制每分鐘 10 則訊息」比「實作速率限制」更有用。

**提出攻擊鏈。** 攻擊鏈展示多個威脅如何組合成真實情境。描述步驟，以及攻擊者會如何串接它們；簡短敘事勝過正式範本。

**修正或改進現有內容。** 錯字、釐清說明、過時資訊、更好的範例：歡迎 PR，不需要 issue。

## 框架參考

威脅會對應到 [MITRE ATLAS](https://atlas.mitre.org/)（Adversarial Threat Landscape for AI Systems），這是一個針對 AI/ML 特定威脅的框架，例如提示注入、工具濫用與代理利用。你不需要了解 ATLAS 也能貢獻；維護者會在審查期間對應提交內容。

**威脅 ID。** 每個威脅都會取得一個像 `T-EXEC-003` 這樣的 ID，由維護者在審查期間指派。

| 代碼    | 類別                               |
| ------- | ---------------------------------- |
| RECON   | 偵察 - 資訊收集                    |
| ACCESS  | 初始存取 - 取得進入權限            |
| EXEC    | 執行 - 執行惡意動作                |
| PERSIST | 持久化 - 維持存取權限              |
| EVADE   | 防禦規避 - 避免被偵測              |
| DISC    | 探索 - 了解環境                    |
| EXFIL   | 外洩 - 竊取資料                    |
| IMPACT  | 影響 - 損害或中斷                  |

**風險等級。** 如果你不確定等級，只要描述影響即可；維護者會進行評估。

| 等級         | 含義                                                    |
| ------------ | ------------------------------------------------------- |
| **嚴重**     | 完整系統遭入侵，或高可能性 + 嚴重影響                  |
| **高**       | 可能造成重大損害，或中等可能性 + 嚴重影響              |
| **中**       | 中等風險，或低可能性 + 高影響                           |
| **低**       | 不太可能發生且影響有限                                  |

## 審查流程

1. **分類處理** - 新提交會在 48 小時內審查。
2. **評估** - 維護者會驗證可行性、指派 ATLAS 對應與威脅 ID，並驗證風險等級。
3. **文件化** - 格式與完整性檢查。
4. **合併** - 新增至威脅模型與視覺化呈現。

## 資源

- [ATLAS 網站](https://atlas.mitre.org/)
- [ATLAS 技術](https://atlas.mitre.org/techniques/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)

## 聯絡方式

- **安全漏洞：** 請參閱[信任頁面](https://trust.openclaw.ai)取得回報指示，或寄信至 `security@openclaw.ai`。
- **威脅模型問題：** 請在 [openclaw/trust](https://github.com/openclaw/trust/issues) 開啟 issue。
- **一般聊天：** Discord `#security` 頻道。

## 致謝

威脅模型的貢獻者會在威脅模型致謝、版本資訊，以及 OpenClaw 安全名人堂中獲得認可，以表揚重大貢獻。

## 相關

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [事件回應](/zh-TW/security/incident-response)
- [形式驗證](/zh-TW/security/formal-verification)

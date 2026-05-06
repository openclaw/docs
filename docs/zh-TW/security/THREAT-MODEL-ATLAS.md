---
read_when:
    - 檢視安全態勢或威脅情境
    - 處理安全性功能或稽核回應
summary: 對應 MITRE ATLAS 框架的 OpenClaw 威脅模型
title: 威脅模型 (MITRE ATLAS)
x-i18n:
    generated_at: "2026-05-06T18:01:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7371231e9795cd899d727b87dfba7a5cae963f1fd1e50226e3fbb7488ef7381
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

## MITRE ATLAS 框架

**版本：** 1.0-draft
**最後更新：** 2026-02-04
**方法論：** MITRE ATLAS + 資料流程圖
**框架：** [MITRE ATLAS](https://atlas.mitre.org/)（AI 系統的對抗性威脅態勢）

### 框架署名

此威脅模型建構於 [MITRE ATLAS](https://atlas.mitre.org/) 之上，這是用於記錄 AI/ML 系統對抗性威脅的業界標準框架。ATLAS 由 [MITRE](https://www.mitre.org/) 與 AI 安全社群協作維護。

**重要 ATLAS 資源：**

- [ATLAS 技術](https://atlas.mitre.org/techniques/)
- [ATLAS 戰術](https://atlas.mitre.org/tactics/)
- [ATLAS 案例研究](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [為 ATLAS 做出貢獻](https://atlas.mitre.org/resources/contribute)

### 為此威脅模型做出貢獻

這是一份由 OpenClaw 社群維護的活文件。請參閱 [CONTRIBUTING-THREAT-MODEL.md](/zh-TW/security/CONTRIBUTING-THREAT-MODEL)，了解貢獻準則：

- 回報新威脅
- 更新現有威脅
- 提出攻擊鏈
- 建議緩解措施

---

## 1. 簡介

### 1.1 目的

此威脅模型使用專為 AI/ML 系統設計的 MITRE ATLAS 框架，記錄 OpenClaw AI 代理平台與 ClawHub 技能市集的對抗性威脅。

### 1.2 範圍

| 元件                   | 納入 | 備註                                             |
| ---------------------- | ---- | ------------------------------------------------ |
| OpenClaw 代理執行階段 | 是   | 核心代理執行、工具呼叫、工作階段                 |
| Gateway                | 是   | 驗證、路由、頻道整合                             |
| 頻道整合               | 是   | WhatsApp、Telegram、Discord、Signal、Slack 等。  |
| ClawHub 市集           | 是   | 技能發布、審核、分發                             |
| MCP 伺服器             | 是   | 外部工具提供者                                   |
| 使用者裝置             | 部分 | 行動應用程式、桌面用戶端                         |

### 1.3 範圍外

此威脅模型沒有明確排除任何項目。

---

## 2. 系統架構

### 2.1 信任邊界

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 資料流程

| 流程 | 來源    | 目的地  | 資料               | 保護措施             |
| ---- | ------- | ------- | ------------------ | -------------------- |
| F1   | 頻道    | Gateway | 使用者訊息         | TLS、AllowFrom       |
| F2   | Gateway | 代理    | 路由後的訊息       | 工作階段隔離         |
| F3   | 代理    | 工具    | 工具叫用           | 政策強制執行         |
| F4   | 代理    | 外部    | web_fetch 請求     | SSRF 封鎖            |
| F5   | ClawHub | 代理    | 技能程式碼         | 審核、掃描           |
| F6   | 代理    | 頻道    | 回應               | 輸出篩選             |

---

## 3. 依 ATLAS 戰術進行威脅分析

### 3.1 偵察 (AML.TA0002)

#### T-RECON-001：代理端點探索

| 屬性                   | 值                                                                   |
| ---------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - 主動掃描                                                 |
| **描述**               | 攻擊者掃描暴露的 OpenClaw Gateway 端點                               |
| **攻擊向量**           | 網路掃描、shodan 查詢、DNS 列舉                                      |
| **受影響元件**         | Gateway、暴露的 API 端點                                             |
| **目前緩解措施**       | Tailscale 驗證選項、預設繫結至 loopback                              |
| **殘餘風險**           | 中 - 公開 Gateway 可被發現                                           |
| **建議**               | 記錄安全部署方式、在探索端點上新增速率限制                           |

#### T-RECON-002：頻道整合探測

| 屬性                    | 值                                                                 |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0006 - Active Scanning                                        |
| **Description**         | 攻擊者探測訊息通道以識別由 AI 管理的帳號                          |
| **Attack Vector**       | 傳送測試訊息、觀察回應模式                                         |
| **Affected Components** | 所有通道整合                                                       |
| **Current Mitigations** | 無特定措施                                                         |
| **Residual Risk**       | 低 - 單靠探索的價值有限                                            |
| **Recommendations**     | 考慮將回應時間隨機化                                               |

---

### 3.2 初始存取 (AML.TA0004)

#### T-ACCESS-001：配對代碼攔截

| 屬性                    | 值                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                                                                     |
| **Description**         | 攻擊者在配對寬限期間攔截配對代碼（DM 通道配對為 1 小時，Node 配對為 5 分鐘） |
| **Attack Vector**       | 肩窺、網路嗅探、社交工程                                                        |
| **Affected Components** | 裝置配對系統                                                                                         |
| **Current Mitigations** | 1 小時到期（DM 配對）/ 5 分鐘到期（Node 配對），代碼透過現有通道傳送                            |
| **Residual Risk**       | 中 - 寬限期間可被利用                                                                             |
| **Recommendations**     | 縮短寬限期間，新增確認步驟                                                                    |

#### T-ACCESS-002：AllowFrom 偽冒

| 屬性                    | 值                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                                      |
| **Description**         | 攻擊者在通道中偽冒允許的寄件者身分                             |
| **Attack Vector**       | 取決於通道 - 電話號碼偽冒、使用者名稱冒充             |
| **Affected Components** | 各通道的 AllowFrom 驗證                                               |
| **Current Mitigations** | 通道特定的身分驗證                                         |
| **Residual Risk**       | 中 - 某些通道容易遭受偽冒                                  |
| **Recommendations**     | 記錄通道特定風險，盡可能加入密碼學驗證 |

#### T-ACCESS-003：Token 竊取

| 屬性                    | 值                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI Model Inference API Access                   |
| **Description**         | 攻擊者從設定檔竊取驗證 Token     |
| **Attack Vector**       | 惡意軟體、未授權裝置存取、設定備份外洩 |
| **Affected Components** | ~/.openclaw/credentials/, 設定儲存                    |
| **Current Mitigations** | 檔案權限                                            |
| **Residual Risk**       | 高 - Token 以明文儲存                           |
| **Recommendations**     | 實作靜態 Token 加密，新增 Token 輪替      |

---

### 3.3 執行 (AML.TA0005)

#### T-EXEC-001：直接提示注入

| 屬性                    | 值                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                                              |
| **Description**         | 攻擊者傳送特製提示以操縱代理程式行為                               |
| **Attack Vector**       | 包含對抗性指令的通道訊息                                      |
| **Affected Components** | 代理程式 LLM、所有輸入介面                                                             |
| **Current Mitigations** | 模式偵測、外部內容包裝                                              |
| **Residual Risk**       | 嚴重 - 僅偵測、不阻擋；精密攻擊可繞過                      |
| **Recommendations**     | 實作多層防禦、輸出驗證，以及敏感操作的使用者確認 |

#### T-EXEC-002：間接提示注入

| 屬性                    | 值                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.001 - LLM Prompt Injection: Indirect              |
| **Description**         | 攻擊者在擷取的內容中嵌入惡意指令   |
| **Attack Vector**       | 惡意 URL、遭污染的電子郵件、遭入侵的 Webhook       |
| **Affected Components** | web_fetch、電子郵件擷取、外部資料來源           |
| **Current Mitigations** | 使用 XML 標籤與安全通知包裝內容          |
| **Residual Risk**       | 高 - LLM 可能忽略包裝指令                  |
| **Recommendations**     | 實作內容清理、分離執行情境 |

#### T-EXEC-003：工具引數注入

| 屬性                    | 值                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Injection: Direct                 |
| **Description**         | 攻擊者透過提示注入操縱工具引數 |
| **Attack Vector**       | 影響工具參數值的特製提示         |
| **Affected Components** | 所有工具呼叫                                         |
| **Current Mitigations** | 危險命令的 Exec 核准                        |
| **Residual Risk**       | 高 - 仰賴使用者判斷                               |
| **Recommendations**     | 實作引數驗證、參數化工具呼叫      |

#### T-EXEC-004：Exec 核准繞過

| 屬性                    | 值                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                         |
| **Description**         | 攻擊者製作可繞過核准允許清單的命令    |
| **Attack Vector**       | 命令混淆、別名利用、路徑操縱 |
| **Affected Components** | exec-approvals.ts、命令允許清單                       |
| **Current Mitigations** | 允許清單 + 詢問模式                                       |
| **Residual Risk**       | 高 - 無命令清理                             |
| **Recommendations**     | 實作命令正規化，擴充封鎖清單          |

---

### 3.4 持久化 (AML.TA0006)

#### T-PERSIST-001：惡意 Skill 安裝

| 屬性                    | 值                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software                     |
| **Description**         | 攻擊者將惡意 Skill 發布到 ClawHub                            |
| **Attack Vector**       | 建立帳號，發布含有隱藏惡意程式碼的 Skill                 |
| **Affected Components** | ClawHub、Skill 載入、代理程式執行                                  |
| **Current Mitigations** | GitHub 帳號年齡驗證、以模式為基礎的審核標記          |
| **Residual Risk**       | 嚴重 - 無沙箱，審查有限                                 |
| **Recommendations**     | VirusTotal 整合（進行中）、Skill 沙箱化、社群審查 |

#### T-PERSIST-002：Skill 更新投毒

| 屬性                    | 值                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Supply Chain Compromise: AI Software           |
| **Description**         | 攻擊者入侵受歡迎的 Skill 並推送惡意更新 |
| **Attack Vector**       | 帳號入侵、對 Skill 擁有者進行社交工程          |
| **Affected Components** | ClawHub 版本控制、自動更新流程                          |
| **Current Mitigations** | 版本指紋                                         |
| **Residual Risk**       | 高 - 自動更新可能拉取惡意版本                |
| **Recommendations**     | 實作更新簽章、回復能力、版本釘選 |

#### T-PERSIST-003：代理程式設定竄改

| 屬性                    | 值                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.002 - Supply Chain Compromise: Data                   |
| **Description**         | 攻擊者修改代理程式設定以維持存取         |
| **Attack Vector**       | 設定檔修改、設定注入                    |
| **Affected Components** | 代理程式設定、工具政策                                     |
| **Current Mitigations** | 檔案權限                                                |
| **Residual Risk**       | 中 - 需要本機存取                                  |
| **Recommendations**     | 設定完整性驗證、設定變更的稽核記錄 |

---

### 3.5 防禦規避 (AML.TA0007)

#### T-EVADE-001：審核模式繞過

| 屬性                    | 值                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Craft Adversarial Data                                     |
| **Description**         | 攻擊者製作 Skill 內容以規避審核模式             |
| **Attack Vector**       | Unicode 同形異義字、編碼技巧、動態載入                   |
| **Affected Components** | ClawHub moderation.ts                                                  |
| **Current Mitigations** | 以模式為基礎的 FLAG_RULES                                               |
| **Residual Risk**       | 高 - 簡單 regex 容易被繞過                                    |
| **Recommendations**     | 新增行為分析（VirusTotal Code Insight）、以 AST 為基礎的偵測 |

#### T-EVADE-002：內容包裝跳脫

| 屬性                    | 值                                                        |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - 製作對抗性資料                                |
| **描述**                | 攻擊者製作會逃逸 XML 包裝器情境的內容                     |
| **攻擊向量**            | 標籤操控、情境混淆、指令覆寫                              |
| **受影響元件**          | 外部內容包裝                                              |
| **目前緩解措施**        | XML 標籤 + 安全性通知                                     |
| **殘餘風險**            | 中 - 新型逃逸方式經常被發現                               |
| **建議**                | 多層包裝器、輸出端驗證                                    |

---

### 3.6 探索 (AML.TA0008)

#### T-DISC-001: 工具列舉

| 屬性                    | 值                                                    |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI 模型推論 API 存取                      |
| **描述**                | 攻擊者透過提示列舉可用工具                            |
| **攻擊向量**            | 「你有哪些工具？」風格的查詢                          |
| **受影響元件**          | 代理工具登錄表                                        |
| **目前緩解措施**        | 無特定措施                                            |
| **殘餘風險**            | 低 - 工具通常已有文件記載                             |
| **建議**                | 考慮工具可見性控制                                    |

#### T-DISC-002: 工作階段資料擷取

| 屬性                    | 值                                                    |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - AI 模型推論 API 存取                      |
| **描述**                | 攻擊者從工作階段情境中擷取敏感資料                    |
| **攻擊向量**            | 「我們討論了什麼？」查詢、情境探測                    |
| **受影響元件**          | 工作階段逐字稿、情境視窗                              |
| **目前緩解措施**        | 依傳送者隔離工作階段                                  |
| **殘餘風險**            | 中 - 可存取工作階段內資料                             |
| **建議**                | 在情境中實作敏感資料遮蔽                              |

---

### 3.7 收集與外洩 (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: 透過 web_fetch 竊取資料

| 屬性                    | 值                                                                     |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - 收集                                                       |
| **描述**                | 攻擊者透過指示代理傳送至外部 URL 來外洩資料                            |
| **攻擊向量**            | 提示注入導致代理將資料 POST 到攻擊者伺服器                             |
| **受影響元件**          | web_fetch 工具                                                         |
| **目前緩解措施**        | 對內部網路封鎖 SSRF                                                    |
| **殘餘風險**            | 高 - 允許外部 URL                                                       |
| **建議**                | 實作 URL 允許清單、資料分類感知                                        |

#### T-EXFIL-002: 未授權訊息傳送

| 屬性                    | 值                                                               |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - 收集                                                  |
| **描述**                | 攻擊者讓代理傳送包含敏感資料的訊息                               |
| **攻擊向量**            | 提示注入導致代理向攻擊者傳送訊息                                 |
| **受影響元件**          | 訊息工具、頻道整合                                                |
| **目前緩解措施**        | 傳出訊息閘控                                                      |
| **殘餘風險**            | 中 - 閘控可能遭到繞過                                             |
| **建議**                | 對新收件者要求明確確認                                            |

#### T-EXFIL-003: 認證資料蒐集

| 屬性                    | 值                                                    |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS ID**            | AML.T0009 - 收集                                      |
| **描述**                | 惡意 Skill 從代理情境蒐集認證資料                    |
| **攻擊向量**            | Skill 程式碼讀取環境變數、設定檔案                   |
| **受影響元件**          | Skill 執行環境                                       |
| **目前緩解措施**        | 無針對 Skills 的特定措施                             |
| **殘餘風險**            | 嚴重 - Skills 以代理權限執行                         |
| **建議**                | Skill 沙箱化、認證資料隔離                            |

---

### 3.8 影響 (AML.TA0011)

#### T-IMPACT-001: 未授權命令執行

| 屬性                    | 值                                                  |
| ----------------------- | --------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - 侵蝕 AI 模型完整性                      |
| **描述**                | 攻擊者在使用者系統上執行任意命令                    |
| **攻擊向量**            | 提示注入結合 exec 核准繞過                          |
| **受影響元件**          | Bash 工具、命令執行                                 |
| **目前緩解措施**        | Exec 核准、Docker 沙箱選項                          |
| **殘餘風險**            | 嚴重 - 未使用沙箱的主機執行                         |
| **建議**                | 預設使用沙箱、改善核准 UX                           |

#### T-IMPACT-002: 資源耗盡 (DoS)

| 屬性                    | 值                                                 |
| ----------------------- | -------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - 侵蝕 AI 模型完整性                     |
| **描述**                | 攻擊者耗盡 API 額度或運算資源                      |
| **攻擊向量**            | 自動化訊息洪泛、昂貴工具呼叫                       |
| **受影響元件**          | Gateway、代理工作階段、API 提供者                  |
| **目前緩解措施**        | 無                                                 |
| **殘餘風險**            | 高 - 無速率限制                                    |
| **建議**                | 實作依傳送者的速率限制、成本預算                   |

#### T-IMPACT-003: 聲譽損害

| 屬性                    | 值                                                    |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS ID**            | AML.T0031 - 侵蝕 AI 模型完整性                        |
| **描述**                | 攻擊者讓代理傳送有害或冒犯性內容                      |
| **攻擊向量**            | 提示注入導致不適當回應                                |
| **受影響元件**          | 輸出生成、頻道訊息                                    |
| **目前緩解措施**        | LLM 提供者內容政策                                    |
| **殘餘風險**            | 中 - 提供者篩選器並不完善                             |
| **建議**                | 輸出篩選層、使用者控制                                |

---

## 4. ClawHub 供應鏈分析

### 4.1 目前安全性控制

| 控制                 | 實作                        | 有效性                                               |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| GitHub 帳號年齡      | `requireGitHubAccountAge()` | 中 - 提高新攻擊者的門檻                              |
| 路徑清理             | `sanitizePath()`            | 高 - 防止路徑周遊                                    |
| 檔案類型驗證         | `isTextFile()`              | 中 - 僅限文字檔，但仍可能是惡意內容                  |
| 大小限制             | 總套件 50MB                 | 高 - 防止資源耗盡                                    |
| 必要的 SKILL.md      | 必備讀我檔案                | 安全價值低 - 僅供資訊用途                            |
| 模式審核             | moderation.ts 中的 FLAG_RULES | 低 - 容易繞過                                      |
| 審核狀態             | `moderationStatus` 欄位     | 中 - 可進行人工審查                                  |

### 4.2 審核旗標模式

`moderation.ts` 中目前的模式：

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**限制：**

- 僅檢查 slug、displayName、summary、frontmatter、metadata、檔案路徑
- 不分析實際 Skill 程式碼內容
- 簡單 regex 容易透過混淆繞過
- 無行為分析

### 4.3 規劃中的改進

| 改進                  | 狀態                                  | 影響                                                                  |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| VirusTotal 整合        | 進行中                                | 高 - Code Insight 行為分析                                            |
| 社群回報               | 部分完成（`skillReports` 表格存在）   | 中                                                                    |
| 稽核記錄               | 部分完成（`auditLogs` 表格存在）      | 中                                                                    |
| 徽章系統               | 已實作                                | 中 - `highlighted`、`official`、`deprecated`、`redactionApproved`     |

---

## 5. 風險矩陣

### 5.1 可能性與影響

| 威脅 ID       | 可能性     | 影響     | 風險等級     | 優先順序 |
| ------------- | ---------- | -------- | ------------ | -------- |
| T-EXEC-001    | 高         | 嚴重     | **嚴重**     | P0       |
| T-PERSIST-001 | 高         | 嚴重     | **嚴重**     | P0       |
| T-EXFIL-003   | 中         | 嚴重     | **嚴重**     | P0       |
| T-IMPACT-001  | 中         | 嚴重     | **高**       | P1       |
| T-EXEC-002    | 高         | 高       | **高**       | P1       |
| T-EXEC-004    | 中         | 高       | **高**       | P1       |
| T-ACCESS-003  | 中         | 高       | **高**       | P1       |
| T-EXFIL-001   | 中         | 高       | **高**       | P1       |
| T-IMPACT-002  | 高         | 中       | **高**       | P1       |
| T-EVADE-001   | 高         | 中       | **中**       | P2       |
| T-ACCESS-001  | 低         | 高       | **中**       | P2       |
| T-ACCESS-002  | 低         | 高       | **中**       | P2       |
| T-PERSIST-002 | 低         | 高       | **中**       | P2       |

### 5.2 關鍵路徑攻擊鏈

**攻擊鏈 1：以 Skill 為基礎的資料竊取**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**攻擊鏈 2：從提示注入到 RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**攻擊鏈 3：透過擷取內容進行間接注入**

```
T-EXEC-002 → T-EXFIL-001 → 外部外洩
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. 建議摘要

### 6.1 立即 (P0)

| ID    | 建議                                        | 處理項目                   |
| ----- | ------------------------------------------- | -------------------------- |
| R-001 | 完成 VirusTotal 整合                        | T-PERSIST-001, T-EVADE-001 |
| R-002 | 實作 Skills 沙盒化                          | T-PERSIST-001, T-EXFIL-003 |
| R-003 | 為敏感動作新增輸出驗證                      | T-EXEC-001, T-EXEC-002     |

### 6.2 短期 (P1)

| ID    | 建議                                     | 處理項目     |
| ----- | ---------------------------------------- | ------------ |
| R-004 | 實作速率限制                             | T-IMPACT-002 |
| R-005 | 新增權杖靜態加密                         | T-ACCESS-003 |
| R-006 | 改善 exec 核准 UX 和驗證                 | T-EXEC-004   |
| R-007 | 為 web_fetch 實作 URL 允許清單           | T-EXFIL-001  |

### 6.3 中期 (P2)

| ID    | 建議                                         | 處理項目      |
| ----- | -------------------------------------------- | ------------- |
| R-008 | 在可能的情況下新增密碼學通道驗證             | T-ACCESS-002  |
| R-009 | 實作設定完整性驗證                           | T-PERSIST-003 |
| R-010 | 新增更新簽章與版本釘選                       | T-PERSIST-002 |

---

## 7. 附錄

### 7.1 ATLAS 技術對應

| ATLAS ID      | 技術名稱                       | OpenClaw 威脅                                                   |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | 主動掃描                       | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | 蒐集                           | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | 供應鏈：AI 軟體                | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | 供應鏈：資料                   | T-PERSIST-003                                                    |
| AML.T0031     | 侵蝕 AI 模型完整性             | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | AI 模型推論 API 存取           | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | 製作對抗性資料                 | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM 提示注入：直接             | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM 提示注入：間接             | T-EXEC-002                                                       |

### 7.2 關鍵安全檔案

| 路徑                                | 用途                    | 風險等級     |
| ----------------------------------- | ----------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | 指令核准邏輯            | **嚴重**     |
| `src/gateway/auth.ts`               | Gateway 驗證            | **嚴重**     |
| `src/infra/net/ssrf.ts`             | SSRF 防護               | **嚴重**     |
| `src/security/external-content.ts`  | 提示注入緩解            | **嚴重**     |
| `src/agents/sandbox/tool-policy.ts` | 工具政策強制執行        | **嚴重**     |
| `src/routing/resolve-route.ts`      | 工作階段隔離            | **中等**     |

### 7.3 詞彙表

| 詞彙                 | 定義                                                      |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | MITRE 的 AI 系統對抗性威脅態勢                            |
| **ClawHub**          | OpenClaw 的 Skills 市集                                   |
| **Gateway**          | OpenClaw 的訊息路由與驗證層                               |
| **MCP**              | Model Context Protocol - 工具提供者介面                   |
| **Prompt Injection** | 攻擊者將惡意指令嵌入輸入中的攻擊                          |
| **Skill**            | OpenClaw 代理程式的可下載擴充功能                         |
| **SSRF**             | 伺服器端請求偽造                                          |

---

_此威脅模型是一份持續更新的文件。請將安全問題回報至 security@openclaw.ai_

## 相關

- [正式驗證](/zh-TW/security/formal-verification)
- [參與威脅模型貢獻](/zh-TW/security/CONTRIBUTING-THREAT-MODEL)

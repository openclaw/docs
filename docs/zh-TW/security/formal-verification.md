---
permalink: /security/formal-verification/
read_when:
    - 審查形式化安全模型保證或限制
    - 重現或更新 TLA+/TLC 安全模型檢查
summary: OpenClaw 最高風險路徑的機器檢查安全模型。
title: 形式驗證（安全模型）
x-i18n:
    generated_at: "2026-07-05T11:42:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClaw 的正式安全模型（目前為 TLA+/TLC）提供經機器檢查的論證，證明特定最高風險路徑 — 授權、工作階段隔離、工具閘控，以及錯誤設定安全性 — 在明確陳述的假設下，會執行其預期政策。

> 注意：部分較舊連結可能會參照先前的專案名稱。

## 這是什麼

一套可執行、由攻擊者驅動的安全迴歸套件：

- 每項主張都有可在有限狀態空間上執行的模型檢查。
- 許多主張都有配對的負向模型，可為真實的錯誤類型產生反例追蹤。

這**不是**證明 OpenClaw 在所有方面都是安全的，也不會驗證完整的 TypeScript 實作。

## 模型位於何處

模型維護在獨立的 repo 中：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

<Note>
該儲存庫目前無法存取（截至撰寫本文時，GitHub 回傳「Repository not found」）。如果你那裡仍然無法開啟，請先在 OpenClaw 維護者頻道詢問目前位置，再假設模型已被移除。
</Note>

## 注意事項

- 這些是模型，不是完整的 TypeScript 實作 — 模型與程式碼之間可能會產生偏移。
- 結果受限於 TLC 探索的狀態空間。綠燈不代表超出已建模假設與界限之外的安全性。
- 某些主張依賴明確的環境假設（例如正確部署與正確設定輸入）。

## 重現結果

Clone 模型 repo 並執行 TLC：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned tla2tools.jar and provides bin/tlc plus Make targets.

make <target>
```

目前尚未將 CI 整合回這個 repo；未來版本可加入由 CI 執行的模型並提供公開成品（反例追蹤、執行記錄），或為小型有界檢查提供託管的「執行此模型」工作流程。

## 主張與目標

### 閘道暴露與開放閘道錯誤設定

**主張：** 在沒有驗證的情況下綁定到超出 loopback 的範圍，可能讓遠端攻陷成為可能並增加暴露面；根據模型的假設，token/password 會阻擋未驗證的攻擊者。

| 結果       | 目標                                                             |
| ---------- | ---------------------------------------------------------------- |
| 綠燈       | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| 紅燈（預期） | `make gateway-exposure-v2-negative`                              |

另請參閱模型 repo 中的 `docs/gateway-exposure-matrix.md`。

### 節點 exec 管線（最高風險能力）

**主張：** `exec host=node` 需要 (a) 節點命令允許清單加上已宣告命令，以及 (b) 設定時的即時核准；在模型中，核准會 token 化以防止重放。

| 結果       | 目標                                                            |
| ---------- | --------------------------------------------------------------- |
| 綠燈       | `make nodes-pipeline`, `make approvals-token`                   |
| 紅燈（預期） | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### 配對儲存區（DM 閘控）

**主張：** 配對請求會遵守 TTL 與待處理請求上限。

| 結果       | 目標                                                 |
| ---------- | ---------------------------------------------------- |
| 綠燈       | `make pairing`, `make pairing-cap`                   |
| 紅燈（預期） | `make pairing-negative`, `make pairing-cap-negative` |

### 輸入閘控（提及與控制命令繞過）

**主張：** 在需要提及的群組情境中，未授權的控制命令無法繞過提及閘控。

| 結果       | 目標                           |
| ---------- | ------------------------------ |
| 綠燈       | `make ingress-gating`          |
| 紅燈（預期） | `make ingress-gating-negative` |

### 路由與工作階段金鑰隔離

**主張：** 來自不同對等方的 DM 不會收斂到同一個工作階段，除非明確連結或設定。

| 結果       | 目標                              |
| ---------- | --------------------------------- |
| 綠燈       | `make routing-isolation`          |
| 紅燈（預期） | `make routing-isolation-negative` |

## v1++ 模型：並行、重試、追蹤正確性

後續模型會圍繞真實世界失敗模式提升擬真度：非原子更新、重試，以及訊息扇出。

### 配對儲存區並行與冪等性

**主張：** 配對儲存區即使在交錯執行下，也會強制執行 `MaxPending` 與冪等性 — 檢查後寫入必須是原子性/鎖定的，且重新整理不得建立重複項。具體而言：並行請求不得超過某頻道的 `MaxPending`，而同一 `(channel, sender)` 的重複請求/重新整理不會建立重複的有效待處理列。

| 結果       | 目標                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 綠燈       | `make pairing-race`（原子性/鎖定的上限檢查）、`make pairing-idempotency`、`make pairing-refresh`、`make pairing-refresh-race`                                              |
| 紅燈（預期） | `make pairing-race-negative`（非原子 begin/commit 上限競態）、`make pairing-idempotency-negative`、`make pairing-refresh-negative`、`make pairing-refresh-race-negative` |

### 輸入追蹤關聯與冪等性

**主張：** 在供應商重試時，擷取會在扇出之間保留追蹤關聯並保持冪等。當一個外部事件變成多個內部訊息時，每個部分都保留相同的追蹤/事件身分；重試不會重複處理；如果缺少供應商事件 ID，去重會退回到安全鍵（例如追蹤 ID），以避免丟棄不同事件。

| 結果       | 目標                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 綠燈       | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| 紅燈（預期） | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### 路由 dmScope 優先順序與 identityLinks

**主張：** 路由預設會保持 DM 工作階段隔離，且只有在透過頻道優先順序與身分連結明確設定時，才會收斂工作階段。頻道特定的 `dmScope` 覆寫會優先於全域預設；`identityLinks` 只會在明確連結群組內收斂工作階段，不會跨越不相關的對等方。

| 結果       | 目標                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| 綠燈       | `make routing-precedence`, `make routing-identitylinks`                   |
| 紅燈（預期） | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## 相關

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [協助貢獻威脅模型](/zh-TW/security/CONTRIBUTING-THREAT-MODEL)
- [事件回應](/zh-TW/security/incident-response)

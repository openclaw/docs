---
permalink: /security/formal-verification/
read_when:
    - 檢視正式安全模型的保證或限制
    - 重現或更新 TLA+/TLC 安全模型檢查
summary: 針對 OpenClaw 最高風險路徑、經機器驗證的安全模型。
title: 形式化驗證（安全模型）
x-i18n:
    generated_at: "2026-07-11T21:47:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86342f6e2f54c08d5e0f8a08d0d488459650a6ace35e985ff886f847540202c9
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClaw 的形式化安全模型（目前為 TLA+/TLC）在明確陳述的假設下，提供經機器檢查的論證，證明特定的最高風險路徑——授權、工作階段隔離、工具閘控，以及設定錯誤時的安全性——會強制執行其預期政策。

> 注意：部分較舊的連結可能仍使用先前的專案名稱。

## 這是什麼

一套可執行、由攻擊者驅動的安全性迴歸測試套件：

- 每項主張都有可執行的模型檢查，涵蓋有限狀態空間。
- 許多主張都有配對的負面模型，可針對實際的錯誤類別產生反例軌跡。

這**並非**證明 OpenClaw 在所有層面都安全，也不會驗證完整的 TypeScript 實作。

## 模型所在位置

模型在獨立的儲存庫中維護：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

<Note>
該儲存庫目前無法存取（截至本文撰寫時，GitHub 會傳回「Repository not found」）。如果您仍無法存取，請先在 OpenClaw 維護者頻道中詢問目前的位置，再判定模型是否已遭移除。
</Note>

## 注意事項

- 這些是模型，而非完整的 TypeScript 實作——模型與程式碼之間可能出現偏差。
- 結果受限於 TLC 探索的狀態空間。結果為綠色不代表在建模的假設和界限之外也具備安全性。
- 部分主張依賴明確的環境假設（例如部署和設定輸入皆正確）。

## 重現結果

複製模型儲存庫並執行 TLC：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11 以上版本（TLC 在 JVM 上執行）。
# 此儲存庫內含固定版本的 tla2tools.jar，並提供 bin/tlc 和 Make 目標。

make <target>
```

目前尚未與此儲存庫進行 CI 整合；未來版本可加入透過 CI 執行的模型與公開成品（反例軌跡、執行記錄），或為小型有界檢查提供託管的「執行此模型」工作流程。

## 主張與目標

### 閘道暴露與開放閘道設定錯誤

**主張：**依據模型的假設，在沒有驗證的情況下繫結至回送位址以外的位址，可能使遠端入侵成為可能並增加暴露面；權杖或密碼可阻擋未經驗證的攻擊者。

| 結果           | 目標                                                             |
| -------------- | ---------------------------------------------------------------- |
| 綠色           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| 紅色（預期）   | `make gateway-exposure-v2-negative`                              |

另請參閱模型儲存庫中的 `docs/gateway-exposure-matrix.md`。

### 節點執行管線（最高風險能力）

**主張：**在模型中，`exec host=node` 需要：(a) 節點命令允許清單及宣告的命令；以及 (b) 設定要求時的即時核准；核准會經權杖化以防止重播攻擊。

| 結果           | 目標                                                            |
| -------------- | --------------------------------------------------------------- |
| 綠色           | `make nodes-pipeline`, `make approvals-token`                   |
| 紅色（預期）   | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### 配對儲存區（私訊閘控）

**主張：**配對要求會遵循存留時間和待處理要求數量上限。

| 結果           | 目標                                                 |
| -------------- | ---------------------------------------------------- |
| 綠色           | `make pairing`, `make pairing-cap`                   |
| 紅色（預期）   | `make pairing-negative`, `make pairing-cap-negative` |

### 傳入訊息閘控（提及與控制命令繞過）

**主張：**在需要提及的群組情境中，未經授權的控制命令無法繞過提及閘控。

| 結果           | 目標                           |
| -------------- | ------------------------------ |
| 綠色           | `make ingress-gating`          |
| 紅色（預期）   | `make ingress-gating-negative` |

### 路由與工作階段金鑰隔離

**主張：**來自不同對等端的私訊不會合併至同一工作階段，除非已明確連結或設定。

| 結果           | 目標                              |
| -------------- | --------------------------------- |
| 綠色           | `make routing-isolation`          |
| 紅色（預期）   | `make routing-isolation-negative` |

## v1++ 模型：並行處理、重試與軌跡正確性

後續模型進一步提升對實際失敗模式的擬真度，包括非原子更新、重試與訊息扇出。

### 配對儲存區的並行處理與等冪性

**主張：**即使操作交錯執行，配對儲存區仍會強制執行 `MaxPending` 和等冪性——檢查後寫入的操作必須是原子操作或受到鎖定，且重新整理不得建立重複項目。具體而言：並行要求不可讓某個頻道超過 `MaxPending`，而對同一 `(channel, sender)` 重複提出要求或重新整理，不會建立重複且仍有效的待處理資料列。

| 結果           | 目標                                                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 綠色           | `make pairing-race`（原子操作或鎖定的上限檢查）、`make pairing-idempotency`、`make pairing-refresh`、`make pairing-refresh-race`                                              |
| 紅色（預期）   | `make pairing-race-negative`（非原子的開始／提交上限競爭）、`make pairing-idempotency-negative`、`make pairing-refresh-negative`、`make pairing-refresh-race-negative` |

### 傳入訊息軌跡關聯與等冪性

**主張：**擷取程序會在扇出時保留軌跡關聯，並在提供者重試時保持等冪。當一個外部事件轉換成多個內部訊息時，每個部分都會保留相同的軌跡／事件識別資訊；重試不會造成重複處理；如果缺少提供者事件 ID，重複資料刪除機制會改用安全的備援金鑰（例如軌跡 ID），以避免捨棄不同的事件。

| 結果           | 目標                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 綠色           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| 紅色（預期）   | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### 路由 `dmScope` 優先順序與 `identityLinks`

**主張：**路由預設會保持私訊工作階段彼此隔離，且只會依照頻道優先順序和身分連結，在明確設定時合併工作階段。頻道專屬的 `dmScope` 覆寫設定優先於全域預設值；`identityLinks` 只會合併明確連結群組內的工作階段，不會跨越不相關的對等端。

| 結果           | 目標                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| 綠色           | `make routing-precedence`, `make routing-identitylinks`                   |
| 紅色（預期）   | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## 相關內容

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [協助改進威脅模型](/zh-TW/security/CONTRIBUTING-THREAT-MODEL)
- [事件應變](/zh-TW/security/incident-response)

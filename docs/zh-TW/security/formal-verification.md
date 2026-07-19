---
permalink: /security/formal-verification/
read_when:
    - 審查正式安全模型的保證或限制
    - 重現或更新 TLA+/TLC 安全模型檢查
summary: 針對 OpenClaw 最高風險路徑、經機器檢查的安全模型。
title: 形式驗證（安全性模型）
x-i18n:
    generated_at: "2026-07-19T14:04:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 185ee5c1cff7325f10827330c0c7e55ddc3ca40caf6088d4c930ae5e090d6b27
    source_path: security/formal-verification.md
    workflow: 16
---

OpenClaw 的正式安全模型（目前為 TLA+/TLC）在明確陳述的假設下，提供經機器檢查的論證，證明特定的最高風險路徑——授權、工作階段隔離、工具閘控及錯誤設定安全性——會強制執行其預期政策。

> 注意：部分較舊的連結可能會提及此專案先前的名稱。

## 這是什麼

一套可執行、由攻擊者驅動的安全性迴歸測試套件：

- 每項主張都有可在有限狀態空間中執行的模型檢查。
- 許多主張都有配對的負向模型，能針對實際的錯誤類別產生反例追蹤。

這**並非**證明 OpenClaw 在所有層面皆安全，也不會驗證完整的 TypeScript 實作。

## 模型的位置

模型在另一個儲存庫中維護：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

<Note>
目前無法存取該儲存庫（截至本文撰寫時，GitHub 傳回「Repository not found」）。如果你仍無法存取，請先在 OpenClaw 維護者頻道詢問目前的位置，再假設模型已遭移除。
</Note>

## 注意事項

- 這些是模型，而非完整的 TypeScript 實作——模型與程式碼之間可能會產生偏差。
- 結果受限於 TLC 探索的狀態空間。綠色結果不表示超出模型假設與界限之外仍然安全。
- 部分主張依賴明確的環境假設（例如部署正確且設定輸入正確）。

## 重現結果

複製模型儲存庫並執行 TLC：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11+（TLC 在 JVM 上執行）。
# 此儲存庫隨附固定版本的 tla2tools.jar，並提供 bin/tlc 與 Make 目標。

make <target>
```

目前尚未與此儲存庫進行 CI 整合；未來的版本可以加入由 CI 執行並提供公開成品（反例追蹤、執行記錄）的模型，或針對小型有界檢查提供託管的「執行此模型」工作流程。

## 主張與目標

### 閘道暴露與開放閘道錯誤設定

**主張：**在未設置驗證的情況下繫結至回送介面以外的位址，可能使遠端入侵成為可能並增加暴露範圍；依據模型的假設，權杖／密碼可阻擋未經驗證的攻擊者。

| 結果           | 目標                                                             |
| -------------- | ---------------------------------------------------------------- |
| 綠色           | `make gateway-exposure-v2`, `make gateway-exposure-v2-protected` |
| 紅色（預期）   | `make gateway-exposure-v2-negative`                              |

另請參閱模型儲存庫中的 `docs/gateway-exposure-matrix.md`。

### 節點執行流水線（最高風險能力）

**主張：**在模型中，`exec host=node` 要求：(a) 節點命令允許清單及已宣告的命令；以及 (b) 設定啟用時的即時核准；核准會經權杖化以防止重播。

| 結果           | 目標                                                            |
| -------------- | --------------------------------------------------------------- |
| 綠色           | `make nodes-pipeline`, `make approvals-token`                   |
| 紅色（預期）   | `make nodes-pipeline-negative`, `make approvals-token-negative` |

### 配對儲存區（私訊閘控）

**主張：**配對要求會遵守 TTL 與待處理要求數量上限。

| 結果           | 目標                                                 |
| -------------- | ---------------------------------------------------- |
| 綠色           | `make pairing`, `make pairing-cap`                   |
| 紅色（預期）   | `make pairing-negative`, `make pairing-cap-negative` |

### 輸入閘控（提及與控制命令繞過）

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

## v1++ 模型：並行處理、重試與追蹤正確性

後續模型針對實際環境中的失敗模式提高擬真度，包括非原子更新、重試及訊息扇出。

### 配對儲存區的並行處理與冪等性

**主張：**即使操作交錯執行，配對儲存區仍會強制執行 `MaxPending` 與冪等性——先檢查再寫入的操作必須具備原子性／鎖定，且重新整理不得產生重複項目。具體而言：並行要求不得超過頻道的 `MaxPending`，而針對相同 `(channel, sender)` 的重複要求／重新整理，不會建立重複的有效待處理資料列。

| 結果           | 目標                                                                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 綠色           | `make pairing-race`（原子性／鎖定的上限檢查）、`make pairing-idempotency`、`make pairing-refresh`、`make pairing-refresh-race`                                              |
| 紅色（預期）   | `make pairing-race-negative`（非原子的開始／提交上限競爭）、`make pairing-idempotency-negative`、`make pairing-refresh-negative`、`make pairing-refresh-race-negative` |

### 輸入追蹤關聯與冪等性

**主張：**擷取作業會在扇出過程中保留追蹤關聯，並在供應商重試時維持冪等性。當一個外部事件轉換為多個內部訊息時，每個部分都會保留相同的追蹤／事件識別；重試不會重複處理；如果缺少供應商事件 ID，重複資料刪除會改用安全的金鑰（例如追蹤 ID），以避免捨棄不同的事件。

| 結果           | 目標                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 綠色           | `make ingress-trace`, `make ingress-trace2`, `make ingress-idempotency`, `make ingress-dedupe-fallback`                                     |
| 紅色（預期）   | `make ingress-trace-negative`, `make ingress-trace2-negative`, `make ingress-idempotency-negative`, `make ingress-dedupe-fallback-negative` |

### 路由 dmScope 優先順序與 identityLinks

**主張：**`dmScope` 的優先順序與身分連結會以確定方式運作：預設的 `main` 範圍會在單一擁有者的私訊之間共用一個滾動工作階段（個人代理程式的預設值），而任何已設定的隔離範圍（`per-peer`、`per-channel-peer`、`per-account-channel-peer`）都會嚴格隔離私訊工作階段。頻道專屬的 `dmScope` 覆寫會優先於全域預設值；`identityLinks` 僅會在明確連結的群組內合併工作階段，不會跨越無關的對等端。多使用者收件匣應選用隔離範圍（當執行階段安全稽核偵測到多使用者私訊流量時，會提出此建議）。

| 結果           | 目標                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| 綠色           | `make routing-precedence`, `make routing-identitylinks`                   |
| 紅色（預期）   | `make routing-precedence-negative`, `make routing-identitylinks-negative` |

## 相關內容

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [參與威脅模型](/zh-TW/security/CONTRIBUTING-THREAT-MODEL)
- [事件回應](/zh-TW/security/incident-response)

---
permalink: /security/formal-verification/
read_when:
    - 檢視形式化安全模型的保證或限制
    - 重現或更新 TLA+/TLC 安全性模型檢查
summary: 針對 OpenClaw 最高風險路徑的機器檢查安全模型。
title: 形式驗證（安全模型）
x-i18n:
    generated_at: "2026-04-30T03:39:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f50fa9118a80054b8d556cd4f1901b2d5fcb37fb0866bd5357a1b0a46c74116
    source_path: security/formal-verification.md
    workflow: 16
---

本頁追蹤 OpenClaw 的**正式安全模型**（目前為 TLA+/TLC；未來視需要增加）。

> 注意：部分較舊的連結可能會提到先前的專案名稱。

**目標（北極星）：**提供經機器檢查的論證，說明 OpenClaw 在明確假設下，能強制執行其預期的安全政策（授權、工作階段隔離、工具閘控，以及錯誤設定安全性）。

**這是什麼（目前）：**一套可執行、由攻擊者驅動的**安全迴歸套件**：

- 每個主張都有一個可在有限狀態空間中執行的模型檢查。
- 許多主張都有配對的**負向模型**，可針對實際的錯誤類型產生反例追蹤。

**這不是什麼（尚未）：**這不是「OpenClaw 在所有方面都是安全的」的證明，也不是完整 TypeScript 實作正確性的證明。

## 模型所在位置

模型維護於另一個 repo：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要注意事項

- 這些是**模型**，不是完整的 TypeScript 實作。模型與程式碼之間可能產生偏移。
- 結果受限於 TLC 探索的狀態空間；「綠燈」並不表示超出建模假設與邊界之外的安全性。
- 某些主張仰賴明確的環境假設（例如正確部署、正確的設定輸入）。

## 重現結果

目前，結果可透過在本機複製模型 repo 並執行 TLC 來重現（見下方）。未來版本可以提供：

- 由 CI 執行的模型，並附公開成品（反例追蹤、執行記錄）
- 針對小型、有界檢查的託管式「執行此模型」工作流程

開始使用：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### Gateway 暴露與開放 Gateway 錯誤設定

**主張：**在沒有驗證的情況下綁定到迴環位址以外，可能讓遠端入侵成為可能 / 增加暴露面；token/password 會阻擋未驗證的攻擊者（依模型假設）。

- 綠燈執行：
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 紅燈（預期）：
  - `make gateway-exposure-v2-negative`

另請參閱：模型 repo 中的 `docs/gateway-exposure-matrix.md`。

### Node 執行管線（最高風險能力）

**主張：**`exec host=node` 需要 (a) node 命令允許清單加上已宣告命令，以及 (b) 設定時的即時核准；核准會被 token 化，以防止重播（在模型中）。

- 綠燈執行：
  - `make nodes-pipeline`
  - `make approvals-token`
- 紅燈（預期）：
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 配對儲存區（DM 閘控）

**主張：**配對請求會遵守 TTL 與待處理請求數量上限。

- 綠燈執行：
  - `make pairing`
  - `make pairing-cap`
- 紅燈（預期）：
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 入口閘控（提及 + 控制命令繞過）

**主張：**在需要提及的群組情境中，未授權的「控制命令」無法繞過提及閘控。

- 綠燈：
  - `make ingress-gating`
- 紅燈（預期）：
  - `make ingress-gating-negative`

### 路由 / 工作階段金鑰隔離

**主張：**來自不同對等方的 DM 不會合併到同一個工作階段，除非明確連結 / 設定。

- 綠燈：
  - `make routing-isolation`
- 紅燈（預期）：
  - `make routing-isolation-negative`

## v1++：其他有界模型（並行、重試、追蹤正確性）

這些是後續模型，用來加強對實際失敗模式（非原子更新、重試，以及訊息分流）的保真度。

### 配對儲存區並行 / 冪等性

**主張：**即使在交錯執行下，配對儲存區也應強制執行 `MaxPending` 與冪等性（也就是說，「檢查後寫入」必須是原子的 / 已鎖定的；重新整理不應建立重複項）。

意義如下：

- 在並行請求下，不能超過某個頻道的 `MaxPending`。
- 對相同 `(channel, sender)` 的重複請求 / 重新整理，不應建立重複的有效待處理列。

- 綠燈執行：
  - `make pairing-race`（原子 / 已鎖定的上限檢查）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 紅燈（預期）：
  - `make pairing-race-negative`（非原子的 begin/commit 上限競爭）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 入口追蹤關聯 / 冪等性

**主張：**擷取應在分流期間保留追蹤關聯，並在供應商重試下保持冪等。

意義如下：

- 當一個外部事件變成多個內部訊息時，每個部分都保留相同的追蹤 / 事件身分。
- 重試不會導致重複處理。
- 如果缺少供應商事件 ID，去重會退回使用安全鍵（例如追蹤 ID），以避免丟棄不同事件。

- 綠燈：
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 紅燈（預期）：
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 路由 dmScope 優先順序 + identityLinks

**主張：**路由預設必須保持 DM 工作階段隔離，且只有在明確設定時才合併工作階段（頻道優先順序 + 身分連結）。

意義如下：

- 頻道特定的 dmScope 覆寫必須優先於全域預設。
- identityLinks 應只在明確連結的群組內合併，而不是跨越不相關的對等方。

- 綠燈：
  - `make routing-precedence`
  - `make routing-identitylinks`
- 紅燈（預期）：
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 相關

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [參與威脅模型貢獻](/zh-TW/security/CONTRIBUTING-THREAT-MODEL)

---
permalink: /security/formal-verification/
read_when:
    - 檢視形式化安全模型的保證或限制
    - 重現或更新 TLA+/TLC 安全性模型檢查
summary: 針對 OpenClaw 最高風險路徑的經機器驗證安全模型。
title: 形式化驗證（安全模型）
x-i18n:
    generated_at: "2026-05-06T09:19:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
    postprocess_version: locale-links-v1
---

本頁追蹤 OpenClaw 的 **正式安全模型**（目前為 TLA+/TLC；日後視需要增加）。

> 注意：部分較舊連結可能會提及先前的專案名稱。

**目標（北極星）：** 提供一個經機器檢查的論證，證明 OpenClaw 在明確假設下會執行其
預期的安全政策（授權、工作階段隔離、工具控管，以及
錯誤設定安全性）。

**目前這是什麼：** 一套可執行、由攻擊者驅動的 **安全迴歸套件**：

- 每個主張都有可在有限狀態空間上執行的模型檢查。
- 許多主張都有配對的 **負向模型**，會為真實的錯誤類別產生反例追蹤。

**目前這還不是什麼：** 這不是「OpenClaw 在所有方面都是安全的」的證明，也不是完整 TypeScript 實作正確性的證明。

## 模型存放位置

模型維護在獨立的 repo：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要注意事項

- 這些是 **模型**，不是完整的 TypeScript 實作。模型與程式碼之間可能會出現偏移。
- 結果受限於 TLC 探索的狀態空間；「綠燈」並不表示在已建模假設與邊界之外也具備安全性。
- 部分主張依賴明確的環境假設（例如正確的部署、正確的設定輸入）。

## 重現結果

目前，結果可透過在本機 clone 模型 repo 並執行 TLC 來重現（見下方）。未來的迭代可以提供：

- 由 CI 執行的模型，並附公開成品（反例追蹤、執行記錄）
- 用於小型、有界檢查的託管式「執行此模型」工作流程

開始使用：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11+（TLC 在 JVM 上執行）。
# 此 repo 隨附固定版本的 `tla2tools.jar`（TLA+ 工具），並提供 `bin/tlc` + Make targets。

make <target>
```

### Gateway 暴露與開放 Gateway 錯誤設定

**主張：** 在沒有 auth 的情況下綁定超出 loopback 的範圍，可能讓遠端攻陷成為可能 / 增加暴露面；token/password 會阻擋未經 auth 的攻擊者（依模型假設）。

- 綠燈執行：
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 紅燈（預期）：
  - `make gateway-exposure-v2-negative`

另見模型 repo 中的 `docs/gateway-exposure-matrix.md`。

### Node exec 管線（最高風險能力）

**主張：** `exec host=node` 需要 (a) Node 命令允許清單加上已宣告命令，以及 (b) 設定時需要即時核准；核准會被 token 化以防止重放（在模型中）。

- 綠燈執行：
  - `make nodes-pipeline`
  - `make approvals-token`
- 紅燈（預期）：
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 配對儲存區（DM 控管）

**主張：** 配對請求會遵守 TTL 和待處理請求上限。

- 綠燈執行：
  - `make pairing`
  - `make pairing-cap`
- 紅燈（預期）：
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 輸入控管（提及 + 控制命令繞過）

**主張：** 在需要提及的群組情境中，未經授權的「控制命令」不能繞過提及控管。

- 綠燈：
  - `make ingress-gating`
- 紅燈（預期）：
  - `make ingress-gating-negative`

### 路由 / 工作階段金鑰隔離

**主張：** 來自不同對等端的 DM 不會折疊到同一個工作階段，除非明確連結 / 設定。

- 綠燈：
  - `make routing-isolation`
- 紅燈（預期）：
  - `make routing-isolation-negative`

## v1++：額外的有界模型（並行、重試、追蹤正確性）

這些是後續模型，用於提高對真實世界失敗模式（非原子更新、重試，以及訊息 fan-out）的擬真度。

### 配對儲存區並行 / 冪等性

**主張：** 配對儲存區即使在交錯執行下也應強制執行 `MaxPending` 與冪等性（也就是說，「check-then-write」必須是原子性的 / 已鎖定；refresh 不應建立重複項）。

含義：

- 在並行請求下，不能超過某個 channel 的 `MaxPending`。
- 對同一個 `(channel, sender)` 的重複請求 / refresh 不應建立重複的即時 pending 列。

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

### 輸入追蹤關聯 / 冪等性

**主張：** 擷取應在 fan-out 間保留追蹤關聯，並在 provider 重試下保持冪等。

含義：

- 當一個外部事件變成多個內部訊息時，每個部分都保留相同的 trace/event identity。
- 重試不會導致重複處理。
- 如果 provider event ID 缺失，去重會退回到安全金鑰（例如 trace ID），以避免丟棄不同事件。

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

**主張：** 路由必須預設保持 DM 工作階段隔離，且只有在明確設定時才折疊工作階段（channel 優先順序 + identity links）。

含義：

- Channel-specific dmScope 覆寫必須優先於全域預設。
- identityLinks 應只在明確連結的群組內折疊，而不是跨無關對等端。

- 綠燈：
  - `make routing-precedence`
  - `make routing-identitylinks`
- 紅燈（預期）：
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 相關

- [威脅模型](/zh-TW/security/THREAT-MODEL-ATLAS)
- [協助貢獻威脅模型](/zh-TW/security/CONTRIBUTING-THREAT-MODEL)

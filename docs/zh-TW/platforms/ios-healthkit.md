---
read_when:
    - 在 iPhone 節點上啟用 HealthKit 摘要
    - 叫用 health.summary 或疑難排解缺少的健康狀態指標
    - 檢視哪些健康資料可以離開 iPhone
summary: 從 iPhone 節點啟用並呼叫受隱私權控管的 HealthKit 摘要
title: HealthKit 摘要
x-i18n:
    generated_at: "2026-07-14T13:50:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit 摘要

OpenClaw 可向已連線的 iPhone 節點要求目前日曆日的唯讀摘要。iPhone 會在裝置端計算彙總資料，且僅傳回步數、睡眠時間、平均靜止心率，以及體能訓練次數／時間。不支援個別 HealthKit 樣本、來源、中繼資料、臨床紀錄、背景擷取或寫入。

此功能預設為關閉。它需要在 iPhone 上另行同意，並在閘道上授權。

## 需求

- 執行 OpenClaw iOS App，且 HealthKit 回報健康資料可用的 iPhone。
- 已連線並核准的 iPhone 節點。請參閱 [iOS App 設定](/zh-TW/platforms/ios)。
- 可連線至 iPhone 節點的目前版本閘道。
- 你預期查看的任何指標都必須有可讀取的「健康」資料。Apple Watch 可將資料提供給 iPhone 的「健康」資料庫，但 HealthKit 摘要不需要 OpenClaw watchOS App。

## 啟用存取權

### 1. 授權閘道命令

將 `health.summary` 新增至 `openclaw.json` 中現有的 `gateway.nodes.allowCommands` 陣列。保留所有既有命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` 被歸類為高度涉及隱私的命令，iOS 平台預設絕不允許此命令。`gateway.nodes.denyCommands` 中的項目會覆寫允許項目。請參閱[節點命令政策](/zh-TW/nodes#command-policy)。

### 2. 在 iPhone 上啟用分享

在 iOS App 中：

1. 開啟**設定 -> 權限 -> 隱私權與存取 -> 健康摘要**。
2. 點選**啟用並分享摘要**。
3. 閱讀揭露事項，然後在 Apple 的權限面板中選擇允許 OpenClaw 讀取的「健康」類別。

此開關會記錄你明確允許 OpenClaw 分享的選擇，但不表示 Apple 已授予所有要求類別的存取權。

啟用「健康摘要」後，會將 `health.summary` 新增至節點宣告的命令介面。核准因此產生的節點配對更新：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

接著確認已連線的 iPhone 公開有效的 `health.summary` 命令：

```bash
openclaw nodes describe --node "<iPhone name>"
```

## 要求今日摘要

僅支援 `today`。其涵蓋範圍是從當地午夜至提出要求的時間，並使用 iPhone 目前的日曆與時區。

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

代理程式可使用 `nodes` 工具呼叫相同命令：

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

摘要承載資料包含：

| 欄位                     | 含義                                          |
| ------------------------ | --------------------------------------------- |
| `period`                 | 一律為 `today`                               |
| `startISO`               | 當地一天的開始時間，編碼為 ISO 時間點         |
| `endISO`                 | 要求時間，編碼為 ISO 時間點                   |
| `timeZoneIdentifier`     | iPhone 時區識別碼                             |
| `stepCount`              | 四捨五入後的累計步數                          |
| `sleepDurationMinutes`   | 去除重複並裁切至今日範圍的睡眠時間            |
| `restingHeartRateBpm`    | 平均靜止心率                                  |
| `workoutCount`           | 今日開始的體能訓練                            |
| `workoutDurationMinutes` | 這些體能訓練的總時間                          |

指標欄位為選填；當 HealthKit 未傳回可讀取的值時，便會省略。系統會在計算時間前合併睡眠階段與重疊的來源，因此同一分鐘不會重複計算。

## 隱私權行為

- 彙總作業在 iPhone 上進行。原始樣本不會離開裝置。
- 要求的彙總資料會透過你的閘道離開 iPhone。當代理程式提出要求時，彙總資料會送達已設定的 AI 供應商，並可能保留在聊天記錄中。直接透過命令列介面叫用則會將資料傳回給命令列介面操作員。
- OpenClaw 僅要求讀取權限，無法新增或修改「健康」資料。
- OpenClaw 僅在叫用 `health.summary` 時讀取 HealthKit，不會在背景擷取健康資料。
- HealthKit 刻意不透露讀取權限是否遭拒。缺少指標可能表示存取遭拒、沒有相符的樣本，或資料類型無法使用。OpenClaw 無法區分這些情況。
- 此摘要用於個人健康與健身情境，而非診斷或醫療建議。

若要停止分享，請返回**健康摘要**並點選**停用**。iPhone 隨後會從其節點介面移除「健康」功能與 `health.summary` 命令。你也可以從 `gateway.nodes.allowCommands` 移除 `health.summary`，以關閉閘道端的存取關卡。

## 疑難排解

### 節點未宣告此命令

確認已在 iOS App 中啟用「健康摘要」，且 iPhone 已連線。執行 `openclaw nodes pending` 並核准任何功能更新，然後再次檢查 `openclaw nodes describe --node "<iPhone name>"`。

### 命令需要明確選擇加入

將 `health.summary` 新增至 `gateway.nodes.allowCommands`。同時確認 `gateway.nodes.denyCommands` 不包含該命令；拒絕清單優先。

### `HEALTH_ACCESS_DISABLED`

App 端的分享開關已關閉。請在 iPhone 的**隱私權與存取**下啟用**健康摘要**。

### 摘要成功，但缺少指標

開啟 Apple 的「健康」App，確認今日已有資料。檢查 Apple「健康」設定中授予 OpenClaw 的存取權，但不要將空白結果視為存取遭拒的證明：HealthKit 會刻意隱藏這項差異。

### 較早的時間範圍失敗

此命令僅接受 `{"period":"today"}`。不支援多日與歷史摘要。

## 相關內容

- [iOS App](/zh-TW/platforms/ios)
- [節點](/zh-TW/nodes)
- [閘道設定參考](/zh-TW/gateway/configuration-reference#gateway)
- [安全性稽核](/zh-TW/gateway/security)

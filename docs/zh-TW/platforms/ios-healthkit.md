---
read_when:
    - 在 iOS 節點上啟用 HealthKit 摘要
    - 呼叫 health.summary 或疑難排解缺少的健康狀態指標
    - 審查哪些健康資料可能會離開 iOS 裝置
summary: 從 iOS 節點啟用並叫用受隱私權控管的 HealthKit 摘要
title: HealthKit 摘要
x-i18n:
    generated_at: "2026-07-22T10:41:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8ac13d2870c55e2083a5e3a14c3d04238c2780a9e83d091f31923eb738476af
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# HealthKit 摘要

OpenClaw 可以向已連線的 iPhone 或 iPad 節點要求目前日曆日的唯讀摘要。裝置會在本機計算彙總資料，且僅傳回步數、睡眠時長、平均靜止心率，以及體能訓練次數／時長。不支援個別 HealthKit 樣本、來源、中繼資料、臨床紀錄、背景擷取及寫入。

此功能預設為關閉。需要在 iOS 裝置上另行同意，並在閘道上授權。

## 需求

- 執行 OpenClaw iOS App，且 HealthKit 回報健康資料為可用狀態的 iPhone 或 iPad。
- 已連線並核准的 iOS 節點。請參閱 [iOS App 設定](/zh-TW/platforms/ios)。
- 可連線至 iOS 節點的目前版本閘道。
- 你預期查看的任何指標皆須有可讀取的「健康」資料。Apple Watch 可以將資料提供給 Apple「健康」資料庫，但 HealthKit 摘要不需要 OpenClaw watchOS App。

## 啟用存取權

### 1. 授權閘道命令

將 `health.summary` 新增至 `openclaw.json` 中現有的 `gateway.nodes.commands.allow` 陣列。保留所有已存在的命令：

```json5
{
  gateway: {
    nodes: {
      commands: { allow: ["health.summary"] },
    },
  },
}
```

`health.summary` 被分類為高度涉及隱私，因此 iOS 平台預設絕不允許此命令。`gateway.nodes.commands.deny` 中的項目會覆寫允許項目。請參閱[節點命令原則](/zh-TW/nodes#command-policy)。

### 2. 在 iOS 裝置上啟用分享

在 iOS App 中：

1. 開啟 **Settings -> Permissions**，並在一律顯示的 **Apple Health** 區段中找到 **Apple Health Summaries**。
2. 點選 **Enable Apple Health Summaries**。
3. 閱讀揭露內容，然後在 Apple 的權限頁面中選擇 OpenClaw 可讀取的「健康」類別。

此開關會記錄你明確選擇與 OpenClaw 分享資料。這不代表 Apple 已授予所有要求類別的存取權。

啟用「健康」摘要會將 `health.summary` 新增至節點宣告的命令介面。核准產生的節點配對更新：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

接著確認已連線的 iOS 裝置公開有效的 `health.summary` 命令：

```bash
openclaw nodes describe --node "<iOS device name>"
```

## 要求今日摘要

僅支援 `today`。涵蓋範圍為當地午夜至提出要求的時間，並使用 iOS 裝置目前的日曆與時區。

```bash
openclaw nodes invoke \
  --node "<iOS device name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

代理程式可以使用 `nodes` 工具呼叫相同命令：

```json
{
  "action": "invoke",
  "node": "<iOS device name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

摘要承載資料包含：

| 欄位                     | 意義                                          |
| ------------------------ | --------------------------------------------- |
| `period`                 | 一律為 `today`                              |
| `startISO`               | 當地一天的開始時間，編碼為 ISO 時間點         |
| `endISO`                 | 要求時間，編碼為 ISO 時間點                   |
| `timeZoneIdentifier`     | iOS 裝置時區識別碼                            |
| `stepCount`              | 四捨五入後的累計步數                          |
| `sleepDurationMinutes`   | 去除重複並裁切至今日範圍的睡眠時間            |
| `restingHeartRateBpm`    | 平均靜止心率                                  |
| `workoutCount`           | 今日開始的體能訓練                            |
| `workoutDurationMinutes` | 這些體能訓練的總時長                          |

指標欄位為選填；當 HealthKit 未傳回可讀取的值時，系統會省略該欄位。計算時長前會合併睡眠階段與重疊的來源，因此同一分鐘不會重複計算。

## 隱私權行為

- 彙總會在 iOS 裝置上進行。原始樣本不會離開裝置。
- 要求的彙總資料會透過你的閘道離開裝置。當代理程式提出要求時，彙總資料會傳送至已設定的 AI 供應商，並可能保留在聊天記錄中。直接從命令列介面叫用則會將資料傳回給命令列介面操作者。
- OpenClaw 僅要求讀取權限，無法新增或修改「健康」資料。
- OpenClaw 只會在叫用 `health.summary` 時讀取 HealthKit，不會在背景擷取健康資料。
- HealthKit 刻意不透露讀取權限是否遭拒。缺少指標可能表示存取遭拒、沒有相符的樣本，或資料類型無法使用。OpenClaw 無法區分這些情況。
- 此摘要用於個人健康與健身情境，不供診斷或醫療建議之用。

若要停止分享，請返回 **Apple Health Summaries** 並點選 **Turn Off Summaries**。接著，iOS 裝置會從其節點介面移除「健康」功能及 `health.summary` 命令。你也可以從 `gateway.nodes.commands.allow` 移除 `health.summary`，以關閉閘道端的存取關卡。

## 疑難排解

### 節點未宣告命令

確認已在 iOS App 中啟用 Apple「健康」摘要，且裝置已連線。執行 `openclaw nodes pending` 並核准任何功能更新，然後再次檢查 `openclaw nodes describe --node "<iOS device name>"`。

### 命令需要明確選擇加入

將 `health.summary` 新增至 `gateway.nodes.commands.allow`。另請確認 `gateway.nodes.commands.deny` 未包含該命令；拒絕清單優先。

### `HEALTH_ACCESS_DISABLED`

App 端的分享開關已關閉。請在 iOS 裝置上的 **Settings -> Permissions -> Apple Health** 下啟用 **Apple Health Summaries**。

### 摘要成功，但缺少指標

開啟 Apple 的「健康」App，確認今日有資料。檢查 Apple「健康」設定中的 OpenClaw 存取權，但請勿將空白結果視為存取遭拒的證明：HealthKit 刻意隱藏了這項差異。

### 較早的時間範圍失敗

此命令僅接受 `{"period":"today"}`。不支援多日及歷史摘要。

## 相關內容

- [iOS App](/zh-TW/platforms/ios)
- [節點](/zh-TW/nodes)
- [閘道設定參考資料](/zh-TW/gateway/configuration-reference#gateway)
- [安全性稽核](/zh-TW/gateway/security)

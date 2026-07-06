---
read_when:
    - 新增位置節點支援或權限使用者介面
    - 設計 Android 位置權限或前景行為
summary: 節點的位置命令 (location.get)、權限模式，以及 Android 前景行為
title: 位置命令
x-i18n:
    generated_at: "2026-07-06T21:48:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## 摘要

- `location.get` 是節點命令，透過 `node.invoke` 或 `openclaw nodes location get` 呼叫。
- 預設為關閉。
- Android 第三方建置使用選擇器：關閉 / 使用期間 / 永遠。Play 建置維持關閉 / 使用期間。
- 精確位置是另一個獨立切換。

## 為什麼使用選擇器（而不只是開關）

作業系統的位置權限是多層級的。精確位置也是獨立的作業系統授權（iOS 14+ 的「精確」、Android 的「精確」與「粗略」）。應用程式內的選擇器會驅動要求的模式，但實際授權仍由作業系統決定。

## 設定模型

每個節點裝置：

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UI 行為：

- 選擇 `whileUsing` 會要求前景權限。
- 在 Android 第三方建置中選擇 `always` 時，會先要求前景權限，說明背景存取權，然後開啟 Android 應用程式設定，以授予獨立的 **一律允許** 權限。
- Android Play 建置不會宣告背景位置權限，也不會顯示 `always`。
- 如果作業系統拒絕要求的層級，應用程式會還原為已授予的最高層級並顯示狀態。

## 權限對應（node.permissions）

選用。macOS 節點會透過 `node.list`/`node.describe` 上的 `permissions` 對應回報 `location`；iOS/Android 可能會省略。

## 命令：`location.get`

透過 `node.invoke` 呼叫，或使用命令列介面輔助命令：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

參數：

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

命令列介面旗標會直接對應：`--location-timeout` -> `timeoutMs`、`--max-age` -> `maxAgeMs`、`--accuracy` -> `desiredAccuracy`。

回應酬載：

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

錯誤（穩定代碼）：

- `LOCATION_DISABLED`：選擇器已關閉。
- `LOCATION_PERMISSION_REQUIRED`：要求的模式缺少權限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：應用程式在背景中，但只授予「使用期間」。
- `LOCATION_TIMEOUT`：時間內沒有定位結果。
- `LOCATION_UNAVAILABLE`：系統失敗或沒有提供者。

## 背景行為

- Android 第三方建置只有在使用者選擇 `Always` 且 Android 授予背景位置時，才接受背景 `location.get`。既有的持續性節點服務會加入 `location` 服務類型，並在啟用時揭露 `位置：永遠`。
- Android Play 建置和 `While Using` 模式會在背景中拒絕 `location.get`。
- 其他節點平台可能不同。

## 模型/工具整合

- Agent 工具：`nodes` 工具的 `location_get` 動作（必須指定節點）。
- 命令列介面：`openclaw nodes location get --node <id>`。
- Agent 指南：只有在使用者已啟用位置並了解範圍時才呼叫。

## 使用者體驗文案（建議）

- 關閉：「位置分享已停用。」
- 使用期間：「僅在 OpenClaw 開啟時。」
- 永遠：「允許在 OpenClaw 於背景中時要求位置檢查。」
- 精確：「使用精確 GPS 位置。關閉以分享大約位置。」

## 相關

- [節點概覽](/zh-TW/nodes)
- [頻道位置解析](/zh-TW/channels/location)
- [相機擷取](/zh-TW/nodes/camera)
- [通話模式](/zh-TW/nodes/talk)

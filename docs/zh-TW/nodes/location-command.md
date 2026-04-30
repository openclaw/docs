---
read_when:
    - 新增位置節點支援或權限使用者介面
    - 設計 Android 位置權限或前景行為
summary: 節點的位置命令 (location.get)、權限模式，以及 Android 前景行為
title: 位置命令
x-i18n:
    generated_at: "2026-04-30T03:18:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` 是 Node 指令（透過 `node.invoke`）。
- 預設關閉。
- Android 應用程式設定使用選擇器：關閉 / 使用時。
- 獨立切換：精確位置。

## 為什麼使用選擇器（而不只是開關）

作業系統權限是多層級的。我們可以在應用程式內提供選擇器，但實際授權仍由作業系統決定。

- iOS/macOS 可能會在系統提示/設定中提供 **使用時** 或 **一律允許**。
- Android 應用程式目前僅支援前景位置。
- 精確位置是獨立授權（iOS 14+「精確」、Android「fine」與「coarse」）。

UI 中的選擇器會驅動我們要求的模式；實際授權存在於作業系統設定中。

## 設定模型

每個 Node 裝置：

- `location.enabledMode`：`off | whileUsing`
- `location.preciseEnabled`：bool

UI 行為：

- 選取 `whileUsing` 會要求前景權限。
- 如果作業系統拒絕要求的層級，則還原為已授權的最高層級並顯示狀態。

## 權限對應（node.permissions）

選用。macOS Node 會透過權限對應回報 `location`；iOS/Android 可能會省略它。

## 指令：`location.get`

透過 `node.invoke` 呼叫。

參數（建議）：

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

回應 payload：

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
- `LOCATION_PERMISSION_REQUIRED`：缺少所要求模式的權限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：應用程式在背景執行，但僅允許使用時。
- `LOCATION_TIMEOUT`：未能及時取得定位。
- `LOCATION_UNAVAILABLE`：系統失敗 / 沒有提供者。

## 背景行為

- Android 應用程式在背景執行時會拒絕 `location.get`。
- 在 Android 上要求位置時，請保持 OpenClaw 開啟。
- 其他 Node 平台可能不同。

## 模型/工具整合

- 工具介面：`nodes` 工具新增 `location_get` 動作（需要 Node）。
- CLI：`openclaw nodes location get --node <id>`。
- Agent 指南：只有在使用者已啟用位置並了解範圍時才呼叫。

## UX 文案（建議）

- 關閉：「位置分享已停用。」
- 使用時：「僅在 OpenClaw 開啟時。」
- 精確：「使用精確 GPS 位置。關閉可分享約略位置。」

## 相關

- [頻道位置解析](/zh-TW/channels/location)
- [相機擷取](/zh-TW/nodes/camera)
- [交談模式](/zh-TW/nodes/talk)

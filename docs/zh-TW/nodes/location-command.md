---
read_when:
    - 新增位置節點支援或權限 UI
    - 設計 Android 位置權限或前景行為
summary: 節點的位置命令（location.get）、權限模式，以及 Android 前景行為
title: 位置命令
x-i18n:
    generated_at: "2026-07-05T11:31:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d0a4d3321a9b4d290461742edb63a7829aeacb082bff11f65e217443d755dc29
    source_path: nodes/location-command.md
    workflow: 16
---

## TL;DR

- `location.get` 是節點命令，透過 `node.invoke` 或 `openclaw nodes location get` 呼叫。
- 預設關閉。
- Android 應用程式設定使用選擇器：關閉 / 使用期間。
- 精確位置是另一個獨立的切換開關。

## 為什麼使用選擇器（而不只是開關）

作業系統的位置權限有多個層級（iOS/macOS 會公開「使用期間」與「永遠」；Android 目前支援僅前景）。精確位置也是獨立的作業系統授權（iOS 14+ 的「精確」，Android 的「fine」與「coarse」）。應用程式內的選擇器會驅動要求的模式，但實際授權仍由作業系統決定。

## 設定模型

每個節點裝置：

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

介面行為：

- 選取 `whileUsing` 會要求前景權限。
- 如果作業系統拒絕要求的層級，應用程式會退回到已授權的最高層級並顯示狀態。

## 權限對應（node.permissions）

選用。macOS 節點會透過 `node.list`/`node.describe` 上的 `permissions` map 回報 `location`；iOS/Android 可能省略它。

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

命令列介面旗標會直接對應：`--location-timeout` -> `timeoutMs`，`--max-age` -> `maxAgeMs`，`--accuracy` -> `desiredAccuracy`。

回應承載：

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
- `LOCATION_BACKGROUND_UNAVAILABLE`：應用程式在背景執行，但只授權「使用期間」。
- `LOCATION_TIMEOUT`：未在時間內取得定位。
- `LOCATION_UNAVAILABLE`：系統失敗或沒有提供者。

## 背景行為

- Android 應用程式在背景執行時會拒絕 `location.get`；在 Android 上要求位置時，請保持 OpenClaw 開啟。
- 其他節點平台可能不同。

## 模型/工具整合

- 代理工具：`nodes` 工具的 `location_get` 動作（需要節點）。
- 命令列介面：`openclaw nodes location get --node <id>`。
- 代理指南：只有在使用者已啟用位置且了解範圍時才呼叫。

## 使用者體驗文案（建議）

- 關閉：「位置分享已停用。」
- 使用期間：「僅在 OpenClaw 開啟時。」
- 精確：「使用精確 GPS 位置。關閉切換開關以分享約略位置。」

## 相關

- [節點概覽](/zh-TW/nodes)
- [通道位置解析](/zh-TW/channels/location)
- [相機擷取](/zh-TW/nodes/camera)
- [對話模式](/zh-TW/nodes/talk)

---
read_when:
    - 新增位置節點支援或權限 UI
    - 設計 Android 位置權限或前景行為
summary: Node 的定位命令 (location.get)、權限模式與 Android 前景行為
title: 位置命令
x-i18n:
    generated_at: "2026-05-06T09:12:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
---

## 重點摘要

- `location.get` 是節點命令（透過 `node.invoke`）。
- 預設關閉。
- Android App 設定使用選擇器：關閉 / 使用期間。
- 獨立切換：精確位置。

## 為什麼使用選擇器（而不是只有開關）

作業系統權限是多層級的。我們可以在 App 內公開選擇器，但作業系統仍會決定實際授權。

- iOS/macOS 可能會在系統提示/設定中公開 **使用期間** 或 **永遠**。
- Android App 目前只支援前景位置。
- 精確位置是獨立授權（iOS 14+「精確」、Android 的「fine」與「coarse」）。

UI 中的選擇器會驅動我們請求的模式；實際授權則存在於作業系統設定中。

## 設定模型

每個節點裝置：

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 行為：

- 選擇 `whileUsing` 會請求前景權限。
- 如果作業系統拒絕請求的層級，則還原為已授權的最高層級並顯示狀態。

## 權限對應（node.permissions）

選用。macOS 節點會透過權限對應回報 `location`；iOS/Android 可能會省略。

## 命令：`location.get`

透過 `node.invoke` 呼叫。

參數（建議）：

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

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
- `LOCATION_PERMISSION_REQUIRED`：請求模式缺少權限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：App 在背景中，但僅允許使用期間。
- `LOCATION_TIMEOUT`：未能及時取得定位。
- `LOCATION_UNAVAILABLE`：系統故障 / 沒有提供者。

## 背景行為

- Android App 在背景中時會拒絕 `location.get`。
- 在 Android 上請求位置時，請保持 OpenClaw 開啟。
- 其他節點平台可能不同。

## 模型/工具整合

- 工具介面：`nodes` 工具新增 `location_get` 動作（需要節點）。
- CLI：`openclaw nodes location get --node <id>`。
- 代理指南：只有在使用者已啟用位置並理解範圍時才呼叫。

## UX 文案（建議）

- 關閉：「位置分享已停用。」
- 使用期間：「僅限 OpenClaw 開啟時。」
- 精確：「使用精確 GPS 位置。關閉切換可分享大約位置。」

## 相關

- [頻道位置解析](/zh-TW/channels/location)
- [相機擷取](/zh-TW/nodes/camera)
- [對話模式](/zh-TW/nodes/talk)

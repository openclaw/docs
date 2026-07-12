---
read_when:
    - 新增位置節點支援或權限介面
    - 設計 Android 定位權限或前景行為
summary: 節點的位置命令（location.get）、權限模式，以及 Android 前景執行行為
title: 位置指令
x-i18n:
    generated_at: "2026-07-11T21:30:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## 摘要

- `location.get` 是節點命令，透過 `node.invoke` 或 `openclaw nodes location get` 呼叫。
- 預設為關閉。
- Android 第三方版本使用選擇器：關閉 / 使用期間 / 一律允許。Play 版本仍為關閉 / 使用期間。
- 精確位置是獨立的切換開關。

## 為何使用選擇器（而不只是開關）

作業系統的位置權限分為多個層級。精確位置也是作業系統的獨立授權（iOS 14+ 的「精確」、Android 的「精確」與「概略」）。應用程式內的選擇器會決定要求的模式，但實際授予的權限仍由作業系統決定。

## 設定模型

每部節點裝置：

- `location.enabledMode`：`off | whileUsing | always`
- `location.preciseEnabled`：布林值

使用者介面行為：

- 選取 `whileUsing` 會要求前景位置權限。
- 在 Android 第三方版本中選取 `always` 時，會先要求前景位置權限、說明背景存取，再開啟 Android 應用程式設定，以單獨授予 **Allow all the time** 權限。
- Android Play 版本不會宣告背景位置權限，也不會顯示 `always`。
- 如果作業系統拒絕要求的權限層級，應用程式會恢復為已授予的最高層級並顯示狀態。

## 權限對應（node.permissions）

選用。macOS 節點會透過 `node.list`/`node.describe` 上的 `permissions` 對應表回報 `location`；iOS/Android 可能會省略此項。

## 命令：`location.get`

透過 `node.invoke` 或命令列介面輔助命令呼叫：

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

回應承載資料：

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
- `LOCATION_BACKGROUND_UNAVAILABLE`：應用程式位於背景，但僅授予使用期間權限。
- `LOCATION_TIMEOUT`：未能及時取得定位。
- `LOCATION_UNAVAILABLE`：系統故障或沒有可用的定位提供者。

## 背景行為

- 僅當使用者選取 `Always` 且 Android 已授予背景位置權限時，Android 第三方版本才會接受背景執行的 `location.get`。現有的常駐節點服務會新增 `location` 服務類型，並在運作時揭露 `Location: Always`。
- Android Play 版本和 `While Using` 模式會在應用程式位於背景時拒絕 `location.get`。
- 其他節點平台的行為可能不同。

## 模型／工具整合

- 代理程式工具：`nodes` 工具的 `location_get` 動作（必須指定節點）。
- 命令列介面：`openclaw nodes location get --node <id>`。
- 代理程式準則：僅在使用者已啟用位置功能並了解其範圍時呼叫。

## 使用者體驗文案（建議）

- 關閉：「位置分享已停用。」
- 使用期間：「僅在 OpenClaw 開啟時。」
- 一律允許：「允許在 OpenClaw 位於背景時執行要求的位置檢查。」
- 精確：「使用精確的 GPS 位置。關閉此選項可分享概略位置。」

## 相關內容

- [節點概覽](/zh-TW/nodes)
- [頻道位置解析](/zh-TW/channels/location)
- [相機擷取](/zh-TW/nodes/camera)
- [對話模式](/zh-TW/nodes/talk)

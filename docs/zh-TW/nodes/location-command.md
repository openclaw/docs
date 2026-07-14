---
read_when:
    - 新增位置節點支援或權限使用者介面
    - 設計 Android 定位權限或前景行為
summary: 節點定位命令、平台權限模式，以及 Linux GeoClue 設定
title: 位置命令
x-i18n:
    generated_at: "2026-07-14T13:53:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## 重點摘要

- `location.get` 是節點命令，透過 `node.invoke` 或 `openclaw nodes location get` 呼叫。
- 預設為關閉。
- Android 第三方建置版本使用選擇器：關閉／使用期間／永遠。Play 建置版本則維持關閉／使用期間。
- 精確位置是獨立的切換開關。

## 為什麼使用選擇器（而非只有開關）

作業系統的位置權限分為多個層級。精確位置也是作業系統另行授予的權限（iOS 14+ 的 “Precise”，以及 Android 的 “fine” 與 “coarse”）。應用程式內的選擇器會控制要求的模式，但實際授予的權限仍由作業系統決定。

## 設定模型

每個節點裝置：

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

使用者介面行為：

- 選取 `whileUsing` 會要求前景位置權限。
- 在 Android 第三方建置版本中選取 `always`，會先要求前景位置權限、說明背景存取，接著開啟 Android 應用程式設定，以便另行授予 **Allow all the time** 權限。
- Android Play 建置版本不會宣告背景位置權限，也不會顯示 `always`。
- 如果作業系統拒絕要求的層級，應用程式會還原至已授予的最高層級並顯示狀態。

## 權限對應（node.permissions）

選用。macOS 節點透過 `node.list`/`node.describe` 上的 `permissions` 對應表回報 `location`；iOS/Android 可能省略此項。

## 命令：`location.get`

透過 `node.invoke` 或命令列介面輔助工具呼叫：

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
- `LOCATION_BACKGROUND_UNAVAILABLE`：應用程式在背景執行，但僅獲授予使用期間權限。
- `LOCATION_TIMEOUT`：未及時取得定位結果。
- `LOCATION_UNAVAILABLE`：系統故障或沒有可用的提供者。

## 背景行為

- 只有在使用者選取 `Always`，且 Android 已授予背景位置權限時，Android 第三方建置版本才會接受背景 `location.get`。現有的常駐節點服務會加入 `location` 服務類型，並在啟用期間揭露 `Location: Always`。
- Android Play 建置版本和 `While Using` 模式在背景執行時會拒絕 `location.get`。
- 其他節點平台的行為可能不同。

## Linux 節點主機

隨附的 Linux 節點外掛會將 `location.get` 加入命令列介面 `openclaw node` 服務，也支援未安裝 Linux 桌面應用程式的無頭主機。位置功能預設為關閉。請在外掛項目下啟用此功能，然後重新啟動節點服務：

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

安裝 GeoClue2 及其 `where-am-i` 示範程式（在 Debian 和 Ubuntu 上為 `geoclue-2-demo`）。主機的 GeoClue 原則與授權代理程式必須允許節點服務使用者存取。

此外掛使用 `where-am-i`，而非依序呼叫多個 `busctl`。GeoClue 會將用戶端建立、屬性、啟動、更新和停止繫結至同一個 D-Bus 用戶端連線；示範程式會讓這些生命週期階段維持在一起，個別的 `busctl` 子程序則無法做到。不會新增 npm 相依套件。

Linux 會將 `coarse`、`balanced` 和 `precise` 分別對應至 GeoClue 的 `4`、`6` 和 `8` 精確度層級。它會根據傳回的時間戳記驗證 `maxAgeMs`。GeoClue 的示範程式不會公開所選的提供者，因此 `source` 為 `unknown`；只有在回報的精確度為 100 公尺或更佳時，`isPrecise` 才為 true。

Linux 使用相同的穩定錯誤：`LOCATION_DISABLED`、`LOCATION_TIMEOUT` 和 `LOCATION_UNAVAILABLE`。

## 模型／工具整合

- 代理程式工具：`nodes` 工具的 `location_get` 動作（必須指定節點）。
- 命令列介面：`openclaw nodes location get --node <id>`。
- 代理程式準則：只有在使用者已啟用位置功能且了解其範圍時才能呼叫。

## 使用者體驗文案（建議）

- 關閉：“位置分享功能已停用。”
- 使用期間：“僅在 OpenClaw 開啟時。”
- 永遠：“允許在 OpenClaw 於背景執行時進行要求的位置檢查。”
- 精確：“使用精確的 GPS 位置。關閉此選項可分享大概位置。”

## 相關內容

- [節點概覽](/zh-TW/nodes)
- [頻道位置解析](/zh-TW/channels/location)
- [相機擷取](/zh-TW/nodes/camera)
- [對話模式](/zh-TW/nodes/talk)

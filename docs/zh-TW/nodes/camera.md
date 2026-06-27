---
read_when:
    - 新增或修改 iOS/Android 節點或 macOS 上的相機擷取
    - 擴充代理可存取的 MEDIA 暫存檔工作流程
summary: 相機擷取（iOS/Android 節點 + macOS 應用程式）供代理程式使用：照片（jpg）與短影片片段（mp4）
title: 相機擷取
x-i18n:
    generated_at: "2026-06-27T19:29:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支援代理工作流程的**相機擷取**：

- **iOS 節點**（透過閘道配對）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選擇包含音訊）。
- **Android 節點**（透過閘道配對）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選擇包含音訊）。
- **macOS app**（透過閘道的節點）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選擇包含音訊）。

所有相機存取都受**使用者可控制的設定**保護。

## iOS 節點

### 使用者設定（預設開啟）

- iOS 設定分頁 → **相機** → **允許相機**（`camera.enabled`）
  - 預設：**開啟**（缺少此鍵會視為已啟用）。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED`。

### 命令（透過閘道 `node.invoke`）

- `camera.list`
  - 回應酬載：
    - `devices`：`{ id, name, position, deviceType }` 的陣列

- `camera.snap`
  - 參數：
    - `facing`：`front|back`（預設：`front`）
    - `maxWidth`：數字（選用；iOS 節點上的預設值為 `1600`）
    - `quality`：`0..1`（選用；預設 `0.9`）
    - `format`：目前為 `jpg`
    - `delayMs`：數字（選用；預設 `0`）
    - `deviceId`：字串（選用；來自 `camera.list`）
  - 回應酬載：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - 酬載保護：照片會重新壓縮，讓 base64 酬載維持在 5 MB 以下。

- `camera.clip`
  - 參數：
    - `facing`：`front|back`（預設：`front`）
    - `durationMs`：數字（預設 `3000`，上限夾制為 `60000`）
    - `includeAudio`：布林值（預設 `true`）
    - `format`：目前為 `mp4`
    - `deviceId`：字串（選用；來自 `camera.list`）
  - 回應酬載：
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 前景需求

與 `canvas.*` 類似，iOS 節點只允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### 命令列介面輔助工具

取得媒體檔案最簡單的方式，是使用命令列介面輔助工具；它會將解碼後的媒體寫入暫存檔，並列印已儲存的路徑。

範例：

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注意：

- `nodes camera snap` 預設會使用**兩個**朝向，讓代理取得兩個視角。
- 輸出檔案是暫存檔（位於 OS 暫存目錄），除非你建置自己的包裝器。

## Android 節點

### Android 使用者設定（預設開啟）

- Android 設定面板 → **相機** → **允許相機**（`camera.enabled`）
  - 預設：**開啟**（缺少此鍵會視為已啟用）。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED`。

### 權限

- Android 需要執行階段權限：
  - `camera.snap` 和 `camera.clip` 都需要 `CAMERA`。
  - 當 `includeAudio=true` 時，`camera.clip` 需要 `RECORD_AUDIO`。

如果缺少權限，app 會在可行時提示；如果遭拒，`camera.*` 要求會以
`*_PERMISSION_REQUIRED` 錯誤失敗。

### Android 前景需求

與 `canvas.*` 類似，Android 節點只允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### Android 命令（透過閘道 `node.invoke`）

- `camera.list`
  - 回應酬載：
    - `devices`：`{ id, name, position, deviceType }` 的陣列

### 酬載保護

照片會重新壓縮，讓 base64 酬載維持在 5 MB 以下。

## macOS app

### 使用者設定（預設關閉）

macOS companion app 提供一個核取方塊：

- **設定 → 一般 → 允許相機**（`openclaw.cameraEnabled`）
  - 預設：**關閉**
  - 關閉時：相機要求會傳回「使用者已停用相機」。

### 命令列介面輔助工具（節點呼叫）

使用主要的 `openclaw` 命令列介面，在 macOS 節點上呼叫相機命令。

範例：

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注意：

- `openclaw nodes camera snap` 預設為 `maxWidth=1600`，除非被覆寫。
- 在 macOS 上，`camera.snap` 會在暖機／曝光穩定後等待 `delayMs`（預設 2000ms）再擷取。
- 照片酬載會重新壓縮，讓 base64 維持在 5 MB 以下。

## 安全性與實務限制

- 相機與麥克風存取會觸發一般的 OS 權限提示（並且需要 Info.plist 中的用途字串）。
- 影片片段有上限（目前為 `<= 60s`），以避免節點酬載過大（base64 額外負擔 + 訊息限制）。

## macOS 螢幕影片（OS 層級）

對於_螢幕_影片（不是相機），請使用 macOS companion：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

注意：

- 需要 macOS **螢幕錄製**權限（TCC）。

## 相關

- [圖片與媒體支援](/zh-TW/nodes/images)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [位置命令](/zh-TW/nodes/location-command)

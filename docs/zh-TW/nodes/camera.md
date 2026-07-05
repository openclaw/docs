---
read_when:
    - 在 iOS/Android 節點或 macOS 上新增或修改相機擷取
    - 擴充代理可存取的 MEDIA 暫存檔工作流程
summary: 供代理使用的相機擷取（iOS/Android 節點 + macOS app）：相片（jpg）和短影片片段（mp4）
title: 相機擷取
x-i18n:
    generated_at: "2026-07-05T11:31:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支援在已配對的 **iOS**、**Android** 和 **macOS** 節點上，為代理工作流程進行相機擷取：透過閘道 `node.invoke` 擷取照片 (`jpg`) 或短影片片段（`mp4`，可選擇包含音訊）。

所有相機存取都會受每個平台上由使用者控制的設定限制。

## iOS 節點

### iOS 使用者設定

- iOS 設定分頁 → **相機** → **允許相機** (`camera.enabled`)。
  - 預設：**開啟**（缺少鍵值會被視為已啟用）。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED`。

### iOS 命令（透過閘道 `node.invoke`）

- `camera.list`
  - 回應承載資料：`devices` — `{ id, name, position, deviceType }` 的陣列。

- `camera.snap`
  - 參數：
    - `facing`: `front|back`（預設：`front`）
    - `maxWidth`: number（選用；預設 `1600`）
    - `quality`: `0..1`（選用；預設 `0.9`，限制在 `[0.05, 1.0]`）
    - `format`: 目前為 `jpg`
    - `delayMs`: number（選用；預設 `0`，內部上限為 `10000`）
    - `deviceId`: string（選用；來自 `camera.list`）
  - 回應承載資料：`format: "jpg"`、`base64`、`width`、`height`。
  - 承載資料防護：照片會重新壓縮，讓 base64 編碼後的承載資料維持在 5MB 以下。

- `camera.clip`
  - 參數：
    - `facing`: `front|back`（預設：`front`）
    - `durationMs`: number（預設 `3000`，限制在 `[250, 60000]`）
    - `includeAudio`: boolean（預設 `true`）
    - `format`: 目前為 `mp4`
    - `deviceId`: string（選用；來自 `camera.list`）
  - 回應承載資料：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。

### iOS 前景要求

如同 `canvas.*`，iOS 節點只允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### 命令列介面輔助工具

取得媒體檔案最簡單的方式是透過命令列介面輔助工具，它會將解碼後的媒體寫入暫存檔，並列印儲存路徑。

```bash
openclaw nodes camera snap --node <id>                 # 預設：前鏡頭 + 後鏡頭（2 個 MEDIA 行）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` 預設為 `--facing both`，會同時擷取前鏡頭和後鏡頭，讓代理取得兩個視角；若傳入 `--device-id`，必須搭配單一明確的 facing（設定 `--device-id` 時會拒絕 `both`）。輸出檔案會是暫存檔（位於 OS 暫存目錄），除非你建置自己的包裝工具。

## Android 節點

### Android 使用者設定

- Android 設定面板 → **相機** → **允許相機** (`camera.enabled`)。
  - **全新安裝預設為關閉。** 早於此設定的既有安裝會遷移為**開啟**，因此升級不會悄悄失去先前可用的相機存取。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED: enable Camera in Settings`。

### 權限

- `CAMERA` 是 `camera.snap` 和 `camera.clip` 都需要的權限；缺少或遭拒的權限會傳回 `CAMERA_PERMISSION_REQUIRED`。
- 當 `includeAudio` 為 `true` 時，`camera.clip` 需要 `RECORD_AUDIO`；缺少或遭拒的權限會傳回 `MIC_PERMISSION_REQUIRED`。

應用程式會在可行時提示執行階段權限。

### Android 前景要求

如同 `canvas.*`，Android 節點只允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`。

### Android 命令（透過閘道 `node.invoke`）

- `camera.list`
  - 回應承載資料：`devices` — `{ id, name, position, deviceType }` 的陣列。

- `camera.snap`
  - 參數：`facing`（`front|back`，預設 `front`）、`quality`（預設 `0.95`，限制在 `[0.1, 1.0]`）、`maxWidth`（預設 `1600`）、`deviceId`（選用；未知 id 會以 `INVALID_REQUEST` 失敗）。
  - 回應承載資料：`format: "jpg"`、`base64`、`width`、`height`。
  - 承載資料防護：重新壓縮以讓 base64 維持在 5MB 以下（與 iOS 相同的容量預算）。

- `camera.clip`
  - 參數：`facing`（預設 `front`）、`durationMs`（預設 `3000`，限制在 `[200, 60000]`）、`includeAudio`（預設 `true`）、`deviceId`（選用）。
  - 回應承載資料：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。
  - 承載資料防護：原始 MP4 在 base64 編碼前上限為 18MB；超出大小的片段會以 `PAYLOAD_TOO_LARGE` 失敗（請降低 `durationMs` 後重試）。

## macOS 應用程式

### macOS 使用者設定

macOS 伴隨應用程式提供核取方塊：

- **設定 → 一般 → 允許相機** (`openclaw.cameraEnabled`)。
  - 預設：**關閉**。
  - 關閉時：相機要求會傳回 `CAMERA_DISABLED: enable Camera in Settings`。

### 命令列介面輔助工具（節點 invoke）

使用主要的 `openclaw` 命令列介面，在 macOS 節點上呼叫相機命令。

```bash
openclaw nodes camera list --node <id>                     # 列出相機 id
openclaw nodes camera snap --node <id>                     # 列印儲存路徑
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # 列印儲存路徑
openclaw nodes camera clip --node <id> --duration-ms 3000   # 列印儲存路徑（舊版旗標）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- 除非覆寫，`openclaw nodes camera snap` 預設為 `maxWidth=1600`。
- `camera.snap` 會在暖機／曝光穩定後等待 `delayMs`（預設 2000ms，限制在 `[0, 10000]`）再進行擷取。
- 照片承載資料會重新壓縮，讓 base64 維持在 5MB 以下。

## 安全性 + 實務限制

- 相機和麥克風存取會觸發一般的 OS 權限提示（並需要 `Info.plist` 中的用途字串）。
- 影片片段上限為 60s，以避免節點承載資料過大（base64 額外負擔加上訊息限制）。

## macOS 螢幕影片（OS 層級）

若要錄製_螢幕_影片（不是相機），請使用 macOS 伴隨應用程式：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 列印儲存路徑
```

需要 macOS **螢幕錄製**權限 (TCC)。

## 相關

- [影像與媒體支援](/zh-TW/nodes/images)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [位置命令](/zh-TW/nodes/location-command)

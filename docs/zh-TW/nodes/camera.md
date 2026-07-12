---
read_when:
    - 在 iOS/Android 節點或 macOS 上新增或修改相機擷取功能
    - 擴充代理程式可存取的 MEDIA 暫存檔工作流程
summary: 供代理使用的相機擷取功能（iOS/Android 節點 + macOS 應用程式）：照片（jpg）和短片（mp4）
title: 相機拍攝
x-i18n:
    generated_at: "2026-07-11T21:27:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支援在已配對的 **iOS**、**Android** 與 **macOS** 節點上，為代理工作流程擷取相機內容：透過閘道 `node.invoke` 拍攝照片（`jpg`）或短片（`mp4`，可選擇包含音訊）。

所有相機存取都受各平台上由使用者控制的設定限制。

## iOS 節點

### iOS 使用者設定

- iOS Settings 分頁 → **Camera** → **Allow Camera**（`camera.enabled`）。
  - 預設：**開啟**（缺少此鍵時視為已啟用）。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED`。

### iOS 命令（透過閘道 `node.invoke`）

- `camera.list`
  - 回應承載內容：`devices` — `{ id, name, position, deviceType }` 陣列。

- `camera.snap`
  - 參數：
    - `facing`：`front|back`（預設：`front`）
    - `maxWidth`：數值（選用；預設為 `1600`）
    - `quality`：`0..1`（選用；預設為 `0.9`，限制在 `[0.05, 1.0]` 範圍內）
    - `format`：目前為 `jpg`
    - `delayMs`：數值（選用；預設為 `0`，內部上限為 `10000`）
    - `deviceId`：字串（選用；來自 `camera.list`）
  - 回應承載內容：`format: "jpg"`、`base64`、`width`、`height`。
  - 承載內容保護：照片會重新壓縮，使經 base64 編碼的承載內容保持在 5MB 以下。

- `camera.clip`
  - 參數：
    - `facing`：`front|back`（預設：`front`）
    - `durationMs`：數值（預設為 `3000`，限制在 `[250, 60000]` 範圍內）
    - `includeAudio`：布林值（預設為 `true`）
    - `format`：目前為 `mp4`
    - `deviceId`：字串（選用；來自 `camera.list`）
  - 回應承載內容：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。

### iOS 前景執行要求

與 `canvas.*` 相同，iOS 節點僅允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### 命令列介面輔助工具

取得媒體檔案最簡單的方式是使用命令列介面輔助工具；它會將解碼後的媒體寫入暫存檔，並輸出儲存路徑。

```bash
openclaw nodes camera snap --node <id>                 # 預設：前後鏡頭各一張（2 行 MEDIA）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` 預設使用 `--facing both`，同時從前後鏡頭擷取畫面，讓代理取得兩個視角；若傳入 `--device-id`，則必須指定單一明確的鏡頭方向（設定 `--device-id` 時會拒絕 `both`）。除非自行建立包裝工具，否則輸出檔案都是暫存檔（位於作業系統的暫存目錄中）。

## Android 節點

### Android 使用者設定

- Android Settings 面板 → **Camera** → **Allow Camera**（`camera.enabled`）。
  - **全新安裝預設為關閉。** 在此設定推出前既有的安裝版本會遷移為**開啟**，確保升級後不會在沒有提示的情況下失去原本可用的相機存取權限。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED: enable Camera in Settings`。

### 權限

- `camera.snap` 與 `camera.clip` 都需要 `CAMERA`；缺少權限或權限遭拒時會傳回 `CAMERA_PERMISSION_REQUIRED`。
- 當 `includeAudio` 為 `true` 時，`camera.clip` 需要 `RECORD_AUDIO`；缺少權限或權限遭拒時會傳回 `MIC_PERMISSION_REQUIRED`。

應用程式會在可行時提示授予執行階段權限。

### Android 前景執行要求

與 `canvas.*` 相同，Android 節點僅允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`。

### Android 命令（透過閘道 `node.invoke`）

- `camera.list`
  - 回應承載內容：`devices` — `{ id, name, position, deviceType }` 陣列。

- `camera.snap`
  - 參數：`facing`（`front|back`，預設為 `front`）、`quality`（預設為 `0.95`，限制在 `[0.1, 1.0]` 範圍內）、`maxWidth`（預設為 `1600`）、`deviceId`（選用；未知的 ID 會以 `INVALID_REQUEST` 失敗）。
  - 回應承載內容：`format: "jpg"`、`base64`、`width`、`height`。
  - 承載內容保護：重新壓縮，使 base64 保持在 5MB 以下（與 iOS 使用相同的大小上限）。

- `camera.clip`
  - 參數：`facing`（預設為 `front`）、`durationMs`（預設為 `3000`，限制在 `[200, 60000]` 範圍內）、`includeAudio`（預設為 `true`）、`deviceId`（選用）。
  - 回應承載內容：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。
  - 承載內容保護：編碼為 base64 前，原始 MP4 的上限為 18MB；過大的短片會以 `PAYLOAD_TOO_LARGE` 失敗（請縮短 `durationMs` 後重試）。

## macOS 應用程式

### macOS 使用者設定

macOS 配套應用程式提供一個核取方塊：

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）。
  - 預設：**關閉**。
  - 關閉時：相機要求會傳回 `CAMERA_DISABLED: enable Camera in Settings`。

### 命令列介面輔助工具（節點呼叫）

使用主要的 `openclaw` 命令列介面，在 macOS 節點上呼叫相機命令。

```bash
openclaw nodes camera list --node <id>                     # 列出相機 ID
openclaw nodes camera snap --node <id>                     # 輸出儲存路徑
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # 輸出儲存路徑
openclaw nodes camera clip --node <id> --duration-ms 3000   # 輸出儲存路徑（舊版旗標）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- 除非另行覆寫，`openclaw nodes camera snap` 預設使用 `maxWidth=1600`。
- `camera.snap` 會在暖機／曝光穩定後等待 `delayMs`（預設為 2000ms，限制在 `[0, 10000]` 範圍內），再進行拍攝。
- 照片承載內容會重新壓縮，使 base64 保持在 5MB 以下。

## 安全性與實際限制

- 存取相機和麥克風會觸發一般的作業系統權限提示（並且需要在 `Info.plist` 中提供用途說明字串）。
- 影片長度上限為 60 秒，以避免節點承載內容過大（包括 base64 額外負擔與訊息大小限制）。

## macOS 螢幕錄影（作業系統層級）

若要錄製_螢幕_影片（而非相機），請使用 macOS 配套應用程式：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 輸出儲存路徑
```

需要 macOS **Screen Recording** 權限（TCC）。

## 相關內容

- [圖片與媒體支援](/zh-TW/nodes/images)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [位置命令](/zh-TW/nodes/location-command)

---
read_when:
    - 新增或修改 iOS/Android Node 或 macOS 上的相機擷取功能
    - 擴充代理程式可存取的媒體暫存檔案工作流程
summary: 供代理程式使用的相機擷取（iOS/Android 節點 + macOS 應用程式）：照片（jpg）和短影片片段（mp4）
title: 相機擷取
x-i18n:
    generated_at: "2026-05-06T09:12:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支援代理工作流程的**相機擷取**：

- **iOS 節點**（透過 Gateway 配對）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選擇包含音訊）。
- **Android 節點**（透過 Gateway 配對）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選擇包含音訊）。
- **macOS App**（透過 Gateway 的節點）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選擇包含音訊）。

所有相機存取都受**使用者可控制的設定**管控。

## iOS 節點

### 使用者設定（預設開啟）

- iOS 設定分頁 → **相機** → **允許相機**（`camera.enabled`）
  - 預設：**開啟**（缺少此鍵會視為已啟用）。
  - 關閉時：`camera.*` 指令會傳回 `CAMERA_DISABLED`。

### 指令（透過 Gateway `node.invoke`）

- `camera.list`
  - 回應 payload：
    - `devices`：`{ id, name, position, deviceType }` 的陣列

- `camera.snap`
  - 參數：
    - `facing`：`front|back`（預設：`front`）
    - `maxWidth`：數字（選用；iOS 節點上的預設值為 `1600`）
    - `quality`：`0..1`（選用；預設 `0.9`）
    - `format`：目前為 `jpg`
    - `delayMs`：數字（選用；預設 `0`）
    - `deviceId`：字串（選用；來自 `camera.list`）
  - 回應 payload：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - Payload 保護：照片會重新壓縮，以將 base64 payload 維持在 5 MB 以下。

- `camera.clip`
  - 參數：
    - `facing`：`front|back`（預設：`front`）
    - `durationMs`：數字（預設 `3000`，上限夾制為 `60000`）
    - `includeAudio`：布林值（預設 `true`）
    - `format`：目前為 `mp4`
    - `deviceId`：字串（選用；來自 `camera.list`）
  - 回應 payload：
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 前景需求

和 `canvas.*` 一樣，iOS 節點只允許在**前景**執行 `camera.*` 指令。背景叫用會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### CLI 輔助工具（暫存檔案 + MEDIA）

取得附件最簡單的方式是使用 CLI 輔助工具，它會將解碼後的媒體寫入暫存檔案，並列印 `MEDIA:<path>`。

範例：

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注意事項：

- `nodes camera snap` 預設使用**兩種**朝向，以便為代理提供兩個視角。
- 輸出檔案是暫存檔（位於作業系統暫存目錄），除非你建置自己的 wrapper。

## Android 節點

### Android 使用者設定（預設開啟）

- Android 設定面板 → **相機** → **允許相機**（`camera.enabled`）
  - 預設：**開啟**（缺少此鍵會視為已啟用）。
  - 關閉時：`camera.*` 指令會傳回 `CAMERA_DISABLED`。

### 權限

- Android 需要執行階段權限：
  - `CAMERA` 用於 `camera.snap` 和 `camera.clip`。
  - 當 `includeAudio=true` 時，`camera.clip` 需要 `RECORD_AUDIO`。

如果缺少權限，App 會在可行時提示；如果被拒絕，`camera.*` 請求會因
`*_PERMISSION_REQUIRED` 錯誤而失敗。

### Android 前景需求

和 `canvas.*` 一樣，Android 節點只允許在**前景**執行 `camera.*` 指令。背景叫用會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### Android 指令（透過 Gateway `node.invoke`）

- `camera.list`
  - 回應 payload：
    - `devices`：`{ id, name, position, deviceType }` 的陣列

### Payload 保護

照片會重新壓縮，以將 base64 payload 維持在 5 MB 以下。

## macOS App

### 使用者設定（預設關閉）

macOS companion App 提供一個核取方塊：

- **設定 → 一般 → 允許相機**（`openclaw.cameraEnabled`）
  - 預設：**關閉**
  - 關閉時：相機請求會傳回「使用者已停用相機」。

### CLI 輔助工具（節點叫用）

使用主要的 `openclaw` CLI 在 macOS 節點上叫用相機指令。

範例：

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注意事項：

- `openclaw nodes camera snap` 預設為 `maxWidth=1600`，除非被覆寫。
- 在 macOS 上，`camera.snap` 會在暖機／曝光穩定後等待 `delayMs`（預設 2000ms）再擷取。
- 照片 payload 會重新壓縮，以將 base64 維持在 5 MB 以下。

## 安全性 + 實際限制

- 相機和麥克風存取會觸發一般的作業系統權限提示（且需要 Info.plist 中的使用說明字串）。
- 影片片段有上限（目前 `<= 60s`），以避免過大的節點 payload（base64 開銷 + 訊息限制）。

## macOS 螢幕影片（作業系統層級）

若要擷取_螢幕_影片（不是相機），請使用 macOS companion：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

注意事項：

- 需要 macOS **螢幕錄製**權限（TCC）。

## 相關

- [圖片和媒體支援](/zh-TW/nodes/images)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [位置指令](/zh-TW/nodes/location-command)

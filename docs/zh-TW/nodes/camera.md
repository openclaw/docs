---
read_when:
    - 在 iOS/Android 節點或 macOS 上新增或修改相機擷取功能
    - 擴充代理可存取的 MEDIA 暫存檔工作流程
summary: 相機擷取（iOS/Android 節點 + macOS app），供代理使用：照片 (jpg) 和短影片片段 (mp4)
title: 相機擷取
x-i18n:
    generated_at: "2026-04-30T03:17:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33e23a382cdcea57e20ab1466bf32e54dd17e3b7918841dbd6d3ebf59547ad93
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支援代理工作流程的**相機擷取**：

- **iOS Node**（透過 Gateway 配對）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選音訊）。
- **Android Node**（透過 Gateway 配對）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選音訊）。
- **macOS 應用程式**（透過 Gateway 的 Node）：透過 `node.invoke` 擷取**照片**（`jpg`）或**短影片片段**（`mp4`，可選音訊）。

所有相機存取都受**使用者控制的設定**保護。

## iOS Node

### 使用者設定（預設開啟）

- iOS「設定」分頁 → **相機** → **允許相機**（`camera.enabled`）
  - 預設：**開啟**（缺少金鑰時視為已啟用）。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED`。

### 命令（透過 Gateway `node.invoke`）

- `camera.list`
  - 回應承載：
    - `devices`：`{ id, name, position, deviceType }` 陣列

- `camera.snap`
  - 參數：
    - `facing`：`front|back`（預設：`front`）
    - `maxWidth`：數字（選用；iOS Node 預設為 `1600`）
    - `quality`：`0..1`（選用；預設 `0.9`）
    - `format`：目前為 `jpg`
    - `delayMs`：數字（選用；預設 `0`）
    - `deviceId`：字串（選用；來自 `camera.list`）
  - 回應承載：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - 承載保護：照片會重新壓縮，以將 base64 承載維持在 5 MB 以下。

- `camera.clip`
  - 參數：
    - `facing`：`front|back`（預設：`front`）
    - `durationMs`：數字（預設 `3000`，上限限制為 `60000`）
    - `includeAudio`：布林值（預設 `true`）
    - `format`：目前為 `mp4`
    - `deviceId`：字串（選用；來自 `camera.list`）
  - 回應承載：
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 前景需求

與 `canvas.*` 一樣，iOS Node 只允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### CLI 輔助工具（暫存檔 + MEDIA）

取得附件最簡單的方式是使用 CLI 輔助工具，它會將解碼後的媒體寫入暫存檔並列印 `MEDIA:<path>`。

範例：

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注意事項：

- `nodes camera snap` 預設使用**兩個**鏡頭方向，讓代理取得兩個視角。
- 輸出檔案是暫時的（位於作業系統暫存目錄），除非你建置自己的包裝工具。

## Android Node

### Android 使用者設定（預設開啟）

- Android「設定」面板 → **相機** → **允許相機**（`camera.enabled`）
  - 預設：**開啟**（缺少金鑰時視為已啟用）。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED`。

### 權限

- Android 需要執行階段權限：
  - `CAMERA` 用於 `camera.snap` 和 `camera.clip`。
  - 當 `includeAudio=true` 時，`RECORD_AUDIO` 用於 `camera.clip`。

如果缺少權限，應用程式會在可行時提示；如果遭拒，`camera.*` 請求會以
`*_PERMISSION_REQUIRED` 錯誤失敗。

### Android 前景需求

與 `canvas.*` 一樣，Android Node 只允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### Android 命令（透過 Gateway `node.invoke`）

- `camera.list`
  - 回應承載：
    - `devices`：`{ id, name, position, deviceType }` 陣列

### 承載保護

照片會重新壓縮，以將 base64 承載維持在 5 MB 以下。

## macOS 應用程式

### 使用者設定（預設關閉）

macOS 伴隨應用程式提供一個核取方塊：

- **設定 → 一般 → 允許相機**（`openclaw.cameraEnabled`）
  - 預設：**關閉**
  - 關閉時：相機請求會傳回「使用者已停用相機」。

### CLI 輔助工具（Node 呼叫）

使用主要的 `openclaw` CLI 在 macOS Node 上呼叫相機命令。

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

- 除非覆寫，`openclaw nodes camera snap` 預設為 `maxWidth=1600`。
- 在 macOS 上，`camera.snap` 會在暖機/曝光穩定後等待 `delayMs`（預設 2000ms）再擷取。
- 照片承載會重新壓縮，以將 base64 維持在 5 MB 以下。

## 安全性 + 實務限制

- 相機與麥克風存取會觸發一般作業系統權限提示（並需要 Info.plist 中的使用說明字串）。
- 影片片段有上限（目前 `<= 60s`），以避免 Node 承載過大（base64 額外負載 + 訊息限制）。

## macOS 螢幕影片（作業系統層級）

若要使用_螢幕_影片（不是相機），請使用 macOS 伴隨工具：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

注意事項：

- 需要 macOS **螢幕錄製**權限（TCC）。

## 相關

- [影像與媒體支援](/zh-TW/nodes/images)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [位置命令](/zh-TW/nodes/location-command)

---
read_when:
    - 在節點平台上新增或修改相機擷取功能
    - 擴充代理程式可存取的 MEDIA 暫存檔工作流程
summary: 在 iOS、Android、macOS 和 Linux 節點上使用相機拍攝照片和短片段影片
title: 相機擷取
x-i18n:
    generated_at: "2026-07-14T13:48:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw 支援在已配對的 **iOS**、**Android**、**macOS** 與 **Linux** 節點上，為代理工作流程擷取相機內容：透過閘道 `node.invoke` 拍攝照片（`jpg`）或短片（`mp4`，可選擇包含音訊）。

所有相機存取都受各平台上由使用者控制的設定所限制。

## iOS 節點

### iOS 使用者設定

- iOS Settings tab → **Camera** → **Allow Camera**（`camera.enabled`）。
  - 預設值：**開啟**（缺少此鍵時視為已啟用）。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED`。

### iOS 命令（透過閘道 `node.invoke`）

- `camera.list`
  - 回應承載資料：`devices` — `{ id, name, position, deviceType }` 的陣列。

- `camera.snap`
  - 參數：
    - `facing`：`front|back`（預設值：`front`）
    - `maxWidth`：數字（選填；預設值 `1600`）
    - `quality`：`0..1`（選填；預設值 `0.9`，限制於 `[0.05, 1.0]`）
    - `format`：目前為 `jpg`
    - `delayMs`：數字（選填；預設值 `0`，內部上限為 `10000`）
    - `deviceId`：字串（選填；來自 `camera.list`）
  - 回應承載資料：`format: "jpg"`、`base64`、`width`、`height`。
  - 承載資料保護：照片會重新壓縮，以將 base64 編碼後的承載資料維持在 5MB 以下。

- `camera.clip`
  - 參數：
    - `facing`：`front|back`（預設值：`front`）
    - `durationMs`：數字（預設值 `3000`，限制於 `[250, 60000]`）
    - `includeAudio`：布林值（預設值 `true`）
    - `format`：目前為 `mp4`
    - `deviceId`：字串（選填；來自 `camera.list`）
  - 回應承載資料：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。

### iOS 前景執行要求

與 `canvas.*` 相同，iOS 節點只允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE`。

### 命令列介面輔助工具

取得媒體檔案最簡單的方式是使用命令列介面輔助工具，它會將解碼後的媒體寫入暫存檔，並印出儲存路徑。

```bash
openclaw nodes camera snap --node <id>                 # 預設：同時使用前置與後置相機（2 行 MEDIA）
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap` 預設為 `--facing both`，同時擷取前置與後置相機，讓代理取得兩種視角；若要指定單一明確朝向，請傳入 `--device-id`（設定 `--device-id` 時，`both` 會遭拒絕）。除非你自行建置包裝程式，否則輸出檔案都是暫存檔（位於作業系統的暫存目錄）。

## Android 節點

### Android 使用者設定

- Android Settings sheet → **Camera** → **Allow Camera**（`camera.enabled`）。
  - **全新安裝預設為關閉。** 在此設定推出前已存在的安裝會遷移為**開啟**，避免升級後無提示地失去原本可用的相機存取權。
  - 關閉時：`camera.*` 命令會傳回 `CAMERA_DISABLED: enable Camera in Settings`。

### 權限

- `CAMERA` 是 `camera.snap` 與 `camera.clip` 兩者的必要權限；權限缺失或遭拒絕時會傳回 `CAMERA_PERMISSION_REQUIRED`。
- 當 `includeAudio` 為 `true` 時，`camera.clip` 需要 `RECORD_AUDIO`；權限缺失或遭拒絕時會傳回 `MIC_PERMISSION_REQUIRED`。

應用程式會在可行時提示授予執行階段權限。

### Android 前景執行要求

與 `canvas.*` 相同，Android 節點只允許在**前景**執行 `camera.*` 命令。背景呼叫會傳回 `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`。

### Android 命令（透過閘道 `node.invoke`）

- `camera.list`
  - 回應承載資料：`devices` — `{ id, name, position, deviceType }` 的陣列。

- `camera.snap`
  - 參數：`facing`（`front|back`，預設值 `front`）、`quality`（預設值 `0.95`，限制於 `[0.1, 1.0]`）、`maxWidth`（預設值 `1600`）、`deviceId`（選填；未知的 ID 會以 `INVALID_REQUEST` 失敗）。
  - 回應承載資料：`format: "jpg"`、`base64`、`width`、`height`。
  - 承載資料保護：重新壓縮以將 base64 維持在 5MB 以下（與 iOS 使用相同的容量限制）。

- `camera.clip`
  - 參數：`facing`（預設值 `front`）、`durationMs`（預設值 `3000`，限制於 `[200, 60000]`）、`includeAudio`（預設值 `true`）、`deviceId`（選填）。
  - 回應承載資料：`format: "mp4"`、`base64`、`durationMs`、`hasAudio`。
  - 承載資料保護：base64 編碼前的原始 MP4 上限為 18MB；過大的短片會以 `PAYLOAD_TOO_LARGE` 失敗（請降低 `durationMs` 後重試）。

## macOS 應用程式

### macOS 使用者設定

macOS 輔助應用程式提供一個核取方塊：

- **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）。
  - 預設值：**關閉**。
  - 關閉時：相機要求會傳回 `CAMERA_DISABLED: enable Camera in Settings`。

### 命令列介面輔助工具（節點呼叫）

使用主要的 `openclaw` 命令列介面，在 macOS 節點上呼叫相機命令。

```bash
openclaw nodes camera list --node <id>                     # 列出相機 ID
openclaw nodes camera snap --node <id>                     # 印出儲存路徑
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # 印出儲存路徑
openclaw nodes camera clip --node <id> --duration-ms 3000   # 印出儲存路徑（舊版旗標）
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- 除非覆寫，否則 `openclaw nodes camera snap` 預設為 `maxWidth=1600`。
- `camera.snap` 會在暖機／曝光穩定後等待 `delayMs`（預設為 2000ms，限制於 `[0, 10000]`），再進行擷取。
- 照片承載資料會重新壓縮，以將 base64 維持在 5MB 以下。

## Linux 節點主機

內建的 Linux 節點外掛會將相機擷取功能加入命令列介面 `openclaw node` 服務。它可在無頭主機上運作，不需要 Linux 桌面應用程式。

相機存取預設為關閉。請在外掛項目下啟用，然後重新啟動節點服務，以重建其閘道公告：

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

需求：

- 具備 V4L2 輸入、`libx264` 與 AAC 支援的 FFmpeg
- 節點服務使用者可讀取的 `/dev/video*` 裝置；在常見的發行版上，請將該使用者加入 `video` 群組
- 若短片使用預設的 `includeAudio: true`，則需要可正常運作且具有預設來源的 PulseAudio 伺服器，或 PipeWire 的 PulseAudio 相容層

Linux 會從 `camera.list` 傳回具備擷取能力且可讀取的 V4L2 裝置路徑；FFmpeg 會探查每個 `/dev/video*` 候選項目，並略過中繼資料節點或僅限輸出的節點。裝置 `position` 為 `unknown`，因此未指定 `deviceId` 的朝向要求會產生一張或一段 `unknown` 位置的照片或短片，而不會宣稱使用前置或後置相機。主機有多部相機時，請使用 `deviceId`。`camera.snap` 會使用 FFmpeg 輸入暖機 `delayMs`，並在限制寬度的同時保留長寬比。`camera.clip` 會將麥克風音訊錄製為 MP4 音軌；OpenClaw 刻意不提供獨立的麥克風命令。

此外掛使用 `libx264` 進行 MP4 視訊編碼，不會無提示地變更編解碼器。缺少必要輸入或編碼器的 FFmpeg 組建會傳回 `CAMERA_UNAVAILABLE`。若照片或短片會超過 25MB 的 base64 承載資料容量限制，則會以 `PAYLOAD_TOO_LARGE` 失敗。

`camera.snap` 與 `camera.clip` 仍屬於危險命令。只有在你確實打算啟用擷取功能時，才將它們加入 `gateway.nodes.allowCommands`；僅啟用外掛不會略過閘道原則。

## 安全性與實際限制

- 存取相機與麥克風會觸發一般的作業系統權限提示（並且需要在 `Info.plist` 中提供用途說明字串）。
- 影片短片的上限為 60s，以避免節點承載資料過大（base64 額外負擔加上訊息限制）。

## macOS 螢幕錄影（作業系統層級）

若要錄製_螢幕_影片（而非相機），請使用 macOS 輔助應用程式：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 印出儲存路徑
```

需要 macOS **Screen Recording** 權限（TCC）。

## 相關內容

- [圖片與媒體支援](/zh-TW/nodes/images)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [位置命令](/zh-TW/nodes/location-command)

---
read_when:
    - 編輯 IPC 合約或選單列應用程式 IPC
summary: OpenClaw app、閘道節點傳輸與 PeekabooBridge 的 macOS IPC 架構
title: macOS 行程間通訊
x-i18n:
    generated_at: "2026-06-28T00:12:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC 架構

**目前模型：**本機 Unix socket 會將**節點主機服務**連接到 **macOS 應用程式**，用於執行核准 + `system.run`。`openclaw-mac` 偵錯命令列介面可用於探索/連線檢查；代理程式動作仍透過閘道 WebSocket 和 `node.invoke` 流動。UI 自動化使用 PeekabooBridge。

## 目標

- 由單一 GUI 應用程式執行個體擁有所有面向 TCC 的工作（通知、螢幕錄製、麥克風、語音、AppleScript）。
- 小型自動化介面：閘道 + 節點命令，外加用於 UI 自動化的 PeekabooBridge。
- 可預期的權限：一律使用相同的已簽署 bundle ID，並由 launchd 啟動，因此 TCC 授權會保留。

## 運作方式

### 閘道 + 節點傳輸

- 應用程式會執行閘道（本機模式），並以節點身分連線到它。
- 代理程式動作會透過 `node.invoke` 執行（例如 `system.run`、`system.notify`、`canvas.*`）。
- 常見的 Mac 節點命令包括 `canvas.*`、`camera.snap`、`camera.clip`、
  `screen.snapshot`、`screen.record`、`system.run` 和 `system.notify`。
- 節點會回報 `permissions` 對應表，讓代理程式可以查看螢幕、
  相機、麥克風、語音、自動化或輔助使用權限是否可用。

### 節點服務 + 應用程式 IPC

- 無頭節點主機服務會連線到閘道 WebSocket。
- `system.run` 請求會透過本機 Unix socket 轉送到 macOS 應用程式。
- 應用程式會在 UI 情境中執行該命令，必要時提示，並回傳輸出。

圖示 (SCI)：

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自動化）

- UI 自動化使用名為 `bridge.sock` 的獨立 UNIX socket，以及 PeekabooBridge JSON 協定。
- 主機偏好順序（用戶端）：Peekaboo.app → Claude.app → OpenClaw.app → 本機執行。
- 安全性：橋接主機需要允許的 TeamID；僅 DEBUG 的相同 UID 逃生通道由 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 保護（Peekaboo 慣例）。
- 詳情請參閱：[PeekabooBridge 使用方式](/zh-TW/platforms/mac/peekaboo)。

## 操作流程

- 重新啟動/重新建置：`SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 終止現有執行個體
  - Swift 建置 + 封裝
  - 寫入/啟動安裝/啟動 LaunchAgent
- 單一執行個體：如果已有相同 bundle ID 的另一個執行個體正在執行，應用程式會提早結束。

## 強化注意事項

- 偏好要求所有特權介面都符合 TeamID。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（僅 DEBUG）可允許相同 UID 呼叫端進行本機開發。
- 所有通訊都保持僅限本機；不公開任何網路 socket。
- TCC 提示只會源自 GUI 應用程式 bundle；請在重新建置之間保持已簽署的 bundle ID 穩定。
- IPC 強化：socket 模式 `0600`、權杖、對等 UID 檢查、HMAC 挑戰/回應、短 TTL。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [macOS IPC 流程（執行核准）](/zh-TW/tools/exec-approvals-advanced#macos-ipc-flow)

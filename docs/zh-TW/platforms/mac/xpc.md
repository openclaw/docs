---
read_when:
    - 編輯 IPC 合約或選單列應用程式 IPC
summary: OpenClaw 應用程式、Gateway Node 傳輸與 PeekabooBridge 的 macOS IPC 架構
title: macOS 行程間通訊
x-i18n:
    generated_at: "2026-04-30T03:21:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 359a33f1a4f5854bd18355f588b4465b5627d9c8fa10a37c884995375da32cac
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC 架構

**目前模型：**本機 Unix socket 將 **Node 主機服務** 連接到 **macOS app**，用於執行核准 + `system.run`。`openclaw-mac` 除錯 CLI 可用於探索/連線檢查；代理動作仍會透過 Gateway WebSocket 和 `node.invoke` 流動。UI 自動化使用 PeekabooBridge。

## 目標

- 單一 GUI app 執行個體，擁有所有面向 TCC 的工作（通知、螢幕錄影、麥克風、語音、AppleScript）。
- 小型自動化介面：Gateway + Node 命令，以及用於 UI 自動化的 PeekabooBridge。
- 可預期的權限：一律使用相同的已簽署 bundle ID，由 launchd 啟動，因此 TCC 授權會保留下來。

## 運作方式

### Gateway + Node 傳輸

- app 會執行 Gateway（本機模式），並以 Node 身分連線到它。
- 代理動作會透過 `node.invoke` 執行（例如 `system.run`、`system.notify`、`canvas.*`）。

### Node 服務 + app IPC

- 無頭 Node 主機服務會連線到 Gateway WebSocket。
- `system.run` 請求會透過本機 Unix socket 轉送到 macOS app。
- app 會在 UI 情境中執行命令，必要時提示使用者，並回傳輸出。

圖（SCI）：

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自動化）

- UI 自動化使用名為 `bridge.sock` 的獨立 UNIX socket，以及 PeekabooBridge JSON 協定。
- 主機偏好順序（用戶端）：Peekaboo.app → Claude.app → OpenClaw.app → 本機執行。
- 安全性：橋接主機需要允許的 TeamID；僅限 DEBUG 的同 UID 逃生口由 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 防護（Peekaboo 慣例）。
- 詳情請參閱：[PeekabooBridge 使用方式](/zh-TW/platforms/mac/peekaboo)。

## 作業流程

- 重新啟動/重建：`SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 終止既有執行個體
  - Swift 建置 + 封裝
  - 寫入/啟動載入/kickstart LaunchAgent
- 單一執行個體：如果已有相同 bundle ID 的另一個執行個體正在執行，app 會提前結束。

## 強化注意事項

- 建議所有特權介面都要求 TeamID 相符。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（僅限 DEBUG）可能允許同 UID 呼叫者進行本機開發。
- 所有通訊都維持僅限本機；不會暴露任何網路 socket。
- TCC 提示只會來自 GUI app bundle；在重建之間保持已簽署 bundle ID 穩定。
- IPC 強化：socket 模式 `0600`、token、對等 UID 檢查、HMAC 挑戰/回應、短 TTL。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [macOS IPC 流程（執行核准）](/zh-TW/tools/exec-approvals-advanced#macos-ipc-flow)

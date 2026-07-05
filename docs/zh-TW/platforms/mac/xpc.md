---
read_when:
    - 編輯 IPC 合約或選單列應用程式 IPC
summary: OpenClaw 應用程式、閘道節點傳輸與 PeekabooBridge 的 macOS IPC 架構
title: macOS 行程間通訊
x-i18n:
    generated_at: "2026-07-05T11:33:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0216deb436632a8bc83ccd9b750b6be4e53e317fbd72af035bc152c6a8be504a
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC 架構

本機 Unix socket 會將節點主機服務連接到 macOS app，用於 exec 核准與 `system.run`。有一個 `openclaw-mac` 偵錯命令列介面（`apps/macos/Sources/OpenClawMacCLI`）可用於探索/連線檢查；代理動作仍會透過閘道 WebSocket 和 `node.invoke` 流動。UI 自動化使用 PeekabooBridge。

## 目標

- 單一 GUI app 執行個體，負責所有面向 TCC 的工作（通知、螢幕錄製、麥克風、語音、AppleScript）。
- 小型自動化介面：閘道 + 節點命令，另加 PeekabooBridge 用於 UI 自動化。
- 可預測的權限：一律使用相同的已簽署 bundle ID，並由 launchd 啟動，因此 TCC 授權會保留。

## 運作方式

### 閘道 + 節點傳輸

- app 會執行閘道（本機模式），並以節點身分連接到它。
- 代理動作會透過 `node.invoke` 執行（例如 `system.run`、`system.notify`、`canvas.*`）。
- 節點命令包含 `canvas.*`、`camera.snap`、`camera.clip`、`screen.snapshot`、`screen.record`、`system.run` 和 `system.notify`。
- 節點會回報 `permissions` 對應表，讓代理可以查看螢幕、相機、麥克風、語音、自動化或輔助使用權限是否可用。

### 節點服務 + app IPC

- 無頭節點主機服務會連接到閘道 WebSocket。
- `system.run` 請求會透過本機 Unix socket（`ExecApprovalsSocket.swift`）轉送到 macOS app。
- app 會在 UI 情境中執行 exec，視需要提示，並傳回輸出。

圖（SCI）：

```text
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge（UI 自動化）

- UI 自動化使用獨立的 UNIX socket（`~/Library/Application Support/OpenClaw/<socket>`）和 PeekabooBridge JSON 協定。
- 主機偏好順序（用戶端）：Peekaboo.app -> Claude.app -> OpenClaw.app -> 本機執行。
- 安全性：bridge 主機需要在允許清單中的 TeamID（隨附的 `PeekabooBridgeHostCoordinator` 會允許固定團隊加上 app 自身的簽署團隊）；僅限 DEBUG 的同 UID 逃生口由 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 保護（Peekaboo 慣例）。
- 詳情請參閱：[PeekabooBridge 使用方式](/zh-TW/platforms/mac/peekaboo)。

## 操作流程

- 重新啟動/重建：`scripts/restart-mac.sh` 會終止現有執行個體、透過 Swift 重建、重新打包並重新啟動。它會自動偵測可用的簽署身分，若找不到則退回到 `--no-sign`；傳入 `--sign` 可要求簽署（若沒有可用金鑰則失敗），或傳入 `--no-sign` 強制使用未簽署路徑。環境中設定的 `SIGN_IDENTITY` 會在簽署路徑上取消設定，因此 `scripts/codesign-mac-app.sh` 自身的身分自動偵測會選取憑證。
- 單一執行個體：app 會檢查 `NSWorkspace.runningApplications` 是否有重複的 bundle ID，若找到多個執行個體便結束（`MenuBar.swift` 中的 `isDuplicateInstance()`）。

## 強化注意事項

- 偏好對所有特權介面要求 TeamID 相符。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（僅限 DEBUG）可允許同 UID 呼叫者進行本機開發。
- 所有通訊都保持僅限本機；不會暴露任何網路 socket。
- TCC 提示只會源自 GUI app bundle；請在重建之間保持已簽署 bundle ID 穩定。
- Exec 核准 socket 強化：檔案模式 `0600`、共享權杖、對端 UID 檢查（`getpeereid`）、HMAC-SHA256 挑戰/回應，以及請求的短 TTL。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [macOS IPC 流程（Exec 核准）](/zh-TW/tools/exec-approvals-advanced#macos-ipc-flow)

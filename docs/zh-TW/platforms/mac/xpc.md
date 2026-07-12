---
read_when:
    - 編輯 IPC 合約或選單列應用程式 IPC
summary: OpenClaw 應用程式、閘道節點傳輸與 PeekabooBridge 的 macOS IPC 架構
title: macOS 行程間通訊
x-i18n:
    generated_at: "2026-07-12T14:38:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC 架構

本機 Unix 通訊端會連接節點主機服務與 macOS 應用程式，用於執行核准與 `system.run`。另有一個 `openclaw-mac` 偵錯命令列介面（`apps/macos/Sources/OpenClawMacCLI`），可用於探索／連線檢查；代理程式動作仍會透過閘道 WebSocket 與 `node.invoke` 傳遞。由節點支援的 `computer.act` 路徑會在程序內執行內嵌的 Peekaboo 自動化；獨立的 Peekaboo 用戶端則使用 PeekabooBridge。

## 目標

- 由單一 GUI 應用程式執行個體負責所有涉及 TCC 的工作（通知、螢幕錄製、麥克風、語音、AppleScript）。
- 提供精簡的自動化介面：閘道 + 節點命令、程序內的 `computer.act`，以及供獨立 UI 自動化用戶端使用的 PeekabooBridge。
- 可預期的權限行為：始終使用相同的已簽署套件組合 ID，並由 launchd 啟動，讓 TCC 授權得以保留。

## 運作方式

### 閘道 + 節點傳輸

- 應用程式會執行閘道（本機模式），並以節點身分連線至閘道。
- 代理程式動作會透過 `node.invoke` 執行（例如 `system.run`、`system.notify`、`canvas.*`）。
- 節點命令包括 `canvas.*`、`camera.snap`、`camera.clip`、`screen.snapshot`、`screen.record`、`computer.act`、`system.run` 及 `system.notify`。
- 節點會回報 `permissions` 對應表，讓代理程式能查看螢幕、相機、麥克風、語音、自動化或輔助使用權限是否可用。

### 節點服務 + 應用程式 IPC

- 無頭節點主機服務會連線至閘道 WebSocket。
- `system.run` 要求會透過本機 Unix 通訊端（`ExecApprovalsSocket.swift`）轉送至 macOS 應用程式。
- 應用程式會在 UI 環境中執行命令，必要時提示使用者，並傳回輸出。

圖表（SCI）：

```text
代理程式 -> 閘道 -> 節點服務 (WS)
                      |  IPC (UDS + 權杖 + HMAC + TTL)
                      v
                  Mac 應用程式 (UI + TCC + system.run)
```

### PeekabooBridge（UI 自動化）

- 內建的代理程式 `computer` 工具**不會**使用此通訊端。已配對的 macOS 節點會在應用程式程序內，使用內嵌的 Peekaboo 服務執行 `computer.act`。
- UI 自動化會使用另一個 UNIX 通訊端（`~/Library/Application Support/OpenClaw/<socket>`）及 PeekabooBridge JSON 通訊協定。
- 主機偏好順序（用戶端）：Peekaboo.app -> Claude.app -> OpenClaw.app -> 本機執行。
- 安全性：橋接主機要求 TeamID 位於允許清單中（隨附的 `PeekabooBridgeHostCoordinator` 會允許一個固定團隊及應用程式本身的簽署團隊）；僅限 DEBUG、允許相同 UID 的緊急替代機制由 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 保護（Peekaboo 慣例）。
- 詳情請參閱：[PeekabooBridge 用法](/zh-TW/platforms/mac/peekaboo)。

## 操作流程

- 重新啟動／重新建置：`scripts/restart-mac.sh` 會終止現有執行個體、透過 Swift 重新建置、重新封裝，然後再次啟動。它會自動偵測可用的簽署身分；若找不到，則退回使用 `--no-sign`。傳入 `--sign` 可要求必須簽署（若沒有可用金鑰則失敗），或傳入 `--no-sign` 強制使用未簽署路徑。在已簽署路徑中，環境內設定的 `SIGN_IDENTITY` 會被取消設定，以便由 `scripts/codesign-mac-app.sh` 自行偵測身分並選取憑證。
- 單一執行個體：應用程式會檢查 `NSWorkspace.runningApplications` 中是否有重複的套件組合 ID；若找到超過一個執行個體，便會結束（`MenuBar.swift` 中的 `isDuplicateInstance()`）。

## 強化注意事項

- 建議所有特殊權限介面都要求 TeamID 相符。
- PeekabooBridge：`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`（僅限 DEBUG）可允許相同 UID 的呼叫端進行本機開發。
- 所有通訊都僅限本機；不會公開任何網路通訊端。
- TCC 提示僅由 GUI 應用程式套件組合發出；請在重新建置時保持已簽署的套件組合 ID 穩定。
- 執行核准通訊端強化措施：檔案模式 `0600`、共用權杖、對等 UID 檢查（`getpeereid`）、HMAC-SHA256 挑戰／回應，以及要求的短 TTL。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [macOS IPC 流程（執行核准）](/zh-TW/tools/exec-approvals-advanced#macos-ipc-flow)

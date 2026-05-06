---
read_when:
    - 在 OpenClaw.app 中託管 PeekabooBridge
    - 透過 Swift Package Manager 整合 Peekaboo
    - 變更 PeekabooBridge 協定/路徑
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之間做選擇
summary: 用於 macOS 使用者介面自動化的 PeekabooBridge 整合
title: 躲貓貓橋接
x-i18n:
    generated_at: "2026-05-06T09:14:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可以將 **PeekabooBridge** 作為本機、具權限感知能力的 UI 自動化
代理主機。這讓 `peekaboo` CLI 能驅動 UI 自動化，同時重用
macOS app 的 TCC 權限。

## 這是什麼（以及不是什麼）

- **主機**：OpenClaw.app 可以作為 PeekabooBridge 主機。
- **用戶端**：使用 `peekaboo` CLI（沒有獨立的 `openclaw ui ...` 介面）。
- **UI**：視覺覆蓋層保留在 Peekaboo.app 中；OpenClaw 是輕量的代理主機。

## 與 Computer Use 的關係

OpenClaw 有三條桌面控制路徑，而且它們刻意保持分離：

- **PeekabooBridge 主機**：OpenClaw.app 可以託管本機 PeekabooBridge socket。
  `peekaboo` CLI 仍是用戶端，並使用 OpenClaw.app 的 macOS
  權限來執行 Peekaboo 自動化原語，例如螢幕截圖、點擊、
  選單、對話框、Dock 動作與視窗管理。
- **Codex Computer Use**：內建的 `codex` Plugin 會準備 Codex app-server，
  驗證 Codex 的 `computer-use` MCP 伺服器可用，然後讓
  Codex 在 Codex 模式回合中擁有原生桌面控制工具呼叫。OpenClaw
  不會透過 PeekabooBridge 代理這些動作。
- **直接 `cua-driver` MCP**：OpenClaw 可以將 TryCua 的上游
  `cua-driver mcp` 伺服器註冊為一般 MCP 伺服器。這會讓代理程式取得 CUA
  驅動程式自己的結構描述與 pid/window/element-index 工作流程，而不需透過
  Codex marketplace 或 PeekabooBridge socket 路由。

當你想要廣泛的 macOS 自動化介面，以及 OpenClaw.app 的
具權限感知能力橋接主機時，請使用 Peekaboo。當 Codex 模式代理程式
應依賴 Codex 的原生 computer-use Plugin 時，請使用 Codex Computer Use。
當你想將 CUA 驅動程式作為一般 MCP 伺服器暴露給任何 OpenClaw 管理的執行階段時，
請使用直接的 `cua-driver mcp`。

## 啟用橋接

在 macOS app 中：

- 設定 → **啟用 Peekaboo Bridge**

啟用後，OpenClaw 會啟動本機 UNIX socket 伺服器。若停用，主機
會停止，且 `peekaboo` 會退回使用其他可用主機。

## 用戶端探索順序

Peekaboo 用戶端通常會依此順序嘗試主機：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安裝）
3. OpenClaw.app（輕量代理）

使用 `peekaboo bridge status --verbose` 查看目前哪個主機處於作用中，以及正在使用哪個
socket 路徑。你可以透過以下方式覆寫：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全性與權限

- 橋接會驗證**呼叫方程式碼簽章**；會強制執行 TeamID 允許清單
  （Peekaboo 主機 TeamID + OpenClaw app TeamID）。
- 請求會在約 10 秒後逾時。
- 如果缺少必要權限，橋接會傳回清楚的錯誤訊息，
  而不是啟動系統設定。

## 快照行為（自動化）

快照會儲存在記憶體中，並在短時間窗口後自動過期。
如果需要較長的保留時間，請從用戶端重新擷取。

## 疑難排解

- 如果 `peekaboo` 回報「bridge client is not authorized」，請確認用戶端已
  正確簽署，或僅在 **debug** 模式下以 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  執行主機。
- 如果找不到任何主機，請開啟其中一個主機 app（Peekaboo.app 或 OpenClaw.app），
  並確認已授予權限。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)

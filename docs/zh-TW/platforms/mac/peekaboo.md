---
read_when:
    - 在 OpenClaw.app 中託管 PeekabooBridge
    - 透過 Swift Package Manager 整合 Peekaboo
    - 變更 PeekabooBridge 協定/路徑
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之間做選擇
summary: PeekabooBridge macOS UI 自動化整合
title: 躲貓貓橋接器
x-i18n:
    generated_at: "2026-07-05T11:29:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54749a292f92d6b9fe88a0efb1f263b3a5576a600588324d7da53a4cd24f12cd
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可以將 **PeekabooBridge** 作為本機、具權限感知的 UI 自動化代理主機（`PeekabooBridgeHostCoordinator`，由 `steipete/Peekaboo` Swift 套件支援）。這讓 `peekaboo` 命令列介面能驅動 UI 自動化，同時重用 macOS app 的 TCC 權限。

## 這是什麼（以及不是什麼）

- **主機**：OpenClaw.app 可以作為 PeekabooBridge 主機。
- **用戶端**：`peekaboo` 命令列介面（沒有獨立的 `openclaw ui ...` 介面）。
- **UI**：視覺覆蓋層保留在 Peekaboo.app；OpenClaw 是輕量代理主機。

## 與其他桌面控制路徑的關係

OpenClaw 有三條刻意保持分離的桌面控制路徑：

- **PeekabooBridge 主機**：OpenClaw.app 會託管本機 PeekabooBridge socket。`peekaboo` 命令列介面是用戶端，並使用 OpenClaw.app 的 macOS 權限來進行截圖、點擊、選單、對話框、Dock 動作與視窗管理。
- **Codex Computer Use**：內建的 `codex` 外掛會檢查並可安裝 Codex 的 `computer-use` MCP 外掛（`extensions/codex/src/app-server/computer-use.ts`），接著在 Codex 模式回合期間讓 Codex 擁有原生桌面控制工具呼叫。OpenClaw 不會透過 PeekabooBridge 代理這些動作。
- **直接 `cua-driver` MCP**：OpenClaw 可以將 TryCua 上游的 `cua-driver mcp` 伺服器註冊為一般 MCP 伺服器，讓代理取得 CUA 驅動程式本身的 schema 與 pid/window/element-index 工作流程，而不需透過 Codex marketplace 或 PeekabooBridge socket 路由。

若要透過 OpenClaw.app 具權限感知的橋接主機使用廣泛的 macOS 自動化介面，請使用 Peekaboo。當 Codex 模式代理應依賴 Codex 的原生外掛時，請使用 Codex Computer Use。若要將 CUA 驅動程式作為一般 MCP 伺服器暴露給任何由 OpenClaw 管理的執行階段，請使用直接的 `cua-driver mcp`。

## 啟用橋接

在 macOS app 中：**設定 -> 啟用 Peekaboo Bridge**。

啟用後，OpenClaw 會在 `~/Library/Application Support/OpenClaw/<socket-name>` 啟動本機 UNIX socket 伺服器。若停用，主機會停止，且 `peekaboo` 會回退到其他可用主機。協調器也會維護舊版 socket 符號連結（Application Support 底下的 `clawdbot`、`clawdis`、`moltbot`），指向目前 socket，以供較舊的 `peekaboo` 安裝使用。

## 用戶端探索順序

Peekaboo 用戶端通常會依此順序嘗試主機：

1. Peekaboo.app（完整 UX）
2. Claude.app（若已安裝）
3. OpenClaw.app（輕量代理）

使用 `peekaboo bridge status --verbose` 查看目前啟用的主機與使用中的 socket 路徑。使用以下方式覆寫：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全性與權限

- 橋接會驗證**呼叫者程式碼簽章**；會強制執行 TeamID 允許清單（Peekaboo 主機 TeamID 加上執行中 app 自己的 TeamID）。
- 對於「輔助使用」，請優先使用已簽署的橋接/app 身分，而不是通用的 `node` 執行階段。將輔助使用權限授予 `node` 會讓該 Node 可執行檔啟動的任何套件繼承 GUI 自動化存取權限；請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)。
- 請求會在 10 秒後逾時（`requestTimeoutSec: 10`）。
- 如果缺少必要權限，橋接會回傳清楚的錯誤訊息，而不是啟動「系統設定」。

## 快照行為（自動化）

快照會儲存在記憶體中，有 10 分鐘的有效期限，並限制最多 50 個快照（`InMemorySnapshotManager`）；清理時不會刪除成品。若需要更長保留時間，請從用戶端重新擷取。

## 疑難排解

- 如果 `peekaboo` 回報「bridge client is not authorized」，請確認用戶端已正確簽署，或僅在**偵錯**模式中以 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 執行主機。
- 如果找不到主機，請開啟其中一個主機 app（Peekaboo.app 或 OpenClaw.app），並確認已授予權限。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)

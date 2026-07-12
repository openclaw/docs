---
read_when:
    - 在 OpenClaw.app 中託管 PeekabooBridge
    - 透過 Swift Package Manager 整合 Peekaboo
    - 變更 PeekabooBridge 通訊協定／路徑
    - 在 PeekabooBridge、Codex Computer Use 與 cua-driver MCP 之間做選擇
summary: 用於 macOS UI 自動化的 PeekabooBridge 整合功能
title: Peekaboo 橋接器
x-i18n:
    generated_at: "2026-07-12T14:39:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可將 **PeekabooBridge** 作為具權限感知能力的本機 UI 自動化代理程式（`PeekabooBridgeHostCoordinator`，由 `steipete/Peekaboo` Swift 套件提供支援）。這讓 `peekaboo` 命令列介面能在重複使用 macOS App 的 TCC 權限下執行 UI 自動化。

## 這是什麼（以及不是什麼）

- **主機**：OpenClaw.app 可作為 PeekabooBridge 主機。
- **用戶端**：`peekaboo` 命令列介面（沒有獨立的 `openclaw ui ...` 介面）。
- **UI**：視覺覆蓋層保留在 Peekaboo.app 中；OpenClaw 僅是輕量代理主機。

## 與其他桌面控制路徑的關係

OpenClaw 有四條刻意保持分離的桌面控制路徑：

- **PeekabooBridge 主機**：OpenClaw.app 託管本機 PeekabooBridge 通訊端。`peekaboo` 命令列介面是用戶端，並使用 OpenClaw.app 的 macOS 權限來執行螢幕截圖、點擊、選單、對話框、Dock 操作和視窗管理。
- **代理程式驅動的電腦操作（`computer.act`）**：閘道代理程式內建的 `computer` 工具透過 `screen.snapshot` 擷取螢幕截圖，並透過具危險性的 `computer.act` 節點命令控制指標與鍵盤。macOS 節點會在處理程序內使用此橋接器所公開的內嵌 Peekaboo 自動化服務，加上有限的 CoreGraphics 基本功能來執行 `computer.act`，不會經由 PeekabooBridge 通訊端或 `peekaboo` 命令列介面。請參閱[電腦操作](/zh-TW/nodes/computer-use)。
- **Codex 電腦操作**：隨附的 `codex` 外掛會檢查並可安裝 Codex 的 `computer-use` MCP 外掛（`extensions/codex/src/app-server/computer-use.ts`），接著在 Codex 模式的回合中，讓 Codex 負責原生桌面控制工具呼叫。OpenClaw 不會透過 PeekabooBridge 代理這些操作。
- **直接使用 `cua-driver` MCP**：OpenClaw 可將 TryCua 上游的 `cua-driver mcp` 伺服器註冊為一般 MCP 伺服器，讓代理程式使用 CUA 驅動程式自己的結構描述，以及 pid／視窗／元素索引工作流程，而不經由 Codex 市集或 PeekabooBridge 通訊端路由。

若要透過 OpenClaw.app 具權限感知能力的橋接主機使用廣泛的 macOS 自動化介面，請使用 Peekaboo。當閘道代理程式應透過任何視覺模型都能驅動的統一 `computer.act` 節點命令查看並控制桌面時，請使用代理程式驅動的電腦操作。當 Codex 模式代理程式應依賴 Codex 的原生外掛時，請使用 Codex 電腦操作。若要將 CUA 驅動程式以一般 MCP 伺服器形式公開給任何由 OpenClaw 管理的執行環境，請直接使用 `cua-driver mcp`。

## 啟用橋接器

在 macOS App 中：**Settings -> Enable Peekaboo Bridge**。

啟用後，OpenClaw 會在 `~/Library/Application Support/OpenClaw/<socket-name>` 啟動本機 UNIX 通訊端伺服器。若停用，主機會停止，且 `peekaboo` 會改用其他可用的主機。協調器也會維護指向目前通訊端的舊版通訊端符號連結（位於 Application Support 下的 `clawdbot`、`clawdis`、`moltbot`），供較舊的 `peekaboo` 安裝版本使用。

## 用戶端探索順序

Peekaboo 用戶端通常會依照以下順序嘗試主機：

1. Peekaboo.app（完整使用者體驗）
2. Claude.app（若已安裝）
3. OpenClaw.app（輕量代理程式）

使用 `peekaboo bridge status --verbose` 查看目前使用中的主機和通訊端路徑。可透過以下方式覆寫：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全性與權限

- 橋接器會驗證**呼叫端程式碼簽章**；系統會強制執行 TeamID 允許清單（Peekaboo 主機 TeamID 加上執行中 App 自身的 TeamID）。
- 對於「輔助使用」權限，應優先使用已簽署的橋接器／App 身分，而非通用的 `node` 執行環境。將「輔助使用」權限授予 `node`，會讓任何由該 Node 執行檔啟動的套件繼承 GUI 自動化存取權；請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)。
- 請求會在 10 秒後逾時（`requestTimeoutSec: 10`）。
- 若缺少必要權限，橋接器會傳回清楚的錯誤訊息，而不會啟動「系統設定」。

## 快照行為（自動化）

快照儲存在記憶體中，有效期限為 10 分鐘，上限為 50 個快照（`InMemorySnapshotManager`）；清理時不會刪除成品。如需保留更長時間，請從用戶端重新擷取。

## 疑難排解

- 若 `peekaboo` 回報「bridge client is not authorized」，請確認用戶端已正確簽署，或僅在**偵錯**模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 執行主機。
- 若找不到任何主機，請開啟其中一個主機 App（Peekaboo.app 或 OpenClaw.app），並確認已授予權限。

## 相關內容

- [macOS App](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)

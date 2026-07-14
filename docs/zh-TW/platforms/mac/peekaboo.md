---
read_when:
    - 在 OpenClaw.app 中託管 PeekabooBridge
    - 透過 Swift Package Manager 整合 Peekaboo
    - 變更 PeekabooBridge 通訊協定／路徑
    - 在 PeekabooBridge、Codex Computer Use 與 cua-driver MCP 之間做選擇
summary: 用於 macOS UI 自動化的 PeekabooBridge 整合
title: Peekaboo 橋接器
x-i18n:
    generated_at: "2026-07-14T13:54:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可以將 **PeekabooBridge** 作為本機、具權限感知能力的 UI 自動化代理程式（`PeekabooBridgeHostCoordinator`，由 `steipete/Peekaboo` Swift 套件支援）。如此一來，`peekaboo` 命令列介面便可驅動 UI 自動化，同時重複使用 macOS App 的 TCC 權限。

## 這是什麼（以及不是什麼）

- **主機**：OpenClaw.app 可作為 PeekabooBridge 主機。
- **用戶端**：`peekaboo` 命令列介面（沒有獨立的 `openclaw ui ...` 介面）。
- **UI**：視覺覆疊會留在 Peekaboo.app 中；OpenClaw 僅是精簡的代理主機。

## 與其他桌面控制路徑的關係

OpenClaw 有四條刻意保持分離的桌面控制路徑：

- **PeekabooBridge 主機**：OpenClaw.app 託管本機 PeekabooBridge 通訊端。`peekaboo` 命令列介面是用戶端，並使用 OpenClaw.app 的 macOS 權限執行螢幕截圖、點按、選單、對話框、Dock 操作及視窗管理。
- **代理程式驅動的電腦操作（`computer.act`）**：閘道代理程式的內建 `computer` 工具透過 `screen.snapshot` 擷取螢幕截圖，並透過危險的 `computer.act` 節點命令控制指標和鍵盤。macOS 節點會在處理程序內完成 `computer.act`，使用此橋接器公開的內嵌 Peekaboo 自動化服務以及有限的 CoreGraphics 基礎功能，而不經過 PeekabooBridge 通訊端或 `peekaboo` 命令列介面。請參閱[電腦操作](/zh-TW/nodes/computer-use)。
- **Codex 電腦操作**：內建的 `codex` 外掛會檢查 Codex 的 `computer-use` MCP 外掛（`extensions/codex/src/app-server/computer-use.ts`），並可加以安裝，接著讓 Codex 在 Codex 模式的互動回合中自行處理原生桌面控制工具呼叫。OpenClaw 不會透過 PeekabooBridge 代理這些操作。
- **直接使用 `cua-driver` MCP**：OpenClaw 可將 TryCua 的上游 `cua-driver mcp` 伺服器註冊為一般 MCP 伺服器，讓代理程式使用 CUA 驅動程式本身的結構描述及 pid／視窗／元素索引工作流程，而不透過 Codex 市集或 PeekabooBridge 通訊端進行路由。

若要透過 OpenClaw.app 的權限感知橋接主機使用廣泛的 macOS 自動化功能，請使用 Peekaboo。若應由閘道代理程式透過任何視覺模型都能驅動的統一 `computer.act` 節點命令查看及控制桌面，請使用代理程式驅動的電腦操作。若 Codex 模式的代理程式應依賴 Codex 的原生外掛，請使用 Codex 電腦操作。若要將 CUA 驅動程式作為一般 MCP 伺服器公開給任何由 OpenClaw 管理的執行階段，請直接使用 `cua-driver mcp`。

## 啟用橋接器

在 macOS App 中：**Settings -> Enable Peekaboo Bridge**。此切換開關要求必須開啟 **Allow Computer Control**，因為兩者都會授予本機 UI 自動化能力；若關閉 Computer Control，切換開關會停用，且主機不會執行。若要在不啟用 Computer Control 的情況下驅動 Peekaboo，請改為執行 Peekaboo 自己的 Mac App 作為主機。

啟用後（且 Computer Control 已開啟），OpenClaw 會在 `~/Library/Application Support/OpenClaw/<socket-name>` 啟動本機 UNIX 通訊端伺服器。停用後，主機會停止，`peekaboo` 則會改用其他可用的主機。協調器也會維護舊版通訊端符號連結（Application Support 下的 `clawdbot`、`clawdis`、`moltbot`），使其指向目前的通訊端，以供較舊的 `peekaboo` 安裝版本使用。

## 用戶端探索順序

Peekaboo 用戶端通常會依下列順序嘗試主機：

1. Peekaboo.app（完整使用者體驗）
2. Claude.app（若已安裝）
3. OpenClaw.app（精簡代理程式）

使用 `peekaboo bridge status --verbose` 查看目前使用中的主機及使用中的通訊端路徑。可使用下列設定覆寫：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全性與權限

- 橋接器會驗證**呼叫端程式碼簽章**；並強制執行 TeamID 允許清單（Peekaboo 主機 TeamID 加上執行中 App 本身的 TeamID）。
- 對於輔助使用權限，應優先使用已簽署的橋接器／App 身分，而非通用的 `node` 執行階段。將輔助使用權限授予 `node`，會使該 Node 可執行檔啟動的任何套件繼承 GUI 自動化存取權；請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)。
- 要求會在 10 秒後逾時（`requestTimeoutSec: 10`）。
- 若缺少必要權限，橋接器會傳回清楚的錯誤訊息，而不是啟動 System Settings。

## 快照行為（自動化）

快照儲存在記憶體中，有效期為 10 分鐘，上限為 50 個快照（`InMemorySnapshotManager`）；清理時不會刪除成品。若需要保留更長時間，請從用戶端重新擷取。

## 疑難排解

- 若 `peekaboo` 回報 "bridge client is not authorized"，請確認用戶端已正確簽署，或僅在 **debug** 模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 執行主機。
- 若找不到任何主機，請開啟其中一個主機 App（Peekaboo.app 或 OpenClaw.app），並確認已授予權限。

## 相關內容

- [macOS App](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)

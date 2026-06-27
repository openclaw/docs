---
read_when:
    - 在 OpenClaw.app 中託管 PeekabooBridge
    - 透過 Swift Package Manager 整合 Peekaboo
    - 變更 PeekabooBridge 協定/路徑
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之間做選擇
summary: PeekabooBridge macOS 使用者介面自動化整合
title: 躲貓貓橋接器
x-i18n:
    generated_at: "2026-06-27T19:32:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可將 **PeekabooBridge** 作為本機、具權限感知能力的 UI 自動化代理程式來託管。這讓 `peekaboo` 命令列介面能在重複使用 macOS 應用程式 TCC 權限的同時驅動 UI 自動化。

## 這是什麼（以及不是什麼）

- **主機**：OpenClaw.app 可以作為 PeekabooBridge 主機。
- **用戶端**：使用 `peekaboo` 命令列介面（沒有獨立的 `openclaw ui ...` 介面）。
- **UI**：視覺覆蓋層仍留在 Peekaboo.app；OpenClaw 是精簡的代理主機。

## 與 Computer Use 的關係

OpenClaw 有三條桌面控制路徑，且它們刻意保持分離：

- **PeekabooBridge 主機**：OpenClaw.app 可以託管本機 PeekabooBridge socket。`peekaboo` 命令列介面仍是用戶端，並使用 OpenClaw.app 的 macOS 權限來執行 Peekaboo 自動化基元，例如螢幕截圖、點按、選單、對話框、Dock 動作與視窗管理。
- **Codex Computer Use**：內建的 `codex` 外掛會準備 Codex app-server，驗證 Codex 的 `computer-use` MCP 伺服器可用，然後讓 Codex 在 Codex 模式回合期間擁有原生桌面控制工具呼叫。OpenClaw 不會透過 PeekabooBridge 代理這些動作。
- **直接 `cua-driver` MCP**：OpenClaw 可以將 TryCua 的上游 `cua-driver mcp` 伺服器註冊為一般 MCP 伺服器。這會向代理提供 CUA driver 自身的結構描述，以及 pid/window/element-index 工作流程，而不會透過 Codex marketplace 或 PeekabooBridge socket 路由。

當你需要廣泛的 macOS 自動化介面，以及 OpenClaw.app 具權限感知能力的橋接主機時，請使用 Peekaboo。當 Codex 模式代理應依賴 Codex 的原生 computer-use 外掛時，請使用 Codex Computer Use。當你想將 CUA driver 作為一般 MCP 伺服器暴露給任何由 OpenClaw 管理的執行環境時，請直接使用 `cua-driver mcp`。

## 啟用橋接

在 macOS 應用程式中：

- Settings → **啟用 Peekaboo Bridge**

啟用後，OpenClaw 會啟動本機 UNIX socket 伺服器。如果停用，主機會停止，且 `peekaboo` 會退回使用其他可用主機。

## 用戶端探索順序

Peekaboo 用戶端通常會依此順序嘗試主機：

1. Peekaboo.app（完整使用者體驗）
2. Claude.app（若已安裝）
3. OpenClaw.app（精簡代理）

使用 `peekaboo bridge status --verbose` 查看目前作用中的主機，以及正在使用的 socket 路徑。你可以用以下方式覆寫：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全性與權限

- 橋接會驗證**呼叫者程式碼簽章**；會強制執行 TeamID 允許清單（Peekaboo 主機 TeamID + OpenClaw app TeamID）。
- 對 Accessibility 而言，請優先使用已簽署的橋接/應用程式身分，而不是通用的 `node` 執行環境。授予 Accessibility 給 `node` 會讓任何由該 節點 可執行檔啟動的套件繼承 GUI 自動化存取權；請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)。
- 請求會在約 10 秒後逾時。
- 如果缺少必要權限，橋接會傳回清楚的錯誤訊息，而不是啟動 System Settings。

## 快照行為（自動化）

快照會儲存在記憶體中，並在短暫時間後自動過期。如果需要更長保留時間，請從用戶端重新擷取。

## 疑難排解

- 如果 `peekaboo` 回報「bridge client is not authorized」，請確保用戶端已正確簽署，或僅在**偵錯**模式下使用 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 執行主機。
- 如果找不到主機，請開啟其中一個主機應用程式（Peekaboo.app 或 OpenClaw.app），並確認權限已授予。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)

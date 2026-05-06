---
read_when:
    - 在 OpenClaw.app 中託管 PeekabooBridge
    - 透過 Swift Package Manager 整合 Peekaboo
    - 變更 PeekabooBridge 協定/路徑
    - 在 PeekabooBridge、Codex Computer Use 和 cua-driver MCP 之間做選擇
summary: 用於 macOS 使用者介面自動化的 PeekabooBridge 整合
title: Peekaboo 橋接器
x-i18n:
    generated_at: "2026-05-06T02:53:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2b0076c0fabdc5e732c6a1b6ce9b571e8b65c1a646866f85ec4138c914d5c7d
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw 可以將 **PeekabooBridge** 託管為本機、具權限感知能力的 UI 自動化
代理。這讓 `peekaboo` CLI 能驅動 UI 自動化，同時重用 macOS app 的 TCC 權限。

## 這是什麼（以及不是什麼）

- **主機**：OpenClaw.app 可以作為 PeekabooBridge 主機。
- **用戶端**：使用 `peekaboo` CLI（沒有獨立的 `openclaw ui ...` 介面）。
- **UI**：視覺覆蓋層仍在 Peekaboo.app 中；OpenClaw 是精簡的代理主機。

## 與 Computer Use 的關係

OpenClaw 有三條桌面控制路徑，且它們刻意保持分離：

- **PeekabooBridge 主機**：OpenClaw.app 可以託管本機 PeekabooBridge socket。
  `peekaboo` CLI 仍是用戶端，並使用 OpenClaw.app 的 macOS
  權限來執行 Peekaboo 自動化原語，例如螢幕截圖、點擊、
  選單、對話框、Dock 動作，以及視窗管理。
- **Codex Computer Use**：內建的 `codex` Plugin 會準備 Codex app-server，
  驗證 Codex 的 `computer-use` MCP server 可用，然後讓
  Codex 在 Codex 模式回合期間擁有原生桌面控制工具呼叫。OpenClaw
  不會透過 PeekabooBridge 代理這些動作。
- **直接 `cua-driver` MCP**：OpenClaw 可以將 TryCua 的上游
  `cua-driver mcp` server 註冊為一般 MCP server。這會讓代理取得 CUA
  driver 自己的 schema，以及 pid/window/element-index 工作流程，而不會透過
  Codex marketplace 或 PeekabooBridge socket 路由。

當你需要廣泛的 macOS 自動化介面，以及 OpenClaw.app 具權限感知能力的橋接主機時，請使用 Peekaboo。當 Codex 模式代理
應依賴 Codex 的原生 computer-use Plugin 時，請使用 Codex Computer Use。當你想將 CUA driver 以一般
MCP server 的形式暴露給任何由 OpenClaw 管理的 runtime 時，請使用直接 `cua-driver mcp`。

## 啟用橋接

在 macOS app 中：

- 設定 → **啟用 Peekaboo Bridge**

啟用後，OpenClaw 會啟動本機 UNIX socket server。若停用，主機
會停止，且 `peekaboo` 會回退到其他可用主機。

## 用戶端探索順序

Peekaboo 用戶端通常會依下列順序嘗試主機：

1. Peekaboo.app（完整 UX）
2. Claude.app（若已安裝）
3. OpenClaw.app（精簡代理）

使用 `peekaboo bridge status --verbose` 查看目前作用中的主機，以及正在使用的
socket 路徑。你可以用以下方式覆寫：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全性與權限

- 橋接會驗證**呼叫者程式碼簽章**；並強制執行 TeamID allowlist
  （Peekaboo 主機 TeamID + OpenClaw app TeamID）。
- 請求會在約 10 秒後逾時。
- 如果缺少必要權限，橋接會回傳清楚的錯誤訊息，
  而不是啟動系統設定。

## 快照行為（自動化）

快照會儲存在記憶體中，並在短時間窗口後自動過期。
如果需要保留更久，請從用戶端重新擷取。

## 疑難排解

- 如果 `peekaboo` 回報「bridge client is not authorized」，請確認用戶端
  已正確簽署，或僅在 **debug** 模式下以 `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  執行主機。
- 如果找不到主機，請開啟其中一個主機 app（Peekaboo.app 或 OpenClaw.app），
  並確認已授予權限。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)

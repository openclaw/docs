---
read_when:
    - 您想要一份適合初學者的 TUI 逐步教學
    - 你需要 TUI 功能、指令和快捷鍵的完整清單
summary: 終端使用者介面 (TUI)：連線到 Gateway，或以嵌入模式在本機執行
title: TUI
x-i18n:
    generated_at: "2026-05-02T21:07:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
    source_path: web/tui.md
    workflow: 16
---

## 快速開始

### Gateway 模式

1. 啟動 Gateway。

```bash
openclaw gateway
```

2. 開啟 TUI。

```bash
openclaw tui
```

3. 輸入訊息並按下 Enter。

遠端 Gateway：

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

如果你的 Gateway 使用密碼驗證，請使用 `--password`。

### 本機模式

不透過 Gateway 執行 TUI：

```bash
openclaw chat
# or
openclaw tui --local
```

注意事項：

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的別名。
- `--local` 不能與 `--url`、`--token` 或 `--password` 搭配使用。
- 本機模式會直接使用內嵌代理執行階段。大多數本機工具可正常運作，但僅限 Gateway 的功能無法使用。
- `openclaw` 和 `openclaw crestodian` 也使用這個 TUI shell，其中 Crestodian 是本機設定與修復聊天後端。

## 你會看到什麼

- 標頭：連線 URL、目前代理、目前工作階段。
- 聊天記錄：使用者訊息、助理回覆、系統通知、工具卡片。
- 狀態列：連線/執行狀態（連線中、執行中、串流中、閒置、錯誤）。
- 頁尾：連線狀態 + 代理 + 工作階段 + 模型 + 思考/快速/詳細/追蹤/推理 + 權杖計數 + 傳送。
- 輸入：具有自動完成的文字編輯器。

## 心智模型：代理 + 工作階段

- 代理是唯一的 slug（例如 `main`、`research`）。Gateway 會公開這份清單。
- 工作階段隸屬於目前代理。
- 工作階段鍵會儲存為 `agent:<agentId>:<sessionKey>`。
  - 如果你輸入 `/session main`，TUI 會將它展開為 `agent:<currentAgent>:main`。
  - 如果你輸入 `/session agent:other:main`，你會明確切換到該代理工作階段。
- 工作階段範圍：
  - `per-sender`（預設）：每個代理有多個工作階段。
  - `global`：TUI 一律使用 `global` 工作階段（選擇器可能是空的）。
- 目前代理 + 工作階段一律會顯示在頁尾。
- 未指定 `--session` 啟動時，如果同一 Gateway、代理和工作階段範圍的上次選取工作階段仍存在，Gateway 模式 TUI 會恢復該工作階段。傳入 `--session`、`/session`、`/new` 或 `/reset` 仍然是明確操作。

## 傳送 + 遞送

- 訊息會傳送到 Gateway；預設不會遞送給供應商。
- 開啟遞送：
  - `/deliver on`
  - 或使用設定面板
  - 或以 `openclaw tui --deliver` 啟動

## 選擇器 + 覆蓋層

- 模型選擇器：列出可用模型並設定工作階段覆寫。
- 代理選擇器：選擇不同的代理。
- 工作階段選擇器：只顯示目前代理的工作階段。
- 設定：切換遞送、工具輸出展開，以及思考可見性。

## 鍵盤快速鍵

- Enter：傳送訊息
- Esc：中止目前執行
- Ctrl+C：清除輸入（按兩次即可退出）
- Ctrl+D：退出
- Ctrl+L：模型選擇器
- Ctrl+G：代理選擇器
- Ctrl+P：工作階段選擇器
- Ctrl+O：切換工具輸出展開
- Ctrl+T：切換思考可見性（重新載入歷史記錄）

## 斜線命令

核心：

- `/help`
- `/status`
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

工作階段控制：

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（別名：`/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

工作階段生命週期：

- `/new` 或 `/reset`（重設工作階段）
- `/abort`（中止目前執行）
- `/settings`
- `/exit`

僅限本機模式：

- `/auth [provider]` 會在 TUI 內開啟供應商驗證/登入流程。

其他 Gateway 斜線命令（例如 `/context`）會轉送到 Gateway，並顯示為系統輸出。請參閱[斜線命令](/zh-TW/tools/slash-commands)。

## 本機 shell 命令

- 在一行前加上 `!`，即可在 TUI 主機上執行本機 shell 命令。
- TUI 會在每個工作階段提示一次，詢問是否允許本機執行；拒絕後，該工作階段會停用 `!`。
- 命令會在 TUI 工作目錄中的全新非互動式 shell 內執行（沒有持久的 `cd`/env）。
- 本機 shell 命令會在其環境中收到 `OPENCLAW_SHELL=tui-local`。
- 單獨的 `!` 會當成一般訊息傳送；開頭空格不會觸發本機執行。

## 從本機 TUI 修復設定

當目前設定已經通過驗證，而你希望內嵌代理在同一台機器上檢查設定、與文件比對，並在不依賴執行中 Gateway 的情況下協助修復偏移時，請使用本機模式。

如果 `openclaw config validate` 已經失敗，請先從 `openclaw configure` 或 `openclaw doctor --fix` 開始。`openclaw chat` 不會繞過無效設定保護。

典型流程：

1. 啟動本機模式：

```bash
openclaw chat
```

2. 詢問代理你想檢查的項目，例如：

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 使用本機 shell 命令取得精確證據與驗證：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. 使用 `openclaw config set` 或 `openclaw configure` 套用範圍狹窄的變更，然後重新執行 `!openclaw config validate`。
5. 如果 Doctor 建議自動遷移或修復，請先檢閱，再執行 `!openclaw doctor --fix`。

提示：

- 優先使用 `openclaw config set` 或 `openclaw configure`，而不是手動編輯 `openclaw.json`。
- `openclaw docs "<query>"` 會從同一台機器搜尋即時文件索引。
- 當你需要結構化 schema 與 SecretRef/可解析性錯誤時，`openclaw config validate --json` 很有用。

## 工具輸出

- 工具呼叫會以卡片顯示，包含引數 + 結果。
- Ctrl+O 會在收合/展開檢視之間切換。
- 工具執行時，部分更新會串流到同一張卡片中。

## 終端機顏色

- TUI 會讓助理本文使用你終端機的預設前景色，因此深色和淺色終端機都能保持可讀。
- 如果你的終端機使用淺色背景且自動偵測錯誤，請在啟動 `openclaw tui` 前設定 `OPENCLAW_THEME=light`。
- 若要改為強制使用原始深色調色盤，請設定 `OPENCLAW_THEME=dark`。

## 歷史記錄 + 串流

- 連線時，TUI 會載入最新歷史記錄（預設 200 則訊息）。
- 串流回應會就地更新，直到最終確定。
- TUI 也會監聽代理工具事件，以提供更豐富的工具卡片。

## 連線詳細資料

- TUI 會以 `mode: "tui"` 向 Gateway 註冊。
- 重新連線會顯示系統訊息；事件缺口會顯示在記錄中。

## 選項

- `--local`：針對本機內嵌代理執行階段執行
- `--url <url>`：Gateway WebSocket URL（預設為設定或 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 權杖（如有需要）
- `--password <password>`：Gateway 密碼（如有需要）
- `--session <key>`：工作階段鍵（預設：`main`；範圍為 global 時則為 `global`）
- `--deliver`：將助理回覆遞送給供應商（預設關閉）
- `--thinking <level>`：覆寫傳送時的思考等級
- `--message <text>`：連線後傳送初始訊息
- `--timeout-ms <ms>`：代理逾時毫秒數（預設為 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要載入的歷史記錄項目數（預設 `200`）

<Warning>
當你設定 `--url` 時，TUI 不會退回使用設定或環境認證。請明確傳入 `--token` 或 `--password`。缺少明確認證會導致錯誤。在本機模式中，請勿傳入 `--url`、`--token` 或 `--password`。
</Warning>

## 疑難排解

傳送訊息後沒有輸出：

- 在 TUI 中執行 `/status`，確認 Gateway 已連線且處於閒置/忙碌狀態。
- 檢查 Gateway 記錄：`openclaw logs --follow`。
- 確認代理可以執行：`openclaw status` 和 `openclaw models status`。
- 如果你預期訊息會出現在聊天頻道中，請啟用遞送（`/deliver on` 或 `--deliver`）。

## 連線疑難排解

- `disconnected`：確認 Gateway 正在執行，且你的 `--url/--token/--password` 正確。
- 選擇器中沒有代理：檢查 `openclaw agents list` 和你的路由設定。
- 工作階段選擇器為空：你可能位於 global 範圍，或尚未建立任何工作階段。

## 相關

- [控制 UI](/zh-TW/web/control-ui) — 網頁型控制介面
- [設定](/zh-TW/cli/config) — 檢查、驗證並編輯 `openclaw.json`
- [Doctor](/zh-TW/cli/doctor) — 引導式修復與遷移檢查
- [CLI 參考](/zh-TW/cli) — 完整 CLI 命令參考

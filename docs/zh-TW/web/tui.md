---
read_when:
    - 你想要一份適合初學者的終端介面逐步導覽
    - 你需要完整的終端介面功能、命令和捷徑清單
summary: 終端介面（TUI）：連線到閘道，或在嵌入模式中於本機執行
title: 終端介面
x-i18n:
    generated_at: "2026-06-27T20:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
    source_path: web/tui.md
    workflow: 16
---

## 快速開始

### 閘道模式

1. 啟動閘道。

```bash
openclaw gateway
```

2. 開啟終端介面。

```bash
openclaw tui
```

3. 輸入訊息並按 Enter。

遠端閘道：

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

如果你的閘道使用密碼驗證，請使用 `--password`。

### 本機模式

不透過閘道執行終端介面：

```bash
openclaw chat
# or
openclaw tui --local
```

注意事項：

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的別名。
- `--local` 不能與 `--url`、`--token` 或 `--password` 搭配使用。
- 本機模式會直接使用內嵌的代理執行階段。大多數本機工具都可運作，但僅限閘道的功能無法使用。
- 設定檔寫入設定後，`openclaw` 和 `openclaw crestodian` 也會使用這個終端介面 shell，並以 Crestodian 作為本機設定與修復聊天後端。

## 你會看到什麼

- 標頭：連線 URL、目前代理、目前工作階段。
- 聊天記錄：使用者訊息、助理回覆、系統通知、工具卡片。
- 狀態列：連線/執行狀態（連線中、執行中、串流中、閒置、錯誤）。
- 頁尾：代理 + 工作階段 + 模型 + 目標狀態 + 思考/快速/詳細/追蹤/推理 + token 數 + 傳送。啟用 `tui.footer.showRemoteHost` 時，遠端閘道連線也會顯示連線主機。
- 輸入：具備自動完成的文字編輯器。

## 心智模型：代理 + 工作階段

- 代理是唯一的 slug（例如 `main`、`research`）。閘道會公開清單。
- 工作階段屬於目前代理。
- 工作階段鍵會儲存為 `agent:<agentId>:<sessionKey>`。
  - 如果你輸入 `/session main`，終端介面會將它展開為 `agent:<currentAgent>:main`。
  - 如果你輸入 `/session agent:other:main`，你會明確切換到該代理工作階段。
- 工作階段範圍：
  - `per-sender`（預設）：每個代理都有多個工作階段。
  - `global`：終端介面一律使用 `global` 工作階段（選擇器可能是空的）。
- 目前代理 + 工作階段一律會顯示在頁尾。
- 若要針對非本機、URL 支援的連線顯示閘道主機，請選擇啟用：

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Loopback 和內嵌本機連線永遠不會顯示主機標籤。

- 如果工作階段有[目標](/zh-TW/tools/goal)，頁尾會顯示其精簡狀態，
  例如 `Pursuing goal`、`Goal paused (/goal resume)` 或
  `Goal achieved`。
- 在未使用 `--session` 啟動時，如果同一個閘道、代理與工作階段範圍的上次選取工作階段仍然存在，閘道模式終端介面會恢復該工作階段。傳入 `--session`、`/session`、`/new` 或 `/reset` 仍然是明確操作。

## 傳送 + 送達

- 訊息會傳送到閘道；預設不會送達供應商。
- 終端介面是類似 WebChat 的內部來源介面，不是通用的對外通道。需要 `tools.message` 來顯示回覆的 harness，可以用無目標的 `message.send` 滿足目前終端介面回合；明確的供應商送達仍會使用一般已設定的通道，且絕不會退回到 `lastChannel`。
- 開啟回合送達：
  - `/deliver on`
  - 或設定面板
  - 或以 `openclaw tui --deliver` 啟動

## 選擇器 + 覆蓋層

- 模型選擇器：列出可用模型並設定工作階段覆寫。
- 代理選擇器：選擇不同的代理。
- 工作階段選擇器：顯示目前代理在過去 7 天內更新的最多 50 個工作階段。使用 `/session <key>` 可跳到較舊的已知工作階段。
- 設定：切換送達、工具輸出展開，以及思考可見度。

## 鍵盤快捷鍵

- Enter：傳送訊息
- Esc：中止作用中的執行
- Ctrl+C：清除輸入（按兩次可退出）
- Ctrl+D：退出
- Ctrl+L：模型選擇器
- Ctrl+G：代理選擇器
- Ctrl+P：工作階段選擇器
- Ctrl+O：切換工具輸出展開
- Ctrl+T：切換思考可見度（重新載入歷史）

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
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` 會清除工作階段覆寫）
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（別名：`/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

工作階段生命週期：

- `/new` 或 `/reset`（重設工作階段）
- `/abort`（中止作用中的執行）
- `/settings`
- `/exit`

僅限本機模式：

- `/auth [provider]` 會在終端介面中開啟供應商驗證/登入流程。

其他閘道斜線命令（例如 `/context`）會轉送到閘道，並顯示為系統輸出。請參閱[斜線命令](/zh-TW/tools/slash-commands)。

## 本機 shell 命令

- 在一行前加上 `!`，即可在終端介面主機上執行本機 shell 命令。
- 終端介面每個工作階段會提示一次以允許本機執行；拒絕後會在該工作階段停用 `!`。
- 命令會在終端介面工作目錄中，以全新的非互動式 shell 執行（沒有持久的 `cd`/env）。
- 本機 shell 命令會在其環境中收到 `OPENCLAW_SHELL=tui-local`。
- 單獨的 `!` 會作為一般訊息傳送；前導空白不會觸發本機執行。

## 從本機終端介面修復設定

當目前設定已通過驗證，而你希望內嵌代理在同一台機器上檢查設定、與文件比對，並協助修復漂移且不依賴正在執行的閘道時，請使用本機模式。

如果 `openclaw config validate` 已經失敗，請先從 `openclaw configure`
或 `openclaw doctor --fix` 開始。`openclaw chat` 不會繞過無效設定防護。

典型流程：

1. 啟動本機模式：

```bash
openclaw chat
```

2. 詢問代理你想檢查的內容，例如：

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

4. 使用 `openclaw config set` 或 `openclaw configure` 套用狹窄變更，然後重新執行 `!openclaw config validate`。
5. 如果 Doctor 建議自動遷移或修復，請先檢閱再執行 `!openclaw doctor --fix`。

提示：

- 優先使用 `openclaw config set` 或 `openclaw configure`，而不是手動編輯 `openclaw.json`。
- `openclaw docs "<query>"` 會從同一台機器搜尋即時文件索引。
- 當你需要結構化 schema 和 SecretRef/可解析性錯誤時，`openclaw config validate --json` 很有用。

## 工具輸出

- 工具呼叫會以含 args + results 的卡片顯示。
- Ctrl+O 會在收合/展開檢視之間切換。
- 工具執行時，部分更新會串流到同一張卡片中。

## 終端機色彩

- 終端介面會讓助理本文使用你終端機的預設前景色，讓深色和淺色終端機都保持可讀。
- 如果你的終端機使用淺色背景且自動偵測錯誤，請在啟動 `openclaw tui` 前設定 `OPENCLAW_THEME=light`。
- 若要改為強制使用原本的深色調色盤，請設定 `OPENCLAW_THEME=dark`。

## 歷史 + 串流

- 連線時，終端介面會載入最新歷史（預設 200 則訊息）。
- 串流回應會就地更新，直到完成。
- 終端介面也會監聽代理工具事件，以提供更豐富的工具卡片。

## 連線詳細資料

- 終端介面會以 `mode: "tui"` 向閘道註冊。
- 重新連線會顯示系統訊息；事件缺口會在記錄中呈現。

## 選項

- `--local`：針對本機內嵌代理執行階段執行
- `--url <url>`：閘道 WebSocket URL（預設為設定或 `ws://127.0.0.1:<port>`）
- `--token <token>`：閘道 token（如需要）
- `--password <password>`：閘道密碼（如需要）
- `--session <key>`：工作階段鍵（預設：`main`，或範圍為 global 時使用 `global`）
- `--deliver`：將助理回覆送達供應商（預設關閉）
- `--thinking <level>`：覆寫傳送時的思考層級
- `--message <text>`：連線後傳送初始訊息
- `--timeout-ms <ms>`：代理逾時毫秒數（預設為 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要載入的歷史項目數（預設 `200`）

<Warning>
設定 `--url` 時，終端介面不會退回使用設定或環境憑證。請明確傳入 `--token` 或 `--password`。缺少明確憑證會造成錯誤。在本機模式中，請勿傳入 `--url`、`--token` 或 `--password`。
</Warning>

## 疑難排解

傳送訊息後沒有輸出：

- 在終端介面中執行 `/status`，確認閘道已連線且為閒置/忙碌狀態。
- 檢查閘道記錄：`openclaw logs --follow`。
- 確認代理可以執行：`openclaw status` 和 `openclaw models status`。
- 如果你預期訊息出現在聊天通道中，請啟用送達（`/deliver on` 或 `--deliver`）。

## 連線疑難排解

- `disconnected`：確認閘道正在執行，且你的 `--url/--token/--password` 正確。
- 選擇器中沒有代理：檢查 `openclaw agents list` 和你的路由設定。
- 工作階段選擇器為空：你可能位於 global 範圍，或尚未有工作階段。

## 相關

- [控制 UI](/zh-TW/web/control-ui) — 網頁型控制介面
- [設定](/zh-TW/cli/config) — 檢查、驗證並編輯 `openclaw.json`
- [Doctor](/zh-TW/cli/doctor) — 引導式修復與遷移檢查
- [命令列介面參考](/zh-TW/cli) — 完整命令列介面命令參考

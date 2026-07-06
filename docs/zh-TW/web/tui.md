---
read_when:
    - 你想要一份適合初學者的終端介面逐步導覽
    - 你需要完整的終端介面功能、命令與快捷鍵清單
summary: 終端介面 (TUI)：連線至閘道或以嵌入模式在本機執行
title: 終端介面
x-i18n:
    generated_at: "2026-07-06T10:54:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eec565ebdf91d705074798ef5bad433fd3d8e7c429e6bd0214a3eb3baa39c1f
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

不使用閘道執行終端介面：

```bash
openclaw chat
# 或
openclaw tui --local
```

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的別名。
- `--local` 不能與 `--url`、`--token` 或 `--password` 合併使用。
- 本機模式會直接使用嵌入式代理執行階段。大多數本機工具都能運作，但僅限閘道的功能無法使用。
- 裸 `openclaw`（沒有子命令）會自動選擇目標：未設定的安裝會執行 onboarding；無效設定會開啟 [Crestodian](#crestodian-setup-and-repair-helper)；有效設定若可連到閘道，會以閘道模式開啟此終端介面 shell，否則以本機模式開啟。

## 你會看到什麼

- 標頭：連線 URL、目前代理、目前工作階段。
- 聊天記錄：使用者訊息、助理回覆、系統通知、工具卡片。
- 狀態列：連線/執行狀態（connecting、running、streaming、idle、error）。
- 頁尾：代理 + 工作階段 + 模型 + 目標狀態 + think/fast/verbose/trace/reasoning + token 計數 + deliver。啟用 `tui.footer.showRemoteHost` 時，遠端閘道連線也會顯示連線主機。
- 輸入：具備自動完成的文字編輯器。

## 心智模型：代理 + 工作階段

- 代理是唯一 slug（例如 `main`、`research`）。閘道會公開清單。
- 工作階段屬於目前代理。
- 工作階段金鑰會儲存為 `agent:<agentId>:<sessionKey>`。
  - 如果你輸入 `/session main`，終端介面會將其展開為 `agent:<currentAgent>:main`。
  - 如果你輸入 `/session agent:other:main`，你會明確切換到該代理工作階段。
- 工作階段範圍：
  - `per-sender`（預設）：每個代理有多個工作階段。
  - `global`：終端介面一律使用 `global` 工作階段（選擇器可能是空的）。
- 目前代理 + 工作階段永遠會顯示在頁尾。
- 若要為非本機、以 URL 支援的連線顯示閘道主機，請用以下方式選擇啟用：

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  預設為 `false`。Loopback 和嵌入式本機連線絕不顯示主機標籤。

- 如果工作階段有[目標](/zh-TW/tools/goal)，頁尾會顯示其精簡狀態：
  `Pursuing goal`、`Goal paused (/goal resume)`、`Goal blocked (/goal resume)` 或 `Goal achieved`。
- 未帶 `--session` 啟動時，如果同一個閘道、代理與工作階段範圍的上次所選工作階段仍存在，閘道模式終端介面會恢復該工作階段。傳入 `--session`、`/session`、`/new` 或 `/reset` 仍是明確操作。

## 傳送 + 遞送

- 訊息一律送到閘道（或本機模式中的嵌入式執行階段）；將助理回覆再送回聊天提供者是另一個預設關閉的獨立步驟。
- 終端介面是像 WebChat 一樣的內部來源介面，不是通用對外頻道。需要 `tools.message` 才能顯示回覆的測試工具，可透過無目標的 `message.send` 滿足作用中的終端介面回合；明確的提供者遞送仍使用一般已設定頻道，且絕不退回到 `lastChannel`。
- 遞送會在啟動時固定於整個終端介面工作階段：以 `openclaw tui --deliver` 啟動即可開啟。沒有 `/deliver` slash command 或 Settings 切換可在工作階段中途切換；若要變更，請重新啟動終端介面。

## 選擇器 + 覆蓋層

- 模型選擇器：列出可用模型並設定工作階段覆寫。
- 代理選擇器：選擇不同代理。
- 工作階段選擇器：顯示目前代理最近 7 天更新的最多 50 個工作階段。使用 `/session <key>` 跳到較舊的已知工作階段。
- Settings（`/settings`）：切換工具輸出展開與思考可見性。此面板不控制遞送。

## 鍵盤快捷鍵

- Enter：傳送訊息
- Esc：中止作用中的執行
- Ctrl+C：清除輸入（按兩次離開）
- Ctrl+D：離開
- Ctrl+L：模型選擇器
- Ctrl+G：代理選擇器
- Ctrl+P：工作階段選擇器
- Ctrl+O：切換工具輸出展開
- Ctrl+T：切換思考可見性（重新載入歷史）

## Slash commands

核心：

- `/help`
- `/status`（閘道轉送；顯示工作階段/模型摘要）
- `/gateway-status`（別名 `/gwstatus`；直接顯示閘道連線狀態）
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

工作階段控制：

- `/think <off|minimal|low|medium|high>`（較高層級可能會依模型加入 `xhigh`/`max` 等層級）
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` 會清除工作階段覆寫）
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（別名：`/elev`）
- `/activation <mention|always>`

工作階段生命週期：

- `/new`（在新金鑰下產生全新、隔離的工作階段；不影響舊工作階段上的其他終端介面用戶端）
- `/reset`（就地重設目前工作階段金鑰）
- `/abort`（中止作用中的執行）
- `/settings`
- `/exit`（或 `/quit`）

僅本機模式：

- `/auth [provider]` 會在終端介面內開啟提供者驗證/登入流程。

Crestodian：

- `/crestodian [request]` 會從一般代理終端介面回到 [Crestodian](#crestodian-setup-and-repair-helper) 設定/修復聊天，並可選擇性轉送一個請求。

其他閘道 slash commands（例如 `/context`）會轉送到閘道並顯示為系統輸出。請參閱 [Slash commands](/zh-TW/tools/slash-commands)。

## 本機 shell 命令

- 以 `!` 作為行首前綴，可在終端介面主機上執行本機 shell 命令。
- 終端介面每個工作階段只會提示一次是否允許本機執行；拒絕會讓該工作階段停用 `!`。
- 命令會在終端介面工作目錄中的全新非互動式 shell 執行（沒有持久的 `cd`/env）。
- 本機 shell 命令會在其環境中收到 `OPENCLAW_SHELL=tui-local`。
- 單獨的 `!` 會作為一般訊息傳送；前置空格不會觸發本機執行。

## Crestodian 設定與修復助手

Crestodian 是 ring-zero 設定/修復助理，公開為 `openclaw crestodian`（或在裸 `openclaw` 發現無效設定時自動啟動）。它執行在與 `openclaw tui --local` 相同的本機終端介面 shell 內，但由專用對話/作業層支援，而不是即時模型+工具工作階段：

```bash
openclaw crestodian                       # 互動式啟動
openclaw crestodian -m "status"           # 執行一個請求後離開
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # 套用設定寫入
```

- 持久設定寫入需要核准：互動式確認，或傳入 `--yes`。
- `--json` 會以 JSON 列印啟動概覽，而不是啟動聊天。
- 在 Crestodian 內，`open-tui` 請求（例如要求與一般代理交談）會離開 Crestodian 並開啟一般代理終端介面；在那裡使用 `/crestodian` 回來。

當目前設定已通過驗證，且你希望嵌入式代理在同一台機器上檢查它、與文件比較，並在不依賴執行中閘道的情況下協助修復偏移時，請使用本機模式。

如果 `openclaw config validate` 已經失敗，請先從 `openclaw configure` 或 `openclaw doctor --fix` 開始；`openclaw chat` 仍需要可載入的設定才能啟動。

典型迴圈：

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

4. 使用 `openclaw config set` 或 `openclaw configure` 套用小範圍變更，然後重新執行 `!openclaw config validate`。
5. 如果 Doctor 建議自動遷移或修復，請審閱後執行 `!openclaw doctor --fix`。

提示：

- 優先使用 `openclaw config set` 或 `openclaw configure`，而不是手動編輯 `openclaw.json`。
- `openclaw docs "<query>"` 會從同一台機器搜尋即時文件索引。
- 當你需要結構化 schema 與 SecretRef/可解析性錯誤時，`openclaw config validate --json` 很有用。

## 工具輸出

- 工具呼叫會顯示為包含 args + results 的卡片。
- Ctrl+O 可在收合/展開檢視之間切換。
- 工具執行時，部分更新會串流到同一張卡片中。

## 終端顏色

- 終端介面會讓助理正文文字維持使用你終端的預設前景色，讓深色與淺色終端都保持可讀。
- 如果你的終端使用淺色背景且自動偵測錯誤，請在啟動 `openclaw tui` 前設定 `OPENCLAW_THEME=light`。
- 若要改為強制使用原本的深色調色盤，請設定 `OPENCLAW_THEME=dark`。

## 歷史 + 串流

- 連線時，終端介面會載入最新歷史（預設 200 則訊息）。
- 串流回應會就地更新，直到完成。
- 終端介面也會監聽代理工具事件，以提供更豐富的工具卡片。

## 連線詳細資料

- 終端介面會以 `openclaw-tui` 用戶端 ID，在粗略的 `ui` 用戶端模式下連線（Control UI 和 WebChat 用於閘道政策的模式相同）。
- 重新連線會顯示系統訊息；事件缺口會浮現在記錄中。

## 選項

- `--local`：針對本機嵌入式代理執行階段執行
- `--url <url>`：閘道 WebSocket URL（預設為設定中的 `gateway.remote.url`，或 loopback 上的 `ws://127.0.0.1:<port>`）
- `--token <token>`：閘道 token（若需要）
- `--password <password>`：閘道密碼（若需要）
- `--session <key>`：工作階段金鑰（預設：`main`，或範圍為 global 時的 `global`）
- `--deliver`：將助理回覆遞送給提供者（預設關閉）
- `--thinking <level>`：覆寫傳送時的思考層級
- `--message <text>`：連線後傳送初始訊息
- `--timeout-ms <ms>`：代理逾時毫秒數（預設為 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要載入的歷史項目（預設 `200`）

<Warning>
設定 `--url` 時，終端介面不會退回到設定或環境憑證。請明確傳入 `--token` 或 `--password`。缺少明確憑證會導致錯誤。在本機模式中，請勿傳入 `--url`、`--token` 或 `--password`。
</Warning>

## 疑難排解

傳送訊息後沒有輸出：

- 在終端介面中執行 `/status`，確認閘道已連線且為 idle/busy。
- 檢查閘道記錄：`openclaw logs --follow`。
- 確認代理可以執行：`openclaw status` 和 `openclaw models status`。
- 如果你預期在聊天頻道中看到訊息，請確認終端介面是以 `--deliver` 啟動（這無法在稍後不重新啟動的情況下開啟）。

## 連線疑難排解

- `disconnected`：確保閘道正在執行，且你的 `--url/--token/--password` 正確。
- 選擇器中沒有代理：檢查 `openclaw agents list` 與你的路由設定。
- 工作階段選擇器為空：你可能在 global 範圍，或尚未有任何工作階段。

## 相關

- [Control UI](/zh-TW/web/control-ui) — 網頁型控制介面
- [Config](/zh-TW/cli/config) — 檢查、驗證並編輯 `openclaw.json`
- [Doctor](/zh-TW/cli/doctor) — 引導式修復與遷移檢查
- [CLI Reference](/zh-TW/cli) — 完整命令列介面命令參考

---
read_when:
    - 你想要一份適合初學者的終端介面逐步教學
    - 你需要完整的終端介面功能、命令與快捷鍵清單
summary: 終端 UI（終端介面）：連線至閘道，或在嵌入模式下於本機執行
title: 終端介面
x-i18n:
    generated_at: "2026-07-05T11:49:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8950c282ec9cab35c6ca35b35184f75a54902cd16d1b48140e1753cd79eb06a3
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

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的別名。
- `--local` 不能與 `--url`、`--token` 或 `--password` 搭配使用。
- 本機模式會直接使用內嵌代理程式執行階段。大多數本機工具都可運作，但僅限閘道的功能無法使用。
- 裸 `openclaw`（沒有子命令）會自動選擇目標：未設定的安裝會執行初始設定；無效設定會開啟 [Crestodian](#crestodian-setup-and-repair-helper)；有效設定則在可連線到閘道時以閘道模式開啟此終端介面殼層，否則以本機模式開啟。

## 你會看到什麼

- 標頭：連線 URL、目前代理程式、目前工作階段。
- 聊天記錄：使用者訊息、助理回覆、系統通知、工具卡片。
- 狀態列：連線/執行狀態（連線中、執行中、串流中、閒置、錯誤）。
- 頁尾：代理程式 + 工作階段 + 模型 + 目標狀態 + 思考/快速/詳細/追蹤/推理 + 權杖計數 + 傳送。啟用 `tui.footer.showRemoteHost` 時，遠端閘道連線也會顯示連線主機。
- 輸入：具備自動完成的文字編輯器。

## 心智模型：代理程式 + 工作階段

- 代理程式是唯一的 slug（例如 `main`、`research`）。閘道會公開此清單。
- 工作階段屬於目前代理程式。
- 工作階段鍵會儲存為 `agent:<agentId>:<sessionKey>`。
  - 如果你輸入 `/session main`，終端介面會將其展開為 `agent:<currentAgent>:main`。
  - 如果你輸入 `/session agent:other:main`，你會明確切換到該代理程式工作階段。
- 工作階段範圍：
  - `per-sender`（預設）：每個代理程式有多個工作階段。
  - `global`：終端介面一律使用 `global` 工作階段（選擇器可能為空）。
- 目前代理程式 + 工作階段一律會顯示在頁尾。
- 若要為非本機、URL 支援的連線顯示閘道主機，請選擇啟用：

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  預設值為 `false`。回送與內嵌本機連線永遠不會顯示主機標籤。

- 如果工作階段有[目標](/zh-TW/tools/goal)，頁尾會顯示其精簡狀態：
  `Pursuing goal`、`Goal paused (/goal resume)`、`Goal blocked (/goal resume)` 或 `Goal achieved`。
- 未使用 `--session` 啟動時，如果同一閘道、代理程式與工作階段範圍的上次所選工作階段仍存在，閘道模式終端介面會恢復該工作階段。傳入 `--session`、`/session`、`/new` 或 `/reset` 仍然是明確操作。

## 傳送 + 遞送

- 訊息一律會送到閘道（或本機模式中的內嵌執行階段）；將助理回覆再遞送回聊天提供者，是另一個預設關閉的步驟。
- 終端介面是類似 WebChat 的內部來源介面，不是通用的外送通道。需要 `tools.message` 以產生可見回覆的測試框架，可以用無目標的 `message.send` 滿足目前終端介面回合；明確的提供者遞送仍使用正常設定的通道，且永遠不會退回到 `lastChannel`。
- 遞送會在啟動時固定套用於整個終端介面工作階段：使用 `openclaw tui --deliver` 啟動即可開啟。沒有 `/deliver` 斜線命令或設定切換可在工作階段中途變更；若要變更，請重新啟動終端介面。

## 選擇器 + 覆蓋層

- 模型選擇器：列出可用模型並設定工作階段覆寫。
- 代理程式選擇器：選擇不同代理程式。
- 工作階段選擇器：顯示目前代理程式最近 7 天內更新的最多 50 個工作階段。使用 `/session <key>` 跳到較舊的已知工作階段。
- 設定（`/settings`）：切換工具輸出展開與思考可見性。此面板不控制遞送。

## 鍵盤快捷鍵

- Enter：傳送訊息
- Esc：中止作用中的執行
- Ctrl+C：清除輸入（按兩次即可結束）
- Ctrl+D：結束
- Ctrl+L：模型選擇器
- Ctrl+G：代理程式選擇器
- Ctrl+P：工作階段選擇器
- Ctrl+O：切換工具輸出展開
- Ctrl+T：切換思考可見性（重新載入歷史）

## 斜線命令

核心：

- `/help`
- `/status`（轉送到閘道；顯示工作階段/模型摘要）
- `/gateway-status`（別名 `/gwstatus`；直接顯示閘道連線狀態）
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

工作階段控制：

- `/think <off|minimal|low|medium|high>`（較高層級可能依模型加入 `xhigh`/`max` 等層級）
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` 會清除工作階段覆寫）
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（別名：`/elev`）
- `/activation <mention|always>`

工作階段生命週期：

- `/new`（在新鍵下產生全新、隔離的工作階段；不影響舊工作階段上的其他終端介面用戶端）
- `/reset`（就地重設目前工作階段鍵）
- `/abort`（中止作用中的執行）
- `/settings`
- `/exit`（或 `/quit`）

僅限本機模式：

- `/auth [provider]` 會在終端介面內開啟提供者驗證/登入流程。

Crestodian：

- `/crestodian [request]` 會從一般代理程式終端介面回到 [Crestodian](#crestodian-setup-and-repair-helper) 設定/修復聊天，並可選擇性轉送一個請求。

其他閘道斜線命令（例如 `/context`）會轉送到閘道並顯示為系統輸出。請參閱[斜線命令](/zh-TW/tools/slash-commands)。

## 本機殼層命令

- 在一行前面加上 `!`，即可在終端介面主機上執行本機殼層命令。
- 終端介面每個工作階段會提示一次以允許本機執行；拒絕後，該工作階段會保持停用 `!`。
- 命令會在終端介面工作目錄中以全新、非互動式殼層執行（沒有持久的 `cd`/env）。
- 本機殼層命令會在其環境中收到 `OPENCLAW_SHELL=tui-local`。
- 單獨的 `!` 會作為一般訊息傳送；前導空格不會觸發本機執行。

## Crestodian 設定與修復輔助工具

Crestodian 是零環級設定/修復助理，公開為 `openclaw crestodian`（或在裸 `openclaw` 找到無效設定時自動啟動）。它在與 `openclaw tui --local` 相同的本機終端介面殼層中執行，但由專用的對話/操作層支援，而不是即時模型+工具工作階段：

```bash
openclaw crestodian                       # start interactively
openclaw crestodian -m "status"           # run one request and exit
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # apply a config write
```

- 持久設定寫入需要核准：請互動式確認，或傳入 `--yes`。
- `--json` 會以 JSON 印出啟動概覽，而不是開始聊天。
- 在 Crestodian 內部，`open-tui` 請求（例如要求與一般代理程式對話）會結束 Crestodian 並開啟一般代理程式終端介面；在那裡使用 `/crestodian` 即可返回。

當目前設定已可通過驗證，而你希望內嵌代理程式在同一台機器上檢查設定、與文件比對，並在不依賴執行中閘道的情況下協助修復漂移時，請使用本機模式。

如果 `openclaw config validate` 已經失敗，請先從 `openclaw configure` 或 `openclaw doctor --fix` 開始；`openclaw chat` 仍需要可載入的設定才能啟動。

典型流程：

1. 啟動本機模式：

```bash
openclaw chat
```

2. 詢問代理程式你想檢查的內容，例如：

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 使用本機殼層命令取得精確證據與驗證：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. 使用 `openclaw config set` 或 `openclaw configure` 套用小範圍變更，然後重新執行 `!openclaw config validate`。
5. 如果 Doctor 建議自動遷移或修復，請檢閱後執行 `!openclaw doctor --fix`。

提示：

- 優先使用 `openclaw config set` 或 `openclaw configure`，而不是手動編輯 `openclaw.json`。
- `openclaw docs "<query>"` 會從同一台機器搜尋即時文件索引。
- 當你需要結構化 schema 與 SecretRef/可解析性錯誤時，`openclaw config validate --json` 很有用。

## 工具輸出

- 工具呼叫會顯示為包含參數 + 結果的卡片。
- Ctrl+O 會在收合/展開檢視之間切換。
- 工具執行期間，部分更新會串流到同一卡片中。

## 終端機色彩

- 終端介面會讓助理正文文字使用你終端機的預設前景色，因此深色和淺色終端機都能保持可讀。
- 如果你的終端機使用淺色背景且自動偵測錯誤，請在啟動 `openclaw tui` 前設定 `OPENCLAW_THEME=light`。
- 若要改為強制使用原始深色調色盤，請設定 `OPENCLAW_THEME=dark`。

## 歷史 + 串流

- 連線時，終端介面會載入最新歷史（預設 200 則訊息）。
- 串流回應會就地更新，直到完成。
- 終端介面也會監聽代理程式工具事件，以提供更豐富的工具卡片。

## 連線詳細資料

- 終端介面會使用用戶端 ID `openclaw-tui`，並採用粗略的 `ui` 用戶端模式連線（與 Control UI 和 WebChat 用於閘道政策的模式相同）。
- 重新連線會顯示系統訊息；事件缺口會在記錄中呈現。

## 選項

- `--local`：針對本機內嵌代理程式執行階段執行
- `--url <url>`：閘道 WebSocket URL（預設為設定中的 `gateway.remote.url`，或回送上的 `ws://127.0.0.1:<port>`）
- `--token <token>`：閘道權杖（如需要）
- `--password <password>`：閘道密碼（如需要）
- `--session <key>`：工作階段鍵（預設：`main`，或範圍為全域時的 `global`）
- `--deliver`：將助理回覆遞送給提供者（預設關閉）
- `--thinking <level>`：覆寫傳送時的思考層級
- `--message <text>`：連線後傳送初始訊息
- `--timeout-ms <ms>`：代理程式逾時毫秒數（預設為 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要載入的歷史項目數（預設 `200`）

<Warning>
當你設定 `--url` 時，終端介面不會退回到設定或環境憑證。請明確傳入 `--token` 或 `--password`。缺少明確憑證會導致錯誤。在本機模式中，請勿傳入 `--url`、`--token` 或 `--password`。
</Warning>

## 疑難排解

傳送訊息後沒有輸出：

- 在終端介面中執行 `/status`，確認閘道已連線且處於閒置/忙碌狀態。
- 檢查閘道記錄：`openclaw logs --follow`。
- 確認代理程式可執行：`openclaw status` 和 `openclaw models status`。
- 如果你預期訊息出現在聊天通道中，請確認終端介面是以 `--deliver` 啟動（這無法在之後不重新啟動的情況下開啟）。

## 連線疑難排解

- `disconnected`：確認閘道正在執行，且你的 `--url/--token/--password` 正確。
- 選擇器中沒有代理程式：檢查 `openclaw agents list` 和你的路由設定。
- 工作階段選擇器為空：你可能在全域範圍中，或尚未有任何工作階段。

## 相關

- [控制 UI](/zh-TW/web/control-ui) — 網頁式控制介面
- [設定](/zh-TW/cli/config) — 檢查、驗證並編輯 `openclaw.json`
- [Doctor](/zh-TW/cli/doctor) — 引導式修復與遷移檢查
- [命令列介面參考](/zh-TW/cli) — 完整命令列介面命令參考

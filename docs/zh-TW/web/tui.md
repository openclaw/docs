---
read_when:
    - 你想要一份適合初學者的終端介面操作指南
    - 你需要完整的終端介面功能、命令和快捷鍵清單
summary: 終端介面（TUI）：連線至閘道，或以嵌入模式在本機執行
title: 終端介面
x-i18n:
    generated_at: "2026-07-16T12:02:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
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

3. 輸入訊息並按下 Enter。

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
- `--local` 不能與 `--url`、`--token` 或 `--password` 一起使用。
- 本機模式會直接使用內嵌的代理程式執行階段。大多數本機工具都能運作，但僅限閘道的功能無法使用。
- 單獨執行 `openclaw`（不含子命令）時，會自動選擇目標：尚未設定的安裝會執行推論初始設定；設定無效時會開啟傳統的 Doctor 指引；可連線且已設定的閘道會以閘道模式開啟此終端介面殼層；否則，已設定的本機模型會以本機模式開啟它。

## 畫面內容

- 標頭：連線 URL、目前的代理程式、目前的工作階段。
- 聊天記錄：使用者訊息、助理回覆、系統通知、工具卡片。
- 狀態列：連線／執行狀態（連線中、執行中、串流中、閒置、錯誤）。
- 頁尾：代理程式 + 工作階段 + 模型 + 目標狀態 + 思考／快速／詳細／追蹤／推理 + Token 數量 + 傳送。啟用 `tui.footer.showRemoteHost` 時，遠端閘道連線也會顯示連線主機。
- 輸入區：具備自動完成的文字編輯器。

## 心智模型：代理程式 + 工作階段

- 代理程式由唯一的 slug 識別（例如 `main`、`research`）。閘道會提供此清單。
- 工作階段隸屬於目前的代理程式。
- 工作階段金鑰儲存為 `agent:<agentId>:<sessionKey>`。
  - 如果輸入 `/session main`，終端介面會將其展開為 `agent:<currentAgent>:main`。
  - 如果輸入 `/session agent:other:main`，則會明確切換至該代理程式工作階段。
- 工作階段範圍：
  - `per-sender`（預設）：每個代理程式可有多個工作階段。
  - `global`：終端介面一律使用 `global` 工作階段（選擇器可能為空）。
- 目前的代理程式和工作階段一律顯示於頁尾。
- 若要顯示非本機、以 URL 為基礎之連線的閘道主機，請使用下列設定啟用：

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  預設值為 `false`。迴路及內嵌本機連線絕不會顯示主機標籤。

- 如果工作階段有[目標](/zh-TW/tools/goal)，頁尾會顯示其精簡狀態：
  `Pursuing goal`、`Goal paused (/goal resume)`、`Goal blocked (/goal resume)` 或 `Goal achieved`。
- 未使用 `--session` 啟動時，閘道模式的終端介面會針對相同的閘道、代理程式和工作階段範圍，繼續使用上次選取的工作階段（若該工作階段仍存在）。傳入 `--session`、`/session`、`/new` 或 `/reset` 時，仍會明確指定工作階段。

## 傳送訊息與遞送

- 訊息一律傳送至閘道（或本機模式中的內嵌執行階段）；將助理的回覆向外遞送至聊天服務提供者是另一個獨立步驟，且預設關閉。
- 終端介面與 WebChat 一樣，是內部來源介面，而不是通用的對外傳送頻道。若測試框架要求使用 `tools.message` 才能顯示回覆，可透過不指定目標的 `message.send` 完成目前的終端介面回合；明確的服務提供者遞送仍會使用一般已設定的頻道，且絕不會退回使用 `lastChannel`。
- 遞送設定會在啟動時固定套用於整個終端介面工作階段：使用 `openclaw tui --deliver` 啟動即可開啟。沒有 `/deliver` 斜線命令或「設定」切換開關可在工作階段中途變更；若要變更，請重新啟動終端介面。

## 選擇器與覆蓋面板

- 模型選擇器：列出可用模型並設定工作階段覆寫。
- 代理程式選擇器：選擇其他代理程式。
- 工作階段選擇器：顯示目前代理程式在過去 7 天內更新的最多 50 個工作階段。使用 `/session <key>` 可跳至已知的較舊工作階段。
- 設定（`/settings`）：切換工具輸出展開狀態與思考內容的可見性。此面板不控制遞送。

## 鍵盤快速鍵

- Enter：傳送訊息
- Esc：中止作用中的執行
- Ctrl+C：清除輸入內容（按兩次即可結束）
- Ctrl+D：結束
- Ctrl+L：模型選擇器
- Ctrl+G：代理程式選擇器
- Ctrl+P：工作階段選擇器
- Ctrl+O：切換工具輸出的展開狀態
- Ctrl+T：切換思考內容的可見性（會重新載入歷史記錄）

## 斜線命令

核心：

- `/help`
- `/status`（轉送至閘道；顯示工作階段／模型摘要）
- `/gateway-status`（別名 `/gwstatus`；直接顯示閘道連線狀態）
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

工作階段控制：

- `/think <off|minimal|low|medium|high>`（視模型而定，較高階層可能會新增 `xhigh`/`max` 等層級）
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>`（`reset`/`inherit`/`clear`/`default` 會清除工作階段覆寫）
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>`（別名：`/elev`）
- `/activation <mention|always>`

工作階段生命週期：

- `/new`（以新金鑰建立全新且隔離的工作階段；不影響舊工作階段中的其他終端介面用戶端）
- `/reset`（就地重設目前的工作階段金鑰）
- `/abort`（中止作用中的執行）
- `/settings`
- `/exit`（或 `/quit`）

僅限本機模式：

- `/auth [provider]` 會在終端介面中開啟服務提供者的驗證／登入流程。

OpenClaw：

- `/openclaw [request]` 會從一般代理程式終端介面返回 [OpenClaw](#openclaw-setup-and-repair-helper) 設定／修復聊天，並可選擇轉送一項要求。

其他閘道斜線命令（例如 `/context`）會轉送至閘道，並顯示為系統輸出。請參閱[斜線命令](/zh-TW/tools/slash-commands)。

## 本機 Shell 命令

- 在行首加上 `!`，即可於終端介面主機上執行本機 Shell 命令。
- 終端介面會在每個工作階段中提示一次，詢問是否允許本機執行；若拒絕，該工作階段中的 `!` 將保持停用。
- 命令會在終端介面工作目錄中的全新非互動式 Shell 內執行（不會保留 `cd`/環境）。
- 本機 Shell 命令的環境中會包含 `OPENCLAW_SHELL=tui-local`。
- 單獨的 `!` 會當成一般訊息傳送；行首空格不會觸發本機執行。

## OpenClaw 設定與修復輔助工具

OpenClaw 是最高權限層級的設定／修復助理，在已設定的預設模型通過即時推論檢查後，會以 `openclaw setup` 的形式提供。若無法使用推論，互動式呼叫會返回推論初始設定，而自動化呼叫則會失敗並提供修復指引。它與 `openclaw tui --local` 在相同的本機終端介面殼層中執行，並由僅能執行 OpenClaw 強型別且需經核准之操作的 AI 代理程式提供支援：

```bash
openclaw setup                       # 以互動方式啟動
openclaw setup -m "status"           # 執行一項要求後結束
openclaw setup -m "set default model openai/gpt-5.2" --yes   # 套用設定寫入
```

- 永久性設定寫入需要核准：請以互動方式確認，或傳入 `--yes`。
- `--json` 會將啟動概覽列印為 JSON，而不會啟動聊天。
- 在 OpenClaw 中，`open-tui` 要求（例如要求與一般代理程式交談）會結束 OpenClaw 並開啟一般代理程式終端介面；在該處使用 `/openclaw` 即可返回。

當目前設定已通過驗證，而你希望內嵌代理程式在同一台電腦上檢查設定、與文件比較，並協助修復偏差，且不依賴執行中的閘道時，請使用本機模式。

如果 `openclaw config validate` 已經失敗，請先使用 `openclaw configure` 或 `openclaw doctor --fix`；`openclaw chat` 仍需要可載入的設定才能啟動。

一般流程：

1. 啟動本機模式：

```bash
openclaw chat
```

2. 告訴代理程式你想檢查的內容，例如：

```text
比較我的閘道驗證設定與文件，並建議最小幅度的修正。
```

3. 使用本機 Shell 命令取得精確證據並進行驗證：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. 使用 `openclaw config set` 或 `openclaw configure` 套用小範圍變更，然後重新執行 `!openclaw config validate`。
5. 如果 Doctor 建議執行自動移轉或修復，請先檢閱內容，再執行 `!openclaw doctor --fix`。

提示：

- 優先使用 `openclaw config set` 或 `openclaw configure`，不要手動編輯 `openclaw.json`。
- `openclaw docs "<query>"` 會從同一台電腦搜尋即時文件索引。
- 若需要結構化結構描述以及 SecretRef／可解析性錯誤，`openclaw config validate --json` 會很有幫助。

## 工具輸出

- 工具呼叫會顯示為包含引數與結果的卡片。
- Ctrl+O 可在收合與展開檢視之間切換。
- 工具執行期間，部分更新會串流至同一張卡片中。

## 終端機色彩

- 終端介面會讓助理內文沿用終端機的預設前景色，使深色與淺色終端機都能保持清晰可讀。
- 如果終端機使用淺色背景，但自動偵測結果不正確，請先設定 `OPENCLAW_THEME=light`，再啟動 `openclaw tui`。
- 若要改為強制使用原始深色調色盤，請設定 `OPENCLAW_THEME=dark`。

## 歷史記錄與串流

- 連線時，終端介面會載入最新的歷史記錄（預設為 200 則訊息）。
- 串流回應會就地更新，直到完成為止。
- 終端介面也會監聽代理程式工具事件，以提供資訊更豐富的工具卡片。

## 連線詳細資料

- 終端介面會以用戶端 ID `openclaw-tui` 連線，並使用概略的 `ui` 用戶端模式（Control UI 與 WebChat 的閘道原則也使用相同模式）。
- 重新連線時會顯示系統訊息；事件缺口則會顯示於記錄中。

## 選項

- `--local`：針對本機內嵌的代理程式執行階段執行
- `--url <url>`：閘道 WebSocket URL（預設為設定中的 `gateway.remote.url`，若使用回送介面則為 `ws://127.0.0.1:<port>`）
- `--token <token>`：閘道權杖（如有需要）
- `--password <password>`：閘道密碼（如有需要）
- `--tls-fingerprint <sha256>`：釘選 `wss://` 閘道的預期 TLS 憑證指紋
- `--session <key>`：工作階段金鑰（預設：`main`；範圍為全域時則為 `global`）
- `--deliver`：將助理回覆傳送至提供者（預設關閉）
- `--thinking <level>`：覆寫傳送時的思考層級
- `--message <text>`：連線後傳送初始訊息
- `--timeout-ms <ms>`：代理程式逾時時間（毫秒，預設為 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要載入的歷史記錄項目數（預設為 `200`）

<Warning>
設定 `--url` 時，終端介面不會改用設定或環境中的認證資訊。請明確傳入 `--token` 或 `--password`；若目標使用釘選憑證，另需傳入 `--tls-fingerprint`。未明確提供認證資訊會導致錯誤。在本機模式下，請勿傳入 `--url`、`--token`、`--password` 或 `--tls-fingerprint`。
</Warning>

## 疑難排解

傳送訊息後沒有輸出：

- 在終端介面中執行 `/status`，確認閘道已連線且處於閒置／忙碌狀態。
- 檢查閘道記錄：`openclaw logs --follow`。
- 確認代理程式可以執行：`openclaw status` 和 `openclaw models status`。
- 若預期在聊天頻道中收到訊息，請確認啟動終端介面時已使用 `--deliver`（之後若不重新啟動，便無法開啟此功能）。

## 連線疑難排解

- `disconnected`：確認閘道正在執行，且你的 `--url/--token/--password` 正確無誤。
- 選擇器中沒有代理程式：檢查 `openclaw agents list` 和你的路由設定。
- 工作階段選擇器是空的：你可能位於全域範圍，或目前尚無任何工作階段。

## 相關內容

- [控制介面](/zh-TW/web/control-ui) — 網頁式控制介面
- [設定](/zh-TW/cli/config) — 檢查、驗證及編輯 `openclaw.json`
- [診斷工具](/zh-TW/cli/doctor) — 引導式修復與移轉檢查
- [命令列介面參考](/zh-TW/cli) — 完整的命令列介面命令參考

---
read_when:
    - 你想讓 Codex Desktop 或命令列介面工作階段顯示在 OpenClaw 中
    - 你需要從已儲存或閒置的本機 Codex 工作階段建立分支，或將其封存
    - 你正在公開來自已配對節點的 Codex 工作階段與對話記錄歷程
sidebarTitle: Codex supervision
summary: 瀏覽 OpenClaw 節點上未封存的原生 Codex 工作階段與分頁記錄稿
title: 監督 Codex 工作階段
x-i18n:
    generated_at: "2026-07-19T13:51:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f365e3207dff092c3dfd8f7588d60d70a16f0cce484991eb4ab3fc0bd15f8051
    source_path: plugins/codex-supervision.md
    workflow: 16
---

Codex 監督功能是官方 `codex` 外掛的選用功能。它會在一般工作階段側邊欄與 Chat 窗格中，顯示來自閘道電腦及已選擇加入之配對電腦的未封存 Codex 命令列介面、VS Code、Atlas 與 ChatGPT 來源工作階段。

初始版本刻意將權責範圍保持在較小範圍：

- 已儲存或閒置的本機工作階段，可從其有界的持久化使用者與助理歷程建立模型鎖定的 OpenClaw Chat。第一則訊息會先啟動原生快照分支，接著使用 Codex App Server 為該分支選定的確切模型與提供者，啟動完整的 Codex 控制框架執行緒。後續輪次會還原標準原生執行緒持久化的配對設定，同時由受監督繫結防止 OpenClaw 替換成其他執行階段、模型或備援。獨立的原生 Codex 控制項仍可變更該持久化配對設定。已建立的分支會開啟其現有 Chat。
- 從另一個 Codex 程序探索到的已儲存工作階段，其即時活動狀態不明。它可以建立分支，或只能在操作員確認沒有其他 Codex 用戶端正在使用後封存。
- 作用中的來源會保持顯示，但在目前輪次結束前無法建立分支或封存。如果它已有受監督的 Chat，仍可使用 **開啟 Chat**。
- 配對節點上的工作階段會透過有界、以游標分頁的 App Server 讀取來公開其持久化逐字記錄。遠端接續需要未來的串流節點橋接；遠端封存還需要執行器權責租約或同等的隔離機制。
- 不會列出已封存的工作階段。只有在操作員確認沒有其他 Codex 用戶端正在使用後，才能封存已儲存或閒置的本機工作階段。

## 開始之前

- 在閘道上安裝官方 `@openclaw/codex` 外掛。啟用 Codex 功能時，OpenClaw macOS App 可以安裝此外掛；命令列介面安裝則可執行 `openclaw plugins install @openclaw/codex`。
- 在每部你想列出其工作階段的電腦上安裝 Codex Desktop 或 Codex 命令列介面，並完成登入。
- 將遠端電腦配對為 OpenClaw 節點。每部電腦都必須在本機選擇加入；只在閘道上啟用監督功能並不會授權其他節點。
- 使用由擁有者控制的閘道。工作階段標題、工作目錄與 Git 分支可能會洩露敏感的專案資訊。

## 啟用監督功能

引導式 `openclaw onboard` 與 macOS 首次執行設定會在偵測到原生 Codex 安裝，並成功啟用所選推論後端後，嘗試安裝及啟用 Codex 監督功能。Codex 不需要是主要後端。當這項機會性外掛啟用成功時，監督功能便可使用。監督功能首次連線時會檢查 App Server 的可用性。明確停用 Codex 外掛或政策封鎖會阻止機會性啟用；現有的明確 `supervision.enabled: false` 會停用面向代理程式的監督工具。只要 Codex 外掛仍處於作用中，操作員目錄就會保持註冊，除非 `sessionCatalog.enabled: false` 將其停用。這個獨立開關不會變更 Codex 提供者、控制框架或面向代理程式的監督政策，同時也會從此主機移除配對節點目錄的列出／讀取命令。
現有安裝可以手動啟用相同功能：

在 `openclaw.json` 中啟用 `codex` 外掛及其監督功能：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

如果有 `plugins.allow`，請包含 `codex`。變更外掛啟用狀態後，請重新啟動閘道。

若沒有明確的 `appServer` 連線設定，監督功能會針對原生使用者 Codex 主目錄使用獨立、受管理的 stdio 監督連線。一般 Codex 控制框架預設仍限定於代理程式範圍。這使兩個 App 都能看到原生工作階段，而不會讓一般 OpenClaw 輪次共用原生 Codex 狀態。如果控制框架也應共用該狀態，請明確設定 `appServer.homeScope: "user"`。監督功能會遵循明確的 `appServer` 連線設定，而不會以其本機使用者主目錄預設值取代。

從 **Codex** 側邊欄群組採用的 Chat 並非一般控制框架工作階段。其私有監督繫結會使用監督連線進行來源讀取、建立標準分支、注入歷程，以及處理每個後續輪次。使用預設本機連線時，這會保留原生使用者 Codex 主目錄、驗證與提供者設定，而不會變更其他工作階段的預設值。受監看且已採用的 Chat 也會參與[工作階段狀態感知](/zh-TW/concepts/session-state)。

對於預設本機監督連線，其儲存區與原生 Codex 用戶端共用。OpenClaw 不會假設另一個用戶端共用同一個即時 App Server 程序，而原生狀態的權責限定於程序本機。因此，當其監督 App Server 將某個執行緒回報為 `notLoaded` 時，它會將該執行緒視為**已儲存／活動狀態不明**，而非閒置。

請在所有應顯示其工作階段的無頭節點主機上套用相同的選擇加入設定。原生 OpenClaw macOS App 向配對閘道公布其 Codex 目錄時，會讀取相同的本機設定。該配對的原生 Mac 目錄僅支援預設或明確的 `appServer.transport: "stdio"`，且 `appServer.homeScope: "user"` 未設定或已明確設定。該 stdio 程序會遵循 `command`、`args` 與 `clearEnv`。如果 Mac 設定選取 `"unix"`、`"websocket"` 或 `homeScope: "agent"`，App 不會公布目錄功能或命令，而過時的直接叫用會失敗，不會公開使用者 Codex 主目錄，也不會產生不同的本機 stdio App Server。

新公布的節點命令會變更節點已核准的命令介面。請從閘道主機核准更新：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

未封存的 Codex 工作階段也會出現在主要 Control UI 側邊欄中，並依主機分組。選取一個工作階段即可讀取其持久化逐字記錄。檢視器使用最新的 Codex `thread/turns/list` API 搭配 `itemsView: "full"`，且每個要求最多載入 20 個輪次；**載入較舊的逐字記錄項目**會接續最新頁面中的不透明 App Server 游標。載入的頁面會依時間順序呈現。檢視器絕不載入無界的 `thread/read` 歷程。超過 20 MiB 傳輸安全上限的頁面會採取封閉式失敗，而不會冒險影響節點或閘道連線。

在一般工作階段側邊欄中開啟 **Codex** 群組。它會列出相同的工作階段，並依主機分組。**載入更多工作階段**會附加每個仍有較舊資料列之主機的下一頁，且這些附加的資料列會在側邊欄定期重新整理後保留。每個主機會在其原生清單處理完成後立即顯示。可見頁面會在節點連線狀態變更、重新取得焦點時，以及最多每 30 秒重新協調一次；若結果有所變更，會更快執行後續處理。因此，在 Codex Desktop、命令列介面或其他原生用戶端中建立的工作階段無須完整重新載入頁面便會顯示。第一頁會遵循 Codex 自身依最近更新時間排序的順序，因此新建立的原生工作階段可以立即出現。
每個回傳的搜尋頁面會掃描每台主機上有界數量的原生頁面，而不是將查詢傳送至 App Server，因為原生搜尋也能比對逐字記錄預覽。

主機可用性與執行緒狀態是分開的。**離線**或**無法使用**描述的是主機重新整理狀態；無法使用的主機不會回傳新的工作階段資料列，也不會將執行緒的原生狀態變更為 `offline`。工作階段資料列使用 Codex 狀態，例如 `idle`、`active`、`notLoaded` 或錯誤。失敗的主機不會隱藏健康主機的結果。

側邊欄警告會包含目錄錯誤代碼，以及可安全顯示的底層閘道錯誤。開啟 **Settings > Automation > Plugins > Codex > Native Session Discovery**，即可停用探索功能而不停用 Codex。若為 `NODE_LIST_FAILED`，請比較 `openclaw nodes list` 與 **Settings > Devices**；詳細原因會指出需要修復的是配對儲存區、節點登錄、權限或閘道生命週期故障。

## 使用操作員命令列介面

終端命令列介面會公開相同的未封存目錄，以及閘道本機分支與封存動作：

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

`openclaw codex sessions` 選項：

- `--search <text>` 會搜尋工作階段標題，且不區分大小寫。
- `--host <id>` 會將回應限制在單一穩定的目錄主機，例如 `gateway:local` 或 `node:<node-id>`。
- `--limit <count>` 設定每台主機 1 至 100 個資料列；預設值為 50。
- `--cursor <cursor>` 會接續單一主機頁面，因此需要 `--host`。
- `--json` 會輸出結構化的閘道回應。

這三個命令都會從閘道用戶端繼承 `--url`、`--token` 與 `--timeout <ms>`。工作階段清單的預設逾時為 75,000 ms，讓冷啟動的配對節點目錄有時間完成；接續與封存的預設逾時為 30,000 ms。它們也會公開共用的 `--expect-final` 開關，但不會變更這些一元監督 RPC。每個命令都需要 `operator.write` 閘道範圍。
每個子命令都提供標準 `-h, --help` 輸出。
沒有已封存或包含已封存的選項。`sessions` 可以列出配對主機，但 `continue` 與 `archive` 一律以 `gateway:local` 為目標；配對資料列僅供列出。封存一律需要 `--confirm-no-other-runner`。

這些 Shell 命令與 Chat 內的 `/codex` 執行階段命令不同。
`/codex threads [filter]` 會列出目前對話連線可用的 App Server 執行緒。`/codex sessions --host <node>` 會列出單一節點上可恢復的 Codex 命令列介面工作階段檔案，而非監督功能的整體目錄。`/codex
resume` 與 `/codex bind` 會附加目前對話，而不是建立安全的受監督分支；模型鎖定的受監督 Chat 會拒絕這些繫結變更。沒有 `/codex continue` 或 `/codex archive` 執行階段命令。

## 從本機工作階段建立分支

在閘道電腦的已儲存或閒置資料列上選擇**以分支接續**。OpenClaw 會建立一般 Chat 項目，鏡像來源至最後一個持久化終止輪次（已完成、已中斷或失敗）為止的有界使用者與助理歷程、記錄待處理的控制框架分支，並開啟 Chat。一般模型選擇器會被鎖定，但尚未選取具體模型或提供者。來源不會恢復，標準控制框架執行緒也尚未啟動。重複此動作會開啟現有 Chat，而不是建立另一個分支。

鏡像會保留同時符合以下三項限制的最新可見尾端內容：使用者或助理訊息最多 200 則、UTF-8 文字總計 512 KiB，以及每則訊息 64 KiB。過大的訊息會以標記截斷，而達到上限時會省略較舊的訊息。影像或本機影像輸入會變成字面值 `[Image attachment]` 預留位置；不會複製影像資料與本機路徑。

傳送第一則一般 Chat 訊息以開始工作。Codex 控制框架會安裝真正的核准、資訊徵詢、事件與傳遞處理常式。它會在監督連線上使用暫時的原生分支，以固定來源快照，而不提供模型或供應商覆寫。Codex App Server 會從目前的原生設定中選取兩者，並回傳實際選擇。在同一條連線上，OpenClaw 會在其目前工作目錄與執行階段原則下，使用回傳的確切配對啟動標準的 `appServer` 來源完整控制框架執行緒、注入有限的可見歷史記錄，並封存暫時分支。標準執行緒具有完整的 OpenClaw 控制框架工具介面。這是可見歷史記錄分支，而非完整的原生 rollout 複製：來源推理、工具呼叫與工具結果均會省略。此回合與之後的每個回合都會維持在受監督的 Codex 連線上，而不會移至另一個 OpenClaw 模型執行階段或一般的 agent-home 控制框架。

回傳的選擇並不能證明來源的歷史模型。如果目前的原生設定與來源上一回合記錄的模型不同，Codex 會發出一般的模型差異警告。OpenClaw 會使用回傳的配對啟動標準執行緒。Codex 會持久保存該標準執行緒的原生模型與供應商，之後繼續執行時，因 OpenClaw 省略模型與供應商覆寫而保留它們。如果透過另一個原生 Codex 控制介面變更標準執行緒，OpenClaw 會接受 Codex 持久保存的選擇。OpenClaw 絕不會替換成其外層模型或備援鏈。

受監督且模型鎖定的 Chat 無法刪除、切換模型、使用 `/new` 或 `/reset`、叫用閘道工作階段重設動作，或使用通用的 **分支工作階段** 動作。變更 `/codex model <model>`、`/codex
bind`、`/codex resume`（包括含有 `--bind here` 的節點工作階段），以及 `/codex detach` 或 `/codex unbind` 也會遭到拒絕，因為這些操作會取代或清除鎖定的原生繫結。`/codex model` 查詢以及 `/codex fast`、`/codex permissions` 和 `/codex threads` 仍可使用。需要不同模型或全新執行緒時，請啟動另一個一般工作階段。

請為此 Chat 保持啟用監督。如果停用監督，或其儲存的連線繫結變得無法使用或不一致，該回合會採取失敗關閉，而不會移至一般的 agent-home 工作階段。

停用或解除安裝 `codex` 外掛不會釋放該所有權，也不會讓 Chat 可改用其他模型。鎖定的 Chat 會保留但無法使用；請重新安裝或重新啟用同一個外掛，並重新啟動閘道以繼續執行。這項刻意採用的失敗關閉行為，可防止保留資料清理或暫時的外掛中斷在未告知的情況下讓原生繫結成為孤立狀態。

`codex_threads` 代理程式工具遵循相同邊界。它無法附加不同的分支，也無法封存 Chat 所繫結的原生執行緒。清單與僅限中繼資料的讀取仍可使用。原始逐字記錄讀取需要 `allowRawTranscripts`。
停用原始存取時，`codex_threads` 也會拒絕清單搜尋，因為原生搜尋包含逐字記錄預覽；Control UI 與操作者命令列介面仍提供有限的僅標題搜尋。重新命名、取消封存、分離式分支，以及封存無關且不受管理的執行緒，都需要
`allowWriteControls`。兩個選項皆無法繞過鎖定的繫結。

OpenClaw 僅列出來源執行緒或顯示待處理 Chat 時，不會訂閱或回應核准要求。在第一回合啟動獨立的標準控制框架執行緒，可讓另一個 Codex 程序繼續擁有來源，而不會產生彼此競爭的 rollout 寫入者。

原始的命令列介面、VS Code、Atlas 或 ChatGPT 來源仍可由原生用戶端與 OpenClaw 目錄查看。標準分支會儲存為原生 Codex 執行緒，但其來源種類為 `appServer`；Codex Desktop 或其他原生用戶端可能會篩除該來源種類，因此不保證分支本身會出現在每個原生歷史記錄檢視中。

OpenClaw 的 App Server 回報為作用中的資料列無法啟動新分支。請等待目前回合完成，然後重新整理目錄。Codex App Server 會在單一程序內依序執行變更操作，但不提供跨程序的獨占執行器或核准擁有者租約。

對於 **已儲存／活動未知** 資料列，Chat 鏡像與第一回合快照固定會使用 Codex 截至最後一個已持久保存終止回合的狀態。來源執行緒不會繼續執行、中斷或封存。如果另一個程序有進行中的回合，其最新的進行中工作可能不會出現在分支中。

## 封存本機工作階段

在已儲存或閒置的閘道本機資料列上選擇 **封存**，然後確認沒有其他 Codex 用戶端或 OpenClaw 執行器正在使用該執行緒或其衍生後代。OpenClaw 會重新讀取程序本機狀態，僅在狀態為 `idle` 或 `notLoaded` 時繼續，接著呼叫原生 Codex 封存操作，並從未封存清單中移除該工作階段。原生 Codex 也會嘗試封存該執行緒衍生的後代。

如果最新讀取結果回報工作階段處於作用中或錯誤狀態、它屬於已配對節點，或新建立的受監督 Chat 仍有來自該來源的待處理分支，則無法封存。請傳送 Chat 的第一則訊息以具現化其標準分支，再封存來源。如果 OpenClaw 已知某個作用中繫結擁有確切的目標執行緒，或任何未封存的衍生後代，也會阻擋封存。OpenClaw 會逐頁追蹤實驗性的 Codex 後代查詢；若回應無效、要求失敗、游標或執行緒重複，或安全限制用盡，都會拒絕封存。

讀取、後代列舉與封存要求並非單一條件式操作，因此仍可能有回合在這些操作之間啟動。App Server 狀態也不會在獨立程序之間共用。因此，確認動作是未知用戶端與該競態的安全邊界：確認之前，請結束或以其他方式驗證所有其他用戶端。請使用 Codex Desktop、Codex 命令列介面，或經擁有者授權的原生執行緒管理流程還原已封存的執行緒；取消封存後，它會重新出現。

```bash
codex unarchive <thread-id>
```

## 瞭解已配對節點的限制

已配對節點會公開具版本控制的唯讀
`codex.appServer.threads.list.v1` 與
`codex.appServer.thread.turns.list.v1` 命令。可使用 Codex 命令列介面的原生節點主機也會公開列入允許清單的 `codex.terminal.resume.v1`
命令。閘道接收的是正規化的
中繼資料與明確要求的有限逐字記錄頁面，而不是原始 App Server 端點。在操作者終端中開啟資料列時，會在擁有該資料列的主機上執行 `codex resume <thread-id>`
並轉送該命令的 PTY；它不會公開通用
shell 或由閘道提供的 argv。

終端轉送不提供控制框架延續或封存所有權合約。因此，即使遠端執行緒閒置，遠端資料列仍只會保持可見，而不提供 **繼續** 或 **封存**。請透過 **在終端中開啟** 在該電腦上使用 Codex，或使用未來具備安全執行器所有權邊界的延續流程。

## 中繼資料與權限

目錄資料列可能包含：

- 執行緒與工作階段識別碼
- 標題與工作目錄
- 目前狀態與作用中等待旗標
- 建立、更新與活動時間戳記
- 來源、模型供應商、Codex 命令列介面版本與 Git 分支

目錄投影不包含逐字記錄預覽、回合、rollout 路徑、
Codex 主目錄路徑、Git 遠端、提交 SHA，以及原始 App Server 錯誤。目錄
存取與 Control UI 逐字記錄讀取需要 `operator.write` 閘道
範圍，因為裝置群彙總使用標準的 `node.invoke` 路徑，即使
兩個節點命令皆為唯讀亦然。

`supervision.allowRawTranscripts` 與 `supervision.allowWriteControls` 管控
自主代理程式與獨立 MCP 工具。兩者預設皆為 `false`。啟用
監督時，除非允許原始逐字記錄，否則 `codex_threads` 會從
清單與僅限中繼資料的讀取結果中移除逐字記錄預覽與回合；包含
回合的讀取會採取失敗關閉。每個分支、重新命名、封存與取消封存
都需要寫入控制。這些選項不會限制經驗證的 Control UI
逐字記錄檢視，也不會繞過繫結、主機、狀態或確認檢查。

### 相容性工具

官方 `codex` 外掛會為現有代理程式與獨立 MCP 用戶端保留五個已發行的 Supervisor 工具名稱：

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` 預設僅限已載入項目；沒有 `loaded_only`
參數。設定 `include_stored: true`，即可同時從 Codex 的狀態資料庫讀取未封存的已儲存資料列。選用的 `max_stored_sessions` 上限預設為 200，
每個端點可接受 1 至 1,000 筆資料列。它不會限制已載入的資料列。
沒有原始逐字記錄權限時，清單結果會省略衍生自逐字記錄的名稱、
預覽與詳細端點錯誤。
`codex_session_read` 需要 `allowRawTranscripts`；`include_turns: true`
還會要求 Codex 提供回合。

`codex_session_send` 與 `codex_session_interrupt` 需要
`allowWriteControls`。傳送接受 `mode: "auto" | "start" | "steer"`，但
`"start"` 一律會遭拒，而 `"auto"` 與 `"steer"` 都只能引導
可讀取的作用中回合。閒置執行緒會遭拒，並提示使用 **Codex
工作階段**；該處的完整控制框架會在繼續執行前安裝核准與工具處理常式。
中斷同樣需要可讀取的作用中回合。這些工具不會繼續執行或啟動閒置的來源執行緒。

`openclaw doctor --fix` 會將已淘汰的 `codex-supervisor` 項目、其端點
與權限欄位，以及外掛允許／拒絕原則參照移至官方
`codex` 外掛，而不會覆寫明確的標準設定。獨立
相容性 MCP 轉接器會繼續從該外掛載入相同的五個工具；舊版原則環境變數僅適用於該受信任的轉接器內部。

如需所有監督設定欄位，請參閱
[Codex 控制框架參考資料](/zh-TW/plugins/codex-harness-reference#supervision)。

## 疑難排解

**沒有顯示任何工作階段：**請確認已安裝 `@openclaw/codex`、外掛與 `supervision.enabled` 皆為 true、目前的外掛允許清單允許
`codex`，且工作階段尚未封存。變更啟用狀態後，請重新啟動閘道或節點。

**繼續已停用：**未對應的資料列處於作用中、屬於已配對節點、
其主機離線，或另一個動作正在等待處理。閘道本機已儲存與閒置
資料列會提供 **以分支形式繼續**，而非不安全地接管確切執行緒。已有受監督 Chat 的資料列會提供 **開啟 Chat**。

**封存已停用：**確認沒有其他執行器後，已儲存／活動未知及
閒置的閘道本機資料列可進行封存。作用中、錯誤、
離線、已配對節點、待處理分支，以及已知有確切繫結擁有者的資料列，
封存功能仍維持唯讀。

**已封存的工作階段消失：**這是預期行為。監督頁面沒有
已封存檢視。執行 `codex unarchive <thread-id>` 或使用 Codex Desktop，即可再次顯示。

**舊的 `codex-supervisor` 設定仍存在：**執行 `openclaw doctor --fix`。Doctor
會將已淘汰的外掛項目與相關外掛原則參照移至
`plugins.entries.codex.config.supervision`，而不會覆寫明確的 Codex
設定。

## 相關內容

- [Codex 控制框架](/zh-TW/plugins/codex-harness)
- [Codex 控制框架參考資料](/zh-TW/plugins/codex-harness-reference)
- [Codex 控制框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督架構](/zh-TW/specs/codex-supervision)
- [節點](/zh-TW/nodes)
- [閘道安全性](/zh-TW/gateway/security)

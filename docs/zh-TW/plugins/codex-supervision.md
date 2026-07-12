---
read_when:
    - 你希望 Codex Desktop 或命令列介面工作階段顯示在 OpenClaw 中
    - 你需要從已儲存或閒置的本機 Codex 工作階段建立分支，或將其封存
    - 你正從已配對的節點公開 Codex 工作階段與對話記錄歷史
sidebarTitle: Codex supervision
summary: 瀏覽各 OpenClaw 節點上未封存的原生 Codex 工作階段與分頁逐字稿
title: 監督 Codex 工作階段
x-i18n:
    generated_at: "2026-07-12T14:39:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e9378214df3f400b793b4a2c7bd91fb607a73910d4046f69d26debe308869df6
    source_path: plugins/codex-supervision.md
    workflow: 16
---

Codex 監督功能是官方 `codex` 外掛的選用功能。它會在一般工作階段側邊欄與 Chat 窗格中，顯示來自閘道電腦及已選擇加入的配對電腦上，未封存的 Codex Desktop 與命令列介面來源工作階段。

初始版本刻意將擁有權範圍維持在最低限度：

- 已儲存或閒置的本機工作階段，可以使用其有界限的持久化使用者與助理歷程，建立模型鎖定的 OpenClaw Chat。第一則訊息會啟動原生快照分支，接著使用 Codex App Server 為該分支選取的完全相同模型與供應商，啟動完整的 Codex 控制框架執行緒。後續對話輪次會還原標準原生執行緒所持久化的配對，同時受監督的繫結會防止 OpenClaw 改用其他執行階段、模型或備援機制。獨立的原生 Codex 控制項仍可變更該持久化配對。已建立的分支會開啟其現有的 Chat。
- 從另一個 Codex 程序探索到的已儲存工作階段，其即時活動狀態未知。它可以建立分支；若要封存，則必須先由操作人員確認沒有其他 Codex 用戶端正在使用它。
- 作用中的來源會持續顯示，但在目前對話輪次完成前，無法建立分支或封存。如果它已有受監督的 Chat，仍可使用 **Open Chat**。
- 配對節點上的工作階段會透過有界限、以游標分頁的 App Server 讀取，公開其持久化逐字記錄。遠端接續需要未來的串流節點橋接；遠端封存還需要執行器擁有權租約或同等的隔離機制。
- 不會列出已封存的工作階段。只有在操作人員確認沒有其他 Codex 用戶端正在使用後，才能封存已儲存或閒置的本機工作階段。

## 開始之前

- 在閘道上安裝官方 `@openclaw/codex` 外掛。啟用 Codex 功能時，OpenClaw macOS 應用程式可以安裝此外掛；命令列介面安裝則可執行 `openclaw plugins install @openclaw/codex`。
- 在每台你想列出其工作階段的電腦上，安裝並登入 Codex Desktop 或 Codex 命令列介面。
- 將遠端電腦配對為 OpenClaw 節點。每台電腦都必須在本機選擇加入；只在閘道上啟用監督功能，並不會授權其他節點。
- 使用由擁有者控制的閘道。工作階段標題、工作目錄及 Git 分支可能會洩露敏感的專案資訊。

## 啟用監督功能

引導式 `openclaw onboard` 與 macOS 首次執行設定會在偵測到原生 Codex 安裝，且成功啟用所選的推論後端後，嘗試安裝並啟用 Codex 監督功能。Codex 不需要是主要後端。當此機會式外掛啟用成功時，監督功能即可使用。首次連接監督功能時，會檢查 App Server 的可用性。明確停用 Codex 外掛或受到政策封鎖，會阻止機會式啟用；現有且明確的 `supervision.enabled: false` 則會停用面向代理程式的監督工具。只要 Codex 外掛處於啟用狀態，操作人員目錄就會保持註冊。現有安裝可以手動啟用相同功能：

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

如果存在 `plugins.allow`，請加入 `codex`。變更外掛啟用設定後，請重新啟動閘道。

若未明確設定 `appServer` 連線，監督功能會使用獨立的受管理 stdio 監督連線，連接原生使用者的 Codex 主目錄。一般 Codex 控制框架預設仍限定於代理程式範圍。這可讓原生工作階段同時顯示於兩個應用程式中，而不會讓一般 OpenClaw 對話輪次共用原生 Codex 狀態。如果控制框架也應共用該狀態，請明確設定 `appServer.homeScope: "user"`。監督功能會遵循明確的 `appServer` 連線設定，而不會以其本機使用者主目錄預設值取代這些設定。

從 **Codex** 側邊欄群組採用的 Chat，並不是一般的控制框架工作階段。其私有監督繫結會使用監督連線來進行來源讀取、標準分支建立、歷程注入，以及每個後續對話輪次。使用預設本機連線時，這會保留原生使用者的 Codex 主目錄、驗證與供應商設定，而不會變更其他工作階段的預設值。

對於預設的本機監督連線，儲存區會與原生 Codex 用戶端共用。OpenClaw 不會假設其他用戶端共用同一個即時 App Server 程序，而原生狀態的擁有權僅限於程序本機。因此，當監督功能的 App Server 將執行緒回報為 `notLoaded` 時，OpenClaw 會將其視為 **已儲存／活動狀態未知**，而非閒置。

在每個應顯示其工作階段的無頭節點主機上，套用相同的選擇加入設定。原生 OpenClaw macOS 應用程式在向配對的閘道公布其 Codex 目錄時，會讀取相同的本機設定。該配對的原生 Mac 目錄僅支援預設值或明確設定的 `appServer.transport: "stdio"`，且 `appServer.homeScope: "user"` 必須未設定或明確指定。該 stdio 程序會遵循 `command`、`args` 與 `clearEnv`。如果 Mac 設定選取 `"unix"`、`"websocket"` 或 `homeScope: "agent"`，應用程式不會公布目錄功能或命令；過時的直接叫用會失敗，而不會公開使用者 Codex 主目錄或產生不同的本機 stdio App Server。

新公布的節點命令會變更節點已核准的命令介面。請從閘道主機核准此更新：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

未封存的 Codex 工作階段也會顯示在主要控制介面的側邊欄中，並依主機分組。選取其中一個，即可讀取其已保存的逐字記錄。檢視器使用最新的 Codex `thread/turns/list` API，並設定 `itemsView: "full"`，每次請求最多載入 20 個回合；**載入較舊的逐字記錄項目**會沿用最新頁面中不透明的 App Server 游標。載入的頁面會依時間順序顯示。檢視器絕不會載入無上限的 `thread/read` 歷程。若頁面超過 20 MiB 的傳輸安全上限，系統會採取封閉式失敗，以免危及節點或閘道連線。

在一般工作階段側邊欄中開啟 **Codex** 群組。它會列出相同的工作階段，並依主機分組。**載入更多工作階段**會從每個仍有較舊資料列的主機附加下一頁，而這些附加的資料列會在側邊欄定期重新整理後保留。每個傳回的搜尋頁面都只會掃描每台主機數量有限的原生頁面，而不會將查詢傳送至 App Server，因為原生搜尋也能比對逐字記錄預覽。

主機可用性與執行緒狀態彼此獨立。**離線**或**無法使用**描述的是主機重新整理狀態；無法使用的主機不會傳回新的工作階段資料列，也不會將執行緒的原生狀態變更為 `offline`。工作階段資料列會使用 Codex 狀態，例如 `idle`、`active`、`notLoaded` 或錯誤。單一主機失敗時，不會隱藏來自正常主機的結果。

## 使用操作員命令列介面

終端命令列介面提供相同的未封存目錄，以及閘道本機的分支與封存操作：

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

`openclaw codex sessions` 選項：

- `--search <text>` 以不區分大小寫的方式搜尋工作階段標題。
- `--host <id>` 將回應限制在單一穩定的目錄主機，例如
  `gateway:local` 或 `node:<node-id>`。
- `--limit <count>` 設定每個主機 1 至 100 列；預設為 50。
- `--cursor <cursor>` 繼續取得單一主機的下一頁，因此需要 `--host`。
- `--json` 輸出結構化的閘道回應。

這三個命令都會繼承閘道用戶端的 `--url`、`--token` 和 `--timeout <ms>`。
工作階段清單的預設逾時為 75,000 ms，讓冷啟動的已配對節點目錄能夠完成；繼續和封存的預設逾時為 30,000 ms。它們也提供共用的
`--expect-final` 開關，但不會改變這些一元監督 RPC。
每個命令都需要閘道的 `operator.write` 範圍。
每個子命令都提供標準的 `-h, --help` 輸出。
沒有 archived 或 include-archived 選項。`sessions` 可以列出已配對的
主機，但 `continue` 和 `archive` 一律以 `gateway:local` 為目標；已配對主機的資料列
僅供列出。封存一律需要 `--confirm-no-other-runner`。

這些 Shell 命令與聊天內的 `/codex` 執行階段命令不同。
`/codex threads [filter]` 會列出目前對話連線可用的 App Server
執行緒。`/codex sessions --host <node>` 會列出單一節點上可恢復的 Codex
命令列介面工作階段檔案，而不是監督叢集目錄。`/codex
resume` 和 `/codex bind` 會附加目前的對話，而不是建立
安全的受監督分支，而鎖定模型的受監督聊天會拒絕這些
繫結變更。沒有 `/codex continue` 或 `/codex archive` 執行階段
命令。

## 從本機工作階段建立分支

從閘道電腦上已儲存或閒置的資料列中選擇 **Continue as branch**。
OpenClaw 會建立一般的聊天項目，鏡像從來源到最後一個已持久化終止回合（已完成、已中斷或
失敗）為止的有限使用者與助理歷史記錄，記錄待處理的控制框架分支，並開啟聊天。通用模型
選擇器會被鎖定，但此時尚未選取具體模型或供應商。不會繼續來源，也尚未啟動標準控制框架
執行緒。重複此動作會開啟現有聊天，而不會再建立另一個
分支。

鏡像會保留同時符合以下三項限制的最新可見尾端內容：使用者或助理訊息最多 200 則、
UTF-8 文字總計 512 KiB，以及每則訊息 64 KiB。過大的訊息會以標記截斷，而達到上限時會
省略較舊的訊息。圖片或本機圖片輸入會變成字面值
`[Image attachment]` 預留位置；不會複製圖片資料與本機路徑。

傳送第一則一般聊天訊息以開始工作。Codex 控制框架會安裝實際的核准、資訊徵詢、事件與
傳遞處理常式。它會在監督連線上使用暫時的原生分支，固定來源快照，而不提供模型或供應商
覆寫。Codex App Server 會從目前的原生設定中選取兩者，並傳回實際選擇。在同一個
連線上，OpenClaw 會使用傳回的完整配對，依其 cwd 與執行階段政策啟動標準
`appServer` 來源完整控制框架執行緒，注入有限的可見歷史記錄，並封存暫時分支。標準執行緒
具備完整的 OpenClaw 控制框架工具介面。這是可見歷史記錄的分支，而非完整的原生推出作業
複製：來源的推理、工具呼叫與工具結果皆會省略。此回合及之後的每個回合都會留在受監督的
Codex 連線上，而不會使用其他 OpenClaw 模型執行階段或一般的代理程式主目錄控制框架。

傳回的選擇無法證明來源過去使用的模型。如果目前的原生設定與來源最後一回合所記錄的模型
不同，Codex 會發出一般的模型差異警告。OpenClaw 會使用傳回的配對來啟動標準執行緒。
Codex 會持久化該標準執行緒的原生模型與供應商，而後續繼續執行時會保留它們，因為
OpenClaw 會省略模型與供應商覆寫。如果透過另一個原生 Codex 控制介面變更標準執行緒，
OpenClaw 會接受 Codex 持久化的選擇。OpenClaw 絕不會以其外層模型或備援鏈取代該選擇。

受監督且鎖定模型的 Chat 無法刪除、切換模型、使用 `/new`
或 `/reset`、叫用閘道工作階段重設動作，或使用通用的
**分支工作階段**動作。修改 `/codex model <model>`、`/codex
bind`、`/codex resume`（包括使用 `--bind here` 的節點工作階段），以及
`/codex detach` 或 `/codex unbind` 也會遭到拒絕，因為這些操作會取代
或清除鎖定的原生繫結。`/codex model` 查詢，以及 `/codex fast`、
`/codex permissions` 和 `/codex threads` 仍可使用。當你需要不同模型
或全新執行緒時，請啟動另一個一般工作階段。

請讓此 Chat 保持啟用監督。如果停用監督，或其儲存的連線繫結變得
無法使用或不一致，該回合會以封閉方式失敗，而不會移至一般的代理程式
主目錄工作階段。

停用或解除安裝 `codex` 外掛不會解除該所有權，也不會讓 Chat 可以改用
其他模型。鎖定的 Chat 會保留但無法使用；請重新安裝或重新啟用同一個外掛，
並重新啟動閘道以繼續使用。這項刻意採用的失敗封閉行為，可防止保留資料清理
或暫時性的外掛中斷在未發出提示的情況下，使原生繫結成為孤立狀態。

`codex_threads` 代理程式工具遵循相同的邊界。它無法附加不同的分支，
也無法封存 Chat 所繫結的原生執行緒。清單與僅限中繼資料的讀取仍可使用。
讀取原始逐字稿需要 `allowRawTranscripts`。停用原始存取時，
`codex_threads` 也會拒絕清單搜尋，因為原生搜尋包含逐字稿預覽；
Control UI 和操作員命令列介面仍提供有範圍限制、僅依標題的搜尋。
重新命名、取消封存、分離的分支，以及封存不相關且無主的執行緒，都需要
`allowWriteControls`。這兩個選項都無法略過鎖定的繫結。

OpenClaw 在僅列出來源執行緒或顯示待處理 Chat 時，不會訂閱或回應核准要求。
在第一個回合啟動不同的標準操作框架執行緒，可讓另一個 Codex 程序繼續擁有
來源，而不會建立互相競爭的 rollout 寫入者。

原始命令列介面或 VS Code 來源仍可供原生用戶端及 OpenClaw 目錄查看。
標準分支會儲存為原生 Codex 執行緒，但其來源種類為 `appServer`；
Codex Desktop 或其他原生用戶端可能會篩除此來源種類，因此無法保證
該分支本身會出現在每個原生歷程記錄檢視中。

OpenClaw 的 App Server 回報為作用中的資料列無法啟動新分支。請等待目前
回合完成，然後重新整理目錄。Codex App Server 會在單一程序內將修改操作
序列化，但不會提供跨程序專用的執行器或核准擁有者租約。

對於 **已儲存／活動狀態不明** 的資料列，Chat 鏡像與第一回合快照固定會使用
Codex 截至最後一個已持久化終止回合的狀態。來源執行緒不會繼續、遭到中斷
或封存。如果另一個程序有進行中的回合，其最新的執行中工作可能不會出現在
該分支中。

## 封存本機工作階段

在已儲存或閒置的閘道本機資料列上選擇 **封存**，然後確認沒有其他
Codex 用戶端或 OpenClaw 執行器正在使用該執行緒或其衍生後代。
OpenClaw 會重新讀取程序本機狀態，僅在狀態為 `idle` 或 `notLoaded` 時
繼續操作，呼叫原生 Codex 封存操作，並從未封存清單中移除該工作階段。
原生 Codex 也會嘗試封存該執行緒衍生的後代。

若重新讀取回報工作階段處於作用中或錯誤狀態、工作階段屬於已配對節點，
或新建立的受監督 Chat 仍有來自該來源的待處理分支，則無法封存。
請傳送 Chat 的第一則訊息以具現化其標準分支，然後再封存來源。
如果 OpenClaw 得知某個作用中繫結擁有完全相同的目標執行緒，或任何未封存
的衍生後代，也會阻擋封存。OpenClaw 會逐頁執行實驗性的 Codex 後代查詢；
無效的回應、要求失敗、重複的游標或執行緒，或耗盡安全限制，都會導致
封存遭到拒絕。

讀取、列舉後代及封存要求並非單一條件式操作，因此仍可能有回合在這些操作
之間啟動。App Server 狀態也不會在獨立程序之間共用。因此，確認步驟是
未知用戶端與此競態狀況的安全邊界：確認之前，請結束或以其他方式驗證
每個其他用戶端。請使用 Codex Desktop、Codex 命令列介面，或經擁有者授權
的原生執行緒管理流程來還原已封存的執行緒；取消封存後，它會再次出現。

```bash
codex unarchive <thread-id>
```

## 瞭解已配對節點的限制

已配對節點會公開具版本控制且唯讀的
`codex.appServer.threads.list.v1` 和
`codex.appServer.thread.turns.list.v1` 命令。閘道會接收標準化的
中繼資料及明確要求且有範圍限制的逐字稿頁面，絕不會接收原始 App Server
端點。目前的節點叫用傳輸僅支援要求／回應，因此無法承載 Codex 操作框架
所需的長時間事件、核准及串流生命週期。

因此，即使遠端執行緒處於閒置狀態，遠端資料列仍會顯示，但不會提供
**繼續**或**封存**。在節點端具備用於繼續操作的串流執行器橋接器，
以及具備用於封存的安全執行器所有權邊界之前，請在該電腦上使用 Codex。

## 中繼資料與權限

目錄資料列可能包含：

- 執行緒與工作階段識別碼
- 標題與工作目錄
- 目前狀態與作用中等待旗標
- 建立、更新及活動時間戳記
- 來源、模型供應商、Codex 命令列介面版本及 Git 分支

目錄投影不包含逐字稿預覽、回合、rollout 路徑、Codex 主目錄路徑、
Git 遠端、提交 SHA 及原始 App Server 錯誤。目錄存取與 Control UI
逐字稿讀取需要 `operator.write` 閘道範圍，因為叢集彙總使用標準
`node.invoke` 路徑，即使兩個節點命令都是唯讀也是如此。

`supervision.allowRawTranscripts` 和 `supervision.allowWriteControls`
會管理自主代理程式與獨立 MCP 工具。兩者預設皆為 `false`。啟用監督時，
除非允許原始逐字稿，否則 `codex_threads` 會從清單與僅限中繼資料的讀取
結果中移除逐字稿預覽和回合；包含回合的讀取會以封閉方式失敗。每個分支、
重新命名、封存及取消封存操作都需要寫入控制權限。這些選項不會限制已驗證
身分的 Control UI 逐字稿檢視，也不會略過繫結、主機、狀態或確認檢查。

### 相容性工具

官方 `codex` 外掛會為現有代理程式與獨立 MCP 用戶端保留五個已發行的
Supervisor 工具名稱：

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` 預設僅列出已載入項目；沒有 `loaded_only`
參數。設定 `include_stored: true`，即可另外從 Codex 的狀態資料庫讀取
未封存的已儲存資料列。選用的 `max_stored_sessions` 上限預設為 200，
每個端點接受 1 至 1,000 個資料列。此上限不會限制已載入的資料列。
若沒有原始逐字稿權限，清單結果會省略衍生自逐字稿的名稱、預覽及詳細的
端點錯誤。
`codex_session_read` 需要 `allowRawTranscripts`；`include_turns: true`
還會要求 Codex 提供回合。

`codex_session_send` 和 `codex_session_interrupt` 需要
`allowWriteControls`。傳送操作接受 `mode: "auto" | "start" | "steer"`，
但 `"start"` 一律會遭到拒絕，而 `"auto"` 和 `"steer"` 都只能引導可讀取的
作用中回合。閒置執行緒會遭到拒絕，並引導使用者使用 **Codex 工作階段**；
完整的操作框架會先在其中安裝核准與工具處理常式，再繼續操作。中斷操作
同樣需要可讀取的作用中回合。這些工具不會繼續或啟動閒置的來源執行緒。

`openclaw doctor --fix` 會將已淘汰的 `codex-supervisor` 項目、其端點與
權限欄位，以及外掛允許／拒絕原則參照移至官方 `codex` 外掛，而不會覆寫
明確的標準設定。獨立相容性 MCP 轉接器會繼續從該外掛載入相同的五個工具；
舊版原則環境變數僅適用於該受信任的轉接器內部。

如需所有監督設定欄位的資訊，請參閱
[Codex 操作框架參考資料](/zh-TW/plugins/codex-harness-reference#supervision)。

## 疑難排解

**未顯示任何工作階段：**請確認已安裝 `@openclaw/codex`、外掛與
`supervision.enabled` 皆為 true、目前的外掛允許清單允許 `codex`，
且工作階段尚未封存。變更啟用狀態後，請重新啟動閘道或節點。

**繼續已停用：**未對應的資料列處於作用中、屬於已配對節點、其主機離線，
或有另一項動作正在等待處理。閘道本機的已儲存和閒置資料列會提供
**以分支繼續**，而非不安全地接管完全相同的執行緒。已有受監督 Chat 的
資料列會提供 **開啟 Chat**。

**封存已停用：**確認沒有其他執行器後，已儲存／活動狀態不明和閒置的
閘道本機資料列即可使用封存。作用中、錯誤、離線、已配對節點、待處理分支
及已知擁有完全相同繫結的資料列，其封存功能仍為唯讀。

**已封存的工作階段消失：**這是預期行為。監督頁面沒有已封存檢視。
請執行 `codex unarchive <thread-id>`，或使用 Codex Desktop 讓它再次顯示。

**仍保留舊的 `codex-supervisor` 設定：**請執行 `openclaw doctor --fix`。
Doctor 會將已淘汰的外掛項目及相關外掛原則參照移至
`plugins.entries.codex.config.supervision`，而不會覆寫明確的 Codex
設定。

## 相關內容

- [Codex 操作框架](/zh-TW/plugins/codex-harness)
- [Codex 操作框架參考資料](/zh-TW/plugins/codex-harness-reference)
- [Codex 操作框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [Codex 監督架構](/specs/codex-supervision)
- [節點](/zh-TW/nodes)
- [閘道安全性](/zh-TW/gateway/security)

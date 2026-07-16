---
read_when:
    - 安裝 macOS 應用程式
    - 在 macOS 上選擇本機或遠端閘道模式
    - 正在尋找 macOS App 的版本下載檔案
summary: 安裝並使用 OpenClaw macOS 選單列 App
title: macOS 應用程式
x-i18n:
    generated_at: "2026-07-16T11:49:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

macOS App 是 OpenClaw 的**選單列夥伴**：提供原生系統匣介面、macOS
權限提示、通知、WebChat、語音輸入、Canvas，以及
由 Mac 託管的節點工具，例如 `system.run`。

只需要命令列介面和閘道嗎？請從[開始使用](/zh-TW/start/getting-started)著手。

## 下載

從 [OpenClaw GitHub 發行版](https://github.com/openclaw/openclaw/releases)取得 macOS App 組建。
當發行版提供 macOS App 資產時，請尋找：

- `OpenClaw-<version>.dmg`（建議）
- `OpenClaw-<version>.zip`

部分發行版只提供命令列介面、佐證資料或 Windows 資產。如果最新發行版
沒有 macOS App 資產，請使用最新且有提供該資產的版本，或依照
[macOS 開發環境設定](/zh-TW/platforms/mac/dev-setup)從原始碼組建。

## 首次執行

1. 安裝並啟動 **OpenClaw.app**。
2. 選擇 **This Mac** 以使用本機閘道，或連線至遠端閘道。
3. 等待 App 安裝相符的命令列介面執行階段。在本機模式下，App 還會
   安裝並啟動閘道。
4. 透過即時模型檢查建立推論能力。檢查通過後，OpenClaw
   會處理其餘設定。
5. 完成 macOS 權限檢查清單，並傳送新手引導測試訊息。

如果 App 連上現有閘道，且該閘道的預設代理程式已設定
模型，App 會將該閘道視為已完成設定，略過供應商新手引導和
OpenClaw，並開啟儀表板。如果無法連線至閘道，或其
預設代理程式沒有模型，仍可使用推論新手引導
進行復原。

若要使用命令列介面／閘道設定流程，請參閱[開始使用](/zh-TW/start/getting-started)。
若要復原權限，請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。

## 更新

儀表板更新卡片會指出 App 將更新的項目：

- **更新 Mac App + 閘道**表示已簽署的 App 擁有由本機 launchd
  管理的閘道。Sparkle 會先更新 App；App 重新啟動後，會自動
  將其閘道更新至相符版本並重新啟動，然後驗證
  連線。
- **更新閘道**表示 App 已連線至遠端閘道、手動
  管理的本機閘道，或 App 不擁有的其他安裝項目。此按鈕
  會執行該閘道的一般更新流程，而不會變更 Mac App。

協調更新失敗時，App 會停留在類似設定流程的視窗中，並提供重試、
[更新指南](/zh-TW/install/updating)和 Discord 操作。自動修復絕不會
降級較新的閘道，也不會覆寫 `extended-stable` 頻道固定設定。

成功更新後，App 會找出最近由使用者操作過的
最上層直接工作階段，並向該代理程式傳送一次性更新事件。心跳偵測
和排程活動不會影響此選擇。接著，代理程式可以從
你最可能正在使用的對話中歡迎你回來。在遠端模式下，App
只會更新本機 Mac 節點執行階段；若遠端閘道的版本比 App 舊，
則會略過通知。

Sparkle 會遵循閘道的 `update.channel` 設定。`beta` 和 `dev` 會選擇加入
Beta App 組建；`stable`、`extended-stable`，以及缺少或未知的值
則會繼續使用穩定版 App 組建。

## 開啟儀表板連結

在 macOS App 的內嵌儀表板中，按一下外部網頁連結會在可調整大小的瀏覽器側邊欄中開啟，側邊欄寬度為視窗的一半，同時保留儀表板導覽。拖曳分隔線可選擇其他寬度；App 會記住該設定。每個連結都會在自己的分頁中開啟；開啟多個頁面時會顯示分頁列，再次按一下相同連結會重複使用其現有分頁。拖曳分頁可重新排序，使用分頁關閉按鈕或按一下滑鼠中鍵可將其關閉；在分頁上按一下滑鼠右鍵，可使用 **Open in Default Browser**、**Copy Link**、**Reload**、**Close Tab** 和 **Close Other Tabs**。視窗標題列的上一頁／下一頁控制項和觸控式軌跡板滑動手勢可瀏覽儀表板歷程記錄；側邊欄自己的上一頁／下一頁控制項則可瀏覽目前分頁的歷程記錄。側邊欄也有重新載入、在預設瀏覽器中開啟和關閉控制項。

標題列控制項會配合 App 側邊欄：展開時，上一頁／下一頁位於其右側邊緣、側邊欄切換按鈕旁；收合時，這些控制項會讓位給搜尋按鈕（開啟命令選擇區）和新增工作階段按鈕。

在外部連結上按一下滑鼠右鍵，可選擇 **Open in Sidebar**、**Open in Default Browser** 或 **Copy Link**。從儀表板使用輔助鍵點按，以及由使用者啟動的新視窗連結，仍會在預設瀏覽器中開啟；側邊欄內的新視窗連結則會以新的側邊欄分頁開啟。一般由瀏覽器託管的控制介面頁面會保留瀏覽器的一般連結與內容選單行為。

## 匯入瀏覽器登入狀態

當 App 連線至本機閘道時，瀏覽器側邊欄首次開啟時，若 Mac 上存在含 Cookie 的 Chrome 系列設定檔，儀表板會顯示可關閉的橫幅。該橫幅可將這些 Cookie 複製到代理程式用於瀏覽的隔離受管理設定檔中。從其 **Import** 控制項選擇設定檔（可能需要 Touch ID）；進度與已匯入的 Cookie 數量會顯示在同一位置，而且只會複製 Cookie——密碼絕不會離開來源瀏覽器。關閉橫幅會記錄此選擇；隨時使用 **Settings → General → Browser login → Import…** 都可再次顯示。底層匯入流程和 `browser.allowSystemProfileImport` 閘門請參閱[瀏覽器](/zh-TW/cli/browser)。

## 選擇閘道模式

| 模式   | 適用情況                                                                    | 詳細頁面                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 本機  | 這台 Mac 應執行閘道，並透過 launchd 使其持續運作。                | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway) |
| 遠端 | 由另一台主機執行閘道；這台 Mac 透過 SSH、區域網路或 Tailnet 控制它。 | [遠端控制](/zh-TW/platforms/mac/remote)            |

兩種模式都需要已安裝的 `openclaw` 命令列介面，因為 App 會重複使用其節點主機
執行階段。在全新的 Mac 上，App 會自動安裝相符的命令列介面；本機
模式接著會啟動閘道精靈，而遠端模式則會連線至所選的
閘道，不會啟動第二個本機閘道。
手動復原方式請參閱 [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)。

## App 負責的項目

- 選單列狀態、通知、健康狀態和 WebChat。
- 螢幕、麥克風、語音、自動化和輔助使用的 macOS 權限提示。
- 一個 Mac 節點，將原生 Canvas、相機／螢幕擷取、通知、
  位置資訊和電腦控制，與命令列介面節點主機的系統、瀏覽器、
  外掛、技能和 MCP 命令整合在一起。
- 由 Mac 託管之命令的執行核准提示。
- 在 App 情境中執行已核准的 Shell 命令，由命令列介面執行階段
  負責共用節點政策，同時保留 App 的 macOS 權限歸屬。
- 遠端模式 SSH 通道或直接閘道連線。

App **不會**取代閘道或一般命令列介面文件。閘道
設定、供應商、外掛、頻道、工具和安全性各自記載於
專屬文件中。

## macOS 詳細頁面

| 工作                                     | 參閱                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安裝命令列介面／閘道服務或進行偵錯 | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)                                          |
| 避免將狀態存放在雲端同步資料夾中   | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 對 App 探索與連線能力進行偵錯     | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| 瞭解 launchd 行為              | [閘道生命週期](/zh-TW/platforms/mac/child-process)                                           |
| 修正權限或簽署／TCC 問題    | [macOS 權限](/zh-TW/platforms/mac/permissions)                                             |
| 偵測你最近使用的 Mac    | [使用中電腦的存在狀態](/zh-TW/nodes/presence)                                                 |
| 連線至遠端閘道              | [遠端控制](/zh-TW/platforms/mac/remote)                                                     |
| 查看選單列狀態和健康狀態檢查   | [選單列](/zh-TW/platforms/mac/menu-bar)、[健康狀態檢查](/zh-TW/platforms/mac/health)                 |
| 使用內嵌聊天介面                 | [WebChat](/zh-TW/platforms/mac/webchat)                                                           |
| 使用語音喚醒或按鍵說話           | [語音喚醒](/zh-TW/platforms/mac/voicewake)                                                      |
| 使用 Canvas 和 Canvas 深層連結         | [Canvas](/zh-TW/platforms/mac/canvas)                                                             |
| 託管 PeekabooBridge 以進行介面自動化    | [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)                                                  |
| 設定命令核准              | [執行核准](/zh-TW/tools/exec-approvals)、[進階詳細資訊](/zh-TW/tools/exec-approvals-advanced) |
| 檢查 Mac 節點命令和 App IPC    | [macOS IPC](/zh-TW/platforms/mac/xpc)                                                             |
| 擷取記錄                             | [macOS 記錄](/zh-TW/platforms/mac/logging)                                                     |
| 從原始碼組建                        | [macOS 開發環境設定](/zh-TW/platforms/mac/dev-setup)                                                 |

## 相關內容

- [平台](/zh-TW/platforms)
- [開始使用](/zh-TW/start/getting-started)
- [閘道](/zh-TW/gateway)
- [執行核准](/zh-TW/tools/exec-approvals)

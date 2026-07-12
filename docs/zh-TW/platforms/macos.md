---
read_when:
    - 安裝 macOS App
    - 在 macOS 上選擇本機或遠端閘道模式
    - 尋找 macOS App 版本下載檔案
summary: 安裝並使用 OpenClaw macOS 選單列 App
title: macOS 應用程式
x-i18n:
    generated_at: "2026-07-12T21:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ef3ea75aa2f158829da643ca016681e40102cc4fad84e207e80b377d023c2e1f
    source_path: platforms/macos.md
    workflow: 16
---

macOS App 是 OpenClaw 的**選單列夥伴**：提供原生系統匣 UI、macOS
權限提示、通知、WebChat、語音輸入、Canvas，以及
`system.run` 等由 Mac 託管的節點工具。

只需要命令列介面和閘道嗎？請從[開始使用](/zh-TW/start/getting-started)開始。

## 下載

請從 [OpenClaw GitHub Releases](https://github.com/openclaw/openclaw/releases) 取得 macOS App 建置版本。
當版本包含 macOS App 資產時，請尋找：

- `OpenClaw-<version>.dmg`（建議）
- `OpenClaw-<version>.zip`

有些版本只提供命令列介面、證據或 Windows 資產。如果最新版本
沒有 macOS App 資產，請使用具有該資產的最新版本，或按照
[macOS 開發環境設定](/zh-TW/platforms/mac/dev-setup)從原始碼建置。

## 首次執行

1. 安裝並啟動 **OpenClaw.app**。
2. 若要使用本機閘道，請選擇 **This Mac**；也可以連線至遠端閘道。
3. 等待 App 安裝相符的命令列介面執行階段。在本機模式下，它也會
   安裝並啟動閘道。
4. 透過即時模型檢查建立推論能力。檢查通過後，Crestodian
   會處理其餘設定。
5. 完成 macOS 權限檢查清單，並傳送新手引導測試訊息。

如果 App 連線到現有閘道，且該閘道的預設代理程式已設定
模型，它會將該閘道視為已完成設定、略過提供者新手引導和
Crestodian，並開啟儀表板。如果無法連線至閘道，或其
預設代理程式沒有模型，仍可使用推論新手引導進行
復原。

如需命令列介面／閘道設定流程，請參閱[開始使用](/zh-TW/start/getting-started)。
如需復原權限，請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。

## 更新

儀表板的更新卡片會先透過 Sparkle 更新已簽署的 macOS App。
App 重新啟動後，會自動更新並重新啟動相符且由 App
管理的本機閘道。Homebrew 和其他由使用者管理的命令列介面安裝會保留
一般的閘道更新流程（卡片會直接執行閘道更新），
而且自動修復絕不會將較新的閘道降級，也不會覆寫
`extended-stable` 頻道的固定設定。

Sparkle 會遵循閘道的 `update.channel` 設定。`beta` 和 `dev` 會選擇加入
Beta 版 App 建置；`stable`、`extended-stable`，以及缺少或未知的值
則會維持使用穩定版 App 建置。

## 開啟儀表板連結

在 macOS App 的內嵌儀表板中，按一下外部網頁連結會在可調整大小的瀏覽器側邊欄中開啟。每個連結都會在自己的分頁中開啟；再次按一下同一連結時，會重複使用現有分頁。拖曳分頁可重新排序；使用分頁關閉按鈕或按一下滑鼠中鍵即可關閉；在分頁上按一下右鍵可使用 **Open in Default Browser**、**Copy Link**、**Reload**、**Close Tab** 和 **Close Other Tabs**。視窗標題列的上一頁／下一頁控制項和觸控式軌跡板滑動手勢可瀏覽儀表板歷程記錄；側邊欄本身的上一頁／下一頁控制項則可瀏覽目前分頁的歷程記錄。側邊欄也提供重新載入、在預設瀏覽器中開啟及關閉控制項，並會記住其寬度。

標題列控制項會配合 App 側邊欄：展開時，上一頁／下一頁位於其右側邊緣、緊鄰側邊欄切換按鈕；收合時，則會讓出空間給搜尋按鈕（開啟命令選擇區）和新增工作階段按鈕。

在外部連結上按一下右鍵，可選擇 **Open in Sidebar**、**Open in Default Browser** 或 **Copy Link**。從儀表板進行的輔助鍵點擊，以及由使用者啟動的新視窗連結，仍會在預設瀏覽器中開啟；側邊欄內的新視窗連結則會以新的側邊欄分頁開啟。一般由瀏覽器託管的控制 UI 頁面會保留瀏覽器正常的連結和內容選單行為。

## 匯入瀏覽器登入資訊

當 App 連線至本機閘道執行，且 Mac 上存在含有 Cookie 的 Chrome 系列設定檔時，儀表板視窗會顯示可關閉的橫幅，讓你將這些 Cookie 複製到代理程式瀏覽時使用的隔離式受管理設定檔。從橫幅的 **Import** 控制項中選擇設定檔（可能需要 Touch ID）；進度與匯入的 Cookie 數量會顯示在同一處，且只會複製 Cookie——密碼絕不會離開來源瀏覽器。關閉橫幅會記錄此選擇；你隨時都可以透過 **Settings → General → Browser login → Import…** 再次開啟此功能。請參閱[瀏覽器](/zh-TW/cli/browser)，以瞭解底層匯入流程和 `browser.allowSystemProfileImport` 閘門。

## 選擇閘道模式

| 模式   | 適用情況                                                                       | 詳細資訊頁面                                       |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 本機   | 這台 Mac 應執行閘道，並透過 launchd 維持其運作。                              | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway) |
| 遠端   | 由另一台主機執行閘道；這台 Mac 透過 SSH、LAN 或 Tailnet 控制它。              | [遠端控制](/zh-TW/platforms/mac/remote)                 |

兩種模式都需要安裝 `openclaw` 命令列介面，因為 App 會重複使用其節點主機
執行階段。在全新的 Mac 上，App 會自動安裝相符的命令列介面；接著，本機
模式會啟動閘道精靈，而遠端模式會連線至所選的
閘道，而不會啟動第二個本機閘道。
如需手動復原，請參閱 [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)。

## App 負責的項目

- 選單列狀態、通知、健康狀態和 WebChat。
- 針對螢幕、麥克風、語音、自動化和輔助使用功能顯示 macOS 權限提示。
- 一個 Mac 節點，將原生 Canvas、相機／螢幕擷取、通知、
  位置和電腦控制，與命令列介面節點主機的系統、瀏覽器、
  外掛、技能和 MCP 命令結合。
- Mac 託管命令的執行核准提示。
- 針對已核准 Shell 命令的 App 情境執行方式；在命令列介面執行階段負責共用節點政策的同時，保留 App 的 macOS
  權限歸屬。
- 遠端模式的 SSH 通道或直接閘道連線。

此 App **不會**取代閘道或一般命令列介面文件。閘道
設定、提供者、外掛、頻道、工具和安全性各自位於其
專屬文件中。

## macOS 詳細資訊頁面

| 工作                                     | 參閱                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安裝或偵錯命令列介面／閘道服務           | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)                                          |
| 避免將狀態存放在雲端同步資料夾中         | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 偵錯 App 探索與連線能力                   | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| 瞭解 launchd 行為                        | [閘道生命週期](/zh-TW/platforms/mac/child-process)                                               |
| 修正權限或簽署／TCC 問題                 | [macOS 權限](/zh-TW/platforms/mac/permissions)                                                   |
| 偵測你最近使用的 Mac                     | [作用中電腦在線狀態](/zh-TW/nodes/presence)                                                     |
| 連線至遠端閘道                           | [遠端控制](/zh-TW/platforms/mac/remote)                                                         |
| 查看選單列狀態與健康狀態檢查             | [選單列](/zh-TW/platforms/mac/menu-bar)、[健康狀態檢查](/zh-TW/platforms/mac/health)                 |
| 使用內嵌聊天 UI                          | [WebChat](/zh-TW/platforms/mac/webchat)                                                           |
| 使用語音喚醒或按住說話                   | [語音喚醒](/zh-TW/platforms/mac/voicewake)                                                      |
| 使用 Canvas 和 Canvas 深層連結           | [Canvas](/zh-TW/platforms/mac/canvas)                                                             |
| 託管 PeekabooBridge 以進行 UI 自動化     | [Peekaboo 橋接器](/zh-TW/platforms/mac/peekaboo)                                                |
| 設定命令核准                             | [執行核准](/zh-TW/tools/exec-approvals)、[進階詳細資訊](/zh-TW/tools/exec-approvals-advanced) |
| 檢查 Mac 節點命令與 App IPC              | [macOS IPC](/zh-TW/platforms/mac/xpc)                                                             |
| 擷取日誌                                 | [macOS 記錄](/zh-TW/platforms/mac/logging)                                                       |
| 從原始碼建置                             | [macOS 開發環境設定](/zh-TW/platforms/mac/dev-setup)                                             |

## 相關內容

- [平台](/zh-TW/platforms)
- [開始使用](/zh-TW/start/getting-started)
- [閘道](/zh-TW/gateway)
- [執行核准](/zh-TW/tools/exec-approvals)

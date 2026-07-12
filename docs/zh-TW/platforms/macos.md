---
read_when:
    - 安裝 macOS App
    - 在 macOS 上選擇本機或遠端閘道模式
    - 尋找 macOS 應用程式版本下載檔案
summary: 安裝並使用 OpenClaw macOS 選單列 App
title: macOS 應用程式
x-i18n:
    generated_at: "2026-07-12T14:39:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f15d0840b7ceb8ac4d82f2c67c060c4b7e8bd25cbb12c216b93be31cb2604b0
    source_path: platforms/macos.md
    workflow: 16
---

macOS App 是 OpenClaw 的**選單列輔助程式**：提供原生系統匣使用者介面、macOS
權限提示、通知、WebChat、語音輸入、Canvas，以及
`system.run` 等由 Mac 主機提供的節點工具。

只需要命令列介面和閘道嗎？請從[開始使用](/zh-TW/start/getting-started)開始。

## 下載

請從 [OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases) 取得 macOS App 組建版本。
當某個版本包含 macOS App 資產時，請尋找：

- `OpenClaw-<version>.dmg`（建議）
- `OpenClaw-<version>.zip`

有些版本只提供命令列介面、證明資料或 Windows 資產。如果最新版本
沒有 macOS App 資產，請使用最新且包含該資產的版本，或依照
[macOS 開發環境設定](/zh-TW/platforms/mac/dev-setup)從原始碼組建。

## 首次執行

1. 安裝並啟動 **OpenClaw.app**。
2. 選擇 **This Mac** 以使用本機閘道，或連線至遠端閘道。
3. 本機模式：等待 App 安裝其使用者空間執行階段和閘道。
4. 透過即時模型檢查建立推論能力。檢查通過後，Crestodian
   會處理其餘設定。
5. 完成 macOS 權限檢查清單，並傳送新手引導測試訊息。

如果 App 連線至現有閘道，且其預設代理程式已設定
模型，App 會將該閘道視為已完成設定、略過供應商新手引導和
Crestodian，並開啟儀表板。如果無法連線至閘道，或其
預設代理程式沒有模型，仍可使用推論新手引導進行
復原。

若要使用命令列介面／閘道設定流程，請參閱[開始使用](/zh-TW/start/getting-started)。
若要復原權限，請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。

## 更新

儀表板的更新卡片會先透過 Sparkle 更新已簽署的 macOS App。
App 重新啟動後，會自動更新並重新啟動由 App 管理且版本相符的
本機閘道。Homebrew 和其他由使用者管理的命令列介面安裝項目會保留
一般閘道更新流程（卡片會直接執行閘道更新），
且自動修復絕不會將較新的閘道降級，也不會覆寫
`extended-stable` 頻道固定設定。

Sparkle 會遵循閘道的 `update.channel` 設定。`beta` 和 `dev` 會選擇加入
Beta App 組建版本；`stable`、`extended-stable`，以及缺少或無法辨識的值
都會繼續使用穩定版 App 組建版本。

## 開啟儀表板連結

在 macOS App 的內嵌儀表板中，按一下外部網頁連結會在可調整大小的瀏覽器側邊欄中開啟。每個連結都會在自己的分頁中開啟；再次按一下相同連結會重複使用其現有分頁。拖曳分頁可重新排序，使用分頁關閉按鈕或滑鼠中鍵按一下可將其關閉，並以滑鼠右鍵按一下分頁來使用 **Open in Default Browser**、**Copy Link**、**Reload**、**Close Tab** 和 **Close Other Tabs**。視窗標題列的上一頁／下一頁控制項和觸控式軌跡板滑動手勢可瀏覽儀表板歷程；側邊欄本身的上一頁／下一頁控制項則瀏覽使用中分頁的歷程。側邊欄也提供重新載入、在預設瀏覽器中開啟及關閉控制項，並會記住其寬度。

標題列控制項會配合 App 側邊欄：展開時，上一頁／下一頁控制項會位於其右側邊緣，緊鄰側邊欄切換按鈕；收合時，這些控制項會讓位給搜尋按鈕（開啟命令選擇區）和新增工作階段按鈕。

以滑鼠右鍵按一下外部連結，即可選擇 **Open in Sidebar**、**Open in Default Browser** 或 **Copy Link**。從儀表板進行的輔助鍵點按，以及由使用者啟動的新視窗連結，仍會在預設瀏覽器中開啟；側邊欄內的新視窗連結則會以新的側邊欄分頁開啟。在一般瀏覽器中代管的 Control UI 頁面，會保留瀏覽器正常的連結和快顯功能表行為。

## 匯入瀏覽器登入資訊

當 App 使用本機閘道執行，且 Mac 上存在具有 Cookie 的 Chrome 系列設定檔時，儀表板視窗會顯示可關閉的橫幅，讓你將這些 Cookie 複製到代理程式瀏覽網頁時使用的隔離式受管理設定檔。從橫幅的 **Import** 控制項選擇設定檔（可能需要 Touch ID）；進度和匯入的 Cookie 數量會顯示在原處，而且只會複製 Cookie——密碼絕不會離開來源瀏覽器。關閉橫幅會記錄此選擇；你隨時都能透過 **Settings → General → Browser login → Import…** 再次使用此功能。請參閱[瀏覽器](/zh-TW/cli/browser)，以瞭解底層匯入流程和 `browser.allowSystemProfileImport` 閘門。

## 選擇閘道模式

| 模式   | 適用情況                                                                    | 詳細資訊頁面                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 本機  | 這台 Mac 應執行閘道，並透過 launchd 使其保持運作。                | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway) |
| 遠端 | 由另一台主機執行閘道；這台 Mac 透過 SSH、LAN 或 Tailnet 控制它。 | [遠端控制](/zh-TW/platforms/mac/remote)            |

本機模式需要已安裝 `openclaw` 命令列介面。在全新的 Mac 上，App 會在啟動閘道精靈前
自動安裝相符的命令列介面和執行階段。
若要手動復原，請參閱 [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)。

## App 負責的項目

- 選單列狀態、通知、健康狀態和 WebChat。
- 螢幕、麥克風、語音、自動化和輔助使用等 macOS 權限提示。
- 本機節點工具：Canvas、相機／螢幕擷取、通知和 `system.run`。
- 由 Mac 主機執行的命令之執行核准提示。
- 遠端模式 SSH 通道或直接閘道連線。

App **不會**取代閘道或一般命令列介面文件。閘道
設定、供應商、外掛、頻道、工具和安全性各有
專屬文件。

## macOS 詳細資訊頁面

| 工作                                     | 閱讀                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| 安裝命令列介面／閘道服務或進行偵錯 | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway)                                          |
| 避免將狀態存放在雲端同步資料夾中   | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 對 App 探索和連線能力進行偵錯     | [macOS 上的閘道](/zh-TW/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| 瞭解 launchd 行為              | [閘道生命週期](/zh-TW/platforms/mac/child-process)                                           |
| 修正權限或簽署／TCC 問題    | [macOS 權限](/zh-TW/platforms/mac/permissions)                                             |
| 偵測你最近使用的 Mac    | [使用中電腦上線狀態](/zh-TW/nodes/presence)                                                 |
| 連線至遠端閘道              | [遠端控制](/zh-TW/platforms/mac/remote)                                                     |
| 查看選單列狀態和健康檢查   | [選單列](/zh-TW/platforms/mac/menu-bar)、[健康檢查](/zh-TW/platforms/mac/health)                 |
| 使用內嵌聊天使用者介面                 | [WebChat](/zh-TW/platforms/mac/webchat)                                                           |
| 使用語音喚醒或按鍵說話           | [語音喚醒](/zh-TW/platforms/mac/voicewake)                                                      |
| 使用 Canvas 和 Canvas 深層連結         | [Canvas](/zh-TW/platforms/mac/canvas)                                                             |
| 代管 PeekabooBridge 以進行使用者介面自動化    | [Peekaboo bridge](/zh-TW/platforms/mac/peekaboo)                                                  |
| 設定命令核准              | [執行核准](/zh-TW/tools/exec-approvals)、[進階詳細資訊](/zh-TW/tools/exec-approvals-advanced) |
| 檢查 Mac 節點命令和 App IPC    | [macOS IPC](/zh-TW/platforms/mac/xpc)                                                             |
| 擷取記錄                             | [macOS 記錄](/zh-TW/platforms/mac/logging)                                                     |
| 從原始碼組建                        | [macOS 開發環境設定](/zh-TW/platforms/mac/dev-setup)                                                 |

## 相關內容

- [平台](/zh-TW/platforms)
- [開始使用](/zh-TW/start/getting-started)
- [閘道](/zh-TW/gateway)
- [執行核准](/zh-TW/tools/exec-approvals)

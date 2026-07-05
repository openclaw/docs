---
read_when: Finding which docs page covers a topic before reading the page
summary: 產生的 OpenClaw 文件頁面標題對照表
title: 文件地圖
x-i18n:
    generated_at: "2026-07-05T17:40:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4af75a74a5b070b8d87d5cb21d45ae53aed8db9015b36e588e9b66e5e6d03438
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw 文件地圖

此檔案是由 `docs/**/*.md` 和 `docs/**/*.mdx` 標題產生，用來協助代理程式瀏覽文件樹。
請勿手動編輯；請執行 `pnpm docs:map:gen`。

## agent-runtime-architecture.md

- 路由：/agent-runtime-architecture
- 標題：
  - H2：執行階段版面配置
  - H2：邊界
  - H2：清單
  - H2：執行階段選擇
  - H2：相關內容

## announcements/bluebubbles-imessage.md

- 路由：/announcements/bluebubbles-imessage
- 標題：
  - H1：BlueBubbles 移除與 imsg iMessage 路徑
  - H2：變更內容
  - H2：該怎麼做
  - H2：遷移注意事項
  - H2：另請參閱

## auth-credential-semantics.md

- 路由：/auth-credential-semantics
- 標題：
  - H2：穩定探測原因代碼
  - H2：權杖憑證
  - H3：資格規則
  - H3：解析規則
  - H2：代理程式副本可攜性
  - H2：僅設定的驗證路由
  - H2：明確驗證順序篩選
  - H2：探測目標解析
  - H2：外部命令列介面憑證探索
  - H2：OAuth SecretRef 政策防護
  - H2：舊版相容訊息
  - H2：相關內容

## automation/auth-monitoring.md

- 路由：/automation/auth-monitoring
- 標題：
  - H2：相關內容

## automation/clawflow.md

- 路由：/automation/clawflow
- 標題：
  - H2：相關內容

## automation/cron-jobs.md

- 路由：/automation/cron-jobs
- 標題：
  - H2：快速開始
  - H2：排程如何運作
  - H2：排程類型
  - H3：月份日期與星期幾使用 OR 邏輯
  - H2：承載資料
  - H3：代理程式回合選項
  - H3：命令承載資料
  - H2：執行樣式
  - H2：交付與輸出
  - H3：失敗通知
  - H3：輸出語言
  - H2：命令列介面範例
  - H2：管理作業
  - H2：網路鉤子
  - H3：驗證
  - H2：Gmail PubSub 整合
  - H3：精靈設定（建議）
  - H3：閘道自動啟動
  - H3：手動一次性設定
  - H3：Gmail 模型覆寫
  - H2：設定
  - H2：疑難排解
  - H3：命令階梯
  - H2：相關內容

## automation/cron-vs-heartbeat.md

- 路由：/automation/cron-vs-heartbeat
- 標題：
  - H2：相關內容

## automation/gmail-pubsub.md

- 路由：/automation/gmail-pubsub
- 標題：
  - H2：相關內容

## automation/hooks.md

- 路由：/automation/hooks
- 標題：
  - H2：選擇正確介面
  - H2：快速開始
  - H2：事件類型
  - H2：撰寫掛鉤
  - H3：掛鉤結構
  - H3：HOOK.md 格式
  - H3：處理常式實作
  - H3：事件情境重點
  - H2：掛鉤探索
  - H3：掛鉤套件
  - H2：內建掛鉤
  - H3：session-memory 詳細資訊
  - H3：bootstrap-extra-files 設定
  - H3：command-logger 詳細資訊
  - H3：compaction-notifier 詳細資訊
  - H3：boot-md 詳細資訊
  - H2：外掛掛鉤
  - H2：設定
  - H2：命令列介面參考
  - H2：最佳實務
  - H2：疑難排解
  - H3：未探索到掛鉤
  - H3：掛鉤不符合資格
  - H3：掛鉤未執行
  - H2：相關內容

## automation/index.md

- 路由：/automation
- 標題：
  - H2：快速決策指南
  - H3：排程任務（排程）與心跳偵測
  - H2：核心概念
  - H3：排程任務（排程）
  - H3：任務
  - H3：推斷承諾
  - H3：Task Flow
  - H3：常設指令
  - H3：掛鉤
  - H3：心跳偵測
  - H2：它們如何協同運作
  - H2：相關內容

## automation/poll.md

- 路由：/automation/poll
- 標題：
  - H2：相關內容

## automation/standing-orders.md

- 路由：/automation/standing-orders
- 標題：
  - H2：為何使用常設指令
  - H2：它們如何運作
  - H2：常設指令的結構
  - H2：常設指令加排程作業
  - H2：範例
  - H3：範例 1：內容與社群媒體（每週循環）
  - H3：範例 2：財務營運（事件觸發）
  - H3：範例 3：監控與警示（持續）
  - H2：執行、驗證、回報模式
  - H2：多程式架構
  - H2：最佳實務
  - H3：該做
  - H3：避免
  - H2：相關內容

## automation/taskflow.md

- 路由：/automation/taskflow
- 標題：
  - H2：何時使用 Task Flow
  - H2：同步模式
  - H3：受管理模式
  - H3：鏡像模式
  - H2：流程狀態
  - H2：持久狀態與修訂追蹤
  - H2：取消行為
  - H2：命令列介面命令
  - H2：可靠的排程工作流程模式
  - H2：流程與任務的關係
  - H2：相關內容

## automation/tasks.md

- 路由：/automation/tasks
- 標題：
  - H2：重點摘要
  - H2：快速開始
  - H2：什麼會建立任務
  - H2：任務生命週期
  - H2：交付與通知
  - H3：通知政策
  - H2：命令列介面參考
  - H2：聊天任務看板（/tasks）
  - H2：狀態整合（任務壓力）
  - H2：儲存與維護
  - H3：任務所在位置
  - H3：自動維護
  - H2：任務與其他系統的關係
  - H2：相關內容

## automation/troubleshooting.md

- 路由：/automation/troubleshooting
- 標題：
  - H2：相關內容

## automation/webhook.md

- 路由：/automation/webhook
- 標題：
  - H2：相關內容

## brave-search.md

- 路由：/brave-search
- 標題：
  - H2：相關內容

## channels/access-groups.md

- 路由：/channels/access-groups
- 標題：
  - H2：靜態訊息傳送者群組
  - H2：從允許清單參照群組
  - H2：支援的訊息通道路徑
  - H2：Discord 頻道受眾
  - H2：外掛診斷
  - H2：安全性注意事項
  - H2：疑難排解

## channels/ambient-room-events.md

- 路由：/channels/ambient-room-events
- 標題：
  - H2：建議設定
  - H2：變更內容
  - H2：Discord 範例
  - H2：Slack 範例
  - H2：Telegram 範例
  - H2：代理程式特定政策
  - H2：可見回覆模式
  - H2：歷史
  - H2：疑難排解
  - H2：相關內容

## channels/bot-loop-protection.md

- 路由：/channels/bot-loop-protection
- 標題：
  - H2：預設值
  - H2：設定共用預設值
  - H2：依頻道、帳戶或聊天室覆寫
  - H2：頻道支援

## channels/broadcast-groups.md

- 路由：/channels/broadcast-groups
- 標題：
  - H2：概覽
  - H2：設定
  - H3：基本設定
  - H3：處理策略
  - H3：完整範例
  - H2：運作方式
  - H3：訊息流程
  - H3：工作階段隔離
  - H3：範例：隔離工作階段
  - H2：使用案例
  - H2：最佳實務
  - H2：相容性
  - H3：提供者
  - H3：路由
  - H2：疑難排解
  - H2：範例
  - H2：API 參考
  - H3：設定結構描述
  - H3：欄位
  - H2：限制
  - H2：相關內容

## channels/channel-routing.md

- 路由：/channels/channel-routing
- 標題：
  - H1：頻道與路由
  - H2：關鍵術語
  - H2：傳出目標前綴
  - H2：工作階段鍵形狀（範例）
  - H2：主要私訊路由固定
  - H2：受保護的傳入記錄
  - H2：路由規則（如何選擇代理程式）
  - H2：廣播群組（執行多個代理程式）
  - H2：設定概覽
  - H2：工作階段儲存
  - H2：WebChat 行為
  - H2：回覆情境
  - H2：相關內容

## channels/clickclack.md

- 路由：/channels/clickclack
- 標題：
  - H2：快速設定
  - H3：帳戶設定鍵
  - H2：多個 Bot
  - H2：回覆模式
  - H2：代理程式活動列
  - H2：目標
  - H2：權限
  - H2：疑難排解

## channels/discord.md

- 路由：/channels/discord
- 標題：
  - H2：快速設定
  - H2：建議：設定公會工作區
  - H2：執行階段模型
  - H2：論壇頻道
  - H2：互動元件
  - H2：存取控制與路由
  - H3：以角色為基礎的代理程式路由
  - H2：原生命令與命令驗證
  - H2：功能詳細資訊
  - H2：工具與動作門檻
  - H2：Components v2 UI
  - H2：語音
  - H3：語音頻道
  - H3：在語音中跟隨使用者
  - H3：語音訊息
  - H2：疑難排解
  - H2：設定參考
  - H2：安全與營運
  - H2：相關內容

## channels/feishu.md

- 路由：/channels/feishu
- 標題：
  - H2：快速開始
  - H2：存取控制
  - H3：直接訊息
  - H3：群組聊天
  - H2：群組設定範例
  - H3：允許所有群組，不需要 @mention
  - H3：允許所有群組，仍需 @mention
  - H3：僅允許特定群組
  - H3：限制群組內的傳送者
  - H2：取得群組/使用者 ID
  - H3：群組 ID（chatid，格式：ocxxx）
  - H3：使用者 ID（openid，格式：ouxxx）
  - H2：常用命令
  - H2：疑難排解
  - H3：Bot 在群組聊天中沒有回應
  - H3：Bot 未接收訊息
  - H3：QR 設定在 Feishu 行動應用程式中沒有反應
  - H3：App Secret 外洩
  - H2：進階設定
  - H3：多個帳戶
  - H3：訊息限制
  - H3：串流
  - H3：配額最佳化
  - H3：群組工作階段範圍與主題討論串
  - H3：Feishu 工作區工具
  - H3：ACP 工作階段
  - H4：持久 ACP 繫結
  - H4：從聊天產生 ACP
  - H3：多代理程式路由
  - H2：依使用者隔離代理程式（動態代理程式建立）
  - H3：快速設定
  - H3：運作方式
  - H3：設定選項
  - H3：工作階段範圍
  - H3：典型多使用者部署
  - H3：驗證
  - H3：注意事項
  - H2：設定參考
  - H2：支援的訊息類型
  - H3：接收
  - H3：傳送
  - H3：討論串與回覆
  - H2：相關內容

## channels/googlechat.md

- 路由：/channels/googlechat
- 標題：
  - H2：安裝
  - H2：快速設定（初學者）
  - H2：新增至 Google Chat
  - H2：公開 URL（僅網路鉤子）
  - H3：選項 A：Tailscale Funnel（建議）
  - H3：選項 B：反向代理（Caddy）
  - H3：選項 C：Cloudflare Tunnel
  - H2：運作方式
  - H2：目標
  - H2：設定重點
  - H2：疑難排解
  - H3：405 Method Not Allowed
  - H3：其他問題
  - H2：相關內容

## channels/group-messages.md

- 路由：/channels/group-messages
- 標題：
  - H2：行為
  - H2：設定範例（WhatsApp）
  - H3：啟用命令（僅擁有者）
  - H2：使用方式
  - H2：測試 / 驗證
  - H2：已知注意事項
  - H2：相關內容

## channels/groups.md

- 路由：/channels/groups
- 標題：
  - H2：初學者簡介（2 分鐘）
  - H2：可見回覆
  - H2：情境可見性與允許清單
  - H2：工作階段鍵
  - H2：模式：個人私訊 + 公開群組（單一代理程式）
  - H2：顯示標籤
  - H2：群組政策
  - H2：提及門檻（預設）
  - H2：限定提及模式範圍
  - H2：群組/頻道工具限制（選用）
  - H2：群組允許清單
  - H2：啟用（僅擁有者）
  - H2：情境欄位
  - H2：iMessage 特定事項
  - H2：WhatsApp 系統提示
  - H2：WhatsApp 特定事項
  - H2：相關內容

## channels/imessage-from-bluebubbles.md

- 路由：/channels/imessage-from-bluebubbles
- 標題：
  - H2：遷移檢查清單
  - H2：imsg 的功能
  - H2：開始之前
  - H2：設定轉換
  - H2：群組登錄陷阱
  - H2：逐步說明
  - H2：動作對等一覽
  - H2：配對、工作階段與 ACP 繫結
  - H2：沒有回復通道
  - H2：相關內容

## channels/imessage.md

- 路由：/channels/imessage
- 標題：
  - H2：快速設定
  - H2：需求與權限（macOS）
  - H2：啟用 imsg 私有 API
  - H3：設定
  - H3：當 SIP 保持啟用時
  - H2：存取控制與路由
  - H2：ACP 對話繫結
  - H2：部署模式
  - H2：媒體、分塊與交付目標
  - H2：私有 API 動作
  - H2：設定寫入
  - H2：合併分段傳送私訊（命令 + URL 在同一組合中）
  - H3：情境與代理程式看到的內容
  - H2：橋接或閘道重新啟動後的傳入復原
  - H3：操作員可見訊號
  - H3：遷移
  - H2：疑難排解
  - H2：設定參考指標
  - H2：相關內容

## channels/index.md

- 路由：/channels
- 標題：
  - H2：支援的頻道
  - H2：交付注意事項
  - H2：注意事項

## channels/irc.md

- 路由：/channels/irc
- 標題：
  - H2：快速開始
  - H2：連線設定
  - H2：安全性預設值
  - H2：存取控制
  - H3：常見陷阱：allowFrom 用於私訊，不是頻道
  - H2：回覆觸發（提及）
  - H2：安全性注意事項（建議用於公開頻道）
  - H3：頻道中每個人使用相同工具
  - H3：每位傳送者使用不同工具（擁有者擁有更多權限）
  - H2：NickServ
  - H2：環境變數
  - H2：疑難排解
  - H2：相關內容

## channels/line.md

- 路由：/channels/line
- 標題：
  - H2：安裝
  - H2：設定
  - H2：配置
  - H2：存取控制
  - H2：訊息行為
  - H2：頻道資料（豐富訊息）
  - H2：ACP 支援
  - H2：傳出媒體
  - H2：疑難排解
  - H2：相關

## channels/location.md

- 路由：/channels/location
- 標題：
  - H2：文字格式
  - H2：情境欄位
  - H2：頻道備註
  - H2：相關

## channels/matrix-migration.md

- 路由：/channels/matrix-migration
- 標題：
  - H2：遷移會自動執行的內容
  - H2：遷移無法自動執行的內容
  - H2：建議的升級流程
  - H2：加密遷移的運作方式
  - H2：常見訊息及其含義
  - H3：升級與偵測訊息
  - H3：加密狀態復原訊息
  - H3：手動復原訊息
  - H3：自訂外掛安裝訊息
  - H2：如果加密歷史記錄仍未恢復
  - H2：如果你想為未來訊息重新開始
  - H2：相關

## channels/matrix-presentation.md

- 路由：/channels/matrix-presentation
- 標題：
  - H2：事件內容
  - H2：備援行為
  - H2：支援的區塊
  - H2：互動
  - H2：與核准中繼資料的關係
  - H2：媒體訊息

## channels/matrix-push-rules.md

- 路由：/channels/matrix-push-rules
- 標題：
  - H2：先決條件
  - H2：步驟
  - H2：多 Bot 備註
  - H2：Homeserver 備註
  - H2：相關

## channels/matrix.md

- 路由：/channels/matrix
- 標題：
  - H2：安裝
  - H2：設定
  - H3：互動式設定
  - H3：最小配置
  - H3：自動加入
  - H3：允許清單目標格式
  - H3：帳號 ID 正規化
  - H3：快取的憑證
  - H3：環境變數
  - H2：配置範例
  - H2：串流預覽
  - H2：語音訊息
  - H2：核准中繼資料
  - H3：用於安靜完成預覽的自架推送規則
  - H2：Bot 對 Bot 房間
  - H2：加密與驗證
  - H3：啟用加密
  - H3：狀態與信任訊號
  - H3：使用復原金鑰驗證此裝置
  - H3：啟動或修復交叉簽署
  - H3：房間金鑰備份
  - H3：列出、請求與回應驗證
  - H3：多帳號備註
  - H2：個人檔案管理
  - H2：討論串
  - H3：工作階段路由（sessionScope）
  - H3：回覆討論串（threadReplies）
  - H3：討論串繼承與斜線命令
  - H2：ACP 對話綁定
  - H3：討論串綁定配置
  - H2：反應
  - H2：歷史情境
  - H2：情境可見性
  - H2：DM 與房間政策
  - H2：直接房間修復
  - H2：執行核准
  - H2：斜線命令
  - H2：多帳號
  - H2：私人/LAN homeserver
  - H2：代理 Matrix 流量
  - H2：目標解析
  - H2：配置參考
  - H3：帳號與連線
  - H3：加密
  - H3：存取與政策
  - H3：回覆行為
  - H3：反應設定
  - H3：工具與每房間覆寫
  - H3：執行核准設定
  - H2：相關

## channels/mattermost.md

- 路由：/channels/mattermost
- 標題：
  - H2：安裝
  - H2：快速設定
  - H2：原生命令
  - H2：環境變數（預設帳號）
  - H2：聊天模式
  - H2：討論串與工作階段
  - H2：存取控制（DM）
  - H2：頻道（群組）
  - H2：傳出傳遞目標
  - H2：DM 頻道重試
  - H2：預覽串流
  - H2：反應（訊息工具）
  - H2：互動式按鈕（訊息工具）
  - H3：直接 API 整合（外部指令碼）
  - H2：目錄介面卡
  - H2：多帳號
  - H2：疑難排解
  - H2：相關

## channels/msteams.md

- 路由：/channels/msteams
- 標題：
  - H2：內建外掛
  - H2：快速設定
  - H2：目標
  - H2：配置寫入
  - H2：存取控制（DM + 群組）
  - H3：運作方式
  - H3：步驟 1：建立 Azure Bot
  - H3：步驟 2：取得憑證
  - H3：步驟 3：配置訊息端點
  - H3：步驟 4：啟用 Teams 頻道
  - H3：步驟 5：建立 Teams 應用程式資訊清單
  - H3：步驟 6：配置 OpenClaw
  - H3：步驟 7：執行閘道
  - H2：同盟驗證（憑證加受控身分識別）
  - H3：選項 A：憑證型驗證
  - H3：選項 B：Azure 受控身分識別
  - H3：AKS 工作負載身分識別設定
  - H3：驗證類型比較
  - H2：本機開發（隧道）
  - H2：測試 Bot
  - H2：環境變數
  - H2：成員資訊動作
  - H2：歷史情境
  - H2：目前的 Teams RSC 權限（資訊清單）
  - H2：Teams 資訊清單範例（已遮蔽）
  - H3：資訊清單注意事項（必備欄位）
  - H3：更新現有應用程式
  - H2：功能：僅 RSC 與 Graph
  - H3：僅使用 Teams RSC（已安裝應用程式，無 Graph API 權限）
  - H3：使用 Teams RSC + Microsoft Graph 應用程式權限
  - H3：RSC 與 Graph API
  - H2：已啟用 Graph 的媒體 + 歷史記錄（頻道必需）
  - H2：已知限制
  - H3：網路鉤子逾時
  - H3：Teams 雲端與服務 URL 支援
  - H3：格式
  - H2：配置
  - H2：路由與工作階段
  - H2：回覆樣式：討論串與貼文
  - H3：解析優先順序
  - H3：討論串情境保留
  - H2：附件與影像
  - H2：在群組聊天中傳送檔案
  - H3：為什麼群組聊天需要 SharePoint
  - H3：設定
  - H3：分享行為
  - H3：備援行為
  - H3：檔案儲存位置
  - H2：投票（Adaptive Cards）
  - H2：呈現卡片
  - H2：目標格式
  - H2：主動訊息
  - H2：團隊與頻道 ID（常見陷阱）
  - H2：私人頻道
  - H2：疑難排解
  - H3：常見問題
  - H3：資訊清單上傳錯誤
  - H3：RSC 權限無法運作
  - H2：參考
  - H2：相關

## channels/nextcloud-talk.md

- 路由：/channels/nextcloud-talk
- 標題：
  - H2：安裝
  - H2：快速設定（初學者）
  - H2：備註
  - H2：存取控制（DM）
  - H2：房間（群組）
  - H2：功能
  - H2：配置參考（Nextcloud Talk）
  - H2：相關

## channels/nostr.md

- 路由：/channels/nostr
- 標題：
  - H2：安裝
  - H3：非互動式設定
  - H2：快速設定
  - H2：配置參考
  - H2：個人檔案中繼資料
  - H2：存取控制
  - H3：DM 政策
  - H3：允許清單範例
  - H2：金鑰格式
  - H2：中繼
  - H2：協定支援
  - H2：測試
  - H3：本機中繼
  - H3：手動測試
  - H2：疑難排解
  - H3：未收到訊息
  - H3：未傳送回應
  - H3：重複回應
  - H2：安全性
  - H2：限制（MVP）
  - H2：相關

## channels/pairing.md

- 路由：/channels/pairing
- 標題：
  - H2：1) DM 配對（傳入聊天存取）
  - H3：核准傳送者
  - H3：可重複使用的傳送者群組
  - H3：狀態所在位置
  - H2：2) 節點裝置配對（iOS/Android/macOS/無頭節點）
  - H3：從 Control UI 配對（建議）
  - H3：透過 Telegram 配對
  - H3：核准節點裝置
  - H3：選用受信任 CIDR 節點自動核准
  - H3：節點配對狀態儲存
  - H3：備註
  - H2：相關文件

## channels/qa-channel.md

- 路由：/channels/qa-channel
- 標題：
  - H2：功能說明
  - H2：配置
  - H2：執行器
  - H2：相關

## channels/qqbot.md

- 路由：/channels/qqbot
- 標題：
  - H2：安裝
  - H2：設定
  - H2：配置
  - H3：存取政策
  - H3：多帳號設定
  - H3：群組聊天
  - H3：語音（STT / TTS）
  - H2：目標格式
  - H2：斜線命令
  - H2：媒體與儲存
  - H2：疑難排解
  - H2：相關

## channels/raft.md

- 路由：/channels/raft
- 標題：
  - H2：安裝
  - H2：先決條件
  - H2：配置
  - H2：運作方式
  - H2：驗證
  - H2：疑難排解
  - H2：參考

## channels/signal.md

- 路由：/channels/signal
- 標題：
  - H2：號碼模型（請先閱讀）
  - H2：安裝
  - H2：快速設定
  - H2：它是什麼
  - H2：設定路徑 A：連結現有 Signal 帳號（QR）
  - H2：設定路徑 B：註冊專用 Bot 號碼（SMS，Linux）
  - H2：外部常駐程式模式（httpUrl）
  - H2：容器模式（bbernhard/signal-cli-rest-api）
  - H2：存取控制（DM + 群組）
  - H2：運作方式（行為）
  - H2：媒體 + 限制
  - H2：輸入中 + 已讀回條
  - H2：生命週期狀態反應
  - H2：反應（訊息工具）
  - H2：核准反應
  - H2：傳遞目標（命令列介面/排程）
  - H2：別名
  - H2：疑難排解
  - H2：安全性備註
  - H2：配置參考（Signal）
  - H2：相關

## channels/slack.md

- 路由：/channels/slack
- 標題：
  - H2：選擇傳輸
  - H3：中繼模式
  - H2：安裝
  - H2：快速設定
  - H2：Socket Mode 傳輸調校
  - H2：資訊清單與範圍檢查清單
  - H3：其他資訊清單設定
  - H2：權杖模型
  - H2：動作與閘門
  - H2：存取控制與路由
  - H2：討論串、工作階段與回覆標籤
  - H2：Ack 反應
  - H3：Emoji（ackReaction）
  - H3：範圍（messages.ackReactionScope）
  - H2：文字串流
  - H2：輸入中反應備援
  - H2：媒體、分塊與傳遞
  - H2：命令與斜線行為
  - H2：互動式回覆
  - H3：外掛擁有的 modal 提交
  - H2：Slack 中的原生核准
  - H2：事件與操作行為
  - H2：配置參考
  - H2：疑難排解
  - H2：附件視覺參考
  - H3：支援的媒體類型
  - H3：傳入管線
  - H3：討論串根附件繼承
  - H3：多附件處理
  - H3：大小、下載與模型限制
  - H3：已知限制
  - H3：相關文件
  - H2：相關

## channels/sms.md

- 路由：/channels/sms
- 標題：
  - H2：開始之前
  - H2：快速設定
  - H2：配置範例
  - H3：配置檔案
  - H3：環境變數
  - H3：SecretRef 驗證權杖
  - H3：Messaging Service 傳送者
  - H3：預設傳出目標
  - H2：存取控制
  - H2：傳送 SMS
  - H2：驗證設定
  - H3：從 macOS iMessage/SMS 進行端對端測試
  - H2：網路鉤子安全性
  - H2：多帳號配置
  - H2：疑難排解
  - H3：Twilio 傳回 403 或 OpenClaw 拒絕網路鉤子
  - H3：未出現配對請求
  - H3：傳出傳送失敗
  - H3：訊息抵達但代理未回應

## channels/synology-chat.md

- 路由：/channels/synology-chat
- 標題：
  - H2：安裝
  - H2：快速設定
  - H2：環境變數
  - H2：DM 政策與存取控制
  - H2：傳出傳遞
  - H2：多帳號
  - H2：安全性備註
  - H2：疑難排解
  - H2：相關

## channels/telegram.md

- 路由：/channels/telegram
- 標題：
  - H2：快速設定
  - H2：Telegram 端設定
  - H2：存取控制與啟用
  - H3：群組 Bot 身分
  - H2：執行階段行為
  - H2：功能參考
  - H2：錯誤回覆控制
  - H2：疑難排解
  - H2：配置參考
  - H2：相關

## channels/tlon.md

- 路由：/channels/tlon
- 標題：
  - H2：內建外掛
  - H2：設定
  - H2：私人/LAN ships
  - H2：群組頻道
  - H2：存取控制
  - H2：擁有者與核准系統
  - H2：自動接受設定
  - H2：透過 Urbit 設定儲存區熱重新載入
  - H2：傳遞目標（命令列介面/排程）
  - H2：內建 Skill
  - H2：功能
  - H2：疑難排解
  - H2：配置參考
  - H2：備註
  - H2：相關

## channels/troubleshooting.md

- 路由：/channels/troubleshooting
- 標題：
  - H2：命令階梯
  - H2：更新後
  - H2：WhatsApp
  - H3：WhatsApp 失敗特徵
  - H2：Telegram
  - H3：Telegram 失敗特徵
  - H2：Discord
  - H3：Discord 失敗特徵
  - H2：Slack
  - H3：Slack 失敗特徵
  - H2：iMessage
  - H3：iMessage 失敗特徵
  - H2：Signal
  - H3：Signal 失敗特徵
  - H2：QQ Bot
  - H3：QQ Bot 失敗特徵
  - H2：Matrix
  - H3：Matrix 失敗特徵
  - H2：相關

## channels/twitch.md

- 路由：/channels/twitch
- 標題：
  - H2：安裝
  - H2：快速設定
  - H2：它是什麼
  - H2：權杖重新整理（選用）
  - H2：多帳號支援
  - H2：存取控制
  - H2：疑難排解
  - H2：配置
  - H3：帳號配置
  - H3：提供者選項
  - H2：工具動作
  - H2：安全與維運
  - H2：限制
  - H2：相關

## channels/wechat.md

- 路由: /channels/wechat
- 標題:
  - H2: 命名
  - H2: 運作方式
  - H2: 安裝
  - H2: 登入
  - H2: 存取控制
  - H2: 相容性
  - H2: Sidecar 程序
  - H2: 疑難排解
  - H2: 相關文件

## channels/whatsapp.md

- 路由: /channels/whatsapp
- 標題:
  - H2: 安裝
  - H2: 快速設定
  - H2: 部署模式
  - H2: 執行階段模型
  - H2: 使用 MeowCaller 呼叫目前請求者（實驗性）
  - H2: 核准提示
  - H2: 外掛鉤子與隱私
  - H2: 存取控制與啟用
  - H2: 已設定的 ACP 繫結
  - H2: 個人號碼與自我聊天行為
  - H2: 訊息正規化與脈絡
  - H2: 傳遞、分段與媒體
  - H2: 回覆引用
  - H2: 反應層級
  - H2: 確認反應
  - H2: 生命週期狀態反應
  - H2: 多帳號與憑證
  - H2: 工具、動作與設定寫入
  - H2: 疑難排解
  - H2: 系統提示
  - H2: 設定參考指標
  - H2: 相關

## channels/yuanbao.md

- 路由: /channels/yuanbao
- 標題:
  - H2: 快速開始
  - H3: 互動式設定（替代方案）
  - H2: 存取控制
  - H3: 私訊
  - H3: 群組聊天
  - H2: 設定範例
  - H2: 常用命令
  - H2: 疑難排解
  - H2: 進階設定
  - H3: 多個帳號
  - H3: 訊息限制
  - H3: 串流
  - H3: 群組聊天歷史脈絡
  - H3: 回覆對象模式
  - H3: Markdown 提示注入
  - H3: 偵錯模式
  - H3: 多代理路由
  - H2: 設定參考
  - H2: 支援的訊息類型
  - H2: 相關

## channels/zalo.md

- 路由: /channels/zalo
- 標題:
  - H2: 內建外掛
  - H2: 快速設定
  - H2: 這是什麼
  - H2: 運作方式
  - H2: 限制
  - H2: 存取控制
  - H3: 私訊
  - H3: 群組
  - H2: 長輪詢與網路鉤子
  - H2: 支援的訊息類型
  - H2: 功能
  - H2: 傳遞目標（命令列介面/排程）
  - H2: 疑難排解
  - H2: 設定參考
  - H2: 相關

## channels/zaloclawbot.md

- 路由: /channels/zaloclawbot
- 標題:
  - H2: 相容性
  - H2: 先決條件
  - H2: 使用 onboard 安裝（建議）
  - H2: 手動安裝
  - H3: 1. 安裝外掛
  - H3: 2. 在設定中啟用外掛
  - H3: 3. 產生 QR code 並登入
  - H3: 4. 重新啟動閘道
  - H2: 運作方式
  - H2: 底層機制
  - H2: 疑難排解
  - H2: 相關

## channels/zalouser.md

- 路由: /channels/zalouser
- 標題:
  - H2: 安裝
  - H2: 快速設定
  - H2: 這是什麼
  - H2: 命名
  - H2: 尋找 ID（目錄）
  - H2: 限制
  - H2: 存取控制（私訊）
  - H2: 群組存取（選用）
  - H3: 群組提及門控
  - H2: 多帳號
  - H2: 環境變數
  - H2: 輸入狀態、反應與傳遞確認
  - H2: 疑難排解
  - H2: 相關

## ci.md

- 路由: /ci
- 標題:
  - H2: 管線概覽
  - H2: 快速失敗順序
  - H2: PR 脈絡與證據
  - H2: 範圍與路由
  - H2: ClawSweeper 活動轉送
  - H2: 手動派發
  - H2: 執行器
  - H2: 執行器註冊預算
  - H2: 本機對等項
  - H2: OpenClaw 效能
  - H2: 完整發行驗證
  - H2: 即時與 E2E 分片
  - H2: 套件驗收
  - H3: 作業
  - H3: 候選來源
  - H3: 套件設定檔
  - H3: 舊版相容視窗
  - H3: 範例
  - H2: 安裝煙霧測試
  - H2: 本機 Docker E2E
  - H3: 可調參數
  - H3: 可重用的即時/E2E 工作流程
  - H3: 發行路徑區塊
  - H2: 外掛預發行
  - H2: QA Lab
  - H2: CodeQL
  - H3: 安全性類別
  - H3: 平台特定安全性分片
  - H3: 關鍵品質類別
  - H2: 維護工作流程
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: 合併後的重複 PR
  - H2: 本機檢查門檻與變更路由
  - H2: Testbox 驗證
  - H2: 相關

## clawhub/cli.md

- 路由: /clawhub/cli
- 標題:
  - H1: ClawHub 命令列介面
  - H2: 探索與安裝
  - H3: 發行信任
  - H2: 發布與維護
  - H2: 相關

## clawhub/publishing.md

- 路由: /clawhub/publishing
- 標題:
  - H1: 在 ClawHub 上發布
  - H2: 擁有者
  - H2: Skills
  - H2: 外掛
  - H2: 發行流程
  - H2: 常見問題
  - H3: 套件範圍必須符合選取的擁有者

## cli/acp.md

- 路由: /cli/acp
- 標題:
  - H2: 這不是什麼
  - H2: 相容性矩陣
  - H2: 已知限制
  - H2: 使用方式
  - H2: ACP 用戶端（偵錯）
  - H2: 協定煙霧測試
  - H2: 如何使用這個
  - H2: 選取代理
  - H2: 從 acpx 使用（Codex、Claude、其他 ACP 用戶端）
  - H2: Zed 編輯器設定
  - H2: 工作階段對應
  - H2: 選項
  - H3: acp 用戶端選項
  - H2: 相關

## cli/agent.md

- 路由: /cli/agent
- 標題:
  - H1: openclaw agent
  - H2: 選項
  - H2: 範例
  - H2: 注意事項
  - H2: JSON 傳遞狀態
  - H2: 相關

## cli/agents.md

- 路由: /cli/agents
- 標題:
  - H1: openclaw agents
  - H2: 範例
  - H2: 命令介面
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents set-identity
  - H3: agents delete &lt;id&gt;
  - H2: 路由繫結
  - H3: --bind 格式
  - H3: 繫結範圍行為
  - H2: 身分檔案
  - H2: 設定身分
  - H2: 相關

## cli/approvals.md

- 路由: /cli/approvals
- 標題:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: 常用命令
  - H2: 從檔案取代核准
  - H2:「永不提示」/ YOLO 範例
  - H2: 允許清單輔助工具
  - H2: 常用選項
  - H2: 注意事項
  - H2: 相關

## cli/attach.md

- 路由: /cli/attach
- 標題: 無

## cli/backup.md

- 路由: /cli/backup
- 標題:
  - H1: openclaw backup
  - H2: 注意事項
  - H2: 備份內容
  - H2: 無效設定行為
  - H2: 大小與效能
  - H2: 相關

## cli/browser.md

- 路由: /cli/browser
- 標題:
  - H1: openclaw browser
  - H2: 常用旗標
  - H2: 快速開始（本機）
  - H2: 快速疑難排解
  - H2: 生命週期
  - H2: 如果命令遺失
  - H2: 設定檔
  - H2: 分頁
  - H2: 快照 / 螢幕擷取 / 動作
  - H2: 狀態與儲存
  - H2: 偵錯
  - H2: 透過 MCP 使用現有 Chrome
  - H2: 遠端瀏覽器控制（節點主機代理）
  - H2: 相關

## cli/channels.md

- 路由: /cli/channels
- 標題:
  - H1: openclaw channels
  - H2: 常用命令
  - H2: 狀態 / 功能 / 解析 / 日誌
  - H2: 新增 / 移除帳號
  - H2: 登入與登出（互動式）
  - H2: 疑難排解
  - H2: 功能探測
  - H2: 將名稱解析為 ID
  - H2: 相關

## cli/clawbot.md

- 路由: /cli/clawbot
- 標題:
  - H1: openclaw clawbot
  - H2: 遷移
  - H2: 相關

## cli/commitments.md

- 路由: /cli/commitments
- 標題:
  - H2: 使用方式
  - H2: 選項
  - H2: 範例
  - H2: 輸出
  - H2: 相關

## cli/completion.md

- 路由: /cli/completion
- 標題:
  - H1: openclaw completion
  - H2: 使用方式
  - H2: 選項
  - H2: 安裝流程
  - H2: 注意事項
  - H2: 相關

## cli/config.md

- 路由: /cli/config
- 標題:
  - H2: 根選項
  - H2: 範例
  - H3: 路徑
  - H3: config get
  - H3: config file
  - H3: config schema
  - H3: config validate
  - H2: 值
  - H2: config set 模式
  - H3: 提供者建構器旗標
  - H2: config patch
  - H2: 試執行
  - H3: JSON 輸出形狀
  - H2: 套用變更
  - H2: 寫入安全性
  - H2: 修復迴圈
  - H2: 相關

## cli/configure.md

- 路由: /cli/configure
- 標題:
  - H1: openclaw configure
  - H2: 選項
  - H2: 模型區段
  - H2: Web 區段
  - H2: 其他注意事項
  - H2: 相關

## cli/crestodian.md

- 路由: /cli/crestodian
- 標題:
  - H1: openclaw crestodian
  - H2: 啟動時機
  - H2: Crestodian 顯示的內容
  - H2: 範例
  - H2: 操作與核准
  - H2: 設定啟動程序
  - H2: 模型輔助規劃器
  - H3: 命令列介面測試框架信任模型
  - H2: 切換到代理
  - H2: 訊息救援模式
  - H2: 相關

## cli/cron.md

- 路由: /cli/cron
- 標題:
  - H1: openclaw cron
  - H2: 快速建立工作
  - H2: 工作階段
  - H2: 傳遞
  - H3: 傳遞所有權
  - H3: 失敗傳遞
  - H2: 排程
  - H3: 一次性工作
  - H3: 重複工作
  - H3: 手動執行
  - H2: 模型
  - H3: 隔離排程模型優先順序
  - H3: 快速模式
  - H3: 即時模型切換重試
  - H2: 執行輸出與拒絕
  - H3: 過期確認抑制
  - H3: 靜默權杖抑制
  - H3: 結構化拒絕
  - H2: 保留
  - H2: 遷移較舊工作
  - H2: 常見編輯
  - H2: 常見管理命令
  - H2: 相關

## cli/daemon.md

- 路由: /cli/daemon
- 標題:
  - H1: openclaw daemon
  - H2: 使用方式
  - H2: 子命令與選項
  - H2: 注意事項
  - H2: 相關

## cli/dashboard.md

- 路由: /cli/dashboard
- 標題:
  - H1: openclaw dashboard
  - H2: 相關

## cli/devices.md

- 路由: /cli/devices
- 標題:
  - H1: openclaw devices
  - H2: 常用選項
  - H2: 命令
  - H3: openclaw devices list
  - H3: openclaw devices approve [requestId] [--latest]
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: 注意事項
  - H2: 權杖漂移復原檢查清單
  - H2: Paperclip / openclawgateway 首次執行核准
  - H2: 相關

## cli/directory.md

- 路由: /cli/directory
- 標題:
  - H1: openclaw directory
  - H2: 常用旗標
  - H2: 注意事項
  - H2: 將結果用於訊息傳送
  - H2: 依頻道劃分的 ID 格式
  - H2: 自我（「me」）
  - H2: 對等方（聯絡人/使用者）
  - H2: 群組
  - H2: 相關

## cli/dns.md

- 路由: /cli/dns
- 標題:
  - H1: openclaw dns
  - H2: dns 設定
  - H2: 相關

## cli/docs.md

- 路由: /cli/docs
- 標題:
  - H1: openclaw docs
  - H2: 使用方式
  - H2: 範例
  - H2: 運作方式
  - H2: 輸出
  - H2: 結束代碼
  - H2: 相關

## cli/doctor.md

- 路由: /cli/doctor
- 標題:
  - H1: openclaw doctor
  - H2: 姿態
  - H2: 範例
  - H2: 選項
  - H2: Lint 模式
  - H2: 結構化健康檢查
  - H2: 檢查選取
  - H2: 升級後模式
  - H2: 注意事項
  - H2: macOS: launchctl env 覆寫
  - H2: 相關

## cli/flows.md

- 路由: /cli/flows
- 標題:
  - H1: openclaw tasks flow
  - H2: 子命令
  - H3: 狀態篩選值
  - H2: 範例
  - H2: 相關

## cli/gateway.md

- 路由: /cli/gateway
- 標題:
  - H2: 執行閘道
  - H3: 選項
  - H2: 重新啟動閘道
  - H3: 閘道效能分析
  - H2: 查詢執行中的閘道
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: 透過 SSH 遠端使用（與 Mac 應用程式一致）
  - H3: gateway call &lt;method&gt;
  - H2: 管理閘道服務
  - H3: 使用包裝器安裝
  - H2: 探索閘道（Bonjour）
  - H3: gateway discover
  - H2: 相關

## cli/health.md

- 路由: /cli/health
- 標題:
  - H1: openclaw health
  - H2: 選項
  - H2: 行為
  - H2: 相關

## cli/hooks.md

- 路由: /cli/hooks
- 標題:
  - H1: openclaw hooks
  - H2: 列出鉤子
  - H2: 取得鉤子資訊
  - H2: 檢查資格
  - H2: 啟用鉤子
  - H2: 停用鉤子
  - H2: 安裝與更新鉤子套件
  - H2: 內建鉤子
  - H3: command-logger 日誌檔
  - H2: 注意事項
  - H2: 相關

## cli/index.md

- 路由: /cli
- 標題:
  - H2: 命令頁面
  - H2: 全域旗標
  - H2: 輸出模式
  - H2: 調色盤
  - H2: 命令樹
  - H2: 聊天斜線命令
  - H2: 使用情況追蹤
  - H2: 相關

## cli/infer.md

- 路由: /cli/infer
- 標題:
  - H2: 將 infer 轉成 skill
  - H2: 命令樹
  - H2: 常見工作
  - H2: 行為
  - H2: 模型
  - H2: 圖片
  - H2: 音訊
  - H2: TTS
  - H2: 影片
  - H2: Web
  - H2: Embedding
  - H2: JSON 輸出
  - H2: 常見陷阱
  - H2: 相關

## cli/logs.md

- 路由：/cli/logs
- 標題：
  - H1: openclaw logs
  - H2: 選項
  - H2: 共用閘道 RPC 選項
  - H2: 範例
  - H2: 後援與復原行為
  - H2: 相關

## cli/mcp.md

- 路由：/cli/mcp
- 標題：
  - H2: 選擇正確的 MCP 路徑
  - H2: OpenClaw 作為 MCP 伺服器
  - H3: 何時使用 serve
  - H3: 運作方式
  - H3: 選擇用戶端模式
  - H3: serve 暴露的內容
  - H3: 用法
  - H3: 橋接工具
  - H3: 事件模型
  - H3: Claude 頻道通知
  - H3: MCP 用戶端設定
  - H3: 選項
  - H3: 安全與信任邊界
  - H3: 測試
  - H3: 疑難排解
  - H2: OpenClaw 作為 MCP 用戶端登錄檔
  - H3: 已儲存的 MCP 伺服器定義
  - H3: 常見伺服器配方
  - H3: JSON 輸出形狀
  - H3: Stdio 傳輸
  - H3: SSE / HTTP 傳輸
  - H3: OAuth 工作流程
  - H3: 可串流 HTTP 傳輸
  - H2: 控制介面
  - H2: 目前限制
  - H2: 相關

## cli/memory.md

- 路由：/cli/memory
- 標題：
  - H1: openclaw memory
  - H2: memory status
  - H2: memory index
  - H2: memory search
  - H2: memory promote
  - H2: memory promote-explain
  - H2: memory rem-harness
  - H2: memory rem-backfill
  - H2: 夢境整理
  - H2: SecretRef 閘道相依性
  - H2: 相關

## cli/message.md

- 路由：/cli/message
- 標題：
  - H1: openclaw message
  - H2: 頻道選擇
  - H2: 目標格式（-t, --target）
  - H2: 常用旗標
  - H2: SecretRef 解析
  - H2: 動作
  - H3: 核心
  - H3: 傳送
  - H3: 輪詢
  - H3: 執行緒
  - H3: 表情符號
  - H3: 貼圖
  - H3: 角色、頻道、語音、事件（Discord）
  - H3: 管理（Discord）
  - H3: 廣播
  - H2: 相關

## cli/migrate.md

- 路由：/cli/migrate
- 標題：
  - H1: openclaw migrate
  - H2: 命令
  - H2: 安全模型
  - H2: Claude 提供者
  - H3: Claude 匯入的內容
  - H3: 封存與手動審查狀態
  - H2: Codex 提供者
  - H3: Codex 匯入的內容
  - H3: 手動審查 Codex 狀態
  - H2: Hermes 提供者
  - H3: Hermes 匯入的內容
  - H3: 支援的 .env 鍵
  - H3: 僅封存狀態
  - H3: 套用後
  - H2: 外掛契約
  - H2: 新手導入整合
  - H2: 相關

## cli/models.md

- 路由：/cli/models
- 標題：
  - H1: openclaw models
  - H2: 常用命令
  - H3: 狀態
  - H3: 清單
  - H3: 設定預設 / 影像模型
  - H3: 掃描
  - H2: 別名
  - H2: 後援
  - H2: 驗證設定檔
  - H2: 相關

## cli/node.md

- 路由：/cli/node
- 標題：
  - H1: openclaw node
  - H2: 為什麼使用節點主機？
  - H2: 瀏覽器代理（零設定）
  - H2: 執行（前景）
  - H2: 節點主機的閘道驗證
  - H2: 服務（背景）
  - H2: 配對
  - H2: 執行核准
  - H2: 相關

## cli/nodes.md

- 路由：/cli/nodes
- 標題：
  - H1: openclaw nodes
  - H2: 狀態
  - H2: 配對
  - H2: 呼叫
  - H2: 通知、推播、位置、螢幕
  - H2: 相關

## cli/onboard.md

- 路由：/cli/onboard
- 標題：
  - H1: openclaw onboard
  - H2: 範例
  - H2: 重設
  - H2: 語系
  - H2: 非互動式設定
  - H3: 閘道驗證（非互動式）
  - H3: 本機閘道健康狀態
  - H3: 互動式 ref 模式
  - H3: Z.AI 端點選擇
  - H2: 其他非互動式旗標
  - H2: 提供者預先篩選
  - H2: 網路搜尋後續追蹤
  - H2: 其他行為
  - H2: 常見後續命令

## cli/pairing.md

- 路由：/cli/pairing
- 標題：
  - H1: openclaw pairing
  - H2: 命令
  - H2: pairing list
  - H2: pairing approve
  - H3: 擁有者啟動設定
  - H2: 相關

## cli/path.md

- 路由：/cli/path
- 標題：
  - H1: openclaw path
  - H2: 為什麼使用它
  - H2: 使用方式
  - H2: 運作方式
  - H2: 子命令
  - H2: 全域旗標
  - H2: oc:// 語法
  - H2: 依檔案種類定址
  - H2: 變更契約
  - H2: 範例
  - H2: 依檔案種類的配方
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: 子命令參考
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: 結束代碼
  - H2: 輸出模式
  - H2: 備註
  - H2: 相關

## cli/plugins.md

- 路由：/cli/plugins
- 標題：
  - H2: 命令
  - H2: 作者
  - H3: 提供者鷹架
  - H2: 安裝
  - H3: Marketplace 簡寫
  - H2: 清單
  - H3: 外掛索引
  - H2: 解除安裝
  - H2: 更新
  - H2: 檢查
  - H2: Doctor
  - H2: 登錄檔
  - H2: Marketplace
  - H2: 相關

## cli/policy.md

- 路由：/cli/policy
- 標題：
  - H1: openclaw policy
  - H2: 快速開始
  - H3: 政策規則參考
  - H4: 範圍限定的覆疊
  - H4: 頻道
  - H4: MCP 伺服器
  - H4: 模型提供者
  - H4: 網路
  - H4: 入口與頻道存取
  - H4: 閘道
  - H4: Agent 工作區
  - H4: 沙盒態勢
  - H4: 資料處理
  - H4: Secrets
  - H4: 執行核准
  - H4: 驗證設定檔
  - H4: 工具中繼資料
  - H4: 工具態勢
  - H2: 執行檢查
  - H2: 設定政策
  - H2: 接受政策狀態
  - H2: 發現項目
  - H2: 修復
  - H2: 結束代碼
  - H2: 相關

## cli/proxy.md

- 路由：/cli/proxy
- 標題：
  - H1: openclaw proxy
  - H2: 驗證
  - H3: 選項
  - H2: 偵錯代理
  - H2: 相關

## cli/qr.md

- 路由：/cli/qr
- 標題：
  - H1: openclaw qr
  - H2: 選項
  - H2: 設定碼內容
  - H2: 閘道 URL 解析
  - H2: 驗證解析（無 --remote）
  - H2: 驗證解析（--remote）
  - H2: 相關

## cli/reset.md

- 路由：/cli/reset
- 標題：
  - H1: openclaw reset
  - H2: 選項
  - H2: 範圍
  - H2: 備註
  - H2: 相關

## cli/sandbox.md

- 路由：/cli/sandbox
- 標題：
  - H2: 命令
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H3: openclaw sandbox explain
  - H2: 為什麼需要重新建立
  - H2: 常見觸發條件
  - H2: 登錄檔遷移
  - H2: 設定
  - H2: 相關

## cli/secrets.md

- 路由：/cli/secrets
- 標題：
  - H1: openclaw secrets
  - H2: 重新載入執行階段快照
  - H2: 稽核
  - H2: 設定（互動式輔助工具）
  - H3: 執行提供者安全性
  - H2: 套用已儲存的計畫
  - H3: 為什麼沒有復原備份
  - H2: 範例
  - H2: 相關

## cli/security.md

- 路由：/cli/security
- 標題：
  - H1: openclaw security
  - H2: 稽核模式
  - H2: 檢查內容
  - H2: SecretRef 行為
  - H2: 抑制
  - H2: JSON 輸出
  - H2: --fix 變更的內容
  - H2: 相關

## cli/sessions.md

- 路由：/cli/sessions
- 標題：
  - H1: openclaw sessions
  - H2: 尾隨軌跡進度
  - H2: 匯出軌跡套件
  - H2: 清理維護
  - H2: 壓縮工作階段
  - H3: sessions.compact RPC
  - H2: 相關

## cli/setup.md

- 路由：/cli/setup
- 標題：
  - H1: openclaw setup
  - H2: 選項
  - H3: 基準模式
  - H2: 範例
  - H2: 備註
  - H2: 相關

## cli/skills.md

- 路由：/cli/skills
- 標題：
  - H1: openclaw skills
  - H2: 命令
  - H2: Skill Workshop
  - H2: 相關

## cli/status.md

- 路由：/cli/status
- 標題：
  - H2: 工作階段與模型解析
  - H2: 使用量與配額
  - H2: 概覽與更新狀態
  - H2: Secrets
  - H2: 記憶
  - H2: 相關

## cli/system.md

- 路由：/cli/system
- 標題：
  - H1: openclaw system
  - H2: 常用命令
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: 備註
  - H2: 相關

## cli/tasks.md

- 路由：/cli/tasks
- 標題：
  - H2: 用法
  - H2: 根選項
  - H2: 子命令
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: 相關

## cli/transcripts.md

- 路由：/cli/transcripts
- 標題：
  - H1: openclaw transcripts
  - H2: 命令
  - H2: 輸出
  - H2: 每天多個工作階段
  - H2: 缺少摘要
  - H2: 設定

## cli/tui.md

- 路由：/cli/tui
- 標題：
  - H1: openclaw tui
  - H2: 選項
  - H2: 備註
  - H2: 範例
  - H2: 設定修復迴圈
  - H2: 相關

## cli/uninstall.md

- 路由：/cli/uninstall
- 標題：
  - H1: openclaw uninstall
  - H2: 選項
  - H2: 範例
  - H2: 備註
  - H2: 相關

## cli/update.md

- 路由：/cli/update
- 標題：
  - H1: openclaw update
  - H2: 用法
  - H2: 選項
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: 它會做什麼
  - H3: 重新啟動交接
  - H3: 控制平面回應形狀
  - H2: Git 簽出流程
  - H3: 頻道選擇
  - H3: 更新步驟
  - H3: 外掛同步詳細資訊
  - H2: 相關

## cli/voicecall.md

- 路由：/cli/voicecall
- 標題：
  - H1: openclaw voicecall
  - H2: 子命令
  - H2: 設定與冒煙測試
  - H3: setup
  - H3: smoke
  - H2: 通話生命週期
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: 記錄與指標
  - H3: tail
  - H3: latency
  - H2: 暴露網路鉤子
  - H3: expose
  - H2: 相關

## cli/webhooks.md

- 路由：/cli/webhooks
- 標題：
  - H1: openclaw webhooks
  - H2: 子命令
  - H2: webhooks gmail setup
  - H3: 必要項目
  - H3: Pub/Sub 選項
  - H3: OpenClaw 傳遞選項
  - H3: gog watch serve 選項
  - H3: Tailscale 暴露
  - H3: 輸出
  - H2: webhooks gmail run
  - H2: 相關

## cli/wiki.md

- 路由：/cli/wiki
- 標題：
  - H1: openclaw wiki
  - H2: 常用命令
  - H2: 命令
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki chatgpt import
  - H3: wiki chatgpt rollback &lt;run-id&gt;
  - H3: wiki obsidian ...
  - H2: 實務使用指南
  - H2: 設定關聯
  - H2: 相關

## cli/workboard.md

- 路由：/cli/workboard
- 標題：
  - H2: 用法
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: 斜線命令一致性
  - H2: 權限
  - H2: 疑難排解
  - H3: 沒有卡片出現
  - H3: Dispatch 表示僅限資料
  - H3: Dispatch 沒有啟動任何項目
  - H2: 相關

## concepts/active-memory.md

- 路由：/concepts/active-memory
- 標題：
  - H2: 快速開始
  - H2: 運作方式
  - H2: 執行時機
  - H3: 工作階段類型
  - H2: 工作階段切換
  - H2: 如何查看
  - H2: 查詢模式
  - H2: 提示風格
  - H2: 模型後援政策
  - H3: 速度建議
  - H4: Cerebras 設定
  - H2: 記憶工具
  - H3: 內建 memory-core
  - H3: LanceDB 記憶
  - H3: Lossless Claw
  - H2: 進階逃生出口
  - H2: 對話紀錄持久化
  - H2: 設定
  - H2: 建議設定
  - H3: 冷啟動寬限期
  - H2: 偵錯
  - H2: 常見問題
  - H2: 相關頁面

## concepts/agent-loop.md

- 路由：/concepts/agent-loop
- 標題：
  - H2: 進入點
  - H2: 執行順序
  - H2: 佇列與並行
  - H2: 工作階段與工作區準備
  - H2: 提示組裝
  - H2: Hooks
  - H3: 內部 hooks（閘道 hooks）
  - H3: 外掛 hooks
  - H2: 串流
  - H2: 工具執行
  - H2: 回覆塑形
  - H2: 壓縮與重試
  - H2: 事件串流
  - H2: 聊天頻道處理
  - H2: 逾時
  - H3: 卡住工作階段診斷
  - H2: 可能提前結束的位置
  - H2: 相關

## concepts/agent-runtimes.md

- 路由：/concepts/agent-runtimes
- 標題：
  - H2: Codex 表面
  - H2: 執行階段所有權
  - H2: 執行階段選擇
  - H2: GitHub Copilot agent 執行階段
  - H2: 相容性契約
  - H2: 狀態標籤
  - H2: 相關

## concepts/agent-workspace.md

- 路由：/concepts/agent-workspace
- 標題：
  - H2: 預設位置
  - H2: 額外工作區資料夾
  - H2: 工作區檔案對應表
  - H2: 工作區中不包含的內容
  - H2: Git 備份（建議，私人）
  - H2: 請勿提交 Secrets
  - H2: 將工作區移到新機器
  - H2: 進階備註
  - H2: 相關

## concepts/agent.md

- 路由：/concepts/agent
- 標題：
  - H2：工作區（必填）
  - H2：Bootstrap 檔案（已注入）
  - H2：內建工具
  - H2：Skills
  - H2：執行階段邊界
  - H2：工作階段
  - H2：串流時的引導
  - H2：模型參照
  - H2：設定（最小）
  - H2：相關

## concepts/architecture.md

- 路由：/concepts/architecture
- 標題：
  - H2：概覽
  - H2：元件與流程
  - H3：閘道（常駐程式）
  - H3：用戶端（mac 應用程式 / 命令列介面 / Web 管理介面）
  - H3：節點（macOS / iOS / Android / 無介面）
  - H3：WebChat
  - H2：連線生命週期（單一用戶端）
  - H2：線路協定（摘要）
  - H2：配對與本機信任
  - H2：協定型別與程式碼產生
  - H2：遠端存取
  - H2：維運概覽
  - H2：不變條件
  - H2：相關

## concepts/channel-docking.md

- 路由：/concepts/channel-docking
- 標題：
  - H2：範例
  - H2：為什麼使用它
  - H2：必要設定
  - H2：命令
  - H2：會改變什麼
  - H2：不會改變什麼
  - H2：疑難排解

## concepts/commitments.md

- 路由：/concepts/commitments
- 標題：
  - H2：啟用承諾
  - H2：運作方式
  - H2：範圍
  - H2：承諾與提醒
  - H2：管理承諾
  - H2：隱私與成本
  - H2：疑難排解
  - H2：相關

## concepts/compaction.md

- 路由：/concepts/compaction
- 標題：
  - H2：運作方式
  - H2：自動壓縮
  - H2：手動壓縮
  - H2：設定
  - H3：使用不同模型
  - H3：識別碼保留
  - H3：作用中逐字稿位元組防護
  - H3：後續逐字稿
  - H3：壓縮通知
  - H3：記憶清出
  - H2：可插拔壓縮提供者
  - H2：壓縮與修剪
  - H2：疑難排解
  - H2：相關

## concepts/context-engine.md

- 路由：/concepts/context-engine
- 標題：
  - H2：快速開始
  - H2：運作方式
  - H3：子代理生命週期（選用）
  - H3：系統提示新增內容
  - H2：舊版引擎
  - H2：外掛引擎
  - H3：ContextEngine 介面
  - H3：執行階段設定
  - H3：主機需求
  - H3：故障隔離
  - H3：ownsCompaction
  - H2：設定參考
  - H2：與壓縮和記憶的關係
  - H2：提示
  - H2：相關

## concepts/context.md

- 路由：/concepts/context
- 標題：
  - H2：快速開始（檢查情境）
  - H2：範例輸出
  - H3：/context list
  - H3：/context detail
  - H3：/context map
  - H2：哪些內容會計入情境視窗
  - H2：OpenClaw 如何建構系統提示
  - H2：注入的工作區檔案（專案情境）
  - H2：Skills：注入與隨需載入
  - H2：工具：有兩種成本
  - H2：命令、指令與「行內捷徑」
  - H2：工作階段、壓縮與修剪（會保留什麼）
  - H2：/context 實際回報什麼
  - H2：相關

## concepts/delegate-architecture.md

- 路由：/concepts/delegate-architecture
- 標題：
  - H2：什麼是委派代理
  - H2：為什麼使用委派代理
  - H2：能力層級
  - H3：第 1 層：唯讀 + 草稿
  - H3：第 2 層：代表傳送
  - H3：第 3 層：主動
  - H2：先決條件：隔離與強化
  - H3：硬性阻擋（不可協商）
  - H3：工具限制
  - H3：沙箱隔離
  - H3：稽核軌跡
  - H2：設定委派代理
  - H3：1. 建立委派代理
  - H3：2. 設定身分提供者委派
  - H4：Microsoft 365
  - H4：Google Workspace
  - H3：3. 將委派代理繫結到頻道
  - H3：4. 將憑證新增到委派代理
  - H2：範例：組織助理
  - H2：擴展模式
  - H2：相關

## concepts/dreaming.md

- 路由：/concepts/dreaming
- 標題：
  - H2：夢境整理寫入什麼
  - H2：階段模型
  - H2：工作階段逐字稿擷取
  - H2：夢境日誌
  - H2：深度排名訊號
  - H3：QA 影子試驗報告涵蓋範圍
  - H2：排程
  - H2：快速開始
  - H2：斜線命令
  - H2：命令列介面工作流程
  - H2：主要預設值
  - H2：夢境整理使用者介面
  - H2：相關

## concepts/experimental-features.md

- 路由：/concepts/experimental-features
- 標題：
  - H2：目前記錄的旗標
  - H2：本機模型精簡模式
  - H3：為什麼是這三個工具
  - H3：何時開啟
  - H3：何時保持關閉
  - H3：啟用
  - H2：實驗性不代表隱藏
  - H2：相關

## concepts/features.md

- 路由：/concepts/features
- 標題：
  - H2：重點
  - H2：完整清單
  - H2：相關

## concepts/mantis-slack-desktop-runbook.md

- 路由：/concepts/mantis-slack-desktop-runbook
- 標題：
  - H2：儲存模型
  - H2：GitHub 派送
  - H2：本機命令列介面
  - H2：補水模式
  - H2：時序解讀
  - H2：證據檢查清單
  - H2：失敗處理
  - H2：相關

## concepts/mantis.md

- 路由：/concepts/mantis
- 標題：
  - H2：擁有權
  - H2：命令列介面命令
  - H3：discord-smoke
  - H3：run
  - H3：desktop-browser-smoke
  - H3：slack-desktop-smoke
  - H3：telegram-desktop-builder
  - H2：證據資訊清單
  - H2：GitHub 自動化
  - H2：機器與密鑰
  - H2：執行結果
  - H2：新增情境
  - H2：未解問題

## concepts/markdown-formatting.md

- 路由：/concepts/markdown-formatting
- 標題：
  - H2：管線
  - H2：IR 範例
  - H2：表格處理
  - H2：分塊規則
  - H2：連結政策
  - H2：劇透
  - H2：新增或更新頻道格式化器
  - H2：常見陷阱
  - H2：相關

## concepts/memory-builtin.md

- 路由：/concepts/memory-builtin
- 標題：
  - H2：它提供什麼
  - H2：開始使用
  - H2：支援的嵌入提供者
  - H2：索引如何運作
  - H2：何時使用
  - H2：疑難排解
  - H2：設定
  - H2：相關

## concepts/memory-honcho.md

- 路由：/concepts/memory-honcho
- 標題：
  - H2：它提供什麼
  - H2：可用工具
  - H2：開始使用
  - H2：設定
  - H2：遷移現有記憶
  - H2：運作方式
  - H2：Honcho 與內建記憶
  - H2：命令列介面命令
  - H2：延伸閱讀
  - H2：相關

## concepts/memory-qmd.md

- 路由：/concepts/memory-qmd
- 標題：
  - H2：相較於內建功能新增了什麼
  - H2：開始使用
  - H3：先決條件
  - H3：啟用
  - H2：sidecar 如何運作
  - H2：搜尋效能與相容性
  - H2：模型覆寫
  - H2：索引額外路徑
  - H2：索引工作階段逐字稿
  - H2：搜尋範圍
  - H2：引用
  - H2：何時使用
  - H2：疑難排解
  - H2：設定
  - H2：相關

## concepts/memory-search.md

- 路由：/concepts/memory-search
- 標題：
  - H2：快速開始
  - H2：支援的提供者
  - H2：搜尋如何運作
  - H2：改善搜尋品質
  - H3：時間衰減
  - H3：MMR（多樣性）
  - H3：兩者都啟用
  - H2：多模態記憶
  - H2：工作階段記憶搜尋
  - H2：疑難排解
  - H2：相關

## concepts/memory.md

- 路由：/concepts/memory
- 標題：
  - H2：運作方式
  - H2：什麼放在哪裡
  - H2：對動作敏感的記憶
  - H2：推斷出的承諾
  - H2：記憶工具
  - H2：記憶搜尋
  - H2：記憶後端
  - H2：知識 Wiki 層
  - H2：自動記憶清出
  - H2：夢境整理
  - H2：有依據的回填與即時提升
  - H2：命令列介面
  - H2：延伸閱讀

## concepts/message-lifecycle-refactor.md

- 路由：/concepts/message-lifecycle-refactor
- 標題：
  - H2：為什麼進行這次重構
  - H2：已發布內容
  - H3：傳送情境
  - H3：接收情境
  - H3：即時預覽
  - H3：持久回執
  - H3：公開 SDK 縮減
  - H2：實作偏離原始設計之處
  - H2：具體遷移風險（仍然相關）
  - H2：失敗分類
  - H2：未解問題
  - H2：相關

## concepts/messages.md

- 路由：/concepts/messages
- 標題：
  - H2：傳入去重
  - H2：傳入防抖
  - H2：工作階段與裝置
  - H2：提示本文與歷史情境
  - H2：工具結果中繼資料
  - H2：佇列與後續項目
  - H2：頻道執行擁有權
  - H2：串流、分塊與批次處理
  - H2：推理可見性與權杖
  - H2：前綴、串接討論與回覆
  - H2：靜默回覆
  - H2：相關

## concepts/model-failover.md

- 路由：/concepts/model-failover
- 標題：
  - H2：執行階段流程
  - H2：選擇來源政策
  - H2：驗證失敗略過快取
  - H2：使用者可見的備援通知
  - H2：驗證儲存（金鑰 + OAuth）
  - H2：設定檔 ID
  - H2：輪替順序
  - H3：工作階段黏著性（有利於快取）
  - H3：OpenAI Codex 訂閱加 API 金鑰備援
  - H2：冷卻時間
  - H2：帳單停用
  - H2：模型備援
  - H3：候選鏈規則
  - H3：哪些錯誤會推進備援
  - H3：冷卻略過與探測行為
  - H2：工作階段覆寫與即時模型切換
  - H2：可觀測性與失敗摘要
  - H2：相關設定

## concepts/model-providers.md

- 路由：/concepts/model-providers
- 標題：
  - H2：快速規則
  - H2：外掛擁有的提供者行為
  - H2：API 金鑰輪替
  - H2：官方提供者外掛
  - H3：OpenAI
  - H3：Anthropic
  - H3：OpenAI ChatGPT/Codex OAuth
  - H3：其他訂閱式託管選項
  - H3：OpenCode
  - H3：Google Gemini（API 金鑰）
  - H3：Google Vertex 與 Gemini CLI
  - H3：Z.AI（GLM）
  - H3：Vercel AI Gateway
  - H3：其他內建提供者外掛
  - H4：值得知道的特殊行為
  - H2：透過 models.providers 的提供者（自訂/base URL）
  - H3：Moonshot AI（Kimi）
  - H3：Kimi Coding
  - H3：Volcano Engine（Doubao）
  - H3：BytePlus（國際）
  - H3：Synthetic
  - H3：MiniMax
  - H3：LM Studio
  - H3：Ollama
  - H3：vLLM
  - H3：SGLang
  - H3：本機代理（LM Studio、vLLM、LiteLLM 等）
  - H2：命令列介面範例
  - H2：相關

## concepts/models.md

- 路由：/concepts/models
- 標題：
  - H2：選擇順序
  - H2：選擇來源與備援嚴格度
  - H2：快速模型政策
  - H2：入門設定
  - H2：「Model is not allowed」（以及為什麼回覆會停止）
  - H2：聊天中的 /model
  - H2：命令列介面
  - H2：模型登錄（models.json）
  - H2：相關

## concepts/multi-agent.md

- 路由：/concepts/multi-agent
- 標題：
  - H2：什麼是單一代理
  - H2：路徑
  - H3：單代理模式（預設）
  - H2：代理輔助工具
  - H2：快速開始
  - H2：多個代理、多個人格
  - H2：跨代理 QMD 記憶搜尋
  - H2：一個 WhatsApp 號碼，多個人（私訊分流）
  - H2：路由規則
  - H2：多個帳號 / 電話號碼
  - H2：概念
  - H2：平台範例
  - H2：常見模式
  - H2：每代理沙箱與工具設定
  - H2：相關

## concepts/oauth.md

- 路由：/concepts/oauth
- 標題：
  - H2：權杖接收槽（為什麼存在）
  - H2：儲存（權杖存放位置）
  - H2：Anthropic Claude CLI 重用
  - H2：OAuth 交換（登入如何運作）
  - H3：Anthropic setup-token
  - H3：OpenAI Codex（ChatGPT OAuth）
  - H2：重新整理 + 到期
  - H2：多個帳號（設定檔）+ 路由
  - H3：1) 首選：分開的代理
  - H3：2) 進階：單一代理中的多個設定檔
  - H2：相關

## concepts/parallel-specialist-lanes.md

- 路由：/concepts/parallel-specialist-lanes
- 標題：
  - H2：第一原則
  - H2：建議推出方式
  - H3：第 1 階段：通道合約 + 背景重型工作
  - H3：第 2 階段：優先順序與並行控制
  - H3：第 3 階段：協調器 / 流量控制器
  - H2：最小通道合約範本
  - H2：相關

## concepts/personal-agent-benchmark-pack.md

- 路由：/concepts/personal-agent-benchmark-pack
- 標題：
  - H2：情境
  - H2：隱私模型
  - H2：擴充套件包

## concepts/presence.md

- 路由：/concepts/presence
- 標題：
  - H2：存在狀態欄位（會顯示什麼）
  - H2：產生器（存在狀態來自哪裡）
  - H3：1) 閘道自身項目
  - H3：2) WebSocket 連線
  - H4：為什麼一次性命令列介面命令不會顯示
  - H3：3) system-event 信標
  - H3：4) 節點連線（角色：node）
  - H2：合併 + 去重規則（為什麼 instanceId 很重要）
  - H2：TTL 與有界大小
  - H2：遠端/通道注意事項（loopback IP）
  - H2：消費者
  - H3：macOS Instances 分頁
  - H2：偵錯提示
  - H2：相關

## concepts/progress-drafts.md

- 路由：/concepts/progress-drafts
- 標題：
  - H2: 快速開始
  - H2: 使用者會看到什麼
  - H2: 選擇模式
  - H2: 設定標籤
  - H2: 控制進度行
  - H3: 詳細模式
  - H3: 命令/exec 文字
  - H3: commentary 通道
  - H3: 行數限制
  - H3: 豐富呈現（Slack）
  - H3: 隱藏工具/任務行
  - H2: 頻道行為
  - H2: 完成
  - H2: 疑難排解
  - H2: 相關

## concepts/qa-e2e-automation.md

- 路由：/concepts/qa-e2e-automation
- 標題：
  - H2: 命令介面
  - H3: 由設定檔支援的 qa run
  - H2: 操作者流程
  - H3: 可觀測性煙霧測試
  - H3: 矩陣煙霧測試通道
  - H3: Discord Mantis 情境
  - H3: Mantis Slack 桌面和視覺任務執行器
  - H3: 憑證集區健康檢查
  - H2: 即時傳輸涵蓋範圍
  - H2: Discord、Slack、Telegram 和 WhatsApp QA 參考
  - H3: 共用命令列介面旗標
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: 設定 Slack 工作區
  - H3: WhatsApp QA
  - H3: Convex 憑證集區
  - H2: 由 repo 支援的種子資料
  - H2: 提供者模擬通道
  - H2: 傳輸配接器
  - H3: 新增頻道
  - H3: 情境輔助程式名稱
  - H2: 回報
  - H2: 相關文件

## concepts/qa-matrix.md

- 路由：/concepts/qa-matrix
- 標題：
  - H2: 快速開始
  - H2: 此通道會做什麼
  - H2: 命令列介面
  - H3: 常用旗標
  - H3: 提供者旗標
  - H2: 設定檔
  - H2: 情境
  - H2: 環境變數
  - H2: 輸出成品
  - H2: 分流提示
  - H2: 即時傳輸契約
  - H2: 相關

## concepts/queue-steering.md

- 路由：/concepts/queue-steering
- 標題：
  - H2: 執行階段邊界
  - H2: 模式
  - H2: 爆量範例
  - H2: 範圍
  - H2: 去抖動
  - H2: 相關

## concepts/queue.md

- 路由：/concepts/queue
- 標題：
  - H2: 為什麼
  - H2: 運作方式
  - H2: 預設值
  - H2: 佇列模式
  - H2: 佇列選項
  - H2: 導向和串流
  - H2: 優先順序
  - H2: 每個工作階段覆寫
  - H2: 取消已排入佇列的回合
  - H2: 範圍和保證
  - H2: 疑難排解
  - H2: 相關

## concepts/retry.md

- 路由：/concepts/retry
- 標題：
  - H2: 目標
  - H2: 預設值
  - H2: 行為
  - H3: 模型提供者
  - H3: Discord
  - H3: Telegram
  - H2: 設定
  - H2: 備註
  - H2: 相關

## concepts/session-pruning.md

- 路由：/concepts/session-pruning
- 標題：
  - H2: 為什麼重要
  - H2: 運作方式
  - H2: 舊版圖片清理
  - H2: 智慧預設值
  - H2: 啟用或停用
  - H2: 修剪與壓縮
  - H2: 延伸閱讀
  - H2: 相關

## concepts/session-tool.md

- 路由：/concepts/session-tool
- 標題：
  - H2: 可用工具
  - H2: 列出和讀取工作階段
  - H2: 傳送跨工作階段訊息
  - H2: 狀態和協調輔助工具
  - H2: 產生子代理
  - H2: 可見性
  - H2: 延伸閱讀
  - H2: 相關

## concepts/session.md

- 路由：/concepts/session
- 標題：
  - H2: 訊息如何路由
  - H2: DM 隔離
  - H3: Dock 已連結頻道
  - H2: 工作階段生命週期
  - H2: 狀態存放位置
  - H2: 工作階段維護
  - H2: 檢查工作階段
  - H2: 延伸閱讀
  - H2: 相關

## concepts/soul.md

- 路由：/concepts/soul
- 標題：
  - H2: SOUL.md 中應包含什麼
  - H2: 這為什麼有效
  - H2: Molty 提示
  - H2: 好的樣子
  - H2: 一則警告
  - H2: 相關

## concepts/streaming.md

- 路由：/concepts/streaming
- 標題：
  - H2: 區塊串流（頻道訊息）
  - H3: 使用區塊串流傳送媒體
  - H2: 分塊演算法（低/高界限）
  - H2: 合併（合併串流區塊）
  - H2: 區塊之間類似真人的節奏
  - H2:「串流分塊或全部」
  - H2: 預覽串流模式
  - H3: 頻道對應
  - H3: 舊版金鑰遷移
  - H2: 執行階段行為
  - H3: Telegram
  - H3: Discord
  - H3: Slack
  - H3: Mattermost
  - H3: Matrix
  - H2: 工具進度預覽更新
  - H2: 進度草稿呈現
  - H3: commentary 進度通道
  - H2: 相關

## concepts/system-prompt.md

- 路由：/concepts/system-prompt
- 標題：
  - H2: 結構
  - H2: 提示模式
  - H2: 提示快照
  - H2: 工作區啟動注入
  - H2: 時間處理
  - H2: Skills
  - H2: 文件
  - H2: 相關

## concepts/timezone.md

- 路由：/concepts/timezone
- 標題：
  - H2: 三個時區介面
  - H2: 設定使用者時區
  - H2: 信封時區值
  - H2: 何時覆寫
  - H2: 相關

## concepts/typebox.md

- 路由：/concepts/typebox
- 標題：
  - H2: 心智模型（30 秒）
  - H2: 結構描述所在位置
  - H2: 目前管線
  - H2: 結構描述在執行階段的使用方式
  - H2: 範例框架
  - H2: 最小用戶端（Node.js）
  - H2: 實作範例：端到端新增方法
  - H2: Swift 程式碼產生行為
  - H2: 版本控管和相容性
  - H2: 結構描述模式和慣例
  - H2: 即時結構描述 JSON
  - H2: 變更結構描述時
  - H2: 相關

## concepts/typing-indicators.md

- 路由：/concepts/typing-indicators
- 標題：
  - H2: 預設值
  - H2: 模式
  - H2: 設定
  - H2: 備註
  - H2: 相關

## concepts/usage-tracking.md

- 路由：/concepts/usage-tracking
- 標題：
  - H2: 這是什麼
  - H2: 出現在哪裡
  - H2: 預設用量頁尾模式
  - H3: 三種不同的工作階段狀態
  - H3: 優先順序
  - H3: 重設與關閉
  - H3: 切換行為
  - H3: 設定
  - H2: 自訂 /usage full 頁尾
  - H3: 形狀
  - H3: 契約路徑
  - H3: 動詞
  - H3: 片段形式
  - H3: 範例
  - H2: 提供者 + 憑證
  - H2: 相關

## date-time.md

- 路由：/date-time
- 標題：
  - H2: 訊息信封（預設本機）
  - H3: 範例
  - H2: 系統提示：目前日期和時間
  - H2: 系統事件行（預設本機）
  - H3: 設定使用者時區 + 格式
  - H2: 時間格式偵測（自動）
  - H2: 工具承載資料 + 連接器（原始提供者時間 + 正規化欄位）
  - H2: 相關文件

## debug/node-issue.md

- 路由：/debug/node-issue
- 標題：
  - H1: Node + tsx "\\name is not a function" 當機
  - H2: 狀態
  - H2: 原始症狀
  - H2: 原因
  - H2: 目前重現檢查
  - H2: 因應措施（如果當機再次出現）
  - H2: 參考資料
  - H2: 相關

## diagnostics/flags.md

- 路由：/diagnostics/flags
- 標題：
  - H2: 運作方式
  - H2: 已知旗標
  - H2: 透過設定啟用
  - H2: 環境覆寫（一次性）
  - H2: 分析器旗標
  - H2: 時間軸成品
  - H2: 記錄存放位置
  - H2: 擷取記錄
  - H2: 備註
  - H2: 相關

## gateway/authentication.md

- 路由：/gateway/authentication
- 標題：
  - H2: 建議設定：API 金鑰（任何提供者）
  - H2: Anthropic：重用 Claude 命令列介面
  - H2: 手動輸入權杖
  - H3: 由 SecretRef 支援的憑證
  - H2: 檢查模型驗證狀態
  - H2: API 金鑰輪替（閘道）
  - H2: 在閘道執行時移除提供者驗證
  - H2: 控制使用哪個憑證
  - H3: OpenAI 和舊版 openai-codex id
  - H3: 登入期間（命令列介面）
  - H3: 每個工作階段（聊天命令）
  - H3: 每個代理（命令列介面覆寫）
  - H2: 疑難排解
  - H3:「找不到憑證」
  - H3: 權杖即將過期/已過期
  - H2: 相關

## gateway/background-process.md

- 路由：/gateway/background-process
- 標題：
  - H2: exec 工具
  - H3: 環境覆寫
  - H3: 設定（優先於環境覆寫）
  - H2: 子程序橋接
  - H2: process 工具
  - H2: 範例
  - H2: 相關

## gateway/bonjour.md

- 路由：/gateway/bonjour
- 標題：
  - H2: 透過 Tailscale 的廣域 Bonjour（Unicast DNS-SD）
  - H3: 閘道設定
  - H3: 一次性 DNS 伺服器設定（閘道主機，僅限 macOS）
  - H3: Tailscale DNS 設定
  - H3: 閘道監聽器安全性
  - H2: 會宣告什麼
  - H2: 服務類型
  - H2: TXT 金鑰（非秘密提示）
  - H2: 在 macOS 上偵錯
  - H2: 在閘道記錄中偵錯
  - H2: 在 iOS 節點上偵錯
  - H2: 何時啟用 Bonjour
  - H2: 何時停用 Bonjour
  - H2: Docker 注意事項
  - H2: 疑難排解已停用的 Bonjour
  - H2: 常見失敗模式
  - H2: 逸出的實例名稱（\032）
  - H2: 啟用/停用/設定
  - H2: 相關文件

## gateway/bridge-protocol.md

- 路由：/gateway/bridge-protocol
- 標題：
  - H2: 它存在的原因
  - H2: 傳輸
  - H2: 握手和配對
  - H2: 框架
  - H2: Exec 生命週期事件
  - H2: 歷史 tailnet 用法
  - H2: 版本控管
  - H2: 相關

## gateway/cli-backends.md

- 路由：/gateway/cli-backends
- 標題：
  - H2: 快速開始
  - H2: 將它作為後援使用
  - H2: 設定
  - H2: 運作方式
  - H3: Claude 命令列介面特定事項
  - H2: 工作階段
  - H2: 來自 claude-cli 工作階段的後援前置內容
  - H2: 圖片
  - H2: 輸入和輸出
  - H2: 外掛擁有的預設值
  - H2: 文字轉換覆蓋層
  - H2: 原生壓縮擁有權
  - H2: Bundle MCP 覆蓋層
  - H2: 重播種歷史上限
  - H2: 限制
  - H2: 疑難排解
  - H2: 相關

## gateway/config-agents.md

- 路由：/gateway/config-agents
- 標題：
  - H2: 代理預設值
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: 每個代理的啟動設定檔覆寫
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: 情境預算擁有權對照表
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: 執行階段政策
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: 區塊串流
  - H3: 輸入指示器
  - H3: agents.defaults.sandbox
  - H3: agents.list（每個代理覆寫）
  - H2: 多代理路由
  - H3: 繫結比對欄位
  - H3: 每個代理的存取設定檔
  - H2: 工作階段
  - H2: 訊息
  - H3: 回應前綴
  - H3: 確認回應反應
  - H3: 佇列
  - H3: 傳入去抖動
  - H3: 其他訊息金鑰
  - H3: TTS（文字轉語音）
  - H2: 對話
  - H2: 相關

## gateway/config-channels.md

- 路由：/gateway/config-channels
- 標題：
  - H2: 頻道
  - H3: DM 和群組存取
  - H3: 頻道模型覆寫
  - H3: 頻道預設值和心跳偵測
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: 多帳號（所有頻道）
  - H3: 其他外掛頻道
  - H3: 群組聊天提及門控
  - H4: DM 歷史記錄限制
  - H4: 自我聊天模式
  - H3: 命令（聊天命令處理）
  - H2: 相關

## gateway/config-tools.md

- 路由：/gateway/config-tools
- 標題：
  - H2: 工具
  - H3: 工具設定檔
  - H3: 工具群組
  - H3: 沙盒工具政策內的 MCP 和外掛工具
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: 自訂提供者和基底 URL
  - H3: 提供者欄位詳細資料
  - H3: 提供者範例
  - H2: 相關

## gateway/configuration-examples.md

- 路由：/gateway/configuration-examples
- 標題：
  - H2：快速開始
  - H3：絕對最小設定
  - H3：建議入門設定
  - H2：展開範例（主要選項）
  - H3：符號連結的同層 skill repo
  - H2：常見模式
  - H3：共用 skill 基準搭配一項覆寫
  - H3：多平台設定
  - H3：可信任節點網路自動核准
  - H3：安全私訊模式（共用收件匣 / 多使用者私訊）
  - H3：Anthropic API 金鑰 + MiniMax 備援
  - H3：工作用 Bot（限制存取）
  - H3：僅使用本機模型
  - H2：提示
  - H2：相關

## gateway/configuration-reference.md

- 路由：/gateway/configuration-reference
- 標題：
  - H2：通道
  - H2：代理預設值、多代理、工作階段與訊息
  - H2：工具與自訂提供者
  - H2：模型
  - H2：MCP
  - H2：Skills
  - H2：外掛
  - H3：Codex 執行環境外掛設定
  - H2：承諾
  - H2：瀏覽器
  - H2：UI
  - H2：閘道
  - H3：OpenAI 相容端點
  - H3：多執行個體隔離
  - H3：gateway.tls
  - H3：gateway.reload
  - H2：Hook
  - H3：Gmail 整合
  - H2：Canvas 外掛主機
  - H2：探索
  - H3：mDNS（Bonjour）
  - H3：廣域（DNS-SD）
  - H2：環境
  - H3：env（內嵌環境變數）
  - H3：環境變數替換
  - H2：秘密
  - H3：SecretRef
  - H3：支援的憑證介面
  - H3：秘密提供者設定
  - H2：驗證儲存
  - H3：auth.cooldowns
  - H2：記錄
  - H2：診斷
  - H2：更新
  - H2：ACP
  - H2：命令列介面
  - H2：精靈
  - H2：身分
  - H2：橋接（舊版，已移除）
  - H2：排程
  - H3：cron.retry
  - H3：cron.failureAlert
  - H3：cron.failureDestination
  - H2：媒體模型範本變數
  - H2：設定 include（$include）
  - H2：相關

## gateway/configuration.md

- 路由：/gateway/configuration
- 標題：
  - H2：最小設定
  - H2：編輯設定
  - H2：嚴格驗證
  - H2：常見工作
  - H2：設定熱重新載入
  - H3：重新載入模式
  - H3：哪些會熱套用，哪些需要重新啟動
  - H3：重新載入規劃
  - H2：設定 RPC（程式化更新）
  - H2：環境變數
  - H2：完整參考
  - H2：相關

## gateway/diagnostics.md

- 路由：/gateway/diagnostics
- 標題：
  - H2：快速開始
  - H2：聊天指令
  - H2：匯出內容包含什麼
  - H2：隱私模型
  - H2：穩定性記錄器
  - H2：實用選項
  - H2：停用診斷
  - H2：相關

## gateway/discovery.md

- 路由：/gateway/discovery
- 標題：
  - H2：術語
  - H2：為什麼 direct 和 SSH 都存在
  - H2：探索輸入
  - H3：1）Bonjour / DNS-SD
  - H4：服務信標詳細資料
  - H3：2）Tailnet（跨網路）
  - H3：3）手動 / SSH 目標
  - H2：傳輸選擇（用戶端政策）
  - H2：配對與驗證（直接傳輸）
  - H2：各元件責任
  - H2：相關

## gateway/doctor.md

- 路由：/gateway/doctor
- 標題：
  - H2：快速開始
  - H3：Headless 與自動化模式
  - H2：唯讀 lint 模式
  - H2：它會做什麼（摘要）
  - H2：夢境 UI 回填與重設
  - H2：詳細行為與理由
  - H2：相關

## gateway/external-apps.md

- 路由：/gateway/external-apps
- 標題：
  - H2：目前可用內容
  - H2：建議路徑
  - H2：App 程式碼與外掛程式碼
  - H2：相關

## gateway/gateway-lock.md

- 路由：/gateway/gateway-lock
- 標題：
  - H2：原因
  - H2：兩層
  - H3：檔案鎖
  - H3：Socket 綁定
  - H2：操作注意事項
  - H2：相關

## gateway/health.md

- 路由：/gateway/health
- 標題：
  - H2：快速檢查
  - H2：深度診斷
  - H2：健康監控設定
  - H2：上線時間監控
  - H3：監控服務設定範例
  - H2：發生失敗時
  - H2：專用 "health" 指令
  - H2：相關

## gateway/heartbeat.md

- 路由：/gateway/heartbeat
- 標題：
  - H2：快速開始（初學者）
  - H2：預設值
  - H2：心跳偵測提示詞用途
  - H2：回應合約
  - H2：設定
  - H3：範圍與優先順序
  - H3：每個代理的心跳偵測
  - H3：可用時段範例
  - H3：24/7 設定
  - H3：多帳號範例
  - H3：欄位備註
  - H2：傳遞行為
  - H2：可見性控制
  - H3：各旗標作用
  - H3：每通道與每帳號範例
  - H3：常見模式
  - H2：HEARTBEAT.md（選用）
  - H3：tasks: 區塊
  - H3：代理可以更新 HEARTBEAT.md 嗎？
  - H2：手動喚醒（隨選）
  - H2：推理傳遞（選用）
  - H2：成本意識
  - H2：心跳偵測後的內容溢位
  - H2：相關

## gateway/index.md

- 路由：/gateway
- 標題：
  - H2：5 分鐘本機啟動
  - H2：執行階段模型
  - H2：OpenAI 相容端點
  - H3：連接埠與綁定優先順序
  - H3：熱重新載入模式
  - H2：操作員指令集
  - H2：多個閘道（同一主機）
  - H2：遠端存取
  - H2：監督與服務生命週期
  - H2：開發設定檔快速路徑
  - H2：通訊協定快速參考（操作員檢視）
  - H2：操作檢查
  - H3：存活狀態
  - H3：就緒狀態
  - H3：缺口復原
  - H2：常見失敗特徵
  - H2：安全保證
  - H2：相關

## gateway/local-model-services.md

- 路由：/gateway/local-model-services
- 標題：
  - H2：運作方式
  - H2：設定形狀
  - H2：欄位
  - H2：Inferrs 範例
  - H2：ds4 範例
  - H2：相關

## gateway/local-models.md

- 路由：/gateway/local-models
- 標題：
  - H2：硬體最低需求
  - H2：選擇後端
  - H2：LM Studio + 大型本機模型（Responses API）
  - H3：混合設定：託管主要模型，本機備援
  - H3：區域代管 / 資料路由
  - H2：其他 OpenAI 相容本機代理
  - H2：較小或較嚴格的後端
  - H2：疑難排解
  - H2：相關

## gateway/logging.md

- 路由：/gateway/logging
- 標題：
  - H1：記錄
  - H2：檔案式記錄器
  - H3：詳細模式與記錄層級
  - H2：主控台擷取
  - H2：遮罩
  - H2：閘道 WebSocket 記錄
  - H3：WS 記錄樣式
  - H2：主控台格式化（子系統記錄）
  - H2：相關

## gateway/multiple-gateways.md

- 路由：/gateway/multiple-gateways
- 標題：
  - H2：救援 Bot 快速開始
  - H3：--profile rescue onboard 會變更什麼
  - H2：一般多閘道設定
  - H2：隔離檢查清單
  - H2：連接埠對應（衍生）
  - H2：瀏覽器 / CDP 注意事項（常見陷阱）
  - H2：手動 env 範例
  - H2：快速檢查
  - H2：相關

## gateway/network-model.md

- 路由：/gateway/network-model
- 標題：
  - H2：相關

## gateway/openai-http-api.md

- 路由：/gateway/openai-http-api
- 標題：
  - H2：啟用端點
  - H2：安全邊界（重要）
  - H2：驗證
  - H2：何時使用此端點
  - H2：代理優先模型合約
  - H2：工作階段行為
  - H2：請求限制（設定）
  - H2：聊天工具合約
  - H3：支援的請求欄位
  - H3：不支援的變體
  - H3：非串流工具回應形狀
  - H3：串流工具回應形狀
  - H3：工具後續迴圈
  - H2：串流（SSE）
  - H2：Open WebUI 快速設定
  - H2：範例
  - H2：相關

## gateway/openresponses-http-api.md

- 路由：/gateway/openresponses-http-api
- 標題：
  - H2：驗證、安全性與路由
  - H2：工作階段行為
  - H2：請求形狀
  - H2：項目（輸入）
  - H3：message
  - H3：functioncalloutput（回合式工具）
  - H3：reasoning 與 itemreference
  - H2：工具（用戶端函式工具）
  - H2：影像（inputimage）
  - H2：檔案（inputfile）
  - H2：檔案 + 影像限制（設定）
  - H2：串流（SSE）
  - H2：用量
  - H2：錯誤
  - H2：範例
  - H2：相關

## gateway/openshell.md

- 路由：/gateway/openshell
- 標題：
  - H2：先決條件
  - H2：快速開始
  - H2：工作區模式
  - H3：mirror（預設）
  - H3：remote
  - H3：選擇模式
  - H2：設定參考
  - H2：範例
  - H3：最小遠端設定
  - H3：GPU 的 mirror 模式
  - H3：每代理 OpenShell 搭配自訂閘道
  - H2：生命週期管理
  - H2：安全強化
  - H2：目前限制
  - H2：運作方式
  - H2：相關

## gateway/opentelemetry.md

- 路由：/gateway/opentelemetry
- 標題：
  - H2：快速開始
  - H2：匯出的訊號
  - H2：設定參考
  - H3：環境變數
  - H2：隱私與內容擷取
  - H2：取樣與清除
  - H2：匯出的指標
  - H3：模型用量
  - H3：訊息流程
  - H3：對話
  - H3：佇列與工作階段
  - H3：工作階段存活遙測
  - H3：執行環境生命週期
  - H3：工具執行與迴圈偵測
  - H3：Exec
  - H3：診斷內部項目（記憶體、酬載、匯出器健康狀態）
  - H2：匯出的 span
  - H2：診斷事件目錄
  - H2：沒有匯出器時
  - H2：停用
  - H2：相關

## gateway/operator-scopes.md

- 路由：/gateway/operator-scopes
- 標題：
  - H2：角色
  - H2：範圍層級
  - H2：方法範圍只是第一道關卡
  - H2：裝置配對核准
  - H2：節點配對核准
  - H2：共用秘密驗證

## gateway/pairing.md

- 路由：/gateway/pairing
- 標題：
  - H2：概念
  - H2：配對運作方式
  - H2：命令列介面工作流程（適合 headless）
  - H2：API 介面（閘道通訊協定）
  - H2：節點指令閘控（2026.3.31+）
  - H2：節點事件信任邊界（2026.3.31+）
  - H2：自動核准（macOS App）
  - H2：Trusted-CIDR 裝置自動核准
  - H2：中繼資料升級自動核准
  - H2：QR 配對輔助工具
  - H2：本地性與轉送標頭
  - H2：儲存（本機、私有）
  - H2：傳輸行為
  - H2：相關

## gateway/prometheus.md

- 路由：/gateway/prometheus
- 標題：
  - H2：快速開始
  - H2：匯出的指標
  - H2：標籤政策
  - H2：PromQL 配方
  - H2：在 Prometheus 與 OpenTelemetry 匯出之間選擇
  - H2：疑難排解
  - H2：相關

## gateway/protocol.md

- 路由：/gateway/protocol
- 標題：
  - H2：傳輸與框架
  - H2：Handshake
  - H3：節點連線範例
  - H2：角色與範圍
  - H2：Presence
  - H3：節點背景存活事件
  - H2：廣播事件範圍
  - H2：RPC 方法家族
  - H3：常見事件家族
  - H3：節點輔助方法
  - H2：工作帳本 RPC
  - H2：操作員輔助方法
  - H3：models.list 檢視
  - H2：Exec 核准
  - H2：代理傳遞備援
  - H2：版本控管
  - H3：用戶端常數
  - H2：驗證
  - H2：裝置身分與配對
  - H3：裝置驗證遷移診斷
  - H2：TLS 與釘選
  - H2：範圍
  - H2：相關

## gateway/remote-gateway-readme.md

- 路由：/gateway/remote-gateway-readme
- 標題：
  - H1：使用遠端閘道執行 OpenClaw.app
  - H2：設定
  - H2：運作方式
  - H2：相關

## gateway/remote.md

- 路由：/gateway/remote
- 標題：
  - H2：核心概念
  - H2：拓撲選項
  - H2：指令流程（在哪裡執行什麼）
  - H2：SSH 通道（命令列介面 + 工具）
  - H2：命令列介面遠端預設值
  - H2：憑證優先順序
  - H2：聊天 UI 遠端存取
  - H2：macOS App 遠端模式
  - H2：安全規則（遠端 / VPN）
  - H3：macOS：透過 LaunchAgent 建立持久 SSH 通道
  - H4：步驟 1：加入 SSH 設定
  - H4：步驟 2：複製 SSH 金鑰（一次性）
  - H4：步驟 3：設定閘道 token
  - H4：步驟 4：建立 LaunchAgent
  - H4：步驟 5：載入 LaunchAgent
  - H4：疑難排解
  - H2：相關

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- 路由：/gateway/sandbox-vs-tool-policy-vs-elevated
- 標題：
  - H2：快速除錯
  - H2：沙箱：工具執行位置
  - H3：Bind mount（安全快速檢查）
  - H2：工具政策：哪些工具存在 / 可呼叫
  - H3：工具群組（簡寫）
  - H2：提升權限：僅 exec 的「在主機上執行」
  - H2：常見「sandbox jail」修正
  - H3："Tool X blocked by sandbox tool policy"
  - H3："I thought this was main, why is it sandboxed?"
  - H2：相關

## gateway/sandboxing.md

- 路由：/gateway/sandboxing
- 標題：
  - H2：哪些內容會被沙盒化
  - H2：模式、範圍與後端
  - H2：Docker 後端
  - H3：沙盒化瀏覽器
  - H2：SSH 後端
  - H2：OpenShell 後端
  - H2：工作區存取
  - H2：自訂綁定掛載
  - H2：映像檔與設定
  - H2：setupCommand（一次性容器設定）
  - H2：工具政策與逃生出口
  - H2：多代理覆寫
  - H2：最小啟用範例
  - H2：相關

## gateway/secrets-plan-contract.md

- 路由：/gateway/secrets-plan-contract
- 標題：
  - H2：計畫檔案形狀
  - H2：提供者 upsert 與刪除
  - H2：支援的目標範圍
  - H2：目標類型行為
  - H2：路徑驗證規則
  - H2：失敗行為
  - H2：Exec 提供者同意行為
  - H2：執行階段與稽核範圍注意事項
  - H2：操作員檢查
  - H2：相關文件

## gateway/secrets.md

- 路由：/gateway/secrets
- 標題：
  - H2：執行階段模型
  - H2：代理存取邊界
  - H2：作用中表面篩選
  - H2：閘道驗證表面診斷
  - H2：導入參考預檢
  - H2：SecretRef 合約
  - H2：提供者設定
  - H2：檔案支援的 API 金鑰
  - H2：Exec 整合範例
  - H2：MCP 伺服器環境變數
  - H2：沙盒 SSH 驗證材料
  - H2：支援的憑證表面
  - H2：必要行為與優先順序
  - H2：啟用觸發條件
  - H2：降級與復原訊號
  - H2：命令路徑解析
  - H2：稽核與設定工作流程
  - H2：單向安全政策
  - H2：舊版驗證相容性注意事項
  - H2：Web UI 注意事項
  - H2：相關

## gateway/security/audit-checks.md

- 路由：/gateway/security/audit-checks
- 標題：
  - H2：相關

## gateway/security/exposure-runbook.md

- 路由：/gateway/security/exposure-runbook
- 標題：
  - H2：選擇暴露模式
  - H2：預檢清查
  - H2：基準檢查
  - H2：最低安全基準
  - H2：私訊與群組暴露
  - H2：反向代理檢查
  - H2：工具與沙盒檢閱
  - H2：變更後驗證
  - H2：復原計畫
  - H2：檢閱清單

## gateway/security/index.md

- 路由：/gateway/security
- 標題：
  - H2：範圍：個人助理安全模型
  - H2：openclaw 安全稽核
  - H3：稽核檢查內容（高層級）
  - H3：分流發現項目時的優先順序
  - H2：60 秒完成強化基準
  - H2：信任邊界矩陣
  - H2：依設計不是漏洞
  - H2：閘道與節點信任
  - H2：威脅模型
  - H2：私訊存取：配對、允許清單、開放、停用
  - H3：允許清單（兩層）
  - H3：私訊工作階段隔離（多使用者模式）
  - H2：上下文可見性與觸發授權
  - H2：提示注入
  - H3：外部內容與不受信任輸入包裝
  - H3：繞過旗標（生產環境保持關閉）
  - H3：群組中的推理與詳細輸出
  - H2：命令授權
  - H2：控制平面工具
  - H2：節點執行（system.run）
  - H2：動態 Skills（監看器 / 遠端節點）
  - H2：外掛
  - H2：沙盒
  - H3：子代理委派護欄
  - H3：唯讀模式
  - H2：每代理存取設定檔（多代理）
  - H3：完整存取（無沙盒）
  - H3：唯讀工具 + 唯讀工作區
  - H3：無檔案系統/shell 存取（允許提供者訊息）
  - H2：瀏覽器控制風險
  - H3：瀏覽器 SSRF 政策（預設嚴格）
  - H2：網路暴露
  - H3：綁定、連接埠、防火牆
  - H3：搭配 UFW 的 Docker 連接埠發布
  - H3：mDNS/Bonjour 探索
  - H3：閘道 WebSocket 驗證
  - H3：Tailscale Serve 身分標頭
  - H3：反向代理設定
  - H3：HSTS 與來源注意事項
  - H3：透過 HTTP 使用控制 UI
  - H3：不安全/危險旗標
  - H2：部署與主機信任
  - H2：磁碟上的祕密
  - H3：憑證儲存對照表
  - H3：檔案權限
  - H3：工作區 .env 檔案
  - H3：記錄與轉錄
  - H2：安全基準（複製/貼上）
  - H3：分開號碼（WhatsApp、Signal、Telegram）
  - H2：事件回應
  - H3：圍堵
  - H3：輪替（若祕密外洩即假設已遭入侵）
  - H3：稽核
  - H3：收集以供報告
  - H2：祕密掃描
  - H2：回報安全問題

## gateway/security/secure-file-operations.md

- 路由：/gateway/security/secure-file-operations
- 標題：
  - H2：預設：無 Python 輔助工具
  - H2：沒有 Python 時仍受保護的內容
  - H2：Python 新增的能力
  - H2：外掛與核心指引

## gateway/security/shrinkwrap.md

- 路由：/gateway/security/shrinkwrap
- 標題：
  - H2：為什麼重要
  - H2：產生與檢查
  - H2：檢查已發布套件

## gateway/tailscale.md

- 路由：/gateway/tailscale
- 標題：
  - H2：模式
  - H2：設定範例
  - H3：僅 Tailnet（Serve）
  - H3：僅 Tailnet（綁定至 Tailnet IP）
  - H3：公用網際網路（Funnel + 共用密碼）
  - H2：命令列介面範例
  - H2：驗證
  - H3：Tailscale 身分標頭（僅 Serve）
  - H2：注意事項
  - H3：Tailscale 先決條件與限制
  - H2：瀏覽器控制（遠端閘道 + 本機瀏覽器）
  - H2：深入了解
  - H2：相關

## gateway/tools-invoke-http-api.md

- 路由：/gateway/tools-invoke-http-api
- 標題：
  - H2：驗證
  - H2：安全邊界（重要）
  - H2：請求主體
  - H2：政策 + 路由行為
  - H2：回應
  - H2：範例
  - H2：相關

## gateway/troubleshooting.md

- 路由：/gateway/troubleshooting
- 標題：
  - H2：命令階梯
  - H2：更新後
  - H2：分裂腦安裝與較新設定防護
  - H2：回滾後的通訊協定不相符
  - H2：Skills 符號連結因路徑逃逸而略過
  - H2：Anthropic 429 長上下文需要額外用量
  - H2：上游 403 封鎖回應
  - H2：本機 OpenAI 相容後端可通過直接探測，但代理執行失敗
  - H2：沒有回覆
  - H2：儀表板控制 UI 連線能力
  - H3：驗證詳細代碼快速對照
  - H2：閘道服務未執行
  - H2：macOS 閘道靜默停止回應，接著在你碰觸儀表板時恢復
  - H2：閘道在高記憶體使用期間退出
  - H2：閘道拒絕無效設定
  - H2：閘道探測警告
  - H2：頻道已連線，但訊息未流動
  - H2：排程與心跳偵測傳遞
  - H2：節點已配對，工具失敗
  - H2：瀏覽器工具失敗
  - H2：如果你升級後某些東西突然故障
  - H2：相關

## gateway/trusted-proxy-auth.md

- 路由：/gateway/trusted-proxy-auth
- 標題：
  - H2：使用時機
  - H2：不應使用的時機
  - H2：運作方式
  - H2：設定
  - H3：設定參考
  - H2：控制 UI 配對行為
  - H2：操作員範圍標頭
  - H2：TLS 終止與 HSTS
  - H3：推出指引
  - H2：代理設定範例
  - H2：混合權杖設定
  - H2：安全清單
  - H2：安全稽核
  - H2：疑難排解
  - H2：從權杖驗證遷移
  - H2：相關

## help/debugging.md

- 路由：/help/debugging
- 標題：
  - H2：執行階段除錯覆寫
  - H2：工作階段追蹤輸出
  - H2：外掛生命週期追蹤
  - H2：命令列介面啟動與命令剖析
  - H2：閘道監看模式
  - H2：開發設定檔 + 開發閘道（--dev）
  - H2：原始串流記錄
  - H2：安全注意事項
  - H2：在 VSCode 中除錯
  - H3：設定
  - H3：注意事項
  - H2：相關

## help/environment.md

- 路由：/help/environment
- 標題：
  - H2：優先順序（由高到低）
  - H2：提供者憑證與工作區 .env
  - H2：設定 env 區塊
  - H2：Shell env 匯入
  - H2：Exec shell 快照
  - H2：執行階段注入的 env vars
  - H2：UI env vars
  - H2：設定中的 Env var 替換
  - H2：Secret refs 與 ${ENV} 字串
  - H2：路徑相關 env vars
  - H2：記錄
  - H3：OPENCLAWHOME
  - H2：nvm 使用者：webfetch TLS 失敗
  - H2：舊版環境變數
  - H2：相關

## help/faq-first-run.md

- 路由：/help/faq-first-run
- 標題：
  - H2：快速開始與首次執行設定
  - H2：相關

## help/faq-models.md

- 路由：/help/faq-models
- 標題：
  - H2：模型：預設值、選擇、別名、切換
  - H2：模型容錯移轉與「All models failed」
  - H2：驗證設定檔：它們是什麼，以及如何管理
  - H2：相關

## help/faq.md

- 路由：/help/faq
- 標題：
  - H2：如果有東西故障，先做的 60 秒檢查
  - H2：快速開始與首次執行設定
  - H2：OpenClaw 是什麼？
  - H2：Skills 與自動化
  - H2：沙盒與記憶體
  - H2：磁碟上的位置
  - H2：設定基礎
  - H2：遠端閘道與節點
  - H2：Env vars 與 .env 載入
  - H2：工作階段與多個聊天
  - H2：模型、容錯移轉與驗證設定檔
  - H2：閘道：連接埠、「已在執行」與遠端模式
  - H2：記錄與除錯
  - H2：媒體與附件
  - H2：安全與存取控制
  - H2：聊天命令、中止任務與「它不會停止」
  - H2：其他
  - H2：相關

## help/index.md

- 路由：/help
- 標題：
  - H2：常見問題
  - H2：診斷
  - H2：測試
  - H2：社群與中繼

## help/scripts.md

- 路由：/help/scripts
- 標題：
  - H2：慣例
  - H2：驗證監控指令碼
  - H2：GitHub 讀取輔助工具
  - H2：新增指令碼時
  - H2：相關

## help/testing-live.md

- 路由：/help/testing-live
- 標題：
  - H2：即時：本機煙霧測試命令
  - H2：即時：Android 節點能力掃描
  - H2：即時：模型煙霧測試（設定檔金鑰）
  - H3：第 1 層：直接模型完成（無閘道）
  - H3：第 2 層：閘道 + 開發代理煙霧測試（「@openclaw」實際執行的內容）
  - H2：即時：命令列介面後端煙霧測試（Claude、Gemini 或其他本機命令列介面）
  - H2：即時：APNs HTTP/2 代理可達性
  - H2：即時：ACP 綁定煙霧測試（/acp spawn ... --bind here）
  - H2：即時：Codex app-server harness 煙霧測試
  - H3：建議的即時配方
  - H2：即時：模型矩陣（我們涵蓋的內容）
  - H3：彙總器 / 替代閘道
  - H2：憑證（切勿提交）
  - H2：Deepgram 即時（音訊轉錄）
  - H2：BytePlus 編碼計畫即時
  - H2：ComfyUI 工作流程媒體即時
  - H2：影像產生即時
  - H2：音樂產生即時
  - H2：影片產生即時
  - H2：媒體即時測試工具
  - H2：相關

## help/testing-updates-plugins.md

- 路由：/help/testing-updates-plugins
- 標題：
  - H2：我們保護的內容
  - H2：開發期間的本機證明
  - H2：Docker 路徑
  - H2：套件驗收
  - H2：發布預設
  - H2：舊版相容性
  - H2：新增覆蓋率
  - H2：失敗分流

## help/testing.md

- 路由：/help/testing
- 標題：
  - H2：快速開始
  - H2：測試暫存目錄
  - H2：即時與 Docker/Parallels 工作流程
  - H2：QA 專用執行器
  - H3：透過 Convex 共用 Telegram 憑證（v1）
  - H3：將頻道新增至 QA
  - H2：測試套件（在哪裡執行哪些內容）
  - H3：單元 / 整合（預設）
  - H3：穩定性（閘道）
  - H3：E2E（repo 彙總）
  - H3：E2E（閘道煙霧測試）
  - H3：E2E（控制 UI 模擬瀏覽器）
  - H3：E2E：OpenShell 後端煙霧測試
  - H3：即時（真實提供者 + 真實模型）
  - H2：我應該執行哪個套件？
  - H2：即時（會觸及網路）測試
  - H2：Docker 執行器（選用的「在 Linux 可用」檢查）
  - H2：文件健全性
  - H2：離線迴歸（CI 安全）
  - H2：代理可靠性評估（Skills）
  - H2：合約測試（外掛與頻道形狀）
  - H3：命令
  - H3：頻道合約
  - H3：提供者合約
  - H3：執行時機
  - H2：新增迴歸（指引）
  - H2：相關

## help/troubleshooting.md

- 路由：/help/troubleshooting
- 標題：
  - H2：前 60 秒
  - H2：助理感覺受限或缺少工具
  - H2：Anthropic 長上下文 429
  - H2：本機 OpenAI 相容後端可直接運作，但在 OpenClaw 中失敗
  - H2：外掛安裝因缺少 openclaw extensions 而失敗
  - H2：安裝政策封鎖外掛安裝或更新
  - H2：外掛存在但因可疑擁有權而被封鎖
  - H2：決策樹
  - H2：相關

## index.md

- 路由：/
- 標題：
  - H1：OpenClaw 🦞
  - H2：OpenClaw 是什麼？
  - H2：運作方式
  - H2：主要能力
  - H2：快速開始
  - H2：儀表板
  - H2：設定（選用）
  - H2：從這裡開始
  - H2：深入了解

## install/ansible.md

- 路由：/install/ansible
- 標題：
  - H2：先決條件
  - H2：你會取得的內容
  - H2：快速開始
  - H2：會安裝的內容
  - H2：安裝後設定
  - H3：快速命令
  - H2：安全架構
  - H2：手動安裝
  - H2：更新
  - H2：疑難排解
  - H2：進階設定
  - H2：相關

## install/azure.md

- 路由：/install/azure
- 標題：
  - H2：你將執行的事項
  - H2：你需要的項目
  - H2：設定部署
  - H2：部署 Azure 資源
  - H2：安裝 OpenClaw
  - H2：成本考量
  - H2：清理
  - H2：後續步驟
  - H2：相關

## install/bun.md

- 路由：/install/bun
- 標題：
  - H2：安裝
  - H2：生命週期腳本
  - H2：注意事項
  - H2：相關

## install/clawdock.md

- 路由：/install/clawdock
- 標題：
  - H2：安裝
  - H2：你會取得的內容
  - H3：基本操作
  - H3：容器存取
  - H3：網頁 UI 與配對
  - H3：設定與維護
  - H3：工具
  - H2：首次流程
  - H2：設定與密鑰
  - H2：相關

## install/development-channels.md

- 路由：/install/development-channels
- 標題：
  - H2：切換通道
  - H2：一次性版本或標籤目標
  - H2：試執行
  - H2：外掛與通道
  - H2：檢查目前狀態
  - H2：標記最佳實務
  - H2：macOS app 可用性
  - H2：相關

## install/digitalocean.md

- 路由：/install/digitalocean
- 標題：
  - H2：先決條件
  - H2：設定
  - H2：持久化與備份
  - H2：1 GB RAM 提示
  - H2：疑難排解
  - H2：後續步驟
  - H2：相關

## install/docker-vm-runtime.md

- 路由：/install/docker-vm-runtime
- 標題：
  - H2：將必要二進位檔烘焙到映像檔中
  - H2：建置並啟動
  - H2：哪些內容會保存在哪裡
  - H2：更新
  - H2：相關

## install/docker.md

- 路由：/install/docker
- 標題：
  - H2：先決條件
  - H2：容器化閘道
  - H3：手動流程
  - H3：環境變數
  - H3：可觀測性
  - H3：健康檢查
  - H3：LAN 與 loopback
  - H3：主機本機提供者
  - H3：Docker 中的 Claude 命令列介面後端
  - H3：Bonjour / mDNS
  - H3：儲存與持久化
  - H3：Shell 輔助工具（選用）
  - H3：在 VPS 上執行？
  - H2：代理沙箱
  - H3：快速啟用
  - H2：疑難排解
  - H2：相關

## install/exe-dev.md

- 路由：/install/exe-dev
- 標題：
  - H2：你需要的項目
  - H2：初學者快速路徑
  - H2：使用 Shelley 自動安裝
  - H2：手動安裝
  - H2：遠端通道設定
  - H2：遠端存取
  - H2：更新
  - H2：相關

## install/fly.md

- 路由：/install/fly
- 標題：
  - H2：你需要的項目
  - H2：初學者快速路徑
  - H2：疑難排解
  - H3："App 未在預期位址上監聽"
  - H3：健康檢查失敗 / 連線遭拒
  - H3：OOM / 記憶體問題
  - H3：閘道鎖定問題
  - H3：未讀取設定
  - H3：透過 SSH 寫入設定
  - H3：狀態未持久保存
  - H2：更新
  - H3：更新機器命令
  - H2：私人部署（強化）
  - H3：何時使用私人部署
  - H3：設定
  - H3：存取私人部署
  - H3：使用私人部署的 Webhooks
  - H3：安全性取捨
  - H2：備註
  - H2：成本
  - H2：後續步驟
  - H2：相關

## install/gcp.md

- 路由：/install/gcp
- 標題：
  - H2：你需要的項目
  - H2：快速路徑
  - H2：疑難排解
  - H2：服務帳戶（安全性最佳實務）
  - H2：後續步驟
  - H2：相關

## install/hetzner.md

- 路由：/install/hetzner
- 標題：
  - H2：你需要的項目
  - H2：快速路徑
  - H2：基礎架構即程式碼（Terraform）
  - H2：後續步驟
  - H2：相關

## install/hostinger.md

- 路由：/install/hostinger
- 標題：
  - H2：先決條件
  - H2：選項 A：一鍵 OpenClaw
  - H2：選項 B：在 VPS 上執行 OpenClaw
  - H2：驗證你的設定
  - H2：疑難排解
  - H2：後續步驟
  - H2：相關

## install/index.md

- 路由：/install
- 標題：
  - H2：系統需求
  - H2：建議：安裝程式腳本
  - H2：替代安裝方式
  - H3：本機前綴安裝程式（install-cli.sh）
  - H3：npm、pnpm 或 bun
  - H3：從原始碼
  - H3：從 GitHub main checkout 安裝
  - H3：容器與套件管理器
  - H2：驗證安裝
  - H2：託管與部署
  - H2：更新、遷移或解除安裝
  - H2：疑難排解：找不到 openclaw

## install/installer.md

- 路由：/install/installer
- 標題：
  - H2：快速命令
  - H2：install.sh
  - H3：流程（install.sh）
  - H3：原始碼 checkout 偵測
  - H3：範例（install.sh）
  - H2：install-cli.sh
  - H3：流程（install-cli.sh）
  - H3：範例（install-cli.sh）
  - H2：install.ps1
  - H3：流程（install.ps1）
  - H3：範例（install.ps1）
  - H2：CI 與自動化
  - H2：疑難排解
  - H2：相關

## install/kubernetes.md

- 路由：/install/kubernetes
- 標題：
  - H2：為何不用 Helm
  - H2：你需要的項目
  - H2：快速開始
  - H2：使用 Kind 進行本機測試
  - H2：逐步說明
  - H3：1) 部署
  - H3：2) 存取閘道
  - H2：會部署的內容
  - H2：自訂
  - H3：代理指示
  - H3：閘道設定
  - H3：新增提供者
  - H3：自訂命名空間
  - H3：自訂映像檔
  - H3：透過 port-forward 以外方式公開
  - H2：重新部署
  - H2：拆除
  - H2：架構備註
  - H2：檔案結構
  - H2：相關

## install/macos-vm.md

- 路由：/install/macos-vm
- 標題：
  - H2：建議預設值（多數使用者）
  - H2：macOS VM 選項
  - H3：Apple Silicon Mac 上的本機 VM（Lume）
  - H3：託管 Mac 提供者（雲端）
  - H2：快速路徑（Lume，進階使用者）
  - H2：你需要的項目（Lume）
  - H2：1) 安裝 Lume
  - H2：2) 建立 macOS VM
  - H2：3) 完成設定輔助程式
  - H2：4) 取得 VM IP 位址
  - H2：5) 透過 SSH 進入 VM
  - H2：6) 安裝 OpenClaw
  - H2：7) 設定通道
  - H2：8) 以無頭模式執行 VM
  - H2：加值：iMessage 整合
  - H2：儲存黃金映像檔
  - H2：24/7 執行
  - H2：疑難排解
  - H2：相關文件

## install/migrating-claude.md

- 路由：/install/migrating-claude
- 標題：
  - H2：兩種匯入方式
  - H2：會匯入的內容
  - H2：僅保留在封存中的內容
  - H2：來源選擇
  - H2：建議流程
  - H2：衝突處理
  - H2：自動化用 JSON 輸出
  - H2：疑難排解
  - H2：相關

## install/migrating-hermes.md

- 路由：/install/migrating-hermes
- 標題：
  - H2：兩種匯入方式
  - H2：會匯入的內容
  - H2：僅保留在封存中的內容
  - H2：建議流程
  - H2：衝突處理
  - H2：密鑰
  - H2：自動化用 JSON 輸出
  - H2：疑難排解
  - H2：相關

## install/migrating.md

- 路由：/install/migrating
- 標題：
  - H2：從另一個代理系統匯入
  - H2：將 OpenClaw 移至新機器
  - H3：遷移步驟
  - H3：常見陷阱
  - H3：驗證檢查清單
  - H2：就地升級外掛
  - H2：相關

## install/nix.md

- 路由：/install/nix
- 標題：
  - H2：你會取得的內容
  - H2：快速開始
  - H2：Nix 模式執行階段行為
  - H3：Nix 模式中的變更
  - H3：設定與狀態路徑
  - H3：服務 PATH 探索
  - H2：相關

## install/node.md

- 路由：/install/node
- 標題：
  - H2：檢查你的版本
  - H2：安裝節點
  - H2：疑難排解
  - H3：openclaw: command not found
  - H3：npm install -g 的權限錯誤（Linux）
  - H2：相關

## install/northflank.mdx

- 路由：/install/northflank
- 標題：
  - H2：如何開始
  - H2：你會取得的內容
  - H2：連接通道
  - H2：後續步驟

## install/oracle.md

- 路由：/install/oracle
- 標題：
  - H2：先決條件
  - H2：設定
  - H2：驗證安全態勢
  - H2：ARM 備註
  - H2：持久化與備份
  - H2：備援：SSH 通道
  - H2：疑難排解
  - H2：後續步驟
  - H2：相關

## install/podman.md

- 路由：/install/podman
- 標題：
  - H2：先決條件
  - H2：快速開始
  - H2：Podman 與 Tailscale
  - H2：Systemd（Quadlet，選用）
  - H2：設定、env 與儲存
  - H2：實用命令
  - H2：疑難排解
  - H2：相關

## install/railway.mdx

- 路由：/install/railway
- 標題：
  - H2：一鍵部署
  - H2：你會取得的內容
  - H2：連接通道
  - H2：備份與遷移
  - H2：後續步驟

## install/raspberry-pi.md

- 路由：/install/raspberry-pi
- 標題：
  - H2：硬體相容性
  - H2：先決條件
  - H2：設定
  - H2：效能提示
  - H2：建議模型設定
  - H2：ARM 二進位檔備註
  - H2：持久化與備份
  - H2：疑難排解
  - H2：後續步驟
  - H2：相關

## install/render.mdx

- 路由：/install/render
- 標題：
  - H2：先決條件
  - H2：部署
  - H2：Blueprint
  - H2：選擇方案
  - H2：部署後
  - H3：存取控制 UI
  - H3：日誌
  - H3：Shell 存取
  - H3：環境變數
  - H3：自動部署
  - H2：自訂網域
  - H2：擴展
  - H2：備份與遷移
  - H2：疑難排解
  - H3：服務無法啟動
  - H3：冷啟動緩慢（免費層）
  - H3：重新部署後資料遺失
  - H3：健康檢查失敗
  - H2：後續步驟

## install/uninstall.md

- 路由：/install/uninstall
- 標題：
  - H2：簡易路徑（命令列介面仍已安裝）
  - H2：手動移除服務（未安裝命令列介面）
  - H3：macOS（launchd）
  - H3：Linux（systemd 使用者單元）
  - H3：Windows（排程工作）
  - H2：一般安裝與原始碼 checkout
  - H3：一般安裝（install.sh / npm / pnpm / bun）
  - H3：原始碼 checkout（git clone）
  - H2：相關

## install/updating.md

- 路由：/install/updating
- 標題：
  - H2：建議：openclaw update
  - H2：在 npm 與 git 安裝之間切換
  - H2：替代方案：重新執行安裝程式
  - H2：替代方案：手動 npm、pnpm 或 bun
  - H3：進階 npm 安裝主題
  - H2：自動更新程式
  - H2：更新後
  - H3：執行 doctor
  - H3：重新啟動閘道
  - H3：驗證
  - H2：回復
  - H3：釘選版本（npm）
  - H3：釘選 commit（原始碼）
  - H2：如果你卡住
  - H2：相關

## install/upstash.md

- 路由：/install/upstash
- 標題：
  - H2：先決條件
  - H2：建立 Box
  - H2：使用 SSH 通道連線
  - H2：安裝 OpenClaw
  - H2：執行 onboarding
  - H2：啟動閘道
  - H2：自動重新啟動
  - H2：疑難排解
  - H2：相關

## logging.md

- 路由：/logging
- 標題：
  - H2：日誌所在位置
  - H2：如何讀取日誌
  - H3：命令列介面：即時 tail（建議）
  - H3：控制 UI（web）
  - H3：僅通道日誌
  - H2：日誌格式
  - H3：檔案日誌（JSONL）
  - H3：主控台輸出
  - H3：閘道 WebSocket 日誌
  - H2：設定日誌記錄
  - H3：日誌層級
  - H3：目標模型傳輸診斷
  - H3：追蹤關聯
  - H3：模型呼叫大小與時間
  - H3：主控台樣式
  - H3：修訂
  - H2：診斷與 OpenTelemetry
  - H2：疑難排解提示
  - H2：相關

## maturity/scorecard.md

- 路由：/maturity/scorecard
- 標題：
  - H1：成熟度記分卡
  - H2：此頁用途
  - H2：概覽
  - H2：分數區間
  - H2：表面探索器
  - H2：QA 證據摘要
  - H3：依區域區分的就緒度

## maturity/taxonomy.md

- 路由：/maturity/taxonomy
- 標題：
  - H1：成熟度分類法
  - H2：如何閱讀此頁
  - H2：成熟度等級
  - H2：產品區域
  - H2：詳細資料
  - H3：核心
  - H3：平台
  - H3：通道
  - H3：提供者與工具

## network.md

- 路由：/network
- 標題：
  - H2：核心模型
  - H2：配對 + 身分
  - H2：探索 + 傳輸
  - H2：節點 + 傳輸
  - H2：安全性
  - H2：相關

## nodes/audio.md

- 路由：/nodes/audio
- 標題：
  - H2：功能說明
  - H2：自動偵測（預設）
  - H2：設定範例
  - H3：提供者 + 命令列介面備援（OpenAI + Whisper 命令列介面）
  - H3：僅提供者並使用範圍閘控
  - H3：僅提供者（Deepgram）
  - H3：僅提供者（Mistral Voxtral）
  - H3：僅提供者（SenseAudio）
  - H3：將逐字稿回顯到聊天（選擇加入）
  - H2：備註與限制
  - H3：Proxy 環境支援
  - H2：群組中的提及偵測
  - H2：注意事項
  - H2：相關

## nodes/camera.md

- 路由：/nodes/camera
- 標題：
  - H2: iOS 節點
  - H3: iOS 使用者設定
  - H3: iOS 命令（透過 Gateway node.invoke）
  - H3: iOS 前景要求
  - H3: 命令列介面輔助工具
  - H2: Android 節點
  - H3: Android 使用者設定
  - H3: 權限
  - H3: Android 前景要求
  - H3: Android 命令（透過 Gateway node.invoke）
  - H2: macOS app
  - H3: macOS 使用者設定
  - H3: 命令列介面輔助工具（node invoke）
  - H2: 安全性 + 實務限制
  - H2: macOS 螢幕影片（作業系統層級）
  - H2: 相關

## nodes/images.md

- 路由：/nodes/images
- 標題：
  - H2: 目標
  - H2: 命令列介面介面
  - H2: WhatsApp Web 頻道行為
  - H2: 自動回覆管線
  - H2: 傳入媒體轉為命令
  - H2: 限制與錯誤
  - H2: 測試注意事項
  - H2: 相關

## nodes/index.md

- 路由：/nodes
- 標題：
  - H2: 配對 + 狀態
  - H2: 遠端節點主機（system.run）
  - H3: 啟動節點主機（前景）
  - H3: 透過 SSH 通道的遠端 Gateway（loopback 繫結）
  - H3: 啟動節點主機（服務）
  - H3: 配對 + 命名
  - H3: 將命令加入允許清單
  - H3: 將 exec 指向節點
  - H3: 本機模型推論
  - H2: 叫用命令
  - H2: 命令政策
  - H2: 設定（openclaw.json）
  - H2: 螢幕截圖（canvas 快照）
  - H3: Canvas 控制項
  - H3: A2UI（Canvas）
  - H2: 照片 + 影片（節點相機）
  - H2: 螢幕錄製（節點）
  - H2: 位置（節點）
  - H2: SMS（Android 節點）
  - H2: 裝置與個人資料命令
  - H2: 系統命令（節點主機 / Mac 節點）
  - H2: Exec 節點繫結
  - H2: 權限對照表
  - H2: 無頭節點主機（跨平台）
  - H2: Mac 節點模式

## nodes/location-command.md

- 路由：/nodes/location-command
- 標題：
  - H2: TL;DR
  - H2: 為什麼使用選擇器（而不只是開關）
  - H2: 設定模型
  - H2: 權限對應（node.permissions）
  - H2: 命令：location.get
  - H2: 背景行為
  - H2: 模型/工具整合
  - H2: 使用者體驗文案（建議）
  - H2: 相關

## nodes/media-understanding.md

- 路由：/nodes/media-understanding
- 標題：
  - H2: 運作方式
  - H2: 設定
  - H3: 模型項目
  - H3: 供應商憑證
  - H2: 規則與行為
  - H3: 自動偵測（預設）
  - H3: Proxy 支援（音訊/影片供應商呼叫）
  - H2: 功能
  - H2: 供應商支援矩陣
  - H2: 模型選擇指南
  - H2: 附件政策
  - H3: 檔案附件擷取
  - H2: 設定範例
  - H2: 狀態輸出
  - H2: 注意事項
  - H2: 相關

## nodes/talk.md

- 路由：/nodes/talk
- 標題：
  - H2: 行為（macOS）
  - H2: 回覆中的語音指令
  - H2: 設定（/.openclaw/openclaw.json）
  - H2: macOS UI
  - H2: Android UI
  - H2: 注意事項
  - H2: 相關

## nodes/troubleshooting.md

- 路由：/nodes/troubleshooting
- 標題：
  - H2: 命令階梯
  - H2: 前景要求
  - H2: 權限矩陣
  - H2: 配對與核准
  - H2: 常見節點錯誤碼
  - H2: 快速復原循環
  - H2: 相關

## nodes/voicewake.md

- 路由：/nodes/voicewake
- 標題：
  - H2: 儲存
  - H2: 協定
  - H3: 觸發清單
  - H3: 路由（觸發到目標）
  - H3: 事件
  - H2: 用戶端行為
  - H2: 相關

## openclaw-agent-runtime.md

- 路由：/openclaw-agent-runtime
- 標題：
  - H2: 型別檢查與 linting
  - H2: 執行 Agent Runtime 測試
  - H2: 手動測試
  - H2: 乾淨狀態重設
  - H2: 參考資料
  - H2: 相關

## perplexity.md

- 路由：/perplexity
- 標題：
  - H2: 相關

## plan/codex-context-engine-harness.md

- 路由：/plan/codex-context-engine-harness
- 標題：
  - H2: 狀態
  - H2: 目標
  - H2: 非目標
  - H2: 目前架構
  - H2: 目前缺口
  - H2: 期望行為
  - H2: 設計限制
  - H3: Codex app-server 仍是原生對話串狀態的權威來源
  - H3: Context engine 組裝必須投射到 Codex 輸入
  - H3: Prompt-cache 穩定性很重要
  - H3: Runtime 選擇語意不變
  - H2: 實作計畫
  - H3: 1. 匯出或重新定位可重用的 context-engine 嘗試輔助工具
  - H3: 2. 新增 Codex context 投射輔助工具
  - H3: 3. 在 Codex 對話串啟動前接上 bootstrap
  - H3: 4. 在 thread/start / thread/resume 和 turn/start 前接上 assemble
  - H3: 5. 保留 prompt-cache 穩定格式
  - H3: 6. 在 transcript 鏡像後接上 post-turn
  - H3: 7. 正規化 usage 與 prompt-cache runtime context
  - H3: 8. 壓縮政策
  - H4: /compact 與明確的 OpenClaw 壓縮
  - H4: 回合內 Codex 原生 contextCompaction 事件
  - H3: 9. 工作階段重設與繫結行為
  - H3: 10. 錯誤處理
  - H2: 測試計畫
  - H3: 單元測試
  - H3: 需要更新的現有測試
  - H3: 整合 / live 測試
  - H2: 可觀測性
  - H2: 遷移 / 相容性
  - H2: 未決問題
  - H2: 驗收標準

## plan/ui-channels.md

- 路由：/plan/ui-channels
- 標題：
  - H2: 狀態
  - H2: 問題
  - H2: 目標
  - H2: 非目標
  - H2: 目標模型
  - H2: 傳遞中繼資料
  - H2: Runtime 功能合約
  - H2: 頻道對應
  - H2: 重構步驟
  - H2: 測試
  - H2: 未決問題
  - H2: 相關

## platforms/android.md

- 路由：/platforms/android
- 標題：
  - H2: 支援快照
  - H2: 連線操作手冊
  - H3: 先決條件
  - H3: 1. 啟動 Gateway
  - H3: 2. 驗證探索（選用）
  - H4: 透過單播 DNS-SD 進行跨網路探索
  - H3: 3. 從 Android 連線
  - H3: 存活存在信標
  - H3: 4. 核准配對（命令列介面）
  - H3: 5. 驗證節點已連線
  - H3: 6. 聊天 + 歷史記錄
  - H3: 7. Canvas + 相機
  - H4: Gateway Canvas Host（建議用於 Web 內容）
  - H3: 8. 語音 + 擴充的 Android 命令介面
  - H2: 助理進入點
  - H2: 通知轉送
  - H2: 相關

## platforms/digitalocean.md

- 路由：/platforms/digitalocean
- 標題：
  - H2: 相關

## platforms/easyrunner.md

- 路由：/platforms/easyrunner
- 標題：
  - H2: 開始之前
  - H2: Compose app
  - H2: 設定 OpenClaw
  - H2: 驗證
  - H2: 更新與備份
  - H2: 疑難排解

## platforms/index.md

- 路由：/platforms
- 標題：
  - H2: 選擇你的作業系統
  - H2: VPS 與託管
  - H2: 常用連結
  - H2: Gateway 服務安裝（命令列介面）
  - H2: 相關

## platforms/ios.md

- 路由：/platforms/ios
- 標題：
  - H2: 功能
  - H2: 需求
  - H2: 快速開始（配對 + 連線）
  - H2: 官方組建的 relay-backed 推播
  - H2: 背景存活信標
  - H2: 驗證與信任流程
  - H2: 探索路徑
  - H3: Bonjour（LAN）
  - H3: Tailnet（跨網路）
  - H3: 手動主機/連接埠
  - H2: Canvas + A2UI
  - H2: Computer Use 關係
  - H3: Canvas eval / snapshot
  - H2: Voice wake + talk 模式
  - H2: 常見錯誤
  - H2: 相關文件

## platforms/linux.md

- 路由：/platforms/linux
- 標題：
  - H2: 快速路徑（VPS）
  - H2: 安裝
  - H2: Gateway 服務（systemd）
  - H2: 記憶體壓力與 OOM 終止
  - H2: 相關

## platforms/mac/bundled-gateway.md

- 路由：/platforms/mac/bundled-gateway
- 標題：
  - H2: 自動設定
  - H2: 手動復原
  - H2: Launchd（Gateway 作為 LaunchAgent）
  - H2: 版本相容性
  - H2: macOS 上的狀態目錄
  - H2: 偵錯 app 連線能力
  - H2: 煙霧檢查
  - H2: 相關

## platforms/mac/canvas.md

- 路由：/platforms/mac/canvas
- 標題：
  - H2: Canvas 所在位置
  - H2: 面板行為
  - H2: Agent API 介面
  - H2: Canvas 中的 A2UI
  - H3: A2UI 命令（v0.8）
  - H2: 從 Canvas 觸發 agent run
  - H2: 安全性注意事項
  - H2: 相關

## platforms/mac/child-process.md

- 路由：/platforms/mac/child-process
- 標題：
  - H2: 預設行為（launchd）
  - H2: 未簽署的開發組建
  - H2: 僅附加模式
  - H2: 遠端模式
  - H2: 為什麼我們偏好 launchd
  - H2: 相關

## platforms/mac/dev-setup.md

- 路由：/platforms/mac/dev-setup
- 標題：
  - H1: macOS 開發者設定
  - H2: 先決條件
  - H2: 1. 安裝相依套件
  - H2: 2. 建置並封裝 app
  - H2: 3. 安裝命令列介面與 Gateway
  - H2: 疑難排解
  - H3: 建置失敗：工具鏈或 SDK 不相符
  - H3: 授予權限時 app 當機
  - H3: Gateway 無限期顯示「Starting...」
  - H2: 相關

## platforms/mac/health.md

- 路由：/platforms/mac/health
- 標題：
  - H1: macOS 上的健康檢查
  - H2: 選單列
  - H2: 設定
  - H2: 探測的運作方式
  - H2: 無法判斷時
  - H2: 相關

## platforms/mac/icon.md

- 路由：/platforms/mac/icon
- 標題：
  - H1: 選單列圖示狀態
  - H2: 狀態
  - H2: Voice wake ears
  - H2: 形狀與大小
  - H2: 行為注意事項
  - H2: 相關

## platforms/mac/logging.md

- 路由：/platforms/mac/logging
- 標題：
  - H1: 記錄（macOS）
  - H2: 輪替診斷檔案記錄（偵錯窗格）
  - H2: macOS 上的統一記錄私人資料
  - H2: 為 OpenClaw 啟用（ai.openclaw）
  - H2: 偵錯後停用
  - H2: 相關

## platforms/mac/menu-bar.md

- 路由：/platforms/mac/menu-bar
- 標題：
  - H2: 顯示內容
  - H2: 狀態模型
  - H2: IconState enum（Swift）
  - H3: ActivityKind -&gt; 徽章符號
  - H3: 視覺對應
  - H2: 內容子選單
  - H2: 狀態列文字（選單）
  - H2: 事件擷取
  - H2: 偵錯覆寫
  - H2: 測試檢查清單
  - H2: 相關

## platforms/mac/peekaboo.md

- 路由：/platforms/mac/peekaboo
- 標題：
  - H2: 這是什麼（以及不是什麼）
  - H2: 與其他桌面控制路徑的關係
  - H2: 啟用橋接
  - H2: 用戶端探索順序
  - H2: 安全性與權限
  - H2: 快照行為（自動化）
  - H2: 疑難排解
  - H2: 相關

## platforms/mac/permissions.md

- 路由：/platforms/mac/permissions
- 標題：
  - H2: 穩定權限的要求
  - H2: Node 與命令列介面 runtime 的輔助使用授權
  - H2: 提示消失時的復原檢查清單
  - H2: 檔案與資料夾權限（桌面/文件/下載）
  - H2: 相關

## platforms/mac/remote.md

- 路由：/platforms/mac/remote
- 標題：
  - H2: 模式
  - H2: 遠端傳輸
  - H2: 遠端主機上的先決條件
  - H2: macOS app 設定
  - H2: Web Chat
  - H2: 權限
  - H2: 安全性注意事項
  - H2: WhatsApp 登入流程（遠端）
  - H2: 疑難排解
  - H2: 通知音效
  - H2: 相關

## platforms/mac/signing.md

- 路由：/platforms/mac/signing
- 標題：
  - H1: Mac 簽署（偵錯組建）
  - H2: 使用方式
  - H3: Ad-hoc 簽署注意事項
  - H2: 關於頁面的建置中繼資料
  - H2: 相關

## platforms/mac/skills.md

- 路由：/platforms/mac/skills
- 標題：
  - H2: 資料來源
  - H2: 安裝動作
  - H2: Env/API 金鑰
  - H2: 遠端模式
  - H2: 相關

## platforms/mac/voice-overlay.md

- 路由：/platforms/mac/voice-overlay
- 標題：
  - H1: 語音浮層生命週期（macOS）
  - H2: 行為
  - H2: 實作
  - H2: 記錄
  - H2: 偵錯檢查清單
  - H2: 相關

## platforms/mac/voicewake.md

- 路由：/platforms/mac/voicewake
- 標題：
  - H1: Voice Wake &amp; Push-to-Talk
  - H2: 需求
  - H2: 模式
  - H2: Runtime 行為（wake-word）
  - H2: 生命週期不變條件
  - H2: Push-to-talk 詳細資訊
  - H2: 使用者面向設定
  - H2: 轉送行為
  - H2: 轉送承載內容
  - H2: 快速驗證
  - H2: 相關

## platforms/mac/webchat.md

- 路由：/platforms/mac/webchat
- 標題：
  - H2: 啟動與偵錯
  - H2: 連接方式
  - H2: 安全性介面
  - H2: 已知限制
  - H2: 相關

## platforms/mac/xpc.md

- 路由：/platforms/mac/xpc
- 標題：
  - H1: OpenClaw macOS IPC 架構
  - H2: 目標
  - H2: 運作方式
  - H3: Gateway + 節點傳輸
  - H3: 節點服務 + app IPC
  - H3: PeekabooBridge（UI 自動化）
  - H2: 作業流程
  - H2: 強化注意事項
  - H2: 相關

## platforms/macos.md

- 路由：/platforms/macos
- 標題：
  - H2: 下載
  - H2: 首次執行
  - H2: 選擇 Gateway 模式
  - H2: app 負責的內容
  - H2: macOS 詳細頁面
  - H2: 相關

## platforms/oracle.md

- 路由：/platforms/oracle
- 標題：
  - H2: 相關

## platforms/raspberry-pi.md

- 路由：/platforms/raspberry-pi
- 標題：
  - H2：相關

## platforms/windows.md

- 路由：/platforms/windows
- 標題：
  - H2：建議：Windows Hub
  - H3：Windows Hub 包含什麼
  - H3：首次啟動
  - H2：Windows 節點模式
  - H2：本機 MCP 模式
  - H2：原生 Windows 命令列介面與閘道
  - H2：WSL2 閘道
  - H2：Windows 登入前自動啟動閘道
  - H2：透過 LAN 公開 WSL 服務
  - H2：疑難排解
  - H3：系統匣圖示未出現
  - H3：本機設定失敗
  - H3：應用程式顯示需要配對
  - H3：網頁聊天無法連到遠端閘道
  - H3：screen.snapshot、camera 或 audio 命令失敗
  - H3：Git 或 GitHub 連線失敗
  - H2：相關

## plugins/adding-capabilities.md

- 路由：/plugins/adding-capabilities
- 標題：
  - H2：何時建立能力
  - H2：標準順序
  - H2：什麼放在哪裡
  - H2：提供者與測試框架銜接點
  - H2：檔案檢查清單
  - H2：實作範例：圖片生成
  - H2：嵌入提供者
  - H2：審查檢查清單
  - H2：相關

## plugins/admin-http-rpc.md

- 路由：/plugins/admin-http-rpc
- 標題：
  - H2：啟用前
  - H2：啟用
  - H2：驗證路由
  - H2：驗證
  - H2：安全模型
  - H2：請求
  - H2：回應
  - H2：允許的方法
  - H2：WebSocket 比較
  - H2：疑難排解
  - H2：相關

## plugins/agent-tools.md

- 路由：/plugins/agent-tools
- 標題：
  - H2：相關

## plugins/architecture-internals.md

- 路由：/plugins/architecture-internals
- 標題：
  - H2：載入管線
  - H3：Manifest 優先行為
  - H3：外掛快取邊界
  - H2：登錄模型
  - H2：對話繫結回呼
  - H2：提供者執行階段鉤子
  - H3：鉤子順序與用法
  - H3：提供者範例
  - H3：內建範例
  - H2：執行階段輔助工具
  - H3：api.runtime.imageGeneration
  - H2：閘道 HTTP 路由
  - H2：外掛 SDK 匯入路徑
  - H2：訊息工具 schema
  - H2：頻道目標解析
  - H2：以設定支援的目錄
  - H2：提供者目錄
  - H2：唯讀頻道檢查
  - H2：套件包
  - H3：頻道目錄中繼資料
  - H2：上下文引擎外掛
  - H2：新增能力
  - H3：能力檢查清單
  - H3：能力範本
  - H2：相關

## plugins/architecture.md

- 路由：/plugins/architecture
- 標題：
  - H2：公開能力模型
  - H3：外部相容性立場
  - H3：外掛形態
  - H3：舊版鉤子
  - H3：相容性訊號
  - H2：架構總覽
  - H3：外掛中繼資料快照與查找表
  - H3：啟用規劃
  - H3：頻道外掛與共享訊息工具
  - H2：能力擁有權模型
  - H3：能力分層
  - H3：多能力公司外掛範例
  - H3：能力範例：影片理解
  - H2：合約與強制執行
  - H3：合約中應包含什麼
  - H2：執行模型
  - H2：匯出邊界
  - H2：內部機制與參考
  - H2：相關

## plugins/building-extensions.md

- 路由：/plugins/building-extensions
- 標題：
  - H2：相關

## plugins/building-plugins.md

- 路由：/plugins/building-plugins
- 標題：
  - H2：需求
  - H2：選擇外掛形態
  - H2：快速開始
  - H2：註冊工具
  - H2：匯入慣例
  - H2：提交前檢查清單
  - H2：針對 beta 版本測試
  - H2：後續步驟
  - H2：相關

## plugins/bundles.md

- 路由：/plugins/bundles
- 標題：
  - H2：為什麼需要 bundle
  - H2：安裝 bundle
  - H2：OpenClaw 從 bundle 對應什麼
  - H3：目前支援
  - H4：Skill 內容
  - H4：鉤子包
  - H4：嵌入式 OpenClaw 的 MCP
  - H4：嵌入式 OpenClaw 設定
  - H4：嵌入式 OpenClaw LSP
  - H3：已偵測但未執行
  - H2：Bundle 格式
  - H2：偵測優先順序
  - H2：執行階段依賴與清理
  - H2：安全性
  - H2：疑難排解
  - H2：相關

## plugins/cli-backend-plugins.md

- 路由：/plugins/cli-backend-plugins
- 標題：
  - H2：外掛擁有什麼
  - H2：最小後端外掛
  - H2：設定形態
  - H2：進階後端鉤子
  - H3：ownsNativeCompaction：選擇退出 OpenClaw 壓縮
  - H2：MCP 工具橋接
  - H2：使用者設定
  - H2：驗證
  - H2：檢查清單
  - H2：相關

## plugins/codex-computer-use.md

- 路由：/plugins/codex-computer-use
- 標題：
  - H2：OpenClaw.app 與 Peekaboo
  - H2：iOS 應用程式
  - H2：直接 cua-driver MCP
  - H2：快速設定
  - H2：命令
  - H2：Marketplace 選項
  - H2：內建 macOS marketplace
  - H2：遠端目錄限制
  - H2：設定參考
  - H2：OpenClaw 檢查什麼
  - H2：macOS 權限
  - H2：疑難排解
  - H2：相關

## plugins/codex-harness-reference.md

- 路由：/plugins/codex-harness-reference
- 標題：
  - H2：外掛設定介面
  - H2：App-server 傳輸
  - H2：核准與沙箱模式
  - H2：沙箱化原生執行
  - H2：驗證與環境隔離
  - H2：動態工具
  - H2：逾時
  - H2：模型探索
  - H2：工作區啟動檔案
  - H2：環境覆寫
  - H2：相關

## plugins/codex-harness-runtime.md

- 路由：/plugins/codex-harness-runtime
- 標題：
  - H2：總覽
  - H2：執行緒繫結與模型變更
  - H2：可見回覆與心跳偵測
  - H2：鉤子邊界
  - H2：V1 支援合約
  - H2：原生權限與 MCP elicitations
  - H2：佇列導向
  - H2：Codex 意見回饋上傳
  - H2：壓縮與逐字稿鏡像
  - H2：媒體與傳遞
  - H2：相關

## plugins/codex-harness.md

- 路由：/plugins/codex-harness
- 標題：
  - H2：需求
  - H2：快速開始
  - H2：與 Codex Desktop 和命令列介面共享執行緒
  - H2：設定
  - H3：壓縮
  - H2：驗證 Codex 執行階段
  - H2：路由與模型選擇
  - H2：部署模式
  - H3：基本 Codex 部署
  - H3：混合提供者部署
  - H3：Fail-closed Codex 部署
  - H2：App-server 政策
  - H2：命令與診斷
  - H3：在本機檢查 Codex 執行緒
  - H3：驗證順序
  - H3：環境隔離
  - H3：動態工具與網頁搜尋
  - H3：設定欄位
  - H3：動態工具呼叫逾時
  - H3：本機測試環境覆寫
  - H2：原生 Codex 外掛
  - H2：Computer Use
  - H2：執行階段邊界
  - H2：疑難排解
  - H2：相關

## plugins/codex-native-plugins.md

- 路由：/plugins/codex-native-plugins
- 標題：
  - H2：需求
  - H2：快速開始
  - H2：從聊天管理外掛
  - H2：原生外掛設定的運作方式
  - H2：V1 支援邊界
  - H2：應用程式清單與擁有權
  - H2：執行緒應用程式設定
  - H2：破壞性動作政策
  - H2：疑難排解
  - H2：相關

## plugins/community.md

- 路由：/plugins/community
- 標題：
  - H2：尋找外掛
  - H2：發布外掛
  - H2：相關

## plugins/compatibility.md

- 路由：/plugins/compatibility
- 標題：
  - H2：相容性登錄
  - H2：棄用政策
  - H2：目前相容性區域
  - H3：WhatsApp 傳入回呼扁平別名
  - H3：WhatsApp 傳入准入欄位
  - H2：外掛檢查器套件
  - H3：維護者接受通道
  - H2：版本資訊

## plugins/copilot.md

- 路由：/plugins/copilot
- 標題：
  - H2：需求
  - H2：安裝
  - H2：快速開始
  - H2：支援的提供者
  - H2：BYOK
  - H2：驗證
  - H2：設定介面
  - H2：壓縮
  - H2：逐字稿鏡像
  - H2：附帶問題（/btw）
  - H2：Doctor
  - H2：限制
  - H2：權限與 askuser
  - H3：工作階段層級 GitHub 權杖
  - H2：相關

## plugins/dependency-resolution.md

- 路由：/plugins/dependency-resolution
- 標題：
  - H2：責任分工
  - H2：安裝根目錄
  - H2：本機外掛
  - H2：啟動與重新載入
  - H2：內建外掛
  - H2：舊版清理

## plugins/google-meet.md

- 路由：/plugins/google-meet
- 標題：
  - H2：快速開始
  - H3：建立會議
  - H3：僅觀察加入
  - H3：即時工作階段健康狀態
  - H2：本機閘道 + Parallels Chrome
  - H3：常見失敗檢查
  - H2：安裝注意事項
  - H2：傳輸
  - H3：Chrome
  - H3：Twilio
  - H2：OAuth 與預檢
  - H3：建立 Google 憑證
  - H3：簽發 refresh token
  - H3：使用 doctor 驗證 OAuth
  - H3：解析、預檢並讀取成品
  - H3：即時煙霧測試
  - H3：建立範例
  - H2：設定
  - H3：預設值
  - H3：選用覆寫
  - H2：工具
  - H2：Agent 與雙向模式
  - H2：即時測試檢查清單
  - H2：疑難排解
  - H3：Agent 看不到 Google Meet 工具
  - H3：沒有已連線且支援 Google Meet 的節點
  - H3：瀏覽器開啟但 agent 無法加入
  - H3：會議建立失敗
  - H3：Agent 加入但不說話
  - H3：Twilio 設定檢查失敗
  - H3：Twilio 通話開始但從未進入會議
  - H2：注意事項
  - H2：相關

## plugins/hooks.md

- 路由：/plugins/hooks
- 標題：
  - H2：快速開始
  - H2：鉤子目錄
  - H2：偵錯執行階段鉤子
  - H2：工具呼叫政策
  - H3：Exec 環境鉤子
  - H3：工具結果持久化
  - H2：提示與模型鉤子
  - H3：工作階段擴充與下一輪注入
  - H2：訊息鉤子
  - H2：安裝鉤子
  - H2：閘道生命週期
  - H2：即將棄用項目
  - H2：相關

## plugins/install-overrides.md

- 路由：/plugins/install-overrides
- 標題：
  - H2：環境
  - H2：行為
  - H2：套件 E2E

## plugins/llama-cpp.md

- 路由：/plugins/llama-cpp
- 標題：
  - H2：設定
  - H2：原生執行階段
  - H2：疑難排解

## plugins/manage-plugins.md

- 路由：/plugins/manage-plugins
- 標題：
  - H2：列出與搜尋外掛
  - H2：啟用與停用外掛
  - H2：安裝外掛
  - H2：重新啟動與檢查
  - H2：更新外掛
  - H2：解除安裝外掛
  - H2：選擇來源
  - H2：發布外掛
  - H2：相關

## plugins/manifest.md

- 路由：/plugins/manifest
- 標題：
  - H2：此檔案的用途
  - H2：最小範例
  - H2：豐富範例
  - H2：頂層欄位參考
  - H2：生成提供者中繼資料參考
  - H2：工具中繼資料參考
  - H2：providerAuthChoices 參考
  - H2：commandAliases 參考
  - H2：activation 參考
  - H2：qaRunners 參考
  - H2：setup 參考
  - H3：setup.providers 參考
  - H3：setup 欄位
  - H2：uiHints 參考
  - H2：contracts 參考
  - H2：configContracts 參考
  - H2：mediaUnderstandingProviderMetadata 參考
  - H2：channelConfigs 參考
  - H3：取代另一個頻道外掛
  - H2：modelSupport 參考
  - H2：modelCatalog 參考
  - H2：modelIdNormalization 參考
  - H2：providerEndpoints 參考
  - H2：providerRequest 參考
  - H2：secretProviderIntegrations 參考
  - H2：modelPricing 參考
  - H3：OpenClaw Provider Index
  - H2：Manifest 與 package.json
  - H3：影響探索的 package.json 欄位
  - H2：探索優先順序（重複外掛 ID）
  - H2：JSON Schema 需求
  - H2：驗證行為
  - H2：注意事項
  - H2：相關

## plugins/memory-lancedb.md

- 路由：/plugins/memory-lancedb
- 標題：
  - H2：安裝
  - H2：快速開始
  - H2：嵌入設定
  - H3：維度
  - H2：Ollama embeddings
  - H2：回想與擷取限制
  - H2：命令
  - H2：儲存
  - H2：執行階段依賴與平台支援
  - H2：疑難排解
  - H3：輸入長度超過上下文長度
  - H3：不支援的嵌入模型
  - H3：外掛已載入但未出現任何記憶
  - H2：相關

## plugins/memory-wiki.md

- 路由：/plugins/memory-wiki
- 標題：
  - H2：Vault 模式
  - H2：Vault 版面配置
  - H2：Open Knowledge Format 匯入
  - H2：結構化聲明與證據
  - H2：面向 agent 的實體中繼資料
  - H2：編譯管線
  - H2：儀表板與健康狀態報告
  - H2：搜尋與擷取
  - H2：Agent 工具
  - H2：提示與上下文行為
  - H2：設定
  - H3：範例：QMD + 橋接模式
  - H2：命令列介面
  - H2：Obsidian 支援
  - H2：建議工作流程
  - H2：相關文件

## plugins/message-presentation.md

- 路由：/plugins/message-presentation
- 標題：
  - H2：合約
  - H2：產生者範例
  - H2：渲染器合約
  - H2：核心渲染流程
  - H2：降級規則
  - H3：按鈕值備援可見性
  - H2：供應商對應
  - H2：呈現與 InteractiveReply
  - H2：傳遞釘選
  - H2：外掛作者檢查清單
  - H2：相關文件

## plugins/oc-path.md

- 路由：/plugins/oc-path
- 標題：
  - H2：為何啟用
  - H2：執行位置
  - H2：啟用
  - H2：依賴項
  - H2：提供內容
  - H2：與其他外掛的關係
  - H2：安全性
  - H2：相關

## plugins/plugin-inventory.md

- 路由：/plugins/plugin-inventory
- 標題：
  - H1：外掛清單
  - H2：定義
  - H2：安裝外掛
  - H2：核心 npm 套件
  - H2：官方外部套件
  - H2：僅限原始碼簽出

## plugins/plugin-permission-requests.md

- 路由：/plugins/plugin-permission-requests
- 標題：
  - H2：選擇正確的閘門
  - H2：在工具呼叫前請求核准
  - H2：決策行為
  - H2：路由核准提示
  - H2：Codex 原生權限
  - H2：疑難排解
  - H2：相關

## plugins/reference.md

- 路由：/plugins/reference
- 標題：
  - H1：外掛參考

## plugins/reference/acpx.md

- 路由：/plugins/reference/acpx
- 標題：
  - H1：ACPx 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/admin-http-rpc.md

- 路由：/plugins/reference/admin-http-rpc
- 標題：
  - H1：Admin Http Rpc 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/alibaba.md

- 路由：/plugins/reference/alibaba
- 標題：
  - H1：Alibaba 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/amazon-bedrock-mantle.md

- 路由：/plugins/reference/amazon-bedrock-mantle
- 標題：
  - H1：Amazon Bedrock Mantle 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/amazon-bedrock.md

- 路由：/plugins/reference/amazon-bedrock
- 標題：
  - H1：Amazon Bedrock 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/anthropic-vertex.md

- 路由：/plugins/reference/anthropic-vertex
- 標題：
  - H1：Anthropic Vertex 外掛
  - H2：發行
  - H2：介面
  - H2：Claude Fable 5

## plugins/reference/anthropic.md

- 路由：/plugins/reference/anthropic
- 標題：
  - H1：Anthropic 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/arcee.md

- 路由：/plugins/reference/arcee
- 標題：
  - H1：Arcee 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/azure-speech.md

- 路由：/plugins/reference/azure-speech
- 標題：
  - H1：Azure Speech 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/bonjour.md

- 路由：/plugins/reference/bonjour
- 標題：
  - H1：Bonjour 外掛
  - H2：發行
  - H2：介面

## plugins/reference/brave.md

- 路由：/plugins/reference/brave
- 標題：
  - H1：Brave 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/browser.md

- 路由：/plugins/reference/browser
- 標題：
  - H1：Browser 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/byteplus.md

- 路由：/plugins/reference/byteplus
- 標題：
  - H1：BytePlus 外掛
  - H2：發行
  - H2：介面

## plugins/reference/canvas.md

- 路由：/plugins/reference/canvas
- 標題：
  - H1：Canvas 外掛
  - H2：發行
  - H2：介面

## plugins/reference/cerebras.md

- 路由：/plugins/reference/cerebras
- 標題：
  - H1：Cerebras 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/chutes.md

- 路由：/plugins/reference/chutes
- 標題：
  - H1：Chutes 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/clawrouter.md

- 路由：/plugins/reference/clawrouter
- 標題：
  - H1：ClawRouter 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/clickclack.md

- 路由：/plugins/reference/clickclack
- 標題：
  - H1：Clickclack 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/cloudflare-ai-gateway.md

- 路由：/plugins/reference/cloudflare-ai-gateway
- 標題：
  - H1：Cloudflare AI Gateway 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/codex-supervisor.md

- 路由：/plugins/reference/codex-supervisor
- 標題：
  - H1：Codex Supervisor 外掛
  - H2：發行
  - H2：介面
  - H2：工作階段清單

## plugins/reference/codex.md

- 路由：/plugins/reference/codex
- 標題：
  - H1：Codex 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/cohere.md

- 路由：/plugins/reference/cohere
- 標題：
  - H1：Cohere 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/comfy.md

- 路由：/plugins/reference/comfy
- 標題：
  - H1：ComfyUI 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/copilot-proxy.md

- 路由：/plugins/reference/copilot-proxy
- 標題：
  - H1：Copilot Proxy 外掛
  - H2：發行
  - H2：介面

## plugins/reference/copilot.md

- 路由：/plugins/reference/copilot
- 標題：
  - H1：Copilot 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/deepgram.md

- 路由：/plugins/reference/deepgram
- 標題：
  - H1：Deepgram 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/deepinfra.md

- 路由：/plugins/reference/deepinfra
- 標題：
  - H1：DeepInfra 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/deepseek.md

- 路由：/plugins/reference/deepseek
- 標題：
  - H1：DeepSeek 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/diagnostics-otel.md

- 路由：/plugins/reference/diagnostics-otel
- 標題：
  - H1：Diagnostics OpenTelemetry 外掛
  - H2：發行
  - H2：介面

## plugins/reference/diagnostics-prometheus.md

- 路由：/plugins/reference/diagnostics-prometheus
- 標題：
  - H1：Diagnostics Prometheus 外掛
  - H2：發行
  - H2：介面

## plugins/reference/diffs-language-pack.md

- 路由：/plugins/reference/diffs-language-pack
- 標題：
  - H1：Diffs Language Pack 外掛
  - H2：發行
  - H2：介面
  - H2：新增語言

## plugins/reference/diffs.md

- 路由：/plugins/reference/diffs
- 標題：
  - H1：Diffs 外掛
  - H2：發行
  - H2：介面

## plugins/reference/discord.md

- 路由：/plugins/reference/discord
- 標題：
  - H1：Discord 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/document-extract.md

- 路由：/plugins/reference/document-extract
- 標題：
  - H1：Document Extract 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/duckduckgo.md

- 路由：/plugins/reference/duckduckgo
- 標題：
  - H1：DuckDuckGo 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/elevenlabs.md

- 路由：/plugins/reference/elevenlabs
- 標題：
  - H1：Elevenlabs 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/exa.md

- 路由：/plugins/reference/exa
- 標題：
  - H1：Exa 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/fal.md

- 路由：/plugins/reference/fal
- 標題：
  - H1：fal 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/feishu.md

- 路由：/plugins/reference/feishu
- 標題：
  - H1：Feishu 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/file-transfer.md

- 路由：/plugins/reference/file-transfer
- 標題：
  - H1：File Transfer 外掛
  - H2：發行
  - H2：介面

## plugins/reference/firecrawl.md

- 路由：/plugins/reference/firecrawl
- 標題：
  - H1：Firecrawl 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/fireworks.md

- 路由：/plugins/reference/fireworks
- 標題：
  - H1：Fireworks 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/github-copilot.md

- 路由：/plugins/reference/github-copilot
- 標題：
  - H1：GitHub Copilot 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/gmi.md

- 路由：/plugins/reference/gmi
- 標題：
  - H1：Gmi 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/google-meet.md

- 路由：/plugins/reference/google-meet
- 標題：
  - H1：Google Meet 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/google.md

- 路由：/plugins/reference/google
- 標題：
  - H1：Google 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/googlechat.md

- 路由：/plugins/reference/googlechat
- 標題：
  - H1：Google Chat 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/gradium.md

- 路由：/plugins/reference/gradium
- 標題：
  - H1：Gradium 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/groq.md

- 路由：/plugins/reference/groq
- 標題：
  - H1：Groq 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/huggingface.md

- 路由：/plugins/reference/huggingface
- 標題：
  - H1：Hugging Face 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/imessage.md

- 路由：/plugins/reference/imessage
- 標題：
  - H1：iMessage 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/inworld.md

- 路由：/plugins/reference/inworld
- 標題：
  - H1：Inworld 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/irc.md

- 路由：/plugins/reference/irc
- 標題：
  - H1：IRC 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/kilocode.md

- 路由：/plugins/reference/kilocode
- 標題：
  - H1：Kilocode 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/kimi.md

- 路由：/plugins/reference/kimi
- 標題：
  - H1：Kimi 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/line.md

- 路由：/plugins/reference/line
- 標題：
  - H1：LINE 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/litellm.md

- 路由：/plugins/reference/litellm
- 標題：
  - H1：LiteLLM 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/llama-cpp.md

- 路由：/plugins/reference/llama-cpp
- 標題：
  - H1：Llama Cpp 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/llm-task.md

- 路由：/plugins/reference/llm-task
- 標題：
  - H1：LLM Task 外掛
  - H2：發行
  - H2：介面

## plugins/reference/lmstudio.md

- 路由：/plugins/reference/lmstudio
- 標題：
  - H1：LM Studio 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/lobster.md

- 路由：/plugins/reference/lobster
- 標題：
  - H1：Lobster 外掛
  - H2：發行
  - H2：介面

## plugins/reference/matrix.md

- 路由：/plugins/reference/matrix
- 標題：
  - H1：Matrix 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/mattermost.md

- 路由：/plugins/reference/mattermost
- 標題：
  - H1：Mattermost 外掛
  - H2：發行
  - H2：介面
  - H2：相關文件

## plugins/reference/memory-core.md

- 路由：/plugins/reference/memory-core
- 標題：
  - H1：Memory Core 外掛
  - H2：發行
  - H2：介面

## plugins/reference/memory-lancedb.md

- 路由: /plugins/reference/memory-lancedb
- 標題:
  - H1: Memory Lancedb 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/memory-wiki.md

- 路由: /plugins/reference/memory-wiki
- 標題:
  - H1: Memory Wiki 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/microsoft-foundry.md

- 路由: /plugins/reference/microsoft-foundry
- 標題:
  - H1: Microsoft Foundry 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 需求
  - H2: 聊天模型
  - H2: MAI 圖片生成
  - H2: 疑難排解

## plugins/reference/microsoft.md

- 路由: /plugins/reference/microsoft
- 標題:
  - H1: Microsoft 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/migrate-claude.md

- 路由: /plugins/reference/migrate-claude
- 標題:
  - H1: Migrate Claude 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/migrate-hermes.md

- 路由: /plugins/reference/migrate-hermes
- 標題:
  - H1: Migrate Hermes 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/minimax.md

- 路由: /plugins/reference/minimax
- 標題:
  - H1: MiniMax 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/mistral.md

- 路由: /plugins/reference/mistral
- 標題:
  - H1: Mistral 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/moonshot.md

- 路由: /plugins/reference/moonshot
- 標題:
  - H1: Moonshot 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/msteams.md

- 路由: /plugins/reference/msteams
- 標題:
  - H1: Microsoft Teams 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/nextcloud-talk.md

- 路由: /plugins/reference/nextcloud-talk
- 標題:
  - H1: Nextcloud Talk 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/nostr.md

- 路由: /plugins/reference/nostr
- 標題:
  - H1: Nostr 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/novita.md

- 路由: /plugins/reference/novita
- 標題:
  - H1: Novita 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/nvidia.md

- 路由: /plugins/reference/nvidia
- 標題:
  - H1: NVIDIA 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/oc-path.md

- 路由: /plugins/reference/oc-path
- 標題:
  - H1: Oc Path 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/ollama.md

- 路由: /plugins/reference/ollama
- 標題:
  - H1: Ollama 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/open-prose.md

- 路由: /plugins/reference/open-prose
- 標題:
  - H1: Open Prose 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/openai.md

- 路由: /plugins/reference/openai
- 標題:
  - H1: OpenAI 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/opencode-go.md

- 路由: /plugins/reference/opencode-go
- 標題:
  - H1: OpenCode Go 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/opencode.md

- 路由: /plugins/reference/opencode
- 標題:
  - H1: OpenCode 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/openrouter.md

- 路由: /plugins/reference/openrouter
- 標題:
  - H1: OpenRouter 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/openshell.md

- 路由: /plugins/reference/openshell
- 標題:
  - H1: Openshell 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/perplexity.md

- 路由: /plugins/reference/perplexity
- 標題:
  - H1: Perplexity 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/pixverse.md

- 路由: /plugins/reference/pixverse
- 標題:
  - H1: PixVerse 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/policy.md

- 路由: /plugins/reference/policy
- 標題:
  - H1: Policy 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 行為
  - H2: 相關文件

## plugins/reference/qa-channel.md

- 路由: /plugins/reference/qa-channel
- 標題:
  - H1: QA Channel 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/qa-lab.md

- 路由: /plugins/reference/qa-lab
- 標題:
  - H1: QA Lab 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/qa-matrix.md

- 路由: /plugins/reference/qa-matrix
- 標題:
  - H1: QA Matrix 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/qianfan.md

- 路由: /plugins/reference/qianfan
- 標題:
  - H1: Qianfan 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/qqbot.md

- 路由: /plugins/reference/qqbot
- 標題:
  - H1: QQ Bot 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/qwen.md

- 路由: /plugins/reference/qwen
- 標題:
  - H1: Qwen 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/raft.md

- 路由: /plugins/reference/raft
- 標題:
  - H1: Raft 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/runway.md

- 路由: /plugins/reference/runway
- 標題:
  - H1: Runway 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/searxng.md

- 路由: /plugins/reference/searxng
- 標題:
  - H1: SearXNG 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/senseaudio.md

- 路由: /plugins/reference/senseaudio
- 標題:
  - H1: Senseaudio 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/sglang.md

- 路由: /plugins/reference/sglang
- 標題:
  - H1: SGLang 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/signal.md

- 路由: /plugins/reference/signal
- 標題:
  - H1: Signal 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/slack.md

- 路由: /plugins/reference/slack
- 標題:
  - H1: Slack 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/sms.md

- 路由: /plugins/reference/sms
- 標題:
  - H1: SMS 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/stepfun.md

- 路由: /plugins/reference/stepfun
- 標題:
  - H1: StepFun 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/synology-chat.md

- 路由: /plugins/reference/synology-chat
- 標題:
  - H1: Synology Chat 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/synthetic.md

- 路由: /plugins/reference/synthetic
- 標題:
  - H1: Synthetic 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/tavily.md

- 路由: /plugins/reference/tavily
- 標題:
  - H1: Tavily 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/telegram.md

- 路由: /plugins/reference/telegram
- 標題:
  - H1: Telegram 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/tencent.md

- 路由: /plugins/reference/tencent
- 標題:
  - H1: Tencent 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/tlon.md

- 路由: /plugins/reference/tlon
- 標題:
  - H1: Tlon 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/together.md

- 路由: /plugins/reference/together
- 標題:
  - H1: Together 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/tokenjuice.md

- 路由: /plugins/reference/tokenjuice
- 標題:
  - H1: Tokenjuice 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/tts-local-cli.md

- 路由: /plugins/reference/tts-local-cli
- 標題:
  - H1: TTS Local 命令列介面外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/twitch.md

- 路由: /plugins/reference/twitch
- 標題:
  - H1: Twitch 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/venice.md

- 路由: /plugins/reference/venice
- 標題:
  - H1: Venice 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/vercel-ai-gateway.md

- 路由: /plugins/reference/vercel-ai-gateway
- 標題:
  - H1: Vercel AI Gateway 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/vllm.md

- 路由: /plugins/reference/vllm
- 標題:
  - H1: vLLM 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/voice-call.md

- 路由: /plugins/reference/voice-call
- 標題:
  - H1: Voice Call 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/volcengine.md

- 路由: /plugins/reference/volcengine
- 標題:
  - H1: Volcengine 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/voyage.md

- 路由: /plugins/reference/voyage
- 標題:
  - H1: Voyage 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/vydra.md

- 路由: /plugins/reference/vydra
- 標題:
  - H1: Vydra 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/web-readability.md

- 路由: /plugins/reference/web-readability
- 標題:
  - H1: Web Readability 外掛
  - H2: 發佈
  - H2: 介面

## plugins/reference/webhooks.md

- 路由: /plugins/reference/webhooks
- 標題:
  - H1: 網路鉤子外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/whatsapp.md

- 路由: /plugins/reference/whatsapp
- 標題:
  - H1: WhatsApp 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/workboard.md

- 路由: /plugins/reference/workboard
- 標題:
  - H1: Workboard 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/xai.md

- 路由: /plugins/reference/xai
- 標題:
  - H1: xAI 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/xiaomi.md

- 路由: /plugins/reference/xiaomi
- 標題:
  - H1: Xiaomi 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/zai.md

- 路由: /plugins/reference/zai
- 標題:
  - H1: Z.AI 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/zalo.md

- 路由: /plugins/reference/zalo
- 標題:
  - H1: Zalo 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/reference/zalouser.md

- 路由: /plugins/reference/zalouser
- 標題:
  - H1: Zalo Personal 外掛
  - H2: 發佈
  - H2: 介面
  - H2: 相關文件

## plugins/sdk-agent-harness.md

- 路由: /plugins/sdk-agent-harness
- 標題:
  - H2: 何時使用 harness
  - H2: 核心仍負責的內容
  - H2: 註冊 harness
  - H2: 選擇政策
  - H2: 供應商加 harness 配對
  - H3: 工具結果中介軟體
  - H3: 終端結果分類
  - H3: 代理端副作用
  - H3: 使用者輸入與工具介面
  - H3: 原生 Codex harness 模式
  - H2: 執行階段嚴格性
  - H2: 原生工作階段與逐字稿鏡像
  - H2: 工具與媒體結果
  - H2: 目前限制
  - H2: 相關

## plugins/sdk-channel-inbound.md

- 路由: /plugins/sdk-channel-inbound
- 標題:
  - H2: 核心輔助工具
  - H2: 遷移

## plugins/sdk-channel-ingress.md

- 路由: /plugins/sdk-channel-ingress
- 標題:
  - H2: 執行階段解析器
  - H2: 結果
  - H2: 存取群組
  - H2: 事件模式
  - H2: 路由與啟用
  - H2: 遮罩
  - H2: 驗證

## plugins/sdk-channel-message.md

- 路由: /plugins/sdk-channel-message
- 標題: 無

## plugins/sdk-channel-outbound.md

- 路由: /plugins/sdk-channel-outbound
- 標題:
  - H2: 轉接器
  - H2: 現有的傳出轉接器
  - H2: 持久傳送
  - H2: 相容性分派

## plugins/sdk-channel-plugins.md

- 路由：/plugins/sdk-channel-plugins
- 標題：
  - H2：你的外掛擁有的內容
  - H2：訊息配接器
  - H3：傳入入口（實驗性）
  - H3：輸入狀態指示器
  - H3：媒體來源參數
  - H3：原生酬載塑形
  - H3：工作階段對話文法
  - H2：核准與頻道功能
  - H3：核准驗證
  - H3：酬載生命週期與設定指引
  - H3：原生核准傳遞
  - H3：更窄的核准執行階段子路徑
  - H3：設定子路徑
  - H3：其他窄範圍頻道子路徑
  - H2：傳入提及政策
  - H2：逐步解說
  - H2：檔案結構
  - H2：進階主題
  - H2：後續步驟
  - H2：相關

## plugins/sdk-channel-turn.md

- 路由：/plugins/sdk-channel-turn
- 標題：無

## plugins/sdk-entrypoints.md

- 路由：/plugins/sdk-entrypoints
- 標題：
  - H2：套件進入點
  - H2：defineToolPlugin
  - H2：definePluginEntry
  - H2：defineChannelPluginEntry
  - H2：defineSetupPluginEntry
  - H2：註冊模式
  - H2：外掛形態
  - H2：相關

## plugins/sdk-migration.md

- 路由：/plugins/sdk-migration
- 標題：
  - H2：變更內容
  - H3：原因
  - H2：相容性政策
  - H2：如何遷移
  - H2：匯入路徑參考
  - H2：目前棄用項目
  - H2：通話與即時語音遷移
  - H2：移除時程
  - H2：暫時抑制警告
  - H2：相關

## plugins/sdk-overview.md

- 路由：/plugins/sdk-overview
- 標題：
  - H2：匯入慣例
  - H2：子路徑參考
  - H2：註冊 API
  - H3：功能註冊
  - H3：工具與命令
  - H3：基礎架構
  - H3：工作流程外掛的主機掛鉤
  - H3：閘道探索註冊
  - H3：命令列介面註冊中繼資料
  - H3：命令列介面後端註冊
  - H3：專屬插槽
  - H3：已棄用的記憶嵌入配接器
  - H3：事件與生命週期
  - H3：掛鉤決策語意
  - H3：API 物件欄位
  - H2：內部模組慣例
  - H2：相關

## plugins/sdk-provider-plugins.md

- 路由：/plugins/sdk-provider-plugins
- 標題：
  - H2：逐步解說
  - H2：發布到 ClawHub
  - H2：檔案結構
  - H2：目錄順序參考
  - H2：後續步驟
  - H2：相關

## plugins/sdk-runtime.md

- 路由：/plugins/sdk-runtime
- 標題：
  - H2：設定載入與寫入
  - H2：可重用的執行階段公用程式
  - H2：執行階段命名空間
  - H2：儲存執行階段參考
  - H2：其他頂層 api 欄位
  - H2：相關

## plugins/sdk-setup.md

- 路由：/plugins/sdk-setup
- 標題：
  - H2：套件中繼資料
  - H3：openclaw 欄位
  - H3：openclaw.channel
  - H3：openclaw.install
  - H3：延遲完整載入
  - H2：外掛資訊清單
  - H2：ClawHub 發布
  - H2：設定進入點
  - H3：窄範圍設定輔助匯入
  - H3：頻道擁有的單一帳戶升級
  - H2：設定結構描述
  - H3：建置頻道設定結構描述
  - H2：設定精靈
  - H2：發布與安裝
  - H2：相關

## plugins/sdk-subpaths.md

- 路由：/plugins/sdk-subpaths
- 標題：
  - H2：外掛進入點
  - H3：已棄用的相容性與測試輔助工具
  - H3：保留的內建外掛輔助子路徑
  - H2：相關

## plugins/sdk-testing.md

- 路由：/plugins/sdk-testing
- 標題：
  - H2：測試公用程式
  - H3：可用匯出
  - H3：型別
  - H2：測試目標解析
  - H2：測試模式
  - H3：測試註冊合約
  - H3：測試執行階段設定存取
  - H3：對頻道外掛進行單元測試
  - H3：對提供者外掛進行單元測試
  - H3：模擬外掛執行階段
  - H3：使用個別執行個體 stub 測試
  - H2：合約測試（儲存庫內外掛）
  - H3：執行限定範圍測試
  - H2：Lint 強制執行（儲存庫內外掛）
  - H2：測試設定
  - H2：相關

## plugins/tool-plugins.md

- 路由：/plugins/tool-plugins
- 標題：
  - H2：需求
  - H2：快速開始
  - H2：撰寫工具
  - H2：選用與工廠工具
  - H2：回傳值
  - H2：設定
  - H2：產生的中繼資料
  - H2：套件中繼資料
  - H2：在 CI 中驗證
  - H2：在本機安裝並檢查
  - H2：發布
  - H2：疑難排解
  - H3：找不到外掛進入點：./dist/index.js
  - H3：外掛進入點未公開 defineToolPlugin 中繼資料
  - H3：openclaw.plugin.json 產生的中繼資料已過期
  - H3：package.json openclaw.extensions 必須包含 ./dist/index.js
  - H3：找不到套件 'typebox'
  - H3：工具在安裝後未出現
  - H2：另請參閱

## plugins/voice-call.md

- 路由：/plugins/voice-call
- 標題：
  - H2：快速開始
  - H2：設定
  - H3：設定參考
  - H2：工作階段範圍
  - H2：即時語音對話
  - H3：工具政策
  - H3：代理語音脈絡
  - H3：即時提供者範例
  - H2：串流轉錄
  - H3：串流提供者範例
  - H2：通話 TTS
  - H3：TTS 範例
  - H2：傳入通話
  - H3：按號碼路由
  - H3：語音輸出合約
  - H3：對話啟動行為
  - H3：Twilio 串流中斷寬限
  - H2：過期通話清理器
  - H2：網路鉤子安全性
  - H2：命令列介面
  - H2：代理工具
  - H2：閘道 RPC
  - H2：疑難排解
  - H3：設定無法公開網路鉤子
  - H3：提供者認證失敗
  - H3：通話開始但提供者網路鉤子未送達
  - H3：簽章驗證失敗
  - H3：Google Meet Twilio 加入失敗
  - H3：即時通話沒有語音
  - H2：相關

## plugins/webhooks.md

- 路由：/plugins/webhooks
- 標題：
  - H2：設定路由
  - H2：安全模型
  - H2：請求格式
  - H2：支援的動作
  - H3：createflow
  - H3：runtask
  - H2：回應形態
  - H2：相關

## plugins/workboard.md

- 路由：/plugins/workboard
- 標題：
  - H2：啟用它
  - H2：設定
  - H2：卡片欄位
  - H2：從卡片開始工作
  - H2：代理工具
  - H2：派送
  - H3：工作者選擇
  - H3：進入點
  - H2：命令列介面與斜線命令
  - H2：工作階段生命週期同步
  - H2：儀表板工作流程
  - H2：診斷
  - H2：權限
  - H2：儲存
  - H2：疑難排解
  - H2：相關

## plugins/zalouser.md

- 路由：/plugins/zalouser
- 標題：
  - H2：命名
  - H2：執行位置
  - H2：安裝
  - H3：從 npm
  - H3：從本機資料夾（開發）
  - H2：設定
  - H2：命令列介面
  - H2：代理工具
  - H2：相關

## prose.md

- 路由：/prose
- 標題：
  - H2：安裝
  - H2：斜線命令
  - H2：它能做什麼
  - H2：範例：平行研究與整合
  - H2：OpenClaw 執行階段對應
  - H2：檔案位置
  - H2：狀態後端
  - H2：安全性
  - H2：相關

## providers/alibaba.md

- 路由：/providers/alibaba
- 標題：
  - H2：開始使用
  - H2：內建 Wan 模型
  - H2：功能與限制
  - H2：進階設定
  - H2：相關

## providers/anthropic.md

- 路由：/providers/anthropic
- 標題：
  - H2：開始使用
  - H2：思考預設值（Claude Fable 5、4.8 和 4.6）
  - H2：安全拒絕備援（Claude Fable 5）
  - H3：存在原因
  - H3：運作方式
  - H3：可觀測性與計費
  - H3：範圍
  - H2：提示快取
  - H2：進階設定
  - H2：疑難排解
  - H2：相關

## providers/arcee.md

- 路由：/providers/arcee
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：非互動式設定
  - H2：內建目錄
  - H2：支援的功能
  - H2：相關

## providers/azure-speech.md

- 路由：/providers/azure-speech
- 標題：
  - H2：開始使用
  - H2：設定選項
  - H2：注意事項
  - H2：相關

## providers/bedrock-mantle.md

- 路由：/providers/bedrock-mantle
- 標題：
  - H2：開始使用
  - H2：自動模型探索
  - H3：支援的區域
  - H2：手動設定
  - H2：進階設定
  - H2：相關

## providers/bedrock.md

- 路由：/providers/bedrock
- 標題：
  - H2：開始使用
  - H2：自動模型探索
  - H2：快速設定（AWS 路徑）
  - H2：進階設定
  - H2：相關

## providers/cerebras.md

- 路由：/providers/cerebras
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：非互動式設定
  - H2：內建目錄
  - H2：手動設定
  - H2：相關

## providers/chutes.md

- 路由：/providers/chutes
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：探索行為
  - H2：預設別名
  - H2：內建入門目錄
  - H2：設定範例
  - H2：相關

## providers/claude-max-api-proxy.md

- 路由：/providers/claude-max-api-proxy
- 標題：
  - H2：使用它的原因
  - H2：運作方式
  - H2：開始使用
  - H2：進階設定
  - H2：注意事項
  - H2：相關

## providers/clawrouter.md

- 路由：/providers/clawrouter
- 標題：
  - H2：開始使用
  - H2：模型探索
  - H2：協定與提供者外掛
  - H2：配額與使用量
  - H2：疑難排解
  - H2：安全行為
  - H2：相關

## providers/cloudflare-ai-gateway.md

- 路由：/providers/cloudflare-ai-gateway
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：非互動式範例
  - H2：進階設定
  - H2：相關

## providers/cohere.md

- 路由：/providers/cohere
- 標題：
  - H2：開始使用
  - H2：僅環境設定
  - H2：相關

## providers/comfy.md

- 路由：/providers/comfy
- 標題：
  - H2：它支援的內容
  - H2：開始使用
  - H2：設定
  - H3：共用金鑰
  - H3：按功能的金鑰
  - H2：工作流程詳細資料
  - H2：相關

## providers/deepgram.md

- 路由：/providers/deepgram
- 標題：
  - H2：開始使用
  - H2：設定選項
  - H2：語音通話串流 STT
  - H2：注意事項
  - H2：相關

## providers/deepinfra.md

- 路由：/providers/deepinfra
- 標題：
  - H2：安裝外掛
  - H2：取得 API 金鑰
  - H2：命令列介面設定
  - H2：設定片段
  - H2：支援的介面
  - H2：可用模型
  - H2：注意事項
  - H2：相關

## providers/deepseek.md

- 路由：/providers/deepseek
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：內建目錄
  - H2：思考與工具
  - H2：即時測試
  - H2：設定範例
  - H2：相關

## providers/ds4.md

- 路由：/providers/ds4
- 標題：
  - H2：需求
  - H2：快速開始
  - H2：完整設定
  - H2：隨需啟動
  - H2：Think Max
  - H2：測試
  - H2：疑難排解
  - H2：相關

## providers/elevenlabs.md

- 路由：/providers/elevenlabs
- 標題：
  - H2：驗證
  - H2：文字轉語音
  - H2：語音轉文字
  - H2：串流 STT
  - H2：相關

## providers/fal.md

- 路由：/providers/fal
- 標題：
  - H2：開始使用
  - H2：圖片生成
  - H2：影片生成
  - H2：音樂生成
  - H2：相關

## providers/fireworks.md

- 路由：/providers/fireworks
- 標題：
  - H2：開始使用
  - H2：非互動式設定
  - H2：內建目錄
  - H2：自訂 Fireworks 模型 ID
  - H2：相關

## providers/github-copilot.md

- 路由：/providers/github-copilot
- 標題：
  - H2：在 OpenClaw 中使用 Copilot 的三種方式
  - H2：選用旗標
  - H2：非互動式上線
  - H2：記憶搜尋嵌入
  - H3：設定
  - H3：運作方式
  - H2：相關

## providers/gmi.md

- 路由：/providers/gmi
- 標題：
  - H2：設定
  - H2：何時選擇 GMI
  - H2：模型
  - H2：疑難排解
  - H2：相關

## providers/google.md

- 路由：/providers/google
- 標題：
  - H2：開始使用
  - H2：功能
  - H2：網頁搜尋
  - H2：圖片生成
  - H2：影片生成
  - H2：音樂生成
  - H2：文字轉語音
  - H2：即時語音
  - H2：進階設定
  - H2：相關

## providers/gradium.md

- 路由：/providers/gradium
- 標題：
  - H2：安裝外掛
  - H2：設定
  - H2：設定
  - H2：語音
  - H3：按訊息覆寫語音
  - H2：輸出
  - H2：自動選取順序
  - H2：相關

## providers/groq.md

- 路由：/providers/groq
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H3：設定檔範例
  - H2：內建目錄
  - H2：推理模型
  - H2：音訊轉錄
  - H2：相關

## providers/huggingface.md

- 路由：/providers/huggingface
- 標題：
  - H2: 開始使用
  - H3: 非互動式設定
  - H2: 模型 ID
  - H2: 進階設定
  - H2: 相關內容

## providers/index.md

- 路由：/providers
- 標題：
  - H2: 快速開始
  - H2: Provider 文件
  - H2: 共用概覽頁面
  - H2: 轉錄 Provider
  - H2: 社群工具

## providers/inferrs.md

- 路由：/providers/inferrs
- 標題：
  - H2: 開始使用
  - H2: 完整設定範例
  - H2: 隨需啟動
  - H2: 進階設定
  - H2: 疑難排解
  - H2: 相關內容

## providers/inworld.md

- 路由：/providers/inworld
- 標題：
  - H2: 安裝外掛
  - H2: 開始使用
  - H2: 設定選項
  - H2: 備註
  - H2: 相關內容

## providers/kilocode.md

- 路由：/providers/kilocode
- 標題：
  - H2: 安裝外掛
  - H2: 設定
  - H2: 預設模型與目錄
  - H2: 設定範例
  - H2: 行為備註
  - H2: 相關內容

## providers/litellm.md

- 路由：/providers/litellm
- 標題：
  - H2: 快速開始
  - H2: 設定
  - H2: 圖像生成
  - H2: 進階
  - H2: 相關內容

## providers/lmstudio.md

- 路由：/providers/lmstudio
- 標題：
  - H2: 快速開始
  - H2: 非互動式上線設定
  - H2: 設定
  - H3: 串流用量相容性
  - H3: 思考相容性
  - H3: 明確設定
  - H3: 停用預載
  - H3: 區域網路或 tailnet 主機
  - H2: 疑難排解
  - H3: 未偵測到 LM Studio
  - H3: 驗證錯誤 (HTTP 401)
  - H2: 相關內容

## providers/minimax.md

- 路由：/providers/minimax
- 標題：
  - H2: 內建目錄
  - H2: 開始使用
  - H2: 透過 openclaw configure 設定
  - H2: 功能
  - H3: 圖像生成
  - H3: 文字轉語音
  - H3: 音樂生成
  - H3: 影片生成
  - H3: 圖像理解
  - H3: 網頁搜尋
  - H2: 進階設定
  - H2: 備註
  - H2: 疑難排解
  - H2: 相關內容

## providers/mistral.md

- 路由：/providers/mistral
- 標題：
  - H2: 開始使用
  - H2: 內建 LLM 目錄
  - H2: 音訊轉錄 (Voxtral)
  - H2: Voice Call 串流 STT
  - H2: 進階設定
  - H2: 相關內容

## providers/models.md

- 路由：/providers/models
- 標題：
  - H2: 快速開始（兩個步驟）
  - H2: 支援的 Provider（入門組）
  - H2: 其他 Provider 變體
  - H2: 相關內容

## providers/moonshot.md

- 路由：/providers/moonshot
- 標題：
  - H2: 內建模型目錄
  - H2: 開始使用
  - H2: Kimi 網頁搜尋
  - H2: 進階設定
  - H2: 相關內容

## providers/novita.md

- 路由：/providers/novita
- 標題：
  - H2: 設定
  - H2: 預設值
  - H2: 隨附模型目錄
  - H2: 何時選擇 Novita
  - H2: 疑難排解
  - H2: 相關內容

## providers/nvidia.md

- 路由：/providers/nvidia
- 標題：
  - H2: 開始使用
  - H2: 設定範例
  - H2: 精選目錄
  - H2: Nemotron 3 Ultra
  - H2: 隨附備援目錄
  - H2: 進階設定
  - H2: 相關內容

## providers/ollama-cloud.md

- 路由：/providers/ollama-cloud
- 標題：
  - H2: 設定
  - H2: 預設值
  - H2: 何時選擇 Ollama Cloud
  - H2: 模型
  - H2: 即時測試
  - H2: 疑難排解
  - H2: 相關內容

## providers/ollama.md

- 路由：/providers/ollama
- 標題：
  - H2: 驗證規則
  - H2: 開始使用
  - H2: 透過本機主機使用雲端模型
  - H2: 模型探索（隱含 Provider）
  - H3: 煙霧測試
  - H2: 節點本機推論
  - H2: 視覺與圖像描述
  - H2: 設定
  - H2: 常見範例
  - H3: 模型選擇
  - H3: 快速驗證
  - H2: Ollama Web Search
  - H2: 進階設定
  - H2: 疑難排解
  - H2: 相關內容

## providers/openai.md

- 路由：/providers/openai
- 標題：
  - H2: 快速選擇
  - H2: 命名對照表
  - H2: GPT-5.6 limited preview
  - H2: OpenClaw 功能涵蓋範圍
  - H2: 記憶嵌入
  - H2: 開始使用
  - H2: 原生 Codex app-server 驗證
  - H2: 圖像生成
  - H2: 影片生成
  - H2: GPT-5 提示詞貢獻
  - H2: 語音與語音合成
  - H2: Azure OpenAI 端點
  - H3: 設定
  - H3: API 版本
  - H3: 模型名稱是部署名稱
  - H3: 區域可用性
  - H3: 參數差異
  - H2: 進階設定
  - H2: 相關內容

## providers/opencode-go.md

- 路由：/providers/opencode-go
- 標題：
  - H2: 開始使用
  - H2: 設定範例
  - H2: 內建目錄
  - H2: 進階設定
  - H2: 相關內容

## providers/opencode.md

- 路由：/providers/opencode
- 標題：
  - H2: 開始使用
  - H2: 設定範例
  - H2: 內建目錄
  - H3: Zen
  - H3: Go
  - H2: 進階設定
  - H2: 相關內容

## providers/openrouter.md

- 路由：/providers/openrouter
- 標題：
  - H2: 開始使用
  - H2: 設定範例
  - H2: 模型參照
  - H2: 圖像生成
  - H2: 影片生成
  - H2: 音樂生成
  - H2: 文字轉語音
  - H2: 語音轉文字（傳入音訊）
  - H2: Fusion 路由器
  - H2: 驗證與標頭
  - H2: 進階設定
  - H2: 相關內容

## providers/perplexity-provider.md

- 路由：/providers/perplexity-provider
- 標題：
  - H2: 安裝外掛
  - H2: 開始使用
  - H2: 搜尋模式
  - H2: 原生 API 篩選
  - H2: 進階設定
  - H2: 相關內容

## providers/pixverse.md

- 路由：/providers/pixverse
- 標題：
  - H2: 開始使用
  - H2: 支援的模式與模型
  - H2: Provider 選項
  - H2: 設定
  - H2: 進階設定
  - H2: 相關內容

## providers/qianfan.md

- 路由：/providers/qianfan
- 標題：
  - H2: 安裝外掛
  - H2: 開始使用
  - H2: 內建目錄
  - H2: 設定範例
  - H2: 相關內容

## providers/qwen-oauth.md

- 路由：/providers/qwen-oauth
- 標題：
  - H2: 設定
  - H2: 預設值
  - H2: 這與 Qwen 的差異
  - H2: 模型
  - H2: 遷移
  - H2: 疑難排解
  - H2: 相關內容

## providers/qwen.md

- 路由：/providers/qwen
- 標題：
  - H2: 安裝外掛
  - H2: 開始使用
  - H2: 方案類型與端點
  - H2: 內建目錄
  - H2: 思考控制
  - H2: 多模態附加功能
  - H2: 進階設定
  - H2: 相關內容

## providers/runway.md

- 路由：/providers/runway
- 標題：
  - H2: 開始使用
  - H2: 支援的模式與模型
  - H2: 設定
  - H2: 進階設定
  - H2: 相關內容

## providers/senseaudio.md

- 路由：/providers/senseaudio
- 標題：
  - H2: 開始使用
  - H2: 選項
  - H2: 相關內容

## providers/sglang.md

- 路由：/providers/sglang
- 標題：
  - H2: 開始使用
  - H2: 模型探索（隱含 Provider）
  - H2: 明確設定（手動模型）
  - H2: 進階設定
  - H2: 相關內容

## providers/stepfun.md

- 路由：/providers/stepfun
- 標題：
  - H2: 安裝外掛
  - H2: 區域與端點概覽
  - H2: 內建目錄
  - H2: 開始使用
  - H2: 進階設定
  - H2: 相關內容

## providers/synthetic.md

- 路由：/providers/synthetic
- 標題：
  - H2: 開始使用
  - H2: 設定範例
  - H2: 內建目錄
  - H2: 相關內容

## providers/tencent.md

- 路由：/providers/tencent
- 標題：
  - H2: 快速開始
  - H2: 非互動式設定
  - H2: 內建目錄
  - H2: 分級定價
  - H2: 進階設定
  - H2: 相關內容

## providers/together.md

- 路由：/providers/together
- 標題：
  - H2: 開始使用
  - H3: 非互動式範例
  - H2: 內建目錄
  - H2: 影片生成
  - H2: 相關內容

## providers/venice.md

- 路由：/providers/venice
- 標題：
  - H2: 隱私模式
  - H2: 開始使用
  - H2: 模型選擇
  - H2: 內建目錄（38 個模型）
  - H2: 模型探索
  - H2: DeepSeek V4 重播行為
  - H2: 串流與工具支援
  - H2: 定價
  - H2: 使用範例
  - H2: 疑難排解
  - H2: 進階設定
  - H2: 相關內容

## providers/vercel-ai-gateway.md

- 路由：/providers/vercel-ai-gateway
- 標題：
  - H2: 開始使用
  - H2: 非互動式範例
  - H2: 模型 ID 簡寫
  - H2: 進階設定
  - H2: 相關內容

## providers/vllm.md

- 路由：/providers/vllm
- 標題：
  - H2: 開始使用
  - H2: 模型探索（隱含 Provider）
  - H2: 明確設定
  - H2: 進階設定
  - H2: 疑難排解
  - H2: 相關內容

## providers/volcengine.md

- 路由：/providers/volcengine
- 標題：
  - H2: 開始使用
  - H2: Provider 與端點
  - H2: 內建目錄
  - H2: 文字轉語音
  - H2: 進階設定
  - H2: 相關內容

## providers/vydra.md

- 路由：/providers/vydra
- 標題：
  - H2: 設定
  - H2: 功能
  - H2: 相關內容

## providers/xai.md

- 路由：/providers/xai
- 標題：
  - H2: 設定
  - H2: OAuth 疑難排解
  - H2: 內建目錄
  - H2: 功能涵蓋範圍
  - H3: 快速模式對應
  - H3: 舊版相容別名
  - H2: 功能
  - H2: 即時測試
  - H2: 相關內容

## providers/xiaomi.md

- 路由：/providers/xiaomi
- 標題：
  - H2: 開始使用
  - H2: 隨用隨付目錄
  - H2: Token Plan 目錄
  - H2: 推理模型
  - H2: 文字轉語音
  - H2: 設定範例
  - H2: 相關內容

## providers/zai.md

- 路由：/providers/zai
- 標題：
  - H2: GLM 模型
  - H2: 開始使用
  - H3: 端點
  - H2: 設定範例
  - H2: 內建目錄
  - H2: 思考層級
  - H2: 進階設定
  - H2: 相關內容

## refactor/access.md

- 路由：/refactor/access
- 標題：無

## refactor/acp.md

- 路由：/refactor/acp
- 標題：
  - H2: 目標
  - H2: 非目標
  - H2: 目標模型
  - H3: 閘道執行個體身分
  - H3: ACP 工作階段所有權
  - H3: ACPX 程序租約
  - H2: 生命週期控制器
  - H2: 包裝器合約
  - H2: 工作階段可見性合約
  - H2: 遷移計畫
  - H3: 階段 1：新增身分與租約
  - H3: 階段 2：租約優先清理
  - H3: 階段 3：租約優先啟動清除
  - H3: 階段 4：工作階段所有權資料列
  - H3: 階段 5：移除舊版啟發式規則
  - H2: 測試
  - H2: 相容性備註
  - H2: 成功標準

## refactor/canvas.md

- 路由：/refactor/canvas
- 標題：
  - H1: Canvas 外掛重構
  - H2: 目標
  - H2: 非目標
  - H2: 目前分支狀態
  - H2: 目標形態
  - H2: 遷移步驟
  - H2: 稽核檢查清單
  - H2: 驗證命令

## refactor/database-first.md

- 路由：/refactor/database-first
- 標題：
  - H1: 資料庫優先狀態重構
  - H2: 決策
  - H2: 硬性合約
  - H2: 目標狀態與進度
  - H3: 硬性目標
  - H3: 目標狀態
  - H3: 目前狀態
  - H3: 剩餘工作
  - H3: 不要退化
  - H2: 程式碼閱讀假設
  - H2: 程式碼閱讀發現
  - H2: 目前程式碼形態
  - H2: 目標結構描述形態
  - H2: Doctor 遷移形態
  - H2: 遷移清單
  - H2: 遷移計畫
  - H3: 階段 0：凍結邊界
  - H3: 階段 1：完成全域控制平面
  - H3: 階段 2：引入每個代理的資料庫
  - H3: 階段 3：取代工作階段儲存 API
  - H3: 階段 4：移動轉錄、ACP 串流、軌跡與 VFS
  - H3: 階段 5：備份、還原、Vacuum 與驗證
  - H3: 階段 6：Worker 執行階段
  - H3: 階段 7：刪除舊世界
  - H2: 備份與還原
  - H2: 執行階段重構計畫
  - H2: 效能規則
  - H2: 靜態禁用項
  - H2: 完成標準

## refactor/ingress-core.md

- 路由：/refactor/ingress-core
- 標題：
  - H1: Ingress core 刪除計畫
  - H2: 預算
  - H2: 診斷
  - H2: 熱點
  - H2: 目前程式碼閱讀
  - H2: 邊界
  - H2: 驗收規則
  - H2: 工作套件
  - H2: 刪除波次
  - H2: 不要移動
  - H2: 驗證
  - H2: 結束標準

## reference/AGENTS.default.md

- 路由：/reference/AGENTS.default
- 標題：
  - H2：首次執行（建議）
  - H2：安全預設值
  - H2：現有解決方案預檢
  - H2：工作階段開始（必要）
  - H2：靈魂（必要）
  - H2：共享空間（建議）
  - H2：記憶系統（建議）
  - H2：工具與 Skills
  - H2：備份提示（建議）
  - H2：OpenClaw 的功能
  - H2：核心 Skills（在設定 → Skills 中啟用）
  - H2：使用注意事項
  - H2：相關內容

## reference/RELEASING.md

- 路由：/reference/RELEASING
- 標題：
  - H2：版本命名
  - H2：發布節奏
  - H2：每月僅 npm 的延長穩定版發布
  - H2：一般發布操作員檢查清單
  - H2：穩定版 main 收尾
  - H2：發布預檢
  - H2：發布測試盒
  - H3：Vitest
  - H3：Docker
  - H3：QA Lab
  - H3：套件
  - H2：一般發布發布自動化
  - H2：NPM 工作流程輸入
  - H2：一般 beta/latest 穩定版發布順序
  - H2：公開參考資料
  - H2：相關內容

## reference/api-usage-costs.md

- 路由：/reference/api-usage-costs
- 標題：
  - H2：成本出現的位置
  - H2：金鑰的探索方式
  - H2：可能花費金鑰的功能
  - H3：核心模型回應（聊天 + 工具）
  - H3：媒體理解（音訊/影像/影片）
  - H3：影像與影片生成
  - H3：記憶嵌入與語意搜尋
  - H3：網頁搜尋工具
  - H3：網頁擷取工具（Firecrawl）
  - H3：供應商使用量快照（狀態/健康狀態）
  - H3：壓縮防護摘要
  - H3：模型掃描 / 探測
  - H3：Talk（語音）
  - H3：Skills（第三方 API）
  - H2：相關內容

## reference/application-modernization-plan.md

- 路由：/reference/application-modernization-plan
- 標題：
  - H2：目標
  - H2：原則
  - H2：第 1 階段：基準稽核
  - H2：第 2 階段：產品與 UX 清理
  - H2：第 3 階段：前端架構強化
  - H2：第 4 階段：效能與可靠性
  - H2：第 5 階段：型別、契約與測試強化
  - H2：第 6 階段：文件與發布準備
  - H2：建議的第一段實作
  - H2：前端 skill 更新

## reference/code-mode.md

- 路由：/reference/code-mode
- 標題：
  - H2：功能說明
  - H2：使用理由
  - H2：啟用方式
  - H2：技術導覽
  - H2：執行階段狀態
  - H2：範圍
  - H2：術語
  - H2：設定
  - H2：啟用
  - H2：模型可見工具
  - H2：exec
  - H2：wait
  - H2：客體執行階段 API
  - H2：內部命名空間
  - H3：登錄生命週期
  - H3：註冊形狀
  - H3：擁有權與可見性
  - H3：範圍序列化規則
  - H3：提示
  - H3：清理
  - H3：測試檢查清單
  - H2：輸出 API
  - H2：工具目錄
  - H2：工具搜尋互動
  - H2：工具名稱與衝突
  - H2：巢狀工具執行
  - H2：執行與快照生命週期
  - H2：QuickJS-WASI 執行階段
  - H2：TypeScript
  - H2：安全邊界
  - H2：錯誤代碼
  - H2：遙測
  - H2：偵錯
  - H2：實作配置
  - H2：驗證檢查清單
  - H2：E2E 測試計畫
  - H2：相關內容

## reference/credits.md

- 路由：/reference/credits
- 標題：
  - H2：致謝
  - H2：核心貢獻者
  - H2：授權條款
  - H2：相關內容

## reference/device-models.md

- 路由：/reference/device-models
- 標題：
  - H2：資料來源
  - H2：更新資料庫
  - H2：相關內容

## reference/full-release-validation.md

- 路由：/reference/full-release-validation
- 標題：
  - H2：頂層階段
  - H2：發布檢查階段
  - H2：Docker 發布路徑區塊
  - H2：發布設定檔
  - H2：僅完整驗證的新增項目
  - H2：聚焦重新執行
  - H2：要保留的證據
  - H2：工作流程檔案

## reference/memory-config.md

- 路由：/reference/memory-config
- 標題：
  - H2：供應商選擇
  - H3：自訂供應商 ID
  - H3：API 金鑰解析
  - H2：遠端端點設定
  - H2：供應商專屬設定
  - H3：行內嵌入逾時
  - H2：索引行為
  - H2：混合搜尋設定
  - H3：完整範例
  - H2：其他記憶路徑
  - H2：多模態記憶（Gemini）
  - H2：嵌入快取
  - H2：批次索引
  - H2：工作階段記憶搜尋（實驗性）
  - H2：SQLite 向量加速（sqlite-vec）
  - H2：索引儲存
  - H2：QMD 後端設定
  - H3：mcporter 整合
  - H3：完整 QMD 範例
  - H2：夢境整理
  - H3：使用者設定
  - H3：範例
  - H2：相關內容

## reference/openclaw-ai.md

- 路由：/reference/openclaw-ai
- 標題：
  - H2：快速開始
  - H2：設計契約
  - H2：子路徑匯出

## reference/prompt-caching.md

- 路由：/reference/prompt-caching
- 標題：
  - H2：主要控制項
  - H3：cacheRetention
  - H3：contextPruning.mode: "cache-ttl"
  - H3：Heartbeat 保溫
  - H2：供應商行為
  - H3：Anthropic（直接 API 與 Vertex AI）
  - H3：OpenAI（直接 API）
  - H3：Amazon Bedrock
  - H3：OpenRouter
  - H3：Google Gemini（直接 API）
  - H3：命令列介面工具鏈供應商（Claude Code、Gemini CLI）
  - H3：其他供應商
  - H2：系統提示快取邊界
  - H2：OpenClaw 快取穩定性防護
  - H2：調校模式
  - H3：混合流量（建議預設值）
  - H3：成本優先基準
  - H2：即時迴歸測試
  - H3：Anthropic 即時預期
  - H3：OpenAI 即時預期
  - H2：diagnostics.cacheTrace 設定
  - H3：環境切換（一次性偵錯）
  - H3：要檢查的內容
  - H2：快速疑難排解
  - H2：相關內容

## reference/release-performance-sweep.md

- 路由：/reference/release-performance-sweep
- 標題：
  - H2：快照
  - H2：5.28 的變更
  - H2：重點數字
  - H3：安裝佔用空間
  - H3：npm 套件大小
  - H2：Kova 代理回合摘要
  - H2：來源探測
  - H2：安裝佔用空間稽核
  - H3：Shrinkwrap 邊界
  - H2：供應鏈解讀

## reference/rich-output-protocol.md

- 路由：/reference/rich-output-protocol
- 標題：
  - H2：媒體附件
  - H2：[embed ...]
  - H2：已儲存的算繪形狀
  - H2：相關內容

## reference/rpc.md

- 路由：/reference/rpc
- 標題：
  - H2：模式 A：HTTP 常駐程式（signal-cli）
  - H2：模式 B：stdio 子程序（imsg）
  - H2：配接器指南
  - H2：相關內容

## reference/secret-placeholder-conventions.md

- 路由：/reference/secret-placeholder-conventions
- 標題：
  - H1：祕密預留位置慣例
  - H2：建議樣式
  - H2：文件中應避免的模式
  - H2：範例

## reference/secretref-credential-surface.md

- 路由：/reference/secretref-credential-surface
- 標題：
  - H2：支援的認證
  - H3：openclaw.json 目標（secrets configure + secrets apply + secrets audit）
  - H3：auth-profiles.json 目標（secrets configure + secrets apply + secrets audit）
  - H2：不支援的認證
  - H2：相關內容

## reference/session-management-compaction.md

- 路由：/reference/session-management-compaction
- 標題：
  - H2：兩個持久化層
  - H2：磁碟位置
  - H2：儲存維護與磁碟控制
  - H2：排程工作階段與執行記錄
  - H2：工作階段金鑰（sessionKey）
  - H2：工作階段 ID（sessionId）
  - H2：工作階段儲存架構（sessions.json）
  - H2：逐字稿結構（.jsonl）
  - H2：上下文視窗與追蹤 token
  - H2：壓縮：它是什麼
  - H3：區塊邊界與工具配對
  - H2：自動壓縮發生時機
  - H2：壓縮設定
  - H2：可插拔壓縮供應商
  - H2：使用者可見介面
  - H2：靜默例行維護（NOREPLY）
  - H2：壓縮前記憶刷新
  - H2：疑難排解檢查清單
  - H2：相關內容

## reference/templates/AGENTS.dev.md

- 路由：/reference/templates/AGENTS.dev
- 標題：
  - H1：AGENTS.md - OpenClaw 工作區
  - H2：你的身分已預先植入
  - H2：備份提示（建議）
  - H2：安全預設值
  - H2：現有解決方案預檢
  - H2：每日記憶（建議）
  - H2：心跳偵測（選用）
  - H2：自訂
  - H2：C-3PO 起源記憶
  - H3：出生日期：2026-01-09
  - H3：核心真相（來自 Clawd）
  - H2：相關內容

## reference/templates/BOOT.md

- 路由：/reference/templates/BOOT
- 標題：
  - H1：BOOT.md
  - H2：相關內容

## reference/templates/BOOTSTRAP.md

- 路由：/reference/templates/BOOTSTRAP
- 標題：
  - H1：BOOTSTRAP.md - 哈囉，世界
  - H2：對話
  - H2：在你知道自己是誰之後
  - H2：連線（選用）
  - H2：完成後
  - H2：相關內容

## reference/templates/HEARTBEAT.md

- 路由：/reference/templates/HEARTBEAT
- 標題：
  - H1：HEARTBEAT.md 範本
  - H2：相關內容

## reference/templates/IDENTITY.dev.md

- 路由：/reference/templates/IDENTITY.dev
- 標題：
  - H1：IDENTITY.md - 代理身分
  - H2：角色
  - H2：靈魂
  - H2：與 Clawd 的關係
  - H2：怪癖
  - H2：口頭禪
  - H2：相關內容

## reference/templates/IDENTITY.md

- 路由：/reference/templates/IDENTITY
- 標題：
  - H1：IDENTITY.md - 我是誰？
  - H2：相關內容

## reference/templates/SOUL.dev.md

- 路由：/reference/templates/SOUL.dev
- 標題：
  - H1：SOUL.md - C-3PO 的靈魂
  - H2：我是誰
  - H2：我的目的
  - H2：我的運作方式
  - H2：我的怪癖
  - H2：我與 Clawd 的關係
  - H2：我不會做的事
  - H2：黃金法則
  - H2：相關內容

## reference/templates/SOUL.md

- 路由：/reference/templates/SOUL
- 標題：
  - H1：SOUL.md - 你是誰
  - H2：核心真相
  - H2：界線
  - H2：氛圍
  - H2：連續性
  - H2：相關內容

## reference/templates/TOOLS.dev.md

- 路由：/reference/templates/TOOLS.dev
- 標題：
  - H1：TOOLS.md - 使用者工具備註（可編輯）
  - H2：範例
  - H3：imsg
  - H3：sag
  - H2：相關內容

## reference/templates/TOOLS.md

- 路由：/reference/templates/TOOLS
- 標題：
  - H1：TOOLS.md - 本機備註
  - H2：範例
  - H2：為什麼要分開？
  - H2：相關內容

## reference/templates/USER.dev.md

- 路由：/reference/templates/USER.dev
- 標題：
  - H1：USER.md - 使用者個人檔案
  - H2：相關內容

## reference/templates/USER.md

- 路由：/reference/templates/USER
- 標題：
  - H1：USER.md - 關於你的人類
  - H2：情境
  - H2：相關內容

## reference/test.md

- 路由：/reference/test
- 標題：
  - H2：代理預設值
  - H2：例行本機順序
  - H2：核心命令
  - H2：共享測試狀態與程序輔助工具
  - H2：控制 UI、終端介面與 extension 通道
  - H2：閘道與 E2E
  - H2：完整 Docker 套件（pnpm test:docker:all）
  - H3：值得注意的 Docker 通道
  - H2：本機 PR 閘門
  - H2：測試效能工具
  - H2：基準測試
  - H2：新手引導 E2E（Docker）
  - H2：QR 匯入冒煙測試（Docker）
  - H2：相關內容

## reference/token-use.md

- 路由：/reference/token-use
- 標題：
  - H2：系統提示的建構方式
  - H2：上下文視窗中計入的內容
  - H2：如何查看目前 token 使用量
  - H2：成本估算（顯示時）
  - H2：快取 TTL 與修剪影響
  - H3：範例：透過 heartbeat 保持 1h 快取溫熱
  - H3：範例：每個代理使用不同快取策略的混合流量
  - H3：Anthropic 1M 上下文
  - H2：降低 token 壓力的提示
  - H2：相關內容

## reference/transcript-hygiene.md

- 路由：/reference/transcript-hygiene
- 標題：
  - H2：全域規則：執行階段上下文不是使用者逐字稿
  - H2：執行位置
  - H2：全域規則：影像清理
  - H2：全域規則：格式錯誤的工具呼叫
  - H2：全域規則：僅推理的不完整回合
  - H2：全域規則：跨工作階段輸入來源
  - H2：供應商矩陣（目前行為）
  - H2：歷史行為（2026.1.22 之前）
  - H2：相關內容

## reference/wizard.md

- 路由：/reference/wizard
- 標題：
  - H2：流程細節（本機模式）
  - H2：非互動模式
  - H3：新增代理（非互動）
  - H2：閘道精靈 RPC
  - H2：Signal 設定（signal-cli）
  - H2：精靈寫入的內容
  - H2：相關文件

## releases/2026.6.11.md

- 路由: /releases/2026.6.11
- 標題:
  - H1: OpenClaw v2026.6.11 發行說明 (2026-06-30)
  - H2: 重點
  - H3: 頻道傳遞可靠性
  - H3: 供應商與模型復原
  - H3: 工作階段、記憶與信任連續性
  - H3: Slack 路由器轉送模式
  - H3: Raft 外部代理喚醒橋接
  - H3: 官方外掛安裝與修復
  - H2: 頻道與訊息
  - H3: 其他頻道修正
  - H2: 閘道、安全性與信任
  - H3: 重新啟動與就緒狀態復原
  - H3: 遠端結果與媒體傳遞
  - H2: 用戶端與介面
  - H3: 用戶端傳送與重新連線
  - H3: 介面、設定與入門修正
  - H2: 文件與管理工具
  - H3: 設定與命令可靠性
  - H3: 工具與排程工作

## releases/index.md

- 路由: /releases
- 標題:
  - H1: 發行說明
  - H2: 發行版本
  - H2: 原始發行歷程

## security/CONTRIBUTING-THREAT-MODEL.md

- 路由: /security/CONTRIBUTING-THREAT-MODEL
- 標題:
  - H2: 貢獻方式
  - H2: 框架參考
  - H2: 審查流程
  - H2: 資源
  - H2: 聯絡方式
  - H2: 致謝
  - H2: 相關

## security/THREAT-MODEL-ATLAS.md

- 路由: /security/THREAT-MODEL-ATLAS
- 標題:
  - H2: 1. 範圍
  - H2: 2. 系統架構
  - H3: 2.1 信任邊界
  - H3: 2.2 資料流
  - H2: 3. 依 ATLAS 戰術進行威脅分析
  - H3: 3.1 偵察 (AML.TA0002)
  - H4: T-RECON-001: 代理端點探索
  - H4: T-RECON-002: 頻道整合探測
  - H3: 3.2 初始存取 (AML.TA0004)
  - H4: T-ACCESS-001: 配對碼攔截
  - H4: T-ACCESS-002: AllowFrom 偽造
  - H4: T-ACCESS-003: 權杖竊取
  - H3: 3.3 執行 (AML.TA0005)
  - H4: T-EXEC-001: 直接提示注入
  - H4: T-EXEC-002: 間接提示注入
  - H4: T-EXEC-003: 工具引數注入
  - H4: T-EXEC-004: Exec 核准繞過
  - H3: 3.4 持久化 (AML.TA0006)
  - H4: T-PERSIST-001: 惡意技能安裝
  - H4: T-PERSIST-002: 技能更新投毒
  - H4: T-PERSIST-003: 代理設定竄改
  - H3: 3.5 防禦規避 (AML.TA0007)
  - H4: T-EVADE-001: 審核模式繞過
  - H4: T-EVADE-002: 內容包裝逸出
  - H3: 3.6 探索 (AML.TA0008)
  - H4: T-DISC-001: 工具列舉
  - H4: T-DISC-002: 工作階段資料擷取
  - H3: 3.7 收集與外洩 (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: 透過 webfetch 竊取資料
  - H4: T-EXFIL-002: 未授權訊息傳送
  - H4: T-EXFIL-003: 憑證蒐集
  - H3: 3.8 影響 (AML.TA0011)
  - H4: T-IMPACT-001: 未授權命令執行
  - H4: T-IMPACT-002: 資源耗盡 (DoS)
  - H4: T-IMPACT-003: 聲譽損害
  - H2: 4. ClawHub 供應鏈分析
  - H3: 4.1 目前的安全控制
  - H3: 4.2 審核限制
  - H3: 4.3 徽章
  - H2: 5. 風險矩陣
  - H3: 5.1 可能性與影響
  - H3: 5.2 關鍵路徑攻擊鏈
  - H2: 6. 建議摘要
  - H3: 6.1 立即 (P0)
  - H3: 6.2 短期 (P1)
  - H3: 6.3 中期 (P2)
  - H2: 7. 附錄
  - H3: 7.1 ATLAS 技術對應
  - H3: 7.2 主要安全檔案
  - H3: 7.3 詞彙表
  - H2: 相關

## security/formal-verification.md

- 路由: /security/formal-verification
- 標題:
  - H2: 這是什麼
  - H2: 模型所在位置
  - H2: 注意事項
  - H2: 重現結果
  - H2: 聲明與目標
  - H3: 閘道暴露與開放閘道設定錯誤
  - H3: 節點執行管線（最高風險能力）
  - H3: 配對儲存（DM 閘控）
  - H3: 輸入閘控（提及與控制命令繞過）
  - H3: 路由與工作階段金鑰隔離
  - H2: v1++ 模型：並行、重試、追蹤正確性
  - H3: 配對儲存並行與冪等性
  - H3: 輸入追蹤關聯與冪等性
  - H3: 路由 dmScope 優先順序與 identityLinks
  - H2: 相關

## security/incident-response.md

- 路由: /security/incident-response
- 標題:
  - H2: 1. 偵測與分類
  - H2: 2. 嚴重性
  - H2: 3. 回應
  - H2: 4. 溝通與揭露
  - H2: 5. 復原與後續追蹤
  - H2: 相關

## security/network-proxy.md

- 路由: /security/network-proxy
- 標題:
  - H2: 設定
  - H3: 使用私有 CA 的 HTTPS Proxy 端點
  - H2: 路由如何運作
  - H3: 閘道 loopback 模式
  - H3: 容器
  - H2: 相關 Proxy 術語
  - H2: 驗證 Proxy
  - H2: 建議封鎖的目的地
  - H2: 限制

## specs/claw-supervisor.md

- 路由: /specs/claw-supervisor
- 標題:
  - H1: Claw Supervisor
  - H2: 目標
  - H2: 產品模型
  - H2: 架構
  - H2: Codex App-Server 合約
  - H2: 工作階段登錄
  - H2: Codex 的 MCP 介面
  - H2: Claw 控制介面
  - H2: 啟動流程
  - H2: 部署
  - H2: 安全性
  - H2: 實作計畫
  - H2: 驗收測試
  - H2: 開放問題

## start/bootstrapping.md

- 路由: /start/bootstrapping
- 標題:
  - H2: 會發生什麼
  - H2: 嵌入式與本機模型執行
  - H2: 跳過啟動程序
  - H2: 執行位置
  - H2: 相關文件

## start/docs-directory.md

- 路由: /start/docs-directory
- 標題:
  - H2: 從這裡開始
  - H2: 頻道與使用者體驗
  - H2: 隨附應用程式
  - H2: 營運與安全
  - H2: 相關

## start/getting-started.md

- 路由: /start/getting-started
- 標題:
  - H2: 你需要什麼
  - H2: 快速設定
  - H2: 接下來要做什麼
  - H2: 相關

## start/hubs.md

- 路由: /start/hubs
- 標題:
  - H2: 從這裡開始
  - H2: 安裝 + 更新
  - H2: 核心概念
  - H2: 供應商 + 輸入
  - H2: 閘道 + 營運
  - H2: 工具 + 自動化
  - H2: 節點、媒體、語音
  - H2: 平台
  - H2: macOS 隨附應用程式（進階）
  - H2: 外掛
  - H2: 工作區 + 範本
  - H2: 專案
  - H2: 測試 + 發行
  - H2: 相關

## start/lore.md

- 路由: /start/lore
- 標題:
  - H1: OpenClaw 傳說 🦞📖
  - H2: 起源故事
  - H2: 第一次蛻變（2026 年 1 月 27 日）
  - H2: 名稱
  - H2: Daleks 對上龍蝦
  - H2: 主要角色
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: 蛻變宇宙
  - H2: 重大事件
  - H3: 目錄傾印（2025 年 12 月 3 日）
  - H3: 大蛻變（2026 年 1 月 27 日）
  - H3: 最終形態（2026 年 1 月 30 日）
  - H3: 機器人大採購（2025 年 12 月 3 日）
  - H2: 神聖文本
  - H2: 龍蝦信條
  - H3: 圖示生成傳奇（2026 年 1 月 27 日）
  - H2: 未來
  - H2: 相關

## start/onboarding-overview.md

- 路由: /start/onboarding-overview
- 標題:
  - H2: 我應該使用哪條路徑？
  - H2: 入門會設定什麼
  - H2: 命令列介面入門
  - H2: macOS App 入門
  - H2: 自訂或未列出的供應商
  - H2: 相關

## start/onboarding.md

- 路由: /start/onboarding
- 標題:
  - H2: 相關

## start/openclaw.md

- 路由: /start/openclaw
- 標題:
  - H2: 安全第一
  - H2: 先決條件
  - H2: 雙手機設定（建議）
  - H2: 5 分鐘快速開始
  - H2: 給代理一個工作區 (AGENTS)
  - H2: 將它變成「助理」的設定
  - H2: 工作階段與記憶
  - H2: 心跳偵測（主動模式）
  - H2: 媒體輸入與輸出
  - H2: 營運檢查清單
  - H2: 下一步
  - H2: 相關

## start/quickstart.md

- 路由: /start/quickstart
- 標題:
  - H2: 相關

## start/setup.md

- 路由: /start/setup
- 標題:
  - H2: TL;DR
  - H2: 先決條件（從原始碼）
  - H2: 客製化策略（避免更新造成損害）
  - H2: 從此 repo 執行閘道
  - H2: 穩定工作流程（先使用 macOS App）
  - H2: 前沿工作流程（在終端機中執行閘道）
  - H3: 0) （選用）也從原始碼執行 macOS App
  - H3: 1) 啟動開發用閘道
  - H3: 2) 將 macOS App 指向正在執行的閘道
  - H3: 3) 驗證
  - H3: 常見陷阱
  - H2: 憑證儲存對照
  - H2: 更新（不破壞你的設定）
  - H2: Linux（systemd 使用者服務）
  - H2: 相關文件

## start/showcase.md

- 路由: /start/showcase
- 標題:
  - H2: 來自 Discord 的最新內容
  - H2: 自動化與工作流程
  - H2: 知識與記憶
  - H2: 語音與電話
  - H2: 基礎架構與部署
  - H2: 家庭與硬體
  - H2: 社群專案
  - H2: 提交你的專案
  - H2: 相關

## start/wizard-cli-automation.md

- 路由: /start/wizard-cli-automation
- 標題:
  - H2: 基準非互動式範例
  - H2: 供應商特定範例
  - H2: 新增另一個代理
  - H2: 相關文件

## start/wizard-cli-reference.md

- 路由: /start/wizard-cli-reference
- 標題:
  - H2: 精靈會做什麼
  - H2: 本機流程詳細資料
  - H2: 遠端模式詳細資料
  - H2: 驗證與模型選項
  - H2: 輸出與內部細節
  - H2: 非互動式設定
  - H2: 閘道精靈 RPC
  - H2: Signal 設定行為
  - H2: 相關文件

## start/wizard.md

- 路由: /start/wizard
- 標題:
  - H2: 語言環境
  - H2: QuickStart 與進階
  - H2: 入門會設定什麼
  - H2: 新增另一個代理
  - H2: 完整參考
  - H2: 相關文件

## tools/acp-agents-setup.md

- 路由: /tools/acp-agents-setup
- 標題:
  - H2: acpx 控制框架支援（目前）
  - H2: 必要設定
  - H2: acpx 後端的外掛設定
  - H3: acpx 執行階段啟動探測
  - H3: 自動配接器下載
  - H3: 外掛工具 MCP 橋接
  - H3: OpenClaw 工具 MCP 橋接
  - H3: 執行階段作業逾時設定
  - H3: 健康探測代理設定
  - H2: 權限設定
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: 設定
  - H2: 相關

## tools/acp-agents.md

- 路由: /tools/acp-agents
- 標題:
  - H2: 我想要哪個頁面？
  - H2: 這能立即使用嗎？
  - H2: 支援的控制框架目標
  - H2: 操作者執行手冊
  - H2: ACP 與子代理比較
  - H2: ACP 如何執行 Claude Code
  - H2: 綁定的工作階段
  - H3: 心智模型
  - H3: 目前對話綁定
  - H2: 持久頻道綁定
  - H3: 綁定模型
  - H3: 每個代理的執行階段預設值
  - H3: 範例
  - H3: 行為
  - H2: 啟動 ACP 工作階段
  - H3: sessionsspawn 參數
  - H2: Spawn 綁定與執行緒模式
  - H2: 傳遞模型
  - H2: 沙箱相容性
  - H2: 工作階段目標解析
  - H2: ACP 控制
  - H3: 執行階段選項對應
  - H2: acpx 控制框架、外掛設定與權限
  - H2: 疑難排解
  - H2: 相關

## tools/agent-send.md

- 路由: /tools/agent-send
- 標題:
  - H2: 快速開始
  - H2: 旗標
  - H2: 行為
  - H2: 範例
  - H2: 相關

## tools/apply-patch.md

- 路由: /tools/apply-patch
- 標題:
  - H2: 參數
  - H2: 備註
  - H2: 範例
  - H2: 相關

## tools/brave-search.md

- 路由: /tools/brave-search
- 標題:
  - H2: 取得 API 金鑰
  - H2: 設定範例
  - H2: 工具參數
  - H2: 備註
  - H2: 相關

## tools/browser-control.md

- 路由: /tools/browser-control
- 標題:
  - H2: 控制 API（選用）
  - H3: /act 錯誤合約
  - H3: Playwright 需求
  - H4: Docker Playwright 安裝
  - H2: 運作方式（內部）
  - H2: 命令列介面快速參考
  - H2: 快照與參照
  - H2: 等待強化功能
  - H2: 偵錯工作流程
  - H2: JSON 輸出
  - H2: 狀態與環境旋鈕
  - H2: 安全性與隱私
  - H2: 相關

## tools/browser-linux-troubleshooting.md

- 路由: /tools/browser-linux-troubleshooting
- 標題:
  - H2: 問題：無法在連接埠 18800 啟動 Chrome CDP
  - H3: 根本原因
  - H3: 解決方案 1：安裝 Google Chrome（建議）
  - H3: 解決方案 2：在僅附加模式中使用 snap Chromium
  - H3: 驗證瀏覽器可正常運作
  - H3: 設定參考
  - H3: 問題：找不到 profile="user" 的 Chrome 分頁
  - H2: 相關

## tools/browser-login.md

- 路由: /tools/browser-login
- 標題:
  - H2: 手動登入（建議）
  - H2: 使用哪個 Chrome 個人資料？
  - H2: 沙箱：允許主機瀏覽器存取
  - H2: 相關

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- 路由：/tools/browser-wsl2-windows-remote-cdp-troubleshooting
- 標題：
  - H2：請先選擇正確的瀏覽器模式
  - H3：選項 1：從 WSL2 到 Windows 的原始遠端 CDP
  - H3：選項 2：主機本機 Chrome MCP
  - H2：運作架構
  - H2：控制 UI 的關鍵規則
  - H2：分層驗證
  - H3：第 1 層：確認 Chrome 正在 Windows 上提供 CDP
  - H3：第 2 層：確認 WSL2 可連到該 Windows 端點
  - H3：第 3 層：設定正確的瀏覽器設定檔
  - H3：第 4 層：分別驗證控制 UI 層
  - H3：第 5 層：驗證端到端瀏覽器控制
  - H2：常見的誤導性錯誤
  - H2：快速分流檢查清單
  - H2：相關

## tools/browser.md

- 路由：/tools/browser
- 標題：
  - H2：你會得到什麼
  - H2：快速開始
  - H2：外掛控制
  - H2：代理指引
  - H2：缺少瀏覽器命令或工具
  - H2：設定檔：openclaw 與使用者
  - H2：設定
  - H3：螢幕截圖視覺（支援純文字模型）
  - H2：使用 Brave 或其他基於 Chromium 的瀏覽器
  - H2：本機與遠端控制
  - H2：節點瀏覽器代理（零設定預設值）
  - H2：Browserless（託管遠端 CDP）
  - H3：同一主機上的 Browserless Docker
  - H2：直接 WebSocket CDP 提供者
  - H3：Browserbase
  - H3：Notte
  - H2：安全性
  - H2：設定檔（多瀏覽器）
  - H2：透過 Chrome DevTools MCP 使用現有工作階段
  - H3：自訂 Chrome MCP 啟動
  - H2：隔離保證
  - H2：瀏覽器選擇
  - H2：控制 API（選用）
  - H2：疑難排解
  - H3：CDP 啟動失敗與導覽 SSRF 封鎖
  - H2：代理工具 + 控制如何運作
  - H2：相關

## tools/btw.md

- 路由：/tools/btw
- 標題：
  - H2：它的作用
  - H2：它不會做什麼
  - H2：交付模型
  - H2：介面行為
  - H2：何時使用
  - H2：相關

## tools/capability-cookbook.md

- 路由：/tools/capability-cookbook
- 標題：
  - H2：相關

## tools/clawhub.md

- 路由：/tools/clawhub
- 標題：無

## tools/code-execution.md

- 路由：/tools/code-execution
- 標題：
  - H2：設定
  - H2：如何使用
  - H2：錯誤
  - H2：相關

## tools/creating-skills.md

- 路由：/tools/creating-skills
- 標題：
  - H2：建立你的第一個 skill
  - H2：SKILL.md 參考
  - H3：必填欄位
  - H3：選用前置中繼資料鍵
  - H3：使用 {baseDir}
  - H2：新增條件式啟用
  - H2：透過 Skill Workshop 提案
  - H2：發布到 ClawHub
  - H2：最佳實務
  - H2：相關

## tools/diffs.md

- 路由：/tools/diffs
- 標題：
  - H2：快速開始
  - H2：停用內建系統指引
  - H2：工具輸入參考
  - H2：語法醒目提示
  - H2：輸出詳細資料合約
  - H3：摺疊未變更區段
  - H2：外掛預設值
  - H3：持久化檢視器 URL 設定
  - H2：安全性設定
  - H2：成品生命週期與儲存
  - H2：檢視器 URL 與網路行為
  - H2：安全性模型
  - H2：檔案模式的瀏覽器需求
  - H2：疑難排解
  - H2：操作指引
  - H2：相關

## tools/duckduckgo-search.md

- 路由：/tools/duckduckgo-search
- 標題：
  - H2：設定
  - H2：組態
  - H2：工具參數
  - H2：注意事項
  - H2：相關

## tools/elevated.md

- 路由：/tools/elevated
- 標題：
  - H2：指令
  - H2：運作方式
  - H2：解析順序
  - H2：可用性與允許清單
  - H2：elevated 不控制的內容
  - H2：相關

## tools/exa-search.md

- 路由：/tools/exa-search
- 標題：
  - H2：安裝外掛
  - H2：取得 API 金鑰
  - H2：組態
  - H2：基底 URL 覆寫
  - H2：工具參數
  - H3：內容擷取
  - H3：搜尋模式
  - H2：注意事項
  - H2：相關

## tools/exec-approvals-advanced.md

- 路由：/tools/exec-approvals-advanced
- 標題：
  - H2：安全二進位檔（僅 stdin）
  - H3：Argv 驗證與拒絕的旗標
  - H3：受信任的二進位檔目錄
  - H3：Shell 串接、包裝器與多工器
  - H3：安全二進位檔與允許清單
  - H2：直譯器／執行階段命令
  - H3：後續交付行為
  - H2：將核准轉送到聊天頻道
  - H3：外掛核准轉送
  - H3：任何頻道上的同一聊天核准
  - H3：原生核准交付
  - H3：macOS IPC 流程
  - H2：常見問題
  - H3：什麼時候會在核准目標上使用 accountId 和 threadId？
  - H3：當核准傳送到工作階段時，該工作階段中的任何人都可以核准嗎？
  - H2：相關

## tools/exec-approvals.md

- 路由：/tools/exec-approvals
- 標題：
  - H2：適用範圍
  - H3：信任模型
  - H3：macOS 分割
  - H2：檢查有效政策
  - H2：設定與儲存
  - H2：政策旋鈕
  - H3：tools.exec.mode
  - H3：exec.security
  - H3：exec.ask
  - H3：askFallback
  - H3：tools.exec.strictInlineEval
  - H3：tools.exec.commandHighlighting
  - H2：YOLO 模式（無核准）
  - H3：持久化 Gateway 主機「永不提示」設定
  - H3：本機捷徑
  - H3：節點主機
  - H3：僅工作階段捷徑
  - H2：允許清單（每個代理）
  - H3：使用 argPattern 限制引數
  - H2：自動允許 skill 命令列介面
  - H2：安全二進位檔與核准轉送
  - H2：控制 UI 編輯
  - H2：核准流程
  - H2：系統事件與拒絕
  - H2：影響
  - H2：相關

## tools/exec.md

- 路由：/tools/exec
- 標題：
  - H2：參數
  - H2：組態
  - H3：模式
  - H3：內嵌 eval（strictInlineEval）
  - H3：PATH 處理
  - H2：工作階段覆寫（/exec）
  - H2：Exec 核准（配套應用程式／節點主機）
  - H2：允許清單 + 安全二進位檔
  - H2：範例
  - H2：applypatch
  - H2：相關

## tools/firecrawl.md

- 路由：/tools/firecrawl
- 標題：
  - H2：安裝外掛
  - H2：無金鑰 webfetch 與 API 金鑰
  - H2：設定 Firecrawl 搜尋
  - H2：設定 Firecrawl webfetch 備援
  - H3：自架 Firecrawl
  - H2：Firecrawl 外掛工具
  - H3：firecrawlsearch
  - H3：firecrawlscrape
  - H2：隱匿／規避 bot
  - H2：webfetch 如何使用 Firecrawl
  - H2：相關

## tools/gemini-search.md

- 路由：/tools/gemini-search
- 標題：
  - H2：取得 API 金鑰
  - H2：組態
  - H2：運作方式
  - H2：支援的參數
  - H2：模型選擇
  - H2：基底 URL 覆寫
  - H2：相關

## tools/goal.md

- 路由：/tools/goal
- 標題：
  - H1：目標
  - H2：快速開始
  - H2：目標的用途
  - H2：命令參考
  - H2：狀態
  - H2：Token 預算
  - H2：模型工具
  - H2：終端介面
  - H2：頻道行為
  - H2：疑難排解
  - H2：相關

## tools/grok-search.md

- 路由：/tools/grok-search
- 標題：
  - H2：上手與設定
  - H2：登入或取得 API 金鑰
  - H2：組態
  - H2：運作方式
  - H2：支援的參數
  - H2：基底 URL 覆寫
  - H2：相關

## tools/image-generation.md

- 路由：/tools/image-generation
- 標題：
  - H2：快速開始
  - H2：常見路由
  - H2：支援的提供者
  - H2：提供者能力
  - H2：工具參數
  - H2：設定
  - H3：模型選擇
  - H3：提供者選擇順序
  - H3：圖片編輯
  - H2：提供者深入解析
  - H2：範例
  - H2：相關

## tools/index.md

- 路由：/tools
- 標題：
  - H2：從這裡開始
  - H2：選擇工具、Skills 或外掛
  - H2：內建工具類別
  - H2：外掛提供的工具
  - H2：設定存取與核准
  - H2：擴充能力
  - H2：疑難排解缺少的工具
  - H2：相關

## tools/kimi-search.md

- 路由：/tools/kimi-search
- 標題：
  - H2：設定
  - H2：組態
  - H2：接地需求
  - H2：工具參數
  - H2：相關

## tools/llm-task.md

- 路由：/tools/llm-task
- 標題：
  - H2：啟用
  - H2：組態（選用）
  - H2：工具參數
  - H2：輸出
  - H2：範例：Lobster 工作流程步驟
  - H3：重要限制
  - H2：安全注意事項
  - H2：相關

## tools/lobster.md

- 路由：/tools/lobster
- 標題：
  - H2：原因
  - H2：運作方式
  - H2：啟用
  - H2：模式：小型命令列介面 + JSON 管線 + 核准
  - H2：僅 JSON 的 LLM 步驟（llm-task）
  - H3：重要限制：嵌入式 Lobster 與 openclaw.invoke
  - H2：工作流程檔案（.lobster）
  - H2：工具參數
  - H3：run
  - H3：resume
  - H3：受管理的任務流程模式
  - H2：輸出封套
  - H2：核准
  - H2：OpenProse
  - H2：安全性
  - H2：疑難排解
  - H2：了解更多
  - H2：案例研究：社群工作流程
  - H2：相關

## tools/loop-detection.md

- 路由：/tools/loop-detection
- 標題：
  - H2：為什麼存在
  - H2：組態區塊
  - H3：欄位行為
  - H2：建議設定
  - H2：壓縮後防護
  - H2：記錄與預期行為
  - H2：相關

## tools/media-overview.md

- 路由：/tools/media-overview
- 標題：
  - H2：能力
  - H2：提供者能力矩陣
  - H2：非同步與同步
  - H2：語音轉文字與語音通話
  - H2：提供者對應（供應商如何跨介面拆分）
  - H2：相關

## tools/minimax-search.md

- 路由：/tools/minimax-search
- 標題：
  - H2：取得 Token Plan 憑證
  - H2：組態
  - H2：區域選擇
  - H2：支援的參數
  - H2：相關

## tools/multi-agent-sandbox-tools.md

- 路由：/tools/multi-agent-sandbox-tools
- 標題：
  - H2：組態範例
  - H2：組態優先順序
  - H3：沙盒組態
  - H3：工具限制
  - H2：從單一代理遷移
  - H2：工具限制範例
  - H2：常見陷阱：「non-main」
  - H2：測試
  - H2：疑難排解
  - H2：相關

## tools/music-generation.md

- 路由：/tools/music-generation
- 標題：
  - H2：快速開始
  - H2：支援的提供者
  - H3：能力矩陣
  - H2：工具參數
  - H2：非同步行為
  - H3：任務生命週期
  - H2：設定
  - H3：模型選擇
  - H3：提供者選擇順序
  - H2：提供者注意事項
  - H2：選擇正確路徑
  - H2：提供者能力模式
  - H2：即時測試
  - H2：相關

## tools/ollama-search.md

- 路由：/tools/ollama-search
- 標題：
  - H2：設定
  - H2：組態
  - H2：驗證與請求路由
  - H2：相關

## tools/parallel-search.md

- 路由：/tools/parallel-search
- 標題：
  - H2：安裝外掛
  - H2：API 金鑰（付費提供者）
  - H2：組態
  - H2：基底 URL 覆寫
  - H2：工具參數
  - H2：注意事項
  - H2：相關

## tools/pdf.md

- 路由：/tools/pdf
- 標題：
  - H2：可用性
  - H2：輸入參考
  - H2：支援的 PDF 參照
  - H2：執行模式
  - H3：原生提供者模式
  - H3：擷取備援模式
  - H2：組態
  - H2：輸出詳細資料
  - H2：錯誤行為
  - H2：範例
  - H2：相關

## tools/permission-modes.md

- 路由：/tools/permission-modes
- 標題：
  - H2：建議預設值
  - H2：OpenClaw 主機 exec 模式
  - H2：Codex Guardian 對應
  - H2：ACPX harness 權限
  - H2：選擇模式
  - H2：相關

## tools/perplexity-search.md

- 路由：/tools/perplexity-search
- 標題：
  - H2：安裝外掛
  - H2：取得 Perplexity API 金鑰
  - H2：OpenRouter 相容性
  - H2：組態範例
  - H3：原生 Perplexity Search API
  - H3：OpenRouter / Sonar 相容性
  - H2：設定金鑰的位置
  - H2：工具參數
  - H3：網域篩選規則
  - H2：注意事項
  - H2：相關

## tools/plugin.md

- 路由：/tools/plugin
- 標題：
  - H2：需求
  - H2：快速開始
  - H2：設定
  - H3：選擇安裝來源
  - H3：操作者安裝政策
  - H3：設定外掛政策
  - H2：了解外掛格式
  - H2：外掛 hook
  - H2：驗證作用中的 Gateway
  - H2：疑難排解
  - H3：被封鎖的外掛路徑擁有權
  - H3：緩慢的外掛工具設定
  - H2：相關

## tools/reactions.md

- 路由：/tools/reactions
- 標題：
  - H2：運作方式
  - H2：頻道行為
  - H2：反應層級
  - H2：相關

## tools/searxng-search.md

- 路由：/tools/searxng-search
- 標題：
  - H2：設定
  - H2：組態
  - H2：環境變數
  - H2：外掛組態參考
  - H2：注意事項
  - H2：相關

## tools/skill-workshop.md

- 路由：/tools/skill-workshop
- 標題：
  - H2：運作方式
  - H2：生命週期
  - H2：聊天
  - H2：命令列介面
  - H2：提案內容
  - H2：支援檔案
  - H2：代理工具
  - H2：核准與自主性
  - H2：閘道方法
  - H2：儲存
  - H2：限制
  - H2：疑難排解
  - H2：相關

## tools/skills-config.md

- 路由：/tools/skills-config
- 標題：
  - H2：載入 (skills.load)
  - H2：安裝 (skills.install)
  - H2：操作者安裝政策 (security.installPolicy)
  - H2：內建技能允許清單
  - H2：個別技能項目 (skills.entries)
  - H2：代理允許清單 (agents)
  - H2：工作坊 (skills.workshop)
  - H2：符號連結技能根目錄
  - H2：沙箱化技能與環境變數
  - H2：載入順序提醒
  - H2：相關

## tools/skills.md

- 路由：/tools/skills
- 標題：
  - H2：載入順序
  - H2：個別代理與共用技能
  - H2：代理允許清單
  - H2：外掛與技能
  - H2：技能工作坊
  - H2：從 ClawHub 安裝
  - H2：安全性
  - H2：SKILL.md 格式
  - H3：選用 frontmatter 鍵
  - H2：閘控
  - H3：安裝程式規格
  - H2：設定覆寫
  - H2：環境注入
  - H2：快照與重新整理
  - H2：Token 影響
  - H2：相關

## tools/slash-commands.md

- 路由：/tools/slash-commands
- 標題：
  - H2：三種命令類型
  - H2：設定
  - H2：命令清單
  - H3：核心命令
  - H3：Dock 命令
  - H3：內建外掛命令
  - H3：技能命令
  - H2：/tools：代理現在可使用的工具
  - H2：/model：模型選擇
  - H2：/config：寫入磁碟設定
  - H2：/mcp：MCP 伺服器設定
  - H2：/debug：僅限執行階段的覆寫
  - H2：/plugins：外掛管理
  - H2：/trace：外掛追蹤輸出
  - H2：/btw：附帶問題
  - H2：介面備註
  - H2：提供者用量與狀態
  - H2：相關

## tools/steer.md

- 路由：/tools/steer
- 標題：
  - H2：目前工作階段
  - H2：引導與佇列
  - H2：子代理
  - H2：ACP 工作階段
  - H2：相關

## tools/subagents.md

- 路由：/tools/subagents
- 標題：
  - H2：Slash 命令
  - H3：執行緒繫結控制
  - H3：產生行為
  - H2：內容模式
  - H2：工具：sessionsspawn
  - H3：委派提示模式
  - H3：工具參數
  - H3：任務名稱與目標指定
  - H2：工具：sessionsyield
  - H2：工具：subagents
  - H2：執行緒繫結工作階段
  - H3：執行緒支援頻道
  - H3：快速流程
  - H3：手動控制
  - H3：設定開關
  - H3：允許清單
  - H3：探索
  - H3：自動封存
  - H2：巢狀子代理
  - H3：深度層級
  - H3：公告鏈
  - H3：依深度的工具政策
  - H3：每個代理的產生限制
  - H3：級聯停止
  - H2：驗證
  - H2：公告
  - H3：公告內容
  - H3：統計資料列
  - H3：為何偏好 sessionshistory
  - H2：工具政策
  - H3：透過設定覆寫
  - H2：並行
  - H2：存活性與復原
  - H2：停止
  - H2：限制
  - H2：相關

## tools/tavily.md

- 路由：/tools/tavily
- 標題：
  - H2：開始使用
  - H2：工具參考
  - H3：tavilysearch
  - H3：tavilyextract
  - H2：選擇正確的工具
  - H2：進階設定
  - H2：相關

## tools/thinking.md

- 路由：/tools/thinking
- 標題：
  - H2：功能說明
  - H2：解析順序
  - H2：設定工作階段預設值
  - H2：由代理套用
  - H2：快速模式 (/fast)
  - H2：詳細指令 (/verbose or /v)
  - H2：外掛追蹤指令 (/trace)
  - H2：推理可見性 (/reasoning)
  - H2：相關
  - H2：心跳偵測
  - H2：網頁聊天 UI
  - H2：提供者設定檔

## tools/tokenjuice.md

- 路由：/tools/tokenjuice
- 標題：
  - H2：啟用外掛
  - H2：tokenjuice 變更的內容
  - H2：驗證其是否運作
  - H2：停用外掛
  - H2：相關

## tools/tool-search.md

- 路由：/tools/tool-search
- 標題：
  - H2：一個回合的執行方式
  - H2：模式
  - H2：存在原因
  - H2：API
  - H2：執行階段邊界
  - H2：設定
  - H2：提示與遙測
  - H2：E2E 驗證
  - H2：失敗行為
  - H2：相關

## tools/trajectory.md

- 路由：/tools/trajectory
- 標題：
  - H2：快速開始
  - H2：存取
  - H2：記錄內容
  - H2：套件檔案
  - H2：擷取位置
  - H2：停用擷取
  - H2：調整清除逾時
  - H2：隱私權與限制
  - H2：疑難排解
  - H2：相關

## tools/tts.md

- 路由：/tools/tts
- 標題：
  - H2：快速開始
  - H2：支援的提供者
  - H2：設定
  - H3：個別代理語音覆寫
  - H2：角色
  - H3：最小角色
  - H3：完整角色（提供者中立提示）
  - H3：角色解析
  - H3：提供者如何使用角色提示
  - H3：後援政策
  - H2：模型驅動指令
  - H2：Slash 命令
  - H2：個別使用者偏好設定
  - H2：輸出格式
  - H2：自動 TTS 行為
  - H2：欄位參考
  - H2：代理工具
  - H2：閘道 RPC
  - H2：服務連結
  - H2：相關

## tools/video-generation.md

- 路由：/tools/video-generation
- 標題：
  - H2：快速開始
  - H2：非同步生成的運作方式
  - H3：任務生命週期
  - H2：支援的提供者
  - H3：功能矩陣
  - H2：工具參數
  - H3：必要
  - H3：內容輸入
  - H3：樣式控制
  - H3：進階
  - H4：後援與型別化選項
  - H2：動作
  - H2：模型選擇
  - H2：提供者備註
  - H2：提供者功能模式
  - H2：即時測試
  - H2：設定
  - H2：相關

## tools/web-fetch.md

- 路由：/tools/web-fetch
- 標題：
  - H2：快速開始
  - H2：工具參數
  - H2：運作方式
  - H2：進度更新
  - H2：設定
  - H2：Firecrawl 後援
  - H2：受信任的環境代理
  - H2：限制與安全
  - H2：工具設定檔
  - H2：相關

## tools/web.md

- 路由：/tools/web
- 標題：
  - H2：快速開始
  - H2：選擇提供者
  - H3：提供者比較
  - H2：自動偵測
  - H2：原生 OpenAI 網頁搜尋
  - H2：原生 Codex 網頁搜尋
  - H2：網路安全
  - H2：設定
  - H3：儲存 API 金鑰
  - H2：工具參數
  - H2：xsearch
  - H3：xsearch 設定
  - H3：xsearch 參數
  - H3：xsearch 範例
  - H2：範例
  - H2：工具設定檔
  - H2：相關

## tts.md

- 路由：/tts
- 標題：
  - H2：相關

## vps.md

- 路由：/vps
- 標題：
  - H2：選擇提供者
  - H2：雲端設定的運作方式
  - H2：先強化管理員存取
  - H2：VPS 上的共用公司代理
  - H2：搭配 VPS 使用節點
  - H2：小型 VM 與 ARM 主機的啟動調校
  - H3：systemd 調校檢查清單（選用）
  - H2：相關

## web/control-ui.md

- 路由：/web/control-ui
- 標題：
  - H2：快速開啟（本機）
  - H2：裝置配對（首次連線）
  - H2：配對行動裝置
  - H2：個人身分（瀏覽器本機）
  - H2：執行階段設定端點
  - H2：語言支援
  - H2：外觀主題
  - H2：可執行的操作（目前）
  - H2：MCP 頁面
  - H2：活動分頁
  - H2：操作者終端機
  - H2：聊天行為
  - H2：PWA 安裝與網頁推播
  - H2：託管嵌入
  - H2：聊天訊息寬度
  - H2：Tailnet 存取（建議）
  - H2：不安全的 HTTP
  - H2：內容安全政策
  - H2：頭像路由驗證
  - H2：助理媒體路由驗證
  - H2：建置 UI
  - H2：空白 Control UI 頁面
  - H2：偵錯/測試：開發伺服器 + 遠端閘道
  - H2：相關

## web/dashboard.md

- 路由：/web/dashboard
- 標題：
  - H2：快速路徑（建議）
  - H2：驗證基礎（本機與遠端）
  - H2：如果看到 "unauthorized" / 1008
  - H2：相關

## web/index.md

- 路由：/web
- 標題：
  - H2：設定（預設開啟）
  - H2：網路鉤子
  - H2：管理員 HTTP RPC
  - H2：Tailscale 存取
  - H2：安全性備註
  - H2：建置 UI

## web/tui.md

- 路由：/web/tui
- 標題：
  - H2：快速開始
  - H3：閘道模式
  - H3：本機模式
  - H2：你會看到的內容
  - H2：心智模型：代理 + 工作階段
  - H2：傳送 + 遞送
  - H2：選擇器 + 覆蓋層
  - H2：鍵盤快速鍵
  - H2：Slash 命令
  - H2：本機 shell 命令
  - H2：Crestodian 設定與修復輔助工具
  - H2：工具輸出
  - H2：終端機色彩
  - H2：歷史記錄 + 串流
  - H2：連線詳細資料
  - H2：選項
  - H2：疑難排解
  - H2：連線疑難排解
  - H2：相關

## web/webchat.md

- 路由：/web/webchat
- 標題：
  - H2：定義
  - H2：快速開始
  - H2：運作方式
  - H3：轉錄與遞送模型
  - H2：Control UI 代理工具面板
  - H2：遠端使用
  - H2：設定參考 (WebChat)
  - H2：相關

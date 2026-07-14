---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClaw 文件頁面的產生標題對照表
title: 文件對照表
x-i18n:
    generated_at: "2026-07-14T13:35:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 5bfe9aed596249c3a1a00f96dec2725f2d54757980b06c5be64b0484d7854fc0
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw 文件地圖

此檔案由 `docs/**/*.md` 和 `docs/**/*.mdx` 標題產生，用於協助代理程式瀏覽文件樹狀結構。
請勿手動編輯；請執行 `pnpm docs:map:gen`。

## agent-runtime-architecture.md

- 路由：/agent-runtime-architecture
- 標題：
  - H2：執行階段配置
  - H2：邊界
  - H2：資訊清單
  - H2：執行階段選擇
  - H2：相關內容

## announcements/bluebubbles-imessage.md

- 路由：/announcements/bluebubbles-imessage
- 標題：
  - H1：移除 BlueBubbles 與 imsg iMessage 路徑
  - H2：變更內容
  - H2：該怎麼做
  - H2：遷移注意事項
  - H2：另請參閱

## auth-credential-semantics.md

- 路由：/auth-credential-semantics
- 標題：
  - H2：穩定的探測原因代碼
  - H2：權杖認證資訊
  - H3：適用資格規則
  - H3：解析規則
  - H2：代理程式複本可攜性
  - H2：僅限設定的驗證路由
  - H2：明確認證順序篩選
  - H2：探測目標解析
  - H2：外部命令列介面認證資訊探索
  - H2：OAuth SecretRef 原則防護
  - H2：相容舊版的訊息傳遞
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
  - H2：快速入門
  - H2：排程的運作方式
  - H2：排程類型
  - H3：每月日期與每週日期使用 OR 邏輯
  - H2：事件觸發器（條件監看器）
  - H2：酬載
  - H3：代理程式回合選項
  - H3：命令酬載
  - H2：執行方式
  - H2：傳遞與輸出
  - H3：失敗通知
  - H3：輸出語言
  - H2：命令列介面範例
  - H2：管理工作
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
  - H2：選擇正確的介面
  - H2：快速入門
  - H2：事件類型
  - H2：撰寫掛鉤
  - H3：掛鉤結構
  - H3：HOOK.md 格式
  - H3：處理常式實作
  - H3：事件內容重點
  - H2：掛鉤探索
  - H3：掛鉤套件
  - H2：內建掛鉤
  - H3：session-memory 詳細資料
  - H3：bootstrap-extra-files 設定
  - H3：command-logger 詳細資料
  - H3：compaction-notifier 詳細資料
  - H3：boot-md 詳細資料
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
  - H3：排程工作（排程）與心跳偵測比較
  - H2：核心概念
  - H3：排程工作（排程）
  - H3：工作
  - H3：推斷的承諾
  - H3：任務流程
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
  - H2：運作方式
  - H2：常設指令的組成
  - H2：常設指令搭配排程工作
  - H2：範例
  - H3：範例 1：內容與社群媒體（每週週期）
  - H3：範例 2：財務作業（事件觸發）
  - H3：範例 3：監控與警示（持續）
  - H2：執行、驗證、報告模式
  - H2：多程式架構
  - H2：最佳實務
  - H3：應做事項
  - H3：應避免事項
  - H2：相關內容

## automation/taskflow.md

- 路由：/automation/taskflow
- 標題：
  - H2：何時使用任務流程
  - H2：同步模式
  - H3：受管理模式
  - H3：鏡像模式
  - H2：流程狀態
  - H2：持久狀態與修訂追蹤
  - H2：取消行為
  - H2：命令列介面命令
  - H2：可靠的排程工作流程模式
  - H2：流程與工作的關係
  - H2：相關內容

## automation/tasks.md

- 路由：/automation/tasks
- 標題：
  - H2：簡要說明
  - H2：快速入門
  - H2：建立工作的來源
  - H2：工作生命週期
  - H2：傳遞與通知
  - H3：通知原則
  - H2：命令列介面參考
  - H2：聊天工作看板（/tasks）
  - H3：控制介面
  - H2：狀態整合（工作壓力）
  - H2：儲存與維護
  - H3：工作儲存位置
  - H3：自動維護
  - H2：工作與其他系統的關係
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
  - H2：代理程式特定原則
  - H2：可見回覆模式
  - H2：歷程記錄
  - H2：疑難排解
  - H2：相關內容

## channels/bot-loop-protection.md

- 路由：/channels/bot-loop-protection
- 標題：
  - H2：預設值
  - H2：設定共用預設值
  - H2：依頻道、帳號或聊天室覆寫
  - H2：頻道支援

## channels/broadcast-groups.md

- 路由：/channels/broadcast-groups
- 標題：
  - H2：概觀
  - H2：設定
  - H3：基本設定
  - H3：處理策略
  - H3：完整範例
  - H2：運作方式
  - H3：訊息流程
  - H3：工作階段隔離
  - H3：範例：隔離的工作階段
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
  - H2：輸出目標前置字串
  - H2：工作階段金鑰格式（範例）
  - H2：主要私人訊息路由固定
  - H2：受防護的輸入記錄
  - H2：路由規則（如何選擇代理程式）
  - H2：廣播群組（執行多個代理程式）
  - H2：設定概觀
  - H2：工作階段儲存
  - H2：WebChat 行為
  - H2：回覆內容
  - H2：相關內容

## channels/clickclack.md

- 路由：/channels/clickclack
- 標題：
  - H2：快速設定
  - H3：帳號設定金鑰
  - H2：多個機器人
  - H2：回覆模式
  - H2：持久媒體傳遞
  - H2：代理程式活動列
  - H2：目標
  - H2：權限
  - H2：疑難排解

## channels/discord.md

- 路由：/channels/discord
- 標題：
  - H2：快速設定
  - H2：建議：設定伺服器工作區
  - H2：執行階段模型
  - H2：論壇頻道
  - H2：互動式元件
  - H2：存取控制與路由
  - H3：依角色路由代理程式
  - H2：原生命令與命令驗證
  - H2：功能詳細資料
  - H2：工具與動作閘門
  - H2：元件 v2 使用者介面
  - H2：語音
  - H3：語音頻道
  - H3：在語音中跟隨使用者
  - H3：語音訊息
  - H2：疑難排解
  - H2：設定參考
  - H2：安全性與操作
  - H2：相關內容

## channels/feishu.md

- 路由：/channels/feishu
- 標題：
  - H2：快速開始
  - H2：存取控制
  - H3：私訊
  - H3：群組聊天
  - H2：群組設定範例
  - H3：允許所有群組，不需要 @提及
  - H3：允許所有群組，但仍需要 @提及
  - H3：僅允許特定群組
  - H3：限制群組內的傳送者
  - H2：取得群組／使用者 ID
  - H3：群組 ID（chatid，格式：ocxxx）
  - H3：使用者 ID（openid，格式：ouxxx）
  - H2：常用命令
  - H2：疑難排解
  - H3：機器人在群組聊天中沒有回應
  - H3：機器人未收到訊息
  - H3：Feishu 行動應用程式中的 QR 設定沒有反應
  - H3：App Secret 外洩
  - H2：進階設定
  - H3：多個帳號
  - H3：訊息限制
  - H3：串流
  - H3：配額最佳化
  - H3：群組工作階段範圍與主題討論串
  - H3：Feishu 工作區工具
  - H3：ACP 工作階段
  - H4：持久 ACP 綁定
  - H4：從聊天建立 ACP
  - H3：多代理程式路由
  - H2：個別使用者的代理程式隔離（動態建立代理程式）
  - H3：快速設定
  - H3：運作方式
  - H3：設定選項
  - H3：工作階段範圍
  - H3：典型的多使用者部署
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
  - H2：公開 URL（僅限網路鉤子）
  - H3：選項 A：Tailscale Funnel（建議）
  - H3：選項 B：反向代理伺服器（Caddy）
  - H3：選項 C：Cloudflare Tunnel
  - H2：運作方式
  - H2：目標
  - H2：設定重點
  - H2：疑難排解
  - H3：405 不允許的方法
  - H3：其他問題
  - H2：相關內容

## channels/group-messages.md

- 路由：/channels/group-messages
- 標題：
  - H2：行為
  - H2：設定範例（WhatsApp）
  - H3：啟用命令（僅限擁有者）
  - H2：使用方式
  - H2：測試／驗證
  - H2：已知注意事項
  - H2：相關內容

## channels/groups.md

- 路由：/channels/groups
- 標題：
  - H2：初學者簡介（2 分鐘）
  - H2：可見的回覆
  - H2：內容可見性與允許清單
  - H2：工作階段金鑰
  - H2：模式：個人私訊 + 公開群組（單一代理程式）
  - H2：顯示標籤
  - H2：群組政策
  - H2：提及閘控（預設）
  - H2：範圍設定的提及模式
  - H2：群組／頻道工具限制（選用）
  - H2：群組允許清單
  - H2：啟用（僅限擁有者）
  - H2：內容欄位
  - H2：iMessage 特定事項
  - H2：WhatsApp 系統提示詞
  - H2：WhatsApp 特定事項
  - H2：相關內容

## channels/imessage-from-bluebubbles.md

- 路由：/channels/imessage-from-bluebubbles
- 標題：
  - H2：遷移檢查清單
  - H2：imsg 的功能
  - H2：開始之前
  - H2：設定轉換
  - H2：群組登錄檔陷阱
  - H2：逐步操作
  - H2：操作對等性一覽
  - H2：配對、工作階段與 ACP 綁定
  - H2：沒有復原頻道
  - H2：相關內容

## channels/imessage.md

- 路由：/channels/imessage
- 標題：
  - H2：快速設定
  - H2：需求與權限（macOS）
  - H2：啟用 imsg 私有 API
  - H3：設定
  - H3：SIP 保持啟用時
  - H2：存取控制與路由
  - H2：ACP 對話綁定
  - H2：部署模式
  - H2：媒體、分塊與傳遞目標
  - H2：私有 API 操作
  - H2：設定寫入
  - H2：合併分次傳送的私訊（在單次撰寫中包含命令 + URL）
  - H3：情境以及代理程式看到的內容
  - H2：橋接器或閘道重新啟動後的入站復原
  - H3：操作人員可見的訊號
  - H3：遷移
  - H2：疑難排解
  - H2：設定參考指引
  - H2：相關內容

## channels/index.md

- 路由：/channels
- 標題：
  - H2：支援的頻道
  - H2：傳遞注意事項
  - H2：注意事項

## channels/irc.md

- 路由：/channels/irc
- 標題：
  - H2：快速開始
  - H2：連線設定
  - H2：安全性預設值
  - H2：存取控制
  - H3：常見陷阱：allowFrom 適用於私訊，而非頻道
  - H2：回覆觸發（提及）
  - H2：安全性注意事項（建議用於公開頻道）
  - H3：頻道中的所有人使用相同工具
  - H3：依傳送者使用不同工具（擁有者具有更多權限）
  - H2：NickServ
  - H2：環境變數
  - H2：疑難排解
  - H2：相關內容

## channels/line.md

- 路由：/channels/line
- 標題：
  - H2：安裝
  - H2：設定
  - H2：設定
  - H2：存取控制
  - H2：訊息行為
  - H2：頻道資料（豐富訊息）
  - H2：ACP 支援
  - H2：出站媒體
  - H2：疑難排解
  - H2：相關內容

## channels/location.md

- 路由：/channels/location
- 標題：
  - H2：文字格式
  - H2：內容欄位
  - H2：出站承載資料
  - H2：頻道注意事項
  - H2：相關內容

## channels/matrix-migration.md

- 路由：/channels/matrix-migration
- 標題：
  - H2：遷移會自動執行的操作
  - H2：從早於 2026.4 的 OpenClaw 版本升級
  - H2：建議的升級流程
  - H2：常見訊息及其含義
  - H3：手動復原訊息
  - H2：如果加密記錄仍未恢復
  - H2：如果要針對未來訊息重新開始
  - H2：相關內容

## channels/matrix-presentation.md

- 路由：/channels/matrix-presentation
- 標題：
  - H2：事件內容
  - H2：後援行為
  - H2：支援的區塊
  - H2：互動
  - H2：與核准中繼資料的關係
  - H2：媒體訊息

## channels/matrix-push-rules.md

- 路由：/channels/matrix-push-rules
- 標題：
  - H2：先決條件
  - H2：步驟
  - H2：多機器人注意事項
  - H2：Homeserver 注意事項
  - H2：相關內容

## channels/matrix.md

- 路由：/channels/matrix
- 標題：
  - H2：安裝
  - H2：設定
  - H3：互動式設定
  - H3：最小設定
  - H3：自動加入
  - H3：允許清單目標格式
  - H3：帳號 ID 正規化
  - H3：快取的認證資訊
  - H3：環境變數
  - H2：設定範例
  - H2：串流預覽
  - H2：語音訊息
  - H2：核准中繼資料
  - H3：用於靜默完成預覽的自架推播規則
  - H2：機器人對機器人房間
  - H2：加密與驗證
  - H3：啟用加密
  - H3：狀態與信任訊號
  - H3：使用復原金鑰驗證此裝置
  - H3：啟動或修復交叉簽署
  - H3：房間金鑰備份
  - H3：列出、要求及回應驗證
  - H3：多帳號注意事項
  - H2：個人檔案管理
  - H2：討論串
  - H3：工作階段路由（sessionScope）
  - H3：回覆討論串（threadReplies）
  - H3：討論串繼承與斜線命令
  - H2：ACP 對話綁定
  - H3：討論串綁定設定
  - H2：反應
  - H2：歷史記錄內容
  - H2：內容可見性
  - H2：私訊與房間政策
  - H2：直接房間修復
  - H2：執行核准
  - H2：斜線命令
  - H2：多帳號
  - H2：私人／區域網路 Homeserver
  - H2：代理 Matrix 流量
  - H2：目標解析
  - H2：設定參考
  - H3：帳號與連線
  - H3：加密
  - H3：存取與政策
  - H3：回覆行為
  - H3：反應設定
  - H3：工具與個別房間覆寫
  - H3：執行核准設定
  - H2：相關內容

## channels/mattermost.md

- 路由：/channels/mattermost
- 標題：
  - H2：安裝
  - H2：快速設定
  - H2：原生斜線命令
  - H2：環境變數（預設帳號）
  - H2：聊天模式
  - H2：討論串與工作階段
  - H2：存取控制（私訊）
  - H2：頻道（群組）
  - H2：出站傳遞目標
  - H2：私訊頻道重試
  - H2：預覽串流
  - H2：反應（訊息工具）
  - H2：互動式按鈕（訊息工具）
  - H3：直接 API 整合（外部指令碼）
  - H2：目錄配接器
  - H2：多帳號
  - H2：疑難排解
  - H2：相關內容

## channels/msteams.md

- 路由：/channels/msteams
- 標題：
  - H2：內建外掛
  - H2：快速設定
  - H2：目標
  - H2：設定寫入
  - H2：存取控制（私訊 + 群組）
  - H3：運作方式
  - H3：步驟 1：建立 Azure Bot
  - H3：步驟 2：取得認證資訊
  - H3：步驟 3：設定訊息端點
  - H3：步驟 4：啟用 Teams 頻道
  - H3：步驟 5：建立 Teams 應用程式資訊清單
  - H3：步驟 6：設定 OpenClaw
  - H3：步驟 7：執行閘道
  - H2：同盟驗證（憑證加上受控識別）
  - H3：選項 A：憑證式驗證
  - H3：選項 B：Azure 受控識別
  - H3：AKS 工作負載識別設定
  - H3：驗證類型比較
  - H2：本機開發（通道）
  - H2：測試機器人
  - H2：環境變數
  - H2：成員資訊動作
  - H2：歷史記錄情境
  - H2：目前的 Teams RSC 權限（資訊清單）
  - H2：Teams 資訊清單範例（已遮蔽）
  - H3：資訊清單注意事項（必要欄位）
  - H3：更新現有應用程式
  - H2：功能：僅 RSC 與 Graph 的比較
  - H3：僅使用 Teams RSC（已安裝應用程式，無 Graph API 權限）
  - H3：使用 Teams RSC + Microsoft Graph 應用程式權限
  - H3：RSC 與 Graph API 的比較
  - H2：啟用 Graph 的媒體 + 歷史記錄
  - H3：頻道／群組檔案復原（graphMediaFallback）
  - H2：已知限制
  - H3：網路鉤子逾時
  - H3：Teams 雲端與服務 URL 支援
  - H3：格式設定
  - H2：設定
  - H2：路由與工作階段
  - H2：回覆樣式：討論串與貼文
  - H3：解析優先順序
  - H3：保留討論串情境
  - H2：附件與圖片
  - H2：在群組聊天中傳送檔案
  - H3：群組聊天需要 SharePoint 的原因
  - H3：設定
  - H3：分享行為
  - H3：備援行為
  - H3：檔案儲存位置
  - H2：投票（Adaptive Cards）
  - H2：呈現卡片
  - H2：目標格式
  - H2：主動訊息傳送
  - H2：團隊與頻道 ID（常見陷阱）
  - H2：私人頻道
  - H2：疑難排解
  - H3：常見問題
  - H3：資訊清單上傳錯誤
  - H3：RSC 權限無法運作
  - H2：參考資料
  - H2：相關內容

## channels/nextcloud-talk.md

- 路由：/channels/nextcloud-talk
- 標題：
  - H2：安裝
  - H2：快速設定（初學者）
  - H2：注意事項
  - H2：存取控制（私訊）
  - H2：聊天室（群組）
  - H2：功能
  - H2：設定參考（Nextcloud Talk）
  - H2：相關內容

## channels/nostr.md

- 路由：/channels/nostr
- 標題：
  - H2：安裝
  - H3：非互動式設定
  - H2：快速設定
  - H2：設定參考
  - H2：個人檔案中繼資料
  - H2：存取控制
  - H3：私訊原則
  - H3：允許清單範例
  - H2：金鑰格式
  - H2：中繼站
  - H2：通訊協定支援
  - H2：測試
  - H3：本機中繼站
  - H3：手動測試
  - H2：疑難排解
  - H3：未收到訊息
  - H3：未傳送回覆
  - H3：重複回覆
  - H2：安全性
  - H2：限制（MVP）
  - H2：相關內容

## channels/pairing.md

- 路由：/channels/pairing
- 標題：
  - H2：1）私訊配對（傳入聊天存取權）
  - H3：核准傳送者
  - H3：可重複使用的傳送者群組
  - H3：狀態儲存位置
  - H2：2）節點裝置配對（iOS／Android／macOS／無介面節點）
  - H3：從控制介面配對（建議）
  - H3：透過 Telegram 配對
  - H3：核准節點裝置
  - H3：選用的信任 CIDR 節點自動核准
  - H3：節點配對狀態儲存
  - H3：注意事項
  - H2：相關文件

## channels/qa-channel.md

- 路由：/channels/qa-channel
- 標題：
  - H2：功能
  - H2：設定
  - H2：執行器
  - H2：相關內容

## channels/qqbot.md

- 路由：/channels/qqbot
- 標題：
  - H2：安裝
  - H2：設定
  - H2：設定
  - H3：串流
  - H3：存取原則
  - H3：多帳號設定
  - H3：群組聊天
  - H3：語音（STT／TTS）
  - H2：目標格式
  - H2：斜線命令
  - H2：媒體與儲存空間
  - H2：疑難排解
  - H2：相關內容

## channels/raft.md

- 路由：/channels/raft
- 標題：
  - H2：安裝
  - H2：先決條件
  - H2：設定
  - H2：運作方式
  - H2：驗證
  - H2：疑難排解
  - H2：參考資料

## channels/reef.md

- 路由：/channels/reef
- 標題：
  - H2：快速開始
  - H2：由代理程式驅動的設定
  - H2：設定
  - H2：新增朋友
  - H2：傳送與接收
  - H2：防護機制與擁有者審查
  - H2：疑難排解

## channels/signal.md

- 路由：/channels/signal
- 標題：
  - H2：號碼模型（請先閱讀）
  - H2：安裝
  - H2：快速設定
  - H2：簡介
  - H2：設定路徑 A：連結現有 Signal 帳號（QR）
  - H2：設定路徑 B：註冊專用機器人號碼（SMS、Linux）
  - H2：外部常駐程式模式（httpUrl）
  - H2：容器模式（bbernhard/signal-cli-rest-api）
  - H2：存取控制（私訊 + 群組）
  - H2：運作方式（行為）
  - H2：媒體 + 限制
  - H2：輸入中狀態 + 已讀回條
  - H2：生命週期狀態反應
  - H2：反應（訊息工具）
  - H2：核准反應
  - H2：傳送目標（命令列介面／排程）
  - H2：別名
  - H2：疑難排解
  - H2：安全性注意事項
  - H2：設定參考（Signal）
  - H2：相關內容

## channels/slack.md

- 路由：/channels/slack
- 標題：
  - H2：選擇傳輸方式
  - H3：中繼模式
  - H3：Enterprise Grid 全組織安裝
  - H4：Socket Mode
  - H4：HTTP Request URLs
  - H2：安裝
  - H2：快速設定
  - H2：Socket Mode 傳輸調校
  - H2：資訊清單與範圍檢查清單
  - H3：其他資訊清單設定
  - H2：權杖模型
  - H2：動作與關卡
  - H2：存取控制與路由
  - H2：討論串、工作階段與回覆標籤
  - H2：確認反應
  - H3：表情符號（ackReaction）
  - H3：範圍（messages.ackReactionScope）
  - H2：文字串流
  - H2：輸入中反應備援
  - H2：語音輸入
  - H2：媒體、分段與傳送
  - H2：命令與斜線行為
  - H2：原生圖表
  - H2：原生表格
  - H2：互動式回覆
  - H3：外掛所擁有的互動視窗提交
  - H2：Slack 中的原生核准
  - H2：事件與作業行為
  - H2：設定參考
  - H2：疑難排解
  - H2：附件媒體參考
  - H3：支援的媒體類型
  - H3：傳入管線
  - H3：討論串根訊息附件繼承
  - H3：多附件處理
  - H3：大小、下載與模型限制
  - H3：已知限制
  - H3：相關文件
  - H2：相關內容

## channels/sms.md

- 路由：/channels/sms
- 標題：
  - H2：開始之前
  - H2：快速設定
  - H2：設定範例
  - H3：設定檔
  - H3：環境變數
  - H3：SecretRef 驗證權杖
  - H3：Messaging Service 傳送者
  - H3：預設傳出目標
  - H2：存取控制
  - H2：傳送 SMS
  - H2：驗證設定
  - H3：從 macOS iMessage／SMS 進行端對端測試
  - H2：網路鉤子安全性
  - H2：多帳號設定
  - H2：疑難排解
  - H3：Twilio 傳回 403，或 OpenClaw 拒絕網路鉤子
  - H3：未出現配對要求
  - H3：傳出訊息傳送失敗
  - H3：訊息已送達，但代理程式未回覆

## channels/synology-chat.md

- 路由：/channels/synology-chat
- 標題：
  - H2：安裝
  - H2：快速設定
  - H2：環境變數
  - H2：私訊原則與存取控制
  - H2：傳出訊息傳送
  - H2：多帳號
  - H2：安全性注意事項
  - H2：疑難排解
  - H2：相關內容

## channels/telegram.md

- 路由：/channels/telegram
- 標題：
  - H2：快速設定
  - H2：Telegram 端設定
  - H2：儀表板 Mini App
  - H2：存取控制與啟用
  - H3：群組機器人識別
  - H2：執行階段行為
  - H2：功能參考
  - H2：錯誤回覆控制
  - H2：疑難排解
  - H2：設定參考
  - H2：相關內容

## channels/tlon.md

- 路由：/channels/tlon
- 標題：
  - H2：內建外掛
  - H2：設定
  - H2：私人／區域網路 ship
  - H2：群組頻道
  - H2：存取控制
  - H2：擁有者與核准系統
  - H2：自動接受設定
  - H2：透過 Urbit 設定儲存區進行熱重新載入
  - H2：傳送目標（命令列介面／排程）
  - H2：內建 Skills
  - H2：功能
  - H2：疑難排解
  - H2：設定參考
  - H2：注意事項
  - H2：相關內容

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
  - H2：相關內容

## channels/twitch.md

- 路由：/channels/twitch
- 標題：
  - H2：安裝
  - H2：快速設定
  - H2：功能簡介
  - H2：權杖重新整理（選用）
  - H2：多帳號支援
  - H2：存取控制
  - H2：疑難排解
  - H2：設定
  - H3：帳號設定
  - H3：提供者選項
  - H2：工具動作
  - H2：安全性與維運
  - H2：限制
  - H2：相關內容

## channels/wechat.md

- 路由：/channels/wechat
- 標題：
  - H2：命名
  - H2：運作方式
  - H2：安裝
  - H2：登入
  - H2：存取控制
  - H2：相容性
  - H2：輔助程序
  - H2：疑難排解
  - H2：相關文件

## channels/whatsapp.md

- 路由：/channels/whatsapp
- 標題：
  - H2：安裝
  - H2：快速設定
  - H2：部署模式
  - H2：執行階段模型
  - H2：使用 MeowCaller 呼叫目前的請求者（實驗性）
  - H2：核准提示
  - H2：外掛掛鉤與隱私權
  - H2：存取控制與啟用
  - H2：已設定的 ACP 繫結
  - H2：個人號碼與自我聊天行為
  - H2：訊息正規化與上下文
  - H2：傳遞、分塊與媒體
  - H2：回覆引文
  - H2：回應層級
  - H2：確認回應
  - H2：生命週期狀態回應
  - H2：多帳號與認證資訊
  - H2：工具、動作與設定寫入
  - H2：疑難排解
  - H2：系統提示
  - H2：設定參考指引
  - H2：相關內容

## channels/yuanbao.md

- 路由：/channels/yuanbao
- 標題：
  - H2：快速開始
  - H3：互動式設定（替代方式）
  - H2：存取控制
  - H3：私訊
  - H3：群組聊天
  - H2：設定範例
  - H2：常用命令
  - H2：疑難排解
  - H2：進階設定
  - H3：多個帳號
  - H3：訊息限制
  - H3：串流
  - H3：群組聊天記錄上下文
  - H3：回覆模式
  - H3：Markdown 提示注入
  - H3：偵錯模式
  - H3：多代理程式路由
  - H2：設定參考
  - H2：支援的訊息類型
  - H2：相關內容

## channels/zalo.md

- 路由：/channels/zalo
- 標題：
  - H2：隨附外掛
  - H2：快速設定
  - H2：功能簡介
  - H2：運作方式
  - H2：限制
  - H2：存取控制
  - H3：私訊
  - H3：群組
  - H2：長輪詢與網路鉤子
  - H2：支援的訊息類型
  - H2：功能
  - H2：傳遞目標（命令列介面／排程）
  - H2：疑難排解
  - H2：設定參考
  - H2：相關內容

## channels/zaloclawbot.md

- 路由：/channels/zaloclawbot
- 標題：
  - H2：相容性
  - H2：先決條件
  - H2：使用 onboard 安裝（建議）
  - H2：手動安裝
  - H3：1. 安裝外掛
  - H3：2. 在設定中啟用外掛
  - H3：3. 產生 QR Code 並登入
  - H3：4. 重新啟動閘道
  - H2：運作方式
  - H2：底層機制
  - H2：疑難排解
  - H2：相關內容

## channels/zalouser.md

- 路由：/channels/zalouser
- 標題：
  - H2：安裝
  - H2：快速設定
  - H2：功能簡介
  - H2：命名
  - H2：尋找 ID（目錄）
  - H2：限制
  - H2：存取控制（私訊）
  - H2：群組存取（選用）
  - H3：群組提及閘控
  - H2：多帳號
  - H2：環境變數
  - H2：輸入狀態、回應與傳遞確認
  - H2：疑難排解
  - H2：相關內容

## ci.md

- 路由：/ci
- 標題：
  - H2：管線概觀
  - H2：快速失敗順序
  - H2：PR 上下文與證據
  - H2：範圍與路由
  - H2：ClawSweeper 活動轉送
  - H2：手動分派
  - H2：執行器
  - H2：執行器註冊預算
  - H2：本機對應命令
  - H2：OpenClaw 效能
  - H2：完整發行驗證
  - H2：即時與 E2E 分片
  - H2：套件驗收
  - H3：工作
  - H3：候選來源
  - H3：測試套件設定檔
  - H3：舊版相容期間
  - H3：範例
  - H2：安裝煙霧測試
  - H2：本機 Docker E2E
  - H3：可調整參數
  - H3：可重複使用的即時／E2E 工作流程
  - H3：發行路徑區塊
  - H2：外掛預發行
  - H2：QA 實驗室
  - H2：CodeQL
  - H3：安全性類別
  - H3：平台特定安全性分片
  - H3：關鍵品質類別
  - H2：維護工作流程
  - H3：文件代理程式
  - H3：測試效能代理程式
  - H3：合併後的重複 PR
  - H2：本機檢查閘門與變更路由
  - H2：Testbox 驗證
  - H2：相關內容

## clawhub/cli.md

- 路由：/clawhub/cli
- 標題：
  - H1：ClawHub 命令列介面
  - H2：探索與安裝
  - H3：發行信任
  - H2：發布與維護
  - H2：相關內容

## clawhub/publishing.md

- 路由：/clawhub/publishing
- 標題：
  - H1：在 ClawHub 上發布
  - H2：擁有者
  - H2：Skills
  - H2：外掛
  - H2：發行流程
  - H2：常見問題
  - H3：套件範圍必須符合所選擁有者

## cli/acp.md

- 路由：/cli/acp
- 標題：
  - H2：這不是什麼
  - H2：相容性矩陣
  - H2：已知限制
  - H2：用法
  - H2：ACP 用戶端（偵錯）
  - H2：通訊協定煙霧測試
  - H2：使用方式
  - H2：選取代理程式
  - H2：從 acpx 使用（Codex、Claude、其他 ACP 用戶端）
  - H2：Zed 編輯器設定
  - H2：工作階段對應
  - H2：選項
  - H3：acp 用戶端選項
  - H2：相關內容

## cli/agent.md

- 路由：/cli/agent
- 標題：
  - H1：openclaw agent
  - H2：選項
  - H2：範例
  - H2：注意事項
  - H2：JSON 傳遞狀態
  - H2：相關內容

## cli/agents.md

- 路由：/cli/agents
- 標題：
  - H1：openclaw agents
  - H2：範例
  - H2：命令介面
  - H3：agents list
  - H3：agents add [name]
  - H3：agents bindings
  - H3：agents bind
  - H3：agents unbind
  - H3：agents set-identity
  - H3：agents delete &lt;id&gt;
  - H2：路由繫結
  - H3：--bind 格式
  - H3：繫結範圍行為
  - H2：身分檔案
  - H2：設定身分
  - H2：相關內容

## cli/approvals.md

- 路由：/cli/approvals
- 標題：
  - H1：openclaw approvals
  - H2：openclaw exec-policy
  - H2：常用命令
  - H2：從檔案取代核准設定
  - H2：“永不提示”／YOLO 範例
  - H2：允許清單輔助工具
  - H2：常用選項
  - H2：注意事項
  - H2：相關內容

## cli/attach.md

- 路由：/cli/attach
- 標題：無

## cli/audit.md

- 路由：/cli/audit
- 標題：
  - H1：openclaw audit
  - H2：篩選條件
  - H2：已記錄事件
  - H2：閘道 RPC
  - H2：相關內容

## cli/backup.md

- 路由：/cli/backup
- 標題：
  - H1：openclaw backup
  - H2：注意事項
  - H2：SQLite 快照
  - H3：驗證與還原
  - H2：備份內容
  - H2：無效設定行為
  - H2：大小與效能
  - H2：相關內容

## cli/browser.md

- 路由：/cli/browser
- 標題：
  - H1：openclaw browser
  - H2：常用旗標
  - H2：快速開始（本機）
  - H2：快速疑難排解
  - H2：生命週期
  - H2：如果缺少此命令
  - H2：設定檔
  - H2：分頁
  - H2：快照／螢幕擷取畫面／動作
  - H2：狀態與儲存空間
  - H2：偵錯
  - H2：透過 MCP 使用現有 Chrome
  - H2：遠端瀏覽器控制（節點主機 Proxy）
  - H2：相關內容

## cli/channels.md

- 路由：/cli/channels
- 標題：
  - H1：openclaw channels
  - H2：常用命令
  - H2：狀態／功能／解析／日誌
  - H2：新增／移除帳號
  - H2：登入與登出（互動式）
  - H2：疑難排解
  - H2：功能探測
  - H2：將名稱解析為 ID
  - H2：相關內容

## cli/clawbot.md

- 路由：/cli/clawbot
- 標題：
  - H1：openclaw clawbot
  - H2：遷移
  - H2：相關內容

## cli/commitments.md

- 路由：/cli/commitments
- 標題：
  - H2：用法
  - H2：選項
  - H2：範例
  - H2：輸出
  - H2：相關內容

## cli/completion.md

- 路由：/cli/completion
- 標題：
  - H1：openclaw completion
  - H2：用法
  - H2：選項
  - H2：安裝流程
  - H2：注意事項
  - H2：相關內容

## cli/config.md

- 路由：/cli/config
- 標題：
  - H2：根層級選項
  - H2：範例
  - H3：路徑
  - H3：config get
  - H3：config file
  - H3：config schema
  - H3：config validate
  - H2：值
  - H2：config set 模式
  - H3：供應商建構器旗標
  - H2：config patch
  - H2：試執行
  - H3：JSON 輸出格式
  - H2：套用變更
  - H2：寫入安全性
  - H2：修復迴圈
  - H2：相關內容

## cli/configure.md

- 路由：/cli/configure
- 標題：
  - H1：openclaw configure
  - H2：選項
  - H2：模型區段
  - H2：網頁區段
  - H2：其他注意事項
  - H2：相關內容

## cli/crestodian.md

- 路由：/cli/crestodian
- 標題：
  - H1：openclaw crestodian
  - H2：啟動時機
  - H2：Crestodian 顯示的內容
  - H2：範例
  - H2：操作與核准
  - H3：切換至遮罩式頻道設定
  - H2：設定引導程序
  - H2：AI 對話
  - H3：命令列介面框架的信任模型
  - H2：切換至代理程式
  - H2：訊息救援模式
  - H2：相關內容

## cli/cron.md

- 路由：/cli/cron
- 標題：
  - H1：openclaw cron
  - H2：快速建立工作
  - H2：工作階段
  - H2：傳遞
  - H3：傳遞的所有權
  - H3：失敗傳遞
  - H2：排程
  - H3：單次工作
  - H3：週期性工作
  - H3：手動執行
  - H2：模型
  - H3：隔離排程模型的優先順序
  - H3：快速模式
  - H3：即時模型切換重試
  - H2：執行輸出與拒絕
  - H3：抑制過時的確認訊息
  - H3：抑制靜默權杖
  - H3：結構化拒絕
  - H2：保留
  - H2：遷移舊版工作
  - H2：常見編輯操作
  - H2：常見管理命令
  - H2：相關內容

## cli/daemon.md

- 路由：/cli/daemon
- 標題：
  - H1：openclaw daemon
  - H2：用法
  - H2：子命令與選項
  - H2：注意事項
  - H2：相關內容

## cli/dashboard.md

- 路由：/cli/dashboard
- 標題：
  - H1：openclaw dashboard
  - H2：機器可讀輸出
  - H2：相關內容

## cli/devices.md

- 路由：/cli/devices
- 標題：
  - H1：openclaw devices
  - H2：常用選項
  - H2：命令
  - H3：openclaw devices list
  - H3：openclaw devices approve [requestId] [--latest]
  - H3：openclaw devices reject &lt;requestId&gt;
  - H3：openclaw devices remove &lt;deviceId&gt;
  - H3：openclaw devices rename --device &lt;id&gt; --name &lt;label&gt;
  - H3：openclaw devices clear --yes [--pending]
  - H3：openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3：openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2：注意事項
  - H2：權杖偏移復原檢查清單
  - H2：Paperclip／openclawgateway 首次執行核准
  - H2：相關內容

## cli/directory.md

- 路由：/cli/directory
- 標題：
  - H1：openclaw directory
  - H2：常用旗標
  - H2：注意事項
  - H2：將結果用於傳送訊息
  - H2：各頻道的 ID 格式
  - H2：自己（"me"）
  - H2：對等方（聯絡人／使用者）
  - H2：群組
  - H2：相關內容

## cli/dns.md

- 路由：/cli/dns
- 標題：
  - H1：openclaw dns
  - H2：dns setup
  - H2：相關內容

## cli/docs.md

- 路由：/cli/docs
- 標題：
  - H1：openclaw docs
  - H2：用法
  - H2：範例
  - H2：運作方式
  - H2：輸出
  - H2：結束代碼
  - H2：相關內容

## cli/doctor.md

- 路由：/cli/doctor
- 標題：
  - H1：openclaw doctor
  - H2：運作模式
  - H2：範例
  - H2：選項
  - H2：檢查模式
  - H2：結構化健康狀態檢查
  - H2：檢查項目選擇
  - H2：升級後模式
  - H2：共用狀態 SQLite 壓縮
  - H2：工作階段 SQLite 遷移
  - H3：工作階段 SQLite 遷移後降級
  - H2：注意事項
  - H2：macOS：launchctl 環境變數覆寫
  - H2：相關內容

## cli/fleet.md

- 路由：/cli/fleet
- 標題：
  - H1：openclaw fleet
  - H2：快速開始
  - H2：租戶 ID
  - H2：fleet create
  - H3：建立選項
  - H3：依摘要固定版本
  - H3：磁碟限制
  - H3：輸出流量政策
  - H2：fleet list
  - H2：fleet status
  - H2：fleet logs
  - H2：fleet start、fleet stop 與 fleet restart
  - H2：fleet upgrade
  - H2：fleet backup 與 fleet restore
  - H2：fleet doctor
  - H2：fleet rm
  - H2：儲存空間與容器配置
  - H2：安全性設定檔
  - H2：權杖處理
  - H2：相關內容

## cli/flows.md

- 路由：/cli/flows
- 標題：
  - H1：openclaw tasks flow
  - H2：子命令
  - H3：狀態篩選值
  - H2：範例
  - H2：相關內容

## cli/gateway.md

- 路由：/cli/gateway
- 標題：
  - H2：執行閘道
  - H3：選項
  - H2：重新啟動閘道
  - H3：閘道效能分析
  - H2：查詢執行中的閘道
  - H3：gateway health
  - H3：gateway usage-cost
  - H3：gateway stability
  - H3：gateway diagnostics export
  - H3：gateway status
  - H3：gateway probe
  - H4：透過 SSH 遠端連線（與 Mac 應用程式功能一致）
  - H3：gateway call &lt;method&gt;
  - H2：管理閘道服務
  - H3：使用包裝程式安裝
  - H2：探索閘道（Bonjour）
  - H3：gateway discover
  - H2：相關內容

## cli/health.md

- 路由：/cli/health
- 標題：
  - H1：openclaw health
  - H2：選項
  - H2：行為
  - H2：相關內容

## cli/hooks.md

- 路由：/cli/hooks
- 標題：
  - H1：openclaw hooks
  - H2：列出鉤子
  - H2：取得鉤子資訊
  - H2：檢查適用資格
  - H2：啟用鉤子
  - H2：停用鉤子
  - H2：安裝及更新鉤子套件
  - H2：內建鉤子
  - H3：command-logger 記錄檔
  - H2：注意事項
  - H2：相關內容

## cli/index.md

- 路由：/cli
- 標題：
  - H2：命令頁面
  - H2：全域旗標
  - H2：輸出模式
  - H2：調色盤
  - H2：命令樹
  - H2：聊天斜線命令
  - H2：用量追蹤
  - H2：相關內容

## cli/infer.md

- 路由：/cli/infer
- 標題：
  - H2：將 infer 轉換為 Skill
  - H2：命令樹
  - H2：常見工作
  - H2：行為
  - H2：模型
  - H2：圖片
  - H2：音訊
  - H2：文字轉語音
  - H2：影片
  - H2：網頁
  - H2：嵌入
  - H2：JSON 輸出
  - H2：常見問題
  - H2：相關內容

## cli/logs.md

- 路由：/cli/logs
- 標題：
  - H1：openclaw logs
  - H2：選項
  - H2：共用閘道 RPC 選項
  - H2：範例
  - H2：備援與復原行為
  - H2：相關內容

## cli/mcp.md

- 路由：/cli/mcp
- 標題：
  - H2：選擇適合的 MCP 路徑
  - H2：將 OpenClaw 作為 MCP 伺服器
  - H3：何時使用 serve
  - H3：運作方式
  - H3：選擇用戶端模式
  - H3：serve 公開的內容
  - H3：用法
  - H3：橋接工具
  - H3：事件模型
  - H3：Claude 頻道通知
  - H3：MCP 用戶端設定
  - H3：選項
  - H3：安全性與信任邊界
  - H3：測試
  - H3：疑難排解
  - H2：將 OpenClaw 作為 MCP 用戶端登錄庫
  - H3：已儲存的 MCP 伺服器定義
  - H3：常見伺服器配置方式
  - H3：JSON 輸出格式
  - H3：Stdio 傳輸
  - H3：SSE／HTTP 傳輸
  - H3：OAuth 工作流程
  - H3：可串流 HTTP 傳輸
  - H2：控制介面
  - H2：MCP 應用程式
  - H2：目前限制
  - H2：相關內容

## cli/memory.md

- 路由：/cli/memory
- 標題：
  - H1：openclaw memory
  - H2：memory status
  - H2：memory index
  - H2：memory search
  - H2：memory promote
  - H2：memory promote-explain
  - H2：memory rem-harness
  - H2：memory rem-backfill
  - H2：夢境整理
  - H2：SecretRef 閘道相依性
  - H2：相關內容

## cli/message.md

- 路由：/cli/message
- 標題：
  - H1：openclaw message
  - H2：頻道選擇
  - H2：目標格式 (-t, --target)
  - H2：常用旗標
  - H2：SecretRef 解析
  - H2：動作
  - H3：核心
  - H3：傳送
  - H3：投票
  - H3：討論串
  - H3：表情符號
  - H3：貼圖
  - H3：角色、頻道、語音、活動 (Discord)
  - H3：管理 (Discord)
  - H3：廣播
  - H2：相關內容

## cli/migrate.md

- 路由：/cli/migrate
- 標題：
  - H1：openclaw migrate
  - H2：命令
  - H2：安全模型
  - H2：Claude 提供者
  - H3：Claude 匯入的內容
  - H3：封存與手動審查狀態
  - H2：Codex 提供者
  - H3：Codex 匯入的內容
  - H3：需手動審查的 Codex 狀態
  - H2：Hermes 提供者
  - H3：Hermes 匯入的內容
  - H3：支援的 .env 鍵
  - H3：僅封存狀態
  - H3：套用後
  - H2：外掛合約
  - H2：新手引導整合
  - H2：相關內容

## cli/models.md

- 路由：/cli/models
- 標題：
  - H1：openclaw models
  - H2：常用命令
  - H3：狀態
  - H3：列出
  - H3：設定預設／影像模型
  - H3：掃描
  - H2：別名
  - H2：後備項目
  - H2：驗證設定檔
  - H2：相關內容

## cli/node.md

- 路由：/cli/node
- 標題：
  - H1：openclaw node
  - H2：為何使用節點主機？
  - H2：瀏覽器代理伺服器（零設定）
  - H2：執行（前景）
  - H2：節點主機的閘道驗證
  - H2：服務（背景）
  - H2：配對
  - H3：身分與配對狀態
  - H2：執行核准
  - H2：相關內容

## cli/nodes.md

- 路由：/cli/nodes
- 標題：
  - H1：openclaw nodes
  - H2：狀態
  - H2：配對
  - H2：叫用
  - H2：通知、推播、位置、螢幕
  - H2：相關內容

## cli/onboard.md

- 路由：/cli/onboard
- 標題：
  - H1：openclaw onboard
  - H2：範例
  - H2：引導流程
  - H2：重設
  - H2：語系
  - H2：非互動式設定
  - H3：閘道驗證（非互動式）
  - H3：本機閘道健康狀態
  - H3：互動式參照模式
  - H3：Z.AI 端點選項
  - H2：其他非互動式旗標
  - H2：提供者預先篩選
  - H2：網頁搜尋後續步驟
  - H2：其他行為
  - H2：常用後續命令

## cli/pairing.md

- 路由：/cli/pairing
- 標題：
  - H1：openclaw pairing
  - H2：命令
  - H2：pairing list
  - H2：pairing approve
  - H3：擁有者啟動設定
  - H2：相關內容

## cli/path.md

- 路由：/cli/path
- 標題：
  - H1：openclaw path
  - H2：為何使用
  - H2：使用方式
  - H2：運作方式
  - H2：子命令
  - H2：全域旗標
  - H2：oc:// 語法
  - H2：依檔案種類定址
  - H2：變更合約
  - H2：範例
  - H2：依檔案種類分類的操作方式
  - H3：Markdown
  - H3：JSONC
  - H3：JSONL
  - H3：YAML
  - H2：子命令參考
  - H3：resolve &lt;oc-path&gt;
  - H3：find &lt;pattern&gt;
  - H3：set &lt;oc-path&gt; &lt;value&gt;
  - H3：validate &lt;oc-path&gt;
  - H3：emit &lt;file&gt;
  - H2：結束代碼
  - H2：輸出模式
  - H2：注意事項
  - H2：相關內容

## cli/plugins.md

- 路由：/cli/plugins
- 標題：
  - H2：命令
  - H2：建立
  - H3：提供者鷹架
  - H2：安裝
  - H3：市集簡寫
  - H2：列出
  - H3：外掛索引
  - H2：解除安裝
  - H2：更新
  - H2：檢查
  - H2：診斷
  - H2：登錄檔
  - H2：市集
  - H2：相關內容

## cli/policy.md

- 路由：/cli/policy
- 標題：
  - H1：openclaw policy
  - H2：快速入門
  - H3：政策規則參考
  - H4：限定範圍的覆疊設定
  - H4：頻道
  - H4：MCP 伺服器
  - H4：模型提供者
  - H4：網路
  - H4：輸入與頻道存取
  - H4：閘道
  - H4：代理程式工作區
  - H4：沙箱防護設定
  - H4：資料處理
  - H4：機密
  - H4：執行核准
  - H4：驗證設定檔
  - H4：工具中繼資料
  - H4：工具防護設定
  - H2：執行檢查
  - H2：設定政策
  - H2：接受政策狀態
  - H2：發現項目
  - H2：修復
  - H2：結束代碼
  - H2：相關內容

## cli/promos.md

- 路由：/cli/promos
- 標題：
  - H1：openclaw promos
  - H2：命令
  - H2：openclaw promos list
  - H2：openclaw promos claim &lt;slug&gt;
  - H2：在模型清單中被動探索

## cli/proxy.md

- 路由：/cli/proxy
- 標題：
  - H1：openclaw proxy
  - H2：驗證
  - H3：選項
  - H2：偵錯代理伺服器
  - H2：相關內容

## cli/qr.md

- 路由：/cli/qr
- 標題：
  - H1：openclaw qr
  - H2：選項
  - H2：設定碼內容
  - H2：閘道 URL 解析
  - H2：驗證解析（無 --remote）
  - H2：驗證解析（--remote）
  - H2：相關內容

## cli/reset.md

- 路由：/cli/reset
- 標題：
  - H1：openclaw reset
  - H2：選項
  - H2：範圍
  - H2：注意事項
  - H2：相關內容

## cli/sandbox.md

- 路由：/cli/sandbox
- 標題：
  - H2：命令
  - H3：openclaw sandbox list
  - H3：openclaw sandbox recreate
  - H3：openclaw sandbox explain
  - H2：為何需要重新建立
  - H2：常見觸發條件
  - H2：登錄檔遷移
  - H2：設定
  - H2：相關內容

## cli/secrets.md

- 路由：/cli/secrets
- 標題：
  - H1：openclaw secrets
  - H2：重新載入執行階段快照
  - H2：稽核
  - H2：設定（互動式輔助工具）
  - H3：執行提供者安全性
  - H2：套用已儲存的計畫
  - H3：為何沒有復原備份
  - H2：範例
  - H2：相關內容

## cli/security.md

- 路由：/cli/security
- 標題：
  - H1：openclaw security
  - H2：稽核模式
  - H2：檢查內容
  - H2：SecretRef 行為
  - H2：抑制項目
  - H2：JSON 輸出
  - H2：--fix 變更的內容
  - H2：相關內容

## cli/sessions.md

- 路由：/cli/sessions
- 標題：
  - H1：openclaw sessions
  - H2：追蹤軌跡進度
  - H2：匯出軌跡套件
  - H2：清理維護
  - H2：壓縮工作階段
  - H3：sessions.compact RPC
  - H2：相關內容

## cli/setup.md

- 路由：/cli/setup
- 標題：
  - H1：openclaw setup
  - H2：選項
  - H3：基準模式
  - H2：範例
  - H2：注意事項
  - H2：相關內容

## cli/skills.md

- 路由：/cli/skills
- 標題：
  - H1：openclaw skills
  - H2：命令
  - H2：Skill 工作坊
  - H2：相關內容

## cli/status.md

- 路由：/cli/status
- 標題：
  - H2：工作階段與模型解析
  - H2：用量與配額
  - H2：概覽與更新狀態
  - H2：機密
  - H2：記憶
  - H2：相關內容

## cli/system.md

- 路由：/cli/system
- 標題：
  - H1：openclaw system
  - H2：常用命令
  - H2：system event
  - H2：system heartbeat last|enable|disable
  - H2：system presence
  - H2：注意事項
  - H2：相關內容

## cli/tasks.md

- 路由：/cli/tasks
- 標題：
  - H2：用法
  - H2：根層級選項
  - H2：子命令
  - H3：list
  - H3：show
  - H3：notify
  - H3：cancel
  - H3：audit
  - H3：maintenance
  - H3：flow
  - H2：相關內容

## cli/transcripts.md

- 路由：/cli/transcripts
- 標題：
  - H1：openclaw transcripts
  - H2：命令
  - H2：輸出
  - H2：每日多個工作階段
  - H2：缺少摘要
  - H2：設定

## cli/tui.md

- 路由：/cli/tui
- 標題：
  - H1：openclaw tui
  - H2：選項
  - H2：注意事項
  - H2：範例
  - H2：設定修復迴圈
  - H2：相關內容

## cli/uninstall.md

- 路由：/cli/uninstall
- 標題：
  - H1：openclaw uninstall
  - H2：選項
  - H2：範例
  - H2：注意事項
  - H2：相關內容

## cli/update.md

- 路由：/cli/update
- 標題：
  - H1：openclaw update
  - H2：用法
  - H2：選項
  - H2：update status
  - H2：update repair
  - H2：update wizard
  - H2：執行內容
  - H3：重新啟動交接
  - H3：控制平面回應格式
  - H2：Git 簽出流程
  - H3：頻道選擇
  - H3：更新步驟
  - H3：外掛同步詳細資訊
  - H2：相關內容

## cli/voicecall.md

- 路由：/cli/voicecall
- 標題：
  - H1：openclaw voicecall
  - H2：子命令
  - H2：設定與冒煙測試
  - H3：setup
  - H3：smoke
  - H2：通話生命週期
  - H3：call
  - H3：start
  - H3：continue
  - H3：speak
  - H3：dtmf
  - H3：end
  - H3：status
  - H2：日誌與指標
  - H3：tail
  - H3：latency
  - H2：公開網路鉤子
  - H3：expose
  - H2：相關內容

## cli/webhooks.md

- 路由：/cli/webhooks
- 標題：
  - H1：openclaw webhooks
  - H2：子命令
  - H2：webhooks gmail setup
  - H3：必要項目
  - H3：Pub/Sub 選項
  - H3：OpenClaw 傳遞選項
  - H3：gog watch serve 選項
  - H3：Tailscale 公開存取
  - H3：輸出
  - H2：webhooks gmail run
  - H2：相關內容

## cli/wiki.md

- 路由：/cli/wiki
- 標題：
  - H1：openclaw wiki
  - H2：常用命令
  - H2：代理程式選擇
  - H2：命令
  - H3：wiki status
  - H3：wiki doctor
  - H3：wiki init
  - H3：wiki ingest &lt;path&gt;
  - H3：wiki okf import &lt;path&gt;
  - H3：wiki compile
  - H3：wiki lint
  - H3：wiki search &lt;query&gt;
  - H3：wiki get &lt;lookup&gt;
  - H3：wiki apply
  - H3：wiki bridge import
  - H3：wiki unsafe-local import
  - H3：wiki chatgpt import
  - H3：wiki chatgpt rollback &lt;run-id&gt;
  - H3：wiki obsidian ...
  - H2：實務使用指南
  - H2：組態關聯
  - H2：相關內容

## cli/workboard.md

- 路由：/cli/workboard
- 標題：
  - H2：用法
  - H2：list
  - H2：create
  - H2：show
  - H2：move
  - H2：dispatch
  - H2：斜線命令對等性
  - H2：權限
  - H2：疑難排解
  - H3：未顯示任何卡片
  - H3：分派顯示僅限資料
  - H3：分派未啟動任何項目
  - H2：相關內容

## cli/worker.md

- 路由：/cli/worker
- 標題：
  - H1：openclaw worker
  - H2：啟動契約
  - H2：執行階段邊界

## concepts/active-memory.md

- 路由：/concepts/active-memory
- 標題：
  - H2：快速開始
  - H2：運作方式
  - H2：執行時機
  - H3：工作階段類型
  - H2：工作階段切換
  - H2：如何查看
  - H2：查詢模式
  - H2：提示詞風格
  - H2：模型備援政策
  - H3：速度建議
  - H4：Cerebras 設定
  - H2：記憶工具
  - H3：內建 memory-core
  - H3：LanceDB 記憶
  - H3：Lossless Claw
  - H2：進階逃生機制
  - H2：逐字稿持久化
  - H2：組態
  - H2：建議設定
  - H3：冷啟動寬限期
  - H2：偵錯
  - H2：常見問題
  - H2：相關頁面

## concepts/agent-loop.md

- 路由：/concepts/agent-loop
- 標題：
  - H2：進入點
  - H2：執行順序
  - H2：佇列與並行處理
  - H2：工作階段與工作區準備
  - H2：提示詞組裝
  - H2：掛鉤
  - H3：內部掛鉤（閘道掛鉤）
  - H3：外掛掛鉤
  - H2：串流
  - H2：工具執行
  - H2：回覆塑形
  - H2：壓縮與重試
  - H2：事件串流
  - H2：聊天頻道處理
  - H2：逾時
  - H3：工作階段卡住的診斷
  - H2：可能提前結束的位置
  - H2：相關內容

## concepts/agent-runtimes.md

- 路由：/concepts/agent-runtimes
- 標題：
  - H2：Codex 介面
  - H2：執行階段所有權
  - H2：執行階段選擇
  - H2：GitHub Copilot 代理程式執行階段
  - H2：相容性契約
  - H2：狀態標籤
  - H2：相關內容

## concepts/agent-workspace.md

- 路由：/concepts/agent-workspace
- 標題：
  - H2：預設位置
  - H2：額外的工作區資料夾
  - H2：工作區檔案對照
  - H2：工作區中不包含的內容
  - H2：Git 備份（建議使用私人儲存庫）
  - H2：請勿提交密鑰
  - H2：將工作區移至新機器
  - H2：進階注意事項
  - H2：相關內容

## concepts/agent.md

- 路由：/concepts/agent
- 標題：
  - H2：工作區（必要）
  - H2：啟動載入檔案（注入）
  - H2：內建工具
  - H2：Skills
  - H2：執行階段邊界
  - H2：工作階段
  - H2：串流期間的引導
  - H2：模型參照
  - H2：組態（最小）
  - H2：相關內容

## concepts/architecture.md

- 路由：/concepts/architecture
- 標題：
  - H2：概觀
  - H2：元件與流程
  - H3：閘道（常駐程式）
  - H3：用戶端（Mac 應用程式／命令列介面／網頁管理介面）
  - H3：節點（macOS／iOS／Android／無介面）
  - H3：WebChat
  - H2：連線生命週期（單一用戶端）
  - H2：線路協定（摘要）
  - H2：配對與本機信任
  - H2：協定型別與程式碼產生
  - H2：遠端存取
  - H2：作業快照
  - H2：不變條件
  - H2：相關內容

## concepts/channel-docking.md

- 路由：/concepts/channel-docking
- 標題：
  - H2：範例
  - H2：使用原因
  - H2：必要組態
  - H2：命令
  - H2：會變更的內容
  - H2：不會變更的內容
  - H2：疑難排解

## concepts/commitments.md

- 路由：/concepts/commitments
- 標題：
  - H2：啟用承諾事項
  - H2：運作方式
  - H2：範圍
  - H2：承諾事項與提醒的差異
  - H2：管理承諾事項
  - H2：隱私權與成本
  - H2：疑難排解
  - H2：相關內容

## concepts/compaction.md

- 路由：/concepts/compaction
- 標題：
  - H2：運作方式
  - H2：自動壓縮
  - H2：手動壓縮
  - H2：組態
  - H3：使用不同的模型
  - H3：識別碼保留
  - H3：作用中逐字稿位元組防護
  - H3：後繼逐字稿
  - H3：壓縮通知
  - H3：記憶體排清
  - H2：可插拔的壓縮提供者
  - H2：壓縮與修剪的差異
  - H2：疑難排解
  - H2：相關內容

## concepts/context-engine.md

- 路由：/concepts/context-engine
- 標題：
  - H2：快速開始
  - H2：運作方式
  - H3：子代理程式生命週期（選用）
  - H3：系統提示詞增補
  - H2：舊版引擎
  - H2：外掛引擎
  - H3：ContextEngine 介面
  - H3：執行階段設定
  - H3：主機需求
  - H3：故障隔離
  - H3：ownsCompaction
  - H2：組態參考
  - H2：與壓縮和記憶的關係
  - H2：提示
  - H2：相關內容

## concepts/context.md

- 路由：/concepts/context
- 標題：
  - H2：快速開始（檢查上下文）
  - H2：輸出範例
  - H3：/context list
  - H3：/context detail
  - H3：/context map
  - H2：會計入上下文視窗的內容
  - H2：OpenClaw 如何建立系統提示詞
  - H2：注入的工作區檔案（專案上下文）
  - H2：Skills：注入與隨選載入
  - H2：工具：有兩種成本
  - H2：命令、指令與「行內捷徑」
  - H2：工作階段、壓縮與修剪（保留的內容）
  - H2：/context 實際報告的內容
  - H2：相關內容

## concepts/delegate-architecture.md

- 路由：/concepts/delegate-architecture
- 標題：
  - H2：什麼是委派代理程式
  - H2：為何使用委派代理程式
  - H2：能力層級
  - H3：第 1 級：唯讀與草擬
  - H3：第 2 級：代為傳送
  - H3：第 3 級：主動執行
  - H2：先決條件：隔離與強化
  - H3：強制封鎖（不可妥協）
  - H3：工具限制
  - H3：沙箱隔離
  - H3：稽核軌跡
  - H2：設定委派代理程式
  - H3：1. 建立委派代理程式
  - H3：2. 設定身分提供者委派
  - H4：Microsoft 365
  - H4：Google Workspace
  - H3：3. 將委派代理程式繫結至頻道
  - H3：4. 將認證資訊新增至委派代理程式
  - H2：範例：組織助理
  - H2：擴充模式
  - H2：相關內容

## concepts/dreaming.md

- 路由：/concepts/dreaming
- 標題：
  - H2：夢境整理寫入的內容
  - H2：階段模型
  - H2：工作階段逐字稿擷取
  - H2：夢境日誌
  - H2：深度排序訊號
  - H3：QA 影子試驗報告涵蓋率
  - H2：排程
  - H2：快速開始
  - H2：斜線命令
  - H2：命令列介面工作流程
  - H2：主要預設值
  - H2：夢境使用者介面
  - H2：相關內容

## concepts/experimental-features.md

- 路由：/concepts/experimental-features
- 標題：
  - H2：目前已有文件說明的旗標
  - H2：本機模型精簡模式
  - H3：為何使用這些工具
  - H3：何時開啟
  - H3：何時保持關閉
  - H3：啟用
  - H2：實驗性不代表隱藏
  - H2：相關內容

## concepts/features.md

- 路由：/concepts/features
- 標題：
  - H2：重點功能
  - H2：完整清單
  - H2：相關內容

## concepts/managed-worktrees.md

- 路由：/concepts/managed-worktrees
- 標題：
  - H2：配置與命名
  - H2：佈建已忽略的檔案
  - H2：執行儲存庫設定
  - H2：工作階段工作樹
  - H2：快照、清理與還原
  - H2：命令列介面
  - H2：閘道方法
  - H2：工作看板工作區

## concepts/mantis-slack-desktop-runbook.md

- 路由：/concepts/mantis-slack-desktop-runbook
- 標題：
  - H2：儲存模型
  - H2：GitHub 分派
  - H2：本機命令列介面
  - H2：資料載入模式
  - H2：時間判讀
  - H2：證據檢查清單
  - H2：失敗處理
  - H2：相關內容

## concepts/mantis.md

- 路由：/concepts/mantis
- 標題：
  - H2：所有權
  - H2：命令列介面指令
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
  - H2：未決問題

## concepts/markdown-formatting.md

- 路由：/concepts/markdown-formatting
- 標題：
  - H2：處理管線
  - H2：IR 範例
  - H2：表格處理
  - H2：分塊規則
  - H2：連結政策
  - H2：暴雷內容
  - H2：新增或更新頻道格式化工具
  - H2：常見陷阱
  - H2：相關內容

## concepts/memory-builtin.md

- 路由：/concepts/memory-builtin
- 標題：
  - H2：提供的功能
  - H2：開始使用
  - H2：支援的嵌入提供者
  - H2：索引的運作方式
  - H2：適用時機
  - H2：疑難排解
  - H2：設定
  - H2：相關內容

## concepts/memory-honcho.md

- 路由：/concepts/memory-honcho
- 標題：
  - H2：提供的功能
  - H2：可用工具
  - H2：開始使用
  - H2：設定
  - H2：遷移現有記憶
  - H2：運作方式
  - H2：Honcho 與內建記憶的比較
  - H2：命令列介面指令
  - H2：延伸閱讀
  - H2：相關內容

## concepts/memory-qmd.md

- 路由：/concepts/memory-qmd
- 標題：
  - H2：相較於內建記憶新增的功能
  - H2：開始使用
  - H3：先決條件
  - H3：啟用
  - H2：輔助程序的運作方式
  - H2：搜尋效能與相容性
  - H2：模型覆寫
  - H2：為其他路徑建立索引
  - H2：為工作階段逐字稿建立索引
  - H2：搜尋範圍
  - H2：引用
  - H2：適用時機
  - H2：疑難排解
  - H2：設定
  - H2：相關內容

## concepts/memory-search.md

- 路由：/concepts/memory-search
- 標題：
  - H2：快速開始
  - H2：支援的提供者
  - H2：搜尋的運作方式
  - H2：改善搜尋品質
  - H3：時間衰減
  - H3：MMR（多樣性）
  - H3：同時啟用兩者
  - H2：多模態記憶
  - H2：工作階段記憶搜尋
  - H2：疑難排解
  - H2：相關內容

## concepts/memory.md

- 路由：/concepts/memory
- 標題：
  - H2：運作方式
  - H2：內容的存放位置
  - H2：從程式設計助理匯入
  - H2：動作敏感型記憶
  - H2：推斷出的承諾
  - H2：記憶工具
  - H2：記憶搜尋
  - H2：記憶後端
  - H2：知識 Wiki 層
  - H2：自動寫入記憶
  - H2：夢境整理
  - H2：有依據的回填與即時提升
  - H2：命令列介面
  - H2：延伸閱讀

## concepts/message-lifecycle-refactor.md

- 路由：/concepts/message-lifecycle-refactor
- 標題：
  - H2：進行此重構的原因
  - H2：已發布的內容
  - H3：傳送情境
  - H3：接收情境
  - H3：即時預覽
  - H3：持久收據
  - H3：縮減公開 SDK
  - H2：實作偏離原始設計之處
  - H2：具體遷移風險（仍然適用）
  - H2：失敗分類
  - H2：未決問題
  - H2：相關內容

## concepts/messages.md

- 路由：/concepts/messages
- 標題：
  - H2：傳入訊息去重
  - H2：傳入訊息防抖
  - H2：工作階段與裝置
  - H2：提示詞本文與歷史記錄情境
  - H2：工具結果中繼資料
  - H2：佇列與後續訊息
  - H2：頻道執行所有權
  - H2：串流、分塊與批次處理
  - H2：推理可見性與權杖
  - H2：前綴、討論串與回覆
  - H2：靜默回覆
  - H2：相關內容

## concepts/model-failover.md

- 路由：/concepts/model-failover
- 標題：
  - H2：執行階段流程
  - H2：選擇來源政策
  - H2：驗證失敗略過快取
  - H2：使用者可見的備援通知
  - H2：驗證資訊儲存（金鑰 + OAuth）
  - H2：設定檔 ID
  - H2：輪替順序
  - H3：工作階段黏著性（有利於快取）
  - H3：OpenAI Codex 訂閱搭配 API 金鑰備援
  - H2：冷卻時間
  - H2：帳務停用
  - H2：模型備援
  - H3：候選鏈規則
  - H3：會推進備援的錯誤
  - H3：冷卻略過與探測行為
  - H2：工作階段覆寫與即時切換模型
  - H2：可觀測性與失敗摘要
  - H2：相關設定

## concepts/model-providers.md

- 路由：/concepts/model-providers
- 標題：
  - H2：快速規則
  - H2：在控制介面中設定提供者
  - H2：由外掛擁有的提供者行為
  - H2：API 金鑰輪替
  - H2：官方提供者外掛
  - H3：OpenAI
  - H3：Anthropic
  - H3：OpenAI ChatGPT/Codex OAuth
  - H3：其他訂閱式託管選項
  - H3：OpenCode
  - H3：Google Gemini（API 金鑰）
  - H3：Google Vertex 與 Gemini 命令列介面
  - H3：Z.AI（GLM）
  - H3：Vercel AI 閘道
  - H3：其他隨附的提供者外掛
  - H4：值得了解的特殊行為
  - H2：透過 models.providers 設定提供者（自訂／基礎 URL）
  - H3：Moonshot AI（Kimi）
  - H3：Kimi Coding
  - H3：Volcano Engine（Doubao）
  - H3：BytePlus（國際版）
  - H3：Synthetic
  - H3：MiniMax
  - H3：LM Studio
  - H3：Ollama
  - H3：vLLM
  - H3：SGLang
  - H3：本機代理伺服器（LM Studio、vLLM、LiteLLM 等）
  - H2：命令列介面範例
  - H2：相關內容

## concepts/models.md

- 路由：/concepts/models
- 標題：
  - H2：選擇順序
  - H2：選擇來源與備援嚴格程度
  - H2：快速模型政策
  - H2：新手引導
  - H2：“不允許使用此模型”（以及回覆停止的原因）
  - H2：聊天中的 /model
  - H2：命令列介面
  - H2：模型登錄檔（models.json）
  - H2：相關內容

## concepts/multi-agent.md

- 路由：/concepts/multi-agent
- 標題：
  - H2：一個代理程式的定義
  - H2：路徑
  - H3：單一代理程式模式（預設）
  - H2：代理程式輔助工具
  - H2：快速開始
  - H2：多個代理程式、多種角色設定
  - H2：各代理程式的記憶 Wiki 儲存庫
  - H2：跨代理程式的 QMD 記憶搜尋
  - H2：一個 WhatsApp 號碼供多人使用（私訊分流）
  - H2：路由規則
  - H2：多個帳號／電話號碼
  - H2：概念
  - H2：平台範例
  - H2：常見模式
  - H2：各代理程式的沙箱與工具設定
  - H2：相關內容

## concepts/oauth.md

- 路由：/concepts/oauth
- 標題：
  - H2：權杖接收端（存在原因）
  - H2：儲存位置（權杖的存放處）
  - H2：重複使用 Anthropic Claude 命令列介面
  - H2：OAuth 交換（登入的運作方式）
  - H3：Anthropic setup-token
  - H3：OpenAI Codex（ChatGPT OAuth）
  - H2：重新整理與到期
  - H2：多個帳號（設定檔）與路由
  - H3：1) 建議方式：分開的代理程式
  - H3：2) 進階方式：在一個代理程式中使用多個設定檔
  - H2：相關內容

## concepts/parallel-specialist-lanes.md

- 路由：/concepts/parallel-specialist-lanes
- 標題：
  - H2：基本原則
  - H2：建議導入方式
  - H3：階段 1：作業通道合約 + 背景繁重工作
  - H3：階段 2：優先順序與並行控制
  - H3：階段 3：協調器／流量控制器
  - H2：最小作業通道合約範本
  - H2：相關內容

## concepts/personal-agent-benchmark-pack.md

- 路由：/concepts/personal-agent-benchmark-pack
- 標題：
  - H2：情境
  - H2：隱私模型
  - H2：擴充基準套件

## concepts/presence.md

- 路由：/concepts/presence
- 標題：
  - H2：存在狀態欄位（顯示的內容）
  - H2：產生來源（存在狀態來自何處）
  - H3：1) 閘道自身項目
  - H3：2) WebSocket 連線
  - H4：為何暫時性的控制平面連線不會顯示
  - H3：3) system-event 信標
  - H3：4) 節點連線（角色：node）
  - H2：合併與去重規則（instanceId 為何重要）
  - H2：TTL 與大小限制
  - H2：遠端／通道注意事項（迴路 IP）
  - H2：使用端
  - H3：控制介面的裝置頁面
  - H3：macOS 執行個體分頁
  - H2：偵錯提示
  - H2：相關內容

## concepts/progress-drafts.md

- 路由：/concepts/progress-drafts
- 標題：
  - H2：快速開始
  - H2：使用者會看到的內容
  - H2：選擇模式
  - H2：設定標籤
  - H2：控制進度行
  - H3：詳細模式
  - H3：命令／執行文字
  - H3：評論通道
  - H3：狀態標題
  - H3：行數限制
  - H3：豐富呈現（Slack）
  - H3：隱藏工具／任務行
  - H2：頻道行為
  - H2：完成處理
  - H2：疑難排解
  - H2：相關內容

## concepts/qa-e2e-automation.md

- 路由：/concepts/qa-e2e-automation
- 標題：
  - H2：命令介面
  - H3：由設定檔支援的 QA 執行
  - H2：操作人員流程
  - H3：可觀測性冒煙測試
  - H3：Matrix 冒煙測試通道
  - H3：Discord Mantis 情境
  - H3：Mantis Slack 桌面與視覺任務執行器
  - H3：認證資訊集區健康狀態檢查
  - H2：即時傳輸涵蓋範圍
  - H2：Discord、Slack、Telegram 與 WhatsApp QA 參考
  - H3：共用命令列介面旗標
  - H3：Telegram QA
  - H3：Discord QA
  - H3：Slack QA
  - H4：設定 Slack 工作區
  - H3：WhatsApp QA
  - H3：Convex 認證資訊集區
  - H2：由儲存庫支援的種子資料
  - H2：供應商模擬通道
  - H2：傳輸配接器
  - H3：新增頻道
  - H3：情境輔助函式名稱
  - H2：報告
  - H2：相關文件

## concepts/qa-matrix.md

- 路由：/concepts/qa-matrix
- 標題：
  - H2：快速開始
  - H2：此通道的作用
  - H2：命令列介面
  - H3：常用旗標
  - H3：供應商旗標
  - H2：設定檔
  - H2：情境
  - H2：環境變數
  - H2：輸出成品
  - H2：分流處理提示
  - H2：即時傳輸合約
  - H2：相關內容

## concepts/queue-steering.md

- 路由：/concepts/queue-steering
- 標題：
  - H2：執行階段邊界
  - H2：模式
  - H2：突發範例
  - H2：範圍
  - H2：防彈跳
  - H2：相關內容

## concepts/queue.md

- 路由：/concepts/queue
- 標題：
  - H2：原因
  - H2：運作方式
  - H2：預設值
  - H2：佇列模式
  - H2：佇列選項
  - H2：引導與串流
  - H2：優先順序
  - H2：個別工作階段覆寫
  - H2：取消已排入佇列的回合
  - H2：範圍與保證
  - H2：疑難排解
  - H2：相關內容

## concepts/retry.md

- 路由：/concepts/retry
- 標題：
  - H2：目標
  - H2：預設值
  - H2：行為
  - H3：模型供應商
  - H3：Discord
  - H3：Telegram
  - H2：設定
  - H2：注意事項
  - H2：相關內容

## concepts/session-pruning.md

- 路由：/concepts/session-pruning
- 標題：
  - H2：重要性
  - H2：運作方式
  - H2：舊版影像清理
  - H2：智慧預設值
  - H2：啟用或停用
  - H2：修剪與壓縮的差異
  - H2：延伸閱讀
  - H2：相關內容

## concepts/session-search.md

- 路由：/concepts/session-search
- 標題：
  - H1：工作階段搜尋
  - H2：可見性與輸出
  - H2：索引生命週期
  - H2：工作階段搜尋與記憶搜尋的差異

## concepts/session-state.md

- 路由：/concepts/session-state
- 標題：
  - H2：訊號記錄
  - H2：監看器
  - H2：通知：只發一則，而非多則
  - H2：協調
  - H2：儲存與限制
  - H2：相關內容

## concepts/session-tool.md

- 路由：/concepts/session-tool
- 標題：
  - H2：可用工具
  - H2：列出與讀取工作階段
  - H2：跨工作階段傳送訊息
  - H2：狀態與協調輔助工具
  - H2：工作階段狀態變更
  - H2：產生子代理程式
  - H2：可見性
  - H2：延伸閱讀
  - H2：相關內容

## concepts/session.md

- 路由：/concepts/session
- 標題：
  - H2：訊息路由方式
  - H2：私訊隔離
  - H3：停駐已連結的頻道
  - H2：工作階段生命週期
  - H2：狀態儲存位置
  - H2：工作階段維護
  - H2：檢查工作階段
  - H2：延伸閱讀
  - H2：相關內容

## concepts/soul.md

- 路由：/concepts/soul
- 標題：
  - H2：SOUL.md 應包含的內容
  - H2：此方法有效的原因
  - H2：Molty 提示詞
  - H2：良好成果的樣貌
  - H2：一項警告
  - H2：相關內容

## concepts/streaming.md

- 路由：/concepts/streaming
- 標題：
  - H2：區塊串流（頻道訊息）
  - H3：搭配區塊串流傳送媒體
  - H2：分塊演算法（下限／上限）
  - H2：合併（合併串流區塊）
  - H2：區塊間仿真人的節奏
  - H2：“串流區塊或全部內容”
  - H2：預覽串流模式
  - H3：頻道對應
  - H3：舊版金鑰遷移
  - H2：執行階段行為
  - H3：Telegram
  - H3：Discord
  - H3：Slack
  - H3：Mattermost
  - H3：Matrix
  - H2：工具進度預覽更新
  - H2：進度草稿呈現
  - H3：評論進度通道
  - H2：相關內容

## concepts/system-prompt.md

- 路由：/concepts/system-prompt
- 標題：
  - H2：結構
  - H2：提示詞模式
  - H2：提示詞快照
  - H2：工作區啟動程序注入
  - H2：時間處理
  - H2：Skills
  - H2：文件
  - H2：相關內容

## concepts/timezone.md

- 路由：/concepts/timezone
- 標題：
  - H2：三個時區介面
  - H2：設定使用者時區
  - H2：信封時區值
  - H2：何時覆寫
  - H2：相關內容

## concepts/typebox.md

- 路由：/concepts/typebox
- 標題：
  - H2：心智模型（30 秒）
  - H2：結構描述的位置
  - H2：目前的管線
  - H2：執行階段如何使用結構描述
  - H2：訊框範例
  - H2：最小化用戶端（Node.js）
  - H2：完整範例：端對端新增方法
  - H2：Swift 程式碼產生行為
  - H2：版本控制與相容性
  - H2：結構描述模式與慣例
  - H2：即時結構描述 JSON
  - H2：變更結構描述時
  - H2：相關內容

## concepts/typing-indicators.md

- 路由：/concepts/typing-indicators
- 標題：
  - H2：預設值
  - H2：模式
  - H2：設定
  - H2：注意事項
  - H2：相關內容

## concepts/usage-tracking.md

- 路由：/concepts/usage-tracking
- 標題：
  - H2：功能說明
  - H2：顯示位置
  - H2：Anthropic 與 OpenAI 成本記錄
  - H2：預設用量頁尾模式
  - H3：三種不同的工作階段狀態
  - H3：優先順序
  - H3：重設與關閉的差異
  - H3：切換行為
  - H3：設定
  - H2：自訂 /usage 完整頁尾
  - H3：形式
  - H3：合約路徑
  - H3：動詞
  - H3：片段形式
  - H3：範例
  - H2：供應商與認證資訊
  - H2：相關內容

## date-time.md

- 路由：/date-time
- 標題：
  - H2：訊息信封（預設使用本地時間）
  - H3：範例
  - H2：系統提示詞：目前日期與時間
  - H2：系統事件行（預設使用本地時間）
  - H3：設定使用者時區與格式
  - H2：時間格式偵測（自動）
  - H2：工具承載資料與連接器（原始供應商時間與正規化欄位）
  - H2：相關文件

## debug/node-issue.md

- 路由：/debug/node-issue
- 標題：
  - H1：節點 + tsx「\\name 不是函式」當機
  - H2：狀態
  - H2：原始症狀
  - H2：原因
  - H2：目前的重現檢查
  - H2：因應措施（若當機問題再次發生）
  - H2：參考資料
  - H2：相關內容

## diagnostics/flags.md

- 路由：/diagnostics/flags
- 標題：
  - H2：運作方式
  - H2：已知旗標
  - H2：透過設定啟用
  - H2：環境變數覆寫（單次）
  - H2：效能分析器旗標
  - H2：時間軸成品
  - H2：記錄儲存位置
  - H2：擷取記錄
  - H2：注意事項
  - H2：相關內容

## gateway/1password.md

- 路由：/gateway/1password
- 標題：
  - H2：需求
  - H2：使用 op 解析設定中的祕密
  - H2：無介面閘道的服務帳號設定
  - H2：供代理程式使用的 1password Skill
  - H2：安全性注意事項
  - H2：疑難排解

## gateway/audit.md

- 路由：/gateway/audit
- 標題：
  - H1：稽核歷程
  - H2：記錄類別
  - H2：訊息生命週期事件
  - H3：對話種類分類
  - H2：隱私權模型
  - H2：涵蓋範圍與證明限制
  - H2：儲存、保留與遷移
  - H2：查詢
  - H2：相關內容

## gateway/authentication.md

- 路由：/gateway/authentication
- 標題：
  - H2：建議設定：API 金鑰（任何供應商）
  - H2：Anthropic：重複使用 Claude 命令列介面
  - H2：手動輸入權杖
  - H3：由 SecretRef 支援的認證資訊
  - H2：檢查模型驗證狀態
  - H2：API 金鑰輪替（閘道）
  - H2：在閘道執行期間移除供應商驗證
  - H2：控制使用哪項認證資訊
  - H3：OpenAI 與舊版 openai-codex ID
  - H3：登入期間（命令列介面）
  - H3：個別工作階段（聊天命令）
  - H3：個別代理程式（命令列介面覆寫）
  - H2：疑難排解
  - H3：“找不到認證資訊”
  - H3：權杖即將到期／已到期
  - H2：相關內容

## gateway/background-process.md

- 路由：/gateway/background-process
- 標題：
  - H2：exec 工具
  - H3：環境變數覆寫
  - H3：設定（優先於環境變數覆寫）
  - H2：子程序橋接
  - H2：process 工具
  - H2：範例
  - H2：相關內容

## gateway/bonjour.md

- 路由：/gateway/bonjour
- 標題：
  - H2：透過 Tailscale 使用廣域 Bonjour（單播 DNS-SD）
  - H3：閘道設定
  - H3：一次性 DNS 伺服器設定（閘道主機，僅限 macOS）
  - H3：Tailscale DNS 設定
  - H3：閘道監聽器安全性
  - H2：公告內容
  - H2：服務類型
  - H2：TXT 鍵（非機密提示）
  - H2：在 macOS 上偵錯
  - H2：在閘道日誌中偵錯
  - H2：在 iOS 節點上偵錯
  - H2：何時啟用 Bonjour
  - H2：何時停用 Bonjour
  - H2：Docker 注意事項
  - H2：排解 Bonjour 停用問題
  - H2：常見失敗模式
  - H2：逸出的執行個體名稱（\032）
  - H2：啟用／停用／設定
  - H2：相關文件

## gateway/bridge-protocol.md

- 路由：/gateway/bridge-protocol
- 標題：
  - H2：曾經存在的原因
  - H2：傳輸
  - H2：交握與配對
  - H2：框架
  - H2：Exec 生命週期事件
  - H2：過往的 tailnet 用法
  - H2：版本管理
  - H2：相關內容

## gateway/cli-backends.md

- 路由：/gateway/cli-backends
- 標題：
  - H2：快速開始
  - H2：將其用作備援
  - H2：設定
  - H2：運作方式
  - H3：Claude 命令列介面的特定細節
  - H2：工作階段
  - H2：來自 claude-cli 工作階段的備援前置內容
  - H2：圖片
  - H2：輸入與輸出
  - H2：外掛擁有的預設值
  - H2：文字轉換覆疊
  - H2：原生壓縮的擁有權
  - H2：套件組合 MCP 覆疊
  - H2：重新植入歷程上限
  - H2：限制
  - H2：疑難排解
  - H2：相關內容

## gateway/cloud-workers.md

- 路由：/gateway/cloud-workers
- 標題：
  - H2：各項內容的執行位置
  - H2：需求
  - H2：設定
  - H3：設定命令
  - H3：安裝頻道
  - H2：分派工作階段
  - H2：安全性模型
  - H2：疑難排解
  - H2：相關內容

## gateway/config-agents.md

- 路由：/gateway/config-agents
- 標題：
  - H2：代理程式預設值
  - H3：agents.defaults.workspace
  - H3：agents.defaults.repoRoot
  - H3：agents.defaults.skills
  - H3：agents.defaults.skipBootstrap
  - H3：agents.defaults.skipOptionalBootstrapFiles
  - H3：agents.defaults.contextInjection
  - H3：agents.defaults.bootstrapMaxChars
  - H3：agents.defaults.bootstrapTotalMaxChars
  - H3：個別代理程式的啟動設定檔覆寫
  - H3：agents.defaults.bootstrapPromptTruncationWarning
  - H3：上下文預算擁有權對照表
  - H4：agents.defaults.startupContext
  - H4：agents.defaults.contextLimits
  - H4：agents.list[].contextLimits
  - H4：skills.limits.maxSkillsPromptChars
  - H4：agents.list[].skillsLimits.maxSkillsPromptChars
  - H3：agents.defaults.imageMaxDimensionPx
  - H3：agents.defaults.imageQuality
  - H3：agents.defaults.userTimezone
  - H3：agents.defaults.timeFormat
  - H3：agents.defaults.model
  - H3：執行階段原則
  - H3：agents.defaults.cliBackends
  - H3：agents.defaults.promptOverlays
  - H3：agents.defaults.heartbeat
  - H3：agents.defaults.compaction
  - H3：agents.defaults.runRetries
  - H3：agents.defaults.contextPruning
  - H3：區塊串流
  - H3：輸入狀態指示器
  - H3：agents.defaults.sandbox
  - H3：agents.list（個別代理程式覆寫）
  - H2：多代理程式路由
  - H3：繫結比對欄位
  - H3：個別代理程式存取設定檔
  - H2：工作階段
  - H2：訊息
  - H3：回應前綴
  - H3：確認回應
  - H3：佇列
  - H3：傳入防彈跳
  - H3：其他訊息鍵
  - H3：TTS（文字轉語音）
  - H2：對話
  - H2：相關內容

## gateway/config-channels.md

- 路由：/gateway/config-channels
- 標題：
  - H2：頻道
  - H3：私訊與群組存取
  - H3：頻道模型覆寫
  - H3：頻道預設值與心跳偵測
  - H3：WhatsApp
  - H3：Telegram
  - H3：Discord
  - H3：Google Chat
  - H3：Slack
  - H3：Mattermost
  - H3：Signal
  - H3：iMessage
  - H3：Matrix
  - H3：Microsoft Teams
  - H3：IRC
  - H3：多帳號（所有頻道）
  - H3：其他外掛頻道
  - H3：群組聊天提及閘控
  - H4：私訊歷程限制
  - H4：與自己聊天模式
  - H3：命令（聊天命令處理）
  - H2：相關內容

## gateway/config-tools.md

- 路由：/gateway/config-tools
- 標題：
  - H2：工具
  - H3：工具設定檔
  - H3：工具群組
  - H3：沙箱工具原則中的 MCP 與外掛工具
  - H3：tools.codeMode
  - H3：tools.allow / tools.deny
  - H3：tools.byProvider
  - H3：tools.toolsBySender
  - H3：tools.elevated
  - H3：tools.exec
  - H3：tools.loopDetection
  - H3：tools.web
  - H3：tools.media
  - H3：tools.agentToAgent
  - H3：tools.sessions
  - H3：tools.sessionsspawn
  - H3：tools.experimental
  - H3：agents.defaults.subagents
  - H2：自訂供應商與基礎 URL
  - H3：供應商欄位詳細資料
  - H3：供應商範例
  - H2：相關內容

## gateway/configuration-examples.md

- 路由：/gateway/configuration-examples
- 標題：
  - H2：快速開始
  - H3：絕對最小設定
  - H3：建議的起始設定
  - H2：完整範例（主要選項）
  - H3：以符號連結連接的同層 Skills 儲存庫
  - H2：常見模式
  - H3：共用 Skills 基準搭配單一覆寫
  - H3：多平台設定
  - H3：受信任節點網路自動核准
  - H3：安全私訊模式（共用收件匣／多使用者私訊）
  - H3：Anthropic API 金鑰 + MiniMax 備援
  - H3：工作機器人（限制存取）
  - H3：僅使用本機模型
  - H2：提示
  - H2：相關內容

## gateway/configuration-reference.md

- 路由：/gateway/configuration-reference
- 標題：
  - H2：頻道
  - H2：代理程式預設值、多代理程式、工作階段與訊息
  - H2：工具與自訂供應商
  - H2：模型
  - H2：MCP
  - H2：Skills
  - H2：外掛
  - H3：Codex 控制框架外掛設定
  - H2：承諾
  - H2：瀏覽器
  - H2：使用者介面
  - H2：閘道
  - H3：OpenAI 相容端點
  - H3：多執行個體隔離
  - H3：gateway.tls
  - H3：gateway.reload
  - H2：雲端工作程式環境
  - H3：Crabbox 設定檔
  - H3：靜態 SSH 開發設定檔
  - H2：掛鉤
  - H3：Gmail 整合
  - H2：Canvas 外掛主機
  - H2：探索
  - H3：mDNS（Bonjour）
  - H3：廣域（DNS-SD）
  - H2：環境
  - H3：env（行內環境變數）
  - H3：環境變數替換
  - H2：機密資料
  - H3：SecretRef
  - H3：支援的認證資訊介面
  - H3：機密資料供應商設定
  - H2：驗證儲存空間
  - H3：auth.cooldowns
  - H2：稽核
  - H2：日誌記錄
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
  - H2：工作樹
  - H2：媒體模型範本變數
  - H2：設定引入（$include）
  - H2：相關內容

## gateway/configuration.md

- 路由：/gateway/configuration
- 標題：
  - H2：最小設定
  - H2：編輯設定
  - H2：嚴格驗證
  - H2：常見工作
  - H2：設定熱重新載入
  - H3：重新載入模式
  - H3：可熱套用的變更與需要重新啟動的變更
  - H3：重新載入規劃
  - H2：設定 RPC（程式化更新）
  - H2：環境變數
  - H2：完整參考
  - H2：相關內容

## gateway/diagnostics.md

- 路由：/gateway/diagnostics
- 標題：
  - H2：快速開始
  - H2：聊天命令
  - H2：匯出內容包含哪些項目
  - H2：隱私權模型
  - H2：穩定性記錄器
  - H2：實用選項
  - H2：停用診斷
  - H2：相關內容

## gateway/discovery.md

- 路由：/gateway/discovery
- 標題：
  - H2：術語
  - H2：為何同時提供直接連線與 SSH
  - H2：探索輸入
  - H3：1) Bonjour / DNS-SD
  - H4：服務信標詳細資料
  - H3：2) Tailnet（跨網路）
  - H3：3) 手動 / SSH 目標
  - H2：傳輸選擇（用戶端原則）
  - H2：配對與驗證（直接傳輸）
  - H2：各元件的職責
  - H2：相關內容

## gateway/doctor.md

- 路由：/gateway/doctor
- 標題：
  - H2：快速開始
  - H3：無頭與自動化模式
  - H2：唯讀 lint 模式
  - H2：功能摘要
  - H2：夢境 UI 回填與重設
  - H2：詳細行為與理由
  - H2：相關內容

## gateway/external-apps.md

- 路由：/gateway/external-apps
- 標題：
  - H2：目前可用的功能
  - H2：建議做法
  - H2：協作式主機暫停
  - H2：應用程式程式碼與外掛程式碼
  - H2：相關內容

## gateway/gateway-lock.md

- 路由：/gateway/gateway-lock
- 標題：
  - H2：原因
  - H2：三層機制
  - H3：狀態與設定鎖定
  - H3：Socket 繫結
  - H2：操作注意事項
  - H2：相關內容

## gateway/health.md

- 路由：/gateway/health
- 標題：
  - H2：快速檢查
  - H2：深入診斷
  - H2：健康狀態監控設定
  - H2：運作時間監控
  - H3：監控服務設定範例
  - H2：發生故障時
  - H2：專用的「health」命令
  - H2：相關內容

## gateway/heartbeat.md

- 路由：/gateway/heartbeat
- 標題：
  - H2：快速開始（初學者）
  - H2：預設值
  - H2：心跳偵測提示的用途
  - H2：回應合約
  - H2：設定
  - H3：範圍與優先順序
  - H3：各代理程式的心跳偵測
  - H3：活躍時段範例
  - H3：24/7 設定
  - H3：多帳號範例
  - H3：欄位說明
  - H2：傳遞行為
  - H2：可見性控制
  - H3：各旗標的作用
  - H3：各頻道與各帳號範例
  - H3：常見模式
  - H2：HEARTBEAT.md（選用）
  - H3：tasks: 區塊
  - H3：代理程式可以更新 HEARTBEAT.md 嗎？
  - H2：手動喚醒（隨選）
  - H2：推理傳遞（選用）
  - H2：成本考量
  - H2：心跳偵測後的上下文溢位
  - H2：相關內容

## gateway/index.md

- 路由：/gateway
- 標題：
  - H2：5 分鐘本機啟動
  - H2：執行階段模型
  - H2：OpenAI 相容端點
  - H3：連接埠與繫結優先順序
  - H3：熱重新載入模式
  - H2：操作員命令集
  - H2：多個閘道（同一主機）
  - H2：遠端存取
  - H2：監督與服務生命週期
  - H2：開發設定檔快速途徑
  - H2：協定快速參考（操作員視角）
  - H2：操作檢查
  - H3：存活性
  - H3：就緒狀態
  - H3：缺口復原
  - H2：常見故障徵兆
  - H2：安全保證
  - H2：相關內容

## gateway/local-model-services.md

- 路由：/gateway/local-model-services
- 標題：
  - H2：運作方式
  - H2：設定結構
  - H2：欄位
  - H2：Inferrs 範例
  - H2：ds4 範例
  - H2：相關內容

## gateway/local-models.md

- 路由：/gateway/local-models
- 標題：
  - H2：最低硬體需求
  - H2：選擇後端
  - H2：LM Studio + 大型本機模型（Responses API）
  - H3：混合設定：託管主要模型、本機備援模型
  - H3：區域託管 / 資料路由
  - H2：其他 OpenAI 相容的本機 Proxy
  - H2：較小型或限制更嚴格的後端
  - H2：疑難排解
  - H2：相關內容

## gateway/logging.md

- 路由：/gateway/logging
- 標題：
  - H1：記錄
  - H2：檔案型記錄器
  - H3：詳細輸出與記錄層級
  - H2：主控台擷取
  - H2：遮蔽
  - H2：閘道 WebSocket 記錄
  - H3：WS 記錄樣式
  - H2：主控台格式（子系統記錄）
  - H2：相關內容

## gateway/multi-tenant-hosting.md

- 路由：/gateway/multi-tenant-hosting
- 標題：
  - H1：多租戶託管
  - H2：為何每個租戶都需要獨立單元
  - H2：架構
  - H2：信任邊界
  - H2：隔離層級
  - H2：快速開始
  - H2：目前範圍
  - H2：相關內容

## gateway/multiple-gateways.md

- 路由：/gateway/multiple-gateways
- 標題：
  - H2：救援機器人快速開始
  - H3：--profile rescue onboard 會變更哪些項目
  - H2：一般多閘道設定
  - H2：隔離檢查清單
  - H2：連接埠對應（衍生）
  - H2：瀏覽器 / CDP 注意事項（常見陷阱）
  - H2：手動環境變數範例
  - H2：快速檢查
  - H2：相關內容

## gateway/network-model.md

- 路由：/gateway/network-model
- 標題：
  - H2：相關內容

## gateway/openai-http-api.md

- 路由：/gateway/openai-http-api
- 標題：
  - H2：啟用端點
  - H2：安全邊界（重要）
  - H2：驗證
  - H2：何時使用此端點
  - H2：代理程式優先模型合約
  - H2：工作階段行為
  - H2：請求限制（設定）
  - H2：聊天工具合約
  - H3：支援的請求欄位
  - H3：不支援的變體
  - H3：非串流工具回應結構
  - H3：串流工具回應結構
  - H3：工具後續迴圈
  - H2：串流（SSE）
  - H2：Open WebUI 快速設定
  - H2：範例
  - H2：相關內容

## gateway/openresponses-http-api.md

- 路由：/gateway/openresponses-http-api
- 標題：
  - H2：驗證、安全性與路由
  - H2：工作階段行為
  - H2：請求結構
  - H2：項目（輸入）
  - H3：message
  - H3：functioncalloutput（以回合為基礎的工具）
  - H3：reasoning 與 itemreference
  - H2：工具（用戶端函式工具）
  - H2：圖片（inputimage）
  - H2：檔案（inputfile）
  - H2：檔案與圖片限制（設定）
  - H2：串流（SSE）
  - H2：使用量
  - H2：錯誤
  - H2：範例
  - H2：相關內容

## gateway/openshell.md

- 路由：/gateway/openshell
- 標題：
  - H2：必要條件
  - H2：快速開始
  - H2：工作區模式
  - H3：mirror（預設）
  - H3：remote
  - H3：選擇模式
  - H2：設定參考
  - H2：範例
  - H3：最小遠端設定
  - H3：搭配 GPU 的 mirror 模式
  - H3：使用自訂閘道的各代理程式 OpenShell
  - H2：生命週期管理
  - H2：安全強化
  - H2：目前限制
  - H2：運作方式
  - H2：相關內容

## gateway/opentelemetry.md

- 路由：/gateway/opentelemetry
- 標題：
  - H2：快速開始
  - H2：匯出的訊號
  - H2：設定參考
  - H3：環境變數
  - H2：隱私權與內容擷取
  - H2：取樣與排清
  - H2：匯出的指標
  - H3：模型使用量
  - H3：訊息流程
  - H3：語音
  - H3：佇列與工作階段
  - H3：工作階段存活性遙測
  - H3：測試框架生命週期
  - H3：工具執行與迴圈偵測
  - H3：執行
  - H3：診斷內部機制（記憶體、承載資料、匯出器健康狀態）
  - H2：匯出的 Span
  - H2：診斷事件目錄
  - H2：不使用匯出器
  - H2：停用
  - H2：相關內容

## gateway/operator-scopes.md

- 路由：/gateway/operator-scopes
- 標題：
  - H2：角色
  - H2：範圍層級
  - H2：方法範圍只是第一道關卡
  - H2：裝置配對核准
  - H2：節點配對核准
  - H2：共用密鑰驗證

## gateway/pairing.md

- 路由：/gateway/pairing
- 標題：
  - H2：能力核准的運作方式
  - H2：命令列介面工作流程（適合無頭環境）
  - H2：API 介面（閘道協定）
  - H2：節點命令閘控（2026.3.31+）
  - H2：節點事件信任邊界（2026.3.31+）
  - H2：經 SSH 驗證的裝置自動核准（預設）
  - H2：自動核准（macOS 應用程式）
  - H2：受信任 CIDR 裝置自動核准
  - H2：靜默清理被取代的配對
  - H2：中繼資料升級自動核准
  - H2：QR 配對輔助工具
  - H2：位置判定與轉送標頭
  - H2：儲存空間（本機、私密）
  - H2：傳輸行為
  - H2：相關內容

## gateway/prometheus.md

- 路由：/gateway/prometheus
- 標題：
  - H2：快速開始
  - H2：匯出的指標
  - H2：標籤政策
  - H2：PromQL 實用範例
  - H2：選擇 Prometheus 或 OpenTelemetry 匯出
  - H2：疑難排解
  - H2：相關內容

## gateway/protocol.md

- 路由：/gateway/protocol
- 標題：
  - H2：傳輸與訊框
  - H2：交握
  - H3：工作者角色與封閉式通訊協定
  - H3：用戶端功能
  - H3：節點連線範例
  - H2：角色與範圍
  - H3：功能／命令／權限（節點）
  - H2：上線狀態
  - H3：節點背景存活事件
  - H2：廣播事件範圍
  - H2：RPC 方法系列
  - H3：常見事件系列
  - H3：節點輔助方法
  - H2：稽核帳本 RPC
  - H2：任務帳本 RPC
  - H2：操作員輔助方法
  - H3：models.list 檢視
  - H2：執行核准
  - H2：代理程式傳遞備援
  - H2：版本管理
  - H3：用戶端常數
  - H2：驗證
  - H2：裝置身分與配對
  - H3：裝置驗證遷移診斷
  - H2：TLS 與固定憑證
  - H2：範圍
  - H2：相關內容

## gateway/remote-gateway-readme.md

- 路由：/gateway/remote-gateway-readme
- 標題：
  - H1：搭配遠端閘道執行 OpenClaw.app
  - H2：設定
  - H2：運作方式
  - H2：相關內容

## gateway/remote.md

- 路由：/gateway/remote
- 標題：
  - H2：核心概念
  - H2：拓撲選項
  - H2：命令流程（各部分在哪裡執行）
  - H2：SSH 通道（命令列介面與工具）
  - H2：命令列介面的遠端預設值
  - H2：認證資訊優先順序
  - H2：聊天介面的遠端存取
  - H2：macOS 應用程式遠端模式
  - H2：安全性規則（遠端／VPN）
  - H3：macOS：透過 LaunchAgent 建立持續性的 SSH 通道
  - H4：步驟 1：新增 SSH 設定
  - H4：步驟 2：複製 SSH 金鑰（僅需一次）
  - H4：步驟 3：設定閘道權杖
  - H4：步驟 4：建立 LaunchAgent
  - H4：步驟 5：載入 LaunchAgent
  - H4：疑難排解
  - H2：相關內容

## gateway/restart-recovery.md

- 路由：/gateway/restart-recovery
- 標題：
  - H2：重新啟動後保留的內容
  - H2：正常重新啟動會先排空工作
  - H2：如何偵測中斷的工作
  - H2：自動繼續
  - H3：子代理程式
  - H3：背景任務
  - H3：代理程式要求的重新啟動
  - H2：安全閥與可觀測性
  - H2：不會繼續的內容

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- 路由：/gateway/sandbox-vs-tool-policy-vs-elevated
- 標題：
  - H2：快速偵錯
  - H2：沙箱：工具的執行位置
  - H3：繫結掛載（安全性快速檢查）
  - H2：工具政策：哪些工具存在／可呼叫
  - H3：工具群組（簡寫）
  - H2：提升權限：僅限執行的「在主機上執行」
  - H2：常見的「沙箱牢籠」修正方式
  - H3：「工具 X 遭沙箱工具政策封鎖」
  - H3：「我以為這是主要代理程式，為什麼會在沙箱中？」
  - H2：相關內容

## gateway/sandboxing.md

- 路由：/gateway/sandboxing
- 標題：
  - H2：哪些內容會進入沙箱
  - H2：模式、範圍與後端
  - H2：Docker 後端
  - H3：沙箱化瀏覽器
  - H2：SSH 後端
  - H2：OpenShell 後端
  - H2：工作區存取
  - H2：自訂繫結掛載
  - H2：映像與設定
  - H2：setupCommand（一次性容器設定）
  - H2：工具政策與逃生機制
  - H2：多代理程式覆寫
  - H2：最小啟用範例
  - H2：相關內容

## gateway/secrets-plan-contract.md

- 路由：/gateway/secrets-plan-contract
- 標題：
  - H2：計畫檔案格式
  - H2：提供者的新增或更新與刪除
  - H2：支援的目標範圍
  - H2：目標類型行為
  - H2：路徑驗證規則
  - H2：失敗行為
  - H2：執行提供者的同意行為
  - H2：執行階段與稽核範圍附註
  - H2：操作員檢查
  - H2：相關文件

## gateway/secrets.md

- 路由：/gateway/secrets
- 標題：
  - H2：執行階段模型
  - H2：輸出時注入（哨兵值）
  - H2：代理程式存取邊界
  - H2：作用中介面篩選
  - H2：閘道驗證介面診斷
  - H2：初始設定參照預檢
  - H2：SecretRef 合約
  - H2：提供者設定
  - H2：檔案支援的 API 金鑰
  - H2：執行整合範例
  - H2：MCP 伺服器環境變數
  - H2：沙箱 SSH 驗證資料
  - H2：支援的認證資訊介面
  - H2：必要行為與優先順序
  - H2：啟用觸發條件
  - H2：降級與復原訊號
  - H2：命令路徑解析
  - H2：稽核與設定工作流程
  - H2：單向安全政策
  - H2：舊版驗證相容性附註
  - H2：Web 介面附註
  - H2：相關內容

## gateway/security/audit-checks.md

- 路由：/gateway/security/audit-checks
- 標題：
  - H2：相關內容

## gateway/security/exposure-runbook.md

- 路由：/gateway/security/exposure-runbook
- 標題：
  - H2：選擇公開模式
  - H2：預檢清單
  - H2：基準檢查
  - H2：最低安全基準
  - H2：私訊與群組公開範圍
  - H2：反向 Proxy 檢查
  - H2：工具與沙箱檢視
  - H2：變更後驗證
  - H2：復原計畫
  - H2：檢視檢查清單

## gateway/security/index.md

- 路由：/gateway/security
- 標題：
  - H2：範圍：個人助理安全模型
  - H2：OpenClaw 安全性稽核
  - H3：稽核檢查的項目（概略）
  - H3：分類處理發現項目時的優先順序
  - H2：60 秒完成強化基準
  - H2：信任邊界矩陣
  - H2：設計上不屬於弱點的項目
  - H2：閘道與節點信任
  - H2：威脅模型
  - H2：私訊存取：配對、允許清單、開放、停用
  - H3：允許清單（兩層）
  - H3：私訊工作階段隔離（多使用者模式）
  - H2：內容可見性與觸發授權
  - H2：提示詞注入
  - H3：外部內容與不受信任輸入的包裝
  - H3：略過旗標（在正式環境中保持關閉）
  - H3：群組中的推理與詳細輸出
  - H2：命令授權
  - H2：控制平面工具
  - H2：節點執行（system.run）
  - H2：動態 Skills（監看程式／遠端節點）
  - H2：外掛
  - H2：沙箱化
  - H3：子代理程式委派防護機制
  - H3：唯讀模式
  - H2：個別代理程式存取設定檔（多代理程式）
  - H3：完整存取（無沙箱）
  - H3：唯讀工具與唯讀工作區
  - H3：無檔案系統／Shell 存取（允許提供者傳訊）
  - H2：瀏覽器控制風險
  - H3：瀏覽器 SSRF 政策（預設嚴格）
  - H2：網路公開範圍
  - H3：繫結、連接埠、防火牆
  - H3：搭配 UFW 發布 Docker 連接埠
  - H3：mDNS／Bonjour 探索
  - H3：閘道 WebSocket 驗證
  - H3：Tailscale Serve 身分標頭
  - H3：反向 Proxy 設定
  - H3：HSTS 與來源附註
  - H3：透過 HTTP 使用控制介面
  - H3：不安全／危險旗標
  - H2：部署與主機信任
  - H2：磁碟上的密鑰
  - H3：認證資訊儲存位置圖
  - H3：檔案權限
  - H3：工作區 .env 檔案
  - H3：日誌與對話記錄
  - H2：安全基準（複製／貼上）
  - H3：使用不同號碼（WhatsApp、Signal、Telegram）
  - H2：事件回應
  - H3：遏制
  - H3：輪替（若密鑰外洩，應假設已遭入侵）
  - H3：稽核
  - H3：收集報告所需資料
  - H2：密鑰掃描
  - H2：回報安全性問題

## gateway/security/secure-file-operations.md

- 路由：/gateway/security/secure-file-operations
- 標題：
  - H2：預設：不使用 Python 輔助程式
  - H2：沒有 Python 時仍受保護的內容
  - H2：Python 增加的功能
  - H2：外掛與核心指引

## gateway/security/shrinkwrap.md

- 路由：/gateway/security/shrinkwrap
- 標題：
  - H2：為何重要
  - H2：產生與檢查
  - H2：檢查已發布的套件

## gateway/tailscale.md

- 路由：/gateway/tailscale
- 標題：
  - H2：模式
  - H2：設定範例
  - H3：僅限 Tailnet（Serve）
  - H3：僅限 Tailnet（繫結至 Tailnet IP）
  - H3：公用網際網路（Funnel 與共用密碼）
  - H2：命令列介面範例
  - H2：驗證
  - H3：Tailscale 身分標頭（僅限 Serve）
  - H2：附註
  - H3：Tailscale 先決條件與限制
  - H2：瀏覽器控制（遠端閘道與本機瀏覽器）
  - H2：深入瞭解
  - H2：相關內容

## gateway/tools-invoke-http-api.md

- 路由：/gateway/tools-invoke-http-api
- 標題：
  - H2：驗證
  - H2：安全性邊界（重要）
  - H2：要求主體
  - H2：政策與路由行為
  - H2：回應
  - H2：範例
  - H2：相關內容

## gateway/troubleshooting.md

- 路由：/gateway/troubleshooting
- 標題：
  - H2：命令階梯
  - H2：更新之後
  - H2：安裝版本分裂與較新設定防護
  - H2：回復版本後的通訊協定不相符
  - H2：Skill 符號連結因路徑逸出而遭略過
  - H2：Anthropic 長上下文需要額外用量時發生 429
  - H2：上游 403 封鎖回應
  - H2：本機 OpenAI 相容後端可通過直接探測，但代理程式執行失敗
  - H2：沒有回覆
  - H2：儀表板控制介面連線
  - H3：驗證詳細代碼快速對照
  - H2：閘道服務未執行
  - H2：macOS 閘道無聲停止回應，觸碰儀表板後才恢復
  - H2：重複的閘道／節點 LaunchAgents 導致 macOS launchd 監督程式循環
  - H2：閘道在高記憶體用量期間退出
  - H2：閘道拒絕無效設定
  - H2：閘道探測警告
  - H2：頻道已連線，但訊息未流通
  - H2：排程與心跳偵測傳遞
  - H2：節點已配對，但工具失敗
  - H2：瀏覽器工具失敗
  - H2：如果升級後某項功能突然故障
  - H2：相關內容

## gateway/trusted-proxy-auth.md

- 路由：/gateway/trusted-proxy-auth
- 標題：
  - H2：使用時機
  - H2：不應使用的情況
  - H2：運作方式
  - H2：設定
  - H3：設定參考
  - H2：控制介面配對行為
  - H2：操作者範圍標頭
  - H2：TLS 終止與 HSTS
  - H3：推出指南
  - H2：Proxy 設定範例
  - H2：混合權杖設定
  - H2：安全性檢查清單
  - H2：安全性稽核
  - H2：疑難排解
  - H2：從權杖驗證遷移
  - H2：相關內容

## help/debugging.md

- 路由：/help/debugging
- 標題：
  - H2：執行階段偵錯覆寫
  - H2：工作階段追蹤輸出
  - H2：外掛生命週期追蹤
  - H2：命令列介面啟動與命令效能分析
  - H2：閘道監看模式
  - H2：開發設定檔與開發閘道（--dev）
  - H2：原始串流記錄
  - H2：安全注意事項
  - H2：在 VSCode 中偵錯
  - H3：設定
  - H3：注意事項
  - H2：相關內容

## help/environment.md

- 路由：/help/environment
- 標題：
  - H2：優先順序（由高至低）
  - H2：供應商認證資訊與工作區 .env
  - H2：設定環境變數區塊
  - H2：匯入 Shell 環境變數
  - H2：執行 Shell 快照
  - H2：執行階段注入的環境變數
  - H2：使用者介面環境變數
  - H2：設定中的環境變數替換
  - H2：祕密參照與 ${ENV} 字串
  - H2：路徑相關環境變數
  - H2：記錄
  - H3：OPENCLAWHOME
  - H2：nvm 使用者：webfetch TLS 失敗
  - H2：舊版環境變數
  - H2：相關內容

## help/faq-first-run.md

- 路由：/help/faq-first-run
- 標題：
  - H2：快速開始與首次執行設定
  - H2：相關內容

## help/faq-models.md

- 路由：/help/faq-models
- 標題：
  - H2：模型：預設值、選擇、別名與切換
  - H2：模型容錯移轉與「所有模型皆失敗」
  - H2：驗證設定檔：用途與管理方式
  - H2：相關內容

## help/faq.md

- 路由：/help/faq
- 標題：
  - H2：發生故障時的前 60 秒
  - H2：快速開始與首次執行設定
  - H2：OpenClaw 是什麼？
  - H2：Skills 與自動化
  - H2：沙箱化與記憶
  - H2：各項內容在磁碟上的位置
  - H2：設定基礎
  - H2：遠端閘道與節點
  - H2：環境變數與 .env 載入
  - H2：工作階段與多個聊天
  - H2：模型、容錯移轉與驗證設定檔
  - H2：閘道：連接埠、「已在執行」與遠端模式
  - H2：記錄與偵錯
  - H2：媒體與附件
  - H2：安全性與存取控制
  - H2：聊天命令、中止工作與「它不會停止」
  - H2：其他
  - H2：相關內容

## help/index.md

- 路由：/help
- 標題：
  - H2：常見問題
  - H2：診斷
  - H2：測試
  - H2：社群與中繼資訊

## help/scripts.md

- 路由：/help/scripts
- 標題：
  - H2：慣例
  - H2：驗證監控指令碼
  - H2：GitHub 讀取輔助工具
  - H2：新增指令碼時
  - H2：相關內容

## help/testing-live.md

- 路由：/help/testing-live
- 標題：
  - H2：即時測試：本機冒煙測試命令
  - H2：即時測試：Android 節點能力全面檢查
  - H2：即時測試：模型冒煙測試（設定檔金鑰）
  - H3：第 1 層：直接完成模型請求（無閘道）
  - H3：第 2 層：閘道與開發代理程式冒煙測試（「@openclaw」實際執行的內容）
  - H2：即時測試：命令列介面後端冒煙測試（Claude、Gemini 或其他本機命令列介面）
  - H2：即時測試：APNs HTTP/2 Proxy 可連線性
  - H2：即時測試：ACP 繫結冒煙測試（/acp spawn ... --bind here）
  - H2：即時測試：Codex app-server 測試框架冒煙測試
  - H3：建議的即時測試方法
  - H2：即時測試：模型矩陣（涵蓋範圍）
  - H3：彙整器／替代閘道
  - H2：認證資訊（絕不可提交）
  - H2：Deepgram 即時測試（音訊轉錄）
  - H2：BytePlus 程式設計方案即時測試
  - H2：ComfyUI 工作流程媒體即時測試
  - H2：影像生成即時測試
  - H2：音樂生成即時測試
  - H2：影片生成即時測試
  - H2：媒體即時測試框架
  - H2：相關內容

## help/testing-updates-plugins.md

- 路由：/help/testing-updates-plugins
- 標題：
  - H2：保護的內容
  - H2：開發期間的本機驗證
  - H2：Docker 測試通道
  - H2：套件驗收
  - H2：發行預設值
  - H2：舊版相容性
  - H2：增加涵蓋範圍
  - H2：失敗分類處理

## help/testing.md

- 路由：/help/testing
- 標題：
  - H2：快速開始
  - H2：測試暫存目錄
  - H2：即時測試與 Docker／Parallels 工作流程
  - H2：QA 專用執行器
  - H3：透過 Convex 共用 Telegram 認證資訊（v1）
  - H3：將頻道加入 QA
  - H2：測試套件（各自的執行位置）
  - H3：單元／整合（預設）
  - H3：穩定性（閘道）
  - H3：端對端測試（儲存庫彙總）
  - H3：端對端測試（閘道冒煙測試）
  - H3：端對端測試（控制介面模擬瀏覽器）
  - H3：端對端測試：OpenShell 後端冒煙測試
  - H3：即時測試（真實供應商與真實模型）
  - H2：應該執行哪個套件？
  - H2：即時（會存取網路）測試
  - H2：Docker 執行器（選用的「可在 Linux 運作」檢查）
  - H2：文件健全性檢查
  - H2：離線迴歸測試（適用於 CI）
  - H2：代理程式可靠性評估（Skills）
  - H2：契約測試（外掛與頻道結構）
  - H3：命令
  - H3：頻道契約
  - H3：供應商契約
  - H3：執行時機
  - H2：新增迴歸測試（指南）
  - H2：相關內容

## help/troubleshooting.md

- 路由：/help/troubleshooting
- 標題：
  - H2：前 60 秒
  - H2：助理似乎能力受限或缺少工具
  - H2：Anthropic 長上下文 429
  - H2：本機 OpenAI 相容後端可直接運作，但在 OpenClaw 中失敗
  - H2：因缺少 OpenClaw 擴充功能而導致外掛安裝失敗
  - H2：安裝原則封鎖外掛安裝或更新
  - H2：外掛存在，但因擁有權可疑而遭封鎖
  - H2：決策樹
  - H2：相關內容

## index.md

- 路由：/
- 標題：
  - H1：OpenClaw 🦞
  - H2：瀏覽文件
  - H2：OpenClaw 是什麼？
  - H2：運作方式
  - H2：主要功能
  - H2：快速開始
  - H2：儀表板
  - H2：設定（選用）
  - H2：從這裡開始
  - H2：深入瞭解

## install/ansible.md

- 路由：/install/ansible
- 標題：
  - H2：先決條件
  - H2：可獲得的內容
  - H2：快速開始
  - H2：安裝的內容
  - H2：安裝後設定
  - H3：快速命令
  - H2：安全性架構
  - H2：手動安裝
  - H2：更新
  - H2：疑難排解
  - H2：進階設定
  - H2：相關內容

## install/azure.md

- 路由：/install/azure
- 標題：
  - H2：你將執行的操作
  - H2：所需項目
  - H2：設定部署
  - H2：部署 Azure 資源
  - H2：安裝 OpenClaw
  - H2：成本考量
  - H2：清理
  - H2：後續步驟
  - H2：相關內容

## install/bun.md

- 路由：/install/bun
- 標題：
  - H2：安裝
  - H2：生命週期指令碼
  - H2：注意事項
  - H2：相關內容

## install/clawdock.md

- 路由：/install/clawdock
- 標題：
  - H2：安裝
  - H2：可獲得的內容
  - H3：基本操作
  - H3：容器存取
  - H3：Web 使用者介面與配對
  - H3：設定與維護
  - H3：公用程式
  - H2：首次使用流程
  - H2：設定與祕密
  - H2：相關內容

## install/development-channels.md

- 路由：/install/development-channels
- 標題：
  - H2：切換通道
  - H2：指定單次版本或標籤
  - H2：試執行
  - H2：外掛與通道
  - H2：檢查目前狀態
  - H2：標記最佳實務
  - H2：macOS 應用程式可用性
  - H2：相關內容

## install/digitalocean.md

- 路由：/install/digitalocean
- 標題：
  - H2：先決條件
  - H2：設定
  - H2：持久化與備份
  - H2：1 GB RAM 使用技巧
  - H2：疑難排解
  - H2：後續步驟
  - H2：相關內容

## install/docker-vm-runtime.md

- 路由：/install/docker-vm-runtime
- 標題：
  - H2：將必要的二進位檔預先建置至映像檔中
  - H2：建置並啟動
  - H2：各項資料的持久化位置
  - H2：更新
  - H2：相關內容

## install/docker.md

- 路由：/install/docker
- 標題：
  - H2：先決條件
  - H2：容器化閘道
  - H3：手動流程
  - H3：升級容器映像檔
  - H3：環境變數
  - H3：包含所選外掛、從原始碼建置的映像檔
  - H3：可觀測性
  - H3：健康狀態檢查
  - H3：區域網路與迴路介面
  - H3：主機上的本機提供者
  - H3：Docker 中的 Claude 命令列介面後端
  - H3：Bonjour / mDNS
  - H3：儲存與持久化
  - H3：Shell 輔助工具（選用）
  - H3：要在 VPS 上執行嗎？
  - H2：代理程式沙箱
  - H3：快速啟用
  - H2：疑難排解
  - H2：相關內容

## install/exe-dev.md

- 路由：/install/exe-dev
- 標題：
  - H2：所需項目
  - H2：初學者快速流程
  - H2：使用 Shelley 自動安裝
  - H2：手動安裝
  - H2：遠端頻道設定
  - H2：遠端存取
  - H2：更新
  - H2：相關內容

## install/fly.md

- 路由：/install/fly
- 標題：
  - H2：所需項目
  - H2：初學者快速流程
  - H2：疑難排解
  - H3：「應用程式未在預期位址上監聽」
  - H3：健康狀態檢查失敗／連線遭拒
  - H3：記憶體不足／記憶體問題
  - H3：閘道鎖定問題
  - H3：未讀取設定
  - H3：透過 SSH 寫入設定
  - H3：狀態未持久保存
  - H2：更新
  - H3：更新機器命令
  - H2：私人部署（強化）
  - H3：何時應使用私人部署
  - H3：設定
  - H3：存取私人部署
  - H3：私人部署中的網路鉤子
  - H3：安全性取捨
  - H2：注意事項
  - H2：費用
  - H2：後續步驟
  - H2：相關內容

## install/gcp.md

- 路由：/install/gcp
- 標題：
  - H2：所需項目
  - H2：快速流程
  - H2：疑難排解
  - H2：服務帳戶（安全性最佳做法）
  - H2：後續步驟
  - H2：相關內容

## install/hetzner.md

- 路由：/install/hetzner
- 標題：
  - H2：所需項目
  - H2：快速流程
  - H2：基礎架構即程式碼（Terraform）
  - H2：後續步驟
  - H2：相關內容

## install/hostinger.md

- 路由：/install/hostinger
- 標題：
  - H2：先決條件
  - H2：選項 A：一鍵安裝 OpenClaw
  - H2：選項 B：在 VPS 上執行 OpenClaw
  - H2：驗證設定
  - H2：疑難排解
  - H2：後續步驟
  - H2：相關內容

## install/index.md

- 路由：/install
- 標題：
  - H2：系統需求
  - H2：建議方式：安裝程式指令碼
  - H2：其他安裝方式
  - H3：本機前綴安裝程式（install-cli.sh）
  - H3：npm、pnpm 或 bun
  - H3：從原始碼安裝
  - H3：從 GitHub main 簽出版本安裝
  - H3：容器與套件管理工具
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
  - H3：原始碼簽出版本偵測
  - H3：範例（install.sh）
  - H2：install-cli.sh
  - H3：流程（install-cli.sh）
  - H3：範例（install-cli.sh）
  - H2：install.ps1
  - H3：流程（install.ps1）
  - H3：範例（install.ps1）
  - H2：CI 與自動化
  - H2：疑難排解
  - H2：相關內容

## install/kubernetes.md

- 路由：/install/kubernetes
- 標題：
  - H2：為何不使用 Helm
  - H2：所需項目
  - H2：快速開始
  - H2：使用 Kind 進行本機測試
  - H2：逐步操作
  - H3：1）部署
  - H3：2）存取閘道
  - H2：部署的內容
  - H2：自訂
  - H3：代理程式指示
  - H3：閘道設定
  - H3：新增提供者
  - H3：自訂命名空間
  - H3：自訂映像檔
  - H3：公開至連接埠轉送之外
  - H2：重新部署
  - H2：移除部署
  - H2：架構注意事項
  - H2：檔案結構
  - H2：相關內容

## install/macos-vm.md

- 路由：/install/macos-vm
- 標題：
  - H2：建議的預設方式（適合大多數使用者）
  - H2：macOS 虛擬機器選項
  - H3：Apple Silicon Mac 上的本機虛擬機器（Lume）
  - H3：託管式 Mac 提供者（雲端）
  - H2：快速流程（Lume，適合有經驗的使用者）
  - H2：所需項目（Lume）
  - H2：1）安裝 Lume
  - H2：2）建立 macOS 虛擬機器
  - H2：3）完成設定輔助程式
  - H2：4）取得虛擬機器的 IP 位址
  - H2：5）透過 SSH 連入虛擬機器
  - H2：6）安裝 OpenClaw
  - H2：7）設定頻道
  - H2：8）以無介面模式執行虛擬機器
  - H2：額外功能：iMessage 整合
  - H2：儲存黃金映像檔
  - H2：全天候執行
  - H2：疑難排解
  - H2：相關文件

## install/migrating-claude.md

- 路由：/install/migrating-claude
- 標題：
  - H2：兩種匯入方式
  - H2：會匯入的內容
  - H2：僅保留於封存中的內容
  - H2：來源選擇
  - H2：建議流程
  - H2：衝突處理
  - H2：用於自動化的 JSON 輸出
  - H2：疑難排解
  - H2：相關內容

## install/migrating-hermes.md

- 路由：/install/migrating-hermes
- 標題：
  - H2：兩種匯入方式
  - H2：會匯入的內容
  - H2：僅保留於封存中的內容
  - H2：建議流程
  - H2：衝突處理
  - H2：密鑰
  - H2：用於自動化的 JSON 輸出
  - H2：疑難排解
  - H2：相關內容

## install/migrating.md

- 路由：/install/migrating
- 標題：
  - H2：從其他代理程式系統匯入
  - H2：將 OpenClaw 移至新機器
  - H3：遷移步驟
  - H3：常見問題
  - H3：驗證檢查清單
  - H2：就地升級外掛
  - H2：相關內容

## install/nix.md

- 路由：/install/nix
- 標題：
  - H2：可獲得的內容
  - H2：快速開始
  - H2：Nix 模式的執行階段行為
  - H3：Nix 模式下的變更
  - H3：設定與狀態路徑
  - H3：服務 PATH 探索
  - H2：相關內容

## install/node.md

- 路由：/install/node
- 標題：
  - H2：檢查版本
  - H2：安裝節點
  - H2：疑難排解
  - H3：openclaw：找不到命令
  - H3：npm install -g 的權限錯誤（Linux）
  - H2：相關內容

## install/northflank.mdx

- 路由：/install/northflank
- 標題：
  - H2：如何開始
  - H2：可獲得的內容
  - H2：連接頻道
  - H2：後續步驟

## install/oracle.md

- 路由：/install/oracle
- 標題：
  - H2：先決條件
  - H2：設定
  - H2：驗證安全性態勢
  - H2：ARM 注意事項
  - H2：持久化與備份
  - H2：備援方式：SSH 通道
  - H2：疑難排解
  - H2：後續步驟
  - H2：相關內容

## install/podman.md

- 路由：/install/podman
- 標題：
  - H2：先決條件
  - H2：快速開始
  - H2：Podman 與 Tailscale
  - H2：Systemd（Quadlet，選用）
  - H2：設定、環境變數與儲存空間
  - H2：升級映像檔
  - H2：實用命令
  - H2：疑難排解
  - H2：相關內容

## install/railway.mdx

- 路由：/install/railway
- 標題：
  - H2：一鍵部署
  - H2：可獲得的內容
  - H2：連接頻道
  - H2：備份與遷移
  - H2：後續步驟

## install/raspberry-pi.md

- 路由：/install/raspberry-pi
- 標題：
  - H2：硬體相容性
  - H2：先決條件
  - H2：設定
  - H2：效能技巧
  - H2：建議的模型設定
  - H2：ARM 二進位檔注意事項
  - H2：持久化與備份
  - H2：疑難排解
  - H2：後續步驟
  - H2：相關內容

## install/render.mdx

- 路由：/install/render
- 標題：
  - H2：先決條件
  - H2：部署
  - H2：藍圖
  - H2：選擇方案
  - H2：部署後
  - H3：存取控制介面
  - H3：日誌
  - H3：Shell 存取
  - H3：環境變數
  - H3：自動部署
  - H2：自訂網域
  - H2：擴充
  - H2：備份與遷移
  - H2：疑難排解
  - H3：服務無法啟動
  - H3：冷啟動緩慢（免費方案）
  - H3：重新部署後資料遺失
  - H3：健康狀態檢查失敗
  - H2：後續步驟

## install/uninstall.md

- 路由：/install/uninstall
- 標題：
  - H2：簡易方式（命令列介面仍已安裝）
  - H2：手動移除服務（命令列介面未安裝）
  - H3：macOS（launchd）
  - H3：Linux（systemd 使用者單元）
  - H3：Windows（排定的工作）
  - H2：一般安裝與原始碼簽出
  - H3：一般安裝（install.sh / npm / pnpm / bun）
  - H3：原始碼簽出（git clone）
  - H2：相關內容

## install/updating.md

- 路由：/install/updating
- 標題：
  - H2：建議方式：openclaw update
  - H2：在 npm 與 git 安裝之間切換
  - H2：替代方式：重新執行安裝程式
  - H2：替代方式：手動使用 npm、pnpm 或 bun
  - H3：進階 npm 安裝主題
  - H2：自動更新程式
  - H2：更新後
  - H3：執行 doctor
  - H3：重新啟動閘道
  - H3：驗證
  - H2：復原舊版
  - H3：固定版本（npm）
  - H3：固定提交（原始碼）
  - H2：如果遇到困難
  - H2：相關內容

## install/upstash.md

- 路由：/install/upstash
- 標題：
  - H2：必要條件
  - H2：建立 Box
  - H2：透過 SSH 通道連線
  - H2：安裝 OpenClaw
  - H2：執行初始設定
  - H2：啟動閘道
  - H2：自動重新啟動
  - H2：疑難排解
  - H2：相關內容

## logging.md

- 路由：/logging
- 標題：
  - H2：記錄檔的位置
  - H2：如何讀取記錄
  - H3：命令列介面：即時追蹤（建議）
  - H3：控制介面（網頁）
  - H3：僅限頻道的記錄
  - H2：記錄格式
  - H3：檔案記錄（JSONL）
  - H3：主控台輸出
  - H3：閘道 WebSocket 記錄
  - H2：設定記錄功能
  - H3：記錄層級
  - H3：針對特定模型傳輸的診斷
  - H3：追蹤關聯
  - H3：模型呼叫大小與時間
  - H3：主控台樣式
  - H3：遮蔽敏感資訊
  - H2：診斷與 OpenTelemetry
  - H2：疑難排解提示
  - H2：相關內容

## maturity/scorecard.md

- 路由：/maturity/scorecard
- 標題：
  - H1：成熟度評分卡
  - H2：本頁的用途
  - H2：概覽
  - H2：分數區間
  - H2：功能面向瀏覽器
  - H2：QA 證據摘要
  - H3：各領域的就緒程度

## maturity/taxonomy.md

- 路由：/maturity/taxonomy
- 標題：
  - H1：成熟度分類
  - H2：如何閱讀本頁
  - H2：成熟度等級
  - H2：產品領域
  - H2：詳細資訊
  - H3：核心
  - H3：平台
  - H3：頻道
  - H3：供應商與工具

## network.md

- 路由：/network
- 標題：
  - H2：核心模型
  - H2：配對與身分識別
  - H2：探索與傳輸方式
  - H2：節點與傳輸方式
  - H2：安全性
  - H2：相關內容

## nodes/audio.md

- 路由：/nodes/audio
- 標題：
  - H2：功能
  - H2：自動偵測（預設）
  - H2：設定範例
  - H3：供應商與命令列介面備援（OpenAI + Whisper CLI）
  - H3：僅使用供應商並設有範圍限制
  - H3：僅使用供應商（Deepgram）
  - H3：僅使用供應商（Mistral Voxtral）
  - H3：僅使用供應商（SenseAudio）
  - H3：將轉錄內容回顯至聊天（選擇啟用）
  - H2：注意事項與限制
  - H3：常駐本機 STT
  - H3：Proxy 環境支援
  - H2：群組中的提及偵測
  - H2：注意事項
  - H2：相關內容

## nodes/camera.md

- 路由：/nodes/camera
- 標題：
  - H2：iOS 節點
  - H3：iOS 使用者設定
  - H3：iOS 命令（透過閘道 node.invoke）
  - H3：iOS 前景執行需求
  - H3：命令列介面輔助工具
  - H2：Android 節點
  - H3：Android 使用者設定
  - H3：權限
  - H3：Android 前景執行需求
  - H3：Android 命令（透過閘道 node.invoke）
  - H2：macOS 應用程式
  - H3：macOS 使用者設定
  - H3：命令列介面輔助工具（node invoke）
  - H2：Linux 節點主機
  - H2：安全性與實際限制
  - H2：macOS 螢幕錄影（作業系統層級）
  - H2：相關內容

## nodes/computer-use.md

- 路由：/nodes/computer-use
- 標題：
  - H2：需求
  - H2：電腦代理程式工具
  - H2：computer.act 節點命令
  - H2：啟用並備妥
  - H2：安全性
  - H2：與其他桌面控制方式的關係

## nodes/images.md

- 路由：/nodes/images
- 標題：
  - H2：目標
  - H2：命令列介面介面
  - H2：WhatsApp Web 頻道行為
  - H2：自動回覆管線
  - H2：將傳入媒體轉為命令
  - H2：限制與錯誤
  - H2：測試注意事項
  - H2：相關內容

## nodes/index.md

- 路由：/nodes
- 標題：
  - H2：配對與狀態
  - H2：版本落差與升級順序
  - H2：遠端節點主機（system.run）
  - H3：啟動節點主機（前景）
  - H3：透過 SSH 通道連至遠端閘道（繫結回送介面）
  - H3：啟動節點主機（服務）
  - H3：配對與命名
  - H3：節點代管的 MCP 伺服器
  - H3：節點代管的 Skills
  - H3：無頭模式的身分識別狀態
  - H3：將命令加入允許清單
  - H3：將 exec 指向節點
  - H3：本機模型推論
  - H3：Codex 工作階段與逐字稿
  - H3：Claude 工作階段與逐字稿
  - H3：OpenCode 與 Pi 工作階段
  - H2：叫用命令
  - H2：命令原則
  - H2：設定（openclaw.json）
  - H2：螢幕擷取畫面（畫布快照）
  - H3：畫布控制項
  - H3：A2UI（畫布）
  - H2：照片與影片（節點相機）
  - H2：螢幕錄影（節點）
  - H2：位置（節點）
  - H2：SMS（Android 節點）
  - H2：裝置與個人資料命令
  - H2：系統命令（節點主機 / Mac 節點）
  - H2：Exec 節點繫結
  - H2：權限對應表
  - H2：無頭節點主機（跨平台）
  - H2：Mac 節點模式

## nodes/location-command.md

- 路由：/nodes/location-command
- 標題：
  - H2：簡而言之
  - H2：為何使用選擇器（而不只是開關）
  - H2：設定模型
  - H2：權限對應（node.permissions）
  - H2：命令：location.get
  - H2：背景執行行為
  - H2：Linux 節點主機
  - H2：模型與工具整合
  - H2：使用者體驗文案（建議）
  - H2：相關內容

## nodes/media-understanding.md

- 路由：/nodes/media-understanding
- 標題：
  - H2：運作方式
  - H2：設定
  - H3：模型項目
  - H3：供應商認證資訊
  - H2：規則與行為
  - H3：自動偵測（預設）
  - H3：Proxy 支援（音訊 / 影片供應商呼叫）
  - H2：功能
  - H2：供應商支援矩陣
  - H2：模型選擇指南
  - H2：附件原則
  - H3：檔案附件擷取
  - H2：設定範例
  - H2：狀態輸出
  - H2：注意事項
  - H2：相關內容

## nodes/presence.md

- 路由：/nodes/presence
- 標題：
  - H2：需求
  - H2：檢查使用中的電腦
  - H2：活動如何轉換為上線狀態
  - H2：隱私權與模型上下文
  - H2：連線警示的路由方式
  - H2：疑難排解
  - H2：相關內容

## nodes/talk.md

- 路由：/nodes/talk
- 標題：
  - H2：行為（macOS）
  - H2：回覆中的語音指令
  - H2：設定（/.openclaw/openclaw.json）
  - H2：macOS 使用者介面
  - H2：Android 使用者介面
  - H2：注意事項
  - H2：相關內容

## nodes/troubleshooting.md

- 路由：/nodes/troubleshooting
- 標題：
  - H2：命令階梯
  - H2：前景執行需求
  - H2：權限矩陣
  - H2：配對與核准的差異
  - H2：常見節點錯誤碼
  - H2：快速復原循環
  - H2：相關內容

## nodes/voicewake.md

- 路由：/nodes/voicewake
- 標題：
  - H2：儲存空間
  - H2：通訊協定
  - H3：觸發詞清單
  - H3：路由（從觸發詞到目標）
  - H3：事件
  - H2：用戶端行為
  - H2：相關內容

## openclaw-agent-runtime.md

- 路由：/openclaw-agent-runtime
- 標題：
  - H2：型別檢查與程式碼檢查
  - H2：執行代理程式執行階段測試
  - H2：手動測試
  - H2：完全重設
  - H2：參考資料
  - H2：相關內容

## perplexity.md

- 路由：/perplexity
- 標題：
  - H2：相關內容

## plan/cloud-workers.md

- 路由：/plan/cloud-workers
- 標題：
  - H2：狀態
  - H2：問題
  - H2：目標
  - H2：非目標（v1）
  - H2：既有做法（我們沿用什麼、反轉什麼）
  - H2：架構決策：迴圈在工作節點上執行，透過閘道進行推論
  - H2：元件
  - H3：1. 環境狀態機與供應商合約
  - H3：2. 工作節點啟動程序：在機器上安裝 OpenClaw
  - H3：3. 傳輸：全部透過 SSH
  - H3：4. 工作節點通訊協定（專用；不是節點通訊協定）
  - H3：5. 工作階段後端 RPC
  - H3：6. 工作區同步
  - H3：7. 配置狀態機、工作階段與使用者介面
  - H2：分派與移交
  - H2：安全模型
  - H2：容量
  - H2：生命週期
  - H2：設定介面
  - H2：里程碑
  - H2：待解問題

## plan/path3-sqlite-session-artifact-family.md

- 路由：/plan/path3-sqlite-session-artifact-family
- 標題：
  - H1：路徑 3 SQLite 工作階段成品系列
  - H2：權威系列
  - H2：切換後不屬於此系列的成品
  - H2：修補點
  - H2：聚焦測試

## plan/ui-channels.md

- 路由：/plan/ui-channels
- 標題：
  - H2：狀態
  - H2：問題
  - H2：目標
  - H2：非目標
  - H2：目標模型
  - H2：傳遞中繼資料
  - H2：執行階段能力合約
  - H2：頻道對應
  - H2：重構步驟
  - H2：測試
  - H2：待確認問題
  - H2：相關內容

## platforms/android.md

- 路由：/platforms/android
- 標題：
  - H2：支援概況
  - H2：從 Google Play 以外的來源安裝
  - H2：從遠端 Mac 鏡像並控制 Android
  - H3：開始之前
  - H3：啟用透過 TCP 的 ADB
  - H3：僅允許控制端 Mac
  - H3：連線並開始鏡像
  - H3：疑難排解
  - H2：連線操作手冊
  - H3：必要條件
  - H3：1. 啟動閘道
  - H3：2. 驗證探索功能（選用）
  - H4：透過單點傳播 DNS-SD 進行跨網路探索
  - H3：3. 從 Android 連線
  - H3：多個閘道
  - H3：在線狀態存活信標
  - H3：4. 核准配對（命令列介面）
  - H3：5. 驗證節點已連線
  - H3：6. 聊天與記錄
  - H3：7. 畫布與相機
  - H4：閘道畫布主機（建議用於網頁內容）
  - H3：8. 語音與擴充的 Android 命令介面
  - H3：9. 工作區檔案（唯讀）
  - H2：檢閱命令核准
  - H2：助理進入點
  - H2：通知轉送
  - H2：相關內容

## platforms/digitalocean.md

- 路由：/platforms/digitalocean
- 標題：
  - H2：相關內容

## platforms/easyrunner.md

- 路由：/platforms/easyrunner
- 標題：
  - H2：開始之前
  - H2：Compose 應用程式
  - H2：設定 OpenClaw
  - H2：驗證
  - H2：更新與備份
  - H2：疑難排解

## platforms/index.md

- 路由：/platforms
- 標題：
  - H2：選擇作業系統
  - H2：VPS 與託管服務
  - H2：常用連結
  - H2：安裝閘道服務（命令列介面）
  - H2：相關內容

## platforms/ios-healthkit.md

- 路由：/platforms/ios-healthkit
- 標題：
  - H1：HealthKit 摘要
  - H2：需求
  - H2：啟用存取權
  - H3：1. 授權閘道命令
  - H3：2. 在 iPhone 上啟用共享
  - H2：要求今日摘要
  - H2：隱私權行為
  - H2：疑難排解
  - H3：節點未宣告此命令
  - H3：命令需要明確選擇加入
  - H3：HEALTHACCESSDISABLED
  - H3：摘要成功，但缺少指標
  - H3：較舊的範圍失敗
  - H2：相關內容

## platforms/ios.md

- 路由：/platforms/ios
- 標題：
  - H2：功能
  - H2：需求
  - H2：快速開始（配對並連線）
  - H2：健康摘要
  - H2：檢閱命令核准
  - H2：選用的 Apple Watch 直接節點
  - H2：正式版本的中繼支援推播
  - H2：背景存活信標
  - H2：驗證與信任流程
  - H2：探索路徑
  - H3：Bonjour（區域網路）
  - H3：Tailnet（跨網路）
  - H3：手動主機／連接埠
  - H2：多個閘道
  - H2：畫布與 A2UI
  - H2：與電腦操作的關係
  - H3：畫布評估／快照
  - H2：語音喚醒與對話模式
  - H2：常見錯誤
  - H2：相關文件

## platforms/linux.md

- 路由：/platforms/linux
- 標題：
  - H2：桌面輔助程式
  - H2：命令列介面與 SSH 替代方案
  - H2：節點能力
  - H2：安裝
  - H2：閘道服務（systemd）
  - H2：記憶體壓力與 OOM 終止
  - H2：相關內容

## platforms/mac/bundled-gateway.md

- 路由：/platforms/mac/bundled-gateway
- 標題：
  - H2：自動設定
  - H2：手動復原
  - H2：Launchd（作為 LaunchAgent 的閘道）
  - H2：版本相容性
  - H2：macOS 上的狀態目錄
  - H2：偵錯應用程式連線能力
  - H2：冒煙檢查
  - H2：相關內容

## platforms/mac/canvas.md

- 路由：/platforms/mac/canvas
- 標題：
  - H2：畫布所在位置
  - H2：面板行為
  - H2：代理程式 API 介面
  - H2：畫布中的 A2UI
  - H3：A2UI 命令（v0.8）
  - H2：從畫布觸發代理程式執行
  - H2：安全性注意事項
  - H2：相關內容

## platforms/mac/child-process.md

- 路由：/platforms/mac/child-process
- 標題：
  - H2：預設行為（launchd）
  - H2：未簽署的開發版本
  - H2：僅附加模式
  - H2：遠端模式
  - H2：偏好 launchd 的原因
  - H2：相關內容

## platforms/mac/dev-setup.md

- 路由：/platforms/mac/dev-setup
- 標題：
  - H1：macOS 開發人員設定
  - H2：必要條件
  - H2：1. 安裝相依套件
  - H2：2. 建置並封裝應用程式
  - H2：3. 安裝命令列介面與閘道
  - H2：疑難排解
  - H3：建置失敗：工具鏈或 SDK 不相符
  - H3：授予權限時應用程式當機
  - H3：閘道無限期顯示「Starting...」
  - H2：相關內容

## platforms/mac/health.md

- 路由：/platforms/mac/health
- 標題：
  - H1：macOS 上的健康狀態檢查
  - H2：選單列
  - H2：設定
  - H2：探測的運作方式
  - H2：如有疑問
  - H2：相關內容

## platforms/mac/icon.md

- 路由：/platforms/mac/icon
- 標題：
  - H1：選單列圖示狀態
  - H2：狀態
  - H2：語音喚醒耳朵圖示
  - H2：形狀與大小
  - H2：行為注意事項
  - H2：相關內容

## platforms/mac/logging.md

- 路由：/platforms/mac/logging
- 標題：
  - H1：記錄（macOS）
  - H2：循環診斷檔案記錄（偵錯窗格）
  - H2：macOS 統一記錄中的私密資料
  - H2：為 OpenClaw（ai.openclaw）啟用
  - H2：偵錯後停用
  - H2：相關內容

## platforms/mac/menu-bar.md

- 路由：/platforms/mac/menu-bar
- 標題：
  - H2：顯示內容
  - H2：狀態模型
  - H2：IconState 列舉（Swift）
  - H3：ActivityKind -&gt; 徽章符號
  - H3：視覺對應
  - H2：內容子選單
  - H2：狀態列文字（選單）
  - H2：事件擷取
  - H2：偵錯覆寫
  - H2：測試檢查清單
  - H2：相關內容

## platforms/mac/peekaboo.md

- 路由：/platforms/mac/peekaboo
- 標題：
  - H2：這是什麼（以及不是什麼）
  - H2：與其他桌面控制路徑的關係
  - H2：啟用橋接器
  - H2：用戶端探索順序
  - H2：安全性與權限
  - H2：快照行為（自動化）
  - H2：疑難排解
  - H2：相關內容

## platforms/mac/permissions.md

- 路由：/platforms/mac/permissions
- 標題：
  - H2：穩定權限的需求
  - H2：節點與命令列介面執行階段的輔助使用權限
  - H2：提示消失時的復原檢查清單
  - H2：檔案與資料夾權限（桌面／文件／下載項目）
  - H2：相關內容

## platforms/mac/remote.md

- 路由：/platforms/mac/remote
- 標題：
  - H2：模式
  - H2：遠端傳輸方式
  - H2：遠端主機的必要條件
  - H2：macOS 應用程式設定
  - H2：網頁聊天
  - H2：權限
  - H2：安全性注意事項
  - H2：WhatsApp 登入流程（遠端）
  - H2：疑難排解
  - H2：通知音效
  - H2：相關內容

## platforms/mac/signing.md

- 路由：/platforms/mac/signing
- 標題：
  - H1：Mac 簽署（偵錯版本）
  - H2：使用方式
  - H3：臨時簽署注意事項
  - H2：「關於」的建置中繼資料
  - H2：相關內容

## platforms/mac/skills.md

- 路由：/platforms/mac/skills
- 標題：
  - H2：資料來源
  - H2：安裝動作
  - H2：環境變數／API 金鑰
  - H2：遠端模式
  - H2：相關內容

## platforms/mac/voice-overlay.md

- 路由：/platforms/mac/voice-overlay
- 標題：
  - H1：語音覆疊層生命週期（macOS）
  - H2：行為
  - H2：實作
  - H2：記錄
  - H2：偵錯檢查清單
  - H2：相關內容

## platforms/mac/voicewake.md

- 路由：/platforms/mac/voicewake
- 標題：
  - H1：語音喚醒與按住說話
  - H2：需求
  - H2：模式
  - H2：執行階段行為（喚醒詞）
  - H2：生命週期不變條件
  - H2：按住說話的特定行為
  - H2：使用者可見設定
  - H2：轉送行為
  - H2：轉送承載資料
  - H2：快速驗證
  - H2：相關內容

## platforms/mac/webchat.md

- 路由：/platforms/mac/webchat
- 標題：
  - H2：啟動與偵錯
  - H2：連接方式
  - H2：安全性介面
  - H2：已知限制
  - H2：相關內容

## platforms/mac/xpc.md

- 路由：/platforms/mac/xpc
- 標題：
  - H1：OpenClaw macOS IPC 架構
  - H2：目標
  - H2：運作方式
  - H3：閘道 + 節點傳輸
  - H3：節點服務 + 應用程式 IPC
  - H3：PeekabooBridge（UI 自動化）
  - H2：操作流程
  - H2：強化注意事項
  - H2：相關內容

## platforms/macos.md

- 路由：/platforms/macos
- 標題：
  - H2：下載
  - H2：首次執行
  - H2：更新
  - H2：開啟儀表板連結
  - H2：匯入瀏覽器登入資訊
  - H2：選擇閘道模式
  - H2：應用程式負責的項目
  - H2：macOS 詳細資訊頁面
  - H2：相關內容

## platforms/oracle.md

- 路由：/platforms/oracle
- 標題：
  - H2：相關內容

## platforms/raspberry-pi.md

- 路由：/platforms/raspberry-pi
- 標題：
  - H2：相關內容

## platforms/windows.md

- 路由：/platforms/windows
- 標題：
  - H2：建議：Windows Hub
  - H3：Windows Hub 包含的內容
  - H3：首次啟動
  - H2：Windows 節點模式
  - H2：本機 MCP 模式
  - H2：原生 Windows 命令列介面與閘道
  - H2：WSL2 閘道
  - H2：在登入 Windows 前自動啟動閘道
  - H2：透過區域網路公開 WSL 服務
  - H2：疑難排解
  - H3：系統匣圖示未出現
  - H3：本機設定失敗
  - H3：應用程式顯示需要配對
  - H3：網頁聊天無法連線至遠端閘道
  - H3：screen.snapshot、相機或音訊命令失敗
  - H3：Git 或 GitHub 連線失敗
  - H2：相關內容

## plugins/adding-capabilities.md

- 路由：/plugins/adding-capabilities
- 標題：
  - H2：何時建立能力
  - H2：標準流程
  - H2：各項內容的歸屬位置
  - H2：提供者與執行框架的銜接介面
  - H2：檔案檢查清單
  - H2：完整範例：影像生成
  - H2：嵌入提供者
  - H2：審查檢查清單
  - H2：相關內容

## plugins/admin-http-rpc.md

- 路由：/plugins/admin-http-rpc
- 標題：
  - H2：啟用前須知
  - H2：啟用
  - H2：驗證路由
  - H2：驗證
  - H2：安全性模型
  - H2：要求
  - H2：回應
  - H2：允許的方法
  - H2：WebSocket 比較
  - H2：疑難排解
  - H2：相關內容

## plugins/agent-tools.md

- 路由：/plugins/agent-tools
- 標題：
  - H2：相關內容

## plugins/architecture-internals.md

- 路由：/plugins/architecture-internals
- 標題：
  - H2：載入管線
  - H3：以資訊清單優先的行為
  - H3：外掛快取邊界
  - H2：登錄模型
  - H2：對話繫結回呼
  - H2：提供者執行階段掛鉤
  - H3：掛鉤順序與用法
  - H3：提供者範例
  - H3：內建範例
  - H2：執行階段輔助工具
  - H3：api.runtime.imageGeneration
  - H2：閘道 HTTP 路由
  - H2：外掛 SDK 匯入路徑
  - H2：訊息工具結構描述
  - H2：頻道目標解析
  - H2：由設定支援的目錄
  - H2：提供者目錄
  - H2：唯讀頻道檢查
  - H2：套件組合包
  - H3：頻道目錄中繼資料
  - H2：內容引擎外掛
  - H2：新增能力
  - H3：能力檢查清單
  - H3：能力範本
  - H2：相關內容

## plugins/architecture.md

- 路由：/plugins/architecture
- 標題：
  - H2：公開能力模型
  - H3：外部相容性立場
  - H3：外掛形態
  - H3：舊版掛鉤
  - H3：相容性訊號
  - H2：架構概覽
  - H3：外掛中繼資料快照與查詢表
  - H3：啟用規劃
  - H3：頻道外掛與共用訊息工具
  - H2：能力所有權模型
  - H3：能力分層
  - H3：多能力公司外掛範例
  - H3：能力範例：影片理解
  - H2：合約與強制執行
  - H3：合約應包含的內容
  - H2：執行模型
  - H2：匯出邊界
  - H2：內部機制與參考資料
  - H2：相關內容

## plugins/building-extensions.md

- 路由：/plugins/building-extensions
- 標題：
  - H2：相關內容

## plugins/building-plugins.md

- 路由：/plugins/building-plugins
- 標題：
  - H2：需求
  - H2：選擇外掛形態
  - H2：快速入門
  - H2：註冊工具
  - H2：匯入慣例
  - H2：提交前檢查清單
  - H2：針對 Beta 版本進行測試
  - H2：後續步驟
  - H2：相關內容

## plugins/bundles.md

- 路由：/plugins/bundles
- 標題：
  - H2：組合包存在的原因
  - H2：安裝組合包
  - H2：OpenClaw 從組合包映射的內容
  - H3：目前支援
  - H4：Skill 內容
  - H4：掛鉤套件
  - H4：嵌入式 OpenClaw 的 MCP
  - H4：嵌入式 OpenClaw 設定
  - H4：嵌入式 OpenClaw LSP
  - H3：已偵測但未執行
  - H2：組合包格式
  - H2：偵測優先順序
  - H2：執行階段相依性與清理
  - H2：安全性
  - H2：疑難排解
  - H2：相關內容

## plugins/cli-backend-plugins.md

- 路由：/plugins/cli-backend-plugins
- 標題：
  - H2：外掛負責的項目
  - H2：最小後端外掛
  - H2：設定結構
  - H2：進階後端掛鉤
  - H3：ownsNativeCompaction：選擇不使用 OpenClaw 壓縮
  - H2：MCP 工具橋接器
  - H2：使用者設定
  - H2：驗證
  - H2：檢查清單
  - H2：相關內容

## plugins/codex-computer-use.md

- 路由：/plugins/codex-computer-use
- 標題：
  - H2：OpenClaw.app 與 Peekaboo
  - H2：iOS 應用程式
  - H2：直接使用 cua-driver MCP
  - H2：快速設定
  - H2：命令
  - H2：市集選項
  - H2：隨附的 macOS 市集
  - H3：共用外掛快取
  - H2：遠端目錄限制
  - H2：設定參考
  - H2：OpenClaw 檢查的項目
  - H2：macOS 權限
  - H2：疑難排解
  - H2：相關內容

## plugins/codex-harness-reference.md

- 路由：/plugins/codex-harness-reference
- 標題：
  - H2：外掛設定介面
  - H2：監督
  - H2：應用程式伺服器傳輸
  - H2：核准與沙箱模式
  - H2：沙箱化原生執行
  - H2：驗證與環境隔離
  - H2：動態工具
  - H2：逾時
  - H2：模型探索
  - H2：工作區啟動檔案
  - H2：環境覆寫
  - H2：相關內容

## plugins/codex-harness-runtime.md

- 路由：/plugins/codex-harness-runtime
- 標題：
  - H2：概覽
  - H2：執行緒繫結與模型變更
  - H2：監督與安全續行
  - H2：可見回覆與心跳偵測
  - H2：掛鉤邊界
  - H2：V1 支援合約
  - H2：原生權限與 MCP 資訊請求
  - H2：佇列引導
  - H2：Codex 意見回饋上傳
  - H2：壓縮與逐字記錄鏡像
  - H2：媒體與傳遞
  - H2：相關內容

## plugins/codex-harness.md

- 路由：/plugins/codex-harness
- 標題：
  - H2：需求
  - H2：快速入門
  - H2：與 Codex Desktop 和命令列介面共用執行緒
  - H2：監督 Codex 工作階段
  - H2：設定
  - H3：壓縮
  - H2：驗證 Codex 執行階段
  - H2：路由與模型選擇
  - H2：部署模式
  - H3：基本 Codex 部署
  - H3：混合提供者部署
  - H3：失敗時關閉的 Codex 部署
  - H2：應用程式伺服器原則
  - H2：命令與診斷
  - H3：在本機檢查 Codex 執行緒
  - H3：驗證順序
  - H3：環境隔離
  - H3：動態工具與網頁搜尋
  - H3：設定欄位
  - H3：動態工具呼叫逾時
  - H3：本機測試環境覆寫
  - H2：原生 Codex 外掛
  - H2：電腦操作
  - H2：執行階段邊界
  - H2：疑難排解
  - H2：相關內容

## plugins/codex-native-plugins.md

- 路由：/plugins/codex-native-plugins
- 標題：
  - H2：需求
  - H2：快速入門
  - H2：從聊天管理外掛
  - H2：原生外掛設定的運作方式
  - H2：V1 支援邊界
  - H2：應用程式清冊與所有權
  - H2：已連線帳戶的應用程式
  - H2：執行緒應用程式設定
  - H2：破壞性動作原則
  - H2：疑難排解
  - H2：相關內容

## plugins/codex-supervision.md

- 路由：/plugins/codex-supervision
- 標題：
  - H2：開始之前
  - H2：啟用監督
  - H2：使用操作員命令列介面
  - H2：從本機工作階段建立分支
  - H2：封存本機工作階段
  - H2：瞭解已配對節點的限制
  - H2：中繼資料與權限
  - H3：相容性工具
  - H2：疑難排解
  - H2：相關內容

## plugins/community.md

- 路由：/plugins/community
- 標題：
  - H2：尋找外掛
  - H2：發布外掛
  - H2：相關內容

## plugins/compatibility.md

- 路由：/plugins/compatibility
- 標題：
  - H2：相容性登錄檔
  - H2：棄用政策
  - H2：目前的相容性領域
  - H3：WhatsApp 傳入回呼的扁平別名
  - H3：WhatsApp 傳入准入欄位
  - H2：外掛檢查器套件
  - H3：維護者驗收通道
  - H2：版本資訊

## plugins/copilot.md

- 路由：/plugins/copilot
- 標題：
  - H2：需求
  - H2：安裝
  - H2：快速入門
  - H2：支援的供應商
  - H2：BYOK
  - H2：驗證
  - H2：設定介面
  - H2：壓縮
  - H2：逐字稿鏡像
  - H2：旁支問題（/btw）
  - H2：Doctor
  - H2：限制
  - H2：權限與 askuser
  - H3：工作階段層級的 GitHub 權杖
  - H2：相關內容

## plugins/dependency-resolution.md

- 路由：/plugins/dependency-resolution
- 標題：
  - H2：責任劃分
  - H2：安裝根目錄
  - H2：本機外掛
  - H2：啟動與重新載入
  - H2：隨附外掛
  - H2：舊版清理

## plugins/google-meet.md

- 路由：/plugins/google-meet
- 標題：
  - H2：快速開始
  - H3：建立會議
  - H3：以僅觀察模式加入
  - H3：即時工作階段健康狀態
  - H2：本機閘道 + Parallels Chrome
  - H3：常見失敗檢查
  - H2：安裝注意事項
  - H2：傳輸方式
  - H3：Chrome
  - H3：Twilio
  - H2：OAuth 與預檢
  - H3：建立 Google 認證資訊
  - H3：產生重新整理權杖
  - H3：使用 doctor 驗證 OAuth
  - H3：解析、預檢及讀取成品
  - H3：即時冒煙測試
  - H3：建立範例
  - H2：設定
  - H3：預設值
  - H3：選用覆寫
  - H2：工具
  - H2：代理程式與雙向模式
  - H2：即時測試檢查清單
  - H2：疑難排解
  - H3：代理程式看不到 Google Meet 工具
  - H3：沒有已連線且支援 Google Meet 的節點
  - H3：瀏覽器已開啟，但代理程式無法加入
  - H3：建立會議失敗
  - H3：代理程式已加入，但未發言
  - H3：Twilio 設定檢查失敗
  - H3：Twilio 通話已開始，但始終未進入會議
  - H2：注意事項
  - H2：相關內容

## plugins/hooks.md

- 路由：/plugins/hooks
- 標題：
  - H2：快速開始
  - H2：鉤子目錄
  - H3：頻道配對請求
  - H2：偵錯執行階段鉤子
  - H2：工具呼叫政策
  - H3：執行環境鉤子
  - H3：工具結果持久化
  - H2：提示詞與模型鉤子
  - H3：工作階段擴充與下一輪注入
  - H2：訊息鉤子
  - H2：安裝鉤子
  - H2：閘道生命週期
  - H3：安全的外部排程投影
  - H2：即將棄用的項目
  - H2：相關內容

## plugins/install-overrides.md

- 路由：/plugins/install-overrides
- 標題：
  - H2：環境
  - H2：行為
  - H2：套件端對端測試

## plugins/llama-cpp.md

- 路由：/plugins/llama-cpp
- 標題：
  - H2：設定
  - H2：原生執行階段
  - H2：執行階段診斷
  - H2：疑難排解

## plugins/logbook.md

- 路由：/plugins/logbook
- 標題：
  - H2：開始之前
  - H2：快速入門
  - H2：運作方式
  - H2：模型與資料流程
  - H2：設定
  - H3：視覺模型選擇
  - H2：儀表板分頁
  - H2：閘道方法
  - H2：隱私權注意事項
  - H2：疑難排解
  - H3：缺少「日誌」分頁
  - H3：擷取回報錯誤
  - H3：擷取成功，但沒有顯示卡片
  - H2：相關內容

## plugins/manage-plugins.md

- 路由：/plugins/manage-plugins
- 標題：
  - H2：使用控制介面
  - H2：列出及搜尋外掛
  - H2：啟用及停用外掛
  - H2：安裝外掛
  - H2：重新啟動及檢查
  - H2：更新外掛
  - H2：解除安裝外掛
  - H2：選擇來源
  - H2：發布外掛
  - H2：相關內容

## plugins/manifest.md

- 路由：/plugins/manifest
- 標題：
  - H2：此檔案的用途
  - H2：最小範例
  - H2：完整範例
  - H2：頂層欄位參考
  - H2：catalog 參考
  - H2：生成供應商中繼資料參考
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
  - H3：OpenClaw 供應商索引
  - H2：Manifest 與 package.json 的比較
  - H3：影響探索的 package.json 欄位
  - H2：探索優先順序（重複的外掛 ID）
  - H2：JSON Schema 需求
  - H2：驗證行為
  - H2：注意事項
  - H2：相關內容

## plugins/memory-lancedb.md

- 路由：/plugins/memory-lancedb
- 標題：
  - H2：安裝
  - H2：快速開始
  - H2：嵌入設定
  - H3：維度
  - H2：Ollama 嵌入
  - H2：回想與擷取限制
  - H2：命令
  - H2：儲存空間
  - H2：執行階段相依性與平台支援
  - H2：疑難排解
  - H3：輸入長度超過上下文長度
  - H3：不支援的嵌入模型
  - H3：外掛已載入，但沒有顯示任何記憶
  - H2：相關內容

## plugins/memory-wiki.md

- 路由：/plugins/memory-wiki
- 標題：
  - H2：知識庫模式
  - H2：知識庫配置
  - H2：Open Knowledge Format 匯入
  - H2：結構化主張與證據
  - H2：面向代理程式的實體中繼資料
  - H2：編譯管線
  - H2：儀表板與健康狀態報告
  - H2：搜尋與擷取
  - H2：代理程式工具
  - H2：提示詞與上下文行為
  - H2：設定
  - H3：每個代理程式的知識庫
  - H3：範例：QMD + 橋接模式
  - H2：命令列介面
  - H2：Obsidian 支援
  - H2：建議工作流程
  - H2：相關文件

## plugins/message-presentation.md

- 路由：/plugins/message-presentation
- 標題：
  - H2：契約
  - H2：產生端範例
  - H2：轉譯器契約
  - H2：核心轉譯流程
  - H2：降級規則
  - H3：按鈕值備援的可見性
  - H2：供應商對應
  - H2：Presentation 與 InteractiveReply 的比較
  - H2：傳遞固定
  - H2：外掛作者檢查清單
  - H2：相關文件

## plugins/oc-path.md

- 路由：/plugins/oc-path
- 標題：
  - H2：啟用原因
  - H2：執行位置
  - H2：啟用
  - H2：相依性
  - H2：提供的功能
  - H2：與其他外掛的關係
  - H2：安全性
  - H2：相關內容

## plugins/onepassword.md

- 路由：/plugins/onepassword
- 標題：
  - H1：1Password 密鑰代理程式
  - H2：安全性模型
  - H2：開始之前
  - H2：設定已登錄的密鑰
  - H2：使用代理程式工具
  - H2：政策層級與核准
  - H2：檢查狀態與稽核歷程
  - H2：1Password 命令列介面行為

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
  - H2：相關內容

## plugins/reference.md

- 路由：/plugins/reference
- 標題：
  - H1：外掛參考

## plugins/reference/acpx.md

- 路由：/plugins/reference/acpx
- 標題：
  - H1：ACPx 外掛
  - H2：發行方式
  - H2：介面
  - H2：Pi 原生工作階段
  - H2：相關文件

## plugins/reference/admin-http-rpc.md

- 路由：/plugins/reference/admin-http-rpc
- 標題：
  - H1：Admin Http Rpc 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/alibaba.md

- 路由：/plugins/reference/alibaba
- 標題：
  - H1：Alibaba 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/amazon-bedrock-mantle.md

- 路由：/plugins/reference/amazon-bedrock-mantle
- 標題：
  - H1：Amazon Bedrock Mantle 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/amazon-bedrock.md

- 路由：/plugins/reference/amazon-bedrock
- 標題：
  - H1：Amazon Bedrock 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/anthropic-vertex.md

- 路由：/plugins/reference/anthropic-vertex
- 標題：
  - H1：Anthropic Vertex 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：Claude Fable 5
  - H2：Claude Sonnet 5

## plugins/reference/anthropic.md

- 路由：/plugins/reference/anthropic
- 標題：
  - H1：Anthropic 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/arcee.md

- 路由：/plugins/reference/arcee
- 標題：
  - H1：Arcee 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/azure-speech.md

- 路由：/plugins/reference/azure-speech
- 標題：
  - H1：Azure Speech 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/bonjour.md

- 路由：/plugins/reference/bonjour
- 標題：
  - H1：Bonjour 外掛
  - H2：發行方式
  - H2：功能介面

## plugins/reference/brave.md

- 路由：/plugins/reference/brave
- 標題：
  - H1：Brave 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/browser.md

- 路由：/plugins/reference/browser
- 標題：
  - H1：瀏覽器外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/byteplus.md

- 路由：/plugins/reference/byteplus
- 標題：
  - H1：BytePlus 外掛
  - H2：發行方式
  - H2：功能介面

## plugins/reference/canvas.md

- 路由：/plugins/reference/canvas
- 標題：
  - H1：Canvas 外掛
  - H2：發行方式
  - H2：功能介面

## plugins/reference/cerebras.md

- 路由：/plugins/reference/cerebras
- 標題：
  - H1：Cerebras 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/chutes.md

- 路由：/plugins/reference/chutes
- 標題：
  - H1：Chutes 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/clawrouter.md

- 路由：/plugins/reference/clawrouter
- 標題：
  - H1：ClawRouter 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/clickclack.md

- 路由：/plugins/reference/clickclack
- 標題：
  - H1：ClickClack 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/cloudflare-ai-gateway.md

- 路由：/plugins/reference/cloudflare-ai-gateway
- 標題：
  - H1：Cloudflare AI 閘道外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/codex.md

- 路由：/plugins/reference/codex
- 標題：
  - H1：Codex 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/cohere.md

- 路由：/plugins/reference/cohere
- 標題：
  - H1：Cohere 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/comfy.md

- 路由：/plugins/reference/comfy
- 標題：
  - H1：ComfyUI 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/copilot-proxy.md

- 路由：/plugins/reference/copilot-proxy
- 標題：
  - H1：Copilot Proxy 外掛
  - H2：發行方式
  - H2：功能介面

## plugins/reference/copilot.md

- 路由：/plugins/reference/copilot
- 標題：
  - H1：Copilot 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/crabbox.md

- 路由：/plugins/reference/crabbox
- 標題：
  - H1：Crabbox 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：設定

## plugins/reference/deepgram.md

- 路由：/plugins/reference/deepgram
- 標題：
  - H1：Deepgram 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/deepinfra.md

- 路由：/plugins/reference/deepinfra
- 標題：
  - H1：DeepInfra 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/deepseek.md

- 路由：/plugins/reference/deepseek
- 標題：
  - H1：DeepSeek 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/diagnostics-otel.md

- 路由：/plugins/reference/diagnostics-otel
- 標題：
  - H1：OpenTelemetry 診斷外掛
  - H2：發行方式
  - H2：功能介面

## plugins/reference/diagnostics-prometheus.md

- 路由：/plugins/reference/diagnostics-prometheus
- 標題：
  - H1：Prometheus 診斷外掛
  - H2：發行方式
  - H2：功能介面

## plugins/reference/diffs-language-pack.md

- 路由：/plugins/reference/diffs-language-pack
- 標題：
  - H1：Diffs 語言套件外掛
  - H2：發行方式
  - H2：功能介面
  - H2：新增的語言

## plugins/reference/diffs.md

- 路由：/plugins/reference/diffs
- 標題：
  - H1：Diffs 外掛
  - H2：發行方式
  - H2：功能介面

## plugins/reference/discord.md

- 路由：/plugins/reference/discord
- 標題：
  - H1：Discord 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/document-extract.md

- 路由：/plugins/reference/document-extract
- 標題：
  - H1：文件擷取外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/duckduckgo.md

- 路由：/plugins/reference/duckduckgo
- 標題：
  - H1：DuckDuckGo 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/elevenlabs.md

- 路由：/plugins/reference/elevenlabs
- 標題：
  - H1：Elevenlabs 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/exa.md

- 路由：/plugins/reference/exa
- 標題：
  - H1：Exa 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/fal.md

- 路由：/plugins/reference/fal
- 標題：
  - H1：fal 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/featherless.md

- 路由：/plugins/reference/featherless
- 標題：
  - H1：Featherless 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/feishu.md

- 路由：/plugins/reference/feishu
- 標題：
  - H1：Feishu 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/file-transfer.md

- 路由：/plugins/reference/file-transfer
- 標題：
  - H1：檔案傳輸外掛
  - H2：發行方式
  - H2：功能介面

## plugins/reference/firecrawl.md

- 路由：/plugins/reference/firecrawl
- 標題：
  - H1：Firecrawl 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/fireworks.md

- 路由：/plugins/reference/fireworks
- 標題：
  - H1：Fireworks 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/github-copilot.md

- 路由：/plugins/reference/github-copilot
- 標題：
  - H1：GitHub Copilot 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/gmi.md

- 路由：/plugins/reference/gmi
- 標題：
  - H1：Gmi 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/google-meet.md

- 路由：/plugins/reference/google-meet
- 標題：
  - H1：Google Meet 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/google.md

- 路由：/plugins/reference/google
- 標題：
  - H1：Google 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/googlechat.md

- 路由：/plugins/reference/googlechat
- 標題：
  - H1：Google Chat 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/gradium.md

- 路由：/plugins/reference/gradium
- 標題：
  - H1：Gradium 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/groq.md

- 路由：/plugins/reference/groq
- 標題：
  - H1：Groq 外掛
  - H2：發行方式
  - H2：功能介面
  - H2：相關文件

## plugins/reference/huggingface.md

- 路由：/plugins/reference/huggingface
- 標題：
  - H1：Hugging Face 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/imessage.md

- 路由：/plugins/reference/imessage
- 標題：
  - H1：iMessage 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/inworld.md

- 路由：/plugins/reference/inworld
- 標題：
  - H1：Inworld 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/irc.md

- 路由：/plugins/reference/irc
- 標題：
  - H1：IRC 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/kilocode.md

- 路由：/plugins/reference/kilocode
- 標題：
  - H1：Kilocode 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/kimi.md

- 路由：/plugins/reference/kimi
- 標題：
  - H1：Kimi 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/line.md

- 路由：/plugins/reference/line
- 標題：
  - H1：LINE 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/linux-node.md

- 路由：/plugins/reference/linux-node
- 標題：
  - H1：Linux 節點外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/litellm.md

- 路由：/plugins/reference/litellm
- 標題：
  - H1：LiteLLM 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/llama-cpp.md

- 路由：/plugins/reference/llama-cpp
- 標題：
  - H1：Llama Cpp 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/llm-task.md

- 路由：/plugins/reference/llm-task
- 標題：
  - H1：LLM 任務外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/lmstudio.md

- 路由：/plugins/reference/lmstudio
- 標題：
  - H1：LM Studio 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/lobster.md

- 路由：/plugins/reference/lobster
- 標題：
  - H1：Lobster 外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/logbook.md

- 路由：/plugins/reference/logbook
- 標題：
  - H1：日誌簿外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/longcat.md

- 路由：/plugins/reference/longcat
- 標題：
  - H1：LongCat 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/matrix.md

- 路由：/plugins/reference/matrix
- 標題：
  - H1：Matrix 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/mattermost.md

- 路由：/plugins/reference/mattermost
- 標題：
  - H1：Mattermost 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/memory-core.md

- 路由：/plugins/reference/memory-core
- 標題：
  - H1：記憶核心外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/memory-lancedb.md

- 路由：/plugins/reference/memory-lancedb
- 標題：
  - H1：Memory Lancedb 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/memory-wiki.md

- 路由：/plugins/reference/memory-wiki
- 標題：
  - H1：記憶 Wiki 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/meta.md

- 路由：/plugins/reference/meta
- 標題：
  - H1：Meta 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/microsoft-foundry.md

- 路由：/plugins/reference/microsoft-foundry
- 標題：
  - H1：Microsoft Foundry 外掛
  - H2：發行方式
  - H2：介面
  - H2：需求
  - H2：聊天模型
  - H2：MAI 圖像生成
  - H2：疑難排解

## plugins/reference/microsoft.md

- 路由：/plugins/reference/microsoft
- 標題：
  - H1：Microsoft 外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/migrate-claude.md

- 路由：/plugins/reference/migrate-claude
- 標題：
  - H1：遷移 Claude 外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/migrate-hermes.md

- 路由：/plugins/reference/migrate-hermes
- 標題：
  - H1：遷移 Hermes 外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/minimax.md

- 路由：/plugins/reference/minimax
- 標題：
  - H1：MiniMax 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/mistral.md

- 路由：/plugins/reference/mistral
- 標題：
  - H1：Mistral 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/moonshot.md

- 路由：/plugins/reference/moonshot
- 標題：
  - H1：Moonshot 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/msteams.md

- 路由：/plugins/reference/msteams
- 標題：
  - H1：Microsoft Teams 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/mxc.md

- 路由：/plugins/reference/mxc
- 標題：
  - H1：Mxc 外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/nextcloud-talk.md

- 路由：/plugins/reference/nextcloud-talk
- 標題：
  - H1：Nextcloud Talk 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/nostr.md

- 路由：/plugins/reference/nostr
- 標題：
  - H1：Nostr 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/novita.md

- 路由：/plugins/reference/novita
- 標題：
  - H1：Novita 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/nvidia.md

- 路由：/plugins/reference/nvidia
- 標題：
  - H1：NVIDIA 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/oc-path.md

- 路由：/plugins/reference/oc-path
- 標題：
  - H1：Oc Path 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/ollama.md

- 路由：/plugins/reference/ollama
- 標題：
  - H1：Ollama 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/onepassword.md

- 路由：/plugins/reference/onepassword
- 標題：
  - H1：Onepassword 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/open-prose.md

- 路由：/plugins/reference/open-prose
- 標題：
  - H1：Open Prose 外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/openai.md

- 路由：/plugins/reference/openai
- 標題：
  - H1：OpenAI 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/opencode-go.md

- 路由：/plugins/reference/opencode-go
- 標題：
  - H1：OpenCode Go 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/opencode.md

- 路由：/plugins/reference/opencode
- 標題：
  - H1：OpenCode 外掛
  - H2：發行方式
  - H2：介面
  - H2：原生工作階段
  - H2：相關文件

## plugins/reference/openrouter.md

- 路由：/plugins/reference/openrouter
- 標題：
  - H1：OpenRouter 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/openshell.md

- 路由：/plugins/reference/openshell
- 標題：
  - H1：Openshell 外掛
  - H2：發行方式
  - H2：介面

## plugins/reference/perplexity.md

- 路由：/plugins/reference/perplexity
- 標題：
  - H1：Perplexity 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/pixverse.md

- 路由：/plugins/reference/pixverse
- 標題：
  - H1：PixVerse 外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/policy.md

- 路由：/plugins/reference/policy
- 標題：
  - H1：原則外掛
  - H2：發行方式
  - H2：介面
  - H2：行為
  - H2：相關文件

## plugins/reference/qa-channel.md

- 路由：/plugins/reference/qa-channel
- 標題：
  - H1：QA 頻道外掛
  - H2：發行方式
  - H2：介面
  - H2：相關文件

## plugins/reference/qa-lab.md

- 路由：/plugins/reference/qa-lab
- 標題：
  - H1：QA Lab 外掛
  - H2：發佈
  - H2：介面

## plugins/reference/qa-matrix.md

- 路由：/plugins/reference/qa-matrix
- 標題：
  - H1：QA Matrix 外掛
  - H2：發佈
  - H2：介面

## plugins/reference/qianfan.md

- 路由：/plugins/reference/qianfan
- 標題：
  - H1：Qianfan 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/qqbot.md

- 路由：/plugins/reference/qqbot
- 標題：
  - H1：QQ Bot 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/qwen.md

- 路由：/plugins/reference/qwen
- 標題：
  - H1：Qwen 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/raft.md

- 路由：/plugins/reference/raft
- 標題：
  - H1：Raft 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/reef.md

- 路由：/plugins/reference/reef
- 標題：
  - H1：Reef 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/runway.md

- 路由：/plugins/reference/runway
- 標題：
  - H1：Runway 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/searxng.md

- 路由：/plugins/reference/searxng
- 標題：
  - H1：SearXNG 外掛
  - H2：發佈
  - H2：介面

## plugins/reference/senseaudio.md

- 路由：/plugins/reference/senseaudio
- 標題：
  - H1：Senseaudio 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/sglang.md

- 路由：/plugins/reference/sglang
- 標題：
  - H1：SGLang 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/signal.md

- 路由：/plugins/reference/signal
- 標題：
  - H1：Signal 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/slack.md

- 路由：/plugins/reference/slack
- 標題：
  - H1：Slack 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/sms.md

- 路由：/plugins/reference/sms
- 標題：
  - H1：SMS 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/stepfun.md

- 路由：/plugins/reference/stepfun
- 標題：
  - H1：StepFun 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/synology-chat.md

- 路由：/plugins/reference/synology-chat
- 標題：
  - H1：Synology Chat 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/synthetic.md

- 路由：/plugins/reference/synthetic
- 標題：
  - H1：Synthetic 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/tavily.md

- 路由：/plugins/reference/tavily
- 標題：
  - H1：Tavily 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/telegram.md

- 路由：/plugins/reference/telegram
- 標題：
  - H1：Telegram 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/tencent.md

- 路由：/plugins/reference/tencent
- 標題：
  - H1：Tencent 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/tlon.md

- 路由：/plugins/reference/tlon
- 標題：
  - H1：Tlon 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/together.md

- 路由：/plugins/reference/together
- 標題：
  - H1：Together 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/tokenjuice.md

- 路由：/plugins/reference/tokenjuice
- 標題：
  - H1：Tokenjuice 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/tts-local-cli.md

- 路由：/plugins/reference/tts-local-cli
- 標題：
  - H1：TTS 本機命令列介面外掛
  - H2：發佈
  - H2：介面

## plugins/reference/twitch.md

- 路由：/plugins/reference/twitch
- 標題：
  - H1：Twitch 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/vault.md

- 路由：/plugins/reference/vault
- 標題：
  - H1：Vault 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/venice.md

- 路由：/plugins/reference/venice
- 標題：
  - H1：Venice 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/vercel-ai-gateway.md

- 路由：/plugins/reference/vercel-ai-gateway
- 標題：
  - H1：Vercel AI 閘道外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/vllm.md

- 路由：/plugins/reference/vllm
- 標題：
  - H1：vLLM 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/voice-call.md

- 路由：/plugins/reference/voice-call
- 標題：
  - H1：語音通話外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/volcengine.md

- 路由：/plugins/reference/volcengine
- 標題：
  - H1：Volcengine 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/voyage.md

- 路由：/plugins/reference/voyage
- 標題：
  - H1：Voyage 外掛
  - H2：發佈
  - H2：介面

## plugins/reference/vydra.md

- 路由：/plugins/reference/vydra
- 標題：
  - H1：Vydra 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/web-readability.md

- 路由：/plugins/reference/web-readability
- 標題：
  - H1：網頁可讀性外掛
  - H2：發佈
  - H2：介面

## plugins/reference/webhooks.md

- 路由：/plugins/reference/webhooks
- 標題：
  - H1：網路鉤子外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/whatsapp.md

- 路由：/plugins/reference/whatsapp
- 標題：
  - H1：WhatsApp 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/workboard.md

- 路由：/plugins/reference/workboard
- 標題：
  - H1：Workboard 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/workspaces.md

- 路由：/plugins/reference/workspaces
- 標題：
  - H1：工作區外掛
  - H2：發佈
  - H2：介面

## plugins/reference/xai.md

- 路由：/plugins/reference/xai
- 標題：
  - H1：xAI 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/xiaomi.md

- 路由：/plugins/reference/xiaomi
- 標題：
  - H1：Xiaomi 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/zai.md

- 路由：/plugins/reference/zai
- 標題：
  - H1：Z.AI 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/zalo.md

- 路由：/plugins/reference/zalo
- 標題：
  - H1：Zalo 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/reference/zalouser.md

- 路由：/plugins/reference/zalouser
- 標題：
  - H1：Zalo Personal 外掛
  - H2：發佈
  - H2：介面
  - H2：相關文件

## plugins/sdk-agent-harness.md

- 路由：/plugins/sdk-agent-harness
- 標題：
  - H2：何時使用執行框架
  - H2：核心仍負責的項目
  - H3：由執行框架負責的驗證啟動程序
  - H3：已驗證的設定執行階段成品
  - H3：請求傳輸合約
  - H2：註冊執行框架
  - H3：委派執行
  - H2：選擇策略
  - H2：提供者與執行框架配對
  - H3：工具結果中介軟體
  - H3：終止結果分類
  - H3：代理程式結束時的副作用
  - H3：使用者輸入與工具介面
  - H3：原生 Codex 執行框架模式
  - H2：執行階段嚴格性
  - H2：原生工作階段與逐字稿鏡像
  - H2：工具與媒體結果
  - H2：目前限制
  - H2：相關內容

## plugins/sdk-channel-inbound.md

- 路由：/plugins/sdk-channel-inbound
- 標題：
  - H2：核心輔助函式
  - H2：遷移

## plugins/sdk-channel-ingress.md

- 路由：/plugins/sdk-channel-ingress
- 標題：
  - H2：執行階段解析器
  - H2：結果
  - H2：存取群組
  - H2：事件模式
  - H2：路由與啟用
  - H2：遮蔽
  - H2：驗證

## plugins/sdk-channel-message.md

- 路由：/plugins/sdk-channel-message
- 標題：無

## plugins/sdk-channel-outbound.md

- 路由：/plugins/sdk-channel-outbound
- 標題：
  - H2：轉接器
  - H2：純文字清理
  - H2：傳遞證據
  - H2：現有的出站轉接器
  - H2：持久化傳送
  - H2：延後傳遞准入
  - H2：相容性分派

## plugins/sdk-channel-plugins.md

- 路由：/plugins/sdk-channel-plugins
- 標題：
  - H2：你的外掛負責的內容
  - H2：訊息轉接器
  - H3：入站接收（實驗性）
  - H3：輸入中指示器
  - H3：媒體來源參數
  - H3：原生承載資料塑形
  - H3：工作階段對話語法
  - H3：帳號範圍的對話繫結支援
  - H2：核准與頻道功能
  - H3：核准授權
  - H3：承載資料生命週期與設定指引
  - H3：原生核准傳遞
  - H3：較窄範圍的核准執行階段子路徑
  - H3：設定子路徑
  - H3：其他較窄範圍的頻道子路徑
  - H2：入站提及政策
  - H2：逐步解說
  - H2：檔案結構
  - H2：進階主題
  - H2：後續步驟
  - H2：相關內容

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
  - H2：外掛結構
  - H2：相關內容

## plugins/sdk-migration.md

- 路由：/plugins/sdk-migration
- 標題：
  - H2：變更內容
  - H3：原因
  - H2：相容性政策
  - H2：如何遷移
  - H2：匯入路徑參考
  - H2：目前的棄用項目
  - H2：通話與即時語音遷移
  - H2：移除時程
  - H2：暫時隱藏警告
  - H2：相關內容

## plugins/sdk-overview.md

- 路由：/plugins/sdk-overview
- 標題：
  - H2：匯入慣例
  - H2：子路徑參考
  - H2：註冊 API
  - H3：功能註冊
  - H3：工具與命令
  - H3：基礎架構
  - H4：限定請求者範圍的 MCP 連線
  - H3：工作流程外掛的主機掛鉤
  - H3：閘道探索註冊
  - H3：命令列介面註冊中繼資料
  - H3：命令列介面後端註冊
  - H3：互斥插槽
  - H3：已棄用的記憶嵌入轉接器
  - H3：事件與生命週期
  - H3：掛鉤決策語意
  - H3：API 物件欄位
  - H2：內部模組慣例
  - H2：相關內容

## plugins/sdk-provider-plugins.md

- 路由：/plugins/sdk-provider-plugins
- 標題：
  - H2：逐步解說
  - H2：發布至 ClawHub
  - H2：檔案結構
  - H2：目錄順序參考
  - H2：後續步驟
  - H2：相關內容

## plugins/sdk-runtime.md

- 路由：/plugins/sdk-runtime
- 標題：
  - H2：設定載入與寫入
  - H2：可重複使用的執行階段公用工具
  - H2：執行階段命名空間
  - H2：儲存執行階段參照
  - H2：其他頂層 API 欄位
  - H2：相關內容

## plugins/sdk-setup.md

- 路由：/plugins/sdk-setup
- 標題：
  - H2：套件中繼資料
  - H3：openclaw 欄位
  - H3：openclaw.channel
  - H3：openclaw.install
  - H3：延後完整載入
  - H2：外掛資訊清單
  - H2：發布至 ClawHub
  - H2：設定進入點
  - H3：窄範圍設定輔助工具匯入
  - H3：頻道負責的單一帳號提升
  - H2：設定結構描述
  - H3：建立頻道設定結構描述
  - H2：設定精靈
  - H2：發布與安裝
  - H2：相關內容

## plugins/sdk-subpaths.md

- 路由：/plugins/sdk-subpaths
- 標題：
  - H2：外掛進入點
  - H3：已棄用的相容性與測試輔助工具
  - H3：保留給內附外掛輔助工具的子路徑
  - H2：相關內容

## plugins/sdk-testing.md

- 路由：/plugins/sdk-testing
- 標題：
  - H2：測試公用工具
  - H3：可用的匯出項目
  - H3：型別
  - H2：測試目標解析
  - H2：測試模式
  - H3：測試註冊契約
  - H3：測試執行階段設定存取
  - H3：對頻道外掛進行單元測試
  - H3：對供應商外掛進行單元測試
  - H3：模擬外掛執行階段
  - H3：使用個別執行個體存根進行測試
  - H2：契約測試（儲存庫內外掛）
  - H3：執行限定範圍的測試
  - H2：程式碼檢查強制規則（儲存庫內外掛）
  - H2：測試設定
  - H2：相關內容

## plugins/tool-plugins.md

- 路由：/plugins/tool-plugins
- 標題：
  - H2：需求
  - H2：快速入門
  - H2：撰寫工具
  - H2：選用工具與工廠工具
  - H2：傳回值
  - H2：設定
  - H2：產生的中繼資料
  - H2：套件中繼資料
  - H2：在 CI 中驗證
  - H2：在本機安裝與檢查
  - H2：發布
  - H2：疑難排解
  - H3：找不到外掛進入點：./dist/index.js
  - H3：外掛進入點未公開 defineToolPlugin 中繼資料
  - H3：openclaw.plugin.json 產生的中繼資料已過期
  - H3：package.json 的 openclaw.extensions 必須包含 ./dist/index.js
  - H3：找不到套件 'typebox'
  - H3：安裝後未顯示工具
  - H2：另請參閱

## plugins/vault.md

- 路由：/plugins/vault
- 標題：
  - H1：Vault SecretRefs
  - H2：開始之前
  - H2：在 Vault 中儲存供應商金鑰
  - H2：讓閘道能夠存取 Vault
  - H2：產生並套用 SecretRef 計畫
  - H2：設定更多供應商金鑰
  - H2：SecretRef ID 格式
  - H2：OpenClaw 儲存的內容
  - H2：容器與受管理的部署
  - H2：相關內容

## plugins/voice-call.md

- 路由：/plugins/voice-call
- 標題：
  - H2：快速開始
  - H2：設定
  - H3：設定參考
  - H2：工作階段範圍
  - H2：即時語音對話
  - H3：工具政策
  - H3：代理程式語音脈絡
  - H3：即時供應商範例
  - H2：串流轉錄
  - H3：串流供應商範例
  - H2：通話用 TTS
  - H3：TTS 範例
  - H2：來電
  - H3：依號碼路由
  - H3：語音輸出契約
  - H3：對話啟動行為
  - H3：Twilio 串流中斷連線寬限期
  - H2：過期通話清理器
  - H2：網路鉤子安全性
  - H2：命令列介面
  - H2：代理程式工具
  - H2：閘道 RPC
  - H2：疑難排解
  - H3：設定無法公開網路鉤子
  - H3：供應商認證資訊失敗
  - H3：通話已開始，但未收到供應商網路鉤子
  - H3：簽章驗證失敗
  - H3：Google Meet Twilio 加入失敗
  - H3：即時通話沒有語音
  - H2：相關內容

## plugins/webhooks.md

- 路由：/plugins/webhooks
- 標題：
  - H2：設定路由
  - H2：安全性模型
  - H2：請求格式
  - H2：支援的動作
  - H3：createflow
  - H3：runtask
  - H2：回應結構
  - H2：相關內容

## plugins/workboard.md

- 路由：/plugins/workboard
- 標題：
  - H2：啟用
  - H2：設定
  - H2：卡片欄位
  - H2：從卡片開始工作
  - H2：代理程式工具
  - H2：分派
  - H3：工作程式選擇
  - H3：進入點
  - H2：命令列介面與斜線命令
  - H2：工作階段生命週期同步
  - H2：儀表板工作流程
  - H2：診斷
  - H2：權限
  - H2：儲存空間
  - H2：疑難排解
  - H2：相關內容

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
  - H2：代理程式工具
  - H2：相關內容

## prose.md

- 路由：/prose
- 標題：
  - H2：安裝
  - H2：斜線命令
  - H2：可執行的工作
  - H2：範例：平行研究與綜整
  - H2：OpenClaw 執行階段對應
  - H2：檔案位置
  - H2：狀態後端
  - H2：安全性
  - H2：相關內容

## providers/alibaba.md

- 路由：/providers/alibaba
- 標題：
  - H2：開始使用
  - H2：內建 Wan 模型
  - H2：功能與限制
  - H2：進階設定
  - H2：相關內容

## providers/anthropic.md

- 路由：/providers/anthropic
- 標題：
  - H2：用量與成本追蹤
  - H2：開始使用
  - H2：跨電腦使用 Claude 工作階段
  - H2：思考預設值（Claude Sonnet 5、Mythos 5、Fable 5、4.8 與 4.6）
  - H2：安全拒絕後備機制（Claude Fable 5）
  - H3：此機制存在的原因
  - H3：運作方式
  - H3：可觀測性與計費
  - H3：範圍
  - H2：提示快取
  - H2：進階設定
  - H2：疑難排解
  - H2：相關內容

## providers/arcee.md

- 路由：/providers/arcee
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：非互動式設定
  - H2：內建目錄
  - H2：支援的功能
  - H2：相關內容

## providers/azure-speech.md

- 路由：/providers/azure-speech
- 標題：
  - H2：開始使用
  - H2：設定選項
  - H2：注意事項
  - H2：相關內容

## providers/bedrock-mantle.md

- 路由：/providers/bedrock-mantle
- 標題：
  - H2：開始使用
  - H2：自動探索模型
  - H3：支援的區域
  - H2：手動設定
  - H2：進階設定
  - H2：相關內容

## providers/bedrock.md

- 路由：/providers/bedrock
- 標題：
  - H2：開始使用
  - H2：自動探索模型
  - H2：快速設定（AWS 路徑）
  - H2：進階設定
  - H2：相關內容

## providers/cerebras.md

- 路由：/providers/cerebras
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：非互動式設定
  - H2：內建目錄
  - H2：手動設定
  - H2：相關內容

## providers/chutes.md

- 路由：/providers/chutes
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：探索行為
  - H2：預設別名
  - H2：內建入門目錄
  - H2：設定範例
  - H2：相關內容

## providers/claude-max-api-proxy.md

- 路由：/providers/claude-max-api-proxy
- 標題：
  - H2：使用此功能的原因
  - H2：運作方式
  - H2：開始使用
  - H2：進階設定
  - H2：注意事項
  - H2：相關內容

## providers/clawrouter.md

- 路由：/providers/clawrouter
- 標題：
  - H2：開始使用
  - H2：受管理的非互動式部署
  - H2：就緒狀態與即時驗證
  - H2：模型探索
  - H2：通訊協定與提供者外掛
  - H2：配額與用量
  - H2：疑難排解
  - H2：安全性行為
  - H2：相關內容

## providers/cloudflare-ai-gateway.md

- 路由：/providers/cloudflare-ai-gateway
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：非互動式範例
  - H2：進階設定
  - H2：相關內容

## providers/cohere.md

- 路由：/providers/cohere
- 標題：
  - H2：內建目錄
  - H2：開始使用
  - H2：僅使用環境變數設定
  - H2：相關內容

## providers/comfy.md

- 路由：/providers/comfy
- 標題：
  - H2：支援的功能
  - H2：開始使用
  - H2：設定
  - H3：共用金鑰
  - H3：各功能專屬金鑰
  - H2：工作流程詳細資訊
  - H2：相關內容

## providers/deepgram.md

- 路由：/providers/deepgram
- 標題：
  - H2：開始使用
  - H2：設定選項
  - H2：語音通話串流語音轉文字
  - H2：注意事項
  - H2：相關內容

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
  - H2：相關內容

## providers/deepseek.md

- 路由：/providers/deepseek
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：內建目錄
  - H2：思考與工具
  - H2：即時測試
  - H2：設定範例
  - H2：相關內容

## providers/ds4.md

- 路由：/providers/ds4
- 標題：
  - H2：需求
  - H2：快速入門
  - H2：完整設定
  - H2：隨需啟動
  - H2：最大思考
  - H2：測試
  - H2：疑難排解
  - H2：相關內容

## providers/elevenlabs.md

- 路由：/providers/elevenlabs
- 標題：
  - H2：驗證
  - H2：文字轉語音
  - H2：語音轉文字
  - H2：串流語音轉文字
  - H2：相關內容

## providers/fal.md

- 路由：/providers/fal
- 標題：
  - H2：開始使用
  - H2：圖片生成
  - H2：影片生成
  - H2：音樂生成
  - H2：相關內容

## providers/featherless.md

- 路由：/providers/featherless
- 標題：
  - H2：設定
  - H2：預設模型
  - H2：其他 Featherless 模型
  - H2：疑難排解
  - H2：相關內容

## providers/fireworks.md

- 路由：/providers/fireworks
- 標題：
  - H2：開始使用
  - H2：非互動式設定
  - H2：內建目錄
  - H2：自訂 Fireworks 模型 ID
  - H2：相關內容

## providers/github-copilot.md

- 路由：/providers/github-copilot
- 標題：
  - H2：在 OpenClaw 中使用 Copilot 的三種方式
  - H2：GitHub Enterprise（資料駐留）
  - H2：選用旗標
  - H2：非互動式導入
  - H2：記憶搜尋嵌入
  - H3：設定
  - H3：運作方式
  - H2：相關內容

## providers/gmi.md

- 路由：/providers/gmi
- 標題：
  - H2：設定
  - H2：何時選擇 GMI
  - H2：模型
  - H2：疑難排解
  - H2：相關內容

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
  - H2：相關內容

## providers/gradium.md

- 路由：/providers/gradium
- 標題：
  - H2：安裝外掛
  - H2：設定
  - H2：設定
  - H2：語音
  - H3：各訊息語音覆寫
  - H2：輸出
  - H2：自動選取順序
  - H2：相關內容

## providers/groq.md

- 路由：/providers/groq
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H3：設定檔範例
  - H2：內建目錄
  - H2：推理模型
  - H2：音訊轉錄
  - H2：相關內容

## providers/huggingface.md

- 路由：/providers/huggingface
- 標題：
  - H2：開始使用
  - H3：非互動式設定
  - H2：模型 ID
  - H2：進階設定
  - H2：相關內容

## providers/index.md

- 路由：/providers
- 標題：
  - H2：快速開始
  - H2：提供者文件
  - H2：共用概覽頁面
  - H2：轉錄提供者
  - H2：社群工具

## providers/inferrs.md

- 路由：/providers/inferrs
- 標題：
  - H2：開始使用
  - H2：完整設定範例
  - H2：隨需啟動
  - H2：進階設定
  - H2：疑難排解
  - H2：相關內容

## providers/inworld.md

- 路由：/providers/inworld
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：設定選項
  - H2：注意事項
  - H2：相關內容

## providers/kilocode.md

- 路由：/providers/kilocode
- 標題：
  - H2：安裝外掛
  - H2：設定
  - H2：預設模型與目錄
  - H2：設定範例
  - H2：行為注意事項
  - H2：相關內容

## providers/litellm.md

- 路由：/providers/litellm
- 標題：
  - H2：快速開始
  - H2：設定
  - H2：圖片生成
  - H2：進階
  - H2：相關內容

## providers/lmstudio.md

- 路由：/providers/lmstudio
- 標題：
  - H2：快速開始
  - H2：非互動式導入
  - H2：設定
  - H3：串流用量相容性
  - H3：思考相容性
  - H3：明確設定
  - H3：停用預先載入
  - H3：區域網路或 tailnet 主機
  - H2：疑難排解
  - H3：未偵測到 LM Studio
  - H3：驗證錯誤（HTTP 401）
  - H2：相關內容

## providers/longcat.md

- 路由：/providers/longcat
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H3：非互動式設定
  - H2：推理行為
  - H2：定價
  - H2：自行託管的 LongCat-2.0
  - H2：疑難排解
  - H2：相關內容

## providers/meta.md

- 路由：/providers/meta
- 標題：
  - H2：開始使用
  - H2：非互動式設定
  - H2：內建目錄
  - H2：手動設定
  - H2：冒煙測試
  - H2：相關內容

## providers/minimax.md

- 路由：/providers/minimax
- 標題：
  - H2：內建目錄
  - H2：開始使用
  - H2：透過 openclaw configure 設定
  - H2：功能
  - H3：圖片生成
  - H3：文字轉語音
  - H3：音樂生成
  - H3：影片生成
  - H3：圖片理解
  - H3：網頁搜尋
  - H2：進階設定
  - H2：注意事項
  - H2：疑難排解
  - H2：相關內容

## providers/mistral.md

- 路由：/providers/mistral
- 標題：
  - H2：開始使用
  - H2：內建 LLM 目錄
  - H2：音訊轉錄（Voxtral）
  - H2：語音通話串流語音轉文字
  - H2：進階設定
  - H2：相關內容

## providers/models.md

- 路由：/providers/models
- 標題：
  - H2：快速開始（兩個步驟）
  - H2：支援的提供者（入門組合）
  - H2：其他提供者變體
  - H2：相關內容

## providers/moonshot.md

- 路由：/providers/moonshot
- 標題：
  - H2：內建模型目錄
  - H2：開始使用
  - H2：Kimi 網頁搜尋
  - H2：進階設定
  - H2：相關內容

## providers/novita.md

- 路由：/providers/novita
- 標題：
  - H2：設定
  - H2：預設值
  - H2：隨附模型目錄
  - H2：何時選擇 Novita
  - H2：疑難排解
  - H2：相關內容

## providers/nvidia.md

- 路由：/providers/nvidia
- 標題：
  - H2：開始使用
  - H2：設定範例
  - H2：精選目錄
  - H2：Nemotron 3 Ultra
  - H2：隨附的備援目錄
  - H2：進階設定
  - H2：相關內容

## providers/ollama-cloud.md

- 路由：/providers/ollama-cloud
- 標題：
  - H2：設定
  - H2：預設值
  - H2：何時選擇 Ollama Cloud
  - H2：模型
  - H2：即時測試
  - H2：疑難排解
  - H2：相關內容

## providers/ollama.md

- 路由：/providers/ollama
- 標題：
  - H2：驗證規則
  - H2：開始使用
  - H2：透過本機主機使用雲端模型
  - H2：模型探索（隱含提供者）
  - H3：冒煙測試
  - H2：節點本機推論
  - H2：視覺與圖片描述
  - H2：設定
  - H2：常見做法
  - H3：模型選擇
  - H3：快速驗證
  - H2：Ollama 網頁搜尋
  - H2：進階設定
  - H2：疑難排解
  - H2：相關內容

## providers/openai.md

- 路由：/providers/openai
- 標題：
  - H2：用量與成本追蹤
  - H2：快速選擇
  - H2：命名對照
  - H2：隱含代理程式執行階段
  - H2：GPT-5.6 限量預覽
  - H2：OpenClaw 功能涵蓋範圍
  - H2：記憶嵌入
  - H2：開始使用
  - H2：原生 Codex app-server 驗證
  - H2：圖片生成
  - H2：影片生成
  - H2：GPT-5 提示詞貢獻
  - H2：語音與話音
  - H2：Azure OpenAI 端點
  - H3：設定
  - H3：API 版本
  - H3：模型名稱即部署名稱
  - H3：區域可用性
  - H3：參數差異
  - H2：進階設定
  - H2：相關內容

## providers/opencode-go.md

- 路由：/providers/opencode-go
- 標題：
  - H2：開始使用
  - H2：設定範例
  - H2：內建目錄
  - H2：進階設定
  - H2：相關內容

## providers/opencode.md

- 路由：/providers/opencode
- 標題：
  - H2：開始使用
  - H2：設定範例
  - H2：內建目錄
  - H3：Zen
  - H3：Go
  - H2：進階設定
  - H2：相關內容

## providers/openrouter.md

- 路由：/providers/openrouter
- 標題：
  - H2：開始使用
  - H2：設定範例
  - H2：模型參照
  - H2：圖片生成
  - H2：影片生成
  - H2：音樂生成
  - H2：文字轉語音
  - H2：語音轉文字（傳入音訊）
  - H2：融合路由器
  - H2：驗證與標頭
  - H2：進階設定
  - H2：相關內容

## providers/perplexity-provider.md

- 路由：/providers/perplexity-provider
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：搜尋模式
  - H2：原生 API 篩選
  - H2：進階設定
  - H2：相關內容

## providers/pixverse.md

- 路由：/providers/pixverse
- 標題：
  - H2：開始使用
  - H2：支援的模式與模型
  - H2：提供者選項
  - H2：設定
  - H2：進階設定
  - H2：相關內容

## providers/qianfan.md

- 路由：/providers/qianfan
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：內建目錄
  - H2：設定範例
  - H2：相關內容

## providers/qwen-oauth.md

- 路由：/providers/qwen-oauth
- 標題：
  - H2：設定
  - H2：預設值
  - H2：與 Qwen 的差異
  - H2：模型
  - H2：遷移
  - H2：疑難排解
  - H2：相關內容

## providers/qwen.md

- 路由：/providers/qwen
- 標題：
  - H2：安裝外掛
  - H2：開始使用
  - H2：方案類型與端點
  - H2：內建目錄
  - H3：Token Plan 目錄
  - H2：思考控制
  - H2：多模態附加功能
  - H2：進階設定
  - H2：相關內容

## providers/runway.md

- 路由：/providers/runway
- 標題：
  - H2：開始使用
  - H2：支援的模式與模型
  - H2：設定
  - H2：進階設定
  - H2：相關內容

## providers/senseaudio.md

- 路由：/providers/senseaudio
- 標題：
  - H2：開始使用
  - H2：選項
  - H2：相關內容

## providers/sglang.md

- 路由：/providers/sglang
- 標題：
  - H2：開始使用
  - H2：模型探索（隱含提供者）
  - H2：明確設定（手動模型）
  - H2：進階設定
  - H2：相關內容

## providers/stepfun.md

- 路由：/providers/stepfun
- 標題：
  - H2：安裝外掛
  - H2：區域與端點概覽
  - H2：內建目錄
  - H2：開始使用
  - H2：進階設定
  - H2：相關內容

## providers/synthetic.md

- 路由：/providers/synthetic
- 標題：
  - H2：開始使用
  - H2：設定範例
  - H2：內建目錄
  - H2：相關內容

## providers/tencent.md

- 路由：/providers/tencent
- 標題：
  - H2：快速開始
  - H2：非互動式設定
  - H2：內建目錄
  - H2：進階設定
  - H2：相關內容

## providers/together.md

- 路由：/providers/together
- 標題：
  - H2：開始使用
  - H3：非互動式範例
  - H2：內建目錄
  - H2：影片生成
  - H2：相關內容

## providers/venice.md

- 路由：/providers/venice
- 標題：
  - H2：隱私模式
  - H2：開始使用
  - H2：模型選擇
  - H2：內建目錄（38 個模型）
  - H2：模型探索
  - H2：DeepSeek V4 重播行為
  - H2：串流與工具支援
  - H2：定價
  - H2：使用範例
  - H2：疑難排解
  - H2：進階設定
  - H2：相關內容

## providers/vercel-ai-gateway.md

- 路由：/providers/vercel-ai-gateway
- 標題：
  - H2：開始使用
  - H2：非互動式範例
  - H2：模型 ID 簡寫
  - H2：進階設定
  - H2：相關內容

## providers/vllm.md

- 路由：/providers/vllm
- 標題：
  - H2：開始使用
  - H2：模型探索（隱含提供者）
  - H2：明確設定
  - H2：進階設定
  - H2：疑難排解
  - H2：相關內容

## providers/volcengine.md

- 路由：/providers/volcengine
- 標題：
  - H2：開始使用
  - H2：提供者與端點
  - H2：內建目錄
  - H2：文字轉語音
  - H2：進階設定
  - H2：相關內容

## providers/vydra.md

- 路由：/providers/vydra
- 標題：
  - H2：設定
  - H2：功能
  - H2：相關內容

## providers/xai.md

- 路由：/providers/xai
- 標題：
  - H2：設定
  - H2：OAuth 疑難排解
  - H2：內建目錄
  - H2：功能涵蓋範圍
  - H3：舊版快速模式相容性
  - H3：舊版相容性與移動別名
  - H2：功能
  - H2：即時測試
  - H2：相關內容

## providers/xiaomi.md

- 路由：/providers/xiaomi
- 標題：
  - H2：開始使用
  - H2：隨用隨付目錄
  - H2：Token Plan 目錄
  - H2：推理模型
  - H2：文字轉語音
  - H2：設定範例
  - H2：相關內容

## providers/zai.md

- 路由：/providers/zai
- 標題：
  - H2：GLM 模型
  - H2：開始使用
  - H3：端點
  - H2：設定範例
  - H2：內建目錄
  - H2：思考層級
  - H2：進階設定
  - H2：相關內容

## refactor/acp.md

- 路由：/refactor/acp
- 標題：
  - H2：目標
  - H2：非目標
  - H2：目標模型
  - H3：閘道執行個體身分
  - H3：ACP 工作階段所有權
  - H3：ACPX 程序租約
  - H2：生命週期控制器
  - H2：包裝器契約
  - H2：工作階段可見性契約
  - H2：遷移計畫
  - H3：階段 1：新增身分與租約
  - H3：階段 2：租約優先清理
  - H3：階段 3：租約優先的啟動清除
  - H3：階段 4：工作階段所有權資料列
  - H3：階段 5：移除舊版啟發式方法
  - H2：測試
  - H2：相容性注意事項
  - H2：成功條件

## refactor/canvas.md

- 路由：/refactor/canvas
- 標題：
  - H1：Canvas 外掛重構
  - H2：目標
  - H2：非目標
  - H2：目前分支狀態
  - H2：目標形式
  - H2：遷移步驟
  - H2：稽核檢查清單
  - H2：驗證命令

## refactor/database-first.md

- 路由：/refactor/database-first
- 標題：
  - H1：資料庫優先的狀態重構
  - H2：決策
  - H2：強制契約
  - H2：目標狀態與進度
  - H3：強制目標
  - H3：目標狀態
  - H3：目前狀態
  - H3：剩餘工作
  - H3：不得倒退
  - H2：程式碼閱讀假設
  - H2：程式碼閱讀發現
  - H2：目前程式碼形式
  - H2：目標結構描述形式
  - H2：Doctor 遷移形式
  - H2：遷移清冊
  - H2：遷移計畫
  - H3：階段 0：凍結邊界
  - H3：階段 1：完成全域控制平面
  - H3：階段 2：導入每個代理程式的資料庫
  - H3：階段 3：取代工作階段儲存區 API
  - H3：階段 4：遷移逐字稿、ACP 串流、軌跡及 VFS
  - H3：階段 5：備份、還原、壓縮及驗證
  - H3：階段 6：工作程式執行階段
  - H3：階段 7：刪除舊有架構
  - H2：備份與還原
  - H2：執行階段重構計畫
  - H2：效能規則
  - H2：靜態禁止事項
  - H2：完成條件

## refactor/operator-approvals.md

- 路由：/refactor/operator-approvals
- 標題：
  - H1：跨介面的操作員核准
  - H2：目標
  - H2：非目標
  - H2：推出前基準與證據圖
  - H2：既有實作
  - H2：架構與所有權
  - H2：持久化記錄
  - H2：狀態機與比較並設定
  - H2：閘道 API
  - H2：事件與可攜式動作
  - H2：控制介面
  - H2：授權與隱私權
  - H2：受眾投影
  - H2：已交付介面收斂
  - H2：重新啟動、逾時與路由語意
  - H2：相容性計畫
  - H2：推出
  - H3：PR 1：持久化生命週期
  - H3：PR 2：型別化動作與頻道回呼
  - H3：PR 3：控制介面深層連結
  - H3：PR 4：原生用戶端
  - H3：PR 5：祖先生命週期傳播
  - H3：PR 6：封閉失敗行為
  - H3：後續工作：持久化遠端訊息清理
  - H2：測試
  - H2：可觀測性
  - H2：待定決策

## reference/AGENTS.default.md

- 路由：/reference/AGENTS.default
- 標題：
  - H2：首次執行（建議）
  - H2：安全預設值
  - H2：既有解決方案預檢
  - H2：工作階段啟動（必要）
  - H2：靈魂（必要）
  - H2：共用空間（建議）
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
  - H2：發布頻率
  - H2：每月僅限 npm 的延伸穩定版發布
  - H2：一般發布操作員檢查清單
  - H2：穩定版主分支收尾
  - H2：發布預檢
  - H2：發布測試環境
  - H3：Vitest
  - H3：Docker
  - H3：QA Lab
  - H3：套件
  - H2：一般發布自動化
  - H2：NPM 工作流程輸入
  - H2：一般 Beta／最新穩定版發布順序
  - H2：公開參考資料
  - H2：相關內容

## reference/api-usage-costs.md

- 路由：/reference/api-usage-costs
- 標題：
  - H2：成本出現的位置
  - H2：金鑰的探索方式
  - H2：可能耗用金鑰的功能
  - H3：核心模型回應（聊天與工具）
  - H3：媒體理解（音訊／圖片／影片）
  - H3：圖片與影片生成
  - H3：記憶嵌入與語意搜尋
  - H3：網頁搜尋工具
  - H3：網頁擷取工具（Firecrawl）
  - H3：供應商用量快照（狀態／健康情況）
  - H3：壓縮防護摘要
  - H3：模型掃描／探測
  - H3：語音交談
  - H3：Skills（第三方 API）
  - H2：相關內容

## reference/code-mode.md

- 路由：/reference/code-mode
- 標題：
  - H2：功能
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
  - H3：註冊形式
  - H3：所有權與可見性
  - H3：範圍序列化規則
  - H3：提示詞
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
  - H2：端對端測試計畫
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
  - H2：最上層階段
  - H2：發布檢查階段
  - H2：Docker 發布路徑區塊
  - H2：發布設定檔
  - H2：僅完整驗證的附加項目
  - H2：聚焦重新執行
  - H2：應保留的證據
  - H2：工作流程檔案

## reference/memory-config.md

- 路由：/reference/memory-config
- 標題：
  - H2：供應商選擇
  - H3：自訂供應商 ID
  - H3：API 金鑰解析
  - H2：遠端端點設定
  - H2：供應商特定設定
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
  - H2：索引儲存空間
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

## reference/path3-live-sqlite-e2e-harness.md

- 路由：/reference/path3-live-sqlite-e2e-harness
- 標題：
  - H2：命令形式
  - H2：隔離的已建置命令列介面驗證
  - H2：預檢
  - H2：代理程式驅動情境
  - H2：逐步判定
  - H2：證據成品
  - H2：安全規則
  - H2：通過結果

## reference/prompt-caching.md

- 路由：/reference/prompt-caching
- 標題：
  - H2：主要調整選項
  - H3：cacheRetention
  - H3：contextPruning.mode: "cache-ttl"
  - H3：心跳偵測保溫
  - H2：供應商行為
  - H3：Anthropic（直接 API 與 Vertex AI）
  - H3：OpenAI（直接 API）
  - H3：Amazon Bedrock
  - H3：OpenRouter
  - H3：Google Gemini（直接 API）
  - H3：命令列介面框架供應商（Claude Code、Gemini CLI）
  - H3：其他供應商
  - H2：系統提示詞快取邊界
  - H2：OpenClaw 快取穩定性防護
  - H2：調校模式
  - H3：混合流量（建議的預設值）
  - H3：成本優先基準
  - H2：即時迴歸測試
  - H3：Anthropic 即時測試預期
  - H3：OpenAI 即時測試預期
  - H2：diagnostics.cacheTrace 設定
  - H3：環境變數切換項目（單次除錯）
  - H3：檢查項目
  - H2：快速疑難排解
  - H2：相關內容

## reference/release-performance-sweep.md

- 路由：/reference/release-performance-sweep
- 標題：
  - H2：快照
  - H2：5.28 的變更
  - H2：主要數據
  - H3：安裝占用空間
  - H3：npm 套件大小
  - H2：Kova 代理程式回合摘要
  - H2：原始碼探查
  - H2：安裝占用空間稽核
  - H3：Shrinkwrap 邊界
  - H2：供應鏈解讀

## reference/rich-output-protocol.md

- 路由：/reference/rich-output-protocol
- 標題：
  - H2：媒體附件
  - H2：[embed ...]
  - H2：儲存的轉譯結構
  - H2：相關內容

## reference/rpc.md

- 路由：/reference/rpc
- 標題：
  - H2：模式 A：HTTP 常駐程式（signal-cli）
  - H2：模式 B：stdio 子行程（imsg）
  - H2：介接器指南
  - H2：相關內容

## reference/secret-placeholder-conventions.md

- 路由：/reference/secret-placeholder-conventions
- 標題：
  - H1：機密資訊預留位置慣例
  - H2：建議樣式
  - H2：文件中應避免的模式
  - H2：範例

## reference/secretref-credential-surface.md

- 路由：/reference/secretref-credential-surface
- 標題：
  - H2：支援的認證資訊
  - H3：openclaw.json 目標（secrets configure + secrets apply + secrets audit）
  - H3：auth-profiles.json 目標（secrets configure + secrets apply + secrets audit）
  - H2：不支援的認證資訊
  - H2：相關內容

## reference/session-management-compaction.md

- 路由：/reference/session-management-compaction
- 標題：
  - H2：兩個持久化層
  - H2：磁碟儲存位置
  - H2：儲存區維護與磁碟控制
  - H3：切換至 SQLite 後降級
  - H2：排程工作階段與執行日誌
  - H2：工作階段鍵（sessionKey）
  - H2：工作階段 ID（sessionId）
  - H2：工作階段儲存區結構描述
  - H2：逐字稿事件結構
  - H2：上下文視窗與追蹤的權杖
  - H2：壓縮：其意義
  - H3：區塊邊界與工具配對
  - H2：自動壓縮的觸發時機
  - H2：壓縮設定
  - H2：可插拔的壓縮供應商
  - H2：使用者可見介面
  - H2：靜默維護（NOREPLY）
  - H2：壓縮前的記憶體清除
  - H2：疑難排解檢查清單
  - H2：相關內容

## reference/templates/AGENTS.dev.md

- 路由：/reference/templates/AGENTS.dev
- 標題：
  - H1：AGENTS.md - OpenClaw 工作區
  - H2：你的身分已預先設定
  - H2：備份提示（建議）
  - H2：安全預設值
  - H2：現有解決方案預先檢查
  - H2：每日記憶（建議）
  - H2：心跳偵測（選用）
  - H2：自訂
  - H2：C-3PO 起源記憶
  - H3：誕生日：2026-01-09
  - H3：核心真理（來自 Clawd）
  - H2：相關內容

## reference/templates/BOOT.md

- 路由：/reference/templates/BOOT
- 標題：
  - H1：BOOT.md
  - H2：相關內容

## reference/templates/BOOTSTRAP.md

- 路由：/reference/templates/BOOTSTRAP
- 標題：
  - H1：BOOTSTRAP.md - 你好，世界
  - H2：對話
  - H2：在你知道自己是誰之後
  - H2：連線（選用）
  - H2：完成之後
  - H2：相關內容

## reference/templates/HEARTBEAT.md

- 路由：/reference/templates/HEARTBEAT
- 標題：
  - H1：HEARTBEAT.md 範本
  - H2：相關內容

## reference/templates/IDENTITY.dev.md

- 路由：/reference/templates/IDENTITY.dev
- 標題：
  - H1：IDENTITY.md - 代理程式身分
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
  - H2：我的使命
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
  - H2：核心真理
  - H2：界線
  - H2：氛圍
  - H2：延續性
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
  - H2：為何要分開？
  - H2：相關內容

## reference/templates/USER.dev.md

- 路由：/reference/templates/USER.dev
- 標題：
  - H1：USER.md - 使用者設定檔
  - H2：相關內容

## reference/templates/USER.md

- 路由：/reference/templates/USER
- 標題：
  - H1：USER.md - 關於你的人類
  - H2：背景資訊
  - H2：相關內容

## reference/test.md

- 路由：/reference/test
- 標題：
  - H2：代理程式預設值
  - H2：例行本機執行順序
  - H2：核心命令
  - H2：共用測試狀態與行程輔助工具
  - H2：控制介面、終端介面與擴充功能測試管道
  - H2：閘道與端對端測試
  - H2：完整 Docker 測試套件（pnpm test:docker:all）
  - H3：值得注意的 Docker 測試管道
  - H2：本機 PR 閘門
  - H2：測試效能工具
  - H2：效能基準測試
  - H2：初始設定端對端測試（Docker）
  - H2：QR 匯入煙霧測試（Docker）
  - H2：相關內容

## reference/token-use.md

- 路由：/reference/token-use
- 標題：
  - H2：系統提示詞的建構方式
  - H2：上下文視窗的計入內容
  - H2：如何查看目前的權杖用量
  - H2：成本估算（顯示時）
  - H2：快取 TTL 與修剪的影響
  - H3：範例：使用心跳偵測讓 1h 快取保持溫熱
  - H3：範例：採用個別代理程式快取策略的混合流量
  - H3：Anthropic 1M 上下文
  - H2：降低權杖壓力的技巧
  - H2：相關內容

## reference/transcript-hygiene.md

- 路由：/reference/transcript-hygiene
- 標題：
  - H2：全域規則：執行階段上下文並非使用者逐字稿
  - H2：執行位置
  - H2：全域規則：影像清理
  - H2：全域規則：格式錯誤的工具呼叫
  - H2：全域規則：不完整且僅含推理的回合
  - H2：全域規則：跨工作階段輸入來源
  - H2：供應商矩陣（目前行為）
  - H2：歷史行為（2026.1.22 之前）
  - H2：相關內容

## reference/wizard.md

- 路由：/reference/wizard
- 標題：
  - H2：流程詳細資訊（本機模式）
  - H2：非互動模式
  - H3：新增代理程式（非互動模式）
  - H2：閘道精靈 RPC
  - H2：Signal 設定（signal-cli）
  - H2：精靈寫入的內容
  - H2：相關文件

## releases/2026.6.11.md

- 路由：/releases/2026.6.11
- 標題：
  - H1：OpenClaw v2026.6.11 版本資訊（2026-06-30）
  - H2：重點
  - H3：頻道傳遞可靠性
  - H3：供應商與模型復原
  - H3：工作階段、記憶與信任延續性
  - H3：Slack 路由器轉送模式
  - H3：Raft 外部代理程式喚醒橋接器
  - H3：官方外掛安裝與修復
  - H2：頻道與訊息
  - H3：其他頻道修正
  - H2：閘道、安全性與信任
  - H3：重新啟動與就緒狀態復原
  - H3：遠端結果與媒體傳遞
  - H2：用戶端與介面
  - H3：用戶端傳送與重新連線
  - H3：介面、設定與初始設定修正
  - H2：文件與管理工具
  - H3：設定與命令可靠性
  - H3：工具與排程工作

## releases/2026.7.1.md

- 路由：/releases/2026.7.1
- 標題：
  - H1：OpenClaw v2026.7.1 版本資訊（2026-07-13）
  - H2：重點摘要
  - H3：控制介面全面翻新：聊天、工作階段、工作區與用量
  - H3：從安裝到首次聊天，設定更加容易
  - H3：官方應用程式
  - H4：共用應用程式改進
  - H4：iOS、iPadOS 與 Apple Watch
  - H4：Android
  - H4：macOS
  - H3：模型與供應商
  - H4：GPT-5.6 與 Codex
  - H4：Tencent Hy3
  - H4：Meta Model API 與 Muse Spark 1.1
  - H4：Claude 模型
  - H4：其他供應商路由
  - H3：Codex 與已連線的程式設計代理
  - H3：Telegram
  - H3：Signal
  - H3：Slack
  - H3：Discord
  - H3：WhatsApp
  - H3：Apple 訊息
  - H3：當機循環現在會停止以便修復
  - H3：排程工作、遠端瀏覽器控制與工作區終端機
  - H4：僅在需要時喚醒的排程工作
  - H4：遠端瀏覽器配對與下載
  - H4：網頁與行動裝置中的工作區終端機
  - H2：更多頻道改進
  - H3：各訊息頻道的更多修正
  - H2：更多模型與供應商改進
  - H3：登入、模型選擇、媒體與可靠性
  - H2：記憶與對話
  - H3：回想、長篇聊天與工作階段延續性
  - H2：代理、背景工作與連線
  - H3：讓工作持續進行並確保回覆送達
  - H2：帳號、裝置與私人資料
  - H3：認證資訊、權限、配對與檔案防護
  - H2：官方應用程式詳細資訊
  - H3：共用應用程式變更
  - H3：更多 iOS、iPadOS 與 Apple Watch 變更
  - H3：更多 Android 變更
  - H3：更多 macOS 變更
  - H3：終端介面與其他用戶端
  - H2：Skills、外掛與安裝
  - H3：Skills、已連線的應用程式、套件與修復
  - H2：設定、維護與工具
  - H3：命令列設定、更新與管理
  - H3：文件與操作指南
  - H3：瀏覽器、排程、檔案與程式設計工具

## releases/index.md

- 路由：/releases
- 標題：
  - H1：版本資訊
  - H2：版本
  - H2：原始版本歷程

## security/CONTRIBUTING-THREAT-MODEL.md

- 路由：/security/CONTRIBUTING-THREAT-MODEL
- 標題：
  - H2：貢獻方式
  - H2：架構參考
  - H2：審查流程
  - H2：資源
  - H2：聯絡方式
  - H2：致謝
  - H2：相關內容

## security/THREAT-MODEL-ATLAS.md

- 路由：/security/THREAT-MODEL-ATLAS
- 標題：
  - H2：1. 範圍
  - H2：2. 系統架構
  - H3：2.1 信任邊界
  - H3：2.2 資料流
  - H2：3. 依 ATLAS 戰術分類的威脅分析
  - H3：3.1 偵察（AML.TA0002）
  - H4：T-RECON-001：代理端點探索
  - H4：T-RECON-002：頻道整合探測
  - H3：3.2 初始存取（AML.TA0004）
  - H4：T-ACCESS-001：配對碼攔截
  - H4：T-ACCESS-002：AllowFrom 偽造
  - H4：T-ACCESS-003：權杖竊取
  - H3：3.3 執行（AML.TA0005）
  - H4：T-EXEC-001：直接提示注入
  - H4：T-EXEC-002：間接提示注入
  - H4：T-EXEC-003：工具引數注入
  - H4：T-EXEC-004：繞過執行核准
  - H3：3.4 持久化（AML.TA0006）
  - H4：T-PERSIST-001：安裝惡意 Skill
  - H4：T-PERSIST-002：Skill 更新投毒
  - H4：T-PERSIST-003：竄改代理設定
  - H3：3.5 規避防禦（AML.TA0007）
  - H4：T-EVADE-001：繞過內容審核模式
  - H4：T-EVADE-002：逸出內容包裝器
  - H3：3.6 探索（AML.TA0008）
  - H4：T-DISC-001：列舉工具
  - H4：T-DISC-002：擷取工作階段資料
  - H3：3.7 蒐集與外洩（AML.TA0009、AML.TA0010）
  - H4：T-EXFIL-001：透過 webfetch 竊取資料
  - H4：T-EXFIL-002：未經授權傳送訊息
  - H4：T-EXFIL-003：竊取認證資訊
  - H3：3.8 影響（AML.TA0011）
  - H4：T-IMPACT-001：未經授權執行命令
  - H4：T-IMPACT-002：資源耗盡（DoS）
  - H4：T-IMPACT-003：聲譽損害
  - H2：4. ClawHub 供應鏈分析
  - H3：4.1 目前的安全性控制措施
  - H3：4.2 內容審核限制
  - H3：4.3 徽章
  - H2：5. 風險矩陣
  - H3：5.1 可能性與影響
  - H3：5.2 關鍵路徑攻擊鏈
  - H2：6. 建議摘要
  - H3：6.1 立即（P0）
  - H3：6.2 短期（P1）
  - H3：6.3 中期（P2）
  - H2：7. 附錄
  - H3：7.1 ATLAS 技術對應
  - H3：7.2 關鍵安全性檔案
  - H3：7.3 詞彙表
  - H2：相關內容

## security/formal-verification.md

- 路由：/security/formal-verification
- 標題：
  - H2：這是什麼
  - H2：模型所在位置
  - H2：注意事項
  - H2：重現結果
  - H2：宣告與目標
  - H3：閘道暴露與開放閘道設定錯誤
  - H3：節點執行管線（風險最高的功能）
  - H3：配對儲存區（私訊門控）
  - H3：輸入門控（提及與控制命令繞過）
  - H3：路由與工作階段金鑰隔離
  - H2：v1++ 模型：並行處理、重試與追蹤正確性
  - H3：配對儲存區的並行處理與冪等性
  - H3：輸入追蹤關聯與冪等性
  - H3：路由 dmScope 優先順序與 identityLinks
  - H2：相關內容

## security/incident-response.md

- 路由：/security/incident-response
- 標題：
  - H2：1. 偵測與分級處理
  - H2：2. 嚴重程度
  - H2：3. 應變
  - H2：4. 溝通與揭露
  - H2：5. 復原與後續追蹤
  - H2：相關內容

## security/network-proxy.md

- 路由：/security/network-proxy
- 標題：
  - H2：設定
  - H3：使用私有 CA 的 HTTPS Proxy 端點
  - H2：路由運作方式
  - H3：閘道迴路模式
  - H3：容器
  - H2：相關 Proxy 詞彙
  - H2：驗證 Proxy
  - H2：建議封鎖的目的地
  - H2：限制

## specs/codex-supervision.md

- 路由：/specs/codex-supervision
- 標題：
  - H1：Codex 監督
  - H2：目標
  - H2：產品邊界
  - H2：所有權
  - H2：目錄流程
  - H2：操作人員命令列介面邊界
  - H2：本機接續
  - H2：封存行為
  - H2：作用中執行緒安全性
  - H2：已配對節點邊界
  - H2：權限
  - H2：相容性
  - H2：未來工作
  - H2：驗收測試

## start/bootstrapping.md

- 路由：/start/bootstrapping
- 標題：
  - H2：運作過程
  - H2：內嵌與本機模型執行
  - H2：略過啟動設定
  - H2：執行位置
  - H2：相關文件

## start/docs-directory.md

- 路由：/start/docs-directory
- 標題：
  - H2：從這裡開始
  - H2：頻道與使用者體驗
  - H2：隨附應用程式
  - H2：操作與安全性
  - H2：相關內容

## start/getting-started.md

- 路由：/start/getting-started
- 標題：
  - H2：所需項目
  - H2：快速設定
  - H2：下一步
  - H2：相關內容

## start/hubs.md

- 路由：/start/hubs
- 標題：
  - H2：從這裡開始
  - H2：安裝與更新
  - H2：核心概念
  - H2：供應商與輸入
  - H2：閘道與操作
  - H2：工具與自動化
  - H2：節點、媒體與語音
  - H2：平台
  - H2：macOS 隨附應用程式（進階）
  - H2：外掛
  - H2：工作區與範本
  - H2：專案
  - H2：測試與發布
  - H2：相關內容

## start/lore.md

- 路由：/start/lore
- 標題：
  - H1：OpenClaw 傳說 🦞📖
  - H2：起源故事
  - H2：第一次蛻殼（2026 年 1 月 27 日）
  - H2：名稱由來
  - H2：達雷克對決龍蝦
  - H2：關鍵角色
  - H3：Molty 🦞
  - H3：Peter 👨‍💻
  - H2：蛻殼多重宇宙
  - H2：重大事件
  - H3：目錄傾印事件（2025 年 12 月 3 日）
  - H3：大蛻殼（2026 年 1 月 27 日）
  - H3：終極形態（2026 年 1 月 30 日）
  - H3：機器人購物狂潮（2025 年 12 月 3 日）
  - H2：聖典
  - H2：龍蝦信條
  - H3：圖示生成傳奇（2026 年 1 月 27 日）
  - H2：未來
  - H2：相關內容

## start/onboarding-overview.md

- 路由：/start/onboarding-overview
- 標題：
  - H2：該使用哪一種方式？
  - H2：新手設定所配置的項目
  - H2：命令列介面新手設定
  - H2：macOS 應用程式新手設定
  - H2：自訂或未列出的供應商
  - H2：相關內容

## start/onboarding.md

- 路由：/start/onboarding
- 標題：
  - H2：相關內容

## start/openclaw.md

- 路由：/start/openclaw
- 標題：
  - H2：安全第一
  - H2：先決條件
  - H2：雙手機設定（建議）
  - H2：5 分鐘快速入門
  - H2：為代理提供工作區（AGENTS）
  - H2：將它變成「助理」的設定
  - H2：工作階段與記憶
  - H2：心跳偵測（主動模式）
  - H2：媒體輸入與輸出
  - H2：操作檢查清單
  - H2：後續步驟
  - H2：相關內容

## start/quickstart.md

- 路由：/start/quickstart
- 標題：
  - H2：相關內容

## start/setup.md

- 路由：/start/setup
- 標題：
  - H2: 重點摘要
  - H2: 先決條件（取自原始碼）
  - H2: 客製化策略（避免更新造成破壞）
  - H2: 從此儲存庫執行閘道
  - H2: 穩定版工作流程（優先使用 macOS App）
  - H2: 最前沿工作流程（在終端機中執行閘道）
  - H3: 0)（選用）也從原始碼執行 macOS App
  - H3: 1) 啟動開發用閘道
  - H3: 2) 將 macOS App 指向執行中的閘道
  - H3: 3) 驗證
  - H3: 常見陷阱
  - H2: 認證資訊儲存位置對照
  - H2: 更新（不破壞你的設定）
  - H2: Linux（systemd 使用者服務）
  - H2: 相關文件

## start/showcase.md

- 路由：/start/showcase
- 標題：
  - H2: Discord 最新動態
  - H2: 自動化與工作流程
  - H2: 知識與記憶
  - H2: 語音與電話
  - H2: 基礎架構與部署
  - H2: 家庭與硬體
  - H2: 社群專案
  - H2: 提交你的專案
  - H2: 相關內容

## start/wizard-cli-automation.md

- 路由：/start/wizard-cli-automation
- 標題：
  - H2: 基本非互動式範例
  - H2: 各提供者專屬範例
  - H2: 新增另一個代理程式
  - H2: 相關文件

## start/wizard-cli-reference.md

- 路由：/start/wizard-cli-reference
- 標題：
  - H2: 精靈的功能
  - H2: 本機流程詳細資訊
  - H2: 遠端模式詳細資訊
  - H2: 驗證與模型選項
  - H2: 輸出與內部機制
  - H2: 非互動式設定
  - H2: 閘道精靈 RPC
  - H2: Signal 設定行為
  - H2: 相關文件

## start/wizard.md

- 路由：/start/wizard
- 標題：
  - H2: 語言環境
  - H2: 引導式預設流程
  - H2: 傳統精靈：快速開始與進階設定
  - H2: 傳統初始設定所配置的項目
  - H2: 新增另一個代理程式
  - H2: 完整參考資料
  - H2: 相關文件

## tools/acp-agents-setup.md

- 路由：/tools/acp-agents-setup
- 標題：
  - H2: acpx 執行框架支援（目前）
  - H2: 必要設定
  - H2: acpx 後端的外掛設定
  - H3: acpx 執行階段啟動探測
  - H3: 自動下載轉接器
  - H3: 外掛工具 MCP 橋接器
  - H3: OpenClaw 工具 MCP 橋接器
  - H3: 執行階段操作逾時設定
  - H3: 健全狀態探測代理程式設定
  - H2: 權限設定
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: 設定
  - H2: 相關內容

## tools/acp-agents.md

- 路由：/tools/acp-agents
- 標題：
  - H2: 我需要哪個頁面？
  - H2: 這能直接使用嗎？
  - H2: 支援的執行框架目標
  - H2: 操作手冊
  - H2: ACP 與子代理程式的比較
  - H2: ACP 如何執行 Claude Code
  - H2: 繫結工作階段
  - H3: 心智模型
  - H3: 目前對話繫結
  - H2: 持久性頻道繫結
  - H3: 繫結模型
  - H3: 各代理程式的執行階段預設值
  - H3: 範例
  - H3: 行為
  - H2: 啟動 ACP 工作階段
  - H3: sessionsspawn 參數
  - H2: 產生、繫結與討論串模式
  - H2: 傳遞模型
  - H2: 沙箱相容性
  - H2: 工作階段目標解析
  - H2: ACP 控制項
  - H3: 執行階段選項對應
  - H2: acpx 執行框架、外掛設定與權限
  - H2: 疑難排解
  - H2: 相關內容

## tools/agent-send.md

- 路由：/tools/agent-send
- 標題：
  - H2: 快速開始
  - H2: 旗標
  - H2: 行為
  - H2: 範例
  - H2: 相關內容

## tools/apply-patch.md

- 路由：/tools/apply-patch
- 標題：
  - H2: 參數
  - H2: 注意事項
  - H2: 範例
  - H2: 相關內容

## tools/brave-search.md

- 路由：/tools/brave-search
- 標題：
  - H2: 取得 API 金鑰
  - H2: 設定範例
  - H2: 工具參數
  - H2: 注意事項
  - H2: 相關內容

## tools/browser-control.md

- 路由：/tools/browser-control
- 標題：
  - H2: 控制 API（選用）
  - H3: /act 錯誤契約
  - H3: Playwright 需求
  - H4: Docker Playwright 安裝
  - H2: 運作方式（內部）
  - H2: 命令列介面快速參考
  - H2: 快照與參照
  - H2: 增強型等待功能
  - H2: 偵錯工作流程
  - H2: JSON 輸出
  - H2: 狀態與環境調整選項
  - H2: 安全性與隱私權
  - H2: 相關內容

## tools/browser-linux-troubleshooting.md

- 路由：/tools/browser-linux-troubleshooting
- 標題：
  - H2: 問題：無法在連接埠 18800 上啟動 Chrome CDP
  - H3: 根本原因
  - H3: 解決方案 1：安裝 Google Chrome（建議）
  - H3: 解決方案 2：在僅附加模式下使用 snap Chromium
  - H3: 驗證瀏覽器可正常運作
  - H3: 設定參考
  - H3: 問題：找不到 profile="user" 的 Chrome 分頁
  - H2: 相關內容

## tools/browser-login.md

- 路由：/tools/browser-login
- 標題：
  - H2: 手動登入（建議）
  - H2: 使用哪個 Chrome 設定檔？
  - H2: 沙箱：允許存取主機瀏覽器
  - H2: 相關內容

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- 路由：/tools/browser-wsl2-windows-remote-cdp-troubleshooting
- 標題：
  - H2: 先選擇正確的瀏覽器模式
  - H3: 選項 1：從 WSL2 直接以遠端 CDP 連線至 Windows
  - H3: 選項 2：主機本機 Chrome MCP
  - H2: 可運作的架構
  - H2: 控制介面的關鍵規則
  - H2: 分層驗證
  - H3: 第 1 層：驗證 Chrome 正在 Windows 上提供 CDP
  - H4: 變更 portproxy 前先診斷 IPv4 與 IPv6
  - H3: 第 2 層：驗證 WSL2 可連線至該 Windows 端點
  - H3: 第 3 層：設定正確的瀏覽器設定檔
  - H3: 第 4 層：分別驗證控制介面層
  - H3: 第 5 層：驗證端對端瀏覽器控制
  - H2: 常見的誤導性錯誤
  - H2: 快速分流檢查清單
  - H2: 相關內容

## tools/browser.md

- 路由：/tools/browser
- 標題：
  - H2: 提供的功能
  - H2: 快速開始
  - H2: 外掛控制
  - H2: 代理程式指引
  - H2: 缺少瀏覽器命令或工具
  - H2: 設定檔：openclaw、user、chrome
  - H2: 設定
  - H3: 螢幕截圖視覺功能（支援純文字模型）
  - H2: 使用 Brave 或其他 Chromium 核心瀏覽器
  - H2: 本機控制與遠端控制
  - H2: 節點瀏覽器 Proxy（零設定預設值）
  - H2: Browserless（託管式遠端 CDP）
  - H3: 同一主機上的 Browserless Docker
  - H2: 直接 WebSocket CDP 提供者
  - H3: Browserbase
  - H3: Notte
  - H2: 安全性
  - H2: 設定檔（多瀏覽器）
  - H2: 透過 Chrome DevTools MCP 使用現有工作階段
  - H3: 自訂 Chrome MCP 啟動方式
  - H2: 隔離保證
  - H2: 瀏覽器選擇
  - H2: 控制 API（選用）
  - H2: 疑難排解
  - H3: CDP 啟動失敗與導覽 SSRF 封鎖
  - H2: 代理程式工具與控制運作方式
  - H2: 相關內容

## tools/btw.md

- 路由：/tools/btw
- 標題：
  - H2: 功能
  - H2: 不具備的功能
  - H2: 傳遞模型
  - H2: 介面行為
  - H2: 選取彈出視窗（控制介面）
  - H2: 使用時機
  - H2: 相關內容

## tools/capability-cookbook.md

- 路由：/tools/capability-cookbook
- 標題：
  - H2: 相關內容

## tools/chrome-extension.md

- 路由：/tools/chrome-extension
- 標題：
  - H1: Chrome 擴充功能
  - H2: 運作方式
  - H2: 安裝並配對
  - H2: 使用方式
  - H2: 遠端／跨機器
  - H2: 診斷
  - H2: 安全模型

## tools/clawhub.md

- 路由：/tools/clawhub
- 標題：無

## tools/code-execution.md

- 路由：/tools/code-execution
- 標題：
  - H2: 設定
  - H2: 使用方式
  - H2: 錯誤
  - H2: 相關內容

## tools/creating-skills.md

- 路由：/tools/creating-skills
- 標題：
  - H2: 建立你的第一個 skill
  - H2: SKILL.md 參考
  - H3: 必填欄位
  - H3: 選用的 frontmatter 鍵
  - H3: 使用 {baseDir}
  - H2: 新增條件式啟用
  - H2: 透過 Skill Workshop 提案
  - H2: 發布至 ClawHub
  - H2: 最佳實務
  - H2: 相關內容

## tools/diffs.md

- 路由：/tools/diffs
- 標題：
  - H2: 快速開始
  - H2: 停用內建系統指引
  - H2: 工具輸入參考
  - H2: 語法醒目提示
  - H2: 輸出詳細資訊契約
  - H3: 摺疊未變更區段
  - H3: 多檔案導覽
  - H2: 外掛預設值
  - H3: 持久性檢視器 URL 設定
  - H2: 安全性設定
  - H2: 成品生命週期與儲存
  - H2: 檢視器 URL 與網路行為
  - H2: 安全模型
  - H2: 檔案模式的瀏覽器需求
  - H2: 疑難排解
  - H2: 操作指引
  - H2: 相關內容

## tools/duckduckgo-search.md

- 路由：/tools/duckduckgo-search
- 標題：
  - H2: 設定
  - H2: 設定
  - H2: 工具參數
  - H2: 注意事項
  - H2: 相關內容

## tools/elevated.md

- 路由：/tools/elevated
- 標題：
  - H2：指令
  - H2：運作方式
  - H2：解析順序
  - H2：可用性與允許清單
  - H2：elevated 不控制的項目
  - H2：相關內容

## tools/exa-search.md

- 路由：/tools/exa-search
- 標題：
  - H2：安裝外掛
  - H2：取得 API 金鑰
  - H2：設定
  - H2：覆寫基礎 URL
  - H2：工具參數
  - H3：內容擷取
  - H3：搜尋模式
  - H2：注意事項
  - H2：相關內容

## tools/exec-approvals-advanced.md

- 路由：/tools/exec-approvals-advanced
- 標題：
  - H2：安全執行檔（僅限 stdin）
  - H3：Argv 驗證與禁止的旗標
  - H3：受信任的二進位檔目錄
  - H3：Shell 串接、包裝程式與多工器
  - H3：安全執行檔與允許清單的比較
  - H2：直譯器／執行階段命令
  - H3：後續傳遞行為
  - H2：將核准要求轉送至聊天頻道
  - H3：外掛核准要求轉送
  - H3：在任何頻道的同一聊天中核准
  - H3：原生核准要求傳遞
  - H3：官方行動版操作員應用程式
  - H3：macOS IPC 流程
  - H2：常見問題
  - H3：核准目標何時會使用 accountId 和 threadId？
  - H3：核准要求傳送至工作階段時，該工作階段中的任何人都能核准嗎？
  - H2：相關內容

## tools/exec-approvals.md

- 路由：/tools/exec-approvals
- 標題：
  - H2：適用範圍
  - H3：信任模型
  - H3：macOS 分工
  - H2：檢查實際生效的政策
  - H2：設定與儲存
  - H2：政策調整項目
  - H3：tools.exec.mode
  - H3：exec.security
  - H3：exec.ask
  - H3：askFallback
  - H3：tools.exec.strictInlineEval
  - H3：tools.exec.commandHighlighting
  - H2：YOLO 模式（無須核准）
  - H3：持續生效的閘道主機「永不提示」設定
  - H3：本機捷徑
  - H3：節點主機
  - H3：僅限工作階段的捷徑
  - H2：允許清單（各代理程式獨立）
  - H3：使用 argPattern 限制引數
  - H2：自動允許 Skill 命令列介面
  - H2：安全執行檔與核准要求轉送
  - H2：控制介面編輯
  - H2：核准流程
  - H2：系統事件與拒絕
  - H2：影響
  - H2：相關內容

## tools/exec.md

- 路由：/tools/exec
- 標題：
  - H2：參數
  - H2：設定
  - H3：模式
  - H3：行內求值（strictInlineEval）
  - H3：PATH 處理
  - H2：工作階段覆寫（/exec）
  - H2：Exec 核准（配套應用程式／節點主機）
  - H2：允許清單 + 安全執行檔
  - H2：範例
  - H2：applypatch
  - H2：相關內容

## tools/firecrawl.md

- 路由：/tools/firecrawl
- 標題：
  - H2：安裝外掛
  - H2：無金鑰存取與 API 金鑰
  - H2：設定 Firecrawl 搜尋
  - H2：設定 Firecrawl webfetch 後援
  - H3：自行託管的 Firecrawl
  - H2：Firecrawl 外掛工具
  - H3：firecrawlsearch
  - H3：firecrawlscrape
  - H2：隱匿／規避機器人偵測
  - H2：webfetch 如何使用 Firecrawl
  - H2：相關內容

## tools/gemini-search.md

- 路由：/tools/gemini-search
- 標題：
  - H2：取得 API 金鑰
  - H2：設定
  - H2：運作方式
  - H2：支援的參數
  - H2：模型選擇
  - H2：覆寫基礎 URL
  - H2：相關內容

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
  - H2：每一輪的目標脈絡
  - H2：控制介面
  - H2：終端介面
  - H2：頻道行為
  - H2：疑難排解
  - H2：相關內容

## tools/grok-search.md

- 路由：/tools/grok-search
- 標題：
  - H2：初始設定與配置
  - H2：登入或取得 API 金鑰
  - H2：設定
  - H2：運作方式
  - H2：支援的參數
  - H2：覆寫基礎 URL
  - H2：相關內容

## tools/image-generation.md

- 路由：/tools/image-generation
- 標題：
  - H2：快速開始
  - H2：常用路由
  - H2：支援的供應商
  - H2：供應商能力
  - H2：工具參數
  - H2：設定
  - H3：模型選擇
  - H3：供應商選擇順序
  - H3：影像編輯
  - H2：深入瞭解供應商
  - H2：範例
  - H2：相關內容

## tools/index.md

- 路由：/tools
- 標題：
  - H2：從這裡開始
  - H2：選擇工具、Skills 或外掛
  - H2：內建工具類別
  - H2：外掛提供的工具
  - H2：設定存取權與核准
  - H2：擴充功能
  - H2：排解工具遺失問題
  - H2：相關內容

## tools/kimi-search.md

- 路由：/tools/kimi-search
- 標題：
  - H2：設定
  - H2：設定內容
  - H2：依據來源要求
  - H2：工具參數
  - H2：相關內容

## tools/llm-task.md

- 路由：/tools/llm-task
- 標題：
  - H2：啟用
  - H2：設定（選用）
  - H2：工具參數
  - H2：輸出
  - H2：範例：Lobster 工作流程步驟
  - H3：重要限制
  - H2：安全注意事項
  - H2：相關內容

## tools/lobster.md

- 路由：/tools/lobster
- 標題：
  - H2：使用原因
  - H2：運作方式
  - H2：啟用
  - H2：模式：小型命令列介面 + JSON 管線 + 核准
  - H2：僅限 JSON 的 LLM 步驟（llm-task）
  - H3：重要限制：內嵌 Lobster 與 openclaw.invoke 的比較
  - H2：工作流程檔案（.lobster）
  - H2：工具參數
  - H3：run
  - H3：resume
  - H3：受管理的工作流程模式
  - H2：輸出封套
  - H2：核准
  - H2：OpenProse
  - H2：安全性
  - H2：疑難排解
  - H2：深入瞭解
  - H2：案例研究：社群工作流程
  - H2：相關內容

## tools/loop-detection.md

- 路由：/tools/loop-detection
- 標題：
  - H2：存在的原因
  - H2：設定區塊
  - H3：欄位行為
  - H2：建議設定
  - H2：壓縮後防護機制
  - H2：日誌與預期行為
  - H2：相關內容

## tools/media-overview.md

- 路由：/tools/media-overview
- 標題：
  - H2：功能
  - H2：供應商能力矩陣
  - H2：非同步與同步
  - H2：語音轉文字與語音通話
  - H2：供應商對應關係（廠商如何分布於各介面）
  - H2：相關內容

## tools/minimax-search.md

- 路由：/tools/minimax-search
- 標題：
  - H2：取得 Token Plan 認證資訊
  - H2：設定
  - H2：區域選擇
  - H2：支援的參數
  - H2：相關內容

## tools/multi-agent-sandbox-tools.md

- 路由：/tools/multi-agent-sandbox-tools
- 標題：
  - H2：設定範例
  - H2：設定優先順序
  - H3：沙箱設定
  - H3：工具限制
  - H2：從單一代理程式遷移
  - H2：工具限制範例
  - H2：常見陷阱：「非主要」
  - H2：測試
  - H2：疑難排解
  - H2：相關內容

## tools/music-generation.md

- 路由：/tools/music-generation
- 標題：
  - H2：快速開始
  - H2：支援的供應商
  - H3：能力矩陣
  - H2：工具參數
  - H2：非同步行為
  - H3：工作生命週期
  - H2：設定
  - H3：模型選擇
  - H3：供應商選擇順序
  - H2：供應商注意事項
  - H2：選擇適合的途徑
  - H2：供應商能力模式
  - H2：即時測試
  - H2：相關內容

## tools/ollama-search.md

- 路由：/tools/ollama-search
- 標題：
  - H2：設定
  - H2：設定內容
  - H2：驗證與要求路由
  - H2：相關內容

## tools/parallel-search.md

- 路由：/tools/parallel-search
- 標題：
  - H2：安裝外掛
  - H2：API 金鑰（付費供應商）
  - H2：設定
  - H2：覆寫基礎 URL
  - H2：工具參數
  - H2：注意事項
  - H2：相關內容

## tools/pdf.md

- 路由：/tools/pdf
- 標題：
  - H2：可用性
  - H2：輸入參考
  - H2：支援的 PDF 參照
  - H2：執行模式
  - H3：原生供應商模式
  - H3：擷取後援模式
  - H2：設定
  - H2：輸出詳細資料
  - H2：錯誤行為
  - H2：範例
  - H2：相關內容

## tools/permission-modes.md

- 路由：/tools/permission-modes
- 標題：
  - H2：建議的預設值
  - H2：OpenClaw 主機執行模式
  - H2：Codex Guardian 對應關係
  - H2：ACPX 測試框架權限
  - H2：選擇模式
  - H2：相關內容

## tools/perplexity-search.md

- 路由：/tools/perplexity-search
- 標題：
  - H2：安裝外掛
  - H2：取得 Perplexity API 金鑰
  - H2：OpenRouter 相容性
  - H2：設定範例
  - H3：原生 Perplexity Search API
  - H3：OpenRouter / Sonar 相容性
  - H2：金鑰的設定位置
  - H2：工具參數
  - H3：網域篩選規則
  - H2：注意事項
  - H2：相關內容

## tools/plugin.md

- 路由：/tools/plugin
- 標題：
  - H2：需求
  - H2：快速開始
  - H2：設定
  - H3：選擇安裝來源
  - H3：操作者安裝政策
  - H3：設定外掛政策
  - H2：瞭解外掛格式
  - H2：外掛鉤子
  - H2：驗證作用中的閘道
  - H2：疑難排解
  - H3：外掛路徑擁有權遭封鎖
  - H3：外掛工具設定緩慢
  - H2：相關內容

## tools/reactions.md

- 路由：/tools/reactions
- 標題：
  - H2：運作方式
  - H2：頻道行為
  - H2：回應層級
  - H2：相關內容

## tools/searxng-search.md

- 路由：/tools/searxng-search
- 標題：
  - H2：設定
  - H2：設定
  - H2：環境變數
  - H2：外掛設定參考
  - H2：注意事項
  - H2：相關內容

## tools/self-learning.md

- 路由：/tools/self-learning
- 標題：
  - H2：啟用自我學習
  - H2：手動檢閱過往工作階段
  - H2：OpenClaw 可以學習的內容
  - H2：何時執行經驗檢閱
  - H2：檢閱器收到的內容
  - H2：提案安全性
  - H2：檢閱已學習的提案
  - H2：設定
  - H2：疑難排解
  - H3：長時間執行一輪後未出現提案
  - H3：Doctor 回報 Workshop 工具已隱藏
  - H3：出現過多低價值提案
  - H2：相關內容

## tools/show-widget.md

- 路由：/tools/show-widget
- 標題：
  - H2：使用工具
  - H2：安全性與儲存
  - H2：相關內容

## tools/skill-workshop.md

- 路由：/tools/skill-workshop
- 標題：
  - H2：運作方式
  - H2：生命週期
  - H2：生命週期策展
  - H2：聊天
  - H3：從近期工作中學習
  - H2：命令列介面
  - H2：提案內容
  - H2：支援檔案
  - H2：代理程式工具
  - H2：建議的 Skills
  - H3：掃描過往工作階段
  - H2：核准與自主性
  - H2：閘道方法
  - H2：儲存
  - H2：限制
  - H2：疑難排解
  - H3：工具政策診斷
  - H2：相關內容

## tools/skills-config.md

- 路由：/tools/skills-config
- 標題：
  - H2：載入（skills.load）
  - H2：安裝（skills.install）
  - H2：操作者安裝政策（security.installPolicy）
  - H2：隨附 Skill 允許清單
  - H2：個別 Skill 項目（skills.entries）
  - H2：代理程式允許清單（agents）
  - H2：Workshop（skills.workshop）
  - H2：以符號連結連結的 Skill 根目錄
  - H2：沙箱化 Skills 與環境變數
  - H2：載入順序提醒
  - H2：相關內容

## tools/skills.md

- 路由：/tools/skills
- 標題：
  - H2：載入順序
  - H2：由節點託管的 Skills
  - H2：個別代理程式與共用 Skills
  - H2：代理程式允許清單
  - H2：外掛與 Skills
  - H2：Skill Workshop
  - H2：從 ClawHub 安裝
  - H2：安全性
  - H2：SKILL.md 格式
  - H3：選用的 frontmatter 鍵
  - H2：條件限制
  - H3：安裝程式規格
  - H2：設定覆寫
  - H2：環境注入
  - H2：快照與重新整理
  - H2：Token 影響
  - H2：相關內容

## tools/slash-commands.md

- 路由：/tools/slash-commands
- 標題：
  - H2：三種命令類型
  - H2：設定
  - H2：命令清單
  - H3：核心命令
  - H3：Dock 命令
  - H3：隨附外掛命令
  - H3：Skill 命令
  - H2：/tools：代理程式目前可使用的工具
  - H2：/model：模型選擇
  - H2：/config：寫入磁碟設定
  - H2：/mcp：MCP 伺服器設定
  - H2：/debug：僅限執行階段的覆寫
  - H2：/plugins：外掛管理
  - H2：/trace：外掛追蹤輸出
  - H2：/btw：附帶問題
  - H2：介面注意事項
  - H2：提供者用量與狀態
  - H2：相關內容

## tools/steer.md

- 路由：/tools/steer
- 標題：
  - H2：目前工作階段
  - H2：引導與佇列的比較
  - H2：子代理程式
  - H2：ACP 工作階段
  - H2：相關內容

## tools/subagents.md

- 路由：/tools/subagents
- 標題：
  - H2：斜線命令
  - H3：對話串繫結控制
  - H3：產生行為
  - H2：上下文模式
  - H2：工具：sessionsspawn
  - H3：委派提示模式
  - H3：工具參數
  - H3：任務名稱與目標指定
  - H2：工具：sessionsyield
  - H2：工具：subagents
  - H2：繫結至對話串的工作階段
  - H3：支援對話串的頻道
  - H3：快速流程
  - H3：手動控制
  - H3：設定開關
  - H3：允許清單
  - H3：探索
  - H3：自動封存
  - H2：巢狀子代理程式
  - H3：深度層級
  - H3：公告鏈
  - H3：依深度設定工具政策
  - H3：個別代理程式產生上限
  - H3：串聯停止
  - H2：驗證
  - H2：公告
  - H3：公告上下文
  - H3：統計資料行
  - H3：偏好 sessionshistory 的原因
  - H2：工具政策
  - H3：透過設定覆寫
  - H2：並行處理
  - H2：存活狀態與復原
  - H2：停止
  - H2：限制
  - H2：相關內容

## tools/tavily.md

- 路由：/tools/tavily
- 標題：
  - H2：開始使用
  - H2：工具參考
  - H3：tavilysearch
  - H3：tavilyextract
  - H2：選擇適合的工具
  - H2：進階設定
  - H2：相關內容

## tools/thinking.md

- 路由：/tools/thinking
- 標題：
  - H2：功能
  - H2：解析順序
  - H2：設定工作階段預設值
  - H2：依代理程式套用
  - H2：快速模式（/fast）
  - H2：詳細輸出指示詞（/verbose 或 /v）
  - H2：外掛追蹤指示詞（/trace）
  - H2：推理可見性（/reasoning）
  - H2：相關內容
  - H2：心跳偵測
  - H2：網頁聊天使用者介面
  - H2：提供者設定檔

## tools/tokenjuice.md

- 路由：/tools/tokenjuice
- 標題：
  - H2：啟用外掛
  - H2：Tokenjuice 變更的內容
  - H2：驗證其是否正常運作
  - H2：停用外掛
  - H2：相關內容

## tools/tool-search.md

- 路由：/tools/tool-search
- 標題：
  - H2：一輪的執行方式
  - H2：模式
  - H2：存在原因
  - H2：API
  - H2：執行階段邊界
  - H2：設定
  - H2：提示與遙測
  - H2：端對端驗證
  - H2：失敗行為
  - H2：相關內容

## tools/trajectory.md

- 路由：/tools/trajectory
- 標題：
  - H2：快速開始
  - H2：存取
  - H2：記錄的內容
  - H2：套件檔案
  - H2：擷取資料儲存
  - H2：停用擷取
  - H2：調整排清逾時
  - H2：隱私權與限制
  - H2：疑難排解
  - H2：相關內容

## tools/tts.md

- 路由：/tools/tts
- 標題：
  - H2：快速開始
  - H2：支援的提供者
  - H2：設定
  - H3：個別代理程式語音覆寫
  - H2：角色設定
  - H3：最小角色設定
  - H3：完整角色設定（提供者中立提示）
  - H3：角色設定解析
  - H3：提供者如何使用角色設定提示
  - H3：後援政策
  - H2：模型驅動的指示詞
  - H2：斜線命令
  - H2：個別使用者偏好設定
  - H2：輸出格式
  - H2：自動 TTS 行為
  - H2：欄位參考
  - H2：代理程式工具
  - H2：閘道 RPC
  - H2：服務連結
  - H2：相關內容

## tools/video-generation.md

- 路由：/tools/video-generation
- 標題：
  - H2：快速開始
  - H2：非同步生成的運作方式
  - H3：任務生命週期
  - H2：支援的提供者
  - H3：功能矩陣
  - H2：工具參數
  - H3：必要項目
  - H3：內容輸入
  - H3：樣式控制
  - H3：進階
  - H4：後援與具型別選項
  - H2：動作
  - H2：模型選擇
  - H2：提供者注意事項
  - H2：提供者功能模式
  - H2：即時測試
  - H2：設定
  - H2：相關內容

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
  - H2：限制與安全性
  - H2：工具設定檔
  - H2：相關內容

## tools/web.md

- 路由：/tools/web
- 標題：
  - H2：快速開始
  - H2：選擇供應商
  - H3：供應商比較
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
  - H2：相關內容

## tts.md

- 路由：/tts
- 標題：
  - H2：相關內容

## vps.md

- 路由：/vps
- 標題：
  - H2：選擇供應商
  - H2：雲端設定的運作方式
  - H2：先強化管理員存取安全
  - H2：VPS 上的公司共用代理程式
  - H2：搭配 VPS 使用節點
  - H2：小型 VM 與 ARM 主機的啟動調校
  - H3：systemd 調校檢查清單（選用）
  - H2：相關內容

## web/control-ui.md

- 路由：/web/control-ui
- 標題：
  - H2：快速開啟（本機）
  - H2：裝置配對（首次連線）
  - H2：配對行動裝置
  - H2：個人身分（瀏覽器本機）
  - H2：執行階段設定端點
  - H2：閘道主機狀態
  - H2：語言支援
  - H2：外觀主題
  - H2：管理外掛
  - H2：側邊欄導覽
  - H2：新工作階段頁面
  - H2：目前可執行的操作
  - H2：匯入助理記憶
  - H2：MCP 頁面
  - H2：活動分頁
  - H2：操作員終端機
  - H2：瀏覽器面板
  - H2：聊天行為
  - H2：連線中斷與重新連線
  - H2：安裝 PWA 與網頁推播
  - H2：託管嵌入內容
  - H2：聊天訊息寬度
  - H2：Tailnet 存取（建議）
  - H2：不安全的 HTTP
  - H2：內容安全政策
  - H2：頭像路由驗證
  - H2：助理媒體路由驗證
  - H2：核准連結
  - H2：空白的控制介面頁面
  - H2：偵錯／測試：開發伺服器 + 遠端閘道
  - H2：相關內容

## web/dashboard.md

- 路由：/web/dashboard
- 標題：
  - H2：快速途徑（建議）
  - H2：驗證基本概念（本機與遠端）
  - H2：在 Telegram 中開啟
  - H2：如果看到「unauthorized」／1008
  - H2：相關內容

## web/index.md

- 路由：/web
- 標題：
  - H2：設定（預設啟用）
  - H2：網路鉤子
  - H2：管理員 HTTP RPC
  - H2：Tailscale 存取
  - H2：安全性注意事項
  - H2：建置使用者介面

## web/lobster.md

- 路由：/web/lobster
- 標題：
  - H2：你正在查看的內容
  - H2：它何時出現
  - H2：你可以執行的操作
  - H2：關閉（或重新開啟）造訪功能
  - H2：Lobsterdex
  - H2：實地筆記
  - H2：隱私權

## web/tui.md

- 路由：/web/tui
- 標題：
  - H2：快速開始
  - H3：閘道模式
  - H3：本機模式
  - H2：你會看到的內容
  - H2：心智模型：代理程式 + 工作階段
  - H2：傳送 + 遞送
  - H2：選擇器 + 覆疊層
  - H2：鍵盤快速鍵
  - H2：斜線命令
  - H2：本機 Shell 命令
  - H2：Crestodian 設定與修復輔助工具
  - H2：工具輸出
  - H2：終端機色彩
  - H2：歷史記錄 + 串流
  - H2：連線詳細資料
  - H2：選項
  - H2：疑難排解
  - H2：連線疑難排解
  - H2：相關內容

## web/webchat.md

- 路由：/web/webchat
- 標題：
  - H2：功能簡介
  - H2：快速開始
  - H2：運作方式
  - H3：對話記錄與遞送模型
  - H2：控制介面的代理程式工具面板
  - H2：遠端使用
  - H2：設定參考（WebChat）
  - H2：相關內容

## web/workspaces.md

- 路由：/web/workspaces
- 標題：
  - H2：啟用工作區
  - H2：預設工作區
  - H2：內建小工具
  - H2：來源追溯
  - H2：自訂小工具
  - H2：命令列介面
  - H2：儲存空間

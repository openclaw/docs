---
read_when:
    - 你希望 OpenClaw 識別目前使用中的 Mac
    - 你正在偵錯最後輸入活動或作用中節點選取問題
    - 你想了解節點連線通知的路由方式
summary: 偵測你最近使用的 Mac，並將節點警示路由至該處
title: 主動電腦在線狀態
x-i18n:
    generated_at: "2026-07-21T22:39:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f1d1d0e98b1f3b7478cf80696dc693677b57897b07260cce30938e9187c314
    source_path: nodes/presence.md
    workflow: 16
---

使用中的電腦狀態會告知閘道，哪個已連線的 macOS 節點最近接收到
實體滑鼠或鍵盤輸入。OpenClaw 會使用此訊號將其中一台 Mac 標記為
`active`、為代理提供穩定的使用中節點提示，並將節點連線警示路由至
你最可能正在使用的電腦。

這與[系統狀態](/zh-TW/concepts/presence)不同；後者是閘道用戶端的即時
名冊。它也不同於持久性 `node.presence.alive` 信標；這些信標會
記錄行動節點上次喚醒的時間，但不會將其視為已連線。

## 需求

- OpenClaw macOS App 已配對，並以節點模式連線。
- 已啟用 **Settings -> Permissions -> Active computer detection**。此功能預設為關閉。
- 已授予已簽署的 OpenClaw App **Accessibility** 權限。
- 若要接收連線警示，也必須授予 **Notifications** 權限，且
  Mac 節點需公開 `system.notify`。

活動回報目前由原生 macOS 節點實作。iOS、Android、watchOS
及無頭節點主機可以回報連線或背景最後出現狀態，但不會競爭
使用中電腦的指定資格。

## 檢查使用中的電腦

1. 在 macOS App 中開啟 **Settings -> Permissions**、啟用
   **Active computer detection**，並在 macOS System Settings 中授予 **Accessibility**。
2. 確認 Mac 節點已連線：

   ```bash
   openclaw nodes status --connected
   ```

3. 在該 Mac 上移動滑鼠或按下按鍵，然後執行：

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

狀態最新且符合資格的 Mac 會標記為 `active`。狀態輸出會顯示其最後輸入
經過的時間；`describe` 會公開 `active`、`lastActiveAtMs` 和 `presenceUpdatedAtMs`。
活動會刻意合併，因此在最近一次回報後，顯示內容可能最多需要約 15
秒才會反映另一次輸入。

## 活動如何成為狀態

macOS 回報器每兩秒取樣一次 HID 系統閒置時鐘。節點連線
就緒時會回報一次，之後回報較新的實體活動時，每 15 秒最多一次。
閒置期間則每三分鐘傳送一次存活訊號。閒置時間上限為 30 天，
因此很久以前的樣本不會隨時間向前漂移，並錯誤地成為最新電腦。

停用 **Active computer detection** 會停止取樣，並透過目前的節點連線
傳送經驗證的清除事件。閘道會立即移除該 Mac 保留的活動時間戳記，
並重新計算使用中的電腦；其他節點功能與進行中的工作仍會保持連線。
如果已連線的閘道版本早於此清除動作，Mac 節點會重新連線一次，
讓中斷連線時的清理作業改為移除保留的活動。

只有在下列條件全部成立時，閘道才會接受活動：

- 事件屬於該節點 ID 目前已驗證的連線；
- 節點具有有效的 `accessibility: true` 權限；
- 承載資料包含有界整數 `idleSeconds` 值。

閘道會從自身的觀察時間減去 `idleSeconds`，以推導出
`lastActiveAtMs`。它絕不信任節點提供的實際時鐘時間戳記。在
已連線且符合資格的 Mac 中，最新的 `lastActiveAtMs` 勝出；若時間相同，
則採用最近一次狀態更新。

狀態僅存在於程序本機，並與連線綁定。中斷目前的
工作階段、以使用相同節點 ID 的另一個工作階段取代它，或撤銷
Accessibility，都會清除該節點的活動狀態，並重新計算使用中的 Mac。

## 隱私權與模型內容

活動分享預設為關閉，且與用於 UI 自動化的 Accessibility 授權
彼此獨立。OpenClaw 傳送的是閒置時間，而非輸入內容。它不會傳送按鍵值、
滑鼠座標、應用程式名稱、視窗標題或原始輸入事件。
macOS 回報器會讀取硬體 HID 狀態，因此合成的電腦控制
事件不會讓自動化 Mac 看起來像是你實際操作過的電腦。

持續活動不會建立面向模型的系統事件。動態
執行階段行僅包含經驗證的節點 ID：

```text
active_node=<node-id>
```

提示中不會包含確切時間戳記及由節點控制的顯示名稱，以
避免提示注入及快取頻繁變動。代理需要目前的詳細資訊時，
可改用 `nodes` 工具讀取 `node.list` 或 `node.describe`。

## 連線警示如何路由

節點在核准後完成第一次成功的閘道交握後，
OpenClaw 會等待 750 毫秒，讓正在連線的 Mac 提交第一個
活動樣本。接著會嘗試向已連線、支援通知且活動最新的 Mac 傳送通知。

- 如果主要傳送成功，其他 Mac 都不會收到警示。
- 如果沒有可用的使用中 Mac，或主要傳送失敗，OpenClaw 會等待五
  秒，然後嘗試所有其餘已連線且公開 `system.notify` 的 Mac。
- 之後的重新連線不會發出通知。閘道會將成功的連線
  記錄於配對中繼資料，因此閘道重新啟動時，不會針對每個
  先前已連線的節點重新播放警示。

警示會綁定至經驗證的節點身分。相同節點的替代工作階段會
接管其待處理的首次連線警示；如果執行傳送時該節點已
不再連線，警示便會取消。

## 疑難排解

| 症狀                                      | 檢查                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 沒有任何資料列標記為 `active`  | 確認已啟用使用中電腦偵測、原生 macOS 節點已連線，且 `openclaw nodes describe --node <id>` 顯示 `permissions.accessibility: true`。                                                                       |
| 錯誤的 Mac 仍維持使用中狀態               | 實際操作該 Mac、等待合併時間窗結束，然後重新執行 `openclaw nodes status`。合成的電腦控制動作不列入計算。                                                                    |
| 最後輸入資料消失                          | 檢查 Mac 是否已中斷連線、其節點工作階段是否已被取代，或 Accessibility 是否遭撤銷。每種情況都會刻意清除活動。                                                           |
| 警示出現在多台 Mac 上                     | 主要傳送無法使用或失敗，因此執行了延遲備援。確認使用中的 Mac 已連線、允許通知，且公開 `system.notify`。                                                             |
| 代理未提及使用中的 Mac                    | 活動變更後開始新的對話輪次。執行階段提示穩定且精簡；若要取得確切的目前中繼資料，請使用 `nodes` 工具。                                                       |

如需 TCC 復原資訊，請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。如需節點
連線及命令失敗的相關資訊，請參閱[節點疑難排解](/zh-TW/nodes/troubleshooting)。

## 相關內容

- [節點](/zh-TW/nodes)
- [節點命令列介面](/zh-TW/cli/nodes)
- [系統狀態](/zh-TW/concepts/presence)
- [閘道通訊協定](/zh-TW/gateway/protocol#presence)
- [macOS App](/zh-TW/platforms/macos)

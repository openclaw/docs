---
read_when:
    - 你希望 OpenClaw 識別目前使用中的 Mac
    - 你正在偵錯最後輸入活動或作用中節點選擇問題
    - 你想了解節點連線通知的路由方式
summary: 偵測你最近使用的 Mac，並將節點警示傳送至該處
title: 電腦目前在線
x-i18n:
    generated_at: "2026-07-19T13:52:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c1d9ed66ed89580c51040026a7c054f76434446eb43a505fea79ee3412431771
    source_path: nodes/presence.md
    workflow: 16
---

主動電腦狀態會告知閘道，哪個已連線的 macOS 節點最近收到實體滑鼠或鍵盤輸入。OpenClaw 會使用此訊號將一台 Mac 標記為 `active`、為代理程式提供穩定的作用中節點提示，並將節點連線警示路由至你最可能正在使用的電腦。

這與[系統在線狀態](/zh-TW/concepts/presence)不同；後者是閘道用戶端的即時名單。它也不同於持久性的 `node.presence.alive` 信標；後者記錄行動裝置節點上次喚醒的時間，但不會將其視為已連線。

## 需求

- OpenClaw macOS App 已配對，並以節點模式連線。
- 已向經過簽署的 OpenClaw App 授予 **Accessibility** 權限。
- 若要接收連線警示，還必須授予 **Notifications** 權限，且 Mac 節點必須公開 `system.notify`。

活動回報目前由原生 macOS 節點實作。iOS、Android、watchOS 和無頭節點主機可以回報連線或背景最後上線狀態，但不會競爭主動電腦的指定資格。

## 檢查主動電腦

1. 在 macOS App 中開啟 **Settings -> Permissions**，並在 macOS System Settings 中授予 **Accessibility** 權限。
2. 確認 Mac 節點已連線：

   ```bash
   openclaw nodes status --connected
   ```

3. 在該 Mac 上移動滑鼠或按下按鍵，然後執行：

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

活動時間最新且符合資格的 Mac 會標記為 `active`。狀態輸出會顯示其距離上次輸入的時間；`describe` 會公開 `active`、`lastActiveAtMs` 和 `presenceUpdatedAtMs`。系統會刻意合併活動回報，因此在最近一次回報後，顯示內容最多可能需要約 15 秒才會反映另一次輸入。

## 活動如何轉換為在線狀態

macOS 回報程式每兩秒取樣一次 HID 系統閒置時鐘。節點連線就緒時會回報一次，此後每 15 秒最多回報一次較新的實體活動。閒置期間，它每三分鐘傳送一次保持連線訊號。閒置時間上限為 30 天，以免非常舊的樣本隨時間向前偏移，並錯誤地成為最新的電腦。

閘道僅會在以下所有條件成立時接受活動：

- 事件屬於該節點 ID 目前已驗證身分的連線；
- 節點具有有效的 `accessibility: true` 權限；
- 酬載包含有界整數 `idleSeconds` 值。

閘道會從自身的觀察時間減去 `idleSeconds`，以推導出 `lastActiveAtMs`。它絕不信任節點提供的實際時鐘時間戳記。在已連線且符合資格的 Mac 中，最新的 `lastActiveAtMs` 勝出；若時間相同，則採用最近一次在線狀態更新。

在線狀態僅限目前處理程序，且繫結至連線。中斷目前工作階段、以使用相同節點 ID 的另一個工作階段取代它，或撤銷 Accessibility 權限，都會清除該節點的活動狀態並重新計算主動 Mac。

## 隱私權與模型脈絡

OpenClaw 傳送的是閒置時間，而非輸入內容。它不會傳送按鍵值、滑鼠座標、應用程式名稱、視窗標題或原始輸入事件。macOS 回報程式會讀取硬體 HID 狀態，因此合成的電腦控制事件不會讓自動化 Mac 看起來像是你實際使用過的電腦。

持續活動不會建立面向模型的系統事件。動態執行階段行只包含已驗證身分的節點 ID：

```text
active_node=<node-id>
```

精確時間戳記和由節點控制的顯示名稱不會進入提示，以避免提示注入和快取頻繁變動。代理程式需要目前詳細資料時，可以改用 `nodes` 工具讀取 `node.list` 或 `node.describe`。

## 連線警示如何路由

節點在獲得核准後完成第一次成功的閘道交握時，OpenClaw 會等待 750 毫秒，讓正在連線的 Mac 提交第一個活動樣本。接著，它會嘗試使用活動時間最新、已連線且支援通知的 Mac。

- 如果主要傳送成功，其他 Mac 都不會收到警示。
- 如果沒有可用的主動 Mac，或主要傳送失敗，OpenClaw 會等待五秒，然後嘗試所有其他已連線且公開 `system.notify` 的 Mac。
- 後續重新連線不會發出通知。閘道會在配對中繼資料中記錄成功的連線，因此重新啟動閘道不會對先前所有已連線的節點重播警示。

警示會繫結至已驗證身分的節點識別資訊。同一節點的替代工作階段會接管其待處理的首次連線警示；如果執行傳送時該節點已不再連線，警示便會取消。

## 疑難排解

| 症狀                                      | 檢查                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 沒有任何資料列標記為 `active`  | 確認原生 macOS 節點已連線，且 `openclaw nodes describe --node <id>` 顯示 `permissions.accessibility: true`。                                                                                            |
| 錯誤的 Mac 持續處於作用中                 | 實際操作該 Mac，等待活動合併時間窗結束，然後重新執行 `openclaw nodes status`。合成的電腦控制動作不計入。                                                                   |
| 上次輸入資料消失                          | 檢查 Mac 是否已中斷連線、其節點工作階段是否已被取代，或 Accessibility 權限是否已撤銷。每種情況都會刻意清除活動。                                                      |
| 警示出現在多台 Mac 上                     | 主要傳送無法使用或失敗，因此執行了延遲備援。確認主動 Mac 已連線、允許通知，且公開 `system.notify`。                                                                 |
| 代理程式未提及主動 Mac                    | 活動變更後開始新的對話輪次。執行階段提示穩定且精簡；請使用 `nodes` 工具取得目前的精確中繼資料。                                                            |

如需復原 TCC，請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。如需處理節點連線與命令失敗，請參閱[節點疑難排解](/zh-TW/nodes/troubleshooting)。

## 相關內容

- [節點](/zh-TW/nodes)
- [節點命令列介面](/zh-TW/cli/nodes)
- [系統在線狀態](/zh-TW/concepts/presence)
- [閘道通訊協定](/zh-TW/gateway/protocol#presence)
- [macOS App](/zh-TW/platforms/macos)

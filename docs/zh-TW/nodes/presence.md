---
read_when:
    - 你希望 OpenClaw 識別目前使用中的 Mac
    - 你正在偵錯最近輸入活動或作用中節點的選擇問題
    - 你想要瞭解節點連線通知的路由方式
summary: 偵測你最近使用的 Mac，並將節點提醒傳送到該裝置
title: 電腦目前在線
x-i18n:
    generated_at: "2026-07-12T14:38:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

主動電腦狀態會告知閘道，哪個已連線的 macOS 節點最近接收到實體滑鼠或鍵盤輸入。OpenClaw 會使用此訊號將一台 Mac 標記為 `active`、為代理提供穩定的作用中節點提示，並將節點連線警示路由至你最可能正在使用的電腦。

這與[系統在線狀態](/zh-TW/concepts/presence)不同；後者是閘道用戶端的即時名冊。它也不同於持久的 `node.presence.alive` 信標；這類信標會記錄行動節點上次喚醒的時間，但不會將其視為已連線。

## 需求

- OpenClaw macOS App 已配對，並以節點模式連線。
- 已授予簽署版 OpenClaw App **Accessibility** 權限。
- 若要接收連線警示，還必須授予 **Notifications** 權限，且 Mac 節點須公開 `system.notify`。

活動回報目前由原生 macOS 節點實作。iOS、Android、watchOS 與無頭節點主機可以回報連線或背景最後出現狀態，但不會參與作用中電腦資格的競爭。

## 檢查作用中電腦

1. 在 macOS App 中開啟 **Settings -> Permissions**，並在 macOS System Settings 中授予 **Accessibility**。
2. 確認 Mac 節點已連線：

   ```bash
   openclaw nodes status --connected
   ```

3. 在該 Mac 上移動滑鼠或按下按鍵，接著執行：

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

最新且符合資格的 Mac 會標記為 `active`。狀態輸出會顯示其距離上次輸入的時間；`describe` 則會公開 `active`、`lastActiveAtMs` 與 `presenceUpdatedAtMs`。活動會刻意合併回報，因此在最近一次回報後，顯示內容最多可能需要約 15 秒才會反映另一次輸入。

## 活動如何轉換為在線狀態

macOS 回報器每兩秒取樣一次 HID 系統閒置時鐘。節點連線準備就緒時會回報一次，之後回報較新的實體活動時，頻率不會超過每 15 秒一次。閒置期間，每三分鐘傳送一次保持連線訊號。閒置時間上限為 30 天，避免非常舊的樣本隨時間向前漂移，因而被誤判為最新的電腦。

只有在下列條件全部成立時，閘道才會接受活動：

- 事件屬於該節點 ID 目前已驗證的連線；
- 節點具有有效的 `accessibility: true` 權限；
- 承載資料包含有界整數 `idleSeconds` 值。

閘道會從自身的觀測時間減去 `idleSeconds`，以推導出 `lastActiveAtMs`。它絕不信任節點提供的實際時鐘時間戳記。在已連線且符合資格的 Mac 之中，`lastActiveAtMs` 最新者勝出；若時間相同，則使用最近一次在線狀態更新來判定。

在線狀態僅限目前處理程序，並與連線綁定。中斷目前工作階段、以使用相同節點 ID 的另一個工作階段取代它，或撤銷 Accessibility 權限，都會清除該節點的活動狀態，並重新計算作用中的 Mac。

## 隱私權與模型上下文

OpenClaw 傳送的是閒置時間，而非輸入內容。它不會傳送按鍵值、滑鼠座標、應用程式名稱、視窗標題或原始輸入事件。macOS 回報器會讀取硬體 HID 狀態，因此合成的電腦控制事件不會讓自動化 Mac 看起來像是你實際使用的電腦。

持續活動不會建立提供給模型的系統事件。動態執行階段行只包含已驗證的節點 ID：

```text
active_node=<node-id>
```

確切時間戳記與由節點控制的顯示名稱不會放入提示詞，以避免提示詞注入與快取頻繁變動。當代理需要目前的詳細資料時，可以改用 `nodes` 工具讀取 `node.list` 或 `node.describe`。

## 連線警示如何路由

節點完成閘道交握後，OpenClaw 會等待 750 毫秒，讓正在連線的 Mac 提交第一個活動樣本。接著，它會嘗試將警示傳送至已連線、支援通知且活動最新的 Mac。

- 如果主要傳送成功，其他 Mac 不會收到警示。
- 如果沒有可用的作用中 Mac，或主要傳送失敗，OpenClaw 會等待五秒，然後嘗試所有其餘已連線且公開 `system.notify` 的 Mac。
- 實際嘗試傳送後，同一節點的重新連線警示會停用五分鐘，避免反覆重新連線造成通知風暴。

警示會綁定至確切的節點連線。已中斷連線或遭取代的來源工作階段無法完成先前排定的警示，而替代的目標連線仍可參與備援傳送。

## 疑難排解

| 症狀                                      | 檢查                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 沒有任何資料列標記為 `active`             | 確認原生 macOS 節點已連線，且 `openclaw nodes describe --node <id>` 顯示 `permissions.accessibility: true`。                                                          |
| 錯誤的 Mac 仍維持作用中                    | 實際使用該 Mac，等待合併回報時間窗結束，然後重新執行 `openclaw nodes status`。合成的電腦控制動作不列入計算。                                                         |
| 上次輸入資料消失                           | 檢查 Mac 是否已中斷連線、其節點工作階段是否遭取代，或 Accessibility 是否遭撤銷。每種情況都會刻意清除活動。                                                          |
| 警示出現在多台 Mac 上                      | 主要傳送不可用或失敗，因此執行了延遲備援。確認作用中的 Mac 已連線、允許通知，且公開 `system.notify`。                                                               |
| 代理未提及作用中的 Mac                     | 活動變更後開始新的對話輪次。執行階段提示會保持穩定且精簡；如需確切的目前中繼資料，請使用 `nodes` 工具。                                                             |

如需復原 TCC，請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。如需處理節點連線與命令失敗，請參閱[節點疑難排解](/zh-TW/nodes/troubleshooting)。

## 相關內容

- [節點](/zh-TW/nodes)
- [節點命令列介面](/zh-TW/cli/nodes)
- [系統在線狀態](/zh-TW/concepts/presence)
- [閘道通訊協定](/zh-TW/gateway/protocol#presence)
- [macOS App](/zh-TW/platforms/macos)

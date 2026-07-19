---
read_when:
    - 收到 Barnacle 或 ClawSweeper 的意見回饋後進行後續處理
    - 請 ClawSweeper 進行審查
    - 偵錯 Barnacle、ClawSweeper、過時標籤或自動關閉問題
sidebarTitle: PR review flow
summary: Barnacle 和 ClawSweeper 的意見回饋如何協助推動 OpenClaw 的 PR 通過審查。
title: PR 審查流程
x-i18n:
    generated_at: "2026-07-19T14:06:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e9bec4578d55d2279450e991480467946db7da5ca956f85c35b4221190b2babe
    source_path: reference/pull-request-review-flow.md
    workflow: 16
---

本頁說明你開啟或更新 OpenClaw PR 後的審查流程：Barnacle 與 ClawSweeper 的作用、如何依據其回饋改善 PR，以及自動化系統沒有回應時應檢查的事項。

Barnacle 與 ClawSweeper 協助維護者讓審查佇列維持可用狀態，但無法取代維護者的判斷。

## Barnacle

Barnacle 是採用確定性規則的 GitHub 分流工具。它會尋找已知的佇列管理情況，並以標籤、留言或關閉項目來回應。

Barnacle 可能會在以下情況採取行動：

- PR 內文幾乎空白，或缺少問題背景；
- PR 沒有實用的佐證；
- 僅文件、僅測試、僅重構、僅 CI 或基礎設施變更缺少已連結的
  維護者背景資訊；
- 變更看起來應屬於 ClawHub 或外掛，而非核心；
- 分支包含不相關的工作；
- 作者有超過 20 個未結 PR。

Barnacle 透過受信任的儲存庫工作流程程式碼執行。它不會簽出或執行貢獻者的程式碼。

大多數分流標籤都是提供給維護者或自動化系統的訊號，因此貢獻者不需要自行新增標籤。

## ClawSweeper

ClawSweeper 是 OpenClaw 儲存庫使用的 AI 輔助審查與維護機器人。它可以審查 PR、評估佐證、留下可長期保留的審查留言，並透過受控的修復或自動合併流程協助維護者。

ClawSweeper 的正面結果只是輔助佐證，不代表維護者核准。維護者仍會決定 PR 是否以及何時可供合併。

ClawSweeper 採用佇列機制。開啟 PR、推送提交或新增審查要求後，請勿期待立即收到回應。ClawSweeper 執行後的標籤更新也可能需要一些時間。

新的 PR 會進入 ClawSweeper 審查佇列。維護者也可以透過標籤或命令將審查、修復或自動合併流程加入佇列。對於一般貢獻者的更新，請僅在更新分支、PR 說明、佐證或程式碼後，才要求 ClawSweeper 再次審查。接著，透過新的 PR 留言要求重新審查：

```text
@clawsweeper re-review
```

PR 作者也可以使用 `@clawsweeper re-run`；擁有儲存庫寫入
權限的使用者可以對任何未結項目使用任一命令。純
`@clawsweeper review` 命令僅限維護者使用。請耐心等候：在完成要求的變更
之前再次提出要求，只會增加佇列雜訊。

ClawSweeper 留下審查對話時，請將其視為一般審查回饋，並使用下方的後續檢查清單。

如果有人類貢獻者或維護者已接手 PR 並正在積極處理，請勿同時召喚 ClawSweeper 或以其他方式處理該 PR。請先讓人類完成審查或修復。如果活動停止，請檢查是否已要求作者提供佐證或進行其他更新。

## 在審查期間改善 PR

Barnacle、ClawSweeper 或維護者回應後，請將該回饋作為 PR 的後續步驟檢查清單。

1. 將 ClawSweeper 的 `Rank-up moves:` 與 `Proof guidance:` 視為該 PR 的待辦清單。
   評分與標籤是審查訊號，而非固定的合併目標。
2. 推送要求的程式碼或文件變更；如果問題、解決方案、使用者影響或佐證有所變更，
   也請更新 PR 說明。
3. 新增要求的佐證，並使用與變更相符的證據。
4. 自行解決已處理的審查對話。只有在需要維護者或審查者判斷時，
   才回覆並讓對話保持未解決狀態。
5. 僅在分支、PR 說明、佐證與相關 CI 結果均為最新狀態後，才要求重新審查。作者、
   維護者與 ClawSweeper 之間進行多輪更新與審查是正常情況。
6. 盡可能將討論留在 PR 中。僅當 PR 需要維護者協調、自動化系統看似受阻，
   或難以透過 GitHub 留言確定下一項決策時，才移至 Discord 上的 `#clawtributors`。
   請附上 PR 連結、目前狀態，以及具體問題或仍缺少的佐證。

請讓 PR 內文保持最新。留言有助於討論，但 PR 說明才是維護者與自動化系統會再次查閱的長期摘要。

`status: ⏳ waiting on author` 表示下一步應由 PR 作者處理：
請更新分支、PR 說明、佐證，或回覆並提供缺少的背景資訊，之後再要求另一次審查。

實用的佐證包括聚焦的測試輸出、CI 結果、螢幕截圖、錄影、終端機輸出、即時觀察結果、經遮蔽處理的日誌或成品連結。對於視覺變更，在可行時請附上變更前後的螢幕截圖。佐證檔案應優先使用 CI 成品連結、上傳至 GitHub 的螢幕截圖或錄影，或簡短且經遮蔽處理的日誌摘錄。除非產生的佐證檔案是實際文件、測試或產品變更的一部分，否則請勿提交。

遮蔽敏感資料是貢獻者的責任。發布佐證前，請移除機密、權杖、私人 URL、使用者資料及不相關的日誌。

OpenClaw 也使用獨立的停滯項目自動化機制。未指派的議題與 PR 可能會在 14 天無活動後標記為停滯，並在又閒置 7 天後關閉。已指派的 PR 會在開啟 27 天後標記為停滯，無論之後是否有更新，接著若停滯 7 天且沒有活動便會關閉。如果已指派的 PR 仍在處理中，請與負責該 PR 的維護者協調。

## 自動化系統沒有回應時

如果維護者已在處理該項目、審查或修復要求仍在佇列中、事件屬於例行事項，或 ClawSweeper 處理管道未針對要求的動作進行設定，自動化系統可能不會回應。

如果受信任的工作流程必須執行不受信任的貢獻者程式碼，自動化系統也可能不採取行動。在此情況下，維護者會改用一般審查或更安全的工作流程。

## 疑難排解

如果 ClawSweeper 沒有立即回應，請稍候再重試。此服務採用佇列機制，重複留言或變更標籤只會讓討論串更難審查，並不會加快佇列處理速度。

尋求協助前，請檢查：

- PR 說明為最新狀態；
- 最新提交包含要求的變更；
- CI 已完成，或 PR 內文已說明任何尚未解決的失敗為何
  與該 PR 無關；
- 最新的審查要求是透過 PR 留言提出：
  `@clawsweeper re-review`；
- 沒有維護者或貢獻者正在積極處理該 PR；
- 最新要求已超出 ClawSweeper 的正常佇列延遲時間。

如果 PR 更新完成數小時後仍未收到 ClawSweeper 回應，或 PR 看似受到自動化系統阻礙，請前往 Discord 的 `#clawtributors` 尋求協助。請附上 PR 連結、你的預期結果、提出要求的時間，以及自上次機器人留言後所做的變更。

## 分叉自動化系統

想要使用類似審查自動化功能的專案可以研究或分叉 ClawSweeper：

- [openclaw/clawsweeper](https://github.com/openclaw/clawsweeper)
- [ClawSweeper 文件](https://clawsweeper.bot/)

## 相關內容

- [貢獻指南](https://github.com/openclaw/openclaw/blob/main/CONTRIBUTING.md)
- [CI 流水線](/zh-TW/ci)

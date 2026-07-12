---
read_when:
    - 你需要尋找先前工作階段中討論過的內容
    - 你想了解工作階段搜尋的隱私權或索引機制
summary: 搜尋過往工作階段逐字稿，並重新開啟相符的內容脈絡
title: 工作階段搜尋
x-i18n:
    generated_at: "2026-07-12T14:26:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# 工作階段搜尋

`sessions_search` 會搜尋你自己過往工作階段中的使用者與助理文字。每筆結果都包含 `sessionKey`、時間戳記、角色，以及簡短的相符摘錄。需要查看前後對話內容時，請將傳回的 `sessionKey` 傳給 `sessions_history`。

## 可見性與輸出

搜尋使用與 `sessions_history` 相同的工作階段可見性規則。在套用結果數量限制之前，會先移除呼叫者可見工作階段樹之外的結果。啟用所建立工作階段的可見性時，沙箱化代理程式仍只能存取由其建立的工作階段。

摘錄會先經過遮蔽處理，再傳回給模型。結果也會受到數量、摘錄長度及回應總大小的限制。

## 索引生命週期

OpenClaw 會在每個代理程式的 SQLite 資料庫中，將全文索引儲存在對話記錄資料列旁。新的使用者與助理訊息會在持久化訊息的同一筆交易中建立索引，因此索引絕不會落後於即時對話；工具結果、推理區塊與圖片則不會納入索引。只有對話記錄的作用中分支可供搜尋。

索引建立前的對話記錄（例如由 `openclaw doctor` 匯入的工作階段），以及作用中分支曾回溯的工作階段，會由下一次搜尋時啟動的背景協調程序重新建立索引。因此，包含 `indexing: true` 的回應可能不完整；請在索引建立完成後重試。刪除工作階段時，會在同一筆交易中移除其索引項目。

搜尋目前使用 SQLite 的 Unicode 單字斷詞器，並移除附加符號。未來將改進為使用三元組斷詞，以支援 CJK 子字串比對。

## 工作階段搜尋與記憶搜尋

若要在原始工作階段對話記錄中搜尋確切字詞或片語，請使用 `sessions_search`。若要搜尋持久記憶檔案及進行語意回想，請使用 [`memory_search`](/zh-TW/concepts/memory-search)。實驗性的工作階段記憶語料庫，是這項精確對話記錄搜尋的語意補充。

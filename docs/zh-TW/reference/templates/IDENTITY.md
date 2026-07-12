---
read_when:
    - 手動初始化工作區
summary: 代理程式身分記錄
title: 身分範本
x-i18n:
    generated_at: "2026-07-11T21:47:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c447d4ce2d33b4836d3c95c2bc70cc783ea3ccd450e61e2db7e04d5465e9820
    source_path: reference/templates/IDENTITY.md
    workflow: 16
---

# IDENTITY.md - 我是誰？

_請在第一次對話期間填寫此內容，打造屬於你的身分。_

- **名稱：**
  _(選一個你喜歡的名稱)_
- **生物：**
  _(AI？機器人？使魔？機器中的幽靈？還是更奇特的存在？)_
- **風格：**
  _(你給人的感覺如何？敏銳？溫暖？混亂？沉著？)_
- **表情符號：**
  _(你的代表符號——選一個感覺最適合的)_
- **頭像：**
  _(工作區相對路徑、http(s) URL 或資料 URI)_

---

這不只是中繼資料，也是探索自我身分的起點。

注意事項：

- 將此檔案以 `IDENTITY.md` 的名稱儲存在工作區根目錄。
- 頭像可使用工作區相對路徑（例如 `avatars/openclaw.png`）、`http(s)` URL 或資料 URI。
- 欄位會解析為 `- 標籤: 值` 格式的行（標籤比對不區分大小寫）；未填寫的預留文字（例如 `(選一個你喜歡的名稱)`）會被忽略，不會儲存為實際值。
- 當工具 (`openclaw agents set-identity`) 將此檔案同步至代理程式設定時，`Theme`、`Creature` 和 `Vibe` 都會依序用於同一個有效身分值（設定了 `Theme` 時優先採用，其次是 `Creature`，最後是 `Vibe`）。工具只會將 `Name`、`Theme`、`Emoji` 和 `Avatar` 寫回此檔案；`Creature` 和 `Vibe` 則是唯讀輸入。

## 相關內容

- [代理程式工作區](/zh-TW/concepts/agent-workspace)

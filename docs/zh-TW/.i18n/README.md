---
x-i18n:
    generated_at: "2026-04-30T02:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1cf417b0c04d001bc494fbe03ac2fcb66866f759e21646dbfd1a9c3a968bff
    source_path: .i18n/README.md
    workflow: 16
---

# OpenClaw 文件 i18n 資產

此資料夾存放來源文件儲存庫的翻譯設定。

產生的語系頁面和即時語系翻譯記憶現在位於發布儲存庫（`openclaw/docs`，本機同層 checkout `~/Projects/openclaw-docs`）。

## 檔案

- `glossary.<lang>.json` — 偏好的術語對應（用於提示指引）。
- `<lang>.tm.jsonl` — 以工作流程 + 模型 + 文字雜湊為索引鍵的翻譯記憶（快取）。在此儲存庫中，語系 TM 檔案會隨需產生。

## 詞彙表格式

`glossary.<lang>.json` 是項目陣列：

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

欄位：

- `source`：偏好使用的英文（或來源）片語。
- `target`：偏好的翻譯輸出。

## 備註

- 詞彙表項目會作為**提示指引**傳遞給模型（不進行確定性重寫）。
- `scripts/docs-i18n` 仍負責翻譯產生。
- 來源儲存庫會將英文文件同步至發布儲存庫；語系產生會在該處依語系於推送、排程和 release dispatch 時執行。

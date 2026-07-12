---
read_when:
    - 撰寫包含權杖、API 金鑰或憑證片段的文件
    - 更新可能會被祕密偵測工具掃描的範例
summary: 適用於文件與範例、可避免觸發機密掃描器的預留位置慣例
title: 密鑰預留位置慣例
x-i18n:
    generated_at: "2026-07-11T21:48:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# 機密資訊預留位置慣例

使用容易理解、但不會看似真實機密資訊的預留位置。

## 建議樣式

- 優先使用描述性值，例如 `example-openai-key-not-real` 或 `example-discord-bot-token`。
- 在 Shell 程式碼片段中，優先使用 `${OPENAI_API_KEY}`，而非內嵌類似權杖的字串。
- 確保範例明顯為假，且用途範圍明確（提供者、頻道、驗證類型）。

## 文件中應避免的模式

- PEM 私密金鑰標頭或頁尾的字面文字。
- 類似有效憑證的前綴，例如 `sk-...`、`xoxb-...`、`AKIA...`。
- 從執行階段日誌複製、外觀逼真的持有人權杖。

## 範例

```bash
# 良好
export OPENAI_API_KEY="example-openai-key-not-real"

# 更佳（當文件說明環境變數的串接方式時）
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```

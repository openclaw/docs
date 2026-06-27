---
read_when:
    - 撰寫包含權杖、API 金鑰或憑證片段的文件
    - 更新可能會被祕密偵測工具掃描的範例
summary: 密鑰掃描器安全的文件與範例預留位置慣例
title: 機密預留位置慣例
x-i18n:
    generated_at: "2026-06-27T20:00:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# 機密佔位符慣例

使用人類可讀、但不會像真實機密的佔位符。

## 建議風格

- 優先使用描述性值，例如 `example-openai-key-not-real` 或 `example-discord-bot-token`。
- 對於 shell 片段，優先使用 `${OPENAI_API_KEY}`，而不是內嵌類似權杖的字串。
- 讓範例明顯是假的，並限定在用途範圍內（提供者、頻道、驗證類型）。

## 在文件中避免這些模式

- 字面 PEM 私密金鑰標頭或結尾文字。
- 類似即時憑證的前綴，例如 `sk-...`、`xoxb-...`、`AKIA...`。
- 從執行階段記錄複製的、看起來真實的 bearer token。

## 範例

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```

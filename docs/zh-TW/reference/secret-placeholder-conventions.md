---
read_when:
    - 撰寫包含權杖、API 金鑰或憑證片段的文件
    - 更新可能被秘密偵測工具掃描的範例
summary: 適用於文件與範例且對秘密掃描器安全的預留位置慣例
title: 密鑰佔位符慣例
x-i18n:
    generated_at: "2026-07-05T11:45:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# 密鑰佔位符慣例

使用人類可讀、但不會類似真實密鑰的佔位符。

## 建議樣式

- 偏好描述性值，例如 `example-openai-key-not-real` 或 `example-discord-bot-token`。
- 對於 shell 片段，偏好使用 `${OPENAI_API_KEY}`，而不是內嵌看似權杖的字串。
- 讓範例明顯為假，且限定於用途範圍內（供應商、頻道、驗證類型）。

## 文件中應避免這些模式

- 文字形式的 PEM 私密金鑰標頭或結尾。
- 類似有效憑證的前綴，例如 `sk-...`、`xoxb-...`、`AKIA...`。
- 從執行階段記錄複製的、看起來逼真的 bearer 權杖。

## 範例

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```

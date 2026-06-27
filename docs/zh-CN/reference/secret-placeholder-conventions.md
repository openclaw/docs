---
read_when:
    - 编写包含令牌、API key 或凭证片段的文档
    - 更新可能被秘密检测工具扫描的示例
summary: 用于文档和示例的密钥扫描安全占位符约定
title: 密钥占位符约定
x-i18n:
    generated_at: "2026-06-27T03:18:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# 密钥占位符约定

使用人类可读但不像真实密钥的占位符。

## 推荐风格

- 优先使用描述性值，例如 `example-openai-key-not-real` 或 `example-discord-bot-token`。
- 对于 shell 片段，优先使用 `${OPENAI_API_KEY}`，而不是内联类似 token 的字符串。
- 让示例明显是假的，并限定在用途范围内（提供商、渠道、凭证类型）。

## 在文档中避免这些模式

- 字面量 PEM 私钥头部或尾部文本。
- 类似真实凭证的前缀，例如 `sk-...`、`xoxb-...`、`AKIA...`。
- 从运行时日志复制的看起来真实的 bearer tokens。

## 示例

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```

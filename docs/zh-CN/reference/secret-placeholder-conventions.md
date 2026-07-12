---
read_when:
    - 编写包含令牌、API 密钥或凭据片段的文档
    - 更新可能会被密钥检测工具扫描的示例
summary: 用于文档和示例、可安全通过密钥扫描器的占位符约定
title: 密钥占位符约定
x-i18n:
    generated_at: "2026-07-11T20:56:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# 密钥占位符约定

使用易于理解但不会与真实密钥混淆的占位符。

## 推荐样式

- 优先使用描述性值，例如 `example-openai-key-not-real` 或 `example-discord-bot-token`。
- 在 shell 代码片段中，优先使用 `${OPENAI_API_KEY}`，而不是内联的类令牌字符串。
- 确保示例显然是虚构的，并明确限定其用途（提供商、渠道、身份验证类型）。

## 文档中应避免的模式

- PEM 私钥头部或尾部的字面文本。
- 类似真实凭据的前缀，例如 `sk-...`、`xoxb-...`、`AKIA...`。
- 从运行时日志中复制的、看起来真实的持有者令牌。

## 示例

```bash
# 推荐
export OPENAI_API_KEY="example-openai-key-not-real"

# 更佳（当文档介绍环境变量连接方式时）
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```

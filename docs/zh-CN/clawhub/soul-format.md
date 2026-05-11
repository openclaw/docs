---
read_when:
    - 发布灵魂
    - 调试 soul 发布失败
summary: Soul 包格式、必需文件和限制。
x-i18n:
    generated_at: "2026-05-11T20:24:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fca15ae2faa83e204a1752d7110e5d8cdddc709cbc8808e4ae86d0f3039a147
    source_path: clawhub/soul-format.md
    workflow: 16
---

# 灵魂格式

## 磁盘上

灵魂是单个文件：

- `SOUL.md`（或 `soul.md`）

目前，onlycrabs.ai 会拒绝任何额外文件。

## `SOUL.md`

- Markdown，可包含可选的 YAML frontmatter。
- 服务器会在发布期间从 frontmatter 中提取元数据。
- `description` 会用作 UI/搜索中的灵魂摘要。

## 限制

- 总包大小：50MB。
- 嵌入文本仅包含 `SOUL.md`。

## Slug

- 默认从文件夹名称派生。
- 必须为小写且 URL 安全：`^[a-z0-9][a-z0-9-]*$`。

## 版本控制 + 标签

- 每次发布都会创建一个新版本（semver）。
- 标签是指向某个版本的字符串指针；通常使用 `latest`。

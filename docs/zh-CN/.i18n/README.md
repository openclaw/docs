---
x-i18n:
    generated_at: "2026-04-05T08:42:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: de830ce1fa9736e0a63dd97fa70d2d6b53da2b85c703bd2f17457742e4683ddf
    source_path: .i18n/README.md
    workflow: 15
---

# OpenClaw 文档 i18n 资源

此文件夹存储翻译配置，以及为发布仓库生成的 zh-CN 产物。

英文文档从源仓库（`openclaw/openclaw`）镜像而来。zh-CN 页面和 zh-CN 翻译记忆也在这里生成。

## 文件

- `glossary.<lang>.json` — 首选术语映射（用于提示词指导）。
- `<lang>.tm.jsonl` — 翻译记忆（缓存），按工作流 + 模型 + 文本哈希作为键。

## 术语表格式

`glossary.<lang>.json` 是一个条目数组：

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

字段：

- `source`: 英文（或源语言）短语，用于优先匹配。
- `target`: 首选翻译输出。

## 说明

- 术语表条目会作为模型的**提示词指导**传递（不进行确定性重写）。
- 翻译记忆由 `scripts/docs-i18n` 更新。
- 每次同步的源元数据位于 `.openclaw-sync/source.json` 下。

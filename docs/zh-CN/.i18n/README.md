---
x-i18n:
    generated_at: "2026-04-05T10:04:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 882637c63929082bde7d0f3d2faf6a2e1f95d283006f28c4841b529e72215398
    source_path: .i18n/README.md
    workflow: 15
---

# OpenClaw 文档 i18n 资源

此文件夹存放源文档仓库的翻译配置。

生成的 zh-CN 页面和在线 zh-CN 翻译记忆库位于发布仓库中：

- 仓库：`openclaw/docs`
- 本地检出：`~/Projects/openclaw-docs`

## 真实来源

- 英文文档编写于 `openclaw/openclaw`。
- 源文档树位于 `docs/` 下。
- 源仓库不再保留已提交的 `docs/zh-CN/**`。

## 端到端流程

1. 在 `openclaw/openclaw` 中编辑英文文档。
2. 推送到 `main`。
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` 会将文档树镜像到 `openclaw/docs`。
4. 同步脚本会重写发布仓库的 `docs/docs.json`，以便即使源仓库中已不再提交该内容，那里仍然存在 `zh-Hans` 导航。
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` 会在推送时和每小时刷新 `docs/zh-CN/**`。

## 为什么要这样拆分

- 让生成的 zh-CN 输出不进入主产品仓库。
- 让 Mintlify 保持单一的已发布文档树。
- 通过让发布仓库拥有 `docs/zh-CN/**` 来保留内置语言切换器。

## 此文件夹中的文件

- `glossary.<lang>.json` — 用作提示指导的首选术语映射。
- `zh-Hans-navigation.json` — 在同步期间重新插入发布仓库的 `zh-Hans` Mintlify 导航块。
- `<lang>.tm.jsonl` — 以工作流 + 模型 + 文本哈希为键的翻译记忆库。

在此仓库中，`docs/.i18n/zh-CN.tm.jsonl` 有意不再提交。

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

- `source`：英文（或源语言）短语，用于优先匹配。
- `target`：首选翻译输出。

## 翻译机制

- `scripts/docs-i18n` 仍然负责生成翻译。
- 文档模式会将 `x-i18n.source_hash` 写入每个已翻译页面。
- 发布工作流会通过比较当前英文源哈希与已存储的 zh-CN `x-i18n.source_hash`，预先计算待处理文件列表。
- 如果待处理数量为 `0`，则会完全跳过开销较大的翻译步骤。
- 如果存在待处理文件，工作流只会翻译这些文件。
- 发布工作流会重试临时性的模型格式失败，但未更改的文件仍会被跳过，因为每次重试都会运行相同的哈希检查。

## 操作说明

- 同步元数据会写入发布仓库中的 `.openclaw-sync/source.json`。
- 源仓库密钥：`OPENCLAW_DOCS_SYNC_TOKEN`
- 发布仓库密钥：`OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- 如果 zh-CN 输出看起来已过时，先检查 `openclaw/docs` 中的 `Translate zh-CN` 工作流。

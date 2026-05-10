---
x-i18n:
    generated_at: "2026-05-10T19:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb1075777cead58155336aa27359c8c149748bec8a854ff1de1f75a992b8c8f
    source_path: AGENTS.md
    workflow: 16
---

# 文档指南

此目录负责文档编写、Mintlify 链接规则和文档 i18n 策略。

## Mintlify 规则

- 文档托管在 Mintlify（`https://docs.openclaw.ai`）上。
- `docs/**/*.md` 中的内部文档链接必须保持根相对路径，且不带 `.md` 或 `.mdx` 后缀（示例：`[Config](/gateway/configuration)`）。
- 章节交叉引用应使用根相对路径上的锚点（示例：`[Hooks](/gateway/configuration-reference#hooks)`）。
- 文档标题应避免使用 em dash 和撇号，因为 Mintlify 的锚点生成在这些字符上很脆弱。
- README 和其他由 GitHub 渲染的文档应保留绝对文档 URL，以便链接在 Mintlify 之外也能工作。
- 文档内容必须保持通用：不要包含个人设备名称、主机名或本地路径；使用类似 `user@gateway-host` 的占位符。

## 文档内容规则

- 对于文档、UI 文案和选择器列表，除非章节明确描述运行时顺序或自动检测顺序，否则按字母顺序排列服务/提供商。
- 保持内置插件命名与根 `AGENTS.md` 中的仓库级插件术语规则一致。

## 内部文档

- 长期保留的私有操作员文档应放在 `~/Projects/manager/docs/` 中。
- 仓库本地的内部临时/镜像文档可以放在被忽略的 `docs/internal/` 下。
- 绝不要将 `docs/internal/**` 页面添加到 `docs/docs.json` 导航中，也不要从公开文档链接到它们。
- 如果之后强制添加了某个页面，`scripts/docs-sync-publish.mjs` 会从公开的 `openclaw/docs` 发布仓库中排除并清理 `docs/internal/**`。
- 内部文档可以提及仓库路径、私有应用名称、1Password 条目名称和运行手册，但绝不要包含密钥值。

## 文档 i18n

- 此仓库不维护外语文档。生成的发布输出位于单独的 `openclaw/docs` 仓库中（本地通常克隆为 `../openclaw-docs`）。
- 不要在此处的 `docs/<locale>/**` 下添加或编辑本地化文档。
- 将此仓库中的英文文档和术语表文件视为事实来源。
- 流程：在此处更新英文文档，按需更新 `docs/.i18n/glossary.<locale>.json`，然后让发布仓库同步并在 `openclaw/docs` 中运行 `scripts/docs-i18n`。
- 在重新运行 `scripts/docs-i18n` 之前，为任何必须保持英文或使用固定译法的新技术术语、页面标题或短导航标签添加术语表条目。
- `pnpm docs:check-i18n-glossary` 是用于检查已变更英文文档标题和短内部文档标签的守卫。
- 翻译记忆库位于发布仓库中生成的 `docs/.i18n/*.tm.jsonl` 文件。
- 请参阅 `docs/.i18n/README.md`。

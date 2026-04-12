---
x-i18n:
    generated_at: "2026-04-12T08:32:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6805814012caac6ff64f17f44f393975510c5af3421fae9651ed9033e5861784
    source_path: AGENTS.md
    workflow: 15
---

# 文档指南

本目录负责文档编写、Mintlify 链接规则以及文档 i18n 策略。

## Mintlify 规则

- 文档托管在 Mintlify（`https://docs.openclaw.ai`）。
- `docs/**/*.md` 中的内部文档链接必须保持为根相对路径，且不带 `.md` 或 `.mdx` 后缀（例如：`[Config](/configuration)`）。
- 章节交叉引用应在根相对路径上使用锚点（例如：`[Hooks](/configuration#hooks)`）。
- 文档标题应避免使用长破折号和撇号，因为 Mintlify 的锚点生成在这些情况下不稳定。
- README 和其他在 GitHub 上渲染的文档应保留绝对文档 URL，这样链接在 Mintlify 之外也能正常工作。
- 文档内容必须保持通用：不要使用个人设备名称、主机名或本地路径；请使用类似 `user@gateway-host` 的占位符。

## 文档内容规则

- 对于文档、UI 文案和选择器列表，服务 / 提供商应按字母顺序排列，除非该部分明确是在描述运行时顺序或自动检测顺序。
- 保持内置插件命名与根目录 `AGENTS.md` 中的全仓库插件术语规则一致。

## 文档 i18n

- 本仓库不维护外语文档。生成后的发布输出位于单独的 `openclaw/docs` 仓库中（本地通常克隆为 `../openclaw-docs`）。
- 不要在此处新增或编辑 `docs/<locale>/**` 下的本地化文档。
- 将本仓库中的英文文档和术语表文件视为事实来源。
- 流程：先在这里更新英文文档，再按需更新 `docs/.i18n/glossary.<locale>.json`，然后让发布仓库同步，并在 `openclaw/docs` 中运行 `scripts/docs-i18n`。
- 在重新运行 `scripts/docs-i18n` 之前，为任何新的技术术语、页面标题或必须保持英文或使用固定译法的简短导航标签添加术语表条目。
- `pnpm docs:check-i18n-glossary` 是用于检查英文文档标题和简短内部文档标签变更的守卫命令。
- 翻译记忆存储在发布仓库中生成的 `docs/.i18n/*.tm.jsonl` 文件里。
- 参见 `docs/.i18n/README.md`。

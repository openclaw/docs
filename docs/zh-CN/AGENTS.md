---
x-i18n:
    generated_at: "2026-06-27T01:17:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0c67d049eb1d0f1d4e675a71e69b2d34d3ce5c733ca9582bf08ac717c233644
    source_path: AGENTS.md
    workflow: 16
---

# 文档指南

此目录负责文档编写、Mintlify 链接规则和文档 i18n 政策。

## Mintlify 规则

- 文档托管在 Mintlify（`https://docs.openclaw.ai`）。
- `docs/**/*.md` 中的内部文档链接必须保持根相对路径，且不带 `.md` 或 `.mdx` 后缀（示例：`[Config](/gateway/configuration)`）。
- 章节交叉引用应在根相对路径上使用锚点（示例：`[Hooks](/gateway/configuration-reference#hooks)`）。
- 文档标题应避免使用破折号和撇号，因为 Mintlify 的锚点生成在这些字符上不稳定。
- README 和其他由 GitHub 渲染的文档应保留绝对文档 URL，以便链接在 Mintlify 之外也能工作。
- 文档内容必须保持通用：不要包含个人设备名称、主机名或本地路径；使用类似 `user@gateway-host` 的占位符。

## 文档内容规则

- 对于文档、UI 文案和选择器列表，除非该章节明确描述运行时顺序或自动检测顺序，否则服务/提供商应按字母顺序排列。
- 保持内置插件命名与根 `AGENTS.md` 中的全仓库插件术语规则一致。

## 内部文档

- 长期维护的私有操作员文档应放在 `~/Projects/manager/docs/`。
- 仓库本地的内部草稿/镜像文档可以放在被忽略的 `docs/internal/` 下。
- 永远不要将 `docs/internal/**` 页面添加到 `docs/docs.json` 导航中，也不要从公开文档链接到它们。
- 如果页面后来被强制添加，`scripts/docs-sync-publish.mjs` 会从公开的 `openclaw/docs` 发布仓库中排除并清理 `docs/internal/**`。
- 内部文档可以提及仓库路径、私有应用名称、1Password 项目名称和运行手册，但绝不能包含密钥值。

## 成熟度评分卡编辑

`taxonomy.yaml` 和 `qa/maturity-scores.yaml` 是源输入；`docs/maturity/` 下生成的成熟度文档是投影，不应手动编辑评分、LTS、分类法、QA 配置文件或证据表。
`scripts/qa/render-maturity-docs.ts` 负责生成；使用 `pnpm maturity:render` 刷新已提交的文档，并使用 `pnpm maturity:check` 验证它们。
`.github/workflows/maturity-scorecard.yml` 会渲染工件预览，并可打开生成文档的 PR；`.github/workflows/openclaw-release-checks.yml` 会在发布 QA 时调度它。
除非维护者明确要求提交经过脱敏的投影，否则请将确定性的 `qa-evidence.json.scorecard` 数据保留在 GitHub Actions 工件中。
人工覆盖必须在 PR 中更改源状态，并说明原因以及公开或已脱敏的证据。

## 文档 i18n

- 外语文档不在此仓库中维护。生成的发布输出位于单独的 `openclaw/docs` 仓库中（本地通常克隆为 `../openclaw-docs`）。
- 不要在此处的 `docs/<locale>/**` 下添加或编辑本地化文档。
- 将此仓库中的英文文档加上术语表文件视为事实来源。
- 流程：在此处更新英文文档，按需更新 `docs/.i18n/glossary.<locale>.json`，然后让发布仓库同步，并在 `openclaw/docs` 中运行 `scripts/docs-i18n`。
- 在重新运行 `scripts/docs-i18n` 之前，为任何必须保留英文或使用固定译法的新技术术语、页面标题或短导航标签添加术语表条目。
- `pnpm docs:check-i18n-glossary` 是针对已更改英文文档标题和短内部文档标签的守卫。
- 翻译记忆位于发布仓库中生成的 `docs/.i18n/*.tm.jsonl` 文件内。
- 参见 `docs/.i18n/README.md`。

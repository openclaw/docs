---
x-i18n:
    generated_at: "2026-07-11T20:18:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# 文档指南

此目录负责文档编写、Mintlify 链接规则和文档国际化策略。

## Mintlify 规则

- 文档托管在 Mintlify（`https://docs.openclaw.ai`）上。
- `docs/**/*.md` 中的内部文档链接必须使用相对于根目录的路径，且不带 `.md` 或 `.mdx` 后缀（示例：`[配置](/gateway/configuration)`）。
- 跨章节引用应在相对于根目录的路径上使用锚点（示例：`[Hooks](/gateway/configuration-reference#hooks)`）。
- 文档标题应避免使用长破折号和撇号，因为 Mintlify 的锚点生成在处理这些字符时并不可靠。
- README 和其他由 GitHub 渲染的文档应保留文档的绝对 URL，以便链接在 Mintlify 之外也能正常工作。
- 文档内容必须保持通用：不得包含个人设备名称、主机名或本地路径；应使用 `user@gateway-host` 等占位符。

## 文档内容规则

- 对于文档、UI 文案和选择器列表，服务和提供商应按字母顺序排列，除非该章节明确描述运行时顺序或自动检测顺序。
- 内置插件的命名应与根目录 `AGENTS.md` 中适用于整个仓库的插件术语规则保持一致。
- 以下为生成的文档，切勿手动编辑：`docs/plugins/reference/**`、`docs/plugins/reference.md` 和 `docs/plugins/plugin-inventory.md` 由 `pnpm plugins:inventory:gen` 生成；`docs/docs_map.md` 由 `pnpm docs:map:gen` 生成；`docs/maturity/**` 由 `pnpm maturity:render` 生成。

## 内部文档

- 长期维护的私有操作员文档应放在 `~/Projects/manager/docs/` 中。
- 仓库内的内部草稿或镜像文档可以放在被忽略的 `docs/internal/` 下。
- 切勿将 `docs/internal/**` 页面添加到 `docs/docs.json` 导航中，也不要从公开文档链接到这些页面。
- 如果之后强制添加了页面，`scripts/docs-sync-publish.mjs` 会从公开的 `openclaw/docs` 发布仓库中排除并清理 `docs/internal/**`。
- 内部文档可以提及仓库路径、私有应用名称、1Password 项目名称和运行手册，但绝不能包含机密值。

## 成熟度评分卡编辑

`taxonomy.yaml` 和 `qa/maturity-scores.yaml` 是源输入；`docs/maturity/` 下生成的成熟度文档是投影视图，不应通过手动编辑来修改分数、LTS、分类法、QA 配置或证据表。
`scripts/qa/render-maturity-docs.ts` 负责生成；使用 `pnpm maturity:render` 刷新已提交的文档，并使用 `pnpm maturity:check` 验证这些文档。
`.github/workflows/maturity-scorecard.yml` 会渲染构件预览，并可为生成的文档创建 PR；`.github/workflows/openclaw-release-checks.yml` 会在发布 QA 时分派该工作流。
除非维护者明确要求提交经过净化的投影视图，否则应将确定性的 `qa-evidence.json.scorecard` 数据保留在 GitHub Actions 构件中。
人工覆盖必须在 PR 中修改源状态，并说明原因以及提供公开或经过脱敏的证据。

## 文档国际化

- 本仓库不维护外语文档。生成的发布输出位于独立的 `openclaw/docs` 仓库中（本地通常克隆为 `../openclaw-docs`）。
- 不要在此处添加或编辑 `docs/<locale>/**` 下的本地化文档。
- 将本仓库中的英文文档和术语表文件视为唯一可信来源。
- 流程：在此处更新英文文档，按需更新 `docs/.i18n/glossary.<locale>.json`，然后由发布仓库进行同步，并在 `openclaw/docs` 中运行 `scripts/docs-i18n`。
- 重新运行 `scripts/docs-i18n` 前，请为任何必须保留英文或使用固定译法的新技术术语、页面标题或简短导航标签添加术语表条目。
- `pnpm docs:check-i18n-glossary` 用于检查已更改的英文文档标题和简短内部文档标签。
- 翻译记忆库存储在发布仓库中生成的 `docs/.i18n/*.tm.jsonl` 文件内。
- 请参阅 `docs/.i18n/README.md`。

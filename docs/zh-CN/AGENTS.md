---
x-i18n:
    generated_at: "2026-07-05T11:00:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# 文档指南

此目录负责文档编写、Mintlify 链接规则和文档 i18n 策略。

## Mintlify 规则

- 文档托管在 Mintlify（`https://docs.openclaw.ai`）。
- `docs/**/*.md` 中的内部文档链接必须保持根相对路径，且不带 `.md` 或 `.mdx` 后缀（示例：`[Config](/gateway/configuration)`）。
- 章节交叉引用应在根相对路径上使用锚点（示例：`[Hooks](/gateway/configuration-reference#hooks)`）。
- 文档标题应避免使用长破折号和撇号，因为 Mintlify 的锚点生成在这些字符上很脆弱。
- README 和其他由 GitHub 渲染的文档应保留绝对文档 URL，这样链接在 Mintlify 之外也能工作。
- 文档内容必须保持通用：不要包含个人设备名称、主机名或本地路径；使用类似 `user@gateway-host` 的占位符。

## 文档内容规则

- 对于文档、UI 文案和选择器列表，除非该章节明确描述运行时顺序或自动检测顺序，否则服务/提供商应按字母顺序排列。
- 保持内置插件命名与根 `AGENTS.md` 中的全仓库插件术语规则一致。
- 生成的文档，不要手动编辑：`docs/plugins/reference/**`、`docs/plugins/reference.md` 和 `docs/plugins/plugin-inventory.md` 来自 `pnpm plugins:inventory:gen`；`docs/docs_map.md` 来自 `pnpm docs:map:gen`；`docs/maturity/**` 来自 `pnpm maturity:render`。

## 内部文档

- 长期保留的私有操作员文档应放在 `~/Projects/manager/docs/`。
- 仓库本地的内部草稿/镜像文档可以放在被忽略的 `docs/internal/` 下。
- 绝不要将 `docs/internal/**` 页面添加到 `docs/docs.json` 导航中，也不要从公开文档链接到它们。
- 如果某个页面后来被强制添加，`scripts/docs-sync-publish.mjs` 会从公开的 `openclaw/docs` 发布仓库中排除并清理 `docs/internal/**`。
- 内部文档可以提及仓库路径、私有应用名称、1Password 条目名称和运行手册，但绝不能包含密钥值。

## 成熟度评分卡编辑

`taxonomy.yaml` 和 `qa/maturity-scores.yaml` 是源输入；`docs/maturity/` 下生成的成熟度文档是投影，不应手动编辑分数、LTS、分类法、QA 配置文件或证据表。
`scripts/qa/render-maturity-docs.ts` 负责生成；使用 `pnpm maturity:render` 刷新已提交的文档，并使用 `pnpm maturity:check` 验证它们。
`.github/workflows/maturity-scorecard.yml` 会渲染构件预览，并可打开生成文档的 PR；`.github/workflows/openclaw-release-checks.yml` 会为发布 QA 调度它。
除非维护者明确要求提交经过净化的投影，否则将确定性的 `qa-evidence.json.scorecard` 数据保留在 GitHub Actions 构件中。
人工覆盖必须在 PR 中更改源状态，并说明原因以及公开或已脱敏的证据。

## 文档 i18n

- 外语文档不在此仓库中维护。生成的发布输出位于单独的 `openclaw/docs` 仓库中（本地通常克隆为 `../openclaw-docs`）。
- 不要在这里的 `docs/<locale>/**` 下添加或编辑本地化文档。
- 将此仓库中的英文文档和词汇表文件视为事实来源。
- 流程：在这里更新英文文档，按需更新 `docs/.i18n/glossary.<locale>.json`，然后让发布仓库同步，并在 `openclaw/docs` 中运行 `scripts/docs-i18n`。
- 重新运行 `scripts/docs-i18n` 之前，为任何必须保留英文或使用固定译法的新技术术语、页面标题或短导航标签添加词汇表条目。
- `pnpm docs:check-i18n-glossary` 是针对已更改英文文档标题和短内部文档标签的保护检查。
- 翻译记忆库位于发布仓库中生成的 `docs/.i18n/*.tm.jsonl` 文件里。
- 参见 `docs/.i18n/README.md`。

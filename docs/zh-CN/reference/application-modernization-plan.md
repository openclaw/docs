---
read_when:
    - 规划一轮广泛的 OpenClaw 应用现代化改造
    - 更新应用或 Control UI 工作的前端实现标准
    - 将全面的产品质量评审转化为分阶段的工程工作
summary: 包含前端交付技能更新的全面应用现代化计划
title: 应用现代化计划
x-i18n:
    generated_at: "2026-05-06T05:01:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## 目标

在不破坏当前工作流、也不把风险隐藏在大范围重构中的前提下，将应用推进为更清晰、更快速、更易维护的产品。工作应以小型、可审查的分片落地，并为每个触及的表面提供证明。

## 原则

- 保留当前架构，除非某个边界已被证明会造成反复改动、性能成本或用户可见的 bug。
- 对每个问题优先采用最小的正确补丁，然后重复推进。
- 将必要修复与可选打磨分开，让维护者无需等待主观决策即可落地高价值工作。
- 保持面向插件的行为有文档记录且向后兼容。
- 在声称回归已修复之前，先验证已发布行为、依赖契约和测试。
- 优先改善主要用户路径：新手引导、凭证、聊天、提供商设置、插件管理和诊断。

## 阶段 1：基线审计

在修改之前盘点当前应用。

- 识别最重要的用户工作流以及拥有这些工作流的代码表面。
- 列出失效的交互入口、重复设置、不清晰的错误状态以及昂贵的渲染路径。
- 记录每个表面的当前验证命令。
- 将问题标记为必要、建议或可选。
- 记录需要所有者审查的已知阻塞项，尤其是 API、安全、发布和插件契约变更。

完成定义：

- 一份带有 repo 根目录文件引用的问题列表。
- 每个问题都有严重程度、所有者表面、预期用户影响和建议的验证路径。
- 不将推测性的清理项混入必要修复中。

## 阶段 2：产品和 UX 清理

优先处理可见工作流并消除混乱。

- 收紧围绕模型凭证、Gateway 网关状态和插件设置的新手引导文案与空状态。
- 移除或禁用没有可执行操作的失效交互入口。
- 让重要操作在响应式宽度下保持可见，而不是隐藏在脆弱的布局假设之后。
- 合并重复的状态语言，让错误只有一个事实来源。
- 为高级设置添加渐进式披露，同时保持核心设置快速。

建议验证：

- 首次运行设置和现有用户启动的手动成功路径。
- 针对任何路由、配置持久化或状态派生逻辑的聚焦测试。
- 对已变更响应式表面的浏览器截图。

## 阶段 3：前端架构收紧

在不进行大范围重写的情况下改善可维护性。

- 将重复的 UI 状态转换移动到窄范围的类型化辅助函数中。
- 保持数据获取、持久化和展示职责分离。
- 优先使用现有 hooks、stores 和组件模式，而不是新增抽象。
- 仅在能减少耦合或澄清测试时拆分过大的组件。
- 避免为本地面板交互引入宽泛的全局状态。

必要护栏：

- 不要因文件拆分的副作用改变公共行为。
- 保持菜单、对话框、标签页和键盘导航的可访问性行为完整。
- 验证加载、空、错误和乐观状态仍能渲染。

## 阶段 4：性能和可靠性

针对已测量到的痛点，而不是宽泛的理论优化。

- 测量启动、路由转换、大列表和聊天记录成本。
- 在性能分析证明有价值时，将重复的昂贵派生数据替换为记忆化选择器或缓存辅助函数。
- 减少热路径上可避免的网络或文件系统扫描。
- 在构造模型载荷之前，对提示词、注册表、文件、插件和网络输入保持确定性排序。
- 为热辅助函数和契约边界添加轻量级回归测试。

完成定义：

- 每项性能变更都记录基线、预期影响、实际影响和剩余差距。
- 在可以低成本测量时，不仅凭直觉落地性能补丁。

## 阶段 5：类型、契约和测试加固

提高用户和插件作者所依赖边界点的正确性。

- 用可区分联合或封闭代码列表替换松散的运行时字符串。
- 使用现有 schema 辅助函数或 zod 验证外部输入。
- 围绕插件清单、提供商目录、Gateway 网关协议消息和配置迁移行为添加契约测试。
- 将兼容路径放在 Doctor 或修复流程中，而不是启动时隐藏迁移。
- 避免仅为测试而耦合到插件内部机制；使用 SDK 门面和已记录的 barrel。

建议验证：

- `pnpm check:changed`
- 为每个已变更边界运行定向测试。
- 当懒加载边界、打包或已发布表面发生变化时运行 `pnpm build`。

## 阶段 6：文档和发布就绪

让面向用户的文档与行为保持一致。

- 随行为、API、配置、新手引导或插件变更更新文档。
- 仅为用户可见变更添加 changelog 条目。
- 面向用户使用插件术语；仅在贡献者需要时使用内部包名。
- 确认发布和安装说明仍与当前命令表面匹配。

完成定义：

- 相关文档与行为变更在同一分支中更新。
- 触及时，生成文档或 API 漂移检查通过。
- 交接说明列出任何跳过的验证及其原因。

## 建议的第一个分片

从有范围的 Control UI 和新手引导检查开始：

- 审计首次运行设置、提供商凭证就绪状态、Gateway 网关状态和插件设置表面。
- 移除失效操作并澄清失败状态。
- 为状态派生和配置持久化添加或更新聚焦测试。
- 运行 `pnpm check:changed`。

这能在架构风险有限的情况下带来较高用户价值。

## 前端技能更新

使用本节更新随现代化任务提供的前端聚焦 `SKILL.md`。如果将此指导作为 repo 本地 OpenClaw 技能采用，请先创建 `.agents/skills/openclaw-frontend/SKILL.md`，保留属于目标技能的 frontmatter，然后用以下内容添加或替换正文指导。

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```

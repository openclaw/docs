---
read_when:
    - 规划一次广泛的 OpenClaw 应用现代化改造
    - 更新应用或 Control UI 工作的前端实现标准
    - 将广泛的产品质量评审转化为分阶段的工程工作
summary: 全面的应用现代化计划，包含前端交付技能更新
title: 应用现代化计划
x-i18n:
    generated_at: "2026-07-05T11:40:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94d9afca6acbf19a93c265bb98f0fc0fcd85da8808680fa41d29d8c198bacb88
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## 目标

推动应用成为更清晰、更快速、更易维护的产品，同时不破坏当前工作流，也不在大范围重构中隐藏风险。以小型、可审查的切片落地，并为每个触及的表面提供证明。

## 原则

- 保留当前架构，除非某个边界被证明会造成反复变更、性能成本或用户可见的 bug。
- 对每个问题优先采用最小的正确补丁，然后重复推进。
- 将必需修复与可选打磨分开，让维护者无需等待主观决策即可合并高价值工作。
- 保持面向插件的行为有文档说明并向后兼容。
- 在声称回归已修复之前，验证已发布行为、依赖契约和测试。
- 优先改善主要用户路径：新手引导、认证、聊天、提供商设置、插件管理和诊断。

## 阶段 1：基线审计

在修改之前盘点当前应用。

- 识别最重要的用户工作流以及负责它们的代码表面。
- 列出无效入口、重复设置、不清晰的错误状态和昂贵的渲染路径。
- 捕获每个表面的当前验证命令。
- 将问题标记为必需、推荐或可选。
- 记录需要所有者审查的已知阻塞项，尤其是 API、安全、发布和插件契约变更。

完成定义：

- 一份包含 repo-root 文件引用的问题列表。
- 每个问题都有严重性、所有者表面、预期用户影响和建议的验证路径。
- 必需修复中不混入推测性的清理项。

## 阶段 2：产品和 UX 清理

优先处理可见工作流并消除困惑。

- 收紧围绕模型认证、Gateway 网关状态和插件设置的新手引导文案与空状态。
- 移除或禁用无法执行任何操作的无效入口。
- 让重要操作在响应式宽度下保持可见，而不是隐藏在脆弱的布局假设之后。
- 合并重复的状态语言，让错误只有一个事实来源。
- 为高级设置添加渐进式披露，同时保持核心设置快速完成。

推荐验证：

- 首次运行设置和现有用户启动的手动正常路径。
- 针对任何路由、配置持久化或状态派生逻辑的聚焦测试。
- 针对已更改响应式表面的浏览器截图。

## 阶段 3：前端架构收紧

在不进行大范围重写的情况下提升可维护性。

- 将重复的 UI 状态转换移入窄范围的类型化辅助函数。
- 保持数据获取、持久化和呈现职责分离。
- 优先使用现有钩子、存储和组件模式，而不是新增抽象。
- 仅在能降低耦合或澄清测试时拆分过大的组件。
- 避免为本地面板交互引入宽泛的全局状态。

必需护栏：

- 不要让文件拆分顺带改变公共行为。
- 保持菜单、对话框、标签页和键盘导航的可访问性行为完好。
- 验证加载、空、错误和乐观状态仍能渲染。

## 阶段 4：性能和可靠性

针对已测量的痛点，而不是宽泛的理论优化。

- 测量启动、路由切换、大列表和聊天记录成本。
- 在性能分析证明有价值时，用记忆化选择器或缓存辅助函数替换重复的昂贵派生数据。
- 减少热路径上可避免的网络或文件系统扫描。
- 在构造模型载荷之前，对提示、注册表、文件、插件和网络输入保持确定性排序。
- 为热路径辅助函数和契约边界添加轻量回归测试。

完成定义：

- 每项性能变更记录基线、预期影响、实际影响和剩余差距。
- 当廉价测量可用时，不仅凭直觉落地性能补丁。

## 阶段 5：类型、契约和测试加固

提升用户和插件作者依赖的边界点正确性。

- 用可辨识联合或封闭代码列表替换松散的运行时字符串。
- 使用现有 schema 辅助函数或 zod 验证外部输入。
- 围绕插件清单、提供商目录、Gateway 网关协议消息和配置迁移行为添加契约测试。
- 将兼容路径保留在 Doctor 或修复流程中，而不是启动时隐藏迁移。
- 避免测试专门耦合到插件内部；使用 SDK facade 和有文档说明的 barrel。

推荐验证：

- `pnpm check:changed`
- 针对每个已更改边界的定向测试。
- 当惰性边界、打包或已发布表面发生变化时运行 `pnpm build`。

## 阶段 6：文档和发布就绪

保持面向用户的文档与行为一致。

- 随行为、API、配置、新手引导或插件变更更新文档。
- 仅为用户可见变更添加 changelog 条目。
- 保持插件术语面向用户；仅在贡献者需要时使用内部包名。
- 确认发布和安装说明仍与当前命令表面匹配。

完成定义：

- 相关文档与行为变更在同一分支中更新。
- 触及时，生成文档或 API 漂移检查通过。
- 交接说明列出任何跳过的验证及其原因。

## 推荐的第一个切片

从有范围的 Control UI 和新手引导处理开始：

- 审计首次运行设置、提供商认证就绪状态、Gateway 网关状态和插件设置表面。
- 移除无效操作并澄清失败状态。
- 为状态派生和配置持久化添加或更新聚焦测试。
- 运行 `pnpm check:changed`。

这能在架构风险有限的情况下提供较高用户价值。

## 前端技能更新

使用本节更新随现代化任务提供的前端聚焦 `SKILL.md`。如果将此指南采纳为 repo-local OpenClaw 技能，请先创建 `.agents/skills/openclaw-frontend/SKILL.md`，保留属于该目标技能的 frontmatter，然后用以下内容添加或替换正文指南。

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

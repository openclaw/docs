---
read_when:
    - 调试仅限 Node 的开发脚本或监视模式故障
    - 调查 OpenClaw 中的 tsx/esbuild 加载器崩溃
summary: Node + tsx “__name is not a function” 崩溃说明及解决方法
title: Node + tsx 崩溃
x-i18n:
    generated_at: "2026-05-06T15:54:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Node + tsx “\_\_name is not a function” 崩溃

## 摘要

通过 Node 搭配 `tsx` 运行 OpenClaw 时，启动阶段会失败并显示：

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

这始于将开发脚本从 Bun 切换到 `tsx` 之后（提交 `2871657e`，2026-01-06）。相同运行时路径在 Bun 下可以正常工作。

## 环境

- Node：v25.x（在 v25.3.0 上观察到）
- tsx：4.21.0
- OS：macOS（复现也很可能出现在其他运行 Node 25 的平台上）

## 复现（仅 Node）

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## 仓库中的最小复现

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 版本检查

- Node 25.3.0：失败
- Node 22.22.0（Homebrew `node@22`）：失败
- Node 24：此处尚未安装；需要验证

## 备注 / 假设

- `tsx` 使用 esbuild 转换 TS/ESM。esbuild 的 `keepNames` 会生成 `__name` 辅助函数，并用 `__name(...)` 包装函数定义。
- 崩溃表明运行时 `__name` 存在但不是函数，这意味着在 Node 25 加载器路径中，该模块的辅助函数缺失或被覆盖。
- 其他 esbuild 使用者中也报告过类似的 `__name` 辅助函数问题，原因是辅助函数缺失或被重写。

## 回归历史

- `2871657e`（2026-01-06）：脚本从 Bun 改为 tsx，以便让 Bun 成为可选项。
- 在此之前（Bun 路径），`openclaw status` 和 `gateway:watch` 可以工作。

## 解决方法

- 对开发脚本使用 Bun（当前的临时回退方案）。
- 使用 `tsgo` 进行仓库类型检查，然后运行构建输出：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 历史备注：调试此 Node/tsx 问题时这里曾使用 `tsc`，但仓库类型检查通道现在使用 `tsgo`。
- 如果可以，在 TS 加载器中禁用 esbuild keepNames（防止插入 `__name` 辅助函数）；tsx 目前不暴露此选项。
- 使用 `tsx` 测试 Node LTS（22/24），以判断该问题是否特定于 Node 25。

## 参考

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 后续步骤

- 在 Node 22/24 上复现，以确认 Node 25 回归。
- 测试 `tsx` nightly，或在存在已知回归时固定到较早版本。
- 如果在 Node LTS 上可复现，带着 `__name` 堆栈跟踪向上游提交最小复现。

## 相关内容

- [Node.js 安装](/zh-CN/install/node)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)

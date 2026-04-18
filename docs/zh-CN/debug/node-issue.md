---
read_when:
    - 调试仅限 Node 的开发脚本或 watch 模式故障
    - 调查 OpenClaw 中的 tsx/esbuild 加载器崩溃
summary: Node + tsx “__name 不是函数” 崩溃说明与解决方法
title: Node + tsx 崩溃
x-i18n:
    generated_at: "2026-04-18T17:25:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx “\_\_name 不是函数” 崩溃

## 摘要

通过 Node 配合 `tsx` 运行 OpenClaw 时，启动阶段会失败，并报错：

```bash
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

这个问题出现在将开发脚本从 Bun 切换到 `tsx` 之后（提交 `2871657e`，2026-01-06）。同样的运行时路径此前在 Bun 下可以正常工作。

## 环境

- Node: v25.x（在 v25.3.0 上观察到）
- tsx: 4.21.0
- OS: macOS（在其他运行 Node 25 的平台上也很可能可以复现）

## 复现步骤（仅限 Node）

```bash
# 在仓库根目录
node --version
pnpm install
node --import tsx src/entry.ts status
```

## 仓库内最小复现

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 版本检查

- Node 25.3.0：失败
- Node 22.22.0（Homebrew `node@22`）：失败
- Node 24：这里尚未安装；仍需验证

## 说明 / 假设

- `tsx` 使用 esbuild 来转换 TS/ESM。esbuild 的 `keepNames` 会生成一个 `__name` 辅助函数，并使用 `__name(...)` 包装函数定义。
- 这个崩溃表明运行时存在 `__name`，但它不是函数，这意味着在 Node 25 的加载器路径中，该模块的辅助函数缺失或被覆盖了。
- 在其他使用 esbuild 的场景中，也有人报告过类似的 `__name` 辅助函数问题，通常是因为该辅助函数缺失或被重写。

## 回归历史

- `2871657e`（2026-01-06）：脚本从 Bun 改为 tsx，以便让 Bun 成为可选项。
- 在那之前（Bun 路径），`openclaw status` 和 `gateway:watch` 都可以正常工作。

## 解决方法

- 开发脚本继续使用 Bun（当前的临时回退方案）。
- 使用 `tsgo` 进行仓库类型检查，然后运行构建产物：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 历史说明：在调试这个 Node/tsx 问题时，这里曾使用过 `tsc`，但仓库当前的类型检查通道现在使用 `tsgo`。
- 如果 TS 加载器允许，禁用 esbuild 的 keepNames（这样可以避免插入 `__name` 辅助函数）；但 `tsx` 目前没有暴露这个选项。
- 使用 `tsx` 在 Node LTS（22/24）上测试，以确认该问题是否仅限于 Node 25。

## 参考资料

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 后续步骤

- 在 Node 22/24 上复现，以确认是否属于 Node 25 回归。
- 测试 `tsx` 夜ly 版本，或固定到更早版本（如果已知存在某个回归版本）。
- 如果在 Node LTS 上也能复现，带着 `__name` 堆栈跟踪向上游提交一个最小复现。

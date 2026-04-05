---
read_when:
    - 调试仅 Node 开发脚本或 watch 模式失败时
    - 调查 OpenClaw 中的 tsx/esbuild loader 崩溃时
summary: Node + tsx “__name is not a function” 崩溃说明与变通方案
title: Node + tsx 崩溃
x-i18n:
    generated_at: "2026-04-05T08:22:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx “\_\_name is not a function” 崩溃

## 摘要

通过 Node 和 `tsx` 运行 OpenClaw 时，会在启动时失败并报错：

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

这个问题出现在开发脚本从 Bun 切换到 `tsx` 之后（提交 `2871657e`，2026-01-06）。相同的运行时路径在 Bun 下可以正常工作。

## 环境

- Node：v25.x（在 v25.3.0 上观察到）
- tsx：4.21.0
- OS：macOS（在其他运行 Node 25 的平台上也很可能可复现）

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
- Node 24：这里尚未安装；需要验证

## 说明 / 假设

- `tsx` 使用 esbuild 转换 TS/ESM。esbuild 的 `keepNames` 会生成 `__name` 辅助函数，并用 `__name(...)` 包装函数定义。
- 该崩溃表明运行时 `__name` 存在，但不是函数，这意味着在 Node 25 的 loader 路径中，此模块的辅助函数缺失或被覆盖。
- 在其他使用 esbuild 的使用方中，也曾报告过类似的 `__name` 辅助函数问题，通常发生在该辅助函数缺失或被重写时。

## 回归历史

- `2871657e`（2026-01-06）：脚本从 Bun 改为 tsx，以便让 Bun 成为可选项。
- 在此之前（Bun 路径），`openclaw status` 和 `gateway:watch` 都能正常工作。

## 变通方案

- 对开发脚本使用 Bun（当前的临时回退方案）。
- 使用 Node + tsc watch，然后运行编译后的输出：

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- 已在本地确认：`pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` 在 Node 25 上可以正常工作。
- 如果可能，在 TS loader 中禁用 esbuild 的 keepNames（这样可以阻止插入 `__name` 辅助函数）；tsx 当前尚未暴露此配置。
- 使用 `tsx` 测试 Node LTS（22/24），以确认该问题是否是 Node 25 特有的问题。

## 参考资料

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 后续步骤

- 在 Node 22/24 上复现，以确认是否是 Node 25 回归。
- 测试 `tsx` nightly，或如果存在已知回归，则固定到更早版本。
- 如果在 Node LTS 上也能复现，请向上游提交一个最小复现，并附上 `__name` 堆栈跟踪。

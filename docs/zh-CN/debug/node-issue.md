---
read_when:
    - 调试纯 Node 开发脚本或 watch 模式故障
    - 排查 OpenClaw 中的 tsx / esbuild 加载器崩溃
summary: Node + tsx “__name is not a function” 崩溃说明与变通方案
title: Node + tsx 崩溃
x-i18n:
    generated_at: "2026-04-24T04:01:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Node + tsx “\_\_name is not a function” 崩溃

## 摘要

通过 Node 搭配 `tsx` 运行 OpenClaw 时，启动阶段会失败，并出现以下错误：

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

该问题始于将开发脚本从 Bun 切换到 `tsx` 之后（提交 `2871657e`，2026-01-06）。相同的运行时路径在 Bun 下可以正常工作。

## 环境

- Node：v25.x（在 v25.3.0 上观察到）
- tsx：4.21.0
- 操作系统：macOS（在其他运行 Node 25 的平台上也很可能可以复现）

## 复现步骤（仅 Node）

```bash
# 在仓库根目录中
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

## 说明 / 假设

- `tsx` 使用 esbuild 转换 TS / ESM。esbuild 的 `keepNames` 会生成一个 `__name` 辅助函数，并用 `__name(...)` 包装函数定义。
- 该崩溃表明运行时 `__name` 存在，但它不是一个函数，这意味着在 Node 25 加载器路径中，该模块的辅助函数缺失或被覆盖。
- 在其他 esbuild 使用方中，也曾报告过类似的 `__name` 辅助函数问题，通常发生在该辅助函数缺失或被重写时。

## 回归历史

- `2871657e`（2026-01-06）：脚本从 Bun 改为 tsx，以使 Bun 变为可选项。
- 在此之前（Bun 路径），`openclaw status` 和 `gateway:watch` 可以正常工作。

## 变通方案

- 对开发脚本使用 Bun（当前的临时回退方案）。
- 使用 `tsgo` 进行仓库类型检查，然后运行构建产物：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 历史说明：在调试这个 Node / tsx 问题时，这里曾使用 `tsc`，但仓库当前的类型检查流程现在使用 `tsgo`。
- 如果可能，在 TS 加载器中禁用 esbuild 的 `keepNames`（这样可防止插入 `__name` 辅助函数）；`tsx` 当前尚未暴露该选项。
- 在 Node LTS（22 / 24）上测试 `tsx`，以确认该问题是否是 Node 25 特有的。

## 参考资料

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 后续步骤

- 在 Node 22 / 24 上复现，以确认是否为 Node 25 回归。
- 测试 `tsx` nightly 版本，或固定到更早版本（如果存在已知回归）。
- 如果在 Node LTS 上也能复现，请向上游提交最小复现，并附上 `__name` 堆栈跟踪。

## 相关内容

- [Node.js 安装](/zh-CN/install/node)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)

---
read_when:
    - 调查提到缺少 __name 辅助函数的 tsx/esbuild 加载器崩溃
summary: 历史 Node + tsx "__name is not a function" 崩溃及其原因
title: Node + tsx 崩溃
x-i18n:
    generated_at: "2026-07-05T11:16:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx “\_\_name is not a function” 崩溃

## 状态

已解决。此崩溃无法在 `package.json` 中当前固定的 `tsx` 版本（`4.22.3`）或当前 Node 版本上复现。保留在此，以防未来 `tsx`/esbuild 升级再次引入它。

## 原始症状

通过 `tsx` 运行 OpenClaw 开发脚本时，启动阶段失败并显示：

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

行号已省略；自原始崩溃以来，这两个文件都已更改，具体行号不再匹配。

这出现在开发脚本从 Bun 切换到 `tsx`（`2871657e`，2026-01-06）以使 Bun 变为可选之后。等效的基于 Bun 的路径没有崩溃。它最初是在 macOS 上的 Node v25.3.0 中观察到的；其他运行 Node 25 的平台也被认为可能会受影响。

## 原因

`tsx` 通过 esbuild 转换 TS/ESM，并在其转换选项中硬编码 `keepNames: true`。该设置会让 esbuild 将命名函数/类声明包装到对 `__name` 辅助函数的调用中，从而让 `fn.name` 在压缩和打包后仍然保留。此崩溃意味着在受影响的 `tsx`/Node 组合中，该模块调用点处辅助函数缺失或被遮蔽，因此 `__name(...)` 抛出异常，而不是返回包装后的值。

## 当前复现检查

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

最小隔离复现（仅加载原始堆栈跟踪中的模块）：

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

这两个命令当前都能正常退出。如果任一命令再次抛出 `__name is not a function`，请在提交到上游前捕获准确的 Node 版本、`tsx` 版本（`node_modules/tsx/package.json`）以及完整堆栈跟踪。

## 变通方法（如果崩溃再次出现）

- 使用 Bun 运行开发脚本，而不是 `node --import tsx`。
- 运行 `pnpm tsgo` 进行类型检查，然后运行构建后的输出，而不是通过 `tsx` 运行源代码：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 尝试不同的 `tsx` 版本（`pnpm add -D tsx@<version>` 属于依赖变更，根据仓库策略需要批准），以二分判断它捆绑的 esbuild 版本是否重新引入了该 bug。
- 在不同的 Node 主版本/次版本上测试，以确认该失败是否特定于某个版本。

## 参考

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 相关内容

- [Node.js 安装](/zh-CN/install/node)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)

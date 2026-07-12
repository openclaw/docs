---
read_when:
    - 调查提及缺少 __name 辅助函数的 tsx/esbuild 加载器崩溃问题
summary: 历史 Node + tsx“__name 不是函数”崩溃及其原因
title: Node + tsx 崩溃
x-i18n:
    generated_at: "2026-07-11T20:31:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx “\_\_name 不是函数”崩溃

## 状态

已解决。使用 `package.json` 中当前锁定的 `tsx` 版本（`4.22.3`）或当前 Node 版本时，无法复现此崩溃。保留本文档，以备将来升级 `tsx`/esbuild 后再次出现此问题。

## 原始症状

通过 `tsx` 运行 OpenClaw 开发脚本时，启动失败并显示：

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

此处省略了行号；自最初发生崩溃以来，这两个文件都已发生变化，具体行号已不再对应。

为了让 Bun 成为可选依赖，开发脚本从 Bun 切换到 `tsx`（`2871657e`，2026-01-06）后出现了此问题。使用 Bun 的等效路径不会崩溃。此问题最初在 macOS 上的 Node v25.3.0 中观察到；当时认为运行 Node 25 的其他平台也可能受到影响。

## 原因

`tsx` 通过 esbuild 转换 TS/ESM，并在其转换选项中硬编码了 `keepNames: true`。此设置会让 esbuild 将具名函数/类声明包装在对 `__name` 辅助函数的调用中，以便 `fn.name` 在代码压缩和打包后仍然保留。此崩溃意味着，在受影响的 `tsx`/Node 组合中，该模块调用位置的辅助函数缺失或被遮蔽，因此 `__name(...)` 抛出异常，而不是返回包装后的值。

## 当前复现检查

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

最小化独立复现（仅加载原始堆栈跟踪中的模块）：

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

这两个命令目前都能正常退出。如果其中任一命令再次抛出 `__name is not a function`，请在向上游提交问题前，记录确切的 Node 版本、`tsx` 版本（`node_modules/tsx/package.json`）以及完整的堆栈跟踪。

## 临时解决方法（如果崩溃再次出现）

- 使用 Bun 运行开发脚本，而不是使用 `node --import tsx`。
- 运行 `pnpm tsgo` 进行类型检查，然后运行构建后的输出，而不是通过 `tsx` 运行源代码：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 尝试其他 `tsx` 版本（`pnpm add -D tsx@<version>` 属于依赖项变更，根据仓库策略需要获得批准），以通过二分排查其内置的 esbuild 版本是否重新引入了此错误。
- 在不同的 Node 主版本/次版本上进行测试，以确认该故障是否仅发生于特定版本。

## 参考资料

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 相关内容

- [Node.js 安装](/zh-CN/install/node)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)

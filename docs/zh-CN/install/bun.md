---
read_when:
    - 你想要最快的本地开发循环（bun + watch）
    - 你遇到了 Bun 安装、补丁或生命周期脚本问题
summary: Bun 工作流（实验性）：安装方式以及与 pnpm 相比的注意事项
title: Bun（实验性）
x-i18n:
    generated_at: "2026-04-27T07:11:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 15
---

<Warning>
不建议将 Bun **用于 Gateway 网关运行时**（已知会与 WhatsApp 和 Telegram 出现问题）。生产环境请使用 Node。
</Warning>

Bun 是一种可选的本地运行时，可用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认的包管理器仍然是 `pnpm`，它受到完整支持，并被文档工具链使用。Bun 无法使用 `pnpm-lock.yaml`，并且会忽略它。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已被 gitignore 忽略，因此不会给仓库带来额外变更。如果你想完全跳过 lockfile 写入：

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="构建并测试">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 生命周期脚本

除非被显式信任，否则 Bun 会阻止依赖项的生命周期脚本。对于这个仓库，常见被阻止的脚本并不是必需的：

- `@whiskeysockets/baileys` `preinstall` -- 检查 Node 主版本是否 >= 20（OpenClaw 默认使用 Node 24，并且仍然支持 Node 22 LTS，目前为 `22.14+`）
- `protobufjs` `postinstall` -- 发出关于版本方案不兼容的警告（不会生成构建产物）

如果你遇到了需要这些脚本才能解决的运行时问题，请显式信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事项

有些脚本仍然将 pnpm 硬编码进去（例如 `docs:build`、`ui:*`、`protocol:check`）。目前请继续通过 pnpm 运行这些脚本。

## 相关内容

- [安装概览](/zh-CN/install)
- [Node.js](/zh-CN/install/node)
- [更新](/zh-CN/install/updating)

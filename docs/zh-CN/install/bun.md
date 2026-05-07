---
read_when:
    - 你想要最快的本地开发循环（bun + watch）
    - 你遇到了 Bun 安装、补丁或生命周期脚本问题
summary: Bun 工作流（实验性）：安装以及相较于 pnpm 的注意事项
title: Bun（实验性）
x-i18n:
    generated_at: "2026-05-07T13:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **不推荐用于 Gateway 网关运行时**（已知与 WhatsApp 和 Telegram 存在问题）。生产环境请使用 Node。
</Warning>

Bun 是一个可选的本地运行时，用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认包管理器仍是 `pnpm`，它受到完整支持，并由文档工具使用。Bun 无法使用 `pnpm-lock.yaml`，并会忽略它。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已加入 gitignore，因此不会造成仓库变更。若要完全跳过写入锁文件：

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="构建和测试">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 生命周期脚本

Bun 会阻止依赖生命周期脚本，除非显式信任。对于此仓库，常见被阻止的脚本不是必需的：

- `@whiskeysockets/baileys` `preinstall` -- 检查 Node 主版本是否 >= 20（OpenClaw 默认使用 Node 24，并且仍支持 Node 22 LTS，目前为 `22.16+`）
- `protobufjs` `postinstall` -- 发出有关不兼容版本方案的警告（没有构建产物）

如果遇到需要这些脚本的运行时问题，请显式信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事项

一些脚本目前仍硬编码 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。暂时请通过 pnpm 运行这些脚本。

## 相关内容

- [安装概览](/zh-CN/install)
- [Node.js](/zh-CN/install/node)
- [更新](/zh-CN/install/updating)

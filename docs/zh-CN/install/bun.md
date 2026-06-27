---
read_when:
    - 你想要最快的本地开发循环（bun + watch）
    - 你遇到了 Bun 安装、补丁或生命周期脚本问题
summary: Bun 工作流（实验性）：安装以及与 pnpm 相比的注意事项
title: Bun（实验性）
x-i18n:
    generated_at: "2026-06-27T02:17:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **不推荐用于 Gateway 网关运行时**（已知与 WhatsApp 和 Telegram 存在问题）。生产环境请使用 Node。
</Warning>

Bun 是一个可选的本地运行时，用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认包管理器仍然是 `pnpm`，它受到完全支持，并由文档工具使用。Bun 无法使用 `pnpm-lock.yaml`，并且会忽略它。

## 安装

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已被 git 忽略，因此不会产生仓库变动。要完全跳过 lockfile 写入：

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 生命周期脚本

Bun 会阻止依赖生命周期脚本，除非显式信任。对于此仓库，常见被阻止的脚本不是必需的：

- `baileys` `preinstall` -- 检查 Node 主版本 >= 20（OpenClaw 默认使用 Node 24，并且仍支持 Node 22 LTS，目前为 `22.19+`）
- `protobufjs` `postinstall` -- 发出有关不兼容版本方案的警告（无构建产物）

如果你遇到需要这些脚本的运行时问题，请显式信任它们：

```sh
bun pm trust baileys protobufjs
```

## 注意事项

某些脚本仍然硬编码 pnpm（例如 `check:docs`、`ui:*`、`protocol:check`）。目前请通过 pnpm 运行这些脚本。

## 相关

- [安装概览](/zh-CN/install)
- [Node.js](/zh-CN/install/node)
- [更新](/zh-CN/install/updating)

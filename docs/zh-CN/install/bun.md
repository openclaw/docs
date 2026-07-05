---
read_when:
    - 你想要最快的本地开发循环（bun + watch）
    - 你遇到了 Bun 安装、补丁或生命周期脚本问题
summary: Bun 工作流（实验性）：安装以及与 pnpm 相比的注意事项
title: Bun（实验性）
x-i18n:
    generated_at: "2026-07-05T11:24:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
不建议将 Bun 用于 Gateway 网关运行时（WhatsApp 和 Telegram 存在已知问题）。生产环境请使用 Node。
</Warning>

Bun 是一个可选的本地运行时，用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认包管理器仍然是 `pnpm`，它受到完全支持，并由文档工具使用。Bun 无法使用 `pnpm-lock.yaml`，并且会忽略它。

## 安装

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已加入 gitignore，因此不会造成仓库变更。要完全跳过 lockfile 写入：

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

Bun 默认会阻止依赖生命周期脚本，除非显式信任。对于此仓库，常见被阻止的脚本并不是必需的：

- `baileys` `preinstall`：检查 Node 主版本是否 >= 20（OpenClaw 要求 Node 22.19+ 或 23.11+，推荐使用 Node 24）
- `protobufjs` `postinstall`：输出有关不兼容版本方案的警告（无构建产物）

如果你遇到需要这些脚本的运行时问题，请显式信任它们：

```sh
bun pm trust baileys protobufjs
```

## 注意事项

一些包脚本在内部硬编码了 `pnpm`（例如 `check:docs`、`ui:*`、`protocol:check`）。通过 `bun run` 运行它们仍会 shell 调用 `pnpm`，因此请直接通过 `pnpm` 运行这些脚本。

## 相关

- [安装概览](/zh-CN/install)
- [Node.js](/zh-CN/install/node)
- [更新](/zh-CN/install/updating)

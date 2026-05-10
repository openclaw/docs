---
read_when:
    - 你想要最快的本地开发循环（bun + watch）
    - 你遇到了 Bun 安装、补丁或生命周期脚本问题
summary: Bun 工作流（实验性）：安装流程，以及与 pnpm 相比的注意事项
title: Bun（实验性）
x-i18n:
    generated_at: "2026-05-10T19:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **不建议用于 Gateway 网关运行时**（WhatsApp 和 Telegram 存在已知问题）。生产环境请使用 Node。
</Warning>

Bun 是可选的本地运行时，可用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认包管理器仍然是 `pnpm`，它受到完全支持，并被文档工具使用。Bun 无法使用 `pnpm-lock.yaml`，并会忽略它。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已加入 gitignore，因此不会造成仓库变更。要完全跳过 lockfile 写入：

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

Bun 会阻止依赖的生命周期脚本，除非显式信任。对于此仓库，常见被阻止的脚本并不是必需的：

- `baileys` `preinstall` -- 检查 Node 主版本 >= 20（OpenClaw 默认使用 Node 24，并且仍支持 Node 22 LTS，目前为 `22.16+`）
- `protobufjs` `postinstall` -- 输出关于不兼容版本方案的警告（无构建产物）

如果遇到需要这些脚本的运行时问题，请显式信任它们：

```sh
bun pm trust baileys protobufjs
```

## 注意事项

有些脚本目前仍硬编码 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。暂时请通过 pnpm 运行这些脚本。

## 相关

- [安装概览](/zh-CN/install)
- [Node.js](/zh-CN/install/node)
- [更新](/zh-CN/install/updating)

---
read_when:
    - 你希望获得最快的本地开发循环（bun + watch）
    - 你遇到了 Bun 安装、补丁或生命周期脚本问题
summary: Bun 工作流（实验性）：与 pnpm 相比的安装方式和注意事项
title: Bun（实验性）
x-i18n:
    generated_at: "2026-07-11T20:37:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
不建议将 Bun 用于 Gateway 网关运行时（已知会导致 WhatsApp 和 Telegram 出现问题）。生产环境请使用 Node。
</Warning>

Bun 是一个可选的本地运行时，可用于直接运行 TypeScript（`bun run ...`、`bun --watch ...`）。默认包管理器仍为 `pnpm`，它受到完整支持，并由文档工具使用。Bun 无法使用 `pnpm-lock.yaml`，并会忽略该文件。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已被 git 忽略，因此不会造成仓库变动。若要完全跳过锁文件写入：

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

除非明确设为可信，否则 Bun 会阻止依赖项的生命周期脚本。对于此仓库，通常被阻止的脚本并非必需：

- `baileys` `preinstall`：检查 Node 主版本是否 >= 20（OpenClaw 要求 Node 22.19+ 或 23.11+，推荐使用 Node 24）
- `protobufjs` `postinstall`：输出有关版本方案不兼容的警告（不生成构建产物）

如果遇到需要这些脚本才能解决的运行时问题，请明确将它们设为可信：

```sh
bun pm trust baileys protobufjs
```

## 注意事项

某些包脚本在内部硬编码了 `pnpm`（例如 `check:docs`、`ui:*`、`protocol:check`）。通过 `bun run` 运行它们时，仍会启动 shell 调用 `pnpm`，因此直接通过 `pnpm` 运行这些脚本即可。

## 相关内容

- [安装概览](/zh-CN/install)
- [Node.js](/zh-CN/install/node)
- [更新](/zh-CN/install/updating)

---
read_when:
    - 你想使用 Bun 安装依赖项或运行包脚本
    - 你遇到了 Bun 安装、补丁或生命周期脚本问题
summary: 使用 Bun 执行安装和软件包脚本工作流；运行时需要 Node
title: Bun
x-i18n:
    generated_at: "2026-07-14T13:44:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun 无法运行 OpenClaw CLI 或 Gateway 网关，因为它不提供所需的 `node:sqlite` API。请安装受支持的 Node 版本，以运行所有 OpenClaw 运行时命令。
</Warning>

Bun 仍可用作可选的依赖安装工具和软件包脚本运行工具。默认软件包管理器仍为 `pnpm`，它受到完全支持，并由文档工具使用。Bun 无法使用 `pnpm-lock.yaml`，并会将其忽略。

## 安装

<Steps>
  <Step title="安装依赖">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已被 git 忽略，因此不会导致仓库变更。要完全跳过锁文件写入：

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="构建和测试">
    ```sh
    bun run build
    bun run vitest run
    ```

    启动 OpenClaw 本身的命令仍必须通过 Node 运行。

  </Step>
</Steps>

## 生命周期脚本

除非明确设为受信任，否则 Bun 会阻止依赖的生命周期脚本。对于此仓库，通常被阻止的脚本并非必需：

- `baileys` `preinstall`：检查 Node 主版本是否 >= 20（OpenClaw 要求 Node 22.22.3+、24.15+ 或 25.9+，推荐使用 Node 24）
- `protobufjs` `postinstall`：输出有关不兼容版本方案的警告（不生成构建产物）

如果遇到需要这些脚本的运行时问题，请明确将它们设为受信任：

```sh
bun pm trust baileys protobufjs
```

## 注意事项

某些软件包脚本在内部硬编码了 `pnpm`（例如 `check:docs`、`ui:*`、`protocol:check`）。通过 `bun run` 运行它们时，仍会通过 shell 调用 `pnpm`，因此只需直接通过 `pnpm` 运行这些脚本。

## 相关内容

- [安装概览](/zh-CN/install)
- [Node.js](/zh-CN/install/node)
- [更新](/zh-CN/install/updating)

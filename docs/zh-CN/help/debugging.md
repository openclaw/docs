---
read_when:
    - 你需要检查原始模型输出中的推理泄露
    - 你想在迭代时以 watch 模式运行 Gateway 网关
    - 你需要一个可重复的调试工作流
summary: 调试工具：watch 模式、原始模型流，以及追踪推理泄露
title: 调试
x-i18n:
    generated_at: "2026-04-05T08:25:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# 调试

本页介绍用于调试流式输出的辅助工具，特别是在某个
提供商将推理内容混入普通文本时。

## 运行时调试覆盖

在聊天中使用 `/debug` 可设置**仅运行时**的配置覆盖（保存在内存中，不写入磁盘）。
`/debug` 默认禁用；使用 `commands.debug: true` 启用。
当你需要切换一些不常见设置而又不想编辑 `openclaw.json` 时，这会很方便。

示例：

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` 会清除所有覆盖并恢复为磁盘上的配置。

## Gateway 网关 watch 模式

为了快速迭代，请在文件监视器下运行 gateway：

```bash
pnpm gateway:watch
```

它映射到：

```bash
node scripts/watch-node.mjs gateway --force
```

监视器会在与构建相关的文件发生变化时重启，包括 `src/` 下的文件、扩展源码文件、
扩展 `package.json` 和 `openclaw.plugin.json` 元数据、`tsconfig.json`、
`package.json` 以及 `tsdown.config.ts`。扩展元数据变更会重启
gateway，而不会强制触发 `tsdown` 重建；源码和配置变更仍会先重建 `dist`。

在 `gateway:watch` 后附加任意 gateway CLI 标志，它们都会在
每次重启时透传。

## 开发配置文件 + 开发 gateway（`--dev`）

使用开发配置文件来隔离状态，并为
调试启动一个安全、可丢弃的环境。这里有**两个** `--dev` 标志：

- **全局 `--dev`（profile）**：将状态隔离到 `~/.openclaw-dev` 下，并
  将 gateway 端口默认为 `19001`（派生端口也会随之变化）。
- **`gateway --dev`**：告知 Gateway 网关在缺少默认配置 +
  工作区时自动创建它们（并跳过 `BOOTSTRAP.md`）。

推荐流程（开发 profile + 开发 bootstrap）：

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

如果你还没有全局安装，请通过 `pnpm openclaw ...` 运行 CLI。

它会执行以下操作：

1. **Profile 隔离**（全局 `--dev`）
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001`（browser/canvas 端口也会相应变化）

2. **开发 bootstrap**（`gateway --dev`）
   - 如果缺失则写入最小配置（`gateway.mode=local`，绑定 loopback）。
   - 将 `agent.workspace` 设为开发工作区。
   - 将 `agent.skipBootstrap=true`（不使用 `BOOTSTRAP.md`）。
   - 如果缺失则为工作区写入初始文件：
     `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`。
   - 默认身份：**C3‑PO**（protocol droid）。
   - 在开发模式下跳过渠道提供商（`OPENCLAW_SKIP_CHANNELS=1`）。

重置流程（全新开始）：

```bash
pnpm gateway:dev:reset
```

注意：`--dev` 是一个**全局** profile 标志，某些运行器会把它吞掉。
如果你需要显式写出来，请使用环境变量形式：

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` 会清空配置、凭证、会话和开发工作区（使用
`trash`，而不是 `rm`），然后重新创建默认开发环境。

提示：如果已经有一个非开发 gateway 正在运行（launchd/systemd），请先停止它：

```bash
openclaw gateway stop
```

## 原始流日志（OpenClaw）

OpenClaw 可以在任何过滤/格式化之前记录**原始 assistant 流**。
这是查看推理内容是否以纯文本增量形式到达
（或作为单独的 thinking 块到达）的最佳方式。

通过 CLI 启用：

```bash
pnpm gateway:watch --raw-stream
```

可选路径覆盖：

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

等效环境变量：

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

默认文件：

`~/.openclaw/logs/raw-stream.jsonl`

## 原始分块日志（pi-mono）

为了在原始 OpenAI 兼容分块被解析成内容块之前捕获它们，
pi-mono 提供了单独的日志器：

```bash
PI_RAW_STREAM=1
```

可选路径：

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

默认文件：

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> 注意：这只会由使用 pi-mono
> `openai-completions` 提供商的进程输出。

## 安全说明

- 原始流日志可能包含完整提示、工具输出和用户数据。
- 请将日志保留在本地，并在调试后删除。
- 如果你要共享日志，请先清理密钥和 PII。

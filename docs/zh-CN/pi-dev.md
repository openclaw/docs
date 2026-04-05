---
read_when:
    - 处理 Pi 集成代码或测试时
    - 运行 Pi 专用的 lint、类型检查和实时测试流程时
summary: Pi 集成的开发工作流：构建、测试和实时验证
title: Pi 开发工作流
x-i18n:
    generated_at: "2026-04-05T08:36:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f61ebe29ea38ac953a03fe848fe5ac6b6de4bace5e6955b76ae9a7d093eb0cc5
    source_path: pi-dev.md
    workflow: 15
---

# Pi 开发工作流

本指南总结了在 OpenClaw 中处理 Pi 集成时的一套合理工作流。

## 类型检查和 Lint

- 默认本地 gate：`pnpm check`
- 构建 gate：当更改可能影响构建输出、打包或懒加载/模块边界时，运行 `pnpm build`
- 面向 Pi 相关重度更改的完整落地 gate：`pnpm check && pnpm test`

## 运行 Pi 测试

直接使用 Vitest 运行面向 Pi 的测试集：

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

如需包含实时提供商验证：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

这涵盖了主要的 Pi 单元测试套件：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 手动测试

推荐流程：

- 以开发模式运行 Gateway 网关：
  - `pnpm gateway:dev`
- 直接触发智能体：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 使用 TUI 进行交互式调试：
  - `pnpm tui`

对于工具调用行为，提示执行 `read` 或 `exec` 操作，这样你可以看到工具流式传输和负载处理。

## 全量重置

状态存储在 OpenClaw 状态目录下。默认是 `~/.openclaw`。如果设置了 `OPENCLAW_STATE_DIR`，则改用该目录。

如需重置所有内容：

- 用于配置的 `openclaw.json`
- 用于模型凭证配置文件（API 密钥 + OAuth）的 `agents/<agentId>/agent/auth-profiles.json`
- 用于仍存储在凭证配置文件存储之外的提供商/渠道状态的 `credentials/`
- 用于智能体会话历史的 `agents/<agentId>/sessions/`
- 用于会话索引的 `agents/<agentId>/sessions/sessions.json`
- 如果存在旧版路径，则删除 `sessions/`
- 如果你想要一个空白工作区，则删除 `workspace/`

如果你只想重置会话，请删除该智能体的 `agents/<agentId>/sessions/`。如果你想保留凭证，请保留 `agents/<agentId>/agent/auth-profiles.json` 以及 `credentials/` 下的所有提供商状态。

## 参考

- [测试](/help/testing)
- [入门指南](/start/getting-started)

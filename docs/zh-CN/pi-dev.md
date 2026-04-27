---
read_when:
    - 处理 Pi 集成代码或测试
    - 运行 Pi 专用的 lint、类型检查和实时测试流程
summary: Pi 集成的开发者工作流：构建、测试和实时验证
title: Pi 开发工作流
x-i18n:
    generated_at: "2026-04-27T07:11:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 15
---

在 OpenClaw 中处理 Pi 集成时，一套合理的开发工作流。

## 类型检查和 lint

- 默认本地门禁：`pnpm check`
- 构建门禁：当变更可能影响构建输出、打包或懒加载 / 模块边界时，运行 `pnpm build`
- 面向 Pi 重度变更的完整提交流水线门禁：`pnpm check && pnpm test`

## 运行 Pi 测试

直接使用 Vitest 运行聚焦于 Pi 的测试集：

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

如需包含实时 provider 演练：

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

对于工具调用行为，可提示执行 `read` 或 `exec` 操作，这样你就能看到工具流式传输和负载处理。

## 清空重置

状态保存在 OpenClaw 状态目录下。默认是 `~/.openclaw`。如果设置了 `OPENCLAW_STATE_DIR`，请改用该目录。

要重置所有内容：

- 用于配置的 `openclaw.json`
- 用于模型认证配置档案（API 密钥 + OAuth）的 `agents/<agentId>/agent/auth-profiles.json`
- 用于仍存放在认证配置档案存储之外的 provider / 渠道状态的 `credentials/`
- 用于智能体会话历史的 `agents/<agentId>/sessions/`
- 用于会话索引的 `agents/<agentId>/sessions/sessions.json`
- 如果存在旧版路径，则删除 `sessions/`
- 如果你想要一个空白工作区，则删除 `workspace/`

如果你只想重置会话，请删除该智能体的 `agents/<agentId>/sessions/`。如果你想保留认证，请保留 `agents/<agentId>/agent/auth-profiles.json` 以及 `credentials/` 下的任何 provider 状态。

## 参考

- [测试](/zh-CN/help/testing)
- [入门指南](/zh-CN/start/getting-started)

## 相关内容

- [Pi 集成架构](/zh-CN/pi)

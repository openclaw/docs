---
read_when:
    - 处理 Pi 集成代码或测试
    - 运行 Pi 专用的 lint、类型检查和实时测试流程
summary: Pi 集成的开发者工作流：构建、测试和实时验证
title: Pi 开发工作流
x-i18n:
    generated_at: "2026-04-24T04:04:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb626bf21bc731b8ca7bb2a48692e17c8b93f2b6ffa471ed9e70d9c91cd57149
    source_path: pi-dev.md
    workflow: 15
---

本指南总结了在 OpenClaw 中处理 Pi 集成时，一套合理的开发工作流。

## 类型检查和 Lint

- 默认本地门禁：`pnpm check`
- 构建门禁：当更改可能影响构建产物、打包或懒加载/模块边界时，运行 `pnpm build`
- Pi 相关重度更改的完整落地门禁：`pnpm check && pnpm test`

## 运行 Pi 测试

直接使用 Vitest 运行以 Pi 为重点的测试集：

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

若要包含实时 provider 验证：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

这覆盖了主要的 Pi 单元测试套件：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 手动测试

推荐流程：

- 以 dev 模式运行 gateway：
  - `pnpm gateway:dev`
- 直接触发智能体：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 使用终端 UI 进行交互式调试：
  - `pnpm tui`

对于工具调用行为，请提示执行 `read` 或 `exec` 操作，以便你观察工具流式传输和负载处理。

## 全量重置

状态保存在 OpenClaw 状态目录下。默认是 `~/.openclaw`。如果设置了 `OPENCLAW_STATE_DIR`，则改用该目录。

如需重置所有内容：

- 配置文件 `openclaw.json`
- 模型 auth profile 的 `agents/<agentId>/agent/auth-profiles.json`（API 密钥 + OAuth）
- `credentials/`，用于仍保存在 auth profile store 之外的 provider/channel 状态
- `agents/<agentId>/sessions/`，用于智能体会话历史
- `agents/<agentId>/sessions/sessions.json`，用于会话索引
- 如果存在旧路径，则删除 `sessions/`
- 如果你希望得到一个空白工作区，则删除 `workspace/`

如果你只想重置会话，请删除该智能体的 `agents/<agentId>/sessions/`。如果你想保留认证信息，请保留 `agents/<agentId>/agent/auth-profiles.json` 以及 `credentials/` 下的任何 provider 状态。

## 参考

- [测试](/zh-CN/help/testing)
- [入门指南](/zh-CN/start/getting-started)

## 相关内容

- [Pi 集成架构](/zh-CN/pi)

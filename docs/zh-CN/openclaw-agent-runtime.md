---
read_when:
    - 处理 OpenClaw 智能体运行时代码或测试
    - 运行 agent-runtime lint、类型检查和实时测试流程
summary: OpenClaw 智能体运行时的开发者工作流：构建、测试和实时验证
title: OpenClaw agent runtime workflow
x-i18n:
    generated_at: "2026-06-27T02:25:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

在 OpenClaw 中开发 OpenClaw 智能体运行时的合理工作流。

## 类型检查和 lint

- 默认本地门禁：`pnpm check`
- 构建门禁：当变更可能影响构建产物、打包或延迟加载/模块边界时运行 `pnpm build`
- 智能体运行时变更的完整合入门禁：`pnpm check && pnpm test`

## 运行 Agent Runtime 测试

直接用 Vitest 运行智能体运行时测试集：

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

要包含实时提供商练习：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

这会覆盖主要的智能体运行时单元测试套件：

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## 手动测试

推荐流程：

- 以开发模式运行 Gateway 网关：
  - `pnpm gateway:dev`
- 直接触发智能体：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 使用 TUI 进行交互式调试：
  - `pnpm tui`

对于工具调用行为，提示执行 `read` 或 `exec` 动作，这样你可以看到工具流式传输和载荷处理。

## 全新状态重置

状态位于 OpenClaw 状态目录下。默认是 `~/.openclaw`。如果设置了 `OPENCLAW_STATE_DIR`，则改用该目录。

要重置所有内容：

- `openclaw.json` 用于配置
- `agents/<agentId>/agent/auth-profiles.json` 用于模型凭证配置文件（API 密钥 + OAuth）
- `credentials/` 用于仍然位于凭证配置文件存储之外的提供商/渠道状态
- `agents/<agentId>/sessions/` 用于智能体会话历史
- `agents/<agentId>/sessions/sessions.json` 用于会话索引
- 如果存在旧版路径，则使用 `sessions/`
- 如果你想要一个空白工作区，则使用 `workspace/`

如果你只想重置会话，请删除该智能体的 `agents/<agentId>/sessions/`。如果你想保留凭证，请保留 `agents/<agentId>/agent/auth-profiles.json` 和 `credentials/` 下的任何提供商状态。

## 参考

- [测试](/zh-CN/help/testing)
- [入门指南](/zh-CN/start/getting-started)

## 相关

- [OpenClaw agent runtime architecture](/zh-CN/agent-runtime-architecture)

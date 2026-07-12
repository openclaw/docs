---
read_when:
    - 处理 OpenClaw agent runtime 代码或测试
    - 运行 Agent 运行时的 lint、类型检查和实时测试流程
summary: OpenClaw agent runtime 开发者工作流：构建、测试和实时验证
title: OpenClaw agent runtime workflow
x-i18n:
    generated_at: "2026-07-12T14:33:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw 仓库中智能体运行时（`src/agents/`）的开发者工作流。

## 类型检查和代码检查

- 默认本地检查关卡：`pnpm check`（类型检查、代码检查、策略防护）
- 构建关卡：当更改可能影响构建输出、打包或延迟加载/模块边界时，运行 `pnpm build`
- 完整的推送前检查关卡：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## 运行 Agent Runtime 测试

运行智能体运行时单元测试套件：

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

第一个 glob 也涵盖 `agent-tools*`、`agent-settings` 和
`agent-tool-definition-adapter*` 测试套件。

单元测试配置不包含实时测试；请通过实时测试封装器运行它们
（该封装器会设置 `OPENCLAW_LIVE_TEST=1`，并且需要提供商凭据）：

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## 手动测试

- 以开发模式运行 Gateway 网关（通过 `OPENCLAW_SKIP_CHANNELS=1` 跳过渠道连接）：`pnpm gateway:dev`
- 通过 Gateway 网关触发一次智能体轮次：`pnpm openclaw agent --message "Hello" --thinking low`
- 使用 TUI 进行交互式调试：`pnpm tui`

若要测试工具调用行为，请通过提示要求执行 `read` 或 `exec` 操作，以便观察
工具流式传输和载荷处理。

## 全新状态重置

状态存储在 OpenClaw 状态目录中：默认为 `~/.openclaw`，设置
`$OPENCLAW_STATE_DIR` 后则使用该目录。以下路径均相对于该目录：

| 路径                                           | 存储内容                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | 配置                                                             |
| `state/openclaw.sqlite`                        | 共享运行时状态数据库                                      |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | 每智能体模型身份验证配置文件（API 密钥 + OAuth）和运行时状态 |
| `credentials/`                                 | 身份验证配置文件存储之外的提供商/渠道凭据        |
| `agents/<agentId>/sessions/`                   | 对话记录历史和旧版会话迁移源            |
| `sessions/`                                    | 旧版单智能体会话存储（仅旧安装）              |
| `workspace/`                                   | 默认 Agent 工作区（额外智能体使用 `workspace-<agentId>`）   |

删除这些路径可执行完整重置。范围更小的重置：

- 仅重置会话：不要删除 `agents/<agentId>/agent/openclaw-agent.sqlite`；会话行与其他每智能体状态共同存储在其中。使用 `/new` 或 `/reset` 为某个聊天启动新会话，并使用 `openclaw sessions cleanup` 维护会话。
- 保留身份验证：保留 `agents/<agentId>/agent/openclaw-agent.sqlite` 和 `credentials/`。

运行时不再读取旧版 `auth-profiles.json` 文件；
`openclaw doctor --fix` 会将它们导入 SQLite 存储。

## 参考资料

- [测试](/zh-CN/help/testing)
- [入门指南](/zh-CN/start/getting-started)

## 相关内容

- [OpenClaw agent runtime architecture](/zh-CN/agent-runtime-architecture)

---
read_when:
    - 处理 OpenClaw agent runtime 代码或测试
    - 运行 agent-runtime lint、类型检查和实时测试流程
summary: OpenClaw 智能体运行时的开发者工作流：构建、测试和实时验证
title: OpenClaw agent runtime workflow
x-i18n:
    generated_at: "2026-07-05T11:25:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5150689bc102a372b65b1c9bf0a378c7ccb0578d38a750571887dcbe0650e8a
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw 仓库中智能体运行时（`src/agents/`）的开发者工作流。

## 类型检查和 lint

- 默认本地关卡：`pnpm check`（类型检查、lint、策略守卫）
- 构建关卡：当变更可能影响构建输出、打包或惰性加载/模块边界时运行 `pnpm build`
- 完整的推送前关卡：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## 运行智能体运行时测试

运行智能体运行时单元套件：

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

第一个 glob 也覆盖 `agent-tools*`、`agent-settings` 和
`agent-tool-definition-adapter*` 套件。

实时测试已从单元配置中排除；请通过实时包装器运行它们
（设置 `OPENCLAW_LIVE_TEST=1`，并需要提供商凭据）：

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## 手动测试

- 以开发模式运行 Gateway 网关（通过 `OPENCLAW_SKIP_CHANNELS=1` 跳过渠道连接）：`pnpm gateway:dev`
- 通过 Gateway 网关触发一次智能体轮次：`pnpm openclaw agent --message "Hello" --thinking low`
- 使用 TUI 进行交互式调试：`pnpm tui`

对于工具调用行为，请提示执行 `read` 或 `exec` 操作，以便观察
工具流式传输和载荷处理。

## 全新重置

状态默认位于 OpenClaw 状态目录：`~/.openclaw`，如果已设置
`$OPENCLAW_STATE_DIR`，则位于该目录。相对于该目录的路径：

| 路径                                           | 内容                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | 配置                                                             |
| `state/openclaw.sqlite`                        | 共享运行时状态数据库                                      |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | 按智能体的模型认证配置文件（API 密钥 + OAuth）和运行时状态 |
| `credentials/`                                 | 认证配置文件存储之外的提供商/渠道凭据        |
| `agents/<agentId>/sessions/`                   | 会话转录，以及 `sessions.json` 索引                 |
| `sessions/`                                    | 旧版单智能体会话存储（仅旧安装）              |
| `workspace/`                                   | 默认智能体工作区（额外智能体使用 `workspace-<agentId>`）   |

删除这些路径即可完全重置。更窄范围的重置：

- 仅会话：删除该智能体的 `agents/<agentId>/sessions/`。
- 保留认证：保留 `agents/<agentId>/agent/openclaw-agent.sqlite` 和 `credentials/`。

运行时不再读取旧版 `auth-profiles.json` 文件；
`openclaw doctor --fix` 会将它们导入 SQLite 存储。

## 参考

- [测试](/zh-CN/help/testing)
- [入门指南](/zh-CN/start/getting-started)

## 相关

- [OpenClaw agent runtime architecture](/zh-CN/agent-runtime-architecture)

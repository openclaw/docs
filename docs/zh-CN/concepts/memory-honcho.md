---
read_when:
    - 你想要可跨会话和渠道使用的持久记忆
    - 你想要 AI 驱动的回忆和用户建模
summary: 通过 Honcho 插件实现 AI 原生跨会话记忆
title: Honcho 记忆
x-i18n:
    generated_at: "2026-07-05T11:12:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) 通过外部插件为 OpenClaw 添加 AI 原生记忆。它会将对话持久化到专用服务，并随着时间推移构建用户和智能体模型，让你的智能体获得跨会话上下文，超出工作区 Markdown 文件的范围。

## 提供的功能

- **跨会话记忆** - 每轮之后对话都会持久保存，因此上下文会在会话重置、压缩和渠道切换之间延续。
- **用户建模** - Honcho 会为每个用户维护档案（偏好、事实、沟通风格），也会为智能体维护档案（个性、习得的行为）。
- **语义搜索** - 搜索来自过去对话的观察结果，而不只是当前会话。
- **多智能体感知** - 父智能体会自动跟踪生成的子智能体，并在子会话中将父智能体添加为观察者。

## 可用工具

Honcho 会注册智能体可在对话中使用的工具：

**数据检索（快速，无 LLM 调用）：**

| 工具                        | 作用                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | 跨会话的完整用户表示                                   |
| `honcho_search_conclusions` | 对已存储结论进行语义搜索                               |
| `honcho_search_messages`    | 跨会话查找消息（按发送者、日期筛选）                   |
| `honcho_session`            | 当前会话历史和摘要                                     |

**问答（由 LLM 驱动）：**

| 工具         | 作用                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| `honcho_ask` | 询问有关用户的信息。`depth='quick'` 用于事实，`'thorough'` 用于综合分析 |

## 入门指南

安装插件并运行设置：

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

设置命令会提示你输入 API 凭证，写入配置，并可选择迁移现有工作区记忆文件。

<Info>
Honcho 可以完全本地运行（自托管），也可以通过 `api.honcho.dev` 的托管 API 运行。自托管选项不需要外部依赖。
</Info>

## 配置

设置位于 `plugins.entries["openclaw-honcho"].config` 下：

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

对于自托管实例，将 `baseUrl` 指向你的本地服务器（例如 `http://localhost:8000`），并省略 API key。

## 迁移现有记忆

如果你已有工作区记忆文件（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`），`openclaw honcho setup` 会检测它们并提供迁移选项。

<Info>
迁移是非破坏性的 - 文件会上传到 Honcho。原始文件永远不会被删除或移动。
</Info>

## 工作原理

每次 AI 轮次之后，对话都会持久化到 Honcho。用户和智能体消息都会被观察，让 Honcho 能够随着时间推移构建并优化其模型。

对话期间，Honcho 工具会在 OpenClaw 的 `before_prompt_build` 插件钩子中查询服务，并在模型看到提示词之前注入相关上下文。

## Honcho 与内置记忆对比

|                   | 内置 / QMD                    | Honcho                              |
| ----------------- | ----------------------------- | ----------------------------------- |
| **存储**          | 工作区 Markdown 文件          | 专用服务（本地或托管）              |
| **跨会话**        | 通过记忆文件                  | 自动、内置                          |
| **用户建模**      | 手动（写入 MEMORY.md）        | 自动档案                            |
| **搜索**          | 向量 + 关键词（混合）         | 基于观察结果的语义搜索              |
| **多智能体**      | 不跟踪                        | 父/子感知                           |
| **依赖**          | 无（内置）或 QMD 二进制文件   | 插件安装                            |

Honcho 和内置记忆系统可以配合使用。配置 QMD 后，会提供更多工具，用于在 Honcho 的跨会话记忆之外搜索本地 Markdown 文件。

## CLI 命令

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## 延伸阅读

- [插件源代码](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho 文档](https://docs.honcho.dev)
- [Honcho OpenClaw 集成指南](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [QMD 记忆引擎](/zh-CN/concepts/memory-qmd)
- [上下文引擎](/zh-CN/concepts/context-engine)

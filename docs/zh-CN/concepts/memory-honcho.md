---
read_when:
    - 你希望拥有可跨会话和渠道使用的持久记忆
    - 你需要由 AI 驱动的回忆和用户建模
summary: 通过 Honcho 插件实现 AI 原生的跨会话记忆
title: Honcho 记忆
x-i18n:
    generated_at: "2026-07-11T20:27:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) 通过外部插件为 OpenClaw 添加 AI 原生记忆能力。它将对话持久化到专用服务，并随时间推移构建用户和智能体模型，让你的智能体获得超越工作区 Markdown 文件的跨会话上下文。

## 提供的功能

- **跨会话记忆** - 每轮对话后都会持久化，因此上下文能够跨会话重置、压缩和渠道切换保留。
- **用户建模** - Honcho 会为每位用户维护档案（偏好、事实、沟通风格），并为智能体维护档案（个性、习得行为）。
- **语义搜索** - 搜索以往对话中的观察结果，而不仅限于当前会话。
- **多智能体感知** - 父智能体会自动跟踪其创建的子智能体，并作为观察者加入子会话。

## 可用工具

Honcho 会注册智能体可在对话期间使用的工具：

**数据检索（速度快，不调用 LLM）：**

| 工具                        | 功能                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | 跨会话的完整用户表征                                   |
| `honcho_search_conclusions` | 对已存储的结论进行语义搜索                             |
| `honcho_search_messages`    | 跨会话查找消息（可按发送者、日期筛选）                 |
| `honcho_session`            | 当前会话历史和摘要                                     |

**问答（由 LLM 驱动）：**

| 工具         | 功能                                                                                  |
| ------------ | ------------------------------------------------------------------------------------- |
| `honcho_ask` | 询问有关用户的信息。使用 `depth='quick'` 查询事实，使用 `'thorough'` 进行综合分析 |

## 入门指南

安装插件并运行设置：

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

设置命令会提示你输入 API 凭据、写入配置，并可选择迁移现有的工作区记忆文件。

<Info>
Honcho 可以完全在本地运行（自行托管），也可以使用位于 `api.honcho.dev` 的托管 API。自行托管选项不需要任何外部依赖。
</Info>

## 配置

设置位于 `plugins.entries["openclaw-honcho"].config` 下：

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // 自行托管时省略
          workspaceId: "openclaw", // 记忆隔离
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

对于自行托管的实例，将 `baseUrl` 指向你的本地服务器（例如 `http://localhost:8000`），并省略 API key。

## 迁移现有记忆

如果你已有工作区记忆文件（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`），`openclaw honcho setup` 会检测它们并提供迁移选项。

<Info>
迁移不会造成破坏——文件会上传到 Honcho，原始文件绝不会被删除或移动。
</Info>

## 工作原理

每轮 AI 回复后，对话都会持久化到 Honcho。用户和智能体消息都会被观察，使 Honcho 能够随时间推移构建并完善其模型。

在对话期间，Honcho 工具会通过 OpenClaw 的 `before_prompt_build` 插件钩子查询服务，并在模型看到提示词之前注入相关上下文。

## Honcho 与内置记忆对比

|                   | 内置 / QMD                     | Honcho                           |
| ----------------- | ------------------------------ | -------------------------------- |
| **存储**          | 工作区 Markdown 文件           | 专用服务（本地或托管）           |
| **跨会话**        | 通过记忆文件                   | 自动、内置                       |
| **用户建模**      | 手动（写入 MEMORY.md）         | 自动生成档案                     |
| **搜索**          | 向量 + 关键词（混合）          | 对观察结果进行语义搜索           |
| **多智能体**      | 不跟踪                         | 父子智能体感知                   |
| **依赖项**        | 无（内置）或 QMD 二进制文件    | 安装插件                         |

Honcho 和内置记忆系统可以协同工作。配置 QMD 后，会提供额外工具，让你能够在使用 Honcho 跨会话记忆的同时搜索本地 Markdown 文件。

## CLI 命令

```bash
openclaw honcho setup                        # 配置 API key 并迁移文件
openclaw honcho status                       # 检查连接状态
openclaw honcho ask <question>               # 向 Honcho 查询有关用户的信息
openclaw honcho search <query> [-k N] [-d D] # 对记忆进行语义搜索
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

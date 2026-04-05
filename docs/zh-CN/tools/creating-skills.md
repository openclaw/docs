---
read_when:
    - 你正在工作区中创建一个新的自定义 skill
    - 你需要一个基于 `SKILL.md` 的 Skills 快速入门工作流
summary: 使用 `SKILL.md` 构建和测试自定义工作区 Skills
title: 创建 Skills
x-i18n:
    generated_at: "2026-04-05T10:10:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 747cebc5191b96311d1d6760bede1785a099acd7633a0b88de6b7882b57e1db6
    source_path: tools/creating-skills.md
    workflow: 15
---

# 创建 Skills

Skills 会教智能体如何以及何时使用工具。每个 skill 都是一个目录，
其中包含一个带有 YAML frontmatter 和 Markdown 说明的 `SKILL.md` 文件。

关于 Skills 的加载和优先级，请参见[Skills](/zh-CN/tools/skills)。

## 创建你的第一个 skill

<Steps>
  <Step title="创建 skill 目录">
    Skills 位于你的工作区中。创建一个新文件夹：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="编写 SKILL.md">
    在该目录中创建 `SKILL.md`。frontmatter 定义元数据，
    Markdown 正文则包含面向智能体的说明。

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="添加工具（可选）">
    你可以在 frontmatter 中定义自定义工具 schema，或指导智能体
    使用现有系统工具（如 `exec` 或 `browser`）。Skills 也可以随插件一起发布，
    与它们所说明的工具放在一起。

  </Step>

  <Step title="加载 skill">
    开启一个新会话，让 OpenClaw 读取该 skill：

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    验证 skill 已加载：

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="测试它">
    发送一条应触发该 skill 的消息：

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或者直接与智能体聊天，并请求一个问候语。

  </Step>
</Steps>

## Skill 元数据参考

YAML frontmatter 支持以下字段：

| 字段                                | 必需 | 说明                                  |
| ----------------------------------- | ---- | ------------------------------------- |
| `name`                              | 是   | 唯一标识符（snake_case）              |
| `description`                       | 是   | 向智能体展示的一行描述                |
| `metadata.openclaw.os`              | 否   | OS 过滤器（`["darwin"]`、`["linux"]` 等） |
| `metadata.openclaw.requires.bins`   | 否   | PATH 上必须存在的二进制文件           |
| `metadata.openclaw.requires.config` | 否   | 必需的配置键                          |

## 最佳实践

- **保持简洁**——指导模型做_什么_，而不是如何表现得像 AI
- **安全优先**——如果你的 skill 使用 `exec`，请确保提示词不会允许来自不可信输入的任意命令注入
- **在本地测试**——在分享前，使用 `openclaw agent --message "..."` 进行测试
- **使用 ClawHub**——在 [ClawHub](https://clawhub.ai) 浏览和贡献 Skills

## Skills 的存放位置

| 位置                              | 优先级 | 作用域             |
| --------------------------------- | ------ | ------------------ |
| `\<workspace\>/skills/`           | 最高   | 每个智能体         |
| `\<workspace\>/.agents/skills/`   | 高     | 每个工作区智能体   |
| `~/.agents/skills/`               | 中     | 共享智能体配置文件 |
| `~/.openclaw/skills/`             | 中     | 共享（所有智能体） |
| 内置（随 OpenClaw 提供）          | 低     | 全局               |
| `skills.load.extraDirs`           | 最低   | 自定义共享文件夹   |

## 相关内容

- [Skills 参考](/zh-CN/tools/skills) — 加载、优先级和门控规则
- [Skills 配置](/zh-CN/tools/skills-config) — `skills.*` 配置 schema
- [ClawHub](/zh-CN/tools/clawhub) — 公共 skill 注册表
- [构建插件](/zh-CN/plugins/building-plugins) — 插件可以附带 Skills

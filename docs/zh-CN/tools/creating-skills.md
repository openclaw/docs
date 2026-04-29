---
read_when:
    - 你正在工作区中创建一个新的自定义技能
    - 你需要一个基于 SKILL.md 的 Skills 快速入门工作流
summary: 使用 SKILL.md 构建并测试自定义工作区 Skills
title: 创建 Skills
x-i18n:
    generated_at: "2026-04-29T03:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills 教会智能体如何以及何时使用工具。每个技能都是一个目录，
其中包含一个带有 YAML frontmatter 和 Markdown 指令的 `SKILL.md` 文件。

有关 Skills 如何加载和确定优先级，请参阅 [Skills](/zh-CN/tools/skills)。

## 创建你的第一个技能

<Steps>
  <Step title="Create the skill directory">
    Skills 位于你的工作区中。创建一个新文件夹：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    在该目录中创建 `SKILL.md`。frontmatter 定义元数据，
    Markdown 正文包含给智能体的指令。

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    技能 `name` 使用由小写字母、数字和连字符组成的连字符命名法。
    保持文件夹名称与 frontmatter 中的 `name` 一致。

  </Step>

  <Step title="Add tools (optional)">
    你可以在 frontmatter 中定义自定义工具 schema，或指示智能体
    使用现有系统工具（如 `exec` 或 `browser`）。Skills 也可以
    随插件一起分发，并与它们所记录的工具放在一起。

  </Step>

  <Step title="Load the skill">
    启动一个新会话，让 OpenClaw 识别该技能：

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    验证该技能已加载：

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Test it">
    发送一条应触发该技能的消息：

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或者直接与智能体聊天，并请求一条问候语。

  </Step>
</Steps>

## 技能元数据参考

YAML frontmatter 支持这些字段：

| 字段                                | 必填     | 描述                                                           |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | 是       | 使用小写字母、数字和连字符的唯一标识符                         |
| `description`                       | 是       | 显示给智能体的单行描述                                         |
| `metadata.openclaw.os`              | 否       | OS 过滤器（`["darwin"]`、`["linux"]` 等）                      |
| `metadata.openclaw.requires.bins`   | 否       | PATH 上所需的二进制文件                                        |
| `metadata.openclaw.requires.config` | 否       | 所需配置键                                                     |

## 最佳实践

- **保持简洁** — 指示模型要做_什么_，而不是如何成为 AI
- **安全优先** — 如果你的技能使用 `exec`，请确保提示不会允许来自不可信输入的任意命令注入
- **本地测试** — 分享前使用 `openclaw agent --message "..."` 进行测试
- **使用 ClawHub** — 在 [ClawHub](https://clawhub.ai) 浏览并贡献 Skills

## Skills 的位置

| 位置                            | 优先级   | 范围                  |
| ------------------------------- | ---------- | --------------------- |
| `\<workspace\>/skills/`         | 最高       | 每个智能体            |
| `\<workspace\>/.agents/skills/` | 高         | 每个工作区智能体      |
| `~/.agents/skills/`             | 中         | 共享智能体配置文件    |
| `~/.openclaw/skills/`           | 中         | 共享（所有智能体）    |
| 内置（随 OpenClaw 一起提供）    | 低         | 全局                  |
| `skills.load.extraDirs`         | 最低       | 自定义共享文件夹      |

## 相关

- [Skills 参考](/zh-CN/tools/skills) — 加载、优先级和门控规则
- [Skills 配置](/zh-CN/tools/skills-config) — `skills.*` 配置 schema
- [ClawHub](/zh-CN/tools/clawhub) — 公共技能注册表
- [构建插件](/zh-CN/plugins/building-plugins) — 插件可以分发 Skills

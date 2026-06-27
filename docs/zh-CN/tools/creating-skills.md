---
read_when:
    - 你正在创建新的自定义技能
    - 你需要一个基于 SKILL.md 的 Skills 快速入门工作流
    - 你想使用 Skill Workshop 提交一个技能以供智能体审核
sidebarTitle: Creating skills
summary: 为你的 OpenClaw 智能体构建、测试并发布自定义 SKILL.md 工作区 Skills。
title: 创建技能
x-i18n:
    generated_at: "2026-06-27T03:25:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills 教会智能体如何以及何时使用工具。每个技能都是一个目录，
其中包含一个带有 YAML frontmatter 和 markdown 指令的 `SKILL.md` 文件。
OpenClaw 会按照定义的[优先级顺序](/zh-CN/tools/skills#loading-order)从多个根目录加载 Skills。

## 创建你的第一个技能

<Steps>
  <Step title="创建技能目录">
    Skills 位于你的工作区 `skills/` 文件夹中。为你的
    新技能创建一个目录：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    你可以将技能分组到子文件夹中以便组织；该技能仍然
    由 `SKILL.md` frontmatter 命名，而不是由文件夹路径命名：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="编写 SKILL.md">
    在目录内创建 `SKILL.md`。frontmatter 定义元数据；
    正文为智能体提供指令。

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    命名规则：
    - `name` 使用小写字母、数字和连字符。
    - 保持目录名和 frontmatter `name` 一致。
    - `description` 会展示给智能体，并显示在斜杠命令发现中；
      请保持为一行且不超过 160 个字符。

  </Step>

  <Step title="验证技能已加载">
    ```bash
    openclaw skills list
    ```

    OpenClaw 默认会监视 Skills 根目录下的 `SKILL.md` 文件。如果
    watcher 已禁用，或者你正在继续一个现有会话，请启动一个
    新会话，以便智能体收到刷新后的列表：

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="测试它">
    发送一条应该触发该技能的消息：

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或者打开一个聊天，直接询问智能体。使用 `/skill hello-world`
    按名称显式调用它。

  </Step>
</Steps>

## SKILL.md 参考

### 必填字段

| 字段          | 描述                                                            |
| ------------- | --------------------------------------------------------------- |
| `name`        | 使用小写字母、数字和连字符的唯一 slug                          |
| `description` | 展示给智能体并显示在发现输出中的单行描述                        |

### 可选 frontmatter 键

| 字段                       | 默认值  | 描述                                                                             |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | 将该技能作为用户斜杠命令公开                                                     |
| `disable-model-invocation` | `false` | 将该技能排除在智能体的系统提示之外（仍可通过 `/skill` 运行）                     |
| `command-dispatch`         | —       | 设置为 `tool`，将斜杠命令直接路由到工具，绕过模型                                |
| `command-tool`             | —       | 设置 `command-dispatch: tool` 时要调用的工具名称                                  |
| `command-arg-mode`         | `raw`   | 对于工具分发，将原始 args 字符串转发给工具                                       |
| `homepage`                 | —       | 在 macOS Skills UI 中显示为 “Website” 的 URL                                      |

有关门控字段（`requires.bins`、`requires.env` 等），请参阅
[Skills — 门控](/zh-CN/tools/skills#gating)。

### 使用 `{baseDir}`

在技能正文中使用 `{baseDir}` 引用技能目录内的文件，
无需硬编码路径：

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## 添加条件激活

为你的技能添加门控，使其仅在依赖项可用时加载：

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="门控选项">
    | 键 | 描述 |
    | --- | --- |
    | `requires.bins` | 所有二进制文件都必须存在于 `PATH` 上 |
    | `requires.anyBins` | 至少一个二进制文件必须存在于 `PATH` 上 |
    | `requires.env` | 每个环境变量都必须存在于进程或配置中 |
    | `requires.config` | 每个 `openclaw.json` 路径都必须为 truthy |
    | `os` | 平台过滤器：`["darwin"]`、`["linux"]`、`["win32"]` |
    | `always` | 设置为 `true` 可跳过所有门控，并始终包含该技能 |

    完整参考：[Skills — 门控](/zh-CN/tools/skills#gating)。

  </Accordion>
  <Accordion title="环境和 API key">
    将 API key 连接到 `openclaw.json` 中的技能条目：

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    该键只会为该智能体轮次注入到宿主进程中。
    它不会进入沙箱；请参阅
    [沙箱隔离的环境变量](/zh-CN/tools/skills-config#sandboxed-skills-and-env-vars)。

  </Accordion>
</AccordionGroup>

## 通过技能工作坊提案

对于由智能体起草的技能，或者当你希望技能上线前经过操作员审核时，
请使用[技能工作坊](/zh-CN/tools/skill-workshop)提案，而不是直接编写
`SKILL.md`。

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

当提案包含支持文件时，使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

该目录必须包含 `PROPOSAL.md`。支持文件可以放在 `assets/`、
`examples/`、`references/`、`scripts/` 或 `templates/` 中。

审核后：

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

完整提案生命周期请参阅[技能工作坊](/zh-CN/tools/skill-workshop)。

## 发布到 ClawHub

<Steps>
  <Step title="确保你的 SKILL.md 完整">
    确保 `name`、`description` 以及任何 `metadata.openclaw` 门控字段
    都已设置。如果你有项目页面，请添加 `homepage` URL。
  </Step>
  <Step title="安装 ClawHub 技能">
    ClawHub 技能记录了当前发布命令形态和必需
    元数据：

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="发布">
    ```bash
    clawhub publish
    ```

    完整流程请参阅 [ClawHub — 发布](/zh-CN/clawhub/publishing)。

  </Step>
</Steps>

## 最佳实践

<Tip>
  - **保持简洁** — 指示模型做*什么*，而不是如何成为 AI。
  - **安全优先** — 如果你的技能使用 `exec`，请确保提示不会允许
    来自不受信任输入的任意命令注入。
  - **本地测试** — 分享前使用 `openclaw agent --message "..."`。
  - **使用 ClawHub** — 从零构建前，先在 [clawhub.ai](https://clawhub.ai)
    浏览社区技能。
</Tip>

## 相关

<CardGroup cols={2}>
  <Card title="Skills 参考" href="/zh-CN/tools/skills" icon="puzzle-piece">
    加载顺序、门控、允许列表和 SKILL.md 格式。
  </Card>
  <Card title="技能工作坊" href="/zh-CN/tools/skill-workshop" icon="flask">
    面向智能体起草技能的提案队列。
  </Card>
  <Card title="Skills 配置" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置 schema。
  </Card>
  <Card title="ClawHub" href="/zh-CN/clawhub" icon="cloud">
    在公开注册表上浏览和发布技能。
  </Card>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="plug">
    插件可以随其记录的工具一起发布 Skills。
  </Card>
</CardGroup>

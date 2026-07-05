---
read_when:
    - 你正在创建新的自定义技能
    - 你需要一个用于基于 SKILL.md 的 Skills 的快速入门工作流
    - 你想使用 Skill Workshop 提出一个技能以供智能体审阅
sidebarTitle: Creating skills
summary: 为你的 OpenClaw 智能体构建、测试并发布自定义 SKILL.md 工作区技能。
title: 创建技能
x-i18n:
    generated_at: "2026-07-05T11:45:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills 教会智能体如何以及何时使用工具。每个技能都是一个目录，
其中包含一个带有 YAML frontmatter 和 Markdown 指令的 `SKILL.md` 文件。
OpenClaw 会按定义好的[优先级顺序](/zh-CN/tools/skills#loading-order)从多个根目录加载 Skills。

## 创建你的第一个技能

<Steps>
  <Step title="Create the skill directory">
    Skills 位于你的工作区 `skills/` 文件夹中：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    你可以将 Skills 分组到子文件夹中以便组织；该技能仍然
    由 `SKILL.md` frontmatter 命名，而不是由文件夹路径命名：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    frontmatter 定义元数据；正文为智能体提供指令。

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
    - 保持目录名称与 frontmatter `name` 一致。
    - `description` 会显示给智能体，并显示在斜杠命令发现中；
      请保持为一行且少于 160 个字符。

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw 默认会监视 Skills 根目录下的 `SKILL.md` 文件。如果
    监视器已禁用，或你正在继续使用现有会话，请启动一个新会话，
    这样智能体才能收到刷新的列表：

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或者打开聊天并直接询问智能体。使用 `/skill hello-world`
    按名称显式调用它。

  </Step>
</Steps>

## SKILL.md 参考

### 必填字段

| 字段         | 描述                                                     |
| ------------- | --------------------------------------------------------------- |
| `name`        | 使用小写字母、数字和连字符的唯一 slug        |
| `description` | 显示给智能体并显示在发现输出中的一行描述 |

### 可选 frontmatter 键

| 字段                      | 默认值 | 描述                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | 将该技能公开为用户斜杠命令                                         |
| `disable-model-invocation` | `false` | 将该技能排除在智能体系统提示之外（仍可通过 `/skill` 运行）        |
| `command-dispatch`         | —       | 设置为 `tool`，将斜杠命令直接路由到工具，绕过模型 |
| `command-tool`             | —       | 设置 `command-dispatch: tool` 时要调用的工具名称                         |
| `command-arg-mode`         | `raw`   | 对于工具分发，将原始参数字符串转发给工具                      |
| `homepage`                 | —       | 在 macOS Skills UI 中显示为 “Website” 的 URL                                    |

有关门控字段（`requires.bins`、`requires.env` 等），请参阅
[Skills — 门控](/zh-CN/tools/skills#gating)。

### 使用 `{baseDir}`

引用技能目录中的文件时无需硬编码路径；
智能体会根据该技能自己的目录解析 `{baseDir}`：

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## 添加条件激活

为你的技能设置门控，使其仅在依赖项可用时加载：

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | 键 | 描述 |
    | --- | --- |
    | `requires.bins` | 所有二进制文件都必须存在于 `PATH` 上 |
    | `requires.anyBins` | 至少一个二进制文件必须存在于 `PATH` 上 |
    | `requires.env` | 每个环境变量都必须存在于进程或配置中 |
    | `requires.config` | 每个 `openclaw.json` 路径都必须为真值 |
    | `os` | 平台筛选器：`["darwin"]`、`["linux"]`、`["win32"]` |
    | `always` | 设置为 `true` 可跳过所有门控并始终包含该技能 |

    完整参考：[Skills — 门控](/zh-CN/tools/skills#gating)。

  </Accordion>
  <Accordion title="Environment and API keys">
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

    该密钥只会为该智能体轮次注入到宿主进程中。
    它不会进入沙箱；请参阅
    [沙箱隔离环境变量](/zh-CN/tools/skills-config#sandboxed-skills-and-env-vars)。

  </Accordion>
</AccordionGroup>

## 通过 Skill Workshop 提议

对于由智能体起草的 Skills，或者当你希望操作员在技能上线前进行审核时，
请使用 [Skill Workshop](/zh-CN/tools/skill-workshop) 提案，而不是直接编写
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

该目录的根目录必须包含 `PROPOSAL.md`。支持文件放在
`assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。

审核后：

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)，了解完整的提案生命周期。

## 发布到 ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    确保已设置 `name`、`description` 以及任何 `metadata.openclaw` 门控字段。
    如果你有项目页面，请添加 `homepage` URL。
  </Step>
  <Step title="Install the standalone ClawHub CLI and log in">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Publish">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    添加 `--version <version>` 或 `--owner <owner>` 来覆盖推断出的
    版本，或在特定所有者名下发布。请参阅
    [ClawHub — 发布](/zh-CN/clawhub/publishing) 和
    [ClawHub CLI](/zh-CN/clawhub/cli)，了解完整流程、所有者作用域和其他
    维护命令（`clawhub sync`、`clawhub skill rename` 等）。

  </Step>
</Steps>

## 最佳实践

<Tip>
  - **保持简洁**：指示模型要做*什么*，而不是如何成为 AI。
  - **安全优先**：如果你的技能使用 `exec`，请确保提示不会允许
    来自不可信输入的任意命令注入。
  - **本地测试**：分享前使用 `openclaw agent --message "..."`。
  - **使用 ClawHub**：从头构建前，先在 [clawhub.ai](https://clawhub.ai)
    浏览社区 Skills。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="Skills reference" href="/zh-CN/tools/skills" icon="puzzle-piece">
    加载顺序、门控、允许列表和 SKILL.md 格式。
  </Card>
  <Card title="Skill Workshop" href="/zh-CN/tools/skill-workshop" icon="flask">
    用于智能体起草 Skills 的提案队列。
  </Card>
  <Card title="Skills config" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置架构。
  </Card>
  <Card title="ClawHub" href="/zh-CN/clawhub" icon="cloud">
    在公共注册表中浏览和发布 Skills。
  </Card>
  <Card title="Building plugins" href="/zh-CN/plugins/building-plugins" icon="plug">
    插件可以将 Skills 与其文档化的工具一起交付。
  </Card>
</CardGroup>

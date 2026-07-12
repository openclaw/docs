---
read_when:
    - 你正在创建一个新的自定义技能
    - 你需要一个基于 SKILL.md 的 Skills 快速入门工作流
    - 你想使用 Skill Workshop 提交一项技能，供智能体审核
sidebarTitle: Creating skills
summary: 为你的 OpenClaw 智能体构建、测试并发布自定义 `SKILL.md` 工作区 Skills。
title: 创建技能
x-i18n:
    generated_at: "2026-07-11T20:58:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills 用于教智能体如何以及何时使用工具。每个技能都是一个目录，
其中包含带有 YAML 前置元数据和 Markdown 指令的 `SKILL.md` 文件。
OpenClaw 会按照明确的[优先级顺序](/zh-CN/tools/skills#loading-order)从多个根目录加载技能。

## 创建你的第一个技能

<Steps>
  <Step title="创建技能目录">
    技能位于你的工作区 `skills/` 文件夹中：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    你可以将技能放在子文件夹中进行分类整理——技能名称仍由
    `SKILL.md` 的前置元数据定义，而不是由文件夹路径定义：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # 技能名称仍为 "hello-world"，通过 /hello-world 调用
    ```

  </Step>

  <Step title="编写 SKILL.md">
    前置元数据定义元数据；正文为智能体提供指令。

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
    - 目录名称应与前置元数据中的 `name` 保持一致。
    - `description` 会显示给智能体，并出现在斜杠命令发现结果中——
      请保持为单行且不超过 160 个字符。

  </Step>

  <Step title="验证技能已加载">
    ```bash
    openclaw skills list
    ```

    默认情况下，OpenClaw 会监视技能根目录下的 `SKILL.md` 文件。如果
    监视器已禁用，或者你要继续使用现有会话，请启动一个新会话，
    以便智能体接收刷新后的列表：

    ```bash
    # 在聊天中——归档当前会话并重新开始
    /new

    # 或重启 Gateway 网关
    openclaw gateway restart
    ```

  </Step>

  <Step title="测试技能">
    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或者打开聊天，直接向智能体提出请求。使用 `/skill hello-world`
    可按名称显式调用该技能。

  </Step>
</Steps>

## SKILL.md 参考

### 必填字段

| 字段          | 说明                                                   |
| ------------- | ------------------------------------------------------ |
| `name`        | 使用小写字母、数字和连字符的唯一标识符                 |
| `description` | 显示给智能体并出现在发现结果中的单行说明               |

### 可选前置元数据键

| 字段                       | 默认值  | 说明                                                                         |
| -------------------------- | ------- | ---------------------------------------------------------------------------- |
| `user-invocable`           | `true`  | 将技能公开为用户斜杠命令                                                     |
| `disable-model-invocation` | `false` | 不在智能体的系统提示词中包含该技能（仍可通过 `/skill` 运行）                 |
| `command-dispatch`         | —       | 设为 `tool`，将斜杠命令直接路由到工具并绕过模型                             |
| `command-tool`             | —       | 设置 `command-dispatch: tool` 时要调用的工具名称                             |
| `command-arg-mode`         | `raw`   | 使用工具分发时，将原始参数字符串转发给工具                                   |
| `homepage`                 | —       | 在 macOS Skills 界面中显示为 “Website” 的 URL                               |

有关门控字段（`requires.bins`、`requires.env` 等），请参阅
[Skills — 门控](/zh-CN/tools/skills#gating)。

### 使用 `{baseDir}`

引用技能目录中的文件时无需硬编码路径——智能体会相对于技能自身的目录
解析 `{baseDir}`：

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## 添加条件激活

为技能设置门控，使其仅在依赖项可用时加载：

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="门控选项">
    | 键 | 说明 |
    | --- | --- |
    | `requires.bins` | 所有二进制文件都必须存在于 `PATH` 中 |
    | `requires.anyBins` | 至少一个二进制文件必须存在于 `PATH` 中 |
    | `requires.env` | 每个环境变量都必须存在于进程或配置中 |
    | `requires.config` | 每个 `openclaw.json` 路径的值都必须为真 |
    | `os` | 平台筛选器：`["darwin"]`、`["linux"]`、`["win32"]` |
    | `always` | 设为 `true` 可跳过所有门控并始终包含该技能 |

    完整参考：[Skills — 门控](/zh-CN/tools/skills#gating)。

  </Accordion>
  <Accordion title="环境变量和 API 密钥">
    在 `openclaw.json` 中将 API 密钥关联到技能条目：

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

    该密钥仅在智能体的当前轮次中注入宿主进程。
    它不会进入沙箱——请参阅
    [沙箱隔离的环境变量](/zh-CN/tools/skills-config#sandboxed-skills-and-env-vars)。

  </Accordion>
</AccordionGroup>

## 通过 Skill Workshop 提议

对于由智能体起草的技能，或者你希望技能上线前由操作员审核的情况，
请使用 [Skill Workshop](/zh-CN/tools/skill-workshop) 提案，而不要直接编写
`SKILL.md`。

```bash
# 提议创建全新技能
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# 提议更新现有技能
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

当提案包含支持文件时，请使用 `--proposal-dir`：

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

该目录的根目录中必须包含 `PROPOSAL.md`。支持文件应放在
`assets/`、`examples/`、`references/`、`scripts/` 或 `templates/` 下。

审核后：

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

有关完整的提案生命周期，请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)。

## 发布到 ClawHub

<Steps>
  <Step title="确保你的 SKILL.md 完整">
    请确保已设置 `name`、`description` 和所有 `metadata.openclaw` 门控字段。
    如果你有项目页面，请添加 `homepage` URL。
  </Step>
  <Step title="安装独立的 ClawHub CLI 并登录">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="发布">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    添加 `--version <version>` 或 `--owner <owner>` 可覆盖推断出的版本，
    或以指定所有者身份发布。有关完整流程、所有者范围以及其他维护命令
    （`clawhub sync`、`clawhub skill rename` 等），请参阅
    [ClawHub — 发布](/zh-CN/clawhub/publishing)和
    [ClawHub CLI](/zh-CN/clawhub/cli)。

  </Step>
</Steps>

## 最佳实践

<Tip>
  - **保持简洁**——告诉模型做*什么*，而不是如何成为 AI。
  - **安全优先**——如果你的技能使用 `exec`，请确保提示词不会允许
    不受信任的输入进行任意命令注入。
  - **在本地测试**——分享前使用 `openclaw agent --message "..."`。
  - **使用 ClawHub**——从头构建前，请先在 [clawhub.ai](https://clawhub.ai)
    浏览社区技能。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="Skills 参考" href="/zh-CN/tools/skills" icon="puzzle-piece">
    加载顺序、门控、允许列表和 SKILL.md 格式。
  </Card>
  <Card title="Skill Workshop" href="/zh-CN/tools/skill-workshop" icon="flask">
    用于智能体起草技能的提案队列。
  </Card>
  <Card title="Skills 配置" href="/zh-CN/tools/skills-config" icon="gear">
    完整的 `skills.*` 配置架构。
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    在公共注册表中浏览和发布技能。
  </Card>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="plug">
    插件可以将技能与其所说明的工具一同发布。
  </Card>
</CardGroup>

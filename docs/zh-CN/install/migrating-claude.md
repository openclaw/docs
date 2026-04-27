---
read_when:
    - 你正从 Claude Code 或 Claude Desktop 迁移，并且希望保留说明、MCP 服务器和 Skills
    - 你需要了解 OpenClaw 会自动导入哪些内容，以及哪些内容仅归档
summary: 通过预览导入，将 Claude Code 和 Claude Desktop 的本地状态迁移到 OpenClaw
title: 从 Claude 迁移
x-i18n:
    generated_at: "2026-04-27T10:00:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e9af1b90432aa25f086f9ed2551bb41c525f47a8f70284073fc517aa107b99
    source_path: install/migrating-claude.md
    workflow: 15
---

OpenClaw 通过内置的 Claude 迁移提供商导入本地 Claude 状态。该提供商会在更改状态前预览每一项内容，在计划和报告中隐藏密钥，并在应用前创建经过验证的备份。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭证、会话和工作区，或者在审阅计划后直接使用带有 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    当向导检测到本地 Claude 状态时，会提供 Claude 作为导入选项。

    ```bash
    openclaw onboard --flow import
    ```

    或指定特定来源：

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```
  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 进行脚本化或可重复的运行。完整参考请参见 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    添加 `--from <path>` 可导入特定的 Claude Code 主目录或项目根目录。
  </Tab>
</Tabs>

## 导入内容

<AccordionGroup>
  <Accordion title="说明和记忆">
    - 项目中的 `CLAUDE.md` 和 `.claude/CLAUDE.md` 内容会被复制或追加到 OpenClaw 的智能体工作区 `AGENTS.md` 中。
    - 用户的 `~/.claude/CLAUDE.md` 内容会追加到工作区 `USER.md` 中。
  </Accordion>
  <Accordion title="MCP 服务器">
    存在时，会从项目 `.mcp.json`、Claude Code 的 `~/.claude.json` 以及 Claude Desktop 的 `claude_desktop_config.json` 导入 MCP 服务器定义。
  </Accordion>
  <Accordion title="Skills 和命令">
    - 带有 `SKILL.md` 文件的 Claude Skills 会被复制到 OpenClaw 工作区的 Skills 目录中。
    - `.claude/commands/` 或 `~/.claude/commands/` 下的 Claude 命令 Markdown 文件会被转换为 OpenClaw Skills，并设置 `disable-model-invocation: true`。
  </Accordion>
</AccordionGroup>

## 仅归档的内容

提供商会将以下内容复制到迁移报告中供你手动审查，但**不会**将其加载到运行中的 OpenClaw 配置中：

- Claude hooks
- Claude 权限和宽泛的工具允许列表
- Claude 环境默认值
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` 或 `~/.claude/agents/` 下的 Claude 子智能体
- Claude Code 缓存、计划和项目历史目录
- Claude Desktop 扩展和操作系统存储的凭证

OpenClaw 不会自动执行 hooks、信任权限允许列表，或解码不透明的 OAuth 和 Desktop 凭证状态。审阅归档后，请手动迁移你需要的内容。

## 源选择

在未指定 `--from` 时，OpenClaw 会检查默认的 Claude Code 主目录 `~/.claude`、采样的 Claude Code `~/.claude.json` 状态文件，以及 macOS 上的 Claude Desktop MCP 配置。

当 `--from` 指向项目根目录时，OpenClaw 只会导入该项目的 Claude 文件，例如 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/` 和 `.mcp.json`。在项目根目录导入时，它不会读取你的全局 Claude 主目录。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate claude --dry-run
    ```

    该计划会列出所有将要变更的内容，包括冲突、跳过的项，以及从嵌套 MCP `env` 或 `headers` 字段中隐藏的敏感值。
  </Step>
  <Step title="应用并备份">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw 会在应用前创建并验证备份。
  </Step>
  <Step title="运行 Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-CN/gateway/doctor) 会在导入后检查配置或状态问题。
  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    确认 Gateway 网关状态正常，并且你导入的说明、MCP 服务器和 Skills 已加载。
  </Step>
</Steps>

## 冲突处理

当计划报告冲突时（目标位置已存在文件或配置值），应用会拒绝继续。

<Warning>
仅当你有意替换现有目标时，才使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入按项目划分的备份。
</Warning>

对于全新的 OpenClaw 安装，冲突并不常见。它们通常出现在你对已有用户修改的设置重复运行导入时。

## 用于自动化的 JSON 输出

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

使用 `--json` 且不带 `--yes` 时，apply 会打印计划且不会修改状态。这是用于 CI 和共享脚本的最安全模式。

## 故障排除

<AccordionGroup>
  <Accordion title="Claude 状态不在 ~/.claude 中">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导在现有设置上拒绝导入">
    新手引导导入需要全新的设置。你可以重置状态并重新进行新手引导，或者直接使用 `openclaw migrate apply claude`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="来自 Claude Desktop 的 MCP 服务器未导入">
    Claude Desktop 会从平台相关路径读取 `claude_desktop_config.json`。如果 OpenClaw 未自动检测到它，请将 `--from` 指向该文件所在目录。
  </Accordion>
  <Accordion title="Claude 命令变成了禁用模型调用的 Skills">
    这是设计如此。Claude 命令是由用户触发的，因此 OpenClaw 会将其作为带有 `disable-model-invocation: true` 的 Skills 导入。如果你希望智能体自动调用它们，请编辑每个 Skill 的 frontmatter。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整 CLI 参考、插件契约和 JSON 结构。
- [迁移指南](/zh-CN/install/migrating)：所有迁移路径。
- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：另一条跨系统导入路径。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：`AGENTS.md`、`USER.md` 和 Skills 的所在位置。

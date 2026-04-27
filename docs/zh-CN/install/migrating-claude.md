---
read_when:
    - 你正在从 Claude Code 或 Claude Desktop 迁移，并希望保留指令、MCP 服务器和 Skills
    - 你需要了解 OpenClaw 会自动导入哪些内容，以及哪些内容会保持为仅归档
summary: 将 Claude Code 和 Claude Desktop 的本地状态迁移到 OpenClaw，并使用预览导入
title: 从 Claude 迁移
x-i18n:
    generated_at: "2026-04-27T09:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9f8d08e48fe76457f832c9c80ac9ede3e5a6b71d8a0a2dc33c72d51028eeeb5
    source_path: install/migrating-claude.md
    workflow: 15
---

OpenClaw 通过内置的 Claude 迁移提供商导入本地 Claude 状态。该提供商会在更改状态前预览每一项，在计划和报告中隐藏敏感信息，并在应用前创建经过验证的备份。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭证、会话和工作区，或者在审查计划后直接使用带有 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    当向导检测到本地 Claude 状态时，可以提供 Claude 作为导入选项。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定来源：

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    对于脚本化或可重复执行的运行，请使用 `openclaw migrate`。完整参考请见 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    添加 `--from <path>` 可导入特定的 Claude Code 主目录或项目根目录。

  </Tab>
</Tabs>

## 导入内容

<AccordionGroup>
  <Accordion title="指令和记忆">
    - 项目的 `CLAUDE.md` 和 `.claude/CLAUDE.md` 内容会被复制或追加到 OpenClaw Agent 工作区 的 `AGENTS.md` 中。
    - 用户的 `~/.claude/CLAUDE.md` 内容会追加到工作区的 `USER.md` 中。
  </Accordion>
  <Accordion title="MCP 服务器">
    存在时，会从项目的 `.mcp.json`、Claude Code 的 `~/.claude.json` 以及 Claude Desktop 的 `claude_desktop_config.json` 导入 MCP 服务器定义。
  </Accordion>
  <Accordion title="Skills 和命令">
    - 带有 `SKILL.md` 文件的 Claude Skills 会被复制到 OpenClaw 工作区的 Skills 目录中。
    - 位于 `.claude/commands/` 或 `~/.claude/commands/` 下的 Claude 命令 Markdown 文件会被转换为 OpenClaw Skills，并设置 `disable-model-invocation: true`。
  </Accordion>
</AccordionGroup>

## 保持为仅归档的内容

提供商会将以下内容复制到迁移报告中供手动审查，但**不会**将它们加载到实时 OpenClaw 配置中：

- Claude hooks
- Claude 权限和宽泛的工具允许列表
- Claude 环境默认值
- `CLAUDE.local.md`
- `.claude/rules/`
- 位于 `.claude/agents/` 或 `~/.claude/agents/` 下的 Claude 子智能体
- Claude Code 缓存、计划和项目历史目录
- Claude Desktop 扩展和存储在操作系统中的凭证

OpenClaw 会拒绝自动执行 hooks、信任权限允许列表，或解码不透明的 OAuth 和 Desktop 凭证状态。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate claude --dry-run
    ```

    该计划会列出所有将要发生的变更，包括冲突、跳过的项目，以及在嵌套 MCP `env` 或 `headers` 字段中被隐藏的敏感值。

  </Step>
  <Step title="带备份应用">
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
</Steps>

## 来源选择

在不使用 `--from` 时，OpenClaw 会检查默认的 Claude Code 主目录 `~/.claude`、采样的 Claude Code 状态文件 `~/.claude.json`，以及 macOS 上的 Claude Desktop MCP 配置。

当 `--from` 指向项目根目录时，OpenClaw 只会导入该项目的 Claude 文件，例如 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/` 和 `.mcp.json`。在项目根目录导入时，它不会读取你的全局 Claude 主目录。

## 冲突处理

当计划报告冲突时，应用会拒绝继续。

<Warning>
仅当你有意替换现有目标时，才使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入按项目划分的备份。
</Warning>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整的 CLI 参考、插件契约和 JSON 结构。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [Agent workspace](/zh-CN/concepts/agent-workspace)：`AGENTS.md`、`USER.md` 和 Skills 的存放位置。

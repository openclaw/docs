---
read_when:
    - 你正从 Claude Code 或 Claude Desktop 迁移过来，并希望保留指令、MCP 服务器和 Skills
    - 你需要了解 OpenClaw 会自动导入哪些内容，以及哪些内容会保持为仅归档
summary: 将 Claude Code 和 Claude Desktop 的本地状态迁移到 OpenClaw，并提供可预览的导入功能
title: 从 Claude 迁移
x-i18n:
    generated_at: "2026-04-27T10:59:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bce8e02d56db65a0123e8a941558351ad67bd6e279a0225e03b456ebd8bbac7
    source_path: install/migrating-claude.md
    workflow: 15
---

OpenClaw 通过内置的 Claude 迁移提供商导入本地 Claude 状态。该提供商会在更改状态前预览每个项目，在计划和报告中隐藏密钥，并在应用前创建已验证的备份。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭证、会话和工作区，或者在审查计划后直接使用带 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    当向导检测到本地 Claude 状态时，会提供 Claude 作为导入选项。

    ```bash
    openclaw onboard --flow import
    ```

    或者指向特定来源：

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    对于脚本化或可重复执行的运行，请使用 `openclaw migrate`。完整参考请参见 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    添加 `--from <path>` 以导入特定的 Claude Code 主目录或项目根目录。

  </Tab>
</Tabs>

## 将导入的内容

<AccordionGroup>
  <Accordion title="指令和内存">
    - 项目中的 `CLAUDE.md` 和 `.claude/CLAUDE.md` 内容会被复制或追加到 OpenClaw 的智能体工作区 `AGENTS.md`。
    - 用户的 `~/.claude/CLAUDE.md` 内容会被追加到工作区 `USER.md`。
  </Accordion>
  <Accordion title="MCP 服务器">
    如果存在，MCP 服务器定义会从项目的 `.mcp.json`、Claude Code 的 `~/.claude.json` 以及 Claude Desktop 的 `claude_desktop_config.json` 中导入。
  </Accordion>
  <Accordion title="Skills 和命令">
    - 带有 `SKILL.md` 文件的 Claude Skills 会被复制到 OpenClaw 工作区的 Skills 目录中。
    - 位于 `.claude/commands/` 或 `~/.claude/commands/` 下的 Claude 命令 Markdown 文件会被转换为 OpenClaw Skills，并设置 `disable-model-invocation: true`。
  </Accordion>
</AccordionGroup>

## 保持为仅归档的内容

提供商会将这些内容复制到迁移报告中供手动审查，但**不会**将其加载到正在使用的 OpenClaw 配置中：

- Claude hooks
- Claude 权限和宽泛的工具允许列表
- Claude 默认环境设置
- `CLAUDE.local.md`
- `.claude/rules/`
- 位于 `.claude/agents/` 或 `~/.claude/agents/` 下的 Claude 子智能体
- Claude Code 缓存、计划和项目历史目录
- Claude Desktop 扩展和存储在操作系统中的凭证

OpenClaw 不会自动执行 hooks、信任权限允许列表，或解码不透明的 OAuth 和 Desktop 凭证状态。审查归档后，请手动迁移你需要的内容。

## 来源选择

如果不使用 `--from`，OpenClaw 会检查默认的 Claude Code 主目录 `~/.claude`、采样的 Claude Code 状态文件 `~/.claude.json`，以及 macOS 上的 Claude Desktop MCP 配置。

当 `--from` 指向项目根目录时，OpenClaw 只会导入该项目的 Claude 文件，例如 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/` 和 `.mcp.json`。在项目根目录导入时，它不会读取你的全局 Claude 主目录。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate claude --dry-run
    ```

    该计划会列出所有将发生的更改，包括冲突、跳过项，以及在嵌套 MCP `env` 或 `headers` 字段中已隐藏的敏感值。

  </Step>
  <Step title="在备份后应用">
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

    确认网关运行正常，并且你导入的指令、MCP 服务器和 Skills 已加载。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突时（目标位置已经存在文件或配置值），应用会拒绝继续。

<Warning>
仅当你有意替换现有目标时，才使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入按项目划分的备份。
</Warning>

对于全新的 OpenClaw 安装，冲突并不常见。它们通常出现在你对已经有用户编辑的设置重复运行导入时。

## 用于自动化的 JSON 输出

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

使用 `--json` 且不带 `--yes` 时，apply 会打印计划且不会修改状态。这是 CI 和共享脚本中最安全的模式。

## 故障排除

<AccordionGroup>
  <Accordion title="Claude 状态不在 ~/.claude 中">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导拒绝在现有设置上导入">
    新手引导导入需要全新设置。你可以重置状态并重新进行新手引导，或者直接使用 `openclaw migrate apply claude`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="Claude Desktop 中的 MCP 服务器没有导入">
    Claude Desktop 会从平台特定路径读取 `claude_desktop_config.json`。如果 OpenClaw 没有自动检测到它，请将 `--from` 指向该文件所在目录。
  </Accordion>
  <Accordion title="Claude 命令变成了禁用模型调用的 Skills">
    这是设计使然。Claude 命令由用户触发，因此 OpenClaw 会将其导入为带有 `disable-model-invocation: true` 的 Skills。如果你希望智能体自动调用它们，请编辑每个 Skill 的 frontmatter。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整 CLI 参考、插件契约和 JSON 结构。
- [迁移指南](/zh-CN/install/migrating)：所有迁移路径。
- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：另一条跨系统导入路径。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：`AGENTS.md`、`USER.md` 和 Skills 的存放位置。

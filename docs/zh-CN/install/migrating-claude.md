---
read_when:
    - 你正在从 Claude Code 或 Claude Desktop 迁移，并希望保留指令、MCP 服务器和 Skills
    - 你需要了解 OpenClaw 会自动导入哪些内容，以及哪些内容仅供归档。
summary: 通过可预览的导入，将 Claude Code 和 Claude Desktop 的本地状态迁移到 OpenClaw
title: 从 Claude 迁移
x-i18n:
    generated_at: "2026-07-11T20:37:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw 通过内置的 Claude 迁移提供商导入本地 Claude 状态。该提供商会在更改状态前预览每个项目，在计划和报告中隐去密钥，并在应用前创建并验证备份。

<Note>
新手引导导入要求全新的 OpenClaw 设置。如果你已有本地 OpenClaw 状态，请先重置配置、凭据、会话和工作区；或者在审查计划后，直接使用带有 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    向导检测到本地 Claude 状态时，会提供 Claude 选项。

    ```bash
    openclaw onboard --flow import
    ```

    或者指定特定来源：

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 进行脚本化或可重复执行的迁移。完整参考请参阅 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    添加 `--from <path>` 可导入特定的 Claude Code 主目录或项目根目录。

  </Tab>
</Tabs>

## 导入的内容

<AccordionGroup>
  <Accordion title="指令和记忆">
    - 项目中的 `CLAUDE.md` 和 `.claude/CLAUDE.md` 内容会复制或追加到 OpenClaw Agent 工作区的 `AGENTS.md`。
    - 用户的 `~/.claude/CLAUDE.md` 内容会追加到工作区的 `USER.md`。

  </Accordion>
  <Accordion title="MCP 服务器">
    如果存在，系统会从项目的 `.mcp.json`、Claude Code 的 `~/.claude.json` 和 Claude Desktop 的 `claude_desktop_config.json` 导入 MCP 服务器定义。
  </Accordion>
  <Accordion title="Skills 和命令">
    - 包含 `SKILL.md` 文件的 Claude Skills 会复制到 OpenClaw 工作区的 Skills 目录。
    - `.claude/commands/` 或 `~/.claude/commands/` 下的 Claude 命令 Markdown 文件会转换为带有 `disable-model-invocation: true` 的 OpenClaw Skills。

  </Accordion>
</AccordionGroup>

## 仅归档的内容

提供商会将以下内容复制到迁移报告中供手动审查，但**不会**将其加载到实时 OpenClaw 配置中：

- Claude 钩子
- Claude 权限和宽泛的工具允许列表
- Claude 环境默认值
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` 或 `~/.claude/agents/` 下的 Claude 子智能体
- Claude Code 缓存、计划和项目历史目录
- Claude Desktop 扩展和操作系统存储的凭据

OpenClaw 拒绝自动执行钩子、信任权限允许列表，或解码不透明的 OAuth 和 Desktop 凭据状态。审查归档后，请手动迁移所需内容。

## 来源选择

未指定 `--from` 时，OpenClaw 会检查默认的 Claude Code 主目录 `~/.claude`、抽样的 Claude Code `~/.claude.json` 状态文件，以及 macOS 上的 Claude Desktop MCP 配置。

当 `--from` 指向项目根目录时，OpenClaw 只会导入该项目的 Claude 文件，例如 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/` 和 `.mcp.json`。在从项目根目录导入时，它不会读取你的全局 Claude 主目录。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate claude --dry-run
    ```

    计划会列出所有将发生的更改，包括冲突、跳过的项目，以及从嵌套 MCP `env` 或 `headers` 字段中隐去的敏感值。

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

    确认 Gateway 网关运行正常，并且已加载导入的指令、MCP 服务器和 Skills。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突（目标位置已存在文件或配置值）时，应用操作会拒绝继续执行。

<Warning>
只有在有意替换现有目标时，才使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入项目级备份。
</Warning>

对于全新安装的 OpenClaw，冲突并不常见。冲突通常出现在已有用户编辑内容的设置中重新运行导入时。

## 用于自动化的 JSON 输出

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

在交互式终端之外执行 `migrate apply` 时必须使用 `--yes`；如果未指定，OpenClaw 会报错而不是应用更改，因此脚本和 CI 必须显式传入 `--yes`。请先使用 `--dry-run --json` 预览，确认计划正确后，再使用 `--json --yes` 应用。

## 故障排查

<AccordionGroup>
  <Accordion title="Claude 状态位于 ~/.claude 之外">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导拒绝导入到现有设置">
    新手引导导入要求全新的设置。你可以重置状态并重新进行新手引导，也可以直接使用 `openclaw migrate apply claude`；后者支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="未导入 Claude Desktop 中的 MCP 服务器">
    Claude Desktop 从特定于平台的路径读取 `claude_desktop_config.json`。如果 OpenClaw 未自动检测到该文件，请将 `--from` 指向该文件所在的目录。
  </Accordion>
  <Accordion title="Claude 命令转换为禁用模型调用的 Skills">
    这是有意设计的行为。Claude 命令由用户触发，因此 OpenClaw 会将其导入为带有 `disable-model-invocation: true` 的 Skills。如果你希望智能体自动调用它们，请编辑每个 Skill 的 frontmatter。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整的 CLI 参考、插件契约和 JSON 结构。
- [迁移指南](/zh-CN/install/migrating)：所有迁移路径。
- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：另一条跨系统导入路径。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：`AGENTS.md`、`USER.md` 和 Skills 的存放位置。

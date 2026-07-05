---
read_when:
    - 你来自 Claude Code 或 Claude Desktop，并希望保留指令、MCP 服务器和技能
    - 你需要了解 OpenClaw 会自动导入哪些内容，以及哪些内容保持仅归档状态
summary: 通过预览导入将 Claude Code 和 Claude Desktop 本地状态迁移到 OpenClaw
title: 从 Claude 迁移
x-i18n:
    generated_at: "2026-07-05T11:25:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw 通过内置的 Claude 迁移提供商导入本地 Claude 状态。该提供商会在更改状态前预览每一项，在计划和报告中遮盖密钥，并在应用前创建经过验证的备份。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已有本地 OpenClaw 状态，请先重置配置、凭据、会话和工作区，或在查看计划后直接使用带 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="Onboarding wizard">
    向导会在检测到本地 Claude 状态时提供 Claude 选项。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定来源：

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 进行脚本化或可重复运行。完整参考请参阅 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    添加 `--from <path>` 可导入特定 Claude Code 主目录或项目根目录。

  </Tab>
</Tabs>

## 会导入什么

<AccordionGroup>
  <Accordion title="Instructions and memory">
    - 项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 内容会复制或追加到 OpenClaw 智能体工作区 `AGENTS.md`。
    - 用户 `~/.claude/CLAUDE.md` 内容会追加到工作区 `USER.md`。

  </Accordion>
  <Accordion title="MCP servers">
    如果存在，MCP 服务器定义会从项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 导入。
  </Accordion>
  <Accordion title="Skills and commands">
    - 带有 `SKILL.md` 文件的 Claude Skills 会复制到 OpenClaw 工作区 Skills 目录。
    - `.claude/commands/` 或 `~/.claude/commands/` 下的 Claude 命令 Markdown 文件会转换为带 `disable-model-invocation: true` 的 OpenClaw Skills。

  </Accordion>
</AccordionGroup>

## 哪些内容仅归档

提供商会将这些内容复制到迁移报告中供手动查看，但**不会**将它们加载到实时 OpenClaw 配置中：

- Claude 钩子
- Claude 权限和宽泛的工具允许列表
- Claude 环境默认值
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` 或 `~/.claude/agents/` 下的 Claude 子智能体
- Claude Code 缓存、计划和项目历史目录
- Claude Desktop 扩展和操作系统存储的凭据

OpenClaw 拒绝自动执行钩子、信任权限允许列表，或解码不透明的 OAuth 和 Desktop 凭据状态。查看归档后，请手动移动你需要的内容。

## 来源选择

不带 `--from` 时，OpenClaw 会检查默认 Claude Code 主目录 `~/.claude`、采样的 Claude Code `~/.claude.json` 状态文件，以及 macOS 上的 Claude Desktop MCP 配置。

当 `--from` 指向项目根目录时，OpenClaw 只会导入该项目的 Claude 文件，例如 `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/` 和 `.mcp.json`。在项目根目录导入期间，它不会读取你的全局 Claude 主目录。

## 推荐流程

<Steps>
  <Step title="Preview the plan">
    ```bash
    openclaw migrate claude --dry-run
    ```

    计划会列出将更改的所有内容，包括冲突、跳过的项目，以及从嵌套 MCP `env` 或 `headers` 字段中遮盖的敏感值。

  </Step>
  <Step title="Apply with backup">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw 会在应用前创建并验证备份。

  </Step>
  <Step title="Run doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-CN/gateway/doctor) 会在导入后检查配置或状态问题。

  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    确认 Gateway 网关健康，并且已加载你导入的说明、MCP 服务器和 Skills。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突（目标位置已存在文件或配置值）时，应用会拒绝继续。

<Warning>
只有在有意替换现有目标时，才使用 `--overwrite` 重新运行。提供商仍可能在迁移报告目录中为被覆盖的文件写入项目级备份。
</Warning>

对于全新的 OpenClaw 安装，冲突并不常见。它们通常出现在你对已有用户编辑的设置重新运行导入时。

## 用于自动化的 JSON 输出

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

在非交互式终端外运行 `migrate apply` 时必须提供 `--yes`；否则 OpenClaw 会报错而不是应用，因此脚本和 CI 必须显式传入 `--yes`。先用 `--dry-run --json` 预览，确认计划正确后再用 `--json --yes` 应用。

## 故障排查

<AccordionGroup>
  <Accordion title="Claude state lives outside ~/.claude">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="Onboarding refuses to import on an existing setup">
    新手引导导入需要全新设置。请重置状态并重新新手引导，或直接使用 `openclaw migrate apply claude`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="MCP servers from Claude Desktop did not import">
    Claude Desktop 会从平台特定路径读取 `claude_desktop_config.json`。如果 OpenClaw 没有自动检测到它，请将 `--from` 指向该文件所在目录。
  </Accordion>
  <Accordion title="Claude commands became skills with model invocation disabled">
    这是设计行为。Claude 命令由用户触发，因此 OpenClaw 会将它们导入为带 `disable-model-invocation: true` 的 Skills。如果你希望智能体自动调用它们，请编辑每个 Skill 的 frontmatter。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整 CLI 参考、插件合约和 JSON 形状。
- [迁移指南](/zh-CN/install/migrating)：所有迁移路径。
- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：另一条跨系统导入路径。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [Doctor](/zh-CN/gateway/doctor)：迁移后健康检查。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：`AGENTS.md`、`USER.md` 和 Skills 所在位置。

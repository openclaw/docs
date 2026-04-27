---
read_when:
    - 你想从 Hermes 或另一个智能体系统迁移到 OpenClaw
    - 你正在添加一个由插件拥有的迁移提供商
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-04-27T09:44:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c1d9f2f7b3ab1456ae8f9fae5eb14b354a283d77b175e11366f38011f4a2a02
    source_path: cli/migrate.md
    workflow: 15
---

# `openclaw migrate`

通过由插件拥有的迁移提供商，从另一个智能体系统导入状态。

<Tip>
有关从 Hermes 迁移的面向用户操作指南，请参阅 [从 Hermes 迁移](/zh-CN/install/migrating-hermes)。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  已注册迁移提供商的名称，例如 `hermes`。运行 `openclaw migrate list` 以查看已安装的提供商。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划并退出，不更改任何状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 默认为 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  导入受支持的凭证。默认关闭。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许应用操作替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。在非交互模式下为必需。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过应用前备份。当本地存在 OpenClaw 状态时，需要搭配 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当应用操作原本会因跳过备份而被拒绝时，必须与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 格式打印计划或应用结果。使用 `--json` 且未设置 `--yes` 时，应用操作会打印计划且不会修改状态。
</ParamField>

## 安全模型

`openclaw migrate` 采用“先预览”的模式。

<AccordionGroup>
  <Accordion title="应用前预览">
    提供商会在任何更改发生前返回逐项计划，其中包括冲突、已跳过项目和敏感项目。JSON 计划、应用输出和迁移报告会对嵌套的疑似密钥字段进行脱敏，例如 API 密钥、令牌、授权头、Cookie 和密码。

    `openclaw migrate apply <provider>` 会先预览计划并在更改状态前提示确认，除非设置了 `--yes`。在非交互模式下，应用操作需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    应用操作会在执行迁移前创建并验证 OpenClaw 备份。如果本地还不存在 OpenClaw 状态，则会跳过备份步骤并继续迁移。若要在状态已存在时跳过备份，请同时传递 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，应用操作会拒绝继续。请先查看计划，然后在确实需要替换现有目标时使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入项目级备份。
  </Accordion>
  <Accordion title="密钥">
    默认绝不会导入密钥。使用 `--include-secrets` 以导入受支持的凭证。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置的 Claude 提供商默认会在 `~/.claude` 检测 Claude Code 状态。使用 `--from <path>` 可导入特定的 Claude Code 主目录或项目根目录。

<Tip>
有关面向用户的操作指南，请参阅 [从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 会导入的内容

- 将项目中的 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入到 OpenClaw Agent 工作区。
- 将用户的 `~/.claude/CLAUDE.md` 追加到工作区的 `USER.md`。
- 从项目的 `.mcp.json`、Claude Code 的 `~/.claude.json` 以及 Claude Desktop 的 `claude_desktop_config.json` 导入 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude skill 目录。
- 将 Claude 命令 Markdown 文件转换为仅支持手动调用的 OpenClaw Skills。

### 归档和手动审查状态

Claude 的 hooks、权限、环境默认值、本地记忆、路径范围规则、子智能体、缓存、计划和项目历史会保留在迁移报告中，或作为需手动审查的项目进行报告。OpenClaw 不会自动执行 hooks、复制宽泛的允许列表，也不会自动导入 OAuth/Desktop 凭证状态。

## Hermes 提供商

内置的 Hermes 提供商默认会在 `~/.hermes` 检测状态。当 Hermes 位于其他位置时，请使用 `--from <path>`。

### Hermes 会导入的内容

- 来自 `config.yaml` 的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型提供商及自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
- 将 `SOUL.md` 和 `AGENTS.md` 导入到 OpenClaw Agent 工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区记忆文件中。
- OpenClaw 文件记忆的 Memory 配置默认值，以及针对外部记忆提供商（如 Honcho）的归档或手动审查项目。
- `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills。
- 来自 `skills.config` 的逐个 skill 配置值。
- 来自 `.env` 的受支持 API 密钥，仅在使用 `--include-secrets` 时导入。

### 支持的 `.env` 键名

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会被复制到迁移报告中供手动审查，但不会加载到正在使用的 OpenClaw 配置或凭证中。这样可以保留不透明或不安全的状态，而不会假装 OpenClaw 能自动执行或信任它：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### 应用之后

```bash
openclaw doctor
```

## 插件契约

迁移源是插件。插件会在 `openclaw.plugin.json` 中声明其提供商 id：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

在运行时，插件会调用 `api.registerMigrationProvider(...)`。该提供商实现 `detect`、`plan` 和 `apply`。核心负责 CLI 编排、备份策略、提示、JSON 输出以及冲突预检。核心会将已审查的计划传入 `apply(ctx, plan)`；仅当该参数因兼容性而缺失时，提供商才可以重新构建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 来构建项目和汇总计数，还可以使用 `openclaw/plugin-sdk/migration-runtime` 来执行具备冲突感知的文件复制、仅归档报告复制以及迁移报告生成。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移选项。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用同一个插件迁移提供商，并且在应用前仍会显示预览。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已经有本地状态，请先重置配置、凭证、会话和工作区。针对现有设置的“备份加覆盖”或“合并导入”仍受功能开关限制。
</Note>

## 相关内容

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的操作指南。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的操作指南。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 迁移到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装与注册。

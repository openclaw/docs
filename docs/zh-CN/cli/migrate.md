---
read_when:
    - 你想从 Hermes 或其他智能体系统迁移到 OpenClaw
    - 你正在添加一个插件拥有的迁移提供商
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-04-29T19:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

通过插件拥有的迁移提供商从另一个智能体系统导入状态。内置提供商覆盖 [Claude](/zh-CN/install/migrating-claude) 和 [Hermes](/zh-CN/install/migrating-hermes)；第三方插件可以注册其他提供商。

<Tip>
面向用户的演练请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)和[从 Hermes 迁移](/zh-CN/install/migrating-hermes)。[迁移中心](/zh-CN/install/migrating)列出了所有路径。
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
  已注册迁移提供商的名称，例如 `hermes`。运行 `openclaw migrate list` 查看已安装的提供商。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划并退出，不更改状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 默认使用 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  导入受支持的凭证。默认关闭。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许应用操作替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。在非交互模式下必需。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过应用前备份。当本地 OpenClaw 状态存在时需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当应用操作本来会拒绝跳过备份时，必须与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印计划或应用结果。使用 `--json` 但不使用 `--yes` 时，应用操作会打印计划且不会改变状态。
</ParamField>

## 安全模型

`openclaw migrate` 采用预览优先。

<AccordionGroup>
  <Accordion title="应用前预览">
    在任何更改发生之前，提供商会返回逐项计划，包括冲突、跳过的项和敏感项。JSON 计划、应用输出和迁移报告会遮盖嵌套的类似密钥的键，例如 API key、token、authorization header、cookie 和密码。

    `openclaw migrate apply <provider>` 会预览计划，并在更改状态前提示确认，除非设置了 `--yes`。在非交互模式下，应用操作需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    应用操作会在应用迁移之前创建并验证 OpenClaw 备份。如果尚不存在本地 OpenClaw 状态，则跳过备份步骤，迁移可以继续。若要在状态存在时跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，应用操作会拒绝继续。查看计划，然后在确认要替换现有目标时使用 `--overwrite` 重新运行。提供商仍可在迁移报告目录中为被覆盖的文件写入项级备份。
  </Accordion>
  <Accordion title="密钥">
    默认绝不会导入密钥。使用 `--include-secrets` 导入受支持的凭证。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置 Claude 提供商默认在 `~/.claude` 检测 Claude Code 状态。使用 `--from <path>` 导入特定的 Claude Code 主目录或项目根目录。

<Tip>
面向用户的演练请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 会导入什么

- 将项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入 OpenClaw Agent 工作区。
- 将用户 `~/.claude/CLAUDE.md` 追加到工作区 `USER.md`。
- 从项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 导入 MCP server 定义。
- 包含 `SKILL.md` 的 Claude skill 目录。
- 将 Claude command Markdown 文件转换为只能手动调用的 OpenClaw skills。

### 仅归档和人工审查状态

Claude hook、权限、环境默认值、本地内存、按路径限定的规则、subagent、缓存、计划和项目历史会保留在迁移报告中，或报告为人工审查项。OpenClaw 不会自动执行 hook、复制宽泛 allowlist，或导入 OAuth/Desktop 凭证状态。

## Hermes 提供商

内置 Hermes 提供商默认在 `~/.hermes` 检测状态。当 Hermes 位于其他位置时使用 `--from <path>`。

### Hermes 会导入什么

- 来自 `config.yaml` 的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型提供商和自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP server 定义。
- 将 `SOUL.md` 和 `AGENTS.md` 导入 OpenClaw Agent 工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区内存文件。
- OpenClaw 文件内存的内存配置默认值，以及外部内存提供商（例如 Honcho）的归档或人工审查项。
- 位于 `skills/<name>/` 下且包含 `SKILL.md` 文件的 Skills。
- 来自 `skills.config` 的每个 Skill 配置值。
- 来自 `.env` 的受支持 API key，仅在使用 `--include-secrets` 时导入。

### 受支持的 `.env` 键

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会复制到迁移报告中供人工审查，但不会加载到实时 OpenClaw 配置或凭证中。这会保留不透明或不安全的状态，而不会假装 OpenClaw 可以自动执行或信任它：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### 应用后

```bash
openclaw doctor
```

## 插件契约

迁移源是插件。插件在 `openclaw.plugin.json` 中声明其提供商 ID：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

运行时，插件会调用 `api.registerMigrationProvider(...)`。提供商实现 `detect`、`plan` 和 `apply`。核心拥有 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心会将已审查的计划传入 `apply(ctx, plan)`，并且为了兼容性，提供商只能在缺少该参数时重新构建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 来构建项和统计摘要，并使用 `openclaw/plugin-sdk/migration-runtime` 来执行冲突感知的文件复制、仅归档报告复制、缓存的配置运行时包装器和迁移报告。

## 新手引导集成

当提供商检测到已知源时，新手引导可以提供迁移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的插件迁移提供商，并且仍会在应用前显示预览。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已经有本地状态，请先重置配置、凭证、会话和工作区。备份加覆盖或合并导入功能对现有设置启用功能门控。
</Note>

## 相关内容

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的演练。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的演练。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 移动到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。

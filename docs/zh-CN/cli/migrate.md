---
read_when:
    - 你想从 Hermes 或其他智能体系统迁移到 OpenClaw
    - 你正在添加一个由插件拥有的迁移提供商
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-05-10T19:28:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

通过插件拥有的迁移提供商，从另一个智能体系统导入状态。内置提供商覆盖 Codex CLI 状态、[Claude](/zh-CN/install/migrating-claude) 和 [Hermes](/zh-CN/install/migrating-hermes)；第三方插件可以注册其他提供商。

<Tip>
用户可见的操作指南见[从 Claude 迁移](/zh-CN/install/migrating-claude)和[从 Hermes 迁移](/zh-CN/install/migrating-hermes)。[迁移中心](/zh-CN/install/migrating)列出了所有路径。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
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
  导入支持的凭据。默认关闭。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许应用操作替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。非交互模式下必需。
</ParamField>
<ParamField path="--skill <name>" type="string">
  按技能名称或条目 ID 选择一个技能复制条目。重复该标志可迁移多个技能。省略时，交互式 Codex 迁移会显示复选框选择器，非交互式迁移会保留所有计划的技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  按插件名称或条目 ID 选择一个 Codex 插件安装条目。重复该标志可迁移多个 Codex 插件。省略时，交互式 Codex 迁移会显示原生 Codex 插件复选框选择器，非交互式迁移会保留所有计划的插件。这只适用于由 Codex app-server 清单发现的源端已安装 `openai-curated` Codex 插件。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过应用前备份。本地 OpenClaw 状态存在时需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当应用操作本应拒绝跳过备份时，必须与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印计划或应用结果。使用 `--json` 且没有 `--yes` 时，应用操作会打印计划且不会改变状态。
</ParamField>

## 安全模型

`openclaw migrate` 优先预览。

<AccordionGroup>
  <Accordion title="Preview before apply">
    提供商会在任何更改发生之前返回逐项计划，包括冲突、跳过的条目和敏感条目。JSON 计划、应用输出和迁移报告会遮盖嵌套的疑似密钥键，例如 API key、token、授权标头、cookie 和密码。

    `openclaw migrate apply <provider>` 会预览计划，并在更改状态前提示，除非设置了 `--yes`。在非交互模式下，应用操作需要 `--yes`。

  </Accordion>
  <Accordion title="Backups">
    应用操作会在应用迁移前创建并验证 OpenClaw 备份。如果还没有本地 OpenClaw 状态，备份步骤会被跳过，迁移可以继续。若要在状态存在时跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="Conflicts">
    当计划包含冲突时，应用操作会拒绝继续。查看计划后，如果确实打算替换现有目标，请使用 `--overwrite` 重新运行。提供商仍可在迁移报告目录中为被覆盖文件写入条目级备份。
  </Accordion>
  <Accordion title="Secrets">
    默认永不导入密钥。使用 `--include-secrets` 导入支持的凭据。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置 Claude 提供商默认检测 `~/.claude` 中的 Claude Code 状态。使用 `--from <path>` 导入特定 Claude Code 主目录或项目根目录。

<Tip>
用户可见的操作指南见[从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 导入的内容

- 项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入到 OpenClaw 智能体工作区。
- 用户 `~/.claude/CLAUDE.md` 追加到工作区 `USER.md`。
- 来自项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude 技能目录。
- Claude 命令 Markdown 文件转换为仅能手动调用的 OpenClaw 技能。

### 归档和手动审核状态

Claude 钩子、权限、环境默认值、本地记忆、路径范围规则、子智能体、缓存、计划和项目历史会保留在迁移报告中，或报告为手动审核条目。OpenClaw 不会自动执行钩子、复制宽泛的允许列表，或导入 OAuth/Desktop 凭据状态。

## Codex 提供商

内置 Codex 提供商默认检测 `~/.codex` 中的 Codex CLI 状态，或在设置了 `CODEX_HOME` 环境变量时检测该变量指向的位置。使用 `--from <path>` 清点特定 Codex 主目录。

当你迁移到 OpenClaw Codex harness，并希望有意识地提升有用的个人 Codex CLI 资产时，请使用此提供商。本地 Codex app-server 启动使用每个智能体自己的 `CODEX_HOME` 和 `HOME` 目录，因此默认不会读取你的个人 Codex CLI 状态。

在交互式终端中运行 `openclaw migrate codex` 会预览完整计划，然后在最终应用确认前打开复选框选择器。技能复制条目会先提示。使用 `Toggle all on` 或 `Toggle all off` 进行批量选择；计划中的技能初始为选中，冲突技能初始为未选中，`Skip for now` 会跳过本次运行的技能复制，同时继续进入插件选择。当源端已安装的精选 Codex 插件可迁移且未提供 `--plugin` 时，迁移随后会按插件名称提示激活原生 Codex 插件。除非目标 OpenClaw Codex 插件配置中已经有该插件，插件条目初始为选中。现有目标插件初始为未选中，并显示冲突提示，例如 `conflict: plugin exists`；选择 `Toggle all off` 可在该次运行中不迁移任何原生 Codex 插件，或选择 `Skip for now` 在应用前停止。对于脚本化或精确运行，请为每个技能传入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

使用 `--plugin <name>` 将原生 Codex 插件迁移以非交互方式限制为一个或多个源端已安装的精选插件：

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 导入的内容

- `$CODEX_HOME/skills` 下的 Codex CLI 技能目录，不包括 Codex 的 `.system` 缓存。
- `$HOME/.agents/skills` 下的个人 AgentSkills，在你想要每个智能体独立拥有时复制到当前 OpenClaw 智能体工作区。
- 通过 Codex app-server `plugin/list` 发现的源端已安装 `openai-curated` Codex 插件。应用操作会为每个所选插件调用 app-server `plugin/install`，即使目标 app-server 已经报告该插件已安装并启用。迁移后的 Codex 插件只能在选择原生 Codex harness 的会话中使用；它们不会暴露给 Pi、普通 OpenAI provider 运行、ACP 会话绑定或其他 harness。

### 手动审核 Codex 状态

Codex `config.toml`、原生 `hooks/hooks.json`、非精选市场，以及不是源端已安装精选插件的缓存插件包不会自动激活。它们会被复制或报告到迁移报告中，以便手动审核。

对于迁移后的源端已安装精选插件，应用操作会写入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- 每个所选插件对应一个显式插件条目，包含 `marketplaceName: "openai-curated"` 和 `pluginName`

迁移永不写入 `plugins["*"]`，也永不存储本地市场缓存路径。需要授权的安装会在受影响的插件条目上报告为 `status: "skipped"`、`reason: "auth_required"`，并带有已清理的应用标识符。其显式配置条目会被写为禁用，直到你重新授权并启用它们。其他安装失败会是条目范围的 `error` 结果。

如果规划期间无法使用 Codex app-server 插件清单，迁移会回退为缓存包建议条目，而不是让整个迁移失败。

## Hermes 提供商

内置 Hermes 提供商默认检测 `~/.hermes` 中的状态。Hermes 位于其他位置时使用 `--from <path>`。

### Hermes 导入的内容

- 来自 `config.yaml` 的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型提供商和自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
- `SOUL.md` 和 `AGENTS.md` 导入到 OpenClaw 智能体工作区。
- `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区记忆文件。
- OpenClaw 文件记忆的记忆配置默认值，以及外部记忆提供商（例如 Honcho）的归档或手动审核条目。
- `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills。
- 来自 `skills.config` 的每个技能配置值。
- 来自 `.env` 的受支持 API keys，仅在使用 `--include-secrets` 时导入。

### 支持的 `.env` 键

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会被复制到迁移报告中以便手动审核，但不会加载到实时 OpenClaw 配置或凭据中。这样可以保留不透明或不安全状态，而不会假装 OpenClaw 能自动执行或信任它：

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

运行时，插件调用 `api.registerMigrationProvider(...)`。提供商实现 `detect`、`plan` 和 `apply`。核心负责 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心会将已审核计划传入 `apply(ctx, plan)`，提供商只有在出于兼容性而未提供该参数时，才可以重新构建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 来构建条目和汇总计数，并使用 `openclaw/plugin-sdk/migration-runtime` 来执行冲突感知的文件复制、仅归档报告复制、缓存配置运行时包装器和迁移报告。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的插件迁移提供商，并且仍会在应用前显示预览。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已有本地状态，请先重置配置、凭证、会话和工作区。对于现有设置，备份后覆盖或合并导入受功能开关限制。
</Note>

## 相关内容

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的演练。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的演练。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 移动到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。

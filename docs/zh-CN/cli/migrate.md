---
read_when:
    - 你想从 Hermes 或其他智能体系统迁移到 OpenClaw
    - 你正在添加一个由插件拥有的迁移提供商
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-05-12T00:58:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

通过插件拥有的迁移提供商，从另一个智能体系统导入状态。内置提供商覆盖 Codex CLI 状态、[Claude](/zh-CN/install/migrating-claude) 和 [Hermes](/zh-CN/install/migrating-hermes)；第三方插件可以注册其他提供商。

<Tip>
如需面向用户的演练，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)和[从 Hermes 迁移](/zh-CN/install/migrating-hermes)。[迁移中心](/zh-CN/install/migrating)列出了所有路径。
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
  导入受支持的凭证。默认关闭。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许 apply 替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。非交互模式下必需。
</ParamField>
<ParamField path="--skill <name>" type="string">
  按技能名称或项目 ID 选择一个技能复制项目。重复该标志可迁移多个技能。省略时，交互式 Codex 迁移会显示复选框选择器，非交互式迁移会保留所有计划内技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  按插件名称或项目 ID 选择一个 Codex 插件安装项目。重复该标志可迁移多个 Codex 插件。省略时，交互式 Codex 迁移会显示原生 Codex 插件复选框选择器，非交互式迁移会保留所有计划内插件。这仅适用于 Codex app-server 清单发现的源安装 `openai-curated` Codex 插件。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过应用前备份。当本地 OpenClaw 状态存在时，需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当 apply 原本会拒绝跳过备份时，必须与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印计划或 apply 结果。使用 `--json` 且没有 `--yes` 时，apply 会打印计划且不会改变状态。
</ParamField>

## 安全模型

`openclaw migrate` 优先预览。

<AccordionGroup>
  <Accordion title="应用前预览">
    提供商会在任何更改发生前返回逐项计划，包括冲突、跳过的项目和敏感项目。JSON 计划、apply 输出和迁移报告会遮盖嵌套的疑似密钥键，例如 API 密钥、令牌、授权头、Cookie 和密码。

    除非设置 `--yes`，否则 `openclaw migrate apply <provider>` 会预览计划并在更改状态前提示确认。在非交互模式下，apply 需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    Apply 会在应用迁移前创建并验证 OpenClaw 备份。如果尚不存在本地 OpenClaw 状态，则跳过备份步骤并继续迁移。当状态存在时，如需跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，apply 会拒绝继续。审查计划后，如果有意替换现有目标，请使用 `--overwrite` 重新运行。提供商仍可在迁移报告目录中为被覆盖的文件写入项目级备份。
  </Accordion>
  <Accordion title="密钥">
    默认永远不会导入密钥。使用 `--include-secrets` 导入受支持的凭证。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置 Claude 提供商默认检测 `~/.claude` 中的 Claude Code 状态。使用 `--from <path>` 导入特定 Claude Code 主目录或项目根目录。

<Tip>
如需面向用户的演练，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 导入内容

- 将项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入 OpenClaw Agent 工作区。
- 将用户 `~/.claude/CLAUDE.md` 追加到工作区 `USER.md`。
- 来自项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude 技能目录。
- 转换为仅手动调用的 OpenClaw Skills 的 Claude 命令 Markdown 文件。

### 归档和手动审查状态

Claude 钩子、权限、环境默认值、本地记忆、路径作用域规则、子智能体、缓存、计划和项目历史会保留在迁移报告中，或报告为手动审查项目。OpenClaw 不会自动执行钩子、复制宽泛允许列表，或导入 OAuth/Desktop 凭证状态。

## Codex 提供商

内置 Codex 提供商默认检测 `~/.codex` 中的 Codex CLI 状态，或者在设置了 `CODEX_HOME` 环境变量时检测该位置。使用 `--from <path>` 清点特定 Codex 主目录。

当迁移到 OpenClaw Codex harness，并希望有意识地提升有用的个人 Codex CLI 资产时，请使用此提供商。本地 Codex app-server 启动使用按智能体隔离的 `CODEX_HOME` 和 `HOME` 目录，因此默认不会读取你的个人 Codex CLI 状态。

在交互式终端中运行 `openclaw migrate codex` 会预览完整计划，然后在最终 apply 确认前打开复选框选择器。技能复制项目会先提示。使用 `Toggle all on` 或 `Toggle all off` 进行批量选择；计划内技能默认选中，冲突技能默认未选中，`Skip for now` 会在本次运行中跳过技能复制，同时仍继续进行插件选择。当源安装的精选 Codex 插件可迁移且未提供 `--plugin` 时，迁移随后会按插件名称提示激活原生 Codex 插件。插件项目默认选中，除非目标 OpenClaw Codex 插件配置中已经有该插件。现有目标插件默认未选中，并显示类似 `conflict: plugin exists` 的冲突提示；选择 `Toggle all off` 可在该次运行中不迁移任何原生 Codex 插件，或选择 `Skip for now` 在应用前停止。对于脚本化或精确运行，请为每个技能传入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

使用 `--plugin <name>` 将非交互式原生 Codex 插件迁移限制为一个或多个源安装的精选插件：

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 导入内容

- `$CODEX_HOME/skills` 下的 Codex CLI 技能目录，不包括 Codex 的 `.system` 缓存。
- `$HOME/.agents/skills` 下的个人 AgentSkills，在你需要按智能体所有权时复制到当前 OpenClaw Agent 工作区。
- 通过 Codex app-server `plugin/list` 发现的源安装 `openai-curated` Codex 插件。Apply 会为每个选定插件调用 app-server `plugin/install`，即使目标 app-server 已报告该插件已安装并启用。迁移的 Codex 插件仅可在选择原生 Codex harness 的会话中使用；它们不会暴露给 Pi、普通 OpenAI provider 运行、ACP 对话绑定或其他 harness。

### 手动审查 Codex 状态

Codex `config.toml`、原生 `hooks/hooks.json`、非精选 marketplace，以及不是源安装精选插件的缓存插件包不会自动激活。它们会被复制或报告到迁移报告中供手动审查。

对于迁移的源安装精选插件，apply 会写入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 为每个选定插件写入一个显式插件条目，其中包含 `marketplaceName: "openai-curated"` 和 `pluginName`

迁移永远不会写入 `plugins["*"]`，也永远不会存储本地 marketplace 缓存路径。需要认证的安装会在受影响插件项目上报告为 `status: "skipped"`、`reason: "auth_required"`，并带有已净化的应用标识符。它们的显式配置条目会以禁用状态写入，直到你重新授权并启用它们。其他安装失败会作为项目作用域的 `error` 结果。

如果规划期间 Codex app-server 插件清单不可用，迁移会回退到缓存包建议项目，而不是让整个迁移失败。

## Hermes 提供商

内置 Hermes 提供商默认检测 `~/.hermes` 中的状态。当 Hermes 位于其他位置时，使用 `--from <path>`。

### Hermes 导入内容

- 来自 `config.yaml` 的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型提供商和自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
- 将 `SOUL.md` 和 `AGENTS.md` 导入 OpenClaw Agent 工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区记忆文件。
- OpenClaw 文件记忆的记忆配置默认值，以及 Honcho 等外部记忆提供商的归档或手动审查项目。
- `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills。
- 来自 `skills.config` 的按技能配置值。
- 来自 `.env` 的受支持 API 密钥，仅在使用 `--include-secrets` 时导入。

### 支持的 `.env` 键

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会被复制到迁移报告中供手动审查，但不会加载到实时 OpenClaw 配置或凭证中。这会保留不透明或不安全的状态，同时不会假装 OpenClaw 可以自动执行或信任它：

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

运行时，插件调用 `api.registerMigrationProvider(...)`。提供商实现 `detect`、`plan` 和 `apply`。核心拥有 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心将已审查计划传入 `apply(ctx, plan)`，而提供商仅可在缺少该参数时出于兼容性重建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 进行项目构造和摘要计数，并使用 `openclaw/plugin-sdk/migration-runtime` 进行冲突感知的文件复制、仅归档报告复制、缓存的配置运行时包装器和迁移报告。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的插件迁移提供商，并且仍会在应用前显示预览。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已有本地状态，请先重置配置、凭证、会话和工作区。对于现有设置，备份后覆盖或合并导入受功能门控限制。
</Note>

## 相关内容

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的操作指南。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的操作指南。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 迁移到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。

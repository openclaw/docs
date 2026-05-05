---
read_when:
    - 你想从 Hermes 或其他智能体系统迁移到 OpenClaw
    - 你正在添加一个插件自有的迁移提供商
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-05-05T23:46:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

通过插件拥有的迁移提供商从另一个智能体系统导入状态。内置提供商覆盖 Codex CLI 状态、[Claude](/zh-CN/install/migrating-claude) 和 [Hermes](/zh-CN/install/migrating-hermes)；第三方插件可以注册其他提供商。

<Tip>
如需面向用户的操作指南，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)和[从 Hermes 迁移](/zh-CN/install/migrating-hermes)。[迁移中心](/zh-CN/install/migrating)列出了所有路径。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
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
  按 Skills 名称或条目 id 选择一个 Skills 复制条目。重复此标志可迁移多个 Skills。省略时，交互式 Codex 迁移会显示复选框选择器，非交互式迁移会保留所有计划内的 Skills。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过 apply 前备份。当本地 OpenClaw 状态存在时，需要 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当 apply 本来会拒绝跳过备份时，必须与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印计划或 apply 结果。使用 `--json` 且没有 `--yes` 时，apply 会打印计划且不修改状态。
</ParamField>

## 安全模型

`openclaw migrate` 优先预览。

<AccordionGroup>
  <Accordion title="应用前预览">
    提供商会在任何更改发生前返回逐项计划，包括冲突、跳过的条目和敏感条目。JSON 计划、apply 输出和迁移报告会遮盖嵌套的疑似密钥键名，例如 API key、令牌、授权标头、cookie 和密码。

    `openclaw migrate apply <provider>` 会预览计划并在更改状态前提示，除非设置了 `--yes`。在非交互模式下，apply 需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    Apply 会在应用迁移前创建并验证 OpenClaw 备份。如果还没有本地 OpenClaw 状态，备份步骤会被跳过，迁移可以继续。若要在状态存在时跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，apply 会拒绝继续。检查计划，然后在确实要替换现有目标时使用 `--overwrite` 重新运行。提供商仍可在迁移报告目录中为被覆盖的文件写入条目级备份。
  </Accordion>
  <Accordion title="密钥">
    默认绝不会导入密钥。使用 `--include-secrets` 导入受支持的凭证。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置 Claude 提供商默认在 `~/.claude` 检测 Claude Code 状态。使用 `--from <path>` 导入特定 Claude Code home 或项目根目录。

<Tip>
如需面向用户的操作指南，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 导入内容

- 将项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入 OpenClaw 智能体工作区。
- 将用户 `~/.claude/CLAUDE.md` 追加到工作区 `USER.md`。
- 来自项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 的 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude Skills 目录。
- 将 Claude 命令 Markdown 文件转换为只能手动调用的 OpenClaw Skills。

### 归档和人工审核状态

Claude 钩子、权限、环境默认值、本地记忆、路径作用域规则、子智能体、缓存、计划和项目历史会保留在迁移报告中，或报告为需要人工审核的条目。OpenClaw 不会自动执行钩子、复制宽泛的允许列表，或导入 OAuth/Desktop 凭证状态。

## Codex 提供商

内置 Codex 提供商默认在 `~/.codex` 检测 Codex CLI 状态，或者在设置该环境变量时检测 `CODEX_HOME`。使用 `--from <path>` 清点特定 Codex home。

当迁移到 OpenClaw Codex harness 并且你想有意识地提升有用的个人 Codex CLI 资产时，请使用此提供商。本地 Codex app-server 启动会使用每个智能体的 `CODEX_HOME` 和 `HOME` 目录，因此默认不会读取你的个人 Codex CLI 状态。

在交互式终端中运行 `openclaw migrate codex` 会预览完整计划，然后在最终 apply 确认前为 Skills 复制条目打开复选框选择器。使用 `Toggle all on` 或 `Toggle all off` 进行批量选择；计划中的 Skills 默认勾选，冲突的 Skills 默认不勾选，`Skip for now` 会保持 Skills 不变且不应用。对于脚本化或精确运行，请为每个 Skills 传入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex 导入内容

- `$CODEX_HOME/skills` 下的 Codex CLI Skills 目录，不包括 Codex 的 `.system` 缓存。
- `$HOME/.agents/skills` 下的个人 AgentSkills，在你希望按智能体拥有时会复制到当前 OpenClaw 智能体工作区。

### 需人工审核的 Codex 状态

Codex 原生插件、`config.toml` 和原生 `hooks/hooks.json` 不会自动激活。插件可能暴露 MCP 服务器、应用、钩子或其他可执行行为，因此提供商会报告它们以供审核，而不是将它们加载到 OpenClaw 中。配置和钩子文件会复制到迁移报告中以供人工审核。

## Hermes 提供商

内置 Hermes 提供商默认在 `~/.hermes` 检测状态。当 Hermes 位于其他位置时，请使用 `--from <path>`。

### Hermes 导入内容

- 来自 `config.yaml` 的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型提供商和自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
- 将 `SOUL.md` 和 `AGENTS.md` 导入 OpenClaw 智能体工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区记忆文件。
- OpenClaw 文件记忆的 Memory 配置默认值，以及针对 Honcho 等外部记忆提供商的归档或人工审核条目。
- `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills。
- 来自 `skills.config` 的每个 Skills 配置值。
- 来自 `.env` 的受支持 API key，仅在使用 `--include-secrets` 时导入。

### 受支持的 `.env` 键名

`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会复制到迁移报告中以供人工审核，但不会加载到实时 OpenClaw 配置或凭证中。这会保留不透明或不安全的状态，而不会假装 OpenClaw 可以自动执行或信任它：

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

迁移源是插件。插件在 `openclaw.plugin.json` 中声明其提供商 id：

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

运行时，插件会调用 `api.registerMigrationProvider(...)`。提供商实现 `detect`、`plan` 和 `apply`。Core 拥有 CLI 编排、备份策略、提示、JSON 输出和冲突预检。Core 会将已审核的计划传给 `apply(ctx, plan)`，并且提供商只有在该参数缺失时才可以为兼容性重新构建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 进行条目构造和摘要计数，并使用 `openclaw/plugin-sdk/migration-runtime` 进行冲突感知的文件复制、仅归档报告复制、缓存的配置 Runtime 包装器和迁移报告。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的插件迁移提供商，并且仍会在应用前显示预览。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已有本地状态，请先重置配置、凭证、会话和工作区。针对现有设置的备份加覆盖或合并导入目前受功能开关控制。
</Note>

## 相关

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的操作指南。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的操作指南。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 移动到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。

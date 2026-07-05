---
read_when:
    - 你想从 Hermes 或其他智能体系统迁移到 OpenClaw
    - 你正在添加一个插件拥有的迁移提供商
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-07-05T11:08:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

通过插件拥有的迁移提供商从另一个智能体系统导入状态。内置提供商覆盖 Claude、Codex CLI 和 [Hermes](/zh-CN/install/migrating-hermes)；插件可以注册更多提供商。

<Tip>
如需面向用户的逐步指南，请参阅 [从 Claude 迁移](/zh-CN/install/migrating-claude) 和 [从 Hermes 迁移](/zh-CN/install/migrating-hermes)。[迁移中心](/zh-CN/install/migrating) 列出了所有路径。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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

运行不带其他标志的 `openclaw migrate <provider>` 会先制定计划、预览，并在 TTY 中提示后再应用。`openclaw migrate plan <provider>` 和 `openclaw migrate apply <provider>` 会把预览和应用拆分为两个独立子命令，并使用相同标志。

<ParamField path="<provider>" type="string">
  已注册迁移提供商的名称，例如 `hermes`。运行 `openclaw migrate list` 查看已安装的提供商。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划后退出，不更改状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 默认使用 `~/.hermes`，Codex 默认使用 `~/.codex`（或 `$CODEX_HOME`），Claude 默认使用 `~/.claude`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  不提示就导入受支持的凭据。交互式应用会在导入检测到的认证凭据前询问，默认选择是；非交互式 `--yes` 需要 `--include-secrets` 才会导入这些凭据。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  跳过认证凭据导入，包括交互式提示。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许应用替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。非交互模式下必需。
</ParamField>
<ParamField path="--skill <name>" type="string">
  按技能名称或条目 ID 选择一个技能复制条目。重复该标志可迁移多个 Skills。省略时，交互式 Codex 迁移会显示复选框选择器，非交互式迁移会保留所有已规划的 Skills。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  按插件名称或条目 ID 选择一个 Codex 插件安装条目。重复该标志可迁移多个 Codex 插件。省略时，交互式 Codex 迁移会显示原生 Codex 插件复选框选择器，非交互式迁移会保留所有已规划的插件。仅适用于由 Codex app-server 清单发现的源端已安装 `openai-curated` Codex 插件。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  仅 Codex。规划原生插件激活前，强制执行一次新的源 Codex app-server `app/list` 遍历。默认关闭，以保持迁移规划快速。
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  迁移前备份归档路径或目录。透传给 `openclaw backup create`。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过应用前备份。当本地 OpenClaw 状态存在时，需要同时使用 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当应用原本会拒绝跳过备份时，必须与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印计划或应用结果。使用 `--json` 且不使用 `--yes` 时，应用会打印计划且不会改变状态。
</ParamField>

## 安全模型

`openclaw migrate` 以预览优先。

<AccordionGroup>
  <Accordion title="应用前预览">
    提供商会在任何内容更改前返回逐项计划，包括冲突、已跳过条目和敏感条目。JSON 计划、应用输出和迁移报告会遮盖嵌套的疑似密钥键，例如 API keys、tokens、authorization headers、cookies 和 passwords。

    `openclaw migrate apply <provider>` 会先预览计划并提示，然后才更改状态，除非设置了 `--yes`。在非交互模式下，应用需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    应用会在执行迁移前创建并验证 OpenClaw 备份。如果还没有本地 OpenClaw 状态，备份步骤会被跳过，迁移继续。若状态存在时要跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，应用会拒绝继续。检查计划后，如果确实要替换现有目标，请用 `--overwrite` 重新运行。提供商仍可在迁移报告目录中为被覆盖的文件写入条目级备份。
  </Accordion>
  <Accordion title="密钥">
    交互式应用会询问是否导入检测到的认证凭据，默认选择是。使用 `--no-auth-credentials` 跳过它们，或配合 `--yes` 使用 `--include-secrets` 进行无人值守的凭据导入。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置 Claude 提供商默认在 `~/.claude` 检测 Claude Code 状态。使用 `--from <path>` 导入特定 Claude Code 主目录或项目根目录。

<Tip>
如需面向用户的逐步指南，请参阅 [从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 导入哪些内容

- 项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入到 OpenClaw 智能体工作区（`AGENTS.md`）。
- 用户 `~/.claude/CLAUDE.md` 追加到工作区 `USER.md`。
- 来自项目 `.mcp.json`、Claude Code `~/.claude.json`（包括其按项目划分的条目）以及 Claude Desktop `claude_desktop_config.json` 的 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude 技能目录（用户 `~/.claude/skills` 和项目 `.claude/skills`）。
- Claude 命令 Markdown 文件（用户 `~/.claude/commands` 和项目 `.claude/commands`）转换为仅可手动调用的 OpenClaw Skills。

### 归档和人工审核状态

Claude hooks、权限、环境默认值、项目 `CLAUDE.local.md`、`.claude/rules`、用户和项目 `agents/` 目录，以及项目历史（`~/.claude` 下的 `projects`、`cache`、`plans`）会保存在迁移报告中，或报告为人工审核条目。OpenClaw 不会自动执行 hooks、复制宽泛的 allowlists，或导入 OAuth/Desktop 凭据状态。

## Codex 提供商

内置 Codex 提供商默认在 `~/.codex` 检测 Codex CLI 状态，或在设置了 `CODEX_HOME` 环境变量时使用该位置。使用 `--from <path>` 盘点特定 Codex 主目录。

当你迁移到 OpenClaw Codex harness，并希望有意提升有用的个人 Codex CLI 资产时，请使用此提供商。本地 Codex app-server 启动使用按 Agent 配置的 `CODEX_HOME`，因此默认不会读取你的个人 `~/.codex`。普通进程 `HOME` 仍会继承，因此 Codex 可以看到共享的 `$HOME/.agents/*` Skills/插件市场条目，子进程也可以找到用户主目录中的配置和 tokens。

在交互式终端中运行 `openclaw migrate codex` 会预览完整计划，然后在最终应用确认前打开复选框选择器。技能复制条目会先提示。使用 `Toggle all on` 或 `Toggle all off` 进行批量选择。按空格切换行，或按 Enter 激活高亮行并继续。已规划 Skills 初始为选中，冲突 Skills 初始为未选中，`Skip for now` 会跳过本次运行的技能复制，同时继续进入插件选择。当源端已安装的精选 Codex 插件可迁移且未提供 `--plugin` 时，迁移随后会按插件名称提示原生 Codex 插件激活。除非目标 OpenClaw Codex 插件配置已包含该插件，否则插件条目初始为选中。现有目标插件初始为未选中，并显示类似 `conflict: plugin exists` 的冲突提示；选择 `Toggle all off` 可在该运行中不迁移任何原生 Codex 插件，或选择 `Skip for now` 在应用前停止。

对于脚本化或精确运行，请显式选择一个或多个 Skills 或插件：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 导入哪些内容

- `$CODEX_HOME/skills` 下的 Codex CLI 技能目录，不包括 Codex 的 `.system` 缓存。
- `$HOME/.agents/skills` 下的个人 AgentSkills，会复制到当前 OpenClaw 智能体工作区，以实现按 Agent 配置的所有权。
- 通过 Codex app-server `plugin/list` 发现的源端已安装 `openai-curated` Codex 插件。规划会对每个已启用的已安装插件读取 `plugin/read`。

由 App 支持的插件迁移有额外关卡：

- 由 App 支持的插件要求源 Codex app-server 账户是 ChatGPT 订阅账户。非 ChatGPT 或缺失账户响应会以 `codex_subscription_required` 跳过。
- 默认情况下，迁移不会调用源 `app/list`，因此通过账户关卡的由 App 支持插件会在没有源 App 可访问性验证的情况下进入规划，账户查询传输失败会以 `codex_account_unavailable` 跳过。
- 传入 `--verify-plugin-apps` 可强制获取新的源 `app/list` 快照，并要求每个拥有的 App 在规划原生激活前都存在、已启用且可访问。在该模式下，账户查询传输失败会继续进入源 App 清单验证。快照仅保存在当前进程内存中；绝不会写入迁移输出或目标配置。

禁用的插件、不可读取的插件详情、受订阅限制的源账户，以及（设置 `--verify-plugin-apps` 时）缺失、禁用或不可访问的 App，会变成带类型化原因的人工跳过条目，而不是目标配置条目。应用会为每个选中的合格插件调用 app-server `plugin/install`，即使目标 app-server 已报告该插件已安装并启用。已迁移的 Codex 插件仅在选择原生 Codex harness 的会话中可用；它们不会暴露给 OpenClaw 提供商运行、ACP 对话绑定或其他 harness。

### 人工审核 Codex 状态

Codex `config.toml`、原生 `hooks/hooks.json`、非精选市场、并非源端已安装精选插件的缓存插件包，以及未通过源订阅关卡的源端已安装插件，不会自动激活。设置 `--verify-plugin-apps` 时，未通过源 App 清单关卡的插件也会被跳过。所有这些都会复制到迁移报告中或在其中报告，以供人工审核。

对于已迁移的源端已安装精选插件，应用会写入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 为每个选中的插件写入一个显式插件条目，其中包含 `marketplaceName: "openai-curated"` 和 `pluginName`

迁移绝不会写入 `plugins["*"]`，也绝不会存储本地市场缓存路径。

跳过的插件不会写入目标配置。源端订阅失败会在手动项上以类型化原因报告：`codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 时，源应用清单失败也可能显示为 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。目标端需要凭证的安装会在受影响的插件项上报告为 `status: "skipped"`、`reason: "auth_required"`，并带有经过清理的应用标识符；它们的显式配置条目会以禁用状态写入，直到你重新授权并启用它们。其他安装失败是限定到单项的 `error` 结果。

如果规划期间 Codex app-server 插件清单不可用，迁移会回退到缓存的内置包建议项，而不是让整个迁移失败。

## Hermes 提供商

内置 Hermes 提供商默认检测 `~/.hermes` 中的状态。如果 Hermes 位于其他位置，请使用 `--from <path>`。

### Hermes 导入内容

- 来自 `config.yaml` 的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型提供商和自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
- 将 `SOUL.md` 和 `AGENTS.md` 导入 OpenClaw 智能体工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区记忆文件。
- OpenClaw 文件记忆的记忆配置默认值，以及针对 Honcho 等外部记忆提供商的归档或手动审核项。
- `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills。
- 来自 `skills.config` 的按 Skills 配置值。
- 当接受交互式凭证迁移，或设置了 `--include-secrets` 时，从 OpenCode `auth.json` 导入 OpenCode OpenAI OAuth 凭证。Hermes `auth.json` OAuth 条目是旧版状态，会报告为需要手动 OpenAI 重新授权或 Doctor 修复。
- 当接受交互式凭证迁移，或设置了 `--include-secrets` 时，从 Hermes `.env` 和 OpenCode `auth.json` 导入受支持的 API key 和令牌。

### 支持的 `.env` 键

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会复制到迁移报告中供手动审核，但不会加载到实时 OpenClaw 配置或凭证中。这样可以保留不透明或不安全的状态，同时不会假装 OpenClaw 可以自动执行或信任它：`plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`state.db`。

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

运行时，插件会调用 `api.registerMigrationProvider(...)`。提供商实现 `detect`、`plan` 和 `apply`。核心负责 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心会将已审核的计划传入 `apply(ctx, plan)`，提供商只能在为兼容性而缺少该参数时重新构建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 来构造项目和汇总计数，并使用 `openclaw/plugin-sdk/migration-runtime` 来执行感知冲突的文件复制、仅归档报告复制、缓存配置运行时包装器和迁移报告。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用同一个插件迁移提供商，并且在应用前仍会显示预览。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已有本地状态，请先重置配置、凭证、会话和工作区。对于现有设置，备份加覆盖或合并导入属于受功能门控的能力。
</Note>

## 相关

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的演练。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的演练。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 移动到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。

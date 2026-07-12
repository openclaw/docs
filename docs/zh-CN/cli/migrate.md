---
read_when:
    - 你想从 Hermes 或其他智能体系统迁移到 OpenClaw
    - 你正在添加一个由插件所有的迁移提供程序
summary: '`openclaw migrate` 的 CLI 参考（从其他智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-07-11T20:26:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

通过插件所有的迁移提供商，从另一个智能体系统导入状态。内置提供商涵盖 Claude、Codex CLI 和 [Hermes](/zh-CN/install/migrating-hermes)；插件可以注册其他提供商。

<Tip>
有关面向用户的操作指南，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)和[从 Hermes 迁移](/zh-CN/install/migrating-hermes)。[迁移中心](/zh-CN/install/migrating)列出了所有迁移路径。
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

运行不带其他标志的 `openclaw migrate <provider>` 会生成计划并显示预览，然后在应用前进行提示（如果位于 TTY 中）。`openclaw migrate plan <provider>` 和 `openclaw migrate apply <provider>` 使用相同的标志，将预览和应用拆分为不同的子命令。

<ParamField path="<provider>" type="string">
  已注册迁移提供商的名称，例如 `hermes`。运行 `openclaw migrate list` 可查看已安装的提供商。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划并退出，不更改状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 默认为 `~/.hermes`，Codex 默认为 `~/.codex`（或 `$CODEX_HOME`），Claude 默认为 `~/.claude`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  无需提示即可导入支持的凭据。交互式应用会在导入检测到的身份验证凭据前询问，并默认选中“是”；非交互式 `--yes` 需要配合 `--include-secrets` 才能导入这些凭据。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  跳过身份验证凭据导入，包括交互式提示。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许应用操作替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。在非交互模式下为必需项。
</ParamField>
<ParamField path="--skill <name>" type="string">
  按技能名称或项目 ID 选择一个技能复制项。重复使用该标志可迁移多个技能。如果省略，交互式 Codex 迁移会显示复选框选择器，而非交互式迁移会保留计划中的所有技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  按插件名称或项目 ID 选择一个 Codex 插件安装项。重复使用该标志可迁移多个 Codex 插件。如果省略，交互式 Codex 迁移会显示原生 Codex 插件复选框选择器，而非交互式迁移会保留计划中的所有插件。仅适用于由 Codex app-server 清单发现、从源安装的 `openai-curated` Codex 插件。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  仅适用于 Codex。在规划原生插件激活前，强制重新遍历源 Codex app-server 的 `app/list`。默认关闭，以保持迁移规划的速度。
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  迁移前备份归档的路径或目录。原样传递给 `openclaw backup create`。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过应用前的备份。当本地 OpenClaw 状态存在时，需要配合 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当应用操作原本会拒绝跳过备份时，需要与 `--no-backup` 一同使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 格式输出计划或应用结果。当使用 `--json` 但未使用 `--yes` 时，应用操作会输出计划，并且不会改变状态。
</ParamField>

## 安全模型

`openclaw migrate` 始终先预览。

<AccordionGroup>
  <Accordion title="应用前预览">
    在进行任何更改前，提供商会返回逐项列出的计划，其中包括冲突、跳过的项目和敏感项目。JSON 计划、应用输出和迁移报告会隐去嵌套的疑似密钥键，例如 API 密钥、令牌、授权标头、Cookie 和密码。

    除非设置了 `--yes`，否则 `openclaw migrate apply <provider>` 会先预览计划，并在更改状态前提示确认。在非交互模式下，应用操作需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    应用操作会在应用迁移前创建并验证 OpenClaw 备份。如果本地尚无 OpenClaw 状态，则会跳过备份步骤并继续迁移。如果状态已存在但需要跳过备份，请同时传递 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划中存在冲突时，应用操作会拒绝继续。请检查计划；如果确实要替换现有目标，请使用 `--overwrite` 重新运行。提供商仍可能在迁移报告目录中为被覆盖的文件写入项目级备份。
  </Accordion>
  <Accordion title="机密信息">
    交互式应用会询问是否导入检测到的身份验证凭据，并默认选中“是”。使用 `--no-auth-credentials` 可跳过这些凭据；若要配合 `--yes` 进行无人值守的凭据导入，请使用 `--include-secrets`。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置的 Claude 提供商默认检测 `~/.claude` 中的 Claude Code 状态。使用 `--from <path>` 可导入指定的 Claude Code 主目录或项目根目录。

<Tip>
有关面向用户的操作指南，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 导入的内容

- 将项目的 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入 OpenClaw Agent 工作区（`AGENTS.md`）。
- 将用户的 `~/.claude/CLAUDE.md` 追加到工作区的 `USER.md`。
- 从项目的 `.mcp.json`、Claude Code 的 `~/.claude.json`（包括其中按项目划分的条目）和 Claude Desktop 的 `claude_desktop_config.json` 导入 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude 技能目录（用户的 `~/.claude/skills` 和项目的 `.claude/skills`）。
- 将 Claude 命令 Markdown 文件（用户的 `~/.claude/commands` 和项目的 `.claude/commands`）转换为只能手动调用的 OpenClaw 技能。

### 归档和手动审查状态

Claude 钩子、权限、环境默认值、项目的 `CLAUDE.local.md`、`.claude/rules`、用户和项目的 `agents/` 目录，以及项目历史记录（`~/.claude` 下的 `projects`、`cache`、`plans`）会保留在迁移报告中，或报告为需要手动审查的项目。OpenClaw 不会自动执行钩子、复制宽泛的允许列表，也不会导入 OAuth/Desktop 凭据状态。

## Codex 提供商

内置的 Codex 提供商默认检测 `~/.codex` 中的 Codex CLI 状态；设置 `CODEX_HOME` 环境变量后，则检测该变量指向的位置。使用 `--from <path>` 可清查指定的 Codex 主目录。

当你迁移到 OpenClaw Codex harness，并希望有意识地提升有用的个人 Codex CLI 资产时，请使用此提供商。本地 Codex app-server 启动会使用按智能体配置的 `CODEX_HOME`，因此默认不会读取你的个人 `~/.codex`。常规进程的 `HOME` 仍会被继承，因此 Codex 可以看到共享的 `$HOME/.agents/*` 技能和插件市场条目，子进程也可以找到用户主目录中的配置和令牌。

在交互式终端中运行 `openclaw migrate codex` 会预览完整计划，然后在最终应用确认前打开复选框选择器。首先提示选择技能复制项。使用 `Toggle all on` 或 `Toggle all off` 进行批量选择。按 Space 可切换行的选择状态，或按 Enter 激活突出显示的行并继续。计划中的技能初始为选中状态，存在冲突的技能初始为未选中状态，而 `Skip for now` 会跳过本次运行的技能复制，但仍会继续选择插件。当存在可迁移的、从源安装的精选 Codex 插件，并且未提供 `--plugin` 时，迁移随后会按插件名称提示激活原生 Codex 插件。除非目标 OpenClaw Codex 插件配置中已存在相应插件，否则插件项目初始为选中状态。目标中已存在的插件初始为未选中状态，并显示类似 `conflict: plugin exists` 的冲突提示；选择 `Toggle all off` 可在本次运行中不迁移任何原生 Codex 插件，选择 `Skip for now` 则会在应用前停止。

对于脚本化运行或需要精确控制的运行，请显式选择一个或多个技能或插件：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 导入的内容

- `$CODEX_HOME/skills` 下的 Codex CLI 技能目录，但不包括 Codex 的 `.system` 缓存。
- `$HOME/.agents/skills` 下的个人 AgentSkills；这些内容会复制到当前 OpenClaw Agent 工作区，以实现按智能体所有。
- 通过 Codex app-server 的 `plugin/list` 发现、从源安装的 `openai-curated` Codex 插件。规划阶段会对每个已启用的已安装插件读取 `plugin/read`。

由应用支持的插件迁移具有额外的门槛：

- 由应用支持的插件要求源 Codex app-server 账户是 ChatGPT 订阅账户。非 ChatGPT 账户或缺失账户的响应会被跳过，原因标记为 `codex_subscription_required`。
- 默认情况下，迁移不会调用源 `app/list`，因此通过账户门槛的、由应用支持的插件会在未验证源应用可访问性的情况下规划；账户查询传输失败则会以 `codex_account_unavailable` 为原因跳过。
- 传递 `--verify-plugin-apps` 可强制获取新的源 `app/list` 快照，并要求每个所有的应用均存在、已启用且可访问，然后才规划原生激活。在该模式下，账户查询传输失败会转而进行源应用清单验证。快照仅保留在当前进程的内存中；绝不会写入迁移输出或目标配置。

已禁用的插件、无法读取的插件详情、受订阅门槛限制的源账户，以及（设置 `--verify-plugin-apps` 时）缺失、已禁用或无法访问的应用，会成为带有类型化原因、需要手动处理的已跳过项目，而不会成为目标配置条目。对于每个选中的合格插件，应用操作都会调用 app-server 的 `plugin/install`，即使目标 app-server 已报告该插件已安装并启用。迁移后的 Codex 插件只能在选择原生 Codex harness 的会话中使用；它们不会暴露给 OpenClaw 提供商运行、ACP 对话绑定或其他 harness。

### 需要手动审查的 Codex 状态

Codex 的 `config.toml`、原生 `hooks/hooks.json`、非精选市场、并非从源安装的精选插件的缓存插件包，以及未通过源订阅门槛的从源安装插件，都不会自动激活。设置 `--verify-plugin-apps` 后，未通过源应用清单门槛的插件也会被跳过。所有这些内容都会复制到迁移报告中，或在报告中列出，以供手动审查。

对于迁移的、从源安装的精选插件，应用操作会写入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 为每个选中的插件写入一个显式插件条目，其中包含 `marketplaceName: "openai-curated"` 和 `pluginName`

迁移绝不会写入 `plugins["*"]`，也绝不会存储本地市场缓存路径。

跳过的插件不会写入目标配置。源端订阅失败会在手动处理项中以类型化原因报告：`codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 时，源应用清单失败也可能显示为 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。目标端需要身份验证的安装会在受影响的插件项中报告，并带有 `status: "skipped"`、`reason: "auth_required"` 和经过脱敏的应用标识符；其显式配置条目会以禁用状态写入，直到你重新授权并启用它们。其他安装失败会作为限定到具体条目的 `error` 结果报告。

如果在规划期间无法获取 Codex app-server 插件清单，迁移会回退到缓存的内置包建议项，而不会导致整个迁移失败。

## Hermes 提供商

内置 Hermes 提供商默认检测 `~/.hermes` 中的状态。如果 Hermes 位于其他位置，请使用 `--from <path>`。

### Hermes 导入的内容

- `config.yaml` 中的默认模型配置。
- `providers` 和 `custom_providers` 中配置的模型提供商和自定义 OpenAI 兼容端点。
- `mcp_servers` 或 `mcp.servers` 中的 MCP 服务器定义。
- 将 `SOUL.md` 和 `AGENTS.md` 导入 OpenClaw Agent 工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区记忆文件。
- OpenClaw 文件记忆的默认记忆配置，以及 Honcho 等外部记忆提供商的归档项或手动审核项。
- `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills。
- `skills.config` 中每个 Skill 的配置值。
- 当接受交互式凭据迁移或设置 `--include-secrets` 时，从 OpenCode `auth.json` 导入 OpenCode OpenAI OAuth 凭据。Hermes `auth.json` 中的 OAuth 条目属于旧版状态，会报告为需要手动重新进行 OpenAI 身份验证或由 Doctor 修复。
- 当接受交互式凭据迁移或设置 `--include-secrets` 时，从 Hermes `.env` 和 OpenCode `auth.json` 导入受支持的 API 密钥和令牌。

### 支持的 `.env` 键

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`。

### 仅归档状态

OpenClaw 无法安全解析的 Hermes 状态会复制到迁移报告中，供手动审核，但不会加载到实际使用的 OpenClaw 配置或凭据中。这样可以保留不透明或不安全的状态，同时不会假装 OpenClaw 能自动执行或信任它：`plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`state.db`。

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

运行时，插件调用 `api.registerMigrationProvider(...)`。提供商实现 `detect`、`plan` 和 `apply`。核心负责 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心将已审核的计划传入 `apply(ctx, plan)`；仅当出于兼容性而未提供该参数时，提供商才可以重新构建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 构建条目和统计摘要，也可以使用 `openclaw/plugin-sdk/migration-runtime` 进行冲突感知的文件复制、仅归档报告复制、缓存的配置运行时封装和迁移报告生成。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移选项。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用同一个插件迁移提供商，并且在应用前仍会显示预览。

<Note>
新手引导导入要求使用全新的 OpenClaw 设置。如果你已有本地状态，请先重置配置、凭据、会话和工作区。对现有设置执行“备份后覆盖”或合并导入受功能开关限制。
</Note>

## 相关内容

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的操作指南。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的操作指南。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 迁移到新计算机。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。

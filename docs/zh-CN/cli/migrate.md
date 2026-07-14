---
read_when:
    - 你想从 Hermes 或其他智能体系统迁移到 OpenClaw
    - 你正在添加一个由插件负责的迁移提供程序
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-07-14T13:33:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: a4129b176ae2ca6b73eb9ddba618baccade9da19fe168db290b60e9a088b22fb
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

通过插件自有的迁移提供商，从另一个智能体系统导入状态。内置提供商涵盖 Claude、Codex CLI 和 [Hermes](/zh-CN/install/migrating-hermes)；插件可以注册其他提供商。

<Tip>
有关面向用户的操作指南，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)和[从 Hermes 迁移](/zh-CN/install/migrating-hermes)。[迁移中心](/zh-CN/install/migrating)列出了所有路径。
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

不带其他标志运行 `openclaw migrate <provider>` 时，会制定并预览计划，并且在 TTY 中会先提示再应用。`openclaw migrate plan <provider>` 和 `openclaw migrate apply <provider>` 将预览与应用拆分为两个使用相同标志的独立子命令。

<ParamField path="<provider>" type="string">
  已注册迁移提供商的名称，例如 `hermes`。运行 `openclaw migrate list` 可查看已安装的提供商。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划并退出，不更改状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 会依次采用 `$HERMES_HOME` 和活动配置文件，然后使用平台默认值（`~/.hermes` 或 `%LOCALAPPDATA%\hermes`）。Codex 默认为 `~/.codex`（或 `$CODEX_HOME`），Claude 默认为 `~/.claude`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  无需提示即可导入支持的凭据。交互式应用会询问是否导入检测到的身份验证凭据，并默认选择“是”；非交互式 `--yes` 需要使用 `--include-secrets` 才能导入这些凭据。
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
  按技能名称或项目 ID 选择一个技能复制项目。重复使用此标志可迁移多个技能。省略时，交互式 Codex 迁移会显示复选框选择器，非交互式迁移则保留所有计划中的技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  按插件名称或项目 ID 选择一个 Codex 插件安装项目。重复使用此标志可迁移多个 Codex 插件。省略时，交互式 Codex 迁移会显示 Native Codex plugins 复选框选择器，非交互式迁移则保留所有计划中的插件。仅适用于由 Codex app-server 清单发现的、从源安装的 `openai-curated` Codex 插件。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  仅适用于 Codex。在规划原生插件激活之前，强制重新遍历源 Codex app-server 的 `app/list`。默认关闭，以保持迁移规划快速。
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  迁移前备份归档的路径或目录。原样传递给 `openclaw backup create`。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过应用前备份。当本地 OpenClaw 状态存在时，需要同时使用 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当应用操作原本会拒绝跳过备份时，需要与 `--no-backup` 一同使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 格式输出计划或应用结果。使用 `--json` 且不使用 `--yes` 时，应用操作会输出计划，但不会更改状态。
</ParamField>

## 安全模型

`openclaw migrate` 采用预览优先模式。

<AccordionGroup>
  <Accordion title="应用前预览">
    在进行任何更改之前，提供商会返回逐项计划，其中包括冲突、跳过的项目和敏感项目。JSON 计划、应用输出和迁移报告会隐去看起来像机密信息的嵌套键，例如 API 密钥、令牌、授权标头、Cookie 和密码。

    `openclaw migrate apply <provider>` 会预览计划，并在更改状态前进行提示，除非设置了 `--yes`。在非交互模式下，应用操作需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    应用操作会在应用迁移前创建并验证 OpenClaw 备份。如果本地尚不存在 OpenClaw 状态，则跳过备份步骤并继续迁移。当状态存在时，若要跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划中存在冲突时，应用操作会拒绝继续。检查计划后，如果确实要替换现有目标，请使用 `--overwrite` 重新运行。提供商仍可在迁移报告目录中为被覆盖的文件写入项目级备份。
  </Accordion>
  <Accordion title="机密信息">
    交互式应用会询问是否导入检测到的身份验证凭据，并默认选择“是”。使用 `--no-auth-credentials` 可跳过这些凭据；若要通过 `--yes` 无人值守地导入凭据，请使用 `--include-secrets`。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置 Claude 提供商默认在 `~/.claude` 检测 Claude Code 状态。使用 `--from <path>` 可导入指定的 Claude Code 主目录或项目根目录。

<Tip>
有关面向用户的操作指南，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 导入的内容

- 来自 `~/.claude/projects/*/memory` 和用户配置的
  `autoMemoryDirectory` 的 Claude Code 自动记忆 Markdown，会复制到
  `memory/imports/claude-code/` 下以供索引检索。
- 将项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入 OpenClaw Agent 工作区（`AGENTS.md`）。
- 将用户 `~/.claude/CLAUDE.md` 追加到工作区 `USER.md`。
- 来自项目 `.mcp.json`、Claude Code `~/.claude.json`（包括其各项目条目）和 Claude Desktop `claude_desktop_config.json` 的 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude 技能目录（用户 `~/.claude/skills` 和项目 `.claude/skills`）。
- 将 Claude 命令 Markdown 文件（用户 `~/.claude/commands` 和项目 `.claude/commands`）转换为只能手动调用的 OpenClaw 技能。

### 归档和手动检查状态

Claude 钩子、权限、环境默认值、项目 `CLAUDE.local.md`、`.claude/rules`、用户和项目 `agents/` 目录，以及项目历史记录（`~/.claude` 下的 `projects`、`cache`、`plans`）会保存在迁移报告中，或报告为需要手动检查的项目。OpenClaw 不会自动执行钩子、复制宽泛的允许列表，也不会导入 OAuth/Desktop 凭据状态。

## Codex 提供商

内置 Codex 提供商默认在 `~/.codex` 检测 Codex CLI 状态；设置该环境变量时，则在 `CODEX_HOME` 检测。使用 `--from <path>` 可清点指定的 Codex 主目录。

迁移到 OpenClaw Codex harness 并希望有意识地提升有用的个人 Codex CLI 资产时，请使用此提供商。本地 Codex app-server 启动使用按 Agent 配置的 `CODEX_HOME`，因此默认不会读取你的个人 `~/.codex`。正常进程的 `HOME` 仍会继承，因此 Codex 可以看到共享的 `$HOME/.agents/*` 技能/插件市场条目，子进程也能找到用户主目录中的配置和令牌。

在交互式终端中运行 `openclaw migrate codex` 会预览完整计划，然后在最终应用确认前打开复选框选择器。系统会先提示选择技能复制项目。使用 `Toggle all on` 或 `Toggle all off` 可进行批量选择。按空格键切换行的选中状态，或按 Enter 键激活高亮行并继续。计划中的技能初始为选中状态，存在冲突的技能初始为未选中状态，而 `Skip for now` 会在本次运行中跳过技能复制，但仍会继续选择插件。如果存在可迁移的、从源安装的精选 Codex 插件，并且未提供 `--plugin`，迁移随后会提示按插件名称激活 Native Codex plugins。除非目标 OpenClaw Codex 插件配置中已存在相应插件，否则插件项目初始为选中状态。现有目标插件初始为未选中状态，并显示类似 `conflict: plugin exists` 的冲突提示；选择 `Toggle all off` 可在本次运行中不迁移任何 Native Codex plugins，选择 `Skip for now` 则会在应用前停止。

对于脚本化或精确运行，请明确选择一个或多个技能或插件：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 导入的内容

- 来自 `$CODEX_HOME/memories` 的合并版 Codex `MEMORY.md` 和 `memory_summary.md`，
  会复制到 `memory/imports/codex/` 下以供索引
  检索。不会导入原始 rollout 记忆。
- `$CODEX_HOME/skills` 下的 Codex CLI 技能目录，但不包括 Codex 的 `.system` 缓存。
- `$HOME/.agents/skills` 下的个人 AgentSkills，会复制到当前 OpenClaw Agent 工作区以实现按 Agent 所有权。
- 通过 Codex app-server `plugin/list` 发现的、从源安装的 `openai-curated` Codex 插件。规划会读取每个已启用且已安装插件的 `plugin/read`。

由应用支持的插件迁移有额外的门槛：

- 由应用支持的插件要求源 Codex app-server 账户为 ChatGPT 订阅账户。非 ChatGPT 账户或缺失账户的响应会以 `codex_subscription_required` 为原因跳过。
- 默认情况下，迁移不会调用源 `app/list`，因此通过账户门槛的应用支持型插件会在未验证源应用可访问性的情况下进行规划，而账户查询传输失败会以 `codex_account_unavailable` 为原因跳过。
- 传入 `--verify-plugin-apps` 可强制获取新的源 `app/list` 快照，并要求每个已有应用都存在、已启用且可访问，之后才会规划原生激活。在此模式下，账户查询传输失败会转而使用源应用清单验证。该快照仅在当前进程的内存中保留；绝不会写入迁移输出或目标配置。

已禁用的插件、无法读取的插件详情、受订阅限制的源账户，以及（设置 `--verify-plugin-apps` 时）缺失、已禁用或无法访问的应用，都会成为带有类型化原因、需要手动处理的跳过项目，而不是目标配置条目。应用操作会针对每个选定的合格插件调用 app-server `plugin/install`，即使目标 app-server 已报告该插件已安装并启用。迁移后的 Codex 插件仅可用于选择 Native Codex harness 的会话；它们不会提供给 OpenClaw 提供商运行、ACP 对话绑定或其他 harness。

### 需要手动检查的 Codex 状态

Codex `config.toml`、原生 `hooks/hooks.json`、未经精选的市场、并非通过源安装的精选插件的缓存插件包，以及未通过源订阅门控的通过源安装的插件，都不会自动激活。设置 `--verify-plugin-apps` 后，未通过源应用清单门控的插件也会被跳过。所有这些项目都会复制到迁移报告中或在其中报告，以供手动审查。

对于迁移的通过源安装的精选插件，执行以下写入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 为每个选定插件写入一个包含 `marketplaceName: "openai-curated"` 和 `pluginName` 的显式插件条目

迁移绝不会写入 `plugins["*"]`，也绝不会存储本地市场缓存路径。

被跳过的插件不会写入目标配置。源端订阅失败会在手动处理项中以类型化原因报告：`codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 时，源应用清单失败也可能显示为 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。目标端需要身份验证的安装会在受影响的插件项中通过 `status: "skipped"`、`reason: "auth_required"` 和经过清理的应用标识符报告；其显式配置条目会以禁用状态写入，直到你重新授权并启用它们。其他安装失败会作为限定于具体项的 `error` 结果报告。

如果规划期间无法获取 Codex 应用服务器插件清单，迁移会回退到缓存包提示项，而不是使整个迁移失败。

## Hermes 提供商

内置 Hermes 提供商遵循 `$HERMES_HOME` 和活动配置文件，然后使用平台默认值（`~/.hermes` 或 `%LOCALAPPDATA%\hermes`）。使用 `--from <path>` 覆盖设备发现。

### Hermes 导入的内容

- 来自 `config.yaml` 的默认模型配置。
- 来自 `model`、`providers` 和 `custom_providers` 的已配置模型提供商及自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。OpenClaw 的精确映射涵盖默认 Streamable HTTP 路由、OAuth 范围、布尔型 TLS 验证、分离的客户端证书/密钥路径，以及 Hermes 原生/资源/提示词工具策略。不受支持的 Hermes 专用运行时或凭据字段会报告以供手动审查。
- 将 `SOUL.md` 和 `AGENTS.md` 导入 OpenClaw Agent 工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区记忆文件。
- OpenClaw 文件记忆的默认记忆配置，以及 Honcho 等外部记忆提供商的仅归档项或手动审查项。
- `skills/` 下任意位置包含 `SKILL.md` 文件的 Skills；嵌套 Skills 会展平到工作区 Skills 目录中。
- 来自 `skills.config` 的各 Skills 配置值。
- 在接受交互式凭据迁移时，或设置 `--include-secrets` 时，迁移当前 Hermes OpenAI Codex OAuth 凭据和 OpenCode OpenAI OAuth 凭据。不要让 Hermes 和 OpenClaw 继续使用同一个已导入刷新授权。
- 在接受交互式凭据迁移时，或设置 `--include-secrets` 时，迁移 Hermes `.env` 和 OpenCode `auth.json` 中受支持的 API 密钥和令牌。

### 支持的 `.env` 键

`AI_GATEWAY_API_KEY`、`ALIBABA_API_KEY`、`ANTHROPIC_API_KEY`、`ARCEEAI_API_KEY`、`CEREBRAS_API_KEY`、`CHUTES_API_KEY`、`CLOUDFLARE_AI_GATEWAY_API_KEY`、`COPILOT_GITHUB_TOKEN`、`DASHSCOPE_API_KEY`、`DEEPINFRA_API_KEY`、`DEEPSEEK_API_KEY`、`FIREWORKS_API_KEY`、`GEMINI_API_KEY`、`GH_TOKEN`、`GITHUB_TOKEN`、`GLM_API_KEY`、`GOOGLE_API_KEY`、`GROQ_API_KEY`、`HF_TOKEN`、`HUGGINGFACE_HUB_TOKEN`、`KILOCODE_API_KEY`、`KIMICODE_API_KEY`、`KIMI_API_KEY`、`KIMI_CODING_API_KEY`、`MINIMAX_API_KEY`、`MINIMAX_CODING_API_KEY`、`MISTRAL_API_KEY`、`MODELSTUDIO_API_KEY`、`MOONSHOT_API_KEY`、`NVIDIA_API_KEY`、`OPENAI_API_KEY`、`OPENCODE_API_KEY`、`OPENCODE_GO_API_KEY`、`OPENCODE_ZEN_API_KEY`、`OPENROUTER_API_KEY`、`QIANFAN_API_KEY`、`QWEN_API_KEY`、`TOGETHER_API_KEY`、`VENICE_API_KEY`、`XAI_API_KEY`、`XIAOMI_API_KEY`、`ZAI_API_KEY`、`Z_AI_API_KEY`。

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会复制到迁移报告中以供手动审查，但不会加载到 OpenClaw 的实时配置或凭据中。其中包括 `plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`plans/`、`workspace/`、`skins/`、`kanban/`、配对/平台状态、Gateway 网关路由/进程状态，以及检测到的 Hermes SQLite 数据库。

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

运行时，插件调用 `api.registerMigrationProvider(...)`。提供商实现 `detect`、`plan` 和 `apply`。核心负责 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心将经审查的计划传入 `apply(ctx, plan)`；仅当为了兼容性而未提供该参数时，提供商才能重建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 构造项目并计算汇总数量，还可以使用 `openclaw/plugin-sdk/migration-runtime` 执行可感知冲突的文件复制、仅归档报告复制、缓存的配置运行时包装器和迁移报告。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移选项。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 均使用同一个插件迁移提供商，并且仍会在应用前显示预览。

<Note>
新手引导导入要求使用全新的 OpenClaw 设置。如果已有本地状态，请先重置配置、凭据、会话和工作区。对于现有设置，备份并覆盖或合并导入功能受功能门控限制。
</Note>

## 相关内容

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的操作指南。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的操作指南。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 迁移到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。

---
read_when:
    - 你想从 Hermes 或另一个智能体系统迁移到 OpenClaw
    - 你正在添加一个由插件拥有的迁移提供商
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-06-27T01:39:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

通过插件拥有的迁移提供商，从另一个智能体系统导入状态。内置提供商覆盖 Codex CLI 状态、[从 Claude 迁移](/zh-CN/install/migrating-claude) 和 [从 Hermes 迁移](/zh-CN/install/migrating-hermes)；第三方插件可以注册其他提供商。

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

<ParamField path="<provider>" type="string">
  已注册迁移提供商的名称，例如 `hermes`。运行 `openclaw migrate list` 查看已安装的提供商。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划后退出，不更改状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 默认使用 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  在不提示的情况下导入支持的凭证。交互式 apply 会在导入检测到的认证凭证前询问，默认选择是；非交互式 `--yes` 需要 `--include-secrets` 才会导入它们。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  跳过认证凭证导入，包括交互式提示。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许 apply 替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。非交互模式下必需。
</ParamField>
<ParamField path="--skill <name>" type="string">
  按技能名称或条目 ID 选择一个技能复制条目。重复该标志可迁移多个技能。省略时，交互式 Codex 迁移会显示复选框选择器，非交互式迁移会保留所有计划中的技能。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  按插件名称或条目 ID 选择一个 Codex 插件安装条目。重复该标志可迁移多个 Codex 插件。省略时，交互式 Codex 迁移会显示 Native Codex plugins 复选框选择器，非交互式迁移会保留所有计划中的插件。这仅适用于 Codex app-server 清单发现的源端已安装 `openai-curated` Codex 插件。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  仅适用于 Codex。在规划原生插件激活前，强制重新遍历源 Codex app-server `app/list`。默认关闭，以保持迁移规划快速。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过 apply 前备份。当本地 OpenClaw 状态存在时，需要同时使用 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当 apply 原本会拒绝跳过备份时，需要与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印计划或 apply 结果。使用 `--json` 且没有 `--yes` 时，apply 会打印计划且不改变状态。
</ParamField>

## 安全模型

`openclaw migrate` 优先预览。

<AccordionGroup>
  <Accordion title="应用前预览">
    在任何更改发生前，提供商会返回逐项列出的计划，包括冲突、已跳过条目和敏感条目。JSON 计划、apply 输出和迁移报告会遮盖嵌套的疑似密钥键，例如 API keys、tokens、authorization headers、cookies 和 passwords。

    `openclaw migrate apply <provider>` 会预览计划，并在更改状态前提示，除非设置了 `--yes`。在非交互模式下，apply 需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    Apply 会在应用迁移前创建并验证 OpenClaw 备份。如果尚不存在本地 OpenClaw 状态，则跳过备份步骤，迁移可以继续。要在状态存在时跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，apply 会拒绝继续。检查计划后，如果确认要替换现有目标，请使用 `--overwrite` 重新运行。提供商仍可能在迁移报告目录中为被覆盖的文件写入条目级备份。
  </Accordion>
  <Accordion title="密钥">
    交互式 apply 会询问是否导入检测到的认证凭证，默认选择是。使用 `--no-auth-credentials` 跳过它们，或使用 `--include-secrets` 搭配 `--yes` 执行无人值守凭证导入。
  </Accordion>
</AccordionGroup>

## Claude 提供商

内置 Claude 提供商默认在 `~/.claude` 检测 Claude Code 状态。使用 `--from <path>` 导入特定 Claude Code 主目录或项目根目录。

<Tip>
如需面向用户的演练，请参阅[从 Claude 迁移](/zh-CN/install/migrating-claude)。
</Tip>

### Claude 会导入什么

- 将项目 `CLAUDE.md` 和 `.claude/CLAUDE.md` 导入 OpenClaw Agent 工作区。
- 将用户 `~/.claude/CLAUDE.md` 追加到工作区 `USER.md`。
- 从项目 `.mcp.json`、Claude Code `~/.claude.json` 和 Claude Desktop `claude_desktop_config.json` 导入 MCP 服务器定义。
- 包含 `SKILL.md` 的 Claude 技能目录。
- 将 Claude 命令 Markdown 文件转换为只能手动调用的 OpenClaw 技能。

### 归档和手动审查状态

Claude hooks、权限、环境默认值、本地记忆、按路径作用域的规则、子智能体、缓存、计划和项目历史会保留在迁移报告中，或报告为手动审查条目。OpenClaw 不会自动执行 hooks、复制宽泛允许列表，或导入 OAuth/Desktop 凭证状态。

## Codex 提供商

内置 Codex 提供商默认在 `~/.codex` 检测 Codex CLI 状态，或在设置了 `CODEX_HOME` 环境变量时检测该位置。使用 `--from <path>` 清点特定 Codex 主目录。

当你迁移到 OpenClaw Codex harness，并想有意识地提升有用的个人 Codex CLI 资产时，请使用此提供商。本地 Codex app-server 启动会使用按智能体设置的 `CODEX_HOME`，因此默认不会读取你的个人 `~/.codex`。普通进程 `HOME` 仍会继承，因此 Codex 可以看到共享的 `$HOME/.agents/*` skills/plugin marketplace entries，子进程也可以找到用户主目录中的配置和令牌。

在交互式终端中运行 `openclaw migrate codex` 会预览完整计划，然后在最终 apply 确认前打开复选框选择器。技能复制条目会先提示。使用 `Toggle all on` 或 `Toggle all off` 进行批量选择。按 Space 切换行，或按 Enter 激活高亮行并继续。计划中的技能初始为选中，冲突技能初始为未选中，`Skip for now` 会跳过本次运行的技能复制，同时仍继续进入插件选择。当源端已安装的精选 Codex 插件可迁移且未提供 `--plugin` 时，迁移随后会按插件名称提示原生 Codex 插件激活。插件条目初始为选中，除非目标 OpenClaw Codex 插件配置已经包含该插件。现有目标插件初始为未选中，并显示类似 `conflict: plugin exists` 的冲突提示；选择 `Toggle all off` 可在该次运行中不迁移任何原生 Codex 插件，或选择 `Skip for now` 在应用前停止。对于脚本化或精确运行，请为每个技能传入一次 `--skill <name>`，例如：

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

使用 `--plugin <name>` 可将 Native Codex plugins 迁移以非交互方式限制为一个或多个源端已安装的精选插件：

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex 会导入什么

- `$CODEX_HOME/skills` 下的 Codex CLI 技能目录，不包括 Codex 的 `.system` 缓存。
- `$HOME/.agents/skills` 下的个人 AgentSkills，在你需要按智能体所有权时复制到当前 OpenClaw Agent 工作区。
- 通过 Codex app-server `plugin/list` 发现的源端已安装 `openai-curated` Codex 插件。规划会为每个已启用的已安装插件读取 `plugin/read`。由应用支持的插件要求源 Codex app-server 账户响应是 ChatGPT 订阅账户；非 ChatGPT 或缺失的账户响应会以 `codex_subscription_required` 跳过。默认情况下，迁移不会调用源端 `app/list`，因此通过账户门禁的由应用支持的插件会在未验证源应用可访问性的情况下被规划，并且账户查询传输失败会以 `codex_account_unavailable` 跳过。当你希望迁移强制获取新的源端 `app/list` 快照，并要求每个拥有的应用在规划原生激活前都存在、已启用且可访问时，请传入 `--verify-plugin-apps`。在该模式下，账户查询传输失败会继续进入源应用清单验证。源应用清单快照会保存在当前进程内存中；不会写入迁移输出或目标配置。已禁用插件、不可读插件详情、受订阅门禁限制的源账户，以及在请求验证时缺失应用、已禁用应用、不可访问应用或源应用清单失败，都会成为带类型原因的手动跳过条目，而不是目标配置条目。
  Apply 会为每个选中的合格插件调用 app-server `plugin/install`，即使目标 app-server 已报告该插件已安装且已启用。迁移后的 Codex 插件只能在选择 Native Codex harness 的会话中使用；它们不会暴露给 OpenClaw 提供商运行、ACP conversation bindings 或其他 harnesses。

### 手动审查 Codex 状态

Codex `config.toml`、原生 `hooks/hooks.json`、非精选 marketplace、不是源端已安装精选插件的缓存插件包，以及未通过源订阅门禁的源端已安装插件不会自动激活。设置 `--verify-plugin-apps` 时，未通过源应用清单门禁的插件也会被跳过。它们会被复制到迁移报告中，或在其中报告，以便手动审查。

对于已迁移的源端已安装精选插件，apply 会写入：

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 为每个选中的插件写入一个显式插件条目，包含 `marketplaceName: "openai-curated"` 和 `pluginName`

迁移绝不会写入 `plugins["*"]`，也绝不会存储本地 marketplace 缓存路径。源端订阅失败会在手动项目上报告，并带有类型化原因，例如 `codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled` 或 `plugin_read_unavailable`。使用 `--verify-plugin-apps` 时，源应用清单失败也可能显示为 `app_inaccessible`、`app_disabled`、`app_missing` 或 `app_inventory_unavailable`。跳过的插件不会写入目标配置。
目标端需要凭证的安装会在受影响的插件项目上报告，并带有 `status: "skipped"`、`reason: "auth_required"` 和经过清理的应用标识符。它们的显式配置条目会以禁用状态写入，直到你重新授权并启用它们。其他安装失败是限定到项目范围的 `error` 结果。

如果 Codex 应用服务器插件清单在规划期间不可用，迁移会回退到缓存的内置包建议项目，而不是让整个迁移失败。

## Hermes 提供商

内置的 Hermes 提供商默认在 `~/.hermes` 检测状态。当 Hermes 位于其他位置时，请使用 `--from <path>`。

### Hermes 导入内容

- 来自 `config.yaml` 的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型提供商和自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
- 将 `SOUL.md` 和 `AGENTS.md` 导入 OpenClaw Agent 工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区记忆文件。
- OpenClaw 文件记忆的记忆配置默认值，以及针对 Honcho 等外部记忆提供商的归档或手动审核项目。
- 在 `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills。
- 来自 `skills.config` 的每个 Skill 配置值。
- 当接受交互式凭证迁移，或设置了 `--include-secrets` 时，导入来自 OpenCode `auth.json` 的 OpenCode OpenAI OAuth 凭证。Hermes `auth.json` OAuth 条目是旧版状态，会报告用于手动 OpenAI 重新授权或 Doctor 修复。
- 当接受交互式凭证迁移，或设置了 `--include-secrets` 时，导入来自 Hermes `.env` 和 OpenCode `auth.json` 的受支持 API key 和令牌。

### 支持的 `.env` 键名

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### 仅归档状态

Hermes 中 OpenClaw 无法安全解释的状态会复制到迁移报告中，以供手动审核，但不会加载到实时 OpenClaw 配置或凭证中。这样可以保留不透明或不安全的状态，而不会假装 OpenClaw 可以自动执行或信任它：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
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

运行时，插件会调用 `api.registerMigrationProvider(...)`。提供商实现 `detect`、`plan` 和 `apply`。核心拥有 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心会将已审核的计划传入 `apply(ctx, plan)`；仅当出于兼容性而缺少该参数时，提供商才可以重新构建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 进行项目构造和摘要计数，还可以使用 `openclaw/plugin-sdk/migration-runtime` 进行可感知冲突的文件复制、仅归档报告复制、缓存的配置运行时包装器和迁移报告。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用相同的插件迁移提供商，并且在应用前仍会显示预览。

<Note>
新手引导导入需要全新的 OpenClaw 设置。如果你已有本地状态，请先重置配置、凭证、会话和工作区。对现有设置进行备份加覆盖或合并导入属于功能门控能力。
</Note>

## 相关

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的演练。
- [从 Claude 迁移](/zh-CN/install/migrating-claude)：面向用户的演练。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 移动到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。

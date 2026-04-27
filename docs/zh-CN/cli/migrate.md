---
read_when:
    - 你想从 Hermes 或另一个智能体系统迁移到 OpenClaw
    - 你正在添加一个由插件自行管理的迁移提供商
summary: '`openclaw migrate` 的 CLI 参考（从另一个智能体系统导入状态）'
title: 迁移
x-i18n:
    generated_at: "2026-04-27T08:25:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f509745e8967d0e89accd803acd5e9cfb1d25040f49cbe8d2cc858d6911792d8
    source_path: cli/migrate.md
    workflow: 15
---

# `openclaw migrate`

通过由插件自行管理的迁移提供商，从另一个智能体系统导入状态。

<Tip>
如需查看从 Hermes 迁移的面向用户操作指南，请参阅 [从 Hermes 迁移](/zh-CN/install/migrating-hermes)。
</Tip>

## 命令

```bash
openclaw migrate list
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  已注册迁移提供商的名称，例如 `hermes`。运行 `openclaw migrate list` 以查看已安装的提供商。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  构建计划并退出，不更改状态。
</ParamField>
<ParamField path="--from <path>" type="string">
  覆盖源状态目录。Hermes 默认为 `~/.hermes`。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  导入受支持的凭证。默认关闭。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  当计划报告冲突时，允许 apply 替换现有目标。
</ParamField>
<ParamField path="--yes" type="boolean">
  跳过确认提示。在非交互模式下必需。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  跳过应用前备份。当本地 OpenClaw 状态已存在时，需要同时使用 `--force`。
</ParamField>
<ParamField path="--force" type="boolean">
  当 apply 原本会拒绝跳过备份时，必须与 `--no-backup` 一起使用。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 格式输出计划或 apply 结果。使用 `--json` 且不带 `--yes` 时，apply 会输出计划且不会修改状态。
</ParamField>

## 安全模型

`openclaw migrate` 采用“先预览”的模式。

<AccordionGroup>
  <Accordion title="应用前预览">
    提供商会在做出任何更改前返回一份逐项计划，其中包括冲突、已跳过项目以及敏感项目。JSON 计划、apply 输出和迁移报告会隐藏嵌套的、看起来像密钥的键，例如 API 密钥、令牌、授权头、cookie 和密码。

    除非设置了 `--yes`，否则 `openclaw migrate apply <provider>` 会先预览计划并在更改状态前提示确认。在非交互模式下，apply 需要 `--yes`。

  </Accordion>
  <Accordion title="备份">
    Apply 会在应用迁移前创建并验证 OpenClaw 备份。如果本地 OpenClaw 状态尚不存在，则会跳过备份步骤，迁移仍可继续。若要在状态已存在时跳过备份，请同时传入 `--no-backup` 和 `--force`。
  </Accordion>
  <Accordion title="冲突">
    当计划存在冲突时，apply 会拒绝继续。请先审查计划，然后在确实有意替换现有目标时使用 `--overwrite` 重新运行。提供商仍可能将被覆盖文件的逐项备份写入迁移报告目录。
  </Accordion>
  <Accordion title="Secrets">
    默认绝不会导入 Secrets。使用 `--include-secrets` 可导入受支持的凭证。
  </Accordion>
</AccordionGroup>

## Hermes 提供商

内置的 Hermes 提供商默认会在 `~/.hermes` 检测状态。当 Hermes 位于其他位置时，请使用 `--from <path>`。

### 导入内容

- 来自 `config.yaml` 的默认模型配置。
- 来自 `providers` 和 `custom_providers` 的已配置模型提供商及自定义 OpenAI 兼容端点。
- 来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
- 将 `SOUL.md` 和 `AGENTS.md` 导入 OpenClaw 智能体工作区。
- 将 `memories/MEMORY.md` 和 `memories/USER.md` 追加到工作区 memory 文件中。
- OpenClaw 文件 memory 的默认 memory 配置，以及针对 Honcho 等外部 memory 提供商的归档或需人工审查项目。
- 在 `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills。
- 来自 `skills.config` 的按 Skill 划分配置值。
- 来自 `.env` 的受支持 API 密钥，仅在使用 `--include-secrets` 时导入。

### 支持的 `.env` 键

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### 仅归档状态

OpenClaw 无法安全解释的 Hermes 状态会被复制到迁移报告中，供人工审查，但不会被加载到实时 OpenClaw 配置或凭证中。这样可以保留不透明或不安全的状态，而不会假装 OpenClaw 能自动执行或信任这些状态：

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

在运行时，插件调用 `api.registerMigrationProvider(...)`。该提供商实现 `detect`、`plan` 和 `apply`。核心负责 CLI 编排、备份策略、提示、JSON 输出和冲突预检。核心会将已审查的计划传入 `apply(ctx, plan)`；仅当该参数因兼容性原因缺失时，提供商才可以重新构建计划。

提供商插件可以使用 `openclaw/plugin-sdk/migration` 来构建项目和汇总计数，也可以使用 `openclaw/plugin-sdk/migration-runtime` 来进行具备冲突感知的文件复制、仅归档报告复制以及生成迁移报告。

## 新手引导集成

当提供商检测到已知来源时，新手引导可以提供迁移选项。`openclaw onboard --flow import` 和 `openclaw setup --wizard --import-from hermes` 都使用同一个插件迁移提供商，并且在应用前仍会显示预览。

<Note>
新手引导导入要求全新的 OpenClaw 设置。如果你已经有本地状态，请先重置配置、凭证、会话和工作区。对于现有设置，带备份加覆盖或合并式导入属于功能门控范围。
</Note>

## 相关内容

- [从 Hermes 迁移](/zh-CN/install/migrating-hermes)：面向用户的操作指南。
- [迁移](/zh-CN/install/migrating)：将 OpenClaw 迁移到新机器。
- [Doctor](/zh-CN/gateway/doctor)：应用迁移后的健康检查。
- [插件](/zh-CN/tools/plugin)：插件安装与注册。

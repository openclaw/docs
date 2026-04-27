---
read_when:
    - 你正从 Hermes 迁移而来，并希望保留你的模型配置、提示词、记忆和 Skills
    - 你想了解 OpenClaw 会自动导入哪些内容，以及哪些内容会保持为仅归档状态
    - 你需要一条干净、可脚本化的迁移路径（CI、全新笔记本电脑、自动化）
summary: 通过可预览、可回滚的导入，从 Hermes 迁移到 OpenClaw
title: 从 Hermes 迁移
x-i18n:
    generated_at: "2026-04-27T08:44:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59aa622f9c60095db19f54d51b8bbde0d61b97402dc49bc9b7a3cb855176e16a
    source_path: install/migrating-hermes.md
    workflow: 15
---

OpenClaw 通过内置的迁移提供商导入 Hermes 状态。该提供商会在更改状态前预览所有内容，在计划和报告中隐去密钥，并在应用前创建经过验证的备份。

<Note>
导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭证、会话和工作区，或者在审查计划后直接使用带 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    最快的路径。向导会在 `~/.hermes` 检测到 Hermes，并在应用前显示预览。

    ```bash
    openclaw onboard --flow import
    ```

    或者指向特定来源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    对于脚本化或可重复执行的运行，请使用 `openclaw migrate`。完整参考请参见 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # 仅预览
    openclaw migrate apply hermes --yes  # 跳过确认并应用
    ```

    当 Hermes 位于 `~/.hermes` 之外时，添加 `--from <path>`。

  </Tab>
</Tabs>

## 导入内容

<AccordionGroup>
  <Accordion title="模型配置">
    - 来自 Hermes `config.yaml` 的默认模型选择。
    - 来自 `providers` 和 `custom_providers` 的已配置模型提供商及自定义 OpenAI 兼容端点。
  </Accordion>
  <Accordion title="MCP 服务器">
    来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
  </Accordion>
  <Accordion title="工作区文件">
    - `SOUL.md` 和 `AGENTS.md` 会复制到 OpenClaw 智能体工作区。
    - `memories/MEMORY.md` 和 `memories/USER.md` 会**追加**到对应的 OpenClaw 记忆文件中，而不是覆盖它们。
  </Accordion>
  <Accordion title="记忆配置">
    OpenClaw 文件记忆的默认记忆配置。像 Honcho 这样的外部记忆提供商会被记录为归档项或手动审查项，以便你有意识地迁移它们。
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` 下带有 `SKILL.md` 文件的 Skills 会被复制，同时复制 `skills.config` 中每个 Skill 的配置值。
  </Accordion>
  <Accordion title="API 密钥（可选启用）">
    设置 `--include-secrets` 以导入受支持的 `.env` 键：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。如果不带此标志，密钥绝不会被复制。
  </Accordion>
</AccordionGroup>

## 保持为仅归档的内容

该提供商会将以下内容复制到迁移报告目录以供手动审查，但**不会**将其加载到在线 OpenClaw 配置或凭证中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw 拒绝自动执行或信任这些状态，因为不同系统之间的格式和信任假设可能会发生漂移。审查归档后，再手动迁移你需要的内容。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    该计划会列出所有将发生的变更，包括冲突、已跳过的项目以及任何敏感项目。计划输出会隐去嵌套的疑似密钥键名。

  </Step>
  <Step title="带备份应用">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 会在应用前创建并验证备份。如果你还需要导入 API 密钥，请添加 `--include-secrets`。

  </Step>
  <Step title="运行 Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-CN/gateway/doctor) 会重新应用任何待处理的配置迁移，并检查导入过程中引入的问题。

  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    确认 Gateway 网关状态正常，并且你导入的模型、记忆和 Skills 已加载。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突时（目标位置已存在文件或配置值），应用会拒绝继续。

<Warning>
仅当替换现有目标是有意为之时，才使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入逐项备份。
</Warning>

对于全新的 OpenClaw 安装，冲突并不常见。它们通常出现在你对已经有用户修改的设置重复运行导入时。

如果在应用过程中出现冲突（例如配置文件上发生意外竞争），Hermes 会将其余依赖的配置项标记为 `skipped`，原因是 `blocked by earlier apply conflict`，而不是部分写入它们。迁移报告会记录每个被阻止的项目，以便你解决原始冲突后重新运行导入。

## 密钥

默认情况下，密钥绝不会被导入。

- 先运行 `openclaw migrate apply hermes --yes` 以导入非密钥状态。
- 如果你还希望复制受支持的 `.env` 键，请使用 `--include-secrets` 重新运行。
- 对于由 SecretRef 管理的凭证，请在导入完成后配置 SecretRef 来源。

## 用于自动化的 JSON 输出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且不带 `--yes` 时，apply 会打印计划且不会修改状态。这是用于 CI 和共享脚本的最安全模式。

## 故障排除

<AccordionGroup>
  <Accordion title="Apply 因冲突而拒绝执行">
    检查计划输出。每个冲突都会标明源路径和现有目标。你可以按项目决定是跳过、编辑目标，还是使用 `--overwrite` 重新运行。
  </Accordion>
  <Accordion title="Hermes 位于 ~/.hermes 之外">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导拒绝在现有设置上导入">
    新手引导导入需要全新设置。你可以重置状态并重新进行新手引导，或者直接使用 `openclaw migrate apply hermes`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="API 密钥没有导入">
    必须使用 `--include-secrets`，并且只识别上面列出的键。`.env` 中的其他变量会被忽略。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整 CLI 参考、插件契约和 JSON 结构。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [迁移](/zh-CN/install/migrating)：在机器之间迁移 OpenClaw 安装。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [智能体工作区](/zh-CN/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和记忆文件所在的位置。

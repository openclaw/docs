---
read_when:
    - 你正从 Hermes 迁移过来，并希望保留你的模型配置、提示词、记忆和 Skills
    - 你想了解 OpenClaw 会自动导入哪些内容，以及哪些内容会保持为仅归档状态
    - 你需要一条干净、可脚本化的迁移路径（CI、全新笔记本电脑、自动化）
summary: 通过可预览、可回滚的导入，从 Hermes 迁移到 OpenClaw
title: 从 Hermes 迁移
x-i18n:
    generated_at: "2026-04-27T08:07:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fdf09f21398d10a8cdf8e98237fbdfb3c56ade5b56e73a6e6ae01b5c201440d
    source_path: install/migrating-hermes.md
    workflow: 15
---

OpenClaw 通过内置的迁移 provider 导入 Hermes 状态。该 provider 会在更改状态前预览所有内容，在计划和报告中对密钥做脱敏处理，并在应用前创建已验证的备份。

<Note>
导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭证、会话和工作区，或者在查看计划后直接使用带 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    最快的路径。向导会在 `~/.hermes` 检测 Hermes，并在应用前显示预览。

    ```bash
    openclaw onboard --flow import
    ```

    或者指向特定来源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```
  </Tab>
  <Tab title="CLI">
    对于脚本化或可重复执行的运行，请使用 `openclaw migrate`。完整参考请参阅 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # 仅预览
    openclaw migrate apply hermes --yes  # 跳过确认并应用
    ```

    当 Hermes 位于 `~/.hermes` 之外时，添加 `--from <path>`。
  </Tab>
</Tabs>

## 导入的内容

<AccordionGroup>
  <Accordion title="模型配置">
    - 来自 Hermes `config.yaml` 的默认模型选择。
    - 来自 `providers` 和 `custom_providers` 的已配置模型提供商，以及自定义 OpenAI 兼容端点。
  </Accordion>
  <Accordion title="MCP 服务器">
    来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
  </Accordion>
  <Accordion title="工作区文件">
    - `SOUL.md` 和 `AGENTS.md` 会被复制到 OpenClaw 智能体工作区中。
    - `memories/MEMORY.md` 和 `memories/USER.md` 会**追加**到对应的 OpenClaw 记忆文件中，而不是覆盖它们。
  </Accordion>
  <Accordion title="记忆配置">
    OpenClaw 文件记忆的默认记忆配置。外部记忆提供商（例如 Honcho）会被记录为归档或需手动审核的项目，以便你谨慎迁移它们。
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` 下带有 `SKILL.md` 文件的 Skills 会被复制，同时也会复制来自 `skills.config` 的每个 Skill 配置值。
  </Accordion>
  <Accordion title="API 密钥（可选启用）">
    设置 `--include-secrets` 以导入受支持的 `.env` 键：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。如果不带该标志，密钥绝不会被复制。
  </Accordion>
</AccordionGroup>

## 保持为仅归档的内容

provider 会将以下内容复制到迁移报告目录中供手动审查，但**不会**将其加载到正在使用的 OpenClaw 配置或凭证中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw 会拒绝自动执行或信任这些状态，因为这些格式和信任假设在不同系统之间可能会发生变化。查看归档后，再手动迁移你需要的内容。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    该计划会列出将要更改的所有内容，包括冲突、跳过的项目以及任何敏感项。计划输出会对嵌套的疑似密钥键名做脱敏处理。
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

    [Doctor](/zh-CN/gateway/doctor) 会重新应用所有待处理的配置迁移，并检查导入期间引入的问题。
  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    确认 Gateway 网关状态正常，并且已加载你导入的模型、记忆和 Skills。
  </Step>
</Steps>

## 冲突处理

当计划报告冲突时（目标位置已存在文件或配置值），应用会拒绝继续。

<Warning>
仅当你明确要替换现有目标时，才使用 `--overwrite` 重新运行。对于被覆盖的文件，provider 仍可能会在迁移报告目录中写入逐项备份。
</Warning>

对于全新的 OpenClaw 安装，冲突并不常见。通常只有在你对已存在用户修改的设置重复运行导入时才会出现。

## 密钥

默认绝不会导入密钥。

- 先运行 `openclaw migrate apply hermes --yes` 导入非密钥状态。
- 如果你还希望复制受支持的 `.env` 键，请使用 `--include-secrets` 重新运行。
- 对于由 SecretRef 管理的凭证，请在导入完成后配置 SecretRef 来源。

## 用于自动化的 JSON 输出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且不带 `--yes` 时，apply 会打印计划且不会更改状态。这是用于 CI 和共享脚本的最安全模式。

## 故障排除

<AccordionGroup>
  <Accordion title="Apply 因冲突而拒绝执行">
    检查计划输出。每个冲突都会标明源路径和现有目标。根据每个项目决定是跳过、编辑目标，还是使用 `--overwrite` 重新运行。
  </Accordion>
  <Accordion title="Hermes 位于 ~/.hermes 之外">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导在现有设置上拒绝导入">
    新手引导导入需要全新设置。你可以重置状态后重新进行新手引导，或者直接使用 `openclaw migrate apply hermes`，它支持 `--overwrite` 和显式备份控制。
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
- [智能体工作区](/zh-CN/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和记忆文件的存放位置。

---
read_when:
    - 你正从 Hermes 迁移过来，并且希望保留你的模型配置、提示词、记忆和 Skills
    - 你想了解 OpenClaw 会自动导入哪些内容，以及哪些内容会保持为仅归档
    - 你需要一条干净、可脚本化的迁移路径（CI、全新笔记本电脑、自动化）
summary: 通过可预览、可逆的导入，从 Hermes 迁移到 OpenClaw
title: 从 Hermes 迁移
x-i18n:
    generated_at: "2026-04-27T08:25:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: f424defc61e4f1127adb6e99b504c1f3a84c59635293208bb24bf3113aa7724d
    source_path: install/migrating-hermes.md
    workflow: 15
---

OpenClaw 通过内置的迁移提供商导入 Hermes 状态。该提供商会在更改状态前预览所有内容，在计划和报告中隐藏密钥，并在应用前创建经过验证的备份。

<Note>
导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭证、会话和工作区，或者在查看计划后直接使用 `openclaw migrate` 并加上 `--overwrite`。
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
    对于可脚本化或可重复的运行，请使用 `openclaw migrate`。完整参考请见 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # 仅预览
    openclaw migrate apply hermes --yes  # 跳过确认并应用
    ```

    当 Hermes 不在 `~/.hermes` 下时，添加 `--from <path>`。

  </Tab>
</Tabs>

## 导入的内容

<AccordionGroup>
  <Accordion title="模型配置">
    - 来自 Hermes `config.yaml` 的默认模型选择。
    - 来自 `providers` 和 `custom_providers` 的已配置模型提供商以及自定义 OpenAI 兼容端点。
  </Accordion>
  <Accordion title="MCP 服务器">
    来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
  </Accordion>
  <Accordion title="工作区文件">
    - `SOUL.md` 和 `AGENTS.md` 会被复制到 OpenClaw 智能体工作区中。
    - `memories/MEMORY.md` 和 `memories/USER.md` 会**追加**到对应的 OpenClaw 记忆文件中，而不是覆盖它们。
  </Accordion>
  <Accordion title="记忆配置">
    OpenClaw 文件记忆的默认记忆配置。像 Honcho 这样的外部记忆提供商会被记录为归档项或需要手动审查的项，以便你有意识地迁移它们。
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` 下带有 `SKILL.md` 文件的 Skills 会被复制，同时还会复制来自 `skills.config` 的每个 Skill 配置值。
  </Accordion>
  <Accordion title="API 密钥（可选加入）">
    设置 `--include-secrets` 以导入受支持的 `.env` 键：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。如果不加这个标志，密钥绝不会被复制。
  </Accordion>
</AccordionGroup>

## 保持为仅归档的内容

该提供商会将以下内容复制到迁移报告目录中供手动审查，但**不会**将它们加载到在线的 OpenClaw 配置或凭证中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw 会拒绝自动执行或信任这些状态，因为不同系统之间的格式和信任假设可能会发生变化。查看归档后，再手动迁移你需要的内容。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    计划会列出所有将发生的更改，包括冲突、已跳过的项以及任何敏感项。计划输出会隐藏嵌套的疑似密钥键名。

  </Step>
  <Step title="带备份应用">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 会在应用前创建并验证备份。如果你还需要导入 API 密钥，请加上 `--include-secrets`。

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

    确认 Gateway 网关运行正常，并且已加载你导入的模型、记忆和 Skills。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突时（目标位置已存在文件或配置值），应用会拒绝继续。

<Warning>
只有在你明确打算替换现有目标时，才使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入按项目划分的备份。
</Warning>

对于全新的 OpenClaw 安装，冲突并不常见。它们通常出现在你对已经有用户编辑的设置重复运行导入时。

## 密钥

默认情况下绝不会导入密钥。

- 先运行 `openclaw migrate apply hermes --yes` 以导入非密钥状态。
- 如果你还希望一并复制受支持的 `.env` 键，请使用 `--include-secrets` 重新运行。
- 对于由 SecretRef 管理的凭证，请在导入完成后配置 SecretRef 来源。

## 用于自动化的 JSON 输出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且不加 `--yes` 时，apply 会打印计划且不会更改状态。这是 CI 和共享脚本中最安全的模式。

## 故障排除

<AccordionGroup>
  <Accordion title="应用因冲突而被拒绝">
    检查计划输出。每个冲突都会标明源路径和现有目标。针对每一项，决定是跳过、编辑目标，还是使用 `--overwrite` 重新运行。
  </Accordion>
  <Accordion title="Hermes 不在 ~/.hermes">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导在现有设置上拒绝导入">
    新手引导导入需要全新设置。你可以重置状态后重新新手引导，或者直接使用 `openclaw migrate apply hermes`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="API 密钥没有导入">
    必须使用 `--include-secrets`，并且只有上面列出的键会被识别。`.env` 中的其他变量会被忽略。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整 CLI 参考、插件契约和 JSON 结构。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [迁移](/zh-CN/install/migrating)：在不同机器之间迁移 OpenClaw 安装。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [智能体工作区](/zh-CN/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和记忆文件的存放位置。

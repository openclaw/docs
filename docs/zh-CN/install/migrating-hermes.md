---
read_when:
    - 你从 Hermes 迁移而来，并希望保留你的模型配置、提示词、记忆和 Skills
    - 你想了解 OpenClaw 会自动导入哪些内容，以及哪些内容保持仅归档
    - 你需要一条干净、脚本化的迁移路径（CI、全新笔记本电脑、自动化）
summary: 通过可预览且可逆的导入，从 Hermes 迁移到 OpenClaw
title: 从 Hermes 迁移
x-i18n:
    generated_at: "2026-04-28T11:57:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw 通过内置迁移提供商导入 Hermes 状态。该提供商会在更改状态前预览所有内容，在计划和报告中隐去密钥，并在应用前创建经过验证的备份。

<Note>
导入需要全新的 OpenClaw 设置。如果你已有本地 OpenClaw 状态，请先重置配置、凭证、会话和工作区，或者在审阅计划后直接使用带 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    最快路径。向导会在 `~/.hermes` 检测 Hermes，并在应用前显示预览。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定来源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 进行脚本化或可重复运行。完整参考见 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    当 Hermes 位于 `~/.hermes` 之外时，添加 `--from <path>`。

  </Tab>
</Tabs>

## 会导入哪些内容

<AccordionGroup>
  <Accordion title="模型配置">
    - 来自 Hermes `config.yaml` 的默认模型选择。
    - 来自 `providers` 和 `custom_providers` 的已配置模型提供商和自定义 OpenAI 兼容端点。

  </Accordion>
  <Accordion title="MCP 服务器">
    来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
  </Accordion>
  <Accordion title="工作区文件">
    - `SOUL.md` 和 `AGENTS.md` 会复制到 OpenClaw 智能体工作区。
    - `memories/MEMORY.md` 和 `memories/USER.md` 会**追加**到匹配的 OpenClaw 记忆文件，而不是覆盖它们。

  </Accordion>
  <Accordion title="记忆配置">
    OpenClaw 文件记忆的记忆配置默认值。Honcho 等外部记忆提供商会记录为归档或人工审阅项，方便你有意识地迁移它们。
  </Accordion>
  <Accordion title="Skills">
    位于 `skills/<name>/` 下且包含 `SKILL.md` 文件的 Skills 会被复制，同时复制来自 `skills.config` 的每项 Skills 配置值。
  </Accordion>
  <Accordion title="API 密钥（选择启用）">
    设置 `--include-secrets` 以导入受支持的 `.env` 键：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`OPENROUTER_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_API_KEY`、`GROQ_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`DEEPSEEK_API_KEY`。不带该标志时，密钥永远不会被复制。
  </Accordion>
</AccordionGroup>

## 哪些内容仅归档

提供商会将这些内容复制到迁移报告目录以供人工审阅，但**不会**将它们加载到实时 OpenClaw 配置或凭证中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

OpenClaw 拒绝自动执行或信任此状态，因为格式和信任假设可能在系统之间发生偏移。审阅归档后，手动迁移你需要的内容。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    计划会列出所有将发生的更改，包括冲突、跳过的项以及任何敏感项。计划输出会隐去嵌套的疑似密钥键。

  </Step>
  <Step title="带备份应用">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 会在应用前创建并验证备份。如果需要导入 API 密钥，请添加 `--include-secrets`。

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

    确认 Gateway 网关运行正常，并且导入的模型、记忆和 Skills 已加载。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突（文件或配置值已存在于目标位置）时，应用会拒绝继续。

<Warning>
只有在有意替换现有目标时，才使用 `--overwrite` 重新运行。提供商仍可能在迁移报告目录中为被覆盖的文件写入逐项备份。
</Warning>

对于全新的 OpenClaw 安装，冲突并不常见。它们通常会在你对已有用户编辑的设置重新运行导入时出现。

如果冲突在应用过程中出现（例如配置文件发生意外竞态），Hermes 会将剩余依赖配置项标记为 `skipped`，原因是 `blocked by earlier apply conflict`，而不是部分写入它们。迁移报告会记录每个被阻止的项，方便你解决原始冲突并重新运行导入。

## 密钥

默认情况下，密钥永远不会被导入。

- 先运行 `openclaw migrate apply hermes --yes` 以导入非密钥状态。
- 如果你还想复制受支持的 `.env` 键，请使用 `--include-secrets` 重新运行。
- 对于由 SecretRef 管理的凭证，请在导入完成后配置 SecretRef 来源。

## 用于自动化的 JSON 输出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且不使用 `--yes` 时，应用会打印计划且不改变状态。这是 CI 和共享脚本最安全的模式。

## 故障排除

<AccordionGroup>
  <Accordion title="应用因冲突被拒绝">
    检查计划输出。每个冲突都会标识来源路径和现有目标。逐项决定是跳过、编辑目标，还是使用 `--overwrite` 重新运行。
  </Accordion>
  <Accordion title="Hermes 位于 ~/.hermes 之外">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导拒绝在现有设置上导入">
    新手引导导入需要全新设置。你可以重置状态并重新进行新手引导，或者直接使用 `openclaw migrate apply hermes`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="API 密钥未导入">
    必须使用 `--include-secrets`，并且只会识别上面列出的键。`.env` 中的其他变量会被忽略。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整 CLI 参考、插件契约和 JSON 结构。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [迁移](/zh-CN/install/migrating)：在机器之间迁移 OpenClaw 安装。
- [Doctor](/zh-CN/gateway/doctor)：迁移后健康检查。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和记忆文件所在位置。

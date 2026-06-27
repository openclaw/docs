---
read_when:
    - 你从 Hermes 迁移而来，并想保留你的模型配置、提示词、记忆和技能
    - 你想了解 OpenClaw 会自动导入哪些内容，以及哪些内容保持仅归档
    - 你需要一条干净、脚本化的迁移路径（CI、全新笔记本电脑、自动化）
summary: 从 Hermes 迁移到 OpenClaw，并使用可预览、可回滚的导入
title: 从 Hermes 迁移
x-i18n:
    generated_at: "2026-06-27T02:19:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw 通过内置迁移提供商导入 Hermes 状态。该提供商会在更改状态前预览所有内容，在计划和报告中遮蔽密钥，并在应用前创建已验证的备份。

<Note>
导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭据、会话和工作区，或者在查看计划后，直接使用带 `--overwrite` 的 `openclaw migrate`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    最快的路径。向导会在 `~/.hermes` 检测 Hermes，并在应用前显示预览。

    ```bash
    openclaw onboard --flow import
    ```

    或者指向特定源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 执行脚本化或可重复运行。完整参考见 [`openclaw migrate`](/zh-CN/cli/migrate)。

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
    - 来自 `providers` 和 `custom_providers` 的已配置模型提供商以及自定义 OpenAI 兼容端点。

  </Accordion>
  <Accordion title="MCP 服务器">
    来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
  </Accordion>
  <Accordion title="工作区文件">
    - `SOUL.md` 和 `AGENTS.md` 会被复制到 OpenClaw Agent 工作区。
    - `memories/MEMORY.md` 和 `memories/USER.md` 会**追加**到匹配的 OpenClaw 记忆文件，而不是覆盖它们。

  </Accordion>
  <Accordion title="记忆配置">
    OpenClaw 文件记忆的记忆配置默认值。Honcho 等外部记忆提供商会记录为归档或手动审核项，以便你有意识地迁移它们。
  </Accordion>
  <Accordion title="Skills">
    位于 `skills/<name>/` 下并带有 `SKILL.md` 文件的 Skills 会被复制，同时复制来自 `skills.config` 的每个 Skill 配置值。
  </Accordion>
  <Accordion title="认证凭据">
    交互式 `openclaw migrate` 会在导入认证凭据前询问，默认选择是。接受的导入包括来自 OpenCode `auth.json` 的 OpenCode OpenAI OAuth 凭据、来自 OpenCode `auth.json` 的 OpenCode 和 GitHub Copilot 条目，以及[支持的 `.env` 键](/zh-CN/cli/migrate#supported-env-keys)。Hermes `auth.json` OAuth 条目属于旧版状态，会作为手动重新认证或 Doctor 工作显示，而不是导入到实时认证中。对于非交互式 `openclaw migrate` 凭据导入，使用 `--include-secrets`；要跳过它，使用 `--no-auth-credentials`；从新手引导向导导入时，使用新手引导的 `--import-secrets`。
  </Accordion>
</AccordionGroup>

## 哪些内容保持仅归档

该提供商会将这些内容复制到迁移报告目录以供手动审核，但**不会**将它们加载到实时 OpenClaw 配置或凭据中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw 拒绝自动执行或信任这些状态，因为格式和信任假设可能会在系统之间漂移。审核归档后，手动移动你需要的内容。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    计划会列出所有将要更改的内容，包括冲突、跳过的项目以及任何敏感项目。计划输出会遮蔽嵌套的疑似密钥键。

  </Step>
  <Step title="带备份应用">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 会在应用前创建并验证备份。这个非交互式示例会导入非密钥状态。去掉 `--yes` 运行以回答凭据提示，或者添加 `--include-secrets` 以在无人值守运行中包含支持的凭据。

  </Step>
  <Step title="运行 Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-CN/gateway/doctor) 会重新应用任何待处理的配置迁移，并检查导入期间引入的问题。

  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    确认 Gateway 网关健康，并且已加载你导入的模型、记忆和 Skills。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突（目标位置已存在文件或配置值）时，应用会拒绝继续。

<Warning>
只有在明确要替换现有目标时，才使用 `--overwrite` 重新运行。提供商仍可能会在迁移报告目录中为被覆盖的文件写入项目级备份。
</Warning>

对于全新的 OpenClaw 安装，冲突并不常见。它们通常出现在你对已经有用户编辑的设置重新运行导入时。

如果在应用过程中出现冲突（例如，配置文件上发生意外竞争），Hermes 会将其余依赖配置项标记为 `skipped`，原因为 `blocked by earlier apply conflict`，而不是部分写入它们。迁移报告会记录每个被阻塞的项目，以便你解决原始冲突并重新运行导入。

## 密钥

交互式 `openclaw migrate` 会询问是否导入检测到的认证凭据，默认选择是。

- 接受提示会导入来自 OpenCode `auth.json` 的 OpenCode OpenAI OAuth 凭据、来自 OpenCode `auth.json` 的 OpenCode 和 GitHub Copilot 条目，以及[支持的 `.env` 键](/zh-CN/cli/migrate#supported-env-keys)。Hermes `auth.json` OAuth 条目会报告为需要手动 OpenAI 重新认证或 Doctor 修复。
- 使用 `--no-auth-credentials`，或在提示中选择否，以仅导入非密钥状态。
- 使用带 `--yes` 的无人值守运行时，使用 `--include-secrets`。
- 从新手引导向导导入凭据时，使用新手引导的 `--import-secrets`。
- 对于由 SecretRef 管理的凭据，请在导入完成后配置 SecretRef 源。

## 用于自动化的 JSON 输出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且不使用 `--yes` 时，应用会打印计划且不会变更状态。这是 CI 和共享脚本最安全的模式。

## 故障排除

<AccordionGroup>
  <Accordion title="应用因冲突而拒绝">
    检查计划输出。每个冲突都会标识源路径和现有目标。逐项决定是跳过、编辑目标，还是使用 `--overwrite` 重新运行。
  </Accordion>
  <Accordion title="Hermes 位于 ~/.hermes 之外">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导拒绝在现有设置上导入">
    新手引导导入需要全新设置。你可以重置状态并重新进行新手引导，或者直接使用 `openclaw migrate apply hermes`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="API key 未导入">
    交互式 `openclaw migrate` 只有在你接受凭据提示时才会导入 API key。非交互式 `--yes` 运行需要 `--include-secrets`；新手引导导入需要 `--import-secrets`。只会识别[支持的 `.env` 键](/zh-CN/cli/migrate#supported-env-keys)；`.env` 中的其他变量会被忽略。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整 CLI 参考、插件契约和 JSON 形状。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [迁移](/zh-CN/install/migrating)：在机器之间移动 OpenClaw 安装。
- [Doctor](/zh-CN/gateway/doctor)：迁移后健康检查。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和记忆文件所在的位置。

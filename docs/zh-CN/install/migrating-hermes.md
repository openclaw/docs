---
read_when:
    - 你正从 Hermes 迁移过来，并希望保留你的模型配置、提示词、记忆和 Skills
    - 你想了解 OpenClaw 会自动导入哪些内容，以及哪些内容保持仅归档
    - 你需要一条干净、脚本化的迁移路径（CI、新笔记本电脑、自动化）
summary: 通过可预览、可逆的导入从 Hermes 迁移到 OpenClaw
title: 从 Hermes 迁移
x-i18n:
    generated_at: "2026-07-05T11:24:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

捆绑的 Hermes 迁移提供商会检测 `~/.hermes` 中的状态，在应用前预览每项更改，在计划和报告中遮盖密钥，并在触碰任何内容前写入一个已验证的 OpenClaw 备份。

<Note>
导入需要全新的 OpenClaw 设置。如果你已经有本地 OpenClaw 状态，请先重置配置、凭据、会话和工作区，或在查看计划后直接使用带 `--overwrite` 的 `openclaw migrate apply hermes`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    在 `~/.hermes` 检测 Hermes，并在应用前显示预览。

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

## 会导入什么

<AccordionGroup>
  <Accordion title="模型配置">
    - 来自 Hermes `config.yaml` 的默认模型选择。
    - 来自 `providers` 和 `custom_providers` 的已配置模型提供商和自定义 OpenAI 兼容端点。

  </Accordion>
  <Accordion title="MCP 服务器">
    来自 `mcp_servers` 或 `mcp.servers` 的 MCP 服务器定义。
  </Accordion>
  <Accordion title="工作区文件">
    - `SOUL.md` 和 `AGENTS.md` 会复制到 OpenClaw Agent 工作区。
    - `memories/MEMORY.md` 和 `memories/USER.md` 会**追加**到匹配的 OpenClaw 记忆文件，而不是覆盖它们。

  </Accordion>
  <Accordion title="记忆配置">
    OpenClaw 文件记忆的记忆配置默认值。Honcho 等外部记忆提供商会记录为归档或人工审核项，这样你可以有意识地迁移它们。
  </Accordion>
  <Accordion title="Skills">
    位于 `skills/<name>/` 下且带有 `SKILL.md` 文件的 Skills 会被复制，同时复制来自 `skills.config` 的每个 Skill 配置值。
  </Accordion>
  <Accordion title="身份验证凭据">
    交互式 `openclaw migrate` 会在导入身份验证凭据前询问，默认选择是。接受后会从 OpenCode 的 `auth.json` 导入 OpenCode OpenAI OAuth 和 GitHub Copilot 条目，以及[受支持的 Hermes `.env` 键](/zh-CN/cli/migrate#supported-env-keys)。Hermes 自己的 `auth.json` OAuth 条目是旧版状态：它们会作为人工重新认证/Doctor 项显示，而不是导入到实时身份验证中。使用 `--include-secrets` 在非交互运行中导入凭据，使用 `--no-auth-credentials` 完全跳过凭据导入，或使用新手引导向导的 `--import-secrets` 标志。
  </Accordion>
</AccordionGroup>

## 哪些只保留为归档

提供商会把这些复制到迁移报告目录供人工审核，但**不会**将它们加载到实时 OpenClaw 配置或凭据中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw 不会自动执行或信任这些状态，因为格式和信任假设可能在系统之间发生变化。审核归档后，手动迁移你需要的内容。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    该计划会列出所有将发生变化的内容，包括冲突、跳过的项和敏感项。输出中会遮盖嵌套的疑似密钥键。

  </Step>
  <Step title="应用并备份">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 会在应用前创建并验证备份。这个非交互示例只导入非密钥状态。不带 `--yes` 运行可交互回答凭据提示，或添加 `--include-secrets` 以在无人值守运行中包含受支持的凭据。

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

    确认 Gateway 网关健康，并且你导入的模型、记忆和 Skills 已加载。

  </Step>
</Steps>

## 冲突处理

当计划报告冲突时（目标处已存在文件或配置值），应用会拒绝继续。

<Warning>
仅在有意替换现有目标时，才使用 `--overwrite` 重新运行。提供商仍可能在迁移报告目录中为被覆盖的文件写入逐项备份。
</Warning>

全新安装时很少出现冲突。它们通常会在你针对已有用户编辑的设置重新运行导入时出现。

如果冲突在应用中途浮现（例如配置文件上出现意外竞争），Hermes 会把剩余依赖配置项标记为 `skipped`，原因为 `blocked by earlier apply conflict`，而不是写入部分内容。迁移报告会记录每个被阻塞的项，这样你可以解决原始冲突并重新运行导入。

## 密钥

交互式 `openclaw migrate` 会询问是否导入检测到的身份验证凭据，默认选择是。

- 接受后会从 OpenCode 的 `auth.json` 导入 OpenCode OpenAI OAuth 和 GitHub Copilot 条目，以及[受支持的 `.env` 键](/zh-CN/cli/migrate#supported-env-keys)。Hermes 自己的 `auth.json` OAuth 条目会改为报告为需要人工 OpenAI 重新认证或 Doctor 修复。
- 使用 `--no-auth-credentials`，或在提示中回答否，只导入非密钥状态。
- 使用 `--include-secrets` 在无人值守的 `--yes` 运行中导入凭据。
- 使用新手引导向导的 `--import-secrets` 标志从向导导入凭据。

## 用于自动化的 JSON 输出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且不使用 `--yes` 时，应用会打印计划且不变更状态，这是 CI 和共享脚本最安全的模式。

## 故障排查

<AccordionGroup>
  <Accordion title="应用因冲突而拒绝">
    检查计划输出。每个冲突都会标识源路径和现有目标。逐项决定是跳过、编辑目标，还是使用 `--overwrite` 重新运行。
  </Accordion>
  <Accordion title="Hermes 位于 ~/.hermes 之外">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导拒绝在现有设置上导入">
    新手引导导入需要全新设置。你可以重置状态并重新执行新手引导，或直接使用 `openclaw migrate apply hermes`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="API 密钥未导入">
    交互式 `openclaw migrate` 只有在你接受凭据提示时才会导入 API 密钥。非交互式 `--yes` 运行需要 `--include-secrets`；新手引导导入需要 `--import-secrets`。只有[受支持的 `.env` 键](/zh-CN/cli/migrate#supported-env-keys)会被识别，其他 `.env` 变量会被忽略。
  </Accordion>
</AccordionGroup>

## 相关

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整 CLI 参考、插件契约和 JSON 形状。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互标志。
- [迁移](/zh-CN/install/migrating)：在机器之间迁移 OpenClaw 安装。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和记忆文件所在的位置。

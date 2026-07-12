---
read_when:
    - 你正在从 Hermes 迁移，并希望保留你的模型配置、提示词、记忆和 Skills
    - 你想了解 OpenClaw 会自动导入哪些内容，以及哪些内容仅归档保存
    - 你需要一套简洁、可脚本化的迁移流程（CI、全新笔记本电脑、自动化）
summary: 通过可预览、可撤销的导入从 Hermes 迁移到 OpenClaw
title: 从 Hermes 迁移
x-i18n:
    generated_at: "2026-07-11T20:36:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

内置的 Hermes 迁移提供商会检测 `~/.hermes` 中的状态，在应用前预览每项更改，在计划和报告中隐去密钥，并在进行任何修改前写入并验证 OpenClaw 备份。

<Note>
导入需要全新的 OpenClaw 设置。如果你已有本地 OpenClaw 状态，请先重置配置、凭据、会话和工作区；或者在查看计划后，直接使用带 `--overwrite` 的 `openclaw migrate apply hermes`。
</Note>

## 两种导入方式

<Tabs>
  <Tab title="新手引导向导">
    检测 `~/.hermes` 中的 Hermes，并在应用前显示预览。

    ```bash
    openclaw onboard --flow import
    ```

    或者指定特定来源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    使用 `openclaw migrate` 执行脚本化或可重复运行。完整参考请参阅 [`openclaw migrate`](/zh-CN/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # 仅预览
    openclaw migrate apply hermes --yes  # 跳过确认并应用
    ```

    当 Hermes 位于 `~/.hermes` 之外时，请添加 `--from <path>`。

  </Tab>
</Tabs>

## 导入的内容

<AccordionGroup>
  <Accordion title="模型配置">
    - 从 Hermes `config.yaml` 导入默认模型选择。
    - 从 `providers` 和 `custom_providers` 导入已配置的模型提供商和自定义 OpenAI 兼容端点。

  </Accordion>
  <Accordion title="MCP 服务器">
    从 `mcp_servers` 或 `mcp.servers` 导入 MCP 服务器定义。
  </Accordion>
  <Accordion title="工作区文件">
    - 将 `SOUL.md` 和 `AGENTS.md` 复制到 OpenClaw Agent 工作区。
    - 将 `memories/MEMORY.md` 和 `memories/USER.md` **追加**到对应的 OpenClaw 记忆文件，而不是覆盖它们。

  </Accordion>
  <Accordion title="记忆配置">
    导入 OpenClaw 文件记忆的默认记忆配置。Honcho 等外部记忆提供商会记录为归档或需手动审查的项目，以便你有计划地迁移它们。
  </Accordion>
  <Accordion title="Skills">
    复制 `skills/<name>/` 下包含 `SKILL.md` 文件的 Skills，并导入 `skills.config` 中各个 Skill 的配置值。
  </Accordion>
  <Accordion title="身份验证凭据">
    交互式 `openclaw migrate` 会在导入身份验证凭据前询问，且默认选中“是”。接受后，会从 OpenCode 的 `auth.json` 导入 OpenCode OpenAI OAuth 和 GitHub Copilot 条目，以及[受支持的 Hermes `.env` 键](/zh-CN/cli/migrate#supported-env-keys)。Hermes 自身 `auth.json` 中的 OAuth 条目属于旧版状态：它们会作为需要手动重新身份验证或由 Doctor 处理的项目显示，而不会导入实时身份验证配置。非交互式运行时使用 `--include-secrets` 导入凭据，使用 `--no-auth-credentials` 完全跳过凭据导入，或使用新手引导向导的 `--import-secrets` 标志。
  </Accordion>
</AccordionGroup>

## 仅保留在归档中的内容

提供商会将以下内容复制到迁移报告目录中供手动审查，但**不会**将其加载到实时 OpenClaw 配置或凭据中：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw 拒绝自动执行或信任这些状态，因为不同系统之间的格式和信任假设可能会发生偏差。查看归档后，手动迁移你需要的内容。

## 推荐流程

<Steps>
  <Step title="预览计划">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    计划会列出将要发生的所有更改，包括冲突、跳过的项目和敏感项目。输出中嵌套的疑似密钥键会被隐去。

  </Step>
  <Step title="备份后应用">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 会在应用前创建并验证备份。此非交互式示例仅导入非敏感状态。运行时不加 `--yes` 可通过交互方式回答凭据提示，或添加 `--include-secrets` 以在无人值守运行中包含受支持的凭据。

  </Step>
  <Step title="运行 Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-CN/gateway/doctor) 会重新应用所有待处理的配置迁移，并检查导入过程中引入的问题。

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

当计划报告冲突（目标位置已存在文件或配置值）时，应用操作会拒绝继续。

<Warning>
仅当你确实想替换现有目标时，才使用 `--overwrite` 重新运行。对于被覆盖的文件，提供商仍可能在迁移报告目录中写入项目级备份。
</Warning>

全新安装中通常不会出现冲突。冲突一般发生在你对已有用户编辑的设置重新执行导入时。

如果应用过程中出现冲突（例如配置文件发生意外竞争），Hermes 会将其余依赖配置项标记为 `skipped`，原因为 `blocked by earlier apply conflict`，而不会只写入其中一部分。迁移报告会记录每个被阻止的项目，以便你解决原始冲突并重新运行导入。

## 密钥

交互式 `openclaw migrate` 会询问是否导入检测到的身份验证凭据，且默认选中“是”。

- 接受后，会从 OpenCode 的 `auth.json` 导入 OpenCode OpenAI OAuth 和 GitHub Copilot 条目，以及[受支持的 `.env` 键](/zh-CN/cli/migrate#supported-env-keys)。Hermes 自身 `auth.json` 中的 OAuth 条目则会记录下来，供手动重新进行 OpenAI 身份验证或由 Doctor 修复。
- 使用 `--no-auth-credentials`，或在提示中回答“否”，以仅导入非敏感状态。
- 使用 `--include-secrets` 在无人值守的 `--yes` 运行中导入凭据。
- 使用新手引导向导的 `--import-secrets` 标志从向导导入凭据。

## 用于自动化的 JSON 输出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

同时使用 `--json` 且不使用 `--yes` 时，应用操作会输出计划但不修改状态，这是 CI 和共享脚本最安全的模式。

## 故障排查

<AccordionGroup>
  <Accordion title="应用操作因冲突而拒绝执行">
    检查计划输出。每个冲突都会标明来源路径和现有目标。针对每个项目决定是跳过、编辑目标，还是使用 `--overwrite` 重新运行。
  </Accordion>
  <Accordion title="Hermes 位于 ~/.hermes 之外">
    传入 `--from /actual/path`（CLI）或 `--import-source /actual/path`（新手引导）。
  </Accordion>
  <Accordion title="新手引导拒绝导入现有设置">
    新手引导导入需要全新设置。你可以重置状态并重新执行新手引导，或者直接使用 `openclaw migrate apply hermes`，它支持 `--overwrite` 和显式备份控制。
  </Accordion>
  <Accordion title="API 密钥未导入">
    交互式 `openclaw migrate` 仅在你接受凭据提示后导入 API 密钥。非交互式 `--yes` 运行需要使用 `--include-secrets`；新手引导导入需要使用 `--import-secrets`。仅识别[受支持的 `.env` 键](/zh-CN/cli/migrate#supported-env-keys)，其他 `.env` 变量会被忽略。
  </Accordion>
</AccordionGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：完整的 CLI 参考、插件契约和 JSON 结构。
- [新手引导](/zh-CN/cli/onboard)：向导流程和非交互式标志。
- [迁移](/zh-CN/install/migrating)：在计算机之间迁移 OpenClaw 安装。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [Agent 工作区](/zh-CN/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 和记忆文件的存放位置。

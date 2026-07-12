---
read_when:
    - 你正在将 OpenClaw 迁移到新的笔记本电脑或服务器
    - 你正从另一个智能体系统迁移过来，并希望保留状态
    - 你正在原地升级插件
summary: 迁移中心：跨系统导入、机器间迁移和插件升级
title: 迁移指南
x-i18n:
    generated_at: "2026-07-11T20:40:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw 支持三种迁移路径：从其他智能体系统导入、将现有安装迁移到新机器，以及原地升级插件。

## 从其他智能体系统导入

内置迁移提供商可将指令、MCP 服务器、技能、模型配置和（选择启用的）API 密钥导入 OpenClaw。系统会在进行任何更改前预览计划，在报告中隐去密钥，并在应用更改前创建并验证备份。

<CardGroup cols={2}>
  <Card title="从 Claude 迁移" href="/zh-CN/install/migrating-claude" icon="brain">
    导入 Claude Code 和 Claude Desktop 状态，包括 `CLAUDE.md`、MCP 服务器、技能和项目命令。
  </Card>
  <Card title="从 Hermes 迁移" href="/zh-CN/install/migrating-hermes" icon="feather">
    导入 Hermes 配置、提供商、MCP 服务器、记忆、技能和受支持的 `.env` 键。
  </Card>
</CardGroup>

CLI 入口点是 [`openclaw migrate`](/zh-CN/cli/migrate)。新手引导检测到已知来源时，也可以提供迁移选项（`openclaw onboard --flow import`）。

## 将 OpenClaw 迁移到新机器

复制**状态目录**（默认为 `~/.openclaw/`）和你的**工作区**，以保留：

- **配置** — `openclaw.json` 和所有 Gateway 网关设置。
- **身份验证** — 每个智能体的 `auth-profiles.json`（API 密钥和 OAuth），以及 `credentials/` 下的所有渠道或提供商状态。
- **会话** — 对话历史记录和智能体状态。
- **渠道状态** — WhatsApp 登录、Telegram 会话等。
- **工作区文件** — `MEMORY.md`、`USER.md`、技能和提示词。

<Tip>
在旧机器上运行 `openclaw status`，确认状态目录路径。自定义配置文件使用 `~/.openclaw-<profile>/`，也可以通过 `OPENCLAW_STATE_DIR` 设置路径。
</Tip>

### 迁移步骤

<Steps>
  <Step title="停止 Gateway 网关并备份">
    在**旧**机器上停止 Gateway 网关，避免复制过程中发生文件更改，然后创建归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果使用多个配置文件（例如 `~/.openclaw-work`），请分别归档每个配置文件。

  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/zh-CN/install) CLI（如有需要，也安装 Node）。即使新手引导创建了新的 `~/.openclaw/` 也没有关系——下一步会将其覆盖。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外置硬盘传输归档，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确认归档包含隐藏目录，并且文件所有权与将要运行 Gateway 网关的用户一致。

  </Step>

  <Step title="运行 Doctor 并验证">
    在新机器上运行 [Doctor](/zh-CN/gateway/doctor)，以应用配置迁移并修复服务：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

如果 Telegram 或 Discord 使用默认的环境变量回退机制（`TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN`），请验证迁移后的状态目录 `.env` 是否包含这些键，同时不要打印密钥值：

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

如果已启用的默认 Telegram 或 Discord 账户未配置令牌，并且 Doctor 进程无法使用相应的环境变量，`openclaw doctor` 也会发出警告。

### 常见问题

<AccordionGroup>
  <Accordion title="配置文件或状态目录不匹配">
    如果旧 Gateway 网关使用了 `--profile` 或 `OPENCLAW_STATE_DIR`，而新 Gateway 网关没有使用，渠道将显示为已退出登录，并且会话为空。请使用迁移时的**相同**配置文件或状态目录启动 Gateway 网关，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="仅复制 openclaw.json">
    仅复制配置文件是不够的。模型身份验证配置文件位于 `agents/<agentId>/agent/auth-profiles.json`，渠道和提供商状态位于 `credentials/`。始终迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限和所有权">
    如果以 root 身份复制文件或切换了用户，Gateway 网关可能无法读取凭据。请确保状态目录和工作区归运行 Gateway 网关的用户所有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向**远程** Gateway 网关，则会话和工作区归远程主机所有。请迁移 Gateway 网关主机本身，而不是本地笔记本电脑。请参阅[常见问题](/zh-CN/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="备份中的密钥">
    状态目录包含身份验证配置文件、渠道凭据和其他提供商状态。请加密存储备份，避免使用不安全的传输渠道；如果怀疑发生泄露，请轮换密钥。
  </Accordion>
</AccordionGroup>

### 验证清单

在新机器上确认：

- [ ] `openclaw status` 显示 Gateway 网关正在运行。
- [ ] 渠道仍处于连接状态（无需重新配对）。
- [ ] 仪表板可以打开并显示现有会话。
- [ ] 工作区文件（记忆、配置）均已存在。

## 原地升级插件

原地升级插件会保留相同的插件 ID 和配置键，但可能会将磁盘上的状态迁移到当前目录结构。插件专属升级指南位于相应渠道文档中：

- [Matrix 迁移](/zh-CN/channels/matrix-migration)：加密状态恢复限制、自动快照行为和手动恢复命令。

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：跨系统导入的 CLI 参考。
- [安装概览](/zh-CN/install)：所有安装方式。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [卸载](/zh-CN/install/uninstall)：彻底移除 OpenClaw。

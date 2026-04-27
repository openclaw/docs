---
read_when:
    - 你正在将 OpenClaw 迁移到一台新的笔记本电脑或服务器
    - 你正从另一个智能体系统迁移过来，并希望保留状态
    - 你正在升级一个原地安装的插件
summary: 迁移中心：跨系统导入、机器间迁移，以及插件升级
title: 迁移指南
x-i18n:
    generated_at: "2026-04-27T10:00:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 471cab3d035aa4456386dbac4858b0ef0d47ba49b179ffe8fb1855182e77001b
    source_path: install/migrating.md
    workflow: 15
---

OpenClaw 支持三种迁移路径：从另一个智能体系统导入、将现有安装迁移到新机器，以及原地升级插件。

## 从另一个智能体系统导入

使用内置的迁移提供商，将指令、MCP 服务器、Skills、模型配置以及（可选加入的）API 密钥导入到 OpenClaw。任何更改发生前都会先预览计划，报告中的密钥会被脱敏，而应用操作则由经过验证的备份提供保障。

<CardGroup cols={2}>
  <Card title="从 Claude 迁移" href="/zh-CN/install/migrating-claude" icon="brain">
    导入 Claude Code 和 Claude Desktop 状态，包括 `CLAUDE.md`、MCP 服务器、Skills 和项目命令。
  </Card>
  <Card title="从 Hermes 迁移" href="/zh-CN/install/migrating-hermes" icon="feather">
    导入 Hermes 配置、提供商、MCP 服务器、记忆、Skills 和受支持的 `.env` 键。
  </Card>
</CardGroup>

CLI 入口点是 [`openclaw migrate`](/zh-CN/cli/migrate)。当新手引导检测到已知来源时，也可以提供迁移选项（`openclaw onboard --flow import`）。

## 将 OpenClaw 迁移到新机器

复制**状态目录**（默认是 `~/.openclaw/`）和你的**工作区**，以保留：

- **配置** — `openclaw.json` 和所有 Gateway 网关设置。
- **凭证** — 每个智能体的 `auth-profiles.json`（API 密钥加 OAuth），以及 `credentials/` 下的任何渠道或提供商状态。
- **会话** — 对话历史和智能体状态。
- **渠道状态** — WhatsApp 登录、Telegram 会话及类似内容。
- **工作区文件** — `MEMORY.md`、`USER.md`、Skills 和提示词。

<Tip>
在旧机器上运行 `openclaw status` 以确认你的状态目录路径。自定义配置文件使用 `~/.openclaw-<profile>/`，或通过 `OPENCLAW_STATE_DIR` 设置的路径。
</Tip>

### 迁移步骤

<Steps>
  <Step title="停止 Gateway 网关并备份">
    在**旧**机器上，先停止 Gateway 网关，避免文件在复制过程中发生变化，然后进行归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多个配置文件（例如 `~/.openclaw-work`），请分别归档每一个。
  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/zh-CN/install) CLI（如果需要，也安装 Node）。即使新手引导创建了一个新的 `~/.openclaw/` 也没关系。你将在下一步覆盖它。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外部驱动器传输归档文件，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确保已包含隐藏目录，并且文件所有权与将要运行 Gateway 网关的用户一致。
  </Step>

  <Step title="运行 Doctor 并验证">
    在新机器上，运行 [Doctor](/zh-CN/gateway/doctor) 以应用配置迁移并修复服务：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```
  </Step>
</Steps>

### 常见陷阱

<AccordionGroup>
  <Accordion title="配置文件或状态目录不匹配">
    如果旧 Gateway 网关使用了 `--profile` 或 `OPENCLAW_STATE_DIR`，而新 Gateway 网关没有使用，渠道看起来会像是已退出登录，会话也会是空的。请使用你所迁移的**相同**配置文件或状态目录启动 Gateway 网关，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只复制 openclaw.json">
    仅有配置文件是不够的。模型凭证配置文件位于 `agents/<agentId>/agent/auth-profiles.json`，而渠道和提供商状态位于 `credentials/` 下。请始终迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限和所有权">
    如果你是以 root 身份复制，或切换了用户，Gateway 网关可能无法读取凭证。请确保状态目录和工作区归运行 Gateway 网关的用户所有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向的是**远程** Gateway 网关，那么远程主机会拥有会话和工作区。你需要迁移 Gateway 网关主机本身，而不是你的本地笔记本电脑。参见 [常见问题](/zh-CN/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="备份中的密钥">
    状态目录包含凭证配置文件、渠道凭证和其他提供商状态。请以加密方式存储备份，避免使用不安全的传输渠道；如果你怀疑发生了泄露，请轮换密钥。
  </Accordion>
</AccordionGroup>

### 验证清单

在新机器上，确认：

- [ ] `openclaw status` 显示 Gateway 网关正在运行。
- [ ] 渠道仍然保持连接（无需重新配对）。
- [ ] 仪表板可以打开，并显示现有会话。
- [ ] 工作区文件（记忆、配置）已存在。

## 原地升级插件

原地插件升级会保留相同的插件 id 和配置键，但可能会将磁盘上的状态迁移到当前布局中。Matrix 插件是最大的示例，因为它有加密状态恢复方面的要求。

<CardGroup cols={1}>
  <Card title="Matrix 插件迁移" href="/zh-CN/install/migrating-matrix" icon="key">
    Matrix 插件的加密状态恢复限制、自动快照行为和手动恢复命令。
  </Card>
</CardGroup>

## 相关内容

- [`openclaw migrate`](/zh-CN/cli/migrate)：用于跨系统导入的 CLI 参考。
- [安装概览](/zh-CN/install)：所有安装方法。
- [Doctor](/zh-CN/gateway/doctor)：迁移后的健康检查。
- [卸载](/zh-CN/install/uninstall)：彻底移除 OpenClaw。

---
read_when:
    - 你正在将 OpenClaw 迁移到新的笔记本电脑/服务器
    - 你希望保留会话、鉴权和渠道登录状态（WhatsApp 等）
summary: 将 OpenClaw 安装从一台机器迁移到另一台机器
title: 迁移指南
x-i18n:
    generated_at: "2026-04-05T08:27:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 403f0b9677ce723c84abdbabfad20e0f70fd48392ebf23eabb7f8a111fd6a26d
    source_path: install/migrating.md
    workflow: 15
---

# 将 OpenClaw 迁移到新机器

本指南可帮助你将 OpenClaw Gateway 网关迁移到新机器，而无需重新执行新手引导。

## 将会迁移哪些内容

当你复制**状态目录**（默认是 `~/.openclaw/`）以及你的**工作区**时，你将保留：

- **配置** —— `openclaw.json` 以及所有 Gateway 网关设置
- **鉴权** —— 每个智能体的 `auth-profiles.json`（API 密钥 + OAuth），以及 `credentials/` 下的所有渠道/提供商状态
- **会话** —— 对话历史和智能体状态
- **渠道状态** —— WhatsApp 登录、Telegram 会话等
- **工作区文件** —— `MEMORY.md`、`USER.md`、Skills 和 prompts

<Tip>
在旧机器上运行 `openclaw status`，以确认你的状态目录路径。
自定义 profile 使用 `~/.openclaw-<profile>/`，或使用通过 `OPENCLAW_STATE_DIR` 设置的路径。
</Tip>

## 迁移步骤

<Steps>
  <Step title="停止 Gateway 网关并备份">
    在**旧**机器上，先停止 Gateway 网关，以免复制过程中有文件发生变化，然后进行归档：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多个 profile（例如 `~/.openclaw-work`），请分别归档。

  </Step>

  <Step title="在新机器上安装 OpenClaw">
    在新机器上[安装](/install) CLI（如有需要，也安装 Node）。
    即使新手引导创建了一个全新的 `~/.openclaw/` 也没关系——接下来你会覆盖它。
  </Step>

  <Step title="复制状态目录和工作区">
    通过 `scp`、`rsync -a` 或外部硬盘传输归档文件，然后解压：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    确保已包含隐藏目录，并且文件所有权与将要运行 Gateway 网关的用户一致。

  </Step>

  <Step title="运行 Doctor 并验证">
    在新机器上，运行 [Doctor](/gateway/doctor) 以应用配置迁移并修复服务：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

## 常见陷阱

<AccordionGroup>
  <Accordion title="Profile 或状态目录不匹配">
    如果旧 Gateway 网关使用了 `--profile` 或 `OPENCLAW_STATE_DIR`，而新机器上没有使用，
    那么渠道会显示已登出，会话也会为空。
    请使用与你迁移内容**相同**的 profile 或状态目录来启动 Gateway 网关，然后重新运行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只复制 openclaw.json">
    仅有配置文件是不够的。模型 auth profiles 位于
    `agents/<agentId>/agent/auth-profiles.json` 下，而渠道/提供商状态仍然
    位于 `credentials/` 下。请始终迁移**整个**状态目录。
  </Accordion>

  <Accordion title="权限和所有权">
    如果你以 root 身份复制，或者切换了用户，Gateway 网关可能无法读取凭证。
    请确保状态目录和工作区归运行 Gateway 网关的用户所有。
  </Accordion>

  <Accordion title="远程模式">
    如果你的 UI 指向的是**远程** Gateway 网关，那么远程主机才持有会话和工作区。
    应迁移 Gateway 网关宿主机本身，而不是你的本地笔记本电脑。参见 [常见问题](/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="备份中的密钥">
    状态目录包含 auth profiles、渠道凭证以及其他
    提供商状态。
    请以加密方式存储备份，避免使用不安全的传输通道；如果你怀疑有泄露，请轮换密钥。
  </Accordion>
</AccordionGroup>

## 验证检查清单

在新机器上，确认：

- [ ] `openclaw status` 显示 Gateway 网关正在运行
- [ ] 渠道仍然保持连接（无需重新配对）
- [ ] dashboard 可以打开，并显示现有会话
- [ ] 工作区文件（记忆、配置）都存在

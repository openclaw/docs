---
read_when:
    - 你需要解释智能体工作区或其文件布局
    - 你想要备份或迁移 Agent 工作区
sidebarTitle: Agent workspace
summary: Agent 工作区：位置、布局和备份策略
title: Agent 工作区
x-i18n:
    generated_at: "2026-06-27T01:46:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作区是智能体的主目录。它是文件工具和工作区上下文使用的唯一工作目录。请保持其私密，并将其视为记忆。

这与 `~/.openclaw/` 分开，后者存储配置、凭据和会话。

<Warning>
工作区是**默认 cwd**，不是硬性沙箱。工具会基于工作区解析相对路径，但除非启用沙箱隔离，否则绝对路径仍然可以访问主机上的其他位置。如果你需要隔离，请使用 [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing)（和/或按智能体配置沙箱）。

启用沙箱隔离且 `workspaceAccess` 不是 `"rw"` 时，工具会在 `~/.openclaw/sandboxes` 下的沙箱工作区内运行，而不是在你的主机工作区中运行。
</Warning>

## 默认位置

- 默认：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且它不是 `"default"`，默认值会变为 `~/.openclaw/workspace-<profile>`。
- 在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

如果缺少工作区和引导文件，`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会创建工作区并写入初始引导文件。

<Note>
沙箱种子复制只接受工作区内的普通文件；解析到源工作区外部的符号链接/硬链接别名会被忽略。
</Note>

如果你已经自己管理工作区文件，可以禁用引导文件创建：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 额外工作区文件夹

较旧的安装可能创建过 `~/openclaw`。保留多个工作区目录可能导致令人困惑的认证或状态漂移，因为一次只有一个工作区处于活动状态。

<Note>
**建议：**只保留一个活动工作区。如果你不再使用这些额外文件夹，请归档它们或移到废纸篓（例如 `trash ~/openclaw`）。如果你有意保留多个工作区，请确保 `agents.defaults.workspace` 指向活动的那个。

`openclaw doctor` 在检测到额外工作区目录时会发出警告。
</Note>

## 工作区文件映射

这些是 OpenClaw 期望在工作区内看到的标准文件：

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作指令">
    智能体的操作指令，以及它应如何使用记忆。每个会话开始时加载。适合放置规则、优先级和“如何表现”等细节。
  </Accordion>
  <Accordion title="SOUL.md - 人设和语气">
    人设、语气和边界。每个会话都会加载。指南：[SOUL.md 个性指南](/zh-CN/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - 用户是谁">
    用户是谁以及如何称呼他们。每个会话都会加载。
  </Accordion>
  <Accordion title="IDENTITY.md - 名称、气质、表情符号">
    智能体的名称、气质和表情符号。在引导仪式期间创建/更新。
  </Accordion>
  <Accordion title="TOOLS.md - 本地工具约定">
    关于你的本地工具和约定的说明。不控制工具可用性；它只是指导。
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat 清单">
    Heartbeat 运行的可选小清单。保持简短以避免消耗 token。
  </Accordion>
  <Accordion title="BOOT.md - 启动清单">
    在 Gateway 网关重启时自动运行的可选启动清单（启用[内部钩子](/zh-CN/automation/hooks)时）。保持简短；使用消息工具进行对外发送。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 首次运行仪式">
    一次性的首次运行仪式。仅为全新的工作区创建。仪式完成后删除它。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 每日记忆日志">
    每日记忆日志（每天一个文件）。建议在会话开始时读取今天 + 昨天。
  </Accordion>
  <Accordion title="MEMORY.md - 精选长期记忆（可选）">
    精选长期记忆：持久事实、偏好、决策和简短摘要。将详细日志保存在 `memory/YYYY-MM-DD.md` 中，这样记忆工具可以按需检索它们，而不必把它们注入到每个提示中。只在主私密会话中加载 `MEMORY.md`（不要在共享/群组上下文中加载）。请参阅[记忆](/zh-CN/concepts/memory)，了解工作流和自动记忆刷新。
  </Accordion>
  <Accordion title="skills/ - 工作区 Skills（可选）">
    工作区专属 Skills。该工作区中优先级最高的 Skills 位置。当名称冲突时，会覆盖项目智能体 Skills、个人智能体 Skills、托管 Skills、内置 Skills 和 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 文件（可选）">
    用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果缺少任何引导文件，OpenClaw 会向会话注入“缺少文件”标记并继续。大型引导文件在注入时会被截断；可通过 `agents.defaults.bootstrapMaxChars`（默认：20000）和 `agents.defaults.bootstrapTotalMaxChars`（默认：60000）调整限制。`openclaw setup` 可以重新创建缺失的默认文件，而不会覆盖现有文件。
</Note>

## 工作区中不包含什么

这些内容位于 `~/.openclaw/` 下，不应提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型认证配置文件：OAuth + API key）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（每智能体的 Codex runtime 账户、配置、Skills、插件和原生线程状态）
- `~/.openclaw/credentials/`（渠道/提供商状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（会话转录 + 元数据）
- `~/.openclaw/skills/`（托管 Skills）

如果需要迁移会话或配置，请单独复制它们，并将它们排除在版本控制之外。

## Git 备份（推荐，私有）

将工作区视为私密记忆。把它放进一个**私有** git 仓库，这样它就可以备份并恢复。

在运行 Gateway 网关的机器上执行这些步骤（工作区就在那台机器上）。

<Steps>
  <Step title="初始化仓库">
    如果已安装 git，全新的工作区会自动初始化。如果此工作区还不是仓库，请运行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="添加私有远程仓库">
    <Tabs>
      <Tab title="GitHub Web UI">
        1. 在 GitHub 上创建一个新的**私有**仓库。
        2. 不要使用 README 初始化（避免合并冲突）。
        3. 复制 HTTPS 远程 URL。
        4. 添加远程仓库并推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="GitLab Web UI">
        1. 在 GitLab 上创建一个新的**私有**仓库。
        2. 不要使用 README 初始化（避免合并冲突）。
        3. 复制 HTTPS 远程 URL。
        4. 添加远程仓库并推送：

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="持续更新">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## 不要提交密钥

<Warning>
即使在私有仓库中，也应避免在工作区中存储密钥：

- API key、OAuth token、密码或私有凭据。
- `~/.openclaw/` 下的任何内容。
- 聊天的原始导出或敏感附件。

如果必须存储敏感引用，请使用占位符，并将真实密钥保存在其他位置（密码管理器、环境变量或 `~/.openclaw/`）。
</Warning>

建议的 `.gitignore` 起始内容：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将工作区移动到新机器

<Steps>
  <Step title="克隆仓库">
    将仓库克隆到目标路径（默认 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新配置">
    在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
  </Step>
  <Step title="写入缺失文件">
    运行 `openclaw setup --workspace <path>` 来写入任何缺失文件。
  </Step>
  <Step title="复制会话（可选）">
    如果你需要会话，请从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 高级说明

- 多智能体路由可以为每个智能体使用不同的工作区。请参阅[频道路由](/zh-CN/channels/channel-routing)了解路由配置。
- 如果启用了 `agents.defaults.sandbox`，非主会话可以使用 `agents.defaults.sandbox.workspaceRoot` 下的按会话沙箱工作区。

## 相关

- [Heartbeat](/zh-CN/gateway/heartbeat) - HEARTBEAT.md 工作区文件
- [沙箱隔离](/zh-CN/gateway/sandboxing) - 沙箱隔离环境中的工作区访问
- [会话](/zh-CN/concepts/session) - 会话存储路径
- [常驻指令](/zh-CN/automation/standing-orders) - 工作区文件中的持久指令

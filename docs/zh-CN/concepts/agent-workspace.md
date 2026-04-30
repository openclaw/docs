---
read_when:
    - 你需要解释 Agent 工作区或其文件布局
    - 你想备份或迁移智能体工作区
sidebarTitle: Agent workspace
summary: Agent 工作区：位置、布局和备份策略
title: Agent 工作区
x-i18n:
    generated_at: "2026-04-30T19:53:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ccf74cbec3ff20f4c1c1ce52f099a7ca3365b2536b0aad6ff1d3a5fafcca0a
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作区是智能体的家。它是文件工具和工作区上下文使用的唯一工作目录。请保持私密，并把它当作记忆来对待。

这与 `~/.openclaw/` 分开，后者存储配置、凭证和会话。

<Warning>
工作区是**默认 cwd**，不是硬性沙箱。工具会基于工作区解析相对路径，但除非启用了沙箱隔离，否则绝对路径仍然可以访问主机上的其他位置。如果你需要隔离，请使用 [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing)（和/或每个智能体的沙箱配置）。

启用沙箱隔离且 `workspaceAccess` 不是 `"rw"` 时，工具会在 `~/.openclaw/sandboxes` 下的沙箱工作区内运行，而不是在你的主机工作区中运行。
</Warning>

## 默认位置

- 默认值：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且不是 `"default"`，默认值会变为 `~/.openclaw/workspace-<profile>`。
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

如果缺少工作区和引导文件，`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会创建工作区并植入这些引导文件。

<Note>
沙箱种子副本只接受工作区内的常规文件；解析到源工作区之外的符号链接/硬链接别名会被忽略。
</Note>

如果你已经自行管理工作区文件，可以禁用引导文件创建：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 额外工作区文件夹

较旧的安装可能创建过 `~/openclaw`。保留多个工作区目录可能导致令人困惑的认证或状态漂移，因为同一时间只有一个工作区处于活动状态。

<Note>
**建议：**保留单个活动工作区。如果你不再使用额外文件夹，请将其归档或移动到废纸篓（例如 `trash ~/openclaw`）。如果你有意保留多个工作区，请确保 `agents.defaults.workspace` 指向活动的那个。

`openclaw doctor` 在检测到额外工作区目录时会发出警告。
</Note>

## 工作区文件映射

这些是 OpenClaw 期望在工作区内存在的标准文件：

<AccordionGroup>
  <Accordion title="AGENTS.md — operating instructions">
    智能体的操作说明，以及它应如何使用记忆。每个会话开始时加载。适合放置规则、优先级和“如何表现”的细节。
  </Accordion>
  <Accordion title="SOUL.md — persona and tone">
    人设、语气和边界。每个会话都会加载。指南：[SOUL.md 人格指南](/zh-CN/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md — who the user is">
    用户是谁，以及如何称呼他们。每个会话都会加载。
  </Accordion>
  <Accordion title="IDENTITY.md — name, vibe, emoji">
    智能体的名称、气质和 emoji。在引导仪式期间创建/更新。
  </Accordion>
  <Accordion title="TOOLS.md — local tool conventions">
    关于你的本地工具和约定的说明。不控制工具可用性；它只是指导。
  </Accordion>
  <Accordion title="HEARTBEAT.md — heartbeat checklist">
    Heartbeat 运行使用的可选小型检查清单。保持简短以避免消耗 token。
  </Accordion>
  <Accordion title="BOOT.md — startup checklist">
    Gateway 网关重启时自动运行的可选启动检查清单（当启用[内部钩子](/zh-CN/automation/hooks)时）。保持简短；使用消息工具发送外发消息。
  </Accordion>
  <Accordion title="BOOTSTRAP.md — first-run ritual">
    一次性的首次运行仪式。仅为全新工作区创建。仪式完成后删除它。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — daily memory log">
    每日记忆日志（每天一个文件）。建议在会话开始时读取今天 + 昨天。
  </Accordion>
  <Accordion title="MEMORY.md — curated long-term memory (optional)">
    精心整理的长期记忆。只在主私密会话中加载（不要在共享/群组上下文中加载）。查看[记忆](/zh-CN/concepts/memory)了解工作流和自动记忆刷写。
  </Accordion>
  <Accordion title="skills/ — workspace skills (optional)">
    工作区专用 Skills。该工作区中优先级最高的 Skills 位置。当名称冲突时，会覆盖项目智能体 Skills、个人智能体 Skills、托管 Skills、内置 Skills 和 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ — Canvas UI files (optional)">
    节点显示使用的 Canvas UI 文件（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果缺少任何引导文件，OpenClaw 会向会话中注入“缺失文件”标记并继续。大型引导文件在注入时会被截断；可通过 `agents.defaults.bootstrapMaxChars`（默认值：12000）和 `agents.defaults.bootstrapTotalMaxChars`（默认值：60000）调整限制。`openclaw setup` 可以重新创建缺失的默认文件，而不会覆盖现有文件。
</Note>

## 工作区中不包含什么

这些内容位于 `~/.openclaw/` 下，不应提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型认证配置文件：OAuth + API keys）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（每个智能体的 Codex 运行时账户、配置、Skills、插件和原生线程状态）
- `~/.openclaw/credentials/`（渠道/提供商状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（会话转录 + 元数据）
- `~/.openclaw/skills/`（托管 Skills）

如果你需要迁移会话或配置，请单独复制它们，并让它们保持在版本控制之外。

## Git 备份（推荐，私密）

将工作区视为私密记忆。把它放入**私有** git 仓库，以便备份和恢复。

在运行 Gateway 网关的机器上执行这些步骤（工作区就位于那里）。

<Steps>
  <Step title="Initialize the repo">
    如果已安装 git，全新工作区会自动初始化。如果此工作区还不是仓库，请运行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Add a private remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. 在 GitHub 上创建一个新的**私有**仓库。
        2. 不要用 README 初始化（避免合并冲突）。
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
      <Tab title="GitLab web UI">
        1. 在 GitLab 上创建一个新的**私有**仓库。
        2. 不要用 README 初始化（避免合并冲突）。
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
  <Step title="Ongoing updates">
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
即使在私有仓库中，也要避免在工作区存储密钥：

- API keys、OAuth token、密码或私有凭证。
- `~/.openclaw/` 下的任何内容。
- 聊天或敏感附件的原始转储。

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
  <Step title="Clone the repo">
    将仓库克隆到目标路径（默认 `~/.openclaw/workspace`）。
  </Step>
  <Step title="Update config">
    在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
  </Step>
  <Step title="Seed missing files">
    运行 `openclaw setup --workspace <path>` 来植入任何缺失文件。
  </Step>
  <Step title="Copy sessions (optional)">
    如果需要会话，请从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 高级说明

- 多智能体路由可以为每个智能体使用不同工作区。路由配置请参见[渠道路由](/zh-CN/channels/channel-routing)。
- 如果启用了 `agents.defaults.sandbox`，非主会话可以使用 `agents.defaults.sandbox.workspaceRoot` 下的每会话沙箱工作区。

## 相关内容

- [Heartbeat](/zh-CN/gateway/heartbeat) — HEARTBEAT.md 工作区文件
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的工作区访问
- [会话](/zh-CN/concepts/session) — 会话存储路径
- [常设指令](/zh-CN/automation/standing-orders) — 工作区文件中的持久指令

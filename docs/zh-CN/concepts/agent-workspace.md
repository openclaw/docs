---
read_when:
    - 你需要说明 Agent 工作区或其文件布局
    - 你想要备份或迁移 Agent 工作区
sidebarTitle: Agent workspace
summary: Agent 工作区：位置、布局和备份策略
title: Agent 工作区
x-i18n:
    generated_at: "2026-07-12T14:24:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e09c26d19dd7926b379ae4d094c98c2a2f5b37b9453a4cc2048c3b212ae5a9c2
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作区是智能体的主目录：文件工具和工作区上下文所使用的工作目录。请将其保持私密，并将其视为记忆。

它与 `~/.openclaw/` 分开，后者存储配置、凭据和会话。

<Warning>
工作区是**默认 cwd**，并非强制沙箱。工具会基于工作区解析相对路径，但除非启用沙箱隔离，否则绝对路径仍可访问主机上的其他位置。如果你需要隔离，请使用 [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing)（和/或按智能体配置沙箱）。

启用沙箱隔离且 `workspaceAccess` 不是 `"rw"` 时，工具会在 `~/.openclaw/sandboxes` 下的沙箱工作区内运行，而不是在主机工作区内运行。
</Warning>

## 默认位置

- 默认值：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且其值不是 `"default"`，默认位置将变为 `~/.openclaw/workspace-<profile>`。
- 设置 `OPENCLAW_WORKSPACE_DIR` 后，它会覆盖上述两项。
- 未显式指定工作区的非默认智能体（`agents.list[]`）会解析到 `<state-dir>/workspace-<agentId>`，而不是共享的默认工作区。

在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

按智能体覆盖：`agents.list[].workspace`。

如果工作区不存在，`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会创建工作区并植入引导文件。

<Note>
沙箱植入副本仅接受工作区内的常规文件；如果符号链接/硬链接别名解析到源工作区之外，则会被忽略。
</Note>

如果你已经自行管理工作区文件，请禁用引导文件创建：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 额外工作区文件夹

旧版安装可能创建了 `~/openclaw`。保留多个工作区目录可能造成令人困惑的身份验证或状态偏移，因为任何时候都只有一个工作区处于活动状态。

<Note>
**建议：**仅保留一个活动工作区。如果你不再使用额外文件夹，请将其归档或移至废纸篓（例如 `trash ~/openclaw`）。如果你有意保留多个工作区，请确保 `agents.defaults.workspace`（或按智能体设置的 `workspace` 键）指向活动工作区。
</Note>

## 工作区文件映射

OpenClaw 期望工作区内包含的标准文件：

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作说明">
    智能体的操作说明，以及它应如何使用记忆。每次会话开始时加载。适合存放规则、优先级和“行为方式”等详细信息。
  </Accordion>
  <Accordion title="SOUL.md - 角色设定和语气">
    角色设定、语气和边界。每次会话都会加载。指南：[SOUL.md 个性指南](/zh-CN/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - 用户身份">
    用户是谁，以及应如何称呼他们。每次会话都会加载。
  </Accordion>
  <Accordion title="IDENTITY.md - 名称、风格、表情符号">
    智能体的名称、风格和表情符号。在引导仪式期间创建/更新。
  </Accordion>
  <Accordion title="TOOLS.md - 本地工具约定">
    关于本地工具和约定的说明。它不控制工具可用性，仅提供指导。
  </Accordion>
  <Accordion title="HEARTBEAT.md - Heartbeat 检查清单">
    用于 Heartbeat 运行的可选精简检查清单。请保持简短，以免消耗过多 token。
  </Accordion>
  <Accordion title="BOOT.md - 启动检查清单">
    Gateway 网关重启时自动运行的可选启动检查清单（启用[内部钩子](/zh-CN/automation/hooks)时）。请保持简短；出站发送请使用消息工具。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 首次运行仪式">
    一次性的首次运行仪式。仅为全新工作区创建。仪式完成后将其删除。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 每日记忆日志">
    每日记忆日志（每天一个文件）。建议在会话开始时读取今天和昨天的日志。
  </Accordion>
  <Accordion title="MEMORY.md - 整理后的长期记忆（可选）">
    整理后的长期记忆：持久事实、偏好、决策和简短摘要。将详细日志保存在 `memory/YYYY-MM-DD.md` 中，以便记忆工具按需检索，而无需将其注入每个提示词。仅在主要的私密会话中加载 `MEMORY.md`（不要在共享/群组上下文中加载）。有关工作流和自动记忆刷新，请参阅[记忆](/zh-CN/concepts/memory)。
  </Accordion>
  <Accordion title="skills/ - 工作区 Skills（可选）">
    工作区专用 Skills。当名称冲突时，这是该工作区中优先级最高的 Skills 位置，高于项目智能体 Skills、个人智能体 Skills、托管 Skills、内置 Skills 和 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 文件（可选）">
    用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果缺少引导文件，OpenClaw 会在会话中注入“缺少文件”标记并继续运行。大型引导文件在注入时会被截断；可通过 `agents.defaults.bootstrapMaxChars`（默认值：`20000`）和 `agents.defaults.bootstrapTotalMaxChars`（默认值：`60000`）调整限制。`openclaw setup` 可以重新创建缺失的默认文件，而不会覆盖现有文件。
</Note>

## 工作区中不包含的内容

以下内容位于 `~/.openclaw/` 下，不应提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型身份验证配置文件：OAuth + API 密钥）
- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`（会话行、转录记录和按智能体存储的运行时状态）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（按智能体存储的 Codex 运行时账户、配置、Skills、插件和原生线程状态）
- `~/.openclaw/credentials/`（渠道/提供商状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（旧版迁移源和归档/支持工件）
- `~/.openclaw/skills/`（托管 Skills）

如果你需要迁移会话或配置，请单独复制它们，并确保它们不进入版本控制。

## Git 备份（建议使用私有仓库）

将工作区视为私密记忆。把它放入**私有** Git 仓库，以便备份和恢复。

在运行 Gateway 网关的计算机上执行以下步骤（工作区就在该计算机上）。

<Steps>
  <Step title="初始化仓库">
    如果已安装 Git，全新工作区会自动初始化。如果此工作区尚不是仓库，请运行：

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
        1. 在 GitHub 上创建新的**私有**仓库。
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
        1. 在 GitLab 上创建新的**私有**仓库。
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

## 不要提交机密信息

<Warning>
即使是在私有仓库中，也应避免在工作区存储机密信息：

- API 密钥、OAuth token、密码或私密凭据。
- `~/.openclaw/` 下的任何内容。
- 聊天原始转储或敏感附件。

如果必须存储敏感引用，请使用占位符，并将真正的机密信息保存在其他位置（密码管理器、环境变量或 `~/.openclaw/`）。
</Warning>

建议的 `.gitignore` 初始内容：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将工作区迁移到新计算机

<Steps>
  <Step title="克隆仓库">
    将仓库克隆到所需路径（默认为 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新配置">
    在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
  </Step>
  <Step title="植入缺失文件">
    运行 `openclaw setup --workspace <path>` 以植入所有缺失文件。
  </Step>
  <Step title="复制会话（可选）">
    如果你需要会话，请从旧计算机单独复制 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。仅当你还需要旧版迁移输入或归档/支持工件时，才复制 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 高级说明

- 多智能体路由可以通过 `agents.list[].workspace` 为每个智能体使用不同的工作区。有关路由配置，请参阅[渠道路由](/zh-CN/channels/channel-routing)。
- 如果启用了 `agents.defaults.sandbox`，非主要会话可以使用 `agents.defaults.sandbox.workspaceRoot` 下按会话划分的沙箱工作区。

## 相关内容

- [Heartbeat](/zh-CN/gateway/heartbeat) - HEARTBEAT.md 工作区文件
- [沙箱隔离](/zh-CN/gateway/sandboxing) - 沙箱隔离环境中的工作区访问
- [会话](/zh-CN/concepts/session) - 会话存储路径
- [常驻指令](/zh-CN/automation/standing-orders) - 工作区文件中的持久指令

---
read_when:
    - 你需要解释 Agent 工作区或其文件布局
    - 你想备份或迁移 Agent 工作区
sidebarTitle: Agent workspace
summary: Agent 工作区：位置、布局和备份策略
title: Agent 工作区
x-i18n:
    generated_at: "2026-07-05T11:12:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a66c441267e306176e4e52c639892dae4a4363729ac647fedf7f946d189ce1b3
    source_path: concepts/agent-workspace.md
    workflow: 16
---

工作区是智能体的家：文件工具和工作区上下文使用的工作目录。
请保持其私密，并将其视为记忆。

这与 `~/.openclaw/` 分开，后者存储配置、凭据和会话。

<Warning>
工作区是**默认 cwd**，不是强沙箱。工具会相对于工作区解析相对路径，但除非启用沙箱隔离，否则绝对路径仍然可以访问主机上的其他位置。如果你需要隔离，请使用 [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing)（和/或按 Agent 配置的沙箱配置）。

启用沙箱隔离且 `workspaceAccess` 不是 `"rw"` 时，工具会在 `~/.openclaw/sandboxes` 下的沙箱工作区内运行，而不是在你的主机工作区内运行。
</Warning>

## 默认位置

- 默认：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且它不是 `"default"`，默认值会变为 `~/.openclaw/workspace-<profile>`。
- 设置 `OPENCLAW_WORKSPACE_DIR` 后，它会覆盖上述两者。
- 没有显式工作区的非默认智能体（`agents.list[]`）会解析到 `<state-dir>/workspace-<agentId>`，而不是共享的默认工作区。

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

按 Agent 覆盖：`agents.list[].workspace`。

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会创建工作区，并在引导文件缺失时播种这些文件。

<Note>
沙箱种子复制只接受工作区内的常规文件；解析到源工作区之外的符号链接/硬链接别名会被忽略。
</Note>

如果你已经自己管理工作区文件，请禁用引导文件创建：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 额外工作区文件夹

较早的安装可能创建了 `~/openclaw`。保留多个工作区目录可能造成令人困惑的认证或状态漂移，因为同一时间只有一个工作区处于活动状态。

<Note>
**建议：**保留单个活动工作区。如果你不再使用额外文件夹，请将其归档或移到废纸篓（例如 `trash ~/openclaw`）。如果你有意保留多个工作区，请确保 `agents.defaults.workspace`（或按 Agent 配置的 `workspace` 键）指向活动的那个。
</Note>

## 工作区文件映射

OpenClaw 期望在工作区内存在的标准文件：

<AccordionGroup>
  <Accordion title="AGENTS.md - 操作说明">
    智能体的操作说明，以及它应如何使用记忆。每个会话开始时加载。适合放置规则、优先级和“如何表现”的细节。
  </Accordion>
  <Accordion title="SOUL.md - 人设和语气">
    人设、语气和边界。每个会话都会加载。指南：[SOUL.md 人格指南](/zh-CN/concepts/soul)。
  </Accordion>
  <Accordion title="USER.md - 用户是谁">
    用户是谁，以及如何称呼他们。每个会话都会加载。
  </Accordion>
  <Accordion title="IDENTITY.md - 名称、气质、emoji">
    智能体的名称、气质和 emoji。在引导仪式期间创建/更新。
  </Accordion>
  <Accordion title="TOOLS.md - 本地工具约定">
    关于你的本地工具和约定的说明。它不控制工具可用性；仅作为指导。
  </Accordion>
  <Accordion title="HEARTBEAT.md - heartbeat 检查清单">
    用于 heartbeat 运行的可选小型检查清单。保持简短，避免消耗 token。
  </Accordion>
  <Accordion title="BOOT.md - 启动检查清单">
    可选启动检查清单，会在 Gateway 网关重启时自动运行（启用 [内部钩子](/zh-CN/automation/hooks) 时）。保持简短；使用消息工具进行出站发送。
  </Accordion>
  <Accordion title="BOOTSTRAP.md - 首次运行仪式">
    一次性的首次运行仪式。仅为全新的工作区创建。仪式完成后将其删除。
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - 每日记忆日志">
    每日记忆日志（每天一个文件）。建议在会话开始时读取今天和昨天的日志。
  </Accordion>
  <Accordion title="MEMORY.md - 经整理的长期记忆（可选）">
    经整理的长期记忆：持久事实、偏好、决策和简短摘要。将详细日志保存在 `memory/YYYY-MM-DD.md` 中，以便记忆工具可按需检索，而无需把它们注入每个提示。只在主私密会话中加载 `MEMORY.md`（不要在共享/群组上下文中加载）。请参阅 [Memory](/zh-CN/concepts/memory) 了解工作流和自动记忆刷新。
  </Accordion>
  <Accordion title="skills/ - 工作区 Skills（可选）">
    工作区专用 Skills。对于该工作区，这是优先级最高的 Skills 位置；当名称冲突时，它优先于项目 Agent Skills、个人 Agent Skills、托管 Skills、内置 Skills 和 `skills.load.extraDirs`。
  </Accordion>
  <Accordion title="canvas/ - Canvas UI 文件（可选）">
    用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。
  </Accordion>
</AccordionGroup>

<Note>
如果某个引导文件缺失，OpenClaw 会向会话中注入“缺失文件”标记并继续。大型引导文件在注入时会被截断；可通过 `agents.defaults.bootstrapMaxChars`（默认：`20000`）和 `agents.defaults.bootstrapTotalMaxChars`（默认：`60000`）调整限制。`openclaw setup` 可以重新创建缺失的默认文件，而不会覆盖现有文件。
</Note>

## 工作区中不包含什么

以下内容位于 `~/.openclaw/` 下，不应提交到工作区 repo：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型认证配置文件：OAuth + API keys）
- `~/.openclaw/agents/<agentId>/agent/codex-home/`（按 Agent 配置的 Codex 运行时账号、配置、Skills、插件和原生线程状态）
- `~/.openclaw/credentials/`（渠道/提供商状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（会话转录 + 元数据）
- `~/.openclaw/skills/`（托管 Skills）

如果你需要迁移会话或配置，请单独复制它们，并将它们排除在版本控制之外。

## Git 备份（推荐，私有）

将工作区视为私密记忆。把它放入一个**私有** git repo，以便备份和恢复。

在 Gateway 网关运行的机器上执行这些步骤（工作区也位于该机器上）。

<Steps>
  <Step title="初始化 repo">
    如果安装了 git，全新的工作区会自动初始化。如果此工作区还不是 repo，请运行：

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="添加私有 remote">
    <Tabs>
      <Tab title="GitHub web UI">
        1. 在 GitHub 上创建一个新的**私有**仓库。
        2. 不要用 README 初始化（避免合并冲突）。
        3. 复制 HTTPS remote URL。
        4. 添加 remote 并推送：

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
        3. 复制 HTTPS remote URL。
        4. 添加 remote 并推送：

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

## 不要提交秘密

<Warning>
即使在私有 repo 中，也应避免在工作区存储秘密：

- API keys、OAuth tokens、密码或私有凭据。
- `~/.openclaw/` 下的任何内容。
- 聊天或敏感附件的原始转储。

如果你必须存储敏感引用，请使用占位符，并将真正的秘密保存在其他位置（密码管理器、环境变量或 `~/.openclaw/`）。
</Warning>

建议的 `.gitignore` 起点：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将工作区移动到新机器

<Steps>
  <Step title="克隆 repo">
    将 repo 克隆到所需路径（默认 `~/.openclaw/workspace`）。
  </Step>
  <Step title="更新配置">
    在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
  </Step>
  <Step title="播种缺失文件">
    运行 `openclaw setup --workspace <path>` 来播种任何缺失文件。
  </Step>
  <Step title="复制会话（可选）">
    如果你需要会话，请从旧机器单独复制 `~/.openclaw/agents/<agentId>/sessions/`。
  </Step>
</Steps>

## 高级说明

- 多 Agent 路由可以通过 `agents.list[].workspace` 为每个智能体使用不同工作区。路由配置请参阅 [渠道路由](/zh-CN/channels/channel-routing)。
- 如果启用了 `agents.defaults.sandbox`，非主会话可以使用 `agents.defaults.sandbox.workspaceRoot` 下的按会话沙箱工作区。

## 相关

- [Heartbeat](/zh-CN/gateway/heartbeat) - HEARTBEAT.md 工作区文件
- [沙箱隔离](/zh-CN/gateway/sandboxing) - 沙箱隔离环境中的工作区访问
- [会话](/zh-CN/concepts/session) - 会话存储路径
- [常驻指令](/zh-CN/automation/standing-orders) - 工作区文件中的持久指令

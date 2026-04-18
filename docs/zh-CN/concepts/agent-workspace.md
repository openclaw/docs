---
read_when:
    - 你需要解释智能体工作区或其文件布局
    - 你想要备份或迁移智能体工作区
summary: 智能体工作区：位置、布局和备份策略
title: 智能体工作区
x-i18n:
    generated_at: "2026-04-18T03:32:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd2e74614d8d45df04b1bbda48e2224e778b621803d774d38e4b544195eb234e
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# 智能体工作区

工作区是智能体的“家”。它是文件工具和工作区上下文唯一使用的工作目录。请将其保持私密，并把它视为记忆。

这与 `~/.openclaw/` 分开，后者用于存储配置、凭证和会话。

**重要：** 工作区是**默认 cwd**，而不是硬性沙箱。工具会基于工作区解析相对路径，但绝对路径仍然可以访问主机上的其他位置，除非启用了沙箱隔离。如果你需要隔离，请使用 [`agents.defaults.sandbox`](/zh-CN/gateway/sandboxing)（和/或按智能体设置的沙箱配置）。启用沙箱隔离后，如果 `workspaceAccess` 不是 `"rw"`，工具会在 `~/.openclaw/sandboxes` 下的沙箱工作区内运行，而不是在你的主机工作区内运行。

## 默认位置

- 默认值：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且其值不是 `"default"`，默认值会变为
  `~/.openclaw/workspace-<profile>`。
- 可在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会在工作区不存在时创建它，并填充引导文件。
沙箱种子复制仅接受工作区内的常规文件；解析后指向源工作区外部的符号链接 / 硬链接别名会被忽略。

如果你已经自行管理工作区文件，可以禁用引导文件创建：

```json5
{ agent: { skipBootstrap: true } }
```

## 额外的工作区文件夹

较早版本的安装可能创建了 `~/openclaw`。保留多个工作区目录可能会导致令人困惑的凭证或状态漂移，因为同一时间只有一个工作区处于活动状态。

**建议：** 只保留一个活动工作区。如果你不再使用额外的文件夹，请将其归档或移到废纸篓（例如 `trash ~/openclaw`）。
如果你有意保留多个工作区，请确保
`agents.defaults.workspace` 指向当前活动的那个。

当 `openclaw doctor` 检测到额外的工作区目录时，会发出警告。

## 工作区文件映射（每个文件的含义）

以下是 OpenClaw 在工作区内预期的标准文件：

- `AGENTS.md`
  - 智能体的操作说明，以及它应如何使用记忆。
  - 每次会话开始时都会加载。
  - 适合放置规则、优先级和“应如何表现”的细节。

- `SOUL.md`
  - 人设、语气和边界。
  - 每次会话都会加载。
  - 指南：[SOUL.md Personality Guide](/zh-CN/concepts/soul)

- `USER.md`
  - 关于用户是谁，以及应如何称呼用户。
  - 每次会话都会加载。

- `IDENTITY.md`
  - 智能体的名称、氛围和 emoji。
  - 在引导仪式期间创建 / 更新。

- `TOOLS.md`
  - 关于你的本地工具和约定的说明。
  - 它不会控制工具可用性；仅作为指导。

- `HEARTBEAT.md`
  - 可选的超短清单，用于心跳运行。
  - 保持简短，以避免消耗过多 token。

- `BOOT.md`
  - 可选的启动清单；当启用内部 hooks 时，会在 Gateway 网关重启时执行。
  - 保持简短；对外发送请使用 message 工具。

- `BOOTSTRAP.md`
  - 一次性的首次运行仪式。
  - 仅为全新的工作区创建。
  - 仪式完成后将其删除。

- `memory/YYYY-MM-DD.md`
  - 每日记忆日志（每天一个文件）。
  - 建议在会话开始时读取今天和昨天的文件。

- `MEMORY.md`（可选）
  - 整理后的长期记忆。
  - 仅在主私有会话中加载（不在共享 / 群组上下文中加载）。

有关工作流和自动记忆刷新，请参见 [Memory](/zh-CN/concepts/memory)。

- `skills/`（可选）
  - 工作区专属的 Skills。
  - 该工作区中优先级最高的 Skills 位置。
  - 当名称冲突时，会覆盖项目智能体 Skills、个人智能体 Skills、托管 Skills、内置 Skills，以及 `skills.load.extraDirs`。

- `canvas/`（可选）
  - 用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。

如果任何引导文件缺失，OpenClaw 会在会话中注入“缺失文件”标记并继续运行。注入时，大型引导文件会被截断；可通过 `agents.defaults.bootstrapMaxChars`（默认：12000）和 `agents.defaults.bootstrapTotalMaxChars`（默认：60000）调整限制。
`openclaw setup` 可以重新创建缺失的默认文件，而不会覆盖现有文件。

## 哪些内容**不**在工作区中

以下内容位于 `~/.openclaw/` 下，**不应**提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型凭证配置文件：OAuth + API 密钥）
- `~/.openclaw/credentials/`（渠道 / 提供商状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（会话转录内容 + 元数据）
- `~/.openclaw/skills/`（托管 Skills）

如果你需要迁移会话或配置，请单独复制它们，并确保不要将它们纳入版本控制。

## Git 备份（推荐，私有）

请将工作区视为私密记忆。把它放入一个**私有** git 仓库中，以便备份和恢复。

请在运行 Gateway 网关 的机器上执行这些步骤（工作区就位于那里）。

### 1）初始化仓库

如果已安装 git，全新工作区会自动初始化。如果这个工作区还不是仓库，请运行：

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2）添加私有远程仓库（适合初学者的选项）

选项 A：GitHub 网页 UI

1. 在 GitHub 上创建一个新的**私有**仓库。
2. 不要使用 README 初始化（可避免合并冲突）。
3. 复制 HTTPS 远程仓库 URL。
4. 添加远程仓库并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

选项 B：GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

选项 C：GitLab 网页 UI

1. 在 GitLab 上创建一个新的**私有**仓库。
2. 不要使用 README 初始化（可避免合并冲突）。
3. 复制 HTTPS 远程仓库 URL。
4. 添加远程仓库并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3）持续更新

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## 不要提交机密信息

即使是在私有仓库中，也要避免在工作区中存储机密：

- API 密钥、OAuth 令牌、密码或私密凭证。
- `~/.openclaw/` 下的任何内容。
- 聊天记录原始导出或敏感附件。

如果你必须存储敏感引用，请使用占位符，并将真实机密保存在其他位置（密码管理器、环境变量或 `~/.openclaw/`）。

建议的 `.gitignore` 起始内容：

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 将工作区迁移到新机器

1. 将仓库克隆到目标路径（默认 `~/.openclaw/workspace`）。
2. 在 `~/.openclaw/openclaw.json` 中将 `agents.defaults.workspace` 设置为该路径。
3. 运行 `openclaw setup --workspace <path>` 以填充任何缺失的文件。
4. 如果你需要会话，请单独从旧机器复制 `~/.openclaw/agents/<agentId>/sessions/`。

## 高级说明

- 多智能体路由可以为不同智能体使用不同的工作区。请参见
  [Channel routing](/zh-CN/channels/channel-routing) 了解路由配置。
- 如果启用了 `agents.defaults.sandbox`，非主会话可以在 `agents.defaults.sandbox.workspaceRoot` 下使用按会话划分的沙箱工作区。

## 相关内容

- [Standing Orders](/zh-CN/automation/standing-orders) — 工作区文件中的持久化指令
- [Heartbeat](/zh-CN/gateway/heartbeat) — `HEARTBEAT.md` 工作区文件
- [Session](/zh-CN/concepts/session) — 会话存储路径
- [Sandboxing](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的工作区访问

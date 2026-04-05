---
read_when:
    - 你需要解释智能体工作区或其文件布局
    - 你想备份或迁移智能体工作区
summary: 智能体工作区：位置、布局和备份策略
title: 智能体工作区
x-i18n:
    generated_at: "2026-04-05T08:20:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3735633f1098c733415369f9836fdbbc0bf869636a24ed42e95e6784610d964a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# 智能体工作区

工作区是智能体的“家”。它是
文件工具和工作区上下文使用的唯一工作目录。请保持其私密，并将其视为记忆。

这与 `~/.openclaw/` 分开，后者存储配置、凭证和
会话。

**重要：** 工作区是**默认 cwd**，而不是硬性沙箱。工具
会基于工作区解析相对路径，但绝对路径仍然可以访问主机上的其他位置，除非启用了沙箱隔离。如果你需要隔离，请使用
[`agents.defaults.sandbox`](/gateway/sandboxing)（和/或按智能体的沙箱配置）。
当启用沙箱隔离且 `workspaceAccess` 不为 `"rw"` 时，工具会在
`~/.openclaw/sandboxes` 下的沙箱工作区内运行，而不是在你的主机工作区中运行。

## 默认位置

- 默认值：`~/.openclaw/workspace`
- 如果设置了 `OPENCLAW_PROFILE` 且不为 `"default"`，默认值会变为
  `~/.openclaw/workspace-<profile>`。
- 可在 `~/.openclaw/openclaw.json` 中覆盖：

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`、`openclaw configure` 或 `openclaw setup` 会在
工作区不存在时创建该工作区并填充 bootstrap 文件。
沙箱种子复制仅接受工作区内的常规文件；解析到源工作区外部的符号链接/硬链接别名会被忽略。

如果你已经自行管理工作区文件，可以禁用 bootstrap
文件创建：

```json5
{ agent: { skipBootstrap: true } }
```

## 额外的工作区文件夹

较旧的安装可能创建过 `~/openclaw`。保留多个工作区
目录可能导致令人困惑的鉴权或状态漂移，因为同一时间只有一个
工作区处于活动状态。

**建议：** 仅保留一个活动工作区。如果你不再使用这些
额外文件夹，请归档或移到废纸篓（例如 `trash ~/openclaw`）。
如果你有意保留多个工作区，请确保
`agents.defaults.workspace` 指向当前活动的那个。

当检测到额外工作区目录时，`openclaw doctor` 会发出警告。

## 工作区文件映射（每个文件的含义）

这些是 OpenClaw 在工作区中预期的标准文件：

- `AGENTS.md`
  - 智能体的操作说明，以及它应如何使用记忆。
  - 在每次会话开始时加载。
  - 很适合放置规则、优先级以及“如何表现”的细节。

- `SOUL.md`
  - 人设、语气和边界。
  - 每个会话都会加载。
  - 指南：[SOUL.md Personality Guide](/concepts/soul)

- `USER.md`
  - 用户是谁，以及如何称呼用户。
  - 每个会话都会加载。

- `IDENTITY.md`
  - 智能体的名称、风格和 emoji。
  - 在 bootstrap 仪式期间创建/更新。

- `TOOLS.md`
  - 关于你的本地工具和约定的说明。
  - 它不控制工具可用性；仅作为指导。

- `HEARTBEAT.md`
  - 可选的小型检查清单，用于 heartbeat 运行。
  - 保持简短，以避免 token 消耗。

- `BOOT.md`
  - 可选的启动检查清单；当启用内部 hooks 时，会在 Gateway 网关重启时执行。
  - 保持简短；使用消息工具进行出站发送。

- `BOOTSTRAP.md`
  - 一次性的首次运行仪式。
  - 仅为全新工作区创建。
  - 仪式完成后请删除它。

- `memory/YYYY-MM-DD.md`
  - 每日记忆日志（每天一个文件）。
  - 建议在会话开始时阅读今天和昨天的内容。

- `MEMORY.md`（可选）
  - 整理后的长期记忆。
  - 仅在主私有会话中加载（不在共享/群组上下文中加载）。

有关工作流和自动记忆刷新，请参见[记忆](/concepts/memory)。

- `skills/`（可选）
  - 工作区专用的 Skills。
  - 该工作区中优先级最高的 Skills 位置。
  - 当名称冲突时，会覆盖项目智能体 Skills、个人智能体 Skills、托管 Skills、内置 Skills 以及 `skills.load.extraDirs`。

- `canvas/`（可选）
  - 用于节点显示的 Canvas UI 文件（例如 `canvas/index.html`）。

如果任何 bootstrap 文件缺失，OpenClaw 会向
会话中注入一个“缺失文件”标记并继续。大型 bootstrap 文件在注入时会被截断；
可通过 `agents.defaults.bootstrapMaxChars`（默认：20000）和
`agents.defaults.bootstrapTotalMaxChars`（默认：150000）调整限制。
`openclaw setup` 可以重新创建缺失的默认文件，而不会覆盖现有
文件。

## 哪些内容**不**在工作区中

这些内容位于 `~/.openclaw/` 下，**不应**提交到工作区仓库：

- `~/.openclaw/openclaw.json`（配置）
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（模型鉴权配置：OAuth + API 密钥）
- `~/.openclaw/credentials/`（渠道/提供商状态以及旧版 OAuth 导入数据）
- `~/.openclaw/agents/<agentId>/sessions/`（会话转录 + 元数据）
- `~/.openclaw/skills/`（托管 Skills）

如果你需要迁移会话或配置，请单独复制它们，并确保将其
排除在版本控制之外。

## Git 备份（推荐，私有）

请将工作区视为私有记忆。把它放到一个**私有** git 仓库中，以便
进行备份和恢复。

请在运行 Gateway 网关的机器上执行以下步骤（工作区就在
那里）。

### 1）初始化仓库

如果已安装 git，全新的工作区会自动初始化。如果该
工作区尚不是仓库，请运行：

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2）添加私有远程仓库（适合初学者的选项）

选项 A：GitHub Web UI

1. 在 GitHub 上创建一个新的**私有**仓库。
2. 不要使用 README 初始化（可避免合并冲突）。
3. 复制 HTTPS 远程 URL。
4. 添加远程仓库并推送：

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

选项 B：GitHub CLI（`gh`）

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

选项 C：GitLab Web UI

1. 在 GitLab 上创建一个新的**私有**仓库。
2. 不要使用 README 初始化（可避免合并冲突）。
3. 复制 HTTPS 远程 URL。
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

## 不要提交密钥

即使在私有仓库中，也应避免在工作区存储密钥：

- API 密钥、OAuth 令牌、密码或私有凭证。
- `~/.openclaw/` 下的任何内容。
- 聊天记录原始转储或敏感附件。

如果你必须存储敏感引用，请使用占位符，并将真实
密钥保存在其他地方（密码管理器、环境变量或 `~/.openclaw/`）。

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
3. 运行 `openclaw setup --workspace <path>` 以填充缺失文件。
4. 如果你还需要会话，请将 `~/.openclaw/agents/<agentId>/sessions/` 从
   旧机器单独复制过来。

## 高级说明

- 多智能体路由可以为不同智能体使用不同工作区。参见
  [渠道路由](/channels/channel-routing) 了解路由配置。
- 如果启用了 `agents.defaults.sandbox`，非主会话可以在 `agents.defaults.sandbox.workspaceRoot` 下
  使用按会话划分的沙箱工作区。

## 相关内容

- [Standing Orders](/automation/standing-orders) — 工作区文件中的持久指令
- [Heartbeat](/gateway/heartbeat) — HEARTBEAT.md 工作区文件
- [会话](/concepts/session) — 会话存储路径
- [沙箱隔离](/gateway/sandboxing) — 沙箱环境中的工作区访问

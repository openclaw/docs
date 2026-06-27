---
read_when:
    - 你想查看哪些 Skills 可用并已准备好运行
    - 你想搜索 ClawHub，或从 ClawHub、Git 或本地目录安装 Skills
    - 你想使用 ClawHub 验证一个 ClawHub 技能
    - 你想调试 Skills 缺失的二进制文件/环境变量/配置
summary: '`openclaw skills` 的 CLI 参考（search/install/update/verify/list/info/check/workshop）'
title: Skills
x-i18n:
    generated_at: "2026-06-27T01:43:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

检查本地 Skills、搜索 ClawHub、从 ClawHub/Git/本地目录安装 Skills、验证 ClawHub Skills，并更新由 ClawHub 跟踪的安装。

相关：

- Skills 系统：[Skills](/zh-CN/tools/skills)
- Skill Workshop：[Skill Workshop](/zh-CN/tools/skill-workshop)
- Skills 配置：[Skills 配置](/zh-CN/tools/skills-config)
- ClawHub 安装：[ClawHub](/zh-CN/clawhub/cli)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`、`update` 和 `verify` 直接使用 ClawHub。`install @owner/<slug>` 安装 ClawHub Skill，`install git:owner/repo[@ref]` 克隆 Git Skill，`install ./path` 复制本地 Skill 目录。默认情况下，`install`、`update` 和 `verify` 以活动工作区的 `skills/` 目录为目标；使用 `--global` 时，它们以共享的托管 Skills 目录为目标。`list`/`info`/`check` 仍会检查当前工作区和配置可见的本地 Skills。由工作区支持的命令会先从 `--agent <id>` 解析目标工作区，然后在当前工作目录位于已配置 Agent 工作区内时使用当前工作目录，最后使用默认 Agent。

Git 和本地目录安装要求源根目录包含 `SKILL.md`。安装 slug 会先在有效时来自 `SKILL.md` frontmatter 中的 `name`，然后来自源目录或仓库名称；使用 `--as <slug>` 可覆盖它。`--version` 仅适用于 ClawHub。Skill 安装不支持 npm 包规格或 zip/archive 路径，并且 `openclaw skills update` 只更新由 ClawHub 跟踪的安装。

从新手引导或 Skills 设置触发的、由 Gateway 网关支持的 Skill 依赖安装，会改用单独的 `skills.install` 请求路径。

注意：

- `search [query...]` 接受可选查询；省略它可浏览默认的 ClawHub 搜索 feed。
- `search --limit <n>` 限制返回的结果数。
- `install git:owner/repo[@ref]` 安装 Git Skill。分支 ref 可以包含斜杠，例如 `git:owner/repo@feature/foo`。
- `install ./path/to/skill` 安装根目录包含 `SKILL.md` 的本地目录。
- `install --as <slug>` 覆盖为 Git 和本地目录安装推断出的 slug。
- `install --version <version>` 仅适用于 ClawHub Skill ref。
- `install --force` 覆盖同一 slug 的现有工作区 Skill 文件夹。
- 社区 ClawHub Skill 安装和更新会在下载前检查信任状态。带版本的社区归档发布使用精确发布的信任元数据。由解析器支持的 GitHub Skills 依赖 ClawHub 的安装解析器，在返回固定 commit 前强制执行扫描和强制安装策略。恶意或被阻止的社区发布会被拒绝。有风险的社区发布需要审核，并且在非交互式命令应在该审核后继续时需要 `--acknowledge-clawhub-risk`。官方 ClawHub Skill 发布者和内置 OpenClaw Skill 源会绕过此发布信任提示。
- `--global` 以共享的托管 Skills 目录为目标，且不能与 `--agent <id>` 组合使用。
- `--agent <id>` 以一个已配置的 Agent 工作区为目标，并覆盖当前工作目录推断。
- `update @owner/<slug>` 更新单个已跟踪 Skill。添加 `--global` 可改为以共享的托管 Skills 目录为目标，而不是工作区。
- `update --all` 更新选定工作区中由 ClawHub 跟踪的安装；与 `--global` 组合时，更新共享托管 Skills 目录中的安装。
- `verify @owner/<slug>` 默认打印 ClawHub 的 `clawhub.skill.verify.v1` JSON envelope。没有 `--json` 标志，因为 JSON 已经是默认值。裸 slug 仍会为了兼容性而被接受，前提是该 Skill 已安装或没有歧义，但带 owner 限定的 ref 可避免发布者歧义。
- 当 ClawHub 返回服务器解析的源来源时，verify JSON 还包含固定到 commit 的 `openclaw.verifiedSourceUrl`。不可用或自声明的源 URL 只保留在原始来源 envelope 中，不会被提升。
- `verify` 对已安装的 ClawHub Skills 使用 `.clawhub/origin.json`，因此它会根据其来源 registry 验证已安装版本。`--version` 和 `--tag` 会覆盖版本选择器，但当存在 origin 元数据时会保留该已安装 registry。
- `verify --card` 打印生成的 Skill Card Markdown，而不是 JSON。当 ClawHub 返回 `ok: false` 或 `decision: "fail"` 时，命令以非零状态退出；除非 ClawHub 策略变化，未签名签名仅作为信息。
- 已安装的 ClawHub bundle 可以包含生成的 `skill-card.md`。OpenClaw 将验证视为 ClawHub 服务器决策，并且不会仅因为该生成卡片改变 bundle 指纹就拒绝已安装 Skill。
- `check --agent <id>` 检查所选 Agent 的工作区，并报告哪些就绪 Skills 实际对该 Agent 的 prompt 或命令界面可见。
- 未提供子命令时，`list` 是默认操作。
- `list`、`info` 和 `check` 会将其渲染后的输出写入 stdout。使用 `--json` 时，这意味着机器可读 payload 会保留在 stdout，以便用于管道和脚本。

## Skill Workshop

`openclaw skills workshop` 管理选定工作区中的待处理 Skill 提案。提案在应用前不是活动 Skills。有关提案存储、支持文件保护、Gateway 网关方法和审批策略，请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)。

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## 相关

- [CLI 参考](/zh-CN/cli)
- [Skills](/zh-CN/tools/skills)

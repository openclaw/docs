---
read_when:
    - 你想查看哪些 Skills 可用并已准备好运行
    - 你想搜索 ClawHub，或从 ClawHub、Git 或本地目录安装 Skills
    - 你想使用 ClawHub 验证一个 ClawHub Skills
    - 你想调试 Skills 缺少二进制文件、环境变量或配置的问题
summary: '`openclaw skills` 的 CLI 参考（搜索/安装/更新/验证/列出/信息/检查/工作坊）'
title: Skills
x-i18n:
    generated_at: "2026-07-11T20:27:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

检查本地 Skills、搜索 ClawHub、从 ClawHub、Git 或本地目录安装 Skills、验证 ClawHub Skills，以及更新由 ClawHub 跟踪的安装项。

相关内容：

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
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
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

`search`、`update` 和 `verify` 直接使用 ClawHub。`install @owner/<slug>` 安装 ClawHub Skill，`install git:owner/repo[@ref]` 克隆 Git Skill，`install ./path` 复制本地 Skill 目录。默认情况下，`install`、`update` 和 `verify` 以活动工作区的 `skills/` 目录为目标；使用 `--global` 时，则以共享的托管 Skills 目录为目标。`list`/`info`/`check` 仍会检查当前工作区和配置可见的本地 Skills。工作区支持的命令按以下顺序解析目标工作区：先使用 `--agent <id>`，然后在当前工作目录位于已配置的智能体工作区内时使用该工作区，最后使用默认智能体。

Git 和本地目录安装要求源根目录中存在 `SKILL.md`。安装标识符优先取自 `SKILL.md` frontmatter 中有效的 `name`，其次取自源目录名或仓库名；可使用 `--as <slug>` 覆盖它。`--version` 仅适用于 ClawHub。Skill 安装不支持 npm 软件包规格或 zip/归档路径，并且 `openclaw skills update` 仅更新由 ClawHub 跟踪的安装项。

由新手引导或 Skills 设置触发、经 Gateway 网关执行的 Skill 依赖安装会改用单独的 `skills.install` 请求路径。

注意事项：

| 标志/行为                       | 说明                                                                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `search [query...]`             | 查询可选；省略时浏览默认的 ClawHub 搜索信息流。                                                                                                                                                                                                               |
| `search --limit <n>`            | 限制返回的结果数量。                                                                                                                                                                                                                                         |
| `install git:owner/repo[@ref]`  | 安装 Git Skill。分支引用可以包含斜杠，例如 `git:owner/repo@feature/foo`。                                                                                                                                                                                       |
| `install ./path/to/skill`       | 安装根目录中包含 `SKILL.md` 的本地目录。                                                                                                                                                                                                                      |
| `install --as <slug>`           | 覆盖为 Git 和本地目录安装推断出的标识符。                                                                                                                                                                                                                     |
| `install --version <version>`   | 仅适用于 ClawHub Skill 引用。                                                                                                                                                                                                                                 |
| `install --force`               | 覆盖具有相同标识符的现有工作区 Skill 文件夹。                                                                                                                                                                                                                 |
| `install/update --force-install` | 在 ClawHub 扫描完成前安装待处理的、由 GitHub 支持的 ClawHub Skill。                                                                                                                                                                                           |
| `--global`                      | 以共享的托管 Skills 目录为目标；不能与 `--agent <id>` 组合使用。                                                                                                                                                                                             |
| `--agent <id>`                  | 以一个已配置的智能体工作区为目标；覆盖根据当前工作目录进行的推断。                                                                                                                                                                                           |
| `update @owner/<slug>`          | 更新单个已跟踪的 Skill。添加 `--global` 后，以共享的托管 Skills 目录而非工作区为目标。                                                                                                                                                                        |
| `update --all`                  | 更新所选工作区中由 ClawHub 跟踪的安装项；使用 `--global` 时，则更新共享的托管 Skills 目录中的安装项。                                                                                                                                                          |
| `verify @owner/<slug>`          | 默认输出 ClawHub 的 `clawhub.skill.verify.v1` JSON 信封。没有 `--json` 标志，因为 JSON 已是默认格式。当 Skill 已安装或不存在歧义时，为兼容性也接受不带所有者的标识符；带所有者的引用可避免发布者歧义。                                                           |
| `verify` 来源                   | 当 ClawHub 返回由服务器解析的来源信息时，验证 JSON 还会包含固定到提交的 `openclaw.verifiedSourceUrl`。不可用或自行声明的源 URL 仅保留在原始来源信封中，不会被提升。                                                                                              |
| `verify` 版本选择器             | 对于已安装的 ClawHub Skills，`verify` 使用 `.clawhub/origin.json`，因此会对照其来源注册表验证已安装版本。`--version` 和 `--tag` 会覆盖版本选择器，但在存在来源元数据时仍使用该安装项的注册表。                                                                    |
| `verify --card`                 | 输出生成的 Skill Card Markdown，而不是 JSON。当 ClawHub 返回 `ok: false` 或 `decision: "fail"` 时，以非零状态退出；除非 ClawHub 策略发生变化，否则未签名的签名状态仅供参考。                                                                                     |
| Skill Card 指纹                 | 已安装的 ClawHub 软件包可包含生成的 `skill-card.md`。OpenClaw 将验证视为 ClawHub 服务器的决定，不会仅因为该生成卡片改变了软件包指纹就拒绝已安装的 Skill。                                                                                                      |
| `check --agent <id>`            | 检查所选智能体的工作区，并报告哪些已就绪的 Skills 实际对该智能体的提示词或命令界面可见。                                                                                                                                                                     |
| `list`                          | 未提供子命令时的默认操作。                                                                                                                                                                                                                                   |
| `list`/`info`/`check` 输出      | 渲染后的输出写入 stdout。使用 `--json` 时，机器可读的载荷仍保留在 stdout，以供管道和脚本使用。                                                                                                                                                                |

安装和更新社区 ClawHub Skills 时，会在下载前检查信任状态。带版本的社区归档发布使用对应确切版本的信任元数据。由解析器支持的 GitHub Skills 依赖 ClawHub 的安装解析器，在返回固定提交前执行扫描和强制安装策略；若要在扫描完成前安装待处理的、由 GitHub 支持的 Skill，请使用 `--force-install`。恶意或被阻止的社区发布会被拒绝。存在风险的社区发布需要先经过审查；当非交互式命令需要在审查后继续时，还必须使用 `--acknowledge-clawhub-risk`。ClawHub 官方 Skill 发布者和 OpenClaw 内置 Skill 源会绕过此发布信任提示。

## Skill Workshop

`openclaw skills workshop` 管理所选工作区中待处理的 Skill 提案。提案在应用前不是活动 Skills。有关提案存储、支持文件保护措施、Gateway 网关方法和审批策略，请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)。

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

`propose-create`、`propose-update` 和 `revise` 也接受 `--goal <text>`
和 `--evidence <text>`，用于在 `--proposal`/`--proposal-dir` 内容之外记录提案的动机和支持性
说明。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Skills](/zh-CN/tools/skills)

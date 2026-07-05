---
read_when:
    - 你想查看哪些 Skills 可用并已准备好运行
    - 你想要搜索 ClawHub，或从 ClawHub、Git、本地目录安装 Skills
    - 你想使用 ClawHub 验证一个 ClawHub 技能
    - 你想调试 Skills 缺失的二进制文件、环境变量或配置
summary: '`openclaw skills` 的 CLI 参考（search/install/update/verify/list/info/check/workshop）'
title: Skills
x-i18n:
    generated_at: "2026-07-05T11:11:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

检查本地技能、搜索 ClawHub、从 ClawHub/Git/本地目录安装技能、验证 ClawHub 技能，并更新由 ClawHub 跟踪的安装。

相关：

- Skills 系统：[Skills](/zh-CN/tools/skills)
- 技能工作坊：[技能工作坊](/zh-CN/tools/skill-workshop)
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

`search`、`update` 和 `verify` 直接使用 ClawHub。`install @owner/<slug>`
会安装 ClawHub 技能，`install git:owner/repo[@ref]` 会克隆 Git 技能，
`install ./path` 会复制本地技能目录。默认情况下，`install`、`update`
和 `verify` 以活跃工作区的 `skills/` 目录为目标；使用 `--global` 时，
它们以共享的托管技能目录为目标。`list`/`info`/`check` 仍会检查当前工作区和配置可见的本地技能。
由工作区支撑的命令会先从 `--agent <id>` 解析目标工作区，
然后在当前工作目录位于已配置的智能体工作区内时使用当前工作目录，
最后使用默认智能体。

Git 和本地目录安装要求源根目录中存在 `SKILL.md`。安装 slug 会在有效时来自 `SKILL.md` frontmatter 的 `name`，
然后才使用源目录或仓库名称；使用 `--as <slug>` 可以覆盖它。
`--version` 仅适用于 ClawHub。技能安装不支持 npm 包规格或 zip/归档路径，
并且 `openclaw skills update` 只会更新由 ClawHub 跟踪的安装。

从新手引导或 Skills 设置触发的、由 Gateway 网关支撑的技能依赖安装，会改用单独的 `skills.install` 请求路径。

注意事项：

| 标志/行为                    | 描述                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | 可选查询；省略它即可浏览默认的 ClawHub 搜索信息流。                                                                                                                                                                                                                |
| `search --limit <n>`             | 限制返回的结果数量。                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | 安装 Git 技能。分支 ref 可以包含斜杠，例如 `git:owner/repo@feature/foo`。                                                                                                                                                                                      |
| `install ./path/to/skill`        | 安装根目录包含 `SKILL.md` 的本地目录。                                                                                                                                                                                                                        |
| `install --as <slug>`            | 覆盖 Git 和本地目录安装推断出的 slug。                                                                                                                                                                                                                 |
| `install --version <version>`    | 仅适用于 ClawHub 技能 ref。                                                                                                                                                                                                                                               |
| `install --force`                | 覆盖同一 slug 的现有工作区技能文件夹。                                                                                                                                                                                                                  |
| `install/update --force-install` | 在 ClawHub 扫描完成前安装待处理的、由 GitHub 支撑的 ClawHub 技能。                                                                                                                                                                                                   |
| `--global`                       | 以共享的托管技能目录为目标；不能与 `--agent <id>` 组合使用。                                                                                                                                                                                                  |
| `--agent <id>`                   | 以一个已配置的智能体工作区为目标；覆盖当前工作目录推断。                                                                                                                                                                                            |
| `update @owner/<slug>`           | 更新单个已跟踪的技能。添加 `--global` 可将目标从工作区改为共享的托管技能目录。                                                                                                                                                            |
| `update --all`                   | 更新所选工作区中的已跟踪 ClawHub 安装，或在使用 `--global` 时更新共享的托管技能目录。                                                                                                                                                               |
| `verify @owner/<slug>`           | 默认打印 ClawHub 的 `clawhub.skill.verify.v1` JSON 信封。没有 `--json` 标志，因为 JSON 已经是默认输出。为兼容性接受裸 slug，但仅限技能已经安装或没有歧义的情况；带 owner 的 ref 可避免发布者歧义。 |
| `verify` 来源证明              | 当 ClawHub 返回服务器解析的来源证明时，verify JSON 还会包含固定到提交的 `openclaw.verifiedSourceUrl`。不可用或自声明的源 URL 只会留在原始来源证明信封中，不会被提升。                                           |
| `verify` 版本选择器        | 对已安装的 ClawHub 技能，`verify` 使用 `.clawhub/origin.json`，因此会依据其来源注册表验证已安装版本。`--version` 和 `--tag` 会覆盖版本选择器，但在存在 origin 元数据时仍保留该已安装注册表。                    |
| `verify --card`                  | 打印生成的技能卡 Markdown，而不是 JSON。当 ClawHub 返回 `ok: false` 或 `decision: "fail"` 时以非零退出；除非 ClawHub 策略变更，未签名签名仅作为信息。                                                                             |
| 技能卡指纹           | 已安装的 ClawHub bundle 可以包含生成的 `skill-card.md`。OpenClaw 将验证视为 ClawHub 服务器决策，不会仅因为该生成卡片改变 bundle 指纹就拒绝已安装技能。                                              |
| `check --agent <id>`             | 检查所选智能体的工作区，并报告哪些已就绪技能实际对该智能体的 prompt 或命令界面可见。                                                                                                                                              |
| `list`                           | 未提供子命令时的默认操作。                                                                                                                                                                                                                                    |
| `list`/`info`/`check` 输出     | 渲染后的输出会写入 stdout。使用 `--json` 时，机器可读 payload 会保留在 stdout，便于管道和脚本使用。                                                                                                                                                                |

社区 ClawHub 技能的安装和更新会在下载前检查信任状态。
带版本的社区归档发布使用精确发布信任元数据。
由解析器支撑的 GitHub 技能依赖 ClawHub 的安装解析器，在返回固定提交前强制执行扫描和强制安装策略；使用
`--force-install` 可在该扫描完成前安装待处理的、由 GitHub 支撑的技能。
恶意或被阻止的社区发布会被拒绝。有风险的社区发布需要审查，
并且在非交互式命令应在审查后继续时需要 `--acknowledge-clawhub-risk`。
官方 ClawHub 技能发布者和内置 OpenClaw 技能源会跳过此发布信任提示。

## 技能工作坊

`openclaw skills workshop` 管理所选工作区中的待处理技能提案。
提案在应用前不是活跃技能。有关提案存储、支持文件保护措施、
Gateway 网关方法和审批策略，请参阅
[技能工作坊](/zh-CN/tools/skill-workshop)。

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

`propose-create`、`propose-update` 和 `revise` 还接受 `--goal <text>`
和 `--evidence <text>`，用于在 `--proposal`/`--proposal-dir` 内容旁记录提案的动机和支持说明。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Skills](/zh-CN/tools/skills)

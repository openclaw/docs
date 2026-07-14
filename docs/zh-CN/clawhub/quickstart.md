---
read_when:
    - 首次使用 ClawHub
    - 从注册表安装技能或插件
    - 发布到 ClawHub
summary: 开始使用 ClawHub：查找、安装、更新和发布技能或插件。
x-i18n:
    generated_at: "2026-07-14T13:32:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# 快速开始

ClawHub 是 OpenClaw 技能和插件的注册中心。

将内容安装到 OpenClaw 时，请使用 OpenClaw。当你需要登录、发布、管理自己的条目或使用注册中心特定工作流时，请使用 `clawhub` CLI。

## 查找并安装技能

从 OpenClaw 中搜索：

```bash
openclaw skills search "calendar"
```

安装技能：

```bash
openclaw skills install @openclaw/demo
```

更新已安装的技能：

```bash
openclaw skills update --all
```

OpenClaw 会记录技能的来源，以便后续更新能够继续通过 ClawHub 解析。

## 查找并安装插件

从 OpenClaw 中搜索：

```bash
openclaw plugins search "calendar"
```

使用明确指定的 ClawHub 源安装 ClawHub 托管的插件：

```bash
openclaw plugins install clawhub:<package>
```

更新已安装的插件：

```bash
openclaw plugins update --all
```

如果希望 OpenClaw 通过 ClawHub（而非 npm 或其他来源）解析软件包，请使用 `clawhub:` 前缀。

## 登录以进行发布

安装 ClawHub CLI：

```bash
npm i -g clawhub
# 或
pnpm add -g clawhub
```

使用 GitHub 登录：

```bash
clawhub login
clawhub whoami
```

无头环境可以使用 ClawHub Web UI 中的 API 令牌：

```bash
clawhub login --token clh_...
```

## 发布技能

技能是一个包含必需的 `SKILL.md` 文件及可选支持文件的文件夹。

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

该命令会跳过未更改的内容。新技能的初始版本为 `1.0.0`；后续更改会自动发布下一个补丁版本。使用 `--dry-run` 进行预览，或使用 `--version` 指定明确的版本。

发布前，请检查 `SKILL.md` 中的元数据。声明所需的环境变量、工具和权限，以便用户在安装技能前了解其要求。请参阅[技能格式](/zh-CN/clawhub/skill-format)。

对于包含多个技能的仓库，可复用的 GitHub 工作流会为 `skills/` 下的每个直接技能文件夹调用 `skill publish`：

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## 发布插件

从本地文件夹、GitHub 仓库、GitHub 引用或现有归档文件发布插件：

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

先使用 `--dry-run`，无需发布即可预览解析后的软件包元数据、兼容性字段、来源归属和上传计划。

代码插件必须在 `package.json` 中包含 OpenClaw 兼容性元数据，其中包括 `openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。

## 安装前检查

安装前，请使用 ClawHub 网页或 CLI 详情命令检查元数据、源代码链接、版本、变更日志和扫描状态：

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

公开条目会显示最新的扫描状态。因审核而被暂缓或阻止的版本可能会从搜索和安装界面中隐藏，直至问题解决。

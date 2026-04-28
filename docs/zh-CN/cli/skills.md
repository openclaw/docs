---
read_when:
    - 你想查看哪些 Skills 可用并且已准备好运行
    - 你想从 ClawHub 搜索、安装或更新 Skills
    - 你想调试 Skills 缺失的二进制文件、环境变量或配置
summary: '`openclaw skills` 的 CLI 参考（search/install/update/list/info/check）'
title: Skills
x-i18n:
    generated_at: "2026-04-28T00:10:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

查看本地 Skills，并从 ClawHub 安装/更新 Skills。

相关内容：

- Skills 系统：[Skills](/zh-CN/tools/skills)
- Skills 配置：[Skills 配置](/zh-CN/tools/skills-config)
- ClawHub 安装：[ClawHub](/zh-CN/tools/clawhub)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` 直接使用 ClawHub，并安装到当前工作区的 `skills/` 目录中。`list`/`info`/`check` 仍会检查当前工作区和配置可见的本地 Skills。基于工作区的命令会按以下顺序解析目标工作区：先看 `--agent <id>`，然后看当前工作目录是否位于已配置的 Agent 工作区内，最后回退到默认智能体。

这个 CLI `install` 命令会从 ClawHub 下载 skill 文件夹。由新手引导或 Skills 设置触发、基于 Gateway 网关的 skill 依赖安装，则会改用独立的 `skills.install` 请求路径。

说明：

- `search [query...]` 接受可选查询；省略时会浏览默认的 ClawHub 搜索流。
- `search --limit <n>` 用于限制返回结果数量。
- `install --force` 会覆盖工作区中相同 slug 的现有 skill 文件夹。
- `--agent <id>` 会指定一个已配置的智能体工作区，并覆盖当前工作目录推断。
- `update --all` 只会更新当前工作区中已跟踪的 ClawHub 安装项。
- 未提供子命令时，`list` 是默认操作。
- `list`、`info` 和 `check` 会将渲染后的输出写入 stdout。使用 `--json` 时，这意味着机器可读的负载会保留在 stdout 中，便于管道和脚本使用。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Skills](/zh-CN/tools/skills)

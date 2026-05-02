---
read_when:
    - 你想查看哪些 Skills 可用并已准备好运行
    - 你想从 ClawHub 搜索、安装或更新 Skills
    - 你想要调试 Skills 缺失的二进制文件/环境变量/配置
summary: 用于 `openclaw skills` 的 CLI 参考（search/install/update/list/info/check）
title: Skills
x-i18n:
    generated_at: "2026-05-02T18:56:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
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
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` 直接使用 ClawHub，并安装到当前工作区的 `skills/` 目录。`list`/`info`/`check` 仍会检查当前工作区和配置可见的本地 Skills。基于工作区的命令会先从 `--agent <id>` 解析目标工作区，然后在当前工作目录位于已配置的 agent 工作区内时使用当前工作目录，最后使用默认 agent。

此 CLI `install` 命令会从 ClawHub 下载 Skills 文件夹。从新手引导或 Skills 设置触发的、由 Gateway 网关支持的 Skills 依赖安装，则使用单独的 `skills.install` 请求路径。

注意：

- `search [query...]` 接受可选查询；省略它可浏览默认的 ClawHub 搜索信息流。
- `search --limit <n>` 会限制返回结果数量。
- `install --force` 会覆盖同一 slug 的现有工作区 Skills 文件夹。
- `--agent <id>` 会定向到一个已配置的 agent 工作区，并覆盖当前工作目录推断。
- `update --all` 只会更新当前工作区中已跟踪的 ClawHub 安装。
- `check --agent <id>` 会检查所选 agent 的工作区，并报告哪些已就绪的 Skills 实际对该 agent 的提示词或命令界面可见。
- 未提供子命令时，`list` 是默认操作。
- `list`、`info` 和 `check` 会将渲染后的输出写入 stdout。使用 `--json` 时，这意味着机器可读的载荷会保留在 stdout，供管道和脚本使用。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Skills](/zh-CN/tools/skills)

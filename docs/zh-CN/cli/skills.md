---
read_when:
    - 你想查看哪些 Skills 可用并已准备好运行
    - 你想从 ClawHub 搜索、安装或更新 Skills
    - 你想调试 Skills 缺失的二进制文件/环境变量/配置
summary: '`openclaw skills` 的 CLI 参考（search/install/update/list/info/check）'
title: skills
x-i18n:
    generated_at: "2026-04-05T08:20:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11af59b1b6bff19cc043acd8d67bdd4303201d3f75f23c948b83bf14882c7bb1
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

检查本地 Skills，并从 ClawHub 安装/更新 Skills。

相关内容：

- Skills 系统：[Skills](/tools/skills)
- Skills 配置：[Skills 配置](/tools/skills-config)
- ClawHub 安装：[ClawHub](/tools/clawhub)

## 命令

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

`search`/`install`/`update` 直接使用 ClawHub，并安装到当前活动
工作区的 `skills/` 目录中。`list`/`info`/`check` 仍然检查当前工作区和配置可见的本地
Skills。

这个 CLI `install` 命令会从 ClawHub 下载 skill 文件夹。由 Gateway 网关支持、
通过新手引导或 Skills 设置触发的 skill 依赖安装，则使用独立的
`skills.install` 请求路径。

说明：

- `search [query...]` 接受可选查询；省略时将浏览默认的
  ClawHub 搜索流。
- `search --limit <n>` 会限制返回结果数量。
- `install --force` 会覆盖工作区中相同
  slug 的现有 skill 文件夹。
- `update --all` 只会更新当前活动工作区中受跟踪的 ClawHub 安装项。
- 如果未提供子命令，`list` 是默认操作。
- `list`、`info` 和 `check` 会将渲染后的输出写入 stdout。使用
  `--json` 时，这意味着机器可读负载会保留在 stdout 中，以便用于管道
  和脚本。

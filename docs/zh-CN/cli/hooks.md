---
read_when:
    - 你想要管理智能体钩子
    - 你想检查 Hooks 是否可用，或启用工作区 Hooks
summary: '`openclaw hooks`（智能体钩子）的 CLI 参考'
title: Hooks
x-i18n:
    generated_at: "2026-07-11T20:24:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

管理智能体 Hooks（由 `/new`、`/reset` 和 Gateway 网关启动等事件驱动的自动化）。不带参数的 `openclaw hooks` 等同于 `openclaw hooks list`。

相关：[Hooks](/zh-CN/automation/hooks) - [插件钩子](/zh-CN/plugins/hooks)

## 列出 Hooks

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

列出在工作区、托管、额外和内置目录中发现的 Hooks。

- `--eligible`：仅显示满足要求的 Hooks。
- `--json`：结构化输出。
- `-v, --verbose`：包含一列 Missing，显示未满足的要求。

```
Hooks（4/5 已就绪）

已就绪：
  🚀 boot-md ✓ - 在 Gateway 网关启动时运行 BOOT.md
  📎 bootstrap-extra-files ✓ - 在智能体引导启动期间注入额外的工作区引导启动文件
  📝 command-logger ✓ - 将所有命令事件记录到集中式审计文件
  💾 session-memory ✓ - 发出 /new 或 /reset 命令时，将会话上下文保存到记忆
```

## 获取 Hook 信息

```bash
openclaw hooks info <name> [--json]
```

`<name>` 是 Hook 名称或 Hook 键（例如 `session-memory`）。显示来源、文件/处理程序路径、主页、事件以及各项要求的状态（二进制文件、环境变量、配置、操作系统）。

## 检查可用性

```bash
openclaw hooks check [--json]
```

输出已就绪/未就绪的数量摘要；如果存在未就绪的 Hooks，则逐一列出及其阻塞原因。

## 启用 Hook

```bash
openclaw hooks enable <name>
```

在配置中添加或更新 `hooks.internal.entries.<name>.enabled = true`，同时打开 `hooks.internal.enabled` 总开关（在至少配置一个内部 Hook 之前，Gateway 网关不会加载任何内部 Hook 处理程序）。如果 Hook 不存在、由插件管理或不满足可用条件（缺少要求），则操作失败。

插件管理的 Hooks 会在 `hooks list` 中显示 `plugin:<id>`，无法在此处启用或禁用；请改为启用或禁用其所属插件。

启用后重启 Gateway 网关（重启 macOS 菜单栏应用，或在开发环境中重启 Gateway 网关进程），使其重新加载 Hooks。

## 禁用 Hook

```bash
openclaw hooks disable <name>
```

设置 `hooks.internal.entries.<name>.enabled = false`。之后重启 Gateway 网关。

## 安装和更新 Hook 包

```bash
openclaw plugins install <package>        # 默认使用 npm
openclaw plugins install npm:<package>    # 仅使用 npm
openclaw plugins install <package> --pin  # 固定解析后的版本
openclaw plugins install <path>           # 本地目录或归档文件
openclaw plugins install -l <path>        # 链接本地目录，而非复制

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Hook 包通过统一的插件安装器/更新器进行安装；`openclaw hooks install` / `openclaw hooks update` 仍可作为已弃用的别名使用，它们会输出警告并转发到 `plugins` 命令。

- Npm 说明符仅限注册表：包名加可选的精确版本或 dist-tag。不接受 Git/URL/文件说明符和 semver 范围。依赖项安装在项目本地运行，并使用 `--ignore-scripts`。
- 不带版本的说明符和 `@latest` 保持在稳定通道；如果 npm 解析到预发布版本，OpenClaw 会停止并要求你明确选择加入（`@beta`、`@rc` 或精确的预发布版本）。
- 支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。
- `-l, --link` 链接本地目录，而非复制该目录（将其添加到 `hooks.internal.load.extraDirs`）；链接的 Hook 包是来自操作员配置目录的托管 Hooks，而不是工作区 Hooks。
- `--pin` 将 npm 安装以精确解析后的 `name@version` 形式记录在 `hooks.internal.installs` 中。
- 安装操作会将 Hook 包复制到 `~/.openclaw/hooks/<id>`，在 `hooks.internal.entries.*` 下启用其中的 Hooks，并将安装记录到 `hooks.internal.installs`。
- 如果存储的完整性哈希与获取的产物不再匹配，OpenClaw 会发出警告并在继续前提示确认；传入全局 `--yes` 可跳过提示（例如在 CI 中）。

## 内置 Hooks

| Hook                  | 事件                                              | 功能                                                                                               |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Gateway 网关启动时，为每个已配置的智能体作用域运行 `BOOT.md`                                      |
| bootstrap-extra-files | `agent:bootstrap`                                 | 在智能体引导启动期间注入额外的引导启动文件（例如 monorepo 中的 `AGENTS.md`/`TOOLS.md`）             |
| command-logger        | `command`                                         | 将命令事件记录到 `~/.openclaw/logs/commands.log`                                                   |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在会话压缩开始和完成时发送可见的聊天通知                                                           |
| session-memory        | `command:new`, `command:reset`                    | 在执行 `/new` 或 `/reset` 时，将会话上下文保存到记忆                                               |

使用 `openclaw hooks enable <hook-name>` 启用任意内置 Hook。完整详情、配置键和默认值：[内置 Hooks](/zh-CN/automation/hooks#bundled-hooks)。

### command-logger 日志文件

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # 最近的命令
cat ~/.openclaw/logs/commands.log | jq .          # 美化输出
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # 按操作筛选
```

## 注意事项

- `hooks list --json`、`info --json` 和 `check --json` 会将结构化 JSON 直接写入标准输出。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [自动化 Hooks](/zh-CN/automation/hooks)

---
read_when:
    - 你想管理智能体 Hooks
    - 你想检查钩子可用性或启用工作区钩子
summary: '`openclaw hooks` 的 CLI 参考（智能体钩子）'
title: Hooks
x-i18n:
    generated_at: "2026-07-05T11:09:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

管理智能体 Hooks（由事件驱动的自动化，用于 `/new`、`/reset` 和 Gateway 网关启动等命令）。裸 `openclaw hooks` 等同于 `openclaw hooks list`。

相关：[Hooks](/zh-CN/automation/hooks) - [插件钩子](/zh-CN/plugins/hooks)

## 列出 Hooks

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

列出从工作区、托管、额外和内置目录中发现的 Hooks。

- `--eligible`：仅显示满足要求的 Hooks。
- `--json`：结构化输出。
- `-v, --verbose`：包含 Missing 列，显示未满足的要求。

```
Hooks (4/5 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject additional workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

## 获取 Hook 信息

```bash
openclaw hooks info <name> [--json]
```

`<name>` 是 Hook 名称或 Hook 键（例如 `session-memory`）。显示来源、文件/处理器路径、主页、事件，以及每项要求的状态（二进制文件、环境变量、配置、操作系统）。

## 检查可用性

```bash
openclaw hooks check [--json]
```

打印就绪/未就绪数量摘要；如果存在未就绪的 Hooks，则列出每个 Hook 及其阻塞原因。

## 启用 Hook

```bash
openclaw hooks enable <name>
```

在配置中添加/更新 `hooks.internal.entries.<name>.enabled = true`，并同时打开 `hooks.internal.enabled` 主开关（Gateway 网关在至少配置一个内部 Hook 处理器之前不会加载任何内部 Hook 处理器）。如果 Hook 不存在、由插件管理，或不可用（缺少要求），则会失败。

插件管理的 Hooks 会在 `hooks list` 中显示 `plugin:<id>`，无法在这里启用/禁用；请改为启用或禁用所属插件。

启用后重启 Gateway 网关（重启 macOS 菜单栏应用，或在开发中重启你的 Gateway 网关进程），使其重新加载 Hooks。

## 禁用 Hook

```bash
openclaw hooks disable <name>
```

设置 `hooks.internal.entries.<name>.enabled = false`。之后重启 Gateway 网关。

## 安装和更新 Hook 包

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin resolved version
openclaw plugins install <path>           # local directory or archive
openclaw plugins install -l <path>        # link a local directory instead of copying

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Hook 包通过统一的插件安装器/更新器安装；`openclaw hooks install` / `openclaw hooks update` 仍可作为已弃用别名使用，它们会打印警告并转发到 `plugins` 命令。

- Npm 规格仅限注册表：包名加可选的精确版本或 dist-tag。Git/URL/file 规格和 semver 范围会被拒绝。依赖安装在项目本地运行，并带有 `--ignore-scripts`。
- 裸规格和 `@latest` 保持在稳定轨道；如果 npm 解析到预发布版本，OpenClaw 会停止并要求你显式选择加入（`@beta`、`@rc`，或精确的预发布版本）。
- 支持的归档格式：`.zip`、`.tgz`、`.tar.gz`、`.tar`。
- `-l, --link` 会链接本地目录而不是复制它（将其添加到 `hooks.internal.load.extraDirs`）；链接的 Hook 包是来自操作员配置目录的托管 Hooks，而不是工作区 Hooks。
- `--pin` 会将 npm 安装记录为 `hooks.internal.installs` 中精确解析出的 `name@version`。
- 安装会将包复制到 `~/.openclaw/hooks/<id>`，在 `hooks.internal.entries.*` 下启用其 Hooks，并将安装记录到 `hooks.internal.installs`。
- 如果已存储的完整性哈希不再匹配获取到的制品，OpenClaw 会警告并在继续前提示；传递全局 `--yes` 可绕过提示（例如在 CI 中）。

## 内置 Hooks

| Hook                  | 事件                                              | 作用                                                                                               |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | 在 Gateway 网关启动时，为每个已配置的智能体作用域运行 `BOOT.md`                                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | 在智能体引导启动期间注入额外的引导启动文件（例如 monorepo `AGENTS.md`/`TOOLS.md`） |
| command-logger        | `command`                                         | 将命令事件记录到 `~/.openclaw/logs/commands.log`                                                   |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | 在会话压缩开始和结束时发送可见的聊天通知                                                         |
| session-memory        | `command:new`, `command:reset`                    | 在 `/new` 或 `/reset` 时将会话上下文保存到记忆                                                     |

使用 `openclaw hooks enable <hook-name>` 启用任何内置 Hook。完整详情、配置键和默认值：[内置 Hooks](/zh-CN/automation/hooks#bundled-hooks)。

### command-logger 日志文件

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # recent commands
cat ~/.openclaw/logs/commands.log | jq .          # pretty-print
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filter by action
```

## 说明

- `hooks list --json`、`info --json` 和 `check --json` 会将结构化 JSON 直接写入 stdout。

## 相关

- [CLI 参考](/zh-CN/cli)
- [自动化 Hooks](/zh-CN/automation/hooks)

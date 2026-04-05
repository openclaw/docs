---
read_when:
    - 你想管理智能体 hooks
    - 你想检查 hook 可用性或启用工作区 hooks
summary: '`openclaw hooks` 的 CLI 参考（智能体 hooks）'
title: hooks
x-i18n:
    generated_at: "2026-04-05T08:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

管理智能体 hooks（用于 `/new`、`/reset` 和 Gateway 网关启动等命令的事件驱动自动化）。

运行不带子命令的 `openclaw hooks` 等同于 `openclaw hooks list`。

相关内容：

- Hooks：[Hooks](/automation/hooks)
- 插件 hooks：[插件 hooks](/plugins/architecture#provider-runtime-hooks)

## 列出所有 hooks

```bash
openclaw hooks list
```

列出从工作区、托管、额外和内置目录中发现的所有 hooks。

**选项：**

- `--eligible`：仅显示符合条件的 hooks（要求已满足）
- `--json`：以 JSON 输出
- `-v, --verbose`：显示详细信息，包括缺失的要求

**示例输出：**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**示例（详细模式）：**

```bash
openclaw hooks list --verbose
```

显示不符合条件的 hooks 缺失了哪些要求。

**示例（JSON）：**

```bash
openclaw hooks list --json
```

返回结构化 JSON，便于程序化使用。

## 获取 hook 信息

```bash
openclaw hooks info <name>
```

显示特定 hook 的详细信息。

**参数：**

- `<name>`：hook 名称或 hook 键名（例如 `session-memory`）

**选项：**

- `--json`：以 JSON 输出

**示例：**

```bash
openclaw hooks info session-memory
```

**输出：**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## 检查 hooks 适用性

```bash
openclaw hooks check
```

显示 hook 适用性状态摘要（有多少已就绪，多少未就绪）。

**选项：**

- `--json`：以 JSON 输出

**示例输出：**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## 启用 hook

```bash
openclaw hooks enable <name>
```

通过将特定 hook 添加到你的配置中（默认是 `~/.openclaw/openclaw.json`）来启用它。

**注意：** 工作区 hooks 默认是禁用的，除非你在这里或配置中启用它们。由插件管理的 hooks 会在 `openclaw hooks list` 中显示为 `plugin:<id>`，不能在这里启用或禁用。请改为启用或禁用对应插件。

**参数：**

- `<name>`：hook 名称（例如 `session-memory`）

**示例：**

```bash
openclaw hooks enable session-memory
```

**输出：**

```
✓ Enabled hook: 💾 session-memory
```

**它会执行以下操作：**

- 检查 hook 是否存在且符合条件
- 在你的配置中更新 `hooks.internal.entries.<name>.enabled = true`
- 将配置保存到磁盘

如果 hook 来自 `<workspace>/hooks/`，则 Gateway 网关在加载它之前必须先完成这一步显式启用。

**启用后：**

- 重启 Gateway 网关以重新加载 hooks（在 macOS 上重启菜单栏应用，或在开发环境中重启你的 Gateway 网关进程）。

## 禁用 hook

```bash
openclaw hooks disable <name>
```

通过更新你的配置来禁用特定 hook。

**参数：**

- `<name>`：hook 名称（例如 `command-logger`）

**示例：**

```bash
openclaw hooks disable command-logger
```

**输出：**

```
⏸ Disabled hook: 📝 command-logger
```

**禁用后：**

- 重启 Gateway 网关以重新加载 hooks

## 说明

- `openclaw hooks list --json`、`info --json` 和 `check --json` 会将结构化 JSON 直接写入 stdout。
- 由插件管理的 hooks 不能在这里启用或禁用；请改为启用或禁用拥有它们的插件。

## 安装 Hook Packs

```bash
openclaw plugins install <package>        # 先查 ClawHub，再查 npm
openclaw plugins install <package> --pin  # 固定版本
openclaw plugins install <path>           # 本地路径
```

通过统一的插件安装器安装 hook packs。

`openclaw hooks install` 仍可作为兼容性别名使用，但它会打印弃用警告，并转发到 `openclaw plugins install`。

npm 规范**仅限 registry**（包名 + 可选的**精确版本**或 **dist-tag**）。Git / URL / 文件规范和 semver 范围会被拒绝。为了安全，依赖安装会使用 `--ignore-scripts` 运行。

裸规范和 `@latest` 会停留在稳定轨道上。如果 npm 将其中任一解析为预发布版本，OpenClaw 会停止并要求你通过预发布标签（如 `@beta` / `@rc`）或精确的预发布版本显式选择加入。

**它会执行以下操作：**

- 将 hook pack 复制到 `~/.openclaw/hooks/<id>`
- 在 `hooks.internal.entries.*` 中启用已安装的 hooks
- 在 `hooks.internal.installs` 下记录安装信息

**选项：**

- `-l, --link`：链接本地目录而不是复制（将其添加到 `hooks.internal.load.extraDirs`）
- `--pin`：将 npm 安装记录为 `hooks.internal.installs` 中精确解析后的 `name@version`

**支持的归档格式：** `.zip`、`.tgz`、`.tar.gz`、`.tar`

**示例：**

```bash
# 本地目录
openclaw plugins install ./my-hook-pack

# 本地归档文件
openclaw plugins install ./my-hook-pack.zip

# NPM 包
openclaw plugins install @openclaw/my-hook-pack

# 链接本地目录而不复制
openclaw plugins install -l ./my-hook-pack
```

链接的 hook packs 会被视为来自操作员配置目录的托管 hooks，而不是工作区 hooks。

## 更新 Hook Packs

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

通过统一的插件更新器更新已跟踪的基于 npm 的 hook packs。

`openclaw hooks update` 仍可作为兼容性别名使用，但它会打印弃用警告，并转发到 `openclaw plugins update`。

**选项：**

- `--all`：更新所有已跟踪的 hook packs
- `--dry-run`：显示将会发生哪些变化，但不写入

当存在已存储的完整性哈希且获取到的构件哈希发生变化时，OpenClaw 会打印警告，并在继续前请求确认。在 CI / 非交互运行中，可使用全局 `--yes` 跳过提示。

## 内置 hooks

### session-memory

当你发出 `/new` 或 `/reset` 时，将会话上下文保存到 memory。

**启用：**

```bash
openclaw hooks enable session-memory
```

**输出：** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**参见：** [session-memory 文档](/automation/hooks#session-memory)

### bootstrap-extra-files

在 `agent:bootstrap` 期间注入额外的 bootstrap 文件（例如 monorepo 本地的 `AGENTS.md` / `TOOLS.md`）。

**启用：**

```bash
openclaw hooks enable bootstrap-extra-files
```

**参见：** [bootstrap-extra-files 文档](/automation/hooks#bootstrap-extra-files)

### command-logger

将所有命令事件记录到集中式审计文件中。

**启用：**

```bash
openclaw hooks enable command-logger
```

**输出：** `~/.openclaw/logs/commands.log`

**查看日志：**

```bash
# 最近的命令
tail -n 20 ~/.openclaw/logs/commands.log

# 美化输出
cat ~/.openclaw/logs/commands.log | jq .

# 按操作筛选
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**参见：** [command-logger 文档](/automation/hooks#command-logger)

### boot-md

在 Gateway 网关启动时（渠道启动后）运行 `BOOT.md`。

**事件**：`gateway:startup`

**启用**：

```bash
openclaw hooks enable boot-md
```

**参见：** [boot-md 文档](/automation/hooks#boot-md)

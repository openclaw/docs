---
read_when:
    - 你想从终端检查或编辑工作区文件中的单个叶节点
    - 你正在编写访问工作区状态的脚本，并且需要一种稳定且不依赖类型的寻址方案
    - 你正在决定是否在自托管的 Gateway 网关上启用可选的 `oc-path` 插件
summary: 内置 `oc-path` 插件：提供适用于 `oc://` 工作区文件寻址方案的 `openclaw path` CLI
title: OC Path 插件
x-i18n:
    generated_at: "2026-07-11T20:43:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

内置的 `oc-path` 插件为 `oc://` 工作区文件寻址方案提供了 [`openclaw path`](/zh-CN/cli/path) CLI。它随 OpenClaw 仓库一起提供，位于 `extensions/oc-path/` 下，但需要主动启用：安装或构建后，它会保持未激活状态，直到你启用它。

`oc://` 地址指向工作区文件中的单个叶节点（或一组由通配符匹配的叶节点）。该插件支持四种文件类型：

- **markdown**（`.md`）：frontmatter、章节、条目、字段
- **jsonc**（`.jsonc`、`.json`）：保留注释和格式
- **jsonl**（`.jsonl`、`.ndjson`）：按行组织的记录
- **yaml**（`.yaml`、`.yml`、`.lobster`）：通过 `yaml` 包的 `Document` API 处理映射、序列和标量节点

自行托管者和编辑器扩展可使用该 CLI 读取或写入单个叶节点，而无须直接针对 SDK 编写脚本；智能体和 Hooks 将其视为确定性底层机制，因此字节保真的往返转换和脱敏哨兵保护可统一应用于所有文件类型。完整语法、各命令的逐项标志列表以及每种文件类型的实践示例，请参阅 [CLI 参考](/zh-CN/cli/path)；本页介绍启用该插件的原因和方法。

## 为什么要启用它

当脚本、Hooks 或本地智能体工具需要精确指向工作区状态中的某个部分，同时又不希望为每种文件结构编写专用解析器时，请启用 `oc-path`。单个 `oc://` 地址可以指向 Markdown frontmatter 键、章节条目、JSONC 配置叶节点、JSONL 事件字段或 YAML 工作流步骤。

这对于需要保持变更小巧、可审计且可重复的维护者工作流非常重要：检查单个值、查找匹配记录、试运行写入，然后只修改该叶节点，同时保留注释、行尾符和周边格式。

常见启用原因：

- **本地自动化**：Shell 脚本使用 `openclaw path … --json` 解析或更新单个工作区值，无须分别携带 Markdown、JSONC、JSONL 和 YAML 解析代码。
- **智能体可见的编辑**：智能体在写入前显示单个已寻址叶节点的试运行差异，这比自由形式的文件重写更容易审查。
- **编辑器集成**：编辑器可将 `oc://AGENTS.md/tools/gh` 映射到确切的 Markdown 节点和行号，无须根据标题文本猜测。
- **诊断**：`emit` 通过解析器和生成器对文件执行往返转换，以便你在依赖自动编辑前检查某种文件类型是否具有字节稳定性。

```bash
# 此配置中是否启用了 GitHub 插件？
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# 此会话日志中出现了哪些工具调用名称？
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# 这项微小的配置编辑会写入哪些字节？
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` 特意不负责更高层级的语义。记忆插件仍负责记忆写入，配置命令仍负责完整的配置管理，最近已知良好（LKG）配置恢复仍负责还原和提升。`oc-path` 是狭义的寻址与字节保真文件操作层，更高层级的工具可以围绕它构建功能。

## 它在哪里运行

该插件在你调用命令的主机上，**以进程内方式运行于 `openclaw` CLI 中**。它不需要正在运行的 Gateway 网关，也不会打开任何网络套接字；每个命令都只对你指定的文件执行纯转换。

插件元数据位于 `extensions/oc-path/openclaw.plugin.json`：

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` 使该插件不进入 Gateway 网关启动路径。`commandAliases` 和 `activation.onCommands` 告知 CLI 在你第一次运行 `openclaw path …` 时延迟加载该插件，因此从不使用此命令的安装不会产生任何开销。

## 启用

```bash
openclaw plugins enable oc-path
```

重启 Gateway 网关（如果你运行了一个），以便清单快照获取新的状态。在同一主机上直接调用 `openclaw path` 会立即生效；CLI 会按需加载该插件。

使用以下命令禁用：

```bash
openclaw plugins disable oc-path
```

## 依赖项

所有解析器依赖项都位于插件本地；启用 `oc-path` 不会向核心运行时引入新软件包：

| 依赖项         | 用途                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | 连接 `resolve`、`find`、`set`、`validate`、`emit` 子命令。             |
| `jsonc-parser` | 解析 JSONC 并编辑叶节点，同时保留注释和尾随逗号。                      |
| `markdown-it`  | 为章节、条目和字段模型执行 Markdown 词法单元化。                       |
| `yaml`         | 解析、生成和编辑 YAML `Document`，同时保留注释和流式样式。             |

JSONL 仍采用手写实现：按行解析比使用任何依赖项都更简单，并且每行解析已经通过 `jsonc-parser` 完成。

## 它提供的功能

| 接口                           | 提供方                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` 解析器/格式化器        | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 各类型的解析/生成/编辑         | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 通用解析/查找/设置             | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 脱敏哨兵保护                   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

目前 CLI 是唯一的公开接口。底层机制中的各个命令属于插件私有功能；使用者应使用 CLI（或基于 SDK 构建自己的插件）。

## 与其他插件的关系

- **`memory-*`**：记忆写入通过记忆插件完成，而不是通过 `oc-path`。`oc-path` 是通用文件底层机制；记忆插件在其上叠加自己的语义。
- **LKG**：`path` 不感知最近已知良好配置的还原。如果你通过 `path` 编辑的文件也受 LKG 跟踪，则下一个配置观察周期会决定是提升还是恢复它；应将 `path` 编辑视为对该文件的任何其他直接写入。

## 安全性

`set` 通过底层机制的生成路径写入原始字节，该路径会自动应用脱敏哨兵保护。包含 `__OPENCLAW_REDACTED__` 的叶节点（无论是完全一致还是作为子字符串）会在写入时被拒绝，并返回 `OC_EMIT_SENTINEL`。CLI 还会从其打印的所有人类可读输出或 JSON 输出中清除该哨兵字面量，将其替换为 `[REDACTED]`，确保终端捕获和管道永远不会泄露该标记。

## 相关内容

- [`openclaw path` CLI 参考](/zh-CN/cli/path)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [Building Plugins](/zh-CN/plugins/building-plugins)

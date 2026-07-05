---
read_when:
    - 你想从终端检查或编辑工作区文件中的单个叶节点
    - 你正在针对工作区状态编写脚本，并且需要一种稳定、与类型无关的寻址方案
    - 你正在决定是否在自托管 Gateway 网关上启用可选的 `oc-path` 插件
summary: 内置 `oc-path` 插件：随附用于 `oc://` 工作区文件寻址方案的 `openclaw path` CLI
title: OC Path 插件
x-i18n:
    generated_at: "2026-07-05T11:31:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

内置的 `oc-path` 插件为 `oc://` 工作区文件寻址方案添加了 [`openclaw path`](/zh-CN/cli/path) CLI。它随 OpenClaw 仓库一起发布，位于 `extensions/oc-path/` 下，但需要选择启用：安装/构建后它会保持休眠，直到你启用它。

`oc://` 地址指向工作区文件内的单个叶节点（或一组通配符叶节点）。该插件理解四种文件类型：

- **markdown**（`.md`）：前置元数据、章节、条目、字段
- **jsonc**（`.jsonc`、`.json`）：保留注释和格式
- **jsonl**（`.jsonl`、`.ndjson`）：面向行的记录
- **yaml**（`.yaml`、`.yml`、`.lobster`）：通过 `yaml` 包的 `Document` API 处理映射/序列/标量节点

自托管用户和编辑器扩展使用该 CLI 读取或写入单个叶节点，而无需直接针对 SDK 编写脚本；智能体和钩子将它视为确定性基底，因此字节保真往返和脱敏哨兵保护会统一应用于各种文件类型。完整语法、逐动词的标志列表以及按文件类型整理的示例，请参阅 [CLI 参考](/zh-CN/cli/path)；本页说明为什么以及如何启用该插件。

## 为什么启用它

当脚本、钩子或本地智能体工具需要指向工作区状态中的精确片段，而不想为每种文件形态编写专用解析器时，请启用 `oc-path`。单个 `oc://` 地址可以命名 Markdown 前置元数据键、章节条目、JSONC 配置叶节点、JSONL 事件字段或 YAML 工作流步骤。

这对于维护者工作流很重要，因为变更应保持小巧、可审计且可重复：检查一个值，查找匹配记录，试运行一次写入，然后只应用该叶节点，同时保留注释、换行符和相邻格式。

常见启用理由：

- **本地自动化**：Shell 脚本使用 `openclaw path … --json` 解析或更新一个工作区值，而不是携带独立的 Markdown、JSONC、JSONL 和 YAML 解析代码。
- **智能体可见编辑**：智能体在写入前展示一个已寻址叶节点的试运行差异，这比自由形式的文件重写更易审查。
- **编辑器集成**：编辑器将 `oc://AGENTS.md/tools/gh` 映射到准确的 Markdown 节点和行号，而不是根据标题文本猜测。
- **诊断**：`emit` 会让文件经过解析器和发射器往返一次，因此你可以在依赖自动编辑前检查某种文件类型是否保持字节稳定。

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` 刻意不拥有更高层语义。记忆插件仍然拥有记忆写入，配置命令仍然拥有完整配置管理，最后已知良好（LKG）配置恢复仍然拥有还原/提升。`oc-path` 是这些更高层工具可以围绕其构建的窄寻址和字节保留文件操作层。

## 它在哪里运行

该插件在你调用命令的主机上，**在 `openclaw` CLI 进程内**运行。它不需要正在运行的 Gateway 网关，也不会打开任何网络套接字；每个动词都是对你指定文件的纯转换。

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

`onStartup: false` 让插件不进入 Gateway 网关启动路径。`commandAliases` 和 `activation.onCommands` 会告诉 CLI 在你第一次运行 `openclaw path …` 时延迟加载该插件，因此从不使用该动词的安装不会付出成本。

## 启用

```bash
openclaw plugins enable oc-path
```

重启 Gateway 网关（如果你运行了一个），以便清单快照获取新状态。裸 `openclaw path` 调用会在同一主机上立即工作；CLI 会按需加载插件。

禁用方式：

```bash
openclaw plugins disable oc-path
```

## 依赖

所有解析器依赖都在插件本地；启用 `oc-path` 不会把新包拉入核心运行时：

| 依赖           | 用途                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | 为 `resolve`、`find`、`set`、`validate`、`emit` 连接子命令。           |
| `jsonc-parser` | JSONC 解析和叶节点编辑，并保留注释和尾随逗号。                        |
| `markdown-it`  | 为章节 / 条目 / 字段模型进行 Markdown 分词。                          |
| `yaml`         | 使用 YAML `Document` 解析 / 发射 / 编辑，并保留注释和流式样式。        |

JSONL 保持手写：面向行的解析比任何依赖都更简单，而且逐行解析已经通过 `jsonc-parser` 完成。

## 它提供什么

| 表面                           | 提供方                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` 解析器 / 格式化器      | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 按类型解析 / 发射 / 编辑       | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 通用解析 / 查找 / 设置         | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 脱敏哨兵保护                   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI 是目前唯一的公开表面。基底动词是插件私有的；消费者使用 CLI（或基于 SDK 构建自己的插件）。

## 与其他插件的关系

- **`memory-*`**：记忆写入通过记忆插件完成，而不是 `oc-path`。`oc-path` 是通用文件基底；记忆插件在其之上叠加自己的语义。
- **LKG**：`path` 不知道最后已知良好配置还原。如果你通过 `path` 编辑的文件也受 LKG 跟踪，下一次配置观察周期会决定是提升还是恢复它；请将 `path` 编辑视为对该文件的任何其他直接写入。

## 安全

`set` 通过基底的发射路径写入原始字节，该路径会自动应用脱敏哨兵保护。携带 `__OPENCLAW_REDACTED__`（逐字或作为子串）的叶节点会在写入时以 `OC_EMIT_SENTINEL` 被拒绝。CLI 还会从它打印的任何人类可读或 JSON 输出中清除字面哨兵，将其替换为 `[REDACTED]`，因此终端捕获和管道永远不会泄漏该标记。

## 相关

- [`openclaw path` CLI 参考](/zh-CN/cli/path)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [构建插件](/zh-CN/plugins/building-plugins)

---
read_when:
    - 你想通过终端查看或编辑工作区文件中的单个叶节点
    - 你正在针对工作区状态编写脚本，并且需要一种稳定、不依赖类型的寻址方案
    - 你正在决定是否在自托管 Gateway 网关上启用可选的 `oc-path` 插件
summary: 内置 `oc-path` 插件：随附用于 `oc://` 工作区文件寻址方案的 `openclaw path` CLI
title: OC Path 插件
x-i18n:
    generated_at: "2026-05-10T19:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

内置的 `oc-path` 插件为 `oc://` 工作区文件寻址方案添加了 [`openclaw path`](/zh-CN/cli/path) CLI。它随 OpenClaw 仓库一起发布，位于 `extensions/oc-path/` 下，但需要选择启用；安装/构建后它会保持休眠，直到你启用它。

`oc://` 地址指向工作区文件中的单个叶节点（或一组通配符叶节点）。该插件目前理解三类文件：

- **markdown**（`.md`、`.mdx`）：frontmatter、章节、条目、字段
- **jsonc**（`.jsonc`、`.json5`、`.json`）：保留注释和格式
- **jsonl**（`.jsonl`、`.ndjson`）：面向行的记录

自托管用户和编辑器扩展使用该 CLI 读取或写入单个叶节点，而无需直接针对 SDK 编写脚本；智能体和钩子把它视为确定性基底，因此字节保真往返和脱敏哨兵防护可统一适用于各种文件类型。

## 为什么启用它

当你希望脚本、钩子或本地智能体工具指向工作区状态中的精确片段，而不想为每种文件形状发明一个解析器时，请启用 `oc-path`。单个 `oc://` 地址可以命名一个 markdown frontmatter 键、一个章节条目、一个 JSONC 配置叶节点，或一个 JSONL 事件字段。

这对维护者工作流很重要，因为变更应当小巧、可审计且可重复：检查一个值、查找匹配记录、试运行一次写入，然后只应用该叶节点，同时不动注释、换行符和附近格式。将它作为选择启用的插件保留，可让高级用户获得寻址基底，而不会把解析器依赖或 CLI 表面带入那些永远不需要它的核心安装。

启用它的常见原因：

- **本地自动化**：shell 脚本可以使用 `openclaw path … --json` 解析或更新一个工作区值，而不必携带独立的 markdown、JSONC 和 JSONL 解析代码。
- **智能体可见的编辑**：智能体可以在写入前显示一个已寻址叶节点的试运行 diff，相比自由形式的文件重写，这更容易审阅。
- **编辑器集成**：编辑器可以将 `oc://AGENTS.md/tools/gh` 映射到确切的 markdown 节点和行号，而不必根据标题文本猜测。
- **诊断**：`emit` 会让文件通过解析器和发射器往返一次，因此你可以在依赖自动编辑前检查某种文件类型是否字节稳定。

具体示例：

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

该插件有意不拥有更高层语义。记忆插件仍拥有记忆写入，配置命令仍拥有完整配置管理，LKG 逻辑仍拥有恢复/提升。`oc-path` 是一个狭窄的寻址和字节保留文件操作层，这些更高层工具可以围绕它构建。

## 它在哪里运行

该插件在你调用命令的主机上，**在 `openclaw` CLI 进程内**运行。它不需要正在运行的 Gateway 网关，也不会打开任何网络套接字；每个动词都是对你指向的文件进行的纯转换。

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

`onStartup: false` 让该插件避开 Gateway 网关热路径。`onCommands:
["path"]` 告诉 CLI 在你第一次运行 `openclaw path …` 时懒加载该插件，因此从不使用该动词的安装不会付出成本。

## 启用

```bash
openclaw plugins enable oc-path
```

重启 Gateway 网关（如果你运行了一个），以便清单快照获取新状态。裸 `openclaw path` 调用会在同一主机上立即生效；CLI 会按需加载该插件。

使用以下命令禁用：

```bash
openclaw plugins disable oc-path
```

## 依赖

所有解析器依赖都是插件本地的；启用 `oc-path` 不会将新包拉入核心运行时：

| 依赖           | 用途                                                                |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | 为 `resolve`、`find`、`set`、`validate`、`emit` 连接子命令。        |
| `jsonc-parser` | JSONC 解析 + 叶节点编辑，同时保留注释和尾随逗号。                   |
| `markdown-it`  | 为章节 / 条目 / 字段模型进行 Markdown 标记化。                      |

JSONL 仍是手写实现；面向行的解析比任何依赖都更简单，而且逐行 JSONC 解析已经通过 `jsonc-parser` 完成。

## 它提供什么

| 表面                           | 提供方                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` 解析器 / 格式化器      | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 按类型解析 / 发射 / 编辑       | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| 通用解析 / 查找 / 设置         | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 脱敏哨兵防护                   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI 是目前唯一的公开表面。基底动词是插件私有的；使用者通过 CLI 使用它（或基于 SDK 构建自己的插件）。

## 与其他插件的关系

- **`memory-*`**：记忆写入通过记忆插件完成，而不是通过 `oc-path`。`oc-path` 是一个通用文件基底；记忆插件在其上叠加自己的语义。
- **LKG**：`path` 不知道 Last-Known-Good 配置恢复。如果某个文件由 LKG 跟踪，则下一次 `observe` 调用会决定是提升还是恢复；计划中的 `set --batch` 将用于通过 LKG 提升/恢复生命周期执行原子多重设置，并与 LKG 恢复基底一起提供。

## 安全

`set` 会通过基底的发射路径写入原始字节，该路径会自动应用脱敏哨兵防护。携带 `__OPENCLAW_REDACTED__`（逐字或作为子串）的叶节点会在写入时被拒绝，并返回 `OC_EMIT_SENTINEL`。CLI 还会从其打印的任何人类可读输出或 JSON 输出中清理该字面哨兵，将其替换为 `[REDACTED]`，因此终端捕获和管道永远不会泄漏该标记。

## 相关

- [`openclaw path` CLI 参考](/zh-CN/cli/path)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [构建插件](/zh-CN/plugins/building-plugins)

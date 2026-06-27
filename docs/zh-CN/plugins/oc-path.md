---
read_when:
    - 你想从终端检查或编辑工作区文件中的单个叶子节点
    - 你正在针对工作区状态编写脚本，并且需要一种稳定、与种类无关的寻址方案
    - 你正在决定是否在自托管 Gateway 网关上启用可选的 `oc-path` 插件
summary: 内置 `oc-path` 插件：随附 `openclaw path` CLI，用于 `oc://` 工作区文件寻址方案
title: OC Path 插件
x-i18n:
    generated_at: "2026-06-27T02:44:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

内置的 `oc-path` 插件为 `oc://` 工作区文件寻址方案添加了 [`openclaw path`](/zh-CN/cli/path) CLI。它随 OpenClaw 仓库一起发布，位于 `extensions/oc-path/` 下，但需要显式启用；安装/构建后会保持休眠，直到你启用它。

`oc://` 地址指向工作区文件中的单个叶子节点（或一组通配叶子节点）。该插件目前理解四类文件：

- **markdown**（`.md`、`.mdx`）：frontmatter、章节、条目、字段
- **jsonc**（`.jsonc`、`.json5`、`.json`）：保留注释和格式
- **jsonl**（`.jsonl`、`.ndjson`）：面向行的记录
- **yaml**（`.yaml`、`.yml`、`.lobster`）：通过 YAML 文档 API 处理映射/序列/标量节点

自托管用户和编辑器扩展使用该 CLI 读取或写入单个叶子节点，而无需直接针对 SDK 编写脚本；智能体和钩子会把它视为确定性底层基座，因此字节保真往返和脱敏哨兵保护会在各类文件中统一生效。

## 为什么启用它

当你希望脚本、钩子或本地智能体工具指向工作区状态中的精确片段，而不想为每种文件形态发明解析器时，请启用 `oc-path`。单个 `oc://` 地址可以命名 markdown frontmatter 键、章节条目、JSONC 配置叶子节点、JSONL 事件字段或 YAML 工作流步骤。

这对维护者工作流很重要，因为这些更改应该小而可审计，并且可重复：检查一个值，查找匹配记录，试运行一次写入，然后只应用该叶子节点，同时保留注释、行尾和周边格式不变。将它作为可选插件，可以让高级用户获得寻址基座，同时避免把解析器依赖或 CLI 表面加入到永远不需要它的核心安装中。

启用它的常见原因：

- **本地自动化**：shell 脚本可以用 `openclaw path … --json` 解析或更新一个工作区值，而不用携带独立的 markdown、JSONC、JSONL 和 YAML 解析代码。
- **智能体可见编辑**：智能体可以在写入前为一个已寻址的叶子节点展示试运行 diff，这比自由形式的文件重写更容易审查。
- **编辑器集成**：编辑器可以把 `oc://AGENTS.md/tools/gh` 映射到精确的 markdown 节点和行号，而无需根据标题文本猜测。
- **诊断**：`emit` 会让文件经过解析器和输出器完成往返，因此你可以在依赖自动编辑前检查某类文件是否具备字节稳定性。

具体示例：

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

该插件有意不拥有更高层语义。记忆插件仍然拥有记忆写入，配置命令仍然拥有完整配置管理，LKG 逻辑仍然拥有恢复/提升。`oc-path` 是狭窄的寻址与字节保留文件操作层，更高层工具可以围绕它构建。

## 它在哪里运行

该插件在你调用命令的主机上，**在 `openclaw` CLI 进程内**运行。它不需要正在运行的 Gateway 网关，也不会打开任何网络套接字；每个动词都是对你指向的文件执行的纯转换。

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

`onStartup: false` 让该插件不进入 Gateway 网关热路径。`onCommands:
["path"]` 告诉 CLI 在你首次运行 `openclaw path …` 时延迟加载该插件，因此从不使用该动词的安装不会付出成本。

## 启用

```bash
openclaw plugins enable oc-path
```

重启 Gateway 网关（如果你运行了一个），以便清单快照获取新状态。裸 `openclaw path` 调用会立即在同一主机上工作；CLI 会按需加载该插件。

禁用方式：

```bash
openclaw plugins disable oc-path
```

## 依赖

所有解析器依赖都是插件本地依赖；启用 `oc-path` 不会把新包拉入核心运行时：

| 依赖           | 用途                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `commander`    | 为 `resolve`、`find`、`set`、`validate`、`emit` 连接子命令。          |
| `jsonc-parser` | JSONC 解析 + 叶子节点编辑，并保留注释和尾随逗号。                    |
| `markdown-it`  | 为章节/条目/字段模型执行 Markdown 标记化。                           |
| `yaml`         | 使用 YAML `Document` 解析/输出/编辑，并保留注释和流式样式。           |

JSONL 仍然手写处理；面向行的解析比任何依赖都更简单，并且逐行 JSONC 解析已经通过 `jsonc-parser` 完成。

## 它提供什么

| 表面                           | 提供方                                                  |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` 解析器/格式化器        | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 按文件类型解析/输出/编辑       | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 通用 resolve / find / set      | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 脱敏哨兵保护                   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

该 CLI 是目前唯一的公开表面。底层基座动词是插件私有的；消费者使用 CLI（或基于 SDK 构建自己的插件）。

## 与其他插件的关系

- **`memory-*`**：记忆写入通过记忆插件完成，而不是 `oc-path`。`oc-path` 是通用文件基座；记忆插件在其上叠加自己的语义。
- **LKG**：`path` 不知道 Last-Known-Good 配置恢复。如果文件受 LKG 跟踪，下一次 `observe` 调用会决定是否提升或恢复；用于通过 LKG 提升/恢复生命周期执行原子多项设置的 `set --batch`，计划与 LKG 恢复基座一同推出。

## 安全

`set` 会通过基座的输出路径写入原始字节，该路径会自动应用脱敏哨兵保护。携带 `__OPENCLAW_REDACTED__`（逐字或作为子字符串）的叶子节点会在写入时被拒绝，并返回 `OC_EMIT_SENTINEL`。CLI 还会从它打印的任何面向人类或 JSON 输出中清除字面哨兵，将其替换为 `[REDACTED]`，因此终端捕获和管道永远不会泄露该标记。

## 相关

- [`openclaw path` CLI 参考](/zh-CN/cli/path)
- [管理插件](/zh-CN/plugins/manage-plugins)
- [构建插件](/zh-CN/plugins/building-plugins)

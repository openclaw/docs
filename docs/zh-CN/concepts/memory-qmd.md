---
read_when:
    - 你想将 QMD 设置为你的记忆后端
    - 你需要重排序或额外索引路径等高级记忆功能。
summary: 本地优先搜索 sidecar，支持 BM25、向量、重排序和查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-04-29T07:51:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71980e3701f9a5ddcfbbfa41497ef51d2aae2993b2326591124cc0a87f9a849f
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索边车，与 OpenClaw 并行运行。它将 BM25、向量搜索和重排序组合在单个二进制文件中，并且可以索引工作区记忆文件之外的内容。

## 相较内置功能增加了什么

- **重排序和查询扩展**，提升召回率。
- **索引额外目录** -- 项目文档、团队笔记、磁盘上的任何内容。
- **索引会话转录** -- 召回更早的对话。
- **完全本地** -- 通过可选的 node-llama-cpp 运行时包运行，并自动下载 GGUF 模型。
- **自动回退** -- 如果 QMD 不可用，OpenClaw 会无缝回退到内置引擎。

## 入门指南

### 前置要求

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允许扩展的 SQLite 构建（macOS 上使用 `brew install sqlite`）。
- QMD 必须位于 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 可直接使用。Windows 最适合通过 WSL2 支持。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建自包含的 QMD 主目录，并自动管理边车生命周期 -- 集合、更新和嵌入运行都会为你处理。它优先使用当前的 QMD 集合和 MCP 查询形态，但在需要时仍会回退到备用集合模式标志和较旧的 MCP 工具名称。启动时协调还会在检测到同名的较旧 QMD 集合仍然存在时，将过期的托管集合重新创建回其规范模式。

## 边车的工作方式

- OpenClaw 会基于你的工作区记忆文件和任何已配置的 `memory.qmd.paths` 创建集合，然后在 QMD 管理器打开时以及之后定期运行 `qmd update`（默认每 5 分钟一次）。这些刷新通过 QMD 子进程运行，而不是进程内文件系统爬取。语义模式还会运行 `qmd embed`。
- 默认工作区集合跟踪 `MEMORY.md` 以及 `memory/` 树。小写的 `memory.md` 不会作为根记忆文件被索引。
- QMD 自身的扫描器会忽略隐藏路径和常见依赖/构建目录，例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和 `build`。Gateway 网关启动默认不会初始化 QMD，因此冷启动会避免在首次使用记忆之前导入记忆运行时或创建长驻 watcher。
- 如果你仍想在 Gateway 网关启动时刷新，请将 `memory.qmd.update.startup` 设置为 `idle` 或 `immediate`。这个选择启用的启动刷新会使用一次性的 QMD 子进程路径，而不是创建完整的长驻进程内 watcher。
- 搜索使用已配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。`search` 仅使用 BM25，因此 OpenClaw 会在该模式下跳过语义向量就绪探测和嵌入维护。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 对于声明支持多集合过滤器的 QMD 版本，OpenClaw 会将同来源集合分组到一次 QMD 搜索调用中。较旧的 QMD 版本会保留兼容的逐集合回退。
- 如果 QMD 完全失败，OpenClaw 会回退到内置 SQLite 引擎。打开失败后，重复的聊天轮次尝试会短暂退避，因此缺失二进制文件或损坏的边车依赖不会造成重试风暴；`openclaw memory status` 和一次性 CLI 探测仍会直接重新检查 QMD。

<Info>
第一次搜索可能会很慢 -- QMD 会在首次运行 `qmd query` 时自动下载用于重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 搜索性能和兼容性

OpenClaw 保持 QMD 搜索路径同时兼容当前和较旧的 QMD 安装。

启动时，OpenClaw 会为每个管理器检查一次已安装 QMD 的帮助文本。如果二进制文件声明支持多个集合过滤器，OpenClaw 会用一个命令搜索所有同来源集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

这避免了为每个持久记忆集合启动一个 QMD 子进程。会话转录集合会保留在自己的来源组中，因此混合的 `memory` + `sessions` 搜索仍会从两个来源向结果多样化器提供输入。

较旧的 QMD 构建只接受一个集合过滤器。当 OpenClaw 检测到这类构建时，会保留兼容路径，并在合并和去重结果之前分别搜索每个集合。

要手动检查已安装的契约，请运行：

```bash
qmd --help | grep -i collection
```

当前 QMD 帮助会说明集合过滤器可以针对一个或多个集合。较旧的帮助通常描述单个集合。

## 模型覆盖

QMD 模型环境变量会从 Gateway 网关进程原样传递，因此你可以在不添加新的 OpenClaw 配置的情况下全局调优 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，使索引匹配新的向量空间。

## 索引额外路径

将 QMD 指向额外目录，使其可被搜索：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

来自额外路径的片段会在搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 理解此前缀，并会从正确的集合根目录读取。

## 索引会话转录

启用会话索引以召回更早的对话：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

转录会作为经过清理的用户/助手轮次导出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中。

## 搜索范围

默认情况下，QMD 搜索结果会在直接会话和渠道会话中显示（不包括群组）。配置 `memory.qmd.scope` 可更改此行为：

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

当范围拒绝某次搜索时，OpenClaw 会记录一条警告，其中包含推导出的渠道和聊天类型，便于调试空结果。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含 `Source: <path#line>` 页脚。设置 `memory.citations = "off"` 可省略该页脚，同时仍会在内部将路径传递给智能体。

## 何时使用

在你需要以下能力时选择 QMD：

- 通过重排序获得更高质量的结果。
- 搜索工作区外的项目文档或笔记。
- 召回过去的会话对话。
- 无需 API 密钥的完全本地搜索。

对于更简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 在没有额外依赖的情况下也能很好地工作。

## 故障排除

**找不到 QMD？** 确保二进制文件位于 Gateway 网关的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建符号链接：`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在你的 shell 中可用，但 OpenClaw 仍报告 `spawn qmd ENOENT`，Gateway 网关进程的 `PATH` 可能与你的交互式 shell 不同。请显式固定二进制文件：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

在安装 QMD 的环境中使用 `command -v qmd`，然后通过 `openclaw memory status --deep` 重新检查。

**第一次搜索很慢？** QMD 会在首次使用时下载 GGUF 模型。使用与 OpenClaw 相同的 XDG 目录运行 `qmd query "test"` 进行预热。

**搜索期间出现许多 QMD 子进程？** 如果可以，请更新 QMD。只有在已安装的 QMD 声明支持多个 `-c` 过滤器时，OpenClaw 才会为同来源多集合搜索使用一个进程；否则它会为了正确性保留较旧的逐集合回退。

**仅 BM25 的 QMD 仍尝试构建 llama.cpp？** 设置 `memory.qmd.searchMode = "search"`。OpenClaw 会将该模式视为仅词法模式，不运行 QMD 向量状态探测或嵌入维护，并将语义就绪检查留给 `vsearch` 或 `query` 设置。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。对于较慢硬件，设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope` -- 默认只允许直接会话和渠道会话。

**根记忆搜索突然变得过宽？** 重启 Gateway 网关，或等待下一次启动协调。OpenClaw 在检测到同名冲突时，会将过期的托管集合重新创建回规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？** QMD 遍历目前遵循底层 QMD 扫描器行为，而不是 OpenClaw 的内置符号链接规则。请将临时 monorepo checkout 放在 `.tmp/` 等隐藏目录下，或放在已索引 QMD 根之外，直到 QMD 暴露循环安全遍历或显式排除控制。

## 配置

有关完整配置表面（`memory.qmd.*`）、搜索模式、更新间隔、范围规则以及所有其他调节点，请参阅[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关

- [记忆概览](/zh-CN/concepts/memory)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)

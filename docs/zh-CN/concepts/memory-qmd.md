---
read_when:
    - 你想将 QMD 设置为你的记忆后端
    - 你需要高级记忆功能，例如重排序或额外索引路径
summary: 本地优先的搜索边车，支持 BM25、向量、重排序和查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-07-05T11:14:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索 sidecar，可与 OpenClaw 一起运行。它将 BM25、向量搜索和重排序整合在一个二进制文件中，并且可以索引工作区记忆文件之外的内容。

## 相比内置功能增加了什么

- **重排序和查询扩展**，提升召回率。
- **索引额外目录** - 项目文档、团队笔记、磁盘上的任何内容。
- **索引会话转录** - 召回早前的对话。
- **完全本地** - 通过官方 llama.cpp 提供商插件运行，并自动下载 GGUF 模型。
- **自动回退** - 如果 QMD 不可用，OpenClaw 会无缝回退到内置引擎。

## 入门指南

### 前提条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允许扩展的 SQLite 构建（macOS 上使用 `brew install sqlite`）。
- QMD 必须位于 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 可开箱即用。Windows 最好通过 WSL2 支持。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，并自动管理 sidecar 生命周期：集合、更新和嵌入运行都会为你处理。它优先使用当前的 QMD 集合和 MCP 查询形态，但会在需要时回退到备用的集合模式标志和旧版 MCP 工具名称。启动协调还会在仍存在同名旧版 QMD 集合时，将过期的托管集合重新创建回其规范模式。

## sidecar 的工作方式

- OpenClaw 会根据你的工作区记忆文件和任何已配置的 `memory.qmd.paths` 创建集合，然后在 QMD 管理器打开时以及之后定期运行 `qmd update`（`memory.qmd.update.interval`，默认 `5m`）。刷新通过 QMD 子进程运行，而不是进程内文件系统爬取。语义搜索模式还会运行 `qmd embed`（`memory.qmd.update.embedInterval`，默认 `60m`）。
- 默认工作区集合会跟踪 `MEMORY.md` 以及 `memory/` 树。小写的 `memory.md` 不会作为根记忆文件被索引。
- QMD 自身的扫描器会忽略隐藏路径和常见依赖/构建目录，例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和 `build`。Gateway 网关启动默认不会初始化 QMD（`memory.qmd.update.startup` 默认是 `off`），因此冷启动会避免在首次使用记忆之前导入记忆运行时或创建长生命周期的 watcher。
- 将 `memory.qmd.update.startup` 设置为 `idle` 或 `immediate`，即可仍然在 Gateway 网关启动时初始化 QMD。`memory.qmd.update.onBoot` 默认是 `true`，会在启动时运行初始刷新；将其设置为 `false` 可跳过该即时刷新（当配置了更新或嵌入间隔时，长生命周期管理器仍会打开，因此 QMD 仍然拥有其常规 watcher/定时器）。
- 搜索使用已配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。`search` 仅使用 BM25，因此 OpenClaw 在该模式下会跳过语义向量就绪探测和嵌入维护。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 当 `searchMode` 为 `query` 时，将 `memory.qmd.rerank` 设置为 `false` 可使用不带重排序器的 QMD 混合查询路径（需要 QMD 2.1 或更新版本）。OpenClaw 会向直接 QMD CLI 路径传递 `--no-rerank`，并向 QMD 的 MCP 查询工具传递 `rerank: false`。
- 对于声明支持多集合过滤器的 QMD 版本，OpenClaw 会将同源集合分组到一次 QMD 搜索调用中。旧版 QMD 会继续使用兼容的逐集合回退。
- 如果 QMD 完全失败，OpenClaw 会回退到内置 SQLite 引擎。重复的聊天轮次尝试会在打开失败后短暂退避，以免缺失的二进制文件或损坏的 sidecar 依赖造成重试风暴；`openclaw memory status` 和一次性 CLI 探测仍会直接重新检查 QMD。

<Info>
首次搜索可能较慢 - QMD 会在第一次运行 `qmd query` 时自动下载用于重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 搜索性能和兼容性

OpenClaw 会保持 QMD 搜索路径兼容当前和较旧的 QMD 安装。

启动时，OpenClaw 会为每个管理器检查一次已安装 QMD 的帮助文本。如果二进制文件声明支持多个集合过滤器，OpenClaw 会用一条命令搜索所有同源集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

这可以避免为每个持久记忆集合启动一个 QMD 子进程。会话转录集合会保留在自己的来源组中，因此混合 `memory` + `sessions` 搜索仍会从两个来源向结果多样化器提供输入。

旧版 QMD 构建只接受一个集合过滤器。当 OpenClaw 检测到这类构建时，会保留兼容路径，分别搜索每个集合，然后合并并去重结果。

要手动检查已安装的契约，请运行：

```bash
qmd --help | grep -i collection
```

当前 QMD 帮助会提到面向一个或多个集合。旧版帮助通常描述单个集合。

## 模型覆盖

QMD 模型环境变量会从 Gateway 网关进程原样传递，因此你可以在不添加新 OpenClaw 配置的情况下全局调优 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，使索引匹配新的向量空间。

## 索引额外路径

将 QMD 指向其他目录，使它们可被搜索：

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

额外路径中的片段会在搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 理解此前缀，并会从正确的集合根读取。

## 索引会话转录

启用会话索引可召回早前的对话。QMD 同时需要通用的 `memorySearch` 会话来源和 QMD 转录导出器：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

转录会作为经过清理的用户/助手轮次导出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中。仅设置 `memorySearch.experimental.sessionMemory` 不会将转录导出到 QMD。

会话命中仍会受到 [`tools.sessions.visibility`](/zh-CN/gateway/config-tools#toolssessions) 过滤。默认的 `tree` 可见性不会暴露无关的同 Agent 会话。如果应当能从单独的私信会话召回由 Gateway 网关分发的会话，请有意设置 `tools.sessions.visibility: "agent"`。

## 搜索范围

默认情况下，QMD 搜索结果只会在直接会话中呈现（不包括群组或渠道聊天）。配置 `memory.qmd.scope` 可更改此行为：

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

上面的片段就是实际默认规则。当范围拒绝一次搜索时，OpenClaw 会记录一条警告，其中包含派生出的渠道和聊天类型，让空结果更易调试。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会追加一个 `Source: <path>#L<line>`（或 `#L<start>-L<end>`）页脚。在 `auto` 模式下，页脚只会为直接聊天会话添加。设置 `memory.citations = "off"` 可省略页脚，同时仍在内部将路径传递给智能体。

## 何时使用

在需要以下能力时选择 QMD：

- 通过重排序获得更高质量的结果。
- 搜索工作区之外的项目文档或笔记。
- 召回过去的会话对话。
- 无需 API key 的完全本地搜索。

对于更简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 无需额外依赖即可很好地工作。

## 故障排查

**找不到 QMD？** 确保二进制文件位于 Gateway 网关的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建符号链接：`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在你的 shell 中可用，但 OpenClaw 仍报告 `spawn qmd ENOENT`，Gateway 网关进程的 `PATH` 很可能与交互式 shell 不同。请显式固定二进制文件：

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

在安装 QMD 的环境中使用 `command -v qmd`，然后用 `openclaw memory status --deep` 重新检查。

**首次搜索非常慢？** QMD 会在首次使用时下载 GGUF 模型。请使用 OpenClaw 所用的相同 XDG 目录，通过 `qmd query "test"` 预热。

**搜索期间出现很多 QMD 子进程？** 如果可以，请更新 QMD。只有在已安装的 QMD 声明支持多个 `-c` 过滤器时，OpenClaw 才会为同源多集合搜索使用一个进程；否则，为保证正确性，它会保留较旧的逐集合回退。

**仅 BM25 的 QMD 仍在尝试构建 llama.cpp？** 设置 `memory.qmd.searchMode = "search"`。OpenClaw 会将该模式视为仅词法模式，跳过 QMD 向量状态探测和嵌入维护，并将语义就绪检查留给 `vsearch` 或 `query` 设置。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。对于较慢硬件，请将其设置得更高，例如 `120000`。

**群组或渠道聊天中结果为空？** 这在默认 `memory.qmd.scope` 下是预期行为，因为它只允许直接会话。如果你希望在那里显示 QMD 结果，请为 `group` 或 `channel` 聊天类型添加 `allow` 规则。

**根记忆搜索突然变得太宽泛？** 重启 Gateway 网关，或等待下一次启动协调。当 OpenClaw 检测到同名冲突时，会将过期的托管集合重新创建回规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？** QMD 遍历遵循底层 QMD 扫描器，而不是 OpenClaw 的内置符号链接规则。在 QMD 暴露循环安全遍历或显式排除控制之前，请将临时 monorepo 检出放在隐藏目录（如 `.tmp/`）下，或放在已索引 QMD 根之外。

## 配置

有关完整配置表面（`memory.qmd.*`）、搜索模式、更新间隔、范围规则和所有其他选项，请参阅[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关

- [记忆概览](/zh-CN/concepts/memory)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)

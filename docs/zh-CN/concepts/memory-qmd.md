---
read_when:
    - 你想将 QMD 设置为你的记忆后端
    - 你需要重排序或额外索引路径等高级记忆功能
summary: 本地优先的搜索 sidecar，支持 BM25、向量、重排序和查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-06-27T01:49:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索 sidecar，会与 OpenClaw 一起运行。它将 BM25、向量搜索和重排序组合在单个二进制文件中，并且可以索引工作区记忆文件之外的内容。

## 相比内置能力新增了什么

- **重排序和查询扩展**，用于提升召回率。
- **索引额外目录** -- 项目文档、团队笔记、磁盘上的任何内容。
- **索引会话转录** -- 召回更早的对话。
- **完全本地** -- 通过官方 llama.cpp 提供商插件运行，并自动下载 GGUF 模型。
- **自动回退** -- 如果 QMD 不可用，OpenClaw 会无缝回退到内置引擎。

## 入门指南

### 前置条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允许扩展的 SQLite 构建（macOS 上用 `brew install sqlite`）。
- QMD 必须位于 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 可开箱即用。Windows 最适合通过 WSL2 支持。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建自包含的 QMD 主目录，并自动管理 sidecar 生命周期 -- collection、更新和 embedding 运行都会为你处理。它优先使用当前的 QMD collection 和 MCP 查询形状，但在需要时仍会回退到替代 collection pattern 标志和较旧的 MCP 工具名称。启动时的协调还会在仍存在同名旧 QMD collection 时，将过期的托管 collection 重新创建回其规范 pattern。

## sidecar 如何工作

- OpenClaw 会从你的工作区记忆文件和任何已配置的 `memory.qmd.paths` 创建 collection，然后在 QMD 管理器打开时运行 `qmd update`，之后也会定期运行（默认每 5 分钟一次）。这些刷新通过 QMD 子进程运行，而不是进程内文件系统抓取。语义模式还会运行 `qmd embed`。
- 默认工作区 collection 会跟踪 `MEMORY.md` 以及 `memory/` 树。小写的 `memory.md` 不会作为根记忆文件被索引。
- QMD 自身的扫描器会忽略隐藏路径，以及常见的依赖/构建目录，例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和 `build`。Gateway 网关启动默认不会初始化 QMD，因此冷启动会避免在首次使用记忆之前导入记忆运行时或创建长期运行的 watcher。
- 如果你仍然希望在 Gateway 网关启动时初始化 QMD，请将 `memory.qmd.update.startup` 设置为 `idle` 或 `immediate`。使用 `memory.qmd.update.onBoot: true` 时，启动会运行初始刷新。使用 `onBoot: false` 时，启动会跳过该立即刷新，但在配置了更新或 embedding 间隔时仍会打开长期运行的管理器，因此 QMD 可以拥有自己的常规 watcher 和定时器。
- 搜索会使用已配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。`search` 仅使用 BM25，因此 OpenClaw 在该模式下会跳过语义向量就绪探测和 embedding 维护。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 当 `searchMode` 为 `query` 时，将 `memory.qmd.rerank` 设置为 `false` 可使用 QMD 的混合查询路径，但不使用重排序器。OpenClaw 会向直接 QMD CLI 路径传递 `--no-rerank`，并向 QMD 的 MCP 查询工具传递 `rerank: false`。此选项需要 QMD 2.1 或更新版本。
- 对于声明支持多 collection 过滤器的 QMD 版本，OpenClaw 会将同源 collection 分组到一次 QMD 搜索调用中。较旧的 QMD 版本会保留兼容的逐 collection 回退。
- 如果 QMD 完全失败，OpenClaw 会回退到内置 SQLite 引擎。在打开失败后，重复的聊天轮次尝试会短暂退避，因此缺失的二进制文件或损坏的 sidecar 依赖不会造成重试风暴；`openclaw memory status` 和一次性 CLI 探测仍会直接重新检查 QMD。

<Info>
第一次搜索可能较慢 -- QMD 会在首次运行 `qmd query` 时自动下载用于重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 搜索性能和兼容性

OpenClaw 会让 QMD 搜索路径兼容当前和较旧的 QMD 安装。

启动时，OpenClaw 会为每个管理器检查一次已安装 QMD 的帮助文本。如果二进制文件声明支持多个 collection 过滤器，OpenClaw 会用一条命令搜索所有同源 collection：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

这避免了为每个持久记忆 collection 启动一个 QMD 子进程。会话转录 collection 会保留在自己的来源组中，因此混合 `memory` + `sessions` 搜索仍会为结果多样化器提供来自两个来源的输入。

较旧的 QMD 构建只接受一个 collection 过滤器。当 OpenClaw 检测到这类构建时，它会保留兼容路径，并分别搜索每个 collection，然后合并和去重结果。

要手动检查已安装的契约，请运行：

```bash
qmd --help | grep -i collection
```

当前 QMD 帮助说明 collection 过滤器可以面向一个或多个 collection。较旧的帮助通常描述单个 collection。

## 模型覆盖

QMD 模型环境变量会从 Gateway 网关进程原样传递，因此你可以全局调优 QMD，而无需添加新的 OpenClaw 配置：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改 embedding 模型后，请重新运行 embedding，使索引匹配新的向量空间。

## 索引额外路径

将 QMD 指向其他目录，使其可搜索：

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

额外路径中的片段会在搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 理解此前缀，并会从正确的 collection 根目录读取。

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

转录会作为清理后的用户/助手轮次导出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD collection。

## 搜索范围

默认情况下，QMD 搜索结果会在直接会话和渠道会话（非群组）中呈现。配置 `memory.qmd.scope` 可更改此行为：

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

当范围拒绝某次搜索时，OpenClaw 会记录一条警告，其中包含派生出的渠道和聊天类型，以便更容易调试空结果。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含 `Source: <path#line>` 页脚。将 `memory.citations = "off"` 设置为省略该页脚，同时仍在内部将路径传递给智能体。

## 何时使用

在你需要以下能力时选择 QMD：

- 通过重排序获得更高质量的结果。
- 搜索工作区外的项目文档或笔记。
- 召回过去的会话对话。
- 无需 API key 的完全本地搜索。

对于更简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 无需额外依赖即可很好工作。

## 故障排除

**找不到 QMD？** 确保二进制文件位于 Gateway 网关的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建符号链接：`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在你的 shell 中可用，但 OpenClaw 仍报告 `spawn qmd ENOENT`，Gateway 网关进程的 `PATH` 很可能与交互式 shell 不同。显式固定二进制文件：

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

**第一次搜索非常慢？** QMD 首次使用时会下载 GGUF 模型。使用 OpenClaw 所用的相同 XDG 目录运行 `qmd query "test"` 进行预热。

**搜索期间出现许多 QMD 子进程？** 如果可以，请更新 QMD。只有当已安装的 QMD 声明支持多个 `-c` 过滤器时，OpenClaw 才会为同源多 collection 搜索使用一个进程；否则它会保留较旧的逐 collection 回退以保证正确性。

**仅 BM25 的 QMD 仍尝试构建 llama.cpp？** 设置 `memory.qmd.searchMode = "search"`。OpenClaw 会将该模式视为仅词法模式，不运行 QMD 向量状态探测或 embedding 维护，并将语义就绪检查留给 `vsearch` 或 `query` 设置。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。对于较慢的硬件，设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope` -- 默认只允许直接会话和渠道会话。

**根记忆搜索突然变得过宽？** 重启 Gateway 网关，或等待下一次启动协调。OpenClaw 在检测到同名冲突时，会将过期的托管 collection 重新创建回规范的 `MEMORY.md` 和 `memory/` pattern。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？** QMD 遍历当前遵循底层 QMD 扫描器行为，而不是 OpenClaw 的内置符号链接规则。在 QMD 暴露循环安全遍历或显式排除控制之前，请将临时 monorepo checkout 放在 `.tmp/` 这类隐藏目录下，或放在已索引 QMD 根目录之外。

## 配置

有关完整配置表面（`memory.qmd.*`）、搜索模式、更新间隔、范围规则和所有其他旋钮，请参阅[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关

- [记忆概览](/zh-CN/concepts/memory)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)

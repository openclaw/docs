---
read_when:
    - 你想将 QMD 设置为记忆后端
    - 你需要重排序或额外索引路径等高级记忆功能
summary: 本地优先的搜索边车，支持 BM25、向量、重排序和查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-07-14T13:33:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索辅助进程，与 OpenClaw
并行运行。它在单个二进制文件中结合了 BM25、向量搜索和重排序功能，
并且可以索引工作区记忆文件之外的内容。

## 相比内置引擎增加的功能

- **重排序和查询扩展**，提高召回率。
- **索引额外目录** — 项目文档、团队笔记以及磁盘上的任何内容。
- **索引会话转录记录** — 回忆之前的对话。
- **完全本地运行** — 使用官方 llama.cpp provider 插件运行，并
  自动下载 GGUF 模型。
- **自动回退** — 如果 QMD 不可用，OpenClaw 会无缝回退到
  内置引擎。

## 入门指南

### 前置条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允许扩展的 SQLite 构建版本（macOS 上为 `brew install sqlite`）。
- QMD 必须位于 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 可直接使用。Windows 最适合通过 WSL2 使用。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，
并自动管理辅助进程的生命周期
— 集合、更新和嵌入运行都由系统处理。
它优先使用当前的 QMD 集合和 MCP 查询格式，但会在需要时回退到
替代的集合模式标志和旧版 MCP 工具名称。
如果仍存在同名的旧 QMD 集合，启动时的协调过程还会将过时的托管集合
重新创建为其规范模式。

## 辅助进程的工作原理

- OpenClaw 会根据工作区记忆文件和任何已配置的
  `memory.qmd.paths` 创建集合，然后在 QMD 管理器打开时运行 `qmd update`，
  此后定期运行（`memory.qmd.update.interval`，默认为
  `5m`）。刷新通过 QMD 子进程运行，而不是在进程内遍历文件系统。
  语义搜索模式还会运行 `qmd embed`
  （`memory.qmd.update.embedInterval`，默认为 `60m`）。
- 默认工作区集合跟踪 `MEMORY.md` 以及 `memory/`
  目录树。小写的 `memory.md` 不会作为根记忆文件被索引。
- QMD 自身的扫描器会忽略隐藏路径以及常见的依赖项/构建目录，
  例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和
  `build`。默认情况下，Gateway 网关启动时不会初始化 QMD
  （`memory.qmd.update.startup` 默认为 `off`），因此冷启动时不会
  导入记忆运行时，也不会在首次使用记忆之前创建长期运行的监视器。
- 将 `memory.qmd.update.startup` 设置为 `idle` 或 `immediate`，即可在
  Gateway 网关启动时初始化 QMD。`memory.qmd.update.onBoot` 默认为 `true`，
  并在启动时执行初始刷新；将其设置为 `false` 可跳过此次
  即时刷新（配置更新或嵌入间隔后，长期运行的管理器仍会打开，因此 QMD
  会继续管理其常规监视器/定时器）。
- 搜索使用配置的 `searchMode`（默认为 `search`；还支持
  `vsearch` 和 `query`）。`search` 仅使用 BM25，因此在该模式下，
  OpenClaw 会跳过语义向量就绪探测和嵌入维护。如果某个模式失败，
  OpenClaw 会使用 `qmd query` 重试。
- 当 `searchMode` 为 `query` 时，将 `memory.qmd.rerank` 设置为 `false`，
  即可使用 QMD 不含重排序器的混合查询路径（需要 QMD 2.1 或更高版本）。
  OpenClaw 会向直接 QMD CLI 路径传递 `--no-rerank`，
  并向 QMD 的 MCP 查询工具传递 `rerank: false`。
- 对于声明支持多集合筛选器的 QMD 版本，OpenClaw 会将
  来源相同的集合分组到一次 QMD 搜索调用中。旧版 QMD
  则继续使用兼容的逐集合回退方式。
- 如果 QMD 完全失败，OpenClaw 会回退到内置 SQLite 引擎。
  打开失败后，连续聊天轮次中的尝试会短暂退避，以避免
  缺失的二进制文件或损坏的辅助进程依赖引发重试风暴；
  `openclaw memory status` 和一次性 CLI 探测仍会
  直接重新检查 QMD。

<Info>
首次搜索可能较慢 — QMD 会在第一次运行 `qmd query` 时自动下载用于
重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 搜索性能和兼容性

OpenClaw 会保持 QMD 搜索路径同时兼容当前和旧版 QMD
安装。

启动时，OpenClaw 会为每个管理器检查一次已安装 QMD 的帮助文本。如果
二进制文件声明支持多个集合筛选器，OpenClaw
会通过一条命令搜索所有来源相同的集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

这可以避免为每个持久记忆集合启动一个 QMD 子进程。
会话转录记录集合会保留在单独的来源组中，因此混合
`memory` + `sessions` 搜索仍会向结果多样化处理器提供来自
两种来源的输入。

旧版 QMD 构建仅接受一个集合筛选器。当 OpenClaw 检测到这类
构建时，会保留兼容路径并分别搜索各个集合，
然后合并结果并进行去重。

若要手动检查已安装版本的约定，请运行：

```bash
qmd --help | grep -i collection
```

当前 QMD 帮助会提到以一个或多个集合为目标。旧版帮助
通常只描述单个集合。

## 模型覆盖设置

QMD 模型环境变量会从 Gateway 网关进程原样传递，
因此无需添加新的 OpenClaw 配置即可全局调整 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，使索引与新的
向量空间匹配。

## 索引额外路径

将 QMD 指向其他目录，使这些目录可被搜索：

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

额外路径中的片段在搜索结果中显示为 `qmd/<collection>/<relative-path>`。
`memory_get` 能识别此前缀，并从正确的集合根目录读取内容。

## 索引会话转录记录

启用会话索引，即可回忆之前的对话。QMD 同时需要
通用的 `memorySearch` 会话来源和 QMD 转录记录导出器：

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

转录记录会以经过清理的用户/助手轮次形式导出到
`~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中。仅设置
`memorySearch.experimental.sessionMemory` 不会将转录记录导出到
QMD。

会话命中结果仍会由
[`tools.sessions.visibility`](/zh-CN/gateway/config-tools#toolssessions) 筛选。默认的
`tree` 可见性不会暴露同一智能体下无关的会话。如果希望从单独的私信会话中
回忆由 Gateway 网关分派的会话，请有意设置 `tools.sessions.visibility: "agent"`。

## 搜索范围

默认情况下，QMD 搜索结果仅在直接会话中显示（不包括
群聊或渠道聊天）。配置 `memory.qmd.scope` 可更改此行为：

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

以上片段就是实际的默认规则。当范围规则拒绝搜索时，
OpenClaw 会记录一条警告，其中包含推导出的渠道和聊天类型，
以便更轻松地调试空结果。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段末尾会附加
`Source: <path>#L<line>`（或 `#L<start>-L<end>`）页脚。在 `auto`
模式下，仅会为直接聊天会话添加该页脚。设置
`memory.citations = "off"` 可省略页脚，同时仍在内部将路径传递给
智能体。

## 适用场景

在需要以下功能时选择 QMD：

- 通过重排序获得更高质量的结果。
- 搜索工作区之外的项目文档或笔记。
- 回忆过去的会话对话。
- 无需 API key 的完全本地搜索。

对于更简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 无需额外依赖即可良好运行。

## 故障排查

**找不到 QMD？** 请确保二进制文件位于 Gateway 网关的 `PATH` 中。如果 OpenClaw
作为服务运行，请创建符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在你的 shell 中可以运行，但 OpenClaw 仍报告
`spawn qmd ENOENT`，则 Gateway 网关进程的 `PATH` 很可能与
交互式 shell 不同。请显式固定二进制文件：

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

在安装 QMD 的环境中使用 `command -v qmd`，然后通过
`openclaw memory status --deep` 重新检查。

**首次搜索非常慢？** QMD 会在首次使用时下载 GGUF 模型。请使用
OpenClaw 所用的相同 XDG 目录运行 `qmd query "test"` 进行预热。

**搜索期间出现许多 QMD 子进程？** 如果可能，请更新 QMD。仅当
已安装的 QMD 声明支持多个 `-c` 筛选器时，OpenClaw
才会使用单个进程执行来源相同的多集合搜索；否则，为确保正确性，
它会保留旧版逐集合回退方式。

**仅使用 BM25 的 QMD 仍尝试构建 llama.cpp？** 请设置
`memory.qmd.searchMode = "search"`。OpenClaw 会将该模式视为
纯词法模式，跳过 QMD 向量状态探测和嵌入维护，并将
语义就绪检查留给 `vsearch` 或 `query` 设置。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认值：4000ms）。
对于速度较慢的硬件，请将其设置为更高的值，例如 `120000`。此限制适用于
智能体调用 `memory_search` 期间 QMD 自身的搜索命令；设置、同步、
内置回退和补充语料库工作各自使用更短的截止时间。

**群聊或渠道聊天中的结果为空？** 使用默认的
`memory.qmd.scope` 时，这是预期行为，因为它只允许直接会话。如果希望在这些位置显示
QMD 结果，请为 `group` 或 `channel` 聊天类型添加
`allow` 规则。

**根记忆搜索范围突然过宽？** 请重启 Gateway 网关，或等待
下一次启动协调。检测到同名冲突时，OpenClaw 会将过时的托管集合
重新创建为规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？**
QMD 遍历遵循底层 QMD 扫描器的行为，而不是 OpenClaw 的
内置符号链接规则。在 QMD 提供
循环安全的遍历或显式排除控制之前，请将临时 monorepo 检出目录放在
`.tmp/` 等隐藏目录下，或放在已索引的 QMD 根目录之外。

## 配置

有关完整的配置范围（`memory.qmd.*`）、搜索模式、更新间隔、
范围规则和所有其他选项，请参阅
[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)

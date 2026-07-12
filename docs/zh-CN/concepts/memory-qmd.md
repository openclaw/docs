---
read_when:
    - 你想将 QMD 设置为记忆后端
    - 你需要重排序或额外索引路径等高级记忆功能
summary: 本地优先的搜索边车服务，支持 BM25、向量、重排序和查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-07-11T20:29:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索边车，与 OpenClaw
并行运行。它在单个二进制文件中结合了 BM25、向量搜索和重排序，并且可以为工作区记忆文件以外的内容建立索引。

## 相比内置引擎增加的功能

- **重排序和查询扩展**，以提高召回率。
- **为额外目录建立索引**——项目文档、团队笔记以及磁盘上的任何内容。
- **为会话转录建立索引**——回忆之前的对话。
- **完全本地运行**——使用官方 llama.cpp 提供商插件，并自动下载 GGUF 模型。
- **自动回退**——如果 QMD 不可用，OpenClaw 会无缝回退到内置引擎。

## 入门指南

### 前置条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 支持扩展的 SQLite 构建版本（在 macOS 上运行 `brew install sqlite`）。
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
并自动管理边车生命周期——集合、更新和嵌入运行均由 OpenClaw 代为处理。
它优先使用当前的 QMD 集合和 MCP 查询格式，但会在需要时回退到替代的集合模式标志和旧版 MCP 工具名称。
启动协调还会在仍存在同名旧版 QMD 集合时，将过时的托管集合重新创建为其规范模式。

## 边车的工作方式

- OpenClaw 会根据你的工作区记忆文件和已配置的
  `memory.qmd.paths` 创建集合，然后在 QMD 管理器打开时运行 `qmd update`，
  并在此后定期运行（`memory.qmd.update.interval`，默认值为
  `5m`）。刷新通过 QMD 子进程执行，而不是通过进程内文件系统遍历。
  语义搜索模式还会运行 `qmd embed`
  （`memory.qmd.update.embedInterval`，默认值为 `60m`）。
- 默认工作区集合会跟踪 `MEMORY.md` 以及 `memory/`
  目录树。小写的 `memory.md` 不会作为根记忆文件建立索引。
- QMD 自身的扫描器会忽略隐藏路径以及常见的依赖项/构建目录，
  例如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和
  `build`。默认情况下，Gateway 网关启动时不会初始化 QMD
  （`memory.qmd.update.startup` 默认为 `off`），因此冷启动时，在首次使用记忆之前，
  不会导入记忆运行时，也不会创建长期运行的监视器。
- 如果仍希望在 Gateway 网关启动时初始化 QMD，请将
  `memory.qmd.update.startup` 设置为 `idle` 或 `immediate`。
  `memory.qmd.update.onBoot` 默认为 `true`，会在启动时运行初始刷新；
  将其设置为 `false` 可跳过该即时刷新（配置了更新或嵌入间隔时，
  长期运行的管理器仍会打开，因此 QMD 会继续管理其常规监视器/定时器）。
- 搜索使用配置的 `searchMode`（默认值：`search`；还支持
  `vsearch` 和 `query`）。`search` 仅使用 BM25，因此在该模式下，
  OpenClaw 会跳过语义向量就绪探测和嵌入维护。如果某个模式失败，
  OpenClaw 会使用 `qmd query` 重试。
- 当 `searchMode` 为 `query` 时，将 `memory.qmd.rerank` 设置为
  `false`，即可使用不带重排序器的 QMD 混合查询路径（需要 QMD 2.1
  或更高版本）。OpenClaw 会向直接 QMD CLI 路径传递
  `--no-rerank`，并向 QMD 的 MCP 查询工具传递 `rerank: false`。
- 对于声明支持多集合筛选器的 QMD 版本，OpenClaw 会将来源相同的集合
  合并到一次 QMD 搜索调用中。旧版 QMD 会继续使用兼容的逐集合回退路径。
- 如果 QMD 完全失败，OpenClaw 会回退到内置 SQLite 引擎。
  打开失败后，重复的聊天轮次尝试会短暂退避，避免因缺少二进制文件或损坏的边车依赖项
  而造成重试风暴；`openclaw memory status` 和一次性 CLI 探测仍会直接重新检查 QMD。

<Info>
首次搜索可能较慢——第一次运行 `qmd query` 时，QMD 会自动下载用于重排序和查询扩展的
GGUF 模型（约 2 GB）。
</Info>

## 搜索性能和兼容性

OpenClaw 会保持 QMD 搜索路径同时兼容当前和旧版 QMD 安装。

启动时，OpenClaw 会为每个管理器检查一次已安装 QMD 的帮助文本。
如果二进制文件声明支持多个集合筛选器，OpenClaw 会使用一条命令搜索所有来源相同的集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

这样可避免为每个持久记忆集合启动一个 QMD 子进程。
会话转录集合会保留在各自的来源组中，因此混合的
`memory` + `sessions` 搜索仍会向结果多样化器提供来自两个来源的输入。

旧版 QMD 构建仅接受一个集合筛选器。当 OpenClaw 检测到此类构建时，
它会保留兼容路径，分别搜索每个集合，然后合并结果并进行去重。

要手动检查已安装版本的契约，请运行：

```bash
qmd --help | grep -i collection
```

当前 QMD 的帮助文本会提到以一个或多个集合为目标。旧版帮助文本通常只描述单个集合。

## 模型覆盖

QMD 模型环境变量会从 Gateway 网关进程原样传递，因此你可以在不添加新 OpenClaw 配置的情况下全局调整 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，使索引与新的向量空间匹配。

## 为额外路径建立索引

让 QMD 指向其他目录，使其内容可供搜索：

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

额外路径中的片段会以 `qmd/<collection>/<relative-path>` 的形式出现在搜索结果中。
`memory_get` 能识别此前缀，并从正确的集合根目录读取内容。

## 为会话转录建立索引

启用会话索引以回忆之前的对话。QMD 同时需要通用的 `memorySearch`
会话来源和 QMD 转录导出器：

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

转录会以经过清理的用户/助手轮次形式导出到
`~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中。
仅设置 `memorySearch.experimental.sessionMemory` 不会将转录导出到 QMD。

会话命中结果仍会由
[`tools.sessions.visibility`](/zh-CN/gateway/config-tools#toolssessions) 进行筛选。
默认的 `tree` 可见性不会公开同一智能体中不相关的会话。
如果希望从单独的私信会话中回忆由 Gateway 网关分派的会话，
请有意设置 `tools.sessions.visibility: "agent"`。

## 搜索范围

默认情况下，QMD 搜索结果只会显示在直接会话中（不会显示在群组或渠道聊天中）。
配置 `memory.qmd.scope` 可更改此行为：

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

以上代码片段就是实际的默认规则。当范围规则拒绝搜索时，
OpenClaw 会记录一条警告，其中包含推导出的渠道和聊天类型，以便更轻松地调试空结果。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段末尾会附加
`Source: <path>#L<line>`（或 `#L<start>-L<end>`）页脚。在 `auto`
模式下，仅会为直接聊天会话添加该页脚。将
`memory.citations = "off"` 设置为关闭可省略该页脚，同时仍在内部将路径传递给智能体。

## 适用场景

在需要以下功能时选择 QMD：

- 通过重排序获得更高质量的结果。
- 搜索工作区之外的项目文档或笔记。
- 回忆过去的会话对话。
- 无需 API 密钥的完全本地搜索。

对于较简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 无需额外依赖项即可良好运行。

## 故障排查

**找不到 QMD？** 确保二进制文件位于 Gateway 网关的 `PATH` 中。
如果 OpenClaw 作为服务运行，请创建符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在你的 shell 中正常工作，但 OpenClaw 仍报告
`spawn qmd ENOENT`，则 Gateway 网关进程的 `PATH` 很可能与你的交互式 shell 不同。
请显式指定二进制文件：

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

**首次搜索非常慢？** QMD 会在首次使用时下载 GGUF 模型。
请使用与 OpenClaw 相同的 XDG 目录运行 `qmd query "test"` 进行预热。

**搜索期间出现许多 QMD 子进程？** 如果可能，请更新 QMD。
仅当已安装的 QMD 声明支持多个 `-c` 筛选器时，OpenClaw 才会为来源相同的多集合搜索使用单个进程；
否则，为确保正确性，它会保留旧版的逐集合回退路径。

**仅使用 BM25 的 QMD 仍在尝试构建 llama.cpp？** 设置
`memory.qmd.searchMode = "search"`。OpenClaw 会将该模式视为仅词法搜索，
跳过 QMD 向量状态探测和嵌入维护，并将语义就绪检查留给 `vsearch` 或 `query` 设置。

**搜索超时？** 增大 `memory.qmd.limits.timeoutMs`（默认值：
4000ms）。对于速度较慢的硬件，请将其设置得更高，例如 `120000`。

**群组或渠道聊天中的结果为空？** 这是默认
`memory.qmd.scope` 的预期行为，因为它仅允许直接会话。
如果希望在这些位置显示 QMD 结果，请为 `group` 或 `channel`
聊天类型添加一条 `allow` 规则。

**根记忆搜索突然变得过于宽泛？** 重启 Gateway 网关，或等待下一次启动协调。
当 OpenClaw 检测到同名冲突时，会将过时的托管集合重新创建为规范的
`MEMORY.md` 和 `memory/` 模式。

**工作区中可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？**
QMD 遍历遵循底层 QMD 扫描器，而不是 OpenClaw 的内置符号链接规则。
在 QMD 提供循环安全遍历或显式排除控制之前，请将临时单体仓库检出目录放在
`.tmp/` 等隐藏目录下，或放在已建立索引的 QMD 根目录之外。

## 配置

有关完整配置范围（`memory.qmd.*`）、搜索模式、更新间隔、
范围规则和所有其他选项，请参阅
[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [内置记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)

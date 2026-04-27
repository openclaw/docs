---
read_when:
    - 你想将 QMD 设置为你的内存后端
    - 你想要高级内存功能，例如重排序或额外的索引路径
summary: 本地优先搜索边车，支持 BM25、向量、重排序和查询扩展
title: QMD 内存引擎
x-i18n:
    generated_at: "2026-04-27T13:13:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f19cfee3cd94ee0bfff97f2758e788790ade628f89ecdf99bf954e2894a2e7e8
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索边车，与 OpenClaw 一起运行。它将 BM25、向量搜索和重排序整合到单个二进制文件中，还可以索引超出你工作区内存文件范围的内容。

## 相比内置功能，它增加了什么

- **重排序和查询扩展**，以获得更好的召回效果。
- **索引额外目录** —— 项目文档、团队笔记、磁盘上的任何内容。
- **索引会话转录** —— 回忆更早的对话。
- **完全本地化** —— 配合可选的 `node-llama-cpp` 运行时包运行，并自动下载 GGUF 模型。
- **自动回退** —— 如果 QMD 不可用，OpenClaw 会无缝回退到内置引擎。

## 入门指南

### 前提条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允许扩展的 SQLite 构建版本（在 macOS 上使用 `brew install sqlite`）。
- QMD 必须位于 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 开箱即用。Windows 最佳支持方式是通过 WSL2。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个独立自包含的 QMD 主目录，并自动管理边车生命周期 —— 集合、更新和嵌入运行都会为你处理。它会优先使用当前的 QMD 集合和 MCP 查询形状，但在需要时仍会回退到旧版的 `--mask` 集合标志和更早的 MCP 工具名称。启动时的协调过程还会在检测到存在同名旧版 QMD 集合时，将过时的托管集合重新创建为其规范模式。

## 边车如何工作

- OpenClaw 会根据你的工作区内存文件以及所有已配置的 `memory.qmd.paths` 创建集合，然后在启动时和周期性地运行 `qmd update`（默认每 5 分钟一次）。语义模式还会运行 `qmd embed`。
- 默认工作区集合会跟踪 `MEMORY.md` 以及 `memory/` 目录树。小写的 `memory.md` 不会作为根内存文件被索引。
- 启动刷新会在后台运行，因此不会阻塞聊天启动。
- 搜索会使用已配置的 `searchMode`（默认值：`search`；也支持 `vsearch` 和 `query`）。`search` 仅使用 BM25，因此 OpenClaw 会在该模式下跳过语义向量就绪探测和嵌入维护。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 如果 QMD 完全失败，OpenClaw 会回退到内置的 SQLite 引擎。

<Info>
第一次搜索可能会较慢 —— QMD 会在第一次运行 `qmd query` 时自动下载用于重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 模型覆盖

QMD 模型环境变量会从 Gateway 网关进程中原样透传，因此你可以在不添加新的 OpenClaw 配置的情况下全局调优 QMD：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，以便索引与新的向量空间匹配。

## 索引额外路径

让 QMD 指向其他目录，使其内容可被搜索：

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

来自额外路径的片段会在搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 能识别此前缀，并从正确的集合根目录读取内容。

## 索引会话转录

启用会话索引以回忆更早的对话：

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

转录会以经过清理的用户/助手轮次形式导出到专用的 QMD 集合中，位置在 `~/.openclaw/agents/<id>/qmd/sessions/`。

## 搜索范围

默认情况下，QMD 搜索结果会在私信和渠道会话中显示（不包括群组）。配置 `memory.qmd.scope` 可更改此行为：

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

当范围规则拒绝某次搜索时，OpenClaw 会记录一条警告，其中包含推导出的渠道和聊天类型，以便更容易调试空结果。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含一个 `Source: <path#line>` 页脚。将 `memory.citations = "off"` 可省略该页脚，同时仍会在内部将路径传递给智能体。

## 何时使用

当你需要以下能力时，请选择 QMD：

- 用重排序获得更高质量的结果。
- 搜索工作区之外的项目文档或笔记。
- 回忆过去的会话对话。
- 完全本地搜索，无需 API 密钥。

对于更简单的设置，[内置引擎](/zh-CN/concepts/memory-builtin) 在不需要额外依赖的情况下也能很好地工作。

## 故障排除

**找不到 QMD？** 请确保该二进制文件位于 Gateway 网关的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建一个符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**第一次搜索很慢？** QMD 会在首次使用时下载 GGUF 模型。可使用与 OpenClaw 相同的 XDG 目录运行 `qmd query "test"` 进行预热。

**仅 BM25 的 QMD 仍在尝试构建 llama.cpp？** 请设置
`memory.qmd.searchMode = "search"`。OpenClaw 会将该模式视为纯词法模式，不会运行 QMD 向量状态探测或嵌入维护，并将语义就绪检查留给 `vsearch` 或 `query` 配置。

**搜索超时？** 增大 `memory.qmd.limits.timeoutMs`（默认值：4000ms）。
对于较慢的硬件，可设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope` —— 默认情况下仅允许私信和渠道会话。

**根内存搜索突然变得过于宽泛？** 重启 Gateway 网关或等待下次启动协调。检测到同名冲突时，OpenClaw 会将过时的托管集合重新创建为规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区中可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？**
QMD 遍历当前遵循底层 QMD 扫描器的行为，而不是 OpenClaw 内置的符号链接规则。在 QMD 提供安全处理循环遍历或显式排除控制之前，请将临时 monorepo 检出保存在诸如 `.tmp/` 之类的隐藏目录下，或放在已索引 QMD 根目录之外。

## 配置

有关完整配置项（`memory.qmd.*`）、搜索模式、更新间隔、范围规则以及所有其他可调项，请参阅
[内存配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [内存概览](/zh-CN/concepts/memory)
- [内置内存引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 内存](/zh-CN/concepts/memory-honcho)

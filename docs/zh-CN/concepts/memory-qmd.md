---
read_when:
    - 你想将 QMD 设置为你的记忆后端
    - 你想要高级记忆功能，例如重排序或额外的索引路径
summary: 本地优先的搜索 sidecar，支持 BM25、向量、重排序和查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-04-27T13:49:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1995a2b087c484595b0e0efed7a4ae3987b8fb3ac95e3c41bdf5335ba6240e73
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索 sidecar，与 OpenClaw 并行运行。它将 BM25、向量搜索和重排序整合到一个二进制程序中，并且可以为你的工作区记忆文件之外的内容建立索引。

## 相比 builtin 它增加了什么

- **重排序和查询扩展**，以获得更好的召回效果。
- **为额外目录建立索引** —— 项目文档、团队笔记、磁盘上的任何内容。
- **为会话转录建立索引** —— 回忆更早的对话。
- **完全本地运行** —— 配合可选的 `node-llama-cpp` 运行时包运行，并自动下载 GGUF 模型。
- **自动回退** —— 如果 QMD 不可用，OpenClaw 会无缝回退到 builtin 引擎。

## 入门指南

### 前提条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 支持扩展的 SQLite 构建版本（在 macOS 上可使用 `brew install sqlite`）。
- QMD 必须在 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 开箱即用。Windows 最佳支持方式是通过 WSL2。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，并自动管理 sidecar 生命周期 —— 集合、更新和嵌入运行都会由它处理。它会优先使用当前的 QMD collection 和 MCP 查询格式，但在需要时仍会回退到备用的 collection pattern 标志和较旧的 MCP 工具名称。启动时的协调过程还会在检测到存在同名旧版 QMD collection 时，将过期的受管集合重新创建为其规范模式。

## sidecar 的工作方式

- OpenClaw 会根据你的工作区记忆文件以及任何已配置的 `memory.qmd.paths` 创建集合，然后在启动时和周期性地运行 `qmd update`（默认每 5 分钟一次）。语义模式还会运行 `qmd embed`。
- 默认工作区集合会跟踪 `MEMORY.md` 以及 `memory/` 目录树。小写的 `memory.md` 不会作为根记忆文件建立索引。
- 启动刷新会在后台运行，因此不会阻塞聊天启动。
- 搜索会使用已配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。`search` 仅使用 BM25，因此 OpenClaw 会在该模式下跳过语义向量就绪探测和嵌入维护。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 对于声明支持多 collection 过滤器的 QMD 版本，OpenClaw 会将同源集合分组，在一次 QMD 搜索调用中完成搜索。较旧的 QMD 版本则保留兼容的逐 collection 回退路径。
- 如果 QMD 完全失败，OpenClaw 会回退到 builtin SQLite 引擎。

<Info>
第一次搜索可能较慢 —— QMD 会在第一次运行 `qmd query` 时自动下载用于重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

## 搜索性能与兼容性

OpenClaw 会让 QMD 搜索路径同时兼容当前版和旧版 QMD 安装。

在启动时，OpenClaw 会为每个管理器检查一次已安装的 QMD 帮助文本。如果该二进制程序声明支持多个 collection 过滤器，OpenClaw 就会用一条命令搜索所有同源集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

这样可以避免为每个持久记忆 collection 启动一个 QMD 子进程。会话转录集合仍保留在它们自己的源分组中，因此混合的 `memory` + `sessions` 搜索仍然能从两个来源获得结果多样化输入。

较旧的 QMD 构建版本只接受一个 collection 过滤器。当 OpenClaw 检测到这类构建时，它会保留兼容路径，分别搜索每个 collection，然后再合并并去重结果。

要手动检查已安装的契约，请运行：

```bash
qmd --help | grep -i collection
```

当前的 QMD 帮助文本说明 collection 过滤器可以针对一个或多个集合。旧版帮助通常只描述单个 collection。

## 模型覆盖

QMD 模型环境变量会从 Gateway 网关进程原样透传，因此你可以全局调整 QMD，而无需添加新的 OpenClaw 配置：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，请重新运行嵌入，以便索引与新的向量空间匹配。

## 为额外路径建立索引

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

来自额外路径的片段会在搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 能识别这个前缀，并从正确的 collection 根目录读取内容。

## 为会话转录建立索引

启用会话索引，以便回忆更早的对话：

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

转录内容会以净化后的 User/Assistant 轮次导出到专用的 QMD collection 中，路径为 `~/.openclaw/agents/<id>/qmd/sessions/`。

## 搜索范围

默认情况下，QMD 搜索结果会显示在私信和渠道会话中（不包括群组）。可通过配置 `memory.qmd.scope` 来更改：

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

当 scope 拒绝搜索时，OpenClaw 会记录一条警告日志，其中包含推导出的渠道和聊天类型，以便更容易调试空结果问题。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含 `Source: <path#line>` 页脚。将 `memory.citations = "off"` 可省略该页脚，同时仍会在内部将路径传递给智能体。

## 何时使用

当你需要以下能力时，请选择 QMD：

- 通过重排序获得更高质量的结果。
- 搜索工作区之外的项目文档或笔记。
- 回忆过往会话对话。
- 完全本地搜索，无需 API 密钥。

对于更简单的设置，[builtin 引擎](/zh-CN/concepts/memory-builtin) 在无需额外依赖的情况下也能很好地工作。

## 故障排除

**找不到 QMD？** 请确保该二进制程序位于 Gateway 网关的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建一个符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在你的 shell 中可以正常运行，但 OpenClaw 仍然报告 `spawn qmd ENOENT`，则 Gateway 网关进程很可能使用了与你的交互式 shell 不同的 `PATH`。请显式固定该二进制路径：

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

在安装了 QMD 的环境中使用 `command -v qmd`，然后再通过 `openclaw memory status --deep` 重新检查。

**第一次搜索很慢？** QMD 会在首次使用时下载 GGUF 模型。可使用与 OpenClaw 相同的 XDG 目录，通过 `qmd query "test"` 进行预热。

**搜索期间出现很多 QMD 子进程？** 如果可能，请升级 QMD。只有当已安装的 QMD 声明支持多个 `-c` 过滤器时，OpenClaw 才会对同源多 collection 搜索使用单个进程；否则，为了保证正确性，它会保留较旧的逐 collection 回退路径。

**仅 BM25 的 QMD 仍在尝试构建 llama.cpp？** 设置 `memory.qmd.searchMode = "search"`。OpenClaw 会将该模式视为纯词法搜索，不会运行 QMD 向量状态探测或嵌入维护，并将语义就绪检查留给 `vsearch` 或 `query` 配置。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。对于较慢的硬件，可设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope` —— 默认仅允许私信和渠道会话。

**根记忆搜索突然变得过宽？** 重启 Gateway 网关，或等待下一次启动协调。OpenClaw 在检测到同名冲突时，会将过期的受管集合重新创建为规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？** QMD 遍历当前遵循底层 QMD 扫描器的行为，而不是 OpenClaw builtin 的符号链接规则。在 QMD 暴露出防循环遍历或显式排除控制之前，请将临时 monorepo 检出保存在 `.tmp/` 之类的隐藏目录下，或放在已索引 QMD 根目录之外。

## 配置

有关完整的配置项（`memory.qmd.*`）、搜索模式、更新间隔、范围规则以及所有其他可调项，请参见
[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [Builtin 记忆引擎](/zh-CN/concepts/memory-builtin)
- [Honcho 记忆](/zh-CN/concepts/memory-honcho)

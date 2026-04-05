---
read_when:
    - 你想将 QMD 设置为你的记忆后端
    - 你想使用重排序或额外索引路径等高级记忆功能
summary: 本地优先的搜索 sidecar，支持 BM25、向量、重排序和查询扩展
title: QMD 记忆引擎
x-i18n:
    generated_at: "2026-04-05T08:21:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa8a31ec1a6cc83b6ab413b7dbed6a88055629251664119bfd84308ed166c58e
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD 记忆引擎

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索 sidecar，与
OpenClaw 一起运行。它将 BM25、向量搜索和重排序组合到单个
二进制文件中，并且可以为工作区记忆文件之外的内容建立索引。

## 相比内置引擎新增的能力

- **重排序和查询扩展**，带来更好的召回效果。
- **为额外目录建立索引** —— 项目文档、团队笔记、磁盘上的任何内容。
- **为会话转录建立索引** —— 回忆更早的对话。
- **完全本地** —— 通过 Bun + node-llama-cpp 运行，自动下载 GGUF 模型。
- **自动回退** —— 如果 QMD 不可用，OpenClaw 会无缝回退到
  内置引擎。

## 入门指南

### 前置条件

- 安装 QMD：`bun install -g @tobilu/qmd`
- 允许扩展的 SQLite 构建版本（macOS 上可使用 `brew install sqlite`）。
- QMD 必须在 Gateway 网关的 `PATH` 中。
- macOS 和 Linux 可开箱即用。Windows 最佳支持方式是通过 WSL2。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 会在
`~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，并自动管理 sidecar 生命周期
—— collection、更新和嵌入运行都由系统替你处理。

## sidecar 的工作方式

- OpenClaw 会根据你的工作区记忆文件和所有已配置的
  `memory.qmd.paths` 创建 collection，然后在启动时运行 `qmd update` + `qmd embed`
  并定期运行（默认每 5 分钟一次）。
- 启动刷新会在后台运行，因此不会阻塞聊天启动。
- 搜索会使用已配置的 `searchMode`（默认：`search`；也支持
  `vsearch` 和 `query`）。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 如果 QMD 完全失败，OpenClaw 会回退到内置 SQLite 引擎。

<Info>
首次搜索可能较慢 —— QMD 会在第一次运行 `qmd query` 时自动下载用于
重排序和查询扩展的 GGUF 模型（约 2 GB）。
</Info>

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

来自额外路径的片段会在
搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 能识别此前缀，并从正确的
collection 根目录读取。

## 为会话转录建立索引

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

转录会以净化后的 User/Assistant 轮次形式导出到专用的 QMD
collection 中，路径位于 `~/.openclaw/agents/<id>/qmd/sessions/`。

## 搜索范围

默认情况下，QMD 搜索结果只会在私信会话中显示（不会在群组或
渠道中显示）。可通过配置 `memory.qmd.scope` 进行更改：

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

当范围规则拒绝搜索时，OpenClaw 会记录一条警告日志，其中包含推导出的渠道和
聊天类型，这样更容易调试空结果问题。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段会包含
`Source: <path#line>` 页脚。将 `memory.citations = "off"` 设为关闭后，
仍会在内部将路径传递给智能体，只是不再显示页脚。

## 何时使用

当你需要以下能力时，请选择 QMD：

- 使用重排序以获得更高质量的结果。
- 搜索工作区之外的项目文档或笔记。
- 回忆过去的会话对话。
- 无需 API 密钥的完全本地搜索。

对于更简单的设置，[内置引擎](/concepts/memory-builtin) 也能很好地工作，
且无需额外依赖。

## 故障排除

**找不到 QMD？** 请确保该二进制文件位于 Gateway 网关的 `PATH` 中。如果 OpenClaw
作为服务运行，请创建一个符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**首次搜索很慢？** QMD 会在首次使用时下载 GGUF 模型。可以使用与 OpenClaw 相同的 XDG 目录运行
`qmd query "test"` 进行预热。

**搜索超时？** 请增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。
对于较慢的硬件，可设置为 `120000`。

**群聊中结果为空？** 请检查 `memory.qmd.scope` —— 默认只
允许私信会话。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？**
QMD 遍历当前遵循底层 QMD 扫描器的行为，而不是
OpenClaw 内置的符号链接规则。请将临时 monorepo 检出保存在
`.tmp/` 这类隐藏目录下，或放在已建立索引的 QMD 根目录之外，直到 QMD 提供
循环安全遍历或显式排除控制。

## 配置

有关完整配置项（`memory.qmd.*`）、搜索模式、更新间隔、
范围规则和其他所有调节项，请参见
[记忆配置参考](/reference/memory-config)。

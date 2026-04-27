---
read_when:
    - 你想安装一个与 Codex、Claude 或 Cursor 兼容的套件
    - 你需要了解 OpenClaw 如何将套件内容映射到原生功能
    - 你正在调试套件检测或缺失的功能
summary: 将 Codex、Claude 和 Cursor 套件作为 OpenClaw 插件进行安装和使用
title: 插件套件
x-i18n:
    generated_at: "2026-04-27T12:54:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d8dcd6eae5e740c27429454a7396332f1bd3b16c0a4e939321d047b5e2e4ff7
    source_path: plugins/bundles.md
    workflow: 15
---

OpenClaw 可以从三个外部生态安装插件：**Codex**、**Claude** 和 **Cursor**。这些被称为**套件**——内容和元数据包，OpenClaw 会将其映射为原生功能，例如 Skills、钩子和 MCP 工具。

<Info>
  套件**不**等同于原生 OpenClaw 插件。原生插件在进程内运行，并且可以注册任意能力。套件是内容包，只进行选择性的功能映射，并且信任边界更窄。
</Info>

## 为什么有套件

许多有用的插件是以 Codex、Claude 或 Cursor 格式发布的。OpenClaw 不要求作者将它们重写为原生 OpenClaw 插件，而是检测这些格式并将其支持的内容映射到原生功能集中。这意味着你可以安装一个 Claude 命令包或 Codex Skills 套件，并立即使用它。

## 安装一个套件

<Steps>
  <Step title="从目录、归档文件或市场安装">
    ```bash
    # 本地目录
    openclaw plugins install ./my-bundle

    # 归档文件
    openclaw plugins install ./my-bundle.tgz

    # Claude 市场
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="验证检测">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    套件会显示为 `Format: bundle`，其子类型为 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    已映射的功能（Skills、钩子、MCP 工具、LSP 默认值）会在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 从套件中映射什么

目前并不是每项套件功能都能在 OpenClaw 中运行。以下是当前可用的功能，以及已检测但尚未接入的功能。

### 当前支持

| 功能 | 映射方式 | 适用范围 |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skills 内容 | 套件 Skills 根目录会作为普通 OpenClaw Skills 加载 | 所有格式 |
| 命令 | `commands/` 和 `.cursor/commands/` 会被视为 Skills 根目录 | Claude、Cursor |
| 钩子包 | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局 | Codex |
| MCP 工具 | 套件 MCP 配置会合并到嵌入式 Pi 设置中；支持的 stdio 和 HTTP 服务器会被加载 | 所有格式 |
| LSP 服务器 | Claude `.lsp.json` 和 manifest 声明的 `lspServers` 会合并到嵌入式 Pi LSP 默认值中 | Claude |
| 设置 | Claude `settings.json` 会作为嵌入式 Pi 默认值导入 | Claude |

#### Skills 内容

- 套件 Skills 根目录会作为普通 OpenClaw Skills 根目录加载
- Claude `commands` 根目录会被视为额外的 Skills 根目录
- Cursor `.cursor/commands` 根目录会被视为额外的 Skills 根目录

这意味着 Claude Markdown 命令文件可以通过正常的 OpenClaw Skills 加载器工作。Cursor 命令 Markdown 也通过同一路径工作。

#### 钩子包

- 只有当套件钩子根目录使用普通 OpenClaw 钩子包布局时，才会生效。当前这主要是 Codex 兼容场景：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### 用于 Pi 的 MCP

- 已启用的套件可以提供 MCP 服务器配置
- OpenClaw 会将套件 MCP 配置合并到生效的嵌入式 Pi 设置中，作为 `mcpServers`
- OpenClaw 会在嵌入式 Pi 智能体轮次期间，通过启动 stdio 服务器或连接到 HTTP 服务器，公开受支持的套件 MCP 工具
- `coding` 和 `messaging` 工具配置默认包含套件 MCP 工具；使用 `tools.deny: ["bundle-mcp"]` 可为某个智能体或 Gateway 网关选择退出
- 项目本地 Pi 设置仍会在套件默认值之后应用，因此工作区设置可在需要时覆盖套件 MCP 条目
- 套件 MCP 工具目录会在注册前进行确定性排序，因此上游 `listTools()` 顺序变化不会导致 prompt-cache 工具块抖动

##### 传输协议

MCP 服务器可以使用 stdio 或 HTTP 传输协议：

**Stdio** 会启动子进程：

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** 默认通过 `sse` 连接到正在运行的 MCP 服务器；在请求时也可使用 `streamable-http`：

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport` 可以设置为 `"streamable-http"` 或 `"sse"`；省略时，OpenClaw 使用 `sse`
- `type: "http"` 是下游 CLI 原生格式；在 OpenClaw 配置中应使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 会规范化这个常见别名。
- 仅允许 `http:` 和 `https:` URL scheme
- `headers` 值支持 `${ENV_VAR}` 插值
- 同时包含 `command` 和 `url` 的服务器条目会被拒绝
- URL 凭证（userinfo 和查询参数）会从工具说明和日志中脱敏
- `connectionTimeoutMs` 会覆盖 stdio 和 HTTP 传输协议默认的 30 秒连接超时

##### 工具命名

OpenClaw 会使用 provider 安全名称为套件 MCP 工具注册，格式为 `serverName__toolName`。例如，键为 `"vigil-harbor"` 且暴露 `memory_search` 工具的服务器，会被注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会被替换为 `-`
- 服务器前缀最长为 30 个字符
- 完整工具名最长为 64 个字符
- 空服务器名称会回退为 `mcp`
- 发生清洗后名称冲突时，会使用数字后缀消歧
- 最终暴露的工具顺序按安全名称确定排序，以保持重复 Pi 轮次的缓存稳定
- 配置过滤会将来自同一个套件 MCP 服务器的所有工具视为由 `bundle-mcp` 插件拥有，因此配置允许列表和拒绝列表可以包含单个暴露工具名称，也可以包含 `bundle-mcp` 插件键

#### 嵌入式 Pi 设置

- 当套件启用时，Claude `settings.json` 会作为默认嵌入式 Pi 设置导入
- OpenClaw 会在应用前清洗 shell 覆盖键

已清洗的键：

- `shellPath`
- `shellCommandPrefix`

#### 嵌入式 Pi LSP

- 已启用的 Claude 套件可以提供 LSP 服务器配置
- OpenClaw 会加载 `.lsp.json` 以及 manifest 中声明的任意 `lspServers` 路径
- 套件 LSP 配置会合并到生效的嵌入式 Pi LSP 默认值中
- 当前仅支持运行基于 stdio 的 LSP 服务器；不支持的传输协议仍会显示在 `openclaw plugins inspect <id>` 中

### 已检测但不执行

这些内容会被识别并显示在诊断中，但 OpenClaw 不会运行它们：

- Claude `agents`、`hooks.json` 自动化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 内联/应用元数据中超出能力报告范围的内容

## 套件格式

<AccordionGroup>
  <Accordion title="Codex 套件">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    当 Codex 套件使用 Skills 根目录和 OpenClaw 风格钩子包目录（`HOOK.md` + `handler.ts`）时，最适合 OpenClaw。

  </Accordion>

  <Accordion title="Claude 套件">
    两种检测模式：

    - **基于 Manifest：** `.claude-plugin/plugin.json`
    - **无 Manifest：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特有行为：

    - `commands/` 会被视为 Skills 内容
    - `settings.json` 会导入到嵌入式 Pi 设置中（shell 覆盖键会被清洗）
    - `.mcp.json` 会向嵌入式 Pi 暴露受支持的 stdio 工具
    - `.lsp.json` 加上 manifest 声明的 `lspServers` 路径会加载到嵌入式 Pi LSP 默认值中
    - `hooks/hooks.json` 会被检测，但不会执行
    - manifest 中的自定义组件路径是增量添加的（扩展默认值，而不是替换默认值）

  </Accordion>

  <Accordion title="Cursor 套件">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 会被视为 Skills 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅检测，不执行

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 会先检查原生插件格式：

1. `openclaw.plugin.json` 或包含 `openclaw.extensions` 的有效 `package.json` —— 视为**原生插件**
2. 套件标记（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）—— 视为**套件**

如果一个目录同时包含两者，OpenClaw 会使用原生路径。这样可以防止双格式包被部分安装为套件。

## 运行时依赖和清理

- 打包插件的运行时依赖会作为 OpenClaw 包的一部分发布在 `dist/*` 下。OpenClaw **不会**在启动时为打包插件运行 `npm install`；发布流水线负责提供完整的打包依赖载荷（参见[发布]((/reference/RELEASING))中的 postpublish 验证规则）。

## 安全

与原生插件相比，套件的信任边界更窄：

- OpenClaw **不会**在进程内加载任意套件运行时模块
- Skills 和钩子包路径必须保留在插件根目录内（边界检查）
- 设置文件会使用相同的边界检查来读取
- 支持的 stdio MCP 服务器可以作为子进程启动

这使得套件在默认情况下更安全，但对于它们暴露的那些功能，你仍应将第三方套件视为受信任内容。

## 故障排除

<AccordionGroup>
  <Accordion title="套件已检测到，但功能未运行">
    运行 `openclaw plugins inspect <id>`。如果某项能力已列出但标记为未接线，那是产品限制——不是安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件未显示">
    确保套件已启用，并且 Markdown 文件位于已检测到的 `commands/` 或 `skills/` 根目录中。
  </Accordion>

  <Accordion title="Claude 设置未生效">
    仅支持来自 `settings.json` 的嵌入式 Pi 设置。OpenClaw 不会将套件设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude 钩子未执行">
    `hooks/hooks.json` 仅检测，不执行。如果你需要可运行的钩子，请使用 OpenClaw 钩子包布局，或发布一个原生插件。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装和配置插件](/zh-CN/tools/plugin)
- [构建插件](/zh-CN/plugins/building-plugins) — 创建原生插件
- [插件 Manifest](/zh-CN/plugins/manifest) — 原生 Manifest 模式

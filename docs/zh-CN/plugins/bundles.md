---
read_when:
    - 你想安装兼容 Codex、Claude 或 Cursor 的软件包
    - 你需要了解 OpenClaw 如何将捆绑包内容映射为原生功能
    - 你正在调试捆绑包检测或能力缺失问题
summary: 将 Codex、Claude 和 Cursor 软件包作为 OpenClaw 插件安装和使用
title: 插件包
x-i18n:
    generated_at: "2026-07-11T20:42:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以安装来自三个外部生态系统的插件：**Codex**、**Claude**
和 **Cursor**。这些插件称为**套件**，即内容与元数据包，
OpenClaw 会将它们映射为技能、钩子和 MCP 工具等原生功能。

<Info>
  套件与原生 OpenClaw 插件**不同**。原生插件在进程内运行，
  可以注册任何能力。套件是内容包，仅选择性映射部分功能，
  信任边界也更窄。
</Info>

## 为什么需要套件

许多实用插件以 Codex、Claude 或 Cursor 格式发布。OpenClaw
不要求作者将其重写为原生 OpenClaw 插件，而是检测这些格式，
并将其中受支持的内容映射到原生功能集。你可以安装 Claude 命令包
或 Codex 技能套件并立即使用。

## 安装套件

<Steps>
  <Step title="从目录、归档文件或市场安装">
    ```bash
    # 本地目录
    openclaw plugins install ./my-bundle

    # 归档文件
    openclaw plugins install ./my-bundle.tgz

    # Claude 市场
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` 是本地市场路径/仓库或 git/GitHub 来源。

  </Step>

  <Step title="验证检测结果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    套件会显示 `Format: bundle`，并在 `Bundle format:` 中显示
    `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    映射后的功能（技能、钩子、MCP 工具、LSP 默认配置）将在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 从套件映射哪些内容

目前并非所有套件功能都能在 OpenClaw 中运行。以下列出了已经可用的功能，
以及已被检测但尚未接入的功能。

### 当前支持

| 功能          | 映射方式                                                                                              | 适用格式       |
| ------------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| 技能内容      | 套件技能根目录作为普通 OpenClaw 技能加载                                                              | 所有格式       |
| 命令          | 将 `commands/` 和 `.cursor/commands/` 视为技能根目录                                                  | Claude、Cursor |
| 钩子包        | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局                                                         | Codex          |
| MCP 工具      | 将套件 MCP 配置合并到嵌入式 OpenClaw 设置中；加载受支持的 stdio 和 HTTP 服务器                         | 所有格式       |
| LSP 服务器    | 将 Claude `.lsp.json` 和清单中声明的 `lspServers` 合并到嵌入式 OpenClaw LSP 默认配置中                 | Claude         |
| 设置          | 将 Claude `settings.json` 作为嵌入式 OpenClaw 默认配置导入                                            | Claude         |

#### 技能内容

- 套件技能根目录作为普通 OpenClaw 技能根目录加载。
- Claude `commands/` 根目录被视为额外的技能根目录。
- Cursor `.cursor/commands/` 根目录被视为额外的技能根目录。

Claude Markdown 命令文件和 Cursor 命令 Markdown 文件都通过
普通的 OpenClaw 技能加载器工作。

#### 钩子包

只有使用普通 OpenClaw 钩子包布局时，套件钩子根目录才会工作：
`HOOK.md` 加 `handler.ts` 或 `handler.js`。目前，这主要适用于
与 Codex 兼容的情况。

#### 嵌入式 OpenClaw 的 MCP

- 已启用的套件可以提供 MCP 服务器配置。
- OpenClaw 将套件 MCP 配置作为 `mcpServers` 合并到最终生效的
  嵌入式 OpenClaw 设置中。
- 在嵌入式 OpenClaw 智能体轮次中，OpenClaw 会启动 stdio 服务器
  或连接 HTTP 服务器，从而公开受支持的套件 MCP 工具。
- `coding` 和 `messaging` 工具配置文件默认包含套件 MCP 工具；
  若要为智能体或 Gateway 网关禁用它们，请使用 `tools.deny: ["bundle-mcp"]`。
- 项目本地的嵌入式智能体设置仍会在套件默认配置之后应用，因此需要时，
  工作区设置可以覆盖套件 MCP 条目。
- 套件 MCP 工具目录会在注册前进行确定性排序，因此上游 `listTools()`
  顺序变化不会导致提示词缓存中的工具块频繁变动。

##### 传输方式

MCP 服务器可以使用 stdio 或 HTTP 传输。

**Stdio** 会启动一个子进程：

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

**HTTP** 会连接正在运行的 MCP 服务器；除非请求使用
`streamable-http`，否则默认为 `sse`：

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

- `transport` 接受 `"streamable-http"` 或 `"sse"`；省略时默认为 `sse`。
- `type: "http"` 是 CLI 原生的下游结构；在 OpenClaw 配置中使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 会规范化这个常见别名。
- 仅允许使用 `http:` 和 `https:` URL 协议。
- `headers` 值支持 `${ENV_VAR}` 插值。
- 同时包含 `command` 和 `url` 的服务器条目会被拒绝。
- URL 凭据（用户信息和查询参数）会从工具描述和日志中隐去。
- `connectionTimeoutMs` 会覆盖 stdio 和 HTTP 传输方式默认的 30 秒连接超时。
  请求超时默认为 60 秒，可通过 `requestTimeoutMs` 覆盖。

##### 工具命名

OpenClaw 使用提供商安全的名称注册套件 MCP 工具，格式为
`serverName__toolName`。例如，键名为 `"vigil-harbor"` 的服务器公开
`memory_search` 工具时，注册名称为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会替换为 `-`。
- 如果片段以非字母开头，则会添加字母前缀，因此像 `12306`
  这样的纯数字服务器键名会转换为提供商安全的工具前缀。
- 服务器前缀最多为 30 个字符。
- 完整工具名称最多为 64 个字符。
- 空服务器名称回退为 `mcp`。
- 清理后发生冲突的名称会通过数字后缀加以区分。
- 最终公开的工具会按安全名称进行确定性排序，使重复的嵌入式智能体轮次
  保持缓存稳定。
- 配置文件筛选会将来自同一套件 MCP 服务器的所有工具都视为
  由 `bundle-mcp` 插件所有，因此配置文件的允许/拒绝列表既可以引用
  单个公开工具名称，也可以引用 `bundle-mcp` 插件键。

#### 嵌入式 OpenClaw 设置

启用套件时，Claude `settings.json` 会作为嵌入式 OpenClaw 的默认设置导入。
OpenClaw 会先清理其中的 shell 覆盖键，再应用这些设置：

- `shellPath`
- `shellCommandPrefix`

#### 嵌入式 OpenClaw LSP

- 已启用的 Claude 套件可以提供 LSP 服务器配置。
- OpenClaw 会加载 `.lsp.json` 以及清单中声明的所有 `lspServers` 路径。
- 套件 LSP 配置会合并到最终生效的嵌入式 OpenClaw LSP 默认配置中。
- 目前只有受支持且由 stdio 支持的 LSP 服务器可以运行；不受支持的
  传输方式仍会显示在 `openclaw plugins inspect <id>` 中。

### 已检测但不执行

以下内容会被识别并显示在诊断信息中，但 OpenClaw 不会运行它们：

- Claude `agents`、`hooks/hooks.json` 自动化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex `.app.json` 中能力报告以外的元数据

## 套件格式

<AccordionGroup>
  <Accordion title="Codex 套件">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    如果 Codex 套件使用技能根目录和 OpenClaw 风格的钩子包目录
    （`HOOK.md` + `handler.ts`），则最适合与 OpenClaw 配合使用。

  </Accordion>

  <Accordion title="Claude 套件">
    两种检测模式：

    - **基于清单：**`.claude-plugin/plugin.json`
    - **无清单：**默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特有行为：

    - `commands/` 被视为技能内容
    - `settings.json` 会导入嵌入式 OpenClaw 设置（shell 覆盖键会被清理）
    - `.mcp.json` 向嵌入式 OpenClaw 公开受支持的 stdio 工具
    - `.lsp.json` 和清单中声明的 `lspServers` 路径会加载到嵌入式 OpenClaw LSP 默认配置中
    - `hooks/hooks.json` 会被检测，但不会执行
    - 清单中的自定义组件路径是追加式的；它们会扩展默认路径，而不是替换默认路径

  </Accordion>

  <Accordion title="Cursor 套件">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 被视为技能内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅会被检测

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 会先检查原生插件格式：

1. `openclaw.plugin.json`，或包含 `openclaw.extensions` 的有效 `package.json`——视为**原生插件**
2. 套件标记（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）——视为**套件**

如果一个目录同时包含两种格式，OpenClaw 会使用原生路径。这样可以防止
双格式软件包以套件形式被部分安装。

## 运行时依赖和清理

- 第三方兼容套件不会在启动时执行 `npm install` 修复。它们应通过
  `openclaw plugins install` 安装，并将所需的一切内容随安装后的插件目录一起提供。
- OpenClaw 自有的内置插件要么以轻量形式随核心发布，要么可通过
  插件安装程序下载。Gateway 网关启动时绝不会为它们运行包管理器。
- `openclaw doctor --fix` 会移除过时的本地内置插件安装记录；
  如果配置仍引用某些可下载插件，但本地插件索引中缺少这些插件，
  它还可以恢复这些插件。

## 安全性

套件的信任边界比原生插件更窄：

- OpenClaw **不会**在进程内加载任意套件运行时模块。
- 技能和钩子包路径必须位于插件根目录内（会进行边界检查）。
- 读取设置文件时会执行相同的边界检查。
- 受支持的 stdio MCP 服务器可能会作为子进程启动。

这使套件在默认情况下更安全，但对于第三方套件实际公开的功能，
你仍应将其视为可信内容。

## 故障排查

<AccordionGroup>
  <Accordion title="套件已被检测，但能力无法运行">
    运行 `openclaw plugins inspect <id>`。如果某项能力已列出但标记为
    尚未接入，这是产品限制，而不是安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件未显示">
    确保套件已启用，并且 Markdown 文件位于已检测到的
    `commands/` 或 `skills/` 根目录中。
  </Accordion>

  <Accordion title="Claude 设置未生效">
    仅支持来自 `settings.json` 的嵌入式 OpenClaw 设置。OpenClaw
    不会将套件设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude 钩子未执行">
    `hooks/hooks.json` 仅会被检测。如果需要可运行的钩子，请使用
    OpenClaw 钩子包布局或发布原生插件。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装和配置插件](/zh-CN/tools/plugin)
- [Building Plugins](/zh-CN/plugins/building-plugins)——创建原生插件
- [Plugin Manifest](/zh-CN/plugins/manifest)——原生清单架构

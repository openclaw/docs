---
read_when:
    - 你想安装兼容 Codex、Claude 或 Cursor 的捆绑包
    - 你需要了解 OpenClaw 如何将包内容映射到原生功能
    - 你正在调试捆绑包检测或缺失的能力
summary: 安装 Codex、Claude 和 Cursor 捆绑包并将其作为 OpenClaw 插件使用
title: 插件包
x-i18n:
    generated_at: "2026-07-05T11:31:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d44006866238f53ee2e3e8126cc4f7ed6f7413534257775f7904c9b877778c59
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以从三个外部生态系统安装插件：**Codex**、**Claude**
和 **Cursor**。这些称为 **bundle**，即 OpenClaw 会映射为 Skills、钩子和 MCP 工具等原生功能的内容和元数据包。

<Info>
  bundle **不同于** 原生 OpenClaw 插件。原生插件在进程内运行，
  可以注册任何能力。bundle 是内容包，具有选择性功能映射和更窄的信任边界。
</Info>

## 为什么存在 bundle

许多有用的插件以 Codex、Claude 或 Cursor 格式发布。OpenClaw
不要求作者将它们重写为原生 OpenClaw 插件，而是检测这些格式，并将其支持的内容映射到原生功能集。你可以安装 Claude 命令包或 Codex skill bundle，并立即使用。

## 安装 bundle

<Steps>
  <Step title="从目录、归档或市场安装">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <source>
    openclaw plugins install <plugin> --marketplace <source>
    ```

    `<source>` 是本地市场路径/仓库，或 git/GitHub 来源。

  </Step>

  <Step title="验证检测结果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    bundle 会显示 `Format: bundle`，并带有 `codex`、`claude` 或 `cursor`
    的 `Bundle format:` 值。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    映射后的功能（Skills、钩子、MCP 工具、LSP 默认值）将在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 从 bundle 映射的内容

目前并非每个 bundle 功能都能在 OpenClaw 中运行。下面列出已可用的功能，以及已检测但尚未接线的功能。

### 当前支持

| 功能       | 映射方式                                                                                       | 适用对象     |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Skill 内容 | bundle skill 根目录会作为普通 OpenClaw skills 加载                                                 | 所有格式    |
| 命令      | `commands/` 和 `.cursor/commands/` 会被视为 skill 根目录                                        | Claude、Cursor |
| 钩子包    | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局                                                   | Codex          |
| MCP 工具     | bundle MCP 配置会合并到嵌入式 OpenClaw 设置中；会加载受支持的 stdio 和 HTTP 服务器 | 所有格式    |
| LSP 服务器   | Claude `.lsp.json` 和清单声明的 `lspServers` 会合并到嵌入式 OpenClaw LSP 默认值  | Claude         |
| 设置      | Claude `settings.json` 会作为嵌入式 OpenClaw 默认值导入                                     | Claude         |

#### Skill 内容

- bundle skill 根目录会作为普通 OpenClaw skill 根目录加载。
- Claude `commands/` 根目录会被视为额外的 skill 根目录。
- Cursor `.cursor/commands/` 根目录会被视为额外的 skill 根目录。

Claude markdown 命令文件和 Cursor 命令 markdown 都会通过普通 OpenClaw skill 加载器工作。

#### 钩子包

bundle 钩子根目录**只有**在使用普通 OpenClaw 钩子包布局时才会工作：
`HOOK.md` 加 `handler.ts` 或 `handler.js`。目前这主要是与 Codex 兼容的场景。

#### 嵌入式 OpenClaw 的 MCP

- 已启用的 bundle 可以提供 MCP 服务器配置。
- OpenClaw 会将 bundle MCP 配置合并到有效的嵌入式 OpenClaw
  设置中，作为 `mcpServers`。
- OpenClaw 会在嵌入式 OpenClaw agent 轮次中，通过启动 stdio 服务器或连接到 HTTP 服务器来暴露受支持的 bundle MCP 工具。
- `coding` 和 `messaging` 工具配置默认包含 bundle MCP 工具；
  可使用 `tools.deny: ["bundle-mcp"]` 为某个 agent 或 gateway 选择退出。
- 项目本地嵌入式 agent 设置仍会在 bundle 默认值之后应用，因此工作空间设置可在需要时覆盖 bundle MCP 条目。
- bundle MCP 工具目录会在注册前确定性排序，因此上游 `listTools()` 顺序变化不会反复扰动提示缓存工具块。

##### 传输协议

MCP 服务器可以使用 stdio 或 HTTP 传输协议。

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

**HTTP** 会连接到正在运行的 MCP 服务器，除非请求 `streamable-http`，否则默认使用 `sse`：

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

- `transport` 接受 `"streamable-http"` 或 `"sse"`；省略时默认使用 `sse`。
- `type: "http"` 是 CLI 原生的下游形状；在 OpenClaw 配置中使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 会规范化常见别名。
- 只允许 `http:` 和 `https:` URL scheme。
- `headers` 值支持 `${ENV_VAR}` 插值。
- 同时包含 `command` 和 `url` 的服务器条目会被拒绝。
- URL 凭据（userinfo 和查询参数）会从工具描述和日志中脱敏。
- `connectionTimeoutMs` 会覆盖 stdio 和 HTTP 传输协议的默认 30 秒连接超时。请求超时默认 60 秒，可使用 `requestTimeoutMs` 覆盖。

##### 工具命名

OpenClaw 会以 `serverName__toolName` 形式，使用对提供商安全的名称注册 bundle MCP 工具。例如，一个键为 `"vigil-harbor"` 的服务器暴露 `memory_search` 工具时，会注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会替换为 `-`。
- 如果片段会以非字母开头，则会加上字母前缀，因此 `12306` 这样的数字服务器键会变成对提供商安全的工具前缀。
- 服务器前缀上限为 30 个字符。
- 完整工具名称上限为 64 个字符。
- 空服务器名称会回退到 `mcp`。
- 发生冲突的清理后名称会用数字后缀消歧。
- 最终暴露的工具顺序按安全名称确定性排序，使重复的嵌入式 agent 轮次保持缓存稳定。
- 配置过滤会将来自同一个 bundle MCP 服务器的每个工具都视为由 `bundle-mcp` 插件拥有，因此配置允许/拒绝列表可以引用单个暴露工具名称，也可以引用 `bundle-mcp` 插件键。

#### 嵌入式 OpenClaw 设置

启用 bundle 后，Claude `settings.json` 会作为默认嵌入式 OpenClaw 设置导入。OpenClaw 会在应用 shell 覆盖键前对其进行清理：

- `shellPath`
- `shellCommandPrefix`

#### 嵌入式 OpenClaw LSP

- 已启用的 Claude bundle 可以提供 LSP 服务器配置。
- OpenClaw 会加载 `.lsp.json` 以及任何清单声明的 `lspServers` 路径。
- bundle LSP 配置会合并到有效的嵌入式 OpenClaw LSP 默认值中。
- 目前只有受支持的 stdio 支持型 LSP 服务器可以运行；不受支持的传输协议仍会显示在 `openclaw plugins inspect <id>` 中。

### 已检测但不执行

这些内容会被识别并显示在诊断中，但 OpenClaw 不会运行它们：

- Claude `agents`、`hooks/hooks.json` 自动化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex `.app.json` 元数据，能力报告之外的部分

## bundle 格式

<AccordionGroup>
  <Accordion title="Codex bundle">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    当 Codex bundle 使用 skill 根目录和 OpenClaw 风格的钩子包目录（`HOOK.md` + `handler.ts`）时，最适合 OpenClaw。

  </Accordion>

  <Accordion title="Claude bundle">
    两种检测模式：

    - **基于清单：** `.claude-plugin/plugin.json`
    - **无清单：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特定行为：

    - `commands/` 会被视为 skill 内容
    - `settings.json` 会导入到嵌入式 OpenClaw 设置中（shell 覆盖键会被清理）
    - `.mcp.json` 会向嵌入式 OpenClaw 暴露受支持的 stdio 工具
    - `.lsp.json` 加上清单声明的 `lspServers` 路径会加载到嵌入式 OpenClaw LSP 默认值中
    - `hooks/hooks.json` 会被检测但不会执行
    - 清单中的自定义组件路径是增量的；它们会扩展默认值，而不是替换默认值

  </Accordion>

  <Accordion title="Cursor bundle">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 会被视为 skill 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅会被检测

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 会先检查原生插件格式：

1. `openclaw.plugin.json` 或包含 `openclaw.extensions` 的有效 `package.json` - 视为**原生插件**
2. bundle 标记（`.codex-plugin/`、`.claude-plugin/`，或默认 Claude/Cursor 布局）- 视为 **bundle**

如果某个目录同时包含两者，OpenClaw 会使用原生路径。这可防止双格式包被部分安装为 bundle。

## 运行时依赖和清理

- 第三方兼容 bundle 不会获得启动时 `npm install` 修复。
  它们应通过 `openclaw plugins install` 安装，并在已安装插件目录中携带所需的一切。
- OpenClaw 拥有的内置插件要么以轻量形式随核心发布，要么通过插件安装器下载。Gateway 网关启动时绝不会为它们运行包管理器。
- `openclaw doctor --fix` 会移除过时的本地内置插件安装记录，并且在配置仍引用可下载插件但本地插件索引缺少它们时，可以恢复这些插件。

## 安全

bundle 的信任边界比原生插件更窄：

- OpenClaw **不会**在进程内加载任意 bundle 运行时模块。
- Skills 和钩子包路径必须保留在插件根目录内（经过边界检查）。
- 设置文件会使用相同的边界检查读取。
- 受支持的 stdio MCP 服务器可能会作为子进程启动。

这使 bundle 默认更安全，但你仍应将第三方 bundle 视为它们所暴露功能的可信内容。

## 故障排查

<AccordionGroup>
  <Accordion title="检测到 bundle，但能力未运行">
    运行 `openclaw plugins inspect <id>`。如果某项能力已列出但标记为未接线，
    这是产品限制，而不是安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件未出现">
    确保 bundle 已启用，并且 markdown 文件位于已检测到的 `commands/`
    或 `skills/` 根目录内。
  </Accordion>

  <Accordion title="Claude 设置未生效">
    仅支持来自 `settings.json` 的嵌入式 OpenClaw 设置。OpenClaw 不会将
    bundle 设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude 钩子未执行">
    `hooks/hooks.json` 仅用于检测。如果你需要可运行的钩子，请使用
    OpenClaw 钩子包布局，或发布原生插件。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装和配置插件](/zh-CN/tools/plugin)
- [Building Plugins](/zh-CN/plugins/building-plugins) - 创建原生插件
- [Plugin Manifest](/zh-CN/plugins/manifest) - 原生清单 schema

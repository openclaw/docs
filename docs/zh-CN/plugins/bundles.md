---
read_when:
    - 你想安装一个兼容 Codex、Claude 或 Cursor 的捆绑包
    - 你需要了解 OpenClaw 如何将捆绑包内容映射为原生功能
    - 你正在调试捆绑包检测或缺失的能力
summary: 安装并使用 Codex、Claude 和 Cursor 捆绑包作为 OpenClaw 插件
title: 插件包
x-i18n:
    generated_at: "2026-05-05T01:21:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bc06300e765e2faaf51800462003e242d29d4102ac9feaa47f86d4ad35bf157
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw 可以从三个外部生态系统安装插件：**Codex**、**Claude** 和 **Cursor**。这些称为 **bundle**，也就是 OpenClaw 映射到 Skills、钩子和 MCP 工具等原生功能的内容与元数据包。

<Info>
  bundle **不同于**原生 OpenClaw 插件。原生插件在进程内运行，并且可以注册任何能力。bundle 是内容包，具有选择性的功能映射和更窄的信任边界。
</Info>

## 为什么存在 bundle

许多有用的插件以 Codex、Claude 或 Cursor 格式发布。OpenClaw 不要求作者将它们重写为原生 OpenClaw 插件，而是检测这些格式，并将其支持的内容映射到原生功能集。这意味着你可以安装一个 Claude 命令包或 Codex Skills bundle 并立即使用。

## 安装 bundle

<Steps>
  <Step title="从目录、归档或市场安装">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="验证检测结果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    bundle 显示为 `Format: bundle`，并带有 `codex`、`claude` 或 `cursor` 子类型。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    映射后的功能（Skills、钩子、MCP 工具、LSP 默认值）会在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 从 bundle 映射什么

目前并非每个 bundle 功能都能在 OpenClaw 中运行。以下是已可用的内容，以及已检测但尚未接线的内容。

### 目前支持

| 功能       | 映射方式                                                                                 | 适用于     |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skills 内容 | bundle Skills 根目录作为普通 OpenClaw Skills 加载                                           | 所有格式    |
| 命令      | `commands/` 和 `.cursor/commands/` 被视为 Skills 根目录                                  | Claude、Cursor |
| 钩子包    | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局                                             | Codex          |
| MCP 工具     | bundle MCP 配置合并到嵌入式 Pi 设置中；加载受支持的 stdio 和 HTTP 服务器 | 所有格式    |
| LSP 服务器   | Claude `.lsp.json` 和清单声明的 `lspServers` 合并到嵌入式 Pi LSP 默认值中  | Claude         |
| 设置      | Claude `settings.json` 作为嵌入式 Pi 默认值导入                                     | Claude         |

#### Skills 内容

- bundle Skills 根目录作为普通 OpenClaw Skills 根目录加载
- Claude `commands` 根目录被视为额外的 Skills 根目录
- Cursor `.cursor/commands` 根目录被视为额外的 Skills 根目录

这意味着 Claude markdown 命令文件会通过普通 OpenClaw Skills 加载器工作。Cursor 命令 markdown 也通过同一路径工作。

#### 钩子包

- bundle 钩子根目录**仅在**使用普通 OpenClaw 钩子包布局时可用。今天这主要是 Codex 兼容的情况：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### Pi 的 MCP

- 已启用的 bundle 可以贡献 MCP 服务器配置
- OpenClaw 会将 bundle MCP 配置作为 `mcpServers` 合并到有效的嵌入式 Pi 设置中
- OpenClaw 会通过启动 stdio 服务器或连接到 HTTP 服务器，在嵌入式 Pi agent 轮次中暴露受支持的 bundle MCP 工具
- `coding` 和 `messaging` 工具配置文件默认包含 bundle MCP 工具；使用 `tools.deny: ["bundle-mcp"]` 可为某个 agent 或 Gateway 网关选择退出
- 项目本地 Pi 设置仍会在 bundle 默认值之后应用，因此工作区设置可以在需要时覆盖 bundle MCP 条目
- bundle MCP 工具目录在注册前会确定性排序，因此上游 `listTools()` 顺序变化不会导致提示缓存工具块频繁变动

##### 传输协议

MCP 服务器可以使用 stdio 或 HTTP 传输协议：

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

**HTTP** 默认通过 `sse` 连接到正在运行的 MCP 服务器，或在请求时使用 `streamable-http`：

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
- `type: "http"` 是 CLI 原生的下游形状；在 OpenClaw 配置中使用 `transport: "streamable-http"`。`openclaw mcp set` 和 `openclaw doctor --fix` 会规范化这个常见别名。
- 仅允许 `http:` 和 `https:` URL 方案
- `headers` 值支持 `${ENV_VAR}` 插值
- 同时包含 `command` 和 `url` 的服务器条目会被拒绝
- URL 凭证（userinfo 和查询参数）会从工具描述和日志中脱敏
- `connectionTimeoutMs` 会覆盖 stdio 和 HTTP 传输协议默认的 30 秒连接超时

##### 工具命名

OpenClaw 会以 `serverName__toolName` 形式，使用对提供商安全的名称注册 bundle MCP 工具。例如，键名为 `"vigil-harbor"` 的服务器暴露一个 `memory_search` 工具时，会注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会替换为 `-`
- 服务器前缀上限为 30 个字符
- 完整工具名称上限为 64 个字符
- 空服务器名称回退为 `mcp`
- 发生冲突的清理后名称会用数字后缀消歧
- 最终暴露的工具顺序会按安全名称确定性排序，使重复的 Pi 轮次保持缓存稳定
- 配置文件过滤会将同一个 bundle MCP 服务器中的所有工具视为由 `bundle-mcp` 插件拥有，因此配置文件 allowlist 和 deny list 可以包含单个暴露工具名称，也可以包含 `bundle-mcp` 插件键

#### 嵌入式 Pi 设置

- 当 bundle 启用时，Claude `settings.json` 会作为默认嵌入式 Pi 设置导入
- OpenClaw 会在应用 shell 覆盖键之前对其进行清理

清理后的键：

- `shellPath`
- `shellCommandPrefix`

#### 嵌入式 Pi LSP

- 已启用的 Claude bundle 可以贡献 LSP 服务器配置
- OpenClaw 会加载 `.lsp.json` 以及任何清单声明的 `lspServers` 路径
- bundle LSP 配置会合并到有效的嵌入式 Pi LSP 默认值中
- 目前只有受支持的 stdio 后端 LSP 服务器可运行；不支持的传输协议仍会显示在 `openclaw plugins inspect <id>` 中

### 已检测但不执行

这些会被识别并显示在诊断中，但 OpenClaw 不会运行它们：

- Claude `agents`、`hooks.json` 自动化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 中超出能力报告范围的内联/应用元数据

## bundle 格式

<AccordionGroup>
  <Accordion title="Codex bundle">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    当 Codex bundle 使用 Skills 根目录和 OpenClaw 风格的钩子包目录（`HOOK.md` + `handler.ts`）时，最适合 OpenClaw。

  </Accordion>

  <Accordion title="Claude bundle">
    两种检测模式：

    - **基于清单：** `.claude-plugin/plugin.json`
    - **无清单：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 专属行为：

    - `commands/` 被视为 Skills 内容
    - `settings.json` 会导入到嵌入式 Pi 设置中（shell 覆盖键会被清理）
    - `.mcp.json` 会向嵌入式 Pi 暴露受支持的 stdio 工具
    - `.lsp.json` 以及清单声明的 `lspServers` 路径会加载到嵌入式 Pi LSP 默认值中
    - `hooks/hooks.json` 会被检测但不执行
    - 清单中的自定义组件路径是追加式的（它们会扩展默认值，而不是替换默认值）

  </Accordion>

  <Accordion title="Cursor bundle">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 被视为 Skills 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅检测

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 首先检查原生插件格式：

1. `openclaw.plugin.json` 或带有 `openclaw.extensions` 的有效 `package.json` —— 视为**原生插件**
2. bundle 标记（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）—— 视为 **bundle**

如果目录同时包含两者，OpenClaw 会使用原生路径。这可以防止双格式包被部分安装为 bundle。

## 运行时依赖与清理

- 第三方兼容 bundle 不会获得启动时的 `npm install` 修复。它们应通过 `openclaw plugins install` 安装，并在已安装的插件目录中随附所需的一切。
- OpenClaw 拥有的内置插件要么以轻量形式随核心发布，要么可通过插件安装器下载。Gateway 网关启动永远不会为它们运行包管理器。
- `openclaw doctor --fix` 会移除旧版暂存依赖目录，并且可以恢复配置引用但本地插件索引缺失的可下载插件。

## 安全

bundle 的信任边界比原生插件更窄：

- OpenClaw **不会**在进程内加载任意 bundle 运行时模块
- Skills 和钩子包路径必须保留在插件根目录内（带边界检查）
- 设置文件会用相同的边界检查读取
- 受支持的 stdio MCP 服务器可以作为子进程启动

这使 bundle 默认更安全，但你仍应将第三方 bundle 视为受信任内容来使用它们暴露的功能。

## 故障排除

<AccordionGroup>
  <Accordion title="检测到了 bundle，但能力没有运行">
    运行 `openclaw plugins inspect <id>`。如果某项能力已列出但标记为未接线，那是产品限制，而不是安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件没有出现">
    确保 bundle 已启用，并且 markdown 文件位于检测到的 `commands/` 或 `skills/` 根目录内。
  </Accordion>

  <Accordion title="Claude 设置没有生效">
    仅支持来自 `settings.json` 的嵌入式 Pi 设置。OpenClaw 不会将 bundle 设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude 钩子没有执行">
    `hooks/hooks.json` 仅用于检测。如果需要可运行的钩子，请使用 OpenClaw 钩子包布局，或发布原生插件。
  </Accordion>
</AccordionGroup>

## 相关

- [安装和配置插件](/zh-CN/tools/plugin)
- [构建插件](/zh-CN/plugins/building-plugins) —— 创建原生插件
- [插件清单](/zh-CN/plugins/manifest) —— 原生清单 schema

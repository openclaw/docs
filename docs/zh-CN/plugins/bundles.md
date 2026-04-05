---
read_when:
    - 你想安装兼容 Codex、Claude 或 Cursor 的 bundle 时
    - 你需要了解 OpenClaw 如何将 bundle 内容映射为原生功能时
    - 你在调试 bundle 检测或能力缺失问题时
summary: 将 Codex、Claude 和 Cursor bundle 作为 OpenClaw 插件安装和使用
title: 插件 Bundles
x-i18n:
    generated_at: "2026-04-05T08:39:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8b1eb4633bdff75425d8c2e29be352e11a4cdad7f420c0c66ae5ef07bf9bdcc
    source_path: plugins/bundles.md
    workflow: 15
---

# 插件 Bundles

OpenClaw 可以从三个外部生态安装插件：**Codex**、**Claude** 和 **Cursor**。
这些被称为 **bundles** —— 内容和元数据包，OpenClaw 会将其映射为诸如 skills、hooks 和 MCP 工具等原生功能。

<Info>
  Bundles **不同于**原生 OpenClaw 插件。原生插件在进程内运行，
  并且可以注册任何能力。Bundles 是内容包，带有
  选择性的功能映射以及更窄的信任边界。
</Info>

## 为什么存在 bundles

许多有用的插件是以 Codex、Claude 或 Cursor 格式发布的。OpenClaw
不要求作者将它们重写为原生 OpenClaw 插件，而是会
检测这些格式，并将其支持的内容映射到原生功能
集中。这意味着你可以安装一个 Claude 命令包或 Codex skill bundle，
并立即使用它。

## 安装 bundle

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

  <Step title="验证检测结果">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    Bundles 会显示为 `Format: bundle`，其子类型为 `codex`、`claude` 或 `cursor`。

  </Step>

  <Step title="重启并使用">
    ```bash
    openclaw gateway restart
    ```

    映射后的功能（skills、hooks、MCP 工具、LSP 默认值）会在下一个会话中可用。

  </Step>
</Steps>

## OpenClaw 从 bundles 中映射哪些内容

目前并不是每种 bundle 功能都能在 OpenClaw 中运行。以下列出了当前可用的功能，以及已检测到但尚未接入的功能。

### 当前支持

| 功能 | 映射方式 | 适用范围 |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| Skills 内容 | bundle 的 skill 根目录会像普通 OpenClaw skills 一样加载 | 所有格式 |
| 命令 | `commands/` 和 `.cursor/commands/` 被视为 skill 根目录 | Claude、Cursor |
| Hook 包 | OpenClaw 风格的 `HOOK.md` + `handler.ts` 布局 | Codex |
| MCP 工具 | bundle MCP 配置会合并到内置 Pi 设置中；支持的 stdio 和 HTTP 服务器会被加载 | 所有格式 |
| LSP 服务器 | Claude `.lsp.json` 和 manifest 声明的 `lspServers` 会合并到内置 Pi LSP 默认值中 | Claude |
| 设置 | Claude `settings.json` 会作为内置 Pi 默认值导入 | Claude |

#### Skills 内容

- bundle 的 skill 根目录会像普通 OpenClaw skill 根目录一样加载
- Claude `commands` 根目录会被视为附加的 skill 根目录
- Cursor `.cursor/commands` 根目录会被视为附加的 skill 根目录

这意味着 Claude markdown 命令文件可通过常规 OpenClaw skill
加载器工作。Cursor 命令 markdown 也通过同一路径工作。

#### Hook 包

- 只有当 bundle hook 根目录使用常规 OpenClaw hook-pack
  布局时，它们才会工作。当前这主要是兼容 Codex 的情况：
  - `HOOK.md`
  - `handler.ts` 或 `handler.js`

#### Pi 的 MCP

- 已启用的 bundles 可以提供 MCP 服务器配置
- OpenClaw 会将 bundle MCP 配置合并到实际生效的内置 Pi 设置中，作为
  `mcpServers`
- OpenClaw 会在内置 Pi 智能体轮次期间暴露受支持的 bundle MCP 工具，
  方式是启动 stdio 服务器或连接到 HTTP 服务器
- 在 bundle 默认值之后，项目本地 Pi 设置仍然会生效，因此在需要时
  工作区设置可以覆盖 bundle MCP 条目
- bundle MCP 工具目录在注册前会按确定性顺序排序，因此
  上游 `listTools()` 顺序变化不会扰乱 prompt-cache 工具区块

##### 传输方式

MCP 服务器可以使用 stdio 或 HTTP 传输：

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

**HTTP** 默认通过 `sse` 连接到正在运行的 MCP 服务器，或者在请求时使用 `streamable-http`：

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
- 仅允许 `http:` 和 `https:` URL scheme
- `headers` 值支持 `${ENV_VAR}` 插值
- 同时包含 `command` 和 `url` 的服务器条目会被拒绝
- URL 凭证（userinfo 和查询参数）会从工具
  描述和日志中被隐藏
- `connectionTimeoutMs` 会覆盖
  stdio 和 HTTP 传输默认的 30 秒连接超时

##### 工具命名

OpenClaw 会使用适用于提供商的安全名称注册 bundle MCP 工具，格式为
`serverName__toolName`。例如，键名为 `"vigil-harbor"` 的服务器暴露
`memory_search` 工具时，会注册为 `vigil-harbor__memory_search`。

- `A-Za-z0-9_-` 之外的字符会被替换为 `-`
- 服务器前缀长度上限为 30 个字符
- 完整工具名长度上限为 64 个字符
- 空服务器名会回退为 `mcp`
- 发生清洗后重名时，会使用数字后缀消歧
- 最终暴露的工具顺序会按安全名称确定性排序，以保持重复的 Pi
  轮次缓存稳定

#### 内置 Pi 设置

- 启用 bundle 时，Claude `settings.json` 会作为默认内置 Pi 设置导入
- OpenClaw 会在应用前清理 shell 覆盖键

清理的键：

- `shellPath`
- `shellCommandPrefix`

#### 内置 Pi LSP

- 已启用的 Claude bundles 可以提供 LSP 服务器配置
- OpenClaw 会加载 `.lsp.json` 以及 manifest 中声明的任何 `lspServers` 路径
- bundle LSP 配置会合并到实际生效的内置 Pi LSP 默认值中
- 当前只有受支持的基于 stdio 的 LSP 服务器可以运行；不受支持的
  传输方式仍会显示在 `openclaw plugins inspect <id>` 中

### 已检测但不会执行

这些内容会被识别并显示在诊断中，但 OpenClaw 不会运行它们：

- Claude `agents`、`hooks.json` 自动化、`outputStyles`
- Cursor `.cursor/agents`、`.cursor/hooks.json`、`.cursor/rules`
- Codex 内联/应用元数据（除能力报告外）

## Bundle 格式

<AccordionGroup>
  <Accordion title="Codex bundles">
    标记：`.codex-plugin/plugin.json`

    可选内容：`skills/`、`hooks/`、`.mcp.json`、`.app.json`

    当 Codex bundles 使用 skill 根目录和 OpenClaw 风格的
    hook-pack 目录（`HOOK.md` + `handler.ts`）时，最适合 OpenClaw。

  </Accordion>

  <Accordion title="Claude bundles">
    两种检测模式：

    - **基于 manifest：** `.claude-plugin/plugin.json`
    - **无 manifest：** 默认 Claude 布局（`skills/`、`commands/`、`agents/`、`hooks/`、`.mcp.json`、`.lsp.json`、`settings.json`）

    Claude 特定行为：

    - `commands/` 被视为 skill 内容
    - `settings.json` 会导入到内置 Pi 设置中（shell 覆盖键会被清理）
    - `.mcp.json` 会向内置 Pi 暴露受支持的 stdio 工具
    - `.lsp.json` 以及 manifest 声明的 `lspServers` 路径会加载到内置 Pi LSP 默认值中
    - `hooks/hooks.json` 会被检测到，但不会执行
    - manifest 中的自定义组件路径是附加的（它们会扩展默认值，而不是替换默认值）

  </Accordion>

  <Accordion title="Cursor bundles">
    标记：`.cursor-plugin/plugin.json`

    可选内容：`skills/`、`.cursor/commands/`、`.cursor/agents/`、`.cursor/rules/`、`.cursor/hooks.json`、`.mcp.json`

    - `.cursor/commands/` 被视为 skill 内容
    - `.cursor/rules/`、`.cursor/agents/` 和 `.cursor/hooks.json` 仅检测，不执行

  </Accordion>
</AccordionGroup>

## 检测优先级

OpenClaw 会先检查原生插件格式：

1. `openclaw.plugin.json` 或带有 `openclaw.extensions` 的有效 `package.json` —— 视为**原生插件**
2. Bundle 标记（`.codex-plugin/`、`.claude-plugin/` 或默认 Claude/Cursor 布局）—— 视为 **bundle**

如果一个目录同时包含两者，OpenClaw 会使用原生路径。这样可以防止
双格式包被部分作为 bundle 安装。

## 安全性

Bundles 的信任边界比原生插件更窄：

- OpenClaw **不会**在进程内加载任意 bundle 运行时模块
- Skills 和 hook-pack 路径必须保留在插件根目录内（带边界检查）
- 设置文件会使用相同的边界检查进行读取
- 受支持的 stdio MCP 服务器可能会作为子进程启动

这使 bundles 默认情况下更安全，但你仍应将第三方
bundles 视为其所暴露功能范围内的受信任内容。

## 故障排除

<AccordionGroup>
  <Accordion title="Bundle 已被检测到，但能力没有运行">
    运行 `openclaw plugins inspect <id>`。如果某项能力已列出但标记为
    未接入，那是产品限制——不是安装损坏。
  </Accordion>

  <Accordion title="Claude 命令文件未显示">
    请确保 bundle 已启用，并且 markdown 文件位于已检测到的
    `commands/` 或 `skills/` 根目录中。
  </Accordion>

  <Accordion title="Claude 设置未生效">
    目前仅支持来自 `settings.json` 的内置 Pi 设置。OpenClaw 不会
    将 bundle 设置视为原始配置补丁。
  </Accordion>

  <Accordion title="Claude hooks 未执行">
    `hooks/hooks.json` 仅检测，不执行。如果你需要可运行的 hooks，请使用
    OpenClaw hook-pack 布局或提供一个原生插件。
  </Accordion>
</AccordionGroup>

## 相关内容

- [安装和配置插件](/tools/plugin)
- [构建插件](/plugins/building-plugins) — 创建原生插件
- [插件 Manifest](/plugins/manifest) — 原生 manifest schema

---
read_when:
    - 你希望智能体将代码或 Markdown 编辑内容显示为 diff 时
    - 你希望获得适用于 canvas 的查看器 URL 或渲染后的 diff 文件时
    - 你需要具备安全默认值的受控临时 diff 工件时
summary: 面向智能体的只读 Diff 查看器和文件渲染器（可选插件工具）
title: Diffs
x-i18n:
    generated_at: "2026-04-05T10:11:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935539a6e584980eb7e57067c18112bb40a0be8522b9da649c7cf7f180fb45d4
    source_path: tools/diffs.md
    workflow: 15
---

# Diffs

`diffs` 是一个可选插件工具，带有简短的内置系统指导和一个配套 skill，可将变更内容转换为供智能体使用的只读 diff 工件。

它接受以下任一输入：

- `before` 和 `after` 文本
- 统一格式的 `patch`

它可以返回：

- 用于 canvas 展示的 Gateway 网关查看器 URL
- 用于消息投递的渲染文件路径（PNG 或 PDF）
- 一次调用同时返回以上两种输出

启用后，该插件会在 system-prompt 空间中预置简洁的使用指导，同时也会暴露一个详细 skill，用于智能体需要更完整说明的场景。

## 快速开始

1. 启用插件。
2. 在以 canvas 为主的流程中，调用 `diffs` 并设置 `mode: "view"`。
3. 在聊天文件投递流程中，调用 `diffs` 并设置 `mode: "file"`。
4. 当你同时需要两种工件时，调用 `diffs` 并设置 `mode: "both"`。

## 启用插件

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## 禁用内置系统指导

如果你希望保持 `diffs` 工具启用，但禁用其内置 system-prompt 指导，请将 `plugins.entries.diffs.hooks.allowPromptInjection` 设置为 `false`：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

这会阻止 diffs 插件的 `before_prompt_build` hook，同时保留插件、工具和配套 skill 可用。

如果你想同时禁用指导和工具，请直接禁用该插件。

## 典型智能体工作流

1. 智能体调用 `diffs`。
2. 智能体读取 `details` 字段。
3. 智能体执行以下之一：
   - 使用 `canvas present` 打开 `details.viewerUrl`
   - 使用 `message` 发送 `details.filePath`，并通过 `path` 或 `filePath`
   - 两者都做

## 输入示例

Before 和 after：

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch：

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## 工具输入参考

除特别说明外，所有字段均为可选：

- `before` (`string`)：原始文本。当省略 `patch` 时，必须与 `after` 一起提供。
- `after` (`string`)：更新后的文本。当省略 `patch` 时，必须与 `before` 一起提供。
- `patch` (`string`)：统一 diff 文本。与 `before` 和 `after` 互斥。
- `path` (`string`)：before/after 模式下显示的文件名。
- `lang` (`string`)：before/after 模式下的语言覆盖提示。未知值会回退为纯文本。
- `title` (`string`)：查看器标题覆盖值。
- `mode` (`"view" | "file" | "both"`)：输出模式。默认使用插件默认值 `defaults.mode`。
  已弃用别名：`"image"` 的行为等同于 `"file"`，为向后兼容仍然接受。
- `theme` (`"light" | "dark"`)：查看器主题。默认使用插件默认值 `defaults.theme`。
- `layout` (`"unified" | "split"`)：diff 布局。默认使用插件默认值 `defaults.layout`。
- `expandUnchanged` (`boolean`)：当完整上下文可用时展开未更改部分。仅为单次调用选项（不是插件默认键）。
- `fileFormat` (`"png" | "pdf"`)：渲染文件格式。默认使用插件默认值 `defaults.fileFormat`。
- `fileQuality` (`"standard" | "hq" | "print"`)：PNG 或 PDF 渲染的质量预设。
- `fileScale` (`number`)：设备缩放覆盖值（`1`-`4`）。
- `fileMaxWidth` (`number`)：最大渲染宽度，单位为 CSS 像素（`640`-`2400`）。
- `ttlSeconds` (`number`)：查看器和独立文件输出的工件 TTL（秒）。默认 1800，最大 21600。
- `baseUrl` (`string`)：查看器 URL 源覆盖值。会覆盖插件的 `viewerBaseUrl`。必须为 `http` 或 `https`，且不能带 query/hash。

为向后兼容，仍接受以下旧输入别名：

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

验证与限制：

- `before` 和 `after` 各自最大为 512 KiB。
- `patch` 最大为 2 MiB。
- `path` 最大为 2048 字节。
- `lang` 最大为 128 字节。
- `title` 最大为 1024 字节。
- Patch 复杂度上限：最多 128 个文件，总计 120000 行。
- 同时提供 `patch` 与 `before` 或 `after` 会被拒绝。
- 渲染文件的安全限制（适用于 PNG 和 PDF）：
  - `fileQuality: "standard"`：最大 8 MP（8,000,000 渲染像素）。
  - `fileQuality: "hq"`：最大 14 MP（14,000,000 渲染像素）。
  - `fileQuality: "print"`：最大 24 MP（24,000,000 渲染像素）。
  - PDF 另有最多 50 页的限制。

## 输出 details 契约

该工具会在 `details` 下返回结构化元数据。

适用于会创建查看器的模式的共享字段：

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context`（如可用则包括 `agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

当渲染 PNG 或 PDF 时的文件字段：

- `artifactId`
- `expiresAt`
- `filePath`
- `path`（与 `filePath` 相同的值，用于兼容 message 工具）
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

还会为现有调用方返回兼容别名：

- `format`（与 `fileFormat` 相同的值）
- `imagePath`（与 `filePath` 相同的值）
- `imageBytes`（与 `fileBytes` 相同的值）
- `imageQuality`（与 `fileQuality` 相同的值）
- `imageScale`（与 `fileScale` 相同的值）
- `imageMaxWidth`（与 `fileMaxWidth` 相同的值）

模式行为摘要：

- `mode: "view"`：仅返回查看器字段。
- `mode: "file"`：仅返回文件字段，不创建查看器工件。
- `mode: "both"`：返回查看器字段加文件字段。如果文件渲染失败，查看器仍会返回，同时带有 `fileError` 和兼容别名 `imageError`。

## 折叠的未更改部分

- 查看器可以显示类似 `N unmodified lines` 的行。
- 这些行上的展开控件是有条件的，并不保证适用于每一种输入类型。
- 当渲染后的 diff 具有可展开的上下文数据时，会显示展开控件，这在 before/after 输入中很常见。
- 对于许多统一 patch 输入，解析后的 patch hunk 中并不包含被省略的上下文主体，因此可能会显示该行但没有展开控件。这是预期行为。
- `expandUnchanged` 仅在存在可展开上下文时生效。

## 插件默认值

在 `~/.openclaw/openclaw.json` 中设置插件级默认值：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

支持的默认值：

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

显式工具参数会覆盖这些默认值。

持久化查看器 URL 配置：

- `viewerBaseUrl`（`string`，可选）
  - 当工具调用未传入 `baseUrl` 时，作为返回查看器链接的插件自有回退值。
  - 必须为 `http` 或 `https`，且不能带 query/hash。

示例：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## 安全配置

- `security.allowRemoteViewer`（`boolean`，默认 `false`）
  - `false`：拒绝对查看器路由的非 loopback 请求。
  - `true`：如果 tokenized 路径有效，则允许远程查看器。

示例：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## 工件生命周期与存储

- 工件存储在临时子文件夹下：`$TMPDIR/openclaw-diffs`。
- 查看器工件元数据包含：
  - 随机工件 ID（20 个十六进制字符）
  - 随机令牌（48 个十六进制字符）
  - `createdAt` 和 `expiresAt`
  - 存储的 `viewer.html` 路径
- 未指定时，默认工件 TTL 为 30 分钟。
- 可接受的最大查看器 TTL 为 6 小时。
- 清理会在创建工件后机会式运行。
- 已过期工件会被删除。
- 当元数据缺失时，回退清理会移除超过 24 小时的陈旧文件夹。

## 查看器 URL 与网络行为

查看器路由：

- `/plugins/diffs/view/{artifactId}/{token}`

查看器资源：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

查看器文档会相对于查看器 URL 解析这些资源，因此可选的 `baseUrl` 路径前缀也会被保留并用于这些资源请求。

URL 构造行为：

- 如果提供了工具调用级 `baseUrl`，则在严格验证后使用它。
- 否则如果配置了插件 `viewerBaseUrl`，则使用它。
- 如果两者都未覆盖，查看器 URL 默认使用 loopback `127.0.0.1`。
- 如果 gateway 绑定模式为 `custom` 且设置了 `gateway.customBindHost`，则使用该主机。

`baseUrl` 规则：

- 必须是 `http://` 或 `https://`。
- 不接受 query 和 hash。
- 允许源加可选基础路径。

## 安全模型

查看器加固：

- 默认仅限 loopback。
- 使用 tokenized 查看器路径，并对 ID 和令牌进行严格验证。
- 查看器响应 CSP：
  - `default-src 'none'`
  - 脚本和资源仅允许来自 self
  - 不允许出站 `connect-src`
- 启用远程访问时，对远程 miss 进行节流：
  - 每 60 秒 40 次失败
  - 锁定 60 秒（`429 Too Many Requests`）

文件渲染加固：

- 截图浏览器请求路由默认拒绝全部。
- 仅允许来自 `http://127.0.0.1/plugins/diffs/assets/*` 的本地查看器资源。
- 外部网络请求会被阻止。

## file 模式的浏览器要求

`mode: "file"` 和 `mode: "both"` 需要兼容 Chromium 的浏览器。

解析顺序：

1. OpenClaw 配置中的 `browser.executablePath`。
2. 环境变量：
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. 平台命令/路径发现回退。

常见失败文本：

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

可通过安装 Chrome、Chromium、Edge 或 Brave，或设置上述任一可执行路径选项来修复。

## 故障排除

输入验证错误：

- `Provide patch or both before and after text.`
  - 请同时提供 `before` 和 `after`，或提供 `patch`。
- `Provide either patch or before/after input, not both.`
  - 不要混用输入模式。
- `Invalid baseUrl: ...`
  - 请使用带可选路径、无 query/hash 的 `http(s)` 源。
- `{field} exceeds maximum size (...)`
  - 请减小载荷大小。
- 大 patch 被拒绝
  - 请减少 patch 文件数量或总行数。

查看器可访问性问题：

- 查看器 URL 默认解析为 `127.0.0.1`。
- 对于远程访问场景，可选择：
  - 设置插件 `viewerBaseUrl`，或
  - 在每次工具调用中传入 `baseUrl`，或
  - 使用 `gateway.bind=custom` 和 `gateway.customBindHost`
- 如果 `gateway.trustedProxies` 对同主机代理（例如 Tailscale Serve）包含 loopback，那么在没有转发客户端 IP 头的情况下，原始 loopback 查看器请求会按设计失败关闭。
- 对于这种代理拓扑：
  - 如果你只需要附件，优先使用 `mode: "file"` 或 `mode: "both"`，或
  - 如果你需要可分享的查看器 URL，则有意启用 `security.allowRemoteViewer`，并设置插件 `viewerBaseUrl` 或在需要时传入代理/公共 `baseUrl`
- 仅当你确实打算允许外部查看器访问时，才启用 `security.allowRemoteViewer`。

未更改行那一行没有展开按钮：

- 这可能发生在 patch 输入中，因为 patch 不携带可展开上下文。
- 这是预期行为，并不表示查看器失败。

找不到工件：

- 工件因 TTL 到期而失效。
- 令牌或路径已更改。
- 清理过程移除了陈旧数据。

## 运维指导

- 对于 canvas 中的本地交互式审查，优先使用 `mode: "view"`。
- 对于需要附件的外发聊天渠道，优先使用 `mode: "file"`。
- 除非你的部署需要远程查看器 URL，否则请保持 `allowRemoteViewer` 禁用。
- 对敏感 diff，请显式设置较短的 `ttlSeconds`。
- 在非必要情况下，避免在 diff 输入中包含密钥。
- 如果你的渠道会强烈压缩图片（例如 Telegram 或 WhatsApp），请优先使用 PDF 输出（`fileFormat: "pdf"`）。

Diff 渲染引擎：

- 由 [Diffs](https://diffs.com) 提供支持。

## 相关文档

- [工具概览](/zh-CN/tools)
- [插件](/zh-CN/tools/plugin)
- [Browser](/zh-CN/tools/browser)

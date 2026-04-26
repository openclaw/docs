---
read_when:
    - 你希望智能体将代码或 Markdown 编辑显示为差异内容
    - 你希望获得一个适用于 canvas 的查看器 URL 或一个已渲染的差异文件
    - 你需要具有安全默认设置的受控临时差异产物
sidebarTitle: Diffs
summary: 供智能体使用的只读差异查看器和文件渲染器（可选插件工具）
title: Diffs
x-i18n:
    generated_at: "2026-04-26T06:20:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` 是一个可选的插件工具，带有简短的内置系统指引和一个配套 Skills，可将变更内容转换为供智能体使用的只读差异产物。

它接受以下任一输入：

- `before` 和 `after` 文本
- 统一格式的 `patch`

它可以返回：

- 用于 canvas 展示的 Gateway 网关查看器 URL
- 用于消息发送的已渲染文件路径（PNG 或 PDF）
- 在一次调用中同时返回这两种输出

启用后，该插件会在系统提示空间中预置简洁的使用指引，同时还会公开一个更详细的 Skills，供智能体在需要更完整说明时使用。

## 快速开始

<Steps>
  <Step title="启用插件">
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
  </Step>
  <Step title="选择模式">
    <Tabs>
      <Tab title="view">
        以 canvas 为主的流程：智能体使用 `mode: "view"` 调用 `diffs`，并通过 `canvas present` 打开 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天文件发送：智能体使用 `mode: "file"` 调用 `diffs`，并使用 `path` 或 `filePath` 通过 `message` 发送 `details.filePath`。
      </Tab>
      <Tab title="both">
        组合模式：智能体使用 `mode: "both"` 调用 `diffs`，在一次调用中获取两种产物。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 禁用内置系统指引

如果你想保持 `diffs` 工具启用，但禁用其内置的系统提示指引，请将 `plugins.entries.diffs.hooks.allowPromptInjection` 设置为 `false`：

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

这会阻止 diffs 插件的 `before_prompt_build` hook，同时保留插件、工具和配套 Skills 可用。

如果你想同时禁用指引和工具，请直接禁用该插件。

## 典型的智能体工作流

<Steps>
  <Step title="调用 diffs">
    智能体使用输入调用 `diffs` 工具。
  </Step>
  <Step title="读取 details">
    智能体从响应中读取 `details` 字段。
  </Step>
  <Step title="展示">
    智能体可以通过 `canvas present` 打开 `details.viewerUrl`，或使用 `path` 或 `filePath` 通过 `message` 发送 `details.filePath`，也可以两者都做。
  </Step>
</Steps>

## 输入示例

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## 工具输入参考

除非另有说明，所有字段都是可选的。

<ParamField path="before" type="string">
  原始文本。当省略 `patch` 时，必须与 `after` 一起提供。
</ParamField>
<ParamField path="after" type="string">
  更新后的文本。当省略 `patch` 时，必须与 `before` 一起提供。
</ParamField>
<ParamField path="patch" type="string">
  统一 diff 文本。与 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  在 before 和 after 模式下显示的文件名。
</ParamField>
<ParamField path="lang" type="string">
  before 和 after 模式下的语言覆盖提示。未知值会回退为纯文本。
</ParamField>
<ParamField path="title" type="string">
  查看器标题覆盖值。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  输出模式。默认使用插件默认值 `defaults.mode`。已弃用别名：`"image"` 的行为与 `"file"` 相同，仍为向后兼容而接受。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  查看器主题。默认使用插件默认值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff 布局。默认使用插件默认值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  在有完整上下文可用时展开未更改部分。仅限每次调用的选项（不是插件默认键）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  已渲染文件格式。默认使用插件默认值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG 或 PDF 渲染的质量预设。
</ParamField>
<ParamField path="fileScale" type="number">
  设备缩放覆盖值（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  最大渲染宽度，单位为 CSS 像素（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  查看器和独立文件输出的产物 TTL（秒）。最大为 21600。
</ParamField>
<ParamField path="baseUrl" type="string">
  查看器 URL 源地址覆盖值。会覆盖插件的 `viewerBaseUrl`。必须是 `http` 或 `https`，且不能带 query/hash。
</ParamField>

<AccordionGroup>
  <Accordion title="旧版输入别名">
    仍为向后兼容而接受：

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="校验和限制">
    - `before` 和 `after` 各自最大为 512 KiB。
    - `patch` 最大为 2 MiB。
    - `path` 最大为 2048 字节。
    - `lang` 最大为 128 字节。
    - `title` 最大为 1024 字节。
    - Patch 复杂度上限：最多 128 个文件和总计 120000 行。
    - 同时提供 `patch` 以及 `before` 或 `after` 会被拒绝。
    - 已渲染文件的安全限制（适用于 PNG 和 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 个渲染像素）。
      - `fileQuality: "hq"`：最大 14 MP（14,000,000 个渲染像素）。
      - `fileQuality: "print"`：最大 24 MP（24,000,000 个渲染像素）。
      - PDF 另有最多 50 页的限制。
  </Accordion>
</AccordionGroup>

## 输出 details 契约

该工具在 `details` 下返回结构化元数据。

<AccordionGroup>
  <Accordion title="查看器字段">
    适用于会创建查看器的模式的共享字段：

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context`（在可用时包含 `agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

  </Accordion>
  <Accordion title="文件字段">
    渲染 PNG 或 PDF 时的文件字段：

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（与 `filePath` 值相同，用于兼容消息工具）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="兼容性别名">
    也会为现有调用方返回：

    - `format`（与 `fileFormat` 值相同）
    - `imagePath`（与 `filePath` 值相同）
    - `imageBytes`（与 `fileBytes` 值相同）
    - `imageQuality`（与 `fileQuality` 值相同）
    - `imageScale`（与 `fileScale` 值相同）
    - `imageMaxWidth`（与 `fileMaxWidth` 值相同）

  </Accordion>
</AccordionGroup>

模式行为摘要：

| 模式     | 返回内容                                                                 |
| -------- | ------------------------------------------------------------------------ |
| `"view"` | 仅返回查看器字段。                                                       |
| `"file"` | 仅返回文件字段，不返回查看器产物。                                       |
| `"both"` | 返回查看器字段和文件字段。如果文件渲染失败，仍会返回查看器，并附带 `fileError` 及其别名 `imageError`。 |

## 折叠的未更改部分

- 查看器可以显示类似 `N unmodified lines` 的行。
- 这些行上的展开控件是有条件的，并不保证对所有输入类型都提供。
- 当渲染后的 diff 具有可展开的上下文数据时，会出现展开控件，这在 before 和 after 输入中很常见。
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

显式传入的工具参数会覆盖这些默认值。

### 持久查看器 URL 配置

<ParamField path="viewerBaseUrl" type="string">
  当工具调用未传入 `baseUrl` 时，插件为返回的查看器链接提供的插件自有后备值。必须是 `http` 或 `https`，且不能带 query/hash。
</ParamField>

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

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`：拒绝来自非 loopback 的查看器路由请求。`true`：如果带令牌的路径有效，则允许远程查看器访问。
</ParamField>

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

## 产物生命周期和存储

- 产物存储在临时子文件夹下：`$TMPDIR/openclaw-diffs`。
- 查看器产物元数据包含：
  - 随机产物 ID（20 个十六进制字符）
  - 随机令牌（48 个十六进制字符）
  - `createdAt` 和 `expiresAt`
  - 已存储的 `viewer.html` 路径
- 未指定时，默认产物 TTL 为 30 分钟。
- 可接受的最大查看器 TTL 为 6 小时。
- 清理会在产物创建后机会性运行。
- 已过期的产物会被删除。
- 当元数据缺失时，后备清理会移除超过 24 小时的陈旧文件夹。

## 查看器 URL 和网络行为

查看器路由：

- `/plugins/diffs/view/{artifactId}/{token}`

查看器资源：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

查看器文档会相对于查看器 URL 解析这些资源，因此可选的 `baseUrl` 路径前缀也会在这些资源请求中保留。

URL 构造行为：

- 如果提供了工具调用级别的 `baseUrl`，则会在严格校验后使用它。
- 否则，如果配置了插件级 `viewerBaseUrl`，则使用它。
- 如果两者都没有覆盖值，查看器 URL 默认使用 loopback `127.0.0.1`。
- 如果 Gateway 网关绑定模式为 `custom` 且设置了 `gateway.customBindHost`，则使用该主机。

`baseUrl` 规则：

- 必须是 `http://` 或 `https://`。
- 不接受 query 和 hash。
- 允许使用源地址加可选的基础路径。

## 安全模型

<AccordionGroup>
  <Accordion title="查看器加固">
    - 默认仅限 loopback。
    - 使用带令牌的查看器路径，并进行严格的 ID 和令牌校验。
    - 查看器响应 CSP：
      - `default-src 'none'`
      - 脚本和资源仅允许来自 self
      - 不允许出站 `connect-src`
    - 启用远程访问时，对远程未命中进行限流：
      - 每 60 秒 40 次失败
      - 锁定 60 秒（`429 Too Many Requests`）
  </Accordion>
  <Accordion title="文件渲染加固">
    - 截图浏览器请求路由默认拒绝。
    - 仅允许来自 `http://127.0.0.1/plugins/diffs/assets/*` 的本地查看器资源。
    - 外部网络请求会被阻止。
  </Accordion>
</AccordionGroup>

## 文件模式的浏览器要求

`mode: "file"` 和 `mode: "both"` 需要兼容 Chromium 的浏览器。

解析顺序：

<Steps>
  <Step title="配置">
    OpenClaw 配置中的 `browser.executablePath`。
  </Step>
  <Step title="环境变量">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  </Step>
  <Step title="平台回退">
    平台命令/路径发现回退机制。
  </Step>
</Steps>

常见失败文本：

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

可通过安装 Chrome、Chromium、Edge 或 Brave，或设置上述任一可执行文件路径选项来修复。

## 故障排除

<AccordionGroup>
  <Accordion title="输入校验错误">
    - `Provide patch or both before and after text.` — 请同时提供 `before` 和 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` — 不要混用输入模式。
    - `Invalid baseUrl: ...` — 使用带可选路径的 `http(s)` 源地址，不要带 query/hash。
    - `{field} exceeds maximum size (...)` — 请减小负载大小。
    - 大型 patch 被拒绝 — 请减少 patch 的文件数量或总行数。
  </Accordion>
  <Accordion title="查看器可访问性">
    - 查看器 URL 默认解析到 `127.0.0.1`。
    - 对于远程访问场景，可以选择以下任一方式：
      - 设置插件的 `viewerBaseUrl`，或
      - 在每次工具调用中传入 `baseUrl`，或
      - 使用 `gateway.bind=custom` 和 `gateway.customBindHost`
    - 如果 `gateway.trustedProxies` 为同主机代理包含了 loopback（例如 Tailscale Serve），那么不带转发客户端 IP 标头的原始 loopback 查看器请求会按设计以失败关闭方式处理。
    - 对于这种代理拓扑：
      - 如果你只需要附件，优先使用 `mode: "file"` 或 `mode: "both"`，或
      - 如果你需要可共享的查看器 URL，则有意启用 `security.allowRemoteViewer`，并设置插件的 `viewerBaseUrl` 或传入代理/公共 `baseUrl`
    - 仅当你确实需要外部查看器访问时，才启用 `security.allowRemoteViewer`。
  </Accordion>
  <Accordion title="未修改行没有展开按钮">
    对于 patch 输入，如果 patch 不携带可展开的上下文，就可能出现这种情况。这是预期行为，并不表示查看器失败。
  </Accordion>
  <Accordion title="找不到产物">
    - 产物因 TTL 到期而过期。
    - 令牌或路径已更改。
    - 清理过程移除了陈旧数据。
  </Accordion>
</AccordionGroup>

## 操作建议

- 对于 canvas 中的本地交互式审查，优先使用 `mode: "view"`。
- 对于需要附件的外发聊天渠道，优先使用 `mode: "file"`。
- 除非你的部署需要远程查看器 URL，否则请保持 `allowRemoteViewer` 为禁用状态。
- 对于敏感 diff，请设置显式且较短的 `ttlSeconds`。
- 在不必要时，避免在 diff 输入中发送机密信息。
- 如果你的渠道会对图像进行激进压缩（例如 Telegram 或 WhatsApp），优先使用 PDF 输出（`fileFormat: "pdf"`）。

<Note>
Diff 渲染引擎由 [Diffs](https://diffs.com) 提供支持。
</Note>

## 相关内容

- [Browser](/zh-CN/tools/browser)
- [插件](/zh-CN/tools/plugin)
- [工具概览](/zh-CN/tools)

---
read_when:
    - 你希望智能体以 diff 形式显示代码或 Markdown 编辑
    - 你想要一个可直接用于画布的查看器 URL，或一个已渲染的差异文件
    - 你需要采用安全默认设置的受控临时差异工件
sidebarTitle: Diffs
summary: 面向智能体的只读 diff 查看器和文件渲染器（可选插件工具）
title: Diffs
x-i18n:
    generated_at: "2026-05-01T20:41:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是一个可选插件工具，带有简短的内置系统指导和配套 Skills，可将变更内容转换为供智能体使用的只读 diff 工件。

它接受以下任一输入：

- `before` 和 `after` 文本
- 统一格式的 `patch`

它可以返回：

- 用于 canvas 展示的 Gateway 网关查看器 URL
- 用于消息投递的渲染文件路径（PNG 或 PDF）
- 一次调用同时返回两种输出

启用后，该插件会将简明的使用指导预置到系统提示空间中，并且还会暴露一个详细的 Skills，用于智能体需要更完整说明的场景。

## 快速开始

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        canvas 优先的流程：智能体使用 `mode: "view"` 调用 `diffs`，并用 `canvas present` 打开 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天文件投递：智能体使用 `mode: "file"` 调用 `diffs`，并通过使用 `path` 或 `filePath` 的 `message` 发送 `details.filePath`。
      </Tab>
      <Tab title="both">
        组合模式：智能体使用 `mode: "both"` 调用 `diffs`，以便在一次调用中获得两个工件。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 禁用内置系统指导

如果你想保持 `diffs` 工具启用，但禁用其内置系统提示指导，请将 `plugins.entries.diffs.hooks.allowPromptInjection` 设为 `false`：

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

这会阻止 diffs 插件的 `before_prompt_build` 钩子，同时保持插件、工具和配套 Skills 可用。

如果你想同时禁用指导和工具，请改为禁用该插件。

## 典型智能体工作流

<Steps>
  <Step title="Call diffs">
    智能体使用输入调用 `diffs` 工具。
  </Step>
  <Step title="Read details">
    智能体从响应中读取 `details` 字段。
  </Step>
  <Step title="Present">
    智能体可以用 `canvas present` 打开 `details.viewerUrl`，通过使用 `path` 或 `filePath` 的 `message` 发送 `details.filePath`，也可以两者都做。
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

除非特别说明，所有字段都是可选的。

<ParamField path="before" type="string">
  原始文本。当省略 `patch` 时，需要与 `after` 一起提供。
</ParamField>
<ParamField path="after" type="string">
  更新后的文本。当省略 `patch` 时，需要与 `before` 一起提供。
</ParamField>
<ParamField path="patch" type="string">
  统一 diff 文本。与 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  before 和 after 模式的显示文件名。
</ParamField>
<ParamField path="lang" type="string">
  before 和 after 模式的语言覆盖提示。未知值会回退为纯文本。
</ParamField>
<ParamField path="title" type="string">
  查看器标题覆盖值。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  输出模式。默认使用插件默认值 `defaults.mode`。已弃用别名：`"image"` 的行为类似 `"file"`，并且仍为向后兼容而接受。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  查看器主题。默认使用插件默认值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  diff 布局。默认使用插件默认值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  当完整上下文可用时展开未更改部分。仅限单次调用选项（不是插件默认键）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  渲染文件格式。默认使用插件默认值 `defaults.fileFormat`。
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
  查看器和独立文件输出的工件 TTL，单位为秒。最大值为 21600。
</ParamField>
<ParamField path="baseUrl" type="string">
  查看器 URL 来源覆盖值。覆盖插件 `viewerBaseUrl`。必须是 `http` 或 `https`，不能包含查询/hash。
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    为向后兼容仍然接受：

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` 和 `after` 各自最大 512 KiB。
    - `patch` 最大 2 MiB。
    - `path` 最大 2048 字节。
    - `lang` 最大 128 字节。
    - `title` 最大 1024 字节。
    - patch 复杂度上限：最多 128 个文件和 120000 总行数。
    - 同时提供 `patch` 和 `before` 或 `after` 会被拒绝。
    - 渲染文件安全限制（适用于 PNG 和 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 个渲染像素）。
      - `fileQuality: "hq"`：最大 14 MP（14,000,000 个渲染像素）。
      - `fileQuality: "print"`：最大 24 MP（24,000,000 个渲染像素）。
      - PDF 还最多 50 页。

  </Accordion>
</AccordionGroup>

## 输出详情契约

该工具会在 `details` 下返回结构化元数据。

<AccordionGroup>
  <Accordion title="Viewer fields">
    创建查看器的模式所共享的字段：

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context`（可用时包含 `agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

  </Accordion>
  <Accordion title="File fields">
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
  <Accordion title="Compatibility aliases">
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

| 模式     | 返回内容                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | 仅查看器字段。                                                                                                    |
| `"file"` | 仅文件字段，不创建查看器工件。                                                                                  |
| `"both"` | 查看器字段加文件字段。如果文件渲染失败，查看器仍会随 `fileError` 和 `imageError` 别名返回。 |

## 折叠的未更改部分

- 查看器可以显示类似 `N unmodified lines` 的行。
- 这些行上的展开控件是有条件的，并不保证适用于每种输入类型。
- 当渲染后的 diff 具有可展开的上下文数据时，会显示展开控件，这对于 before 和 after 输入很常见。
- 对于许多统一 patch 输入，被省略的上下文正文在解析后的 patch hunk 中不可用，因此该行可能出现但没有展开控件。这是预期行为。
- `expandUnchanged` 仅在存在可展开上下文时生效。

## 插件默认值

在 `~/.openclaw/openclaw.json` 中设置插件范围的默认值：

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

### 持久查看器 URL 配置

<ParamField path="viewerBaseUrl" type="string">
  当工具调用未传递 `baseUrl` 时，由插件拥有的已返回查看器链接回退值。必须是 `http` 或 `https`，不能包含查询/hash。
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
  `false`：拒绝对查看器路由的非 loopback 请求。`true`：如果带 token 的路径有效，则允许远程查看器。
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

## 工件生命周期和存储

- 工件存储在临时子文件夹下：`$TMPDIR/openclaw-diffs`。
- 查看器工件元数据包含：
  - 随机工件 ID（20 个十六进制字符）
  - 随机 token（48 个十六进制字符）
  - `createdAt` 和 `expiresAt`
  - 已存储的 `viewer.html` 路径
- 未指定时，默认工件 TTL 为 30 分钟。
- 可接受的最大查看器 TTL 为 6 小时。
- 清理会在工件创建后机会性运行。
- 过期工件会被删除。
- 当元数据缺失时，回退清理会移除超过 24 小时的陈旧文件夹。

## 查看器 URL 和网络行为

查看器路由：

- `/plugins/diffs/view/{artifactId}/{token}`

查看器资源：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

查看器文档会相对于查看器 URL 解析这些资源，因此可选的 `baseUrl` 路径前缀也会同时保留用于资源请求。

URL 构造行为：

- 如果提供了工具调用 `baseUrl`，会在严格校验后使用它。
- 否则如果配置了插件 `viewerBaseUrl`，则使用它。
- 如果两者都没有覆盖，查看器 URL 默认使用 loopback `127.0.0.1`。
- 如果 Gateway 网关绑定模式为 `custom` 且设置了 `gateway.customBindHost`，则会使用该主机。

`baseUrl` 规则：

- 必须是 `http://` 或 `https://`。
- 查询和 hash 会被拒绝。
- 允许来源加可选基础路径。

## 安全模型

<AccordionGroup>
  <Accordion title="查看器加固">
    - 默认仅限 local loopback。
    - 使用令牌化查看器路径，并进行严格的 ID 和令牌验证。
    - 查看器响应 CSP：
      - `default-src 'none'`
      - 脚本和资源仅来自自身
      - 无出站 `connect-src`
    - 启用远程访问时进行远程未命中节流：
      - 每 60 秒 40 次失败
      - 60 秒锁定（`429 Too Many Requests`）

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
    平台命令/路径发现回退。
  </Step>
</Steps>

常见失败文本：

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

可通过安装 Chrome、Chromium、Edge 或 Brave，或设置上述某个可执行文件路径选项来修复。

## 故障排除

<AccordionGroup>
  <Accordion title="输入验证错误">
    - `Provide patch or both before and after text.` — 同时包含 `before` 和 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` — 不要混用输入模式。
    - `Invalid baseUrl: ...` — 使用带可选路径的 `http(s)` 源，不要包含查询/哈希。
    - `{field} exceeds maximum size (...)` — 减小载荷大小。
    - 大补丁被拒绝 — 减少补丁文件数量或总行数。

  </Accordion>
  <Accordion title="查看器可访问性">
    - 默认情况下，查看器 URL 解析到 `127.0.0.1`。
    - 对于远程访问场景，可以：
      - 设置插件 `viewerBaseUrl`，或
      - 在每次工具调用中传递 `baseUrl`，或
      - 使用 `gateway.bind=custom` 和 `gateway.customBindHost`
    - 如果 `gateway.trustedProxies` 包含用于同主机代理的 loopback（例如 Tailscale Serve），没有转发客户端 IP 标头的原始 loopback 查看器请求会按设计关闭失败。
    - 对于该代理拓扑：
      - 当你只需要附件时，优先使用 `mode: "file"` 或 `mode: "both"`，或
      - 当你需要可分享的查看器 URL 时，有意启用 `security.allowRemoteViewer` 并设置插件 `viewerBaseUrl`，或传递代理/公共 `baseUrl`
    - 仅在你打算允许外部查看器访问时启用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行没有展开按钮">
    当补丁输入不包含可展开上下文时，可能会发生这种情况。这是预期行为，并不表示查看器失败。
  </Accordion>
  <Accordion title="找不到制品">
    - 制品因 TTL 过期。
    - 令牌或路径已更改。
    - 清理移除了过期数据。

  </Accordion>
</AccordionGroup>

## 运维指导

- 对于画布中的本地交互式审阅，优先使用 `mode: "view"`。
- 对于需要附件的出站聊天渠道，优先使用 `mode: "file"`。
- 除非你的部署需要远程查看器 URL，否则保持 `allowRemoteViewer` 禁用。
- 为敏感 diff 设置明确且较短的 `ttlSeconds`。
- 不需要时，避免在 diff 输入中发送密钥。
- 如果你的渠道会激进压缩图片（例如 Telegram 或 WhatsApp），优先使用 PDF 输出（`fileFormat: "pdf"`）。

<Note>
Diff 渲染引擎由 [Diffs](https://diffs.com) 提供支持。
</Note>

## 相关

- [浏览器](/zh-CN/tools/browser)
- [插件](/zh-CN/tools/plugin)
- [工具概览](/zh-CN/tools)

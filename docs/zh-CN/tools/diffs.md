---
read_when:
    - 你希望智能体将代码或 Markdown 编辑显示为 Diffs
    - 你需要一个可直接用于画布的查看器 URL，或一个已渲染的 diff 文件
    - 你需要具备安全默认设置的受控临时 diff 工件
sidebarTitle: Diffs
summary: 面向智能体的只读 diff 查看器和文件渲染器（可选插件工具）
title: Diffs
x-i18n:
    generated_at: "2026-07-05T11:43:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a141f52de686717e7e67a50c2ce7cc83a16a17a9ff9faf7aaedaca1c433987a9
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是一个可选的内置插件工具，可将前后文本或 unified patch 转换为只读 diff artifact。它还会在 system prompt 前加入简短的 Agent 指引，并附带一个配套 skill，用于提供更完整的说明。

输入：`before` + `after` 文本，或 unified `patch`（二者互斥）。

输出：用于 canvas 呈现的 Gateway 网关 viewer URL、用于消息投递的已渲染 PNG/PDF 文件路径，或两者都有。

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
        Canvas 优先的流程：Agent 使用 `mode: "view"` 调用 `diffs`，并通过 `canvas present` 打开 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天文件投递：Agent 使用 `mode: "file"` 调用 `diffs`，并通过带有 `path` 或 `filePath` 的 `message` 发送 `details.filePath`。
      </Tab>
      <Tab title="both">
        组合模式（默认）：Agent 使用 `mode: "both"` 调用 `diffs`，在一次调用中获得两种 artifact。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 禁用内置 system 指引

若要保留工具但移除前置的 system-prompt 指引，请将 `plugins.entries.diffs.hooks.allowPromptInjection` 设置为 `false`：

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

这会阻止插件的 `before_prompt_build` 钩子，同时保留工具和 skill 可用。若要同时禁用指引和工具，请改为禁用该插件。

## 工具输入参考

除非另有说明，所有字段都是可选的。

<ParamField path="before" type="string">
  原始文本。省略 `patch` 时，需与 `after` 一起提供。
</ParamField>
<ParamField path="after" type="string">
  更新后的文本。省略 `patch` 时，需与 `before` 一起提供。
</ParamField>
<ParamField path="patch" type="string">
  Unified diff 文本。与 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  before/after 模式下显示的文件名。
</ParamField>
<ParamField path="lang" type="string">
  before/after 模式下的语言覆盖提示。未知值和默认 viewer 集合之外的语言会回退为纯文本，除非安装了 Diff Viewer Language Pack 插件。
</ParamField>
<ParamField path="title" type="string">
  Viewer 标题覆盖值。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  输出模式。默认使用插件默认值 `defaults.mode`（`both`）。已弃用别名：`"image"` 的行为与 `"file"` 完全相同。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  Viewer 主题。默认使用插件默认值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff 布局。默认使用插件默认值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  在完整上下文可用时展开未变更的部分。仅作为单次调用选项（不是插件默认键）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  已渲染文件格式。默认使用插件默认值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF 渲染的质量预设。
</ParamField>
<ParamField path="fileScale" type="number">
  设备缩放覆盖值（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  最大渲染宽度，单位为 CSS 像素（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  Viewer 和独立文件输出的 artifact TTL，单位为秒。最大值为 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  Viewer URL origin 覆盖值。覆盖插件的 `viewerBaseUrl`。必须为 `http` 或 `https`，且不能包含 query/hash。
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    为了向后兼容，仍然接受：

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before`/`after`：每个最大 512 KiB。
    - `patch`：最大 2 MiB。
    - `path`：最大 2048 字节。
    - `lang`：最大 128 字节。
    - `title`：最大 1024 字节。
    - Patch 复杂度上限：最多 128 个文件和 120000 行总行数。
    - `patch` 与 `before`/`after` 同时提供会被拒绝。
    - 已渲染文件安全限制（PNG 和 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 个渲染像素）。
      - `fileQuality: "hq"`：最大 14 MP。
      - `fileQuality: "print"`：最大 24 MP。
      - PDF 还限制最多 50 页。

  </Accordion>
</AccordionGroup>

## 语法高亮

内置语言：

`javascript`、`typescript`、`tsx`、`jsx`、`json`、`markdown`、`yaml`、`css`、`html`、`sh`、`python`、`go`、`rust`、`java`、`c`、`cpp`、`csharp`、`php`、`sql`、`docker`、`ruby`、`swift`、`kotlin`、`r`、`dart`、`lua`、`powershell`、`xml` 和 `toml`。

常见别名（`js`、`ts`、`bash`、`md`、`yml`、`c++`、`dockerfile`、`rb`、`kt`、`ps1` 等）会规范化为这些语言。

安装 Diff Viewer Language Pack 插件可支持更多语言（Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diff 等）：

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

没有该语言包时，不受支持的语言仍会渲染为可读的纯文本。请参阅 [Diffs Language Pack 插件](/zh-CN/plugins/reference/diffs-language-pack) 和 [Shiki 语言](https://shiki.style/languages) 了解上游目录。

## 输出详情契约

<AccordionGroup>
  <Accordion title="Viewer fields (view and both modes)">
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
  <Accordion title="File fields (file and both modes)">
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（与 `filePath` 值相同，用于消息工具兼容）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases (always returned)">
    - `format`（= `fileFormat`）
    - `imagePath`（= `filePath`）
    - `imageBytes`（= `fileBytes`）
    - `imageQuality`（= `fileQuality`）
    - `imageScale`（= `fileScale`）
    - `imageMaxWidth`（= `fileMaxWidth`）

  </Accordion>
</AccordionGroup>

| 模式     | 返回内容                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | 仅查看器字段。                                                                                          |
| `"file"` | 仅文件字段，不含查看器工件。                                                                        |
| `"both"` | 查看器字段加文件字段。如果文件渲染失败，查看器仍会返回，并带有 `fileError`/`imageError`。 |

### 折叠的未更改部分

查看器会显示类似 `N unmodified lines` 的行。只有当渲染后的 diff 具有可展开的上下文数据时，展开控件才会出现（before/after 输入通常如此）。许多 unified patch 在其 hunk 中省略上下文正文，因此该行可能没有展开控件 -- 这是预期行为，不是问题。`expandUnchanged` 仅在存在可展开上下文时适用。

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
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

支持的 `defaults` 键：`fontFamily`、`fontSize`、`lineSpacing`、`layout`、`showLineNumbers`、`diffIndicators`、`wordWrap`、`background`、`theme`、`fileFormat`、`fileQuality`、`fileScale`、`fileMaxWidth`、`mode`、`ttlSeconds`。显式工具调用参数会覆盖这些值。

### 持久化查看器 URL 配置

<ParamField path="viewerBaseUrl" type="string">
  当工具调用未传入 `baseUrl` 时，用于返回查看器链接的插件自有后备值。必须是 `http` 或 `https`，且不能包含查询/哈希。
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
  `false`：拒绝访问查看器路由的非 local loopback 请求。`true`：如果令牌化路径有效，则允许远程查看器。
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

- 工件位于 `$TMPDIR/openclaw-diffs` 下。
- 查看器元数据会存储一个随机的 20 位十六进制字符工件 ID、一个随机的 48 位十六进制字符令牌、`createdAt`/`expiresAt`，以及已存储的 `viewer.html` 路径。
- 默认工件 TTL：30 分钟。接受的最大 TTL：6 小时。
- 每次创建工件调用后会伺机运行清理；过期工件会被删除。
- 当元数据缺失时，后备扫描会移除超过 24 小时的陈旧文件夹。

## 查看器 URL 和网络行为

查看器路由：`/plugins/diffs/view/{artifactId}/{token}`

查看器资源：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（仅当 diff 使用语言包语言时）

查看器文档会相对于查看器 URL 解析这些资源，因此可选的 `baseUrl` 路径前缀也会传递到资源请求。

URL 解析顺序：工具调用的 `baseUrl`（严格验证后）-> 插件 `viewerBaseUrl` -> 默认 local loopback `127.0.0.1`。如果 Gateway 网关绑定模式是 `custom` 且设置了 `gateway.customBindHost`，则使用该主机而不是 local loopback。

`baseUrl` 规则：必须是 `http://` 或 `https://`；查询和哈希会被拒绝；允许源加可选的基础路径。

## 安全模型

<AccordionGroup>
  <Accordion title="查看器加固">
    - 默认仅允许 local loopback。
    - 使用带令牌的查看器路径，并进行严格的 ID 和令牌模式验证。
    - 查看器响应 CSP：`default-src 'none'`；脚本/资源仅来自自身；无出站 `connect-src`。
    - 启用远程访问时会对远程未命中限流：60 秒内 40 次失败会触发 60 秒锁定（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="文件渲染加固">
    - 截图浏览器请求路由默认拒绝。
    - 仅允许来自 `http://127.0.0.1/plugins/diffs/assets/*` 的本地查看器资源。
    - 外部网络请求会被阻止。

  </Accordion>
</AccordionGroup>

## 文件模式的浏览器要求

`mode: "file"` 和 `mode: "both"` 需要 Chromium 兼容浏览器。

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
    Chrome、Chromium、Edge 和 Brave 的常见安装路径以及 `PATH` 查找。
  </Step>
</Steps>

常见失败文本：`Diff PNG/PDF rendering requires a Chromium-compatible browser...`。通过安装 Chrome、Chromium、Edge 或 Brave，或设置上面的某个可执行文件路径选项来修复。

## 故障排查

<AccordionGroup>
  <Accordion title="输入验证错误">
    - `Provide patch or both before and after text.` -- 同时包含 `before` 和 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` -- 不要混用输入模式。
    - `Invalid baseUrl: ...` -- 使用带可选路径的 `http(s)` 源，不要包含查询字符串或哈希。
    - `{field} exceeds maximum size (...)` -- 减小载荷大小。
    - 大型 patch 被拒绝 -- 减少 patch 文件数量或总行数。

  </Accordion>
  <Accordion title="查看器可访问性">
    - 查看器 URL 默认解析到 `127.0.0.1`。
    - 如需远程访问，可以设置插件 `viewerBaseUrl`、在每次调用时传入 `baseUrl`，或将 `gateway.bind=custom` 与 `gateway.customBindHost` 配合使用。
    - 如果 `gateway.trustedProxies` 为同主机代理（例如 Tailscale Serve）包含回环地址，则没有转发客户端 IP 标头的原始回环查看器请求会按设计以关闭方式失败。
    - 对于该代理拓扑，建议为附件使用 `mode: "file"`/`"both"`，或有意启用 `security.allowRemoteViewer` 并配合插件 `viewerBaseUrl`/代理 `baseUrl` 来生成可共享的查看器链接。
    - 仅当确实需要外部查看器访问时，才启用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行没有展开按钮">
    对于缺少可展开上下文的 patch 输入，这是预期情况；不是查看器故障。
  </Accordion>
  <Accordion title="未找到构件">
    - 构件因 TTL 过期。
    - 令牌或路径已更改。
    - 清理移除了过期数据。

  </Accordion>
</AccordionGroup>

## 操作指导

- 在画布中进行本地交互式审查时，优先使用 `mode: "view"`。
- 对需要附件的出站聊天渠道，优先使用 `mode: "file"`。
- 除非你的部署需要远程查看器 URL，否则保持 `allowRemoteViewer` 禁用。
- 对敏感 diff 设置明确且较短的 `ttlSeconds`。
- 非必要时，避免在 diff 输入中发送机密信息。
- 如果你的渠道会强力压缩图片（例如 Telegram 或 WhatsApp），请优先使用 PDF 输出（`fileFormat: "pdf"`）。

<Note>
Diff 渲染引擎由 [Diffs](https://diffs.com) 提供支持。
</Note>

## 相关

- [Browser](/zh-CN/tools/browser)
- [插件](/zh-CN/tools/plugin)
- [工具概览](/zh-CN/tools)

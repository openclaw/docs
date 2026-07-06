---
read_when:
    - 你希望智能体以 Diffs 形式显示代码或 Markdown 编辑
    - 你想要一个可直接用于画布的查看器 URL，或一个渲染后的 diff 文件
    - 你需要带有安全默认值、受控且临时的差异工件
sidebarTitle: Diffs
summary: 只读 diff 查看器和面向智能体的文件渲染器（可选插件工具）
title: Diffs
x-i18n:
    generated_at: "2026-07-06T21:50:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9c70e665bdc13e0534060700c4fb7cfcf2d57fba69b884c4e782201236f13cb
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是一个可选的内置插件工具，可将前后文本或统一补丁转换为只读 diff 工件。它还会将简短的智能体指引前置到系统提示中，并附带一个配套 Skills，用于提供更完整的说明。

输入：`before` + `after` 文本，或统一 `patch`（互斥）。

输出：用于画布呈现的 Gateway 网关查看器 URL、用于消息投递的已渲染 PNG/PDF 文件路径，或两者都有。

## 快速开始

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        画布优先流程：智能体使用 `mode: "view"` 调用 `diffs`，并通过 `canvas present` 打开 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天文件投递：智能体使用 `mode: "file"` 调用 `diffs`，并用 `message` 通过 `path` 或 `filePath` 发送 `details.filePath`。
      </Tab>
      <Tab title="both">
        组合模式（默认）：智能体使用 `mode: "both"` 调用 `diffs`，在一次调用中获取两个工件。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 禁用内置系统指引

若要保留工具但移除前置的系统提示指引，请将 `plugins.entries.diffs.hooks.allowPromptInjection` 设置为 `false`：

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

这会阻止插件的 `before_prompt_build` 钩子，同时保留工具和 Skills 可用。若要同时禁用指引和工具，请改为禁用该插件。

## 工具输入参考

除非另有说明，所有字段都是可选的。

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
  before/after 模式的显示文件名。
</ParamField>
<ParamField path="lang" type="string">
  before/after 模式的语言覆盖提示。未知值以及默认查看器集合之外的语言会回退为纯文本，除非安装了
  Diff Viewer Language Pack 插件。
</ParamField>
<ParamField path="title" type="string">
  查看器标题覆盖。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  输出模式。默认使用插件默认值 `defaults.mode`（`both`）。已弃用别名：`"image"` 的行为与 `"file"` 完全相同。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  查看器主题。默认使用插件默认值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff 布局。默认使用插件默认值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  在完整上下文可用时展开未更改的部分。仅限单次调用选项（不是插件默认键）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  渲染文件格式。默认使用插件默认值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF 渲染的质量预设。
</ParamField>
<ParamField path="fileScale" type="number">
  设备缩放覆盖（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  最大渲染宽度，以 CSS 像素计（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  查看器和独立文件输出的工件 TTL，以秒为单位。最大值 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  查看器 URL 源覆盖。覆盖插件 `viewerBaseUrl`。必须是 `http` 或 `https`，且没有 query/hash。
</ParamField>

<AccordionGroup>
  <Accordion title="旧版输入别名">
    为了向后兼容，仍然接受：

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="验证和限制">
    - `before`/`after`：每个最大 512 KiB。
    - `patch`：最大 2 MiB。
    - `path`：最大 2048 字节。
    - `lang`：最大 128 字节。
    - `title`：最大 1024 字节。
    - 补丁复杂度上限：最多 128 个文件和 120000 行总行数。
    - `patch` 与 `before`/`after` 同时提供会被拒绝。
    - 渲染文件安全限制（PNG 和 PDF）：
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

没有该包时，不受支持的语言仍会以可读的纯文本渲染。请参阅 [Diffs Language Pack 插件](/zh-CN/plugins/reference/diffs-language-pack) 和 [Shiki 语言](https://shiki.style/languages)，了解上游目录。

## 输出详情契约

所有成功结果都包含 `changed`：相同的 before/after 输入会返回 `false`，且不会创建工件；已渲染结果会返回 `true`。

<AccordionGroup>
  <Accordion title="查看器字段（view 和 both 模式）">
    - `changed`
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
  <Accordion title="文件字段（file 和 both 模式）">
    - `changed`
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
  <Accordion title="兼容性别名（始终返回）">
    - `format` (= `fileFormat`)
    - `imagePath` (= `filePath`)
    - `imageBytes` (= `fileBytes`)
    - `imageQuality` (= `fileQuality`)
    - `imageScale` (= `fileScale`)
    - `imageMaxWidth` (= `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

| 模式     | 返回内容                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | 仅查看器字段。                                                                                          |
| `"file"` | 仅文件字段，不含查看器工件。                                                                        |
| `"both"` | 查看器字段加文件字段。如果文件渲染失败，查看器仍会返回，并带有 `fileError`/`imageError`。 |

### 折叠未更改部分

查看器会显示类似 `N unmodified lines` 的行。只有当渲染后的 diff 具有可展开的上下文数据时，展开控件才会出现（通常用于前后对比输入）。许多 unified patch 会在其 hunk 中省略上下文正文，因此该行可能出现但没有展开控件 -- 这是预期行为，不是 bug。`expandUnchanged` 仅在存在可展开上下文时适用。

### 多文件导航

触及多个文件的 patch 会以已更改文件摘要卡片开头：总 `+N` / `-N` 计数、每文件计数、已添加/已删除/已重命名徽标，以及跳转到各文件的锚点链接。渲染后的 PNG/PDF 文件会保留每文件头部计数，但移除交互式视图切换控件，因为这些控件在静态文件中无效。

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
  `false`：拒绝发往查看器路由的非回环请求。`true`：如果带令牌的路径有效，则允许远程查看器。
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
- 每次创建工件调用后会机会性地运行清理；过期工件会被删除。
- 当元数据缺失时，后备清扫会移除早于 24 小时的过时文件夹。

## 查看器 URL 和网络行为

查看器路由：`/plugins/diffs/view/{artifactId}/{token}`

查看器资源：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（仅当 diff 使用语言包语言时）

查看器文档会相对于查看器 URL 解析这些资源，因此可选的 `baseUrl` 路径前缀也会传递到资源请求。

URL 解析顺序：工具调用的 `baseUrl`（经过严格验证后）-> 插件 `viewerBaseUrl` -> 默认回环 `127.0.0.1`。如果 Gateway 网关绑定模式为 `custom` 且设置了 `gateway.customBindHost`，则使用该主机而不是回环地址。

`baseUrl` 规则：必须是 `http://` 或 `https://`；查询和哈希会被拒绝；允许来源加可选基础路径。

## 安全模型

<AccordionGroup>
  <Accordion title="查看器加固">
    - 默认仅限回环访问。
    - 使用令牌化的查看器路径，并严格验证 ID 和令牌模式。
    - 查看器响应 CSP：`default-src 'none'`；脚本/资产仅来自自身；无出站 `connect-src`。
    - 启用远程访问时对远程未命中进行限流：每 60 秒 40 次失败会触发 60 秒锁定（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="文件渲染加固">
    - 截图浏览器请求路由默认拒绝。
    - 仅允许来自 `http://127.0.0.1/plugins/diffs/assets/*` 的本地查看器资产。
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
    - `Invalid baseUrl: ...` -- 使用带可选路径的 `http(s)` 来源，不要包含查询/哈希。
    - `{field} exceeds maximum size (...)` -- 减小载荷大小。
    - 大型补丁被拒绝 -- 减少补丁文件数量或总行数。

  </Accordion>
  <Accordion title="查看器可访问性">
    - 查看器 URL 默认解析到 `127.0.0.1`。
    - 对于远程访问，可以设置插件 `viewerBaseUrl`、每次调用传入 `baseUrl`，或使用 `gateway.bind=custom` 搭配 `gateway.customBindHost`。
    - 如果 `gateway.trustedProxies` 包含用于同主机代理的回环地址（例如 Tailscale Serve），没有转发客户端 IP 标头的原始回环查看器请求会按设计失败关闭。
    - 对于该代理拓扑，优先使用 `mode: "file"`/`"both"` 作为附件，或有意启用 `security.allowRemoteViewer` 并配合插件 `viewerBaseUrl`/代理 `baseUrl` 来生成可共享的查看器链接。
    - 仅在确实需要外部查看器访问时启用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行没有展开按钮">
    对于缺少可展开上下文的补丁输入，这是预期行为；不是查看器故障。
  </Accordion>
  <Accordion title="找不到工件">
    - 工件因 TTL 过期。
    - 令牌或路径已更改。
    - 清理移除了过期数据。

  </Accordion>
</AccordionGroup>

## 运维指导

- 对于画布中的本地交互式审查，优先使用 `mode: "view"`。
- 对于需要附件的出站聊天渠道，优先使用 `mode: "file"`。
- 除非你的部署需要远程查看器 URL，否则保持 `allowRemoteViewer` 禁用。
- 为敏感 Diffs 设置明确且较短的 `ttlSeconds`。
- 不需要时，避免在 diff 输入中发送密钥。
- 如果你的渠道会强力压缩图片（例如 Telegram 或 WhatsApp），优先使用 PDF 输出（`fileFormat: "pdf"`）。

<Note>
Diff 渲染引擎由 [Diffs](https://diffs.com) 提供支持。
</Note>

## 相关

- [浏览器](/zh-CN/tools/browser)
- [插件](/zh-CN/tools/plugin)
- [工具概览](/zh-CN/tools)

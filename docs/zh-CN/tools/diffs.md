---
read_when:
    - 你希望智能体以 Diffs 形式显示代码或 Markdown 编辑内容
    - 你需要一个可在 Canvas 中使用的查看器 URL 或渲染后的差异文件
    - 你需要采用安全默认设置、可控且临时的差异工件
sidebarTitle: Diffs
summary: 面向智能体的只读 Diffs 查看器和文件渲染器（可选插件工具）
title: Diffs
x-i18n:
    generated_at: "2026-07-12T14:47:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是一个可选的内置插件工具，可将前后文本或统一补丁转换为只读 diff 工件。它还会在系统提示词前添加简短的智能体指导，并附带一个配套 Skill，提供更完整的说明。

输入：`before` + `after` 文本，或统一格式的 `patch`（互斥）。

输出：用于画布呈现的 Gateway 网关查看器 URL、用于消息传递的渲染后 PNG/PDF 文件路径，或两者兼有。

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
        聊天文件传递：智能体使用 `mode: "file"` 调用 `diffs`，并通过 `message` 使用 `path` 或 `filePath` 发送 `details.filePath`。
      </Tab>
      <Tab title="both">
        组合模式（默认）：智能体使用 `mode: "both"` 调用 `diffs`，在一次调用中获取两种工件。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 禁用内置系统指导

若要保留工具但移除前置的系统提示词指导，请将 `plugins.entries.diffs.hooks.allowPromptInjection` 设置为 `false`：

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

这会阻止插件的 `before_prompt_build` 钩子，同时仍保留工具和 Skill。若要同时禁用指导和工具，请改为禁用插件。

## 工具输入参考

除非另有说明，否则所有字段均为可选。

<ParamField path="before" type="string">
  原始文本。省略 `patch` 时，必须与 `after` 一起提供。
</ParamField>
<ParamField path="after" type="string">
  更新后的文本。省略 `patch` 时，必须与 `before` 一起提供。
</ParamField>
<ParamField path="patch" type="string">
  统一 diff 文本。与 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  前后对比模式下显示的文件名。
</ParamField>
<ParamField path="lang" type="string">
  前后对比模式下的语言覆盖提示。未知值和默认查看器集合之外的语言会回退为纯文本，除非已安装
  Diff Viewer Language Pack 插件。
</ParamField>
<ParamField path="title" type="string">
  覆盖查看器标题。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  输出模式。默认为插件默认值 `defaults.mode`（`both`）。已弃用的别名：`"image"` 的行为与 `"file"` 完全相同。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  查看器主题。默认为插件默认值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff 布局。默认为插件默认值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  在完整上下文可用时展开未更改的部分。仅限单次调用的选项（不是插件默认键）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  渲染后的文件格式。默认为插件默认值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF 渲染的质量预设。
</ParamField>
<ParamField path="fileScale" type="number">
  设备缩放比例覆盖值（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  以 CSS 像素为单位的最大渲染宽度（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  查看器和独立文件输出的工件 TTL，以秒为单位。最大值为 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  查看器 URL 来源覆盖值。覆盖插件的 `viewerBaseUrl`。必须为 `http` 或 `https`，且不得包含查询参数或哈希。
</ParamField>

<AccordionGroup>
  <Accordion title="验证和限制">
    - `before`/`after`：每个最大 512 KiB。
    - `patch`：最大 2 MiB。
    - `path`：最大 2048 字节。
    - `lang`：最大 128 字节。
    - `title`：最大 1024 字节。
    - 补丁复杂度上限：最多 128 个文件，总行数最多 120000 行。
    - 同时提供 `patch` 和 `before`/`after` 会被拒绝。
    - 渲染文件的安全限制（PNG 和 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 个渲染像素）。
      - `fileQuality: "hq"`：最大 14 MP。
      - `fileQuality: "print"`：最大 24 MP。
      - PDF 还限制为最多 50 页。

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

未安装该语言包时，不受支持的语言仍会渲染为易读的纯文本。有关上游语言目录，请参阅 [Diffs Language Pack 插件](/zh-CN/plugins/reference/diffs-language-pack) 和 [Shiki 语言](https://shiki.style/languages)。

## 输出详情契约

所有成功结果都包含 `changed`：如果前后输入相同，则返回 `false` 且不创建工件；渲染后的结果返回 `true`。

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
    - `path`（与 `filePath` 的值相同，用于兼容消息工具）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| 模式     | 返回内容                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | 仅查看器字段。                                                                             |
| `"file"` | 仅文件字段，不创建查看器工件。                                                           |
| `"both"` | 查看器字段加文件字段。如果文件渲染失败，查看器仍会返回，并包含 `fileError`。 |

### 折叠的未更改部分

查看器会显示类似 `N unmodified lines` 的行。仅当渲染后的差异包含可展开的上下文数据时（通常见于 before/after 输入），才会出现展开控件。许多统一格式补丁的区块中不包含上下文正文，因此可能会出现该行但没有展开控件——这是预期行为，并非错误。`expandUnchanged` 仅在存在可展开上下文时适用。

### 多文件导航

涉及多个文件的补丁会以已更改文件摘要卡片开头，其中包含 `+N` / `-N` 总计数、各文件计数、新增/删除/重命名徽标，以及可跳转到每个文件的锚点链接。渲染后的 PNG/PDF 文件会保留各文件标题中的计数，但会移除交互式视图切换控件，因为这些控件在静态文件中无法使用。

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

支持的 `defaults` 键：`fontFamily`、`fontSize`、`lineSpacing`、`layout`、`showLineNumbers`、`diffIndicators`、`wordWrap`、`background`、`theme`、`fileFormat`、`fileQuality`、`fileScale`、`fileMaxWidth`、`mode`、`ttlSeconds`。显式的工具调用参数会覆盖这些默认值。

### 持久化查看器 URL 配置

<ParamField path="viewerBaseUrl" type="string">
  当工具调用未传入 `baseUrl` 时，用于返回查看器链接的插件自有回退值。必须使用 `http` 或 `https`，且不得包含查询字符串或哈希片段。
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
  `false`：拒绝对查看器路由的非回环请求。`true`：如果带令牌的路径有效，则允许远程查看器访问。
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
- 查看器元数据存储一个随机的 20 位十六进制字符工件 ID、一个随机的 48 位十六进制字符令牌、`createdAt`/`expiresAt`，以及已存储的 `viewer.html` 路径。
- 默认工件 TTL：30 分钟。可接受的最大 TTL：6 小时。
- 每次创建工件调用后都会择机运行清理；过期工件将被删除。
- 元数据缺失时，后备清理会移除早于 24 小时的陈旧文件夹。

## 查看器 URL 和网络行为

查看器路由：`/plugins/diffs/view/{artifactId}/{token}`

查看器资源：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（仅当 diff 使用语言包中的语言时）

查看器文档会相对于查看器 URL 解析这些资源，因此可选的 `baseUrl` 路径前缀也会沿用到资源请求中。

URL 解析顺序：工具调用的 `baseUrl`（经过严格验证后）-> 插件的 `viewerBaseUrl` -> 默认 local loopback `127.0.0.1`。如果 Gateway 网关绑定模式为 `custom` 且已设置 `gateway.customBindHost`，则使用该主机而不是 local loopback。

`baseUrl` 规则：必须为 `http://` 或 `https://`；不允许查询字符串和哈希；允许使用源站加可选的基础路径。

## 安全模型

<AccordionGroup>
  <Accordion title="查看器加固">
    - 默认仅限 local loopback。
    - 令牌化查看器路径，并严格验证 ID 和令牌模式。
    - 查看器响应 CSP：`default-src 'none'`；脚本/资源仅允许来自自身；禁止出站 `connect-src`。
    - 启用远程访问时对远程未命中请求进行限流：60 秒内失败 40 次会触发 60 秒锁定（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="文件渲染加固">
    - 截图浏览器请求路由默认拒绝。
    - 仅允许来自 `http://127.0.0.1/plugins/diffs/assets/*` 的本地查看器资源。
    - 阻止外部网络请求。

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
  <Step title="平台回退机制">
    Chrome、Chromium、Edge 和 Brave 的常见安装路径及 `PATH` 查找。
  </Step>
</Steps>

常见失败文本：`Diff PNG/PDF rendering requires a Chromium-compatible browser...`。安装 Chrome、Chromium、Edge 或 Brave，或者设置上述任一可执行文件路径选项，即可修复。

## 故障排查

<AccordionGroup>
  <Accordion title="输入验证错误">
    - `Provide patch or both before and after text.`——同时提供 `before` 和 `after`，或者提供 `patch`。
    - `Provide either patch or before/after input, not both.`——不要混用输入模式。
    - `Invalid baseUrl: ...`——使用可带路径但不含查询参数或哈希的 `http(s)` 源。
    - `{field} exceeds maximum size (...)`——减小负载大小。
    - 大型补丁被拒绝——减少补丁文件数量或总行数。

  </Accordion>
  <Accordion title="查看器可访问性">
    - 默认情况下，查看器 URL 解析为 `127.0.0.1`。
    - 如需远程访问，可以设置插件的 `viewerBaseUrl`、在每次调用中传入 `baseUrl`，或将 `gateway.bind=custom` 与 `gateway.customBindHost` 搭配使用。
    - 如果 `gateway.trustedProxies` 针对同一主机上的代理（例如 Tailscale Serve）包含环回地址，则不带转发客户端 IP 标头的原始环回查看器请求会按设计以失败关闭方式处理。
    - 对于这种代理拓扑，优先使用 `mode: "file"`/`"both"` 来提供附件；或者有意启用 `security.allowRemoteViewer`，并配合插件的 `viewerBaseUrl`/代理的 `baseUrl` 来生成可共享的查看器链接。
    - 仅在确实需要外部查看器访问时启用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行所在行没有展开按钮">
    对于缺少可展开上下文的补丁输入，这是预期行为，并非查看器故障。
  </Accordion>
  <Accordion title="未找到工件">
    - 工件因 TTL 到期。
    - 令牌或路径已更改。
    - 清理操作移除了过期数据。

  </Accordion>
</AccordionGroup>

## 运维指导

- 在画布中进行本地交互式审查时，优先使用 `mode: "view"`。
- 对于需要附件的出站聊天渠道，优先使用 `mode: "file"`。
- 除非你的部署需要远程查看器 URL，否则请保持禁用 `allowRemoteViewer`。
- 对于敏感差异，请显式设置较短的 `ttlSeconds`。
- 非必要时，避免在差异输入中发送机密信息。
- 如果你的渠道会大幅压缩图像（例如 Telegram 或 WhatsApp），请优先选择 PDF 输出（`fileFormat: "pdf"`）。

<Note>
差异渲染引擎由 [Diffs](https://diffs.com) 提供支持。
</Note>

## 相关内容

- [浏览器](/zh-CN/tools/browser)
- [插件](/zh-CN/tools/plugin)
- [工具概览](/zh-CN/tools)

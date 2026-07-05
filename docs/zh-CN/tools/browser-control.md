---
read_when:
    - 通过本地控制 API 编写脚本或调试智能体浏览器
    - 正在查找 `openclaw browser` CLI 参考
    - 添加带快照和引用的自定义浏览器自动化
summary: OpenClaw 浏览器控制 API、CLI 参考和脚本操作
title: 浏览器控制 API
x-i18n:
    generated_at: "2026-07-05T11:43:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72412826cdf61f59fc9470be41834c9a35b0af2dff162fcc401e9d0f5790a2bb
    source_path: tools/browser-control.md
    workflow: 16
---

For setup, configuration, and troubleshooting, see [Browser](/zh-CN/tools/browser).
This page is the reference for the local control HTTP API, the `openclaw browser`
CLI, and scripting patterns (snapshots, refs, waits, debug flows).

## Control API (optional)

For local integrations only, the Gateway exposes a small loopback HTTP API.
This standalone server is opt-in — set the environment variable
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` in the gateway service environment
and restart the gateway before the HTTP endpoints become available. Without
this variable the browser control runtime still works through the CLI and
agent tools, but nothing listens on the loopback control port.

- Status/start/stop: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Profiles: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Tabs: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Permissions: `POST /permissions/grant`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Network: `POST /response/body`
- State: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- State: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Settings: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` 是 CLI 内部用于
`browser tab` 子命令的批处理形式（`{"action":"new"|"label"|"select"|"close"|"list", ...}`）；
直接编写脚本时，优先使用上面的单用途标签页路由。

所有端点都接受 `?profile=<name>`。`POST /start?headless=true` 会请求对本地托管配置文件进行
一次性无头启动，而不更改持久化的浏览器配置；attach-only、远程 CDP 和 existing-session 配置文件会拒绝
该覆盖，因为 OpenClaw 不会启动这些浏览器进程。

对于标签页端点，`targetId` 是兼容性字段名。优先传入
`GET /tabs` 或 `POST /tabs/open` 返回的 `suggestedTargetId`；标签以及 `t1` 等 `tabId`
句柄也可以接受。原始 CDP target id 和唯一的原始
target-id 前缀仍然可用，但它们是不稳定的诊断句柄。

如果配置了共享密钥 Gateway 网关认证，浏览器 HTTP 路由也需要认证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或使用该密码的 HTTP Basic 认证

注意：

- 这个独立的环回浏览器 API **不会** 使用 trusted-proxy 或
  Tailscale Serve 身份标头。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些环回浏览器
  路由不会继承那些携带身份的模式；请保持它们仅限环回访问。

### `/act` 错误契约

`POST /act` 对路由级验证和策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少或无法识别 `kind`。
- `ACT_INVALID_REQUEST`（HTTP 400）：操作载荷未通过规范化或验证。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：`selector` 被用于不支持的操作类型。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：`evaluate`（或 `wait --fn`）被配置禁用。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批处理的 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：existing-session 配置文件不支持该操作。

其他运行时失败仍可能返回不带
`code` 字段的 `{ "error": "<message>" }`。

### Playwright 要求

部分功能（navigate/act/AI snapshot/role snapshot、元素截图、
PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回
明确的 501 错误。

没有 Playwright 时仍可使用的功能：

- ARIA 快照
- 当每个标签页的 CDP WebSocket 可用时，role 风格的无障碍快照（`--interactive`、`--compact`、
  `--depth`、`--efficient`）。这是用于检查和 ref 发现的
  回退；Playwright 仍是主要的操作引擎。
- 当每个标签页的 CDP
  WebSocket 可用时，托管 `openclaw` 浏览器的页面截图
- `existing-session` / Chrome MCP 配置文件的页面截图
- 来自快照输出的 `existing-session` 基于 ref 的截图（`--ref`）

仍需要 Playwright 的功能：

- `navigate`
- `act`
- 依赖 Playwright 原生 AI 快照格式的 AI 快照
- CSS 选择器元素截图（`--element`）
- 完整浏览器 PDF 导出

元素截图也会拒绝 `--full-page`；该路由返回 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，表示打包的
Gateway 网关缺少核心浏览器运行时依赖。重新安装或更新
OpenClaw，然后重启 Gateway 网关。对于 Docker，还要按如下所示安装 Chromium
浏览器二进制文件。

#### Docker Playwright 安装

如果你的 Gateway 网关在 Docker 中运行，请避免使用 `npx playwright`（会与 npm override 冲突）。
对于自定义镜像，请将 Chromium 烘焙进镜像：

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

对于现有镜像，请改为通过内置 CLI 安装：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），并确保 `/home/node` 通过
`OPENCLAW_HOME_VOLUME` 或 bind mount 持久化。OpenClaw 会在 Linux 上自动检测持久化的
Chromium。参见 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

一个小型环回控制服务器接受 HTTP 请求，并通过 CDP 连接到基于 Chromium 的浏览器。高级操作（click/type/snapshot/PDF）通过 CDP 之上的 Playwright 执行；当缺少 Playwright 时，只有非 Playwright 操作可用。智能体看到的是一个稳定接口，而本地/远程浏览器和配置文件可以在底层自由切换。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 来指定具体配置文件，并接受 `--json` 输出机器可读结果。

<AccordionGroup>

<Accordion title="基础：状态、标签页、打开/聚焦/关闭">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # add a live snapshot probe
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser reset-profile   # moves the profile's browser data to Trash
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="配置文件：列出、创建、删除">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="检查：截图、快照、控制台、错误、请求">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="操作：导航、点击、输入、拖拽、等待、求值">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="状态：cookies、storage、offline、headers、geo、device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注意：

- `upload` 和 `dialog` 是**预备**调用；请在触发选择器/对话框的点击/按键之前运行它们。如果某个操作打开了模态框，操作响应会包含 `blockedByDialog` 和 `browserState.dialogs.pending`；传入该 `dialogId` 以直接响应。OpenClaw 外部处理的对话框会出现在 `browserState.dialogs.recent` 下。
- `click`/`type`/等操作需要来自 `snapshot` 的 `ref`（数字 `12`、role ref `e12` 或可操作的 ARIA ref `ax12`）。操作故意不支持 CSS 选择器。当可见视口位置是唯一可靠目标时，请使用 `click-coords`。
- 下载和 trace 路径被限制在 OpenClaw 临时根目录：`/tmp/openclaw{,/downloads}`（回退：`${os.tmpdir()}/openclaw/...`）。
- `upload` 接受来自 OpenClaw 临时上传根目录和
  OpenClaw 托管入站媒体的文件。托管入站媒体可以引用为
  `media://inbound/<id>`、沙箱相对路径 `media/inbound/<id>`，或托管入站媒体目录内的解析后
  路径。嵌套媒体 ref、
  traversal、符号链接、硬链接和任意本地路径仍会被拒绝。
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入。

稳定的标签页 ID 和标签会在 Chromium raw-target 替换后保留，前提是 OpenClaw
能够证明替换后的标签页，例如 URL 相同，或表单提交后单个旧标签页变成
单个新标签页。原始 target ID 仍然不稳定；在脚本中优先使用 `tabs` 里的
`suggestedTargetId`。

Snapshot 标志速览：

- `--format ai`（使用 Playwright 时的默认值）：带数字引用的 AI snapshot（`aria-ref="<n>"`）。
- `--format aria`：带 `axN` 引用的无障碍树。Playwright 可用时，OpenClaw 会通过后端 DOM ID 将引用绑定到实时页面，以便后续操作使用；否则请将输出仅视为检查用途。
- `--efficient`（或 `--mode efficient`）：紧凑角色 snapshot 预设。设置 `browser.snapshotDefaults.mode: "efficient"` 可将其作为默认值（参见 [Gateway 配置](/zh-CN/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 会强制使用带 `ref=e12` 引用的角色 snapshot。`--frame "<iframe>"` 会将角色 snapshot 的作用域限定到 iframe。
- 使用 Playwright 时，`--labels` 会添加一张带叠加引用标签的截图
  （打印 `MEDIA:<path>`），并附带一个 `annotations` 数组，其中包含每个引用的边界
  框。在 `screenshot` 上，Playwright 支持的标签可与 `--full-page`、
  `--ref` 和 `--element` 配合使用；在 `snapshot` 上，随附截图仍然
  只包含视口。existing-session/chrome-mcp 配置文件会在
  页面截图上渲染叠加标签，但不会返回 `annotations`，也不会使用 Playwright
  的整页/ref/element 投影辅助工具。没有 Playwright 或 chrome-mcp 时，
  无法使用带标签的截图。
- `--urls` 会向 AI snapshot 追加发现到的链接目标。

## Snapshot 和引用

OpenClaw 支持两种 “snapshot” 样式：

- **AI snapshot（数字引用）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字引用的文本 snapshot。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在内部，引用通过 Playwright 的 `aria-ref` 解析。

- **角色 snapshot（类似 `e12` 的角色引用）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：带 `[ref=e12]`（以及可选 `[nth=1]`）的基于角色的列表/树。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在内部，引用通过 `getByRole(...)` 解析（重复项再加 `nth()`）。
  - 添加 `--labels` 可包含带叠加 `e12` 标签的截图。在
    Playwright 支持的配置文件上，这还会返回每个引用的边界框元数据
    （`annotations[]`）。
  - 当链接文本含糊而智能体需要具体导航目标时，添加 `--urls`。

- **ARIA snapshot（类似 `ax12` 的 ARIA 引用）**：`openclaw browser snapshot --format aria`
  - 输出：作为结构化节点的无障碍树。
  - 操作：当 snapshot 路径可以通过 Playwright 和 Chrome 后端 DOM ID
    绑定引用时，`openclaw browser click ax12` 可用。
- 如果 Playwright 不可用，ARIA snapshot 仍可用于
  检查，但引用可能不可操作。需要操作引用时，请用 `--format ai`
  或 `--interactive` 重新 snapshot。
- raw-CDP fallback 路径的 Docker 证明：`pnpm test:docker:browser-cdp-snapshot`
  会使用 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证角色
  snapshot 包含链接 URL、光标提升的可点击项和 iframe 元数据。

引用行为：

- 引用**不会跨导航保持稳定**；如果某项失败，请重新运行 `snapshot` 并使用新的引用。
- 当可以证明替换标签页时，`/act` 会在操作触发的替换后返回当前原始 `targetId`。
  后续命令继续使用稳定标签页 ID/标签。
- 如果角色 snapshot 是通过 `--frame` 获取的，角色引用会限定在该 iframe 内，直到下一次角色 snapshot。
- 未知或陈旧的 `axN` 引用会快速失败，而不是回退到
  Playwright 的 `aria-ref` 选择器。发生这种情况时，请在同一标签页上
  运行新的 snapshot。

## 等待增强功能

你可以等待的不只是时间/文本：

- 等待 URL（支持 Playwright glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
  - 支持托管 `openclaw` 和原始/远程 CDP 配置文件。使用 `existing-session` 驱动的配置文件（包括默认 `user` 配置文件）会拒绝 `networkidle`；在那里请使用 `--url`、`--text`、选择器或 `--fn` 等待。
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待选择器变为可见：
  - `openclaw browser wait "#main"`

这些可以组合使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 调试工作流

当操作失败时（例如 “not visible”、“strict mode violation”、“covered”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式下优先使用角色引用）
3. 如果仍然失败：使用 `openclaw browser highlight <ref>` 查看 Playwright 正在定位的内容
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深度调试：记录 trace：
   - `openclaw browser trace start`
   - 复现问题
   - `openclaw browser trace stop`（打印 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本和结构化工具。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 中的角色 snapshot 包含 `refs`，以及一个小型 `stats` 块（lines/chars/refs/interactive），以便工具推理载荷大小和密度。

## 状态和环境控制项

这些对 “让站点表现得像 X” 工作流很有用：

- Cookie：`cookies`、`cookies set`、`cookies clear`
- 存储：`storage local|session get|set|clear`
- 离线：`set offline on|off`
- 标头：`set headers --headers-json '{"X-Debug":"1"}'`（或位置参数形式 `set headers '{"X-Debug":"1"}'`）
- HTTP basic auth：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区 / 语言区域：`set timezone ...`、`set locale ...`
- 设备 / 视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全和隐私

- openclaw 浏览器配置文件可能包含已登录会话；请将其视为敏感信息。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  会在页面上下文中执行任意 JavaScript。提示注入可能会操控
  这一点。如果不需要它，请用 `browser.evaluateEnabled=false` 禁用。
- `openclaw browser evaluate --fn` 接受函数源、表达式或
  语句体。语句体会被包装为 async 函数，因此请使用
  `return` 返回你想取回的值。当页面端函数可能需要超过默认 evaluate 超时时间时，请使用 `--timeout-ms <ms>`。
- 关于登录和反 Bot 说明（X/Twitter 等），请参阅 [浏览器登录 + X/Twitter 发帖](/zh-CN/tools/browser-login)。
- 保持 Gateway 网关/节点主机私有（loopback 或仅 tailnet）。
- 远程 CDP 端点权限很强；请对其进行隧道封装并加以保护。

严格模式示例（默认阻止私有/内部目标）：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## 相关

- [浏览器](/zh-CN/tools/browser) - 概览、配置、配置文件、安全
- [浏览器登录](/zh-CN/tools/browser-login) - 登录站点
- [Browser Linux 故障排查](/zh-CN/tools/browser-linux-troubleshooting)
- [Browser WSL2 故障排查](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

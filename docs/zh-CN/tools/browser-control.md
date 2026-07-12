---
read_when:
    - 通过本地控制 API 编写脚本或调试智能体浏览器
    - 查找 `openclaw browser` CLI 参考文档
    - 使用快照和引用添加自定义浏览器自动化功能
summary: OpenClaw 浏览器控制 API、CLI 参考和脚本操作
title: 浏览器控制 API
x-i18n:
    generated_at: "2026-07-12T14:47:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

有关设置、配置和故障排查，请参阅[浏览器](/zh-CN/tools/browser)。
本页是本地控制 HTTP API、`openclaw browser` CLI 以及脚本编写模式（快照、引用、等待、调试流程）的参考文档。

## 控制 API（可选）

仅限本地集成使用，Gateway 网关会公开一个小型 loopback HTTP API。
此独立服务器为可选启用——在 Gateway 网关服务环境中设置环境变量
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1`，并重启 Gateway 网关，HTTP 端点才会可用。如果未设置
此变量，浏览器控制运行时仍可通过 CLI 和
智能体工具工作，但 loopback 控制端口上不会监听任何服务。

- 状态/启动/停止：`GET /`、`GET /doctor`、`POST /start`、`POST /stop`、`POST /reset-profile`
- 配置文件：`GET /profiles`、`POST /profiles/create`、`DELETE /profiles/:name`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`、`POST /tabs/action`
- 快照/屏幕截图：`GET /snapshot`、`POST /screenshot`
- 操作：`POST /navigate`、`POST /act`
- Hooks：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 权限：`POST /permissions/grant`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`GET /dialogs`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

`POST /tabs/action` 是 CLI 内部用于
`browser tab` 子命令的批量形式（`{"action":"new"|"label"|"select"|"close"|"list", ...}`）；
直接编写脚本时，优先使用上方用途单一的标签页路由。

所有端点都接受 `?profile=<name>`。`POST /start?headless=true` 请求
为本地托管配置文件执行一次性无头启动，而不更改持久化的
浏览器配置；仅附加、远程 CDP 和已有会话配置文件会拒绝
此覆盖参数，因为 OpenClaw 不会启动这些浏览器进程。

对于标签页端点，`targetId` 是兼容性字段名。优先传入
`GET /tabs` 或 `POST /tabs/open` 返回的 `suggestedTargetId`；也接受标签和
`t1` 等 `tabId` 句柄。原始 CDP 目标 ID 和唯一的原始
目标 ID 前缀仍然有效，但它们是易变的诊断句柄。

如果配置了共享密钥 Gateway 网关身份验证，浏览器 HTTP 路由也需要身份验证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>`，或使用该密码进行 HTTP Basic 身份验证

注意：

- 此独立的 loopback 浏览器 API **不会**使用受信任代理或
  Tailscale Serve 身份标头。
- 如果 `gateway.auth.mode` 为 `none` 或 `trusted-proxy`，这些 loopback 浏览器
  路由不会继承这些携带身份信息的模式；请确保它们仅限 loopback 访问。

### `/act` 错误契约

`POST /act` 对路由级验证和
策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前的 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少 `kind` 或无法识别。
- `ACT_INVALID_REQUEST`（HTTP 400）：操作载荷未通过规范化或验证。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：对不支持的操作类型使用了 `selector`。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：配置已禁用 `evaluate`（或 `wait --fn`）。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批处理的 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：现有会话配置文件不支持此操作。

其他运行时故障仍可能返回 `{ "error": "<message>" }`，但不包含
`code` 字段。

### Playwright 要求

某些功能（导航/操作/AI 快照/角色快照、元素截图、
PDF）需要 Playwright。如果未安装 Playwright，这些端点将返回
明确的 501 错误。

没有 Playwright 时仍可使用的功能：

- ARIA 快照
- 当每个标签页都有可用的 CDP WebSocket 时，可使用角色样式的无障碍快照（`--interactive`、`--compact`、
  `--depth`、`--efficient`）。这是用于检查和查找引用的
  后备方案；Playwright 仍是主要的操作引擎。
- 当每个标签页都有可用的 CDP WebSocket 时，可为托管的 `openclaw` 浏览器
  截取页面截图
- 为 `existing-session` / Chrome MCP 配置文件截取页面截图
- 根据快照输出进行基于引用的 `existing-session` 截图（`--ref`）

仍需要 Playwright 的功能：

- `navigate`
- `act`
- 依赖 Playwright 原生 AI 快照格式的 AI 快照
- 使用 CSS 选择器的元素截图（`--element`）
- 完整的浏览器 PDF 导出

元素截图也不接受 `--full-page`；该路由会返回 `fullPage is
not supported for element screenshots`。

如果看到 `Playwright is not available in this gateway build`，则打包的
Gateway 网关缺少核心浏览器运行时依赖项。请重新安装或更新
OpenClaw，然后重启 Gateway 网关。对于 Docker，还需要按下方所示安装 Chromium
浏览器二进制文件。

#### Docker Playwright 安装

如果你的 Gateway 网关运行在 Docker 中，请避免使用 `npx playwright`（会发生 npm override 冲突）。
对于自定义镜像，请将 Chromium 预装到镜像中：

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

对于现有镜像，请改用内置 CLI 安装：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），并确保通过
`OPENCLAW_HOME_VOLUME` 或绑定挂载持久化 `/home/node`。OpenClaw 会在 Linux 上自动检测持久化的
Chromium。请参阅 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

一个小型环回控制服务器接收 HTTP 请求，并通过 CDP 连接到基于 Chromium 的浏览器。高级操作（点击/输入/快照/PDF）通过 CDP 之上的 Playwright 执行；缺少 Playwright 时，仅可使用不依赖 Playwright 的操作。底层的本地/远程浏览器和配置文件可以自由切换，而智能体始终使用同一个稳定接口。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 以指定特定配置文件，并接受 `--json` 以输出机器可读的结果。

<AccordionGroup>

<Accordion title="基础操作：状态、标签页、打开/聚焦/关闭">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # 添加实时快照探测
openclaw browser start
openclaw browser start --headless # 一次性启动本地托管的无头浏览器
openclaw browser stop            # 也会清除仅附加/远程 CDP 上的模拟设置
openclaw browser reset-profile   # 将配置文件的浏览器数据移至废纸篓
openclaw browser tabs
openclaw browser tab             # 当前标签页的快捷命令
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

<Accordion title="检查：屏幕截图、快照、控制台、错误、请求">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # 或使用 --ref e12
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

<Accordion title="操作：导航、点击、输入、拖动、等待、求值">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # 对于角色引用，也可使用 e12
openclaw browser click-coords 120 340        # 视口坐标
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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

<Accordion title="状态：Cookie、存储、离线、请求头、地理位置、设备">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # 使用 --clear 移除
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注意事项：

- 面向智能体的 `browser` 工具提供 `action=download`（必需参数为 `ref` 和
  `path`）以及 `action=waitfordownload`（可选参数为 `path`）。两者都会返回已保存的
  下载 URL、建议的文件名和受保护的本地路径。托管的 Playwright 配置文件支持显式下载
  拦截；现有会话配置文件会返回“不支持的操作”错误。
- 优先使用原子式文件选择器上传：上传时传入触发器 `--ref`，以便 OpenClaw 在一个请求中完成预备和点击。当有意稍后触发时，仍支持仅含路径的 `upload`。使用 `--input-ref` 或 `--element` 可直接设置文件输入框。`dialog` 是一个预备调用；请在触发对话框的点击/按键操作之前运行它。如果某个操作打开模态框，其操作响应会包含 `blockedByDialog` 和 `browserState.dialogs.pending`；传入该 `dialogId` 可直接响应。在 OpenClaw 外部处理的对话框会出现在 `browserState.dialogs.recent` 下。
- `click`/`type`/等操作需要来自 `snapshot` 的 `ref`（数字引用 `12`、角色引用 `e12`，或可操作的 ARIA 引用 `ax12`）。操作有意不支持 CSS 选择器。当可见视口中的位置是唯一可靠的目标时，请使用 `click-coords`。
- 下载和跟踪路径仅限于 OpenClaw 临时根目录：`/tmp/openclaw{,/downloads}`（回退路径：`${os.tmpdir()}/openclaw/...`）。
- `upload` 接受来自 OpenClaw 临时上传根目录和
  OpenClaw 管理的入站媒体中的文件。可通过
  `media://inbound/<id>`、沙箱相对路径 `media/inbound/<id>`，或托管入站媒体目录内已解析的
  路径来引用托管入站媒体。嵌套媒体引用、
  路径遍历、符号链接、硬链接和任意本地路径仍会被拒绝。
- `upload` 还可以通过 `--input-ref` 或 `--element` 直接设置文件输入框。

当 OpenClaw 能够确认替换后的标签页时，例如同一 URL 存在唯一的旧/新标签页对，
或提交表单后单个旧标签页变成单个新标签页，稳定的标签页 ID 和标签可在 Chromium
原始目标替换后继续保留。存在歧义的重复 URL 替换会获得新的句柄。原始目标 ID 仍然
不稳定；脚本中应优先使用 `tabs` 返回的 `suggestedTargetId`。

快照标志速览：

- `--format ai`（使用 Playwright 时的默认值）：带数字引用（`aria-ref="<n>"`）的 AI 快照。
- `--format aria`：带 `axN` 引用的无障碍树。当 Playwright 可用时，OpenClaw 会使用后端 DOM ID 将引用绑定到实时页面，以便后续操作使用；否则应仅将输出用于检查。
- `--efficient`（或 `--mode efficient`）：紧凑的角色快照预设。设置 `browser.snapshotDefaults.mode: "efficient"` 可将其设为默认值（参阅 [Gateway 配置](/zh-CN/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 会强制生成带 `ref=e12` 引用的角色快照。`--frame "<iframe>"` 会将角色快照的范围限定到某个 iframe。
- 使用 Playwright 时，`--labels` 会额外生成一张叠加了引用标签的屏幕截图
  （输出 `MEDIA:<path>`），以及一个包含每个引用边界框的 `annotations` 数组。
  对于 `screenshot`，由 Playwright 支持的标签可与 `--full-page`、
  `--ref` 和 `--element` 配合使用；对于 `snapshot`，随附的屏幕截图仍然
  仅包含视口。现有会话/chrome-mcp 配置文件会在页面屏幕截图上渲染叠加标签，
  但不会返回 `annotations`，也不会使用 Playwright 的
  全页面/引用/元素投影辅助函数。没有 Playwright 或 chrome-mcp 时，
  无法使用带标签的屏幕截图。
- `--urls` 会将发现的链接目标附加到 AI 快照中。

## 快照和引用

OpenClaw 支持两种“快照”样式：

- **AI 快照（数字引用）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字引用的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在内部，通过 Playwright 的 `aria-ref` 解析引用。

- **角色快照（如 `e12` 的角色引用）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：带 `[ref=e12]`（以及可选的 `[nth=1]`）的基于角色的列表/树。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在内部，通过 `getByRole(...)` 解析引用（重复项还会使用 `nth()`）。
  - 添加 `--labels` 可包含一张叠加了 `e12` 标签的屏幕截图。对于
    由 Playwright 支持的配置文件，这还会返回每个引用的边界框元数据
    （`annotations[]`）。
  - 当链接文本存在歧义且智能体需要明确的
    导航目标时，请添加 `--urls`。

- **ARIA 快照（如 `ax12` 的 ARIA 引用）**：`openclaw browser snapshot --format aria`
  - 输出：以结构化节点表示的无障碍树。
  - 操作：当快照路径能够通过 Playwright 和 Chrome 后端 DOM ID
    绑定引用时，可使用 `openclaw browser click ax12`。
- 如果 Playwright 不可用，ARIA 快照仍可用于
  检查，但引用可能无法操作。当你需要操作引用时，请使用 `--format ai`
  或 `--interactive` 重新获取快照。
- 原始 CDP 回退路径的 Docker 证明：`pnpm test:docker:browser-cdp-snapshot`
  使用 CDP 启动 Chromium，运行 `browser doctor --deep`，并验证角色
  快照包含链接 URL、由光标状态提升为可点击的元素以及 iframe 元数据。

引用行为：

- 引用在导航后**不会保持稳定**；如果操作失败，请重新运行 `snapshot` 并使用新的引用。
- 当 `/act` 能够确认操作触发的替换标签页时，它会返回当前的原始 `targetId`。
  后续命令应继续使用稳定的标签页 ID/标签。
- 如果角色快照是使用 `--frame` 获取的，则在下一次获取角色快照之前，角色引用的范围仅限于该 iframe。
- 未知或过期的 `axN` 引用会快速失败，而不会回退到
  Playwright 的 `aria-ref` 选择器。发生这种情况时，请在同一标签页上
  获取新快照。

## 增强型等待

除了时间/文本，你还可以等待更多条件：

- 等待 URL（支持 Playwright glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
  - 托管的 `openclaw` 和原始/远程 CDP 配置文件均支持此功能。使用 `existing-session` 驱动程序的配置文件（包括默认的 `user` 配置文件）会拒绝 `networkidle`；请改用 `--url`、`--text`、选择器或 `--fn` 等待。
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待选择器变为可见：
  - `openclaw browser wait "#main"`

这些条件可以组合使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 调试工作流

当操作失败时（例如“不可见”“严格模式冲突”“被遮挡”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式下优先使用角色引用）
3. 如果仍然失败：使用 `openclaw browser highlight <ref>` 查看 Playwright 正在定位的目标
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 如需深度调试，请记录跟踪：
   - `openclaw browser trace start`
   - 重现问题
   - `openclaw browser trace stop`（输出 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本和结构化工具。

示例：

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

JSON 中的角色快照包含 `refs`，以及一个简短的 `stats` 块（行数/字符数/引用数/交互元素数），以便工具分析载荷大小和密度。

## 状态和环境控制项

这些控制项适用于“让网站表现得像 X”之类的工作流：

- Cookie：`cookies`、`cookies set`、`cookies clear`
- 存储：`storage local|session get|set|clear`
- 离线：`set offline on|off`
- 请求头：`set headers --headers-json '{"X-Debug":"1"}'`（或位置参数形式 `set headers '{"X-Debug":"1"}'`）
- HTTP 基本身份验证：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区/语言区域：`set timezone ...`、`set locale ...`
- 设备/视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全和隐私

- openclaw 浏览器配置文件可能包含已登录的会话；请将其视为敏感信息。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  会在页面上下文中执行任意 JavaScript。提示词注入可能会操控
  此行为。如果不需要此功能，请使用 `browser.evaluateEnabled=false` 将其禁用。
- `openclaw browser evaluate --fn` 接受函数源代码、表达式或
  语句体。语句体会被包装为异步函数，因此请使用
  `return` 返回你需要的值。当页面端函数可能需要超过默认求值超时时间时，
  请使用 `--timeout-ms <ms>`。
- 有关登录和反机器人注意事项（X/Twitter 等），请参阅[浏览器登录 + 在 X/Twitter 发帖](/zh-CN/tools/browser-login)。
- 将 Gateway 网关/节点主机保持为私有状态（仅限回环地址或 tailnet）。
- 远程 CDP 端点权限强大；请通过隧道访问并妥善保护。

严格模式示例（默认阻止私有/内部目标）：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 可选的精确允许项
    },
  },
}
```

## 相关内容

- [浏览器](/zh-CN/tools/browser) - 概览、配置、配置文件、安全
- [浏览器登录](/zh-CN/tools/browser-login) - 登录网站
- [浏览器 Linux 故障排查](/zh-CN/tools/browser-linux-troubleshooting)
- [浏览器 WSL2 故障排查](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

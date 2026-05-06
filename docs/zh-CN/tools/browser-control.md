---
read_when:
    - 通过本地控制 API 编写脚本或调试智能体浏览器
    - 正在查找 `openclaw browser` CLI 参考
    - 添加使用快照和引用的自定义浏览器自动化
summary: OpenClaw 浏览器控制 API、CLI 参考和脚本操作
title: 浏览器控制 API
x-i18n:
    generated_at: "2026-05-06T03:31:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

设置、配置和故障排除请参阅 [Browser](/zh-CN/tools/browser)。
本页是本地控制 HTTP API、`openclaw browser` CLI 以及脚本模式（快照、ref、等待、调试流程）的参考。

## 控制 API（可选）

仅用于本地集成时，Gateway 网关会暴露一个小型 local loopback HTTP API：

- Status/start/stop：`GET /`、`POST /start`、`POST /stop`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- 快照/截图：`GET /snapshot`、`POST /screenshot`
- 操作：`POST /navigate`、`POST /act`
- 钩子：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 权限：`POST /permissions/grant`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端点都接受 `?profile=<name>`。`POST /start?headless=true` 会请求为本地托管配置启动一次性 headless 浏览器，且不会更改持久化的浏览器配置；仅附加、远程 CDP 和现有会话配置会拒绝该覆盖，因为 OpenClaw 不会启动这些浏览器进程。

如果配置了共享密钥 Gateway 网关身份验证，浏览器 HTTP 路由也需要身份验证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>`，或使用该密码的 HTTP Basic 身份验证

注意事项：

- 这个独立的 local loopback 浏览器 API **不会**使用受信任代理或 Tailscale Serve 身份标头。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些 local loopback 浏览器路由不会继承那些携带身份的模式；请让它们保持仅 local loopback。

### `/act` 错误契约

`POST /act` 对路由级验证和策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少 `kind` 或无法识别。
- `ACT_INVALID_REQUEST`（HTTP 400）：操作载荷未通过规范化或验证。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：`selector` 被用于不受支持的操作类型。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：配置禁用了 `evaluate`（或 `wait --fn`）。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批量 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：现有会话配置不支持该操作。

其他运行时失败仍可能返回不含 `code` 字段的 `{ "error": "<message>" }`。

### Playwright 要求

部分功能（导航/操作/AI 快照/角色快照、元素截图、PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回清晰的 501 错误。

没有 Playwright 时仍可使用：

- ARIA 快照
- 当每个标签页的 CDP WebSocket 可用时，可使用角色样式的无障碍快照（`--interactive`、`--compact`、`--depth`、`--efficient`）。这是用于检查和 ref 发现的后备方式；Playwright 仍是主要操作引擎。
- 当每个标签页的 CDP WebSocket 可用时，可对托管的 `openclaw` 浏览器进行页面截图
- `existing-session` / Chrome MCP 配置的页面截图
- 来自快照输出的 `existing-session` 基于 ref 的截图（`--ref`）

仍需要 Playwright 的功能：

- `navigate`
- `act`
- 依赖 Playwright 原生 AI 快照格式的 AI 快照
- CSS 选择器元素截图（`--element`）
- 完整浏览器 PDF 导出

元素截图也会拒绝 `--full-page`；该路由返回 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，说明打包的 Gateway 网关缺少核心浏览器运行时依赖。重新安装或更新 OpenClaw，然后重启 Gateway 网关。对于 Docker，还需要按如下方式安装 Chromium 浏览器二进制文件。

#### Docker Playwright 安装

如果你的 Gateway 网关在 Docker 中运行，请避免使用 `npx playwright`（npm override 会冲突）。改用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如 `/home/node/.cache/ms-playwright`），并确保 `/home/node` 通过 `OPENCLAW_HOME_VOLUME` 或 bind mount 持久化。参阅 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

一个小型 local loopback 控制服务器接收 HTTP 请求，并通过 CDP 连接到基于 Chromium 的浏览器。高级操作（点击/输入/快照/PDF）通过 CDP 之上的 Playwright 执行；缺少 Playwright 时，仅非 Playwright 操作可用。智能体看到的是一个稳定接口，而本地/远程浏览器和配置可以在底层自由切换。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 来定位特定配置，并接受 `--json` 输出机器可读结果。

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

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
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

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
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

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

注意事项：

- `upload` 和 `dialog` 是**预备**调用；请在触发选择器/对话框的点击/按键之前运行它们。
- `click`/`type` 等需要来自 `snapshot` 的 `ref`（数字 `12`、角色 ref `e12`，或可操作 ARIA ref `ax12`）。操作有意不支持 CSS 选择器。当可见视口位置是唯一可靠目标时，请使用 `click-coords`。
- 下载、追踪和上传路径受限于 OpenClaw 临时根目录：`/tmp/openclaw{,/downloads,/uploads}`（后备：`${os.tmpdir()}/openclaw/...`）。
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入。

当 OpenClaw 能证明替换标签页（例如相同 URL，或表单提交后单个旧标签页变成单个新标签页）时，稳定标签页 ID 和标签会在 Chromium 原始目标替换后保留。原始目标 ID 仍然不稳定；脚本中优先使用 `tabs` 的 `suggestedTargetId`。

快照标志速览：

- `--format ai`（Playwright 可用时的默认值）：带数字 ref（`aria-ref="<n>"`）的 AI 快照。
- `--format aria`：带 `axN` ref 的无障碍树。Playwright 可用时，OpenClaw 会使用后端 DOM ID 将 ref 绑定到实时页面，使后续操作可以使用它们；否则请将输出仅视为检查用途。
- `--efficient`（或 `--mode efficient`）：紧凑角色快照预设。设置 `browser.snapshotDefaults.mode: "efficient"` 可将其设为默认值（参阅 [Gateway 网关配置](/zh-CN/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 会强制生成带 `ref=e12` ref 的角色快照。`--frame "<iframe>"` 会将角色快照限定到 iframe。
- `--labels` 会添加带叠加 ref 标签的仅视口截图（打印 `MEDIA:<path>`）。
- `--urls` 会把发现的链接目标追加到 AI 快照。

## 快照和 ref

OpenClaw 支持两种“快照”样式：

- **AI 快照（数字 ref）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 ref 的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部会通过 Playwright 的 `aria-ref` 解析 ref。

- **角色快照（类似 `e12` 的角色 ref）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：带 `[ref=e12]`（以及可选 `[nth=1]`）的基于角色的列表/树。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部会通过 `getByRole(...)`（以及用于重复项的 `nth()`）解析 ref。
  - 添加 `--labels` 可包含带叠加 `e12` 标签的视口截图。
  - 当链接文本有歧义且智能体需要具体导航目标时，请添加 `--urls`。

- **ARIA 快照（类似 `ax12` 的 ARIA ref）**：`openclaw browser snapshot --format aria`
  - 输出：作为结构化节点的无障碍树。
  - 操作：当快照路径可以通过 Playwright 和 Chrome 后端 DOM ID 绑定 ref 时，`openclaw browser click ax12` 可用。
- 如果 Playwright 不可用，ARIA 快照仍可用于检查，但 ref 可能不可操作。当你需要操作 ref 时，请使用 `--format ai` 或 `--interactive` 重新生成快照。
- 原始 CDP 后备路径的 Docker 证明：`pnpm test:docker:browser-cdp-snapshot` 会启动带 CDP 的 Chromium，运行 `browser doctor --deep`，并验证角色快照包含链接 URL、由光标提升的可点击项和 iframe 元数据。

Ref 行为：

- 引用在**导航之间并不稳定**；如果某些操作失败，请重新运行 `snapshot` 并使用新的引用。
- 当 `/act` 可以证明替换标签页时，会在操作触发替换后返回当前原始 `targetId`。后续命令继续使用稳定的标签页 ID/标签。
- 如果角色快照是用 `--frame` 获取的，则角色引用会限定在该 iframe 内，直到下一次角色快照。
- 未知或过期的 `axN` 引用会快速失败，而不是继续回退到 Playwright 的 `aria-ref` 选择器。发生这种情况时，请在同一标签页上运行新的快照。

## 等待增强功能

你可以等待的不只是时间/文本：

- 等待 URL（支持 Playwright glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
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
2. 使用 `click <ref>` / `type <ref>`（在交互模式中优先使用角色引用）
3. 如果仍然失败：使用 `openclaw browser highlight <ref>` 查看 Playwright 正在定位什么
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 如需深度调试：记录 trace：
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

JSON 中的角色快照包含 `refs`，以及一个小型 `stats` 块（lines/chars/refs/interactive），以便工具判断载荷大小和密度。

## 状态和环境开关

这些适用于“让站点表现得像 X”这类工作流：

- Cookie：`cookies`、`cookies set`、`cookies clear`
- 存储：`storage local|session get|set|clear`
- 离线：`set offline on|off`
- Header：`set headers --headers-json '{"X-Debug":"1"}'`（仍支持旧版 `set headers --json '{"X-Debug":"1"}'`）
- HTTP 基本认证：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区 / 区域设置：`set timezone ...`、`set locale ...`
- 设备 / 视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全和隐私

- openclaw 浏览器 profile 可能包含已登录会话；请将其视为敏感数据。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn` 会在页面上下文中执行任意 JavaScript。提示注入可以操纵这一点。如果不需要，请使用 `browser.evaluateEnabled=false` 禁用它。
- 如需登录和反机器人说明（X/Twitter 等），请参阅[浏览器登录 + X/Twitter 发帖](/zh-CN/tools/browser-login)。
- 保持 Gateway 网关/node 主机私有（local loopback 或仅限 tailnet）。
- 远程 CDP 端点权限很高；请通过隧道访问并加以保护。

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

## 相关内容

- [浏览器](/zh-CN/tools/browser) - 概览、配置、profile、安全
- [浏览器登录](/zh-CN/tools/browser-login) - 登录站点
- [浏览器 Linux 故障排除](/zh-CN/tools/browser-linux-troubleshooting)
- [浏览器 WSL2 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

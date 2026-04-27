---
read_when:
    - 通过本地控制 API 对智能体浏览器进行脚本操作或调试
    - 查找 `openclaw browser` CLI 参考
    - 添加带有快照和 refs 的自定义浏览器自动化
summary: OpenClaw 浏览器控制 API、CLI 参考和脚本操作
title: 浏览器控制 API
x-i18n:
    generated_at: "2026-04-27T14:09:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bd0c0e5a5be9a8ec865c932d28456ace6a047d15a534a79c0b81a5e8904736f
    source_path: tools/browser-control.md
    workflow: 15
---

有关设置、配置和故障排除，请参见 [Browser](/zh-CN/tools/browser)。
本页是本地控制 HTTP API、`openclaw browser`
CLI 以及脚本模式（快照、refs、等待、调试流程）的参考。

## 控制 API（可选）

仅用于本地集成时，Gateway 网关会公开一个小型 loopback HTTP API：

- 状态/启动/停止：`GET /`、`POST /start`、`POST /stop`
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

所有端点都接受 `?profile=<name>`。`POST /start?headless=true` 会为本地托管配置请求一次性无头启动，而不会更改持久化的浏览器配置；attach-only、远程 CDP 和 existing-session 配置会拒绝此覆盖，因为 OpenClaw 不会启动这些浏览器进程。

如果已配置共享密钥 Gateway 网关认证，浏览器 HTTP 路由也需要认证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或使用该密码的 HTTP Basic 认证

注意：

- 这个独立的 loopback 浏览器 API **不会** 使用 trusted-proxy 或
  Tailscale Serve 身份标头。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些 loopback 浏览器
  路由不会继承这些携带身份的模式；请将它们限制为仅 loopback 访问。

### `/act` 错误约定

`POST /act` 对路由级验证和策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前的 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少 `kind` 或无法识别。
- `ACT_INVALID_REQUEST`（HTTP 400）：操作负载未通过规范化或验证。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：在不支持的操作类型中使用了 `selector`。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：配置禁用了 `evaluate`（或 `wait --fn`）。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批量 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：existing-session 配置不支持该操作。

其他运行时失败仍可能只返回 `{ "error": "<message>" }`，而没有
`code` 字段。

### Playwright 要求

某些功能（navigate/act/AI 快照/role 快照、元素截图、
PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回
清晰的 501 错误。

没有 Playwright 时仍可使用的功能：

- ARIA 快照
- 当每个标签页的 CDP WebSocket 可用时，role 风格可访问性快照（`--interactive`、`--compact`、
  `--depth`、`--efficient`）。这是用于检查和 ref 发现的后备方案；
  Playwright 仍然是主要的操作引擎。
- 当每个标签页的 CDP WebSocket 可用时，托管 `openclaw` 浏览器的页面截图
- `existing-session` / Chrome MCP 配置的页面截图
- 来自快照输出的 `existing-session` 基于 ref 的截图（`--ref`）

仍然需要 Playwright 的功能：

- `navigate`
- `act`
- 依赖 Playwright 原生 AI 快照格式的 AI 快照
- 基于 CSS 选择器的元素截图（`--element`）
- 完整浏览器 PDF 导出

元素截图也会拒绝 `--full-page`；该路由会返回 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，请修复内置浏览器插件运行时依赖，确保已安装 `playwright-core`，
然后重启 Gateway 网关。对于打包安装，请运行 `openclaw doctor --fix`。
对于 Docker，还需要按如下方式安装 Chromium 浏览器二进制文件。

#### Docker Playwright 安装

如果你的 Gateway 网关运行在 Docker 中，请避免使用 `npx playwright`（会有 npm 覆盖冲突）。
请改用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），并确保通过
`OPENCLAW_HOME_VOLUME` 或 bind mount 持久化 `/home/node`。参见 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

一个小型 loopback 控制服务器接收 HTTP 请求，并通过 CDP 连接到基于 Chromium 的浏览器。高级操作（click/type/snapshot/PDF）通过 CDP 之上的 Playwright 执行；当缺少 Playwright 时，只有非 Playwright 操作可用。智能体看到的是一个稳定接口，而底层的本地/远程浏览器和配置可以自由切换。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 以定位到特定配置，并接受 `--json` 以输出机器可读格式。

<AccordionGroup>

<Accordion title="基础：状态、标签页、打开/聚焦/关闭">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # 一次性本地托管无头启动
openclaw browser stop            # 也会清除 attach-only/远程 CDP 上的仿真状态
openclaw browser tabs
openclaw browser tab             # 当前标签页的快捷方式
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="检查：截图、快照、控制台、错误、请求">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # 或 --ref e12
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

<Accordion title="操作：navigate、click、type、drag、wait、evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # 或对 role ref 使用 e12
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
openclaw browser set credentials user pass            # 使用 --clear 可移除
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注意：

- `upload` 和 `dialog` 是**预置**调用；请在触发文件选择器/对话框的 click/press 之前运行它们。
- `click`/`type`/等操作需要来自 `snapshot` 的 `ref`（数字 `12`、role ref `e12` 或可操作的 ARIA ref `ax12`）。操作有意不支持 CSS 选择器。如果可见视口位置是唯一可靠目标，请使用 `click-coords`。
- 下载、trace 和上传路径受限于 OpenClaw 临时根目录：`/tmp/openclaw{,/downloads,/uploads}`（回退为 `${os.tmpdir()}/openclaw/...`）。
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入。

当 OpenClaw
能够证明替换后的标签页，例如 URL 相同，或表单提交后单个旧标签页变成单个新标签页时，稳定的标签页 id 和标签在 Chromium 原始目标替换后仍可保留。原始 target id 仍然是易变的；在脚本中请优先使用来自 `tabs` 的 `suggestedTargetId`。

快照标志速览：

- `--format ai`（安装了 Playwright 时为默认）：带数字 ref 的 AI 快照（`aria-ref="<n>"`）。
- `--format aria`：带 `axN` ref 的无障碍树。当 Playwright 可用时，OpenClaw 会通过后端 DOM id 将 ref 绑定到活动页面，因此后续操作可使用它们；否则请将输出仅视为检查用途。
- `--efficient`（或 `--mode efficient`）：紧凑 role 快照预设。设置 `browser.snapshotDefaults.mode: "efficient"` 可将其设为默认值（参见 [Gateway configuration](/zh-CN/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 会强制生成带 `ref=e12` ref 的 role 快照。`--frame "<iframe>"` 将 role 快照范围限定到某个 iframe。
- `--labels` 会添加一张带叠加 ref 标签的仅视口截图（输出 `MEDIA:<path>`）。
- `--urls` 会在 AI 快照中附加已发现的链接目标地址。

## 快照和 refs

OpenClaw 支持两种“快照”样式：

- **AI 快照（数字 refs）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 refs 的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 内部实现：通过 Playwright 的 `aria-ref` 解析该 ref。

- **Role 快照（如 `e12` 这样的 role refs）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：基于 role 的列表/树，带有 `[ref=e12]`（以及可选的 `[nth=1]`）。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 内部实现：通过 `getByRole(...)` 解析该 ref（重复项则附加 `nth()`）。
  - 添加 `--labels` 可包含一张带叠加 `e12` 标签的视口截图。
  - 当链接文本有歧义并且智能体需要明确的
    导航目标时，可添加 `--urls`。

- **ARIA 快照（如 `ax12` 这样的 ARIA refs）**：`openclaw browser snapshot --format aria`
  - 输出：以结构化节点形式呈现的无障碍树。
  - 操作：当快照路径可通过 Playwright 和 Chrome 后端 DOM id 绑定
    该 ref 时，`openclaw browser click ax12` 可用。
- 如果 Playwright 不可用，ARIA 快照仍然可用于
  检查，但 refs 可能无法执行操作。需要可操作 ref 时，请使用 `--format ai`
  或 `--interactive` 重新生成快照。
- 原始 CDP 后备路径的 Docker 验证：`pnpm test:docker:browser-cdp-snapshot`
  会启动启用 CDP 的 Chromium，运行 `browser doctor --deep`，并验证 role
  快照包含链接 URL、光标提升的可点击元素以及 iframe 元数据。

Ref 行为：

- Refs **不会在导航后保持稳定**；如果操作失败，请重新运行 `snapshot` 并使用新的 ref。
- 当 `/act` 能够证明替换标签页时，它会在操作触发替换后返回当前原始 `targetId`。
  后续命令请继续使用稳定的标签页 id/标签。
- 如果 role 快照是在 `--frame` 下生成的，role refs 会限定在该 iframe 中，直到下一次 role 快照。
- 未知或过期的 `axN` refs 会快速失败，而不会回退到
  Playwright 的 `aria-ref` 选择器。发生这种情况时，请在同一标签页上重新生成快照。

## Wait 增强功能

你可以等待的不只是时间/文本：

- 等待 URL（支持 Playwright 的 glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
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

## 调试流程

当某个操作失败时（例如“不可见”、“严格模式冲突”、“被遮挡”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式下优先使用 role refs）
3. 如果仍然失败：使用 `openclaw browser highlight <ref>` 查看 Playwright 实际定位的目标
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 如需深度调试：录制 trace：
   - `openclaw browser trace start`
   - 重现问题
   - `openclaw browser trace stop`（输出 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本和结构化工具。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 中的 role 快照包含 `refs` 以及一个小型 `stats` 块（lines/chars/refs/interactive），以便工具推断负载大小和密度。

## 状态和环境控制项

这些对于“让站点表现得像 X 一样”的工作流很有用：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- Storage：`storage local|session get|set|clear`
- 离线：`set offline on|off`
- 标头：`set headers --headers-json '{"X-Debug":"1"}'`（旧版 `set headers --json '{"X-Debug":"1"}'` 仍然受支持）
- HTTP Basic 认证：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区 / 区域设置：`set timezone ...`、`set locale ...`
- 设备 / 视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全和隐私

- openclaw 浏览器配置可能包含已登录会话；请将其视为敏感数据。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  会在页面上下文中执行任意 JavaScript。提示注入可能会引导
  这一行为。如果你不需要它，请通过 `browser.evaluateEnabled=false` 禁用。
- 有关登录和反机器人说明（X/Twitter 等），请参见 [Browser login + X/Twitter posting](/zh-CN/tools/browser-login)。
- 请将 Gateway 网关/节点主机保持为私有（仅 loopback 或仅 tailnet）。
- 远程 CDP 端点能力很强；请通过隧道连接并加以保护。

严格模式示例（默认阻止私有/内部目标）：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // 可选的精确允许
    },
  },
}
```

## 相关内容

- [Browser](/zh-CN/tools/browser) — 概览、配置、配置文件、安全
- [Browser login](/zh-CN/tools/browser-login) — 登录网站
- [Browser Linux troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

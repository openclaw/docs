---
read_when:
    - 通过本地控制 API 对智能体浏览器进行脚本编写或调试
    - 正在查找 `openclaw browser` CLI 参考文档
    - 添加带有快照和 refs 的自定义浏览器自动化
summary: OpenClaw 浏览器控制 API、CLI 参考和脚本操作
title: 浏览器控制 API
x-i18n:
    generated_at: "2026-04-26T00:28:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebec67dbef0c63ac91f46736d73ec6f0ac21d5214cfcc47f6b8071923fe718c1
    source_path: tools/browser-control.md
    workflow: 15
---

关于设置、配置和故障排除，请参阅 [Browser](/zh-CN/tools/browser)。
本页是本地控制 HTTP API、`openclaw browser`
CLI 以及脚本模式（快照、refs、等待、调试流程）的参考文档。

## 控制 API（可选）

仅用于本地集成时，Gateway 网关会暴露一个小型 loopback HTTP API：

- 状态/启动/停止：`GET /`、`POST /start`、`POST /stop`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- 快照/截图：`GET /snapshot`、`POST /screenshot`
- 操作：`POST /navigate`、`POST /act`
- 钩子：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端点都接受 `?profile=<name>`。`POST /start?headless=true` 会为本地托管 profile 请求一次性无头启动，而不会更改持久化的浏览器配置；attach-only、远程 CDP 和 existing-session profiles 会拒绝该覆盖，因为 OpenClaw 不会启动这些浏览器进程。

如果配置了共享密钥 Gateway 网关认证，浏览器 HTTP 路由也需要认证：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` 或使用该密码的 HTTP Basic 认证

注意：

- 这个独立的 loopback 浏览器 API **不会** 使用可信代理或
  Tailscale Serve 身份标头。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些 loopback 浏览器
  路由也不会继承这些带有身份信息的模式；请将它们限制为仅 loopback 使用。

### `/act` 错误约定

`POST /act` 对路由级校验和策略失败使用结构化错误响应：

```json
{ "error": "<message>", "code": "ACT_*" }
```

当前 `code` 值：

- `ACT_KIND_REQUIRED`（HTTP 400）：缺少 `kind` 或其值无法识别。
- `ACT_INVALID_REQUEST`（HTTP 400）：操作负载归一化或校验失败。
- `ACT_SELECTOR_UNSUPPORTED`（HTTP 400）：在不支持的操作类型中使用了 `selector`。
- `ACT_EVALUATE_DISABLED`（HTTP 403）：配置禁用了 `evaluate`（或 `wait --fn`）。
- `ACT_TARGET_ID_MISMATCH`（HTTP 403）：顶层或批量 `targetId` 与请求目标冲突。
- `ACT_EXISTING_SESSION_UNSUPPORTED`（HTTP 501）：existing-session profiles 不支持该操作。

其他运行时失败仍可能返回 `{ "error": "<message>" }`，而不包含
`code` 字段。

### Playwright 要求

某些功能（navigate/act/AI 快照/角色快照、元素截图、
PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回
明确的 501 错误。

在没有 Playwright 的情况下，以下功能仍然可用：

- ARIA 快照
- 当每个标签页的 CDP
  WebSocket 可用时，托管 `openclaw` 浏览器的页面截图
- `existing-session` / Chrome MCP profiles 的页面截图
- 来自快照输出的 `existing-session` 基于 ref 的截图（`--ref`）

以下功能仍然需要 Playwright：

- `navigate`
- `act`
- AI 快照 / 角色快照
- 基于 CSS 选择器的元素截图（`--element`）
- 完整浏览器 PDF 导出

元素截图也会拒绝 `--full-page`；该路由会返回 `fullPage is
not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，请修复内置浏览器插件运行时依赖，确保已安装 `playwright-core`，
然后重启 Gateway 网关。对于打包安装，请运行 `openclaw doctor --fix`。
对于 Docker，还需要按如下所示安装 Chromium 浏览器二进制文件。

#### Docker Playwright 安装

如果你的 Gateway 网关运行在 Docker 中，请避免使用 `npx playwright`（会有 npm 覆盖冲突）。
请改用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久化浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），并确保通过
`OPENCLAW_HOME_VOLUME` 或 bind mount 持久化 `/home/node`。请参阅 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

一个小型 loopback 控制服务器接收 HTTP 请求，并通过 CDP 连接到基于 Chromium 的浏览器。高级操作（点击/输入/快照/PDF）通过位于 CDP 之上的 Playwright 完成；当缺少 Playwright 时，只有非 Playwright 操作可用。智能体看到的是一个稳定的接口，而底层的本地/远程浏览器和 profiles 可以自由切换。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 来指定特定 profile，并接受 `--json` 以输出机器可读格式。

<AccordionGroup>

<Accordion title="基础：状态、标签页、打开/聚焦/关闭">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # 一次性本地托管无头启动
openclaw browser stop            # 也会清除 attach-only/远程 CDP 上的仿真
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
openclaw browser click 12 --double           # 或对角色 refs 使用 e12
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
openclaw browser set credentials user pass            # 使用 --clear 删除
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

注意：

- `upload` 和 `dialog` 是**预设**调用；请在触发文件选择器/对话框的 click/press 之前运行它们。
- `click`/`type`/等操作需要来自 `snapshot` 的 `ref`（数字 `12`、角色 ref `e12` 或可执行的 ARIA ref `ax12`）。操作有意不支持 CSS 选择器。当可见视口位置是唯一可靠目标时，请使用 `click-coords`。
- 下载、trace 和上传路径被限制在 OpenClaw 临时根目录下：`/tmp/openclaw{,/downloads,/uploads}`（回退为：`${os.tmpdir()}/openclaw/...`）。
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入。

当 OpenClaw
能够证明替换后的标签页时，例如 URL 相同，或者表单提交后单个旧标签页变成单个新标签页，稳定的标签页 id 和标签在 Chromium 原始目标替换后仍可保留。原始 target ids 仍然是易变的；在脚本中请优先使用来自 `tabs` 的
`suggestedTargetId`。

快照标志速览：

- `--format ai`（安装 Playwright 时的默认值）：带数字 refs 的 AI 快照（`aria-ref="<n>"`）。
- `--format aria`：带 `axN` refs 的无障碍树。当 Playwright 可用时，OpenClaw 会将 refs 通过后端 DOM ids 绑定到活动页面，以便后续操作可以使用它们；否则请将输出仅视为检查用途。
- `--efficient`（或 `--mode efficient`）：紧凑角色快照预设。设置 `browser.snapshotDefaults.mode: "efficient"` 可将其设为默认值（请参阅 [Gateway 配置](/zh-CN/gateway/configuration-reference#browser)）。
- `--interactive`、`--compact`、`--depth`、`--selector` 会强制生成带 `ref=e12` refs 的角色快照。`--frame "<iframe>"` 会将角色快照限定到某个 iframe。
- `--labels` 会添加带叠加 ref 标签的仅视口截图（打印 `MEDIA:<path>`）。
- `--urls` 会将发现的链接目标地址附加到 AI 快照中。

## 快照和 refs

OpenClaw 支持两种“快照”样式：

- **AI 快照（数字 refs）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 refs 的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在内部，ref 通过 Playwright 的 `aria-ref` 解析。

- **角色快照（如 `e12` 的角色 refs）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：基于角色的列表/树，带有 `[ref=e12]`（以及可选的 `[nth=1]`）。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在内部，ref 通过 `getByRole(...)` 解析（重复项再加 `nth()`）。
  - 添加 `--labels` 可包含带叠加 `e12` 标签的视口截图。
  - 当链接文本有歧义且智能体需要明确的
    导航目标时，请添加 `--urls`。

- **ARIA 快照（如 `ax12` 的 ARIA refs）**：`openclaw browser snapshot --format aria`
  - 输出：作为结构化节点的无障碍树。
  - 操作：当快照路径可以通过 Playwright 和 Chrome 后端 DOM ids 绑定
    ref 时，`openclaw browser click ax12` 可正常工作。
  - 如果 Playwright 不可用，ARIA 快照仍可用于
    检查，但 refs 可能无法执行操作。当你需要可操作 refs 时，请使用 `--format ai`
    或 `--interactive` 重新生成快照。

ref 行为：

- refs **不会在导航后保持稳定**；如果失败，请重新运行 `snapshot` 并使用新的 ref。
- 当 `/act` 能够证明操作触发后的替换标签页时，它会返回当前原始 `targetId`
  。后续命令请继续使用稳定的标签页 ids/标签。
- 如果角色快照是使用 `--frame` 获取的，那么角色 refs 会限定在该 iframe 内，直到下一次角色快照。
- 未知或过期的 `axN` refs 会快速失败，而不会继续回退到
  Playwright 的 `aria-ref` 选择器。出现这种情况时，请在同一标签页上运行新的快照。

## Wait 增强功能

你可以等待的不只是时间/文本：

- 等待 URL（支持 Playwright 的 glob 模式）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待某个选择器变为可见：
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

当某个操作失败时（例如“not visible”“strict mode violation”“covered”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式下优先使用角色 refs）
3. 如果仍然失败：运行 `openclaw browser highlight <ref>`，查看 Playwright 实际定位的目标
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 如需深度调试：记录 trace：
   - `openclaw browser trace start`
   - 复现问题
   - `openclaw browser trace stop`（会打印 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本编写和结构化工具。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 格式的角色快照包含 `refs` 以及一个小型 `stats` 块（lines/chars/refs/interactive），以便工具判断负载大小和密度。

## 状态和环境调节项

这些功能适用于“让站点表现得像 X 一样”的工作流：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- Storage：`storage local|session get|set|clear`
- 离线：`set offline on|off`
- Headers：`set headers --headers-json '{"X-Debug":"1"}'`（旧版 `set headers --json '{"X-Debug":"1"}'` 仍然受支持）
- HTTP Basic 认证：`set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区 / 区域设置：`set timezone ...`、`set locale ...`
- 设备 / 视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- `openclaw` 浏览器 profile 可能包含已登录会话；请将其视为敏感内容。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  会在页面上下文中执行任意 JavaScript。提示注入可能会引导
  这一行为。如果你不需要它，请使用 `browser.evaluateEnabled=false` 将其禁用。
- 关于登录和反机器人说明（X/Twitter 等），请参阅 [Browser login + X/Twitter posting](/zh-CN/tools/browser-login)。
- 请保持 Gateway 网关/节点主机为私有（仅 loopback 或仅 tailnet）。
- 远程 CDP 端点功能强大；请通过隧道进行访问并做好保护。

严格模式示例（默认阻止私有/内部目标地址）：

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

- [Browser](/zh-CN/tools/browser) — 概览、配置、profiles、安全
- [Browser login](/zh-CN/tools/browser-login) — 登录网站
- [Browser Linux troubleshooting](/zh-CN/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

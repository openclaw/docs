---
read_when:
    - 你使用 `openclaw browser`，并希望查看常见任务的示例
    - 你想通过节点主机控制另一台机器上运行的浏览器
    - 你想通过 Chrome MCP 连接到你本地已登录的 Chrome
summary: '`openclaw browser` 的 CLI 参考（生命周期、配置文件、标签页、操作、状态和调试）'
title: 浏览器
x-i18n:
    generated_at: "2026-04-26T00:28:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 327fea6dc23c58c94dcf67b4ce53a6afbf204fbf64523c3d0bcb7c727594e659
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

管理 OpenClaw 的浏览器控制界面并运行浏览器操作（生命周期、配置文件、标签页、快照、截图、导航、输入、状态模拟和调试）。

相关内容：

- 浏览器工具 + API：[浏览器工具](/zh-CN/tools/browser)

## 常用标志

- `--url <gatewayWsUrl>`：Gateway 网关 WebSocket URL（默认为配置中的值）。
- `--token <token>`：Gateway 网关令牌（如果需要）。
- `--timeout <ms>`：请求超时时间（毫秒）。
- `--expect-final`：等待最终的 Gateway 网关响应。
- `--browser-profile <name>`：选择浏览器配置文件（默认为配置中的值）。
- `--json`：机器可读输出（在支持的地方）。

## 快速开始（本地）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

智能体也可以使用 `browser({ action: "doctor" })` 运行相同的就绪检查。

## 快速故障排除

如果 `start` 因 `not reachable after start` 失败，先排查 CDP 就绪状态。如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则说明浏览器控制平面是健康的，失败通常是导航 SSRF 策略导致的。

最小操作序列：

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

详细指导：[浏览器故障排除](/zh-CN/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## 生命周期

```bash
openclaw browser status
openclaw browser doctor
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

说明：

- 对于 `attachOnly` 和远程 CDP 配置文件，即使 OpenClaw 本身没有启动浏览器进程，`openclaw browser stop` 也会关闭当前控制会话并清除临时模拟覆盖项。
- 对于本地受管配置文件，`openclaw browser stop` 会停止已启动的浏览器进程。
- `openclaw browser start --headless` 仅适用于该次启动请求，且仅在 OpenClaw 启动本地受管浏览器时生效。它不会重写 `browser.headless` 或配置文件配置，并且对于已经运行的浏览器不会产生任何效果。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，本地受管配置文件会自动以无头模式运行，除非 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false` 或 `browser.profiles.<name>.headless=false` 明确请求显示浏览器界面。

## 如果命令不存在

如果 `openclaw browser` 是未知命令，请检查 `~/.openclaw/openclaw.json` 中的 `plugins.allow`。

当存在 `plugins.allow` 时，内置的浏览器插件必须被显式列出：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

当插件允许列表排除了 `browser` 时，`browser.enabled=true` 不会恢复这个 CLI 子命令。

相关内容：[浏览器工具](/zh-CN/tools/browser#missing-browser-command-or-tool)

## 配置文件

配置文件是具名的浏览器路由配置。实际使用中：

- `openclaw`：启动或连接到专用的 OpenClaw 管理的 Chrome 实例（隔离的用户数据目录）。
- `user`：通过 Chrome DevTools MCP 控制你现有的已登录 Chrome 会话。
- 自定义 CDP 配置文件：指向本地或远程 CDP 端点。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

使用指定配置文件：

```bash
openclaw browser --browser-profile work tabs
```

## 标签页

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` 会优先返回 `suggestedTargetId`，然后是稳定的 `tabId`（如 `t1`）、可选标签以及原始 `targetId`。智能体应将 `suggestedTargetId` 传回 `focus`、`close`、快照和操作命令中。你可以使用 `open --label`、`tab new --label` 或 `tab label` 分配标签；标签、标签页 ID、原始目标 ID，以及唯一的目标 ID 前缀都可被接受。
当 Chromium 在导航或表单提交期间替换底层原始目标时，只要 OpenClaw 能够确认匹配关系，就会将稳定的 `tabId`/标签保留并附加到替换后的标签页。原始目标 ID 仍然是易变的；优先使用 `suggestedTargetId`。

## 快照 / 截图 / 操作

快照：

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

截图：

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

说明：

- `--full-page` 仅用于页面截图；不能与 `--ref` 或 `--element` 一起使用。
- `existing-session` / `user` 配置文件支持页面截图和使用快照输出中的 `--ref` 进行截图，但不支持 CSS `--element` 截图。
- `--labels` 会在截图上叠加当前快照引用标记。
- `snapshot --urls` 会将发现的链接目标地址附加到 AI 快照中，以便智能体直接选择导航目标，而不是仅根据链接文本猜测。

导航/点击/输入（基于 ref 的 UI 自动化）：

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

当 OpenClaw 能够确认替换后的标签页时，操作响应会在由操作触发的页面替换之后返回当前原始 `targetId`。但脚本仍应在长期工作流中存储并传递 `suggestedTargetId`/标签。

文件 + 对话框辅助命令：

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

受管 Chrome 配置文件会将普通点击触发的下载保存到 OpenClaw 下载目录（默认是 `/tmp/openclaw/downloads`，或配置的临时根目录）。当智能体需要等待特定文件并返回其路径时，请使用 `waitfordownload` 或 `download`；这些显式等待器会接管下一次下载。

## 状态和存储

视口 + 模拟：

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookies + 存储：

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## 调试

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## 通过 MCP 使用现有 Chrome

使用内置的 `user` 配置文件，或创建你自己的 `existing-session` 配置文件：

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

此路径仅限主机本地使用。对于 Docker、无头服务器、Browserless 或其他远程设置，请改用 CDP 配置文件。

当前 existing-session 的限制：

- 快照驱动的操作使用 refs，而不是 CSS 选择器
- 当调用方省略 `timeoutMs` 时，`browser.actionTimeoutMs` 会将受支持的 `act` 请求默认设置为 60000 毫秒；但每次调用的 `timeoutMs` 仍然优先生效。
- `click` 仅支持左键点击
- `type` 不支持 `slowly=true`
- `press` 不支持 `delayMs`
- `hover`、`scrollintoview`、`drag`、`select`、`fill` 和 `evaluate` 会拒绝每次调用的超时覆盖
- `select` 仅支持一个值
- 不支持 `wait --load networkidle`
- 文件上传需要 `--ref` / `--input-ref`，不支持 CSS `--element`，且当前一次只支持一个文件
- 对话框钩子不支持 `--timeout`
- 截图支持页面截图和 `--ref`，但不支持 CSS `--element`
- `responsebody`、下载拦截、PDF 导出和批量操作仍然需要受管浏览器或原始 CDP 配置文件

## 远程浏览器控制（节点主机代理）

如果 Gateway 网关运行在与浏览器不同的机器上，请在安装有 Chrome/Brave/Edge/Chromium 的机器上运行一个**节点主机**。Gateway 网关会将浏览器操作代理到该节点（不需要单独的浏览器控制服务器）。

使用 `gateway.nodes.browser.mode` 控制自动路由，并在连接了多个节点时使用 `gateway.nodes.browser.node` 固定到特定节点。

安全性 + 远程设置：[浏览器工具](/zh-CN/tools/browser)、[远程访问](/zh-CN/gateway/remote)、[Tailscale](/zh-CN/gateway/tailscale)、[安全性](/zh-CN/gateway/security)

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [浏览器](/zh-CN/tools/browser)

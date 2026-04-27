---
read_when:
    - 你使用 `openclaw browser`，并且想要查看常见任务的示例
    - 你想通过节点主机控制运行在另一台机器上的浏览器
    - 你想通过 Chrome MCP 连接到你本地已登录的 Chrome
summary: '`openclaw browser` 的 CLI 参考（生命周期、配置档案、标签页、操作、状态和调试）'
title: 浏览器
x-i18n:
    generated_at: "2026-04-27T08:44:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

管理 OpenClaw 的浏览器控制界面并运行浏览器操作（生命周期、配置档案、标签页、快照、截图、导航、输入、状态模拟和调试）。

相关内容：

- 浏览器工具 + API：[Browser 工具](/zh-CN/tools/browser)

## 常用标志

- `--url <gatewayWsUrl>`：Gateway 网关 WebSocket URL（默认来自配置）。
- `--token <token>`：Gateway 网关令牌（如果需要）。
- `--timeout <ms>`：请求超时时间（毫秒）。
- `--expect-final`：等待最终的 Gateway 网关响应。
- `--browser-profile <name>`：选择浏览器配置档案（默认来自配置）。
- `--json`：机器可读输出（在支持的地方）。

## 快速开始（本地）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

智能体也可以使用同样的就绪检查：`browser({ action: "doctor" })`。

## 快速故障排除

如果 `start` 失败并显示 `not reachable after start`，请先排查 CDP 就绪状态。如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，说明浏览器控制平面是正常的，而失败通常是导航 SSRF 策略导致的。

最小排查顺序：

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

详细指南：[浏览器故障排除](/zh-CN/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## 生命周期

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

说明：

- `doctor --deep` 会增加一个实时快照探测。当基础 CDP 就绪状态显示正常，但你想确认当前标签页确实可被检查时，这会很有用。
- 对于 `attachOnly` 和远程 CDP 配置档案，`openclaw browser stop` 会关闭当前活动控制会话，并清除临时模拟覆盖项，即使 OpenClaw 本身没有启动浏览器进程也是如此。
- 对于本地受管配置档案，`openclaw browser stop` 会停止所启动的浏览器进程。
- `openclaw browser start --headless` 仅适用于这一次启动请求，并且只在 OpenClaw 启动本地受管浏览器时生效。它不会改写 `browser.headless` 或配置档案配置，对于已经在运行的浏览器也不会产生效果。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，本地受管配置档案会自动以无头模式运行，除非 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false` 或 `browser.profiles.<name>.headless=false` 明确要求显示浏览器界面。

## 如果命令不存在

如果 `openclaw browser` 是未知命令，请检查 `~/.openclaw/openclaw.json` 中的 `plugins.allow`。

当存在 `plugins.allow` 时，请显式列出内置的浏览器插件，除非配置中已经有根级 `browser` 块：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根级 `browser` 块，例如 `browser.enabled=true` 或 `browser.profiles.<name>`，也会在受限的插件允许列表下激活内置浏览器插件。

相关内容：[Browser 工具](/zh-CN/tools/browser#missing-browser-command-or-tool)

## 配置档案

配置档案是具名的浏览器路由配置。实际使用中：

- `openclaw`：启动或连接到专用的 OpenClaw 受管 Chrome 实例（隔离的用户数据目录）。
- `user`：通过 Chrome DevTools MCP 控制你当前已登录的 Chrome 会话。
- 自定义 CDP 配置档案：指向本地或远程 CDP 端点。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

使用特定配置档案：

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

`tabs` 会先返回 `suggestedTargetId`，然后是稳定的 `tabId`（如 `t1`）、可选标签以及原始 `targetId`。智能体应将 `suggestedTargetId` 传回 `focus`、`close`、快照和操作命令。你可以通过 `open --label`、`tab new --label` 或 `tab label` 分配标签；标签、标签页 ID、原始目标 ID，以及唯一的目标 ID 前缀都可以使用。
当 Chromium 在导航或表单提交期间替换底层原始目标时，只要 OpenClaw 能够确认匹配关系，就会将稳定的 `tabId`/标签附加到替换后的标签页上。原始目标 ID 仍然是不稳定的；优先使用 `suggestedTargetId`。

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

- `--full-page` 仅用于整页截图；不能与 `--ref` 或 `--element` 组合使用。
- `existing-session` / `user` 配置档案支持整页截图，以及基于快照输出中的 `--ref` 的截图，但不支持 CSS `--element` 截图。
- `--labels` 会在截图上叠加当前快照引用标记。
- `snapshot --urls` 会将已发现的链接目标地址追加到 AI 快照中，这样智能体就可以选择直接导航目标，而不必仅根据链接文本猜测。

导航 / 点击 / 输入（基于 ref 的 UI 自动化）：

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

在 OpenClaw 能够确认替换标签页时，操作响应会在操作触发页面替换后返回当前原始 `targetId`。对于长生命周期工作流，脚本仍应存储并传递 `suggestedTargetId`/标签。

文件和对话框辅助命令：

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

受管 Chrome 配置档案会将普通点击触发的下载保存到 OpenClaw 下载目录（默认是 `/tmp/openclaw/downloads`，或已配置的临时根目录）。当智能体需要等待特定文件并返回其路径时，请使用 `waitfordownload` 或 `download`；这些显式等待器会接管下一次下载。

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

使用内置的 `user` 配置档案，或者创建你自己的 `existing-session` 配置档案：

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

这一路径仅适用于主机本机。对于 Docker、无头服务器、Browserless 或其他远程设置，请改用 CDP 配置档案。

当前 existing-session 的限制：

- 基于快照的操作使用 ref，而不是 CSS 选择器
- 当调用方省略 `timeoutMs` 时，`browser.actionTimeoutMs` 会将受支持的 `act` 请求默认设置为 60000 毫秒；但每次调用传入的 `timeoutMs` 仍然优先生效。
- `click` 仅支持左键点击
- `type` 不支持 `slowly=true`
- `press` 不支持 `delayMs`
- `hover`、`scrollintoview`、`drag`、`select`、`fill` 和 `evaluate` 会拒绝每次调用的超时覆盖
- `select` 仅支持单个值
- 不支持 `wait --load networkidle`
- 文件上传需要 `--ref` / `--input-ref`，不支持 CSS `--element`，并且当前一次只支持一个文件
- 对话框钩子不支持 `--timeout`
- 截图支持整页截图和 `--ref`，但不支持 CSS `--element`
- `responsebody`、下载拦截、PDF 导出以及批量操作仍然需要受管浏览器或原始 CDP 配置档案

## 远程浏览器控制（节点主机代理）

如果 Gateway 网关运行在与浏览器不同的机器上，请在安装了 Chrome/Brave/Edge/Chromium 的机器上运行一个**节点主机**。Gateway 网关会将浏览器操作代理到该节点（不需要单独的浏览器控制服务器）。

使用 `gateway.nodes.browser.mode` 控制自动路由，并使用 `gateway.nodes.browser.node` 在连接了多个节点时固定到特定节点。

安全性与远程设置：[Browser 工具](/zh-CN/tools/browser)、[远程访问](/zh-CN/gateway/remote)、[Tailscale](/zh-CN/gateway/tailscale)、[安全性](/zh-CN/gateway/security)

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Browser](/zh-CN/tools/browser)

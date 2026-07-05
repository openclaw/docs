---
read_when:
    - 你使用 `openclaw browser`，并想要常见任务的示例
    - 你想通过节点主机控制另一台机器上运行的浏览器
    - 你想通过 Chrome MCP 连接到本地已登录的 Chrome
summary: '`openclaw browser` 的 CLI 参考（生命周期、配置档案、标签页、操作、状态和调试）'
title: 浏览器
x-i18n:
    generated_at: "2026-07-05T11:08:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82070c47ee06bf8dc5e3463ea17d2ef4b9c6adcc9a1e830d745986e7162fd6b1
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

管理 OpenClaw 的浏览器控制界面并运行浏览器操作：生命周期、配置文件、标签页、快照、截图、导航、输入、状态模拟和调试。

相关：[浏览器工具](/zh-CN/tools/browser)

## 常用标志

- `--url <gatewayWsUrl>`：Gateway 网关 WebSocket URL（默认使用配置）。
- `--token <token>`：Gateway 网关 token（如需要）。
- `--timeout <ms>`：请求超时时间，单位为 ms（默认：`30000`）。
- `--expect-final`：等待最终 Gateway 网关响应。
- `--browser-profile <name>`：选择浏览器配置文件（默认：`openclaw`，或 `browser.defaultProfile`）。
- `--json`：机器可读输出（在支持的位置）。

## 快速开始（本地）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

智能体可以使用 `browser({ action: "doctor" })` 运行相同的就绪检查。

## 快速故障排查

如果 `start` 失败并显示 `not reachable after start`，请先排查 CDP 就绪状态。如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则浏览器控制平面是健康的，失败通常是导航 SSRF 策略阻止导致的。

最小序列：

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

详细指南：[浏览器故障排查](/zh-CN/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- `doctor --deep` 会添加实时快照探测：当基础 CDP 就绪状态为绿色，但你需要证明当前标签页可以被检查时很有用。
- `stop` 会关闭活动控制会话，并清除临时模拟覆盖；即使是 OpenClaw 未自行启动浏览器进程的 `attachOnly` 和远程 CDP 配置文件也是如此。对于本地托管配置文件，`stop` 还会停止已启动的浏览器进程。
- `start --headless` 仅应用于该次启动请求，并且仅在 OpenClaw 启动本地托管浏览器时生效。它不会重写 `browser.headless` 或配置文件配置，对于已经运行的浏览器则不会产生效果。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，本地托管配置文件会自动以 headless 方式运行，除非 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false` 或 `browser.profiles.<name>.headless=false` 显式请求可见浏览器。

## 如果命令缺失

如果 `openclaw browser` 是未知命令，请检查 `~/.openclaw/openclaw.json` 中的 `plugins.allow`。当存在 `plugins.allow` 时，除非配置已有根级 `browser` 块，否则请显式列出内置浏览器插件：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根级 `browser` 块（例如 `browser.enabled=true` 或 `browser.profiles.<name>`）也会在限制性插件 allowlist 下激活内置浏览器插件。

相关：[浏览器工具](/zh-CN/tools/browser#missing-browser-command-or-tool)

## 配置文件

配置文件是具名浏览器路由配置：

- `openclaw`（默认）：启动或附加到专用的 OpenClaw 托管 Chrome 实例（隔离的用户数据目录）。
- `user`：通过 Chrome DevTools MCP 控制你现有的已登录 Chrome 会话。
- 自定义 CDP 配置文件：指向本地或远程 CDP 端点。

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

在任何子命令上使用 `--browser-profile <name>` 指定配置文件，例如 `openclaw browser --browser-profile work tabs`。

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

`tabs` 会先返回 `suggestedTargetId`，然后返回稳定的 `tabId`（例如 `t1`）、可选标签以及原始 `targetId`。将 `suggestedTargetId` 传回 `focus`、`close`、快照和操作。使用 `open --label`、`tab new --label` 或 `tab label` 分配标签；标签、标签页 ID、原始目标 ID 以及唯一的目标 ID 前缀都可以接受。为兼容性，请求字段仍命名为 `targetId`，但它接受这些标签页引用中的任意一种。

原始目标 ID 是易变的诊断句柄，不是持久智能体记忆：当 Chromium 在导航或表单提交期间替换底层原始目标时，如果 OpenClaw 能证明匹配，就会将稳定的 `tabId`/标签附加到替换后的标签页。优先使用 `suggestedTargetId`。

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

- `--full-page` 仅用于页面捕获；不能与 `--ref` 或 `--element` 组合使用。
- `existing-session` / `user` 配置文件支持页面截图以及来自快照输出的 `--ref` 截图，但不支持 CSS `--element` 截图。
- `--labels` 会在截图上叠加当前快照引用。在 Playwright 支持的配置文件上，它可与 `--full-page`（整页叠加）、`--ref`（按 ARIA 引用的元素裁剪叠加）和 `--element`（按 CSS 选择器的元素裁剪叠加）一起使用；在元素裁剪模式中，标签会相对于元素投影。响应还包含一个 `annotations` 数组（为空时省略），其中包含每个引用的边界框：捕获图像坐标空间（视口 / 整页 / 元素相对）中的 `ref`、`number`、`role`、可选 `name` 以及 `box: {x, y, width, height}`。
  `existing-session` 配置文件会在页面截图上渲染 chrome-mcp 叠加层，但不使用 Playwright 投影辅助程序，也不包含 `annotations`；那里不支持 CSS `--element` 截图。没有 Playwright 或 chrome-mcp 时，带标签截图不可用。
- `snapshot --urls` 会将发现的链接目标追加到 AI 快照中，以便智能体可以选择直接导航目标，而不是仅根据链接文本猜测。

导航/点击/输入（基于引用的 UI 自动化）：

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` 接受函数源码、表达式或语句体。语句体会被包装为 async 函数，因此请使用 `return` 返回你想要的值。当页面侧函数可能需要比默认 evaluate 超时时间更长时，请使用 `--timeout-ms`。`browser.evaluateEnabled=false`（默认：`true`）会同时禁用 `evaluate` 和 `wait --fn`。

当 OpenClaw 能证明替换标签页时，操作响应会在操作触发页面替换后返回当前原始 `targetId`。脚本仍应存储并传递 `suggestedTargetId`/标签，用于长期工作流。

文件 + 对话框辅助：

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

托管 Chrome 配置文件会将普通点击触发的下载保存到 OpenClaw 下载目录（默认是 `/tmp/openclaw/downloads`，或配置的临时根目录）。当智能体需要等待特定文件并返回其路径时，请使用 `waitfordownload` 或 `download`；这些显式等待器拥有下一次下载。上传接受来自 OpenClaw 临时上传根目录和 OpenClaw 托管入站媒体的文件，包括 `media://inbound/<id>` 和沙箱相对的 `media/inbound/<id>` 引用。嵌套媒体引用、路径遍历和任意本地路径都会被拒绝。

当某个操作打开模态对话框时，操作响应会返回包含 `browserState.dialogs.pending` 的 `blockedByDialog`；传入 `--dialog-id` 可直接响应该对话框。在 OpenClaw 外部处理的对话框会出现在 `browserState.dialogs.recent` 下。

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

Cookie + 存储：

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
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

默认的 existing-session 路径是仅主机 Chrome MCP 自动连接。如果浏览器已带 DevTools 端点运行，请传入 `--cdp-url`，让 Chrome MCP 改为附加到该端点。对于 Docker、Browserless 或其他不需要 Chrome MCP 语义的远程设置，请改用 CDP 配置文件。

当前 existing-session 限制：

- 快照驱动的操作使用引用，而不是 CSS 选择器。
- 当调用方省略 `timeoutMs` 时，`browser.actionTimeoutMs` 会将受支持的 `act` 请求默认设为 60000 ms；每次调用的 `timeoutMs` 仍然优先。
- `click` 仅支持左键点击。
- `type` 不支持 `slowly=true`。
- `press` 不支持 `delayMs`。
- `hover`、`scrollintoview`、`drag`、`select`、`fill` 和 `evaluate` 会拒绝每次调用的超时覆盖。
- `select` 仅支持一个值。
- 不支持 `wait --load networkidle`（在托管和原始/远程 CDP 配置文件上可用）。
- 文件上传需要 `--ref` / `--input-ref`，不支持 CSS `--element`，并且一次只支持一个文件。
- 对话框钩子不支持 `--timeout`。
- 截图支持页面捕获和 `--ref`，但不支持 CSS `--element`。
- `responsebody`、下载拦截、PDF 导出和批量操作仍需要托管浏览器或原始 CDP 配置文件。

## 远程浏览器控制（node 主机代理）

如果 Gateway 网关运行在与浏览器不同的机器上，请在装有 Chrome/Brave/Edge/Chromium 的机器上运行一个 **node 主机**。Gateway 网关会将浏览器操作代理到该节点；不需要单独的浏览器控制服务器。

使用 `gateway.nodes.browser.mode` 控制自动路由，并在连接了多个节点时使用 `gateway.nodes.browser.node` 固定到特定节点。

安全 + 远程设置：[浏览器工具](/zh-CN/tools/browser)、[远程访问](/zh-CN/gateway/remote)、[Tailscale](/zh-CN/gateway/tailscale)、[安全](/zh-CN/gateway/security)

## 相关

- [CLI 参考](/zh-CN/cli)
- [浏览器](/zh-CN/tools/browser)

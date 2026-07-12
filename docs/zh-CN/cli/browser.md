---
read_when:
    - 你使用 `openclaw browser`，并希望查看常见任务的示例
    - 你想通过节点主机控制在另一台计算机上运行的浏览器
    - 你希望通过 Chrome MCP 连接到本地已登录的 Chrome 浏览器
summary: '`openclaw browser` 的 CLI 参考（生命周期、配置文件、标签页、操作、状态和调试）'
title: 浏览器
x-i18n:
    generated_at: "2026-07-12T14:20:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

管理 OpenClaw 的浏览器控制界面并执行浏览器操作：生命周期、配置文件、标签页、快照、屏幕截图、导航、输入、状态模拟和调试。

相关：[浏览器工具](/zh-CN/tools/browser)

## 常用标志

- `--url <gatewayWsUrl>`：Gateway 网关 WebSocket URL（默认为配置值）。
- `--token <token>`：Gateway 网关令牌（如需要）。
- `--timeout <ms>`：请求超时（单位为 ms，默认值：`30000`）。
- `--expect-final`：等待 Gateway 网关的最终响应。
- `--browser-profile <name>`：选择浏览器配置文件（默认值：`openclaw`，或 `browser.defaultProfile`）。
- `--json`：机器可读输出（在支持的命令中）。这是浏览器级选项，因此
  应将其放在子命令之前以避免歧义，例如
  `openclaw browser --json status`。也可以将其放在末尾，例如
  `openclaw browser status --json`，前提是所选子命令自身未
  定义 `--json`。

## 快速开始（本地）

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

智能体可以使用 `browser({ action: "doctor" })` 执行相同的就绪检查。

## 快速故障排除

如果 `start` 失败并显示 `not reachable after start`，请先排查 CDP 就绪问题。如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则浏览器控制平面运行正常，失败通常是导航 SSRF 策略阻止所致。

最小操作序列：

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

- `doctor --deep` 会添加实时快照探测：当基本 CDP 就绪检查正常，但你希望确认当前标签页可以被检查时，此功能非常有用。
- 对于正在运行的本地托管配置文件，`status` 和 `doctor` 会报告来自 Chrome 的缓存
  图形诊断信息：硬件/软件分类、渲染器、
  后端、设备/驱动程序、功能和禁用状态详细信息，以及硬件加速
  视频能力。`openclaw browser --json status` 返回完整的结构化载荷。
  被动状态检查绝不会仅为收集这些信息而启动 Chrome。
- `stop` 会关闭活动控制会话并清除临时模拟覆盖，即使是 OpenClaw 未自行启动浏览器进程的 `attachOnly` 和远程 CDP 配置文件也如此。对于本地托管配置文件，`stop` 还会停止已生成的浏览器进程。
- `start --headless` 仅应用于该次启动请求，且仅在 OpenClaw 启动本地托管浏览器时生效。它不会改写 `browser.headless` 或配置文件配置，对已经运行的浏览器则不执行任何操作。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，本地托管配置文件会自动以无头模式运行，除非 `OPENCLAW_BROWSER_HEADLESS=0`、`browser.headless=false` 或 `browser.profiles.<name>.headless=false` 明确要求使用可见浏览器。

## 如果命令缺失

如果 `openclaw browser` 是未知命令，请检查 `~/.openclaw/openclaw.json` 中的 `plugins.allow`。如果存在 `plugins.allow`，除非配置中已有根级 `browser` 块，否则请显式列出内置浏览器插件：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根级 `browser` 块（例如 `browser.enabled=true` 或 `browser.profiles.<name>`）也会在限制性插件允许列表下激活内置浏览器插件。

相关：[浏览器工具](/zh-CN/tools/browser#missing-browser-command-or-tool)

## 配置文件

配置文件是具名的浏览器路由配置：

- `openclaw`（默认）：启动或连接到专用的 OpenClaw 托管 Chrome 实例（隔离的用户数据目录）。
- `user`：通过 Chrome DevTools MCP 控制你现有的已登录 Chrome 会话。
- 自定义 CDP 配置文件：指向本地或远程 CDP 端点。

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

在任何子命令中使用 `--browser-profile <name>` 来指定配置文件，例如 `openclaw browser --browser-profile work tabs`。

在 macOS 上，`system-profiles` 会列出主机上可用的真实 Chrome、Brave、Edge 或 Chromium 配置文件。`import-profile` 会在一次 macOS Keychain/Touch ID 同意提示后解密其 Cookie，并将其注入新的 OpenClaw 托管配置文件。它仅导入 Cookie；本地存储和 IndexedDB 保持不变。某些 Google 会话使用设备绑定会话凭据（DBSC），导入后仍可能需要重新进行身份验证。

当 macOS 应用使用本地 Gateway 网关时，它可以提供一次此导入选项，并将隔离的已导入配置文件设为智能体浏览的默认配置文件。导入始终需要显式点击；成功导入或关闭提示后，将不再自动显示后续提示，但 **Settings → General → Browser login** 仍可用于重新导入。

系统配置文件导入默认启用。将 `browser.allowSystemProfileImport=false` 设为禁用 CLI 和智能体触发的导入。导入仅能在主机本地执行，无法通过浏览器节点代理运行。

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

`tabs` 首先返回 `suggestedTargetId`，然后返回稳定的 `tabId`（例如 `t1`）、可选标签和原始 `targetId`。将 `suggestedTargetId` 传回 `focus`、`close`、快照和操作。可使用 `open --label`、`tab new --label` 或 `tab label` 分配标签；标签、标签页 ID、原始目标 ID 和唯一的目标 ID 前缀均可使用。为保持兼容性，请求字段仍名为 `targetId`，但它接受上述任意标签页引用。

原始目标 ID 是易变的诊断句柄，不是持久的智能体记忆：当 Chromium 在导航或表单提交期间替换底层原始目标时，如果 OpenClaw 能够确认匹配关系，就会让稳定的 `tabId`/标签继续关联到替换后的标签页。优先使用 `suggestedTargetId`。

## 快照 / 屏幕截图 / 操作

快照：

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

屏幕截图：

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` 仅用于页面捕获；不能与 `--ref` 或 `--element` 结合使用。
- `existing-session` / `user` 配置文件支持页面屏幕截图以及根据快照输出进行的 `--ref` 屏幕截图，但不支持使用 CSS `--element` 进行屏幕截图。
- `--labels` 会在屏幕截图上叠加当前快照引用。在由 Playwright 支持的配置文件中，它可与 `--full-page`（整页叠加）、`--ref`（按 ARIA 引用裁剪元素并叠加）和 `--element`（按 CSS 选择器裁剪元素并叠加）配合使用；在元素裁剪模式下，标签会相对于元素进行投影。响应还包含一个 `annotations` 数组（为空时省略），其中包含每个引用的边界框：`ref`、`number`、`role`、可选的 `name`，以及捕获图像坐标空间（视口 / 整页 / 元素相对）中的 `box: {x, y, width, height}`。
  `existing-session` 配置文件会在页面屏幕截图上渲染 chrome-mcp 叠加层，但不使用 Playwright 投影辅助程序，也不包含 `annotations`；其中不支持 CSS `--element` 屏幕截图。如果没有 Playwright 或 chrome-mcp，则无法使用带标签的屏幕截图。
- `snapshot --urls` 会将发现的链接目标附加到 AI 快照，以便智能体直接选择导航目标，而不必仅根据链接文本猜测。

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

`evaluate --fn` 接受函数源代码、表达式或语句体。语句体会被封装为异步函数，因此请使用 `return` 返回所需值。当页面端函数可能需要超过默认求值超时的时间时，请使用 `--timeout-ms`。`browser.evaluateEnabled=false`（默认值：`true`）会同时禁用 `evaluate` 和 `wait --fn`。

当 OpenClaw 能够确认替换后的标签页时，操作响应会在操作触发页面替换后返回当前的原始 `targetId`。对于长期运行的工作流，脚本仍应存储并传递 `suggestedTargetId`/标签。

文件和对话框辅助命令：

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

托管 Chrome 配置文件会将普通点击触发的下载保存到 OpenClaw 下载目录（默认值为 `/tmp/openclaw/downloads`，或配置的临时根目录）。当智能体需要等待特定文件并返回其路径时，请使用 `waitfordownload` 或 `download`；这些显式等待器会接管下一次下载。上传支持 OpenClaw 临时上传根目录中的文件和 OpenClaw 托管的入站媒体，包括 `media://inbound/<id>` 和相对于沙箱的 `media/inbound/<id>` 引用。嵌套媒体引用、路径遍历和任意本地路径会被拒绝。

当操作打开模态对话框时，操作响应会返回带有 `browserState.dialogs.pending` 的 `blockedByDialog`；传递 `--dialog-id` 可直接响应。通过 OpenClaw 外部方式处理的对话框会显示在 `browserState.dialogs.recent` 下。

## 状态和存储

视口和模拟：

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

Cookie 和存储：

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

默认的 existing-session 路径仅用于在主机上通过 Chrome MCP 自动连接。如果浏览器已通过 DevTools 端点运行，请传入 `--cdp-url`，让 Chrome MCP 改为连接该端点。对于不需要 Chrome MCP 语义的 Docker、Browserless 或其他远程设置，请改用 CDP 配置文件。

当前 existing-session 的限制：

- 快照驱动的操作使用 ref，而非 CSS 选择器。
- 当调用方省略 `timeoutMs` 时，`browser.actionTimeoutMs` 会将受支持的 `act` 请求默认设为 60000 ms；每次调用传入的 `timeoutMs` 仍然优先。
- `click` 仅支持左键单击。
- `type` 不支持 `slowly=true`。
- `press` 不支持 `delayMs`。
- `hover`、`scrollintoview`、`drag`、`select` 和 `fill` 不接受每次调用的超时覆盖；`evaluate` 接受 `--timeout-ms`。
- `select` 仅支持一个值。
- 不支持 `wait --load networkidle`（托管配置文件和原始/远程 CDP 配置文件支持）。
- 文件上传需要使用 `--ref` / `--input-ref`，不支持 CSS `--element`，并且一次只能上传一个文件。
- 对话框钩子不支持 `--timeout`。
- 截图支持页面捕获和 `--ref`，但不支持 CSS `--element`。
- `responsebody`、下载拦截、PDF 导出和批量操作仍需要托管浏览器或原始 CDP 配置文件。

## 远程浏览器控制（节点主机代理）

如果 Gateway 网关与浏览器运行在不同的机器上，请在安装了 Chrome/Brave/Edge/Chromium 的机器上运行一个**节点主机**。Gateway 网关会将浏览器操作代理到该节点；无需单独的浏览器控制服务器。

使用 `gateway.nodes.browser.mode` 控制自动路由；如果连接了多个节点，请使用 `gateway.nodes.browser.node` 固定到特定节点。

安全与远程设置：[浏览器工具](/zh-CN/tools/browser)、[远程访问](/zh-CN/gateway/remote)、[Tailscale](/zh-CN/gateway/tailscale)、[安全](/zh-CN/gateway/security)

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [浏览器](/zh-CN/tools/browser)

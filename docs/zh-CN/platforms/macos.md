---
read_when:
    - 实现 macOS 应用功能
    - 更改 macOS 上的 Gateway 网关生命周期或节点桥接
summary: OpenClaw macOS 配套应用（菜单栏 + Gateway 网关代理）
title: macOS 应用
x-i18n:
    generated_at: "2026-06-27T02:33:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

macOS 应用是 OpenClaw 的**菜单栏配套应用**。它负责权限，
在本地管理/连接 Gateway 网关（launchd 或手动），并将 macOS
能力作为节点暴露给智能体。

## 它的作用

- 在菜单栏显示原生通知和状态。
- 负责 TCC 提示（通知、辅助功能、屏幕录制、麦克风、
  语音识别、自动化/AppleScript）。
- 运行或连接到 Gateway 网关（本地或远程）。
- 暴露仅限 macOS 的工具（Canvas、Camera、Screen Recording、`system.run`）。
- 在**远程**模式下启动本地节点主机服务（launchd），并在**本地**模式下停止它。
- 可选托管 **PeekabooBridge** 以进行 UI 自动化。
- 按需通过 npm、pnpm 或 bun 安装全局 CLI（`openclaw`）（应用优先使用 npm，其次是 pnpm，再其次是 bun；Node 仍是推荐的 Gateway 网关运行时）。

## 本地模式与远程模式

- **本地**（默认）：如果存在正在运行的本地 Gateway 网关，应用会连接到它；
  否则会通过 `openclaw gateway install` 启用 launchd 服务。
- **远程**：应用通过 SSH/Tailscale 连接到 Gateway 网关，且绝不启动
  本地进程。
  应用会启动本地**节点主机服务**，让远程 Gateway 网关可以访问这台 Mac。
  应用不会将 Gateway 网关作为子进程生成。
  Gateway 网关发现现在优先使用 Tailscale MagicDNS 名称，而不是原始 tailnet IP，
  因此当 tailnet IP 变化时，Mac 应用能更可靠地恢复。

## Launchd 控制

应用管理一个按用户配置的 LaunchAgent，标签为 `ai.openclaw.gateway`
（使用 `--profile`/`OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 仍会卸载）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

运行命名配置文件时，将标签替换为 `ai.openclaw.<profile>`。

如果未安装 LaunchAgent，请从应用启用它，或运行
`openclaw gateway install`。

如果 Gateway 网关反复消失数分钟到数小时，并且只有在你触碰 Control UI 或通过 SSH 进入主机后才恢复，请参阅 [Gateway 故障排除](/zh-CN/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard) 中关于 macOS Maintenance Sleep / `ENETDOWN` 崩溃以及 launchd 重生保护门的故障排除说明。

## 节点能力（Mac）

macOS 应用将自身呈现为一个节点。常用命令：

- Canvas：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- Camera：`camera.snap`、`camera.clip`
- Screen：`screen.snapshot`、`screen.record`
- System：`system.run`、`system.notify`

节点会报告一个 `permissions` 映射，以便智能体决定允许执行什么。

节点服务 + 应用 IPC：

- 当无头节点主机服务正在运行时（远程模式），它会作为节点连接到 Gateway 网关 WS。
- `system.run` 通过本地 Unix socket 在 macOS 应用中执行（UI/TCC 上下文）；提示 + 输出保留在应用内。

图示（SCI）：

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec 审批（system.run）

`system.run` 由 macOS 应用中的 **Exec 审批**控制（设置 → Exec 审批）。
安全性 + 询问 + 允许列表会在 Mac 本地存储于：

```
~/.openclaw/exec-approvals.json
```

示例：

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

说明：

- `allowlist` 条目是已解析二进制路径的 glob 模式，或通过 PATH 调用的命令的裸命令名。
- 包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 命令文本会被视为允许列表未命中，并需要显式审批（或将 shell 二进制加入允许列表）。
- 在提示中选择 “Always Allow” 会将该命令添加到允许列表。
- `system.run` 环境覆盖会被过滤（丢弃 `PATH`、`DYLD_*`、`LD_*`、`BASHOPTS`、`FPATH`、`KSH_ENV`、`NODE_OPTIONS`、`NODE_REDIRECT_WARNINGS`、`NODE_REPL_EXTERNAL_MODULE`、`NODE_REPL_HISTORY`、`NODE_V8_COVERAGE`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`、`TCLLIBPATH`），然后与应用的环境合并。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求作用域的环境覆盖会被缩减为一个较小的显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允许列表模式下，对于始终允许的决策，已知分发包装器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全解包，则不会自动持久化任何允许列表条目。

## 深层链接

应用注册 `openclaw://` URL 方案用于本地操作。

### `openclaw://agent`

触发 Gateway 网关 `agent` 请求。
__OC_I18N_900004__
查询参数：

- `message`（必需）
- `sessionKey`（可选）
- `thinking`（可选）
- `deliver` / `to` / `channel`（可选）
- `timeoutSeconds`（可选）
- `key`（可选无人值守模式密钥）

安全性：

- 没有 `key` 时，应用会提示确认。
- 没有 `key` 时，应用会对确认提示强制执行较短的消息长度限制，并忽略 `deliver` / `to` / `channel`。
- 使用有效的 `key` 时，运行是无人值守的（用于个人自动化）。

## 新手引导流程（典型）

1. 安装并启动 **OpenClaw.app**。
2. 完成权限检查清单（TCC 提示）。
3. 确保**本地**模式处于活动状态且 Gateway 网关正在运行。
4. 如果你想要终端访问，请安装 CLI。

## 状态目录位置（macOS）

避免将你的 OpenClaw 状态目录放在 iCloud 或其他云同步文件夹中。
同步支持的路径可能增加延迟，并偶尔导致会话和凭证出现文件锁/同步竞争。

优先使用本地非同步状态路径，例如：
__OC_I18N_900005__
如果 `openclaw doctor` 检测到状态位于：

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

它会发出警告，并建议移回本地路径。

## 构建和开发工作流（原生）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或 Xcode）
- 打包应用：`scripts/package-mac-app.sh`

## 调试 Gateway 网关连接（macOS CLI）

使用调试 CLI 来执行与 macOS 应用相同的 Gateway 网关 WebSocket 握手和发现
逻辑，而无需启动应用。
__OC_I18N_900006__
连接选项：

- `--url <ws://host:port>`：覆盖配置
- `--mode <local|remote>`：从配置解析（默认：配置或本地）
- `--probe`：强制进行新的健康探测
- `--timeout <ms>`：请求超时（默认：`15000`）
- `--json`：用于 diff 的结构化输出

发现选项：

- `--include-local`：包含会被过滤为 “local” 的 Gateway 网关
- `--timeout <ms>`：整体发现窗口（默认：`2000`）
- `--json`：用于 diff 的结构化输出

<Tip>
与 `openclaw gateway discover --json` 对比，以查看 macOS 应用的发现管线（`local.` 加上已配置的广域域名，并带有广域和 Tailscale Serve 回退）是否不同于 Node CLI 基于 `dns-sd` 的发现。
</Tip>

## 远程连接管线（SSH 隧道）

当 macOS 应用在**远程**模式下运行时，它会打开一个 SSH 隧道，让本地 UI
组件可以像访问 localhost 上的 Gateway 网关一样与远程 Gateway 网关通信。

### 控制隧道（Gateway 网关 WebSocket 端口）

- **用途：**健康检查、状态、Web Chat、配置以及其他控制平面调用。
- **本地端口：**Gateway 网关端口（默认 `18789`），始终稳定。
- **远程端口：**远程主机上的同一个 Gateway 网关端口。
- **行为：**没有随机本地端口；应用会复用现有健康隧道，
  或在需要时重启它。
- **SSH 形态：**`ssh -N -L <local>:127.0.0.1:<remote>`，带 BatchMode +
  ExitOnForwardFailure + keepalive 选项。
- **IP 报告：**SSH 隧道使用 loopback，因此 Gateway 网关会看到节点
  IP 为 `127.0.0.1`。如果你希望显示真实客户端
  IP，请使用 **Direct (ws/wss)** 传输（见 [macOS 远程访问](/zh-CN/platforms/mac/remote)）。

设置步骤见 [macOS 远程访问](/zh-CN/platforms/mac/remote)。协议
详情见 [Gateway 协议](/zh-CN/gateway/protocol)。

## 相关文档

- [Gateway 运行手册](/zh-CN/gateway)
- [Gateway 网关（macOS）](/zh-CN/platforms/mac/bundled-gateway)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
- [Canvas](/zh-CN/platforms/mac/canvas)

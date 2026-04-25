---
read_when:
    - 实现 macOS 应用功能
    - 更改 macOS 上的 Gateway 网关生命周期或节点桥接
summary: OpenClaw macOS 配套应用（菜单栏 + Gateway 网关代理）
title: macOS 应用
x-i18n:
    generated_at: "2026-04-25T03:24:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

macOS 应用是 OpenClaw 的**菜单栏配套应用**。它负责权限管理，在本地管理/连接 Gateway 网关（`launchd` 或手动），并将 macOS 能力作为一个节点暴露给智能体。

## 它的作用

- 在菜单栏中显示原生通知和状态。
- 负责 TCC 提示（通知、辅助功能、屏幕录制、麦克风、语音识别、自动化 / AppleScript）。
- 运行或连接到 Gateway 网关（本地或远程）。
- 暴露仅限 macOS 的工具（Canvas、Camera、Screen Recording、`system.run`）。
- 以**远程**模式启动本地节点宿主服务（`launchd`），并以**本地**模式停止它。
- 可选择托管 **PeekabooBridge** 用于 UI 自动化。
- 可按需通过 npm、pnpm 或 bun 安装全局 CLI（`openclaw`）（应用优先使用 npm，其次是 pnpm，再其次是 bun；Node 仍是推荐的 Gateway 网关运行时）。

## 本地模式与远程模式

- **本地**（默认）：如果存在正在运行的本地 Gateway 网关，应用会附加到它；否则会通过 `openclaw gateway install` 启用 `launchd` 服务。
- **远程**：应用通过 SSH/Tailscale 连接到一个 Gateway 网关，且绝不会启动本地进程。  
  应用会启动本地**节点宿主服务**，以便远程 Gateway 网关可以访问这台 Mac。  
  应用不会将 Gateway 网关作为子进程生成。  
  Gateway 网关发现现在会优先使用 Tailscale MagicDNS 名称，而不是原始 tailnet IP，因此当 tailnet IP 变化时，Mac 应用能更可靠地恢复连接。

## Launchd 控制

应用管理一个按用户区分的 LaunchAgent，标签为 `ai.openclaw.gateway`
（或在使用 `--profile`/`OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 仍会被卸载）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

如果你运行的是命名 profile，请将标签替换为 `ai.openclaw.<profile>`。

如果尚未安装 LaunchAgent，请在应用中启用它，或运行
`openclaw gateway install`。

## 节点能力（mac）

macOS 应用将自己呈现为一个节点。常见命令：

- Canvas：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- Camera：`camera.snap`、`camera.clip`
- Screen：`screen.snapshot`、`screen.record`
- System：`system.run`、`system.notify`

该节点会报告一个 `permissions` 映射，以便智能体决定哪些操作被允许。

节点服务 + 应用 IPC：

- 当无头节点宿主服务运行时（远程模式），它会作为一个节点连接到 Gateway 网关 WS。
- `system.run` 在 macOS 应用中执行（UI/TCC 上下文），通过本地 Unix socket；提示和输出都保留在应用内。

图示（SCI）：

```text
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec approvals（system.run）

`system.run` 由 macOS 应用中的 **Exec approvals** 控制（设置 → Exec approvals）。
安全策略 + 询问策略 + allowlist 存储在 Mac 本地：

```text
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

- `allowlist` 条目可以是已解析二进制路径的 glob 模式，或通过 PATH 调用命令时的裸命令名。
- 包含 shell 控制或展开语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 命令文本，会被视为未命中 allowlist，并需要显式批准（或者将 shell 二进制加入 allowlist）。
- 在提示中选择“Always Allow”会将该命令加入 allowlist。
- `system.run` 的环境变量覆盖会被过滤（丢弃 `PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`），然后与应用自身的环境变量合并。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的环境变量覆盖会缩减为一个小型显式 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 对于 allowlist 模式下的始终允许决策，已知的分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化其内部可执行文件路径，而不是包装器路径。如果无法安全解包，则不会自动持久化任何 allowlist 条目。

## 深链接

应用为本地操作注册了 `openclaw://` URL scheme。

### `openclaw://agent`

触发一个 Gateway 网关 `agent` 请求。
__OC_I18N_900004__
查询参数：

- `message`（必需）
- `sessionKey`（可选）
- `thinking`（可选）
- `deliver` / `to` / `channel`（可选）
- `timeoutSeconds`（可选）
- `key`（可选，无人值守模式密钥）

安全性：

- 没有 `key` 时，应用会提示确认。
- 没有 `key` 时，应用会对确认提示中的消息长度施加较短限制，并忽略 `deliver` / `to` / `channel`。
- 使用有效的 `key` 时，运行将以无人值守方式进行（适用于个人自动化）。

## 新手引导流程（典型）

1. 安装并启动 **OpenClaw.app**。
2. 完成权限检查清单（TCC 提示）。
3. 确保**本地**模式已启用，并且 Gateway 网关正在运行。
4. 如果你想要终端访问，请安装 CLI。

## 状态目录放置位置（macOS）

避免将你的 OpenClaw 状态目录放在 iCloud 或其他云同步文件夹中。
由同步服务支持的路径会增加延迟，并且偶尔会为
会话和凭证导致文件锁 / 同步竞争问题。

建议使用本地的非同步状态路径，例如：
__OC_I18N_900005__
如果 `openclaw doctor` 检测到状态目录位于以下路径下：

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

它会发出警告，并建议迁回本地路径。

## 构建与开发工作流（原生）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或 Xcode）
- 打包应用：`scripts/package-mac-app.sh`

## 调试 Gateway 网关连接（macOS CLI）

使用调试 CLI 可以在不启动应用的情况下，执行与 macOS 应用相同的 Gateway 网关 WebSocket 握手和发现逻辑。
__OC_I18N_900006__
连接选项：

- `--url <ws://host:port>`：覆盖配置
- `--mode <local|remote>`：从配置解析（默认：配置值或 local）
- `--probe`：强制执行一次新的健康探测
- `--timeout <ms>`：请求超时（默认：`15000`）
- `--json`：用于差异比较的结构化输出

发现选项：

- `--include-local`：包含本会被过滤为“local”的 Gateway 网关
- `--timeout <ms>`：整体发现窗口（默认：`2000`）
- `--json`：用于差异比较的结构化输出

提示：可与 `openclaw gateway discover --json` 的结果进行比较，以查看
macOS 应用的发现管线（`local.` 加上已配置的广域域名，并带有
广域和 Tailscale Serve 回退）是否不同于
Node CLI 基于 `dns-sd` 的发现。

## 远程连接管线（SSH 隧道）

当 macOS 应用以**远程**模式运行时，它会打开一个 SSH 隧道，使本地 UI
组件能够像连接 localhost 一样与远程 Gateway 网关通信。

### 控制隧道（Gateway WebSocket 端口）

- **用途：** 健康检查、状态、Web Chat、配置及其他控制平面调用。
- **本地端口：** Gateway 网关端口（默认 `18789`），始终稳定。
- **远程端口：** 远程主机上的同一 Gateway 网关端口。
- **行为：** 不使用随机本地端口；应用会重用现有的健康隧道，
  或在需要时重启它。
- **SSH 形式：** `ssh -N -L <local>:127.0.0.1:<remote>`，带有 BatchMode +
  ExitOnForwardFailure + keepalive 选项。
- **IP 报告：** SSH 隧道使用 loopback，因此 Gateway 网关会将该节点的
  IP 视为 `127.0.0.1`。如果你希望显示真实客户端
  IP，请使用 **Direct (ws/wss)** 传输方式（参见 [macOS 远程访问](/zh-CN/platforms/mac/remote)）。

有关设置步骤，请参见 [macOS 远程访问](/zh-CN/platforms/mac/remote)。有关协议
细节，请参见 [Gateway protocol](/zh-CN/gateway/protocol)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关（macOS）](/zh-CN/platforms/mac/bundled-gateway)
- [macOS 权限](/zh-CN/platforms/mac/permissions)
- [Canvas](/zh-CN/platforms/mac/canvas)

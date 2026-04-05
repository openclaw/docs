---
read_when:
    - 实现 macOS 应用功能时
    - 更改 macOS 上的 Gateway 网关 生命周期或节点桥接时
summary: OpenClaw macOS 配套应用（菜单栏 + Gateway 网关代理）
title: macOS 应用
x-i18n:
    generated_at: "2026-04-05T08:38:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: bfac937e352ede495f60af47edf3b8e5caa5b692ba0ea01d9fb0de9a44bbc135
    source_path: platforms/macos.md
    workflow: 15
---

# OpenClaw macOS 配套应用（菜单栏 + Gateway 网关代理）

macOS 应用是 OpenClaw 的**菜单栏配套应用**。它负责权限管理，
在本地管理/附加到 Gateway 网关（launchd 或手动方式），并将 macOS
能力作为节点暴露给智能体。

## 它的作用

- 在菜单栏中显示原生通知和状态。
- 负责 TCC 提示（通知、辅助功能、屏幕录制、麦克风、
  语音识别、自动化/AppleScript）。
- 运行或连接到 Gateway 网关（本地或远程）。
- 暴露仅限 macOS 的工具（Canvas、Camera、Screen Recording、`system.run`）。
- 在**远程**模式下启动本地节点主机服务（launchd），并在**本地**模式下停止它。
- 可选托管 **PeekabooBridge** 以用于 UI 自动化。
- 按需通过 npm、pnpm 或 bun 安装全局 CLI（`openclaw`）（应用优先使用 npm，然后是 pnpm，再然后是 bun；Node 仍然是推荐的 Gateway 网关 运行时）。

## 本地模式与远程模式

- **本地**（默认）：如果存在正在运行的本地 Gateway 网关，应用会附加到它；
  否则会通过 `openclaw gateway install` 启用 launchd 服务。
- **远程**：应用通过 SSH/Tailscale 连接到 Gateway 网关，且绝不会启动
  本地进程。
  应用会启动本地**节点主机服务**，以便远程 Gateway 网关 能够访问这台 Mac。
  应用不会将 Gateway 网关 作为子进程启动。
  Gateway 网关 发现现在优先使用 Tailscale MagicDNS 名称，而不是原始 tailnet IP，
  因此当 tailnet IP 发生变化时，Mac 应用恢复连接会更可靠。

## Launchd 控制

应用会管理一个按用户划分的 LaunchAgent，标签为 `ai.openclaw.gateway`
（使用 `--profile`/`OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`；仍会卸载旧版 `com.openclaw.*`）。

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

运行命名 profile 时，请将标签替换为 `ai.openclaw.<profile>`。

如果尚未安装 LaunchAgent，请在应用中启用它，或运行
`openclaw gateway install`。

## 节点能力（mac）

macOS 应用会将自身呈现为一个节点。常用命令：

- Canvas：`canvas.present`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`
- Camera：`camera.snap`、`camera.clip`
- Screen：`screen.record`
- System：`system.run`、`system.notify`

节点会报告一个 `permissions` 映射，以便智能体决定允许哪些操作。

节点服务 + 应用 IPC：

- 当无头节点主机服务运行时（远程模式），它会作为节点连接到 Gateway 网关 WS。
- `system.run` 会通过本地 Unix socket 在 macOS 应用中执行（UI/TCC 上下文）；提示和输出都会保留在应用内。

图示（SCI）：

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 执行审批（system.run）

`system.run` 由 macOS 应用中的**执行审批**控制（设置 → 执行审批）。
安全性 + 询问 + allowlist 存储在 Mac 本地的以下位置：

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

- `allowlist` 条目是针对已解析二进制路径的 glob 模式。
- 包含 shell 控制或扩展语法（`&&`、`||`、`;`、`|`、`` ` ``、`$`、`<`、`>`、`(`、`)`）的原始 shell 命令文本会被视为 allowlist 未命中，并需要显式批准（或将该 shell 二进制加入 allowlist）。
- 在提示中选择“始终允许”会将该命令加入 allowlist。
- `system.run` 的环境变量覆盖会被过滤（删除 `PATH`、`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`），然后与应用环境合并。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的环境变量覆盖会缩减为一个较小的显式 allowlist（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 对于 allowlist 模式中的始终允许决策，已知的调度包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全解包，则不会自动持久化任何 allowlist 条目。

## 深链接

应用为本地操作注册了 `openclaw://` URL scheme。

### `openclaw://agent`

触发一个 Gateway 网关 `agent` 请求。

```bash
open 'openclaw://agent?message=Hello%20from%20deep%20link'
```

查询参数：

- `message`（必填）
- `sessionKey`（可选）
- `thinking`（可选）
- `deliver` / `to` / `channel`（可选）
- `timeoutSeconds`（可选）
- `key`（可选，无人值守模式密钥）

安全性：

- 如果没有 `key`，应用会提示确认。
- 如果没有 `key`，应用会对确认提示强制执行较短的消息长度限制，并忽略 `deliver` / `to` / `channel`。
- 使用有效的 `key` 时，运行将以无人值守方式进行（适用于个人自动化）。

## 新手引导流程（典型）

1. 安装并启动 **OpenClaw.app**。
2. 完成权限检查清单（TCC 提示）。
3. 确保**本地**模式处于启用状态，且 Gateway 网关 正在运行。
4. 如果你想通过终端访问，请安装 CLI。

## 状态目录放置位置（macOS）

避免将你的 OpenClaw 状态目录放在 iCloud 或其他云同步文件夹中。
由同步支持的路径可能会增加延迟，并偶尔导致
会话和凭证的文件锁/同步竞争问题。

优先使用本地非同步状态路径，例如：

```bash
OPENCLAW_STATE_DIR=~/.openclaw
```

如果 `openclaw doctor` 检测到状态目录位于以下路径下：

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

它会发出警告，并建议迁移回本地路径。

## 构建与开发工作流（原生）

- `cd apps/macos && swift build`
- `swift run OpenClaw`（或 Xcode）
- 打包应用：`scripts/package-mac-app.sh`

## 调试 Gateway 网关 连接性（macOS CLI）

使用调试 CLI 在不启动应用的情况下，演练与 macOS 应用相同的 Gateway 网关 WebSocket 握手和发现
逻辑。

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

连接选项：

- `--url <ws://host:port>`：覆盖配置
- `--mode <local|remote>`：从配置解析（默认：配置值或 local）
- `--probe`：强制执行一次新的健康探测
- `--timeout <ms>`：请求超时（默认：`15000`）
- `--json`：用于差异比较的结构化输出

发现选项：

- `--include-local`：包含原本会被过滤为“本地”的 Gateway 网关
- `--timeout <ms>`：整体发现窗口（默认：`2000`）
- `--json`：用于差异比较的结构化输出

提示：可与 `openclaw gateway discover --json` 进行比较，以查看
macOS 应用的发现流水线（`local.` 加上已配置的广域域名，并带有
广域和 Tailscale Serve 回退）是否与
Node CLI 基于 `dns-sd` 的发现不同。

## 远程连接管线（SSH 隧道）

当 macOS 应用运行在**远程**模式时，它会打开一个 SSH 隧道，使本地 UI
组件能够像访问 localhost 一样访问远程 Gateway 网关。

### 控制隧道（Gateway WebSocket 端口）

- **用途：**健康检查、状态、Web Chat、配置以及其他控制平面调用。
- **本地端口：**Gateway 网关 端口（默认 `18789`），始终稳定。
- **远程端口：**远程主机上的同一 Gateway 网关 端口。
- **行为：**不使用随机本地端口；应用会重用现有的健康隧道，
  或在需要时重启它。
- **SSH 形式：**`ssh -N -L <local>:127.0.0.1:<remote>`，并带有 BatchMode +
  ExitOnForwardFailure + keepalive 选项。
- **IP 报告：**SSH 隧道使用 loopback，因此 Gateway 网关 看到的节点
  IP 将是 `127.0.0.1`。如果你希望显示真实客户端
  IP，请使用**直接（ws/wss）**传输（参见 [macOS remote access](/platforms/mac/remote)）。

有关设置步骤，请参见 [macOS remote access](/platforms/mac/remote)。有关协议
细节，请参见 [Gateway protocol](/gateway/protocol)。

## 相关文档

- [Gateway 网关 运行手册](/gateway)
- [Gateway 网关（macOS）](/platforms/mac/bundled-gateway)
- [macOS 权限](/platforms/mac/permissions)
- [Canvas](/platforms/mac/canvas)

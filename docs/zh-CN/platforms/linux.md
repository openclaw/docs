---
read_when:
    - 查找 Linux 配套应用状态
    - 在 Linux 节点主机上启用摄像头、位置或通知
    - 规划平台覆盖范围或贡献
    - 调试 VPS 或容器中的 Linux OOM 终止或退出码 137
summary: Linux 支持 + 配套应用状态
title: Linux 应用
x-i18n:
    generated_at: "2026-07-14T13:51:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: a6759199ddb7f7fe0387e62c3b7ccdf7a33326b9539f531348ea938a7610b6b1
    source_path: platforms/linux.md
    workflow: 16
---

Gateway 网关在 Linux 上受到完全支持，并且需要 Node。Bun 仍可用作
依赖安装程序或软件包脚本运行器，但不能运行 OpenClaw，
因为它不提供 `node:sqlite`。

## 桌面配套应用

OpenClaw Linux 配套应用是用于本地 Gateway 网关的 Tauri 桌面应用。它可以：

- 在 OpenClaw CLI 和托管的 Node 运行时缺失时安装它们
- 在尝试更改服务之前连接到健康的 Gateway 网关
- 将安装、启动、停止和重启操作委托给由 CLI 管理的 systemd 用户服务
- 使用解析出的身份验证 URL 打开由 Gateway 网关提供的 Control UI
- 窗口关闭后仍可从系统托盘访问

从 `main` 构建的稳定版本会将 `.deb` 和 AppImage 软件包作为对应标签的
[GitHub 版本](https://github.com/openclaw/openclaw/releases)资产发布，
文件名为 `OpenClaw-<version>-amd64.deb` 和 `OpenClaw-<version>-amd64.AppImage`，
旁边还会提供 `SHA256SUMS.linux-app.txt` 校验和文件。下载
`.deb` 并使用 `sudo apt install ./OpenClaw-<version>-amd64.deb` 安装，
或者将 AppImage 标记为可执行文件并直接运行。AppImage 运行时
需要 FUSE 2（`sudo apt install libfuse2`，在 Ubuntu 24.04+ 上则为 `libfuse2t64`）；
如果没有 FUSE 2，请使用 `APPIMAGE_EXTRACT_AND_RUN=1` 运行 AppImage。

也可以从源码检出构建相同的软件包：

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

`Linux App` CI 工作流会针对涉及该应用的拉取请求和
手动运行，上传相同的软件包作为 `openclaw-linux-companion` 工件。
有关 Linux 构建依赖项和开发命令，请参阅仓库中的 `apps/linux/README.md`。

## CLI 和 SSH 替代方案

对于无头服务器、VPS 或远程 Gateway 网关，CLI 仍是最简单的选择：

1. 安装 Node 24.15+（推荐）、Node 22.22.3+（LTS）或 Node 25.9+。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 在你的笔记本电脑上：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/`，并使用已配置的共享
   密钥进行身份验证（默认使用令牌；如果 `gateway.auth.mode` 为 `"password"`，则使用密码）。

完整服务器指南：[Linux 服务器](/zh-CN/vps)。VPS 分步示例：
[exe.dev](/zh-CN/install/exe-dev)。

## 节点能力

内置的 Linux 节点插件让 CLI 无需桌面应用即可获得 `openclaw node` 服务设备能力。仅当相应能力已启用且所需的本地工具存在时，命令才会公布给 Gateway 网关。

| 能力                                      | 默认值 | 要求                                                                  |
| ----------------------------------------- | ------ | --------------------------------------------------------------------- |
| 桌面通知（`system.notify`）           | 开启   | libnotify 提供的 `notify-send` 和桌面通知会话                    |
| 相机照片和短片（`camera.*`）     | 关闭   | FFmpeg、V4L2 相机访问权限，以及用于短片音频的 PulseAudio 或 PipeWire |
| 位置（`location.get`）               | 关闭   | GeoClue2 及其 `where-am-i` 演示程序                             |

在 `openclaw.json` 中配置插件：

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          notify: { enabled: true },
          camera: { enabled: true },
          location: { enabled: true },
        },
      },
    },
  },
}
```

更改这些设置后，请重启节点服务。可用性在每个进程中仅判定一次，节点公布信息会在重启时重新构建。

Gateway 网关会将节点的命令和能力范围与设备配对分开审批。首次启动或启用更多能力后，请批准待处理的范围：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

节点可以保持已连接和已完成设备配对，但其有效的 `caps` 和 `commands` 在完成此审批之前仍可能为空。

相机设备必须可由服务用户读取，通常通过 `video` 组授予权限。当 `includeAudio` 为 true 时，相机短片使用默认的 PulseAudio 或 PipeWire 音源；麦克风音频仅作为该短片的音轨存在，不提供独立命令。位置功能要求主机的 GeoClue 策略允许节点服务用户访问。

`camera.snap` 和 `camera.clip` 还需要通过 `gateway.nodes.allowCommands` 在 Gateway 网关中明确启用。有关载荷、限制和错误，请参阅[相机捕获](/zh-CN/nodes/camera)和[位置命令](/zh-CN/nodes/location-command)。

## 安装

- [入门指南](/zh-CN/start/getting-started)
- [安装与更新](/zh-CN/install/updating)
- 可选：[Bun 软件包工作流](/zh-CN/install/bun)、[Nix](/zh-CN/install/nix)、[Docker](/zh-CN/install/docker)

## Gateway 网关服务（systemd）

使用以下任一方式安装：

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # 出现提示时选择 "Gateway service"
```

修复或迁移现有安装：

```bash
openclaw doctor
```

`openclaw gateway install` 默认生成 systemd **用户**单元。完整的
服务指南（包括适用于共享主机或常开主机的**系统**级单元变体）位于
[Gateway 网关运行手册](/zh-CN/gateway#supervision-and-service-lifecycle)中。

仅在自定义设置中才应手动编写单元。最小用户单元示例
（`~/.config/systemd/user/openclaw-gateway[-<profile>].service`）：

```ini
[Unit]
Description=OpenClaw Gateway（配置文件：<profile>，v<version>）
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

启用该单元：

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 内存压力和 OOM 终止

在 Linux 上，当主机、虚拟机或容器 cgroup
耗尽内存时，内核会选择一个 OOM 终止对象。Gateway 网关并不适合作为终止对象，因为它负责长期运行的
会话和渠道连接，因此 OpenClaw 会尽可能优先终止临时子
进程。

对于符合条件的 Linux 子进程启动，OpenClaw 会使用一个简短的
`/bin/sh` 垫片包装命令，将子进程自身的 `oom_score_adj` 提高到 `1000`，然后
通过 `exec` 运行实际命令。此操作不需要特权：进程始终可以提高
自身的 OOM 分数。

涵盖的子进程范围：

- 由监督器管理的命令子进程
- PTY shell 子进程
- MCP stdio 服务器子进程
- 由 OpenClaw 启动的浏览器/Chrome 进程（通过插件 SDK 进程运行时）

该包装器仅适用于 Linux，并会在 `/bin/sh` 不可用时，或子进程环境将
`OPENCLAW_CHILD_OOM_SCORE_ADJ` 设置为 `0`、`false`、`no` 或
`off` 时跳过。

验证子进程：

```bash
cat /proc/<child-pid>/oom_score_adj
```

涵盖的子进程预期值为 `1000`；Gateway 网关进程本身
保持正常分数（通常为 `0`）。

当 OOM 终止程序选择临时子进程时，systemd 单元的 `OOMPolicy=continue` 会让 Gateway 网关服务继续运行，
而不是将整个单元标记为失败并重启所有渠道；
失败的子进程/会话会报告自身的错误。

这不能替代正常的内存调优。如果 VPS 或容器反复
终止子进程，请提高内存限制、降低并发量，或添加更严格的
资源控制（systemd `MemoryMax=`、容器内存限制）。

## 相关内容

- [安装概览](/zh-CN/install)
- [Linux 服务器](/zh-CN/vps)
- [Raspberry Pi](/zh-CN/install/raspberry-pi)
- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 配置](/zh-CN/gateway/configuration)

---
read_when:
    - 你想从一台机器上移除 OpenClaw
    - 卸载后 Gateway 网关服务仍在运行
summary: 完全卸载 OpenClaw（CLI、服务、状态、工作区）
title: 卸载
x-i18n:
    generated_at: "2026-07-05T11:28:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84f01dc11defe6f19c89232375e48bad383b2e71379f47f43e759d3d7bb908b5
    source_path: install/uninstall.md
    workflow: 16
---

两条路径：

- 如果 `openclaw` 仍已安装，使用**简单路径**。
- 如果 CLI 已消失但服务仍在运行，使用**手动移除服务**。

## 简单路径（CLI 仍已安装）

推荐：使用内置卸载器：

```bash
openclaw uninstall
```

状态移除会保留已配置的工作区目录，除非你也选择 `--workspace`。

预览将移除的内容（安全）：

```bash
openclaw uninstall --dry-run --all
```

非交互式（自动化 / npx）。请谨慎使用，并且只在确认范围后使用：

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

标志：`--service`、`--state`、`--workspace`、`--app` 选择单独范围；`--all` 选择全部四项。

手动步骤（结果相同）：

1. 停止 Gateway 网关服务：

```bash
openclaw gateway stop
```

2. 卸载 Gateway 网关服务（launchd/systemd/schtasks）：

```bash
openclaw gateway uninstall
```

3. 删除状态 + 配置：

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

如果你将 `OPENCLAW_CONFIG_PATH` 设置为状态目录外的自定义位置，也删除该文件。
如果你想保留状态目录内的工作区，例如 `~/.openclaw/workspace`，请在运行 `rm -rf` 之前将其移到一边，或有选择地删除状态内容。

4. 删除你的工作区（可选，会移除智能体文件）：

```bash
rm -rf ~/.openclaw/workspace
```

5. 移除 CLI 安装（选择你使用的那一个）：

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. 如果你安装了 macOS 应用：

```bash
rm -rf /Applications/OpenClaw.app
```

说明：

- 如果你使用了配置档（`--profile` / `OPENCLAW_PROFILE`），请对每个状态目录重复步骤 3（默认值为 `~/.openclaw-<profile>`）。
- 在远程模式下，状态目录位于 **Gateway 网关主机**上，因此也要在那里运行步骤 1-4。

## 手动移除服务（CLI 未安装）

如果 Gateway 网关服务持续运行但缺少 `openclaw`，请使用此方法。

### macOS（launchd）

默认标签为 `ai.openclaw.gateway`（或带配置档时为 `ai.openclaw.<profile>`）：

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

如果你使用了配置档，请将标签和 plist 名称替换为 `ai.openclaw.<profile>`。

### Linux（systemd 用户单元）

默认单元名称为 `openclaw-gateway.service`（或 `openclaw-gateway-<profile>.service`）。从非常旧的安装升级的机器上，重命名前的 `clawdbot-gateway.service` 单元可能仍然存在；`openclaw uninstall` / `openclaw gateway uninstall` 会检测并自动移除它。

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（计划任务）

默认任务名称为 `OpenClaw Gateway`（或 `OpenClaw Gateway (<profile>)`）。
该任务会启动你状态目录下无窗口的 `gateway.vbs` 脚本，后者再运行 `gateway.cmd`；请移除两者。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.vbs" -ErrorAction SilentlyContinue
```

如果你使用了配置档，请删除匹配的任务名称，以及 `~\.openclaw-<profile>` 下的 `gateway.cmd` /
`gateway.vbs` 文件。

## 普通安装与源代码检出

### 普通安装（install.sh / npm / pnpm / bun）

如果你使用了 `https://openclaw.ai/install.sh` 或 `install.ps1`，CLI 是通过 `npm install -g openclaw@latest` 安装的。
请用 `npm rm -g openclaw` 移除它（如果你是那样安装的，也可以使用 `pnpm remove -g` / `bun remove -g`）。

### 源代码检出（git clone）

如果你从仓库检出运行（`git clone` + `openclaw ...` / `bun run openclaw ...`）：

1. 在删除仓库**之前**卸载 Gateway 网关服务（使用上面的简单路径或手动移除服务）。
2. 删除仓库目录。
3. 按上文所示移除状态 + 工作区。

## 相关

- [安装概览](/zh-CN/install)
- [迁移指南](/zh-CN/install/migrating)

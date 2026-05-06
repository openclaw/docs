---
read_when:
    - 你想要可复现、可回滚的安装
    - 你已经在使用 Nix/NixOS/Home Manager
    - 你希望所有内容都固定版本并以声明式方式管理
summary: 使用 Nix 以声明式方式安装 OpenClaw
title: Nix
x-i18n:
    generated_at: "2026-05-06T02:04:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

使用 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** 声明式安装 OpenClaw：这是一个功能完备的 Home Manager 模块。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) 仓库是 Nix 安装的事实来源。本页是快速概览。
</Info>

## 你会得到什么

- Gateway 网关 + macOS 应用 + 工具（whisper、spotify、cameras）-- 全部已固定版本
- 可在重启后继续运行的 launchd 服务
- 带声明式配置的插件系统
- 即时回滚：`home-manager switch --rollback`

## 快速开始

<Steps>
  <Step title="Install Determinate Nix">
    如果尚未安装 Nix，请按照 [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) 说明操作。
  </Step>
  <Step title="Create a local flake">
    使用 nix-openclaw 仓库中的 agent-first 模板：
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure secrets">
    设置你的消息机器人令牌和模型提供商 API key。放在 `~/.secrets/` 下的普通文件就可以。
  </Step>
  <Step title="Fill in template placeholders and switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verify">
    确认 launchd 服务正在运行，并且你的机器人会响应消息。
  </Step>
</Steps>

请参阅 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)，了解完整的模块选项和示例。

## Nix 模式运行时行为

设置 `OPENCLAW_NIX_MODE=1` 时（使用 nix-openclaw 时会自动设置），OpenClaw 会进入确定性模式，并禁用自动安装流程。

你也可以手动设置它：

```bash
export OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI 应用不会自动继承 shell 环境变量。请改用 defaults 启用 Nix 模式：

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 模式下的变化

- 自动安装和自我变更流程会被禁用
- 缺失依赖会显示 Nix 专用的修复消息
- UI 会显示只读 Nix 模式横幅

### 配置和状态路径

OpenClaw 从 `OPENCLAW_CONFIG_PATH` 读取 JSON5 配置，并将可变数据存储在 `OPENCLAW_STATE_DIR` 中。在 Nix 下运行时，请将这些路径显式设置为 Nix 管理的位置，使运行时状态和配置不会进入不可变存储。

| 变量                   | 默认值                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 服务 PATH 发现

launchd/systemd Gateway 网关服务会自动发现 Nix profile 二进制文件，因此会 shell 调用 `nix` 已安装可执行文件的插件和工具无需手动设置 PATH 即可工作：

- 设置 `NIX_PROFILES` 时，每个条目都会按从右到左的优先级添加到服务 PATH 中（匹配 Nix shell 优先级：最右侧优先）。
- 未设置 `NIX_PROFILES` 时，会将 `~/.nix-profile/bin` 作为回退项添加。

这同时适用于 macOS launchd 和 Linux systemd 服务环境。

## 相关内容

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    事实来源 Home Manager 模块和完整设置指南。
  </Card>
  <Card title="Setup wizard" href="/zh-CN/start/wizard" icon="wand-magic-sparkles">
    非 Nix CLI 设置演练。
  </Card>
  <Card title="Docker" href="/zh-CN/install/docker" icon="docker">
    作为非 Nix 替代方案的容器化设置。
  </Card>
  <Card title="Updating" href="/zh-CN/install/updating" icon="arrow-up-right-from-square">
    随软件包一起更新由 Home Manager 管理的安装。
  </Card>
</CardGroup>

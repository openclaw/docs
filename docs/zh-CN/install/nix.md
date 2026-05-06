---
read_when:
    - 你想要可复现且可回滚的安装
    - 你已经在使用 Nix/NixOS/Home Manager
    - 你希望所有内容都固定版本，并以声明式方式管理
summary: 使用 Nix 声明式安装 OpenClaw
title: Nix
x-i18n:
    generated_at: "2026-05-06T12:50:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
---

声明式安装 OpenClaw：使用 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**，这是第一方、功能齐备的 Home Manager 模块。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) 仓库是 Nix 安装的权威来源。本页是快速概览。
</Info>

## 你将获得什么

- Gateway 网关 + macOS 应用 + 工具（whisper、spotify、cameras）-- 全部固定版本
- 重启后仍会保留的 launchd 服务
- 带声明式配置的插件系统
- 即时回滚：`home-manager switch --rollback`

## 快速开始

<Steps>
  <Step title="安装 Determinate Nix">
    如果尚未安装 Nix，请按照 [Determinate Nix 安装器](https://github.com/DeterminateSystems/nix-installer)说明操作。
  </Step>
  <Step title="创建本地 flake">
    使用 nix-openclaw 仓库中的 agent 优先模板：
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="配置密钥">
    设置你的消息传递 bot 令牌和模型提供商 API key。放在 `~/.secrets/` 下的纯文件即可。
  </Step>
  <Step title="填写模板占位符并切换">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="验证">
    确认 launchd 服务正在运行，并且你的 bot 会响应消息。
  </Step>
</Steps>

请参阅 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)，了解完整的模块选项和示例。

## Nix 模式运行时行为

设置 `OPENCLAW_NIX_MODE=1` 时（使用 nix-openclaw 会自动设置），OpenClaw 会进入用于 Nix 托管安装的确定性模式。其他 Nix 包也可以设置同一模式；nix-openclaw 是第一方参考实现。

你也可以手动设置：

```bash
export OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI 应用不会自动继承 shell 环境变量。请改用 defaults 启用 Nix 模式：

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 模式会改变什么

- 自动安装和自我变更流程会被禁用
- `openclaw.json` 会被视为不可变。启动时派生的默认值只保留在运行时，并且设置、新手引导、会修改配置的 `openclaw update`、插件安装/更新/卸载/启用、`doctor --fix`、`doctor --generate-gateway-token` 和 `openclaw config set` 等配置写入器都会拒绝编辑该文件。
- Agent 应改为编辑 Nix 源。对于 nix-openclaw，请使用 agent 优先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，并在 `programs.openclaw.config` 或 `instances.<name>.config` 下设置配置。
- 缺失依赖会显示 Nix 专用的修复消息
- UI 会显示只读 Nix 模式横幅

### 配置和状态路径

OpenClaw 从 `OPENCLAW_CONFIG_PATH` 读取 JSON5 配置，并将可变数据存储在 `OPENCLAW_STATE_DIR` 中。在 Nix 下运行时，请将这些路径显式设置为 Nix 托管位置，确保运行时状态和配置不会进入不可变 store。

| 变量                   | 默认值                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 服务 PATH 发现

launchd/systemd Gateway 网关服务会自动发现 Nix profile 二进制文件，因此
通过 shell 调用 `nix` 安装可执行文件的插件和工具无需
手动设置 PATH 即可工作：

- 设置 `NIX_PROFILES` 时，每个条目都会按
  从右到左的优先级加入服务 PATH（与 Nix shell 优先级一致 -- 最右侧获胜）。
- 未设置 `NIX_PROFILES` 时，会将 `~/.nix-profile/bin` 作为回退加入。

这同时适用于 macOS launchd 和 Linux systemd 服务环境。

## 相关

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    权威 Home Manager 模块和完整设置指南。
  </Card>
  <Card title="设置向导" href="/zh-CN/start/wizard" icon="wand-magic-sparkles">
    非 Nix CLI 设置演练。
  </Card>
  <Card title="Docker" href="/zh-CN/install/docker" icon="docker">
    作为非 Nix 替代方案的容器化设置。
  </Card>
  <Card title="更新" href="/zh-CN/install/updating" icon="arrow-up-right-from-square">
    随包一起更新由 Home Manager 管理的安装。
  </Card>
</CardGroup>

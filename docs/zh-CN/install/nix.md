---
read_when:
    - 你希望安装过程可复现且可回滚
    - 你已经在使用 Nix/NixOS/Home Manager
    - 你希望所有内容都固定版本并以声明式方式管理
summary: 使用 Nix 以声明式方式安装 OpenClaw
title: Nix
x-i18n:
    generated_at: "2026-07-11T20:37:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

使用第一方、功能齐全的 Home Manager 模块 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**，以声明式方式安装 OpenClaw。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) 仓库是 Nix 安装的权威来源。本页提供快速概览。
</Info>

## 你将获得

- Gateway 网关 + macOS 应用 + 工具（whisper、spotify、摄像头），全部锁定版本
- 可在重启后继续运行的 launchd 服务
- 支持声明式配置的插件系统
- 即时回滚：`home-manager switch --rollback`

## 快速开始

<Steps>
  <Step title="安装 Determinate Nix">
    如果尚未安装 Nix，请按照 [Determinate Nix 安装程序](https://github.com/DeterminateSystems/nix-installer)的说明操作。
  </Step>
  <Step title="创建本地 flake">
    使用 nix-openclaw 仓库中以智能体为先的模板：
    ```bash
    mkdir -p ~/code/openclaw-local
    # 从 nix-openclaw 仓库复制 templates/agent-first/flake.nix
    ```
  </Step>
  <Step title="配置机密信息">
    设置消息机器人令牌和模型提供商 API 密钥。使用 `~/.secrets/` 中的纯文本文件即可。
  </Step>
  <Step title="填写模板占位符并切换配置">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="验证">
    确认 launchd 服务正在运行，并且你的机器人能够回复消息。
  </Step>
</Steps>

完整的模块选项和示例请参阅 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)。

## Nix 模式运行时行为

设置 `OPENCLAW_NIX_MODE=1` 后（使用 nix-openclaw 时会自动设置），OpenClaw 会针对由 Nix 管理的安装进入确定性模式。其他 Nix 软件包也可以设置相同模式；nix-openclaw 是第一方参考实现。

你也可以手动设置：

```bash
export OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI 应用不会继承 shell 环境变量。请改用 `defaults` 启用 Nix 模式：

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 模式下的变化

- 自动安装和自我修改流程会被禁用。
- `openclaw.json` 会被视为不可变文件。启动时派生的默认值仅在运行时生效，而配置写入功能（设置、新手引导、会修改配置的 `openclaw update`、插件安装/更新/卸载/启用、`doctor --fix`、`doctor --generate-gateway-token`、`openclaw config set`）会拒绝编辑该文件。
- 请改为编辑 Nix 源文件。对于 nix-openclaw，请使用以智能体为先的[快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，并在 `programs.openclaw.config` 或 `instances.<name>.config` 下设置配置。
- 缺少依赖项时，会显示针对 Nix 的修复提示。
- UI 会显示只读的 Nix 模式横幅。

### 配置和状态路径

OpenClaw 从 `OPENCLAW_CONFIG_PATH` 读取 JSON5 配置，并将可变数据存储在 `OPENCLAW_STATE_DIR` 中。在 Nix 环境下，请将这些路径显式设置为由 Nix 管理的位置，以避免运行时状态和配置进入不可变存储。

| 变量                   | 默认值                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 服务 PATH 发现

launchd/systemd Gateway 网关服务会自动发现 Nix 配置文件中的二进制文件，使插件和通过 shell 调用 `nix` 所安装可执行文件的工具无需手动设置 PATH 即可工作：

- 设置 `NIX_PROFILES` 后，其中的每个条目都会按照从右到左的优先级添加到服务 PATH 中（与 Nix shell 的优先级一致：最右侧优先）。
- 未设置 `NIX_PROFILES` 时，会添加 `~/.nix-profile/bin` 作为回退路径。

这同时适用于 macOS launchd 和 Linux systemd 服务环境。

## 相关内容

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    权威的 Home Manager 模块和完整设置指南。
  </Card>
  <Card title="设置向导" href="/zh-CN/start/wizard" icon="wand-magic-sparkles">
    非 Nix 环境的 CLI 设置演练。
  </Card>
  <Card title="Docker" href="/zh-CN/install/docker" icon="docker">
    作为非 Nix 替代方案的容器化设置。
  </Card>
  <Card title="更新" href="/zh-CN/install/updating" icon="arrow-up-right-from-square">
    随软件包一起更新由 Home Manager 管理的安装。
  </Card>
</CardGroup>

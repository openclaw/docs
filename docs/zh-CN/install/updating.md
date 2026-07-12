---
read_when:
    - 更新 OpenClaw
    - 更新后出现问题
summary: 安全更新 OpenClaw（全局安装或源码安装）及回滚策略
title: 更新
x-i18n:
    generated_at: "2026-07-11T20:38:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

让 OpenClaw 保持最新。

对于 Docker、Podman 和 Kubernetes 镜像替换，请参阅
[升级容器镜像](/zh-CN/install/docker#upgrading-container-images)。Gateway 网关会在就绪前执行启动安全的升级工作；如果挂载状态需要手动修复，则会退出。

## 推荐方式：`openclaw update`

检测你的安装类型（npm 或 git）、获取最新版本、运行 `openclaw doctor`，然后重启 Gateway 网关。

```bash
openclaw update
```

切换渠道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 预览但不应用
```

`openclaw update` 没有 `--verbose` 标志（安装程序有）。若要进行诊断，请使用
`--dry-run` 预览计划执行的操作，使用 `--json` 获取结构化结果，或使用
`openclaw update status --json` 检查渠道和可用性状态。

`--channel beta` 优先使用 npm 的 beta dist-tag，但如果 beta 标签不存在，或其版本早于最新稳定版，
则回退到 stable/latest。若要执行一次性软件包更新并固定到原始 npm
beta dist-tag，请改用 `--tag beta`。

`--channel extended-stable` 仅适用于软件包安装，并且安装仍只能在前台进行。
OpenClaw 会读取公开 npm 的 `extended-stable` 选择器，
验证所选的精确软件包，并安装该精确版本。注册表数据缺失或不一致时会以安全方式失败，
绝不会回退到 `latest`。
如果所选版本早于已安装版本，仍会进行常规的降级确认。核心更新成功后，
CLI 会持久保存该渠道；直接运行 `npm install -g openclaw@extended-stable`
不会更新 `update.channel`。
核心版本替换后，使用裸/default 或
`latest` 意图的合格官方 npm 插件会收敛到与核心完全相同的版本。精确固定版本和明确指定的
非 `latest` 标签、第三方插件以及非 npm 来源均保持不变。
由当前 OpenClaw 版本创建的目录安装会保留该默认
意图。仅包含精确版本的旧记录将继续保持固定，因为
OpenClaw 无法安全区分旧的自动固定与用户固定；请在 extended-stable 渠道上运行一次
`openclaw plugins update @openclaw/name`，
让该插件重新选择精确跟随核心版本。

`--channel dev` 提供持久跟随更新的 GitHub `main` 检出。对于一次性
软件包更新，`--tag main` 会映射到 `github:openclaw/openclaw#main` 软件包
规范，并通过目标软件包管理器（npm/pnpm/bun）直接安装。

对于托管插件，缺少 beta 版本只会产生警告，而不会导致失败：
即使插件回退到其记录的
default/latest 版本，核心更新仍可成功。

有关渠道语义，请参阅[发布渠道](/zh-CN/install/development-channels)。

## 在 npm 和 git 安装之间切换

使用渠道更改安装类型。更新程序会保留 `~/.openclaw` 中的状态、配置、
凭据和工作区；它只会更改 CLI 和 Gateway 网关所使用的
OpenClaw 代码安装。

```bash
# npm 软件包安装 -> 可编辑的 git 检出
openclaw update --channel dev

# git 检出 -> npm 软件包安装
openclaw update --channel stable
```

先预览安装模式切换：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 会确保存在 git 检出、构建该检出，并从中安装全局 CLI。
`stable`、`extended-stable` 和 `beta` 渠道使用软件包
安装。在 git 检出中选择 extended-stable 会被拒绝，且不会修改或
转换该检出。如果已经安装 Gateway 网关，`openclaw update` 会刷新
服务元数据并重启服务，除非你传入 `--no-restart`。

对于使用托管 Gateway 网关服务的软件包安装，`openclaw update` 会以
该服务使用的软件包根目录为目标。如果 shell 中的 `openclaw` 命令
来自另一个安装，更新程序会打印两个根目录和托管
服务的 Node 路径，并在替换软件包前检查该 Node 版本是否满足目标版本的
`engines.node` 要求。

## 替代方式：重新运行安装程序

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 可跳过新手引导。若要强制使用特定安装类型，请传入
`--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 软件包安装阶段后失败，请改为重新运行
安装程序。它不会调用更新程序，而是直接执行全局软件包
安装，因此可以恢复部分更新的 npm 安装。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

使用 `--version` 将恢复操作固定到特定版本或 dist-tag：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方式：手动使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

对于受监管的安装，优先使用 `openclaw update`：它可以协调软件包
替换与正在运行的 Gateway 网关服务。如果你在受监管的
安装中手动更新，请先停止托管 Gateway 网关。软件包管理器会原地替换文件，
否则正在运行的 Gateway 网关可能会在替换过程中尝试加载核心或插件文件。
软件包管理器完成后重启 Gateway 网关，使其使用
新安装。

对于由 root 拥有的 Linux 系统级全局安装，如果 `openclaw update` 因
`EACCES` 失败，请使用系统 npm 恢复，并在
手动替换期间保持 Gateway 网关停止。请使用你通常为
该 Gateway 网关使用的相同配置文件标志/环境。将 `/usr/bin/npm` 替换为主机上
拥有 root 全局前缀的系统 npm：

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

然后验证：

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

当 `openclaw update` 管理全局 npm 安装时，它会先将目标版本
安装到临时 npm 前缀中，验证打包的 `dist` 清单，然后
将干净的软件包目录树替换到实际的全局前缀中，从而避免 npm
将新软件包覆盖到旧版本残留的过期文件上。如果安装
命令失败，OpenClaw 会使用 `--omit=optional` 重试一次，这有助于处理
无法编译原生可选依赖项的主机。

由 OpenClaw 管理的 npm 更新和插件更新命令还会为子 npm 进程清除 npm 的
`min-release-age` 供应链隔离策略（或旧版 `before` 配置键）。
该策略用于提供常规保护，但显式执行 OpenClaw 更新意味着“立即安装所选版本”。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 高级 npm 安装主题

<AccordionGroup>
  <Accordion title="只读软件包目录树">
    即使当前用户可以写入全局软件包目录，OpenClaw 在运行时也会将打包的全局安装视为只读。插件软件包安装位于用户配置目录下由 OpenClaw 所有的 npm/git 根目录中，Gateway 网关启动时不会修改 OpenClaw 软件包目录树。

    某些 Linux npm 设置会将全局软件包安装到由 root 拥有的目录下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支持这种布局，因为插件安装/更新命令会写入该全局软件包目录之外的位置。

  </Accordion>
  <Accordion title="强化的 systemd 单元">
    为 OpenClaw 授予其配置/状态根目录的写入权限，以便显式插件安装、插件更新和 Doctor 清理能够持久保存更改：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="磁盘空间预检查">
    在软件包更新和显式插件安装之前，OpenClaw 会尽力检查目标卷的磁盘空间。空间不足时会生成包含所检查路径的警告，但不会阻止更新，因为文件系统配额、快照和网络卷可能在检查后发生变化。实际的软件包管理器安装和安装后验证仍是最终依据。
  </Accordion>
</AccordionGroup>

## 自动更新程序

默认关闭。在 `~/.openclaw/openclaw.json` 中启用：

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| 渠道              | 行为                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | 等待 `stableDelayHours`（默认值：6），然后在 `stableJitterHours`（默认值：12）范围内加入确定性抖动后应用，以实现分散发布。                         |
| `extended-stable` | 启用 `checkOnStart` 时，会在启动时及之后每 24 小时检查一次只读更新提示。绝不会自动应用。                                                           |
| `beta`            | 每隔 `betaCheckIntervalHours`（默认值：1）检查一次并立即应用。                                                                                     |
| `dev`             | 不自动应用。请手动使用 `openclaw update`。                                                                                                        |

Gateway 网关还会在启动时记录更新提示（可通过
`update.checkOnStart: false` 禁用）。已存储的 extended-stable 选择使用此
只读提示路径和现有的 24 小时提示间隔，但绝不会调用
自动安装、移交、重启、stable 延迟/抖动或 beta 轮询。
若要降级或进行事件恢复，请在 Gateway 网关环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1`，以便即使配置了 `update.auto.enabled` 也阻止自动应用。除非同时禁用 `update.checkOnStart`，否则启动更新提示仍可运行。

通过实时 Gateway 网关控制平面请求的软件包管理器更新
（`update.run`）不会替换正在运行的 Gateway 网关
进程内的软件包目录树。在托管服务安装中，Gateway 网关会启动一个分离的移交流程，
随后退出，让常规 `openclaw update --yes --json` CLI 路径停止
服务、替换软件包、刷新服务元数据、重启、验证
Gateway 网关版本和可达性，并在可能时恢复已安装但未加载的 macOS
LaunchAgent。如果 Gateway 网关无法安全完成该移交，
`update.run` 会报告一条安全的 shell 命令，而不是在进程内运行软件包
管理器。

Control UI 侧边栏中的更新卡片会启动同一个 `update.run` 流程。在
已签名的 macOS 应用中，该卡片会先通过 Sparkle 更新应用；重新启动后，
应用会将其托管的本地 Gateway 网关更新到匹配版本。

## 更新后

<Steps>

### 运行 Doctor

```bash
openclaw doctor
```

迁移配置、审计私信策略并检查 Gateway 健康。详情：[Doctor](/zh-CN/gateway/doctor)

### 重启 Gateway 网关

```bash
openclaw gateway restart
```

### 验证

```bash
openclaw health
```

</Steps>

## 回滚

### 固定版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` 显示当前已发布的版本。
</Tip>

### 固定提交（源代码）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

若要返回最新版本：`git checkout main && git pull`。

## 如果遇到困难

- 再次运行 `openclaw doctor`，并仔细阅读输出。
- 对于源代码检出上的 `openclaw update --channel dev`，更新程序会在需要时自动引导安装 `pnpm`。如果看到 pnpm/corepack 引导错误，请手动安装 `pnpm`（或重新启用 `corepack`），然后重新运行更新。
- 查看：[故障排查](/zh-CN/gateway/troubleshooting)
- 在 Discord 中提问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关内容

- [安装概览](/zh-CN/install)：所有安装方式。
- [Doctor](/zh-CN/gateway/doctor)：更新后的健康检查。
- [迁移](/zh-CN/install/migrating)：主要版本迁移指南。

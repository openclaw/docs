---
read_when:
    - 更新 OpenClaw
    - 更新后出现故障
summary: 安全更新 OpenClaw（全局安装或源码安装）及回滚策略
title: 更新
x-i18n:
    generated_at: "2026-07-16T11:41:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

让 OpenClaw 保持最新。

有关 Docker、Podman 和 Kubernetes 镜像替换，请参阅
[升级容器镜像](/zh-CN/install/docker#upgrading-container-images)。Gateway 网关会在就绪前执行启动安全的升级工作；如果挂载的状态需要手动修复，则会退出。

## 推荐：`openclaw update`

检测安装类型（npm、pnpm、Bun 或 git），获取最新版本，运行 `openclaw doctor`，然后重启 Gateway 网关。

```bash
openclaw update
```

切换频道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 预览但不应用
```

`openclaw update` 没有 `--verbose` 标志（安装程序有）。要进行诊断，请使用
`--dry-run` 预览计划执行的操作，使用 `--json` 获取结构化结果，或使用
`openclaw update status --json` 检查频道和可用性状态。

`--channel beta` 优先使用 npm 的 beta dist-tag，但当 beta 标签缺失或其版本早于最新稳定版时，会回退到 stable/latest。
如需执行一次性软件包更新并锁定到原始 npm beta dist-tag，请改用 `--tag beta`。

`--channel extended-stable` 仅适用于软件包，并且安装仍只能在前台执行。OpenClaw 会读取公共 npm `extended-stable` 选择器，
验证选中的确切软件包，然后安装该确切版本。注册表数据缺失或不一致时会以失败关闭；绝不会回退到 `latest`。
如果选中的版本早于已安装版本，仍会执行常规的降级确认。核心更新成功后，CLI 会持久保存频道；直接执行 `npm install -g openclaw@extended-stable`
不会更新 `update.channel`。
核心切换后，符合条件且使用裸/default 或 `latest` 意图的官方 npm 插件会收敛到该确切核心版本。
确切版本锁定和显式的非 `latest` 标签、第三方插件及非 npm 来源均保持不变。
由当前 OpenClaw 版本创建的目录安装会保留该默认意图。仅包含确切版本的旧记录仍保持锁定，因为 OpenClaw 无法安全地区分旧的自动锁定和用户锁定；
请在 extended-stable 频道上运行一次 `openclaw plugins update @openclaw/name`，让该插件重新选择确切核心版本跟踪。

`--channel dev` 提供持久跟随变动的 GitHub `main` 检出。
对于一次性软件包更新，`--tag main` 会映射到 `github:openclaw/openclaw#main` 软件包规范，并通过目标软件包管理器（npm/pnpm/bun）直接安装。

对于托管插件，缺少 beta 版本只会产生警告，而不会导致失败：核心更新仍可成功，同时插件会回退到其记录的 default/latest 版本。

有关频道语义，请参阅[发布频道](/zh-CN/install/development-channels)。

## 在 npm 和 git 安装之间切换

使用频道更改安装类型。更新程序会保留 `~/.openclaw` 中的状态、配置、凭据和工作区；它只会更改 CLI 和 Gateway 网关所使用的 OpenClaw 代码安装。

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

`dev` 会确保存在 git 检出、构建它，并从该检出安装全局 CLI。
`stable`、`extended-stable` 和 `beta` 频道使用软件包安装。
在 git 检出中使用 extended-stable 会被拒绝，且不会对其进行修改或转换。
如果 Gateway 网关已经安装，`openclaw update` 会刷新服务元数据并重启服务，除非传入 `--no-restart`。

对于带有托管 Gateway 网关服务的软件包安装，`openclaw update` 会以该服务使用的软件包根目录为目标。
如果 shell 中的 `openclaw` 命令来自其他安装，更新程序会同时输出两个根目录和托管服务的 Node 路径，
并在替换软件包前，对照目标版本的 `engines.node` 要求检查该 Node 版本。

## 替代方案：重新运行安装程序

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 可跳过新手引导。要强制使用特定安装类型，请传入 `--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 软件包安装阶段后失败，请重新运行安装程序。
它不会调用更新程序，而是直接执行全局软件包安装，因此可以恢复部分更新的 npm 安装。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

使用 `--version` 将恢复操作锁定到特定版本或 dist-tag：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方案：手动使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

对于受监管的安装，建议使用 `openclaw update`：它可以与正在运行的 Gateway 网关服务协调软件包切换。
如果要手动更新受监管的安装，请先停止托管 Gateway 网关。软件包管理器会原地替换文件，否则正在运行的 Gateway 网关可能会在切换过程中尝试加载核心或插件文件。
软件包管理器完成后，重启 Gateway 网关，使其使用新安装。

对于由 root 所有的 Linux 系统级全局安装，如果 `openclaw update` 因 `EACCES` 而失败，
请使用系统 npm 进行恢复，并在手动替换期间保持 Gateway 网关停止。
使用平时用于该 Gateway 网关的相同配置文件标志/环境。
将 `/usr/bin/npm` 替换为主机上拥有 root 所有全局前缀的系统 npm：

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

当 `openclaw update` 管理全局 npm 安装时，它会先将目标安装到临时 npm 前缀中。
候选软件包会在 `preinstall` 期间验证主机 Node 版本；只有通过后，OpenClaw 才会验证打包的 `dist` 清单，
并将干净的软件包树切换到实际全局前缀中。打包的完成保护项不会列入预期清单，并且只会在 `preinstall` 成功后移除，
因此跳过生命周期脚本也会在切换前失败。在 npm 12 及更高版本中，更新程序只批准候选 OpenClaw 的生命周期；
传递依赖项脚本仍会被阻止。这可避免 npm 将新软件包覆盖到旧版本遗留的陈旧文件上。
如果安装命令失败，OpenClaw 会使用 `--omit=optional` 重试一次，这有助于处理无法编译原生可选依赖项的主机。

OpenClaw 管理的 npm 更新和插件更新命令还会为子 npm 进程清除 npm 的
`min-release-age` 供应链隔离（或较旧的 `before` 配置键）。
该策略用于常规保护，但显式执行 OpenClaw 更新意味着“立即安装选中的版本”。

```bash
pnpm add -g openclaw@latest
```

如果 pnpm 11 安装了 OpenClaw 2026.7.1，请手动运行一次该命令。
该版本早于 pnpm 11 的隔离式全局软件包布局，因此其更新程序可能会将另一个 npm 安装误认为正在运行的 CLI。
后续版本会保留 pnpm 所有权，并在更新期间跟随替换软件包的根目录。
它们还会使用所属管理器报告的全局 bin 目录；如果可用的 pnpm 命令报告了其他全局根目录或主版本，
或者调用方软件包已成为孤立项，或不是其中唯一活跃的 OpenClaw 安装，则会在修改前停止。

如果 OpenClaw 与其他软件包共享一个 pnpm 11 全局安装组，自动更新程序会在更改该组前停止。
请手动更新原始的逗号分隔组，以保持其同组软件包和构建策略不变。

```bash
bun add -g openclaw@latest
```

### 高级 npm 安装主题

<AccordionGroup>
  <Accordion title="只读软件包树">
    OpenClaw 在运行时会将打包的全局安装视为只读，即使当前用户对全局软件包目录具有写入权限也是如此。插件软件包安装位于用户配置目录下由 OpenClaw 所有的 npm/git 根目录中，Gateway 网关启动不会修改 OpenClaw 软件包树。

    某些 Linux npm 设置会将全局软件包安装在由 root 所有的目录下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支持这种布局，因为插件安装/更新命令会写入该全局软件包目录之外的位置。

  </Accordion>
  <Accordion title="强化的 systemd 单元">
    为 OpenClaw 的配置/状态根目录授予写入权限，以便显式插件安装、插件更新和 Doctor 清理能够持久保存更改：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="磁盘空间预检">
    在软件包更新和显式插件安装之前，OpenClaw 会尝试对目标卷执行尽力而为的磁盘空间检查。空间不足会产生包含所检查路径的警告，但不会阻止更新，因为文件系统配额、快照和网络卷在检查后仍可能变化。实际的软件包管理器安装和安装后验证仍是权威结果。
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

| 频道              | 行为                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | 等待 `stableDelayHours`（默认值：6），然后在 `stableJitterHours`（默认值：12）范围内加入确定性抖动后应用，以实现分散式发布。 |
| `extended-stable` | 启用 `checkOnStart` 时，会在启动时以及每 24 小时检查一次只读更新提示。绝不会自动应用。                                      |
| `beta`            | 每隔 `betaCheckIntervalHours`（默认值：1）检查一次并立即应用。                                                                     |
| `dev`             | 不自动应用。请手动使用 `openclaw update`。                                                                                   |

Gateway 网关还会在启动时记录更新提示（可通过 `update.checkOnStart: false` 禁用）。
已存储的 extended-stable 选择会使用此只读提示路径及现有的 24 小时提示间隔，但绝不会调用自动安装、移交、重启、稳定版延迟/抖动或 beta 轮询。
如需降级或进行事件恢复，请在 Gateway 网关环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1`，即使已配置 `update.auto.enabled` 也会阻止自动应用。
除非同时禁用 `update.checkOnStart`，否则启动更新提示仍可运行。

通过实时 Gateway 网关控制平面（`update.run`）请求的软件包管理器更新，
不会在正在运行的 Gateway 网关进程内替换软件包树。
在托管服务安装中，Gateway 网关会启动一个分离的移交进程并退出，然后由正常的 `openclaw update --yes --json` CLI 路径停止服务、
替换软件包、刷新服务元数据、重启、验证 Gateway 网关版本和可访问性，并在可能时恢复已安装但未加载的 macOS LaunchAgent。
如果 Gateway 网关无法安全地完成该移交，`update.run` 会报告一条安全的 shell 命令，而不是在进程内运行软件包管理器。

Control UI 侧边栏更新卡片会在直接启动此 `update.run` 流程时显示 **更新 Gateway 网关**。这适用于浏览器托管的 Control UI、远程 Gateway 网关，以及手动管理的本地 Gateway 网关。

在已签名的 macOS 应用中，对于由本地应用拥有的 Gateway 网关，该卡片会改为显示 **更新 Mac 应用 + Gateway 网关**。Sparkle 会先更新应用；应用重新启动后，会运行 `openclaw update --tag <app-version> --json`、重启其 Gateway 网关，并在设置风格的进度窗口中验证健康状态。仅当该托管 Gateway 网关需要更新、修复或安装时，才会显示此窗口；仅应用更新会在重新启动后直接进入应用。失败详情会持续显示，并提供 Retry、[更新指南](/zh-CN/install/updating)和 [Discord](https://discord.gg/clawd) 操作。对于远程或外部管理的 Gateway 网关，应用绝不会使用此协调路径；也绝不会降级较新的 Gateway 网关，或覆盖 `extended-stable` 渠道固定设置。

更新成功后，应用会为最近一个与真实用户/渠道发生过交互的顶层直接会话，将一次性欢迎事件加入队列。Cron 运行、Heartbeat 以及仅后台发生的会话更新不会改变此选择。在远程模式下，应用仅更新本地 Mac 节点运行时，并且仅当所连接的远程 Gateway 网关版本不低于应用版本时才发送该事件。

## 更新后

<Steps>

### 运行 Doctor

```bash
openclaw doctor
```

迁移配置、审计私信策略，并检查 Gateway 健康。详情：[Doctor](/zh-CN/gateway/doctor)

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

回滚分为两层：

1. 重新安装旧版 OpenClaw 代码，同时保留当前状态。
2. 仅当旧版代码无法使用已迁移的配置或数据库时，才恢复更新前的状态。

先从仅回滚代码开始。恢复状态会丢弃备份后所做的更改。

### 更新前：创建已验证的备份

`openclaw update` 会保留一份自动生成的更新前配置副本，但不会创建完整的状态恢复点。在进行重大更新前，请显式创建一个：

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

归档清单会记录 OpenClaw 版本以及备份中包含的源路径。归档可能包含凭据、身份验证配置文件和渠道状态，因此应仅授予所有者权限进行存储，并提供与实时状态目录相同级别的保护。有关包含和有意省略的文件，请参阅[备份](/zh-CN/cli/backup)。

如需逐字节一致的恢复点，并包含便携归档所省略的易变工件，请停止 Gateway 网关，并使用平台提供的文件系统、卷或虚拟机快照。

### 回滚软件包安装

列出已发布版本，然后预览并安装已知可用的版本：

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

相比直接通过软件包管理器安装，建议使用 `openclaw update --tag`。它会检测降级并请求确认，针对已安装的目标版本执行托管插件收敛和兼容性检查，刷新服务元数据，重启 Gateway 网关，并验证正在运行的版本。如果存储的渠道为 `extended-stable`，请使用 `--channel stable --tag <known-good-version>`，因为精确的一次性标签不能与 `extended-stable` 选择器组合使用。

软件包更新会在激活前暂存并验证候选版本。如果文件系统交换或命令垫片替换失败，OpenClaw 会自动恢复旧软件包。成功交换后，如果随后 Gateway 健康检查失败，则会报告先前版本和手动回滚说明，而不会再次自动替换软件包。

如果 CLI 更新路径不可用，请使用拥有当前 Gateway 网关安装的软件包管理器和安装范围：

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

当安装由相应管理器拥有时，请将 `npm` 替换为 `pnpm` 或 `bun`。在事件恢复期间，请在 Gateway 网关环境中设置 `OPENCLAW_NO_AUTO_UPDATE=1`，防止已启用的自动更新程序立即应用较新的版本。

### 回滚源代码检出

使用干净的检出，并选择一个已知可用的标签或提交：

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

要返回最新版本：`git checkout main && git pull`。

通过 git 启动更新后，如果依赖项安装、构建、UI 构建或 Doctor 失败，更新程序会自动将 git 检出恢复到先前的分支和 SHA。当你有意选择较旧的提交时，仍需手动检出。

### 跨会话 SQLite 迁移进行降级

在启动基于文件存储的旧版 OpenClaw 之前，请使用当前 CLI 恢复已归档的旧版记录工件：

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

这不会删除 SQLite 数据。在 SQLite 迁移后创建的会话仅存在于 SQLite 中，不会出现在旧版运行时中。请参阅 [SQLite 会话迁移后降级](/zh-CN/cli/doctor#downgrading-after-session-sqlite-migration)。

### 仅在必要时恢复状态

如果旧版代码无法读取较新的配置或数据库架构，请停止 Gateway 网关，并恢复已验证的更新前文件系统、卷或虚拟机快照。恢复前请单独保留当前状态，因为此操作会删除快照后所做的更改。

宽泛的 `openclaw backup create` 归档支持创建和验证，但不支持就地激活整个归档。请将宽泛归档解压到暂存目录，并使用其 `manifest.json` 源到归档映射执行离线恢复。`openclaw backup sqlite restore` 同样会将已验证的数据库写入新的目标；激活该目标仍需由操作员显式执行离线步骤。

### 验证回滚

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## 如果遇到问题

- 再次运行 `openclaw doctor`，并仔细阅读输出。
- 对于源代码检出中的 `openclaw update --channel dev`，更新程序会在需要时自动引导安装 `pnpm`。如果出现 pnpm/corepack 引导安装错误，请手动安装 `pnpm`（或重新启用 `corepack`），然后再次运行更新。
- 查看：[故障排查](/zh-CN/gateway/troubleshooting)
- 在 Discord 中提问：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相关内容

- [安装概览](/zh-CN/install)：所有安装方法。
- [Doctor](/zh-CN/gateway/doctor)：更新后的健康检查。
- [迁移](/zh-CN/install/migrating)：主要版本迁移指南。

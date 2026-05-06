---
read_when:
    - 你想要安全地更新源代码检出副本
    - 你正在调试 `openclaw update` 输出或选项
    - 你需要理解 `--update` 简写行为
summary: '`openclaw update` 的 CLI 参考（较安全的源码更新 + Gateway 网关自动重启）'
title: 更新
x-i18n:
    generated_at: "2026-05-06T12:48:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

安全更新 OpenClaw，并在 stable/beta/dev 渠道之间切换。

如果你通过 **npm/pnpm/bun** 安装（全局安装，没有 git 元数据），
更新会通过 [更新](/zh-CN/install/updating) 中的包管理器流程完成。

## 用法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。会重启 Gateway 网关的包管理器更新会在命令成功前，验证重启后的服务报告预期的已更新版本。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；持久化到配置中）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖包目标。对于包安装，`main` 会映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划的更新操作（渠道/标签/目标/重启流程），不会写入配置、安装、同步插件或重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括核心更新成功后存在损坏或无法卸载的托管插件需要修复时的 `postUpdate.plugins.warnings`，以及更新后插件同步期间检测到 npm 插件产物漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认为 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）。

`openclaw update` 没有 `--verbose` 标志。使用 `--dry-run` 预览计划的渠道/标签/安装/重启操作，使用 `--json` 获取机器可读结果；如果只需要渠道和可用性详情，请使用 `openclaw update status --json`。如果你正在调试更新期间的 Gateway 网关日志，控制台详细程度和文件日志级别是分开的：Gateway 网关 `--verbose` 会影响终端/WebSocket 输出，而文件日志需要在配置中设置 `logging.level: "debug"` 或 `"trace"`。参见 [Gateway 网关日志](/zh-CN/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，会禁用会修改状态的 `openclaw update` 运行。请改为更新此安装的 Nix 源或 flake 输入；对于 nix-openclaw，请使用智能体优先的 [快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍然是只读的。
</Note>

<Warning>
降级需要确认，因为较旧版本可能会破坏配置。
</Warning>

## `update status`

显示活动更新渠道 + git 标签/分支/SHA（用于源码检出），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认为 3 秒）。

## `update wizard`

用于选择更新渠道并确认更新后是否重启 Gateway 网关的交互式流程（默认会重启）。如果你在没有 git 检出的情况下选择 `dev`，它会提示创建一个检出。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会保持安装方法一致：

- `dev` → 确保存在 git 检出（默认：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆盖），更新它，并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或早于当前 stable 版本时，回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会在实时 Gateway 网关请求处理器之外启动 CLI 更新路径。控制平面的 `update.run` 包管理器更新会在包替换后强制执行非延迟、无冷却的更新重启，因为旧 Gateway 网关进程可能仍有指向新包已移除文件的内存中分块。

对于包管理器安装，`openclaw update` 会先解析目标包版本，再调用包管理器。npm 全局安装使用分阶段安装：OpenClaw 会把新包安装到临时 npm 前缀中，在那里验证打包的 `dist` 清单，然后把这棵干净的包树替换到真实的全局前缀中。如果验证失败，更新后的 Doctor、插件同步和重启工作不会从可疑树运行。即使已安装版本已经匹配目标版本，该命令也会刷新全局包安装，然后运行插件同步、核心命令补全刷新和重启工作。这会让打包的边车组件和渠道拥有的插件记录与已安装的 OpenClaw 构建保持一致，同时把完整的插件命令补全重建留给显式的 `openclaw completion --write-state` 运行。

当已安装本地托管的 Gateway 网关服务且启用了重启时，包管理器更新会先停止正在运行的服务，再替换包树，然后从更新后的安装刷新服务元数据、重启服务，并在报告成功前验证重启后的 Gateway 网关报告预期版本。在 macOS 上，更新后检查还会验证 LaunchAgent 已为活动配置文件加载/运行，并且配置的回环端口健康。如果 plist 已安装但 launchd 没有监管它，OpenClaw 会自动重新引导 LaunchAgent，然后重新运行健康/版本/渠道就绪检查。全新引导会直接加载 RunAtLoad 任务，因此更新恢复不会立即对新生成的 Gateway 网关执行 `kickstart -k`。如果 Gateway 网关仍未变为健康状态，该命令会以非零状态退出，并打印重启日志路径以及明确的重启、重新安装和包回滚说明。使用 `--no-restart` 时，包替换仍会运行，但托管服务不会停止或重启，因此正在运行的 Gateway 网关可能会继续使用旧代码，直到你手动重启它。

## Git 检出流程

### 渠道选择

- `stable`：检出最新的非 beta 标签，然后构建并运行 Doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 缺失或更旧时，回退到最新的 stable 标签。
- `dev`：检出 `main`，然后拉取并变基。

### 更新步骤

<Steps>
  <Step title="Verify clean worktree">
    要求没有未提交的更改。
  </Step>
  <Step title="Switch channel">
    切换到所选渠道（标签或分支）。
  </Step>
  <Step title="Fetch upstream">
    仅 dev。
  </Step>
  <Step title="Preflight build (dev only)">
    在临时工作树中运行 TypeScript 构建。如果顶端提交失败，会向前回溯最多 10 个提交，以找到最新可构建提交。设置 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 可在此预检期间同时运行 lint；lint 会以受限串行模式运行，因为用户更新主机通常比 CI runner 更小。
  </Step>
  <Step title="Rebase">
    变基到所选提交（仅 dev）。
  </Step>
  <Step title="Install dependencies">
    使用仓库包管理器。对于 pnpm 检出，更新器会按需引导 `pnpm`（先通过 `corepack`，然后回退到临时 `npm install pnpm@10`），而不是在 pnpm 工作区内运行 `npm run build`。
  </Step>
  <Step title="Build Control UI">
    构建 Gateway 网关和 Control UI。
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` 会作为最终的安全更新检查运行。
  </Step>
  <Step title="Sync plugins">
    将插件同步到活动渠道。dev 使用内置插件；stable 和 beta 使用 npm。更新已跟踪的插件安装。
  </Step>
</Steps>

在 beta 更新渠道上，跟随默认/latest 线路的已跟踪 npm 和 ClawHub 插件安装会先尝试插件 `@beta` 发布。如果插件没有 beta 发布，OpenClaw 会回退到记录的默认/latest spec。对于 npm 插件，如果 beta 包存在但安装验证失败，OpenClaw 也会回退。精确版本和显式标签不会被重写。

<Warning>
如果精确固定的 npm 插件更新解析到的产物完整性与存储的安装记录不同，`openclaw update` 会中止该插件产物更新，而不是安装它。只有在确认你信任新产物后，才显式重新安装或更新该插件。
</Warning>

<Note>
范围限定于托管插件的更新后插件同步失败，会在核心更新成功后报告为警告。JSON 结果会保持顶层更新 `status: "ok"`，并报告 `postUpdate.plugins.status: "warning"`，同时给出 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 指引。意外的更新器或同步异常仍会导致更新结果失败。修复插件安装或更新错误后，重新运行 `openclaw doctor --fix` 或 `openclaw update`。

更新后的 Gateway 网关启动时，插件加载仅执行验证：启动不会运行包管理器，也不会修改依赖树。包管理器 `update.run` 重启会在包树已替换后绕过正常的空闲延迟和重启冷却，因此旧进程无法继续懒加载已移除的分块。

如果 pnpm 引导仍然失败，更新器会提前停止并给出包管理器特定错误，而不是尝试在检出中运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动器脚本很有用）。

## 相关

- `openclaw doctor`（在 git 检出上会提示先运行更新）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)

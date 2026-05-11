---
read_when:
    - 你想安全地更新源代码检出副本
    - 你正在调试 `openclaw update` 输出或选项
    - 你需要了解 `--update` 简写行为
summary: CLI 参考：`openclaw update`（较安全的来源更新 + Gateway 网关自动重启）
title: 更新
x-i18n:
    generated_at: "2026-05-11T20:26:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
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

- `--no-restart`：成功更新后跳过重启 Gateway 网关服务。会重启 Gateway 网关的包管理器更新，会先验证重启后的服务报告了预期的更新版本，然后命令才会成功。
- `--channel <stable|beta|dev>`：设置更新渠道（git + npm；持久化到配置）。
- `--tag <dist-tag|version|spec>`：仅为本次更新覆盖包目标。对于包安装，`main` 会映射到 `github:openclaw/openclaw#main`。
- `--dry-run`：预览计划的更新操作（渠道/标签/目标/重启流程），但不写入配置、不安装、不同步插件，也不重启。
- `--json`：打印机器可读的 `UpdateRunResult` JSON，包括核心更新成功后损坏或无法加载的托管插件需要修复时的
  `postUpdate.plugins.warnings`、某个插件没有 beta 版本时的 beta 渠道插件回退详情，以及更新后插件同步期间检测到 npm 插件制品漂移时的 `postUpdate.plugins.integrityDrifts`。
- `--timeout <seconds>`：每个步骤的超时时间（默认 1800 秒）。
- `--yes`：跳过确认提示（例如降级确认）。

`openclaw update` 没有 `--verbose` 标志。使用 `--dry-run` 预览计划的渠道/标签/安装/重启操作，使用 `--json` 获取机器可读结果；如果你只需要渠道和可用性详情，请使用 `openclaw update status --json`。如果你在调试更新前后的 Gateway 网关日志，控制台详细程度和文件日志级别是分开的：Gateway 网关的 `--verbose` 会影响终端/WebSocket 输出，而文件日志需要在配置中设置 `logging.level: "debug"` 或 `"trace"`。参见 [Gateway 网关日志](/zh-CN/gateway/logging)。

<Note>
在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，会禁用会产生变更的 `openclaw update` 运行。请改为更新此安装的 Nix 源或 flake 输入；对于 nix-openclaw，请使用 agent 优先的 [快速开始](https://github.com/openclaw/nix-openclaw#quick-start)。`openclaw update status` 和 `openclaw update --dry-run` 仍保持只读。
</Note>

<Warning>
降级需要确认，因为较旧版本可能会破坏配置。
</Warning>

## `update status`

显示活跃更新渠道 + git 标签/分支/SHA（适用于源码检出），以及更新可用性。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：

- `--json`：打印机器可读的状态 JSON。
- `--timeout <seconds>`：检查超时时间（默认 3 秒）。

## `update wizard`

用于选择更新渠道，并确认更新后是否重启 Gateway 网关的交互式流程（默认重启）。如果你选择 `dev` 但没有 git 检出，它会提出创建一个。

选项：

- `--timeout <seconds>`：每个更新步骤的超时时间（默认 `1800`）

## 它会做什么

当你显式切换渠道（`--channel ...`）时，OpenClaw 也会保持安装方法一致：

- `dev` → 确保有 git 检出（默认：`~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆盖），
  更新它，并从该检出安装全局 CLI。
- `stable` → 使用 `latest` 从 npm 安装。
- `beta` → 优先使用 npm dist-tag `beta`，但当 beta 缺失或比当前 stable 版本更旧时回退到 `latest`。

Gateway 网关核心自动更新器（通过配置启用时）会在实时 Gateway 网关请求处理程序之外启动 CLI 更新路径。控制平面的 `update.run` 包管理器更新会在包替换后强制执行一次非延迟、无冷却的更新重启，因为旧的 Gateway 网关进程可能仍有指向新包已移除文件的内存中分块。

对于包管理器安装，`openclaw update` 会在调用包管理器之前解析目标包版本。npm 全局安装使用分阶段安装：OpenClaw 会把新包安装到一个临时 npm 前缀，验证那里的打包 `dist` 清单，然后把这个干净的包树替换到真正的全局前缀中。如果验证失败，更新后 Doctor、插件同步和重启工作不会从可疑树中运行。即使已安装版本已经匹配目标，命令也会刷新全局包安装，然后运行插件同步、核心命令补全刷新和重启工作。这会让打包的 sidecar 和渠道拥有的插件记录与已安装的 OpenClaw 构建保持一致，同时把完整的插件命令补全重建留给显式的 `openclaw completion --write-state` 运行。

当已安装本地托管 Gateway 网关服务且启用重启时，包管理器更新会先停止正在运行的服务，再替换包树，然后从更新后的安装刷新服务元数据、重启服务，并在报告成功前验证重启后的 Gateway 网关报告了预期版本。在 macOS 上，更新后检查还会验证 LaunchAgent 已为活跃配置文件加载/运行，且配置的 loopback 端口健康。如果 plist 已安装但 launchd 未监督它，OpenClaw 会自动重新 bootstrap LaunchAgent，然后重新运行健康/版本/渠道就绪检查。全新的 bootstrap 会直接加载 RunAtLoad 作业，因此更新恢复不会立即对新生成的 Gateway 网关执行 `kickstart -k`。如果 Gateway 网关仍未变为健康，命令会以非零状态退出，并打印重启日志路径以及明确的重启、重新安装和包回滚说明。使用 `--no-restart` 时，
包替换仍会运行，但托管服务不会停止或重启，因此正在运行的 Gateway 网关可能会保留旧代码，直到你手动重启它。

## Git 检出流程

### 渠道选择

- `stable`：检出最新的非 beta 标签，然后构建并运行 Doctor。
- `beta`：优先使用最新的 `-beta` 标签，但当 beta 缺失或更旧时回退到最新 stable 标签。
- `dev`：检出 `main`，然后 fetch 并 rebase。

### 更新步骤

<Steps>
  <Step title="验证干净工作树">
    要求没有未提交的更改。
  </Step>
  <Step title="切换渠道">
    切换到所选渠道（标签或分支）。
  </Step>
  <Step title="获取上游">
    仅限 Dev。
  </Step>
  <Step title="预检构建（仅限 dev）">
    在临时工作树中运行 TypeScript 构建。如果 tip 构建失败，会向回最多查找 10 个提交，以找到最新的可构建提交。设置 `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` 也会在此预检期间运行 lint；lint 会以受限串行模式运行，因为用户更新主机通常小于 CI 运行器。
  </Step>
  <Step title="Rebase">
    Rebase 到所选提交上（仅限 dev）。
  </Step>
  <Step title="安装依赖项">
    使用仓库包管理器。对于 pnpm 检出，更新器会按需 bootstrap `pnpm`（先通过 `corepack`，再使用临时 `npm install pnpm@11` 回退），而不是在 pnpm 工作区内运行 `npm run build`。
  </Step>
  <Step title="构建控制 UI">
    构建 gateway 和控制 UI。
  </Step>
  <Step title="运行 Doctor">
    `openclaw doctor` 会作为最终的安全更新检查运行。
  </Step>
  <Step title="同步插件">
    将插件同步到活跃渠道。Dev 使用内置插件；stable 和 beta 使用 npm。更新已跟踪的插件安装。
  </Step>
</Steps>

在 beta 更新渠道上，跟随默认/latest 线路的已跟踪 npm 和 ClawHub 插件安装，会先尝试插件 `@beta` 版本。如果插件没有 beta 版本，OpenClaw 会回退到记录的默认/latest 规格，并将其报告为警告。对于 npm 插件，当 beta 包存在但安装验证失败时，OpenClaw 也会回退。这些插件回退警告不会导致核心更新失败。精确版本和显式标签不会被重写。

<Warning>
如果一个精确固定的 npm 插件更新解析到的制品，其完整性与已存储安装记录不同，`openclaw update` 会中止该插件制品更新，而不是安装它。只有在验证你信任新制品后，才显式重新安装或更新该插件。
</Warning>

<Note>
作用域限定到托管插件的更新后插件同步失败，会在核心更新成功后报告为警告。JSON 结果会保持顶层更新 `status: "ok"`，并报告 `postUpdate.plugins.status: "warning"`，同时提供 `openclaw doctor --fix` 和 `openclaw plugins inspect <id> --runtime --json` 指引。意外的更新器或同步异常仍会导致更新结果失败。修复插件安装或更新错误后，重新运行 `openclaw doctor --fix` 或 `openclaw update`。

更新后的 Gateway 网关启动时，插件加载只进行验证：启动不会运行包管理器，也不会变更依赖树。包管理器 `update.run` 重启会在包树替换后绕过正常的空闲延迟和重启冷却，因此旧进程无法继续懒加载已移除的分块。

如果 pnpm bootstrap 仍然失败，更新器会提前停止，并给出包管理器特定错误，而不是尝试在检出中运行 `npm run build`。
</Note>

## `--update` 简写

`openclaw --update` 会重写为 `openclaw update`（对 shell 和启动器脚本很有用）。

## 相关

- `openclaw doctor`（在 git 检出上会提出先运行更新）
- [开发渠道](/zh-CN/install/development-channels)
- [更新](/zh-CN/install/updating)
- [CLI 参考](/zh-CN/cli)

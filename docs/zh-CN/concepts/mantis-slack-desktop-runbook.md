---
read_when:
    - 从 GitHub 或本地运行 Mantis Slack 桌面端 QA
    - 排查 Mantis Slack 桌面端运行缓慢的问题
    - 选择 source、prehydrated 或 warm-lease 模式
    - 将截图和视频证据发布到拉取请求
summary: Mantis Slack 桌面端 QA 的操作员运行手册：GitHub dispatch、本地 CLI、预热 VNC 租约、水合模式、耗时解读、工件和失败处理。
title: Mantis Slack 桌面端运行手册
x-i18n:
    generated_at: "2026-05-05T22:53:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a8046e30cb348a7edf01845216f97f67dc3b3695f2484b7e883d3b862ffad81
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 桌面 QA 是用于 Slack 类 bug 的真实 UI 通道，这类 bug 需要 Linux 桌面、VNC 救援、Slack Web、真实的 OpenClaw Gateway 网关、截图、视频以及 PR 证据评论。

当单元测试或无头 Slack 实时通道无法证明该 bug 时使用它。

## 存储模型

Mantis 使用三种不同的存储层：

- 提供商镜像：由 Crabbox 拥有并存储在云提供商账号中。
  它包含机器能力，例如 Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、原生构建工具以及空缓存目录。
- 热租约状态：由当前操作员会话拥有。租约存活期间，它可以包含已登录的浏览器配置文件、`/var/cache/crabbox/pnpm`，以及准备好的源代码检出。
- Mantis 工件：由 OpenClaw 运行拥有。它们位于
  `.artifacts/qa-e2e/mantis/...` 下，然后 GitHub Actions 会上传它们，Mantis GitHub App 会在 PR 上评论内联证据。

绝不要把密钥、浏览器 cookie、Slack 登录状态、仓库检出、
`node_modules` 或 `dist/` 放入预烘焙的提供商镜像中。

## GitHub 调度

从 `main` 运行工作流：

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

允许的 `candidate_ref` 值被有意限制得很窄，因为该工作流使用实时凭证：当前 `main` 祖先、发布标签，或来自 `openclaw/openclaw` 的开放 PR head。

该工作流会写入：

- 已上传工件：`mantis-slack-desktop-smoke-<run-id>-<attempt>`；
- 来自 Mantis GitHub App 的内联 PR 评论；
- `slack-desktop-smoke.png`；
- `slack-desktop-smoke.mp4`；
- `slack-desktop-smoke-preview.gif`；
- `slack-desktop-smoke-change.mp4`；
- `mantis-slack-desktop-smoke-summary.json`；
- `mantis-slack-desktop-smoke-report.md`；
- 远程日志，例如 `slack-desktop-command.log`、`openclaw-gateway.log`、
  `chrome.log` 和 `ffmpeg.log`。

PR 评论会通过隐藏的
`<!-- mantis-slack-desktop-smoke -->` 标记原地更新。

## 本地 CLI

冷源代码证明：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

保留 VM 以便 VNC 救援：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

打开 VNC：

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

复用热租约：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

只有当复用的远程工作区已经有 `node_modules` 和已构建的 `dist/` 时，才使用 `--hydrate-mode prehydrated`。如果缺少这些内容，Mantis 会失败并关闭。

## Hydrate 模式

| 模式          | 使用场景                                  | 远程行为                                                                       | 权衡                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 常规 PR 证明、冷机器、CI        | 在 VM 内运行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build` | 最慢，但提供最强的源代码检出证明                 |
| `prehydrated` | 你有意准备了一个复用租约 | 需要现有的 `node_modules` 和 `dist/`；跳过安装/构建                     | 快，但只对操作员控制的热租约有效 |

GitHub Actions 总会在 VM 运行前准备候选检出。其 pnpm 存储会按 OS、Node 版本和 lockfile 缓存。VM 源代码运行在存在 `/var/cache/crabbox/pnpm` 时也会使用它。

## 时序解读

`mantis-slack-desktop-smoke-report.md` 包含阶段耗时：

- `crabbox.warmup`：云提供商启动、桌面/浏览器就绪和 SSH。
- `crabbox.inspect`：租约元数据查询。
- `credentials.prepare`：Convex 凭证租约获取。
- `crabbox.remote_run`：同步、浏览器启动、OpenClaw 安装/构建或 hydrate 验证、Gateway 网关启动、截图和视频捕获。
- `artifacts.copy`：从 VM rsync 回来。

当 Crabbox 返回非零远程状态，但 Mantis 已复制元数据证明 OpenClaw Gateway 网关存活且设置已完成时，`crabbox.remote_run` 可以被标记为 `accepted`。把 `accepted` 视为带说明的通过，而不是失败场景。

如果运行很慢：

- warmup 占主导：预烘焙或升级到更好的 Crabbox 提供商镜像；
- `source` 中 remote_run 占主导：使用热租约、改进 pnpm 存储复用，或把机器先决条件移入提供商镜像；
- `prehydrated` 中 remote_run 占主导：远程工作区实际上尚未就绪，或 Gateway 网关/浏览器/Slack 设置较慢；
- 工件复制占主导：检查视频大小和工件目录内容。

## 证据清单

好的 PR 评论应展示：

- 场景 ID 和候选 SHA；
- GitHub Actions 运行 URL；
- 工件 URL；
- 内联截图；
- 可用时提供内联动画预览；
- 完整 MP4 和裁剪后 MP4 链接；
- 通过/失败状态；
- 附加报告中的耗时摘要。

不要把截图或视频提交到仓库中。把它们保存在 GitHub Actions 工件或 PR 评论中。

## 失败处理

如果工作流在 VM 运行前失败，请先检查 Actions job。典型原因包括不受信任的 `candidate_ref`、缺少环境密钥，或候选安装/构建失败。

如果 VM 运行失败但截图已复制回来，请检查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果运行保留了租约，请使用报告中的 `crabbox vnc ...` 命令打开 VNC。完成后停止租约：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登录已过期，请在保留租约上的 VNC 中修复它，并用 `--lease-id` 重新运行。不要把该浏览器配置文件烘焙进提供商镜像。

相关文档：

- [QA overview](qa-e2e-automation.md)
- [Slack 渠道](../channels/slack.md)
- [测试](../help/testing.md)

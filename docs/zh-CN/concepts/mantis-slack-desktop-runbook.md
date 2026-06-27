---
read_when:
    - 从 GitHub 或本地运行 Mantis Slack 桌面 QA
    - 调试缓慢的 Mantis Slack 桌面运行
    - 选择 source、prehydrated 或 warm-lease 模式
    - 将截图和视频证据发布到 PR
summary: Mantis Slack 桌面 QA 的操作员运行手册：GitHub 调度、本地 CLI、预热 VNC 租约、hydrate 模式、时序解读、工件和故障处理。
title: Mantis Slack 桌面版运行手册
x-i18n:
    generated_at: "2026-06-27T01:48:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack 桌面 QA 是用于 Slack 类 bug 的真实 UI 通道，这些 bug 需要
Linux 桌面、VNC 救援、Slack Web、真实的 OpenClaw Gateway 网关、截图、
视频以及 PR 证据评论。

当单元测试或无头 Slack 实时通道无法证明该 bug 时使用它。

## 存储模型

Mantis 使用三种不同的存储层：

- 提供商镜像：由 Crabbox 拥有，并存储在云提供商账号中。
  它包含机器能力，例如 Chrome/Chromium、ffmpeg、scrot、
  Node/corepack/pnpm、原生构建工具以及空缓存目录。
- 预热租约状态：由当前操作者会话拥有。只要租约存活，它可以包含
  已登录的浏览器配置文件、`/var/cache/crabbox/pnpm`，以及准备好的源码
  checkout。
- Mantis 构件：由 OpenClaw 运行拥有。它们位于
  `.artifacts/qa-e2e/mantis/...` 下，之后 GitHub Actions 会上传它们，并由
  Mantis GitHub App 在 PR 上评论内联证据。

绝不要把密钥、浏览器 cookie、Slack 登录状态、仓库 checkout、
`node_modules` 或 `dist/` 放入预烘焙的提供商镜像中。

## GitHub 调度

从 `main` 运行该工作流：

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

允许的 `candidate_ref` 值被有意限制得很窄，因为该工作流
使用实时凭据：当前 `main` 祖先、发布标签，或来自 `openclaw/openclaw`
的打开 PR head。

该工作流会写入：

- 上传的构件：`mantis-slack-desktop-smoke-<run-id>-<attempt>`；
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

冷启动源码证明：

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

复用预热租约：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

仅当复用的远程工作区已经有 `node_modules` 和已构建的 `dist/` 时，
才使用 `--hydrate-mode prehydrated`。如果缺少这些内容，Mantis 会失败关闭。

证明原生 Slack 审批 UI：

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

审批检查点模式与 `--gateway-setup` 互斥。除非你传入显式的审批检查点
`--scenario` 标志，否则它会运行选择启用的 `slack-approval-exec-native` 和
`slack-approval-plugin-native` 场景；其他 Slack 场景会在 VM 启动前被拒绝。Slack QA 运行器会根据它观察到的真实 Slack API 消息写入
每个检查点 JSON 文件，之后远程 watcher 会把该消息快照渲染为
`approval-checkpoints/<scenario>-pending.png` 和
`approval-checkpoints/<scenario>-resolved.png`。如果任何检查点
JSON、消息证据、ack JSON 或渲染截图缺失或为空，运行就会失败。

冷启动 GitHub Actions 租约没有 Slack Web cookie，因此它们的浏览器
捕获可能会落到 Slack 登录页。对于审批检查点证明，应信任渲染的检查点图片和 Slack QA 构件，而不是
`slack-desktop-smoke.png`。仅当浏览器截图本身必须显示 Slack Web 时，
才使用已手动登录 Slack Web 配置文件的保留预热租约。

## Hydrate 模式

| 模式          | 使用场景                                  | 远程行为                                                                       | 取舍                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | 常规 PR 证明、冷启动机器、CI        | 在 VM 内运行 `pnpm install --frozen-lockfile --prefer-offline` 和 `pnpm build` | 最慢，但提供最强的源码 checkout 证明                 |
| `prehydrated` | 你有意准备了复用租约 | 要求已有 `node_modules` 和 `dist/`；跳过安装/构建                     | 很快，但只对操作者控制的预热租约有效 |

GitHub Actions 总是在 VM 运行前准备候选 checkout。其 pnpm 存储会按操作系统、Node 版本和 lockfile 缓存。VM 源码运行也会在存在时使用
`/var/cache/crabbox/pnpm`。

## 时序解读

`mantis-slack-desktop-smoke-report.md` 包含阶段耗时：

- `crabbox.warmup`：云提供商启动、桌面/浏览器就绪，以及 SSH。
- `crabbox.inspect`：租约元数据查找。
- `credentials.prepare`：获取 Convex 凭据租约。
- `crabbox.remote_run`：同步、浏览器启动、OpenClaw 安装/构建或
  hydrate 验证、Gateway 网关启动、截图和视频捕获。
- `artifacts.copy`：从 VM 反向 rsync。

当 Mantis 已复制元数据，证明 OpenClaw Gateway 网关设置已完成，或 Slack QA 命令本身已成功退出后，如果 Crabbox 返回非零远程状态，
`crabbox.remote_run` 可以标记为 `accepted`。
将 `accepted` 视为带解释的通过，而不是失败场景。

如果运行很慢：

- warmup 占主导：预烘焙或提升到更好的 Crabbox 提供商镜像；
- remote_run 在 `source` 中占主导：使用预热租约、改进 pnpm 存储复用，
  或把机器前置条件移入提供商镜像；
- remote_run 在 `prehydrated` 中占主导：远程工作区实际上还未就绪，
  或 Gateway 网关/浏览器/Slack 设置很慢；
- artifact copy 占主导：检查视频大小和构件目录内容。

## 证据清单

一条好的 PR 评论应显示：

- 场景 ID 和候选 SHA；
- GitHub Actions 运行 URL；
- 构件 URL；
- 内联审批检查点截图，或来自已登录预热租约的 Slack Web 截图；
- 可用时的内联动画预览；
- 完整 MP4 和裁剪后 MP4 链接；
- 通过/失败状态；
- 附加报告中的时序摘要。

不要把截图或视频提交到仓库。把它们保留在 GitHub Actions 构件或 PR 评论中。

## 失败处理

如果工作流在 VM 运行前失败，请先检查 Actions 作业。典型原因是
不受信任的 `candidate_ref`、缺少环境密钥，或候选安装/构建失败。

如果 VM 运行失败但截图已复制回来，请检查：

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

如果运行保留了租约，请使用报告中的 `crabbox vnc ...` 命令打开 VNC。
完成后停止租约：

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

如果 Slack 登录已过期，请在保留租约上的 VNC 中修复它，并使用
`--lease-id` 重新运行。不要把该浏览器配置文件烘焙进提供商镜像。

## 相关

- [QA overview](/zh-CN/concepts/qa-e2e-automation)
- [Slack 频道](/zh-CN/channels/slack)
- [测试](/zh-CN/help/testing)

---
read_when:
    - 从仓库运行脚本
    - 添加或更改 ./scripts 下的脚本
summary: 仓库脚本：用途、范围和安全说明
title: 脚本
x-i18n:
    generated_at: "2026-07-05T11:21:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` 存放用于本地工作流和运维任务的辅助脚本。当任务明确关联到某个脚本时使用这些脚本；否则优先使用 CLI。

## 约定

- 除非文档或发布检查清单中引用，脚本都是**可选**的。
- 如果存在 CLI 界面，优先使用 CLI（示例：`openclaw models status --check`）。
- 假定脚本与主机相关；在新机器上运行前先阅读脚本。

## 凭证监控脚本

通用模型凭证在[身份认证](/zh-CN/gateway/authentication)中介绍。下面的脚本是一个独立的可选系统，用于在远程/无头主机上监控 **Claude Code CLI 订阅令牌**，并从手机重新认证：

- `scripts/setup-auth-system.sh` - 一次性设置：检查当前凭证，帮助生成长期有效的 `claude setup-token`，并打印 systemd/Termux 安装步骤。
- `scripts/claude-auth-status.sh [full|json|simple]` - 检查 Claude Code + OpenClaw 凭证状态。
- `scripts/auth-monitor.sh` - 轮询状态，并在令牌接近过期时发送通知（通过 OpenClaw send 和/或 ntfy.sh）。环境变量：`WARN_HOURS`（默认 `2`）、`NOTIFY_PHONE`、`NOTIFY_NTFY`。通过内置的 `scripts/systemd/openclaw-auth-monitor.{service,timer}` 按计划运行（每 30 分钟一次）。
- `scripts/mobile-reauth.sh` - 重新运行 `claude setup-token`，并打印可在手机上打开的 URL，用于通过 Termux SSH 使用。
- `scripts/termux-quick-auth.sh`、`scripts/termux-auth-widget.sh`、`scripts/termux-sync-widget.sh` - Termux:Widget 脚本，会 SSH 到主机、显示状态 toast，并在凭证过期时打开重新认证控制台/说明。

## GitHub 读取辅助工具

当你希望 `gh` 使用 GitHub App 安装令牌执行仓库范围的读取调用，同时让普通 `gh` 继续使用你的个人登录执行写入操作时，请使用 `scripts/gh-read`。

必需环境变量：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

可选环境变量：

- `OPENCLAW_GH_READ_INSTALLATION_ID`，当你希望跳过基于仓库的安装查找时使用
- `OPENCLAW_GH_READ_PERMISSIONS`，作为以逗号分隔的覆盖值，用于指定要请求的读取权限子集

仓库解析顺序：

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

示例：

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## 添加脚本时

- 保持脚本聚焦且有文档说明。
- 在相关文档中添加一条简短条目（如果缺失则创建一个）。

## 相关

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)

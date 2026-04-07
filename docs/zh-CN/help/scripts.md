---
read_when:
    - 从仓库运行脚本时
    - 在 ./scripts 下添加或修改脚本时
summary: 仓库脚本：用途、范围和安全注意事项
title: 脚本
x-i18n:
    generated_at: "2026-04-07T23:10:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecf1e9327929948fb75f80e306963af49b353c0aa8d3b6fa532ca964ff8b975
    source_path: help/scripts.md
    workflow: 15
---

# 脚本

`scripts/` 目录包含用于本地工作流和运维任务的辅助脚本。
当某项任务明确与某个脚本相关时，请使用这些脚本；否则优先使用 CLI。

## 约定

- 除非文档或发布检查清单中引用了脚本，否则脚本都是**可选**的。
- 如果存在 CLI 界面，优先使用 CLI（例如：凭证监控使用 `openclaw models status --check`）。
- 假定脚本与主机相关；在新机器上运行前先阅读脚本内容。

## 凭证监控脚本

凭证监控已在[身份验证](/zh-CN/gateway/authentication)中说明。`scripts/` 下的脚本是 systemd/Termux 手机工作流的可选附加项。

## GitHub 读取辅助工具

当你希望 `gh` 在保持普通 `gh` 使用你的个人登录进行写入操作的同时，对仓库范围的读取调用使用 GitHub App 安装令牌时，请使用 `scripts/gh-read`。

必需环境变量：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

可选环境变量：

- `OPENCLAW_GH_READ_INSTALLATION_ID`，当你想跳过基于仓库的安装查找时使用
- `OPENCLAW_GH_READ_PERMISSIONS`，用于指定要请求的读取权限子集的逗号分隔覆盖值

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
- 在相关文档中添加简短条目（如果缺失则创建）。

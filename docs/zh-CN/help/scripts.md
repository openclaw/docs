---
read_when:
    - 从仓库运行脚本
    - 添加或更改 ./scripts 下的脚本
summary: 仓库脚本：用途、范围和安全注意事项
title: 脚本
x-i18n:
    generated_at: "2026-05-06T04:33:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`scripts/` 目录包含用于本地工作流和运维任务的辅助脚本。
当任务明确与某个脚本相关时使用这些脚本；否则优先使用 CLI。

## 约定

- 除非在文档或发布检查清单中引用，否则脚本都是**可选的**。
- 存在 CLI 界面时优先使用它们（示例：凭证监控使用 `openclaw models status --check`）。
- 假定脚本与宿主机相关；在新机器上运行前先阅读它们。

## 身份验证监控脚本

身份验证监控在 [身份验证](/zh-CN/gateway/authentication) 中说明。`scripts/` 下的脚本是 systemd/Termux 手机工作流的可选补充。

## GitHub 读取助手

当你希望 `gh` 使用 GitHub App 安装令牌执行仓库范围的读取调用，同时让普通 `gh` 继续使用你的个人登录执行写入操作时，请使用 `scripts/gh-read`。

必需环境变量：

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

可选环境变量：

- 当你想跳过基于仓库的安装查找时，使用 `OPENCLAW_GH_READ_INSTALLATION_ID`
- 使用 `OPENCLAW_GH_READ_PERMISSIONS` 作为逗号分隔的覆盖值，指定要请求的读取权限子集

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
- 在相关文档中添加一条简短条目（如果缺失，则创建一个）。

## 相关内容

- [测试](/zh-CN/help/testing)
- [实时测试](/zh-CN/help/testing-live)

---
read_when:
    - 更新 macOS Skills 设置界面
    - 更改 Skills 门控或安装行为
summary: macOS Skills 设置 UI 和由 Gateway 网关支持的状态
title: Skills（macOS）
x-i18n:
    generated_at: "2026-07-05T11:27:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS 应用通过 Gateway 网关公开 OpenClaw 技能；它不会在本地解析技能。

## 数据来源

- `skills.status`（Gateway 网关）返回所有技能，以及资格和缺失要求，包括对内置技能的允许列表阻止。
- 要求来自每个 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安装操作

- `metadata.openclaw.install` 定义安装选项（brew/node/go/uv/download）。
- 应用调用 `skills.install` 在 Gateway 网关主机上运行安装器。
- 操作员拥有的 `security.installPolicy`（`enabled`、`targets`、`exec`）可以在安装器元数据运行前阻止由 Gateway 网关支持的技能安装。内置危险代码扫描（用于插件安装）未接入技能安装流程。
- 如果每个安装选项都是 `download`，Gateway 网关会公开所有下载选项。
- 否则，Gateway 网关会使用当前安装偏好（`skills.install.preferBrew`、`skills.install.nodeManager`）和主机二进制文件选择一个首选安装器：启用 `preferBrew` 且存在 `brew` 时优先使用 Homebrew，然后是 `uv`，然后是配置的 Node 管理器，然后是在可用时再次使用 Homebrew（即使没有 `preferBrew`），然后是 `go`，然后是 `download`。
- Node 安装标签会反映配置的 Node 管理器，包括 `yarn`。

## 环境/API 密钥

- 应用将密钥存储在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 下。
- `skills.update` 会修补 `enabled`、`apiKey` 和 `env`。

## 远程模式

- 安装和配置更新发生在 Gateway 网关主机上，而不是本地 Mac 上。

## 相关

- [Skills](/zh-CN/tools/skills)
- [macOS 应用](/zh-CN/platforms/macos)

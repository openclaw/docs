---
read_when:
    - 更新 macOS Skills 设置界面
    - 更改 Skills 门控或安装行为
summary: macOS Skills 设置界面和由 Gateway 网关提供的状态
title: Skills（macOS）
x-i18n:
    generated_at: "2026-07-11T20:42:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS 应用通过 Gateway 网关提供 OpenClaw Skills；它不会在本地解析 Skills。

## 数据来源

- `skills.status`（Gateway 网关）返回所有 Skills 及其适用性和缺失的要求，包括内置 Skills 的允许列表阻止项。
- 要求来自每个 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安装操作

- `metadata.openclaw.install` 定义安装选项（brew/node/go/uv/download）。
- 应用调用 `skills.install`，在 Gateway 网关主机上运行安装程序。
- 由操作员管理的 `security.installPolicy`（`enabled`、`targets`、`exec`）可在运行安装程序元数据前，阻止由 Gateway 网关执行的 Skill 安装。内置的危险代码扫描（用于插件安装）尚未接入 Skill 安装流程。
- 如果所有安装选项都是 `download`，Gateway 网关会提供全部下载选项。
- 否则，Gateway 网关会根据当前安装偏好（`skills.install.preferBrew`、`skills.install.nodeManager`）和主机上的二进制文件选择一个首选安装程序：启用 `preferBrew` 且存在 `brew` 时首先选择 Homebrew，然后依次选择 `uv`、配置的 node 管理器；如果 Homebrew 可用，则再次选择 Homebrew（即使未启用 `preferBrew`），之后依次选择 `go` 和 `download`。
- Node 安装标签会反映所配置的 node 管理器，包括 `yarn`。

## 环境变量/API 密钥

- 应用将密钥存储在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 下。
- `skills.update` 会修补 `enabled`、`apiKey` 和 `env`。

## 远程模式

- 安装和配置更新在 Gateway 网关主机上进行，而不是在本地 Mac 上进行。

## 相关内容

- [Skills](/zh-CN/tools/skills)
- [macOS 应用](/zh-CN/platforms/macos)

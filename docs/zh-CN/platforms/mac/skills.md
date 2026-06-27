---
read_when:
    - 更新 macOS Skills 设置 UI
    - 更改 Skills gating 或安装行为
summary: macOS Skills 设置 UI 和由 Gateway 网关支持的状态
title: Skills（macOS）
x-i18n:
    generated_at: "2026-06-27T02:33:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS 应用通过 Gateway 网关公开 OpenClaw Skills；它不会在本地解析 Skills。

## 数据源

- `skills.status`（Gateway 网关）返回所有 Skills，以及资格状态和缺失要求
  （包括内置 Skills 的允许列表拦截）。
- 要求来自每个 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安装操作

- `metadata.openclaw.install` 定义安装选项（brew/node/go/uv）。
- 应用调用 `skills.install` 在 Gateway 网关主机上运行安装器。
- 操作者拥有的 `security.installPolicy` 可以在安装器元数据运行前阻止由 Gateway 网关支持的 Skills
  安装。安装时内置的危险代码拦截不属于 Skills 安装流程。
- 如果每个安装选项都是 `download`，Gateway 网关会公开所有下载
  选择。
- 否则，Gateway 网关会使用当前安装偏好和主机二进制文件选择一个首选安装器：当
  `skills.install.preferBrew` 已启用且 `brew` 存在时优先使用 Homebrew，然后是 `uv`，然后是
  `skills.install.nodeManager` 中配置的 node 管理器，再然后是
  `go` 或 `download` 等后续回退选项。
- Node 安装标签会反映配置的 node 管理器，包括 `yarn`。

## 环境/API 密钥

- 应用将密钥存储在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 下。
- `skills.update` 会修补 `enabled`、`apiKey` 和 `env`。

## 远程模式

- 安装和配置更新发生在 Gateway 网关主机上（不是本地 Mac）。

## 相关

- [Skills](/zh-CN/tools/skills)
- [macOS 应用](/zh-CN/platforms/macos)

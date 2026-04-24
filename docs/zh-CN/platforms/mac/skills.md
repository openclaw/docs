---
read_when:
    - 更新 macOS Skills 设置 UI
    - 更改 Skills 门控或安装行为
summary: macOS Skills 设置 UI 和 Gateway 网关支持的状态
title: Skills（macOS）
x-i18n:
    generated_at: "2026-04-24T04:05:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

macOS 应用通过 gateway 公开 OpenClaw Skills；它不会在本地解析 Skills。

## 数据来源

- `skills.status`（gateway）返回所有 Skills，以及资格状态和缺失要求
  （包括对内置 Skills 的允许列表阻止）。
- 要求来自每个 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安装操作

- `metadata.openclaw.install` 定义安装选项（brew/node/go/uv）。
- 应用调用 `skills.install` 在 gateway 主机上运行安装器。
- 内置危险代码 `critical` 发现默认会阻止 `skills.install`；可疑发现仍然只会发出警告。危险覆盖确实存在于 gateway 请求上，但默认应用流程保持失败关闭。
- 如果每个安装选项都是 `download`，gateway 会公开所有下载
  选项。
- 否则，gateway 会根据当前安装偏好和主机二进制文件选择一个首选
  安装器：当启用 `skills.install.preferBrew` 且存在 `brew` 时优先使用 Homebrew，然后是 `uv`，接着是
  `skills.install.nodeManager` 中配置的 node 管理器，最后才是
  `go` 或 `download` 等后备选项。
- Node 安装标签会反映已配置的 node 管理器，包括 `yarn`。

## 环境变量 / API 密钥

- 应用将密钥存储在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 下。
- `skills.update` 会对 `enabled`、`apiKey` 和 `env` 进行 patch 更新。

## 远程模式

- 安装和配置更新都发生在 gateway 主机上（而不是本地 Mac 上）。

## 相关内容

- [Skills](/zh-CN/tools/skills)
- [macOS app](/zh-CN/platforms/macos)

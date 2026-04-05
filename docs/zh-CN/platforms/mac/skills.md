---
read_when:
    - 更新 macOS Skills 设置 UI 时
    - 更改 skills gating 或安装行为时
summary: macOS 上的 Skills 设置 UI 和基于 gateway 的状态
title: Skills（macOS）
x-i18n:
    generated_at: "2026-04-05T08:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ffd6744646d2c8770fa12a5e511f84a40b5ece67181139250ec4cc4301b49b8
    source_path: platforms/mac/skills.md
    workflow: 15
---

# Skills（macOS）

macOS 应用通过 gateway 展示 OpenClaw Skills；它不会在本地解析 skills。

## 数据源

- `skills.status`（gateway）返回所有 skills，以及资格和缺失的要求
  （包括对内置 skills 的允许列表阻止）。
- 要求派生自每个 `SKILL.md` 中的 `metadata.openclaw.requires`。

## 安装操作

- `metadata.openclaw.install` 定义安装选项（brew/node/go/uv）。
- 应用调用 `skills.install` 在 Gateway 网关主机上运行安装程序。
- 内置危险代码 `critical` 发现默认会阻止 `skills.install`；可疑发现仍然只会发出警告。危险覆盖选项存在于 gateway 请求上，但默认应用流程保持失败即关闭。
- 如果每个安装选项都是 `download`，gateway 会展示所有下载
  选项。
- 否则，gateway 会根据当前安装偏好和主机二进制文件选择一个首选
  安装器：当启用了 `skills.install.preferBrew` 且存在 `brew` 时优先使用 Homebrew，然后是 `uv`，接着是
  `skills.install.nodeManager` 中配置的 node 管理器，之后才是
  `go` 或 `download` 等后备选项。
- Node 安装标签会反映已配置的 node 管理器，包括 `yarn`。

## 环境变量/API 密钥

- 应用将密钥存储在 `~/.openclaw/openclaw.json` 的 `skills.entries.<skillKey>` 下。
- `skills.update` 会修补 `enabled`、`apiKey` 和 `env`。

## 远程模式

- 安装和配置更新发生在 Gateway 网关主机上（而不是本地 Mac）。

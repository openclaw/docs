---
doc-schema-version: 1
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想在 ClawHub 上发布或列出自己的插件
summary: 查找并发布社区维护的 OpenClaw 插件
title: 社区插件
x-i18n:
    generated_at: "2026-07-05T11:29:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

社区插件是第三方包，可通过渠道、工具、提供商、钩子或其他能力扩展 OpenClaw。使用 [ClawHub](/clawhub) 作为发现公开社区插件的主要入口。

## 查找插件

从 CLI 搜索 ClawHub：

```bash
openclaw plugins search "calendar"
```

使用显式来源前缀安装 ClawHub 插件：

```bash
openclaw plugins install clawhub:<package-name>
```

在发布切换期间，npm 仍然是受支持的直接安装路径：

```bash
openclaw plugins install npm:<package-name>
```

常见的安装、更新、检查和卸载示例见 [管理插件](/zh-CN/plugins/manage-plugins)。完整命令参考和来源选择规则见 [`openclaw plugins`](/zh-CN/cli/plugins)。

## 发布插件

在 ClawHub 上发布公开社区插件，让 OpenClaw 用户可以发现并安装它们。ClawHub 负责实时包列表、发布历史、扫描状态和安装提示；文档不维护静态的第三方插件目录。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

发布前，请确保插件具有包元数据、插件清单、设置文档和明确的维护负责人。ClawHub 会在创建发布前验证所有者范围、包名、版本、文件限制和来源元数据，然后在评审和验证完成前，将新发布版本从常规安装和下载入口中隐藏。

发布前检查清单：

| 要求                 | 原因                                                |
| -------------------- | --------------------------------------------------- |
| 已发布到 ClawHub | 用户需要 `openclaw plugins install` 提示可用 |
| 公开 GitHub 仓库   | 源码评审、问题跟踪、透明度         |
| 设置和使用文档 | 用户需要知道如何配置它              |
| 活跃维护   | 近期更新或响应及时的问题处理         |

完整发布契约：

- [ClawHub 发布](/zh-CN/clawhub/publishing) - 所有者、范围、发布版本、评审、包验证和包转移
- [构建插件](/zh-CN/plugins/building-plugins) - 插件包形态和首次发布工作流
- [插件清单](/zh-CN/plugins/manifest) - 原生插件清单字段

## 相关

- [插件](/zh-CN/tools/plugin) - 安装、配置、重启和故障排查
- [管理插件](/zh-CN/plugins/manage-plugins) - 命令示例
- [ClawHub 发布](/zh-CN/clawhub/publishing) - 发布和发行规则

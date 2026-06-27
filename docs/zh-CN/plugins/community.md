---
doc-schema-version: 1
read_when:
    - 你想查找第三方 OpenClaw 插件
    - 你想在 ClawHub 上发布或列出你自己的插件
summary: 查找并发布社区维护的 OpenClaw 插件
title: 社区插件
x-i18n:
    generated_at: "2026-06-27T02:39:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

社区插件是第三方软件包，可通过渠道、工具、提供商、钩子或其他能力扩展 OpenClaw。将 [ClawHub](/zh-CN/clawhub) 作为公共社区插件的主要发现入口。

## 查找插件

从 CLI 搜索 ClawHub：

```bash
openclaw plugins search "calendar"
```

使用显式源前缀安装 ClawHub 插件：

```bash
openclaw plugins install clawhub:<package-name>
```

在发布切换期间，npm 仍然是受支持的直接安装路径：

```bash
openclaw plugins install npm:<package-name>
```

常见的安装、更新、检查和卸载示例请参阅 [管理插件](/zh-CN/plugins/manage-plugins)。完整命令参考和源选择规则请参阅 [`openclaw plugins`](/zh-CN/cli/plugins)。

## 发布插件

如果你希望 OpenClaw 用户发现并安装公共社区插件，请在 ClawHub 上发布。ClawHub 负责实时软件包列表、发布历史、扫描状态和安装提示；文档不会维护静态的第三方插件目录。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

发布前，请确保插件包含软件包元数据、插件清单、设置文档，以及明确的维护负责人。ClawHub 会先验证所有者范围、软件包名称、版本、文件限制和源元数据，然后创建发布；在审核和验证完成前，新发布会对常规安装和下载入口保持隐藏。

发布前请使用此检查清单：

| 要求                 | 原因                                                |
| -------------------- | --------------------------------------------------- |
| 已发布到 ClawHub     | 用户需要 `openclaw plugins install` 提示正常工作 |
| 公共 GitHub 仓库     | 源代码审查、问题跟踪、透明度                        |
| 设置和使用文档       | 用户需要知道如何配置它                              |
| 活跃维护             | 最近有更新，或能及时处理问题                        |

完整发布契约请参阅以下页面：

- [ClawHub 发布](/zh-CN/clawhub/publishing) 说明所有者、范围、发布、审核、软件包验证和软件包转让。
- [构建插件](/zh-CN/plugins/building-plugins) 展示插件软件包形态和首次发布工作流。
- [插件清单](/zh-CN/plugins/manifest) 定义原生插件清单字段。

## 相关

- [插件](/zh-CN/tools/plugin) - 安装、配置、重启和故障排除
- [管理插件](/zh-CN/plugins/manage-plugins) - 命令示例
- [ClawHub 发布](/zh-CN/clawhub/publishing) - 发布和版本规则

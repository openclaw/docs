---
read_when:
    - 你正在安装、配置或审计 opencode 插件
summary: 为 OpenClaw 添加 OpenCode 模型提供商和原生会话目录支持。
title: OpenCode 插件
x-i18n:
    generated_at: "2026-07-14T13:49:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 0a9a0b180b42ba26be21a95967a96d0012e7529076f38206c1442f77acb96647
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode 插件

为 OpenClaw 添加 OpenCode 模型提供商和原生会话目录支持。

## 分发

- 包：`@openclaw/opencode-provider`
- 安装方式：OpenClaw 已内置

## 功能范围

提供商：opencode；契约：mediaUnderstandingProviders；会话目录：opencode

## 原生会话

OpenClaw 会自动检测 Gateway 网关和已配对节点上的 `opencode` CLI。随后，已存储的会话会出现在会话侧边栏的 **OpenCode** 分组中，并可通过官方 `opencode --pure db ... --format json` 和 `opencode --pure export` 命令以只读方式浏览对话记录。受限环境和 `--pure` 模式可防止目录浏览加载项目插件或继承无关的 Gateway 网关凭据。

在 **Config > Plugins > OpenCode** 下关闭 **OpenCode Session Catalog** 可禁用发现功能。此功能默认启用。

## 相关文档

- [opencode](/zh-CN/providers/opencode)

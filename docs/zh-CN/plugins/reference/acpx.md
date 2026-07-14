---
read_when:
    - 你正在安装、配置或审计 acpx 插件
summary: 由插件管理会话和传输的 OpenClaw ACP 运行时后端。
title: ACPx 插件
x-i18n:
    generated_at: "2026-07-14T13:57:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c0e4333157a0519474e2be77a6cc1f86c1626769bc58fe752ad53eab3c1808f5
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# ACPx 插件

OpenClaw ACP 运行时后端，由插件管理会话和传输。

## 分发

- 软件包：`@openclaw/acpx`
- 安装方式：npm；ClawHub

## 功能范围

Skills；会话目录：pi

## Pi 原生会话

内置运行时会自动检测 Gateway 网关和已配对节点上的 Pi 会话存储。已存储的会话会显示在会话侧边栏的 **Pi** 分组中，并支持以只读方式浏览采用 Pi 文档所述 JSONL 会话格式的对话记录。该目录支持项目级和全局 `settings.json` 会话目录，以及 `PI_CODING_AGENT_DIR` 和 `PI_CODING_AGENT_SESSION_DIR`。相对路径以包含其 `settings.json` 文件的目录为基准进行解析。

在 **Config > Plugins > ACPX Runtime** 下关闭 **Pi Session Catalog** 即可禁用设备发现。此功能默认启用。

## 相关文档

- [acpx](/zh-CN/tools/acp-agents-setup)

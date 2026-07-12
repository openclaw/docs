---
read_when:
    - 你正在安装、配置或审计文件传输插件
summary: 通过专用节点命令在已配对的节点上获取、列出和写入文件。对于最大 16 MB 的二进制文件，通过 `node.invoke` 使用 base64，从而避免 bash 标准输出截断。
title: 文件传输插件
x-i18n:
    generated_at: "2026-07-11T20:47:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# 文件传输插件

通过专用节点命令，在已配对的节点上获取、列出和写入文件。对于不超过 16 MB 的二进制文件，通过在 `node.invoke` 上使用 base64，绕过 bash 标准输出截断限制。

## 分发

- 软件包：`@openclaw/file-transfer`
- 安装方式：随 OpenClaw 提供

## 接口

契约：工具

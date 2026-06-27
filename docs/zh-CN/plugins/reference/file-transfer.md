---
read_when:
    - 你正在安装、配置或审计文件传输插件
summary: 通过专用节点命令在配对节点上获取、列出和写入文件。通过在 `node.invoke` 上使用 `base64` 处理最大 16 MB 的二进制文件，绕过 `bash` `stdout` 截断。
title: 文件传输插件
x-i18n:
    generated_at: "2026-05-02T15:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 文件传输插件

通过专用节点命令在已配对节点上获取、列出和写入文件。通过对最大 16 MB 的二进制文件使用基于 `node.invoke` 的 base64，绕过 bash stdout 截断。

## 分发

- 包：`@openclaw/file-transfer`
- 安装路径：包含在 OpenClaw 中

## 接口面

contracts: tools

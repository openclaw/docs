---
read_when:
    - 你正在安裝、設定或稽核 file-transfer Plugin
summary: 透過專用的節點命令，在已配對的節點上擷取、列出並寫入檔案。透過 node.invoke 使用 base64，可繞過 bash stdout 截斷，支援最大 16 MB 的二進位檔。
title: 檔案傳輸 Plugin
x-i18n:
    generated_at: "2026-05-02T20:56:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# File Transfer Plugin

透過專用節點命令，在已配對的節點上擷取、列出及寫入檔案。對於最大 16 MB 的二進位檔，使用 node.invoke 透過 base64 傳輸，以避開 bash stdout 截斷。

## 發行

- 套件：`@openclaw/file-transfer`
- 安裝路徑：包含於 OpenClaw

## 介面

contracts: tools

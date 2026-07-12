---
read_when:
    - 您正在安裝、設定或稽核檔案傳輸外掛
summary: 透過專用節點命令，在已配對的節點上擷取、列出及寫入檔案。針對最大 16 MB 的二進位檔案，透過 node.invoke 使用 base64，以避開 bash 標準輸出截斷限制。
title: 檔案傳輸外掛
x-i18n:
    generated_at: "2026-07-11T21:36:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# 檔案傳輸外掛

透過專用節點命令，在已配對的節點上擷取、列出及寫入檔案。對於最大 16 MB 的二進位檔案，使用透過 node.invoke 傳送的 base64，以避開 bash 標準輸出截斷限制。

## 發行方式

- 套件：`@openclaw/file-transfer`
- 安裝途徑：隨 OpenClaw 提供

## 介面

合約：工具

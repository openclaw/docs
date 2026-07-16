---
read_when:
    - 你正在安裝、設定或稽核檔案傳輸外掛
summary: 透過專用節點命令，在已配對的節點上擷取、列出及寫入檔案。針對最大 16 MB 的二進位檔案，透過 node.invoke 使用 base64，以避開 bash 標準輸出截斷限制。
title: 檔案傳輸外掛
x-i18n:
    generated_at: "2026-07-16T11:51:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f76e92a821be53e988011e2fd9dd53b107b43a8191bf4cdf41baaf918a9c5412
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# 檔案傳輸外掛

透過專用節點命令，在已配對的節點上擷取、列出及寫入檔案。針對最大 16 MB 的二進位檔案，使用透過 node.invoke 傳送的 base64，以避開 bash 標準輸出截斷限制。

## 發布方式

- 套件：`@openclaw/file-transfer`
- 安裝方式：隨附於 OpenClaw

## 介面

合約：`tools`

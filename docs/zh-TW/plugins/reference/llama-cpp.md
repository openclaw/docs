---
read_when:
    - 你正在安裝、設定或稽核 llama-cpp 外掛
summary: 透過 node-llama-cpp 在本機進行 GGUF 文字推論與嵌入。
title: Llama Cpp 外掛
x-i18n:
    generated_at: "2026-07-19T13:54:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2756d4b3e00bbe37b4dedec1d54d28bfe6662e8105504317a402293254ce0240
    source_path: plugins/reference/llama-cpp.md
    workflow: 16
---

# Llama Cpp 外掛

透過 node-llama-cpp 進行本機 GGUF 文字推論與嵌入。

## 發行方式

- 套件：`@openclaw/llama-cpp-provider`
- 安裝途徑：npm；ClawHub

## 介面

提供者：`llama-cpp`；合約：`embeddingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## 預設文字模型

在互動式設定期間，OpenClaw 會提供 Gemma 4 E4B IT Q4_K_M，作為約 5.0 GB 的隨附下載項目。此下載選項要求總 RAM 至少為 16 GiB。在記憶體較小的機器上，仍會偵測到現有的快取模型。

若要使用其他模型，請將 `params.modelPath` 設為任何自訂 GGUF。自訂模型不受隨附下載項目的 RAM 要求限制。在未達此要求的機器上，你也可以透過 Ollama 或 LM Studio 執行較小的模型，或選擇雲端提供者。

<!-- openclaw-plugin-reference:manual-end -->

## 相關文件

- [llama-cpp](/zh-TW/plugins/llama-cpp)

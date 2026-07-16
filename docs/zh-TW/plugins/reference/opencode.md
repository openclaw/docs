---
read_when:
    - 你正在安裝、設定或稽核 opencode 外掛
summary: 新增 OpenCode 模型提供者對 OpenClaw 的支援。
title: OpenCode 外掛
x-i18n:
    generated_at: "2026-07-16T11:50:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode 外掛

新增 OpenCode 模型供應商對 OpenClaw 的支援。

## 發布

- 套件：`@openclaw/opencode-provider`
- 安裝方式：隨附於 OpenClaw

## 介面

供應商：`opencode`；合約：`mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## 原生工作階段

OpenClaw 會在閘道與已配對的節點上自動偵測 `opencode` 命令列介面。儲存的工作階段隨後會顯示在 **OpenCode** 工作階段側邊欄群組中，並可透過官方的 `opencode --pure db ... --format json` 與 `opencode --pure export` 命令，以唯讀方式瀏覽逐字稿。受限環境與 `--pure` 模式可防止瀏覽目錄時載入專案外掛，或繼承不相關的閘道認證資訊。

若要停用探索功能，請在 **設定 > 外掛 > OpenCode** 下關閉 **OpenCode 工作階段目錄**。此功能預設為啟用。

<!-- openclaw-plugin-reference:manual-end -->

## 相關文件

- [opencode](/zh-TW/providers/opencode)

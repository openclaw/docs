---
read_when:
    - 新增核心功能與外掛註冊介面
    - 判斷程式碼應歸屬於核心、供應商外掛或功能外掛
    - 為頻道或工具接入新的執行階段輔助函式
sidebarTitle: Adding capabilities
summary: 為 OpenClaw 外掛系統新增共享功能的貢獻者指南
title: 新增功能（貢獻者指南）
x-i18n:
    generated_at: "2026-07-11T21:31:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  這是供 OpenClaw 核心開發者使用的**貢獻者指南**。如果你正在
  建置外部外掛，請改為參閱[建置外掛](/zh-TW/plugins/building-plugins)。
  如需深入的架構參考（能力模型、所有權、
  載入管線、執行階段輔助函式），請參閱[外掛內部架構](/zh-TW/plugins/architecture)。
</Info>

當 OpenClaw 需要新的共用領域時，例如嵌入、影像生成、
影片生成，或未來由供應商支援的功能領域，請使用此方法。

規則如下：

- **外掛** = 所有權邊界
- **能力** = 共用核心契約

請勿將供應商直接接入頻道或工具。請先定義能力。

## 何時建立能力

只有在以下條件**全都**成立時，才建立新能力：

1. 可能有多個供應商實作該能力。
2. 頻道、工具或功能外掛應能在不需要關注供應商的情況下使用該能力。
3. 核心需要負責備援、原則、設定或傳遞行為。

如果工作僅適用於特定供應商，且尚未有共用契約，請先定義契約。

## 標準順序

1. 定義具型別的核心契約。
2. 為該契約新增外掛註冊機制。
3. 新增共用執行階段輔助函式。
4. 接入一個實際的供應商外掛作為驗證。
5. 將功能／頻道使用端移至執行階段輔助函式。
6. 新增契約測試。
7. 記錄面向操作者的設定與所有權模型。

## 各層的職責

| 層級                      | 負責項目                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **核心**                   | 請求／回應型別；提供者登錄與解析；備援行為；設定結構描述，並在巢狀物件、萬用字元、陣列項目與組合節點上傳遞 `title`／`description` 文件中繼資料；執行階段輔助函式介面。 |
| **供應商外掛**          | 供應商 API 呼叫、供應商驗證處理、供應商特定的請求正規化，以及能力實作的註冊。                                                                                                     |
| **功能／頻道外掛** | 呼叫 `api.runtime.*` 或相符的 `plugin-sdk/*-runtime` 輔助函式。絕不直接呼叫供應商實作。                                                                                                                    |

## 提供者與代理執行框架接合點

當行為屬於模型提供者契約，而非通用代理迴圈時，請使用**提供者掛鉤**。例如：選定傳輸方式後的提供者特定請求參數、驗證設定檔偏好、提示詞覆加，以及模型／設定檔容錯移轉後的後續備援路由。

當行為屬於正在執行某次互動的執行階段時，請使用**代理執行框架掛鉤**。執行框架可對明確的協定結果進行分類，例如空白輸出、只有推理而沒有可見輸出，或只有結構化計畫而沒有最終答案，讓外層模型備援原則能決定是否重試。

請維持兩種接合點的精簡：

- 核心負責重試／備援原則。
- 提供者外掛負責提供者特定的請求／驗證／路由提示。
- 執行框架外掛負責執行階段特定的嘗試結果分類。
- 第三方外掛應回傳提示，而非直接修改核心狀態。

## 檔案檢查清單

建立新能力時，預期需要修改以下區域：

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- 一個或多個隨附的外掛套件。
- 設定、文件、測試。

## 實作範例：影像生成

影像生成遵循標準結構：

1. 核心定義 `ImageGenerationProvider`。
2. 核心公開 `registerImageGenerationProvider(...)`。
3. 核心公開 `api.runtime.imageGeneration.generate(...)` 與 `.listProviders(...)`。
4. 供應商外掛（`comfy`、`deepinfra`、`fal`、`google`、`litellm`、`microsoft-foundry`、`minimax`、`openai`、`openrouter`、`vydra`、`xai`）註冊由供應商支援的實作。
5. 未來的供應商可註冊相同契約，而不需要變更頻道／工具。

此設定鍵刻意與視覺分析路由分開：

- `agents.defaults.imageModel` 用於分析影像。
- `agents.defaults.imageGenerationModel` 用於生成影像。

請保持兩者分離，使備援與原則維持明確。

## 嵌入提供者

請使用 `registerEmbeddingProvider(...)`／契約 `embeddingProviders` 來提供
可重複使用的向量嵌入提供者。此契約刻意設計得比記憶功能更廣泛：
工具、搜尋、檢索、匯入程式或未來的功能外掛
都能使用嵌入，而不必依賴記憶引擎。記憶搜尋
也會使用通用的 `embeddingProviders`。

較舊的記憶功能專用註冊 API 與 `memoryEmbeddingProviders`
契約已棄用。所有新的嵌入提供者都應使用 `registerEmbeddingProvider` 與
`embeddingProviders`。

## 審查檢查清單

在發布新能力之前，請確認：

- 沒有頻道／工具直接匯入供應商程式碼。
- 執行階段輔助函式是共用路徑。
- 至少有一項契約測試驗證隨附元件的所有權。
- 設定文件列出新的模型／設定鍵。
- 外掛文件說明所有權邊界。

如果某個 PR 跳過能力層，並將供應商行為硬編碼至頻道／工具中，請退回該 PR，並先定義契約。

## 相關內容

- [外掛內部架構](/zh-TW/plugins/architecture) — 能力模型、所有權、載入管線、執行階段輔助函式。
- [建置外掛](/zh-TW/plugins/building-plugins) — 第一個外掛教學。
- [SDK 概覽](/zh-TW/plugins/sdk-overview) — 匯入對應表與註冊 API 參考。
- [建立 Skills](/zh-TW/tools/creating-skills) — 配套的貢獻者介面。

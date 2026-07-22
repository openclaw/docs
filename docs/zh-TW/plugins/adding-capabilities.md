---
read_when:
    - 新增核心功能與外掛註冊介面
    - 判斷程式碼應歸屬於核心、供應商外掛或功能外掛
    - 為頻道或工具接入新的執行階段輔助函式
sidebarTitle: Adding capabilities
summary: 為 OpenClaw 外掛系統新增共用功能的貢獻者指南
title: 新增功能（貢獻者指南）
x-i18n:
    generated_at: "2026-07-22T10:39:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 14f86c98eb10c6e92970d1b65009ac7bb103afcb6bc57bad2c39e59bc038c961
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  這是供 OpenClaw 核心開發者使用的**貢獻者指南**。如果你要
  建置外部外掛，請改參閱[建置外掛](/zh-TW/plugins/building-plugins)。
  如需深入的架構參考（能力模型、所有權、載入
  流水線、執行階段輔助函式），請參閱[外掛內部架構](/zh-TW/plugins/architecture)。
</Info>

當 OpenClaw 需要新的共享領域時（例如嵌入、圖片
生成、影片生成，或未來由供應商支援的其他功能領域），請採用此方式。

規則：

- **外掛** = 所有權邊界
- **能力** = 共享核心合約

不要將供應商直接接入頻道或工具。請先定義能力。

## 何時建立能力

只有在下列條件**全部**成立時，才建立新能力：

1. 可能有多個供應商能合理地實作它。
2. 頻道、工具或功能外掛應能使用它，而不必在意供應商為何。
3. 核心需要擁有備援、政策、設定或傳遞行為。

如果這項工作僅屬於供應商，且尚無共享合約，請先定義合約。

## 標準順序

1. 定義具型別的核心合約。
2. 為該合約新增外掛註冊機制。
3. 新增共享執行階段輔助函式。
4. 接入一個實際的供應商外掛作為驗證。
5. 將功能／頻道使用端移至執行階段輔助函式。
6. 新增合約測試。
7. 記錄面向操作者的設定與所有權模型。

## 各層的職責

| 層                         | 負責                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **核心**                   | 請求／回應型別；提供者登錄與解析；備援行為；設定結構描述，以及在巢狀物件、萬用字元、陣列項目和組合節點上傳遞的 `title`/`description` 文件中繼資料；執行階段輔助函式介面。 |
| **供應商外掛**             | 供應商 API 呼叫、供應商驗證處理、供應商特定的請求正規化，以及能力實作的註冊。                                                                                                     |
| **功能／頻道外掛**         | 呼叫 `api.runtime.*` 或對應的 `plugin-sdk/*-runtime` 輔助函式。絕不直接呼叫供應商實作。                                                                                                                    |

## 提供者與代理程式執行框架接點

當行為屬於模型提供者合約，而非通用代理程式迴圈時，請使用**提供者鉤子**。例如，在選定傳輸方式後加入提供者特定的請求參數、驗證設定檔偏好、提示詞覆加，以及模型／設定檔容錯移轉後的後續備援路由。

當行為屬於正在執行某一輪次的執行階段時，請使用**代理程式執行框架鉤子**。執行框架可以分類明確的通訊協定結果，例如空白輸出、只有推理而沒有可見輸出，或只有結構化計畫而沒有最終答案，讓外層模型備援政策決定是否重試。

兩種接點都應維持精簡：

- 核心擁有重試／備援政策。
- 提供者外掛擁有提供者特定的請求／驗證／路由提示。
- 執行框架外掛擁有執行階段特定的嘗試分類。
- 第三方外掛回傳提示，而不直接變更核心狀態。

## 檔案檢查清單

新增能力時，預期會觸及下列區域：

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

## 實作範例：圖片生成

圖片生成遵循標準結構：

1. 核心定義 `ImageGenerationProvider`。
2. 核心公開 `registerImageGenerationProvider(...)`。
3. 核心公開 `api.runtime.imageGeneration.generate(...)` 和 `.listProviders(...)`。
4. 供應商外掛（`comfy`、`deepinfra`、`fal`、`google`、`litellm`、`microsoft-foundry`、`minimax`、`openai`、`openrouter`、`vydra`、`xai`）註冊由供應商支援的實作。
5. 未來的供應商可註冊相同合約，而不必變更頻道／工具。

此設定鍵刻意與視覺分析路由分開：

- `agents.defaults.imageModel` 分析圖片。
- `agents.defaults.mediaModels.image` 生成圖片。

請將兩者分開，以便明確保留備援與政策。

## 嵌入提供者

可重複使用的向量嵌入提供者應使用 `registerEmbeddingProvider(...)`／合約 `embeddingProviders`。
此合約刻意涵蓋比記憶更廣的範圍：工具、搜尋、檢索、匯入程式或未來的功能外掛，
都能使用嵌入，而不必依賴記憶引擎。記憶搜尋
也會使用通用的 `embeddingProviders`。

較舊的記憶專用註冊 API 和 `memoryEmbeddingProviders`
合約已棄用。所有新的嵌入提供者都應使用 `registerEmbeddingProvider`
和 `embeddingProviders`。

## 審查檢查清單

發布新能力前，請確認：

- 沒有任何頻道／工具直接匯入供應商程式碼。
- 執行階段輔助函式是共享路徑。
- 至少有一項合約測試會驗證隨附所有權。
- 設定文件列出新的模型／設定鍵。
- 外掛文件說明所有權邊界。

如果 PR 略過能力層，並將供應商行為硬編碼至頻道／工具中，請退回該 PR 並先定義合約。

## 相關內容

- [外掛內部架構](/zh-TW/plugins/architecture) — 能力模型、所有權、載入流水線、執行階段輔助函式。
- [建置外掛](/zh-TW/plugins/building-plugins) — 第一個外掛教學。
- [SDK 概覽](/zh-TW/plugins/sdk-overview) — 匯入對應表與註冊 API 參考。
- [建立 Skills](/zh-TW/tools/creating-skills) — 配套的貢獻者介面。

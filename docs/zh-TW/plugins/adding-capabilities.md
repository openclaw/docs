---
read_when:
    - 新增核心功能與外掛註冊介面
    - 決定程式碼應屬於核心、供應商外掛或功能外掛
    - 為頻道或工具接入新的執行階段輔助工具
sidebarTitle: Adding capabilities
summary: 為 OpenClaw 外掛系統新增共享能力的貢獻者指南
title: 新增能力（貢獻者指南）
x-i18n:
    generated_at: "2026-07-05T11:33:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  這是 OpenClaw 核心開發者的**貢獻者指南**。如果你正在
  建置外部外掛，請改參閱[建置外掛](/zh-TW/plugins/building-plugins)。
  如需深入的架構參考（能力模型、所有權、載入管線、執行階段輔助工具），
  請參閱[外掛內部架構](/zh-TW/plugins/architecture)。
</Info>

當 OpenClaw 需要新的共享領域，例如嵌入、影像生成、影片生成，或未來某個由供應商支援的功能領域時，請使用這份指南。

規則：

- **外掛** = 所有權邊界
- **能力** = 共享核心合約

不要將供應商直接接到通道或工具。先定義能力。

## 何時建立能力

只有在**全部**條件都成立時，才建立新的能力：

1. 合理上可能有超過一個供應商實作它。
2. 通道、工具或功能外掛應該能使用它，而不必關心供應商。
3. 核心需要擁有備援、政策、設定或交付行為。

如果工作只屬於供應商，而且還沒有共享合約，請先定義合約。

## 標準順序

1. 定義型別化的核心合約。
2. 為該合約新增外掛註冊。
3. 新增共享的執行階段輔助工具。
4. 接上一個真正的供應商外掛作為證明。
5. 將功能/通道消費者移到執行階段輔助工具上。
6. 新增合約測試。
7. 記錄面向操作者的設定與所有權模型。

## 什麼放在哪裡

| 層級                       | 擁有                                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **核心**                   | 請求/回應型別；提供者登錄與解析；備援行為；設定結構描述，並在巢狀物件、萬用字元、陣列項目與組合節點上傳遞 `title`/`description` 文件中繼資料；執行階段輔助工具介面。 |
| **供應商外掛**             | 供應商 API 呼叫、供應商驗證處理、供應商特定的請求正規化，以及能力實作的註冊。                                                                                                     |
| **功能/通道外掛**          | 呼叫 `api.runtime.*` 或相符的 `plugin-sdk/*-runtime` 輔助工具。絕不直接呼叫供應商實作。                                                                                                                    |

## 提供者與測試框架接縫

當行為屬於模型提供者合約，而不是通用代理程式迴圈時，請使用**提供者鉤子**。範例包括傳輸選擇後的提供者特定請求參數、驗證設定檔偏好、提示覆寫，以及模型/設定檔容錯移轉後的後續備援路由。

當行為屬於正在執行回合的執行階段時，請使用**代理程式測試框架鉤子**。測試框架可以分類明確的協定結果，例如空輸出、有推理但沒有可見輸出，或沒有最終答案的結構化計畫，讓外層模型備援政策能做出重試決策。

讓兩個接縫都保持狹窄：

- 核心擁有重試/備援政策。
- 提供者外掛擁有提供者特定的請求/驗證/路由提示。
- 測試框架外掛擁有執行階段特定的嘗試分類。
- 第三方外掛回傳提示，而不是直接改動核心狀態。

## 檔案檢查清單

對於新的能力，預期會碰到這些區域：

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
- 一個或多個 bundled 外掛套件。
- 設定、文件、測試。

## 實作範例：影像生成

影像生成遵循標準形狀：

1. 核心定義 `ImageGenerationProvider`。
2. 核心公開 `registerImageGenerationProvider(...)`。
3. 核心公開 `api.runtime.imageGeneration.generate(...)` 與 `.listProviders(...)`。
4. 供應商外掛（`comfy`、`deepinfra`、`fal`、`google`、`litellm`、`microsoft-foundry`、`minimax`、`openai`、`openrouter`、`vydra`、`xai`）註冊由供應商支援的實作。
5. 未來的供應商註冊相同合約，而不需要變更通道/工具。

設定鍵刻意與視覺分析路由分開：

- `agents.defaults.imageModel` 分析影像。
- `agents.defaults.imageGenerationModel` 生成影像。

保持兩者分離，讓備援與政策維持明確。

## 嵌入提供者

使用 `registerEmbeddingProvider(...)` / 合約 `embeddingProviders` 來提供可重用的向量嵌入提供者。這個合約刻意比記憶更廣：工具、搜尋、檢索、匯入器或未來的功能外掛，都可以使用嵌入，而不必依賴記憶引擎。記憶搜尋也會使用通用的 `embeddingProviders`。

較舊的記憶專用註冊 API 與 `memoryEmbeddingProviders` 合約已淘汰。所有新的嵌入提供者都請使用 `registerEmbeddingProvider` 與 `embeddingProviders`。

## 審查檢查清單

在發布新能力之前，請確認：

- 沒有通道/工具直接匯入供應商程式碼。
- 執行階段輔助工具是共享路徑。
- 至少有一個合約測試宣告 bundled 所有權。
- 設定文件命名新的模型/設定鍵。
- 外掛文件說明所有權邊界。

如果 PR 跳過能力層，並將供應商行為硬編碼到通道/工具中，請退回並先定義合約。

## 相關

- [外掛內部架構](/zh-TW/plugins/architecture) — 能力模型、所有權、載入管線、執行階段輔助工具。
- [建置外掛](/zh-TW/plugins/building-plugins) — 第一個外掛教學。
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 匯入對應與註冊 API 參考。
- [建立 Skills](/zh-TW/tools/creating-skills) — 配套的貢獻者介面。

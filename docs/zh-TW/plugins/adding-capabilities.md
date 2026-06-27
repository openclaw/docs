---
read_when:
    - 新增核心能力與外掛註冊介面
    - 判斷程式碼應屬於核心、供應商外掛，還是功能外掛
    - 為頻道或工具接上新的執行階段輔助函式
sidebarTitle: Adding capabilities
summary: 將新的共用能力新增至 OpenClaw 外掛系統的貢獻者指南
title: 新增功能（貢獻者指南）
x-i18n:
    generated_at: "2026-06-27T19:33:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8a25122a7b76ff5bbb7616748d5fad2397502f9accb5428134a75d65e872034
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  這是給 OpenClaw 核心開發者的**貢獻者指南**。如果你正在
  建置外部外掛，請改看[建置外掛](/zh-TW/plugins/building-plugins)。
  如需深入的架構參考（能力模型、所有權、載入管線、執行階段輔助工具），請看[外掛內部架構](/zh-TW/plugins/architecture)。
</Info>

當 OpenClaw 需要新的共用領域時使用本指南，例如嵌入、圖片
生成、影片生成，或未來由廠商支援的功能領域。

規則：

- **外掛** = 所有權邊界
- **能力** = 共用核心合約

不要一開始就把廠商直接接到頻道或工具。請先定義能力。

## 何時建立能力

當**全部**條件都成立時，建立新的能力：

1. 合理來說可能有多個廠商能實作它。
2. 頻道、工具或功能外掛應該能使用它，而不需要在意廠商。
3. 核心需要擁有後援、政策、設定或交付行為。

如果工作只屬於單一廠商，且尚未存在共用合約，請先停下來定義合約。

## 標準順序

1. 定義型別化的核心合約。
2. 為該合約加入外掛註冊。
3. 加入共用執行階段輔助工具。
4. 接上一個真實廠商外掛作為證明。
5. 將功能/頻道使用端移到執行階段輔助工具。
6. 加入合約測試。
7. 記錄面向操作員的設定與所有權模型。

## 什麼放在哪裡

**核心：**

- 請求/回應型別。
- 供應者登錄檔 + 解析。
- 後援行為。
- 設定結構描述，並在巢狀物件、萬用字元、陣列項目與組合節點上傳遞 `title` / `description` 文件中繼資料。
- 執行階段輔助工具介面。

**廠商外掛：**

- 廠商 API 呼叫。
- 廠商驗證處理。
- 廠商特定的請求正規化。
- 能力實作的註冊。

**功能/頻道外掛：**

- 呼叫 `api.runtime.*` 或對應的 `plugin-sdk/*-runtime` 輔助工具。
- 絕不直接呼叫廠商實作。

## 供應者與執行框架接縫

當行為屬於模型供應者合約，而不是通用代理程式迴圈時，使用**供應者掛鉤**。範例包括傳輸選擇後的供應者特定請求參數、驗證設定檔偏好、提示覆蓋，以及模型/設定檔容錯移轉後的後續後援路由。

當行為屬於正在執行一次回合的執行階段時，使用**代理程式執行框架掛鉤**。執行框架可以分類明確的協定結果，例如空輸出、沒有可見輸出的推理，或沒有最終答案的結構化計畫，讓外層模型後援政策能做出重試決策。

保持這兩個接縫狹窄：

- 核心擁有重試/後援政策。
- 供應者外掛擁有供應者特定的請求/驗證/路由提示。
- 執行框架外掛擁有執行階段特定的嘗試分類。
- 第三方外掛回傳提示，而不是直接變更核心狀態。

## 檔案檢查清單

若要新增能力，預期會碰到這些區域：

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
- 一個或多個內建外掛套件。
- 設定、文件、測試。

## 實作範例：圖片生成

圖片生成遵循標準形狀：

1. 核心定義 `ImageGenerationProvider`。
2. 核心公開 `registerImageGenerationProvider(...)`。
3. 核心公開 `runtime.imageGeneration.generate(...)`。
4. `openai`、`google`、`fal` 和 `minimax` 外掛註冊由廠商支援的實作。
5. 未來廠商註冊相同合約，而不需要變更頻道/工具。

設定鍵刻意與視覺分析路由分開：

- `agents.defaults.imageModel` 分析圖片。
- `agents.defaults.imageGenerationModel` 生成圖片。

保持兩者分離，讓後援與政策維持明確。

## 嵌入供應者

使用 `embeddingProviders` 作為可重複使用的向量嵌入供應者。這個合約
刻意比記憶更廣：工具、搜尋、檢索、匯入器或未來的功能外掛
都可以使用嵌入，而不依賴記憶引擎。

記憶搜尋可以使用通用的 `embeddingProviders`。較舊的
`memoryEmbeddingProviders` 合約是已棄用的相容性層，供現有
記憶特定供應者遷移使用；新的可重複使用嵌入供應者應使用
`embeddingProviders`。

## 審查檢查清單

在發布新的能力前，請確認：

- 沒有頻道/工具直接匯入廠商程式碼。
- 執行階段輔助工具是共用路徑。
- 至少有一個合約測試斷言內建所有權。
- 設定文件命名新的模型/設定鍵。
- 外掛文件說明所有權邊界。

如果 PR 跳過能力層，並將廠商行為硬編碼到頻道/工具中，請退回並先定義合約。

## 相關

- [外掛內部架構](/zh-TW/plugins/architecture) — 能力模型、所有權、載入管線、執行階段輔助工具。
- [建置外掛](/zh-TW/plugins/building-plugins) — 第一個外掛教學。
- [SDK 概覽](/zh-TW/plugins/sdk-overview) — 匯入對應與註冊 API 參考。
- [建立 Skills](/zh-TW/tools/creating-skills) — 配套的貢獻者介面。

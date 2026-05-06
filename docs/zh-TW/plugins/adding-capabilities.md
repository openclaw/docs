---
read_when:
    - 新增核心能力與 Plugin 註冊介面
    - 判斷程式碼應屬於核心、供應商 Plugin，或功能 Plugin
    - 為通道或工具接入新的執行階段輔助程式
sidebarTitle: Adding capabilities
summary: 為 OpenClaw Plugin 系統新增共用能力的貢獻者指南
title: 新增能力（貢獻者指南）
x-i18n:
    generated_at: "2026-05-06T02:53:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  這是給 OpenClaw 核心開發者的**貢獻者指南**。如果你正在
  建置外部 Plugin，請改參閱[建置 plugins](/zh-TW/plugins/building-plugins)。
  如需深入的架構參考（能力模型、所有權、載入管線、執行階段輔助工具），請參閱 [Plugin 內部架構](/zh-TW/plugins/architecture)。
</Info>

當 OpenClaw 需要新的共享領域時使用此指南，例如影像生成、影片生成，或未來某個由供應商支援的功能領域。

規則：

- **plugin** = 所有權邊界
- **capability** = 共享核心契約

不要一開始就把供應商直接接到通道或工具中。先從定義能力開始。

## 何時建立 capability

當以下條件**全部**成立時，建立新的 capability：

1. 可能有不只一個供應商可實作它。
2. 通道、工具或功能 plugins 應該能使用它，而不需要在意供應商。
3. 核心需要擁有 fallback、政策、設定或交付行為。

如果工作只屬於單一供應商，且尚未有共享契約，請停下來先定義契約。

## 標準順序

1. 定義具型別的核心契約。
2. 為該契約加入 plugin 註冊。
3. 加入共享執行階段輔助工具。
4. 接上一個真實供應商 plugin 作為證明。
5. 將功能/通道消費端移到執行階段輔助工具上。
6. 加入契約測試。
7. 記錄面向操作員的設定與所有權模型。

## 內容放在哪裡

**核心：**

- 請求/回應型別。
- 提供者登錄 + 解析。
- Fallback 行為。
- 設定 schema，並在巢狀物件、萬用字元、陣列項目與組合節點上傳播 `title` / `description` 文件中繼資料。
- 執行階段輔助工具介面。

**供應商 plugin：**

- 供應商 API 呼叫。
- 供應商驗證處理。
- 供應商特定的請求正規化。
- capability 實作的註冊。

**功能/通道 plugin：**

- 呼叫 `api.runtime.*` 或相符的 `plugin-sdk/*-runtime` 輔助工具。
- 絕不直接呼叫供應商實作。

## 提供者與 harness seam

當行為屬於模型提供者契約，而不是通用 agent 迴圈時，使用**提供者 hooks**。範例包括傳輸選擇後的提供者特定請求參數、驗證設定檔偏好、提示覆蓋，以及模型/設定檔 failover 後的後續 fallback 路由。

當行為屬於正在執行一個 turn 的執行階段時，使用 **agent harness hooks**。Harnesses 可以分類成功但不可用的嘗試結果，例如空白、僅推理或僅規劃的回應，讓外層模型 fallback 政策能做出重試決策。

讓兩種 seam 都保持狹窄：

- 核心擁有重試/fallback 政策。
- 提供者 plugins 擁有提供者特定的請求/驗證/路由提示。
- Harness plugins 擁有執行階段特定的嘗試分類。
- 第三方 plugins 回傳提示，而不是直接變更核心狀態。

## 檔案檢查清單

對於新的 capability，預期會碰到這些區域：

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
- 一個或多個 bundled plugin 套件。
- 設定、文件、測試。

## 實作範例：影像生成

影像生成遵循標準形狀：

1. 核心定義 `ImageGenerationProvider`。
2. 核心公開 `registerImageGenerationProvider(...)`。
3. 核心公開 `runtime.imageGeneration.generate(...)`。
4. `openai`、`google`、`fal` 和 `minimax` plugins 註冊由供應商支援的實作。
5. 未來的供應商註冊相同契約，而不需要變更通道/工具。

設定鍵刻意與視覺分析路由分開：

- `agents.defaults.imageModel` 分析影像。
- `agents.defaults.imageGenerationModel` 生成影像。

讓它們保持分離，這樣 fallback 與政策才能維持明確。

## Review 檢查清單

在發布新的 capability 前，請確認：

- 沒有通道/工具直接匯入供應商程式碼。
- 執行階段輔助工具是共享路徑。
- 至少有一個契約測試會斷言 bundled 所有權。
- 設定文件命名新的模型/設定鍵。
- Plugin 文件說明所有權邊界。

如果 PR 跳過 capability 層，並將供應商行為硬編碼到通道/工具中，請退回並先定義契約。

## 相關

- [Plugin 內部架構](/zh-TW/plugins/architecture) — capability 模型、所有權、載入管線、執行階段輔助工具。
- [建置 plugins](/zh-TW/plugins/building-plugins) — 第一個 plugin 教學。
- [SDK 概覽](/zh-TW/plugins/sdk-overview) — import map 與註冊 API 參考。
- [建立 Skills](/zh-TW/tools/creating-skills) — 配套的貢獻者介面。

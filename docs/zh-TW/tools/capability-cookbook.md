---
read_when:
    - 新增核心能力與 Plugin 註冊介面
    - 判斷程式碼應屬於核心、供應商 Plugin，還是功能 Plugin
    - 為頻道或工具接入新的執行階段輔助程式
sidebarTitle: Adding Capabilities
summary: 將新的共享能力加入 OpenClaw Plugin 系統的貢獻者指南
title: 新增能力（貢獻者指南）
x-i18n:
    generated_at: "2026-04-30T03:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 16
---

<Info>
  這是供 OpenClaw 核心開發者使用的**貢獻者指南**。如果你正在
  建置外部 Plugin，請改參閱[建置 Plugins](/zh-TW/plugins/building-plugins)。
</Info>

當 OpenClaw 需要新的領域時使用此指南，例如圖片生成、影片
生成，或未來某個由供應商支援的功能領域。

規則如下：

- Plugin = 擁有權邊界
- 能力 = 共用核心合約

這表示你不應該一開始就把供應商直接接到頻道或
工具中。請先定義能力。

## 何時建立能力

當以下條件全部成立時，建立新的能力：

1. 合理來說，可能會有多個供應商實作它
2. 頻道、工具或功能 Plugins 應該能使用它，而不需要關心
   供應商
3. 核心需要擁有後援、政策、設定或交付行為

如果工作僅限供應商，而且尚未有共用合約，請先停下來定義
合約。

## 標準順序

1. 定義型別化的核心合約。
2. 為該合約加入 Plugin 註冊。
3. 加入共用 runtime 輔助工具。
4. 接入一個真實的供應商 Plugin 作為證明。
5. 將功能/頻道消費者移到 runtime 輔助工具上。
6. 加入合約測試。
7. 記錄面向操作者的設定與擁有權模型。

## 哪些內容放在哪裡

核心：

- 請求/回應型別
- provider registry + 解析
- 後援行為
- 設定 schema，以及傳播到巢狀物件、萬用字元、陣列項目和組合節點上的 `title` / `description` 文件中繼資料
- runtime 輔助工具介面

供應商 Plugin：

- 供應商 API 呼叫
- 供應商驗證處理
- 供應商特定的請求正規化
- 能力實作的註冊

功能/頻道 Plugin：

- 呼叫 `api.runtime.*` 或相符的 `plugin-sdk/*-runtime` 輔助工具
- 絕不直接呼叫供應商實作

## Provider 與 harness 接縫

當行為屬於模型 provider 合約，而不是通用 agent 迴圈時，使用 provider hooks。
範例包括傳輸選擇後的 provider 特定請求參數、auth-profile 偏好設定、提示詞覆蓋，以及模型/profile 容錯移轉後的後續後援路由。

當行為屬於正在執行回合的 runtime 時，使用 agent harness hooks。Harnesses 可以分類成功但不可用的嘗試結果，例如空白、僅推理或僅規劃回應，讓外層模型後援政策可以做出重試決策。

讓兩個接縫都保持狹窄：

- 核心擁有重試/後援政策
- provider plugins 擁有 provider 特定的請求/驗證/路由提示
- harness plugins 擁有 runtime 特定的嘗試分類
- 第三方 Plugins 回傳提示，而不是直接變更核心狀態

## 檔案檢查清單

對於新能力，預期會觸及這些區域：

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
- 一個或多個內建 Plugin 套件
- 設定/文件/測試

## 範例：圖片生成

圖片生成遵循標準形狀：

1. 核心定義 `ImageGenerationProvider`
2. 核心公開 `registerImageGenerationProvider(...)`
3. 核心公開 `runtime.imageGeneration.generate(...)`
4. `openai`、`google`、`fal` 和 `minimax` Plugins 註冊由供應商支援的實作
5. 未來的供應商可以註冊相同合約，而不需要變更頻道/工具

設定鍵與視覺分析路由分開：

- `agents.defaults.imageModel` = 分析圖片
- `agents.defaults.imageGenerationModel` = 生成圖片

保持兩者分離，讓後援與政策維持明確。

## 審查檢查清單

在發布新能力之前，請確認：

- 沒有頻道/工具直接匯入供應商程式碼
- runtime 輔助工具是共用路徑
- 至少一項合約測試會斷言內建擁有權
- 設定文件命名新的模型/設定鍵
- Plugin 文件說明擁有權邊界

如果 PR 略過能力層，並將供應商行為硬編碼到
頻道/工具中，請退回並先定義合約。

## 相關

- [Plugin](/zh-TW/tools/plugin)
- [建立 skills](/zh-TW/tools/creating-skills)
- [工具與 plugins](/zh-TW/tools)

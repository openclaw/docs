---
read_when:
    - 規劃一輪大範圍的 OpenClaw 應用程式現代化改造
    - 更新應用程式或 Control UI 工作的前端實作標準
    - 將廣泛的產品品質審查轉化為分階段的工程工作
summary: 全面的應用程式現代化計畫與前端交付技能更新
title: 應用程式現代化計畫
x-i18n:
    generated_at: "2026-05-06T09:18:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 目標

在不破壞目前工作流程或以大範圍重構掩蓋風險的前提下，將應用程式推向更乾淨、更快速、更易維護的產品。工作應以小型、可審查的切片落地，並為每個觸及的表面提供證明。

## 原則

- 除非某個邊界明確造成反覆變動、效能成本或使用者可見的錯誤，否則保留目前架構。
- 對每個問題優先採用最小且正確的修補，然後重複。
- 將必要修正與選用潤飾分開，讓維護者不必等待主觀決策即可合併高價值工作。
- 保持面向 Plugin 的行為有文件記錄且向後相容。
- 在宣稱迴歸已修復前，先驗證已發布行為、依賴契約與測試。
- 先改善主要使用者路徑：入門設定、驗證、聊天、提供者設定、Plugin 管理與診斷。

## 第 1 階段：基準稽核

在變更應用程式前，先盤點目前狀態。

- 識別主要使用者工作流程，以及擁有它們的程式碼表面。
- 列出無作用的操作入口、重複設定、不清楚的錯誤狀態，以及昂貴的渲染路徑。
- 擷取每個表面的目前驗證命令。
- 將問題標記為必要、建議或選用。
- 記錄需要擁有者審查的已知阻礙，尤其是 API、安全性、發布與 Plugin 契約變更。

完成定義：

- 一份含有 repo 根目錄檔案參照的問題清單。
- 每個問題都有嚴重性、擁有者表面、預期使用者影響，以及建議驗證路徑。
- 不要將推測性的清理項目混入必要修正。

## 第 2 階段：產品與 UX 清理

優先處理可見工作流程並移除混淆。

- 收緊模型驗證、Gateway 狀態與 Plugin 設定周邊的入門文案與空狀態。
- 移除或停用沒有可執行動作的無作用操作入口。
- 讓重要動作在各種響應式寬度下保持可見，而不是藏在脆弱的版面假設後面。
- 整合重複的狀態語言，讓錯誤只有單一真相來源。
- 為進階設定加入漸進式揭露，同時保持核心設定快速。

建議驗證：

- 首次執行設定與既有使用者啟動的手動順利路徑。
- 針對任何路由、設定持久化或狀態衍生邏輯的聚焦測試。
- 變更後響應式表面的瀏覽器截圖。

## 第 3 階段：前端架構收緊

在不進行大範圍重寫的情況下改善可維護性。

- 將重複的 UI 狀態轉換移入狹窄的型別化輔助工具。
- 保持資料擷取、持久化與呈現責任分離。
- 優先使用既有 hook、store 與元件模式，而不是新增抽象。
- 只有在能降低耦合或讓測試更清楚時，才拆分過大的元件。
- 避免為本機面板互動引入大範圍全域狀態。

必要護欄：

- 不要讓檔案拆分順帶改變公開行為。
- 保持選單、對話框、分頁與鍵盤導覽的無障礙行為完整。
- 驗證載入、空、錯誤與樂觀狀態仍能渲染。

## 第 4 階段：效能與可靠性

針對已量測的痛點，而不是大範圍理論性最佳化。

- 量測啟動、路由轉換、大型清單與聊天逐字稿成本。
- 在效能分析證明有價值時，將重複的昂貴衍生資料替換為記憶化 selector 或快取輔助工具。
- 減少熱路徑上可避免的網路或檔案系統掃描。
- 在建構模型 payload 前，保持提示、registry、檔案、Plugin 與網路輸入的決定性排序。
- 為熱輔助工具與契約邊界加入輕量迴歸測試。

完成定義：

- 每項效能變更都記錄基準、預期影響、實際影響與剩餘差距。
- 當能以低成本量測時，不要讓任何效能修補只憑直覺落地。

## 第 5 階段：型別、契約與測試強化

提高使用者與 Plugin 作者所依賴邊界點的正確性。

- 以可辨識聯集或封閉代碼清單取代鬆散的執行階段字串。
- 使用既有 schema 輔助工具或 zod 驗證外部輸入。
- 在 Plugin manifest、提供者 catalog、Gateway protocol 訊息與設定遷移行為周邊加入契約測試。
- 將相容性路徑保留在 doctor 或 repair 流程中，而不是啟動時的隱藏遷移。
- 避免測試專用程式碼耦合到 Plugin 內部；使用 SDK facade 與有文件記錄的 barrel。

建議驗證：

- `pnpm check:changed`
- 每個變更邊界的目標測試。
- 當 lazy 邊界、封裝或已發布表面變更時執行 `pnpm build`。

## 第 6 階段：文件與發布準備

保持使用者面向文件與行為一致。

- 隨行為、API、設定、入門設定或 Plugin 變更更新文件。
- 只為使用者可見變更加上 changelog 項目。
- 使用面向使用者的 Plugin 術語；只有在貢獻者需要時才使用內部套件名稱。
- 確認發布與安裝指示仍符合目前的命令表面。

完成定義：

- 相關文件與行為變更在同一分支中更新。
- 觸及產生式文件或 API 漂移時，對應檢查通過。
- 交接說明列出任何略過的驗證及其略過原因。

## 建議的第一個切片

從範圍明確的 Control UI 與入門設定整理開始：

- 稽核首次執行設定、提供者驗證就緒狀態、Gateway 狀態與 Plugin 設定表面。
- 移除無作用動作並釐清失敗狀態。
- 新增或更新針對狀態衍生與設定持久化的聚焦測試。
- 執行 `pnpm check:changed`。

這能以有限的架構風險帶來高使用者價值。

## 前端 skill 更新

使用本節更新現代化任務所提供、聚焦前端的 `SKILL.md`。若要將這份指引採用為 repo 本機的 OpenClaw skill，請先建立 `.agents/skills/openclaw-frontend/SKILL.md`，保留該目標 skill 所屬的 frontmatter，然後用下列內容新增或替換 body 指引。

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```

---
read_when:
    - 規劃一次廣泛的 OpenClaw 應用程式現代化更新
    - 更新應用程式或 Control UI 工作的前端實作標準
    - 將廣泛的產品品質審查轉化為分階段的工程工作
summary: 含前端交付技能更新的完整應用程式現代化計畫
title: 應用程式現代化計畫
x-i18n:
    generated_at: "2026-07-05T11:40:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94d9afca6acbf19a93c265bb98f0fc0fcd85da8808680fa41d29d8c198bacb88
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

## 目標

在不破壞目前工作流程、也不把風險藏進大型重構的前提下，讓應用程式朝向更乾淨、更快速、更容易維護的產品推進。以小型、可審查的切片交付，並為每個觸及的介面提供證明。

## 原則

- 除非能證明某個邊界正在造成反覆變動、效能成本或使用者可見的錯誤，否則保留目前架構。
- 對每個問題優先採用最小且正確的修補，然後重複執行。
- 將必要修正與可選潤飾分開，讓維護者不必等待主觀決策也能合併高價值工作。
- 保持外掛面向行為有文件記載且向後相容。
- 在宣稱迴歸已修復之前，先驗證已發布行為、相依性合約與測試。
- 優先改善主要使用者路徑：入門設定、驗證、聊天、提供者設定、外掛管理與診斷。

## 階段 1：基準稽核

在變更前盤點目前應用程式。

- 識別主要使用者工作流程，以及擁有這些流程的程式碼介面。
- 列出無效操作項、重複設定、不清楚的錯誤狀態，以及成本高昂的渲染路徑。
- 擷取每個介面的目前驗證命令。
- 將問題標記為必要、建議或可選。
- 記錄需要擁有者審查的已知阻礙，尤其是 API、安全性、發布與外掛合約變更。

完成定義：

- 一份包含 repo-root 檔案參照的問題清單。
- 每個問題都有嚴重程度、擁有者介面、預期使用者影響，以及建議的驗證路徑。
- 不將推測性的清理項目混入必要修正。

## 階段 2：產品與使用者體驗清理

優先處理可見工作流程並移除混淆。

- 收緊圍繞模型驗證、閘道狀態與外掛設定的入門文案與空狀態。
- 在沒有可執行動作時，移除或停用無效操作項。
- 讓重要動作在不同響應式寬度下保持可見，而不是隱藏在脆弱的版面假設之後。
- 整合重複的狀態語言，讓錯誤只有單一事實來源。
- 為進階設定加入漸進揭露，同時保持核心設定快速。

建議驗證：

- 首次執行設定與既有使用者啟動的手動成功路徑。
- 針對任何路由、設定持久化或狀態推導邏輯的聚焦測試。
- 已變更響應式介面的瀏覽器截圖。

## 階段 3：前端架構收緊

在不進行大型重寫的情況下改善可維護性。

- 將重複的 UI 狀態轉換移入狹窄的具型別輔助工具。
- 將資料擷取、持久化與呈現責任分開。
- 優先使用既有 hooks、stores 與元件模式，而不是新增抽象。
- 只有在能降低耦合或釐清測試時，才拆分過大的元件。
- 避免為本機面板互動引入廣泛的全域狀態。

必要護欄：

- 不要讓檔案拆分附帶改變公開行為。
- 保持選單、對話框、分頁與鍵盤導覽的無障礙行為完整。
- 驗證載入、空白、錯誤與樂觀狀態仍會渲染。

## 階段 4：效能與可靠性

針對已量測到的痛點，而不是廣泛的理論最佳化。

- 量測啟動、路由轉換、大型清單與聊天逐字稿成本。
- 在分析證明有價值時，將重複的高成本衍生資料改為記憶化選擇器或快取輔助工具。
- 減少熱路徑上可避免的網路或檔案系統掃描。
- 在建構模型酬載前，保持提示、登錄、檔案、外掛與網路輸入的決定性排序。
- 為熱點輔助工具與合約邊界加入輕量迴歸測試。

完成定義：

- 每個效能變更都記錄基準、預期影響、實際影響與剩餘落差。
- 當便宜的量測可用時，不只憑直覺合併效能修補。

## 階段 5：型別、合約與測試強化

提升使用者與外掛作者所依賴邊界點的正確性。

- 將鬆散的執行階段字串替換為可辨識聯集或封閉代碼清單。
- 使用既有 schema 輔助工具或 zod 驗證外部輸入。
- 為外掛 manifest、提供者目錄、閘道協定訊息與設定遷移行為加入合約測試。
- 將相容性路徑保留在 doctor 或修復流程中，而不是啟動時的隱藏遷移。
- 避免只為測試而耦合到外掛內部；使用 SDK facade 與有文件記載的 barrel。

建議驗證：

- `pnpm check:changed`
- 針對每個已變更邊界的目標測試。
- 當 lazy 邊界、封裝或已發布介面變更時執行 `pnpm build`。

## 階段 6：文件與發布準備

讓使用者可見文件與行為保持一致。

- 依行為、API、設定、入門或外掛變更更新文件。
- 只為使用者可見變更加上變更記錄項目。
- 使用對使用者可見的外掛術語；只在貢獻者需要時使用內部套件名稱。
- 確認發布與安裝指示仍符合目前命令介面。

完成定義：

- 相關文件與行為變更在同一分支中更新。
- 觸及時，產生的文件或 API 漂移檢查會通過。
- 交接說明列出任何跳過的驗證及其原因。

## 建議的第一個切片

從範圍明確的 Control UI 與入門設定開始：

- 稽核首次執行設定、提供者驗證就緒狀態、閘道狀態與外掛設定介面。
- 移除無效動作並釐清失敗狀態。
- 為狀態推導與設定持久化新增或更新聚焦測試。
- 執行 `pnpm check:changed`。

這能以有限的架構風險提供高使用者價值。

## 前端 skill 更新

使用本節更新現代化任務提供的前端導向 `SKILL.md`。如果要採用此指引作為 repo-local OpenClaw skill，請先建立 `.agents/skills/openclaw-frontend/SKILL.md`，保留屬於該目標 skill 的 frontmatter，然後使用下列內容新增或取代本文指引。

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

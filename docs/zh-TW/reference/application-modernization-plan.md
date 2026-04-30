---
read_when:
    - 規劃一輪廣泛的 OpenClaw 應用程式現代化工作
    - 更新應用程式或 Control UI 工作的前端實作標準
    - 將廣泛的產品品質審查轉化為分階段的工程工作
summary: 包含前端交付技能更新的全面應用程式現代化計畫
title: 應用程式現代化計畫
x-i18n:
    generated_at: "2026-04-30T03:36:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 16
---

# 應用程式現代化計畫

## 目標

在不破壞現有工作流程，也不把風險藏進大範圍重構的前提下，讓應用程式朝向更乾淨、更快速、更易維護的產品前進。工作應以小而可審查的切片落地，並為每個觸及的介面提供驗證證據。

## 原則

- 除非某個邊界明確造成反覆修改、效能成本，或使用者可見的錯誤，否則保留目前架構。
- 針對每個問題優先採用最小且正確的修補，然後反覆推進。
- 將必要修正與選用潤飾分開，讓維護者不必等待主觀決策即可合併高價值工作。
- 保持 Plugin 對外行為有文件記錄且向後相容。
- 在宣稱已修正回歸之前，先驗證已發布行為、依賴契約和測試。
- 優先改善主要使用者路徑：入門導覽、驗證、聊天、供應商設定、Plugin 管理和診斷。

## 階段 1：基準稽核

在變更前盤點目前的應用程式。

- 識別主要使用者工作流程，以及負責這些流程的程式碼介面。
- 列出無效功能入口、重複設定、不清楚的錯誤狀態，以及昂貴的渲染路徑。
- 擷取每個介面的目前驗證命令。
- 將問題標記為必要、建議或選用。
- 記錄需要擁有者審查的已知阻礙，特別是 API、安全性、發布和 Plugin 契約變更。

完成定義：

- 一份含有 repo 根目錄檔案參照的問題清單。
- 每個問題都有嚴重性、擁有者介面、預期使用者影響，以及建議的驗證路徑。
- 必要修正中未混入推測性的清理項目。

## 階段 2：產品和 UX 清理

優先處理可見工作流程並移除混淆。

- 收緊模型驗證、gateway 狀態和 Plugin 設定周圍的入門導覽文案與空狀態。
- 在無法執行任何動作時，移除或停用無效功能入口。
- 讓重要動作在不同響應式寬度下保持可見，而不是藏在脆弱的版面假設後面。
- 整合重複的狀態語言，讓錯誤只有一個真實來源。
- 為進階設定加入漸進揭露，同時保持核心設定快速完成。

建議驗證：

- 首次執行設定與既有使用者啟動的手動成功路徑。
- 針對任何路由、設定持久化或狀態推導邏輯的聚焦測試。
- 針對已變更響應式介面的瀏覽器截圖。

## 階段 3：前端架構收緊

在不進行大範圍重寫的情況下改善可維護性。

- 將重複的 UI 狀態轉換移入狹窄的型別化輔助函式。
- 將資料擷取、持久化和呈現責任保持分離。
- 優先使用現有 hooks、stores 和元件模式，而不是新增抽象。
- 只有在能降低耦合或釐清測試時，才拆分過大的元件。
- 避免為區域面板互動引入大範圍全域狀態。

必要護欄：

- 不要讓檔案拆分的副作用改變公開行為。
- 保持選單、對話框、分頁和鍵盤導覽的無障礙行為完整。
- 驗證載入、空白、錯誤和樂觀狀態仍能渲染。

## 階段 4：效能和可靠性

鎖定已量測到的痛點，而不是大範圍的理論性最佳化。

- 量測啟動、路由轉換、大型清單和聊天逐字稿成本。
- 在效能分析證明有價值時，以記憶化選擇器或快取輔助函式取代重複的昂貴衍生資料。
- 減少熱門路徑上可避免的網路或檔案系統掃描。
- 在建構模型酬載前，對提示、登錄表、檔案、Plugin 和網路輸入保持確定性排序。
- 為熱門輔助函式和契約邊界加入輕量回歸測試。

完成定義：

- 每項效能變更都記錄基準、預期影響、實際影響和剩餘落差。
- 當便宜的量測可用時，不接受只靠直覺落地的效能修補。

## 階段 5：型別、契約和測試強化

提高使用者和 Plugin 作者所依賴邊界點的正確性。

- 以可判別聯集或封閉代碼清單取代鬆散的執行階段字串。
- 使用現有 schema 輔助函式或 zod 驗證外部輸入。
- 圍繞 Plugin manifests、供應商目錄、gateway protocol 訊息和設定遷移行為加入契約測試。
- 將相容性路徑保留在 doctor 或 repair 流程中，而不是啟動期間的隱藏遷移。
- 避免測試專用程式碼耦合到 Plugin 內部；使用 SDK facades 和有文件記錄的 barrels。

建議驗證：

- `pnpm check:changed`
- 針對每個已變更邊界的目標測試。
- 當 lazy boundaries、封裝或已發布介面變更時執行 `pnpm build`。

## 階段 6：文件和發布準備

保持使用者可見文件與行為一致。

- 隨行為、API、設定、入門導覽或 Plugin 變更更新文件。
- 只為使用者可見變更新增 changelog entries。
- 保持 Plugin 術語面向使用者；只有在貢獻者需要時才使用內部套件名稱。
- 確認發布和安裝指示仍符合目前的命令介面。

完成定義：

- 相關文件與行為變更在同一分支中更新。
- 觸及產生文件或 API drift 時，檢查通過。
- 交接內容列出任何略過的驗證，以及略過原因。

## 建議的第一個切片

從範圍明確的 Control UI 和入門導覽處理開始：

- 稽核首次執行設定、供應商驗證就緒狀態、gateway 狀態和 Plugin 設定介面。
- 移除無效動作並釐清失敗狀態。
- 新增或更新針對狀態推導與設定持久化的聚焦測試。
- 執行 `pnpm check:changed`。

這能在有限架構風險下提供高使用者價值。

## 前端 skill 更新

使用本節更新與現代化任務一併提供、以前端為重點的 `SKILL.md`。如果要將此指南採納為 repo-local OpenClaw skill，請先建立 `.agents/skills/openclaw-frontend/SKILL.md`，保留屬於該目標 skill 的 frontmatter，然後用以下內容新增或取代 body 指南。

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

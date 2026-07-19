---
read_when:
    - 移轉 Canvas 主機、工具、命令、文件或通訊協定的所有權
    - 稽核 Canvas 是否仍由核心擁有
    - 準備或審查實驗性 Canvas 外掛的 PR
summary: 將 Canvas 從核心移出並移至隨附的實驗性外掛之規劃與稽核檢查清單。
title: Canvas 外掛重構
x-i18n:
    generated_at: "2026-07-19T14:02:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ead3f865ea80acb1e47f45a5ab07acf19a6470035c00c81006b2b1230bedd71e
    source_path: refactor/canvas.md
    workflow: 16
---

# Canvas 外掛重構

Canvas 使用率低且仍屬實驗性質。應將其視為內建外掛，而非核心功能。核心可保留通用的閘道、節點、HTTP、驗證、設定與原生用戶端基礎管線，但 Canvas 專屬行為應置於 `extensions/canvas` 之下。

## 目標

將 Canvas 的所有權移至 `extensions/canvas`，同時保留目前的配對節點行為：

- 面向代理程式的 `canvas` 工具由 Canvas 外掛註冊
- 只有在 Canvas 外掛註冊 Canvas 節點命令時，才允許使用這些命令
- A2UI 主機／原始碼檔案置於 Canvas 外掛之下
- Canvas 文件實體化置於 Canvas 外掛之下
- 命令列介面命令實作置於 Canvas 外掛之下，或透過外掛擁有的執行階段 barrel 委派
- 文件與外掛清單將 Canvas 描述為由外掛支援的實驗性功能

## 非目標

- 本次重構不重新設計原生應用程式的 Canvas UI。
- 除非另有產品決策要刪除 Canvas，否則不移除 iOS、Android 或 macOS 的 Canvas 通訊協定／用戶端支援。
- 除非至少還有一個其他內建外掛需要相同介面，否則不要僅為 Canvas 建立廣泛的外掛服務框架。

## 目前分支狀態

已完成：

- 已在 `extensions/canvas` 中新增內建外掛套件。
- 已新增 `extensions/canvas/openclaw.plugin.json`。
- 已將代理程式的 `canvas` 工具從 `src/agents/tools/canvas-tool.ts` 移至 `extensions/canvas/src/tool.ts`。
- 已從 `src/agents/openclaw-tools.ts` 移除核心對 `createCanvasTool` 的註冊。
- 已將 Canvas 主機實作從 `src/canvas-host` 移至 `extensions/canvas/src/host`。
- 保留 `extensions/canvas/runtime-api.ts`，作為由外掛擁有、供測試、封裝與外部公開 Canvas 輔助程式使用的相容性 barrel。
- 已將 Canvas 文件實體化從 `src/gateway/canvas-documents.ts` 移至 `extensions/canvas/src/documents.ts`。
- 已將 Canvas 命令列介面實作與 A2UI JSONL 輔助程式移至 `extensions/canvas/src/cli.ts`。
- 已將 Canvas 主機 URL 與具範圍限制的能力輔助程式移至 `extensions/canvas/src`。
- 已從硬編碼的核心清單移除 Canvas 節點命令預設值，並移至外掛 `nodeInvokePolicies`。
- 已在 `plugins.entries.canvas.config.host` 新增外掛擁有的 Canvas 主機設定。
- 已將 Canvas 與 A2UI HTTP 服務移至 Canvas 外掛的 HTTP 路由註冊之後。
- 已為外掛擁有的 HTTP 路由新增通用外掛 WebSocket 升級分派。
- 已使用通用的代管外掛介面與節點能力輔助程式，取代 Canvas 專屬的閘道主機 URL 與節點能力驗證。
- 已新增由外掛擁有的代管媒體解析器，使 Canvas 文件 URL 透過 Canvas 外掛解析，而非由核心匯入 Canvas 文件內部實作。
- 已新增 `api.registerNodeCliFeature(...)`，讓 Canvas 可將 `openclaw nodes canvas` 宣告為外掛擁有的節點功能，而無須手動寫出父命令路徑。
- 已移除正式環境中 `src/**` 對 `extensions/canvas/runtime-api.js` 的匯入。
- 已將 A2UI 套件組合原始碼從 `apps/shared/OpenClawKit/Tools/CanvasA2UI` 移至 `extensions/canvas/src/host/a2ui-app`。
- 已將 A2UI 建置／複製實作移至 `extensions/canvas/scripts` 之下，並以通用的內建外掛資產鉤點取代根層級建置串接。
- 已移除執行階段舊版頂層 `canvasHost` 設定別名。
- 已保留 Canvas doctor 遷移，讓 `openclaw doctor --fix` 將舊的 `canvasHost` 設定改寫為 `plugins.entries.canvas.config.host`。
- 已在閘道通訊協定 v4 之後移除舊版代理程式的 Canvas 通訊協定相容性。原生用戶端與閘道現在僅使用 `pluginSurfaceUrls.canvas` 加上 `node.pluginSurface.refresh`；在本次實驗性重構中，刻意不支援已棄用的 `canvasHostUrl`、`canvasCapability` 與 `node.canvas.capability.refresh` 路徑。
- 已更新產生的外掛清單以納入 Canvas。
- 已在 `docs/plugins/reference/canvas.md` 新增外掛參考文件。

已知仍由核心擁有的 Canvas 介面：

- `apps/` 之下的原生應用程式 Canvas 處理常式仍刻意取用 Canvas 外掛介面
- `apps/` 之下的原生應用程式 Canvas 通訊協定／用戶端處理常式
- 為維持執行階段查詢的向下相容性，發布成品的輸出仍使用 `dist/canvas-host/a2ui`，但複製步驟目前由外掛擁有

## 目標形態

`extensions/canvas` 應擁有：

- 外掛資訊清單與套件中繼資料
- 代理程式工具註冊
- 節點叫用命令原則
- Canvas 主機與 A2UI 執行階段
- Canvas A2UI 套件組合原始碼與資產建置／複製指令碼
- Canvas 文件建立與資產解析
- Canvas 命令列介面實作
- Canvas 文件頁面與外掛清單項目

核心應僅擁有通用介面：

- 外掛探索與註冊
- 通用代理程式工具登錄檔
- 通用節點叫用原則登錄檔
- 通用閘道 HTTP／驗證與 WebSocket 升級分派
- 通用代管外掛介面 URL 解析
- 通用代管媒體解析器註冊
- 通用節點能力傳輸
- 通用設定基礎管線
- 通用內建外掛資產鉤點探索

原生應用程式可保留 Canvas 命令處理常式，作為通訊協定的用戶端。它們不是外掛執行階段的擁有者。

## 遷移步驟

1. 將 `plugins.entries.canvas.config.host` 視為外掛擁有的設定介面。
2. 更新文件，將 Canvas 描述為實驗性的內建外掛。
3. 執行聚焦的 Canvas 測試、外掛清單檢查、外掛 SDK API 檢查，以及受執行階段邊界影響的建置／型別關卡。

## 稽核檢查清單

在宣告重構完成前：

- `rg "src/canvas-host|../canvas-host"` 不會傳回任何有效的原始碼匯入。
- `rg "canvas-tool|createCanvasTool" src` 找不到任何由核心擁有的 Canvas 工具實作。
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` 在通用外掛原則測試之外找不到任何硬編碼的允許清單預設值。
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` 為空。
- `rg "canvas-documents" src` 為空。
- `rg "registerNodesCanvasCommands|nodes-canvas" src` 為空；Canvas 外掛透過巢狀外掛命令列介面中繼資料註冊 `openclaw nodes canvas`。
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` 不會傳回任何閘道執行階段所有權。
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` 僅找到相容性包裝函式或外掛擁有的路徑。
- `pnpm plugins:inventory:check` 通過。
- `pnpm plugin-sdk:api:check` 通過，或刻意更新並審查產生的 API 合約記錄。
- 目標 Canvas 測試通過。
- Canvas 主機／A2UI 路徑的變更通道測試通過。
- PR 內文明確說明 Canvas 屬於實驗性質且由外掛支援。

## 驗證命令

反覆修改時使用針對性的本機檢查：

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

如果執行階段 barrel、延遲匯入、封裝或已發布的外掛介面有所變更，請在推送前執行 `pnpm build`。

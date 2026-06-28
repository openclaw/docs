---
read_when:
    - 移轉 Canvas 主機、工具、指令、文件或通訊協定所有權
    - 稽核 Canvas 是否仍由核心擁有
    - 準備或審閱實驗性 Canvas Plugin PR
summary: 將 Canvas 從核心遷移到隨附實驗性 Plugin 的計畫與稽核檢查清單。
title: Canvas Plugin 重構
x-i18n:
    generated_at: "2026-05-07T13:25:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Canvas Plugin 重構

Canvas 使用率低且仍屬實驗性。請將它視為 bundled Plugin，而不是核心功能。核心可以保留通用的 Gateway、Node、HTTP、驗證、設定與 native-client 管線，但 Canvas 專屬行為應位於 `extensions/canvas` 之下。

## 目標

將 Canvas 所有權移至 `extensions/canvas`，同時保留目前的 paired-node 行為：

- 面向 agent 的 `canvas` tool 由 Canvas Plugin 註冊
- Canvas Node 命令只有在 Canvas Plugin 註冊時才允許使用
- A2UI host/source 檔案位於 Canvas Plugin 之下
- Canvas 文件 materialization 位於 Canvas Plugin 之下
- CLI 命令實作位於 Canvas Plugin 之下，或透過 Plugin 擁有的 runtime barrel 委派
- 文件與 Plugin inventory 將 Canvas 描述為實驗性且由 Plugin 支撐

## 非目標

- 不要在此重構中重新設計 native app Canvas UI。
- 除非另有產品決策表示應刪除 Canvas，否則不要移除 iOS、Android 或 macOS 的 Canvas protocol/client 支援。
- 除非至少有另一個 bundled Plugin 需要相同 seam，否則不要只為 Canvas 建立大型 Plugin service framework。

## 目前分支狀態

已完成：

- 在 `extensions/canvas` 新增 bundled Plugin package。
- 新增 `extensions/canvas/openclaw.plugin.json`。
- 將 agent `canvas` tool 從 `src/agents/tools/canvas-tool.ts` 移至 `extensions/canvas/src/tool.ts`。
- 從 `src/agents/openclaw-tools.ts` 移除核心對 `createCanvasTool` 的註冊。
- 將 Canvas host 實作從 `src/canvas-host` 移至 `extensions/canvas/src/host`。
- 保留 `extensions/canvas/runtime-api.ts` 作為 Plugin 擁有的 compatibility barrel，用於測試、封裝與外部公開 Canvas helper。
- 將 Canvas 文件 materialization 從 `src/gateway/canvas-documents.ts` 移至 `extensions/canvas/src/documents.ts`。
- 將 Canvas CLI 實作與 A2UI JSONL helper 移入 `extensions/canvas/src/cli.ts`。
- 將 Canvas host URL 與 scoped capability helper 移入 `extensions/canvas/src`。
- 將 Canvas Node 命令預設值從硬編碼核心清單移至 Plugin `nodeInvokePolicies`。
- 在 `plugins.entries.canvas.config.host` 新增 Plugin 擁有的 Canvas host 設定。
- 將 Canvas 與 A2UI HTTP serving 移到 Canvas Plugin HTTP route 註冊後方。
- 新增通用 Plugin WebSocket upgrade dispatch，用於 Plugin 擁有的 HTTP route。
- 以通用 hosted Plugin surface 與 Node capability helper 取代 Canvas 專屬 Gateway host URL 與 Node capability auth。
- 新增 Plugin 擁有的 hosted media resolver，讓 Canvas 文件 URL 透過 Canvas Plugin 解析，而不是由核心匯入 Canvas 文件內部。
- 新增 `api.registerNodeCliFeature(...)`，讓 Canvas 可以宣告 `openclaw nodes canvas` 作為 Plugin 擁有的 Node feature，而不必手動寫出 parent command path。
- 移除 production `src/**` 對 `extensions/canvas/runtime-api.js` 的匯入。
- 將 A2UI bundle source 從 `apps/shared/OpenClawKit/Tools/CanvasA2UI` 移至 `extensions/canvas/src/host/a2ui-app`。
- 將 A2UI build/copy 實作移至 `extensions/canvas/scripts` 之下，並以通用 bundled-Plugin asset hook 取代根層 build wiring。
- 移除 runtime legacy top-level `canvasHost` 設定 alias。
- 保留 Canvas doctor migration，讓 `openclaw doctor --fix` 將舊的 `canvasHost` 設定重寫為 `plugins.entries.canvas.config.host`。
- 移除 Gateway protocol v4 後方的 old-agent Canvas protocol compatibility。Native client 與 Gateway 現在只使用 `pluginSurfaceUrls.canvas` 加上 `node.pluginSurface.refresh`；已棄用的 `canvasHostUrl`、`canvasCapability` 與 `node.canvas.capability.refresh` path 在此實驗性重構中有意不支援。
- 更新 generated Plugin inventory 以包含 Canvas。
- 在 `docs/plugins/reference/canvas.md` 新增 Plugin reference docs。

已知仍由核心擁有的 Canvas surface：

- `apps/` 之下的 native app Canvas handler 仍有意消費 Canvas Plugin surface
- `apps/` 之下的 native app Canvas protocol/client handler
- published artifact output 仍使用 `dist/canvas-host/a2ui` 以便向後相容的 runtime lookup，但 copy step 現在由 Plugin 擁有

## 目標形態

`extensions/canvas` 應擁有：

- Plugin manifest 與 package metadata
- agent tool 註冊
- Node invoke command policy
- Canvas host 與 A2UI runtime
- Canvas A2UI bundle source 與 asset build/copy script
- Canvas 文件建立與 asset 解析
- Canvas CLI 實作
- Canvas 文件頁面與 Plugin inventory entry

核心只應擁有通用 seam：

- Plugin discovery 與註冊
- 通用 agent tool registry
- 通用 Node invoke policy registry
- 通用 Gateway HTTP/auth 與 WebSocket upgrade dispatch
- 通用 hosted Plugin surface URL 解析
- 通用 hosted media resolver 註冊
- 通用 Node capability transport
- 通用 config plumbing
- 通用 bundled-Plugin asset hook discovery

Native app 可以保留 Canvas 命令 handler，作為 protocol 的 client。它們不是 Plugin runtime owner。

## Migration 步驟

1. 將 `plugins.entries.canvas.config.host` 視為 Plugin 擁有的 config surface。
2. 更新文件，將 Canvas 描述為實驗性 bundled Plugin。
3. 執行 focused Canvas 測試、Plugin inventory check、Plugin SDK API check，以及受 runtime boundary 影響的 build/type gate。

## 稽核檢查清單

在宣告重構完成之前：

- `rg "src/canvas-host|../canvas-host"` 不會回傳任何 live source import。
- `rg "canvas-tool|createCanvasTool" src` 找不到核心擁有的 Canvas tool 實作。
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` 找不到通用 Plugin policy 測試之外的硬編碼 allowlist default。
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` 為空。
- `rg "canvas-documents" src` 為空。
- `rg "registerNodesCanvasCommands|nodes-canvas" src` 為空；Canvas Plugin 透過 nested Plugin CLI metadata 註冊 `openclaw nodes canvas`。
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` 不會回傳 Gateway runtime ownership。
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` 只找到 compatibility wrapper 或 Plugin 擁有的 path。
- `pnpm plugins:inventory:check` 通過。
- `pnpm plugin-sdk:api:check` 通過，或已刻意更新並審查 generated API baseline。
- Targeted Canvas 測試通過。
- Canvas host/A2UI path 的 changed-lanes 測試通過。
- PR body 明確說明 Canvas 是實驗性且由 Plugin 支撐。

## 驗證命令

迭代時使用 targeted local check：

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

如果 runtime barrel、lazy import、packaging 或 published Plugin surface 有變更，push 前請執行 `pnpm build`。

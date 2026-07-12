---
read_when:
    - 調查 tsx/esbuild 載入器當機問題，其中提到缺少 __name 輔助函式
summary: 歷史上的節點 + tsx「__name 不是函式」當機問題及其原因
title: 節點 + tsx 當機
x-i18n:
    generated_at: "2026-07-11T21:20:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx「\_\_name 不是函式」當機

## 狀態

已解決。此當機問題無法在 `package.json` 中目前固定的 `tsx` 版本（`4.22.3`）或目前的 Node 版本上重現。保留此文件，以備未來升級 `tsx`/esbuild 時再次引入此問題。

## 原始症狀

透過 `tsx` 執行 OpenClaw 開發指令碼時，啟動階段失敗並顯示：

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

此處省略行號；自最初發生當機以來，兩個檔案都已有變更，特定行號已不再對應。

此問題出現在開發指令碼從 Bun 切換至 `tsx`（`2871657e`，2026-01-06），以讓 Bun 成為選用項目之後。等效的 Bun 執行路徑並未當機。此問題最初是在 macOS 的 Node v25.3.0 上觀察到；其他執行 Node 25 的平台也被認為可能受到影響。

## 原因

`tsx` 透過 esbuild 轉換 TS/ESM，並在其轉換選項中硬式設定 `keepNames: true`。此設定會讓 esbuild 將具名函式／類別宣告包裝在對 `__name` 輔助函式的呼叫中，使 `fn.name` 在最小化與封裝後仍能保留。此當機表示在受影響的 `tsx`/Node 組合中，該模組的呼叫位置缺少此輔助函式，或該函式遭到遮蔽，因此 `__name(...)` 並未傳回包裝後的值，而是擲出錯誤。

## 目前的重現檢查

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

最小化的獨立重現方式（僅載入原始堆疊追蹤中的模組）：

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

這兩個命令目前都能正常結束。如果其中任一命令再次擲出 `__name is not a function`，請在向上游回報前，記錄確切的 Node 版本、`tsx` 版本（`node_modules/tsx/package.json`）以及完整的堆疊追蹤。

## 因應措施（若當機問題再次出現）

- 使用 Bun 執行開發指令碼，而不要使用 `node --import tsx`。
- 執行 `pnpm tsgo` 進行型別檢查，然後執行建置後的輸出，而不是透過 `tsx` 執行原始碼：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 嘗試不同的 `tsx` 版本（`pnpm add -D tsx@<version>` 屬於相依套件變更，依儲存庫政策需要核准），以二分查找其內含的 esbuild 版本是否再次引入此錯誤。
- 在不同的 Node 主版本／次版本上測試，以確認此失敗是否僅發生於特定版本。

## 參考資料

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 相關內容

- [Node.js 安裝](/zh-TW/install/node)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)

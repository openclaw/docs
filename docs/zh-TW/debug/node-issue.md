---
read_when:
    - 正在調查提到缺少 __name 輔助函式的 tsx/esbuild 載入器當機問題
summary: 歷史上的節點 + tsx「__name is not a function」當機及其原因
title: Node + tsx 當機
x-i18n:
    generated_at: "2026-07-05T11:18:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# 節點 + tsx「\_\_name is not a function」崩潰

## 狀態

已解決。此崩潰在目前 `package.json` 中釘選的 `tsx` 版本（`4.22.3`）或目前的節點版本上無法重現。保留於此，以防未來的 `tsx`/esbuild 升級再次引入此問題。

## 原始症狀

透過 `tsx` 執行 OpenClaw 開發腳本時，在啟動時失敗並顯示：

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

行號已省略；自原始崩潰以來，這兩個檔案都已變更，特定行號已不再相符。

這是在開發腳本從 Bun 切換到 `tsx`（`2871657e`，2026-01-06）以讓 Bun 成為選用項目後出現的。等效的 Bun 路徑並未崩潰。它最初是在 macOS 上的節點 v25.3.0 觀察到；其他執行節點 25 的平台也被認為可能受到影響。

## 原因

`tsx` 會透過 esbuild 轉換 TS/ESM，並在其轉換選項中硬編碼 `keepNames: true`。該設定會讓 esbuild 將具名函式/類別宣告包在對 `__name` 輔助函式的呼叫中，讓 `fn.name` 在縮小與打包後仍可保留。此崩潰表示在受影響的 `tsx`/節點組合中，該模組呼叫位置的輔助函式遺失或被遮蔽，因此 `__name(...)` 丟出錯誤，而不是回傳包裝後的值。

## 目前重現檢查

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

最小隔離重現（只載入原始堆疊追蹤中的模組）：

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

這兩個命令目前都會乾淨結束。如果任一命令再次丟出 `__name is not a function`，請在向上游回報前擷取確切的節點版本、`tsx` 版本（`node_modules/tsx/package.json`）以及完整堆疊追蹤。

## 因應方式（如果崩潰再次出現）

- 使用 Bun 執行開發腳本，而不是 `node --import tsx`。
- 執行 `pnpm tsgo` 進行型別檢查，然後執行建置輸出，而不是透過 `tsx` 執行原始碼：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 嘗試不同的 `tsx` 版本（`pnpm add -D tsx@<version>` 是相依性變更，依照儲存庫政策需要核准），以二分確認它所內含的 esbuild 版本是否重新引入了此錯誤。
- 在不同的節點 major/minor 版本上測試，以確認失敗是否與版本特定相關。

## 參考資料

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 相關

- [Node.js 安裝](/zh-TW/install/node)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)

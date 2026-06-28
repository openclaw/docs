---
read_when:
    - 偵錯僅限 Node 的開發腳本或監看模式失敗
    - 調查 OpenClaw 中的 tsx/esbuild 載入器當機問題
summary: Node + tsx "__name is not a function" 當機說明與因應措施
title: Node + tsx 崩潰
x-i18n:
    generated_at: "2026-05-06T17:55:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Node + tsx「\_\_name is not a function」崩潰

## 摘要

透過 Node 搭配 `tsx` 執行 OpenClaw 會在啟動時失敗，並顯示：

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

這是在將開發腳本從 Bun 切換到 `tsx` 之後開始發生的（commit `2871657e`，2026-01-06）。相同的執行階段路徑在 Bun 下可以正常運作。

## 環境

- Node：v25.x（在 v25.3.0 上觀察到）
- tsx：4.21.0
- 作業系統：macOS（也可能在其他執行 Node 25 的平台上重現）

## 重現方式（僅 Node）

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## 存放庫中的最小重現

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 版本檢查

- Node 25.3.0：失敗
- Node 22.22.0（Homebrew `node@22`）：失敗
- Node 24：此處尚未安裝；需要驗證

## 備註／假設

- `tsx` 使用 esbuild 轉換 TS/ESM。esbuild 的 `keepNames` 會產生 `__name` 輔助函式，並用 `__name(...)` 包裝函式定義。
- 崩潰表示 `__name` 在執行階段存在但不是函式，這暗示在 Node 25 loader 路徑中，此模組的輔助函式遺失或被覆寫。
- 其他 esbuild 使用者也曾回報類似的 `__name` 輔助函式問題，原因是輔助函式遺失或被改寫。

## 回歸歷史

- `2871657e`（2026-01-06）：腳本從 Bun 改為 tsx，讓 Bun 成為可選項。
- 在此之前（Bun 路徑），`openclaw status` 和 `gateway:watch` 可正常運作。

## 因應方式

- 對開發腳本使用 Bun（目前的臨時還原方式）。
- 使用 `tsgo` 進行存放庫型別檢查，然後執行建置後的輸出：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 歷史備註：在偵錯此 Node/tsx 問題時曾於此使用 `tsc`，但存放庫型別檢查 lane 現在使用 `tsgo`。
- 如果可能，在 TS loader 中停用 esbuild keepNames（避免插入 `__name` 輔助函式）；tsx 目前未公開此選項。
- 使用 `tsx` 測試 Node LTS（22/24），確認問題是否為 Node 25 專屬。

## 參考資料

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 下一步

- 在 Node 22/24 上重現，以確認是否為 Node 25 回歸。
- 測試 `tsx` nightly，或在存在已知回歸時釘選到較早版本。
- 如果可在 Node LTS 上重現，帶著 `__name` 堆疊追蹤向上游提交最小重現。

## 相關

- [Node.js 安裝](/zh-TW/install/node)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)

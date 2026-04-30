---
read_when:
    - 偵錯僅限 Node 的開發腳本或監看模式失敗
    - 調查 OpenClaw 中 tsx/esbuild 載入器當機問題
summary: Node + tsx "__name is not a function" 崩潰說明與因應措施
title: Node + tsx 崩潰
x-i18n:
    generated_at: "2026-04-30T03:03:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 16
---

# Node + tsx「`__name is not a function`」崩潰

## 摘要

透過 Node 搭配 `tsx` 執行 OpenClaw 時，啟動會失敗並出現：

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

這是在開發腳本從 Bun 切換到 `tsx`（提交 `2871657e`，2026-01-06）後開始發生的。同一條執行路徑先前可在 Bun 正常運作。

## 環境

- Node: v25.x（在 v25.3.0 觀察到）
- tsx: 4.21.0
- OS: macOS（也很可能可在其他執行 Node 25 的平台重現）

## 重現（僅限 Node）

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## repo 中的最小重現

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 版本檢查

- Node 25.3.0：失敗
- Node 22.22.0（Homebrew `node@22`）：失敗
- Node 24：此處尚未安裝；需要驗證

## 備註 / 假設

- `tsx` 使用 esbuild 轉換 TS/ESM。esbuild 的 `keepNames` 會產生 `__name` 輔助函式，並用 `__name(...)` 包裝函式定義。
- 此崩潰表示 `__name` 在執行時存在但不是函式，這代表在 Node 25 loader 路徑中，這個模組的輔助函式遺失或被覆寫。
- 其他 esbuild 使用者也曾回報類似的 `__name` 輔助函式問題，原因是該輔助函式遺失或被重寫。

## 迴歸歷史

- `2871657e`（2026-01-06）：腳本從 Bun 改為 tsx，讓 Bun 變成選用。
- 在那之前（Bun 路徑），`openclaw status` 和 `gateway:watch` 都能運作。

## 因應方式

- 開發腳本使用 Bun（目前的暫時還原）。
- 使用 `tsgo` 進行 repo 型別檢查，然後執行建置輸出：

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- 歷史備註：偵錯此 Node/tsx 問題時曾在這裡使用 `tsc`，但 repo 型別檢查 lanes 現在使用 `tsgo`。
- 若可行，請在 TS loader 中停用 esbuild keepNames（防止插入 `__name` 輔助函式）；tsx 目前沒有公開這個選項。
- 使用 `tsx` 測試 Node LTS（22/24），確認問題是否為 Node 25 特有。

## 參考資料

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## 後續步驟

- 在 Node 22/24 上重現，以確認是否為 Node 25 迴歸。
- 測試 `tsx` nightly，或若存在已知迴歸則釘選至較早版本。
- 如果可在 Node LTS 重現，請帶著 `__name` 堆疊追蹤向上游提交最小重現。

## 相關

- [Node.js 安裝](/zh-TW/install/node)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)

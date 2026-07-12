---
read_when:
    - 你想要最快的本機開發迴圈（bun + watch）
    - 你遇到 Bun 安裝、修補或生命週期指令碼問題
summary: Bun 工作流程（實驗性）：安裝方式及相較於 pnpm 的注意事項
title: Bun（實驗性）
x-i18n:
    generated_at: "2026-07-11T21:27:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
不建議將 Bun 用於閘道執行環境（已知與 WhatsApp 和 Telegram 存在問題）。正式環境請使用節點。
</Warning>

Bun 是選用的本機執行環境，可直接執行 TypeScript（`bun run ...`、`bun --watch ...`）。預設套件管理器仍為 `pnpm`，它受到完整支援，且由文件工具使用。Bun 無法使用 `pnpm-lock.yaml`，並會忽略該檔案。

## 安裝

<Steps>
  <Step title="安裝相依套件">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已列入 git 忽略清單，因此不會造成儲存庫變動。若要完全略過鎖定檔寫入：

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="建置與測試">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 生命週期指令碼

除非明確信任，否則 Bun 會封鎖相依套件的生命週期指令碼。對此儲存庫而言，通常遭封鎖的指令碼並非必要：

- `baileys` `preinstall`：檢查節點主要版本是否 >= 20（OpenClaw 要求節點 22.19+ 或 23.11+，並建議使用節點 24）
- `protobufjs` `postinstall`：輸出有關版本配置不相容的警告（不產生建置成品）

若遇到需要這些指令碼才能解決的執行環境問題，請明確信任它們：

```sh
bun pm trust baileys protobufjs
```

## 注意事項

部分套件指令碼在內部將 `pnpm` 寫死（例如 `check:docs`、`ui:*`、`protocol:check`）。透過 `bun run` 執行它們時，仍會呼叫 shell 執行 `pnpm`，因此請直接透過 `pnpm` 執行這些指令碼。

## 相關內容

- [安裝概覽](/zh-TW/install)
- [Node.js](/zh-TW/install/node)
- [更新](/zh-TW/install/updating)

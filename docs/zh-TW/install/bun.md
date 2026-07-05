---
read_when:
    - 你想要最快的本機開發循環（bun + watch）
    - 你遇到 Bun 安裝、修補程式或生命週期指令碼問題
summary: Bun 工作流程（實驗性）：安裝與相較於 pnpm 的注意事項
title: Bun（實驗性）
x-i18n:
    generated_at: "2026-07-05T11:25:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
不建議將 Bun 用於閘道執行階段（WhatsApp 和 Telegram 有已知問題）。生產環境請使用節點。
</Warning>

Bun 是選用的本機執行階段，可用來直接執行 TypeScript（`bun run ...`、`bun --watch ...`）。預設套件管理器仍為 `pnpm`，文件工具完整支援並使用它。Bun 無法使用 `pnpm-lock.yaml`，且會忽略它。

## 安裝

<Steps>
  <Step title="安裝相依套件">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已加入 gitignore，因此不會造成儲存庫變更。若要完全略過鎖定檔寫入：

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

Bun 會封鎖相依套件生命週期指令碼，除非明確信任。對此儲存庫而言，常見被封鎖的指令碼並非必要：

- `baileys` `preinstall`：檢查節點主版本 >= 20（OpenClaw 需要節點 22.19+ 或 23.11+，建議使用節點 24）
- `protobufjs` `postinstall`：發出不相容版本配置的警告（沒有建置產物）

如果遇到需要這些指令碼的執行階段問題，請明確信任它們：

```sh
bun pm trust baileys protobufjs
```

## 注意事項

某些套件指令碼在內部硬編碼 `pnpm`（例如 `check:docs`、`ui:*`、`protocol:check`）。透過 `bun run` 執行它們仍會 shell out 到 `pnpm`，因此請直接透過 `pnpm` 執行那些指令。

## 相關

- [安裝概觀](/zh-TW/install)
- [Node.js](/zh-TW/install/node)
- [更新](/zh-TW/install/updating)

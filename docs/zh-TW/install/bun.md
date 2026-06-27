---
read_when:
    - 你想要最快的本機開發迴圈（bun + watch）
    - 你遇到 Bun 安裝／修補／生命週期指令碼問題
summary: Bun 工作流程（實驗性）：安裝與相較於 pnpm 的注意事項
title: Bun（實驗性）
x-i18n:
    generated_at: "2026-06-27T19:26:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **不建議用於閘道執行階段**（已知 WhatsApp 和 Telegram 有問題）。生產環境請使用節點。
</Warning>

Bun 是可選的本機執行階段，可直接執行 TypeScript（`bun run ...`、`bun --watch ...`）。預設套件管理器仍是 `pnpm`，它受到完整支援，並由文件工具使用。Bun 無法使用 `pnpm-lock.yaml`，且會忽略它。

## 安裝

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已加入 gitignore，因此不會造成儲存庫變動。若要完全略過寫入 lockfile：

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## 生命週期指令碼

除非明確信任，否則 Bun 會封鎖相依套件的生命週期指令碼。對此儲存庫而言，常見被封鎖的指令碼並非必要：

- `baileys` `preinstall` -- 檢查節點主要版本 >= 20（OpenClaw 預設使用節點 24，且仍支援節點 22 LTS，目前為 `22.19+`）
- `protobufjs` `postinstall` -- 發出關於不相容版本配置的警告（沒有建置成品）

如果你遇到需要這些指令碼的執行階段問題，請明確信任它們：

```sh
bun pm trust baileys protobufjs
```

## 注意事項

部分指令碼仍硬編碼 pnpm（例如 `check:docs`、`ui:*`、`protocol:check`）。目前請透過 pnpm 執行這些指令碼。

## 相關

- [安裝概覽](/zh-TW/install)
- [Node.js](/zh-TW/install/node)
- [更新](/zh-TW/install/updating)

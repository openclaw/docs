---
read_when:
    - 你想要最快的本機開發迴圈（bun + watch）
    - 你遇到 Bun 安裝、修補或生命週期指令碼問題
summary: Bun 工作流程（實驗性）：安裝方式與相較於 pnpm 的注意事項
title: Bun（實驗性）
x-i18n:
    generated_at: "2026-04-30T03:13:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **不建議用於 Gateway 執行階段**（已知 WhatsApp 和 Telegram 有問題）。生產環境請使用 Node。
</Warning>

Bun 是選用的本機執行階段，可直接執行 TypeScript（`bun run ...`、`bun --watch ...`）。預設套件管理器仍是 `pnpm`，它受到完整支援，也用於文件工具。Bun 無法使用 `pnpm-lock.yaml`，並會忽略它。

## 安裝

<Steps>
  <Step title="安裝依賴">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已加入 gitignore，因此不會造成 repo 變動。若要完全略過寫入 lockfile：

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

## 生命週期腳本

Bun 會封鎖依賴的生命週期腳本，除非明確信任。對此 repo 而言，常見被封鎖的腳本並非必要：

- `@whiskeysockets/baileys` `preinstall` -- 檢查 Node 主要版本 >= 20（OpenClaw 預設使用 Node 24，且仍支援 Node 22 LTS，目前為 `22.14+`）
- `protobufjs` `postinstall` -- 發出不相容版本配置的警告（沒有建置產物）

如果遇到需要這些腳本的執行階段問題，請明確信任它們：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事項

部分腳本仍硬編碼 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。目前請透過 pnpm 執行這些腳本。

## 相關

- [安裝概覽](/zh-TW/install)
- [Node.js](/zh-TW/install/node)
- [更新](/zh-TW/install/updating)

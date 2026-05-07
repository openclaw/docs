---
read_when:
    - 你想要最快的本機開發循環 (bun + watch)
    - 你遇到 Bun 安裝、修補與生命週期指令碼問題
summary: Bun 工作流程（實驗性）：安裝與相較於 pnpm 的注意事項
title: Bun（實驗性）
x-i18n:
    generated_at: "2026-05-07T13:20:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **不建議用於 Gateway 執行階段**（已知與 WhatsApp 和 Telegram 有問題）。生產環境請使用 Node。
</Warning>

Bun 是選用的本機執行階段，可直接執行 TypeScript（`bun run ...`、`bun --watch ...`）。預設套件管理器仍是 `pnpm`，它受到完整支援，並由文件工具使用。Bun 無法使用 `pnpm-lock.yaml`，並會忽略它。

## 安裝

<Steps>
  <Step title="安裝相依套件">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已加入 gitignore，因此不會造成 repo 變動。若要完全略過 lockfile 寫入：

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

Bun 會封鎖相依套件生命週期指令碼，除非明確信任。對於此 repo，常見被封鎖的指令碼不是必要的：

- `@whiskeysockets/baileys` `preinstall` -- 檢查 Node 主要版本 >= 20（OpenClaw 預設使用 Node 24，且仍支援 Node 22 LTS，目前為 `22.16+`）
- `protobufjs` `postinstall` -- 發出關於不相容版本配置的警告（沒有建置成品）

如果遇到需要這些指令碼的執行階段問題，請明確信任它們：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事項

部分指令碼目前仍硬編碼 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。暫時請透過 pnpm 執行這些指令碼。

## 相關內容

- [安裝概觀](/zh-TW/install)
- [Node.js](/zh-TW/install/node)
- [更新](/zh-TW/install/updating)

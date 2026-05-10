---
read_when:
    - 你想要最快的本機開發迴圈（bun + watch）
    - 你遇到 Bun 安裝、修補與生命週期指令碼問題
summary: Bun 工作流程（實驗性）：安裝與相較於 pnpm 的注意事項
title: Bun（實驗性）
x-i18n:
    generated_at: "2026-05-10T19:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **不建議用於 Gateway 執行階段**（已知與 WhatsApp 和 Telegram 有問題）。生產環境請使用 Node。
</Warning>

Bun 是可選的本機執行階段，可直接執行 TypeScript（`bun run ...`、`bun --watch ...`）。預設套件管理器仍為 `pnpm`，它受到完整支援，且由文件工具使用。Bun 無法使用 `pnpm-lock.yaml`，並會忽略它。

## 安裝

<Steps>
  <Step title="安裝相依性">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` 已加入 gitignore，因此不會造成儲存庫變動。若要完全略過 lockfile 寫入：

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

Bun 會封鎖相依性的生命週期腳本，除非明確信任。對此儲存庫而言，常見被封鎖的腳本並非必要：

- `baileys` `preinstall` -- 檢查 Node 主版號 >= 20（OpenClaw 預設使用 Node 24，且仍支援 Node 22 LTS，目前為 `22.16+`）
- `protobufjs` `postinstall` -- 發出關於不相容版本配置的警告（沒有建置產物）

如果遇到需要這些腳本的執行階段問題，請明確信任它們：

```sh
bun pm trust baileys protobufjs
```

## 注意事項

部分腳本目前仍硬編碼 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。目前請透過 pnpm 執行這些腳本。

## 相關

- [安裝概覽](/zh-TW/install)
- [Node.js](/zh-TW/install/node)
- [更新](/zh-TW/install/updating)

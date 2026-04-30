---
read_when:
    - 將 OpenClaw 遷移至新的筆記型電腦或伺服器
    - 你正從另一個代理系統轉移而來，並想保留狀態
    - 您正在升級就地 Plugin
summary: 遷移中心：跨系統匯入、機器間移轉與 Plugin 升級
title: 遷移指南
x-i18n:
    generated_at: "2026-04-30T03:16:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2a1dc86ed367a0b92cdc0d5189123bb045d327be944516f564dac723f324c97
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw 支援三種遷移路徑：從另一個代理系統匯入、將現有安裝移到新機器，以及就地升級 Plugin。

## 從另一個代理系統匯入

使用內建的遷移提供者，將指示、MCP 伺服器、skills、模型設定，以及（選擇加入的）API 金鑰帶入 OpenClaw。任何變更前都會先預覽計畫，報告中的密鑰會被遮蔽，而套用操作會由已驗證的備份支援。

<CardGroup cols={2}>
  <Card title="從 Claude 遷移" href="/zh-TW/install/migrating-claude" icon="brain">
    匯入 Claude Code 和 Claude Desktop 狀態，包括 `CLAUDE.md`、MCP 伺服器、skills，以及專案命令。
  </Card>
  <Card title="從 Hermes 遷移" href="/zh-TW/install/migrating-hermes" icon="feather">
    匯入 Hermes 設定、提供者、MCP 伺服器、記憶體、skills，以及支援的 `.env` 金鑰。
  </Card>
</CardGroup>

CLI 進入點是 [`openclaw migrate`](/zh-TW/cli/migrate)。當上手流程偵測到已知來源時，也可以提供遷移（`openclaw onboard --flow import`）。

## 將 OpenClaw 移到新機器

複製**狀態目錄**（預設為 `~/.openclaw/`）和你的**工作區**，以保留：

- **設定** — `openclaw.json` 和所有 Gateway 設定。
- **驗證** — 每個代理的 `auth-profiles.json`（API 金鑰加上 OAuth），以及 `credentials/` 下的任何頻道或提供者狀態。
- **工作階段** — 對話歷史和代理狀態。
- **頻道狀態** — WhatsApp 登入、Telegram 工作階段，以及類似狀態。
- **工作區檔案** — `MEMORY.md`、`USER.md`、skills，以及提示。

<Tip>
在舊機器上執行 `openclaw status`，確認你的狀態目錄路徑。自訂設定檔會使用 `~/.openclaw-<profile>/`，或透過 `OPENCLAW_STATE_DIR` 設定的路徑。
</Tip>

### 遷移步驟

<Steps>
  <Step title="停止 gateway 並備份">
    在**舊**機器上停止 gateway，避免檔案在複製中途變更，然後封存：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多個設定檔（例如 `~/.openclaw-work`），請分別封存每一個。

  </Step>

  <Step title="在新機器上安裝 OpenClaw">
    在新機器上[安裝](/zh-TW/install) CLI（以及需要時安裝 Node）。如果上手流程建立了新的 `~/.openclaw/` 也沒關係。你接著會覆寫它。
  </Step>

  <Step title="複製狀態目錄和工作區">
    透過 `scp`、`rsync -a` 或外接磁碟傳輸封存檔，然後解壓縮：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    確認已包含隱藏目錄，且檔案擁有權符合將執行 gateway 的使用者。

  </Step>

  <Step title="執行 doctor 並驗證">
    在新機器上執行 [Doctor](/zh-TW/gateway/doctor)，以套用設定遷移並修復服務：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

### 常見陷阱

<AccordionGroup>
  <Accordion title="設定檔或 state-dir 不相符">
    如果舊 gateway 使用 `--profile` 或 `OPENCLAW_STATE_DIR`，而新的沒有，頻道會顯示為已登出，工作階段也會是空的。請使用你遷移的**相同**設定檔或 state-dir 啟動 gateway，然後重新執行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只複製 openclaw.json">
    只有設定檔還不夠。模型驗證設定檔位於 `agents/<agentId>/agent/auth-profiles.json` 下，頻道和提供者狀態則位於 `credentials/` 下。請一律遷移**整個**狀態目錄。
  </Accordion>

  <Accordion title="權限與擁有權">
    如果你以 root 身分複製或切換了使用者，gateway 可能無法讀取憑證。請確認狀態目錄和工作區由執行 gateway 的使用者擁有。
  </Accordion>

  <Accordion title="遠端模式">
    如果你的 UI 指向**遠端** gateway，遠端主機會擁有工作階段和工作區。請遷移 gateway 主機本身，而不是你的本機筆電。請參閱 [FAQ](/zh-TW/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="備份中的密鑰">
    狀態目錄包含驗證設定檔、頻道憑證，以及其他提供者狀態。請加密儲存備份，避免不安全的傳輸通道，並在懷疑暴露時輪換金鑰。
  </Accordion>
</AccordionGroup>

### 驗證檢查清單

在新機器上確認：

- [ ] `openclaw status` 顯示 gateway 正在執行。
- [ ] 頻道仍然已連線（不需要重新配對）。
- [ ] 儀表板可以開啟，並顯示現有工作階段。
- [ ] 工作區檔案（記憶體、設定）都存在。

## 就地升級 Plugin

就地 Plugin 升級會保留相同的 Plugin ID 和設定鍵，但可能會將磁碟上的狀態移到目前版面配置中。Plugin 專用升級指南位於其頻道旁：

- [Matrix 遷移](/zh-TW/channels/matrix-migration)：加密狀態復原限制、自動快照行為，以及手動復原命令。

## 相關

- [`openclaw migrate`](/zh-TW/cli/migrate)：跨系統匯入的 CLI 參考。
- [安裝概觀](/zh-TW/install)：所有安裝方法。
- [Doctor](/zh-TW/gateway/doctor)：遷移後健康檢查。
- [解除安裝](/zh-TW/install/uninstall)：乾淨移除 OpenClaw。

---
read_when:
    - 你正在將 OpenClaw 移至新的筆記型電腦或伺服器
    - 你來自另一個代理系統，並想要保留狀態
    - 你正在升級原地安裝的外掛
summary: 遷移中心：跨系統匯入、機器對機器移轉，以及外掛升級
title: 遷移指南
x-i18n:
    generated_at: "2026-07-05T11:30:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw 支援三種遷移路徑：從另一個代理系統匯入、將既有安裝移到新機器，以及就地升級外掛。

## 從另一個代理系統匯入

內建的遷移提供者會將指示、MCP 伺服器、Skills、模型設定，以及（選擇加入的）API 金鑰帶入 OpenClaw。計畫會在任何變更前預覽，報告中的密鑰會被遮蔽，套用則由已驗證的備份支援。

<CardGroup cols={2}>
  <Card title="Migrating from Claude" href="/zh-TW/install/migrating-claude" icon="brain">
    匯入 Claude Code 和 Claude Desktop 狀態，包括 `CLAUDE.md`、MCP 伺服器、Skills 和專案命令。
  </Card>
  <Card title="Migrating from Hermes" href="/zh-TW/install/migrating-hermes" icon="feather">
    匯入 Hermes 設定、提供者、MCP 伺服器、記憶、Skills，以及支援的 `.env` 金鑰。
  </Card>
</CardGroup>

命令列介面進入點是 [`openclaw migrate`](/zh-TW/cli/migrate)。入門流程偵測到已知來源時，也可以提供遷移（`openclaw onboard --flow import`）。

## 將 OpenClaw 移到新機器

複製**狀態目錄**（預設為 `~/.openclaw/`）和你的**工作區**以保留：

- **設定** — `openclaw.json` 和所有閘道設定。
- **驗證** — 每個代理的 `auth-profiles.json`（API 金鑰加上 OAuth），以及 `credentials/` 下的任何通道或提供者狀態。
- **工作階段** — 對話歷史和代理狀態。
- **通道狀態** — WhatsApp 登入、Telegram 工作階段，以及類似項目。
- **工作區檔案** — `MEMORY.md`、`USER.md`、Skills 和提示。

<Tip>
在舊機器上執行 `openclaw status`，確認你的狀態目錄路徑。自訂設定檔使用 `~/.openclaw-<profile>/`，或透過 `OPENCLAW_STATE_DIR` 設定的路徑。
</Tip>

### 遷移步驟

<Steps>
  <Step title="Stop the gateway and back up">
    在**舊**機器上停止閘道，避免檔案在複製途中變更，然後封存：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多個設定檔（例如 `~/.openclaw-work`），請分別封存每一個。

  </Step>

  <Step title="Install OpenClaw on the new machine">
    在新機器上[安裝](/zh-TW/install)命令列介面（如有需要也安裝節點）。即使入門流程建立了新的 `~/.openclaw/` 也沒關係，接下來會覆寫它。
  </Step>

  <Step title="Copy state directory and workspace">
    透過 `scp`、`rsync -a` 或外接硬碟傳輸封存檔，然後解壓縮：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    確認已包含隱藏目錄，且檔案擁有者符合將執行閘道的使用者。

  </Step>

  <Step title="Run doctor and verify">
    在新機器上執行 [Doctor](/zh-TW/gateway/doctor)，套用設定遷移並修復服務：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

如果 Telegram 或 Discord 使用預設 env 後援（`TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN`），請確認遷移後狀態目錄中的 `.env` 包含這些金鑰，但不要印出密鑰值：

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

當已啟用的預設 Telegram 或 Discord 帳號沒有設定 token，且 doctor 程序無法使用相符的 env 變數時，`openclaw doctor` 也會發出警告。

### 常見陷阱

<AccordionGroup>
  <Accordion title="Profile or state-dir mismatch">
    如果舊閘道使用 `--profile` 或 `OPENCLAW_STATE_DIR`，而新閘道沒有，通道會顯示為已登出，工作階段也會是空的。請使用你遷移的**相同**設定檔或狀態目錄啟動閘道，然後重新執行 `openclaw doctor`。
  </Accordion>

  <Accordion title="Copying only openclaw.json">
    只有設定檔還不夠。模型驗證設定檔位於 `agents/<agentId>/agent/auth-profiles.json` 下，通道和提供者狀態則位於 `credentials/` 下。請一律遷移**整個**狀態目錄。
  </Accordion>

  <Accordion title="Permissions and ownership">
    如果你以 root 複製或切換了使用者，閘道可能無法讀取憑證。請確保狀態目錄和工作區由執行閘道的使用者擁有。
  </Accordion>

  <Accordion title="Remote mode">
    如果你的 UI 指向**遠端**閘道，工作階段和工作區由遠端主機擁有。請遷移閘道主機本身，而不是你的本機筆電。請參閱 [FAQ](/zh-TW/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="Secrets in backups">
    狀態目錄包含驗證設定檔、通道憑證和其他提供者狀態。請加密儲存備份、避免不安全的傳輸通道，並在懷疑外洩時輪替金鑰。
  </Accordion>
</AccordionGroup>

### 驗證檢查清單

在新機器上確認：

- [ ] `openclaw status` 顯示閘道正在執行。
- [ ] 通道仍然已連線（不需要重新配對）。
- [ ] 儀表板可以開啟並顯示既有工作階段。
- [ ] 工作區檔案（記憶、設定）存在。

## 就地升級外掛

就地外掛升級會保留相同的外掛 id 和設定金鑰，但可能會將磁碟上的狀態移到目前版面配置。外掛專屬升級指南位於其通道旁：

- [Matrix 遷移](/zh-TW/channels/matrix-migration)：加密狀態復原限制、自動快照行為，以及手動復原命令。

## 相關

- [`openclaw migrate`](/zh-TW/cli/migrate)：跨系統匯入的命令列介面參考。
- [安裝概覽](/zh-TW/install)：所有安裝方法。
- [Doctor](/zh-TW/gateway/doctor)：遷移後健康檢查。
- [解除安裝](/zh-TW/install/uninstall)：乾淨移除 OpenClaw。

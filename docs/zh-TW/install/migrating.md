---
read_when:
    - 您正在將 OpenClaw 移至新的筆記型電腦或伺服器
    - 你正從另一個代理系統轉移過來，並希望保留狀態
    - 您正在就地升級外掛
summary: 遷移中心：跨系統匯入、機器間移轉與外掛升級
title: 遷移指南
x-i18n:
    generated_at: "2026-07-11T21:29:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7961f78bc654d328cb91a6ef982b6e47740fd831aec9249c8ffed3225dd0ccf
    source_path: install/migrating.md
    workflow: 16
---

OpenClaw 支援三種遷移方式：從其他代理系統匯入、將現有安裝移至新機器，以及就地升級外掛。

## 從其他代理系統匯入

內建的遷移提供者可將指示、MCP 伺服器、Skills、模型設定，以及選擇性匯入的 API 金鑰帶入 OpenClaw。進行任何變更前會先預覽計畫、報告中的秘密資訊會經過遮蔽，而套用作業則有經過驗證的備份保障。

<CardGroup cols={2}>
  <Card title="從 Claude 遷移" href="/zh-TW/install/migrating-claude" icon="brain">
    匯入 Claude Code 與 Claude Desktop 的狀態，包括 `CLAUDE.md`、MCP 伺服器、Skills，以及專案命令。
  </Card>
  <Card title="從 Hermes 遷移" href="/zh-TW/install/migrating-hermes" icon="feather">
    匯入 Hermes 設定、提供者、MCP 伺服器、記憶、Skills，以及支援的 `.env` 金鑰。
  </Card>
</CardGroup>

命令列介面的進入點是 [`openclaw migrate`](/zh-TW/cli/migrate)。初始設定在偵測到已知來源時，也可以提供遷移選項（`openclaw onboard --flow import`）。

## 將 OpenClaw 移至新機器

複製**狀態目錄**（預設為 `~/.openclaw/`）與你的**工作區**，即可保留：

- **設定** — `openclaw.json` 與所有閘道設定。
- **驗證資訊** — 每個代理的 `auth-profiles.json`（API 金鑰與 OAuth），以及 `credentials/` 下的所有頻道或提供者狀態。
- **工作階段** — 對話記錄與代理狀態。
- **頻道狀態** — WhatsApp 登入資訊、Telegram 工作階段及其他類似資料。
- **工作區檔案** — `MEMORY.md`、`USER.md`、Skills 與提示詞。

<Tip>
在舊機器上執行 `openclaw status`，以確認狀態目錄路徑。自訂設定檔會使用 `~/.openclaw-<profile>/`，或使用透過 `OPENCLAW_STATE_DIR` 設定的路徑。
</Tip>

### 遷移步驟

<Steps>
  <Step title="停止閘道並備份">
    在**舊**機器上停止閘道，避免複製期間檔案持續變更，然後建立封存檔：

    ```bash
    openclaw gateway stop
    cd ~
    tar -czf openclaw-state.tgz .openclaw
    ```

    如果你使用多個設定檔（例如 `~/.openclaw-work`），請分別封存每一個設定檔。

  </Step>

  <Step title="在新機器上安裝 OpenClaw">
    在新機器上[安裝](/zh-TW/install)命令列介面（如有需要，也安裝 Node）。即使初始設定建立了新的 `~/.openclaw/` 也沒關係，下一步會覆寫它。
  </Step>

  <Step title="複製狀態目錄與工作區">
    透過 `scp`、`rsync -a` 或外接式磁碟傳輸封存檔，然後解壓縮：

    ```bash
    cd ~
    tar -xzf openclaw-state.tgz
    ```

    確認其中包含隱藏目錄，且檔案擁有者與將執行閘道的使用者一致。

  </Step>

  <Step title="執行診斷並驗證">
    在新機器上執行[診斷工具](/zh-TW/gateway/doctor)，以套用設定遷移並修復服務：

    ```bash
    openclaw doctor
    openclaw gateway restart
    openclaw status
    ```

  </Step>
</Steps>

如果 Telegram 或 Discord 使用預設的環境變數後備機制（`TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN`），請確認遷移後狀態目錄中的 `.env` 包含這些金鑰，同時不要印出秘密值：

```bash
awk -F= '/^(TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN)=/ { print $1 "=present" }' ~/.openclaw/.env
```

當已啟用的預設 Telegram 或 Discord 帳號未設定權杖，且診斷程序無法取得對應的環境變數時，`openclaw doctor` 也會發出警告。

### 常見問題

<AccordionGroup>
  <Accordion title="設定檔或狀態目錄不一致">
    如果舊閘道使用 `--profile` 或 `OPENCLAW_STATE_DIR`，而新閘道沒有使用，頻道會顯示為已登出，工作階段也會是空的。請使用遷移時的**相同**設定檔或狀態目錄啟動閘道，然後再次執行 `openclaw doctor`。
  </Accordion>

  <Accordion title="只複製 openclaw.json">
    只複製設定檔並不足夠。模型驗證設定檔位於 `agents/<agentId>/agent/auth-profiles.json`，頻道與提供者狀態則位於 `credentials/`。請一律遷移**整個**狀態目錄。
  </Accordion>

  <Accordion title="權限與擁有權">
    如果你以 root 身分複製檔案或切換了使用者，閘道可能無法讀取憑證。請確保狀態目錄與工作區由執行閘道的使用者擁有。
  </Accordion>

  <Accordion title="遠端模式">
    如果你的使用者介面連線至**遠端**閘道，工作階段與工作區由遠端主機管理。請遷移閘道主機本身，而不是你的本機筆記型電腦。請參閱[常見問題](/zh-TW/help/faq#where-things-live-on-disk)。
  </Accordion>

  <Accordion title="備份中的秘密資訊">
    狀態目錄包含驗證設定檔、頻道憑證及其他提供者狀態。請加密儲存備份、避免使用不安全的傳輸管道，並在懷疑資訊外洩時輪替金鑰。
  </Accordion>
</AccordionGroup>

### 驗證清單

請在新機器上確認：

- [ ] `openclaw status` 顯示閘道正在執行。
- [ ] 頻道仍保持連線（無須重新配對）。
- [ ] 儀表板可以開啟，並顯示現有的工作階段。
- [ ] 工作區檔案（記憶、設定）皆存在。

## 就地升級外掛

就地升級外掛會保留相同的外掛識別碼與設定鍵，但可能會將磁碟上的狀態移至目前的目錄配置。外掛專用的升級指南位於其頻道文件旁：

- [Matrix 遷移](/zh-TW/channels/matrix-migration)：加密狀態的復原限制、自動快照行為，以及手動復原命令。

## 相關內容

- [`openclaw migrate`](/zh-TW/cli/migrate)：跨系統匯入的命令列介面參考資料。
- [安裝概覽](/zh-TW/install)：所有安裝方式。
- [診斷工具](/zh-TW/gateway/doctor)：遷移後的健康狀態檢查。
- [解除安裝](/zh-TW/install/uninstall)：完整移除 OpenClaw。

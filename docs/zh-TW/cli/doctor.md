---
read_when:
    - 您遇到連線/身分驗證問題，並想要引導式修正
    - 你已更新並想要進行合理性檢查
summary: CLI 參考文件：`openclaw doctor`（健康檢查 + 引導式修復）
title: 診斷
x-i18n:
    generated_at: "2026-05-05T01:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 079d7674ae2a259a0430e30e7577ac532135ad5461c57c4b3a6514a007bc9ea5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 和通道的健康檢查 + 快速修復。

相關：

- 疑難排解：[疑難排解](/zh-TW/gateway/troubleshooting)
- 安全稽核：[安全性](/zh-TW/gateway/security)

## 範例

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## 選項

- `--no-workspace-suggestions`：停用工作區記憶體/搜尋建議
- `--yes`：不提示並接受預設值
- `--repair`：不提示並套用建議的非服務修復；Gateway 服務安裝和重寫仍需要互動式確認或明確的 Gateway 命令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅執行安全遷移和非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務以尋找額外的 Gateway 安裝

備註：

- 互動式提示（例如鑰匙圈/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、無終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過積極 Plugin 載入，讓無頭健康檢查保持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知的設定鍵，同時列出每個移除項目。
- `doctor --fix --non-interactive` 會回報遺失或過期的 Gateway 服務定義，但不會在更新修復模式以外安裝或重寫它們。對於遺失的服務，執行 `openclaw gateway install`；如果你刻意要取代啟動器，則執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測工作階段目錄中的孤立轉錄檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會讓它們留在原處。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版 cron 工作形狀，並可在排程器必須於執行階段自動正規化它們之前就地重寫。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該指令碼已不再維護，且當 cron 缺少 systemd 使用者匯流排環境時，可能會記錄錯誤的 WhatsApp Gateway 中斷。
- Doctor 會清理由較舊 OpenClaw 版本建立的舊版 Plugin 相依項暫存狀態。它也會修復設定所參照但遺失的可下載 Plugin，例如 `plugins.entries`、已設定的通道、已設定的提供者/搜尋設定，或已設定的代理程式執行階段。在套件更新期間，doctor 會略過套件管理器 Plugin 修復，直到套件替換完成；如果已設定的 Plugin 之後仍需要復原，請重新執行 `openclaw doctor --fix`。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin 項目供下一次修復嘗試使用。
- Doctor 會移除 `plugins.allow`/`plugins.entries` 中遺失的 Plugin ID，以及相符的懸空通道設定、Heartbeat 目標和通道模型覆寫，藉此修復過期的 Plugin 設定，前提是 Plugin 探索狀態健康。
- Doctor 會隔離無效的 Plugin 設定，方法是停用受影響的 `plugins.entries.<id>` 項目，並移除其無效的 `config` 承載。Gateway 啟動已經只會略過該不良 Plugin，因此其他 Plugin 和通道可以繼續執行。
- 當另一個監督器負責 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 和舊版服務清理。
- 在 Linux 上，doctor 會忽略未啟用的額外 Gateway 類 systemd 單元，並且不會在修復期間重寫執行中 systemd Gateway 服務的命令/進入點中繼資料。如果你刻意要取代作用中的啟動器，請先停止服務或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 和相關項目）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，如果唯一差異只是物件鍵順序，將不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒狀態檢查，並可在缺少嵌入認證時建議 `openclaw configure --section model`。
- Doctor 會在未設定命令擁有者時發出警告。命令擁有者是允許執行僅限擁有者命令並核准危險動作的人類操作員帳戶。DM 配對只會讓某人能與機器人交談；如果你在第一個擁有者 bootstrap 存在前核准過寄件者，請明確設定 `commands.ownerAllowFrom`。
- 當已設定 Codex 模式代理程式，且操作員的 Codex home 中存在個人 Codex CLI 資產時，Doctor 會發出警告。本機 Codex 應用程式伺服器啟動會使用隔離的每代理程式 home，因此請使用 `openclaw migrate codex --dry-run` 盤點應有意提升的資產。
- 當預設代理程式允許的 Skills 因缺少 bin、環境變數、設定或 OS 需求而無法在目前執行階段環境中使用時，Doctor 會發出警告。`doctor --fix` 可透過 `skills.entries.<skill>.enabled=false` 停用這些不可用的 Skills；如果你想保持該 skill 啟用，請改為安裝/設定缺少的需求。
- 如果已啟用沙箱模式但 Docker 不可用，doctor 會回報高訊號警告並附上修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版沙箱登錄檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報它們；`openclaw doctor --fix` 會將有效項目遷移到分片登錄目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入純文字後援認證。
- 如果通道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提前結束。
- 在狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳戶依賴環境後援，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 程序不可用時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram 權杖。如果權杖檢查不可用，doctor 會回報警告，並略過該次執行的自動解析。

## macOS：`launchctl` 環境變數覆寫

如果你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能導致持續的「未授權」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway doctor](/zh-TW/gateway/doctor)

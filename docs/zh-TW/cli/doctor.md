---
read_when:
    - 你遇到連線/身分驗證問題，並想要引導式修復
    - 你已完成更新，想要進行合理性檢查
summary: '`openclaw doctor` 的 CLI 參考（健康狀態檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-05-05T08:25:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 與通道的健康檢查 + 快速修復。

相關：

- 疑難排解：[疑難排解](/zh-TW/gateway/troubleshooting)
- 安全性稽核：[安全性](/zh-TW/gateway/security)

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
- `--yes`：不提示，直接接受預設值
- `--repair`：不提示即套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 指令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包含在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅執行安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務中的額外 Gateway 安裝，並回報最近的 Gateway supervisor 重新啟動交接

注意事項：

- 互動式提示（例如鑰匙圈/OAuth 修復）只會在 stdin 是 TTY 且未設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、沒有終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過預先載入 Plugin，讓無頭健康檢查保持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知的設定鍵，同時列出每個移除項目。
- `doctor --fix --non-interactive` 會回報遺失或過期的 Gateway 服務定義，但不會在更新修復模式之外安裝或重寫它們。若服務遺失，請執行 `openclaw gateway install`；若你有意替換啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會將它們保留原位。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版 Cron 工作形狀，並可在排程器必須於執行階段自動正規化它們之前就地重寫。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該腳本已不再維護，而且在 cron 缺少 systemd 使用者匯流排環境時，可能記錄錯誤的 WhatsApp Gateway 中斷。
- 啟用 WhatsApp 時，doctor 會檢查是否存在退化的 Gateway 事件迴圈，且仍有本機 `openclaw-tui` 用戶端在執行。`doctor --fix` 只會停止已驗證的本機 TUI 用戶端，因此 WhatsApp 回覆不會排在過期的 TUI 重新整理迴圈後面。
- Doctor 會清除較舊 OpenClaw 版本建立的舊版 Plugin 依賴 staging 狀態。它也會修復設定所參照但遺失的可下載 Plugin，例如 `plugins.entries`、已設定的通道、已設定的 provider/search 設定，或已設定的 agent runtime。在套件更新期間，doctor 會略過套件管理器 Plugin 修復，直到套件交換完成；如果設定的 Plugin 之後仍需要復原，請重新執行 `openclaw doctor --fix`。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin 項目供下一次修復嘗試使用。
- 當 Plugin 探索正常時，Doctor 會透過從 `plugins.allow`/`plugins.entries` 移除遺失的 Plugin ID，以及對應的懸空通道設定、Heartbeat 目標和通道模型覆寫，來修復過期的 Plugin 設定。
- Doctor 會隔離無效的 Plugin 設定，方式是停用受影響的 `plugins.entries.<id>` 項目，並移除其無效的 `config` payload。Gateway 啟動已經只會略過該壞掉的 Plugin，因此其他 Plugin 和通道仍可繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap，以及舊版服務清理。
- 在 Linux 上，doctor 會忽略未啟用的額外 Gateway 類 systemd unit，且在修復期間不會重寫執行中 systemd Gateway 服務的 command/entrypoint metadata。當你有意替換作用中的啟動器時，請先停止服務或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 等）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，如果唯一差異是物件鍵順序，將不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在缺少 embedding 憑證時建議執行 `openclaw configure --section model`。
- Doctor 會在沒有設定指令擁有者時發出警告。指令擁有者是允許執行僅限擁有者指令並核准危險動作的人類操作員帳號。DM pairing 只允許某人與 bot 對話；如果你曾在第一位擁有者 bootstrap 存在之前核准寄件者，請明確設定 `commands.ownerAllowFrom`。
- Doctor 會在已設定 Codex 模式 agent，且操作員的 Codex home 中存在個人 Codex CLI 資產時發出警告。本機 Codex app-server 啟動會使用隔離的每 agent home，因此請使用 `openclaw migrate codex --dry-run` 盤點應刻意提升的資產。
- Doctor 會在預設 agent 允許的技能因缺少 bin、env var、config 或 OS 需求，而無法在目前 runtime 環境中使用時發出警告。`doctor --fix` 可透過 `skills.entries.<skill>.enabled=false` 停用這些無法使用的技能；若你想保留技能啟用，請改為安裝/設定缺少的需求。
- 如果已啟用沙箱模式但 Docker 無法使用，doctor 會回報高訊號警告並附上修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版沙箱 registry 檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報它們；`openclaw doctor --fix` 會將有效項目遷移到分片 registry 目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前指令路徑中無法使用，doctor 會回報唯讀警告，且不會寫入純文字 fallback 憑證。
- 如果通道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續執行並回報警告，而不是提前結束。
- 狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 程序不可用時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前指令路徑中有可解析的 Telegram 權杖。如果權杖檢查不可用，doctor 會回報警告，並略過該次的自動解析。

## macOS：`launchctl` 環境變數覆寫

如果你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能造成持續的「未授權」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway doctor](/zh-TW/gateway/doctor)

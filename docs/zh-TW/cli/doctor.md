---
read_when:
    - 你遇到連線/驗證問題，並想要引導式修復
    - 你已更新並想要進行合理性檢查
summary: '`openclaw doctor` 的 CLI 參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-05-04T02:22:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 與通道的健康檢查與快速修復。

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
- `--repair`：不提示並套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 指令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅進行安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway token
- `--deep`：掃描系統服務以尋找額外的 Gateway 安裝

注意事項：

- 互動式提示（例如 keychain/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、沒有終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切 Plugin 載入，讓無頭健康檢查保持快速。互動式工作階段在檢查需要 Plugin 貢獻時仍會完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知設定鍵，列出每個移除項目。
- `doctor --fix --non-interactive` 會回報遺失或過期的 Gateway 服務定義，但不會在更新修復模式之外安裝或重寫它們。服務遺失時請執行 `openclaw gateway install`，或在你刻意要取代啟動器時執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會讓它們留在原位。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版 Cron job 形狀，並可在排程器於執行階段自動正規化它們之前就地重寫。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該指令碼已不再維護，且當 cron 缺少 systemd 使用者匯流排環境時，可能記錄錯誤的 WhatsApp Gateway 中斷。
- Doctor 會清理較舊 OpenClaw 版本建立的舊版 Plugin 相依性暫存狀態。當 registry 能解析時，它也會修復遺失的已設定可下載 Plugin，而 2026.5.2 doctor pass 會自動安裝舊設定已使用的可下載 Plugin，然後才將設定標記為該版本已觸碰。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin 項目供下次修復嘗試。
- Doctor 會透過從 `plugins.allow`/`plugins.entries` 移除遺失的 Plugin id，以及相符的懸空通道設定、Heartbeat 目標和通道模型覆寫，修復過期的 Plugin 設定，前提是 Plugin 探索狀態正常。
- Doctor 會隔離無效的 Plugin 設定，方法是停用受影響的 `plugins.entries.<id>` 項目並移除其無效的 `config` payload。Gateway 啟動時已只會略過該錯誤 Plugin，因此其他 Plugin 和通道可以繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap，以及舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外類 Gateway systemd units，且在修復期間不會重寫執行中 systemd Gateway 服務的 command/entrypoint metadata。若你刻意要取代作用中的啟動器，請先停止服務或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 和相關項目）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，若唯一差異是物件鍵順序，將不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在 embedding credentials 遺失時建議 `openclaw configure --section model`。
- Doctor 會在未設定 command owner 時發出警告。command owner 是被允許執行僅限 owner 指令並核准危險動作的人類操作員帳號。DM pairing 只讓某人能與 bot 對話；如果你在 first-owner bootstrap 存在前曾核准 sender，請明確設定 `commands.ownerAllowFrom`。
- Doctor 會在已設定 Codex-mode agents，且操作員的 Codex home 中存在個人 Codex CLI assets 時發出警告。本機 Codex app-server 啟動會使用每個 agent 隔離的 home，因此請使用 `openclaw migrate codex --dry-run` 盤點應刻意提升的 assets。
- Doctor 會在目前執行階段環境中，因為缺少 bins、env vars、config 或 OS requirements 而導致 default agent 允許的 skills 無法使用時發出警告。`doctor --fix` 可用 `skills.entries.<skill>.enabled=false` 停用這些無法使用的 skills；若你想保持 skill 作用中，請改為安裝/設定遺失的需求。
- 如果 sandbox mode 已啟用但 Docker 無法使用，doctor 會回報高訊號警告並附上補救方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版 sandbox registry 檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報它們；`openclaw doctor --fix` 會將有效項目遷移到分片 registry 目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在目前 command path 中無法使用，doctor 會回報唯讀警告，且不會寫入 plaintext fallback credentials。
- 如果通道 SecretRef 檢查在 fix path 中失敗，doctor 會繼續並回報警告，而不是提早退出。
- 狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 無法供 doctor process 使用時，doctor 會發出警告。
- Telegram `allowFrom` username 自動解析（`doctor --fix`）需要目前 command path 中有可解析的 Telegram token。如果 token 檢查無法使用，doctor 會回報警告，並略過該次 pass 的自動解析。

## macOS：`launchctl` env 覆寫

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

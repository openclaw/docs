---
read_when:
    - 你遇到連線/身分驗證問題，並想要引導式修復
    - 你已完成更新，並想進行健全性檢查
summary: '`openclaw doctor` 的 CLI 參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-05-03T21:28:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 和頻道的健康檢查 + 快速修復。

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
- `--force`：套用積極修復，包含在需要時覆寫自訂服務設定
- `--non-interactive`：不提示執行；僅限安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway token
- `--deep`：掃描系統服務以找出額外的 Gateway 安裝

注意事項：

- 互動式提示（例如鑰匙圈/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、沒有終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過預先載入 Plugin，讓無頭健康檢查保持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知設定鍵，同時列出每項移除。
- `doctor --fix --non-interactive` 會回報遺失或過期的 Gateway 服務定義，但不會在更新修復模式以外安裝或重寫它們。針對遺失的服務執行 `openclaw gateway install`，或在你刻意想取代啟動器時執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會讓它們保留原位。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）是否有舊版 Cron 工作形狀，並可在排程器必須於執行階段自動正規化它們之前就地重寫。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該腳本已不再維護，且在 cron 缺少 systemd user-bus 環境時，可能記錄錯誤的 WhatsApp Gateway 中斷。
- Doctor 會清除舊版 OpenClaw 建立的舊版 Plugin 依賴項 staging 狀態。當 registry 可解析缺少的已設定可下載 Plugin 時，也會修復它們，而 2026.5.2 doctor pass 會在將設定標記為該版本已觸碰之前，自動安裝較舊設定已使用的可下載 Plugin。
- Doctor 會透過從 `plugins.allow`/`plugins.entries` 移除缺少的 Plugin id，並在 Plugin 探索正常時移除相符的懸置頻道設定、Heartbeat 目標和頻道模型覆寫，來修復過期的 Plugin 設定。
- Doctor 會隔離無效的 Plugin 設定，方式是停用受影響的 `plugins.entries.<id>` 項目並移除其無效的 `config` payload。Gateway 啟動時已經只會略過該有問題的 Plugin，因此其他 Plugin 和頻道可以繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 和舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外類 Gateway systemd units，且在修復期間不會為執行中的 systemd Gateway 服務重寫 command/entrypoint metadata。當你刻意想取代作用中的啟動器時，請先停止服務或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 和相關項目）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，若唯一差異是物件鍵順序，就不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在缺少 embedding 憑證時建議 `openclaw configure --section model`。
- 當未設定命令擁有者時，Doctor 會發出警告。命令擁有者是允許執行僅限擁有者命令並核准危險動作的人類操作員帳號。DM 配對只允許某人與 bot 對話；如果你在第一個擁有者 bootstrap 存在之前核准了傳送者，請明確設定 `commands.ownerAllowFrom`。
- 當已設定 Codex-mode agents，且操作員的 Codex home 中存在個人 Codex CLI assets 時，Doctor 會發出警告。本機 Codex app-server 啟動會使用隔離的每 agent home，因此請使用 `openclaw migrate codex --dry-run` 來盤點應刻意提升的 assets。
- 當目前執行階段環境中缺少 bins、env vars、設定或 OS 需求，導致 default agent 允許的 Skills 無法使用時，Doctor 會發出警告。`doctor --fix` 可透過 `skills.entries.<skill>.enabled=false` 停用那些無法使用的 Skills；若你想保留該 skill 作用中，請改為安裝/設定缺少的需求。
- 如果已啟用 sandbox mode 但 Docker 無法使用，doctor 會回報高訊號警告並附上修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版 sandbox registry 檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報它們；`openclaw doctor --fix` 會將有效項目遷移到分片 registry 目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前命令路徑中無法使用，doctor 會回報唯讀警告，且不會寫入明文 fallback 憑證。
- 如果頻道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提早結束。
- 狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 doctor 程序無法使用 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram token。如果無法檢查 token，doctor 會回報警告，並略過該次 pass 的自動解析。

## macOS：`launchctl` env 覆寫

如果你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能造成持續的「unauthorized」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway doctor](/zh-TW/gateway/doctor)

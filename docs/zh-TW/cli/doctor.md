---
read_when:
    - 你遇到連線/驗證問題，並想要引導式修復
    - 你已完成更新，想做一次合理性檢查
summary: CLI 參考：`openclaw doctor`（健康檢查 + 引導式修復）
title: 診斷
x-i18n:
    generated_at: "2026-05-06T02:44:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

針對 Gateway 和通道的健康檢查 + 快速修復。

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
- `--repair`：不提示並套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 命令
- `--fix`：`--repair` 的別名
- `--force`：套用更積極的修復，包含在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅執行安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務中的額外 Gateway 安裝，並回報最近的 Gateway supervisor 重新啟動交接

注意事項：

- 互動式提示（例如 keychain/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、沒有終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切 Plugin 載入，讓無頭健康檢查維持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知設定鍵，列出每個移除項目。
- `doctor --fix --non-interactive` 會回報缺少或過期的 Gateway 服務定義，但不會在更新修復模式之外安裝或重寫它們。若缺少服務，請執行 `openclaw gateway install`；若你刻意要取代啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會將它們留在原處。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版 Cron 工作形狀，並可在排程器必須於執行階段自動正規化之前就地重寫它們。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該指令碼已不再維護，且當 cron 缺少 systemd 使用者匯流排環境時，可能會記錄錯誤的 WhatsApp Gateway 中斷。
- 啟用 WhatsApp 時，doctor 會檢查是否有退化的 Gateway 事件迴圈，且本機 `openclaw-tui` 用戶端仍在執行。`doctor --fix` 只會停止已驗證的本機 TUI 用戶端，讓 WhatsApp 回覆不會排在過期的 TUI 重新整理迴圈後面。
- Doctor 會將舊版 `openai-codex/*` 模型參照重寫為標準 `openai/*` 參照，範圍涵蓋主要模型、備援、Heartbeat/subagent/Compaction 覆寫、hooks、通道模型覆寫，以及過期的工作階段路由釘選。`--fix` 只有在 Codex Plugin 已安裝、已啟用、提供 `codex` harness，且具有可用 OAuth 時，才會選取 `agentRuntime.id: "codex"`；否則會選取 `agentRuntime.id: "pi"`，讓路由留在預設 OpenClaw runner 上。
- Doctor 會清理舊版 OpenClaw 建立的舊版 Plugin 相依項暫存狀態。它也會修復設定中參照但缺少的可下載 Plugin，例如 `plugins.entries`、已設定的通道、已設定的 provider/search 設定，或已設定的 agent runtime。在套件更新期間，doctor 會略過套件管理器 Plugin 修復，直到套件交換完成；如果已設定的 Plugin 之後仍需要復原，請重新執行 `openclaw doctor --fix`。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin 項目供下一次修復嘗試使用。
- 當 Plugin 探索健康時，Doctor 會移除 `plugins.allow`/`plugins.entries` 中缺失的 Plugin id，以及相符的懸置通道設定、Heartbeat 目標和通道模型覆寫，藉此修復過期的 Plugin 設定。
- Doctor 會透過停用受影響的 `plugins.entries.<id>` 項目並移除其無效的 `config` payload，隔離無效的 Plugin 設定。Gateway 啟動已經只會略過那個有問題的 Plugin，因此其他 Plugin 和通道可以繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 和舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外 Gateway 類 systemd unit，且在修復期間不會重寫執行中 systemd Gateway 服務的命令/進入點 metadata。若你刻意要取代作用中的啟動器，請先停止服務，或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 及相關項目）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 當唯一差異是物件鍵順序時，重複執行 `doctor --fix` 不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在缺少 embedding 憑證時建議執行 `openclaw configure --section model`。
- Doctor 會在未設定命令擁有者時發出警告。命令擁有者是允許執行僅限擁有者命令並核准危險操作的人類操作員帳號。DM 配對只允許某人與 bot 對話；如果你在第一位擁有者 bootstrap 存在之前核准過寄件者，請明確設定 `commands.ownerAllowFrom`。
- Doctor 會在設定 Codex 模式 agent 且操作員的 Codex home 中存在個人 Codex CLI 資產時發出警告。本機 Codex app-server 啟動會使用隔離的每 agent home，因此請使用 `openclaw migrate codex --dry-run` 清點應刻意提升的資產。
- Doctor 會在預設 agent 允許的 Skills 因缺少 bins、env vars、config 或 OS 需求，而無法在目前 runtime 環境中使用時發出警告。`doctor --fix` 可使用 `skills.entries.<skill>.enabled=false` 停用那些不可用的 Skills；若你想維持 Skills 作用中，請改為安裝/設定缺少的需求。
- 如果已啟用沙箱模式但 Docker 不可用，doctor 會回報高訊號警告並附上修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版沙箱 registry 檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報它們；`openclaw doctor --fix` 會將有效項目遷移到分片 registry 目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入明文 fallback 憑證。
- 如果通道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提早結束。
- 在狀態目錄遷移後，當啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 doctor 程序無法取得 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram 權杖。如果無法檢查權杖，doctor 會回報警告，並在該次執行中略過自動解析。

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

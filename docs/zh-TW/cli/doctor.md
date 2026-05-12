---
read_when:
    - 您遇到連線/身分驗證問題，並想要引導式修復
    - 你已更新並想進行合理性檢查
summary: CLI 參考：`openclaw doctor`（健康檢查 + 引導式修復）
title: 診斷
x-i18n:
    generated_at: "2026-05-12T08:45:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 與通道的健康檢查 + 快速修復。

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

若要檢查特定通道的權限，請使用通道探測，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

目標式 Discord 功能探測會回報機器人在該通道中的有效權限；狀態探測會稽核已設定的 Discord 通道與語音自動加入目標。

## 選項

- `--no-workspace-suggestions`：停用工作區記憶體/搜尋建議
- `--yes`：不提示，接受預設值
- `--repair`：不提示即套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 指令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不提示執行；僅限安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務以尋找額外的 Gateway 安裝，並回報近期的 Gateway supervisor 重新啟動交接

注意事項：

- 在 Nix 模式 (`OPENCLAW_NIX_MODE=1`) 中，唯讀 doctor 檢查仍可運作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 與 `doctor --generate-gateway-token` 會停用，因為 `openclaw.json` 是不可變的。請改為編輯此安裝的 Nix 來源；若使用 nix-openclaw，請使用以代理為優先的[快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 互動式提示（例如鑰匙圈/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無終端執行（cron、Telegram、沒有終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切 Plugin 載入，讓無終端健康檢查保持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知的設定鍵，同時列出每個移除項目。
- `doctor --fix --non-interactive` 會回報遺失或過期的 Gateway 服務定義，但不會在更新修復模式之外安裝或重寫它們。若服務遺失，請執行 `openclaw gateway install`；若你有意替換啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將其封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 與無終端執行會保留它們。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版 cron job 形狀，並可在排程器必須於執行階段自動正規化它們之前，就地重寫。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會警告；該指令碼已不再維護，且當 cron 缺少 systemd 使用者匯流排環境時，可能會記錄錯誤的 WhatsApp Gateway 中斷。
- 啟用 WhatsApp 時，doctor 會檢查是否存在 degraded Gateway 事件迴圈，且本機 `openclaw-tui` 用戶端仍在執行。`doctor --fix` 只會停止已驗證的本機 TUI 用戶端，因此 WhatsApp 回覆不會排在過期 TUI 重新整理迴圈之後。
- Doctor 會在主要模型、fallback、heartbeat/subagent/compaction 覆寫、hooks、通道模型覆寫，以及過期的工作階段路由綁定中，將舊版 `openai-codex/*` 模型參照重寫為標準 `openai/*` 參照。`--fix` 會將 Codex 意圖移至以 provider/model 為範圍的 `agentRuntime.id: "codex"` 項目、保留工作階段 auth-profile 綁定（例如 `openai-codex:...`）、移除過期的整個代理/工作階段 runtime 綁定，並讓已修復的 OpenAI 代理參照維持在 Codex 驗證路由上，而不是直接使用 OpenAI API-key 驗證。
- Doctor 會清理舊版 OpenClaw 建立的 Plugin 相依性暫存狀態，並為宣告主機 `openclaw` 套件為 peer dependency 的受管 npm Plugin 重新連結該套件。它也會修復由設定參照但遺失的可下載 Plugin，例如 `plugins.entries`、已設定通道、已設定的 provider/search 設定，或已設定的代理 runtime。在套件更新期間，doctor 會略過 package-manager Plugin 修復，直到套件交換完成；如果已設定的 Plugin 之後仍需要復原，請重新執行 `openclaw doctor --fix`。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin 項目以供下一次修復嘗試。
- 當 Plugin 探索正常時，Doctor 會透過從 `plugins.allow`/`plugins.deny`/`plugins.entries` 移除遺失的 Plugin id，加上對應的懸空通道設定、heartbeat 目標與通道模型覆寫，來修復過期的 Plugin 設定。
- Doctor 會隔離無效的 Plugin 設定，方法是停用受影響的 `plugins.entries.<id>` 項目，並移除其無效的 `config` payload。Gateway 啟動本來就只會略過該不良 Plugin，因此其他 Plugin 與通道可繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 與舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外 Gateway 類 systemd units，且在修復期間不會重寫執行中 systemd Gateway 服務的命令/entrypoint metadata。若你有意替換作用中的啟動器，請先停止服務，或使用 `openclaw gateway install --force`。
- Doctor 會將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 與相關設定）自動遷移到 `talk.provider` + `talk.providers.<provider>`。
- 當唯一差異是物件鍵順序時，重複執行 `doctor --fix` 不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在缺少 embedding 憑證時建議執行 `openclaw configure --section model`。
- 未設定命令擁有者時，Doctor 會發出警告。命令擁有者是允許執行僅限擁有者命令並核准危險操作的人類操作者帳號。DM 配對只允許某人與機器人交談；如果你在 first-owner bootstrap 存在之前核准過寄件者，請明確設定 `commands.ownerAllowFrom`。
- 當設定了 Codex 模式代理，且操作者的 Codex home 中存在個人 Codex CLI 資產時，Doctor 會發出警告。本機 Codex app-server 啟動會使用隔離的每代理 home，因此請使用 `openclaw migrate codex --dry-run` 來盤點應審慎提升的資產。
- Doctor 會移除已退役的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 一律保留 Codex 原生工作區工具為原生。
- 當預設代理允許的 Skills 因缺少 bins、env vars、config 或 OS 需求而無法在目前 runtime 環境中使用時，Doctor 會發出警告。`doctor --fix` 可使用 `skills.entries.<skill>.enabled=false` 停用這些不可用的 Skills；若你想保留該 skill 啟用，請改為安裝/設定缺少的需求。
- 如果 sandbox 模式已啟用但 Docker 不可用，doctor 會回報高訊號警告與修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版 sandbox registry 檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報它們；`openclaw doctor --fix` 會將有效項目遷移到分片 registry 目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入明文 fallback 憑證。
- 如果通道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提前結束。
- 在狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 程序不可用時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram 權杖。如果權杖檢查不可用，doctor 會回報警告，並略過該次執行的自動解析。

## macOS：`launchctl` env 覆寫

如果你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能導致持續性的「unauthorized」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway doctor](/zh-TW/gateway/doctor)

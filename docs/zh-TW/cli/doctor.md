---
read_when:
    - 您遇到連線或身分驗證問題，並想要取得引導式修復
    - 你已完成更新，想進行合理性檢查
summary: '`openclaw doctor` 的 CLI 參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-05-06T17:53:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
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
- `--yes`：不提示而接受預設值
- `--repair`：不提示而套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 命令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅執行安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway token
- `--deep`：掃描系統服務以尋找額外的 Gateway 安裝，並回報最近的 Gateway supervisor 重新啟動交接

注意事項：

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，唯讀 doctor 檢查仍可運作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 會被停用，因為 `openclaw.json` 是不可變的。請改為編輯此安裝的 Nix 來源；對於 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 互動式提示（例如 keychain/OAuth 修復）只會在 stdin 是 TTY 且 **未**設定 `--non-interactive` 時執行。無終端執行（cron、Telegram、無終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過預先載入 Plugin，讓無終端健康檢查保持快速。互動式工作階段在檢查需要 Plugin 貢獻時仍會完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知的設定鍵，列出每一個移除項目。
- `doctor --fix --non-interactive` 會回報缺少或過期的 Gateway 服務定義，但不會在更新修復模式之外安裝或重寫它們。若缺少服務，請執行 `openclaw gateway install`；若你有意取代啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 與無終端執行會將它們留在原處。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）以尋找舊版 Cron job 形狀，並可在排程器於執行時必須自動正規化之前，就地重寫它們。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該 script 已不再維護，且當 cron 缺少 systemd 使用者匯流排環境時，可能會記錄錯誤的 WhatsApp Gateway 中斷。
- 啟用 WhatsApp 時，doctor 會檢查是否有已降級的 Gateway event loop，且本機 `openclaw-tui` 用戶端仍在執行。`doctor --fix` 只會停止已驗證的本機 TUI 用戶端，讓 WhatsApp 回覆不會排在過期 TUI refresh loop 後方。
- Doctor 會將舊版 `openai-codex/*` model refs 重寫為正規 `openai/*` refs，涵蓋主要模型、fallback、Heartbeat/subagent/Compaction 覆寫、hooks、通道模型覆寫，以及過期的 session route pins。`--fix` 只會在 Codex Plugin 已安裝、已啟用、提供 `codex` harness，且有可用 OAuth 時選取 `agentRuntime.id: "codex"`；否則會選取 `agentRuntime.id: "pi"`，讓路由維持在預設 OpenClaw runner 上。
- Doctor 會清除由較舊 OpenClaw 版本建立的舊版 Plugin 相依 staging 狀態。它也會修復設定中參照的缺少可下載 Plugin，例如 `plugins.entries`、已設定通道、已設定 provider/search 設定，或已設定 agent runtimes。在 package 更新期間，doctor 會略過 package-manager Plugin 修復，直到 package 交換完成；如果已設定 Plugin 仍需要復原，請之後重新執行 `openclaw doctor --fix`。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin entry 以供下一次修復嘗試。
- Doctor 會修復過期 Plugin 設定，方式是在 Plugin discovery 健康時，從 `plugins.allow`/`plugins.entries` 移除缺少的 Plugin ids，以及相符的懸空通道設定、Heartbeat targets 和通道模型覆寫。
- Doctor 會隔離無效 Plugin 設定，方式是停用受影響的 `plugins.entries.<id>` entry，並移除其無效的 `config` payload。Gateway 啟動時已只會略過該不良 Plugin，因此其他 Plugin 與通道可繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 與舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外類 Gateway systemd units，且在修復期間不會重寫執行中 systemd Gateway 服務的命令/entrypoint metadata。若你有意取代作用中的啟動器，請先停止服務，或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版 flat Talk config（`talk.voiceId`、`talk.modelId` 及相關項目）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，若唯一差異是物件鍵順序，將不再回報/套用 Talk 正規化。
- Doctor 包含 memory-search 就緒檢查，並可在缺少 embedding credentials 時建議 `openclaw configure --section model`。
- Doctor 會在未設定命令擁有者時發出警告。命令擁有者是允許執行 owner-only 命令並核准危險動作的人類 operator 帳號。DM 配對只讓某人能與 bot 對話；如果你在 first-owner bootstrap 存在之前核准過 sender，請明確設定 `commands.ownerAllowFrom`。
- 當已設定 Codex-mode agents 且 operator 的 Codex home 中存在個人 Codex CLI assets 時，doctor 會發出警告。本機 Codex app-server 啟動會使用隔離的 per-agent homes，因此請使用 `openclaw migrate codex --dry-run` 清點應謹慎提升的 assets。
- 當預設 agent 允許的 Skills 因 bins、env vars、config 或 OS 需求缺少而在目前 runtime 環境中不可用時，doctor 會發出警告。`doctor --fix` 可以用 `skills.entries.<skill>.enabled=false` 停用這些不可用 Skills；若要保持 skill 作用中，請改為安裝/設定缺少的需求。
- 如果 sandbox mode 已啟用但 Docker 不可用，doctor 會回報高訊號警告並提供修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版 sandbox registry 檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報它們；`openclaw doctor --fix` 會將有效 entries 遷移到 sharded registry 目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入 plaintext fallback credentials。
- 如果通道 SecretRef inspection 在修復路徑中失敗，doctor 會繼續並回報警告，而不是提早結束。
- 在 state-directory migrations 後，當已啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor process 不可用時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中可解析的 Telegram token。如果 token inspection 不可用，doctor 會回報警告，並略過該次的自動解析。

## macOS：`launchctl` 環境變數覆寫

如果你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能造成持續性的「unauthorized」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway doctor](/zh-TW/gateway/doctor)

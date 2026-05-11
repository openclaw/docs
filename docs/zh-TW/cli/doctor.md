---
read_when:
    - 你遇到連線/身分驗證問題，並想要引導式修復
    - 你已完成更新，想做一次合理性檢查
summary: '`openclaw doctor` 的 CLI 參考資料（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-05-11T20:26:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 與頻道的健康檢查與快速修復。

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

針對頻道特定權限，請使用頻道探測，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

目標式 Discord 功能探測會回報 bot 的有效頻道權限；狀態探測會稽核已設定的 Discord 頻道與語音自動加入目標。

## 選項

- `--no-workspace-suggestions`：停用工作區記憶體/搜尋建議
- `--yes`：不提示並接受預設值
- `--repair`：不提示並套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 命令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包含在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅執行安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務中的額外 Gateway 安裝，並回報最近的 Gateway supervisor 重新啟動交接

注意：

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，唯讀 doctor 檢查仍可運作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 會被停用，因為 `openclaw.json` 不可變。請改為編輯此安裝的 Nix 來源；若使用 nix-openclaw，請使用 agent 優先的 [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 互動式提示（例如 keychain/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、沒有終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切 Plugin 載入，讓無頭健康檢查保持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知設定鍵，列出每個移除項目。
- `doctor --fix --non-interactive` 會回報缺少或過期的 Gateway 服務定義，但不會在更新修復模式之外安裝或重寫它們。若缺少服務，請執行 `openclaw gateway install`；若你刻意要取代啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 與無頭執行會將它們留在原處。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版 Cron 工作形狀，並可在排程器必須於執行階段自動正規化它們之前，就地重寫。
- 在 Linux 上，若使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh`，doctor 會發出警告；該指令碼已不再維護，且在 Cron 缺少 systemd user-bus 環境時，可能記錄錯誤的 WhatsApp Gateway 中斷。
- 啟用 WhatsApp 時，doctor 會檢查是否有降級的 Gateway 事件迴圈，且本機 `openclaw-tui` 用戶端仍在執行。`doctor --fix` 只會停止已驗證的本機 TUI 用戶端，避免 WhatsApp 回覆被排在過期 TUI 重新整理迴圈之後。
- Doctor 會將舊版 `openai-codex/*` 模型參照重寫為標準 `openai/*` 參照，涵蓋主要模型、fallback、heartbeat/subagent/compaction 覆寫、hooks、頻道模型覆寫，以及過期的 session route pins。`--fix` 會將 Codex 意圖移至 provider/model 範圍的 `agentRuntime.id: "codex"` 項目，保留 session auth-profile pins（例如 `openai-codex:...`），移除過期的整個 agent/session runtime pins，並讓修復後的 OpenAI agent 參照維持在 Codex auth routing，而不是直接使用 OpenAI API-key auth。
- Doctor 會清除由舊版 OpenClaw 建立的舊版 Plugin 相依性暫存狀態。它也會修復設定中引用但缺少的可下載 Plugin，例如 `plugins.entries`、已設定的頻道、已設定的 provider/search 設定，或已設定的 agent runtime。在套件更新期間，doctor 會略過 package-manager Plugin 修復，直到套件替換完成；若已設定的 Plugin 之後仍需要復原，請重新執行 `openclaw doctor --fix`。若下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin 項目供下一次修復嘗試使用。
- 當 Plugin 探索健康時，Doctor 會透過從 `plugins.allow`/`plugins.deny`/`plugins.entries` 移除缺少的 Plugin ID，加上相符的懸空頻道設定、Heartbeat 目標與頻道模型覆寫，來修復過期的 Plugin 設定。
- Doctor 會隔離無效的 Plugin 設定，方式是停用受影響的 `plugins.entries.<id>` 項目，並移除其無效的 `config` payload。Gateway 啟動時本來就只會略過該有問題的 Plugin，讓其他 Plugin 與頻道可持續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap，以及舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外 Gateway 類 systemd unit，且修復期間不會重寫執行中 systemd Gateway 服務的命令/進入點 metadata。若你刻意要取代作用中的啟動器，請先停止服務，或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 與相關項目）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，若唯一差異只是物件鍵順序，不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在缺少 embedding 憑證時建議 `openclaw configure --section model`。
- Doctor 會在未設定命令擁有者時發出警告。命令擁有者是允許執行僅限擁有者命令並核准危險動作的人類操作者帳號。DM 配對只允許某人與 bot 對話；若你在第一位擁有者 bootstrap 存在之前核准了傳送者，請明確設定 `commands.ownerAllowFrom`。
- Doctor 會在設定了 Codex 模式 agent，且操作者的 Codex home 中存在個人 Codex CLI 資產時發出警告。本機 Codex app-server 啟動會使用隔離的每 agent home，因此請使用 `openclaw migrate codex --dry-run` 清點應該有意提升的資產。
- Doctor 會移除已退役的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 一律讓 Codex 原生工作區工具保持原生。
- 當預設 agent 允許的 Skills 因為缺少 bin、env var、config 或 OS 需求而在目前 runtime 環境中不可用時，doctor 會發出警告。`doctor --fix` 可用 `skills.entries.<skill>.enabled=false` 停用那些不可用的 Skills；若你想讓該 Skills 保持作用中，請改為安裝/設定缺少的需求。
- 若已啟用 sandbox 模式但 Docker 不可用，doctor 會回報高訊號警告並提供修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 若存在舊版 sandbox registry 檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報；`openclaw doctor --fix` 會將有效項目遷移到分片 registry 目錄，並隔離無效的舊版檔案。
- 若 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入純文字 fallback 憑證。
- 若頻道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提早結束。
- 狀態目錄遷移後，若已啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 行程不可用，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram token。若 token 檢查不可用，doctor 會回報警告，並略過該次自動解析。

## macOS：`launchctl` env 覆寫

若你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能導致持續性的「unauthorized」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway doctor](/zh-TW/gateway/doctor)

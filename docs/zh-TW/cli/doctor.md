---
read_when:
    - 你遇到連線／身分驗證問題，並想要引導式修復
    - 你已完成更新，想做一次基本檢查
summary: '`openclaw doctor` 的 CLI 參考（健康檢查 + 引導式修復）'
title: 診斷工具
x-i18n:
    generated_at: "2026-05-10T19:27:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 與頻道的健康檢查與快速修復。

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

對於特定頻道的權限，請使用頻道探測，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

目標式 Discord 功能探測會回報機器人的有效頻道權限；狀態探測會稽核已設定的 Discord 頻道與語音自動加入目標。

## 選項

- `--no-workspace-suggestions`：停用工作區記憶體／搜尋建議
- `--yes`：不提示並接受預設值
- `--repair`：不提示並套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 命令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不提示執行；僅限安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務以尋找額外的 Gateway 安裝，並回報最近的 Gateway 監督器重新啟動交接

注意事項：

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，唯讀 doctor 檢查仍可運作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 與 `doctor --generate-gateway-token` 會停用，因為 `openclaw.json` 是不可變的。請改為編輯此安裝的 Nix 來源；若使用 nix-openclaw，請使用代理優先的[快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 互動式提示（例如鑰匙圈／OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無終端機執行（cron、Telegram、無終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切 Plugin 載入，讓無終端機健康檢查保持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知的設定鍵，列出每個移除項目。
- `doctor --fix --non-interactive` 會回報缺少或過期的 Gateway 服務定義，但在更新修復模式之外不會安裝或重寫它們。若缺少服務，請執行 `openclaw gateway install`；若你刻意想替換啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測工作階段目錄中的孤立逐字稿檔案。將其封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 與無終端機執行會將其保留在原處。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）以尋找舊版 cron 工作形狀，並可在排程器必須於執行階段自動正規化之前就地重寫。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會警告；該指令碼已不再維護，且當 cron 缺少 systemd 使用者匯流排環境時，可能記錄錯誤的 WhatsApp Gateway 中斷。
- 啟用 WhatsApp 時，doctor 會檢查是否存在降級的 Gateway 事件迴圈，且仍有本機 `openclaw-tui` 用戶端在執行。`doctor --fix` 只會停止已驗證的本機 TUI 用戶端，因此 WhatsApp 回覆不會排在過期的 TUI 重新整理迴圈後面。
- Doctor 會在主要模型、後援、Heartbeat／子代理／Compaction 覆寫、hook、頻道模型覆寫，以及過期的工作階段路由釘選中，將舊版 `openai-codex/*` 模型參照重寫為標準 `openai/*` 參照。`--fix` 會將 Codex 意圖移到以供應商／模型為範圍的 `agentRuntime.id: "codex"` 項目上，保留工作階段驗證設定檔釘選（例如 `openai-codex:...`），移除過期的整個代理／工作階段執行階段釘選，並讓已修復的 OpenAI 代理參照保持使用 Codex 驗證路由，而不是直接使用 OpenAI API 金鑰驗證。
- Doctor 會清理由較舊 OpenClaw 版本建立的舊版 Plugin 相依性暫存狀態。它也會修復設定所參照但遺失的可下載 Plugin，例如 `plugins.entries`、已設定頻道、已設定供應商／搜尋設定，或已設定代理執行階段。套件更新期間，doctor 會略過套件管理器 Plugin 修復，直到套件替換完成；若已設定的 Plugin 之後仍需復原，請重新執行 `openclaw doctor --fix`。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin 項目以供下一次修復嘗試。
- 當 Plugin 探索正常時，Doctor 會透過從 `plugins.allow`／`plugins.entries` 移除遺失的 Plugin ID，以及相符的懸置頻道設定、Heartbeat 目標與頻道模型覆寫，修復過期的 Plugin 設定。
- Doctor 會隔離無效的 Plugin 設定，方式是停用受影響的 `plugins.entries.<id>` 項目並移除其無效的 `config` 承載。Gateway 啟動時已只會略過該錯誤 Plugin，因此其他 Plugin 與頻道可以繼續執行。
- 當另一個監督器擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway／服務健康狀態並套用非服務修復，但會略過服務安裝／啟動／重新啟動／啟動程序與舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外 Gateway 類 systemd 單元，且在修復期間不會重寫執行中 systemd Gateway 服務的命令／進入點中繼資料。若你刻意想替換作用中的啟動器，請先停止服務，或使用 `openclaw gateway install --force`。
- Doctor 會將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 等）自動遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，若唯一差異是物件鍵順序，將不再回報／套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在缺少嵌入認證時建議 `openclaw configure --section model`。
- 未設定命令擁有者時，doctor 會發出警告。命令擁有者是獲准執行僅限擁有者命令並核准危險動作的人類操作員帳戶。DM 配對只允許某人與機器人交談；如果你在首次擁有者啟動程序存在之前已核准寄件者，請明確設定 `commands.ownerAllowFrom`。
- 當已設定 Codex 模式代理，且操作員的 Codex 主目錄中存在個人 Codex CLI 資產時，doctor 會發出警告。本機 Codex 應用程式伺服器啟動會使用隔離的每代理主目錄，因此請使用 `openclaw migrate codex --dry-run` 盤點應有意提升的資產。
- Doctor 會移除已淘汰的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex 應用程式伺服器一律讓 Codex 原生工作區工具保持原生。
- 當預設代理允許的 Skills 因缺少二進位檔、環境變數、設定或作業系統需求，而在目前執行階段環境中不可用時，doctor 會發出警告。`doctor --fix` 可使用 `skills.entries.<skill>.enabled=false` 停用那些不可用的 Skills；若你想保持該 skill 啟用，請改為安裝／設定缺少的需求。
- 如果已啟用沙箱模式但 Docker 不可用，doctor 會回報高訊號警告並附上修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版沙箱登錄檔（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報；`openclaw doctor --fix` 會將有效項目遷移到分片登錄目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`／`gateway.auth.password` 由 SecretRef 管理，且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入純文字後援認證。
- 如果在修復路徑中檢查頻道 SecretRef 失敗，doctor 會繼續並回報警告，而不是提早結束。
- 狀態目錄遷移之後，當已啟用的預設 Telegram 或 Discord 帳戶依賴環境後援，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 程序不可用時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram 權杖。如果無法檢查權杖，doctor 會回報警告，並略過該次自動解析。

## macOS：`launchctl` 環境覆寫

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

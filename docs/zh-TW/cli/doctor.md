---
read_when:
    - 你遇到連線/身分驗證問題，並想要取得引導式修正
    - 你已更新並想要進行健全性檢查
summary: '`openclaw doctor` 的 CLI 參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-05-07T13:14:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
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

針對通道特定權限，請使用通道探測，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

目標式 Discord 功能探測會回報機器人的有效通道權限；狀態探測會稽核已設定的 Discord 通道與語音自動加入目標。

## 選項

- `--no-workspace-suggestions`：停用工作區記憶體/搜尋建議
- `--yes`：不提示並接受預設值
- `--repair`：不提示並套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 指令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅執行安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務以尋找額外 Gateway 安裝，並回報近期 Gateway supervisor 重新啟動交接

注意：

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，唯讀 doctor 檢查仍可運作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 與 `doctor --generate-gateway-token` 會被停用，因為 `openclaw.json` 是不可變的。請改為編輯此安裝的 Nix 來源；若使用 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 互動式提示（例如鑰匙圈/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、無終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切 Plugin 載入，讓無頭健康檢查保持快速。互動式工作階段在檢查需要 Plugin 貢獻時仍會完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知設定鍵，列出每項移除。
- `doctor --fix --non-interactive` 會回報遺失或過時的 Gateway 服務定義，但不會在更新修復模式以外安裝或重寫它們。若服務遺失，請執行 `openclaw gateway install`；若你有意取代啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測工作階段目錄中的孤立逐字稿檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 與無頭執行會將它們保留在原位。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）以尋找舊版 Cron 作業形狀，並可在排程器必須於執行階段自動正規化之前，就地重寫它們。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該指令碼已不再維護，且在 Cron 缺少 systemd 使用者匯流排環境時，可能記錄錯誤的 WhatsApp Gateway 中斷。
- 啟用 WhatsApp 時，doctor 會檢查是否有降級的 Gateway 事件迴圈，且本機 `openclaw-tui` 用戶端仍在執行。`doctor --fix` 只會停止已驗證的本機 TUI 用戶端，因此 WhatsApp 回覆不會排在過時的 TUI 重新整理迴圈後面。
- Doctor 會將主要模型、後援、Heartbeat/子代理/Compaction 覆寫、hook、通道模型覆寫與過時工作階段路由釘選中的舊版 `openai-codex/*` 模型參照，重寫為標準 `openai/*` 參照。只有在 Codex Plugin 已安裝、已啟用、提供 `codex` harness，且有可用 OAuth 時，`--fix` 才會選擇 `agentRuntime.id: "codex"`；否則會選擇 `agentRuntime.id: "pi"`，使路由保持在預設 OpenClaw runner 上。
- Doctor 會清理較舊 OpenClaw 版本建立的舊版 Plugin 相依項暫存狀態。它也會修復設定所參照但遺失的可下載 Plugin，例如 `plugins.entries`、已設定通道、已設定 provider/搜尋設定，或已設定代理執行階段。在套件更新期間，doctor 會略過套件管理器 Plugin 修復，直到套件替換完成；若設定的 Plugin 仍需復原，請之後重新執行 `openclaw doctor --fix`。若下載失敗，doctor 會回報安裝錯誤，並保留已設定的 Plugin 項目以供下一次修復嘗試。
- 當 Plugin 探索正常時，Doctor 會透過從 `plugins.allow`/`plugins.entries` 移除遺失的 Plugin ID，加上相符的懸空通道設定、Heartbeat 目標與通道模型覆寫，來修復過時的 Plugin 設定。
- Doctor 會隔離無效的 Plugin 設定，停用受影響的 `plugins.entries.<id>` 項目，並移除其無效的 `config` payload。Gateway 啟動時本來就只會略過該不良 Plugin，因此其他 Plugin 與通道可繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 與舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外 Gateway 類 systemd 單元，並且在修復期間不會重寫執行中 systemd Gateway 服務的指令/進入點中繼資料。若你有意取代作用中的啟動器，請先停止服務，或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 及相關項目）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 當唯一差異是物件鍵順序時，重複執行 `doctor --fix` 不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在缺少 embedding 憑證時建議 `openclaw configure --section model`。
- 當未設定指令擁有者時，Doctor 會發出警告。指令擁有者是允許執行僅限擁有者指令並核准危險動作的人類操作者帳號。DM 配對只允許某人與機器人交談；如果你在第一位擁有者 bootstrap 存在前核准過寄件者，請明確設定 `commands.ownerAllowFrom`。
- 當已設定 Codex 模式代理，且操作者的 Codex home 中存在個人 Codex CLI 資產時，Doctor 會發出警告。本機 Codex app-server 啟動使用隔離的每代理 home，因此請使用 `openclaw migrate codex --dry-run` 清點應刻意提升的資產。
- 當預設代理允許的 Skills 因缺少二進位檔、環境變數、設定或 OS 需求而在目前執行階段環境中不可用時，Doctor 會發出警告。`doctor --fix` 可透過 `skills.entries.<skill>.enabled=false` 停用那些不可用的 Skills；若想保持該 skill 啟用，請改為安裝/設定缺少的需求。
- 如果已啟用 sandbox 模式但 Docker 不可用，doctor 會回報高訊號警告並附上修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版 sandbox registry 檔案（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`），doctor 會回報它們；`openclaw doctor --fix` 會將有效項目遷移到分片 registry 目錄，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前指令路徑中不可用，doctor 會回報唯讀警告，且不會寫入純文字後援憑證。
- 如果通道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提早結束。
- 在狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳號依賴環境後援，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 程序不可用時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前指令路徑中有可解析的 Telegram 權杖。如果權杖檢查不可用，doctor 會回報警告，並略過該次自動解析。

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

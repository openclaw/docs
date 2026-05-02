---
read_when:
    - 您遇到連線/身分驗證問題，並想要引導式修正
    - 你已更新並想要進行合理性檢查
summary: '`openclaw doctor` 的 CLI 參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-05-02T20:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
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

## 選項

- `--no-workspace-suggestions`：停用工作區記憶/搜尋建議
- `--yes`：不提示即接受預設值
- `--repair`：不提示即套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 命令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包含在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅限安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務中額外的 Gateway 安裝

注意事項：

- 互動式提示（例如鑰匙圈/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、沒有終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切 Plugin 載入，讓無頭健康檢查維持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知設定鍵，列出每個移除項目。
- `doctor --fix --non-interactive` 會回報遺失或過期的 Gateway 服務定義，但在更新修復模式之外不會安裝或重寫它們。對遺失的服務執行 `openclaw gateway install`，或在你刻意想取代啟動器時執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立轉錄檔。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會讓它們保留原位。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版 Cron 工作形狀，並可在排程器必須於執行階段自動標準化之前，就地重寫它們。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該指令碼已不再維護，且當 Cron 缺少 systemd 使用者匯流排環境時，可能記錄誤判的 WhatsApp Gateway 中斷。
- Doctor 會清理舊版 OpenClaw 建立的舊 Plugin 相依項暫存狀態。它也會在 registry 能解析遺失的已設定可下載 Plugin 時修復它們，而 2026.5.2 doctor pass 會在將設定標記為該版本已觸碰之前，自動安裝舊設定已使用的可下載 Plugin。
- Doctor 會移除 `plugins.allow`/`plugins.entries` 中遺失的 Plugin ID，以及在 Plugin 探索健康時移除相符的懸空通道設定、Heartbeat 目標和通道模型覆寫，以修復過期的 Plugin 設定。
- Doctor 會透過停用受影響的 `plugins.entries.<id>` 項目並移除其無效的 `config` payload，隔離無效的 Plugin 設定。Gateway 啟動已只會略過該錯誤 Plugin，因此其他 Plugin 與通道可以繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 和舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外 Gateway 類 systemd unit，且在修復期間不會重寫執行中 systemd Gateway 服務的命令/進入點中繼資料。當你刻意想取代作用中的啟動器時，請先停止服務或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 及相關項目）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，如果唯一差異是物件鍵順序，將不再回報/套用 Talk 標準化。
- Doctor 包含記憶搜尋就緒檢查，並可在缺少嵌入憑證時建議執行 `openclaw configure --section model`。
- 當未設定命令擁有者時，Doctor 會發出警告。命令擁有者是允許執行僅限擁有者命令並核准危險動作的人類操作員帳號。DM 配對只允許某人與 bot 對話；如果你在第一位擁有者 bootstrap 存在之前已核准某個寄件者，請明確設定 `commands.ownerAllowFrom`。
- 當設定了 Codex 模式代理，且操作員的 Codex home 中存在個人 Codex CLI 資產時，Doctor 會發出警告。本機 Codex app-server 啟動會使用每個代理隔離的 home，因此請使用 `openclaw migrate codex --dry-run` 盤點應刻意提升的資產。
- 當預設代理允許的 Skills 因缺少 bins、env vars、config 或 OS 要求，而在目前執行階段環境中不可用時，Doctor 會發出警告。`doctor --fix` 可用 `skills.entries.<skill>.enabled=false` 停用這些不可用的 Skills；若你想保持該 Skill 啟用，請改為安裝/設定遺失的要求。
- 如果已啟用沙盒模式但 Docker 不可用，doctor 會回報高訊號警告並附上修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入明文 fallback 憑證。
- 如果通道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提早結束。
- 狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 程序不可用時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram 權杖。如果權杖檢查不可用，doctor 會回報警告並略過該 pass 的自動解析。

## macOS：`launchctl` env 覆寫

如果你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能導致持續的「unauthorized」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway doctor](/zh-TW/gateway/doctor)

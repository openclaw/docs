---
read_when:
    - 你遇到連線/身分驗證問題，並想要引導式修復
    - 你已更新並想做一次合理性檢查
summary: '`openclaw doctor` 的 CLI 參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-05-02T02:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b15e5e5d062ae3e6f236775567b098d57ea6518171c0d45c78cab5b985e215e
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway 與頻道的健康檢查 + 快速修復。

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
- `--yes`：不提示，接受預設值
- `--repair`：不提示並套用建議的非服務修復；Gateway 服務安裝與重寫仍需要互動式確認或明確的 Gateway 命令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不使用提示執行；僅執行安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定 Gateway 權杖
- `--deep`：掃描系統服務以尋找額外的 Gateway 安裝

注意事項：

- 互動式提示（例如鑰匙圈/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（Cron、Telegram、無終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切載入 Plugin，讓無頭健康檢查保持快速。互動式工作階段仍會在檢查需要 Plugin 貢獻時完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知的設定鍵，列出每一項移除。
- `doctor --fix --non-interactive` 會回報缺失或過時的 Gateway 服務定義，但不會在更新修復模式之外安裝或重寫它們。若服務缺失，請執行 `openclaw gateway install`；若你刻意要替換啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立逐字稿檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 與無頭執行會讓它們保留原位。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）以尋找舊版 Cron 工作形狀，並可在排程器必須於執行階段自動正規化它們之前，就地重寫它們。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該指令碼已不再維護，且當 Cron 缺少 systemd 使用者匯流排環境時，可能記錄錯誤的 WhatsApp Gateway 中斷。
- Doctor 會清理由較舊 OpenClaw 版本建立的舊版 Plugin 相依性暫存狀態。當登錄可解析已設定的可下載 Plugin 時，它也會修復缺失項目。
- 當 Plugin 探索健康時，Doctor 會透過從 `plugins.allow`/`plugins.entries` 移除缺失的 Plugin ID，以及相符的懸置頻道設定、Heartbeat 目標與頻道模型覆寫，來修復過時的 Plugin 設定。
- Doctor 會隔離無效的 Plugin 設定，方式是停用受影響的 `plugins.entries.<id>` 項目，並移除其無效的 `config` 承載。Gateway 啟動時本來就只會略過該不良 Plugin，讓其他 Plugin 與頻道能繼續執行。
- 當另一個監督程式擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/啟動程序與舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外類 Gateway systemd 單元，並且在修復期間不會為正在執行的 systemd Gateway 服務重寫命令/進入點中繼資料。若你刻意要替換作用中的啟動器，請先停止服務或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 等）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，若唯一差異是物件鍵順序，將不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒檢查，並可在缺少嵌入憑證時建議 `openclaw configure --section model`。
- 當未設定命令擁有者時，Doctor 會發出警告。命令擁有者是允許執行僅限擁有者命令並核准危險動作的人類操作員帳戶。DM 配對只允許某人與 bot 對話；如果你在第一位擁有者啟動程序存在之前已核准某個寄件者，請明確設定 `commands.ownerAllowFrom`。
- 當已設定 Codex 模式代理，且操作員的 Codex 主目錄中存在個人 Codex CLI 資產時，Doctor 會發出警告。本機 Codex 應用程式伺服器啟動會使用隔離的個別代理主目錄，因此請使用 `openclaw migrate codex --dry-run` 盤點應刻意提升的資產。
- 如果已啟用沙盒模式但 Docker 無法使用，doctor 會回報高訊號警告並附上修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前命令路徑中無法使用，doctor 會回報唯讀警告，且不會寫入純文字備援憑證。
- 如果頻道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提前結束。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram 權杖。如果權杖檢查無法使用，doctor 會回報警告，並在該次執行中略過自動解析。

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

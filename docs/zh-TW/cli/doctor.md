---
read_when:
    - 你遇到連線/驗證問題，並想要取得引導式修復
    - 你已更新並想要進行合理性檢查
summary: '`openclaw doctor` 的 CLI 參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-04-30T02:53:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
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

- `--no-workspace-suggestions`：停用工作區記憶體/搜尋建議
- `--yes`：不提示即接受預設值
- `--repair`：不提示即套用建議的修復
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不顯示提示執行；僅進行安全遷移
- `--generate-gateway-token`：產生並設定 Gateway token
- `--deep`：掃描系統服務中的額外 Gateway 安裝

注意事項：

- 互動式提示（例如 keychain/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（cron、Telegram、沒有終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過急切 Plugin 載入，讓無頭健康檢查保持快速。互動式工作階段在檢查需要 Plugin 貢獻時，仍會完整載入 Plugin。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並移除未知設定鍵，同時列出每項移除項目。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將其封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會將其保留在原位。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版 cron job 形狀，並可在 scheduler 必須於執行階段自動正規化之前就地重寫。
- Doctor 會修復缺少的內建 Plugin 執行階段依賴項，而不寫入已封裝的全域安裝。對於 root 擁有的 npm 安裝或加固的 systemd unit，請將 `OPENCLAW_PLUGIN_STAGE_DIR` 設為可寫入目錄，例如 `/var/lib/openclaw/plugin-runtime-deps`；它也可以是路徑清單，例如 `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`，其中較前面的根目錄是唯讀查找層，最後一個根目錄是修復目標。
- Doctor 會透過從 `plugins.allow`/`plugins.entries` 移除遺失的 Plugin ID，以及在 Plugin 探索健康時移除相符的懸空通道設定、Heartbeat 目標和通道模型覆寫，來修復過期的 Plugin 設定。
- Doctor 會隔離無效的 Plugin 設定，方法是停用受影響的 `plugins.entries.<id>` 項目，並移除其無效的 `config` payload。Gateway 啟動時已經只會略過該壞掉的 Plugin，因此其他 Plugin 與通道可以繼續執行。
- 當另一個 supervisor 擁有 Gateway 生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報 Gateway/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 和舊版服務清理。
- 在 Linux 上，doctor 會忽略非使用中的額外類 Gateway systemd unit，且在修復期間不會為正在執行的 systemd Gateway 服務重寫 command/entrypoint metadata。當你有意替換作用中的 launcher 時，請先停止服務，或使用 `openclaw gateway install --force`。
- Doctor 會將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 及相關項目）自動遷移至 `talk.provider` + `talk.providers.<provider>`。
- 重複執行 `doctor --fix` 時，如果唯一差異是物件鍵順序，將不再回報/套用 Talk 正規化。
- Doctor 包含記憶體搜尋就緒狀態檢查，並可在缺少 embedding credentials 時建議 `openclaw configure --section model`。
- Doctor 會在未設定命令擁有者時發出警告。命令擁有者是允許執行僅限擁有者命令並核准危險動作的人類操作者帳號。DM pairing 只允許某人與 bot 對話；如果你在 first-owner bootstrap 存在前核准過寄件者，請明確設定 `commands.ownerAllowFrom`。
- 如果已啟用 sandbox mode 但 Docker 不可用，doctor 會回報高訊號警告並提供修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入明文 fallback credentials。
- 如果通道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提前結束。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram token。如果 token 檢查不可用，doctor 會回報警告，並在該次執行略過自動解析。

## macOS：`launchctl` env 覆寫

如果你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能導致持續的「未授權」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [Gateway doctor](/zh-TW/gateway/doctor)

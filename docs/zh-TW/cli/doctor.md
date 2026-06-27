---
read_when:
    - 你遇到連線或驗證問題，並想要引導式修復
    - 你已更新並想做一次健全性檢查
summary: '`openclaw doctor` 的命令列介面參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-06-27T19:04:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf7c07cd39053fce7efa81d968ef0f2666f6f5331581e72d2684843519c63b43
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

閘道與通道的健康檢查 + 快速修復。

相關：

- 疑難排解：[疑難排解](/zh-TW/gateway/troubleshooting)
- 安全稽核：[安全性](/zh-TW/gateway/security)

## 為何使用它

`openclaw doctor` 是 OpenClaw 的健康狀態介面。當閘道、
通道、外掛、Skills、模型路由、本機狀態或設定遷移
未如預期運作，而你想用一個命令說明
問題所在時，請使用它。

Doctor 有三種姿態：

| 姿態 | 命令                     | 行為                                                                            |
| ---- | ------------------------ | ------------------------------------------------------------------------------- |
| 檢查 | `openclaw doctor`        | 面向人類的檢查與引導式提示。                                                    |
| 修復 | `openclaw doctor --fix`  | 套用支援的修復；除非非互動式修復是安全的，否則會使用提示。                      |
| Lint | `openclaw doctor --lint` | 提供給 CI、預檢與審查閘門使用的唯讀結構化發現項目。                             |

當自動化需要穩定結果時，優先使用 `--lint`。當人類操作員
有意讓 doctor 編輯設定或狀態時，優先使用 `--fix`。

## 範例

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
```

如需通道特定權限，請使用通道探測，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

目標式 Discord capabilities 探測會回報 Bot 的有效通道權限；status 探測會稽核已設定的 Discord 通道與語音自動加入目標。

## 選項

- `--no-workspace-suggestions`：停用工作區記憶/搜尋建議
- `--yes`：不提示並接受預設值
- `--repair`：不提示並套用建議的非服務修復；閘道服務安裝與重寫仍需要互動式確認或明確的閘道命令
- `--fix`：`--repair` 的別名
- `--force`：套用積極修復，包括在需要時覆寫自訂服務設定
- `--non-interactive`：不使用提示執行；僅限安全遷移與非服務修復
- `--generate-gateway-token`：產生並設定閘道權杖
- `--allow-exec`：允許 doctor 在驗證秘密時執行已設定的 exec SecretRefs
- `--deep`：掃描系統服務以尋找額外的閘道安裝，並回報最近的 Gateway supervisor 重新啟動交接
- `--lint`：以唯讀模式執行現代化健康檢查，並輸出診斷發現項目
- `--post-upgrade`：執行升級後外掛相容性探測；將發現項目輸出至 stdout；若存在任何 error 層級發現項目，則以代碼 1 結束
- `--json`：搭配 `--lint` 時，輸出 JSON 發現項目而非人類可讀輸出；搭配 `--post-upgrade` 時，輸出機器可讀的 JSON 封套（`{ probesRun, findings }`）
- `--severity-min <level>`：搭配 `--lint` 時，捨棄低於 `info`、`warning` 或 `error` 的發現項目
- `--all`：搭配 `--lint` 時，執行所有已註冊檢查，包括從預設自動化集合中排除、需選擇啟用的檢查
- `--skip <id>`：搭配 `--lint` 時，略過某個檢查 id；可重複使用以略過多個檢查
- `--only <id>`：搭配 `--lint` 時，只執行某個檢查 id；可重複使用以執行一小組選取的檢查

## Lint 模式

`openclaw doctor --lint` 是 doctor 檢查的唯讀自動化姿態。
它使用結構化健康檢查路徑，不會提示，也不會修復
或重寫設定/狀態。當你想要機器可讀的發現項目，
而不是引導式修復提示時，請在 CI、預檢腳本與審查工作流程中使用它。
`--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 等 Lint 輸出選項
只會在搭配 `--lint` 時被接受。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
```

人類可讀輸出很精簡：

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON 輸出是 Lint 執行的腳本介面：

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

結束行為：

- `0`：在選取的嚴重性門檻或以上沒有發現項目
- `1`：至少有一個發現項目符合選取的門檻
- `2`：在可產生 Lint 發現項目之前發生命令/執行階段失敗

`--severity-min` 同時控制可見發現項目與結束門檻。例如，
`openclaw doctor --lint --severity-min error` 即使存在較低嚴重性的
`info` 或 `warning` 發現項目，也可能不列印任何發現項目並以 `0` 結束。

`--all` 會控制在嚴重性篩選之前要選取哪些檢查。
預設 Lint 執行是穩定的自動化閘門，並排除那些
因為深入、歷史性或較可能揭露可修復舊版殘留而
有意設為選擇啟用的檢查。當你想要完整的 Lint
清單，而不想逐一列出每個檢查 id 時，請使用 `--all`。
`--only <id>` 仍是最精確的選取器，並且可以依 id 執行任何已註冊檢查。

## 結構化健康檢查

現代 doctor 檢查使用小型結構化合約：

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` 支援 `doctor --lint`。`repair()` 是選用的，並且只會由
`doctor --fix` / `doctor --repair` 考慮。尚未遷移到此
形狀的檢查，會繼續使用舊版 doctor 貢獻流程。

這項分離是有意設計的：`detect()` 負責診斷，而 `repair()` 負責
回報它已變更或將會變更的內容。修復內容可攜帶
`dryRun`/`diff` 要求，修復結果也可以為
設定/檔案編輯回傳結構化 `diffs`，並為服務、程序、套件、狀態或其他
副作用回傳 `effects`。這讓已轉換的檢查可以逐步支援
`doctor --fix --dry-run` 與差異回報，而不必把變更規劃移入 `detect()`。

`repair()` 會透過 `status:
"repaired" | "skipped" | "failed"` 回報它是否嘗試了要求的修復。
省略狀態代表 `repaired`，因此簡單的修復檢查只需要回傳變更。
當修復回傳 `skipped` 或
`failed` 時，doctor 會回報原因，並且不會為該檢查執行驗證。

結構化修復成功後，doctor 會以
已修復的發現項目作為範圍重新執行 `detect()`。檢查可以使用選取的發現項目、路徑或 `ocPath`
值進行聚焦驗證。若發現項目仍然存在，doctor 會回報
修復警告，而不是把變更視為已悄悄完成。

發現項目包含：

| 欄位              | 用途                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | 用於 skip/only 篩選器與 CI allowlists 的穩定 id。       |
| `severity`        | `info`、`warning` 或 `error`。                         |
| `message`         | 人類可讀的問題陳述。                                   |
| `path`            | 可用時的設定、檔案或邏輯路徑。                         |
| `line` / `column` | 可用時的原始碼位置。                                   |
| `ocPath`          | 檢查能指向時的精確 `oc://` 位址。                      |
| `fixHint`         | 建議的操作員動作或修復摘要。                           |

現代化的核心 doctor 檢查會持續附掛在擁有其人類可讀
`doctor` / `doctor --fix` 行為的有序 doctor 貢獻上。共享結構化
健康註冊表是擴充點：一旦其所屬套件在作用中的
命令路徑中註冊，隨附與外掛支援的檢查會在
核心 doctor 檢查之後執行。`openclaw/plugin-sdk/health` 子路徑會向這些
擴充消費者公開相同合約。

## 檢查選取

當工作流程需要聚焦閘門時，請使用 `--only` 和 `--skip`：

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` 和 `--skip` 接受完整檢查 id，且可重複使用。如果某個 `--only`
id 未註冊，該 id 不會執行任何檢查；請使用命令的 `checksRun`
和 `checksSkipped` 欄位，確認聚焦閘門正在選取你
預期的檢查。

## 升級後模式

`openclaw doctor --post-upgrade` 會執行外掛相容性探測，設計為
串接在建置或升級之後。發現項目會輸出至 stdout；若任何發現項目具有
`level: "error"`，命令會以代碼 1 結束。加入 `--json` 可接收
機器可讀封套（`{ probesRun, findings }`），適用於 CI、
社群 `fork-upgrade` skill，以及其他升級後冒煙測試工具。若
已安裝的外掛索引遺失或格式錯誤，JSON 模式仍會輸出該
封套，並包含 `plugin.index_unavailable` error 發現項目。

注意事項：

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，唯讀 doctor 檢查仍可運作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 會停用，因為 `openclaw.json` 不可變。請改為編輯此安裝的 Nix 來源；若使用 nix-openclaw，請使用 agent-first [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 互動式提示（例如 keychain/OAuth 修復）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（排程、Telegram、無終端機）會略過提示。
- 效能：非互動式 `doctor` 執行會略過積極載入外掛，讓無頭健康檢查保持快速。互動式 doctor 工作階段仍會載入舊版健康與修復流程所需的外掛介面。
- `--lint` 比 `--non-interactive` 更嚴格：它一律為唯讀、絕不提示，也絕不套用安全遷移。當你想讓 doctor 進行變更時，請執行 `doctor --fix` 或 `doctor --repair`。
- 依預設，doctor 在檢查密鑰時不會執行 `exec` SecretRefs。只有在你有意讓 doctor 執行那些已設定的密鑰解析器時，才使用 `openclaw doctor --allow-exec` 或 `openclaw doctor --lint --allow-exec`。
- `--fix`（`--repair` 的別名）會將備份寫入 `~/.openclaw/openclaw.json.bak`，並刪除未知的設定鍵，列出每一項移除。
- 現代化的健康檢查可為 `doctor --fix` 暴露 `repair()` 路徑；未暴露該路徑的檢查會繼續走既有的 doctor 修復流程。
- `doctor --fix --non-interactive` 會回報缺失或過期的閘道服務定義，但不會在更新修復模式之外安裝或重寫它們。若服務缺失，請執行 `openclaw gateway install`；若你有意替換啟動器，請執行 `openclaw gateway install --force`。
- 狀態完整性檢查現在會偵測 sessions 目錄中的孤立 transcript 檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會保留它們原位。
- Doctor 也會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版排程工作形狀，並在將標準列匯入 SQLite 前重寫它們。
- Doctor 會回報含有明確 `payload.model` 覆寫的排程工作，包括 provider 命名空間計數，以及與 `agents.defaults.model` 的不相符處，讓不繼承預設模型的排程工作在 auth 或 billing 調查期間可見。
- 在 Linux 上，當使用者的 crontab 仍執行舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會發出警告；該指令碼已不再維護，且當排程缺少 systemd user-bus 環境時，可能記錄錯誤的 WhatsApp 閘道中斷。
- 啟用 WhatsApp 時，doctor 會檢查是否有已降級的閘道事件迴圈，且本機 `openclaw-tui` 用戶端仍在執行。`doctor --fix` 只會停止已驗證的本機終端介面用戶端，避免 WhatsApp 回覆排在過期終端介面重新整理迴圈之後。
- Doctor 會將舊版 `openai-codex/*` 模型參照重寫為標準 `openai/*` 參照，涵蓋主要模型、fallback、影像/影片生成模型、心跳偵測/subagent/壓縮覆寫、hooks、頻道模型覆寫，以及過期的 session route pins。`--fix` 也會將舊版 `openai-codex:*` auth profiles 和 `auth.order.openai-codex` entries 遷移到 `openai:*`，將 Codex intent 移至 provider/model-scoped `agentRuntime.id: "codex"` entries，移除過期的 whole-agent/session runtime pins，並讓已修復的 OpenAI agent refs 保持使用 Codex auth routing，而非直接使用 OpenAI API-key auth。
- Doctor 會清理較舊 OpenClaw 版本建立的舊版外掛相依 staging 狀態，並為宣告 host `openclaw` package 作為 peer dependency 的 managed npm 外掛重新連結該 package。它也會修復設定中參照但缺失的可下載外掛，例如 `plugins.entries`、已設定的頻道、已設定的 provider/search settings，或已設定的 agent runtimes。在套件更新期間，doctor 會略過 package-manager 外掛修復，直到套件替換完成；若已設定的外掛仍需要復原，之後請重新執行 `openclaw doctor --fix`。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的外掛項目以供下次修復嘗試。
- 當外掛探索狀態正常時，Doctor 會透過從 `plugins.allow`/`plugins.deny`/`plugins.entries` 移除缺失的外掛 id，並同步移除相符的懸空頻道設定、心跳偵測目標和頻道模型覆寫，來修復過期的外掛設定。
- Doctor 會隔離無效的外掛設定，方法是停用受影響的 `plugins.entries.<id>` 項目並移除其無效的 `config` payload。閘道啟動本來就只會略過該不良外掛，因此其他外掛和頻道可繼續執行。
- 當另一個 supervisor 擁有閘道生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報閘道/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/bootstrap 和舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外類閘道 systemd units，並且在修復期間不會為正在執行的 systemd 閘道服務重寫 command/entrypoint metadata。若你有意替換作用中的啟動器，請先停止服務或使用 `openclaw gateway install --force`。
- Doctor 會自動將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 等）遷移到 `talk.provider` + `talk.providers.<provider>`。
- 當唯一差異只是物件鍵順序時，重複執行 `doctor --fix` 不再回報/套用 Talk 正規化。
- Doctor 包含記憶搜尋就緒檢查，並可在缺少 embedding 憑證時建議 `openclaw configure --section model`。
- 未設定命令擁有者時，Doctor 會發出警告。命令擁有者是允許執行 owner-only commands 並核准危險動作的人類操作員帳號。DM pairing 只讓某人能與 bot 對話；如果你在 first-owner bootstrap 存在之前核准過某個 sender，請明確設定 `commands.ownerAllowFrom`。
- 當已設定 Codex-mode agents 且操作員的 Codex home 中存在個人 Codex 命令列介面資產時，Doctor 會回報一則資訊提示。本機 Codex app-server 啟動會使用隔離的 per-agent homes，因此若需要，請先安裝 Codex 外掛，然後使用 `openclaw migrate plan codex` 清點應審慎提升的資產。
- Doctor 會移除已淘汰的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 一律讓 Codex-native workspace tools 保持 native。
- 當預設 agent 允許的 Skills 因 bins、環境變數、設定或 OS 需求缺失而無法在目前 runtime environment 中使用時，Doctor 會發出警告。`doctor --fix` 可用 `skills.entries.<skill>.enabled=false` 停用那些不可用的 Skills；若你想保持該 Skill 啟用，請改為安裝/設定缺失的需求。
- 如果已啟用 sandbox mode 但 Docker 不可用，doctor 會回報高訊號警告並提供補救方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版 sandbox registry files 或 shard 目錄（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/`），doctor 會回報它們；`openclaw doctor --fix` 會將有效項目遷移到 SQLite，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入 plaintext fallback credentials。對於 exec-backed SecretRefs，除非存在 `--allow-exec`，否則 doctor 會略過執行。
- 如果頻道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提早退出。
- 狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳號依賴 env fallback，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 程序不可用時，doctor 會發出警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram token。如果 token 檢查不可用，doctor 會回報警告並略過該次的自動解析。

## macOS：`launchctl` 環境變數覆寫

如果你先前執行過 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），該值會覆寫你的設定檔，並可能造成持續的「unauthorized」錯誤。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相關

- [命令列介面參考](/zh-TW/cli)
- [閘道 doctor](/zh-TW/gateway/doctor)

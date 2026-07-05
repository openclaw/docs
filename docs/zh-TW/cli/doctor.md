---
read_when:
    - 你遇到連線/驗證問題，並想要取得引導式修復建議
    - 你已更新並想做一次健全性檢查
summary: '`openclaw doctor` 的命令列介面參考（健康檢查 + 引導式修復）'
title: 診斷
x-i18n:
    generated_at: "2026-07-05T11:11:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f79924f095b94ed839fa1088908c89603396fe06ea28becb989069f6b5d113bf
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

針對閘道、通道、外掛、Skills、模型路由、本機狀態與設定遷移的健康檢查與快速修復。每當某些行為不如預期，且你想用一個命令說明問題所在時，請使用它。

相關：

- 疑難排解：[疑難排解](/zh-TW/gateway/troubleshooting)
- 安全稽核：[安全性](/zh-TW/gateway/security)

## 模式

| 模式 | 命令                     | 行為                                                                       |
| ---- | ------------------------ | -------------------------------------------------------------------------- |
| 檢查 | `openclaw doctor`        | 面向人類的檢查與引導式提示。                                               |
| 修復 | `openclaw doctor --fix`  | 套用支援的修復；除非非互動式修復是安全的，否則會提示確認。                 |
| Lint | `openclaw doctor --lint` | 針對 CI、預檢與審查門檻的唯讀結構化發現項目。                              |

當自動化需要穩定結果時，偏好使用 `--lint`。當人工操作員希望 doctor 編輯設定或狀態時，偏好使用 `--fix`。

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

若是通道專屬權限，請使用通道探測，而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` 會回報機器人在特定通道目標上的有效權限。`channels status --probe` 會稽核所有已設定的通道與語音自動加入目標。

## 選項

| 選項                         | 效果                                                                                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions` | 停用工作區記憶體／搜尋建議。                                                                                                                                                          |
| `--yes`                      | 不提示並接受預設值。                                                                                                                                                                  |
| `--repair` / `--fix`         | 不提示並套用建議的非服務修復（`--fix` 是別名）。閘道服務安裝／重寫仍需要互動式確認或明確的 `gateway` 命令。                                                                           |
| `--force`                    | 套用積極修復，包括覆寫自訂服務設定。                                                                                                                                                  |
| `--non-interactive`          | 不使用提示執行；僅執行安全遷移與非服務修復。                                                                                                                                          |
| `--generate-gateway-token`   | 產生並設定閘道權杖。                                                                                                                                                                  |
| `--allow-exec`               | 驗證祕密時，允許 doctor 執行已設定的 `exec` SecretRefs。                                                                                                                              |
| `--deep`                     | 掃描系統服務以尋找額外的閘道安裝；回報最近的 Gateway supervisor 重新啟動交接。                                                                                                        |
| `--lint`                     | 以唯讀模式執行現代化健康檢查並輸出診斷發現項目。                                                                                                                                      |
| `--post-upgrade`             | 執行升級後外掛相容性探測；發現項目會輸出到 stdout；若存在任何錯誤等級的發現項目，結束碼為 1。                                                                                        |
| `--json`                     | 搭配 `--lint`：JSON 發現項目。搭配 `--post-upgrade`：機器可讀信封 `{ probesRun, findings }`。                                                                                         |
| `--severity-min <level>`     | 搭配 `--lint`：捨棄低於 `info`、`warning` 或 `error` 的發現項目。                                                                                                                      |
| `--all`                      | 搭配 `--lint`：執行所有已註冊檢查，包括預設集合中排除的選擇加入檢查。                                                                                                                 |
| `--skip <id>`                | 搭配 `--lint`：略過某個檢查 id。可重複。                                                                                                                                              |
| `--only <id>`                | 搭配 `--lint`：只執行指定的檢查 id。可重複。                                                                                                                                          |

`--json`、`--severity-min`、`--all`、`--only` 和 `--skip` 只能與 `--lint` 一起使用。

## Lint 模式

`openclaw doctor --lint` 是唯讀的：沒有提示、沒有修復、沒有設定／狀態重寫。

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

JSON 輸出是指令碼介面：

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

結束碼：

| 代碼 | 意義                                                       |
| ---- | ---------------------------------------------------------- |
| `0`  | 沒有達到或高於所選嚴重性門檻的發現項目。                 |
| `1`  | 至少一個發現項目符合所選門檻。                           |
| `2`  | 在可產生 lint 發現項目前發生命令／執行階段失敗。          |

`--severity-min` 會同時控制列印哪些發現項目以及結束門檻：`openclaw doctor --lint --severity-min error` 即使存在較低嚴重性的 `info`/`warning` 發現項目，也可能不列印任何內容並以 `0` 結束。

`--all` 會在嚴重性篩選前控制選取哪些檢查。預設 lint 執行會排除深度、歷史性，或較可能浮現可修復舊版殘留的檢查；請使用 `--all` 取得完整清單。`--only <id>` 是最精確的選擇器，可以依 id 執行任何已註冊檢查。

## 結構化健康檢查

現代 doctor 檢查使用小型分離合約：

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` 支援 `doctor --lint`。`repair()` 是選用的，且只會在 `doctor --fix` / `doctor --repair` 下執行。尚未遷移到此形狀的檢查仍使用舊版 doctor 貢獻流程。

修復內容可攜帶 `dryRun`/`diff` 請求；修復結果可回傳結構化 `diffs`（設定／檔案編輯）與 `effects`（服務、程序、套件、狀態或其他副作用），因此已轉換的檢查可以朝 `doctor --fix --dry-run` 成長，而不必把突變規劃移入 `detect()`。

`repair()` 會回報 `status: "repaired" | "skipped" | "failed"`（省略狀態表示 `repaired`）。當修復回傳 `skipped` 或 `failed` 時，doctor 會回報原因並略過該檢查的驗證。成功修復後，doctor 會以修復的發現項目為範圍重新執行 `detect()`；若發現項目仍然存在，doctor 會回報修復警告，而不是將變更視為完成。

發現項目包含：

| 欄位              | 用途                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | 用於 skip/only 篩選器與 CI 允許清單的穩定 id。         |
| `severity`        | `info`、`warning` 或 `error`。                         |
| `message`         | 人類可讀的問題陳述。                                  |
| `path`            | 可用時為設定、檔案或邏輯路徑。                        |
| `line` / `column` | 可用時為原始碼位置。                                  |
| `ocPath`          | 當檢查可指向某處時，提供精確的 `oc://` 位址。          |
| `fixHint`         | 建議的操作員動作或修復摘要。                          |

現代化核心 doctor 檢查仍附加在擁有其人類 `doctor` / `doctor --fix` 行為的有序 doctor 貢獻上。共用的結構化健康登錄是擴充點：一旦擁有套件在作用中的命令路徑註冊它們，內建與外掛支援的檢查會在核心 doctor 檢查後執行。`openclaw/plugin-sdk/health` 會向外掛作者公開相同合約。

## 檢查選取

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` 和 `--skip` 接受完整檢查 id，且可重複使用。若某個 `--only` id 未註冊，該 id 不會執行任何檢查；請使用輸出中的 `checksRun`/`checksSkipped`，確認聚焦門檻選取了你預期的檢查。

## 升級後模式

`openclaw doctor --post-upgrade` 會執行外掛相容性探測，以便串接在建置或升級之後。發現項目會輸出到 stdout；若任何發現項目具有 `level: "error"`，結束碼為 1。加入 `--json` 可取得機器可讀信封（`{ probesRun, findings }`），適用於 CI、社群 `fork-upgrade` skill，以及其他升級後冒煙測試工具。若已安裝外掛索引遺失或格式錯誤，JSON 模式仍會輸出信封，並帶有 `plugin.index_unavailable` 錯誤發現項目。

## 備註

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）中，唯讀 doctor 檢查仍可運作，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 會被停用，因為 `openclaw.json` 是不可變的。請改為編輯此安裝的 Nix 來源；對於 nix-openclaw，請使用以代理程式優先的 [快速開始](https://github.com/openclaw/nix-openclaw#quick-start)。
- 互動式提示（鑰匙圈/OAuth 修復等）只會在 stdin 是 TTY 且**未**設定 `--non-interactive` 時執行。無頭執行（排程、Telegram、沒有終端機）會略過提示。
- 非互動式 `doctor` 執行會略過積極載入外掛，讓無頭健康檢查保持快速。互動式工作階段仍會載入舊版健康/修復流程所需的外掛介面。
- `--lint` 比 `--non-interactive` 更嚴格：一律唯讀、絕不提示、絕不套用安全遷移。當你希望 doctor 進行變更時，請使用 `doctor --fix` 或 `doctor --repair`。
- Doctor 預設在檢查密鑰時不會執行 `exec` SecretRefs。只有在你明確希望 doctor 執行那些已設定的密鑰解析器時，才使用 `--allow-exec`（可搭配或不搭配 `--lint`）。
- 任何設定寫入（包括 `--fix` 修復）都會將備份輪替到 `~/.openclaw/openclaw.json.bak`（並使用編號 `.bak.1`..`.bak.4` 環）。`--fix` 也會移除結構描述驗證回報的未知設定鍵，並列出每一項移除；更新進行中時會略過此動作，避免部分寫入的升級狀態在遷移完成前被剝除。
- 當另一個監督程式擁有閘道生命週期時，請設定 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍會回報閘道/服務健康狀態並套用非服務修復，但會略過服務安裝/啟動/重新啟動/啟動程序，以及舊版服務清理。
- 在 Linux 上，doctor 會忽略非作用中的額外類閘道 systemd 單元，且在修復期間不會重寫執行中的 systemd 閘道服務的命令/進入點中繼資料。請先停止服務，或使用 `openclaw gateway install --force` 取代作用中的啟動器。
- `doctor --fix --non-interactive` 會回報缺少或過時的閘道服務定義，但在更新修復模式之外不會安裝或重寫它們。缺少服務時請執行 `openclaw gateway install`，或執行 `openclaw gateway install --force` 取代啟動器。
- 狀態完整性檢查會偵測 sessions 目錄中的孤立轉錄檔案。將它們封存為 `.deleted.<timestamp>` 需要互動式確認；`--fix`、`--yes` 和無頭執行會讓它們保留原位。
- Doctor 會掃描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）中的舊版排程工作形狀，並在將標準列匯入 SQLite 之前重寫它們。
- Doctor 會回報具有明確 `payload.model` 覆寫的排程工作，包括提供者命名空間計數，以及與 `agents.defaults.model` 的不符項，讓未繼承預設模型的排程工作在驗證或帳務調查期間可見。
- 在 Linux 上，當使用者的 crontab 仍執行未維護的舊版 `~/.openclaw/bin/ensure-whatsapp.sh` 時，doctor 會警告；當排程缺少 systemd 使用者匯流排環境時，該腳本可能誤報 `Gateway inactive`。
- 啟用 WhatsApp 時，doctor 會檢查是否存在已降級的閘道事件迴圈，且本機 `openclaw-tui` 用戶端仍在執行。`doctor --fix` 只會停止已驗證的本機終端介面用戶端，避免 WhatsApp 回覆排在過時終端介面重新整理迴圈之後。
- Doctor 會將舊版 `openai-codex/*` 模型參照重寫為標準 `openai/*` 參照，範圍涵蓋主要模型、備援、影像/影片生成模型、心跳偵測/子代理程式/壓縮覆寫、hook、頻道模型覆寫，以及過時的工作階段路由釘選。`--fix` 也會將舊版 `openai-codex:*` 驗證設定檔與 `auth.order.openai-codex` 項目遷移到 `openai:*`，將 Codex 意圖移至提供者/模型範圍的 `agentRuntime.id: "codex"` 項目，移除過時的整個代理程式/工作階段執行階段釘選，並讓修復後的 OpenAI 代理程式參照保留在 Codex 驗證路由上，而不是直接使用 OpenAI API 金鑰驗證。
- Doctor 會清除舊版 OpenClaw 版本中的舊外掛相依性暫存狀態，並為宣告主機 `openclaw` 套件為對等相依性的受管理 npm 外掛重新連結該套件。它也會修復設定所參照的缺少可下載外掛（`plugins.entries`、已設定頻道、已設定提供者/搜尋設定、已設定代理程式執行階段）。在套件更新期間，doctor 會略過套件管理器外掛修復，直到套件替換完成；之後如果已設定外掛仍需要復原，請重新執行 `openclaw doctor --fix`。如果下載失敗，doctor 會回報安裝錯誤，並保留已設定的外掛項目以供下一次修復嘗試。
- 當外掛探索健康時，Doctor 會透過從 `plugins.allow`/`plugins.deny`/`plugins.entries` 移除缺少的外掛 ID，加上相符的懸空頻道設定、心跳偵測目標和頻道模型覆寫，來修復過時的外掛設定。
- Doctor 會隔離無效外掛設定，方法是停用受影響的 `plugins.entries.<id>` 項目並移除其無效的 `config` 負載。閘道啟動本來就只會略過該錯誤外掛，因此其他外掛和頻道會繼續執行。
- Doctor 會移除已淘汰的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex app-server 一律讓 Codex 原生工作區工具保持原生。
- Doctor 會將舊版扁平 Talk 設定（`talk.voiceId`、`talk.modelId` 及相關項目）自動遷移到 `talk.provider` + `talk.providers.<provider>`。當唯一差異是物件鍵順序時，重複執行 `doctor --fix` 不再回報/套用 Talk 正規化。
- Doctor 包含記憶搜尋就緒檢查，並可在缺少嵌入憑證時建議 `openclaw configure --section model`。
- 當未設定命令擁有者時，Doctor 會警告。命令擁有者是允許執行僅限擁有者命令並核准危險動作的人類操作員帳號。DM 配對只允許某人與 bot 對話；如果你在第一位擁有者啟動程序存在之前核准了寄件者，請明確設定 `commands.ownerAllowFrom`。
- 當已設定 Codex 模式代理程式，且操作員的 Codex home 中存在個人 Codex 命令列介面資產時，Doctor 會回報資訊備註。本機 Codex app-server 啟動會使用隔離的每代理程式 home；如有需要，請先安裝 Codex 外掛，然後使用 `openclaw migrate plan codex` 清點應有意提升的資產。
- 當預設代理程式允許的 skills 在目前執行階段環境中不可用（缺少二進位檔、環境變數、設定或作業系統需求）時，Doctor 會警告。`doctor --fix` 可以用 `skills.entries.<skill>.enabled=false` 停用那些不可用的 skills；如果你想讓該 skill 保持啟用，請改為安裝/設定缺少的需求。
- 如果已啟用 sandbox 模式但 Docker 不可用，doctor 會回報高訊號警告，並提供修復方式（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果存在舊版 sandbox 登錄檔或分片目錄（`~/.openclaw/sandbox/containers.json`、`~/.openclaw/sandbox/browsers.json`、`~/.openclaw/sandbox/containers/` 或 `~/.openclaw/sandbox/browsers/`），doctor 會回報它們；`--fix` 會將有效項目遷移到 SQLite，並隔離無效的舊版檔案。
- 如果 `gateway.auth.token`/`gateway.auth.password` 由 SecretRef 管理，且在目前命令路徑中不可用，doctor 會回報唯讀警告，且不會寫入明文備援憑證。對於 exec 支援的 SecretRefs，doctor 會略過執行，除非存在 `--allow-exec`。
- 如果頻道 SecretRef 檢查在修復路徑中失敗，doctor 會繼續並回報警告，而不是提早結束。
- 狀態目錄遷移後，當已啟用的預設 Telegram 或 Discord 帳號依賴 env 備援，且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 對 doctor 程序不可用時，doctor 會警告。
- Telegram `allowFrom` 使用者名稱自動解析（`doctor --fix`）需要目前命令路徑中有可解析的 Telegram token。如果 token 檢查不可用，doctor 會回報警告，並略過該次自動解析。

## macOS：`launchctl` env 覆寫

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

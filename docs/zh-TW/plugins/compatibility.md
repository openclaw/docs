---
read_when:
    - 您維護一個 OpenClaw Plugin
    - 你會看到 Plugin 相容性警告
    - 你正在規劃 Plugin SDK 或資訊清單遷移
summary: Plugin 相容性契約、棄用中繼資料與遷移預期
title: Plugin 相容性
x-i18n:
    generated_at: "2026-04-30T03:23:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 會先透過具名相容性配接器維持舊版 Plugin 合約的接線，之後才移除它們。這能在 SDK、manifest、設定、config 和代理執行階段合約演進時，保護既有的內建與外部 Plugin。

## 相容性註冊表

Plugin 相容性合約會在核心註冊表中追蹤：
`src/plugins/compat/registry.ts`。

每筆記錄都有：

- 穩定的相容性代碼
- 狀態：`active`、`deprecated`、`removal-pending` 或 `removed`
- 擁有者：SDK、config、設定、通道、提供者、Plugin 執行、代理執行階段，或核心
- 適用時的引入與棄用日期
- 替代方案指引
- 涵蓋新舊行為的文件、診斷與測試

此註冊表是維護者規劃與未來 Plugin 檢查器檢查的來源。如果面向 Plugin 的行為有所變更，請在加入配接器的同一個變更中新增或更新相容性記錄。

Doctor 修復與遷移相容性會另外在
`src/commands/doctor/shared/deprecation-compat.ts` 追蹤。這些記錄涵蓋舊的 config 形狀、安裝帳本配置，以及在執行階段相容性路徑移除後可能仍需保留的修復 shim。

發布掃描應檢查這兩個註冊表。不要只因為對應的執行階段或 config 相容性記錄已到期，就刪除 doctor 遷移；請先確認沒有仍需要該修復的受支援升級路徑。另外，在發布規劃期間重新驗證每個替代方案註解，因為隨著提供者與通道移出核心，Plugin 擁有權與 config 覆蓋範圍可能會改變。

## Plugin 檢查器套件

Plugin 檢查器應位於核心 OpenClaw repo 之外，作為由版本化相容性與 manifest 合約支援的獨立套件/repository。

第一天的 CLI 應為：

```sh
openclaw-plugin-inspector ./my-plugin
```

它應輸出：

- manifest/schema 驗證
- 正在檢查的合約相容性版本
- 安裝/來源 metadata 檢查
- 冷路徑 import 檢查
- 棄用與相容性警告

在 CI 註解中使用 `--json` 取得穩定、機器可讀的輸出。OpenClaw 核心應公開檢查器可使用的合約與 fixtures，但不應從主要 `openclaw` 套件發布檢查器二進位檔。

### 維護者驗收路徑

針對 OpenClaw Plugin 套件驗證外部檢查器時，請使用 Blacksmith Testbox 執行可安裝套件驗收路徑。套件建置後，從乾淨的 OpenClaw checkout 執行：

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

將此路徑維持為維護者選用，因為它會安裝外部 npm 套件，且可能檢查在 repo 外部複製的 Plugin 套件。本機 repo 防護涵蓋 SDK export map、相容性註冊表 metadata、已棄用 SDK import 清理，以及內建 extension import 邊界；Testbox 檢查器證明則涵蓋外部 Plugin 作者實際使用的套件。

## 棄用政策

OpenClaw 不應在引入替代方案的同一個 release 中移除已記錄的 Plugin 合約。

遷移順序為：

1. 新增新合約。
2. 透過具名相容性配接器維持舊行為接線。
3. 在 Plugin 作者可採取行動時發出診斷或警告。
4. 記錄替代方案與時間表。
5. 測試新舊路徑。
6. 等待公告的遷移窗口結束。
7. 只有在獲得明確的破壞性 release 核准後才移除。

已棄用記錄必須包含警告開始日期、替代方案、文件連結，以及不超過警告開始後三個月的最終移除日期。不要新增移除窗口無期限的已棄用相容性路徑，除非維護者明確決定這是永久相容性，並改將其標記為 `active`。

## 目前的相容性區域

目前的相容性記錄包括：

- 舊版廣泛 SDK import，例如 `openclaw/plugin-sdk/compat`
- 舊版僅 hook Plugin 形狀與 `before_agent_start`
- 舊版 `activate(api)` Plugin 進入點，同時 Plugin 遷移至 `register(api)`
- 舊版 SDK alias，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 狀態 builder、`openclaw/plugin-sdk/test-utils`（由聚焦的 `openclaw/plugin-sdk/*` 測試子路徑取代），以及 `ClawdbotConfig` / `OpenClawSchemaType` 型別 alias
- 內建 Plugin allowlist 與啟用行為
- 舊版提供者/通道 env-var manifest metadata
- 舊版提供者 Plugin hook 與型別 alias，同時提供者移至明確的 catalog、auth、thinking、replay 與 transport hook
- 舊版執行階段 alias，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已棄用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 舊版記憶體 Plugin 分割註冊，同時記憶體 Plugin 移至 `registerMemoryCapability`
- 原生訊息 schema、mention gating、inbound envelope 格式化，以及 approval capability 巢狀結構的舊版通道 SDK helper
- 舊版通道路由 key 與 comparable-target helper alias，同時 Plugin 移至 `openclaw/plugin-sdk/channel-route`
- 正由 manifest contribution 擁有權取代的啟用提示
- 已棄用的隱式啟動 sidecar 載入，用於尚未宣告 `activation.onStartup` 的 Plugin；維護者可使用 `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` 測試未來更嚴格的行為
- `setup-api` 執行階段 fallback，同時設定描述元移至冷路徑 `setup.requiresRuntime: false` metadata
- 提供者 `discovery` hook，同時提供者 catalog hook 移至 `catalog.run(...)`
- 通道 `showConfigured` / `showInSetup` metadata，同時通道套件移至 `openclaw.channel.exposure`
- 舊版 runtime-policy config key，同時 doctor 將操作者遷移至 `agentRuntime`
- 產生的內建通道 config metadata fallback，同時 registry-first `channelConfigs` metadata 落地
- 持久化 Plugin 註冊表停用與安裝遷移 env flag，同時修復流程將操作者遷移至 `openclaw plugins registry --refresh` 與 `openclaw doctor --fix`
- 舊版 Plugin 擁有的網頁搜尋、網頁擷取與 x_search config 路徑，同時 doctor 將它們遷移至 `plugins.entries.<plugin>.config`
- 舊版 `plugins.installs` authored config 與內建 Plugin 載入路徑 alias，同時安裝 metadata 移入由狀態管理的 Plugin 帳本

新的 Plugin 程式碼應優先使用註冊表與特定遷移指南中列出的替代方案。既有 Plugin 可以持續使用相容性路徑，直到文件、診斷與 release notes 公告移除窗口。

## Release notes

Release notes 應包含即將到來的 Plugin 棄用項目、目標日期，以及遷移文件連結。該警告需要在相容性路徑移至 `removal-pending` 或 `removed` 之前發出。

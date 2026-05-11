---
read_when:
    - 你維護一個 OpenClaw Plugin
    - 你看到 Plugin 相容性警告
    - 您正在規劃 Plugin 軟體開發套件或資訊清單遷移
summary: Plugin 相容性契約、棄用中繼資料與遷移預期
title: Plugin 相容性
x-i18n:
    generated_at: "2026-05-11T20:33:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 會先透過具名相容性配接器維持舊版 Plugin 合約的連接，之後才移除它們。這能在 SDK、manifest、setup、config 與代理 runtime 合約演進時，保護既有的內建與外部 Plugin。

## 相容性註冊表

Plugin 相容性合約會在核心註冊表中追蹤：
`src/plugins/compat/registry.ts`。

每筆記錄包含：

- 穩定的相容性代碼
- 狀態：`active`、`deprecated`、`removal-pending` 或 `removed`
- 擁有者：SDK、config、setup、channel、provider、Plugin execution、agent runtime，
  或 core
- 適用時的引入與棄用日期
- 替代方案指引
- 涵蓋舊行為與新行為的文件、診斷與測試

此註冊表是維護者規劃與未來 Plugin inspector 檢查的來源。如果面向 Plugin 的行為有所變更，請在新增配接器的同一項變更中新增或更新相容性記錄。

Doctor 修復與遷移相容性會另外在
`src/commands/doctor/shared/deprecation-compat.ts` 追蹤。這些記錄涵蓋舊的 config 形狀、安裝 ledger 版面，以及在 runtime 相容性路徑移除後仍可能需要保留的修復 shim。

Release 掃描應檢查兩個註冊表。不要只因為對應的 runtime 或 config 相容性記錄已過期，就刪除 doctor 遷移；請先確認沒有仍需該修復的受支援升級路徑。此外，也要在 release 規劃期間重新驗證每個替代註解，因為隨著 provider 與 channel 移出 core，Plugin 擁有權與 config 涵蓋範圍可能會改變。

## Plugin inspector 套件

Plugin inspector 應位於核心 OpenClaw repo 之外，作為由版本化相容性與 manifest 合約支援的獨立套件/儲存庫。

第一天的 CLI 應為：

```sh
openclaw-plugin-inspector ./my-plugin
```

它應輸出：

- manifest/schema 驗證
- 正在檢查的合約相容性版本
- 安裝/來源中繼資料檢查
- cold-path import 檢查
- 棄用與相容性警告

在 CI 註解中使用 `--json` 取得穩定的機器可讀輸出。OpenClaw core 應公開 inspector 可使用的合約與 fixture，但不應從主要 `openclaw` 套件發布 inspector 二進位檔。

### 維護者驗收通道

驗證外部 inspector 對 OpenClaw Plugin 套件的支援時，請使用 Crabbox 支援的 Blacksmith Testbox 作為可安裝套件驗收通道。套件建置完成後，從乾淨的 OpenClaw checkout 執行：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

此通道應維持為維護者選用，因為它會安裝外部 npm 套件，且可能檢查在 repo 外 clone 的 Plugin 套件。本機 repo 防護涵蓋 SDK export map、相容性註冊表中繼資料、已棄用 SDK import 清除進度，以及內建 extension import 邊界；Testbox inspector 證明涵蓋外部 Plugin 作者實際使用的套件。

## 棄用政策

OpenClaw 不應在同一個 release 中移除已文件化的 Plugin 合約並同時引入其替代項。

遷移順序如下：

1. 新增新合約。
2. 透過具名相容性配接器維持舊行為連接。
3. 在 Plugin 作者可以採取行動時發出診斷或警告。
4. 記錄替代方案與時程。
5. 測試舊路徑與新路徑。
6. 等待已公告的遷移窗口結束。
7. 只有在明確核准 breaking-release 後才移除。

已棄用記錄必須包含警告開始日期、替代項、文件連結，以及不晚於警告開始後三個月的最終移除日期。除非維護者明確決定它是永久相容性並改標為 `active`，否則不要新增具有無期限移除窗口的已棄用相容性路徑。

## 目前的相容性領域

目前的相容性記錄包含：

- 舊版寬泛 SDK import，例如 `openclaw/plugin-sdk/compat`
- 舊版僅 hook 的 Plugin 形狀與 `before_agent_start`
- 在 Plugin 遷移至 `register(api)` 期間的舊版 `activate(api)` Plugin 進入點
- 舊版 SDK alias，例如 `openclaw/extension-api`、
  `openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  status builders、`openclaw/plugin-sdk/test-utils`（由聚焦的
  `openclaw/plugin-sdk/*` test subpath 取代），以及 `ClawdbotConfig` /
  `OpenClawSchemaType` 型別 alias
- 內建 Plugin allowlist 與啟用行為
- 舊版 provider/channel env-var manifest 中繼資料
- 在 provider 移至明確的 catalog、auth、thinking、replay 與 transport hook 期間的舊版 provider Plugin hook 與型別 alias
- 舊版 runtime alias，例如 `api.runtime.taskFlow`、
  `api.runtime.subagent.getSession`、`api.runtime.stt`，以及已棄用的
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 在 memory Plugin 移至 `registerMemoryCapability` 期間的舊版 memory-plugin 分離註冊
- 用於原生訊息 schema、mention gating、inbound envelope formatting 與 approval capability nesting 的舊版 channel SDK helper
- 在 Plugin 移至 `openclaw/plugin-sdk/channel-route` 期間的舊版 channel route key 與 comparable-target helper alias
- 正由 manifest contribution ownership 取代的 activation hint
- 在 setup descriptor 移至 cold `setup.requiresRuntime: false` 中繼資料期間的 `setup-api` runtime fallback
- 在 provider catalog hook 移至 `catalog.run(...)` 期間的 provider `discovery` hook
- 在 channel 套件移至 `openclaw.channel.exposure` 期間的 channel `showConfigured` / `showInSetup` 中繼資料
- 在 doctor 將 operator 遷移至 `agentRuntime` 期間的舊版 runtime-policy config key
- 在 registry-first `channelConfigs` 中繼資料落地期間的產生式內建 channel config 中繼資料 fallback
- 在修復流程將 operator 遷移至 `openclaw plugins registry --refresh` 與
  `openclaw doctor --fix` 期間的持久化 Plugin registry disable 與 install-migration env flag
- 在 doctor 將它們遷移至 `plugins.entries.<plugin>.config` 期間的舊版 Plugin 擁有 web search、web fetch 與 x_search config path
- 在 install metadata 移入狀態管理的 Plugin ledger 期間的舊版 `plugins.installs` authored config 與內建 Plugin load-path alias

新的 Plugin code 應優先使用註冊表與特定遷移指南中列出的替代項。既有 Plugin 可以持續使用相容性路徑，直到文件、診斷與 release notes 公告移除窗口。

## Release notes

Release notes 應包含即將到來的 Plugin 棄用項目、目標日期，以及遷移文件連結。此警告需要在相容性路徑移至 `removal-pending` 或 `removed` 之前發出。

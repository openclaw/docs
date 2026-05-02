---
read_when:
    - 您維護一個 OpenClaw Plugin
    - 你看到 Plugin 相容性警告
    - 你正在規劃 Plugin SDK 或資訊清單遷移
summary: Plugin 相容性合約、棄用中繼資料與遷移預期
title: Plugin 相容性
x-i18n:
    generated_at: "2026-05-02T02:55:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 會在移除較舊的 Plugin 合約之前，透過具名相容性
配接器維持其連接。這能在 SDK、manifest、設定、config，以及 agent runtime 合約
演進時，保護既有的內建與外部 Plugin。

## 相容性登錄

Plugin 相容性合約會在核心登錄中追蹤，位置是
`src/plugins/compat/registry.ts`。

每筆記錄包含：

- 穩定的相容性代碼
- 狀態：`active`、`deprecated`、`removal-pending` 或 `removed`
- 擁有者：SDK、config、設定、channel、provider、Plugin 執行、agent runtime，
  或 core
- 適用時的導入與棄用日期
- 替代方案指引
- 涵蓋舊行為與新行為的文件、診斷與測試

此登錄是維護者規劃與未來 Plugin 檢查器檢查的來源。如果面向 Plugin 的行為有所變更，
請在加入配接器的同一項變更中新增或更新相容性記錄。

Doctor 修復與遷移相容性會另行追蹤於
`src/commands/doctor/shared/deprecation-compat.ts`。這些記錄涵蓋舊的
config 形狀、安裝 ledger 版面，以及在 runtime 相容性路徑移除後可能仍需保留的
修復 shim。

發布掃描應檢查兩個登錄。不要只因相符的 runtime 或 config 相容性記錄到期，就刪除
doctor 遷移；請先確認沒有仍需要該修復的受支援升級路徑。此外，發布規劃期間也要重新驗證每個替代方案註記，
因為隨著 provider 與 channel 移出核心，Plugin 擁有權與 config 涵蓋範圍可能會改變。

## Plugin 檢查器套件

Plugin 檢查器應位於核心 OpenClaw repo 之外，作為由版本化相容性與 manifest
合約支援的獨立套件/儲存庫。

第一天的 CLI 應為：

```sh
openclaw-plugin-inspector ./my-plugin
```

它應輸出：

- manifest/schema 驗證
- 正在檢查的合約相容性版本
- 安裝/來源 metadata 檢查
- cold-path import 檢查
- 棄用與相容性警告

在 CI 註解中使用 `--json` 取得穩定的機器可讀輸出。OpenClaw
核心應公開檢查器可取用的合約與 fixture，但不應從主要 `openclaw` 套件發布檢查器二進位檔。

### 維護者驗收通道

驗證外部檢查器對 OpenClaw Plugin 套件的行為時，請使用 Blacksmith Testbox
作為可安裝套件驗收通道。套件建置完成後，從乾淨的 OpenClaw checkout 執行：

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

讓此通道維持為維護者選用，因為它會安裝外部 npm 套件，並可能檢查在 repo 外複製的
Plugin 套件。本機 repo 防護涵蓋 SDK export map、相容性登錄 metadata、
已棄用 SDK-import 的消減，以及內建 extension import 邊界；Testbox 檢查器
證明則涵蓋外部 Plugin 作者實際取用該套件的方式。

## 棄用政策

OpenClaw 不應在導入替代方案的同一個版本中，移除已文件化的 Plugin 合約。

遷移順序如下：

1. 新增新的合約。
2. 透過具名相容性配接器維持舊行為連接。
3. 在 Plugin 作者能採取行動時發出診斷或警告。
4. 記錄替代方案與時程。
5. 測試新舊兩條路徑。
6. 等待已公告的遷移窗口期。
7. 只有在明確核准 breaking release 後才移除。

已棄用記錄必須包含警告開始日期、替代方案、文件連結，以及不晚於警告開始後三個月的最終移除日期。
除非維護者明確決定這是永久相容性並將其標記為 `active`，否則不要新增移除窗口期開放未定的
已棄用相容性路徑。

## 目前的相容性區域

目前的相容性記錄包括：

- 舊版寬泛 SDK import，例如 `openclaw/plugin-sdk/compat`
- 舊版僅 hook Plugin 形狀與 `before_agent_start`
- 在 Plugin 遷移到 `register(api)` 期間保留的舊版 `activate(api)` Plugin 進入點
- 舊版 SDK alias，例如 `openclaw/extension-api`、
  `openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  狀態 builder、`openclaw/plugin-sdk/test-utils`（由聚焦的
  `openclaw/plugin-sdk/*` 測試子路徑取代），以及 `ClawdbotConfig` /
  `OpenClawSchemaType` 型別 alias
- 內建 Plugin allowlist 與啟用行為
- 舊版 provider/channel env-var manifest metadata
- 當 provider 移至明確的 catalog、auth、thinking、replay 與 transport hook 時保留的舊版 provider Plugin hook 與型別 alias
- 舊版 runtime alias，例如 `api.runtime.taskFlow`、
  `api.runtime.subagent.getSession`、`api.runtime.stt`，以及已棄用的
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- 當 memory Plugin 移至 `registerMemoryCapability` 時保留的舊版 memory-Plugin 分拆註冊
- 用於原生訊息 schema、mention gating、入站 envelope 格式化，以及 approval capability 巢狀結構的舊版 channel SDK helper
- 當 Plugin 移至 `openclaw/plugin-sdk/channel-route` 時保留的舊版 channel route key 與 comparable-target helper alias
- 正由 manifest contribution 擁有權取代的 activation hint
- 當設定描述子移至 cold `setup.requiresRuntime: false` metadata 時保留的 `setup-api` runtime fallback
- 當 provider catalog hook 移至 `catalog.run(...)` 時保留的 provider `discovery` hook
- 當 channel 套件移至 `openclaw.channel.exposure` 時保留的 channel `showConfigured` / `showInSetup` metadata
- 當 doctor 將 operator 遷移至 `agentRuntime` 時保留的舊版 runtime-policy config key
- 當 registry-first `channelConfigs` metadata 落地時保留的已產生內建 channel config metadata fallback
- 持久化 Plugin 登錄停用與 install-migration env flag，同時修復流程會將 operator 遷移至
  `openclaw plugins registry --refresh` 與
  `openclaw doctor --fix`
- 舊版 Plugin 擁有的 web search、web fetch 與 x_search config 路徑，同時 doctor 會將它們遷移至 `plugins.entries.<plugin>.config`
- 舊版 `plugins.installs` authored config 與內建 Plugin load-path
  alias，同時安裝 metadata 會移入狀態管理的 Plugin ledger

新的 Plugin 程式碼應優先使用登錄與特定遷移指南中列出的替代方案。既有 Plugin 可以繼續使用相容性路徑，
直到文件、診斷與發布說明公告移除窗口期。

## 發布說明

發布說明應包含即將到來的 Plugin 棄用項目、目標日期，以及遷移文件連結。這項警告需要在相容性路徑移至
`removal-pending` 或 `removed` 之前發生。

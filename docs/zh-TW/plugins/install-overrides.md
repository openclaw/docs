---
read_when:
    - 針對本機封裝的外掛測試新手引導或設定流程
    - 發布外掛套件前進行驗證
    - 以測試成品取代自動安裝的外掛
sidebarTitle: Install overrides
summary: 使用設定階段的安裝流程測試封裝外掛覆寫設定
title: 外掛安裝覆寫
x-i18n:
    generated_at: "2026-07-11T21:34:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

外掛安裝覆寫可讓維護者在設定期間，將外掛安裝指向特定的 npm 套件或本機 `npm pack` 壓縮檔，而不是目錄、內建或預設的 npm 來源。此功能僅供 E2E 與套件驗證使用；一般使用者應使用 [`openclaw plugins install`](/zh-TW/cli/plugins) 安裝外掛。

<Warning>
覆寫會執行您所提供來源中的外掛程式碼。請僅在隔離的狀態目錄或可拋棄的測試機器中使用。
</Warning>

## 環境

除非同時設定以下兩個變數，否則覆寫功能會停用：

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

覆寫對應表是以外掛 ID 為鍵的 JSON。值支援：

| 前綴                  | 來源                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | 登錄檔套件、確切版本或標籤                                                                       |
| `npm-pack:<path.tgz>` | 由 `npm pack` 產生的本機壓縮檔；相對路徑會從目前的工作目錄解析                                     |

## 行為

當設定期間的流程安裝某個 ID 出現在對應表中的外掛時，OpenClaw 會使用覆寫來源，而不是目錄、內建或預設的 npm 來源。這適用於初始設定，以及任何使用共用設定期外掛安裝程式的其他流程。

- 覆寫仍會強制要求符合預期的外掛 ID：對應至 `codex` 的壓縮檔必須安裝資訊清單 ID 為 `codex` 的外掛。
- 覆寫不會繼承官方可信任來源狀態。即使目錄項目通常代表 OpenClaw 擁有的套件，覆寫仍會被視為由操作者提供的測試輸入。
- 工作區 `.env` 檔案無法啟用安裝覆寫；這兩個環境變數都列於工作區 dotenv 封鎖清單中。請在啟動 OpenClaw 的可信任 shell、CI 工作或遠端測試命令中設定它們。

## 套件 E2E

請使用隔離的狀態目錄，避免套件安裝與安裝記錄影響您正常的 OpenClaw 狀態：

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

在狀態目錄下驗證已安裝的套件：

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

若要執行即時供應商 E2E，請先從可信任的 shell 或 CI 密鑰載入真實 API 金鑰，再啟動測試命令。請勿輸出金鑰；僅回報來源以及金鑰是否存在。

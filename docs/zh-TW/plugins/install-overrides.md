---
read_when:
    - 測試針對本機打包外掛的入門或設定流程
    - 發布外掛套件前進行驗證
    - 將自動外掛安裝取代為測試成品
sidebarTitle: Install overrides
summary: 使用設定期間安裝流程測試已封裝外掛覆寫
title: 外掛安裝覆寫
x-i18n:
    generated_at: "2026-07-05T11:31:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

外掛安裝覆寫可讓維護者在設定期間安裝外掛時，指向特定 npm 套件或本機 npm-pack tarball，而不是使用目錄、內建或預設 npm 來源。它們只用於 E2E 與套件驗證；一般使用者會使用 [`openclaw plugins install`](/zh-TW/cli/plugins) 安裝外掛。

<Warning>
覆寫會執行你提供來源中的外掛程式碼。請只在隔離的狀態目錄或可拋棄的測試機器中使用。
</Warning>

## 環境

除非同時設定兩個變數，否則覆寫會停用：

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

覆寫對應表是以外掛 id 為鍵的 JSON。值支援：

| 前綴                  | 來源                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | Registry 套件、精確版本或標籤                                                                   |
| `npm-pack:<path.tgz>` | 由 `npm pack` 產生的本機 tarball；相對路徑會從目前工作目錄解析                                  |

## 行為

當設定期間流程安裝某個 id 出現在對應表中的外掛時，OpenClaw 會使用覆寫來源，而不是目錄、內建或預設 npm 來源。這適用於上線設定，以及任何其他使用共用設定期間外掛安裝器的流程。

- 覆寫仍會強制檢查預期的外掛 id：對應到 `codex` 的 tarball 必須安裝 manifest id 為 `codex` 的外掛。
- 覆寫不會繼承官方信任來源狀態。即使該目錄項目通常代表 OpenClaw 擁有的套件，覆寫也會被視為操作員提供的測試輸入。
- 工作區 `.env` 檔案無法啟用安裝覆寫；這兩個 env vars 都在被封鎖的工作區 dotenv 清單中。請在啟動 OpenClaw 的受信任 shell、CI job 或遠端測試命令中設定它們。

## 套件 E2E

使用隔離的狀態目錄，避免套件安裝與安裝記錄觸碰你平常的 OpenClaw 狀態：

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

對於即時 provider E2E，請先從受信任的 shell 或 CI secret 載入真實 API key，再啟動測試命令。不要列印金鑰；只回報來源以及金鑰是否存在。

---
read_when:
    - 針對本機打包的外掛測試 onboarding 或設定流程
    - 發佈前驗證外掛套件
    - 將自動外掛安裝替換為測試產物
sidebarTitle: Install overrides
summary: 測試已封裝外掛覆寫搭配設定期間安裝流程
title: 外掛安裝覆寫
x-i18n:
    generated_at: "2026-06-27T19:37:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

外掛安裝覆寫讓維護者能針對特定 npm 套件或本機 `npm-pack` tarball 測試設定期間的外掛安裝。它們僅供 E2E 與套件驗證使用。一般使用者應使用 [`openclaw plugins install`](/zh-TW/cli/plugins) 安裝外掛。

<Warning>
覆寫會執行你提供來源中的外掛程式碼。請只在隔離的狀態目錄或可拋棄的測試機器中使用。
</Warning>

## 環境

除非同時設定這兩個變數，否則覆寫會停用：

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

覆寫對應表是以外掛 ID 作為鍵的 JSON。值支援：

- `npm:<registry-spec>` 用於登錄檔套件，以及精確版本或標籤
- `npm-pack:<path.tgz>` 用於由 `npm pack` 產生的本機 tarball

相對 `npm-pack:` 路徑會從目前工作目錄解析。

## 行為

當設定期間的流程要求安裝某個外掛，且其 ID 出現在對應表中時，OpenClaw 會使用覆寫來源，而不是目錄、內建或預設的 npm 來源。這適用於入門設定，以及其他使用共用設定期間外掛安裝器的流程。

覆寫仍會強制執行預期的外掛 ID。對應到 `codex` 的 tarball 必須安裝 manifest ID 為 `codex` 的外掛。

覆寫不會繼承官方受信任來源狀態。即使目錄項目通常代表 OpenClaw 擁有的套件，覆寫也會被視為操作者提供的測試輸入。

工作區 `.env` 檔案無法啟用安裝覆寫。請在啟動 OpenClaw 的受信任 shell、CI 作業或遠端測試命令中設定這些變數。

## 套件 E2E

使用隔離的狀態目錄，讓套件安裝與安裝紀錄不會碰觸你的正常 OpenClaw 狀態：

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

驗證狀態目錄下已安裝的套件：

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

針對即時提供者 E2E，請在啟動測試命令前，從受信任的 shell 或 CI secret 載入真實 API 金鑰。不要印出金鑰；只回報來源以及金鑰是否存在。

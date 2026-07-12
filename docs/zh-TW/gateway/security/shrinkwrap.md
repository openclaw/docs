---
read_when:
    - 你想知道 npm shrinkwrap 在 OpenClaw 發布版本中的含義
    - 你正在審查套件鎖定檔、相依套件變更或供應鏈風險
    - 你正在驗證根套件或外掛 npm 套件，然後再發布
summary: OpenClaw 發行版本中 npm shrinkwrap 的白話與技術說明
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-11T21:24:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw 原始碼簽出版本使用 `pnpm-lock.yaml`。已發布的 OpenClaw npm 套件使用 `npm-shrinkwrap.json`（npm 可發布的相依性鎖定檔），因此安裝套件時會採用發布期間已審查的相依性圖。

## 為何重要

Shrinkwrap 是 npm 套件所附相依性樹的明細：它會告訴 npm 應安裝哪些確切的遞移相依版本。

| 檔案                  | 適用範圍                 | 代表意義                          |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw 原始碼簽出版本  | 維護者使用的相依性圖              |
| `npm-shrinkwrap.json` | 已發布的 npm 套件        | 使用者安裝 npm 套件時的相依性圖   |
| `package-lock.json`   | 本機 npm 應用程式        | 並非 OpenClaw 的發布契約          |

對 OpenClaw 發布版本而言，這表示：

- 已發布的套件不會要求 npm 在安裝時重新產生相依性圖；
- 相依性變更會記錄於鎖定檔差異中，因此可供審查；
- 發布驗證會測試與使用者實際安裝相同的相依性圖；
- 套件大小或原生相依性的意外問題會在發布前顯現。

Shrinkwrap 並非沙箱。它本身不會使相依性變得安全，也無法取代主機隔離、`openclaw security audit`、套件來源驗證或安裝煙霧測試。

OpenClaw 是閘道、外掛主機、模型路由器及代理執行環境，因此預設安裝會影響啟動時間、磁碟使用量、原生套件下載及供應鏈暴露風險。Shrinkwrap 為發布審查提供穩定的邊界：審查者能看見遞移相依性的變動，驗證程式會拒絕非預期的鎖定檔漂移，而外掛套件會攜帶各自鎖定的相依性圖，而非依賴根套件。

## 產生與檢查

根 `openclaw` npm 套件、OpenClaw 所擁有的 npm 外掛套件（例如 `@openclaw/discord`），以及 [`@openclaw/ai`](/zh-TW/reference/openclaw-ai) 等可發布的工作區套件，會在發布時包含 `npm-shrinkwrap.json`。工作區相依性不會納入根套件的 shrinkwrap，因為它們會與根套件一同發布；每個可發布的工作區套件會分別鎖定自己的遞移相依性樹。適合的外掛套件也可使用明確的 `bundledDependencies` 發布，將其執行階段相依性檔案放入外掛 tarball，而非僅依賴安裝時解析。

```bash
# 所有由 shrinkwrap 管理的套件（根套件 + 可發布的外掛）
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# 僅根套件
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# 僅受目前變更集影響的套件
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

產生器會解析 npm 的可發布鎖定格式，但會拒絕 `pnpm-lock.yaml` 中尚不存在的已產生套件版本。這可維持 pnpm 相依性的版本新舊、覆寫及修補審查邊界。

請將下列項目視為安全性敏感內容進行審查：

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- 內含於外掛的相依性內容
- 任何 `package-lock.json` 差異

OpenClaw 套件驗證程式要求新的根套件 tarball 必須包含 shrinkwrap，並拒絕已發布套件中的 `package-lock.json`。外掛 npm 發布流程會檢查外掛本身的 shrinkwrap、安裝套件本身的內含相依性，然後封裝或發布。

## 檢查已發布的套件

根套件：

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

外掛套件：

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

背景資料：[npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json)。

---
read_when:
    - 你想知道 npm shrinkwrap 在 OpenClaw 發行版中的意思
    - 你正在審查套件鎖定檔、相依性變更或供應鏈風險
    - 你正在發布前驗證根目錄或外掛 npm 套件
summary: OpenClaw 發行中 npm shrinkwrap 的白話與技術說明
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-27T19:22:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw 原始碼簽出使用 `pnpm-lock.yaml`。已發布的 OpenClaw npm
套件使用 `npm-shrinkwrap.json`，也就是 npm 可發布的相依性鎖定檔，因此
套件安裝會使用發行期間已審查的相依性圖。

## 簡易版

Shrinkwrap 是隨 npm 套件一起發布的相依性樹收據。
它會告訴 npm 要安裝哪些確切的遞移套件版本。

對 OpenClaw 發行版而言，這表示：

- 已發布的套件不會要求 npm 在安裝時即時產生新的相依性圖；
- 相依性變更會更容易審查，因為它們會出現在鎖定檔中；
- 發行驗證可以測試使用者將會安裝的同一份相依性圖；
- 套件大小或原生相依性的意外情況更容易在發布前發現。

Shrinkwrap 不是沙箱。它本身不會讓相依性變安全，也無法取代主機隔離、`openclaw security audit`、套件
來源證明，或安裝煙霧測試。

簡短的心智模型：

| 檔案                  | 適用位置                 | 代表意義                          |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw 原始碼簽出      | 維護者相依性圖                    |
| `npm-shrinkwrap.json` | 已發布的 npm 套件        | 使用者的 npm 安裝圖               |
| `package-lock.json`   | 本機 npm 應用程式        | 不是 OpenClaw 發布合約            |

## OpenClaw 為何使用它

OpenClaw 是閘道、外掛主機、模型路由器與代理執行階段。預設
安裝可能會影響啟動時間、磁碟使用量、原生套件下載，以及
供應鏈暴露面。

Shrinkwrap 讓發行審查有穩定的邊界：

- 審查者可以看到遞移相依性的變動；
- 套件驗證器可以拒絕非預期的鎖定檔漂移；
- 套件驗收可以使用即將發布的相依性圖測試安裝；
- 外掛套件可以攜帶自己的已鎖定相依性圖，而不是
  依賴根套件來擁有僅供外掛使用的相依性。

目標不是「更多鎖定檔」。目標是可重現的發行安裝，
並具備清楚的所有權。

## 技術細節

根 `openclaw` npm 套件和 OpenClaw 擁有的 npm 外掛套件在發布時會包含
`npm-shrinkwrap.json`。合適的 OpenClaw 擁有外掛
套件也可以搭配明確的 `bundledDependencies` 發布，讓其執行階段
相依性檔案被包含在外掛 tarball 中，而不是只依賴
安裝時解析。

請這樣維護邊界：

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

產生器會解析 npm 的可發布鎖定格式，但會拒絕產生
未已存在於 `pnpm-lock.yaml` 中的套件版本。這會保持
pnpm 相依性的版本年齡、覆寫，以及修補審查邊界完整。

只有在刻意重新整理根套件且不觸碰外掛套件時，才使用僅限根的命令：

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

請將這些檔案視為安全敏感項目審查：

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- 已綁定的外掛相依性酬載
- 任何 `package-lock.json` 差異

OpenClaw 套件驗證器要求新的根套件 tarball 中包含 shrinkwrap。
外掛 npm 發布路徑會檢查外掛本機的 shrinkwrap、安裝
套件本機的已綁定相依性，然後打包或發布。套件
驗證器會拒絕已發布 OpenClaw 套件中的 `package-lock.json`。

若要檢查已發布的根套件：

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

若要檢查 OpenClaw 擁有的外掛套件：

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

背景：[npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).

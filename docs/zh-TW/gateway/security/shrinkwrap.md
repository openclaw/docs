---
read_when:
    - 你想知道 npm shrinkwrap 在 OpenClaw 發行版中代表什麼
    - 你正在審查套件鎖定檔、依賴項變更或供應鏈風險
    - 你正在驗證發布前的根或外掛 npm 套件
summary: OpenClaw 發行版本中 npm shrinkwrap 的白話與技術說明
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-05T11:24:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw 原始碼 checkout 使用 `pnpm-lock.yaml`。已發布的 OpenClaw npm 套件使用 `npm-shrinkwrap.json`，也就是 npm 可發布的相依性 lockfile，因此套件安裝會使用發布期間已審查的相依性圖。

## 為什麼這很重要

Shrinkwrap 是隨 npm 套件出貨的相依性樹收據：它會告訴 npm 要安裝哪些確切的遞迴相依版本。

| 檔案                  | 重要的位置               | 代表意義                          |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw 原始碼 checkout | 維護者相依性圖                    |
| `npm-shrinkwrap.json` | 已發布的 npm 套件        | 使用者的 npm 安裝圖               |
| `package-lock.json`   | 本機 npm 應用程式        | 不是 OpenClaw 發布合約            |

對 OpenClaw 發布而言，這表示：

- 已發布套件不會要求 npm 在安裝時重新發明新的相依性圖；
- 相依性變更可以審查，因為它們會落在 lockfile diff 中；
- 發布驗證會測試使用者將安裝的相同圖；
- 套件大小或原生相依性的意外會在發布前浮現。

Shrinkwrap 不是沙箱。它本身不會讓相依性變得安全，也不會取代主機隔離、`openclaw security audit`、套件來源證明，或安裝煙霧測試。

OpenClaw 是閘道、外掛宿主、模型路由器與 agent runtime，因此預設安裝會影響啟動時間、磁碟使用量、原生套件下載與供應鏈暴露面。Shrinkwrap 為發布審查提供穩定邊界：審查者可以看到遞迴相依性的移動，驗證器會拒絕非預期的 lockfile 漂移，而外掛套件會攜帶自己的已鎖定相依性圖，而不是依賴根套件。

## 產生與檢查

根 `openclaw` npm 套件、OpenClaw 擁有的 npm 外掛套件（例如 `@openclaw/discord`），以及可發布的 workspace 套件，例如 [`@openclaw/ai`](/reference/openclaw-ai)，發布時會包含 `npm-shrinkwrap.json`。Workspace 相依性會從根 shrinkwrap 中省略，因為它們會與根套件一起發布；每個可發布的 workspace 套件會改為釘選自己的遞迴樹。合適的外掛套件也可以使用明確的 `bundledDependencies` 發布，將其 runtime 相依性檔案帶在外掛 tarball 中，而不是只依賴安裝時解析。

```bash
# All shrinkwrap-managed packages (root + publishable plugins)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Root package only
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Only packages affected by the current changeset
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

產生器會解析 npm 的可發布 lock 格式，但會拒絕產生不已存在於 `pnpm-lock.yaml` 的套件版本。這會維持 pnpm 相依性年齡、override 與 patch-review 邊界。

請將以下項目視為安全敏感：

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- bundled 外掛相依性 payload
- 任何 `package-lock.json` diff

OpenClaw 套件驗證器要求新的根套件 tarball 中包含 shrinkwrap，並拒絕已發布套件中的 `package-lock.json`。外掛 npm 發布路徑會檢查外掛本機 shrinkwrap、安裝套件本機 bundled 相依性，然後 pack 或發布。

## 檢查已發布套件

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

背景：[npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).

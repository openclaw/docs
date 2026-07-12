---
read_when:
    - 你想要在 stable/extended-stable/beta/dev 之間切換
    - 你想要固定使用特定版本、標籤或 SHA
    - 你正在標記或發布預發行版本
sidebarTitle: Release Channels
summary: 穩定、延伸穩定、Beta 與開發通道：語意、切換、版本固定與標記
title: 發布管道
x-i18n:
    generated_at: "2026-07-12T14:33:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供四個更新頻道：

- **穩定版**：npm dist-tag `latest`。建議大多數使用者使用。
- **延伸穩定版**：npm dist-tag `extended-stable`。這是全新且落後於目前版本、
  針對仍受支援月份的套件頻道。它僅提供套件，且只能以前景方式安裝。
  當啟用 `update.checkOnStart` 時，已儲存的選擇會收到唯讀的更新提示，
  但絕不會自動套用。
- **Beta 版**：npm dist-tag `beta`。當 `beta` 不存在或比目前穩定版本更舊時，
  會回復使用 `latest`。
- **開發版**：`main`（git）的移動中最新版本。發布時使用 npm dist-tag `dev`。
  `main` 用於實驗和積極開發；可能包含未完成的功能或破壞性變更。
  請勿用於正式環境的閘道。

穩定版組建通常會先發布至 **Beta 版**，在該處通過驗證後，再升級為
**latest**，版本號不會遞增。維護者也可以直接發布至 `latest`。
dist-tag 是 npm 安裝的事實依據。

## 切換頻道

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將選擇持續儲存至設定中的 `update.channel`，並控制兩種
安裝路徑：

| 頻道              | npm／套件安裝                                                                                                                                                                                | git 安裝                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新的穩定版 git 標籤（排除 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N` 及其他具名預發行版本後綴） |
| `extended-stable` | 解析公開的 npm `extended-stable` 選擇器、驗證選定的確切套件，並安裝該確切版本。採取失敗關閉，不會回復使用 `latest`、`beta` 或 `dev`。 | 不支援：OpenClaw 會保持簽出內容不變，並要求你改用套件安裝                                                                                                            |
| `beta`            | dist-tag `beta`；當 `beta` 不存在或較舊時，回復使用 `latest`                                                                                                                           | 最新的 Beta 版 git 標籤；當 Beta 版不存在或較舊時，回復使用最新的穩定版 git 標籤                                                                                     |
| `dev`             | dist-tag `dev`（很少使用；大多數開發版使用者會執行 git 安裝）                                                                                                                         | 擷取更新、將簽出內容重定基底至上游 `main` 分支、進行組建，並重新安裝全域命令列介面                                                                                   |

對於 `dev` git 安裝，預設簽出位置為 `~/openclaw`（若已設定
`OPENCLAW_HOME`，則為 `$OPENCLAW_HOME/openclaw`）；可使用
`OPENCLAW_GIT_DIR` 覆寫。

<Tip>
若要並行保留穩定版與開發版，請使用兩個獨立的簽出目錄，並將每個閘道分別指向各自的目錄。
</Tip>

## 單次指定版本或標籤

使用 `--tag` 為單次更新指定特定的 dist-tag、版本或套件規格，
且**不會**變更持續儲存的頻道：

```bash
# 安裝特定版本
openclaw update --tag 2026.4.1-beta.1

# 從 Beta 版 dist-tag 安裝（單次使用，不會持續儲存）
openclaw update --tag beta

# 切換至持續移動的 GitHub main 簽出（持續儲存）
openclaw update --channel dev

# 安裝特定的 npm 套件規格
openclaw update --tag openclaw@2026.4.1-beta.1

# 從 GitHub main 安裝一次，不持續儲存頻道
openclaw update --tag main
```

注意事項：

- `--tag` **僅適用於套件（npm）安裝**；git 安裝會忽略它。
- 標籤不會持續儲存；下一次執行 `openclaw update` 時會使用設定的
  頻道。
- `--tag main` 會在該次執行中對應至 npm 相容規格
  `github:openclaw/openclaw#main`。若要持續安裝移動中的 `main`，
  請使用 `openclaw update --channel dev`（套件安裝會切換至 git 簽出），
  或使用安裝程式的 git 方法重新安裝：
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm 安裝路徑會直接拒絕 GitHub／git 來源目標，並改為引導你使用 git 方法。
- 降級保護：如果目標版本比目前版本更舊，OpenClaw 會提示你確認
  （可使用 `--yes` 略過）。
- 延伸穩定版一律使用經驗證的確切套件目標。它不是
  `--tag extended-stable` 的單次別名，且 `--tag` 無法與有效的
  延伸穩定版頻道合併使用。
- `--channel beta` 與 `--tag beta` 不同：當 Beta 版不存在或較舊時，
  頻道流程可以回復至穩定版／latest，而 `--tag beta` 一律以原始的
  `beta` dist-tag 作為該次執行的目標。

## 試執行

預覽 `openclaw update` 將執行的動作，而不進行任何變更：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

試執行會回報實際生效的頻道、目標版本、預定動作，以及是否需要
降級確認。

## 外掛與頻道

使用 `openclaw update` 切換頻道時，也會同步外掛來源：

- `dev` 會將具備內建對應項目的已安裝外掛切換回其
  內建（git 簽出）來源。
- `stable` 和 `beta` 會還原透過 npm 或 ClawHub 安裝的外掛
  套件。
- `extended-stable` 會將具備未指定／預設或 `latest` 意圖且符合資格的
  官方 npm 外掛，解析為與已安裝核心版本相同的確切版本。執行階段不會
  查詢外掛的 `@extended-stable` 標籤。
- 核心更新完成後，會更新透過 npm 安裝的外掛。

## 檢查目前狀態

```bash
openclaw update status
```

顯示作用中的頻道（以及決定該頻道的來源：設定、git 標籤、
git 分支、已安裝版本或預設值）、安裝類型（git 或套件）、
目前版本及是否有可用更新。

## 標記最佳實務

- 為你希望 git 簽出落在的發行版本建立標籤：穩定版使用
  `vYYYY.M.PATCH`，Beta 版使用 `vYYYY.M.PATCH-beta.N`。如
  `-alpha.N`、`-rc.N` 和 `-next.N` 等具名預發行版本後綴，
  不屬於穩定版或 Beta 版目標。
- 為保持相容性，`vYYYY.M.PATCH-1` 和 `v1.0.1-1` 等舊式數字穩定版
  標籤仍會被辨識為穩定版 git 標籤。
- 為保持相容性，也會辨識 `vYYYY.M.PATCH.beta.N`（以句點分隔）；
  建議使用 `-beta.N`。
- 保持標籤不可變：絕不要移動或重複使用標籤。
- npm dist-tag 仍是 npm 安裝的事實依據：
  - `latest` -> 穩定版
  - `extended-stable` -> 落後於目前版本且仍受支援月份的套件發行版
  - `beta` -> 候選組建或先以 Beta 版發布的穩定版組建
  - `dev` -> main 快照（選用）

## macOS 應用程式可用性

Beta 版和開發版組建可能**不會**包含 macOS 應用程式發行版。這沒有問題：

- git 標籤和 npm dist-tag 仍可各自獨立發布。
- 在發行說明或變更日誌中註明「此 Beta 版沒有 macOS 組建」。

## 相關內容

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)

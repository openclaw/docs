---
read_when:
    - 你想要在穩定版／延長穩定版／測試版／開發版之間切換
    - 你想要固定使用特定版本、標籤或 SHA
    - 你正在標記或發布預發行版本
sidebarTitle: Release Channels
summary: 穩定版、延伸穩定版、測試版與開發版頻道：語意、切換、版本鎖定與標記
title: 發布通道
x-i18n:
    generated_at: "2026-07-11T21:28:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供四個更新通道：

- **穩定版**：npm dist-tag `latest`。建議大多數使用者採用。
- **延伸穩定版**：npm dist-tag `extended-stable`。這是全新提供、延後追蹤
  受支援月份的套件通道。它僅適用於套件，且只能在前景執行安裝。啟用
  `update.checkOnStart` 時，已儲存的選擇會收到唯讀的更新提示，但絕不會
  自動套用更新。
- **測試版**：npm dist-tag `beta`。當 `beta` 不存在或比目前的穩定版本舊時，
  會退回使用 `latest`。
- **開發版**：持續跟隨 `main` 的最新提交（git）。發布時使用 npm dist-tag `dev`。
  `main` 用於實驗與積極開發；其中可能包含未完成的功能或破壞性變更。
  請勿將其用於正式環境的閘道。

穩定版本通常會先發布到 **測試版**，在該處通過驗證後，再不變更版本號地
提升至 **latest**。維護者也可以直接發布至 `latest`。dist-tag 是 npm 安裝的
唯一真實來源。

## 切換通道

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將選擇保存至設定中的 `update.channel`，並控制下列兩種安裝路徑：

| 通道              | npm／套件安裝                                                                                                                                                                           | git 安裝                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新的穩定版 git 標籤（排除 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N` 及其他具名預發行版本後綴） |
| `extended-stable` | 解析公開的 npm `extended-stable` 選擇器、驗證實際選取的套件，並安裝該確切版本。不提供退回至 `latest`、`beta` 或 `dev` 的機制，失敗時直接停止。 | 不支援：OpenClaw 會保持簽出內容不變，並要求你改用套件安裝                                                                                                           |
| `beta`            | dist-tag `beta`；當 `beta` 不存在或較舊時，退回使用 `latest`                                                                                                                           | 最新的測試版 git 標籤；當測試版不存在或較舊時，退回使用最新的穩定版 git 標籤                                                                                        |
| `dev`             | dist-tag `dev`（很少使用；大多數開發版使用者採用 git 安裝）                                                                                                                           | 擷取更新、將簽出內容重定基底至上游 `main` 分支、進行建置，並重新安裝全域命令列介面                                                                                  |

對於 `dev` git 安裝，預設簽出目錄為 `~/openclaw`（若已設定
`OPENCLAW_HOME`，則為 `$OPENCLAW_HOME/openclaw`）；可透過
`OPENCLAW_GIT_DIR` 覆寫。

<Tip>
若要並行使用穩定版與開發版，請使用兩個獨立的簽出目錄，並將每個閘道分別指向其專屬目錄。
</Tip>

## 單次指定版本或標籤

使用 `--tag` 可為單次更新指定特定 dist-tag、版本或套件規格，且**不會**
變更已保存的通道：

```bash
# 安裝特定版本
openclaw update --tag 2026.4.1-beta.1

# 從 beta dist-tag 安裝（僅限單次，不保存）
openclaw update --tag beta

# 切換至持續更新的 GitHub main 簽出內容（永久保存）
openclaw update --channel dev

# 安裝特定的 npm 套件規格
openclaw update --tag openclaw@2026.4.1-beta.1

# 從 GitHub main 安裝一次，但不保存通道
openclaw update --tag main
```

注意事項：

- `--tag` **僅適用於套件（npm）安裝**；git 安裝會忽略它。
- 標籤不會保存；下次執行 `openclaw update` 時會使用設定的通道。
- `--tag main` 會在該次執行中對應至與 npm 相容的規格
  `github:openclaw/openclaw#main`。若要永久安裝持續更新的 `main`，請使用
  `openclaw update --channel dev`（套件安裝會切換為 git 簽出），
  或使用安裝程式的 git 方法重新安裝：
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm 安裝路徑會直接拒絕 GitHub／git 來源目標，並改為引導你使用 git 方法。
- 降版保護：若目標版本比目前版本舊，OpenClaw 會提示要求確認
  （可使用 `--yes` 略過）。
- 延伸穩定版一律使用經驗證的確切套件目標。它並非
  `--tag extended-stable` 的單次別名，而且 `--tag` 不得與實際生效的
  延伸穩定版通道搭配使用。
- `--channel beta` 與 `--tag beta` 不同：當測試版不存在或較舊時，
  通道流程可退回使用穩定版／latest，而 `--tag beta` 在該次執行中
  一律以原始的 `beta` dist-tag 為目標。

## 試執行

預覽 `openclaw update` 將執行的操作，而不進行任何變更：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

試執行會回報實際生效的通道、目標版本、預定操作，以及是否需要確認降版。

## 外掛與通道

使用 `openclaw update` 切換通道時，也會同步外掛來源：

- `dev` 會將具有內建對應版本的已安裝外掛，切回其內建（git 簽出）來源。
- `stable` 與 `beta` 會還原透過 npm 或 ClawHub 安裝的外掛套件。
- `extended-stable` 會將採用空白／預設或 `latest` 意圖的合格官方 npm
  外掛，解析至與已安裝核心相同的確切版本。它不會在執行階段查詢外掛的
  `@extended-stable` 標籤。
- 透過 npm 安裝的外掛會在核心更新完成後更新。

## 檢查目前狀態

```bash
openclaw update status
```

顯示作用中的通道（以及決定該通道的來源：設定、git 標籤、git 分支、
已安裝版本或預設值）、安裝類型（git 或套件）、目前版本及是否有可用更新。

## 標記最佳實務

- 為希望 git 簽出落在其上的發行版本建立標籤：穩定版使用
  `vYYYY.M.PATCH`，測試版使用 `vYYYY.M.PATCH-beta.N`。例如
  `-alpha.N`、`-rc.N` 與 `-next.N` 等具名預發行版本後綴，
  不會被視為穩定版或測試版目標。
- 為維持相容性，仍會將 `vYYYY.M.PATCH-1` 與 `v1.0.1-1` 等舊式數字
  穩定版標籤辨識為穩定版 git 標籤。
- 為維持相容性，也會辨識 `vYYYY.M.PATCH.beta.N`（以句點分隔）；
  建議優先使用 `-beta.N`。
- 標籤應保持不可變：切勿移動或重複使用標籤。
- npm dist-tag 仍是 npm 安裝的唯一真實來源：
  - `latest` -> 穩定版
  - `extended-stable` -> 延後追蹤受支援月份的套件版本
  - `beta` -> 候選版本或先發布至測試版的穩定版本
  - `dev` -> main 快照（選用）

## macOS 應用程式可用性

測試版與開發版本可能**不會**包含 macOS 應用程式版本。這沒有問題：

- git 標籤與 npm dist-tag 仍可各自獨立發布。
- 在發行說明或變更日誌中註明「此測試版沒有 macOS 建置版本」。

## 相關內容

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)

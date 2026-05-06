---
read_when:
    - 你想在 stable/beta/dev 之間切換
    - 你想要固定特定版本、標籤或 SHA
    - 您正在標記或發布預發行版本
sidebarTitle: Release Channels
summary: stable、beta 和 dev 通道：語意、切換、釘選與標記
title: 發行通道
x-i18n:
    generated_at: "2026-05-06T02:50:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供三個更新通道：

- **stable**：npm dist-tag `latest`。建議大多數使用者使用。
- **beta**：當它是目前版本時，使用 npm dist-tag `beta`；如果 beta 缺少或比
  最新的 stable 發行版本更舊，更新流程會退回使用 `latest`。
- **dev**：`main` 的移動前端（git）。npm dist-tag：`dev`（發布時）。
  `main` 分支用於實驗與積極開發。它可能包含
  未完成的功能或破壞性變更。請勿將它用於生產 Gateway。

我們通常會先將 stable 建置發布到 **beta**，在該處測試後，再執行一個
明確的提升步驟，將已驗證的建置移到 `latest`，且不
變更版本號。維護者也可以在需要時將 stable 發行版本
直接發布到 `latest`。Dist-tags 是 npm
安裝的事實來源。

## 切換通道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將你的選擇保存在設定（`update.channel`）中，並對齊
安裝方式：

- **`stable`**（套件安裝）：透過 npm dist-tag `latest` 更新。
- **`beta`**（套件安裝）：優先使用 npm dist-tag `beta`，但在 `beta` 缺少或比目前 stable 標籤更舊時，會退回使用
  `latest`。
- **`stable`**（git 安裝）：簽出最新的 stable git 標籤。
- **`beta`**（git 安裝）：優先使用最新的 beta git 標籤，但在 beta 缺少或更舊時，會退回使用
  最新的 stable git 標籤。
- **`dev`**：確保存在 git 簽出（預設 `~/openclaw`，可用
  `OPENCLAW_GIT_DIR` 覆寫）、切換到 `main`、在上游上 rebase、建置，並
  從該簽出安裝全域 CLI。

<Tip>
如果你想並行使用 stable 和 dev，請保留兩個 clone，並將你的 Gateway 指向 stable 那個。
</Tip>

## 一次性指定版本或標籤

使用 `--tag` 可針對單次更新指定特定 dist-tag、版本或套件規格，
且**不會**變更你已保存的通道：

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

注意：

- `--tag` **僅適用於套件（npm）安裝**。Git 安裝會忽略它。
- 標籤不會保存。你的下一次 `openclaw update` 會照常使用已設定的
  通道。
- 降級保護：如果目標版本比你目前的版本更舊，
  OpenClaw 會提示確認（可用 `--yes` 略過）。
- `--channel beta` 與 `--tag beta` 不同：通道流程在 beta 缺少或更舊時可以退回
  stable/latest，而 `--tag beta` 會針對該次執行使用原始
  `beta` dist-tag。

## 試執行

預覽 `openclaw update` 在不進行變更時會執行的動作：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

試執行會顯示有效通道、目標版本、規劃動作，以及
是否需要降級確認。

## Plugins 和通道

當你使用 `openclaw update` 切換通道時，OpenClaw 也會同步 Plugin
來源：

- `dev` 優先使用 git 簽出中的 bundled plugins。
- `stable` 和 `beta` 會還原 npm 安裝的 Plugin 套件。
- npm 安裝的 plugins 會在 core 更新完成後更新。

## 檢查目前狀態

```bash
openclaw update status
```

顯示作用中的通道、安裝類型（git 或 package）、目前版本，以及
來源（config、git tag、git branch 或 default）。

## 標籤最佳實務

- 為你希望 git 簽出落在其上的發行版本加上標籤（stable 使用 `vYYYY.M.D`，
  beta 使用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 也會為了相容性而被識別，但建議使用 `-beta.N`。
- 舊版 `vYYYY.M.D-<patch>` 標籤仍會被識別為 stable（非 beta）。
- 保持標籤不可變：絕不要移動或重複使用標籤。
- npm dist-tags 仍是 npm 安裝的事實來源：
  - `latest` -> stable
  - `beta` -> 候選建置或先進入 beta 的 stable 建置
  - `dev` -> main 快照（選用）

## macOS app 可用性

Beta 和 dev 建置可能**不會**包含 macOS app 發行版本。這沒問題：

- git tag 和 npm dist-tag 仍可發布。
- 在發行說明或 changelog 中註明「此 beta 沒有 macOS build」。

## 相關

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)

---
read_when:
    - 你想要在穩定版／測試版／開發版之間切換
    - 您想要固定特定版本、標籤或 SHA
    - 您正在標記或發布預發行版本
sidebarTitle: Release Channels
summary: 穩定版、Beta 版與開發版通道：語意、切換、固定與標記
title: 發布通道
x-i18n:
    generated_at: "2026-05-07T01:52:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供三個更新通道：

- **stable**：npm dist-tag `latest`。建議大多數使用者使用。
- **beta**：當 npm dist-tag `beta` 為目前版本時使用；如果 beta 不存在或比最新的 stable 發行版本舊，更新流程會退回使用 `latest`。
- **dev**：`main` 的移動前端（git）。npm dist-tag：`dev`（發布時）。
  `main` 分支用於實驗與積極開發。它可能包含未完成的功能或破壞性變更。請勿將其用於生產 Gateway。

我們通常會先將 stable 建置發布到 **beta**，在那裡測試，然後執行一個明確的提升步驟，將已驗證的建置移到 `latest`，而不變更版本號。維護者也可以在需要時直接將 stable 發行版本發布到 `latest`。dist-tag 是 npm 安裝的真實來源。

## 規劃中的每月支援線

OpenClaw 尚未提供 LTS 或每月支援通道。我們正在朝向相容於 SemVer 的每月支援線努力，讓使用者可以停留在較安靜的線上，同時讓 `latest` 繼續快速前進。

規劃中的版本格式為 `YYYY.M.PATCH`：

- `YYYY` 是年份。
- `M` 是每月發行線，不含前導零。
- `PATCH` 會在該每月線內遞增，必要時可以超過 100。

未來標籤範例：

- `v2026.6.0`、`v2026.6.1`、`v2026.6.2` 用於六月線。
- `v2026.6.3-beta.1` 用於 fast/latest 軌道上的預先發行版本。
- 未來的支援線 dist-tag，例如 `stable-2026-6` 或 `lts-2026-6`，可能會指向某條每月線，但目前尚無此類通道可用。

在該遷移完成之前，公開更新通道仍為 `stable`、`beta` 和 `dev`。

## 切換通道

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將你的選擇持久化到設定（`update.channel`）中，並對齊安裝方式：

- **`stable`**（套件安裝）：透過 npm dist-tag `latest` 更新。
- **`beta`**（套件安裝）：優先使用 npm dist-tag `beta`，但當 `beta` 不存在或比目前 stable 標籤舊時，會退回使用 `latest`。
- **`stable`**（git 安裝）：切換到最新的 stable git 標籤。
- **`beta`**（git 安裝）：優先使用最新的 beta git 標籤，但當 beta 不存在或較舊時，會退回使用最新的 stable git 標籤。
- **`dev`**：確保有 git checkout（預設 `~/openclaw`，可用 `OPENCLAW_GIT_DIR` 覆寫），切換到 `main`，在 upstream 上 rebase，建置，並從該 checkout 安裝全域 CLI。

<Tip>
如果你想並行使用 stable 和 dev，請保留兩份 clone，並將你的 Gateway 指向 stable 那一份。
</Tip>

## 一次性指定版本或標籤

使用 `--tag` 可針對單次更新指定特定 dist-tag、版本或套件規格，且**不會**變更你持久化的通道：

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

注意事項：

- `--tag` 只適用於**套件（npm）安裝**。git 安裝會忽略它。
- 標籤不會被持久化。你的下一次 `openclaw update` 會照常使用設定的通道。
- 降級保護：如果目標版本比目前版本舊，OpenClaw 會提示確認（可用 `--yes` 略過）。
- `--channel beta` 不同於 `--tag beta`：通道流程可在 beta 不存在或較舊時退回到 stable/latest，而 `--tag beta` 會針對那一次執行直接使用原始的 `beta` dist-tag。

## 試執行

預覽 `openclaw update` 將執行的動作，而不實際變更：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

試執行會顯示有效通道、目標版本、計畫動作，以及是否需要降級確認。

## Plugin 與通道

當你使用 `openclaw update` 切換通道時，OpenClaw 也會同步 Plugin 來源：

- `dev` 優先使用 git checkout 中的內建 Plugin。
- `stable` 和 `beta` 會還原透過 npm 安裝的 Plugin 套件。
- 透過 npm 安裝的 Plugin 會在核心更新完成後更新。

## 檢查目前狀態

```bash
openclaw update status
```

顯示啟用中的通道、安裝種類（git 或套件）、目前版本，以及來源（設定、git 標籤、git 分支或預設值）。

## 標籤最佳實務

- 為你希望 git checkout 落在其上的發行版本加上標籤（目前 stable 發行版本使用 `vYYYY.M.D`，目前 beta 發行版本使用 `vYYYY.M.D-beta.N`）。
- `vYYYY.M.D.beta.N` 也會因相容性而被識別，但建議使用 `-beta.N`。
- 舊版 `vYYYY.M.D-<patch>` 標籤仍會被識別為 stable（非 beta），但規劃中的每月支援模型將使用一般修補版本號（`vYYYY.M.PATCH`），而不是連字號修正後綴。
- 保持標籤不可變：絕不要移動或重複使用標籤。
- npm dist-tag 仍是 npm 安裝的真實來源：
  - `latest` -> stable
  - `beta` -> 候選建置或 beta-first stable 建置
  - `dev` -> main 快照（選用）

## macOS app 可用性

Beta 和 dev 建置可能**不會**包含 macOS app 發行版本。這沒問題：

- git 標籤和 npm dist-tag 仍可發布。
- 在發行說明或變更日誌中註明「此 beta 沒有 macOS 建置」。

## 相關

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)

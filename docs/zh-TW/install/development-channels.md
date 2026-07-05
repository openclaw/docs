---
read_when:
    - 你想在 stable/extended-stable/beta/dev 之間切換
    - 你想要固定特定版本、標籤或 SHA
    - 你正在標記或發布預發行版本
sidebarTitle: Release Channels
summary: 穩定版、延伸穩定版、測試版與開發版通道：語意、切換、釘選與標記
title: 發布通道
x-i18n:
    generated_at: "2026-07-05T01:57:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0bfe2efcd25c74dc165759a8a26f9bebce58a4fdb9711a94713c2ae294172894
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供四個更新通道：

- **stable**：npm dist-tag `latest`。建議大多數使用者使用。
- **extended-stable**：npm dist-tag `extended-stable`。全新的、落後版的
  受支援月份套件通道。此版本僅支援前景執行。
- **beta**：目前有效時為 npm dist-tag `beta`；如果 beta 缺失或比
  最新 stable 版本更舊，更新流程會回退到 `latest`。
- **dev**：`main`（git）的移動最新狀態。npm dist-tag：`dev`（發布時）。
  `main` 分支用於實驗與主動開發。它可能包含
  未完成的功能或破壞性變更。請勿將它用於生產閘道。

我們通常會先將 stable 建置發布到 **beta**，在那裡測試，然後執行
明確的升級步驟，將已驗證的建置移到 `latest`，而不
變更版本號。維護者也可以在需要時直接將 stable 版本
發布到 `latest`。dist-tag 是 npm 安裝的真實來源。

## 切換通道

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將你的選擇持久化到設定（`update.channel`），並對齊
安裝方式：

- **`stable`**（套件安裝）：透過 npm dist-tag `latest` 更新。
- **`extended-stable`**（僅限套件安裝）：解析公開 npm
  `extended-stable` 選擇器，驗證精確選取的套件版本，並
  安裝該精確版本。解析會封閉失敗，不會回退到
  `latest`、`beta` 或 `dev`。
- **`beta`**（套件安裝）：優先使用 npm dist-tag `beta`，但會在
  `beta` 缺失或比目前 stable 標籤更舊時回退到
  `latest`。
- **`stable`**（git 安裝）：簽出最新 stable git 標籤，排除
  semver 預發行標籤，例如 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、
  `-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`，以及其他預發行
  後綴。
- **`beta`**（git 安裝）：優先使用最新 beta git 標籤，但會在 beta 缺失或更舊時回退到
  最新 stable git 標籤。
- **`extended-stable`**（git 安裝）：不支援。OpenClaw 會保持
  簽出不變，並要求你使用套件安裝。
- **`dev`**：確保 git 簽出存在（預設為 `~/openclaw`，或在設定
  `OPENCLAW_HOME` 時使用 `$OPENCLAW_HOME/openclaw`；可用
  `OPENCLAW_GIT_DIR` 覆寫），切換到 `main`，在上游重新定基、建置，並
  從該簽出安裝全域命令列介面。

<Tip>
如果你想平行使用 stable 和 dev，請保留兩個 clone，並將你的閘道指向 stable 那個。
</Tip>

## 一次性指定版本或標籤

使用 `--tag` 可在單次更新中指定特定 dist-tag、版本或套件規格，
**不會**變更你持久化的通道：

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

注意：

- `--tag` 僅適用於**套件（npm）安裝**。git 安裝會忽略它。
- 標籤不會被持久化。你的下一次 `openclaw update` 會照常使用你設定的
  通道。
- 對於套件安裝，OpenClaw 會先將 GitHub/git 原始碼規格預先打包成
  暫存 tarball，再進行分階段 npm 安裝。當你想將移動中的 `main`
  簽出作為持久安裝時，請使用 `--channel dev` 或
  `--install-method git --version main`。
- 降級保護：如果目標版本比你目前的版本更舊，
  OpenClaw 會提示確認（可用 `--yes` 略過）。
- Extended-stable 一律使用其已驗證的精確套件目標。它不是
  `--tag extended-stable` 的一次性別名，且 `--tag` 不能與
  實際的 extended-stable 通道合併使用。
- `--channel beta` 與 `--tag beta` 不同：通道流程可在 beta 缺失或更舊時
  回退到 stable/latest，而 `--tag beta` 則會在該次執行中指定
  原始 `beta` dist-tag。

## 試執行

預覽 `openclaw update` 在不進行變更時會執行什麼：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

試執行會顯示有效通道、目標版本、計畫動作，以及
是否需要降級確認。

## 外掛與通道

當你使用 `openclaw update` 切換通道時，OpenClaw 也會同步外掛
來源：

- `dev` 優先使用 git 簽出中的 bundled 外掛。
- `stable` 和 `beta` 會還原 npm 安裝的外掛套件。
- `extended-stable` 目前會在
  核心套件成功後使用現有 stable/latest 外掛線。
  尚未查詢官方外掛 `@extended-stable` 選擇器。
- npm 安裝的外掛會在核心更新完成後更新。

## 檢查目前狀態

```bash
openclaw update status
```

顯示使用中的通道、安裝種類（git 或套件）、目前版本，以及
來源（設定、git 標籤、git 分支或預設值）。

## 標記最佳實務

- 為你希望 git 簽出落點的版本加上標籤（stable 使用 `vYYYY.M.PATCH`，
  beta 使用 `vYYYY.M.PATCH-beta.N`；命名 semver 預發行後綴，例如
  `-alpha.N`、`-rc.N` 和 `-next.N`，都不是 stable 目標）。
- 舊版數字 stable 標籤，例如 `vYYYY.M.PATCH-1` 和 `v1.0.1-1`，仍會被
  識別為 stable git 標籤以維持相容性。
- `vYYYY.M.PATCH.beta.N` 也會被識別以維持相容性，但請優先使用 `-beta.N`。
- 保持標籤不可變：絕不要移動或重複使用標籤。
- npm dist-tag 仍是 npm 安裝的真實來源：
  - `latest` -> stable
  - `extended-stable` -> 落後受支援月份套件版本
  - `beta` -> 候選建置或 beta-first stable 建置
  - `dev` -> main 快照（選用）

## macOS 應用程式可用性

Beta 和 dev 建置可能**不**包含 macOS 應用程式版本。這沒問題：

- git 標籤和 npm dist-tag 仍可發布。
- 在發行說明或 changelog 中標明「此 beta 沒有 macOS 建置」。

## 相關

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)

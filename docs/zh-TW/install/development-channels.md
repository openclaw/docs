---
read_when:
    - 你想要在 stable/extended-stable/beta/dev 之間切換
    - 你想釘選特定版本、標籤或 SHA
    - 您正在標記或發布預發行版本
sidebarTitle: Release Channels
summary: stable、extended-stable、beta 與 dev 通道：語意、切換、釘選與標記
title: 發行通道
x-i18n:
    generated_at: "2026-07-06T10:51:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 00b35a9dd74a2a5ffad67b28538d0e210634fa474b70b65aeba49a09c0a73368
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw 提供四個更新通道：

- **stable**：npm dist-tag `latest`。建議大多數使用者使用。
- **extended-stable**：npm dist-tag `extended-stable`。全新的、落後於當前版本的
  supported-month 套件通道。此版本中它僅限套件，且僅限前景執行。
- **beta**：npm dist-tag `beta`。當 `beta` 缺失或比目前穩定版本更舊時，
  會回退到 `latest`。
- **dev**：`main`（git）的移動頭。發布時為 npm dist-tag `dev`。`main`
  用於實驗和主動開發；可能包含未完成的功能或破壞性變更。請勿將它用於生產閘道。

穩定建置通常會先發布到 **beta**，在那裡完成審核後，再不變更版本號地
提升到 **latest**。維護者也可以直接發布到 `latest`。dist-tags 是 npm 安裝的事實來源。

## 切換通道

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` 會將選擇持久化到設定中的 `update.channel`，並驅動兩種
安裝路徑：

| 通道              | npm/套件安裝                                                                                                                                                                          | git 安裝                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 最新穩定 git 標籤（排除 `-alpha.N`、`-beta.N`、`-rc.N`、`-dev.N`、`-next.N`、`-preview.N`、`-canary.N`、`-nightly.N`，以及其他具名預發行尾碼） |
| `extended-stable` | 解析公開 npm `extended-stable` 選擇器，驗證精確選取的套件，並安裝該精確版本。失敗時會封閉失敗，不會回退到 `latest`、`beta` 或 `dev`。 | 不支援：OpenClaw 會保留 checkout 不變，並要求你使用套件安裝                                                                     |
| `beta`            | dist-tag `beta`，當 `beta` 缺失或更舊時回退到 `latest`                                                                                                              | 最新 beta git 標籤，當 beta 缺失或更舊時回退到最新穩定 git 標籤                                                                       |
| `dev`             | dist-tag `dev`（少見；大多數 dev 使用者會執行 git 安裝）                                                                                                                                 | 擷取、將 checkout rebase 到上游 `main` 分支、建置，並重新安裝全域命令列介面                                                                 |

對於 `dev` git 安裝，預設 checkout 是 `~/openclaw`（或當設定
`OPENCLAW_HOME` 時為 `$OPENCLAW_HOME/openclaw`）；可用
`OPENCLAW_GIT_DIR` 覆寫。

<Tip>
若要並行保留 stable 和 dev，請使用兩個獨立的 checkout，並讓每個閘道指向自己的 checkout。
</Tip>

## 一次性指定版本或標籤

使用 `--tag` 可針對單次更新指定特定 dist-tag、版本或套件規格，
**不會**變更已持久化的通道：

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout (persistent)
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

注意：

- `--tag` 僅適用於**套件（npm）安裝**；git 安裝會忽略它。
- 標籤不會持久化；下一次 `openclaw update` 會使用已設定的
  通道。
- `--tag main` 會在該次執行中對應到與 npm 相容的規格 `github:openclaw/openclaw#main`。
  若要持久安裝移動中的 `main`，請使用
  `openclaw update --channel dev`（套件安裝會切換到 git checkout）
  或使用安裝程式的 git 方法重新安裝：
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`。
  npm 安裝路徑會直接拒絕 GitHub/git 來源目標，並改為指引你使用
  git 方法。
- 降級保護：如果目標版本比目前版本更舊，OpenClaw 會提示確認（可用 `--yes` 跳過）。
- Extended-stable 一律使用其已驗證的精確套件目標。它不是
  `--tag extended-stable` 的一次性別名，且 `--tag` 不能與有效的
  extended-stable 通道結合使用。
- `--channel beta` 與 `--tag beta` 不同：通道流程可在 beta 缺失或更舊時
  回退到 stable/latest，而 `--tag beta` 一律只針對該次執行使用原始
  `beta` dist-tag。

## 試跑

預覽 `openclaw update` 會執行的動作而不做變更：

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

試跑會回報有效通道、目標版本、計畫動作，以及是否需要降級確認。

## 外掛與通道

使用 `openclaw update` 切換通道也會同步外掛來源：

- `dev` 會將已安裝且有 bundled 對應項目的外掛切回其 bundled（git checkout）來源。
- `stable` 和 `beta` 會還原以 npm 安裝或 ClawHub 安裝的外掛套件。
- `extended-stable` 會將具備 bare/default 或 `latest` 意圖的合格官方 npm 外掛
  解析到精確的已安裝核心版本。它不會在執行階段查詢外掛 `@extended-stable` 標籤。
- 以 npm 安裝的外掛會在核心更新完成後更新。

## 檢查目前狀態

```bash
openclaw update status
```

顯示作用中的通道（以及決定來源：設定、git 標籤、git 分支、已安裝版本或預設值）、
安裝類型（git 或套件）、目前版本，以及更新可用性。

## 標記最佳實務

- 為你希望 git checkout 落在其上的發行版加上標籤：穩定版使用 `vYYYY.M.PATCH`，
  beta 使用 `vYYYY.M.PATCH-beta.N`。具名預發行尾碼，例如
  `-alpha.N`、`-rc.N` 和 `-next.N`，不是 stable 或 beta 目標。
- 舊版數字穩定標籤，例如 `vYYYY.M.PATCH-1` 和 `v1.0.1-1`，仍會為了相容性
  被辨識為穩定 git 標籤。
- `vYYYY.M.PATCH.beta.N`（以點分隔）也會為了相容性被辨識；
  請優先使用 `-beta.N`。
- 保持標籤不可變：絕不要移動或重複使用標籤。
- npm dist-tags 仍是 npm 安裝的事實來源：
  - `latest` -> stable
  - `extended-stable` -> trailing supported-month 套件發行版
  - `beta` -> candidate 建置或 beta-first 穩定建置
  - `dev` -> main 快照（選用）

## macOS app 可用性

Beta 和 dev 建置可能**不**包含 macOS app 發行版。這沒有問題：

- git 標籤和 npm dist-tag 仍可各自發布。
- 在發行說明或變更日誌中指出「此 beta 沒有 macOS 建置」。

## 相關

- [更新](/zh-TW/install/updating)
- [安裝程式內部機制](/zh-TW/install/installer)

---
read_when:
    - '`openclaw.ai/install.sh` を理解したい場合'
    - インストールを自動化したい（CI / ヘッドレス）
    - GitHub チェックアウトからインストールしたい場合
summary: インストーラースクリプト（install.sh、install-cli.sh、install.ps1）の仕組み、フラグ、自動化
title: インストーラーの内部仕様
x-i18n:
    generated_at: "2026-06-27T11:49:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw は `openclaw.ai` から配信される 3 つのインストーラスクリプトを同梱しています。

| スクリプト                         | プラットフォーム     | 実行内容                                                                                                       |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 必要に応じて Node をインストールし、npm (デフォルト) または git 経由で OpenClaw をインストールし、オンボーディングを実行できます。 |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm または git checkout モードで、Node + OpenClaw をローカルプレフィックス (`~/.openclaw`) にインストールします。root は不要です。 |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 必要に応じて Node をインストールし、npm (デフォルト) または git 経由で OpenClaw をインストールし、オンボーディングを実行できます。 |

## クイックコマンド

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
インストールが成功しても、新しいターミナルで `openclaw` が見つからない場合は、[Node.js のトラブルシューティング](/ja-JP/install/node#troubleshooting)を参照してください。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL でのほとんどの対話型インストールに推奨されます。
</Tip>

### フロー (install.sh)

<Steps>
  <Step title="OS を検出">
    macOS と Linux (WSL を含む) をサポートします。
  </Step>
  <Step title="デフォルトで Node.js 24 を確保">
    Node バージョンを確認し、必要に応じて Node 24 をインストールします (macOS では Homebrew、Linux apt/dnf/yum では NodeSource セットアップスクリプト)。macOS では、インストーラーが Node または Git のために必要とする場合にのみ Homebrew がインストールされます。互換性のため、OpenClaw は現在 `22.19+` の Node 22 LTS も引き続きサポートしています。
    Alpine/musl Linux では、インストーラーは NodeSource ではなく apk パッケージを使用します。設定済みの Alpine リポジトリは Node `22.19+` を提供している必要があります (執筆時点では Alpine 3.21 以降)。
  </Step>
  <Step title="Git を確保">
    Git がない場合は、検出されたパッケージマネージャーを使用してインストールします。macOS の Homebrew と Alpine の apk も含みます。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` 方式 (デフォルト): グローバル npm インストール
    - `git` 方式: リポジトリを clone/update し、pnpm で依存関係をインストールして build した後、`~/.local/bin/openclaw` にラッパーをインストール

  </Step>
  <Step title="インストール後タスク">
    - 読み込まれている Gateway サービスをベストエフォートで更新します (`openclaw gateway install --force`、その後 restart)
    - アップグレード時と git インストール時に `openclaw doctor --non-interactive` を実行します (ベストエフォート)
    - 適切な場合にオンボーディングを試行します (TTY が利用可能、オンボーディングが無効化されていない、bootstrap/config チェックに合格)

  </Step>
</Steps>

### ソース checkout の検出

OpenClaw checkout (`package.json` + `pnpm-workspace.yaml`) 内で実行された場合、スクリプトは次を提示します。

- checkout を使用 (`git`)、または
- グローバルインストールを使用 (`npm`)

TTY が利用できず、インストール方式も設定されていない場合、デフォルトで `npm` になり、警告します。

無効な方式選択または無効な `--install-method` 値の場合、スクリプトはコード `2` で終了します。

### 例 (install.sh)

<Tabs>
  <Tab title="デフォルト">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="オンボーディングをスキップ">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git インストール">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="ドライラン">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| フラグ                                | 説明                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | インストール方式を選択します (デフォルト: `npm`)。エイリアス: `--method` |
| `--npm`                               | npm 方式のショートカット                                  |
| `--git`                               | git 方式のショートカット。エイリアス: `--github`          |
| `--version <version\|dist-tag\|spec>` | npm バージョン、dist-tag、またはパッケージ spec (デフォルト: `latest`) |
| `--beta`                              | 利用可能な場合は beta dist-tag を使用し、なければ `latest` にフォールバック |
| `--git-dir <path>`                    | checkout ディレクトリ (デフォルト: `~/openclaw`)。エイリアス: `--dir` |
| `--no-git-update`                     | 既存 checkout の `git pull` をスキップ                    |
| `--no-prompt`                         | プロンプトを無効化                                        |
| `--no-onboard`                        | オンボーディングをスキップ                                |
| `--onboard`                           | オンボーディングを有効化                                  |
| `--dry-run`                           | 変更を適用せずにアクションを出力                          |
| `--verbose`                           | デバッグ出力を有効化 (`set -x`、npm notice-level logs)    |
| `--help`                              | 使用方法を表示 (`-h`)                                     |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                              | 説明                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | インストール方式                                                   |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm バージョン、dist-tag、またはパッケージ spec                    |
| `OPENCLAW_BETA=0\|1`                              | 利用可能な場合は beta を使用                                       |
| `OPENCLAW_HOME=<path>`                            | OpenClaw state とデフォルト git/オンボーディングパスのベースディレクトリ |
| `OPENCLAW_GIT_DIR=<path>`                         | checkout ディレクトリ                                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git 更新を切り替え                                                  |
| `OPENCLAW_NO_PROMPT=1`                            | プロンプトを無効化                                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | オンボーディングをスキップ                                          |
| `OPENCLAW_DRY_RUN=1`                              | ドライランモード                                                    |
| `OPENCLAW_VERBOSE=1`                              | デバッグモード                                                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm ログレベル                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
すべてをローカルプレフィックス (デフォルト `~/.openclaw`) 配下に置き、システムの Node 依存関係を持たせたくない環境向けに設計されています。デフォルトでは npm インストールをサポートし、同じプレフィックスフロー配下で git-checkout インストールもサポートします。
</Info>

### フロー (install-cli.sh)

<Steps>
  <Step title="ローカル Node ランタイムをインストール">
    pin されたサポート対象 Node LTS tarball (バージョンはスクリプトに埋め込まれ、独立して更新されます) を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256 を検証します。
    Alpine/musl Linux では、Node が pin されたランタイム向けの互換 tarball を公開していないため、`apk` で `nodejs` と `npm` をインストールし、そのランタイムをプレフィックスのラッパーパスにリンクします。Alpine リポジトリは Node `22.19+` を提供している必要があります。古いリポジトリが Node 20 または 21 しか提供していない場合は、Alpine 3.21 以降を使用してください。
  </Step>
  <Step title="Git を確保">
    Git がない場合は、Linux では apt/dnf/yum/apk、macOS では Homebrew 経由でインストールを試行します。
  </Step>
  <Step title="OpenClaw をプレフィックス配下にインストール">
    - `npm` 方式 (デフォルト): npm でプレフィックス配下にインストールし、その後 `<prefix>/bin/openclaw` にラッパーを書き込みます
    - `git` 方式: checkout (デフォルト `~/openclaw`) を clone/update し、引き続き `<prefix>/bin/openclaw` にラッパーを書き込みます

  </Step>
  <Step title="読み込み済み Gateway サービスを更新">
    Gateway サービスが同じプレフィックスからすでに読み込まれている場合、スクリプトは
    `openclaw gateway install --force`、続いて `openclaw gateway restart` を実行し、
    Gateway health をベストエフォートで probe します。
  </Step>
</Steps>

### 例 (install-cli.sh)

<Tabs>
  <Tab title="デフォルト">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="カスタムプレフィックス + バージョン">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git インストール">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="自動化 JSON 出力">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="オンボーディングを実行">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| フラグ                      | 説明                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | インストールプレフィックス (デフォルト: `~/.openclaw`)                          |
| `--install-method npm\|git` | インストール方法を選択 (デフォルト: `npm`)。エイリアス: `--method`              |
| `--npm`                     | npm 方法のショートカット                                                        |
| `--git`, `--github`         | git 方法のショートカット                                                        |
| `--git-dir <path>`          | Git チェックアウトディレクトリ (デフォルト: `~/openclaw`)。エイリアス: `--dir` |
| `--version <ver>`           | OpenClaw バージョンまたは dist-tag (デフォルト: `latest`)                       |
| `--node-version <ver>`      | Node バージョン (デフォルト: `22.22.0`)                                         |
| `--json`                    | NDJSONイベントを出力                                                            |
| `--onboard`                 | インストール後に `openclaw onboard` を実行                                      |
| `--no-onboard`              | オンボーディングをスキップ (デフォルト)                                         |
| `--set-npm-prefix`          | Linux では、現在のプレフィックスに書き込めない場合 npm プレフィックスを `~/.npm-global` に強制 |
| `--help`                    | 使用方法を表示 (`-h`)                                                           |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                        | 説明                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | インストールプレフィックス                                           |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストール方法                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw バージョンまたは dist-tag                                   |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node バージョン                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw の状態とデフォルトの git/オンボーディングパスのベースディレクトリ |
| `OPENCLAW_GIT_DIR=<path>`                   | git インストール用の Git チェックアウトディレクトリ                  |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 既存のチェックアウトに対する git 更新を切り替え                      |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                                           |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm ログレベル                                                        |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### フロー (install.ps1)

<Steps>
  <Step title="PowerShell + Windows 環境を確認">
    PowerShell 5+ が必要です。
  </Step>
  <Step title="デフォルトで Node.js 24 を確認">
    見つからない場合は、winget、次に Chocolatey、次に Scoop でのインストールを試みます。利用可能なパッケージマネージャーがない場合、スクリプトは公式の Node.js Windows zip を `%LOCALAPPDATA%\OpenClaw\deps\portable-node` にダウンロードし、現在のプロセスとユーザー PATH に追加します。Node 22 LTS、現在は `22.19+` も互換性のためサポートされています。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` 方法 (デフォルト): 選択した `-Tag` を使ってグローバル npm インストールを行います。`C:\` など保護されたフォルダーで開いたシェルでも動作するよう、書き込み可能なインストーラー一時ディレクトリから起動されます
    - `git` 方法: リポジトリをクローン/更新し、pnpm でインストール/ビルドし、`%USERPROFILE%\.local\bin\openclaw.cmd` にラッパーをインストールします。Git が見つからない場合、スクリプトは `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 配下にユーザーローカルの MinGit をブートストラップし、現在のプロセスとユーザー PATH に追加します。

  </Step>
  <Step title="インストール後タスク">
    - 可能な場合、必要な bin ディレクトリをユーザー PATH に追加
    - 読み込まれた Gateway サービスをベストエフォートで更新 (`openclaw gateway install --force`、その後再起動)
    - アップグレードと git インストールで `openclaw doctor --non-interactive` を実行 (ベストエフォート)

  </Step>
  <Step title="失敗を処理">
    `iwr ... | iex` とスクリプトブロックによるインストールは、現在の PowerShell セッションを閉じずに終了エラーを報告します。直接の `powershell -File` / `pwsh -File` インストールは、自動化向けに引き続きゼロ以外で終了します。
  </Step>
</Steps>

### 例 (install.ps1)

<Tabs>
  <Tab title="デフォルト">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git インストール">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main チェックアウト">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="カスタム git ディレクトリ">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="ドライラン">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="デバッグトレース">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| フラグ                      | 説明                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | インストール方法 (デフォルト: `npm`)                       |
| `-Tag <tag\|version\|spec>` | npm dist-tag、バージョン、またはパッケージ仕様 (デフォルト: `latest`) |
| `-GitDir <path>`            | チェックアウトディレクトリ (デフォルト: `%USERPROFILE%\openclaw`) |
| `-NoOnboard`                | オンボーディングをスキップ                                 |
| `-NoGitUpdate`              | `git pull` をスキップ                                      |
| `-DryRun`                   | アクションのみを出力                                       |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                               | 説明                         |
| ---------------------------------- | ---------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | インストール方法             |
| `OPENCLAW_GIT_DIR=<path>`          | チェックアウトディレクトリ   |
| `OPENCLAW_NO_ONBOARD=1`            | オンボーディングをスキップ   |
| `OPENCLAW_GIT_UPDATE=0`            | git pull を無効化            |
| `OPENCLAW_DRY_RUN=1`               | ドライランモード             |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` が使用され、Git が見つからない場合、スクリプトは Git for Windows のリンクを表示する前にユーザーローカルの MinGit ブートストラップを試みます。
</Note>

---

## CI と自動化

予測可能な実行には、非対話型フラグ/環境変数を使用します。

<Tabs>
  <Tab title="install.sh (非対話型 npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (非対話型 git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (オンボーディングをスキップ)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Git が必要な理由">
    `git` インストール方法には Git が必要です。`npm` インストールの場合も、依存関係が git URL を使用するときの `spawn git ENOENT` エラーを避けるため、Git は引き続き確認/インストールされます。
  </Accordion>

  <Accordion title="Linux で npm が EACCES になる理由">
    一部の Linux セットアップでは、npm のグローバルプレフィックスが root 所有のパスを指します。`install.sh` はプレフィックスを `~/.npm-global` に切り替え、シェル rc ファイルに PATH エクスポートを追加できます (それらのファイルが存在する場合)。
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    インストーラーを再実行してユーザーローカルの MinGit をブートストラップできるようにするか、Git for Windows をインストールして PowerShell を開き直してください。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` を実行し、そのディレクトリをユーザー PATH に追加してください (Windows では `\bin` サフィックスは不要です)。その後、PowerShell を開き直してください。
  </Accordion>

  <Accordion title="Windows: インストーラーの詳細出力を取得する方法">
    `install.ps1` は現在 `-Verbose` スイッチを公開していません。
    スクリプトレベルの診断には PowerShell トレースを使用します:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="インストール後に openclaw が見つからない">
    通常は PATH の問題です。[Node.js トラブルシューティング](/ja-JP/install/node#troubleshooting)を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

- [インストール概要](/ja-JP/install)
- [更新](/ja-JP/install/updating)
- [アンインストール](/ja-JP/install/uninstall)

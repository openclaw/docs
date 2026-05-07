---
read_when:
    - '`openclaw.ai/install.sh` を理解したい'
    - インストールを自動化したい場合（CI / ヘッドレス）
    - GitHub チェックアウトからインストールしたい場合
summary: インストーラースクリプト (install.sh、install-cli.sh、install.ps1) の仕組み、フラグ、自動化
title: インストーラー内部
x-i18n:
    generated_at: "2026-05-07T13:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw は、`openclaw.ai` から提供される 3 つのインストーラースクリプトを同梱しています。

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
インストールが成功しても新しいターミナルで `openclaw` が見つからない場合は、[Node.js のトラブルシューティング](/ja-JP/install/node#troubleshooting)を参照してください。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL でのほとんどの対話型インストールに推奨されます。
</Tip>

### フロー (install.sh)

<Steps>
  <Step title="Detect OS">
    macOS と Linux (WSL を含む) をサポートします。macOS が検出され、Homebrew がない場合はインストールします。
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Node バージョンを確認し、必要に応じて Node 24 をインストールします (macOS では Homebrew、Linux apt/dnf/yum では NodeSource セットアップスクリプト)。OpenClaw は互換性のため、現在 `22.16+` の Node 22 LTS も引き続きサポートします。
  </Step>
  <Step title="Ensure Git">
    Git がない場合はインストールします。
  </Step>
  <Step title="Install OpenClaw">
    - `npm` メソッド (デフォルト): グローバル npm インストール
    - `git` メソッド: リポジトリを clone/update し、pnpm で依存関係をインストールし、build してから `~/.local/bin/openclaw` にラッパーをインストール

  </Step>
  <Step title="Post-install tasks">
    - 読み込み済みの gateway サービスをベストエフォートで更新します (`openclaw gateway install --force` の後に restart)
    - アップグレード時と git インストール時に `openclaw doctor --non-interactive` を実行します (ベストエフォート)
    - 条件が適切な場合にオンボーディングを試行します (TTY が利用可能、オンボーディングが無効化されていない、bootstrap/config チェックに合格)
    - デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` にします

  </Step>
</Steps>

### ソース checkout の検出

OpenClaw checkout (`package.json` + `pnpm-workspace.yaml`) 内で実行された場合、スクリプトは次を提示します。

- checkout (`git`) を使用、または
- グローバルインストール (`npm`) を使用

TTY が利用できず、インストールメソッドも設定されていない場合、デフォルトで `npm` になり、警告します。

無効なメソッド選択または無効な `--install-method` 値の場合、スクリプトはコード `2` で終了します。

### 例 (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| フラグ                                | 説明                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | インストールメソッドを選択します (デフォルト: `npm`)。エイリアス: `--method` |
| `--npm`                               | npm メソッドのショートカット                               |
| `--git`                               | git メソッドのショートカット。エイリアス: `--github`       |
| `--version <version\|dist-tag\|spec>` | npm バージョン、dist-tag、またはパッケージ仕様 (デフォルト: `latest`) |
| `--beta`                              | 利用可能な場合は beta dist-tag を使用し、それ以外は `latest` にフォールバック |
| `--git-dir <path>`                    | Checkout ディレクトリ (デフォルト: `~/openclaw`)。エイリアス: `--dir` |
| `--no-git-update`                     | 既存の checkout に対する `git pull` をスキップ             |
| `--no-prompt`                         | プロンプトを無効化                                         |
| `--no-onboard`                        | オンボーディングをスキップ                                 |
| `--onboard`                           | オンボーディングを有効化                                   |
| `--dry-run`                           | 変更を適用せずにアクションを出力                           |
| `--verbose`                           | デバッグ出力を有効化 (`set -x`、npm notice レベルのログ)   |
| `--help`                              | 使用方法を表示 (`-h`)                                      |

  </Accordion>

  <Accordion title="Environment variables reference">

| 変数                                                    | 説明                                          |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | インストールメソッド                          |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm バージョン、dist-tag、またはパッケージ仕様 |
| `OPENCLAW_BETA=0\|1`                                    | 利用可能な場合は beta を使用                  |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkout ディレクトリ                         |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git 更新を切り替え                            |
| `OPENCLAW_NO_PROMPT=1`                                  | プロンプトを無効化                            |
| `OPENCLAW_NO_ONBOARD=1`                                 | オンボーディングをスキップ                    |
| `OPENCLAW_DRY_RUN=1`                                    | ドライランモード                              |
| `OPENCLAW_VERBOSE=1`                                    | デバッグモード                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm ログレベル                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips の動作を制御 (デフォルト: `1`)  |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
すべてをローカルプレフィックス (デフォルト `~/.openclaw`) 配下に置き、システムの Node 依存を不要にしたい環境向けに設計されています。デフォルトで npm インストールをサポートし、同じプレフィックスフローで git-checkout インストールもサポートします。
</Info>

### フロー (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    ピン留めされたサポート対象の Node LTS tarball (バージョンはスクリプトに埋め込まれ、独立して更新されます) を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256 を検証します。
  </Step>
  <Step title="Ensure Git">
    Git がない場合、Linux では apt/dnf/yum、macOS では Homebrew 経由でインストールを試行します。
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm` メソッド (デフォルト): プレフィックス配下に npm でインストールし、その後 `<prefix>/bin/openclaw` にラッパーを書き込みます
    - `git` メソッド: checkout (デフォルト `~/openclaw`) を clone/update し、引き続き `<prefix>/bin/openclaw` にラッパーを書き込みます

  </Step>
  <Step title="Refresh loaded gateway service">
    Gateway サービスが同じプレフィックスからすでに読み込まれている場合、スクリプトは
    `openclaw gateway install --force`、続いて `openclaw gateway restart` を実行し、
    ベストエフォートで Gateway のヘルスを調べます。
  </Step>
</Steps>

### 例 (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| フラグ                      | 説明                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | インストールプレフィックス (デフォルト: `~/.openclaw`)                          |
| `--install-method npm\|git` | インストールメソッドを選択します (デフォルト: `npm`)。エイリアス: `--method`    |
| `--npm`                     | npm メソッドのショートカット                                                    |
| `--git`, `--github`         | git メソッドのショートカット                                                    |
| `--git-dir <path>`          | Git checkout ディレクトリ (デフォルト: `~/openclaw`)。エイリアス: `--dir`       |
| `--version <ver>`           | OpenClaw バージョンまたは dist-tag (デフォルト: `latest`)                       |
| `--node-version <ver>`      | Node バージョン (デフォルト: `22.22.0`)                                         |
| `--json`                    | NDJSON イベントを出力                                                           |
| `--onboard`                 | インストール後に `openclaw onboard` を実行                                      |
| `--no-onboard`              | オンボーディングをスキップ (デフォルト)                                         |
| `--set-npm-prefix`          | Linux で、現在のプレフィックスが書き込み可能でない場合に npm プレフィックスを `~/.npm-global` に強制 |
| `--help`                    | 使用方法を表示 (`-h`)                                                           |

  </Accordion>

  <Accordion title="Environment variables reference">

| 変数                                        | 説明                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | インストールプレフィックス                    |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストール方法                              |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw バージョンまたは dist-tag            |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node バージョン                               |
| `OPENCLAW_GIT_DIR=<path>`                   | git インストール用の Git チェックアウトディレクトリ |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 既存チェックアウトの git 更新を切り替え       |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm ログレベル                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips の動作を制御 (デフォルト: `1`)  |

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
    見つからない場合は、winget、次に Chocolatey、次に Scoop 経由でインストールを試みます。Node 22 LTS、現在は `22.16+` も互換性のため引き続きサポートされます。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` 方法 (デフォルト): 選択した `-Tag` を使用してグローバル npm インストールを行います。`C:\` などの保護されたフォルダーで開いたシェルでも動作するよう、書き込み可能なインストーラー一時ディレクトリから起動されます
    - `git` 方法: リポジトリを clone/update し、pnpm で install/build して、`%USERPROFILE%\.local\bin\openclaw.cmd` にラッパーをインストールします

  </Step>
  <Step title="インストール後のタスク">
    - 可能な場合、必要な bin ディレクトリをユーザー PATH に追加します
    - 読み込まれている Gateway サービスをベストエフォートで更新します (`openclaw gateway install --force`、その後 restart)
    - アップグレードおよび git インストール時に `openclaw doctor --non-interactive` を実行します (ベストエフォート)

  </Step>
  <Step title="失敗の処理">
    `iwr ... | iex` と scriptblock インストールは、現在の PowerShell セッションを閉じずに終了エラーを報告します。直接の `powershell -File` / `pwsh -File` インストールは、自動化向けに引き続き非ゼロで終了します。
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
  <Tab title="npm 経由の GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
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

| 変数                               | 説明                           |
| ---------------------------------- | ------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | インストール方法               |
| `OPENCLAW_GIT_DIR=<path>`          | チェックアウトディレクトリ     |
| `OPENCLAW_NO_ONBOARD=1`            | オンボーディングをスキップ     |
| `OPENCLAW_GIT_UPDATE=0`            | git pull を無効化              |
| `OPENCLAW_DRY_RUN=1`               | ドライランモード               |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` が使われ、Git が見つからない場合、スクリプトは終了し、Git for Windows のリンクを出力します。
</Note>

---

## CI と自動化

予測可能な実行のため、非対話フラグ/環境変数を使用します。

<Tabs>
  <Tab title="install.sh (非対話 npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (非対話 git)">
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
  <Accordion title="なぜ Git が必要ですか？">
    Git は `git` インストール方法に必要です。`npm` インストールでも、依存関係が git URL を使用するときの `spawn git ENOENT` 失敗を避けるため、Git は引き続き確認/インストールされます。
  </Accordion>

  <Accordion title="Linux で npm が EACCES になるのはなぜですか？">
    一部の Linux 環境では、npm グローバルプレフィックスが root 所有のパスを指しています。`install.sh` はプレフィックスを `~/.npm-global` に切り替え、シェル rc ファイルに PATH export を追記できます (それらのファイルが存在する場合)。
  </Accordion>

  <Accordion title="sharp/libvips の問題">
    スクリプトは、sharp がシステム libvips に対してビルドされるのを避けるため、デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` を使用します。上書きするには:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows をインストールし、PowerShell を開き直して、インストーラーを再実行してください。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` を実行し、そのディレクトリをユーザー PATH に追加してください (Windows では `\bin` サフィックスは不要です)。その後、PowerShell を開き直してください。
  </Accordion>

  <Accordion title="Windows: 詳細なインストーラー出力を取得する方法">
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

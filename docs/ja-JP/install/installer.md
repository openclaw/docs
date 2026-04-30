---
read_when:
    - '`openclaw.ai/install.sh` を理解したい'
    - インストールを自動化したい（CI / ヘッドレス）
    - GitHub チェックアウトからインストールしたい場合
summary: インストーラースクリプト（install.sh、install-cli.sh、install.ps1）の動作、フラグ、自動化
title: インストーラーの内部構造
x-i18n:
    generated_at: "2026-04-30T05:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw は、`openclaw.ai` から配信される 3 つのインストーラスクリプトを提供しています。

| スクリプト                         | プラットフォーム     | 処理内容                                                                                                              |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 必要に応じて Node をインストールし、npm (既定) または git 経由で OpenClaw をインストールし、オンボーディングを実行できます。 |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm または git チェックアウトモードで、Node + OpenClaw をローカルプレフィックス (`~/.openclaw`) にインストールします。root は不要です。 |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 必要に応じて Node をインストールし、npm (既定) または git 経由で OpenClaw をインストールし、オンボーディングを実行できます。 |

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
インストールに成功しても、新しいターミナルで `openclaw` が見つからない場合は、[Node.js のトラブルシューティング](/ja-JP/install/node#troubleshooting)を参照してください。
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
    macOS と Linux (WSL を含む) をサポートします。macOS が検出された場合、Homebrew がなければインストールします。
  </Step>
  <Step title="既定で Node.js 24 を確保">
    Node のバージョンを確認し、必要に応じて Node 24 をインストールします (macOS では Homebrew、Linux apt/dnf/yum では NodeSource セットアップスクリプト)。OpenClaw は互換性のため、現在 `22.14+` の Node 22 LTS も引き続きサポートします。
  </Step>
  <Step title="Git を確保">
    Git がなければインストールします。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` メソッド (既定): グローバル npm インストール
    - `git` メソッド: リポジトリをクローン/更新し、pnpm で依存関係をインストールしてビルドし、`~/.local/bin/openclaw` にラッパーをインストールします

  </Step>
  <Step title="インストール後のタスク">
    - 読み込み済みの gateway サービスをベストエフォートで更新します (`openclaw gateway install --force` の後に再起動)
    - アップグレード時と git インストール時に `openclaw doctor --non-interactive` を実行します (ベストエフォート)
    - 条件が合う場合にオンボーディングを試行します (TTY が利用可能、オンボーディングが無効化されていない、bootstrap/config チェックに合格)
    - `SHARP_IGNORE_GLOBAL_LIBVIPS=1` を既定にします

  </Step>
</Steps>

### ソースチェックアウトの検出

OpenClaw のチェックアウト内 (`package.json` + `pnpm-workspace.yaml`) で実行された場合、スクリプトは次を提示します。

- チェックアウトを使用 (`git`)、または
- グローバルインストールを使用 (`npm`)

TTY が利用できず、インストールメソッドも設定されていない場合は、既定で `npm` になり警告します。

無効なメソッド選択または無効な `--install-method` 値の場合、スクリプトはコード `2` で終了します。

### 例 (install.sh)

<Tabs>
  <Tab title="既定">
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
  <Tab title="npm 経由の GitHub main">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
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
| `--install-method npm\|git`           | インストールメソッドを選択します (既定: `npm`)。エイリアス: `--method` |
| `--npm`                               | npm メソッドのショートカット                              |
| `--git`                               | git メソッドのショートカット。エイリアス: `--github`       |
| `--version <version\|dist-tag\|spec>` | npm バージョン、dist-tag、またはパッケージ指定 (既定: `latest`) |
| `--beta`                              | 利用可能な場合は beta dist-tag を使用し、なければ `latest` にフォールバックします |
| `--git-dir <path>`                    | チェックアウトディレクトリ (既定: `~/openclaw`)。エイリアス: `--dir` |
| `--no-git-update`                     | 既存のチェックアウトで `git pull` をスキップします         |
| `--no-prompt`                         | プロンプトを無効化します                                  |
| `--no-onboard`                        | オンボーディングをスキップします                          |
| `--onboard`                           | オンボーディングを有効化します                            |
| `--dry-run`                           | 変更を適用せずにアクションを出力します                    |
| `--verbose`                           | デバッグ出力を有効化します (`set -x`、npm notice レベルのログ) |
| `--help`                              | 使用方法を表示します (`-h`)                               |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                                    | 説明                                          |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | インストールメソッド                          |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm バージョン、dist-tag、またはパッケージ指定 |
| `OPENCLAW_BETA=0\|1`                                    | 利用可能な場合は beta を使用                  |
| `OPENCLAW_GIT_DIR=<path>`                               | チェックアウトディレクトリ                    |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git 更新の切り替え                            |
| `OPENCLAW_NO_PROMPT=1`                                  | プロンプトを無効化                            |
| `OPENCLAW_NO_ONBOARD=1`                                 | オンボーディングをスキップ                    |
| `OPENCLAW_DRY_RUN=1`                                    | ドライランモード                              |
| `OPENCLAW_VERBOSE=1`                                    | デバッグモード                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm ログレベル                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips の動作を制御 (既定: `1`)        |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
すべてをローカルプレフィックス (既定 `~/.openclaw`) 配下に置き、
システムの Node 依存関係を不要にしたい環境向けに設計されています。既定では npm インストールをサポートし、
同じプレフィックスフローで git チェックアウトインストールもサポートします。
</Info>

### フロー (install-cli.sh)

<Steps>
  <Step title="ローカル Node ランタイムをインストール">
    ピン留めされたサポート対象の Node LTS tarball (バージョンはスクリプトに埋め込まれ、独立して更新されます) を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256 を検証します。
  </Step>
  <Step title="Git を確保">
    Git がない場合、Linux では apt/dnf/yum、macOS では Homebrew 経由でインストールを試行します。
  </Step>
  <Step title="プレフィックス配下に OpenClaw をインストール">
    - `npm` メソッド (既定): npm でプレフィックス配下にインストールし、`<prefix>/bin/openclaw` にラッパーを書き込みます
    - `git` メソッド: チェックアウト (既定 `~/openclaw`) をクローン/更新し、引き続き `<prefix>/bin/openclaw` にラッパーを書き込みます

  </Step>
  <Step title="読み込み済み Gateway サービスを更新">
    Gateway サービスが同じプレフィックスからすでに読み込まれている場合、スクリプトは
    `openclaw gateway install --force`、続いて `openclaw gateway restart` を実行し、
    Gateway のヘルスをベストエフォートで検査します。
  </Step>
</Steps>

### 例 (install-cli.sh)

<Tabs>
  <Tab title="既定">
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
| `--prefix <path>`           | インストールプレフィックス (既定: `~/.openclaw`)                                |
| `--install-method npm\|git` | インストールメソッドを選択します (既定: `npm`)。エイリアス: `--method`          |
| `--npm`                     | npm メソッドのショートカット                                                    |
| `--git`, `--github`         | git メソッドのショートカット                                                    |
| `--git-dir <path>`          | Git チェックアウトディレクトリ (既定: `~/openclaw`)。エイリアス: `--dir`        |
| `--version <ver>`           | OpenClaw バージョンまたは dist-tag (既定: `latest`)                             |
| `--node-version <ver>`      | Node バージョン (既定: `22.22.0`)                                                |
| `--json`                    | NDJSON イベントを出力                                                           |
| `--onboard`                 | インストール後に `openclaw onboard` を実行                                      |
| `--no-onboard`              | オンボーディングをスキップ (既定)                                               |
| `--set-npm-prefix`          | Linux で、現在のプレフィックスが書き込み不可の場合、npm プレフィックスを `~/.npm-global` に強制設定 |
| `--help`                    | 使用方法を表示します (`-h`)                                                     |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                        | 説明                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | インストールプレフィックス                    |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストール方法                              |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw のバージョンまたは dist-tag          |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node のバージョン                             |
| `OPENCLAW_GIT_DIR=<path>`                   | git インストール用の Git チェックアウトディレクトリ |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 既存のチェックアウトに対する git 更新を切り替える |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm ログレベル                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips の動作を制御する（デフォルト: `1`） |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### フロー (install.ps1)

<Steps>
  <Step title="PowerShell + Windows 環境を確認する">
    PowerShell 5+ が必要です。
  </Step>
  <Step title="デフォルトで Node.js 24 を確認する">
    見つからない場合は、winget、Chocolatey、Scoop の順にインストールを試みます。Node 22 LTS（現在は `22.14+`）は互換性のため引き続きサポートされます。
  </Step>
  <Step title="OpenClaw をインストールする">
    - `npm` 方法（デフォルト）: 選択した `-Tag` を使ったグローバル npm インストール
    - `git` 方法: リポジトリを clone/update し、pnpm で install/build して、`%USERPROFILE%\.local\bin\openclaw.cmd` にラッパーをインストールする

  </Step>
  <Step title="インストール後タスク">
    - 可能な場合は、必要な bin ディレクトリをユーザー PATH に追加する
    - 読み込まれている Gateway サービスをベストエフォートで更新する（`openclaw gateway install --force`、その後 restart）
    - アップグレード時と git インストール時に `openclaw doctor --non-interactive` を実行する（ベストエフォート）

  </Step>
  <Step title="失敗を処理する">
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
| `-InstallMethod npm\|git`   | インストール方法（デフォルト: `npm`）                      |
| `-Tag <tag\|version\|spec>` | npm dist-tag、バージョン、またはパッケージ spec（デフォルト: `latest`） |
| `-GitDir <path>`            | チェックアウトディレクトリ（デフォルト: `%USERPROFILE%\openclaw`） |
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
`-InstallMethod git` が使用され、Git が見つからない場合、スクリプトは終了し、Git for Windows のリンクを表示します。
</Note>

---

## CI と自動化

予測可能な実行には、非対話型のフラグ/環境変数を使用します。

<Tabs>
  <Tab title="install.sh（非対話型 npm）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh（非対話型 git）">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh（JSON）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1（オンボーディングをスキップ）">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## トラブルシューティング

<AccordionGroup>
  <Accordion title="なぜ Git が必要ですか?">
    Git は `git` インストール方法に必要です。`npm` インストールでも、依存関係が git URL を使用する場合の `spawn git ENOENT` エラーを避けるため、Git が確認/インストールされます。
  </Accordion>

  <Accordion title="Linux で npm が EACCES になるのはなぜですか?">
    一部の Linux セットアップでは、npm のグローバルプレフィックスが root 所有のパスを指しています。`install.sh` はプレフィックスを `~/.npm-global` に切り替え、PATH export をシェル rc ファイルに追記できます（それらのファイルが存在する場合）。
  </Accordion>

  <Accordion title="sharp/libvips の問題">
    スクリプトは、sharp がシステム libvips に対してビルドされるのを避けるため、デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` を設定します。上書きするには:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows をインストールし、PowerShell を開き直して、インストーラーを再実行します。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` を実行し、そのディレクトリをユーザー PATH に追加して（Windows では `\bin` サフィックスは不要）、PowerShell を開き直します。
  </Accordion>

  <Accordion title="Windows: インストーラーの詳細出力を取得する方法">
    `install.ps1` は現在、`-Verbose` スイッチを公開していません。
    スクリプトレベルの診断には PowerShell tracing を使用します:

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

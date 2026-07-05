---
read_when:
    - '`openclaw.ai/install.sh`を理解したい'
    - インストールを自動化したい場合（CI / ヘッドレス）
    - GitHub チェックアウトからインストールする場合
summary: インストーラースクリプト（install.sh、install-cli.sh、install.ps1）の仕組み、フラグ、自動化
title: インストーラーの内部
x-i18n:
    generated_at: "2026-07-05T11:32:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09ae87aa8be98fdbeb0e215702ee3d10b19cc304b6a81bd939afd5858d5bb470
    source_path: install/installer.md
    workflow: 16
---

OpenClaw は、`openclaw.ai` から配信される 3 つのインストーラスクリプトを同梱しています。

| スクリプト                             | プラットフォーム             | 実行内容                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 必要に応じて Node をインストールし、npm (デフォルト) または git 経由で OpenClaw をインストールし、オンボーディングを実行できます。       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm または git 経由で、Node + OpenClaw をローカルプレフィックス (`~/.openclaw`) にインストールします。root は不要です。 |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 必要に応じて Node をインストールし、npm (デフォルト) または git 経由で OpenClaw をインストールし、オンボーディングを実行できます。       |

3 つすべてが Node **22.19+、23.11+、または 24+** をサポートしています。新規インストールのデフォルトターゲットは Node 24 です。

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
インストールが成功したのに新しいターミナルで `openclaw` が見つからない場合は、[Node.js のトラブルシューティング](/ja-JP/install/node#troubleshooting) を参照してください。
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
    Node バージョンを確認し、必要に応じて Node 24 をインストールします (macOS では Homebrew、Linux apt/dnf/yum では NodeSource セットアップスクリプト)。macOS では、インストーラが Node または Git に必要とする場合にのみ Homebrew がインストールされます。Node 22.19+ と 23.11+ は互換性のために引き続きサポートされます。
    Alpine/musl Linux では、インストーラは NodeSource の代わりに apk パッケージを使用します。設定済みの Alpine リポジトリは、サポート対象の Node バージョンを提供している必要があります (執筆時点では Alpine 3.21 以降)。
  </Step>
  <Step title="Git を確保">
    Git がない場合は、検出されたパッケージマネージャーを使用してインストールします。macOS の Homebrew と Alpine の apk を含みます。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` メソッド (デフォルト): グローバル npm インストール
    - `git` メソッド: リポジトリを clone/update し、pnpm で依存関係をインストールして build した後、`~/.local/bin/openclaw` にラッパーをインストール

  </Step>
  <Step title="インストール後タスク">
    - 読み込まれている Gateway サービスをベストエフォートで更新します (`openclaw gateway install --force` の後に restart)
    - アップグレード時と git インストール時に `openclaw doctor --non-interactive` を実行します (ベストエフォート)
    - 適切な場合にオンボーディングを試行します (TTY が利用可能、オンボーディングが無効化されていない、bootstrap/config チェックに合格)
    - `--verify` が設定されている場合、インストール後の smoke verify を実行します

  </Step>
</Steps>

### ソース checkout の検出

OpenClaw checkout (`package.json` + `pnpm-workspace.yaml`) 内で実行された場合、スクリプトは次を提示します。

- checkout (`git`) を使用、または
- グローバルインストール (`npm`) を使用

TTY が利用できず、インストールメソッドも設定されていない場合は、デフォルトで `npm` になり警告します。

メソッド選択が無効、または `--install-method` の値が無効な場合、スクリプトはコード `2` で終了します。

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
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="インストール後に検証">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| フラグ                                    | 説明                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | インストールメソッドを選択します (デフォルト: `npm`)                                  |
| `--npm`                                 | npm メソッドのショートカット                                                 |
| `--git \| --github`                     | git メソッドのショートカット                                                 |
| `--version <version\|dist-tag\|spec>`   | npm バージョン、dist-tag、またはパッケージ spec (デフォルト: `latest`)              |
| `--beta`                                | 利用可能な場合は beta dist-tag を使用し、それ以外は `latest` にフォールバックします              |
| `--git-dir \| --dir <path>`             | checkout ディレクトリ (デフォルト: `~/openclaw`)                              |
| `--no-git-update`                       | 既存 checkout の `git pull` をスキップします                                   |
| `--no-prompt`                           | プロンプトを無効化します                                                         |
| `--no-onboard`                          | オンボーディングをスキップします                                                         |
| `--onboard`                             | オンボーディングを有効化します                                                       |
| `--verify`                              | インストール後の smoke verify を実行します (`--version`、読み込まれている場合は Gateway health) |
| `--dry-run`                             | 変更を適用せずにアクションを出力します                                  |
| `--verbose`                             | デバッグ出力を有効化します (`set -x`、npm notice-level ログ)                   |
| `--help \| -h`                          | 使用方法を表示します                                                              |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                          | 説明                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | インストールメソッド                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm バージョン、dist-tag、またはパッケージ spec                             |
| `OPENCLAW_BETA=0\|1`                              | 利用可能な場合は beta を使用します                                              |
| `OPENCLAW_HOME=<path>`                            | OpenClaw state とデフォルト git/onboarding パスのベースディレクトリ |
| `OPENCLAW_GIT_DIR=<path>`                         | checkout ディレクトリ                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git update を切り替えます                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | プロンプトを無効化します                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | インストール後の smoke verify を実行します                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | オンボーディングをスキップします                                                    |
| `OPENCLAW_DRY_RUN=1`                              | Dry run モード                                                       |
| `OPENCLAW_VERBOSE=1`                              | デバッグモード                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm ログレベル (デフォルト: `error`、npm の deprecation ノイズを隠します)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
すべてをローカルプレフィックス配下 (デフォルト `~/.openclaw`) に置き、システム Node 依存関係を持たせたくない環境向けに設計されています。デフォルトでは npm インストールをサポートし、同じプレフィックスフロー配下で git-checkout インストールもサポートします。
</Info>

### フロー (install-cli.sh)

<Steps>
  <Step title="ローカル Node runtime をインストール">
    pin されたサポート対象 Node LTS tarball (バージョンはスクリプトに埋め込まれ、独立して更新されます。デフォルト `22.22.0`) を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256 を検証します。
    Alpine/musl Linux では、Node が pin された runtime 用の互換 tarball を公開していないため、`apk` で `nodejs` と `npm` をインストールし、その runtime をプレフィックスラッパーパスにリンクします。Alpine リポジトリはサポート対象の Node バージョン (22.19+、23.11+、または 24+) を提供している必要があります。古いリポジトリが Node 20 または 21 しか提供していない場合は Alpine 3.21 以降を使用してください。
  </Step>
  <Step title="Git を確保">
    Git がない場合は、Linux の apt/dnf/yum/apk または macOS の Homebrew 経由でインストールを試行します。
  </Step>
  <Step title="プレフィックス配下に OpenClaw をインストール">
    - `npm` メソッド (デフォルト): npm でプレフィックス配下にインストールし、その後 `<prefix>/bin/openclaw` にラッパーを書き込みます
    - `git` メソッド: checkout (デフォルト `~/openclaw`) を clone/update し、それでも `<prefix>/bin/openclaw` にラッパーを書き込みます

  </Step>
  <Step title="読み込み済み Gateway サービスを更新">
    Gateway サービスが同じプレフィックスからすでに読み込まれている場合、スクリプトは
    `openclaw gateway install --force`、続いて `openclaw gateway restart` を実行し、
    Gateway health をベストエフォートでプローブします。
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

| フラグ                                  | 説明                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | インストール先プレフィックス（デフォルト: `~/.openclaw`）                       |
| `--install-method \| --method npm\|git` | インストール方法を選択（デフォルト: `npm`）                                     |
| `--npm`                                 | npm 方式のショートカット                                                        |
| `--git \| --github`                     | git 方式のショートカット                                                        |
| `--git-dir \| --dir <path>`             | Git チェックアウトディレクトリ（デフォルト: `~/openclaw`）                      |
| `--version <ver>`                       | OpenClaw バージョンまたは dist-tag（デフォルト: `latest`）                      |
| `--node-version <ver>`                  | Node バージョン（デフォルト: `22.22.0`）                                        |
| `--json`                                | NDJSON イベントを出力                                                           |
| `--onboard`                             | インストール後に `openclaw onboard` を実行                                      |
| `--no-onboard`                          | オンボーディングをスキップ（デフォルト）                                        |
| `--set-npm-prefix`                      | Linux で、現在のプレフィックスに書き込めない場合に npm プレフィックスを `~/.npm-global` に強制 |
| `--help \| -h`                          | 使用方法を表示                                                                  |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                        | 説明                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | インストール先プレフィックス                                          |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストール方法                                                      |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw バージョンまたは dist-tag                                    |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node バージョン                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw の状態とデフォルトの git/オンボーディングパスのベースディレクトリ |
| `OPENCLAW_GIT_DIR=<path>`                   | git インストール用の Git チェックアウトディレクトリ                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 既存チェックアウトの git 更新を切り替え                               |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                                            |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm ログレベル（デフォルト: `error`）                                 |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` などの GitHub ソース指定は、npm インストールの有効な `--version` ターゲットではありません。代わりに `--install-method git --version main` を使用してください。
</Note>

---

<a id="installps1"></a>

## install.ps1

### フロー（install.ps1）

<Steps>
  <Step title="PowerShell と Windows 環境を確認">
    PowerShell 5+ が必要です。
  </Step>
  <Step title="デフォルトで Node.js 24 を確認">
    見つからない場合は、winget、Chocolatey、Scoop の順にインストールを試行します。利用可能なパッケージマネージャーがない場合、スクリプトは公式の Node.js 24 Windows zip を `%LOCALAPPDATA%\OpenClaw\deps\portable-node` にダウンロードし、現在のプロセスとユーザー PATH に追加します。Node 22.19+ と 23.11+ は互換性のため引き続きサポートされます。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` 方式（デフォルト）: 選択した `-Tag` を使用してグローバル npm インストールを実行します。`C:\` などの保護されたフォルダーで開いたシェルでも動作するように、書き込み可能なインストーラー一時ディレクトリから起動します
    - `git` 方式: リポジトリをクローン/更新し、pnpm でインストール/ビルドして、`%USERPROFILE%\.local\bin\openclaw.cmd` にラッパーをインストールします。Git が見つからない場合、スクリプトは `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 配下にユーザーローカルの MinGit をブートストラップし、現在のプロセスとユーザー PATH に追加します。

  </Step>
  <Step title="インストール後タスク">
    - 可能な場合、必要な bin ディレクトリをユーザー PATH に追加します
    - 読み込まれている gateway サービスをベストエフォートで更新します（`openclaw gateway install --force` の後に再起動）
    - アップグレードと git インストール時に `openclaw doctor --non-interactive` を実行します（ベストエフォート）

  </Step>
  <Step title="失敗を処理">
    `iwr ... | iex` とスクリプトブロックによるインストールは、現在の PowerShell セッションを閉じずに終了エラーを報告します。直接の `powershell -File` / `pwsh -File` インストールは、自動化向けに引き続き非ゼロで終了します。
  </Step>
</Steps>

### 例（install.ps1）

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
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| フラグ                      | 説明                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | インストール方法（デフォルト: `npm`）                      |
| `-Tag <tag\|version\|spec>` | npm dist-tag、バージョン、またはパッケージ指定（デフォルト: `latest`） |
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
`-InstallMethod git` が使用され、Git が見つからない場合、スクリプトは Git for Windows のリンクを出力する前にユーザーローカルの MinGit ブートストラップを試行します。
</Note>

---

## CI と自動化

予測可能な実行には、非対話フラグ/環境変数を使用してください。

<Tabs>
  <Tab title="install.sh（非対話 npm）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh（非対話 git）">
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
  <Accordion title="なぜ Git が必要ですか？">
    Git は `git` インストール方式で必要です。`npm` インストールでも、依存関係が git URL を使用する場合の `spawn git ENOENT` エラーを避けるため、Git は引き続き確認/インストールされます。
  </Accordion>

  <Accordion title="Linux で npm が EACCES になるのはなぜですか？">
    一部の Linux セットアップでは、npm のグローバルプレフィックスが root 所有のパスを指しています。`install.sh` はプレフィックスを `~/.npm-global` に切り替え、シェルの rc ファイルに PATH export を追記できます（それらのファイルが存在する場合）。
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    インストーラーを再実行してユーザーローカルの MinGit をブートストラップするか、Git for Windows をインストールして PowerShell を再度開いてください。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` を実行し、そのディレクトリをユーザー PATH に追加してください（Windows では `\bin` サフィックスは不要です）。その後、PowerShell を再度開いてください。
  </Accordion>

  <Accordion title="Windows: インストーラーの詳細出力を取得する方法">
    `install.ps1` は `-Verbose` スイッチを公開していません。
    スクリプトレベルの診断には PowerShell トレースを使用してください。

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

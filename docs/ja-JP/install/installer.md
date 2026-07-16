---
read_when:
    - '`openclaw.ai/install.sh` を理解したい場合'
    - インストールを自動化したい（CI / ヘッドレス環境）
    - GitHub のチェックアウトからインストールする場合
summary: インストーラースクリプト（install.sh、install-cli.sh、install.ps1）の仕組み、フラグ、自動化
title: インストーラーの内部構造
x-i18n:
    generated_at: "2026-07-16T11:57:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw には、`openclaw.ai` から配信される 3 つのインストーラースクリプトが付属しています。

| スクリプト                             | プラットフォーム             | 実行内容                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 必要に応じて Node をインストールし、npm（デフォルト）または git で OpenClaw をインストールします。オンボーディングも実行できます。       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm または git を使用して、Node と OpenClaw をローカルプレフィックス（`~/.openclaw`）にインストールします。root 権限は不要です。 |
| [`install.ps1`](#installps1)       | Windows（PowerShell） | 必要に応じて Node をインストールし、npm（デフォルト）または git で OpenClaw をインストールします。オンボーディングも実行できます。       |

3 つすべてが Node **22.22.3+、24.15+、または 25.9+** をサポートしています。新規インストールでは Node 24 がデフォルトの対象です。

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
インストールに成功しても新しいターミナルで `openclaw` が見つからない場合は、[Node.js のトラブルシューティング](/ja-JP/install/node#troubleshooting)を参照してください。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSL でのほとんどの対話型インストールに推奨します。
</Tip>

### フロー（install.sh）

<Steps>
  <Step title="OS を検出">
    macOS と Linux（WSL を含む）をサポートします。
  </Step>
  <Step title="デフォルトで Node.js 24 を確保">
    Node のバージョンを確認し、必要に応じて Node 24 をインストールします（macOS では Homebrew、Linux では NodeSource の apt/dnf/yum セットアップスクリプト）。macOS では、インストーラーが Node または Git のために必要とする場合にのみ Homebrew がインストールされます。Node 22.22.3+、Node 24.15+、Node 25.9+ がサポートされ、Node 23 はサポートされません。
    Alpine/musl Linux では、インストーラーは NodeSource の代わりに apk パッケージを使用し、実際にリンクされている SQLite のバージョンを検証します。現在の安定版 Alpine パッケージストリームでは、十分に新しい Node であっても脆弱なシステム SQLite が提供される場合があります。その場合は、代わりに公式の `node:24-alpine` コンテナまたは glibc ベースのホストを使用してください。
  </Step>
  <Step title="Git を確保">
    Git がない場合は、検出されたパッケージマネージャーを使用してインストールします。これには macOS の Homebrew と Alpine の apk が含まれます。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` 方式（デフォルト）：npm でグローバルインストール
    - `git` 方式：リポジトリをクローンまたは更新し、pnpm で依存関係をインストールしてビルドした後、`~/.local/bin/openclaw` にラッパーをインストール

  </Step>
  <Step title="インストール後のタスク">
    - 後続コマンド用に、インストールされたばかりの `openclaw` バイナリを解決します
    - 未設定のインストールでは、doctor または Gateway のプローブより先にオンボーディングを開始します。`--no-onboard` が指定されている場合、または TTY がない場合は、後でセットアップを完了するためのコマンドを表示します。
    - 設定済みのインストールでは、読み込まれている Gateway サービスをベストエフォートで更新および再起動し、doctor を実行します。アップグレード時には、可能であれば Plugin を更新し、プロンプトが有効なヘッドレス実行では手動コマンドを表示します。
    - `--verify` の実行時には、インストール済みバージョンを確認し、設定が存在する場合にのみ Gateway の正常性を確認します。

  </Step>
</Steps>

### ソースチェックアウトの検出

OpenClaw のチェックアウト内（`package.json` + `pnpm-workspace.yaml`）で実行すると、スクリプトは次の選択肢を提示します。

- チェックアウトを使用（`git`）、または
- グローバルインストールを使用（`npm`）

TTY が利用できず、インストール方式も設定されていない場合は、デフォルトで `npm` を使用し、警告を表示します。

無効な方式の選択または無効な `--install-method` 値の場合、スクリプトはコード `2` で終了します。

### 例（install.sh）

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
  <Tab title="GitHub main チェックアウト">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="ドライラン">
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
  <Accordion title="フラグのリファレンス">

| フラグ                                    | 説明                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | インストール方式を選択（デフォルト：`npm`）                                  |
| `--npm`                                 | npm 方式のショートカット                                                 |
| `--git \| --github`                     | git 方式のショートカット                                                 |
| `--version <version\|dist-tag\|spec>`   | npm のバージョン、dist-tag、またはパッケージ仕様（デフォルト：`latest`）              |
| `--beta`                                | 利用可能な場合は beta dist-tag を使用し、それ以外は `latest` にフォールバック              |
| `--git-dir \| --dir <path>`             | チェックアウトディレクトリ（デフォルト：`~/openclaw`）                              |
| `--no-git-update`                       | 既存のチェックアウトに対する `git pull` をスキップ                                   |
| `--no-prompt`                           | プロンプトを無効化                                                         |
| `--no-onboard`                          | オンボーディングをスキップ                                                         |
| `--onboard`                             | オンボーディングを有効化                                                       |
| `--verify`                              | インストール後のスモーク検証を実行（`--version`、読み込み済みの場合は Gateway の正常性） |
| `--dry-run`                             | 変更を適用せずにアクションを表示                                  |
| `--verbose`                             | デバッグ出力を有効化（`set -x`、npm の notice レベルログ）                   |
| `--help \| -h`                          | 使用方法を表示                                                              |

  </Accordion>

  <Accordion title="環境変数のリファレンス">

| 変数                                          | 説明                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | インストール方式                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm のバージョン、dist-tag、またはパッケージ仕様                             |
| `OPENCLAW_BETA=0\|1`                              | 利用可能な場合は beta を使用                                              |
| `OPENCLAW_HOME=<path>`                            | OpenClaw の状態およびデフォルトの git/オンボーディングパスのベースディレクトリ |
| `OPENCLAW_GIT_DIR=<path>`                         | チェックアウトディレクトリ                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | git 更新の切り替え                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | プロンプトを無効化                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | インストール後のスモーク検証を実行                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | オンボーディングをスキップ                                                    |
| `OPENCLAW_DRY_RUN=1`                              | ドライランモード                                                       |
| `OPENCLAW_VERBOSE=1`                              | デバッグモード                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm ログレベル（デフォルト：`error`、npm の非推奨警告を非表示）      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
すべてをローカルプレフィックス（デフォルトは `~/.openclaw`）配下に配置し、
システムの Node に依存させたくない環境向けに設計されています。デフォルトでは npm インストールをサポートし、
同じプレフィックスフローで git チェックアウトからのインストールにも対応します。
</Info>

### フロー（install-cli.sh）

<Steps>
  <Step title="ローカル Node ランタイムをインストール">
    固定されたサポート対象の Node LTS tarball（バージョンはスクリプトに埋め込まれ、個別に更新されます。デフォルトは `24.15.0`）を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256 を検証します。
    公式の Node 24+ ARMv7 バイナリが利用できないため、Linux ARMv7 では Node `22.22.3` を使用します。
    固定されたランタイム用の互換 tarball が Node から公開されていない Alpine/musl Linux では、`apk` を使用して `nodejs` と `npm` をインストールし、Node と実際にリンクされた SQLite ライブラリの両方を検証します。現在の安定版 Alpine パッケージストリームでは、十分に新しい Node であっても脆弱な SQLite にリンクされる可能性があります。安全性チェックでパッケージが拒否された場合は、公式の `node:24-alpine` コンテナまたは glibc ベースのホストを使用してください。
  </Step>
  <Step title="Git を確保">
    Git がない場合は、Linux では apt/dnf/yum/apk、macOS では Homebrew を使用してインストールを試みます。
  </Step>
  <Step title="プレフィックス配下に OpenClaw をインストール">
    - `npm` 方式（デフォルト）：npm を使用してプレフィックス配下にインストールし、`<prefix>/bin/openclaw` にラッパーを書き込みます
    - `git` 方式：チェックアウト（デフォルトは `~/openclaw`）をクローンまたは更新し、同様に `<prefix>/bin/openclaw` にラッパーを書き込みます

  </Step>
  <Step title="読み込み済みの Gateway サービスを更新">
    同じプレフィックスから Gateway サービスがすでに読み込まれている場合、スクリプトは
    `openclaw gateway install --force` を実行して置き換え後のサービスを有効化し、
    その後、Gateway の正常性をベストエフォートでプローブします。
  </Step>
</Steps>

### 例（install-cli.sh）

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
  <Tab title="自動化用 JSON 出力">
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
  <Accordion title="フラグのリファレンス">

| フラグ                                    | 説明                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | インストールプレフィックス（デフォルト: `~/.openclaw`）                                         |
| `--install-method \| --method npm\|git` | インストール方法を選択（デフォルト: `npm`）                                          |
| `--npm`                                 | npm 方式のショートカット                                                         |
| `--git \| --github`                     | git 方式のショートカット                                                         |
| `--git-dir \| --dir <path>`             | Git チェックアウトディレクトリ（デフォルト: `~/openclaw`）                                  |
| `--version <ver>`                       | OpenClaw のバージョンまたは dist-tag（デフォルト: `latest`）                                |
| `--node-version <ver>`                  | Node のバージョン（デフォルト: `24.15.0`、Linux ARMv7 では `22.22.3`）                     |
| `--json`                                | NDJSON イベントを出力                                                              |
| `--onboard`                             | インストール後に `openclaw onboard` を実行                                            |
| `--no-onboard`                          | オンボーディングをスキップ（デフォルト）                                                       |
| `--set-npm-prefix`                      | Linux で現在のプレフィックスが書き込み不可の場合、npm プレフィックスを `~/.npm-global` に強制設定 |
| `--help \| -h`                          | 使用方法を表示                                                                      |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                    | 説明                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | インストールプレフィックス                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストール方法                                                     |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw のバージョンまたは dist-tag                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node のバージョン                                                       |
| `OPENCLAW_HOME=<path>`                      | OpenClaw の状態およびデフォルトの git/オンボーディングパスのベースディレクトリ |
| `OPENCLAW_GIT_DIR=<path>`                   | git インストール用の Git チェックアウトディレクトリ                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 既存チェックアウトの git 更新を切り替え                          |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm ログレベル（デフォルト: `error`）                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` およびその他の GitHub ソース指定は、npm インストールの有効な `--version` ターゲットではありません。代わりに `--install-method git --version main` を使用してください。
</Note>

---

<a id="installps1"></a>

## install.ps1

### フロー（install.ps1）

<Steps>
  <Step title="PowerShell と Windows 環境を確認">
    PowerShell 5 以降が必要です。
  </Step>
  <Step title="デフォルトで Node.js 24 を確保">
    存在しない場合、winget、Chocolatey、Scoop の順にインストールを試みます。利用可能なパッケージマネージャーがない場合、スクリプトは公式の Node.js 24 Windows zip を `%LOCALAPPDATA%\OpenClaw\deps\portable-node` にダウンロードし、現在のプロセスとユーザーの PATH に追加します。Node 22.22.3 以降、Node 24.15 以降、Node 25.9 以降がサポートされます。Node 23 はサポートされません。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` 方式（デフォルト）: 選択した `-Tag` を使用したグローバル npm インストール。書き込み可能なインストーラーの一時ディレクトリから起動するため、`C:\` などの保護されたフォルダーで開いたシェルでも動作します
    - `git` 方式: リポジトリをクローンまたは更新し、pnpm でインストールおよびビルドして、`%USERPROFILE%\.local\bin\openclaw.cmd` にラッパーをインストールします。Git が存在しない場合、スクリプトは `%LOCALAPPDATA%\OpenClaw\deps\portable-git` 配下にユーザーローカルの MinGit をブートストラップし、現在のプロセスとユーザーの PATH に追加します。

  </Step>
  <Step title="インストール後のタスク">
    - 可能な場合、必要な bin ディレクトリをユーザーの PATH に追加
    - 読み込み済みの Gateway サービスをベストエフォートで更新（`openclaw gateway install --force`、続いて再起動）
    - アップグレードおよび git インストール時に `openclaw doctor --non-interactive` を実行（ベストエフォート）

  </Step>
  <Step title="失敗を処理">
    `iwr ... | iex` およびスクリプトブロックによるインストールでは、現在の PowerShell セッションを閉じずに終了エラーを報告します。`powershell -File` / `pwsh -File` を直接使用したインストールでは、自動化のため引き続きゼロ以外のコードで終了します。
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

| フラグ                        | 説明                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | インストール方法（デフォルト: `npm`）                            |
| `-Tag <tag\|version\|spec>` | npm dist-tag、バージョン、またはパッケージ指定（デフォルト: `latest`） |
| `-GitDir <path>`            | チェックアウトディレクトリ（デフォルト: `%USERPROFILE%\openclaw`）     |
| `-NoOnboard`                | オンボーディングをスキップ                                            |
| `-NoGitUpdate`              | `git pull` をスキップ                                            |
| `-DryRun`                   | アクションのみを出力                                         |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                           | 説明        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | インストール方法     |
| `OPENCLAW_GIT_DIR=<path>`          | チェックアウトディレクトリ |
| `OPENCLAW_NO_ONBOARD=1`            | オンボーディングをスキップ    |
| `OPENCLAW_GIT_UPDATE=0`            | git pull を無効化   |
| `OPENCLAW_DRY_RUN=1`               | ドライランモード       |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` を使用し、Git が存在しない場合、スクリプトは Git for Windows のリンクを表示する前に、ユーザーローカルの MinGit のブートストラップを試みます。
</Note>

---

## CI と自動化

予測可能な実行には、非対話型のフラグまたは環境変数を使用してください。

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
  <Accordion title="Git が必要なのはなぜですか？">
    Git は `git` インストール方式に必要です。`npm` インストールでも、依存関係が git URL を使用している場合の `spawn git ENOENT` エラーを避けるため、Git の確認とインストールが行われます。
  </Accordion>

  <Accordion title="Linux で npm が EACCES になるのはなぜですか？">
    一部の Linux 環境では、npm のグローバルプレフィックスが root 所有のパスを指しています。`install.sh` はプレフィックスを `~/.npm-global` に切り替え、シェルの rc ファイルが存在する場合は PATH の export を追記できます。
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    インストーラーがユーザーローカルの MinGit をブートストラップできるように再実行するか、Git for Windows をインストールして PowerShell を開き直してください。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` を実行し、そのディレクトリをユーザーの PATH に追加して（Windows では `\bin` サフィックスは不要です）、PowerShell を開き直してください。
  </Accordion>

  <Accordion title="Windows: インストーラーの詳細出力を取得する方法">
    `install.ps1` には `-Verbose` スイッチがありません。
    スクリプトレベルの診断には PowerShell トレースを使用してください。

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="インストール後に openclaw が見つからない">
    通常は PATH の問題です。[Node.js のトラブルシューティング](/ja-JP/install/node#troubleshooting)を参照してください。
  </Accordion>
</AccordionGroup>

## 関連項目

- [インストール概要](/ja-JP/install)
- [更新](/ja-JP/install/updating)
- [アンインストール](/ja-JP/install/uninstall)

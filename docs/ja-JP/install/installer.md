---
read_when:
    - '`openclaw.ai/install.sh` を理解したい'
    - インストールを自動化したい（CI / ヘッドレス）
    - GitHub のチェックアウトからインストールしたい場合
summary: インストーラースクリプト (install.sh, install-cli.sh, install.ps1) の仕組み、フラグ、自動化
title: インストーラーの内部構造
x-i18n:
    generated_at: "2026-05-02T20:51:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
    source_path: install/installer.md
    workflow: 16
---

OpenClaw は `openclaw.ai` から配信される3つのインストーラスクリプトを同梱しています。

| Script                             | Platform             | 実行内容                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 必要に応じて Node をインストールし、npm（デフォルト）または git 経由で OpenClaw をインストールし、オンボーディングを実行できます。                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | npm または git チェックアウトモードで、Node + OpenClaw をローカルプレフィックス（`~/.openclaw`）にインストールします。root は不要です。 |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 必要に応じて Node をインストールし、npm（デフォルト）または git 経由で OpenClaw をインストールし、オンボーディングを実行できます。                   |

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
macOS/Linux/WSL でのほとんどの対話型インストールに推奨されます。
</Tip>

### フロー（install.sh）

<Steps>
  <Step title="OS を検出">
    macOS と Linux（WSL を含む）をサポートします。macOS が検出された場合、Homebrew がなければインストールします。
  </Step>
  <Step title="デフォルトで Node.js 24 を確保">
    Node のバージョンを確認し、必要に応じて Node 24 をインストールします（macOS では Homebrew、Linux の apt/dnf/yum では NodeSource セットアップスクリプト）。OpenClaw は互換性のため、現在 `22.14+` の Node 22 LTS も引き続きサポートしています。
  </Step>
  <Step title="Git を確保">
    Git がなければインストールします。
  </Step>
  <Step title="OpenClaw をインストール">
    - `npm` 方式（デフォルト）：グローバル npm インストール
    - `git` 方式：リポジトリを clone/update し、pnpm で依存関係をインストールし、ビルドしてから `~/.local/bin/openclaw` にラッパーをインストール

  </Step>
  <Step title="インストール後のタスク">
    - 読み込まれている Gateway サービスをベストエフォートで更新します（`openclaw gateway install --force` の後に再起動）
    - アップグレードと git インストールで `openclaw doctor --non-interactive` を実行します（ベストエフォート）
    - 適切な場合にオンボーディングを試行します（TTY が利用可能、オンボーディングが無効化されていない、bootstrap/config チェックを通過）
    - `SHARP_IGNORE_GLOBAL_LIBVIPS=1` をデフォルトにします

  </Step>
</Steps>

### ソースチェックアウトの検出

OpenClaw チェックアウト（`package.json` + `pnpm-workspace.yaml`）内で実行された場合、スクリプトは次を提示します。

- チェックアウトを使用（`git`）、または
- グローバルインストールを使用（`npm`）

TTY が利用できず、インストール方式も設定されていない場合は、デフォルトで `npm` になり警告します。

無効な方式選択または無効な `--install-method` 値の場合、スクリプトはコード `2` で終了します。

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

| フラグ                                  | 説明                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | インストール方式を選択します（デフォルト：`npm`）。エイリアス：`--method`  |
| `--npm`                               | npm 方式のショートカット                                    |
| `--git`                               | git 方式のショートカット。エイリアス：`--github`                 |
| `--version <version\|dist-tag\|spec>` | npm バージョン、dist-tag、または package spec（デフォルト：`latest`） |
| `--beta`                              | 利用可能なら beta dist-tag を使用し、そうでなければ `latest` にフォールバック  |
| `--git-dir <path>`                    | チェックアウトディレクトリ（デフォルト：`~/openclaw`）。エイリアス：`--dir` |
| `--no-git-update`                     | 既存チェックアウトの `git pull` をスキップ                      |
| `--no-prompt`                         | プロンプトを無効化                                            |
| `--no-onboard`                        | オンボーディングをスキップ                                            |
| `--onboard`                           | オンボーディングを有効化                                          |
| `--dry-run`                           | 変更を適用せずにアクションを出力                     |
| `--verbose`                           | デバッグ出力を有効化（`set -x`、npm notice-level ログ）      |
| `--help`                              | 使用方法を表示（`-h`）                                          |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                                | 説明                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | インストール方式                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm バージョン、dist-tag、または package spec        |
| `OPENCLAW_BETA=0\|1`                                    | 利用可能なら beta を使用                         |
| `OPENCLAW_GIT_DIR=<path>`                               | チェックアウトディレクトリ                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git 更新の切り替え                            |
| `OPENCLAW_NO_PROMPT=1`                                  | プロンプトを無効化                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | オンボーディングをスキップ                               |
| `OPENCLAW_DRY_RUN=1`                                    | ドライランモード                                  |
| `OPENCLAW_VERBOSE=1`                                    | デバッグモード                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm ログレベル                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips の挙動を制御（デフォルト：`1`） |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
すべてをローカルプレフィックス（デフォルト `~/.openclaw`）配下に置き、
システムの Node 依存関係を不要にしたい環境向けに設計されています。デフォルトでは npm インストールをサポートし、
同じプレフィックスフローでの git チェックアウトインストールにも対応しています。
</Info>

### フロー（install-cli.sh）

<Steps>
  <Step title="ローカル Node ランタイムをインストール">
    固定されたサポート対象の Node LTS tarball（バージョンはスクリプトに埋め込まれ、独立して更新されます）を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256 を検証します。
  </Step>
  <Step title="Git を確保">
    Git がない場合は、Linux では apt/dnf/yum、macOS では Homebrew 経由でインストールを試行します。
  </Step>
  <Step title="プレフィックス配下に OpenClaw をインストール">
    - `npm` 方式（デフォルト）：npm でプレフィックス配下にインストールし、その後 `<prefix>/bin/openclaw` にラッパーを書き込みます
    - `git` 方式：チェックアウト（デフォルト `~/openclaw`）を clone/update し、引き続き `<prefix>/bin/openclaw` にラッパーを書き込みます

  </Step>
  <Step title="読み込まれている Gateway サービスを更新">
    Gateway サービスが同じプレフィックスからすでに読み込まれている場合、スクリプトは
    `openclaw gateway install --force`、続いて `openclaw gateway restart` を実行し、
    Gateway のヘルスをベストエフォートで probe します。
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

| フラグ                        | 説明                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | インストールプレフィックス（デフォルト：`~/.openclaw`）                                         |
| `--install-method npm\|git` | インストール方式を選択します（デフォルト：`npm`）。エイリアス：`--method`                       |
| `--npm`                     | npm 方式のショートカット                                                         |
| `--git`, `--github`         | git 方式のショートカット                                                         |
| `--git-dir <path>`          | Git チェックアウトディレクトリ（デフォルト：`~/openclaw`）。エイリアス：`--dir`                  |
| `--version <ver>`           | OpenClaw バージョンまたは dist-tag（デフォルト：`latest`）                                |
| `--node-version <ver>`      | Node バージョン（デフォルト：`22.22.0`）                                               |
| `--json`                    | NDJSON イベントを出力                                                              |
| `--onboard`                 | インストール後に `openclaw onboard` を実行                                            |
| `--no-onboard`              | オンボーディングをスキップ（デフォルト）                                                       |
| `--set-npm-prefix`          | Linux では、現在の prefix が書き込み不可の場合に npm prefix を `~/.npm-global` に強制 |
| `--help`                    | 使用方法を表示（`-h`）                                                               |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数                                        | 説明                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | インストールプレフィックス                    |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストール方法                              |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw のバージョンまたは dist-tag          |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node バージョン                               |
| `OPENCLAW_GIT_DIR=<path>`                   | git インストール用の Git チェックアウトディレクトリ |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 既存チェックアウトの git 更新を切り替え       |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm ログレベル                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips の動作を制御（デフォルト: `1`） |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### フロー（install.ps1）

<Steps>
  <Step title="PowerShell + Windows 環境を確認する">
    PowerShell 5+ が必要です。
  </Step>
  <Step title="デフォルトで Node.js 24 を確認する">
    存在しない場合は、winget、Chocolatey、Scoop の順にインストールを試みます。Node 22 LTS（現在は `22.14+`）も互換性のため引き続きサポートされます。
  </Step>
  <Step title="OpenClaw をインストールする">
    - `npm` 方法（デフォルト）: 選択した `-Tag` を使用してグローバル npm インストールを行い、書き込み可能なインストーラー一時ディレクトリから起動するため、`C:\` などの保護されたフォルダーで開いたシェルでも動作します
    - `git` 方法: リポジトリをクローン/更新し、pnpm でインストール/ビルドして、`%USERPROFILE%\.local\bin\openclaw.cmd` にラッパーをインストールします

  </Step>
  <Step title="インストール後のタスク">
    - 可能な場合は必要な bin ディレクトリをユーザー PATH に追加します
    - 読み込まれている Gateway サービスをベストエフォートで更新します（`openclaw gateway install --force` の後に再起動）
    - アップグレード時と git インストール時に `openclaw doctor --non-interactive` を実行します（ベストエフォート）

  </Step>
  <Step title="失敗を処理する">
    `iwr ... | iex` とスクリプトブロックによるインストールは、現在の PowerShell セッションを閉じずに終了エラーを報告します。直接の `powershell -File` / `pwsh -File` インストールは、自動化向けに引き続きゼロ以外で終了します。
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
`-InstallMethod git` を使用していて Git が存在しない場合、スクリプトは終了し、Git for Windows のリンクを出力します。
</Note>

---

## CI と自動化

予測可能な実行には非対話フラグ/環境変数を使用します。

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
  <Accordion title="Git が必要なのはなぜですか？">
    Git は `git` インストール方法に必要です。`npm` インストールでも、依存関係が git URL を使用する場合の `spawn git ENOENT` エラーを避けるため、Git は引き続き確認/インストールされます。
  </Accordion>

  <Accordion title="Linux で npm が EACCES になるのはなぜですか？">
    一部の Linux セットアップでは、npm グローバルプレフィックスが root 所有のパスを指しています。`install.sh` はプレフィックスを `~/.npm-global` に切り替え、PATH エクスポートをシェル rc ファイルに追記できます（それらのファイルが存在する場合）。
  </Accordion>

  <Accordion title="sharp/libvips の問題">
    スクリプトは、sharp がシステム libvips に対してビルドされるのを避けるため、デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` を使用します。上書きするには:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows をインストールし、PowerShell を開き直して、インストーラーを再実行します。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` を実行し、そのディレクトリをユーザー PATH に追加します（Windows では `\bin` サフィックスは不要です）。その後、PowerShell を開き直します。
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

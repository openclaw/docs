---
read_when:
    - '`openclaw.ai/install.sh` を理解したい'
    - インストールを自動化したい（CI / ヘッドレス）
    - GitHub checkout からインストールしたい
summary: インストーラスクリプトの仕組み（install.sh、install-cli.sh、install.ps1）、フラグ、自動化
title: インストーラ内部
x-i18n:
    generated_at: "2026-04-24T05:04:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc54080bb93ffab3dc7827f568a0a44cda89c6d3c5f9d485c6dde7ca42837807
    source_path: install/installer.md
    workflow: 15
---

OpenClawには、`openclaw.ai` から配信される3つのインストーラスクリプトがあります。

| スクリプト | プラットフォーム | 役割 |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 必要に応じてNodeをインストールし、OpenClawをnpm（デフォルト）またはgitでインストールし、オンボーディングも実行できます。 |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | OpenClawをローカルprefix（`~/.openclaw`）にnpmまたはgit checkoutモードでインストールします。root不要です。 |
| [`install.ps1`](#installps1)       | Windows（PowerShell） | 必要に応じてNodeをインストールし、OpenClawをnpm（デフォルト）またはgitでインストールし、オンボーディングも実行できます。 |

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
インストールに成功したのに新しいターミナルで `openclaw` が見つからない場合は、[Node.jsトラブルシューティング](/ja-JP/install/node#troubleshooting) を参照してください。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSLでの対話型インストールの大半には、これを推奨します。
</Tip>

### フロー（install.sh）

<Steps>
  <Step title="OSを検出する">
    macOSとLinux（WSLを含む）をサポートします。macOSが検出された場合、Homebrewがなければインストールします。
  </Step>
  <Step title="デフォルトでNode.js 24を確保する">
    Nodeのバージョンを確認し、必要に応じてNode 24をインストールします（macOSではHomebrew、Linuxではapt/dnf/yum向けのNodeSourceセットアップスクリプト）。互換性のため、OpenClawは引き続きNode 22 LTS、現在は `22.14+` もサポートしています。
  </Step>
  <Step title="Gitを確保する">
    Gitがなければインストールします。
  </Step>
  <Step title="OpenClawをインストールする">
    - `npm` メソッド（デフォルト）: グローバルnpmインストール
    - `git` メソッド: repoをclone/updateし、pnpmで依存関係をインストールし、ビルドし、その後ラッパーを `~/.local/bin/openclaw` にインストール
  </Step>
  <Step title="インストール後タスク">
    - 読み込み済みgatewayサービスをベストエフォートで更新（`openclaw gateway install --force`、その後再起動）
    - アップグレード時およびgitインストール時に `openclaw doctor --non-interactive` を実行（ベストエフォート）
    - 適切な場合はオンボーディングを試行（TTYがあり、オンボーディングが無効化されておらず、bootstrap/configチェックを通る場合）
    - デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### ソースcheckoutの検出

OpenClaw checkout内（`package.json` + `pnpm-workspace.yaml`）で実行された場合、このスクリプトは次を提案します:

- checkoutを使う（`git`）、または
- グローバルインストールを使う（`npm`）

TTYが利用できず、インストール方法も設定されていない場合、デフォルトで `npm` を選び、警告を出します。

このスクリプトは、無効なメソッド選択または無効な `--install-method` 値に対して終了コード `2` で終了します。

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
  <Tab title="gitインストール">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="npm経由でGitHub main">
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
  <Accordion title="フラグリファレンス">

| フラグ | 説明 |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | インストール方法を選択（デフォルト: `npm`）。別名: `--method` |
| `--npm`                               | npmメソッドのショートカット |
| `--git`                               | gitメソッドのショートカット。別名: `--github` |
| `--version <version\|dist-tag\|spec>` | npmバージョン、dist-tag、またはpackage spec（デフォルト: `latest`） |
| `--beta`                              | 利用可能ならbeta dist-tagを使い、なければ `latest` にフォールバック |
| `--git-dir <path>`                    | checkoutディレクトリ（デフォルト: `~/openclaw`）。別名: `--dir` |
| `--no-git-update`                     | 既存checkoutに対する `git pull` をスキップ |
| `--no-prompt`                         | プロンプトを無効化 |
| `--no-onboard`                        | オンボーディングをスキップ |
| `--onboard`                           | オンボーディングを有効化 |
| `--dry-run`                           | 変更を適用せず、実行内容だけを表示 |
| `--verbose`                           | デバッグ出力を有効化（`set -x`、npmのnoticeレベルログ） |
| `--help`                              | 使用方法を表示（`-h`） |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数 | 説明 |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | インストール方法 |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npmバージョン、dist-tag、またはpackage spec |
| `OPENCLAW_BETA=0\|1`                                    | 利用可能ならbetaを使う |
| `OPENCLAW_GIT_DIR=<path>`                               | checkoutディレクトリ |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git更新の切り替え |
| `OPENCLAW_NO_PROMPT=1`                                  | プロンプトを無効化 |
| `OPENCLAW_NO_ONBOARD=1`                                 | オンボーディングをスキップ |
| `OPENCLAW_DRY_RUN=1`                                    | dry runモード |
| `OPENCLAW_VERBOSE=1`                                    | デバッグモード |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npmログレベル |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvipsの動作を制御（デフォルト: `1`） |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
すべてをローカルprefix（デフォルト `~/.openclaw`）配下に置き、システムのNode依存関係を持ちたくない環境向けに設計されています。デフォルトではnpmインストールを使い、同じprefixフロー内でgit checkoutインストールもサポートします。
</Info>

### フロー（install-cli.sh）

<Steps>
  <Step title="ローカルNodeランタイムをインストールする">
    ピン留めされたサポート対象Node LTS tarball（バージョンはスクリプト内に埋め込まれており、独立して更新されます）を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256を検証します。
  </Step>
  <Step title="Gitを確保する">
    Gitがない場合、Linuxではapt/dnf/yum、macOSではHomebrew経由でインストールを試みます。
  </Step>
  <Step title="prefix配下にOpenClawをインストールする">
    - `npm` メソッド（デフォルト）: prefix配下にnpmでインストールし、その後ラッパーを `<prefix>/bin/openclaw` に書き込みます
    - `git` メソッド: checkoutをclone/updateし（デフォルト `~/openclaw`）、それでもラッパーは `<prefix>/bin/openclaw` に書き込みます
  </Step>
  <Step title="読み込み済みgatewayサービスを更新する">
    その同じprefixからgatewayサービスがすでに読み込まれている場合、スクリプトは
    `openclaw gateway install --force` を実行し、その後 `openclaw gateway restart` を実行し、
    ベストエフォートでgateway healthをprobeします。
  </Step>
</Steps>

### 例（install-cli.sh）

<Tabs>
  <Tab title="デフォルト">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="カスタムprefix + バージョン">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="gitインストール">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="自動化向けJSON出力">
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

| フラグ | 説明 |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | インストールprefix（デフォルト: `~/.openclaw`） |
| `--install-method npm\|git` | インストール方法を選択（デフォルト: `npm`）。別名: `--method` |
| `--npm`                     | npmメソッドのショートカット |
| `--git`, `--github`         | gitメソッドのショートカット |
| `--git-dir <path>`          | git checkoutディレクトリ（デフォルト: `~/openclaw`）。別名: `--dir` |
| `--version <ver>`           | OpenClawバージョンまたはdist-tag（デフォルト: `latest`） |
| `--node-version <ver>`      | Nodeバージョン（デフォルト: `22.22.0`） |
| `--json`                    | NDJSONイベントを出力 |
| `--onboard`                 | インストール後に `openclaw onboard` を実行 |
| `--no-onboard`              | オンボーディングをスキップ（デフォルト） |
| `--set-npm-prefix`          | Linuxで現在のprefixが書き込み不可の場合、npm prefixを `~/.npm-global` に強制設定 |
| `--help`                    | 使用方法を表示（`-h`） |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数 | 説明 |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | インストールprefix |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストール方法 |
| `OPENCLAW_VERSION=<ver>`                    | OpenClawバージョンまたはdist-tag |
| `OPENCLAW_NODE_VERSION=<ver>`               | Nodeバージョン |
| `OPENCLAW_GIT_DIR=<path>`                   | git installs用のGit checkoutディレクトリ |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 既存checkoutに対するgit更新の切り替え |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npmログレベル |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvipsの動作を制御（デフォルト: `1`） |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### フロー（install.ps1）

<Steps>
  <Step title="PowerShell + Windows環境を確保する">
    PowerShell 5+ が必要です。
  </Step>
  <Step title="デフォルトでNode.js 24を確保する">
    なければ、winget、次にChocolatey、次にScoop経由でインストールを試みます。互換性のため、Node 22 LTS、現在は `22.14+` も引き続きサポートされます。
  </Step>
  <Step title="OpenClawをインストールする">
    - `npm` メソッド（デフォルト）: 選択された `-Tag` を使ってグローバルnpmインストール
    - `git` メソッド: repoをclone/updateし、pnpmでinstall/buildし、ラッパーを `%USERPROFILE%\.local\bin\openclaw.cmd` にインストール
  </Step>
  <Step title="インストール後タスク">
    - 可能であれば必要なbinディレクトリをユーザーPATHに追加
    - 読み込み済みgatewayサービスをベストエフォートで更新（`openclaw gateway install --force`、その後再起動）
    - アップグレード時およびgitインストール時に `openclaw doctor --non-interactive` を実行（ベストエフォート）
  </Step>
</Steps>

### 例（install.ps1）

<Tabs>
  <Tab title="デフォルト">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="gitインストール">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="npm経由でGitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="カスタムgitディレクトリ">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
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

| フラグ | 説明 |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | インストール方法（デフォルト: `npm`） |
| `-Tag <tag\|version\|spec>` | npm dist-tag、バージョン、またはpackage spec（デフォルト: `latest`） |
| `-GitDir <path>`            | checkoutディレクトリ（デフォルト: `%USERPROFILE%\openclaw`） |
| `-NoOnboard`                | オンボーディングをスキップ |
| `-NoGitUpdate`              | `git pull` をスキップ |
| `-DryRun`                   | 実行内容だけを表示 |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| 変数 | 説明 |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | インストール方法 |
| `OPENCLAW_GIT_DIR=<path>`          | checkoutディレクトリ |
| `OPENCLAW_NO_ONBOARD=1`            | オンボーディングをスキップ |
| `OPENCLAW_GIT_UPDATE=0`            | git pullを無効化 |
| `OPENCLAW_DRY_RUN=1`               | dry runモード |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` を使っていてGitがない場合、スクリプトは終了し、Git for Windowsへのリンクを表示します。
</Note>

---

## CIと自動化

予測可能な実行のために、非対話フラグ/環境変数を使ってください。

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
  <Accordion title="なぜGitが必要なのですか？">
    Gitは `git` インストール方法に必要です。`npm` インストールでも、依存関係がgit URLを使っている場合の `spawn git ENOENT` 失敗を避けるため、Gitは確認/インストールされます。
  </Accordion>

  <Accordion title="なぜLinuxでnpmがEACCESになるのですか？">
    一部のLinux構成では、npm global prefixがroot所有パスを指しています。`install.sh` はprefixを `~/.npm-global` に切り替え、shell rcファイルが存在する場合はPATH exportを追記できます。
  </Accordion>

  <Accordion title="sharp/libvipsの問題">
    スクリプトは、sharpがシステムlibvipsに対してビルドされるのを避けるため、デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` を設定します。上書きするには:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windowsをインストールし、PowerShellを開き直して、インストーラを再実行してください。
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` を実行し、そのディレクトリをユーザーPATHに追加してください（Windowsでは `\bin` サフィックス不要）。その後PowerShellを開き直してください。
  </Accordion>

  <Accordion title="Windows: verboseなインストーラ出力を得る方法">
    `install.ps1` は現在 `-Verbose` スイッチを公開していません。
    スクリプトレベルの診断にはPowerShell tracingを使ってください:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="インストール後にopenclawが見つからない">
    通常はPATHの問題です。[Node.jsトラブルシューティング](/ja-JP/install/node#troubleshooting) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

- [インストール概要](/ja-JP/install)
- [更新](/ja-JP/install/updating)
- [アンインストール](/ja-JP/install/uninstall)

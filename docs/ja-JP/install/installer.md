---
read_when:
    - '`openclaw.ai/install.sh` を理解したい場合'
    - インストールを自動化したい場合（CI / ヘッドレス）
    - GitHub checkoutからインストールしたい場合
summary: インストーラースクリプト（install.sh、install-cli.sh、install.ps1）の仕組み、フラグ、自動化
title: インストーラー内部
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:33:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

OpenClawには、`openclaw.ai` から配信される3つのインストーラースクリプトがあります。

| Script                             | Platform             | 動作内容                                                                                                      |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | 必要に応じてNodeをインストールし、npm（デフォルト）またはgitでOpenClawをインストールし、オンボーディングも実行できます。 |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClawをローカルprefix（`~/.openclaw`）にnpmまたはgit checkoutモードでインストールします。root不要です。 |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | 必要に応じてNodeをインストールし、npm（デフォルト）またはgitでOpenClawをインストールし、オンボーディングも実行できます。 |

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
インストールは成功したのに新しいterminalで `openclaw` が見つからない場合は、[Node.js troubleshooting](/ja-JP/install/node#troubleshooting) を参照してください。
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
macOS/Linux/WSLでの対話型インストールの大半では、これを推奨します。
</Tip>

### フロー（install.sh）

<Steps>
  <Step title="OSを検出">
    macOSとLinux（WSLを含む）をサポートします。macOSが検出された場合、Homebrewがなければインストールします。
  </Step>
  <Step title="デフォルトでNode.js 24を確保">
    Node versionを確認し、必要に応じてNode 24をインストールします（macOSではHomebrew、LinuxではNodeSourceのsetup scriptをapt/dnf/yumで使用）。OpenClawは互換性のため、現在 `22.14+` のNode 22 LTSも引き続きサポートしています。
  </Step>
  <Step title="Gitを確保">
    Gitがなければインストールします。
  </Step>
  <Step title="OpenClawをインストール">
    - `npm` method（デフォルト）: グローバルnpmインストール
    - `git` method: repoをclone/updateし、pnpmで依存関係をインストールしてbuildし、その後 `~/.local/bin/openclaw` にwrapperをインストール
  </Step>
  <Step title="インストール後タスク">
    - 読み込み済みgateway serviceをベストエフォートで更新（`openclaw gateway install --force`、その後restart）
    - upgrade時とgit install時に `openclaw doctor --non-interactive` を実行（ベストエフォート）
    - 条件が整っていればオンボーディングを試行（TTYあり、オンボーディング未無効化、bootstrap/configチェック通過）
    - デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` を設定
  </Step>
</Steps>

### source checkoutの検出

OpenClaw checkout内（`package.json` + `pnpm-workspace.yaml`）で実行した場合、scriptは次を提示します:

- checkoutを使う（`git`）、または
- グローバルインストールを使う（`npm`）

TTYが利用できず、インストールmethodも設定されていない場合、デフォルトで `npm` になり、警告が表示されます。

無効なmethod選択または無効な `--install-method` 値に対して、scriptは終了コード `2` で終了します。

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
  <Tab title="Gitインストール">
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

| Flag                                  | 説明                                                         |
| ------------------------------------- | ------------------------------------------------------------ |
| `--install-method npm\|git`           | インストールmethodを選択（デフォルト: `npm`）。別名: `--method` |
| `--npm`                               | npm methodのショートカット                                   |
| `--git`                               | git methodのショートカット。別名: `--github`                 |
| `--version <version\|dist-tag\|spec>` | npm version、dist-tag、またはpackage spec（デフォルト: `latest`） |
| `--beta`                              | 利用可能ならbeta dist-tagを使い、なければ `latest` にフォールバック |
| `--git-dir <path>`                    | checkout directory（デフォルト: `~/openclaw`）。別名: `--dir` |
| `--no-git-update`                     | 既存checkoutに対する `git pull` をスキップ                   |
| `--no-prompt`                         | promptを無効化                                               |
| `--no-onboard`                        | オンボーディングをスキップ                                   |
| `--onboard`                           | オンボーディングを有効化                                     |
| `--dry-run`                           | 変更を適用せずに実行内容だけ表示                             |
| `--verbose`                           | デバッグ出力を有効化（`set -x`、npm notice-level log）       |
| `--help`                              | 使用方法を表示（`-h`）                                       |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| Variable                                                | 説明                                              |
| ------------------------------------------------------- | ------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | インストールmethod                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm version、dist-tag、またはpackage spec         |
| `OPENCLAW_BETA=0\|1`                                    | 利用可能ならbetaを使用                            |
| `OPENCLAW_GIT_DIR=<path>`                               | checkout directory                                |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | git updateの切り替え                              |
| `OPENCLAW_NO_PROMPT=1`                                  | promptを無効化                                    |
| `OPENCLAW_NO_ONBOARD=1`                                 | オンボーディングをスキップ                        |
| `OPENCLAW_DRY_RUN=1`                                    | dry runモード                                     |
| `OPENCLAW_VERBOSE=1`                                    | デバッグモード                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm log level                                     |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | sharp/libvips動作を制御（デフォルト: `1`）        |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
デフォルトでローカルprefix（`~/.openclaw`）配下にすべてを配置し、system Node依存をなくしたい環境向けに設計されています。デフォルトでnpm installをサポートし、同じprefixフロー配下でgit checkout installもサポートします。
</Info>

### フロー（install-cli.sh）

<Steps>
  <Step title="ローカルNode runtimeをインストール">
    固定されたサポート対象Node LTS tarball（versionはscript内に埋め込まれ、独立して更新されます）を `<prefix>/tools/node-v<version>` にダウンロードし、SHA-256を検証します。
  </Step>
  <Step title="Gitを確保">
    Gitがない場合、Linuxではapt/dnf/yum、macOSではHomebrew経由でインストールを試みます。
  </Step>
  <Step title="prefix配下にOpenClawをインストール">
    - `npm` method（デフォルト）: npmでprefix配下にインストールし、その後 `<prefix>/bin/openclaw` にwrapperを書き込みます
    - `git` method: checkoutをclone/updateし（デフォルト `~/openclaw`）、それでもwrapperは `<prefix>/bin/openclaw` に書き込みます
  </Step>
  <Step title="読み込み済みgateway serviceを更新">
    同じprefixからすでにgateway serviceが読み込まれている場合、scriptは
    `openclaw gateway install --force`、続けて `openclaw gateway restart` を実行し、
    ベストエフォートでgateway healthを確認します。
  </Step>
</Steps>

### 例（install-cli.sh）

<Tabs>
  <Tab title="デフォルト">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="カスタムprefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Gitインストール">
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

| Flag                        | 説明                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| `--prefix <path>`           | インストールprefix（デフォルト: `~/.openclaw`）                             |
| `--install-method npm\|git` | インストールmethodを選択（デフォルト: `npm`）。別名: `--method`            |
| `--npm`                     | npm methodのショートカット                                                  |
| `--git`, `--github`         | git methodのショートカット                                                  |
| `--git-dir <path>`          | Git checkout directory（デフォルト: `~/openclaw`）。別名: `--dir`          |
| `--version <ver>`           | OpenClaw versionまたはdist-tag（デフォルト: `latest`）                      |
| `--node-version <ver>`      | Node version（デフォルト: `22.22.0`）                                       |
| `--json`                    | NDJSON eventを出力                                                          |
| `--onboard`                 | インストール後に `openclaw onboard` を実行                                  |
| `--no-onboard`              | オンボーディングをスキップ（デフォルト）                                    |
| `--set-npm-prefix`          | Linuxで、現在のprefixに書き込み権限がない場合にnpm prefixを `~/.npm-global` へ強制設定 |
| `--help`                    | 使用方法を表示（`-h`）                                                      |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| Variable                                    | 説明                                          |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | インストールprefix                            |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | インストールmethod                            |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw versionまたはdist-tag                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node version                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | git install用のGit checkout directory         |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | 既存checkoutに対するgit updateを切り替え      |
| `OPENCLAW_NO_ONBOARD=1`                     | オンボーディングをスキップ                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm log level                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips動作を制御（デフォルト: `1`）    |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### フロー（install.ps1）

<Steps>
  <Step title="PowerShell + Windows環境を確認">
    PowerShell 5+ が必要です。
  </Step>
  <Step title="デフォルトでNode.js 24を確保">
    存在しない場合、winget、次にChocolatey、次にScoop経由でインストールを試みます。互換性のため、現在 `22.14+` のNode 22 LTSも引き続きサポートされます。
  </Step>
  <Step title="OpenClawをインストール">
    - `npm` method（デフォルト）: 選択された `-Tag` を使ってグローバルnpmインストール
    - `git` method: repoをclone/updateし、pnpmでinstall/buildして、`%USERPROFILE%\.local\bin\openclaw.cmd` にwrapperをインストール
  </Step>
  <Step title="インストール後タスク">
    - 可能な場合、必要なbin directoryをユーザーPATHへ追加
    - 読み込み済みgateway serviceをベストエフォートで更新（`openclaw gateway install --force`、その後restart）
    - upgrade時とgit install時に `openclaw doctor --non-interactive` を実行（ベストエフォート）
  </Step>
  <Step title="失敗を処理">
    `iwr ... | iex` とscriptblockインストールは、現在のPowerShell sessionを閉じずに終了エラーを報告します。直接の `powershell -File` / `pwsh -File` インストールは、自動化向けに引き続き非ゼロ終了します。
  </Step>
</Steps>

### 例（install.ps1）

<Tabs>
  <Tab title="デフォルト">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Gitインストール">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="npm経由でGitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="カスタムgit directory">
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
    # install.ps1 にはまだ専用の -Verbose フラグはありません。
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="フラグリファレンス">

| Flag                        | 説明                                                         |
| --------------------------- | ------------------------------------------------------------ |
| `-InstallMethod npm\|git`   | インストールmethod（デフォルト: `npm`）                      |
| `-Tag <tag\|version\|spec>` | npm dist-tag、version、またはpackage spec（デフォルト: `latest`） |
| `-GitDir <path>`            | checkout directory（デフォルト: `%USERPROFILE%\openclaw`）   |
| `-NoOnboard`                | オンボーディングをスキップ                                   |
| `-NoGitUpdate`              | `git pull` をスキップ                                        |
| `-DryRun`                   | 実行内容のみ表示                                             |

  </Accordion>

  <Accordion title="環境変数リファレンス">

| Variable                           | 説明                 |
| ---------------------------------- | -------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | インストールmethod   |
| `OPENCLAW_GIT_DIR=<path>`          | checkout directory   |
| `OPENCLAW_NO_ONBOARD=1`            | オンボーディングをスキップ |
| `OPENCLAW_GIT_UPDATE=0`            | git pullを無効化     |
| `OPENCLAW_DRY_RUN=1`               | dry runモード        |

  </Accordion>
</AccordionGroup>

<Note>
`-InstallMethod git` を使っていてGitが存在しない場合、scriptは終了し、Git for Windowsへのリンクを表示します。
</Note>

---

## CIと自動化

予測可能な実行のため、非対話型フラグ/環境変数を使ってください。

<Tabs>
  <Tab title="install.sh（非対話型npm）">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh（非対話型git）">
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
    Gitは `git` インストールmethodに必要です。`npm` installでも、依存関係がgit URLを使う場合の `spawn git ENOENT` 失敗を避けるため、Gitは引き続き確認/インストールされます。
  </Accordion>

  <Accordion title="なぜLinuxでnpmがEACCESになるのですか？">
    一部のLinux環境では、npm global prefixがroot所有pathを指しています。`install.sh` はprefixを `~/.npm-global` に切り替え、shell rc fileが存在する場合はPATH exportを追記できます。
  </Accordion>

  <Accordion title="sharp/libvipsの問題">
    scriptは、sharpがsystem libvipsに対してbuildされるのを避けるため、デフォルトで `SHARP_IGNORE_GLOBAL_LIBVIPS=1` にしています。上書きするには:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: 「npm error spawn git / ENOENT」'>
    Git for Windowsをインストールし、PowerShellを開き直してからインストーラーを再実行してください。
  </Accordion>

  <Accordion title='Windows: 「openclaw is not recognized」'>
    `npm config get prefix` を実行し、そのdirectoryをユーザーPATHに追加してください（Windowsでは `\bin` 接尾辞は不要です）。その後PowerShellを開き直してください。
  </Accordion>

  <Accordion title="Windows: installerの詳細出力を得る方法">
    `install.ps1` は現在 `-Verbose` switchを公開していません。
    scriptレベルのdiagnosticsにはPowerShell tracingを使ってください:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="インストール後にopenclawが見つからない">
    通常はPATHの問題です。[Node.js troubleshooting](/ja-JP/install/node#troubleshooting) を参照してください。
  </Accordion>
</AccordionGroup>

## 関連

- [Install overview](/ja-JP/install)
- [Updating](/ja-JP/install/updating)
- [Uninstall](/ja-JP/install/uninstall)

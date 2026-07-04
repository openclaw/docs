---
read_when:
    - OpenClaw をインストールする前に Node.js をインストールする必要があります
    - OpenClawをインストールしたが、`openclaw` が「command not found」になる
    - '`npm install -g` が権限または PATH の問題で失敗する'
summary: OpenClaw 向けに Node.js をインストールして設定する - バージョン要件、インストールオプション、PATH のトラブルシューティング
title: Node.js
x-i18n:
    generated_at: "2026-07-04T08:43:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c556593982efa7f6fcd6e24787cca7ca6af30d265f54bb927a0608d2efc58d6
    source_path: install/node.md
    workflow: 16
---

OpenClaw には **Node 22.19+、Node 23.11+、または Node 24+** が必要です。**Node 24 は、インストール、CI、リリースワークフローでのデフォルトかつ推奨ランタイム**です。Node 22 はアクティブな LTS 系列を通じて引き続きサポートされます。[インストーラースクリプト](/ja-JP/install#alternative-install-methods)は Node を自動的に検出してインストールします。このページは、Node を自分でセットアップし、すべてが正しく接続されていること（バージョン、PATH、グローバルインストール）を確認したい場合のためのものです。

## バージョンを確認する

```bash
node -v
```

これが `v24.x.x` 以上を表示する場合は、推奨デフォルトを使用しています。`v22.19.x` 以上を表示する場合は、サポート対象の Node 22 LTS パスを使用していますが、都合のよいときに Node 24 へアップグレードすることを引き続き推奨します。`v23.11.0` より前の Node 23 バージョンはサポートされていません。Node がインストールされていない、またはバージョンがサポート範囲外の場合は、下のインストール方法を選択してください。

## Node をインストールする

<Tabs>
  <Tab title="macOS">
    **Homebrew**（推奨）:

    ```bash
    brew install node
    ```

    または [nodejs.org](https://nodejs.org/) から macOS インストーラーをダウンロードします。

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    またはバージョンマネージャーを使用します（下を参照）。

  </Tab>
  <Tab title="Windows">
    **winget**（推奨）:

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    または [nodejs.org](https://nodejs.org/) から Windows インストーラーをダウンロードします。

  </Tab>
</Tabs>

<Accordion title="バージョンマネージャー（nvm、fnm、mise、asdf）を使用する">
  バージョンマネージャーを使うと、Node バージョンを簡単に切り替えられます。代表的な選択肢:

- [**fnm**](https://github.com/Schniz/fnm) - 高速、クロスプラットフォーム
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux で広く使用
- [**mise**](https://mise.jdx.dev/) - ポリグロット（Node、Python、Ruby など）

fnm の例:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  バージョンマネージャーがシェル起動ファイル（`~/.zshrc` または `~/.bashrc`）で初期化されていることを確認してください。初期化されていない場合、PATH に Node の bin ディレクトリが含まれないため、新しいターミナルセッションで `openclaw` が見つからないことがあります。
  </Warning>
</Accordion>

## トラブルシューティング

### `openclaw: command not found`

これはほとんどの場合、npm のグローバル bin ディレクトリが PATH に含まれていないことを意味します。

<Steps>
  <Step title="グローバル npm prefix を確認する">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="それが PATH に含まれているか確認する">
    ```bash
    echo "$PATH"
    ```

    出力内の `<npm-prefix>/bin`（macOS/Linux）または `<npm-prefix>`（Windows）を探します。

  </Step>
  <Step title="シェル起動ファイルに追加する">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` または `~/.bashrc` に追加します:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        その後、新しいターミナルを開きます（または zsh で `rehash` / bash で `hash -r` を実行します）。
      </Tab>
      <Tab title="Windows">
        設定 → システム → 環境変数から、`npm prefix -g` の出力をシステム PATH に追加します。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` の権限エラー（Linux）

`EACCES` エラーが表示される場合は、npm のグローバル prefix をユーザーが書き込み可能なディレクトリに切り替えます:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

永続化するには、`export PATH=...` 行を `~/.bashrc` または `~/.zshrc` に追加します。

## 関連

- [インストール概要](/ja-JP/install) - すべてのインストール方法
- [更新](/ja-JP/install/updating) - OpenClaw を最新の状態に保つ
- [はじめに](/ja-JP/start/getting-started) - インストール後の最初のステップ

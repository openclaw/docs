---
read_when:
    - OpenClaw をインストールする前に Node.js をインストールする必要があります
    - OpenClaw をインストールしたが、`openclaw` が command not found になる
    - npm install -g が権限または PATH の問題で失敗する
summary: OpenClaw 用に Node.js をインストールして構成する - バージョン要件、インストールオプション、PATH のトラブルシューティング
title: Node.js
x-i18n:
    generated_at: "2026-07-05T11:27:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw には **Node 22.19+、Node 23.11+、または Node 24+** が必要です。**Node 24 はインストール、CI、リリースワークフローでのデフォルトかつ推奨ランタイム**です。Node 22 はアクティブな LTS ラインを通じて引き続きサポートされます。[インストーラースクリプト](/ja-JP/install#alternative-install-methods)は Node を自動的に検出してインストールします。このページは、Node を自分で設定したい場合（バージョン、PATH、グローバルインストール）に使用してください。

## バージョンを確認する

```bash
node -v
```

`v24.x.x` 以上が推奨されるデフォルトです。`v22.19.x` 以上はサポートされる Node 22 LTS パスです（都合のよいときに Node 24 へアップグレードしてください）。`v23.11.0` より前の Node 23 ビルドはサポートされません。Node がないか、サポート範囲外の場合は、以下のインストール方法を選んでください。

## Node をインストールする

<Tabs>
  <Tab title="macOS">
    **Homebrew**（推奨）:

    ```bash
    brew install node
    ```

    または、[nodejs.org](https://nodejs.org/) から macOS インストーラーをダウンロードします。

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

    または、バージョンマネージャーを使用します（下記参照）。

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

    または、[nodejs.org](https://nodejs.org/) から Windows インストーラーをダウンロードします。

  </Tab>
</Tabs>

<Accordion title="バージョンマネージャーを使用する（nvm、fnm、mise、asdf）">
  バージョンマネージャーを使うと、Node のバージョンを簡単に切り替えられます。よく使われる選択肢:

- [**fnm**](https://github.com/Schniz/fnm) - 高速、クロスプラットフォーム
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux で広く使用
- [**mise**](https://mise.jdx.dev/) - 多言語対応（Node、Python、Ruby など）

fnm の例:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  シェルの起動ファイル（`~/.zshrc` または `~/.bashrc`）でバージョンマネージャーを初期化してください。これを省略すると、PATH に Node の bin ディレクトリが含まれないため、新しいターミナルセッションで `openclaw` が見つからないことがあります。
  </Warning>
</Accordion>

## トラブルシューティング

### `openclaw: command not found`

これはほぼ常に、npm のグローバル bin ディレクトリが PATH に含まれていないことを意味します。

<Steps>
  <Step title="グローバル npm prefix を見つける">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH に含まれているか確認する">
    ```bash
    echo "$PATH"
    ```

    出力に `<npm-prefix>/bin`（macOS/Linux）または `<npm-prefix>`（Windows）があるか探します。

  </Step>
  <Step title="シェルの起動ファイルに追加する">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` または `~/.bashrc` に追加します:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        その後、新しいターミナルを開きます（または zsh で `rehash`、bash で `hash -r` を実行します）。
      </Tab>
      <Tab title="Windows">
        設定 → システム → 環境変数から、`npm prefix -g` の出力をシステム PATH に追加します。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` で権限エラーが発生する（Linux）

`EACCES` エラーが表示される場合は、npm のグローバル prefix をユーザーが書き込めるディレクトリに切り替えます:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

永続化するには、`export PATH=...` 行を `~/.bashrc` または `~/.zshrc` に追加します。

## 関連

- [インストール概要](/ja-JP/install) - すべてのインストール方法
- [更新](/ja-JP/install/updating) - OpenClaw を最新に保つ
- [はじめに](/ja-JP/start/getting-started) - インストール後の最初の手順

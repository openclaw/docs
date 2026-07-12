---
read_when:
    - OpenClawをインストールする前にNode.jsをインストールする必要があります
    - OpenClaw をインストールしたものの、`openclaw` コマンドが見つかりません
    - 権限または PATH の問題により `npm install -g` が失敗する
summary: OpenClaw 用の Node.js のインストールと設定 - バージョン要件、インストール方法、PATH のトラブルシューティング
title: Node.js
x-i18n:
    generated_at: "2026-07-11T22:20:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

OpenClaw には **Node 22.19+、Node 23.11+、または Node 24+** が必要です。**Node 24 は、インストール、CI、リリースワークフローでデフォルトかつ推奨されるランタイムです**。Node 22 もアクティブな LTS 系列を通じて引き続きサポートされます。[インストーラースクリプト](/ja-JP/install#alternative-install-methods)は Node を自動的に検出してインストールします。Node のバージョン、PATH、グローバルインストールなどを自分で設定する場合は、このページを参照してください。

## バージョンを確認する

```bash
node -v
```

推奨されるデフォルトは `v24.x.x` 以降です。Node 22 LTS のサポート対象は `v22.19.x` 以降です（都合のよいタイミングで Node 24 にアップグレードしてください）。`v23.11.0` より前の Node 23 ビルドはサポートされません。Node がインストールされていない場合、またはサポート対象範囲外の場合は、以下のインストール方法を選択してください。

## Node をインストールする

<Tabs>
  <Tab title="macOS">
    **Homebrew**（推奨）:

    ```bash
    brew install node
    ```

    または、[nodejs.org](https://nodejs.org/) から macOS 用インストーラーをダウンロードします。

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

    または、バージョンマネージャーを使用します（以下を参照）。

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

    または、[nodejs.org](https://nodejs.org/) から Windows 用インストーラーをダウンロードします。

  </Tab>
</Tabs>

<Accordion title="バージョンマネージャー（nvm、fnm、mise、asdf）を使用する">
  バージョンマネージャーを使用すると、Node のバージョンを簡単に切り替えられます。一般的な選択肢:

- [**fnm**](https://github.com/Schniz/fnm) - 高速でクロスプラットフォーム対応
- [**nvm**](https://github.com/nvm-sh/nvm) - macOS/Linux で広く利用
- [**mise**](https://mise.jdx.dev/) - 多言語対応（Node、Python、Ruby など）

fnm を使用する例:

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

ほとんどの場合、npm のグローバル bin ディレクトリが PATH に含まれていないことが原因です。

<Steps>
  <Step title="npm のグローバルプレフィックスを確認する">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH に含まれているか確認する">
    ```bash
    echo "$PATH"
    ```

    出力に `<npm-prefix>/bin`（macOS/Linux）または `<npm-prefix>`（Windows）が含まれているか確認します。

  </Step>
  <Step title="シェルの起動ファイルに追加する">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` または `~/.bashrc` に追加します:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        その後、新しいターミナルを開きます（または zsh では `rehash`、bash では `hash -r` を実行します）。
      </Tab>
      <Tab title="Windows">
        `npm prefix -g` の出力を、Settings → System → Environment Variables からシステムの PATH に追加します。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` での権限エラー（Linux）

`EACCES` エラーが表示される場合は、npm のグローバルプレフィックスをユーザーが書き込めるディレクトリに変更します:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

永続化するには、`export PATH=...` の行を `~/.bashrc` または `~/.zshrc` に追加します。

## 関連項目

- [インストールの概要](/ja-JP/install) - すべてのインストール方法
- [更新](/ja-JP/install/updating) - OpenClaw を最新の状態に保つ
- [はじめに](/ja-JP/start/getting-started) - インストール後の最初の手順

---
read_when:
    - OpenClaw をインストールする前に Node.js をインストールする必要がある場合
    - OpenClaw はインストールしたが、`openclaw` が command not found になる場合
    - '`npm install -g` が権限または PATH の問題で失敗する場合'
summary: OpenClaw 向けに Node.js をインストールして設定する — バージョン要件、インストール方法、PATH のトラブルシューティング
title: Node.js
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:05:12Z"
  model: gpt-5.4
  provider: openai
  source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
  source_path: install/node.md
  workflow: 15
---

OpenClaw には **Node 22.14 以上** が必要です。インストール、CI、リリースワークフローの **デフォルトかつ推奨ランタイムは Node 24** です。Node 22 もアクティブ LTS ラインとして引き続きサポートされています。[installer script](/ja-JP/install#alternative-install-methods) は Node を自動検出してインストールします。このページは、Node を自分でセットアップし、すべてが正しくつながっていること（バージョン、PATH、グローバルインストール）を確認したい場合のためのものです。

## バージョン確認

```bash
node -v
```

これが `v24.x.x` 以上なら、推奨デフォルトを使っています。`v22.14.x` 以上なら、サポートされる Node 22 LTS 経路です。ただし、都合がつき次第 Node 24 への更新を推奨します。Node がインストールされていない、または古すぎる場合は、下のインストール方法から選んでください。

## Node のインストール

<Tabs>
  <Tab title="macOS">
    **Homebrew**（推奨）:

    ```bash
    brew install node
    ```

    または [nodejs.org](https://nodejs.org/) から macOS インストーラーをダウンロードしてください。

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

    またはバージョンマネージャを使ってください（下記参照）。

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

    または [nodejs.org](https://nodejs.org/) から Windows インストーラーをダウンロードしてください。

  </Tab>
</Tabs>

<Accordion title="バージョンマネージャを使う（nvm, fnm, mise, asdf）">
  バージョンマネージャを使うと、Node のバージョンを簡単に切り替えられます。代表的な選択肢:

- [**fnm**](https://github.com/Schniz/fnm) — 高速、クロスプラットフォーム
- [**nvm**](https://github.com/nvm-sh/nvm) — macOS/Linux で広く使われている
- [**mise**](https://mise.jdx.dev/) — polyglot（Node、Python、Ruby など）

fnm の例:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  バージョンマネージャがシェル起動ファイル（`~/.zshrc` または `~/.bashrc`）で初期化されていることを確認してください。そうでないと、新しいターミナルセッションで PATH に Node の bin ディレクトリが含まれず、`openclaw` が見つからないことがあります。
  </Warning>
</Accordion>

## トラブルシューティング

### `openclaw: command not found`

ほとんどの場合、npm のグローバル bin ディレクトリが PATH に入っていないことが原因です。

<Steps>
  <Step title="グローバル npm prefix を確認">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="PATH に入っているか確認">
    ```bash
    echo "$PATH"
    ```

    出力内に `<npm-prefix>/bin`（macOS/Linux）または `<npm-prefix>`（Windows）があるか確認してください。

  </Step>
  <Step title="シェル起動ファイルに追加">
    <Tabs>
      <Tab title="macOS / Linux">
        `~/.zshrc` または `~/.bashrc` に追加:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        その後、新しいターミナルを開いてください（または zsh では `rehash`、bash では `hash -r` を実行）。
      </Tab>
      <Tab title="Windows">
        `npm prefix -g` の出力を、Settings → System → Environment Variables からシステム PATH に追加してください。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` で権限エラー（Linux）

`EACCES` エラーが出る場合は、npm のグローバル prefix をユーザー書き込み可能なディレクトリに切り替えてください:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

永続化するには、`export PATH=...` の行を `~/.bashrc` または `~/.zshrc` に追加してください。

## 関連

- [Install Overview](/ja-JP/install) — すべてのインストール方法
- [Updating](/ja-JP/install/updating) — OpenClaw を最新に保つ
- [はじめに](/ja-JP/start/getting-started) — インストール後の最初の手順

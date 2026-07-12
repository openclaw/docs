---
read_when:
    - ゼロからの初回セットアップ
    - 動作するチャットへの最短ルートが必要な場合
summary: OpenClaw をインストールして、数分で最初のチャットを始めましょう。
title: はじめに
x-i18n:
    generated_at: "2026-07-11T22:42:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw をインストールし、オンボーディングを実行して、約 5 分で AI アシスタントとのチャットを始められます。完了時には、Gateway が起動し、認証が設定され、チャットセッションが利用可能になります。

## 必要なもの

- **Node.js 22.19+、23.11+、または 24+**（推奨デフォルトは 24）
- **モデルプロバイダー（Anthropic、OpenAI、Google など）の API キー** — オンボーディング中に入力を求められます

<Tip>
`node --version` で Node のバージョンを確認してください。
**Windows ユーザー:** ネイティブの Windows Hub アプリが最も簡単なデスクトップ向けの方法です。
PowerShell インストーラーと WSL2 Gateway を使う方法もサポートされています。[Windows](/ja-JP/platforms/windows) を参照してください。
Node をインストールする必要がある場合は、[Node のセットアップ](/ja-JP/install/node)を参照してください。
</Tip>

## クイックセットアップ

<Steps>
  <Step title="OpenClaw をインストールする">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="インストールスクリプトの処理"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    その他のインストール方法（Docker、Nix、npm）: [インストール](/ja-JP/install)。
    </Note>

  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードに従って、モデルプロバイダーの選択、API キーの設定、Gateway の構成を行います。クイックスタートは通常数分で完了しますが、プロバイダーへのサインイン、チャンネルのペアリング、デーモンのインストール、ネットワークからのダウンロード、Skills、またはオプションの Plugin によって、オンボーディング全体に時間がかかる場合があります。オプションの手順はスキップし、後から `openclaw configure` で設定できます。

    完全なリファレンスについては、[オンボーディング（CLI）](/ja-JP/start/wizard)を参照してください。

  </Step>
  <Step title="Gateway が実行中であることを確認する">
    ```bash
    openclaw gateway status
    ```

    Gateway がポート 18789 で待ち受けていることを確認できます。

  </Step>
  <Step title="ダッシュボードを開く">
    ```bash
    openclaw dashboard
    ```

    ブラウザーで Control UI が開きます。読み込まれれば、すべて正常に動作しています。

  </Step>
  <Step title="最初のメッセージを送信する">
    Control UI のチャットにメッセージを入力すると、AI から返信が届きます。

    代わりにスマートフォンからチャットしたい場合は、最もすばやく設定できるチャンネルは
    [Telegram](/ja-JP/channels/telegram)です（必要なのはボットトークンだけです）。すべての選択肢については、[チャンネル](/ja-JP/channels)
    を参照してください。

  </Step>
</Steps>

<Accordion title="高度な設定: カスタム Control UI ビルドをマウントする">
  ローカライズまたはカスタマイズしたダッシュボードビルドを管理している場合は、
  `gateway.controlUi.root` に、ビルド済みの静的アセットと `index.html`
  を含むディレクトリを指定します。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# ビルド済みの静的ファイルをそのディレクトリにコピーします。
```

次のように設定します。

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

Gateway を再起動し、ダッシュボードをもう一度開きます。

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 次に行うこと

<Columns>
  <Card title="チャンネルを接続する" href="/ja-JP/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo など。
  </Card>
  <Card title="ペアリングと安全性" href="/ja-JP/channels/pairing" icon="shield">
    エージェントにメッセージを送信できるユーザーを制御します。
  </Card>
  <Card title="Gateway を構成する" href="/ja-JP/gateway/configuration" icon="settings">
    モデル、ツール、サンドボックス、高度な設定。
  </Card>
  <Card title="ツールを参照する" href="/ja-JP/tools" icon="wrench">
    ブラウザー、exec、ウェブ検索、Skills、Plugin。
  </Card>
</Columns>

<Accordion title="高度な設定: 環境変数">
  OpenClaw をサービスアカウントとして実行する場合や、カスタムパスを使用する場合:

- `OPENCLAW_HOME` — 内部パス解決に使用するホームディレクトリ
- `OPENCLAW_STATE_DIR` — 状態ディレクトリを上書き
- `OPENCLAW_CONFIG_PATH` — 構成ファイルのパスを上書き

完全なリファレンス: [環境変数](/ja-JP/help/environment)。
</Accordion>

## 関連項目

- [インストールの概要](/ja-JP/install)
- [チャンネルの概要](/ja-JP/channels)
- [セットアップ](/ja-JP/start/setup)

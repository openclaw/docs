---
read_when:
    - ゼロからの初回セットアップ
    - 動作するチャットへの最速ルートが必要です
summary: OpenClaw をインストールして、数分で最初のチャットを実行します。
title: はじめに
x-i18n:
    generated_at: "2026-06-28T20:45:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 579ed2b4797dc851b0293b96a4177cc356641b6842fe45c4d48f4e8c224eef75
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw をインストールし、オンボーディングを実行して、AI アシスタントとチャットします — すべて
約 5 分で完了します。最後には、実行中の Gateway、設定済みの認証、
動作するチャットセッションが用意できます。

## 必要なもの

- **Node.js** — Node 24 を推奨（Node 22.19+ もサポート）
- **モデルプロバイダーの API キー**（Anthropic、OpenAI、Google など）— オンボーディングで入力を求められます

<Tip>
`node --version` で Node のバージョンを確認します。
**Windows ユーザー:** ネイティブ Windows Hub アプリが最も簡単なデスクトップ経路です。
PowerShell インストーラーと WSL2 Gateway 経路もサポートされています。[Windows](/ja-JP/platforms/windows) を参照してください。
Node をインストールする必要がありますか？[Node setup](/ja-JP/install/node) を参照してください。
</Tip>

## クイックセットアップ

<Steps>
  <Step title="OpenClaw をインストール">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="インストールスクリプトのプロセス"
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
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードが、モデルプロバイダーの選択、API キーの設定、
    Gateway の設定を順に案内します。クイックスタートは通常数分で完了しますが、
    プロバイダーのサインイン、チャネルのペアリング、デーモンのインストール、ネットワークダウンロード、Skills、
    または任意の plugins によって、完全なオンボーディングにはより時間がかかる場合があります。任意の
    手順はスキップでき、後で `openclaw configure` を使って戻れます。

    完全なリファレンスは [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Step>
  <Step title="Gateway が実行中であることを確認">
    ```bash
    openclaw gateway status
    ```

    Gateway がポート 18789 でリッスンしていることが表示されるはずです。

  </Step>
  <Step title="ダッシュボードを開く">
    ```bash
    openclaw dashboard
    ```

    これにより、ブラウザーで Control UI が開きます。読み込まれれば、すべて正常に動作しています。

  </Step>
  <Step title="最初のメッセージを送信">
    Control UI チャットにメッセージを入力すると、AI から返信が届くはずです。

    代わりにスマートフォンからチャットしたいですか？最も素早く設定できるチャネルは
    [Telegram](/ja-JP/channels/telegram)（ボットトークンだけ）です。すべての選択肢については [チャネル](/ja-JP/channels)
    を参照してください。

  </Step>
</Steps>

<Accordion title="高度: カスタム Control UI ビルドをマウント">
  ローカライズ済みまたはカスタマイズ済みのダッシュボードビルドを管理している場合は、
  ビルド済みの静的アセットと `index.html` を含むディレクトリを
  `gateway.controlUi.root` に指定します。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# ビルド済みの静的ファイルをそのディレクトリにコピーします。
```

次に設定します。

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

Gateway を再起動し、ダッシュボードを再度開きます。

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 次にすること

<Columns>
  <Card title="チャネルを接続" href="/ja-JP/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo など。
  </Card>
  <Card title="ペアリングと安全性" href="/ja-JP/channels/pairing" icon="shield">
    エージェントにメッセージを送信できるユーザーを制御します。
  </Card>
  <Card title="Gateway を設定" href="/ja-JP/gateway/configuration" icon="settings">
    モデル、ツール、サンドボックス、高度な設定。
  </Card>
  <Card title="ツールを参照" href="/ja-JP/tools" icon="wrench">
    ブラウザー、exec、Web 検索、skills、plugins。
  </Card>
</Columns>

<Accordion title="高度: 環境変数">
  OpenClaw をサービスアカウントとして実行する場合、またはカスタムパスを使いたい場合:

- `OPENCLAW_HOME` — 内部パス解決のためのホームディレクトリ
- `OPENCLAW_STATE_DIR` — 状態ディレクトリを上書き
- `OPENCLAW_CONFIG_PATH` — 設定ファイルパスを上書き

完全なリファレンス: [環境変数](/ja-JP/help/environment)。
</Accordion>

## 関連

- [インストール概要](/ja-JP/install)
- [チャネル概要](/ja-JP/channels)
- [セットアップ](/ja-JP/start/setup)

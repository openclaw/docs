---
read_when:
    - ゼロからの初回セットアップ
    - 動作するチャットへの最短ルートが必要な場合
summary: OpenClawをインストールし、数分で最初のチャットを実行します。
title: はじめに
x-i18n:
    generated_at: "2026-07-05T11:51:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw をインストールし、オンボーディングを実行して、約 5
分で AI アシスタントとチャットできます。最後まで進めると、Gateway の起動、認証の設定、
動作するチャットセッションが揃います。

## 必要なもの

- **Node.js 22.19+、23.11+、または 24+** (24 が推奨デフォルトです)
- **API キー** モデルプロバイダー (Anthropic、OpenAI、Google など) から取得したもの — オンボーディング中に入力を求められます

<Tip>
Node のバージョンは `node --version` で確認してください。
**Windows ユーザー:** ネイティブの Windows Hub アプリが、デスクトップでは最も簡単な方法です。
PowerShell インストーラーと WSL2 Gateway の方法もサポートされています。[Windows](/ja-JP/platforms/windows) を参照してください。
Node をインストールする必要がありますか？ [Node setup](/ja-JP/install/node) を参照してください。
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
    その他のインストール方法 (Docker、Nix、npm): [インストール](/ja-JP/install)。
    </Note>

  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードでは、モデルプロバイダーの選択、API キーの設定、
    Gateway の構成を順に行います。QuickStart は通常数分で完了しますが、
    プロバイダーへのサインイン、チャンネルのペアリング、デーモンのインストール、ネットワークダウンロード、skills、
    または任意の plugins によって、完全なオンボーディングに時間がかかる場合があります。任意の
    手順はスキップし、あとで `openclaw configure` で戻れます。

    完全なリファレンスは [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Step>
  <Step title="Gateway が実行中であることを確認">
    ```bash
    openclaw gateway status
    ```

    Gateway がポート 18789 で待ち受けていることが表示されるはずです。

  </Step>
  <Step title="ダッシュボードを開く">
    ```bash
    openclaw dashboard
    ```

    これにより、ブラウザーで Control UI が開きます。読み込まれれば、すべて正常に動作しています。

  </Step>
  <Step title="最初のメッセージを送信">
    Control UI のチャットにメッセージを入力すると、AI から返信が返ってくるはずです。

    代わりにスマートフォンからチャットしたいですか？ 最も早くセットアップできるチャンネルは
    [Telegram](/ja-JP/channels/telegram) (bot トークンだけ) です。すべての選択肢については [Channels](/ja-JP/channels)
    を参照してください。

  </Step>
</Steps>

<Accordion title="上級: カスタム Control UI ビルドをマウントする">
  ローカライズ済みまたはカスタマイズ済みのダッシュボードビルドを保守している場合は、
  `gateway.controlUi.root` に、ビルド済みの静的
  アセットと `index.html` を含むディレクトリを指定します。

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

Gateway を再起動し、ダッシュボードをもう一度開きます。

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 次にすること

<Columns>
  <Card title="チャンネルを接続" href="/ja-JP/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo など。
  </Card>
  <Card title="ペアリングと安全性" href="/ja-JP/channels/pairing" icon="shield">
    エージェントにメッセージを送信できる人を制御します。
  </Card>
  <Card title="Gateway を構成" href="/ja-JP/gateway/configuration" icon="settings">
    モデル、ツール、サンドボックス、高度な設定。
  </Card>
  <Card title="ツールを閲覧" href="/ja-JP/tools" icon="wrench">
    ブラウザー、exec、web 検索、skills、plugins。
  </Card>
</Columns>

<Accordion title="上級: 環境変数">
  OpenClaw をサービスアカウントとして実行する場合、またはカスタムパスを使いたい場合:

- `OPENCLAW_HOME` — 内部パス解決用のホームディレクトリ
- `OPENCLAW_STATE_DIR` — 状態ディレクトリを上書き
- `OPENCLAW_CONFIG_PATH` — 設定ファイルのパスを上書き

完全なリファレンス: [環境変数](/ja-JP/help/environment)。
</Accordion>

## 関連

- [インストール概要](/ja-JP/install)
- [チャンネル概要](/ja-JP/channels)
- [セットアップ](/ja-JP/start/setup)

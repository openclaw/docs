---
read_when:
    - ゼロからの初回セットアップ
    - 動作するチャットへの最短ルートが必要です
summary: OpenClawをインストールして、数分で最初のチャットを実行します。
title: はじめに
x-i18n:
    generated_at: "2026-06-27T13:04:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw をインストールし、オンボーディングを実行して、AI アシスタントとチャットします。すべて
約 5 分で完了します。最後には、実行中の Gateway、設定済みの認証、
動作するチャットセッションが手に入ります。

## 必要なもの

- **Node.js** — Node 24 を推奨（Node 22.19+ もサポート）
- **API キー**（Anthropic、OpenAI、Google などのモデルプロバイダーから）— オンボーディング中に入力を求められます

<Tip>
Node のバージョンは `node --version` で確認できます。
**Windows ユーザー:** ネイティブ Windows Hub アプリが、デスクトップでは最も簡単な方法です。
PowerShell インストーラーと WSL2 Gateway の方法もサポートされています。[Windows](/ja-JP/platforms/windows) を参照してください。
Node をインストールする必要がありますか？[Node setup](/ja-JP/install/node) を参照してください。
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
  alt="Install Script Process"
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
    その他のインストール方法（Docker、Nix、npm）: [Install](/ja-JP/install)。
    </Note>

  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードに従って、モデルプロバイダーの選択、API キーの設定、
    Gateway の設定を行います。所要時間は約 2 分です。

    完全なリファレンスは [オンボーディング (CLI)](/ja-JP/start/wizard) を参照してください。

  </Step>
  <Step title="Gateway が実行中であることを確認する">
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
  <Step title="最初のメッセージを送信する">
    Control UI のチャットにメッセージを入力すると、AI から返信が届くはずです。

    代わりにスマートフォンからチャットしたいですか？最もすばやく設定できるチャネルは
    [Telegram](/ja-JP/channels/telegram)（bot トークンだけ）です。すべての選択肢は [Channels](/ja-JP/channels)
    を参照してください。

  </Step>
</Steps>

<Accordion title="上級: カスタム Control UI ビルドをマウントする">
  ローカライズ済みまたはカスタマイズ済みのダッシュボードビルドを管理している場合は、
  ビルド済みの静的アセットと `index.html` を含むディレクトリを
  `gateway.controlUi.root` に指定します。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

次に、以下を設定します。

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

## 次にやること

<Columns>
  <Card title="チャネルを接続する" href="/ja-JP/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo など。
  </Card>
  <Card title="ペアリングと安全性" href="/ja-JP/channels/pairing" icon="shield">
    エージェントにメッセージを送信できる相手を制御します。
  </Card>
  <Card title="Gateway を設定する" href="/ja-JP/gateway/configuration" icon="settings">
    モデル、ツール、サンドボックス、高度な設定。
  </Card>
  <Card title="ツールを見る" href="/ja-JP/tools" icon="wrench">
    ブラウザー、exec、Web 検索、Skills、Plugin。
  </Card>
</Columns>

<Accordion title="上級: 環境変数">
  OpenClaw をサービスアカウントとして実行する場合や、カスタムパスを使いたい場合:

- `OPENCLAW_HOME` — 内部パス解決用のホームディレクトリ
- `OPENCLAW_STATE_DIR` — 状態ディレクトリを上書き
- `OPENCLAW_CONFIG_PATH` — 設定ファイルパスを上書き

完全なリファレンス: [環境変数](/ja-JP/help/environment)。
</Accordion>

## 関連

- [インストール概要](/ja-JP/install)
- [チャネル概要](/ja-JP/channels)
- [セットアップ](/ja-JP/start/setup)

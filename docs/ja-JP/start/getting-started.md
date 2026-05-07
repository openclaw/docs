---
read_when:
    - ゼロからの初回セットアップ
    - 動作するチャットまでの最短ルートを求めている
summary: OpenClawをインストールして、数分で最初のチャットを実行します。
title: はじめに
x-i18n:
    generated_at: "2026-05-07T13:26:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 295ce8fd03320027a77a3aef494f785f0fe58e0f57c72ee63f6f9aca68626c20
    source_path: start/getting-started.md
    workflow: 16
---

OpenClaw をインストールし、オンボーディングを実行して、AI アシスタントとチャットします — すべて
約 5 分で完了します。最後には、実行中の Gateway、設定済みの認証、
そして動作するチャットセッションが手に入ります。

## 必要なもの

- **Node.js** — Node 24 推奨（Node 22.16+ もサポート）
- モデルプロバイダー（Anthropic、OpenAI、Google など）の **API キー** — オンボーディングで入力を求められます

<Tip>
Node のバージョンは `node --version` で確認できます。
**Windows ユーザー:** ネイティブ Windows と WSL2 の両方がサポートされています。WSL2 のほうが
安定しており、すべての機能を利用する場合に推奨されます。[Windows](/ja-JP/platforms/windows) を参照してください。
Node のインストールが必要ですか？[Node setup](/ja-JP/install/node) を参照してください。
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
    その他のインストール方法（Docker、Nix、npm）: [インストール](/ja-JP/install)。
    </Note>

  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードは、モデルプロバイダーの選択、API キーの設定、
    Gateway の設定を順に案内します。所要時間は約 2 分です。

    完全なリファレンスは [オンボーディング（CLI）](/ja-JP/start/wizard) を参照してください。

  </Step>
  <Step title="Gateway が実行中であることを確認">
    ```bash
    openclaw gateway status
    ```

    Gateway がポート 18789 で待ち受けていることが表示されます。

  </Step>
  <Step title="ダッシュボードを開く">
    ```bash
    openclaw dashboard
    ```

    これにより、ブラウザーで Control UI が開きます。読み込まれれば、すべて正常に動作しています。

  </Step>
  <Step title="最初のメッセージを送信">
    Control UI のチャットにメッセージを入力すると、AI から返信が届くはずです。

    代わりにスマートフォンからチャットしたいですか？最速で設定できるチャンネルは
    [Telegram](/ja-JP/channels/telegram)（ボットトークンだけ）です。すべての選択肢は [チャンネル](/ja-JP/channels)
    を参照してください。

  </Step>
</Steps>

<Accordion title="高度: カスタム Control UI ビルドをマウント">
  ローカライズまたはカスタマイズしたダッシュボードビルドを管理している場合は、
  `gateway.controlUi.root` に、ビルド済みの静的
  アセットと `index.html` を含むディレクトリを指定します。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
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

Gateway を再起動し、ダッシュボードを開き直します。

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 次にやること

<Columns>
  <Card title="チャンネルに接続" href="/ja-JP/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo など。
  </Card>
  <Card title="ペアリングと安全性" href="/ja-JP/channels/pairing" icon="shield">
    エージェントにメッセージを送信できるユーザーを制御します。
  </Card>
  <Card title="Gateway を設定" href="/ja-JP/gateway/configuration" icon="settings">
    モデル、ツール、サンドボックス、高度な設定。
  </Card>
  <Card title="ツールを閲覧" href="/ja-JP/tools" icon="wrench">
    ブラウザー、exec、Web 検索、Skills、Plugin。
  </Card>
</Columns>

<Accordion title="高度: 環境変数">
  OpenClaw をサービスアカウントとして実行する場合や、カスタムパスを使いたい場合:

- `OPENCLAW_HOME` — 内部パス解決のホームディレクトリ
- `OPENCLAW_STATE_DIR` — 状態ディレクトリを上書き
- `OPENCLAW_CONFIG_PATH` — 設定ファイルパスを上書き

完全なリファレンス: [環境変数](/ja-JP/help/environment)。
</Accordion>

## 関連

- [インストール概要](/ja-JP/install)
- [チャンネル概要](/ja-JP/channels)
- [セットアップ](/ja-JP/start/setup)

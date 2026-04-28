---
read_when:
    - ゼロからの初回セットアップ
    - 動作するチャットまでの最短ルートを探しています
summary: OpenClaw をインストールして、数分で最初のチャットを始めましょう。
title: はじめに
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:21:25Z"
  model: gpt-5.4
  provider: openai
  source_hash: fe3f92b1464ebf0a5b631c293fa4a3e4b686fdb35c1152663428025dd3c01259
  source_path: start/getting-started.md
  workflow: 15
---

OpenClaw をインストールし、オンボーディングを実行して、AI アシスタントとチャットする — ここまでを
約 5 分で完了できます。最後には、動作中の Gateway、設定済み認証、
動作するチャットセッションが手に入ります。

## 必要なもの

- **Node.js** — Node 24 推奨（Node 22.14+ もサポート）
- モデルプロバイダー（Anthropic、OpenAI、Google など）の **API キー** — オンボーディング中に入力を求められます

<Tip>
`node --version` で Node バージョンを確認してください。
**Windows ユーザー:** ネイティブ Windows と WSL2 の両方をサポートしています。WSL2 の方が
より安定しており、完全な体験には推奨されます。[Windows](/ja-JP/platforms/windows) を参照してください。
Node のインストールが必要ですか？ [Node setup](/ja-JP/install/node) を参照してください。
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
    その他のインストール方法（Docker、Nix、npm）: [インストール](/ja-JP/install)。
    </Note>

  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --install-daemon
    ```

    ウィザードが、モデルプロバイダーの選択、API キーの設定、
    Gateway の設定を案内します。所要時間は約 2 分です。

    完全なリファレンスについては [Onboarding (CLI)](/ja-JP/start/wizard) を参照してください。

  </Step>
  <Step title="Gateway が実行中か確認する">
    ```bash
    openclaw gateway status
    ```

    Gateway がポート 18789 で待ち受けていることが表示されるはずです。

  </Step>
  <Step title="ダッシュボードを開く">
    ```bash
    openclaw dashboard
    ```

    ブラウザーで Control UI が開きます。読み込めれば、すべて正常に動作しています。

  </Step>
  <Step title="最初のメッセージを送る">
    Control UI のチャットにメッセージを入力すると、AI の返信が返ってくるはずです。

    スマートフォンからチャットしたいですか？ 最も手早くセットアップできるチャンネルは
    [Telegram](/ja-JP/channels/telegram) です（必要なのは bot token だけ）。すべての選択肢については [Channels](/ja-JP/channels)
    を参照してください。

  </Step>
</Steps>

<Accordion title="高度: カスタム Control UI ビルドをマウントする">
  ローカライズ済みまたはカスタマイズ済みのダッシュボードビルドを管理している場合は、
  ビルド済み静的 asset と `index.html` を含むディレクトリを
  `gateway.controlUi.root` に指定してください。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# ビルド済み静的ファイルをそのディレクトリにコピーします。
```

その後、次を設定します:

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

Gateway を再起動してダッシュボードを再度開きます:

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 次にやること

<Columns>
  <Card title="チャンネルを接続する" href="/ja-JP/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo など。
  </Card>
  <Card title="ペアリングと安全性" href="/ja-JP/channels/pairing" icon="shield">
    誰がエージェントにメッセージできるかを制御する。
  </Card>
  <Card title="Gateway を設定する" href="/ja-JP/gateway/configuration" icon="settings">
    モデル、ツール、sandbox、高度な設定。
  </Card>
  <Card title="ツールを探す" href="/ja-JP/tools" icon="wrench">
    Browser、exec、web search、Skills、plugins。
  </Card>
</Columns>

<Accordion title="高度: 環境変数">
  サービスアカウントとして OpenClaw を実行する場合や、カスタムパスを使いたい場合:

- `OPENCLAW_HOME` — 内部パス解決用のホームディレクトリ
- `OPENCLAW_STATE_DIR` — state ディレクトリを上書き
- `OPENCLAW_CONFIG_PATH` — config file パスを上書き

完全なリファレンス: [環境変数](/ja-JP/help/environment)。
</Accordion>

## 関連

- [インストール概要](/ja-JP/install)
- [チャンネル概要](/ja-JP/channels)
- [セットアップ](/ja-JP/start/setup)

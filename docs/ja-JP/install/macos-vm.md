---
read_when:
    - メインの macOS 環境から OpenClaw を分離したい場合
    - サンドボックスで iMessage 連携 (BlueBubbles) を使用したい場合
    - クローン可能でリセットできる macOS 環境が必要な場合
    - ローカルとホスト型のmacOS VMの選択肢を比較したい場合
summary: 隔離環境または iMessage が必要な場合は、サンドボックス化された macOS 仮想マシン（ローカルまたはホスト型）で OpenClaw を実行します
title: macOS 仮想マシン
x-i18n:
    generated_at: "2026-04-30T05:20:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# macOS VM 上の OpenClaw（サンドボックス化）

## 推奨されるデフォルト（ほとんどのユーザー）

- 常時稼働の Gateway と低コストには **小規模な Linux VPS**。詳しくは [VPS ホスティング](/ja-JP/vps) を参照してください。
- ブラウザー自動化向けの完全な制御と **住宅 IP** が必要な場合は、**専用ハードウェア**（Mac mini または Linux マシン）。多くのサイトはデータセンター IP をブロックするため、ローカルでのブラウジングのほうがうまく動作することがよくあります。
- **ハイブリッド:** Gateway は安価な VPS に置き、ブラウザー/UI 自動化が必要なときに Mac を **Node** として接続します。[Node](/ja-JP/nodes) と [Gateway リモート](/ja-JP/gateway/remote) を参照してください。

macOS 専用の機能（iMessage/BlueBubbles）が特に必要な場合、または普段使いの Mac から厳密に分離したい場合は、macOS VM を使用してください。

## macOS VM の選択肢

### Apple Silicon Mac 上のローカル VM（Lume）

[Lume](https://cua.ai/docs/lume) を使用して、既存の Apple Silicon Mac 上のサンドボックス化された macOS VM で OpenClaw を実行します。

これにより、次が得られます。

- 分離された完全な macOS 環境（ホストはクリーンなまま）
- BlueBubbles による iMessage サポート（Linux/Windows では不可能）
- VM のクローンによる即時リセット
- 追加のハードウェア費用やクラウド費用なし

### ホスト型 Mac プロバイダー（クラウド）

クラウド上で macOS を使いたい場合は、ホスト型 Mac プロバイダーも利用できます。

- [MacStadium](https://www.macstadium.com/)（ホスト型 Mac）
- 他のホスト型 Mac ベンダーも利用できます。各社の VM + SSH ドキュメントに従ってください

macOS VM への SSH アクセスができたら、下の手順 6 に進んでください。

---

## 最短手順（Lume、経験者向け）

1. Lume をインストールする
2. `lume create openclaw --os macos --ipsw latest`
3. 設定アシスタントを完了し、リモートログイン（SSH）を有効にする
4. `lume run openclaw --no-display`
5. SSH で接続し、OpenClaw をインストールして、チャンネルを設定する
6. 完了

---

## 必要なもの（Lume）

- Apple Silicon Mac（M1/M2/M3/M4）
- ホスト上の macOS Sequoia 以降
- VM ごとに約 60 GB の空きディスク容量
- 約 20 分

---

## 1) Lume をインストールする

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin` が PATH に入っていない場合:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

確認します。

```bash
lume --version
```

ドキュメント: [Lume のインストール](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM を作成する

```bash
lume create openclaw --os macos --ipsw latest
```

これにより macOS がダウンロードされ、VM が作成されます。VNC ウィンドウが自動的に開きます。

<Note>
ダウンロードには、接続環境によって時間がかかることがあります。
</Note>

---

## 3) 設定アシスタントを完了する

VNC ウィンドウで:

1. 言語と地域を選択する
2. Apple ID をスキップする（後で iMessage を使いたい場合はサインインする）
3. ユーザーアカウントを作成する（ユーザー名とパスワードを控えておく）
4. すべての任意機能をスキップする

設定が完了したら、SSH を有効にします。

1. システム設定 → 一般 → 共有を開く
2. 「リモートログイン」を有効にする

---

## 4) VM の IP アドレスを取得する

```bash
lume get openclaw
```

IP アドレス（通常は `192.168.64.x`）を探します。

---

## 5) SSH で VM に接続する

```bash
ssh youruser@192.168.64.X
```

`youruser` を作成したアカウントに置き換え、IP を VM の IP に置き換えてください。

---

## 6) OpenClaw をインストールする

VM 内で:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

オンボーディングのプロンプトに従って、モデルプロバイダー（Anthropic、OpenAI など）を設定します。

---

## 7) チャンネルを設定する

設定ファイルを編集します。

```bash
nano ~/.openclaw/openclaw.json
```

チャンネルを追加します。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

次に WhatsApp にログインします（QR をスキャン）。

```bash
openclaw channels login
```

---

## 8) VM をヘッドレスで実行する

VM を停止し、表示なしで再起動します。

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM はバックグラウンドで実行されます。OpenClaw のデーモンが Gateway を実行し続けます。

ステータスを確認するには:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## ボーナス: iMessage 連携

これは macOS 上で実行する最大の利点です。[BlueBubbles](https://bluebubbles.app) を使用して、OpenClaw に iMessage を追加します。

VM 内で:

1. bluebubbles.app から BlueBubbles をダウンロードする
2. Apple ID でサインインする
3. Web API を有効にし、パスワードを設定する
4. BlueBubbles の Webhook を Gateway に向ける（例: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）

OpenClaw 設定に追加します。

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Gateway を再起動します。これでエージェントは iMessage を送受信できます。

完全な設定の詳細: [BlueBubbles チャンネル](/ja-JP/channels/bluebubbles)

---

## ゴールデンイメージを保存する

さらにカスタマイズする前に、クリーンな状態のスナップショットを作成します。

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

いつでもリセットできます。

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24 時間 365 日実行する

次の方法で VM を実行し続けます。

- Mac を電源に接続したままにする
- システム設定 → 省エネルギーでスリープを無効にする
- 必要に応じて `caffeinate` を使用する

真の常時稼働には、専用の Mac mini または小規模な VPS を検討してください。[VPS ホスティング](/ja-JP/vps) を参照してください。

---

## トラブルシューティング

| 問題                  | 解決策                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| VM に SSH できない        | VM のシステム設定で「リモートログイン」が有効になっていることを確認する                            |
| VM IP が表示されない        | VM が完全に起動するまで待ち、`lume get openclaw` をもう一度実行する                           |
| Lume コマンドが見つからない   | `~/.local/bin` を PATH に追加する                                                    |
| WhatsApp QR をスキャンできない | `openclaw channels login` を実行するときに、ホストではなく VM にログインしていることを確認する |

---

## 関連ドキュメント

- [VPS ホスティング](/ja-JP/vps)
- [Node](/ja-JP/nodes)
- [Gateway リモート](/ja-JP/gateway/remote)
- [BlueBubbles チャンネル](/ja-JP/channels/bluebubbles)
- [Lume クイックスタート](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI リファレンス](https://cua.ai/docs/lume/reference/cli-reference)
- [無人 VM セットアップ](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（高度）
- [Docker サンドボックス化](/ja-JP/install/docker)（代替の分離アプローチ）

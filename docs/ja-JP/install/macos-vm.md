---
read_when:
    - OpenClawをメインのmacOS環境から分離したい場合
    - サンドボックスで iMessage 連携を使用したい
    - クローン可能でリセットできる macOS 環境が必要な場合
    - ローカルとホスト型の macOS VM オプションを比較したい
summary: 隔離または iMessage が必要な場合は、サンドボックス化された macOS VM（ローカルまたはホスト型）で OpenClaw を実行します。
title: macOS VM
x-i18n:
    generated_at: "2026-07-05T11:32:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## 推奨デフォルト（ほとんどのユーザー）

- 常時稼働の Gateway と低コストには **小規模な Linux VPS**。詳しくは [VPS ホスティング](/ja-JP/vps) を参照してください。
- ブラウザー自動化に完全な制御と **住宅用 IP** が必要な場合は、**専用ハードウェア**（Mac mini または Linux マシン）。多くのサイトはデータセンター IP をブロックするため、ローカルでのブラウジングのほうがうまく動作することがよくあります。
- **ハイブリッド**: Gateway は安価な VPS に置き、ブラウザー/UI 自動化が必要なときに Mac を **ノード** として接続します。[ノード](/ja-JP/nodes) と [Gateway リモート](/ja-JP/gateway/remote) を参照してください。

iMessage など macOS 専用の機能が特に必要な場合、または普段使いの Mac から厳密に隔離したい場合にのみ、macOS VM を使用してください。

## macOS VM の選択肢

### Apple Silicon Mac 上のローカル VM（Lume）

[Lume](https://cua.ai/docs/lume) を使って、既存の Apple Silicon Mac 上のサンドボックス化された macOS VM で OpenClaw を実行します。これにより、次が得られます。

- 隔離された完全な macOS 環境（ホストはクリーンなまま）
- `imsg` による iMessage サポート。デフォルトのローカルパスは Linux/Windows では不可能
- VM のクローンによる即時リセット
- 追加のハードウェア費用やクラウド費用なし

### ホステッド Mac プロバイダー（クラウド）

クラウド上で macOS を使いたい場合は、ホステッド Mac プロバイダーも利用できます。

- [MacStadium](https://www.macstadium.com/)（ホステッド Mac）
- 他のホステッド Mac ベンダーも利用可能です。それぞれの VM + SSH ドキュメントに従ってください。

macOS VM への SSH アクセスを取得したら、下の [OpenClaw をインストール](#6-install-openclaw) に進みます。

## クイックパス（Lume、経験者向け）

1. Lume をインストールします。
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant を完了し、Remote Login（SSH）を有効にします。
4. `lume run openclaw --no-display`
5. SSH で入り、OpenClaw をインストールし、チャンネルを設定します。
6. 完了です。

## 必要なもの（Lume）

- Apple Silicon Mac（M1/M2/M3/M4）
- ホスト上の macOS Sequoia 以降
- VM ごとに約 60 GB の空きディスク容量
- 約 20 分

## 1) Lume をインストール

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin` が PATH に含まれていない場合:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

確認:

```bash
lume --version
```

ドキュメント: [Lume のインストール](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) macOS VM を作成

```bash
lume create openclaw --os macos --ipsw latest
```

これにより macOS がダウンロードされ、VM が作成されます。VNC ウィンドウが自動的に開きます。

<Note>
ダウンロードには、接続環境によって時間がかかる場合があります。
</Note>

## 3) Setup Assistant を完了

VNC ウィンドウで:

1. 言語と地域を選択します。
2. Apple ID をスキップします（後で iMessage を使いたい場合はサインインします）。
3. ユーザーアカウントを作成します（ユーザー名とパスワードを覚えておきます）。
4. すべての任意機能をスキップします。

セットアップが完了したら:

1. SSH を有効にします: System Settings -> General -> Sharing で、"Remote Login" を有効にします。
2. ヘッドレス VM として使う場合は、自動ログインを有効にします: System Settings -> Users & Groups で "Automatically log in as:" を選択し、VM ユーザーを選びます。

## 4) VM の IP アドレスを取得

```bash
lume get openclaw
```

IP アドレス（通常は `192.168.64.x`）を探します。

## 5) VM に SSH 接続

```bash
ssh youruser@192.168.64.X
```

`youruser` を作成したアカウントに、IP を VM の IP に置き換えます。

## 6) OpenClaw をインストール

VM 内で:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

オンボーディングのプロンプトに従って、モデルプロバイダー（Anthropic、OpenAI など）を設定します。

## 7) チャンネルを設定

設定ファイルを編集します。

```bash
nano ~/.openclaw/openclaw.json
```

チャンネルを追加します。

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

次に WhatsApp にログインします（QR をスキャン）。

```bash
openclaw channels login
```

## 8) VM をヘッドレスで実行

VM を停止し、ディスプレイなしで再起動します。

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM はバックグラウンドで実行されます。OpenClaw のデーモンが gateway を稼働させ続けます。状態を確認するには:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## ボーナス: iMessage 連携

これは macOS で実行する最大の強みです。[iMessage](/ja-JP/channels/imessage) と `imsg` を使って、Messages を OpenClaw に追加します。

VM 内で:

1. Messages にサインインします。
2. `imsg` をインストールします。
3. OpenClaw/`imsg` を実行しているプロセスに、Full Disk Access と Automation の権限を付与します。
4. `imsg rpc --help` で RPC サポートを確認します。

OpenClaw 設定に追加します。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

gateway を再起動します。これでエージェントは iMessages を送受信できます。セットアップの完全な詳細: [iMessage チャンネル](/ja-JP/channels/imessage)。

## ゴールデンイメージを保存

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

## 24/7 実行

次の方法で VM を実行し続けます。

- Mac を電源に接続したままにする
- System Settings -> Energy Saver でスリープを無効にする
- 必要に応じて `caffeinate` を使用する

真の常時稼働には、専用の Mac mini または小規模な VPS を検討してください。[VPS ホスティング](/ja-JP/vps) を参照してください。

## トラブルシューティング

| 問題                     | 解決策                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------- |
| VM に SSH 接続できない   | VM の System Settings で "Remote Login" が有効になっていることを確認する            |
| VM の IP が表示されない  | VM が完全に起動するまで待ち、`lume get openclaw` を再実行する                       |
| Lume コマンドが見つからない | `~/.local/bin` を PATH に追加する                                                   |
| WhatsApp QR をスキャンできない | `openclaw channels login` の実行時に、（ホストではなく）VM にログインしていることを確認する |

## 関連ドキュメント

- [VPS ホスティング](/ja-JP/vps)
- [ノード](/ja-JP/nodes)
- [Gateway リモート](/ja-JP/gateway/remote)
- [iMessage チャンネル](/ja-JP/channels/imessage)
- [Lume クイックスタート](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI リファレンス](https://cua.ai/docs/lume/reference/cli-reference)
- [無人 VM セットアップ](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（上級者向け）
- [Docker サンドボックス化](/ja-JP/install/docker)（代替の隔離アプローチ）

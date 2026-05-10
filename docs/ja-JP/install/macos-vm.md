---
read_when:
    - OpenClaw をメインの macOS 環境から分離したい場合
    - サンドボックスで iMessage 連携を使いたい場合
    - クローンできるリセット可能なmacOS環境が必要な場合
    - ローカルとホスト型の macOS VM オプションを比較したい場合
summary: 隔離またはiMessageが必要な場合は、サンドボックス化されたmacOS VM（ローカルまたはホスト型）でOpenClawを実行します
title: macOS 仮想マシン
x-i18n:
    generated_at: "2026-05-10T19:40:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3502ccaee51261573764440f9e782d2512e9da0332bd15eef3a5c4a83b0c2936
    source_path: install/macos-vm.md
    workflow: 16
---

## 推奨デフォルト（ほとんどのユーザー）

- 常時稼働する Gateway と低コストのための **小型 Linux VPS**。[VPS ホスティング](/ja-JP/vps)を参照してください。
- ブラウザー自動化用に完全な制御と **住宅 IP** が必要な場合は、**専用ハードウェア**（Mac mini または Linux マシン）。多くのサイトはデータセンター IP をブロックするため、ローカルブラウジングのほうがうまく動作することがよくあります。
- **ハイブリッド:** Gateway は安価な VPS に置き、ブラウザー/UI 自動化が必要なときに Mac を **node** として接続します。[Nodes](/ja-JP/nodes) と [Gateway リモート](/ja-JP/gateway/remote)を参照してください。

iMessage など macOS 専用の機能が特に必要な場合、または日常的に使う Mac から厳密に分離したい場合は、macOS VM を使用してください。

## macOS VM の選択肢

### Apple Silicon Mac 上のローカル VM（Lume）

[Lume](https://cua.ai/docs/lume) を使って、既存の Apple Silicon Mac 上のサンドボックス化された macOS VM で OpenClaw を実行します。

これにより、次のものが得られます。

- 分離された完全な macOS 環境（ホストはクリーンなまま）
- `imsg` による iMessage サポート（デフォルトのローカルパスは Linux/Windows では不可能）
- VM のクローンによる即時リセット
- 追加のハードウェア費用やクラウド費用なし

### ホステッド Mac プロバイダー（クラウド）

クラウド上で macOS を使いたい場合は、ホステッド Mac プロバイダーも利用できます。

- [MacStadium](https://www.macstadium.com/)（ホステッド Mac）
- 他のホステッド Mac ベンダーも利用できます。それぞれの VM + SSH ドキュメントに従ってください

macOS VM への SSH アクセスを取得したら、下の手順 6 に進みます。

---

## 簡易手順（Lume、経験者向け）

1. Lume をインストールする
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant を完了し、Remote Login（SSH）を有効にする
4. `lume run openclaw --no-display`
5. SSH で入り、OpenClaw をインストールし、チャンネルを設定する
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

`~/.local/bin` が PATH に含まれていない場合:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

確認:

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
接続状況によっては、ダウンロードに時間がかかる場合があります。
</Note>

---

## 3) Setup Assistant を完了する

VNC ウィンドウで:

1. 言語と地域を選択する
2. Apple ID をスキップする（後で iMessage を使いたい場合はサインインする）
3. ユーザーアカウントを作成する（ユーザー名とパスワードを覚えておく）
4. すべての任意機能をスキップする

セットアップが完了したら、SSH を有効にします。

1. System Settings → General → Sharing を開く
2. 「Remote Login」を有効にする

---

## 4) VM の IP アドレスを取得する

```bash
lume get openclaw
```

IP アドレス（通常は `192.168.64.x`）を探します。

---

## 5) VM に SSH 接続する

```bash
ssh youruser@192.168.64.X
```

`youruser` を作成したアカウントに置き換え、IP を VM の IP に置き換えます。

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

VM はバックグラウンドで実行されます。OpenClaw のデーモンが gateway を稼働し続けます。

状態を確認するには:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## ボーナス: iMessage 統合

これは macOS 上で実行する大きな利点です。[iMessage](/ja-JP/channels/imessage) を `imsg` とともに使って、Messages を OpenClaw に追加します。

VM 内で:

1. Messages にサインインする。
2. `imsg` をインストールする。
3. OpenClaw/`imsg` を実行するプロセスに Full Disk Access と Automation 権限を付与する。
4. `imsg rpc --help` で RPC サポートを確認する。

OpenClaw の設定に追加します。

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

gateway を再起動します。これでエージェントは iMessages を送受信できます。

完全なセットアップ詳細: [iMessage チャンネル](/ja-JP/channels/imessage)

---

## ゴールデンイメージを保存する

さらにカスタマイズする前に、クリーンな状態のスナップショットを取得します。

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

## 24/7 で実行する

次の方法で VM を実行し続けます。

- Mac を電源に接続したままにする
- System Settings → Energy Saver でスリープを無効にする
- 必要に応じて `caffeinate` を使用する

真の常時稼働には、専用の Mac mini または小型 VPS を検討してください。[VPS ホスティング](/ja-JP/vps)を参照してください。

---

## トラブルシューティング

| 問題                     | 解決策                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| VM に SSH 接続できない   | VM の System Settings で「Remote Login」が有効になっていることを確認する           |
| VM の IP が表示されない  | VM が完全に起動するまで待ち、`lume get openclaw` を再度実行する                    |
| Lume コマンドが見つからない | `~/.local/bin` を PATH に追加する                                                |
| WhatsApp QR をスキャンできない | `openclaw channels login` を実行するときに、（ホストではなく）VM にログインしていることを確認する |

---

## 関連ドキュメント

- [VPS ホスティング](/ja-JP/vps)
- [Nodes](/ja-JP/nodes)
- [Gateway リモート](/ja-JP/gateway/remote)
- [iMessage チャンネル](/ja-JP/channels/imessage)
- [Lume クイックスタート](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI リファレンス](https://cua.ai/docs/lume/reference/cli-reference)
- [無人 VM セットアップ](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（高度）
- [Docker サンドボックス化](/ja-JP/install/docker)（代替の分離方法）

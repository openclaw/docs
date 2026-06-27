---
read_when:
    - OpenClawをメインのmacOS環境から分離したい場合
    - サンドボックスで iMessage 連携を使用したい
    - クローン可能な、リセットできる macOS 環境が必要です
    - ローカルとホスト型の macOS VM オプションを比較したい場合
summary: 分離環境またはiMessageが必要な場合は、サンドボックス化されたmacOS VM（ローカルまたはホスト型）でOpenClawを実行します。
title: macOS 仮想マシン
x-i18n:
    generated_at: "2026-06-27T11:49:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## 推奨デフォルト（ほとんどのユーザー）

- 常時稼働の Gateway と低コストには **小規模な Linux VPS**。詳しくは [VPSホスティング](/ja-JP/vps) を参照してください。
- ブラウザー自動化用に完全な制御と **住宅用 IP** が必要な場合は、**専用ハードウェア**（Mac mini または Linux マシン）。多くのサイトはデータセンター IP をブロックするため、ローカルブラウジングのほうがうまく動作することがよくあります。
- **ハイブリッド:** Gateway は安価な VPS に置き、ブラウザー/UI 自動化が必要なときに Mac を **ノード** として接続します。[ノード](/ja-JP/nodes) と [Gatewayリモート](/ja-JP/gateway/remote) を参照してください。

iMessage など macOS 専用機能が特に必要な場合、または普段使いの Mac から厳密に分離したい場合は、macOS VM を使用してください。

## macOS VM の選択肢

### Apple Silicon Mac 上のローカル VM（Lume）

既存の Apple Silicon Mac で [Lume](https://cua.ai/docs/lume) を使い、サンドボックス化された macOS VM 内で OpenClaw を実行します。

これにより次が得られます。

- 分離された完全な macOS 環境（ホストはクリーンなまま）
- `imsg` 経由の iMessage サポート（デフォルトのローカルパスは Linux/Windows では不可能）
- VM のクローンによる即時リセット
- 追加のハードウェア費用やクラウド費用なし

### ホスト型 Mac プロバイダー（クラウド）

クラウドで macOS を使いたい場合は、ホスト型 Mac プロバイダーも利用できます。

- [MacStadium](https://www.macstadium.com/)（ホスト型 Mac）
- 他のホスト型 Mac ベンダーも利用できます。各社の VM + SSH ドキュメントに従ってください

macOS VM への SSH アクセスを取得したら、下の手順 6 に進みます。

---

## クイックパス（Lume、経験者向け）

1. Lume をインストールする
2. `lume create openclaw --os macos --ipsw latest`
3. セットアップアシスタントを完了し、リモートログイン（SSH）を有効にする
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
接続状況によっては、ダウンロードに時間がかかることがあります。
</Note>

---

## 3) セットアップアシスタントを完了する

VNC ウィンドウで:

1. 言語と地域を選択する
2. Apple ID をスキップする（後で iMessage を使いたい場合はサインインする）
3. ユーザーアカウントを作成する（ユーザー名とパスワードを覚えておく）
4. すべての任意機能をスキップする

セットアップ完了後:

1. SSH を有効にする: システム設定 -> 一般 -> 共有を開き、「リモートログイン」を有効にします。
2. ヘッドレス VM で使用する場合は、自動ログインを有効にする: システム設定 -> ユーザとグループを開き、「自動ログイン:」を選択して VM ユーザーを選びます。

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

オンボーディングのプロンプトに従い、モデルプロバイダー（Anthropic、OpenAI など）を設定します。

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

VM を停止し、ディスプレイなしで再起動します。

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM はバックグラウンドで実行されます。OpenClaw のデーモンが Gateway の実行を維持します。

ステータスを確認するには:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## ボーナス: iMessage 連携

これは macOS 上で実行する最大の利点です。[iMessage](/ja-JP/channels/imessage) と `imsg` を使って、メッセージを OpenClaw に追加します。

VM 内で:

1. メッセージにサインインする。
2. `imsg` をインストールする。
3. OpenClaw/`imsg` を実行しているプロセスに、フルディスクアクセスとオートメーション権限を付与する。
4. `imsg rpc --help` で RPC サポートを確認する。

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

Gateway を再起動します。これでエージェントは iMessage を送受信できます。

完全なセットアップ詳細: [iMessageチャンネル](/ja-JP/channels/imessage)

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

VM を実行し続けるには:

- Mac を電源に接続したままにする
- システム設定 → 省エネルギーでスリープを無効にする
- 必要に応じて `caffeinate` を使う

真の常時稼働には、専用の Mac mini または小規模 VPS を検討してください。[VPSホスティング](/ja-JP/vps) を参照してください。

---

## トラブルシューティング

| 問題                     | 解決策                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| VM に SSH 接続できない   | VM のシステム設定で「リモートログイン」が有効になっていることを確認する           |
| VM の IP が表示されない  | VM が完全に起動するまで待ち、`lume get openclaw` を再度実行する                   |
| Lume コマンドが見つからない | `~/.local/bin` を PATH に追加する                                                   |
| WhatsApp QR をスキャンできない | `openclaw channels login` を実行するときに、ホストではなく VM にログインしていることを確認する |

---

## 関連ドキュメント

- [VPSホスティング](/ja-JP/vps)
- [ノード](/ja-JP/nodes)
- [Gatewayリモート](/ja-JP/gateway/remote)
- [iMessageチャンネル](/ja-JP/channels/imessage)
- [Lume クイックスタート](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI リファレンス](https://cua.ai/docs/lume/reference/cli-reference)
- [無人 VM セットアップ](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（高度）
- [Docker サンドボックス化](/ja-JP/install/docker)（代替の分離アプローチ）

---
read_when:
    - OpenClaw で Zalo Personal（非公式）サポートを使用する
    - zalouser plugin を設定または開発しています
summary: 'Zalo Personal Plugin: ネイティブ zca-js による QRログイン + メッセージング（Pluginインストール + チャンネル設定 + ツール）'
title: Zalo 個人用Plugin
x-i18n:
    generated_at: "2026-07-05T11:42:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

ネイティブの `zca-js` を使用して通常の Zalo ユーザーアカウントを自動化する Plugin による、OpenClaw の Zalo Personal サポート。外部の `zca`/`openzca` CLI バイナリは不要です。

<Warning>
非公式の自動化は、アカウントの停止または禁止につながる可能性があります。自己責任で使用してください。
</Warning>

## 命名

Channel id は `zalouser` です。これは **個人の Zalo ユーザーアカウント** (非公式) を自動化することを明示するためです。別の `zalo` channel id は、公式のバンドル済み Zalo Bot/webhook 連携です。[Zalo](/ja-JP/channels/zalo) を参照してください。

## 実行場所

この Plugin は **Gateway プロセス内** で実行されます。リモート Gateway の場合は、そのホストにインストール/設定してから Gateway を再起動してください。

## インストール

### npm から

```bash
openclaw plugins install @openclaw/zalouser
```

現在の公式リリースタグに追従するには、裸のパッケージを使用してください。再現可能なインストールが必要な場合にのみ、正確なバージョンに固定してください。その後、Gateway を再起動してください。

### ローカルフォルダーから (開発)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

その後、Gateway を再起動してください。

## 設定

Channel config は `channels.zalouser` 配下にあります (`plugins.entries.*` ではありません)。

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

DM/グループのアクセス制御、マルチアカウント設定、環境変数、トラブルシューティングについては、[Zalo personal channel config](/ja-JP/channels/zalouser) を参照してください。

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## エージェントツール

ツール名: `zalouser`

アクション: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Channel メッセージアクション (エージェントツールではありません) は、メッセージリアクション用の `react` もサポートします。

## 関連

- [Zalo personal channel config](/ja-JP/channels/zalouser)
- [Zalo (公式 Bot/webhook channel)](/ja-JP/channels/zalo)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [ClawHub](/clawhub)

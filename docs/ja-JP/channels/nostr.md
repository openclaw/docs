---
read_when:
    - OpenClawでNostr経由のDMを受信したい場合
    - 分散型メッセージングをセットアップしている場合
summary: NIP-04で暗号化されたメッセージによるNostr DMチャネル
title: Nostr
x-i18n:
    generated_at: "2026-04-24T04:46:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**ステータス:** オプションのバンドルPlugin（設定されるまでデフォルトでは無効）。

Nostrは、ソーシャルネットワーキング向けの分散型プロトコルです。このチャネルにより、OpenClawはNIP-04経由で暗号化されたダイレクトメッセージ（DM）を受信し、応答できます。

## バンドルPlugin

現在のOpenClawリリースでは、NostrはバンドルPluginとして同梱されているため、通常のパッケージビルドでは別途インストールは不要です。

### 古い/カスタムインストール

- オンボーディング（`openclaw onboard`）と`openclaw channels add`では、共有チャネルカタログから引き続きNostrが表示されます。
- ビルドにバンドルされたNostrが含まれていない場合は、手動でインストールしてください。

```bash
openclaw plugins install @openclaw/nostr
```

ローカルチェックアウトを使用する場合（開発ワークフロー）:

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Pluginをインストールまたは有効化した後は、Gatewayを再起動してください。

### 非対話セットアップ

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

キーを設定に保存せず、環境変数内の`NOSTR_PRIVATE_KEY`を使い続けるには、`--use-env`を使用してください。

## クイックセットアップ

1. Nostrキーペアを生成します（必要な場合）。

```bash
# nak を使用
nak key generate
```

2. 設定に追加します。

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. キーをexportします。

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gatewayを再起動します。

## 設定リファレンス

| キー | 型 | デフォルト | 説明 |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | 必須 | `nsec`またはhex形式の秘密鍵 |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URL（WebSocket） |
| `dmPolicy`   | string   | `pairing` | DMアクセスポリシー |
| `allowFrom`  | string[] | `[]` | 許可された送信者のpubkey |
| `enabled`    | boolean  | `true` | チャネルの有効/無効 |
| `name`       | string   | - | 表示名 |
| `profile`    | object   | - | NIP-01プロファイルメタデータ |

## プロファイルメタデータ

プロファイルデータは、NIP-01の`kind:0`イベントとして公開されます。Control UI（Channels -> Nostr -> Profile）から管理するか、設定で直接指定できます。

例:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

注意:

- プロファイルURLは`https://`を使用する必要があります。
- Relayからのインポートではフィールドがマージされ、ローカルの上書きが保持されます。

## アクセス制御

### DMポリシー

- **pairing**（デフォルト）: 未知の送信者にはペアリングコードが返されます。
- **allowlist**: `allowFrom`内のpubkeyだけがDMできます。
- **open**: 公開の受信DM（`allowFrom: ["*"]`が必要）。
- **disabled**: 受信DMを無視します。

強制適用に関する注意:

- 受信イベントの署名は、送信者ポリシーとNIP-04復号の前に検証されるため、偽造イベントは早い段階で拒否されます。
- ペアリング返信は、元のDM本文を処理せずに送信されます。
- 受信DMにはレート制限が適用され、過大なペイロードは復号前に破棄されます。

### 許可リストの例

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## キー形式

受け付ける形式:

- **秘密鍵:** `nsec...` または 64文字のhex
- **pubkey（`allowFrom`）:** `npub...` またはhex

## Relay

デフォルト: `relay.damus.io` と `nos.lol`。

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

ヒント:

- 冗長性のために2～3個のRelayを使用してください。
- Relayを増やしすぎないでください（レイテンシ、重複）。
- 有料Relayは信頼性向上に役立つ場合があります。
- ローカルRelayはテストに適しています（`ws://localhost:7777`）。

## プロトコルサポート

| NIP    | ステータス | 説明 |
| ------ | --------- | ------------------------------------- |
| NIP-01 | サポート済み | 基本イベント形式 + プロファイルメタデータ |
| NIP-04 | サポート済み | 暗号化DM（`kind:4`） |
| NIP-17 | 計画中 | Gift-wrapped DM |
| NIP-44 | 計画中 | バージョン付き暗号化 |

## テスト

### ローカルRelay

```bash
# strfry を起動
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 手動テスト

1. ログからボットのpubkey（npub）を確認します。
2. Nostrクライアント（Damus、Amethystなど）を開きます。
3. そのボットのpubkeyにDMを送ります。
4. 応答を確認します。

## トラブルシューティング

### メッセージを受信しない

- 秘密鍵が有効であることを確認してください。
- Relay URLに到達可能で、`wss://`（ローカルでは`ws://`）を使用していることを確認してください。
- `enabled`が`false`ではないことを確認してください。
- Relay接続エラーがないかGatewayログを確認してください。

### 応答を送信しない

- Relayが書き込みを受け付けるか確認してください。
- 外向き接続を確認してください。
- Relayのレート制限に注意してください。

### 重複した応答

- 複数のRelayを使用している場合は想定内です。
- メッセージはイベントIDで重複排除され、最初の配信だけが応答をトリガーします。

## セキュリティ

- 秘密鍵は絶対にコミットしないでください。
- キーには環境変数を使用してください。
- 本番ボットでは`allowlist`を検討してください。
- 署名は送信者ポリシーの前に検証され、送信者ポリシーは復号の前に適用されるため、偽造イベントは早期に拒否され、未知の送信者が完全な暗号処理を強制することはできません。

## 制限事項（MVP）

- ダイレクトメッセージのみ（グループチャットなし）。
- メディア添付なし。
- NIP-04のみ（NIP-17 gift-wrapは計画中）。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
